/* =====================================================================
   🧸 3D 인형 친구 — 종별 설정 + 도안 굽기 (시험판 lab/doll 의 species.js·bake.js·glb.js 를 앱용으로 옮김)
   - 앱에서는 미리 구운 결과(assets/doll/<종>.bin·-map.png·-lines.png, tools/doll-bake.js 가 만듦)를 읽어 씀
     → 저가 태블릿에서도 도안 고르기 즉시. 이 파일의 bake() 는 생성 도구와 '파일을 못 읽었을 때' 대체용
   - KP.DOLL 에 모아 둠 (ES 모듈이 아닌 일반 스크립트: 빌드가 js/games/** 를 그대로 불러옴)
===================================================================== */
"use strict";
(function () {
/* =====================================================================
   종별 설정 (8종) — 굽기(bake.js)·움직임(stage.js)·예시(examples.js)가 함께 씀
   모델 좌표: 키 1, 발바닥 y=0, 정면 +z, 오른쪽 +x (lab/doll/pipeline/clean.js 가 맞춤)
   그림 좌표: px = CX + x·K, py = OY − y·K  (도안·텍스처 S=1024 정사각형)
   part(x,y,z) → 부위 번호 : 모델의 '겉면 한 점'이 어느 부위인지 (같은 규칙으로 도안 경계·UV 고치기·움직임 가중치)
   face : 도안·3D 얼굴 (눈·코·입 위치는 모델의 볼록한 자리에 맞춤 — tools/out/doll8/probe.js 로 잼)
   move : 움직임 차이 (걸음 빠르기·흔들림·깡충·꼬리/코 흔들기)
===================================================================== */
const PARTS = ["bg", "head", "earR", "earL", "body", "armR", "armL", "legR", "legL", "tail", "snout", "mane", "spike"];
const P = Object.fromEntries(PARTS.map((n, i) => [n, i]));

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

const SPECIES = {
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
const ORDER = ["dog", "cat", "bear", "rabbit", "pig", "lion", "elephant", "dino"];
for (const id of ORDER) {
  const s = SPECIES[id];
  s.id = id;
  s.move = Object.assign({}, MOVE0, s.move);
}

/* =====================================================================
   인형 굽기 — 3D 모델 하나에서 (1) 정면 투영 UV (2) 색칠 도안 (3) 칠하기용 영역 지도 를 만듦
   - 모든 그림 좌표 = 정면에서 직교 투영한 좌표 (S×S 정사각형). 아이 캔버스 = 도안 = 텍스처.
   - 부위(머리·귀·몸·팔·다리·꼬리 + 종 특징: 주둥이/코·갈기·뿔)는 종마다 손으로 정한 간단한 규칙(species.js 의 part) 으로 나눔.
     같은 규칙으로 ① 도안의 부위 경계선 ② 가려진 면의 UV 고치기 ③ 움직임 가중치 를 모두 만듦.
   - 안 보이는 면 처리:
       뒷면 = 같은 (x,y) 를 그대로 씀 → 앞 그림이 거울처럼 비침 (얼굴 눈코입은 앞면만)
       다른 부위에 가려진 면(귀 밑 머리 옆, 팔 뒤 몸 옆, 꼬리) = 그 부위의 '가장 가까운 보이는 곳' 색
       옆면 늘어짐 = 그림 바깥으로 색 번지기(bleed) + 3D 에서 옆면일수록 흐린 밉맵으로 읽기
===================================================================== */
const S = 1024; // 도안·텍스처 크기 (종 설정의 CX·OY·K 는 이 크기 기준)
const DOG = SPECIES.dog; // 예전 이름 (시험 2)

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
function edt(src, w, h) {
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

/* ---------- 작은 부위 조각 없애기: 같은 부위로 이어진 덩어리가 minA 칸보다 작으면 둘레에 가장 많은 부위로 ----------
   (예: 공룡 꼬리 뿔 끝이 앞에서 몇 칸만 보임 → 칠하기 힘든 부스러기 영역이 생기지 않게) */
function dropSpecks(label, W, minA) {
  const seen = new Uint8Array(W * W), st = new Int32Array(W * W), fix = [];
  for (let s0 = 0; s0 < W * W; s0++) {
    if (!label[s0] || seen[s0]) continue;
    const L = label[s0];
    let sp = 0, n = 0;
    st[sp++] = s0; seen[s0] = 1;
    const cells = [], around = new Map();
    while (sp) {
      const i = st[--sp], x = i % W;
      n++;
      if (n <= minA) cells.push(i);
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
        if (j < 0 || j >= W * W) continue;
        const b = label[j];
        if (b === L) { if (!seen[j]) { seen[j] = 1; st[sp++] = j; } }
        else if (b) around.set(b, (around.get(b) || 0) + 1);
      }
    }
    if (n < minA && around.size) {
      let best = 0, bn = -1;
      for (const [b, c] of around) if (c > bn) { bn = c; best = b; }
      fix.push([cells, best]);
    }
  }
  for (const [cells, b] of fix) for (const i of cells) label[i] = b;
  return fix.length;
}

/* ---------- 실루엣의 아주 좁은 틈 메우기 (닫힘 연산, 반지름 r 칸) ----------
   (예: 고양이 턱 밑과 어깨 사이 몇 칸짜리 틈 → 도안에 선이 두 줄로 겹쳐 보임) 메운 칸은 가장 가까운 부위로 */
function closeGaps(label, W, r) {
  const fg = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) fg[i] = label[i] ? 1 : 0;
  const dFg = edt(fg, W, W);
  const outD = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) outD[i] = dFg[i] > r ? 1 : 0;
  const dOut = edt(outD, W, W);
  const add = new Uint8Array(W * W);
  let n = 0;
  for (let i = 0; i < W * W; i++) if (!fg[i] && dOut[i] > r + 0.5) { add[i] = 1; n++; }
  if (!n) return 0;
  const near = nearestSeed(fg, W, W, null);
  for (let i = 0; i < W * W; i++) if (add[i]) label[i] = label[near[i]];
  return n;
}

/* ---------- 얇은 띠 없애기 (부위별 열림 연산을 한 번에) ----------
   경계(다른 부위·바깥과 닿은 칸)에서 r 보다 먼 칸 = 속. 모든 칸을 '가장 가까운 속 칸'의 부위로 다시 정함
   → 폭 2r 보다 얇은 띠(예: 고양이 턱 밑 실 같은 띠)는 옆 부위로 흡수, 두꺼운 부위 경계는 그대로 */
function openLabels(label, W, r) {
  const edge = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) {
    const L = label[i];
    if (!L) continue;
    const x = i % W;
    if ((x > 0 && label[i - 1] !== L) || (x < W - 1 && label[i + 1] !== L) || (i >= W && label[i - W] !== L) || (i < W * W - W && label[i + W] !== L)) edge[i] = 1;
  }
  const d = edt(edge, W, W), core = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) core[i] = label[i] && d[i] > r ? 1 : 0;
  const near = nearestSeed(core, W, W, null), out = label.slice();
  for (let i = 0; i < W * W; i++) if (label[i] && near[i] >= 0) out[i] = label[near[i]];
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
/** opt.W: 도안 크기 (기본 1024. 3D 에만 쓰는 다른 종은 512 로 약 4배 빨리) */
function bake(model, spec = DOG, opt = {}) {
  const t0 = performance.now();
  const pos = model.POSITION, idx = model.index, nv = pos.length / 3;
  const W = opt.W || S, f = W / S;
  const K = spec.K * f, CX = spec.CX * f, OY = spec.OY * f;
  // 앞에서 안 보이는 부위 → 다른 부위 색 (예: 강아지 꼬리 → 몸)
  const mergeTo = PARTS.map((n, i) => (spec.merge && spec.merge[n] ? P[spec.merge[n]] : i));
  const depth = rasterFront(pos, idx, spec, W);
  const label = new Uint8Array(W * W);
  for (let py = 0; py < W; py++)
    for (let px = 0; px < W; px++) {
      const i = py * W + px;
      if (depth[i] < -1e8) continue;
      label[i] = mergeTo[spec.part((px + 0.5 - CX) / K, (OY - py - 0.5) / K, depth[i])];
    }
  smoothLabels(label, W, Math.max(2, Math.round((spec.smooth || 5) * f)));
  closeGaps(label, W, 5 * f);
  openLabels(label, W, 4.5 * f);
  const specks = dropSpecks(label, W, Math.round(1400 * f * f));
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
  const LW_OUT = 4.2 * f, LW_IN = 2.9 * f;
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
  lg.save();
  lg.scale(f, f);
  drawFace(lg, spec, "sheet");
  lg.restore();
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
  // 아주 작은 영역(선 사이 틈 — 손가락으로 못 채움)은 따로 두지 않고 가까운 큰 영역에 붙임
  const regArea = new Int32Array(nReg);
  for (let i = 0; i < W * W; i++) if (region[i] >= 0) regArea[region[i]]++;
  const minReg = Math.round(500 * f * f);
  let tiny = 0;
  for (let r = 0; r < nReg; r++) if (regArea[r] < minReg) tiny++;
  // 선 칸(실루엣 안·선 위)도 가까운 영역에 붙여 채울 때 같이 칠함 → 3D 에 흰 이음매가 안 생김
  const seedR = new Uint8Array(W * W), allowR = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) { seedR[i] = region[i] >= 0 && regArea[region[i]] >= minReg ? 1 : 0; allowR[i] = region[i] >= 0 || line[i] || label[i] ? 1 : 0; }
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
  for (let i = 0; i < W * W; i++) inner[i] = label[i] && dOut[i] > 2.5 * f ? 1 : 0;
  const bleed = nearestSeed(inner, W, W, null);

  // 부위별 '가장 가까운 보이는 칸' (반 크기, 선 피해서 4칸 안쪽)
  const H = W / 2, nearPart = {};
  for (let L = 1; L < PARTS.length; L++) {
    const sd = new Uint8Array(H * H);
    let any = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < H; x++) {
      const i = y * 2 * W + x * 2;
      if (label[i] === L && dIn[i] > 5 * f && dOut[i] > 5 * f) { sd[y * H + x] = 1; any = 1; }
    }
    if (any) nearPart[L] = nearestSeed(sd, H, H, null);
  }

  // 정점마다: 부위, UV, 가중치
  const part = new Uint8Array(nv), uv = new Float32Array(nv * 2), fixed = new Uint8Array(nv);
  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let L = spec.part(x, y, z);
    part[v] = L;
    L = mergeTo[L];
    let px = CX + x * K, py = OY - y * K;
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
  const weights = makeWeights(model, part, spec);
  // 부위별 보이는 범위 (모델 좌표) — 예시 그림이 부위 기준으로 그리게
  const box = {};
  for (let i = 0; i < W * W; i++) {
    const L = label[i];
    if (!L) continue;
    const x = ((i % W) + 0.5 - CX) / K, y = (OY - ((i / W) | 0) - 0.5) / K;
    const b = box[PARTS[L]] || (box[PARTS[L]] = { x0: 9, x1: -9, y0: 9, y1: -9, sx: 0, sy: 0, n: 0 });
    if (x < b.x0) b.x0 = x;
    if (x > b.x1) b.x1 = x;
    if (y < b.y0) b.y0 = y;
    if (y > b.y1) b.y1 = y;
    b.sx += x; b.sy += y; b.n++;
  }
  for (const k in box) { const b = box[k]; b.cx = b.sx / b.n; b.cy = b.sy / b.n; }
  return {
    S: W, f, spec, label, line, lineC, region, fillOf, regPart, nReg, regStart: cnt, regList: list, bleed, uv, part, fixed, weights, box,
    X: (x) => CX + x * K, Y: (y) => OY - y * K,
    ms: Math.round(performance.now() - t0),
    stats: { fixedVerts: fixed.reduce((a, b) => a + b, 0), regions: nReg - tiny, tiny, specks },
  };
}

