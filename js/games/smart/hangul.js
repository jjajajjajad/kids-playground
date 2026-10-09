/* 한글 놀이 — 위쪽 버튼으로 [배우기]/[퀴즈] 전환. (1단계는 배우기로, 2단계부터 퀴즈로 시작)
   배우기: 자음 ㄱ~ㅎ 카드(글자+그림+낱말). 누르면 크게 나오며 "기역! 가방!" — 다시 누르면 다른 낱말.
   퀴즈 1단계: "ㄱ으로 시작하는 건?" 그림 2개 / 2단계: 그림 3개
   퀴즈 3단계: 그림 4개, 또는 그림을 보고 첫 글자 고르기(모양이 닮은 글자끼리) */
"use strict";
KP.game({
  id: "hangul",
  icon: "✏️",
  name: "한글 놀이",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("hangul", `
      .hgModes{display:flex;gap:10px;justify-content:center;padding:0 10px 6px;flex:0 0 auto}
      .hgMode{font-size:clamp(18px,2.4vw,24px);background:rgba(255,255,255,.7);border-radius:999px;padding:8px 22px;min-height:52px;display:flex;align-items:center;gap:8px;border-bottom:5px solid transparent}
      .hgMode .e{font-size:1.4em}
      .hgMode.sel{background:#fff;border-bottom-color:var(--cat);color:var(--cat);box-shadow:var(--shadow)}
      .hgMode.glow{animation:glow 1s ease-in-out 3}
      .hgView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
      .hgView.on{display:flex}
      .hgGrid{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(100px,13vw,140px),1fr));gap:clamp(10px,1.6vw,16px);padding:6px clamp(10px,2vw,22px) 24px;align-content:start}
      .hgCard{position:relative;background:#fff;border-radius:24px;padding:8px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 6px 0 color-mix(in srgb,var(--c) 55%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff);
        animation:itemIn .35s backwards;animation-delay:calc(var(--i)*30ms)}
      .hgCard:active{transform:translateY(4px)}
      .hgCh{font-size:clamp(46px,6.4vw,66px);line-height:1;color:var(--c)}
      .hgCard .e{font-size:clamp(34px,4.6vw,48px)}
      .hgCard .hgW{font-size:clamp(16px,2vw,19px)}
      .hgCard.seen::after{content:"";position:absolute;top:8px;right:8px;width:12px;height:12px;border-radius:50%;background:var(--sun)}
      .hgSpot{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .2s;z-index:5}
      .hgSpot.on{opacity:1}
      .hgSpotBox{display:flex;align-items:center;gap:clamp(10px,3vw,40px);background:#fff;border-radius:40px;padding:clamp(14px,3vw,30px) clamp(20px,4vw,50px);box-shadow:0 10px 0 rgba(47,58,102,.15),0 20px 60px rgba(47,58,102,.25);border:6px solid var(--c)}
      .hgSpot.on .hgSpotBox{animation:popBig .45s cubic-bezier(.2,1.6,.4,1)}
      .hgSpotBox .hgCh{font-size:clamp(100px,16vw,190px)}
      .hgSpotBox .e{font-size:clamp(90px,14vw,170px)}
      .hgSpotBox .hgW{font-size:clamp(28px,4vw,46px);display:block;text-align:center}
      @media (max-aspect-ratio:1/1){.hgSpotBox{flex-direction:column;gap:6px}}
      .hgQ{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,3vh,30px);padding:4px 12px 18px}
      .hgBig{font-size:clamp(90px,min(30vw,17vh),160px);line-height:1;background:#fff;border-radius:34px;padding:6px 36px 14px;box-shadow:var(--shadow);color:var(--c)}
      .hgBig .e{font-size:.9em}
      .hgBig.yay{animation:jumpA .5s 2}
      .hgAns{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);gap:clamp(12px,2.4vw,26px)}
      @media (max-aspect-ratio:1/1){.hgAns{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .hgOpt{font-size:var(--sz);border-radius:28px}
      .hgOpt.letter{color:var(--ink);font-size:calc(var(--sz) * .9)}
    `);
    const CH = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    ctx.cho = (w) => {
      const c = w.charCodeAt(0) - 0xac00;
      return c >= 0 && c < 11172 ? CH[Math.floor(c / 588)] : "";
    };
    // [자음, 이름, [[낱말, 그림], ...]]
    ctx.H = [
      ["ㄱ", "기역", [["가방", "👜"], ["고양이", "🐱"], ["기린", "🦒"], ["거북이", "🐢"], ["고래", "🐳"], ["기차", "🚂"]]],
      ["ㄴ", "니은", [["나비", "🦋"], ["눈사람", "⛄"], ["나무", "🌳"], ["낙타", "🐫"]]],
      ["ㄷ", "디귿", [["다람쥐", "🐿️"], ["당근", "🥕"], ["돼지", "🐷"], ["돌고래", "🐬"], ["도넛", "🍩"]]],
      ["ㄹ", "리을", [["라면", "🍜"], ["로켓", "🚀"], ["레몬", "🍋"], ["리본", "🎀"], ["라디오", "📻"]]],
      ["ㅁ", "미음", [["모자", "🎩"], ["문어", "🐙"], ["물고기", "🐟"], ["말", "🐴"], ["무지개", "🌈"]]],
      ["ㅂ", "비읍", [["바나나", "🍌"], ["버스", "🚌"], ["비행기", "✈️"], ["별", "⭐"], ["부엉이", "🦉"]]],
      ["ㅅ", "시옷", [["사과", "🍎"], ["사자", "🦁"], ["소", "🐮"], ["수박", "🍉"], ["상어", "🦈"]]],
      ["ㅇ", "이응", [["오리", "🦆"], ["원숭이", "🐵"], ["우산", "☂️"], ["아이스크림", "🍦"], ["양", "🐑"]]],
      ["ㅈ", "지읒", [["자동차", "🚗"], ["자전거", "🚲"], ["쥐", "🐭"], ["주스", "🧃"], ["지구", "🌍"]]],
      ["ㅊ", "치읓", [["치즈", "🧀"], ["침대", "🛏️"], ["초콜릿", "🍫"], ["체리", "🍒"], ["축구공", "⚽"]]],
      ["ㅋ", "키읔", [["코끼리", "🐘"], ["케이크", "🍰"], ["코알라", "🐨"], ["쿠키", "🍪"], ["카메라", "📷"]]],
      ["ㅌ", "티읕", [["토끼", "🐰"], ["토마토", "🍅"], ["트럭", "🚛"], ["텐트", "⛺"], ["트랙터", "🚜"]]],
      ["ㅍ", "피읖", [["포도", "🍇"], ["판다", "🐼"], ["피자", "🍕"], ["펭귄", "🐧"], ["풍선", "🎈"]]],
      ["ㅎ", "히읗", [["하마", "🦛"], ["호랑이", "🐯"], ["해바라기", "🌻"], ["헬리콥터", "🚁"], ["햄버거", "🍔"]]],
    ];
    ctx.H.forEach(([c, , ws]) => ws.forEach(([w]) => ctx.cho(w) !== c && console.warn("hangul: 첫소리 다름", c, w)));
    ctx.LIKE = ["ㄱㅋㄴ", "ㄷㅌㄹ", "ㅁㅂㅍ", "ㅅㅈㅊ", "ㅇㅎ"];
    ctx.CC = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452", "#2fb466", "#e0564f", "#3a86ff", "#c77dff"];

    const modes = U.el("div", "hgModes");
    ctx.bLearn = U.btn(KP.E("📖") + "배우기", "hgMode");
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "hgMode");
    modes.append(ctx.bLearn, ctx.bQuiz);
    ctx.tap(ctx.bLearn, () => this.mode(ctx, "learn"));
    ctx.tap(ctx.bQuiz, () => this.mode(ctx, "quiz"));
    ctx.vLearn = U.el("div", "hgView");
    ctx.grid = U.el("div", "hgGrid");
    ctx.spot = U.el("div", "hgSpot");
    ctx.vLearn.append(ctx.grid, ctx.spot);
    ctx.cards = ctx.H.map((h, i) => {
      const [c, nm, ws] = h;
      const card = U.btn('<span class="hgCh">' + c + "</span>" + KP.E(ws[0][1]) + '<span class="hgW">' + ws[0][0] + "</span>", "hgCard");
      card.style.setProperty("--c", ctx.CC[i]);
      card.style.setProperty("--i", i);
      ctx.tap(card, () => this.learn(ctx, i, card));
      ctx.grid.appendChild(card);
      return card;
    });
    ctx.vQuiz = U.el("div", "hgView");
    ctx.q = U.el("div", "hgQ");
    ctx.vQuiz.appendChild(ctx.q);
    ctx.body.append(modes, ctx.vLearn, ctx.vQuiz);
  },
  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set();
    ctx.wordIdx = {};
    ctx.suggested = false;
    this.mode(ctx, ctx.level === 1 ? "learn" : "quiz", true);
  },
  mode(ctx, m, first) {
    ctx.m = m;
    ctx.bLearn.classList.toggle("sel", m === "learn");
    ctx.bQuiz.classList.toggle("sel", m === "quiz");
    ctx.vLearn.classList.toggle("on", m === "learn");
    ctx.vQuiz.classList.toggle("on", m === "quiz");
    if (!first) KP.audio.sfx("select");
    if (m === "learn") {
      ctx.say("✏️ 글자를 눌러 봐요! 무슨 소리일까요?");
      ctx.cards.forEach((c, i) => c.classList.toggle("seen", ctx.seen.has(i)));
      ctx.hint(() => ctx.cards.find((c, i) => !ctx.seen.has(i)), "글자를 눌러 봐요!");
    } else this.quiz(ctx);
  },
  learn(ctx, i, card) {
    const U = KP.u;
    const [c, nm, ws] = ctx.H[i];
    const k = (ctx.wordIdx[i] = ctx.wordIdx[i] == null ? 0 : (ctx.wordIdx[i] + 1) % ws.length);
    const [w, em] = ws[k];
    ctx.seen.add(i);
    card.classList.add("seen");
    U.replay(card, "wig");
    KP.audio.note(KP.audio.SCALE[i % 8], { inst: "marimba", dur: 0.3, vol: 0.25 });
    ctx.spot.innerHTML =
      '<div class="hgSpotBox" style="--c:' + ctx.CC[i] + '"><span class="hgCh" style="color:' + ctx.CC[i] + '">' + c + "</span><div>" + KP.E(em) + '<span class="hgW">' + w + "</span></div></div>";
    ctx.spot.classList.remove("on");
    void ctx.spot.offsetWidth;
    ctx.spot.classList.add("on");
    KP.voice.say(nm + "! " + w + "!");
    if (ctx.spotT) ctx.cancel(ctx.spotT);
    ctx.spotT = ctx.after(2200, () => ctx.spot.classList.remove("on"));
    if (ctx.seen.size >= 6 && !ctx.suggested) {
      ctx.suggested = true;
      ctx.after(2600, () => {
        if (ctx.m !== "learn") return;
        U.replay(ctx.bQuiz, "glow");
        KP.voice.say("글자 박사! 퀴즈도 해 볼까요?");
      });
    }
    ctx.hint(() => ctx.cards.find((x, j) => !ctx.seen.has(j)) || null, "다른 글자도 눌러 봐요!");
  },
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    ctx.q.innerHTML = "";
    let ti = U.rand(ctx.H.length);
    if (ti === ctx.lastI) ti = (ti + 1) % ctx.H.length;
    ctx.lastI = ti;
    const [c, nm, ws] = ctx.H[ti];
    const color = ctx.CC[ti];
    const reverse = lv === 3 && U.rand(2) === 0;
    const big = U.el("div", "hgBig");
    big.style.setProperty("--c", color);
    const ans = U.el("div", "hgAns");
    ctx.q.append(big, ans);
    let list, right, render, wrongMsg, ask, sayRight, cls;
    if (!reverse) {
      const n = lv === 1 ? 2 : lv === 2 ? 3 : 4;
      const t = U.pick(ws);
      const others = U.sample(ctx.H.filter((h) => h[0] !== c), n - 1).map((h) => U.pick(h[2]).concat([h[1]]));
      list = U.shuffle([t.concat([nm]), ...others]);
      right = (v) => v[0] === t[0];
      render = (v) => KP.E(v[1]);
      big.innerHTML = c;
      ask = U.josa(nm, "으로/로") + " 시작하는 건 뭘까요?";
      wrongMsg = (v) => "이건 " + U.josa(v[0], "이에요/예요") + ". " + U.josa(v[0], "은/는") + " " + U.josa(v[2], "으로/로") + " 시작해요!";
      sayRight = (v) => nm + "! " + v[0] + "!";
      cls = "hgOpt";
      ans.style.setProperty("--cl", n);
      ans.style.setProperty("--cp", n === 3 ? 3 : 2);
      ans.style.setProperty("--szl", "clamp(70px,min(12vw,22vh),130px)");
      ans.style.setProperty("--szp", n === 3 ? "clamp(64px,22vw,96px)" : "clamp(70px,30vw,120px)");
      ctx.say(c + " " + ask, false);
    } else {
      const t = U.pick(ws);
      const like = (ctx.LIKE.find((g) => g.includes(c)) || "").replace(c, "");
      const pool = [...like].concat(U.shuffle(ctx.H.map((h) => h[0]).filter((x) => x !== c && !like.includes(x))));
      list = U.shuffle([c, ...pool.slice(0, 2)]);
      right = (v) => v === c;
      render = (v) => v;
      big.innerHTML = KP.E(t[1]);
      ask = U.josa(t[0], "은/는") + " 무슨 글자로 시작할까요?";
      const nameOf = (x) => ctx.H.find((h) => h[0] === x)[1];
      wrongMsg = (v) => "이건 " + U.josa(nameOf(v), "이에요/예요") + ". " + t[0] + "! 첫 소리를 들어 봐요!";
      sayRight = () => t[0] + "! " + U.josa(nm, "으로/로") + " 시작해요!";
      cls = "hgOpt letter";
      ans.style.setProperty("--cl", 3);
      ans.style.setProperty("--cp", 3);
      ans.style.setProperty("--szl", "clamp(80px,min(12vw,22vh),130px)");
      ans.style.setProperty("--szp", "clamp(70px,22vw,96px)");
      ctx.say("❓ " + ask, false);
    }
    // 말풍선은 글자 그대로, 목소리는 글자 이름으로
    ctx.instr = ask;
    KP.voice.say(ask);
    const btns = ctx.choices(ans, list, {
      cls,
      render,
      right,
      wrongMsg,
      onRight: async (v, b) => {
        U.replay(big, "yay");
        U.replay(b, "jump");
        KP.audio.sfx("good");
        KP.voice.say(sayRight(v));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1300);
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "한글 박사 형아!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "quiz") self.quiz(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});
