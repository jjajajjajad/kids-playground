/* =====================================================================
   인형 굽기 — 3D 모델 하나에서 (1) 정면 투영 UV (2) 색칠 도안 (3) 칠하기용 영역 지도 를 만듦
   - 모든 그림 좌표 = 정면에서 직교 투영한 좌표 (S×S 정사각형). 아이 캔버스 = 도안 = 텍스처.
   - 부위(머리·귀·몸·팔·다리·꼬리)는 종마다 손으로 정한 간단한 규칙(SPEC.part) 으로 나눔.
     같은 규칙으로 ① 도안의 부위 경계선 ② 가려진 면의 UV 고치기 ③ 움직임 가중치 를 모두 만듦.
   - 안 보이는 면 처리:
       뒷면 = 같은 (x,y) 를 그대로 씀 → 앞 그림이 거울처럼 비침 (얼굴 눈코입은 앞면만)
       다른 부위에 가려진 면(귀 밑 머리 옆, 팔 뒤 몸 옆, 꼬리) = 그 부위의 '가장 가까운 보이는 곳' 색
       옆면 늘어짐 = 그림 바깥으로 색 번지기(bleed) + 3D 에서 옆면일수록 흐린 밉맵으로 읽기
===================================================================== */
export const S = 1024; // 도안·텍스처 크기
export const PARTS = ["bg", "head", "earR", "earL", "body", "armR", "armL", "legR", "legL", "tail"];
const P = Object.fromEntries(PARTS.map((n, i) => [n, i]));

/* ---------- 강아지 한 종의 손 설정 (모델 좌표: 키 1, 발바닥 y=0, 정면 +z, 오른쪽 +x) ---------- */
export const DOG = {
  K: 900, CX: S / 2, OY: 966, // 그림 좌표: px = CX + x·K, py = OY − y·K
  part(x, y, z) {
    const ax = Math.abs(x), R = x > 0;
    // 머리: 타원체
    const hy = (y - 0.77) / 0.245, hz = (z + 0.035) / 0.25;
    const hx = 0.25 * Math.sqrt(Math.max(0, 1 - hy * hy - hz * hz)); // 그 높이·깊이에서 머리 겉면의 x
    if (y > 0.57 && y < 0.985 && ax > 0.15 && ax > hx + 0.012 && z > -0.22 && z < 0.26) return R ? P.earR : P.earL;
    const h = (x / 0.25) ** 2 + hy * hy + hz * hz;
    if (y > 0.537 + 1.6 * x * x && h < 1.6) return P.head;
    if (z < -0.185 && y > 0.17 && y < 0.37 && ax < 0.1) return P.tail;
    const T = 0.2 - 0.6 * Math.max(0, y - 0.4);
    if (y > 0.26 && y < 0.53 && ax > T) return R ? P.armR : P.armL;
    if (y < 0.175 - 0.0 * ax) return R ? P.legR : P.legL;
    return P.body;
  },
  // 움직임 중심점
  pivot: { arm: [0.155, 0.47, 0.04], leg: [0.09, 0.17, 0.0], ear: [0.215, 0.93, -0.03], head: [0, 0.53, 0], tail: [0, 0.27, -0.17] },
  // 얼굴 (그림 좌표, 모델의 볼록한 눈·코·입 자리에 맞춤)
  face: {
    eyes: [[-0.104, 0.711], [0.104, 0.711]], eyeR: [0.026, 0.022],
    nose: [0, 0.684], noseW: 0.072, noseH: 0.046,
    mouth: { y: 0.632, w: 0.064, h: 0.022, top: 0.656 },
    toes: [[0.085, 0.0], [0.145, 0.0]], toeH: 0.042, // 발가락 줄 (x, 바닥) — 좌우 대칭
  },
};

/* ---------- 거리 변환 (Felzenszwalb) : 0 인 칸에서의 제곱 거리 ---------- */
function edt1(f, n, d, v, z) {
  let k = 0;
  v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
export function edt(src, w, h) {
  // src: Uint8Array (1 = 출발 칸) → Float32Array 거리
  const INF = 1e12, g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = src[i] ? 0 : INF;
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    edt1(f, h, d, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    edt1(f, w, d, v, z);
    for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]);
  }
  return g;
}
/** 여러 출발점 BFS: seed(칸 → 1) 에서 가장 가까운 출발 칸 번호 (8방향, 근사) */
function nearestSeed(seed, w, h, allow) {
  const near = new Int32Array(w * h).fill(-1), q = new Int32Array(w * h);
  let qh = 0, qt = 0;
  for (let i = 0; i < w * h; i++) if (seed[i]) { near[i] = i; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % w, y = (i / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (near[j] >= 0 || (allow && !allow[j])) continue;
      near[j] = near[i];
      q[qt++] = j;
    }
  }
  return near;
}

