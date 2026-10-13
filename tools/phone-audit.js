/* 폰 화면 점검: node tools/phone-audit.js [id ...]
   세 화면(아이폰 세로·작은 안드로이드 세로·폰 가로)에서 놀이마다
   - 가로 넘침(가로 스크롤 생김), 화면 밖으로 나간 누를 것, 너무 작은 누를 것(<40px), 화면 아래 잘림
   을 재고 tools/out/phone/<기기>/<id>.png 로 찍음. 결과 요약: tools/out/phone/report.json */
"use strict";
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ONLY = process.argv.slice(2);
const PORT = 8900 + (process.pid % 90);
const VPS = [
  { name: "p390", viewport: { width: 390, height: 844 } },
  { name: "p360", viewport: { width: 360, height: 740 } },
  { name: "l844", viewport: { width: 844, height: 390 } },
];
const S = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "serve.js"), String(PORT)], { stdio: "ignore" });
  await S(500);
  const b = await chromium.launch();
  const report = {};
  await Promise.all(
    VPS.map(async (vp) => {
      const ctx = await b.newContext({ viewport: vp.viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      await ctx.route("https://*.cloudfront.net/**", (r) => r.abort());
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/index.html`);
      await page.waitForFunction(() => window.KP && KP.ready && (KP.gate.unlock(), true), null, { timeout: 20000 });
      await page.evaluate(() => (speechSynthesis.speak = () => {}));
      const dir = path.join(__dirname, "out", "phone", vp.name);
      fs.mkdirSync(dir, { recursive: true });
      const ids = (await page.evaluate(() => KP.ORDER.slice())).filter((i) => !ONLY.length || ONLY.includes(i));
      for (const id of ids) {
        await page.evaluate((id) => { KP.home(); KP.open(id); }, id);
        await S(1100);
        const r = await page.evaluate(() => {
          const W = innerWidth, H = innerHeight, out = [];
          const scr = document.querySelector(".screen.on");
          if (document.documentElement.scrollWidth > W + 1 || (scr && scr.scrollWidth > W + 1)) out.push("가로넘침");
          const stage = scr && scr.querySelector(".stage");
          const sel = "button, .choice, .card, [data-tap], .draggable, .item, input, .key, [class*='key'], [class*='btn']";
          let off = 0, small = 0, smallList = [], offList = [];
          (scr ? [...scr.querySelectorAll(sel)] : []).forEach((e) => {
            const cs = getComputedStyle(e);
            if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return;
            if (e.closest("[hidden], .hide") ) return;
            let p = e, hiddenAnc = false;
            while (p && p !== document.body) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden") { hiddenAnc = true; break; } p = p.parentElement; }
            if (hiddenAnc) return;
            // 스크롤 목록 안의 것·움직이는 놀잇감(풍선·물고기 등 일부러 화면 밖에서 등장)은 제외
            let q = e.parentElement, scroller = false;
            while (q && q !== document.body) { const s = getComputedStyle(q); if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (q.scrollHeight > q.clientHeight + 2 || q.scrollWidth > q.clientWidth + 2)) { scroller = true; break; } q = q.parentElement; }
            if (scroller) return;
            if (e.matches(".bl-b,.fs-c,.cp-b")) return;
            const rc = e.getBoundingClientRect();
            if (rc.width < 2 || rc.height < 2) return;
            const cls = (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName;
            if (rc.right > W + 2 || rc.bottom > H + 2 || rc.left < -2 || rc.top < -2) { off++; offList.push(String(cls).slice(0, 30)); }
            else if (Math.min(rc.width, rc.height) < 40 && (e.tagName === "BUTTON" || e.matches(".choice,.card,[data-tap],.key"))) { small++; smallList.push(String(cls).slice(0, 30) + ":" + Math.round(rc.width) + "x" + Math.round(rc.height)); }
          });
          if (off) out.push("화면밖 " + off + " (" + [...new Set(offList)].slice(0, 4).join(",") + ")");
          if (small) out.push("작은버튼 " + small + " (" + [...new Set(smallList)].slice(0, 4).join(",") + ")");
          if (stage && stage.scrollHeight > stage.clientHeight + 4 && getComputedStyle(stage).overflowY !== "auto") out.push("세로잘림 " + (stage.scrollHeight - stage.clientHeight) + "px");
          return out;
        });
        await page.screenshot({ path: path.join(dir, id + ".png") });
        (report[id] = report[id] || {})[vp.name] = r;
      }
      await ctx.close();
    })
  );
  await b.close();
  srv.kill();
  fs.writeFileSync(path.join(__dirname, "out", "phone", "report.json"), JSON.stringify(report, null, 1));
  let bad = 0;
  for (const [id, v] of Object.entries(report)) {
    const lines = Object.entries(v).filter(([, a]) => a.length).map(([k, a]) => k + ": " + a.join(" / "));
    if (lines.length) { bad++; console.log(id + "\n   " + lines.join("\n   ")); }
  }
  console.log("문제 있는 놀이", bad, "/", Object.keys(report).length);
})();
