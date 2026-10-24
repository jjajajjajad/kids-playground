/* =====================================================================
   동물원 시험판 — 점토 디오라마 배경 그림 (bg/*.jpg, 1600×900)
   - 그림마다 손으로 정한 값:
       vh   : 지평선 높이 (그림 높이 비율, 0=위 끝 · 1=아래 끝, 그림 위로 벗어나면 음수)
              땅 위 물건의 크기는 (v − vh) 에 비례 — 화면 위쪽일수록 작게
       near : 그림 맨 아래 줄에서 세상 1단위가 그림 높이의 몇 배로 보이는지 (동물 크기)
       fov  : 그림을 찍은 카메라의 세로 화각 (추정)
       poly : 걸을 수 있는 풀밭 (발 위치, 그림 좌표 0~1) — 연못·집·나무·앞쪽 덤불을 피해 손으로 그림
       focus: 화면 비율이 달라 잘릴 때 남길 곳 (그림 좌표)
       sun  : 햇빛이 오는 쪽 (세상 좌표, 카메라는 -z 를 봄), sunCol: 햇빛 색
   - 카메라: 그림과 같은 원근 카메라를 만들고, 화면 비율이 다르면 그 일부(view offset)만 보여 줌
     → 점토 3D(Three.js setViewOffset)와 2.5D(projector) 모두 같은 계산
===================================================================== */
export const BGS = {
  A: {
    file: "bg/bg-A-zoo.jpg", name: "A 동물원", vh: 0.3, near: 0.165, fov: 40, focus: [0.5, 0.66],
    sun: [-0.45, 1, 0.6], sunCol: "#fff3e0",
    poly: [[0.2, 0.615], [0.35, 0.615], [0.4, 0.575], [0.47, 0.545], [0.6, 0.54], [0.66, 0.555], [0.73, 0.6], [0.86, 0.61], [0.875, 0.66], [0.84, 0.71], [0.76, 0.78], [0.69, 0.86], [0.67, 0.93], [0.25, 0.93], [0.21, 0.85], [0.14, 0.76], [0.14, 0.68]],
  },
  B: {
    file: "bg/bg-B-farm.jpg", name: "B 농장", vh: -0.5, near: 0.17, fov: 40, focus: [0.52, 0.6],
    sun: [-0.5, 1, 0.45], sunCol: "#fff1dc",
    poly: [[0.3, 0.42], [0.36, 0.37], [0.55, 0.36], [0.62, 0.43], [0.8, 0.46], [0.83, 0.56], [0.84, 0.64], [0.79, 0.72], [0.66, 0.79], [0.6, 0.86], [0.31, 0.86], [0.28, 0.76], [0.18, 0.7], [0.16, 0.6], [0.19, 0.5], [0.26, 0.47]],
  },
  C: {
    file: "bg/bg-C-zoo.jpg", name: "C 동물원", vh: 0.1, near: 0.18, fov: 40, focus: [0.5, 0.62],
    sun: [-0.35, 1, 0.55], sunCol: "#fff4dc",
    poly: [[0.32, 0.385], [0.45, 0.345], [0.62, 0.345], [0.76, 0.37], [0.8, 0.43], [0.86, 0.52], [0.89, 0.6], [0.86, 0.71], [0.8, 0.82], [0.7, 0.9], [0.36, 0.91], [0.27, 0.84], [0.15, 0.71], [0.11, 0.6], [0.2, 0.565], [0.29, 0.52], [0.31, 0.44]],
  },
  D: {
    file: "bg/bg-D-farm.jpg", name: "D 농장", vh: -0.12, near: 0.17, fov: 40, focus: [0.5, 0.6],
    sun: [-0.4, 1, 0.5], sunCol: "#fff2da",
    poly: [[0.12, 0.38], [0.24, 0.3], [0.4, 0.27], [0.6, 0.27], [0.7, 0.37], [0.84, 0.4], [0.9, 0.48], [0.88, 0.6], [0.8, 0.72], [0.66, 0.8], [0.36, 0.8], [0.24, 0.73], [0.14, 0.62], [0.11, 0.5]],
  },
  E: {
    file: "bg/bg-E-camp.jpg", name: "E 캠핑장", vh: -0.25, near: 0.165, fov: 40, focus: [0.5, 0.6],
    sun: [-0.5, 1, 0.5], sunCol: "#fff6e4",
    poly: [[0.07, 0.5], [0.24, 0.43], [0.36, 0.3], [0.52, 0.24], [0.7, 0.24], [0.78, 0.34], [0.9, 0.42], [0.93, 0.52], [0.9, 0.66], [0.88, 0.9], [0.14, 0.9], [0.12, 0.76], [0.06, 0.62]],
  },
  F: {
    file: "bg/bg-F-park.jpg", name: "F 공원", vh: -0.08, near: 0.17, fov: 40, focus: [0.48, 0.6],
    sun: [-0.6, 0.9, 0.35], sunCol: "#ffeccc",
    poly: [[0.27, 0.45], [0.36, 0.38], [0.5, 0.36], [0.68, 0.37], [0.74, 0.45], [0.8, 0.54], [0.88, 0.63], [0.86, 0.74], [0.76, 0.86], [0.62, 0.9], [0.32, 0.9], [0.25, 0.84], [0.26, 0.7], [0.18, 0.6], [0.22, 0.52]],
  },
};
export const BG_IDS = Object.keys(BGS);
const IA = 16 / 9; // 그림 비율

