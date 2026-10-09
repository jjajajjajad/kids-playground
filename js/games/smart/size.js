/* 큰 것 작은 것 — 같은 그림이 크기만 달라요.
   1단계: 2개 중 큰 것/작은 것 / 2단계: 3개 중 제일 큰 것/제일 작은 것
   3단계: 3~4개를 작은 것부터 큰 것까지 차례로 누르기 (누를 때마다 번호와 올라가는 소리) */
"use strict";
KP.game({
  id: "size",
  icon: "⚖️",
  name: "큰 것 작은 것",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("size", `
      .szWrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px 10px 20px}
      .szShelf{--sz:var(--szl);display:flex;align-items:flex-end;justify-content:center;gap:clamp(8px,2vw,26px);padding:16px clamp(10px,2vw,26px) 0;
        border-bottom:14px solid #e6b673;border-radius:0 0 10px 10px;box-shadow:0 8px 0 #c9934d;max-width:100%}
      @media (max-aspect-ratio:1/1){.szShelf{--sz:var(--szp)}}
      .szItem{position:relative;display:flex;align-items:flex-end;justify-content:center;width:calc(var(--sz) + 16px);height:calc(var(--sz) + 22px);
        border-radius:26px 26px 0 0;padding:0 0 4px;background:rgba(255,255,255,.55);transition:background .2s}
      .szItem:active{background:rgba(255,255,255,.9)}
      .szItem .e{display:block;width:calc(var(--sz) * var(--k));height:calc(var(--sz) * var(--k));transform-origin:50% 100%}
      .szItem.right,.szItem[data-done]{background:#d9ffe4}
      .szItem.right .e,.szItem.szYay .e{animation:szYay .6s 2}
      @keyframes szYay{30%{transform:translateY(-22px) scale(1.08)}60%{transform:scale(1.1,.9)}}
      .szItem.wrong{animation:wobble .4s}
      .szNum{position:absolute;top:-14px;left:50%;transform:translateX(-50%);min-width:44px;height:44px;border-radius:50%;background:var(--coral);color:#fff;
        font-size:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:popBig .35s}
    `);
    ctx.wrap = U.el("div", "szWrap");
    ctx.shelf = U.el("div", "szShelf");
    ctx.wrap.appendChild(ctx.shelf);
    ctx.body.appendChild(ctx.wrap);
    ctx.THINGS = [
      ["🐻", "곰"], ["🐘", "코끼리"], ["🍎", "사과"], ["🎈", "풍선"], ["🐟", "물고기"], ["🚗", "자동차"], ["🌻", "해바라기"], ["🐶", "강아지"],
      ["🦒", "기린"], ["⭐", "별"], ["🍉", "수박"], ["🐳", "고래"], ["🚌", "버스"], ["🐢", "거북이"], ["🧸", "곰 인형"], ["🍩", "도넛"],
    ];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    let thing = U.pick(ctx.THINGS);
    if (thing === ctx.last) thing = U.pick(ctx.THINGS);
    ctx.last = thing;
    const [em, name] = thing;
    const n = lv === 1 ? 2 : lv === 2 ? 3 : ctx.round % 2 ? 4 : 3;
    const ks = { 2: [0.48, 1], 3: [0.42, 0.7, 1], 4: [0.34, 0.54, 0.76, 1] }[n];
    let order = U.shuffle(ks.map((k, i) => ({ k, rank: i })));
    if (lv === 3) while (order.every((o, i) => o.rank === i)) order = U.shuffle(order);
    ctx.shelf.style.setProperty("--szl", { 2: "clamp(110px,min(26vw,44vh),280px)", 3: "clamp(90px,min(22vw,40vh),240px)", 4: "clamp(80px,min(19vw,36vh),210px)" }[n]);
    ctx.shelf.style.setProperty("--szp", { 2: "clamp(100px,38vw,170px)", 3: "clamp(80px,26vw,120px)", 4: "clamp(60px,19vw,90px)" }[n]);
    ctx.shelf.innerHTML = "";
    const render = (o) => KP.E(em);

    if (lv < 3) {
      const big = U.rand(2) === 0;
      const word = n === 2 ? (big ? "큰" : "작은") : big ? "제일 큰" : "제일 작은";
      const target = big ? order.find((o) => o.rank === n - 1) : order.find((o) => o.rank === 0);
      const ask = word + " " + U.josa(name, "을/를") + " 찾아요!";
      ctx.say((big ? "🐘 " : "🐭 ") + ask);
      const btns = ctx.choices(ctx.shelf, order, {
        cls: "szItem",
        render,
        right: (o) => o === target,
        wrongMsg: (o) =>
          n === 2 ? "이건 " + (big ? "작은 " : "큰 ") + U.josa(name, "이에요/예요") + ". " + ask : "이것보다 더 " + (big ? "큰 " : "작은 ") + U.josa(name, "이/가") + " 있어요!",
        onRight: async (o, b) => {
          KP.audio.sfx(big ? "boing" : "bubble");
          KP.voice.say(word + " " + name + "! 딩동댕!");
          ctx.score.add();
          ctx.round++;
          await ctx.wait(1100);
          const bg = ctx.round % 5 === 0;
          const ok = await ctx.win({ big: bg, msg: bg ? "크기 박사 형아!" : word + " " + name + "!", quiet: !bg });
          if (ok) self.next(ctx);
        },
      });
      btns.forEach((b, i) => b.style.setProperty("--k", order[i].k));
      ctx.hint(() => btns.find((b) => b.dataset.right), ask);
      return;
    }

    // 3단계: 작은 것부터 차례로
    const say = "작은 것부터 큰 것까지 차례로 눌러요!";
    ctx.say("🐭➡️🐘 " + say);
    let step = 0,
      busy = false;
    const btns = order.map((o, i) => {
      const b = U.el("button", "choice szItem", render(o));
      b.style.setProperty("--k", o.k);
      b.style.setProperty("--i", i);
      b.dataset.seq = o.rank;
      ctx.fast(b, async () => {
        if (busy || b.dataset.done) return;
        if (o.rank === step) {
          b.dataset.done = "1";
          b.appendChild(U.el("span", "szNum", step + 1));
          U.replay(b, "szYay");
          KP.audio.note(KP.audio.SCALE[step * 2], { inst: "marimba", dur: 0.5, vol: 0.32 });
          KP.voice.say(U.NAT[step + 1]);
          step++;
          if (step === n) {
            busy = true;
            ctx.score.add();
            ctx.round++;
            btns.forEach((x, k) => ctx.after(300 + k * 120, () => U.replay(x, "szYay")));
            KP.audio.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.12, when: 0.3 });
            await ctx.wait(1200);
            const bg = ctx.round % 5 === 0;
            const ok = await ctx.win({ big: bg, msg: bg ? "크기 박사 형아!" : "차례차례 잘했어요!" });
            if (ok) self.next(ctx);
          } else hint();
        } else {
          ctx.miss(b, o.rank > step ? "이것보다 더 작은 " + U.josa(name, "이/가") + " 있어요!" : "다시 해 봐요!");
        }
      });
      ctx.shelf.appendChild(b);
      return b;
    });
    const hint = () => ctx.hint(() => btns.find((b) => +b.dataset.seq === step), step === 0 ? "제일 작은 " + name + "부터 눌러요!" : "그다음 큰 걸 눌러요!");
    hint();
  },
});
