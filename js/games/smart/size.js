/* 큰 것 작은 것 — 같은 그림이 크기만 달라요.
   1단계: 3개 중 하나만 크기가 달라요 — 큰 것 하나+작은 것 둘(큰 것 찾기) 또는 그 반대 (크기 두 가지만, 보기 3개라 열쇠 별 가능)
   2단계: 크기가 모두 다른 3개 중 제일 큰 것/제일 작은 것
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
      @media (max-aspect-ratio:1/1){.szShelf{--sz:var(--szp)}
        /* 세로 폰: 칸 폭을 그림 크기에 맞춰(작은 그림 칸은 좁게, 그래도 72px 이상) → 큰 그림을 더 크게 그릴 수 있어 '작은 것'도 점처럼 안 보임 */
        .szShelf .szItem{width:max(72px,calc(var(--sz) * var(--k) + 16px))}}
      /* 좁은 세로 화면의 4개 판: 선반 두 단(2+2) — 한 줄이면 가장 작은 그림이 32px 로 너무 작음 */
      .szShelf.szTwo{flex-direction:column;align-items:center;gap:clamp(18px,3vh,30px);border-bottom:none;box-shadow:none;padding:0;border-radius:0}
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
    const thing = U.pick(ctx.THINGS.filter((t) => t !== ctx.last));
    ctx.last = thing;
    const [em, name] = thing;
    const n = lv === 3 && ctx.round % 2 ? 4 : 3;
    const big = U.rand(2) === 0; // 1·2단계: 큰 것 찾기? 작은 것 찾기?
    // 1단계: 크기 두 가지(하나만 다름) / 2·3단계: 모두 다른 크기
    const ks = lv === 1 ? (big ? [0.46, 0.46, 1] : [0.46, 1, 1]) : { 3: [0.42, 0.7, 1], 4: [0.4, 0.6, 0.8, 1] }[n];
    let order = U.shuffle(ks.map((k, i) => ({ k, rank: i })));
    if (lv === 3) while (order.every((o, i) => o.rank === i)) order = U.shuffle(order);
    ctx.shelf.style.setProperty("--szl", { 3: "clamp(90px,min(22vw,40vh),240px)", 4: "clamp(80px,min(19vw,36vh),210px)" }[n]);
    // 세로: 칸 폭 합(그림 크기 합 + 칸 여백 16px·간격 8px·선반 여백) 이 화면 폭에 맞게
    const two = n === 4 && innerWidth < innerHeight && innerWidth <= 600; // 폰 세로 4개 판: 선반 두 단
    const per = two ? 2 : n; // 한 단의 칸 수
    const kk = (o) => Math.max(o.k, 0.56); // 작은 칸도 최소 84px(.choice) → 작은 그림은 0.56 으로 셈
    const sumK = two ? Math.max(kk(order[0]) + kk(order[1]), kk(order[2]) + kk(order[3])) : ks.reduce((a, b) => a + Math.max(b, 0.56), 0);
    // 세로 화면 상한: 폰은 폭 계산이 먼저 걸리고, 세로 태블릿은 상한까지 크게 (예전 170/150px·32vh → 220/200px·36vh)
    const cap = two ? "min(170px,26vh)" : "min(" + (n === 3 ? 220 : 200) + "px,36vh)";
    ctx.shelf.style.setProperty("--szp", "clamp(64px,calc((100vw - " + (16 * per + 8 * (per - 1) + 68) + "px) / " + sumK.toFixed(2) + ")," + cap + ")");
    ctx.shelf.innerHTML = "";
    ctx.shelf.classList.toggle("szTwo", two);
    const rows = two ? [0, 1].map(() => ctx.shelf.appendChild(U.el("div", "szShelf szSub"))) : null;
    const render = (o) => KP.E(em);

    if (lv < 3) {
      const word = lv === 1 ? (big ? "큰" : "작은") : big ? "제일 큰" : "제일 작은";
      const target = big ? order.find((o) => o.rank === n - 1) : order.find((o) => o.rank === 0);
      const ask = word + " " + U.josa(name, "을/를") + " 찾아요!";
      const nat = (...l) => (KP.voice._natUrls && l.find((t) => KP.voice._natUrls(t))) || l[0]; // 같은 뜻 중 자연 음성(이미 있는 조각)이 있는 문장
      const askV = nat(ask, word + " " + name + " 찾아요!"); // "도넛을" 녹음이 없으면 "큰 도넛 찾아요!"
      ctx.say((big ? "🐘 " : "🐭 ") + ask, askV);
      const btns = ctx.choices(ctx.shelf, order, {
        cls: "szItem",
        render,
        right: (o) => o === target,
        wrongMsg: (o) =>
          lv === 1
            ? nat("이건 " + (big ? "작은 " : "큰 ") + U.josa(name, "이에요/예요") + ". " + ask, "이건 " + (big ? "작은 " : "큰 ") + name + "! " + askV)
            : "이것보다 더 " + (big ? "큰 " : "작은 ") + U.josa(name, "이/가") + " 있어요!",
        onRight: async (o, b) => {
          KP.audio.sfx(big ? "boing" : "bubble");
          KP.voice.say(word + " " + name + "! 딩동댕!");
          ctx.score.add();
          ctx.round++;
          await ctx.wait(1100);
          const bg = ctx.round % 5 === 0;
          const ok = await ctx.win({ big: bg, msg: bg ? "{부름} 크기 박사!" : word + " " + name + "!", quiet: !bg });
          if (ok) self.next(ctx);
        },
      });
      btns.forEach((b, i) => b.style.setProperty("--k", order[i].k));
      ctx.hint(() => btns.find((b) => b.dataset.right), askV);
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
            const ok = await ctx.win({ big: bg, msg: bg ? "{부름} 크기 박사!" : "차례차례 잘했어요!" });
            if (ok) self.next(ctx);
          } else hint();
        } else {
          ctx.miss(b, o.rank > step ? "이것보다 더 작은 " + U.josa(name, "이/가") + " 있어요!" : "다시 해 봐요!");
        }
      });
      (rows ? rows[i < 2 ? 0 : 1] : ctx.shelf).appendChild(b);
      return b;
    });
    const hint = () => ctx.hint(() => btns.find((b) => +b.dataset.seq === step), step === 0 ? first : "그다음 큰 걸 눌러요!");
    // "제일 작은 OO부터" 녹음이 없는 그림은 이미 있는 문장으로
    const first = KP.voice._natUrls && !KP.voice._natUrls("제일 작은 " + name + "부터 눌러요!") ? say : "제일 작은 " + name + "부터 눌러요!";
    hint();
  },
});