/* ---------- 부위 경계 다듬기: 반지름 r 안에서 가장 많은 부위로 (실루엣은 그대로) → 계단 모양 경계를 매끈하게 ---------- */
function smoothLabels(label, W, r) {
  const nL = PARTS.length, best = new Float32Array(W * W), out = label.slice();
  const tmp = new Float32Array(W * W), acc = new Float32Array(W * W);
  for (let L = 1; L < nL; L++) {
    let any = false;
    for (let i = 0; i < W * W; i++) if (label[i] === L) { any = true; break; }
    if (!any) continue;
    // 가로 상자 합
    for (let y = 0; y < W; y++) {
      let s = 0;
      const row = y * W;
      for (let x = -r; x < W; x++) {
        if (x + r < W && label[row + x + r] === L) s++;
        if (x - r - 1 >= 0 && label[row + x - r - 1] === L) s--;
        if (x >= 0) tmp[row + x] = s;
      }
    }
    // 세로 상자 합
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y < W; y++) {
        if (y + r < W) s += tmp[(y + r) * W + x];
        if (y - r - 1 >= 0) s -= tmp[(y - r - 1) * W + x];
        if (y >= 0) acc[y * W + x] = s;
      }
    }
    for (let i = 0; i < W * W; i++) if (label[i] && acc[i] > best[i]) { best[i] = acc[i]; out[i] = L; }
  }
  label.set(out);
}

/* ---------- 정면 직교 래스터: 칸마다 가장 앞(z 최대) 깊이 ---------- */
function rasterFront(pos, idx, spec, W) {
  const k = (spec.K * W) / S, cx = (spec.CX * W) / S, oy = (spec.OY * W) / S;
  const depth = new Float32Array(W * W).fill(-1e9);
  const n = idx.length / 3;
  for (let t = 0; t < n; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const x0 = cx + pos[a] * k, y0 = oy - pos[a + 1] * k, z0 = pos[a + 2];
    const x1 = cx + pos[b] * k, y1 = oy - pos[b + 1] * k, z1 = pos[b + 2];
    const x2 = cx + pos[c] * k, y2 = oy - pos[c + 1] * k, z2 = pos[c + 2];
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-9) continue;
    const minx = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxx = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
    const miny = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxy = Math.min(W - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let py = miny; py <= maxy; py++) {
      const sy = py + 0.5;
      for (let px = minx; px <= maxx; px++) {
        const sx = px + 0.5;
        const w0 = ((x1 - sx) * (y2 - sy) - (x2 - sx) * (y1 - sy)) / area;
        const w1 = ((x2 - sx) * (y0 - sy) - (x0 - sx) * (y2 - sy)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const zz = w0 * z0 + w1 * z1 + w2 * z2, i = py * W + px;
        if (zz > depth[i]) depth[i] = zz;
      }
    }
  }
  return depth;
}

