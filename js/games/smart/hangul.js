/* 한글 놀이 — 위쪽 버튼: [자음] [모음] [글자 합체 → 새 놀이 hmerge] [쓰기 → hwrite] [퀴즈]
   만 3~4세 발달 단계에 맞춰 '받아쓰기'나 정답 강요 없이 놀면서 익히는 구성.
   - 자음/모음: 카드를 누르면 크게 보여 주고 이름 + 낱말 첫소리("기역! 고양이의 고!").
     크게 본 화면에서 [따라 쓰기](획 순서 안내, 순서 틀려도 괜찮음) · [다른 낱말]
   - 글자 합체: 따로 떨어진 놀이 '글자 합체'(hmerge.js)로 옮김 — 버튼은 그 놀이를 엶(숨긴 놀이면 버튼도 숨김).
   - 퀴즈(단계별): 1단계 첫소리 그림 찾기·자음 찾기(보기 2개)
                   2단계 + 모음 찾기·글자 듣고 찾기·낱말 읽기(보기 3개)
                   3단계 + 그림 보고 첫 글자(보기 4개) — '글자 만들기'는 글자 합체 2단계로 옮김
   KP.hangul: 자음·모음 표와 글자 합치기 도우미(이 파일이 내보내고 hmerge.js 가 setup 때 읽음) */
"use strict";
/* ---------- 공용 한글 자료 KP.hangul ----------
   H: [자음, 이름, [[낱말, 그림]...]] · V: [모음, 소리, [[낱말, 그림]...]] (자음 14 · 모음 10, 표 순서)
   compose(초성, 중성[, 종성]) → 글자 · cho/jung/jong(글자) → 자모 · wordFor(글자) → 그 글자로 시작하는 낱말
   LIKE/VLIKE: 모양이 닮은 자음·모음 묶음(보기 섞기용) */
