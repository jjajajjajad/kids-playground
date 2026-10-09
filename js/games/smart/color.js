/* 색깔 찾기 — 말한 색을 찾아 눌러요. 맞히면 그 색 물감이 화면에 퍼져요.
   1단계: 웃는 색 동그라미 3개(빨강·노랑·파랑·초록 중) / 2단계: 6개(10색 중)
   3단계: "파란 하트" 처럼 색+사물 (같은 사물 다른 색, 같은 색 다른 사물이 섞여 나옴) */
"use strict";
KP.game({
  id: "color",
  icon: "🌈",
  name: "색깔 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("color", `
      .clrFx{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
      .clrSplash{position:absolute;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:46% 54% 42% 58% / 55% 45% 55% 45%;background:var(--c);opacity:.5;animation:clrSpread 1.3s cubic-bezier(.2,.8,.3,1) forwards}
      @keyframes clrSpread{0%{transform:scale(.2) rotate(0);opacity:.75}70%{opacity:.4}100%{transform:scale(34) rotate(40deg);opacity:0}}
      .clrDrop{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:var(--c);box-shadow:inset -4px -5px 0 rgba(0,0,0,.12);animation:clrDrop .9s cubic-bezier(.2,.9,.4,1) forwards}
      @keyframes clrDrop{0%{transform:translate(0,0) scale(.4)}60%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
      .clrGrid{--sz:var(--szl);flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--cl),auto);justify-content:center;align-content:center;gap:clamp(14px,3vw,34px);padding:8px 14px 22px;position:relative;z-index:1}
      @media (max-aspect-ratio:1/1){.clrGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .clrBtn{min-width:0;min-height:0;padding:clamp(8px,1.2vw,14px);border-radius:50%;background:#fff}
      .clrBall{position:relative;display:block;width:var(--sz);height:var(--sz);border-radius:50%;background:var(--c);
        box-shadow:inset -10px -14px 0 rgba(0,0,0,.13), inset 10px 12px 0 rgba(255,255,255,.35)}
      .clrBall.light{box-shadow:inset -10px -14px 0 rgba(0,0,0,.08), inset 0 0 0 3px #e6e9f3}
      .clrEye{position:absolute;top:36%;width:13%;height:13%;border-radius:50%;background:#2f3a66}
      .clrEye::after{content:"";position:absolute;left:22%;top:18%;width:34%;height:34%;border-radius:50%;background:#fff}
      .clrEye.l{left:29%}.clrEye.r{right:29%}
      .clrMouth{position:absolute;left:39%;width:22%;top:56%;height:11%;border:max(3px,.35vmin) solid #2f3a66;border-top:none;border-radius:0 0 999px 999px}
      .dark .clrEye{background:#fff}.dark .clrEye::after{background:#2f3a66}.dark .clrMouth{border-color:#fff}
      .clrCheek{position:absolute;top:52%;width:12%;height:7%;border-radius:50%;background:rgba(255,120,150,.45)}
      .clrCheek.l{left:17%}.clrCheek.r{right:17%}
      .clrHappy .clrMouth{height:17%;background:#ff7a8a}
      .clrHappy .clrEye{height:5%;top:40%;border-radius:999px 999px 0 0}
      .clrHappy .clrEye::after{display:none}
      .clrHappy{animation:clrHop .55s 2}
      @keyframes clrHop{30%{transform:translateY(-26px) rotate(-8deg) scale(1.08)}60%{transform:translateY(0) scale(1.08,.92)}}
      .clrObj{font-size:var(--sz);border-radius:30px;padding:clamp(10px,1.4vw,16px)}
    `);
    ctx.fx = U.el("div", "clrFx");
    ctx.grid = U.el("div", "clrGrid");
    ctx.body.append(ctx.fx, ctx.grid);
    ctx.COLORS = [
      { k: "red", n: "빨간색", a: "빨간", c: "#ff4d4d" },
      { k: "yellow", n: "노란색", a: "노란", c: "#ffd23f" },
      { k: "blue", n: "파란색", a: "파란", c: "#3b82f6" },
      { k: "green", n: "초록색", a: "초록", c: "#34c759" },
      { k: "orange", n: "주황색", a: "주황", c: "#ff9500" },
      { k: "purple", n: "보라색", a: "보라", c: "#a259ff" },
      { k: "pink", n: "분홍색", a: "분홍", c: "#ff7eb9" },
      { k: "brown", n: "갈색", a: "갈색", c: "#a0673f", dark: 1 },
      { k: "black", n: "검은색", a: "까만", c: "#333a4d", dark: 1 },
      { k: "white", n: "하얀색", a: "하얀", c: "#ffffff", light: 1 },
    ];
    ctx.C = Object.fromEntries(ctx.COLORS.map((c) => [c.k, c]));
    // 3단계: [그림, 색, 이름, 종류]
    ctx.OBJ = [
      ["❤️", "red", "하트", "heart"], ["🧡", "orange", "하트", "heart"], ["💛", "yellow", "하트", "heart"], ["💚", "green", "하트", "heart"],
      ["💙", "blue", "하트", "heart"], ["💜", "purple", "하트", "heart"], ["🩷", "pink", "하트", "heart"], ["🤎", "brown", "하트", "heart"],
      ["🖤", "black", "하트", "heart"], ["🤍", "white", "하트", "heart"],
      ["📕", "red", "책", "book"], ["📗", "green", "책", "book"], ["📘", "blue", "책", "book"], ["📙", "orange", "책", "book"],
      ["🟥", "red", "네모", "sq"], ["🟧", "orange", "네모", "sq"], ["🟨", "yellow", "네모", "sq"], ["🟩", "green", "네모", "sq"],
      ["🟦", "blue", "네모", "sq"], ["🟪", "purple", "네모", "sq"], ["⬛", "black", "네모", "sq"],
      ["🍎", "red", "사과", "apple"], ["🍏", "green", "사과", "apple"],
      ["🍓", "red", "딸기", "x1"], ["🍅", "red", "토마토", "x2"], ["🎈", "red", "풍선", "x3"], ["🍌", "yellow", "바나나", "x4"],
      ["🍋", "yellow", "레몬", "x5"], ["🐥", "yellow", "병아리", "x6"], ["🌻", "yellow", "해바라기", "x7"], ["🍊", "orange", "귤", "x8"],
      ["🥕", "orange", "당근", "x9"], ["🍇", "purple", "포도", "x10"], ["🍆", "purple", "가지", "x11"], ["🐸", "green", "개구리", "x12"],
      ["🥦", "green", "브로콜리", "x13"], ["🐟", "blue", "물고기", "x14"], ["🐷", "pink", "돼지", "x15"], ["🦩", "pink", "홍학", "x16"],
      ["🌷", "pink", "튤립", "x17"], ["🧸", "brown", "곰 인형", "x18"], ["⛄", "white", "눈사람", "x19"],
    ];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 물감 퍼지기 */
  splash(ctx, el, color) {
    const U = KP.u;
    const r = el.getBoundingClientRect(),
      b = ctx.fx.getBoundingClientRect();
    const x = r.left + r.width / 2 - b.left,
      y = r.top + r.height / 2 - b.top;
    const s = U.el("div", "clrSplash");
    s.style.cssText = "left:" + x + "px;top:" + y + "px;--c:" + color;
    ctx.fx.appendChild(s);
    for (let i = 0; i < 10; i++) {
      const d = U.el("div", "clrDrop");
      const a = (i / 10) * Math.PI * 2 + U.randf(-0.2, 0.2),
        dist = U.randf(120, 260);
      d.style.cssText =
        "left:" + x + "px;top:" + y + "px;--c:" + color + ";--dx:" + Math.cos(a) * dist + "px;--dy:" + Math.sin(a) * dist + "px";
      ctx.fx.appendChild(d);
    }
    KP.audio.sfx("water");
    KP.audio.sfx("pop");
    ctx.after(1400, () => (ctx.fx.innerHTML = ""));
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    let list, target, render, nameOf, ask, colorOf, sayRight;
    if (lv < 3) {
      const pool = lv === 1 ? ctx.COLORS.slice(0, 4) : ctx.COLORS;
      list = U.sample(pool, lv === 1 ? 3 : 6);
      target = U.pick(list);
      if (target === ctx.lastTarget) target = list.find((c) => c !== target);
      ctx.lastTarget = target;
      ctx.grid.style.setProperty("--cl", 3);
      ctx.grid.style.setProperty("--cp", lv === 1 ? 1 : 2);
      ctx.grid.style.setProperty("--szl", lv === 1 ? "clamp(90px,min(17vw,30vh),190px)" : "clamp(80px,min(14vw,25vh),165px)");
      ctx.grid.style.setProperty("--szp", lv === 1 ? "clamp(90px,min(42vw,20vh),170px)" : "clamp(80px,min(36vw,19vh),150px)");
      render = (c) =>
        '<span class="clrBall' + (c.dark ? " dark" : "") + (c.light ? " light" : "") + '" style="--c:' + c.c + '">' +
        '<i class="clrEye l"></i><i class="clrEye r"></i><i class="clrCheek l"></i><i class="clrCheek r"></i><i class="clrMouth"></i></span>';
      nameOf = (c) => c.n;
      colorOf = (c) => c.c;
      ask = U.josa(target.n, "을/를") + " 찾아요!";
      sayRight = target.n + "! 딩동댕!";
      ctx.say("🎨 " + ask);
    } else {
      // 색+사물: 종류가 여러 색인 것 중에서 정답
      const kinds = ["heart", "heart", "book", "sq", "apple"];
      const kind = U.pick(kinds);
      const same = ctx.OBJ.filter((o) => o[3] === kind);
      const t = U.pick(same);
      const others = U.sample(same.filter((o) => o !== t), kind === "apple" ? 1 : 2);
      const sameColor = U.sample(ctx.OBJ.filter((o) => o[1] === t[1] && o[3] !== kind), 4 - 1 - others.length);
      list = U.shuffle([t, ...others, ...sameColor]);
      target = t;
      ctx.grid.style.setProperty("--cl", list.length);
      ctx.grid.style.setProperty("--cp", 2);
      ctx.grid.style.setProperty("--szl", "clamp(64px,min(13vw,22vh),150px)");
      ctx.grid.style.setProperty("--szp", "clamp(64px,min(26vw,15vh),130px)");
      render = (o) => KP.E(o[0]);
      nameOf = (o) => ctx.C[o[1]].a + " " + o[2];
      colorOf = (o) => ctx.C[o[1]].c;
      ask = U.josa(nameOf(t), "을/를") + " 찾아요!";
      sayRight = nameOf(t) + "! 딩동댕!";
      ctx.say("🎨 " + ask);
    }
    const btns = ctx.choices(ctx.grid, list, {
      cls: lv < 3 ? "clrBtn" : "clrObj",
      render,
      right: (v) => v === target,
      wrongMsg: (v) => "이건 " + U.josa(nameOf(v), "이에요/예요") + ". " + ask,
      onRight: async (v, b) => {
        self.splash(ctx, b, colorOf(v));
        b.classList.add("clrHappy");
        KP.voice.say(sayRight);
        ctx.score.add();
        ctx.round++;
        await ctx.wait(900);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "색깔 박사 형아!" : nameOf(v) + "!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});