/* ---------- 움직임 가중치: 부위 표시를 이웃 평균으로 부드럽게 (이음매 찢어짐 방지) ---------- */
function makeWeights(model, part, spec) {
  const pos = model.POSITION, idx = model.index, nv = pos.length / 3;
  const nb = Array.from({ length: nv }, () => []);
  for (let t = 0; t < idx.length; t += 3)
    for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) { nb[a].push(b); nb[b].push(a); }
  // 채널: armR, armL, legR, legL, earR, earL, 머리 묶음(귀·주둥이·갈기·머리 뿔), 흔들기(꼬리 — 코끼리는 코)
  // 뿔(spike)은 목(머리 중심점) 위면 머리와 함께, 아래(등·꼬리)면 꼬리와 함께 움직임
  const neckY = spec.pivot.head[1];
  const swingPart = spec.swing ? P[spec.swing] : P.tail;
  const HEAD = [P.head, P.earR, P.earL, P.snout, P.mane];
  const inHead = (v) => HEAD.includes(part[v]) || (part[v] === P.spike && pos[v * 3 + 1] > neckY);
  const inSwing = (v) => part[v] === swingPart || (part[v] === P.spike && pos[v * 3 + 1] <= neckY);
  const ch = [[P.armR], [P.armL], [P.legR], [P.legL], [P.earR], [P.earL], inHead, inSwing];
  const out = ch.map((set) => {
    let w = new Float32Array(nv);
    for (let v = 0; v < nv; v++) w[v] = (typeof set === "function" ? set(v) : set.includes(part[v])) ? 1 : 0;
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

/* ---------- 얼굴 (도안: 검은 선/칠, 3D: 얼굴 덧칠 텍스처) — 그림 좌표는 S=1024 기준 ---------- */
function drawFace(g, spec, mode) {
  const F = spec.face, X = (x) => spec.CX + x * spec.K, Y = (y) => spec.OY - y * spec.K, L = (l) => l * spec.K;
  const sheet = mode === "sheet";
  g.save();
  const ink = sheet ? "#222" : "#1d1714", soft = sheet ? ink : "#4a3631";
  g.fillStyle = ink;
  g.strokeStyle = ink;
  g.lineCap = g.lineJoin = "round";
  // 눈
  for (const [x, y] of F.eyes) {
    g.beginPath();
    g.ellipse(X(x), Y(y), L(F.eyeR[0]), L(F.eyeR[1]), 0, 0, Math.PI * 2);
    g.fill();
    if (!sheet) {
      g.fillStyle = "rgba(255,255,255,.9)";
      g.beginPath();
      g.arc(X(x) - L(F.eyeR[0]) * 0.35, Y(y) - L(F.eyeR[1]) * 0.4, L(F.eyeR[0]) * 0.28, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = ink;
    }
  }
  // 코: tri(둥근 역삼각형) · oval · pig(콧구멍 둘, 돼지) · dots(작은 콧구멍) · none
  const N = F.nose || { type: "none" };
  const nx = X(N.x || 0), ny = Y(N.y || 0), nw = L(N.w || 0) / 2, nh = L(N.h || 0) / 2;
  g.fillStyle = soft;
  if (N.type === "tri" || N.type === "oval") {
    g.beginPath();
    if (N.type === "tri") {
      g.moveTo(nx - nw, ny - nh * 0.7);
      g.quadraticCurveTo(nx, ny - nh * 1.35, nx + nw, ny - nh * 0.7);
      g.quadraticCurveTo(nx + nw * 0.9, ny + nh * 0.2, nx, ny + nh);
      g.quadraticCurveTo(nx - nw * 0.9, ny + nh * 0.2, nx - nw, ny - nh * 0.7);
    } else g.ellipse(nx, ny, nw, nh, 0, 0, Math.PI * 2);
    g.fill();
  } else if (N.type === "pig" || N.type === "dots") {
    if (!sheet) g.fillStyle = N.type === "pig" ? "#8a4f55" : "#4a3631";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(nx + (s * L(N.gap)) / 2, ny, nw, nh, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // 입: w(ω, 코 밑 줄 포함) · smile(웃는 선) · none
  const M = F.mouth || { type: "none" };
  g.lineWidth = sheet ? 5.5 : 6;
  g.strokeStyle = soft;
  if (M.type === "w") {
    const my = Y(M.y), mw = L(M.w), mh = L(M.h), top = Y(M.top);
    g.beginPath();
    g.moveTo(nx, ny + nh);
    g.lineTo(nx, top + 2);
    g.moveTo(nx - mw, my - mh * 0.6);
    g.quadraticCurveTo(nx - mw * 0.5, my + mh * 1.2, nx, top);
    g.quadraticCurveTo(nx + mw * 0.5, my + mh * 1.2, nx + mw, my - mh * 0.6);
    g.stroke();
  } else if (M.type === "smile") {
    const mx = X(M.x || 0), my = Y(M.y), mw = L(M.w), mh = L(M.h);
    g.beginPath();
    g.moveTo(mx - mw, my - mh * 0.5);
    g.quadraticCurveTo(mx, my + mh * 1.5, mx + mw, my - mh * 0.5);
    g.stroke();
  }
  // 발가락 줄 (도안에만)
  if (sheet && F.toes) {
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
/** 3D 얼굴 덧칠 텍스처 (같은 종이 같이 씀) */
function faceCanvas(spec = DOG) {
  const c = document.createElement("canvas");
  c.width = c.height = S;
  drawFace(c.getContext("2d"), spec, "3d");
  return c;
}

/* 아주 작은 GLB 읽기 (한 메시·한 프리미티브, 압축 없음) — GLTFLoader 를 들이지 않으려고 직접 읽음
   models/<종>.glb 는 lab/doll/pipeline/clean.js 가 만든 파일: POSITION, NORMAL, _AO(정점 그늘, 0~255) */
const CT = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
async function loadGLB(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("모델을 못 읽었어요: " + url);
  const buf = await r.arrayBuffer();
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("GLB 가 아니에요");
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const binOff = 20 + jl + 8;
  const acc = (i) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
    const T = CT[a.componentType], n = a.count * NC[a.type];
    const s = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new T(buf.slice(s, s + n * T.BYTES_PER_ELEMENT));
  };
  const p = json.meshes[0].primitives[0];
  const out = { index: acc(p.indices), extras: json.meshes[0].extras || {} };
  for (const k in p.attributes) out[k] = acc(p.attributes[k]);
  return out;
}

  KP.DOLL = Object.assign(KP.DOLL || {}, { PARTS, P, SPECIES, ORDER, S, edt, nearestSeed, bake, makeWeights, drawFace, faceCanvas, loadGLB });
})();
