/* 동물 목욕 — 진흙 묻은 동물 친구를 비누 거품으로 문지르고, 샤워기로 헹구고, 수건으로 보송보송
   - 감각 놀이 중심(쉬움): 문지르는 곳마다 거품이 뽀글뽀글, 샤워기 지나간 곳은 거품이 사라지고 물방울
   - 다 끝나면 친구가 '부르르' 털고 기뻐함
   - 단계: 1 강아지·진흙 조금 → 2 여러 친구·진흙 더 → 3 진흙 많이 (모두 안내 있음)
   공통 도우미: js/games/play/_care.js (KP.care) */
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
    KP.care.css();
    KP.css("bath", `
      .ba-scene{background:repeating-linear-gradient(90deg,transparent 0 54px,rgba(255,255,255,.75) 54px 57px),repeating-linear-gradient(0deg,#d7f3ea 0 54px,rgba(255,255,255,.75) 54px 57px)}
      .ba-pet{position:absolute;z-index:2;pointer-events:none;transition:filter .6s}
      .ba-pet .e{width:100%;height:100%;display:block}
      .ba-pet.wet{filter:saturate(.85) brightness(.97)}
      .ba-pet.shake{animation:ba-shake .14s ease-in-out 8}
      .ba-pet.happy{animation:ba-hop .5s ease-in-out 3 alternate}
      @keyframes ba-shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
      @keyframes ba-hop{to{transform:translateY(-8%)}}
      .ba-tub{position:absolute;left:5%;right:5%;bottom:0;height:22%;z-index:3;pointer-events:none;border-radius:40px 40px 0 0;
        background:linear-gradient(#ffffff,#e9f1f7);box-shadow:inset 0 8px 0 rgba(255,255,255,.9),0 -4px 0 #c9dbe8}
      .ba-tub::before{content:"";position:absolute;left:4%;right:4%;top:calc(clamp(18px,4.5vmin,36px)*-.45);height:clamp(18px,4.5vmin,36px);border-radius:50%;background:linear-gradient(#9fd8ff,#6cbcf2);opacity:.9}
      .ba-chip{position:absolute;left:clamp(8px,1.6vw,18px);top:clamp(8px,1.6vw,18px);z-index:8;width:clamp(64px,11vmin,96px);height:clamp(64px,11vmin,96px);
        border-radius:50%;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;pointer-events:none}
      .ba-chip .e{width:66%;height:66%}
      .ba-chip .kc-towel{width:62%;height:48%}
      .ba-duck{position:absolute;z-index:4;right:9%;bottom:15%;width:clamp(44px,8vmin,80px);height:clamp(44px,8vmin,80px);pointer-events:none;animation:ba-bob 1.6s ease-in-out infinite alternate}
      .ba-duck .e{width:100%;height:100%}
      @keyframes ba-bob{to{transform:translateY(-10%) rotate(6deg)}}
    `);
    const scene = U.el("div", "kc-scene ba-scene");
    scene.innerHTML = '<div class="ba-pet"></div><div class="ba-tub"></div><div class="ba-duck">' + KP.E("🐤") + '</div><div class="ba-chip"></div>';
    ctx.body.appendChild(scene);
    Object.assign(ctx, { scene, pet: U.$(".ba-pet", scene), chip: U.$(".ba-chip", scene), tub: U.$(".ba-tub", scene) });
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F });
    ctx.layout = () => {
      const W = scene.clientWidth,
        H = scene.clientHeight;
      const ps = Math.max(110, Math.min(W * 0.84, H * 0.7));
      ctx.F = { x: (W - ps) / 2, y: Math.min(H * 0.88 - ps, (H - ps) / 2 + ps * 0.1), w: ps, h: ps };
      ctx.tub.style.height = Math.max(H * 0.12, H - (ctx.F.y + ps * 0.84)) + "px";
      ctx.pet.style.cssText += `;left:${ctx.F.x}px;top:${ctx.F.y}px;width:${ps}px;height:${ps}px`;
      ctx.S.radius = 0.1;
      if (ctx.toolHtml) ctx.S.setTool(ctx.toolHtml, ps * 0.32);
    };
    addEventListener("resize", () => ctx._active && ctx.layout());
    ctx.PETS = [
      ["🐕", "강아지"],
      ["🐖", "돼지"],
      ["🐑", "양"],
      ["🐈", "고양이"],
    ];
    ctx.EMS = ctx.PETS.map((p) => p[0]).concat(["🧼", "🚿"]);
    KP.loadE(ctx.EMS);
  },
  async start(ctx) {
    ctx.round = 0;
    ctx.lastPet = null;
    await KP.loadE(ctx.EMS);
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const sess = ctx._session;
    const alive = () => ctx._active && ctx._session === sess;
    const lv = ctx.level;
    const pet = lv === 1 ? ctx.PETS[0] : U.pick(ctx.PETS.filter((p) => p !== ctx.lastPet));
    ctx.lastPet = pet;
    ctx.pet.innerHTML = KP.E(pet[0]);
    ctx.pet.classList.remove("wet", "shake", "happy");
    U.replay(ctx.pet, "pop");
    ctx.toolHtml = KP.E("🧼");
    ctx.layout();
    S.reset();
    S.run();
    // 동물 모양 안쪽만 (욕조에 가려지는 아래쪽은 뺌)
    const body = C.maskPts(pet[0], 10, 0.02).filter((p) => p.y < 0.86);
    const mudN = [4, 6, 8][lv - 1];
    const COLS = ["#8a5a2b", "#7a4e24", "#9b6a3a"];
    S.add(U.sample(body, mudN).map((p) => ({ zone: "a", x: p.x, y: p.y, r: U.randf(0.14, 0.2), need: 1.6, draw: C.drawMud, col: U.pick(COLS) })));
    const F = () => ctx.F;
    const cx = () => F().x + F().w / 2,
      cy = () => F().y + F().h * 0.45;
    const petPt = () => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + cx(), y: r.top + cy() };
    };
    const stage = (tool, toolHtml, mode, say, need) =>
      new Promise((res) => {
        S.reset(true);
        S.add(body.map((p) => ({ zone: tool, x: p.x, y: p.y, need: need })));
        if (tool === "soap") S.add(mudSpots);
        S.mode = mode;
        S.need = 0.8;
        ctx.toolHtml = toolHtml;
        S.setTool(toolHtml, F().w * 0.32);
        ctx.chip.innerHTML = toolHtml;
        U.replay(ctx.chip, "pop");
        ctx.say(say);
        ctx.hint(petPt, say);
        S.on = true;
        S.onZone = (k) => {
          if (k !== tool) return;
          S.on = false;
          ctx.hint(null);
          res();
        };
      });
    const mudSpots = S.spots.slice(); // 진흙은 비누 단계에서 함께 문질러 지움
    (async () => {
      ctx.say("진흙투성이 " + pet[1] + "! 깨끗이 씻겨 줘요 🛁");
      await ctx.wait(1500);
      if (!alive()) return;
      await stage("soap", KP.E("🧼"), { foam: true }, "비누로 거품을 뽀글뽀글 문질러요! 🧼", 1.4);
      if (!alive()) return;
      S.finishZone("a");
      S.clearSpots();
      A.sfx("bubble");
      C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "뽀글뽀글");
      await ctx.wait(700);
      ctx.pet.classList.add("wet");
      await stage("shower", KP.E("🚿"), { unfoam: true, drops: true }, "샤워기로 거품을 씻어요! 🚿", 1.2);
      if (!alive()) return;
      S.clearFoam();
      A.sfx("water");
      C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "쏴아");
      await ctx.wait(700);
      await stage("towel", '<i class="kc-towel"></i>', { sparkle: true }, "수건으로 보송보송 닦아요!", 1.1);
      if (!alive()) return;
      ctx.chip.innerHTML = "";
      ctx.pet.classList.remove("wet");
      ctx.pet.classList.add("shake");
      C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "부르르", true);
      A.sfx("boing");
      for (let i = 0; i < 5; i++) ctx.after(i * 220, () => S.burst(cx() + U.randf(-F().w * 0.3, F().w * 0.3), cy(), 6, "drop", 0.9));
      await ctx.wait(1300);
      if (!alive()) return;
      ctx.pet.classList.remove("shake");
      ctx.pet.classList.add("happy");
      S.burst(cx(), cy(), 30, "star", 1.1);
      A.sfx("sparkle");
      await ctx.wait(900);
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const msg = big ? "{부름} 목욕 최고!" : U.pick(["뽀송뽀송 깨끗해!", "깨끗해졌어요!", "{부름} 고마워요!"]);
      const ok = await ctx.win({ big, msg });
      if (ok) this.next(ctx);
    })();
  },
});
