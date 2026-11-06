/* =====================================================================
   홈 아이콘 미리 굽기 (tools/build.js 가 부름):  assets/e/<슬러그>.svg → assets/ep/<슬러그>.webp (192px)
   - 홈 화면의 놀이 카드·탭·버튼 아이콘은 SVG(흐림 효과·그라데이션 수십 개)를 켤 때마다 그리는 비용이 커서
     미리 구운 그림을 씀 (2026-11-06 측정: 홈 첫 그리기 약 -150ms, 저가 태블릿은 더 큼).
   - 바뀐 SVG 만 다시 굽고(assets/ep/index.json 에 지문 보관), 목록에서 빠진 것은 지움.
   - 사용: node tools/render-icons.js <슬러그 목록 JSON 파일>   → 결과 JSON 을 표준 출력
   - Playwright 가 없으면 아무것도 안 하고 {skipped:true} 를 출력 (앱은 SVG 로 그대로 동작)
===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets", "e");
const OUT = path.join(ROOT, "assets", "ep");
const SIZE = 192; // 홈에서 가장 큰 아이콘(마스코트 88px·카드 74px)의 2배 해상도를 덮음. 큰 카드(hero)는 SVG 그대로
const Q = 0.92;
const slugs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (e) {
  process.stdout.write(JSON.stringify({ skipped: true, reason: "playwright 없음" }));
  process.exit(0);
}
fs.mkdirSync(OUT, { recursive: true });
const idxFile = path.join(OUT, "index.json");
const old = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, "utf8")) : {};
const hash = (b) => crypto.createHash("sha1").update(b).digest("hex").slice(0, 12);
const want = {};
const todo = [];
for (const s of slugs) {
  const f = path.join(SRC, s + ".svg");
  if (!fs.existsSync(f)) continue;
  const h = hash(fs.readFileSync(f));
  want[s] = h;
  if (old[s] !== h || !fs.existsSync(path.join(OUT, s + ".webp"))) todo.push(s);
}
// 목록에서 빠진 것 지우기
for (const f of fs.readdirSync(OUT)) {
  const s = f.replace(/\.webp$/, "");
  if (f.endsWith(".webp") && !want[s]) fs.unlinkSync(path.join(OUT, f));
}
(async () => {
  if (todo.length) {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.setContent("<canvas id=c width=" + SIZE + " height=" + SIZE + "></canvas>");
    for (const s of todo) {
      const svg = fs.readFileSync(path.join(SRC, s + ".svg"), "utf8");
      const url = await p.evaluate(
        ([svg, S, Q]) =>
          new Promise((res, rej) => {
            const im = new Image();
            im.onload = () => {
              const c = document.getElementById("c");
              const g = c.getContext("2d");
              g.clearRect(0, 0, S, S);
              // 비율 유지해 가운데 맞춤 (CSS object-fit: contain 과 같게)
              const k = Math.min(S / im.width, S / im.height);
              const w = im.width * k,
                h = im.height * k;
              g.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
              res(c.toDataURL("image/webp", Q));
            };
            im.onerror = () => rej(new Error("svg 읽기 실패"));
            im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
          }),
        [svg, SIZE, Q]
      );
      fs.writeFileSync(path.join(OUT, s + ".webp"), Buffer.from(url.split(",")[1], "base64"));
    }
    await b.close();
  }
  fs.writeFileSync(idxFile, JSON.stringify(want, null, 0));
  process.stdout.write(JSON.stringify({ total: Object.keys(want).length, rendered: todo.length }));
})().catch((e) => {
  process.stdout.write(JSON.stringify({ skipped: true, reason: String(e.message || e) }));
});
