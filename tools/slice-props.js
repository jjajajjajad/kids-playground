/* =====================================================================
   점토 소품 시트 자르기 · 배경 줄이기 (Python 없이 node + Playwright 캔버스)

   소품 시트(흰 바탕에 소품이 격자로 놓인 그림) → 소품마다 투명 PNG
     node tools/slice-props.js props <시트.png> <열x행> <이름1,이름2,…> <출력 폴더> [가장 긴 변=256]
     흰 소품(바탕과 색이 비슷)은 이름 끝에 ! → 바탕과 아주 비슷한 칸만 지움 (예: paper!)
     예) node tools/slice-props.js props tools/out/play-clay/hosp-tools.png 5x2 steth,thermo,band,oint,tweez,ice,tissue,teddy,tea,blanket assets/play-clay/hospital
   은색·흰색 소품(숟가락·열쇠·깃털)이 있는 시트 → props2 (바탕 번지기를 '밝기 기울기'로 막아 소품 가장자리를 지킴, 구멍(반지 안) 지움, 아래 그림자 한 번 더 지움)
     node tools/slice-props.js props2 <시트.png> <열x행> <이름들> <출력 폴더> [가장 긴 변=256] [기울기 문턱=3.5]
     예) node tools/slice-props.js props2 tools/out/play-clay/float-props.png 5x3 wood,duck,apple,ball,ice,leaf,feather,melon,stone,spoon,coin,key,bolt,ring,anchor assets/play-clay/floatsink 220
   배경 그림 → 정해진 크기 JPEG
     node tools/slice-props.js bg <그림.png> <출력.jpg> [폭=1600] [높이=900] [품질=0.82]

   흰 바탕 지우기: 칸 테두리에서 시작해 '바탕과 비슷한 밝고 색 없는 칸'만 번지듯 지움(소품 안의 흰 부분은 남김),
   남은 가장자리는 바탕과 다른 정도로 반투명 → 1px 흐림으로 부드럽게. 바탕에 진 옅은 그림자도 지움.
   만든 파일의 시각은 KST 기준 현재 시각(파일 시스템은 UTC 로 보관하지만 같은 순간).
===================================================================== */
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const [mode, ...rest] = process.argv.slice(2);
if (!mode || !["props", "props2", "bg"].includes(mode)) {
  console.log("사용법은 파일 맨 위 설명을 보세요");
  process.exit(1);
}
const dataUrl = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const writeData = (file, url) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  console.log("  →", path.relative(process.cwd(), file), Math.round(fs.statSync(file).size / 1024) + "KB");
};

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.setContent("<html><body></body></html>");
  try {
    if (mode === "bg") {
      const [src, out, W = "1600", H = "900", Q = "0.82"] = rest;
      const url = await page.evaluate(
        async ({ src, W, H, Q }) => {
          const im = new Image();
          im.src = src;
          await im.decode();
          const c = document.createElement("canvas");
          c.width = W;
          c.height = H;
          const g = c.getContext("2d");
          g.imageSmoothingQuality = "high";
          g.drawImage(im, 0, 0, W, H);
          return c.toDataURL("image/jpeg", Q);
        },
        { src: dataUrl(src), W: +W, H: +H, Q: +Q }
      );
      writeData(path.resolve(out), url);
    } else if (mode === "props2") {
      const [src, grid, names, outDir, size = "256", G0 = "3.5"] = rest;
      const [cols, rows] = grid.split("x").map(Number);
      const list = names.split(",");
      if (list.length !== cols * rows) throw new Error("이름 수(" + list.length + ")가 칸 수(" + cols * rows + ")와 달라요");
      const res = await page.evaluate(
      async ({ u, cols, rows, size, g0 }) => {
        const im = new Image();
        im.src = u;
        await im.decode();
        const IW = im.naturalWidth, IH = im.naturalHeight, out = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const x0 = Math.round((c * IW) / cols), y0 = Math.round((r * IH) / rows);
            const w = Math.round(((c + 1) * IW) / cols) - x0, h = Math.round(((r + 1) * IH) / rows) - y0, n = w * h;
            const cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            const g = cv.getContext("2d", { willReadFrequently: true });
            g.drawImage(im, x0, y0, w, h, 0, 0, w, h);
            const id = g.getImageData(0, 0, w, h), d = id.data;
            let br = 0, bg = 0, bb = 0, bn = 0;
            for (let i = 0; i < n; i++) {
              const x = i % w, y = (i / w) | 0;
              if (x > 2 && y > 2 && x < w - 3 && y < h - 3) continue;
              br += d[i * 4]; bg += d[i * 4 + 1]; bb += d[i * 4 + 2]; bn++;
            }
            br /= bn; bg /= bn; bb /= bn;
            const L = new Float32Array(n), diff = new Float32Array(n), sat = new Float32Array(n);
            for (let i = 0; i < n; i++) {
              const R = d[i * 4], G = d[i * 4 + 1], B = d[i * 4 + 2];
              L[i] = 0.3 * R + 0.59 * G + 0.11 * B;
              diff[i] = Math.max(Math.abs(R - br), Math.abs(G - bg), Math.abs(B - bb));
              sat[i] = Math.max(R, G, B) - Math.min(R, G, B);
            }
            // 1px 흐린 밝기 → 기울기
            const Lb = new Float32Array(n);
            for (let y = 0; y < h; y++)
              for (let x = 0; x < w; x++) {
                let s = 0, k = 0;
                for (let dy = -1; dy <= 1; dy++)
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    s += L[ny * w + nx]; k++;
                  }
                Lb[y * w + x] = s / k;
              }
            const grad = new Float32Array(n);
            for (let y = 1; y < h - 1; y++)
              for (let x = 1; x < w - 1; x++) {
                const i = y * w + x;
                grad[i] = Math.max(Math.abs(Lb[i + 1] - Lb[i - 1]), Math.abs(Lb[i + w] - Lb[i - w])) / 2;
              }
            const pass = (i) => diff[i] < 5 || (sat[i] < 22 && L[i] > 140 && grad[i] < g0);
            const bgm = new Uint8Array(n), q = new Int32Array(n);
            let qh = 0, qt = 0;
            for (let i = 0; i < n; i++) {
              const x = i % w, y = (i / w) | 0;
              if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && pass(i)) { bgm[i] = 1; q[qt++] = i; }
            }
            const N4 = [1, -1, w, -w];
            while (qh < qt) {
              const i = q[qh++], x = i % w;
              for (const o of N4) {
                const j = i + o;
                if (j < 0 || j >= n || (o === 1 && x === w - 1) || (o === -1 && x === 0)) continue;
                if (bgm[j] || !pass(j)) continue;
                bgm[j] = 1; q[qt++] = j;
              }
            }
            // 그림자 2차: 소품 아래쪽(세로 55% 아래)에 남은 아주 밝은 무채색 칸은 기울기가 좀 있어도 바탕으로 번짐
            {
              let ty = h, by = 0;
              for (let i = 0; i < n; i++) if (!bgm[i]) { const y = (i / w) | 0; if (y < ty) ty = y; if (y > by) by = y; }
              const yc = ty + (by - ty) * 0.55;
              const pass2 = (j) => ((j / w) | 0) > yc && L[j] > 222 && sat[j] < 16 && grad[j] < 10;
              qh = qt = 0;
              for (let i = 0; i < n; i++) if (bgm[i]) q[qt++] = i;
              while (qh < qt) {
                const i = q[qh++], x = i % w;
                for (const o of N4) {
                  const j = i + o;
                  if (j < 0 || j >= n || (o === 1 && x === w - 1) || (o === -1 && x === 0)) continue;
                  if (bgm[j] || !pass2(j)) continue;
                  bgm[j] = 1; q[qt++] = j;
                }
              }
            }
            // 구멍(반지 안쪽 등): 아직 안 닿은 '거의 흰 칸' 덩어리 중 큰 것 → 바탕
            const seen = new Uint8Array(n);
            for (let i = 0; i < n; i++) {
              if (bgm[i] || seen[i] || diff[i] >= 5) continue;
              qh = qt = 0; q[qt++] = i; seen[i] = 1;
              while (qh < qt) {
                const k = q[qh++], x = k % w;
                for (const o of N4) {
                  const j = k + o;
                  if (j < 0 || j >= n || (o === 1 && x === w - 1) || (o === -1 && x === 0)) continue;
                  if (seen[j] || bgm[j] || !(diff[j] < 5 || (sat[j] < 22 && L[j] > 150 && grad[j] < g0))) continue;
                  seen[j] = 1; q[qt++] = j;
                }
              }
              let white = 0;
              for (let t = 0; t < qt; t++) if (diff[q[t]] < 3) white++;
              if (qt > n * 0.004 && white > qt * 0.3) for (let t = 0; t < qt; t++) bgm[q[t]] = 1;
            }
            // 소품 덩어리: 가장 큰 것의 3% 이상만
            const lab = new Int32Array(n).fill(-1), sizes = [];
            for (let i = 0; i < n; i++) {
              if (bgm[i] || lab[i] >= 0) continue;
              const Lb2 = sizes.length;
              qh = qt = 0; q[qt++] = i; lab[i] = Lb2;
              while (qh < qt) {
                const k = q[qh++], x = k % w;
                for (const o of N4) {
                  const j = k + o;
                  if (j < 0 || j >= n || (o === 1 && x === w - 1) || (o === -1 && x === 0)) continue;
                  if (bgm[j] || lab[j] >= 0) continue;
                  lab[j] = Lb2; q[qt++] = j;
                }
              }
              sizes.push(qt);
            }
            const big = Math.max(...sizes);
            const A0 = new Float32Array(n);
            for (let i = 0; i < n; i++) A0[i] = !bgm[i] && sizes[lab[i]] > big * 0.03 ? 1 : 0;
            // 가장자리 부드럽게 (3×3 평균)
            const A2 = new Float32Array(n);
            for (let y = 0; y < h; y++)
              for (let x = 0; x < w; x++) {
                let s = 0, k = 0;
                for (let dy = -1; dy <= 1; dy++)
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    s += A0[ny * w + nx]; k++;
                  }
                const i = y * w + x;
                A2[i] = A0[i] ? s / k : 0;
              }
            let mx0 = w, my0 = h, mx1 = 0, my1 = 0;
            for (let i = 0; i < n; i++) {
              const a = A2[i];
              if (a > 0 && a < 1) for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.max(0, Math.min(255, (d[i * 4 + k] - [br, bg, bb][k] * (1 - a)) / a));
              d[i * 4 + 3] = Math.round(a * 255);
              if (a > 0.05) {
                const x = i % w, y = (i / w) | 0;
                if (x < mx0) mx0 = x; if (x > mx1) mx1 = x; if (y < my0) my0 = y; if (y > my1) my1 = y;
              }
            }
            g.putImageData(id, 0, 0);
            const pad = 4, cw = mx1 - mx0 + 1 + pad * 2, ch = my1 - my0 + 1 + pad * 2;
            const k = Math.min(1, size / Math.max(cw, ch));
            const o = document.createElement("canvas");
            o.width = Math.round(cw * k); o.height = Math.round(ch * k);
            const og = o.getContext("2d");
            og.imageSmoothingQuality = "high";
            og.drawImage(cv, mx0 - pad, my0 - pad, cw, ch, 0, 0, o.width, o.height);
            out.push({ url: o.toDataURL("image/png"), w: o.width, h: o.height, parts: sizes.filter((s) => s > big * 0.03).length });
          }
        return out;
      },
        { u: dataUrl(src), cols, rows, size: +size, g0: +G0 }
      );
      res.forEach((r, i) => {
        console.log(list[i], r.w + "×" + r.h, "조각", r.parts);
        writeData(path.resolve(outDir, list[i] + ".png"), r.url);
      });
    } else {
      const [src, grid, names, outDir, size = "256"] = rest;
      const [cols, rows] = grid.split("x").map(Number);
      const list = names.split(",");
      if (list.length !== cols * rows) throw new Error("이름 수(" + list.length + ")가 칸 수(" + cols * rows + ")와 달라요");
      const res = await page.evaluate(
        async ({ src, cols, rows, size, strict }) => {
          const im = new Image();
          im.src = src;
          await im.decode();
          const IW = im.naturalWidth, IH = im.naturalHeight;
          const out = [];
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
              const tight = strict[r * cols + c]; // 흰 소품(휴지·흰 손잡이): 바탕과 아주 비슷한 칸만 지움
              const x0 = Math.round((c * IW) / cols), y0 = Math.round((r * IH) / rows);
              const w = Math.round(((c + 1) * IW) / cols) - x0, h = Math.round(((r + 1) * IH) / rows) - y0;
              const cv = document.createElement("canvas");
              cv.width = w;
              cv.height = h;
              const g = cv.getContext("2d", { willReadFrequently: true });
              g.drawImage(im, x0, y0, w, h, 0, 0, w, h);
              const id = g.getImageData(0, 0, w, h), d = id.data, n = w * h;
              // 바탕색: 테두리 칸들의 평균
              let br = 0, bg = 0, bb = 0, bn = 0;
              for (let i = 0; i < n; i++) {
                const x = i % w, y = (i / w) | 0;
                if (x > 2 && y > 2 && x < w - 3 && y < h - 3) continue;
                br += d[i * 4]; bg += d[i * 4 + 1]; bb += d[i * 4 + 2]; bn++;
              }
              br /= bn; bg /= bn; bb /= bn;
              // 바탕과 다른 정도(diff) · 그림자 같은 칸(밝은 회색, 색 거의 없음)
              const diff = new Float32Array(n), shade = new Uint8Array(n);
              for (let i = 0; i < n; i++) {
                const R = d[i * 4], G = d[i * 4 + 1], B = d[i * 4 + 2];
                diff[i] = Math.max(Math.abs(R - br), Math.abs(G - bg), Math.abs(B - bb));
                const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
                shade[i] = mx - mn < 14 && mn > 170 ? 1 : 0; // 옅은 회색 그림자
                if (mx - mn < 24 && mn > 175) shade[i] |= 2; // 밝고 색 없는 칸 (테두리 깎기 후보)
              }
              // 테두리에서 번지기: 바탕과 비슷(diff<22) 또는 옅은 그림자
              const bgm = new Uint8Array(n), q = new Int32Array(n);
              let qh = 0, qt = 0;
              const pass = tight ? (i) => diff[i] < 7 : (i) => diff[i] < 22 || shade[i] & 1;
              for (let i = 0; i < n; i++) {
                const x = i % w, y = (i / w) | 0;
                if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && pass(i)) {
                  bgm[i] = 1;
                  q[qt++] = i;
                }
              }
              while (qh < qt) {
                const i = q[qh++], x = i % w, y = (i / w) | 0;
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                  const nx = x + dx, ny = y + dy;
                  if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                  const j = ny * w + nx;
                  if (bgm[j] || !pass(j)) continue;
                  bgm[j] = 1;
                  q[qt++] = j;
                }
              }
              // 작은 섬(바탕 속 먼지)·작은 구멍 정리: 소품 칸 덩어리 중 가장 큰 것들만 남김
              const lab = new Int32Array(n).fill(-1), sizes = [];
              for (let i = 0; i < n; i++) {
                if (bgm[i] || lab[i] >= 0) continue;
                const L = sizes.length;
                let cnt = 0,
                  edge = false;
                qh = qt = 0;
                q[qt++] = i;
                lab[i] = L;
                while (qh < qt) {
                  const k = q[qh++], x = k % w, y = (k / w) | 0;
                  cnt++;
                  if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true; // 칸 테두리에 닿음 = 옆 칸 소품 조각
                  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    const j = ny * w + nx;
                    if (bgm[j] || lab[j] >= 0) continue;
                    lab[j] = L;
                    q[qt++] = j;
                  }
                }
                sizes.push(edge ? -cnt : cnt);
              }
              const big = Math.max(...sizes.map(Math.abs));
              // 가장 큰 덩어리의 3% 넘는 것만 (김·손잡이 같은 떨어진 조각은 남김), 칸 테두리에 닿은 작은 조각(옆 칸 소품)은 버림
              const keep = sizes.map((s) => Math.abs(s) > big * 0.03 && (s > 0 || -s > big * 0.5));
              // 알파: 소품 = 1, 바탕 = 0 → 1px 깎기(바탕에 남은 옅은 테두리 없앰) → 가장자리는 diff 로 부드럽게
              const A0 = new Uint8Array(n), A = new Float32Array(n);
              for (let i = 0; i < n; i++) A0[i] = !bgm[i] && keep[lab[i]] ? 1 : 0;
              // 바깥 둘레의 밝고 색 없는 칸(바닥 그림자 테두리)은 3겹까지 벗김 — 안쪽 흰 부분은 그대로
              for (let it = 0; it < (tight ? 0 : 3); it++) {
                const rm = [];
                for (let i = 0; i < n; i++) {
                  if (!A0[i] || !(shade[i] & 2)) continue;
                  const x = i % w, y = (i / w) | 0;
                  if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !A0[i - 1] || !A0[i + 1] || !A0[i - w] || !A0[i + w]) rm.push(i);
                }
                rm.forEach((i) => (A0[i] = 0));
              }
              for (let i = 0; i < n; i++) {
                const x = i % w, y = (i / w) | 0;
                A[i] = A0[i] && x > 0 && y > 0 && x < w - 1 && y < h - 1 && A0[i - 1] && A0[i + 1] && A0[i - w] && A0[i + w] ? 1 : 0;
              }
              const A2 = new Float32Array(n);
              for (let i = 0; i < n; i++) {
                const x = i % w, y = (i / w) | 0;
                let s = 0, c2 = 0;
                for (let dy = -1; dy <= 1; dy++)
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    s += A[ny * w + nx];
                    c2++;
                  }
                let a = s / c2;
                if (a > 0 && a < 1) a = Math.min(1, a * 0.6 + Math.min(1, diff[i] / 60) * 0.5);
                A2[i] = a;
              }
              let mx0 = w, my0 = h, mx1 = 0, my1 = 0;
              for (let i = 0; i < n; i++) {
                const a = A2[i];
                // 가장자리 반투명 칸은 바탕(흰색)을 빼서 흰 테두리가 남지 않게
                if (a > 0 && a < 1) for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.max(0, Math.min(255, (d[i * 4 + k] - [br, bg, bb][k] * (1 - a)) / a));
                d[i * 4 + 3] = Math.round(a * 255);
                if (a > 0.05) {
                  const x = i % w, y = (i / w) | 0;
                  if (x < mx0) mx0 = x;
                  if (x > mx1) mx1 = x;
                  if (y < my0) my0 = y;
                  if (y > my1) my1 = y;
                }
              }
              g.putImageData(id, 0, 0);
              const pad = 4, cw = mx1 - mx0 + 1 + pad * 2, ch = my1 - my0 + 1 + pad * 2;
              const k = Math.min(1, size / Math.max(cw, ch));
              const o = document.createElement("canvas");
              o.width = Math.round(cw * k);
              o.height = Math.round(ch * k);
              const og = o.getContext("2d");
              og.imageSmoothingQuality = "high";
              og.drawImage(cv, mx0 - pad, my0 - pad, cw, ch, 0, 0, o.width, o.height);
              out.push({ url: o.toDataURL("image/png"), w: o.width, h: o.height, bgCol: [br, bg, bb].map(Math.round), parts: sizes.filter((s, i) => keep[i]).length });
            }
          return out;
        },
        { src: dataUrl(src), cols, rows, size: +size, strict: list.map((x) => x.endsWith("!")) }
      );
      res.forEach((r, i) => {
        console.log(list[i], r.w + "×" + r.h, "바탕", r.bgCol.join(","), "조각", r.parts);
        writeData(path.resolve(outDir, list[i].replace(/!$/, "") + ".png"), r.url);
      });
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
