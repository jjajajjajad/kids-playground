/* 모양 끼우기 — 모양 조각을 끌어다 같은 모양 구멍에 쏙!
   1단계: 3개 / 2단계: 4개 / 3단계: 5개 (구멍 위치도 섞임) */
"use strict";
KP.game({
  id: "sorter",
  icon: "🔷",
  name: "모양 끼우기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sorter", `
      .srtBoard{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:6px 12px 14px}
      .srtBox{display:flex;gap:clamp(10px,2.4vw,26px);flex-wrap:wrap;justify-content:center;padding:clamp(14px,2.4vw,26px);border-radius:32px;background:linear-gradient(180deg,#ffcf7a,#f4a944);box-shadow:0 10px 0 #c97f22, inset 0 4px 0 rgba(255,255,255,.5)}
      .srtHole{width:clamp(84px,13vw,140px);height:clamp(84px,13vw,140px);border-radius:24px;background:rgba(120,60,0,.18);box-shadow:inset 0 6px 10px rgba(80,40,0,.35);display:flex;align-items:center;justify-content:center;font-size:clamp(60px,9.5vw,104px);position:relative}
      .srtHole .ghost{filter:brightness(0) opacity(.35)}
      .srtHole.filled .ghost{display:none}
      .srtTray{display:flex;gap:clamp(12px,2.6vw,30px);flex-wrap:wrap;justify-content:center;min-height:clamp(96px,14vw,150px);align-items:center}
      .srtPiece{font-size:clamp(60px,9.5vw,104px);line-height:1;padding:8px;filter:drop-shadow(0 6px 0 rgba(0,0,0,.15))}
      .srtHole .srtPiece{position:absolute;padding:0;filter:none;animation:popIn .3s}
    `);
    ctx.SHAPES = [
      ["🔴", "동그라미"], ["🟦", "네모"], ["🔺", "세모"], ["⭐", "별"], ["❤️", "하트"], ["🌙", "달"], ["🔶", "마름모"], ["🟩", "초록 네모"], ["🟣", "보라 동그라미"],
    ];
    ctx.boardEl = U.el("div", "srtBoard");
    ctx.box = U.el("div", "srtBox");
    ctx.tray = U.el("div", "srtTray");
    ctx.boardEl.append(ctx.box, ctx.tray);
    ctx.body.appendChild(ctx.boardEl);
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u;
    const n = [3, 4, 5][ctx.level - 1];
    // 같은 계열(네모 두 개 등)은 3단계에서만 같이 나오게
    let pool = ctx.level < 3 ? ctx.SHAPES.slice(0, 7) : ctx.SHAPES;
    const pick = U.sample(pool, n);
    ctx.say("모양 조각을 끌어서 같은 모양 구멍에 쏙 넣어 봐요!");
    ctx.box.innerHTML = "";
    ctx.tray.innerHTML = "";
    const holes = U.shuffle([...pick]).map(([em, name]) => {
      const h = U.el("div", "srtHole", '<span class="ghost">' + KP.E(em) + "</span>");
      h.dataset.k = em;
      ctx.box.appendChild(h);
      return h;
    });
    let left = n;
    const pieces = U.shuffle([...pick]).map(([em, name], i) => {
      const p = U.el("div", "srtPiece item", KP.E(em));
      p.style.setProperty("--i", i);
      p.dataset.k = em;
      ctx.tray.appendChild(p);
      const d = KP.drag(p, {
        targets: () => holes.filter((h) => !h.classList.contains("filled")),
        accept: (t) => t.dataset.k === em,
        onReject: (t) => ctx.miss(t, "이 모양이 아니에요. 다른 구멍을 찾아봐요!"),
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          p.style.transform = "";
          t.appendChild(p);
          t.classList.add("filled");
          KP.audio.sfx("snap");
          KP.voice.say(name + "!");
          left--;
          if (left === 0) done();
          else hint();
        },
      });
      return p;
    });
    const hint = () => {
      const p = pieces.find((x) => !x.parentElement.classList.contains("srtHole"));
      ctx.hint(() => p, "모양을 끌어서 같은 구멍에 넣어요!");
    };
    hint();
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      const ok = await ctx.win({ big: ctx.round % 4 === 0, msg: ctx.round % 4 === 0 ? "모양 박사 형아!" : "다 끼웠다!" });
      if (ok) this.next(ctx);
    };
  },
});
