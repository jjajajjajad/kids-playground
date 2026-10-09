/* =====================================================================
   자동 점검:  npm test  [-- 게임id ...]  [--shots]
   - 로컬 서버를 띄우고 실제 Chromium 으로 앱을 연다 (태블릿 가로 / 폰 세로)
   - 모든 놀이를 열고, 화면 안의 버튼·요소를 무작위로 눌러 본 뒤 오류를 수집
   - --shots : 각 놀이 화면을 tools/out/<기기>/<id>.png 로 저장
===================================================================== */
"use strict";
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const SHOTS = args.includes("--shots");
const ONLY = args.filter((a) => !a.startsWith("--"));
const PORT = 8800 + (process.pid % 900);
const VPS = [
  { name: "tablet", viewport: { width: 1180, height: 820 } },
  { name: "phone", viewport: { width: 390, height: 844 } },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "serve.js"), String(PORT)], { stdio: "ignore" });
  await sleep(500);
  const browser = await chromium.launch();
  let fails = 0;
  try {
    for (const vp of VPS) {
      const ctx = await browser.newContext({ viewport: vp.viewport, hasTouch: true, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errs.push("console: " + m.text());
      });
      await page.goto(`http://localhost:${PORT}/index.html`);
      await page.waitForFunction(() => window.KP && KP.ready, null, { timeout: 15000 });
      await sleep(600);
      const outDir = path.join(__dirname, "out", vp.name);
      if (SHOTS) {
        fs.mkdirSync(outDir, { recursive: true });
        await page.screenshot({ path: path.join(outDir, "_home.png") });
      }
      const ids = await page.evaluate(() => KP.ORDER.slice());
      const list = ONLY.length ? ids.filter((i) => ONLY.includes(i)) : ids;
      for (const id of list) {
        const before = errs.length;
        await page.evaluate((id) => {
          KP.errors.length = 0;
          KP.open(id);
        }, id);
        await sleep(900);
        // 화면 안의 눌러볼 만한 것들을 무작위로 터치
        const pts = await page.evaluate(() => {
          const root = document.querySelector(".screen.on .stage");
          if (!root) return [];
          const els = [...root.querySelectorAll("button, .choice, .card, canvas, svg, [data-tap], .draggable, .item")]
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight;
            });
          return els.slice(0, 40).map((e) => {
            const r = e.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          });
        });
        for (let k = 0; k < Math.min(12, pts.length); k++) {
          const p = pts[Math.floor(Math.random() * pts.length)];
          await page.touchscreen.tap(p.x, p.y).catch(() => {});
          await sleep(120);
        }
        // 끌기 한 번
        if (pts.length) {
          const p = pts[0];
          await page.mouse.move(p.x, p.y);
          await page.mouse.down();
          await page.mouse.move(p.x + 80, p.y - 60, { steps: 6 });
          await page.mouse.up();
        }
        await sleep(500);
        if (SHOTS) await page.screenshot({ path: path.join(outDir, id + ".png") });
        const kpErr = await page.evaluate(() => KP.errors.slice());
        const mine = errs.slice(before).concat(kpErr);
        // 이미지/폰트 404 외의 문제만
        const real = mine.filter((m) => !/favicon/.test(m));
        if (real.length) {
          fails++;
          console.log(`✗ [${vp.name}] ${id}:\n   ` + [...new Set(real)].slice(0, 5).join("\n   "));
        }
        await page.evaluate(() => KP.home());
        await sleep(150);
      }
      console.log(`[${vp.name}] ${list.length}개 놀이 점검 완료`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.kill();
  }
  console.log(fails ? `문제 ${fails}건` : "모든 놀이 오류 없음 ✓");
  process.exit(fails ? 1 : 0);
})();