/* ---------- 굽기 본체 ---------- */
export function bake(model, spec = DOG) {
  const t0 = performance.now();
  const pos = model.POSITION, idx = model.index, nv = pos.length / 3;
  const W = S;
  const depth = rasterFront(pos, idx, spec, W);
  // 칸마다 보이는 부위 (꼬리는 앞에서 안 보이므로 몸으로)
  const label = new Uint8Array(W * W);
  for (let py = 0; py < W; py++)
    for (let px = 0; px < W; px++) {
      const i = py * W + px;
      if (depth[i] < -1e8) continue;
      let L = spec.part((px + 0.5 - spec.CX) / spec.K, (spec.OY - py - 0.5) / spec.K, depth[i]);
      if (L === P.tail) L = P.body;
      label[i] = L;
    }
  smoothLabels(label, W, 5);
  // 경계: 바깥(실루엣) / 안쪽(부위 사이)
  const outB = new Uint8Array(W * W), inB = new Uint8Array(W * W);
  for (let y = 0; y < W - 1; y++)
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x, a = label[i];
      for (const j of [i + 1, i + W]) {
        const b = label[j];
        if (a === b) continue;
        if (!a || !b) { outB[a ? i : j] = 1; } else { inB[i] = 1; inB[j] = 1; }
      }
    }
  const dOut = edt(outB, W, W), dIn = edt(inB, W, W);
  // 선 굵기 (도안 칸 기준): 바깥 8, 안쪽 5.5 (반지름 4 / 2.75)
  const LW_OUT = 4.2, LW_IN = 2.9;
  const lineC = document.createElement("canvas");
  lineC.width = lineC.height = W;
  const lg = lineC.getContext("2d");
  const im = lg.createImageData(W, W);
  for (let i = 0; i < W * W; i++) {
    const a = Math.max(Math.min(1, Math.max(0, LW_OUT - dOut[i] + 0.5)), Math.min(1, Math.max(0, LW_IN - dIn[i] + 0.5)));
    if (a <= 0) continue;
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 34;
    im.data[i * 4 + 3] = Math.round(a * 255);
  }
  lg.putImageData(im, 0, 0);
  drawFace(lg, spec, "sheet");
  // 선 지도 (칠하기 막힘)
  const la = lg.getImageData(0, 0, W, W).data;
  const line = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) line[i] = la[i * 4 + 3] > 110 ? 1 : 0;

  // 칠하기 영역: 선이 아닌 칸의 4방향 연결 덩어리 (실루엣 안만)
  const region = new Int32Array(W * W).fill(-1);
  const stack = new Int32Array(W * W);
  let nReg = 0;
  const regPart = [];
  for (let s = 0; s < W * W; s++) {
    if (region[s] >= 0 || line[s] || !label[s]) continue;
    let sp = 0;
    stack[sp++] = s;
    region[s] = nReg;
    const cnt = {};
    while (sp) {
      const i = stack[--sp], x = i % W;
      cnt[label[i]] = (cnt[label[i]] || 0) + 1;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
      for (const j of nb) {
        if (j < 0 || j >= W * W || region[j] >= 0 || line[j] || !label[j]) continue;
        region[j] = nReg;
        stack[sp++] = j;
      }
    }
    regPart.push(+Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]);
    nReg++;
  }
  // 선 칸(실루엣 안·선 위)도 가까운 영역에 붙여 채울 때 같이 칠함 → 3D 에 흰 이음매가 안 생김
  const seedR = new Uint8Array(W * W), allowR = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) { seedR[i] = region[i] >= 0 ? 1 : 0; allowR[i] = region[i] >= 0 || line[i] || label[i] ? 1 : 0; }
  const nr = nearestSeed(seedR, W, W, allowR);
  const fillOf = new Int32Array(W * W).fill(-1);
  for (let i = 0; i < W * W; i++) if (nr[i] >= 0 && (label[i] || line[i])) fillOf[i] = region[nr[i]];
  // 영역별 칸 목록 (CSR)
  const cnt = new Int32Array(nReg + 1);
  for (let i = 0; i < W * W; i++) if (fillOf[i] >= 0) cnt[fillOf[i] + 1]++;
  for (let r = 0; r < nReg; r++) cnt[r + 1] += cnt[r];
  const list = new Int32Array(cnt[nReg]), fillPos = cnt.slice();
  for (let i = 0; i < W * W; i++) if (fillOf[i] >= 0) list[fillPos[fillOf[i]]++] = i;

  // 텍스처 번지기: 실루엣 밖 칸 → 가장 가까운 실루엣 안 칸 (실루엣 가장자리 2칸 안쪽에서 가져옴: 선 자국 피함)
  const inner = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) inner[i] = label[i] && dOut[i] > 2.5 ? 1 : 0;
  const bleed = nearestSeed(inner, W, W, null);

  // 부위별 '가장 가까운 보이는 칸' (반 크기, 선 피해서 4칸 안쪽)
  const H = W / 2, nearPart = {};
  for (let L = 1; L < PARTS.length; L++) {
    const sd = new Uint8Array(H * H);
    let any = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < H; x++) {
      const i = y * 2 * W + x * 2;
      if (label[i] === L && dIn[i] > 5 && dOut[i] > 5) { sd[y * H + x] = 1; any = 1; }
    }
    if (any) nearPart[L] = nearestSeed(sd, H, H, null);
  }

  // 정점마다: 부위, UV, 가중치
  const part = new Uint8Array(nv), uv = new Float32Array(nv * 2), fixed = new Uint8Array(nv);
  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let L = spec.part(x, y, z);
    part[v] = L;
    if (L === P.tail) L = P.body;
    let px = spec.CX + x * spec.K, py = spec.OY - y * spec.K;
    const ix = Math.min(W - 1, Math.max(0, px | 0)), iy = Math.min(W - 1, Math.max(0, py | 0));
    const vis = label[iy * W + ix];
    // 이 정점이 앞에서 보이는 그 부위인가? (같은 부위면 앞·뒤 모두 그대로 = 거울)
    if (vis !== L && nearPart[L]) {
      const hi = ((iy >> 1) * H + (ix >> 1)), n = nearPart[L][hi];
      if (n >= 0) { px = (n % H) * 2 + 1; py = ((n / H) | 0) * 2 + 1; fixed[v] = 1; }
    }
    uv[v * 2] = px / W;
    uv[v * 2 + 1] = 1 - py / W;
  }
  const weights = makeWeights(model, part);
  return {
    S: W, spec, label, line, lineC, region, fillOf, regPart, nReg, regStart: cnt, regList: list, bleed, uv, part, fixed, weights,
    ms: Math.round(performance.now() - t0),
    stats: { fixedVerts: fixed.reduce((a, b) => a + b, 0), regions: nReg },
  };
}

