/* 숫자 세기 — 하나씩 눌러 세고, 알맞은 숫자 고르기
   1단계: 1~3개 / 2단계: 1~5개 / 3단계: 3~10개(보기 4개) */
"use strict";
KP.game({
  id: "count",
  icon: "🔢",
  name: "숫자 세기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("count", `
      .countTile{position:relative;background:#fff;border-radius:26px;padding:12px;box-shadow:0 6px 0 rgba(47,58,102,.12);font-size:clamp(46px,7.5vw,84px);line-height:1}
      .countTile[data-n]{background:#fff8d6;box-shadow:0 6px 0 #f1cf5b}
      .countBadge{position:absolute;top:-10px;right:-10px;min-width:38px;height:38px;border-radius:50%;background:var(--coral);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:popBig .4s}
    `);
    ctx.items = U.el("div", "qStage countItems");
    ctx.ans = U.el("div", "qAns");
    ctx.body.append(ctx.items, ctx.ans);
    ctx.THINGS = [
      ["🍎", "사과"], ["🍌", "바나나"], ["🐟", "물고기"], ["🚗", "자동차"], ["🌼", "꽃"], ["🍪", "쿠키"],
      ["🐥", "병아리"], ["⚽", "공"], ["🦆", "오리"], ["🍓", "딸기"], ["🦋", "나비"], ["⭐", "별"],
    ];
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
    const [lo, hi, nChoice] = lv === 1 ? [1, 3, 3] : lv === 2 ? [1, 5, 3] : [3, 10, 4];
    const answer = lo + U.rand(hi - lo + 1);
    const [em, name] = U.pick(ctx.THINGS);
    let counted = 0,
      busy = false;

    ctx.say(U.josa(name, "이/가") + " 몇 개일까요? 하나씩 눌러서 세어 봐요!");
    ctx.items.innerHTML = "";
    ctx.items.style.maxWidth = answer > 5 ? "900px" : "760px";
    ctx.items.style.margin = "0 auto";
    const tiles = [];
    for (let i = 0; i < answer; i++) {
      const t = U.el("button", "item countTile", KP.E(em));
      t.style.setProperty("--i", i);
      t.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (t.dataset.n || busy) return;
        counted++;
        t.dataset.n = counted;
        t.appendChild(U.el("span", "countBadge", counted));
        U.replay(t, "jump");
        A.note(A.SCALE[Math.min(counted - 1, A.SCALE.length - 1)], { inst: "marimba", dur: 0.4, vol: 0.3 });
        KP.voice.say(U.NAT[counted] || String(counted));
        if (counted === answer) ctx.after(700, () => KP.voice.say("모두 몇 개예요?"));
        hint();
      });
      tiles.push(t);
      ctx.items.appendChild(t);
    }

    // 보기
    const opts = new Set([answer]);
    while (opts.size < nChoice) {
      const v = U.clamp(answer + U.pick([-2, -1, 1, 2, 3]), 1, Math.max(hi, 5));
      opts.add(v);
    }
    ctx.ans.innerHTML = "";
    const btns = U.shuffle([...opts]).map((n, i) => {
      const b = U.el("button", "choice num", String(n));
      b.style.setProperty("--i", i);
      b.dataset.v = n;
      b.addEventListener("click", async () => {
        if (busy) return;
        KP.audio.unlock();
        if (n === answer) {
          busy = true;
          b.classList.add("right");
          ctx.score.add();
          tiles.forEach((t, k) => ctx.after(k * 70, () => U.replay(t, "jump")));
          ctx.round++;
          const big = ctx.round % 5 === 0;
          const CNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
          const ok = await ctx.win({ big, msg: big ? "숫자 박사 형아!" : (CNT[answer] || answer) + " 개! 딩동댕!" });
          if (ok) this.next(ctx);
        } else {
          ctx.miss(b, counted < answer ? "하나씩 눌러서 같이 세어 볼까?" : "다시 세어 볼까요?");
        }
      });
      ctx.ans.appendChild(b);
      return b;
    });

    const hint = () =>
      ctx.hint(() => tiles.find((t) => !t.dataset.n) || btns.find((b) => +b.dataset.v === answer), counted < answer ? "하나씩 눌러서 세어 봐요!" : "몇 개였지? 숫자를 눌러요!");
    hint();
  },
});
