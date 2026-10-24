/* 치카치카 양치 — 하마 입속 이를 큰 칫솔로 문질러 세균·얼룩을 닦고, 마지막에 물로 헹궈 '퉤!'
   - 구역 4곳: 위 앞니 · 아래 앞니 · 위 안쪽 이 · 아래 안쪽 이 (구역마다 85% 닦으면 반짝)
   - 문지른 거리로 지워짐(톡 누르기로는 안 지워짐), 칫솔 자리에 거품이 남고 헹구면 사라짐
   - 단계: 1 한 구역씩(안내) → 2 세 구역을 차례로(안내) → 3 네 구역 안내 없이 골고루(멈추면 덜 닦인 곳이 반짝)
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
    KP.care.css();
    KP.css("brush", `
      .br-scene{background:repeating-linear-gradient(0deg,#d9f1ff 0 46px,#cbe9fb 46px 48px),#d9f1ff}
      .br-base{position:absolute;left:0;top:0;width:100%;height:100%;z-index:1}
      .br-water{position:absolute;z-index:3;pointer-events:none;border-radius:0 0 40px 40px;background:linear-gradient(rgba(140,210,255,.55),rgba(90,170,240,.7));
        height:0;transition:height .9s ease}
      .br-cup{position:absolute;right:clamp(10px,2vw,22px);bottom:clamp(10px,2vh,22px);z-index:9;width:clamp(80px,14vmin,124px);height:clamp(92px,16vmin,140px);
        border-radius:18px;background:rgba(255,255,255,.75);box-shadow:0 5px 0 rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;transition:transform .5s}
      .br-cup[hidden]{display:none!important}
      .br-cup i{display:block;width:62%;height:74%;clip-path:polygon(0 0,100% 0,86% 100%,14% 100%);
        background:linear-gradient(rgba(255,255,255,.5) 0 30%,#7cc8ff 30% 100%);box-shadow:inset 0 0 0 4px rgba(80,150,220,.5)}
      .br-cup.glow{animation:kc-glow 1.1s ease-in-out infinite alternate}
      .br-cup.tilt{transform:rotate(-55deg) translate(-30%,-20%)}
    `);
    const scene = U.el("div", "kc-scene br-scene");
    const base = U.el("canvas", "br-base");
    const water = U.el("div", "br-water");
    const cup = U.el("button", "br-cup", "<i></i>");
    cup.dataset.next = "1";
    cup.hidden = true;
    scene.append(base, water);
    ctx.body.appendChild(scene);
    const S = KP.care.surface(ctx, scene, { frame: () => ctx.F });
    scene.appendChild(cup);
    Object.assign(ctx, { scene, base, water, cup, S, happy: false, zoneEls: {} });

    // 이 위치 (틀 기준 0~1). i: 0·5 는 안쪽 이(어금니)
    const TEETH = [];
    const xs = [0.13, 0.27, 0.385, 0.5, 0.615, 0.73],
      ws = [0.14, 0.115, 0.115, 0.115, 0.115, 0.14];
    for (let i = 0; i < 6; i++) {
      const back = i === 0 || i === 5;
      const w = ws[i] - 0.01,
        x = xs[i] + 0.005;
      TEETH.push({ row: "u", i, back, x, w, y: 0.24, h: back ? 0.16 : 0.2 });
      TEETH.push({ row: "l", i, back, x, w, y: back ? 0.725 : 0.685, h: back ? 0.155 : 0.195 });
    }
    ctx.TEETH = TEETH;
    ctx.ZONES = {
      uf: { say: "위쪽 앞니를 치카치카!", teeth: TEETH.filter((t) => t.row === "u" && !t.back) },
      lf: { say: "아래쪽 앞니를 치카치카!", teeth: TEETH.filter((t) => t.row === "l" && !t.back) },
      ub: { say: "위쪽 안쪽 이를 닦아요!", teeth: TEETH.filter((t) => t.row === "u" && t.back) },
      lb: { say: "아래쪽 안쪽 이를 닦아요!", teeth: TEETH.filter((t) => t.row === "l" && t.back) },
    };

    ctx.layout = () => {
      const W = scene.clientWidth,
        H = scene.clientHeight;
      // 세로로 긴 화면은 입을 위아래로, 아주 납작한 화면(폰 가로)은 옆으로 키움 (이가 커짐)
      const asp = H > W * 1.2 ? 0.92 : W > H * 2 ? 1.7 : 1.3;
      const fw = Math.max(120, Math.min(W * 0.94, H * 0.9 * asp)),
        fh = fw / asp;
      ctx.F = { x: (W - fw) / 2, y: (H - fh) / 2 + fh * 0.03, w: fw, h: fh };
      const d = Math.min(2, window.devicePixelRatio || 1);
      base.width = Math.round(W * d);
      base.height = Math.round(H * d);
      ctx.drawBase();
      // 구역 표시(반짝 테두리) — 이 묶음마다 하나
      for (const k in ctx.ZONES) {
        (ctx.zoneEls[k] || []).forEach((e) => e.remove());
        const z = ctx.ZONES[k];
        const groups = z.teeth.every((t) => !t.back) ? [z.teeth] : z.teeth.map((t) => [t]);
        ctx.zoneEls[k] = groups.map((gr) => {
          const F = ctx.F;
          const x0 = Math.min(...gr.map((t) => t.x)),
            x1 = Math.max(...gr.map((t) => t.x + t.w)),
            y0 = Math.min(...gr.map((t) => t.y)),
            y1 = Math.max(...gr.map((t) => t.y + t.h));
          const e = U.el("div", "kc-zone");
          const pad = 6;
          e.style.cssText = `left:${F.x + x0 * F.w - pad}px;top:${F.y + y0 * F.h - pad}px;width:${(x1 - x0) * F.w + pad * 2}px;height:${(y1 - y0) * F.h + pad * 2}px`;
          scene.appendChild(e);
          return e;
        });
      }
      if (ctx.glowZone) ctx.showZone(ctx.glowZone);
      const F = ctx.F;
      water.style.left = F.x + 0.07 * F.w + "px";
      water.style.width = 0.86 * F.w + "px";
      water.style.top = "auto";
      water.style.bottom = scene.clientHeight - (F.y + 0.88 * F.h) + "px";
      ctx.S.radius = 0.055;
      ctx.S.setTool(KP.E("🪥"), F.w * 0.2);
    };
    ctx.showZone = (k) => {
      ctx.glowZone = k;
      for (const z in ctx.zoneEls) ctx.zoneEls[z].forEach((e) => e.classList.toggle("on", z === k));
    };
    ctx.drawBase = () => {
      const g = base.getContext("2d"),
        d = base.width / Math.max(1, scene.clientWidth),
        F = ctx.F;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.clearRect(0, 0, scene.clientWidth, scene.clientHeight);
      const X = (v) => F.x + v * F.w,
        Y = (v) => F.y + v * F.h,
        L = (v) => v * F.w;
      const rr = (x, y, w, h, r, fill) => {
        g.fillStyle = fill;
        g.beginPath();
        g.roundRect(x, y, w, h, r);
        g.fill();
      };
      const HEAD = "#b9a3e3",
        HEAD2 = "#9c86cc";
      // 귀·눈 둔덕
      for (const s of [-1, 1]) {
        g.fillStyle = HEAD2;
        g.beginPath();
        g.arc(X(0.5 + s * 0.4), Y(0.05), L(0.045), 0, 6.283);
        g.fill();
        g.fillStyle = HEAD;
        g.beginPath();
        g.arc(X(0.5 + s * 0.25), Y(0.11), L(0.1), 0, 6.283);
        g.fill();
      }
      rr(X(0), Y(0.1), L(1), F.h * 0.9, L(0.16), HEAD);
      // 눈
      for (const s of [-1, 1]) {
        const ex = X(0.5 + s * 0.25),
          ey = Y(0.1);
        if (ctx.happy) {
          g.strokeStyle = "#3a2b55";
          g.lineWidth = L(0.016);
          g.lineCap = "round";
          g.beginPath();
          g.arc(ex, ey + L(0.02), L(0.045), Math.PI * 1.15, Math.PI * 1.85);
          g.stroke();
        } else {
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(ex, ey, L(0.065), 0, 6.283);
          g.fill();
          g.fillStyle = "#3a2b55";
          g.beginPath();
          g.arc(ex + L(0.008), ey + L(0.01), L(0.034), 0, 6.283);
          g.fill();
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(ex + L(0.02), ey - L(0.006), L(0.011), 0, 6.283);
          g.fill();
        }
      }
      // 콧구멍
      g.fillStyle = HEAD2;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(X(0.5 + s * 0.07), Y(0.19), L(0.022), L(0.013), 0, 0, 6.283);
        g.fill();
      }
      // 입 안
      rr(X(0.07), Y(0.235), L(0.86), F.h * 0.645, L(0.12), "#c8475f");
      g.fillStyle = "#8e2643";
      g.beginPath();
      g.ellipse(X(0.5), Y(0.5), L(0.15), F.h * 0.12, 0, 0, 6.283);
      g.fill();
      g.fillStyle = "#ff8fa8";
      g.beginPath();
      g.ellipse(X(0.5), Y(0.68), L(0.24), F.h * 0.11, 0, 0, 6.283);
      g.fill();
      // 이
      for (const t of ctx.TEETH) {
        const x = X(t.x),
          y = Y(t.y),
          w = L(t.w),
          h = t.h * F.h;
        rr(x, y, w, h, L(0.03), t.back ? "#fbf3dc" : "#fffdf7");
        g.fillStyle = "rgba(0,0,0,.06)";
        g.beginPath();
        if (t.row === "u") g.roundRect(x, y + h * 0.78, w, h * 0.22, [0, 0, L(0.03), L(0.03)]);
        else g.roundRect(x, y, w, h * 0.2, [L(0.03), L(0.03), 0, 0]);
        g.fill();
        g.fillStyle = "rgba(255,255,255,.9)";
        g.beginPath();
        g.ellipse(x + w * 0.3, y + h * 0.35, w * 0.08, h * 0.14, 0, 0, 6.283);
        g.fill();
      }
    };
    addEventListener("resize", () => ctx._active && ctx.F && ctx.layout());
    ctx.tap(cup, () => ctx.onCup && ctx.onCup());
    KP.loadE(["🦠", "🪥"]);
  },
  async start(ctx) {
    ctx.round = 0;
    await KP.loadE(["🦠", "🪥"]);
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const sess = ctx._session;
    const lv = ctx.level;
    const keys = Object.keys(ctx.ZONES);
    const list = lv === 1 ? [U.pick(keys)] : lv === 2 ? U.sample(keys, 3) : U.shuffle(keys);
    ctx.happy = false;
    ctx.glowZone = null;
    ctx.layout();
    ctx.cup.hidden = true;
    ctx.cup.classList.remove("tilt", "glow");
    ctx.water.style.height = "0";
    ctx.onCup = null;
    S.reset();
    S.mode = { foam: true };
    S.need = 0.85;
    // 세균·얼룩 놓기 (이 하나에 세균 1 + 얼룩 1 + 안 보이는 점 2 → 이 전체를 문질러야 함)
    for (const k of list)
      for (const t of ctx.ZONES[k].teeth) {
        const fx = (v) => t.x + t.w * v,
          fy = (v) => t.y + t.h * v;
        S.add([
          { zone: k, x: fx(U.randf(0.35, 0.65)), y: fy(t.row === "u" ? U.randf(0.45, 0.65) : U.randf(0.35, 0.55)), r: t.w * 0.42, need: 2.2, draw: C.drawGerm },
          { zone: k, x: fx(U.randf(0.3, 0.7)), y: fy(U.randf(0.25, 0.75)), r: t.w * 0.3, need: 1.6, draw: C.drawStain },
          { zone: k, x: fx(0.5), y: fy(0.22), need: 1.4 },
          { zone: k, x: fx(0.5), y: fy(0.8), need: 1.4 },
        ]);
      }
    S.run();
    S.on = true;
    let chika = 0;
    S.onRub = (x, y, len) => {
      chika += len;
      if (chika > 320) {
        chika = 0;
        C.pop(ctx, ctx.scene, x + U.randf(-30, 30), y - 40, "치카");
      }
    };
    const guided = lv < 3;
    let at = 0;
    const guide = () => {
      while (at < list.length && S.zones[list[at]].done) at++;
      if (at >= list.length) return;
      const k = list[at];
      ctx.showZone(k);
      ctx.say(ctx.ZONES[k].say + " 🪥");
      ctx.hint(() => ctx.zoneEls[k][0], ctx.ZONES[k].say);
    };
    S.onZone = (k) => {
      const F = ctx.F;
      for (const t of ctx.ZONES[k].teeth) S.burst(F.x + (t.x + t.w / 2) * F.w, F.y + (t.y + t.h / 2) * F.h, 6, "star", 0.6);
      A.sfx("sparkle");
      if (ctx.glowZone === k) ctx.showZone(null);
      if (S.leftZones().length) {
        KP.voice.say(U.pick(["반짝반짝!", "깨끗해졌어요!", "좋아요!"]));
        if (guided) ctx.after(900, () => ctx._session === sess && S.on && guide());
      }
    };
    if (guided) {
      if (lv === 1) guide();
      else {
        ctx.say("하마 이에 세균이 있어요! 치카치카 닦아 줘요 🪥");
        ctx.after(2200, () => ctx._session === sess && S.on && guide());
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
        if (ctx._session !== sess || !S.on) return ctx.cancel(iv);
        const idle = Date.now() - Math.max(S.lastRub || 0, t0);
        if (idle > 4000 && !ctx.glowZone) {
          const k = S.leastZone();
          if (k) ctx.showZone(k);
        } else if (idle < 500 && ctx.glowZone && S.prog(ctx.glowZone) > 0.4) ctx.showZone(null);
      });
    }
    S.onAll = () => this.rinse(ctx, sess);
  },
  rinse(ctx, sess) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    S.on = false;
    S.onRub = null;
    ctx.showZone(null);
    ctx.after(800, () => {
      if (ctx._session !== sess) return;
      ctx.cup.hidden = false;
      ctx.cup.classList.add("glow");
      U.replay(ctx.cup, "pop");
      ctx.say("이제 물로 헹궈요! 컵을 눌러요 🥛");
      ctx.hint(() => ctx.cup, "컵을 눌러요!");
    });
    ctx.onCup = async () => {
      if (ctx.cup.hidden || ctx.cup.classList.contains("tilt")) return;
      ctx.onCup = null;
      ctx.hint(null);
      ctx.cup.classList.remove("glow");
      ctx.cup.classList.add("tilt");
      A.sfx("water");
      ctx.water.style.height = ctx.F.h * 0.32 + "px";
      const F = ctx.F,
        mx = F.x + F.w / 2,
        my = F.y + F.h * 0.62;
      for (let i = 0; i < 4; i++)
        ctx.after(500 + i * 260, () => {
          A.sfx("bubble");
          if (i % 2 === 0) C.pop(ctx, ctx.scene, mx + U.randf(-F.w * 0.2, F.w * 0.2), my, "가글");
        });
      await ctx.wait(1700);
      if (ctx._session !== sess) return;
      ctx.cup.hidden = true;
      ctx.water.style.height = "0";
      S.clearFoam();
      S.clearSpots();
      C.pop(ctx, ctx.scene, mx, F.y + F.h * 0.45, "퉤!", true);
      A.sfx("whoosh");
      S.burst(mx, my, 40, "drop", 1.2);
      await ctx.wait(700);
      if (ctx._session !== sess) return;
      ctx.happy = true;
      ctx.drawBase();
      for (const t of ctx.TEETH) S.burst(F.x + (t.x + t.w / 2) * F.w, F.y + (t.y + t.h / 2) * F.h, 3, "star", 0.5);
      A.sfx("sparkle");
      await ctx.wait(700);
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const msg = big ? "이제 진짜로 치카치카 해 볼까?" : U.pick(["반짝반짝 깨끗한 이!", "치카치카 최고!", "{부름} 치카치카 박사!"]);
      const ok = await ctx.win({ big, msg });
      if (ok) this.next(ctx);
    };
  },
});
