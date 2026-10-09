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
      .fwBtn{pointer-events:auto;font-size:clamp(26px,4.2vw,40px);width:clamp(52px,7.6vw,72px);height:clamp(52px,7.6vw,72px);border-radius:50%;background:rgba(255,255,255,.14);border:3px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
      .fwBtn.sel{background:rgba(255,255,255,.9);border-color:#ffd54a;transform:scale(1.12)}
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
    }
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
      cx.fillStyle = "#141a44";
      const bw = W / 14;
      for (let i = 0; i < 15; i++) {
        const bh = 30 + ((i * 53) % 70);
        cx.fillRect(i * bw, H - bh, bw - 4, bh);
      }
      cx.fillStyle = "rgba(255,220,120,.5)";
      for (let i = 0; i < 15; i++) {
        const bh = 30 + ((i * 53) % 70);
        for (let kk = 12; kk < bh - 8; kk += 16) if ((i * 7 + kk) % 3) cx.fillRect(i * bw + 8, H - bh + kk, 5, 6);
      }

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
