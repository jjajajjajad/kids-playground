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
      .kc-tb.glow{animation:kc-glow 1.1s ease-in-out infinite alternate}
      @keyframes kc-glow{from{box-shadow:0 5px 0 rgba(0,0,0,.13),0 0 0 0 rgba(255,200,40,.0)}to{box-shadow:0 5px 0 rgba(0,0,0,.13),0 0 0 7px rgba(255,200,40,.75)}}
      .kc-bar.off .kc-tb{opacity:.55}
      .kc-towel{display:block;border-radius:12%;background:repeating-linear-gradient(90deg,#ff8fb1 0 18%,#ffd1df 18% 30%);box-shadow:inset 0 -18% 0 rgba(0,0,0,.08),inset 0 0 0 3px rgba(255,255,255,.6)}
      .kc-pop{position:absolute;z-index:8;pointer-events:none;white-space:nowrap;font-size:clamp(24px,4.4vmin,44px);color:#fff;-webkit-text-stroke:0;
        text-shadow:0 3px 0 rgba(0,0,0,.25),0 0 8px rgba(0,0,0,.15);transform:translate(-50%,-50%);animation:kc-pop 1.1s ease-out forwards}
      .kc-pop.big{font-size:clamp(40px,8vmin,80px)}
      @keyframes kc-pop{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}20%{opacity:1;transform:translate(-50%,-60%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-160%) scale(1)}}
      .kc-zone{position:absolute;z-index:6;pointer-events:none;border-radius:16px;border:4px dashed rgba(255,255,255,.95);box-shadow:0 0 0 5px rgba(255,205,60,.55);opacity:0;transition:opacity .3s}
      .kc-zone.on{opacity:1;animation:kc-zone 1.3s ease-in-out infinite alternate}
      @keyframes kc-zone{from{box-shadow:0 0 0 3px rgba(255,205,60,.35)}to{box-shadow:0 0 0 9px rgba(255,205,60,.75)}}
      .kc-ask{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.35)}
      .kc-ask .qAns{gap:clamp(10px,2vw,22px)}
      .kc-ask .choice{width:clamp(92px,17vmin,150px);height:clamp(92px,17vmin,150px)}
      .kc-ask .choice .e{width:70%;height:70%}
      .kc-ask .choice.kc-glowc{animation:kc-glow 1.1s ease-in-out infinite alternate}
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
      frame: o.frame || (() => ({ x: 0, y: 0, w: host.clientWidth, h: host.clientHeight })),
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
      const w = host.clientWidth,
        h = host.clientHeight,
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
    /** 진흙 덩이 그리기 (틀 0~1 좌표·r 은 틀 너비 비율) */
    S.skinMud = (list) => {
      const sk = S.skin;
      if (!sk) return;
      for (const s of list) {
        const x = s.x * sk.w, y = s.y * sk.h, r = s.r * sk.w * 0.5;
        clipStamp("dirt", x, y, r * 2.2, (gg) => care.drawSplat(gg, x, y, r, s.seed, s.col));
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
        const el = sk.el, w = el.clientWidth, h = el.clientHeight;
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
      ctx.loop((dt) => {
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
          if (o.mode === 1) ctx.miss(b, "이건 조금 있다가 해요!", { soft: true });
          else {
            ctx.miss(b, cur && cur.wrong ? cur.wrong : "음, 그 전에 할 일이 있어요!");
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
          ctx.say(first && o.ask ? o.ask : "다음엔 뭘 할까요?");
          ctx.hint(() => btns[st.tool], st.say);
        } else {
          if (first && o.ask) ctx.say(o.ask);
          ctx.hint(() => btns[st.tool], st.say);
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
