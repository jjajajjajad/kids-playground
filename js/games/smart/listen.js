/* 소리 듣고 찾기 — 울음소리를 듣고 어떤 동물인지 골라요. 🔊 버튼으로 다시 듣기.
   1단계: 보기 2개(사는 곳이 다른 동물) / 2단계: 3개 / 3단계: 4개(같은 곳에 사는 동물끼리 섞임)
   동물 목록·울음소리는 animals.js 의 KP.smartAnimals 사용 */
"use strict";
KP.game({
  id: "listen",
  icon: "👂",
  name: "소리 듣고 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("listen", `
      .lsTop{flex:0 0 auto;display:flex;justify-content:center;padding:clamp(4px,1.6vh,18px) 0 4px}
      .lsSpk{position:relative;width:clamp(110px,min(18vw,20vh),170px);height:clamp(110px,min(18vw,20vh),170px);border-radius:50%;
        background:radial-gradient(circle at 35% 30%,#fff7d1,var(--sun));box-shadow:0 8px 0 #d9a000;font-size:clamp(56px,min(9vw,10vh),88px);
        display:flex;align-items:center;justify-content:center;line-height:1}
      .lsSpk:active{transform:translateY(5px);box-shadow:0 3px 0 #d9a000}
      .lsSpk small{position:absolute;bottom:-34px;left:50%;transform:translateX(-50%);font-size:clamp(16px,2vw,20px);color:var(--ink2);white-space:nowrap}
      .lsSpk::before,.lsSpk::after{content:"";position:absolute;inset:0;border-radius:50%;border:5px solid var(--sun);opacity:0}
      .lsSpk.on::before{animation:lsRing 1s ease-out 2}
      .lsSpk.on::after{animation:lsRing 1s .35s ease-out 2}
      .lsSpk.on .e{animation:wig .3s 4}
      @keyframes lsRing{from{transform:scale(1);opacity:.9}to{transform:scale(1.7);opacity:0}}
      .lsGrid{--sz:var(--szl);flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--cl),auto);justify-content:center;align-content:center;gap:clamp(14px,2.6vw,30px);padding:30px 12px 20px}
      @media (max-aspect-ratio:1/1){.lsGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .lsCh{flex-direction:column;gap:4px;border-radius:30px;padding:clamp(10px,1.4vw,16px) clamp(12px,1.6vw,20px) 8px}
      .lsCh .e{font-size:var(--sz)}
      .lsCh span{font-size:clamp(18px,2.4vw,24px)}
      .lsYay .e{animation:jumpA .5s 3}
      .lsBub{position:absolute;top:-16px;left:50%;transform:translateX(-50%);background:var(--coral);color:#fff;font-size:clamp(18px,2.4vw,24px);padding:4px 12px;border-radius:999px;white-space:nowrap;animation:popIn .3s}
    `);
    ctx.top = U.el("div", "lsTop");
    ctx.spk = U.btn(KP.E("🔊") + "<small>다시 듣기</small>", "lsSpk");
    ctx.top.appendChild(ctx.spk);
    ctx.grid = U.el("div", "lsGrid");
    ctx.body.append(ctx.top, ctx.grid);
    ctx.tap(ctx.spk, () => this.play(ctx));
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  play(ctx) {
    const U = KP.u;
    const a = ctx.target;
    if (!a) return;
    ctx.spk.classList.remove("on");
    void ctx.spk.offsetWidth;
    ctx.spk.classList.add("on");
    KP.smartAnimals.cry(a[4]);
    ctx.after(850, () => KP.voice.say(a[3] + " " + a[3]));
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    const pool = KP.smartAnimals.LIST.filter((a) => a[5]);
    const n = lv + 1;
    let target = U.pick(pool.filter((a) => a !== ctx.target));
    let others;
    if (lv === 1) {
      others = U.sample(pool.filter((a) => a[2] !== target[2]), 1);
    } else if (lv === 2) {
      others = U.sample(pool.filter((a) => a !== target), 2);
    } else {
      const same = U.shuffle(pool.filter((a) => a !== target && a[2] === target[2]));
      others = same.slice(0, 2).concat(U.sample(pool.filter((a) => a !== target && !same.slice(0, 2).includes(a)), 1));
    }
    ctx.target = target;
    const list = U.shuffle([target, ...others]);
    ctx.grid.style.setProperty("--cl", list.length);
    ctx.grid.style.setProperty("--cp", list.length === 3 ? 1 : 2);
    ctx.grid.style.setProperty("--szl", ["", "", "clamp(80px,min(16vw,26vh),170px)", "clamp(80px,min(14vw,24vh),150px)", "clamp(70px,min(12vw,20vh),130px)"][list.length]);
    ctx.grid.style.setProperty("--szp", ["", "", "clamp(80px,min(34vw,17vh),150px)", "clamp(70px,min(30vw,11vh),130px)", "clamp(70px,min(28vw,14vh),130px)"][list.length]);
    const ask = "누구 소리일까요? 잘 들어 봐요!";
    ctx.say("👂 " + ask, false);
    let played = false;
    const go = () => {
      if (played || ctx.target !== target) return;
      played = true;
      self.play(ctx);
    };
    KP.voice.say(ask, { onend: () => ctx.after(150, go) });
    ctx.after(2600, go);

    const btns = ctx.choices(ctx.grid, list, {
      cls: "lsCh",
      render: (a) => KP.E(a[0]) + "<span>" + a[1] + "</span>",
      right: (a) => a === target,
      wrongMsg: (a) => "이건 " + U.josa(a[1], "이에요/예요") + ". " + U.josa(a[1], "은/는") + " " + a[3] + " 다시 들어 봐요!",
      onRight: async (a, b) => {
        b.classList.add("lsYay");
        b.appendChild(U.el("span", "lsBub", a[3].split("!")[0] + "!"));
        KP.smartAnimals.cry(a[4]);
        ctx.after(500, () => KP.voice.say(a[1] + "! " + a[3]));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1700);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "소리 박사 형아!" : a[1] + "!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    // 틀리면 설명 뒤에 정답 소리를 다시 들려주기
    let again = 0;
    btns.forEach((b) => {
      if (!b.dataset.right)
        b.addEventListener("click", () => {
          if (again) ctx.cancel(again);
          again = ctx.after(3200, () => ctx.target === target && self.play(ctx));
        });
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), "소리를 듣고 동물을 눌러 봐요!");
  },
});