/* ---------- 움직임 가중치: 부위 표시를 이웃 평균으로 부드럽게 (이음매 찢어짐 방지) ---------- */
function makeWeights(model, part) {
  const pos = model.POSITION, idx = model.index, nv = pos.length / 3;
  const nb = Array.from({ length: nv }, () => []);
  for (let t = 0; t < idx.length; t += 3)
    for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) { nb[a].push(b); nb[b].push(a); }
  // 채널: armR, armL, legR, legL, earR, earL, head(귀 포함), tail
  const ch = [[P.armR], [P.armL], [P.legR], [P.legL], [P.earR], [P.earL], [P.head, P.earR, P.earL], [P.tail]];
  const out = ch.map((set) => {
    let w = new Float32Array(nv);
    for (let v = 0; v < nv; v++) w[v] = set.includes(part[v]) ? 1 : 0;
    for (let k = 0; k < 6; k++) {
      const n = new Float32Array(nv);
      for (let v = 0; v < nv; v++) {
        let s = w[v];
        for (const j of nb[v]) s += w[j];
        n[v] = s / (nb[v].length + 1);
      }
      w = n;
    }
    return w;
  });
  const A = new Float32Array(nv * 4), B = new Float32Array(nv * 4);
  for (let v = 0; v < nv; v++) for (let k = 0; k < 4; k++) { A[v * 4 + k] = out[k][v]; B[v * 4 + k] = out[k + 4][v]; }
  return { A, B };
}

/* ---------- 얼굴 (도안: 검은 선/칠, 3D: 얼굴 덧칠 텍스처) ---------- */
export function drawFace(g, spec, mode) {
  const F = spec.face, X = (x) => spec.CX + x * spec.K, Y = (y) => spec.OY - y * spec.K, L = (l) => l * spec.K;
  g.save();
  const ink = mode === "sheet" ? "#222" : "#1d1714";
  g.fillStyle = ink;
  g.strokeStyle = ink;
  g.lineCap = g.lineJoin = "round";
  // 눈
  for (const [x, y] of F.eyes) {
    g.beginPath();
    g.ellipse(X(x), Y(y), L(F.eyeR[0]), L(F.eyeR[1]), 0, 0, Math.PI * 2);
    g.fill();
    if (mode !== "sheet") {
      g.fillStyle = "rgba(255,255,255,.9)";
      g.beginPath();
      g.arc(X(x) - L(F.eyeR[0]) * 0.35, Y(y) - L(F.eyeR[1]) * 0.4, L(F.eyeR[0]) * 0.28, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = ink;
    }
  }
  // 코 (둥근 역삼각형)
  const nx = X(F.nose[0]), ny = Y(F.nose[1]), nw = L(F.noseW) / 2, nh = L(F.noseH) / 2;
  g.fillStyle = mode === "sheet" ? ink : "#4a3631";
  g.beginPath();
  g.moveTo(nx - nw, ny - nh * 0.7);
  g.quadraticCurveTo(nx, ny - nh * 1.35, nx + nw, ny - nh * 0.7);
  g.quadraticCurveTo(nx + nw * 0.9, ny + nh * 0.2, nx, ny + nh);
  g.quadraticCurveTo(nx - nw * 0.9, ny + nh * 0.2, nx - nw, ny - nh * 0.7);
  g.fill();
  // 입 (ω)
  g.lineWidth = mode === "sheet" ? 5.5 : 6;
  g.strokeStyle = mode === "sheet" ? ink : "#4a3631";
  const my = Y(F.mouth.y), mw = L(F.mouth.w), mh = L(F.mouth.h);
  g.beginPath();
  g.moveTo(nx, ny + nh);
  g.lineTo(nx, Y(F.mouth.top) + 2);
  g.moveTo(nx - mw, my - mh * 0.6);
  g.quadraticCurveTo(nx - mw * 0.5, my + mh * 1.2, nx, Y(F.mouth.top));
  g.quadraticCurveTo(nx + mw * 0.5, my + mh * 1.2, nx + mw, my - mh * 0.6);
  g.stroke();
  // 발가락 줄 (도안에만)
  if (mode === "sheet") {
    g.lineWidth = 4.5;
    for (const s of [-1, 1])
      for (const [x, y] of F.toes) {
        g.beginPath();
        g.moveTo(X(s * x), Y(y + 0.004));
        g.lineTo(X(s * x), Y(y + F.toeH));
        g.stroke();
      }
  }
  g.restore();
}
/** 3D 얼굴 덧칠 텍스처 (모든 강아지가 같이 씀) */
export function faceCanvas(spec = DOG) {
  const c = document.createElement("canvas");
  c.width = c.height = S;
  drawFace(c.getContext("2d"), spec, "3d");
  return c;
}
