/* =====================================================================
   물감 공용 엔진 — 물감 실험실·색깔 섞기·색 주문 맞추기·데칼코마니·팔레트가 함께 씀
   - KP.paint.mix(v)        : 물감 양 [빨,노,파,하,검] → RGB — 진짜 물감처럼 (Kubelka–Munk, spectral.js 3.0.0 방식·MIT,
                              라이선스 원문 vendor/spectral.LICENSE). 검증표: tools/out/paint2/swatch.js
   - KP.paint.nameOf(rgb)   : 가장 가까운 한국어 색 이름 (색마다 대표 레시피 → 같은 엔진으로 기준색)
   - KP.paint.mine / saveMine(hex, 이름, 비율) : 내 물감 통 (아이가 만든 색, 기기 저장) · pick/takePick: 칠하러 가기
   - KP.paint.dex / discover  : 색깔 도감 (처음 만든 색 기록)
   - KP.paint.advise(...)   : 목표 색으로 가려면 어떤 물감을 더 넣을지
   - KP.paint.bowl(host)    : 손가락으로 젓는 물감 그릇 (격자 유체 + 두께 음영·광택·주걱 자국)
   - KP.paint.studio(o)     : 점토 튜브 + 그릇 + 나무 주걱 작업대 · KP.paint.stageBg(el): 점토 작업실 배경(팔레트를 그릇 밑에)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const P = (KP.paint = {});

  /* ---------------- 기본 물감 ---------------- */
  P.BASE = [
    { id: 0, key: "r", n: "빨강", hex: "#e0204a" }, // 살짝 자홍 쪽 빨강 → 빨+파가 탁한 밤색이 아닌 보라로
    { id: 1, key: "y", n: "노랑", hex: "#ffd200" },
    { id: 2, key: "b", n: "파랑", hex: "#2a62f0" },
    { id: 3, key: "w", n: "하양", hex: "#ffffff" },
    { id: 4, key: "k", n: "검정", hex: "#2a2a33" },
  ];

  /* ---------------- 물감 혼합 (Kubelka–Munk) ----------------
     진짜 물감처럼 섞기: 색마다 빛 반사 곡선(380~750nm, 10nm 간격 38칸)을 만들고,
     흡수/산란 비(K/S)를 물감 양으로 가중 평균 → 다시 반사 곡선 → 눈에 보이는 색(XYZ → sRGB)
     - 노랑+파랑 = 초록, 빨강+노랑 = 주황, 셋 다 = 갈색, 하양 = 파스텔(틴트), 검정은 조금만 넣어도 진해짐
     - 수식과 기준 반사 곡선(SPD)·CIE 표(CMF)·행렬은 spectral.js 3.0.0 (MIT License,
       Copyright (c) 2025 Ronald van Wijnen, https://github.com/rvanwijnen/spectral.js) 에서 옮겨 씀
       → 라이선스 원문: vendor/spectral.LICENSE
     - 물감마다 착색력(ts): 하양·검정은 너무 세지 않게 조정 (검정 한 방울에 전체가 시커매지지 않게) */
  const SPD = {
    W: [1.00116,1.00116,1.00116,1.00116,1.00115,1.00113,1.00109,1.001,1.00087,1.0007,1.0005,1.00031,1.00012,0.999953,0.999822,0.999739,0.99971,0.999732,0.999799,0.9999,1.00002,1.00014,1.00026,1.00036,1.00043,1.00048,1.00051,1.00053,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054,1.00054],
    C: [0.970585,0.970592,0.970625,0.970787,0.971369,0.973163,0.97674,0.981588,0.98628,0.989949,0.992493,0.994146,0.995184,0.995757,0.995913,0.995606,0.994598,0.992216,0.986236,0.967943,0.891285,0.536202,0.154108,0.0574575,0.031535,0.0222634,0.0182023,0.0162991,0.0153656,0.0149112,0.0146954,0.0145964,0.014547,0.0145229,0.014512,0.0145067,0.0145045,0.0145038],
    M: [0.990674,0.990672,0.990663,0.990618,0.990451,0.989871,0.988287,0.984291,0.973935,0.941818,0.81739,0.432473,0.138454,0.0537347,0.0292175,0.0213137,0.020135,0.0241323,0.0372236,0.0760507,0.205375,0.541269,0.815842,0.912818,0.94634,0.959928,0.966261,0.969326,0.970855,0.971605,0.971963,0.972127,0.972209,0.97225,0.972268,0.972277,0.97228,0.972281],
    Y: [0.0210523,0.0210565,0.0210746,0.0211649,0.0215028,0.0226739,0.0258236,0.0334879,0.051907,0.100749,0.23913,0.534804,0.797808,0.91145,0.953798,0.971242,0.979303,0.98338,0.985461,0.986435,0.986738,0.986618,0.986278,0.985861,0.985475,0.985177,0.984972,0.984846,0.984775,0.984738,0.98472,0.984711,0.984707,0.984705,0.984704,0.984703,0.984703,0.984703],
    R: [0.0315606,0.0315521,0.0315148,0.0313318,0.030673,0.028648,0.024645,0.0192961,0.0142067,0.0102943,0.00761915,0.00589804,0.00482332,0.00422987,0.00405992,0.00435337,0.00534344,0.00769172,0.013597,0.0316975,0.107861,0.463813,0.847055,0.943185,0.968862,0.978031,0.982044,0.983924,0.984845,0.985294,0.985507,0.985605,0.985654,0.985678,0.985688,0.985694,0.985696,0.985697],
    G: [0.00955607,0.00955816,0.00956732,0.00961291,0.00978371,0.0103786,0.0120026,0.0160978,0.0267062,0.0595555,0.18604,0.57058,0.861468,0.945879,0.970465,0.978414,0.979589,0.975534,0.962289,0.923122,0.793434,0.45927,0.185574,0.0881775,0.054363,0.0406288,0.0342215,0.0311186,0.0295709,0.0288109,0.0284486,0.028282,0.0281988,0.0281582,0.0281399,0.0281309,0.0281271,0.028126],
    B: [0.979405,0.979401,0.979383,0.979294,0.978963,0.977814,0.974724,0.967198,0.94908,0.90085,0.76315,0.465922,0.201263,0.0877524,0.0457177,0.0284706,0.0205272,0.0165303,0.0145135,0.0136004,0.0133604,0.0135489,0.0139594,0.0144434,0.0148854,0.0152254,0.0154593,0.0156018,0.0156825,0.0157249,0.0157458,0.0157556,0.0157605,0.015763,0.0157641,0.0157646,0.0157648,0.0157649],
  };
  const CMF = [
    [0.000064692,0.00021941,0.00112057,0.00376661,0.0118806,0.0232864,0.0345594,0.0372238,0.0324184,0.0212332,0.010491,0.00329584,0.000507035,0.000948674,0.00627372,0.0168646,0.0286896,0.0426748,0.0562547,0.0694704,0.0830532,0.0861261,0.0904661,0.0850039,0.0709067,0.0506289,0.035474,0.0214682,0.0125165,0.00680458,0.00346457,0.00149761,0.0007697,0.000407368,0.00016901,0.0000952245,0.000049031,0.0000199961],
    [0.00000184429,0.00000620532,0.0000310096,0.000104748,0.000353641,0.000951471,0.00228226,0.00420733,0.0066888,0.0098884,0.0152495,0.0214183,0.0334229,0.05131,0.0704021,0.0878387,0.0942491,0.0979567,0.0941522,0.086781,0.0788565,0.0635267,0.0537414,0.0426461,0.0316173,0.0208852,0.0138601,0.00810264,0.0046301,0.00249138,0.0012593,0.000541647,0.000277953,0.000147108,0.0000610327,0.0000343873,0.000017706,0.00000722097],
    [0.000305017,0.00103681,0.00531314,0.0179544,0.0570776,0.113652,0.173359,0.196207,0.186082,0.13995,0.0891745,0.0478962,0.0281456,0.0161377,0.0077591,0.00429615,0.00200551,0.000861471,0.000369039,0.000191429,0.000149556,0.0000923109,0.0000681349,0.0000288264,0.0000157672,0.0000039406,0.00000158401,0,0,0,0,0,0,0,0,0,0,0],
  ];
  const XYZ_RGB = [[3.240969942,-1.537383178,-0.4986107603],[-0.9692436363,1.875967502,0.04155505741],[0.0556300797,-0.2039769589,1.056971514]];
  const NW = 38;
  const lin = (x) => (x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92);
  const gam = (x) => (x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : x * 12.92);
  /** sRGB(0~1) → 반사 곡선 (spectral.js lRGB_to_R) */
  function reflect(rgb) {
    const l = rgb.map(lin);
    const w = Math.min(l[0], l[1], l[2]);
    const r0 = l[0] - w, g0 = l[1] - w, b0 = l[2] - w;
    const c = Math.min(g0, b0), m = Math.min(r0, b0), y = Math.min(r0, g0);
    const r = Math.max(0, Math.min(r0 - b0, r0 - g0)), g = Math.max(0, Math.min(g0 - b0, g0 - r0)), b = Math.max(0, Math.min(b0 - g0, b0 - r0));
    const R = new Float64Array(NW);
    for (let i = 0; i < NW; i++)
      R[i] = Math.max(1e-9, w * SPD.W[i] + c * SPD.C[i] + m * SPD.M[i] + y * SPD.Y[i] + r * SPD.R[i] + g * SPD.G[i] + b * SPD.B[i]);
    return R;
  }
  /** 물감 하나 = {ks[38], lum(밝기 Y), ts(착색력)} */
  function pigment(hex, ts) {
    const R = reflect(P.rgb(hex));
    const ks = new Float64Array(NW);
    let Y = 0;
    for (let i = 0; i < NW; i++) {
      ks[i] = (1 - R[i]) ** 2 / (2 * R[i]);
      Y += CMF[1][i] * R[i];
    }
    return { ks, lum: Math.max(1e-6, Y), ts: ts || 1 };
  }
  // 착색력 (1 = spectral.js 기본) — 노랑·파랑은 조금 세게(주황·초록이 빨강·파랑에 묻히지 않게), 하양은 조금 약하게,
  // 검정은 밝기 가중 때문에 원래 약해서 1.8 (한 방울 = 살짝 어둡게, 1:1 = 진한 색, 하양+검정 1:1 = 중간 회색) — tools/out/paint2 검증표로 정함
  P.TS = [1, 1.6, 1.3, 0.9, 1.8];
  P.EXP = 1; // 양 → 농도 지수 (spectral.js 는 2 — 아이 놀이에서는 "한 방울 더"가 고르게 보이도록 1)
  let PIG = null;
  P._pig = () => PIG || (PIG = P.BASE.map((b, i) => pigment(b.hex, P.TS[i])));
  P._reset = () => {
    PIG = null;
    cache.clear();
    if (P.NAMES) P._names();
  };
  const KSM = new Float64Array(NW);
  /** 물감 양 [빨,노,파,하,검] → out[0..2] (sRGB 0~1). 물감이 없으면 false */
  P.mixInto = function (v, out) {
    const pg = P._pig();
    let tot = 0;
    const w0 = [0, 0, 0, 0, 0];
    for (let p = 0; p < 5; p++) {
      const a = v[p] > 0 ? v[p] : 0;
      if (!a) continue;
      const q = pg[p];
      const c = (P.EXP === 2 ? a * a : Math.pow(a, P.EXP)) * q.ts * q.ts * q.lum;
      w0[p] = c;
      tot += c;
    }
    if (tot <= 1e-12) return false;
    KSM.fill(0);
    for (let p = 0; p < 5; p++) {
      const c = w0[p] / tot;
      if (!c) continue;
      const ks = pg[p].ks;
      for (let i = 0; i < NW; i++) KSM[i] += ks[i] * c;
    }
    let X = 0, Y = 0, Z = 0;
    const c0 = CMF[0], c1 = CMF[1], c2 = CMF[2];
    for (let i = 0; i < NW; i++) {
      const k = KSM[i];
      const R = 1 + k - Math.sqrt(k * k + 2 * k);
      X += c0[i] * R;
      Y += c1[i] * R;
      Z += c2[i] * R;
    }
    const M = XYZ_RGB;
    for (let j = 0; j < 3; j++) {
      const l = M[j][0] * X + M[j][1] * Y + M[j][2] * Z;
      out[j] = Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, l)))));
    }
    return true;
  };
  /** 물감 양 [빨,노,파,하,검] → RGB(0~1). 물감이 없으면 null (양의 비율만 봄) */
  P.mix = function (v) {
    const out = [0, 0, 0];
    return P.mixInto(v, out) ? out : null;
  };
  /** 그릇 그리기용: 비율을 잘게 나눠 기억 (같은 비율은 다시 계산하지 않음) */
  const cache = new Map();
  P.mixFast = function (v, out) {
    const s = v[0] + v[1] + v[2] + v[3] + v[4];
    if (s <= 1e-9) return false;
    const q = 40 / s;
    const key = ((((Math.round(v[0] * q) * 41 + Math.round(v[1] * q)) * 41 + Math.round(v[2] * q)) * 41 + Math.round(v[3] * q)) * 41) + Math.round(v[4] * q);
    let c = cache.get(key);
    if (!c) {
      if (cache.size > 6000) cache.clear();
      c = new Float32Array(3);
      const t = [0, 0, 0];
      if (!P.mixInto(v, t)) return false;
      c[0] = t[0];
      c[1] = t[1];
      c[2] = t[2];
      cache.set(key, c);
    }
    out[0] = c[0];
    out[1] = c[1];
    out[2] = c[2];
    return true;
  };
  P.hex = (rgb) => "#" + rgb.map((x) => Math.round(U.clamp(x, 0, 1) * 255).toString(16).padStart(2, "0")).join("");
  P.rgb = (hex) => {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  };

  /* ---------------- Lab 색 거리 (사람 눈에 가까운 차이) ---------------- */
  function lab(rgb) {
    const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    let X = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047,
      Y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722,
      Z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    X = f(X);
    Y = f(Y);
    Z = f(Z);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  P.lab = lab;
  P.dist = (a, b) => {
    const A = lab(a),
      B = lab(b);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  };

  /* ---------------- 색 이름 (도감 칸 = dex:true) ----------------
     색마다 '대표 레시피'(물감 양 [빨,노,파,하,검])를 두고, 기준색은 같은 엔진으로 섞어서 만듦
     → 실험실에서 그 레시피로 섞으면 반드시 그 이름이 나옴 (엔진을 바꿔도 이름표가 따라감)
     레시피는 도감·색 주문(mix)의 견본/레시피 카드에도 씀 */
  P.NAMES = [
    { n: "빨강", v: [1, 0, 0, 0, 0] },
    { n: "노랑", v: [0, 1, 0, 0, 0] },
    { n: "파랑", v: [0, 0, 1, 0, 0] },
    { n: "하양", v: [0, 0, 0, 1, 0] },
    { n: "검정", v: [0, 0, 0, 0, 1] },
    { n: "주황", v: [1, 1, 0, 0, 0], dex: true },
    { n: "귤색", v: [1, 3, 0, 0, 0], dex: true },
    { n: "다홍", v: [3, 1, 0, 0, 0], dex: true },
    { n: "연노랑", v: [0, 1, 0, 4, 0], dex: true },
    { n: "연두", v: [0, 3, 1, 0, 0], dex: true },
    { n: "초록", v: [0, 1, 1, 0, 0], dex: true },
    { n: "진초록", v: [0, 1, 1, 0, 2], dex: true },
    { n: "청록", v: [0, 1, 8, 2, 0], dex: true },
    { n: "하늘색", v: [0, 0, 1, 2, 0], dex: true },
    { n: "남색", v: [0, 0, 2, 0, 1], dex: true },
    { n: "보라", v: [1, 0, 1, 0, 0], dex: true },
    { n: "연보라", v: [1, 0, 1, 2, 0], dex: true },
    { n: "자주", v: [4, 0, 1, 0, 0], dex: true },
    { n: "분홍", v: [1, 0, 0, 2, 0], dex: true },
    { n: "살구색", v: [1, 1, 0, 5, 0], dex: true },
    { n: "황토색", v: [1, 3, 1, 0, 0], dex: true },
    { n: "갈색", v: [2, 1, 1, 0, 0], dex: true },
    { n: "고동색", v: [2, 1, 1, 0, 3], dex: true },
    { n: "회색", v: [0, 0, 0, 2, 1], dex: true },
  ];
  P._names = () =>
    P.NAMES.forEach((x) => {
      x.rgb = P.mix(x.v);
      x.hex = P.hex(x.rgb);
    });
  P._names();
  /** 이름 → 대표 레시피 항목 */
  P.named = (n) => P.NAMES.find((x) => x.n === n) || null;
  P.nameOf = (rgb) => {
    let best = P.NAMES[0],
      bd = 1e9;
    for (const x of P.NAMES) {
      const d = P.dist(rgb, x.rgb);
      if (d < bd) {
        bd = d;
        best = x;
      }
    }
    return best;
  };

  /* ---------------- 내 물감 통 / 색깔 도감 (기기 저장) ---------------- */
  P.MAX_MINE = 12;
  P.mine = () => {
    const a = KP.store.get("mypaints", []);
    return Array.isArray(a) ? a.filter((x) => x && /^#[0-9a-f]{6}$/i.test(x.hex)) : [];
  };
  /** 내 물감에 담기 → 저장된 목록 */
  P.saveMine = (hex, n, v) => {
    let a = P.mine().filter((x) => P.dist(P.rgb(x.hex), P.rgb(hex)) > 4); // 거의 같은 색은 하나만
    const it = { hex, n: String(n || "").slice(0, 10), t: Date.now() };
    // 원재료 비율도 함께 (색은 hex 로 그대로 쓰고, 비율은 나중에 다시 섞기·레시피 보기용) — e: 엔진 판(2 = KM)
    if (Array.isArray(v) && v.length === 5) {
      const s = v.reduce((x, y) => x + y, 0) || 1;
      it.v = v.map((x) => Math.round((x / s) * 1000) / 1000);
      it.e = 2;
    }
    a.unshift(it);
    a = a.slice(0, P.MAX_MINE);
    KP.store.set("mypaints", a);
    return a;
  };
  /** '칠하러 가기': 색칠 공방이 열리면 이 색을 골라 두게 (10분 안에 한 번) */
  P.pick = (hex) => KP.store.set("paint:pick", { hex: String(hex).toLowerCase(), t: Date.now() });
  P.takePick = () => {
    const o = KP.store.get("paint:pick", null);
    if (!o) return null;
    KP.store.set("paint:pick", null);
    return o.hex && Date.now() - (o.t || 0) < 600000 ? o.hex : null;
  };
  P.delMine = (hex) => KP.store.set("mypaints", P.mine().filter((x) => x.hex !== hex));
  P.dex = () => {
    const d = KP.store.get("colordex", {});
    return d && typeof d === "object" ? d : {};
  };
  /** 도감에 기록. 처음이면 true */
  P.discover = (name) => {
    const ent = P.NAMES.find((x) => x.n === name && x.dex);
    if (!ent) return false;
    const d = P.dex();
    if (d[name]) return false;
    d[name] = KP.gate.monthDay();
    KP.store.set("colordex", d);
    return true;
  };

  /* =================================================================
     손가락으로 젓는 물감 그릇 (걸쭉한 포스터 물감)
     - N×N 격자(기본 64)에 물감 5종의 양을 저장, 손가락 움직임으로 흐름(속도)을 만들고
       물감을 그 흐름대로 옮김(반라그랑주 이류) + 아주 약한 번짐 → 처음엔 줄무늬, 저을수록 한 색 (마블링)
     - 그리기: 칸마다 물감 색(KM, 비율 기억) → 2배 해상도로 부드럽게 보간 + 두께(높이) 음영·광택 + 주걱 자국(홈)
     - 점성: 물감이 두꺼운 곳은 흐름이 빨리 잦아듦, 흐름을 이웃과 나눔(덩어리로 움직임)
     - 가만히 있으면 계산·그리기를 거의 쉼 (저가 기기)
     - opt: { N, capacity, tilt(세로 납작 비율 — 탁자 위 그릇처럼, 1=정면) }
  ================================================================= */
  P.bowl = function (host, opt = {}) {
    const N = opt.N || 64;
    const NN = N * N;
    const tilt = opt.tilt || 1;
    const DAB = opt.dab || 0.1; // 한 방울 물감 덩어리 반지름 (격자 폭 대비)
    const IN = 0.43; // 물감이 담기는 안쪽 반지름 (그릇 지름 대비)
    const cv = U.el("canvas", "pbBowl");
    host.appendChild(cv);
    const cx = cv.getContext("2d");
    const M = Math.round(N * 2.5); // 그림 해상도 (계산 격자의 2.5배)
    const small = document.createElement("canvas");
    small.width = small.height = M;
    const sx = small.getContext("2d");
    const img = sx.createImageData(M, M);

    let pig = Array.from({ length: 5 }, () => new Float32Array(NN));
    let tmp = Array.from({ length: 5 }, () => new Float32Array(NN));
    const vx = new Float32Array(NN),
      vy = new Float32Array(NN),
      tvx = new Float32Array(NN),
      tvy = new Float32Array(NN);
    const groove = new Float32Array(NN); // 주걱이 지나간 홈 (0~1, 천천히 메워짐)
    const E = new Float32Array(NN), // 보이는 두께
      GX = new Float32Array(NN),
      GY = new Float32Array(NN),
      CR = new Float32Array(NN),
      CG = new Float32Array(NN),
      CB = new Float32Array(NN);
    const mask = new Uint8Array(NN);
    const R = N / 2 - 1.2;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) mask[j * N + i] = Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2) <= R ? 1 : 0;
    const BOTTOM = [0.965, 0.95, 0.925]; // 점토 접시 바닥 (따뜻한 흰색)
    const cc = [0, 0, 0],
      vv = [0, 0, 0, 0, 0];
    let stirHeat = 0, // 최근에 얼마나 열심히 저었는지 (0~1)
      moving = 0, // 최근 움직임 크기 (적으면 계산 생략)
      grooveMax = 0,
      idleT = 0,
      size = 300,
      dirty = true;
    const api = {
      cv,
      N,
      tilt,
      capacity: opt.capacity || 60,
      /** 그릇 안 물감 총량 [빨,노,파,하,검] */
      total() {
        const t = [0, 0, 0, 0, 0];
        for (let k = 0; k < 5; k++) {
          const a = pig[k];
          let s = 0;
          for (let i = 0; i < NN; i++) s += a[i];
          t[k] = s;
        }
        return t;
      },
      volume() {
        return api.total().reduce((a, b) => a + b, 0);
      },
      /** 전체를 다 섞었을 때의 색 (없으면 null) */
      color() {
        return P.mix(api.total());
      },
      /** 그릇 안 위치(0~1) → 화면 좌표 */
      toScreen(fx, fy) {
        const r = cv.getBoundingClientRect();
        const k = (IN * N) / R; // 격자 폭 N 이 그릇 지름의 몇 배인가
        return { x: r.left + r.width * (0.5 + (fx - 0.5) * k), y: r.top + r.height * (0.5 + (fy - 0.5) * k) };
      },
      /** 화면 좌표 → 캔버스 좌표(px, 납작하게 눕힌 것을 펴서) */
      fromClient(x, y) {
        const r = cv.getBoundingClientRect();
        return { x: ((x - r.left) / r.width) * size, y: ((y - r.top) / r.height) * size };
      },
      /** 물감 붓기: id(0~4), amt, 위치(0~1, 기본은 그릇 위쪽 가운데 근처) */
      pour(id, amt = 1, fx, fy) {
        if (api.volume() >= api.capacity) return false;
        const cxg = (fx == null ? 0.5 + U.randf(-0.12, 0.12) : fx) * N,
          cyg = (fy == null ? 0.42 + U.randf(-0.1, 0.1) : fy) * N;
        const sig = N * DAB, // 물감 덩어리 반지름 (가장자리가 또렷한 둥근 언덕)
          a = pig[id];
        let wsum = 0;
        const w = new Float32Array(NN);
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            if (!mask[k]) continue;
            const d2 = (i + 0.5 - cxg) ** 2 + (j + 0.5 - cyg) ** 2;
            if (d2 >= sig * sig) continue;
            const g = Math.pow(1 - d2 / (sig * sig), 0.6);
            w[k] = g;
            wsum += g;
          }
        if (wsum <= 0) return false;
        for (let k = 0; k < NN; k++) if (w[k]) a[k] += (amt * w[k]) / wsum;
        // 떨어진 자리에서 살짝 퍼지는 흐름
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            if (!w[k]) continue;
            const dx = i + 0.5 - cxg,
              dy = j + 0.5 - cyg,
              d = Math.hypot(dx, dy) || 1;
            vx[k] += (dx / d) * w[k] * 0.22;
            vy[k] += (dy / d) * w[k] * 0.22;
          }
        moving = Math.max(moving, 0.4);
        dirty = true;
        return true;
      },
      /** 젓기: 캔버스 좌표(px)와 움직인 양 */
      stir(px, py, dx, dy) {
        const s = R / (size * IN); // 안쪽 반지름(px) = 격자 R 칸
        const gx = N / 2 + (px - size / 2) * s,
          gy = N / 2 + (py - size / 2) * s,
          ux = dx * s,
          uy = dy * s;
        const rad = N * 0.14,
          rg = N * 0.05; // 주걱 끝 (홈)
        const i0 = Math.max(0, Math.floor(gx - rad)),
          i1 = Math.min(N - 1, Math.ceil(gx + rad)),
          j0 = Math.max(0, Math.floor(gy - rad)),
          j1 = Math.min(N - 1, Math.ceil(gy + rad));
        const sp = Math.hypot(ux, uy);
        for (let j = j0; j <= j1; j++)
          for (let i = i0; i <= i1; i++) {
            const k = j * N + i;
            if (!mask[k]) continue;
            const d = Math.hypot(i + 0.5 - gx, j + 0.5 - gy);
            if (d > rad) continue;
            const f = 1 - d / rad;
            vx[k] += ux * f * f * 1.1;
            vy[k] += uy * f * f * 1.1;
            if (d < rg && sp > 0.05) groove[k] = Math.max(groove[k], (1 - d / rg) * Math.min(1, 0.5 + sp));
          }
        grooveMax = 1;
        moving = Math.max(moving, Math.min(3, sp));
        stirHeat = Math.min(1, stirHeat + Math.min(0.08, sp * 0.05));
        dirty = true;
      },
      clear() {
        pig.forEach((a) => a.fill(0));
        vx.fill(0);
        vy.fill(0);
        groove.fill(0);
        dirty = true;
      },
      /** 한 걸음 진행 (dt 초) */
      step(dt) {
        const k60 = Math.min(3, dt * 60);
        if (moving > 0.01) {
          // 점성: 흐름을 이웃과 나눔 (덩어리로 움직임)
          for (let j = 1; j < N - 1; j++)
            for (let i = 1; i < N - 1; i++) {
              const k = j * N + i;
              if (!mask[k]) continue;
              tvx[k] = vx[k] * 0.6 + (vx[k - 1] + vx[k + 1] + vx[k - N] + vx[k + N]) * 0.1;
              tvy[k] = vy[k] * 0.6 + (vy[k - 1] + vy[k + 1] + vy[k - N] + vy[k + N]) * 0.1;
            }
          vx.set(tvx);
          vy.set(tvy);
          // 이류: 각 칸이 흐름을 거슬러 올라간 자리의 물감을 가져옴
          for (let c = 0; c < 5; c++) tmp[c].fill(0);
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              if (!mask[k]) continue;
              let x = i - vx[k] * k60,
                y = j - vy[k] * k60;
              x = U.clamp(x, 0, N - 1.001);
              y = U.clamp(y, 0, N - 1.001);
              const x0 = x | 0,
                y0 = y | 0,
                fx = x - x0,
                fy = y - y0;
              const a = y0 * N + x0,
                b = a + 1,
                c2 = a + N,
                d = c2 + 1;
              const wa = (1 - fx) * (1 - fy) * mask[a],
                wb = fx * (1 - fy) * mask[b],
                wc = (1 - fx) * fy * mask[c2],
                wd = fx * fy * mask[d];
              const ws = wa + wb + wc + wd || 1;
              for (let p = 0; p < 5; p++) {
                const s = pig[p];
                tmp[p][k] = (s[a] * wa + s[b] * wb + s[c2] * wc + s[d] * wd) / ws;
              }
            }
          // 물감 총량 보존 (이류 과정의 오차 보정)
          for (let p = 0; p < 5; p++) {
            let s0 = 0,
              s1 = 0;
            const A = pig[p],
              B = tmp[p];
            for (let k = 0; k < NN; k++) {
              s0 += A[k];
              s1 += B[k];
            }
            if (s1 > 1e-6) {
              const r = s0 / s1;
              for (let k = 0; k < NN; k++) B[k] *= r;
            }
          }
          const sw = pig;
          pig = tmp;
          tmp = sw;
          // 흐름은 점점 잦아듦 — 물감이 두꺼운 곳은 더 빨리 (걸쭉함)
          const vol = api.volume();
          const thick = (230 * Math.min(4, Math.max(1, 4 / Math.max(vol, 0.25)))) / 2.5;
          let mx = 0;
          for (let k = 0; k < NN; k++) {
            if (!mask[k]) continue;
            const s = pig[0][k] + pig[1][k] + pig[2][k] + pig[3][k] + pig[4][k];
            const damp = Math.pow(0.9 - 0.07 * Math.min(1, s * thick), k60);
            vx[k] *= damp;
            vy[k] *= damp;
            const m = Math.abs(vx[k]) + Math.abs(vy[k]);
            if (m > mx) mx = m;
          }
          moving = mx;
          dirty = true;
        }
        // 주걱 홈은 천천히 메워짐
        if (grooveMax > 0.003) {
          const g = Math.pow(0.94, k60);
          let gm = 0;
          for (let k = 0; k < NN; k++) {
            const v = (groove[k] *= g);
            if (v > gm) gm = v;
          }
          grooveMax = gm;
          dirty = true;
        }
        // 번짐: 가만히 두면 아주 천천히(0.5초마다 한 번), 저으면 빠르게 섞임
        stirHeat = Math.max(0, stirHeat - dt * 0.7);
        if (stirHeat > 0.01 || moving > 0.01) {
          api._diffuse(Math.min(0.24, (0.003 + 0.13 * stirHeat) * k60));
          idleT = 0;
        } else if ((idleT += dt) > 0.5) {
          api._diffuse(Math.min(0.2, 0.003 * idleT * 60));
          idleT = 0;
        }
      },
      /** 번짐 — 걸쭉한 물감: 두께는 아주 조금만 퍼지고(빈 곳으로 안개처럼 번지지 않게),
          물감이 닿아 있는 칸끼리는 '섞인 비율'을 나눔(저을수록 한 색) */
      _diffuse(rate) {
        if (rate <= 0) return;
        const TH = tvx; // 빌려 씀 (step 안에서만 쓰는 임시 칸)
        let any = false;
        for (let k = 0; k < NN; k++) {
          const s = pig[0][k] + pig[1][k] + pig[2][k] + pig[3][k] + pig[4][k];
          TH[k] = s;
          if (s > 1e-6) any = true;
        }
        if (!any) return;
        const lev = rate * 0.1,
          EPS = 1e-6;
        for (let p = 0; p < 5; p++) {
          const A = pig[p],
            B = tmp[p];
          let s0 = 0,
            s1 = 0;
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              if (!mask[k]) {
                B[k] = 0;
                continue;
              }
              const a = A[k];
              s0 += a;
              let sa = 0,
                n = 0,
                sf = 0,
                nf = 0;
              const nb = (q) => {
                sa += A[q];
                n++;
                if (TH[q] > EPS) {
                  sf += A[q] / TH[q];
                  nf++;
                }
              };
              if (i > 0 && mask[k - 1]) nb(k - 1);
              if (i < N - 1 && mask[k + 1]) nb(k + 1);
              if (j > 0 && mask[k - N]) nb(k - N);
              if (j < N - 1 && mask[k + N]) nb(k + N);
              let b = a + (n ? lev * (sa / n - a) : 0);
              const s = TH[k];
              if (s > EPS && nf) b += rate * s * (sf / nf - a / s);
              B[k] = b > 0 ? b : 0;
              s1 += B[k];
            }
          if (s1 > 1e-9) {
            const r = s0 / s1;
            for (let k = 0; k < NN; k++) B[k] *= r;
          }
          pig[p] = B;
          tmp[p] = A;
        }
        dirty = true;
      },
      /** 얼마나 고르게 섞였는지 (0~1, 1=완전히 한 색) 와 물감이 덮은 비율 */
      evenness() {
        const tot = api.total();
        const all = tot.reduce((a, b) => a + b, 0);
        if (all < 1e-3) return { even: 0, cover: 0 };
        const ref = tot.map((x) => x / all);
        let dev = 0,
          wsum = 0,
          covered = 0,
          inside = 0;
        for (let k = 0; k < NN; k++) {
          if (!mask[k]) continue;
          inside++;
          let s = 0;
          for (let p = 0; p < 5; p++) s += pig[p][k];
          if (s > 0.004 * (44 * 44) / NN) covered++;
          if (s < 1e-5) continue;
          let d = 0;
          for (let p = 0; p < 5; p++) d += Math.abs(pig[p][k] / s - ref[p]);
          dev += d * s;
          wsum += s;
        }
        return { even: U.clamp(1 - dev / (wsum || 1) / 0.55, 0, 1), cover: covered / inside };
      },
      /** 화면 크기 맞추기 (지름 px) */
      fit(px) {
        size = px;
        const dpr = Math.min(2, Math.round(devicePixelRatio || 1)) || 1;
        const d = px * dpr > 900 ? 1 : dpr;
        cv.width = cv.height = Math.round(px * d);
        cv.style.width = px + "px";
        cv.style.height = Math.round(px * tilt) + "px";
        cx.setTransform(d, 0, 0, d, 0, 0);
        dirty = true;
      },
      size: () => size,
      draw() {
        if (!dirty) return;
        dirty = false;
        const vol = api.volume();
        // 물감이 적게 퍼져 있으면 진하게 보여 줌 (한두 방울을 넓게 저어도 색이 보이게)
        const gain = ((260 * (44 * 44)) / NN) * Math.min(4, Math.max(1, 4 / Math.max(vol, 0.25)));
        // 1) 칸마다: 색(KM) · 보이는 두께(홈 빼고)
        for (let k = 0; k < NN; k++) {
          if (!mask[k]) {
            E[k] = 0;
            continue;
          }
          let s = 0;
          for (let p = 0; p < 5; p++) s += vv[p] = pig[p][k];
          const h = s * gain;
          E[k] = h * (1 - 0.8 * groove[k]);
          if (h > 0.02 && P.mixFast(vv, cc)) {
            CR[k] = cc[0];
            CG[k] = cc[1];
            CB[k] = cc[2];
          } else {
            CR[k] = BOTTOM[0];
            CG[k] = BOTTOM[1];
            CB[k] = BOTTOM[2];
          }
        }
        // 물감이 없는 칸의 색은 옆 물감 색으로 (가장자리가 하얗게 바래 보이지 않게)
        for (let j = 1; j < N - 1; j++)
          for (let i = 1; i < N - 1; i++) {
            const k = j * N + i;
            if (E[k] > 0.02 || !mask[k]) continue;
            let best = -1,
              bh = 0.02;
            for (const o of [-1, 1, -N, N]) if (E[k + o] > bh) (bh = E[k + o]), (best = k + o);
            if (best >= 0) {
              CR[k] = CR[best];
              CG[k] = CG[best];
              CB[k] = CB[best];
            }
          }
        // 2) 두께 기울기 (빛 받는 면 · 그늘)
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            const l = i > 0 ? E[k - 1] : E[k],
              r = i < N - 1 ? E[k + 1] : E[k],
              u = j > 0 ? E[k - N] : E[k],
              d = j < N - 1 ? E[k + N] : E[k];
            GX[k] = Math.max(-1.5, Math.min(1.5, (r - l) * 0.5));
            GY[k] = Math.max(-1.5, Math.min(1.5, (d - u) * 0.5));
          }
        // 3) 2배 해상도로 부드럽게: 색 · 두께 · 음영 · 광택
        const data = img.data;
        const LX = -0.48,
          LY = -0.62,
          LZ = 0.62; // 빛: 왼쪽 위
        const HX = LX,
          HY = LY,
          HZ = LZ + 1,
          HL = Math.hypot(HX, HY, HZ);
        const hx = HX / HL,
          hy = HY / HL,
          hz = HZ / HL;
        const KH = 2.0; // 높이 → 기울기 세기
        const c2 = M / 2;
        const rr = (R / N) * M;
        for (let y = 0; y < M; y++) {
          const gy = ((y + 0.5) * N) / M - 0.5;
          let y0 = Math.floor(gy);
          const fy = gy - y0;
          if (y0 < 0) y0 = 0;
          const y1 = Math.min(N - 1, y0 + 1);
          for (let x = 0; x < M; x++) {
            const o = (y * M + x) * 4;
            const ddx = x + 0.5 - c2,
              ddy = y + 0.5 - c2;
            if (ddx * ddx + ddy * ddy > rr * rr) {
              data[o + 3] = 0;
              continue;
            }
            const gx = ((x + 0.5) * N) / M - 0.5;
            let x0 = Math.floor(gx);
            const fx = gx - x0;
            if (x0 < 0) x0 = 0;
            const x1 = Math.min(N - 1, x0 + 1);
            const a = y0 * N + x0,
              b = y0 * N + x1,
              c = y1 * N + x0,
              d = y1 * N + x1;
            const wa = (1 - fx) * (1 - fy),
              wb = fx * (1 - fy),
              wc = (1 - fx) * fy,
              wd = fx * fy;
            const h = E[a] * wa + E[b] * wb + E[c] * wc + E[d] * wd;
            // 물감 가장자리를 또렷하게 (얇게 번진 안개가 아니라 덩어리)
            let al = (h - 0.04) / 0.16;
            al = al <= 0 ? 0 : al >= 1 ? 1 : al * al * (3 - 2 * al);
            let r = BOTTOM[0],
              g = BOTTOM[1],
              bl = BOTTOM[2];
            if (al > 0.001) {
              const pr = CR[a] * wa + CR[b] * wb + CR[c] * wc + CR[d] * wd,
                pg = CG[a] * wa + CG[b] * wb + CG[c] * wc + CG[d] * wd,
                pb = CB[a] * wa + CB[b] * wb + CB[c] * wc + CB[d] * wd;
              const nx = -(GX[a] * wa + GX[b] * wb + GX[c] * wc + GX[d] * wd) * KH,
                ny = -(GY[a] * wa + GY[b] * wb + GY[c] * wc + GY[d] * wd) * KH;
              const nl = 1 / Math.sqrt(nx * nx + ny * ny + 1);
              const dif = (nx * LX + ny * LY + LZ) * nl; // 0.62 = 평평
              const shade = 0.86 + (dif - LZ) * 0.55 + Math.min(0.06, h * 0.02);
              let sp = (nx * hx + ny * hy + hz) * nl;
              sp = sp > 0.9 ? (sp - 0.9) * 10 : 0; // 좁은 광택
              sp = sp * sp * 0.55 * al;
              r = r * (1 - al) + Math.min(1, pr * shade) * al + sp;
              g = g * (1 - al) + Math.min(1, pg * shade) * al + sp;
              bl = bl * (1 - al) + Math.min(1, pb * shade) * al + sp;
            }
            data[o] = r * 255;
            data[o + 1] = g * 255;
            data[o + 2] = bl * 255;
            data[o + 3] = 255;
          }
        }
        sx.putImageData(img, 0, 0);
        // 4) 점토 접시 + 물감
        const S = size,
          C = S / 2,
          rin = S * IN;
        cx.clearRect(0, 0, S, S);
        // 접시 몸통 (바깥 둘레·두께)
        const body = cx.createRadialGradient(C - S * 0.12, C - S * 0.14, S * 0.05, C, C, S * 0.5);
        body.addColorStop(0, "#fffdf8");
        body.addColorStop(0.75, "#f3ece0");
        body.addColorStop(1, "#ddd0bd");
        cx.fillStyle = body;
        cx.beginPath();
        cx.arc(C, C, S * 0.49, 0, Math.PI * 2);
        cx.fill();
        // 안쪽 우묵한 곳
        cx.save();
        cx.beginPath();
        cx.arc(C, C, rin, 0, Math.PI * 2);
        cx.clip();
        cx.imageSmoothingEnabled = true;
        cx.drawImage(small, C - rin * (N / 2 / R), C - rin * (N / 2 / R), rin * 2 * (N / 2 / R), rin * 2 * (N / 2 / R));
        // 우묵한 벽 그늘 (빛 반대쪽 = 왼쪽 위 벽이 그늘)
        const inner = cx.createRadialGradient(C + S * 0.05, C + S * 0.06, rin * 0.78, C, C, rin * 1.02);
        inner.addColorStop(0, "rgba(90,60,30,0)");
        inner.addColorStop(1, "rgba(90,60,30,.28)");
        cx.fillStyle = inner;
        cx.fillRect(0, 0, S, S);
        cx.restore();
        // 테두리 윤기
        cx.lineWidth = S * 0.012;
        cx.strokeStyle = "rgba(255,255,255,.9)";
        cx.beginPath();
        cx.arc(C, C, rin + S * 0.012, Math.PI * 0.15, Math.PI * 1.05);
        cx.stroke();
        cx.strokeStyle = "rgba(120,90,60,.22)";
        cx.beginPath();
        cx.arc(C, C, rin + S * 0.008, Math.PI * 1.15, Math.PI * 2.05);
        cx.stroke();
        cx.lineWidth = S * 0.01;
        cx.strokeStyle = "rgba(255,255,255,.75)";
        cx.beginPath();
        cx.arc(C, C, S * 0.475, Math.PI * 1.1, Math.PI * 1.7);
        cx.stroke();
      },
      /** 저장(앱을 껐다 켜도 그릇 그대로) — 0~255 로 줄여 문자열로 */
      save() {
        const mx = Math.max(1e-6, ...pig.map((a) => a.reduce((m, x) => Math.max(m, x), 0)));
        const bytes = new Uint8Array(NN * 5);
        pig.forEach((a, p) => a.forEach((x, k) => (bytes[p * NN + k] = Math.round((x / mx) * 255))));
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return { N, mx, d: btoa(bin) };
      },
      /** 불러오기 — 예전 44칸 그릇도 지금 칸 수로 옮겨 담음 (물감 양 그대로) */
      load(o) {
        try {
          if (!o || !(o.N >= 8 && o.N <= 256) || typeof o.d !== "string" || !(o.mx > 0)) return false;
          const n0 = o.N,
            nn0 = n0 * n0;
          const bin = atob(o.d);
          if (bin.length !== nn0 * 5) return false;
          const src = Array.from({ length: 5 }, (_, p) => {
            const a = new Float32Array(nn0);
            for (let k = 0; k < nn0; k++) a[k] = (bin.charCodeAt(p * nn0 + k) / 255) * o.mx;
            return a;
          });
          pig.forEach((a, p) => {
            const s = src[p];
            let want = 0;
            for (let k = 0; k < nn0; k++) want += s[k];
            if (n0 === N) for (let k = 0; k < NN; k++) a[k] = mask[k] ? s[k] : 0;
            else
              for (let j = 0; j < N; j++)
                for (let i = 0; i < N; i++) {
                  const k = j * N + i;
                  if (!mask[k]) {
                    a[k] = 0;
                    continue;
                  }
                  const x = U.clamp(((i + 0.5) / N) * n0 - 0.5, 0, n0 - 1.001),
                    y = U.clamp(((j + 0.5) / N) * n0 - 0.5, 0, n0 - 1.001);
                  const x0 = x | 0,
                    y0 = y | 0,
                    fx = x - x0,
                    fy = y - y0,
                    q = y0 * n0 + x0;
                  a[k] = s[q] * (1 - fx) * (1 - fy) + s[q + 1] * fx * (1 - fy) + s[q + n0] * (1 - fx) * fy + s[q + n0 + 1] * fx * fy;
                }
            let got = 0;
            for (let k = 0; k < NN; k++) got += a[k];
            if (got > 1e-9) for (let k = 0; k < NN; k++) a[k] *= want / got;
          });
          dirty = true;
          return true;
        } catch (e) {
          return false;
        }
      },
    };
    return api;
  };

  /* =================================================================
     도움말: 지금 그릇(tot)에서 목표 색(target, 레시피 v, 허용 거리 tol)으로 가려면 어떤 물감을 넣을까
     1) 그릇이 넘치기 전에 허용 거리 안으로 갈 길이 있는지: 레시피 비율로 맞추려면
        각 물감을 얼마나 더 넣어야 하는지(부족분)를 양을 늘려 가며 찾음 (다른 색이 섞였으면 묽혀서)
     2) 부족한 물감들 중에서 '한 방울 더 넣었을 때 거리가 가장 줄어드는' 물감을 고름
     → {id, lot(많이), need} 또는 null(되돌릴 수 없음 → 비우고 다시)  — 색 주문 맞추기·색깔 섞기가 같이 씀
  ================================================================= */
  P.advise = function (tot, v, target, tol, cap) {
    const vol = tot.reduce((x, y) => x + y, 0);
    let k = 0;
    v.forEach((x, i) => x > 0 && (k = Math.max(k, tot[i] / x)));
    k = Math.max(k, 0.9 / Math.min(...v.filter((x) => x > 0)));
    let add = null;
    if (!(cap > 0)) cap = vol + 60; // 상한이 없으면 무한 반복하지 않게
    for (let guard = 0; guard < 400; guard++, k += 0.3) {
      const a = v.map((x, i) => Math.max(0, k * x - tot[i]));
      const sum = a.reduce((x, y) => x + y, 0);
      if (vol + sum > cap) break;
      const w = tot.map((x, i) => x + a[i]);
      if (P.dist(P.mix(w), target) <= tol * 0.8) {
        add = a;
        break;
      }
    }
    if (!add) return null;
    const cur = P.dist(P.mix(tot) || [1, 1, 1], target);
    let best = null;
    add.forEach((need, id) => {
      if (need < 0.45) return;
      const w = tot.slice();
      w[id] += 0.9;
      const gain = cur - P.dist(P.mix(w), target);
      if (!best || gain > best.gain + 0.01 || (Math.abs(gain - best.gain) <= 0.01 && need > best.need)) best = { id, gain, need };
    });
    return best ? { id: best.id, lot: best.need >= 2.7, need: best.need } : null;
  };

  /* =================================================================
     물감 작업대 (실험실·색깔 섞기·색 주문 맞추기 공용 화면 부품)
     KP.paint.studio({ctx, jars:[0,1,2,3,4], capacity, tilt, onPour(id), onStir()})
     → { jarsEl, bowlEl, meterEl, bowl, fit(px), tick(dt), drain(), state, jar(id) }
     - 물감 튜브(점토): 톡 누르면 한 방울 쭉, 꾹 누르고 있으면 계속 (튜브가 눌렸다 펴짐, 방울이 날아가 그릇에 퐁)
     - 그릇: 손가락으로 빙글빙글 저으면 마블링처럼 섞임 (나무 주걱이 손가락을 따라감, 지나간 자리에 홈)
     - 섞기 막대: 얼마나 고르게 섞였는지
     - 튜브 그림: assets/play-clay/paint/tube.png (흰 튜브) 에 물감색을 곱하기로 입힘
  ================================================================= */
  const ART = "assets/play-clay/paint/";
  P.ART = ART;
  KP.css("paint-studio", `
    .psJars{display:flex;gap:clamp(6px,1.4vw,12px);justify-content:center;align-items:flex-end;flex-wrap:wrap}
    .psJar{position:relative;width:clamp(66px,8.6vw,86px);height:clamp(84px,11vw,108px);touch-action:none;background:none;border:0;padding:0}
    .psJar .tb{position:absolute;left:50%;bottom:20%;height:80%;width:auto;aspect-ratio:141/300;transform:translateX(-50%) rotate(180deg);transform-origin:50% 50%;transition:transform .12s;filter:drop-shadow(0 5px 3px rgba(80,50,20,.28))}
    .psJar.pour .tb{transform:translateX(-50%) rotate(180deg) scale(1.1,.86)}
    .psJar .jn{position:absolute;left:-4px;right:-4px;bottom:-4px;text-align:center;font-size:clamp(14px,1.8vw,17px);background:rgba(255,251,242,.95);border-radius:999px;box-shadow:0 3px 0 rgba(90,60,30,.15);padding:1px 0}
    .psJar .jd{position:absolute;left:50%;top:-2%;width:30%;aspect-ratio:1;margin-left:-15%;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -2px -3px 0 rgba(0,0,0,.14),0 0 0 2px rgba(255,255,255,.75);opacity:0;transform:scale(.3);transition:opacity .12s,transform .12s}
    .psJar.pour .jd{opacity:1;transform:scale(1)}
    .psBowlBox{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px}
    .pbBowl{display:block;touch-action:none;filter:drop-shadow(0 9px 6px rgba(80,50,20,.25))}
    .psSpoon{position:absolute;left:0;top:0;width:clamp(90px,14vmin,150px);pointer-events:none;transform-origin:8% 92%;transition:opacity .25s;z-index:3;filter:drop-shadow(0 6px 4px rgba(80,50,20,.3))}
    .psSpoon.rest{opacity:.95}
    .psMeter{display:flex;align-items:center;gap:8px;font-size:clamp(15px,2vw,19px);color:var(--ink2);background:rgba(255,251,242,.85);border-radius:999px;padding:2px 12px}
    .psMeter .pbar{display:inline-block;flex:0 0 auto;width:clamp(110px,20vw,210px);height:16px;border-radius:999px;background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.12);overflow:hidden}
    .psMeter .pbar i{display:block;height:16px;width:0;border-radius:999px;background:linear-gradient(90deg,#ffd166,#06d6a0);transition:width .3s}
    .psDrop{position:fixed;z-index:70;width:22px;height:26px;margin:-13px 0 0 -11px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -3px -4px 0 rgba(0,0,0,.14),0 0 0 2px rgba(255,255,255,.7);pointer-events:none;transition:transform .38s cubic-bezier(.45,-0.3,.7,1)}
    .pbBowl.drain{transition:opacity .6s, transform .6s;opacity:.15;transform:scale(.9) rotate(-8deg)}
  `);
  /** 흰 튜브 그림에 물감색 입히기 (곱하기) → 캔버스. 그림을 못 불러오면 단색 둥근 튜브 */
  const tubeCache = {};
  let tubeImg = null;
  P.tubeCanvas = function (hex, cb) {
    if (tubeCache[hex]) return cb(tubeCache[hex]);
    const make = (im) => {
      const W = 141, H = 300;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d");
      if (im) {
        g.drawImage(im, 0, 0, W, H);
        // 하양은 그대로, 검정은 그림자가 보이게 조금 밝게
        const tint = hex.toLowerCase() === "#ffffff" ? null : P.hex(P.rgb(hex).map((x) => (hex === P.BASE[4].hex ? 0.2 + x * 0.8 : x)));
        if (tint) {
          g.globalCompositeOperation = "multiply";
          g.fillStyle = tint;
          g.fillRect(0, 0, W, H * 0.8); // 뚜껑(아래 20%)은 흰색 그대로
          g.globalCompositeOperation = "destination-in";
          g.drawImage(im, 0, 0, W, H);
        }
      } else {
        g.fillStyle = hex;
        g.beginPath();
        if (g.roundRect) g.roundRect(20, 10, W - 40, H - 20, 30);
        else g.rect(20, 10, W - 40, H - 20); // 옛 사파리(15.4 미만)
        g.fill();
      }
      tubeCache[hex] = c;
      cb(c);
    };
    if (tubeImg === false) return make(null);
    if (tubeImg && tubeImg.complete) return make(tubeImg);
    if (!tubeImg) {
      tubeImg = new Image();
      tubeImg.src = ART + "tube.png";
    }
    tubeImg.addEventListener("load", () => make(tubeImg), { once: true });
    tubeImg.addEventListener("error", () => ((tubeImg = false), make(null)), { once: true });
  };
  P.studio = function (o = {}) {
    const ctx = o.ctx;
    const A = KP.audio;
    const jarsEl = U.el("div", "psJars");
    const bowlEl = U.el("div", "psBowlBox");
    const bowl = P.bowl(bowlEl, { capacity: o.capacity || 60, tilt: o.tilt || 1, dab: o.dab });
    const spoon = U.el("img", "psSpoon rest");
    spoon.src = ART + "stick.png";
    spoon.alt = "";
    spoon.draggable = false;
    bowlEl.appendChild(spoon);
    const meterEl = U.el("div", "psMeter", "<span>섞기</span><span class=\"pbar\"><i></i></span>");
    bowlEl.appendChild(meterEl);
    const st = { lastPourAt: 0, lastStirAt: 0, pending: 0, even: 0, cover: 0, enabled: true, pours: 0 };
    const NOTE = ["C5", "E5", "G5", "C6", "A4"];

    /* 물감 튜브 */
    (o.jars || [0, 1, 2, 3, 4]).forEach((id) => {
      const p = P.BASE[id];
      const j = U.el("button", "psJar", '<canvas class="tb" width="141" height="300"></canvas><span class="jd"></span><span class="jn">' + p.n + "</span>");
      j.style.setProperty("--c", p.hex);
      j.dataset.id = id;
      const tcv = j.querySelector(".tb");
      P.tubeCanvas(p.hex, (c) => tcv.getContext("2d").drawImage(c, 0, 0));
      let t = null,
        held = false;
      const drop = () => {
        if (!st.enabled) return;
        if (bowl.volume() + st.pending >= bowl.capacity) {
          if (!st.fullTold) {
            st.fullTold = true;
            KP.voice.say("그릇이 가득 찼어요! 비우고 다시 해요.");
          }
          return;
        }
        st.pending += 0.9;
        const a = j.getBoundingClientRect();
        const fx = 0.5 + U.randf(-(o.spread || 0.2), o.spread || 0.2),
          fy = 0.45 + U.randf(-(o.spread || 0.2) * 0.8, (o.spread || 0.2) * 0.8);
        const tp = bowl.toScreen(fx, fy);
        const d = U.el("div", "psDrop");
        d.style.setProperty("--c", p.hex);
        const sx0 = a.left + a.width / 2,
          sy0 = a.top + a.height * 0.06;
        d.style.left = sx0 + "px";
        d.style.top = sy0 + "px";
        document.body.appendChild(d);
        requestAnimationFrame(() => (d.style.transform = "translate(" + (tp.x - sx0) + "px," + (tp.y - sy0) + "px) scale(.9)"));
        A.noise({ dur: 0.09, vol: 0.06, bp: 260, bpTo: 520, q: 2 }); // 쭉
        setTimeout(() => {
          d.remove();
          st.pending = Math.max(0, st.pending - 0.9);
          if (ctx && !ctx._active) return;
          bowl.pour(id, 0.9, fx, fy);
          st.lastPourAt = performance.now();
          st.pours++;
          A.tone(A.hz(NOTE[id]) * U.randf(0.95, 1.05), { to: A.hz(NOTE[id]) * 0.6, dur: 0.12, vol: 0.18 });
          A.noise({ dur: 0.06, vol: 0.05, bp: 800, q: 2 });
          o.onPour && o.onPour(id);
        }, 390);
      };
      j.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        A.unlock();
        if (!st.enabled) return;
        held = true;
        j.classList.add("pour");
        drop();
        clearInterval(t);
        t = setInterval(() => (held && (!ctx || ctx._active) ? drop() : clearInterval(t)), 200);
      });
      const end = () => {
        held = false;
        clearInterval(t);
        j.classList.remove("pour");
      };
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => j.addEventListener(ev, end));
      jarsEl.appendChild(j);
    });

    /* 젓기 (나무 주걱) */
    let last = null,
      pid = null, // 젓는 손가락 (다른 손가락·손바닥은 무시 — 좌표가 튀어 마블링이 깨지지 않게)
      lastSnd = 0,
      ang = -30;
    const cv = bowl.cv;
    const local = (e) => bowl.fromClient(e.clientX, e.clientY);
    // 주걱: 쉬는 동안은 그릇 오른쪽 가장자리에 걸쳐 둠
    const restSpoon = () => {
      spoon.classList.add("rest");
      const S = bowl.size(),
        bw = spoon.offsetWidth || 110;
      const x = cv.offsetLeft + S * 0.78,
        y = cv.offsetTop + S * bowl.tilt * 0.62;
      spoon.style.transform = "translate(" + (x - bw * 0.08) + "px," + (y - bw * 0.92) + "px) rotate(8deg)";
    };
    const moveSpoon = (p, dx, dy) => {
      spoon.classList.remove("rest");
      const bw = spoon.offsetWidth || 110;
      // 끝(왼쪽 아래)이 손가락에 오게, 움직이는 쪽으로 살짝 기울임
      if (dx || dy) ang += (U.clamp(-dx * 2.2, -40, 40) - 10 - ang) * 0.25;
      const x = cv.offsetLeft + (p.x / bowl.size()) * cv.offsetWidth,
        y = cv.offsetTop + (p.y / bowl.size()) * cv.offsetHeight;
      spoon.style.transform = "translate(" + (x - bw * 0.08) + "px," + (y - bw * 0.92) + "px) rotate(" + ang + "deg)";
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (last && e.pointerId !== pid) return;
      pid = e.pointerId;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      last = local(e);
      moveSpoon(last, 0, 0);
    });
    cv.addEventListener("pointermove", (e) => {
      if (!last || e.pointerId !== pid) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      let mdx = 0,
        mdy = 0;
      for (const ev of evs) {
        const p = local(ev);
        const dx = p.x - last.x,
          dy = p.y - last.y;
        bowl.stir(p.x, p.y, dx, dy);
        mdx += dx;
        mdy += dy;
        last = p;
      }
      moveSpoon(last, mdx, mdy);
      st.lastStirAt = performance.now();
      if (performance.now() - lastSnd > 140 && bowl.volume() > 0.3) {
        lastSnd = performance.now();
        A.noise({ dur: 0.14, vol: 0.05 + Math.min(0.05, Math.hypot(mdx, mdy) * 0.002), bp: 300 + Math.random() * 160, q: 3 }); // 찰박
      }
      o.onStir && o.onStir();
    });
    const endStir = (e) => {
      if (e && e.pointerId !== pid) return;
      last = null;
      pid = null;
      restSpoon();
    };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => cv.addEventListener(ev, endStir));

    let acc = 0,
      simAcc = 0;
    const api = {
      jarsEl,
      bowlEl,
      meterEl,
      bowl,
      spoon,
      state: st,
      jar: (id) => jarsEl.querySelector('.psJar[data-id="' + id + '"]'),
      fit(px) {
        bowl.fit(Math.max(140, Math.round(px)));
        requestAnimationFrame(() => !last && restSpoon());
      },
      /** 매 프레임 호출 — 물감 계산·그리기는 초당 최대 30번 (저가 기기) */
      tick(dt) {
        simAcc += dt;
        if (simAcc >= 1 / 31) {
          bowl.step(Math.min(0.1, simAcc));
          bowl.draw();
          simAcc = 0;
        }
        acc += dt;
        if (acc > 0.25) {
          acc = 0;
          const ev = bowl.evenness();
          st.even = ev.even;
          st.cover = ev.cover;
          const v = bowl.volume();
          meterEl.querySelector("i").style.width = (v > 0.3 ? Math.round(ev.even * 100) : 0) + "%";
          if (v < bowl.capacity * 0.9) st.fullTold = false;
        }
      },
      /** 그릇 비우기 (연출 후 비움) */
      drain() {
        return new Promise((res) => {
          A.noise({ dur: 0.6, vol: 0.12, bp: 900, bpTo: 300, q: 1.5 });
          cv.classList.add("drain");
          setTimeout(() => {
            bowl.clear();
            cv.classList.remove("drain");
            res();
          }, 620);
        });
      },
      setEnabled(on) {
        st.enabled = on;
      },
    };
    return api;
  };

  /* =================================================================
     점토 물감 작업실 배경 (assets/play-clay/paint/bg.jpg, 1600×900) — 그림 속 흰 팔레트 접시가 그릇 바로 밑에 오게 자르기
     KP.paint.stageBg(el) → { align(bowlRect, hostRect) } — 그릇 위치가 바뀔 때마다 부름
  ================================================================= */
  P.STAGE = { file: ART + "bg.jpg", img: [1600, 900], pal: [0.5007, 0.7074, 0.3274] }; // 팔레트 가운데(u,v)·폭(그림 폭 대비)
  P.stageBg = function (el) {
    const S = P.STAGE;
    el.style.backgroundImage = 'url("' + S.file + '")';
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundColor = "#c98b4e";
    return {
      align(br, hr) {
        const w = hr.width,
          h = hr.height,
          ar = S.img[1] / S.img[0];
        if (!w || !h || !br.width) return;
        const bx = br.left - hr.left + br.width / 2,
          by = br.top - hr.top + br.height * 0.5;
        const base = Math.max((br.width * 0.97) / S.pal[2], w, h / ar);
        let best = null;
        for (let z = 1; z <= 2.2; z += 0.05) {
          const fw = base * z,
            fh = fw * ar;
          const ox = S.pal[0] * fw - bx,
            oy = S.pal[1] * fh - by;
          const cox = U.clamp(ox, 0, fw - w),
            coy = U.clamp(oy, 0, fh - h);
          const err = Math.hypot(cox - ox, coy - oy);
          if (!best || err < best.err - 0.5) best = { fw, fh, ox: cox, oy: coy, err };
          if (err < 2) break;
        }
        el.style.backgroundSize = Math.round(best.fw) + "px " + Math.round(best.fh) + "px";
        el.style.backgroundPosition = Math.round(-best.ox) + "px " + Math.round(-best.oy) + "px";
      },
    };
  };
})(window.KP);
