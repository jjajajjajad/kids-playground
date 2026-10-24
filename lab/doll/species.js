/* =====================================================================
   종별 설정 (8종) — 굽기(bake.js)·움직임(stage.js)·예시(examples.js)가 함께 씀
   모델 좌표: 키 1, 발바닥 y=0, 정면 +z, 오른쪽 +x (lab/doll/pipeline/clean.js 가 맞춤)
   그림 좌표: px = CX + x·K, py = OY − y·K  (도안·텍스처 S=1024 정사각형)
   part(x,y,z) → 부위 번호 : 모델의 '겉면 한 점'이 어느 부위인지 (같은 규칙으로 도안 경계·UV 고치기·움직임 가중치)
   face : 도안·3D 얼굴 (눈·코·입 위치는 모델의 볼록한 자리에 맞춤 — tools/out/doll8/probe.js 로 잼)
   move : 움직임 차이 (걸음 빠르기·흔들림·깡충·꼬리/코 흔들기)
===================================================================== */
export const PARTS = ["bg", "head", "earR", "earL", "body", "armR", "armL", "legR", "legL", "tail", "snout", "mane", "spike"];
export const P = Object.fromEntries(PARTS.map((n, i) => [n, i]));

const ell = (x, y, z, c, r) => ((x - c[0]) / r[0]) ** 2 + ((y - c[1]) / r[1]) ** 2 + ((z - c[2]) / r[2]) ** 2;
const side = (x, R, L) => (x > 0 ? R : L);
/** 꺾은선(관)까지 거리 — 코끼리 코처럼 휜 관 모양 부위 */
function distLine(x, y, z, pts) {
  let best = 9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * d[0] + (y - a[1]) * d[1] + (z - a[2]) * d[2]) / l2));
    best = Math.min(best, Math.hypot(x - a[0] - d[0] * t, y - a[1] - d[1] * t, z - a[2] - d[2] * t));
  }
  return best;
}
const TRUNK = [[0, 0.68, 0.25], [0, 0.6, 0.3], [0, 0.52, 0.325], [0, 0.44, 0.335], [0, 0.38, 0.335]];

/** 흔한 몸 규칙: 꼬리 → 팔 → 다리 → 몸 */
function bodyPart(x, y, z, b) {
  const ax = Math.abs(x);
  if (b.tail && z < b.tail.z && y > b.tail.y0 && y < b.tail.y1 && ax < b.tail.ax) return P.tail;
  const T = b.arm.T0 - b.arm.k * Math.max(0, y - b.arm.Ty);
  if (y > b.arm.y0 && y < b.arm.y1 && ax > T) return side(x, P.armR, P.armL);
  if (y < b.leg) return side(x, P.legR, P.legL);
  return P.body;
}

/* 기본 움직임 값 (강아지 = 예전 그대로) */
const MOVE0 = {
  gait: 7.5, speed: 0.5, bob: 0.035, roll: 0.07, armSwing: 0.55, legLift: 0.045, legStep: 0.06,
  ear: 0.14, earBase: 0.05, earHappy: 0.25, earAx: [0, 0, 1],
  tail: 0.35, tailRate: 8, tailAx: [0, 1, 0], hop: 0, size: 1,
};