/* ---------- 그림 읽기 + 색 맞추기용 평균색 (풀밭·하늘) ---------- */
const cache = new Map();
export function loadBg(id) {
  const def = BGS[id];
  if (!def) return Promise.resolve(null);
  if (!cache.has(id))
    cache.set(id, new Promise((res, rej) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        // 작게 줄여 평균색 (풀밭 = 걷는 영역 안, 하늘 = 맨 위 띠)
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 36;
        const g = c.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0, 64, 36);
        const d = g.getImageData(0, 0, 64, 36).data;
        const grass = [0, 0, 0, 0], sky = [0, 0, 0, 0];
        for (let y = 0; y < 36; y++)
          for (let x = 0; x < 64; x++) {
            const i = (y * 64 + x) * 4, u = (x + 0.5) / 64, v = (y + 0.5) / 36;
            const acc = inPoly(def.poly, u, v) ? grass : v < 0.12 ? sky : null;
            if (!acc) continue;
            acc[0] += d[i]; acc[1] += d[i + 1]; acc[2] += d[i + 2]; acc[3]++;
          }
        const hex = (a, f) => "#" + [0, 1, 2].map((k) => Math.round(a[3] ? a[k] / a[3] : f[k]).toString(16).padStart(2, "0")).join("");
        res({ id, def, img, grass: hex(grass, [110, 180, 90]), sky: hex(sky, [170, 210, 240]) });
      };
      img.onerror = () => {
        cache.delete(id);
        rej(new Error("배경 그림을 못 읽었어요: " + def.file));
      };
      img.src = def.file;
    }));
  return cache.get(id);
}

export function inPoly(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}

/* ---------- 그림에 맞춘 카메라 ----------
   vw, vh: 보기 크기(CSS px). 반환값은 sim.camFor 와 같은 모양 + view(잘라 보기) + bounds(걷는 영역 함수) */
