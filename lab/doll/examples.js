/* 예시 칠한 그림 — 아이가 칠한 것처럼 채우기 + 크레파스 낙서
   강아지: 시험 2 의 3개 그대로 (모델 좌표 직접). 다른 종: 부위 이름으로 칠하는 공통 2개 (종마다 색만 다름)
   examplesFor(종) → [{name, draw(painter)}] */
const P = {
  pink: "#ff9aa2", peach: "#ffb38a", yellow: "#ffe08a", lime: "#c8e88a", mint: "#8fd6a8", sky: "#8fd3e8",
  blue: "#9bb7ff", lav: "#c3a6ff", tan: "#c99a74", brown: "#8a6a5a", ink: "#5b5b6e", white: "#fdfaf4",
};
// 손 떨림 흉내 (같은 결과가 나오게 고정 난수)
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const wobble = (pts, r, amt = 0.006) => pts.map(([x, y]) => [x + (r() - 0.5) * amt, y + (r() - 0.5) * amt]);
const circle = (cx, cy, rx, ry, n = 18) => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);
const heart = (cx, cy, s) => {
  const o = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    o.push([cx + s * 16 * Math.sin(t) ** 3 / 16, cy + (s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))) / 16]);
  }
  return o;
};
const zig = (x0, x1, y0, y1, n) => Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, i % 2 ? y1 : y0]);
const star = (cx, cy, r) => Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI * 4) / 5; return [cx + Math.cos(a) * r, cy - Math.sin(a) * r]; });

export const DOG_EXAMPLES = [
  {
    name: "갈색 바둑이",
    draw(p) {
      const r = rng(11);
      p.fill(0, 0.85, P.peach); // 머리
      p.fill(0.3, 0.75, P.brown);
      p.fill(-0.3, 0.75, P.brown);
      p.fill(0, 0.35, P.peach);
      p.fill(0.25, 0.37, P.tan);
      p.fill(-0.25, 0.37, P.tan);
      p.fill(0.1, 0.08, P.brown);
      p.fill(-0.1, 0.08, P.brown);
      // 한쪽 눈 얼룩, 볼, 배에 하트
      p.crayon(wobble(circle(0.1, 0.72, 0.055, 0.05), r), P.tan, 26);
      p.crayon(wobble(circle(0.15, 0.645, 0.022, 0.016, 10), r), P.pink, 24);
      p.crayon(wobble(circle(-0.15, 0.645, 0.022, 0.016, 10), r), P.pink, 24);
      p.crayon(wobble(heart(0, 0.33, 0.06), r, 0.004), P.pink, 16);
      p.crayon(wobble(heart(0, 0.33, 0.035), r, 0.004), P.pink, 20);
      // 머리 위 점
      for (const [x, y] of [[-0.08, 0.92], [0.05, 0.94], [-0.02, 0.88]]) p.crayon([[x, y], [x + 0.004, y]], P.brown, 20);
    },
  },
  {
    name: "무지개 강아지",
    draw(p) {
      const r = rng(23);
      p.fill(0, 0.85, P.yellow);
      p.fill(0.3, 0.75, P.blue);
      p.fill(-0.3, 0.75, P.pink);
      p.fill(0, 0.35, P.sky);
      p.fill(0.25, 0.37, P.lav);
      p.fill(-0.25, 0.37, P.mint);
      p.fill(0.1, 0.08, P.peach);
      p.fill(-0.1, 0.08, P.lime);
      // 몸통 줄무늬 (크레파스, 선 밖으로 조금 삐침)
      for (const [y, c] of [[0.44, P.white], [0.36, P.yellow], [0.28, P.pink], [0.21, P.white]]) p.crayon(wobble([[-0.21, y], [-0.07, y + 0.01], [0.07, y - 0.008], [0.21, y + 0.004]], r), c, 24);
      // 머리 점박이
      for (const [x, y] of [[-0.12, 0.88], [0.0, 0.93], [0.12, 0.86], [-0.05, 0.8], [0.08, 0.79]]) p.crayon(wobble(circle(x, y, 0.016, 0.014, 8), r, 0.003), P.blue, 18);
      // 귀에 별
      p.crayon(wobble(star(0.3, 0.74, 0.05), r, 0.004), P.yellow, 12);
    },
  },
  {
    name: "낙서 강아지",
    draw(p) {
      const r = rng(37);
      p.fill(0.3, 0.75, P.peach);
      p.fill(-0.3, 0.75, P.peach);
      // 몸통 지그재그 (선 밖으로 나감)
      p.crayon(wobble(zig(-0.23, 0.23, 0.42, 0.34, 9), r, 0.012), P.blue, 20);
      p.crayon(wobble(zig(-0.2, 0.22, 0.3, 0.22, 8), r, 0.012), P.mint, 20);
      // 배에 빨간 동그라미 두 번
      p.crayon(wobble(circle(0.02, 0.32, 0.07, 0.06, 20).concat(circle(0.02, 0.32, 0.06, 0.05, 20)), r, 0.01), P.pink, 14);
      // 머리 낙서 (초록 꼬불)
      const curl = [];
      for (let i = 0; i <= 40; i++) { const t = i / 40; curl.push([-0.17 + t * 0.34 + Math.cos(t * 30) * 0.03, 0.88 + Math.sin(t * 30) * 0.03]); }
      p.crayon(wobble(curl, r, 0.006), P.lime, 14);
      // 머리 위 별
      p.crayon(wobble(star(-0.03, 0.8, 0.04), r, 0.004), P.yellow, 14);
      // 팔·다리 칠한 듯 만 듯
      p.crayon(wobble([[0.2, 0.42], [0.3, 0.36], [0.22, 0.35], [0.3, 0.33]], r), P.lav, 26);
      p.crayon(wobble([[-0.2, 0.42], [-0.3, 0.36], [-0.22, 0.35], [-0.3, 0.33]], r), P.yellow, 26);
      p.crayon(wobble(zig(-0.18, -0.03, 0.14, 0.03, 5), r), P.lav, 22);
      p.crayon(wobble(zig(0.03, 0.18, 0.14, 0.03, 5), r), P.pink, 22);
      // 얼굴에 수염 선
      p.crayon([[0.1, 0.66], [0.2, 0.67]], P.ink, 8);
      p.crayon([[0.1, 0.645], [0.2, 0.635]], P.ink, 8);
      p.crayon([[-0.1, 0.66], [-0.2, 0.67]], P.ink, 8);
      p.crayon([[-0.1, 0.645], [-0.2, 0.635]], P.ink, 8);
    },
  },
];

