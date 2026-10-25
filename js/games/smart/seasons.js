/* 사계절 나무 — 점토 정원 언덕의 흙 자리에서 씨앗이 나무가 되고, 봄 → 여름 → 가을 → 겨울 → 다시 봄 (계절 변화와 순환)
   - 배경: 같은 구도의 점토 정원 4장(계절별). 계절이 바뀌면 두 장을 부드럽게 겹쳐 바꿈(지금·다음 두 장만)
   - 나무: 코드로 그린 점토 나무(둥근 수관 덩어리·굵은 줄기·점토 결) — 계절 색(봄 분홍 꽃·여름 짙은 초록·가을 주황 빨강+열매·겨울 앙상한 가지+눈)
     배경과 같은 쪽 빛·그림자. 계절이 바뀌면 나무도 두 장을 겹쳐 바꿈. 화면 크기에 맞춰 다시 그림(바뀔 때만 — 저사양 기기)
   - 아이가 칠한 3D 인형 1마리가 나무 옆에서 함께(작은 도움 동작): 씨앗 심기(고개 숙여 톡톡)·물뿌리개 들기·비 오면 만세·
     열매 바구니 들기·눈사람 토닥토닥. 칠한 인형이 없으면 기본 인형. 3D 가 안 되면 그림 인형(같은 동작 일부)
   1단계: 씨앗 심기·물·해님 → 나무. 계절마다 행동 하나 (봄 꽃봉오리 콕콕 / 여름 구름 눌러 소나기 / 가을 사과 따서 바구니 / 겨울 눈사람)
          한 바퀴(사계절)는 단계가 올라가도 끝까지 이어서 함
   2단계: 지금 계절을 보고 '다음은 어떤 계절?' (보기 4개 — 점토 정원 작은 그림)
   3단계: 계절 물건(벚꽃·수박·밤·장갑…)을 끌어서 알맞은 계절 나무에 넣기 (나무 4그루, 물건 그림은 점토 느낌으로 바꿔 그림)
   공용: _shared/clay-stage.js(무대) · doll-actor.js(인형) · doll-follow.js(손에 든 물건) · play-feedback.js(반짝임)
   - 날씨 옷 입히기(dress)와 달리 옷이 아니라 '자연이 바뀌는 모습' 중심. 한국 사계절 기준 */
