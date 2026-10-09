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
      const r = board.getBoundingClientRect(),
        d = Math.min(devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
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
      [1, 1.25, 1.5, 2].forEach((m, i) => A.note(base * m, { inst: "bell", dur: 0.6, vol: 0.06, when: 0.05 + i * 0.05 }));
    };
    const crackle = () => {
      for (let i = 0; i < 6; i++) A.noise({ dur: 0.03, vol: 0.06, hp: 3000, when: 0.25 + Math.random() * 0.5 });
    };

    /* ---------- 입자 ---------- */
    function P(x, y, vx, vy, hue, o) {
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
          for (let i = 0; i < 80; i++) {
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
          for (let i = 0; i < 90; i++) {
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
      cx.globalCompositeOperation = "source-over";
      cx.fillStyle = "rgba(11,16,48,0.22)";
      cx.fillRect(0, 0, W, H);
      // 별
      const t = performance.now() / 1000;
      cx.fillStyle = "#fff";
      stars.forEach((s) => {
        cx.globalAlpha = 0.35 + Math.sin(t * 2 + s.t) * 0.3;
        cx.beginPath();
        cx.arc(s.x, s.y, s.r, 0, 6.28);
        cx.fill();
      });
      cx.globalAlpha = 1;
      // 도시 실루엣
      cx.fillStyle = "#141a44";
      const bw = W / 14;
      for (let i = 0; i < 15; i++) {
        const bh = 30 + ((i * 53) % 70);
        cx.fillRect(i * bw, H - bh, bw - 4, bh);
      }
      cx.fillStyle = "rgba(255,220,120,.5)";
      for (let i = 0; i < 15; i++) {
        const bh = 30 + ((i * 53) % 70);
        for (let k = 12; k < bh - 8; k += 16) if ((i * 7 + k) % 3) cx.fillRect(i * bw + 8, H - bh + k, 5, 6);
      }

      cx.globalCompositeOperation = "lighter";
      rockets = rockets.filter((r) => {
        r.y += r.vy;
        r.wob += 0.3;
        const x = r.x + Math.sin(r.wob) * 1.5;
        P(x, r.y + 6, (Math.random() - 0.5) * 0.6, 1 + Math.random(), 40, { decay: 0.05, size: 1.8, grav: 0.01 });
        cx.fillStyle = "hsl(" + r.hue + ",90%,85%)";
        cx.beginPath();
        cx.arc(x, r.y, 3.2, 0, 6.28);
        cx.fill();
        if (r.y <= r.ty) {
          explode(x, r.ty, r.type, r.hue);
          return false;
        }
        return true;
      });
      if (parts.length > 1400) parts.splice(0, parts.length - 1400);
      const next = [];
      for (const p of parts) {
        if (p.flash) {
          p.life -= p.decay;
          if (p.life > 0) {
            const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, "hsla(" + p.hue + ",100%,90%," + p.life * 0.5 + ")");
            g.addColorStop(1, "hsla(" + p.hue + ",100%,60%,0)");
            cx.fillStyle = g;
            cx.beginPath();
            cx.arc(p.x, p.y, p.r, 0, 6.28);
            cx.fill();
            next.push(p);
          }
          continue;
        }
        p.vx *= 0.986;
        p.vy = p.vy * 0.986 + p.grav;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) continue;
        if (p.split && p.life < 0.55) {
          p.split = false;
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * 6.28;
            P(p.x, p.y, Math.cos(a) * 2.2, Math.sin(a) * 2.2, (p.hue + 40) % 360, { decay: 0.02, glitter: true });
          }
          A.noise({ dur: 0.04, vol: 0.05, hp: 3000 });
          continue;
        }
        if (p.crackle && p.life < 0.4) {
          p.crackle = false;
          for (let i = 0; i < 5; i++) {
            const a = Math.random() * 6.28;
            P(p.x, p.y, Math.cos(a) * 1.4, Math.sin(a) * 1.4, p.hue, { decay: 0.035, size: 1.4 });
          }
        }
        if (p.trail && Math.random() < 0.25) P(p.x, p.y, 0, 0.3, p.hue, { decay: 0.04, size: 1.1, grav: 0.01 });
        if (p.emoji) {
          cx.globalCompositeOperation = "source-over";
          cx.globalAlpha = Math.min(1, p.life * 1.6);
          p.rot += p.vr;
          KP.drawE(cx, p.emoji, p.x, p.y, p.size, p.rot);
          cx.globalAlpha = 1;
          cx.globalCompositeOperation = "lighter";
        } else {
          const al = p.glitter ? (Math.random() < 0.5 ? p.life : p.life * 0.15) : p.life;
          cx.globalAlpha = Math.max(0, al);
          cx.fillStyle = "hsl(" + p.hue + ",100%," + (58 + p.life * 25) + "%)";
          cx.beginPath();
          cx.arc(p.x, p.y, p.size * (0.6 + p.life * 0.4), 0, 6.28);
          cx.fill();
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
