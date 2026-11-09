/* 자동 생성 — tools/build.js 묶음. 고치려면 원본(21개)을 고치고 다시 빌드 */

/* ==== js/games/play/_care.js ==== */
/* 생활 습관 놀이 공통 도우미 (KP.care) — 치카치카 양치(brush)·손 씻기(handwash)·동물 목욕(bath)·화장실(potty)
   - surface(ctx, host, o) : 문지르기 판. 얼룩(점) 목록을 손가락으로 문질러 지우고, 거품을 남기거나 지움.
       점 좌표는 '틀(frame)' 기준 0~1 이라 화면 크기가 바뀌어도 제자리에 다시 그려짐 (wipe.js 의 픽셀 지우기와 다름).
       점마다 문지른 거리(life)를 깎아서, 한 번 톡 누르기가 아니라 '문지르기'를 해야 지워짐.
       구역(zone)마다 85% 지우면 그 구역 완료 → 남은 얼룩은 스르륵.
       표면 마스크(선택, 목욕·손 씻기): S.setSkin(모양 캔버스) → 모양(알파) 안에서만 진흙·거품·물기가 생기고, 문지른 자리만 지워짐.
         층 3장(dirt·foam·wet)은 작은 캔버스(긴 변 300px 안팎)로 틀(frame)에 맞춰 늘려 그림 — 아이 원본 그림은 건드리지 않음.
         S.mode: foam(거품 남기고 진흙 지움) · unfoam(거품 씻김 + 물기 + 흘러내리는 거품) · dry(물기 닦음) · wet(물기만)
         skinFade(층)·skinFill(층)·skinAt(층,x,y)(점검용) · opt.el 을 주면 그 캔버스에 그림(예: 욕조 앞벽보다 뒤)
       care.shapeOf(그림, 폭, 높이) → 모양 캔버스 · care.ptsIn(모양, n, 깎기) → 모양 안 격자점(틀 0~1)
       o.pass: 문지르기가 꺼져 있을 때 판 캔버스가 터치를 막지 않음 (장면 속 물건을 직접 누르는 놀이)
   - routine(ctx, o) : 도구 줄(큰 버튼)로 순서대로 하기. mode 1 안내(정답 반짝) / 2 다음 할 일 고르기 / 3 혼자서.
       도구에 el 을 주면 버튼을 만들지 않고 그 요소(장면 속 수도꼭지·비누 펌프 …)를 누르게 함
   - pop(host, x, y, 글자) : 둥실 떠오르는 짧은 글자 ("치카", "끙!", "퉤!")
   이 파일은 놀이를 등록하지 않음. 각 놀이의 setup 안에서만 쓰므로 파일 순서와 상관없음. */
"use strict";
(function (KP) {
  const U = KP.u;
  const care = (KP.care = {});

  care.css = function () {
    KP.css("care", `
      .kc-scene{flex:1;min-height:0;position:relative;margin:0 12px 10px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;user-select:none;-webkit-user-select:none}
      .kc-cv{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;z-index:5}
      .kc-tool{position:absolute;left:0;top:0;width:var(--ts,90px);height:var(--ts,90px);margin:calc(var(--ts,90px)*-.5) 0 0 calc(var(--ts,90px)*-.5);pointer-events:none;z-index:7;display:none;
        filter:drop-shadow(0 6px 6px rgba(0,0,0,.25))}
      .kc-tool.on{display:block}
      .kc-tool .e,.kc-tool img{width:100%;height:100%;display:block;object-fit:contain}
      .kc-tool .kc-towel{width:100%;height:80%;margin-top:10%}
      .kc-bar{flex:0 0 auto;display:flex;justify-content:center;align-items:center;gap:clamp(6px,1.6vw,16px);padding:0 10px 10px;min-height:calc(clamp(64px,11vmin,100px) + 10px)}
      .kc-tb{position:relative;width:clamp(64px,11vmin,100px);height:clamp(64px,11vmin,100px);border-radius:22px;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.13);
        display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;flex:0 0 auto}
      @media (orientation: landscape) and (max-height: 500px){
        .kc-stage{flex-direction:row}
        .kc-stage .kc-bar{display:grid;grid-template-columns:repeat(2,auto);align-content:center;padding:0 10px 10px 0;min-height:0;min-width:calc(clamp(64px,11vmin,100px) * 2 + 16px)}
      }
      .kc-tb .e{width:62%;height:62%}
      .kc-tb .kc-towel{width:62%;height:48%}
      .kc-tb span{font-size:clamp(12px,1.7vmin,16px);color:var(--ink2);line-height:1.1;margin-top:2px;white-space:nowrap}
      .kc-tb:active{transform:translateY(3px)}
      /* 반짝이는 빛 고리는 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .kc-tb::after,.kc-ask .choice.kc-glowc::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:0 0 0 7px rgba(255,200,40,.75)}
      .kc-tb.glow{animation:none}
      .kc-tb.glow::after{animation:kc-glow 1.1s ease-in-out infinite alternate}
      @keyframes kc-glow{to{opacity:1}}
      .kc-bar.off .kc-tb{opacity:.55}
      .kc-towel{display:block;border-radius:12%;background:repeating-linear-gradient(90deg,#ff8fb1 0 18%,#ffd1df 18% 30%);box-shadow:inset 0 -18% 0 rgba(0,0,0,.08),inset 0 0 0 3px rgba(255,255,255,.6)}
      .kc-pop{position:absolute;z-index:8;pointer-events:none;white-space:nowrap;font-size:clamp(24px,4.4vmin,44px);color:#fff;-webkit-text-stroke:0;
        text-shadow:0 3px 0 rgba(0,0,0,.25),0 0 8px rgba(0,0,0,.15);transform:translate(-50%,-50%);animation:kc-pop 1.1s ease-out forwards}
      .kc-pop.big{font-size:clamp(40px,8vmin,80px)}
      @keyframes kc-pop{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}20%{opacity:1;transform:translate(-50%,-60%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-160%) scale(1)}}
      .kc-zone{position:absolute;z-index:6;pointer-events:none;border-radius:16px;border:4px dashed rgba(255,255,255,.95);box-shadow:0 0 0 5px rgba(255,205,60,.55);opacity:0;transition:opacity .3s}
      /* 구역 빛 고리: 얇은 고리(::before)와 굵은 고리(::after)를 따로 그려 두고 서로 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임).
         inset:-4px = 점선 테두리 두께만큼 밖 → 예전 box-shadow 와 같은 자리 */
      .kc-zone::before,.kc-zone::after{content:"";position:absolute;inset:-4px;border-radius:inherit;pointer-events:none;opacity:0}
      .kc-zone::before{box-shadow:0 0 0 3px rgba(255,205,60,.35)}
      .kc-zone::after{box-shadow:0 0 0 9px rgba(255,205,60,.75)}
      .kc-zone.on{opacity:1;box-shadow:none;animation:none}
      .kc-zone.on::before{animation:kc-zoneA 1.3s ease-in-out infinite alternate}
      .kc-zone.on::after{animation:kc-zone 1.3s ease-in-out infinite alternate}
      @keyframes kc-zoneA{from{opacity:1}to{opacity:0}}
      @keyframes kc-zone{from{opacity:0}to{opacity:1}}
      .kc-ask{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.35)}
      .kc-ask .qAns{gap:clamp(10px,2vw,22px)}
      .kc-ask .choice{width:clamp(92px,17vmin,150px);height:clamp(92px,17vmin,150px)}
      .kc-ask .choice .e{width:70%;height:70%}
      .kc-ask .choice.kc-glowc{animation:none;position:relative;box-shadow:0 5px 0 rgba(0,0,0,.13)}
      .kc-ask .choice.kc-glowc::after{animation:kc-glow 1.1s ease-in-out infinite alternate}
    `);
  };

  /** 둥실 떠오르는 짧은 글자 */
  care.pop = function (ctx, host, x, y, txt, big) {
    const e = U.el("div", "kc-pop" + (big ? " big" : ""), KP.E(txt));
    e.style.left = x + "px";
    e.style.top = y + "px";
    host.appendChild(e);
    ctx.after(1200, () => e.remove());
    return e;
  };

  /** 그림(이모지)의 실제 모양 안쪽 격자점 → 틀 기준 0~1 좌표 [{x,y}] (그림이 아직 안 불렸으면 둥근 모양으로) */
  care.maskPts = function (em, n = 16, inset = 0) {
    const N = 48,
      out = [];
    let mask = null;
    try {
      const c = document.createElement("canvas");
      c.width = c.height = N;
      const g = c.getContext("2d");
      KP.drawE(g, em, N / 2, N / 2, N);
      mask = g.getImageData(0, 0, N, N).data;
      let any = false;
      for (let i = 3; i < mask.length; i += 4)
        if (mask[i] > 60) {
          any = true;
          break;
        }
      if (!any) mask = null;
    } catch (e) {
      mask = null;
    }
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n,
          v = (j + 0.5) / n;
        let inside;
        if (mask) {
          const px = Math.min(N - 1, Math.floor(u * N)),
            py = Math.min(N - 1, Math.floor(v * N));
          inside = mask[(py * N + px) * 4 + 3] > 120;
        } else inside = (u - 0.5) ** 2 + (v - 0.5) ** 2 < 0.2;
        if (inside && u > inset && u < 1 - inset && v > inset && v < 1 - inset) out.push({ x: u, y: v });
      }
    return out;
  };

  const mkCv = (w, h) => {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h || w));
    return c;
  };
  /** 모양 캔버스: 그림(img·canvas)을 w×h 에 꽉 채워 그린 알파 (반투명 가장자리는 또렷하게) */
  care.shapeOf = function (img, w, h) {
    const c = mkCv(w, h), g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0, c.width, c.height);
    care.hardAlpha(c);
    return c;
  };
  /** 알파를 또렷하게 (그림자·반투명 가장자리 빼기) — 흰색 + 알파(0/255, 경계 1칸만 중간) */
  care.hardAlpha = function (c, cut = 150) {
    const g = c.getContext("2d", { willReadFrequently: true });
    const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = a >= cut ? 255 : a > cut - 40 ? (a - cut + 40) * 6 : 0;
    }
    g.putImageData(id, 0, 0);
    return c;
  };
  /** 모양 안 격자점 (틀 0~1) — erode: 가장자리에서 이만큼(틀 너비 비율) 안쪽만 */
  care.ptsIn = function (shape, n = 10, erode = 0) {
    const w = shape.width, h = shape.height;
    const d = shape.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const on = (u, v) => {
      const x = Math.floor(u * w), y = Math.floor(v * h);
      return x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 128;
    };
    const e = erode, ev = (erode * w) / h, out = [];
    const ny = Math.max(2, Math.round((n * h) / w));
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, v = (j + 0.5) / ny;
        if (on(u, v) && (!e || (on(u - e, v) && on(u + e, v) && on(u, v - ev) && on(u, v + ev)))) out.push({ x: u, y: v });
      }
    return out;
  };
  // 붓 모양 (한 번만): 부드러운 동그라미 · 거품 한 덩이
  let BRUSH = null,
    WETB = null,
    FOAMS = null;
  const WETC = "95,160,225"; // 물기 색 (반투명으로 겹침)
  const wetBrush = () => {
    if (WETB) return WETB;
    const c = mkCv(64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    // 물방울 하나: 가운데 맑고 가장자리 푸른 테
    gr.addColorStop(0, "rgba(255,255,255,.3)");
    gr.addColorStop(0.66, "rgba(190,225,250,.4)");
    gr.addColorStop(0.86, "rgba(" + WETC + ",.7)");
    gr.addColorStop(1, "rgba(" + WETC + ",0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return (WETB = c);
  };
  const brush = () => {
    if (BRUSH) return BRUSH;
    const c = mkCv(64), g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(0.55, "rgba(0,0,0,.9)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return (BRUSH = c);
  };
  /** 거품 덩이 그림 3가지 (작은 비눗방울 여러 개, 점토처럼 몽글) */
  const foams = () => {
    if (FOAMS) return FOAMS;
    FOAMS = [];
    for (let k = 0; k < 3; k++) {
      const S = 72, c = mkCv(S), g = c.getContext("2d");
      let a = 7 + k * 13;
      const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
      const bs = [];
      for (let i = 0; i < 9; i++) {
        const ang = rnd() * 6.28, dd = rnd() * S * 0.26;
        bs.push([S / 2 + Math.cos(ang) * dd, S / 2 + Math.sin(ang) * dd, S * (0.09 + rnd() * 0.11)]);
      }
      bs.sort((p, q) => p[1] - q[1]);
      for (const [x, y, r] of bs) {
        const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
        gr.addColorStop(0, "#ffffff");
        gr.addColorStop(0.7, "#f4f8ff");
        gr.addColorStop(1, "#d6e6f7");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, r, 0, 6.283);
        g.fill();
        g.strokeStyle = "rgba(150,190,230,.55)";
        g.lineWidth = Math.max(1, r * 0.1);
        g.stroke();
        g.fillStyle = "rgba(255,255,255,.95)";
        g.beginPath();
        g.arc(x - r * 0.38, y - r * 0.38, r * 0.2, 0, 6.283);
        g.fill();
      }
      FOAMS.push(c);
    }
    return FOAMS;
  };

  /* ---------------- 문지르기 판 ---------------- */
  care.surface = function (ctx, host, o = {}) {
    const cv = U.el("canvas", "kc-cv"),
      g = cv.getContext("2d");
    const toolEl = U.el("div", "kc-tool");
    host.append(cv, toolEl);
    const S = {
      cv,
      toolEl,
      frame: o.frame || (() => { const hs = KP.u.sizeOf(host); return { x: 0, y: 0, w: hs.cw, h: hs.ch }; }),
      spots: [],
      foam: [],
      parts: [],
      zones: {},
      radius: 0.07, // 문지르개 반지름 (틀 너비 비율)
      need: 0.85, // 구역 완료 비율
      on: false,
      mode: {},
      sound: o.sound || (() => KP.audio.sfx("rub")),
      onZone: null,
      onAll: null,
      onRub: null,
      lastRub: 0,
      rubbed: 0, // 이번 판 문지른 거리(px)
      maxParts: 240, // 반짝이·물방울 최대 개수
      skin: null, // 표면 마스크 (setSkin)
    };
    let W = 0,
      H = 0,
      dpr = 1,
      sess = -1,
      t = 0;
    function fit() {
      const hs = KP.u.sizeOf(host), // 매 장면 재지 않고 크기가 바뀔 때만 (매번 재면 배치를 억지로 다시 계산)
        w = hs.cw,
        h = hs.ch,
        d = Math.min(2, window.devicePixelRatio || 1);
      if (w === W && h === H && d === dpr) return;
      W = w;
      H = h;
      dpr = d;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
    }
    S.setTool = (html, size) => {
      toolEl.innerHTML = html;
      if (size) toolEl.style.setProperty("--ts", Math.round(size) + "px");
    };
    /** 판 비우기 (keepFoam: 거품은 남김 — 손 씻기·목욕에서 다음 동작으로 넘어갈 때) */
    S.reset = (keepFoam) => {
      S.spots = [];
      if (!keepFoam) S.foam = [];
      S.onZone = S.onAll = S.onRub = null;
      S.zones = {};
      S.on = false;
      S.rubbed = 0;
      toolEl.classList.remove("on");
    };
    /** 점 추가: {x,y(틀 0~1), r(틀 너비 비율), need(문지를 거리 = R 의 몇 배), zone, draw(g,px,py,pr,life,t)} */
    S.add = (list) => {
      for (const s of list) {
        s.life = 1;
        s.fade = false;
        s.zone = s.zone || "all";
        s.need = s.need || 2;
        s.r = s.r || 0;
        s.seed = s.seed || Math.random();
        S.spots.push(s);
        const z = (S.zones[s.zone] = S.zones[s.zone] || { total: 0, clean: 0, done: false });
        z.total++;
      }
    };
    S.prog = (zone) => {
      const z = S.zones[zone];
      return z ? (z.total ? z.clean / z.total : 1) : 1;
    };
    S.leftZones = () => Object.keys(S.zones).filter((k) => !S.zones[k].done);
    /** 남은 구역 중 가장 덜 닦인 곳 */
    S.leastZone = () => {
      let best = null,
        bp = 2;
      for (const k of S.leftZones()) {
        const p = S.prog(k);
        if (p < bp) {
          bp = p;
          best = k;
        }
      }
      return best;
    };
    /** 한 구역을 끝냄 (남은 얼룩은 스르륵) */
    S.finishZone = (k) => {
      const z = S.zones[k];
      if (!z || z.done) return;
      z.done = true;
      for (const s of S.spots) if (s.zone === k && s.life > 0) s.fade = true;
      S.onZone && S.onZone(k);
      if (!S.leftZones().length && S.onAll) {
        const f = S.onAll;
        S.onAll = null;
        f();
      }
    };
    S.clearFoam = () => S.foam.forEach((b) => (b.fade = true));
    S.clearSpots = () => S.spots.forEach((s) => s.life > 0 && (s.fade = true));
    /** 거품 하나 (틀 0~1 좌표) */
    S.bubble = (x, y, r) => {
      S.foam.push({ x, y, r, life: 1, fade: false, wob: Math.random() * 6 });
      if (S.foam.length > 420) S.foam.shift();
    };
    /** 반짝이·물방울 (화면 px 좌표) */
    S.burst = (x, y, n, kind = "star", spread = 1) => {
      const cols = kind === "drop" ? ["#7cc8ff", "#a8dcff", "#5fb4f5", "#ffffff"] : ["#ffd54a", "#ff9ed2", "#8fe0ff", "#ffffff", "#b6ff9c"];
      n = Math.min(n, S.maxParts - S.parts.length); // 저가 기기: 한꺼번에 너무 많이 그리지 않게
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28,
          sp = (60 + Math.random() * 220) * spread;
        S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80 * spread, life: 1, s: 3 + Math.random() * 6, c: U.pick(cols), kind });
      }
    };
    const toPx = (F, s) => [F.x + s.x * F.w, F.y + s.y * F.h];

    /* ---------- 표면 마스크 (문지른 자리만) ---------- */
    const GN = 16; // 거품이 있는 곳 대략 기록 (흘러내리는 거품용)
    /** 모양(shape 캔버스 = 틀 전체)으로 새 표면. opt.el: 그릴 캔버스(없으면 판 캔버스) */
    S.setSkin = (shape, opt = {}) => {
      const w = shape.width, h = shape.height;
      // 층은 그래픽 가속 캔버스로 (매 장면 화면에 늘려 그림 — 저가 기기에서 읽기 전용 캔버스면 매번 다시 올려야 해서 느림)
      const L = {};
      for (const k of ["dirt", "foam", "wet"]) {
        const c = mkCv(w, h);
        L[k] = { c, g: c.getContext("2d"), a: 1, fade: false };
      }
      const sk = { shape, w, h, L, el: opt.el || null, eg: opt.el ? opt.el.getContext("2d") : null, grid: new Uint8Array(GN * GN), drips: [], acc: 0 };
      S.skin = sk;
      return sk;
    };
    S.dropSkin = () => {
      const sk = S.skin;
      S.skin = null;
      if (sk && sk.eg) sk.eg.clearRect(0, 0, sk.el.width, sk.el.height);
    };
    /** 층 하나를 스르륵 지움 */
    S.skinFade = (k) => {
      if (S.skin) S.skin.L[k].fade = true;
    };
    /** 모양 안에 붓으로 찍기 (진흙·거품·물기) — 찍은 뒤 모양 밖은 잘라 냄 (그 근처만) */
    const clipStamp = (k, x, y, r, draw) => {
      const sk = S.skin, l = sk.L[k], g = l.g;
      l.fade = false;
      l.a = 1;
      g.save();
      g.beginPath();
      g.rect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);
      g.clip();
      draw(g);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "destination-in";
      g.drawImage(sk.shape, 0, 0);
      g.restore();
    };
    const erase = (k, x, y, r, a) => {
      const g = S.skin.L[k].g;
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.globalAlpha = a;
      g.drawImage(brush(), x - r, y - r, r * 2, r * 2);
      g.restore();
    };
    const foamAt = (x, y, r) =>
      clipStamp("foam", x, y, r, (g) => {
        const fs = foams(), f = fs[(Math.random() * fs.length) | 0];
        g.translate(x, y);
        g.rotate(Math.random() * 6.28);
        g.drawImage(f, -r, -r, r * 2, r * 2);
      });
    /** 물기 = 맺힌 물방울 몇 개 (색을 덮지 않아 아이 그림 색이 그대로 보임) */
    const wetAt = (x, y, r, n = 1) =>
      clipStamp("wet", x, y, r, (g) => {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.28, d = Math.random() * r * 0.75, s = r * (0.09 + Math.random() * 0.12);
          const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
          g.globalAlpha = 0.85;
          g.drawImage(wetBrush(), px - s, py - s * 1.15, s * 2, s * 2.3);
          g.globalAlpha = 1;
          g.fillStyle = "rgba(255,255,255,.95)";
          g.beginPath();
          g.arc(px - s * 0.3, py - s * 0.45, s * 0.28, 0, 6.283);
          g.fill();
        }
      });
    const cell = (x, y) => {
      const sk = S.skin, i = Math.min(GN - 1, Math.max(0, Math.floor((x / sk.w) * GN))), j = Math.min(GN - 1, Math.max(0, Math.floor((y / sk.h) * GN)));
      return j * GN + i;
    };
    /** 문지른 길(화면 px)을 따라 표면에 찍기 */
    function skinRub(x1, y1, x2, y2, R, F) {
      const sk = S.skin, m = S.mode, kx = sk.w / F.w;
      const ax = (x1 - F.x) * kx, ay = (y1 - F.y) * kx, bx = (x2 - F.x) * kx, by = (y2 - F.y) * kx;
      const r = R * kx, step = Math.max(1, r * 0.3), len = Math.hypot(bx - ax, by - ay);
      sk.acc += len;
      if (len === 0) sk.acc = step; // 처음 닿은 곳도 한 번
      while (sk.acc >= step) {
        sk.acc -= step;
        const t = len ? 1 - sk.acc / len : 1;
        const x = ax + (bx - ax) * Math.max(0, Math.min(1, t)), y = ay + (by - ay) * Math.max(0, Math.min(1, t));
        if (m.foam) {
          erase("dirt", x, y, r * 1.05, 0.2);
          const a = Math.random() * 6.28, d = Math.random() * r * 0.5;
          foamAt(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.55 + Math.random() * 0.3));
          sk.grid[cell(x, y)] = 1;
        }
        if (m.unfoam) {
          erase("foam", x, y, r * 1.1, 0.45);
          if (Math.random() < 0.4) wetAt(x, y, r);
          const c = cell(x, y);
          if (sk.grid[c] && sk.drips.length < 36) {
            sk.grid[c] = 0;
            for (let i = 0; i < 2; i++)
              sk.drips.push({ x: (x + U.randf(-r, r) * 0.6) / sk.w, y: (y + U.randf(-r, r) * 0.4) / sk.h, vy: U.randf(0.05, 0.12), r: U.randf(0.012, 0.024), life: 1 });
          }
        }
        if (m.wet && !m.unfoam && Math.random() < 0.4) wetAt(x, y, r);
        if (m.dry) erase("wet", x, y, r * 1.15, 0.35);
      }
    }
    /** 층을 모양 전체에 채움 (예: 물 틀면 손 전체가 촉촉) — k="wet" 은 반투명 물빛, "foam" 은 거품 덩이를 고르게 */
    S.skinFill = (k, dense = 1) => {
      const sk = S.skin;
      if (!sk) return;
      if (k === "foam") {
        const r = sk.w * 0.08;
        for (const p of care.ptsIn(sk.shape, Math.round(9 * dense), 0)) {
          foamAt(p.x * sk.w + U.randf(-r, r) * 0.3, p.y * sk.h + U.randf(-r, r) * 0.3, r * U.randf(0.9, 1.3));
          sk.grid[cell(p.x * sk.w, p.y * sk.h)] = 1;
        }
      } else {
        // 물기: 모양 곳곳에 맺힌 물방울
        const r = sk.w * 0.07;
        for (const p of care.ptsIn(sk.shape, 12, 0)) if (Math.random() < 0.5 * dense) wetAt(p.x * sk.w, p.y * sk.h, r, 1);
      }
    };
    /** 한 군데 찍기 (틀 0~1 좌표·r 은 틀 너비 비율) — k: "foam" | "wet" */
    S.skinDab = (k, u, v, r) => {
      const sk = S.skin;
      if (!sk) return;
      const x = u * sk.w, y = v * sk.h, rr = r * sk.w;
      if (k === "foam") {
        foamAt(x, y, rr);
        sk.grid[cell(x, y)] = 1;
      } else wetAt(x, y, rr);
    };
    /** 진흙 덩이 그리기 (틀 0~1 좌표·r 은 틀 너비 비율, paint 를 주면 그걸로 그림) */
    S.skinMud = (list) => {
      const sk = S.skin;
      if (!sk) return;
      for (const s of list) {
        const x = s.x * sk.w, y = s.y * sk.h, r = s.r * sk.w * 0.5;
        // s.paint(g, x, y, r, 표면): 진흙 대신 직접 그리기 (양치: 이 모양의 누런 막·치석) — 없으면 진흙 철퍽
        clipStamp("dirt", x, y, r * 2.2, (gg) => (s.paint ? s.paint(gg, x, y, r, sk) : care.drawSplat(gg, x, y, r, s.seed, s.col)));
      }
    };
    /** 점검용: 층의 그 자리(틀 0~1) 진하기 0~255 */
    S.skinAt = (k, u, v) => {
      const sk = S.skin;
      if (!sk) return 0;
      const x = Math.min(sk.w - 1, Math.max(0, Math.floor(u * sk.w))), y = Math.min(sk.h - 1, Math.max(0, Math.floor(v * sk.h)));
      return Math.round(sk.L[k].g.getImageData(x, y, 1, 1).data[3] * sk.L[k].a);
    };
    /** 표면 그리기 (매 장면) */
    function drawSkin(g0, dt, F) {
      const sk = S.skin;
      let g = g0;
      if (sk.el) {
        const el = sk.el, es = KP.u.sizeOf(el), w = es.cw, h = es.ch;
        if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
          el.width = Math.max(1, Math.round(w * dpr));
          el.height = Math.max(1, Math.round(h * dpr));
        }
        g = sk.eg;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, w, h);
      }
      for (const k of ["dirt", "wet", "foam"]) {
        const l = sk.L[k];
        if (l.fade) {
          l.a -= dt * 1.8;
          if (l.a <= 0) {
            l.a = 1;
            l.fade = false;
            l.g.clearRect(0, 0, sk.w, sk.h);
            if (k === "foam") sk.grid.fill(0);
          }
        }
        g.globalAlpha = l.a;
        g.drawImage(l.c, F.x, F.y, F.w, F.h);
      }
      // 흘러내리는 거품
      g.globalAlpha = 1;
      for (let i = sk.drips.length - 1; i >= 0; i--) {
        const d = sk.drips[i];
        d.life -= dt * 0.9;
        d.y += d.vy * dt;
        d.vy += 0.25 * dt;
        if (d.life <= 0) {
          sk.drips.splice(i, 1);
          continue;
        }
        const x = F.x + d.x * F.w, y = F.y + d.y * F.h, r = d.r * F.w;
        g.globalAlpha = Math.min(1, d.life * 1.6);
        g.fillStyle = "rgba(255,255,255,.92)";
        g.beginPath();
        g.ellipse(x, y, r, r * 1.25, 0, 0, 6.283);
        g.fill();
        g.strokeStyle = "rgba(150,200,240,.7)";
        g.lineWidth = Math.max(1, r * 0.15);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    function rubSeg(x1, y1, x2, y2) {
      const F = S.frame();
      const R = S.radius * F.w;
      const dx = x2 - x1,
        dy = y2 - y1,
        len = Math.hypot(dx, dy),
        L2 = dx * dx + dy * dy || 1;
      S.rubbed += len;
      S.lastRub = Date.now();
      const hit = (px, py, rr) => {
        let tt = ((px - x1) * dx + (py - y1) * dy) / L2;
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const ex = x1 + dx * tt - px,
          ey = y1 + dy * tt - py;
        return ex * ex + ey * ey <= (R + rr) * (R + rr);
      };
      if (len > 0)
        for (const s of S.spots) {
          if (s.life <= 0 || s.fade) continue;
          const [px, py] = toPx(F, s);
          if (!hit(px, py, s.r * F.w * 0.5)) continue;
          s.life -= len / (s.need * R);
          if (s.life <= 0.02) {
            s.life = 0;
            const z = S.zones[s.zone];
            z.clean++;
            if (!z.done && z.clean / z.total >= S.need) S.finishZone(s.zone);
          }
        }
      if (S.mode.unfoam)
        for (const b of S.foam) {
          if (b.fade) continue;
          const [px, py] = toPx(F, b);
          if (hit(px, py, 0)) b.fade = true;
        }
      if (S.skin) skinRub(x1, y1, x2, y2, R, F);
      // 거품 남기기 (지나간 거리만큼) — 표면 마스크가 있으면 거품은 표면에 (skinRub)
      else if (S.mode.foam) {
        S._fa = (S._fa || 0) + len;
        while (S._fa > R * 0.28) {
          S._fa -= R * 0.28;
          const a = Math.random() * 6.28,
            d = Math.random() * R * 0.9;
          S.bubble((x2 + Math.cos(a) * d - F.x) / F.w, (y2 + Math.sin(a) * d - F.y) / F.h, (0.18 + Math.random() * 0.3) * S.radius);
        }
      }
      S._pa = (S._pa || 0) + len;
      if (S._pa > 26) {
        S._pa = 0;
        if (S.mode.drops) S.burst(x2, y2 + R * 0.3, 2, "drop", 0.5);
        else if (S.mode.sparkle) S.burst(x2, y2, 1, "star", 0.4);
      }
      S._sa = (S._sa || 0) + len;
      if (S._sa > 24) {
        S._sa = 0;
        S.sound();
      }
      S.onRub && S.onRub(x2, y2, len);
    }

    let pid = null,
      last = null;
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const moveTool = (p) => {
      toolEl.style.transform = "translate(" + p[0] + "px," + p[1] + "px) rotate(" + Math.sin(t * 18) * 8 + "deg)";
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      KP.audio.unlock();
      if (!S.on || pid !== null) return;
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      last = pos(e);
      rubSeg(last[0], last[1], last[0], last[1]);
      moveTool(last);
      toolEl.classList.add("on");
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      e.preventDefault();
      if (!S.on) return;
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of list.length ? list : [e]) {
        const p = pos(ev);
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) continue;
        rubSeg(last[0], last[1], p[0], p[1]);
        last = p;
        if (!S.on) break;
      }
      moveTool(last);
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      toolEl.classList.remove("on");
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("lostpointercapture", up);

    /** 그리기 반복 시작 (판마다 불러도 됨 — 이번 화면 들어온 뒤 한 번만 돔) */
    S.run = () => {
      if (sess === ctx._session) return;
      sess = ctx._session;
      let half = false,
        acc = 0,
        lastF = "";
      ctx.loop((dt) => {
        // 손을 안 대고, 튀는 것·사라지는 것·틀 움직임이 없으면 한 장 걸러 그림 (세균 꼼지락·거품 출렁은 느려서 30장/초로도 부드러움)
        const F0 = S.frame(),
          fk = F0 ? Math.round(F0.x) + "," + Math.round(F0.y) + "," + Math.round(F0.w) : "";
        const sk0 = S.skin;
        const live =
          pid !== null || S.parts.length || fk !== lastF || S.spots.some((q) => q.fade) || S.foam.some((b) => b.fade) ||
          (sk0 && (sk0.drips.length || sk0.L.dirt.fade || sk0.L.wet.fade || sk0.L.foam.fade));
        lastF = fk;
        acc += dt;
        if (!live && (half = !half)) return;
        dt = acc;
        acc = 0;
        t += dt;
        fit();
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, W, H);
        const F = S.frame();
        if (o.pass) cv.style.pointerEvents = S.on || pid !== null ? "" : "none";
        if (S.skin) drawSkin(g, dt, F);
        // 얼룩
        for (const s of S.spots) {
          if (s.fade) {
            s.life -= dt * 2.2;
            if (s.life <= 0) {
              s.life = 0;
              s.fade = false;
            }
          }
          if (s.life <= 0 || !s.draw) continue;
          const [px, py] = toPx(F, s);
          g.save();
          s.draw(g, px, py, s.r * F.w, s.life, t, s);
          g.restore();
        }
        // 거품
        if (S.foam.length) {
          for (let i = S.foam.length - 1; i >= 0; i--) {
            const b = S.foam[i];
            if (b.fade) {
              b.life -= dt * 2.5;
              if (b.life <= 0) {
                S.foam.splice(i, 1);
                continue;
              }
            }
            const [px, py] = toPx(F, b);
            const r = b.r * F.w * (0.9 + 0.1 * Math.sin(t * 3 + b.wob));
            g.globalAlpha = Math.max(0, b.life);
            g.fillStyle = "rgba(255,255,255,.88)";
            g.beginPath();
            g.arc(px, py, r, 0, 6.283);
            g.fill();
            g.strokeStyle = "rgba(150,200,255,.7)";
            g.lineWidth = Math.max(1, r * 0.12);
            g.stroke();
            g.fillStyle = "rgba(255,255,255,1)";
            g.beginPath();
            g.arc(px - r * 0.35, py - r * 0.35, r * 0.22, 0, 6.283);
            g.fill();
          }
          g.globalAlpha = 1;
        }
        // 반짝이·물방울
        for (let i = S.parts.length - 1; i >= 0; i--) {
          const p = S.parts[i];
          p.life -= dt * (p.kind === "drop" ? 1.1 : 1.4);
          if (p.life <= 0) {
            S.parts.splice(i, 1);
            continue;
          }
          p.vy += (p.kind === "drop" ? 700 : 160) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          g.globalAlpha = Math.min(1, p.life * 1.5);
          g.fillStyle = p.c;
          g.beginPath();
          if (p.kind === "drop") {
            g.ellipse(p.x, p.y, p.s * 0.7, p.s, 0, 0, 6.283);
          } else {
            const s = p.s;
            for (let k = 0; k < 8; k++) {
              const a = (k * Math.PI) / 4,
                rr = k % 2 ? s * 0.4 : s;
              g.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
            }
            g.closePath();
          }
          g.fill();
        }
        g.globalAlpha = 1;
      });
    };
    return S;
  };

  /* 얼룩 그리기 모양 */
  care.drawGerm = (g, x, y, r, life, t, s) => {
    g.globalAlpha = Math.min(1, life * 1.3);
    const k = 0.55 + 0.45 * life;
    KP.drawE(g, "🦠", x, y, r * 2 * k, Math.sin(t * 2 + s.seed * 9) * 0.25);
  };
  care.drawStain = (g, x, y, r, life, t, s) => {
    g.globalAlpha = 0.6 * life;
    g.fillStyle = "#e6c34a";
    g.beginPath();
    g.ellipse(x, y, r, r * 0.7, s.seed * 3, 0, 6.283);
    g.fill();
  };
  /** 진흙 철퍽 (표면 마스크용): 울퉁불퉁 덩이 + 튄 방울 + 흘러내린 줄기 + 젖은 반짝임 */
  care.drawSplat = (g, x, y, r, seed = 0.5, col = "#8a5a2b") => {
    let a = Math.floor(seed * 233280) || 1;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r * 1.1);
    gr.addColorStop(0, "#5e3b1c");
    gr.addColorStop(0.6, col);
    gr.addColorStop(1, "rgba(150,105,60,.85)");
    g.fillStyle = gr;
    g.beginPath();
    const n = 9, rot = rnd() * 6.28;
    for (let i = 0; i <= n; i++) {
      const an = rot + (i / n) * 6.283, rr = r * (0.72 + rnd() * 0.42);
      const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr * 0.85;
      if (!i) g.moveTo(px, py);
      else g.quadraticCurveTo(x + Math.cos(an - 0.35) * rr * 1.15, y + Math.sin(an - 0.35) * rr * 0.98, px, py);
    }
    g.closePath();
    g.fill();
    // 흘러내린 줄기
    g.beginPath();
    const dx = x + (rnd() - 0.5) * r * 0.8;
    g.ellipse(dx, y + r * 0.85, r * 0.2, r * (0.45 + rnd() * 0.3), 0, 0, 6.283);
    g.fill();
    // 튄 방울
    g.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      const an = rnd() * 6.28, d = r * (1.25 + rnd() * 0.45);
      g.beginPath();
      g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d * 0.85, r * (0.1 + rnd() * 0.12), 0, 6.283);
      g.fill();
    }
    // 젖은 흙 반짝임
    g.fillStyle = "rgba(255,240,220,.28)";
    g.beginPath();
    g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.28, r * 0.14, -0.5, 0, 6.283);
    g.fill();
  };
  care.drawMud = (g, x, y, r, life, t, s) => {
    g.globalAlpha = 0.9 * Math.min(1, life * 1.4);
    g.fillStyle = s.col || "#8a5a2b";
    let a = s.seed * 1000;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    g.beginPath();
    g.arc(x, y, r * 0.7 * (0.5 + 0.5 * life), 0, 6.283);
    for (let i = 0; i < 4; i++) {
      const ang = rnd() * 6.28,
        d = r * 0.5 * rnd();
      g.moveTo(x + Math.cos(ang) * d, y + Math.sin(ang) * d);
      g.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, r * (0.3 + 0.3 * rnd()) * (0.5 + 0.5 * life), 0, 6.283);
    }
    g.fill();
  };

  /* ---------------- 순서대로 하기 (도구 줄) ----------------
     o = { bar, tools:[{id, html, label}], steps:[{tool, say, act:async(btn)=>{}, auto?:true, wrong?}], mode:1|2|3, ask?:첫 질문 }
     돌려줌: Promise<boolean> — 다 끝나면 true, 화면을 나가면 끝나지 않음 */
  care.routine = function (ctx, o) {
    const sess = ctx._session;
    const alive = () => ctx._active && ctx._session === sess;
    const bar = o.bar;
    bar.innerHTML = "";
    const btns = {};
    const order = o.mode === 1 ? o.tools.slice() : U.shuffle(o.tools.slice());
    let want = null,
      waiting = null,
      busy = true,
      wrongN = 0;
    // 장면 속 물건(el)은 판마다 같은 요소 → 지난 판에 단 듣기를 떼고 새로 닮
    if (bar._kcAc) bar._kcAc.abort();
    const ac = (bar._kcAc = window.AbortController ? new AbortController() : null);
    for (const tl of order) {
      const b = tl.el || U.el("button", "kc-tb", tl.html + (tl.label ? "<span>" + tl.label + "</span>" : ""));
      b.dataset.tool = tl.id;
      if (!tl.el) bar.appendChild(b);
      btns[tl.id] = b;
      const onTap = (fn) =>
        tl.el
          ? b.addEventListener(
              "click",
              (e) => {
                KP.audio.unlock();
                fn(e);
              },
              ac ? { signal: ac.signal } : false
            )
          : ctx.tap(b, fn);
      onTap(() => {
        if (busy || !alive()) return;
        if (b.dataset.tool === want) {
          const r = waiting;
          waiting = null;
          r && r(b);
        } else {
          wrongN++;
          // 이 물건을 쓸 차례가 뒤에 있으면 "나중 일", 아니면 "다른 걸 골라 볼까?" (둘 다 자연 음성 있는 문장)
          const ci = cur ? o.steps.indexOf(cur) : -1;
          const later = o.steps.some((s, k) => k > ci && !s.auto && s.tool === b.dataset.tool);
          const msg = later ? "음, 이건 조금 나중 일이에요." : "다른 걸 골라 볼까?";
          if (o.mode === 1) ctx.miss(b, msg, { soft: true });
          else {
            ctx.miss(b, cur && cur.wrong ? cur.wrong : msg);
            if (wrongN >= 2 && btns[want]) btns[want].classList.add("glow"); // 두 번 헷갈리면 살짝 알려 주기
          }
        }
      });
    }
    for (const tl of o.tools) if (tl.el) tl.el.classList.remove("glow");
    let cur = null;
    const setRight = (id) => {
      for (const k in btns) {
        btns[k].classList.remove("glow");
        if (k === id) btns[k].dataset.right = "1";
        else delete btns[k].dataset.right;
      }
    };
    return (async () => {
      let first = true;
      for (const st of o.steps) {
        if (!alive()) return false;
        cur = st;
        if (st.auto) {
          busy = true;
          bar.classList.add("off");
          setRight(null);
          await st.act();
          continue;
        }
        bar.classList.remove("off");
        want = st.tool;
        wrongN = 0;
        setRight(st.tool);
        if (o.mode === 1) {
          ctx._hinted = true; // 정답이 반짝이는 안내 단계 — 열쇠 별 '깨끗한 판'은 아님
          btns[st.tool].classList.add("glow");
          ctx.say(st.say);
          ctx.hint(() => btns[st.tool], st.say);
        } else if (o.mode === 2) {
          if (first && o.ask) ctx.say(o.ask);
          else ctx.say("다음엔 뭘 할까요?", "무엇을 할까요?"); // 말은 자연 음성 있는 문장으로
          ctx.hint(() => btns[st.tool], st.say, { answer: true }); // 다음 도구(정답)를 가리킴 → 가리킨 판은 열쇠 별 없음
        } else {
          if (first && o.ask) ctx.say(o.ask);
          ctx.hint(() => btns[st.tool], st.say, { answer: true });
        }
        first = false;
        busy = false;
        const b = await new Promise((r) => (waiting = r));
        if (!alive()) return false;
        if (btns[st.tool].classList.contains("glow") && o.mode !== 1) ctx._hinted = true;
        busy = true;
        bar.classList.add("off");
        setRight(null);
        ctx.hint(null);
        U.replay(b, "pop");
        KP.audio.sfx("select");
        await st.act(b);
      }
      cur = null;
      return alive();
    })();
  };
})(window.KP);

;

/* ==== js/games/play/balloon.js ==== */
/* 풍선 터뜨리기 — CSS로 그린 진짜 풍선이 흔들흔들 올라온다. 콕! 누르면 팡!
   - 풍선 크기에 따라 터지는 소리 높이가 다름 (큰 풍선 = 낮은 소리)
   - 특별 풍선: 🎁 선물 풍선(동물 친구가 튀어나와 이름을 말함), ⭐ 별 풍선(+3)
   - 10개마다 축하 / 1단계: 느리고 적게 → 3단계: 빠르고 많이
   - 3단계 '색 주문': 10개 중 뒤 5개는 곰돌이가 부르는 색만("빨간 풍선만 콕! 터뜨려요!") — 다른 색은 안 터지고 살짝 흔들 + 가벼운 틀림
     ("이건 노란색이에요. 빨간 풍선을 찾아요!", 모두 자연 음성 조각). 같은 색 풍선(colorpop)과 달리 마구 터뜨리기와 번갈아 */
"use strict";
KP.game({
  id: "balloon",
  icon: "🎈",
  name: "풍선 터뜨리기",
  cat: "play",
  levels: 3,
  score: "🎈",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("balloon", `
      .bl-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;touch-action:none;
        background:linear-gradient(180deg,#7cc8ff 0%,#b5e2ff 55%,#e3f6ff 100%);box-shadow:var(--shadow)}
      .bl-sun{position:absolute;right:6%;top:7%;width:clamp(60px,9vw,110px);aspect-ratio:1;border-radius:50%;
        background:radial-gradient(circle,#fff6b0 0 45%,#ffd84a 70%,rgba(255,216,74,0) 72%);box-shadow:0 0 60px 20px rgba(255,236,140,.55);animation:bl-sun 6s ease-in-out infinite}
      @keyframes bl-sun{50%{transform:scale(1.07)}}
      .bl-cloud{position:absolute;height:clamp(26px,4vw,44px);width:clamp(90px,14vw,170px);border-radius:999px;background:#fff;opacity:.9;
        box-shadow:clamp(20px,3vw,40px) calc(clamp(10px,1.6vw,20px)*-1) 0 4px #fff;animation:bl-cloud linear infinite}
      @keyframes bl-cloud{from{transform:translateX(-30vw)}to{transform:translateX(120vw)}}
      .bl-hill{position:absolute;bottom:-60px;border-radius:50%;background:linear-gradient(#8fdc7a,#5fbf5a)}
      .bl-b{position:absolute;left:0;top:0;width:var(--w);height:calc(var(--w)*1.2);cursor:pointer;z-index:2;will-change:translate,rotate}
      .bl-b.hintGlow{position:absolute;border-radius:50%}
      .bl-body{position:absolute;inset:0;border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 7%,var(--c) 45%,var(--d) 100%);
        box-shadow:inset -7px -10px 16px rgba(0,0,0,.16),0 8px 16px rgba(30,60,120,.15)}
      .bl-body::before{content:"";position:absolute;left:17%;top:11%;width:21%;height:30%;border-radius:50%;background:rgba(255,255,255,.72);transform:rotate(26deg);filter:blur(1px)}
      .bl-body::after{content:"";position:absolute;left:41%;top:12%;width:7%;height:7%;border-radius:50%;background:rgba(255,255,255,.75)}
      .bl-knot{position:absolute;left:50%;bottom:-6%;width:16%;height:9%;margin-left:-8%;background:var(--d);clip-path:polygon(50% 0,92% 100%,8% 100%);border-radius:3px}
      .bl-str{position:absolute;left:50%;top:102%;width:30px;margin-left:-15px;height:calc(var(--w)*.95);pointer-events:none;transform-origin:50% 0;animation:bl-sway 1.6s ease-in-out infinite alternate}
      .bl-str path{fill:none;stroke:rgba(80,90,130,.55);stroke-width:2;stroke-linecap:round}
      @keyframes bl-sway{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
      .bl-gift{position:absolute;left:50%;top:calc(102% + var(--w)*.8);font-size:calc(var(--w)*.48);margin-left:calc(var(--w)*-.24);line-height:1;pointer-events:none;animation:bl-sway 1.6s ease-in-out infinite alternate-reverse}
      .bl-star{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--w)*.5);pointer-events:none;animation:bl-twk 1s ease-in-out infinite}
      .bl-b.star .bl-body{box-shadow:inset -7px -10px 16px rgba(0,0,0,.12),0 0 26px 6px rgba(255,220,80,.7)}
      @keyframes bl-twk{50%{transform:scale(1.15) rotate(10deg)}}
      .bl-shard{position:absolute;width:var(--s);height:var(--s);background:var(--c);clip-path:polygon(50% 0,100% 70%,20% 100%);pointer-events:none;z-index:4;
        animation:bl-shard .7s cubic-bezier(.2,.7,.4,1) forwards}
      @keyframes bl-shard{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
      .bl-ring{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:4px solid var(--c);pointer-events:none;z-index:4;animation:bl-ring .45s ease-out forwards}
      @keyframes bl-ring{to{transform:scale(var(--k));opacity:0}}
      .bl-pang{position:absolute;font-size:clamp(28px,4.4vw,46px);color:#fff;-webkit-text-stroke:2px var(--d);paint-order:stroke;text-shadow:0 3px 0 var(--d);pointer-events:none;z-index:5;
        transform:translate(-50%,-50%);animation:bl-pang .7s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes bl-pang{0%{transform:translate(-50%,-50%) scale(.3)}40%{transform:translate(-50%,-80%) scale(1.15)}100%{transform:translate(-50%,-120%) scale(1);opacity:0}}
      .bl-order{position:absolute;left:10px;top:10px;z-index:7;display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:6px 18px 6px 10px;
        box-shadow:0 5px 0 rgba(31,111,208,.25);font-size:clamp(20px,3vw,28px);color:var(--ink);pointer-events:none}
      .bl-order i{display:block;width:clamp(26px,3.6vw,36px);height:clamp(32px,4.4vw,44px);border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 7%,var(--c) 45%,var(--d) 100%)}
      .bl-order.pop{animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .bl-b.no .bl-body{animation:bl-no .45s}
      @keyframes bl-no{25%{transform:translateX(-10%) rotate(-8deg)}75%{transform:translateX(10%) rotate(8deg)}}
      .bl-friend{position:absolute;font-size:clamp(90px,15vw,150px);line-height:1;z-index:6;pointer-events:none;transform:translate(-50%,-50%);
        animation:bl-friend 2.3s cubic-bezier(.2,1.4,.4,1) forwards;filter:drop-shadow(0 8px 6px rgba(0,0,0,.18))}
      .bl-friend b{position:absolute;left:50%;top:100%;transform:translateX(-50%);font-size:.26em;font-weight:400;color:#fff;background:var(--coral);padding:2px 12px;border-radius:999px;white-space:nowrap}
      @keyframes bl-friend{0%{transform:translate(-50%,-50%) scale(.1) rotate(-30deg)}25%{transform:translate(-50%,-70%) scale(1.15) rotate(6deg)}35%{transform:translate(-50%,-62%) scale(1) rotate(0)}
        80%{transform:translate(-50%,-62%) scale(1);opacity:1}100%{transform:translate(-50%,-130%) scale(.7);opacity:0}}
    `);
    const field = U.el("div", "bl-field");
    field.innerHTML =
      '<div class="bl-sun"></div>' +
      '<div class="bl-cloud" style="top:12%;animation-duration:70s;animation-delay:-20s"></div>' +
      '<div class="bl-cloud" style="top:32%;animation-duration:95s;animation-delay:-70s;transform:scale(.7)"></div>' +
      '<div class="bl-hill" style="left:-10%;width:70%;height:150px"></div>' +
      '<div class="bl-hill" style="right:-15%;width:75%;height:130px;background:linear-gradient(#a6e58f,#6cc764)"></div>';
    const order = U.el("div", "bl-order");
    order.hidden = true;
    field.appendChild(order);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.orderEl = order;

    // [색, 밝은색, 어두운색, 이름(꾸밈), 이름(색)] — 이름은 3단계 '색 주문'용 (같은 색 풍선 colorpop 과 같은 말)
    ctx.COLORS = [
      ["#ff4d5e", "#ffb3ba", "#c81e3a", "빨간", "빨간색"], ["#ff9a2e", "#ffd6a3", "#d06a00", "주황", "주황색"], ["#ffd23f", "#fff3b0", "#d6a400", "노란", "노란색"],
      ["#3ccf6e", "#b9f5cd", "#1f9a4c", "초록", "초록색"], ["#3aa0ff", "#bfe0ff", "#1f6fd0", "파란", "파란색"], ["#9a6bff", "#ddd0ff", "#6a3fd4", "보라", "보라색"], ["#ff6fb5", "#ffd0e7", "#d33f8a", "분홍", "분홍색"],
    ];
    ctx.FRIENDS = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰돌이"], ["🐼", "판다"], ["🦁", "사자"], ["🐯", "호랑이"],
      ["🐵", "원숭이"], ["🐷", "돼지"], ["🦊", "여우"], ["🐨", "코알라"], ["🐸", "개구리"], ["🐧", "펭귄"], ["🦄", "유니콘"], ["🦖", "공룡"],
    ];

    /* ---------- 소리 ---------- */
    const PENTA = ["C6", "A5", "G5", "E5", "D5", "C5", "A4", "G4"];
    ctx.popSound = (w) => {
      // 작을수록 높은 소리
      const k = U.clamp((w - 70) / 90, 0, 1);
      const f = 1500 - k * 900;
      A.tone(f, { to: f * 0.32, dur: 0.13, vol: 0.3 });
      A.noise({ dur: 0.09, vol: 0.2, hp: 1400 + (1 - k) * 2000 });
      A.note(PENTA[Math.round(k * (PENTA.length - 1))], { inst: "marimba", dur: 0.35, vol: 0.16, when: 0.03 });
    };

    /* ---------- 풍선 ---------- */
    let uid = 0;
    ctx.make = (kind) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const base = U.clamp(Math.min(W, H) * 0.2, 78, 140);
      const w = Math.max(78, Math.round(base * U.randf(lv === 3 ? 0.8 : 0.9, 1.15) * (kind ? 1.08 : 1))); // 폰 가로 3단계도 78px 이상
      // 색 주문 중에는 부르는 색이 절반쯤
      const col = kind === "star" ? ["#ffcf33", "#fff6c4", "#e09a00"] : ctx.order && Math.random() < 0.45 ? ctx.order : U.pick(ctx.COLORS);
      const el = U.el("div", "bl-b" + (kind ? " " + kind : ""));
      el.dataset.tap = "1";
      el.style.cssText = "--w:" + w + "px;--c:" + col[0] + ";--l:" + col[1] + ";--d:" + col[2];
      el.innerHTML =
        '<div class="bl-body"></div><div class="bl-knot"></div>' +
        '<svg class="bl-str" viewBox="0 0 30 100" preserveAspectRatio="none"><path d="M15 0 C 4 20, 26 40, 15 60 S 6 85, 15 100"/></svg>' +
        (kind === "gift" ? '<div class="bl-gift">' + KP.E("🎁") + "</div>" : "") +
        (kind === "star" ? '<div class="bl-star">' + KP.E("⭐") + "</div>" : "");
      const speed = [55, 78, 105][lv - 1] * U.randf(0.85, 1.2) * (H / 650 + 0.4);
      const b = { id: ++uid, el, w, h: w * 1.2, col, kind, x0: U.randf(w * 0.6, W - w * 0.6), y: H + 20, speed, ph: Math.random() * 6.28, amp: U.randf(8, 26), fq: U.randf(0.7, 1.3), x: 0, dead: false };
      ctx.fast(el, (e) => {
        e.stopPropagation();
        ctx.pop(b);
      });
      field.appendChild(el);
      ctx.balloons.push(b);
      return b;
    };

    ctx.recolor = (b, col) => {
      b.col = col;
      b.el.style.setProperty("--c", col[0]);
      b.el.style.setProperty("--l", col[1]);
      b.el.style.setProperty("--d", col[2]);
    };
    ctx.burst = (b, cx, cy) => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + Math.random() * 0.4,
          d = b.w * U.randf(0.6, 1.1);
        const s = U.el("div", "bl-shard");
        s.style.cssText = "left:" + cx + "px;top:" + cy + "px;--s:" + Math.round(b.w * U.randf(0.12, 0.2)) + "px;--c:" + b.col[0] +
          ";--dx:" + Math.cos(a) * d + "px;--dy:" + (Math.sin(a) * d + 30) + "px;--r:" + U.rand(540) + "deg";
        field.appendChild(s);
        ctx.after(750, () => s.remove());
      }
      const r = U.el("div", "bl-ring");
      r.style.cssText = "left:" + cx + "px;top:" + cy + "px;--c:" + b.col[1] + ";--k:" + b.w / 9;
      field.appendChild(r);
      const t = U.el("div", "bl-pang", U.pick(["팡!", "펑!", "빵!", "팡!"]));
      t.style.cssText = "left:" + cx + "px;top:" + cy + "px;--d:" + b.col[2];
      field.appendChild(t);
      ctx.after(800, () => {
        r.remove();
        t.remove();
      });
    };

    ctx.pop = (b) => {
      if (b.dead) return;
      // 3단계 색 주문: 다른 색은 안 터지고 도리도리 (가벼운 틀림, 1번은 봐줌)
      if (ctx.order && !b.kind && b.col !== ctx.order) {
        if (b.noAt && performance.now() - b.noAt < 900) return;
        b.noAt = performance.now();
        U.replay(b.el, "no");
        A.sfx("boing");
        ctx.miss(null, "이건 " + b.col[4] + "이에요. " + ctx.order[3] + " 풍선을 찾아요!", { soft: true });
        return;
      }
      if (ctx.order && b.col === ctx.order) ctx.orderPops++;
      b.dead = true;
      const cx = b.x,
        cy = b.y + b.h / 2;
      b.el.remove();
      ctx.popSound(b.w);
      ctx.burst(b, cx, cy);
      let add = 1;
      if (b.kind === "star") {
        add = 3;
        A.sfx("sparkle");
        const t = U.el("div", "bl-pang", "+3");
        t.style.cssText = "left:" + cx + "px;top:" + (cy - b.w * 0.5) + "px;--d:#e09a00;font-size:clamp(40px,6vw,64px)";
        field.appendChild(t);
        ctx.after(800, () => t.remove());
        KP.voice.say("반짝 별 풍선! 세 개!");
      } else if (b.kind === "gift") {
        const [em, name] = U.pick(ctx.FRIENDS);
        const f = U.el("div", "bl-friend", KP.E(em) + "<b>" + name + "</b>");
        const fx = U.clamp(cx, 80, field.clientWidth - 80),
          fy = U.clamp(cy + b.w * 0.6, 110, field.clientHeight - 80);
        f.style.left = fx + "px";
        f.style.top = fy + "px";
        field.appendChild(f);
        ctx.after(2400, () => f.remove());
        ctx.after(120, () => A.sfx("levelup"));
        KP.voice.say("짠! " + name + "!");
      }
      const prev = ctx.count;
      ctx.count += add;
      ctx.score.add(add);
      if (Math.floor(ctx.count / 10) > Math.floor(prev / 10)) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        // 열쇠 별: 1·2단계는 누르기만 하는 판 → 없음. 3단계는 색 주문에서 3개 이상 골라 터뜨린 판만
        const judged = ctx.orderPops >= 3;
        ctx.setOrder(null);
        ctx.after(b.kind === "gift" ? 1300 : 250, () => (judged || ctx.noStar(), ctx.win({ big, msg: big ? "{부름} 풍선 대장!" : ctx.count + "개 팡팡!", say: big ? "" : ctx.count <= 100 ? KP.u.numSino(ctx.count) + "! 우와!" : "우와아!" })));
      } else if (ctx.level === 3 && !ctx.order && ctx.count % 10 >= 5) ctx.setOrder(U.pick(ctx.COLORS.filter((c) => c !== ctx.lastOrder)));
    };
    // 힌트: 가장 아래 풍선 (색 주문 중에는 부르는 색만 — 정답을 가리키는 셈이라 answer, 가리킨 판은 열쇠 별 없음)
    // answer 는 색 주문 중에만: 늘 answer 면 3단계 앞 5개(마구 터뜨리기)에서 가리킨 손가락이 뒤 색 주문 판의 별까지 막았음
    ctx.setHint = () =>
      ctx.hint(
        () => {
          const alive = ctx.balloons.filter((b) => !b.dead && b.y > 0 && b.y < ctx.field.clientHeight - b.h && (!ctx.order || b.col === ctx.order));
          alive.sort((a, b) => b.y - a.y);
          return alive[0] && alive[0].el;
        },
        ctx.order ? ctx.order[3] + " 풍선을 찾아요!" : "풍선을 콕 눌러 봐요!",
        ctx.order ? { answer: true } : undefined
      );
    /** 3단계 색 주문 켜기/끄기 */
    ctx.setOrder = (c) => {
      ctx.order = c;
      ctx.orderPops = 0;
      ctx.orderEl.hidden = !c;
      ctx.setHint();
      if (!c) return;
      ctx.lastOrder = c;
      ctx.orderEl.innerHTML = '<i style="--c:' + c[0] + ";--l:" + c[1] + ";--d:" + c[2] + '"></i><span>' + c[3] + " 풍선만!</span>";
      U.replay(ctx.orderEl, "pop");
      A.sfx("sparkle");
      ctx.say(c[3] + " 풍선만 콕! 터뜨려요! 🎈");
    };

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const maxN = [5, 7, 9][lv - 1];
      ctx.spawnT -= dt;
      const alive = ctx.balloons.filter((b) => !b.dead);
      if (ctx.spawnT <= 0 && alive.length < maxN) {
        ctx.spawnT = [1.1, 0.8, 0.6][lv - 1] * U.randf(0.7, 1.3);
        const r = Math.random();
        // 색 주문 중에는 특별 풍선 없이 (색 고르기에 집중) — 부르는 색이 화면에 하나도 없으면 꼭 그 색
        if (ctx.order) {
          const has = alive.some((b) => b.col === ctx.order && b.y > 0);
          const nb = ctx.make(null);
          if (!has && nb.col !== ctx.order) ctx.recolor(nb, ctx.order);
        } else ctx.make(r < 0.08 ? "star" : r < 0.18 ? "gift" : null);
      }
      for (const b of ctx.balloons) {
        if (b.dead) continue;
        b.y -= b.speed * dt;
        b.x = U.clamp(b.x0 + Math.sin(t * b.fq + b.ph) * b.amp, b.w / 2, W - b.w / 2);
        const rot = Math.sin(t * b.fq * 1.3 + b.ph) * 6;
        // 위치는 translate 로 (힌트 반짝임이 transform 을 써서 따로) — left/top 은 매 장면 다시 칠하게 해서 저가 태블릿이 버벅임
        b.el.style.translate = b.x - b.w / 2 + "px " + b.y + "px";
        b.el.style.rotate = rot + "deg";
        if (b.y < -b.h * 2.4) {
          b.dead = true;
          b.el.remove();
        }
      }
      ctx.balloons = ctx.balloons.filter((b) => !b.dead);
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".bl-b,.bl-shard,.bl-ring,.bl-pang,.bl-friend").forEach((e) => e.remove());
    ctx.balloons = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.lastOrder = null;
    ctx.setOrder(null);
    ctx.spawnT = 0.2;
    ctx.say("풍선을 콕! 눌러서 팡 터뜨려 봐요! 🎈");
    requestAnimationFrame(() => {
      // 처음부터 화면에 풍선 몇 개
      const H = ctx.field.clientHeight;
      [0.35, 0.6, 0.85].forEach((p, i) => {
        const b = ctx.make(i === 1 ? "gift" : null);
        b.y = H * p;
      });
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    ctx.setHint();
  },
});

;

/* ==== js/games/play/bath.js ==== */
/* 동물 목욕 — 점토 욕실의 둥근 욕조에 아이가 칠한 3D 인형 친구가 풍덩! 진흙 묻은 친구를 씻겨 줘요.
   - 욕조 앞벽·물이 인형 아랫몸을 가림(배경 그림 + 알파 마스크 앞가림, clay-stage frontMask)
   - 진흙·거품·물기는 인형 위에 겹친 '표면 마스크'(KP.care setSkin) — 인형 모양 안에서만 생기고, 문지른 자리만 지워짐.
     아이가 칠한 원본 그림(텍스처)은 건드리지 않음. 모양은 인형이 욕조에 앉은 뒤 화면에서 한 번 떠 냄(앞가림 부분은 뺌)
   - 비누로 문지르면 그 자리만 거품 + 진흙이 지워짐 → 샤워기로 헹구면 거품이 흘러내림 → 수건으로 물기 닦기 → 부르르(몸 흔들기 + 물방울)
   - 물 위에 점토 오리: 누르면 꽥!
   - 단계: 1 진흙 4곳(첫 친구는 강아지): 진흙만 비누칠 → 진흙 자리만 샤워 → 수건 없이 부르르 털기
           2 진흙 6곳: 진흙만 비누칠 → 온몸 샤워 → 판마다 수건 / 부르르 털기 번갈아
           3 진흙 8곳: 진흙만 비누칠 → 온몸 샤워 → 수건 + 오리 물장난(오리를 누르면 친구에게 첨벙! 친구가 깔깔)
     비누는 늘 '진흙 묻은 곳 찾기'(온몸을 다 문지르지 않음) — 예전 매 판 비누·샤워·수건 온몸 3번(스크립트로도 42~89초)을 줄임
     (모두 안내 있음, 시간 제한 없음)
   공용: _shared/clay-stage.js · doll-actor.js · play-feedback.js · play/_care.js(문지르기 판·표면 마스크) */
"use strict";
KP.game({
  id: "bath",
  icon: "🛁",
  name: "동물 목욕",
  cat: "play",
  levels: 3,
  score: "🛁",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/bath/");
    KP.care.css();
    KP.css("bath", `
      .ba-scene{background:#e6efe4}
      .ba-skin{position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;pointer-events:none}
      .ba-rest{position:absolute;left:0;top:0;z-index:4;pointer-events:none;width:var(--s,80px);height:var(--s,80px);transition:opacity .2s}
      .ba-rest img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 6px 5px rgba(70,50,30,.3));animation:ba-bob 1.4s ease-in-out infinite alternate}
      .ba-rest.hide{opacity:0}
      .ba-rest.pop{animation:popIn .4s cubic-bezier(.2,1.5,.4,1)}
      .ba-duck{position:absolute;left:0;top:0;z-index:6;width:var(--s,70px);height:var(--s,70px);touch-action:none;cursor:pointer}
      .ba-duck img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(40,80,110,.25));animation:ba-bob 1.7s ease-in-out infinite alternate}
      .ba-duck.quack img{animation:ba-quack .4s ease-out}
      @keyframes ba-bob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-7%) rotate(4deg)}}
      @keyframes ba-quack{35%{transform:scale(1.18,.84) rotate(-8deg)}70%{transform:scale(.95,1.08)}}
      .kc-tool .ba-shw{position:relative;width:100%;height:100%}
      .kc-tool .ba-shw img{position:absolute;left:18%;top:-62%;width:74%;height:auto;transform:rotate(196deg);filter:drop-shadow(0 -6px 5px rgba(0,0,0,.22))}
      .ba-spray{position:absolute;left:24%;top:30%;width:52%;height:52%;clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);opacity:.85;
        -webkit-mask-image:linear-gradient(#000 40%,transparent);mask-image:linear-gradient(#000 40%,transparent)}
      /* 물줄기 무늬는 26px 더 긴 한 장(::before)에 그려 두고 통째로 아래로 밀기만 함 (무늬를 매번 다시 칠하면 저가 태블릿이 버벅임). 바깥은 clip-path 가 잘라 줌 */
      .ba-spray::before{content:"";position:absolute;left:0;right:0;top:-26px;bottom:0;
        background:repeating-linear-gradient(97deg,rgba(170,220,255,0) 0 5px,rgba(170,220,255,.95) 5px 8px,rgba(255,255,255,0) 8px 13px);animation:ba-spray .22s linear infinite}
      @keyframes ba-spray{from{transform:translateY(0)}to{transform:translateY(26px)}}
      .ba-load{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene ba-scene"));
    ctx.body.appendChild(scene);
    // 표면(진흙·거품·물기)은 욕조 앞벽보다 뒤에 그림: z 2, 무대가 나중에 붙이는 앞가림(z 2)보다 DOM 이 앞
    ctx.skinCv = U.el("canvas", "ba-skin");
    scene.appendChild(ctx.skinCv);
    ctx.rest = U.el("div", "ba-rest");
    ctx.duck = U.el("div", "ba-duck", '<img alt="" draggable="false" src="' + IMG + 'duck.png">');
    ctx.duck.setAttribute("aria-label", "오리");
    scene.append(ctx.rest, ctx.duck);
    ctx.F = { x: 0, y: 0, w: 1, h: 1 };
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F });
    ctx.S.radius = 0.1;
    // 오리: 누르면 꽥! (언제든)
    ctx.fast(ctx.duck, () => {
      const A = KP.audio;
      A.tone(1150, { to: 720, dur: 0.1, vol: 0.15, type: "square" });
      A.tone(1050, { to: 640, dur: 0.13, vol: 0.13, type: "square", when: 0.13 });
      U.replay(ctx.duck, "quack");
      const r = ctx.duck.getBoundingClientRect(), hr = scene.getBoundingClientRect();
      KP.care.pop(ctx, scene, r.left - hr.left + r.width / 2, r.top - hr.top, "꽥!");
      KP.pfx.ring(scene, r.left - hr.left + r.width / 2, r.top - hr.top + r.height * 0.85, "#bfe6ff", ctx, r.width * 1.2);
      // 3단계: 오리가 친구에게 물을 첨벙! 친구가 깔깔 웃어요 (씻는 중에만, 1.5초에 한 번)
      const act = ctx.actor;
      if (ctx.level >= 3 && act && ["soap", "shower", "towel"].includes(ctx.stage) && Date.now() - (ctx._splashAt || 0) > 1500) {
        ctx._splashAt = Date.now();
        const b = act.box();
        ctx.after(180, () => {
          if (ctx.actor !== act) return;
          A.sfx("water");
          ctx.S.burst(b.cx - b.w * 0.15, b.t + b.h * 0.35, 6, "drop", 1);
          ctx.S.burst(b.cx + b.w * 0.15, b.t + b.h * 0.45, 6, "drop", 1);
          KP.care.pop(ctx, scene, b.cx, Math.max(56, b.t + b.h * 0.1), "첨벙!");
          act.mood("happy");
          ctx.after(1000, () => ctx.actor === act && ctx.stage !== "soap" && act.mood("normal"));
        });
      }
    });
    // 욕실 배경 (1600×900): 욕조 가운데. 가로 화면은 조금 당겨서(zoom) 인형을 크게
    ctx.BG = {
      file: IMG + "bg.jpg", frontMask: IMG + "front-mask.png", img: [1600, 900], vh: 0.2, near: 0.2, fov: 34,
      focus: [0.5, 0.36], focusP: [0.5, 0.38], sun: [-0.35, 1, 0.8], sunCol: "#fff4e6",
      zoom: (w, h) => (w / h > 1.9 ? 1 : w / h > 1.6 ? 1.12 : 1.18), // 납작한 폰 가로 화면은 당기지 않음(머리 잘림 방지)
    };
    // 앞가림 마스크 그림 (표면에서 가려진 곳 빼기용)
    ctx.frontImg = new Image();
    ctx.frontImg.src = ctx.BG.frontMask;
    ctx.TOOLS = {
      soap: '<img alt="" src="' + IMG + 'soap.png">',
      shower: '<div class="ba-shw"><i class="ba-spray"></i><img alt="" src="' + IMG + 'shower.png"></div>',
      towel: '<img alt="" src="' + IMG + 'towel.png">',
    };
    ctx.token = 0;
  },

  /* ---------- 무대 · 인형 (동물 병원과 같은 방식) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("bath:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    let st;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => ctx._active && ctx.st === st && this.start(ctx, true),
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("bath:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    try {
      st = CS.create(ctx.scene, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.scene, ctx.BG, opt);
    }
    ctx.st = st;
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.S) {
      ctx.S.reset();
      ctx.S.dropSkin();
    }
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
  },
  pickDoll(ctx) {
    const U = KP.u, D = KP.DOLL;
    const list = ctx.dolls || [];
    if (list.length) {
      const c = list.length > 1 ? list.filter((x) => x.id !== ctx.lastDoll) : list;
      const it = U.pick(c);
      ctx.lastDoll = it.id;
      return { item: it };
    }
    const sp = ctx.level === 1 && !ctx.round ? "dog" : U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },
  async start(ctx, again) {
    if (!again) ctx.round = 0;
    const tok = ++ctx.token;
    ctx.scene.querySelectorAll(".ba-load").forEach((e) => e.remove());
    const wait = KP.u.el("div", "ba-load", KP.E("🛁") + " 준비 중");
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      if (ctx.track) ctx.track(dt);
    });
    ctx.S.run();
    return this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    this.dropStage(ctx);
  },

  /** 인형 모양 떠 내기: 화면에 그려진 인형(3D 캔버스 또는 그림)의 알파 − 앞가림(욕조 앞벽·물) → 틀(F) 크기의 작은 캔버스 */
  captureShape(ctx, F, size) {
    const st = ctx.st, act = ctx.actor;
    const k = size ? size.w / F.w : Math.min(1.5, 300 / Math.max(F.w, F.h));
    const mw = size ? size.w : Math.max(8, Math.round(F.w * k)),
      mh = size ? size.h : Math.max(8, Math.round(F.h * k));
    const c = document.createElement("canvas");
    c.width = mw;
    c.height = mh;
    const g = c.getContext("2d", { willReadFrequently: true });
    // 원본 밖을 가리키지 않게 자른 뒤 그림 (옛 Safari 는 밖을 가리키면 아무것도 안 그림)
    const blit = (src, sw, sh, sx, sy, w, h, dx, dy, dw, dh) => {
      const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(sw, sx + w), y1 = Math.min(sh, sy + h);
      if (x1 <= x0 || y1 <= y0) return;
      const kx = dw / w, ky = dh / h;
      g.drawImage(src, x0, y0, x1 - x0, y1 - y0, dx + (x0 - sx) * kx, dy + (y0 - sy) * ky, (x1 - x0) * kx, (y1 - y0) * ky);
    };
    try {
      if (st.gl) {
        st.render(); // 같은 순간에 읽어야 그림이 남아 있음
        const src = st.renderer.domElement, s = src.width / st.w;
        blit(src, src.width, src.height, F.x * s, F.y * s, F.w * s, F.h * s, 0, 0, mw, mh);
      } else if (act && act.el) {
        const img = act.el.querySelector("img");
        if (img && img.naturalWidth) {
          const r = img.getBoundingClientRect(), hr = st.host.getBoundingClientRect();
          const sc = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
          const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
          const dx = r.left - hr.left + (r.width - dw) / 2, dy = r.top - hr.top + (r.height - dh) / 2;
          g.drawImage(img, (dx - F.x) * k, (dy - F.y) * k, dw * k, dh * k);
        }
      }
    } catch (e) {
      console.warn("인형 모양을 못 떴어요", e && e.message);
    }
    KP.care.hardAlpha(c, 170); // 바닥 그림자(반투명)는 뺌
    if (ctx.frontImg.complete && ctx.frontImg.naturalWidth) {
      const v = st.bc.view;
      g.globalCompositeOperation = "destination-out";
      g.drawImage(ctx.frontImg, (-v.ox - F.x) * k, (-v.oy - F.y) * k, v.fw * k, v.fh * k);
      g.globalCompositeOperation = "source-over";
    }
    // 못 떴으면(그래픽 읽기 막힘 등) 틀 위쪽의 둥근 모양으로
    const d = g.getImageData(0, 0, mw, mh).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 128) n++;
    if (n < (mw * mh) / 4 * 0.04) {
      g.clearRect(0, 0, mw, mh);
      g.fillStyle = "#fff";
      g.beginPath();
      g.ellipse(mw / 2, mh * 0.42, mw * 0.36, mh * 0.36, 0, 0, 6.283);
      g.fill();
      if (ctx.frontImg.naturalWidth) {
        const v = st.bc.view;
        g.globalCompositeOperation = "destination-out";
        g.drawImage(ctx.frontImg, (-v.ox - F.x) * k, (-v.oy - F.y) * k, v.fw * k, v.fh * k);
        g.globalCompositeOperation = "source-over";
      }
      ctx._shapeFallback = true;
    } else ctx._shapeFallback = false;
    return c;
  },

  async next(ctx) {
    const U = KP.u,
      A = KP.audio,
      C = KP.care,
      S = ctx.S,
      st = ctx.st;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    S.reset();
    S.dropSkin();
    ctx.track = null;
    ctx.say("누가 나올까? 🛁"); // 지난 판 안내("수건으로…")가 말풍선에 남지 않게
    ctx.rest.classList.add("hide");
    ctx.stage = "enter";
    ctx.baState = null;

    /* ---------- 인형 ---------- */
    const pick = this.pickDoll(ctx);
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    let act;
    try {
      act = st.gl ? await KP.dollActor.create(st, pick) : await KP.dollActor.create2D(st, pick);
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (!live()) return;
      act = await KP.dollActor.create2D(st, { species: "dog" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    // 자리: 욕조 가운데. 발은 물속(그림 v 0.593), 머리 꼭대기는 그림 v 0.07 → 물 위로 몸 위쪽 3/4
    const FOOT = [0.5, 0.593], TOPV = 0.07;
    const layout = () => {
      const g = st.bc.ground(FOOT[0], FOOT[1]) || st.spot("x");
      const fp = st.uvToPx(FOOT[0], FOOT[1]), tp = st.uvToPx(FOOT[0], TOPV);
      act.setH(st.fitH(g[0], g[1], (fp.y - tp.y) / st.h));
      return g;
    };
    let seat = layout();
    let entering = true;
    let shapeT = null;
    st.onResize = () => {
      seat = layout();
      if (!entering && !act._jump) act.place(seat[0], seat[1]);
      // 화면 크기가 바뀌면 모양만 다시 뜸 (진흙·거품 층은 틀 비율이라 그대로)
      if (S.skin) {
        ctx.cancel(shapeT);
        shapeT = ctx.after(300, () => {
          if (!live() || !S.skin) return;
          S.skin.shape = this.captureShape(ctx, ctx.F, { w: S.skin.w, h: S.skin.h });        });
      }
    };
    const offX = () => {
      const b = act.box();
      return seat[0] + st.pxToWorld(seat[0], seat[1], st.w - st.project(seat[0], 0, seat[1]).x + b.w / 2 + 20);
    };
    act.place(offX(), seat[1]);
    act.mood("normal");
    const name = act.name;
    // 화면에 붙는 것들 (매 장면)
    const restAt = (u, v, s) => {
      const p = st.uvToPx(u, v);
      return [U.clamp(p.x - s / 2, 6, st.w - s - 6), U.clamp(p.y - s / 2, 6, st.h - s - 6)];
    };
    let restTool = null;
    ctx.track = () => {
      const b = act.box();
      ctx.F = { x: b.l - b.w * 0.12, y: b.t - b.h * 0.06, w: b.w * 1.24, h: b.h * 1.12 };
      const fh = st.bc.view.fh;
      // 오리: 인형 왼쪽 물 위 (좁은 화면이면 가장자리 안쪽)
      const ds = Math.max(72, fh * 0.11); // 폰 가로에서도 72px
      const dp = st.uvToPx(0.335, 0.425);
      const dx = U.clamp(Math.min(dp.x, b.l - ds * 0.35) - ds / 2, 4, st.w - ds - 4);
      ctx.duck.style.cssText = `--s:${ds}px;transform:translate(${dx}px,${dp.y - ds * 0.72}px)`;
      // 쉬고 있는 도구: 욕조 오른쪽 가장자리 위
      if (restTool) {
        const rs = Math.max(64, fh * 0.13);
        const [rx, ry] = restAt(0.735, 0.355, rs);
        const lx = b.r + 4 + rs > st.w ? rx : Math.max(rx, b.r + 4);
        ctx.rest.style.cssText = `--s:${rs}px;left:${lx}px;top:${ry}px`;
        ctx.rest.classList.toggle("hide", S.toolEl.classList.contains("on"));
      }
      // 비누로 문지르는 동안 간지러워 웃음
      if (ctx.stage === "soap") act.mood(S.toolEl.classList.contains("on") ? "happy" : "normal");
    };
    const dollPt = () => {
      const r = ctx.scene.getBoundingClientRect(), p = act.anchor("chest");
      return { x: r.left + p.x, y: r.top + p.y };
    };

    /* ---------- 들어오기: 폴짝 → 첨벙 ---------- */
    let line = "진흙투성이 " + name + "! 깨끗이 씻겨 줘요";
    if (!(KP.voice._natUrls && KP.voice._natUrls(line))) line = "진흙투성이 친구! 깨끗이 씻겨 줘요";
    await Promise.race([act.jumpTo(seat[0], seat[1], 0.85, 0.55), ctx.wait(1300)]);
    if (!live()) return;
    entering = false;
    act.place(seat[0], seat[1]);
    A.sfx("water");
    A.tone(320, { to: 120, dur: 0.18, vol: 0.18, type: "sine" });
    {
      const w = st.uvToPx(0.5, 0.44);
      S.burst(w.x - act.box().w * 0.3, w.y, 10, "drop", 1);
      S.burst(w.x + act.box().w * 0.3, w.y, 10, "drop", 1);
      C.pop(ctx, ctx.scene, w.x, act.box().t, "첨벙!");
    }
    ctx.say(line + " 🛁");
    await ctx.wait(650); // 자리 잡고 고개가 정면을 볼 때까지
    if (!live()) return;

    /* ---------- 표면: 인형 모양 + 진흙 ---------- */
    ctx.track();
    const shape = this.captureShape(ctx, ctx.F);
    S.setSkin(shape, { el: ctx.skinCv });
    const body = C.ptsIn(shape, 10, 0.025);
    const mudN = [4, 6, 8][lv - 1];
    const COLS = ["#8a5a2b", "#7a4e24", "#9b6a3a"];
    const cand = C.ptsIn(shape, 12, 0.06);
    // 진흙 점 = 비누 구간의 문지를 곳 (zone soap) → 진흙을 다 찾아 문지르면 비누 끝
    const mud = U.sample(cand.length >= mudN ? cand : body, mudN).map((p) => ({ zone: "soap", x: p.x, y: p.y, r: U.randf(0.13, 0.18), need: 1.6, col: U.pick(COLS), seed: Math.random() }));
    const mudXY = mud.map((m) => ({ x: m.x, y: m.y }));
    // 이번 판 순서: 1단계는 수건 없이 털기, 2단계는 판마다 수건/털기 번갈아, 3단계는 수건
    const useTowel = lv === 3 || (lv === 2 && (ctx.round || 0) % 2 === 0);
    S.skinMud(mud);
    ctx.mud = mud;
    // 점검용
    ctx.baState = () => ({ tok, stage: ctx.stage, on: S.on, painted: act.painted, gl: !!st.gl, who: name, fallback: !!ctx._shapeFallback, prog: S.zones[ctx.stage] ? S.prog(ctx.stage) : 0 });
    ctx.baPt = (u, v) => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + ctx.F.x + u * ctx.F.w, y: r.top + ctx.F.y + v * ctx.F.h };
    };
    ctx.baBody = () => body;
    await ctx.wait(1200);
    if (!live()) return;

    /* ---------- 단계: 비누 → 샤워기 → 수건 ---------- */
    const setTool = (tool) => {
      restTool = tool;
      ctx.rest.innerHTML = '<img alt="" src="' + ctx.IMG + tool + '.png">'; // 쉬는 도구는 그림만 (물줄기 없이)
      ctx.rest.classList.remove("hide");
      U.replay(ctx.rest, "pop");
      S.setTool(ctx.TOOLS[tool], Math.max(70, ctx.F.w * 0.36));
    };
    let lastWater = 0;
    /** pts: 문지를 곳(없으면 온몸 격자) */
    const stage = (tool, mode, say, need, pts) =>
      new Promise((res) => {
        S.reset(true);
        if (pts) S.add(pts);
        else S.add(body.map((p) => ({ zone: tool, x: p.x, y: p.y, need })));
        S.mode = mode;
        // 진흙 찾기(비누)는 3/4 이상, 샤워·수건은 1단계 60%·그 위 70%
        S.need = tool === "soap" ? 0.74 : lv === 1 ? 0.6 : 0.7;
        ctx.stage = tool;
        setTool(tool);
        S.sound =
          tool === "shower"
            ? () => {
                if (Date.now() - lastWater > 260) (lastWater = Date.now()), A.sfx("water");
              }
            : () => A.sfx("rub");
        let rubD = 0;
        S.onRub = (x, y, len) => {
          rubD += len;
          if (rubD > 110) {
            rubD = 0;
            if (tool === "soap") A.sfx("bubble");
            const part = act.hit(x, y, ["chest", "belly", "forehead", "cheekR", "cheekL", "armR", "armL"]);
            if (part) act.poke(part, -0.012, 0.12); // 만진 자리가 살짝 쏙
          }
        };
        ctx.say(say);
        // 진흙 찾기 판은 아직 남은 진흙(문지를 곳)을 가리킴
        const spotPt = () => {
          const q = S.spots.find((z) => z.zone === tool && z.life > 0 && !z.fade);
          if (!q) return dollPt();
          const r = ctx.scene.getBoundingClientRect();
          return { x: r.left + ctx.F.x + q.x * ctx.F.w, y: r.top + ctx.F.y + q.y * ctx.F.h };
        };
        ctx.hint(pts ? spotPt : dollPt, say);
        S.on = true;
        S.onZone = (k) => {
          if (k !== tool) return;
          S.on = false;
          ctx.hint(null);
          res();
        };
      });
    const cx = () => ctx.F.x + ctx.F.w / 2;
    const topY = () => Math.max(56, act.box().t + act.box().h * 0.08); // 떠오르는 글자가 위로 잘리지 않게

    await stage("soap", { foam: true }, "비누로 거품을 뽀글뽀글 문질러요! 🧼", 1.4, mud);
    if (!live()) return;
    S.skinFade("dirt"); // 남은 진흙은 스르륵
    act.mood("happy");
    A.sfx("bubble");
    C.pop(ctx, ctx.scene, cx(), topY(), "뽀글뽀글");
    await ctx.wait(800);
    if (!live()) return;
    act.mood("normal");

    // 1단계: 거품 묻은 곳(진흙 자리)만 헹굼 / 2·3단계: 온몸
    await stage("shower", { unfoam: true, drops: true }, "샤워기로 거품을 씻어요! 🚿", 1.2, lv === 1 ? mudXY.map((p) => ({ zone: "shower", x: p.x, y: p.y, r: 0.2, need: 1 })) : null);
    if (!live()) return;
    S.skinFade("foam");
    A.sfx("water");
    C.pop(ctx, ctx.scene, cx(), topY(), "쏴아");
    await ctx.wait(800);
    if (!live()) return;

    if (useTowel) {
      // 물기가 아직 없는 곳도 촉촉하게 (수건으로 닦을 게 보이게)
      S.skinFill("wet", 0.8);
      await stage("towel", { dry: true, sparkle: true }, "수건으로 보송보송 닦아요!", 1.0);
      if (!live()) return;
      S.skinFade("wet");
    } else ctx.after(900, () => live() && S.skinFade("wet")); // 수건 없는 판: 부르르 털어서 마름
    ctx.stage = "shake";
    restTool = null;
    ctx.rest.classList.add("hide");

    /* ---------- 부르르 → 기뻐하기 ---------- */
    C.pop(ctx, ctx.scene, cx(), topY(), "부르르", true);
    A.sfx("boing");
    for (let i = 0; i < 6; i++) ctx.after(i * 120, () => A.noise({ dur: 0.08, vol: 0.06, bp: 1800, q: 1.2 }));
    const t0 = st.time, DUR = 1.2;
    const shake = (dt, t) => {
      const e = (t - t0) / DUR;
      if (e >= 1) {
        act.play.sway = act.play.tilt = 0;
        st.updaters = st.updaters.filter((f) => f !== shake);
        return;
      }
      const env = Math.sin(Math.PI * Math.min(1, e * 1.3));
      act.play.sway = Math.sin(t * 44) * 0.085 * env;
      act.play.tilt = Math.sin(t * 38 + 1) * 0.14 * env;
    };
    st.updaters.push(shake);
    for (let i = 0; i < 6; i++)
      ctx.after(i * 180, () => {
        const b = act.box();
        S.burst(b.l + b.w * 0.15, b.t + b.h * U.randf(0.25, 0.6), 5, "drop", 0.9);
        S.burst(b.r - b.w * 0.15, b.t + b.h * U.randf(0.25, 0.6), 5, "drop", 0.9);
      });
    await ctx.wait(1300);
    if (!live()) return;
    act.mood("happy");
    act.happy();
    const b = act.box();
    S.burst(b.cx, b.t + b.h * 0.35, 30, "star", 1.1);
    KP.pfx.hearts(ctx.scene, b.cx, b.t + b.h * 0.1, 4, ctx);
    A.sfx("sparkle");
    await ctx.wait(900);
    if (!live()) return;
    ctx.score.add();
    ctx.round++;
    const big = ctx.round % 4 === 0;
    const msg = big ? "{부름} 목욕 최고!" : U.pick(["뽀송뽀송 깨끗해!", "깨끗해졌어요!", "{부름} 고마워요!"]);
    // 말은 자연 음성이 있는 문장으로 ("목욕 최고!"·"뽀송뽀송 깨끗해!"는 녹음 전)
    const say = msg === "{부름} 목욕 최고!" ? "{부름} 최고예요!" : msg === "뽀송뽀송 깨끗해!" ? "깨끗해졌어요!" : msg;
    ctx.noStar(); // 문지르기만 하면 끝나는 판(틀릴 수 없음) → 열쇠 별 없음
    const ok = await ctx.win({ big, msg, say });
    if (ok && live()) this.next(ctx);
  },
});

;

/* ==== js/games/play/brush.js ==== */
/* 치카치카 양치 — 입을 크게 벌린 점토 하마(그림)의 이를 점토 칫솔로 닦아요
   - 이 12개(위 6 · 아래 6)의 자리는 그림에 맡기지 않고 코드 데이터(TEETH, 그림 px 사각형)로 정함 → 화면 크기와 상관없이 제자리
   - 이 모양을 '표면 마스크'(KP.care setSkin)로 넘겨: 누런 막·치석(dirt)·치약 거품(foam)은 이 안에서만 생기고 문지른 자리만 지워짐
     → 문지른 이만 하얗게 밝아짐. 세균·얼룩 친구(점토 그림)는 문지르면 작아지다 '뿅'. 이 하나가 다 깨끗하면 반짝 광택 + 별
   - 구역 4곳: 위 앞니 · 아래 앞니 · 위 안쪽 이 · 아래 안쪽 이 (구역마다 85% 닦으면 반짝) — 문지른 거리로 지워짐(톡 누르기로는 안 지워짐)
   - 흐름: 치약 꾹(장면 속 치약을 누름) → 칫솔로 치카치카 → 컵을 누르면 물을 머금고 볼이 부풀었다(웃는 하마 그림 + 살짝 늘이기) '퉤!' → 웃는 하마
   - 단계: 1 앞니 위·아래 두 구역(안내) → 2 세 구역을 차례로(안내) → 3 네 구역 안내 없이 골고루(멈추면 덜 닦인 곳이 반짝). 시간 제한 없음
   - 아이가 칠한 인형 친구(정면 그림)가 옆에서 작은 칫솔로 따라 하며 응원
   공통 도우미: js/games/play/_care.js (KP.care) */
"use strict";
KP.game({
  id: "brush",
  icon: "🪥",
  name: "치카치카 양치",
  cat: "play",
  levels: 3,
  score: "🦷",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/brush/");
    KP.care.css();
    KP.css("brush", `
      .br-scene{background:#acd5f0}
      .br-face{position:absolute;left:0;top:0;z-index:1;pointer-events:none;transform-origin:50% 72%;transition:transform .35s cubic-bezier(.3,1.5,.5,1)}
      .br-face img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;transition:opacity .25s}
      .br-face .smile{opacity:0}
      .br-face.closed .smile{opacity:1}
      .br-face.puff{animation:br-puff .5s ease-in-out infinite alternate}
      @keyframes br-puff{from{transform:scale(1.06,1.01)}to{transform:scale(1.11,1.02)}}
      .br-face.pop{animation:br-pt .45s ease-out}
      @keyframes br-pt{30%{transform:scale(.95,1.05)}70%{transform:scale(1.02,.99)}}
      .br-shine{position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;pointer-events:none}
      .br-water{position:absolute;z-index:3;pointer-events:none;border-radius:50%;overflow:hidden;opacity:0;transition:opacity .3s}
      .br-water i{position:absolute;left:0;right:0;bottom:0;height:0;transition:height .8s ease;
        background:linear-gradient(rgba(190,230,255,.55),rgba(110,185,240,.6));box-shadow:inset 0 6px 8px rgba(255,255,255,.6)}
      .br-water i{border-radius:45% 45% 0 0/14% 14% 0 0}
      .br-water.on{opacity:1}
      .br-shelf{position:absolute;left:0;top:0;z-index:4;pointer-events:none;border-radius:999px;
        background:linear-gradient(#fff6e6,#f1dfc2 55%,#dcc3a0);box-shadow:0 6px 8px rgba(60,70,110,.25),inset 0 2px 0 rgba(255,255,255,.8)}
      .br-water.on i{height:62%}
      .br-obj{position:absolute;left:0;top:0;z-index:6;touch-action:manipulation;cursor:pointer;transition:transform .55s cubic-bezier(.4,0,.3,1),opacity .3s}
      .br-obj img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 6px 5px rgba(40,60,90,.28))}
      .br-obj.glow img{animation:br-glow 1.1s ease-in-out infinite alternate}
      @keyframes br-glow{from{filter:drop-shadow(0 6px 5px rgba(40,60,90,.28))}to{filter:drop-shadow(0 0 10px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .br-obj.press img{animation:br-press .35s ease-out}
      @keyframes br-press{40%{transform:scale(1.08,.8)}}
      .br-obj.off{opacity:0;pointer-events:none}
      .br-rest{pointer-events:none}
      .br-rest .paste,.kc-tool .paste{position:absolute;width:24%;height:13%;border-radius:50% 50% 45% 45%;opacity:0;transition:opacity .2s;
        background:linear-gradient(180deg,#fff 0 40%,#9fd3ff 40% 60%,#ff9fbf 60% 80%,#fff 80%);box-shadow:0 2px 2px rgba(0,0,0,.15)}
      .br-rest .paste{left:72%;top:4%;transform:rotate(42deg)}
      .br-rest.pasted .paste,.kc-tool .br-tb.pasted .paste{opacity:1}
      .kc-tool .br-tb{position:relative;width:100%;height:100%}
      .kc-tool .br-tb img{position:absolute;width:170%;height:auto;left:-89%;top:-9%;transform:none;filter:drop-shadow(0 6px 5px rgba(0,0,0,.25))}
      .kc-tool .br-tb .paste{left:30%;top:24%;transform:rotate(42deg)}
      .br-pal{position:absolute;left:0;top:0;z-index:6;pointer-events:none;transition:opacity .3s}
      .br-pal>img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 6px 5px rgba(40,60,90,.3))}
      .br-pal.hop>img{animation:br-hop .5s ease-in-out 2}
      @keyframes br-hop{50%{transform:translateY(-14%) scale(1.04)}}
      .br-pal .mini{position:absolute;left:58%;top:34%;width:46%;height:46%;transform-origin:20% 80%;transform:rotate(-20deg)}
      .br-pal .mini img{width:100%;height:100%;object-fit:contain;display:block}
      .br-pal.go .mini{animation:br-mini .22s ease-in-out infinite alternate}
      @keyframes br-mini{from{transform:rotate(-34deg) translateX(-6%)}to{transform:rotate(-8deg) translateX(6%)}}
      .br-scene .kc-zone{border:0;border-radius:22px;background:rgba(255,246,190,.16)}
      /* 구역 빛: 약한 빛(::before)·강한 빛(::after)을 따로 그려 두고 서로 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임). 테두리가 없으니 inset:0 */
      .br-scene .kc-zone::before,.br-scene .kc-zone::after{inset:0}
      .br-scene .kc-zone::before{box-shadow:0 0 0 3px rgba(255,215,70,.35),0 0 14px 4px rgba(255,235,140,.25)}
      .br-scene .kc-zone::after{box-shadow:0 0 0 6px rgba(255,215,70,.8),0 0 22px 10px rgba(255,240,160,.5)}
      .br-scene .kc-zone.on{animation:none}
      .br-scene .kc-zone.on::before{animation:br-zoneA 1.2s ease-in-out infinite alternate}
      .br-scene .kc-zone.on::after{animation:br-zone 1.2s ease-in-out infinite alternate}
      @keyframes br-zoneA{from{opacity:1}to{opacity:0}}
      @keyframes br-zone{from{opacity:0}to{opacity:1}}
      .br-star{position:absolute;left:0;top:0;z-index:7;pointer-events:none;width:var(--s);height:var(--s);margin:calc(var(--s)*-.5) 0 0 calc(var(--s)*-.5);animation:br-star 1s ease-out forwards}
      .br-star img{width:100%;height:100%;display:block}
      @keyframes br-star{0%{transform:scale(.2) rotate(-20deg);opacity:0}30%{transform:scale(1.15) rotate(8deg);opacity:1}100%{transform:translateY(-40%) scale(.8) rotate(0);opacity:0}}
      .br-load{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,255,255,.85);border-radius:999px;padding:.4em 1em;font-size:22px}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene br-scene"));
    ctx.body.appendChild(scene);
    const mk = (cls, html = "", tag = "div") => {
      const e = U.el(tag, cls, html);
      scene.appendChild(e);
      return e;
    };
    ctx.face = mk("br-face", '<img alt="" class="open" draggable="false" src="' + IMG + 'open.jpg"><img alt="" class="smile" draggable="false" src="' + IMG + 'smile.jpg">');
    ctx.shine = mk("br-shine", "", "canvas");
    ctx.water = mk("br-water", "<i></i>");
    ctx.shelf = mk("br-shelf");
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F, pass: true });
    ctx.tube = mk("br-obj br-tube", '<img alt="" draggable="false" src="' + IMG + 'paste.png">');
    ctx.tube.setAttribute("aria-label", "치약");
    ctx.rest = mk("br-obj br-rest", '<img alt="" draggable="false" src="' + IMG + 'brush.png"><i class="paste"></i>');
    ctx.cup = mk("br-obj br-cup", '<img alt="" draggable="false" src="' + IMG + 'cup.png">');
    ctx.cup.setAttribute("aria-label", "컵");
    ctx.pal = mk("br-pal", '<img alt=""><span class="mini"><img alt="" src="' + IMG + 'brush.png"></span>');
    ctx.tube.addEventListener("click", () => ctx.onTube && ctx.onTube());
    ctx.cup.addEventListener("click", () => ctx.onCup && ctx.onCup());
    ctx.zoneEls = {};
    ctx.F = { x: 0, y: 0, w: 1, h: 1 };
    // 그림(1344×752) 기준 자리. 입 틀(MOUTH) 안에서 이 사각형(시계 방향 4꼭짓점, 그림 px) — tools/out/teeth-measure.js 로 잰 값
    ctx.IW = 1344;
    ctx.IH = 752;
    ctx.MOUTH = { x: 395, y: 380, w: 550, h: 320 };
    const UP = [
      [[418, 409], [486, 417], [482, 456], [414, 448]],
      [[496, 408], [571, 410], [570, 452], [495, 450]],
      [[581, 404], [666, 404], [666, 450], [581, 450]],
      [[680, 403], [766, 403], [766, 450], [680, 450]],
      [[774, 408], [849, 406], [850, 450], [775, 451]],
      [[853, 414], [923, 406], [928, 449], [858, 457]],
    ];
    const LO = [
      [[471, 538], [518, 598], [477, 629], [431, 569]],
      [[509, 588], [582, 617], [560, 670], [488, 640]],
      [[579, 613], [663, 624], [655, 682], [572, 672]],
      [[663, 622], [746, 617], [749, 677], [666, 681]],
      [[742, 620], [819, 590], [840, 646], [763, 676]],
      [[865, 544], [904, 581], [847, 641], [808, 605]],
    ];
    const M = ctx.MOUTH;
    const norm = (q) => q.map(([x, y]) => [(x - M.x) / M.w, (y - M.y) / M.h]);
    ctx.TEETH = [];
    UP.forEach((q, i) => ctx.TEETH.push({ row: "u", i, back: i === 0 || i === 5, q: norm(q) }));
    LO.forEach((q, i) => ctx.TEETH.push({ row: "l", i, back: i === 0 || i === 5, q: norm(q) }));
    for (const t of ctx.TEETH) {
      const xs = t.q.map((p) => p[0]), ys = t.q.map((p) => p[1]);
      t.x = Math.min(...xs);
      t.y = Math.min(...ys);
      t.w = Math.max(...xs) - t.x;
      t.h = Math.max(...ys) - t.y;
      // 사각형 안 점 (u: 첫 변 방향, v: 둘째 변 방향 0~1)
      t.at = (u, v) => {
        const [a, b, c, d] = t.q;
        const tx = a[0] + (b[0] - a[0]) * u, ty = a[1] + (b[1] - a[1]) * u, bx = d[0] + (c[0] - d[0]) * u, by = d[1] + (c[1] - d[1]) * u;
        return { x: tx + (bx - tx) * v, y: ty + (by - ty) * v };
      };
    }
    const T = ctx.TEETH;
    ctx.ZONES = {
      uf: { say: "위쪽 앞니를 치카치카!", teeth: T.filter((t) => t.row === "u" && !t.back) },
      lf: { say: "아래쪽 앞니를 치카치카!", teeth: T.filter((t) => t.row === "l" && !t.back) },
      ub: { say: "위쪽 안쪽 이를 닦아요!", teeth: T.filter((t) => t.row === "u" && t.back) },
      lb: { say: "아래쪽 안쪽 이를 닦아요!", teeth: T.filter((t) => t.row === "l" && t.back) },
    };
    // 이 모양 (표면 마스크) — 틀(MOUTH) 비율의 작은 캔버스
    ctx.shape = (() => {
      const c = document.createElement("canvas");
      c.width = 300;
      c.height = Math.round((300 * M.h) / M.w);
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.strokeStyle = "#fff";
      g.lineJoin = "round";
      g.lineWidth = 3;
      for (const t of T) {
        g.beginPath();
        t.q.forEach(([x, y], i) => (i ? g.lineTo(x * c.width, y * c.height) : g.moveTo(x * c.width, y * c.height)));
        g.closePath();
        g.fill();
        g.stroke();
      }
      return c;
    })();
    // 소품 그림 (캔버스에 그릴 것)
    ctx.PIC = {};
    for (const k of ["germ", "stain", "star"]) {
      const im = new Image();
      im.src = IMG + k + ".png";
      ctx.PIC[k] = im;
    }
    ctx.token = 0;
  },

  /** 자리 잡기: 하마 그림을 화면에 맞춰 놓고(입이 잘리지 않게, 가능하면 얼굴 전체), 입 틀 F 와 소품 자리 계산 */
  layout(ctx) {
    const U = KP.u, sc = ctx.scene, W = sc.clientWidth, H = sc.clientHeight;
    if (!W || !H) return;
    const IW = ctx.IW, IH = ctx.IH, M = ctx.MOUTH;
    const tall = W / H < 1.05;
    let s = U.clamp(Math.min(W, H) * 0.19, 78, 140); // 최소 78 → 컵(0.92배)도 폰에서 72px 이상
    const m = Math.max(6, s * 0.08);
    const kv = H / IH, kw = (0.97 * W) / 545, kl = H < 500 ? (0.8 * H) / 320 : 0;
    // 세로 화면: 위에 소품 선반 자리를 남김 (얼굴은 아래에 붙임)
    const pad = tall ? Math.round(H * 0.025) : 0; // 세로 화면: 아래 어금니가 화면 끝에 걸리지 않게 조금 띄움
    let k = tall ? Math.min(kw, (H - s * 1.2 - m * 2 - pad) / IH) : Math.min(kw, Math.max(kv, kl));
    const iw = IW * k, ih = IH * k;
    let ox = W / 2 - 670 * k;
    ox = iw > W ? U.clamp(ox, W - iw, 0) : (W - iw) / 2;
    const oy = ih >= H ? U.clamp(H / 2 - 540 * k, H - ih, 0) : Math.max(0, H - ih - pad);
    ctx.view = { k, ox, oy, iw, ih, W, H };
    Object.assign(ctx.face.style, { left: ox + "px", top: oy + "px", width: iw + "px", height: ih + "px" });
    ctx.F = { x: ox + M.x * k, y: oy + M.y * k, w: M.w * k, h: M.h * k };
    const F = ctx.F;
    // 물 (입 안)
    Object.assign(ctx.water.style, { left: ox + 420 * k + "px", top: oy + 395 * k + "px", width: 500 * k + "px", height: 290 * k + "px" });
    // 구역 표시 (이 묶음마다)
    for (const key in ctx.ZONES) {
      (ctx.zoneEls[key] || []).forEach((e) => e.remove());
      const z = ctx.ZONES[key];
      const groups = z.teeth.every((t) => !t.back) ? [z.teeth] : z.teeth.map((t) => [t]);
      ctx.zoneEls[key] = groups.map((gr) => {
        const x0 = Math.min(...gr.map((t) => t.x)), x1 = Math.max(...gr.map((t) => t.x + t.w)), y0 = Math.min(...gr.map((t) => t.y)), y1 = Math.max(...gr.map((t) => t.y + t.h));
        const e = U.el("div", "kc-zone");
        const pad = 6;
        e.style.cssText = `left:${F.x + x0 * F.w - pad}px;top:${F.y + y0 * F.h - pad}px;width:${(x1 - x0) * F.w + pad * 2}px;height:${(y1 - y0) * F.h + pad * 2}px`;
        sc.appendChild(e);
        return e;
      });
    }
    if (ctx.glowZone) this.showZone(ctx, ctx.glowZone);
    // 소품: 넓은 화면은 얼굴 양옆(파란 하늘), 세로 화면은 위쪽 틈
    const put = (e, x, y, w, h) => Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    const gap = Math.max(0, oy);
    ctx.shelf.hidden = !tall;
    if (tall) {
      // 점토 선반 (얼굴 그림 윗변을 가림) 위에 친구·칫솔·치약·컵
      const sh = U.clamp(s * 0.17, 12, 24), sy = gap - sh * 0.55;
      put(ctx.shelf, -4, sy, W + 8, sh);
      if (sy > s * 2) s = Math.max(s, Math.min(130, sy * 0.62, (W - m * 5) / 4.3)); // 위 틈이 넓으면 소품도 크게
      const base = sy + 3;
      const ps = Math.min(sy - m, s * 1.5);
      put(ctx.pal, m, base - ps, ps, ps);
      put(ctx.cup, W - s * 0.92 - m, base - s, s * 0.92, s);
      put(ctx.tube, W - s * 0.92 - m - s * 1.05, base - s * 0.9, s, s);
      put(ctx.rest, W - s * 0.92 - m - s * 2.05, base - s * 0.92, s * 0.95, s * 0.95);
    } else {
      const ps = Math.min(s * 1.25, H * 0.34);
      put(ctx.pal, m, H - ps - m, ps, ps);
      put(ctx.tube, m, m, s, s);
      put(ctx.rest, m + s * 0.15, m + s * 1.05, s * 0.95, s * 0.95);
      put(ctx.cup, W - s * 0.92 - m, H - s - m, s * 0.92, s);
    }
    ctx.S.radius = 0.062;
    ctx.S.setTool('<div class="br-tb' + (ctx.pasted ? " pasted" : "") + '"><img alt="" src="' + ctx.IMG + 'brush.png"><i class="paste"></i></div>', F.w * 0.2);
    ctx.cupHome = { x: parseFloat(ctx.cup.style.left), y: parseFloat(ctx.cup.style.top) };
  },
  showZone(ctx, k) {
    ctx.glowZone = k;
    for (const z in ctx.zoneEls) ctx.zoneEls[z].forEach((e) => e.classList.toggle("on", z === k));
  },

  async start(ctx) {
    ctx.round = 0;
    const tok = ++ctx.token;
    const run = (ctx.runId = (ctx.runId || 0) + 1); // 이 화면에 들어온 한 번 (판마다 바뀌는 token 과 따로)
    const wait = KP.u.el("div", "br-load", KP.E("🪥"));
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    // 응원하는 인형 친구: 아이가 칠한 인형(정면 그림) → 없으면 기본 인형
    const dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const it = dolls.length ? KP.u.pick(dolls) : null;
    ctx.pal.firstChild.src = (it && KP.safeImg(it.thumb)) || KP.DOLL.thumbUrl(KP.u.pick(KP.DOLL.ORDER || ["bear"]));
    ctx.palPainted = !!it;
    // 그림이 다 와야 자리·모양이 맞음
    await Promise.all([...ctx.face.querySelectorAll("img"), ...Object.values(ctx.PIC)].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
    ctx.cancel(wt);
    wait.remove();
    if (tok !== ctx.token || !ctx._active) return;
    // 바탕색 = 그림 가장자리 하늘색 (그림이 화면보다 좁거나 볼이 부풀 때 이음매가 안 보이게)
    if (!ctx._bgSet)
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const g = c.getContext("2d");
        g.drawImage(ctx.face.firstChild, 8, 8, 4, 4, 0, 0, 1, 1);
        const d = g.getImageData(0, 0, 1, 1).data;
        ctx.scene.style.background = "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
        ctx._bgSet = true;
      } catch (e) {}
    if (!ctx._ro && window.ResizeObserver) (ctx._ro = new ResizeObserver(() => ctx._active && this.layout(ctx))).observe(ctx.scene);
    this.layout(ctx);
    ctx.S.run();
    // 반짝 광택 (깨끗해진 이) · 따라 하기 친구 — 매 장면
    ctx.loop((dt) => {
      if (run !== ctx.runId) return false;
      this.drawShine(ctx, dt);
      ctx.pal.classList.toggle("go", ctx.S.toolEl.classList.contains("on"));
      ctx.rest.classList.toggle("off", ctx.S.toolEl.classList.contains("on") || !ctx.restOn);
    });
    this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    ctx.runId = (ctx.runId || 0) + 1;
    ctx.onTube = ctx.onCup = null;
    if (ctx.S) {
      ctx.S.reset();
      ctx.S.dropSkin();
    }
  },

  /** 깨끗해진 이: 흰 광택 + 가끔 반짝 (작은 캔버스, 이 12개뿐이라 가벼움) */
  drawShine(ctx, dt) {
    const c = ctx.shine, sc = ctx.scene, d = Math.min(2, window.devicePixelRatio || 1), W = sc.clientWidth, H = sc.clientHeight;
    if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) {
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
    }
    const g = c.getContext("2d"), F = ctx.F;
    // 반짝이는 이가 없으면 한 번만 지우고 쉼 (저가 기기)
    const any = !ctx.face.classList.contains("closed") && ctx.TEETH.some((t) => t.shine);
    if (!any && ctx._shineClear) return;
    ctx._shineClear = !any;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, H);
    ctx._st = (ctx._st || 0) + dt;
    if (ctx.face.classList.contains("closed")) return; // 입을 다물면 이가 안 보임
    for (const t of ctx.TEETH) {
      if (!t.shine) continue;
      t.shine = Math.min(1, t.shine + dt * 2.5);
      const p = (u, v) => {
        const q = t.at(u, v);
        return [F.x + q.x * F.w, F.y + q.y * F.h];
      };
      // 윤기: 이 왼쪽에 부드러운 흰 빛
      const [hx, hy] = p(0.3, t.row === "u" ? 0.42 : 0.5), hr = Math.max(4, t.w * F.w * 0.2);
      const gr = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
      gr.addColorStop(0, "rgba(255,255,255,.95)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.globalAlpha = 0.9 * t.shine;
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(hx, hy, hr * 0.6, hr, 0, 0, 6.283);
      g.fill();
      // 반짝 (천천히 깜빡)
      const tw = 0.5 + 0.5 * Math.sin(ctx._st * 3 + t.i * 1.7 + (t.row === "u" ? 0 : 2));
      const [sx, sy] = p(0.72, 0.3), r = F.w * 0.018 * (0.6 + 0.6 * tw) * t.shine;
      g.globalAlpha = 0.9 * t.shine;
      g.fillStyle = "#fffbe0";
      g.beginPath();
      for (let k = 0; k < 8; k++) {
        const an = (k * Math.PI) / 4, rr = k % 2 ? r * 0.3 : r;
        g.lineTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr);
      }
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
  },

  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active;
    const lv = ctx.level;
    const keys = Object.keys(ctx.ZONES);
    // 1단계: 앞니 위·아래 두 구역 (한 구역만이면 너무 금방 끝남) / 2단계: 세 구역 / 3단계: 네 구역
    const list = lv === 1 ? U.shuffle(keys.filter((k) => k.endsWith("f"))) : lv === 2 ? U.sample(keys, 3) : U.shuffle(keys);
    ctx.glowZone = null;
    ctx.pasted = false;
    ctx.restOn = true;
    ctx.onTube = ctx.onCup = null;
    ctx.face.classList.remove("closed", "puff");
    ctx.water.classList.remove("on");
    ctx.cup.classList.remove("glow", "off");
    ctx.cup.style.transform = "";
    ctx.tube.classList.remove("glow", "off");
    ctx.rest.classList.remove("pasted");
    for (const t of ctx.TEETH) t.shine = 0;
    this.layout(ctx);
    S.reset();
    S.dropSkin();
    S.setSkin(ctx.shape);
    S.mode = { foam: true };
    S.need = 0.85;
    S.sound = () => A.sfx("rub");
    const F = () => ctx.F;
    const toPx = (p) => ({ x: F().x + p.x * F().w, y: F().y + p.y * F().h });

    /* ---------- 더러운 이: 누런 막 + 치석(표면) · 세균/얼룩 친구(점) ---------- */
    const dirty = [];
    for (const k of list) for (const t of ctx.ZONES[k].teeth) dirty.push(t);
    const poly = (g, t, sk) => {
      g.beginPath();
      t.q.forEach(([x, y], i) => (i ? g.lineTo(x * sk.w, y * sk.h) : g.moveTo(x * sk.w, y * sk.h)));
      g.closePath();
    };
    S.skinMud([
      {
        x: 0.5, y: 0.5, r: 2,
        paint: (g, x, y, r, sk) => {
          for (const t of dirty) {
            // 누런 막
            g.fillStyle = "rgba(205,168,78,.55)";
            poly(g, t, sk);
            g.fill();
            // 잇몸 쪽 치석 (위 이는 위쪽, 아래 이는 아래쪽)
            for (let n = 0; n < 2; n++) {
              const q = t.at(U.randf(0.2, 0.8), t.row === "u" ? U.randf(0.05, 0.3) : U.randf(0.7, 0.95));
              const px = q.x * sk.w, py = q.y * sk.h, rr = t.w * sk.w * U.randf(0.22, 0.32);
              const gr = g.createRadialGradient(px, py, 0, px, py, rr);
              gr.addColorStop(0, "rgba(150,104,40,.85)");
              gr.addColorStop(0.6, "rgba(170,125,55,.6)");
              gr.addColorStop(1, "rgba(180,140,70,0)");
              g.fillStyle = gr;
              g.beginPath();
              g.arc(px, py, rr, 0, 6.283);
              g.fill();
            }
          }
        },
      },
    ]);
    // 이 하나마다: 안 보이는 점 4개(이 전체를 문질러야 함) + 절반쯤은 세균·얼룩 친구
    const charOf = (pic) => (g, x, y, r, life, t, s) => {
      const im = ctx.PIC[pic];
      if (!im.naturalWidth) return;
      const k = 0.45 + 0.55 * life, w = r * 2 * k, h = (w * im.naturalHeight) / im.naturalWidth;
      g.globalAlpha = Math.min(1, life * 1.6);
      g.translate(x, y);
      g.rotate(Math.sin(t * 2.4 + s.seed * 9) * 0.18 + (1 - life) * Math.sin(t * 30) * 0.3);
      g.drawImage(im, -w / 2, -h / 2, w, h);
    };
    const drawGerm = charOf("germ"), drawStain = charOf("stain");
    let ci = 0;
    for (const k of list)
      for (const t of ctx.ZONES[k].teeth) {
        t.spots = [];
        const add = (o) => {
          const s = Object.assign({ zone: k }, o);
          t.spots.push(s);
          return s;
        };
        const pts = [add(Object.assign(t.at(0.3, 0.3), { need: 1.5 })), add(Object.assign(t.at(0.7, 0.3), { need: 1.5 })), add(Object.assign(t.at(0.3, 0.7), { need: 1.5 })), add(Object.assign(t.at(0.7, 0.7), { need: 1.5 }))];
        const kind = (ci++ + (lv === 3 ? 1 : 0)) % 3; // 0 세균 · 1 얼룩 · 2 없음(막만)
        if (kind < 2) {
          const c = t.at(0.5, 0.5);
          pts.push(add({ x: c.x, y: c.y, r: t.w * (kind ? 0.55 : 0.62), need: 2.2, draw: kind ? drawStain : drawGerm }));
        }
        S.add(pts);
      }
    ctx.brState = () => ({ tok, list, on: S.on, zones: Object.fromEntries(Object.keys(S.zones).map((z) => [z, +S.prog(z).toFixed(2)])), pasted: ctx.pasted, cup: !!ctx.onCup, closed: ctx.face.classList.contains("closed"), palPainted: ctx.palPainted });
    ctx.brPt = (u, v) => {
      const r = ctx.scene.getBoundingClientRect(), p = toPx({ x: u, y: v });
      return { x: r.left + p.x, y: r.top + p.y };
    };
    ctx.brTooth = (t, u, v) => t.at(u, v);

    /* ---------- 이 하나 깨끗 → 광택 + 별 ---------- */
    const starAt = (p, s) => {
      const e = U.el("div", "br-star", '<img alt="" src="' + ctx.IMG + 'star.png">');
      e.style.cssText = `--s:${s}px;left:${p.x}px;top:${p.y}px`;
      ctx.scene.appendChild(e);
      ctx.after(1100, () => e.remove());
    };
    const toothClean = (t) => {
      if (t.shine) return;
      t.shine = 0.01;
      const c = toPx(t.at(0.5, 0.5));
      starAt(c, Math.max(40, F().w * 0.09));
      A.note(U.pick(["E6", "G6", "C7"]), { inst: "bell", dur: 0.25, vol: 0.12 });
      // 남은 막도 그 이만 스르륵
      const sk = S.skin;
      if (!sk) return;
      for (let i = 1; i <= 4; i++)
        ctx.after(i * 70, () => {
          if (!live() || S.skin !== sk) return;
          const g = sk.L.dirt.g;
          g.save();
          g.globalCompositeOperation = "destination-out";
          g.globalAlpha = 0.45;
          poly(g, t, sk);
          g.fill();
          g.restore();
        });
    };
    let watch = ctx.every(120, () => {
      if (!live()) return ctx.cancel(watch);
      for (const t of dirty) if (!t.shine && t.spots.every((s) => s.life <= 0)) toothClean(t);
    });

    /* ---------- 치약 꾹 → 문지르기 ---------- */
    const rub = () => {
      S.run();
      S.on = true;
      let chika = 0;
      S.onRub = (x, y, len) => {
        chika += len;
        if (chika > 320) {
          chika = 0;
          C.pop(ctx, ctx.scene, x + U.randf(-30, 30), y - 40, "치카");
          A.sfx("bubble");
        }
      };
      const guided = lv < 3;
      let at = 0;
      const guide = () => {
        while (at < list.length && S.zones[list[at]].done) at++;
        if (at >= list.length) return;
        const k = list[at];
        this.showZone(ctx, k);
        ctx.say(ctx.ZONES[k].say + " 🪥");
        ctx.hint(() => ctx.zoneEls[k][0], ctx.ZONES[k].say);
      };
      S.onZone = (k) => {
        for (const t of ctx.ZONES[k].teeth) {
          const c = toPx(t.at(0.5, 0.5));
          S.burst(c.x, c.y, 6, "star", 0.6);
        }
        A.sfx("sparkle");
        if (ctx.glowZone === k) this.showZone(ctx, null);
        if (S.leftZones().length) {
          KP.voice.say(U.pick(["반짝반짝!", "깨끗해졌어요!", "좋아요!"]));
          if (guided) ctx.after(900, () => live() && S.on && guide());
        }
      };
      if (guided) {
        if (lv === 1) guide();
        else {
          ctx.say("하마 이에 세균이 있어요! 치카치카 닦아 줘요 🪥");
          ctx.after(2200, () => live() && S.on && guide());
        }
      } else {
        ctx.say("구석구석 다 닦아 볼까요? 🪥");
        const least = () => {
          const k = S.leastZone();
          return k ? ctx.zoneEls[k][0] : null;
        };
        ctx.hint(least, "반짝이는 곳을 닦아요!");
        // 잠깐 멈추면 덜 닦인 곳이 반짝 (한 번도 안 닦았으면 이 판 시작부터 셈)
        const t0 = Date.now();
        const iv = ctx.every(1000, () => {
          if (!live() || !S.on) return ctx.cancel(iv);
          const idle = Date.now() - Math.max(S.lastRub || 0, t0);
          if (idle > 4000 && !ctx.glowZone) {
            const k = S.leastZone();
            if (k) this.showZone(ctx, k);
          } else if (idle < 500 && ctx.glowZone && S.prog(ctx.glowZone) > 0.4) this.showZone(ctx, null);
        });
      }
      S.onAll = () => this.rinse(ctx, tok, live);
    };
    ctx.say("치약을 꾹 눌러요! 🪥");
    ctx.tube.classList.add("glow");
    ctx.hint(() => ctx.tube, "치약을 꾹 눌러요!");
    ctx.onTube = () => {
      if (!live() || ctx.pasted) return;
      ctx.onTube = null;
      ctx.hint(null);
      ctx.tube.classList.remove("glow");
      U.replay(ctx.tube, "press");
      A.tone(300, { to: 200, dur: 0.18, vol: 0.14, type: "triangle" });
      ctx.after(220, () => {
        if (!live()) return;
        ctx.pasted = true;
        ctx.rest.classList.add("pasted");
        this.layout(ctx); // 칫솔 그림에도 치약
        const r = ctx.rest.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
        C.pop(ctx, ctx.scene, r.left - hr.left + r.width * 0.75, r.top - hr.top + r.height * 0.1, "쭉");
        ctx.after(500, () => live() && rub());
      });
    };
  },

  /** 다 닦음 → 컵 누르기 → 물 머금고 볼 부풀기 → 퉤! → 웃는 하마 */
  rinse(ctx, tok, live) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    S.on = false;
    S.onRub = null;
    this.showZone(ctx, null);
    ctx.after(700, () => {
      if (!live()) return;
      ctx.restOn = false;
      ctx.cup.classList.add("glow");
      U.replay(ctx.cup, "press");
      ctx.say("이제 물로 헹궈요! 컵을 눌러요");
      ctx.hint(() => ctx.cup, "컵을 눌러요!");
      ctx.onCup = go;
    });
    const go = async () => {
      if (!live() || ctx.onCup !== go) return;
      ctx.onCup = null;
      ctx.hint(null);
      ctx.cup.classList.remove("glow");
      const F = ctx.F, mx = F.x + F.w / 2, my = F.y + F.h * 0.45;
      // 컵이 입으로 가서 기울어짐
      const cw = parseFloat(ctx.cup.style.width), ch = parseFloat(ctx.cup.style.height);
      ctx.cup.style.transform = `translate(${mx + F.w * 0.3 - ctx.cupHome.x - cw / 2}px,${F.y + F.h * 0.12 - ctx.cupHome.y - ch / 2}px) rotate(-75deg)`;
      await ctx.wait(560);
      if (!live()) return;
      A.sfx("water");
      ctx.water.classList.add("on");
      S.skinFade("foam");
      await ctx.wait(800);
      if (!live()) return;
      ctx.cup.classList.add("off");
      // 입을 다물고 볼이 부풀어 우글우글
      ctx.water.classList.remove("on");
      ctx.face.classList.add("closed", "puff");
      S.skinFade("dirt");
      S.clearSpots();
      for (let i = 0; i < 5; i++)
        ctx.after(i * 250, () => {
          A.sfx("bubble");
          if (i % 2 === 0) C.pop(ctx, ctx.scene, mx + U.randf(-F.w * 0.25, F.w * 0.25), my - F.h * 0.2, "가글");
        });
      await ctx.wait(1500);
      if (!live()) return;
      // 퉤!
      ctx.face.classList.remove("closed", "puff");
      U.replay(ctx.face, "pop");
      C.pop(ctx, ctx.scene, mx, F.y + F.h * 0.25, "퉤!", true);
      A.sfx("whoosh");
      S.burst(mx, my, 40, "drop", 1.2);
      for (const t of ctx.TEETH) if (!t.shine) t.shine = 0.01;
      await ctx.wait(800);
      if (!live()) return;
      // 웃는 하마
      ctx.face.classList.add("closed");
      U.replay(ctx.face, "pop");
      A.sfx("sparkle");
      const pr = ctx.pal.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
      U.replay(ctx.pal, "hop");
      KP.pfx.hearts(ctx.scene, pr.left - hr.left + pr.width / 2, pr.top - hr.top + pr.height * 0.2, 4, ctx);
      S.burst(mx, F.y - F.h * 0.4, 26, "star", 1);
      await ctx.wait(800);
      if (!live()) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const msg = big ? "이제 진짜로 치카치카 해 볼까?" : U.pick(["반짝반짝 깨끗한 이!", "치카치카 최고!", "{부름} 치카치카 박사!"]);
      // 말은 자연 음성이 있는 문장으로 (화면 글자는 그대로)
      const say = { "반짝반짝 깨끗한 이!": "반짝반짝! 깨끗해졌어요!", "치카치카 최고!": "최고예요!", "{부름} 치카치카 박사!": "{부름} 참 잘했어요!" }[msg] || msg;
      ctx.noStar(); // 닦기만 하면 끝나는 판(틀릴 수 없음) → 열쇠 별 없음
      const ok = await ctx.win({ big, msg, say });
      if (ok && live()) this.next(ctx);
    };
  },
});

;

/* ==== js/games/play/bubble.js ==== */
/* 비눗방울 팡팡 — 무지갯빛 비눗방울이 둥실둥실. 콕 누르거나 손가락으로 쓸면 팡!
   - 어떤 방울 안에는 작은 동물이 갇혀 있다 → 터뜨리면 기뻐하며 떨어져 나와 이름을 말함
   - 10개마다 축하 / 단계: 방울 수·속도 */
"use strict";
KP.game({
  id: "bubble",
  icon: "🫧",
  name: "비눗방울 팡팡",
  cat: "play",
  levels: 3,
  score: "🫧",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("bubble", `
      .bb-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;touch-action:none;
        background:radial-gradient(120% 80% at 50% 0%,#e9fbff 0%,rgba(233,251,255,0) 60%),linear-gradient(180deg,#9fe3ff 0%,#c9f0ff 55%,#fff3d6 100%);box-shadow:var(--shadow)}
      .bb-ray{position:absolute;top:-10%;width:18%;height:120%;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0));transform:rotate(18deg);transform-origin:top;pointer-events:none;animation:bb-ray 7s ease-in-out infinite alternate}
      @keyframes bb-ray{to{opacity:.35;transform:rotate(12deg)}}
      .bb-grass{position:absolute;left:-5%;right:-5%;bottom:-24px;height:70px;border-radius:50% 50% 0 0;background:linear-gradient(#8ddc7a,#55b955);pointer-events:none}
      .bb-flower{position:absolute;bottom:14px;font-size:clamp(26px,4vw,40px);pointer-events:none}
      .bb{position:absolute;left:0;top:0;width:var(--d);height:var(--d);border-radius:50%;pointer-events:none;z-index:2}
      .bb.hintGlow{position:absolute}
      .bb-in{position:absolute;inset:0;border-radius:50%;animation:bb-wob 2.4s ease-in-out infinite;
        background:radial-gradient(circle at 50% 50%,rgba(255,255,255,0) 55%,rgba(255,255,255,.22) 66%,rgba(255,255,255,.7) 71%,rgba(255,255,255,0) 72%)}
      .bb-in::before{content:"";position:absolute;inset:0;border-radius:50%;
        background:conic-gradient(from var(--h,0deg),#ff9ad5,#ffe38a,#9dffb0,#8fd8ff,#c39bff,#ff9ad5);opacity:.55;
        -webkit-mask:radial-gradient(circle,transparent 60%,#000 68%,#000 70%,transparent 71%);mask:radial-gradient(circle,transparent 60%,#000 68%,#000 70%,transparent 71%);
        animation:bb-spin 5s linear infinite}
      .bb-in::after{content:"";position:absolute;left:18%;top:14%;width:26%;height:16%;border-radius:50%;background:rgba(255,255,255,.9);transform:rotate(-35deg);
        box-shadow:calc(var(--d)*.42) calc(var(--d)*.46) 0 -2px rgba(255,255,255,.45)}
      @keyframes bb-wob{25%{transform:scale(1.04,.96)}50%{transform:scale(.97,1.03)}75%{transform:scale(1.02,.98)}}
      @keyframes bb-spin{to{transform:rotate(360deg)}}
      .bb-pet{position:absolute;inset:22%;font-size:calc(var(--d)*.5);line-height:1;display:flex;align-items:center;justify-content:center;animation:bb-pet 3s ease-in-out infinite;opacity:.95}
      @keyframes bb-pet{50%{transform:rotate(12deg) scale(.95)}}
      .bb-pop{position:absolute;width:var(--d);height:var(--d);margin:calc(var(--d)/-2) 0 0 calc(var(--d)/-2);border-radius:50%;pointer-events:none;z-index:3;
        border:3px dashed rgba(255,255,255,.95);animation:bb-pop .32s ease-out forwards}
      @keyframes bb-pop{to{transform:scale(1.35);opacity:0}}
      .bb-drop{position:absolute;width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,rgba(160,220,255,.7));pointer-events:none;z-index:3;
        animation:bb-drop .55s ease-out forwards}
      @keyframes bb-drop{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
      .bb-free{position:absolute;font-size:clamp(70px,11vw,110px);line-height:1;z-index:5;pointer-events:none;margin:-.5em 0 0 -.5em}
      .bb-free b{position:absolute;left:50%;bottom:105%;transform:translateX(-50%);font-size:.28em;font-weight:400;white-space:nowrap;background:#fff;color:var(--ink);
        padding:2px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.1);animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .bb-heart{position:absolute;font-size:clamp(22px,3vw,30px);pointer-events:none;z-index:5;animation:bb-heart 1.1s ease-out forwards}
      @keyframes bb-heart{to{transform:translate(var(--dx),-90px) scale(1.3);opacity:0}}
    `);
    const field = U.el("div", "bb-field");
    field.innerHTML =
      '<div class="bb-ray" style="left:12%"></div><div class="bb-ray" style="left:46%;animation-delay:-3s"></div><div class="bb-ray" style="left:78%;animation-delay:-5s"></div>' +
      '<div class="bb-grass"></div>' +
      '<div class="bb-flower" style="left:6%">' + KP.E("🌷") + '</div><div class="bb-flower" style="left:30%">' + KP.E("🌼") + "</div>" +
      '<div class="bb-flower" style="right:24%">' + KP.E("🌸") + '</div><div class="bb-flower" style="right:5%">' + KP.E("🌷") + "</div>";
    field.dataset.tap = "1";
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.PETS = [
      ["🐥", "병아리"], ["🐰", "토끼"], ["🐱", "고양이"], ["🐶", "강아지"], ["🐸", "개구리"], ["🐠", "물고기"], ["🐞", "무당벌레"],
      ["🦋", "나비"], ["🐹", "햄스터"], ["🐧", "펭귄"], ["🐢", "거북이"], ["🐝", "꿀벌"], ["🐙", "문어"], ["🐼", "판다"],
    ];

    ctx.make = (y) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const pet = Math.random() < 0.28 ? U.pick(ctx.PETS) : null;
      const base = U.clamp(Math.min(W, H) * 0.2, 80, 150);
      const d = Math.max(72, Math.round(base * (pet ? U.randf(1.05, 1.25) : U.randf(0.8, 1.15)))); // 폰 가로 3단계도 72px 이상
      const el = U.el("div", "bb");
      el.style.setProperty("--d", d + "px");
      el.innerHTML = '<div class="bb-in" style="--h:' + U.rand(360) + 'deg;animation-delay:-' + Math.random() * 2 + 's"></div>' + (pet ? '<div class="bb-pet">' + KP.E(pet[0]) + "</div>" : "");
      field.appendChild(el);
      const sp = [32, 46, 62][lv - 1] * U.randf(0.8, 1.25) * (H / 650 + 0.4);
      const b = { el, d, pet, x0: U.randf(d / 2, W - d / 2), y: y == null ? H + d * 0.2 : y, sp, ph: Math.random() * 6.28, amp: U.randf(14, 40), fq: U.randf(0.4, 0.9), x: 0, dead: false };
      ctx.bubbles.push(b);
      return b;
    };

    const NOTES = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6"];
    ctx.popB = (b) => {
      if (b.dead) return;
      b.dead = true;
      b.el.remove();
      const cx = b.x,
        cy = b.y + b.d / 2;
      // 소리: 뽁 + 맑은 음 (연속으로 터뜨리면 음계가 올라감)
      A.tone(U.randf(500, 800), { to: U.randf(1300, 1800), dur: 0.09, vol: 0.22 });
      A.note(NOTES[ctx.combo % NOTES.length], { inst: "bell", dur: 0.4, vol: 0.12, when: 0.02 });
      ctx.combo++;
      ctx.comboT = 0.9;
      const ring = U.el("div", "bb-pop");
      ring.style.cssText = "left:" + cx + "px;top:" + cy + "px;--d:" + b.d + "px";
      field.appendChild(ring);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.28,
          r = b.d * U.randf(0.45, 0.75);
        const dr = U.el("div", "bb-drop");
        dr.style.cssText = "left:" + cx + "px;top:" + cy + "px;--s:" + U.randf(6, 13) + "px;--dx:" + Math.cos(a) * r + "px;--dy:" + Math.sin(a) * r + "px";
        field.appendChild(dr);
        ctx.after(600, () => dr.remove());
      }
      ctx.after(350, () => ring.remove());
      if (b.pet) ctx.free(b.pet, cx, cy);
      ctx.count++;
      ctx.score.add();
      if (ctx.count % 10 === 0) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.after(b.pet ? 1200 : 300, () => (ctx.noStar(), ctx.win({ big, msg: big ? "{부름} 비눗방울 대장!" : ctx.count + "개 팡팡!", say: big ? "" : ctx.count <= 100 ? KP.u.numSino(ctx.count) + "! 비눗방울 팡팡!" : "비눗방울 팡팡!" })));
      }
    };

    // 갇혀 있던 동물이 기뻐하며 떨어져 나옴 → 땅에 통통 → 사라짐
    ctx.free = ([em, name], x, y) => {
      const H = field.clientHeight;
      const f = U.el("div", "bb-free", KP.E(em) + "<b>" + name + "!</b>");
      f.style.left = x + "px";
      f.style.top = y + "px";
      field.appendChild(f);
      for (let i = 0; i < 3; i++) {
        const h = U.el("div", "bb-heart", KP.E("💖"));
        h.style.cssText = "left:" + (x - 10) + "px;top:" + (y - 30) + "px;--dx:" + (i - 1) * 40 + "px;animation-delay:" + i * 0.12 + "s";
        field.appendChild(h);
        ctx.after(1500, () => h.remove());
      }
      KP.voice.say(U.pick(["와, 고마워! ", "나왔다! ", "야호! "]) + "나는 " + name + "!");
      A.sfx("levelup");
      ctx.freed.push({ el: f, x, y, y0: y, vy: -320, floor: H - 50, t: 0, bounces: 0 });
    };

    // 손가락으로 쓸어도 터지게 — 판 전체에서 위치로 판정
    const hitAt = (e) => {
      const r = field.getBoundingClientRect();
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      let hit = false;
      for (const b of ctx.bubbles) {
        if (b.dead) continue;
        if (U.dist(x, y, b.x, b.y + b.d / 2) < b.d / 2 + 14) {
          ctx.popB(b);
          hit = true;
        }
      }
      return hit;
    };
    let down = false;
    ctx.fast(field, (e) => {
      down = true;
      try {
        field.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (!hitAt(e)) A.sfx("rub");
    });
    field.addEventListener("pointermove", (e) => {
      if (!down && !(e.pointerType === "mouse" && e.buttons)) return;
      hitAt(e);
    });
    const up = () => (down = false);
    field.addEventListener("pointerup", up);
    field.addEventListener("pointercancel", up);

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = field.clientWidth;
      const lv = ctx.level;
      const maxN = [6, 8, 11][lv - 1];
      ctx.comboT -= dt;
      if (ctx.comboT < 0) ctx.combo = 0;
      const alive = ctx.bubbles.filter((b) => !b.dead);
      ctx.spawnT -= dt;
      if (ctx.spawnT <= 0 && alive.length < maxN) {
        ctx.spawnT = [0.9, 0.7, 0.5][lv - 1] * U.randf(0.6, 1.4);
        ctx.make();
      }
      for (const b of alive) {
        b.y -= b.sp * dt;
        b.x = U.clamp(b.x0 + Math.sin(t * b.fq + b.ph) * b.amp, b.d / 2, W - b.d / 2);
        b.el.style.translate = b.x - b.d / 2 + "px " + b.y + "px"; // left/top 대신 (다시 칠하지 않고 옮기기만)
        if (b.y < -b.d - 10) {
          b.dead = true;
          b.el.remove();
        }
      }
      ctx.bubbles = ctx.bubbles.filter((b) => !b.dead);
      // 풀려난 동물: 통통 튀다가 사라짐
      ctx.freed = ctx.freed.filter((f) => {
        f.t += dt;
        f.vy += 1100 * dt;
        f.y += f.vy * dt;
        if (f.y > f.floor) {
          f.y = f.floor;
          f.bounces++;
          f.vy = f.bounces < 3 ? -380 / f.bounces : 0;
          if (f.bounces <= 2) A.note(f.bounces === 1 ? "G4" : "C5", { inst: "marimba", dur: 0.2, vol: 0.12 });
        }
        f.el.style.translate = "0 " + (f.y - f.y0) + "px";
        f.el.style.rotate = Math.sin(f.t * 10) * 8 + "deg";
        if (f.t > 2.2) f.el.style.opacity = Math.max(0, 1 - (f.t - 2.2) * 2);
        if (f.t > 2.8) {
          f.el.remove();
          return false;
        }
        return true;
      });
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".bb,.bb-free,.bb-pop,.bb-drop,.bb-heart").forEach((e) => e.remove());
    ctx.bubbles = [];
    ctx.freed = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.combo = 0;
    ctx.comboT = 0;
    ctx.spawnT = 0.3;
    ctx.say("비눗방울을 콕! 손가락으로 쓱쓱 쓸어도 터져요 🫧");
    requestAnimationFrame(() => {
      const H = ctx.field.clientHeight;
      [0.25, 0.5, 0.75].forEach((p) => ctx.make(H * p));
      ctx.bubbles[1].pet = ctx.bubbles[1].pet || ["🐥", "병아리"];
      if (!ctx.bubbles[1].el.querySelector(".bb-pet")) ctx.bubbles[1].el.insertAdjacentHTML("beforeend", '<div class="bb-pet">' + KP.E("🐥") + "</div>");
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    ctx.hint(() => {
      const H = ctx.field.clientHeight;
      const a = ctx.bubbles.filter((b) => !b.dead && b.y > 20 && b.y < H - b.d).sort((p, q) => (q.pet ? 1 : 0) - (p.pet ? 1 : 0) || q.y - p.y);
      return a[0] && a[0].el;
    }, "비눗방울을 콕 눌러 봐요!");
  },
});

;

/* ==== js/games/play/candle.js ==== */
/* 생일 촛불 끄기 — 오늘의 주인공 동물 친구 생일! 케이크 위 촛불을 콕 눌러 후~
   - 일렁이는 불꽃, 끄면 바람 소리 + 연기 모락모락
   - 다 끄면 생일 축하 노래 + "○○야 생일 축하해!"
   1단계: 촛불 3개 (아무거나) / 2단계: 4개 + '숫자 촛불' — 촛불마다 1~4 숫자(자리는 섞임), 1부터 차례로 후~
   3단계: 5개 숫자 촛불 + 장난꾸러기 촛불 2개가 한 번씩 다시 켜짐(다시 켜진 건 아무 때나 후~)
   - 차례가 아닌 촛불은 흔들흔들 + "다음은 둘!"(가벼운 틀림, 1번은 봐줌) → 2·3단계는 열쇠 별 대상
   - 촛불은 한 개당 76px 간격 이상(유아 손가락) — 넓은 화면은 케이크를 옆으로 길게, 좁은 폰은 2층(아래층 앞줄·위층 뒷줄)에 엇갈려 꽂음
   - 노래는 2판에 한 번 전곡, 나머지는 앞 두 소절만(판 사이 기다림 줄이기) */
"use strict";
KP.game({
  id: "candle",
  icon: "🎂",
  name: "생일 촛불 끄기",
  cat: "play",
  levels: 3,
  score: "🎂",
  setup(ctx) {
    const U = KP.u;
    KP.css("candle", `
      .cd-room{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:radial-gradient(circle at 50% 40%,#fff6e8,#ffe2ec 70%,#f7cde0);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;transition:filter .8s}
      .cd-room.dark{filter:brightness(.82) saturate(.9)}
      .cd-flags{position:absolute;left:0;right:0;top:0;height:clamp(40px,8vh,64px);display:flex;justify-content:space-around;pointer-events:none}
      .cd-flags::before{content:"";position:absolute;left:-5%;right:-5%;top:6px;height:30px;border-bottom:3px solid #c98ab0;border-radius:0 0 50% 50%}
      .cd-flags i{width:clamp(22px,3.4vw,38px);height:clamp(28px,4.4vw,48px);clip-path:polygon(0 0,100% 0,50% 100%);margin-top:clamp(10px,2vh,18px);background:var(--c)}
      .cd-banner{position:absolute;top:clamp(46px,9vh,74px);left:14px;font-size:clamp(22px,3.6vw,36px);color:#fff;background:#ff6fb5;padding:4px 22px;border-radius:999px;
        box-shadow:0 5px 0 #d0377f;white-space:nowrap;z-index:2}
      .cd-wrap{position:relative;width:var(--cw,var(--ck));margin-bottom:clamp(10px,3vh,30px)}
      .cd-hero{position:absolute;left:50%;bottom:calc(var(--ck)*.8);width:calc(var(--ck)*.5);height:calc(var(--ck)*.5);margin-left:calc(var(--ck)*-.25);font-size:calc(var(--ck)*.5);line-height:1;z-index:0}
      .cd-hero .e{width:100%;height:100%;display:block}
      .cd-hero.happy{animation:cd-happy .5s ease-in-out infinite alternate}
      @keyframes cd-happy{from{transform:rotate(-5deg) translateY(0)}to{transform:rotate(5deg) translateY(-8px)}}
      .cd-hat{position:absolute;left:58%;top:-26%;width:30%;height:40%;transform:rotate(18deg);z-index:1;
        background:repeating-linear-gradient(135deg,#ffd84a 0 10px,#ff6fb5 10px 20px);clip-path:polygon(50% 0,100% 100%,0 100%)}
      .cd-hat::after{content:"";position:absolute}
      .cd-pom{position:absolute;left:calc(58% + 15% - 9%);top:-34%;width:18%;height:18%;border-radius:50%;background:#fff;box-shadow:0 0 0 3px #ffd84a;transform:rotate(18deg);z-index:2}
      .cd-cake{position:relative;z-index:1;width:100%;height:calc(var(--ck)*.62)}
      .cd-plate{position:absolute;left:-6%;right:-6%;bottom:-4%;height:16%;border-radius:50%;background:linear-gradient(#fff,#dfe3ef);box-shadow:0 6px 0 rgba(0,0,0,.08)}
      .cd-t1{position:absolute;left:4%;right:4%;bottom:4%;height:46%;border-radius:18px;background:linear-gradient(90deg,#f39ac0,#ffc3dc 40%,#f39ac0)}
      .cd-t2{position:absolute;left:12%;right:12%;bottom:47%;height:34%;border-radius:16px;background:linear-gradient(90deg,#fff1d6,#fffaf0 40%,#f6e2bd)}
      .cd-drip{position:absolute;left:0;right:0;top:0;height:42%;border-radius:16px 16px 0 0;
        background:radial-gradient(circle at 10% 100%,var(--f) 0 9%,transparent 9.5%) 0 0/20% 100% repeat-x,linear-gradient(var(--f),var(--f)) 0 0/100% 62% no-repeat}
      .cd-t1 .cd-drip{--f:#fff}
      .cd-t2 .cd-drip{--f:#ff8ac0}
      .cd-dots{position:absolute;left:6%;right:6%;bottom:14%;height:30%;background:radial-gradient(circle,#ff5b6e 0 3px,transparent 4px) 0 0/24px 20px,radial-gradient(circle,#3aa0ff 0 3px,transparent 4px) 12px 10px/24px 20px}
      .cd-berry{position:absolute;bottom:72%;font-size:calc(var(--ck)*.09);line-height:1;z-index:3}
      .cd-candles{position:absolute;inset:0;z-index:2;pointer-events:none}
      .cd-c{position:absolute;bottom:78%;height:calc(var(--ck)*.42);min-width:64px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;pointer-events:auto;z-index:2}
      .cd-c.front{bottom:50%;height:calc(var(--ck)*.3);z-index:3}
      .cd-c::before{content:"";position:absolute;left:0;right:0;top:-12px;bottom:0}
      .cd-c.hintGlow{border-radius:20px}
      .cd-stick{width:calc(var(--ck)*.055);height:48%;border-radius:5px 5px 2px 2px;background:repeating-linear-gradient(160deg,var(--c1) 0 7px,#fff 7px 12px);box-shadow:inset -3px 0 0 rgba(0,0,0,.08)}
      .cd-wick{width:3px;height:6%;background:#4a3a2a;border-radius:2px}
      .cd-fl{position:absolute;left:50%;bottom:52%;width:calc(var(--ck)*.06);height:34%;margin-left:calc(var(--ck)*-.03);transform-origin:50% 100%;transition:transform .35s,opacity .35s}
      .cd-glow{position:absolute;left:50%;top:50%;width:260%;height:220%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,220,120,.6),rgba(255,200,80,0) 65%);animation:cd-glow 1.2s ease-in-out infinite alternate}
      .cd-flame{position:absolute;inset:0;border-radius:50% 50% 50% 50%/62% 62% 38% 38%;background:radial-gradient(ellipse at 50% 72%,#fff 0 18%,#fff2a0 30%,#ffb020 60%,#ff6a2e 85%);
        animation:cd-flick .18s ease-in-out infinite alternate;transform-origin:50% 100%}
      @keyframes cd-flick{from{transform:scale(1,1) skewX(-3deg)}to{transform:scale(.92,1.08) skewX(4deg)}}
      @keyframes cd-glow{to{opacity:.6;transform:translate(-50%,-50%) scale(.9)}}
      .cd-c.out .cd-fl{transform:scale(.1,0);opacity:0}
      .cd-c.blow .cd-fl{transform:skewX(-35deg) scale(.7,.8)}
      .cd-smoke{position:absolute;left:50%;bottom:58%;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:rgba(150,150,165,.55);pointer-events:none;filter:blur(2px);
        animation:cd-smoke 1.6s ease-out forwards;animation-delay:var(--dl)}
      @keyframes cd-smoke{0%{transform:translate(0,0) scale(.4);opacity:.8}50%{transform:translate(var(--dx),-50px) scale(1.2)}100%{transform:translate(calc(var(--dx)*-1),-110px) scale(1.8);opacity:0}}
      .cd-num{position:absolute;left:50%;bottom:6%;width:clamp(30px,calc(var(--ck)*.11),44px);height:clamp(30px,calc(var(--ck)*.11),44px);margin-left:calc(clamp(30px,calc(var(--ck)*.11),44px)*-.5);
        border-radius:50%;background:#fff;color:#c2185b;box-shadow:0 0 0 3px var(--c1),0 3px 0 rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;
        font-size:clamp(20px,calc(var(--ck)*.08),30px);line-height:1;pointer-events:none;z-index:4}
      .cd-c.out .cd-num{opacity:.45}
      .cd-c.nope{animation:cd-nope .4s}
      @keyframes cd-nope{25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
      .cd-hoo{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);font-size:clamp(20px,3vw,30px);color:#4a7ab8;text-shadow:0 0 6px #fff,0 0 3px #fff;white-space:nowrap;pointer-events:none;z-index:5;animation:cd-hoo .8s ease-out forwards}
      @keyframes cd-hoo{from{opacity:0;transform:translate(10%,10px)}30%{opacity:1}to{opacity:0;transform:translate(-90%,-10px)}}
      .cd-note{position:absolute;font-size:clamp(26px,4vw,42px);pointer-events:none;animation:cd-note 2s ease-out forwards;z-index:4}
      @keyframes cd-note{to{transform:translate(var(--dx),-160px) rotate(20deg);opacity:0}}
    `);
    const room = U.el("div", "cd-room");
    const COLS = ["#ff5b6e", "#ffc531", "#3fd17a", "#33b7ff", "#8a63ee", "#ff7ac6"];
    room.innerHTML = '<div class="cd-flags">' + Array.from({ length: 12 }, (_, i) => '<i style="--c:' + COLS[i % COLS.length] + '"></i>').join("") + '</div><div class="cd-banner"></div>';
    const wrap = U.el("div", "cd-wrap");
    wrap.innerHTML =
      '<div class="cd-hero"><span class="hero"></span><div class="cd-hat"></div><div class="cd-pom"></div></div>' +
      '<div class="cd-cake"><div class="cd-plate"></div><div class="cd-t1"><div class="cd-drip"></div><div class="cd-dots"></div></div>' +
      '<div class="cd-t2"><div class="cd-drip"></div></div>' +
      '<div class="cd-berry" style="left:22%">' + KP.E("🍓") + '</div><div class="cd-berry" style="right:22%">' + KP.E("🍓") + "</div>" +
      '<div class="cd-candles"></div></div>';
    room.appendChild(wrap);
    ctx.body.appendChild(room);
    Object.assign(ctx, { room, wrap, hero: U.$(".cd-hero", wrap), heroImg: U.$(".hero", wrap), candlesEl: U.$(".cd-candles", wrap), banner: U.$(".cd-banner", room) });
    ctx.HEROES = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰돌이"], ["🐼", "판다"], ["🦁", "사자"], ["🐯", "호랑이"],
      ["🐨", "코알라"], ["🐷", "돼지"], ["🐵", "원숭이"], ["🦊", "여우"], ["🐸", "개구리"], ["🦄", "유니콘"],
    ];
    ctx.CCOL = ["#ff5b6e", "#3aa0ff", "#3fd17a", "#ffb020", "#8a63ee"];
    ctx.size = () => {
      const W = room.clientWidth,
        H = room.clientHeight;
      const ck = Math.round(U.clamp(Math.min(W * 0.8, (H - 130) / 1.36), 200, 460));
      // 촛불 간격(가운데~가운데) SP 이상 — 한 줄에 다 안 들어가면 케이크를 옆으로 늘리고, 그래도 안 되면 2층에 나눠 꽂기
      const n = ctx.nC || 3,
        SP = 76,
        maxW = W * 0.94;
      let rows = 1,
        cw = Math.max(ck, (n * SP) / 0.72);
      if (cw > maxW) {
        rows = 2;
        cw = Math.max(ck, ((n - 1) * SP) / 2 / 0.76); // 엇갈려 꽂으면 옆 촛불(다른 줄)과 SP/2, 같은 줄끼리 SP
      }
      cw = Math.round(Math.min(Math.max(cw, ck), Math.max(maxW, ck)));
      wrap.style.setProperty("--ck", ck + "px");
      wrap.style.setProperty("--cw", cw + "px");
      // 자리 잡기: 1줄 = 위층(14~86%)에 고르게
      //   2줄 = 12~88% 에 고르게 놓고 앞줄(아래층)·뒷줄(위층)을 엇갈리게 — 5개: 앞 0·2·4 / 뒤 1·3, 4개: 앞 0·3 / 뒤 1·2
      //   (앞뒤가 겹쳐 서지 않게. 뒷줄 촛불은 앞줄 위로 솟은 윗부분을 누름)
      const cs = Array.from(ctx.candlesEl.children),
        m = cs.length;
      cs.forEach((c, i) => {
        let x, w, front;
        if (rows === 1) {
          front = false;
          x = 14 + ((i + 0.5) * 72) / m;
          w = (cw * 0.72) / m;
        } else {
          front = m === 4 ? i === 0 || i === 3 : i % 2 === 0;
          const step = 76 / Math.max(1, m - 1);
          x = m === 4 ? [12, 35, 65, 88][i] : 12 + i * step; // 4개: 뒷줄 둘 사이를 조금 더 벌림
          w = (cw * step * 2) / 100;
        }
        w = Math.round(Math.min(w, Math.max(ck * 0.34, 80)));
        c.classList.toggle("front", front);
        c.style.left = x + "%";
        c.style.width = w + "px";
        c.style.marginLeft = -w / 2 + "px";
      });
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastHero = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 5][lv - 1];
    const hero = U.pick(ctx.HEROES.filter((h) => h !== ctx.lastHero));
    ctx.lastHero = hero;
    ctx.heroImg.innerHTML = KP.E(hero[0]);
    ctx.hero.classList.remove("happy");
    ctx.room.classList.remove("dark");
    ctx.banner.textContent = hero[1] + " 생일";
    ctx.candlesEl.innerHTML = "";
    ctx.nC = n;
    // 3단계: 장난꾸러기 촛불 2개 (끄면 한 번씩 다시 켜짐)
    const trick = new Set(lv === 3 ? U.sample(Array.from({ length: n }, (_, i) => i), 2) : []);
    let left = n,
      busy = false;
    // 2·3단계 숫자 촛불: 자리마다 섞인 1..n, 차례(next)대로 끄기
    const numbered = lv >= 2;
    const nums = numbered ? U.shuffle(Array.from({ length: n }, (_, i) => i + 1)) : [];
    let next = 1;
    const relit = new Set(); // 다시 켜진 장난꾸러기 촛불 (아무 때나 끄기)
    const ORDER_TXT = "1부터 차례로 후~ 불어 줘요!"; // 새 문장 new-voice/candle.txt — 녹음 전에는 기기 목소리
    if (numbered) ctx.say("오늘은 " + hero[1] + " 생일! 숫자 " + ORDER_TXT + " 🎂", "오늘은 " + hero[1] + " 생일! " + ORDER_TXT);
    else ctx.say("오늘은 " + hero[1] + " 생일! 촛불을 콕 눌러서 후~ 불어 줘요 🎂");
    const candles = Array.from({ length: n }, (_, i) => {
      const c = U.el("div", "cd-c");
      c.style.setProperty("--c1", ctx.CCOL[i % ctx.CCOL.length]);
      c.dataset.tap = "1";
      c.innerHTML = '<div class="cd-fl"><div class="cd-glow"></div><div class="cd-flame"></div></div><div class="cd-wick"></div><div class="cd-stick"></div>' + (numbered ? '<div class="cd-num">' + nums[i] + "</div>" : "");
      ctx.candlesEl.appendChild(c);
      ctx.fast(c, () => blow(c, i));
      return c;
    });
    ctx.size();
    const blow = (c, i) => {
      // 'blow'(끄는 중 0.22초)도 막음 — 빠른 두 번 톡이 left 를 두 번 줄여(1단계: 켜진 촛불이 남은 채 노래) / 숫자 판에선 가짜 '다음은 둘!' 틀림이 됐음
      if (busy || c.classList.contains("out") || c.classList.contains("blow")) return;
      if (numbered && !relit.has(i) && nums[i] !== next) {
        // 차례가 아닌 숫자: 흔들흔들 (가벼운 틀림)
        U.replay(c, "nope");
        A.note("C4", { inst: "soft", dur: 0.2, vol: 0.12 });
        ctx.miss(null, "다음은 " + U.NAT[next] + "!", { soft: true });
        return;
      }
      if (numbered && !relit.has(i)) {
        next++;
        KP.voice.say(U.NAT[nums[i]] + "!"); // 하나! 둘! (같이 세기)
      }
      relit.delete(i);
      c.classList.add("blow");
      // 후~ 바람 소리
      A.noise({ dur: 0.55, vol: 0.2, bp: 700, bpTo: 1500, q: 0.7, attack: 0.05 });
      const h = U.el("div", "cd-hoo", "후~");
      c.appendChild(h);
      ctx.after(800, () => h.remove());
      ctx.after(220, () => {
        c.classList.remove("blow");
        c.classList.add("out");
        A.note(A.SCALE[7 - left] || "C5", { inst: "bell", dur: 0.4, vol: 0.14 });
        for (let s = 0; s < 3; s++) {
          const sm = U.el("div", "cd-smoke");
          sm.style.cssText = "--dl:" + s * 0.18 + "s;--dx:" + U.randf(-14, 14) + "px";
          c.appendChild(sm);
          ctx.after(2000, () => sm.remove());
        }
      });
      left--;
      // 장난꾸러기 촛불: 한 번 다시 켜지기
      if (trick.has(i)) {
        trick.delete(i);
        ctx.after(1400, () => {
          if (!ctx._active || busy) return;
          c.classList.remove("out");
          relit.add(i);
          left++;
          A.sfx("boing");
          KP.voice.say("어? 다시 켜졌네! 한 번 더 후~");
          U.replay(c, "jump");
          hint();
        });
      }
      if (left === 0) ctx.after(1500, () => left === 0 && party());
      else hint();
    };
    // 숫자 촛불은 차례인 촛불(정답)을 가리킴 → 가리킨 판은 열쇠 별 없음(answer)
    const hint = () =>
      numbered
        ? ctx.hint(() => candles.find((c, k) => !c.classList.contains("out") && (relit.has(k) || nums[k] === next)), "다음은 " + U.NAT[Math.min(next, n)] + "!", { answer: true })
        : ctx.hint(() => candles.find((c) => !c.classList.contains("out")), "촛불을 콕 눌러서 후~ 불어요!");
    hint();
    const party = async () => {
      if (busy) return;
      busy = true;
      ctx.hint(null);
      ctx.room.classList.add("dark");
      ctx.hero.classList.add("happy");
      KP.voice.say("다 껐다! 다 같이 노래해요!");
      await ctx.wait(1500);
      // 2판에 한 번은 전곡, 나머지는 앞 두 소절만 (판 사이 기다림 줄이기)
      const song = A.SONGS.birthday.notes;
      const len = A.melody(ctx.round % 2 === 1 ? song : song.slice(0, 12), /* 첫 판은 짧게(열 때마다 9초 전곡 대기였음), 2·4번째 판에 전곡 */ { beat: 0.36, inst: "bell", vol: 0.22 }) || 1;
      // 음표가 둥실둥실
      const notes = ["🎵", "🎶", "🎈", "🎉"];
      for (let k = 0; k < 10; k++)
        ctx.after(k * len * 100, () => {
          const e = U.el("div", "cd-note", KP.E(U.pick(notes)));
          e.style.cssText = "left:" + U.randf(10, 85) + "%;top:" + U.randf(45, 75) + "%;--dx:" + U.randf(-40, 40) + "px";
          ctx.room.appendChild(e);
          ctx.after(2100, () => e.remove());
        });
      await ctx.wait(len * 1000 + 300);
      ctx.room.classList.remove("dark");
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      if (!numbered) ctx.noStar(); // 1단계: 누르기만 하면 꺼지는 촛불(틀릴 수 없음) → 열쇠 별 없음 (2·3단계는 숫자 차례)
      const ok = await ctx.win({ big, msg: U.josa(hero[1], "아/야") + " 생일 축하해!", say: "생일 축하해!" });
      if (ok) this.next(ctx);
    };
  },
});

;

/* ==== js/games/play/colorpop.js ==== */
/* 같은 색 풍선 — 말해 준 색깔 풍선만 팡! (풍선 터뜨리기와 같은 그림체)
   - 다른 색을 누르면 풍선이 통통 튕기며 "이건 ○○색이에요" (벌 없음)
   - 5개 터뜨리면 축하 후 색깔 바꾸기
   1단계: 2가지 색, 느리게 / 2단계: 3가지 색 / 3단계: 5가지 색, 빠르게 */
"use strict";
KP.game({
  id: "colorpop",
  icon: "🎯",
  name: "같은 색 풍선",
  cat: "play",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("colorpop", `
      .cp-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;touch-action:none;
        background:linear-gradient(180deg,#ffe7f3 0%,#e9f3ff 60%,#f4fff0 100%);box-shadow:var(--shadow)}
      .cp-field::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(255,255,255,.8) 0 6%,transparent 7%),radial-gradient(circle at 80% 60%,rgba(255,255,255,.6) 0 4%,transparent 5%);pointer-events:none}
      .cp-grass{position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(#9be08a,#62c25c);border-radius:50% 50% 0 0/20px 20px 0 0}
      .cp-sign{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;display:flex;align-items:center;gap:10px;background:#fff;border-radius:999px;
        padding:6px 16px 6px 8px;box-shadow:0 5px 0 rgba(47,58,102,.12);pointer-events:none}
      .cp-sign>*{flex-shrink:0;white-space:nowrap}
      .cp-mini{width:clamp(34px,4.6vw,46px);height:clamp(40px,5.5vw,55px);border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 8%,var(--c) 45%,var(--d) 100%)}
      .cp-name{font-size:clamp(22px,3.4vw,32px);color:var(--d)}
      .cp-dots{display:flex;gap:6px}
      .cp-dot{width:clamp(14px,2vw,20px);height:clamp(14px,2vw,20px);border-radius:50%;background:#e7eaf4;transition:transform .2s}
      .cp-dot.on{background:var(--c);transform:scale(1.25);box-shadow:0 0 0 3px #fff,0 0 0 5px var(--c)}
      .cp-b{position:absolute;left:0;top:0;width:var(--w);height:calc(var(--w)*1.2);cursor:pointer;z-index:2;will-change:translate,rotate}
      .cp-b.hintGlow{position:absolute;border-radius:50%}
      .cp-body{position:absolute;inset:0;border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 7%,var(--c) 45%,var(--d) 100%);
        box-shadow:inset -7px -10px 16px rgba(0,0,0,.16),0 8px 16px rgba(30,60,120,.15);transform-origin:50% 100%}
      .cp-body::before{content:"";position:absolute;left:17%;top:11%;width:21%;height:30%;border-radius:50%;background:rgba(255,255,255,.72);transform:rotate(26deg);filter:blur(1px)}
      .cp-body::after{content:"";position:absolute;left:41%;top:12%;width:7%;height:7%;border-radius:50%;background:rgba(255,255,255,.75)}
      .cp-knot{position:absolute;left:50%;bottom:-6%;width:16%;height:9%;margin-left:-8%;background:var(--d);clip-path:polygon(50% 0,92% 100%,8% 100%)}
      .cp-str{position:absolute;left:50%;top:102%;width:30px;margin-left:-15px;height:calc(var(--w)*.9);pointer-events:none;transform-origin:50% 0;animation:cp-sway 1.6s ease-in-out infinite alternate}
      .cp-str path{fill:none;stroke:rgba(80,90,130,.5);stroke-width:2;stroke-linecap:round}
      @keyframes cp-sway{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
      .cp-boing .cp-body{animation:cp-boing .55s}
      @keyframes cp-boing{20%{transform:scale(1.18,.78)}45%{transform:scale(.86,1.16)}65%{transform:scale(1.06,.94)}}
      .cp-tag{position:absolute;left:50%;bottom:105%;transform:translateX(-50%);white-space:nowrap;background:#fff;color:var(--d);font-size:clamp(18px,2.6vw,24px);
        padding:3px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.1);pointer-events:none;animation:cp-tag 1.4s forwards}
      @keyframes cp-tag{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}25%{transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0}}
      .cp-shard{position:absolute;width:var(--s);height:var(--s);background:var(--c);clip-path:polygon(50% 0,100% 70%,20% 100%);pointer-events:none;z-index:4;
        animation:cp-shard .7s cubic-bezier(.2,.7,.4,1) forwards}
      @keyframes cp-shard{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
      .cp-pang{position:absolute;font-size:clamp(28px,4.4vw,46px);color:#fff;-webkit-text-stroke:2px var(--d);paint-order:stroke;text-shadow:0 3px 0 var(--d);pointer-events:none;z-index:5;
        animation:cp-pang .7s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes cp-pang{0%{transform:translate(-50%,-50%) scale(.3)}40%{transform:translate(-50%,-80%) scale(1.15)}100%{transform:translate(-50%,-120%) scale(1);opacity:0}}
    `);
    // [이름(꾸밈), 이름(색), 색, 밝은색, 어두운색]
    ctx.COLORS = [
      ["빨간", "빨간색", "#ff4256", "#ffb3ba", "#c41a35"],
      ["노란", "노란색", "#ffd21f", "#fff3b0", "#c99a00"],
      ["초록", "초록색", "#33c76a", "#b9f5cd", "#178a40"],
      ["파란", "파란색", "#2f8cff", "#bfe0ff", "#1559c4"],
      ["보라", "보라색", "#9a5cff", "#ddd0ff", "#6230cf"],
      ["분홍", "분홍색", "#ff70b8", "#ffd0e7", "#d0377f"],
      ["주황", "주황색", "#ff8a1f", "#ffd6a3", "#c45e00"],
    ];
    const field = U.el("div", "cp-field");
    field.innerHTML = '<div class="cp-grass"></div>';
    const sign = U.el("div", "cp-sign", '<div class="cp-mini"></div><div class="cp-name"></div><div class="cp-dots"></div>');
    field.appendChild(sign);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.sign = sign;
    const dots = U.$(".cp-dots", sign);
    for (let i = 0; i < 5; i++) dots.appendChild(U.el("i", "cp-dot"));

    const PENTA = ["C6", "A5", "G5", "E5", "D5", "C5", "A4", "G4"];
    let lastTalk = 0;

    ctx.setTarget = (c) => {
      ctx.target = c;
      sign.style.cssText = "--c:" + c[2] + ";--l:" + c[3] + ";--d:" + c[4];
      U.$(".cp-name", sign).textContent = c[0] + " 풍선";
      U.$$(".cp-dot", sign).forEach((d) => d.classList.remove("on"));
      U.replay(sign, "pop");
    };

    ctx.make = (c) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const w = Math.round(U.clamp(Math.min(W, H) * 0.2, 80, 136) * U.randf(0.92, 1.12));
      const el = U.el("div", "cp-b");
      el.dataset.tap = "1";
      el.style.cssText = "--w:" + w + "px;--c:" + c[2] + ";--l:" + c[3] + ";--d:" + c[4];
      el.innerHTML = '<div class="cp-body"></div><div class="cp-knot"></div><svg class="cp-str" viewBox="0 0 30 100" preserveAspectRatio="none"><path d="M15 0 C 4 20, 26 40, 15 60 S 6 85, 15 100"/></svg>';
      const speed = [45, 62, 85][lv - 1] * U.randf(0.85, 1.2) * (H / 650 + 0.4);
      // 겹치지 않게 x 자리 고르기
      let x0 = U.randf(w * 0.6, W - w * 0.6);
      for (let k = 0; k < 6; k++) {
        if (ctx.balloons.every((o) => o.dead || o.y < H - o.h * 1.6 || Math.abs(o.x0 - x0) > w)) break;
        x0 = U.randf(w * 0.6, W - w * 0.6);
      }
      const b = { el, w, h: w * 1.2, c, x0, y: H + 10, speed, ph: Math.random() * 6.28, amp: U.randf(8, 20), fq: U.randf(0.6, 1.2), x: x0, dead: false, push: 0 };
      ctx.fast(el, (e) => {
        e.stopPropagation();
        ctx.touch(b);
      });
      field.appendChild(el);
      ctx.balloons.push(b);
      return b;
    };

    ctx.burst = (b, cx, cy) => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 6.28 + Math.random() * 0.4,
          d = b.w * U.randf(0.6, 1.1);
        const s = U.el("div", "cp-shard");
        s.style.cssText = "left:" + cx + "px;top:" + cy + "px;--s:" + Math.round(b.w * U.randf(0.12, 0.2)) + "px;--c:" + b.c[2] +
          ";--dx:" + Math.cos(a) * d + "px;--dy:" + (Math.sin(a) * d + 30) + "px;--r:" + U.rand(540) + "deg";
        field.appendChild(s);
        ctx.after(750, () => s.remove());
      }
      const t = U.el("div", "cp-pang", "팡!");
      t.style.cssText = "left:" + cx + "px;top:" + cy + "px;--d:" + b.c[4];
      field.appendChild(t);
      ctx.after(800, () => t.remove());
    };

    ctx.touch = async (b) => {
      if (b.dead || ctx.busy) return;
      if (b.c === ctx.target) {
        b.dead = true;
        b.el.remove();
        const k = U.clamp((b.w - 70) / 80, 0, 1);
        A.tone(1400 - k * 700, { to: 420, dur: 0.12, vol: 0.3 });
        A.noise({ dur: 0.08, vol: 0.18, hp: 2200 });
        A.note(PENTA[ctx.got % PENTA.length], { inst: "marimba", dur: 0.35, vol: 0.18, when: 0.03 });
        ctx.burst(b, b.x, b.y + b.h / 2);
        ctx.got++;
        const d = U.$$(".cp-dot", ctx.sign)[ctx.got - 1];
        if (d) d.classList.add("on");
        KP.voice.say(U.NAT[ctx.got] + "!");
        ctx.score.add();
        if (ctx.got >= 5) {
          ctx.busy = true;
          ctx.round++;
          const big = ctx.round % 4 === 0;
          const ok = await ctx.win({ big, msg: big ? "{부름} 색깔 박사!" : ctx.target[0] + " 풍선 다섯 개!" });
          if (ok) this.nextColor(ctx);
        } else this.hint(ctx);
      } else {
        // 다른 색 — 통통 튕기기
        U.replay(b.el, "cp-boing");
        b.push = 260;
        // 가벼운 틀림(soft): 단계엔 안 들어가고, 한 판(5개)에 2번 이상이면 열쇠 별 없음 — 아무 색이나 마구 눌러도 별이 나오던 것 막기
        ctx.miss(null, null, { soft: true });
        const tag = U.el("div", "cp-tag", b.c[1]);
        b.el.appendChild(tag);
        ctx.after(1400, () => tag.remove());
        const now = Date.now();
        if (now - lastTalk > 1800) {
          lastTalk = now;
          KP.voice.say("이건 " + b.c[1] + "이에요. " + ctx.target[0] + " 풍선을 찾아요!");
        }
      }
    };

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const maxN = [5, 7, 8][lv - 1];
      const alive = ctx.balloons.filter((b) => !b.dead);
      ctx.spawnT -= dt;
      if (ctx.spawnT <= 0 && alive.length < maxN) {
        ctx.spawnT = [1.2, 0.95, 0.75][lv - 1] * U.randf(0.7, 1.3);
        const visibleTargets = alive.filter((b) => b.c === ctx.target && b.y > 30).length;
        const useTarget = visibleTargets === 0 || Math.random() < [0.42, 0.48, 0.55][lv - 1]; // 3단계는 풍선이 빨라 목표색을 조금 더 자주
        ctx.make(useTarget ? ctx.target : U.pick(ctx.pool.filter((c) => c !== ctx.target)));
      }
      for (const b of alive) {
        b.push *= Math.pow(0.04, dt);
        b.y -= (b.speed + b.push) * dt;
        b.x = U.clamp(b.x0 + Math.sin(t * b.fq + b.ph) * b.amp, b.w / 2, W - b.w / 2);
        b.el.style.translate = b.x - b.w / 2 + "px " + b.y + "px"; // left/top 대신 (다시 칠하지 않고 옮기기만)
        b.el.style.rotate = Math.sin(t * b.fq * 1.3 + b.ph) * 6 + "deg";
        if (b.y < -b.h * 2.2) {
          b.dead = true;
          b.el.remove();
        }
      }
      ctx.balloons = ctx.balloons.filter((b) => !b.dead);
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".cp-b,.cp-shard,.cp-pang").forEach((e) => e.remove());
    ctx.balloons = [];
    ctx.round = 0;
    ctx.prev = null;
    this.nextColor(ctx);
    requestAnimationFrame(() => {
      const H = ctx.field.clientHeight;
      [0.4, 0.7].forEach((p, i) => {
        const b = ctx.make(i === 0 ? ctx.target : U2(ctx));
        b.y = H * p;
      });
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    function U2(ctx) {
      return KP.u.pick(ctx.pool.filter((c) => c !== ctx.target));
    }
  },
  nextColor(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const n = [2, 3, 5][lv - 1];
    const choices = ctx.COLORS.filter((c) => c !== ctx.prev);
    const target = U.pick(choices);
    ctx.prev = target;
    ctx.pool = [target, ...U.sample(ctx.COLORS.filter((c) => c !== target), n - 1)];
    ctx.got = 0;
    ctx.busy = false;
    ctx.setTarget(target);
    ctx.spawnT = 0.3;
    ctx.say(target[0] + " 풍선만 콕! 터뜨려요!");
    this.hint(ctx);
  },
  hint(ctx) {
    ctx.hint(() => {
      const H = ctx.field.clientHeight;
      const t = ctx.balloons.filter((b) => !b.dead && b.c === ctx.target && b.y > 40 && b.y < H - b.h).sort((a, b) => b.y - a.y);
      return t[0] && t[0].el;
    }, ctx.target[0] + " 풍선을 찾아서 콕 눌러요!", { answer: true }); // 정답 풍선을 가리킴 → 가리킨 판은 열쇠 별 없음
  },
});

;

/* ==== js/games/play/croc.js ==== */
/* 악어 이빨 — 입을 쩍 벌린 악어의 이빨을 하나씩 콕! 쏙 들어가요.
   숨어 있는 아픈 이빨을 누르면 '앙!' 입이 닫히는 깜짝 놀이 (실패 아님, 웃음 + 다음 판)
   - 누를 때마다 악어가 움찔·눈 깜빡 + 숫자 세기, 입이 조금씩 내려와 두근두근
   - 몇몇 이빨에는 보물(별·사탕·보석)이 숨어 있음
   - 안 아픈 이빨을 누르면 악어가 아픈 이빨 쪽을 힐끔 봄(1단계는 그 이빨이 덜덜) → 피해서 다 누르면 '이빨 청소 성공' 축하
   - 앙! 당한 판은 짧게 웃고 바로 다음 판, 2판마다 한 번 축하(운이라 단계·열쇠 별 없음)
   1단계: 이빨 5개 / 2단계: 7개 / 3단계: 9개 (작은 화면은 이빨이 64px 이상 되도록 개수를 줄임) */
"use strict";
KP.game({
  id: "croc",
  icon: "🐊",
  name: "악어 이빨",
  cat: "play",
  levels: 3,
  score: "🦷",
  setup(ctx) {
    const U = KP.u;
    KP.css("croc", `
      .cr-stage{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#c6f0ff 0%,#e3f8ff 40%,#8fd6a0 40%,#6cc48a 60%,#4fb3d9 60%,#3b9ccc 100%);display:flex;align-items:center;justify-content:center}
      .cr-stage.cr-shake{animation:cr-shake .45s}
      @keyframes cr-shake{20%{transform:translate(-10px,4px)}40%{transform:translate(9px,-4px)}60%{transform:translate(-6px,2px)}80%{transform:translate(4px,0)}}
      .cr-reed{position:absolute;bottom:38%;font-size:clamp(34px,5vw,56px);pointer-events:none}
      .cr-pad{position:absolute;width:clamp(50px,7vw,80px);height:clamp(20px,3vw,32px);border-radius:50%;background:#3fae5c;box-shadow:inset 0 -4px 0 rgba(0,0,0,.12);pointer-events:none}
      .cr-wave{position:absolute;left:0;right:0;bottom:0;height:40%;overflow:hidden;pointer-events:none}
      /* 물결 줄무늬는 120px(무늬 2칸) 더 넓은 한 장(::before)에 그려 두고 옆으로 밀기만 함 (무늬를 매번 다시 칠하면 저가 태블릿이 버벅임) */
      .cr-wave::before{content:"";position:absolute;left:-120px;right:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 30px,transparent 30px 60px);animation:cr-wave 6s linear infinite}
      @keyframes cr-wave{to{transform:translateX(120px)}}
      .cr-croc{position:relative;width:var(--cwx,var(--cw));height:var(--ch,calc(var(--cw)*1.02));z-index:1}
      .cr-croc.cr-flinch{animation:cr-flinch .32s ease-out}
      @keyframes cr-flinch{30%{transform:rotate(-2deg) scale(1.025)}65%{transform:rotate(1.4deg)}}
      .cr-croc.blink .cr-lid{height:62%}
      /* 아래턱: 세로로 긴 화면에서는 입이 깊어짐(--ch) → 이빨이 더 크게 들어감 */
      .cr-lower{position:absolute;left:0;right:0;top:calc(var(--cw)*.47);bottom:0;border-radius:12% 12% 50% 50%/10% 10% 60% 60%;z-index:1;
        background:radial-gradient(circle at 30% 80%,rgba(255,255,255,.12) 0 8%,transparent 9%),linear-gradient(#4fc46a,#2f9a4c);box-shadow:inset 0 -10px 0 rgba(0,0,0,.12),0 8px 0 rgba(0,0,0,.1)}
      .cr-mouth{position:absolute;left:5%;right:5%;top:0;bottom:12%;border-radius:0 0 50% 50%/0 0 70% 70%;background:radial-gradient(ellipse at 50% 20%,#ff9db3,#e9567a 70%,#c93a62);box-shadow:inset 0 10px 18px rgba(120,0,40,.35)}
      /* 앙!(bite): 내려온 위턱 머리 둥근 모서리 옆으로 분홍 입 안의 네모난 윗모서리가 삐져나와 보였음
         (세로로 깊은 입(--ch, 태블릿 세로)에서는 위턱이 입을 다 못 덮어 입 안·이빨이 통째로 위로 드러났음)
         → 닫힌 동안 아래턱 윗변을 위턱 머리 바로 아래까지 내리고, 입 안 윗부분은 잘라 숨기고, 아래 이빨은 입 속이라 숨김 */
      .cr-lower{transition:top .45s ease-out}
      .cr-croc.bite .cr-lower{top:max(calc(var(--cw)*.47),calc(var(--ch,calc(var(--cw)*1.02)) - var(--cw)*.5));transition:top .14s cubic-bezier(.7,0,1,.6)}
      .cr-croc.bite .cr-mouth{clip-path:inset(calc(var(--cw)*.15) 0 0 0)}
      .cr-croc.bite .cr-teeth{opacity:0;transition:opacity .1s}
      .cr-tongue{position:absolute;left:30%;right:30%;top:30%;bottom:16%;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 30%,#ffc1cf,#ff7d9b);box-shadow:inset 0 -6px 0 rgba(0,0,0,.08)}
      .cr-tongue::after{content:"";position:absolute;left:49%;top:12%;bottom:30%;width:3px;background:rgba(160,30,70,.35);border-radius:2px}
      /* --close(0~1, 누를수록 커짐)만큼 위턱이 내려옴 — 최대 0.4배로 제한(끝자리 이빨이 위턱에 가려지지 않게). 앙!(bite)은 따로 끝까지
         위턱은 그림일 뿐이라 터치를 통과시킴(pointer-events:none) → 끝자리 이빨 윗부분이 살짝 겹쳐도 그대로 눌림 */
      .cr-upper{position:absolute;left:2%;right:2%;top:0;height:calc(var(--cw)*.55);z-index:2;pointer-events:none;transition:transform .5s cubic-bezier(.3,1.3,.5,1);
        transform:translateY(calc(var(--close,0)*var(--cw)*.036))}
      .cr-croc.bite .cr-upper{transform:translateY(calc(var(--ch,calc(var(--cw)*1.02)) - var(--cw)*.58));transition:transform .14s cubic-bezier(.7,0,1,.6)}
      .cr-head{position:absolute;left:0;right:0;top:14%;bottom:30%;border-radius:46% 46% 18% 18%/60% 60% 20% 20%;background:linear-gradient(#5bd277,#36a854);box-shadow:inset 0 -8px 0 rgba(0,0,0,.1)}
      .cr-head::before{content:"";position:absolute;left:12%;right:12%;top:18%;height:40%;background:radial-gradient(circle,rgba(0,0,0,.12) 0 6%,transparent 7%) 0 0/34px 28px;border-radius:50%}
      .cr-nose{position:absolute;top:30%;width:calc(var(--cw)*.067);height:9%;border-radius:50%;background:#1f6b35}
      .cr-nose.l{left:calc(50% - var(--cw)*.1)}.cr-nose.r{right:calc(50% - var(--cw)*.1)}
      /* 눈·코는 --cw 기준 크기 (가로로 넓힌 악어(--cwx)에서도 동그랗게) */
      .cr-eye{position:absolute;top:0;width:calc(var(--cw)*.25);height:44%;border-radius:50% 50% 40% 40%;background:#4bc66a;box-shadow:inset 0 -6px 0 rgba(0,0,0,.1)}
      .cr-eye.l{left:6%}.cr-eye.r{right:6%}
      .cr-ball{position:absolute;left:16%;right:16%;top:16%;bottom:14%;border-radius:50%;background:#fff;overflow:hidden;transition:transform .15s}
      .cr-pupil{position:absolute;left:30%;top:24%;width:44%;height:56%;border-radius:50%;background:#2a2a3a;transition:transform .3s}
      .cr-pupil::after{content:"";position:absolute;left:18%;top:14%;width:32%;height:32%;border-radius:50%;background:#fff}
      .cr-lid{position:absolute;left:0;right:0;top:0;height:0;background:#3fb85e;transition:height .15s;border-bottom:3px solid #2a7d40}
      .cr-croc.bite .cr-lid,.cr-croc.laugh .cr-lid{height:62%}
      .cr-croc.laugh{animation:cr-laugh .25s ease-in-out 6 alternate}
      @keyframes cr-laugh{to{transform:rotate(3deg) translateY(-6px)}}
      .cr-palate{position:absolute;left:8%;right:8%;bottom:0;height:34%;border-radius:0 0 30% 30%/0 0 50% 50%;background:linear-gradient(#e9567a,#ff8fab);overflow:visible}
      .cr-up-teeth{position:absolute;left:6%;right:6%;bottom:-14%;height:30%;background:#fff;filter:drop-shadow(0 2px 0 rgba(0,0,0,.1))}
      .cr-t{position:absolute;width:var(--tw);height:var(--tw);margin:calc(var(--tw)/-2) 0 0 calc(var(--tw)/-2);z-index:2;display:flex;align-items:flex-start;justify-content:center;cursor:pointer}
      .cr-t.hintGlow{position:absolute;border-radius:50%}
      .cr-tv{width:62%;height:78%;margin-top:6%;border-radius:50% 50% 22% 22%/72% 72% 28% 28%;background:linear-gradient(90deg,#fff,#fdfdf7 55%,#e8e6d6);box-shadow:0 3px 0 #d8d4bf,inset 0 -4px 0 rgba(0,0,0,.05);transition:transform .2s cubic-bezier(.3,1.5,.5,1),filter .2s}
      .cr-t.down .cr-tv{transform:translateY(42%) scale(.86);filter:brightness(.82)}
      .cr-t:active .cr-tv{transform:translateY(12%)}
      .cr-t.sore .cr-tv{animation:cr-sore .12s linear 8 alternate}
      .cr-t.sore.lite .cr-tv{animation-iteration-count:4}
      @keyframes cr-sore{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
      .cr-t.last .cr-tv{box-shadow:0 0 0 4px #ffe066,0 3px 0 #d8d4bf;animation:cr-sore .18s linear infinite alternate}
      .cr-gem{position:absolute;width:var(--gs);height:var(--gs);margin:calc(var(--gs)/-2) 0 0 calc(var(--gs)/-2);font-size:var(--gs);line-height:1;pointer-events:none;z-index:7;animation:cr-gem 1.2s cubic-bezier(.2,1.4,.4,1) forwards}
      @keyframes cr-gem{0%{transform:translateY(20%) scale(.2);opacity:0}25%{transform:translateY(-70%) scale(1.15);opacity:1}70%{transform:translateY(-90%) scale(1);opacity:1}100%{transform:translateY(-150%) scale(.7);opacity:0}}
      .cr-big{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:clamp(70px,13vw,140px);color:#fff;-webkit-text-stroke:6px #2f9a4c;paint-order:stroke;text-shadow:0 7px 0 #1f6b35;z-index:6;pointer-events:none;white-space:nowrap;opacity:0}
      .cr-big.show{animation:cr-big 1.1s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes cr-big{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-10deg)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.15) rotate(4deg)}75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
      .cr-pop{position:absolute;font-size:clamp(18px,2.6vw,26px);color:#fff;-webkit-text-stroke:3px #e9567a;paint-order:stroke;pointer-events:none;z-index:5;animation:cr-pop .6s ease-out forwards;transform:translate(-50%,-50%)}
      @keyframes cr-pop{to{transform:translate(-50%,-160%);opacity:0}}
      .cr-ha{position:absolute;font-size:clamp(26px,4vw,40px);color:#ff7452;-webkit-text-stroke:2px #fff;paint-order:stroke;pointer-events:none;z-index:6;animation:cr-ha 1.4s ease-out forwards}
      @keyframes cr-ha{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-80px) rotate(var(--r))}}
    `);
    const stage = U.el("div", "cr-stage");
    stage.innerHTML =
      '<div class="cr-wave"></div>' +
      '<div class="cr-reed" style="left:3%">' + KP.E("🌿") + '</div><div class="cr-reed" style="right:4%">' + KP.E("🌿") + "</div>" +
      '<div class="cr-pad" style="left:8%;bottom:14%"></div><div class="cr-pad" style="right:10%;bottom:22%"></div><div class="cr-pad" style="right:22%;bottom:6%"></div>';
    const croc = U.el("div", "cr-croc");
    const eye = (s) => '<div class="cr-eye ' + s + '"><div class="cr-ball"><div class="cr-pupil"></div><div class="cr-lid"></div></div></div>';
    // 윗니 지그재그
    let zz = "0 0,100% 0";
    const N = 12;
    for (let i = N; i >= 0; i--) zz += "," + (i * 100) / N + "% " + (i % 2 ? "100%" : "0");
    croc.innerHTML =
      '<div class="cr-lower"><div class="cr-mouth"><div class="cr-tongue"></div></div><div class="cr-teeth"></div></div>' +
      '<div class="cr-upper"><div class="cr-palate"><div class="cr-up-teeth" style="clip-path:polygon(' + zz + ')"></div></div>' +
      '<div class="cr-head"><div class="cr-nose l"></div><div class="cr-nose r"></div></div>' + eye("l") + eye("r") + "</div>" +
      '<div class="cr-big"></div>';
    stage.appendChild(croc);
    ctx.body.appendChild(stage);
    Object.assign(ctx, { stage, croc, teethEl: U.$(".cr-teeth", croc), mouth: U.$(".cr-mouth", croc), bigEl: U.$(".cr-big", croc), pupils: U.$$(".cr-pupil", croc) });
    ctx.size = () => {
      const W = stage.clientWidth,
        H = stage.clientHeight;
      const cw = Math.round(U.clamp(Math.min(W * 0.96, (H - 20) / 1.04, 640), 240, 640));
      // 세로로 긴 화면(폰 세로): 아래턱을 길게 늘여 입을 깊게 (이빨이 들어갈 자리가 커짐)
      const ch = Math.round(U.clamp(H - 24, cw * 1.02, cw * 1.45));
      // 가로로 넓은 화면(폰 가로 등): 이빨이 다 안 들어가면 악어를 옆으로 넓힘 (ctx.wx 배, next 에서 정함)
      const cwx = Math.round(Math.min(W * 0.94, cw * (ctx.wx || 1)));
      croc.style.setProperty("--cw", cw + "px");
      croc.style.setProperty("--ch", ch + "px");
      croc.style.setProperty("--cwx", Math.max(cw, cwx) + "px");
      ctx.cw = cw;
      ctx.ch = ch;
      ctx.cwx = Math.max(cw, cwx);
    };
    /* 이빨 자리: 아래턱 입 모양(U자) 위에 '같은 간격'으로 (예전엔 같은 각도라 아래쪽 이빨이 촘촘·작았음)
       반환 {tw, pts:[{x,y,rot}]} — tw 는 이빨 칸 크기(= 가장 가까운 이빨 사이 거리, 터치 영역) */
    ctx.teethLayout = (n) => {
      const cw = ctx.cw,
        cwx = ctx.cwx || cw;
      const mw = cwx * 0.9,
        mh = (ctx.ch - cw * 0.47) * 0.88;
      const cap = Math.max(cw * 0.17, 72);
      const build = (tw) => {
        const rx = mw / 2 - tw * 0.42,
          ry = mh - tw * 0.68;
        const a0 = Math.PI * 0.02,
          a1 = Math.PI * 0.98,
          M = 240;
        const acc = [0];
        let px = rx * Math.cos(a0),
          py = ry * Math.sin(a0);
        for (let j = 1; j <= M; j++) {
          const th = a0 + ((a1 - a0) * j) / M,
            x = rx * Math.cos(th),
            y = ry * Math.sin(th);
          acc.push(acc[j - 1] + Math.hypot(x - px, y - py));
          px = x;
          py = y;
        }
        const pts = [];
        for (let i = 0; i < n; i++) {
          const sL = (acc[M] * (i + 0.5)) / n;
          let j = 1;
          while (j < M && acc[j] < sL) j++;
          const f = (sL - acc[j - 1]) / (acc[j] - acc[j - 1] || 1);
          const th = a0 + ((a1 - a0) * (j - 1 + f)) / M;
          pts.push({ x: cwx / 2 + rx * Math.cos(th), y: tw * 0.32 + ry * Math.sin(th), rot: (th * 180) / Math.PI - 90 });
        }
        let d = 1e9;
        for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) d = Math.min(d, Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y));
        return { pts, d };
      };
      let tw = cap,
        r = build(tw);
      for (let it = 0; it < 30; it++) {
        const nt = Math.min(cap, r.d);
        if (Math.abs(nt - tw) < 0.4) break;
        tw = (tw + nt) / 2;
        r = build(tw);
      }
      return { tw: Math.floor(Math.min(tw, r.d)), pts: r.pts };
    };
    /* 이빨 n개가 64px 이상 되도록 악어 가로 넓힘(ctx.wx)을 정함 — next 와 화면 회전(resize) 공용 */
    ctx.fitWide = (n) => {
      ctx.wx = 1;
      ctx.size();
      // 폰(짧은 변 430 이하)은 가능하면 72px 까지 넓힘 (개수를 줄이는 기준은 그대로 64px)
      const want = Math.min(innerWidth, innerHeight) <= 430 ? 72 : 64;
      for (let wx = 1.15; wx <= 1.81 && ctx.teethLayout(n).tw < want; wx += 0.15) {
        ctx.wx = wx;
        ctx.size();
      }
    };
    addEventListener("resize", () => {
      if (ctx._active) {
        // 판 도중 화면을 돌려도 이빨 칸이 64px 아래로 줄지 않게 넓힘을 다시 계산
        if (ctx.teethN) {
          ctx.fitWide(ctx.teethN);
          // 넓혀도 64px 가 안 되면(예: 폰 세로 8개 → 가로) 이번 판을 새 화면에 맞는 개수로 다시 차림
          if (ctx.teethLayout(ctx.teethN).tw < 64 && ctx.reround && ctx.reround()) return;
        } else ctx.size();
        ctx.placeTeeth && ctx.placeTeeth();
      }
    });
  },
  start(ctx) {
    ctx.round = 0; // 끝난 판 수
    ctx.clean = 0; // 아픈 이빨을 피해 다 누른 판 수
    ctx.luck = 0; // 마지막 축하 뒤 '앙!' 당한 판 수 (2판마다 축하)
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const croc = ctx.croc;
    croc.classList.remove("bite", "laugh", "blink");
    croc.style.setProperty("--close", 0);
    // 앙! 당한 판은 win 없이 다음 판으로 넘어가므로, 열쇠 별 표시(힌트 봄·별 없음)를 판마다 새로
    ctx._hinted = false;
    ctx._resetFew();
    // 이빨 수: 단계별 5·7·9 — 터치 칸이 64px 이상 안 되면 ① 악어를 옆으로 넓히고 ② 그래도 모자라면 개수를 줄임
    let n = [5, 7, 9][lv - 1];
    ctx.teethN = 0;
    ctx.fitWide(n);
    while (n > 4 && ctx.teethLayout(n).tw < 64) n--;
    ctx.teethN = n;
    ctx.teethEl.innerHTML = "";
    const sore = U.rand(n);
    // 보물 이빨 (아픈 이빨 말고): 1·2단계 2개, 3단계 1개
    const gems = new Map();
    const GEMS = [["⭐", "별 찾았다!"], ["🍬", "사탕 찾았다!"], ["💎", "보석 찾았다!"]];
    U.sample(U.shuffle([...Array(n).keys()].filter((k) => k !== sore)), lv === 3 ? 1 : 2).forEach((k) => gems.set(k, U.pick(GEMS)));
    // 힐끔 보기(추리 힌트): 단계가 오를수록 짧게·가끔
    // 1단계: 늘 힐끔 + 아픈 이빨 덜덜 / 2단계: 절반쯤 눈만 힐끔(덜덜 없음) / 3단계: 가끔·짧게 눈만
    // (예전 2단계는 누를 때마다 85% 덜덜 → 아픈 이빨이 거의 늘 보여 4화면 모두 첫 판에 성공)
    const GLANCE = { ms: [1300, 700, 450][lv - 1], p: [1, 0.5, 0.35][lv - 1] };
    let busy = false,
      pressed = 0;
    if (ctx.round === 0) ctx.say("악어 이빨을 하나씩 콕! 아픈 이빨을 누르면… 앙! 🐊");
    else ctx.say("이빨을 하나씩 콕 눌러 봐요! 🐊");
    const teeth = [];
    for (let i = 0; i < n; i++) {
      const t = U.el("div", "cr-t", '<div class="cr-tv"></div>');
      t.dataset.tap = "1";
      ctx.teethEl.appendChild(t);
      teeth.push(t);
      // 이빨 칸이 살짝 겹칠 수 있어, 누른 자리에서 가장 가까운 이빨로
      ctx.fast(t, (e) => {
        let best = i,
          bd = 1e9;
        teeth.forEach((q, k) => {
          const r = q.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
          if (d < bd) {
            bd = d;
            best = k;
          }
        });
        press(teeth[best], best);
      });
    }
    ctx.placeTeeth = () => {
      const L = ctx.teethLayout(n);
      ctx.teethEl.style.setProperty("--tw", L.tw + "px");
      teeth.forEach((t, i) => {
        const p = L.pts[i];
        t.style.left = p.x + "px";
        t.style.top = p.y + "px";
        t.style.rotate = p.rot.toFixed(1) + "deg";
      });
    };
    ctx.placeTeeth();
    // 화면 회전으로 이빨이 너무 작아질 때 이번 판 다시 차리기 (앙! 연출 중이면 안 함 — 다음 판에서 맞춰짐)
    ctx.reround = () => {
      if (busy || !ctx._active) return false;
      ctx.cancel(glanceT);
      this.next(ctx);
      return true;
    };
    // 눈동자가 이빨 쪽을 봄
    const look = (t) => {
      const cr = croc.getBoundingClientRect(),
        r = t.getBoundingClientRect();
      const dx = (r.left + r.width / 2 - cr.left) / cr.width - 0.5;
      ctx.pupils.forEach((p) => (p.style.transform = "translate(" + dx * 40 + "%," + 30 + "%)"));
    };
    const lookFront = () => ctx.pupils.forEach((p) => (p.style.transform = ""));
    let glanceT = null;
    const glance = () => {
      if (Math.random() > GLANCE.p) return;
      ctx.cancel(glanceT);
      glanceT = ctx.after(280, () => {
        if (busy) return;
        look(teeth[sore]);
        // 1단계만 아픈 이빨이 덜덜 (2·3단계는 눈만 힐끔)
        // 1단계는 누를 때마다 덜덜이 보여 정답을 알려 주는 셈 → 덜덜을 본 판은 열쇠 별 없음(축하·단계는 그대로)
        if (lv === 1) ctx.noStar();
        if (lv === 1) {
          teeth[sore].classList.remove("lite");
          U.replay(teeth[sore], "sore");
        }
        glanceT = ctx.after(GLANCE.ms, () => !busy && lookFront());
      });
    };
    const press = async (t, i) => {
      if (busy || t.classList.contains("down")) return;
      look(t);
      if (i !== sore) {
        t.classList.add("down");
        pressed++;
        // 악어 반응: 움찔 + 눈 깜빡 + 입이 조금씩 내려옴(두근두근)
        U.replay(croc, "cr-flinch");
        croc.classList.add("blink");
        ctx.after(160, () => croc.classList.remove("blink"));
        croc.style.setProperty("--close", (pressed / (n - 1)).toFixed(2));
        A.tone(900, { to: 500, dur: 0.08, vol: 0.18 });
        A.note(A.SCALE[Math.min(pressed + 2, 11)], { inst: "marimba", dur: 0.25, vol: 0.2, when: 0.03 });
        A.tone(170, { to: 240, dur: 0.14, vol: 0.07, type: "triangle", when: 0.06 }); // 음~ (악어 콧소리)
        const p = U.el("div", "cr-pop", U.pick(["뽁!", "쏙!", "콕!"]));
        p.style.left = t.style.left;
        p.style.top = parseFloat(t.style.top) + ctx.cw * 0.47 + "px";
        croc.appendChild(p);
        ctx.after(620, () => p.remove());
        ctx.score.add();
        const gem = gems.get(i);
        if (gem) {
          // 보물 뿅!
          const g = U.el("div", "cr-gem", KP.E(gem[0]));
          g.style.setProperty("--gs", Math.round(ctx.cw * 0.13) + "px");
          g.style.left = t.style.left;
          g.style.top = parseFloat(t.style.top) + ctx.cw * 0.47 + "px";
          croc.appendChild(g);
          ctx.after(1250, () => g.remove());
          A.sfx("sparkle");
          ctx.score.add();
        }
        if (pressed === n - 1) {
          KP.voice.say("이제 하나 남았다! 두근두근!");
          lookFront();
          teeth[sore].classList.add("last");
        } else if (gem) KP.voice.say(gem[1]);
        else KP.voice.say(U.NAT[pressed] + "!"); // 하나! 둘! 셋! (같이 세기)
        if (pressed < n - 1) glance();
        hint();
        return;
      }
      /* ---------- 앙! ---------- */
      busy = true;
      const cleanRound = pressed === n - 1; // 아픈 이빨만 남기고 다 눌렀음
      ctx.hint(null);
      ctx.cancel(glanceT);
      t.classList.remove("last", "sore");
      t.classList.add("down");
      croc.classList.add("bite");
      A.kick({ vol: 0.7 });
      A.noise({ dur: 0.25, vol: 0.25, lp: 1200 });
      A.tone(300, { to: 90, dur: 0.3, vol: 0.2, type: "triangle" });
      U.replay(ctx.stage, "cr-shake");
      ctx.bigEl.textContent = "앙!";
      U.replay(ctx.bigEl, "show");
      // 연출 시간: 단계가 오를수록 짧게 (예전 1.3초 + 1.5초 + 0.5초 + 축하)
      const T = { bite: [1000, 850, 750][lv - 1], laugh: [1100, 950, 800][lv - 1] };
      KP.voice.say(cleanRound || ctx.round === 0 ? "앙! 아야야, 거기가 아픈 이빨이야!" : "앙!");
      await ctx.wait(cleanRound || ctx.round === 0 ? T.bite + 500 : T.bite);
      if (!ctx._active) return;
      // 웃음
      croc.classList.add("laugh");
      for (let k = 0; k < 4; k++) {
        const h = U.el("div", "cr-ha", "하하");
        h.style.cssText = "left:" + (15 + k * 20) + "%;top:" + (8 + (k % 2) * 10) + "%;--r:" + (k % 2 ? 15 : -15) + "deg;animation-delay:" + k * 0.18 + "s";
        croc.appendChild(h);
        ctx.after(1800, () => h.remove());
        A.note(["E5", "C5", "E5", "C5"][k], { inst: "pluck", dur: 0.18, vol: 0.2, when: k * 0.18 });
      }
      KP.voice.say(cleanRound ? "고마워요!" : "하하하! 깜짝 놀랐지?");
      await ctx.wait(T.laugh);
      if (!ctx._active) return;
      croc.classList.remove("bite", "laugh");
      croc.style.setProperty("--close", 0);
      lookFront();
      A.sfx("open");
      await ctx.wait(300);
      if (!ctx._active) return;
      ctx.round++;
      if (cleanRound) {
        // 아픈 이빨을 피해 다 눌렀어요 → 축하 (실력 판: 열쇠 별 대상)
        ctx.clean++;
        ctx.luck = 0;
        const big = ctx.clean % 3 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 정말 용감해!" : "이빨 청소 끝!", say: big ? "" : KP.voice._natUrls && KP.voice._natUrls("이빨 청소 끝!") ? "이빨 청소 끝!" : "정말 용감해!" }); // "이빨 청소 끝!" 음성은 new-voice/croc.txt
        if (ok) this.next(ctx);
        return;
      }
      ctx.luck++;
      if (ctx.luck >= 2) {
        // 앙! 당한 판도 2판마다 한 번 축하 — 운으로 끝난 판이라 단계·열쇠 별에는 넣지 않음(noLevel)
        ctx.luck = 0;
        const ok = await ctx.win({ noLevel: true, msg: "깜짝 놀랐지?", say: "깜짝 놀랐지?" });
        if (ok) this.next(ctx);
        return;
      }
      // 그 사이 판은 축하 없이 바로 다음 판 (매 판 긴 연출 반복 줄이기)
      this.next(ctx);
    };
    // 힌트는 늘 '안 아픈 이빨'을 가리킴(= 정답) → 손가락이 가리킨 판은 열쇠 별 없음(answer)
    const hint = () => ctx.hint(() => teeth.find((t, k) => k !== sore && !t.classList.contains("down")) || teeth[sore], "이빨을 하나씩 콕 눌러 봐요!", { answer: true });
    hint();
  },
});

;

/* ==== js/games/play/egg.js ==== */
/* 깜짝 달걀 — 둥지 속 달걀을 톡톡톡! 금이 점점 커지다가 쩍! 아기 동물이 나와 울음소리를 내요
   1단계: 달걀 3개 (아무 알이나) / 2단계: 4개 + 가끔 반짝 황금알(특별한 친구) / 3단계: 5개 + 황금알 + 단단한 알 1개(다섯 번 톡톡)
   - 2·3단계 '움직이는 알부터': 한 번에 한 알만 꿈틀꿈틀(깨어남) — 그 알을 깨면 다른 알이 깨어남.
     자는 알을 두드리면 💤 "쿨쿨 잠을 자요"(가벼운 틀림, 1번은 봐줌) → 지켜보고 고르는 판이라 열쇠 별 대상
   - 좁은 폰 세로는 두 줄(2+1, 2+2, 3+2)로 달걀을 키우고, 풀밭(초록)이 맨 윗줄 둥지 높이부터 깔림
   - 다 깨면 성공, 다음 판엔 다른 친구들 */
"use strict";
KP.game({
  id: "egg",
  icon: "🥚",
  name: "깜짝 달걀",
  cat: "play",
  levels: 3,
  score: "🐣",
  setup(ctx) {
    const U = KP.u;
    KP.css("egg", `
      .eg-stage{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#fff4d6 0%,#ffe9b8 var(--gy,58%),#9fd889 var(--gy,58%),#7cc56b 100%);display:flex;align-items:center;justify-content:center}
      .eg-stage::before{content:"";position:absolute;left:6%;top:8%;width:clamp(60px,9vw,100px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff7b8 0 40%,#ffd84a 70%,transparent 72%);box-shadow:0 0 50px 16px rgba(255,220,100,.5)}
      .eg-row{position:relative;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:clamp(6px,2vw,26px);padding:10px;max-width:100%}
      .eg-cell{position:relative;width:var(--es);height:calc(var(--es)*1.55);display:flex;align-items:flex-end;justify-content:center}
      .eg-nest{position:absolute;left:-12%;right:-12%;bottom:0;height:34%;border-radius:50%;z-index:3;pointer-events:none;
        background:repeating-linear-gradient(160deg,#b67a3c 0 5px,#8e5a26 5px 9px,#d29a55 9px 13px);box-shadow:inset 0 8px 10px rgba(0,0,0,.25),0 6px 0 rgba(0,0,0,.08)}
      .eg-nest::before{content:"";position:absolute;inset:-6% 4% 40%;border-radius:50%;background:repeating-linear-gradient(20deg,#c48945 0 4px,#9b642c 4px 8px);opacity:.8}
      .eg-egg{position:absolute;left:0;right:0;bottom:16%;height:calc(var(--es)*1.24);cursor:pointer;z-index:2;transform-origin:50% 90%}
      .eg-egg.hintGlow{position:absolute;border-radius:50%}
      .eg-half{position:absolute;inset:0;border-radius:50% 50% 50% 50%/62% 62% 40% 40%;background:var(--bg);box-shadow:inset -10px -14px 22px rgba(120,80,30,.18),inset 8px 8px 14px rgba(255,255,255,.6)}
      .eg-top{clip-path:polygon(0 0,100% 0,100% 50%,90% 43%,80% 53%,70% 43%,60% 53%,50% 43%,40% 53%,30% 43%,20% 53%,10% 43%,0 50%);z-index:3;transition:transform .7s cubic-bezier(.3,1.2,.5,1),opacity .6s .5s}
      .eg-bot{clip-path:polygon(0 50%,10% 43%,20% 53%,30% 43%,40% 53%,50% 43%,60% 53%,70% 43%,80% 53%,90% 43%,100% 50%,100% 100%,0 100%);z-index:3}
      .eg-crack{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:visible}
      .eg-crack path{fill:none;stroke:#6b4a2a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);transition:stroke-dashoffset .25s}
      .eg-egg[data-k="1"] .c1,.eg-egg[data-k="2"] .c1,.eg-egg[data-k="2"] .c2{stroke-dashoffset:0}
      .eg-baby{position:absolute;left:8%;right:8%;bottom:20%;height:calc(var(--es)*.84);font-size:calc(var(--es)*.84);line-height:1;z-index:2;transform:translateY(40%) scale(.4);opacity:0;pointer-events:none;
        transition:transform .55s cubic-bezier(.2,1.6,.4,1) .15s,opacity .2s .15s}
      .eg-baby .e{width:100%;height:100%;display:block}
      .eg-egg.open .eg-baby{transform:translateY(-34%) scale(1);opacity:1}
      .eg-egg.open .eg-top{transform:translate(30%,-95%) rotate(38deg);opacity:0}
      .eg-egg.open .eg-top{pointer-events:none} /* 날아간(투명한) 윗껍데기가 옆·윗줄 달걀 누르기를 가로막지 않게 (좁은 화면 360×640 에서 확인) */
      .eg-egg.open .eg-crack{display:none}
      .eg-egg.open{cursor:default}
      .eg-egg.open .eg-baby{animation:eg-happy .9s ease-in-out .8s infinite alternate}
      @keyframes eg-happy{from{transform:translateY(-34%) rotate(-6deg)}to{transform:translateY(-40%) rotate(6deg)}}
      .eg-awake{animation:eg-awk .9s ease-in-out infinite}
      @keyframes eg-awk{0%,50%,100%{transform:rotate(0)}10%{transform:rotate(-9deg)}20%{transform:rotate(9deg)}30%{transform:rotate(-7deg)}40%{transform:rotate(5deg)}}
      .eg-tok{animation:eg-tok .3s}
      @keyframes eg-tok{25%{transform:rotate(-9deg) scale(1.03,.97)}60%{transform:rotate(7deg)}}
      .eg-wobble{animation:eg-wob 2.6s ease-in-out infinite}
      @keyframes eg-wob{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-5deg)}90%{transform:rotate(5deg)}95%{transform:rotate(-3deg)}}
      .eg-zz{position:absolute;left:62%;top:6%;font-size:calc(var(--es)*.3);line-height:1;z-index:6;pointer-events:none;animation:eg-tapT 1s ease-out forwards}
      .eg-say{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%);white-space:nowrap;z-index:6;background:#fff;color:var(--ink);font-size:clamp(17px,2.4vw,24px);
        padding:4px 12px;border-radius:16px;box-shadow:0 4px 0 rgba(0,0,0,.1);animation:popBig .4s cubic-bezier(.2,1.6,.4,1);pointer-events:none}
      .eg-shell{position:absolute;width:var(--s);height:var(--s);background:var(--bg);clip-path:polygon(50% 0,100% 60%,30% 100%,0 40%);z-index:5;pointer-events:none;animation:eg-shell .8s ease-out forwards}
      @keyframes eg-shell{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
      .eg-tap{position:absolute;font-size:clamp(24px,3.4vw,34px);color:#fff;-webkit-text-stroke:5px #8a4b00;paint-order:stroke;text-shadow:0 3px 0 #8a4b00;z-index:6;pointer-events:none;animation:eg-tapT .6s ease-out forwards}
      @keyframes eg-tapT{from{transform:translate(-50%,0) scale(.5)}40%{transform:translate(-50%,-20px) scale(1.1)}to{transform:translate(-50%,-40px);opacity:0}}
      .eg-hard .eg-half{box-shadow:inset -12px -16px 22px rgba(70,45,20,.4),inset 8px 8px 14px rgba(255,255,255,.5),inset 0 0 0 4px rgba(120,90,55,.55)}
      .eg-hard.eg-tok{animation:eg-hardT .3s}
      @keyframes eg-hardT{30%{transform:translateX(-4px) scale(.98,1.02)}60%{transform:translateX(4px)}}
      .eg-gold .eg-half{box-shadow:inset -10px -14px 22px rgba(160,100,0,.25),inset 8px 8px 14px rgba(255,255,255,.7)}
      .eg-gold{filter:drop-shadow(0 0 12px rgba(255,210,60,.8))} /* 반짝임은 알 모양대로 (그림자는 반쪽 자르기에 네모로 잘려서) */
    `);
    const stage = U.el("div", "eg-stage");
    const row = U.el("div", "eg-row");
    stage.appendChild(row);
    ctx.body.appendChild(stage);
    ctx.stage = stage;
    ctx.row = row;
    // [이모지, 이름, 울음소리]
    ctx.BABIES = [
      ["🐥", "병아리", "삐약삐약"], ["🦆", "아기 오리", "꽥꽥"], ["🐢", "아기 거북이", "느릿느릿 엉금엉금"], ["🐊", "아기 악어", "쩝쩝 크앙"], ["🦖", "아기 공룡", "크아앙"],
      ["🐍", "아기 뱀", "쉬익쉬익"], ["🐧", "아기 펭귄", "뒤뚱뒤뚱 꽉꽉"], ["🦉", "아기 부엉이", "부엉부엉"], ["🦜", "아기 앵무새", "안녕 안녕"], ["🦕", "아기 목긴 공룡", "우우웅"],
      ["🐦", "아기 새", "짹짹"], ["🦩", "아기 홍학", "끼룩끼룩"],
    ];
    ctx.SPECIAL = [["🦄", "유니콘", "히히힝"], ["🐉", "아기 용", "크르릉 푸우"]];
    ctx.SKINS = [
      "radial-gradient(circle at 30% 30%,#fff 0 6%,transparent 7%),#fff8ec",
      "radial-gradient(circle at 30% 35%,#b9e3ff 0 7%,transparent 8%),radial-gradient(circle at 68% 58%,#b9e3ff 0 9%,transparent 10%),radial-gradient(circle at 40% 75%,#b9e3ff 0 6%,transparent 7%),#f2fbff",
      "repeating-linear-gradient(170deg,#ffe0ef 0 14px,#ffc7e1 14px 24px)",
      "radial-gradient(circle at 35% 30%,#c4f2c0 0 8%,transparent 9%),radial-gradient(circle at 65% 65%,#c4f2c0 0 10%,transparent 11%),#f4fff0",
      "repeating-linear-gradient(10deg,#fff5c8 0 16px,#ffe58a 16px 22px)",
      "radial-gradient(circle at 30% 60%,#d9c6ff 0 7%,transparent 8%),radial-gradient(circle at 70% 30%,#d9c6ff 0 8%,transparent 9%),#f8f3ff",
      "#f6e3c8",
    ];
    ctx.HARD = "radial-gradient(circle at 28% 30%,#a88a66 0 5%,transparent 6%),radial-gradient(circle at 66% 48%,#a88a66 0 6%,transparent 7%),radial-gradient(circle at 42% 72%,#a88a66 0 4%,transparent 5%),radial-gradient(circle at 75% 78%,#a88a66 0 5%,transparent 6%),#dcc6a4";
    ctx.GOLD = "radial-gradient(circle at 32% 26%,#fffbe0 0 10%,#ffd84a 40%,#f0a800 100%)";
    ctx.round = 0;
    ctx.size = () => {
      const n = ctx.n || 3;
      const W = stage.clientWidth,
        H = stage.clientHeight;
      // 한 줄에 몇 개? 한 줄(n개)을 기본으로, 줄을 나눠(2개씩·절반씩) 달걀이 15% 넘게 커지면 그쪽으로
      // (폰 세로 5개 → 2+2+1, 태블릿 세로 → 두 줄. 예전엔 '폭 560 미만'만 봐서 태블릿 세로는 한 줄로 작았고 폰 세로 5개는 74px)
      const esOf = (p) => U.clamp(Math.min((W - 40) / p / 1.35, (H - 70) / Math.ceil(n / p) / 1.75), 74, 190);
      let perRow = n;
      for (const p of [Math.ceil(n / 2), 2]) if (p >= 2 && p < n && esOf(p) > esOf(perRow) * 1.15) perRow = p;
      const es = Math.floor(esOf(perRow));
      row.style.setProperty("--es", es + "px");
      // 한 줄에 perRow 개만 (다음 달걀 하나가 더 들어갈 틈은 없게: 여유 es*0.5)
      // 옆 칸 틈: 둥지가 달걀보다 양옆 12%씩 넓어서, 틈이 좁으면(폰) 둥지끼리 겹쳤음 → 둥지 폭만큼은 띄움
      const gap = Math.max(U.clamp(innerWidth * 0.02, 6, 26), es * 0.26);
      row.style.columnGap = gap + "px";
      row.style.maxWidth = perRow * es + (perRow - 1) * gap + 20 + es * 0.5 + "px";
      // 풀밭은 맨 윗줄 둥지 높이부터 (위 줄 달걀이 하늘에 떠 보이지 않게)
      const first = row.firstElementChild;
      if (first && H) {
        const sr = stage.getBoundingClientRect(),
          cr = first.getBoundingClientRect();
        const gy = ((cr.bottom - cr.height * 0.3 - sr.top) / H) * 100;
        stage.style.setProperty("--gy", U.clamp(gy, 25, 75).toFixed(1) + "%");
      } else stage.style.removeProperty("--gy");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.used = [];
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 5][lv - 1];
    ctx.n = n;
    // 지난번과 다른 친구들
    let pool = ctx.BABIES.filter((b) => !ctx.used.includes(b[0]));
    if (pool.length < n) {
      ctx.used = [];
      pool = ctx.BABIES;
    }
    const babies = U.sample(pool, n);
    ctx.used.push(...babies.map((b) => b[0]));
    const goldAt = lv >= 2 && Math.random() < 0.5 ? U.rand(n) : -1;
    if (goldAt >= 0) babies[goldAt] = U.pick(ctx.SPECIAL);
    // 3단계: 단단한 알 하나 (다섯 번 톡톡 해야 깨짐) — 황금알과 겹치지 않게
    const hardAt = lv >= 3 ? U.pick(Array.from({ length: n }, (_, i) => i).filter((i) => i !== goldAt)) : -1;
    const skins = U.shuffle([...ctx.SKINS]);
    ctx.row.innerHTML = "";
    let left = n,
      busy = false;
    // 2·3단계: 움직이는(깨어난) 알 하나만 깰 수 있음
    const order = lv >= 2;
    let awake = -1;
    const AWK_TXT = "움직이는 알을 톡톡!"; // 새 문장 new-voice/egg.txt — 녹음 전에는 "어? 움직여요!"
    const awkSay = KP.voice._natUrls && KP.voice._natUrls(AWK_TXT) ? AWK_TXT : "어? 움직여요!";
    if (order && hardAt < 0) ctx.say("달걀을 톡톡톡! 세 번 두드려 봐요. " + AWK_TXT + " 🥚", "달걀을 톡톡톡! 세 번 두드려 봐요. " + awkSay);
    else if (hardAt < 0) ctx.say("달걀을 톡톡톡! 세 번 두드려 봐요. 누가 나올까? 🥚");
    else {
      // 단단한 알(다섯 번)이 있는 판: 횟수 안내를 맞춤. "단단한 알은 다섯 번!" 자연 음성은 new-voice/egg.txt —
      // 녹음 전에는 그 문장만 말하지 않음(화면 글자로만), 톡톡할 때 "조금 더!"·"딱 한 번만 더!"로 이어서 안내
      const HARD_TXT = "단단한 알은 다섯 번!";
      const nat = KP.voice._natUrls && KP.voice._natUrls(HARD_TXT);
      ctx.say("달걀을 톡톡톡! " + AWK_TXT + " " + HARD_TXT + " 🥚", "달걀을 톡톡톡! 세 번 두드려 봐요. " + awkSay + (nat ? " " + HARD_TXT : ""));
    }
    const eggs = babies.map((bb, i) => {
      const gold = i === goldAt,
        hard = i === hardAt,
        need = hard ? 5 : 3;
      const cell = U.el("div", "eg-cell item");
      cell.style.setProperty("--i", i);
      const egg = U.el("div", "eg-egg eg-wobble" + (gold ? " eg-gold" : "") + (hard ? " eg-hard" : ""));
      egg.style.setProperty("--bg", gold ? ctx.GOLD : hard ? ctx.HARD : skins[i % skins.length]);
      egg.style.animationDelay = -i * 0.7 + "s";
      egg.dataset.k = 0;
      egg.dataset.tap = "1";
      egg.innerHTML =
        '<div class="eg-baby">' + KP.E(bb[0]) + "</div>" +
        '<div class="eg-half eg-bot"></div><div class="eg-half eg-top"></div>' +
        '<svg class="eg-crack" viewBox="0 0 100 124" preserveAspectRatio="none">' +
        '<path class="c1" style="--len:70" d="M38 34 L46 44 L40 52 L50 60 L45 68"/>' +
        '<path class="c2" style="--len:130" d="M45 68 L36 62 L26 70 L16 62 L8 70 M50 60 L60 68 L70 60 L80 70 L92 62"/></svg>';
      cell.innerHTML = '<div class="eg-nest"></div>';
      cell.appendChild(egg);
      ctx.row.appendChild(cell);
      let k = 0,
        open = false;
      ctx.fast(egg, () => {
        if (open || busy) return;
        if (order && i !== awake) {
          // 방금 깬 알 뒤 다음 알이 깨어나기 전(0.9초): 틀림 아님 — 톡 흔들기만 (예전엔 서둘러 누르면 '쿨쿨' 가벼운 틀림)
          if (awake === -2) return U.replay(egg, "eg-tok");
          // 자는 알: 쿨쿨 (가벼운 틀림) — 깨어난 알을 한 번 더 꿈틀
          egg.classList.remove("eg-wobble");
          U.replay(egg, "eg-tok");
          const z = U.el("div", "eg-zz", KP.E("💤"));
          cell.appendChild(z);
          ctx.after(1000, () => z.remove());
          A.note("C4", { inst: "soft", dur: 0.2, vol: 0.12 });
          ctx.miss(null, "쿨쿨 잠을 자요", { soft: true });
          if (eggs[awake]) U.replay(eggs[awake], "eg-tok");
          return;
        }
        k++;
        egg.classList.remove("eg-wobble");
        U.replay(egg, "eg-tok");
        const r = egg.getBoundingClientRect(),
          cr = cell.getBoundingClientRect();
        const t = U.el("div", "eg-tap", k >= need ? "쩍!" : k % 2 ? "톡!" : "톡톡!");
        t.style.left = r.left - cr.left + r.width / 2 + "px";
        t.style.top = "10%";
        cell.appendChild(t);
        ctx.after(620, () => t.remove());
        if (k < need) {
          // 금: 보통 알은 1번째·2번째, 단단한 알은 2번째·4번째 톡에 생김
          egg.dataset.k = Math.floor((k * 2) / (need - 1));
          A.note(hard ? ["C5", "D5", "E5", "G5"][k - 1] : k === 1 ? "E5" : "G5", { inst: "marimba", dur: 0.2, vol: 0.3 });
          A.noise({ dur: 0.05, vol: 0.12, hp: 2500 });
          // 단단한 알: 세 번째에 안 깨지는 까닭을 말로 ("조금 더!") → 네 번째 "딱 한 번만 더!"
          if (hard && k === 3) KP.voice.say("조금 더!");
          else if (hard && k === need - 1) KP.voice.say("딱 한 번만 더!");
          else if (hard) {
            /* 1·2번째는 소리만 */
          } else if (k === need - 1) KP.voice.say(U.pick(["금이 갔어요!", "한 번 더!", "어? 움직여요!"]));
          hint();
          return;
        }
        // 쩍! 깨지기
        open = true;
        egg.classList.add("open");
        egg.classList.remove("eg-awake"); // 깨진 알은 그만 꿈틀 (마지막 알은 wake 가 안 불려 축하 동안 계속 흔들렸음)
        if (order) awake = -2; // 다음 알이 깨어날 때까지
        A.noise({ dur: 0.18, vol: 0.2, hp: 1500 });
        A.sfx("pop");
        ctx.after(250, () => A.sfx(gold ? "sticker" : "levelup"));
        for (let s = 0; s < 6; s++) {
          const sh = U.el("div", "eg-shell");
          sh.style.cssText = "--bg:" + egg.style.getPropertyValue("--bg") + ";left:" + (r.left - cr.left + r.width / 2) + "px;top:40%;--s:" + U.randf(12, 22) + "px;--dx:" + U.randf(-90, 90) + "px;--dy:" + U.randf(-90, 10) + "px;--r:" + U.rand(400) + "deg";
          cell.appendChild(sh);
          ctx.after(850, () => sh.remove());
        }
        const bub = U.el("div", "eg-say", bb[2] + "!");
        ctx.after(600, () => {
          cell.appendChild(bub);
          // 황금알 친구는 "…반짝반짝 아기 용!" (조사 붙은 자연 음성이 없어서 이름만)
          KP.voice.say(bb[2] + "! " + (gold ? "반짝반짝 " + bb[1] + "!" : U.josa(bb[1], "이에요/예요")));
        });
        left--;
        ctx.score.add();
        if (order && left > 0) ctx.after(900, () => wake(i));
        if (left === 0) {
          busy = true;
          ctx.after(2600, async () => {
            ctx.round++;
            const big = ctx.round % 4 === 0;
            if (!order) ctx.noStar(); // 1단계: 두드리기만 하면 깨지는 판(틀릴 수 없음) → 열쇠 별 없음 (2·3단계는 '움직이는 알' 고르기)
            const ok = await ctx.win({ big, msg: big ? "아기 동물 친구 부자!" : "모두 태어났어요!" });
            if (ok) this.next(ctx);
          });
        } else hint();
      });
      return egg;
    });
    ctx.size();
    /** 다음에 깨어날 알 고르기 (방금 깬 알 말고, 안 깬 것 중) */
    const wake = (justOpened) => {
      if (!ctx._active || busy) return;
      const cand = eggs.map((e, k) => k).filter((k) => !eggs[k].classList.contains("open") && k !== justOpened);
      if (!cand.length) return;
      awake = U.pick(cand);
      eggs.forEach((e, k) => {
        e.classList.toggle("eg-wobble", false);
        e.classList.toggle("eg-awake", k === awake);
      });
      A.tone(500, { to: 800, dur: 0.12, vol: 0.08, type: "triangle" });
      hint();
    };
    // 2·3단계: 정답(깨어난 알)을 가리키는 힌트 → 가리킨 판은 열쇠 별 없음(answer)
    const hint = () => {
      const e = order ? eggs[awake] : eggs.find((x) => !x.classList.contains("open"));
      ctx.hint(() => e, order ? AWK_TXT : "달걀을 톡톡톡 두드려 봐요!", order ? { answer: true } : undefined);
    };
    if (order) wake(-1);
    else hint();
  },
});

;

/* ==== js/games/play/firework.js ==== */
/* 반짝반짝 불꽃 — 하늘을 누르면 로켓이 올라가 터진다 (아이 최애 놀이)
   - 아래 버튼으로 불꽃 모양 고르기: 랜덤/하트/별/웃는얼굴/꽃/무지개고리/버드나무/그림불꽃
   - 손가락으로 쓸면 반짝이 꼬리, 8번마다 피날레 + 동요
   - 가만히 있으면 저절로 불꽃이 올라감 */
"use strict";
KP.game({
  id: "firework",
  icon: "🎆",
  name: "반짝반짝 불꽃",
  cat: "play",
  bubble: false,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("firework", `
      .fwBoard{background:#0b1030}
      .fwTools{position:absolute;left:0;right:0;bottom:10px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:0 10px;z-index:2;pointer-events:none}
      .fwBtn{pointer-events:auto;font-size:clamp(26px,4.2vw,40px);width:clamp(64px,9vw,72px);height:clamp(64px,9vw,72px);border-radius:50%;background:rgba(255,255,255,.14);border:3px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
      .fwBtn.sel{background:rgba(255,255,255,.9);border-color:#ffd54a;transform:scale(1.12)}
      /* 폰 세로: 두 줄로 하늘 아래를 가리지 않게 — 왼쪽·오른쪽 가장자리에 4개씩 세로로 */
      @media (max-width:600px) and (orientation:portrait){
        .fwTools{left:8px;right:8px;bottom:8px;padding:0;display:grid;grid-template-columns:64px 1fr 64px;grid-template-rows:repeat(4,64px);gap:8px}
        .fwBtn{width:64px;height:64px;font-size:30px}
        .fwBtn:nth-child(-n+4){grid-column:1}
        .fwBtn:nth-child(n+5){grid-column:3}
        .fwBtn:nth-child(4n+1){grid-row:1}
        .fwBtn:nth-child(4n+2){grid-row:2}
        .fwBtn:nth-child(4n+3){grid-row:3}
        .fwBtn:nth-child(4n){grid-row:4}
      }
      .fwHint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:clamp(24px,4vw,40px);pointer-events:none;text-shadow:0 2px 8px #000;transition:opacity .6s}
      .fwBoard.dragHint .fwHint{opacity:0}
    `);
    const board = U.el("div", "board fwBoard");
    const cv = U.el("canvas");
    const hint = U.el("div", "fwHint", KP.E("👆") + " 하늘을 콕! 눌러 보세요");
    const tools = U.el("div", "fwTools");
    board.append(cv, hint, tools);
    ctx.body.appendChild(board);
    const cx = cv.getContext("2d");
    ctx.cv = cv;
    ctx.cx = cx;
    ctx.board = board;

    const TYPES = [
      ["🎲", "random"], ["❤️", "heart"], ["⭐", "star"], ["😀", "smile"], ["🌸", "flower"], ["🌈", "ring"], ["🌟", "willow"], ["🎈", "emoji"],
    ];
    ctx.type = "random";
    TYPES.forEach(([em, t], i) => {
      const b = U.btn(KP.E(em), "fwBtn" + (i === 0 ? " sel" : ""));
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        A.unlock();
        ctx.type = t;
        U.$$(".fwBtn", tools).forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
        A.sfx("select");
      });
      tools.appendChild(b);
    });

    // 그림 불꽃에 쓸 작은 그림들 미리 불러오기
    ctx.EMOJI_BITS = ["⭐", "💖", "🌟", "🎈", "🦋", "🍭", "💎", "🌸"];
    KP.loadE(ctx.EMOJI_BITS);

    /* ---------- 상태 ---------- */
    let W = 0,
      H = 0,
      parts = [],
      rockets = [],
      stars = [],
      taps = 0,
      idle = 0;
    ctx.resetState = () => {
      parts = [];
      rockets = [];
      taps = 0;
      idle = 2.2;
    };
    function fit() {
      const r = board.getBoundingClientRect();
      W = r.width;
      H = r.height;
      // 큰 화면에서 화소 수가 너무 많아지지 않게 (약 130만 화소 이하)
      // 배율은 정수만 (소수 배율은 확대·축소 계산이 매 프레임 붙어 오히려 느려짐을 측정으로 확인)
      // 화소가 많은 큰 화면(태블릿)은 1배, 작은 화면은 기기 배율(최대 2)
      const dpr = Math.min(2, Math.round(devicePixelRatio || 1)) || 1;
      const d = W * H * dpr * dpr > 1.6e6 ? 1 : dpr;
      cv.width = Math.round(W * d);
      cv.height = Math.round(H * d);
      cx.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.min(70, Math.round((W * H) / 12000)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        r: Math.random() * 1.5 + 0.4,
        t: Math.random() * 6,
      }));
      cx.fillStyle = "#0b1030";
      cx.fillRect(0, 0, W, H);
      // 건물 줄은 한 번만 그려 두고 매 장면 한 번에 찍음 (예전엔 매 장면 네모 100개 가까이 다시 그림)
      const SH = 100;
      sky.width = cv.width;
      sky.height = Math.round(SH * d);
      const g = sky.getContext("2d");
      g.setTransform(d, 0, 0, d, 0, 0);
      g.translate(0, SH - H);
      g.fillStyle = "#141a44";
      const bw = W / 14;
      for (let i = 0; i < 15; i++) {
        const bh = 30 + ((i * 53) % 70);
        g.fillRect(i * bw, H - bh, bw - 4, bh);
      }
      g.fillStyle = "rgba(255,220,120,.5)";
      for (let i = 0; i < 15; i++) {
        const bh = 30 + ((i * 53) % 70);
        for (let kk = 12; kk < bh - 8; kk += 16) if ((i * 7 + kk) % 3) g.fillRect(i * bw + 8, H - bh + kk, 5, 6);
      }
      skyH = SH;
    }
    const sky = document.createElement("canvas");
    let skyH = 0;
    ctx.fit = fit;
    addEventListener("resize", () => ctx._active && fit());

    /* ---------- 소리 ---------- */
    const whistle = () => A.tone(500 + Math.random() * 200, { to: 1400 + Math.random() * 500, dur: 0.55, vol: 0.05, type: "sine" });
    const boom = (big) => {
      A.kick({ vol: big ? 0.65 : 0.45 });
      A.noise({ dur: 0.6, vol: 0.13, lp: 1600 });
      // 반짝이는 오르골 소리
      const base = A.hz(U.pick(["C5", "D5", "E5", "G5", "A5"]));
      [1, 1.5].forEach((m, i) => A.note(base * m, { inst: "marimba", dur: 0.6, vol: 0.08, when: 0.05 + i * 0.07 }));
    };
    const crackle = () => {
      for (let i = 0; i < 3; i++) A.noise({ dur: 0.03, vol: 0.07, hp: 3000, when: 0.25 + Math.random() * 0.5 });
    };

    /* ---------- 입자 ---------- */
    let q = 1; // 화질 계수 (버벅이면 자동으로 낮아짐)
    let ema = 16;
    // 색 문자열 미리 만들어 두기 (매 프레임 수천 번 만들지 않게)
    const COL = new Map();
    const col = (h, l) => {
      const key = (Math.round(h / 10) % 36) * 10 + Math.round((l - 55) / 6);
      let c = COL.get(key);
      if (!c) COL.set(key, (c = "hsl(" + (Math.round(h / 10) % 36) * 10 + ",100%," + l.toFixed(0) + "%)"));
      return c;
    };
    // 번쩍임용 빛 덩어리 그림 (한 번만 만들기)
    const glow = document.createElement("canvas");
    glow.width = glow.height = 128;
    {
      const g = glow.getContext("2d");
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,250,235,1)");
      gr.addColorStop(0.35, "rgba(255,230,180,.45)");
      gr.addColorStop(1, "rgba(255,200,120,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    }
    function P(x, y, vx, vy, hue, o) {
      // 부가 입자(꼬리·잔불)는 기기가 버거우면 덜 만든다
      if (o && o.extra && Math.random() > q) return;
      parts.push(Object.assign({ x, y, vx, vy, hue, life: 1, decay: 0.009 + Math.random() * 0.007, size: 2.2 + Math.random() * 2, grav: 0.04, glitter: false, crackle: false, trail: false }, o || {}));
    }
    function shapeBurst(x, y, pts, scale, hue, opt) {
      pts.forEach(([px, py]) => P(x, y, px * scale, py * scale, hue + U.rand(20), Object.assign({ decay: 0.0095, grav: 0.025 }, opt)));
    }
    const SHAPES = {
      heart: () => Array.from({ length: 46 }, (_, i) => {
        const t = (i / 46) * Math.PI * 2;
        return [16 * Math.pow(Math.sin(t), 3) / 16, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16];
      }),
      star: () => {
        const out = [];
        for (let k = 0; k < 5; k++) {
          const a1 = -Math.PI / 2 + (k * 2 * Math.PI) / 5,
            a2 = a1 + Math.PI / 5,
            a3 = a1 + (2 * Math.PI) / 5;
          for (let s = 0; s < 6; s++) {
            const t = s / 6;
            out.push([U.lerp(Math.cos(a1), 0.42 * Math.cos(a2), t), U.lerp(Math.sin(a1), 0.42 * Math.sin(a2), t)]);
            out.push([U.lerp(0.42 * Math.cos(a2), Math.cos(a3), t), U.lerp(0.42 * Math.sin(a2), Math.sin(a3), t)]);
          }
        }
        return out;
      },
      smile: () => {
        const out = [];
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          out.push([Math.cos(a), Math.sin(a)]);
        }
        for (let i = 0; i < 14; i++) {
          const a = Math.PI * 0.15 + (i / 13) * Math.PI * 0.7;
          out.push([Math.cos(a) * 0.6, Math.sin(a) * 0.6]);
        }
        [[-0.35, -0.3], [0.35, -0.3], [-0.35, -0.38], [0.35, -0.38]].forEach((p) => out.push(p));
        return out;
      },
      flower: () => Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2,
          r = 0.55 + 0.45 * Math.abs(Math.cos(a * 3));
        return [Math.cos(a) * r, Math.sin(a) * r];
      }),
    };
    function explode(x, y, type, hue) {
      if (hue == null) hue = U.rand(360);
      const sc = Math.min(W, H) / 110;
      if (type === "random") type = U.pick(["peony", "peony", "ring", "double", "heart", "star", "smile", "flower", "willow", "emoji", "crossette"]);
      switch (type) {
        case "heart":
          shapeBurst(x, y, SHAPES.heart(), sc * 1.05, 340, { glitter: true });
          break;
        case "star":
          shapeBurst(x, y, SHAPES.star(), sc * 1.1, 48, { glitter: true });
          break;
        case "smile":
          shapeBurst(x, y, SHAPES.smile(), sc * 1.05, 50);
          break;
        case "flower":
          shapeBurst(x, y, SHAPES.flower(), sc * 1.1, hue);
          for (let i = 0; i < 16; i++) {
            const a = Math.random() * 6.28;
            P(x, y, Math.cos(a) * 0.8, Math.sin(a) * 0.8, 55, { decay: 0.012 });
          }
          break;
        case "ring":
          for (let i = 0; i < 64; i++) {
            const a = (i / 64) * Math.PI * 2;
            P(x, y, Math.cos(a) * sc * 1.05, Math.sin(a) * sc * 1.05, (i / 64) * 360, { glitter: i % 3 === 0, decay: 0.009 });
          }
          break;
        case "double": {
          const h2 = (hue + 160) % 360;
          for (let i = 0; i < 50; i++) {
            const a = Math.random() * 6.28,
              s = Math.random() * 0.5 * sc;
            P(x, y, Math.cos(a) * s, Math.sin(a) * s, hue);
          }
          for (let i = 0; i < 60; i++) {
            const a = Math.random() * 6.28,
              s = (0.8 + Math.random() * 0.35) * sc;
            P(x, y, Math.cos(a) * s, Math.sin(a) * s, h2, { glitter: Math.random() < 0.5 });
          }
          break;
        }
        case "willow":
          for (let i = 0, n = Math.round(80 * (0.5 + 0.5 * q)); i < n; i++) {
            const a = Math.random() * 6.28,
              s = (0.3 + Math.random() * 0.75) * sc;
            P(x, y, Math.cos(a) * s, Math.sin(a) * s, 42, { decay: 0.0045, grav: 0.03, glitter: true, trail: true, size: 1.8 });
          }
          break;
        case "emoji":
          for (let i = 0; i < 18; i++) {
            const a = Math.random() * 6.28,
              s = (0.35 + Math.random() * 0.65) * sc;
            P(x, y, Math.cos(a) * s, Math.sin(a) * s, 0, { emoji: U.pick(ctx.EMOJI_BITS), size: 18 + Math.random() * 16, decay: 0.008, grav: 0.03, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2 });
          }
          for (let i = 0; i < 30; i++) {
            const a = Math.random() * 6.28,
              s = Math.random() * sc;
            P(x, y, Math.cos(a) * s, Math.sin(a) * s, hue, { glitter: true });
          }
          break;
        case "crossette":
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * 6.28;
            P(x, y, Math.cos(a) * sc * 0.7, Math.sin(a) * sc * 0.7, hue, { split: true, decay: 0.02, size: 3 });
          }
          break;
        default: // peony
          for (let i = 0, n = Math.round(90 * (0.5 + 0.5 * q)); i < n; i++) {
            const a = Math.random() * 6.28,
              s = Math.random() * sc * 1.1;
            P(x, y, Math.cos(a) * s, Math.sin(a) * s, hue + U.rand(40), { glitter: Math.random() < 0.3, crackle: Math.random() < 0.1 });
          }
      }
      // 터지는 순간 번쩍
      parts.push({ flash: true, x, y, life: 1, decay: 0.08, r: sc * 9, hue });
      boom(type === "willow" || type === "double");
      if (type === "willow" || Math.random() < 0.3) crackle();
    }
    function launch(x, ty, type) {
      rockets.push({ x, y: H + 10, ty: Math.max(60, Math.min(ty, H - 80)), vy: -(H / 85 + Math.random() * 2), hue: U.rand(360), type, wob: Math.random() * 6 });
      whistle();
    }
    ctx.launch = launch;
    function finale() {
      KP.voice.say(U.pick(["우와아! 최고다!", "멋지다아!", "불꽃 대잔치!"]));
      for (let i = 0; i < 7; i++) ctx.after(i * 260, () => launch(60 + Math.random() * (W - 120), 60 + Math.random() * H * 0.45, "random"));
      ctx.after(400, () => A.jingle());
    }

    /* ---------- 터치 ---------- */
    let lastTrail = 0;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      board.classList.add("dragHint");
      const r = cv.getBoundingClientRect();
      launch(e.clientX - r.left, e.clientY - r.top, ctx.type);
      idle = 0;
      taps++;
      if (taps % 8 === 0) ctx.after(700, finale);
    });
    cv.addEventListener("pointermove", (e) => {
      if (!e.buttons && e.pointerType === "mouse") return;
      if (e.pointerType !== "mouse" && e.pressure === 0) return;
      const r = cv.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      for (let i = 0; i < 3; i++) P(x, y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (performance.now() / 8) % 360, { glitter: true, decay: 0.03, size: 2 });
      const now = performance.now();
      if (now - lastTrail > 90) {
        lastTrail = now;
        A.note(A.hz("C6") * Math.pow(2, U.rand(12) / 12), { inst: "bell", dur: 0.2, vol: 0.03 });
      }
      idle = 0;
    });

    /* ---------- 그리기 ---------- */
    ctx.frame = (dt) => {
      // 기기 속도 측정 → 버벅이면 입자 수 줄이기, 여유 있으면 다시 늘리기
      ema = ema * 0.94 + dt * 1000 * 0.06;
      if (ema > 24) q = Math.max(0.35, q - 0.02);
      else if (ema < 18) q = Math.min(1, q + 0.005);
      const k = Math.min(3, dt * 60); // 60Hz 기준 걸음 (120Hz 화면에서도 같은 속도)
      const damp = Math.pow(0.986, k);

      cx.globalCompositeOperation = "source-over";
      cx.globalAlpha = 1;
      cx.fillStyle = "rgba(11,16,48," + Math.min(0.6, 0.22 * k).toFixed(3) + ")";
      cx.fillRect(0, 0, W, H);
      // 별 (작은 네모가 원보다 훨씬 빠름)
      const t = performance.now() / 1000;
      cx.fillStyle = "#fff";
      for (const st of stars) {
        cx.globalAlpha = 0.35 + Math.sin(t * 2 + st.t) * 0.3;
        cx.fillRect(st.x, st.y, st.r * 1.6, st.r * 1.6);
      }
      cx.globalAlpha = 1;
      if (skyH && sky.width && sky.height) cx.drawImage(sky, 0, H - skyH, W, skyH);

      cx.globalCompositeOperation = "lighter";
      rockets = rockets.filter((r) => {
        r.y += r.vy * k;
        r.wob += 0.3 * k;
        const x = r.x + Math.sin(r.wob) * 1.5;
        P(x, r.y + 6, (Math.random() - 0.5) * 0.6, 1 + Math.random(), 40, { decay: 0.05, size: 1.8, grav: 0.01, extra: true });
        cx.fillStyle = col(r.hue, 85);
        cx.fillRect(x - 3, r.y - 3, 6, 6);
        if (r.y <= r.ty) {
          explode(x, r.ty, r.type, r.hue);
          return false;
        }
        return true;
      });
      const cap = Math.round(500 + 800 * q);
      if (parts.length > cap) parts.splice(0, parts.length - cap);
      const next = [];
      for (const p of parts) {
        if (p.flash) {
          p.life -= p.decay * k;
          if (p.life > 0) {
            cx.globalAlpha = p.life * 0.55;
            cx.drawImage(glow, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
            next.push(p);
          }
          continue;
        }
        p.vx *= damp;
        p.vy = p.vy * damp + p.grav * k;
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.life -= p.decay * k;
        if (p.life <= 0) continue;
        if (p.split && p.life < 0.55) {
          p.split = false;
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * 6.28;
            P(p.x, p.y, Math.cos(a) * 2.2, Math.sin(a) * 2.2, (p.hue + 40) % 360, { decay: 0.02, glitter: true });
          }
          if (Math.random() < 0.5) A.noise({ dur: 0.04, vol: 0.05, hp: 3000 });
          continue;
        }
        if (p.crackle && p.life < 0.4) {
          p.crackle = false;
          for (let i = 0; i < 5; i++) {
            const a = Math.random() * 6.28;
            P(p.x, p.y, Math.cos(a) * 1.4, Math.sin(a) * 1.4, p.hue, { decay: 0.035, size: 1.4, extra: true });
          }
        }
        if (p.trail && Math.random() < 0.25) P(p.x, p.y, 0, 0.3, p.hue, { decay: 0.04, size: 1.1, grav: 0.01, extra: true });
        if (p.emoji) {
          cx.globalCompositeOperation = "source-over";
          cx.globalAlpha = Math.min(1, p.life * 1.6);
          p.rot += p.vr * k;
          KP.drawE(cx, p.emoji, p.x, p.y, p.size, p.rot);
          cx.globalCompositeOperation = "lighter";
        } else {
          const al = p.glitter ? (Math.random() < 0.5 ? p.life : p.life * 0.15) : p.life;
          cx.globalAlpha = al > 0 ? al : 0;
          cx.fillStyle = col(p.hue, 58 + p.life * 25);
          const z = p.size * (0.7 + p.life * 0.5);
          cx.fillRect(p.x - z / 2, p.y - z / 2, z, z);
        }
        next.push(p);
      }
      parts = next;
      cx.globalAlpha = 1;
      // 가만히 있으면 자동 불꽃
      idle += dt;
      if (idle > 3.2) {
        idle = Math.random();
        launch(60 + Math.random() * (W - 120), 60 + Math.random() * H * 0.45, "random");
      }
    };
  },
  start(ctx) {
    ctx.board.classList.remove("dragHint");
    ctx.resetState();
    requestAnimationFrame(() => {
      ctx.fit();
      ctx.loop((dt) => ctx.frame(dt));
    });
    ctx.after(500, () => KP.voice.say("하늘을 콕 눌러 보세요! 아래에서 불꽃 모양도 고를 수 있어요."));
  },
});

;

/* ==== js/games/play/fish.js ==== */
/* 물고기 잡기 — 바닷속 친구들이 물결 따라 헤엄친다. 콕 누르면 뜰채로 쏙! 양동이로 휘익~
   - 물고기·열대어·복어·거북이·돌고래는 가는 방향을 바라보고 헤엄, 문어는 둥실, 꽃게는 모래 위 옆걸음
   - 10마리마다 축하 / 단계: 마릿수·속도
   - 3단계: '부르는 친구만 잡기' — 왼쪽 위 팻말의 친구(예: 🐢 거북이)만 양동이에(5마리마다 다른 친구로 바뀜).
     다른 친구를 누르면 뽀글 하고 도망 + 가벼운 틀림 + "복어! 거북이를 찾아요!" (자연 음성 조각) */
"use strict";
KP.game({
  id: "fish",
  icon: "🐟",
  name: "물고기 잡기",
  cat: "play",
  levels: 3,
  score: "🐟",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("fish", `
      .fs-sea{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#6fd6ff 0%,#2fa6e8 30%,#1677c9 70%,#0f5ea8 100%)}
      /* 물결 무늬는 40px(무늬 1칸) 더 넓게 그려 두고 통째로 옆으로 밀기만 함 (무늬를 매번 다시 칠하면 저가 태블릿이 버벅임). 바깥은 fs-sea 가 잘라 줌 */
      .fs-sea::before{content:"";position:absolute;left:-40px;right:0;top:0;height:16px;background:repeating-radial-gradient(circle at 20px -6px,rgba(255,255,255,.55) 0 14px,transparent 15px 40px);background-size:40px 16px;opacity:.8;animation:fs-surf 4s linear infinite}
      @keyframes fs-surf{to{transform:translateX(40px)}}
      .fs-ray{position:absolute;top:-5%;width:12%;height:85%;background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0));transform-origin:top;transform:rotate(14deg);pointer-events:none;animation:fs-ray 6s ease-in-out infinite alternate}
      @keyframes fs-ray{to{transform:rotate(6deg);opacity:.5}}
      .fs-sand{position:absolute;left:-5%;right:-5%;bottom:-30px;height:90px;border-radius:50% 50% 0 0/40px 40px 0 0;background:linear-gradient(#ffe2a3,#f2c46f);pointer-events:none}
      .fs-weed{position:absolute;bottom:20px;width:clamp(30px,4vw,46px);height:clamp(110px,22vh,190px);transform-origin:50% 100%;pointer-events:none;animation:fs-weed 3.2s ease-in-out infinite alternate}
      .fs-weed path{fill:none;stroke-width:10;stroke-linecap:round}
      @keyframes fs-weed{from{transform:rotate(-7deg) skewX(-4deg)}to{transform:rotate(7deg) skewX(4deg)}}
      .fs-deco{position:absolute;bottom:16px;font-size:clamp(32px,5vw,54px);pointer-events:none}
      .fs-bub{position:absolute;bottom:-20px;width:var(--s);height:var(--s);border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(255,255,255,.12);pointer-events:none;
        animation:fs-bub var(--t) linear infinite;animation-delay:var(--dl)}
      @keyframes fs-bub{0%{transform:translate(0,0)}25%{transform:translate(8px,-25vh)}50%{transform:translate(-6px,-50vh)}75%{transform:translate(6px,-75vh)}100%{transform:translate(0,-110vh)}}
      .fs-c{position:absolute;left:0;top:0;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;z-index:2;cursor:pointer}
      .fs-c.hintGlow{position:absolute;border-radius:50%}
      .fs-i{width:100%;height:100%;transition:transform .3s}
      .fs-i .e{width:100%;height:100%;display:block}
      .fs-c.crab .fs-i .e{animation:fs-crab .35s ease-in-out infinite alternate}
      @keyframes fs-crab{from{transform:rotate(-6deg) translateY(0)}to{transform:rotate(6deg) translateY(-4px)}}
      .fs-c.octo .fs-i .e{animation:fs-octo 1.2s ease-in-out infinite}
      @keyframes fs-octo{50%{transform:scale(.9,1.12)}}
      .fs-c.swim .fs-i .e{animation:fs-swim .5s ease-in-out infinite alternate}
      @keyframes fs-swim{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
      .fs-net{position:absolute;width:calc(var(--s)*1.5);height:calc(var(--s)*1.5);left:calc(var(--s)*-.25);top:calc(var(--s)*-.25);pointer-events:none;z-index:3;
        animation:fs-net .35s cubic-bezier(.3,1.4,.5,1)}
      .fs-hoop{position:absolute;inset:0;border-radius:50%;border:clamp(4px,.6vw,7px) solid #b7793a;box-shadow:0 0 0 2px #7b4a1d inset;
        background:repeating-linear-gradient(45deg,rgba(255,255,255,.55) 0 2px,transparent 2px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.55) 0 2px,transparent 2px 12px)}
      .fs-stick{position:absolute;left:84%;top:84%;width:clamp(10px,1.2vw,14px);height:calc(var(--s)*1.4);border-radius:8px;background:linear-gradient(90deg,#d79a55,#9b6230);transform-origin:50% 0;transform:rotate(-45deg)}
      @keyframes fs-net{from{transform:translate(60%,60%) rotate(40deg) scale(.4);opacity:0}}
      .fs-bucket{position:absolute;right:10px;bottom:8px;width:clamp(86px,12vw,128px);height:clamp(86px,12vw,128px);z-index:4;pointer-events:none}
      .fs-bucket>.e{width:100%;height:100%;position:relative;z-index:2}
      .fs-peek{position:absolute;left:14%;right:14%;top:-6%;height:44%;display:flex;justify-content:center;z-index:1}
      .fs-peek .e{width:45%;height:auto;margin:0 -8%;animation:fs-swim .6s ease-in-out infinite alternate}
      .fs-cnt{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);z-index:3;font-size:clamp(26px,3.8vw,40px);color:#fff;-webkit-text-stroke:3px #1f6fd0;paint-order:stroke}
      .fs-want{position:absolute;left:10px;top:10px;z-index:5;display:flex;align-items:center;gap:6px;background:#fff;border-radius:999px;padding:4px 16px 4px 6px;
        box-shadow:0 5px 0 rgba(15,94,168,.35);font-size:clamp(20px,3vw,28px);color:var(--ink);pointer-events:none}
      .fs-want .e{width:clamp(44px,6vw,60px);height:clamp(44px,6vw,60px)}
      .fs-want.pop{animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .fs-c.flee .fs-i{animation:fs-flee .5s ease-out}
      @keyframes fs-flee{30%{transform:scale(.85) rotate(-12deg)}60%{transform:scale(1.05) rotate(10deg)}}
      .fs-splash{position:absolute;width:10px;height:10px;border-radius:50%;background:#bfe9ff;z-index:5;pointer-events:none;animation:fs-splash .5s ease-out forwards}
      @keyframes fs-splash{to{transform:translate(var(--dx),var(--dy));opacity:0}}
    `);
    const sea = U.el("div", "fs-sea");
    sea.dataset.tap = "1";
    let html = '<div class="fs-ray" style="left:10%"></div><div class="fs-ray" style="left:40%;animation-delay:-2s"></div><div class="fs-ray" style="left:72%;animation-delay:-4s"></div>';
    for (let i = 0; i < 10; i++)
      html += '<div class="fs-bub" style="left:' + U.rand(96) + "%;--s:" + (6 + U.rand(12)) + "px;--t:" + (5 + U.rand(6)) + "s;--dl:-" + U.rand(10) + 's"></div>';
    html += '<div class="fs-sand"></div>';
    [["4%", "#2fa35a", 0], ["10%", "#47c46f", -1.2], ["58%", "#2fa35a", -0.6], ["86%", "#3fbb68", -2]].forEach(([x, c, d]) => {
      html += '<svg class="fs-weed" viewBox="0 0 40 120" preserveAspectRatio="none" style="left:' + x + ";animation-delay:" + d + 's"><path stroke="' + c + '" d="M20 118 C 4 95, 36 75, 20 52 S 8 20, 24 4"/></svg>';
    });
    html += '<div class="fs-deco" style="left:22%">' + KP.E("🪸") + '</div><div class="fs-deco" style="left:44%;font-size:clamp(22px,3vw,32px)">' + KP.E("🐚") + '</div><div class="fs-deco" style="left:70%">' + KP.E("🪸") + "</div>";
    sea.innerHTML = html;
    const bucket = U.el("div", "fs-bucket", '<div class="fs-peek"></div>' + KP.E("🪣") + '<div class="fs-cnt">0</div>');
    sea.appendChild(bucket);
    const want = U.el("div", "fs-want");
    want.hidden = true;
    sea.appendChild(want);
    ctx.wantEl = want;
    ctx.body.appendChild(sea);
    ctx.sea = sea;
    ctx.bucket = bucket;

    // [이모지, 이름, 종류, 그림이 보는 방향(-1 왼쪽, 1 오른쪽, 0 정면)]
    ctx.KINDS = [
      ["🐟", "물고기", "swim", -1], ["🐠", "열대어", "swim", -1], ["🐡", "복어", "swim", -1], ["🐟", "물고기", "swim", -1], ["🐠", "열대어", "swim", -1],
      ["🐢", "거북이", "swim", -1], ["🐬", "돌고래", "swim", -1], ["🐙", "문어", "octo", 0], ["🦀", "꽃게", "crab", 0], ["🦑", "오징어", "octo", 0],
    ];

    ctx.spawn = (fromInside) => {
      const W = sea.clientWidth,
        H = sea.clientHeight;
      const lv = ctx.level;
      let k = U.pick(ctx.KINDS);
      // 3단계: 부르는 친구가 절반쯤 나오게 (화면에 하나도 없으면 꼭)
      const tg = ctx.target;
      if (tg && (Math.random() < 0.5 || !ctx.fish.some((f) => !f.dead && f.name === tg[1]))) k = tg;
      if (k[2] === "crab" && ctx.fish.some((f) => f.kind === "crab")) k = ctx.KINDS[0]; // 꽃게는 한 마리씩
      const base = U.clamp(Math.min(W, H) * 0.17, 80, 130); // 최소 80 → 0.9배여도 72px
      const s = Math.round(base * (k[0] === "🐬" || k[0] === "🐢" ? 1.25 : U.randf(0.9, 1.1)));
      const el = U.el("div", "fs-c " + k[2], '<div class="fs-i">' + KP.E(k[0]) + "</div>");
      el.style.setProperty("--s", s + "px");
      el.dataset.tap = "1";
      const dir = Math.random() < 0.5 ? 1 : -1;
      const sp = [55, 80, 125][lv - 1] * U.randf(0.8, 1.2) * (W / 1000 + 0.5);
      // 3단계: 위아래로 더 크게 출렁이며 헤엄 (누르기 조금 더 어렵게)
      const amp = lv === 3 ? U.randf(22, 42) : U.randf(10, 30);
      const f = { el, s, kind: k[2], face: k[3], name: k[1], dir, sp, ph: Math.random() * 6.28, amp, dead: false, t: 0, boost: 0 };
      const top = 30,
        bottom = H - 70 - s;
      if (f.kind === "crab") {
        f.y = H - 30 - s;
        f.x = fromInside ? U.randf(0, W - s) : dir > 0 ? -s : W;
        f.sp *= 0.6;
      } else if (f.kind === "octo") {
        f.x = U.randf(s, W - 2 * s);
        f.y = fromInside ? U.randf(top, bottom) : H;
        f.vx = dir * f.sp * 0.4;
        f.vy = -f.sp * 0.5;
      } else {
        f.x = fromInside ? U.randf(0, W - s) : dir > 0 ? -s : W;
        f.y0 = U.randf(top, Math.max(top, bottom - 40));
        f.yT = f.y0;
        f.y = f.y0;
      }
      ctx.fast(el, (e) => {
        e.stopPropagation();
        ctx.catchIt(f);
      });
      sea.insertBefore(el, bucket);
      ctx.fish.push(f);
    };

    ctx.place = (f) => {
      f.el.style.translate = f.x + "px " + f.y + "px"; // left/top 대신 (다시 칠하지 않고 옮기기만)
      const goingRight = (f.vx != null ? f.vx : f.dir) > 0;
      const flip = f.face !== 0 && (goingRight ? f.face < 0 : f.face > 0);
      f.el.firstChild.style.transform = flip ? "scaleX(-1)" : "";
    };

    ctx.catchIt = (f) => {
      if (f.dead) return;
      // 3단계: 부르는 친구가 아니면 뽀글 하고 쌩 도망 (가벼운 틀림, 1번은 봐줌)
      if (ctx.target && f.name !== ctx.target[1]) {
        if (f.fled) return;
        f.fled = true;
        f.boost = 2.6;
        U.replay(f.el, "flee");
        A.sfx("bubble");
        ctx.miss(null, f.name + "! " + U.josa(ctx.target[1], "을/를") + " 찾아요!", { soft: true });
        return;
      }
      // 3단계: 헤엄치는 친구는 가끔(한 번만) 쌩~ 하고 살짝 도망 → 한 번 더 콕 (벌 없음, 다음 콕은 꼭 잡힘)
      // 2단계도 아주 가끔 (2단계 0.15 / 3단계 0.4)
      const dodge = [0, 0.15, 0.4][ctx.level - 1];
      if (f.kind === "swim" && !f.dodged && Math.random() < dodge) {
        f.dodged = true;
        f.boost = 2.4; // 잠깐 빨라짐 (점점 원래 속도로)
        const H = ctx.sea.clientHeight;
        const top = 30,
          bottom = Math.max(top, H - 70 - f.s - 40);
        f.yT = U.clamp(f.y0 + (Math.random() < 0.5 ? -1 : 1) * U.randf(0.5, 0.9) * f.s, top, bottom);
        U.replay(f.el.firstChild, "wig");
        A.sfx("bubble");
        A.tone(500, { to: 1300, dur: 0.18, vol: 0.1, type: "triangle" });
        // 물방울 퐁퐁
        const r = f.el.getBoundingClientRect(),
          sr = ctx.sea.getBoundingClientRect();
        for (let i = 0; i < 4; i++) {
          const b = U.el("div", "fs-splash");
          const a = (i / 4) * Math.PI * 2;
          b.style.cssText = "left:" + (r.left - sr.left + r.width / 2) + "px;top:" + (r.top - sr.top + r.height / 2) + "px;--dx:" + Math.cos(a) * 30 + "px;--dy:" + Math.sin(a) * 30 + "px";
          ctx.sea.appendChild(b);
          ctx.after(520, () => b.remove());
        }
        if (!ctx.dodgeTalk || performance.now() - ctx.dodgeTalk > 4000) {
          ctx.dodgeTalk = performance.now();
          KP.voice.say(U.pick(["어? 한 번 더!", "한 번 더!"]));
        }
        return;
      }
      f.dead = true;
      const net = U.el("div", "fs-net", '<div class="fs-stick"></div><div class="fs-hoop"></div>');
      f.el.appendChild(net);
      A.sfx("water");
      A.tone(300, { to: 900, dur: 0.15, vol: 0.12 });
      if (ctx.count % 2 === 0) KP.voice.say(U.josa(f.name, "을/를") + " 잡았다!");
      else KP.voice.say(U.pick(["잡았다!", "뜰채로 쏙!", f.name + "!"]));
      ctx.after(380, () => {
        const sr = ctx.sea.getBoundingClientRect(),
          br = ctx.bucket.getBoundingClientRect(),
          fr = f.el.getBoundingClientRect();
        const dx = br.left + br.width / 2 - (fr.left + fr.width / 2),
          dy = br.top + br.height * 0.3 - (fr.top + fr.height / 2);
        net.remove();
        A.sfx("whoosh");
        const an = f.el.animate(
          [
            { transform: "translate(0,0) scale(1) rotate(0)" },
            { transform: "translate(" + dx * 0.5 + "px," + (Math.min(dy, 0) * 0.5 - 140) + "px) scale(.85) rotate(" + (dx > 0 ? 200 : -200) + "deg)" },
            { transform: "translate(" + dx + "px," + dy + "px) scale(.35) rotate(" + (dx > 0 ? 360 : -360) + "deg)" },
          ],
          { duration: 750, easing: "cubic-bezier(.4,.1,.6,1)", fill: "forwards" }
        );
        an.onfinish = () => {
          f.gone = true;
          f.el.remove();
          ctx.inBucket(f, br.left - sr.left + br.width / 2, br.top - sr.top + br.height * 0.3);
        };
      });
    };

    ctx.inBucket = (f, x, y) => {
      if (!ctx._active) return;
      A.noise({ dur: 0.3, vol: 0.14, bp: 1200, bpTo: 400, q: 1 });
      A.note("C6", { inst: "bell", dur: 0.3, vol: 0.1, when: 0.05 });
      for (let i = 0; i < 6; i++) {
        const s = U.el("div", "fs-splash");
        const a = Math.PI + (i / 5) * Math.PI;
        s.style.cssText = "left:" + x + "px;top:" + y + "px;--dx:" + Math.cos(a) * 40 + "px;--dy:" + Math.sin(a) * 40 + "px";
        ctx.sea.appendChild(s);
        ctx.after(520, () => s.remove());
      }
      ctx.count++;
      ctx.score.add();
      U.$(".fs-cnt", ctx.bucket).textContent = ctx.count;
      U.replay(ctx.bucket, "jump");
      const peek = U.$(".fs-peek", ctx.bucket);
      ctx.peekList.push(U.$(".fs-i", f.el) ? f.el.querySelector(".e").outerHTML : "");
      peek.innerHTML = ctx.peekList.slice(-3).join("");
      // 3단계: 5마리마다 부르는 친구 바꾸기 (10마리 축하 때는 축하 뒤에)
      if (ctx.target && ctx.count % 5 === 0 && ctx.count % 10 !== 0) ctx.pickTarget();
      if (ctx.count % 10 === 0) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        // 1·2단계: 누르면 잡히는 진행형(틀림 없음) → 열쇠 별 없음. 3단계는 '골라 잡기' 판이라 별 대상(가벼운 틀림 2번부터 별 없음)
        if (!ctx.target) ctx.noStar();
        ctx.after(1, () => ctx.pickTarget()); // 축하 뒤 다른 친구로
        ctx.win({ big, msg: big ? "{부름} 낚시왕!" : ctx.count + "마리 잡았다!", say: big ? "" : ctx.count <= 100 ? KP.u.numSino(ctx.count) + "! 잡았다!" : "잡았다!" }).then((ok) => ok && ctx.setHint());
      }
    };

    /** 3단계 부르는 친구 정하기 (1·2단계는 없음) — 바로 앞과 다른 친구, 같은 그림 두 번 든 것(물고기·열대어)은 한 번만 */
    ctx.pickTarget = () => {
      if (!ctx._active) return;
      if (ctx.level < 3) {
        ctx.target = null;
        ctx.wantEl.hidden = true;
        return;
      }
      const kinds = ctx.KINDS.filter((k, i) => ctx.KINDS.findIndex((q) => q[1] === k[1]) === i && (!ctx.target || k[1] !== ctx.target[1]));
      const t = (ctx.target = U.pick(kinds));
      ctx.wantEl.innerHTML = KP.E(t[0]) + "<span>" + t[1] + "</span>";
      ctx.wantEl.hidden = false;
      U.replay(ctx.wantEl, "pop");
      if (!KP.celebrating) ctx.setHint();
      if (!KP.celebrating) ctx.say(t[0] + " " + U.josa(t[1], "을/를") + " 찾아요!");
      else ctx.after(2600, () => ctx._active && ctx.target === t && ctx.say(t[0] + " " + U.josa(t[1], "을/를") + " 찾아요!"));
    };
    // 손가락 힌트: 축하(ctx.win)가 힌트를 지우므로 축하가 끝나면 다시 설정 (진행형 놀이)
    // 3단계는 부르는 친구(정답)를 가리킴 → 가리킨 판은 열쇠 별 없음(answer)
    ctx.setHint = () =>
      ctx.hint(
        () => {
          const W = ctx.sea.clientWidth;
          const f = ctx.fish.find((f) => !f.dead && f.x > 20 && f.x < W - f.s - 20 && (!ctx.target || f.name === ctx.target[1]));
          return f && f.el;
        },
        ctx.target ? U.josa(ctx.target[1], "을/를") + " 찾아요!" : "헤엄치는 친구를 콕 눌러요!",
        ctx.target ? { answer: true } : undefined
      );

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = ctx.sea.clientWidth,
        H = ctx.sea.clientHeight;
      const lv = ctx.level;
      const want = [4, 6, 7][lv - 1];
      const alive = ctx.fish.filter((f) => !f.dead);
      ctx.spawnT -= dt;
      if (alive.length < want && ctx.spawnT <= 0) {
        ctx.spawn(false);
        ctx.spawnT = 0.6;
      }
      for (const f of alive) {
        f.t += dt;
        if (f.kind === "crab") {
          f.x += f.dir * f.sp * dt;
          if (Math.random() < dt * 0.3) f.dir *= -1; // 가끔 방향 바꾸기
          if (f.x < -f.s * 1.2 || f.x > W + f.s * 0.2) f.gone = true;
        } else if (f.kind === "octo") {
          f.x += f.vx * dt;
          f.y += f.vy * dt + Math.sin(t * 2 + f.ph) * 0.6;
          if (f.y < 30) f.vy = Math.abs(f.vy);
          if (f.y > H - 80 - f.s && f.t > 3) f.vy = -Math.abs(f.vy);
          if (f.x < 0) f.vx = Math.abs(f.vx);
          if (f.x > W - f.s - 90) f.vx = -Math.abs(f.vx);
          if (f.t > 14) f.gone = true;
        } else {
          f.x += f.dir * f.sp * (1 + f.boost) * dt;
          f.boost *= Math.pow(0.15, dt);
          f.y0 += (f.yT - f.y0) * Math.min(1, dt * 7);
          f.y = f.y0 + Math.sin(t * 1.6 + f.ph) * f.amp;
          if ((f.dir > 0 && f.x > W + 10) || (f.dir < 0 && f.x < -f.s - 10)) f.gone = true;
        }
        if (f.gone) {
          f.dead = true;
          f.el.remove();
          continue;
        }
        ctx.place(f);
      }
      ctx.fish = ctx.fish.filter((f) => !f.gone);
    };
  },
  start(ctx) {
    ctx.sea.querySelectorAll(".fs-c,.fs-splash").forEach((e) => e.remove());
    ctx.fish = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.peekList = [];
    ctx.spawnT = 0.5;
    KP.u.$(".fs-cnt", ctx.bucket).textContent = "0";
    KP.u.$(".fs-peek", ctx.bucket).innerHTML = "";
    ctx.target = null;
    ctx.wantEl.hidden = true;
    ctx.say("헤엄치는 친구를 콕! 뜰채로 잡아서 양동이에 쏙! 🪣");
    if (ctx.level === 3) ctx.after(2600, () => ctx.pickTarget());
    requestAnimationFrame(() => {
      for (let i = 0; i < 3; i++) ctx.spawn(true);
      ctx.loop((dt, now) => {
        // 안전망: 힌트가 어디서든 지워졌으면(축하 등) 다시 걸기
        if (!ctx._hint && !KP.celebrating) ctx.setHint();
        ctx.frame(dt, now);
      });
    });
    ctx.setHint();
  },
});

;

/* ==== js/games/play/fruit.js ==== */
/* 과일 받기 — 나무에서 과일이 대롱대롱 흔들리다 툭! 바구니를 끌어서 받아요
   - 바구니를 손가락으로 좌우로 끌기 (화면 아무 데나 눌러도 그 자리로 이동)
   - 받으면 바구니가 들썩 + 소리, 받은 과일이 바구니에 소복이 쌓임
   - 놓쳐도 벌 없음 (풀밭에 톡 떨어져 데굴) / 10개마다 축하
   1단계: 천천히 1개씩 / 2단계: 2개 / 3단계: 3개·빠르게 + 가끔 🐛 애벌레가 떨어짐 → '피하기'(받으면 애벌레가 폴짝 나가고 가벼운 틀림, 피하면 👍) */
"use strict";
KP.game({
  id: "fruit",
  icon: "🧺",
  name: "과일 받기",
  cat: "play",
  levels: 3,
  score: "🍎",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("fruit", `
      .fr-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#bfe9ff 0%,#e4f7ff 60%,#f6ffe9 100%)}
      .fr-tree{position:absolute;left:-4%;right:-4%;top:-8%;height:30%;pointer-events:none;z-index:1}
      .fr-leaf{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 35%,#8fe07a,#46b04a 65%,#2f8f3c);box-shadow:inset -6px -8px 0 rgba(0,0,0,.08)}
      .fr-trunk{position:absolute;top:0;width:clamp(26px,3.4vw,40px);height:34%;background:linear-gradient(90deg,#9b6230,#c78a4f,#8a5426);border-radius:0 0 10px 10px;z-index:0;pointer-events:none}
      .fr-grass{position:absolute;left:-5%;right:-5%;bottom:-20px;height:60px;border-radius:50% 50% 0 0/26px 26px 0 0;background:linear-gradient(#8ddc7a,#55b955);pointer-events:none}
      .fr-f{position:absolute;left:0;top:0;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;pointer-events:none;z-index:2}
      .fr-f .e{width:100%;height:100%;display:block}
      .fr-f.hang .e{animation:fr-hang .25s ease-in-out infinite alternate;transform-origin:50% 0}
      @keyframes fr-hang{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
      .fr-basket{position:absolute;left:0;bottom:8px;width:var(--bw);height:calc(var(--bw)*.62);z-index:3;cursor:grab}
      .fr-basket.hintGlow{position:absolute;border-radius:30px}
      .fr-handle{position:absolute;left:14%;right:14%;top:-34%;height:70%;border:clamp(7px,1vw,11px) solid #b5793b;border-bottom:none;border-radius:999px 999px 0 0;box-shadow:inset 0 3px 0 rgba(255,255,255,.25)}
      .fr-back{position:absolute;left:4%;right:4%;top:2%;height:22%;border-radius:50%;background:#7b4a1d}
      .fr-pile{position:absolute;left:8%;right:8%;bottom:66%;height:80%}
      .fr-pile .e{position:absolute;width:var(--ps);height:var(--ps);animation:fr-in .35s cubic-bezier(.2,1.6,.4,1)}
      @keyframes fr-in{from{transform:translateY(-40px) scale(1.3)}}
      .fr-front{position:absolute;left:0;right:0;top:12%;bottom:0;clip-path:polygon(0 0,100% 0,88% 100%,12% 100%);
        background:repeating-linear-gradient(90deg,rgba(0,0,0,.1) 0 3px,transparent 3px 22px),repeating-linear-gradient(0deg,#d79a55 0 10px,#c3833f 10px 20px)}
      .fr-rim{position:absolute;left:-2%;right:-2%;top:6%;height:18%;border-radius:12px;background:linear-gradient(#e2a865,#b7793a);box-shadow:0 3px 0 rgba(0,0,0,.12)}
      .fr-bump{animation:fr-bump .35s}
      @keyframes fr-bump{30%{transform:translateY(8px) scale(1.06,.92)}60%{transform:translateY(-6px) scale(.97,1.04)}}
      .fr-f.bug .e{animation:fr-wig .3s ease-in-out infinite alternate}
      @keyframes fr-wig{from{transform:rotate(-14deg) scaleX(.92)}to{transform:rotate(14deg) scaleX(1.06)}}
      .fr-out{position:absolute;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;pointer-events:none;z-index:6;animation:fr-out .9s ease-out forwards}
      .fr-out .e{width:100%;height:100%;display:block}
      @keyframes fr-out{40%{transform:translate(calc(var(--dx)*.5),-90px) rotate(-30deg)}100%{transform:translate(var(--dx),40px) rotate(-60deg);opacity:0}}
      .fr-plus{position:absolute;font-size:clamp(26px,4vw,40px);color:#fff;-webkit-text-stroke:3px #f07a1a;paint-order:stroke;pointer-events:none;z-index:6;animation:fr-plus .8s ease-out forwards}
      @keyframes fr-plus{to{transform:translateY(-70px);opacity:0}}
    `);
    const field = U.el("div", "fr-field");
    field.dataset.tap = "1";
    // 나무 (잎 덩어리 여러 개 + 줄기)
    let tree = '<div class="fr-tree">';
    for (let i = 0; i < 9; i++) {
      const w = 18 + (i % 3) * 5;
      tree += '<div class="fr-leaf" style="left:' + (i * 11.5 - 4) + "%;top:" + (i % 2 ? 30 : 5) + "%;width:" + w + "%;height:" + (60 + (i % 3) * 14) + '%"></div>';
    }
    tree += "</div>";
    field.innerHTML = '<div class="fr-trunk" style="left:8%"></div><div class="fr-trunk" style="right:8%"></div>' + tree + '<div class="fr-grass"></div>';
    const basket = U.el("div", "fr-basket", '<div class="fr-handle"></div><div class="fr-back"></div><div class="fr-pile"></div><div class="fr-front"></div><div class="fr-rim"></div>');
    field.appendChild(basket);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.basket = basket;
    ctx.pile = U.$(".fr-pile", basket);
    ctx.FRUITS = [["🍎", "사과"], ["🍐", "배"], ["🍊", "귤"], ["🍋", "레몬"], ["🍑", "복숭아"], ["🍒", "체리"], ["🍇", "포도"], ["🍓", "딸기"], ["🍌", "바나나"], ["🥝", "키위"]];

    /* ---------- 바구니 끌기 ---------- */
    let down = false;
    const toX = (e) => {
      const r = field.getBoundingClientRect();
      ctx.tx = U.clamp(e.clientX - r.left, ctx.bw / 2, r.width - ctx.bw / 2);
    };
    ctx.fast(field, (e) => {
      down = true;
      try {
        field.setPointerCapture(e.pointerId);
      } catch (_) {}
      toX(e);
      A.sfx("pick");
    });
    field.addEventListener("pointermove", (e) => {
      if (down || (e.pointerType === "mouse" && e.buttons)) toX(e);
    });
    const up = () => (down = false);
    field.addEventListener("pointerup", up);
    field.addEventListener("pointercancel", up);

    ctx.size = () => {
      const W = field.clientWidth,
        H = field.clientHeight;
      ctx.bw = Math.round(U.clamp(Math.min(W * 0.36, H * 0.32), 130, 220));
      basket.style.setProperty("--bw", ctx.bw + "px");
      ctx.fs = Math.round(U.clamp(Math.min(W, H) * 0.12, 56, 92));
      ctx.pile.style.setProperty("--ps", Math.round(ctx.bw * 0.26) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());

    // 3단계 애벌레 안내 (새 문장 new-voice/fruit.txt — 녹음 전에는 기기 목소리)
    ctx.BUG_TXT = "애벌레는 피해요!";
    ctx.spawn = () => {
      const W = field.clientWidth,
        H = field.clientHeight;
      // 3단계: 다섯에 하나쯤 애벌레 (연달아 둘은 안 나오게)
      const bug = ctx.level === 3 && !ctx.lastBug && Math.random() < 0.22;
      ctx.lastBug = bug;
      const [em, name] = bug ? ["🐛", "애벌레"] : U.pick(ctx.FRUITS);
      const s = ctx.fs;
      const el = U.el("div", "fr-f hang" + (bug ? " bug" : ""), KP.E(em));
      if (bug) {
        ctx.bugSeen++;
        if (!ctx.bugTold) {
          ctx.bugTold = true;
          ctx.say("🐛 " + ctx.BUG_TXT, ctx.BUG_TXT);
        }
      }
      el.style.setProperty("--s", s + "px");
      // 다른 과일과 너무 가깝지 않은 자리
      let x = U.randf(10, W - s - 10);
      for (let k = 0; k < 8 && ctx.fruits.some((f) => Math.abs(f.x - x) < s * 1.3); k++) x = U.randf(10, W - s - 10);
      const f = { el, em, name, s, x, y: H * 0.1, vy: 0, hang: [0.7, 0.55, 0.45][ctx.level - 1] + (bug ? 0.35 : 0), state: "hang", rot: 0, vr: 0, bug };
      field.insertBefore(el, basket);
      ctx.fruits.push(f);
      A.tone(700, { to: 900, dur: 0.06, vol: 0.05 });
    };

    ctx.addToPile = (em) => {
      const n = ctx.pile.children.length;
      if (n >= 14) ctx.pile.firstElementChild.remove();
      const i = ctx.pileN++;
      const row = Math.floor(Math.min(i, 13) / 4.5);
      const img = U.el("div", "", KP.E(em)).firstElementChild;
      const ps = ctx.bw * 0.26;
      img.style.left = U.clamp(((i * 37) % 80) + U.randf(-6, 6), 0, 78) + "%";
      img.style.bottom = ps * 0.3 + row * ps * 0.36 + "px";
      img.style.rotate = U.rand(50) - 25 + "deg";
      ctx.pile.appendChild(img);
    };

    const NOTES = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6", "A6"];
    ctx.caught = (f) => {
      f.el.remove();
      if (f.bug) {
        // 애벌레를 받았어요: 바구니에서 폴짝 나감 — 가벼운 틀림(1번은 봐줌), 점수 그대로
        const o = U.el("div", "fr-out", KP.E("🐛"));
        o.style.cssText = "--s:" + f.s + "px;--dx:" + (ctx.bx > field.clientWidth / 2 ? -1 : 1) * 120 + "px;left:" + (ctx.bx - f.s / 2) + "px;top:" + (field.clientHeight - ctx.bw * 0.9) + "px";
        field.appendChild(o);
        ctx.after(950, () => o.remove());
        U.replay(ctx.basket, "fr-bump");
        A.sfx("boing");
        ctx.miss(null, ctx.BUG_TXT, { soft: true });
        return;
      }
      ctx.addToPile(f.em);
      U.replay(ctx.basket, "fr-bump");
      A.note(NOTES[ctx.count % 10], { inst: "marimba", dur: 0.35, vol: 0.28 });
      A.noise({ dur: 0.06, vol: 0.08, lp: 1200 });
      const p = U.el("div", "fr-plus", "+1");
      p.style.left = ctx.bx - 16 + "px";
      p.style.top = field.clientHeight - ctx.bw * 0.9 + "px";
      field.appendChild(p);
      ctx.after(820, () => p.remove());
      KP.voice.say(f.name + "!");
      ctx.count++;
      ctx.score.add();
      // 5개마다 바구니에서 하트 뿅
      if (ctx.count % 5 === 0 && KP.pfx) KP.pfx.hearts(field, ctx.bx, field.clientHeight - ctx.bw * 0.7, 4, ctx);
      if (ctx.count % 10 === 0) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.pause = 2.5;
        ctx.after(300, async () => {
          // 음성은 자연 음성 조각이 있는 말로 ("십! 바구니가 꽉 찼어요!") — "받았다!" 는 조각이 없어 기기 목소리였음
          // 1·2단계: 받기만 하는 진행형(틀림 없음) → 열쇠 별 없음. 3단계는 애벌레가 2번 이상 나온 판만 별 대상(피하기를 한 판)
          if (!(ctx.level === 3 && ctx.bugSeen >= 2)) ctx.noStar();
          ctx.bugSeen = 0;
          const ok = await ctx.win({ big, msg: big ? "{부름} 과일 부자!" : ctx.count + "개 받았다!", say: big ? "" : ctx.count <= 100 ? KP.u.numSino(ctx.count) + "! 바구니가 꽉 찼어요!" : "바구니가 꽉 찼어요!" });
          if (ok) {
            ctx.setHint();
            // 바구니 비우기
            ctx.pile.innerHTML = "";
            ctx.pileN = 0;
            A.sfx("slide");
          }
        });
      }
    };

    // 손가락 힌트: 축하(ctx.win)가 힌트를 지우므로 축하가 끝나면 다시 설정 (진행형 놀이)
    ctx.setHint = () => ctx.hint(() => ctx.basket, "바구니를 끌어서 과일 밑으로 가요!");

    ctx.frame = (dt) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      // 바구니 따라가기
      ctx.bx += (ctx.tx - ctx.bx) * Math.min(1, dt * 14);
      basket.style.left = ctx.bx - ctx.bw / 2 + "px";
      const bTop = H - 8 - ctx.bw * 0.62 + ctx.bw * 0.06;
      // 떨어뜨리기
      ctx.pause -= dt;
      ctx.spawnT -= dt;
      const active = ctx.fruits.filter((f) => f.state !== "ground").length;
      // 1단계도 기다림이 짧게: 간격 줄이고 한 번에 2개까지 (예전 1개·1.4초 → 과일 하나에 약 4초)
      if (!KP.celebrating && ctx.pause <= 0 && ctx.spawnT <= 0 && active < [2, 2, 3][lv - 1]) {
        ctx.spawn();
        ctx.spawnT = [0.9, 0.7, 0.55][lv - 1] * U.randf(0.8, 1.3);
      }
      const g = H / ([3.4, 2.4, 1.8][lv - 1] ** 2) * 1.3; // 떨어지는 데 걸리는 시간에 맞춘 중력
      for (const f of ctx.fruits) {
        if (f.state === "hang") {
          f.hang -= dt;
          if (f.hang <= 0) {
            f.state = "fall";
            f.el.classList.remove("hang");
            A.sfx("whoosh");
          }
        } else if (f.state === "fall") {
          f.vy = Math.min(f.vy + g * dt, H * 0.9);
          f.y += f.vy * dt;
          f.rot += dt * 90;
          const cx = f.x + f.s / 2;
          if (f.y + f.s * 0.6 >= bTop && f.y + f.s * 0.3 < bTop + ctx.bw * 0.3 && Math.abs(cx - ctx.bx) < ctx.bw / 2 + f.s * 0.2) {
            f.state = "done";
            ctx.caught(f);
            continue;
          }
          if (f.y > H - 30 - f.s) {
            // 풀밭에 톡 — 벌 없음 (애벌레는 잘 피했어요 → 👍 하고 기어감)
            if (f.bug) {
              f.state = "done";
              const o = U.el("div", "fr-plus", KP.E("👍"));
              o.style.left = f.x + "px";
              o.style.top = H - 40 - f.s + "px";
              field.appendChild(o);
              ctx.after(820, () => o.remove());
              A.note("E6", { inst: "bell", dur: 0.25, vol: 0.12 });
              continue;
            }
            f.state = "ground";
            f.y = H - 30 - f.s;
            f.vy = -H * 0.35;
            f.vr = (Math.random() < 0.5 ? -1 : 1) * 260;
            f.t = 0;
            A.note("G3", { inst: "marimba", dur: 0.2, vol: 0.2 });
            if (Math.random() < 0.35) KP.voice.say(U.pick(["괜찮아요!", "아이쿠!", "다음 건 받아 보자!"]));
          }
        } else if (f.state === "ground") {
          f.t += dt;
          f.vy += g * dt;
          f.y = Math.min(H - 30 - f.s, f.y + f.vy * dt);
          f.x += f.vr * 0.25 * dt;
          f.rot += f.vr * dt;
          if (f.t > 0.9) f.el.style.opacity = Math.max(0, 1 - (f.t - 0.9) * 2.5);
          if (f.t > 1.4) f.state = "done";
        }
        f.el.style.left = f.x + "px";
        f.el.style.top = f.y + "px";
        f.el.style.rotate = (f.state === "hang" ? 0 : f.rot % 360) + "deg";
      }
      ctx.fruits = ctx.fruits.filter((f) => {
        if (f.state === "done") {
          f.el.remove();
          return false;
        }
        return true;
      });
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".fr-f,.fr-plus").forEach((e) => e.remove());
    ctx.pile.innerHTML = "";
    ctx.pileN = 0;
    ctx.fruits = [];
    ctx.bugSeen = 0;
    ctx.bugTold = false;
    ctx.lastBug = false;
    ctx.count = 0;
    ctx.ms = 0;
    ctx.pause = 0;
    ctx.spawnT = 1.0;
    ctx.say("바구니를 끌어서 떨어지는 과일을 받아요! 🧺");
    requestAnimationFrame(() => {
      ctx.size();
      ctx.bx = ctx.tx = ctx.field.clientWidth / 2;
      ctx.loop((dt) => {
        // 안전망: 힌트가 어디서든 지워졌으면(축하 등) 다시 걸기
        if (!ctx._hint && !KP.celebrating) ctx.setHint();
        ctx.frame(dt);
      });
    });
    ctx.setHint();
  },
});

;

/* ==== js/games/play/handwash.js ==== */
/* 뽀득뽀득 손 씻기 — 점토 세면대 앞, 내 손(점토 손 그림)을 직접 씻어요
   - 장면 속 물건을 직접 눌러요: 꽃 수도꼭지(물 틀기·잠그기, 손잡이가 돌아감) → 물비누 펌프(꾹 → 거품 덩이) → 손 문지르기 → 헹구기 → 수건
   - 손 그림 3자세(손바닥 → 손등 → 깍지)로 바뀌며, 문지른 자리만 거품이 생김 (표면 마스크 KP.care setSkin — 손 모양 안에서만)
     3단계는 놀다 온 흙 묻은 손: 문지른 곳만 깨끗해짐. 헹굴 때는 물줄기 아래에서 비빈 자리만 거품이 흘러내림
   - 단계: 1 순서 안내(할 물건이 반짝)·손바닥과 깍지 두 자세만·덜 문질러도 됨 → 2 '다음엔 뭘 할까요?' 순서 고르기(두 자세, 판마다 손등/깍지 번갈아)
     → 3 흙·물감 묻은 손을 혼자서: 묻은 곳만 찾아 문지르기(두 자세, 판마다 번갈아) + 물은 아이가 직접 잠그기 (시간 제한 없음)
   - 한 판 1~2분 안: 1·2단계는 물이 저절로 잠기고(쏴아→뚝), 헹굼·수건은 조금만 문질러도 됨 (예전 2단계 세 자세·잠그기 2번 = 스크립트로도 95초)
   - 자세가 바뀔 때 "휙!" 소리·글자로 알려 줌(손이 왜 바뀌었는지 알게)
   - 아이가 칠한 인형 친구(정면 그림)가 시작·끝에 옆에서 작게 응원
   공용: play/_care.js(문지르기 판·표면 마스크·순서) · _shared/clay-stage.js(배경 자르기만, 3D 없음) */
"use strict";
KP.game({
  id: "handwash",
  icon: "🧼",
  name: "뽀득뽀득 손 씻기",
  cat: "play",
  levels: 3,
  score: "🫧",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/handwash/");
    KP.care.css();
    KP.css("handwash", `
      .hw-scene{background:#cfe6cf}
      .hw-tap{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
      .hw-tap img{width:100%;height:100%;display:block}
      .hw-on .hw-tap{transform:rotate(-36deg)}
      .hw-stream{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transform-origin:50% 0;transform:scaleY(0);opacity:0;transition:transform .3s ease-in,opacity .2s;
        border-radius:45% 45% 40% 40%/6% 6% 5% 5%;
        background:linear-gradient(90deg,rgba(140,200,250,.35),rgba(215,240,255,.85) 28%,rgba(255,255,255,.95) 40%,rgba(180,222,252,.7) 62%,rgba(120,185,240,.4));
        -webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent);
        clip-path:inset(0 round 45% 45% 40% 40%/6% 6% 5% 5%)}
      /* 흐르는 물결 무늬는 30px 더 긴 한 장(::after)에 그려 두고 통째로 아래로 밀기만 함 (무늬를 매번 다시 칠하면 저가 태블릿이 버벅임).
         위로 삐져나온 부분은 물줄기의 clip-path(둥근 모양 그대로)가 잘라 줌 */
      .hw-stream::after{content:"";position:absolute;left:12%;right:12%;top:-30px;bottom:0;border-radius:0 0 40% 40%/0 0 5% 5%;opacity:.9;
        background:repeating-linear-gradient(176deg,rgba(255,255,255,0) 0 14px,rgba(255,255,255,.8) 14px 17px,rgba(255,255,255,0) 17px 30px);animation:hw-flow .28s linear infinite}
      @keyframes hw-flow{to{transform:translateY(30px)}}
      .hw-on .hw-stream{transform:scaleY(1);opacity:1}
      .hw-hands{position:absolute;left:0;top:0;z-index:4;pointer-events:none;transition:transform .16s ease-in,filter .4s}
      .hw-hands img{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 8px rgba(60,40,20,.25))}
      .hw-hands.flip{transform:scaleX(0)}
      .hw-hands.glow img{animation:hw-glowF 1.1s ease-in-out infinite alternate}
      .hw-obj{position:absolute;left:0;top:0;z-index:6;touch-action:manipulation;cursor:pointer}
      .hw-obj img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 6px 5px rgba(60,40,20,.28))}
      .hw-obj.glow img{animation:hw-glowF 1.1s ease-in-out infinite alternate}
      @keyframes hw-glowF{from{filter:drop-shadow(0 6px 5px rgba(60,40,20,.28))}to{filter:drop-shadow(0 0 9px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .hw-obj.press img{animation:hw-press .32s ease-out}
      @keyframes hw-press{40%{transform:scale(1.04,.84);transform-origin:50% 100%}}
      .hw-obj.away img{opacity:.25}
      .hw-hit{position:absolute;left:0;top:0;z-index:6;border-radius:50%;touch-action:manipulation;cursor:pointer}
      /* 누를 곳 빛 고리는 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .hw-hit::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:0 0 0 7px rgba(255,205,40,.75);background:rgba(255,240,170,.18)}
      .hw-hit.glow{animation:none}
      .hw-hit.glow::after{animation:hw-ring 1.1s ease-in-out infinite alternate}
      @keyframes hw-ring{to{opacity:1}}
      .hw-handsHit.glow::after{animation:none}
      .hw-scene.rubbing .hw-obj,.hw-scene.rubbing .hw-hit,.hw-scene.rubbing .hw-bgHit{pointer-events:none}
      /* 배경 그림 속 노란 비누·걸린 수건 자리(투명): 누르면 진짜 펌프·수건을 누른 것과 같게 */
      .hw-bgHit{position:absolute;left:0;top:0;z-index:5;border-radius:30%;touch-action:manipulation;cursor:pointer}
      .hw-blob{position:absolute;left:0;top:0;z-index:5;pointer-events:none;width:var(--s);height:var(--s);margin:calc(var(--s)*-.5) 0 0 calc(var(--s)*-.5);border-radius:50%;
        background:radial-gradient(circle at 35% 35%,#fff 0 18%,rgba(255,255,255,0) 19%),radial-gradient(circle at 30% 60%,#f6faff 0 26%,rgba(255,255,255,0) 27%),
          radial-gradient(circle at 68% 58%,#eef6ff 0 28%,rgba(255,255,255,0) 29%),radial-gradient(circle at 52% 40%,#fbfdff 0 34%,rgba(255,255,255,0) 35%);
        filter:drop-shadow(0 2px 2px rgba(120,160,200,.45));transition:transform .55s cubic-bezier(.5,0,.9,.6)}
      .hw-pal{position:absolute;left:0;top:0;z-index:6;pointer-events:none;width:var(--s);height:var(--s);transition:transform .45s cubic-bezier(.3,1.3,.5,1),opacity .3s;opacity:0}
      .hw-pal img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 6px 5px rgba(60,40,20,.3))}
      .hw-pal.on{opacity:1}
      .hw-pal.hop img{animation:hw-hop .5s ease-in-out 2}
      @keyframes hw-hop{50%{transform:translateY(-14%) scale(1.04)}}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene hw-scene"));
    ctx.body.appendChild(scene);
    const mk = (cls, html = "") => {
      const e = U.el("div", cls, html);
      scene.appendChild(e);
      return e;
    };
    ctx.taps = [mk("hw-tap", '<img alt="" src="' + IMG + 'tap-blue.png">'), mk("hw-tap", '<img alt="" src="' + IMG + 'tap-pink.png">')];
    ctx.stream = mk("hw-stream");
    ctx.hands = mk("hw-hands", '<img alt="" draggable="false">');
    ctx.handImg = ctx.hands.firstChild;
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F, pass: true });
    ctx.S.radius = 0.09;
    ctx.faucet = mk("hw-hit hw-faucet");
    ctx.faucet.setAttribute("aria-label", "수도꼭지");
    ctx.pump = mk("hw-obj hw-pump", '<img alt="" draggable="false" src="' + IMG + 'pump.png">');
    ctx.pump.setAttribute("aria-label", "물비누");
    ctx.towel = mk("hw-obj hw-towelObj", '<img alt="" draggable="false" src="assets/play-clay/bath/towel.png">');
    ctx.towel.setAttribute("aria-label", "수건");
    // 배경 그림의 노란 비누·수건: "비누를 눌러요!"에 아이가 먼저 누를 만한 곳 → 펌프·수건과 같은 동작으로 받아 줌
    // (펌프·수건보다 아래 층이라 겹치면 진짜 물건이 눌림)
    ctx.bgSoap = mk("hw-bgHit");
    ctx.bgTowel = mk("hw-bgHit");
    ctx.bgSoap.addEventListener("click", () => ctx.pump.click());
    ctx.bgTowel.addEventListener("click", () => ctx.towel.click());
    ctx.handsHit = mk("hw-hit hw-handsHit");
    ctx.handsHit.setAttribute("aria-label", "손");
    ctx.pal = mk("hw-pal", '<img alt="">');
    // 물 잠그기를 기다릴 때 수도꼭지를 누르면 (순서 고르기와 따로)
    ctx.faucet.addEventListener("click", () => ctx._closeTap && ctx._closeTap());
    ctx.POSES = [
      { f: "palms", say: "손바닥을 싹싹 문질러요!", cen: [[0.27, 0.6], [0.73, 0.6]] },
      { f: "backs", say: "손등도 싹싹 문질러요!", cen: [[0.28, 0.55], [0.72, 0.55]] },
      { f: "clasp", say: "손가락 사이도 쏙쏙 문질러요!", cen: [[0.5, 0.35]] },
    ];
    // 세면대 배경 (1600×900): 수도꼭지·세면대 가운데. 꽃 손잡이는 배경에서 지우고 따로 그림(돌아가게)
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1600, 900], vh: 0.2, near: 0.2, fov: 34, focus: [0.52, 0.56], focusP: [0.525, 0.62],
      zoomP: (w, h) => (w / h > 0.7 ? 1.25 : 1), // 태블릿 세로: 거울 쪽 빈 곳을 줄이고 세면대를 크게 (폰 세로는 손잡이가 잘려서 그대로)
    };
    ctx.TAPBOX = [
      [0.3586, 0.3936, 0.0833, 0.1489],
      [0.5446, 0.3936, 0.0833, 0.1489],
    ];
    ctx.F = { x: 0, y: 0, w: 1, h: 1 };
    ctx.pose = 0;
    ctx.token = 0;
  },
  /** 손 그림 3장 불러와 모양(표면 마스크) 만들기 — 한 번만 */
  loadHands(ctx) {
    if (ctx._handsP) return ctx._handsP;
    const load = (p) =>
      new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("손 그림을 못 읽었어요: " + p.f));
        im.src = ctx.IMG + p.f + ".png";
      });
    ctx._handsP = Promise.all(ctx.POSES.map(load))
      .then((ims) => {
        ctx.POSES.forEach((p, i) => {
          const im = ims[i];
          p.a = im.naturalWidth / im.naturalHeight;
          p.shape = KP.care.shapeOf(im, 300, Math.round(300 / p.a));
        });
      })
      .catch((e) => {
        ctx._handsP = null; // 다음에 다시
        throw e;
      });
    return ctx._handsP;
  },
  async start(ctx) {
    ctx.round = 0;
    const tok = ++ctx.token;
    if (ctx.st) ctx.st.dispose();
    ctx.st = KP.clayStage.create(ctx.scene, ctx.BG, { flat: true });
    ctx.st.onResize = () => this.layout(ctx);
    // 응원하는 인형 친구: 아이가 칠한 인형(정면 그림) → 없으면 기본 인형
    const dolls = await KP.dollActor.painted();
    await this.loadHands(ctx);
    if (tok !== ctx.token || !ctx._active) return;
    const it = dolls.length ? KP.u.pick(dolls) : null;
    ctx.pal.firstChild.src = (it && KP.safeImg(it.thumb)) || KP.DOLL.thumbUrl(KP.u.pick(KP.DOLL.ORDER || ["bear"]));
    ctx.S.run();
    ctx.loop(() => {
      const S = ctx.S;
      ctx.scene.classList.toggle("rubbing", !!S.on);
      ctx.hands.classList.toggle("glow", ctx.handsHit.classList.contains("glow"));
    });
    this.layout(ctx);
    this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    ctx._closeTap = null;
    ctx.water = false;
    ctx.scene.classList.remove("hw-on", "rubbing");
    if (ctx.S) {
      ctx.S.reset();
      ctx.S.dropSkin();
    }
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
  },
  /** 자리 잡기: 배경 그림 좌표(u,v) → 화면 px */
  layout(ctx) {
    const st = ctx.st;
    if (!st || !st.bc) return;
    const U = KP.u, W = st.w, H = st.h, v = st.bc.view, vis = st.bc.vis;
    const P = (u, vv) => st.uvToPx(u, vv);
    const put = (e, x, y, w, h) => (e.style.cssText += `;left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
    // 꽃 손잡이
    ctx.TAPBOX.forEach((b, i) => {
      const p = P(b[0], b[1]);
      put(ctx.taps[i], p.x, p.y, b[2] * v.fw, b[3] * v.fh);
    });
    // 수도꼭지 누르는 곳: 두 손잡이 + 꼭지 전체
    const a = P(0.352, 0.3), b = P(0.635, 0.56);
    const fx0 = Math.max(2, a.x), fx1 = Math.min(W - 2, b.x);
    put(ctx.faucet, fx0, a.y, fx1 - fx0, b.y - a.y);
    // 손: 물줄기 아래, 손목은 화면 아래로 (내 손처럼)
    const spout = P(0.521, 0.494);
    const pose = ctx.POSES[ctx.pose];
    // 세로 화면(폰): 배경 양옆이 잘려 펌프·수건 놓을 데가 없음 → 손을 조금 줄이고 펌프·수건은 손 양옆 아래(세면대 앞 가장자리)
    const tall = W / H < 0.8;
    const bottom = H * 1.04;
    const maxW = tall ? W * 0.64 : W * 0.92;
    let top = spout.y + H * (H < 450 ? 0.04 : 0.1), h = bottom - top, w = h * pose.a; // 납작한 폰 가로: 손을 조금 더 크게
    if (w > maxW) {
      w = maxW;
      h = w / pose.a;
      top = bottom - h;
    }
    const x = U.clamp(spout.x - w / 2, W * 0.04, W * 0.96 - w);
    ctx.F = { x, y: top, w, h };
    put(ctx.hands, x, top, w, h);
    put(ctx.handsHit, x + w * 0.06, top, w * 0.88, Math.min(h, H - top));
    // 물줄기: 꼭지에서 손 위(손가락 쪽)까지
    const sw = Math.max(14, v.fw * 0.032);
    put(ctx.stream, spout.x - sw / 2, spout.y - 3, sw, Math.max(24, top + h * 0.34 - spout.y));
    // 물비누 펌프(왼쪽)·수건(오른쪽): 세면대 가장자리 위, 좁은 화면이면 보이는 곳 안쪽으로
    if (tall) {
      const side = Math.max(80, W * 0.2); // 폰 세로에서도 펌프·수건이 64px 넘게
      const ph = Math.max(96, side * 1.45), pw = ph * (172 / 256);
      put(ctx.pump, Math.max(4, x - pw * 0.72), H * 0.79 - ph, pw, ph);
      const tw = Math.max(80, side * 1.15), th = tw * (199 / 256);
      put(ctx.towel, Math.min(W - tw - 4, x + w - tw * 0.2), H * 0.8 - th, tw, th);
    } else {
      const ph = Math.max(108, v.fh * 0.19), pw = ph * (172 / 256); // 폰 가로에서도 펌프 폭 72px 이상
      const pu = Math.max(0.285, vis.u0 + (pw / v.fw) * 0.5 + 0.012);
      const pp = P(pu, 0.57);
      put(ctx.pump, U.clamp(pp.x - pw / 2, 4, W - pw - 4), pp.y - ph, pw, ph);
      const tw = Math.max(96, v.fw * 0.12), th = tw * (199 / 256);
      const tu = Math.min(0.755, vis.u1 - (tw / v.fw) * 0.5 - 0.012);
      const tp = P(tu, 0.585);
      put(ctx.towel, U.clamp(tp.x - tw / 2, 4, W - tw - 4), tp.y - th, tw, th);
    }
    // 배경 비누(받침 포함)·걸린 수건 자리 (배경 그림 1600×900 기준 u,v)
    const box = (e, u0, v0, u1, v1) => {
      const p0 = P(u0, v0), p1 = P(u1, v1);
      put(e, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    };
    box(ctx.bgSoap, 0.11, 0.4, 0.278, 0.575);
    box(ctx.bgTowel, 0.762, 0.33, 0.915, 0.73);
    // 응원 친구: 왼쪽 아래 구석
    const ps = Math.max(72, Math.min(H * 0.24, W * 0.26));
    ctx.pal.style.setProperty("--s", ps + "px");
    ctx.pal.style.left = Math.max(6, W * 0.02) + "px";
    ctx.pal.style.top = (tall ? 6 : H - ps - 6) + "px"; // 세로 화면은 아래 구석에 펌프가 있어 위 구석으로
    if (ctx.towelTool) ctx.S.setTool(ctx.towelTool, Math.max(80, w * 0.34));
  },
  /** 손 자세 바꾸기 (뒤집히듯 짧게) */
  async setPose(ctx, i, alive) {
    if (ctx.pose === i && ctx.handImg.getAttribute("src")) return;
    const S = ctx.S;
    if (ctx.handImg.getAttribute("src")) {
      ctx.hands.classList.add("flip");
      await ctx.wait(170);
      if (!alive()) return;
    }
    S.dropSkin();
    ctx.pose = i;
    ctx.handImg.src = ctx.IMG + ctx.POSES[i].f + ".png";
    this.layout(ctx);
    S.setSkin(ctx.POSES[i].shape);
    ctx.hands.classList.remove("flip");
    await ctx.wait(170);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const tok = ++ctx.token;
    const alive = () => tok === ctx.token && ctx._active;
    const lv = ctx.level;
    const muddy = lv === 3;
    S.reset();
    S.dropSkin();
    ctx._closeTap = null;
    ctx.water = false;
    ctx.towelTool = null;
    ctx.scene.classList.remove("hw-on");
    ctx.towel.classList.remove("away");
    ctx.handImg.removeAttribute("src");
    const F = () => ctx.F;
    const cx = () => F().x + F().w / 2;
    const handPt = () => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + F().x + F().w / 2, y: r.top + F().y + F().h * 0.4 };
    };
    // 3단계 '묻은 것': 두 판마다 흙 / 물감 번갈아 (색만 다름) — 자세(판마다 번갈아)와 엇갈려 4판에 네 가지
    const paint = muddy && Math.floor((ctx.round || 0) / 2) % 2 === 1;
    const COLS = paint ? ["#ff5b6e", "#3aa0ff", "#ffc531", "#3fd17a", "#8a63ee"] : ["#8a5a2b", "#7a4e24", "#9b6a3a"];
    const addMud = () => {
      if (!muddy) return [];
      const shape = ctx.POSES[ctx.pose].shape;
      // 3단계는 묻은 곳만 문지르면 그 자세 끝 (zone "rub") — 손 전체를 다 문지르지 않고 '묻은 곳 찾기'
      const m = U.sample(C.ptsIn(shape, 10, 0.07), 5).map((p) => ({ zone: "rub", x: p.x, y: p.y, r: 0.12, need: 1.8, col: U.pick(COLS), seed: Math.random() }));
      S.skinMud(m);
      return m;
    };
    let mudNow = [];
    // 점검용
    ctx.hwState = () => ({ tok, pose: ctx.pose, water: !!ctx.water, on: !!S.on, closeWait: !!ctx._closeTap, mode: Object.keys(S.mode || {}).join(","), prog: S.zones.rub ? S.prog("rub") : S.zones.rinse ? S.prog("rinse") : S.zones.dry ? S.prog("dry") : 0 });
    ctx.hwPt = (u, v) => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + F().x + u * F().w, y: r.top + F().y + v * F().h };
    };
    ctx.hwBody = () => C.ptsIn(ctx.POSES[ctx.pose].shape, 9, 0.03);

    /* ---------- 물 ---------- */
    const faucet = (on) => {
      ctx.water = on;
      ctx.scene.classList.toggle("hw-on", on);
      A.tone(on ? 480 : 900, { to: on ? 900 : 480, dur: 0.16, vol: 0.12, type: "triangle" });
      if (on) {
        const tick = () => {
          if (!ctx.water || !alive()) return;
          A.sfx("water");
          S.burst(cx() + U.randf(-F().w * 0.06, F().w * 0.06), F().y + F().h * 0.28, 3, "drop", 0.5);
          ctx.after(330, tick);
        };
        ctx.after(250, tick);
        C.pop(ctx, ctx.scene, cx() + F().w * 0.25, F().y, "졸졸");
      }
    };
    const waitClose = () =>
      autoTap
        ? ctx.wait(500) // 1·2단계: 저절로 잠김 (뚝 소리는 faucet(false))
        : new Promise((res) => {
            ctx.say("물을 잠가요!");
            ctx.hint(() => ctx.faucet, "물을 잠가요!");
            ctx._closeTap = () => {
              ctx._closeTap = null;
              ctx.hint(null);
              res();
            };
          });
    /** 손 문지르기 한 번 (구역 rub·rinse·dry 를 80% 이상) */
    const rubZone = (zone, mode, say, need, extra) =>
      new Promise((res) => {
        S.reset(true);
        // 3단계 문지르기: 묻은 곳(extra, zone rub)만 — 손 전체 격자는 넣지 않음
        const onlyExtra = zone === "rub" && extra && extra.length;
        if (!onlyExtra) S.add(C.ptsIn(ctx.POSES[ctx.pose].shape, 9, 0.03).map((p) => ({ zone, x: p.x, y: p.y, need })));
        if (extra && extra.length) S.add(extra);
        S.mode = mode;
        S.need = zone === "dry" ? 0.75 : 0.8;
        S.sound = zone === "rinse" ? () => A.noise({ dur: 0.08, vol: 0.05, bp: 1400, q: 1 }) : () => A.sfx("rub");
        let d = 0;
        S.onRub = (x, y, len) => {
          d += len;
          if (d > 120 && zone === "rub") (d = 0), A.sfx("bubble");
        };
        if (ctx.towelTool && zone === "dry") S.setTool(ctx.towelTool, Math.max(80, F().w * 0.34));
        else S.setTool("", 0);
        ctx.say(say + (zone === "rub" ? " 🫧" : ""));
        ctx.hint(onlyExtra ? () => {
          const r = ctx.scene.getBoundingClientRect(), s = S.spots.find((q) => q.zone === "rub" && q.life > 0 && !q.fade) || { x: 0.5, y: 0.4 };
          return { x: r.left + F().x + s.x * F().w, y: r.top + F().y + s.y * F().h };
        } : handPt, say);
        S.on = true;
        S.onZone = (k) => {
          if (k !== zone) return;
          S.on = false;
          ctx.hint(null);
          res();
        };
      });

    // 자세는 두 개만 (손바닥 + 판마다 손등/깍지 번갈아) — 1단계는 늘 손바닥·깍지. 손바닥이 늘 처음(비누가 손바닥에 떨어짐)
    const poseList = lv === 1 ? [0, 2] : (ctx.round || 0) % 2 === 0 ? [0, 2] : [0, 1];
    const rubNeed = lv === 1 ? 1.3 : 1.5;
    const autoTap = lv < 3; // 1·2단계: 물은 저절로 잠김 (3단계 '혼자서'만 아이가 잠그기 — 물 아끼기)
    const rubAll = async () => {
      for (const i of poseList) {
        if (!alive()) return;
        if (i !== poseList[0]) {
          await this.setPose(ctx, i, alive);
          if (!alive()) return;
          // 손 자세가 바뀌었다고 알려 주기
          A.sfx("whoosh");
          C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.12, "휙!");
          S.skinFill("wet", 0.6);
          // 앞 자세에서 묻은 거품이 조금 남아 있게
          for (const p of U.sample(C.ptsIn(ctx.POSES[i].shape, 8, 0.05), 4)) S.skinDab("foam", p.x, p.y, 0.07);
          mudNow = addMud();
        }
        await rubZone("rub", { foam: true }, ctx.POSES[i].say, rubNeed, mudNow);
        if (!alive()) return;
        S.finishZone("mud");
        S.skinFade("dirt");
        S.burst(cx(), F().y + F().h * 0.4, 14, "star", 0.8);
        A.sfx("sparkle");
        C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.12, "뽀득뽀득");
        await ctx.wait(800);
      }
    };
    const TOOLS = [
      { id: "water", el: ctx.faucet },
      { id: "soap", el: ctx.pump },
      { id: "rub", el: ctx.handsHit },
      { id: "towel", el: ctx.towel },
    ];
    const steps = [
      {
        tool: "water",
        say: "수도꼭지를 눌러 물을 틀어요!",
        act: async () => {
          faucet(true);
          // 물줄기 아래에서 손이 점점 촉촉
          for (let i = 0; i < (autoTap ? 3 : 4); i++) {
            await ctx.wait(300);
            if (!alive()) return;
            S.skinFill("wet", 0.3);
          }
          await waitClose();
          if (!alive()) return;
          faucet(false);
          await ctx.wait(300);
        },
      },
      {
        tool: "soap",
        say: "비누를 눌러요!",
        act: async () => {
          U.replay(ctx.pump, "press");
          A.sfx("pop");
          const pr = ctx.pump.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
          const cen = ctx.POSES[0].cen;
          const blob = U.el("div", "hw-blob");
          const s = F().w * 0.16;
          blob.style.cssText = `--s:${s}px;transform:translate(${pr.left - hr.left + pr.width * 0.62}px,${pr.top - hr.top + pr.height * 0.1}px)`;
          ctx.scene.appendChild(blob);
          await ctx.wait(60);
          const tx = F().x + F().w * (cen[0][0] + cen[1][0]) / 2, ty = F().y + F().h * 0.5;
          blob.style.transform = `translate(${tx}px,${ty}px)`;
          await ctx.wait(580);
          blob.remove();
          if (!alive()) return;
          A.sfx("bubble");
          for (const [u, v] of cen) for (let k = 0; k < 4; k++) S.skinDab("foam", u + U.randf(-0.05, 0.05), v + U.randf(-0.06, 0.06), 0.08);
          C.pop(ctx, ctx.scene, tx, ty - F().h * 0.2, "쏙");
          await ctx.wait(300);
        },
      },
      { tool: "rub", say: "거품을 싹싹 문질러요!", act: rubAll },
      {
        tool: "water",
        say: "물로 헹궈요!",
        act: async () => {
          faucet(true);
          await this.setPose(ctx, 0, alive);
          if (!alive()) return;
          S.skinFill("wet", 0.7);
          S.skinFill("foam", 1.1);
          await rubZone("rinse", { unfoam: true, drops: true }, "싹싹 비벼서 헹궈요!", lv === 3 ? 0.9 : 0.8);
          if (!alive()) return;
          S.skinFade("foam");
          C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "쏴아");
          await ctx.wait(500);
          await waitClose();
          if (!alive()) return;
          faucet(false);
          KP.voice.say("깨끗해졌어요!");
          await ctx.wait(400);
        },
      },
      {
        tool: "towel",
        say: "수건으로 닦아요!",
        act: async () => {
          A.sfx("slide");
          ctx.towel.classList.add("away");
          ctx.towelTool = '<img alt="" src="assets/play-clay/bath/towel.png">';
          await rubZone("dry", { dry: true, sparkle: true }, "수건으로 보송보송 닦아요!", lv === 3 ? 0.8 : 0.7);
          if (!alive()) return;
          ctx.towelTool = null;
          S.setTool("", 0);
          ctx.towel.classList.remove("away");
          S.skinFade("wet");
          C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "보송보송");
          S.burst(cx(), F().y + F().h * 0.4, 24, "star", 1);
          A.sfx("sparkle");
          await ctx.wait(600);
        },
      },
    ];
    // 3단계 물감 판 (새 문장 new-voice/handwash.txt — 녹음 전에는 기기 목소리)
    const PAINT_ASK = "물감 놀이 하고 왔어요! 혼자서 씻어 볼까요?";
    const ask = lv === 1 ? null : lv === 2 ? "손을 씻어요! 먼저 뭘 할까요?" : paint ? PAINT_ASK : "밖에서 놀고 왔어요! 손에 흙이 묻었네. 혼자서 씻어 볼까요?";
    const pal = (on) => {
      ctx.pal.classList.toggle("on", on);
      if (on) U.replay(ctx.pal, "hop");
    };
    const go = () =>
      C.routine(ctx, { bar: ctx._bar || (ctx._bar = U.el("div", "kc-bar")), tools: TOOLS, steps, mode: lv, ask }).then(async (ok) => {
        if (!ok || !alive()) return;
        // 끝: 인형 친구가 폴짝 + 하트
        pal(true);
        const pr = ctx.pal.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
        KP.pfx.hearts(ctx.scene, pr.left - hr.left + pr.width / 2, pr.top - hr.top + pr.height * 0.2, 4, ctx);
        await ctx.wait(700);
        if (!alive()) return;
        ctx.score.add();
        ctx.round++;
        const big = ctx.round % 4 === 0;
        const msg = big ? "이제 진짜로 손 씻어 볼까?" : U.pick(["뽀득뽀득 깨끗한 손!", "{부름} 손 씻기 박사!", "와, 깨끗해졌어요!"]);
        // 말은 자연 음성이 있는 문장으로 (화면 글자는 그대로)
        const say = msg === "뽀득뽀득 깨끗한 손!" ? "깨끗해졌어요!" : msg === "{부름} 손 씻기 박사!" ? "{부름} 참 잘했어요!" : msg;
        const r = await ctx.win({ big, msg, say });
        pal(false);
        if (r && alive()) this.next(ctx);
      });
    // 시작: 손바닥 그림 (3단계는 흙 묻은 손) + 인형 친구 응원
    (async () => {
      await this.setPose(ctx, 0, alive);
      if (!alive()) return;
      mudNow = addMud();
      pal(true);
      ctx.after(2400, () => alive() && pal(false));
      if (lv === 1) {
        ctx.say("손을 깨끗이 씻어 볼까요? 🧼");
        ctx.after(1600, () => alive() && go());
      } else go();
    })();
  },
});

;

/* ==== js/games/play/hospital.js ==== */
/* 동물 병원 — 점토 진료실에 아이가 칠한 3D 인형 친구가 아파서 찾아와요. 의사 선생님(아이)이 증상을 보고
   알맞은 점토 도구를 끌어다 '아픈 곳'에 대면 그 부위가 반응해요 (청진기 → 가슴 콩닥, 반창고 → 무릎에 붙어 남음 …).
   병원이 무섭지 않게: 주사·피·무서운 장면 없음. 토닥토닥·꼭 안아 주기는 인형을 직접 만져서.
   1단계: 증상 하나 + 필요한 도구가 반짝 (보기 2개 → 열쇠 별 없음)
   2단계: 도구 3개 중 알맞은 것 고르기
   3단계: 두 가지를 순서대로 (예: 가시 빼고 → 반창고) — 보기 4개, 토닥토닥·꼭 안아 주기 포함
   다 나으면 웃으며 폴짝·하트·손 흔들며 나가요.
   공용: js/games/_shared/clay-stage.js(무대) · doll-actor.js(인형 배우) · doll-follow.js(부위 따라가기) · play-feedback.js(반응) */
"use strict";
KP.game({
  id: "hospital",
  icon: "🏥",
  name: "동물 병원",
  cat: "play",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    const IMG = "assets/play-clay/hospital/";
    ctx.IMG = IMG;
    KP.css("hospital", `
      .hpWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px;gap:8px}
      .hpRoom{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#f3e2c8;container-type:size}
      .hpOv{position:absolute;inset:0;pointer-events:none;--dh:300px}
      .hpOv>*{position:absolute;left:0;top:0;pointer-events:none}
      .hpT{will-change:transform}
      .hpT>*{position:relative;display:block}
      .hpSteps{position:absolute;left:2.4cqw!important;top:3cqh;display:flex;gap:1.2cqw;background:rgba(255,250,240,.88);border-radius:999px;padding:1cqh 1.6cqw;z-index:6;box-shadow:0 3px 0 rgba(120,80,40,.12)}
      .hpSteps i{width:min(5.5cqh,5cqw);height:min(5.5cqh,5cqw);border-radius:50%;background:#e6dccd;transition:background .3s,transform .3s}
      .hpSteps i.on{background:#ff8fab;transform:scale(1.15)}
      .hpBub{position:relative;display:flex;align-items:center;gap:.2em;background:#fffaf2;border-radius:999px;padding:.18em .55em;box-shadow:0 4px 0 rgba(120,80,40,.14);font-size:max(16px,calc(var(--dh)*.075));white-space:nowrap;color:var(--ink);transform-origin:0 100%;animation:popIn .4s .5s backwards;z-index:8}
      .hpBub .m{font-size:1.3em;line-height:1}
      .hpBub:after{content:"";position:absolute;left:.7em;bottom:-.35em;width:.7em;height:.7em;background:#fffaf2;transform:rotate(45deg);border-radius:0 0 .15em 0}
      .hpZone{border-radius:40%;z-index:4}
      .hpZone.on{pointer-events:auto;touch-action:none}
      /* 아픈 곳 빛 고리는 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .hpZone::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:0 0 0 calc(var(--dh)*.04) rgba(255,143,171,.3)}
      .hpZone.ask{animation:none}
      .hpZone.ask::after{animation:hpAsk 1.6s ease-in-out infinite}
      @keyframes hpAsk{50%{opacity:1}}
      .hpSpot{width:calc(var(--dh)*.24);height:calc(var(--dh)*.24);border-radius:50%;border:4px dashed rgba(255,197,49,.0);transition:border-color .2s,background .2s;z-index:5}
      .hpSpot.show{border-color:rgba(255,190,40,.95);background:rgba(255,230,140,.25);animation:hpSpotP 1s ease-in-out infinite}
      .hpSpot.near{border-style:solid;border-color:#ffb21e;background:rgba(255,220,120,.4)}
      @keyframes hpSpotP{50%{scale:1.12}}
      /* 증상 */
      .hpScrape{width:calc(var(--dh)*.11);height:calc(var(--dh)*.08);border-radius:50%;background:radial-gradient(ellipse at 45% 45%,#ff8f9c 0 35%,#ff6f86 55%,rgba(255,111,134,0) 72%);transition:opacity .8s,width .8s,height .8s}
      .hpScrape.better{opacity:.45;width:calc(var(--dh)*.08);height:calc(var(--dh)*.06)}
      .hpThorn{width:0;height:0;border-left:calc(var(--dh)*.018) solid transparent;border-right:calc(var(--dh)*.018) solid transparent;border-bottom:calc(var(--dh)*.07) solid #5e8f3c;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3));transform-origin:50% 100%}
      .hpThorn.fly{transition:translate .7s ease-in,opacity .7s;translate:calc(var(--dh)*.3) calc(var(--dh)*-.6);opacity:0}
      .hpDots{width:calc(var(--dh)*.1);height:calc(var(--dh)*.1)}
      .hpDots i{position:absolute;width:32%;height:32%;border-radius:50%;background:#ff8fa0;box-shadow:0 0 0 2px rgba(255,170,180,.5);transition:opacity .8s}
      .hpDots.gone i{opacity:0}
      .hpSwirl{font-size:calc(var(--dh)*.1);line-height:1;animation:spin 3s linear infinite}
      .hpWord{font-size:calc(var(--dh)*.07);color:#7a6a9a;font-weight:bold;white-space:nowrap;animation:hpPuff 2.6s ease-out infinite}
      @keyframes hpPuff{0%,35%{opacity:0;translate:0 0;scale:.6}50%{opacity:1;translate:10% -20%;scale:1}100%{opacity:0;translate:40% -90%;scale:1.15}}
      .hpDrop{font-size:calc(var(--dh)*.09);line-height:1;animation:hpDrip 1.8s ease-in infinite}
      @keyframes hpDrip{0%{translate:0 -20%;scale:.4;opacity:0}30%{opacity:1;scale:1}100%{translate:0 150%;scale:.8;opacity:0}}
      /* 도구 쓰기 */
      .hpUse{width:calc(var(--dh)*var(--k,.3));height:calc(var(--dh)*var(--k,.3));z-index:7}
      .hpUse img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 5px rgba(80,40,20,.3))}
      .hpUse.in{animation:hpUseIn .35s cubic-bezier(.2,1.5,.4,1) backwards}
      @keyframes hpUseIn{from{scale:.3;opacity:0}}
      .hpUse.rub img{animation:hpRub .45s ease-in-out infinite}
      @keyframes hpRub{0%,100%{translate:0 0;rotate:0deg}25%{translate:-22% 6%;rotate:-10deg}75%{translate:22% -6%;rotate:10deg}}
      .hpUse.beat img{animation:hpBeat .55s ease-in-out infinite}
      @keyframes hpBeat{30%{scale:1.08}}
      .hpUse.tilt img{animation:hpTilt 1.4s ease-in-out forwards}
      @keyframes hpTilt{30%,75%{rotate:-28deg;translate:-8% -10%}}
      .hpUse.pull img{animation:hpPull 1.3s ease-in-out forwards}
      @keyframes hpPull{0%{translate:20% -40%}35%,55%{translate:5% -5%}100%{translate:35% -90%}}
      .hpUse.hold img{animation:hpHold 1.4s ease-in-out}
      @keyframes hpHold{20%{translate:0 4%}50%{translate:0 -2%}}
      .hpUse.out{transition:opacity .4s,scale .4s;opacity:0;scale:.6}
      .hpStick{width:calc(var(--dh)*.17);height:calc(var(--dh)*.17);z-index:6;animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .hpStick img{width:100%;height:100%;object-fit:contain;rotate:-24deg;filter:drop-shadow(0 2px 2px rgba(80,40,20,.25))}
      .hpFloat{font-size:calc(var(--dh)*.08);font-weight:bold;color:#ff6f91;white-space:nowrap;text-shadow:0 2px 0 #fff,0 0 6px #fff;animation:hpFloatUp 1.2s ease-out forwards;z-index:9}
      @keyframes hpFloatUp{from{translate:0 0;opacity:0;scale:.6}20%{opacity:1;scale:1.1}to{translate:0 -120%;opacity:0}}
      .hpZz{font-size:calc(var(--dh)*.09);animation:hpZz 1.8s ease-out forwards;z-index:9}
      @keyframes hpZz{from{translate:0 0;scale:.4;opacity:0}30%{opacity:1}to{translate:60% -160%;scale:1.2;opacity:0}}
      .hpGuide{width:84px;height:84px;z-index:30;pointer-events:none;transition:transform 1s cubic-bezier(.4,0,.3,1),opacity .3s}
      .hpGuide img{width:100%;height:100%;object-fit:contain;opacity:.85}
      .hpLoad{left:50%!important;top:45%!important;transform:translate(-50%,-50%);background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      /* 도구 쟁반 (점토) */
      .hpTray{flex:0 0 auto;display:flex;gap:clamp(10px,2.2vw,22px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:clamp(96px,12vw,128px);
        background:linear-gradient(#f7ead6,#efdcc0);border-radius:28px;padding:8px 12px;box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12);transition:opacity .3s}
      .hpTray.off{opacity:.5;pointer-events:none}
      .hpTool{position:relative;width:clamp(80px,10.5vw,112px);height:clamp(80px,10.5vw,112px);border-radius:26px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);box-shadow:0 6px 0 rgba(140,95,50,.18),inset 0 -4px 0 rgba(160,110,60,.1);display:flex;align-items:center;justify-content:center;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)}
      .hpTool img{width:84%;height:84%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(80,40,20,.22))}
      .hpTool.dragging{z-index:60;background:transparent;box-shadow:none}
      .hpTool.dragging img{width:110%;height:110%}
      .hpTool.used{visibility:hidden}
      /* 쓸 도구 빛 고리는 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임).
         예전 반짝임은 안쪽 그림자(inset)를 빼고 그렸으므로 그대로 뺌 · animation:none 은 들어오는 효과(itemIn)가 다시 돌지 않게 */
      .hpTool.glow{animation:none;box-shadow:0 6px 0 rgba(140,95,50,.18)}
      .hpTool::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:0 0 0 10px rgba(255,197,49,.65)}
      .hpTool.glow::after{animation:hpGlow 1.3s ease-in-out infinite}
      @keyframes hpGlow{50%{opacity:1}}
      @media (orientation:portrait){.hpTool{width:clamp(72px,18vw,104px);height:clamp(72px,18vw,104px)}.hpTray{gap:10px}}
      @media (orientation:landscape) and (max-height:520px){
        .hpWrap{flex-direction:row;padding:0 10px 8px}
        .hpTray{flex-direction:row;width:calc(2*78px + 30px);min-height:0;gap:8px;align-content:center;padding:6px}
        .hpTool{width:76px;height:76px;border-radius:20px}
      }
    `);
    // 도구: 그림·이름·1단계 안내·잘못 골랐을 때 설명·쓴 뒤 말·연출·어디에 대나(부위)·크기(인형 키 비율)
    ctx.T = {
      band: { n: "반창고", ask: "반창고를 붙여 줘요!", use: "반창고는 다친 곳에 붙여요.", done: "반창고 착!", fx: "stick", at: "spot", k: 0.24 },
      oint: { n: "연고", ask: "연고를 쓱쓱 발라 줘요!", use: "연고는 상처나 가려운 곳에 발라요.", done: "쓱쓱, 발랐어요!", fx: "rub", at: "spot", k: 0.3 },
      thermo: { n: "체온계", ask: "체온계로 열을 재 줘요!", use: "체온계는 열이 나는지 재요.", done: "삐빅! 열을 쟀어요.", fx: "thermo", at: "mouth", k: 0.3 },
      blanket: { n: "담요", ask: "담요를 덮어 줘요!", use: "담요는 푹 쉴 때 덮어요.", done: "쿨쿨, 푹 쉬어요.", fx: "blanket", at: "belly", k: 0.62 },
      steth: { n: "청진기", ask: "청진기로 콩닥콩닥 소리를 들어 줘요!", use: "청진기는 몸속 소리를 들어요.", done: "콩닥콩닥, 잘 들려요!", fx: "beat", at: "chest", k: 0.34 },
      tea: { n: "따뜻한 차", ask: "따뜻한 차를 줘요!", use: "따뜻한 차는 목이나 배가 아플 때 마셔요.", done: "호로록, 따뜻해요!", fx: "drink", at: "mouth", k: 0.28 },
      tweez: { n: "핀셋", ask: "핀셋으로 가시를 쏙 빼 줘요!", use: "핀셋은 가시를 뺄 때 써요.", done: "쏙! 가시가 빠졌어요!", fx: "pull", at: "spot", k: 0.3 },
      ice: { n: "얼음주머니", ask: "얼음주머니를 대 줘요!", use: "얼음주머니는 부딪친 곳에 대요.", done: "아, 시원해요!", fx: "ice", at: "spot", k: 0.3 },
      tissue: { n: "휴지", ask: "휴지로 코를 닦아 줘요!", use: "휴지는 콧물을 닦을 때 써요.", done: "흥! 코가 뻥 뚫렸어요!", fx: "rub", at: "nose", k: 0.28 },
      teddy: { n: "곰 인형", ask: "곰 인형을 안겨 줘요!", use: "곰 인형은 속상할 때 꼭 안아요.", done: "곰 인형을 꼭 안았어요!", fx: "teddy", at: "chest", k: 0.36 },
    };
    // 손으로 하는 돌봄 (3단계 두 번째 순서) — 인형을 직접 만져서
    ctx.ACT = {
      pat: { ask: "토닥토닥 해 줘요!", hint: "친구를 토닥토닥 해 줘요!" },
      hug: { ask: "꼭 안아 줘요!", hint: "친구를 꾹 누르고 꼭 안아 줘요!" },
    };
    // 증상 (어느 인형이든): 아픈 곳(spot: 부위 이름)·말풍선·증상 문장·1·2단계 도구·3단계 순서와 안내·헷갈리는 도구(보기에서 뺌)
    ctx.P = [
      { id: "knee", spot: "kneeR", w: "아야", m: "😣", mood: "pain", say: "넘어져서 무릎이 까졌어요.", one: "band", seq: ["oint", "band"], seqSay: "먼저 연고를 바르고, 반창고를 붙여 줘요!", near: ["oint", "band", "ice"] },
      { id: "fever", spot: "forehead", w: "뜨거워", m: "🥵", mood: "sick", blush: "fever", say: "열이 나요. 몸이 뜨끈뜨끈해요.", one: "thermo", seq: ["thermo", "blanket"], seqSay: "먼저 체온계로 열을 재고, 담요를 덮어 줘요!", near: ["thermo", "blanket", "tea", "ice"] },
      { id: "cough", spot: "chest", w: "콜록", m: "😖", mood: "sick", say: "콜록콜록 기침을 해요.", one: "steth", seq: ["steth", "tea"], seqSay: "먼저 청진기로 소리를 듣고, 따뜻한 차를 줘요!", near: ["steth", "tea", "blanket", "thermo", "tissue"] },
      { id: "thorn", spot: "handR", w: "아야", m: "😣", mood: "pain", say: "손에 가시가 콕 박혔어요.", one: "tweez", seq: ["tweez", "band"], seqSay: "먼저 핀셋으로 가시를 빼고, 반창고를 붙여 줘요!", near: ["tweez", "band", "oint"] },
      { id: "tummy", spot: "belly", w: "꾸르륵", m: "😖", mood: "sick", say: "배가 아파요. 꾸르륵 꾸르륵.", one: "tea", seq: ["tea", "pat"], seqSay: "먼저 따뜻한 차를 주고, 배를 살살 토닥토닥 해 줘요!", near: ["tea", "blanket", "teddy"] },
      { id: "sad", spot: "chest", w: "흑흑", m: "😢", mood: "sick", say: "풍선을 놓쳐서 속상해요.", one: "teddy", seq: ["teddy", "hug"], seqSay: "먼저 곰 인형을 안겨 주고, 꼭 안아 줘요!", near: ["teddy", "tea", "blanket"] },
      { id: "bump", spot: "headTop", w: "아야", m: "😣", mood: "pain", say: "콩! 머리에 혹이 났어요.", one: "ice", seq: ["ice", "pat"], seqSay: "먼저 얼음주머니를 대 주고, 토닥토닥 해 줘요!", near: ["ice", "oint", "band"] },
      { id: "sneeze", spot: "nose", w: "에취", m: "🤧", mood: "sick", say: "에취! 콧물이 주르륵 나요.", one: "tissue", seq: ["tissue", "tea"], seqSay: "먼저 휴지로 코를 닦고, 따뜻한 차를 줘요!", near: ["tissue", "tea", "blanket", "thermo", "steth"] },
      { id: "itch", spot: "armL", w: "가려워", m: "😖", mood: "sick", say: "모기에 물려서 간지러워요.", one: "oint", seq: ["oint", "pat"], seqSay: "먼저 연고를 바르고, 살살 토닥토닥 해 줘요!", near: ["oint", "band", "ice"] },
    ];
    // 진료실 배경 (1600×900): 지평선·화각·잘릴 때 남길 곳(방석)·햇빛(오른쪽 창문)·자리
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1600, 900], vh: 0.28, near: 0.2, fov: 34, focus: [0.49, 0.6], focusP: [0.49, 0.62],
      sun: [0.55, 1, 0.75], sunCol: "#fff1de", spots: { seat: [0.49, 0.695] },
    };
    ctx.wrap = U.el("div", "hpWrap");
    ctx.room = U.el("div", "hpRoom");
    ctx.tray = U.el("div", "hpTray");
    ctx.wrap.append(ctx.room, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },

  /* ---------- 무대 · 인형 ---------- */
  /** 무대 만들기 (3D 가 되면 3D, 아니면 그림) — 화면이 끊기면 새로, 너무 느리면 그림으로 */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("hospital:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => {
        if (!ctx._active || ctx.st !== st) return;
        this.start(ctx, true); // 새 무대로 지금 환자부터 다시
      },
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("hospital:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    let st;
    try {
      st = CS.create(ctx.room, ctx.BG, opt);
    } catch (e) {
      // WebGL 을 아예 못 만들면 그림 무대
      opt.flat = true;
      st = CS.create(ctx.room, ctx.BG, opt);
    }
    ctx.st = st;
    ctx.ov = KP.u.el("div", "hpOv");
    st.ui.appendChild(ctx.ov);
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
    ctx.ov = null;
  },
  /** 환자 인형 고르기: 아이가 칠한 인형(지난번과 다른 것) → 없으면 기본 색 인형 */
  pickDoll(ctx) {
    const U = KP.u, D = KP.DOLL;
    const list = ctx.dolls || [];
    if (list.length) {
      const c = list.length > 1 ? list.filter((x) => x.id !== ctx.lastDoll) : list;
      const it = U.pick(c);
      ctx.lastDoll = it.id;
      return { item: it };
    }
    const sp = U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },

  async start(ctx, again) {
    ctx.round = again ? ctx.round : 0;
    if (!again) ctx.last = null;
    const tok = ++ctx.token;
    ctx.tray.innerHTML = "";
    ctx.room.querySelectorAll(".hpLoad").forEach((e) => e.remove());
    const wait = KP.u.el("div", "hpLoad", KP.E("🧸") + " 준비 중");
    const wt = ctx.after(400, () => ctx.room.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      if (ctx.track) ctx.track();
    });
    return this.next(ctx); // 첫 환자 준비 중 오류는 놀이 틀(다시 하기 화면)이 받음
  },
  stop(ctx) {
    ctx.token++;
    this.dropStage(ctx);
  },

  async next(ctx) {
    const U = KP.u,
      A = KP.audio,
      T = ctx.T,
      FX = KP.pfx,
      st = ctx.st,
      IMG = ctx.IMG;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    const P = U.pick(ctx.P.filter((p) => p !== ctx.last));
    ctx.last = P;
    const steps = lv === 3 ? P.seq.slice() : [P.one];
    const toolSteps = steps.filter((s) => T[s]);
    const nOpt = lv === 1 ? 2 : lv === 2 ? 3 : 4;
    const distract = U.sample(Object.keys(T).filter((k) => !P.near.includes(k)), nOpt - toolSteps.length);
    const opts = U.shuffle([...toolSteps, ...distract]);
    ctx._fewChoice = opts.length < 3; // 보기 2개(찍어도 반)는 열쇠 별 없음
    const room = ctx.room,
      ov = ctx.ov;
    ov.innerHTML = "";
    ctx.track = null;
    ctx.tray.innerHTML = "";
    ctx.tray.classList.add("off");

    /* ---------- 인형 배우 ---------- */
    const pick = this.pickDoll(ctx);
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    let act;
    try {
      act = st.gl ? await KP.dollActor.create(st, pick) : await KP.dollActor.create2D(st, pick);
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (!live()) return;
      act = await KP.dollActor.create2D(st, { species: "bear" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    const name = act.name;
    let leaving = false,
      heldTeddy = false,
      stick = null;
    // 자리·크기: 방석 위, 놀이 영역 높이의 약 절반 (세로 화면은 조금 더 크게)
    const layout = () => {
      const seat = st.spot("seat"), tall = st.h > st.w;
      const frac = tall ? 0.5 : st.h < 420 ? 0.6 : 0.58;
      const h = st.fitH(seat[0], seat[1], frac);
      act.setH(h);
      return seat;
    };
    let seat = layout();
    st.onResize = () => {
      const s = layout();
      if (act.a.state === "idle" && !act._jump && !leaving) act.place(s[0], s[1]);
      seat = s;
    };
    // 들어오기: 똑똑 → 오른쪽에서 폴짝
    const offX = (side) => {
      const b = act.box(), hwPx = b.w / 2 + 20;
      return seat[0] + st.pxToWorld(seat[0], seat[1], side > 0 ? st.w - st.project(seat[0], 0, seat[1]).x + hwPx : -st.project(seat[0], 0, seat[1]).x - hwPx);
    };
    act.place(seat[0], seat[1]);
    act.place(offX(1), seat[1]);
    act.mood(P.mood, P.blush);
    act.sick(1);
    A.noise({ bp: 500, q: 2, dur: 0.07, vol: 0.3, when: 0.1 });
    A.noise({ bp: 500, q: 2, dur: 0.07, vol: 0.3, when: 0.3 });
    const enter = act.jumpTo(seat[0], seat[1], 0.8, 0.5);

    /* ---------- 화면에 붙는 것들 (부위를 따라감) ---------- */
    // 부위를 따라가는 것은 바깥 껍데기(hpT)만 옮김 — 안쪽 그림은 마음대로 움직이는 효과(회전·톡 튀어나오기)를 써도 됨 (공용 doll-follow.js)
    const fw = KP.dollFollow(ov, act, { cls: "hpT" });
    const follow = (el, nm, dx = 0, dy = 0, rot = 0) => fw.add(el, nm, dx, dy, rot);
    const unfollow = (el) => fw.remove(el);
    const kill = (el) => fw.kill(el);
    const zone = U.el("div", "hpZone");
    ov.appendChild(zone);
    const spotEl = U.el("div", "hpSpot");
    const bubW = U.el("span", "hpBubW");
    const bub = U.el("div", "hpBub", '<span class="m">' + KP.E(P.m) + "</span><span>" + P.w + "</span>");
    bubW.appendChild(bub);
    ov.append(bubW);
    let dh = 300;
    ctx.track = () => {
      const b = act.box();
      dh = Math.max(60, b.h);
      ov.style.setProperty("--dh", dh + "px");
      zone.style.cssText = `left:${b.l - b.w * 0.08}px;top:${b.t - b.h * 0.04}px;width:${b.w * 1.16}px;height:${b.h * 1.06}px`;
      fw.dh = dh;
      for (const o of fw.list) fw.place(o);
      // 말풍선: 머리 오른쪽 위 (방 안으로)
      const hp = act.anchor("forehead"), bsz = U.sizeOf(bub), bw = bsz.w, bh = bsz.h;
      const bx = U.clamp(hp.x + dh * 0.18, 6, st.w - bw - 6), by = U.clamp(hp.y - dh * 0.42 - bh, 6, st.h - bh - 6);
      bubW.style.transform = `translate(${bx}px,${by}px)`;
    };

    // 증상 꾸밈 (피·상처 그림 없이 부드럽게) — 아픈 부위에
    const marks = [];
    const mk = (cls, nm, html = "", dx = 0, dy = 0, rot = 0) => {
      const e = U.el("span", cls, html);
      follow(e, nm, dx, dy, rot);
      marks.push(e);
      return e;
    };
    let scrape = null, thorn = null;
    if (P.id === "knee") scrape = mk("hpScrape", "kneeR");
    if (P.id === "thorn") thorn = mk("hpThorn", "handR", "", 0.0, -0.03, 25);
    if (P.id === "bump") {
      act.bump("headTop", 0.06);
      act.glow("headTop", "#ff8fa0", 0.45, 0.1);
    }
    if (P.id === "itch") {
      const d = mk("hpDots", "armL", "<i></i><i></i><i></i>");
      [[10, 10], [58, 22], [28, 62]].forEach(([x, y], i) => Object.assign(d.children[i].style, { left: x + "%", top: y + "%" }));
    }
    if (P.id === "tummy") {
      mk("hpSwirl", "belly", KP.E("🌀"));
      mk("hpWord", "belly", "꾸르륵", 0.2, -0.04);
    }
    if (P.id === "fever") {
      act.glow("forehead", "#ff5a4a", 0.55, 0.24);
      mk("hpDrop", "forehead", KP.E("💦"), 0.17, 0.0);
      mk("hpDrop", "forehead", KP.E("💦"), -0.16, 0.04).style.animationDelay = "0.9s";
    }
    if (P.id === "cough") mk("hpWord", "mouth", "콜록!", 0.2, 0);
    if (P.id === "sad") {
      mk("hpDrop", "eyeR", KP.E("💧"), 0.01, 0.04);
      mk("hpDrop", "eyeL", KP.E("💧"), -0.01, 0.04).style.animationDelay = "0.8s";
    }
    if (P.id === "sneeze") mk("hpDrop", "nose", KP.E("💧"), 0, 0.04);
    const clearMarks = () => {
      marks.forEach(kill);
      marks.length = 0;
    };
    const spotOf = (k) => (T[k].at === "spot" ? P.spot : T[k].at);
    const host = ov;
    const pt = (nm, dx = 0, dy = 0) => {
      const p = act.anchor(nm);
      return { x: p.x + dx * dh, y: p.y + dy * dh };
    };

    /* ---------- 도구 쟁반 ---------- */
    const tray = ctx.tray;
    let si = 0,
      busy = false,
      lastXY = null,
      dragFrom = null,
      moved = 0;
    const els = {};
    const R = () => Math.max(46, dh * 0.2); // 부위에 닿았다고 보는 거리 (px)
    const nearSpot = (k) => {
      if (!lastXY) return false;
      const p = act.anchor(spotOf(k));
      return Math.hypot(p.x - lastXY.x, p.y - lastXY.y) <= R();
    };
    const toRoom = (x, y) => {
      const r = room.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };
    const showSpot = (k, on) => {
      if (on) {
        const o = fw.find(spotEl);
        if (!o) follow(spotEl, spotOf(k));
        else o.nm = spotOf(k);
        spotEl.classList.add("show");
      } else {
        spotEl.classList.remove("show", "near");
      }
    };
    opts.forEach((k, i) => {
      const t = T[k];
      const b = U.el("div", "hpTool item", '<img alt="" draggable="false" src="' + IMG + k + '.png">');
      b.setAttribute("aria-label", t.n);
      b.style.animationDelay = 300 + i * 80 + "ms";
      b.dataset.k = k;
      if (toolSteps.includes(k)) b.dataset.right = "1"; // 손가락 힌트가 가리키면 열쇠 별 없음
      if (lv === 1 && toolSteps.includes(k)) b.classList.add("glow"); // 1단계: 필요한 도구만 반짝
      tray.appendChild(b);
      els[k] = b;
      const d = KP.drag(b, {
        targets: () => (busy || !T[steps[si]] ? [] : [zone]),
        pad: 30,
        snap: false,
        onPick: (el) => {
          dragFrom = null;
          moved = 0;
          lastXY = null;
          FX.press(el);
          // 아픈 곳 보여 주기 — 어떤 도구를 집어도 같은 곳 (정답 도구가 드러나지 않게)
          if (T[steps[si]] && !busy) showSpot(steps[si], true);
        },
        onMove: (x, y) => {
          if (!dragFrom) dragFrom = { x, y };
          moved = Math.max(moved, Math.hypot(x - dragFrom.x, y - dragFrom.y));
          lastXY = toRoom(x, y);
          if (T[steps[si]]) spotEl.classList.toggle("near", nearSpot(steps[si]));
        },
        accept: () => k === steps[si] && nearSpot(k),
        onReject: () => {
          showSpot(k, false);
          if (k !== steps[si]) {
            act.react(lastXY ? act.hit(lastXY.x, lastXY.y) || "chest" : "chest", -0.02);
            if (steps.indexOf(k) > si) ctx.miss(b, "먼저 " + T[steps[si]].ask);
            else ctx.miss(b, t.use + " 다른 걸 골라 볼까?");
          } else {
            // 맞는 도구인데 아픈 곳이 아닌 데 댐 → 아픈 곳을 보여 줌
            ctx.miss(b, "아픈 곳에 대 줘요!", { soft: true });
            const p = act.anchor(spotOf(k));
            FX.ring(host, p.x, p.y, "#ffb21e", ctx, dh * 0.3);
            showSpot(k, true);
            ctx.after(1600, () => !busy && showSpot(k, false));
          }
        },
        onDrop: (tg) => {
          if (!tg) {
            showSpot(k, false);
            // 콕 누르기만 했으면: 어디에 대는지 보여 주기 (끌어다 대기 안내)
            if (moved < 12 && !busy && live()) guide(k, b);
            return;
          }
          if (busy) return;
          d.lock();
          b.classList.remove("glow");
          b.classList.add("used");
          b.style.transform = "";
          showSpot(k, false);
          useTool(k);
        },
      });
    });
    let guideEl = null;
    /** 도구를 콕 누르기만 하면: 그 도구 그림이 아픈 곳까지 날아가 보여 줌 (끌어다 대기 안내)
        — 어떤 도구든 똑같이 (정답 도구가 드러나지 않게), 도구 이름만 말해 줌 */
    const guide = (k, b) => {
      if (guideEl || !T[steps[si]]) return;
      const sp = spotOf(steps[si]);
      const br = b.getBoundingClientRect(), from = toRoom(br.left + br.width / 2, br.top + br.height / 2), to = act.anchor(sp);
      guideEl = U.el("div", "hpGuide", '<img alt="" src="' + IMG + k + '.png">');
      guideEl.style.transform = `translate(${from.x - 42}px,${from.y - 42}px)`;
      host.appendChild(guideEl);
      showSpot(steps[si], true);
      KP.voice.say(T[k].n + "! 끌어서 아픈 곳에 대 줘요!");
      requestAnimationFrame(() => guideEl && (guideEl.style.transform = `translate(${to.x - 42}px,${to.y - 42}px)`));
      ctx.after(1400, () => {
        if (guideEl) guideEl.remove();
        guideEl = null;
        if (!busy) showSpot(steps[si], false);
      });
    };

    /* ---------- 손으로 돌보기: 토닥토닥(누르기·문지르기) / 꼭 안아 주기(꾹 누르기) ---------- */
    let mode = null,
      pressing = false,
      lx = 0,
      ly = 0,
      dist = 0,
      pats = 0,
      shortHug = 0,
      hugT = null,
      pid = null;
    const patOne = (e) => {
      pats++;
      A.note(["C5", "E5", "G5", "A5", "C6", "E6"][Math.min(5, pats - 1)], { inst: "marimba", dur: 0.25, vol: 0.2 });
      A.sfx("rub");
      const p = toRoom(e.clientX, e.clientY);
      const part = act.hit(p.x, p.y) || "belly";
      act.poke(part, -0.03, 0.14); // 만진 자리가 쏙 들어갔다 나옴
      act.a.sqv = 3;
      FX.hearts(host, p.x, p.y, 1, ctx);
      if (pats >= 6) {
        mode = null;
        pressing = false;
        zone.classList.remove("on", "ask");
        KP.voice.say("토닥토닥.");
        act.happy();
        careDone();
      }
    };
    zone.addEventListener("pointerdown", (e) => {
      if (!mode || !live()) return;
      e.preventDefault();
      if (pressing) return; // 이미 한 손가락으로 누르는 중이면 다른 손가락·손바닥은 무시
      pid = e.pointerId;
      A.unlock();
      try {
        zone.setPointerCapture(e.pointerId);
      } catch (_) {}
      pressing = true;
      lx = e.clientX;
      ly = e.clientY;
      dist = 0;
      if (mode === "pat") patOne(e);
      else if (mode === "hug") {
        act.hug(true);
        act.leanT = 1;
        act.a.sqv = 3;
        A.tone(330, { to: 660, dur: 1, vol: 0.12, type: "triangle" });
        const p = pt("chest");
        FX.float(host, p.x, p.y, KP.E("💗"), "hpFloat", 1100, ctx);
        hugT = ctx.after(1000, () => {
          if (!pressing || mode !== "hug") return;
          mode = null;
          pressing = false;
          zone.classList.remove("on", "ask");
          act.leanT = 0;
          A.sfx("sparkle");
          const q = pt("chest");
          FX.hearts(host, q.x, q.y, 6, ctx);
          KP.voice.say("꼭 안아 줬어요!");
          act.happy();
          careDone();
        });
      }
    });
    zone.addEventListener("pointermove", (e) => {
      if (!pressing || mode !== "pat" || e.pointerId !== pid) return;
      dist += U.dist(lx, ly, e.clientX, e.clientY);
      lx = e.clientX;
      ly = e.clientY;
      if (dist > 70) {
        dist = 0;
        patOne(e);
      }
    });
    const up = (e) => {
      if (!pressing || e.pointerId !== pid) return;
      pressing = false;
      if (mode === "hug") {
        ctx.cancel(hugT);
        act.hug(heldTeddy);
        act.leanT = 0;
        shortHug++;
        if (shortHug === 2) KP.voice.say("손가락을 꾹 누르고 기다려요!");
      }
    };
    zone.addEventListener("pointerup", up);
    zone.addEventListener("pointercancel", up);

    /* ---------- 진행 ---------- */
    let dots = [];
    if (steps.length > 1) {
      const sEl = U.el("div", "hpSteps", steps.map(() => "<i></i>").join(""));
      ov.appendChild(sEl);
      dots = [...sEl.children];
    }
    const askOf = (s) => (T[s] ? T[s].ask : ctx.ACT[s].ask);
    const startStep = () => {
      const s = steps[si];
      if (T[s]) {
        mode = null;
        zone.classList.remove("on", "ask");
        tray.classList.remove("off");
        ctx.hint(() => els[s], si > 0 ? "이제 " + T[s].ask : lv === 3 ? P.seqSay : T[s].ask);
      } else {
        mode = s;
        pats = 0;
        shortHug = 0;
        tray.classList.add("off");
        zone.classList.add("on", "ask");
        ctx.hint(() => zone, ctx.ACT[s].hint);
      }
    };
    const stepDone = async () => {
      if (dots[si]) dots[si].classList.add("on");
      si++;
      ctx.hint(null);
      if (si >= steps.length) return cure();
      await ctx.wait(500);
      if (!live()) return;
      // 말은 이모지 없이 따로 → 👩‍⚕️ 의 이음 글자(U+200D)가 문장 앞에 남지 않아 자연 음성 키와 같은 문장이 됨
      ctx.say("👩‍⚕️ 이제 " + askOf(steps[si]), "이제 " + askOf(steps[si]));
      startStep();
    };
    const careDone = async () => {
      await ctx.wait(900);
      if (!live()) return;
      stepDone();
    };
    /** 도구를 아픈 곳에 댔을 때: 도구 그림이 그 부위에 붙어 움직이고, 인형의 그 부위가 반응 */
    const useTool = async (k) => {
      const t = T[k];
      busy = true;
      ctx.hint(null);
      tray.classList.add("off");
      const nm = spotOf(k);
      const use = U.el("div", "hpUse in", '<img alt="" src="' + IMG + k + '.png">');
      use.style.setProperty("--k", t.k);
      const o = follow(use, nm, 0, 0);
      const drop = (ms) =>
        ctx.after(ms, () => {
          use.classList.add("out");
          ctx.after(450, () => kill(use));
        });
      act.react(nm, 0.03);
      FX.ring(host, pt(nm).x, pt(nm).y, "#fff2b0", ctx, dh * 0.3);
      if (t.fx === "stick") {
        // 반창고: 그 부위에 붙어 남음 (인형을 따라감)
        kill(use);
        stick = U.el("span", "hpStick", '<img alt="" src="' + IMG + "band.png" + '">');
        follow(stick, nm, 0, 0);
        A.sfx("snap");
        if (scrape) kill(scrape);
        ctx.after(300, () => FX.burst(host, pt(nm).x, pt(nm).y, "spark", 6, ctx));
        act.mood("sick");
      } else if (t.fx === "rub") {
        use.classList.add("rub");
        o.dx = k === "tissue" ? 0.04 : 0.03;
        o.dy = k === "tissue" ? 0.06 : -0.02;
        [0, 300, 600, 900, 1200].forEach((w) => ctx.after(w, () => (A.sfx("rub"), act.poke(nm, -0.015, 0.12))));
        if (k === "oint") act.glow(nm, "#ffffff", 0.45, 0.12);
        ctx.after(1300, () => {
          A.sfx("sparkle");
          FX.burst(host, pt(nm).x, pt(nm).y, "dust", 7, ctx);
          if (scrape) scrape.classList.add("better");
          if (P.id === "itch") marks.forEach((m) => m.classList.add("gone"));
          if (k === "tissue") {
            clearMarks();
            FX.float(host, pt("nose").x + dh * 0.2, pt("nose").y, "흥!", "hpFloat", 1200, ctx);
          }
          if (k === "oint") act.glow(nm, "#ffffff", 0, 0.12);
        });
        drop(1500);
      } else if (t.fx === "thermo") {
        // 체온계 끝(그림 왼쪽 아래)이 입에 닿게
        use.classList.add("hold");
        o.dx = 0.11;
        o.dy = -0.1;
        [600, 820].forEach((w) => ctx.after(w, () => FX.sound("beep")));
        ctx.after(820, () => FX.float(host, pt("mouth").x + dh * 0.25, pt("mouth").y - dh * 0.1, "삐빅!", "hpFloat", 1200, ctx));
        ctx.after(900, () => act.glow("forehead", "#ff6b5a", 0.2, 0.2));
        drop(1500);
      } else if (t.fx === "ice") {
        use.classList.add("hold");
        o.dy = -0.05;
        FX.sound("cool");
        ctx.after(300, () => FX.burst(host, pt(nm).x, pt(nm).y, "cool", 8, ctx));
        ctx.after(500, () => {
          act.bump("headTop", 0.012);
          act.glow("headTop", "#ff8fa0", 0.1, 0.1);
        });
        drop(1500);
      } else if (t.fx === "beat") {
        // 청진기: 가슴이 콩닥콩닥 (부위가 부풀었다 들어감) + 하트
        use.classList.add("beat");
        o.dy = 0.02;
        [300, 520, 1000, 1220].forEach((w) =>
          ctx.after(w, () => {
            FX.sound("thump");
            act.poke("chest", 0.035, 0.14);
          })
        );
        [400, 1100].forEach((w) => ctx.after(w, () => FX.hearts(host, pt("chest").x, pt("chest").y, 1, ctx)));
        drop(1600);
      } else if (t.fx === "drink") {
        use.classList.add("tilt");
        o.dx = 0.04;
        o.dy = 0.05;
        act.leanT = 0.4;
        ctx.after(600, () => FX.sound("sip"));
        ctx.after(1200, () => (act.leanT = 0));
        drop(1500);
      } else if (t.fx === "pull") {
        use.classList.add("pull");
        ctx.after(650, () => {
          if (thorn) {
            unfollow(thorn); // 껍데기는 그 자리에 두고 가시만 휙 날아감
            thorn.classList.add("fly");
            ctx.after(800, () => thorn.parentNode && thorn.parentNode.remove());
          }
          A.sfx("pop");
          act.react(nm, 0.04);
        });
        drop(1400);
      } else if (t.fx === "teddy") {
        // 곰 인형: 가슴에 안겨 남음 (두 팔로 안음)
        use.classList.remove("in");
        o.dy = 0.03;
        heldTeddy = true;
        act.hug(true);
        A.sfx("boing");
        ctx.after(300, () => FX.hearts(host, pt("chest").x, pt("chest").y, 3, ctx));
        marks.forEach((m) => (m.style.opacity = "0.4"));
      } else if (t.fx === "blanket") {
        // 담요: 몸을 덮고 쿨쿨
        use.classList.remove("in");
        o.dy = 0.08;
        act.mood("sleep", P.blush);
        act.sick(0.3);
        [200, 800].forEach((w) => ctx.after(w, () => FX.float(host, pt("headTop").x + dh * 0.15, pt("headTop").y, KP.E("💤"), "hpZz", 1900, ctx)));
        A.melody([["E5", 2], ["C5", 2], ["G4", 3]], { beat: 0.22, inst: "soft", vol: 0.18 });
        drop(1700);
        ctx.after(1700, () => act.mood(P.mood, P.blush));
      }
      KP.voice.say(t.done);
      await ctx.wait(1800);
      if (!live()) return;
      busy = false;
      stepDone();
    };
    const cure = async () => {
      tray.classList.add("off");
      clearMarks();
      act.sick(0);
      act.mood("happy");
      act.glow("forehead", "#ffffff", 0);
      act.bump("headTop", 0);
      act.hug(false);
      heldTeddy = false;
      ov.querySelectorAll(".hpUse").forEach((e) => {
        unfollow(e);
        e.classList.add("out");
        ctx.after(450, () => e.parentNode && e.parentNode.remove());
      });
      act.happy();
      bub.innerHTML = '<span class="m">' + KP.E("😊") + "</span><span>고마워요!</span>";
      U.replay(bub, "popIn");
      const p = pt("headTop", 0, -0.1);
      FX.hearts(host, p.x, p.y, 7, ctx);
      A.sfx("good");
      A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.14, inst: "marimba", vol: 0.22, when: 0.3 });
      ctx.after(700, () => act.happy());
      ctx.after(1300, () => act.wave(1.8));
      await Promise.race([ctx.say("😊 다 나았어요! 고마워요, 의사 선생님!"), ctx.wait(4500)]);
      if (!live()) return;
      await ctx.wait(300);
      if (!live()) return;
      bub.innerHTML = '<span class="m">' + KP.E("👋") + "</span><span>안녕!</span>";
      act.wave(1.2);
      leaving = true;
      A.sfx("whoosh");
      await Promise.race([act.jumpTo(offX(-1), seat[1], 0.9, 0.28), ctx.wait(1300)]);
      if (!live()) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      // 말은 자연 음성이 있는 문장으로 (화면 글자는 그대로)
      const ok = await ctx.win({ big, msg: big ? "{부름} 최고의 의사 선생님!" : "친구가 다 나았어요!", say: big ? "{부름} 최고예요!" : "참 잘했어요!" });
      if (ok && live()) this.next(ctx);
    };

    // 안내
    const intro = U.josa(name, "이/가") + " 아파요! " + P.say + " " + (lv === 1 ? T[P.one].ask : lv === 2 ? "무엇이 필요할까요?" : P.seqSay);
    ctx.say("🏥 " + intro);
    // 점검용
    ctx.hpState = () => ({ tok, steps, si, mode, busy, who: name, sym: P.id, painted: act.painted, gl: !!st.gl, off: tray.classList.contains("off"), spot: T[steps[si]] ? spotOf(steps[si]) : null });
    ctx.hpPoint = (nm) => {
      const r = room.getBoundingClientRect(), p = act.anchor(nm);
      return { x: r.left + p.x, y: r.top + p.y };
    };
    ctx.hpBox = () => {
      const r = room.getBoundingClientRect(), b = act.box();
      return { l: r.left + b.l, r: r.left + b.r, t: r.top + b.t, b: r.top + b.b };
    };
    await Promise.race([enter, ctx.wait(1200)]);
    if (!live()) return;
    startStep();
  },
});

;

/* ==== js/games/play/light.js ==== */
/* 초록불 빨간불 — 신호등을 보고 토끼를 당근까지 데려다줘요
   - 초록불일 때 누르면 토끼가 깡총 앞으로 / 빨간불일 때 누르면 깜짝 멈칫 ("빨간불엔 멈춰요!")
   - 뒤로 가는 벌칙은 2단계부터 아주 조금만
   1단계: 신호가 천천히 바뀜 / 2단계: 조금 빨리 / 3단계: 노란불 추가
   - 세로로 긴 화면(폰 세로·태블릿 세로)은 길을 세로로 놓고 아래→위(당근은 맨 위)로 깡총 (.vert)
     — 가로 길은 폰 세로에서 토끼 60px·한 칸 25px 로 움직임이 작게 보였음 */
"use strict";
KP.game({
  id: "light",
  icon: "🚦",
  name: "초록불 빨간불",
  cat: "play",
  levels: 3,
  score: "🥕",
  setup(ctx) {
    const U = KP.u;
    KP.css("light", `
      .lt-scene{flex:1;min-height:0;position:relative;margin:0 12px 8px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#bfe8ff 0%,#e6f7ff 44%,#9ddc86 44%,#74c262 100%)}
      .lt-hill{position:absolute;bottom:56%;border-radius:50% 50% 0 0;background:#b6e6a2;pointer-events:none}
      .lt-path{position:absolute;left:0;right:0;top:62%;height:clamp(54px,11%,96px);background:linear-gradient(#e9c88f,#d9b072);box-shadow:inset 0 5px 0 rgba(255,255,255,.35),inset 0 -5px 0 rgba(0,0,0,.08)}
      .lt-path::after{content:"";position:absolute;left:0;right:0;top:calc(50% - 3px);height:6px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.7) 0 26px,transparent 26px 52px)}
      .lt-deco{position:absolute;font-size:clamp(24px,3.6vw,38px);pointer-events:none}
      .lt-signal{position:absolute;left:50%;top:5%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:2}
      .lt-box{display:flex;flex-direction:column;gap:clamp(6px,1vh,10px);background:#2d3142;padding:clamp(8px,1.4vh,14px);border-radius:24px;box-shadow:0 6px 0 rgba(0,0,0,.25),inset 0 3px 0 rgba(255,255,255,.12)}
      .lt-lamp{width:var(--ls);height:var(--ls);border-radius:50%;background:#4a4f63;box-shadow:inset 0 4px 6px rgba(0,0,0,.4);transition:background .15s,box-shadow .15s;position:relative}
      .lt-lamp .face{position:absolute;inset:18%;display:none;font-size:calc(var(--ls)*.6);line-height:1;align-items:center;justify-content:center}
      .lt-lamp.on .face{display:flex}
      .lt-lamp.r.on{background:radial-gradient(circle at 40% 35%,#ffb3b3,#ff3b3b 60%);box-shadow:0 0 26px 8px rgba(255,60,60,.7)}
      .lt-lamp.y.on{background:radial-gradient(circle at 40% 35%,#fff3b0,#ffc531 60%);box-shadow:0 0 26px 8px rgba(255,197,49,.7)}
      .lt-lamp.g.on{background:radial-gradient(circle at 40% 35%,#c8ffd6,#2fd46a 60%);box-shadow:0 0 26px 8px rgba(47,212,106,.7)}
      .lt-pole{width:12px;height:clamp(20px,6vh,60px);background:linear-gradient(90deg,#666b80,#8a90a6,#666b80)}
      .lt-rab{position:absolute;left:0;top:0;width:var(--rs);height:var(--rs);z-index:3;transition:left .45s cubic-bezier(.3,.9,.5,1)}
      .lt-rab.hintGlow{position:absolute;border-radius:50%}
      .lt-rabi{width:100%;height:100%;transform:scaleX(-1);font-size:var(--rs);line-height:1}
      .lt-rabi .e{width:100%;height:100%;display:block}
      .lt-rab.hop .lt-rabi{animation:lt-hop .45s ease-out}
      @keyframes lt-hop{0%{transform:scaleX(-1) scale(1,.85)}40%{transform:scaleX(-1) translateY(-45%) scale(.95,1.08)}80%{transform:scaleX(-1) translateY(0) scale(1.06,.9)}100%{transform:scaleX(-1)}}
      .lt-rab.idle .lt-rabi{animation:lt-idle 1.6s ease-in-out infinite}
      @keyframes lt-idle{50%{transform:scaleX(-1) scale(1.03,.97)}}
      .lt-rab.oops .lt-rabi{animation:lt-oops .5s}
      @keyframes lt-oops{0%{transform:scaleX(-1)}30%{transform:scaleX(-1) translateY(-20%) rotate(8deg)}60%{transform:scaleX(-1) rotate(-6deg)}100%{transform:scaleX(-1)}}
      .lt-bang{position:absolute;left:50%;bottom:95%;transform:translateX(-50%);font-size:calc(var(--rs)*.5);pointer-events:none;animation:popBig .35s cubic-bezier(.2,1.6,.4,1)}
      .lt-carrot{position:absolute;width:var(--rs);height:var(--rs);font-size:var(--rs);line-height:1;z-index:2;transform:rotate(-20deg);animation:lt-car 1.2s ease-in-out infinite alternate;pointer-events:none}
      .lt-carrot .e{width:100%;height:100%;display:block}
      @keyframes lt-car{to{transform:rotate(-8deg) scale(1.06)}}
      .lt-carrot.eat{animation:lt-eat .9s forwards}
      @keyframes lt-eat{30%{transform:scale(.8) rotate(10deg)}60%{transform:scale(.5) rotate(-10deg)}100%{transform:scale(0);opacity:0}}
      .lt-print{position:absolute;font-size:calc(var(--rs)*.28);opacity:.5;pointer-events:none;animation:lt-print 2.5s forwards}
      @keyframes lt-print{to{opacity:0}}
      .lt-dot{position:absolute;width:calc(var(--rs)*.22);height:calc(var(--rs)*.22);border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none;transform:translate(-50%,-50%)}
      .lt-dot.done{background:#ffc531;box-shadow:0 0 0 3px #fff}
      .lt-heart{position:absolute;font-size:clamp(24px,3.4vw,34px);pointer-events:none;z-index:5;animation:lt-heart 1.2s ease-out forwards}
      @keyframes lt-heart{to{transform:translate(var(--dx),-100px) scale(1.3);opacity:0}}
      .lt-go{flex:0 0 auto;align-self:center;margin:0 0 12px;font-size:clamp(26px,3.8vw,36px);display:flex;align-items:center;gap:10px;padding:12px 34px;border-radius:999px;color:#fff;
        background:#2fb466;box-shadow:0 7px 0 #1d8a49;transition:background .2s,box-shadow .2s;min-height:76px}
      .lt-go:active{transform:translateY(5px);box-shadow:0 2px 0 rgba(0,0,0,.2)}
      .lt-go.r{background:#ff5b5b;box-shadow:0 7px 0 #c93a3a}.lt-go.y{background:#ffb020;box-shadow:0 7px 0 #c98600}
      .lt-go .e{font-size:1.2em}
      /* 세로 길 (아래 → 위) */
      .lt-scene.vert{background:linear-gradient(180deg,#bfe8ff 0%,#e6f7ff 9%,#9ddc86 9%,#74c262 100%)}
      .lt-scene.vert .lt-hill{display:none}
      .lt-scene.vert .lt-path{right:auto;box-shadow:inset 5px 0 0 rgba(255,255,255,.35),inset -5px 0 0 rgba(0,0,0,.08);border-radius:18px}
      .lt-scene.vert .lt-path::after{left:calc(50% - 3px);right:auto;top:0;bottom:0;width:6px;height:auto;background:repeating-linear-gradient(180deg,rgba(255,255,255,.7) 0 26px,transparent 26px 52px)}
      .lt-scene.vert .lt-signal{left:27%;top:12%}
      .lt-scene.vert .lt-rab{transition:top .45s cubic-bezier(.3,.9,.5,1)}
    `);
    const scene = U.el("div", "lt-scene");
    scene.dataset.tap = "1";
    scene.innerHTML =
      '<div class="lt-hill" style="left:-8%;width:46%;height:16%"></div><div class="lt-hill" style="right:-10%;width:55%;height:12%;background:#a6dd90"></div>' +
      '<div class="lt-path"></div>' +
      '<div class="lt-deco" style="left:4%;top:50%">' + KP.E("🌷") + '</div><div class="lt-deco" style="left:30%;top:84%">' + KP.E("🌼") + "</div>" +
      '<div class="lt-deco" style="left:62%;top:86%">' + KP.E("🍄") + '</div><div class="lt-deco" style="right:6%;top:50%">' + KP.E("🌸") + "</div>" +
      '<div class="lt-deco" style="left:14%;top:10%;font-size:clamp(30px,5vw,54px)">' + KP.E("☁️") + "</div>" +
      '<div class="lt-signal"><div class="lt-box"><div class="lt-lamp r"><span class="face">' + KP.E("✋") + '</span></div><div class="lt-lamp y"><span class="face">' + KP.E("✋") + '</span></div><div class="lt-lamp g"><span class="face">' + KP.E("🐾") + "</span></div></div>" +
      '<div class="lt-pole"></div></div>';
    const carrot = U.el("div", "lt-carrot", KP.E("🥕"));
    const rab = U.el("div", "lt-rab idle", '<div class="lt-rabi">' + KP.E("🐇") + "</div>");
    scene.append(carrot, rab);
    const go = U.btn(KP.E("🐾") + "<span>깡총!</span>", "lt-go");
    ctx.body.append(scene, go);
    Object.assign(ctx, { scene, carrot, rab, go, lamps: U.$$(".lt-lamp", scene), signalEl: U.$(".lt-box", scene) });

    ctx.size = () => {
      const W = scene.clientWidth,
        H = scene.clientHeight;
      const vert = (ctx.vert = H > W * 1.15);
      scene.classList.toggle("vert", vert);
      const path = U.$(".lt-path", scene);
      if (vert) {
        const rs = Math.round(U.clamp(Math.min(W * 0.24, H * 0.14), 60, 130));
        scene.style.setProperty("--rs", rs + "px");
        scene.style.setProperty("--ls", Math.round(U.clamp(Math.min(H * (ctx.yellow ? 0.09 : 0.11), W * 0.2), 40, 90)) + "px");
        ctx.rs = rs;
        // 길: 오른쪽 세로 띠 (신호등은 왼쪽 위)
        const pw = Math.round(U.clamp(W * 0.22, 54, 110)),
          pcx = W * 0.7;
        path.style.cssText = "left:" + (pcx - pw / 2) + "px;width:" + pw + "px;top:" + Math.round(rs * 0.5) + "px;height:" + Math.round(H - rs * 0.5 - 6) + "px";
        ctx.y0 = H - rs - 10; // 출발(맨 아래) 토끼 top
        ctx.y1 = rs * 1.2; // 도착(당근 바로 아래)
        rab.style.left = pcx - rs / 2 + "px";
        carrot.style.left = pcx - rs * 0.45 + "px";
        carrot.style.top = "4px";
        ctx.placeRab();
        scene.querySelectorAll(".lt-dot").forEach((d) => d.remove());
        for (let i = 1; i <= ctx.steps; i++) {
          const d = U.el("div", "lt-dot" + (i <= ctx.pos ? " done" : ""));
          d.style.left = pcx + "px";
          d.style.top = ctx.y0 + rs / 2 + ((ctx.y1 - ctx.y0) * i) / ctx.steps + "px";
          scene.insertBefore(d, carrot);
        }
        return;
      }
      path.style.cssText = "";
      rab.style.top = "";
      const rs = Math.round(U.clamp(Math.min(W / (ctx.steps + 3), H * 0.2), 60, 130));
      scene.style.setProperty("--rs", rs + "px");
      scene.style.setProperty("--ls", Math.round(U.clamp(H * (ctx.yellow ? 0.1 : 0.13), 36, 84)) + "px");
      ctx.rs = rs;
      const pathTop = H * 0.62,
        pathH = U.clamp(H * 0.11, 54, 96);
      const y = pathTop + pathH / 2 - rs * 0.82;
      rab.style.top = y + "px";
      carrot.style.top = pathTop + pathH / 2 - rs * 0.7 + "px";
      ctx.x0 = 10;
      ctx.x1 = W - rs * 1.9;
      carrot.style.left = W - rs * 1.15 + "px";
      ctx.placeRab();
      // 발자국 자리 점
      scene.querySelectorAll(".lt-dot").forEach((d) => d.remove());
      for (let i = 1; i <= ctx.steps; i++) {
        const d = U.el("div", "lt-dot" + (i <= ctx.pos ? " done" : ""));
        d.style.left = ctx.x0 + rs / 2 + ((ctx.x1 - ctx.x0) * i) / ctx.steps + "px";
        d.style.top = pathTop + pathH / 2 + "px";
        scene.insertBefore(d, carrot);
      }
    };
    ctx.placeRab = () => {
      if (ctx.vert) rab.style.top = ctx.y0 + ((ctx.y1 - ctx.y0) * Math.max(0, ctx.pos)) / ctx.steps + "px";
      else rab.style.left = ctx.x0 + ((ctx.x1 - ctx.x0) * Math.max(0, ctx.pos)) / ctx.steps + "px";
      U.$$(".lt-dot", scene).forEach((d, i) => d.classList.toggle("done", i < Math.floor(ctx.pos)));
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    ctx.steps = [9, 10, 11][lv - 1]; // 1단계 7칸 → 9칸: 첫 초록불에 다 가 버려 빨간불을 못 겪던 문제
    ctx.yellow = lv === 3;
    ctx.pos = 0;
    ctx.lamps[1].style.display = ctx.yellow ? "" : "none";
    ctx.lamps[2].style.display = ""; // 1·2단계 노란불 예고(초록불 자리) 도중 나갔을 때 되돌리기
    ctx.carrot.classList.remove("eat");
    ctx.rab.className = "lt-rab idle";
    ctx.size();
    let sig = "r",
      done = false,
      lastTalk = 0,
      started = false, // 첫 초록불 전(준비 시간)에는 눌러도 틀림 아님
      sawRed = false, // 이번 판에 초록불 → 빨간불을 겪었나
      redMiss = 0, // 이번 판 빨간불에 누른 횟수 (첫 번째는 가볍게)
      forcedSoft = false, // 당근 앞 '강제 신호 바꿈' 뒤 첫 실수는 가볍게 (연타하던 아이가 미처 못 멈춤)
      lastHop = 0;
    const DUR = { g: [3.4, 3.2, 2.8][lv - 1], y: 1.3, r: [2.6, 2.6, 2.5][lv - 1] };
    let sigAt = 0, // 신호가 바뀐 시각
      fromG = false; // 초록불에서 바뀌었나 (바뀐 직후 누름 = 반응이 늦은 것 → 틀림 아님)
    const setSig = (s, speak = true) => {
      fromG = sig === "g" && s !== "g";
      sigAt = performance.now();
      sig = s;
      if (s === "r" && started) sawRed = true;
      ctx.lamps.forEach((l) => l.classList.toggle("on", l.classList.contains(s)));
      ctx.go.className = "lt-go " + s;
      ctx.go.querySelector("span").textContent = s === "g" ? "깡총!" : s === "y" ? "기다려" : "멈춰!";
      if (!speak) return;
      if (s === "g") {
        A.note("C5", { inst: "bell", dur: 0.3, vol: 0.2 });
        A.note("G5", { inst: "bell", dur: 0.4, vol: 0.2, when: 0.12 });
        KP.voice.say("초록불! 깡총깡총!");
      } else if (s === "y") {
        A.note("E5", { inst: "bell", dur: 0.3, vol: 0.16 });
        KP.voice.say("노란불! 기다려요");
      } else {
        A.note("G4", { inst: "bell", dur: 0.3, vol: 0.18 });
        A.note("C4", { inst: "bell", dur: 0.4, vol: 0.18, when: 0.12 });
        KP.voice.say("빨간불! 멈춰요!");
      }
    };
    const cycle = () => {
      if (done) return;
      const nextS = sig === "g" ? (ctx.yellow ? "y" : "r") : sig === "y" ? "r" : "g";
      setSig(nextS);
      ctx.sigT = ctx.after(DUR[nextS] * 1000 * U.randf(0.8, 1.25), cycle);
    };
    ctx.say("초록불일 때만 깡총! 빨간불엔 멈춰요 🚦");
    setSig("r", false);
    ctx.after(2600, () => {
      started = true;
      setSig("g");
      ctx.sigT = ctx.after(DUR.g * 1000, cycle);
    });

    const hop = () => {
      if (done || KP.celebrating) return;
      const rab = ctx.rab;
      // 깡총 최소 간격: 연타해도 한 번에 너무 멀리 가지 않게 (1·2단계 0.38초, 3단계 0.32초)
      const now0 = performance.now();
      if (sig === "g" && now0 - lastHop < (lv === 3 ? 320 : 380)) return;
      if (sig === "g") {
        lastHop = now0;
        ctx.pos = Math.min(ctx.steps, Math.floor(ctx.pos) + 1);
        rab.classList.remove("idle", "oops");
        U.replay(rab, "hop");
        ctx.placeRab();
        A.tone(380 + ctx.pos * 40, { to: 760 + ctx.pos * 50, dur: 0.16, vol: 0.12, type: "triangle" });
        A.note(A.SCALE[Math.min(ctx.pos - 1, 11)], { inst: "marimba", dur: 0.3, vol: 0.18, when: 0.12 });
        // 발자국
        const pr = U.el("div", "lt-print", KP.E("🐾"));
        pr.style.left = parseFloat(rab.style.left) + "px";
        pr.style.top = parseFloat(rab.style.top) + ctx.rs * 0.95 + "px";
        ctx.scene.insertBefore(pr, ctx.carrot);
        ctx.after(2600, () => pr.remove());
        if (ctx.pos >= ctx.steps) arrive();
        // 빨간불을 한 번도 못 보고 도착할 것 같으면, 당근 두 칸 앞에서 신호를 바꿔 '멈추기'를 꼭 한 번 겪게
        else if (!sawRed && ctx.pos >= ctx.steps - 2) {
          ctx.cancel(ctx.sigT);
          ctx.sigT = ctx.after(350, () => {
            if (done || sig !== "g") return;
            forcedSoft = true;
            if (ctx.yellow) {
              // 3단계: 원래 노란불이 있음 → 노란불(1.3초)이 예고
              setSig("y");
              ctx.sigT = ctx.after(DUR.y * 1000 * U.randf(0.9, 1.1), cycle);
              return;
            }
            // 1·2단계: 노란불 칸이 없으므로 초록불 자리에 노란불을 0.6초 켜서 예고 (신호등 크기는 그대로)
            ctx.lamps[2].style.display = "none";
            ctx.lamps[1].style.display = "";
            setSig("y", false);
            A.note("E5", { inst: "bell", dur: 0.3, vol: 0.16 });
            ctx.sigT = ctx.after(600, () => {
              ctx.lamps[1].style.display = "none";
              ctx.lamps[2].style.display = "";
              if (done) return;
              setSig("r");
              ctx.sigT = ctx.after(DUR.r * 1000 * U.randf(0.9, 1.1), cycle);
            });
          });
        }
      } else if (!started) {
        // 시작 전 빨간불: 틀림 아님 — 살짝 멈칫하고 "초록불 기다려요"만
        rab.classList.remove("hop", "idle");
        U.replay(rab, "oops");
        A.note("E5", { inst: "soft", dur: 0.12, vol: 0.12 });
        const now = Date.now();
        if (now - lastTalk > 2200) {
          lastTalk = now;
          KP.voice.say("초록불 기다려요");
        }
      } else if (fromG && performance.now() - sigAt < 500) {
        // 초록불이 막 바뀐 직후(0.5초 안) 누름: 손가락이 신호보다 조금 늦었을 뿐 → 틀림 아님, 멈칫만 (뒤로 밀림·말 없음)
        rab.classList.remove("hop", "idle");
        U.replay(rab, "oops");
        A.note("E5", { inst: "soft", dur: 0.12, vol: 0.12 });
      } else {
        // 빨간불/노란불 — 깜짝 멈칫
        rab.classList.remove("hop", "idle");
        U.replay(rab, "oops");
        const b = U.el("div", "lt-bang", KP.E(sig === "r" ? "❗" : "✋"));
        rab.appendChild(b);
        ctx.after(700, () => b.remove());
        A.tone(700, { to: 500, dur: 0.15, vol: 0.1, type: "triangle" });
        if (sig === "r" && lv >= 2 && ctx.pos > 0) {
          ctx.pos = Math.max(0, ctx.pos - 0.35);
          ctx.after(250, ctx.placeRab);
        }
        const now = Date.now();
        if (now - lastTalk > 2200) {
          lastTalk = now;
          // 판마다 첫 번째는 가벼운 실수(배우는 중), 그다음부터 틀림
          redMiss++;
          const soft = redMiss === 1 || forcedSoft;
          forcedSoft = false;
          ctx.miss(null, sig === "r" ? "빨간불엔 멈춰요!" : "노란불엔 기다려요!", { soft });
        }
      }
    };
    ctx.onHop = hop;
    if (!ctx.bound) {
      ctx.bound = true;
      ctx.fast(ctx.scene, () => ctx.onHop());
      ctx.fast(ctx.go, (e) => {
        e.stopPropagation();
        U.replay(ctx.go, "pop");
        ctx.onHop();
      });
    }
    const arrive = async () => {
      done = true;
      ctx.cancel(ctx.sigT);
      ctx.hint(null);
      ctx.carrot.classList.add("eat");
      KP.voice.say("당근 도착! 냠냠냠!");
      for (let i = 0; i < 3; i++) {
        A.noise({ dur: 0.08, vol: 0.12, hp: 1800, when: 0.2 + i * 0.25 });
        const h = U.el("div", "lt-heart", KP.E("💖"));
        h.style.cssText = "left:" + (parseFloat(ctx.carrot.style.left) + 10) + "px;top:" + ctx.carrot.style.top + ";--dx:" + (i - 1) * 40 + "px;animation-delay:" + i * 0.2 + "s";
        ctx.scene.appendChild(h);
        ctx.after(1700, () => h.remove());
      }
      ctx.score.add();
      await ctx.wait(1300);
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 신호등 박사!" : "잘 기다렸어요!" });
      if (ok) this.next(ctx);
    };
    ctx.hint(() => (sig === "g" ? ctx.go : ctx.signalEl), "초록불이 켜지면 눌러요!");
  },
});

;

/* ==== js/games/play/mole.js ==== */
/* 두더지 잡기 — 잔디 정원의 흙구멍에서 두더지가 쏙! 망치로 콩!
   - 맞으면 '콩!' + 눈이 빙글빙글 + 별이 빙글빙글 돌며 쏙 들어감
   - 가끔 보너스 친구(토끼·개구리·병아리)가 나옴 → +3
   - 빈 구멍을 눌러도 벌 없음(흙만 폴폴) / 10마리마다 축하
   1단계: 구멍 4개·느리게 / 2단계: 6개 / 3단계: 9개·빠르게 + '모자 쓴 두더지는 쉿!'(누르면 모자가 날아가고 가벼운 틀림, 그냥 두면 👍)
   - 모자는 3단계에만 나옴(예전엔 꾸밈으로 1·2단계에도 30%) → 3단계 '골라 누르기' 규칙과 헷갈리지 않게 */
"use strict";
KP.game({
  id: "mole",
  icon: "🐹",
  name: "두더지 잡기",
  cat: "play",
  levels: 3,
  score: "🔨",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("mole", `
      .ml-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:repeating-linear-gradient(100deg,rgba(255,255,255,.07) 0 40px,rgba(0,0,0,0) 40px 80px),radial-gradient(120% 90% at 50% 10%,#9be36f,#5cbf4a 70%,#4aa83d);
        display:flex;align-items:center;justify-content:center}
      .ml-deco{position:absolute;font-size:clamp(24px,3.6vw,36px);pointer-events:none;opacity:.95}
      .ml-grid{display:grid;grid-template-columns:repeat(var(--cols),var(--cs));grid-auto-rows:var(--cs);gap:calc(var(--cs)*.06);position:relative;z-index:1}
      .ml-cell{position:relative;width:var(--cs);height:var(--cs);cursor:pointer}
      .ml-hole{position:absolute;left:8%;right:8%;top:58%;height:28%;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#2b1a0e 0 55%,#4a2f1a 75%,#6b4628 100%);
        box-shadow:inset 0 6px 10px rgba(0,0,0,.5)}
      .ml-win{position:absolute;left:0;right:0;top:-12%;height:84%;overflow:hidden;pointer-events:none;border-radius:0 0 50% 50%/0 0 22% 22%}
      .ml-mole{position:absolute;left:18%;right:18%;bottom:0;height:78%;transform:translateY(105%);transition:transform .2s cubic-bezier(.3,1.4,.6,1)}
      .ml-cell.up .ml-mole{transform:translateY(8%)}
      .ml-cell.hit .ml-mole{transition:transform .35s ease-in .55s}
      .ml-body{position:absolute;inset:0;border-radius:50% 50% 38% 38%/62% 62% 38% 38%;background:radial-gradient(circle at 38% 28%,#b98a5e,#8a5c38 60%,#6d4528);
        box-shadow:inset -6px -8px 12px rgba(0,0,0,.18)}
      .ml-belly{position:absolute;left:22%;right:22%;top:52%;bottom:-10%;border-radius:50%;background:#e6c49a}
      .ml-eye{position:absolute;top:26%;width:12%;height:13%;border-radius:50%;background:#2a1a10}
      .ml-eye::after{content:"";position:absolute;left:22%;top:18%;width:38%;height:38%;border-radius:50%;background:#fff}
      .ml-eye.l{left:27%}.ml-eye.r{right:27%}
      .ml-x{position:absolute;top:21%;font-size:calc(var(--cs)*.13);line-height:1;color:#2a1a10;display:none}
      .ml-x.l{left:24%}.ml-x.r{right:24%}
      .ml-nose{position:absolute;left:39%;right:39%;top:39%;height:13%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffd0dc,#ff7b9c 60%,#e2557a)}
      .ml-cheek{position:absolute;top:43%;width:14%;height:9%;border-radius:50%;background:rgba(255,120,140,.45)}
      .ml-cheek.l{left:15%}.ml-cheek.r{right:15%}
      .ml-teeth{position:absolute;left:44%;right:44%;top:53%;height:8%;background:#fff;border-radius:0 0 4px 4px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
      .ml-paw{position:absolute;bottom:22%;width:20%;height:13%;border-radius:50%;background:#f0b8a0;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}
      .ml-paw.l{left:4%}.ml-paw.r{right:4%}
      .ml-hat{position:absolute;left:14%;right:14%;top:-14%;height:30%;border-radius:50% 50% 12% 12%;background:linear-gradient(#ff7a8a,#e2405a);box-shadow:inset 0 -6px 0 rgba(0,0,0,.14);display:none;transition:transform .5s ease-out,opacity .5s}
      .ml-hat::before{content:"";position:absolute;left:-16%;right:-16%;bottom:-8%;height:26%;border-radius:999px;background:#c92c48}
      .ml-hat::after{content:"";position:absolute;left:0;right:0;bottom:22%;height:20%;background:#fff;opacity:.9}
      .ml-cell.hat .ml-hat{display:block}
      .ml-cell.hatoff .ml-hat{transform:translate(70%,-160%) rotate(50deg);opacity:0}
      .ml-ok{position:absolute;left:50%;top:-6%;font-size:calc(var(--cs)*.26);line-height:1;pointer-events:none;z-index:6;animation:ml-kong 1s forwards}
      .ml-cell.dizzy .ml-eye{display:none}.ml-cell.dizzy .ml-x{display:block}
      .ml-cell.dizzy .ml-body{animation:ml-squash .4s}
      @keyframes ml-squash{30%{transform:scale(1.15,.8)}}
      .ml-friend{position:absolute;inset:0;display:none;align-items:flex-end;justify-content:center;font-size:calc(var(--cs)*.56);line-height:1}
      .ml-cell.friend .ml-friend{display:flex}.ml-cell.friend .ml-body,.ml-cell.friend .ml-belly,.ml-cell.friend .ml-eye,.ml-cell.friend .ml-nose,.ml-cell.friend .ml-cheek,.ml-cell.friend .ml-teeth,.ml-cell.friend .ml-paw,.ml-cell.friend .ml-hat{display:none}
      .ml-lip{position:absolute;left:2%;right:2%;top:70%;height:22%;border-radius:50%;background:radial-gradient(ellipse at 50% 20%,#a27248,#7b5131 70%);pointer-events:none;
        box-shadow:0 5px 0 rgba(0,0,0,.12)}
      .ml-lip::before{content:"";position:absolute;left:10%;right:10%;top:12%;height:30%;border-radius:50%;background:rgba(255,255,255,.12)}
      .ml-ham{position:absolute;width:calc(var(--cs)*.62);height:calc(var(--cs)*.62);left:38%;top:-30%;font-size:calc(var(--cs)*.62);line-height:1;pointer-events:none;z-index:5;
        transform-origin:85% 85%;animation:ml-ham .5s ease-out forwards}
      @keyframes ml-ham{0%{transform:rotate(55deg);opacity:1}35%{transform:rotate(-18deg)}55%{transform:rotate(-8deg)}85%{opacity:1}100%{transform:rotate(-8deg);opacity:0}}
      .ml-kong{position:absolute;left:50%;top:-8%;font-size:calc(var(--cs)*.24);color:#fff;-webkit-text-stroke:3px #e2557a;paint-order:stroke;pointer-events:none;z-index:6;
        text-shadow:0 4px 0 #b93a5c;animation:ml-kong .8s cubic-bezier(.2,1.6,.4,1) forwards;white-space:nowrap}
      @keyframes ml-kong{0%{transform:translate(-50%,0) scale(.3)}30%{transform:translate(-50%,-30%) scale(1.15)}75%{opacity:1}100%{transform:translate(-50%,-60%) scale(1);opacity:0}}
      .ml-stars{position:absolute;left:50%;top:8%;width:calc(var(--cs)*.5);height:calc(var(--cs)*.18);margin-left:calc(var(--cs)*-.25);pointer-events:none;z-index:4;animation:ml-fade 1s forwards}
      .ml-stars i{position:absolute;left:50%;top:50%;font-size:calc(var(--cs)*.14);line-height:1;margin:-.5em;animation:ml-orbit .7s linear infinite;animation-delay:var(--dl)}
      @keyframes ml-orbit{0%{transform:translate(-110%,0) scale(.8)}25%{transform:translate(0,40%) scale(1.1)}50%{transform:translate(110%,0) scale(.8)}75%{transform:translate(0,-40%) scale(.6)}100%{transform:translate(-110%,0) scale(.8)}}
      @keyframes ml-fade{80%{opacity:1}100%{opacity:0}}
      .ml-dust{position:absolute;width:14%;height:14%;border-radius:50%;background:#a27248;top:72%;pointer-events:none;z-index:4;animation:ml-dust .5s ease-out forwards}
      @keyframes ml-dust{to{transform:translate(var(--dx),-60%) scale(.3);opacity:0}}
      .ml-plus{position:absolute;left:50%;top:-14%;font-size:calc(var(--cs)*.22);color:#ffcf33;-webkit-text-stroke:3px #c47f00;paint-order:stroke;pointer-events:none;z-index:6;animation:ml-kong 1s forwards}
    `);
    const field = U.el("div", "ml-field");
    const deco = [["🌼", "4%", "6%"], ["🌷", "92%", "8%"], ["🍄", "6%", "88%"], ["🌸", "90%", "86%"], ["🐞", "48%", "3%"], ["🌼", "50%", "92%"]];
    deco.forEach(([e, x, y]) => {
      const d = U.el("div", "ml-deco", KP.E(e));
      d.style.left = x;
      d.style.top = y;
      d.style.transform = "translate(-50%,-50%)";
      field.appendChild(d);
    });
    const grid = U.el("div", "ml-grid");
    field.appendChild(grid);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.grid = grid;
    ctx.FRIENDS = [["🐰", "토끼"], ["🐸", "개구리"], ["🐥", "병아리"], ["🐼", "판다"]];

    const MOLE =
      '<div class="ml-hole"></div><div class="ml-win"><div class="ml-mole">' +
      '<div class="ml-body"></div><div class="ml-belly"></div><div class="ml-hat"></div>' +
      '<div class="ml-eye l"></div><div class="ml-eye r"></div><div class="ml-x l">×</div><div class="ml-x r">×</div>' +
      '<div class="ml-cheek l"></div><div class="ml-cheek r"></div><div class="ml-nose"></div><div class="ml-teeth"></div>' +
      '<div class="ml-paw l"></div><div class="ml-paw r"></div><div class="ml-friend"></div>' +
      '</div></div><div class="ml-lip"></div>';

    ctx.layout = () => {
      const n = ctx.holes.length;
      const W = field.clientWidth,
        H = field.clientHeight;
      const portrait = H > W * 1.15;
      let cols = n === 4 ? 2 : 3;
      if (n === 6 && portrait) cols = 2;
      const rows = Math.ceil(n / cols);
      const cs = Math.floor(Math.min((W - 24) / (cols * 1.06), (H - 24) / (rows * 1.06), 250));
      grid.style.setProperty("--cols", cols);
      grid.style.setProperty("--cs", cs + "px");
      field.style.setProperty("--cs", cs + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.layout());

    ctx.build = (n) => {
      grid.innerHTML = "";
      ctx.holes = [];
      for (let i = 0; i < n; i++) {
        const c = U.el("div", "ml-cell", MOLE);
        c.dataset.tap = "1";
        const h = { el: c, state: "down", t: 0, kind: null };
        ctx.fast(c, () => ctx.whack(h));
        grid.appendChild(c);
        ctx.holes.push(h);
      }
      ctx.layout();
    };

    ctx.popUp = (h) => {
      const lv = ctx.level;
      const r = Math.random();
      // 3단계: 모자 쓴 두더지(누르지 않기) 약 28% — 바로 앞도 모자였으면 보통 두더지로 (연달아 '참기'만 나오지 않게)
      const hatOk = lv === 3 && ctx.lastKind !== "hat";
      h.kind = r < 0.13 ? "friend" : hatOk && r < 0.41 ? "hat" : "mole";
      ctx.lastKind = h.kind;
      h.el.classList.remove("hit", "dizzy", "friend", "hat", "hatoff");
      if (h.kind === "friend") {
        h.friend = U.pick(ctx.FRIENDS);
        U.$(".ml-friend", h.el).innerHTML = KP.E(h.friend[0]);
        h.el.classList.add("friend");
      } else if (h.kind === "hat") {
        h.el.classList.add("hat");
        ctx.hatSeen++;
        if (!ctx.hatTold) {
          ctx.hatTold = true;
          ctx.say("모자 쓴 두더지는 쉿! 누르지 마요 🤫", ctx.HAT_TXT);
        }
      }
      h.state = "up";
      h.t = [2.1, 1.55, 1.15][lv - 1] * U.randf(0.9, 1.2);
      void h.el.offsetWidth;
      h.el.classList.add("up");
      A.tone(320, { to: 760, dur: 0.12, vol: 0.12, type: "triangle" });
    };
    ctx.goDown = (h) => {
      // 모자 두더지를 끝까지 참았어요 → 👍 (점수는 그대로)
      if (h.kind === "hat" && h.state === "up") {
        const ok = U.el("div", "ml-ok", KP.E("👍"));
        h.el.appendChild(ok);
        ctx.after(1000, () => ok.remove());
        A.note("E6", { inst: "bell", dur: 0.25, vol: 0.12 });
      }
      h.state = "down";
      h.el.classList.remove("up");
      h.t = 0.45; // 다시 나오기 전 쉬는 시간
    };
    // 모자 두더지 안내 (새 문장 new-voice/mole.txt — 녹음 전에는 기기 목소리)
    ctx.HAT_TXT = "모자 쓴 두더지는 누르지 마요!";

    ctx.whack = (h) => {
      const c = h.el;
      // 망치는 언제나 콩
      const ham = U.el("div", "ml-ham", KP.E("🔨"));
      c.appendChild(ham);
      ctx.after(520, () => ham.remove());
      if (h.state !== "up") {
        // 빈 구멍: 흙만 폴폴
        A.noise({ dur: 0.12, vol: 0.12, lp: 700 });
        A.note("C4", { inst: "marimba", dur: 0.15, vol: 0.12 });
        for (let i = 0; i < 4; i++) {
          const d = U.el("div", "ml-dust");
          d.style.cssText = "left:" + (30 + i * 12) + "%;--dx:" + (i - 1.5) * 30 + "%";
          c.appendChild(d);
          ctx.after(520, () => d.remove());
        }
        return;
      }
      if (h.kind === "hat") {
        // 모자 두더지를 눌렀어요: 모자가 휙 날아가고 쏙 들어감 — 가벼운 틀림(1번은 봐줌)
        h.state = "hit";
        c.classList.add("hatoff");
        ctx.after(60, () => c.classList.remove("up"));
        A.sfx("boing");
        ctx.miss(null, ctx.HAT_TXT, { soft: true });
        h.t = 0.9;
        return;
      }
      h.state = "hit";
      c.classList.add("hit", "dizzy");
      ctx.after(60, () => c.classList.remove("up"));
      // 콩!
      A.kick({ vol: 0.35 });
      A.note("G5", { inst: "marimba", dur: 0.2, vol: 0.3 });
      A.note("C6", { inst: "marimba", dur: 0.2, vol: 0.18, when: 0.05 });
      const k = U.el("div", "ml-kong", U.pick(["콩!", "뿅!", "콩!"]));
      c.appendChild(k);
      ctx.after(850, () => k.remove());
      let add = 1;
      if (h.kind === "friend") {
        add = 3;
        const p = U.el("div", "ml-plus", "+3");
        c.appendChild(p);
        ctx.after(1000, () => p.remove());
        A.sfx("sparkle");
        KP.voice.say(h.friend[1] + " 친구 찾았다! 세 개!");
      } else {
        // 어지러운 별
        const st = U.el("div", "ml-stars", ["💫", "⭐", "💫"].map((e, i) => '<i style="--dl:-' + i * 0.23 + 's">' + KP.E(e) + "</i>").join(""));
        c.appendChild(st);
        ctx.after(1000, () => st.remove());
        // 삐요삐요
        [0, 0.18, 0.36].forEach((w, i) => A.tone(i % 2 ? 1100 : 1400, { to: i % 2 ? 1400 : 1100, dur: 0.15, vol: 0.06, when: 0.15 + w }));
        if (ctx.count % 3 === 0) KP.voice.say(U.pick(["콩!", "잡았다!", "아야야~", "어지러워~"]));
      }
      h.t = 1.1;
      const prev = ctx.count;
      ctx.count += add;
      ctx.score.add(add);
      if (Math.floor(ctx.count / 10) > Math.floor(prev / 10)) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.pause = 3;
        // 열쇠 별: 1·2단계는 누르기만 하는 판 → 없음. 3단계는 모자 두더지가 2번 이상 나온 판만 (골라 누르기를 한 판)
        const judged = ctx.level === 3 && ctx.hatSeen >= 2;
        ctx.hatSeen = 0;
        ctx.after(700, () => (judged || ctx.noStar(), ctx.win({ big, msg: big ? "{부름} 두더지 대장!" : ctx.count + "마리 콩콩!", say: big ? "" : ctx.cheer(ctx.count) })).then((ok) => ok && ctx.setHint()));
      }
    };

    // 축하 음성: 자연 음성 조각이 있는 말로 ("열 마리 콩콩!" / 없는 수는 "십삼! 잡았다!") — 예전 "십! 콩콩!" 은 '콩콩!' 조각이 없어 기기 목소리
    // ("스무 마리 콩콩!" 은 아직 음성이 없어 자연 음성이 있을 때만 — 목록 tools/out/new-voice/mole.txt)
    const TENS = { 10: "열", 20: "스무", 30: "서른", 40: "마흔", 50: "쉰", 60: "예순", 70: "일흔", 80: "여든", 90: "아흔", 100: "백" };
    const nat = (t) => !KP.voice._natUrls || !!KP.voice._natUrls(t);
    ctx.cheer = (n) => (TENS[n] && nat(TENS[n] + " 마리 콩콩!") ? TENS[n] + " 마리 콩콩!" : n <= 100 ? U.numSino(n) + "! 잡았다!" : "잡았다!");
    // 손가락 힌트: 축하(ctx.win)가 힌트를 지우므로 축하가 끝나면 다시 설정 (진행형 놀이)
    ctx.setHint = () =>
      ctx.hint(() => {
        const h = ctx.holes.find((x) => x.state === "up" && x.kind !== "hat");
        return h && h.el;
      }, "두더지가 나오면 콩 눌러요!");

    ctx.frame = (dt) => {
      if (KP.celebrating) return;
      ctx.pause -= dt;
      const lv = ctx.level;
      for (const h of ctx.holes) {
        h.t -= dt;
        if (h.state === "up" && h.t <= 0) ctx.goDown(h);
        else if (h.state === "hit" && h.t <= 0) {
          h.el.classList.remove("hit", "dizzy", "hat", "hatoff");
          h.state = "down";
          h.t = 0.4;
        }
      }
      ctx.spawnT -= dt;
      const ups = ctx.holes.filter((h) => h.state === "up").length;
      const maxUp = [1, 2, 2][lv - 1];
      if (ctx.pause <= 0 && ctx.spawnT <= 0 && ups < maxUp) {
        const free = ctx.holes.filter((h) => h.state === "down" && h.t <= 0 && h !== ctx.lastHole);
        if (free.length) {
          const h = U.pick(free);
          ctx.lastHole = h;
          ctx.popUp(h);
          ctx.spawnT = [0.9, 0.65, 0.45][lv - 1] * U.randf(0.7, 1.3);
        }
      }
    };
  },
  start(ctx) {
    const n = [4, 6, 9][ctx.level - 1];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.pause = 0;
    ctx.spawnT = 1.2;
    ctx.lastHole = null;
    ctx.hatSeen = 0;
    ctx.hatTold = false;
    ctx.lastKind = null;
    ctx.build(n);
    ctx.curN = n;
    ctx.say("두더지가 쏙 나오면 콩! 눌러요 🔨");
    requestAnimationFrame(() => {
      ctx.layout();
      ctx.loop((dt) => {
        // 단계가 바뀌면 구멍 수도 바꾸기
        const want = [4, 6, 9][ctx.level - 1];
        if (want !== ctx.curN && !KP.celebrating) {
          ctx.curN = want;
          ctx.build(want);
          KP.voice.say("구멍이 " + (want === 6 ? "여섯" : "아홉") + " 개가 되었어요!");
        }
        // 안전망: 힌트가 어디서든 지워졌으면(축하 등) 다시 걸기
        if (!ctx._hint && !KP.celebrating) ctx.setHint();
        ctx.frame(dt);
      });
    });
    ctx.setHint();
  },
});

;

/* ==== js/games/play/peekaboo.js ==== */
/* 까꿍 놀이 — 알록달록 작은 집의 문을 열면 동물 친구가 까꿍!
   1단계: 문 3개를 마음대로 열기 (까꿍! + 이름 + 울음소리)
   2단계: 처음에 모두 잠깐 보여 준 뒤 닫고 "강아지는 어디 있을까?" 찾기 (2마리)
   3단계: 문 4개, 3마리 찾기 + 문을 닫은 뒤 "잘 보세요!" 두 집이 슝 자리를 바꿈(한 번) — 집을 눈으로 따라가야 함
   - 2·3단계 처음 보여 줄 때 이름을 말로도 ("곰!") — 글 못 읽는 아이도 이름을 들음
   - 틀리면 문 속 친구가 "나 아니야~" 하고 다시 닫힘 */
"use strict";
KP.game({
  id: "peekaboo",
  icon: "🚪",
  name: "까꿍 놀이",
  cat: "play",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("peekaboo", `
      .pk-stage{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#c9ecff 0%,#e8f7ff 62%,#9fdc86 62%,#78c466 100%);display:flex;align-items:center;justify-content:center}
      .pk-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:calc(var(--hs)*.18) clamp(10px,2.2vw,30px);padding:10px}
      .pk-house{position:relative;isolation:isolate;width:var(--hs);height:calc(var(--hs)*1.45);cursor:pointer}
      .pk-roof{position:absolute;left:-12%;right:-12%;top:0;height:30%;background:var(--roof);clip-path:polygon(50% 0,100% 100%,0 100%);filter:drop-shadow(0 4px 0 rgba(0,0,0,.15))}
      .pk-roof::after{content:"";position:absolute;left:44%;top:40%;width:12%;height:24%;border-radius:50%;background:#fff8d8;box-shadow:inset 0 0 0 3px rgba(0,0,0,.12)}
      .pk-wall{position:absolute;left:0;right:0;top:28%;bottom:0;background:var(--wall);border-radius:8px 8px 6px 6px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.08),0 6px 0 rgba(0,0,0,.1);perspective:600px}
      .pk-room{position:absolute;left:16%;right:16%;top:14%;bottom:0;border-radius:999px 999px 0 0;background:radial-gradient(circle at 50% 30%,#fff3c4,#ffd27a 70%,#e8a94a);overflow:hidden;
        display:flex;align-items:flex-end;justify-content:center}
      .pk-ani{font-size:calc(var(--hs)*.56);line-height:1;margin-bottom:6%;transform:translateY(30%) scale(.7);transition:transform .35s cubic-bezier(.2,1.6,.4,1)}
      .pk-ani .e{display:block}
      .pk-house.open .pk-ani{transform:none}
      .pk-door{position:absolute;left:16%;right:16%;top:14%;bottom:0;border-radius:999px 999px 0 0;transform-origin:0 50%;transition:transform .45s cubic-bezier(.3,1.1,.5,1);
        background:linear-gradient(90deg,rgba(0,0,0,.08),rgba(0,0,0,0) 30%),var(--door);box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
      .pk-door::before{content:"";position:absolute;left:16%;right:16%;top:12%;height:30%;border-radius:999px 999px 8px 8px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
      .pk-door::after{content:"";position:absolute;right:12%;top:55%;width:16%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff7c4,#f2b400);box-shadow:0 2px 0 rgba(0,0,0,.2)}
      .pk-low{position:absolute;left:16%;right:16%;top:56%;height:30%;border-radius:8px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
      .pk-house.open .pk-door{transform:rotateY(-100deg);filter:brightness(.85)}
      .pk-house.knock{animation:pk-knock .3s}
      @keyframes pk-knock{30%{transform:translateY(3px) scale(1.02,.98)}}
      .pk-say{position:absolute;left:50%;top:-6%;transform:translateX(-50%);white-space:nowrap;z-index:5;background:#fff;color:var(--ink);font-size:clamp(18px,2.6vw,26px);
        padding:4px 14px;border-radius:16px;box-shadow:0 4px 0 rgba(0,0,0,.1);animation:popBig .4s cubic-bezier(.2,1.6,.4,1);pointer-events:none}
      .pk-no .pk-ani{animation:pk-no .5s 2}
      @keyframes pk-no{25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
      .pk-yes .pk-ani{animation:pk-yes .5s 3}
      @keyframes pk-yes{50%{transform:translateY(-14%) scale(1.08)}}
      .pk-ask{position:absolute;left:50%;top:8px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:4px 18px 4px 8px;
        box-shadow:0 5px 0 rgba(47,58,102,.12);font-size:clamp(22px,3.4vw,32px);z-index:6;white-space:nowrap}
      .pk-ask .e{font-size:1.6em}
      .pk-ask.hide{display:none}
      .pk-house.swap{transition:translate .75s cubic-bezier(.45,0,.3,1);z-index:4}
      .pk-house.found::before{content:"";position:absolute;inset:-8%;border-radius:20px;box-shadow:0 0 0 5px #ffc531,0 0 26px 8px rgba(255,200,60,.6);z-index:-1}
    `);
    const stage = U.el("div", "pk-stage");
    const row = U.el("div", "pk-row");
    const ask = U.el("div", "pk-ask hide");
    stage.append(ask, row);
    ctx.body.appendChild(stage);
    Object.assign(ctx, { stage, row, ask });
    ctx.ANIMALS = [
      ["🐶", "강아지", "멍멍"], ["🐱", "고양이", "야옹"], ["🐷", "돼지", "꿀꿀"], ["🐮", "소", "음메"], ["🐥", "병아리", "삐약삐약"], ["🐸", "개구리", "개굴개굴"],
      ["🦁", "사자", "어흥"], ["🐵", "원숭이", "우끼끼"], ["🐑", "양", "매에"], ["🐴", "말", "히히힝"], ["🐰", "토끼", "깡총깡총"], ["🐻", "곰", "크앙"], ["🐔", "닭", "꼬끼오"], ["🦆", "오리", "꽥꽥"],
    ];
    ctx.STYLES = [
      ["#ff6b6b", "#ffe3d0", "#ff9f43"], ["#4dabf7", "#e7f5ff", "#3ec1d3"], ["#8f6bff", "#f3eeff", "#c08cff"], ["#2fb466", "#eafbe7", "#7bd389"], ["#ff8ad8", "#fff0f8", "#ff6fb5"], ["#ffb020", "#fff6dd", "#f59f00"],
    ];
    ctx.size = (n) => {
      const W = stage.clientWidth,
        H = stage.clientHeight;
      // 한 줄(n채)을 기본으로, 두 줄(2채씩)로 나눠 집이 15% 넘게 커지면 두 줄 (폰 세로·태블릿 세로)
      const hsOf = (p) => U.clamp(Math.min((W - 40) / p / 1.35, (H - 90) / Math.ceil(n / p) / 1.6), 90, 220);
      const perRow = n >= 3 && hsOf(2) > hsOf(n) * 1.15 ? 2 : n;
      const hs = Math.floor(hsOf(perRow));
      row.style.setProperty("--hs", hs + "px");
      row.style.columnGap = Math.round(U.clamp(innerWidth * 0.022, 10, 30) + hs * 0.08) + "px"; // 열린 문·지붕이 옆집에 덜 겹치게
      row.style.maxWidth = perRow * (hs * 1.3 + 30) + "px";
    };
    addEventListener("resize", () => ctx._active && ctx.row.children.length && ctx.size(ctx.row.children.length));
    ctx.creak = () => {
      KP.audio.tone(260, { to: 420, dur: 0.25, vol: 0.06, type: "triangle" });
      KP.audio.note("C5", { inst: "marimba", dur: 0.2, vol: 0.2 });
    };
    ctx.shut = () => {
      KP.audio.kick({ vol: 0.18 });
      KP.audio.note("G3", { inst: "marimba", dur: 0.2, vol: 0.2 });
    };
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = lv === 3 ? 4 : 3;
    const animals = U.sample(ctx.ANIMALS, n);
    const styles = U.shuffle([...ctx.STYLES]);
    ctx.row.innerHTML = "";
    ctx.ask.classList.add("hide");
    ctx.size(n);
    let busy = true;
    const houses = animals.map((a, i) => {
      const [roof, wall, door] = styles[i % styles.length];
      const h = U.el("div", "pk-house item");
      h.style.cssText = "--roof:" + roof + ";--wall:" + wall + ";--door:" + door + ";--i:" + i;
      h.dataset.tap = "1";
      h.innerHTML = '<div class="pk-roof"></div><div class="pk-wall"><div class="pk-room"><div class="pk-ani">' + KP.E(a[0]) + '</div></div><div class="pk-door"><div class="pk-low"></div></div></div>';
      h.a = a;
      ctx.row.appendChild(h);
      ctx.fast(h, () => tapHouse(h));
      return h;
    });
    const bubble = (h, text, ms = 1600) => {
      const s = U.el("div", "pk-say", text);
      h.appendChild(s);
      ctx.after(ms, () => s.remove());
    };
    const open = (h) => {
      h.classList.add("open");
      ctx.creak();
    };
    const close = (h) => {
      h.classList.remove("open", "pk-no", "pk-yes");
      ctx.after(250, ctx.shut);
    };

    let tapHouse;
    if (lv === 1) {
      /* ---------- 자유롭게 열기 ---------- */
      busy = false;
      ctx.say("문을 콕! 열어 봐요. 누가 숨어 있을까? 🚪");
      let opened = 0;
      tapHouse = (h) => {
        if (busy) return;
        U.replay(h, "knock");
        if (h.classList.contains("open")) {
          // 열린 친구를 또 누르면 울음소리
          U.replay(h, "pk-yes");
          bubble(h, h.a[2] + "!", 1200);
          KP.voice.say(h.a[2] + "!");
          A.sfx("boing");
          return;
        }
        open(h);
        A.sfx("boing");
        bubble(h, "까꿍!");
        KP.voice.say("까꿍! " + h.a[1] + "! " + h.a[2] + "!");
        U.replay(h, "pk-yes");
        opened++;
        if (opened === n) {
          busy = true;
          ctx.after(2200, async () => {
            ctx.score.add();
            ctx.round++;
            const big = ctx.round % 4 === 0;
            ctx.noStar(); // 1단계: 문을 다 열면 끝(틀릴 수 없음) → 열쇠 별 없음
            const ok = await ctx.win({ big, msg: big ? "{부름} 까꿍 대장!" : "모두 찾았다!" });
            if (ok) this.next(ctx);
          });
        } else hintFree();
      };
      const hintFree = () => ctx.hint(() => houses.find((h) => !h.classList.contains("open")), "문을 콕 눌러서 열어 봐요!");
      hintFree();
      return;
    }

    /* ---------- 기억해서 찾기 ---------- */
    const asks = U.sample(animals, lv === 3 ? 3 : 2);
    let ai = 0;
    ctx.say("누가 어디에 사는지 잘 보세요! 👀");
    tapHouse = (h) => {
      if (busy || h.classList.contains("open")) return;
      const target = asks[ai];
      U.replay(h, "knock");
      open(h);
      if (h.a === target) {
        busy = true;
        h.classList.add("found", "pk-yes");
        A.sfx("good");
        bubble(h, "까꿍!");
        KP.voice.say("까꿍! 찾았다! " + h.a[1] + "! " + h.a[2] + "!");
        ctx.score.add();
        ai++;
        ctx.after(1800, async () => {
          if (ai < asks.length) {
            close(h);
            h.classList.remove("found");
            ctx.after(450, askNext);
          } else {
            ctx.round++;
            const big = ctx.round % 4 === 0;
            const ok = await ctx.win({ big, msg: big ? "{부름} 기억력 대장!" : "다 찾았어요!" });
            if (ok) this.next(ctx);
          }
        });
      } else {
        h.classList.add("pk-no");
        bubble(h, "나 아니야~");
        ctx.miss(null, "나는 " + h.a[1] + "! 나 아니야~");
        busy = true;
        ctx.after(1500, () => {
          close(h);
          busy = false;
        });
      }
    };
    const askNext = () => {
      const t = asks[ai];
      ctx.ask.innerHTML = KP.E(t[0]) + "<span>" + U.josa(t[1], "은/는") + " 어디?</span>";
      ctx.ask.classList.remove("hide");
      U.replay(ctx.ask, "pop");
      ctx.say(U.josa(t[1], "은/는") + " 어디 있을까? 문을 콕! 🚪");
      busy = false;
      // 정답 집을 가리키는 힌트 → 가리킨 판은 열쇠 별 없음(answer)
      ctx.hint(() => houses.find((h) => h.a === t), U.josa(t[1], "은/는") + " 어느 집에 있었지?", { answer: true });
    };
    /** 3단계: 두 집 자리 바꾸기 (FLIP — 바꾼 뒤 옛 자리에서 새 자리로 미끄러지듯) */
    const swap = () => {
      const [a, b] = U.sample(houses, 2);
      const r0 = new Map(houses.map((h) => [h, h.getBoundingClientRect()]));
      const mark = document.createComment("");
      a.replaceWith(mark);
      b.replaceWith(a);
      mark.replaceWith(b);
      for (const h of [a, b]) {
        const p = r0.get(h),
          q = h.getBoundingClientRect();
        h.classList.remove("swap");
        h.style.translate = p.left - q.left + "px " + (p.top - q.top) + "px";
      }
      void ctx.row.offsetWidth;
      for (const h of [a, b]) {
        h.classList.add("swap");
        h.style.translate = "0px 0px";
      }
      A.sfx("whoosh");
      ctx.after(800, () => [a, b].forEach((h) => (h.classList.remove("swap"), (h.style.translate = ""))));
    };
    // 처음에 모두 보여 주기 (이름은 말로도)
    const showMs = lv === 3 ? 3000 : 2500;
    ctx.after(500, () => {
      houses.forEach((h, i) =>
        ctx.after(i * 650, () => {
          open(h);
          bubble(h, h.a[1], showMs);
          KP.voice.say(h.a[1] + "!");
        })
      );
      ctx.after((n - 1) * 650 + showMs, () => {
        houses.forEach(close);
        KP.voice.say("문을 닫았어요!");
        if (lv < 3) return ctx.after(1100, askNext);
        // 3단계: 잘 보세요! → 두 집이 자리를 바꿈
        ctx.after(1200, () => {
          KP.voice.say("잘 보세요!");
          ctx.after(700, () => {
            swap();
            ctx.after(1300, askNext);
          });
        });
      });
    });
  },
});

;

/* ==== js/games/play/potty.js ==== */
/* 응가 끙끙 화장실 — 점토 화장실에서 아이가 칠한 3D 인형 친구(없으면 기본 인형)가 혼자 화장실 가기
   - 꼼지락 신호(인형이 들썩들썩) → 장면 속 물건 고르기(변기 / 창가 쿠키 / 곰인형, 보기 3개) → 변기 앞으로 걸어감
   - 순서(장면 속 물건을 직접 눌러요): 친구(바지 내리기) → 변기(뚜껑이 열리고 폴짝 앉기) → 끙끙(친구를 콕콕) → 휴지걸이(휴지 쭉)
     → 친구(내려와서 바지 올리기) → 변기 물 내림 손잡이(물 소용돌이) → 세면대(걸어가서 손 씻기 — 손 씻기 놀이의 세면대·손 장면을 짧게)
   - 바지 내리기: 바지(점토 소품)가 발목까지 쭉 내려가 쭈글쭈글 모임(납작·넓게·주름) → 걸을 때·앉아 있을 때도 발목을 따라감 → 일어나서 다시 허리로
   - 앉기: 인형 자세는 그대로, 엉덩이가 변기 시트 높이에 오게 들어 올리고 변기 앞에 둠 → 윗몸은 시트 위로 다 보이고 다리·발목 바지는 변기 앞면 앞으로 내려옴
     (예전엔 앞가림이 허리 아래를 가려 변기에 빠진 것처럼 보였음 — 앞가림은 쓰지 않음). 앉아 있는 동안 시트 구멍은 물빛 대신 그늘색
   - 뚜껑은 배경 그림에서 닫혀 있어 → 변기에 가면 캔버스로 연 모습(세운 뚜껑·변기 시트·물)을 덮어 그림. 물 내림 소용돌이도 여기
   - 세로 화면(폰·태블릿 세로)은 배경이 양옆으로 잘려서 → 카메라가 친구를 따라 옆으로 이동(focusP 를 바꾸고 무대 다시 맞춤)
   - 지저분한 그림·말 없음 ('퐁당!', '시원하다!' 정도). 단계: 1 순서 안내(할 물건이 반짝) → 2 '다음엔 뭘 할까요?' → 3 혼자서. 시간 제한 없음
   공용: _shared/clay-stage.js · doll-actor.js · play-feedback.js · play/_care.js(순서·문지르기 판·표면 마스크) */
"use strict";
KP.game({
  id: "potty",
  icon: "🚽",
  name: "응가 끙끙 화장실",
  cat: "play",
  levels: 3,
  score: "🧻",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/potty/");
    const HW = (ctx.HW = "assets/play-clay/handwash/");
    KP.care.css();
    KP.css("potty", `
      .pt-scene{background:#e9e2cf}
      .pt-back{position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none}
      .pt-pants{position:absolute;left:0;top:0;z-index:1;pointer-events:none;will-change:transform;transform-origin:0 0}
      .pt-pants img{width:100%;height:100%;object-fit:fill;display:block;filter:drop-shadow(0 3px 3px rgba(60,40,20,.25))}
      /* 발목에 모인 바지의 주름 (바지 모양으로 잘라 겹침) */
      .pt-pants::after{content:"";position:absolute;inset:0;opacity:var(--wr,0);pointer-events:none;
        background:repeating-linear-gradient(171deg,rgba(255,255,255,0) 0 8%,rgba(255,255,255,.32) 10%,rgba(30,80,140,.36) 13%,rgba(30,80,140,0) 17%),
          repeating-linear-gradient(189deg,rgba(30,80,140,0) 0 11%,rgba(30,80,140,.22) 14%,rgba(30,80,140,0) 18%);
        -webkit-mask:url(assets/play-clay/potty/pants.png) center/100% 100% no-repeat;mask:url(assets/play-clay/potty/pants.png) center/100% 100% no-repeat}
      .pt-hit{position:absolute;left:0;top:0;z-index:6;border-radius:40%;touch-action:manipulation;cursor:pointer}
      /* 누를 곳 빛 고리는 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .pt-hit::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:0 0 0 7px rgba(255,205,40,.75);background:rgba(255,240,170,.2)}
      .pt-hit.glow{animation:none}
      .pt-hit.glow::after{animation:pt-ring 1.1s ease-in-out infinite alternate}
      @keyframes pt-ring{to{opacity:1}}
      .pt-doll.glow{border-radius:45%}
      .pt-obj{position:absolute;left:0;top:0;z-index:6;touch-action:manipulation;cursor:pointer;transition:opacity .4s,transform .3s}
      .pt-obj img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 5px 4px rgba(60,40,20,.3))}
      .pt-obj.glow img{animation:pt-glowF 1.1s ease-in-out infinite alternate}
      @keyframes pt-glowF{from{filter:drop-shadow(0 5px 4px rgba(60,40,20,.3))}to{filter:drop-shadow(0 0 9px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .pt-obj.away{opacity:0;pointer-events:none}
      .pt-teddy{z-index:7}
      .pt-lever{z-index:5;pointer-events:none;transform-origin:72% 52%;transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
      .pt-lever img{transform:scaleX(-1);clip-path:inset(0 0 21% 0)}
      .pt-lever.down{transform:rotate(-38deg)}
      .pt-lever.glow img{animation:pt-glowL 1.1s ease-in-out infinite alternate}
      @keyframes pt-glowL{from{filter:drop-shadow(0 4px 3px rgba(60,40,20,.3))}to{filter:drop-shadow(0 0 8px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .pt-strip{position:absolute;left:0;top:0;z-index:4;pointer-events:none;transform-origin:50% 0;transform:scaleY(0);border-radius:0 0 18% 18%/0 0 8% 8%;
        background:repeating-linear-gradient(180deg,transparent 0 31%,rgba(170,155,130,.35) 31% 32.5%),linear-gradient(90deg,#efe9dc,#fffdf7 30%,#fbf6ec 70%,#e6dfd0);
        box-shadow:0 3px 4px rgba(60,40,20,.2);transition:transform .45s ease-out,opacity .4s}
      .pt-strip.on{transform:scaleY(1)}
      .pt-strip.fly{opacity:0;transition:transform .55s ease-in,opacity .55s}
      .pt-load{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      /* 손 씻기 (세면대 가까이 보기) */
      .pt-wash{position:absolute;inset:0;z-index:8;opacity:0;pointer-events:none;transition:opacity .35s;background:#cfe6cf;overflow:hidden;border-radius:inherit}
      .pt-wash.on{opacity:1;pointer-events:auto}
      .pt-wtap{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
      .pt-wtap img{width:100%;height:100%;display:block}
      .pt-wash.water .pt-wtap{transform:rotate(-36deg)}
      .pt-wstream{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transform-origin:50% 0;transform:scaleY(0);opacity:0;transition:transform .3s ease-in,opacity .2s;
        border-radius:45% 45% 40% 40%/6% 6% 5% 5%;
        background:linear-gradient(90deg,rgba(140,200,250,.35),rgba(215,240,255,.85) 28%,rgba(255,255,255,.95) 40%,rgba(180,222,252,.7) 62%,rgba(120,185,240,.4));
        -webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent)}
      .pt-wash.water .pt-wstream{transform:scaleY(1);opacity:1}
      .pt-whands{position:absolute;left:0;top:0;z-index:4;pointer-events:none}
      .pt-whands img{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 8px rgba(60,40,20,.25))}
      .pt-wash .pt-hit{z-index:6}
      .pt-wash.rubbing .pt-hit{pointer-events:none}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene pt-scene"));
    ctx.body.appendChild(scene);
    const mk = (cls, html = "", tag = "div", host = scene) => {
      const e = U.el(tag, cls, html);
      host.appendChild(e);
      return e;
    };
    // 무대(clay-stage) 층 사이에 끼울 것: 뒤 캔버스(배경 바로 위) · 바지(3D 위, 앞가림 아래) — makeStage 에서 제자리로 옮김
    ctx.back = mk("pt-back", "", "canvas");
    ctx.pants = mk("pt-pants", '<img alt="" src="' + IMG + 'pants.png">');
    ctx.strip = mk("pt-strip");
    ctx.lever = mk("pt-obj pt-lever", '<img alt="" draggable="false" src="' + IMG + 'lever.png">');
    ctx.cookie = mk("pt-obj pt-cookie", '<img alt="" draggable="false" src="' + IMG + 'cookie.png">');
    ctx.teddy = mk("pt-obj pt-teddy", '<img alt="" draggable="false" src="' + IMG + 'teddy.png">');
    ctx.cookie.setAttribute("aria-label", "쿠키");
    ctx.teddy.setAttribute("aria-label", "곰인형");
    ctx.hit = {};
    for (const [k, label] of [["toilet", "변기"], ["paper", "휴지"], ["flush", "물 내림 손잡이"], ["sink", "세면대"], ["doll", "친구"]]) {
      ctx.hit[k] = mk("pt-hit pt-" + k);
      ctx.hit[k].setAttribute("aria-label", label);
    }
    ctx.S = KP.care.surface(ctx, scene, { pass: true }); // 반짝이·물방울
    ctx.fast(ctx.hit.doll, () => ctx.onKid && ctx.onKid());
    // 손 씻기 가까이 보기
    const ov = (ctx.wash = mk("pt-wash"));
    ctx.wTaps = [mk("pt-wtap", '<img alt="" src="' + HW + 'tap-blue.png">', "div", ov), mk("pt-wtap", '<img alt="" src="' + HW + 'tap-pink.png">', "div", ov)];
    ctx.wStream = mk("pt-wstream", "", "div", ov);
    ctx.wHands = mk("pt-whands", '<img alt="" draggable="false" src="' + HW + 'palms.png">', "div", ov);
    ctx.wF = { x: 0, y: 0, w: 1, h: 1 };
    ctx.W2 = KP.care.surface(ctx, ov, { frame: () => ctx.wF, pass: true });
    ctx.W2.radius = 0.09;
    ctx.wFaucet = mk("pt-hit pt-wfaucet", "", "div", ov);
    ctx.wFaucet.setAttribute("aria-label", "수도꼭지");
    ctx.wFaucet.addEventListener("click", () => ctx.onFaucet && ctx.onFaucet());
    ctx.HWBG = { file: HW + "bg.jpg", img: [1600, 900], vh: 0.2, near: 0.2, fov: 34, focus: [0.52, 0.56], focusP: [0.525, 0.62], zoomP: (w, h) => (w / h > 0.7 ? 1.25 : 1) };
    ctx.TAPBOX = [
      [0.3586, 0.3936, 0.0833, 0.1489],
      [0.5446, 0.3936, 0.0833, 0.1489],
    ];

    // 화장실 배경 (1600×900): 왼쪽 변기+발판, 가운데 빈 바닥, 오른쪽 세면대. 세로 화면은 focusP 를 바꿔 따라감
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1600, 900], vh: 0.35, near: 0.2, fov: 34,
      focus: [0.5, 0.56], focusP: [0.26, 0.6], sun: [0.3, 1, 0.8], sunCol: "#fff4e6",
    };
    // 그림 좌표(0~1)
    ctx.P = {
      lid: [0.1866, 0.5433, 0.0884, 0.0412], // 뚜껑 타원 (가운데 u,v · 반지름 u,v)
      lever: [0.0706, 0.4144],
      start: [0.5, 0.92], startP: [0.36, 0.92], front: [0.29, 0.94], seat: [0.1866, 0.775], sitAt: [0.19, 0.8], hip: 0.55, mid: [0.63, 0.92], sink: [0.83, 0.93],
      boxes: { toilet: [0.04, 0.33, 0.28, 0.66], flush: [0.025, 0.36, 0.11, 0.47], paper: [0.256, 0.333, 0.338, 0.5], sink: [0.735, 0.31, 0.95, 0.58] },
      strip: [0.2956, 0.49, 0.05], // 휴지 끝 (가운데 u, 위 v, 폭 u)
      cookie: [0.415, 0.295, 0.072], teddy: [0.1, 0.9, 0.055], // 가운데 u · 바닥 v · 폭 u (쿠키는 창턱, 곰인형은 변기 왼쪽 앞 바닥)
    };
    ctx.token = 0;
  },

  /* ---------- 무대 · 인형 (목욕·병원과 같은 방식) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("potty:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    let st;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => ctx._active && ctx.st === st && this.start(ctx, true),
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("potty:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    ctx.BG.focusP = [0.26, 0.6];
    try {
      st = CS.create(ctx.scene, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.scene, ctx.BG, opt);
    }
    // 층 순서: 배경 → 뒤 캔버스(연 뚜껑) → [그림 인형] → 3D → 바지 → …
    st.bgEl.after(ctx.back);
    st.frontEl.before(ctx.pants);
    ctx.st = st;
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
  },
  pickDoll(ctx) {
    const U = KP.u, D = KP.DOLL;
    const list = ctx.dolls || [];
    if (list.length) {
      const c = list.length > 1 ? list.filter((x) => x.id !== ctx.lastDoll) : list;
      const it = U.pick(c);
      ctx.lastDoll = it.id;
      return { item: it };
    }
    const sp = U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },
  async start(ctx, again) {
    if (!again) ctx.round = 0;
    const tok = ++ctx.token;
    ctx.scene.querySelectorAll(".pt-load").forEach((e) => e.remove());
    const wait = KP.u.el("div", "pt-load", KP.E("🚽") + " 준비 중");
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      if (ctx.pan) ctx.pan(dt);
      st.tick(dt);
      if (ctx.track) ctx.track(dt);
    });
    ctx.S.run();
    ctx.W2.run();
    return this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    ctx.onKid = ctx.onFaucet = null;
    this.closeWash(ctx);
    this.dropStage(ctx);
  },
  closeWash(ctx) {
    ctx.wash.classList.remove("on", "water", "rubbing");
    if (ctx.W2) {
      ctx.W2.reset();
      ctx.W2.dropSkin();
    }
    if (ctx.wst) ctx.wst.dispose();
    ctx.wst = null;
  },

  /** 연 변기(세운 뚜껑 · 시트 · 물)와 물 내림 소용돌이 — 뒤 캔버스 (배경 위, 인형 아래) */
  drawBack(ctx, dt) {
    const c = ctx.back, st = ctx.st, d = Math.min(2, window.devicePixelRatio || 1), W = st.w, H = st.h;
    if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) {
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
    }
    const g = c.getContext("2d");
    const o = ctx.lidOpen || 0;
    if (o <= 0 && ctx._backClear) return; // 닫혀 있으면 한 번만 지우고 쉼 (저가 기기)
    ctx._backClear = o <= 0;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, H);
    if (o <= 0) return;
    const v = st.bc.view, L = ctx.P.lid, p = st.uvToPx(L[0], L[1]);
    const rx = L[2] * v.fw, ry = L[3] * v.fh;
    g.globalAlpha = Math.min(1, o * 1.5);
    // 세운 뚜껑 (물탱크에 기댐) — 열리며 위로 커짐
    const lh = ry * 2.3 * o, ly = p.y - ry * 0.3 - lh;
    let gr = g.createLinearGradient(p.x - rx, 0, p.x + rx, 0);
    gr.addColorStop(0, "#e9dcc2");
    gr.addColorStop(0.45, "#f8f0de");
    gr.addColorStop(1, "#dccdb0");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(p.x + rx * 0.02, ly + lh, rx * 0.86, lh, 0, Math.PI, 0);
    g.lineTo(p.x + rx * 0.88, p.y - ry * 0.2);
    g.lineTo(p.x - rx * 0.84, p.y - ry * 0.2);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(150,125,90,.45)";
    g.lineWidth = Math.max(1.5, rx * 0.025);
    g.stroke();
    // 뚜껑 안쪽 둥근 자국
    g.strokeStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.ellipse(p.x, ly + lh, rx * 0.66, lh * 0.75, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    // 변기 시트 (배경의 닫힌 뚜껑 윗면을 덮음)
    gr = g.createRadialGradient(p.x - rx * 0.3, p.y - ry * 0.6, ry * 0.2, p.x, p.y, rx * 1.05);
    gr.addColorStop(0, "#fffaf0");
    gr.addColorStop(0.7, "#f2e7d2");
    gr.addColorStop(1, "#ddcbab");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(p.x, p.y, rx + 2, ry + 2, 0, 0, 6.283);
    g.fill();
    // 물 (구멍)
    const wx = p.x + rx * 0.02, wy = p.y + ry * 0.06, wrx = rx * 0.66, wry = ry * 0.6;
    gr = g.createLinearGradient(0, wy - wry, 0, wy + wry);
    gr.addColorStop(0, "#c9b79a");
    // 앉아 있는 동안은 물빛 대신 시트 안쪽 그늘색 (물에 잠긴 것처럼 보이지 않게)
    gr.addColorStop(0.28, ctx.sit ? "#d8c6a6" : "#9fd4ef");
    gr.addColorStop(1, ctx.sit ? "#c4ae88" : "#6fb8e2");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(wx, wy, wrx, wry, 0, 0, 6.283);
    g.fill();
    // 물 내림 소용돌이
    const sw = ctx.swirl || 0;
    if (sw > 0) {
      ctx._sa = (ctx._sa || 0) + dt * 9;
      g.save();
      g.beginPath();
      g.ellipse(wx, wy + wry * 0.1, wrx * 0.95, wry * 0.8, 0, 0, 6.283);
      g.clip();
      g.globalAlpha = Math.min(1, o * 1.5) * Math.min(1, sw * 2);
      g.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = k % 2 ? "rgba(255,255,255,.9)" : "rgba(60,150,215,.75)";
        g.lineWidth = Math.max(2, wry * 0.22);
        g.beginPath();
        for (let i = 0; i <= 20; i++) {
          const t = i / 20, an = ctx._sa + k * 2.1 + t * 4.5, rr = (1 - t * 0.85) * sw;
          const x = wx + Math.cos(an) * wrx * 0.85 * rr, y = wy + wry * 0.1 + Math.sin(an) * wry * 0.7 * rr;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.restore();
    }
    // 시트 안쪽 테두리 그림자·윤기
    g.globalAlpha = Math.min(1, o * 1.5);
    g.strokeStyle = "rgba(130,105,70,.45)";
    g.lineWidth = Math.max(1.5, ry * 0.12);
    g.beginPath();
    g.ellipse(wx, wy, wrx, wry, 0, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,.7)";
    g.lineWidth = Math.max(1.5, ry * 0.1);
    g.beginPath();
    g.ellipse(p.x, p.y, rx * 0.92, ry * 0.86, 0, Math.PI * 1.15, Math.PI * 1.55);
    g.stroke();
    g.globalAlpha = 1;
  },

  async next(ctx) {
    const U = KP.u,
      A = KP.audio,
      C = KP.care,
      S = ctx.S,
      st = ctx.st,
      P = ctx.P;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    S.reset();
    ctx.track = null;
    ctx.onKid = null;
    ctx.lidOpen = 0;
    ctx.swirl = 0;
    ctx.pantsDown = 0;
    ctx.sit = false;
    ctx.stage = "enter";
    ctx.lever.classList.remove("down", "glow");
    ctx.strip.classList.remove("on", "fly");
    ctx.cookie.classList.remove("away", "glow");
    ctx.teddy.classList.remove("away", "glow");
    for (const k in ctx.hit) ctx.hit[k].classList.remove("glow");
    this.closeWash(ctx);
    const tall = () => st.w / st.h < 0.8;
    // 세로 화면 카메라: focusP 를 천천히 옮겨 무대 다시 맞춤
    let panTo = null;
    ctx.pan = (dt) => {
      if (panTo == null || !tall()) return;
      const f = ctx.BG.focusP, dx = panTo - f[0];
      if (Math.abs(dx) < 0.002) {
        f[0] = panTo;
        panTo = null;
      } else f[0] += dx * Math.min(1, dt * 3.2);
      st.resize(true);
    };
    const pan = (u) => {
      panTo = u;
    };
    ctx.BG.focusP[0] = 0.26;
    st.resize(true);

    /* ---------- 인형 ---------- */
    const pick = this.pickDoll(ctx);
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    let act;
    try {
      act = st.gl ? await KP.dollActor.create(st, pick) : await KP.dollActor.create2D(st, pick);
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (!live()) return;
      act = await KP.dollActor.create2D(st, { species: "bear" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    const G = (uv) => st.bc.ground(uv[0], uv[1]) || st.spot("x");
    const legK = (act.k && act.k.spec && act.k.spec.pivot && act.k.spec.pivot.leg) || 0.18;
    // 키: 변기 깊이에서 그림 높이의 0.4 (원근 때문에 앞쪽에서는 더 크게 보임) — 좁은 세로 화면은 0.32
    // 앉아 있을 때는 조금 작게(SIT_K) — 변기 크기와 맞고 옆 휴지걸이를 덜 가림
    const SIT_K = 0.86;
    const hFor = (sit) => {
      const g = G(P.seat);
      return st.fitH(g[0], g[1], ((tall() ? 0.32 : 0.4) * st.bc.view.fh) / st.h) * (sit ? SIT_K : 1);
    };
    const sizeUp = () => act.setH(hFor(ctx.sit));
    sizeUp();
    /** 앉을 때 들어 올릴 높이: 엉덩이(다리 시작 높이)가 시트 위(가운데와 앞 테두리 사이, P.hip)에 오게 — 인형은 변기 앞(sitAt)에 둠 */
    const seatLift = (h = act.h) => {
      const g = G(P.sitAt), y0 = st.project(g[0], 0, g[1]).y, y1 = st.project(g[0], 1, g[1]).y;
      const sy = st.uvToPx(P.lid[0], P.lid[1] + P.lid[3] * P.hip).y;
      return (y0 - sy) / Math.max(1, y0 - y1) - legK * h;
    };
    st.onResize = () => {
      sizeUp();
      if (ctx.sit) {
        const g = G(P.sitAt);
        act.place(g[0], g[1]);
        act.lift = seatLift();
      }
    };
    const startG = G(tall() ? P.startP : P.start); // 세로 화면: 변기·쿠키·곰인형과 함께 보이게
    act.place(startG[0], startG[1]);
    act.mood("normal");

    /* ---------- 매 장면: 자리 맞추기 (누르는 곳·소품·바지·뒤 캔버스) ---------- */
    const box = (e, x0, y0, x1, y1) => Object.assign(e.style, { left: x0 + "px", top: y0 + "px", width: Math.max(1, x1 - x0) + "px", height: Math.max(1, y1 - y0) + "px" });
    const boxUV = (e, b, minPx = 72) => { // 폰 가로에서도 72px 이상
      const a = st.uvToPx(b[0], b[1]), c = st.uvToPx(b[2], b[3]);
      // 보이는 곳만 (세로 화면은 배경 양옆이 잘림) — 화면 밖이면 숨김
      let x0 = Math.max(0, a.x), y0 = Math.max(0, a.y), x1 = Math.min(st.w, c.x), y1 = Math.min(st.h, c.y);
      e.hidden = x1 - x0 < 24 || y1 - y0 < 24;
      // 너무 작으면 키움 (유아 손가락) — 화면 안쪽으로
      if (x1 - x0 < minPx) {
        if (x0 + minPx > st.w) x0 = x1 - minPx;
        else x1 = x0 + minPx;
      }
      if (y1 - y0 < minPx) (y0 -= (minPx - (y1 - y0)) / 2), (y1 = y0 + minPx);
      box(e, x0, y0, x1, y1);
    };
    const propAt = (e, spec, aspect) => {
      const v = st.bc.view, w = Math.max(80, spec[2] * v.fw), h = w / aspect, p = st.uvToPx(spec[0], spec[1]);
      const x = KP.u.clamp(p.x - w / 2, 8, st.w - w - 8); // 좁은 세로 화면: 보이는 곳 안으로
      box(e, x, p.y - h, x + w, p.y);
    };
    let wig = 0,
      pantsBase = null,
      pantsWr = "";
    ctx.track = (dt) => {
      const v = st.bc.view;
      for (const k of ["toilet", "flush", "paper", "sink"]) boxUV(ctx.hit[k], P.boxes[k]);
      // 물 내림 손잡이 (배경의 손잡이 위에 점토 손잡이를 겹침)
      const lp = st.uvToPx(P.lever[0], P.lever[1]), lw = 0.06 * v.fw, lh = lw * (211 / 239);
      box(ctx.lever, lp.x - lw * 0.6, lp.y - lh * 0.5, lp.x + lw * 0.4, lp.y + lh * 0.5);
      propAt(ctx.cookie, P.cookie, 252 / 219);
      propAt(ctx.teddy, P.teddy, 201 / 256);
      // 휴지 끝
      const sp = st.uvToPx(P.strip[0], P.strip[1]), sw = P.strip[2] * v.fw;
      box(ctx.strip, sp.x - sw / 2, sp.y, sp.x + sw / 2, sp.y + sw * 1.7);
      // 친구 누르는 곳(서 있으면 바지 둘레, 앉으면 윗몸) · 바지
      const b = act.box();
      const kr = act.anchor("kneeR"), kl = act.anchor("kneeL"), be = act.anchor("belly");
      const kx = (kr.x + kl.x) / 2, ky = (kr.y + kl.y) / 2;
      const pw = Math.max(Math.abs(kr.x - kl.x) * 2.3, b.w * 0.5), ph = pw * (226 / 256);
      // 바지 내림(0→1): 허리 → 발목. 내려갈수록 납작·넓게(쭈글쭈글 모임) — 걷기·앉기 때도 발(b.b)을 따라감
      const k = ctx.pantsDown, ks = Math.max(0, (k - 0.55) / 0.45), sq = ks * ks * (3 - 2 * ks);
      const pww = pw * (1 + 0.25 * sq), phh = ph * (1 - 0.64 * sq);
      const upY = be.y * 0.3 + ky * 0.7, dnY = b.b - phh * 0.36;
      const py = upY + (dnY - upY) * k;
      // 크기는 기준 크기를 정해 두고 늘이기(scale)로만 바꿈 — 매 장면 너비·높이를 바꾸면 그림자 그림을 매번 다시 칠함
      if (!pantsBase || Math.abs(pww / pantsBase[0] - 1) > 0.3 || Math.abs(phh / pantsBase[1] - 1) > 0.4) {
        pantsBase = [pww, phh];
        ctx.pants.style.width = pww + "px";
        ctx.pants.style.height = phh + "px";
      }
      ctx.pants.style.transform = `translate(${kx - pww / 2}px,${py - phh / 2}px) scale(${pww / pantsBase[0]},${phh / pantsBase[1]})`;
      const wr = sq.toFixed(2);
      if (wr !== pantsWr) ctx.pants.style.setProperty("--wr", (pantsWr = wr));
      if (ctx.sit) {
        // 앉으면 윗몸 — 오른쪽 휴지걸이(누르는 곳)와 겹치지 않게 잘라 냄
        const pr = ctx.hit.paper.hidden ? st.w : parseFloat(ctx.hit.paper.style.left);
        box(ctx.hit.doll, b.l - 6, b.t, Math.max(b.cx + 30, Math.min(b.r + 6, pr - 2)), b.t + b.h * 0.62);
      }
      else {
        const hw = Math.max(pw * 0.75, 44);
        box(ctx.hit.doll, kx - hw, Math.min(upY, py) - ph * 0.75, kx + hw, Math.max(b.b, py + ph * 0.6));
      }
      // 꼼지락: 들썩들썩 + 좌우로
      if (ctx.stage === "wiggle") {
        wig += dt;
        act.play.sway = Math.sin(wig * 13) * 0.07;
        act.play.bob = Math.abs(Math.sin(wig * 6.5)) * 0.035;
        act.play.tilt = Math.sin(wig * 9) * 0.1;
      } else if (act.play.sway || act.play.bob || act.play.tilt) act.play.sway = act.play.bob = act.play.tilt = 0;
      this.drawBack(ctx, dt);
    };
    ctx.track(0);
    const dollTop = () => Math.max(56, act.box().t + act.box().h * 0.05);
    const dollCx = () => act.box().cx;
    const tween = (ms, f) =>
      new Promise((res) => {
        const t0 = performance.now();
        const step = () => {
          if (!live()) return res();
          const k = Math.min(1, (performance.now() - t0) / ms);
          f(k);
          if (k >= 1) res();
          else requestAnimationFrame(step);
        };
        step();
      });
    /** 폴짝: (x,z, 들어 올림, 키) 로 — 가운데쯤 mid() */
    const hop = async (g, lift1, ms, mid, h1) => {
      const a = act.a, x0 = a.x, z0 = a.z, l0 = act.lift || 0, hk = act.h * 0.28, h0 = act.h;
      let told = false;
      await tween(ms, (k) => {
        const e = k * k * (3 - 2 * k);
        act.place(x0 + (g[0] - x0) * e, z0 + (g[1] - z0) * e);
        if (h1) act.setH(h0 + (h1 - h0) * e);
        act.lift = l0 + (lift1 - l0) * e + Math.sin(Math.PI * k) * hk;
        if (!told && k > 0.5) (told = true), mid && mid();
      });
      act.lift = lift1;
      if (act.a) act.a.sqv = 5;
    };
    const walk = async (uv) => {
      const g = G(uv);
      await Promise.race([act.walkTo(g[0], g[1], 1.4), ctx.wait(4000)]);
      if (live()) act.place(g[0], g[1]);
    };
    // 점검용
    ctx.ptState = () => ({ tok, stage: ctx.stage, gl: !!st.gl, painted: !!act.painted, who: act.name, sit: ctx.sit, lid: ctx.lidOpen, pants: ctx.pantsDown, washing: ctx.wash.classList.contains("on"), swirl: ctx.swirl, focus: ctx.BG.focusP[0] });
    ctx.ptRect = (k) => {
      const e = k === "lever" ? ctx.lever : k === "cookie" || k === "teddy" ? ctx[k] : ctx.hit[k];
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    };

    /* ---------- 1) 꼼지락 신호 → 어디로 갈까? (장면 속 물건 3개) ---------- */
    await ctx.wait(400);
    if (!live()) return;
    ctx.stage = "wiggle";
    C.pop(ctx, ctx.scene, dollCx(), dollTop(), "꼼지락");
    A.tone(520, { to: 640, dur: 0.12, vol: 0.1, type: "triangle" });
    const ac = window.AbortController ? new AbortController() : null;
    let done = false;
    // 물건은 바로 누를 수 있음 (말이 끝나기 전에 눌러도 됨)
    ctx.after(900, () => live() && !done && ctx.say("어? 친구가 꼼지락꼼지락! 어디에 가야 할까요?"));
    const picked = await new Promise((res) => {
      const right = () => {
        if (done || !live()) return;
        done = true;
        res(true);
      };
      const wrong = (el) => {
        if (done || !live()) return;
        ctx.miss(el, "음, 배가 신호를 보내는 것 같아요!");
        A.tone(400, { to: 300, dur: 0.15, vol: 0.1 });
      };
      const on = (el, f) => el.addEventListener("click", () => (KP.audio.unlock(), f(el)), ac ? { signal: ac.signal } : false);
      on(ctx.hit.toilet, right);
      on(ctx.hit.flush, right);
      on(ctx.cookie, wrong);
      on(ctx.teddy, wrong);
      if (lv === 1) {
        ctx._hinted = true; // 안내 단계: 정답이 반짝
        ctx.hit.toilet.classList.add("glow");
      }
      ctx.hint(() => ctx.hit.toilet, "화장실을 눌러요!", { answer: true }); // 정답(변기)을 가리킴 → 가리킨 판은 열쇠 별 없음
    });
    if (ac) ac.abort();
    if (!picked || !live()) return;
    ctx.hint(null);
    ctx.hit.toilet.classList.remove("glow");
    A.sfx("good");
    ctx.cookie.classList.add("away");
    ctx.teddy.classList.add("away");
    ctx.stage = "walk";
    KP.voice.say("응가가 마려운가 봐요! 화장실에 가요!");
    pan(0.2);
    await walk(P.front);
    if (!live()) return;
    act.a.yaw = 0;

    /* ---------- 2) 순서대로 (장면 속 물건) ---------- */
    const TOOLS = [
      { id: "pants", el: ctx.hit.doll },
      { id: "toilet", el: ctx.hit.toilet },
      { id: "paper", el: ctx.hit.paper },
      { id: "flush", el: ctx.hit.flush },
      { id: "wash", el: ctx.hit.sink },
    ];
    const pantsTo = (to) => {
      const from = ctx.pantsDown;
      A.sfx("slide");
      return tween(450, (k) => (ctx.pantsDown = from + (to - from) * k));
    };
    const steps = [
      {
        tool: "pants",
        say: "먼저 바지를 내려요!",
        act: async () => {
          ctx.stage = "pants";
          await pantsTo(1);
          C.pop(ctx, ctx.scene, dollCx(), act.box().b - act.box().h * 0.3, "쓱");
          await ctx.wait(350);
        },
      },
      {
        tool: "toilet",
        say: "변기에 앉아요!",
        act: async () => {
          ctx.stage = "sit";
          // 뚜껑이 열림
          A.tone(700, { to: 900, dur: 0.08, vol: 0.12, type: "triangle" });
          await tween(380, (k) => (ctx.lidOpen = k));
          if (!live()) return;
          await ctx.wait(150);
          A.sfx("boing");
          const hs = hFor(true);
          await hop(G(P.sitAt), seatLift(hs), 650, () => {
            ctx.sit = true;
          }, hs);
          if (!live()) return;
          act.a.yaw = 0;
          await ctx.wait(300);
        },
      },
      {
        auto: true,
        act: () =>
          new Promise((res) => {
            let n = 0;
            ctx.stage = "push";
            ctx.say("끙끙 힘을 줘요! 친구를 콕콕 눌러요!");
            ctx.hit.doll.classList.add("glow");
            ctx.hint(() => ctx.hit.doll, "친구를 콕콕 눌러요!");
            ctx.onKid = () => {
              if (n >= 3 || !live()) return;
              n++;
              act.react("belly", 0.05);
              act.mood(n < 3 ? "pain" : "happy");
              A.tone(220 - n * 20, { to: 180 - n * 20, dur: 0.18, vol: 0.18 });
              C.pop(ctx, ctx.scene, dollCx() + U.randf(-20, 20), dollTop(), "끙!");
              if (n < 3) return;
              ctx.onKid = null;
              ctx.hit.doll.classList.remove("glow");
              ctx.hint(null);
              ctx.after(600, () => {
                A.sfx("drop");
                const lp = st.uvToPx(P.lid[0], P.lid[1]);
                C.pop(ctx, ctx.scene, lp.x + act.box().w * 0.6, lp.y, "퐁당!", true);
                ctx.after(700, () => {
                  KP.voice.say("시원하다!");
                  act.happy();
                  const b = act.box();
                  S.burst(b.cx, b.t + b.h * 0.3, 18, "star", 0.8);
                  A.sfx("sparkle");
                  ctx.after(900, () => {
                    act.mood("normal");
                    ctx.stage = "pushed";
                    res();
                  });
                });
              });
            };
          }),
      },
      {
        tool: "paper",
        say: "휴지로 쓱쓱 닦아요!",
        act: async () => {
          ctx.stage = "paper";
          // 휴지가 쭉 → 친구에게 날아가 쓱쓱
          ctx.strip.classList.remove("fly");
          ctx.strip.classList.add("on");
          A.noise({ dur: 0.35, vol: 0.08, bp: 2400, q: 1 });
          await ctx.wait(500);
          if (!live()) return;
          const sr = ctx.strip.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect(), b = act.box();
          ctx.strip.classList.add("fly");
          ctx.strip.style.transform = `translate(${b.cx - (sr.left - hr.left + sr.width / 2)}px,${b.t + b.h * 0.65 - (sr.top - hr.top)}px) scale(.6)`;
          for (let i = 0; i < 3; i++) ctx.after(300 + i * 220, () => A.sfx("rub"));
          C.pop(ctx, ctx.scene, dollCx(), dollTop(), "쓱쓱");
          await ctx.wait(900);
          ctx.strip.classList.remove("on", "fly");
          ctx.strip.style.transform = "";
        },
      },
      {
        tool: "pants",
        say: "일어나서 바지를 올려요!",
        act: async () => {
          ctx.stage = "stand";
          A.sfx("boing");
          await hop(G(P.front), 0, 600, () => {
            ctx.sit = false;
          }, hFor(false));
          if (!live()) return;
          await pantsTo(0);
          C.pop(ctx, ctx.scene, dollCx(), act.box().b - act.box().h * 0.45, "쑥");
          await ctx.wait(350);
        },
      },
      {
        tool: "flush",
        say: "물을 내려요!",
        act: async () => {
          ctx.stage = "flush";
          ctx.lever.classList.add("down");
          A.tone(500, { to: 300, dur: 0.1, vol: 0.12, type: "triangle" });
          ctx.after(260, () => ctx.lever.classList.remove("down"));
          A.noise({ dur: 1.4, vol: 0.16, bp: 700, bpTo: 250, q: 0.8, attack: 0.1 });
          const lp = st.uvToPx(P.lid[0], P.lid[1]);
          C.pop(ctx, ctx.scene, lp.x, Math.max(50, lp.y - st.bc.view.fh * 0.2), "쏴아~");
          await tween(1500, (k) => (ctx.swirl = Math.sin(Math.PI * Math.min(1, k * 1.15))));
          ctx.swirl = 0;
          if (!live()) return;
          // 뚜껑 닫기
          await tween(300, (k) => (ctx.lidOpen = 1 - k));
          A.tone(900, { to: 700, dur: 0.08, vol: 0.1, type: "triangle" });
          if (!live()) return;
          // 가운데로 나옴 (세로 화면은 카메라도 따라가 세면대가 보이게)
          pan(0.72);
          await walk(P.mid);
          if (live()) act.a.yaw = 0;
        },
      },
      {
        tool: "wash",
        say: "마지막으로 손을 뽀득뽀득 씻어요!",
        act: async () => {
          ctx.stage = "towash";
          pan(0.83);
          await walk(P.sink);
          if (!live()) return;
          act.a.yaw = 0;
          await this.washMini(ctx, live);
          if (!live()) return;
          act.happy();
          const b = act.box();
          S.burst(b.cx, b.t + b.h * 0.35, 26, "star", 1);
          KP.pfx.hearts(ctx.scene, b.cx, b.t + b.h * 0.1, 4, ctx);
          A.sfx("sparkle");
          await ctx.wait(600);
        },
      },
    ];
    const ok = await C.routine(ctx, { bar: ctx._bar || (ctx._bar = U.el("div", "kc-bar")), tools: TOOLS, steps, mode: lv, ask: lv === 2 ? "화장실에 왔어요! 먼저 뭘 할까요?" : lv === 3 ? "혼자서 해 볼까요?" : null });
    if (!ok || !live()) return;
    ctx.stage = "done";
    ctx.say("다 했어요! 🧻", false); // 마지막 안내("거품을 싹싹…")가 축하 동안 말풍선에 남지 않게 (글자만)
    ctx.score.add();
    ctx.round++;
    const big = ctx.round % 4 === 0;
    const msg = big ? "화장실 가고 싶으면 말해 줘요!" : U.pick(["응가 끙끙, 시원하다!", "{부름} 화장실 박사!", "혼자서도 잘해요!"]);
    // 말은 자연 음성이 있는 문장으로 (화면 글자는 그대로)
    const say = { "응가 끙끙, 시원하다!": "시원하다!", "{부름} 화장실 박사!": "{부름} 참 잘했어요!", "혼자서도 잘해요!": "참 잘했어요!" }[msg] || msg;
    const r = await ctx.win({ big, msg, say });
    if (r && live()) this.next(ctx);
  },

  /** 세면대 가까이 보기: 수도꼭지 누르기 → 거품 손 문지르기 → 헹굼 (손 씻기 놀이의 세면대·손 그림을 짧게) */
  async washMini(ctx, live) {
    const U = KP.u, A = KP.audio, C = KP.care, W2 = ctx.W2, ov = ctx.wash;
    // 손 모양 (한 번만)
    if (!ctx.palm) {
      const im = await new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = ctx.HW + "palms.png";
      });
      if (!live()) return;
      if (im) ctx.palm = { a: im.naturalWidth / im.naturalHeight, shape: C.shapeOf(im, 300, Math.round((300 * im.naturalHeight) / im.naturalWidth)) };
    }
    if (ctx.wst) ctx.wst.dispose();
    const wst = (ctx.wst = KP.clayStage.create(ov, ctx.HWBG, { flat: true }));
    const layout = () => {
      if (!wst.bc) return;
      const W = wst.w, H = wst.h, v = wst.bc.view, Pp = (u, vv) => wst.uvToPx(u, vv);
      const put = (e, x, y, w, h) => Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      ctx.TAPBOX.forEach((b, i) => {
        const p = Pp(b[0], b[1]);
        put(ctx.wTaps[i], p.x, p.y, b[2] * v.fw, b[3] * v.fh);
      });
      const a = Pp(0.352, 0.3), b = Pp(0.635, 0.56);
      put(ctx.wFaucet, Math.max(2, a.x), a.y, Math.min(W - 2, b.x) - Math.max(2, a.x), b.y - a.y);
      const spout = Pp(0.521, 0.494), pa = ctx.palm ? ctx.palm.a : 1.6;
      const maxW = W / H < 0.8 ? W * 0.7 : W * 0.86;
      let top = spout.y + H * (H < 450 ? 0.04 : 0.1), h = H * 1.04 - top, w = h * pa;
      if (w > maxW) {
        w = maxW;
        h = w / pa;
        top = H * 1.04 - h;
      }
      const x = U.clamp(spout.x - w / 2, W * 0.04, W * 0.96 - w);
      ctx.wF = { x, y: top, w, h };
      put(ctx.wHands, x, top, w, h);
      const sw = Math.max(14, v.fw * 0.032);
      put(ctx.wStream, spout.x - sw / 2, spout.y - 3, sw, Math.max(24, top + h * 0.34 - spout.y));
    };
    wst.onResize = layout;
    layout();
    W2.reset();
    W2.dropSkin();
    if (ctx.palm) W2.setSkin(ctx.palm.shape);
    ov.classList.remove("water", "rubbing");
    ov.classList.add("on");
    await ctx.wait(400);
    if (!live()) return;
    // 수도꼭지
    ctx.say("수도꼭지를 눌러 물을 틀어요!");
    ctx.wFaucet.classList.add("glow");
    ctx.hint(() => ctx.wFaucet, "수도꼭지를 눌러 물을 틀어요!");
    await new Promise((res) => (ctx.onFaucet = () => ((ctx.onFaucet = null), res())));
    if (!live()) return;
    ctx.hint(null);
    ctx.wFaucet.classList.remove("glow");
    ov.classList.add("water");
    A.tone(480, { to: 900, dur: 0.16, vol: 0.12, type: "triangle" });
    let wet = true;
    const drip = () => {
      if (!wet || !live()) return;
      A.sfx("water");
      ctx.after(330, drip);
    };
    drip();
    for (let i = 0; i < 3; i++) {
      await ctx.wait(250);
      if (!live()) return;
      W2.skinFill("wet", 0.35);
    }
    // 거품 → 문지르기
    A.sfx("bubble");
    for (const [u, v] of [[0.27, 0.6], [0.73, 0.6]]) for (let k = 0; k < 4; k++) W2.skinDab("foam", u + U.randf(-0.05, 0.05), v + U.randf(-0.06, 0.06), 0.08);
    const F = () => ctx.wF;
    const pts = ctx.palm ? C.ptsIn(ctx.palm.shape, 8, 0.03) : [{ x: 0.3, y: 0.6 }, { x: 0.7, y: 0.6 }];
    ctx.ptWashPts = () => pts.map((p) => {
      const r = ov.getBoundingClientRect();
      return { x: r.left + F().x + p.x * F().w, y: r.top + F().y + p.y * F().h };
    });
    await new Promise((res) => {
      W2.reset(true);
      W2.add(pts.map((p) => ({ zone: "rub", x: p.x, y: p.y, need: 1.3 })));
      W2.mode = { foam: true };
      W2.need = 0.75;
      W2.sound = () => A.sfx("rub");
      ctx.say("거품을 싹싹 문질러요!");
      ctx.hint(() => {
        const r = ov.getBoundingClientRect();
        return { x: r.left + F().x + F().w / 2, y: r.top + F().y + F().h * 0.45 };
      }, "거품을 싹싹 문질러요!");
      ov.classList.add("rubbing");
      W2.on = true;
      W2.onZone = () => {
        W2.on = false;
        ov.classList.remove("rubbing");
        ctx.hint(null);
        res();
      };
    });
    if (!live()) return;
    // 헹굼 (물줄기 아래에서 자동으로)
    W2.skinFade("foam");
    const cx = F().x + F().w / 2;
    for (let i = 0; i < 6; i++) ctx.after(i * 120, () => W2.burst(cx + U.randf(-F().w * 0.25, F().w * 0.25), F().y + F().h * 0.5, 4, "drop", 0.6));
    C.pop(ctx, ov, cx, F().y + F().h * 0.1, "쏴아");
    await ctx.wait(800);
    if (!live()) return;
    wet = false;
    ov.classList.remove("water");
    A.tone(900, { to: 480, dur: 0.16, vol: 0.12, type: "triangle" });
    W2.skinFade("wet");
    W2.burst(cx, F().y + F().h * 0.4, 22, "star", 1);
    A.sfx("sparkle");
    C.pop(ctx, ov, cx, F().y + F().h * 0.1, "뽀득뽀득");
    await ctx.wait(800);
    if (!live()) return;
    ov.classList.remove("on");
    await ctx.wait(380);
    this.closeWash(ctx);
  },
});

;

/* ==== js/games/play/race.js ==== */
/* 자동차 경주 — 내 차를 고르고, 화면을 콕콕 연타하면 부릉부릉 달려요!
   - 차 5종(경주차·자동차·경찰차·소방차·버스)을 직접 그림, 바퀴가 진짜로 굴러감, 먼지 폴폴
   - 출발 신호등 → 결승 깃발. 상대 차(여우)는 대부분 아이가 이길 수 있게 (단계마다 조금씩 빨라짐)
   - 지면 "아깝다! 다시 해 볼까?" — 벌 없음, 다음 판은 상대가 조금 더 느긋해짐
   - 세로로 긴 화면(폰 세로·태블릿 세로)은 도로를 세로로 놓고 아래→위로 달림(.vert) — 가로 도로는 폰 세로에서 차 96px·달리는 길 230px 뿐이었음 */
"use strict";
KP.game({
  id: "race",
  icon: "🏎️",
  name: "자동차 경주",
  cat: "play",
  levels: 3,
  score: "🏁",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("race", `
      .rc-board{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#8fd3ff 0%,#c6ecff 26%,#7ccf6a 26%,#5fb956 100%)}
      .rc-crowd{position:absolute;left:0;right:0;top:4%;height:18%;display:flex;justify-content:space-around;align-items:flex-end;font-size:clamp(28px,4.4vw,48px);pointer-events:none}
      .rc-crowd span{animation:rc-cheer 0.6s ease-in-out infinite alternate;animation-delay:var(--dl)}
      @keyframes rc-cheer{to{transform:translateY(-8px)}}
      .rc-road{position:absolute;left:0;right:0;top:32%;height:62%;background:linear-gradient(#6b7083,#585d70);box-shadow:inset 0 6px 0 #e9edf5,inset 0 -6px 0 #e9edf5}
      .rc-mid{position:absolute;left:0;right:0;top:calc(50% - 3px);height:6px;overflow:hidden}
      /* 가운데 점선은 68px(무늬 1칸) 더 넓은 한 장(::before)에 그려 두고 옆으로 밀기만 함 (무늬를 매번 다시 칠하면 저가 태블릿이 버벅임) */
      .rc-mid::before{content:"";position:absolute;left:0;right:-68px;top:0;bottom:0;background:repeating-linear-gradient(90deg,#fff 0 34px,transparent 34px 68px)}
      .rc-road.move .rc-mid::before{animation:rc-dash .4s linear infinite}
      @keyframes rc-dash{to{transform:translateX(-68px)}}
      .rc-start{position:absolute;top:0;bottom:0;left:calc(var(--cw)*1.02 + 14px);width:8px;background:#fff;opacity:.85}
      .rc-finish{position:absolute;top:0;bottom:0;right:clamp(14px,3vw,40px);width:clamp(20px,2.6vw,30px);
        background:conic-gradient(#222 25%,#fff 0 50%,#222 0 75%,#fff 0) 0 0/clamp(10px,1.3vw,15px) clamp(10px,1.3vw,15px)}
      .rc-flag{position:absolute;right:clamp(0px,1vw,16px);top:calc(32% - clamp(56px,8vw,86px));font-size:clamp(56px,8vw,86px);line-height:1;pointer-events:none;transform-origin:20% 100%;animation:rc-flag 1s ease-in-out infinite alternate}
      @keyframes rc-flag{to{transform:rotate(-8deg)}}
      .rc-car{position:absolute;left:0;width:var(--cw);height:calc(var(--cw)*.5);z-index:2}
      .rc-car.hintGlow{position:absolute;border-radius:20px}
      .rc-car svg{width:100%;height:100%;display:block;overflow:visible}
      .rc-car .drv{position:absolute;width:var(--ds);height:var(--ds);font-size:var(--ds);line-height:1}
      .rc-car .drv .e{width:100%;height:100%;display:block}
      .rc-body{animation:rc-bob .18s ease-in-out infinite alternate;transform-origin:50% 100%}
      .rc-car.idle .rc-body{animation-duration:.5s}
      @keyframes rc-bob{to{transform:translateY(-2px)}}
      .rc-blink{animation:rc-blink .5s steps(1) infinite}
      @keyframes rc-blink{50%{opacity:.2}}
      .rc-dust{position:absolute;width:var(--p);height:var(--p);border-radius:50%;background:rgba(235,225,205,.9);pointer-events:none;z-index:1;animation:rc-dust .7s ease-out forwards}
      @keyframes rc-dust{from{transform:scale(.4)}to{transform:translate(-60px,-18px) scale(1.5);opacity:0}}
      .rc-line{position:absolute;height:4px;border-radius:2px;background:rgba(255,255,255,.8);pointer-events:none;animation:rc-line .35s linear forwards}
      @keyframes rc-line{to{transform:translateX(-70px);opacity:0}}
      .rc-light{position:absolute;left:50%;top:6%;transform:translateX(-50%);display:flex;gap:10px;background:#2d3142;padding:10px 14px;border-radius:22px;z-index:5;box-shadow:0 6px 0 rgba(0,0,0,.2);pointer-events:none;transition:opacity .4s}
      .rc-light i{width:clamp(34px,5vw,54px);height:clamp(34px,5vw,54px);border-radius:50%;background:#555a6b}
      .rc-light i.r{background:#ff4b4b;box-shadow:0 0 18px #ff4b4b}.rc-light i.g{background:#3ddc6a;box-shadow:0 0 22px #3ddc6a}
      .rc-light.hide{opacity:0}
      .rc-big{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:clamp(60px,11vw,120px);color:#fff;-webkit-text-stroke:5px #ff7452;paint-order:stroke;text-shadow:0 6px 0 #c94a2c;z-index:6;pointer-events:none;white-space:nowrap;opacity:0}
      .rc-big.show{animation:rc-big 1.1s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes rc-big{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
      .rc-tap{position:absolute;right:12px;bottom:12px;z-index:4;font-size:clamp(20px,3vw,28px);color:#fff;background:var(--coral);border-radius:999px;padding:10px 18px;box-shadow:0 6px 0 #c94a2c;pointer-events:none;animation:rc-tap .5s ease-in-out infinite alternate}
      @keyframes rc-tap{to{transform:scale(1.08)}}
      .rc-pick{position:absolute;inset:0;z-index:8;background:rgba(255,255,255,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2vh,22px);padding:12px}
      .rc-pick h2{font-weight:400;font-size:clamp(26px,4vw,40px);color:var(--ink)}
      .rc-opts{display:flex;flex-wrap:wrap;gap:clamp(10px,1.8vw,20px);justify-content:center;max-width:1000px}
      .rc-opt{width:clamp(140px,17vw,190px);padding:10px 10px 8px;background:#fff;border-radius:24px;box-shadow:0 7px 0 rgba(47,58,102,.14);display:flex;flex-direction:column;align-items:center;gap:4px;
        font-size:clamp(17px,2.2vw,22px);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*70ms)}
      .rc-opt .rc-car{position:relative;--cw:clamp(118px,calc(17vw - 22px),168px)}
      .rc-opt:active{transform:translateY(5px)}
      @media (orientation: portrait) and (max-width: 480px){
        .rc-pick{justify-content:flex-start;overflow-y:auto;padding:20px 8px 16px;gap:12px}
        .rc-pick h2{font-size:26px;flex:0 0 auto;text-align:center}
        .rc-opts{gap:10px}
        .rc-opt{width:calc(50% - 6px);padding:8px 6px 8px;font-size:16px}
        .rc-opt .rc-car{--cw:104px}
      }
      @media (orientation: landscape) and (max-height: 500px){
        .rc-pick h2{font-size:28px}
      }
      .rc-opt.sel{background:#fff5c9;box-shadow:0 0 0 5px #ffc531,0 7px 0 rgba(47,58,102,.14)}
      /* 세로 도로 (아래 → 위) */
      .rc-board.vert{background:linear-gradient(180deg,#8fd3ff 0%,#c6ecff 17%,#7ccf6a 17%,#5fb956 100%)}
      .rc-board.vert .rc-crowd{top:1%;height:14%;right:24%;font-size:clamp(24px,7vw,44px)}
      .rc-board.vert .rc-road{left:12%;right:12%;top:17%;bottom:0;height:auto;box-shadow:inset 6px 0 0 #e9edf5,inset -6px 0 0 #e9edf5}
      .rc-board.vert .rc-mid{left:calc(50% - 3px);right:auto;top:0;bottom:0;width:6px;height:auto}
      .rc-board.vert .rc-mid::before{left:0;right:0;top:-68px;bottom:0;background:repeating-linear-gradient(180deg,#fff 0 34px,transparent 34px 68px)}
      .rc-board.vert .rc-road.move .rc-mid::before{animation-name:rc-dashV}
      @keyframes rc-dashV{to{transform:translateY(68px)}}
      .rc-board.vert .rc-start{left:0;right:0;top:auto;bottom:calc(var(--cw) + 22px);width:auto;height:8px}
      .rc-board.vert .rc-finish{left:0;right:0;top:12px;bottom:auto;width:auto;height:clamp(20px,3vh,30px);background-size:clamp(10px,1.5vh,15px) clamp(10px,1.5vh,15px)}
      .rc-board.vert .rc-flag{right:2%;top:2%;font-size:clamp(48px,12vw,80px)}
      .rc-board.vert>.rc-car{rotate:-90deg}
      .rc-dust.v{animation-name:rc-dustV}
      @keyframes rc-dustV{from{transform:scale(.4)}to{transform:translate(var(--vx,0px),60px) scale(1.5);opacity:0}}
    `);
    // 차 그리기 (오른쪽을 보는 옆모습, viewBox 200x100)
    const wheel = (x, r) =>
      '<g class="rc-wh" style="transform-origin:' + x + "px " + (96 - r) + 'px"><circle cx="' + x + '" cy="' + (96 - r) + '" r="' + r + '" fill="#2b2f3a"/>' +
      '<circle cx="' + x + '" cy="' + (96 - r) + '" r="' + r * 0.5 + '" fill="#d8dde9"/>' +
      '<path d="M' + x + " " + (96 - r * 1.45) + " V" + (96 - r * 0.55) + " M" + (x - r * 0.45) + " " + (96 - r) + " H" + (x + r * 0.45) + '" stroke="#8a93a8" stroke-width="3" stroke-linecap="round"/></g>';
    ctx.CARS = [
      {
        key: "race", name: "경주용 자동차", drv: [52, 14, 26],
        svg: '<path d="M4 44 h28 v8 h-9 l-4 14 h-6 l2-14 h-11z" fill="#333"/>' +
          '<path d="M6 76 Q6 62 22 60 L68 56 Q84 40 104 38 L128 38 Q142 40 148 54 L184 60 Q197 62 197 76 Z" fill="#ff3b3b"/>' +
          '<path d="M90 54 Q98 42 112 42 L126 42 Q136 44 138 54 Z" fill="#bfe6ff"/><rect x="18" y="64" width="172" height="5" rx="2" fill="#fff" opacity=".85"/>' +
          '<circle cx="66" cy="66" r="9" fill="#fff"/><text x="66" y="70.5" font-size="12" text-anchor="middle" fill="#ff3b3b" font-family="sans-serif" font-weight="bold">1</text>' +
          '<circle cx="192" cy="66" r="3.5" fill="#ffe36a"/>' + wheel(46, 19) + wheel(158, 19),
      },
      {
        key: "car", name: "파란 자동차", drv: [60, 18, 24],
        svg: '<path d="M8 78 Q8 58 26 56 L52 54 L72 30 Q78 24 88 24 L132 24 Q142 24 150 32 L168 54 L184 56 Q196 58 196 78 Z" fill="#2f8cff"/>' +
          '<path d="M78 52 L91 32 L111 32 L111 52 Z" fill="#bfe6ff"/><path d="M117 52 L117 32 L136 32 Q142 32 146 38 L157 52 Z" fill="#bfe6ff"/>' +
          '<rect x="10" y="60" width="8" height="6" rx="2" fill="#ff5b5b"/><circle cx="190" cy="63" r="4" fill="#ffe36a"/>' + wheel(50, 18) + wheel(154, 18),
      },
      {
        key: "police", name: "경찰차", drv: [60, 18, 24],
        svg: '<rect x="96" y="14" width="12" height="9" rx="3" fill="#ff3b3b" class="rc-blink"/><rect x="108" y="14" width="12" height="9" rx="3" fill="#2f8cff" class="rc-blink" style="animation-delay:-.25s"/>' +
          '<path d="M8 78 Q8 58 26 56 L52 54 L72 30 Q78 24 88 24 L132 24 Q142 24 150 32 L168 54 L184 56 Q196 58 196 78 Z" fill="#fff" stroke="#d6dbe8" stroke-width="2"/>' +
          '<path d="M8 66 L196 66 L196 78 L8 78 Z" fill="#2d3142"/>' +
          '<path d="M78 52 L91 32 L111 32 L111 52 Z" fill="#bfe6ff"/><path d="M117 52 L117 32 L136 32 Q142 32 146 38 L157 52 Z" fill="#bfe6ff"/>' +
          '<path d="M100 56 l3 6 6 1 -4.5 4 1 6 -5.5-3 -5.5 3 1-6 -4.5-4 6-1z" fill="#ffc531"/><circle cx="190" cy="62" r="4" fill="#ffe36a"/>' + wheel(50, 18) + wheel(154, 18),
      },
      {
        key: "fire", name: "소방차", drv: [81, 26, 18],
        svg: '<rect x="12" y="18" width="134" height="6" rx="2" fill="#c7ccd8"/>' +
          Array.from({ length: 9 }, (_, i) => '<rect x="' + (18 + i * 14) + '" y="16" width="3" height="10" fill="#c7ccd8"/>').join("") +
          '<rect x="6" y="28" width="150" height="50" rx="6" fill="#e83a3a"/><path d="M156 78 V40 Q156 30 166 30 L182 30 L197 54 V78 Z" fill="#e83a3a"/>' +
          '<path d="M164 36 L180 36 L191 54 L164 54 Z" fill="#bfe6ff"/><rect x="6" y="58" width="191" height="6" fill="#fff"/>' +
          '<rect x="20" y="36" width="34" height="16" rx="3" fill="#b82424"/><rect x="62" y="36" width="34" height="16" rx="3" fill="#b82424"/><rect x="104" y="36" width="34" height="16" rx="3" fill="#b82424"/>' +
          '<rect x="168" y="22" width="12" height="8" rx="3" fill="#2f8cff" class="rc-blink"/><circle cx="193" cy="66" r="3.5" fill="#ffe36a"/>' + wheel(40, 17) + wheel(160, 17),
      },
      {
        key: "bus", name: "노란 버스", drv: [83, 26, 17],
        svg: '<rect x="6" y="22" width="188" height="56" rx="14" fill="#ffc531"/>' +
          [14, 46, 78, 110, 142].map((x) => '<rect x="' + x + '" y="30" width="26" height="20" rx="4" fill="#bfe6ff"/>').join("") +
          '<path d="M172 30 H184 Q192 30 193 40 V50 H172 Z" fill="#bfe6ff"/><rect x="6" y="56" width="188" height="5" fill="#e08a00"/>' +
          '<circle cx="190" cy="66" r="4" fill="#fff4b0"/>' + wheel(44, 17) + wheel(156, 17),
      },
    ];
    ctx.carHTML = (c, driver) =>
      '<div class="rc-body"><svg viewBox="0 0 200 100">' + c.svg + '</svg><div class="drv" style="left:' + c.drv[0] + "%;top:" + c.drv[1] + "%;--ds:calc(var(--cw)*" + c.drv[2] / 100 + ')">' + KP.E(driver) + "</div></div>";

    const board = U.el("div", "rc-board");
    board.dataset.tap = "1";
    board.innerHTML =
      '<div class="rc-crowd">' + ["🐰", "🐼", "🐶", "🐱", "🐵", "🐸", "🐯"].map((e, i) => '<span style="--dl:-' + i * 0.17 + 's">' + KP.E(e) + "</span>").join("") + "</div>" +
      '<div class="rc-road"><div class="rc-mid"></div><div class="rc-start"></div><div class="rc-finish"></div></div>' +
      '<div class="rc-flag">' + KP.E("🏁") + "</div>" +
      '<div class="rc-light hide"><i></i><i></i><i></i></div><div class="rc-big"></div><div class="rc-tap">' + KP.E("👆") + " 콕콕!</div>";
    const me = U.el("div", "rc-car");
    const opp = U.el("div", "rc-car");
    board.append(opp, me);
    const pick = U.el("div", "rc-pick", "<h2>어떤 차를 탈까요?</h2>");
    const opts = U.el("div", "rc-opts");
    pick.appendChild(opts);
    board.appendChild(pick);
    ctx.body.appendChild(board);
    Object.assign(ctx, { board, me, opp, pick, opts, road: U.$(".rc-road", board), light: U.$(".rc-light", board), bigEl: U.$(".rc-big", board), tapEl: U.$(".rc-tap", board) });

    ctx.ctl = { state: "pick" };
    ctx.losses = 0;
    ctx.round = 0;

    ctx.size = () => {
      const W = board.clientWidth,
        H = board.clientHeight;
      const vert = (ctx.vert = H > W * 1.15);
      board.classList.toggle("vert", vert);
      if (vert) {
        // 세로: 차를 -90° 돌려 위를 보게. 차 길이(cw)는 화면 높이의 22%, 폭(cw/2)은 차선(도로 76% 의 반) 안
        const cw = Math.round(U.clamp(Math.min(W * 0.46, H * 0.22), 96, 220));
        board.style.setProperty("--cw", cw + "px");
        ctx.cw = cw;
        // 차선 가운데(x)와 출발·결승(차 가운데 y)
        ctx.laneX = [W * 0.31, W * 0.69]; // [상대, 나]
        ctx.startY = H - cw * 0.5 - 10;
        ctx.finishY = H * 0.17 + 12 + cw * 0.5;
        opp.style.left = ctx.laneX[0] - cw / 2 + "px";
        me.style.left = ctx.laneX[1] - cw / 2 + "px";
        ctx.put && ctx.put();
        return;
      }
      const cw = Math.round(U.clamp(Math.min(W * 0.26, H * 0.5), 96, 230));
      board.style.setProperty("--cw", cw + "px");
      ctx.cw = cw;
      const roadTop = H * 0.32,
        roadH = H * 0.62;
      opp.style.top = roadTop + roadH * 0.25 - cw * 0.42 + "px";
      me.style.top = roadTop + roadH * 0.75 - cw * 0.42 + "px";
      ctx.startX = 8;
      ctx.finishX = W - U.clamp(W * 0.03, 14, 40) - cw * 0.92;
      ctx.put && ctx.put();
    };
    /** 진행(0~1) → 차 자리 (가로: 왼쪽→오른쪽 / 세로: 아래→위) */
    ctx.put = () => {
      const c = ctx.ctl || {};
      const p = c.p || 0,
        o = c.o || 0;
      if (ctx.vert) {
        const y = (q) => ctx.startY + q * (ctx.finishY - ctx.startY) - ctx.cw * 0.25; // 돌린 차의 상자 top (상자 높이 cw/2)
        me.style.top = y(p) + "px";
        opp.style.top = y(o) + "px";
      } else {
        const span = ctx.finishX - ctx.startX;
        me.style.left = ctx.startX + p * span + "px";
        opp.style.left = ctx.startX + o * span + "px";
      }
    };
    addEventListener("resize", () => ctx._active && ctx.size());

    ctx.bigText = (t) => {
      ctx.bigEl.textContent = t;
      U.replay(ctx.bigEl, "show");
    };
    const dust = (car, x) => {
      if (ctx.vert) {
        // 세로: 차 꽁무니(아래)에서 먼지가 아래로
        const cx = parseFloat(car.style.left) + ctx.cw / 2,
          by = parseFloat(car.style.top) + ctx.cw * 0.25 + ctx.cw * 0.48;
        for (let i = 0; i < 3; i++) {
          const d = U.el("div", "rc-dust v");
          d.style.cssText = "left:" + (cx + U.randf(-ctx.cw * 0.18, ctx.cw * 0.1)) + "px;top:" + (by + U.randf(-6, 6)) + "px;--p:" + U.randf(14, 28) + "px;--vx:" + U.randf(-20, 20) + "px";
          board.appendChild(d);
          ctx.after(720, () => d.remove());
        }
        return;
      }
      const top = parseFloat(car.style.top) + ctx.cw * 0.4;
      for (let i = 0; i < 3; i++) {
        const d = U.el("div", "rc-dust");
        d.style.cssText = "left:" + (x + U.randf(-4, 8)) + "px;top:" + (top + U.randf(-6, 6)) + "px;--p:" + U.randf(14, 28) + "px";
        board.appendChild(d);
        ctx.after(720, () => d.remove());
      }
    };
    const vroom = (pitch) => {
      A.tone(90 + pitch * 60, { to: 160 + pitch * 90, dur: 0.16, vol: 0.12, type: "triangle" });
      A.noise({ dur: 0.08, vol: 0.05, lp: 500 });
    };

    // 판 아무 데나 콕 → 내 차 달리기
    ctx.fast(board, () => {
      const c = ctx.ctl;
      if (c.state === "race") {
        c.pT = Math.min(1, c.pT + 1 / c.taps);
        c.tapN++;
        c.lastTap = c.t;
        dust(me, ctx.startX + c.p * (ctx.finishX - ctx.startX) - 6);
        vroom(c.p);
        if (c.tapN === 3) ctx.tapEl.style.display = "none";
      } else if (c.state === "ready") {
        A.note("E5", { inst: "soft", dur: 0.12, vol: 0.12 });
        A.note("E5", { inst: "soft", dur: 0.12, vol: 0.12, when: 0.16 });
      }
    });

    ctx.frame = (dt) => {
      const c = ctx.ctl;
      if (c.state !== "race" && c.state !== "end") return;
      if (c.state === "race") {
        // 내 차: 목표 위치로 부드럽게 (최고 속도 제한)
        const d = c.pT - c.p;
        // 최고 속도: 아무리 빨리 연타해도 결승까지 4~5초는 달리게 (예전 0.45 → 2.2초 만에 끝)
        c.p += Math.min(d, Math.max(0.1 * dt, d * 4 * dt), c.vmax * dt);
        // 상대 차: 기본 속도 + 아이가 뒤처지면 살짝 느려짐
        const gap = c.o - c.p;
        // 열심히 누르는 중이면 상대가 살짝 봐줌 (안 누르면 그냥 달림)
        const trying = c.t - (c.lastTap || -9) < 1.5;
        let v = c.ov * (trying ? (gap > 0.12 ? 0.55 : gap > 0.04 ? 0.8 : 1) : 1);
        // 내 차가 한참 앞서면 상대도 조금 힘을 내서 '비슷하게' 달림 (그래도 계속 누르면 내가 이김: 최고 속도가 더 빠름)
        if (gap < -0.08) v *= gap < -0.2 ? 1.6 : 1.3;
        if (c.t < 1) v *= c.t; // 천천히 출발
        c.o = Math.min(1, c.o + v * dt);
        c.t += dt;
        if (c.p >= 1 || c.o >= 1) {
          c.state = "end";
          ctx.finish(c.p >= 1);
        }
      }
      const span = ctx.vert ? Math.abs(ctx.startY - ctx.finishY) : ctx.finishX - ctx.startX;
      ctx.put();
      // 바퀴 굴리기
      c.wm = (c.wm || 0) + (c.p - (c.lp || 0)) * span * 3.2;
      c.wo = (c.wo || 0) + (c.o - (c.lo || 0)) * span * 3.2;
      c.lp = c.p;
      c.lo = c.o;
      me.querySelectorAll(".rc-wh").forEach((w) => (w.style.transform = "rotate(" + c.wm + "deg)"));
      opp.querySelectorAll(".rc-wh").forEach((w) => (w.style.transform = "rotate(" + c.wo + "deg)"));
      ctx.road.classList.toggle("move", c.state === "race");
    };

    ctx.finish = async (won) => {
      ctx.hint(null);
      ctx.tapEl.style.display = "none";
      if (won) {
        ctx.losses = 0;
        ctx.bigText("1등!");
        A.sfx("levelup");
        KP.voice.say("우승! 1등이에요!");
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1200);
        const big = ctx.round % 4 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 레이싱 챔피언!" : "결승선 통과!" });
        if (ok) this.showPick(ctx);
      } else {
        ctx.losses++;
        ctx.bigText("아깝다!");
        // 진 판 = 가벼운 틀림(흔들기 없이 부드러운 소리) → 이번 판 열쇠 별 없음, 계속 지면 틀 규칙(5번)대로 단계가 내려감.
        // 다음 경주는 상대가 느긋해짐(아래 T 의 losses)이라 지는 판이 길게 이어지지 않음
        ctx.miss(null, "아깝다! 다시 해 볼까? 콕콕 더 빨리 눌러 봐요!");
        await ctx.wait(2600);
        if (ctx._active) this.race(ctx, ctx.myCar, true);
      }
    };
  },
  start(ctx) {
    ctx.round = 0;
    ctx.losses = 0;
    requestAnimationFrame(() => {
      ctx.size();
      ctx.loop((dt) => ctx.frame(dt));
    });
    this.showPick(ctx);
  },
  showPick(ctx) {
    const U = KP.u;
    ctx.ctl = { state: "pick", p: 0, o: 0 };
    ctx.pick.style.display = "";
    ctx.opts.innerHTML = "";
    ctx.light.classList.add("hide");
    ctx.tapEl.style.display = "none";
    ctx.say("어떤 차를 탈까요? 골라 봐요! 🏎️");
    const btns = ctx.CARS.map((c, i) => {
      const b = U.el("button", "rc-opt", '<div class="rc-car idle">' + ctx.carHTML(c, "👦") + "</div><span>" + c.name + "</span>");
      b.style.setProperty("--i", i);
      ctx.tap(b, () => {
        if (ctx.ctl.state !== "pick") return;
        ctx.ctl.state = "chosen";
        b.classList.add("sel");
        U.replay(b, "jump");
        KP.audio.sfx("select");
        KP.voice.say(c.name + " 출발 준비!");
        ctx.after(900, () => this.race(ctx, c));
      });
      ctx.opts.appendChild(b);
      return b;
    });
    ctx.hint(() => btns[0], "타고 싶은 차를 콕 눌러요!");
  },
  async race(ctx, car, again) {
    const U = KP.u,
      A = KP.audio;
    ctx.myCar = car;
    ctx.pick.style.display = "none";
    const others = ctx.CARS.filter((c) => c !== car);
    const oc = U.pick(others);
    ctx.me.innerHTML = ctx.carHTML(car, "👦");
    ctx.opp.innerHTML = ctx.carHTML(oc, "🦊");
    ctx.size();
    const lv = ctx.level;
    // 상대 차가 끝까지 가는 시간(초): 질수록 느긋해짐
    // 3~4세 연타(초당 3~4번) 기준 (흉내 계산, 0.35 흔들림): 1단계는 초당 2.5번도 여유 있게 이김,
    // 2단계는 초당 2.5번이면 아슬아슬하게 이김, 3단계는 초당 3번 이상 '집중해서' 누르면 이김(초당 2.5번은 짐)
    // (2차 보완의 [12,10.5,9]초·[26,32,38]번은 초당 4번으로도 3단계를 거의 못 이겼음)
    const T = [13, 11.5, 10.5][lv - 1] + Math.min(ctx.losses, 3) * 2.5;
    ctx.ctl = { state: "ready", p: 0, pT: 0, o: 0, ov: 1 / T, t: 0, taps: [22, 26, 30][lv - 1], vmax: [0.2, 0.22, 0.24][lv - 1], tapN: 0 };
    ctx.put(); // 출발선에 세우기 (예전엔 출발 신호 동안 지난 경주 자리에 서 있었음)
    ctx.say("화면을 콕콕콕 빨리 누르면 내 차가 달려요!");
    // 출발 신호 (진 뒤 다시 달릴 때는 기다림을 줄이고 바로 셋·둘·하나)
    const L = ctx.light,
      lamps = L.querySelectorAll("i");
    L.classList.remove("hide");
    lamps.forEach((l) => (l.className = ""));
    await ctx.wait(again ? 600 : 1700);
    if (!ctx._active) return;
    const SAY = ["셋", "둘", "하나"];
    for (let i = 0; i < 3; i++) {
      lamps[i].className = "r";
      ctx.bigText(3 - i);
      KP.voice.say(SAY[i]);
      A.note("C5", { inst: "bell", dur: 0.3, vol: 0.22 });
      await ctx.wait(850);
      if (!ctx._active) return;
    }
    lamps.forEach((l) => (l.className = "g"));
    ctx.bigText("출발!");
    KP.voice.say("출발!");
    A.note("C6", { inst: "bell", dur: 0.6, vol: 0.28 });
    ctx.ctl.state = "race";
    ctx.tapEl.style.display = "";
    ctx.hint(() => ctx.me, "화면을 콕콕콕 눌러요!");
    ctx.after(1500, () => L.classList.add("hide"));
  },
});

;

/* ==== js/games/play/rocket.js ==== */
/* 로켓 발사 — 숫자를 차례대로 눌러 로켓에 힘을 모으고, 발사! 우주를 지나 달에 착륙!
   1단계: 1→5 세기 / 2단계: 1→10 세기 / 3단계: 10→1 카운트다운
   - 누를 때마다 큰 숫자 + 목소리, 로켓이 점점 더 덜덜 떨고 연기가 뭉게뭉게
   - 발사: 연기 기둥 → 별·행성 지나기 → 달 착륙 → 곰돌이 우주인이 손 흔들기 */
"use strict";
KP.game({
  id: "rocket",
  icon: "🚀",
  name: "로켓 발사",
  cat: "play",
  levels: 3,
  score: "🚀",
  setup(ctx) {
    const U = KP.u;
    KP.css("rocket", `
      .rk-scene{flex:1;min-height:0;position:relative;margin:0 12px 8px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#3b4aa8 0%,#7a6fd1 45%,#f4a6c0 80%,#ffd3a1 100%)}
      .rk-night{position:absolute;inset:0;background:linear-gradient(180deg,#05071d,#121a4a);opacity:0;transition:opacity 1.6s;pointer-events:none}
      .rk-scene.fly .rk-night,.rk-scene.land .rk-night{opacity:1}
      .rk-stars{position:absolute;left:0;right:0;top:-100%;height:200%;pointer-events:none;opacity:.55;
        background-image:radial-gradient(circle at 20% 30%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 70% 60%,#fff 0 1px,transparent 2px),radial-gradient(circle at 45% 85%,#fffbd0 0 2px,transparent 3px),radial-gradient(circle at 85% 15%,#fff 0 1px,transparent 2px);
        background-size:140px 140px,90px 110px,200px 170px,120px 90px}
      .rk-scene.fly .rk-stars{opacity:1;animation:rk-stream .5s linear infinite}
      .rk-scene.land .rk-stars{opacity:1}
      @keyframes rk-stream{to{transform:translateY(50%)}}
      .rk-ground{position:absolute;left:0;right:0;bottom:0;height:24%;transition:transform 1.6s ease-in;pointer-events:none}
      .rk-scene.fly .rk-ground,.rk-scene.land .rk-ground{transform:translateY(400%)}
      .rk-hill{position:absolute;left:-10%;right:-10%;bottom:0;height:80%;border-radius:50% 50% 0 0;background:linear-gradient(#6fcf6a,#3f9f4a)}
      .rk-padbase{position:absolute;left:50%;bottom:28%;width:clamp(120px,18vw,200px);height:16px;margin-left:calc(clamp(120px,18vw,200px)/-2);background:#5d6684;border-radius:6px;box-shadow:0 6px 0 #3e4560}
      .rk-tower{position:absolute;left:calc(50% + clamp(50px,7vw,80px));bottom:28%;width:22px;height:min(clamp(120px,24vh,230px),var(--rs) * 1.5);
        background:repeating-linear-gradient(45deg,transparent 0 8px,#d64545 8px 11px),repeating-linear-gradient(-45deg,transparent 0 8px,#d64545 8px 11px);border-left:4px solid #b83232;border-right:4px solid #b83232}
      .rk-moon{position:absolute;left:-20%;right:-20%;bottom:0;height:30%;border-radius:50% 50% 0 0/60% 60% 0 0;transform:translateY(110%);transition:transform 1.8s cubic-bezier(.2,.8,.3,1);pointer-events:none;
        background:radial-gradient(circle at 30% 30%,#9aa0b5 0 6%,transparent 6.5%),radial-gradient(circle at 62% 50%,#9aa0b5 0 4%,transparent 4.5%),radial-gradient(circle at 80% 25%,#9aa0b5 0 3%,transparent 3.5%),radial-gradient(circle at 45% 70%,#a8aec2 0 5%,transparent 5.5%),linear-gradient(#e9ebf3,#b9bed0)}
      .rk-scene.land .rk-moon{transform:none}
      .rk-thing{position:absolute;pointer-events:none;font-size:clamp(60px,10vw,110px);line-height:1;top:-30%;opacity:0}
      .rk-scene.fly .rk-thing{animation:rk-pass 2.6s linear forwards;animation-delay:var(--dl)}
      @keyframes rk-pass{0%{top:-30%;opacity:1}100%{top:120%;opacity:1}}
      .rk-rocket{position:absolute;left:50%;bottom:calc(6.7% + 16px);width:var(--rs);height:calc(var(--rs)*1.15);margin-left:calc(var(--rs)/-2);z-index:3;transition:bottom 1.6s ease-in}
      .rk-scene.fly .rk-rocket{bottom:42%}
      .rk-scene.land .rk-rocket{bottom:calc(30% - 18px);transition:bottom 2.2s cubic-bezier(.3,.7,.4,1)}
      .rk-ship{position:absolute;inset:0;animation:rk-shake .09s linear infinite alternate}
      @keyframes rk-shake{from{transform:translate(calc(var(--a,0)*-1px),calc(var(--a,0)*.5px))}to{transform:translate(calc(var(--a,0)*1px),calc(var(--a,0)*-.5px))}}
      .rk-img{position:absolute;left:0;right:0;top:0;height:var(--rs);font-size:var(--rs);line-height:1;transform:rotate(-45deg)}
      .rk-img .e{width:100%;height:100%;display:block}
      .rk-flame{position:absolute;left:50%;top:calc(var(--rs)*.9);width:calc(var(--rs)*.28);height:calc(var(--rs)*.55);margin-left:calc(var(--rs)*-.14);border-radius:50% 50% 50% 50%/30% 30% 70% 70%;
        background:radial-gradient(ellipse at 50% 25%,#fff 0 18%,#ffe76a 35%,#ff9a2e 60%,rgba(255,80,40,0) 75%);transform-origin:50% 0;transform:scaleY(0);transition:transform .25s;filter:blur(.5px)}
      .rk-scene.go .rk-flame{transform:scaleY(1);animation:rk-flick .08s linear infinite alternate}
      .rk-scene.land .rk-flame{transform:scaleY(.45)}
      .rk-scene.landed .rk-flame{transform:scaleY(0);animation:none}
      @keyframes rk-flick{from{transform:scaleY(1) scaleX(.9)}to{transform:scaleY(1.25) scaleX(1.05)}}
      .rk-puff{position:absolute;width:var(--p);height:var(--p);margin:calc(var(--p)/-2) 0 0 calc(var(--p)/-2);border-radius:50%;pointer-events:none;z-index:2;
        background:radial-gradient(circle at 40% 35%,#fff,#e4e6ee 60%,rgba(220,222,232,.0) 72%);animation:rk-puff var(--t) ease-out forwards}
      @keyframes rk-puff{0%{transform:scale(.3);opacity:.95}100%{transform:translate(var(--dx),var(--dy)) scale(1.6);opacity:0}}
      .rk-big{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);font-size:clamp(90px,16vw,170px);line-height:1;color:#fff;-webkit-text-stroke:6px #ff7452;paint-order:stroke;
        text-shadow:0 8px 0 #c94a2c;pointer-events:none;z-index:5;opacity:0}
      .rk-big.show{animation:rk-big .9s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes rk-big{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-70%) scale(.9)}}
      .rk-astro{position:absolute;left:calc(50% + var(--rs)*.55);bottom:calc(30% - 14px);width:clamp(80px,12vw,120px);height:clamp(80px,12vw,120px);z-index:4;pointer-events:none;opacity:0;transform:scale(.2)}
      .rk-scene.hello .rk-astro{opacity:1;transform:none;transition:transform .5s cubic-bezier(.2,1.6,.4,1),opacity .2s}
      .rk-astro .bear{position:absolute;inset:12%;font-size:clamp(56px,8.5vw,86px);line-height:1}
      .rk-astro .bear .e{width:100%;height:100%;display:block}
      .rk-astro .helm{position:absolute;inset:0;border-radius:50%;border:5px solid #e7ecf8;background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.7) 0 10%,rgba(190,225,255,.18) 30%,rgba(150,200,255,.12));box-shadow:0 0 0 3px #9aa6c4}
      .rk-astro .wave{position:absolute;right:-34%;top:-8%;font-size:clamp(34px,5vw,52px);transform-origin:20% 90%;animation:rk-wave .5s ease-in-out infinite alternate}
      .rk-astro .flag{position:absolute;left:-55%;bottom:0;font-size:clamp(40px,6vw,60px)}
      @keyframes rk-wave{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}
      .rk-nums{flex:0 0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(6px,1vw,12px);padding:4px 12px 14px;max-width:1100px;margin:0 auto}
      .rk-n{width:clamp(72px,8.6vw,98px);height:clamp(72px,8.6vw,98px);border-radius:24px;background:#fff;font-size:clamp(36px,5vw,54px);color:var(--ocean);box-shadow:0 7px 0 rgba(47,58,102,.14);
        display:flex;align-items:center;justify-content:center;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*50ms)}
      .rk-n:active{transform:translateY(5px)}
      .rk-n.next{box-shadow:0 0 0 5px #ffc531,0 7px 0 rgba(47,58,102,.14)}
      .rk-n.done{background:#ffdf6e;color:#c45e00;box-shadow:0 7px 0 #e0a800}
      .rk-n.done::after{content:"";position:absolute}
      .rk-nums.off{opacity:.35;pointer-events:none;transition:opacity .4s}
    `);
    const scene = U.el("div", "rk-scene");
    scene.innerHTML =
      '<div class="rk-night"></div><div class="rk-stars"></div>' +
      '<div class="rk-thing" style="left:8%;--dl:.2s">' + KP.E("🪐") + "</div>" +
      '<div class="rk-thing" style="right:6%;--dl:1s;font-size:clamp(70px,12vw,130px)">' + KP.E("🌍") + "</div>" +
      '<div class="rk-thing" style="left:18%;--dl:1.7s;font-size:clamp(36px,5vw,56px)">' + KP.E("🛸") + "</div>" +
      '<div class="rk-thing" style="right:22%;--dl:.6s;font-size:clamp(30px,4vw,44px)">' + KP.E("🌟") + "</div>" +
      '<div class="rk-ground"><div class="rk-hill"></div><div class="rk-tower"></div><div class="rk-padbase"></div></div>' +
      '<div class="rk-moon"></div>' +
      '<div class="rk-rocket"><div class="rk-ship"><div class="rk-flame"></div><div class="rk-img">' + KP.E("🚀") + "</div></div></div>" +
      '<div class="rk-astro"><div class="bear">' + KP.E("🐻") + '</div><div class="helm"></div><div class="wave">' + KP.E("👋") + '</div><div class="flag">' + KP.E("🚩") + "</div></div>" +
      '<div class="rk-big"></div>';
    const nums = U.el("div", "rk-nums");
    ctx.body.append(scene, nums);
    ctx.scene = scene;
    ctx.nums = nums;
    ctx.rocketEl = U.$(".rk-rocket", scene);
    ctx.ship = U.$(".rk-ship", scene);
    ctx.big = U.$(".rk-big", scene);
    ctx.size = () => {
      const h = scene.clientHeight,
        w = scene.clientWidth;
      scene.style.setProperty("--rs", Math.round(U.clamp(Math.min(h * 0.3, w * 0.28), 90, 190)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
    ctx.round = 0;
    ctx.SINO = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"];

    ctx.puff = (n, spread, life) => {
      const sr = scene.getBoundingClientRect(),
        rr = ctx.rocketEl.getBoundingClientRect();
      const x = rr.left - sr.left + rr.width / 2,
        y = rr.bottom - sr.top - 4;
      for (let i = 0; i < n; i++) {
        const p = U.el("div", "rk-puff");
        const dir = Math.random() < 0.5 ? -1 : 1;
        p.style.cssText = "left:" + (x + U.randf(-10, 10)) + "px;top:" + (y + U.randf(-6, 6)) + "px;--p:" + U.randf(40, 80) + "px;--dx:" + dir * U.randf(20, spread) + "px;--dy:" + U.randf(-30, 10) + "px;--t:" + (life || U.randf(0.9, 1.6)) + "s";
        scene.appendChild(p);
        ctx.after((life || 1.6) * 1000 + 100, () => p.remove());
      }
    };
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const seq = lv === 1 ? [1, 2, 3, 4, 5] : lv === 2 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const down = lv === 3;
    let idx = 0,
      busy = false;
    // 다음 숫자 노란 테두리(.next): 1단계는 늘(안내 판 → 열쇠 별 없음), 2·3단계는 한 번 틀린 뒤부터만
    // (예전엔 모든 단계에서 늘 정답 버튼에 테두리 → 테두리만 따라 눌러도 '깨끗한 판' 열쇠 별)
    let ring = lv === 1;
    const scene = ctx.scene;
    scene.className = "rk-scene";
    ctx.size();
    ctx.ship.style.setProperty("--a", 0);
    ctx.nums.classList.remove("off");
    ctx.nums.innerHTML = "";
    scene.querySelectorAll(".rk-puff").forEach((p) => p.remove());
    // 음성은 미리 만든 자연 음성으로: 1단계는 화면 문장 그대로, 2단계(10까지)는 같은 뜻의 있는 문장
    // (새 문장 "1부터 10까지 차례대로 눌러서 로켓에 힘을 모아요!" 은 tools/out/new-voice/rocket.txt)
    const intro = down ? "카운트다운! 10부터 거꾸로 눌러요!" : "1부터 " + seq.length + "까지 차례대로 눌러서 로켓에 힘을 모아요!";
    ctx.say(intro + " 🚀", KP.voice._natUrls && !KP.voice._natUrls(intro) ? "작은 것부터 큰 것까지 차례로 눌러요!" : intro);
    // 숫자 읽기: 카운트다운은 한자어(십·구·팔…), 나머지는 고유어(하나·둘…) — 안내·오답 문장도 같은 말로
    const word = (n) => (down ? ctx.SINO[n] : U.NAT[n]) || String(n);
    const say = word;

    const btns = seq.map((n, i) => {
      const b = U.el("button", "rk-n", String(n));
      b.style.setProperty("--i", i);
      b.dataset.n = n;
      ctx.fast(b, () => {
        if (busy || b.classList.contains("done")) return;
        if (n !== seq[idx]) {
          // "다음은 구예요/다섯이에요"는 자연 음성에 없는 것이 있어, 모든 숫자에 음성이 있는 "다음 숫자 ○를 눌러요!"로
          ctx.miss(b, "다음 숫자 " + KP.u.josa(word(seq[idx]), "을/를") + " 눌러요!");
          ring = true;
          btns[idx].classList.add("next");
          return;
        }
        b.classList.add("done");
        b.classList.remove("next");
        U.replay(b, "jump");
        idx++;
        const pr = idx / seq.length;
        // 큰 숫자 + 목소리
        ctx.big.textContent = n;
        U.replay(ctx.big, "show");
        KP.voice.say(say(n));
        A.note(A.SCALE[Math.min(idx - 1 + (lv === 1 ? 2 : 0), 11)], { inst: "marimba", dur: 0.4, vol: 0.28 });
        // 덜덜 + 연기 + 우르르
        ctx.ship.style.setProperty("--a", (1 + pr * 6).toFixed(1));
        ctx.puff(2 + Math.round(pr * 5), 40 + pr * 90);
        A.noise({ dur: 0.35 + pr * 0.4, vol: 0.06 + pr * 0.1, lp: 300 + pr * 500 });
        if (idx < seq.length) {
          if (ring) btns[idx].classList.add("next");
          hint();
        } else launch();
      });
      ctx.nums.appendChild(b);
      return b;
    });
    if (ring) btns[0].classList.add("next");
    const hint = () => ctx.hint(() => btns[idx], "다음 숫자 " + KP.u.josa(word(seq[idx]), "을/를") + " 눌러요!", { answer: true }); // 정답 숫자를 가리킴 → 가리킨 판은 열쇠 별 없음
    hint();

    const launch = async () => {
      busy = true;
      // 발사 연출이 매 판 같아 길게 느껴지지 않게: 2·3단계는 날아가는·내려가는 기다림을 25% 줄임
      const sp = lv >= 2 ? 0.75 : 1;
      ctx.hint(null);
      ctx.nums.classList.add("off");
      await ctx.wait(700);
      KP.voice.say("발사!");
      ctx.big.textContent = "발사!";
      U.replay(ctx.big, "show");
      scene.classList.add("go");
      // 연기 기둥
      for (let k = 0; k < 6; k++) ctx.after(k * 120, () => ctx.puff(6, 170, 1.8));
      A.kick({ vol: 0.6 });
      A.noise({ dur: 2.6, vol: 0.22, lp: 700, attack: 0.2 });
      A.tone(120, { to: 520, dur: 2.4, vol: 0.06, type: "triangle" });
      await ctx.wait(500);
      scene.classList.add("fly");
      A.sfx("whoosh");
      ctx.ship.style.setProperty("--a", 2);
      await ctx.wait(sp * 1500);
      A.sfx("sparkle");
      KP.voice.say("우와! 우주다!");
      await ctx.wait(sp * 1800);
      // 달 착륙
      scene.classList.remove("fly");
      scene.classList.add("land");
      KP.voice.say("달이 보여요! 살살 내려가요~");
      A.tone(700, { to: 300, dur: 1.8, vol: 0.06 });
      await ctx.wait(sp * 2300);
      scene.classList.add("landed");
      ctx.ship.style.setProperty("--a", 0);
      A.noise({ dur: 0.4, vol: 0.12, lp: 600 });
      ctx.puff(8, 120, 1.2);
      await ctx.wait(500);
      scene.classList.add("hello");
      A.sfx("levelup");
      KP.voice.say("달에 도착! 곰돌이 우주인이 안녕~ 하고 손을 흔들어요!");
      await ctx.wait(2200);
      if (!ctx._active) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      if (lv === 1) ctx.noStar(); // 1단계: 다음 숫자가 늘 테두리로 보임(정답 안내) → 열쇠 별 없음
      const ok = await ctx.win({ big, msg: big ? "{부름} 우주 비행사!" : "달 착륙 성공!" });
      if (ok) this.next(ctx);
    };
  },
});

;

/* ==== js/games/play/rps.js ==== */
/* 가위바위보 — 곰돌이와 대결! 내 손을 고르면 "가위! 바위! 보!" 박자에 맞춰 손을 흔들다 짠!
   - 곰돌이 얼굴을 직접 그려서 결과마다 표정이 바뀜 (놀람·울상·웃음)
   - 누가 이겼는지 이유도 말해 줌 ("바위가 가위를 이겨요!")
   - 비기거나 져도 즐겁게!
   1단계: 진짜 가위바위보(운) — 아이가 더 자주 이기게, 2번 이길 때마다 축하(운이라 열쇠 별 없음)
   2단계: '곰돌이를 이겨라' — 곰돌이가 먼저 손을 보여 주면 이기는 손을 골라요(정답 있음 → 틀리면 miss, 이유 문장으로 알려 줌)
   3단계: 같은 문제인데 곰돌이 손을 잠깐(2초)만 보여 주고 ❓로 가림 — 기억해서 이기는 손 고르기 */
"use strict";
KP.game({
  id: "rps",
  icon: "✋",
  name: "가위바위보",
  cat: "play",
  levels: 3,
  score: "🏆",
  setup(ctx) {
    const U = KP.u;
    KP.css("rps", `
      .rp-arena{flex:1;min-height:0;position:relative;margin:0 12px 6px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#ffe9d6 0%,#fff6ea 50%,#e3f4ff 50%,#cdeaff 100%);display:flex;flex-direction:column;justify-content:space-around;align-items:center;padding:8px}
      .rp-row{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,40px);width:100%}
      /* 낮고 넓은 화면(폰 가로): 위아래 두 줄이 안 들어가 '내 줄'이 잘렸음 → 곰돌이 | 가위바위보 | 나 를 좌우로 */
      .rp-arena.wide{flex-direction:row;justify-content:space-evenly;background:linear-gradient(90deg,#ffe9d6 0%,#fff6ea 50%,#e3f4ff 50%,#cdeaff 100%)}
      .rp-arena.wide .rp-row{width:auto;flex:1 1 0;min-width:0;gap:clamp(8px,2vw,24px)}
      .rp-arena.wide .rp-mid{min-height:0;flex:0 0 auto;max-width:34%}
      .rp-arena.wide .rp-res{white-space:normal}
      .rp-arena.wide .rp-hand.bear{transform:rotate(90deg)}
      .rp-arena.wide .rp-hand.mine{transform:rotate(-90deg)}
      .rp-arena.wide .rp-hand.bear.shake{animation-name:rp-shbw}
      .rp-arena.wide .rp-hand.mine.shake{animation-name:rp-shmw}
      @keyframes rp-shbw{50%{transform:rotate(90deg) translateY(25%)}}
      @keyframes rp-shmw{50%{transform:rotate(-90deg) translateY(25%)}}
      .rp-side{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
      .rp-face{width:var(--fs);height:var(--fs);position:relative}
      .rp-face svg{width:100%;height:100%;display:block;overflow:visible}
      .rp-face.me{font-size:var(--fs);line-height:1}
      .rp-face.me .e{width:100%;height:100%;display:block}
      .rp-name{font-size:clamp(16px,2.4vw,24px);background:#fff;padding:1px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.08);white-space:nowrap}
      .rp-pts{font-size:clamp(30px,4.6vw,48px);color:var(--ocean);min-width:1.4em;text-align:center;background:#fff;border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.08)}
      .rp-hand{width:var(--hs);height:var(--hs);font-size:var(--hs);line-height:1}
      .rp-hand .e{width:100%;height:100%;display:block}
      .rp-hand.bear{transform:rotate(180deg)}
      .rp-hand.bear.shake{animation:rp-shb .36s ease-in-out 3}
      .rp-hand.mine.shake{animation:rp-shm .36s ease-in-out 3}
      @keyframes rp-shb{50%{transform:rotate(180deg) translateY(25%)}}
      @keyframes rp-shm{50%{transform:translateY(25%)}}
      .rp-arena .rp-hand.bear.hid{transform:none}
      .rp-hand.reveal .e{animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .rp-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:clamp(70px,14vh,130px);text-align:center}
      .rp-vs{font-size:clamp(30px,5vw,54px);color:#ff7452;-webkit-text-stroke:2px #fff;paint-order:stroke}
      .rp-word{font-size:clamp(34px,6vw,64px);line-height:1.1;color:#fff;-webkit-text-stroke:5px #8a63ee;paint-order:stroke;text-shadow:0 5px 0 #6a3fd4;white-space:nowrap;}
      .rp-word:empty{display:none}
      .rp-word.show{animation:popBig .35s cubic-bezier(.2,1.6,.4,1)}
      .rp-res{font-size:clamp(20px,3vw,30px);color:var(--ink);background:#fff;border-radius:16px;padding:4px 12px;box-shadow:0 4px 0 rgba(0,0,0,.08);white-space:nowrap}
      .rp-res:empty{display:none}
      .rp-btns{flex:0 0 auto;display:flex;justify-content:center;gap:clamp(10px,2vw,24px);padding:6px 12px 14px}
      .rp-b{width:clamp(96px,14vw,150px);padding:8px 6px;border-radius:26px;background:#fff;box-shadow:0 8px 0 rgba(47,58,102,.14);display:flex;flex-direction:column;align-items:center;gap:2px;
        font-size:clamp(17px,2.4vw,24px);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*80ms)}
      .rp-b .e{font-size:clamp(50px,7vw,80px)}
      .rp-b:active{transform:translateY(5px)}
      .rp-b.sel{background:#fff5c9;box-shadow:0 0 0 5px #ffc531,0 8px 0 rgba(47,58,102,.14)}
      .rp-btns.off .rp-b:not(.sel){opacity:.4}
      .rp-face.jump{animation:jumpA .5s 2}
      .rp-face.sad svg{animation:rp-sad 1.2s ease-in-out}
      @keyframes rp-sad{30%{transform:rotate(-8deg)}60%{transform:rotate(6deg)}}
      .rp-face.laugh svg{animation:rp-laugh .25s ease-in-out 6 alternate}
      @keyframes rp-laugh{to{transform:translateY(-6px) rotate(3deg)}}
    `);
    // 곰돌이 얼굴 (표정: normal / happy / sad / wow)
    const FACE = {
      normal: {
        eyes: '<circle cx="70" cy="96" r="10" fill="#2a1d14"/><circle cx="130" cy="96" r="10" fill="#2a1d14"/><circle cx="73" cy="92" r="3.5" fill="#fff"/><circle cx="133" cy="92" r="3.5" fill="#fff"/>',
        mouth: '<path d="M86 142 Q100 154 114 142" fill="none" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>',
      },
      happy: {
        eyes: '<path d="M58 100 Q70 84 82 100" fill="none" stroke="#2a1d14" stroke-width="6" stroke-linecap="round"/><path d="M118 100 Q130 84 142 100" fill="none" stroke="#2a1d14" stroke-width="6" stroke-linecap="round"/>',
        mouth: '<path d="M80 138 Q100 172 120 138 Z" fill="#8a2f3c"/><path d="M90 152 Q100 164 110 152 Q100 148 90 152Z" fill="#ff8fa3"/>',
      },
      sad: {
        eyes: '<circle cx="70" cy="100" r="9" fill="#2a1d14"/><circle cx="130" cy="100" r="9" fill="#2a1d14"/><path d="M56 82 L80 88" stroke="#5a3a24" stroke-width="5" stroke-linecap="round"/><path d="M144 82 L120 88" stroke="#5a3a24" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M64 112 Q60 126 66 130 Q72 126 68 112Z" fill="#6cc3ff"/>',
        mouth: '<path d="M86 152 Q100 138 114 152" fill="none" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>',
      },
      wow: {
        eyes: '<circle cx="70" cy="94" r="14" fill="#fff" stroke="#2a1d14" stroke-width="3"/><circle cx="130" cy="94" r="14" fill="#fff" stroke="#2a1d14" stroke-width="3"/><circle cx="70" cy="96" r="6" fill="#2a1d14"/><circle cx="130" cy="96" r="6" fill="#2a1d14"/>',
        mouth: '<ellipse cx="100" cy="148" rx="11" ry="14" fill="#8a2f3c"/>',
      },
    };
    ctx.bearSVG = (mood) =>
      '<svg viewBox="0 0 200 200">' +
      '<circle cx="44" cy="46" r="30" fill="#a8754a"/><circle cx="44" cy="46" r="16" fill="#e8b48a"/><circle cx="156" cy="46" r="30" fill="#a8754a"/><circle cx="156" cy="46" r="16" fill="#e8b48a"/>' +
      '<circle cx="100" cy="108" r="82" fill="#c08a5a"/><circle cx="80" cy="80" r="40" fill="#cf9a69" opacity=".5"/>' +
      '<ellipse cx="100" cy="140" rx="44" ry="34" fill="#f2d4b2"/><ellipse cx="100" cy="122" rx="15" ry="11" fill="#3a2a20"/><ellipse cx="96" cy="118" rx="5" ry="3" fill="#fff" opacity=".6"/>' +
      '<ellipse cx="48" cy="128" rx="13" ry="8" fill="#ff8fa3" opacity=".55"/><ellipse cx="152" cy="128" rx="13" ry="8" fill="#ff8fa3" opacity=".55"/>' +
      FACE[mood].eyes + FACE[mood].mouth + "</svg>";

    const arena = U.el("div", "rp-arena");
    arena.innerHTML =
      '<div class="rp-row"><div class="rp-side"><div class="rp-face bear"></div><div class="rp-name">곰돌이</div></div><div class="rp-hand bear">' + KP.E("✊") + '</div><div class="rp-pts bp">0</div></div>' +
      '<div class="rp-mid"><div class="rp-word"></div><div class="rp-vs">VS</div><div class="rp-res"></div></div>' +
      '<div class="rp-row"><div class="rp-pts mp">0</div><div class="rp-hand mine">' + KP.E("✊") + '</div><div class="rp-side"><div class="rp-face me">' + KP.E("👦") + '</div><div class="rp-name">나</div></div></div>';
    const btns = U.el("div", "rp-btns");
    ctx.body.append(arena, btns);
    Object.assign(ctx, {
      arena, btnsEl: btns, bearFace: U.$(".rp-face.bear", arena), meFace: U.$(".rp-face.me", arena),
      bh: U.$(".rp-hand.bear", arena), mh: U.$(".rp-hand.mine", arena), word: U.$(".rp-word", arena), res: U.$(".rp-res", arena),
      vs: U.$(".rp-vs", arena), bp: U.$(".bp", arena), mp: U.$(".mp", arena),
    });
    ctx.HANDS = [
      { k: "rock", em: "✊", name: "바위", beats: "scissors" },
      { k: "scissors", em: "✌️", name: "가위", beats: "paper" },
      { k: "paper", em: "✋", name: "보", beats: "rock" },
    ];
    ctx.size = () => {
      const W = arena.clientWidth,
        H = arena.clientHeight;
      // 두 줄(각 얼굴+이름 약 110px)+가운데가 안 들어가는 낮은 무대는 좌우 배치
      arena.classList.toggle("wide", H < 330 && W > H * 1.6);
      arena.style.setProperty("--fs", Math.round(U.clamp(Math.min(W * 0.28, H * 0.28), 80, 210)) + "px");
      arena.style.setProperty("--hs", Math.round(U.clamp(Math.min(W * 0.24, H * 0.22), 70, 180)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    const U = KP.u;
    ctx.wins = 0;
    ctx.bearPts = 0;
    ctx.myPts = 0;
    ctx.bp.textContent = "0";
    ctx.mp.textContent = "0";
    requestAnimationFrame(() => ctx.size());
    // 고르기 버튼
    ctx.btnsEl.innerHTML = "";
    ctx.choiceBtns = ctx.HANDS.map((h, i) => {
      const b = U.el("button", "rp-b", KP.E(h.em) + "<span>" + h.name + "</span>");
      b.style.setProperty("--i", i);
      ctx.tap(b, () => this.play(ctx, h, b));
      ctx.btnsEl.appendChild(b);
      return b;
    });
    this.reset(ctx, true);
  },
  reset(ctx, first) {
    ctx.busy = false;
    ctx.wrongN = 0;
    ctx.bearFace.className = "rp-face bear";
    ctx.bearFace.innerHTML = ctx.bearSVG("normal");
    ctx.bh.innerHTML = KP.E("✊");
    ctx.mh.innerHTML = KP.E("✊");
    ctx.bh.className = "rp-hand bear";
    ctx.mh.className = "rp-hand mine";
    ctx.word.textContent = "";
    ctx.res.textContent = "";
    ctx.vs.style.display = "";
    ctx.res.textContent = "";
    ctx.btnsEl.classList.remove("off");
    ctx.choiceBtns.forEach((b) => b.classList.remove("sel"));
    if (ctx.level >= 2) return this.quizSet(ctx, first);
    ctx.say(first ? "곰돌이랑 가위바위보! 내 손을 골라요 ✊✌️✋" : "또 해 볼까? 골라 봐요! ✊✌️✋", true);
    ctx.hint(() => KP.u.pick(ctx.choiceBtns), "가위, 바위, 보 중에 하나를 콕!");
  },
  /* ---------- 2·3단계: 곰돌이를 이기는 손 고르기 ---------- */
  quizSet(ctx, first) {
    const U = KP.u;
    const lv = ctx.level;
    // 곰돌이 손: 바로 앞 판과 다르게
    const bear = U.pick(ctx.HANDS.filter((h) => h !== ctx.quizBear));
    ctx.quizBear = bear;
    ctx.quizWin = ctx.HANDS.find((h) => h.beats === bear.k);
    ctx.vs.style.display = "none";
    ctx.bh.innerHTML = KP.E(bear.em);
    U.replay(ctx.bh, "reveal");
    ctx.word.textContent = bear.name + "!";
    U.replay(ctx.word, "show");
    KP.audio.sfx("pop");
    // 말: "곰돌이 바위!"(자연 음성 조각) + "무엇을 내야 이길까요?"(새 문장 new-voice/rps.txt — 녹음 전에는 기기 목소리)
    const Q = "무엇을 내야 이길까요?";
    ctx.say((first ? "곰돌이를 이겨라! " : "") + "곰돌이는 " + bear.em + " " + bear.name + "! " + Q, "곰돌이 " + bear.name + "! " + Q);
    if (lv >= 3) {
      // 3단계: 2초 뒤 곰돌이 손을 가림 → 기억해서 고르기
      const tok = (ctx.quizTok = (ctx.quizTok || 0) + 1);
      ctx.after(2000, () => {
        if (ctx.quizTok !== tok || ctx.busy || !ctx._active) return;
        ctx.bh.innerHTML = KP.E("❓");
        ctx.bh.classList.add("hid"); // 물음표는 돌리지 않게
        U.replay(ctx.bh, "reveal");
        ctx.word.textContent = "";
        ctx.say("곰돌이 손은 뭐였지? 무엇을 내야 이길까요? 🤔", false); // 말풍선 글자만 (답이 보이지 않게)
        KP.audio.sfx("whoosh");
      });
    }
    // 이기는 손(정답)을 가리킴 → 가리킨 판은 열쇠 별 없음
    ctx.hint(() => ctx.choiceBtns[ctx.HANDS.indexOf(ctx.quizWin)], U.josa(ctx.quizWin.name, "이/가") + " " + U.josa(bear.name, "을/를") + " 이겨요!", { answer: true });
  },
  async quiz(ctx, mine, btn) {
    const U = KP.u,
      A = KP.audio;
    if (ctx.busy) return;
    ctx.busy = true;
    ctx.quizTok = (ctx.quizTok || 0) + 1; // 가리기 예약 취소
    ctx.hint(null);
    const bear = ctx.quizBear,
      right = ctx.quizWin;
    const why = (a, b) => U.josa(a.name, "이/가") + " " + U.josa(b.name, "을/를") + " 이겨요!";
    btn.classList.add("sel");
    ctx.btnsEl.classList.add("off");
    A.sfx("select");
    // 짠! 둘 다 보여 주기
    ctx.bh.classList.remove("hid");
    ctx.bh.innerHTML = KP.E(bear.em);
    ctx.mh.innerHTML = KP.E(mine.em);
    U.replay(ctx.bh, "reveal");
    U.replay(ctx.mh, "reveal");
    await ctx.wait(450);
    if (!ctx._active) return;
    if (mine === right) {
      ctx.bearFace.innerHTML = ctx.bearSVG("wow");
      ctx.word.textContent = "이겼다!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = why(mine, bear);
      ctx.myPts++;
      ctx.mp.textContent = ctx.myPts;
      U.replay(ctx.mp, "bump");
      U.replay(ctx.meFace, "jump");
      ctx.score.add();
      A.sfx("good");
      KP.voice.say("이겼다! " + why(mine, bear));
      await ctx.wait(1500);
      if (!ctx._active) return;
      ctx.bearFace.innerHTML = ctx.bearSVG("sad");
      U.replay(ctx.bearFace, "sad");
      await ctx.wait(500);
      if (!ctx._active) return;
      ctx.round = (ctx.round || 0) + 1;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "가위바위보 챔피언!" : "곰돌이를 이겼어요!", say: big ? "" : "{부름} 최고!" });
      if (ok && ctx._active) this.reset(ctx);
      return;
    }
    // 틀림: 곰돌이가 깔깔 + 이기는 까닭을 말해 줌 (곰돌이 손은 그대로, 다시 고르기)
    ctx.wrongN++;
    ctx.bearFace.innerHTML = ctx.bearSVG("happy");
    U.replay(ctx.bearFace, "laugh");
    ctx.word.textContent = mine === bear ? "비겼다!" : "곰돌이 승!";
    U.replay(ctx.word, "show");
    ctx.res.textContent = why(right, bear);
    ctx.miss(btn, (mine === bear ? "똑같네! " : "") + why(right, bear));
    await ctx.wait(2300);
    if (!ctx._active) return;
    // 5번 틀려 1단계(운 판)로 내려갔으면: 문제 화면을 걷고 1단계로 (예전엔 '이기는 손' 안내가 남은 채 다음 누름이 운 판이 됨)
    if (ctx.level < 2) return this.reset(ctx);
    ctx.bearFace.innerHTML = ctx.bearSVG("normal");
    ctx.mh.innerHTML = KP.E("✊");
    ctx.word.textContent = bear.name + "!";
    ctx.res.textContent = "";
    ctx.btnsEl.classList.remove("off");
    ctx.choiceBtns.forEach((b) => b.classList.remove("sel"));
    const rb = ctx.choiceBtns[ctx.HANDS.indexOf(right)];
    if (ctx.wrongN >= 2) {
      // 두 번 헷갈리면 이기는 손을 살짝 반짝 (이번 판 열쇠 별 없음)
      ctx._hinted = true;
      rb.classList.add("hintGlow");
      ctx.after(3000, () => rb.classList.remove("hintGlow"));
    }
    ctx.busy = false;
    ctx.say("곰돌이는 " + bear.em + " " + bear.name + "! 무엇을 내야 이길까요?", "곰돌이 " + bear.name + "! 무엇을 내야 이길까요?");
    ctx.hint(() => rb, why(right, bear), { answer: true });
  },
  async play(ctx, mine, btn) {
    const U = KP.u,
      A = KP.audio;
    if (ctx.level >= 2) return this.quiz(ctx, mine, btn);
    if (ctx.busy) return;
    ctx.busy = true;
    ctx.hint(null);
    btn.classList.add("sel");
    ctx.btnsEl.classList.add("off");
    A.sfx("select");
    // 곰돌이 손 정하기 (1단계: 아이가 더 자주 이김) (단계별로 아이가 이길 확률 조절)
    const lv = ctx.level;
    const [pw, pd] = [[0.55, 0.25], [0.45, 0.28], [0.34, 0.33]][lv - 1]; // (2·3단계는 quiz 로 감 — 1단계 값만 씀)
    const r = Math.random();
    const want = r < pw ? "win" : r < pw + pd ? "draw" : "lose";
    const bear =
      want === "draw" ? mine : want === "win" ? ctx.HANDS.find((h) => h.k === mine.beats) : ctx.HANDS.find((h) => h.beats === mine.k);
    // 가위! 바위! 보!
    ctx.vs.style.display = "none";
    KP.voice.say("가위, 바위, 보!", { rate: 1.05 });
    const WORDS = ["가위!", "바위!", "보!"];
    for (let i = 0; i < 3; i++) {
      ctx.word.textContent = WORDS[i];
      U.replay(ctx.word, "show");
      if (i < 2) {
        U.replay(ctx.bh, "shake");
        U.replay(ctx.mh, "shake");
      }
      A.kick({ vol: 0.25 });
      A.note(["C5", "E5", "G5"][i], { inst: "marimba", dur: 0.25, vol: 0.25 });
      await ctx.wait(i < 2 ? 420 : 200);
      if (!ctx._active) return;
    }
    // 짠! 공개
    ctx.bh.classList.remove("shake");
    ctx.mh.classList.remove("shake");
    ctx.bh.innerHTML = KP.E(bear.em);
    ctx.mh.innerHTML = KP.E(mine.em);
    U.replay(ctx.bh, "reveal");
    U.replay(ctx.mh, "reveal");
    A.sfx("pop");
    await ctx.wait(600);
    if (!ctx._active) return;
    const result = mine.k === bear.k ? "draw" : mine.beats === bear.k ? "win" : "lose";
    const why = (a, b) => U.josa(a.name, "이/가") + " " + U.josa(b.name, "을/를") + " 이겨요!";
    if (result === "win") {
      ctx.bearFace.innerHTML = ctx.bearSVG("wow");
      ctx.word.textContent = "이겼다!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = why(mine, bear);
      ctx.myPts++;
      ctx.mp.textContent = ctx.myPts;
      U.replay(ctx.mp, "bump");
      U.replay(ctx.meFace, "jump");
      ctx.score.add();
      A.sfx("good");
      KP.voice.say("이겼다! " + why(mine, bear));
      await ctx.wait(1400);
      ctx.bearFace.innerHTML = ctx.bearSVG("sad");
      U.replay(ctx.bearFace, "sad");
      KP.voice.say("으앙, 졌다~ {부름} 최고!");
      ctx.wins++;
      await ctx.wait(1400);
      if (!ctx._active) return;
      if (ctx.wins % 2 === 0) {
        // 2번 이길 때마다 축하 (예전 3번 → 1단계 한 판 35~44초)
        const big = ctx.wins % 6 === 0;
        ctx.noStar(); // 가위바위보 결과는 운 → 열쇠 별 없음 (축하·단계는 그대로)
        const ok = await ctx.win({ big, msg: big ? "가위바위보 챔피언!" : "곰돌이를 이겼어요!" });
        if (!ok) return;
      } else KP.confetti(50, innerWidth * 0.75, innerHeight * 0.4);
    } else if (result === "draw") {
      ctx.bearFace.innerHTML = ctx.bearSVG("happy");
      U.replay(ctx.bearFace, "laugh");
      ctx.word.textContent = "비겼다!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = "똑같은 " + mine.name + "!";
      A.sfx("boing");
      KP.voice.say("똑같네! 비겼다! 하하");
      await ctx.wait(2200);
    } else {
      ctx.bearFace.innerHTML = ctx.bearSVG("happy");
      U.replay(ctx.bearFace, "laugh");
      ctx.word.textContent = "곰돌이 승!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = why(bear, mine);
      ctx.bearPts++;
      ctx.bp.textContent = ctx.bearPts;
      U.replay(ctx.bp, "bump");
      A.note("E5", { inst: "pluck", dur: 0.2, vol: 0.2 });
      A.note("C5", { inst: "pluck", dur: 0.3, vol: 0.2, when: 0.18 });
      KP.voice.say("내가 이겼다~ " + why(bear, mine) + " 한 번 더 할까?");
      await ctx.wait(2800);
    }
    if (ctx._active) this.reset(ctx);
  },
});
