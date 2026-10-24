/* =====================================================================
   Clay 2.0 — 그림 한 장을 '통통한 점토 인형'처럼 보이게 하는 미리 계산 (기기에서 1회, 그림마다)
   - 가짜 볼록 노멀맵: 부위 모양 안쪽을 풍선처럼 부풀린 높이(∇²h = −1, 가장자리 0 → √)에서 기울기 계산
     → 앞면은 평평한 판 그대로지만 빛은 가운데가 볼록한 것처럼 받음 (실행 중 추가 계산 = 질감 1장 읽기)
   - 접합부 그림자(AO): 앞에 겹친 부위(머리·귀·앞다리·무늬)의 모양을 흐리게 → 뒤 부위에 부드럽게 어둡게 구움
   - 도안 테두리(안내선): 얇게 + 부위색에 가까운 진한 색. 아이가 그린 크레파스·무늬·눈·입은 그대로
   계산은 작은 격자(가로세로 ≤ 52칸)에서 하고 그림판 해상도로 부드럽게 늘림 → 그림 한 장 수 ms
===================================================================== */
import { INK, drawPiece } from "./art.js";

const hexRgb = (h) => {
  const s = String(h || "#cccccc").replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  return v.map((x) => (Number.isFinite(x) ? x : 204));
};
const rgbHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const mixHex = (a, b, t) => {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A.map((v, i) => v + (B[i] - v) * t));
};

/** 부위 하나의 입체 치수 (geometry 와 굽기가 같은 값을 써야 함)
 *  bs: 둥근 모서리가 바깥으로 나오는 폭, bt: 앞뒤 둥근 두께, off: 앞면 = 모양 + off (테두리 바깥 일부를 둥근 모서리가 덮음) */
export function bevel2(pc) {
  const bw = pc.bb.x1 - pc.bb.x0, bh = pc.bb.y1 - pc.bb.y0, md = Math.min(bw, bh);
  const bs = Math.max(0.4, Math.min(3.4, md * 0.17));
  const half = (pc.sh.sw || 0) / 2;
  const shrink = Math.max(0, Math.min(bs * 0.5, 1.2, half - 0.3));
  return { bs, off: Math.max(0, half - shrink), bt: Math.min(pc.th * 0.44, 5.5) };
}
export const EDGE_TILT = 0.85; // 볼록 면 가장자리 기울기(라디안, ≈49°) — 둥근 모서리 노멀이 여기서 이어짐

/* ---------- 작은 도우미 ---------- */
function cv(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
}
/** 조각 모양(채움 + 앞면 테두리 폭)을 그리기 — 변환은 호출하는 쪽 */
function shapeMask(g, pc, strokeW) {
  const sh = pc.sh;
  g.save();
  g.transform(sh.M[0], sh.M[1], sh.M[2], sh.M[3], sh.M[4], sh.M[5]);
  g.fill(sh.path);
  if (strokeW > 0.05) {
    g.lineWidth = strokeW;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke(sh.path);
  }
  g.restore();
}
function boxBlur(a, w, h, r, passes) {
  if (r < 1) return a;
  let src = a, tmp = new Float32Array(a.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      const row = y * w;
      for (let x = -r; x <= r; x++) acc += src[row + Math.max(0, Math.min(w - 1, x))];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = acc / (2 * r + 1);
        acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
      }
    }
    const out = new Float32Array(a.length);
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc / (2 * r + 1);
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    src = out;
  }
  return src;
}
const bil = (A, w, h, x, y) => {
  x = Math.max(0, Math.min(w - 1.001, x));
  y = Math.max(0, Math.min(h - 1.001, y));
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
  return (A[i] * (1 - fx) + A[i + 1] * fx) * (1 - fy) + (A[i + w] * (1 - fx) + A[i + w + 1] * fx) * fy;
};

/* 점토 결: 64×64 이어지는 부드러운 잡음 높이 (한 번만) */
let grainH = null;
function grainField() {
  if (grainH) return grainH;
  const N = 64, small = 16, s = new Float32Array(small * small);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < s.length; i++) s[i] = rnd();
  const h = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const fx = (x / N) * small, fy = (y / N) * small, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const at = (i, j) => s[((j + small) % small) * small + ((i + small) % small)];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      h[y * N + x] = (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
    }
  // 잔 결 섞기
  for (let i = 0; i < h.length; i++) h[i] = h[i] * 0.8 + rnd() * 0.2;
  grainH = { h: boxBlur(h, N, N, 1, 1), N };
  return grainH;
}

/**
 * 그림 한 장 굽기. layout()(앞뒤 깊이·두께) 다음에 불러야 함.
 * @returns {{colorC: HTMLCanvasElement, normalC: HTMLCanvasElement, ms: number}}
 */
