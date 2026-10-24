/* =====================================================================
   3D 인형 도안 미리 굽기:  node tools/doll-bake.js   (먼저 node tools/build.js)
   - 앱을 실제 Chromium 으로 열어 js/games/make/doll-bake.js 의 bake() 를 종마다 실행 →
     assets/doll/<종>.bin (정점 UV·영역 정보) · <종>-map.png (부위·칠하기 영역) · <종>-lines.png (도안 선)
   - 앱은 이 파일을 읽기만 함 → 저가 태블릿에서 도안 고르기·[완성] 대기 없음
   - 모델(assets/doll/<종>.glb)이나 종 설정(species)을 바꾸면 다시 실행할 것
===================================================================== */
"use strict";
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PORT = 8700 + (process.pid % 90);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const srv = spawn(process.execPath, [path.join(__dirname, "serve.js"), String(PORT)], { stdio: "ignore" });
  await sleep(500);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("pageerror:", e.message));
    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.waitForFunction(() => window.KP && KP.ready && KP.DOLL && KP.DOLL.encode, null, { timeout: 20000 });
    const ids = await page.evaluate(() => KP.DOLL.ORDER.slice());
    for (const sp of ids) {
      const r = await page.evaluate(async (sp) => {
        const D = KP.DOLL;
        const model = await D.loadGLB("assets/doll/" + sp + ".glb");
        const t0 = performance.now();
        const B = D.bake(model, D.SPECIES[sp], { W: 1024 });
        const ms = Math.round(performance.now() - t0);
        const e = D.encode(B, model);
        const u8 = new Uint8Array(e.bin);
        let s = "";
        for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        return { ms, bin: btoa(s), map: e.mapC.toDataURL("image/png"), lines: e.linesC.toDataURL("image/png"), nReg: B.nReg, stats: B.stats };
      }, sp);
      const dir = path.join(ROOT, "assets", "doll");
      fs.writeFileSync(path.join(dir, sp + ".bin"), Buffer.from(r.bin, "base64"));
      fs.writeFileSync(path.join(dir, sp + "-map.png"), Buffer.from(r.map.split(",")[1], "base64"));
      fs.writeFileSync(path.join(dir, sp + "-lines.png"), Buffer.from(r.lines.split(",")[1], "base64"));
      console.log(sp + ": 굽기 " + r.ms + "ms · 영역 " + r.nReg + " " + JSON.stringify(r.stats));
    }
    // 확인: 새 페이지에서 미리 구운 파일로 읽히는지 (검사값 일치 → B.pre)
    const p2 = await browser.newPage();
    await p2.goto(`http://localhost:${PORT}/index.html?nosw`);
    await p2.waitForFunction(() => window.KP && KP.ready && KP.DOLL, null, { timeout: 20000 });
    const chk = await p2.evaluate(async (ids) => {
      const out = {};
      for (const sp of ids) {
        const t0 = performance.now();
        const { B } = await KP.DOLL.load(sp);
        out[sp] = (B.pre ? "미리 구운 파일" : "직접 굽기(실패)") + " " + Math.round(performance.now() - t0) + "ms";
      }
      return out;
    }, ids);
    console.log("읽기 확인:", JSON.stringify(chk));
    if (Object.values(chk).some((v) => !v.startsWith("미리"))) process.exitCode = 1;
  } finally {
    await browser.close();
    srv.kill();
  }
})();