/* ---------- 공통 예시 (부위 이름 + 부위 범위 안 비율 좌표로 그림) ---------- */
const at = (p, part, u, v) => p.at(part, u, v);
function blush(p, r) {
  // 두 볼: 눈 아래 바깥쪽
  const F = p.B.spec.face;
  for (const [ex, ey] of F.eyes) {
    const x = ex * 1.25, y = ey - 0.055;
    p.crayon(wobble(circle(x, y, 0.022, 0.016, 10), r), P.pink, 24);
  }
}
function bellyHeart(p, r, col) {
  const c = at(p, "body", 0.5, 0.45);
  if (!c) return;
  p.crayon(wobble(heart(c[0], c[1], 0.06), r, 0.004), col, 16);
  p.crayon(wobble(heart(c[0], c[1], 0.035), r, 0.004), col, 20);
}
function bodyStripes(p, r, cols) {
  const b = p.B.box.body;
  if (!b) return;
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const y = b.y0 + ((b.y1 - b.y0) * (i + 1)) / (n + 1), w = (b.x1 - b.x0) * 0.42;
    p.crayon(wobble([[b.cx - w, y], [b.cx - w / 3, y + 0.01], [b.cx + w / 3, y - 0.008], [b.cx + w, y + 0.004]], r), cols[i], 22);
  }
}
function headDots(p, r, col) {
  for (const [u, v] of [[0.3, 0.86], [0.5, 0.92], [0.7, 0.85], [0.4, 0.78], [0.62, 0.77]]) {
    const c = at(p, "head", u, v);
    if (c) p.crayon(wobble(circle(c[0], c[1], 0.016, 0.014, 8), r, 0.003), col, 18);
  }
}
/* 종별 색 (natural: 그 동물다운 색, bright: 알록달록) — 없는 부위는 건너뜀 */
const COLORS = {
  cat: {
    natural: { head: P.yellow, earR: P.peach, earL: P.peach, body: P.yellow, armR: P.peach, armL: P.peach, legR: P.white, legL: P.white },
    bright: { head: P.lav, earR: P.pink, earL: P.pink, body: P.sky, armR: P.mint, armL: P.yellow, legR: P.blue, legL: P.lime },
    stripe: P.peach,
  },
  bear: {
    natural: { head: P.tan, earR: P.brown, earL: P.brown, snout: P.yellow, body: P.tan, armR: P.brown, armL: P.brown, legR: P.brown, legL: P.brown },
    bright: { head: P.peach, earR: P.pink, earL: P.pink, snout: P.white, body: P.lime, armR: P.yellow, armL: P.yellow, legR: P.sky, legL: P.sky },
    stripe: P.white,
  },
  rabbit: {
    natural: { head: P.white, earR: P.pink, earL: P.pink, body: P.pink, armR: P.white, armL: P.white, legR: P.lav, legL: P.lav },
    bright: { head: P.mint, earR: P.yellow, earL: P.lav, body: P.peach, armR: P.sky, armL: P.pink, legR: P.lime, legL: P.lime },
    stripe: P.lav,
  },
  pig: {
    natural: { head: P.pink, earR: P.peach, earL: P.peach, snout: P.peach, body: P.pink, armR: P.peach, armL: P.peach, legR: P.pink, legL: P.pink },
    bright: { head: P.yellow, earR: P.blue, earL: P.blue, snout: P.pink, body: P.mint, armR: P.lav, armL: P.lav, legR: P.peach, legL: P.peach },
    stripe: P.white,
  },
  lion: {
    natural: { head: P.yellow, mane: P.peach, earR: P.tan, earL: P.tan, body: P.yellow, armR: P.yellow, armL: P.yellow, legR: P.tan, legL: P.tan },
    bright: { head: P.yellow, mane: P.pink, earR: P.lav, earL: P.lav, body: P.sky, armR: P.mint, armL: P.mint, legR: P.blue, legL: P.blue },
    stripe: P.peach,
  },
  elephant: {
    natural: { head: P.sky, earR: P.pink, earL: P.pink, snout: P.sky, body: P.sky, armR: P.blue, armL: P.blue, legR: P.blue, legL: P.blue },
    bright: { head: P.lav, earR: P.yellow, earL: P.mint, snout: P.pink, body: P.peach, armR: P.lime, armL: P.lime, legR: P.sky, legL: P.sky },
    stripe: P.white,
  },
  dino: {
    natural: { head: P.lime, spike: P.yellow, tail: P.mint, body: P.lime, armR: P.mint, armL: P.mint, legR: P.mint, legL: P.mint },
    bright: { head: P.sky, spike: P.pink, tail: P.lav, body: P.yellow, armR: P.peach, armL: P.peach, legR: P.blue, legL: P.blue },
    stripe: P.yellow,
  },
};
function generic(id) {
  const C = COLORS[id];
  return [
    {
      name: "그 동물 색",
      draw(p) {
        const r = rng(id.length * 13 + 5);
        for (const [k, c] of Object.entries(C.natural)) p.fillPart(k, c);
        blush(p, r);
        bellyHeart(p, r, P.pink);
        if (id === "cat" || id === "lion") headDots(p, r, C.stripe);
      },
    },
    {
      name: "알록달록",
      draw(p) {
        const r = rng(id.length * 29 + 3);
        for (const [k, c] of Object.entries(C.bright)) p.fillPart(k, c);
        bodyStripes(p, r, [P.white, C.stripe, P.pink]);
        headDots(p, r, P.blue);
        const e = at(p, "earR", 0.5, 0.55) || at(p, "mane", 0.85, 0.6) || at(p, "spike", 0.5, 0.5);
        if (e) p.crayon(wobble(star(e[0], e[1], 0.04), r, 0.004), P.yellow, 12);
      },
    },
  ];
}
export function examplesFor(id) {
  return id === "dog" ? DOG_EXAMPLES : generic(id);
}
export const EXAMPLES = DOG_EXAMPLES; // 예전 이름