export function bakeClay2(art, opt = {}) {
  const t0 = performance.now();
  const AW = art.AW, AH = art.AH, pcs = art.model.pieces;
  const grain = opt.grain == null ? 1 : opt.grain;
  const bulge = opt.bulge || 0.85; // 1 = 반구, 작을수록 납작
  const maxXY = Math.sin(EDGE_TILT);
  const colorC = cv(AW, AH), g = colorC.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 10, 10);
  const nimg = g.createImageData(AW, AH), nd = nimg.data;
  for (let i = 0; i < nd.length; i += 4) {
    nd[i] = 128; nd[i + 1] = 128; nd[i + 2] = 255; nd[i + 3] = 255;
  }
  const maskC = cv(AW, AH), gm = maskC.getContext("2d", { willReadFrequently: true });
  const CMAX = 52;
  const coarse = cv(CMAX + 2, CMAX + 2), gc = coarse.getContext("2d", { willReadFrequently: true });
  const GF = grainField();
  const gAmp = [0, 0.05, 0.1][grain] || 0;

  pcs.forEach((pc, i) => {
    const r = art.regs[i];
    if (!r) return;
    const side = pc.side || "#cccccc";
    // 1) 색: 바탕 = 부위색을 조금 어둡게 (테두리 바깥이 보여도 검은 띠가 아니게), 안내선 = 얇고 부드러운 색
    g.save();
    g.beginPath();
    g.rect(r.x, r.y, r.w, r.h);
    g.clip();
    g.fillStyle = pc.kind === "part" ? mixHex(side, INK, 0.28) : pc.kind === "tube" ? INK : side;
    g.fillRect(r.x, r.y, r.w, r.h);
    g.setTransform(r.s, 0, 0, r.s, r.x - r.ox * r.s, r.y - r.oy * r.s);
    drawPiece(g, pc, art, "all", pc.kind === "part" ? { w: 0.52, col: mixHex(INK, side, 0.36) } : null);
    g.restore();
    if (pc.kind !== "part" && pc.kind !== "mini") return;

    // 2) 작은 격자에서 모양·부풀린 높이·접합부 그림자
    const k = Math.min(1, CMAX / Math.max(r.w, r.h));
    const cw = Math.max(4, Math.ceil(r.w * k)), ch = Math.max(4, Math.ceil(r.h * k));
    const cs = r.s * k; // 도안 1단위 → 작은 격자 칸
    const off = pc.c2 ? pc.c2.off : (pc.sh.sw || 0) / 2;
    gc.setTransform(1, 0, 0, 1, 0, 0);
    gc.clearRect(0, 0, coarse.width, coarse.height);
    gc.setTransform(cs, 0, 0, cs, -r.ox * cs, -r.oy * cs);
    gc.fillStyle = gc.strokeStyle = "#000";
    shapeMask(gc, pc, off * 2);
    let d = gc.getImageData(0, 0, cw, ch).data;
    const M = new Uint8Array(cw * ch);
    for (let j = 0; j < cw * ch; j++) M[j] = d[j * 4 + 3] > 110 ? 1 : 0;
    for (let x = 0; x < cw; x++) M[x] = M[(ch - 1) * cw + x] = 0;
    for (let y = 0; y < ch; y++) M[y * cw] = M[y * cw + cw - 1] = 0;
    // 풍선 높이: ∇²φ = −1 (가장자리 0), 과완화 반복
    const phi = new Float32Array(cw * ch);
    const iters = 30 + 2 * Math.max(cw, ch), w = 1.88;
    for (let it = 0; it < iters; it++)
      for (let y = 1; y < ch - 1; y++)
        for (let x = 1; x < cw - 1; x++) {
          const j = y * cw + x;
          if (!M[j]) continue;
          const v = (phi[j - 1] + phi[j + 1] + phi[j - cw] + phi[j + cw] + 1) * 0.25;
          phi[j] += w * (v - phi[j]);
        }
    const hgt = new Float32Array(cw * ch);
    for (let j = 0; j < hgt.length; j++) hgt[j] = M[j] ? 2 * Math.sqrt(Math.max(0, phi[j])) * bulge : 0;
    // 기울기 → 노멀(xy). 바깥 칸은 안쪽 값으로 채워 경계를 부드럽게
    const NX = new Float32Array(cw * ch), NY = new Float32Array(cw * ch), has = new Uint8Array(cw * ch);
    for (let y = 1; y < ch - 1; y++)
      for (let x = 1; x < cw - 1; x++) {
        const j = y * cw + x;
        if (!M[j]) continue;
        const dx = (hgt[j + 1] - hgt[j - 1]) / 2, dy = (hgt[j + cw] - hgt[j - cw]) / 2;
        let nx = -dx, ny = dy; // y: 그림판 아래 = 화면 아래 → 위쪽(+v) 성분은 +dh/dy(아래)
        const l = Math.hypot(nx, ny, 1);
        nx /= l; ny /= l;
        const q = Math.hypot(nx, ny);
        if (q > maxXY) {
          nx *= maxXY / q;
          ny *= maxXY / q;
        }
        NX[j] = nx; NY[j] = ny; has[j] = 1;
      }
    for (let pass = 0; pass < 3; pass++) {
      const add = [];
      for (let y = 0; y < ch; y++)
        for (let x = 0; x < cw; x++) {
          const j = y * cw + x;
          if (has[j]) continue;
          let sx = 0, sy = 0, c = 0;
          for (const o of [-1, 1, -cw, cw]) {
            const q = j + o;
            if (q < 0 || q >= cw * ch || (o === -1 && x === 0) || (o === 1 && x === cw - 1)) continue;
            if (has[q]) {
              sx += NX[q]; sy += NY[q]; c++;
            }
          }
          if (c) add.push([j, sx / c, sy / c]);
        }
      for (const [j, a, b] of add) {
        NX[j] = a; NY[j] = b; has[j] = 1;
      }
    }
    // 접합부 그림자: 이 부위보다 앞에 있고 겹치는 부위들의 모양 (두께 비례 진하기)
    gc.setTransform(1, 0, 0, 1, 0, 0);
    gc.clearRect(0, 0, coarse.width, coarse.height);
    gc.setTransform(cs, 0, 0, cs, -r.ox * cs, -r.oy * cs);
    let anyOcc = false;
    for (const q of pcs) {
      if (q === pc || (q.kind !== "part" && q.kind !== "mini") || q.front <= pc.front + 0.2) continue;
      const b = q.bb, a = pc.bb;
      if (!(b.x0 < a.x1 + 4 && a.x0 < b.x1 + 4 && b.y0 < a.y1 + 4 && a.y0 < b.y1 + 4)) continue;
      gc.globalAlpha = Math.min(1, 0.25 + q.th / 14);
      shapeMask(gc, q, q.sh.sw || 0);
      anyOcc = true;
    }
    gc.globalAlpha = 1;
    let AO = null;
    if (anyOcc) {
      d = gc.getImageData(0, 0, cw, ch).data;
      const occ = new Float32Array(cw * ch);
      for (let j = 0; j < occ.length; j++) occ[j] = d[j * 4 + 3] / 255;
      AO = boxBlur(occ, cw, ch, Math.max(1, Math.round(6 * cs)), 3);
    }

    // 3) 그림판 해상도로: 앞면 모양 안에서만 노멀·그림자 적기
    gm.setTransform(1, 0, 0, 1, 0, 0);
    gm.clearRect(r.x, r.y, r.w, r.h);
    gm.save();
    gm.beginPath();
    gm.rect(r.x, r.y, r.w, r.h);
    gm.clip();
    gm.setTransform(r.s, 0, 0, r.s, r.x - r.ox * r.s, r.y - r.oy * r.s);
    gm.fillStyle = gm.strokeStyle = "#000";
    shapeMask(gm, pc, off * 2 + 1.5); // 조금 넉넉히 (가장자리 거르기 여유)
    gm.restore();
    const md = gm.getImageData(r.x, r.y, r.w, r.h).data;
    const cimg = g.getImageData(r.x, r.y, r.w, r.h), cd = cimg.data;
    for (let py = 0; py < r.h; py++)
      for (let px = 0; px < r.w; px++) {
        const li = (py * r.w + px) * 4;
        if (md[li + 3] < 8) continue;
        const fx = (px + 0.5) * k - 0.5, fy = (py + 0.5) * k - 0.5;
        let nx = bil(NX, cw, ch, fx, fy), ny = bil(NY, cw, ch, fx, fy);
        if (gAmp) {
          const gx = (r.x + px) * 0.5, gy = (r.y + py) * 0.5, N = GF.N;
          const x0 = ((gx | 0) % N + N) % N, y0 = ((gy | 0) % N + N) % N;
          const hx = GF.h[y0 * N + ((x0 + 1) % N)] - GF.h[y0 * N + ((x0 + N - 1) % N)];
          const hy = GF.h[((y0 + 1) % N) * N + x0] - GF.h[((y0 + N - 1) % N) * N + x0];
          nx -= hx * gAmp * 3;
          ny += hy * gAmp * 3;
        }
        const q = Math.hypot(nx, ny);
        if (q > 0.92) {
          nx *= 0.92 / q;
          ny *= 0.92 / q;
        }
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const ai = ((r.y + py) * AW + r.x + px) * 4;
        nd[ai] = (nx * 0.5 + 0.5) * 255;
        nd[ai + 1] = (ny * 0.5 + 0.5) * 255;
        nd[ai + 2] = (nz * 0.5 + 0.5) * 255;
        if (AO) {
          const o = Math.min(1, bil(AO, cw, ch, fx, fy) * 1.15);
          const s = 1 - 0.62 * o;
          // 그림자는 살짝 보랏빛 (점토 사진의 그림자 색)
          cd[li] *= s * 0.97 + 0.03 * (1 - o);
          cd[li + 1] *= s;
          cd[li + 2] *= Math.min(1, s * 1.06);
        }
      }
    if (AO) g.putImageData(cimg, r.x, r.y);
  });
  const normalC = cv(AW, AH);
  normalC.getContext("2d").putImageData(nimg, 0, 0);
  return { colorC, normalC, ms: performance.now() - t0 };
}
