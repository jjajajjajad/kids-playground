/* 예시 칠한 그림 3개 (모델 좌표: x 좌우 ±0.39, y 0~1) — 아이가 칠한 것처럼 채우기 + 크레파스 낙서 */
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

export const EXAMPLES = [
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
