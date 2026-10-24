/* Tripo 강아지 GLB 정리 → lab/doll/dog.glb
   1) 같은 자리 정점 합치기(UV 이음매 제거) 2) 방향: 정면 +z, 위 +y, 발바닥 y=0, 키 1
   3) 겹친 삼각형·퇴화 삼각형 제거 4) 약한 Taubin 다듬기(AI 메시의 자잘한 울퉁불퉁)
   5) 노멀 재계산 6) 정점 AO 굽기(반구 광선) → _AO
   사용: node lab/doll/pipeline/clean.js <입력.glb> lab/doll/dog.glb */
const G = require("./glbio");
const [, , inF, outF] = process.argv;
const m = G.read(inF);
const P0 = m.POSITION, I0 = m.index;
const nv0 = P0.length / 3;

// 1) 합치기
const map = new Map(), remap = new Int32Array(nv0), pos = [];
for (let i = 0; i < nv0; i++) {
  const k = [0, 1, 2].map((a) => Math.round(P0[i * 3 + a] * 1e5)).join(",");
  if (!map.has(k)) { map.set(k, pos.length / 3); pos.push(P0[i * 3], P0[i * 3 + 1], P0[i * 3 + 2]); }
  remap[i] = map.get(k);
}
const nv = pos.length / 3;
const tri = [];
const seen = new Set();
for (let t = 0; t < I0.length / 3; t++) {
  const a = remap[I0[t * 3]], b = remap[I0[t * 3 + 1]], c = remap[I0[t * 3 + 2]];
  if (a === b || b === c || a === c) continue;
  const k = [a, b, c].sort((x, y) => x - y).join("_");
  if (seen.has(k)) continue; // 같은 삼각형 두 번
  seen.add(k);
  tri.push(a, b, c);
}
// 2) 방향: 원본은 정면 +x, 좌우 z → 정면 +z, 좌우 x (y축 -90도 회전)
const P = new Float32Array(nv * 3);
for (let i = 0; i < nv; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; P[i * 3] = -z; P[i * 3 + 1] = y; P[i * 3 + 2] = x; }
// 4) Taubin (λ=0.45, μ=-0.47, 4회) — 모양은 거의 그대로, 잔물결만
const nb = Array.from({ length: nv }, () => new Set());
for (let t = 0; t < tri.length; t += 3) for (const [a, b] of [[tri[t], tri[t + 1]], [tri[t + 1], tri[t + 2]], [tri[t + 2], tri[t]]]) { nb[a].add(b); nb[b].add(a); }
const step = (f) => {
  const Q = P.slice();
  for (let i = 0; i < nv; i++) {
    if (!nb[i].size) continue;
    let sx = 0, sy = 0, sz = 0;
    for (const j of nb[i]) { sx += Q[j * 3]; sy += Q[j * 3 + 1]; sz += Q[j * 3 + 2]; }
    const n = nb[i].size;
    P[i * 3] += f * (sx / n - Q[i * 3]); P[i * 3 + 1] += f * (sy / n - Q[i * 3 + 1]); P[i * 3 + 2] += f * (sz / n - Q[i * 3 + 2]);
  }
};
const SMOOTH = +(process.env.SMOOTH || 4);
for (let k = 0; k < SMOOTH; k++) { step(0.45); step(-0.47); }
// 정규화: 키 1, 발바닥 y=0, 좌우 가운데 x=0, 앞뒤 가운데 z=0(몸통 기준: 발 높이 근처 평균)
let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i * 3 + k]); mx[k] = Math.max(mx[k], P[i * 3 + k]); }
const s = 1 / (mx[1] - mn[1]);
const cx = (mn[0] + mx[0]) / 2;
let fz = 0, fn = 0;
for (let i = 0; i < nv; i++) if (P[i * 3 + 1] < mn[1] + 0.06 / s) { fz += P[i * 3 + 2]; fn++; }
const cz = fz / fn;
for (let i = 0; i < nv; i++) { P[i * 3] = (P[i * 3] - cx) * s; P[i * 3 + 1] = (P[i * 3 + 1] - mn[1]) * s; P[i * 3 + 2] = (P[i * 3 + 2] - cz) * s; }
// 5) 노멀 (면적 가중)
const N = new Float32Array(nv * 3);
for (let t = 0; t < tri.length; t += 3) {
  const a = tri[t] * 3, b = tri[t + 1] * 3, c = tri[t + 2] * 3;
  const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
  const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
}
for (let i = 0; i < nv; i++) { const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1; N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; }
// 6) AO: 정점마다 코사인 가중 반구 광선 48개, 거리 0.22 안에서 막히면 어둡게 + 바닥(y=0)도 막는 것으로
const T = tri.length / 3;
const TA = new Float32Array(T * 9);
for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) for (let a = 0; a < 3; a++) TA[t * 9 + k * 3 + a] = P[tri[t * 3 + k] * 3 + a];
// 삼각형 경계 상자 격자 (간단 가속)
const GN = 16, cell = 1.05 / GN, grid = new Map();
const gk = (x, y, z) => x + "," + y + "," + z;
const ci = (v, o) => Math.max(0, Math.min(GN - 1, Math.floor((v - o) / cell)));
const ox = -0.525, oy = -0.01, oz = -0.525;
for (let t = 0; t < T; t++) {
  let a0 = [1e9, 1e9, 1e9], a1 = [-1e9, -1e9, -1e9];
  for (let k = 0; k < 3; k++) for (let a = 0; a < 3; a++) { a0[a] = Math.min(a0[a], TA[t * 9 + k * 3 + a]); a1[a] = Math.max(a1[a], TA[t * 9 + k * 3 + a]); }
  for (let x = ci(a0[0], ox); x <= ci(a1[0], ox); x++) for (let y = ci(a0[1], oy); y <= ci(a1[1], oy); y++) for (let z = ci(a0[2], oz); z <= ci(a1[2], oz); z++) {
    const k = gk(x, y, z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(t);
  }
}
function hit(o, d, maxD) {
  // 격자 따라 걷기 (작은 거리라 단순 샘플링: cell/2 간격으로 칸 모으기)
  const cand = new Set();
  for (let s2 = 0; s2 <= maxD + cell; s2 += cell * 0.5) {
    const x = ci(o[0] + d[0] * s2, ox), y = ci(o[1] + d[1] * s2, oy), z = ci(o[2] + d[2] * s2, oz);
    const L = grid.get(gk(x, y, z)); if (L) for (const t of L) cand.add(t);
  }
  for (const t of cand) {
    const b = t * 9;
    const e1 = [TA[b + 3] - TA[b], TA[b + 4] - TA[b + 1], TA[b + 5] - TA[b + 2]];
    const e2 = [TA[b + 6] - TA[b], TA[b + 7] - TA[b + 1], TA[b + 8] - TA[b + 2]];
    const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
    const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < 1e-9) continue;
    const inv = 1 / det, tv = [o[0] - TA[b], o[1] - TA[b + 1], o[2] - TA[b + 2]];
    const u = (tv[0] * p[0] + tv[1] * p[1] + tv[2] * p[2]) * inv; if (u < 0 || u > 1) continue;
    const q = [tv[1] * e1[2] - tv[2] * e1[1], tv[2] * e1[0] - tv[0] * e1[2], tv[0] * e1[1] - tv[1] * e1[0]];
    const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) * inv; if (v < 0 || u + v > 1) continue;
    const tt = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
    if (tt > 1e-4 && tt < maxD) return true;
  }
  return false;
}
const AO = new Uint8Array(nv);
const R = 48, MAXD = 0.22;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const dirs = [];
for (let k = 0; k < R; k++) { const u1 = (k + rnd()) / R, u2 = rnd(); const r = Math.sqrt(u1), th = 2 * Math.PI * u2; dirs.push([r * Math.cos(th), r * Math.sin(th), Math.sqrt(1 - u1)]); }
const t0 = Date.now();
for (let i = 0; i < nv; i++) {
  const n = [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]];
  const tx = Math.abs(n[0]) < 0.9 ? [0, -n[2], n[1]] : [n[2], 0, -n[0]];
  const tl = Math.hypot(...tx); tx[0] /= tl; tx[1] /= tl; tx[2] /= tl;
  const bt = [n[1] * tx[2] - n[2] * tx[1], n[2] * tx[0] - n[0] * tx[2], n[0] * tx[1] - n[1] * tx[0]];
  const o = [P[i * 3] + n[0] * 0.003, P[i * 3 + 1] + n[1] * 0.003, P[i * 3 + 2] + n[2] * 0.003];
  let open = 0;
  for (const [a, b, c] of dirs) {
    const d = [tx[0] * a + bt[0] * b + n[0] * c, tx[1] * a + bt[1] * b + n[1] * c, tx[2] * a + bt[2] * b + n[2] * c];
    // 바닥: 발 근처만(서 있는 바닥은 3D 화면의 그림자가 맡음 → 약하게)
    if (d[1] < 0 && o[1] / -d[1] < MAXD * 0.4) continue;
    if (!hit(o, d, MAXD)) open++;
  }
  AO[i] = Math.round((open / R) * 255);
}
console.log("AO", ((Date.now() - t0) / 1000).toFixed(1) + "s");
const idx = nv < 65536 ? new Uint16Array(tri) : new Uint32Array(tri);
G.write(outF, { POSITION: [P, "VEC3"], NORMAL: [N, "VEC3"], _AO: [AO, "SCALAR"] }, idx, { source: "Tripo H3.1 dog-tripo.glb", front: "+z", height: 1 });
console.log("verts", nv, "tris", T, "->", outF);
