/* 한글 놀이 — 위쪽 버튼: [자음] [모음] [글자 합체] [퀴즈]
   만 3~4세 발달 단계에 맞춰 '받아쓰기'나 정답 강요 없이 놀면서 익히는 구성.
   - 자음/모음: 카드를 누르면 크게 보여 주고 이름 + 낱말 첫소리("기역! 고양이의 고!").
     크게 본 화면에서 [따라 쓰기](획 순서 안내, 순서 틀려도 괜찮음) · [다른 낱말]
   - 글자 합체: 자음 하나 + 모음 하나를 고르면 둘이 만나 글자가 된다("기역에 아 하면, 가!").
     모음만 바꿔 보면 가·갸·거·겨… 표를 손으로 익히는 셈. 그 글자로 시작하는 낱말 그림도 보여 줌.
   - 퀴즈(단계별): 1단계 첫소리 그림 찾기·자음 찾기(보기 2개)
                   2단계 + 모음 찾기·글자 듣고 찾기·낱말 읽기(보기 3개)
                   3단계 + 그림 보고 첫 글자·글자 만들기(보기 4개) */
"use strict";
KP.game({
  id: "hangul",
  icon: "✏️",
  name: "한글 놀이",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    const self = this;
    KP.css("hangul", `
      .hgModes{display:flex;gap:clamp(6px,1.2vw,12px);justify-content:center;padding:10px 10px 6px;flex:0 0 auto;flex-wrap:wrap}
      .hgMode{font-size:clamp(16px,2.2vw,23px);background:#fff;color:var(--night);border-radius:20px;padding:6px 16px;min-height:52px;display:flex;align-items:center;gap:6px;border:4px solid #fff;box-shadow:0 5px 0 rgba(27,37,80,.18)}
      .hgMode .e{font-size:1.35em}
      .hgTabCh{font-weight:400;font-size:1.3em;color:var(--coral)}
      .hgMode.sel .hgTabCh{color:var(--star)}
      .hgMode.sel{background:var(--night);border-color:var(--night);color:#fff;box-shadow:0 5px 0 var(--deep)}
      .hgMode.glow{animation:glow 1s ease-in-out 3}
      @media (max-width:520px){.hgModes{gap:5px;padding:8px 6px 4px;flex-wrap:nowrap}.hgMode{font-size:14px;padding:3px 7px;min-height:44px;border-width:3px;gap:3px;white-space:nowrap}.hgMode .e{display:none}}
      .hgView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
      .hgView.on{display:flex}
      .hgGrid{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(96px,12.5vw,136px),1fr));gap:clamp(10px,1.6vw,16px);padding:6px clamp(10px,2vw,22px) 24px;align-content:start}
      .hgCard{position:relative;background:#fff;border-radius:24px;padding:8px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 6px 0 color-mix(in srgb,var(--c) 55%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff);
        animation:itemIn .35s backwards;animation-delay:calc(var(--i)*30ms)}
      .hgCard:active{transform:translateY(4px)}
      .hgCh{font-size:clamp(46px,6.4vw,66px);line-height:1;color:var(--c)}
      .hgCard .e{font-size:clamp(34px,4.6vw,48px)}
      .hgCard .hgW{font-size:clamp(15px,2vw,19px)}
      .hgCard.seen::after{content:"";position:absolute;top:8px;right:8px;width:12px;height:12px;border-radius:50%;background:var(--sun)}
      .hgCard.traced::before{content:"✓";position:absolute;top:2px;left:9px;font-size:18px;color:var(--grass)}
      /* 크게 보기 */
      .hgSpot{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:5;background:rgba(255,255,255,.55)}
      .hgSpot.on{display:flex}
      .hgSpotBox{display:flex;flex-direction:column;align-items:center;gap:clamp(8px,2vh,16px);background:#fff;border-radius:40px;padding:clamp(14px,3vw,28px) clamp(20px,4vw,46px);box-shadow:0 10px 0 rgba(47,58,102,.15),0 20px 60px rgba(47,58,102,.25);border:6px solid var(--c);animation:popBig .45s cubic-bezier(.2,1.6,.4,1);max-width:94%}
      .hgSpotRow{display:flex;align-items:center;gap:clamp(10px,3vw,40px)}
      .hgSpotBox .hgCh{font-size:clamp(96px,min(15vw,26vh),190px)}
      .hgPic{display:flex;flex-direction:column;align-items:center;border-radius:28px;padding:4px 10px}
      .hgPic .e{font-size:clamp(84px,min(13vw,22vh),160px)}
      .hgPic .hgW{font-size:clamp(26px,4vw,44px)}
      .hgPic .hgW b{color:var(--c);font-weight:400}
      .hgBtns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
      @media (max-aspect-ratio:1/1){.hgSpotRow{flex-direction:column;gap:4px}}
      /* 글자 합체 */
      .hgMg{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:8px;padding:4px 10px 14px}
      .hgRow{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(5px,0.8vw,10px);width:min(100%,1100px)}
      @media (max-width:700px){.hgRow.cons{--n:7 !important}.hgRow.vows{--n:5 !important}}
      .hgT{aspect-ratio:1;max-height:84px;border-radius:18px;background:#fff;font-size:clamp(26px,min(4.2vw,6vh),46px);color:var(--c);box-shadow:0 5px 0 color-mix(in srgb,var(--c) 45%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff);display:flex;align-items:center;justify-content:center;line-height:1}
      .hgT.sel{background:var(--c);color:#fff;transform:translateY(-4px) scale(1.06)}
      .hgT:active{transform:translateY(3px)}
      .hgMachine{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(10px,2.4vw,30px);width:100%}
      .hgSlot{width:clamp(78px,min(13vw,19vh),150px);aspect-ratio:1;border-radius:28px;border:5px dashed rgba(47,58,102,.25);background:rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;font-size:clamp(54px,min(9vw,13vh),104px);line-height:1;transition:transform .3s}
      .hgSlot.full{border-style:solid;border-color:#fff;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.12)}
      .hgOp{font-size:clamp(30px,4vw,50px);color:var(--ink2)}
      .hgOut{position:relative;width:clamp(120px,min(20vw,28vh),230px);aspect-ratio:1;border-radius:36px;background:var(--star);border:6px solid #fff;box-shadow:0 8px 0 rgba(27,37,80,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;color:var(--night)}
      .hgOut .syl{font-size:clamp(80px,min(14vw,19vh),160px)}
      .hgOut.empty{background:rgba(255,255,255,.6);border-style:dashed;border-color:rgba(47,58,102,.2);box-shadow:none}
      .hgOut.empty .syl{color:rgba(47,58,102,.2)}
      .hgOut.boom{animation:popBig .5s cubic-bezier(.2,1.6,.4,1)}
      .hgOutPic{position:absolute;right:-18%;bottom:-14%;background:#fff;border-radius:22px;padding:6px 10px 4px;box-shadow:0 5px 0 rgba(47,58,102,.15);display:flex;flex-direction:column;align-items:center;font-size:clamp(14px,1.8vw,18px)}
      .hgOutPic .e{font-size:clamp(40px,5vw,60px)}
      .hgFly{position:absolute;z-index:6;pointer-events:none;font-size:clamp(54px,min(9vw,13vh),104px);line-height:1;transition:transform .5s cubic-bezier(.5,0,.4,1),opacity .5s}
      @media (max-aspect-ratio:1/1){.hgMachine{flex-wrap:wrap;align-content:center}.hgOp.eq{flex-basis:100%;text-align:center;height:0;overflow:visible;margin-top:-10px}}
      /* 퀴즈 */
      .hgQ{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,3vh,30px);padding:4px 12px 18px}
      .hgBig{font-size:clamp(90px,min(30vw,17vh),160px);line-height:1;background:#fff;border-radius:34px;padding:6px 36px 14px;box-shadow:var(--shadow);color:var(--c);display:flex;align-items:center;gap:12px}
      .hgBig .e{font-size:.9em}
      .hgBig.ear{font-size:clamp(70px,min(22vw,13vh),120px);cursor:pointer}
      .hgBig.small{font-size:clamp(60px,min(20vw,12vh),110px)}
      .hgBig.yay{animation:jumpA .5s 2}
      .hgAns{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);gap:clamp(12px,2.4vw,26px)}
      @media (max-aspect-ratio:1/1){.hgAns{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .hgOpt{font-size:var(--sz);border-radius:28px}
      .hgOpt.letter{color:var(--ink);font-size:calc(var(--sz) * .9)}
      .hgOpt.word{font-size:calc(var(--sz) * .5);padding:10px 22px;color:var(--ink)}
      .hgStep{font-size:clamp(18px,2.4vw,24px);color:var(--ink2)}
    `);

    /* ---------- 글자 자료 ---------- */
    const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
    ctx.cho = (w) => {
      const c = w.charCodeAt(0) - 0xac00;
      return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : "";
    };
    ctx.jung = (w) => {
      const c = w.charCodeAt(0) - 0xac00;
      return c >= 0 && c < 11172 ? JUNG[Math.floor((c % 588) / 28)] : "";
    };
    /** 자음 + 모음 → 글자 */
    ctx.compose = (c, v) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28);

    // [자음, 이름, [[낱말, 그림], ...]] — 첫 낱말은 받침 없는 첫 글자 위주
    ctx.H = [
      ["ㄱ", "기역", [["기차", "🚂"], ["고양이", "🐱"], ["기린", "🦒"], ["거북이", "🐢"], ["고래", "🐳"], ["가방", "👜"]]],
      ["ㄴ", "니은", [["나비", "🦋"], ["나무", "🌳"], ["눈사람", "⛄"], ["너구리", "🦝"]]],
      ["ㄷ", "디귿", [["다람쥐", "🐿️"], ["도토리", "🌰"], ["돼지", "🐷"], ["돌고래", "🐬"], ["도넛", "🍩"]]],
      ["ㄹ", "리을", [["라디오", "📻"], ["로켓", "🚀"], ["레몬", "🍋"], ["리본", "🎀"], ["라면", "🍜"]]],
      ["ㅁ", "미음", [["모자", "🎩"], ["무지개", "🌈"], ["문어", "🐙"], ["물고기", "🐟"], ["말", "🐴"]]],
      ["ㅂ", "비읍", [["바나나", "🍌"], ["버스", "🚌"], ["비행기", "✈️"], ["별", "⭐"], ["부엉이", "🦉"]]],
      ["ㅅ", "시옷", [["사자", "🦁"], ["사과", "🍎"], ["소", "🐮"], ["수박", "🍉"], ["상어", "🦈"]]],
      ["ㅇ", "이응", [["오리", "🦆"], ["원숭이", "🐵"], ["우산", "☂️"], ["아이스크림", "🍦"], ["양", "🐑"]]],
      ["ㅈ", "지읒", [["자전거", "🚲"], ["자동차", "🚗"], ["지구", "🌍"], ["주스", "🧃"], ["쥐", "🐭"]]],
      ["ㅊ", "치읓", [["치즈", "🧀"], ["치마", "👗"], ["초콜릿", "🍫"], ["체리", "🍒"], ["축구공", "⚽"]]],
      ["ㅋ", "키읔", [["코끼리", "🐘"], ["코알라", "🐨"], ["케이크", "🍰"], ["쿠키", "🍪"], ["카메라", "📷"]]],
      ["ㅌ", "티읕", [["토끼", "🐰"], ["토마토", "🍅"], ["트럭", "🚛"], ["텐트", "⛺"], ["트랙터", "🚜"]]],
      ["ㅍ", "피읖", [["포도", "🍇"], ["피자", "🍕"], ["판다", "🐼"], ["펭귄", "🐧"], ["피아노", "🎹"]]],
      ["ㅎ", "히읗", [["하마", "🦛"], ["호랑이", "🐯"], ["해바라기", "🌻"], ["헬리콥터", "🚁"], ["하트", "❤️"]]],
    ];
    // [모음, 소리, [[낱말, 그림], ...]] — 모음은 이름이 곧 소리
    ctx.V = [
      ["ㅏ", "아", [["아기", "👶"], ["아이스크림", "🍦"]]],
      ["ㅑ", "야", [["야구", "⚾"], ["야자수", "🌴"]]],
      ["ㅓ", "어", [["어묵", "🍢"], ["엄마", "👩"]]],
      ["ㅕ", "여", [["여우", "🦊"], ["여름", "🏖️"]]],
      ["ㅗ", "오", [["오리", "🦆"], ["오이", "🥒"]]],
      ["ㅛ", "요", [["요요", "🪀"], ["요리", "🍳"]]],
      ["ㅜ", "우", [["우유", "🥛"], ["우산", "☂️"]]],
      ["ㅠ", "유", [["유니콘", "🦄"], ["유령", "👻"]]],
      ["ㅡ", "으", [["으르렁", "🦁"], ["으쌰", "💪"]]],
      ["ㅣ", "이", [["이", "🦷"], ["이불", "🛏️"]]],
    ];
    // 글자 합체에서 보여 줄 낱말(그 글자로 시작하는 쉬운 낱말)
    const EXTRA = [
      ["가지", "🍆"], ["고구마", "🍠"], ["구름", "☁️"], ["거미", "🕷️"], ["나무", "🌳"], ["너구리", "🦝"], ["누나", "👧"],
      ["다리", "🦵"], ["도토리", "🌰"], ["라마", "🦙"], ["로봇", "🤖"], ["모기", "🦟"], ["무", "🥕"],
      ["바다", "🌊"], ["비", "🌧️"], ["보라", "💜"], ["사슴", "🦌"], ["소", "🐮"], ["시계", "⏰"], ["아기", "👶"], ["오이", "🥒"],
      ["우유", "🥛"], ["이", "🦷"], ["지도", "🗺️"], ["차", "🚙"], ["치마", "👗"], ["초", "🕯️"],
      ["코", "👃"], ["키위", "🥝"], ["카레", "🍛"], ["토끼", "🐰"], ["포크", "🍴"], ["피아노", "🎹"],
      ["하마", "🦛"], ["호박", "🎃"], ["휴지", "🧻"], ["모자", "🎩"], ["버스", "🚌"], ["새", "🐦"],
    ];
    ctx.WORDS = [];
    ctx.H.forEach((h) => h[2].forEach((w) => ctx.WORDS.push(w)));
    ctx.V.forEach((v) => v[2].forEach((w) => ctx.WORDS.push(w)));
    EXTRA.forEach((w) => ctx.WORDS.push(w));
    /** 이 글자로 시작하는 낱말 (짧은 것 먼저) */
    ctx.wordFor = (syl) => ctx.WORDS.filter((w) => w[0][0] === syl).sort((a, b) => a[0].length - b[0].length)[0] || null;
    ctx.H.forEach(([c, , ws]) => ws.forEach(([w]) => ctx.cho(w) !== c && console.warn("hangul: 첫소리 다름", c, w)));
    ctx.V.forEach(([v, , ws]) => ws.forEach(([w]) => (ctx.jung(w) !== v || ctx.cho(w) !== "ㅇ") && console.warn("hangul: 모음 다름", v, w)));
    ctx.LIKE = ["ㄱㅋㄴ", "ㄷㅌㄹ", "ㅁㅂㅍ", "ㅅㅈㅊ", "ㅇㅎ"];
    ctx.VLIKE = ["ㅏㅓㅑ", "ㅑㅕㅏ", "ㅓㅏㅕ", "ㅕㅑㅓ", "ㅗㅜㅛ", "ㅛㅠㅗ", "ㅜㅗㅠ", "ㅠㅛㅜ", "ㅡㅣㅜ", "ㅣㅡㅏ"];
    ctx.CC = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452", "#2fb466", "#e0564f", "#3a86ff", "#c77dff"];
    ctx.VC = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#2fb466"];
    ctx.nameOfC = (c) => (ctx.H.find((h) => h[0] === c) || [c, c])[1];

    /* ---------- 화면 틀 ---------- */
    const modes = U.el("div", "hgModes");
    ctx.bCons = U.btn('<b class="hgTabCh">ㄱ</b>자음', "hgMode");
    ctx.bVow = U.btn('<b class="hgTabCh">ㅏ</b>모음', "hgMode");
    ctx.bMerge = U.btn(KP.E("🧩") + "글자 합체", "hgMode");
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "hgMode");
    ctx.bWrite = U.btn(KP.E("✍️") + "쓰기", "hgMode");
    modes.append(ctx.bCons, ctx.bVow, ctx.bMerge, ctx.bWrite, ctx.bQuiz);
    ctx.tap(ctx.bWrite, () => {
      KP.audio.sfx("open");
      KP.open("hwrite");
    });
    ctx.tap(ctx.bCons, () => self.mode(ctx, "cons"));
    ctx.tap(ctx.bVow, () => self.mode(ctx, "vow"));
    ctx.tap(ctx.bMerge, () => self.mode(ctx, "merge"));
    ctx.tap(ctx.bQuiz, () => self.mode(ctx, "quiz"));

    // 자음·모음 배우기 화면
    const mkLearn = (list, colors, kind) => {
      const view = U.el("div", "hgView");
      const grid = U.el("div", "hgGrid");
      view.append(grid);
      const cards = list.map((h, i) => {
        const [c, , ws] = h;
        const card = U.btn('<span class="hgCh">' + c + "</span>" + KP.E(ws[0][1]) + '<span class="hgW">' + ws[0][0] + "</span>", "hgCard");
        card.style.setProperty("--c", colors[i]);
        card.style.setProperty("--i", i);
        card.dataset.ch = c;
        ctx.tap(card, () => self.learn(ctx, kind, i, card));
        grid.appendChild(card);
        return card;
      });
      return { view, cards };
    };
    const L1 = mkLearn(ctx.H, ctx.CC, "cons");
    const L2 = mkLearn(ctx.V, ctx.VC, "vow");
    ctx.vCons = L1.view;
    ctx.consCards = L1.cards;
    ctx.vVow = L2.view;
    ctx.vowCards = L2.cards;

    // 크게 보기 (자음·모음 공용, 둘 다의 위에 뜸)
    ctx.spot = U.el("div", "hgSpot");
    ctx.spot.addEventListener("click", (e) => {
      if (e.target === ctx.spot) self.closeSpot(ctx);
    });

    // 글자 합체
    ctx.vMerge = U.el("div", "hgView");
    const mg = U.el("div", "hgMg");
    ctx.consRow = U.el("div", "hgRow cons");
    ctx.consRow.style.setProperty("--n", 14);
    ctx.vowRow = U.el("div", "hgRow vows");
    ctx.vowRow.style.setProperty("--n", 10);
    const machine = U.el("div", "hgMachine");
    ctx.slotC = U.el("div", "hgSlot");
    ctx.slotV = U.el("div", "hgSlot");
    ctx.out = U.el("button", "hgOut empty", '<span class="syl">?</span>');
    machine.append(ctx.slotC, U.el("span", "hgOp", "+"), ctx.slotV, U.el("span", "hgOp eq", "="), ctx.out);
    mg.append(ctx.consRow, machine, ctx.vowRow);
    ctx.vMerge.appendChild(mg);
    ctx.mgC = ctx.H.map((h, i) => {
      const t = U.btn(h[0], "hgT");
      t.style.setProperty("--c", ctx.CC[i]);
      ctx.tap(t, () => self.pickC(ctx, i));
      ctx.consRow.appendChild(t);
      return t;
    });
    ctx.mgV = ctx.V.map((v, i) => {
      const t = U.btn(v[0], "hgT");
      t.style.setProperty("--c", ctx.VC[i]);
      ctx.tap(t, () => self.pickV(ctx, i));
      ctx.vowRow.appendChild(t);
      return t;
    });
    ctx.tap(ctx.out, () => {
      if (ctx.mgSyl) self.sayMerge(ctx);
    });

    // 퀴즈
    ctx.vQuiz = U.el("div", "hgView");
    ctx.q = U.el("div", "hgQ");
    ctx.vQuiz.appendChild(ctx.q);

    ctx.body.append(modes, ctx.vCons, ctx.vVow, ctx.vMerge, ctx.vQuiz, ctx.spot);
  },

  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set();
    ctx.wordIdx = {};
    ctx.suggested = false;
    ctx.mgCi = -1;
    ctx.mgVi = -1;
    ctx.mgSyl = "";
    this.mode(ctx, ctx.level === 1 ? "cons" : "quiz", true);
  },

  mode(ctx, m, first) {
    ctx.m = m;
    ctx.qToken = (ctx.qToken || 0) + 1;
    [["cons", ctx.bCons, ctx.vCons], ["vow", ctx.bVow, ctx.vVow], ["merge", ctx.bMerge, ctx.vMerge], ["quiz", ctx.bQuiz, ctx.vQuiz]].forEach(([k, b, v]) => {
      b.classList.toggle("sel", m === k);
      v.classList.toggle("on", m === k);
    });
    this.closeSpot(ctx, true);
    if (!first) KP.audio.sfx("select");
    ctx.hint(null);
    if (m === "cons" || m === "vow") {
      const cards = m === "cons" ? ctx.consCards : ctx.vowCards;
      ctx.say(m === "cons" ? "자음을 눌러 봐요! 무슨 소리일까요?" : "모음을 눌러 봐요! 아, 야, 어, 여!");
      const hw = KP.store.get("hw:stars", {}) || {};
      ctx.traced = new Set(Object.keys(hw).filter((k) => hw[k]).map((k) => k.slice(1)));
      cards.forEach((c) => {
        c.classList.toggle("seen", ctx.seen.has(c.dataset.ch));
        c.classList.toggle("traced", ctx.traced.has(c.dataset.ch));
      });
      ctx.hint(() => cards.find((c) => !ctx.seen.has(c.dataset.ch)), "글자를 눌러 봐요!");
    } else if (m === "merge") {
      this.mergeReset(ctx);
      ctx.say("🧩 자음 하나, 모음 하나를 골라요. 둘이 만나면 글자가 돼요!");
      ctx.hint(() => ctx.mgC[0], "위에서 자음을 골라 봐요!");
    } else this.quiz(ctx);
  },

  /* ================= 자음 · 모음 배우기 ================= */
  learn(ctx, kind, i, card) {
    const U = KP.u;
    const list = kind === "cons" ? ctx.H : ctx.V;
    const colors = kind === "cons" ? ctx.CC : ctx.VC;
    const [c, nm, ws] = list[i];
    const key = kind + i;
    const k = (ctx.wordIdx[key] = ctx.wordIdx[key] == null ? 0 : (ctx.wordIdx[key] + 1) % ws.length);
    const [w, em] = ws[k];
    ctx.seen.add(c);
    card.classList.add("seen");
    U.replay(card, "wig");
    KP.audio.note(KP.audio.SCALE[i % 8], { inst: "marimba", dur: 0.3, vol: 0.25 });
    ctx.spotCur = { kind, i };
    ctx.spot.style.setProperty("--c", colors[i]);
    ctx.spot.innerHTML = "";
    const box = U.el("div", "hgSpotBox");
    const row = U.el("div", "hgSpotRow");
    const pic = U.btn(KP.E(em) + '<span class="hgW"><b>' + w[0] + "</b>" + w.slice(1) + "</span>", "hgPic");
    row.append(U.el("span", "hgCh", c), pic);
    const btns = U.el("div", "hgBtns");
    const bWrite = U.btn(KP.E("✍️") + "따라 쓰기", "btn big primary");
    const bNext = U.btn(KP.E("🔄") + "다른 낱말", "btn big");
    btns.append(bWrite, bNext);
    box.append(row, btns);
    ctx.spot.appendChild(box);
    ctx.spot.classList.add("on");
    ctx.tap(pic, () => KP.voice.say(w + "! " + w[0] + "!"));
    ctx.tap(bNext, () => this.learn(ctx, kind, i, card));
    ctx.tap(bWrite, () => {
      KP.nbWant = { id: "hwrite", ch: c }; // 쓰기 공책에서 이 글자로 바로
      KP.open("hwrite");
    });
    // "기역! 기차의 기!" / "아! 아기의 아!"
    KP.voice.say(nm + "! " + w + "의 " + w[0] + "!");
    if (ctx.seen.size >= 6 && !ctx.suggested) {
      ctx.suggested = true;
      ctx.after(3200, () => {
        if (ctx.m !== kind) return;
        U.replay(ctx.bMerge, "glow");
        KP.voice.say("글자 박사! 글자 합체도 해 볼까요?");
      });
    }
    ctx.hint(() => (ctx.spot.classList.contains("on") ? bWrite : null), "손가락으로 따라 써 볼까요?");
  },
  closeSpot(ctx, quiet) {
    if (!ctx.spot.classList.contains("on")) return;
    ctx.spot.classList.remove("on");
    if (quiet) return;
    const cards = ctx.m === "cons" ? ctx.consCards : ctx.vowCards;
    ctx.hint(() => (cards || []).find((c) => !ctx.seen.has(c.dataset.ch)) || null, "다른 글자도 눌러 봐요!");
  },

  /* ================= 글자 합체 ================= */
  mergeReset(ctx) {
    ctx.mgCi = -1;
    ctx.mgVi = -1;
    ctx.mgSyl = "";
    ctx.slotC.textContent = "";
    ctx.slotV.textContent = "";
    ctx.slotC.className = "hgSlot";
    ctx.slotV.className = "hgSlot";
    ctx.out.className = "hgOut empty";
    ctx.out.innerHTML = '<span class="syl">?</span>';
    ctx.mgC.forEach((t) => t.classList.remove("sel"));
    ctx.mgV.forEach((t) => t.classList.remove("sel"));
  },
  /** 고른 타일이 칸으로 날아가는 연출 */
  fly(ctx, from, to, text, color) {
    const U = KP.u;
    const host = ctx.vMerge;
    const hr = host.getBoundingClientRect(),
      a = from.getBoundingClientRect(),
      b = to.getBoundingClientRect();
    const f = U.el("div", "hgFly", text);
    f.style.color = color;
    host.appendChild(f);
    const fw = f.offsetWidth,
      fh = f.offsetHeight;
    f.style.left = a.left - hr.left + a.width / 2 - fw / 2 + "px";
    f.style.top = a.top - hr.top + a.height / 2 - fh / 2 + "px";
    requestAnimationFrame(() => {
      f.style.transform = "translate(" + (b.left - a.left + (b.width - a.width) / 2) + "px," + (b.top - a.top + (b.height - a.height) / 2) + "px)";
    });
    setTimeout(() => f.remove(), 520);
  },
  pickC(ctx, i) {
    const [c, nm] = ctx.H[i];
    ctx.mgCi = i;
    ctx.mgC.forEach((t, j) => t.classList.toggle("sel", j === i));
    this.fly(ctx, ctx.mgC[i], ctx.slotC, c, ctx.CC[i]);
    setTimeout(() => {
      ctx.slotC.textContent = c;
      ctx.slotC.style.color = ctx.CC[i];
      ctx.slotC.className = "hgSlot full";
    }, 460);
    KP.audio.sfx("pick");
    if (ctx.mgVi >= 0) setTimeout(() => ctx._active && this.merge(ctx), 560);
    else {
      KP.voice.say(nm + "!");
      ctx.hint(() => ctx.mgV[0], "이번엔 아래에서 모음을 골라요!");
    }
  },
  pickV(ctx, i) {
    const [v, snd] = ctx.V[i];
    ctx.mgVi = i;
    ctx.mgV.forEach((t, j) => t.classList.toggle("sel", j === i));
    this.fly(ctx, ctx.mgV[i], ctx.slotV, v, ctx.VC[i]);
    setTimeout(() => {
      ctx.slotV.textContent = v;
      ctx.slotV.style.color = ctx.VC[i];
      ctx.slotV.className = "hgSlot full";
    }, 460);
    KP.audio.sfx("pick");
    if (ctx.mgCi >= 0) setTimeout(() => ctx._active && this.merge(ctx), 560);
    else {
      KP.voice.say(snd + "!");
      ctx.hint(() => ctx.mgC[0], "위에서 자음도 골라요!");
    }
  },
  merge(ctx) {
    const U = KP.u;
    if (ctx.mgCi < 0 || ctx.mgVi < 0) return;
    const c = ctx.H[ctx.mgCi][0],
      v = ctx.V[ctx.mgVi][0];
    const syl = ctx.compose(c, v);
    ctx.mgSyl = syl;
    ctx.out.className = "hgOut";
    ctx.out.innerHTML = '<span class="syl">' + syl + "</span>";
    const w = ctx.wordFor(syl);
    if (w) ctx.out.appendChild(U.el("span", "hgOutPic", KP.E(w[1]) + "<span>" + w[0] + "</span>"));
    U.replay(ctx.out, "boom");
    KP.audio.sfx("sparkle");
    KP.confetti && KP.confetti(36, ctx.out.getBoundingClientRect().left + ctx.out.offsetWidth / 2, ctx.out.getBoundingClientRect().top + ctx.out.offsetHeight / 2);
    this.sayMerge(ctx);
    ctx.mgCount = (ctx.mgCount || 0) + 1;
    if (ctx.mgCount === 3) ctx.after(2600, () => ctx.m === "merge" && KP.voice.say("모음만 바꿔 봐요! 가, 갸, 거, 겨!"));
    ctx.hint(() => ctx.mgV[(ctx.mgVi + 1) % ctx.mgV.length], "다른 모음도 눌러 봐요!");
  },
  sayMerge(ctx) {
    const nm = ctx.H[ctx.mgCi][1],
      snd = ctx.V[ctx.mgVi][1];
    const w = ctx.wordFor(ctx.mgSyl);
    // "기역에 아 하면, 가! 가지의 가!"
    KP.voice.say(nm + "에 " + snd + " 하면, " + ctx.mgSyl + "!" + (w ? " " + w[0] + "의 " + ctx.mgSyl + "!" : ""));
  },

  /* ================= 퀴즈 ================= */
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const types = lv === 1 ? ["first", "first", "findC"] : lv === 2 ? ["first", "findC", "findV", "hear", "read"] : ["first", "reverse", "findV", "hear", "read", "make"];
    let t = U.pick(types);
    if (t === ctx.lastType && types.length > 1) t = U.pick(types.filter((x) => x !== t));
    ctx.lastType = t;
    ctx.q.innerHTML = "";
    const n = lv === 1 ? 2 : lv === 2 ? 3 : 4;
    if (t === "make") return this.qMake(ctx);
    const cfg = this["q_" + t](ctx, n);
    this.ask(ctx, cfg);
  },
  /** 공통 묻기: cfg = {big, bigCls, color, list, right, render, cls, ask, speak, wrongMsg, sayRight, cl, cp, szl, szp} */
  ask(ctx, cfg) {
    const U = KP.u;
    const self = this;
    const tk = ctx.qToken;
    const big = U.el("div", "hgBig " + (cfg.bigCls || ""));
    big.style.setProperty("--c", cfg.color || "var(--ink)");
    big.innerHTML = cfg.big;
    const ans = U.el("div", "hgAns");
    ans.style.setProperty("--cl", cfg.cl || cfg.list.length);
    ans.style.setProperty("--cp", cfg.cp || (cfg.list.length === 4 ? 2 : Math.min(cfg.list.length, 3)));
    ans.style.setProperty("--szl", cfg.szl || "clamp(70px,min(12vw,22vh),130px)");
    ans.style.setProperty("--szp", cfg.szp || "clamp(64px,22vw,110px)");
    ctx.q.append(big, ans);
    if (cfg.bigCls === "ear") ctx.tap(big, () => KP.voice.say(cfg.speak));
    ctx.say(cfg.bubble || cfg.ask, false);
    ctx.instr = cfg.speak || cfg.ask;
    KP.voice.say(cfg.speak || cfg.ask);
    const btns = ctx.choices(ans, cfg.list, {
      cls: cfg.cls,
      render: cfg.render,
      right: cfg.right,
      wrongMsg: cfg.wrongMsg,
      onRight: async (v, b) => {
        U.replay(big, "yay");
        U.replay(b, "jump");
        KP.audio.sfx("good");
        KP.voice.say(cfg.sayRight(v));
        if (cfg.after) cfg.after(big, v);
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1300);
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "한글 박사 형아!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "quiz" && tk === ctx.qToken) self.quiz(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), cfg.speak || cfg.ask);
  },
  /** 그림 보고 첫 자음: "기역으로 시작하는 건?" */
  q_first(ctx, n) {
    const U = KP.u;
    const ti = this.pickIdx(ctx);
    const [c, nm, ws] = ctx.H[ti];
    const t = U.pick(ws);
    const others = U.sample(ctx.H.filter((h) => h[0] !== c), n - 1).map((h) => U.pick(h[2]).concat([h[1]]));
    const ask = U.josa(nm, "으로/로") + " 시작하는 건 뭘까요?";
    return {
      big: c,
      color: ctx.CC[ti],
      list: U.shuffle([t.concat([nm]), ...others]),
      right: (v) => v[0] === t[0],
      render: (v) => KP.E(v[1]),
      cls: "hgOpt",
      bubble: c + " " + ask,
      ask,
      wrongMsg: (v) => "이건 " + U.josa(v[0], "이에요/예요") + ". " + U.josa(v[0], "은/는") + " " + U.josa(v[2], "으로/로") + " 시작해요!",
      sayRight: (v) => nm + "! " + v[0] + "!",
      cl: n,
      cp: n === 3 ? 3 : 2,
      szp: n === 3 ? "clamp(64px,22vw,96px)" : "clamp(70px,30vw,120px)",
    };
  },
  pickIdx(ctx) {
    let i = KP.u.rand(ctx.H.length);
    if (i === ctx.lastI) i = (i + 1) % ctx.H.length;
    ctx.lastI = i;
    return i;
  },
  /** 그림 보고 첫 글자(자음) 고르기 — 모양이 닮은 글자끼리 */
  q_reverse(ctx, n) {
    const U = KP.u;
    const ti = this.pickIdx(ctx);
    const [c, nm, ws] = ctx.H[ti];
    const t = U.pick(ws);
    const like = (ctx.LIKE.find((g) => g.includes(c)) || "").replace(c, "");
    const pool = [...like].concat(U.shuffle(ctx.H.map((h) => h[0]).filter((x) => x !== c && !like.includes(x))));
    const ask = U.josa(t[0], "은/는") + " 무슨 글자로 시작할까요?";
    return {
      big: KP.E(t[1]),
      list: U.shuffle([c, ...pool.slice(0, Math.min(3, n - 1))]),
      right: (v) => v === c,
      render: (v) => v,
      cls: "hgOpt letter",
      bubble: "❓ " + ask,
      ask,
      wrongMsg: (v) => "이건 " + U.josa(ctx.nameOfC(v), "이에요/예요") + ". " + t[0] + "! 첫 소리를 들어 봐요!",
      sayRight: () => t[0] + "! " + U.josa(nm, "으로/로") + " 시작해요!",
      szl: "clamp(80px,min(12vw,22vh),130px)",
      szp: "clamp(70px,22vw,96px)",
    };
  },
  /** 자음 이름 듣고 찾기: "니은을 찾아요!" */
  q_findC(ctx, n) {
    const U = KP.u;
    const ti = this.pickIdx(ctx);
    const [c, nm] = ctx.H[ti];
    const like = (ctx.LIKE.find((g) => g.includes(c)) || "").replace(c, "");
    const pool = U.shuffle([...like]).concat(U.shuffle(ctx.H.map((h) => h[0]).filter((x) => x !== c && !like.includes(x))));
    const speak = U.josa(nm, "을/를") + " 찾아요!";
    return {
      big: KP.E("👂"),
      bigCls: "ear",
      speak,
      ask: speak,
      bubble: speak,
      list: U.shuffle([c, ...pool.slice(0, n - 1)]),
      right: (v) => v === c,
      render: (v) => v,
      cls: "hgOpt letter",
      wrongMsg: (v) => "이건 " + U.josa(ctx.nameOfC(v), "이에요/예요") + ". " + U.josa(nm, "을/를") + " 찾아 봐요!",
      sayRight: () => nm + "! 맞아요!",
      szl: "clamp(80px,min(12vw,22vh),130px)",
      szp: "clamp(70px,22vw,96px)",
    };
  },
  /** 모음 소리 듣고 찾기: "오를 찾아요!" — 닮은 모음끼리 */
  q_findV(ctx, n) {
    const U = KP.u;
    let vi = U.rand(ctx.V.length);
    if (vi === ctx.lastV) vi = (vi + 1) % ctx.V.length;
    ctx.lastV = vi;
    const [v, snd, ws] = ctx.V[vi];
    const like = (ctx.VLIKE.find((g) => g[0] === v) || "").slice(1);
    const pool = [...like].concat(U.shuffle(ctx.V.map((x) => x[0]).filter((x) => x !== v && !like.includes(x))));
    const speak = U.josa(snd, "을/를") + " 찾아요! " + ws[0][0] + "의 " + snd + "!";
    const nameV = (x) => ctx.V.find((y) => y[0] === x)[1];
    return {
      big: KP.E("👂"),
      bigCls: "ear",
      speak,
      ask: speak,
      bubble: U.josa(snd, "을/를") + " 찾아요!",
      list: U.shuffle([v, ...pool.slice(0, n - 1)]),
      right: (x) => x === v,
      render: (x) => x,
      cls: "hgOpt letter",
      wrongMsg: (x) => "이건 " + U.josa(nameV(x), "이에요/예요") + ". " + U.josa(snd, "을/를") + " 찾아 봐요!",
      sayRight: () => snd + "! " + ws[0][0] + "의 " + snd + "!",
      szl: "clamp(80px,min(12vw,22vh),130px)",
      szp: "clamp(70px,22vw,96px)",
    };
  },
  /** 글자 듣고 찾기: "나를 찾아요!" — 같은 모음, 다른 자음 (나·다·라) */
  q_hear(ctx, n) {
    const U = KP.u;
    const vi = U.rand(5); // ㅏ ㅑ ㅓ ㅕ ㅗ 위주(쉬운 소리)
    const v = ["ㅏ", "ㅗ", "ㅜ", "ㅣ", "ㅓ"][vi];
    const cs = U.sample(ctx.H.map((h) => h[0]), n);
    const target = ctx.compose(cs[0], v);
    const list = U.shuffle(cs.map((c) => ctx.compose(c, v)));
    const speak = U.josa(target, "을/를") + " 찾아요!";
    const w = ctx.wordFor(target);
    return {
      big: KP.E("👂"),
      bigCls: "ear",
      speak,
      ask: speak,
      bubble: speak,
      list,
      right: (x) => x === target,
      render: (x) => x,
      cls: "hgOpt letter",
      wrongMsg: (x) => "이건 " + U.josa(x, "이에요/예요") + ". " + U.josa(target, "을/를") + " 찾아 봐요!",
      sayRight: () => target + "!" + (w ? " " + w[0] + "의 " + target + "!" : ""),
      after: (big) => {
        if (w) big.innerHTML = KP.E(w[1]) + "<span>" + target + "</span>";
      },
      szl: "clamp(80px,min(12vw,22vh),130px)",
      szp: "clamp(70px,22vw,96px)",
    };
  },
  /** 그림 보고 낱말 읽기: 첫 글자가 서로 다른 낱말들 중에서 */
  q_read(ctx, n) {
    const U = KP.u;
    const pool = U.shuffle(ctx.WORDS.filter((w) => w[0].length <= 3));
    const picked = [];
    for (const w of pool) {
      if (picked.length >= Math.min(n, 3)) break;
      if (picked.some((p) => p[0][0] === w[0][0] || p[1] === w[1])) continue;
      picked.push(w);
    }
    const t = picked[0];
    const ask = "이건 뭘까요? 글자를 찾아요!";
    return {
      big: KP.E(t[1]),
      list: U.shuffle(picked),
      right: (v) => v[0] === t[0],
      render: (v) => v[0],
      cls: "hgOpt word",
      bubble: "❓ " + ask,
      ask,
      wrongMsg: (v) => "이건 " + U.josa(v[0], "이에요/예요") + ". 첫 글자를 잘 봐요! " + t[0][0] + "!",
      sayRight: () => t[0] + "! " + U.josa(t[0][0], "으로/로") + " 시작해요!",
      cl: picked.length,
      cp: 1,
      szl: "clamp(80px,min(12vw,20vh),120px)",
      szp: "clamp(80px,24vw,110px)",
    };
  },
  /** 글자 만들기: 목표 글자를 듣고 자음 → 모음 순서로 골라 합체 */
  qMake(ctx) {
    const U = KP.u;
    const self = this;
    const tk = ctx.qToken;
    const ci = U.rand(ctx.H.length),
      vi = U.rand(5);
    const [c, nm] = ctx.H[ci];
    const [v, snd] = ctx.V[[0, 2, 4, 6, 8][vi]]; // ㅏ ㅓ ㅗ ㅜ ㅡ (기본 모음)
    const target = ctx.compose(c, v);
    const big = U.el("div", "hgBig ear");
    big.innerHTML = KP.E("👂") + "<span>" + target + "</span>";
    const step = U.el("div", "hgStep");
    const ans = U.el("div", "hgAns");
    ans.style.setProperty("--cl", 3);
    ans.style.setProperty("--cp", 3);
    ans.style.setProperty("--szl", "clamp(80px,min(12vw,20vh),120px)");
    ans.style.setProperty("--szp", "clamp(70px,22vw,96px)");
    ctx.q.append(big, step, ans);
    const speak = U.josa(target, "을/를") + " 만들어 봐요! 먼저 자음!";
    ctx.say("🧩 " + U.josa(target, "을/를") + " 만들어 봐요!", false);
    ctx.instr = speak;
    KP.voice.say(speak);
    ctx.tap(big, () => KP.voice.say(target + "!"));
    step.textContent = "① 자음을 골라요";
    const like = (ctx.LIKE.find((g) => g.includes(c)) || "").replace(c, "");
    const cPool = U.shuffle([...like]).concat(U.shuffle(ctx.H.map((h) => h[0]).filter((x) => x !== c && !like.includes(x))));
    const b1 = ctx.choices(ans, U.shuffle([c, ...cPool.slice(0, 2)]), {
      cls: "hgOpt letter",
      render: (x) => x,
      right: (x) => x === c,
      wrongMsg: (x) => U.josa(target, "은/는") + " " + U.josa(nm, "으로/로") + " 시작해요!",
      onRight: async () => {
        KP.audio.sfx("good");
        KP.voice.say(nm + "! 이번엔 모음!");
        await ctx.wait(700);
        if (tk !== ctx.qToken) return;
        step.textContent = "② 모음을 골라요";
        const like2 = (ctx.VLIKE.find((g) => g[0] === v) || "").slice(1);
        const b2 = ctx.choices(ans, U.shuffle([v, ...like2.slice(0, 2)]), {
          cls: "hgOpt letter",
          render: (x) => x,
          right: (x) => x === v,
          wrongMsg: () => target + "! " + snd + " 소리를 찾아요!",
          onRight: async () => {
            big.innerHTML = '<span style="color:var(--grape)">' + c + "</span>+" + '<span style="color:var(--ocean)">' + v + "</span>=<span>" + target + "</span>";
            U.replay(big, "yay");
            KP.audio.sfx("sparkle");
            KP.voice.say(nm + "에 " + snd + " 하면, " + target + "!");
            ctx.score.add();
            ctx.round++;
            await ctx.wait(1600);
            const bg = ctx.round % 5 === 0;
            const ok = await ctx.win({ big: bg, msg: bg ? "한글 박사 형아!" : "글자 완성!", quiet: !bg });
            if (ok && ctx.m === "quiz" && tk === ctx.qToken) self.quiz(ctx);
          },
        });
        ctx.hint(() => b2.find((b) => b.dataset.right), snd + " 소리를 찾아요!");
      },
    });
    ctx.hint(() => b1.find((b) => b.dataset.right), U.josa(target, "은/는") + " " + U.josa(nm, "으로/로") + " 시작해요!");
  },
});