export const SPECIES = {
  /* ---------- 강아지 (시험 2 그대로) ---------- */
  dog: {
    name: "강아지", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const ax = Math.abs(x), R = x > 0;
      const hy = (y - 0.77) / 0.245, hz = (z + 0.035) / 0.25;
      const hx = 0.25 * Math.sqrt(Math.max(0, 1 - hy * hy - hz * hz));
      if (y > 0.57 && y < 0.985 && ax > 0.15 && ax > hx + 0.012 && z > -0.22 && z < 0.26) return R ? P.earR : P.earL;
      const h = (x / 0.25) ** 2 + hy * hy + hz * hz;
      if (y > 0.537 + 1.6 * x * x && h < 1.6) return P.head;
      if (z < -0.185 && y > 0.17 && y < 0.37 && ax < 0.1) return P.tail;
      const T = 0.2 - 0.6 * Math.max(0, y - 0.4);
      if (y > 0.26 && y < 0.53 && ax > T) return R ? P.armR : P.armL;
      if (y < 0.175) return R ? P.legR : P.legL;
      return P.body;
    },
    merge: { tail: "body" }, // 앞에서 안 보이는 부위 → 이 부위 색
    pivot: { arm: [0.155, 0.47, 0.04], leg: 0.2, ear: [0.215, 0.93, -0.03], head: [0, 0.53, 0], tail: [0, 0.27, -0.17] },
    face: {
      eyes: [[-0.104, 0.711], [0.104, 0.711]], eyeR: [0.026, 0.022],
      nose: { type: "tri", x: 0, y: 0.684, w: 0.072, h: 0.046 },
      mouth: { type: "w", y: 0.632, w: 0.064, h: 0.022, top: 0.656 },
      toes: [[0.085, 0.0], [0.145, 0.0]], toeH: 0.042,
    },
    move: {},
    sound: "dog",
  },

  /* ---------- 고양이: 뾰족 귀, 동그란 꼬리 ---------- */
  cat: {
    name: "고양이", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const h = ell(x, y, z, [0, 0.705, -0.015], [0.31, 0.255, 0.285]);
      const ax = Math.abs(x);
      // 귀 밑선: 안쪽 (0.12, 0.955) → 바깥 (0.29, 0.845) 비스듬한 직선
      if (ax > 0.1 && y > 0.955 - (ax - 0.12) * 0.65 && z > -0.12 && z < 0.1) return side(x, P.earR, P.earL);
      if (y > 0.455 + 1.2 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.21, y0: 0.12, y1: 0.31, ax: 0.1 }, arm: { y0: 0.26, y1: 0.47, T0: 0.205, k: 0.55, Ty: 0.37 }, leg: 0.135 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.17, 0.42, 0.0], leg: 0.16, ear: [0.2, 0.9, -0.02], head: [0, 0.46, 0], tail: [0, 0.22, -0.2] },
    face: {
      eyes: [[-0.167, 0.646], [0.167, 0.646]], eyeR: [0.03, 0.03],
      nose: { type: "tri", x: 0, y: 0.611, w: 0.052, h: 0.032 },
      mouth: { type: "w", y: 0.566, w: 0.05, h: 0.018, top: 0.588 },
      toes: [[0.078, 0.0], [0.13, 0.0]], toeH: 0.032,
    },
    move: { gait: 8, bob: 0.03, ear: 0.08, earBase: 0.02, tail: 0.5, tailRate: 6 },
    sound: "cat",
  },

  /* ---------- 곰: 동그란 귀, 주둥이 ---------- */
  bear: {
    name: "곰", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      if (ell(x, y, z, [0, 0.672, 0.29], [0.125, 0.1, 0.08]) < 1) return P.snout;
      const h = ell(x, y, z, [0, 0.775, -0.005], [0.285, 0.225, 0.262]);
      if (y > 0.84 && Math.abs(x) > 0.13 && h > 1.02) return side(x, P.earR, P.earL);
      if (y > 0.555 + 1.0 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.27, y0: 0.18, y1: 0.36, ax: 0.1 }, arm: { y0: 0.33, y1: 0.545, T0: 0.245, k: 0.5, Ty: 0.44 }, leg: 0.165 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.21, 0.5, 0.0], leg: 0.2, ear: [0.2, 0.92, -0.02], head: [0, 0.56, 0], tail: [0, 0.27, -0.27] },
    face: {
      eyes: [[-0.121, 0.758], [0.121, 0.758]], eyeR: [0.022, 0.022],
      nose: { type: "oval", x: 0, y: 0.725, w: 0.07, h: 0.042 },
      mouth: { type: "w", y: 0.64, w: 0.055, h: 0.02, top: 0.665 },
      toes: [[0.09, 0.0], [0.15, 0.0]], toeH: 0.035,
    },
    move: { gait: 6, speed: 0.42, bob: 0.03, roll: 0.1, ear: 0.06, earBase: 0.02, earHappy: 0.12, tail: 0.25, size: 1.04 },
    sound: "bear",
  },

  /* ---------- 토끼: 긴 귀, 깡충 ---------- */
  rabbit: {
    name: "토끼", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const h = ell(x, y, z, [0, 0.578, -0.015], [0.228, 0.185, 0.225]);
      if (y > 0.7 && h > 1.0 && Math.abs(x) > 0.02) return side(x, P.earR, P.earL);
      if (y > 0.4 + 1.0 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.18, y0: 0.12, y1: 0.28, ax: 0.09 }, arm: { y0: 0.21, y1: 0.41, T0: 0.165, k: 0.5, Ty: 0.32 }, leg: 0.13 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.13, 0.37, 0.0], leg: 0.15, ear: [0.08, 0.74, -0.05], head: [0, 0.41, 0], tail: [0, 0.2, -0.18] },
    face: {
      eyes: [[-0.113, 0.568], [0.113, 0.568]], eyeR: [0.02, 0.022],
      nose: { type: "tri", x: 0, y: 0.546, w: 0.04, h: 0.026 },
      mouth: { type: "w", y: 0.51, w: 0.04, h: 0.015, top: 0.528 },
    },
    move: { gait: 5.5, speed: 0.55, bob: 0.0, hop: 0.13, roll: 0.03, armSwing: 0.25, legLift: 0.0, legStep: 0.0, ear: 0.18, earBase: 0.0, earHappy: 0.3, earAx: [1, 0, 0], tail: 0.3, size: 0.98 },
    sound: "rabbit",
  },

  /* ---------- 돼지: 접힌 귀, 코 ---------- */
  pig: {
    name: "돼지", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      if (z > 0.21 && ell(x, y, z, [0, 0.7, 0.3], [0.115, 0.085, 0.12]) < 1) return P.snout;
      const h = ell(x, y, z, [0, 0.74, -0.03], [0.28, 0.215, 0.245]);
      const ax = Math.abs(x);
      if (ax > 0.1 && y > 0.975 - (ax - 0.1) * 0.76 && z > -0.14) return side(x, P.earR, P.earL);
      if (y > 0.535 + 1.0 * x * x && h < 2.4) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.25, y0: 0.16, y1: 0.32, ax: 0.1 }, arm: { y0: 0.28, y1: 0.54, T0: 0.232, k: 0.5, Ty: 0.42 }, leg: 0.15 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.2, 0.47, 0.0], leg: 0.18, ear: [0.2, 0.9, -0.02], head: [0, 0.54, 0], tail: [0, 0.24, -0.25] },
    face: {
      eyes: [[-0.149, 0.752], [0.149, 0.752]], eyeR: [0.022, 0.022],
      nose: { type: "pig", x: 0, y: 0.705, w: 0.024, h: 0.034, gap: 0.04 },
      mouth: { type: "smile", y: 0.6, w: 0.05, h: 0.02 },
      toes: [[0.125, 0.0]], toeH: 0.04,
    },
    move: { gait: 9, speed: 0.48, bob: 0.04, roll: 0.06, ear: 0.1, earBase: 0.03, tail: 0.6, tailRate: 14 },
    sound: "pig",
  },

  /* ---------- 사자: 갈기 ---------- */
  lion: {
    name: "사자", K: 900, CX: 512, OY: 966,
    smooth: 9, // 갈기 방울 때문에 얼굴 경계가 울퉁불퉁 → 더 매끈하게
    part(x, y, z) {
      const ax = Math.abs(x);
      if (ell(ax, y, z, [0.215, 0.866, 0.09], [0.078, 0.078, 0.14]) < 1) return side(x, P.earR, P.earL);
      // 얼굴: 정면에서 본 타원 안 + 갈기보다 앞(z) — 얼굴은 갈기 앞에 붙은 납작한 원판 모양
      const f = (x / 0.25) ** 2 + ((y - 0.665) / 0.22) ** 2;
      if (y > 0.42 && f < 1.0 && z > 0.04) return P.head;
      if (y > 0.455 + 0.8 * x * x) return P.mane;
      return bodyPart(x, y, z, { tail: { z: -0.19, y0: 0.13, y1: 0.3, ax: 0.1 }, arm: { y0: 0.22, y1: 0.39, T0: 0.18, k: 0.5, Ty: 0.34 }, leg: 0.145 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.15, 0.38, 0.0], leg: 0.17, ear: [0.215, 0.85, 0.0], head: [0, 0.43, 0], tail: [0, 0.2, -0.2] },
    face: {
      eyes: [[-0.135, 0.64], [0.135, 0.64]], eyeR: [0.022, 0.024],
      nose: { type: "tri", x: 0, y: 0.598, w: 0.06, h: 0.036 },
      mouth: { type: "w", y: 0.553, w: 0.052, h: 0.02, top: 0.576 },
      toes: [[0.06, 0.0], [0.12, 0.0]], toeH: 0.035,
    },
    move: { gait: 7, speed: 0.48, bob: 0.035, ear: 0.06, earBase: 0.0, earHappy: 0.1, tail: 0.3, size: 1.03 },
    sound: "lion",
  },

  /* ---------- 코끼리: 큰 귀, 긴 코 ---------- */
  elephant: {
    name: "코끼리", K: 840, CX: 512, OY: 940,
    part(x, y, z) {
      const ax = Math.abs(x);
      if (y > 0.36 && y < 0.72 && distLine(x, y, z, TRUNK) < 0.078) return P.snout;
      const hy = (y - 0.765) / 0.23, hz = (z - 0.0) / 0.255;
      const hx = 0.215 * Math.sqrt(Math.max(0, 1 - hy * hy - hz * hz));
      if (y > 0.54 && y < 0.96 && ax > 0.17 && ax > hx + 0.01 && z > -0.2) return side(x, P.earR, P.earL);
      const h = (x / 0.215) ** 2 + hy * hy + hz * hz;
      if (y > 0.535 + 1.0 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.24, y0: 0.15, y1: 0.32, ax: 0.1 }, arm: { y0: 0.29, y1: 0.55, T0: 0.23, k: 0.5, Ty: 0.42 }, leg: 0.15 });
    },
    merge: { tail: "body" },
    swing: "snout", // 꼬리 대신 코를 흔듦
    pivot: { arm: [0.2, 0.48, 0.0], leg: 0.18, ear: [0.19, 0.76, -0.02], head: [0, 0.54, 0], tail: [0, 0.66, 0.24] },
    face: {
      eyes: [[-0.151, 0.729], [0.151, 0.729]], eyeR: [0.02, 0.022],
      nose: { type: "none" },
      mouth: { type: "none" },
      toes: [[0.07, 0.0], [0.13, 0.0]], toeH: 0.035,
    },
    move: { gait: 5, speed: 0.36, bob: 0.02, roll: 0.1, armSwing: 0.4, ear: 0.3, earBase: 0.0, earHappy: 0.35, earAx: [0, 1, 0], tail: 0.22, tailRate: 3.2, tailAx: [0, 0, 1], size: 1.1 },
    sound: "elephant",
  },

  /* ---------- 공룡: 등 뿔, 긴 꼬리 ---------- */
  dino: {
    name: "공룡", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const ax = Math.abs(x);
      const h = ell(x, y, z, [0, 0.7, 0.0], [0.245, 0.228, 0.235]);
      if (y > 0.46 && h > 1.12 && ax < 0.135 && (y > 0.86 || (z < -0.19 && y > 0.62 && h > 1.25))) return P.spike;
      if (y > 0.4 && y < 0.64 && z < (y > 0.5 ? -0.25 : -0.215) && ax < 0.1) return P.spike; // 목·등 뿔
      if (y > 0.47 + 1.0 * x * x && h < 1.7) return P.head;
      // 꼬리: 몸 뒤로 나온 굵은 관 + 앞에서 보이는 오른쪽 끝
      const tTop = 0.42 + (z + 0.13) * 0.55; // 꼬리 윗면 (z 가 작을수록 낮음)
      if (z < -0.18 && y < 0.44 && y > 0.06) return y > tTop + 0.025 ? P.spike : P.tail;
      if (x > 0.205 && y < 0.27 && y > 0.07 && z < 0.02) return P.tail;
      return bodyPart(x, y, z, { arm: { y0: 0.29, y1: 0.48, T0: 0.175, k: 0.5, Ty: 0.38 }, leg: 0.12 });
    },
    merge: {},
    pivot: { arm: [0.15, 0.43, 0.0], leg: 0.14, ear: [0.2, 0.9, 0.0], head: [0, 0.48, 0], tail: [0, 0.25, -0.13] },
    face: {
      eyes: [[-0.131, 0.664], [0.131, 0.664]], eyeR: [0.03, 0.032],
      nose: { type: "dots", x: 0, y: 0.615, w: 0.012, h: 0.01, gap: 0.035 },
      mouth: { type: "smile", y: 0.57, w: 0.075, h: 0.028 },
      toes: [[0.09, 0.0], [0.15, 0.0]], toeH: 0.035,
    },
    move: { gait: 6.5, speed: 0.42, bob: 0.03, roll: 0.1, tail: 0.45, tailRate: 3, ear: 0, earBase: 0, earHappy: 0, size: 1.06 },
    sound: "dino",
  },
};
export const ORDER = ["dog", "cat", "bear", "rabbit", "pig", "lion", "elephant", "dino"];
for (const id of ORDER) {
  const s = SPECIES[id];
  s.id = id;
  s.move = Object.assign({}, MOVE0, s.move);
}
