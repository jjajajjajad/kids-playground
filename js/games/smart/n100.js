/* 100까지 숫자 — 위쪽 버튼: [100판] [10씩 세기] [퀴즈] [쓰기]
   - 100판: 1~100 판에서 수를 누르면 크게 보여 주고 "이십삼! 스물셋!" + 십 막대·낱개 블록으로 크기를 보여 줌
   - 10씩 세기: 10, 20, … 100 을 차례로 누르면 십 막대가 하나씩 쌓이며 "십! 이십!…" (고유어도 함께)
   - 퀴즈(단계별 범위 1단계 1~20 / 2단계 1~50 / 3단계 1~100)
       수 듣고 찾기 · 블록 보고 몇인지 · 다음 수는?(2단계~) · 몇십 찾기
   - 쓰기: 숫자 쓰기 공책으로 */
"use strict";
KP.game({
  id: "n100",
  icon: "🧮",
  name: "100까지 숫자",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    const self = this;
    KP.css("n100", `
      .n1Modes{display:flex;gap:clamp(6px,1.2vw,12px);justify-content:center;padding:10px 10px 6px;flex:0 0 auto;flex-wrap:wrap}
      .n1Mode{font-size:clamp(16px,2.2vw,23px);background:#fff;color:var(--night);border-radius:20px;padding:6px 16px;min-height:52px;display:flex;align-items:center;gap:6px;border:4px solid #fff;box-shadow:0 5px 0 rgba(27,37,80,.18)}
      .n1Mode .e{font-size:1.3em}
      .n1Mode.sel{background:var(--night);border-color:var(--night);color:#fff}
      @media (max-width:560px){.n1Modes{gap:5px;padding:8px 4px 4px;flex-wrap:nowrap}.n1Mode{font-size:14px;padding:3px 9px;min-height:44px;white-space:nowrap}.n1Mode .e{display:none}}
      .n1View{flex:1;min-height:0;display:none;position:relative}
      .n1View.on{display:flex}
      /* 100판 */
      .n1Learn{flex:1;min-height:0;display:flex;gap:clamp(10px,2vw,24px);align-items:center;justify-content:center;padding:4px 12px 12px}
      .n1Chart{display:grid;grid-template-columns:repeat(10,1fr);gap:clamp(2px,.45vw,5px);width:min(100%,var(--cw));aspect-ratio:1;flex:0 0 auto}
      .n1N{border-radius:clamp(5px,.8vw,10px);background:#fff;font-size:calc(var(--cw) / 24);line-height:1;color:var(--ink);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 #e1e5f0;padding:0}
      .n1N.t{color:#fff;background:var(--c)}
      .n1N.seen{background:color-mix(in srgb,var(--c) 22%,#fff)}
      .n1N.t.seen{background:var(--c)}
      .n1N.on{outline:4px solid var(--star);outline-offset:-1px;transform:scale(1.12);z-index:1;position:relative}
      .n1Panel{flex:1 1 300px;max-width:420px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:10px}
      .n1Big{font-size:clamp(70px,min(11vw,16vh),130px);line-height:1;color:var(--c);background:#fff;border-radius:28px;padding:8px 24px;box-shadow:var(--shadow);min-width:2.2em;text-align:center}
      .n1Say{font-size:clamp(20px,2.6vw,30px);color:var(--ink);text-align:center}
      .n1Say b{color:var(--c);font-weight:400}
      .n1Blocks{display:flex;align-items:flex-end;gap:clamp(4px,.7vw,8px);flex-wrap:wrap;justify-content:center;min-height:clamp(90px,16vh,170px);max-width:100%}
      .n1Ten{display:flex;flex-direction:column;gap:1px;padding:2px;background:color-mix(in srgb,var(--bc) 55%,#000);border-radius:5px;animation:nbPop .35s backwards}
      .n1Ten i,.n1One{display:block;width:clamp(10px,1.4vw,15px);height:clamp(7px,1.25vh,13px);background:var(--bc);border-radius:2px}
      .n1One{width:clamp(14px,1.9vw,20px);height:clamp(14px,1.9vw,20px);border-radius:4px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15);animation:nbPop .35s backwards}
      .n1Ones{display:grid;grid-template-columns:repeat(5,auto);gap:3px;align-self:flex-end}
      @keyframes nbPop{from{transform:scale(0) translateY(30px)}}
      @media (max-aspect-ratio:1/1){.n1Learn{flex-direction:column}.n1Panel{flex:0 0 auto;max-width:none;width:100%}}
      /* 10씩 세기 */
      .n1Tens{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,22px);padding:4px 12px 14px}
      .n1Stack{display:flex;gap:clamp(5px,1vw,12px);align-items:flex-end;min-height:clamp(110px,22vh,210px)}
      .n1Stack .n1Ten i{width:clamp(14px,2vw,22px);height:clamp(9px,1.7vh,18px)}
      .n1Row{display:grid;grid-template-columns:repeat(10,1fr);gap:clamp(5px,1vw,10px);width:min(100%,900px)}
      @media (max-aspect-ratio:1/1){.n1Row{grid-template-columns:repeat(5,1fr)}}
      .n1T{font-size:clamp(24px,3.4vw,40px);border-radius:18px;background:#fff;color:var(--c);min-height:clamp(58px,8vw,84px);box-shadow:0 5px 0 color-mix(in srgb,var(--c) 45%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff)}
      .n1T.done{background:var(--c);color:#fff}
      .n1T.next{border-color:var(--star);animation:glow 1.2s ease-in-out infinite}
      /* 퀴즈 */
      .n1Q{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,3vh,28px);padding:4px 12px 18px}
      .n1Ask{font-size:clamp(60px,min(10vw,15vh),120px);line-height:1;background:#fff;border-radius:30px;padding:10px 30px;box-shadow:var(--shadow);color:var(--ocean);display:flex;align-items:center;gap:14px;cursor:pointer}
      .n1Ask.yay{animation:jumpA .5s 2}
      .n1Ask .n1Blocks{min-height:0}
      .n1Q .choice{font-size:clamp(40px,6.4vw,74px);min-width:clamp(96px,14vw,150px);color:var(--ocean)}
    `);
    ctx.CC = ["#ff5b6e", "#ff9f1c", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452"];
    ctx.colorOf = (n) => ctx.CC[Math.floor((n - 1) / 10) % 10];
    const modes = U.el("div", "n1Modes");
    ctx.bChart = U.btn(KP.E("💯") + "100판", "n1Mode");
    ctx.bTens = U.btn(KP.E("🔟") + "10씩 세기", "n1Mode");
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "n1Mode");
    ctx.bWrite = U.btn(KP.E("📝") + "쓰기", "n1Mode");
    modes.append(ctx.bChart, ctx.bTens, ctx.bQuiz, ctx.bWrite);
    ctx.tap(ctx.bChart, () => self.mode(ctx, "chart"));
    ctx.tap(ctx.bTens, () => self.mode(ctx, "tens"));
    ctx.tap(ctx.bQuiz, () => self.mode(ctx, "quiz"));
    ctx.tap(ctx.bWrite, () => {
      KP.audio.sfx("open");
      if (ctx.cur) KP.nbWant = { id: "nwrite", ch: String(ctx.cur) };
      KP.open("nwrite");
    });

    // 100판
    ctx.vChart = U.el("div", "n1View");
    const learn = U.el("div", "n1Learn");
    ctx.chart = U.el("div", "n1Chart");
    ctx.panel = U.el("div", "n1Panel");
    learn.append(ctx.chart, ctx.panel);
    ctx.vChart.appendChild(learn);
    ctx.nums = [];
    for (let n = 1; n <= 100; n++) {
      const b = U.btn(String(n), "n1N" + (n % 10 === 0 ? " t" : ""));
      b.style.setProperty("--c", ctx.colorOf(n));
      ctx.tap(b, () => self.show(ctx, n));
      ctx.chart.appendChild(b);
      ctx.nums.push(b);
    }
    // 10씩 세기
    ctx.vTens = U.el("div", "n1View");
    const tens = U.el("div", "n1Tens");
    ctx.tSay = U.el("div", "n1Say");
    ctx.stack = U.el("div", "n1Stack");
    ctx.tRow = U.el("div", "n1Row");
    tens.append(ctx.tSay, ctx.stack, ctx.tRow);
    ctx.vTens.appendChild(tens);
    ctx.tBtns = [];
    for (let t = 1; t <= 10; t++) {
      const b = U.btn(String(t * 10), "n1T");
      b.style.setProperty("--c", ctx.CC[t - 1]);
      ctx.tap(b, () => self.tenTap(ctx, t));
      ctx.tRow.appendChild(b);
      ctx.tBtns.push(b);
    }
    // 퀴즈
    ctx.vQuiz = U.el("div", "n1View");
    ctx.q = U.el("div", "n1Q");
    ctx.vQuiz.appendChild(ctx.q);
    ctx.body.append(modes, ctx.vChart, ctx.vTens, ctx.vQuiz);
    addEventListener("resize", () => ctx._active && ctx.m === "chart" && self.fit(ctx));
  },
  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set(KP.store.get("n100:seen", []));
    ctx.cur = 0;
    this.mode(ctx, ctx.level === 1 ? "chart" : "quiz", true);
  },
  mode(ctx, m, first) {
    ctx.m = m;
    ctx.tok = (ctx.tok || 0) + 1;
    [["chart", ctx.bChart, ctx.vChart], ["tens", ctx.bTens, ctx.vTens], ["quiz", ctx.bQuiz, ctx.vQuiz]].forEach(([k, b, v]) => {
      b.classList.toggle("sel", k === m);
      v.classList.toggle("on", k === m);
    });
    if (!first) KP.audio.sfx("select");
    ctx.hint(null);
    if (m === "chart") {
      this.fit(ctx);
      ctx.nums.forEach((b, i) => b.classList.toggle("seen", ctx.seen.has(i + 1)));
      ctx.say("💯 수를 눌러 봐요! 1부터 100까지!");
      this.show(ctx, ctx.cur || 1, true);
      ctx.hint(() => ctx.nums.find((b, i) => !ctx.seen.has(i + 1)), "수를 눌러 봐요!");
    } else if (m === "tens") {
      ctx.tDone = 0;
      ctx.stack.innerHTML = "";
      ctx.tSay.innerHTML = "10씩 차례로 눌러요!";
      ctx.tBtns.forEach((b, i) => {
        b.classList.remove("done");
        b.classList.toggle("next", i === 0);
      });
      ctx.say("🔟 10, 20, 30… 차례로 눌러요! 막대 하나가 열 개예요.");
      ctx.hint(() => ctx.tBtns[ctx.tDone] || null, "다음 수를 눌러요!");
    } else this.quiz(ctx);
  },
  fit(ctx) {
    const v = ctx.vChart.getBoundingClientRect();
    if (!v.width) return;
    const port = v.height > v.width;
    const cw = port ? Math.min(v.width - 24, v.height * 0.62) : Math.min(v.height - 20, v.width * 0.6);
    ctx.chart.style.setProperty("--cw", Math.max(220, Math.floor(cw)) + "px");
  },
  /** 십 막대·낱개 블록 */
  blocks(n, color) {
    const U = KP.u;
    const box = U.el("div", "n1Blocks");
    box.style.setProperty("--bc", color);
    const t = Math.floor(n / 10),
      o = n % 10;
    for (let i = 0; i < t; i++) {
      const bar = U.el("div", "n1Ten", "<i></i>".repeat(10));
      bar.style.animationDelay = i * 60 + "ms";
      box.appendChild(bar);
    }
    if (o) {
      const ones = U.el("div", "n1Ones");
      for (let i = 0; i < o; i++) {
        const c = U.el("span", "n1One");
        c.style.animationDelay = t * 60 + i * 40 + "ms";
        ones.appendChild(c);
      }
      box.appendChild(ones);
    }
    return box;
  },
  show(ctx, n, quiet) {
    const U = KP.u;
    ctx.cur = n;
    ctx.nums.forEach((b, i) => b.classList.toggle("on", i + 1 === n));
    const col = ctx.colorOf(n);
    ctx.panel.style.setProperty("--c", col);
    ctx.panel.innerHTML = "";
    const t = Math.floor(n / 10),
      o = n % 10;
    const big = U.el("div", "n1Big", String(n));
    const say = U.el("div", "n1Say", "<b>" + U.numSino(n) + "</b>" + (n < 100 ? " · " + U.numNative(n) : ""));
    const how = U.el("div", "n1Say", n === 100 ? "십 막대 열 개 = 백!" : (t ? "십 막대 " + t + "개" : "") + (t && o ? " + " : "") + (o ? "낱개 " + o + "개" : ""));
    how.style.fontSize = "clamp(15px,1.8vw,20px)";
    ctx.panel.append(big, say, this.blocks(n, col), how);
    if (quiet) return;
    U.replay(big, "pop");
    KP.audio.note(KP.audio.SCALE[(n - 1) % 8], { inst: "marimba", dur: 0.25, vol: 0.22 });
    KP.voice.say(U.numSino(n) + "! " + (n < 100 ? U.numNative(n) + "!" : ""));
    if (!ctx.seen.has(n)) {
      ctx.seen.add(n);
      ctx.nums[n - 1].classList.add("seen");
      KP.store.set("n100:seen", [...ctx.seen]);
    }
  },
  tenTap(ctx, t) {
    const U = KP.u;
    if (t !== ctx.tDone + 1) {
      // 순서가 아니면 다음 수를 알려 줌
      U.replay(ctx.tBtns[t - 1], "wrong");
      KP.audio.sfx("bad");
      KP.voice.say("다음은 " + U.josa(U.numSino((ctx.tDone + 1) * 10), "이에요/예요") + "!");
      return;
    }
    ctx.tDone = t;
    const b = ctx.tBtns[t - 1];
    b.classList.add("done");
    b.classList.remove("next");
    if (ctx.tBtns[t]) ctx.tBtns[t].classList.add("next");
    const bar = U.el("div", "n1Ten", "<i></i>".repeat(10));
    bar.style.setProperty("--bc", ctx.CC[t - 1]);
    ctx.stack.appendChild(bar);
    ctx.tSay.innerHTML = "<b style='color:" + ctx.CC[t - 1] + "'>" + U.numSino(t * 10) + "</b>" + (t < 10 ? " · " + U.numNative(t * 10) : "");
    KP.audio.note(KP.audio.SCALE[(t - 1) % 8], { inst: "marimba", dur: 0.3, vol: 0.25 });
    KP.voice.say(U.numSino(t * 10) + "!" + (t < 10 ? " " + U.numNative(t * 10) + "!" : ""));
    if (t === 10) {
      ctx.hint(null);
      const tk = ctx.tok;
      ctx.after(900, async () => {
        if (tk !== ctx.tok) return;
        KP.voice.say("십이 열 개면 백! 백까지 다 셌어요!");
        ctx.score.add();
        const ok = await ctx.win({ big: true, msg: "백까지 성공!" });
        if (ok && ctx.m === "tens" && tk === ctx.tok) this.mode(ctx, "tens", true);
      });
    }
  },
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const max = lv === 1 ? 20 : lv === 2 ? 50 : 100;
    const types = lv === 1 ? ["hear", "hear", "blocks"] : lv === 2 ? ["hear", "blocks", "next", "tens"] : ["hear", "blocks", "next", "tens", "before"];
    let t = U.pick(types);
    if (t === ctx.lastT && types.length > 2) t = U.pick(types.filter((x) => x !== t));
    ctx.lastT = t;
    let n = 1 + U.rand(max);
    if (t === "tens") n = 10 * (1 + U.rand(max / 10));
    if (t === "next") n = Math.min(n, max - 1);
    if (t === "before") n = Math.max(n, 2);
    const answer = t === "next" ? n + 1 : t === "before" ? n - 1 : n;
    // 헷갈리기 쉬운 보기: 십의 자리·일의 자리를 바꾼 수, ±1, ±10
    const cand = new Set();
    const swap = Number(String(answer).split("").reverse().join(""));
    // 다음/앞의 수 문제에서는 화면에 보이는 수(n)는 보기에서 뺌
    const ok = (x) => x >= 1 && x <= 100 && x !== answer && !((t === "next" || t === "before") && x === n);
    [swap, answer + 1, answer - 1, answer + 10, answer - 10].forEach((x) => ok(x) && cand.add(x));
    if (t === "tens") [answer + 10, answer - 10, answer + 20].forEach((x) => x >= 10 && x <= 100 && x !== answer && cand.add(x));
    while (cand.size < 6) {
      const x = 1 + U.rand(max);
      if (ok(x)) cand.add(x);
    }
    const nOpt = lv === 1 ? 2 : lv === 2 ? 3 : 4;
    const list = U.shuffle([answer, ...U.shuffle([...cand]).slice(0, nOpt - 1)]);
    ctx.q.innerHTML = "";
    const ask = U.el("div", "n1Ask");
    const ans = U.el("div", "qAns");
    ctx.q.append(ask, ans);
    let speak, bubble;
    if (t === "hear" || t === "tens") {
      ask.innerHTML = KP.E("👂");
      speak = U.josa(U.numSino(answer), "을/를") + " 찾아요!" + (answer < 100 ? " " + U.numNative(answer) + "!" : "");
      bubble = "🔊 수를 듣고 찾아요!";
    } else if (t === "blocks") {
      ask.appendChild(this.blocks(answer, ctx.colorOf(answer)));
      speak = "블록이 모두 몇 개일까요? 막대 하나는 열 개!";
      bubble = "🧱 모두 몇 개일까요?";
    } else if (t === "next") {
      ask.innerHTML = n + ' <span style="color:#c9cede">→</span> ?';
      speak = U.numSino(n) + " 다음은 뭘까요?";
      bubble = n + " 다음 수는?";
    } else {
      ask.innerHTML = '? <span style="color:#c9cede">→</span> ' + n;
      speak = U.numSino(n) + " 바로 앞의 수는 뭘까요?";
      bubble = n + " 앞의 수는?";
    }
    ctx.say(bubble, false);
    ctx.instr = speak;
    KP.voice.say(speak);
    ctx.tap(ask, () => KP.voice.say(speak));
    const tk = ctx.tok;
    const btns = ctx.choices(ans, list, {
      cls: "num",
      render: (v) => String(v),
      right: (v) => v === answer,
      wrongMsg: (v) => "이건 " + U.josa(U.numSino(v), "이에요/예요") + ". " + speak,
      onRight: async (v, b) => {
        U.replay(ask, "yay");
        U.replay(b, "jump");
        KP.audio.sfx("good");
        KP.voice.say(U.numSino(answer) + "! " + (answer < 100 ? U.numNative(answer) + "!" : ""));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1300);
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "숫자 박사 형아!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "quiz" && tk === ctx.tok) this.quiz(ctx);
      },
    });
    ctx.hint(() => btns.find((x) => x.dataset.right), speak);
  },
});
