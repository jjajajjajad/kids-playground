/* 숫자 쓰기 공책 — 0~9 획순 따라 쓰기, 그다음 10~100 (100판처럼 열 칸씩)
   획순(초등 수학 쓰기 일반): 위에서 시작, 0은 위에서 시계 반대 방향, 4는 2획(ㄴ자 → 세로),
   5는 2획(세로·배 → 윗줄), 그 밖에는 한 번에. 두 자리 수는 한 칸에 두 숫자를 나란히. */
"use strict";
(function () {
  const arc = (cx, cy, rx, ry, a0, a1) => {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 8));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  };
  const P = (...segs) => {
    const out = [];
    segs.forEach((s) =>
      s.forEach((p) => {
        const l = out[out.length - 1];
        if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 0.6) out.push(p);
      })
    );
    return out;
  };
  const D = {
    0: [arc(50, 50, 24, 36, -90, -450)],
    1: [[[50, 14], [50, 86]]],
    2: [P(arc(50, 34, 22, 20, -160, 20), [[70.7, 40.8], [28, 86], [74, 86]])],
    3: [P(arc(48, 32, 21, 18, -150, 90), arc(48, 68, 23, 18, -90, 150))],
    4: [[[58, 14], [24, 62], [80, 62]], [[60, 14], [60, 86]]],
    5: [P([[34, 14], [35.9, 46.1]], arc(50, 63, 22, 22, -130, 140)), [[34, 14], [72, 14]]],
    6: [P([[66, 15], [52, 26], [40, 40], [32, 56]], arc(50, 66, 20, 20, 180, -180))],
    7: [[[24, 14], [76, 14], [42, 86]]],
    8: [P(arc(50, 32, 15, 18, -40, -270), arc(50, 68, 19, 18, -90, 270), arc(50, 32, 15, 18, 90, -40))],
    9: [P(arc(50, 34, 19, 20, 0, -360), [[69, 34], [66, 86]])],
  };
  const map = (strokes, [x0, y0, x1, y1]) =>
    strokes.map((s) => {
      const sx = (x1 - x0) / 100,
        sy = (y1 - y0) / 100;
      return s.map(([x, y]) => [x0 + x * sx, y0 + y * sy]);
    });
  /** 수 → 한 칸 획 (두 자리는 반씩, 100은 세 칸으로) */
  function numStrokes(n) {
    const s = String(n);
    if (s.length === 1) return D[s];
    if (s.length === 2) return map(D[s[0]], [0, 4, 54, 96]).concat(map(D[s[1]], [46, 4, 100, 96]));
    return map(D[s[0]], [0, 10, 38, 90]).concat(map(D[s[1]], [31, 10, 69, 90]), map(D[s[2]], [62, 10, 100, 90]));
  }
  const G = {};
  for (let i = 0; i <= 9; i++) G[i] = D[i];
  KP.GLYPHS = Object.assign(KP.GLYPHS || {}, { num: G, numFull: numStrokes });

  const THINGS = ["🍎", "🐥", "⭐", "🍓", "🚗", "🐟", "🎈", "🌼", "🍪", "🦋"];
  const COLORS = ["#ff5b6e", "#ff9f1c", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452"];
  function book() {
    const U = KP.u;
    const one = [];
    for (let n = 0; n <= 9; n++)
      one.push({ id: "D" + n, kind: "jamo", label: String(n), ch: String(n), say: n ? U.numNative(n) : "영", color: COLORS[n], strokes: D[n], word: n ? [U.numNative(n) + " · " + U.numSino(n), THINGS[n]] : ["영 · 하나도 없어요", "🧺"] });
    const big = [];
    for (let n = 10; n <= 100; n++)
      big.push({ id: "N" + n, kind: "jamo", label: String(n), ch: String(n), say: U.numSino(n), color: COLORS[Math.floor(n / 10) % 10], strokes: numStrokes(n), syl: true, word: [U.numSino(n) + (n < 100 ? " · " + U.numNative(n) : ""), "🔢"] });
    return [
      { id: "digit", name: "숫자 0~9", items: one },
      { id: "big", name: "10~100", items: big },
    ];
  }
  KP.notebook({
    id: "nwrite",
    icon: "📝",
    name: "숫자 쓰기 공책",
    cat: "study",
    key: "nw:stars",
    paper: "num",
    book,
    firstHint: "숫자 0부터 써 볼까요?",
  });
})();