"use strict";
(function () {
  /* =================================================================
     점토 그리기 도구 (이 놀이 안에서만)
  ================================================================= */
  const hex = (c) => {
    c = c.replace("#", "");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return toHex(A.map((v, i) => v + (B[i] - v) * t));
  };
  const lit = (c, t) => mix(c, "#fffaf0", t);
  const drk = (c, t, d) => mix(c, d || "#2a1606", t);
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let noiseCv = null;
  /** 점토 결 (아주 약한 밝고 어두운 점) — 그린 것 위에만 */
  function grain(g, w, h, k = 1) {
    if (!noiseCv) {
      noiseCv = document.createElement("canvas");
      noiseCv.width = noiseCv.height = 96;
      const ng = noiseCv.getContext("2d"), im = ng.createImageData(96, 96), r = rng(31);
      for (let i = 0; i < 96 * 96; i++) {
        const v = r(), on = v > 0.5;
        im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = on ? 255 : 30;
        im.data[i * 4 + 3] = Math.round(Math.abs(v - 0.5) * 2 * 20);
      }
      ng.putImageData(im, 0, 0);
    }
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.globalAlpha = k;
    g.fillStyle = g.createPattern(noiseCv, "repeat");
    g.fillRect(0, 0, w, h);
    g.restore();
  }
  /** 손으로 빚은 듯 살짝 울퉁불퉁한 타원 경로 */
  function lumpPath(g, x, y, rx, ry, seed = 1, rot = 0) {
    const r = rng(Math.abs(Math.floor(seed * 1000)) + 7), N = 9, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.07;
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      pts.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = pts[i % N], q = pts[(i + 1) % N], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      if (i === 0) g.moveTo(m[0], m[1]);
      else g.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    g.closePath();
  }
  /** 점토 덩어리: 그림자(뒤에 닿는) + 빛 쪽 밝게·반대쪽 어둡게 + 작은 윤기. L = 빛이 오는 쪽 [x,y] (화면, 위가 -) */
  function blob(g, x, y, rx, ry, col, L, o = {}) {
    const rot = o.rot || 0, seed = o.seed == null ? x * 13 + y * 7 : o.seed;
    const sc = g.getTransform().a; // 그림자 크기는 변환을 따르지 않음 → 직접 곱함
    g.save();
    if (o.shadow !== false) {
      g.shadowColor = o.sc || "rgba(55,32,12,.3)";
      g.shadowBlur = Math.max(rx, ry) * (o.sb || 0.35) * sc;
      g.shadowOffsetX = -L[0] * rx * 0.14 * sc;
      g.shadowOffsetY = -L[1] * ry * 0.16 * sc;
    }
    g.fillStyle = col;
    lumpPath(g, x, y, rx, ry, seed, rot);
    g.fill();
    g.restore();
    const R = Math.max(rx, ry);
    const gr = g.createRadialGradient(x + L[0] * rx * 0.42, y + L[1] * ry * 0.46, R * 0.04, x, y, R * 1.2);
    gr.addColorStop(0, lit(col, o.hiK || 0.34));
    gr.addColorStop(0.5, col);
    gr.addColorStop(1, drk(col, o.dkK || 0.34, o.dk));
    g.fillStyle = gr;
    lumpPath(g, x, y, rx, ry, seed, rot);
    g.fill();
    if (o.gloss !== false) {
      const hx = x + L[0] * rx * 0.46, hy = y + L[1] * ry * 0.5, hr = R * 0.36;
      const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
      hg.addColorStop(0, "rgba(255,255,255," + (o.gl || 0.3) + ")");
      hg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = hg;
      g.beginPath();
      g.ellipse(hx, hy, hr, hr * 0.7, -0.6, 0, 6.283);
      g.fill();
    }
  }
  /** 흐린 타원 (그림자) — 캔버스 filter 가 없는 기기(옛 Safari)에서도 같은 모양: 둥근 그러데이션 */
  function softEllipse(g, x, y, rx, ry, col, a) {
    g.save();
    g.translate(x, y);
    g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, "rgba(" + col + "," + a + ")");
    gr.addColorStop(0.55, "rgba(" + col + "," + a * 0.7 + ")");
    gr.addColorStop(1, "rgba(" + col + ",0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, rx, 0, 6.283);
    g.fill();
    g.restore();
  }
  /** 점토 막대(가지·줄기·손잡이): 점을 따라 동그라미를 찍어 굵기가 점점 변하게 — 아래 그림자·가운데·빛 쪽 줄 3겹 */
  function rod(g, pts, r0, r1, col, L, o = {}) {
    const seg = [];
    let tot = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d);
      tot += d;
    }
    const at = (s) => {
      let i = 0;
      while (i < seg.length - 1 && s > seg[i]) s -= seg[i++];
      const t = seg[i] ? Math.min(1, s / seg[i]) : 0, a = pts[i], b = pts[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
    const step = Math.max(0.002, Math.min(r0, r1) * 0.35);
    const n = Math.max(2, Math.ceil(tot / step));
    const layer = (c, kr, ox, oy, alpha) => {
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = c;
      g.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * tot, p = at(s), r = (r0 + (r1 - r0) * (i / n)) * kr;
        g.moveTo(p[0] + ox * r + r, p[1] + oy * r);
        g.arc(p[0] + ox * r, p[1] + oy * r, r, 0, 6.283);
      }
      g.fill();
      g.restore();
    };
    if (o.shadow !== false) layer(o.sc || "rgba(55,32,12,.22)", 1.15, -L[0] * 0.35, -L[1] * 0.4, 1);
    layer(drk(col, 0.3, o.dk), 1, -L[0] * 0.12, -L[1] * 0.14, 1);
    layer(col, 0.84, L[0] * 0.06, L[1] * 0.06, 1);
    layer(lit(col, 0.38), 0.4, L[0] * 0.55, L[1] * 0.55, 0.75);
  }

  /* ---------- 나무 ---------- */
  // 단위: 나무 키 = 1, 밑동 (0,0), 위쪽은 -y
  const CANOPY = [
    // [x, y, r] — 위(뒤)부터 그리면 아래(앞) 덩어리가 겹쳐 보임
    [0, -0.9, 0.14], [-0.14, -0.84, 0.15], [0.13, -0.85, 0.15],
    [-0.25, -0.7, 0.15], [0.25, -0.71, 0.15], [-0.08, -0.69, 0.18], [0.1, -0.7, 0.18],
    [-0.28, -0.55, 0.14], [0.28, -0.56, 0.14], [-0.15, -0.51, 0.15], [0.14, -0.52, 0.15], [0, -0.55, 0.16],
  ];
  // 꽃·봉오리·사과 자리 (수관 앞면)
  const DECO = [[-0.25, -0.57], [0.01, -0.86], [0.25, -0.6], [-0.12, -0.72], [0.14, -0.73]];
  const DECO2 = [[-0.31, -0.7], [0.31, -0.72], [-0.02, -0.62], [-0.18, -0.88], [0.18, -0.9], [0.08, -0.52], [-0.08, -0.52]];
  const PAL = [
    ["#9ad673", "#86c962", "#b1e18b"], // 봄: 연두 (꽃이 피면 분홍이 섞임)
    ["#3f9a43", "#32863a", "#4caa4e"], // 여름: 짙은 초록
    ["#f08c2e", "#e0582c", "#f6b53a"], // 가을: 주황·빨강·노랑
    null, // 겨울: 잎 없음
  ];
  const PINK = ["#ffc2d6", "#ffadc8", "#ffd4e2"];
  const PINKI = [0, 1, 4, 6, 7, 10]; // 꽃 핀 덩어리 (좌우 고르게)
  const BARK = "#8b5a33";
  /** 가지 뼈대 (늘 같은 모양 — 계절이 바뀌어도 같은 나무) */
  function skeleton() {
    const r = rng(11), out = [];
    const grow = (x, y, a, len, w, d) => {
      const bend = (r() - 0.5) * 0.5;
      const mx = x + Math.sin(a + bend * 0.5) * len * 0.5, my = y - Math.cos(a + bend * 0.5) * len * 0.5;
      const ex = x + Math.sin(a + bend) * len, ey = y - Math.cos(a + bend) * len;
      out.push({ pts: [[x, y], [mx, my], [ex, ey]], w0: w, w1: w * 0.62, d });
      if (d >= 3) return;
      const n = d === 0 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const sp = n === 3 ? [-0.62, 0.05, 0.6][i] : i ? 0.42 : -0.42;
        grow(ex, ey, a + bend + sp + (r() - 0.5) * 0.2, len * (0.68 + r() * 0.1), w * 0.62, d + 1);
      }
    };
    grow(0, -0.42, -0.08, 0.26, 0.046, 0);
    return out;
  }
  const SKEL = skeleton();
  /** 나무 한 장 그리기: g 는 (0,0)=밑동, 단위 1=키 로 맞춘 상태. k 계절, v 'act'(장식 없음) | 'full'(꽃·사과 그려 넣음), thumb(작은 그림: 눈사람까지) */
  function drawTree(g, k, v, L, cw, ch, thumb) {
    const S = g.getTransform().a; // 1 단위 = S px
    // 땅 그림자 (빛 반대쪽으로 길게)
    softEllipse(g, -L[0] * 0.09, 0.006, 0.34, 0.06, k === 3 ? "80,100,140" : "50,28,10", k === 3 ? 0.3 : 0.38);
    // 줄기 (뿌리 쪽이 넓게)
    const trunk = () => {
      g.save();
      const tg = g.createLinearGradient(-0.07, 0, 0.07, 0);
      tg.addColorStop(L[0] < 0 ? 0 : 1, lit(BARK, 0.22));
      tg.addColorStop(0.5, BARK);
      tg.addColorStop(L[0] < 0 ? 1 : 0, drk(BARK, 0.38));
      g.shadowColor = "rgba(50,28,10,.3)";
      g.shadowBlur = S * 0.02;
      g.shadowOffsetX = -L[0] * S * 0.01;
      g.fillStyle = tg;
      g.beginPath();
      g.moveTo(-0.12, 0.012);
      g.quadraticCurveTo(-0.062, -0.03, -0.06, -0.14);
      g.quadraticCurveTo(-0.05, -0.3, -0.046, -0.44);
      g.lineTo(0.046, -0.44);
      g.quadraticCurveTo(0.052, -0.3, 0.062, -0.14);
      g.quadraticCurveTo(0.066, -0.03, 0.125, 0.012);
      g.quadraticCurveTo(0, 0.04, -0.12, 0.012);
      g.fill();
      g.restore();
      // 나무껍질 홈
      g.save();
      g.strokeStyle = drk(BARK, 0.45);
      g.globalAlpha = 0.35;
      g.lineCap = "round";
      g.lineWidth = 0.009;
      [[-0.026, -0.04, -0.018, -0.3], [0.022, -0.07, 0.026, -0.36], [-0.002, -0.18, 0.006, -0.4]].forEach((p) => {
        g.beginPath();
        g.moveTo(p[0], p[1]);
        g.quadraticCurveTo(p[0] - 0.008, (p[1] + p[3]) / 2, p[2], p[3]);
        g.stroke();
      });
      g.restore();
    };
    trunk();
    // 가지
    const winter = k === 3;
    for (const b of SKEL) {
      if (!winter && b.d > 1) continue;
      rod(g, b.pts, b.w0, b.w1, BARK, L, { shadow: b.d < 2 });
    }
    if (winter) {
      // 가지 위 눈: 위쪽에 하얀 덩어리
      const r = rng(5);
      for (const b of SKEL) {
        if (b.d > 2) continue;
        const p0 = b.pts[0], p2 = b.pts[2];
        const ang = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);
        if (Math.abs(Math.abs(ang) - Math.PI / 2) < 0.35) continue; // 거의 서 있는 가지에는 눈이 덜 쌓임
        const pts = [];
        for (let i = 1; i <= 4; i++) {
          const t = i / 5, x = p0[0] + (p2[0] - p0[0]) * t, y = p0[1] + (p2[1] - p0[1]) * t;
          const w = b.w0 + (b.w1 - b.w0) * t;
          pts.push([x, y - w * 0.85 - r() * w * 0.2]);
        }
        rod(g, pts, b.w0 * 0.8, b.w1 * 0.75, "#f6f9ff", L, { dk: "#7f97bd", sc: "rgba(80,100,140,.12)" });
      }
      // 밑동의 눈 더미
      const so = { dk: "#8aa1c4", sc: "rgba(70,90,130,.25)", gl: 0.4 };
      blob(g, -0.1, -0.012, 0.1, 0.062, "#f6f9ff", L, Object.assign({ seed: 3 }, so));
      blob(g, 0.11, -0.008, 0.09, 0.056, "#f6f9ff", L, Object.assign({ seed: 4 }, so));
      blob(g, 0.0, 0.01, 0.13, 0.05, "#ffffff", L, Object.assign({ seed: 5 }, so));
    } else {
      const pal = PAL[k];
      CANOPY.forEach((c, i) => {
        let col = pal[i % 3];
        if (k === 0 && v === "full" && PINKI.includes(i)) col = PINK[i % 3];
        const x = c[0] * 1.12, y = c[1], r = c[2] * 1.06;
        blob(g, x, y, r * 1.04, r * 0.95, col, L, { seed: i + 1, gl: 0.16, hiK: 0.26, dkK: 0.44, sb: 0.42 });
        // 잎 뭉치: 빛 쪽 위 둘레에 작은 덩어리
        [-2.35, -1.55, -0.75].forEach((a, j) => {
          const rr = r * (0.4 + ((i + j) % 3) * 0.03);
          blob(g, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.48, rr, rr * 0.9, j % 2 ? lit(col, 0.05) : col, L, { seed: i * 7 + j, gl: 0.1, hiK: 0.2, dkK: 0.22, sb: 0.3, sc: "rgba(40,25,10,.12)" });
        });
      });
      if (v === "full") {
        if (k === 0) {
          [...DECO, ...DECO2].forEach((p, i) => drawFlower(g, p[0], p[1], i < 5 ? 0.062 : 0.05, L, i));
        } else if (k === 2) DECO.forEach((p) => drawApple(g, p[0], p[1], 0.06, L));
      }
    }
    if (thumb && winter) drawSnowman(g, 0.29, 0.02, 0.36, 3, L);
    if (thumb && k === 1) drawCicada(g, 0.02, -0.25, 0.06, L);
    grain(g, cw, ch, thumb ? 0.25 : 0.5);
  }
  function drawFlower(g, x, y, r, L, seed = 0) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + seed;
      blob(g, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.46, r * 0.46, i % 2 ? "#ffb3cb" : "#ffa3c2", L, { sb: 0.2, gl: 0.25, seed: seed * 5 + i });
    }
    blob(g, x, y, r * 0.3, r * 0.3, "#ffd34a", L, { shadow: false, gl: 0.35 });
  }
  function drawApple(g, x, y, r, L) {
    rod(g, [[x, y - r * 0.75], [x + r * 0.12, y - r * 1.25]], r * 0.09, r * 0.07, "#6b4524", L, { shadow: false });
    blob(g, x, y, r, r * 0.92, "#dc2a2a", L, { sb: 0.3, gl: 0.42, seed: x * 9 });
    blob(g, x + r * 0.42, y - r * 1.05, r * 0.36, r * 0.17, "#4aa64c", L, { rot: -0.5, shadow: false, gl: 0.2 });
  }
  function drawCicada(g, x, y, r, L) {
    g.save();
    g.fillStyle = "rgba(225,240,255,.75)";
    g.strokeStyle = "rgba(90,120,140,.7)";
    g.lineWidth = r * 0.06;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + s * r * 0.38, y + r * 0.35, r * 0.32, r * 0.75, s * 0.28, 0, 6.283);
      g.fill();
      g.stroke();
    }
    g.restore();
    blob(g, x, y + r * 0.3, r * 0.3, r * 0.62, "#5b4030", L, { sb: 0.2, gl: 0.3 });
    blob(g, x, y - r * 0.3, r * 0.4, r * 0.3, "#6b4c38", L, { shadow: false, gl: 0.3 });
    g.fillStyle = "#24170e";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(x + s * r * 0.3, y - r * 0.34, r * 0.13, 0, 6.283);
      g.fill();
    }
  }
  /** 눈사람 (n: 0 눈 더미, 1 아래 공, 2 공 두 개, 3 얼굴·목도리까지) — (x,y) 바닥 가운데, h 키 */
  function drawSnowman(g, x, y, h, n, L) {
    const W = "#f7fbff", o = { dk: "#7d95bb", sc: "rgba(70,90,130,.28)", gl: 0.45 };
    if (n === 0) {
      blob(g, x, y - h * 0.08, h * 0.36, h * 0.12, W, L, o);
      return;
    }
    blob(g, x, y - h * 0.24, h * 0.27, h * 0.25, W, L, o);
    if (n >= 2) blob(g, x, y - h * 0.6, h * 0.2, h * 0.19, W, L, o);
    if (n >= 3) {
      rod(g, [[x - h * 0.17, y - h * 0.5], [x - h * 0.15, y - h * 0.47], [x + h * 0.16, y - h * 0.47], [x + h * 0.18, y - h * 0.5]], h * 0.05, h * 0.05, "#ff5d6e", L, { shadow: false });
      rod(g, [[x + h * 0.08, y - h * 0.46], [x + h * 0.13, y - h * 0.32]], h * 0.045, h * 0.04, "#ff5d6e", L, { shadow: false });
      g.fillStyle = "#2b2a33";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.arc(x + s * h * 0.065, y - h * 0.66, h * 0.022, 0, 6.283);
        g.fill();
      }
      g.fillStyle = "#ff8a2a";
      g.beginPath();
      g.moveTo(x - h * 0.01, y - h * 0.62);
      g.lineTo(x + h * 0.13, y - h * 0.595);
      g.lineTo(x - h * 0.01, y - h * 0.575);
      g.closePath();
      g.fill();
      rod(g, [[x - h * 0.19, y - h * 0.3], [x - h * 0.33, y - h * 0.42]], h * 0.018, h * 0.012, "#6b4524", L, { shadow: false });
      rod(g, [[x + h * 0.19, y - h * 0.3], [x + h * 0.33, y - h * 0.44]], h * 0.018, h * 0.012, "#6b4524", L, { shadow: false });
    }
  }

  /* ---------- 작은 점토 그림 (img 로 씀) — 이름별·크기별로 한 번만 ---------- */
  const SPR = {
    bud(g, L) {
      blob(g, 0.4, 0.8, 0.12, 0.08, "#5cae4f", L, { rot: 0.5, shadow: false, gl: 0.2 });
      blob(g, 0.6, 0.8, 0.12, 0.08, "#5cae4f", L, { rot: -0.5, shadow: false, gl: 0.2 });
      blob(g, 0.5, 0.55, 0.2, 0.27, "#ff8db3", L, { gl: 0.45 });
    },
    flower(g, L) {
      drawFlower(g, 0.5, 0.5, 0.36, L, 0.3);
    },
    apple(g, L) {
      drawApple(g, 0.5, 0.58, 0.3, L);
    },
    seed(g, L) {
      blob(g, 0.5, 0.5, 0.22, 0.3, "#8a5a2b", L, { rot: 0.4, gl: 0.4 });
    },
    hole(g) {
      softEllipse(g, 0.5, 0.5, 0.42, 0.2, "40,20,8", 0.7);
    },
    sprout(g, L) {
      rod(g, [[0.5, 0.97], [0.49, 0.75], [0.5, 0.5]], 0.035, 0.03, "#4ea845", L, { shadow: false });
      blob(g, 0.32, 0.44, 0.19, 0.09, "#69c35c", L, { rot: 0.45, gl: 0.3 });
      blob(g, 0.68, 0.4, 0.19, 0.09, "#69c35c", L, { rot: -0.45, gl: 0.3 });
    },
    cloud(g, L) {
      const o = { dk: "#8ea6c4", sc: "rgba(70,90,130,.2)", gl: 0.35 };
      blob(g, 0.5, 0.66, 0.38, 0.14, "#f4f8ff", L, o);
      blob(g, 0.28, 0.58, 0.18, 0.15, "#f7faff", L, o);
      blob(g, 0.72, 0.58, 0.18, 0.15, "#f7faff", L, o);
      blob(g, 0.5, 0.46, 0.24, 0.22, "#ffffff", L, o);
    },
    rainCloud(g, L) {
      const o = { dk: "#5f7393", sc: "rgba(50,70,100,.25)", gl: 0.25 };
      blob(g, 0.5, 0.66, 0.38, 0.14, "#d7e1ee", L, o);
      blob(g, 0.28, 0.58, 0.18, 0.15, "#dfe7f2", L, o);
      blob(g, 0.72, 0.58, 0.18, 0.15, "#dfe7f2", L, o);
      blob(g, 0.5, 0.46, 0.24, 0.22, "#e8eef6", L, o);
    },
    sun(g, L) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        blob(g, 0.5 + Math.cos(a) * 0.37, 0.5 + Math.sin(a) * 0.37, 0.07, 0.04, "#ffbf2e", L, { rot: a, shadow: false, gl: 0.3 });
      }
      blob(g, 0.5, 0.5, 0.25, 0.25, "#ffd84a", L, { gl: 0.5 });
    },
    can(g, L) {
      rod(g, [[0.62, 0.62], [0.78, 0.48], [0.9, 0.34]], 0.055, 0.04, "#3c9fd6", L);
      blob(g, 0.92, 0.31, 0.065, 0.055, "#2f88bd", L, { rot: -0.7, shadow: false });
      rod(g, [[0.2, 0.58], [0.11, 0.42], [0.2, 0.26], [0.42, 0.28]], 0.042, 0.042, "#2f88bd", L);
      blob(g, 0.42, 0.62, 0.26, 0.24, "#4fb3e8", L, { gl: 0.42 });
      g.fillStyle = "rgba(20,60,90,.35)";
      g.beginPath();
      g.ellipse(0.42, 0.42, 0.16, 0.05, 0, 0, 6.283);
      g.fill();
    },
    basket(g, L) {
      rod(g, [[0.16, 0.5], [0.24, 0.16], [0.5, 0.06], [0.76, 0.16], [0.84, 0.5]], 0.035, 0.035, "#a8692f", L);
      g.save();
      const bg = g.createLinearGradient(0, 0.45, 0, 0.92);
      bg.addColorStop(0, "#d79a55");
      bg.addColorStop(1, "#9a5f2b");
      g.fillStyle = bg;
      g.shadowColor = "rgba(55,32,12,.3)";
      g.shadowBlur = 6;
      g.shadowOffsetY = 3;
      g.beginPath();
      g.moveTo(0.1, 0.5);
      g.lineTo(0.9, 0.5);
      g.quadraticCurveTo(0.86, 0.9, 0.74, 0.92);
      g.lineTo(0.26, 0.92);
      g.quadraticCurveTo(0.14, 0.9, 0.1, 0.5);
      g.fill();
      g.restore();
      g.strokeStyle = "rgba(110,60,20,.45)";
      g.lineWidth = 0.022;
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(0.13 + i * 0.012, 0.5 + i * 0.1);
        g.lineTo(0.87 - i * 0.012, 0.5 + i * 0.1);
        g.stroke();
      }
      rod(g, [[0.08, 0.5], [0.92, 0.5]], 0.04, 0.04, "#c27f3e", L, { shadow: false });
    },
    butterfly(g, L) {
      blob(g, 0.3, 0.36, 0.2, 0.17, "#ffb347", L, { rot: -0.5, gl: 0.35 });
      blob(g, 0.7, 0.36, 0.2, 0.17, "#ffb347", L, { rot: 0.5, gl: 0.35 });
      blob(g, 0.33, 0.66, 0.14, 0.12, "#ff7eb6", L, { rot: 0.4, gl: 0.3 });
      blob(g, 0.67, 0.66, 0.14, 0.12, "#ff7eb6", L, { rot: -0.4, gl: 0.3 });
      rod(g, [[0.5, 0.28], [0.5, 0.74]], 0.04, 0.03, "#5b3a2a", L, { shadow: false });
    },
    cicada(g, L) {
      drawCicada(g, 0.5, 0.42, 0.42, L);
    },
    sm0(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 0, L);
    },
    sm1(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 1, L);
    },
    sm2(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 2, L);
    },
    sm3(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 3, L);
    },
  };
  const sprCache = new Map();
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  /** 점토 그림 → data URL (크기 px, 빛 방향 L) */
  function spr(name, px, L) {
    const c = Math.max(16, Math.round((px * DPR()) / 8) * 8), key = name + "|" + c + "|" + L.join(",");
    if (sprCache.has(key)) return sprCache.get(key);
    const cv = document.createElement("canvas");
    cv.width = cv.height = c;
    const g = cv.getContext("2d");
    g.setTransform(c, 0, 0, c, 0, 0);
    SPR[name](g, L);
    grain(g, c, c, 0.8);
    const url = cv.toDataURL("image/png");
    if (sprCache.size > 80) sprCache.clear();
    sprCache.set(key, url);
    return url;
  }

  /* ---------- 이모지 → 점토 느낌 (3단계 물건) ----------
     그림을 캔버스에 그린 뒤: 모양(알파)을 흐려 높이로 → 빛 쪽 밝게·반대쪽 어둡게 + 가장자리 살짝 어둡게 + 색을 조금 뭉개고 결 */
  const clayECache = new Map();
  function clayEmoji(ch, px) {
    const S = Math.max(48, Math.round((px * DPR()) / 8) * 8), key = ch + "|" + S;
    if (clayECache.has(key)) return Promise.resolve(clayECache.get(key));
    return KP.loadE([ch]).then(() => {
      const im = KP.eImage(ch);
      if (!im || !im.naturalWidth) return null;
      const cv = document.createElement("canvas");
      cv.width = cv.height = S;
      const g = cv.getContext("2d", { willReadFrequently: true });
      const pad = S * 0.1;
      g.drawImage(im, pad, pad, S - pad * 2, S - pad * 2);
      const id = g.getImageData(0, 0, S, S), d = id.data, n = S * S;
      const A = new Float32Array(n), H = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        A[i] = d[i * 4 + 3] / 255;
        const lum = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
        H[i] = A[i] * (0.82 + lum * 0.18);
      }
      // 상자 흐림 3번 (가로·세로) ≈ 부드러운 언덕
      const tmp = new Float32Array(n);
      const blur = (src, r) => {
        for (let pass = 0; pass < 3; pass++) {
          for (let y = 0; y < S; y++) {
            let s = 0;
            for (let x = -r; x <= r; x++) s += src[y * S + Math.min(S - 1, Math.max(0, x))];
            for (let x = 0; x < S; x++) {
              tmp[y * S + x] = s / (2 * r + 1);
              s += src[y * S + Math.min(S - 1, x + r + 1)] - src[y * S + Math.max(0, x - r)];
            }
          }
          for (let x = 0; x < S; x++) {
            let s = 0;
            for (let y = -r; y <= r; y++) s += tmp[Math.min(S - 1, Math.max(0, y)) * S + x];
            for (let y = 0; y < S; y++) {
              src[y * S + x] = s / (2 * r + 1);
              s += tmp[Math.min(S - 1, y + r + 1) * S + x] - tmp[Math.max(0, y - r) * S + x];
            }
          }
        }
      };
      blur(H, Math.max(2, Math.round(S * 0.035)));
      // 색 살짝 뭉개기 (잔선 줄이기)
      const C = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) C[i * 3 + k] = d[i * 4 + k] * A[i];
      const ch3 = new Float32Array(n);
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < n; i++) ch3[i] = C[i * 3 + k];
        blur(ch3, 1);
        for (let i = 0; i < n; i++) C[i * 3 + k] = ch3[i];
      }
      const Ab = A.slice();
      blur(Ab, 1);
      const lx = -0.5, ly = -0.62, lz = 0.6, ln = Math.hypot(lx, ly, lz);
      const r = rng(17), k2 = S / 60;
      for (let y = 1; y < S - 1; y++)
        for (let x = 1; x < S - 1; x++) {
          const i = y * S + x;
          if (A[i] < 0.01) continue;
          const nx = (H[i - 1] - H[i + 1]) * k2 * 6, ny = (H[i - S] - H[i + S]) * k2 * 6, nz = 1;
          const nn = Math.hypot(nx, ny, nz);
          const sh = (nx * lx + ny * ly + nz * lz) / (nn * ln);
          const ao = 0.78 + 0.22 * Math.min(1, H[i] * 2.2);
          const spec = Math.pow(Math.max(0, sh), 18) * 55;
          const ab = Math.max(0.01, Ab[i]);
          for (let k = 0; k < 3; k++) {
            let c = C[i * 3 + k] / ab;
            const gray = (C[i * 3] + C[i * 3 + 1] + C[i * 3 + 2]) / 3 / ab;
            c = c * 0.9 + gray * 0.1; // 채도 조금 낮춤 (점토는 무광)
            c = c * (0.62 + 0.5 * sh) * ao + spec + (r() - 0.5) * 9;
            d[i * 4 + k] = c;
          }
        }
      g.putImageData(id, 0, 0);
      const url = cv.toDataURL("image/png");
      clayECache.set(key, url);
      return url;
    });
  }
  const loadImg = (url) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = url;
    });

  KP.game({
    id: "seasons",
    icon: "🌳",
    name: "사계절 나무",
    cat: "smart",
    levels: 3,
    score: "⭐",
    setup(ctx) {
      const U = KP.u,
        A = KP.audio;
      const IMG = "assets/play-clay/seasons/";
      KP.css("seasons", `
      .ss{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .ssScene{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#cfe6f5}
      .ssBg2{position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;pointer-events:none;z-index:0;opacity:0}
      .ssTreeL{position:absolute;left:0;top:0;z-index:0;pointer-events:none;transform-origin:50% 96.3%;transition:transform 1.6s cubic-bezier(.3,1.25,.5,1)}
      .ssTreeL.t0{transform:scale(0)}
      .ssTreeL.t1{transform:scale(.3)}
      .ssSw{position:absolute;inset:0;transform-origin:50% 96.3%;animation:ssSway 6s ease-in-out infinite}
      @keyframes ssSway{0%,100%{transform:rotate(-.5deg)}50%{transform:rotate(.5deg)}}
      .ssSw canvas{position:absolute;inset:0;width:100%;height:100%;transition:opacity 1.2s}
      .ssSw canvas.off{opacity:0}
      .ssSpr{position:absolute;width:var(--s,40px);height:var(--s,40px);margin:calc(var(--s,40px)*-.5) 0 0 calc(var(--s,40px)*-.5);pointer-events:none;transition:transform .3s,opacity .5s}
      .ssSpr img{width:100%;height:100%;display:block}
      .ssSpr{animation:ssIn .8s .35s backwards}
      @keyframes ssIn{from{opacity:0;transform:scale(.4)}}
      .ssSpr.bud img{animation:ssBud 1.8s ease-in-out infinite}
      @keyframes ssBud{50%{transform:scale(1.12)}}
      .ssSpr.open{animation:ssBloom .5s cubic-bezier(.3,1.6,.5,1)}
      @keyframes ssBloom{from{transform:scale(.2) rotate(-40deg)}}
      .ssSpr.fruit img{animation:ssSwing 2.6s ease-in-out infinite;transform-origin:50% 10%}
      @keyframes ssSwing{50%{transform:rotate(8deg)}}
      .ssSpr.gone{opacity:0;transform:scale(.3)}
      .ssSpr.sing img{animation:ssBuzz .12s linear infinite}
      @keyframes ssBuzz{50%{transform:translateX(2px)}}
      .ssUi{position:absolute;left:0;top:0;pointer-events:none}
      .ssBtn{position:absolute;left:0;top:0;width:var(--s,90px);height:var(--s,90px);pointer-events:auto;touch-action:none;transition:opacity .45s,scale .45s}
      .ssBtn img{width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 6px 5px rgba(60,40,20,.22))}
      .ssBtn.off{opacity:0;pointer-events:none!important;scale:.4}
      .ssSoil{border-radius:50%;background:radial-gradient(ellipse,rgba(255,236,170,.0),rgba(255,236,170,.0));transition:background .3s}
      .ssSoil.ask{animation:ssAsk 1.6s ease-in-out infinite}
      @keyframes ssAsk{0%,100%{box-shadow:0 0 0 0 rgba(255,214,90,0)}50%{box-shadow:0 0 0 10px rgba(255,214,90,.45)}}
      .ssSoil.wet{background:radial-gradient(ellipse,rgba(40,20,6,.4) 30%,rgba(40,20,6,0) 70%)}
      .ssSoil .hole,.ssSoil .sprout{position:absolute;left:50%;transform:translate(-50%,-50%)}
      .ssSoil .hole{top:50%;width:36%;height:auto;opacity:0;transition:opacity .3s}
      .ssSoil.seeded .hole{opacity:1}
      .ssSoil .sprout{top:10%;width:34%;height:auto;transform:translate(-50%,-50%) scale(0);transform-origin:50% 100%;transition:transform .7s cubic-bezier(.3,1.6,.5,1)}
      .ssSoil.sprouted .sprout{transform:translate(-50%,-50%) scale(1)}
      .ssSun.shine::before{content:"";position:absolute;inset:-50%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,120,.9),rgba(255,236,120,0) 65%);animation:ssGlow 1.4s ease-out forwards}
      @keyframes ssGlow{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
      .ssSun img{animation:ssSpin 14s linear infinite}
      @keyframes ssSpin{to{transform:rotate(360deg)}}
      .ssCloud.ssHop img{animation:ssJump .4s}
      @keyframes ssJump{40%{transform:translateY(-8%) scale(1.06)}}
      .ssMan{width:var(--w,90px);height:var(--s,120px)}
      .ssMan img{position:absolute;inset:0;filter:drop-shadow(0 6px 5px rgba(70,90,130,.25))}
      .ssMan.ssSqz img{animation:ssBump .35s}
      @keyframes ssBump{40%{transform:scale(1.08,.94)}}
      .ssHeld{pointer-events:auto!important;touch-action:none}
      .ssHeld img{width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 5px 4px rgba(60,40,20,.25));transition:transform .3s;transform-origin:30% 60%}
      .ssHeld.pour img{transform:rotate(28deg)}
      .ssBasket b{position:absolute;right:-8%;top:-10%;min-width:1.6em;height:1.6em;border-radius:1em;background:#fffaf2;color:#e0582c;font-size:max(16px,calc(var(--s,80px)*.24));display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(120,80,40,.18)}
      .ssBasket.ssSqz img{animation:ssBump .35s}
      .ssFly{position:absolute;left:0;top:0;z-index:8;pointer-events:none;width:var(--s,40px);height:var(--s,40px);transition:transform .7s cubic-bezier(.5,-0.3,.6,1)}
      .ssFly img{width:100%;height:100%}
      .ssBug{position:absolute;left:0;top:0;width:var(--s,44px);height:var(--s,44px);pointer-events:none!important;display:none;z-index:6}
      .ssBug.on{display:block}
      .ssBug img{width:100%;height:100%;animation:ssFlap .25s ease-in-out infinite alternate;transform-origin:50% 50%}
      @keyframes ssFlap{to{transform:scaleX(.55)}}
      .ssMeme{position:absolute;left:0;top:0;z-index:7;background:#fffaf2;border-radius:16px;padding:3px 10px;font-size:max(16px,2.4vmin);color:var(--ink);box-shadow:0 3px 0 rgba(120,80,40,.15);opacity:0;transition:opacity .4s;pointer-events:none!important;white-space:nowrap}
      .ssMeme.on{opacity:1}
      .ssFx{position:absolute;left:0;top:0;pointer-events:none!important;z-index:5}
      .ssTap{position:absolute;left:0;top:0;pointer-events:none;touch-action:none}
      .ssTap.on{pointer-events:auto}
      .ssLoad{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      .ssAsk{display:flex;gap:clamp(8px,1.6vw,18px);justify-content:center;flex:0 0 auto}
      .ssAsk .choice{flex:0 1 clamp(96px,min(18vw,22vh),180px);min-width:0;aspect-ratio:1/1.12;min-height:0;padding:6px;flex-direction:column;gap:2px;font-size:clamp(18px,2.6vw,26px);background:#fffaf2;border-radius:26px;box-shadow:0 6px 0 rgba(140,95,50,.18)}
      .ssAsk .choice img,.ssMini img.th{width:100%;flex:1;min-height:0;display:block;object-fit:cover;border-radius:18px}
      .ssSort{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:minmax(0,1fr) auto;gap:clamp(8px,1.4vw,16px)}
      .ssMini{min-height:0;border-radius:26px;padding:6px 6px 4px;display:flex;flex-direction:column;align-items:center;background:#fffaf2;box-shadow:0 6px 0 rgba(140,95,50,.16);font-size:clamp(18px,2.6vw,28px);color:var(--ink);transition:transform .2s;position:relative}
      .ssMini.dropHover{transform:scale(1.05);box-shadow:0 0 0 5px #ffd23f,0 6px 0 rgba(140,95,50,.16)}
      .ssMini .got{position:absolute;left:6px;right:6px;bottom:2.2em;display:flex;flex-wrap:wrap;justify-content:center;gap:2px}
      .ssMini .got img{width:clamp(30px,4vw,48px);height:clamp(30px,4vw,48px);animation:popIn .3s;filter:drop-shadow(0 3px 2px rgba(60,40,20,.3))}
      .ssTray{grid-column:1/-1;display:flex;gap:clamp(14px,3vw,36px);justify-content:center;align-items:center;min-height:clamp(88px,14vh,134px);
        background:linear-gradient(#f7ead6,#efdcc0);border-radius:28px;padding:8px 12px;box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12)}
      .ssItem{width:clamp(76px,min(11vw,13vh),116px);height:clamp(76px,min(11vw,13vh),116px);border-radius:26px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);box-shadow:0 6px 0 rgba(140,95,50,.18);position:relative;flex:none}
      .ssItem img{position:absolute;left:4%;top:4%;width:92%;height:92%;filter:drop-shadow(0 4px 3px rgba(80,40,20,.25));pointer-events:none}
      .ssItem.dragging{z-index:50;background:transparent;box-shadow:none}
      @media (max-aspect-ratio:3/4){
        .ssSort{grid-template-columns:repeat(2,1fr);grid-template-rows:minmax(0,1fr) minmax(0,1fr) auto}
        .ssAsk{display:grid;grid-template-columns:repeat(4,1fr)}
        .ssAsk .choice{aspect-ratio:auto;height:clamp(96px,15vh,170px)}
      }
      @media (orientation:landscape) and (max-height:520px){
        .ss{flex-direction:row}
        .ssAsk{display:grid;grid-template-columns:repeat(2,auto);align-content:center}
        .ssAsk .choice{width:min(25vh,124px);height:min(38vh,134px);aspect-ratio:auto;flex:none;font-size:16px}
        .ssSort{grid-template-columns:repeat(4,1fr) auto;grid-template-rows:minmax(0,1fr)}
        .ssTray{grid-column:auto;flex-direction:column;gap:8px;min-height:0}
        .ssItem{width:min(22vh,84px);height:min(22vh,84px)}
        .ssMini .got img{width:28px;height:28px}
      }
    `);

      /* ---------- 계절 · 물건 ---------- */
      const SEA = [
        { name: "봄", em: "🌸" },
        { name: "여름", em: "☀️" },
        { name: "가을", em: "🍁" },
        { name: "겨울", em: "❄️" },
      ];
      // 계절 물건 (3단계) — [그림, 이름, 계절, 맞게 넣었을 때 말]
      const ITEMS = [
        ["🌸", "벚꽃", 0, "벚꽃은 봄에 활짝 펴요!"],
        ["🌷", "튤립", 0, "튤립은 봄에 펴요!"],
        ["🦋", "나비", 0, "봄에는 나비가 팔랑팔랑!"],
        ["🌱", "새싹", 0, "봄에는 새싹이 쏙 나와요!"],
        ["🍉", "수박", 1, "여름에는 시원한 수박!"],
        ["👙", "수영복", 1, "여름에는 수영복 입고 물놀이!"],
        ["🌻", "해바라기", 1, "해바라기는 여름에 펴요!"],
        ["⛱️", "파라솔", 1, "여름에는 바닷가에 가요!"],
        ["🌰", "밤", 2, "밤은 가을에 열려요!"],
        ["🍁", "단풍잎", 2, "가을에는 단풍잎이 빨개요!"],
        ["🍂", "낙엽", 2, "가을에는 낙엽이 떨어져요!"],
        ["🌾", "벼", 2, "가을에는 벼가 노랗게 익어요!"],
        ["🧤", "장갑", 3, "겨울에는 장갑을 껴요!"],
        ["⛄", "눈사람", 3, "겨울에는 눈사람을 만들어요!"],
        ["❄️", "눈송이", 3, "눈송이는 겨울에 내려요!"],
        ["🛷", "썰매", 3, "겨울에는 썰매를 타요!"],
      ];
      // 배경 4장(1344×752, 같은 구도): 가운데 흙 자리 [u, v, 가로 반지름, 세로 반지름] — 계절마다 조금 다름
      const BGF = ["spring", "summer", "autumn", "winter"].map((n) => IMG + n + ".jpg");
      const SPOT = [
        [0.503, 0.806, 0.197, 0.083],
        [0.497, 0.767, 0.147, 0.067],
        [0.503, 0.739, 0.197, 0.083],
        [0.497, 0.783, 0.178, 0.072],
      ];
      // 빛이 오는 쪽(화면): 여름 그림은 해가 오른쪽 위
      const LIGHT = [[-0.6, -0.75], [0.55, -0.8], [-0.6, -0.72], [-0.45, -0.8]];
      ctx.BG = {
        file: BGF[0], img: [1344, 752], vh: 0.5, near: 0.2, fov: 34, focus: [0.5, 0.56], focusP: [0.5, 0.6],
        sun: [-0.5, 1, 0.7], sunCol: "#fff4e2", spots: { tree: [0.5, 0.79] },
      };

      /* ---------- 화면 ---------- */
      const wrap = U.el("div", "ss");
      const scene = U.el("div", "ssScene");
      const ask = U.el("div", "ssAsk");
      const sort = U.el("div", "ssSort");
      wrap.append(scene, ask, sort);
      ctx.body.appendChild(wrap);
      // 무대에 붙는 것들 (무대를 새로 만들 때마다 옮겨 붙임)
      const bg2 = U.el("div", "ssBg2");
      const treeL = U.el("div", "ssTreeL t0");
      const sw = U.el("div", "ssSw");
      const cvA = U.el("canvas", ""), cvB = U.el("canvas", "off");
      sw.append(cvA, cvB);
      treeL.appendChild(sw);
      const soil = U.el("button", "ssBtn ssSoil off", '<img class="hole" alt="" src=""><img class="sprout" alt="" src="">');
      soil.setAttribute("aria-label", "흙");
      const sun = U.el("button", "ssBtn ssSun off", '<img alt="" src="">');
      const cloud = U.el("button", "ssBtn ssCloud off", '<img alt="" src="">');
      const man = U.el("button", "ssBtn ssMan off", '<img alt="" src="">');
      const tapZone = U.el("div", "ssTap"); // 나무 근처 아무 데나 누르면 가장 가까운 꽃봉오리·사과
      const can = U.el("div", "ssHeld ssCan", '<img alt="" src="">');
      const basket = U.el("div", "ssHeld ssBasket", '<img alt="" src=""><b>0</b>');
      const bugs = [0, 1].map(() => U.el("div", "ssBug", '<img alt="" src="">'));
      const meme = U.el("div", "ssMeme", "맴맴");
      const fx = U.el("canvas", "ssFx");
      const fg = fx.getContext("2d");
      [soil, sun, cloud, man, tapZone, can].forEach((el) => ctx.fast(el, (e) => el._on && el._on(e)));
      const tapOnce = (el) =>
        new Promise((res) => {
          el._on = (e) => {
            el._on = null;
            res(e);
          };
        });

      /* ---------- 상태 ---------- */
      let season = 0,
        grown = false,
        rid = 0,
        sprites = [],
        bugsOn = false,
        leafRate = 0,
        treeKey = "",
        treeV = "act",
        bgK = -1,
        st = null,
        act = null,
        fw = null,
        TL = { x: 0, y: 0, w: 100, h: 100, S: 100 }; // 나무 층 자리 (px)
      const alive = (r) => r === rid && ctx._active;
      const off = (el, v) => el.classList.toggle("off", v);
      const L = () => LIGHT[season];

      /* ---------- 무대 ---------- */
      async function makeStage() {
        const CS = KP.clayStage;
        dropStage();
        const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
        const slow = KP.store.get("seasons:flat", null);
        let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
        if (!flat) {
          try {
            await CS.load();
          } catch (e) {
            flat = true;
          }
        }
        if (!ctx._active || tok !== ctx._stTok) return null;
        let s;
        const opt = {
          flat,
          qKey: "play3d:q",
          onLost: () => ctx._active && st === s && ctx.begin(true),
          onSlow: () => {
            if (!ctx._active || st !== s) return;
            KP.store.set("seasons:flat", { t: Date.now() });
            KP.toast("기기가 바빠서 그림으로 바꿨어요");
            ctx.begin(true);
          },
        };
        ctx.BG.file = BGF[Math.max(0, bgK)];
        try {
          s = CS.create(scene, ctx.BG, opt);
        } catch (e) {
          opt.flat = true;
          s = CS.create(scene, ctx.BG, opt);
        }
        st = ctx.st = s;
        // 배경 겹침 층·나무 층은 배경 바로 위(3D 인형 아래), 누르는 것들은 맨 위 층
        scene.insertBefore(treeL, s.bgEl.nextSibling);
        scene.insertBefore(bg2, treeL);
        bg2.style.opacity = 0;
        s.ui.append(fx, tapZone, soil, sun, cloud, man, meme, ...bugs);
        treeKey = "";
        s.onResize = () => layout();
        layout();
        return s;
      }
      function dropStage() {
        ctx.track = null;
        if (fw) fw.clear();
        fw = null;
        if (act) act.dispose();
        act = ctx.actor = null;
        if (st) st.dispose();
        st = ctx.st = null;
        treeL.remove();
        bg2.remove();
      }
      async function makeActor(s) {
        const U2 = KP.u, D = KP.DOLL;
        const dolls = await KP.dollActor.painted();
        if (st !== s || s.dead) return null;
        let pick;
        if (dolls.length) {
          const c = dolls.length > 1 ? dolls.filter((x) => x.id !== ctx.lastDoll) : dolls;
          const it = U2.pick(c);
          ctx.lastDoll = it.id;
          pick = { item: it };
        } else {
          const sp = U2.pick(D.ORDER.filter((x) => x !== ctx.lastDoll));
          ctx.lastDoll = sp;
          pick = { species: sp };
        }
        let a;
        try {
          a = s.gl ? await KP.dollActor.create(s, pick) : await KP.dollActor.create2D(s, pick);
        } catch (e) {
          console.warn("인형 준비 실패", e && e.message);
          if (st !== s || s.dead) return null;
          a = await KP.dollActor.create2D(s, { species: "bear" });
        }
        if (!a) return null;
        if (st !== s || s.dead) {
          a.dispose();
          return null;
        }
        return a;
      }

      /* ---------- 자리 잡기 (화면 크기가 바뀔 때마다) ---------- */
      const pxToGround = (x, y) => {
        const v = st.bc.view;
        return st.bc.ground((x + v.ox) / v.fw, (y + v.oy) / v.fh);
      };
      let dollAt = null,
        renderT = null;
      function layout() {
        if (!st || !st.bc) return;
        const W = st.w, H = st.h, sp = SPOT[season];
        fx.width = Math.round(W * Math.min(1.5, devicePixelRatio || 1));
        fx.height = Math.round(H * Math.min(1.5, devicePixelRatio || 1));
        fx.style.width = W + "px";
        fx.style.height = H + "px";
        fg.setTransform(fx.width / W, 0, 0, fx.height / H, 0, 0);
        if (bg2.style.backgroundImage) {
          bg2.style.backgroundSize = st.bgEl.style.backgroundSize;
          bg2.style.backgroundPosition = st.bgEl.style.backgroundPosition;
        }
        // 나무: 밑동 = 흙 자리 가운데(조금 뒤), 키 = 그림 높이의 62% (위로 잘리지 않게, 폭이 화면을 넘지 않게)
        const base = st.uvToPx(sp[0], sp[1] - sp[3] * 0.15);
        const fh = st.bc.view.fh;
        const S = Math.max(80, Math.min(fh * 0.62, (base.y - Math.max(14, H * 0.035)) / 1.07, (W * 0.96) / 0.92)); // 꼭대기 잎 뭉치까지 화면 안
        const cw = S * 1.12, chh = S * 1.08; // 수관 덩어리·그림자가 잘리지 않게 여유
        TL = { x: base.x, y: base.y, w: cw, h: chh, S };
        Object.assign(treeL.style, { width: cw + "px", height: chh + "px", left: base.x - cw / 2 + "px", top: base.y - chh + S * 0.04 + "px" });
        // 흙 자리 (누르는 곳)
        const sv = st.uvToPx(sp[0], sp[1]), rx = sp[2] * st.bc.view.fw, ry = sp[3] * fh;
        const sw2 = Math.min(W * 0.9, Math.max(110, rx * 1.5)), sh2 = Math.max(70, ry * 2.4);
        soil.style.cssText = `width:${sw2}px;height:${sh2}px;transform:translate(${sv.x - sw2 / 2}px,${sv.y - sh2 / 2}px)`;
        const hs = Math.max(60, S * 0.22);
        soil.querySelector(".sprout").style.width = hs + "px";
        soil.querySelector(".hole").style.width = Math.max(40, S * 0.12) + "px";
        // 해님(오른쪽 위)·구름(나무 왼쪽 위)·눈사람(나무 오른쪽)
        const ss = U.clamp(Math.min(W, H) * 0.2, 80, 150);
        sun.style.cssText = `--s:${ss}px;transform:translate(${W - ss * 1.08}px,${Math.max(6, H * 0.03)}px)`;
        const cs = U.clamp(S * 0.5, 110, 240);
        cloud.style.cssText = `--s:${cs}px;transform:translate(${U.clamp(base.x - cs * 0.95, 4, W - cs - 4)}px,${Math.max(4, base.y - S * 1.08 - cs * 0.1)}px)`;
        const mh = U.clamp(S * 0.42, 100, 260), mw = mh * 0.8;
        const mx = U.clamp(base.x + S * 0.34, mw * 0.5 + 4, W - mw * 0.5 - 4);
        man.style.cssText = `--s:${mh}px;--w:${mw}px;transform:translate(${mx - mw / 2}px,${base.y + ry * 0.6 - mh}px)`;
        tapZone.style.cssText = `width:${S}px;height:${S * 0.85}px;transform:translate(${base.x - S * 0.5}px,${base.y - S * 1.02}px)`;
        clearTimeout(renderT);
        renderT = setTimeout(() => ctx._active && st && renderTree(true), treeKey ? 220 : 0);
        placeSprites();
        // 인형: 나무 왼쪽 앞 (좁은 화면은 화면 안쪽으로)
        if (act) {
          const g0 = pxToGround(base.x, base.y + ry * 0.9) || st.spot("tree");
          act.setH(st.fitH(g0[0], g0[1], H > W ? 0.27 : 0.32));
          const bw = act.box().w || S * 0.3;
          const dx = U.clamp(base.x - cw * 0.44, bw * 0.6 + 4, W - bw * 0.6 - 4);
          dollAt = pxToGround(dx, base.y + ry * 1.05) || g0;
          if (act.a.state === "idle" && !act._jump && !ctx._dollEntering) act.place(dollAt[0], dollAt[1]);
        }
      }

      /* ---------- 나무 그리기 ---------- */
      let front = cvA;
      function renderTree(force) {
        if (!st) return;
        const key = season + treeV + "|" + Math.round(TL.S) + "|" + TL.w;
        if (!force && key === treeKey) return;
        const same = treeKey && treeKey.split("|")[0] === key.split("|")[0]; // 크기만 바뀜 → 겹치지 않고 바로
        treeKey = key;
        const d = Math.min(devicePixelRatio || 1, 1.5);
        const back = same ? front : front === cvA ? cvB : cvA;
        const cw = Math.round(TL.w * d), ch = Math.round(TL.h * d);
        back.width = cw;
        back.height = ch;
        const g = back.getContext("2d");
        g.clearRect(0, 0, cw, ch);
        const S = TL.S * d;
        g.setTransform(S, 0, 0, S, cw / 2, ch - S * 0.04);
        drawTree(g, season, treeV, L(), cw, ch);
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (!same) {
          back.classList.remove("off");
          front.classList.add("off");
          front = back;
        }
      }
      /** 계절 장면 바꾸기. mode: "act"(아이가 할 일 준비) / "full"(다 된 모습) / "seed"(씨앗 심기 전) */
      function setSeason(k, mode) {
        const prev = season;
        season = k;
        setBg(k);
        [sun, cloud, man, soil].forEach((b) => {
          off(b, true);
          b._on = null;
        });
        tapZone._on = null;
        tapZone.classList.remove("on");
        soil.classList.remove("seeded", "wet", "sprouted", "ask");
        meme.classList.remove("on");
        setBugs(false);
        leafRate = 0;
        holdNone();
        // 다른 계절의 꽃잎·낙엽·눈은 스르르 사라짐
        parts.forEach((q) => {
          if ((q.k === "snow" && k !== 3) || (q.k === "leaf" && k !== 2) || (q.k === "petal" && k !== 0)) q.f = q.f || 1;
        });
        clearSprites();
        treeV = mode === "full" ? "full" : "act";
        if (mode === "seed") {
          treeL.className = "ssTreeL t0";
          off(soil, false);
        } else if (grown) treeL.className = "ssTreeL";
        if (prev !== k) layout();
        else renderTree();
        if (mode === "seed") return;
        if (k === 0) {
          if (mode === "act") addSprites("bud", DECO);
          else setBugs(true);
        } else if (k === 1) {
          if (mode === "act") {
            cloud.querySelector("img").src = spr("cloud", 200, L());
            off(cloud, false);
          } else addSprites("cicada", [[0.02, -0.25]], 0.13);
        } else if (k === 2) {
          addSprites("fruit", DECO);
          leafRate = mode === "act" ? 0.5 : 1.6;
        } else {
          man.dataset.n = mode === "act" ? "0" : "3";
          man.querySelector("img").src = spr("sm" + man.dataset.n, 200, L());
          off(man, false);
        }
      }
      /** 배경 바꾸기: 지금 그림을 위 층에 두고 아래에 새 그림 → 위 층을 서서히 투명하게 (두 장만) */
      let bgTok = 0;
      async function setBg(k, instant) {
        if (bgK === k || !st) return;
        const my = ++bgTok, s = st;
        const im = await Promise.race([loadImg(BGF[k]), new Promise((r) => setTimeout(r, 2500))]);
        if (my !== bgTok || st !== s || s.dead) return;
        const url = 'url("' + BGF[k] + '")';
        if (instant || bgK < 0 || !im) {
          s.bgEl.style.backgroundImage = url;
          bg2.style.opacity = 0;
          bgK = k;
          return;
        }
        bg2.style.transition = "none";
        bg2.style.backgroundImage = s.bgEl.style.backgroundImage;
        bg2.style.backgroundSize = s.bgEl.style.backgroundSize;
        bg2.style.backgroundPosition = s.bgEl.style.backgroundPosition;
        bg2.style.opacity = 1;
        s.bgEl.style.backgroundImage = url;
        void bg2.offsetWidth;
        bg2.style.transition = "opacity 1.3s ease";
        bg2.style.opacity = 0;
        bgK = k;
      }

      /* ---------- 나무 위 작은 그림 (꽃봉오리·사과·매미) ---------- */
      function clearSprites() {
        const old = sprites;
        sprites = [];
        old.forEach((s) => s.classList.add("gone"));
        setTimeout(() => old.forEach((s) => s.remove()), 600);
      }
      function addSprites(cls, pts, k) {
        const name = cls === "bud" ? "bud" : cls === "fruit" ? "apple" : cls;
        sprites = pts.map(([x, y]) => {
          const s = U.el("div", "ssSpr " + cls, '<img alt="" src="">');
          s._p = [x, y];
          s._k = k || (cls === "fruit" ? 0.15 : 0.14);
          s._name = name;
          sw.appendChild(s);
          return s;
        });
        placeSprites();
      }
      function placeSprites() {
        for (const s of sprites) {
          const px = Math.max(cls0(s) ? 46 : 30, s._k * TL.S);
          s.style.setProperty("--s", px + "px");
          s.style.left = 50 + (s._p[0] / 1.12) * 100 + "%";
          s.style.top = ((1.04 + s._p[1]) / 1.08) * 100 + "%";
          const name = s.classList.contains("open") ? "flower" : s._name;
          const img = s.querySelector("img"), src = spr(name, px, L());
          if (img.getAttribute("src") !== src) img.src = src;
        }
      }
      const cls0 = (s) => s.classList.contains("bud") || s.classList.contains("fruit") || s.classList.contains("open");
      function setBugs(on) {
        bugsOn = on;
        bugs.forEach((b) => {
          b.classList.toggle("on", on);
          if (on) b.querySelector("img").src = spr("butterfly", 48, LIGHT[0]);
        });
      }

      /* ---------- 인형 손에 든 것 (물뿌리개·바구니) ---------- */
      function holdNone() {
        if (fw) fw.clear();
        can._on = null;
        can.classList.remove("pour");
        if (act) {
          act.hug(false);
          pose({});
        }
      }
      function hold(el, nm, dx, dy, k, img) {
        if (!fw || !act) return;
        fw.clear();
        el.querySelector("img").src = img;
        const sz = Math.max(70, act.box().h * k);
        el.style.width = el.style.height = sz + "px";
        el.style.setProperty("--s", sz + "px");
        fw.add(el, nm, dx, dy);
      }

      /* ---------- 인형 몸짓: 놀이가 정하는 덧붙임 자세로 부드럽게 ---------- */
      let poseT = {},
        tiltOn = false;
      const pose = (o) => (poseT = o || {});
      const KEYS = ["fR", "fL", "uR", "uL", "nod", "tilt", "sway", "bob"];
      function poseStep(dt, t) {
        if (!act || !act.play) return;
        const p = act.play, k = Math.min(1, dt * 7);
        for (const key of KEYS) p[key] += ((poseT[key] || 0) - p[key]) * k;
        if (tiltOn) p.tilt += Math.sin(t * 2.6) * 0.012;
      }
      async function nodPat(n = 2) {
        for (let i = 0; i < n; i++) {
          pose({ nod: 0.38, fL: 0.7, fR: 0.4 });
          await ctx.wait(280);
          pose({ nod: 0.22, fL: 0.3, fR: 0.2 });
          await ctx.wait(220);
        }
        pose({});
      }

      /* ---------- 캔버스 (꽃잎 · 비 · 낙엽 · 눈 · 물) ---------- */
      let rainT = 0,
        waterT = 0;
      const parts = [];
      const rel = (el) => {
        const a = el.getBoundingClientRect(),
          s = scene.getBoundingClientRect();
        return { x: a.left - s.left, y: a.top - s.top, w: a.width, h: a.height };
      };
      let bugT = 0,
        drew = false;
      function step(dt) {
        if (!st || !st.w) return;
        const W = st.w, H = st.h, r = Math.random;
        const n = (kind) => parts.reduce((c, p) => c + (p.k === kind), 0);
        const ground = TL.y + SPOT[season][3] * st.bc.view.fh * 0.4;
        if (season === 0 && bugsOn && r() < dt * 1.6 && n("petal") < 14) parts.push({ k: "petal", x: TL.x + (r() - 0.5) * TL.w, y: TL.y - TL.S * 0.7, vx: 10 + r() * 20, vy: 22 + r() * 18, a: r() * 6, s: 4 + r() * 3 });
        if (season === 2 && leafRate && r() < dt * leafRate && n("leaf") < 18)
          parts.push({ k: "leaf", x: TL.x + (r() - 0.5) * TL.w * 0.7, y: TL.y - TL.S * (0.5 + r() * 0.35), vx: (r() - 0.5) * 30, vy: 26 + r() * 20, a: r() * 6, s: 6 + r() * 4, c: U.pick(["#ff9b3d", "#e8563b", "#ffc935", "#c9772f"]), fl: ground + r() * 20 });
        if (season === 3 && n("snow") < 60 && r() < dt * 14) parts.push({ k: "snow", x: r() * W, y: -6, vx: (r() - 0.5) * 14, vy: 26 + r() * 30, a: r() * 6, s: 2 + r() * 3 });
        if (rainT > 0) {
          rainT -= dt;
          const c = rel(cloud);
          for (let i = 0; i < 4; i++) parts.push({ k: "rain", x: c.x + c.w * (0.15 + r() * 0.7), y: c.y + c.h * 0.62, vx: 0, vy: 420 + r() * 160, a: 0, s: 1, fl: ground });
        }
        if (waterT > 0) {
          waterT -= dt;
          const c = rel(can);
          const wx = c.x + c.w * 0.9, wy = c.y + c.h * 0.36;
          for (let i = 0; i < 3; i++) parts.push({ k: "drop", x: wx + (r() - 0.5) * 10, y: wy, vx: 50 + r() * 40, vy: 20 + r() * 40, a: 0, s: 1, g: 1, fl: ground + 6 });
        }
        if (parts.length > 260) parts.splice(0, parts.length - 260);
        if (!parts.length && !drew) return;
        fg.clearRect(0, 0, W, H);
        drew = parts.length > 0;
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.a += dt * 2;
          if (p.f) {
            p.f -= dt * 1.5;
            if (p.f <= 0) {
              parts.splice(i, 1);
              continue;
            }
          }
          if (p.g) p.vy += 600 * dt;
          p.x += (p.vx + (p.k === "petal" || p.k === "leaf" || p.k === "snow" ? Math.sin(p.a) * 18 : 0)) * dt;
          p.y += p.vy * dt;
          if (p.y > (p.fl || H + 12) || p.x < -20 || p.x > W + 20) {
            parts.splice(i, 1);
            continue;
          }
          if (p.k === "rain" || p.k === "drop") {
            fg.strokeStyle = "rgba(110,190,240,.85)";
            fg.lineWidth = 3;
            fg.lineCap = "round";
            fg.beginPath();
            fg.moveTo(p.x, p.y);
            fg.lineTo(p.x, p.y + (p.k === "rain" ? 12 : 6));
            fg.stroke();
          } else {
            fg.globalAlpha = p.f ? Math.max(0, p.f) : 1;
            fg.fillStyle = p.k === "petal" ? "#ffb3cf" : p.k === "snow" ? "#ffffff" : p.c;
            fg.beginPath();
            if (p.k === "snow") fg.arc(p.x, p.y, p.s, 0, 6.29);
            else fg.ellipse(p.x, p.y, p.s, p.s * 0.55, p.a, 0, 6.29);
            fg.fill();
            fg.globalAlpha = 1;
          }
        }
      }
      function bugStep(dt) {
        if (!bugsOn || !st) return;
        bugT += dt;
        const bs = U.clamp(TL.S * 0.12, 36, 70);
        bugs.forEach((b, i) => {
          const t = bugT * (0.5 + i * 0.15) + i * 2;
          const x = TL.x + Math.sin(t * 0.8) * TL.w * 0.55 - bs / 2,
            y = TL.y - TL.S * (0.75 + Math.sin(t * 1.9) * 0.12 - i * 0.18);
          b.style.setProperty("--s", bs + "px");
          b.style.transform = "translate(" + x + "px," + y + "px) scaleX(" + (Math.cos(t * 0.8) > 0 ? -1 : 1) + ") rotate(" + Math.sin(t * 9) * 8 + "deg)";
        });
      }

      /* ---------- 소리 ---------- */
      const chime = (i) => A.note(A.SCALE[i % A.SCALE.length], { inst: "bell", dur: 0.45, vol: 0.18 });
      const arp = (ns) => ns.forEach((nn, i) => A.note(nn, { inst: "bell", dur: 0.5, vol: 0.14, when: i * 0.09 }));
      function cicadaSing() {
        const c = sprites.find((s) => s._name === "cicada");
        if (c) c.classList.add("sing");
        const r = c ? rel(c) : { x: TL.x, y: TL.y - TL.S * 0.3, w: 40, h: 40 };
        meme.style.transform = `translate(${r.x + r.w * 0.9}px,${r.y - r.h * 0.2}px)`;
        meme.classList.add("on");
        for (let i = 0; i < 4; i++) A.tone(1300, { to: 1500, dur: 0.16, vol: 0.03, when: i * 0.32, type: "triangle" });
        ctx.after(1500, () => {
          if (c) c.classList.remove("sing");
          meme.classList.remove("on");
        });
      }
      const sparkle = (x, y, n = 8) => KP.pfx.burst(st.ui, x, y, "spark", n, ctx);

      /* ---------- 1단계: 씨앗 → 나무 ---------- */
      async function seedPhase(r) {
        setSeason(0, "seed");
        soil.querySelector(".hole").src = spr("hole", 60, L());
        soil.querySelector(".sprout").src = spr("sprout", 90, L());
        soil.classList.add("ask");
        ctx.say("씨앗을 콕 심어 봐요!");
        ctx.hint(() => soil, "흙을 콕 눌러요!");
        await tapOnce(soil);
        if (!alive(r)) return false;
        soil.classList.remove("ask");
        ctx.hint(null);
        // 인형이 손에 든 씨앗을 흙에 쏙 → 고개 숙여 톡톡
        const sr = rel(soil);
        const from = act ? act.anchor("handL") : { x: sr.x, y: sr.y - 80 };
        await flyTo("seed", Math.max(30, TL.S * 0.07), from, { x: sr.x + sr.w / 2, y: sr.y + sr.h / 2 }, 600);
        if (!alive(r)) return false;
        soil.classList.add("seeded");
        A.sfx("drop");
        await nodPat(2);
        if (!alive(r)) return false;
        // 물뿌리개: 인형이 들고 있음 → 아이가 누르면 기울여 물을 줌
        hold(can, "handL", 0.16, -0.02, 0.42, spr("can", 120, L()));
        ctx.say("씨앗을 심었어요! 물뿌리개를 눌러 물을 줘요!");
        ctx.hint(() => can, "물뿌리개를 눌러요!");
        await tapOnce(can);
        if (!alive(r)) return false;
        can.classList.add("pour");
        pose({ fL: 0.75, nod: 0.15 });
        waterT = 1.2;
        A.sfx("water");
        ctx.after(400, () => A.sfx("water"));
        ctx.hint(null);
        await ctx.wait(1300);
        if (!alive(r)) return false;
        holdNone();
        soil.classList.add("wet", "sprouted");
        A.sfx("sparkle");
        sun.querySelector("img").src = spr("sun", 150, L());
        off(sun, false);
        ctx.say("새싹이 쏙 나왔어요! 해님을 눌러요!");
        ctx.hint(() => sun, "해님을 눌러요!");
        await tapOnce(sun);
        if (!alive(r)) return false;
        U.replay(sun, "shine");
        arp(["C5", "E5", "G5", "C6"]);
        ctx.hint(null);
        await ctx.wait(600);
        if (!alive(r)) return false;
        off(sun, true);
        soil.classList.remove("sprouted");
        treeL.className = "ssTreeL";
        A.sfx("levelup");
        for (let i = 0; i < 4; i++) ctx.after(i * 260, () => st && sparkle(TL.x + U.randf(-0.3, 0.3) * TL.w, TL.y - TL.S * U.randf(0.3, 0.9), 6));
        grown = true;
        if (act) act.happy();
        await ctx.say("쑥쑥 자라서 나무가 됐어요!");
        await ctx.wait(800);
        off(soil, true);
        return alive(r);
      }
      /** 작은 그림 하나를 a → b 로 휙 (포물선 느낌) */
      function flyTo(name, size, a, b, ms) {
        const f = U.el("div", "ssFly", '<img alt="" src="' + spr(name, size, L()) + '">');
        f.style.setProperty("--s", size + "px");
        f.style.transition = "none";
        f.style.transform = `translate(${a.x - size / 2}px,${a.y - size / 2}px)`;
        st.ui.appendChild(f);
        void f.offsetWidth;
        f.style.transition = `transform ${ms}ms cubic-bezier(.5,-0.4,.6,1)`;
        f.style.transform = `translate(${b.x - size / 2}px,${b.y - size / 2}px) scale(.8)`;
        return ctx.wait(ms + 30).then(() => f.remove());
      }

      /* ---------- 1단계: 계절마다 할 일 ---------- */
      function nearSpot(e, list) {
        let best = null,
          bd = 1e9;
        list.forEach((s) => {
          const b = s.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
          if (d < bd) {
            bd = d;
            best = s;
          }
        });
        return best;
      }
      function spotsDone(cls, onEach) {
        return new Promise((res) => {
          const left = () => sprites.filter((s) => s.classList.contains(cls));
          const hint = () => {
            if (left().length) ctx.hint(() => left()[0], null);
          };
          hint();
          tapZone.classList.add("on");
          tapZone._on = (e) => {
            const s = nearSpot(e, left());
            if (!s) return;
            onEach(s);
            if (!left().length) {
              tapZone._on = null;
              tapZone.classList.remove("on");
              ctx.hint(null);
              res();
            } else hint();
          };
        });
      }
      async function spring(r) {
        setSeason(0, "act");
        ctx.say("봄이 왔어요! 꽃봉오리를 콕콕 눌러 꽃을 피워요!");
        let i = 0;
        await spotsDone("bud", (s) => {
          s.classList.remove("bud");
          s.classList.add("open");
          s.querySelector("img").src = spr("flower", s._k * TL.S, L());
          U.replay(s, "open");
          A.sfx("pop");
          chime(i++ * 2);
          if (act) {
            if (i % 2) act.hop();
            else pose({ uR: 1.2 });
            ctx.after(400, () => pose({}));
          }
        });
        if (!alive(r)) return false;
        treeV = "full";
        renderTree();
        ctx.after(1200, () => alive(r) && season === 0 && clearSprites());
        setBugs(true);
        A.sfx("sparkle");
        if (act) act.wave(1.6);
        await ctx.say("꽃이 활짝 피었어요! 나비가 날아왔어요!");
        await ctx.wait(900);
        if (!alive(r)) return false;
        return ctx.win({ msg: "봄 🌸", quiet: true });
      }
      async function summer(r) {
        setSeason(1, "act");
        ctx.say("여름이 왔어요! 구름을 눌러 비를 내려요!");
        for (let k = 0; k < 3; k++) {
          ctx.hint(() => cloud, "구름을 눌러요!");
          await tapOnce(cloud);
          if (!alive(r)) return false;
          ctx.hint(null);
          U.replay(cloud, "ssHop");
          cloud.querySelector("img").src = spr("rainCloud", 200, L());
          rainT = 1.2;
          pose({ uR: 2.3, uL: 2.3, nod: -0.1 }); // 비 온다! 두 손을 머리 위로
          A.sfx("water");
          ctx.after(350, () => A.sfx("water"));
          ctx.after(700, () => A.sfx("water"));
          await ctx.wait(1300);
          if (!alive(r)) return false;
          pose({});
          cloud.querySelector("img").src = spr("cloud", 200, L());
        }
        off(cloud, true);
        arp(["G5", "C6", "E6"]);
        await ctx.wait(700);
        if (!alive(r)) return false;
        addSprites("cicada", [[0.02, -0.25]], 0.13);
        cicadaSing();
        if (act) act.happy();
        await ctx.say("시원한 소나기! 매미가 맴맴 노래해요!");
        await ctx.wait(700);
        if (!alive(r)) return false;
        return ctx.win({ msg: "여름 ☀️", quiet: true });
      }
      async function autumn(r) {
        setSeason(2, "act");
        // 인형이 바구니를 두 손으로 들고 있음
        if (act) act.hug(true);
        hold(basket, "belly", 0, 0.1, 0.42, spr("basket", 120, L()));
        basket.querySelector("b").textContent = "0";
        ctx.say("가을이 왔어요! 빨간 사과를 따서 바구니에 담아요!");
        let got = 0;
        await spotsDone("fruit", (s) => {
          s.classList.remove("fruit");
          const a = rel(s), b = rel(basket);
          s.style.visibility = "hidden";
          flyTo("apple", a.w, { x: a.x + a.w / 2, y: a.y + a.h / 2 }, { x: b.x + b.w / 2, y: b.y + b.h * 0.35 }, 700);
          A.sfx("pick");
          const n = ++got;
          ctx.after(700, () => {
            basket.querySelector("b").textContent = n;
            U.replay(basket, "ssSqz");
            A.sfx("drop");
            if (act) act.hop();
          });
        });
        if (!alive(r)) return false;
        await ctx.wait(800);
        if (!alive(r)) return false;
        leafRate = 2.2;
        A.sfx("whoosh");
        if (act) act.happy();
        await ctx.say("사과를 다 땄어요! 나뭇잎이 알록달록 떨어져요!");
        await ctx.wait(900);
        if (!alive(r)) return false;
        holdNone();
        return ctx.win({ msg: "가을 🍁", quiet: true });
      }
      async function winter(r) {
        setSeason(3, "act");
        ctx.say("겨울이 왔어요! 눈을 콕콕 눌러 눈사람을 만들어요!");
        for (let k = 1; k <= 3; k++) {
          ctx.hint(() => man, "눈을 콕 눌러요!");
          await tapOnce(man);
          if (!alive(r)) return false;
          man.dataset.n = String(k);
          man.querySelector("img").src = spr("sm" + k, 200, L());
          U.replay(man, "ssSqz");
          const mr = rel(man);
          sparkle(mr.x + mr.w / 2, mr.y + mr.h * 0.5, 5);
          A.sfx(k === 3 ? "sparkle" : "boing");
          chime(k * 2);
          nodPat(1); // 인형도 토닥토닥
        }
        ctx.hint(null);
        if (act) {
          act.happy();
          act.wave(1.4);
        }
        await ctx.say("눈사람 완성!");
        await ctx.wait(600);
        if (!alive(r)) return false;
        ctx.score.add();
        return ctx.win({ big: true, msg: "{부름} 사계절 박사!" });
      }
      async function cycle(r) {
        if (!grown && !(await seedPhase(r))) return;
        for (const f of [spring, summer, autumn, winter]) if (!(await f(r)) || !alive(r)) return;
        setSeason(0, "full");
        A.sfx("sparkle");
        await ctx.say("다시 봄이 와요!");
        await ctx.wait(900);
        if (alive(r)) next();
      }

      /* ---------- 작은 정원 그림 (2·3단계 보기) ---------- */
      const thumbs = {};
      async function thumb(k) {
        if (thumbs[k]) return thumbs[k];
        const im = await loadImg(BGF[k]);
        const cw = 320, ch = 380, c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        const g = c.getContext("2d");
        const sp = SPOT[k];
        // 흙 자리 둘레를 잘라 그림 (가로 0.5 · 세로 0.45 정도)
        const sw0 = 0.4 * 1344, sh0 = sw0 * (ch / cw);
        const sx = sp[0] * 1344 - sw0 / 2, sy = U.clamp(sp[1] * 752 + sh0 * 0.2 - sh0, 0, 752 - sh0);
        if (im) g.drawImage(im, sx, sy, sw0, sh0, 0, 0, cw, ch);
        else {
          g.fillStyle = ["#bfe6c8", "#9fd6ff", "#ffd9a8", "#e6eef8"][k];
          g.fillRect(0, 0, cw, ch);
        }
        const bx = ((sp[0] * 1344 - sx) / sw0) * cw, by = ((sp[1] * 752 - sp[3] * 752 * 0.15 - sy) / sh0) * ch;
        const S = ch * 0.64;
        g.setTransform(S, 0, 0, S, bx, by);
        drawTree(g, k, "full", LIGHT[k], cw, ch, true);
        g.setTransform(1, 0, 0, 1, 0, 0);
        thumbs[k] = c.toDataURL("image/jpeg", 0.85);
        return thumbs[k];
      }

      /* ---------- 2단계: 다음은 어떤 계절? ---------- */
      let lastQ = -1,
        round2 = 0;
      async function quizNext(r) {
        let k = U.rand(4);
        if (k === lastQ) k = (k + 1 + U.rand(3)) % 4;
        lastQ = k;
        grown = true;
        treeL.className = "ssTreeL";
        setSeason(k, "full");
        const nx = (k + 1) % 4,
          now = SEA[k].name,
          nxt = SEA[nx].name;
        const th = await Promise.all([0, 1, 2, 3].map(thumb));
        if (!alive(r)) return;
        const q = now + " 다음은 어떤 계절일까요?";
        ctx.say("지금은 " + now + "이에요. 다음은 어떤 계절일까요?");
        if (act) {
          tiltOn = true;
          pose({ tilt: 0.12 });
        }
        const btns = ctx.choices(ask, [0, 1, 2, 3], {
          cls: "ssCh",
          render: (v) => '<img alt="" src="' + th[v] + '"><span>' + SEA[v].name + "</span>",
          right: (v) => v === nx,
          wrongMsg: (v) => {
            if (act) {
              pose({ tilt: -0.2 }); // 갸웃
              ctx.after(900, () => pose({ tilt: 0.12 }));
            }
            return v === k ? "지금이 " + now + "이에요. 그 다음 계절을 찾아봐요!" : q;
          },
          onRight: async () => {
            ctx.hint(null);
            tiltOn = false;
            pose({});
            setSeason(nx, "full");
            if (nx === 1) ctx.after(400, cicadaSing);
            if (act) act.happy();
            arp(["C5", "E5", "G5", "C6"]);
            KP.voice.say("딩동댕! " + now + " 다음은 " + nxt + "!");
            ctx.score.add();
            round2++;
            await ctx.wait(2200);
            if (!alive(r)) return;
            const big = round2 % 4 === 0;
            const ok = await ctx.win({ big, msg: big ? "{부름} 계절 박사!" : nxt + " " + SEA[nx].em, quiet: !big });
            if (ok) next();
          },
        });
        ctx.hint(() => btns.find((b) => b.dataset.right), q);
      }

      /* ---------- 3단계: 계절 물건 나누기 ---------- */
      let lastItems = [],
        round3 = 0;
      async function sortNext(r) {
        sort.innerHTML = "";
        const th = await Promise.all([0, 1, 2, 3].map(thumb));
        if (!alive(r)) return;
        const trees = SEA.map((s, k) => {
          const t = U.el("div", "ssMini k" + k, '<img class="th" alt="" src="' + th[k] + '"><span>' + s.name + '</span><div class="got"></div>');
          t.dataset.k = k;
          sort.appendChild(t);
          return t;
        });
        const tray = U.el("div", "ssTray");
        sort.appendChild(tray);
        // 서로 다른 계절 3개 (지난 판과 같은 물건은 되도록 피함)
        const ks = U.sample([0, 1, 2, 3], 3);
        const pick = ks.map((k) => {
          const pool = ITEMS.filter((it) => it[2] === k && !lastItems.includes(it[0]));
          return U.pick(pool.length ? pool : ITEMS.filter((it) => it[2] === k));
        });
        lastItems = pick.map((p) => p[0]);
        const imgs = await Promise.all(pick.map((it) => clayEmoji(it[0], 110).catch(() => null)));
        if (!alive(r)) return;
        const src = (it) => imgs[pick.indexOf(it)] || KP.esrc(it[0]);
        ctx._fewChoice = false; // 나무 4그루 중에서 고름
        let left = pick.length;
        const els = U.shuffle(pick.slice()).map((it, i) => {
          const el = U.el("div", "ssItem item", '<img alt="" draggable="false" src="' + src(it) + '">');
          el.style.setProperty("--i", i);
          el.dataset.k = it[2]; // 점검용
          tray.appendChild(el);
          const d = KP.drag(el, {
            targets: () => trees,
            accept: (t) => +t.dataset.k === it[2],
            onReject: (t) => ctx.miss(t, "음, 다른 계절일까요?"),
            onDrop: (t) => {
              if (!t || !alive(r)) return;
              d.lock();
              el.remove();
              t.querySelector(".got").insertAdjacentHTML("beforeend", '<img alt="" src="' + src(it) + '">');
              U.replay(t, "jump");
              A.sfx("snap");
              chime(it[2] * 2);
              KP.voice.say(it[3]);
              left--;
              if (!left) done();
              else hint();
            },
          });
          return el;
        });
        const hint = () => {
          const el = els.find((x) => x.isConnected);
          if (el) ctx.hint(() => (el.isConnected ? el : null), "물건을 끌어서 알맞은 계절 나무에 넣어요!");
        };
        ctx.say("물건을 끌어서 알맞은 계절 나무에 넣어요!");
        hint();
        const done = async () => {
          ctx.hint(null);
          ctx.score.add();
          round3++;
          await ctx.wait(1600);
          if (!alive(r)) return;
          const big = round3 % 3 === 0;
          const ok = await ctx.win({ big, msg: big ? "{부름} 계절 박사!" : "다 넣었다!" });
          if (ok) next();
        };
      }

      /* ---------- 판 고르기 ---------- */
      async function next() {
        const r = ++rid;
        const lv = ctx.level;
        ctx.hint(null);
        tiltOn = false;
        pose({});
        scene.style.display = lv === 3 ? "none" : "";
        ask.style.display = lv === 2 ? "" : "none";
        sort.style.display = lv === 3 ? "" : "none";
        ask.innerHTML = "";
        if (lv === 3) {
          if (st) dropStage(); // 3단계는 무대(3D) 없이 — 그래픽 메모리 돌려줌
          return sortNext(r);
        }
        if (!st) {
          if (!(await ready(r))) return;
        }
        if (lv === 1) cycle(r);
        else quizNext(r);
      }
      /** 무대 + 인형 준비 (처음·다시 만들 때) */
      async function ready(r) {
        scene.querySelectorAll(".ssLoad").forEach((e) => e.remove());
        const wait = U.el("div", "ssLoad", KP.E("🌳") + " 준비 중");
        const wt = ctx.after(400, () => scene.appendChild(wait));
        const s = await makeStage();
        if (!s || !alive(r)) {
          ctx.cancel(wt);
          wait.remove();
          return false;
        }
        const a = await makeActor(s);
        ctx.cancel(wt);
        wait.remove();
        if (!alive(r) || st !== s) {
          if (a) a.dispose();
          return false;
        }
        act = ctx.actor = a;
        fw = a ? KP.dollFollow(s.ui, a, { cls: "dfT" }) : null;
        if (a) {
          // 왼쪽 밖에서 폴짝 들어옴
          layout();
          ctx._dollEntering = true;
          const tgt = dollAt || s.spot("tree");
          a.place(tgt[0] - s.pxToWorld(tgt[0], tgt[1], s.w * 0.5), tgt[1]);
          a.jumpTo(tgt[0], tgt[1], 0.8, 0.5).then(() => {
            ctx._dollEntering = false;
            layout();
          });
        }
        ctx.loop((dt) => {
          if (st !== s || s.dead) return false;
          s.tick(dt);
          poseStep(dt, s.time);
          if (fw) fw.update();
          step(dt);
          bugStep(dt);
        });
        // 점검용
        ctx.ssState = () => ({ season, grown, gl: !!(st && st.gl), painted: !!(act && act.painted), who: act && act.name, tree: treeL.className, bg: bgK, sprites: sprites.length, level: ctx.level });
        return true;
      }
      ctx.begin = (again) => {
        rid++;
        parts.length = 0;
        rainT = waterT = 0;
        if (!again) round2 = round3 = 0;
        dropStage();
        if (!again) {
          grown = false;
          bgK = -1;
          season = 0;
        }
        next();
      };
      ctx.drop = () => {
        rid++;
        dropStage();
        holdNone();
      };
      ctx.ssParts = {
        soil, sun, cloud, man, can, tapZone,
        sprites: () => sprites,
      };
      // 점검용
      ctx.ssDbg = { setSeason, tree: () => [cvA.className, cvB.className, front === cvA ? "A" : "B", treeKey, getComputedStyle(cvA).opacity, getComputedStyle(cvB).opacity] };
    },
    start(ctx) {
      ctx.begin();
    },
    stop(ctx) {
      ctx.drop();
    },
  });
})();