KP.hangul = (function () {
  const D = {};
  const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

  const CHO = (D.CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ");
  const JUNG = (D.JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ");
  D.cho = (w) => {
    const c = w.charCodeAt(0) - 0xac00;
    return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : "";
  };
  D.jung = (w) => {
    const c = w.charCodeAt(0) - 0xac00;
    return c >= 0 && c < 11172 ? JUNG[Math.floor((c % 588) / 28)] : "";
  };
  /** 받침 자음 (없으면 "") */
  D.jong = (w) => {
    const c = w.charCodeAt(0) - 0xac00;
    return c >= 0 && c < 11172 ? JONG[c % 28] : "";
  };
  /** 자음 + 모음 (+ 받침) → 글자 */
  D.compose = (c, v, j) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + (j ? Math.max(0, JONG.indexOf(j)) : 0));
  /** 세로 모음(ㅏㅑㅓㅕㅣ: 자음 오른쪽)인가 — 아니면 가로 모음(ㅗㅛㅜㅠㅡ: 자음 아래) */
  D.isTall = (v) => "ㅏㅐㅑㅒㅓㅔㅕㅖㅣ".includes(v);

  // [자음, 이름, [[낱말, 그림], ...]] — 첫 낱말은 받침 없는 첫 글자 위주
  D.H = [
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
  D.V = [
    ["ㅏ", "아", [["아기", "👶"], ["아이스크림", "🍦"]]],
    ["ㅑ", "야", [["야구", "⚾"], ["야자수", "🌴"]]],
    ["ㅓ", "어", [["어묵", "🍢"], ["엄마", "👩"]]],
    ["ㅕ", "여", [["여우", "🦊"], ["여름", "🏖️"]]],
    ["ㅗ", "오", [["오리", "🦆"], ["오이", "🥒"]]],
    ["ㅛ", "요", [["요요", "🪀"], ["요리", "🍳"]]],
    ["ㅜ", "우", [["우유", "🥛"], ["우산", "☂️"]]],
    ["ㅠ", "유", [["유니콘", "🦄"], ["유령", "👻"]]],
    ["ㅡ", "으", [["으르렁", "🦁"], ["으쌰", "💪"]]],
    ["ㅣ", "이", [["이불", "🛏️"], ["이", "🦷"]]],
  ];
  // 글자 합체·퀴즈에서 보여 줄 낱말(그 글자로 시작하는 쉬운 낱말)
  const EXTRA = [
    ["가지", "🍆"], ["고구마", "🍠"], ["구름", "☁️"], ["거미", "🕷️"], ["나무", "🌳"], ["너구리", "🦝"], ["누나", "👧"],
    ["다리", "🦵"], ["도토리", "🌰"], ["라마", "🦙"], ["로봇", "🤖"], ["모기", "🦟"], ["무", "🥕"],
    ["바다", "🌊"], ["비", "🌧️"], ["보라", "💜"], ["사슴", "🦌"], ["소", "🐮"], ["시계", "⏰"], ["아기", "👶"], ["오이", "🥒"],
    ["우유", "🥛"], ["이", "🦷"], ["지도", "🗺️"], ["차", "🚙"], ["치마", "👗"], ["초", "🕯️"],
    ["코", "👃"], ["키위", "🥝"], ["카레", "🍛"], ["토끼", "🐰"], ["포크", "🍴"], ["피아노", "🎹"],
    ["하마", "🦛"], ["호박", "🎃"], ["휴지", "🧻"], ["모자", "🎩"], ["버스", "🚌"], ["새", "🐦"],
  ];
  D.WORDS = [];
  D.H.forEach((h) => h[2].forEach((w) => D.WORDS.push(w)));
  D.V.forEach((v) => v[2].forEach((w) => D.WORDS.push(w)));
  EXTRA.forEach((w) => D.WORDS.push(w));
  /** 이 글자로 시작하는 낱말 (짧은 것 먼저) */
  D.wordFor = (syl) => D.WORDS.filter((w) => w[0][0] === syl).sort((a, b) => a[0].length - b[0].length)[0] || null;
  D.H.forEach(([c, , ws]) => ws.forEach(([w]) => D.cho(w) !== c && console.warn("hangul 자료: 첫소리 다름", c, w)));
  D.V.forEach(([v, , ws]) => ws.forEach(([w]) => (D.jung(w) !== v || D.cho(w) !== "ㅇ") && console.warn("hangul 자료: 모음 다름", v, w)));
  D.LIKE = ["ㄱㅋㄴ", "ㄷㅌㄹ", "ㅁㅂㅍ", "ㅅㅈㅊ", "ㅇㅎ"];
  D.VLIKE = ["ㅏㅓㅑ", "ㅑㅕㅏ", "ㅓㅏㅕ", "ㅕㅑㅓ", "ㅗㅜㅛ", "ㅛㅠㅗ", "ㅜㅗㅠ", "ㅠㅛㅜ", "ㅡㅣㅜ", "ㅣㅡㅏ"];
  D.CC = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452", "#2fb466", "#e0564f", "#3a86ff", "#c77dff"];
  D.VC = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#2fb466"];
  D.nameOfC = (c) => (D.H.find((h) => h[0] === c) || [c, c])[1];
  D.nameOfV = (v) => (D.V.find((x) => x[0] === v) || [v, v])[1];
  return D;
})();

KP.game({
  id: "hangul",
  icon: "📖",
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
      @media (orientation:portrait) and (max-width:480px){.hgModes{flex-wrap:wrap;gap:6px;padding:6px 4px 4px}.hgMode{font-size:16px;padding:4px 10px;min-height:44px;border-width:3px;gap:3px;flex:1 1 auto;justify-content:center}}
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
    `);

    /* ---------- 글자 자료 (KP.hangul 공용) ---------- */
    const D = KP.hangul;
    ["cho", "jung", "compose", "H", "V", "WORDS", "wordFor", "LIKE", "VLIKE", "CC", "VC", "nameOfC"].forEach((k) => (ctx[k] = D[k]));

    /* ---------- 화면 틀 ---------- */
    const modes = U.el("div", "hgModes");
    ctx.bCons = U.btn('<b class="hgTabCh">ㄱ</b>자음', "hgMode");
    ctx.bVow = U.btn('<b class="hgTabCh">ㅏ</b>모음', "hgMode");
    ctx.bMerge = U.btn(KP.E("🧲") + "글자 합체", "hgMode"); // 새 놀이 '글자 합체'(hmerge)로
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "hgMode");
    ctx.bWrite = U.btn(KP.E("✍️") + "쓰기", "hgMode");
    modes.append(ctx.bCons, ctx.bVow, ctx.bMerge, ctx.bWrite, ctx.bQuiz);
    ctx.tap(ctx.bWrite, () => {
      KP.audio.sfx("open");
      KP.open("hwrite");
    });
    ctx.tap(ctx.bCons, () => self.mode(ctx, "cons"));
    ctx.tap(ctx.bVow, () => self.mode(ctx, "vow"));
    ctx.tap(ctx.bMerge, () => {
      KP.audio.sfx("open");
      KP.open("hmerge");
    });
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

    // 퀴즈
    ctx.vQuiz = U.el("div", "hgView");
    ctx.q = U.el("div", "hgQ");
    ctx.vQuiz.appendChild(ctx.q);

    ctx.body.append(modes, ctx.vCons, ctx.vVow, ctx.vQuiz, ctx.spot);
  },

  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set();
    ctx.wordIdx = {};
    ctx.suggested = false;
    // 설정에서 '글자 합체' 놀이를 숨겼으면 바로 가는 버튼·권유도 숨김
    ctx.bMerge.style.display = this.mergeOn() ? "" : "none";
    this.mode(ctx, ctx.level === 1 ? "cons" : "quiz", true);
  },

  mode(ctx, m, first) {
    ctx.m = m;
    ctx.qToken = (ctx.qToken || 0) + 1;
    [["cons", ctx.bCons, ctx.vCons], ["vow", ctx.bVow, ctx.vVow], ["quiz", ctx.bQuiz, ctx.vQuiz]].forEach(([k, b, v]) => {
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
    } else this.quiz(ctx);
  },

  /** 글자 합체 놀이로 가는 길이 열려 있나 (놀이가 있고 설정에서 숨기지 않음) */
  mergeOn() {
    return !!KP.GAMES.hmerge && !(KP.settings.get().hidden || {}).hmerge;
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
    if (ctx.seen.size >= 6 && !ctx.suggested && this.mergeOn()) {
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

  /* ================= 퀴즈 ================= */
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const types = lv === 1 ? ["first", "first", "findC"] : lv === 2 ? ["first", "findC", "findV", "hear", "read"] : ["first", "reverse", "findV", "hear", "read"];
    let t = U.pick(types);
    if (t === ctx.lastType && types.length > 1) t = U.pick(types.filter((x) => x !== t));
    ctx.lastType = t;
    ctx.q.innerHTML = "";
    const n = lv === 1 ? 2 : lv === 2 ? 3 : 4;
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
        if (tk !== ctx.qToken) return; // 그새 모드를 바꿨으면 지난 판 축하 안 함
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "{부름} 한글 박사!" : "딩동댕!", quiet: !bg });
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

});
