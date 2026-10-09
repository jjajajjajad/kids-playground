/* 짝 맞추기 — 카드를 두 장씩 뒤집어 같은 그림 짝을 찾아요. 짝이 맞으면 반짝이며 이름을 말해요.
   1단계: 2쌍(처음에 모두 보여 줌) / 2단계: 3쌍(잠깐 보여 줌) / 3단계: 4쌍 → 6쌍 번갈아 */
"use strict";
KP.game({
  id: "memory",
  icon: "🃏",
  name: "짝 맞추기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("memory", `
      .mmGrid{flex:1;min-height:0;display:grid;justify-content:center;align-content:center;gap:var(--gap);padding:6px 12px 18px}
      .mmCard{width:var(--cw);height:calc(var(--cw) * 1.22);perspective:900px;padding:0;border-radius:22px;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*50ms)}
      .mmIn{position:relative;display:block;width:100%;height:100%;transition:transform .42s cubic-bezier(.3,1.3,.5,1);transform-style:preserve-3d}
      .mmCard.open .mmIn,.mmCard.done .mmIn{transform:rotateY(180deg)}
      .mmFace{position:absolute;inset:0;border-radius:22px;display:flex;align-items:center;justify-content:center;-webkit-backface-visibility:hidden;backface-visibility:hidden;box-shadow:0 7px 0 rgba(47,58,102,.15)}
      .mmBack{background:repeating-linear-gradient(45deg,#8a63ee 0 14px,#9c7af2 14px 28px);border:5px solid #fff;font-size:calc(var(--cw) * .42)}
      .mmBack .e{opacity:.9;filter:drop-shadow(0 3px 0 rgba(0,0,0,.15))}
      .mmFront{background:#fff;transform:rotateY(180deg);font-size:calc(var(--cw) * .66);border:5px solid #fff}
      .mmCard.done .mmFront{border-color:#7fd99b;background:#effff3;animation:mmShine 1s}
      @keyframes mmShine{0%{box-shadow:0 0 0 0 rgba(255,197,49,.9),0 7px 0 rgba(47,58,102,.15)}50%{box-shadow:0 0 0 14px rgba(255,197,49,.5),0 0 40px 10px rgba(255,220,100,.7)}100%{box-shadow:0 7px 0 rgba(47,58,102,.15)}}
      .mmCard.done{animation:mmHop .5s}
      @keyframes mmHop{40%{transform:translateY(-14px) scale(1.06)}}
      .mmStar{position:absolute;font-size:calc(var(--cw) * .3);pointer-events:none;animation:mmStar .9s forwards;z-index:3}
      @keyframes mmStar{from{transform:translate(0,0) scale(.3);opacity:1}to{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
    `);
    ctx.grid = U.el("div", "mmGrid");
    ctx.body.appendChild(ctx.grid);
    ctx.POOL = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🦁", "사자"], ["🐼", "판다"], ["🐸", "개구리"], ["🚗", "자동차"], ["🍓", "딸기"],
      ["⭐", "별"], ["🌈", "무지개"], ["🎈", "풍선"], ["🐤", "병아리"], ["🦒", "기린"], ["🐘", "코끼리"], ["🍌", "바나나"], ["🚀", "로켓"],
    ];
    ctx.round = 0;
    // 화면 돌리면 카드 크기 다시 맞추기
    addEventListener("resize", () => {
      if (!ctx._active || !ctx.nCards) return;
      this.apply(ctx, this.fit(ctx, ctx.nCards));
    });
  },
  apply(ctx, f) {
    ctx.grid.style.gridTemplateColumns = "repeat(" + f.cols + ", auto)";
    ctx.grid.style.setProperty("--cw", Math.floor(f.cw) + "px");
    ctx.grid.style.setProperty("--gap", Math.floor(f.gap || 12) + "px");
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 카드가 가장 크게 들어가는 칸 수 찾기 */
  fit(ctx, n) {
    const W = ctx.grid.clientWidth - 24,
      H = ctx.grid.clientHeight - 24;
    let best = { cols: 2, cw: 60 };
    for (let cols = 2; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      if (cols * rows - n >= cols) continue;
      const gap = Math.max(10, Math.min(22, W * 0.02));
      const cw = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows / 1.22, 200);
      if (cw > best.cw) best = { cols, cw, gap };
    }
    return best;
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    const pairs = lv === 1 ? 2 : lv === 2 ? 3 : ctx.round % 2 ? 6 : 4;
    const peek = lv === 1 ? 2600 : lv === 2 ? 1400 : 0;
    const pick = U.sample(ctx.POOL, pairs);
    const deck = U.shuffle([...pick, ...pick]);
    ctx.grid.innerHTML = "";
    ctx.nCards = deck.length;
    this.apply(ctx, this.fit(ctx, deck.length));
    let first = null,
      lock = true,
      left = pairs;
    const cards = deck.map(([em, name], i) => {
      const c = U.el("button", "mmCard", '<span class="mmIn"><span class="mmFace mmBack">' + KP.E("🐻") + '</span><span class="mmFace mmFront">' + KP.E(em) + "</span></span>");
      c.style.setProperty("--i", i);
      c.dataset.k = em;
      ctx.fast(c, () => flip(c, em, name));
      ctx.grid.appendChild(c);
      return c;
    });
    if (peek) {
      ctx.say("🃏 그림을 잘 봐요! 어디에 있는지 기억해요!");
      ctx.after(500, () => cards.forEach((c) => c.classList.add("open")));
      ctx.after(500 + peek, () => {
        cards.forEach((c) => c.classList.remove("open"));
        KP.audio.sfx("whoosh");
        lock = false;
        ctx.say("🃏 카드를 두 장 뒤집어서 같은 그림 짝을 찾아요!");
        hint();
      });
    } else {
      lock = false;
      ctx.say("🃏 카드를 두 장 뒤집어서 같은 그림 짝을 찾아요!");
    }
    const hint = () =>
      ctx.hint(() => (first ? cards.find((c) => c !== first && c.dataset.k === first.dataset.k) : cards.find((c) => !c.classList.contains("done"))), first ? "같은 그림을 찾아요!" : "카드를 눌러 뒤집어 봐요!");
    if (!peek) hint();

    const sparkle = (c) => {
      for (let i = 0; i < 5; i++) {
        const s = U.el("span", "mmStar", KP.E("⭐"));
        const a = (i / 5) * Math.PI * 2;
        s.style.cssText = "left:40%;top:40%;--dx:" + Math.cos(a) * 70 + "px;--dy:" + Math.sin(a) * 70 + "px";
        c.appendChild(s);
        ctx.after(1000, () => s.remove());
      }
    };
    function flip(c, em, name) {
      if (lock || c.classList.contains("open") || c.classList.contains("done")) return;
      c.classList.add("open");
      KP.audio.sfx("tap2");
      if (!first) {
        first = c;
        KP.voice.say(name);
        hint();
        return;
      }
      const a = first;
      first = null;
      if (a.dataset.k === c.dataset.k) {
        lock = true;
        ctx.after(380, () => {
          [a, c].forEach((x) => {
            x.classList.remove("open");
            x.classList.add("done");
            x.dataset.done = "1";
            sparkle(x);
          });
          KP.audio.sfx("sparkle");
          KP.audio.sfx("good");
          KP.voice.say(name + " 짝꿍! 찾았다!");
          left--;
          lock = false;
          if (left === 0) finish();
          else hint();
        });
      } else {
        lock = true;
        KP.voice.say(name);
        KP.audio.note("E4", { inst: "soft", dur: 0.25, vol: 0.14, when: 0.15 });
        ctx.after(1100, () => {
          a.classList.remove("open");
          c.classList.remove("open");
          lock = false;
          hint();
        });
      }
    }
    const finish = async () => {
      lock = true;
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1000);
      cards.forEach((c, i) => ctx.after(i * 60, () => U.replay(c, "jump")));
      await ctx.wait(400);
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "기억력 대장 형아!" : "짝을 다 찾았어요!" });
      if (ok) self.next(ctx);
    };
  },
});
