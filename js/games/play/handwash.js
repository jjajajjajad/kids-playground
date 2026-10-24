/* 뽀득뽀득 손 씻기 — 물 틀기 → 비누 → 손바닥·손등·손가락 사이 문지르기(거품) → 헹구기 → 수건
   - 아래 도구 줄(물·비누·거품·수건)을 눌러 순서대로, 문지르기는 손 그림을 직접 싹싹 문지름
   - 단계: 1 순서 안내(할 도구가 반짝) → 2 '다음엔 뭘 할까요?' 순서 고르기 → 3 놀다 온 흙 묻은 손을 혼자서
   공통 도우미: js/games/play/_care.js (KP.care) */
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
    KP.care.css();
    KP.css("handwash", `
      .hw-scene{background:repeating-linear-gradient(90deg,transparent 0 58px,rgba(255,255,255,.7) 58px 61px),repeating-linear-gradient(0deg,#fff1d9 0 58px,rgba(255,255,255,.7) 58px 61px)}
      .hw-sink{position:absolute;left:8%;right:8%;bottom:-9%;height:30%;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#d8eefc 0 45%,#ffffff 47%);box-shadow:0 -6px 0 #e6edf3 inset;z-index:1}
      .hw-tap{position:absolute;left:50%;top:0;z-index:3;transform:translateX(-50%);pointer-events:none}
      .hw-pipe{position:absolute;left:50%;top:0;width:38%;height:62%;margin-left:-19%;border-radius:0 0 12px 12px;background:linear-gradient(90deg,#a9b6c4,#e9eff5 45%,#9aa7b5)}
      .hw-spout{position:absolute;left:50%;bottom:0;width:100%;height:42%;margin-left:-50%;border-radius:40% 40% 18% 18%;background:linear-gradient(#e9eff5,#aab7c5)}
      .hw-spout::after{content:"";position:absolute;left:50%;bottom:-12%;width:30%;height:24%;margin-left:-15%;border-radius:0 0 8px 8px;background:#8794a3}
      .hw-stream{position:absolute;left:50%;z-index:2;pointer-events:none;border-radius:0 0 40% 40%;opacity:0;transition:opacity .25s;
        background:repeating-linear-gradient(180deg,rgba(130,200,255,.75) 0 14px,rgba(190,230,255,.75) 14px 26px);animation:hw-flow .35s linear infinite}
      .hw-stream.on{opacity:1}
      @keyframes hw-flow{to{background-position:0 26px}}
      .hw-hand{position:absolute;z-index:4;pointer-events:none;transition:filter .5s}
      .hw-hand .e{width:100%;height:100%;display:block}
      .hw-hand.wet{filter:saturate(1.15) brightness(1.04) drop-shadow(0 0 10px rgba(120,200,255,.8))}
      .hw-fall{position:absolute;z-index:6;pointer-events:none;width:var(--s);height:var(--s);margin:calc(var(--s)*-.5) 0 0 calc(var(--s)*-.5);animation:hw-fall .7s ease-in forwards}
      .hw-fall .e,.hw-fall .kc-towel{width:100%;height:100%;display:block}
      @keyframes hw-fall{from{transform:translateY(-140%) rotate(-20deg);opacity:0}30%{opacity:1}to{transform:translateY(0) rotate(0)}}
      .hw-towel{position:absolute;z-index:6;pointer-events:none;border-radius:14%;transition:transform .5s ease,opacity .4s;transform:translateY(-120%);opacity:0}
      .hw-towel.on{transform:translateY(0);opacity:1}
      .hw-towel.pat{animation:hw-pat .35s ease-in-out 3}
      @keyframes hw-pat{50%{transform:translateY(6%) scale(1.03,.96)}}
    `);
    const scene = U.el("div", "kc-scene hw-scene");
    scene.innerHTML =
      '<div class="hw-sink"></div><div class="hw-tap"><div class="hw-pipe"></div><div class="hw-spout"></div></div><div class="hw-stream"></div><div class="hw-hand"></div><div class="hw-towel kc-towel"></div>';
    const bar = U.el("div", "kc-bar");
    ctx.body.append(scene, bar);
    ctx.body.classList.add("kc-stage"); // 폰 가로: 도구 줄을 오른쪽 세로로
    const $ = (s) => U.$(s, scene);
    Object.assign(ctx, { scene, bar, hand: $(".hw-hand"), faucet: $(".hw-tap"), stream: $(".hw-stream"), towel: $(".hw-towel") });
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F });
    ctx.layout = () => {
      const W = scene.clientWidth,
        H = scene.clientHeight;
      const hs = Math.max(100, Math.min(W * 0.78, H * 0.56));
      const cy = H * 0.6;
      ctx.F = { x: (W - hs) / 2, y: cy - hs / 2, w: hs, h: hs };
      const st = (e, x, y, w, h) => (e.style.cssText += `;left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
      st(ctx.hand, ctx.F.x, ctx.F.y, hs, hs);
      st(ctx.towel, ctx.F.x + hs * 0.08, ctx.F.y + hs * 0.08, hs * 0.84, hs * 0.84);
      const tapH = Math.max(40, ctx.F.y - hs * 0.04),
        tapW = Math.min(hs * 0.42, tapH * 1.3);
      ctx.faucet.style.width = tapW + "px";
      ctx.faucet.style.height = tapH + "px";
      const sw = hs * 0.13;
      ctx.stream.style.cssText += `;top:${tapH}px;width:${sw}px;margin-left:${-sw / 2}px;height:${H - tapH}px`;
      ctx.S.radius = 0.1;
      ctx.S.setTool("", 0);
    };
    addEventListener("resize", () => ctx._active && ctx.layout());
    ctx.EMS = ["🤲", "🫳", "🖐️", "🚰", "🧼", "🫧"];
    KP.loadE(ctx.EMS);
  },
  async start(ctx) {
    ctx.round = 0;
    await KP.loadE(ctx.EMS);
    this.next(ctx);
  },
  /** 화면 좌표: 손 가운데 (손가락 힌트용) */
  handPt(ctx) {
    const r = ctx.scene.getBoundingClientRect(),
      F = ctx.F;
    return { x: r.left + F.x + F.w / 2, y: r.top + F.y + F.h / 2 };
  },
  setPose(ctx, em, mud) {
    const U = KP.u,
      S = ctx.S;
    ctx.hand.innerHTML = KP.E(em);
    U.replay(ctx.hand, "pop");
    S.clearSpots();
    if (mud) {
      const pts = U.sample(KP.care.maskPts(em, 10, 0.12), mud);
      S.add(pts.map((p) => ({ zone: "mud", x: p.x, y: p.y, r: 0.13, need: 2.4, draw: KP.care.drawMud })));
    }
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const sess = ctx._session;
    const alive = () => ctx._active && ctx._session === sess;
    const lv = ctx.level;
    const mud = lv === 3 ? 5 : 0;
    ctx.layout();
    S.reset();
    S.run();
    ctx.hand.classList.remove("wet");
    ctx.stream.classList.remove("on");
    ctx.towel.classList.remove("on", "pat");
    this.setPose(ctx, "🤲", mud);
    const F = () => ctx.F;
    const cx = () => F().x + F().w / 2,
      cy = () => F().y + F().h / 2;
    const water = async (ms, rinse) => {
      ctx.stream.classList.add("on");
      ctx.hand.classList.add("wet");
      C.pop(ctx, ctx.scene, cx() + F().w * 0.3, F().y, rinse ? "쏴아" : "졸졸");
      if (rinse) {
        S.clearFoam();
        S.clearSpots();
      }
      for (let i = 0; i < ms / 300; i++)
        ctx.after(i * 300, () => {
          A.sfx("water");
          S.burst(cx() + U.randf(-F().w * 0.2, F().w * 0.2), cy(), 4, "drop", 0.6);
        });
      await ctx.wait(ms);
      ctx.stream.classList.remove("on");
    };
    const fall = async (html) => {
      const s = F().w * 0.28;
      const e = U.el("div", "hw-fall", html);
      e.style.cssText = `--s:${s}px;left:${cx()}px;top:${cy() - F().w * 0.1}px`;
      ctx.scene.appendChild(e);
      await ctx.wait(700);
      A.sfx("pop");
      for (let i = 0; i < 12; i++) S.bubble(0.5 + U.randf(-0.2, 0.2), 0.45 + U.randf(-0.15, 0.15), U.randf(0.02, 0.05));
      e.remove();
      C.pop(ctx, ctx.scene, cx(), cy() - F().w * 0.2, "쏙");
    };
    const POSES = [
      ["🤲", "손바닥을 싹싹 문질러요!"],
      ["🫳", "손등도 싹싹 문질러요!"],
      ["🖐️", "손가락 사이도 쏙쏙 문질러요!"],
    ];
    const rubAll = async () => {
      for (let i = 0; i < POSES.length; i++) {
        if (!alive()) return;
        const [em, say] = POSES[i];
        // 첫 자세(손바닥)는 처음 보여 준 흙을 그대로, 다음 자세부터는 새 그림에 흙을 다시 묻힘
        const keep = i === 0 ? S.spots.filter((s) => s.zone === "mud" && s.life > 0) : null;
        S.reset(true);
        if (keep) S.add(keep);
        else this.setPose(ctx, em, mud);
        S.add(C.maskPts(em, 9, 0.04).map((p) => ({ zone: "rub", x: p.x, y: p.y, need: 1.8 })));
        S.mode = { foam: true };
        S.need = 0.8;
        S.on = true;
        S.setTool("", 0);
        ctx.say(say + " 🫧");
        ctx.hint(() => this.handPt(ctx), say);
        await new Promise((res) => {
          S.onZone = (k) => {
            if (k === "rub") res();
          };
        });
        if (!alive()) return;
        S.on = false;
        S.finishZone("mud");
        S.burst(cx(), cy(), 14, "star", 0.8);
        A.sfx("sparkle");
        C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.15, "뽀득뽀득");
        ctx.hint(null);
        await ctx.wait(800);
      }
    };
    const TOOLS = [
      { id: "water", html: KP.E("🚰"), label: "물" },
      { id: "soap", html: KP.E("🧼"), label: "비누" },
      { id: "rub", html: KP.E("🫧"), label: "거품" },
      { id: "towel", html: '<i class="kc-towel"></i>', label: "수건" },
    ];
    const steps = [
      {
        tool: "water",
        say: "수도꼭지를 눌러 물을 틀어요!",
        act: async () => {
          await water(1300);
        },
      },
      {
        tool: "soap",
        say: "비누를 눌러요!",
        wrong: "음, 그 전에 할 일이 있어요!",
        act: async () => {
          await fall(KP.E("🧼"));
          await ctx.wait(300);
        },
      },
      { tool: "rub", say: "거품을 싹싹 문질러요!", act: rubAll },
      {
        tool: "water",
        say: "물로 헹궈요!",
        act: async () => {
          await water(1800, true);
          KP.voice.say("깨끗해졌어요!");
          await ctx.wait(300);
        },
      },
      {
        tool: "towel",
        say: "수건으로 닦아요!",
        act: async () => {
          ctx.towel.classList.add("on");
          A.sfx("slide");
          await ctx.wait(550);
          ctx.towel.classList.add("pat");
          C.pop(ctx, ctx.scene, cx(), F().y, "보송보송");
          for (let i = 0; i < 3; i++) ctx.after(i * 350, () => A.sfx("tap"));
          await ctx.wait(1100);
          ctx.towel.classList.remove("on", "pat");
          ctx.hand.classList.remove("wet");
          await ctx.wait(400);
          S.burst(cx(), cy(), 24, "star", 1);
          A.sfx("sparkle");
          await ctx.wait(600);
        },
      },
    ];
    const ask = lv === 1 ? null : lv === 2 ? "손을 씻어요! 먼저 뭘 할까요?" : "밖에서 놀고 왔어요! 손에 흙이 묻었네. 혼자서 씻어 볼까요?";
    const go = () =>
      C.routine(ctx, { bar: ctx.bar, tools: TOOLS, steps, mode: lv, ask }).then(async (ok) => {
        if (!ok || !alive()) return;
        ctx.score.add();
        ctx.round++;
        const big = ctx.round % 4 === 0;
        const msg = big ? "이제 진짜로 손 씻어 볼까?" : U.pick(["뽀득뽀득 깨끗한 손!", "{부름} 손 씻기 박사!", "와, 깨끗해졌어요!"]);
        const r = await ctx.win({ big, msg });
        if (r) this.next(ctx);
      });
    if (lv === 1) {
      ctx.say("손을 깨끗이 씻어 볼까요? 🧼");
      ctx.bar.innerHTML = "";
      ctx.after(1600, () => alive() && go());
    } else go();
  },
});