export function bgCam(def, vw, vh, rand = Math.random) {
  const fov = def.fov, t = Math.tan((fov * Math.PI) / 360);
  // 화면 가득 (cover): 그림을 표시할 크기와 잘라 낼 위치
  const k = Math.max(vw / 1600, vh / 900), fw = 1600 * k, fh = 900 * k;
  const ox = Math.max(0, Math.min(fw - vw, def.focus[0] * fw - vw / 2));
  const oy = Math.max(0, Math.min(fh - vh, def.focus[1] * fh - vh / 2));
  const vis = { u0: ox / fw, u1: (ox + vw) / fw, v0: oy / fh, v1: (oy + vh) / fh };
  // 좁게 잘린 화면(폰 세로·나란히)에서는 동물을 조금 작게 → 여러 마리가 들어가게
  const frac = Math.min(vis.u1 - vis.u0, vis.v1 - vis.v0);
  const scale = Math.max(0.5, Math.min(1, Math.sqrt(frac) * 1.02));
  // 내려다보는 각: 지평선이 vh 에 오도록
  const th = Math.atan((0.5 - def.vh) * 2 * t);
  const sn = Math.sin(th), cs = Math.cos(th);
  const mk = (h) => {
    const pos = [0, h, 0];
    const fwd = [0, -sn, -cs], up = [0, cs, -sn];
    const toUV = (x, y, z) => {
      const dx = x - pos[0], dy = y - pos[1], dz = z - pos[2];
      const zc = dx * fwd[0] + dy * fwd[1] + dz * fwd[2];
      const xc = dx, yc = dx * up[0] + dy * up[1] + dz * up[2];
      return [0.5 + xc / (zc * t * IA) / 2, 0.5 - yc / (zc * t) / 2, zc];
    };
    const ground = (u, v) => {
      const nx = (u * 2 - 1) * t * IA, ny = (1 - v * 2) * t;
      const d = [nx, fwd[1] + up[1] * ny, fwd[2] + up[2] * ny];
      if (d[1] >= -1e-4) return null; // 지평선 위: 땅이 없음
      const s = -pos[1] / d[1];
      return [pos[0] + d[0] * s, pos[2] + d[2] * s];
    };
    return { pos, toUV, ground };
  };
  // 높이 1 로 재 보고 크기에 맞게 카메라 높이 정하기 (모든 길이가 높이에 비례)
  const m1 = mk(1), g1 = m1.ground(0.5, 1);
  const dv1 = m1.toUV(g1[0], 0, g1[1])[1] - m1.toUV(g1[0], 1, g1[1])[1];
  const H = dv1 / (def.near * scale);
  const M = mk(H);
  const pos = M.pos, target = [0, H - sn * 10, -cs * 10];

  // 걷는 영역 = 손으로 그린 풀밭 ∩ 화면에 보이는 곳
  const mu = 0.012, mv = 0.012;
  const insideUV = (u, v) => u > vis.u0 + mu && u < vis.u1 - mu && v < vis.v1 - mv && v > vis.v0 && inPoly(def.poly, u, v);
  const dims = (a) => {
    const m = a.art.model, s = 0.01 * a.size;
    return { w: (m.bbox.x1 - m.bbox.x0) * s, h: (m.foot[1] - m.bbox.y0) * s };
  };
  /** 동물 a 가 (x,z) 에 서도 되나: 발 양끝이 풀밭 안 + 머리가 화면 안 */
  const inside = (a, x, z) => {
    const { w, h } = dims(a);
    const hw = a.fly ? w * 0.15 : w * 0.4;
    const l = M.toUV(x - hw, 0, z), r = M.toUV(x + hw, 0, z), c = M.toUV(x, 0, z);
    if (!insideUV(l[0], l[1]) || !insideUV(r[0], r[1]) || !insideUV(c[0], c[1])) return false;
    // 몸 전체(코·꼬리 포함)가 화면 좌우 안에
    const L = M.toUV(x - w * 0.56, 0, z)[0], Rr = M.toUV(x + w * 0.56, 0, z)[0];
    if (L < vis.u0 + 0.004 || Rr > vis.u1 - 0.004) return false;
    const top = M.toUV(x, (a.fly ? a.y : 0) + h, z)[1];
    return top > vis.v0 + 0.01;
  };
  const pick = (a) => {
    for (let i = 0; i < 40; i++) {
      const u = vis.u0 + rand() * (vis.u1 - vis.u0), v = Math.max(vis.v0, 0.2) + rand() * (vis.v1 - Math.max(vis.v0, 0.2));
      if (!insideUV(u, v)) continue;
      const g = M.ground(u, v);
      if (g && inside(a, g[0], g[1])) return g;
    }
    return null;
  };
  // 처음 자리: 후보 여러 개 중 다른 동물과 가장 먼 곳
  const place = (list) => {
    const done = [];
    for (const a of list) {
      let best = null, bd = -1;
      for (let k = 0; k < 14; k++) {
        const g = pick(a);
        if (!g) continue;
        const [su, sv] = M.toUV(g[0], 0, g[1]);
        let d = 9;
        for (const q of done) d = Math.min(d, Math.hypot((su - q[0]) * IA, sv - q[1]));
        if (d > bd) {
          bd = d;
          best = g;
        }
      }
      if (best) {
        a.x = a.tx = best[0];
        a.z = a.tz = best[1];
        const p = M.toUV(best[0], 0, best[1]);
        done.push([p[0], p[1]]);
      }
    }
  };
  // 상자 범위(세상 좌표) — 그림자 범위·예전 코드용
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i <= 24; i++)
    for (let j = 0; j <= 24; j++) {
      const u = vis.u0 + ((vis.u1 - vis.u0) * i) / 24, v = vis.v0 + ((vis.v1 - vis.v0) * j) / 24;
      if (!inPoly(def.poly, u, v)) continue;
      const g = M.ground(u, v);
      if (!g) continue;
      x0 = Math.min(x0, g[0]); x1 = Math.max(x1, g[0]); z0 = Math.min(z0, g[1]); z1 = Math.max(z1, g[1]);
    }
  if (x0 > x1) {
    const g = M.ground(0.5, 0.8) || [0, -5];
    x0 = g[0] - 1; x1 = g[0] + 1; z0 = g[1] - 1; z1 = g[1] + 1;
  }
  const bounds = { x0, x1, z0, z1, inside, pick, place, uv: M.toUV, scale };
  return { fov, pos, target, fixed: true, view: { fw, fh, ox, oy }, bounds, scale, vis, H };
}
