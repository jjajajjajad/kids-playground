/* 자동 생성 — tools/build.js 묶음. 고치려면 원본(24개)을 고치고 다시 빌드 */

/* ==== js/games/smart/abc.js ==== */
/* ABC 놀이 — 위쪽 버튼으로 [배우기]/[퀴즈] 전환. (1단계는 배우기로, 2단계부터 퀴즈로 시작)
   배우기: A~Z 카드(대문자·소문자+그림+낱말). 누르면 크게 나오며 영어 발음 "A! Apple!"
           크게 본 카드는 바깥을 누를 때까지 그대로 — [따라 쓰기](ABC 쓰기 공책) · [다른 낱말] · 그림을 누르면 다시 읽기
   퀴즈 1단계: "Find A!" 글자 2개
   퀴즈 2단계(보기 3개): 글자 이름 듣고 찾기 · 그림 보고 첫 글자(낱말의 첫 글자를 ?로 가림) · 소문자 보고 짝꿍 대문자
   퀴즈 3단계(보기 4개): 위 세 가지 + 모양이 닮은 글자(E·F·H, O·Q·C·G …)
   안내는 영어 + 한국어("에이를 찾아요!") 함께 */
"use strict";
KP.game({
  id: "abc",
  icon: "🔤",
  name: "ABC 놀이",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("abc", `
      .abModes{display:flex;gap:10px;justify-content:center;padding:8px 10px 6px;flex:0 0 auto;flex-wrap:wrap}
      @media (max-width:560px){.abModes{gap:5px;padding:8px 4px 4px;flex-wrap:nowrap}.abMode{font-size:14px !important;padding:3px 9px !important;min-height:64px !important;white-space:nowrap}.abMode .e{display:none}}
      .abMode{font-size:clamp(18px,2.4vw,24px);background:rgba(255,255,255,.7);border-radius:999px;padding:8px 22px;min-height:64px;display:flex;align-items:center;gap:8px;border-bottom:5px solid transparent}
      .abMode .e{font-size:1.4em}
      .abMode.sel{background:#fff;border-bottom-color:var(--cat);color:var(--cat);box-shadow:var(--shadow)}
      @media (orientation:portrait) and (max-width:480px){.abModes{flex-wrap:wrap;gap:6px;padding:6px 4px 4px}.abMode{font-size:16px !important;padding:4px 12px !important;min-height:64px !important;flex:1 1 auto;justify-content:center}}
      .abMode.glow{animation:glow 1s ease-in-out 3}
      .abView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
      .abView.on{display:flex}
      .abGrid{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(100px,12vw,130px),1fr));gap:clamp(10px,1.4vw,14px);padding:6px clamp(10px,2vw,22px) 24px;align-content:start}
      .abCard{position:relative;background:#fff;border-radius:24px;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 6px 0 color-mix(in srgb,var(--c) 55%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff);
        animation:itemIn .35s backwards;animation-delay:calc(var(--i)*20ms);font-family:var(--font)}
      .abCard:active{transform:translateY(4px)}
      .abCh{font-size:clamp(40px,5.4vw,58px);line-height:1;color:var(--c);letter-spacing:1px}
      .abCh small{font-size:.62em}
      .abCard .e{font-size:clamp(30px,4vw,42px)}
      .abCard .abW{font-size:clamp(15px,1.8vw,18px)}
      .abCard.seen::after{content:"";position:absolute;top:8px;right:8px;width:12px;height:12px;border-radius:50%;background:var(--sun)}
      .abSpot{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .2s;z-index:5}
      .abSpot.on{opacity:1;pointer-events:auto;background:rgba(255,255,255,.55)}
      .abSpotBox{display:flex;flex-direction:column;align-items:center;gap:clamp(8px,2vh,16px);background:#fff;border-radius:40px;padding:clamp(14px,3vw,30px) clamp(20px,4vw,50px);box-shadow:0 10px 0 rgba(47,58,102,.15),0 20px 60px rgba(47,58,102,.25);border:6px solid var(--c);max-width:94%}
      .abSpotRow{display:flex;align-items:center;gap:clamp(10px,3vw,40px)}
      .abSpotPic{display:flex;flex-direction:column;align-items:center;border-radius:28px;padding:4px 10px;background:transparent;box-shadow:none}
      .abSpotBtns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
      .abBig .abHintW{font-size:.32em;color:var(--ink);letter-spacing:1px}
      .abBig .abHintW b{color:var(--coral);font-weight:400}
      .abBig .abLow{color:var(--c);font-size:.95em}
      .abSpot.on .abSpotBox{animation:popBig .45s cubic-bezier(.2,1.6,.4,1)}
      .abSpotBox .abCh{font-size:clamp(100px,15vw,180px)}
      .abSpotPic .e{font-size:clamp(90px,min(13vw,22vh),160px)}
      .abSpotBox .abW{font-size:clamp(28px,4vw,46px);display:block;text-align:center}
      @media (max-aspect-ratio:1/1){.abSpotRow{flex-direction:column;gap:6px}}
      @media (max-height:500px){.abSpotBox .abCh{font-size:clamp(70px,22vh,120px)}.abSpotPic .e{font-size:clamp(60px,20vh,110px)}.abSpotBox .abW{font-size:24px}}
      .abQ{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,3vh,30px);padding:4px 12px 18px}
      .abBig{font-size:clamp(90px,min(30vw,17vh),160px);line-height:1;background:#fff;border-radius:34px;padding:10px 36px;box-shadow:var(--shadow);display:flex;align-items:center;gap:12px}
      .abBig.yay{animation:jumpA .5s 2}
      .abBig .abSay{font-size:.4em;color:var(--ocean)}
      .abAns{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);gap:clamp(12px,2.4vw,26px)}
      @media (max-aspect-ratio:1/1){.abAns{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .abOpt{font-size:var(--sz);border-radius:28px;color:var(--c);min-width:calc(var(--sz) * 1.5)}
      /* 단어 만들기 */
      .abSp{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,3vh,28px);padding:6px 12px 18px}
      .abSpPic{font-size:clamp(90px,min(16vw,22vh),170px);line-height:1;background:#fff;border-radius:34px;padding:10px 28px;box-shadow:var(--shadow);cursor:pointer}
      .abSpPic.yay{animation:jumpA .5s 2}
      .abSlots{display:flex;gap:clamp(8px,1.6vw,16px)}
      .abSlot{width:clamp(64px,min(10vw,13vh),104px);aspect-ratio:1;border-radius:20px;border:4px dashed rgba(47,58,102,.25);background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;font-size:clamp(46px,min(7vw,9vh),76px);line-height:1;color:rgba(47,58,102,.18)}
      .abSlot.full{border:4px solid #fff;background:#fff;color:var(--c);box-shadow:0 5px 0 rgba(47,58,102,.12);animation:popIn .3s}
      .abSlot.next{border-color:var(--star)}
      .abTiles{display:flex;gap:clamp(8px,1.6vw,16px);flex-wrap:wrap;justify-content:center}
      .abTile{width:clamp(64px,min(10vw,13vh),100px);aspect-ratio:1;border-radius:22px;background:#fff;font-size:clamp(44px,min(6.4vw,8.5vh),70px);color:var(--c);box-shadow:0 6px 0 color-mix(in srgb,var(--c) 45%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff);line-height:1}
      .abTile.used{visibility:hidden}
    `);
    // [글자, 한국어로 읽기, [[낱말, 그림], ...]]
    ctx.L = [
      ["A", "에이", [["Apple", "🍎"], ["Ant", "🐜"], ["Airplane", "✈️"]]], ["B", "비", [["Bear", "🐻"], ["Banana", "🍌"], ["Bus", "🚌"]]],
      ["C", "씨", [["Cat", "🐱"], ["Car", "🚗"], ["Cake", "🍰"]]], ["D", "디", [["Dog", "🐶"], ["Duck", "🦆"], ["Dolphin", "🐬"]]],
      ["E", "이", [["Elephant", "🐘"], ["Egg", "🥚"]]], ["F", "에프", [["Fish", "🐟"], ["Frog", "🐸"], ["Fox", "🦊"]]],
      ["G", "지", [["Grapes", "🍇"], ["Giraffe", "🦒"], ["Gift", "🎁"]]], ["H", "에이치", [["Hat", "🎩"], ["Horse", "🐴"], ["Helicopter", "🚁"]]],
      ["I", "아이", [["Ice cream", "🍦"], ["Island", "🏝️"]]], ["J", "제이", [["Juice", "🧃"], ["Jellyfish", "🪼"]]],
      ["K", "케이", [["Kite", "🪁"], ["Koala", "🐨"], ["Key", "🔑"]]], ["L", "엘", [["Lion", "🦁"], ["Lemon", "🍋"], ["Leaf", "🍃"]]],
      ["M", "엠", [["Monkey", "🐵"], ["Moon", "🌙"], ["Milk", "🥛"]]], ["N", "엔", [["Nest", "🪺"], ["Nose", "👃"], ["Nut", "🥜"]]],
      ["O", "오", [["Orange", "🍊"], ["Octopus", "🐙"], ["Owl", "🦉"]]], ["P", "피", [["Pig", "🐷"], ["Panda", "🐼"], ["Pizza", "🍕"]]],
      ["Q", "큐", [["Queen", "👸"]]], ["R", "알", [["Rabbit", "🐰"], ["Rocket", "🚀"], ["Rainbow", "🌈"]]],
      ["S", "에스", [["Sun", "☀️"], ["Star", "⭐"], ["Snail", "🐌"]]], ["T", "티", [["Tiger", "🐯"], ["Train", "🚂"], ["Turtle", "🐢"]]],
      ["U", "유", [["Umbrella", "☂️"], ["Unicorn", "🦄"]]], ["V", "브이", [["Violin", "🎻"], ["Volcano", "🌋"]]],
      ["W", "더블유", [["Whale", "🐳"], ["Watermelon", "🍉"], ["Watch", "⌚"]]], ["X", "엑스", [["X-ray", "🩻"]]],
      ["Y", "와이", [["Yo-yo", "🪀"]]], ["Z", "지", [["Zebra", "🦓"]]],
    ];
    ctx.L[25][1] = "제트";
    ctx.LIKE = ["EFH", "OQCG", "MNW", "PRB", "ILT", "UVY", "KXY", "DOQ", "AVW"];
    ctx.CC = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2"];
    const modes = U.el("div", "abModes");
    ctx.bLearn = U.btn(KP.E("📖") + "배우기", "abMode");
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "abMode");
    ctx.bSpell = U.btn(KP.E("🧩") + "단어 만들기", "abMode");
    ctx.bWrite = U.btn(KP.E("🖊️") + "쓰기", "abMode");
    modes.append(ctx.bLearn, ctx.bSpell, ctx.bWrite, ctx.bQuiz);
    ctx.tap(ctx.bSpell, () => this.mode(ctx, "spell"));
    ctx.tap(ctx.bWrite, () => {
      KP.audio.sfx("open");
      // 마지막으로 본 알파벳이 있으면 쓰기 공책에서 그 글자로 바로
      if (ctx.lastSeen != null) KP.nbWant = { id: "awrite", ch: ctx.L[ctx.lastSeen][0] };
      KP.open("awrite");
    });
    ctx.tap(ctx.bLearn, () => this.mode(ctx, "learn"));
    ctx.tap(ctx.bQuiz, () => this.mode(ctx, "quiz"));
    ctx.vLearn = U.el("div", "abView");
    ctx.grid = U.el("div", "abGrid");
    ctx.spot = U.el("div", "abSpot");
    // 크게 본 카드: 바깥(흐린 곳)을 누르면 닫힘 — 예전처럼 2.2초 만에 저절로 닫히지 않음
    ctx.spot.addEventListener("click", (e) => {
      if (e.target === ctx.spot) this.closeSpot(ctx);
    });
    ctx.vLearn.append(ctx.grid, ctx.spot);
    ctx.cards = ctx.L.map((l, i) => {
      const [c, , ws] = l;
      const card = U.btn('<span class="abCh">' + c + "<small>" + c.toLowerCase() + "</small></span>" + KP.E(ws[0][1]) + '<span class="abW">' + ws[0][0] + "</span>", "abCard");
      card.style.setProperty("--c", ctx.CC[i % ctx.CC.length]);
      card.style.setProperty("--i", i);
      ctx.tap(card, () => this.learn(ctx, i, card));
      ctx.grid.appendChild(card);
      return card;
    });
    ctx.vQuiz = U.el("div", "abView");
    ctx.q = U.el("div", "abQ");
    ctx.vQuiz.appendChild(ctx.q);
    // 단어 만들기
    ctx.vSpell = U.el("div", "abView");
    ctx.sp = U.el("div", "abSp");
    ctx.vSpell.appendChild(ctx.sp);
    ctx.WORDS = [
      ["cat", "🐱"], ["dog", "🐶"], ["sun", "☀️"], ["pig", "🐷"], ["bus", "🚌"], ["hat", "🎩"], ["egg", "🥚"], ["fox", "🦊"],
      ["bee", "🐝"], ["cow", "🐮"], ["car", "🚗"], ["box", "📦"], ["fish", "🐟"], ["frog", "🐸"], ["duck", "🦆"], ["star", "⭐"],
    ];
    ctx.body.append(modes, ctx.vLearn, ctx.vSpell, ctx.vQuiz);
  },
  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set();
    ctx.wordIdx = {};
    ctx.suggested = false;
    this.mode(ctx, ctx.level === 1 ? "learn" : "quiz", true);
  },
  mode(ctx, m, first) {
    ctx._resetFew(); // 모드를 바꾸면 새 판 — 앞 모드의 '보기 적은 판' 표시를 지움
    ctx.m = m;
    ctx.spTok = (ctx.spTok || 0) + 1;
    ctx.bLearn.classList.toggle("sel", m === "learn");
    ctx.bQuiz.classList.toggle("sel", m === "quiz");
    ctx.bSpell.classList.toggle("sel", m === "spell");
    ctx.vLearn.classList.toggle("on", m === "learn");
    ctx.vQuiz.classList.toggle("on", m === "quiz");
    ctx.vSpell.classList.toggle("on", m === "spell");
    if (!first) KP.audio.sfx("select");
    ctx.spot.classList.remove("on");
    if (m === "learn") {
      ctx.say("🔤 알파벳을 눌러 봐요! 영어로 말해 줘요!");
      ctx.cards.forEach((c, i) => c.classList.toggle("seen", ctx.seen.has(i)));
      ctx.hint(() => ctx.cards.find((c, i) => !ctx.seen.has(i)), "알파벳을 눌러 봐요!");
    } else if (m === "spell") this.spell(ctx);
    else this.quiz(ctx);
  },
  learn(ctx, i, card) {
    const U = KP.u;
    const [c, ko, ws] = ctx.L[i];
    const k = (ctx.wordIdx[i] = ctx.wordIdx[i] == null ? 0 : (ctx.wordIdx[i] + 1) % ws.length);
    const [w, em] = ws[k];
    const col = ctx.CC[i % ctx.CC.length];
    ctx.seen.add(i);
    ctx.lastSeen = i;
    card.classList.add("seen");
    U.replay(card, "wig");
    KP.audio.note(KP.audio.SCALE[i % 8], { inst: "marimba", dur: 0.3, vol: 0.25 });
    ctx.spot.innerHTML = "";
    const box = U.el("div", "abSpotBox");
    box.style.setProperty("--c", col);
    const row = U.el("div", "abSpotRow");
    const ch = U.el("span", "abCh", c + "<small>" + c.toLowerCase() + "</small>");
    ch.style.color = col;
    const pic = U.btn(KP.E(em) + '<span class="abW">' + w + "</span>", "abSpotPic");
    row.append(ch, pic);
    const btns = U.el("div", "abSpotBtns");
    const bWrite = U.btn(KP.E("✍️") + " 따라 쓰기", "btn big primary");
    const bNext = U.btn(KP.E("🔄") + " 다른 낱말", "btn big");
    if (ws.length > 1) btns.append(bWrite, bNext);
    else btns.append(bWrite);
    box.append(row, btns);
    ctx.spot.appendChild(box);
    ctx.spot.classList.remove("on");
    void ctx.spot.offsetWidth;
    ctx.spot.classList.add("on");
    ctx.tap(pic, () => {
      U.replay(pic, "pop");
      KP.voice.en(c + "! " + w + "!");
    });
    ctx.tap(bNext, () => this.learn(ctx, i, card));
    ctx.tap(bWrite, () => {
      KP.audio.sfx("open");
      KP.nbWant = { id: "awrite", ch: c }; // ABC 쓰기 공책에서 이 글자로 바로
      KP.open("awrite");
    });
    KP.voice.en(c + "! " + w + "!");
    if (ctx.seen.size >= 6 && !ctx.suggested) {
      ctx.suggested = true;
      ctx.after(2600, () => {
        if (ctx.m !== "learn") return;
        U.replay(ctx.bQuiz, "glow");
        KP.voice.say("우와! 퀴즈도 해 볼까요?");
      });
    }
    ctx.hint(() => (ctx.spot.classList.contains("on") ? bWrite : null), "손가락으로 따라 써 볼까요?");
  },
  closeSpot(ctx) {
    if (!ctx.spot.classList.contains("on")) return;
    ctx.spot.classList.remove("on");
    KP.audio.sfx("back");
    ctx.hint(() => ctx.cards.find((x, j) => !ctx.seen.has(j)) || null, "다른 알파벳도 눌러 봐요!");
  },
  /* ---------- 단어 만들기: 그림을 보고 글자를 차례로 골라 단어 완성 ----------
     1단계: 칸에 흐린 글자가 보임, 남는 글자 없음 / 2단계: 흐린 글자 + 남는 글자 1개
     3단계: 빈 칸 + 남는 글자 2개 (소리와 그림만 보고) */
  spell(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const tk = ctx.spTok;
    let w = U.pick(ctx.WORDS);
    if (lv === 1) w = U.pick(ctx.WORDS.filter((x) => x[0].length === 3));
    if (ctx.lastSpell && w[0] === ctx.lastSpell) w = ctx.WORDS[(ctx.WORDS.indexOf(w) + 1) % ctx.WORDS.length];
    ctx.lastSpell = w[0];
    const word = w[0];
    const color = ctx.CC[U.rand(ctx.CC.length)];
    ctx.sp.innerHTML = "";
    ctx.sp.style.setProperty("--c", color);
    const pic = U.btn(KP.E(w[1]), "abSpPic");
    const slots = U.el("div", "abSlots");
    const tiles = U.el("div", "abTiles");
    ctx.sp.append(pic, slots, tiles);
    const slotEls = [...word].map((ch) => {
      const e = U.el("div", "abSlot", lv < 3 ? ch : "");
      slots.appendChild(e);
      return e;
    });
    const extra = lv === 1 ? 0 : lv === 2 ? 1 : 2;
    const pool = "abcdefghijklmnoprstuwy".split("").filter((x) => !word.includes(x));
    const letters = U.shuffle([...word, ...U.sample(pool, extra)]);
    let pos = 0;
    const mark = () => slotEls.forEach((e, i) => e.classList.toggle("next", i === pos));
    mark();
    const spellOut = () => KP.voice.en(word);
    const intro = () => {
      KP.voice.en(word + "!");
      KP.voice.say("글자를 차례대로 골라서 만들어요!", { queue: true });
    };
    ctx.say("🧩 그림을 보고 단어를 만들어요!", false);
    ctx.instr = "글자를 차례대로 골라요!";
    intro();
    ctx.tap(pic, () => {
      U.replay(pic, "pop");
      spellOut();
    });
    const tileEls = letters.map((ch) => {
      const t = U.btn(ch, "abTile");
      t.style.setProperty("--c", ctx.CC[(ch.charCodeAt(0) * 7) % ctx.CC.length]);
      ctx.tap(t, async () => {
        if (pos >= word.length || t.classList.contains("used")) return;
        if (ch !== word[pos]) {
          ctx.miss(t, null, { soft: true });
          KP.voice.en(ch.toUpperCase());
          return;
        }
        t.classList.add("used");
        slotEls[pos].textContent = ch;
        slotEls[pos].classList.add("full");
        KP.audio.note(KP.audio.SCALE[pos % 8], { inst: "marimba", dur: 0.25, vol: 0.25 });
        KP.voice.en(ch.toUpperCase());
        pos++;
        mark();
        if (pos < word.length) {
          ctx.hint(() => tileEls.find((x) => !x.classList.contains("used") && x.textContent === word[pos]), "다음 글자를 찾아요!");
          return;
        }
        // 완성: 한 글자씩 읽고 단어 읽기
        ctx.hint(null);
        U.replay(pic, "yay");
        KP.audio.sfx("good");
        KP.voice.en([...word].map((x) => x.toUpperCase()).join(", ") + ". " + word + "!");
        ctx.score.add();
        ctx.round = (ctx.round || 0) + 1;
        await ctx.wait(2200);
        if (tk !== ctx.spTok) return;
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "{부름} 영어 박사!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "spell" && tk === ctx.spTok) this.spell(ctx);
      });
      tiles.appendChild(t);
      return t;
    });
    ctx.hint(() => tileEls.find((x) => !x.classList.contains("used") && x.textContent === word[pos]), "첫 글자를 찾아요!");
  },
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    ctx.q.innerHTML = "";
    let ti = U.rand(ctx.L.length);
    if (ti === ctx.lastI) ti = (ti + 1) % ctx.L.length;
    ctx.lastI = ti;
    const [c, ko, ws] = ctx.L[ti];
    // 문제 종류: find(글자 이름 듣고 찾기) · reverse(그림 보고 첫 글자 — 낱말이 확실한 것만, X·Y·Q 제외) · pair(소문자 보고 짝꿍 대문자)
    // 1단계는 find 만, 2단계부터 세 가지를 섞음 (같은 종류가 두 번 연속 덜 나오게)
    let kind = "find";
    if (lv >= 2) {
      const kinds = ["find", "reverse", "pair"].filter((k) => !(k === "reverse" && "XYQ".includes(c)) && !(k === "pair" && "COSVWXZ".includes(c))); // 짝꿍: 소문자 모양이 대문자와 같은 글자는 빼기
      kind = U.pick(kinds);
      if (kind === ctx.lastKind) kind = U.pick(kinds);
    }
    ctx.lastKind = kind;
    const reverse = kind === "reverse";
    const n = lv === 1 ? 2 : lv === 2 ? 3 : 4;
    const big = U.btn("", "abBig");
    const ans = U.el("div", "abAns");
    ctx.q.append(big, ans);
    let others;
    if (lv === 3) {
      const like = (ctx.LIKE.filter((g) => g.includes(c)).join("") || "").replace(new RegExp(c, "g"), "");
      others = [...new Set(like)].slice(0, n - 1);
    } else others = [];
    const rest = U.shuffle(ctx.L.map((l) => l[0]).filter((x) => x !== c && !others.includes(x)));
    while (others.length < n - 1) others.push(rest.pop());
    const list = U.shuffle([c, ...others]);
    const koOf = (x) => ctx.L.find((l) => l[0] === x)[1];
    let ask, en, sayRight;
    let wrongTail;
    if (kind === "find") {
      big.innerHTML = KP.E("🔊") + '<span class="abSay">Find!</span>';
      en = "Find " + c + "!";
      ask = U.josa(ko, "을/를") + " 찾아요!";
      wrongTail = ask;
      sayRight = () => KP.voice.en(c + "! Great job!");
    } else if (reverse) {
      const t = U.pick(ws);
      // 낱말의 첫 글자만 ? 로 가려 보여 줌 (그림 + "?pple")
      big.innerHTML = KP.E(t[1]) + '<span class="abHintW"><b>?</b>' + t[0].slice(1).toLowerCase() + "</span>";
      en = t[0] + "!";
      ask = "이 그림은 무슨 글자로 시작할까요?";
      wrongTail = "첫 소리를 잘 들어 봐요!";
      sayRight = () => {
        KP.voice.en(c + "! " + t[0] + "!");
        const hw = big.querySelector(".abHintW b");
        if (hw) hw.textContent = t[0][0];
      };
    } else {
      // 소문자 보고 짝꿍 대문자 찾기
      big.style.setProperty("--c", ctx.CC[ti % ctx.CC.length]);
      big.innerHTML = '<span class="abLow">' + c.toLowerCase() + "</span>";
      en = c.toLowerCase() + "!";
      ask = "짝꿍 글자를 찾아요!";
      wrongTail = ask;
      sayRight = () => {
        big.innerHTML = '<span class="abLow">' + c + c.toLowerCase() + "</span>";
        KP.voice.en(c + "! " + ws[0][0] + "!");
      };
    }
    // 말풍선에 정답 글자를 쓰지 않음(글자 모양만 보고 맞히지 않게) → 소리로만 안내
    ctx.say("🔤 " + ask, false);
    const speak = () => {
      KP.voice.en(en);
      KP.voice.say(ask, { queue: true });
    };
    speak();
    ctx.tap(big, () => {
      U.replay(big, "pop");
      speak();
    });
    ans.style.setProperty("--cl", n);
    ans.style.setProperty("--cp", n === 3 ? 3 : 2);
    ans.style.setProperty("--szl", "clamp(70px,min(10vw,20vh),120px)");
    ans.style.setProperty("--szp", n === 3 ? "clamp(56px,16vw,80px)" : "clamp(64px,22vw,96px)");
    const btns = ctx.choices(ans, list, {
      cls: "abOpt",
      render: (v) => v,
      right: (v) => v === c,
      // "이건 비! 에이를 찾아요!" — 이미 있는 조각을 이어 자연 음성으로
      wrongMsg: (v) => "이건 " + koOf(v) + "! " + wrongTail,
      onRight: async (v, b) => {
        U.replay(big, "yay");
        U.replay(b, "jump");
        KP.audio.sfx("good");
        sayRight();
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1400);
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "{부름} ABC 박사!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "quiz") self.quiz(ctx);
      },
    });
    btns.forEach((b, i) => b.style.setProperty("--c", ctx.CC[(ti + i * 2) % ctx.CC.length]));
    // 틀리면 영어로 다시 들려주기
    btns.forEach((b) => !b.dataset.right && b.addEventListener("click", () => ctx.after(1900, () => KP.voice.en(en))));
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});

;

/* ==== js/games/smart/animals.js ==== */
/* 동물 소리 — 동물 카드를 누르면 동물이 움직이며 이름과 울음소리를 들려줘요. (자유 탐색, 퀴즈 아님 — 단계 없음,
   '듣고 고르기' 퀴즈는 소리 듣고 찾기(listen)가 맡음)
   위쪽 버튼으로 사는 곳(농장/정글/바다/하늘)별로 나눠 보기. 목표: 탭마다 '만난 수/전체' 표시,
   한 곳의 친구들을 모두 만나면(어느 탭에서 만났든) 큰 축하, 36마리 모두 만나면 마지막 큰 축하.
   동물 목록·합성 울음소리는 KP.smartAnimals 로 공개 → 소리 듣고 찾기(listen)·먹이 주기(feed)에서도 사용 */
"use strict";
(function (KP) {
  const A = () => KP.audio;
  const T = (f, o) => A().tone(f, o);
  const N = (o) => A().noise(o);
  /* 합성 울음소리 (부드러운 sine/triangle + 걸러낸 잡음) */
  const CRY = {
    bark: () => [0, 0.24].forEach((w) => { T(560, { to: 300, dur: 0.13, type: "triangle", vol: 0.3, when: w }); N({ bp: 900, q: 2, dur: 0.08, vol: 0.18, when: w }); }),
    meow: () => { T(560, { to: 880, dur: 0.2, type: "triangle", vol: 0.2 }); T(880, { to: 480, dur: 0.38, type: "triangle", vol: 0.2, when: 0.19 }); },
    moo: () => { T(150, { to: 112, dur: 1.0, type: "triangle", vol: 0.4, attack: 0.12 }); T(300, { to: 224, dur: 0.9, vol: 0.08, attack: 0.12 }); },
    oink: () => [0, 0.2].forEach((w) => { N({ bp: 480, q: 4, dur: 0.13, vol: 0.4, when: w }); T(240, { to: 170, dur: 0.12, type: "triangle", vol: 0.16, when: w }); }),
    rooster: () => [[640, 820, 0], [820, 1000, 0.14], [1000, 1180, 0.28], [1180, 760, 0.42]].forEach(([a, b, w], i) => T(a, { to: b, dur: i === 3 ? 0.45 : 0.13, type: "triangle", vol: 0.2, when: w })),
    chick: () => [0, 0.13, 0.42, 0.55].forEach((w) => T(2300, { to: 2900, dur: 0.08, vol: 0.18, when: w })),
    quack: () => [0, 0.22].forEach((w) => { N({ bp: 1300, q: 5, dur: 0.13, vol: 0.32, when: w }); T(420, { to: 360, dur: 0.12, type: "triangle", vol: 0.12, when: w }); }),
    neigh: () => { for (let i = 0; i < 9; i++) T(i % 2 ? 1150 : 980, { to: i % 2 ? 1000 : 1100, dur: 0.07, type: "triangle", vol: 0.14 * (1 - i / 12), when: i * 0.065 }); },
    baa: () => { for (let i = 0; i < 8; i++) T(i % 2 ? 360 : 390, { dur: 0.08, type: "triangle", vol: 0.2, when: i * 0.07 }); },
    roar: () => { N({ lp: 650, dur: 1.0, vol: 0.45, attack: 0.12 }); T(130, { to: 78, dur: 1.0, type: "triangle", vol: 0.3, attack: 0.1 }); },
    trumpet: () => { T(330, { to: 720, dur: 0.45, type: "triangle", vol: 0.28, attack: 0.05 }); T(720, { to: 560, dur: 0.5, type: "triangle", vol: 0.24, when: 0.44 }); },
    monkey: () => [0, 0.11, 0.22, 0.33].forEach((w, i) => T(620 + i * 60, { to: 1050 + i * 60, dur: 0.08, type: "triangle", vol: 0.2, when: w })),
    yawn: () => T(320, { to: 140, dur: 1.0, type: "triangle", vol: 0.3, attack: 0.15 }),
    snap: () => [0, 0.3].forEach((w) => { N({ hp: 1800, dur: 0.05, vol: 0.4, when: w }); T(180, { to: 90, dur: 0.12, vol: 0.3, when: w }); }),
    hiss: () => N({ hp: 4200, dur: 1.0, vol: 0.16, attack: 0.25 }),
    parrot: () => [0, 0.3].forEach((w) => { T(1100, { to: 1600, dur: 0.1, type: "triangle", vol: 0.16, when: w }); T(1600, { to: 1000, dur: 0.12, type: "triangle", vol: 0.16, when: w + 0.1 }); }),
    spout: () => { N({ bp: 500, bpTo: 2600, q: 0.8, dur: 1.1, vol: 0.3, attack: 0.1 }); T(110, { to: 70, dur: 0.9, vol: 0.2, attack: 0.2 }); },
    dolphin: () => { for (let i = 0; i < 6; i++) T(1800 + i * 90, { to: 2700, dur: 0.06, vol: 0.14, when: i * 0.08 }); },
    chomp: () => [0, 0.28].forEach((w) => { A().kick({ vol: 0.35, when: w }); N({ hp: 1500, dur: 0.06, vol: 0.25, when: w }); }),
    bubble: () => { for (let i = 0; i < 5; i++) T(420 + Math.random() * 300, { to: 1500, dur: 0.11, vol: 0.2, when: i * 0.13 }); },
    snip: () => [0, 0.18, 0.5, 0.68].forEach((w) => { N({ hp: 3500, dur: 0.03, vol: 0.3, when: w }); A().note("A5", { inst: "marimba", dur: 0.1, vol: 0.12, when: w }); }),
    slow: () => ["C3", "E3", "C3", "E3"].forEach((n, i) => A().note(n, { inst: "marimba", dur: 0.4, vol: 0.35, when: i * 0.32 })),
    seal: () => [0, 0.3].forEach((w) => T(520, { to: 330, dur: 0.22, type: "triangle", vol: 0.25, when: w })),
    waddle: () => ["E4", "C4", "E4", "C4", "G4"].forEach((n, i) => A().note(n, { inst: "marimba", dur: 0.2, vol: 0.25, when: i * 0.15 })),
    screech: () => { T(2100, { to: 1300, dur: 0.6, type: "triangle", vol: 0.16 }); N({ hp: 3000, dur: 0.5, vol: 0.08 }); },
    hoot: () => [0, 0.45].forEach((w) => T(430, { to: 380, dur: 0.35, vol: 0.32, attack: 0.05, when: w })),
    tweet: () => [0, 0.09, 0.3, 0.39].forEach((w) => T(3000, { to: 3700, dur: 0.06, vol: 0.12, when: w })),
    coo: () => [0, 0.32, 0.64].forEach((w) => { T(290, { to: 350, dur: 0.14, vol: 0.28, when: w }); T(350, { to: 280, dur: 0.16, vol: 0.28, when: w + 0.14 }); }),
    buzz: () => { for (let i = 0; i < 22; i++) T(i % 2 ? 175 : 195, { dur: 0.05, type: "triangle", vol: 0.16, when: i * 0.04 }); },
    flutter: () => { for (let i = 0; i < 7; i++) N({ hp: 2500, dur: 0.05, vol: 0.06, when: i * 0.1 }); A().sfx("sparkle"); },
    squeak: () => [0, 0.15, 0.3].forEach((w) => T(2600, { to: 3100, dur: 0.06, vol: 0.12, when: w })),
    hop: () => [0, 0.3].forEach((w) => T(220, { to: 660, dur: 0.2, type: "triangle", vol: 0.2, when: w })),
    tall: () => ["C5", "E5", "G5", "C6"].forEach((n, i) => A().note(n, { inst: "bell", dur: 0.4, vol: 0.18, when: i * 0.12 })),
  };
  /* [그림, 이름, 사는 곳, 울음(말), 합성 소리, 소리 듣고 찾기에 쓸 수 있나] */
  const LIST = [
    ["🐶", "강아지", "farm", "멍멍!", "bark", 1], ["🐱", "고양이", "farm", "야옹!", "meow", 1], ["🐮", "소", "farm", "음메!", "moo", 1],
    ["🐷", "돼지", "farm", "꿀꿀!", "oink", 1], ["🐔", "닭", "farm", "꼬끼오!", "rooster", 1], ["🐤", "병아리", "farm", "삐약삐약!", "chick", 1],
    ["🦆", "오리", "farm", "꽥꽥!", "quack", 1], ["🐴", "말", "farm", "히히힝!", "neigh", 1], ["🐑", "양", "farm", "메에에!", "baa", 1],
    ["🐰", "토끼", "farm", "깡충깡충!", "hop", 0],
    ["🦁", "사자", "jungle", "어흥!", "roar", 1], ["🐯", "호랑이", "jungle", "어흥!", "roar", 0], ["🐘", "코끼리", "jungle", "뿌우우!", "trumpet", 1],
    ["🐵", "원숭이", "jungle", "우끼끼!", "monkey", 1], ["🦒", "기린", "jungle", "목이 길어요!", "tall", 0], ["🦓", "얼룩말", "jungle", "줄무늬가 있어요!", "neigh", 0],
    ["🦛", "하마", "jungle", "하아암! 입이 커요!", "yawn", 0], ["🐊", "악어", "jungle", "쩍! 쩍!", "snap", 0], ["🐍", "뱀", "jungle", "쉬이익!", "hiss", 1],
    ["🦜", "앵무새", "jungle", "안녕! 안녕!", "parrot", 0],
    ["🐳", "고래", "sea", "푸우! 물을 뿜어요!", "spout", 1], ["🐬", "돌고래", "sea", "끼익끼익!", "dolphin", 1], ["🦈", "상어", "sea", "덥석!", "chomp", 0],
    ["🐙", "문어", "sea", "다리가 여덟 개!", "bubble", 0], ["🦀", "꽃게", "sea", "싹둑싹둑!", "snip", 0], ["🐠", "열대어", "sea", "뻐끔뻐끔!", "bubble", 0],
    ["🐢", "거북이", "sea", "엉금엉금!", "slow", 0], ["🦭", "물범", "sea", "아우! 아우!", "seal", 1], ["🐧", "펭귄", "sea", "뒤뚱뒤뚱!", "waddle", 0],
    ["🦅", "독수리", "sky", "끼이약!", "screech", 0], ["🦉", "부엉이", "sky", "부엉부엉!", "hoot", 1], ["🐦", "참새", "sky", "짹짹!", "tweet", 1],
    ["🕊️", "비둘기", "sky", "구구구!", "coo", 1], ["🐝", "꿀벌", "sky", "윙윙!", "buzz", 1], ["🦋", "나비", "sky", "팔랑팔랑!", "flutter", 0],
    ["🦇", "박쥐", "sky", "찍찍!", "squeak", 0],
  ];
  KP.smartAnimals = {
    LIST,
    HABITATS: [
      { k: "all", n: "모두", e: "🌍", c: "#ffffff" },
      { k: "farm", n: "농장", e: "🚜", c: "#e6f7d4" },
      { k: "jungle", n: "정글", e: "🌴", c: "#d3f1dc" },
      { k: "sea", n: "바다", e: "🌊", c: "#d6ecff" },
      { k: "sky", n: "하늘", e: "☁️", c: "#eaf3ff" },
    ],
    cry(key) {
      if (!A().ctx()) return;
      try {
        (CRY[key] || CRY.tall)();
      } catch (e) {}
    },
  };
})(window.KP);

KP.game({
  id: "animals",
  icon: "🐶",
  name: "동물 소리",
  cat: "smart",
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      Z = KP.smartAnimals;
    KP.css("animals", `
      .anTabs{display:flex;gap:clamp(6px,1.2vw,12px);justify-content:center;padding:10px 10px 8px;flex:0 0 auto;flex-wrap:nowrap}
      .anTab{flex:1 1 0;max-width:130px;min-width:0;min-height:72px;justify-content:center;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:clamp(15px,2.2vw,22px);
        background:rgba(255,255,255,.7);border-radius:20px;padding:6px clamp(8px,1.6vw,18px);border-bottom:5px solid transparent;transition:transform .15s}
      .anTab .e{font-size:clamp(30px,4.4vw,44px)}
      .anTab{position:relative}
      .anCnt{position:absolute;top:-6px;right:-4px;min-width:26px;padding:1px 6px;border-radius:999px;background:#fff;color:var(--ink2);font-size:clamp(11px,1.4vw,14px);font-style:normal;line-height:1.5;box-shadow:0 2px 0 rgba(47,58,102,.15);pointer-events:none}
      .anCnt.full{background:var(--sun);color:var(--ink)}
      .anTab.sel{background:#fff;border-bottom-color:var(--cat);transform:translateY(-2px);box-shadow:var(--shadow)}
      .anGrid{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(104px,15vw,150px),1fr));
        gap:clamp(14px,2vw,20px) clamp(10px,1.8vw,18px);padding:18px clamp(10px,2vw,22px) 26px;align-content:start;border-radius:28px 28px 0 0;transition:background .3s}
      .anCard{position:relative;background:#fff;border-radius:24px;padding:12px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;
        box-shadow:0 6px 0 rgba(47,58,102,.12);font-size:clamp(17px,2.2vw,21px);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*25ms)}
      .anCard:active{transform:translateY(4px)}
      .anCard .anEm{font-size:clamp(56px,8vw,82px);line-height:1;display:block}
      .anCard.met::after{content:"";position:absolute;top:8px;right:8px;width:14px;height:14px;border-radius:50%;background:var(--sun);box-shadow:0 2px 0 #d9a000}
      .anSay{position:absolute;left:50%;top:-14px;transform:translateX(-50%);background:var(--coral);color:#fff;white-space:nowrap;font-size:clamp(16px,2.2vw,22px);
        padding:4px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:anSay 1.6s forwards;pointer-events:none;z-index:2}
      @keyframes anSay{0%{transform:translate(-50%,10px) scale(.4);opacity:0}15%{transform:translate(-50%,-6px) scale(1.1);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-20px);opacity:0}}
      .anGo-farm .anEm{animation:anHop .8s}
      @keyframes anHop{20%{transform:translateY(-26px) rotate(-6deg)}40%{transform:translateY(0) scale(1.1,.9)}60%{transform:translateY(-16px) rotate(6deg)}80%{transform:translateY(0)}}
      .anGo-jungle .anEm{animation:anRoar .9s}
      @keyframes anRoar{15%{transform:scale(1.3) rotate(-8deg)}30%{transform:scale(1.3) rotate(8deg)}45%{transform:scale(1.3) rotate(-8deg)}60%{transform:scale(1.3) rotate(6deg)}100%{transform:none}}
      .anGo-sea .anEm{animation:anSwim 1.1s ease-in-out}
      @keyframes anSwim{25%{transform:translateX(-22px) rotate(-10deg)}50%{transform:translateX(22px) translateY(-8px) rotate(10deg)}75%{transform:translateX(-12px) rotate(-6deg)}}
      .anGo-sky .anEm{animation:anFly 1.1s ease-in-out}
      @keyframes anFly{25%{transform:translate(-14px,-30px) rotate(-12deg)}50%{transform:translate(14px,-46px) rotate(12deg)}75%{transform:translate(-6px,-20px) rotate(-6deg)}}
    `);
    ctx.tabs = U.el("div", "anTabs");
    ctx.grid = U.el("div", "anGrid");
    ctx.body.append(ctx.tabs, ctx.grid);
    ctx.tabBtns = Z.HABITATS.map((h) => {
      const b = U.btn(KP.E(h.e) + "<span>" + h.n + '</span><i class="anCnt"></i>', "anTab");
      b.dataset.k = h.k;
      ctx.tap(b, () => {
        KP.audio.sfx("select");
        U.replay(b, "pop");
        this.show(ctx, h.k);
        KP.voice.say(h.k === "all" ? "동물 친구들 모두!" : h.n + "에 사는 친구들!");
      });
      ctx.tabs.appendChild(b);
      return b;
    });
  },
  start(ctx) {
    ctx.met = new Set();
    ctx.done = new Set();
    ctx.allDone = false;
    this.counts(ctx);
    ctx.say("🐾 동물 친구를 눌러 봐요! 무슨 소리가 날까요?");
    this.show(ctx, "all");
  },
  /** 탭마다 만난 수/전체 */
  counts(ctx) {
    const Z = KP.smartAnimals;
    ctx.tabBtns.forEach((b) => {
      const k = b.dataset.k;
      const list = Z.LIST.filter((a) => k === "all" || a[2] === k);
      const n = list.filter((a) => ctx.met.has(a[1])).length;
      const c = b.querySelector(".anCnt");
      c.textContent = n + "/" + list.length;
      c.classList.toggle("full", n === list.length);
    });
  },
  /** 다음에 가리킬 것: 이 탭의 안 만난 친구 → 없으면 아직 다 못 만난 탭 */
  nextHint(ctx) {
    const c = ctx.cards.find((x) => !x.classList.contains("met"));
    if (c) return c;
    return ctx.tabBtns.find((b) => b.dataset.k !== "all" && !ctx.done.has(b.dataset.k)) || null;
  },
  show(ctx, k) {
    const U = KP.u,
      Z = KP.smartAnimals;
    ctx.hab = k;
    ctx.tabBtns.forEach((b) => b.classList.toggle("sel", b.dataset.k === k));
    const h = Z.HABITATS.find((x) => x.k === k);
    ctx.grid.style.background = k === "all" ? "transparent" : h.c;
    ctx.grid.innerHTML = "";
    ctx.grid.scrollTop = 0;
    const list = Z.LIST.filter((a) => k === "all" || a[2] === k);
    const cards = list.map((a, i) => {
      const [em, name, hab, cry, snd] = a;
      const c = U.btn('<span class="anEm">' + KP.E(em) + "</span><span>" + name + "</span>", "anCard");
      c.style.setProperty("--i", i);
      if (ctx.met.has(name)) c.classList.add("met");
      ctx.tap(c, () => this.play(ctx, c, a));
      ctx.grid.appendChild(c);
      return c;
    });
    ctx.cards = cards;
    ctx.hint(() => this.nextHint(ctx), "동물 친구를 눌러 봐요!");
  },
  async play(ctx, c, a) {
    const U = KP.u,
      Z = KP.smartAnimals;
    const [em, name, hab, cry, snd] = a;
    U.replay(c, "anGo-" + hab);
    c.querySelectorAll(".anSay").forEach((x) => x.remove());
    c.appendChild(U.el("span", "anSay", cry.split("!")[0] + "!"));
    Z.cry(snd);
    ctx.after(450, () => KP.voice.say(name + "! " + cry));
    if (!ctx.met.has(name)) {
      ctx.met.add(name);
      c.classList.add("met");
      ctx.score.add();
      this.counts(ctx);
    }
    ctx.hint(() => this.nextHint(ctx), "다른 친구도 눌러 봐요!");
    // 한 곳의 친구를 모두 만나면 큰 축하 ('모두' 탭에서 만나도 그 동물이 사는 곳으로 셈), 모두 만나면 마지막 큰 축하
    const habDone = !ctx.done.has(hab) && Z.LIST.filter((x) => x[2] === hab).every((x) => ctx.met.has(x[1]));
    if (habDone) ctx.done.add(hab);
    const allDone = !ctx.allDone && Z.LIST.every((x) => ctx.met.has(x[1]));
    if (allDone) ctx.allDone = true;
    if (habDone || allDone) {
      const h = Z.HABITATS.find((x) => x.k === hab);
      await ctx.wait(2200);
      if (!ctx._active) return;
      await ctx.win({ big: true, msg: allDone ? "{부름} 동물 친구들 다 만났어요!" : h.n + " 친구들 다 만났어요!" });
    }
  },
});

;

/* ==== js/games/smart/awrite.js ==== */
/* ABC 쓰기 공책 — 영어 4줄 칸에 대문자·소문자·단어 따라 쓰기
   획순: 초등 영어 인쇄체(블록체)에서 흔히 가르치는 순서 — 위에서 아래, 왼쪽에서 오른쪽,
         동그라미 글자(c·o·a·d·g·q)는 오른쪽 위에서 시작해 시계 반대 방향.
   칸 높이: 윗줄 14 · 가운데 점선 47 · 밑줄 82 · 아랫줄 96 (100칸 기준) */
"use strict";
(function () {
  const arc = (cx, cy, rx, ry, a0, a1) => {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 8));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  };
  /** 여러 조각을 한 획으로 잇기 (겹치는 이음점 제거) */
  const P = (...segs) => {
    const out = [];
    segs.forEach((s) =>
      s.forEach((p) => {
        const l = out[out.length - 1];
        if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 0.6) out.push(p);
      })
    );
    return out;
  };
  const ST = {
    // ---------- 대문자 ----------
    A: [[[50, 14], [24, 82]], [[50, 14], [76, 82]], [[35, 58], [65, 58]]],
    B: [[[28, 14], [28, 82]], P([[28, 14], [52, 14]], arc(52, 30.5, 16, 16.5, -90, 90), [[52, 47], [28, 47]]), P([[28, 47], [55, 47]], arc(55, 64.5, 18, 17.5, -90, 90), [[55, 82], [28, 82]])],
    C: [arc(52, 48, 26, 34, -40, -320)],
    D: [[[28, 14], [28, 82]], P([[28, 14], [44, 14]], arc(44, 48, 30, 34, -90, 90), [[44, 82], [28, 82]])],
    E: [[[28, 14], [28, 82]], [[28, 14], [72, 14]], [[28, 48], [66, 48]], [[28, 82], [72, 82]]],
    F: [[[28, 14], [28, 82]], [[28, 14], [72, 14]], [[28, 48], [64, 48]]],
    G: [P(arc(52, 48, 26, 34, -40, -360), [[78, 48], [57, 48]])],
    H: [[[26, 14], [26, 82]], [[74, 14], [74, 82]], [[26, 48], [74, 48]]],
    I: [[[50, 14], [50, 82]], [[36, 14], [64, 14]], [[36, 82], [64, 82]]],
    J: [P([[64, 14], [64, 64]], arc(47, 64, 17, 18, 0, 180)), [[46, 14], [80, 14]]],
    K: [[[28, 14], [28, 82]], [[72, 14], [28, 54]], [[42, 43], [74, 82]]],
    L: [[[30, 14], [30, 82], [72, 82]]],
    M: [[[22, 14], [22, 82]], [[22, 14], [50, 60], [78, 14]], [[78, 14], [78, 82]]],
    N: [[[26, 14], [26, 82]], [[26, 14], [74, 82]], [[74, 14], [74, 82]]],
    O: [arc(50, 48, 28, 34, -90, -450)],
    P: [[[28, 14], [28, 82]], P([[28, 14], [52, 14]], arc(52, 31, 18, 17, -90, 90), [[52, 48], [28, 48]])],
    Q: [arc(50, 48, 28, 34, -90, -450), [[56, 64], [80, 88]]],
    R: [[[28, 14], [28, 82]], P([[28, 14], [52, 14]], arc(52, 31, 18, 17, -90, 90), [[52, 48], [28, 48]]), [[46, 48], [74, 82]]],
    S: [P(arc(50, 31, 21, 17, -15, -270), arc(50, 65, 23, 17, -90, 160))],
    T: [[[22, 14], [78, 14]], [[50, 14], [50, 82]]],
    U: [P([[26, 14], [26, 58]], arc(50, 58, 24, 24, 180, 0), [[74, 58], [74, 14]])],
    V: [[[24, 14], [50, 82], [76, 14]]],
    W: [[[16, 14], [32, 82], [50, 34], [68, 82], [84, 14]]],
    X: [[[26, 14], [74, 82]], [[74, 14], [26, 82]]],
    Y: [[[26, 14], [50, 48]], [[74, 14], [50, 48], [50, 82]]],
    Z: [[[26, 14], [74, 14], [26, 82], [74, 82]]],
    // ---------- 소문자 ----------
    a: [arc(48, 64.5, 17, 17.5, -30, -390), [[65, 47], [65, 82]]],
    b: [[[32, 14], [32, 82]], arc(50, 64.5, 18, 17.5, 180, 540)],
    c: [arc(52, 64.5, 18, 17.5, -40, -320)],
    d: [arc(48, 64.5, 17, 17.5, -30, -390), [[65, 14], [65, 82]]],
    e: [P([[33, 64.5], [69, 64.5]], arc(51, 64.5, 18, 17.5, 0, -320))],
    f: [P(arc(57, 25, 11, 11, -20, -180), [[46, 25], [46, 82]]), [[32, 47], [62, 47]]],
    g: [arc(48, 64.5, 17, 17.5, -30, -390), P([[65, 47], [65, 86]], arc(50, 86, 15, 10, 0, 165))],
    h: [[[30, 14], [30, 82]], P(arc(48, 64, 18, 17, 180, 360), [[66, 64], [66, 82]])],
    i: [[[50, 47], [50, 82]], [[50, 29], [50, 33]]],
    j: [P([[56, 47], [56, 86]], arc(44, 86, 12, 10, 0, 165)), [[56, 29], [56, 33]]],
    k: [[[32, 14], [32, 82]], [[64, 47], [32, 69]], [[44, 62], [66, 82]]],
    l: [[[50, 14], [50, 82]]],
    m: [[[22, 47], [22, 82]], P(arc(34, 62, 12, 15, 180, 360), [[46, 62], [46, 82]]), P(arc(58, 62, 12, 15, 180, 360), [[70, 62], [70, 82]])],
    n: [[[30, 47], [30, 82]], P(arc(48, 63, 18, 16, 180, 360), [[66, 63], [66, 82]])],
    o: [arc(50, 64.5, 18, 17.5, -90, -450)],
    p: [[[32, 47], [32, 96]], arc(50, 64.5, 18, 17.5, 180, 540)],
    q: [arc(48, 64.5, 17, 17.5, -30, -390), [[65, 47], [65, 96]]],
    r: [[[34, 47], [34, 82]], arc(50, 63, 16, 15, 180, 315)],
    s: [P(arc(50, 56, 14, 8.5, -20, -270), arc(50, 73, 15, 8.5, -90, 160))],
    t: [P([[48, 24], [48, 74]], arc(56, 74, 8, 8, 180, 90)), [[34, 47], [62, 47]]],
    u: [P([[30, 47], [30, 64]], arc(48, 64, 18, 18, 180, 0), [[66, 64], [66, 47]]), [[66, 47], [66, 82]]],
    v: [[[28, 47], [50, 82], [72, 47]]],
    w: [[[18, 47], [32, 82], [50, 56], [68, 82], [82, 47]]],
    x: [[[30, 47], [70, 82]], [[70, 47], [30, 82]]],
    y: [[[30, 47], [50, 82]], [[70, 47], [38, 96]]],
    z: [[[30, 47], [70, 47], [30, 82], [70, 82]]],
  };
  KP.GLYPHS = Object.assign(KP.GLYPHS || {}, { abc: ST });

  // [글자, 한국어 이름, 낱말, 그림] — ABC 놀이와 같은 낱말
  const L = [
    ["A", "에이", "Apple", "🍎"], ["B", "비", "Bear", "🐻"], ["C", "씨", "Cat", "🐱"], ["D", "디", "Dog", "🐶"], ["E", "이", "Egg", "🥚"],
    ["F", "에프", "Fish", "🐟"], ["G", "지", "Grapes", "🍇"], ["H", "에이치", "Hat", "🎩"], ["I", "아이", "Ice cream", "🍦"], ["J", "제이", "Juice", "🧃"],
    ["K", "케이", "Kite", "🪁"], ["L", "엘", "Lion", "🦁"], ["M", "엠", "Moon", "🌙"], ["N", "엔", "Nose", "👃"], ["O", "오", "Orange", "🍊"],
    ["P", "피", "Pig", "🐷"], ["Q", "큐", "Queen", "👸"], ["R", "알", "Rabbit", "🐰"], ["S", "에스", "Sun", "☀️"], ["T", "티", "Tiger", "🐯"],
    ["U", "유", "Umbrella", "☂️"], ["V", "브이", "Violin", "🎻"], ["W", "더블유", "Whale", "🐳"], ["X", "엑스", "X-ray", "🩻"], ["Y", "와이", "Yo-yo", "🪀"],
    ["Z", "제트", "Zebra", "🦓"],
  ];
  // 3~4글자 쉬운 낱말 [낱말, 한국어로 읽기, 그림]
  const WORDS = [
    ["cat", "캣", "🐱"], ["dog", "독", "🐶"], ["sun", "썬", "☀️"], ["pig", "피그", "🐷"], ["bus", "버스", "🚌"], ["hat", "햇", "🎩"],
    ["egg", "에그", "🥚"], ["fox", "폭스", "🦊"], ["bee", "비", "🐝"], ["ant", "앤트", "🐜"], ["owl", "아울", "🦉"], ["cow", "카우", "🐮"],
    ["car", "카", "🚗"], ["box", "박스", "📦"], ["fish", "피시", "🐟"], ["frog", "프로그", "🐸"], ["duck", "덕", "🦆"], ["star", "스타", "⭐"],
  ];
  const COLORS = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2"];
  function book() {
    return [
      { id: "up", name: "대문자", items: L.map((l, i) => ({ id: "U" + l[0], kind: "jamo", label: l[0], ch: l[0], say: "대문자 " + l[1], en: l[0], color: COLORS[i % 9], strokes: ST[l[0]], word: [l[2], l[3]] })) },
      { id: "low", name: "소문자", items: L.map((l, i) => ({ id: "L" + l[0], kind: "jamo", label: l[0].toLowerCase(), ch: l[0].toLowerCase(), say: "소문자 " + l[1], en: l[0], color: COLORS[i % 9], strokes: ST[l[0].toLowerCase()], word: [l[2].toLowerCase(), l[3]] })) },
      { id: "word", name: "단어", items: WORDS.map((w, i) => ({ id: "W" + w[0], kind: "word", label: w[0], ch: w[0], say: w[1], en: w[0], color: COLORS[i % 9], word: [w[0], w[2]], parts: [...w[0]] })) },
    ];
  }
  KP.notebook({
    id: "awrite",
    icon: "🖊️",
    name: "ABC 쓰기 공책",
    cat: "study",
    key: "aw:stars",
    paper: "abc",
    book,
    partStrokes: (ch) => ST[ch],
    partSmall: false,
    wordOnce: true, // 단어는 한 줄만(글자 수만큼) — 4글자 단어가 8칸이 되면 이 나이엔 너무 김
    firstHint: "대문자 A부터 써 볼까요?",
  });
})();

;

/* ==== js/games/smart/candy.js ==== */
/* 사탕 가게 — 말한 색 사탕을 끌어서 병에 담아요. 병에 사탕이 차곡차곡 차올라요.
   1단계: 2가지 색 중 말한 색 사탕 모두(3개) / 2단계: 3~4가지 색 중 말한 색 모두(3~4개)
   3단계: "빨간 사탕 3개!" — 개수까지 맞춰 담기(말한 색이 더 많이 섞여 있음) */
"use strict";
KP.game({
  id: "candy",
  icon: "🍭",
  name: "사탕 가게",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("candy", `
      .cdWrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(16px,4vw,50px);padding:4px 14px 18px}
      @media (max-aspect-ratio:1/1){.cdWrap{flex-direction:column;justify-content:space-evenly}}
      .cdJarBox{position:relative;flex:0 0 auto;display:flex;flex-direction:column;align-items:center}
      .cdLid{width:calc(var(--jw) * .78);height:calc(var(--jw) * .14);border-radius:14px 14px 6px 6px;background:linear-gradient(180deg,#ff8fb6,#ff5d8f);box-shadow:0 5px 0 #d94374;position:relative;z-index:2;transition:transform .5s cubic-bezier(.3,1.5,.5,1)}
      .cdLid.open{transform:translateY(-34px) rotate(-14deg)}
      .cdJar{position:relative;width:var(--jw);height:calc(var(--jw) * 1.15);margin-top:-4px;border-radius:26px 26px 44px 44px;background:linear-gradient(90deg,rgba(255,255,255,.75),rgba(220,240,255,.45) 30%,rgba(220,240,255,.3) 70%,rgba(255,255,255,.65));
        border:6px solid rgba(255,255,255,.95);box-shadow:0 10px 0 rgba(47,58,102,.12),inset 0 -14px 0 rgba(47,58,102,.06);overflow:hidden}
      .cdJar.dropHover{outline:none;box-shadow:0 0 0 8px rgba(255,197,49,.55),0 10px 0 rgba(47,58,102,.12)}
      .cdJar::after{content:"";position:absolute;left:12%;top:8%;width:10%;height:60%;border-radius:999px;background:rgba(255,255,255,.7)}
      .cdJar.yay{animation:wig .45s 3}
      .cdIn{position:absolute;inset:0}
      .cdIn .cdC{--cs:calc(var(--jw) * .19);position:absolute;transform:rotate(var(--r));animation:cdIn .35s cubic-bezier(.3,1.5,.5,1)}
      @keyframes cdIn{from{transform:translateY(-60px) rotate(var(--r))}}
      .cdLabel{position:absolute;left:50%;top:9%;transform:translateX(-50%);white-space:nowrap;background:#fff;border-radius:18px;padding:4px 10px;display:flex;align-items:center;gap:6px;box-shadow:0 3px 0 rgba(47,58,102,.12);z-index:2;font-size:calc(var(--cs) * .6);color:var(--ink)}
      .cdLabel .cdC{--cs:calc(var(--jw) * .14)}
      .cdCount{position:absolute;right:-14px;top:-10px;min-width:54px;height:54px;border-radius:27px;background:var(--coral);color:#fff;font-size:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 rgba(0,0,0,.15);z-index:3}
      .cdCount.bump{animation:bump .35s}
      .cdPile{flex:0 1 auto;display:grid;grid-template-columns:repeat(var(--pc),auto);gap:clamp(6px,1.4vw,14px);justify-content:center;align-content:center;padding:clamp(10px,1.6vw,18px);background:rgba(255,255,255,.55);border-radius:30px}
      .cdC{display:block;position:relative;width:calc(var(--cs) * 1.7);height:var(--cs)}
      .cdC .cdBall{position:absolute;left:22%;right:22%;top:0;bottom:0;border-radius:50%;background:repeating-linear-gradient(-45deg,var(--c) 0 9px,color-mix(in srgb,var(--c) 70%,#fff) 9px 15px);
        box-shadow:inset -4px -5px 0 rgba(0,0,0,.12),inset 4px 4px 0 rgba(255,255,255,.4);z-index:1}
      .cdC::before,.cdC::after{content:"";position:absolute;top:18%;bottom:18%;width:30%;background:color-mix(in srgb,var(--c) 75%,#fff);opacity:.95}
      .cdC::before{left:0;clip-path:polygon(0 0,100% 35%,100% 65%,0 100%,18% 50%)}
      .cdC::after{right:0;clip-path:polygon(100% 0,0 35%,0 65%,100% 100%,82% 50%)}
      .cdPile .cdC{padding:0;transform:rotate(var(--r))}
      .cdHit{position:absolute;inset:-16px -4px;z-index:2}
      .cdIn .cdHit{display:none}
      .cdPile .cdC.dragging{z-index:50}
      .cdSlot{display:flex;align-items:center;justify-content:center;width:calc(var(--cs) * 1.8);height:calc(var(--cs) * 1.3)}
    `);
    ctx.wrap = U.el("div", "cdWrap");
    ctx.jarBox = U.el("div", "cdJarBox");
    ctx.lid = U.el("div", "cdLid");
    ctx.jar = U.el("div", "cdJar");
    ctx.jar.dataset.drop = "jar";
    ctx.jarIn = U.el("div", "cdIn");
    ctx.jar.appendChild(ctx.jarIn);
    ctx.cnt = U.el("div", "cdCount", "0");
    ctx.jarBox.append(ctx.lid, ctx.jar, ctx.cnt);
    ctx.pile = U.el("div", "cdPile");
    ctx.wrap.append(ctx.jarBox, ctx.pile);
    ctx.body.appendChild(ctx.wrap);
    ctx.COL = [
      { k: "red", a: "빨간", n: "빨간색", c: "#ff4d5e" },
      { k: "yellow", a: "노란", n: "노란색", c: "#ffc61a" },
      { k: "blue", a: "파란", n: "파란색", c: "#3b82f6" },
      { k: "green", a: "초록", n: "초록색", c: "#2fbf5a" },
      { k: "purple", a: "보라", n: "보라색", c: "#9b5de5" },
      { k: "orange", a: "주황", n: "주황색", c: "#ff8a1f" },
      { k: "pink", a: "분홍", n: "분홍색", c: "#ff7eb9" },
    ];
    ctx.CNT = ["", "한", "두", "세", "네", "다섯", "여섯"];
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
    const self = this;
    const nCol = lv === 1 ? 2 : lv === 2 ? 3 + U.rand(2) : 3 + U.rand(2);
    const cols = U.sample(lv === 1 ? ctx.COL.slice(0, 4) : ctx.COL, nCol);
    let target = cols[0];
    if (ctx.lastK === target.k) [cols[0], cols[1]] = [cols[1], cols[0]];
    target = cols[0];
    ctx.lastK = target.k;
    let need, nTarget, candies = [];
    if (lv === 1) {
      need = nTarget = 3;
      candies = [...Array(3).fill(cols[0]), ...Array(3).fill(cols[1])];
    } else if (lv === 2) {
      need = nTarget = 3 + U.rand(2);
      candies = Array(need).fill(target);
      const rest = cols.slice(1);
      for (let i = 0; candies.length < 9; i++) candies.push(rest[i % rest.length]);
    } else {
      need = 2 + U.rand(4); // 2~5개
      nTarget = need + 2;
      candies = Array(nTarget).fill(target);
      const rest = cols.slice(1);
      for (let i = 0; candies.length < 12; i++) candies.push(rest[i % rest.length]);
    }
    U.shuffle(candies);
    const portrait = innerHeight > innerWidth;
    const pc = portrait ? (candies.length > 9 ? 4 : 3) : candies.length > 9 ? 4 : 3;
    ctx.pile.style.setProperty("--pc", pc);
    const rows = Math.ceil(candies.length / pc);
    // 사탕 크기: 사탕 더미가 화면 안에 들어가도록 (가로 칸 수·세로 줄 수 기준)
    const availW = portrait ? innerWidth - 70 : innerWidth * 0.55,
      availH = portrait ? innerHeight * 0.36 : innerHeight * 0.62;
    const cs = Math.min(availW / (pc * 1.95), availH / rows / 1.4, 64);
    ctx.wrap.style.setProperty("--cs", Math.round(Math.max(40, cs)) + "px");
    ctx.wrap.style.setProperty("--jw", portrait ? "min(46vw,30vh)" : "clamp(200px,min(26vw,48vh),330px)");
    ctx.jarIn.innerHTML = "";
    // 병 앞 이름표: 담을 사탕 색(3단계는 개수도) → 글 못 읽어도 알 수 있게
    ctx.jar.querySelectorAll(".cdLabel").forEach((x) => x.remove());
    const label = U.el("div", "cdLabel", '<span class="cdC" style="--c:' + target.c + '"><span class="cdBall"></span></span>' + (lv === 3 ? "× " + need : ""));
    ctx.jar.appendChild(label);
    ctx.pile.innerHTML = "";
    ctx.lid.classList.add("open");
    ctx.cnt.textContent = "0";
    ctx.cnt.style.display = lv === 3 ? "" : "none";
    const ask = lv < 3 ? target.a + " 사탕을 모두 병에 담아요!" : target.a + " 사탕 " + ctx.CNT[need] + " 개를 병에 담아요!";
    ctx.say("🍬 " + ask);
    let got = 0,
      busy = false;
    const els = candies.map((col, i) => {
      const slot = U.el("div", "cdSlot");
      // cdHit: 보이지 않는 넓은 터치 영역(작은 화면에서도 잡기 쉽게)
      const c = U.el("div", "cdC item", '<span class="cdBall"></span><span class="cdHit"></span>');
      c.style.setProperty("--c", col.c);
      c.style.setProperty("--r", U.randf(-25, 25).toFixed(0) + "deg");
      c.style.setProperty("--i", i);
      if (col === target) c.dataset.go = "jar";
      slot.appendChild(c);
      ctx.pile.appendChild(slot);
      const d = KP.drag(c, {
        targets: () => (busy ? [] : [ctx.jar]),
        accept: () => col === target,
        pad: 36,
        onReject: (t) => ctx.miss(t, "이건 " + col.a + " 사탕이에요. " + target.a + " 사탕을 찾아요!"),
        onDrop: (t) => {
          if (!t) return;
          if (busy || got >= need) return d.home(); // 이미 다 담았으면 더 받지 않음
          d.lock();
          c.dataset.done = "1";
          got++;
          // 병 안에 차곡차곡 쌓기
          const k = got - 1;
          const perRow = 3;
          const row = Math.floor(k / perRow),
            colI = k % perRow;
          c.classList.remove("item", "draggable");
          c.style.transform = "";
          c.style.left = 6 + colI * 30 + (row % 2) * 8 + "%";
          c.style.bottom = 4 + row * 15 + "%";
          c.style.setProperty("--r", U.randf(-30, 30).toFixed(0) + "deg");
          ctx.jarIn.appendChild(c);
          A.note(A.SCALE[Math.min(got - 1, 11)], { inst: "marimba", dur: 0.3, vol: 0.28 });
          A.sfx("drop");
          ctx.cnt.textContent = got;
          U.replay(ctx.cnt, "bump");
          if (lv === 3) KP.voice.say(U.NAT[got] + "!");
          // 1·2단계: "빨간 사탕! 하나!" — 색 이름 조각 + 수 세기 조각(모두 자연 음성). 예전 "빨간 사탕이 쏙!"은 클립이 없어 기기 목소리였음
          else KP.voice.say(target.a + " 사탕! " + U.NAT[got] + "!");
          if (got >= need) {
            busy = true;
            done();
          } else hint();
        },
      });
      return c;
    });
    const hint = () => ctx.hint(() => els.find((c) => c.dataset.go && !c.dataset.done), ask);
    hint();
    const done = async () => {
      await ctx.wait(400);
      ctx.lid.classList.remove("open");
      A.sfx("snap");
      U.replay(ctx.jar, "yay");
      A.sfx("sparkle");
      KP.voice.say(target.a + " 사탕 " + ctx.CNT[need] + " 개! 병이 가득!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1300);
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 사탕 가게 사장님!" : "다 담았어요!", quiet: !big });
      if (ok) self.next(ctx);
    };
  },
});

;

/* ==== js/games/smart/color.js ==== */
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
      .clrObj{font-size:var(--sz);border-radius:30px;padding:clamp(10px,1.4vw,16px);background:#e3e9f6}
      .clrObj.right{background:#d9ffe4}
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
    }
    const nat = (...l) => (KP.voice._natUrls && l.find((t) => KP.voice._natUrls(t))) || l[0]; // 같은 뜻 중 자연 음성(이미 있는 조각)이 있는 문장
    // "갈색을" 처럼 녹음 없는 조각: "갈색 찾아요!"
    const askV = nat(ask, nameOf(target) + " 찾아요!");
    ctx.say("🎨 " + ask, askV);
    const btns = ctx.choices(ctx.grid, list, {
      cls: lv < 3 ? "clrBtn" : "clrObj",
      render,
      right: (v) => v === target,
      // "이건 하얀색이에요." 처럼 녹음이 없는 말은 "이건 하얀색!"(이미 있는 조각)으로
      wrongMsg: (v) => nat("이건 " + U.josa(nameOf(v), "이에요/예요") + ". " + ask, "이건 " + nameOf(v) + "! " + ask, "이건 " + nameOf(v) + "! " + askV),
      onRight: async (v, b) => {
        self.splash(ctx, b, colorOf(v));
        b.classList.add("clrHappy");
        KP.voice.say(sayRight);
        ctx.score.add();
        ctx.round++;
        await ctx.wait(900);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 색깔 박사!" : nameOf(v) + "!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), askV);
  },
});

;

/* ==== js/games/smart/count.js ==== */
/* 숫자 세기 — 하나씩 눌러 세고, 알맞은 숫자 고르기
   1단계: 1~3개 / 2단계: 1~5개 / 3단계: 3~10개(보기 4개) */
"use strict";
KP.game({
  id: "count",
  icon: "🔢",
  name: "숫자 세기",
  cat: "study",
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
    // 정답 근처 수 중에서 보기 고르기 (정답 10처럼 근처 수가 모자라면 아래로 넓혀 채움 — 무한 반복 방지)
    const opts = new Set([answer]);
    const near = U.shuffle([-2, -1, 1, 2, 3].map((d) => answer + d).filter((v) => v >= 1 && v <= Math.max(hi, 5)));
    for (const v of near) if (opts.size < nChoice) opts.add(v);
    for (let v = answer - 3; opts.size < nChoice && v >= 1; v--) opts.add(v);
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
          // 하나씩 다 세기 전에 숫자를 찍어 맞힌 판은 열쇠 별 제외 (1단계는 보기 3개라 찍어도 1/3) — 축하·단계는 그대로
          if (counted < answer) ctx._softMiss = (ctx._softMiss || 0) + 2;
          ctx.score.add();
          tiles.forEach((t, k) => ctx.after(k * 70, () => U.replay(t, "jump")));
          ctx.round++;
          const big = ctx.round % 5 === 0;
          const CNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
          const ok = await ctx.win({ big, msg: big ? "{부름} 숫자 박사!" : (CNT[answer] || answer) + " 개! 딩동댕!" });
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

;

/* ==== js/games/smart/dots.js ==== */
/* 숫자 순서 놀이 — 흩어진 숫자 풍선을 1부터 차례로 눌러요. 누를 때마다 도레미가 올라가고 선이 이어져요.
   다 이으면 풍선들이 하늘로 날아가요.
   1단계: 1~5 / 2단계: 1~8 / 3단계: 1~10 */
"use strict";
KP.game({
  id: "dots",
  icon: "1️⃣",
  name: "숫자 순서 놀이",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    // 화면 크기가 바뀌면: 진짜 회전(가로↔세로)이나 크게 바뀐 경우만 새 판으로 다시 배치하고,
    // 주소창이 숨겨지거나 나타나는 정도의 작은 변화는 풍선·선 위치만 비율로 옮겨 하던 판을 이어 감
    let rt = null;
    addEventListener("resize", () => {
      if (!ctx._active) return;
      if (rt) ctx.cancel(rt);
      rt = ctx.after(350, () => this.refit(ctx));
    });
    const U = KP.u;
    KP.css("dots", `
      .dtBoard{flex:1;min-height:0;position:relative;margin:0 10px 14px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.2));overflow:hidden}
      .dtSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
      .dtSvg line{stroke:#ff8a3d;stroke-width:8;stroke-linecap:round;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:dtDraw .35s forwards}
      @keyframes dtDraw{to{stroke-dashoffset:0}}
      .dtB{position:absolute;width:var(--b);height:calc(var(--b) * 1.18);margin:calc(var(--b) * -.55) 0 0 calc(var(--b) * -.5);padding:0;display:block;
        animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*60ms)}
      .dtBody{position:absolute;left:0;top:0;width:100%;height:calc(var(--b) * 1.1);border-radius:50% 50% 47% 47% / 55% 55% 45% 45%;background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.75) 0 10%,transparent 26%),var(--c);
        box-shadow:inset -6px -8px 0 rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;color:#fff;font-size:calc(var(--b) * .5);text-shadow:0 3px 0 rgba(0,0,0,.18);
        animation:dtBob 3s ease-in-out infinite;animation-delay:calc(var(--i) * -.37s)}
      @keyframes dtBob{50%{transform:translateY(-5px) rotate(2deg)}}
      .dtBody::after{content:"";position:absolute;bottom:-7px;left:50%;margin-left:-7px;border:7px solid transparent;border-bottom:9px solid var(--c);transform:rotate(180deg);border-bottom-color:var(--c)}
      .dtB.wrong .dtBody{animation:none}
      .dtB[data-done] .dtBody{box-shadow:inset -6px -8px 0 rgba(0,0,0,.12),0 0 0 6px #fff,0 0 0 11px var(--sun)}
      .dtB.pop{animation:dtPop .4s}
      @keyframes dtPop{40%{transform:scale(1.25)}}
      .dtB.away{transition:transform 1.4s cubic-bezier(.5,0,.7,1),opacity 1.4s;transform:translateY(-120vh) rotate(var(--r));opacity:.2}
    `);
    ctx.board = U.el("div", "dtBoard");
    ctx.body.appendChild(ctx.board);
    ctx.COLORS = ["#ff5b6e", "#ff9f1c", "#f5c400", "#3fbf6a", "#2f95f5", "#8a63ee", "#ff7eb9", "#14b8a6", "#ef6c3a", "#5b7cfa"];
    ctx.SINO = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 말할 숫자 + 조사 ("삼이에요", "이예요") — 말로만 쓰므로 숫자도 글자로(자연 음성 조각으로 이어 말하기) */
  nj(ctx, n, pair) {
    return KP.u.josa(ctx.SINO[n], pair);
  },
  place(W, H, n, B) {
    const U = KP.u;
    const pad = 8;
    for (let tries = 0; tries < 60; tries++) {
      const pts = [];
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        let placed = false;
        for (let k = 0; k < 300; k++) {
          const x = U.randf(B / 2 + pad, W - B / 2 - pad),
            y = U.randf(B * 0.6 + pad, H - B * 0.75 - pad);
          if (pts.every((p) => U.dist(p.x, p.y, x, y) > B * 1.25)) {
            pts.push({ x, y });
            placed = true;
            break;
          }
        }
        if (!placed) ok = false;
      }
      if (ok) return pts;
      B *= 0.95;
    }
    // 안 되면 격자
    const cols = Math.ceil(Math.sqrt((n * W) / H));
    const rows = Math.ceil(n / cols);
    return U.shuffle([...Array(cols * rows).keys()]).slice(0, n).map((i) => ({ x: ((i % cols) + 0.5) * (W / cols), y: (Math.floor(i / cols) + 0.5) * (H / rows) }));
  },
  refit(ctx) {
    const g = ctx.dt;
    const W = ctx.board.clientWidth,
      H = ctx.board.clientHeight;
    if (!g || !W || !H || !g.W || !g.H) return;
    if (W === g.W && H === g.H) return;
    const rotated = W > H !== g.W > g.H;
    const big = Math.abs(W - g.W) / g.W > 0.2 && Math.abs(H - g.H) / g.H > 0.2;
    if ((rotated || big) && !g.busy()) return this.next(ctx);
    const sx = W / g.W,
      sy = H / g.H;
    g.pts.forEach((p, i) => {
      p.x *= sx;
      p.y *= sy;
      const b = g.balloons[i];
      b.style.left = p.x + "px";
      b.style.top = p.y + "px";
    });
    g.svg.querySelectorAll("line").forEach((l) => {
      ["x1", "x2"].forEach((a) => l.setAttribute(a, +l.getAttribute(a) * sx));
      ["y1", "y2"].forEach((a) => l.setAttribute(a, +l.getAttribute(a) * sy));
      l.style.animation = "none";
      l.style.strokeDashoffset = "0";
    });
    g.W = W;
    g.H = H;
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const self = this;
    const n = [5, 8, 10][lv - 1];
    ctx.board.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "dtSvg");
    ctx.board.appendChild(svg);
    const W = ctx.board.clientWidth,
      H = ctx.board.clientHeight;
    const B = Math.max(64, Math.min(116, Math.sqrt((W * H) / (n * 4.6))));
    ctx.board.style.setProperty("--b", B + "px");
    const pts = this.place(W, H, n, B);
    const cols = U.shuffle([...ctx.COLORS]);
    let step = 1,
      busy = false;
    // 화면 글자 그대로 말하기: 숫자는 lookup 이 알아서 읽음 (1단계 "1부터 5까지 차례로 눌러요!"는 자연 음성 클립)
    ctx.say("🎈 1부터 " + n + "까지 차례로 눌러요!");
    const balloons = pts.map((p, i) => {
      const v = i + 1;
      const b = U.el("button", "dtB", '<span class="dtBody">' + v + "</span>");
      b.style.cssText = "left:" + p.x + "px;top:" + p.y + "px;--c:" + cols[i % cols.length] + ";--i:" + i + ";--r:" + U.randf(-20, 20) + "deg";
      b.dataset.seq = v;
      ctx.fast(b, () => tapB(b, v, p));
      ctx.board.appendChild(b);
      return b;
    });
    ctx.dt = { W, H, pts, svg, balloons, busy: () => busy };
    let prev = null;
    const tapB = async (b, v, p) => {
      if (busy || b.dataset.done) return;
      if (v === step) {
        b.dataset.done = "1";
        U.replay(b, "pop");
        A.note(A.SCALE[Math.min(v - 1, A.SCALE.length - 1)], { inst: "bell", dur: 0.6, vol: 0.3 });
        KP.voice.say(String(v));
        if (prev) {
          const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
          l.setAttribute("x1", prev.x);
          l.setAttribute("y1", prev.y);
          l.setAttribute("x2", p.x);
          l.setAttribute("y2", p.y);
          l.style.setProperty("--len", Math.ceil(U.dist(prev.x, prev.y, p.x, p.y)));
          svg.appendChild(l);
        }
        prev = p;
        step++;
        if (step > n) {
          busy = true;
          ctx.score.add();
          ctx.round++;
          await ctx.wait(500);
          A.melody(A.SCALE.slice(0, 8).map((x) => [x, 1]), { beat: 0.09, inst: "marimba", vol: 0.2 });
          A.sfx("whoosh");
          balloons.forEach((x, k) => ctx.after(k * 90, () => x.classList.add("away")));
          KP.voice.say("풍선이 날아가요! 와아!");
          await ctx.wait(1500);
          const big = ctx.round % 5 === 0;
          // 1단계 "1부터 5까지 다 했어요!"는 클립 있음. 8·10 은 클립이 없어 말은 자연 음성 "차례차례 잘했어요!"로
          const msg = big ? "{부름} 숫자 박사!" : "1부터 " + n + "까지 다 했어요!";
          const ok = await ctx.win({ big, msg, say: big || n === 5 ? undefined : "차례차례 잘했어요!" });
          if (ok) self.next(ctx);
        } else hint();
      } else {
        // "이건 칠! 오를 찾아요!" — 모두 자연 음성 조각 ("이건 칠!", "오를", "찾아요!")
        ctx.miss(b, "이건 " + ctx.SINO[v] + "! " + self.nj(ctx, step, "을/를") + " 찾아요!");
      }
    };
    const hint = () => ctx.hint(() => balloons[step - 1], self.nj(ctx, step, "을/를") + " 찾아요!");
    hint();
  },
});

;

/* ==== js/games/smart/feed.js ==== */
/* 동물 먹이 주기 — 배고픈 동물에게 맞는 먹이를 끌어다 입에 쏙! 먹으면 냠냠·하트.
   1단계: 동물 1마리, 먹이 3개 / 2단계: 동물 1마리, 먹이 4개 / 3단계: 동물 2마리, 먹이 5개(둘 다 먹여야 끝)
   (예전 1단계 먹이 2개는 틀려도 남은 하나가 정답이라 찍어도 열쇠 별이 나왔음 → 보기 3개 이상으로)
   음성: 동물×먹이 조합 문장은 녹음이 없어서 이미 있는 조각("냠냠!" "당근!" "토끼가" "좋아해요!")으로 이어 말함 */
"use strict";
KP.game({
  id: "feed",
  icon: "🥕",
  name: "동물 먹이 주기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("feed", `
      .fdWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 16px}
      .fdAnimals{display:flex;gap:clamp(8px,6vw,120px);max-width:100%;justify-content:center;align-items:flex-end}
      .fdAni{position:relative;display:flex;flex-direction:column;align-items:center;border-radius:40px;padding:8px 14px}
      @media (max-aspect-ratio:1/1){.fdWrap{--asz:var(--aszp)!important;--fsz:var(--fszp)!important}}
      .fdAni .fdEm{font-size:var(--asz);line-height:1;display:block;animation:fdIdle 2.4s ease-in-out infinite}
      @keyframes fdIdle{50%{transform:translateY(-6px) rotate(-2deg)}}
      .fdAni .fdName{font-size:clamp(20px,2.6vw,28px);margin-top:4px}
      .fdAni.dropHover{outline:none;background:rgba(255,197,49,.35);box-shadow:0 0 0 8px rgba(255,197,49,.35)}
      .fdAni.dropHover .fdEm{animation:fdOpen .5s ease-in-out infinite}
      @keyframes fdOpen{50%{transform:scale(1.12)}}
      .fdThink{position:absolute;top:-6px;right:-2px;font-size:clamp(28px,3.6vw,40px);background:#fff;border-radius:50%;width:1.5em;height:1.5em;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);animation:bob 2s ease-in-out infinite}
      .fdAni.full .fdThink{display:none}
      .fdChomp .fdEm{animation:fdChomp .9s ease-in-out}
      @keyframes fdChomp{15%,45%,75%{transform:scale(1.12,.86)}30%,60%,90%{transform:scale(.94,1.08)}}
      .fdHeart{position:absolute;left:50%;top:30%;font-size:clamp(30px,4vw,44px);pointer-events:none;animation:fdHeart 1.4s ease-out forwards}
      @keyframes fdHeart{from{transform:translate(-50%,0) scale(.3);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-140px) scale(1.1);opacity:0}}
      .fdYum{position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:var(--coral);color:#fff;border-radius:999px;padding:4px 14px;font-size:clamp(20px,2.6vw,28px);white-space:nowrap;animation:popIn .3s;z-index:3}
      .fdTray{display:flex;gap:clamp(12px,3vw,34px);justify-content:center;flex-wrap:wrap;background:rgba(255,255,255,.75);border-radius:32px;padding:clamp(10px,1.6vw,18px) clamp(14px,2.6vw,30px);box-shadow:inset 0 -6px 0 rgba(47,58,102,.08)}
      .fdFood{font-size:var(--fsz);line-height:1;padding:8px;border-radius:24px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.12)}
      .fdFood.dragging{background:transparent;box-shadow:none}
      .fdFood.eaten{transition:transform .35s ease-in,opacity .35s;opacity:0}
    `);
    ctx.wrap = U.el("div", "fdWrap");
    ctx.ani = U.el("div", "fdAnimals");
    ctx.tray = U.el("div", "fdTray");
    ctx.wrap.append(ctx.ani, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    // [동물, 이름, 먹이, 먹이 이름, 함께 먹는 것(보기에서 빼기)]
    ctx.FEED = [
      ["🐰", "토끼", "🥕", "당근", "🥬"], ["🐵", "원숭이", "🍌", "바나나", "🥜"], ["🐶", "강아지", "🦴", "뼈다귀", "🍖"],
      ["🐱", "고양이", "🐟", "생선", ""], ["🐼", "판다", "🎋", "대나무", "🍃"], ["🐿️", "다람쥐", "🌰", "도토리", "🥜"],
      ["🐮", "소", "🌾", "풀", "🥬🥕"], ["🐝", "꿀벌", "🌼", "꽃", "🍯"], ["🐻", "곰", "🍯", "꿀", "🐟🍓"], ["🐭", "쥐", "🧀", "치즈", "🌽🌰"],
      ["🐘", "코끼리", "🥜", "땅콩", "🍌🌾"], ["🐔", "닭", "🌽", "옥수수", "🌾"], ["🦁", "사자", "🍖", "고기", "🦴"], ["🐨", "코알라", "🍃", "나뭇잎", "🎋"],
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
    const nAni = lv === 3 ? 2 : 1;
    const nFood = [3, 4, 5][lv - 1];
    let pool = ctx.FEED.filter((f) => f !== ctx.last);
    const ani = U.sample(pool, nAni);
    ctx.last = ani[0];
    // 보기 먹이: 이번 동물들이 (함께) 먹는 것은 빼기 → 헷갈리는 정답 없음
    const ok = (f) => !ani.some((a) => a[2] === f[2] || a[4].includes(f[2]));
    const distract = U.sample(ctx.FEED.filter((f) => !ani.includes(f) && ok(f)), nFood - nAni);
    const foods = U.shuffle([...ani, ...distract]);

    ctx.wrap.style.setProperty("--asz", nAni === 1 ? "clamp(120px,min(28vw,28vh),230px)" : "clamp(96px,min(22vw,22vh),190px)");
    ctx.wrap.style.setProperty("--fsz", nFood <= 3 ? "clamp(70px,min(14vw,12vh),110px)" : "clamp(58px,min(12vw,10vh),96px)");
    ctx.wrap.style.setProperty("--aszp", nAni === 1 ? "clamp(120px,56vw,240px)" : "clamp(96px,36vw,190px)");
    ctx.wrap.style.setProperty("--fszp", ["", "", "clamp(70px,26vw,110px)", "clamp(64px,19vw,96px)", "clamp(56px,16vw,90px)", "clamp(56px,16vw,86px)"][nFood]);
    ctx.ani.innerHTML = "";
    ctx.tray.innerHTML = "";
    const aniEls = ani.map((a, i) => {
      const el = U.el("div", "fdAni item", '<span class="fdEm">' + KP.E(a[0]) + '</span><span class="fdName">' + a[1] + '</span><span class="fdThink">' + KP.E("❓") + "</span>");
      el.style.setProperty("--i", i);
      el.dataset.drop = a[1];
      ctx.ani.appendChild(el);
      return el;
    });
    const who = ani.map((a, i) => (i < ani.length - 1 ? U.josa(a[1], "이랑/랑") : a[1])).join(" "); // 곰이랑 토끼
    const ask = nAni === 1 ? U.josa(ani[0][1], "이/가") + " 배고파요! 맛있는 걸 끌어서 입에 쏙 넣어 줘요!" : U.josa(who, "이/가") + " 배고파요! 좋아하는 걸 하나씩 먹여 줘요!";
    // 음성: "곰이랑" 녹음이 없어 "곰 하고 토끼가"(이미 있는 조각)로
    const tail = nAni === 1 ? " 배고파요! 맛있는 걸 끌어서 입에 쏙 넣어 줘요!" : " 배고파요! 좋아하는 걸 하나씩 먹여 줘요!";
    const askV = nAni === 1 ? [ask, ani[0][1] + "!" + tail] : [ask, ani[0][1] + " 하고 " + U.josa(ani[1][1], "이/가") + tail, ani[0][1] + " 하고 " + ani[1][1] + "!" + tail];
    ctx.say("🍽️ " + ask, self.nat(...askV));
    KP.audio.tone(160, { to: 90, dur: 0.35, type: "triangle", vol: 0.18, when: 0.2 });

    let left = nAni;
    const foodEls = foods.map((f, i) => {
      const el = U.el("div", "fdFood item", KP.E(f[2]));
      el.style.setProperty("--i", i + 2);
      if (ani.includes(f)) el.dataset.go = f[1];
      ctx.tray.appendChild(el);
      const d = KP.drag(el, {
        targets: () => aniEls.filter((a) => !a.classList.contains("full")),
        accept: (t) => t.dataset.drop === f[1],
        pad: 34,
        onReject: (t) => {
          const a = ani.find((x) => x[1] === t.dataset.drop);
          U.replay(t.querySelector(".fdEm"), "wig");
          const m = U.josa(a[1], "은/는") + " " + U.josa(f[3], "을/를") + " 안 먹어요. 다른 걸 찾아봐요!";
          ctx.miss(null, self.nat(m, f[3] + "! " + U.josa(a[1], "은/는") + " 이건 안 먹어요. 다른 걸 찾아봐요!", f[3] + "! 이건 안 먹어요. 다른 걸 찾아봐요!"));
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          el.dataset.done = "1";
          el.classList.add("eaten");
          el.style.transform += " scale(.15)";
          self.eat(ctx, t, f);
          left--;
          if (left === 0) done();
          else hint();
        },
      });
      return el;
    });
    const hint = () => ctx.hint(() => foodEls.find((e) => e.dataset.go && !e.dataset.done), "먹이를 끌어서 동물 입에 쏙 넣어 줘요!");
    ctx.foodEls = foodEls; // 점검용
    hint();
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1500);
      const big = ctx.round % 5 === 0;
      const okk = await ctx.win({ big, msg: big ? "{부름} 먹이 주기 대장!" : "배불러요! 고마워요!" });
      if (okk) self.next(ctx);
    };
  },
  /** 같은 뜻 문장들 중 자연 음성(이미 녹음된 조각)으로 말할 수 있는 첫 문장, 없으면 첫 문장(기기 목소리) */
  nat(...list) {
    const N = KP.voice._natUrls;
    return (N && list.find((t) => N(t))) || list[0];
  },
  eat(ctx, t, f) {
    const U = KP.u,
      A = KP.audio;
    t.classList.add("full");
    U.replay(t, "fdChomp");
    t.querySelectorAll(".fdYum").forEach((x) => x.remove());
    t.appendChild(U.el("span", "fdYum", "냠냠!"));
    [0, 0.18, 0.36].forEach((w) => A.noise({ bp: 700, q: 1.5, dur: 0.1, vol: 0.25, when: w }));
    ctx.after(500, () => A.sfx("good"));
    for (let i = 0; i < 5; i++) {
      const h = U.el("span", "fdHeart", KP.E(i % 2 ? "💖" : "❤️"));
      h.style.setProperty("--dx", (i - 2) * 34 + "px");
      h.style.animationDelay = i * 0.12 + "s";
      t.appendChild(h);
      ctx.after(1800, () => h.remove());
    }
    const m = "냠냠! " + U.josa(f[1], "은/는") + " " + U.josa(f[3], "을/를") + " 좋아해요!";
    KP.voice.say(this.nat(m, "냠냠! " + f[3] + "! " + U.josa(f[1], "이/가") + " 좋아해요!", "냠냠! " + f[3] + "! " + f[1] + "! 좋아해요!"));
  },
});

;

/* ==== js/games/smart/floatsink.js ==== */
/* 둥실? 퐁당! — 점토 실험대 위 둥근 어항에 물건을 넣어 뜨는지 가라앉는지 직접 보는 탐구 놀이
   - 배경: 점토 방의 실험대 위 둥근 어항(물 2/3, 바닥 자갈). 물건은 점토 그림(15종)
   - 물건을 끌어 어항에 놓으면: 떨어짐 → 물보라(첨벙) → 뜨는 것은 물 위에서 둥실 흔들리고, 가라앉는 것은 거품을 내며 내려가 바닥에 '톡'
     물속에 잠긴 부분만 푸르게(그림을 물높이에서 둘로 나눠 아래쪽만 물빛·살짝 굴절) — 물건마다 잠기는 정도가 다름(얼음은 거의 다 잠김)
   - 아이가 칠한 3D 인형 1마리가 어항 옆에서 관찰 친구: 예상 고를 때 고개 갸웃(?) · 뜨면 폴짝 · 가라앉으면 아래를 내려다봄 · 생각이랑 다르면 깜짝(!)
   1단계: 자유롭게 넣어 보기 (물건 4개) — 별 없는 탐구형 (해 본 것을 칭찬)
   2단계: 넣기 전에 '뜰까? 가라앉을까?' 예상(둥실/퐁당 그림) → 넣어서 확인 (물건 3개)
   3단계: 두 물건 비교 — "어느 게 둥실 뜰까?" 하나 고르고 같이 넣기 (3쌍)
   열쇠 별: 2·3단계는 보기가 2개라 한 번만으로는 '찍어도 반' → 한 판의 예상 3번이 모두 맞을 때만 깨끗한 판
            (찍어서 다 맞힐 확률 1/8 — 보기 3개 한 문제(1/3)보다 낮음). 하나라도 다르면 _fewChoice 로 별 없음.
            예상이 달라도 틀림 소리·단계 내림 없음(직접 해 보고 알게 되는 놀이).
   물건: 실제로 결과가 분명한 것만. "큰 건 가라앉아" 같은 잘못된 일반화가 안 생기게
         큰데 뜨는 것(나무토막·수박)과 작은데 가라앉는 것(동전·열쇠·나사·반지)을 판마다 꼭 섞고,
         말도 "커도 둥실 떠요 / 작아도 퐁당 가라앉아요". '가벼워서 뜬다' 같은 이유는 말하지 않음(동전도 가벼움).
   공용: _shared/clay-stage.js(무대) · doll-actor.js(인형) · doll-follow.js(말풍선 따라가기) */
"use strict";
KP.game({
  id: "floatsink",
  icon: "🦆",
  name: "둥실? 퐁당!",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/floatsink/");
    KP.css("floatsink", `
      .fsWrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);padding:2px 12px 12px}
      .fsScene{position:relative;flex:1 1 0;min-height:150px;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#e9dcc6}
      .fsGlass{position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;pointer-events:none;mix-blend-mode:screen;opacity:.32;z-index:0}
      .fsZone{position:absolute;left:0;top:0;border-radius:46% 46% 44% 44%;pointer-events:none!important;transition:box-shadow .2s}
      .fsZone.dropHover{box-shadow:0 0 0 8px rgba(255,214,90,.55),inset 0 0 40px rgba(255,236,170,.35)}
      .fsObjL{position:absolute;inset:0;pointer-events:none!important;z-index:0;overflow:hidden}
      .fo{position:absolute;left:0;top:0;width:var(--s,80px);height:var(--s,80px);pointer-events:none;will-change:transform}
      .fo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
      .fo .a{filter:drop-shadow(0 4px 3px rgba(40,60,80,.18))}
      .fo .w{position:absolute;inset:0}
      .fo .w img{transform:translateX(3%) scale(1.05,1);filter:saturate(.7) brightness(.92)}
      .fo .w i{position:absolute;inset:0;transform:translateX(3%) scale(1.05,1);background:linear-gradient(rgba(120,205,240,.26),rgba(50,140,205,.4));
        -webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}
      .fo .ln{position:absolute;left:8%;right:8%;height:6px;margin-top:-3px;border-radius:50%;border:2px solid rgba(255,255,255,.85);border-bottom-color:rgba(255,255,255,.25);display:none}
      .fsTag{position:absolute;left:0;top:0;transform:translate(-50%,-100%);font-size:clamp(14px,1.9vw,20px);background:#fffaf2;border-radius:999px;padding:2px 10px;white-space:nowrap;box-shadow:0 3px 0 rgba(120,80,40,.15);animation:fsTagIn .3s cubic-bezier(.2,1.5,.4,1);pointer-events:none!important;z-index:5}
      @keyframes fsTagIn{from{scale:.5;opacity:0}}
      .fsDrop{position:absolute;left:0;top:0;width:12px;height:16px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#bfe8ff;box-shadow:inset -2px -3px 0 rgba(60,150,220,.35);pointer-events:none!important;z-index:6;animation:fsDrop .75s ease-out forwards}
      @keyframes fsDrop{0%{transform:translate(var(--x),var(--y)) translate(-50%,0) scale(.6);opacity:1}55%{transform:translate(calc(var(--x) + var(--dx)*.7),calc(var(--y) + var(--dy))) translate(-50%,0) scale(1)}100%{transform:translate(calc(var(--x) + var(--dx)),calc(var(--y) + var(--dy)*.2 + 30px)) translate(-50%,0) scale(.5);opacity:0}}
      .fsRing{position:absolute;left:0;top:0;width:var(--w,60px);height:calc(var(--w,60px)*.24);border:3px solid rgba(255,255,255,.9);border-radius:50%;pointer-events:none!important;z-index:2;animation:fsRing .9s ease-out forwards}
      @keyframes fsRing{from{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(2.2);opacity:0}}
      .fsBub{position:absolute;left:0;top:0;width:var(--b,12px);height:var(--b,12px);border-radius:50%;border:2px solid rgba(255,255,255,.9);background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.7),rgba(255,255,255,.1) 60%);pointer-events:none!important;z-index:2;animation:fsBub 1.4s ease-in forwards}
      @keyframes fsBub{from{transform:translate(var(--x),var(--y)) translate(-50%,-50%)}to{transform:translate(calc(var(--x) + var(--dx)),calc(var(--y) + var(--rise))) translate(-50%,-50%) scale(1.3);opacity:0}}
      .fsThink{display:flex;align-items:center;justify-content:center;min-width:1.5em;height:1.5em;padding:0 .2em;border-radius:999px;background:#fffaf2;box-shadow:0 4px 0 rgba(120,80,40,.15);font-size:clamp(20px,calc(var(--dh,200px)*.12),40px);font-weight:bold;color:#7b6ad8;animation:popIn .35s cubic-bezier(.2,1.5,.4,1)}
      .fsThink.ex{color:#ff7a3d}
      .fsThink.q{animation:fsWob 1.6s ease-in-out infinite}
      @keyframes fsWob{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
      .fsLoad{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      .fsSide{flex:0 0 auto;display:flex;flex-direction:row;gap:clamp(8px,1.6vw,18px);align-items:center;justify-content:center;flex-wrap:wrap}
      .fsPred{display:flex;gap:clamp(10px,2vw,22px);justify-content:center}
      .fsPred[hidden]{display:none}
      .fsPB{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px 6px;border-radius:24px;background:#fffaf2;box-shadow:0 6px 0 rgba(140,95,50,.18);font-size:clamp(18px,2.4vw,24px);color:var(--ink);min-width:96px}
      .fsPB:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(140,95,50,.18)}
      .fsPB.picked{background:#fff3c4;box-shadow:0 0 0 5px #ffc531,0 6px 0 rgba(140,95,50,.18)}
      .fsPB.off{opacity:.45}
      .fsMini{position:relative;width:var(--mw,84px);height:calc(var(--mw,84px)*.8);border-radius:40% 40% 34% 34%;overflow:hidden;background:#f2f8fb;border:3px solid #cfe4ef}
      .fsMini::before{content:"";position:absolute;left:0;right:0;top:40%;bottom:0;background:linear-gradient(180deg,#8fd4f5,#4aa6e0)}
      .fsMini::after{content:"";position:absolute;left:0;right:0;bottom:0;height:16%;background:radial-gradient(circle at 30% 40%,#d9c08f 3px,transparent 4px) 0 0/12px 8px,#e6cf9e}
      .fsMini img{position:absolute;left:50%;width:46%;height:46%;object-fit:contain;transform:translate(-50%,-50%);z-index:1}
      .fsMini.up img{top:38%;animation:fsBob 2.2s ease-in-out infinite}
      .fsMini.down img{top:66%}
      @keyframes fsBob{50%{transform:translate(-50%,-44%) rotate(4deg)}}
      .fsMini .fsArrow{position:absolute;right:3px;top:50%;width:24%;transform:translateY(-50%);z-index:2}
      .fsMini .fsArrow .e{width:100%;height:auto}
      .fsTray{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,2vw,22px);padding:clamp(8px,1.4vh,14px) clamp(12px,2.4vw,26px);border-radius:28px;
        background:linear-gradient(#f7ead6,#efdcc0);box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12);max-width:100%}
      .fsItem{width:var(--is,84px);height:var(--is,84px);display:flex;align-items:center;justify-content:center;border-radius:24px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);box-shadow:0 6px 0 rgba(140,95,50,.18);position:relative;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)}
      .fsItem img{width:calc(78% * var(--sc,1));height:calc(78% * var(--sc,1));object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(80,40,20,.22))}
      .fsItem.dragging{background:transparent;box-shadow:none;z-index:20}
      .fsItem.used{visibility:hidden}
      .fsTray.fsGone{visibility:hidden}
      .fsItem.dim{opacity:.35}
      .fsItem.cur{box-shadow:0 0 0 5px #ffc531,0 6px 0 rgba(140,95,50,.18);animation:fsCur 1.4s ease-in-out infinite}
      @keyframes fsCur{50%{transform:scale(1.06)}}
      .fsItem.picked{background:#fff3c4;box-shadow:0 0 0 6px #ffc531,0 6px 0 rgba(140,95,50,.18)}
      .fsWrap.pair .fsItem{--is:var(--is2,110px)}
      @media (orientation:portrait){
        .fsScene{flex:0 1 auto;height:min(calc((100vw - 24px) / 1.08), 64vh)}
        .fsSide{flex:1 1 0;flex-direction:column;justify-content:center}
      }
      @media (orientation:landscape) and (max-height:520px){
        .fsWrap{flex-direction:row;padding:2px 10px 8px}
        .fsScene{min-height:0}
        .fsSide{width:min(40vw,300px);flex-direction:column;flex-wrap:nowrap}
        .fsTray{gap:8px;padding:8px 10px}
      }
    `);
    const wrap = (ctx.fsWrap = U.el("div", "fsWrap"));
    const scene = (ctx.scene = U.el("div", "fsScene"));
    const side = U.el("div", "fsSide");
    ctx.pred = U.el("div", "fsPred");
    ctx.pred.hidden = true;
    ctx.shelf = U.el("div", "fsTray");
    side.append(ctx.pred, ctx.shelf);
    wrap.append(scene, side);
    ctx.body.appendChild(wrap);
    // 무대 위 층들 (무대를 새로 만들 때마다 옮겨 붙임)
    ctx.zone = U.el("div", "fsZone");
    ctx.objL = U.el("div", "fsObjL");
    ctx.glass = U.el("div", "fsGlass");

    // [그림, 이름, 뜨나?, 크기(big/mid/small), 결과 말, 잠기는 정도(뜨는 것)]
    // 크기는 그림 크기(sc)로도 보여 줌 — 큰데 뜨는 것·작은데 가라앉는 것을 눈으로 보게
    const T = (img, name, fl, sz, line, sub) => ({ img: IMG + img + ".png", em: img, name, fl, sz, line, sub: sub || 0 });
    ctx.FLOAT = [
      T("wood", "나무토막", true, "big", "나무토막은 커도 둥실 떠요!", 0.5),
      T("melon", "수박", true, "big", "수박은 커도 둥실 떠요!", 0.6),
      T("duck", "오리", true, "mid", "오리는 둥실 떠요!", 0.3),
      T("apple", "사과", true, "mid", "사과는 둥실 떠요!", 0.72),
      T("ball", "공", true, "mid", "공은 둥실 떠요!", 0.16),
      T("ice", "얼음", true, "mid", "얼음은 둥실 떠요!", 0.86),
      T("leaf", "나뭇잎", true, "small", "나뭇잎은 둥실 떠요!", 0.12),
      T("feather", "깃털", true, "small", "깃털은 둥실 떠요!", 0.08),
    ];
    ctx.SINK = [
      T("stone", "돌", false, "big", "돌은 퐁당 가라앉아요!"),
      T("anchor", "닻", false, "big", "닻은 퐁당 가라앉아요!"),
      T("spoon", "숟가락", false, "mid", "숟가락은 퐁당 가라앉아요!"),
      T("coin", "동전", false, "small", "동전은 작아도 퐁당 가라앉아요!"),
      T("key", "열쇠", false, "small", "열쇠는 작아도 퐁당 가라앉아요!"),
      T("bolt", "나사", false, "small", "나사는 작아도 퐁당 가라앉아요!"),
      T("ring", "반지", false, "small", "반지는 작아도 퐁당 가라앉아요!"),
    ];
    ctx.SC = { big: 1.3, mid: 1, small: 0.76 };
    // 잘못된 일반화를 깨는 물건: 큰데 뜸 / 작은데 가라앉음
    ctx.isCounter = (t) => (t.fl && t.sz === "big") || (!t.fl && t.sz === "small");
    // 어항 그림(1344×752) 안의 자리 (그림 px): 물높이·바닥(자갈 위)·물 안쪽 좌우
    ctx.TANK = { surf: 311, rest: 588, l: 352, r: 992, slots: [452, 562, 672, 782, 892], top: 140 };
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1344, 752], vh: 0.52, near: 0.2, fov: 34, focus: [0.55, 0.5], focusP: [0.558, 0.5],
      sun: [-0.6, 1, 0.5], sunCol: "#fff3e0",
    };
    ctx.fsSize = () => {
      const vw = innerWidth, vh = innerHeight;
      const row = getComputedStyle(wrap).flexDirection === "row";
      const portrait = vh > vw;
      const n = ctx.shelf.children.length || 4;
      let is;
      if (row) is = U.clamp(Math.min((Math.min(vw * 0.4, 300) - 30) / Math.min(n, 2) - 10, vh * 0.2), 58, 96);
      else if (portrait) is = U.clamp(Math.min((vw - 60) / n - 14, vh * 0.15), 64, 120); // 세로 폰: 어항 아래 빈 곳이 커서 조금 크게(64px 이상)
      else is = U.clamp(Math.min((vw * 0.55) / n - 14, vh * 0.12), 60, 104);
      wrap.style.setProperty("--is", Math.round(is) + "px");
      wrap.style.setProperty("--is2", Math.round(row ? U.clamp(Math.min(vw * 0.17, vh * 0.3), 70, 120) : U.clamp(Math.min(vw * 0.3, vh * 0.15), 80, 136)) + "px");
      ctx.pred.style.setProperty("--mw", Math.round(row ? U.clamp(vh * 0.2, 60, 84) : U.clamp(Math.min(vw * 0.18, vh * 0.1), 64, 96)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.fsSize());
    ctx.token = 0;
    ctx.objs = [];
  },

  /* ---------- 무대 · 인형 (병원·목욕과 같은 방식) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("floatsink:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    let st;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => ctx._active && ctx.st === st && this.start(ctx, true),
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("floatsink:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    try {
      st = CS.create(ctx.scene, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.scene, ctx.BG, opt);
    }
    ctx.st = st;
    // 물건 층·유리 반사는 배경 바로 위(3D 인형 아래) — 인형은 어항 앞에 서 있으니 늘 물건보다 앞
    st.ui.append(ctx.zone);
    ctx.scene.insertBefore(ctx.objL, st.bgEl.nextSibling);
    ctx.scene.insertBefore(ctx.glass, ctx.objL.nextSibling); // 어항 유리 반사: 물건 위에 살짝 (물건이 유리 안에 있는 느낌)
    ctx.glass.style.backgroundImage = 'url("' + ctx.BG.file + '")';
    st.onResize = () => this.layout(ctx);
    this.layout(ctx);
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.fw) ctx.fw.clear();
    ctx.fw = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
    ctx.glass.remove();
    ctx.objL.remove();
  },
  /** 화면 크기에 맞춰: 넣는 곳(어항)·유리 반사·인형 자리 */
  layout(ctx) {
    const st = ctx.st, U = KP.u;
    if (!st || !st.bc) return;
    const v = st.bc.view, k = v.fw / 1344, TK = ctx.TANK;
    const p = (x, y) => ({ x: x * k - v.ox, y: y * k - v.oy });
    const a = p(TK.l - 10, 170), b = p(TK.r + 10, 660);
    ctx.zone.style.cssText = `width:${b.x - a.x}px;height:${b.y - a.y}px;transform:translate(${a.x}px,${a.y}px)`;
    // 유리 반사 층: 배경과 같은 크기·자리, 어항 모양만
    const g = ctx.glass.style;
    g.backgroundSize = v.fw + "px " + v.fh + "px";
    g.backgroundPosition = -v.ox + "px " + -v.oy + "px";
    const c = p((TK.l + TK.r) / 2 - 2, 405), rx = 330 * k, ry = 262 * k;
    g.clipPath = `ellipse(${rx}px ${ry}px at ${c.x}px ${c.y}px)`;
    ctx.K = k;
    ctx.P = p;
    // 인형: 어항 오른쪽 실험대 위 (좁은 화면은 화면 안쪽으로 — 어항 앞 오른쪽)
    const act = ctx.actor;
    if (act) {
      const foot = p(1080, 690);
      const gr = (x, y) => st.bc.ground((x + v.ox) / v.fw, (y + v.oy) / v.fh);
      const g0 = gr(foot.x, foot.y) || st.spot("x");
      act.setH(st.fitH(g0[0], g0[1], st.h > st.w * 0.95 ? 0.3 : 0.4));
      const bw = act.box().w || 120;
      const right = p(TK.r, 500).x;
      const dx = U.clamp(Math.max(foot.x, right + bw * 0.42), bw * 0.6, st.w - bw * 0.55);
      ctx.dollAt = gr(dx, foot.y) || g0;
      if (act.a.state === "idle" && !act._jump && !ctx._entering) act.place(ctx.dollAt[0], ctx.dollAt[1]);
    }
  },
  pickDoll(ctx) {
    const U = KP.u, D = KP.DOLL;
    const list = ctx.dolls || [];
    if (list.length) {
      const c = list.length > 1 ? list.filter((x) => x.id !== ctx.lastDoll) : list;
      const it = U.pick(c);
      ctx.lastDoll = it.id;
      return { item: it };
    }
    const sp = U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },
  async start(ctx, again) {
    if (!again) ctx.round = 0;
    ctx.rid = ctx.rid || 0; // 판 번호는 계속 올림 (다시 열어도 done 중복 막기와 겹치지 않게)
    const tok = ++ctx.token;
    ctx.shelf.innerHTML = "";
    ctx.shelf.classList.remove("fsGone");
    ctx.pred.hidden = true;
    this.clearObjs(ctx);
    ctx.scene.querySelectorAll(".fsLoad").forEach((e) => e.remove());
    const wait = KP.u.el("div", "fsLoad", KP.E("🦆") + " 준비 중");
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted().catch(() => []); // 저장 인형을 못 읽으면 기본 인형으로
    if (tok !== ctx.token || !ctx._active) {
      ctx.cancel(wt); // '준비 중' 표시가 뒤늦게 붙거나 남지 않게
      wait.remove();
      return;
    }
    const st = await this.makeStage(ctx);
    if (!st || tok !== ctx.token || !ctx._active) {
      ctx.cancel(wt);
      wait.remove();
      return;
    }
    // 관찰 친구 인형
    let act = null;
    try {
      act = st.gl ? await KP.dollActor.create(st, this.pickDoll(ctx)) : await KP.dollActor.create2D(st, this.pickDoll(ctx));
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (tok === ctx.token && ctx.st === st && !st.dead) act = await KP.dollActor.create2D(st, { species: "bear" }).catch(() => null);
    }
    ctx.cancel(wt);
    wait.remove();
    if (tok !== ctx.token || !ctx._active || ctx.st !== st || st.dead) {
      if (act) act.dispose();
      return;
    }
    ctx.actor = act;
    ctx.fw = act ? KP.dollFollow(st.ui, act, { cls: "dfT" }) : null;
    ctx.poseT = {};
    if (act) {
      this.layout(ctx);
      ctx._entering = true;
      const tgt = ctx.dollAt;
      act.place(tgt[0] + st.pxToWorld(tgt[0], tgt[1], st.w * 0.45), tgt[1]);
      act.jumpTo(tgt[0], tgt[1], 0.8, 0.5).then(() => {
        ctx._entering = false;
        this.layout(ctx);
      });
    }
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      this.poseStep(ctx, dt, st.time);
      if (ctx.fw) ctx.fw.update();
      this.stepObjs(ctx, dt, st.time);
    });
    // 점검용
    ctx.fsState = () => ({ gl: !!st.gl, painted: !!(act && act.painted), who: act && act.name, objs: ctx.objs.map((o) => ({ n: o.t.name, fl: o.t.fl, st: o.state, wl: Math.round(o.wl) })), level: ctx.level });
    this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    this.clearObjs(ctx);
    this.dropStage(ctx);
  },

  /* ---------- 인형 몸짓 ---------- */
  pose(ctx, o) {
    ctx.poseT = o || {};
  },
  poseStep(ctx, dt, t) {
    const act = ctx.actor;
    if (!act || !act.play) return;
    const p = act.play, k = Math.min(1, dt * 7), T = ctx.poseT || {};
    for (const key of ["fR", "fL", "uR", "uL", "nod", "tilt", "sway", "bob"]) p[key] += ((T[key] || 0) - p[key]) * k;
    if (ctx.tiltOn) p.tilt += Math.sin(t * 2.4) * 0.014;
  },
  /** 머리 위 생각 말풍선: "?" (궁금) · "!" (깜짝) · null (없앰) */
  think(ctx, ch) {
    if (!ctx.fw) return;
    if (ctx.thinkEl) ctx.fw.kill(ctx.thinkEl);
    ctx.thinkEl = null;
    if (!ch) return;
    const el = KP.u.el("span", "fsThink " + (ch === "?" ? "q" : "ex"), ch);
    ctx.thinkEl = el;
    ctx.fw.add(el, "headTop", -0.3, -0.12); // 머리 왼쪽 위(어항 쪽) — 인형이 화면 오른쪽 끝에 있어도 잘리지 않게
    ctx.scene.style.setProperty("--dh", ctx.fw.dh + "px");
  },
  /** 결과 보고 반응: 뜨면 폴짝·만세, 가라앉으면 아래를 내려다봄 → 끄덕 */
  react(ctx, fl, surprised) {
    const act = ctx.actor;
    if (!act) return;
    ctx.tiltOn = false;
    if (surprised) this.think(ctx, "!");
    else this.think(ctx, null);
    if (fl) {
      act.happy();
      this.pose(ctx, { uR: 1.6, uL: 1.6 });
      ctx.after(700, () => this.pose(ctx, {}));
    } else {
      this.pose(ctx, { nod: 0.32, tilt: -0.08 });
      ctx.after(900, () => {
        this.pose(ctx, {});
        act.hop();
      });
    }
    if (surprised) ctx.after(1400, () => this.think(ctx, null));
  },

  /** 물건 고르기: 뜨는 것 nF, 가라앉는 것 nS — 반드시 '반대 예'(큰데 뜸/작은데 가라앉음) 하나 이상 */
  pick(ctx, nF, nS) {
    const U = KP.u;
    let f, s;
    do {
      f = U.sample(ctx.FLOAT, nF);
      s = U.sample(ctx.SINK, nS);
    } while (![...f, ...s].some(ctx.isCounter) || (ctx.lastSet && [...f, ...s].every((t) => ctx.lastSet.includes(t.em))));
    ctx.lastSet = [...f, ...s].map((t) => t.em);
    return { f, s };
  },
  /** 이번 판이 아직 그대로인가 (나갔다 오거나 다음 판으로 넘어가면 false) */
  alive(ctx, rid, sess) {
    return ctx._active && ctx._session === sess && ctx.rid === rid;
  },
  clearObjs(ctx) {
    ctx.objs.forEach((o) => o.el.remove());
    ctx.objs = [];
    ctx.objL.innerHTML = "";
  },
  next(ctx) {
    ctx.rid++;
    this.clearObjs(ctx);
    ctx.slots = { true: [], false: [] };
    ctx.shelf.innerHTML = "";
    ctx.shelf.classList.remove("fsGone");
    ctx.pred.hidden = true;
    ctx.tiltOn = false;
    this.think(ctx, null);
    this.pose(ctx, {});
    ctx.fsWrap.classList.toggle("pair", ctx.level === 3);
    const lv = ctx.level;
    if (lv === 1) this.free(ctx);
    else if (lv === 2) this.guess(ctx);
    else this.pair(ctx);
    ctx.fsSize();
  },
  item(ctx, t, i) {
    const U = KP.u;
    const el = U.el("div", "fsItem item", '<img alt="" draggable="false" src="' + t.img + '">');
    el.style.setProperty("--sc", ctx.SC[t.sz]);
    el.style.setProperty("--i", i);
    el.dataset.fl = t.fl ? "1" : "0"; // 점검용 (힌트는 이 값을 보지 않음)
    el.setAttribute("aria-label", t.name);
    ctx.shelf.appendChild(el);
    return el;
  },
  /** 끌어서 어항에 넣기 — 놓은 자리(가로 위치)로 떨어짐 */
  dragIn(ctx, el, t, opt) {
    const self = this;
    let lx = 0;
    const d = KP.drag(el, {
      targets: () => (ctx.st ? [ctx.zone] : []),
      pad: 30,
      snap: false,
      onPick: () => opt.pick && opt.pick(),
      onMove: (x) => (lx = x),
      onDrop: (tg) => {
        if (!tg || !ctx.st) return;
        d.lock();
        el.classList.add("used");
        el.style.transform = "";
        const r = ctx.scene.getBoundingClientRect(), v = ctx.st.bc.view;
        const ix = (lx - r.left + v.ox) / ctx.K; // 그림 px
        opt.drop(self.dropIn(ctx, t, ix));
      },
    });
    return d;
  },
  /** 떠 있는 줄 / 바닥 줄에서 비어 있는 가장 가까운 칸 (그림 px) */
  slot(ctx, fl, ix) {
    const S = ctx.TANK.slots;
    const used = ctx.slots[fl];
    const free = S.filter((s) => !used.includes(s));
    const list = free.length ? free : S;
    let best = list[0];
    list.forEach((s) => Math.abs(s - ix) < Math.abs(best - ix) && (best = s));
    used.push(best);
    return best;
  },

  /* ---------- 물에 넣기: 떨어짐 → 첨벙 → 둥실 / 퐁당·톡 (그림 px 좌표로 움직이고 매 장면 화면에 옮김) ---------- */
  dropIn(ctx, t, ix) {
    const U = KP.u;
    const x = this.slot(ctx, t.fl, U.clamp(ix, ctx.TANK.l + 60, ctx.TANK.r - 60));
    const size = 150 * ctx.SC[t.sz];
    const el = U.el("div", "fo", '<img class="a" alt="" src="' + t.img + '"><div class="w"><img alt="" src="' + t.img + '"><i></i></div><span class="ln"></span>');
    el.querySelector(".w i").style.maskImage = el.querySelector(".w i").style.webkitMaskImage = 'url("' + t.img + '")';
    ctx.objL.appendChild(el);
    const rid = ctx.rid;
    return new Promise((res) => {
      const o = {
        t, el, x, y: ctx.TANK.top, vy: 0, size, rot: U.randf(-10, 10), vr: U.randf(-40, 40), state: "fall", ph: Math.random() * 6, wl: 0, res, rid, tt: 0,
        a: el.querySelector(".a"), w: el.querySelector(".w"), ln: el.querySelector(".ln"),
      };
      // 그림 비율 (세로가 짧은 것은 실제로 차지하는 높이가 작음)
      const im = new Image();
      im.onload = () => (o.ar = im.naturalHeight / im.naturalWidth);
      im.src = t.img;
      o.ar = 1;
      ctx.objs.push(o);
      KP.audio.tone(700, { to: 300, dur: 0.25, vol: 0.06, type: "sine" }); // 휘익
    });
  },
  /** 매 장면: 물건 움직이기 + 물에 잠긴 부분 나누기 */
  stepObjs(ctx, dt, time) {
    if (!ctx.objs.length || !ctx.P) return;
    const TK = ctx.TANK, k = ctx.K, A = KP.audio, U = KP.u;
    for (const o of ctx.objs) {
      const hh = (o.size * Math.min(1, o.ar || 1)) / 2; // 실제 그림 반 높이 (그림 px)
      o.tt += dt;
      if (o.state === "fall") {
        o.vy += 2200 * dt;
        o.y += o.vy * dt;
        o.rot += o.vr * dt;
        if (o.y + hh >= TK.surf) {
          o.state = o.t.fl ? "float" : "sink";
          o.vy *= o.t.fl ? 0.35 : 0.3;
          this.splash(ctx, o.x, o.size);
          o.splashT = o.tt;
        }
      } else if (o.state === "float") {
        // 잠기는 정도(sub)만큼 물에 잠긴 자리로 — 출렁이며 자리 잡기
        const eq = TK.surf - hh + o.t.sub * hh * 2;
        o.vy += ((eq - o.y) * 60 - o.vy * 5) * dt;
        o.y += o.vy * dt;
        o.rot += (Math.sin(time * 1.7 + o.ph) * 4 - o.rot) * Math.min(1, dt * 3);
        if (!o.done && o.tt - o.splashT > 1.1) {
          o.done = true;
          [0, 0.12, 0.24].forEach((w, i) => A.note(["C5", "E5", "G5"][i], { inst: "marimba", dur: 0.25, vol: 0.2, when: w }));
          this.tag(ctx, o, "둥실");
          o.res();
        }
        if (o.done) o.y = eq + Math.sin(time * 2 + o.ph) * 2.5; // 둥실 흔들림
      } else if (o.state === "sink") {
        // 물속에서는 천천히 (끝 속도) · 좌우로 살랑
        o.vy += (230 - o.vy) * Math.min(1, dt * 3);
        o.y += o.vy * dt;
        o.rot += (Math.sin(o.tt * 3.2 + o.ph) * 12 - o.rot) * Math.min(1, dt * 4);
        o.bubT = (o.bubT || 0) - dt;
        if (o.bubT <= 0 && o.y < TK.rest - hh - 30) {
          o.bubT = 0.22;
          this.bubble(ctx, o, hh);
        }
        if (o.y + hh >= TK.rest) {
          o.y = TK.rest - hh;
          o.state = "land";
          o.vy = -60;
          o.settle = U.randf(-12, 12);
          A.tone(950, { to: 620, dur: 0.06, vol: 0.16, type: "triangle" }); // 톡
          A.noise({ dur: 0.08, vol: 0.08, bp: 900, q: 1.5 });
          if (ctx.st) KP.pfx.ring(ctx.objL, ctx.P(o.x, TK.rest).x, ctx.P(o.x, TK.rest).y, "rgba(255,255,255,.8)", ctx, o.size * k * 0.9);
        }
      } else if (o.state === "land") {
        o.vy += 900 * dt;
        o.y = Math.min(TK.rest - hh, o.y + o.vy * dt);
        o.rot += (o.settle - o.rot) * Math.min(1, dt * 6);
        if (!o.done && o.y >= TK.rest - hh - 0.5 && o.vy > 0) {
          o.done = true;
          this.tag(ctx, o, "퐁당");
          o.res();
        }
      }
      // 화면에 옮기기
      const c = ctx.P(o.x, o.y), s = o.size * k;
      o.el.style.setProperty("--s", s + "px");
      o.el.style.transform = `translate(${c.x - s / 2}px,${c.y - s / 2}px) rotate(${o.rot}deg)`;
      // 물높이 = 상자 위에서 몇 % 인가 (상자 = 정사각형 s, 가운데 o.y)
      const wl = U.clamp(((TK.surf - (o.y - o.size / 2)) / o.size) * 100, 0, 100);
      if (Math.abs(wl - o.wl) > 0.3 || o.tt < 0.05) {
        o.wl = wl;
        o.a.style.clipPath = `inset(0 0 ${100 - wl}% 0)`;
        o.w.style.clipPath = `inset(${wl}% 0 0 0)`;
        const show = wl > 1 && wl < 99 && o.state !== "fall";
        o.ln.style.display = show ? "block" : "none";
        if (show) o.ln.style.top = wl + "%";
      }
      if (o.tagEl) this.tagAt(ctx, o, hh);
    }
  },
  tag(ctx, o, txt) {
    o.tagEl = KP.u.el("span", "fsTag", txt);
    this.tagAt(ctx, o, (o.size * Math.min(1, o.ar || 1)) / 2);
    ctx.objL.appendChild(o.tagEl);
  },
  tagAt(ctx, o, hh) {
    const tp = ctx.P(o.x, o.y - hh - 6);
    o.tagEl.style.transform = `translate(${tp.x}px,${tp.y}px) translate(-50%,-100%)`;
  },
  splash(ctx, x, size) {
    const U = KP.u, A = KP.audio, P = ctx.P(x, ctx.TANK.surf), k = ctx.K;
    A.noise({ dur: 0.4, vol: 0.28, bp: 1400, bpTo: 400, q: 0.9 });
    A.sfx("water");
    const ring = U.el("span", "fsRing");
    ring.style.cssText = `--x:${P.x}px;--y:${P.y}px;--w:${size * k * 1.1}px`;
    ctx.objL.appendChild(ring);
    ctx.after(950, () => ring.remove());
    const n = 9, sp = size * k * 0.22;
    for (let i = 0; i < n; i++) {
      const d = U.el("span", "fsDrop");
      d.style.cssText = `--x:${P.x}px;--y:${P.y - 8}px;--dx:${(i - (n - 1) / 2) * sp * 0.5 + U.randf(-6, 6)}px;--dy:${-U.randf(30, 80) * Math.max(0.7, k * 1.6)}px`;
      ctx.objL.appendChild(d);
      ctx.after(800, () => d.remove());
    }
  },
  bubble(ctx, o, hh) {
    const U = KP.u, TK = ctx.TANK, k = ctx.K;
    const p = ctx.P(o.x + U.randf(-0.25, 0.25) * o.size, o.y - hh * 0.4);
    const b = U.el("span", "fsBub");
    const sz = U.randf(8, 16) * Math.max(0.7, k * 1.4);
    b.style.cssText = `--x:${p.x}px;--y:${p.y}px;--b:${sz}px;--dx:${U.randf(-12, 12)}px;--rise:${-Math.max(10, (o.y - hh * 0.4 - TK.surf) * k)}px`;
    ctx.objL.appendChild(b);
    KP.audio.tone(U.randf(700, 1100), { to: 1500, dur: 0.07, type: "sine", vol: 0.05 });
    ctx.after(1450, () => b.remove());
  },

  /* ---------- 1단계: 자유롭게 넣어 보기 ---------- */
  free(ctx) {
    const U = KP.u;
    const self = this;
    const rid = ctx.rid,
      sess = ctx._session;
    const { f, s } = this.pick(ctx, 2, 2);
    const list = U.shuffle([...f, ...s]);
    let left = list.length;
    const els = list.map((t, i) => {
      const el = this.item(ctx, t, i);
      this.dragIn(ctx, el, t, {
        pick: () => KP.voice.say(t.name),
        drop: (p) => {
          setHint();
          if (ctx.actor) ctx.tiltOn = true;
          p.then(async () => {
            if (!self.alive(ctx, rid, sess)) return;
            self.react(ctx, t.fl, false);
            await KP.voice.say(t.line);
            left--;
            if (left === 0 && self.alive(ctx, rid, sess)) self.done(ctx, "다 넣어 봤어요!", false);
          });
        },
      });
      return el;
    });
    const setHint = () => {
      const e = els.find((x) => !x.classList.contains("used"));
      ctx.hint(e ? () => e : null, "물건을 끌어서 물에 넣어 봐요!");
    };
    ctx.say("🫗 물건을 끌어서 물에 넣어 봐요!");
    setHint();
  },

  /* ---------- 2단계: 예상하고 넣기 ---------- */
  guess(ctx) {
    const U = KP.u,
      A = KP.audio;
    const self = this;
    const rid = ctx.rid,
      sess = ctx._session;
    const two = U.rand(2) === 0;
    const { f, s } = this.pick(ctx, two ? 2 : 1, two ? 1 : 2);
    const list = U.shuffle([...f, ...s]);
    ctx.allRight = true;
    const els = [],
      drags = [];
    list.forEach((t, i) => {
      const el = this.item(ctx, t, i);
      els.push(el);
      const d = this.dragIn(ctx, el, t, {
        pick: () => KP.voice.say(t.name),
        drop: (p) => {
          ctx.hint(null);
          p.then(async () => {
            if (!self.alive(ctx, rid, sess)) return;
            const right = ctx.myGuess === t.fl;
            if (right) A.sfx("good");
            else ctx.allRight = false;
            self.react(ctx, t.fl, !right);
            await ctx.say((right ? "⭕ 맞았어요! " : "👀 어? 생각이랑 달라요! ") + t.line);
            await ctx.wait(400);
            if (!self.alive(ctx, rid, sess)) return;
            if (k + 1 < list.length) ask(k + 1);
            else self.done(ctx, "예상하고 확인했어요!", ctx.allRight);
          });
        },
      });
      d.lock();
      drags.push(d);
    });
    let k = 0;
    const ask = (n) => {
      k = n;
      const t = list[n],
        el = els[n];
      els.forEach((e, j) => {
        e.classList.toggle("cur", j === n);
        e.classList.toggle("dim", j > n);
      });
      ctx.myGuess = null;
      // 관찰 친구: 고개 갸웃 + "?"
      ctx.tiltOn = true;
      this.pose(ctx, { tilt: 0.14 });
      this.think(ctx, "?");
      // 예상 단추: 같은 물건이 물 위에 뜬 그림 / 바닥에 가라앉은 그림
      ctx.pred.innerHTML = "";
      ctx.pred.hidden = false;
      const mk = (fl) => {
        const b = U.el("button", "fsPB", '<span class="fsMini ' + (fl ? "up" : "down") + '"><img alt="" src="' + t.img + '"><span class="fsArrow">' + KP.E(fl ? "⬆️" : "⬇️") + "</span></span><b>" + (fl ? "둥실" : "퐁당") + "</b>");
        b.dataset.fl = fl ? "1" : "0";
        ctx.tap(b, () => {
          if (ctx.myGuess !== null) return;
          ctx.myGuess = fl;
          b.classList.add("picked");
          [...ctx.pred.children].forEach((x) => x !== b && x.classList.add("off"));
          A.sfx("tap");
          this.pose(ctx, { tilt: 0.05, nod: 0.08 });
          KP.voice.say(fl ? "둥실!" : "퐁당!").then(() => {
            if (!self.alive(ctx, rid, sess) || k !== n) return;
            ctx.say("🫗 그럼 물에 넣어 봐요!");
          });
          drags[n].unlock();
          ctx.hint(() => el, "그럼 물에 넣어 봐요!");
        });
        return b;
      };
      ctx.pred.append(mk(true), mk(false));
      ctx.fsSize();
      ctx.say("🤔 이건 뜰까요? 가라앉을까요?");
      // 힌트는 물건을 가리킴 (정답 단추를 가리키지 않게)
      ctx.hint(() => el, "이건 뜰까요? 가라앉을까요?");
    };
    ask(0);
  },

  /* ---------- 3단계: 두 물건 비교 ---------- */
  pair(ctx) {
    const U = KP.u,
      A = KP.audio;
    const self = this;
    const rid = ctx.rid,
      sess = ctx._session;
    // 세 쌍: 큰데 뜨는 것 vs 작은데 가라앉는 것 / 작은데 뜨는 것 vs 큰데 가라앉는 것 / 아무거나
    const F = ctx.FLOAT,
      S = ctx.SINK;
    const by = (arr, sz) => arr.filter((t) => t.sz === sz);
    const pairs = [];
    const usedEm = new Set();
    const take = (arr) => {
      const c = U.pick(arr.filter((t) => !usedEm.has(t.em)));
      usedEm.add(c.em);
      return c;
    };
    pairs.push([take(by(F, "big")), take(by(S, "small"))]);
    pairs.push([take(by(F, "small")), take(by(S, "big"))]);
    pairs.push([take(F), take(S)]);
    const order = U.shuffle(pairs);
    ctx.allRight = true;
    const run = (n) => {
      const pr = U.shuffle(order[n].slice());
      ctx.shelf.innerHTML = "";
      ctx.shelf.classList.remove("fsGone");
      this.clearObjs(ctx);
      ctx.slots = { true: [], false: [] };
      let chosen = null;
      ctx.tiltOn = true;
      this.pose(ctx, { tilt: 0.14 });
      this.think(ctx, "?");
      const els = pr.map((t, i) => {
        const el = this.item(ctx, t, i);
        ctx.tap(el, () => {
          if (chosen) return;
          chosen = t;
          el.classList.add("picked");
          els.forEach((e) => e !== el && e.classList.add("dim"));
          A.sfx("tap");
          ctx.hint(null);
          ctx.say("🫗 같이 넣어 볼까요?");
          ctx.after(1300, async () => {
            if (!self.alive(ctx, rid, sess) || !ctx.st) return;
            els.forEach((e) => e.classList.add("used"));
            ctx.shelf.classList.add("fsGone"); // 빈 쟁반 상자가 남지 않게(자리는 그대로 — 화면이 흔들리지 않게)
            const TK = ctx.TANK, mid = (TK.l + TK.r) / 2;
            const ps = pr.map((p, j) => (j === 0 ? self.dropIn(ctx, p, mid - 150) : new Promise((r) => ctx.after(150, () => r(self.dropIn(ctx, p, mid + 150))))));
            await Promise.all(ps);
            if (!self.alive(ctx, rid, sess)) return;
            const right = chosen.fl;
            if (right) A.sfx("good");
            else ctx.allRight = false;
            self.react(ctx, true, !right);
            const fl = pr.find((p) => p.fl),
              sk = pr.find((p) => !p.fl);
            await ctx.say((right ? "⭕ 맞았어요! " : "👀 어? 생각이랑 달라요! ") + fl.line + " " + sk.line);
            await ctx.wait(500);
            if (!self.alive(ctx, rid, sess)) return;
            if (n + 1 < order.length) run(n + 1);
            else self.done(ctx, "둘을 비교해 봤어요!", ctx.allRight);
          });
        });
        return el;
      });
      ctx.fsSize();
      ctx.say("🤔 어느 게 둥실 뜰까요? 하나를 눌러 봐요!");
      // 힌트는 늘 왼쪽 물건 (자리가 매번 섞여 정답을 알려 주지 않음)
      ctx.hint(() => els[0], "어느 게 둥실 뜰까요? 하나를 눌러 봐요!");
    };
    run(0);
  },

  /** 한 판 끝: clean=false 면 열쇠 별 없음(보기 2개 판 규칙) */
  async done(ctx, msg, clean) {
    if (ctx._fsDone === ctx.rid) return;
    ctx._fsDone = ctx.rid;
    ctx.hint(null);
    ctx.pred.hidden = true;
    ctx.tiltOn = false;
    this.think(ctx, null);
    // 1단계(자유 탐색)와 예상이 하나라도 달랐던 판은 별 없음 — 보기 2개라 '찍어도 반'이므로
    if (!clean) ctx._fewChoice = true;
    ctx.score.add();
    ctx.round++;
    if (ctx.actor) {
      ctx.actor.happy();
      ctx.actor.wave(1.4);
    }
    await ctx.wait(600);
    const big = ctx.round % 4 === 0;
    const ok = await ctx.win({ big, msg: big ? "{부름} 꼬마 과학자!" : msg });
    if (ok && ctx.st) this.next(ctx);
  },
});

;

/* ==== js/games/smart/hangul.js ==== */
/* 한글 놀이 — 위쪽 버튼: [자음] [모음] [글자 합체 → 새 놀이 hmerge] [쓰기 → hwrite] [퀴즈]
   만 3~4세 발달 단계에 맞춰 '받아쓰기'나 정답 강요 없이 놀면서 익히는 구성.
   - 자음/모음: 카드를 누르면 크게 보여 주고 이름 + 낱말 첫소리("기역! 고양이의 고!").
     크게 본 화면에서 [따라 쓰기](획 순서 안내, 순서 틀려도 괜찮음) · [다른 낱말]
   - 글자 합체: 따로 떨어진 놀이 '글자 합체'(hmerge.js)로 옮김 — 버튼은 그 놀이를 엶(숨긴 놀이면 버튼도 숨김).
   - 퀴즈(단계별): 1단계 첫소리 그림 찾기·자음 찾기(보기 2개)
                   2단계 + 모음 찾기·글자 듣고 찾기(보기 3개)
                   3단계 + 그림 보고 첫 글자(보기 4개)·낱말 읽기(첫 글자 강조, 읽을 거리가 많아 보기 3개) — '글자 만들기'는 글자 합체 2단계로 옮김
   말: 오답·정답 설명은 이미 녹음된 조각("이건 기차!", "기역을 찾아 봐요!")을 이어 자연 음성으로 (natPick)
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
      .hgMode{font-size:clamp(16px,2.2vw,23px);background:#fff;color:var(--night);border-radius:20px;padding:6px 16px;min-height:64px;display:flex;align-items:center;gap:6px;border:4px solid #fff;box-shadow:0 5px 0 rgba(27,37,80,.18)}
      .hgMode .e{font-size:1.35em}
      .hgTabCh{font-weight:400;font-size:1.3em;color:var(--coral)}
      .hgMode.sel .hgTabCh{color:var(--star)}
      .hgMode.sel{background:var(--night);border-color:var(--night);color:#fff;box-shadow:0 5px 0 var(--deep)}
      @media (orientation:portrait) and (max-width:480px){.hgModes{flex-wrap:wrap;gap:6px;padding:6px 4px 4px}.hgMode{font-size:16px;padding:4px 10px;min-height:64px;border-width:3px;gap:3px;flex:1 1 auto;justify-content:center}}
      .hgMode.glow{animation:glow 1s ease-in-out 3}
      @media (max-width:520px){.hgModes{gap:5px;padding:8px 6px 4px;flex-wrap:nowrap}.hgMode{font-size:14px;padding:3px 7px;min-height:64px;border-width:3px;gap:3px;white-space:nowrap}.hgMode .e{display:none}}
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
      .hgOpt.word .hgFirst{font-weight:400;font-size:1.3em;color:var(--coral)}
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
    ctx._resetFew(); // 모드를 바꾸면 새 판 — 앞 모드의 '보기 적은 판' 표시를 지움
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
    // 낱말 읽기(read)는 첫 글자 단서가 있어도 어려워 3단계에만
    const types = lv === 1 ? ["first", "first", "findC"] : lv === 2 ? ["first", "findC", "findV", "hear"] : ["first", "reverse", "findV", "hear", "read"];
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
  /** 자연 음성(녹음 조각)이 있는 첫 문장 — 모두 없으면 첫 문장(기기 목소리) */
  natPick(list) {
    const nat = (t) => !!(KP.voice._natUrls && KP.voice._natUrls(t));
    return list.find(nat) || list[0];
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
      // "이건 기차! 기차의 기! 니은을 찾아 봐요!" (조각이 없으면 "이건 기차! 니은을 찾아 봐요!")
      wrongMsg: (v) =>
        this.natPick([
          "이건 " + v[0] + "! " + v[0] + "의 " + v[0][0] + "! " + U.josa(nm, "을/를") + " 찾아 봐요!",
          "이건 " + v[0] + "! " + U.josa(nm, "을/를") + " 찾아 봐요!",
          "이건 " + U.josa(v[0], "이에요/예요") + ". " + U.josa(v[0], "은/는") + " " + U.josa(v[2], "으로/로") + " 시작해요!",
        ]),
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
    // 말은 "기차! 무슨 글자로 시작할까요?" 처럼 조각으로 (화면 글자는 그대로)
    const speak = this.natPick([ask, t[0] + "! 무슨 글자로 시작할까요?"]);
    return {
      big: KP.E(t[1]),
      list: U.shuffle([c, ...pool.slice(0, Math.min(3, n - 1))]),
      right: (v) => v === c,
      render: (v) => v,
      cls: "hgOpt letter",
      bubble: "❓ " + ask,
      ask,
      speak,
      wrongMsg: (v) => this.natPick(["이건 " + ctx.nameOfC(v) + "! " + t[0] + "! 첫 소리를 들어 봐요!", "이건 " + U.josa(ctx.nameOfC(v), "이에요/예요") + ". " + t[0] + "! 첫 소리를 들어 봐요!"]),
      sayRight: () => this.natPick([t[0] + "! " + U.josa(nm, "으로/로") + " 시작해요!", nm + "! " + t[0] + "의 " + t[0][0] + "!", t[0] + "! " + nm + "!"]),
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
      wrongMsg: (v) => this.natPick(["이건 " + ctx.nameOfC(v) + "! " + U.josa(nm, "을/를") + " 찾아 봐요!", "이건 " + U.josa(ctx.nameOfC(v), "이에요/예요") + ". " + U.josa(nm, "을/를") + " 찾아 봐요!"]),
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
      wrongMsg: (x) => this.natPick(["이건 " + nameV(x) + "! " + U.josa(snd, "을/를") + " 찾아 봐요!", "이건 " + U.josa(nameV(x), "이에요/예요") + ". " + U.josa(snd, "을/를") + " 찾아 봐요!"]),
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
    const ask = U.josa(target, "을/를") + " 찾아요!";
    // "가를 찾아요!" 녹음이 없는 글자가 많아 "가! 이 글자를 찾아요!" 조각으로 (화면 글자는 그대로)
    const speak = this.natPick([ask, target + "! 이 글자를 찾아요!"]);
    const w = ctx.wordFor(target);
    return {
      big: KP.E("👂"),
      bigCls: "ear",
      speak,
      ask,
      bubble: ask,
      list,
      right: (x) => x === target,
      render: (x) => x,
      cls: "hgOpt letter",
      wrongMsg: (x) => this.natPick(["이건 " + x + "! " + U.josa(target, "을/를") + " 찾아 봐요!", "이건 " + x + "! 잘 듣고 찾아요! " + target + "!", "이건 " + U.josa(x, "이에요/예요") + ". " + U.josa(target, "을/를") + " 찾아 봐요!"]),
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
      // 첫 글자를 크게·진하게 — 그림의 첫소리와 맞춰 볼 수 있게
      render: (v) => '<b class="hgFirst">' + v[0][0] + "</b>" + v[0].slice(1),
      cls: "hgOpt word",
      bubble: "❓ " + ask,
      ask,
      wrongMsg: (v) => this.natPick(["이건 " + v[0] + "! 첫 글자를 잘 봐요! " + t[0][0] + "!", "이건 " + v[0] + "! 첫 글자를 잘 봐요!", "이건 " + U.josa(v[0], "이에요/예요") + ". 첫 글자를 잘 봐요! " + t[0][0] + "!"]),
      sayRight: () => this.natPick([t[0] + "! " + U.josa(t[0][0], "으로/로") + " 시작해요!", t[0] + "! " + t[0] + "의 " + t[0][0] + "!", t[0] + "! " + t[0][0] + "!", t[0] + "!"]),
      cl: picked.length,
      cp: 1,
      szl: "clamp(80px,min(12vw,20vh),120px)",
      szp: "clamp(80px,24vw,110px)",
    };
  },

});

;

/* ==== js/games/smart/hmerge.js ==== */
/* 글자 합체 — '점토 글자 공방': 작업대 위 점토 접시 두 개에 자모 조각을 올리면, 조각이 점토 기계 깔때기로 쏙 →
   덜컹·뿅! 하고 완성 글자 타일이 기계 창에서 나옴 (한글 놀이에서 떨어져 나옴)
   화면: 배경 그림(작업대·접시·기계, assets/play-clay/hmerge/bg.jpg — _shared/clay-stage.js 의 자르기만, 3D 없음)
     + 코드로 그리는 점토 글자 타일(자음 살구색·모음 하늘색·글자 크림색, 글자 모양은 글꼴 — 생성 그림에 글자를 맡기지 않음)
     + 아이가 칠한 인형(정면 그림, 없으면 기본 인형)이 작업대 옆에서 반응(맞으면 폴짝·하트)
   위쪽 작은 그림 단추로 단계를 고름(잠금 없음, 마지막으로 고른 단계를 "hmerge:stage" 에 기억, 처음은 1):
   1 합체(자유): 아래 받침판의 자음·모음 조각(각 3~4개, ›로 넘겨 보기)을 접시로 끌기(눌러도 됨) → 기계 → 글자 탄생
     "기역에 아 하면, 가! 가방의 가!" — 글자 타일 안에서 세로 모음(ㅏㅑㅓㅕㅣ)은 자음 오른쪽, 가로 모음(ㅗㅛㅜㅠㅡ)은 아래로 미끄러져 붙음.
     🔄 모음 돌리기: 같은 자음에 다음 모음(가→갸→거→겨…). 새 글자 6개마다 칭찬(자유 놀이라 열쇠 별은 없음)
   2 만들기: 소리(👂) 또는 그림(🦊 "여우의 여!")을 보고 자음 → 모음 조각을 차례로 접시에 (보기 3개, 닮은 모양 섞기)
   3 낱말: 받침 없는 두 글자 낱말 그림을 보고 접시 두 개에 글자를 하나씩 → 기계에서 낱말 타일 (보기 3개)
   4 쪼개기: 글자 타일을 가위로 싹둑 → 빈 홈에 맞는 자음·모음 조각을 끼우기 (보기 3개)
   5 받침(형님): 받침 없는 글자 + 받침 조각 → 기계 → 받침이 아래로 쏙 붙은 글자 (보기 3개)
   📒 도감: 1~4단계에서 만든 받침 없는 글자 140칸(자음 14 × 모음 10)이 점토 판에 채워짐. 줄 하나를 다 채우면 도장·칭찬.
     저장: KP.store "hmerge:dex" (만든 글자를 이어 붙인 문자열) — 설정의 백업/복원에 포함됨(store.js okKey 의 "이름:키" 규칙)
   글자 자료(자음·모음 표, compose 등)는 한글 놀이(hangul.js)가 내보내는 KP.hangul 을 setup 때 읽음 */
"use strict";
KP.game({
  id: "hmerge",
  icon: "🧲",
  name: "글자 합체",
  cat: "study",
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    const self = this;
    const D = (ctx.D = KP.hangul);
    const IMG = "assets/play-clay/hmerge/bg.jpg";
    KP.css("hmerge", `
      .hmWrap{flex:1;min-height:0;position:relative;margin:0 12px 10px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(#b9763f,#97582c);touch-action:none;user-select:none;-webkit-user-select:none;--mh:56px;
        --hmC1:#ffa286;--hmC2:#ec6447;--hmC3:#b5462f;--hmV1:#8ccfff;--hmV2:#3a93e4;--hmV3:#276aab;--hmS1:#fff6da;--hmS2:#f1cd86;--hmS3:#bd8a43}
      .hmWrap [hidden]{display:none!important}
      .hmStage{position:absolute;left:0;top:0;z-index:0}
      /* 단계 단추: 작업대 위 나무 선반의 작은 점토 단추 */
      .hmModes{position:absolute;left:0;right:0;top:0;height:var(--mh);z-index:10;display:flex;align-items:center;justify-content:center;gap:clamp(5px,1.2vw,12px);
        background:linear-gradient(#a86a3b,#8a532b);box-shadow:inset 0 -3px 0 rgba(0,0,0,.14),0 3px 6px rgba(60,30,10,.3)}
      .hmMode{position:relative;width:var(--mb,calc(var(--mh) - 9px));height:var(--mb,calc(var(--mh) - 9px));flex:0 0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;font-size:calc(var(--mb,var(--mh)) * .5);line-height:1;
        background:radial-gradient(circle at 35% 28%,#fffaf0,#f0ddc0 60%,#d6b993);box-shadow:inset 0 -3px 4px rgba(120,80,40,.25),0 3px 0 #66391b;transition:transform .15s}
      .hmMode i{position:absolute;right:-3px;top:-3px;width:17px;height:17px;border-radius:50%;background:#66391b;color:#fff;font-size:11px;line-height:17px;font-style:normal;text-align:center}
      .hmMode.sel{background:radial-gradient(circle at 35% 28%,#fff7c8,#ffd45c 60%,#e6a52a);box-shadow:inset 0 -3px 4px rgba(150,90,0,.3),0 3px 0 #66391b,0 0 0 3px #fff1b0;transform:translateY(-2px)}
      .hmMode.sel i{background:#e8604a}
      .hmMode.glow{animation:glow 1s ease-in-out 3}
      /* 단추가 화면 폭 때문에 64px 보다 작을 때(폰): 누르는 자리는 위아래·옆 틈까지 넓힘 */
      .hmMode::before{content:"";position:absolute;inset:min(0px,calc((var(--mb,56px) - 66px) / 2)) -3px;border-radius:30%}

      /* 기계: 배경 그림의 기계 부분을 한 장 더 겹쳐 흔들기 · 창 빛 */
      .hmMach{position:absolute;z-index:1;background-repeat:no-repeat;
        -webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 72%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 72%,transparent 100%)}
      .hmMach.run{animation:hmRattle .55s}
      @keyframes hmRattle{12%{transform:translate(-3px,1px) rotate(-1.4deg)}30%{transform:translate(3px,-2px) rotate(1.3deg)}50%{transform:translate(-2px,1px) rotate(-.9deg)}70%{transform:translate(2px,-1px) rotate(.6deg)}88%{transform:translate(-1px,0)}}
      .hmWinG{position:absolute;z-index:2;pointer-events:none;border-radius:50%;opacity:0;transition:opacity .3s;
        background:radial-gradient(circle,rgba(255,252,215,.95),rgba(255,224,130,.65) 42%,rgba(255,200,80,0) 72%)}
      .hmWinG.on{opacity:1;animation:hmPulse .28s ease-in-out infinite alternate}
      @keyframes hmPulse{to{transform:scale(1.18)}}

      /* 접시(놓는 자리) */
      .hmPlate{position:absolute;z-index:3;border-radius:50%;pointer-events:none;transition:box-shadow .2s,background .2s}
      /* 지금 놓을 접시 빛은 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .hmPlate::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;
        box-shadow:0 0 0 6px rgba(255,232,130,.95),0 0 26px 10px rgba(255,240,170,.7);background:rgba(255,246,205,.3)}
      .hmPlate.now{animation:none}
      .hmPlate.now::after{animation:hmPlateGlow 1.1s ease-in-out infinite alternate}
      @keyframes hmPlateGlow{to{opacity:1}}
      .hmPlate.dropHover,.hmTile.dropHover{box-shadow:0 0 0 7px rgba(255,255,255,.95),0 0 26px 10px rgba(255,236,160,.8)!important;animation:none}
      .hmPlate.dropHover::after{animation:none}
      .hmPlate.dropHover{background:rgba(255,250,222,.3)!important}

      /* 점토 글자 타일: 두께(아래 그림자) · 위 하이라이트 · 약한 결 */
      .hmTile{position:absolute;left:0;top:0;z-index:4;width:var(--t);height:var(--t);border-radius:30%;padding:0;border:0;display:flex;align-items:center;justify-content:center;line-height:1;
        font-size:calc(var(--t) * .62);color:#fff;touch-action:none;
        background:radial-gradient(58% 38% at 30% 17%,rgba(255,255,255,.5),rgba(255,255,255,0) 72%),
          repeating-radial-gradient(circle at 72% 84%,rgba(255,255,255,0) 0 3px,rgba(255,255,255,.06) 3px 4px),
          linear-gradient(165deg,var(--a),var(--b));
        box-shadow:inset 0 calc(var(--t) * -.07) calc(var(--t) * .08) rgba(0,0,0,.16),inset 0 calc(var(--t) * .03) calc(var(--t) * .03) rgba(255,255,255,.55),
          0 calc(var(--t) * .07) 0 var(--d),0 calc(var(--t) * .12) calc(var(--t) * .1) rgba(70,35,10,.33);
        text-shadow:0 calc(var(--t) * .025) 0 rgba(0,0,0,.2),0 calc(var(--t) * -.012) 0 rgba(255,255,255,.35)}
      .hmTile .g{pointer-events:none;transform:translateY(-3%)}
      .hmTile.c{--a:var(--hmC1);--b:var(--hmC2);--d:var(--hmC3)}
      .hmTile.v{--a:var(--hmV1);--b:var(--hmV2);--d:var(--hmV3)}
      .hmTile.s{--a:var(--hmS1);--b:var(--hmS2);--d:var(--hmS3);color:#5a3a86;text-shadow:0 calc(var(--t) * .02) 0 rgba(255,255,255,.75)}
      .hmTile.word{width:calc(var(--t) * 1.8);border-radius:calc(var(--t) * .3);font-size:calc(var(--t) * .56);letter-spacing:.04em}
      .hmTile.land{animation:hmLand .4s cubic-bezier(.3,1.5,.5,1)}
      @keyframes hmLand{0%{transform:scale(1.12,.8)}50%{transform:scale(.94,1.07)}100%{transform:none}}
      .hmTile.boom{animation:popBig .5s cubic-bezier(.2,1.6,.4,1)}
      .hmTile.yay{animation:jumpA .5s 2}
      .hmTile.now{animation:hmTileGlow 1.1s ease-in-out infinite alternate}
      @keyframes hmTileGlow{to{box-shadow:inset 0 -6px 8px rgba(0,0,0,.12),0 6px 0 var(--d),0 0 0 6px rgba(255,228,120,.85),0 0 24px 8px rgba(255,236,160,.6)}}
      .hmTile.fly{z-index:7;pointer-events:none}
      .hmTag{position:absolute;left:-14%;bottom:-14%;display:flex;flex-direction:column;align-items:center;background:#fffaf0;border-radius:18px;padding:3px 9px 2px;
        box-shadow:0 4px 0 #d6b993,0 6px 8px rgba(70,35,10,.25);font-size:clamp(13px,calc(var(--t) * .1),19px);color:#5a3a86;text-shadow:none;letter-spacing:0;animation:popIn .35s}
      .hmTag .e{font-size:calc(var(--t) * .26)}

      /* 글자 상자: 조각(자음 c·모음 v·받침 j)이 모음 모양에 따라 자리를 잡고, 합체(fused)하면 글꼴 글자 하나로 */
      .hmSyl{position:relative;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;flex:0 0 auto}
      .hmP,.hmG{position:absolute;display:flex;align-items:center;justify-content:center;line-height:1}
      .hmP{left:0;top:0;width:100%;height:100%;font-size:.62em;
        transition:left .45s cubic-bezier(.3,1.3,.5,1),top .45s cubic-bezier(.3,1.3,.5,1),width .45s,height .45s,font-size .45s,opacity .3s}
      .hmP.j{opacity:0;top:72%;height:28%}
      .hmSyl.T .hmP.c{left:3%;width:53%}
      .hmSyl.T .hmP.v{left:50%;width:47%}
      .hmSyl.W .hmP.c{top:3%;height:52%}
      .hmSyl.W .hmP.v{top:43%;height:52%}
      .hmSyl.apart .hmP{font-size:.5em}
      .hmSyl.apart .hmP.c{left:0;width:46%;top:0;height:100%}
      .hmSyl.apart .hmP.v{left:54%;width:46%;top:0;height:100%}
      .hmSyl.J .hmP{font-size:.47em}
      .hmSyl.J.T .hmP.c,.hmSyl.J.T .hmP.v{top:1%;height:57%}
      .hmSyl.J.W .hmP.c{top:0;height:37%}
      .hmSyl.J.W .hmP.v{top:24%;height:37%}
      .hmSyl.J .hmP.j{opacity:1;top:57%;height:42%}
      .hmP.q{color:rgba(120,80,40,.38)!important;text-shadow:none}
      .hmP.q::before{content:"";position:absolute;inset:8%;border-radius:24%;background:rgba(150,100,45,.16);
        box-shadow:inset 0 4px 6px rgba(110,65,20,.42),inset 0 -2px 2px rgba(255,255,255,.6)}
      .hmP.got{animation:popIn .35s cubic-bezier(.2,1.5,.4,1)}
      .hmG{inset:0;font-size:.84em;opacity:0;transform:scale(.5);transition:opacity .25s,transform .45s cubic-bezier(.2,1.6,.4,1)}
      .hmSyl.fused .hmG{opacity:1;transform:translateY(-3%)}
      .hmSyl.fused .hmP{opacity:0}
      .hmSyl.noAnim .hmP,.hmSyl.noAnim .hmG{transition:none}

      /* 묻는 카드(그림·귀) — 점토 판 */
      .hmAsk{position:absolute;z-index:4;width:var(--t);height:var(--t);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:24%;line-height:1;
        background:radial-gradient(90% 70% at 30% 14%,#fff,rgba(255,255,255,0) 60%),linear-gradient(170deg,#fffaf0,#efdfc2);
        box-shadow:inset 0 -6px 8px rgba(140,100,50,.18),0 6px 0 #c6a273,0 10px 14px rgba(70,35,10,.3)}
      .hmAsk .e{font-size:calc(var(--t) * .56)}
      .hmAsk .hmW{font-size:calc(var(--t) * .17);color:#5a3a86;margin-top:3%;letter-spacing:.06em}
      .hmAsk .hmW i{font-style:normal;color:#e8604a}
      .hmAsk.yay{animation:jumpA .5s 2}

      /* 인형 친구 */
      .hmDoll{position:absolute;z-index:5;transform-origin:50% 100%}
      .hmDoll::before{content:"";position:absolute;left:18%;right:18%;bottom:-2%;height:10%;border-radius:50%;background:rgba(60,28,8,.3);filter:blur(3px)}
      .hmDoll img{position:relative;width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 4px 4px rgba(60,30,10,.3));transform-origin:50% 100%;animation:hmBreath 2.8s ease-in-out infinite}
      @keyframes hmBreath{50%{transform:scale(1.015,1.03)}}
      .hmDoll.hop{animation:hmHop .5s cubic-bezier(.3,0,.5,1) 2}
      @keyframes hmHop{0%,100%{transform:none}22%{transform:scale(1.07,.9)}55%{transform:translateY(-20%) scale(.96,1.06)}}
      .hmDoll.huh{animation:hmHuh .6s ease-in-out}
      @keyframes hmHuh{25%{transform:rotate(-7deg)}70%{transform:rotate(6deg)}}

      /* 받침판(조각 놓는 곳) */
      .hmTray{position:absolute;z-index:6;pointer-events:none;--tt:84px;--gap:8px}
      .hmGrp{position:absolute;left:0;top:0;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:var(--gap);padding:calc(var(--gap) * 1.2);pointer-events:auto;
        border-radius:calc(var(--tt) * .38);background:linear-gradient(#f7e9d3,#e9d0aa);
        box-shadow:inset 0 4px 6px rgba(120,80,30,.24),inset 0 -2px 0 rgba(255,255,255,.6),0 4px 0 #a9773f,0 8px 12px rgba(50,25,8,.3)}
      .hmGrp .hmTile{position:relative;z-index:1;--t:var(--tt);flex:0 0 auto}
      .hmGrp .hmTile.dragging{z-index:30}
      .hmGrp .hmTile.used{opacity:.28}
      .hmGrp .hmTile.pin{animation:popIn .3s cubic-bezier(.2,1.5,.4,1) both;animation-delay:calc(var(--i) * 40ms)}
      .hmPg{position:relative;width:calc(var(--tt) * .6);height:var(--tt);border-radius:calc(var(--tt) * .3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8%;padding:0;flex:0 0 auto;
        background:linear-gradient(#fffaf0,#eedbbd);box-shadow:inset 0 -3px 4px rgba(120,80,30,.2),0 4px 0 #c49966;color:#8a532b;font-size:calc(var(--tt) * .5);line-height:.8}
      .hmPg:active{transform:translateY(3px)}
      .hmPg span{display:flex;gap:3px}
      .hmPg span b{width:6px;height:6px;border-radius:50%;background:#d8bb92}
      .hmPg span b.on{background:#8a532b}
      [data-l="wide"] .hmPg{width:var(--tt)}
      .hmSpin{position:absolute;z-index:7;width:var(--sz);height:var(--sz);border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--sz) * .5);
        background:radial-gradient(circle at 35% 28%,#fffaf0,#f0ddc0 60%,#d6b993);box-shadow:inset 0 -3px 4px rgba(120,80,40,.25),0 4px 0 #a9773f,0 6px 10px rgba(60,30,10,.3)}
      .hmSpin:active{transform:translateY(3px)}
      .hmSpin.go .e{animation:spin .5s}
      .hmFx{position:absolute;inset:0;z-index:8;pointer-events:none;overflow:hidden}
      .hmCut{position:absolute;left:0;top:0;line-height:1;transition:transform .75s ease-in-out}

      /* 도감: 점토 판에 글자 조각이 채워짐 */
      .hmDexV{position:absolute;left:0;right:0;bottom:0;top:var(--mh);z-index:9;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;
        padding:10px 10px 18px;display:flex;flex-direction:column;align-items:center;gap:8px;background:rgba(80,42,16,.45)}
      .hmDexTop{display:flex;align-items:center;gap:8px;font-size:clamp(18px,2.4vw,26px);color:#5a3a86;flex:0 0 auto;background:#fffaf0;border-radius:20px;padding:4px 16px;box-shadow:0 4px 0 #c6a273}
      .hmDexTop .e{font-size:1.3em}
      .hmDexTop b{font-weight:400;color:#e8604a}
      .hmSlab{flex:0 0 auto;border-radius:clamp(16px,3vw,30px);padding:clamp(7px,1.6vw,16px);
        background:radial-gradient(120% 80% at 30% 8%,#eeb083,#cd8150 70%);box-shadow:inset 0 6px 10px rgba(255,222,186,.55),inset 0 -8px 12px rgba(90,40,10,.32),0 7px 0 #8a4a22,0 12px 20px rgba(30,15,5,.4)}
      .hmGridD{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:clamp(3px,.6vw,7px);width:min(calc(100vw - 70px),860px,max(290px,calc((100dvh - 250px) * .72)))}
      .hmDc,.hmDh{aspect-ratio:1;min-height:0;height:auto;border-radius:26%;display:flex;align-items:center;justify-content:center;font-size:clamp(12px,min(1.9vw,2.5vh),26px);line-height:1;min-width:0;padding:0;overflow:hidden;border:0}
      .hmDc{background:#b8693a;color:rgba(255,215,180,.32);box-shadow:inset 0 3px 4px rgba(70,28,5,.5),inset 0 -1px 0 rgba(255,212,170,.4)}
      .hmDc.on{color:var(--c);background:radial-gradient(90% 70% at 32% 16%,rgba(255,255,255,.7),rgba(255,255,255,0) 60%),linear-gradient(165deg,#fffaf0,#f3dcae);
        box-shadow:inset 0 -3px 4px rgba(120,70,20,.2),0 3px 0 #8a4a22}
      .hmDc.new{animation:hmNew 1.2s ease-in-out 2}
      @keyframes hmNew{50%{transform:scale(1.18);box-shadow:0 0 0 5px rgba(255,226,110,.85)}}
      .hmDh{color:#fff6e6;background:transparent;position:relative;overflow:visible;text-shadow:0 2px 0 rgba(90,40,10,.45)}
      .hmDh .hmStamp{position:absolute;inset:-12%;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:popBig .5s cubic-bezier(.2,1.6,.4,1)}
      .hmDh .hmStamp .e{width:100%;height:100%;opacity:.9}
    `);

    /* ---------- 자료 ---------- */
    // 받침 없는 글자 140칸 (자음 14 × 모음 10, 표 순서)
    ctx.ALL = [];
    D.H.forEach(([c]) => D.V.forEach(([v]) => ctx.ALL.push(D.compose(c, v))));
    ctx.ALLSET = new Set(ctx.ALL);
    const ci = (s) => D.H.findIndex((h) => h[0] === D.cho(s));
    const vi = (s) => D.V.findIndex((x) => x[0] === D.jung(s));
    ctx.ci = ci;
    ctx.vi = vi;
    // 받침판에 놓는 차례: 자음은 표 순서, 모음은 쉬운 것부터(세로·가로 모음이 섞이게)
    ctx.CORD = D.H.map((h, i) => i);
    ctx.VORD = [..."ㅏㅓㅗㅜㅡㅣㅑㅕㅛㅠ"].map((ch) => D.V.findIndex((x) => x[0] === ch)).filter((i) => i >= 0);
    // 그림이 있는 첫 글자 (2단계 그림 문제): 표 안의 글자마다 wordFor 낱말
    ctx.PIC = ctx.ALL.map((s) => D.wordFor(s)).filter(Boolean);
    // 3단계 낱말: 받침 없는 두 글자 (두 글자 모두 140칸 안)
    ctx.W2 = [
      ["나무", "🌳"], ["하마", "🦛"], ["오이", "🥒"], ["기차", "🚂"], ["포도", "🍇"], ["바다", "🌊"], ["우유", "🥛"], ["모자", "🎩"],
      ["나비", "🦋"], ["사자", "🦁"], ["치마", "👗"], ["피자", "🍕"], ["지구", "🌍"], ["거미", "🕷️"], ["가지", "🍆"], ["다리", "🦵"],
      ["모기", "🦟"], ["지도", "🗺️"], ["아기", "👶"], ["여우", "🦊"], ["야구", "⚾"], ["버스", "🚌"], ["치즈", "🧀"],
      ["주스", "🧃"], ["라마", "🦙"], ["휴지", "🧻"], ["비누", "🧼"], ["기타", "🎸"], ["커피", "☕"], ["고추", "🌶️"],
    ].filter((w) => {
      const ok = w[0].length === 2 && [...w[0]].every((s) => ctx.ALLSET.has(s));
      if (!ok) console.warn("hmerge: 3단계 낱말 아님", w[0]);
      return ok;
    });
    // 5단계 받침 낱말: 앞 글자(받침 없는 글자)가 140칸 안 + 받침은 쉬운 홑받침
    ctx.JPOOL = "ㄱㄴㄹㅁㅂㅅㅇ";
    ctx.BAT = [
      ["곰", "🐻"], ["달", "🌙"], ["밤", "🌰"], ["문", "🚪"], ["산", "⛰️"], ["밥", "🍚"], ["공", "⚽"], ["물", "💧"],
      ["불", "🔥"], ["눈", "👀"], ["별", "⭐"], ["말", "🐴"], ["집", "🏠"], ["손", "✋"], ["발", "🦶"], ["돈", "💰"],
      ["잠", "😴"], ["국", "🍲"], ["약", "💊"], ["옷", "👕"], ["귤", "🍊"],
    ].filter((w) => {
      const s = w[0];
      const ok = ctx.ALLSET.has(D.compose(D.cho(s), D.jung(s))) && ctx.JPOOL.includes(D.jong(s)) && D.jong(s) !== "";
      if (!ok) console.warn("hmerge: 5단계 낱말 아님", s);
      return ok;
    });

    /* ---------- 배경 그림과 그림 위 자리 (그림 비율 0~1, 1600×896) ---------- */
    ctx.BG = { file: IMG, img: [1600, 896], vh: 0.3, near: 0.2, fov: 34, focus: [0.55, 0.62], focusP: [0.56, 0.6] };
    ctx.UV = {
      pl: [[0.318, 0.728, 0.298, 0.215], [0.665, 0.728, 0.303, 0.215]], // 접시 [가운데 u, v, 폭, 높이]
      fun: [0.845, 0.215], // 깔때기 입구
      win: [0.811, 0.465, 0.085, 0.17], // 빛나는 창
      mach: [0.735, 0.17, 0.945, 0.67], // 기계 전체 (흔들 부분)
      wall: 0.27, // 빈 벽 왼쪽 끝 (오른쪽 끝은 기계)
      table: 0.585, // 작업대 윗면 뒤쪽 가장자리
      doll: [0.085, 0.86], // 인형 발 자리(작업대 왼쪽)
    };

    /* ---------- 화면 틀 ---------- */
    const wrap = (ctx.wrap = U.el("div", "hmWrap"));
    ctx.stage = U.el("div", "hmStage");
    ctx.mach = U.el("div", "hmMach");
    ctx.mach.style.backgroundImage = 'url("' + IMG + '")';
    ctx.winGlow = U.el("div", "hmWinG");
    ctx.plates = [0, 1].map((i) => U.el("div", "hmPlate p" + i));
    ctx.doll = U.el("div", "hmDoll", '<img alt="" draggable="false">');
    ctx.dollImg = ctx.doll.firstChild;
    ctx.doll.hidden = true;
    ctx.tray = U.el("div", "hmTray");
    ctx.gC = U.el("div", "hmGrp c");
    ctx.gV = U.el("div", "hmGrp v");
    ctx.gO = U.el("div", "hmGrp o");
    ctx.tray.append(ctx.gC, ctx.gV, ctx.gO);
    ctx.spin = U.btn(KP.E("🔄"), "hmSpin");
    ctx.spin.setAttribute("aria-label", "모음 돌리기");
    ctx.spin.hidden = true;
    ctx.fx = U.el("div", "hmFx");
    ctx.dexV = U.el("div", "hmDexV");
    ctx.dexV.hidden = true;
    ctx.modes = U.el("div", "hmModes");
    wrap.append(ctx.stage, ctx.mach, ctx.winGlow, ...ctx.plates, ctx.doll, ctx.tray, ctx.spin, ctx.fx, ctx.dexV, ctx.modes);
    ctx.body.appendChild(wrap);

    ctx.STAGES = [
      [1, "🧲", "합체"],
      [2, "🔨", "만들기"],
      [3, "🧱", "낱말"],
      [4, "✂️", "쪼개기"],
      [5, "👇", "받침"],
    ];
    ctx.bSt = ctx.STAGES.map(([n, em, t]) => {
      const b = U.btn(KP.E(em) + "<i>" + n + "</i>", "hmMode");
      b.setAttribute("aria-label", t);
      ctx.tap(b, () => self.go(ctx, n));
      ctx.modes.appendChild(b);
      return b;
    });
    ctx.bDex = U.btn(KP.E("📒"), "hmMode dex");
    ctx.bDex.setAttribute("aria-label", "도감");
    ctx.tap(ctx.bDex, () => self.go(ctx, "dex"));
    ctx.modes.appendChild(ctx.bDex);

    ctx.tap(ctx.spin, () => self.spinV(ctx));
    ctx.tap(ctx.mach, () => {
      if (ctx.st === 1 && ctx.fs && !ctx.busy) self.sayMerge(ctx, ctx.fc, ctx.fv);
    });
    ctx.tap(ctx.doll, () => {
      KP.pfx.sound("boing");
      self.dollYay(ctx, 2);
    });
    ctx.onPlate = [null, null];
    ctx.token = 0;
    if (window.ResizeObserver) new ResizeObserver(() => self.layout(ctx)).observe(wrap);
  },

  async start(ctx) {
    const U = KP.u;
    ctx.round = 0;
    ctx.wins = {};
    ctx.freeNew = 0;
    ctx.freeMade = 0;
    ctx.dexNew = new Set();
    ctx.dex = this.loadDex();
    ctx.pgC = ctx.pgV = 0;
    const tok = ++ctx.token;
    if (ctx.cs) ctx.cs.dispose();
    ctx.cs = KP.clayStage.create(ctx.stage, ctx.BG, { flat: true });
    ctx.cs.onResize = () => this.layout(ctx);
    let st = +KP.store.get("hmerge:stage", 1);
    if (!(st >= 1 && st <= 5)) st = 1;
    this.layout(ctx);
    this.go(ctx, st, true);
    // 반응하는 인형 친구: 아이가 칠한 인형(정면 그림) → 없으면 기본 인형 (2D 그림만 — 가벼움)
    let src = "";
    try {
      const ds = KP.dollActor ? await KP.dollActor.painted() : [];
      const it = ds.length ? U.pick(ds) : null;
      src = (it && KP.safeImg(it.thumb)) || "";
    } catch (e) {}
    if (tok !== ctx.token || !ctx._active) return;
    if (!src && KP.DOLL && KP.DOLL.thumbUrl) src = KP.DOLL.thumbUrl(U.pick(KP.DOLL.ORDER || ["bear"]));
    if (src) {
      ctx.dollImg.src = src;
      ctx.doll.hidden = false;
      this.layout(ctx);
    }
  },
  stop(ctx) {
    ctx.token++;
    ctx.tk = (ctx.tk || 0) + 1;
    ctx.wrap.querySelectorAll(".hmDyn").forEach((e) => e.remove());
    ctx.onPlate = [null, null];
    ctx.winGlow.classList.remove("on"); // 빛나는 중에 나가도 다시 들어왔을 때 계속 깜박이지 않게
    if (ctx.cs) ctx.cs.dispose();
    ctx.cs = null;
  },

  /* ================= 말하는 문장 (게임과 lines() 가 같이 씀 — 녹음된 조각을 최대한 재사용) ================= */
  TX: {
    intro: "자음 하나, 모음 하나를 골라요. 둘이 만나면 글자가 돼요!",
    hintC: "자음을 눌러 봐요!",
    hintV: "이번엔 모음!",
    spin: "모음을 돌려 봐요!",
    // 2단계
    make: (s, w) => (w ? w[0] + "의 " + s + "! " : s + "! ") + "만들어 봐요! 먼저 자음!",
    cWrong: (s) => "첫 소리를 잘 들어 봐요! " + s + "!",
    vWrong: (s, snd) => s + "! " + snd + " 소리를 찾아요!",
    cRight: (nm) => nm + "! 이번엔 모음!",
    // 3단계
    w1: (w) => w + "! 첫 글자를 찾아요!",
    w2: (t) => t + "! 다음 글자를 찾아요!",
    wWrong: (w, k) => "아니에요! " + w + "! " + (k ? "다음 글자를 찾아요!" : "첫 글자를 찾아요!"),
    wDone: (w) => w + "! " + w + "!",
    // 4단계
    cut: (s) => s + "! 싹둑싹둑!",
    cutC: "먼저 자음!",
    cutCWrong: (s) => "아니에요! " + s + "! 첫 소리를 잘 들어 봐요!",
    cutVWrong: (s, snd) => "아니에요! " + s + "! " + snd + " 소리를 찾아요!",
    // 5단계
    bat: (s, base) => s + "! " + base + "! 받침을 붙여 봐요!",
    batWrong: (s) => "아니에요! " + s + "! 잘 들어 봐요!",
    batRight: (base, jn, s) => base + "에 " + jn + " 받침, " + s + "!",
    // 도감
    dexIn: "만든 글자가 여기 모여요! 눌러 보면 읽어 줘요!",
    dexNone: "글자 합체도 해 볼까요?",
    dexEmpty: "아직 빈칸이에요! 합체 기계로 만들어 봐요!",
    dexTap: "글자를 눌러 봐요!",
  },
  // 조각 글자 색 (글자 타일 안에서 자음·모음을 구분) — 점토 타일 색과 같은 계열
  COL: { c: "#e2583f", v: "#2f86d6", j: "#e2583f" },

  /* ================= 도감 저장 ================= */
  loadDex() {
    const raw = KP.store.get("hmerge:dex", "");
    const set = new Set();
    const ok = new Set(this._all || (this._all = (() => {
      const D = KP.hangul, a = [];
      D.H.forEach(([c]) => D.V.forEach(([v]) => a.push(D.compose(c, v))));
      return a;
    })()));
    if (typeof raw === "string") for (const s of raw) if (ok.has(s)) set.add(s); // 조작·깨진 값은 버림
    return set;
  },
  /** 만든 글자 기록 → {fresh: 처음 만듦, row: 다 채운 자음 줄 번호(-1), all: 140칸 다 채움} */
  addDex(ctx, s) {
    const r = { fresh: false, row: -1, all: false };
    if (!ctx.ALLSET.has(s) || ctx.dex.has(s)) return r;
    ctx.dex.add(s);
    ctx.dexNew.add(s);
    r.fresh = true;
    KP.store.set("hmerge:dex", ctx.ALL.filter((x) => ctx.dex.has(x)).join(""));
    const ci = ctx.ci(s);
    if (ctx.ALL.slice(ci * 10, ci * 10 + 10).every((x) => ctx.dex.has(x))) r.row = ci;
    r.all = ctx.dex.size >= ctx.ALL.length;
    return r;
  },
  /** 도감 칭찬이 있으면 그것으로 (다 채움 > 한 줄) */
  dexWin(r, base) {
    if (r.all) return { big: true, msg: "{부름} 글자 도감 완성!" };
    if (r.row >= 0) return { big: true, msg: "한 줄 다 채웠어요! 도장 쾅!" };
    return base;
  },

  /* ================= 자리 잡기 ================= */
  /** 배치 모양: tall(세로 화면 — 위 작업대·아래 받침판) / land(가로 — 작업대 꽉, 아래 받침판) / wide(납작한 폰 가로 — 양옆 받침판) */
  layout(ctx) {
    const cs = ctx.cs;
    if (!cs || ctx._inLay) return;
    const U = KP.u, wrap = ctx.wrap, W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;
    ctx._inLay = true;
    try {
      const L = (ctx.L = { W, H });
      // 단계 단추 선반: 단추는 64px 이상(가능하면) — 폭이 좁은 폰은 6개가 들어가는 만큼만 (누르는 자리는 ::before 로 넓힘)
      const mh = H < 440 ? 62 : W < 520 ? 70 : 76;
      const gap = W < 520 ? 4 : Math.max(5, Math.min(12, W * 0.012));
      const mb = Math.max(44, Math.min(mh - 8, 68, Math.floor((W - 12 - gap * 5) / 6)));
      wrap.style.setProperty("--mh", mh + "px");
      wrap.style.setProperty("--mb", mb + "px");
      ctx.modes.style.gap = gap + "px";
      const r = W / H;
      const mode = (L.mode = r >= 2.05 ? "wide" : r < 1 ? "tall" : "land");
      wrap.dataset.l = mode;
      let sx = 0, sy = mh, sw = W, sh = H - mh, tray;
      if (mode === "tall") {
        sh = Math.round(Math.min(W / 1.38, (H - mh) * 0.56));
        tray = { x: 0, y: sy + sh, w: W, h: H - sy - sh };
      } else if (mode === "wide") {
        const cw = Math.round(U.clamp(W * 0.19, 124, 220));
        sx = cw;
        sw = W - cw * 2;
        tray = { x: 0, y: mh, w: W, h: H - mh, cw };
      } else {
        const th = Math.round(U.clamp(H * 0.19, 84, 128));
        tray = { x: 0, y: H - th, w: W, h: th };
      }
      Object.assign(L, { sx, sy, sw, sh, tray });
      this.box(ctx.stage, sx, sy, sw, sh);
      cs.resize();
      if (!cs.bc) return;
      const v = cs.bc.view, UV = ctx.UV;
      const P = (u, vv) => ({ x: sx + u * v.fw - v.ox, y: sy + vv * v.fh - v.oy });
      L.P = P;
      // 접시와 접시 위 조각 자리
      L.plate = UV.pl.map((p, i) => {
        const c = P(p[0], p[1]), w = p[2] * v.fw, h = p[3] * v.fh;
        this.box(ctx.plates[i], c.x - w / 2, c.y - h / 2, w, h);
        return { cx: c.x, cy: c.y, w, h };
      });
      const T = U.clamp(Math.min(L.plate[0].w * (mode === "tall" ? 0.62 : 0.52), sh * 0.42), 54, 170); // 세로 화면은 접시가 작아 조각을 조금 크게
      L.slot = L.plate.map((p) => ({ x: p.cx - T / 2, y: p.cy + p.h * 0.16 - T, t: T }));
      ctx.onPlate.forEach((el, i) => el && this.place(el, L.slot[i]));
      // 기계 · 깔때기 · 창
      const f = P(UV.fun[0], UV.fun[1]);
      L.fun = { x: f.x, y: Math.max(sy + 10, f.y) };
      const wc = P(UV.win[0], UV.win[1]), ww = UV.win[2] * v.fw, wh = UV.win[3] * v.fh;
      L.win = { x: wc.x, y: wc.y, w: ww, h: wh };
      this.box(ctx.winGlow, wc.x - ww * 0.8, wc.y - wh * 0.65, ww * 1.6, wh * 1.3);
      const m = UV.mach, m0 = P(m[0], m[1]), m1 = P(m[2], m[3]);
      this.box(ctx.mach, m0.x, m0.y, m1.x - m0.x, m1.y - m0.y);
      ctx.mach.style.backgroundSize = v.fw + "px " + v.fh + "px";
      ctx.mach.style.backgroundPosition = -m[0] * v.fw + "px " + -m[1] * v.fh + "px";
      // 묻는 카드·완성 글자 자리: 빈 벽(접시 위)
      const x0 = mode === "tall" ? sx + 8 : Math.max(sx + 8, P(UV.wall, 0).x);
      const x1 = Math.min(sx + sw - 8, m0.x + (m1.x - m0.x) * 0.06);
      const y1 = Math.min(P(0, UV.table).y + 4, L.slot[0].y - 4);
      L.area = { x0, x1, y0: sy + 8, y1 };
      this.layoutAskShow(ctx);
      // 인형: 작업대 왼쪽 (세로 화면은 받침판 빈 곳 — layoutTray 에서)
      if (mode !== "tall") {
        const d = P(UV.doll[0], UV.doll[1]);
        const dh = Math.min(U.clamp(v.fh * 0.3, 60, 210), (L.plate[0].cx - L.plate[0].w / 2 - sx) * 1.15);
        let y = d.y - dh;
        if (mode === "land") y = Math.min(y, tray.y - dh * 0.82);
        L.doll = { x: Math.max(sx + 2, d.x - dh / 2), y, h: dh };
      }
      const per = mode === "land" || (mode === "tall" && W >= 600) ? 4 : 3;
      if (ctx.st === 1 && ctx._per !== per) {
        ctx._per = per;
        this.renderFree(ctx);
      }
      ctx._per = per;
      this.layoutTray(ctx);
      this.sizeDex(ctx); // 도감을 연 채 화면이 바뀌어도 표가 넘치지 않게
    } finally {
      ctx._inLay = false;
    }
  },
  /** 도감 점토 판 크기: 한 화면에 들어가게 (11칸 × 15줄 — 너무 작아지면 아래로 밀어 보기) */
  sizeDex(ctx) {
    const L = ctx.L,
      grid = ctx.dexV && ctx.dexV.querySelector(".hmGridD");
    if (!L || !grid) return;
    const avail = L.H - L.sy - 96;
    grid.style.width = Math.round(Math.min(L.W - 48, 860, Math.max(290, (avail * 11) / 15.6))) + "px";
  },
  box(el, x, y, w, h) {
    const s = el.style;
    s.left = x + "px";
    s.top = y + "px";
    s.width = w + "px";
    s.height = h + "px";
  },
  /** 타일을 자리 {x,y,t} 에 */
  place(el, p) {
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.setProperty("--t", p.t + "px");
  },
  /** 묻는 카드(왼쪽)와 완성 글자(오른쪽) 자리 — 1단계는 완성 글자만 가운데 크게 */
  layoutAskShow(ctx) {
    const L = ctx.L, a = L && L.area;
    if (!a) return;
    const aw = a.x1 - a.x0, ah = a.y1 - a.y0, cy = (a.y0 + a.y1) / 2;
    const word = ctx.st === 3 ? 1.8 : 1;
    if (ctx.st === 1) {
      const t = Math.max(40, Math.min(ah, aw * 0.62, 280));
      L.ask = null;
      L.show = { x: (a.x0 + a.x1) / 2 - t / 2, y: cy - t / 2, t };
    } else {
      const gap = Math.min(16, aw * 0.05);
      const t = Math.max(40, Math.min(ah, (aw - gap) / (1 + word), 250));
      const sx = a.x0 + (aw - t * (1 + word) - gap) / 2;
      L.ask = { x: sx, y: cy - t / 2, t };
      L.show = ctx.noAsk ? { x: (a.x0 + a.x1) / 2 - t / 2, y: cy - t / 2, t } : { x: sx + t + gap, y: cy - t / 2, t }; // 묻는 카드가 없으면 가운데
    }
    if (ctx.askEl && L.ask) this.place(ctx.askEl, L.ask);
    if (ctx.showEl) this.placeShow(ctx, ctx.showEl);
    const sz = Math.round(KP.u.clamp(L.show.t * 0.34, 50, 78));
    ctx.spin.style.setProperty("--sz", sz + "px");
    this.box(ctx.spin, Math.min(L.show.x + L.show.t * word - sz * 0.45, a.x1 + 6 - sz * 0.4), L.show.y + L.show.t - sz * 0.62, sz, sz);
  },
  placeShow(ctx, el) {
    this.place(el, ctx.L.show);
    if (el.box) el.box.style.setProperty("--s", ctx.L.show.t * 0.86 + "px");
  },
  /** 받침판: 조각 크기와 묶음 자리 */
  layoutTray(ctx) {
    const L = ctx.L, tr = L && L.tray;
    if (!tr) return;
    const U = KP.u;
    this.box(ctx.tray, tr.x, tr.y, tr.w, tr.h);
    const quiz = ctx.st >= 2 && ctx.st <= 5;
    const gap = tr.w < 520 || tr.h < 110 ? 6 : 9, pad = gap * 1.2;
    let tt;
    if (L.mode === "land") tt = quiz ? Math.min(tr.h - pad * 2 - 8, 116) : Math.min(tr.h - pad * 2 - 8, (tr.w / 2 - 28 - gap * 5) / 4.6, 110);
    else if (L.mode === "wide") tt = quiz ? Math.min(tr.cw - pad * 2 - 14, (tr.h - pad * 2 - gap * 2 - 24) / 3, 104) : Math.min((tr.cw - pad * 2 - gap - 14) / 2, (tr.h - pad * 2 - gap - 30) / 2, 100);
    else {
      const aw = tr.w >= 600 ? tr.w - 200 : tr.w, per = ctx._per || 3; // 넓은 세로 화면은 옆에 인형 자리
      tt = quiz ? Math.min((aw - pad * 2 - gap * 2 - 24) / 3, tr.h * 0.4, 132) : Math.min((aw - pad * 2 - gap * per - 24) / (per + 0.6), (tr.h - pad * 4 - gap * 2 - 16) / 2.5, 118);
    }
    tt = Math.max(46, Math.floor(tt));
    ctx.tray.style.setProperty("--tt", tt + "px");
    ctx.tray.style.setProperty("--gap", gap + "px");
    const wh = (g) => [g.offsetWidth, g.offsetHeight];
    const at = (g, x, y) => {
      const [gw, gh] = wh(g);
      g.style.left = U.clamp(x, 4, tr.w - gw - 4) + "px";
      g.style.top = U.clamp(y, 4, Math.max(4, tr.h - gh - 4)) + "px";
    };
    // 재기 전에 왼쪽 위로 (옛 자리에서 재면 폭이 모자라 두 줄로 접힌 크기가 나옴)
    [ctx.gC, ctx.gV, ctx.gO].forEach((g) => {
      g.style.width = "";
      g.style.left = g.style.top = "0px";
    });
    if (L.mode === "wide") {
      const colW = tt * 2 + gap + pad * 2;
      ctx.gC.style.width = ctx.gV.style.width = colW + "px";
      ctx.gO.style.width = tt + pad * 2 + "px";
    }
    let bottom = 0; // 세로 화면: 묶음 아래 끝 (인형 자리 계산)
    if (!ctx.gC.hidden || !ctx.gV.hidden) {
      const [cw, ch] = wh(ctx.gC), [vw, vh] = wh(ctx.gV);
      if (L.mode === "land") {
        let cx = L.plate[0].cx - cw / 2, vx = L.plate[1].cx - vw / 2;
        if (cx + cw + 10 > vx) {
          cx = tr.w / 2 - 6 - cw;
          vx = tr.w / 2 + 6;
        }
        at(ctx.gC, cx, (tr.h - ch) / 2 - 2);
        at(ctx.gV, vx, (tr.h - vh) / 2 - 2);
      } else if (L.mode === "wide") {
        at(ctx.gC, (tr.cw - cw) / 2, (tr.h - ch) / 2);
        at(ctx.gV, tr.w - tr.cw + (tr.cw - vw) / 2, (tr.h - vh) / 2);
      } else {
        const y0 = Math.max(10, Math.min(18, tr.h * 0.04));
        at(ctx.gC, (tr.w - cw) / 2, y0);
        at(ctx.gV, (tr.w - vw) / 2, y0 + ch + gap * 1.6);
        bottom = y0 + ch + gap * 1.6 + vh;
      }
    }
    if (!ctx.gO.hidden) {
      const [ow, oh] = wh(ctx.gO);
      const tg = ctx.optTarget;
      if (L.mode === "land") {
        const cx = tg === 0 || tg === 1 ? L.plate[tg].cx : L.show ? L.show.x + L.show.t / 2 : tr.w / 2;
        at(ctx.gO, cx - ow / 2, (tr.h - oh) / 2 - 2);
      } else if (L.mode === "wide") at(ctx.gO, tg === 1 ? tr.w - tr.cw + (tr.cw - ow) / 2 : (tr.cw - ow) / 2, (tr.h - oh) / 2);
      else {
        at(ctx.gO, (tr.w - ow) / 2, Math.max(12, tr.h * 0.06));
        bottom = Math.max(12, tr.h * 0.06) + oh;
      }
    }
    // 세로 화면 인형: 받침판 아래 빈 곳 → 모자라면 작업대 오른쪽 아래 구석에 작게
    if (L.mode === "tall") {
      const free = tr.h - bottom - 14;
      const vis = [ctx.gC, ctx.gV, ctx.gO].filter((g) => !g.hidden);
      const rowW = Math.max(0, ...vis.map((g) => g.offsetWidth));
      const side = tr.w - rowW - 30;
      if (free < 120 && side >= 110) {
        // 넓은 세로 화면(태블릿): 묶음은 왼쪽, 인형은 오른쪽 옆에
        const dy = Math.max(0, (tr.h - bottom - 14) / 2);
        vis.forEach((g) => {
          g.style.left = Math.max(10, (tr.w - rowW - Math.min(side, 230)) / 2) + "px";
          g.style.top = parseFloat(g.style.top) + dy + "px";
        });
        const gx = parseFloat(vis[0] ? vis[0].style.left : 10) + rowW;
        const h = Math.min(tr.w - gx - 16, tr.h - 24, 220);
        L.doll = { x: gx + (tr.w - gx - h) / 2, y: tr.y + Math.min(tr.h - h - 8, bottom + dy - h + 10), h };
      } else if (free >= 78) {
        const h = Math.min(free, 190);
        L.doll = { x: (tr.w - h) / 2, y: tr.y + tr.h - h - 6, h };
      } else {
        const h = Math.min(86, L.sh * 0.34);
        L.doll = { x: L.sx + L.sw - h - 2, y: L.sy + L.sh - h - 2, h };
      }
    }
    if (L.doll) this.box(ctx.doll, L.doll.x, L.doll.y, L.doll.h, L.doll.h);
  },
  /** 화면 좌표 사각형 → 놀이판(wrap) 기준 가운데·크기 */
  local(ctx, r) {
    const w = ctx.wrap.getBoundingClientRect();
    return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2, w: r.width, h: r.height };
  },

  /* ================= 단계 고르기 ================= */
  go(ctx, st, first) {
    ctx.tk = (ctx.tk || 0) + 1; // 판·연출 무효화 표시
    ctx.st = st;
    ctx.busy = false;
    if (st !== "dex") KP.store.set("hmerge:stage", st);
    ctx.bSt.forEach((b, i) => b.classList.toggle("sel", st === i + 1));
    ctx.bDex.classList.toggle("sel", st === "dex");
    ctx.wrap.querySelectorAll(".hmDyn").forEach((e) => e.remove());
    ctx.onPlate = [null, null];
    ctx.showEl = ctx.askEl = null;
    ctx.pc = ctx.pv = -1;
    ctx.fs = "";
    ctx.drops = [];
    ctx.optTarget = null;
    ctx.plates.forEach((p) => p.classList.remove("now"));
    ctx.spin.hidden = true;
    ctx.gO.hidden = true;
    ctx.gO.innerHTML = "";
    ctx.gC.hidden = ctx.gV.hidden = st !== 1;
    ctx.dexV.hidden = st !== "dex";
    if (!first) KP.audio.sfx("select");
    ctx.hint(null);
    this.layoutAskShow(ctx);
    if (st === 1) this.freeStart(ctx);
    else if (st === "dex") this.dexShow(ctx);
    else this.next(ctx);
  },
  /** 한 단계에서 여러 번 맞히면 다음 단계 단추를 반짝 */
  suggestNext(ctx) {
    const n = (ctx.wins[ctx.st] = (ctx.wins[ctx.st] || 0) + 1);
    if (n === 5 && ctx.st < 5) {
      KP.u.replay(ctx.bSt[ctx.st], "glow");
      ctx.after(300, () => KP.voice.say("다음 단계도 해 볼까요?", { queue: true }));
    }
  },

  /* ================= 점토 타일 · 글자 상자 ================= */
  mkTile(kind, glyph, tag) {
    const el = KP.u.el(tag || "div", "hmTile " + kind, '<span class="g">' + glyph + "</span>");
    if (tag === "button") el.type = "button";
    // 나타나기(pin)가 끝나면 빼야 틀렸을 때 흔들기(.wrong)·힌트 반짝이 보임
    if (el.classList.contains("pin")) el.addEventListener("animationend", () => el.classList.remove("pin"), { once: true });
    return el;
  },
  mkSyl() {
    const U = KP.u;
    const el = U.el("div", "hmSyl fused");
    el.pc = U.el("span", "hmP c");
    el.pv = U.el("span", "hmP v");
    el.pj = U.el("span", "hmP j");
    el.g = U.el("span", "hmG", "");
    el.append(el.pc, el.pv, el.pj, el.g);
    return el;
  },
  /** 조각 배치: 모음 모양(lay)으로 세로(T)/가로(W) 자리, j 가 있으면 받침 자리(J), apart 면 나란히 떨어져 있음. 빈 조각은 q 면 빈 홈 */
  sylSet(el, o) {
    const D = KP.hangul, C = this.COL;
    el.classList.remove("fused", "T", "W", "J", "apart");
    el.classList.add(D.isTall(o.lay || o.v) ? "T" : "W");
    if (o.apart) el.classList.add("apart");
    if (o.j) el.classList.add("J");
    [["pc", o.c, C.c], ["pv", o.v, C.v], ["pj", o.j, C.j]].forEach(([k, t, col]) => {
      const p = el[k];
      p.textContent = t || (o.q && k !== "pj" ? "?" : "");
      p.classList.toggle("q", !t && !!o.q);
      p.style.color = t ? col : "";
    });
  },
  fuse(el, glyph) {
    el.g.textContent = glyph;
    el.classList.add("fused");
  },
  /** 접시 i 에 조각 올리기 (from: 화면 좌표 사각형 — 그 자리에서 날아옴, 없으면 톡 나타남) */
  placeTile(ctx, i, kind, glyph, from) {
    const old = ctx.onPlate[i];
    if (old) {
      old.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-30%) scale(.4)", opacity: 0 }], { duration: 260, fill: "forwards" });
      ctx.after(280, () => old.remove());
    }
    const L = ctx.L, p = L.slot[i];
    const el = this.mkTile(kind + " hmDyn", glyph);
    this.place(el, p);
    ctx.wrap.appendChild(el);
    ctx.onPlate[i] = el;
    if (from) {
      const f = this.local(ctx, from);
      const k = Math.max(0.3, Math.min(2.5, f.w / p.t));
      el.animate([{ transform: "translate(" + (f.x - p.x - p.t / 2) + "px," + (f.y - p.y - p.t / 2) + "px) scale(" + k + ")" }, { transform: "none" }], {
        duration: 280,
        easing: "cubic-bezier(.3,1.1,.5,1)",
      });
    } else el.animate([{ transform: "scale(0)" }, { transform: "none" }], { duration: 340, easing: "cubic-bezier(.2,1.5,.4,1)" });
    ctx.after(from ? 270 : 300, () => {
      if (!el.isConnected) return;
      KP.u.replay(el, "land");
      KP.audio.sfx("drop");
      const pl = L.plate[i];
      KP.pfx.ring(ctx.fx, pl.cx, pl.cy, kind === "v" ? "#9fd6ff" : kind === "c" ? "#ffc2ad" : "#ffe7a6", ctx, pl.w * 0.7);
    });
    return el;
  },
  /** 완성 글자 타일 (글자 상자 들어 있음) — 지난 것은 작아지며 사라짐 */
  newShow(ctx, kind) {
    const old = ctx.showEl;
    if (old) {
      old.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.3)", opacity: 0 }], { duration: 240, fill: "forwards" });
      ctx.after(260, () => old.remove());
    }
    const el = this.mkTile("s hmDyn " + (kind || ""), "");
    el.innerHTML = "";
    ctx.showEl = el;
    ctx.wrap.appendChild(el);
    return el;
  },
  newShowSyl(ctx, o) {
    const el = this.newShow(ctx);
    const box = (el.box = this.mkSyl());
    el.appendChild(box);
    box.classList.add("noAnim");
    this.sylSet(box, o);
    this.placeShow(ctx, el);
    void box.offsetWidth;
    box.classList.remove("noAnim");
    ctx.tap(el, () => ctx.showGlyph && KP.voice.say(ctx.showGlyph + "!"));
    return el;
  },
  /** 덜컹 소리 */
  clunk() {
    const A = KP.audio;
    A.tone(140, { to: 80, dur: 0.12, type: "square", vol: 0.1 });
    A.tone(120, { to: 70, dur: 0.12, type: "square", vol: 0.1, when: 0.16 });
  },
  boomFx(ctx, el) {
    KP.audio.sfx("sparkle");
    KP.u.replay(el, "boom");
    const r = el.getBoundingClientRect(), p = this.local(ctx, r);
    KP.pfx.burst(ctx.fx, p.x, p.y, "spark", 8, ctx);
    KP.confetti && KP.confetti(24, r.left + r.width / 2, r.top + r.height / 2);
  },
  /** 인형 친구: 폴짝 + 하트 */
  dollYay(ctx, n) {
    if (ctx.doll.hidden || !ctx.L || !ctx.L.doll) return;
    KP.u.replay(ctx.doll, "hop");
    const d = ctx.L.doll;
    KP.pfx.hearts(ctx.fx, d.x + d.h / 2, d.y + d.h * 0.15, n || 3, ctx);
  },
  dollHuh(ctx) {
    if (!ctx.doll.hidden) KP.u.replay(ctx.doll, "huh");
  },
  /** 조각이 깔때기로 날아 들어감 */
  flyTo(ctx, el, x, y, delay) {
    const cx = el.offsetLeft + el.offsetWidth / 2,
      cy = el.offsetTop + el.offsetHeight / 2;
    const dx = x - cx, dy = y - cy, lift = Math.max(50, Math.abs(dx) * 0.3), rot = dx > 0 ? 1 : -1;
    el.classList.add("fly");
    el.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: "translate(" + dx * 0.5 + "px," + (Math.min(dy, 0) * 0.5 - lift) + "px) scale(.8) rotate(" + 12 * rot + "deg)", opacity: 1, offset: 0.5 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(.2) rotate(" + 24 * rot + "deg)", opacity: 0.15 },
      ],
      { duration: 540, delay, easing: "ease-in", fill: "forwards" }
    );
    ctx.after(delay + 120, () => KP.audio.sfx("whoosh"));
    ctx.after(delay + 560, () => el.remove());
  },
  /** 완성 타일이 기계 창에서 톡 튀어나와 자리로 */
  emerge(ctx, el, quick) {
    const L = ctx.L, cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
    const dx = L.win.x - cx, dy = L.win.y - cy;
    el.animate(
      [
        { transform: "translate(" + dx + "px," + dy + "px) scale(.16)", opacity: 0 },
        { transform: "translate(" + dx * 0.9 + "px," + (dy - 30) + "px) scale(.34)", opacity: 1, offset: 0.25 },
        { transform: "none", opacity: 1 },
      ],
      { duration: quick ? 400 : 540, easing: "cubic-bezier(.3,1.15,.5,1)" }
    );
  },
  /** 기계: 조각들이 깔때기로 → 덜컹덜컹(창이 빛남) → 뿅! make() 가 만든 타일이 창에서 나옴. 판이 바뀌었으면 null */
  async runMachine(ctx, tk, tiles, make, quick) {
    const U = KP.u, L = ctx.L;
    tiles = tiles.filter(Boolean);
    if (tiles.length) {
      tiles.forEach((el, i) => this.flyTo(ctx, el, L.fun.x, L.fun.y, i * 110));
      await ctx.wait(540 + (tiles.length - 1) * 110);
      if (tk !== ctx.tk) return null;
    }
    U.replay(ctx.mach, "run");
    this.clunk();
    ctx.winGlow.classList.add("on");
    KP.pfx.burst(ctx.fx, L.fun.x, L.fun.y + 10, "dust", 6, ctx);
    await ctx.wait(quick ? 280 : 460);
    if (tk !== ctx.tk) {
      ctx.winGlow.classList.remove("on");
      return null;
    }
    const el = make();
    KP.audio.sfx("pop");
    this.emerge(ctx, el, quick);
    ctx.after(380, () => ctx.winGlow.classList.remove("on"));
    await ctx.wait(quick ? 420 : 540);
    return tk === ctx.tk ? el : null;
  },
  /** 글자 상자 조각을 제자리로(세로·가로·받침 자리 규칙) → 뿅 합체 */
  async assemble(ctx, tk, el, o, glyph) {
    this.sylSet(el.box, o);
    await ctx.wait(o.j ? 680 : 460);
    if (tk !== ctx.tk) return false;
    this.clunk();
    this.fuse(el.box, glyph);
    ctx.showGlyph = glyph;
    this.boomFx(ctx, el);
    return true;
  },
  /** "기역에 아 하면, 가! 가방의 가!" */
  mergeLine(ci, vi, withWord) {
    const D = KP.hangul;
    const s = D.compose(D.H[ci][0], D.V[vi][0]);
    const w = withWord && D.wordFor(s);
    return D.H[ci][1] + "에 " + D.V[vi][1] + " 하면, " + s + "!" + (w ? " " + w[0] + "의 " + s + "!" : "");
  },
  sayMerge(ctx, ci, vi) {
    KP.voice.say(this.mergeLine(ci, vi, true));
  },

  /* ================= 끌기 · 보기 ================= */
  /** 조각 끌기(놓을 자리 ctx.drops 에 놓으면 put) + 눌러도 put. put(화면 사각형, 놓은 자리|null) → true 면 받아들임 */
  dragCard(ctx, t, put) {
    let sx = 0,
      sy = 0,
      far = false;
    t.addEventListener("pointerdown", (e) => {
      sx = e.clientX;
      sy = e.clientY;
      far = false;
    }, true);
    t.addEventListener("pointermove", (e) => {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 12) far = true;
    }, true);
    KP.drag(t, {
      targets: () => ctx.drops || [],
      pad: 34,
      snap: false,
      onDrop: (tg) => {
        if (!tg) return;
        const r = t.getBoundingClientRect();
        const ok = put(r, tg);
        if (ok) {
          t.style.transition = "none";
          t.style.transform = "";
        } else {
          t.style.transition = "transform .28s cubic-bezier(.3,1.4,.5,1)";
          t.style.transform = "";
        }
      },
    });
    t.addEventListener("click", () => {
      if (far) return; // 끌다가 놓은 것은 이미 처리(또는 제자리로)
      KP.audio.unlock();
      KP.pfx.press(t);
      put(t.getBoundingClientRect(), null);
    });
  },
  /** 보기 조각 묶음 (보기 3개 이상 — 열쇠 별 규칙). target: 놓을 접시 0/1 또는 "show"(4단계 빈 홈) */
  opts(ctx, kind, list, o) {
    const g = ctx.gO;
    g.innerHTML = "";
    if (list.length < 3) ctx._fewChoice = true;
    ctx.optTarget = o.target;
    ctx.drops = o.target === "show" ? [ctx.showEl] : ctx.plates.slice();
    ctx.plates.forEach((p, i) => p.classList.toggle("now", o.target === i));
    if (ctx.showEl) ctx.showEl.classList.toggle("now", o.target === "show");
    let done = false;
    const btns = list.map((x, i) => {
      const b = this.mkTile(kind + " pin", x, "button");
      b.style.setProperty("--i", i);
      if (o.right(x)) b.dataset.right = "1";
      this.dragCard(ctx, b, (rect) => {
        if (done || ctx.busy) return false;
        if (o.right(x)) {
          done = true;
          b.classList.add("used");
          ctx.plates.forEach((p) => p.classList.remove("now"));
          if (ctx.showEl) ctx.showEl.classList.remove("now");
          ctx.drops = [];
          o.onRight(x, rect, b);
          return true;
        }
        ctx.miss(b, o.wrongMsg(x));
        this.dollHuh(ctx);
        return false;
      });
      g.appendChild(b);
      return b;
    });
    g.hidden = false;
    this.layoutTray(ctx);
    return btns;
  },

  /* ================= 1단계: 자유 합체 ================= */
  /** 받침판: 자음·모음 각 한 쪽(3~4개)씩, › 로 넘겨 보기 */
  renderFree(ctx) {
    const U = KP.u, D = ctx.D, per = ctx._per || 4;
    const fill = (g, kind, ord, pageKey) => {
      g.innerHTML = "";
      const pages = Math.ceil(ord.length / per);
      ctx[pageKey] = (ctx[pageKey] || 0) % pages;
      ord.slice(ctx[pageKey] * per, ctx[pageKey] * per + per).forEach((idx, i) => {
        const t = this.mkTile(kind + " pin", kind === "c" ? D.H[idx][0] : D.V[idx][0], "button");
        t.style.setProperty("--i", i);
        t.dataset.idx = idx;
        this.dragCard(ctx, t, (r) => this.putFree(ctx, kind, idx, r));
        g.appendChild(t);
      });
      if (pages > 1) {
        const pg = U.btn("›<span>" + "<b></b>".repeat(pages) + "</span>", "hmPg");
        pg.setAttribute("aria-label", "넘겨 보기");
        pg.querySelectorAll("b")[ctx[pageKey]].className = "on";
        ctx.tap(pg, () => {
          ctx[pageKey] = (ctx[pageKey] + 1) % pages;
          KP.pfx.sound("touch");
          fill(g, kind, ord, pageKey);
          this.layoutTray(ctx);
        });
        g.appendChild(pg);
      }
    };
    fill(ctx.gC, "c", ctx.CORD, "pgC");
    fill(ctx.gV, "v", ctx.VORD, "pgV");
  },
  freeStart(ctx) {
    ctx.fc = ctx.fv = -1;
    ctx.mTok = (ctx.mTok || 0) + 1;
    ctx.drops = ctx.plates.slice();
    this.renderFree(ctx);
    this.layoutTray(ctx);
    ctx.plates[0].classList.add("now");
    ctx.say("🧲 " + this.TX.intro);
    ctx.hint(() => ctx.gC.querySelector(".hmTile"), this.TX.hintC);
  },
  /** 조각을 접시에 (자음은 왼쪽, 모음은 오른쪽 — 다른 접시에 놓아도 제 접시로) */
  putFree(ctx, kind, idx, rect) {
    if (ctx.st !== 1 || ctx.busy) return false;
    const D = ctx.D, T = this.TX;
    ctx.spin.hidden = true; // 접시에 새 조각이 있으면 돌리기는 쉬기 (합체가 끝나면 다시)
    if (kind === "c") {
      ctx.pc = idx;
      this.placeTile(ctx, 0, "c", D.H[idx][0], rect);
    } else {
      ctx.pv = idx;
      this.placeTile(ctx, 1, "v", D.V[idx][0], rect);
    }
    ctx.plates[0].classList.toggle("now", ctx.pc < 0);
    ctx.plates[1].classList.toggle("now", ctx.pc >= 0 && ctx.pv < 0);
    if (ctx.pc >= 0 && ctx.pv >= 0) this.freeMerge(ctx);
    else if (kind === "c") {
      KP.voice.say(D.H[idx][1] + "!");
      ctx.hint(() => ctx.gV.querySelector(".hmTile"), T.hintV);
    } else {
      KP.voice.say(D.V[idx][1] + "!");
      ctx.hint(() => ctx.gC.querySelector(".hmTile"), T.hintC);
    }
    return true;
  },
  /** 🔄 모음 돌리기: 자음은 그대로, 모음만 다음 것으로 (가→갸→거→겨…) */
  spinV(ctx) {
    if (ctx.st !== 1 || ctx.fc < 0 || ctx.busy) return;
    KP.u.replay(ctx.spin, "go");
    ctx.fv = (ctx.fv + 1) % ctx.D.V.length;
    this.freeMerge(ctx, true);
  },
  /** 두 조각 → 기계 → 글자 상자 안에서 조각이 모음 모양대로 제자리에 → 뿅! 글자 */
  async freeMerge(ctx, quick) {
    const D = ctx.D, U = KP.u, self = this;
    const tk = ctx.tk;
    ctx.busy = true;
    ctx.hint(null);
    ctx.plates.forEach((p) => p.classList.remove("now"));
    let tiles = [];
    if (!quick) {
      ctx.fc = ctx.pc;
      ctx.fv = ctx.pv;
      ctx.pc = ctx.pv = -1;
      tiles = ctx.onPlate.slice();
      ctx.onPlate = [null, null];
    }
    ctx.spin.hidden = true;
    const ci = ctx.fc, vi = ctx.fv;
    const c = D.H[ci][0], v = D.V[vi][0], s = D.compose(c, v);
    if (!quick) await ctx.wait(260); // 놓는 '쏙'이 끝나고
    if (tk !== ctx.tk) return;
    const el = await this.runMachine(ctx, tk, tiles, () => self.newShowSyl(ctx, { c, v, apart: true }), quick);
    if (!el) return;
    ctx.fs = s;
    if (!(await this.assemble(ctx, tk, el, { c, v }, s))) return;
    const w = D.wordFor(s);
    if (w) el.appendChild(U.el("span", "hmTag", KP.E(w[1]) + "<span>" + w[0] + "</span>"));
    if (quick) KP.voice.say(s + "!");
    else self.sayMerge(ctx, ci, vi);
    self.dollYay(ctx);
    ctx.busy = false;
    ctx.spin.hidden = false;
    ctx.plates[0].classList.add("now");
    ctx.freeMade++;
    const r = self.addDex(ctx, s);
    if (r.fresh) ctx.freeNew++;
    const mt = ++ctx.mTok;
    if (ctx.freeMade === 3) ctx.after(2600, () => ctx.st === 1 && mt === ctx.mTok && KP.voice.say("모음만 바꿔 봐요! 가, 갸, 거, 겨!"));
    ctx.hint(() => (ctx.spin.hidden ? null : ctx.spin), self.TX.spin);
    // 칭찬: 도감 한 줄·전부 채움, 또는 새 글자 6개마다 (자유 놀이라 열쇠 별은 없음)
    const o = self.dexWin(r, r.fresh && ctx.freeNew % 6 === 0 ? { msg: "{부름} 글자 박사!" } : null);
    if (o)
      ctx.after(quick ? 900 : 2400, async () => {
        if (ctx.st !== 1 || tk !== ctx.tk) return;
        ctx._fewChoice = true; // 자유 놀이: 열쇠 별 없이 칭찬만
        ctx.score.add();
        await ctx.win(o);
      });
  },

  /* ================= 2~5단계 공통 ================= */
  next(ctx) {
    ctx.tk = (ctx.tk || 0) + 1;
    ctx.wrap.querySelectorAll(".hmDyn").forEach((e) => e.remove());
    ctx.onPlate = [null, null];
    ctx.showEl = ctx.askEl = null;
    ctx.showGlyph = "";
    ctx.busy = false;
    ctx.noAsk = false;
    if (ctx.st === 4) {
      // 4단계 글자를 먼저 골라 둠: 그림 낱말이 없으면 묻는 카드 없이 글자 타일을 가운데로
      ctx.next4 = this.pickNew(ctx, ctx.ALL.filter((x) => ctx.D.wordFor(x)).concat(ctx.ALL), "last4");
      ctx.noAsk = !ctx.D.wordFor(ctx.next4);
    }
    this.layoutAskShow(ctx);
    ctx.hint(null);
    this["st" + ctx.st](ctx, ctx.tk);
  },
  /** 맞힌 뒤: 점수·칭찬 → 다음 판 */
  async done(ctx, tk, base, r, wait) {
    ctx.score.add();
    ctx.round++;
    this.suggestNext(ctx);
    await ctx.wait(wait || 1500);
    if (tk !== ctx.tk) return; // 그새 단계를 바꿨으면 지난 판 축하 안 함
    const bg = ctx.round % 5 === 0;
    const o = this.dexWin(r || {}, { big: bg, msg: bg ? "{부름} 글자 박사!" : base, quiet: !bg });
    const ok = await ctx.win(o);
    if (ok && tk === ctx.tk) this.next(ctx);
  },
  /** 닮은 자음 섞어 보기 n개 */
  consOpts(ctx, c, n, pool) {
    const U = KP.u,
      D = ctx.D;
    const all = pool ? [...pool] : D.H.map((h) => h[0]);
    const like = (D.LIKE.find((g) => g.includes(c)) || "").replace(c, "");
    const p = U.shuffle([...like].filter((x) => all.includes(x))).concat(U.shuffle(all.filter((x) => x !== c && !like.includes(x))));
    return U.shuffle([c, ...p.slice(0, n - 1)]);
  },
  /** 닮은 모음 섞어 보기 n개 */
  vowOpts(ctx, v, n) {
    const U = KP.u,
      D = ctx.D;
    const like = (D.VLIKE.find((g) => g[0] === v) || "").slice(1);
    const p = [...like].concat(U.shuffle(D.V.map((x) => x[0]).filter((x) => x !== v && !like.includes(x))));
    return U.shuffle([v, ...p.slice(0, n - 1)]);
  },
  pickNew(ctx, list, key) {
    let x = KP.u.pick(list);
    if (list.length > 1 && x === ctx[key]) x = KP.u.pick(list.filter((y) => y !== x));
    ctx[key] = x;
    return x;
  },
  /** 묻는 카드: 그림(+낱말, 첫 글자는 ?) 또는 귀 — 점토 판 */
  setAsk(ctx, o) {
    const U = KP.u;
    const a = U.el("div", "hmAsk hmDyn");
    a.innerHTML = KP.E(o.em) + (o.word ? '<span class="hmW">' + o.word + "</span>" : "");
    if (o.say) ctx.tap(a, () => KP.voice.say(o.say));
    ctx.askEl = a;
    ctx.wrap.appendChild(a);
    if (ctx.L && ctx.L.ask) this.place(a, ctx.L.ask);
    a.animate([{ transform: "scale(.4)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,1.5,.4,1)" });
    return a;
  },

  /* ---------- 2단계: 글자 만들기 ---------- */
  st2(ctx, tk) {
    const U = KP.u,
      D = ctx.D,
      self = this;
    const pic = Math.random() < 0.5;
    let s, w;
    if (pic) {
      w = this.pickNew(ctx, ctx.PIC, "last2");
      s = w[0][0];
    } else s = this.pickNew(ctx, ctx.ALL, "last2");
    const ci = ctx.ci(s),
      vi = ctx.vi(s);
    const [c, nm] = D.H[ci];
    const [v, snd] = D.V[vi];
    const ask = pic
      ? this.setAsk(ctx, { em: w[1], word: "<i>?</i>" + w[0].slice(1), say: w[0] + "!" })
      : this.setAsk(ctx, { em: "👂", say: s + "!" });
    const T = this.TX;
    ctx.say("🔨 " + U.josa(s, "을/를") + " 만들어 봐요!", T.make(s, pic && w));
    const askV = () => {
      const b2 = self.opts(ctx, "v", self.vowOpts(ctx, v, 3), {
        target: 1,
        right: (x) => x === v,
        wrongMsg: () => T.vWrong(s, snd),
        onRight: async (x, rect) => {
          self.placeTile(ctx, 1, "v", v, rect);
          await ctx.wait(420);
          if (tk !== ctx.tk) return;
          const tiles = ctx.onPlate.slice();
          ctx.onPlate = [null, null];
          const el = await self.runMachine(ctx, tk, tiles, () => self.newShowSyl(ctx, { c, v, apart: true }));
          if (!el || !(await self.assemble(ctx, tk, el, { c, v }, s))) return;
          if (pic) {
            ask.innerHTML = KP.E(w[1]) + '<span class="hmW"><i>' + s + "</i>" + w[0].slice(1) + "</span>";
            U.replay(ask, "yay");
          }
          KP.voice.say(self.mergeLine(ci, vi, true));
          self.dollYay(ctx);
          self.done(ctx, tk, "글자 완성!", self.addDex(ctx, s), 2200);
        },
      });
      ctx.hint(() => b2.find((b) => b.dataset.right), T.vWrong(s, snd));
    };
    const b1 = this.opts(ctx, "c", this.consOpts(ctx, c, 3), {
      target: 0,
      right: (x) => x === c,
      wrongMsg: () => T.cWrong(s),
      onRight: async (x, rect) => {
        self.placeTile(ctx, 0, "c", c, rect);
        KP.audio.sfx("good");
        KP.voice.say(T.cRight(nm));
        await ctx.wait(700);
        if (tk !== ctx.tk) return;
        askV();
      },
    });
    ctx.hint(() => b1.find((b) => b.dataset.right), T.cWrong(s));
  },

  /* ---------- 3단계: 낱말 만들기 ---------- */
  /** 글자 s 와 헷갈리는 받침 없는 글자 2개 (같은 모음·닮은 자음 / 같은 자음·닮은 모음) */
  sylOpts(ctx, s, avoid) {
    const U = KP.u,
      D = ctx.D;
    const c = D.cho(s),
      v = D.jung(s);
    const cs = this.consOpts(ctx, c, 4).filter((x) => x !== c).map((x) => D.compose(x, v));
    const vs = this.vowOpts(ctx, v, 3).filter((x) => x !== v).map((x) => D.compose(c, x));
    const cand = [...new Set(U.shuffle([cs[0], vs[0]]).concat(U.shuffle(cs.slice(1).concat(vs.slice(1)))))].filter((x) => x !== s && !avoid.includes(x) && ctx.ALLSET.has(x));
    return U.shuffle([s, ...cand.slice(0, 2)]);
  },
  st3(ctx, tk) {
    const U = KP.u,
      self = this;
    const w = this.pickNew(ctx, ctx.W2, "last3");
    const syl = [...w[0]];
    const ask = this.setAsk(ctx, { em: w[1], say: w[0] + "!" });
    const T = this.TX;
    ctx.say("🧱 " + w[0] + "! 글자 칸을 채워요!", T.w1(w[0]));
    const made = [];
    const ask1 = (k) => {
      const t = syl[k];
      const btns = this.opts(ctx, "s", this.sylOpts(ctx, t, syl.filter((x) => x !== t)), {
        target: k,
        right: (x) => x === t,
        wrongMsg: () => T.wWrong(w[0], k),
        onRight: async (x, rect) => {
          self.placeTile(ctx, k, "s", t, rect);
          KP.audio.sfx("good");
          made.push(self.addDex(ctx, t));
          if (k + 1 < syl.length) {
            KP.voice.say(T.w2(t));
            await ctx.wait(650);
            if (tk !== ctx.tk) return;
            ask1(k + 1);
            return;
          }
          await ctx.wait(450);
          if (tk !== ctx.tk) return;
          const tiles = ctx.onPlate.slice();
          ctx.onPlate = [null, null];
          const el = await self.runMachine(ctx, tk, tiles, () => {
            const e = self.newShow(ctx, "word");
            e.innerHTML = '<span class="g">' + w[0] + "</span>";
            self.placeShow(ctx, e);
            return e;
          });
          if (!el) return;
          ctx.showGlyph = w[0];
          ctx.tap(el, () => KP.voice.say(w[0] + "!"));
          self.boomFx(ctx, el);
          U.replay(ask, "yay");
          KP.voice.say(T.wDone(w[0]));
          self.dollYay(ctx);
          const r = { all: made.some((m) => m.all), row: (made.find((m) => m.row >= 0) || { row: -1 }).row };
          self.done(ctx, tk, "딩동댕!", r, 1500);
        },
      });
      ctx.hint(() => btns.find((b) => b.dataset.right), k ? T.w2(syl[0]) : T.w1(w[0]));
    };
    ask1(0);
  },

  /* ---------- 4단계: 글자 쪼개기 ---------- */
  st4(ctx, tk) {
    const U = KP.u,
      D = ctx.D,
      self = this;
    const s = ctx.next4;
    const ci = ctx.ci(s),
      vi = ctx.vi(s);
    const [c, nm] = D.H[ci];
    const [v, snd] = D.V[vi];
    const w = D.wordFor(s);
    if (w) this.setAsk(ctx, { em: w[1], word: w[0], say: w[0] + "의 " + s + "!" });
    // 글자 타일이 기계에서 톡 나와 자리로
    const el = this.newShowSyl(ctx, { c, v });
    const box = el.box;
    this.fuse(box, s);
    ctx.showGlyph = s;
    this.emerge(ctx, el);
    KP.audio.sfx("pop");
    const T = this.TX;
    ctx.say("✂️ " + T.cut(s));
    // 가위가 자음과 모음 사이(세로 모음은 세로로, 가로 모음은 가로로)를 지나감
    const tall = D.isTall(v);
    ctx.after(800, () => {
      if (tk !== ctx.tk) return;
      const L = ctx.L, p = L.show, sz = Math.max(40, p.t * 0.42);
      const cut = U.el("div", "hmCut hmDyn", KP.E("✂️"));
      cut.style.fontSize = sz + "px";
      ctx.fx.appendChild(cut);
      let x0, y0, x1, y1;
      if (tall) {
        x0 = x1 = p.x + p.t * 0.52 - sz / 2;
        y0 = p.y - sz * 0.8;
        y1 = p.y + p.t - sz * 0.1;
      } else {
        y0 = y1 = p.y + p.t * 0.5 - sz / 2;
        x0 = p.x - sz * 0.8;
        x1 = p.x + p.t - sz * 0.1;
      }
      const rot = tall ? " rotate(90deg)" : "";
      cut.style.transform = "translate(" + x0 + "px," + y0 + "px)" + rot;
      requestAnimationFrame(() => requestAnimationFrame(() => (cut.style.transform = "translate(" + x1 + "px," + y1 + "px)" + rot)));
      KP.audio.noise({ dur: 0.08, vol: 0.18, hp: 2500 });
      KP.audio.noise({ dur: 0.08, vol: 0.18, hp: 2500, when: 0.3 });
      ctx.after(850, () => cut.remove());
    });
    ctx.after(1650, () => {
      if (tk !== ctx.tk) return;
      self.sylSet(box, { lay: v, q: true });
      KP.audio.sfx("pop");
      askC();
    });
    // 맞는 조각이 빈 홈으로 날아가 끼워짐
    const fit = (rect, piece, kind, glyph, then) => {
      const f = self.local(ctx, rect), pr = self.local(ctx, piece.getBoundingClientRect());
      const t = f.w;
      const fly = self.mkTile(kind + " fly hmDyn", glyph);
      self.place(fly, { x: f.x - t / 2, y: f.y - t / 2, t });
      ctx.wrap.appendChild(fly);
      const k = Math.min(pr.w, pr.h) / t;
      fly.animate([{ transform: "none" }, { transform: "translate(" + (pr.x - f.x) + "px," + (pr.y - f.y) + "px) scale(" + k + ")", opacity: 0.6 }], {
        duration: 360,
        easing: "cubic-bezier(.4,0,.6,1)",
        fill: "forwards",
      });
      ctx.after(350, () => {
        fly.remove();
        if (tk !== ctx.tk) return;
        then();
        KP.u.replay(piece, "got");
        KP.audio.sfx("drop");
      });
    };
    const askC = () => {
      KP.voice.say(T.cutC);
      const b1 = self.opts(ctx, "c", self.consOpts(ctx, c, 3), {
        target: "show",
        right: (x) => x === c,
        wrongMsg: () => T.cutCWrong(s),
        onRight: async (x, rect) => {
          fit(rect, box.pc, "c", c, () => self.sylSet(box, { lay: v, c, q: true }));
          KP.audio.sfx("good");
          KP.voice.say(T.cRight(nm));
          await ctx.wait(800);
          if (tk !== ctx.tk) return;
          const b2 = self.opts(ctx, "v", self.vowOpts(ctx, v, 3), {
            target: "show",
            right: (x2) => x2 === v,
            wrongMsg: () => T.cutVWrong(s, snd),
            onRight: async (x2, r2) => {
              fit(r2, box.pv, "v", v, () => self.sylSet(box, { c, v }));
              await ctx.wait(900);
              if (tk !== ctx.tk) return;
              self.clunk();
              self.fuse(box, s);
              self.boomFx(ctx, el);
              KP.voice.say(self.mergeLine(ci, vi, false));
              self.dollYay(ctx);
              self.done(ctx, tk, "딩동댕!", self.addDex(ctx, s), 1900);
            },
          });
          ctx.hint(() => b2.find((b) => b.dataset.right), T.vWrong(s, snd));
        },
      });
      ctx.hint(() => b1.find((b) => b.dataset.right), T.cWrong(s));
    };
  },

  /* ---------- 5단계: 받침 합체 ---------- */
  st5(ctx, tk) {
    const U = KP.u,
      D = ctx.D,
      self = this;
    const w = this.pickNew(ctx, ctx.BAT, "last5");
    const s = w[0];
    const c = D.cho(s),
      v = D.jung(s),
      j = D.jong(s);
    const base = D.compose(c, v);
    const jn = D.nameOfC(j);
    const ask = this.setAsk(ctx, { em: w[1], say: s + "!" });
    // 받침 없는 글자는 왼쪽 접시에 먼저 놓여 있음, 받침 조각은 오른쪽 접시로
    const bt = this.placeTile(ctx, 0, "s", base, null);
    ctx.tap(bt, () => KP.voice.say(base + "!"));
    const T = this.TX;
    ctx.say("👇 " + T.bat(s, base));
    const btns = this.opts(ctx, "c", this.consOpts(ctx, j, 3, ctx.JPOOL), {
      target: 1,
      right: (x) => x === j,
      wrongMsg: () => T.batWrong(s),
      onRight: async (x, rect) => {
        self.placeTile(ctx, 1, "c", j, rect);
        await ctx.wait(420);
        if (tk !== ctx.tk) return;
        const tiles = ctx.onPlate.slice();
        ctx.onPlate = [null, null];
        // 기계에서 나온 글자 상자: 받침 없는 글자 조각 → 위로 올라가고 받침이 아래로 쏙
        const el = await self.runMachine(ctx, tk, tiles, () => self.newShowSyl(ctx, { c, v }));
        if (!el || !(await self.assemble(ctx, tk, el, { c, v, j }, s))) return;
        U.replay(ask, "yay");
        KP.voice.say(T.batRight(base, jn, s));
        self.dollYay(ctx);
        self.done(ctx, tk, "글자 완성!", null, 2000);
      },
    });
    ctx.hint(() => btns.find((bb) => bb.dataset.right), T.batWrong(s).replace("아니에요! ", ""));
  },

  /* ================= 도감: 점토 판 ================= */
  dexShow(ctx) {
    const U = KP.u,
      D = ctx.D,
      self = this;
    const box = ctx.dexV;
    box.innerHTML = "";
    box.scrollTop = 0;
    const n = ctx.dex.size;
    box.appendChild(U.el("div", "hmDexTop", KP.E("📒") + "<span><b>" + n + "</b> / " + ctx.ALL.length + "</span>"));
    const slab = U.el("div", "hmSlab");
    const grid = U.el("div", "hmGridD");
    grid.appendChild(U.el("span", "hmDh v", ""));
    D.V.forEach(([v]) => grid.appendChild(U.el("span", "hmDh v", v)));
    D.H.forEach(([c, nm], ci) => {
      const row = ctx.ALL.slice(ci * 10, ci * 10 + 10);
      const full = row.every((x) => ctx.dex.has(x));
      const h = U.btn(c, "hmDh");
      if (full) h.appendChild(U.el("span", "hmStamp", KP.E("💮")));
      ctx.tap(h, () => {
        U.replay(h, "wig");
        // 다 채운 줄은 "가! 갸! 거! …" 이어 읽기, 아니면 자음 이름
        KP.voice.say(full ? row.map((x) => x + "!").join(" ") : nm + "!");
      });
      grid.appendChild(h);
      row.forEach((s, vi) => {
        const on = ctx.dex.has(s);
        const b = U.btn(s, "hmDc" + (on ? " on" : "") + (ctx.dexNew.has(s) ? " new" : ""));
        b.style.setProperty("--c", D.CC[ci]);
        ctx.tap(b, () => {
          U.replay(b, "wig");
          if (on) {
            KP.audio.note(KP.audio.SCALE[vi % 8], { inst: "marimba", dur: 0.3, vol: 0.22 });
            self.sayMerge(ctx, ci, vi);
          } else KP.voice.say(self.TX.dexEmpty);
        });
        grid.appendChild(b);
      });
    });
    slab.appendChild(grid);
    box.appendChild(slab);
    self.sizeDex(ctx);
    ctx.dexNew.clear();
    ctx.say("📒 " + (n ? self.TX.dexIn : self.TX.dexNone));
    ctx.hint(() => box.querySelector(".hmDc.on") || ctx.bSt[0], n ? self.TX.dexTap : self.TX.dexNone);
  },

  /** (점검·녹음용) 이 놀이가 말할 수 있는 문장 전부 — tools/out 점검 스크립트가 씀 */
  lines(ctx) {
    const D = ctx.D,
      T = this.TX,
      out = new Set();
    const add = (t) => out.add(t.replace(/\p{Extended_Pictographic}|️/gu, "").replace(/\s+/g, " ").trim());
    [
      T.intro, T.hintC, T.hintV, "모음만 바꿔 봐요! 가, 갸, 거, 겨!", T.spin,
      "{부름} 글자 박사!", "{부름} 글자 도감 완성!", "한 줄 다 채웠어요! 도장 쾅!", "다음 단계도 해 볼까요?", "글자 완성!", "딩동댕!",
      T.cutC, T.dexIn, T.dexNone, T.dexEmpty, T.dexTap,
    ].forEach(add);
    D.H.forEach(([c, nm], ci) => {
      add(nm + "!");
      add(T.cRight(nm));
      const row = [];
      D.V.forEach(([v, snd], vi) => {
        const s = D.compose(c, v);
        row.push(s + "!");
        add(this.mergeLine(ci, vi, true));
        add(this.mergeLine(ci, vi, false));
        add(s + "!");
        add(T.make(s, null));
        add(T.cWrong(s));
        add(T.vWrong(s, snd));
        add(T.cut(s));
        add(T.cutCWrong(s));
        add(T.cutVWrong(s, snd));
        const w = D.wordFor(s);
        if (w) {
          add(w[0] + "의 " + s + "!");
          add(T.make(s, w));
        }
      });
      add(row.join(" "));
    });
    D.V.forEach(([, snd]) => add(snd + "!"));
    ctx.W2.forEach(([w]) => {
      add(w + "!");
      add(T.w1(w));
      add(T.w2(w[0]));
      add(T.wDone(w));
      add(T.wWrong(w, 0));
      add(T.wWrong(w, 1));
    });
    ctx.BAT.forEach(([s]) => {
      const base = D.compose(D.cho(s), D.jung(s));
      add(s + "!");
      add(base + "!");
      add(T.bat(s, base));
      add(T.batWrong(s));
      add(T.batRight(base, D.nameOfC(D.jong(s)), s));
    });
    return [...out];
  },
});

;

/* ==== js/games/smart/hwrite.js ==== */
/* 한글 쓰기 공책 — 학습지(따라 쓰기 교재) 방식을 태블릿으로
   차례: ① 선 긋기(운필) → ② 모음 → ③ 자음 → ④ 글자(가~하, 고~호) → ⑤ 낱말
   한 글자 쓰기 = 공책 한 줄 3칸
     1칸 '보고 따라 쓰기' : 획순 시범 애니메이션 → 진한 점선 + 획 번호 + 방향 화살표
     2칸 '흐린 글씨'       : 흐린 글씨 위에 쓰기 (다음 획 시작점만 표시)
     3칸 '혼자 쓰기'       : 빈 칸에 옆의 본보기 글자를 보고 쓰기
   다 쓰면 칸마다 채점(얼마나 따라 썼나 + 선 밖으로 덜 나갔나) → 별 1~3개, '참 잘했어요' 도장.
   - 획 순서는 보여 주기만 하고 강요하지 않음(만 3~4세). 막히지 않게 [다 썼어요] 버튼.
   - 펜(애플펜슬 등)을 쓰면 손바닥 터치는 무시, 펜은 누르는 힘에 따라 굵기 변화.
   - 획순: 국어 교과서식 일반 기준(가로는 왼→오, 세로는 위→아래, ㅇ은 위에서 시계 반대 방향).
     ㄹ=ㄱ·가운데 가로·ㄴ(3획), ㅈ=가로·삐침·내림(3획), ㅊ=꼭지+ㅈ(4획), ㅎ=꼭지·가로·ㅇ(3획) */
"use strict";
(function () {
  /* ---------- 획 자료 (100×100 칸, 점 목록 / {o:[x,y,r]} 는 동그라미) ---------- */
  const ST = {
    ㄱ: [[[20, 22], [78, 22], [78, 82]]],
    ㄴ: [[[24, 18], [24, 78], [84, 78]]],
    ㄷ: [[[22, 22], [78, 22]], [[22, 22], [22, 78], [80, 78]]],
    ㄹ: [[[22, 16], [78, 16], [78, 48]], [[22, 48], [78, 48]], [[22, 48], [22, 82], [80, 82]]],
    ㅁ: [[[22, 20], [22, 80]], [[22, 20], [78, 20], [78, 80]], [[22, 80], [78, 80]]],
    ㅂ: [[[24, 16], [24, 82]], [[76, 16], [76, 82]], [[24, 48], [76, 48]], [[24, 82], [76, 82]]],
    ㅅ: [[[52, 16], [18, 84]], [[45, 44], [84, 84]]],
    ㅇ: [{ o: [50, 50, 32] }],
    ㅈ: [[[20, 20], [80, 20]], [[56, 20], [18, 84]], [[47, 48], [84, 84]]],
    ㅊ: [[[42, 6], [58, 14]], [[20, 30], [80, 30]], [[56, 30], [18, 88]], [[47, 54], [84, 88]]],
    ㅋ: [[[20, 20], [78, 20], [78, 82]], [[20, 50], [78, 50]]],
    ㅌ: [[[22, 18], [78, 18]], [[22, 48], [74, 48]], [[22, 18], [22, 80], [80, 80]]],
    ㅍ: [[[16, 20], [84, 20]], [[36, 20], [36, 78]], [[64, 20], [64, 78]], [[16, 78], [84, 78]]],
    ㅎ: [[[40, 8], [60, 8]], [[18, 26], [82, 26]], { o: [50, 62, 22] }],
    ㅏ: [[[40, 10], [40, 90]], [[40, 50], [72, 50]]],
    ㅑ: [[[38, 10], [38, 90]], [[38, 38], [70, 38]], [[38, 62], [70, 62]]],
    ㅓ: [[[28, 50], [60, 50]], [[60, 10], [60, 90]]],
    ㅕ: [[[30, 38], [62, 38]], [[30, 62], [62, 62]], [[62, 10], [62, 90]]],
    ㅗ: [[[50, 30], [50, 62]], [[12, 62], [88, 62]]],
    ㅛ: [[[38, 30], [38, 62]], [[62, 30], [62, 62]], [[12, 62], [88, 62]]],
    ㅜ: [[[12, 38], [88, 38]], [[50, 38], [50, 74]]],
    ㅠ: [[[12, 38], [88, 38]], [[38, 38], [38, 74]], [[62, 38], [62, 74]]],
    ㅡ: [[[10, 50], [90, 50]]],
    ㅣ: [[[50, 10], [50, 90]]],
  };
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const compose = (c, v) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28);
  const split = (s) => {
    const k = s.charCodeAt(0) - 0xac00;
    return [CHO[Math.floor(k / 588)], JUNG[Math.floor((k % 588) / 28)], k % 28];
  };
  const mapStrokes = (strokes, [x0, y0, x1, y1]) =>
    strokes.map((s) => {
      const sx = (x1 - x0) / 100,
        sy = (y1 - y0) / 100;
      if (s.o) return { o: [x0 + s.o[0] * sx, y0 + s.o[1] * sy, s.o[2] * Math.min(sx, sy)] };
      return s.map(([x, y]) => [x0 + x * sx, y0 + y * sy]);
    });
  /** 받침 없는 글자 → 획 (세로 모음은 오른쪽, 가로 모음은 아래) */
  function sylStrokes(syl) {
    const [c, v, jong] = split(syl);
    if (jong || !ST[c] || !ST[v]) return null;
    const vert = "ㅏㅑㅓㅕㅣ".includes(v);
    const cb = vert ? [2, 14, 62, 86] : [18, 2, 82, 56];
    const vb = vert ? [38, 2, 98, 98] : [2, 34, 98, 100];
    return mapStrokes(ST[c], cb).concat(mapStrokes(ST[v], vb));
  }
  // 선 긋기: [이름, 출발 그림, 도착 그림, 획들, 안내]
  const wave = () => {
    const p = [];
    for (let i = 0; i <= 24; i++) p.push([10 + (80 * i) / 24, 50 + Math.sin((i / 24) * Math.PI * 3) * 18]);
    return [p];
  };
  const spiral = () => {
    const p = [];
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * Math.PI * 4.2;
      const r = 36 - (i / 60) * 30;
      p.push([50 + Math.cos(t - Math.PI / 2) * r, 50 + Math.sin(t - Math.PI / 2) * r]);
    }
    return [p];
  };
  const LINES = [
    ["가로선", "🐶", "🦴", [[[12, 50], [88, 50]]], "강아지가 뼈다귀까지 쭉!"],
    ["세로선", "☁️", "🌷", [[[50, 12], [50, 88]]], "비가 주룩주룩, 꽃까지 내려가요!"],
    ["비스듬한 선", "🐿️", "🌰", [[[16, 16], [84, 84]]], "다람쥐가 미끄럼틀을 쭉!"],
    ["반대로 비스듬히", "🐝", "🌻", [[[84, 16], [16, 84]]], "꿀벌이 해바라기까지 슝!"],
    ["꺾은선", "🚗", "🏠", [[[14, 22], [80, 22], [80, 84]]], "자동차가 꺾어서 집까지!"],
    ["뾰족뾰족 산", "🐰", "🥕", [[[8, 72], [26, 30], [44, 72], [62, 30], [80, 72], [92, 50]]], "토끼가 산을 넘어 당근까지!"],
    ["구불구불 파도", "🐳", "🏝️", wave(), "고래가 파도를 타고 섬까지!"],
    ["동그라미", "🐞", "🐞", [{ o: [50, 50, 32] }], "무당벌레처럼 동글동글!"],
    ["달팽이", "🐌", "🐌", spiral(), "달팽이 집을 빙글빙글!"],
  ];
  const H = [
    ["ㄱ", "기역", "기차", "🚂"], ["ㄴ", "니은", "나비", "🦋"], ["ㄷ", "디귿", "다람쥐", "🐿️"], ["ㄹ", "리을", "라디오", "📻"],
    ["ㅁ", "미음", "모자", "🎩"], ["ㅂ", "비읍", "바나나", "🍌"], ["ㅅ", "시옷", "사자", "🦁"], ["ㅇ", "이응", "오리", "🦆"],
    ["ㅈ", "지읒", "자전거", "🚲"], ["ㅊ", "치읓", "치즈", "🧀"], ["ㅋ", "키읔", "코끼리", "🐘"], ["ㅌ", "티읕", "토끼", "🐰"],
    ["ㅍ", "피읖", "포도", "🍇"], ["ㅎ", "히읗", "하마", "🦛"],
  ];
  const V = [
    ["ㅏ", "아", "아기", "👶"], ["ㅑ", "야", "야구", "⚾"], ["ㅓ", "어", "어묵", "🍢"], ["ㅕ", "여", "여우", "🦊"], ["ㅗ", "오", "오리", "🦆"],
    ["ㅛ", "요", "요요", "🪀"], ["ㅜ", "우", "우유", "🥛"], ["ㅠ", "유", "유니콘", "🦄"], ["ㅡ", "으", "으르렁", "🦁"], ["ㅣ", "이", "이", "🦷"],
  ];
  const WORDS = [
    ["코", "👃"], ["소", "🐮"], ["아기", "👶"], ["오이", "🥒"], ["우유", "🥛"], ["오리", "🦆"], ["여우", "🦊"], ["나비", "🦋"],
    ["모자", "🎩"], ["기차", "🚂"], ["사자", "🦁"], ["하마", "🦛"], ["바다", "🌊"], ["포도", "🍇"], ["피자", "🍕"], ["치마", "👗"],
    ["거미", "🕷️"], ["고기", "🍖"], ["가지", "🍆"], ["야구", "⚾"], ["피아노", "🎹"], ["라디오", "📻"], ["너구리", "🦝"], ["도토리", "🌰"],
  ];
  const SYLW = {}; // 글자 → 그 글자로 시작하는 낱말
  [["가지", "🍆"], ["나비", "🦋"], ["다리", "🦵"], ["라디오", "📻"], ["마스크", "😷"], ["바다", "🌊"], ["사자", "🦁"], ["아기", "👶"], ["자전거", "🚲"],
    ["차", "🚙"], ["카메라", "📷"], ["타조", "🐦"], ["파도", "🌊"], ["하마", "🦛"], ["고래", "🐳"], ["노래", "🎵"], ["도토리", "🌰"], ["로봇", "🤖"],
    ["모자", "🎩"], ["보물", "💎"], ["소", "🐮"], ["오리", "🦆"], ["조개", "🐚"], ["초", "🕯️"], ["코", "👃"], ["토끼", "🐰"], ["포도", "🍇"], ["호랑이", "🐯"]]
    .forEach((w) => (SYLW[w[0][0]] = SYLW[w[0][0]] || w));
  const COLORS = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#2fb466", "#e0564f", "#3a86ff", "#c77dff", "#ff7452"];

  /* ---------- 목차 만들기 ---------- */
  function buildBook() {
    const sec = [];
    sec.push({ id: "line", name: "선 긋기", icon: "〰️", items: LINES.map((l, i) => ({ id: "L" + i, kind: "line", label: l[1], name: l[0], color: COLORS[i % 14], strokes: l[3], from: l[1], to: l[2], guide: l[4] })) });
    sec.push({ id: "vow", name: "모음", items: V.map((v, i) => ({ id: "V" + v[0], kind: "jamo", label: v[0], ch: v[0], say: v[1], color: COLORS[i], strokes: ST[v[0]], word: [v[2], v[3]] })) });
    sec.push({ id: "cons", name: "자음", items: H.map((h, i) => ({ id: "C" + h[0], kind: "jamo", label: h[0], ch: h[0], say: h[1], color: COLORS[i], strokes: ST[h[0]], word: [h[2], h[3]] })) });
    const syl = [];
    ["ㅏ", "ㅗ"].forEach((v) =>
      H.forEach((h, i) => {
        const s = compose(h[0], v);
        syl.push({ id: "S" + s, kind: "jamo", label: s, ch: s, say: s, color: COLORS[i], strokes: sylStrokes(s), word: SYLW[s] || null, syl: true });
      })
    );
    sec.push({ id: "syl", name: "글자", items: syl });
    sec.push({ id: "word", name: "낱말", items: WORDS.map((w, i) => ({ id: "W" + w[0], kind: "word", label: w[0], ch: w[0], say: w[0], color: COLORS[i % 14], word: w, parts: [...w[0]] })) });
    return sec;
  }

  KP.notebook({
    id: "hwrite",
    icon: "📓",
    name: "한글 쓰기 공책",
    cat: "study",
    key: "hw:stars",
    paper: "han",
    book: buildBook,
    partStrokes: sylStrokes,
    partSmall: true,
    firstHint: "선 긋기부터 시작해 볼까요?",
  });
})();

;

/* ==== js/games/smart/listen.js ==== */
/* 소리 듣고 찾기 — 울음소리를 듣고 어떤 동물인지 골라요. 🔊 버튼으로 다시 듣기.
   1단계: 보기 3개(사는 곳이 모두 다른 동물) / 2단계: 3개(같은 곳 1마리 섞임) / 3단계: 4개(같은 곳에 사는 동물 2마리 섞임, 모자라면 다른 곳에서 채움)
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
    let target = U.pick(pool.filter((a) => a !== ctx.target));
    let others;
    const pickFrom = (list, k, avoid) => U.sample(list.filter((a) => a !== target && !avoid.includes(a)), k);
    if (lv === 1) {
      // 사는 곳이 모두 다른 3마리(정답 + 2) — 쉬운 보기 3개라 1단계도 열쇠 별을 받을 수 있음
      const habs = U.sample([...new Set(pool.map((a) => a[2]))].filter((h) => h !== target[2]), 2);
      others = habs.map((h) => U.pick(pool.filter((a) => a[2] === h)));
    } else if (lv === 2) {
      // 같은 곳 1마리 + 다른 곳 1마리 → 1단계보다 조금 헷갈림
      const same = pickFrom(pool.filter((a) => a[2] === target[2]), 1, []);
      others = same.concat(pickFrom(pool.filter((a) => a[2] !== target[2]), 2 - same.length, same));
    } else {
      // 같은 곳 2마리 + 1마리. 같은 곳 친구가 모자라면(바다 등) 다른 곳에서 채워 늘 보기 4개
      const same = pickFrom(pool.filter((a) => a[2] === target[2]), 2, []);
      others = same.concat(pickFrom(pool, 3 - same.length, same));
    }
    ctx.target = target;
    const list = U.shuffle([target, ...others]);
    ctx.grid.style.setProperty("--cl", list.length);
    ctx.grid.style.setProperty("--cp", list.length === 3 ? 1 : 2);
    ctx.grid.style.setProperty("--szl", ["", "", "clamp(80px,min(16vw,26vh),170px)", "clamp(80px,min(14vw,24vh),150px)", "clamp(70px,min(12vw,20vh),130px)"][list.length]);
    ctx.grid.style.setProperty("--szp", ["", "", "clamp(80px,min(34vw,17vh),150px)", "clamp(70px,min(30vw,11vh),130px)", "clamp(70px,min(28vw,14vh),130px)"][list.length]);
    const ask = "누구 소리일까요? 잘 들어 봐요!";
    const nat = (...l) => (KP.voice._natUrls && l.find((t) => KP.voice._natUrls(t))) || l[0]; // 같은 뜻 중 자연 음성(이미 있는 조각)이 있는 문장
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
      wrongMsg: (a) =>
        nat(
          "이건 " + U.josa(a[1], "이에요/예요") + ". " + U.josa(a[1], "은/는") + " " + a[3] + " 다시 들어 봐요!",
          "이건 " + a[1] + "! " + U.josa(a[1], "은/는") + " " + a[3] + " 다시 들어 봐요!",
          "이건 " + a[1] + "! " + a[3] + " 다시 들어 봐요!"
        ),
      onRight: async (a, b) => {
        b.classList.add("lsYay");
        b.appendChild(U.el("span", "lsBub", a[3].split("!")[0] + "!"));
        KP.smartAnimals.cry(a[4]);
        ctx.after(500, () => KP.voice.say(a[1] + "! " + a[3]));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1700);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 소리 박사!" : a[1] + "!", quiet: !big });
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

;

/* ==== js/games/smart/memory.js ==== */
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
      const ok = await ctx.win({ big, msg: big ? "{부름} 기억력 대장!" : "짝을 다 찾았어요!" });
      if (ok) self.next(ctx);
    };
  },
});

;

/* ==== js/games/smart/mix.js ==== */
/* =====================================================================
   🥣 색깔 섞기 — 점토 물감 작업실에 3D 인형 손님이 와서 색을 주문해요
   - 무대: 물감 실험실과 같은 점토 작업실 그림(KP.clayStage) + 아이가 칠한 3D 인형 손님(KP.dollActor)
   - 말풍선에 '견본 색 + 레시피 방울'(어떤 물감을 몇 번 짜는지) — 목표색은 진짜 물감 계산(KP.paint.mix)으로 만든 색
   - 튜브를 꾹 짜서 그릇(그림 속 팔레트 자리)에 넣고 주걱으로 저으면, 고르게 섞였을 때 인형이 색을 봄
     · 가까우면: 그 색이 인형에게 날아가 몸이 그 색으로 물듦 + 폴짝·하트 → 도감·내 물감에 저장
     · 멀면: "조금 더 노랗게?" 처럼 가장 가까워지는 물감을 알려 줌(KP.paint.advise, 색 주문 맞추기와 같은 계산)
     · 되돌릴 수 없으면 "비우고 다시" (그릇을 억지로 비우지 않음)
   - 단계: 1) 두 색 1:1 (빨·노·파 중 둘)  2) 양 조절·세 색 (2:1, 셋 다)  3) 하양으로 연하게·검정으로 진하게
   - 열쇠 별: 도움말(색이 달라요)을 2번 이상 들으면 그 판은 별 없음 (가벼운 실수 1번까지 봐줌 — ui.js win 규칙)
   - 3D 가 안 되거나 느리면 인형 그림(create2D)으로
===================================================================== */
"use strict";
KP.game({
  id: "mix",
  icon: "🥣",
  name: "색깔 섞기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      P = KP.paint;
    KP.css("mix", `
      .mxWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px}
      .mxRoom{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#c98b4e}
      .mxRoom .psMeter{display:none}
      .mxRoom .psBowlBox{position:absolute;left:0;top:0;z-index:4}
      .mxRoom .psJars{position:absolute;z-index:5;background:rgba(255,251,242,.6);border-radius:22px;padding:6px 8px 8px}
      .mxRoom .psJars.col{display:grid;grid-template-columns:repeat(2,auto);gap:4px 6px}
      .mxRoom .psJars.row{flex-wrap:nowrap;gap:4px}
      .mxRoom .psJar{width:clamp(64px,10vmin,92px);height:clamp(90px,14vmin,128px)}
      .mxRoom .psJars.row.tight{gap:1px;padding:6px 3px 8px}
      .mxRoom .psJars.row.wrap{display:grid;grid-template-columns:repeat(3,auto);justify-content:center;gap:4px 8px}
      .mxRoom .psJars.row.wrap .psJar{height:76px}
      .mxBub{position:absolute;left:0;top:0;z-index:6;display:flex;align-items:center;gap:.35em;background:#fffaf2;border-radius:26px;padding:.3em .5em .3em .35em;box-shadow:0 5px 0 rgba(120,80,40,.16);font-size:max(18px,min(30px,calc(var(--dh,300px)*.1)));color:var(--ink);cursor:pointer;will-change:transform}
      .mxBub:after{content:"";position:absolute;left:var(--tx,18%);bottom:-.4em;width:.8em;height:.8em;background:#fffaf2;transform:rotate(45deg);border-radius:0 0 .18em 0}
      .mxBub.in{animation:popIn .4s .5s backwards}
      .mxSw{width:2.3em;height:2.3em;border-radius:46% 54% 50% 50%/52% 46% 54% 48%;background:var(--t);box-shadow:inset -.2em -.25em 0 rgba(0,0,0,.14),inset .2em .2em 0 rgba(255,255,255,.3),0 0 0 .14em #fff;flex:0 0 auto}
      .mxRec{display:flex;flex-direction:column;align-items:flex-start;gap:.12em}
      .mxRec b{font-weight:400;font-size:.9em;line-height:1.1;white-space:nowrap}
      .mxDrops{display:flex;align-items:center;gap:.12em;font-size:.8em;color:var(--ink2)}
      .mxDrops i{width:.8em;height:1em;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -.12em -.14em 0 rgba(0,0,0,.14),0 0 0 .1em #fff}
      .mxDrops i.w{box-shadow:inset -.12em -.14em 0 rgba(0,0,0,.1),0 0 0 .1em #d9cfbf}
      .mxDrops .pl{margin:0 .08em}
      .mxB{position:absolute;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:clamp(64px,10vmin,88px);height:clamp(64px,10vmin,88px);border-radius:22px;background:rgba(255,251,242,.95);box-shadow:0 6px 0 rgba(110,70,30,.2);font-size:13px;color:var(--ink)}
      .mxB img{width:60%;height:50%;object-fit:contain}
      .mxB:active{transform:translateY(4px)}
      .mxFly{position:fixed;z-index:80;width:64px;height:64px;border-radius:50%;border:5px solid #fff;pointer-events:none;box-shadow:0 6px 14px rgba(0,0,0,.2);transition:transform .75s cubic-bezier(.5,-0.2,.5,1),opacity .75s}
      .mxLoad{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:22px;background:rgba(255,251,242,.9);border-radius:999px;padding:8px 18px;z-index:9}
    `);
    ctx.wrap = U.el("div", "mxWrap");
    ctx.room = U.el("div", "mxRoom");
    ctx.wrap.appendChild(ctx.room);
    ctx.body.appendChild(ctx.wrap);
    // 점토 물감 작업실 (실험실과 같은 그림) — 지평선·화각은 탁자 윗면에 인형이 서도록, 자르기(focus·zoom)는 layout 이 정함
    ctx.BG = { file: P.STAGE.file, img: P.STAGE.img, vh: 0.3, near: 0.24, fov: 34, focus: [0.5, 0.6], focusP: [0.5, 0.6], sun: [-0.6, 1, 0.7], sunCol: "#fff3df" };
    ctx.TILT = 0.74;
    const studio = (ctx.studio = P.studio({
      ctx,
      capacity: 30,
      dab: 0.13, // 방울이 적으니 덩어리를 조금 크게, 가운데 가까이 (젓기 쉽게)
      spread: 0.11,
      tilt: ctx.TILT,
      onPour: () => {
        ctx.dirty = true;
        ctx.poured = true;
        if (ctx.order && !ctx.order.stirTold) ctx.hint(() => studio.bowl.cv, "숟가락으로 빙글빙글 저어요!");
      },
      onStir: () => {},
    }));
    studio.bowlEl.addEventListener("pointerdown", () => ctx.order && (ctx.order.stirTold = true));
    ctx.bDrain = U.btn('<img alt="" draggable="false" src="' + P.ART + 'cloth.png"><span>비우기</span>', "mxB");
    ctx.bub = U.el("div", "mxBub");
    ctx.tap(ctx.bDrain, () => this.drain(ctx));
    ctx.bub.addEventListener("click", () => {
      U.replay(ctx.bub, "pop");
      if (ctx.order) KP.voice.say(this.nat("이런 색 물감 주세요! " + U.josa(ctx.order.name, "이에요/예요") + ".", "이런 색 물감 주세요! " + ctx.order.name + "!"));
      if (ctx.actor) ctx.actor.react("headTop");
    });
    ctx.round = 0;
    ctx.token = 0;
  },

  /* ---------- 단계별 주문 (물감 양 [빨,노,파,하,검] — 튜브 한 번 = 한 방울) ---------- */
  ORDERS: {
    1: [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [1, 0, 1, 0, 0]],
    2: [[2, 1, 0, 0, 0], [1, 2, 0, 0, 0], [0, 2, 1, 0, 0], [1, 1, 1, 0, 0]],
    3: [[1, 0, 0, 2, 0], [0, 0, 1, 2, 0], [1, 0, 1, 2, 0], [1, 1, 0, 3, 0], [0, 0, 0, 2, 1], [0, 0, 2, 0, 1], [0, 1, 1, 0, 1]],
  },
  JARS: { 1: [0, 1, 2], 2: [0, 1, 2], 3: [0, 1, 2, 3, 4] },
  /* 허용 거리 (Lab): 각 물감 양을 ±s 바꿨을 때의 평균 색 차이 → 단계별 범위로 자름 (colororder 와 같은 방식, 더 너그럽게) */
  TOL: { 1: [0.35, 12, 22], 2: [0.3, 10, 18], 3: [0.25, 9, 16] },
  tolFor(v, lv) {
    const P = KP.paint;
    const [s, lo, hi] = this.TOL[lv];
    const t = P.mix(v);
    let sum = 0,
      n = 0;
    v.forEach((x, i) => {
      if (!x) return;
      for (const k of [1 + s, 1 / (1 + s)]) {
        const w = v.slice();
        w[i] = x * k;
        sum += P.dist(P.mix(w), t);
        n++;
      }
    });
    return KP.u.clamp(sum / n, lo, hi);
  },
  MORE: ["빨갛게", "노랗게", "파랗게", "밝게", "어둡게"],

  /* ---------- 무대 · 인형 (병원 놀이와 같은 틀) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("mix:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => {
        if (!ctx._active || ctx.st !== st) return;
        this.start(ctx, true);
      },
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("mix:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    let st;
    try {
      st = CS.create(ctx.room, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.room, ctx.BG, opt);
    }
    ctx.st = st;
    st.ui.append(ctx.studio.bowlEl, ctx.studio.jarsEl, ctx.bDrain, ctx.bub);
    let busyLayout = false;
    st.onResize = () => {
      if (busyLayout) return;
      busyLayout = true;
      try {
        this.layout(ctx);
      } finally {
        busyLayout = false;
      }
    };
    this.layout(ctx);
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
  },

  /** 화면 배치: 그릇(그림 속 팔레트 자리)·튜브·비우기·손님 자리 — 그림 자르기(focus·zoom)를 그릇 자리에 맞춤 */
  layout(ctx) {
    const st = ctx.st,
      P = KP.paint,
      S = P.STAGE;
    if (!st || st.dead) return;
    const w = ctx.room.clientWidth,
      h = ctx.room.clientHeight;
    if (!w || !h) return;
    const T = ctx.TILT,
      land = w >= h * 1.05,
      jars = ctx.studio.jarsEl;
    jars.classList.toggle("col", land);
    jars.classList.toggle("row", !land);
    // 세로 폰에서 물감 5개(3단계): 한 줄에 64px 로 들어가면 간격만 좁히고(390px), 그래도 안 되면 두 줄(3+2, 360px) — 터치 64px 지키기
    const nJar = [...jars.children].filter((j) => j.style.display !== "none").length;
    const jarW = Math.min(92, Math.max(64, Math.min(innerWidth, innerHeight) * 0.1)); // CSS clamp(64px,10vmin,92px) 와 같게
    const fitRow = (gap, pad) => nJar * jarW + (nJar - 1) * gap + pad * 2 <= w - 6;
    jars.classList.toggle("tight", !land && !fitRow(4, 8) && fitRow(1, 3));
    jars.classList.toggle("wrap", !land && !fitRow(1, 3));
    const jw = jars.offsetWidth || 160,
      jh = jars.offsetHeight || 100;
    let D, cx, cy;
    if (land) {
      const left = jw + 16;
      D = Math.min((w - left) * 0.56, ((h - 20) / T) * 0.8, 580);
      cx = left + (w - left) * 0.4;
      cy = Math.min(h - 14 - (D * T) / 2, h * 0.6);
      jars.style.left = "10px";
      jars.style.top = Math.max(8, (h - jh) / 2) + "px";
      ctx.bDrain.style.left = "";
      ctx.bDrain.style.right = "12px";
      ctx.bDrain.style.top = "";
      ctx.bDrain.style.bottom = "12px";
    } else {
      D = Math.min(w * 0.86, ((h - jh - 24) / T) * (jars.classList.contains("wrap") ? 0.5 : 0.6), 560); // 물감 두 줄이면 그릇을 조금 작게(손님 인형이 가려지지 않게)
      cx = w / 2;
      cy = h - jh - 18 - (D * T) / 2;
      jars.style.left = Math.max(3, (w - jw) / 2) + "px";
      jars.style.top = h - jh - 8 + "px";
      ctx.bDrain.style.right = "";
      ctx.bDrain.style.left = "10px";
      ctx.bDrain.style.bottom = "";
      ctx.bDrain.style.top = "10px";
    }
    D = Math.max(160, Math.round(D));
    // 그림 자르기: 팔레트 폭 ≈ 그릇 지름, 팔레트 가운데 = 그릇 가운데
    const IW = S.img[0],
      IH = S.img[1];
    const k0 = Math.max(w / IW, h / IH);
    const zm = Math.max(1, Math.min(2.2, D / (S.pal[2] * IW * k0)));
    const fw = IW * k0 * zm,
      fh = IH * k0 * zm;
    const fu = (S.pal[0] * fw - cx + w / 2) / fw,
      fv = (S.pal[1] * fh - cy + h / 2) / fh;
    const B = ctx.BG;
    B.zoom = B.zoomP = zm;
    B.focus = B.focusP = [fu, fv];
    st.resize(true);
    // 실제 팔레트 자리(자르기 한계로 조금 어긋날 수 있음)에 그릇을 놓음
    const p = st.uvToPx(S.pal[0], S.pal[1]);
    const bx = U_clamp(p.x, D / 2 + 4, w - D / 2 - 4),
      by = U_clamp(p.y, (D * T) / 2 + 4, h - (D * T) / 2 - 4 - (land ? 0 : jh + 6)); // 세로: 물감 통 줄 위에(가리지 않게)
    ctx.studio.fit(D);
    const be = ctx.studio.bowlEl;
    be.style.transform = "translate(" + Math.round(bx - D / 2) + "px," + Math.round(by - (D * T) / 2) + "px)";
    ctx.bowlC = { x: bx, y: by, D };
    // 손님 자리: 가로 화면은 그릇 오른쪽 탁자, 세로 화면은 그릇 뒤
    const view = st.bc.view;
    let sx, sy;
    if (land) {
      sx = Math.min(w - 70, bx + D / 2 + (w - (bx + D / 2)) * 0.5);
      sy = by - D * T * 0.18;
    } else {
      sx = bx + D * 0.08;
      sy = by - D * T * 0.42;
    }
    const g = st.bc.ground((sx + view.ox) / view.fw, (sy + view.oy) / view.fh) || st.bc.ground(0.6, 0.62) || [0, -5];
    ctx.spot = g;
    ctx.guestFrac = land ? (h < 480 ? 0.42 : 0.36) : h > 900 ? 0.3 : 0.27;
    if (ctx.actor && !ctx.leaving) {
      ctx.actor.setH(st.fitH(g[0], g[1], ctx.guestFrac));
      if (ctx.actor.a.state === "idle" && !ctx.actor._jump) ctx.actor.place(g[0], g[1]);
    }
    function U_clamp(v, a, b) {
      return b < a ? (a + b) / 2 : Math.max(a, Math.min(b, v));
    }
  },
  pickDoll(ctx) {
    const U = KP.u,
      D = KP.DOLL;
    const list = ctx.dolls || [];
    if (list.length) {
      const c = list.length > 1 ? list.filter((x) => x.id !== ctx.lastDoll) : list;
      const it = U.pick(c);
      ctx.lastDoll = it.id;
      return { item: it };
    }
    const sp = U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },

  async start(ctx, again) {
    ctx.round = again ? ctx.round : 0;
    const tok = ++ctx.token;
    ctx.order = null;
    ctx.busy = true;
    ctx.room.querySelectorAll(".mxLoad").forEach((e) => e.remove());
    const wait = KP.u.el("div", "mxLoad", KP.E("🧸") + " 준비 중");
    const wt = ctx.after(400, () => ctx.room.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.studio.bowl.clear();
    let acc = 0,
      stirTold = 0;
    ctx.loop((dt, now) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      ctx.studio.tick(dt);
      if (ctx.track) ctx.track();
      acc += dt;
      if (acc < 0.25) return;
      acc = 0;
      const o = ctx.order,
        s = ctx.studio.state,
        vol = ctx.studio.bowl.volume();
      if (!o || ctx.busy) return;
      // 넣고 가만히 있으면 젓기 안내
      if (ctx.poured && vol > 0.6 && s.even < 0.72 && now - s.lastPourAt > 3200 && now - s.lastStirAt > 3200 && now - stirTold > 10000) {
        stirTold = now;
        KP.voice.say("숟가락으로 빙글빙글 저어요!");
      }
      this.check(ctx, now);
    });
    return this.next(ctx, !again);
  },
  stop(ctx) {
    ctx.token++;
    ctx.order = null;
    this.dropStage(ctx);
  },

  /** 같은 뜻 문장 중 자연 음성(이미 녹음된 조각)으로 말할 수 있는 첫 문장, 없으면 첫 문장 */
  nat(...l) {
    const N = KP.voice._natUrls;
    return (N && l.find((t) => N(t))) || l[0];
  },
  async next(ctx, first) {
    const U = KP.u,
      P = KP.paint,
      A = KP.audio,
      st = ctx.st;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    ctx.busy = true;
    ctx.order = null;
    ctx.track = null;
    ctx.bub.style.display = "none";
    // 주문: 지난번과 다른 색
    const list = this.ORDERS[lv];
    let v;
    do v = U.pick(list);
    while (list.length > 1 && ctx.lastV && v === ctx.lastV);
    ctx.lastV = v;
    const target = P.mix(v);
    const name = P.nameOf(target).n;
    // 튜브: 이 단계에서 쓰는 것만
    const jars = this.JARS[lv];
    [0, 1, 2, 3, 4].forEach((id) => (ctx.studio.jar(id).style.display = jars.includes(id) ? "" : "none"));
    ctx.studio.bowl.clear();
    ctx.studio.setEnabled(false);
    this.layout(ctx);

    /* 인형 손님 */
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    const pick = this.pickDoll(ctx);
    let act;
    try {
      act = st.gl ? await KP.dollActor.create(st, pick) : await KP.dollActor.create2D(st, pick);
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (!live()) return;
      act = await KP.dollActor.create2D(st, { species: "bear" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    ctx.leaving = false;
    const g = ctx.spot;
    act.setH(st.fitH(g[0], g[1], ctx.guestFrac));
    const offX = (side) => {
      const b = act.box(),
        hw = b.w / 2 + 20,
        px = st.project(g[0], 0, g[1]).x;
      return g[0] + st.pxToWorld(g[0], g[1], side > 0 ? st.w - px + hw : -px - hw);
    };
    act.place(g[0], g[1]);
    act.place(offX(1), g[1]);
    act.mood("normal");
    const enter = act.jumpTo(g[0], g[1], 0.8, 0.5);
    A.sfx("boing");

    /* 말풍선: 견본 색 + 레시피 방울 */
    const B = ctx.bub;
    const drops = v
      .map((x, i) => {
        if (!x) return "";
        let h = "";
        for (let k = 0; k < x; k++) h += '<i class="' + (i === 3 ? "w" : "") + '" style="--c:' + P.BASE[i].hex + '"></i>';
        return h;
      })
      .filter(Boolean)
      .join('<span class="pl">+</span>');
    B.innerHTML = '<span class="mxSw" style="--t:' + P.hex(target) + '"></span><span class="mxRec"><b>' + name + '</b><span class="mxDrops">' + drops + "</span></span>";
    B.style.display = "";
    U.replay(B, "in");
    ctx.track = () => {
      const bx = act.box(),
        hp = act.anchor("headTop");
      const dh = Math.max(80, bx.h);
      B.style.setProperty("--dh", Math.min(dh, 320) + "px");
      const bsz = U.sizeOf(B), // 매 장면 재지 않고 바뀔 때만
        bw = bsz.w,
        bh = bsz.h;
      // 머리 위 (자리가 없으면 옆) — 그릇과 겹치지 않게
      let x = hp.x - bw * 0.2,
        y = hp.y - bh - dh * 0.1;
      if (y < 6) {
        y = 6;
        x = bx.r + 8;
        if (x + bw > st.w - 6) x = bx.l - bw - 8;
      }
      x = U.clamp(x, 6, st.w - bw - 6);
      B.style.setProperty("--tx", U.clamp(hp.x - x - 8, 10, bw - 24) + "px");
      B.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
    };

    ctx.order = { v, target, name, hex: P.hex(target), tol: this.tolFor(v, lv), lv, advN: 0, asked: 0, stirTold: false };
    ctx.poured = false;
    ctx.dirty = false;
    const hello = first ? "안녕! 나는 " + U.josa(act.name, "이에요/예요") + ". " : "";
    // 음성: "다홍이에요." 처럼 녹음 없는 조합은 "다홍!"(이미 있는 조각)으로
    const req = "이런 색 물감 주세요! " + U.josa(name, "이에요/예요") + ".";
    const reqV = this.nat(req, "이런 색 물감 주세요! " + name + "!");
    const helloV = first ? this.nat(hello.trim(), "안녕! 나는 " + act.name + "!") + " " : "";
    const asked = ctx.say("🎨 " + hello + req, this.nat(helloV + reqV, helloV + req));
    // 첫 판: 두 동작(짜기→젓기)을 처음부터 알려 주기 — 이미 넣기 시작했으면 생략
    if (first && asked) asked.then(() => live() && ctx.order && !ctx.poured && KP.voice.say("물감 통을 눌러 그릇에 넣어요! 숟가락으로 빙글빙글 저어요!"));
    await Promise.race([enter, ctx.wait(1200)]);
    if (!live()) return;
    act.wave(1.4);
    ctx.busy = false;
    ctx.studio.setEnabled(true);
    const firstId = v.findIndex((x) => x > 0);
    ctx.hint(() => ctx.studio.jar(firstId), "물감 통을 눌러 그릇에 넣어요!");
    // 점검용
    ctx.mxState = () => ({ lv, v, name, hex: ctx.order && ctx.order.hex, tol: ctx.order && ctx.order.tol, busy: ctx.busy, gl: !!st.gl, painted: act.painted, even: ctx.studio.state.even, adv: ctx.order && ctx.order.advN });
  },

  /** 고르게 섞였으면 색 보기: 맞으면 성공, 아니면 도움말 (새로 넣은 뒤 한 번만) */
  check(ctx, now) {
    const P = KP.paint,
      U = KP.u,
      o = ctx.order,
      studio = ctx.studio,
      s = studio.state,
      bowl = studio.bowl;
    if (!ctx.dirty || s.pending > 0.01 || now - s.lastPourAt < 900 || s.even < 0.74) return;
    const tot = bowl.total();
    const vol = tot.reduce((a, b) => a + b, 0);
    if (vol < 0.5) return;
    const has = (i) => tot[i] >= 0.45;
    const need = o.v.map((x, i) => (x > 0 ? i : -1)).filter((i) => i >= 0);
    const missing = need.filter((i) => !has(i));
    const foreign = tot.some((x, i) => x >= 0.45 && !o.v[i]);
    const d = P.dist(P.mix(tot), o.target);
    if (d <= o.tol) return this.success(ctx);
    if (missing.length && !foreign) {
      // 아직 다 안 넣음 → 다음 물감 안내 (실수 아님)
      if (now - (o.askT || 0) < 6000) return;
      o.askT = now;
      ctx.dirty = false;
      KP.voice.say("좋아요! 하나 더 넣어 볼까요?");
      ctx.hint(() => studio.jar(missing[0]), "물감 통을 눌러 그릇에 넣어요!");
      return;
    }
    ctx.dirty = false;
    o.advN++;
    const act = ctx.actor;
    if (act) {
      act.react("headTop");
      act.mood("normal");
    }
    const best = P.advise(tot, o.v, o.target, o.tol, bowl.capacity);
    ctx.miss(null, null, { soft: true });
    if (best) {
      const p = P.BASE[best.id];
      const tip = U.josa(p.n, "을/를") + (best.lot ? " 많이 넣어 봐요!" : " 조금 더 넣어 봐요!");
      KP.voice.say("음, 조금 달라요. " + (best.lot ? "훨씬 더 " : "조금 더 ") + this.MORE[best.id] + " 해 볼까요? " + tip);
      ctx.hint(() => studio.jar(best.id), tip);
    } else {
      KP.voice.say("앗, 물감이 너무 많이 들어갔어요. 비우고 다시 해 볼까요?");
      ctx.hint(() => ctx.bDrain, "비우기를 누르고 다시 해 봐요!");
    }
  },

  async drain(ctx) {
    if (ctx.busy || !ctx.order) return;
    const studio = ctx.studio;
    if (studio.bowl.volume() < 0.05) return KP.voice.say("그릇이 벌써 비어 있어요!");
    ctx.busy = true;
    KP.voice.say("쏴아! 비웠어요. 다시 섞어 봐요.");
    await studio.drain();
    ctx.busy = false;
    ctx.dirty = false;
    ctx.poured = false;
    const o = ctx.order;
    if (o) ctx.hint(() => studio.jar(o.v.findIndex((x) => x > 0)), "물감 통을 눌러 그릇에 넣어요!");
  },

  async success(ctx) {
    const U = KP.u,
      P = KP.paint,
      A = KP.audio,
      FX = KP.pfx;
    const o = ctx.order,
      st = ctx.st,
      act = ctx.actor;
    const tok = ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && st && !st.dead;
    ctx.busy = true;
    ctx.dirty = false;
    ctx.hint(null);
    ctx.studio.setEnabled(false);
    const tot = ctx.studio.bowl.total();
    const made = ctx.studio.bowl.color(),
      hex = P.hex(made);
    // 그릇에서 손님에게 물감이 날아감
    const a = ctx.studio.bowl.cv.getBoundingClientRect(),
      r = ctx.room.getBoundingClientRect(),
      c = act.anchor("belly");
    const fly = U.el("div", "mxFly");
    fly.style.background = hex;
    fly.style.left = a.left + a.width / 2 - 32 + "px";
    fly.style.top = a.top + a.height / 2 - 32 + "px";
    document.body.appendChild(fly);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fly.style.transform = "translate(" + (r.left + c.x - a.left - a.width / 2) + "px," + (r.top + c.y - a.top - a.height / 2) + "px) scale(.5)";
        fly.style.opacity = ".2";
      })
    );
    setTimeout(() => fly.remove(), 800);
    A.sfx("whoosh");
    await ctx.wait(750);
    if (!live()) return;
    // 인형이 그 색으로 물듦 + 폴짝
    act.glow("belly", hex, 0.85, 1.25);
    act.mood("happy");
    act.happy();
    A.sfx("good");
    A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.14, inst: "marimba", vol: 0.2, when: 0.2 });
    const hp = act.anchor("headTop");
    if (FX) FX.hearts(st.ui, hp.x, hp.y, 6, ctx);
    ctx.bub.innerHTML = '<span class="mxSw" style="--t:' + hex + '"></span><span class="mxRec"><b>' + KP.E("💖") + "</b></span>";
    const isNew = P.discover(o.name);
    P.saveMine(hex, o.name, tot); // 만든 물감은 내 물감 통에도 (색칠 공방·그림 그리기 팔레트)
    const thx = U.pick(["와, 똑같아요! 고마워요!", "딱 이 색이에요! 고마워요!", "우와, 정말 예뻐요! 고마워요!"]);
    KP.voice.say(isNew ? this.nat(thx + " 도감에 " + U.josa(o.name, "이/가") + " 생겼어요!", thx + " " + o.name + "! 도감에 생겼어요!") : thx);
    ctx.after(900, () => live() && act.happy());
    ctx.score.add(1);
    ctx.round++;
    await ctx.wait(1500);
    if (!live()) return;
    const big = ctx.round % 4 === 0;
    const ok = await ctx.win({ msg: big ? "{부름} 색깔 마법사!" : o.name + " 완성!", big });
    if (!ok || !live()) return;
    // 손님은 인사하고 떠남 → 그릇 비우고 다음 손님
    ctx.leaving = true;
    ctx.bub.style.display = "none";
    act.wave(1.2);
    await ctx.wait(500);
    if (!live()) return;
    const g = ctx.spot,
      b = act.box(),
      px = st.project(g[0], 0, g[1]).x;
    const ox = g[0] + st.pxToWorld(g[0], g[1], -px - b.w / 2 - 20);
    A.sfx("whoosh");
    await Promise.race([act.jumpTo(ox, g[1], 0.9, 0.3), ctx.wait(1300)]);
    if (!live()) return;
    await ctx.studio.drain();
    if (!live()) return;
    this.next(ctx);
  },
});

;

/* ==== js/games/smart/more.js ==== */
/* 많은 쪽 찾기 — 접시 중 많은 쪽/적은 쪽을 골라요. 맞히면 접시 위 과일이 하나씩 폴짝 뛰며 함께 세어요.
   1단계: 접시 3개 — 확 많은 접시 1개 + 적은 접시 2개 중 "많은 쪽"
   2단계: 접시 3개 — 1~2개 차이. 한 접시만 다르고 나머지 두 접시는 같은 개수(그래서 '더 많은/더 적은' 접시가 하나뿐)
   3단계: 위 접시와 "같은 개수" 찾기(접시 3개) 또는 1개 차이 두 접시(최대 9개, 이 판은 열쇠 별 제외)
   (보기 3개 이상이 열쇠 별 규칙 — 2개뿐인 3단계 '1개 차이' 판은 ctx.choices 가 _fewChoice 로 표시) */
"use strict";
KP.game({
  id: "more",
  icon: "🍎",
  name: "많은 쪽 찾기",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("more", `
      .mrWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,26px);padding:4px 10px 20px}
      .mrRef{display:none;flex-direction:column;align-items:center;gap:4px}
      .mrRef.on{display:flex}
      .mrRef .mrPlate{--ps:var(--rs);cursor:default;box-shadow:0 6px 0 rgba(47,58,102,.12),0 0 0 6px #ffe7a3}
      .mrRow{--ps:var(--psl);display:flex;gap:clamp(12px,4vw,60px);justify-content:center;align-items:center}
      @media (max-aspect-ratio:1/1){.mrRow{--ps:var(--psp)}.mrRef .mrPlate{--ps:var(--rsp)}}
      .mrRow.three{flex-wrap:wrap;row-gap:clamp(14px,3vh,30px);max-width:100%}
      .mrPlate{position:relative;width:var(--ps);height:var(--ps);min-width:0;min-height:0;padding:0;border-radius:50%;
        background:radial-gradient(circle,#fff 0 58%,#eef2fb 60% 66%,#fff 68%);box-shadow:0 8px 0 rgba(47,58,102,.14)}
      .mrPlate.right{background:radial-gradient(circle,#efffef 0 58%,#c9f2d4 60% 66%,#efffef 68%)}
      .mrIt{position:absolute;width:var(--is);height:var(--is);margin:calc(var(--is) / -2) 0 0 calc(var(--is) / -2);font-size:var(--is);line-height:1}
      .mrIt .e{display:block;width:100%;height:100%}
      .mrIt.jump{animation:jumpA .45s}
      .mrCnt{position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);min-width:48px;height:48px;border-radius:24px;padding:0 10px;background:var(--coral);color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:popBig .35s}
    `);
    ctx.wrap = U.el("div", "mrWrap");
    ctx.ref = U.el("div", "mrRef");
    ctx.row = U.el("div", "mrRow");
    ctx.wrap.append(ctx.ref, ctx.row);
    ctx.body.appendChild(ctx.wrap);
    ctx.THINGS = [["🍎", "사과"], ["🍓", "딸기"], ["🍪", "쿠키"], ["🍊", "귤"], ["🍩", "도넛"], ["🍇", "포도"], ["🍒", "체리"], ["🧁", "컵케이크"], ["🍌", "바나나"], ["🍑", "복숭아"]];
    ctx.CNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 접시 안 그림 배치 (0~1 좌표) */
  layout(n) {
    const U = KP.u;
    const pts = [];
    const rot = U.randf(0, Math.PI * 2);
    if (n === 1) pts.push([0.5, 0.5]);
    else if (n <= 6) {
      const r = n <= 3 ? 0.2 : 0.25;
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * Math.PI * 2;
        pts.push([0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
      }
    } else {
      pts.push([0.5, 0.5]);
      for (let i = 0; i < n - 1; i++) {
        const a = rot + (i / (n - 1)) * Math.PI * 2;
        pts.push([0.5 + Math.cos(a) * 0.29, 0.5 + Math.sin(a) * 0.29]);
      }
    }
    return pts;
  },
  /** 접시 하나. 크기 착시가 없도록 한 판의 모든 접시는 같은 그림 크기(가장 많은 접시 기준) */
  plate(n, em, maxN) {
    const m = maxN || n;
    const is = m <= 3 ? 0.27 : m <= 6 ? 0.22 : 0.17;
    let h = "";
    this.layout(n).forEach(([x, y], i) => {
      h += '<span class="mrIt" style="left:' + (x * 100).toFixed(1) + "%;top:" + (y * 100).toFixed(1) + "%;--is:calc(var(--ps) * " + is + ')">' + KP.E(em) + "</span>";
    });
    return h;
  },
  /** 접시 위 그림을 하나씩 세기 */
  countUp(ctx, b, n) {
    const U = KP.u;
    [...b.querySelectorAll(".mrIt")].forEach((it, i) =>
      ctx.after(i * 260, () => {
        U.replay(it, "jump");
        KP.audio.note(KP.audio.SCALE[Math.min(i, 11)], { inst: "marimba", dur: 0.3, vol: 0.26 });
      })
    );
    ctx.after(n * 260 + 100, () => b.appendChild(U.el("span", "mrCnt", n)));
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    let [em, name] = U.pick(ctx.THINGS);
    const C = ctx.CNT;
    const same = lv === 3 && U.rand(2) === 0;
    ctx.ref.classList.toggle("on", same);
    const three = !same && lv < 3; // 1·2단계: 접시 3개 (위 접시 없음 → 조금 더 크게, 폰 세로는 2+1 줄)
    ctx.row.classList.toggle("three", three);
    ctx.wrap.style.setProperty("--psl", same ? "clamp(110px,min(22vw,32vh),220px)" : three ? "clamp(130px,min(27vw,46vh),300px)" : "clamp(150px,min(34vw,52vh),360px)");
    ctx.wrap.style.setProperty("--psp", same ? "clamp(96px,30vw,140px)" : three ? "clamp(120px,40vw,190px)" : "clamp(140px,44vw,200px)");
    ctx.wrap.style.setProperty("--rs", "clamp(110px,min(22vw,26vh),200px)");
    ctx.wrap.style.setProperty("--rsp", "clamp(110px,40vw,170px)");
    // 자연 음성 클립이 있으면 그 문장, 없으면 이름을 떼어 말하기 ("귤이 더 많은…" → "귤! 더 많은…")
    const nat = (a, b) => (KP.voice._natUrls && KP.voice._natUrls(a) ? a : b);
    let list, target, ask, spoken, wrongMsg, rightMsg;
    if (same) {
      const r = 1 + U.rand(5);
      const opts = new Set([r]);
      while (opts.size < 3) opts.add(U.clamp(r + U.pick([-2, -1, 1, 2]), 1, 6));
      list = U.shuffle([...opts]);
      target = r;
      ctx.ref.innerHTML = '<div class="mrPlate">' + this.plate(r, em, Math.max(...list)) + "</div>";
      ask = "위 접시랑 똑같은 개수를 찾아요!";
      wrongMsg = (n) => "이 접시는 " + C[n] + " 개예요. 위 접시를 세어 봐요!";
      rightMsg = (n) => "똑같이 " + C[n] + " 개! 딩동댕!";
    } else {
      let a, b;
      const many = lv === 1 || U.rand(2) === 0;
      if (lv === 1) {
        // 적은 접시 2개(1~3개, 서로 다름) + 확 많은 접시 1개
        const lows = U.sample([1, 2, 3], 2);
        b = Math.max(...lows) + 3 + U.rand(2);
        list = U.shuffle([...lows, b]);
        target = b;
      } else if (lv === 2) {
        a = 1 + U.rand(4);
        b = a + 1 + U.rand(2);
        // 정답 접시 하나만 다르고 나머지 두 접시는 같은 개수
        list = many ? U.shuffle([a, a, b]) : U.shuffle([a, b, b]);
        target = many ? b : a;
      } else {
        a = 3 + U.rand(6);
        b = a + 1;
        list = U.shuffle([a, b]);
        target = many ? b : a;
      }
      const word = many ? "많은" : "적은";
      ask = U.josa(name, "이/가") + " 더 " + word + " 접시를 찾아요!";
      spoken = nat(ask, name + "! 더 " + word + " 접시를 찾아요!");
      wrongMsg = (n) => "이 접시는 " + C[n] + " 개예요. 더 " + word + " 쪽을 찾아봐요!";
      // "이쪽이 더 적어요!"는 클립이 없어 적은 쪽은 "딩동댕!"으로
      rightMsg = (n) => name + " " + C[n] + " 개! " + (many ? "이쪽이 더 많아요!" : "딩동댕!");
    }
    ctx.say((same ? "🟰 " : "🍽️ ") + ask, spoken || true);
    const btns = ctx.choices(ctx.row, list, {
      cls: "mrPlate",
      render: (n) => this.plate(n, em, Math.max(...list)),
      right: (n) => n === target,
      wrongMsg,
      onRight: async (n, b) => {
        self.countUp(ctx, b, n);
        ctx.after(n * 260 + 200, () => KP.voice.say(rightMsg(n)));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(n * 260 + 1600);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 세기 대장!" : "딩동댕!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), spoken || ask);
  },
});

;

/* ==== js/games/smart/n100.js ==== */
/* 100까지 숫자 — 위쪽 버튼: [100판] [10씩 세기] [퀴즈] [쓰기]
   - 100판: 1~100 판에서 수를 누르면 크게 보여 주고 "이십삼! 스물셋!" + 십 막대·낱개 블록으로 크기를 보여 줌
   - 10씩 세기: 10, 20, … 100 을 차례로 누르면 십 막대가 하나씩 쌓이며 "십! 이십!…" (고유어도 함께)
   - 퀴즈(단계별 범위 1단계 1~10 / 2단계 1~20 / 3단계 1~50, 몇십 찾기는 10~100) — 만 3~4세에 맞게 작은 수부터
       수 듣고 찾기 · 블록 보고 몇인지 · 다음 수는?(2단계~) · 몇십 찾기(3단계)
   - 10씩 세기 완성은 큰 축하만 하고 열쇠 별·단계에는 넣지 않음(반짝이는 단추만 눌러도 끝나므로)
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
      .n1Mode{font-size:clamp(16px,2.2vw,23px);background:#fff;color:var(--night);border-radius:20px;padding:6px 16px;min-height:64px;display:flex;align-items:center;gap:6px;border:4px solid #fff;box-shadow:0 5px 0 rgba(27,37,80,.18)}
      .n1Mode .e{font-size:1.3em}
      .n1Mode.sel{background:var(--night);border-color:var(--night);color:#fff}
      @media (max-width:560px){.n1Modes{gap:5px;padding:8px 4px 4px;flex-wrap:nowrap}.n1Mode{font-size:14px;padding:3px 9px;min-height:64px;white-space:nowrap}.n1Mode .e{display:none}}
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
      .n1T{font-size:clamp(24px,3.4vw,40px);border-radius:18px;background:#fff;color:var(--c);min-height:clamp(64px,8vw,84px);box-shadow:0 5px 0 color-mix(in srgb,var(--c) 45%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff)}
      .n1T.done{background:var(--c);color:#fff}
      .n1T.next{border-color:var(--star);position:relative;animation:none}
      /* 다음 칸 반짝: 빛을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (glowLoop, app.css) — 매번 다시 칠하면 저가 태블릿이 버벅임. inset:-3px = 테두리 두께. 예전 glow 의 brightness(1.12)가 빛까지 밝혔으므로 빛 색을 미리 12% 밝게(197,49→221,55) */
      .n1T.next::after{content:"";position:absolute;inset:-3px;border-radius:inherit;pointer-events:none;opacity:0;background:rgba(255,255,255,.1);
        box-shadow:0 0 0 10px rgba(255,221,55,.85),0 0 30px 10px rgba(255,221,55,.6);animation:glowLoop 1.2s ease-in-out infinite}
      /* 퀴즈 */
      .n1Q{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(12px,3vh,28px);padding:4px 12px 18px}
      .n1Ask{font-size:clamp(60px,min(10vw,15vh),120px);line-height:1;background:#fff;border-radius:30px;padding:10px 30px;box-shadow:var(--shadow);color:var(--ocean);display:flex;align-items:center;gap:14px;cursor:pointer}
      .n1Ask.yay{animation:jumpA .5s 2}
      .n1Ask .n1Blocks{min-height:0}
      .n1Q .choice{font-size:clamp(40px,6.4vw,74px);min-width:clamp(96px,14vw,150px);color:var(--ocean)}
      @media (orientation:portrait) and (max-width:480px){
        .n1Modes{flex-wrap:wrap;gap:6px;padding:6px 4px 4px}
        .n1Mode{font-size:16px;padding:4px 12px;min-height:64px;flex:1 1 auto;justify-content:center;border-width:3px}
        .n1Learn{padding:2px 4px 8px;gap:8px}
        .n1Chart{gap:2px}
        .n1N{font-size:calc(var(--cw) / 21);border-radius:5px}
        .n1Learn{align-items:flex-start;justify-content:flex-start}
        .n1Panel{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center;justify-items:center}
        .n1Big{grid-row:1 / 4;font-size:64px;padding:6px 14px;border-radius:20px;min-width:0}
        .n1Panel .n1Say{font-size:20px}
        .n1Blocks{min-height:0;gap:3px}
        .n1Ten i{height:5px;width:9px}
        .n1One{width:12px;height:12px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .n1Body{flex-direction:row}
        .n1Body .n1Modes{flex-direction:column;flex-wrap:nowrap;justify-content:center;gap:6px;padding:4px 2px 4px 6px;width:108px}
        .n1Body .n1Mode{font-size:16px;padding:4px 6px;min-height:64px;justify-content:center;border-width:3px;border-radius:16px}
        .n1Body .n1Mode .e{display:none}
        .n1Learn{padding:4px 8px 4px 4px;gap:10px}
        .n1Chart{gap:2px;aspect-ratio:auto;width:var(--cw);height:var(--ch)}
        .n1N{font-size:calc(var(--ch) / 17);border-radius:4px}
        .n1Panel{gap:6px}
        .n1Big{font-size:clamp(56px,20vh,90px);padding:4px 18px;border-radius:22px}
        .n1Blocks{min-height:0}
      }
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
    ctx.body.classList.add("n1Body");
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
    ctx._resetFew(); // 모드를 바꾸면 새 판 — 앞 모드의 '보기 적은 판' 표시를 지움
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
    const phoneP = port && matchMedia("(max-width:480px)").matches;
    const phoneL = !port && matchMedia("(max-height:500px)").matches;
    const cw = port ? Math.min(v.width - (phoneP ? 8 : 24), v.height * 0.62) : Math.min(v.height - (phoneL ? 8 : 20), v.width * (phoneL ? 0.58 : 0.6));
    if (phoneL) {
      const ch = Math.floor(v.height - 8);
      ctx.chart.style.setProperty("--ch", ch + "px");
      ctx.chart.style.setProperty("--cw", Math.max(220, Math.floor(Math.min(v.width - 250, ch * 1.5))) + "px");
      return;
    }
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
      KP.voice.say("다음은 " + U.numSino((ctx.tDone + 1) * 10) + "!"); // "다음은 사십!" (자연 음성 조각)
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
        const talk = KP.voice.say("십이 열 개면 백! 백까지 다 셌어요!");
        ctx.score.add();
        // 반짝이는 다음 단추만 차례로 눌러도 끝나는 놀이 → 열쇠 별·단계·스티커 없이 축하만 (noLevel)
        // ctx.win 을 거쳐야 시간이 끝난 '마지막 판'도 여기서 바로 마무리됨
        await Promise.race([talk, ctx.wait(3500)]);
        if (tk !== ctx.tok || !ctx._active) return;
        const ok = await ctx.win({ noLevel: true, big: true, msg: "백까지 성공!", sticker: false });
        if (ok && ctx._active && ctx.m === "tens" && tk === ctx.tok) this.mode(ctx, "tens", true);
      });
    }
  },
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const max = lv === 1 ? 10 : lv === 2 ? 20 : 50;
    const types = lv === 1 ? ["hear", "hear", "blocks"] : lv === 2 ? ["hear", "blocks", "next"] : ["hear", "blocks", "next", "tens", "before"];
    let t = U.pick(types);
    if (t === ctx.lastT && types.length > 2) t = U.pick(types.filter((x) => x !== t));
    ctx.lastT = t;
    let n = 1 + U.rand(max);
    if (t === "tens") n = 10 * (1 + U.rand(10)); // 몇십은 100까지
    if (t === "next") n = Math.min(n, max - 1);
    if (t === "before") n = Math.max(n, 2);
    const answer = t === "next" ? n + 1 : t === "before" ? n - 1 : n;
    // 헷갈리기 쉬운 보기: 십의 자리·일의 자리를 바꾼 수, ±1, ±10
    const cand = new Set();
    const swap = Number(String(answer).split("").reverse().join(""));
    // 다음/앞의 수 문제에서는 화면에 보이는 수(n)는 보기에서 뺌
    const lim = t === "tens" ? 100 : max; // 보기도 그 단계 범위 안에서만
    const ok = (x) => x >= 1 && x <= lim && x !== answer && !((t === "next" || t === "before") && x === n);
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
      // "이건 삼! 사를 찾아요! 넷!" — 이미 있는 조각을 이어 자연 음성으로
      wrongMsg: (v) => "이건 " + U.numSino(v) + "! " + speak,
      onRight: async (v, b) => {
        U.replay(ask, "yay");
        U.replay(b, "jump");
        KP.audio.sfx("good");
        KP.voice.say(U.numSino(answer) + "! " + (answer < 100 ? U.numNative(answer) + "!" : ""));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1300);
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "{부름} 숫자 박사!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "quiz" && tk === ctx.tok) this.quiz(ctx);
      },
    });
    ctx.hint(() => btns.find((x) => x.dataset.right), speak);
  },
});

;

/* ==== js/games/smart/numbers.js ==== */
/* 숫자 배우기 — 위쪽 버튼으로 [배우기]/[퀴즈] 전환. (1단계는 배우기로, 2단계부터 퀴즈로 시작)
   배우기: 1~10 카드를 누르면 큰 숫자가 나오고, 숫자만큼 그림이 하나씩 튀어나오며 "하나, 둘, 셋…" 함께 세기.
           큰 숫자의 점선을 손가락으로 따라 써 볼 수 있어요.
   퀴즈 1단계: "셋을 찾아요!" 1~5 중 3개 / 2단계: 1~10 중 4개
   퀴즈 3단계: 큰 숫자만큼 사과를 바구니에 담고 ✔ 누르기 (빼기도 가능)
   [쓰기 공책]·[100까지]는 다른 놀이로 가는 버튼 → 한 번 누르면 반짝이며 "한 번 더!", 3초 안에 한 번 더 눌러야 이동
   (글 못 읽는 아이가 아무거나 누르다 갑자기 다른 놀이로 튕기지 않게) */
"use strict";
KP.game({
  id: "numbers",
  icon: "💯",
  name: "숫자 배우기",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("numbers", `
      .nbModes{display:flex;gap:10px;justify-content:center;padding:8px 10px 6px;flex:0 0 auto;flex-wrap:wrap}
      @media (max-width:560px){.nbModes{gap:5px;padding:8px 4px 4px;flex-wrap:nowrap}.nbMode{font-size:14px !important;padding:3px 9px !important;min-height:64px !important;white-space:nowrap}.nbMode .e{display:none}}
      .nbMode{font-size:clamp(18px,2.4vw,24px);background:rgba(255,255,255,.7);border-radius:999px;padding:8px 22px;min-height:64px;display:flex;align-items:center;gap:8px;border-bottom:5px solid transparent}
      .nbMode .e{font-size:1.4em}
      .nbMode.sel{background:#fff;border-bottom-color:var(--cat);color:var(--cat);box-shadow:var(--shadow)}
      @media (orientation:portrait) and (max-width:480px){.nbModes{flex-wrap:wrap;gap:6px;padding:6px 4px 4px}.nbMode{font-size:16px !important;padding:4px 12px !important;min-height:64px !important;flex:1 1 auto;justify-content:center}}
      .nbMode.glow{animation:glow 1s ease-in-out 3}
      .nbMode.go{opacity:.78}
      .nbMode.go .e{opacity:.8}
      .nbMode.arm{background:#fff;color:var(--cat);box-shadow:0 0 0 4px var(--cat),var(--shadow);opacity:1;animation:nbArm .5s ease-in-out infinite alternate}
      @keyframes nbArm{to{transform:scale(1.07)}}
      .nbView{flex:1;min-height:0;display:none;flex-direction:column}
      .nbView.on{display:flex}
      .nbShow{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,40px);padding:4px 12px}
      @media (max-aspect-ratio:1/1){.nbShow{flex-direction:column}}
      .nbBig{position:relative;flex:0 0 auto;width:var(--nb);height:var(--nb);background:#fff;border-radius:30px;box-shadow:var(--shadow)}
      .nbBig svg,.nbBig canvas{position:absolute;inset:0;width:100%;height:100%}
      .nbBig canvas{touch-action:none}
      .nbBig text{font-family:var(--font);font-size:92px;text-anchor:middle;dominant-baseline:central;fill:#fff3d6;stroke:#ffb020;stroke-width:3;stroke-dasharray:7 6;stroke-linecap:round}
      .nbBig.two text{font-size:72px}
      .nbPen{position:absolute;right:8px;bottom:6px;font-size:clamp(14px,1.8vw,18px);color:var(--ink2);display:flex;align-items:center;gap:4px;pointer-events:none}
      .nbBig.pop{animation:popIn .35s}
      .nbObjs{flex:1 1 auto;min-width:0;max-width:560px;min-height:clamp(90px,16vh,200px);display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:clamp(4px,1vw,10px)}
      .nbObj{position:relative;font-size:var(--os);line-height:1;animation:nbPop .45s cubic-bezier(.2,1.6,.4,1)}
      @keyframes nbPop{from{transform:scale(0) translateY(40px)}}
      .nbObj b{position:absolute;right:-6px;top:-8px;font-size:18px;min-width:26px;height:26px;border-radius:13px;background:var(--coral);color:#fff;font-weight:400;display:flex;align-items:center;justify-content:center}
      .nbCards{flex:0 0 auto;display:grid;grid-template-columns:repeat(10,1fr);gap:clamp(6px,1vw,10px);padding:6px 12px 16px}
      @media (max-aspect-ratio:1/1){.nbCards{grid-template-columns:repeat(5,1fr);gap:5px;padding:6px 8px 14px}}
      .nbCard{font-size:clamp(34px,4.6vw,52px);color:#fff;border-radius:22px;min-height:clamp(72px,9vw,96px);background:var(--c);box-shadow:0 6px 0 color-mix(in srgb,var(--c) 65%,#000);animation:itemIn .35s backwards;animation-delay:calc(var(--i)*40ms);text-shadow:0 2px 0 rgba(0,0,0,.15)}
      .nbCard:active,.nbCard.on{transform:translateY(4px);box-shadow:0 2px 0 color-mix(in srgb,var(--c) 65%,#000)}
      .nbCard.seen::after{content:"";position:absolute;top:6px;right:8px;width:10px;height:10px;border-radius:50%;background:#fff}
      .nbCard{position:relative}
      .nbQ{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,24px);padding:4px 12px 18px}
      .nbQ .qAns{padding:0}
      .nbQ .choice{font-size:clamp(52px,8vw,90px);min-width:clamp(96px,14vw,150px);min-height:clamp(96px,14vw,150px)}
      .nbMake{display:flex;align-items:center;gap:clamp(12px,3vw,40px)}
      @media (max-aspect-ratio:1/1){.nbMake{flex-direction:column;gap:62px}}
      .nbTarget{font-size:clamp(80px,12vw,140px);line-height:1;color:var(--ocean);background:#fff;border-radius:30px;padding:6px 30px;box-shadow:var(--shadow)}
      .nbBasket{position:relative;width:clamp(260px,40vw,460px);min-height:clamp(120px,20vh,190px);background:#f7d9a8;border-radius:16px 16px 60px 60px;
        border:6px solid #d79b4f;box-shadow:inset 0 -10px 0 rgba(0,0,0,.08);display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;gap:2px;padding:10px 10px 16px}
      .nbBasket::before{content:"";position:absolute;left:12%;right:12%;top:-50px;height:60px;border:7px solid #d79b4f;border-bottom:none;border-radius:120px 120px 0 0}
      .nbBasket .nbA{font-size:clamp(40px,5.4vw,58px);line-height:1;padding:2px;animation:nbPop .35s}
      .nbBasket .nbA b{display:none}
      .nbTools{display:flex;gap:clamp(14px,3vw,30px);align-items:center}
      .nbAdd,.nbOk{font-size:clamp(46px,6vw,64px);border-radius:28px;padding:10px 22px;min-width:110px;min-height:96px;display:flex;align-items:center;justify-content:center;gap:4px;background:#fff;box-shadow:0 7px 0 rgba(47,58,102,.14)}
      .nbAdd span{font-size:.7em;color:var(--grass)}
      .nbOk{background:var(--grass);box-shadow:0 7px 0 #1f8a4c}
      .nbAdd:active,.nbOk:active{transform:translateY(5px)}
      .nbChk{display:block;width:.42em;height:.8em;border:solid #fff;border-width:0 .16em .16em 0;border-radius:4px;transform:rotate(45deg) translate(-.06em,-.08em)}
    `);
    ctx.THINGS = [["🍎", "사과"], ["🐥", "병아리"], ["⭐", "별"], ["🍓", "딸기"], ["🚗", "자동차"], ["🐟", "물고기"], ["🎈", "풍선"], ["🌼", "꽃"], ["🍪", "쿠키"], ["🦋", "나비"]];
    ctx.CC = ["#ff5b6e", "#ff9f1c", "#f5b800", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452"];
    // 모드 버튼
    const modes = U.el("div", "nbModes");
    ctx.bLearn = U.btn(KP.E("📖") + "배우기", "nbMode");
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "nbMode");
    ctx.bWrite = U.btn(KP.E("📝") + "쓰기 공책", "nbMode go");
    ctx.b100 = U.btn(KP.E("🧮") + "100까지", "nbMode go");
    modes.append(ctx.bLearn, ctx.bQuiz, ctx.bWrite, ctx.b100);
    // 다른 놀이로 가는 버튼: 두 번 눌러야 이동 (첫 번째는 반짝 + "쓰기 공책! 한 번 더!")
    let armed = null,
      armT = null;
    const disarm = () => {
      if (armed) armed.classList.remove("arm");
      armed = null;
      if (armT) ctx.cancel(armT);
      armT = null;
    };
    ctx.disarm = disarm;
    const twice = (b, say, go) =>
      ctx.tap(b, () => {
        if (armed === b) {
          disarm();
          KP.audio.sfx("open");
          return go();
        }
        disarm();
        armed = b;
        b.classList.add("arm");
        KP.audio.sfx("tap");
        KP.voice.say(say);
        armT = ctx.after(3000, disarm);
      });
    twice(ctx.bWrite, "쓰기 공책! 한 번 더!", () => {
      if (ctx.lastN != null) KP.nbWant = { id: "nwrite", ch: String(ctx.lastN) };
      KP.open("nwrite");
    });
    twice(ctx.b100, "1부터 100까지! 한 번 더!", () => KP.open("n100"));
    ctx.tap(ctx.bLearn, () => this.mode(ctx, "learn"));
    ctx.tap(ctx.bQuiz, () => this.mode(ctx, "quiz"));
    // 배우기 화면
    ctx.vLearn = U.el("div", "nbView");
    ctx.show = U.el("div", "nbShow");
    ctx.big = U.el("div", "nbBig");
    ctx.objs = U.el("div", "nbObjs");
    ctx.show.append(ctx.big, ctx.objs);
    ctx.cards = U.el("div", "nbCards");
    ctx.vLearn.append(ctx.show, ctx.cards);
    ctx.cardEls = [];
    for (let n = 1; n <= 10; n++) {
      const c = U.btn(String(n), "nbCard");
      c.style.setProperty("--c", ctx.CC[n - 1]);
      c.style.setProperty("--i", n);
      ctx.tap(c, () => this.learn(ctx, n));
      ctx.cards.appendChild(c);
      ctx.cardEls.push(c);
    }
    // 퀴즈 화면
    ctx.vQuiz = U.el("div", "nbView");
    ctx.q = U.el("div", "nbQ");
    ctx.vQuiz.appendChild(ctx.q);
    ctx.body.append(modes, ctx.vLearn, ctx.vQuiz);
    // 따라 쓰기 캔버스
    this.setupTrace(ctx);
  },
  setupTrace(ctx) {
    const U = KP.u;
    const cv = (ctx.cv = document.createElement("canvas"));
    const g = (ctx.g = cv.getContext("2d"));
    let last = null,
      pid = null; // 쓰고 있는 손가락 (다른 손가락·손바닥은 무시)
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      KP.audio.unlock();
      if (last) return;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      pid = e.pointerId;
      last = pos(e);
      ctx.hue = (ctx.hue || 0) + 40;
    });
    cv.addEventListener("pointermove", (e) => {
      if (!last || e.pointerId !== pid) return;
      const p = pos(e);
      g.strokeStyle = "hsl(" + ctx.hue + ",85%,55%)";
      g.lineWidth = cv.width * 0.06;
      g.lineCap = g.lineJoin = "round";
      g.beginPath();
      g.moveTo(last.x, last.y);
      g.lineTo(p.x, p.y);
      g.stroke();
      if (U.dist(last.x, last.y, p.x, p.y) > 2 && Math.random() < 0.25) KP.audio.sfx("rub");
      last = p;
    });
    const end = (e) => {
      if (e.pointerId === pid) last = null;
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
  },
  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set();
    ctx.suggested = false;
    this.mode(ctx, ctx.level === 1 ? "learn" : "quiz", true);
  },
  mode(ctx, m, first) {
    ctx._resetFew(); // 모드를 바꾸면 새 판 — 앞 모드의 '보기 적은 판' 표시를 지움
    if (ctx.disarm) ctx.disarm();
    ctx.m = m;
    ctx.token = (ctx.token || 0) + 1; // 세던 중이면 멈추기
    ctx.bLearn.classList.toggle("sel", m === "learn");
    ctx.bQuiz.classList.toggle("sel", m === "quiz");
    ctx.vLearn.classList.toggle("on", m === "learn");
    ctx.vQuiz.classList.toggle("on", m === "quiz");
    if (!first) KP.audio.sfx("select");
    ctx.hint(null);
    if (m === "learn") {
      ctx.say("🔢 숫자를 눌러 봐요! 같이 세어 봐요!");
      ctx.big.innerHTML = "";
      ctx.objs.innerHTML = "";
      ctx.cardEls.forEach((c) => c.classList.toggle("seen", ctx.seen.has(+c.textContent)));
      ctx.hint(() => ctx.cardEls.find((c) => !ctx.seen.has(+c.textContent)), "숫자를 눌러 봐요!");
    } else this.quiz(ctx);
  },
  /* ---------------- 배우기 ---------------- */
  learn(ctx, n) {
    if (ctx.disarm) ctx.disarm();
    ctx.lastN = n;
    const U = KP.u,
      A = KP.audio;
    ctx.token = (ctx.token || 0) + 1;
    const tk = ctx.token;
    ctx.cardEls.forEach((c, i) => c.classList.toggle("on", i === n - 1));
    ctx.seen.add(n);
    ctx.cardEls[n - 1].classList.add("seen");
    const portrait = innerHeight > innerWidth;
    const nb = portrait ? Math.min(innerWidth * 0.5, innerHeight * 0.24) : Math.min(innerWidth * 0.26, innerHeight * 0.44);
    ctx.big.style.setProperty("--nb", Math.round(nb) + "px");
    ctx.big.className = "nbBig" + (n === 10 ? " two" : "");
    ctx.big.innerHTML = '<svg viewBox="0 0 120 120"><text x="60" y="64">' + n + "</text></svg>";
    ctx.big.appendChild(ctx.cv);
    ctx.big.appendChild(U.el("span", "nbPen", KP.E("✏️") + "따라 써요"));
    ctx.cv.width = ctx.cv.height = Math.round(nb * Math.min(devicePixelRatio || 1, 2));
    U.replay(ctx.big, "pop");
    A.note(A.SCALE[n - 1], { inst: "bell", dur: 0.5, vol: 0.3 });
    KP.voice.say("숫자 " + n + "!");
    // 사물 하나씩
    const [em, name] = ctx.THINGS[(n - 1) % ctx.THINGS.length];
    ctx.objs.innerHTML = "";
    const os = portrait ? (n <= 4 ? 70 : n <= 6 ? 58 : 52) : n <= 5 ? 84 : 66;
    ctx.objs.style.setProperty("--os", os + "px");
    for (let i = 1; i <= n; i++) {
      ctx.after(700 + i * 620, () => {
        if (ctx.token !== tk) return;
        const o = U.el("span", "nbObj", KP.E(em) + "<b>" + i + "</b>");
        ctx.objs.appendChild(o);
        A.note(A.SCALE[i - 1], { inst: "marimba", dur: 0.35, vol: 0.28 });
        KP.voice.say(U.NAT[i]);
      });
    }
    ctx.after(700 + n * 620 + 700, () => {
      if (ctx.token !== tk) return;
      KP.voice.say(name + " " + U.NAT[n] + "! 숫자 " + n + "!");
      ctx.objs.querySelectorAll(".nbObj").forEach((o, i) => ctx.after(i * 60, () => U.replay(o, "jump")));
      if (ctx.seen.size >= 5 && !ctx.suggested) {
        ctx.suggested = true;
        // 숫자 5개를 다 봤으면 퀴즈로 자연스럽게 이어 가기 (그사이 다른 카드를 누르면 배우기 계속)
        ctx.after(2200, async () => {
          if (ctx.m !== "learn" || ctx.token !== tk) return;
          U.replay(ctx.bQuiz, "glow");
          await Promise.race([KP.voice.say("우와, 숫자 박사! 퀴즈도 해 볼까요?"), ctx.wait(3500)]);
          await ctx.wait(700);
          if (ctx._active && ctx.m === "learn" && ctx.token === tk) this.mode(ctx, "quiz");
        });
      }
    });
    ctx.hint(() => ctx.cardEls.find((c) => !ctx.seen.has(+c.textContent)) || null, "다른 숫자도 눌러 봐요!");
  },
  /* ---------------- 퀴즈 ---------------- */
  quiz(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const self = this;
    ctx.q.innerHTML = "";
    if (lv < 3) {
      const hi = lv === 1 ? 5 : 10;
      const nC = lv === 1 ? 3 : 4;
      let t = 1 + U.rand(hi);
      if (t === ctx.lastT) t = (t % hi) + 1;
      ctx.lastT = t;
      const opts = new Set([t]);
      while (opts.size < nC) opts.add(1 + U.rand(hi));
      const ask = U.josa(U.NAT[t], "을/를") + " 찾아요!";
      ctx.say("🔢 " + ask);
      const box = U.el("div", "qAns");
      ctx.q.appendChild(box);
      const btns = ctx.choices(box, U.shuffle([...opts]), {
        cls: "num",
        render: (v) => String(v),
        right: (v) => v === t,
        wrongMsg: (v) => "이건 " + U.NAT[v] + "! " + ask, // "이건 둘! 셋을 찾아요!" — 모두 자연 음성 조각
        onRight: async (v, b) => {
          U.replay(b, "jump");
          A.sfx("good");
          KP.voice.say(U.NAT[v] + "! 숫자 " + v + "!");
          await this.done(ctx, "숫자 " + v + "!");
        },
      });
      ctx.hint(() => btns.find((b) => b.dataset.right), ask);
      return;
    }
    // 3단계: 숫자만큼 담기 (관형사: 한/두/세/네 개)
    const CNT = ["하나도 없는", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
    let t = 3 + U.rand(7);
    if (t === ctx.lastT) t = t === 9 ? 4 : t + 1;
    ctx.lastT = t;
    const [em, name] = U.pick(ctx.THINGS.slice(0, 4));
    const ask = U.josa(name, "을/를") + " " + CNT[t] + " 개 담아요! 다 담으면 초록 ✅ 버튼을 눌러요!";
    ctx.say("🧺 " + ask);
    const wrap = U.el("div", "nbMake");
    const tg = U.el("div", "nbTarget", String(t));
    const basket = U.el("div", "nbBasket");
    wrap.append(tg, basket);
    const tools = U.el("div", "nbTools");
    const add = U.btn(KP.E(em) + "<span>+</span>", "nbAdd");
    const ok = U.btn('<span class="nbChk"></span>', "nbOk");
    tools.append(add, ok);
    ctx.q.append(wrap, tools);
    let cnt = 0,
      busy = false;
    const mark = () => {
      if (cnt < t) add.dataset.right = "1";
      else delete add.dataset.right;
      if (cnt === t) ok.dataset.right = "1";
      else delete ok.dataset.right;
    };
    const say = () => KP.voice.say(U.NAT[cnt] || "영");
    ctx.fast(add, () => {
      if (busy) return;
      if (cnt >= 10) return ctx.miss(add, "바구니가 꽉 찼어요!");
      cnt++;
      const a = U.el("button", "nbA", KP.E(em));
      ctx.fast(a, () => {
        if (busy) return;
        a.remove();
        cnt--;
        A.sfx("slide");
        say();
        mark();
        hint();
      });
      basket.appendChild(a);
      U.replay(add, "pop");
      A.note(A.SCALE[cnt - 1], { inst: "marimba", dur: 0.3, vol: 0.28 });
      say();
      mark();
      hint();
    });
    ctx.fast(ok, async () => {
      if (busy) return;
      if (cnt === t) {
        busy = true;
        basket.querySelectorAll(".nbA").forEach((x, i) => ctx.after(i * 90, () => U.replay(x, "jump")));
        U.replay(tg, "jump");
        KP.voice.say(name + " " + CNT[t] + " 개! 딩동댕!");
        await this.done(ctx, CNT[t] + " 개 담았어요!");
      } else if (cnt === 0) ctx.miss(ok, "아직 하나도 없어요. " + U.josa(name, "을/를") + " 담아 봐요!");
      else if (cnt < t) ctx.miss(ok, "지금 " + CNT[cnt] + " 개예요. " + (t - cnt === 1 ? "하나 더" : "더") + " 담아요!");
      else ctx.miss(ok, "지금 " + CNT[cnt] + " 개예요. 너무 많아요! 바구니에서 눌러서 빼요!");
    });
    const hint = () => ctx.hint(() => (cnt < t ? add : cnt === t ? ok : basket.lastElementChild), cnt < t ? "더 담아요!" : cnt === t ? "초록 버튼을 눌러요!" : "하나 빼요!");
    mark();
    hint();
  },
  async done(ctx, msg) {
    ctx.score.add();
    ctx.round++;
    await ctx.wait(1000);
    const big = ctx.round % 5 === 0;
    const ok = await ctx.win({ big, msg: big ? "{부름} 숫자 박사!" : msg, quiet: !big });
    if (ok && ctx.m === "quiz") this.quiz(ctx);
  },
});

;

/* ==== js/games/smart/nwrite.js ==== */
/* 숫자 쓰기 공책 — 0~9 획순 따라 쓰기, 그다음 몇십(10~100) · 11~19 · 21~99(접어 둠)
   획순(초등 수학 쓰기 일반): 위에서 시작, 0은 위에서 시계 반대 방향, 4는 2획(ㄴ자 → 세로),
   5는 2획(세로·배 → 윗줄), 그 밖에는 한 번에. 두 자리 수는 한 칸에 두 숫자를 나란히. */
"use strict";
(function () {
  const arc = (cx, cy, rx, ry, a0, a1) => {
    const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 8));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  };
  const P = (...segs) => {
    const out = [];
    segs.forEach((s) =>
      s.forEach((p) => {
        const l = out[out.length - 1];
        if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 0.6) out.push(p);
      })
    );
    return out;
  };
  const D = {
    0: [arc(50, 50, 24, 36, -90, -450)],
    1: [[[50, 14], [50, 86]]],
    2: [P(arc(50, 34, 22, 20, -160, 20), [[70.7, 40.8], [28, 86], [74, 86]])],
    3: [P(arc(48, 32, 21, 18, -150, 90), arc(48, 68, 23, 18, -90, 150))],
    4: [[[58, 14], [24, 62], [80, 62]], [[60, 14], [60, 86]]],
    5: [P([[34, 14], [35.9, 46.1]], arc(50, 63, 22, 22, -130, 140)), [[34, 14], [72, 14]]],
    6: [P([[66, 15], [52, 26], [40, 40], [32, 56]], arc(50, 66, 20, 20, 180, -180))],
    7: [[[24, 14], [76, 14], [42, 86]]],
    8: [P(arc(50, 32, 15, 18, -40, -270), arc(50, 68, 19, 18, -90, 270), arc(50, 32, 15, 18, 90, -40))],
    9: [P(arc(50, 34, 19, 20, 0, -360), [[69, 34], [66, 86]])],
  };
  const map = (strokes, [x0, y0, x1, y1]) =>
    strokes.map((s) => {
      const sx = (x1 - x0) / 100,
        sy = (y1 - y0) / 100;
      return s.map(([x, y]) => [x0 + x * sx, y0 + y * sy]);
    });
  /** 수 → 한 칸 획 (두 자리는 반씩, 100은 세 칸으로) */
  function numStrokes(n) {
    const s = String(n);
    if (s.length === 1) return D[s];
    if (s.length === 2) return map(D[s[0]], [0, 4, 54, 96]).concat(map(D[s[1]], [46, 4, 100, 96]));
    return map(D[s[0]], [0, 10, 38, 90]).concat(map(D[s[1]], [31, 10, 69, 90]), map(D[s[2]], [62, 10, 100, 90]));
  }
  const G = {};
  for (let i = 0; i <= 9; i++) G[i] = D[i];
  KP.GLYPHS = Object.assign(KP.GLYPHS || {}, { num: G, numFull: numStrokes });

  const THINGS = ["🍎", "🐥", "⭐", "🍓", "🚗", "🐟", "🎈", "🌼", "🍪", "🦋"];
  const COLORS = ["#ff5b6e", "#ff9f1c", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452"];
  function book() {
    const U = KP.u;
    const one = [];
    for (let n = 0; n <= 9; n++)
      one.push({ id: "D" + n, kind: "jamo", label: String(n), ch: String(n), say: n ? U.numNative(n) : "영", color: COLORS[n], strokes: D[n], word: n ? [U.numNative(n) + " · " + U.numSino(n), THINGS[n]] : ["영 · 하나도 없어요", "🧺"] });
    const two = (n) => ({ id: "N" + n, kind: "jamo", label: String(n), ch: String(n), say: U.numSino(n), color: COLORS[Math.floor(n / 10) % 10], strokes: numStrokes(n), syl: true, word: [U.numSino(n) + (n < 100 ? " · " + U.numNative(n) : ""), "🔢"] });
    // 두 자리 수는 양이 많아(91개) 나눔: 몇십(10·20…100) → 11~19 → 나머지(접어 둠). 저장 키(N+수)는 예전과 같음
    const tens = [],
      teen = [],
      rest = [];
    for (let n = 10; n <= 100; n++) (n % 10 === 0 ? tens : n < 20 ? teen : rest).push(two(n));
    return [
      { id: "digit", name: "숫자 0~9", items: one },
      { id: "tens", name: "몇십 10~100", items: tens },
      { id: "teen", name: "11~19", items: teen },
      { id: "big", name: "21~99", items: rest, fold: true },
    ];
  }
  KP.notebook({
    id: "nwrite",
    icon: "📝",
    name: "숫자 쓰기 공책",
    cat: "study",
    key: "nw:stars",
    paper: "num",
    book,
    firstHint: "숫자 0부터 써 볼까요?",
  });
})();

;

/* ==== js/games/smart/odd.js ==== */
/* 다른 그림 찾기 — 똑같은 그림들 사이에서 하나만 다른 걸 찾아요.
   1단계: 4개, 확 다른 것(강아지 속 고양이)
   2단계: 6개, 비슷한 것(빨간 사과 속 초록 사과)
   3단계: 9개, 혼자 반대쪽을 보거나 거꾸로 있거나 아주 비슷한 것 */
"use strict";
KP.game({
  id: "odd",
  icon: "🔍",
  name: "다른 그림 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("odd", `
      .oddGrid{--sz:var(--szl);flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--cl),auto);justify-content:center;align-content:center;gap:clamp(10px,2vw,22px);padding:8px 12px 20px}
      @media (max-aspect-ratio:1/1){.oddGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .oddBtn{font-size:var(--sz);border-radius:28px;padding:clamp(8px,1.2vw,14px)}
      .oddBtn .e{transition:transform .2s}
      .oddFlip .e{transform:scaleX(-1)}
      .oddTurn .e{transform:rotate(180deg)}
      .oddBtn.right{animation:oddWin .6s 2}
      @keyframes oddWin{30%{transform:translateY(-20px) scale(1.12)}60%{transform:none}}
      .oddLook{animation:wig .5s}
      .oddMag{position:absolute;font-size:.55em;right:-10px;bottom:-10px;animation:popIn .3s}
    `);
    ctx.grid = U.el("div", "oddGrid");
    ctx.body.appendChild(ctx.grid);
    // 1단계: 서로 확 다른 것들
    ctx.EASY = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐸", "개구리"], ["🐻", "곰"], ["🐵", "원숭이"], ["🐷", "돼지"],
      ["🍎", "사과"], ["🍌", "바나나"], ["🚗", "자동차"], ["⭐", "별"], ["🎈", "풍선"], ["🐟", "물고기"], ["🌻", "해바라기"], ["🦋", "나비"],
    ];
    // 2단계: 비슷한 짝 [같은 것, 다른 것, 같은 것 이름, 다른 것 이름]
    ctx.SIMILAR = [
      ["🍎", "🍏", "빨간 사과", "초록 사과"], ["🚗", "🚙", "빨간 자동차", "파란 자동차"], ["🐟", "🐠", "파란 물고기", "노란 물고기"],
      ["🌻", "🌼", "해바라기", "작은 꽃"], ["🍊", "🍋", "귤", "레몬"], ["🐻", "🐼", "곰", "판다"], ["🐯", "🦁", "호랑이", "사자"],
      ["💛", "🧡", "노란 하트", "주황 하트"], ["⚽", "🏀", "축구공", "농구공"], ["📘", "📗", "파란 책", "초록 책"], ["🐶", "🐺", "강아지", "늑대"],
      ["🐮", "🐷", "소", "돼지"], ["🍓", "🍒", "딸기", "체리"], ["🐔", "🐤", "닭", "병아리"],
    ];
    // 3단계: 방향이 보이는 그림 (좌우 반전·뒤집기)
    ctx.SIDE = [
      ["🐕", "강아지"], ["🦆", "오리"], ["🐌", "달팽이"], ["🦒", "기린"], ["🚒", "소방차"], ["🐘", "코끼리"], ["🐢", "거북이"],
      ["🐿️", "다람쥐"], ["🦖", "공룡"], ["🚂", "기차"], ["🚜", "트랙터"], ["🐊", "악어"], ["🦜", "앵무새"], ["🐬", "돌고래"], ["🍌", "바나나"], ["🚗", "자동차"],
    ];
    ctx.SUBTLE = [["🐤", "🐥", "병아리", "앞을 보는 병아리"], ["🌷", "🌸", "튤립", "벚꽃"], ["🐟", "🐡", "물고기", "복어"], ["🚗", "🚓", "자동차", "경찰차"], ["🍩", "🍪", "도넛", "쿠키"]];
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
    const n = [4, 6, 9][lv - 1];
    let same, odd, sameName, oddName, mode = "pic",
      why;
    if (lv === 1) {
      const [a, b] = U.sample(ctx.EASY, 2);
      [same, sameName, odd, oddName] = [a[0], a[1], b[0], b[1]];
      why = U.josa(oddName, "이/가") + " 숨어 있었어요!";
    } else if (lv === 2) {
      const p = U.pick(ctx.SIMILAR);
      [same, odd, sameName, oddName] = U.rand(2) ? p : [p[1], p[0], p[3], p[2]];
      why = U.josa(oddName, "이/가") + " 숨어 있었어요!";
    } else {
      const r = U.rand(3);
      if (r < 2) {
        const p = U.pick(ctx.SIDE);
        same = odd = p[0];
        sameName = oddName = p[1];
        mode = r === 0 ? "flip" : "turn";
        why = mode === "flip" ? U.josa(oddName, "이/가") + " 혼자 반대쪽을 봐요!" : U.josa(oddName, "이/가") + " 혼자 거꾸로예요!";
      } else {
        const p = U.pick(ctx.SUBTLE);
        [same, odd, sameName, oddName] = p;
        why = U.josa(oddName, "이/가") + " 숨어 있었어요!";
      }
    }
    const list = [];
    for (let i = 0; i < n - 1; i++) list.push({ odd: false });
    list.push({ odd: true });
    U.shuffle(list);
    const cols = { 4: [4, 2], 6: [3, 2], 9: [3, 3] }[n];
    ctx.grid.style.setProperty("--cl", cols[0]);
    ctx.grid.style.setProperty("--cp", cols[1]);
    ctx.grid.style.setProperty("--szl", { 4: "clamp(80px,min(14vw,30vh),170px)", 6: "clamp(70px,min(13vw,22vh),150px)", 9: "clamp(60px,min(11vw,15vh),110px)" }[n]);
    ctx.grid.style.setProperty("--szp", { 4: "clamp(80px,34vw,160px)", 6: "clamp(70px,min(32vw,16vh),140px)", 9: "clamp(60px,min(22vw,14vh),110px)" }[n]);
    const ask = "하나만 달라요! 다른 걸 찾아요!";
    const nat = (...l) => (KP.voice._natUrls && l.find((t) => KP.voice._natUrls(t))) || l[0]; // 같은 뜻 중 자연 음성(이미 있는 조각)이 있는 문장
    ctx.say("🔍 " + ask);
    const btns = ctx.choices(ctx.grid, list, {
      cls: "oddBtn",
      render: (v) => KP.E(v.odd ? odd : same),
      right: (v) => v.odd,
      wrongMsg: () => nat("이건 똑같은 " + U.josa(sameName, "이에요/예요") + ". 다른 걸 찾아봐요!", "이건 똑같은 " + sameName + "! 다른 걸 찾아봐요!", "이건 똑같아요. 다른 걸 찾아봐요!"),
      onRight: async (v, b) => {
        b.appendChild(U.el("span", "oddMag", KP.E("🔍")));
        btns.forEach((x, i) => x !== b && ctx.after(i * 50, () => U.replay(x, "oddLook")));
        KP.audio.sfx("sparkle");
        KP.voice.say(nat("찾았다! " + why, "찾았다! " + oddName + "!", "찾았다!"));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1300);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 눈이 반짝!" : "찾았다!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    if (mode !== "pic") btns.find((b) => b.dataset.right).classList.add(mode === "flip" ? "oddFlip" : "oddTurn");
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});

;

/* ==== js/games/smart/seasons.js ==== */
/* 사계절 나무 — 점토 정원 언덕의 흙 자리에서 씨앗이 나무가 되고, 봄 → 여름 → 가을 → 겨울 → 다시 봄 (계절 변화와 순환)
   - 배경: 같은 구도의 점토 정원 4장(계절별). 계절이 바뀌면 두 장을 부드럽게 겹쳐 바꿈(지금·다음 두 장만)
   - 나무: 코드로 그린 점토 나무(둥근 수관 덩어리·굵은 줄기·점토 결) — 계절 색(봄 분홍 꽃·여름 짙은 초록·가을 주황 빨강+열매·겨울 앙상한 가지+눈)
     배경과 같은 쪽 빛·그림자. 계절이 바뀌면 나무도 두 장을 겹쳐 바꿈. 화면 크기에 맞춰 다시 그림(바뀔 때만 — 저사양 기기)
   - 아이가 칠한 3D 인형 1마리가 나무 옆에서 함께(작은 도움 동작): 씨앗 심기(고개 숙여 톡톡)·물뿌리개 들기·비 오면 만세·
     열매 바구니 들기·눈사람 토닥토닥. 칠한 인형이 없으면 기본 인형. 3D 가 안 되면 그림 인형(같은 동작 일부)
   1단계: 씨앗 심기·물·해님 → 나무. 계절마다 행동 하나 (봄 꽃봉오리 콕콕 / 여름 구름 눌러 소나기 / 가을 사과 따서 바구니 / 겨울 눈사람)
          한 바퀴(사계절)는 단계가 올라가도 끝까지 이어서 함. 단계 계산은 '한 바퀴 = 한 판'(겨울 큰 축하만 셈) —
          봄·여름·가을 축하는 그대로 하되 연승에 넣지 않음(예전엔 3계절 연승으로 첫 바퀴 만에 2단계가 되어 반복 체험이 없었음)
   2단계: 지금 계절을 보고 '다음은 어떤 계절?' (보기 4개 — 점토 정원 작은 그림)
   3단계: 계절 물건(벚꽃·수박·밤·장갑…)을 끌어서 알맞은 계절 나무에 넣기 (나무 4그루, 물건 그림은 점토 느낌으로 바꿔 그림)
   공용: _shared/clay-stage.js(무대) · doll-actor.js(인형) · doll-follow.js(손에 든 물건) · play-feedback.js(반짝임)
   - 날씨 옷 입히기(dress)와 달리 옷이 아니라 '자연이 바뀌는 모습' 중심. 한국 사계절 기준 */
"use strict";
(function () {
  /* =================================================================
     점토 그리기 도구 (이 놀이 안에서만)
  ================================================================= */
  const hex = (c) => {
    c = c.replace("#", "");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return toHex(A.map((v, i) => v + (B[i] - v) * t));
  };
  const lit = (c, t) => mix(c, "#fffaf0", t);
  const drk = (c, t, d) => mix(c, d || "#2a1606", t);
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let noiseCv = null;
  /** 점토 결 (아주 약한 밝고 어두운 점) — 그린 것 위에만 */
  function grain(g, w, h, k = 1) {
    if (!noiseCv) {
      noiseCv = document.createElement("canvas");
      noiseCv.width = noiseCv.height = 96;
      const ng = noiseCv.getContext("2d"), im = ng.createImageData(96, 96), r = rng(31);
      for (let i = 0; i < 96 * 96; i++) {
        const v = r(), on = v > 0.5;
        im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = on ? 255 : 30;
        im.data[i * 4 + 3] = Math.round(Math.abs(v - 0.5) * 2 * 20);
      }
      ng.putImageData(im, 0, 0);
    }
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.globalAlpha = k;
    g.fillStyle = g.createPattern(noiseCv, "repeat");
    g.fillRect(0, 0, w, h);
    g.restore();
  }
  /** 손으로 빚은 듯 살짝 울퉁불퉁한 타원 경로 */
  function lumpPath(g, x, y, rx, ry, seed = 1, rot = 0) {
    const r = rng(Math.abs(Math.floor(seed * 1000)) + 7), N = 9, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.07;
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      pts.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = pts[i % N], q = pts[(i + 1) % N], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      if (i === 0) g.moveTo(m[0], m[1]);
      else g.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    g.closePath();
  }
  /** 점토 덩어리: 그림자(뒤에 닿는) + 빛 쪽 밝게·반대쪽 어둡게 + 작은 윤기. L = 빛이 오는 쪽 [x,y] (화면, 위가 -) */
  function blob(g, x, y, rx, ry, col, L, o = {}) {
    const rot = o.rot || 0, seed = o.seed == null ? x * 13 + y * 7 : o.seed;
    const sc = g.getTransform().a; // 그림자 크기는 변환을 따르지 않음 → 직접 곱함
    g.save();
    if (o.shadow !== false) {
      g.shadowColor = o.sc || "rgba(55,32,12,.3)";
      g.shadowBlur = Math.max(rx, ry) * (o.sb || 0.35) * sc;
      g.shadowOffsetX = -L[0] * rx * 0.14 * sc;
      g.shadowOffsetY = -L[1] * ry * 0.16 * sc;
    }
    g.fillStyle = col;
    lumpPath(g, x, y, rx, ry, seed, rot);
    g.fill();
    g.restore();
    const R = Math.max(rx, ry);
    const gr = g.createRadialGradient(x + L[0] * rx * 0.42, y + L[1] * ry * 0.46, R * 0.04, x, y, R * 1.2);
    gr.addColorStop(0, lit(col, o.hiK || 0.34));
    gr.addColorStop(0.5, col);
    gr.addColorStop(1, drk(col, o.dkK || 0.34, o.dk));
    g.fillStyle = gr;
    lumpPath(g, x, y, rx, ry, seed, rot);
    g.fill();
    if (o.gloss !== false) {
      const hx = x + L[0] * rx * 0.46, hy = y + L[1] * ry * 0.5, hr = R * 0.36;
      const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
      hg.addColorStop(0, "rgba(255,255,255," + (o.gl || 0.3) + ")");
      hg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = hg;
      g.beginPath();
      g.ellipse(hx, hy, hr, hr * 0.7, -0.6, 0, 6.283);
      g.fill();
    }
  }
  /** 흐린 타원 (그림자) — 캔버스 filter 가 없는 기기(옛 Safari)에서도 같은 모양: 둥근 그러데이션 */
  function softEllipse(g, x, y, rx, ry, col, a) {
    g.save();
    g.translate(x, y);
    g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, "rgba(" + col + "," + a + ")");
    gr.addColorStop(0.55, "rgba(" + col + "," + a * 0.7 + ")");
    gr.addColorStop(1, "rgba(" + col + ",0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, rx, 0, 6.283);
    g.fill();
    g.restore();
  }
  /** 점토 막대(가지·줄기·손잡이): 점을 따라 동그라미를 찍어 굵기가 점점 변하게 — 아래 그림자·가운데·빛 쪽 줄 3겹 */
  function rod(g, pts, r0, r1, col, L, o = {}) {
    const seg = [];
    let tot = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d);
      tot += d;
    }
    const at = (s) => {
      let i = 0;
      while (i < seg.length - 1 && s > seg[i]) s -= seg[i++];
      const t = seg[i] ? Math.min(1, s / seg[i]) : 0, a = pts[i], b = pts[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
    const step = Math.max(0.002, Math.min(r0, r1) * 0.35);
    const n = Math.max(2, Math.ceil(tot / step));
    const layer = (c, kr, ox, oy, alpha) => {
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = c;
      g.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * tot, p = at(s), r = (r0 + (r1 - r0) * (i / n)) * kr;
        g.moveTo(p[0] + ox * r + r, p[1] + oy * r);
        g.arc(p[0] + ox * r, p[1] + oy * r, r, 0, 6.283);
      }
      g.fill();
      g.restore();
    };
    if (o.shadow !== false) layer(o.sc || "rgba(55,32,12,.22)", 1.15, -L[0] * 0.35, -L[1] * 0.4, 1);
    layer(drk(col, 0.3, o.dk), 1, -L[0] * 0.12, -L[1] * 0.14, 1);
    layer(col, 0.84, L[0] * 0.06, L[1] * 0.06, 1);
    layer(lit(col, 0.38), 0.4, L[0] * 0.55, L[1] * 0.55, 0.75);
  }

  /* ---------- 나무 ---------- */
  // 단위: 나무 키 = 1, 밑동 (0,0), 위쪽은 -y
  const CANOPY = [
    // [x, y, r] — 위(뒤)부터 그리면 아래(앞) 덩어리가 겹쳐 보임
    [0, -0.9, 0.14], [-0.14, -0.84, 0.15], [0.13, -0.85, 0.15],
    [-0.25, -0.7, 0.15], [0.25, -0.71, 0.15], [-0.08, -0.69, 0.18], [0.1, -0.7, 0.18],
    [-0.28, -0.55, 0.14], [0.28, -0.56, 0.14], [-0.15, -0.51, 0.15], [0.14, -0.52, 0.15], [0, -0.55, 0.16],
  ];
  // 꽃·봉오리·사과 자리 (수관 앞면)
  const DECO = [[-0.25, -0.57], [0.01, -0.86], [0.25, -0.6], [-0.12, -0.72], [0.14, -0.73]];
  const DECO2 = [[-0.31, -0.7], [0.31, -0.72], [-0.02, -0.62], [-0.18, -0.88], [0.18, -0.9], [0.08, -0.52], [-0.08, -0.52]];
  const PAL = [
    ["#9ad673", "#86c962", "#b1e18b"], // 봄: 연두 (꽃이 피면 분홍이 섞임)
    ["#3f9a43", "#32863a", "#4caa4e"], // 여름: 짙은 초록
    ["#f08c2e", "#e0582c", "#f6b53a"], // 가을: 주황·빨강·노랑
    null, // 겨울: 잎 없음
  ];
  const PINK = ["#ffc2d6", "#ffadc8", "#ffd4e2"];
  const PINKI = [0, 1, 4, 6, 7, 10]; // 꽃 핀 덩어리 (좌우 고르게)
  const BARK = "#8b5a33";
  /** 가지 뼈대 (늘 같은 모양 — 계절이 바뀌어도 같은 나무) */
  function skeleton() {
    const r = rng(11), out = [];
    const grow = (x, y, a, len, w, d) => {
      const bend = (r() - 0.5) * 0.5;
      const mx = x + Math.sin(a + bend * 0.5) * len * 0.5, my = y - Math.cos(a + bend * 0.5) * len * 0.5;
      const ex = x + Math.sin(a + bend) * len, ey = y - Math.cos(a + bend) * len;
      out.push({ pts: [[x, y], [mx, my], [ex, ey]], w0: w, w1: w * 0.62, d });
      if (d >= 3) return;
      const n = d === 0 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const sp = n === 3 ? [-0.62, 0.05, 0.6][i] : i ? 0.42 : -0.42;
        grow(ex, ey, a + bend + sp + (r() - 0.5) * 0.2, len * (0.68 + r() * 0.1), w * 0.62, d + 1);
      }
    };
    grow(0, -0.42, -0.08, 0.26, 0.046, 0);
    return out;
  }
  const SKEL = skeleton();
  /** 나무 한 장 그리기: g 는 (0,0)=밑동, 단위 1=키 로 맞춘 상태. k 계절, v 'act'(장식 없음) | 'full'(꽃·사과 그려 넣음), thumb(작은 그림: 눈사람까지) */
  function drawTree(g, k, v, L, cw, ch, thumb) {
    const S = g.getTransform().a; // 1 단위 = S px
    // 땅 그림자 (빛 반대쪽으로 길게)
    softEllipse(g, -L[0] * 0.09, 0.006, 0.34, 0.06, k === 3 ? "80,100,140" : "50,28,10", k === 3 ? 0.3 : 0.38);
    // 줄기 (뿌리 쪽이 넓게)
    const trunk = () => {
      g.save();
      const tg = g.createLinearGradient(-0.07, 0, 0.07, 0);
      tg.addColorStop(L[0] < 0 ? 0 : 1, lit(BARK, 0.22));
      tg.addColorStop(0.5, BARK);
      tg.addColorStop(L[0] < 0 ? 1 : 0, drk(BARK, 0.38));
      g.shadowColor = "rgba(50,28,10,.3)";
      g.shadowBlur = S * 0.02;
      g.shadowOffsetX = -L[0] * S * 0.01;
      g.fillStyle = tg;
      g.beginPath();
      g.moveTo(-0.12, 0.012);
      g.quadraticCurveTo(-0.062, -0.03, -0.06, -0.14);
      g.quadraticCurveTo(-0.05, -0.3, -0.046, -0.44);
      g.lineTo(0.046, -0.44);
      g.quadraticCurveTo(0.052, -0.3, 0.062, -0.14);
      g.quadraticCurveTo(0.066, -0.03, 0.125, 0.012);
      g.quadraticCurveTo(0, 0.04, -0.12, 0.012);
      g.fill();
      g.restore();
      // 나무껍질 홈
      g.save();
      g.strokeStyle = drk(BARK, 0.45);
      g.globalAlpha = 0.35;
      g.lineCap = "round";
      g.lineWidth = 0.009;
      [[-0.026, -0.04, -0.018, -0.3], [0.022, -0.07, 0.026, -0.36], [-0.002, -0.18, 0.006, -0.4]].forEach((p) => {
        g.beginPath();
        g.moveTo(p[0], p[1]);
        g.quadraticCurveTo(p[0] - 0.008, (p[1] + p[3]) / 2, p[2], p[3]);
        g.stroke();
      });
      g.restore();
    };
    trunk();
    // 가지
    const winter = k === 3;
    for (const b of SKEL) {
      if (!winter && b.d > 1) continue;
      rod(g, b.pts, b.w0, b.w1, BARK, L, { shadow: b.d < 2 });
    }
    if (winter) {
      // 가지 위 눈: 위쪽에 하얀 덩어리
      const r = rng(5);
      for (const b of SKEL) {
        if (b.d > 2) continue;
        const p0 = b.pts[0], p2 = b.pts[2];
        const ang = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);
        if (Math.abs(Math.abs(ang) - Math.PI / 2) < 0.35) continue; // 거의 서 있는 가지에는 눈이 덜 쌓임
        const pts = [];
        for (let i = 1; i <= 4; i++) {
          const t = i / 5, x = p0[0] + (p2[0] - p0[0]) * t, y = p0[1] + (p2[1] - p0[1]) * t;
          const w = b.w0 + (b.w1 - b.w0) * t;
          pts.push([x, y - w * 0.85 - r() * w * 0.2]);
        }
        rod(g, pts, b.w0 * 0.8, b.w1 * 0.75, "#f6f9ff", L, { dk: "#7f97bd", sc: "rgba(80,100,140,.12)" });
      }
      // 밑동의 눈 더미
      const so = { dk: "#8aa1c4", sc: "rgba(70,90,130,.25)", gl: 0.4 };
      blob(g, -0.1, -0.012, 0.1, 0.062, "#f6f9ff", L, Object.assign({ seed: 3 }, so));
      blob(g, 0.11, -0.008, 0.09, 0.056, "#f6f9ff", L, Object.assign({ seed: 4 }, so));
      blob(g, 0.0, 0.01, 0.13, 0.05, "#ffffff", L, Object.assign({ seed: 5 }, so));
    } else {
      const pal = PAL[k];
      CANOPY.forEach((c, i) => {
        let col = pal[i % 3];
        if (k === 0 && v === "full" && PINKI.includes(i)) col = PINK[i % 3];
        const x = c[0] * 1.12, y = c[1], r = c[2] * 1.06;
        blob(g, x, y, r * 1.04, r * 0.95, col, L, { seed: i + 1, gl: 0.16, hiK: 0.26, dkK: 0.44, sb: 0.42 });
        // 잎 뭉치: 빛 쪽 위 둘레에 작은 덩어리
        [-2.35, -1.55, -0.75].forEach((a, j) => {
          const rr = r * (0.4 + ((i + j) % 3) * 0.03);
          blob(g, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.48, rr, rr * 0.9, j % 2 ? lit(col, 0.05) : col, L, { seed: i * 7 + j, gl: 0.1, hiK: 0.2, dkK: 0.22, sb: 0.3, sc: "rgba(40,25,10,.12)" });
        });
      });
      if (v === "full") {
        if (k === 0) {
          [...DECO, ...DECO2].forEach((p, i) => drawFlower(g, p[0], p[1], i < 5 ? 0.062 : 0.05, L, i));
        } else if (k === 2) DECO.forEach((p) => drawApple(g, p[0], p[1], 0.06, L));
      }
    }
    if (thumb && winter) drawSnowman(g, 0.29, 0.02, 0.36, 3, L);
    if (thumb && k === 1) drawCicada(g, 0.02, -0.25, 0.06, L);
    grain(g, cw, ch, thumb ? 0.25 : 0.5);
  }
  function drawFlower(g, x, y, r, L, seed = 0) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + seed;
      blob(g, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.46, r * 0.46, i % 2 ? "#ffb3cb" : "#ffa3c2", L, { sb: 0.2, gl: 0.25, seed: seed * 5 + i });
    }
    blob(g, x, y, r * 0.3, r * 0.3, "#ffd34a", L, { shadow: false, gl: 0.35 });
  }
  function drawApple(g, x, y, r, L) {
    rod(g, [[x, y - r * 0.75], [x + r * 0.12, y - r * 1.25]], r * 0.09, r * 0.07, "#6b4524", L, { shadow: false });
    blob(g, x, y, r, r * 0.92, "#dc2a2a", L, { sb: 0.3, gl: 0.42, seed: x * 9 });
    blob(g, x + r * 0.42, y - r * 1.05, r * 0.36, r * 0.17, "#4aa64c", L, { rot: -0.5, shadow: false, gl: 0.2 });
  }
  function drawCicada(g, x, y, r, L) {
    g.save();
    g.fillStyle = "rgba(225,240,255,.75)";
    g.strokeStyle = "rgba(90,120,140,.7)";
    g.lineWidth = r * 0.06;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + s * r * 0.38, y + r * 0.35, r * 0.32, r * 0.75, s * 0.28, 0, 6.283);
      g.fill();
      g.stroke();
    }
    g.restore();
    blob(g, x, y + r * 0.3, r * 0.3, r * 0.62, "#5b4030", L, { sb: 0.2, gl: 0.3 });
    blob(g, x, y - r * 0.3, r * 0.4, r * 0.3, "#6b4c38", L, { shadow: false, gl: 0.3 });
    g.fillStyle = "#24170e";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(x + s * r * 0.3, y - r * 0.34, r * 0.13, 0, 6.283);
      g.fill();
    }
  }
  /** 눈사람 (n: 0 눈 더미, 1 아래 공, 2 공 두 개, 3 얼굴·목도리까지) — (x,y) 바닥 가운데, h 키 */
  function drawSnowman(g, x, y, h, n, L) {
    const W = "#f7fbff", o = { dk: "#7d95bb", sc: "rgba(70,90,130,.28)", gl: 0.45 };
    if (n === 0) {
      blob(g, x, y - h * 0.08, h * 0.36, h * 0.12, W, L, o);
      return;
    }
    blob(g, x, y - h * 0.24, h * 0.27, h * 0.25, W, L, o);
    if (n >= 2) blob(g, x, y - h * 0.6, h * 0.2, h * 0.19, W, L, o);
    if (n >= 3) {
      rod(g, [[x - h * 0.17, y - h * 0.5], [x - h * 0.15, y - h * 0.47], [x + h * 0.16, y - h * 0.47], [x + h * 0.18, y - h * 0.5]], h * 0.05, h * 0.05, "#ff5d6e", L, { shadow: false });
      rod(g, [[x + h * 0.08, y - h * 0.46], [x + h * 0.13, y - h * 0.32]], h * 0.045, h * 0.04, "#ff5d6e", L, { shadow: false });
      g.fillStyle = "#2b2a33";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.arc(x + s * h * 0.065, y - h * 0.66, h * 0.022, 0, 6.283);
        g.fill();
      }
      g.fillStyle = "#ff8a2a";
      g.beginPath();
      g.moveTo(x - h * 0.01, y - h * 0.62);
      g.lineTo(x + h * 0.13, y - h * 0.595);
      g.lineTo(x - h * 0.01, y - h * 0.575);
      g.closePath();
      g.fill();
      rod(g, [[x - h * 0.19, y - h * 0.3], [x - h * 0.33, y - h * 0.42]], h * 0.018, h * 0.012, "#6b4524", L, { shadow: false });
      rod(g, [[x + h * 0.19, y - h * 0.3], [x + h * 0.33, y - h * 0.44]], h * 0.018, h * 0.012, "#6b4524", L, { shadow: false });
    }
  }

  /* ---------- 작은 점토 그림 (img 로 씀) — 이름별·크기별로 한 번만 ---------- */
  const SPR = {
    bud(g, L) {
      blob(g, 0.4, 0.8, 0.12, 0.08, "#5cae4f", L, { rot: 0.5, shadow: false, gl: 0.2 });
      blob(g, 0.6, 0.8, 0.12, 0.08, "#5cae4f", L, { rot: -0.5, shadow: false, gl: 0.2 });
      blob(g, 0.5, 0.55, 0.2, 0.27, "#ff8db3", L, { gl: 0.45 });
    },
    flower(g, L) {
      drawFlower(g, 0.5, 0.5, 0.36, L, 0.3);
    },
    apple(g, L) {
      drawApple(g, 0.5, 0.58, 0.3, L);
    },
    seed(g, L) {
      blob(g, 0.5, 0.5, 0.22, 0.3, "#8a5a2b", L, { rot: 0.4, gl: 0.4 });
    },
    hole(g) {
      softEllipse(g, 0.5, 0.5, 0.42, 0.2, "40,20,8", 0.7);
    },
    sprout(g, L) {
      rod(g, [[0.5, 0.97], [0.49, 0.75], [0.5, 0.5]], 0.035, 0.03, "#4ea845", L, { shadow: false });
      blob(g, 0.32, 0.44, 0.19, 0.09, "#69c35c", L, { rot: 0.45, gl: 0.3 });
      blob(g, 0.68, 0.4, 0.19, 0.09, "#69c35c", L, { rot: -0.45, gl: 0.3 });
    },
    cloud(g, L) {
      const o = { dk: "#8ea6c4", sc: "rgba(70,90,130,.2)", gl: 0.35 };
      blob(g, 0.5, 0.66, 0.38, 0.14, "#f4f8ff", L, o);
      blob(g, 0.28, 0.58, 0.18, 0.15, "#f7faff", L, o);
      blob(g, 0.72, 0.58, 0.18, 0.15, "#f7faff", L, o);
      blob(g, 0.5, 0.46, 0.24, 0.22, "#ffffff", L, o);
    },
    rainCloud(g, L) {
      const o = { dk: "#5f7393", sc: "rgba(50,70,100,.25)", gl: 0.25 };
      blob(g, 0.5, 0.66, 0.38, 0.14, "#d7e1ee", L, o);
      blob(g, 0.28, 0.58, 0.18, 0.15, "#dfe7f2", L, o);
      blob(g, 0.72, 0.58, 0.18, 0.15, "#dfe7f2", L, o);
      blob(g, 0.5, 0.46, 0.24, 0.22, "#e8eef6", L, o);
    },
    sun(g, L) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        blob(g, 0.5 + Math.cos(a) * 0.37, 0.5 + Math.sin(a) * 0.37, 0.07, 0.04, "#ffbf2e", L, { rot: a, shadow: false, gl: 0.3 });
      }
      blob(g, 0.5, 0.5, 0.25, 0.25, "#ffd84a", L, { gl: 0.5 });
    },
    can(g, L) {
      rod(g, [[0.62, 0.62], [0.78, 0.48], [0.9, 0.34]], 0.055, 0.04, "#3c9fd6", L);
      blob(g, 0.92, 0.31, 0.065, 0.055, "#2f88bd", L, { rot: -0.7, shadow: false });
      rod(g, [[0.2, 0.58], [0.11, 0.42], [0.2, 0.26], [0.42, 0.28]], 0.042, 0.042, "#2f88bd", L);
      blob(g, 0.42, 0.62, 0.26, 0.24, "#4fb3e8", L, { gl: 0.42 });
      g.fillStyle = "rgba(20,60,90,.35)";
      g.beginPath();
      g.ellipse(0.42, 0.42, 0.16, 0.05, 0, 0, 6.283);
      g.fill();
    },
    basket(g, L) {
      rod(g, [[0.16, 0.5], [0.24, 0.16], [0.5, 0.06], [0.76, 0.16], [0.84, 0.5]], 0.035, 0.035, "#a8692f", L);
      g.save();
      const bg = g.createLinearGradient(0, 0.45, 0, 0.92);
      bg.addColorStop(0, "#d79a55");
      bg.addColorStop(1, "#9a5f2b");
      g.fillStyle = bg;
      g.shadowColor = "rgba(55,32,12,.3)";
      g.shadowBlur = 6;
      g.shadowOffsetY = 3;
      g.beginPath();
      g.moveTo(0.1, 0.5);
      g.lineTo(0.9, 0.5);
      g.quadraticCurveTo(0.86, 0.9, 0.74, 0.92);
      g.lineTo(0.26, 0.92);
      g.quadraticCurveTo(0.14, 0.9, 0.1, 0.5);
      g.fill();
      g.restore();
      g.strokeStyle = "rgba(110,60,20,.45)";
      g.lineWidth = 0.022;
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(0.13 + i * 0.012, 0.5 + i * 0.1);
        g.lineTo(0.87 - i * 0.012, 0.5 + i * 0.1);
        g.stroke();
      }
      rod(g, [[0.08, 0.5], [0.92, 0.5]], 0.04, 0.04, "#c27f3e", L, { shadow: false });
    },
    butterfly(g, L) {
      blob(g, 0.3, 0.36, 0.2, 0.17, "#ffb347", L, { rot: -0.5, gl: 0.35 });
      blob(g, 0.7, 0.36, 0.2, 0.17, "#ffb347", L, { rot: 0.5, gl: 0.35 });
      blob(g, 0.33, 0.66, 0.14, 0.12, "#ff7eb6", L, { rot: 0.4, gl: 0.3 });
      blob(g, 0.67, 0.66, 0.14, 0.12, "#ff7eb6", L, { rot: -0.4, gl: 0.3 });
      rod(g, [[0.5, 0.28], [0.5, 0.74]], 0.04, 0.03, "#5b3a2a", L, { shadow: false });
    },
    cicada(g, L) {
      drawCicada(g, 0.5, 0.42, 0.42, L);
    },
    sm0(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 0, L);
    },
    sm1(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 1, L);
    },
    sm2(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 2, L);
    },
    sm3(g, L) {
      drawSnowman(g, 0.5, 0.97, 0.95, 3, L);
    },
  };
  const sprCache = new Map();
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  /** 점토 그림 → data URL (크기 px, 빛 방향 L) */
  function spr(name, px, L) {
    const c = Math.max(16, Math.round((px * DPR()) / 8) * 8), key = name + "|" + c + "|" + L.join(",");
    if (sprCache.has(key)) return sprCache.get(key);
    const cv = document.createElement("canvas");
    cv.width = cv.height = c;
    const g = cv.getContext("2d");
    g.setTransform(c, 0, 0, c, 0, 0);
    SPR[name](g, L);
    grain(g, c, c, 0.8);
    const url = cv.toDataURL("image/png");
    if (sprCache.size > 80) sprCache.clear();
    sprCache.set(key, url);
    return url;
  }

  /* ---------- 이모지 → 점토 느낌 (3단계 물건) ----------
     그림을 캔버스에 그린 뒤: 모양(알파)을 흐려 높이로 → 빛 쪽 밝게·반대쪽 어둡게 + 가장자리 살짝 어둡게 + 색을 조금 뭉개고 결 */
  const clayECache = new Map();
  function clayEmoji(ch, px) {
    const S = Math.max(48, Math.round((px * DPR()) / 8) * 8), key = ch + "|" + S;
    if (clayECache.has(key)) return Promise.resolve(clayECache.get(key));
    return KP.loadE([ch]).then(() => {
      const im = KP.eImage(ch);
      if (!im || !im.naturalWidth) return null;
      const cv = document.createElement("canvas");
      cv.width = cv.height = S;
      const g = cv.getContext("2d", { willReadFrequently: true });
      const pad = S * 0.1;
      g.drawImage(im, pad, pad, S - pad * 2, S - pad * 2);
      const id = g.getImageData(0, 0, S, S), d = id.data, n = S * S;
      const A = new Float32Array(n), H = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        A[i] = d[i * 4 + 3] / 255;
        const lum = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
        H[i] = A[i] * (0.82 + lum * 0.18);
      }
      // 상자 흐림 3번 (가로·세로) ≈ 부드러운 언덕
      const tmp = new Float32Array(n);
      const blur = (src, r) => {
        for (let pass = 0; pass < 3; pass++) {
          for (let y = 0; y < S; y++) {
            let s = 0;
            for (let x = -r; x <= r; x++) s += src[y * S + Math.min(S - 1, Math.max(0, x))];
            for (let x = 0; x < S; x++) {
              tmp[y * S + x] = s / (2 * r + 1);
              s += src[y * S + Math.min(S - 1, x + r + 1)] - src[y * S + Math.max(0, x - r)];
            }
          }
          for (let x = 0; x < S; x++) {
            let s = 0;
            for (let y = -r; y <= r; y++) s += tmp[Math.min(S - 1, Math.max(0, y)) * S + x];
            for (let y = 0; y < S; y++) {
              src[y * S + x] = s / (2 * r + 1);
              s += tmp[Math.min(S - 1, y + r + 1) * S + x] - tmp[Math.max(0, y - r) * S + x];
            }
          }
        }
      };
      blur(H, Math.max(2, Math.round(S * 0.035)));
      // 색 살짝 뭉개기 (잔선 줄이기)
      const C = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) C[i * 3 + k] = d[i * 4 + k] * A[i];
      const ch3 = new Float32Array(n);
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < n; i++) ch3[i] = C[i * 3 + k];
        blur(ch3, 1);
        for (let i = 0; i < n; i++) C[i * 3 + k] = ch3[i];
      }
      const Ab = A.slice();
      blur(Ab, 1);
      const lx = -0.5, ly = -0.62, lz = 0.6, ln = Math.hypot(lx, ly, lz);
      const r = rng(17), k2 = S / 60;
      for (let y = 1; y < S - 1; y++)
        for (let x = 1; x < S - 1; x++) {
          const i = y * S + x;
          if (A[i] < 0.01) continue;
          const nx = (H[i - 1] - H[i + 1]) * k2 * 6, ny = (H[i - S] - H[i + S]) * k2 * 6, nz = 1;
          const nn = Math.hypot(nx, ny, nz);
          const sh = (nx * lx + ny * ly + nz * lz) / (nn * ln);
          const ao = 0.78 + 0.22 * Math.min(1, H[i] * 2.2);
          const spec = Math.pow(Math.max(0, sh), 18) * 55;
          const ab = Math.max(0.01, Ab[i]);
          for (let k = 0; k < 3; k++) {
            let c = C[i * 3 + k] / ab;
            const gray = (C[i * 3] + C[i * 3 + 1] + C[i * 3 + 2]) / 3 / ab;
            c = c * 0.9 + gray * 0.1; // 채도 조금 낮춤 (점토는 무광)
            c = c * (0.62 + 0.5 * sh) * ao + spec + (r() - 0.5) * 9;
            d[i * 4 + k] = c;
          }
        }
      g.putImageData(id, 0, 0);
      const url = cv.toDataURL("image/png");
      clayECache.set(key, url);
      return url;
    });
  }
  const loadImg = (url) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = url;
    });

  KP.game({
    id: "seasons",
    icon: "🌳",
    name: "사계절 나무",
    cat: "smart",
    levels: 3,
    score: "⭐",
    setup(ctx) {
      const U = KP.u,
        A = KP.audio;
      const IMG = "assets/play-clay/seasons/";
      KP.css("seasons", `
      .ss{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .ssScene{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#cfe6f5}
      .ssBg2{position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;pointer-events:none;z-index:0;opacity:0}
      .ssTreeL{position:absolute;left:0;top:0;z-index:0;pointer-events:none;transform-origin:50% 96.3%;transition:transform 1.6s cubic-bezier(.3,1.25,.5,1)}
      .ssTreeL.t0{transform:scale(0)}
      .ssTreeL.t1{transform:scale(.3)}
      .ssSw{position:absolute;inset:0;transform-origin:50% 96.3%;animation:ssSway 6s ease-in-out infinite}
      @keyframes ssSway{0%,100%{transform:rotate(-.5deg)}50%{transform:rotate(.5deg)}}
      .ssSw canvas{position:absolute;inset:0;width:100%;height:100%;transition:opacity 1.2s}
      .ssSw canvas.off{opacity:0}
      .ssSpr{position:absolute;width:var(--s,40px);height:var(--s,40px);margin:calc(var(--s,40px)*-.5) 0 0 calc(var(--s,40px)*-.5);pointer-events:none;transition:transform .3s,opacity .5s}
      .ssSpr img{width:100%;height:100%;display:block}
      .ssSpr{animation:ssIn .8s .35s backwards}
      @keyframes ssIn{from{opacity:0;transform:scale(.4)}}
      .ssSpr.bud img{animation:ssBud 1.8s ease-in-out infinite}
      @keyframes ssBud{50%{transform:scale(1.12)}}
      .ssSpr.open{animation:ssBloom .5s cubic-bezier(.3,1.6,.5,1)}
      @keyframes ssBloom{from{transform:scale(.2) rotate(-40deg)}}
      .ssSpr.fruit img{animation:ssSwing 2.6s ease-in-out infinite;transform-origin:50% 10%}
      @keyframes ssSwing{50%{transform:rotate(8deg)}}
      .ssSpr.gone{opacity:0;transform:scale(.3)}
      .ssSpr.sing img{animation:ssBuzz .12s linear infinite}
      @keyframes ssBuzz{50%{transform:translateX(2px)}}
      .ssUi{position:absolute;left:0;top:0;pointer-events:none}
      .ssBtn{position:absolute;left:0;top:0;width:var(--s,90px);height:var(--s,90px);pointer-events:auto;touch-action:none;transition:opacity .45s,scale .45s}
      .ssBtn img{width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 6px 5px rgba(60,40,20,.22))}
      .ssBtn.off{opacity:0;pointer-events:none!important;scale:.4}
      .ssSoil{border-radius:50%;background:radial-gradient(ellipse,rgba(255,236,170,.0),rgba(255,236,170,.0));transition:background .3s}
      /* 누를 흙 빛 고리는 가장 밝은 모습을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .ssSoil::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:0 0 0 10px rgba(255,214,90,.45)}
      .ssSoil.ask{animation:none}
      .ssSoil.ask::after{animation:ssAsk 1.6s ease-in-out infinite}
      @keyframes ssAsk{50%{opacity:1}}
      .ssSoil.wet{background:radial-gradient(ellipse,rgba(40,20,6,.4) 30%,rgba(40,20,6,0) 70%)}
      .ssSoil .hole,.ssSoil .sprout{position:absolute;left:50%;transform:translate(-50%,-50%)}
      .ssSoil .hole{top:50%;width:36%;height:auto;opacity:0;transition:opacity .3s}
      .ssSoil.seeded .hole{opacity:1}
      .ssSoil .sprout{top:10%;width:34%;height:auto;transform:translate(-50%,-50%) scale(0);transform-origin:50% 100%;transition:transform .7s cubic-bezier(.3,1.6,.5,1)}
      .ssSoil.sprouted .sprout{transform:translate(-50%,-50%) scale(1)}
      .ssSun.shine::before{content:"";position:absolute;inset:-50%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,120,.9),rgba(255,236,120,0) 65%);animation:ssGlow 1.4s ease-out forwards}
      @keyframes ssGlow{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
      .ssSun img{animation:ssSpin 14s linear infinite}
      @keyframes ssSpin{to{transform:rotate(360deg)}}
      .ssCloud.ssHop img{animation:ssJump .4s}
      @keyframes ssJump{40%{transform:translateY(-8%) scale(1.06)}}
      .ssMan{width:var(--w,90px);height:var(--s,120px)}
      .ssMan img{position:absolute;inset:0;filter:drop-shadow(0 6px 5px rgba(70,90,130,.25))}
      .ssMan.ssSqz img{animation:ssBump .35s}
      @keyframes ssBump{40%{transform:scale(1.08,.94)}}
      .ssHeld{pointer-events:auto!important;touch-action:none}
      .ssHeld img{width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 5px 4px rgba(60,40,20,.25));transition:transform .3s;transform-origin:30% 60%}
      .ssHeld.pour img{transform:rotate(28deg)}
      .ssBasket b{position:absolute;right:-8%;top:-10%;min-width:1.6em;height:1.6em;border-radius:1em;background:#fffaf2;color:#e0582c;font-size:max(16px,calc(var(--s,80px)*.24));display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(120,80,40,.18)}
      .ssBasket.ssSqz img{animation:ssBump .35s}
      .ssFly{position:absolute;left:0;top:0;z-index:8;pointer-events:none;width:var(--s,40px);height:var(--s,40px);transition:transform .7s cubic-bezier(.5,-0.3,.6,1)}
      .ssFly img{width:100%;height:100%}
      .ssBug{position:absolute;left:0;top:0;width:var(--s,44px);height:var(--s,44px);pointer-events:none!important;display:none;z-index:6}
      .ssBug.on{display:block}
      .ssBug img{width:100%;height:100%;animation:ssFlap .25s ease-in-out infinite alternate;transform-origin:50% 50%}
      @keyframes ssFlap{to{transform:scaleX(.55)}}
      .ssMeme{position:absolute;left:0;top:0;z-index:7;background:#fffaf2;border-radius:16px;padding:3px 10px;font-size:max(16px,2.4vmin);color:var(--ink);box-shadow:0 3px 0 rgba(120,80,40,.15);opacity:0;transition:opacity .4s;pointer-events:none!important;white-space:nowrap}
      .ssMeme.on{opacity:1}
      .ssFx{position:absolute;left:0;top:0;pointer-events:none!important;z-index:5}
      .ssTap{position:absolute;left:0;top:0;pointer-events:none;touch-action:none}
      .ssTap.on{pointer-events:auto}
      .ssLoad{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      .ssAsk{display:flex;gap:clamp(8px,1.6vw,18px);justify-content:center;flex:0 0 auto}
      .ssAsk .choice{flex:0 1 clamp(96px,min(18vw,22vh),180px);min-width:0;aspect-ratio:1/1.12;min-height:0;padding:6px;flex-direction:column;gap:2px;font-size:clamp(18px,2.6vw,26px);background:#fffaf2;border-radius:26px;box-shadow:0 6px 0 rgba(140,95,50,.18)}
      .ssAsk .choice img,.ssMini img.th{width:100%;flex:1;min-height:0;display:block;object-fit:cover;border-radius:18px}
      .ssSort{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:minmax(0,1fr) auto;gap:clamp(8px,1.4vw,16px)}
      .ssMini{min-height:0;border-radius:26px;padding:6px 6px 4px;display:flex;flex-direction:column;align-items:center;background:#fffaf2;box-shadow:0 6px 0 rgba(140,95,50,.16);font-size:clamp(18px,2.6vw,28px);color:var(--ink);transition:transform .2s;position:relative}
      .ssMini.dropHover{transform:scale(1.05);box-shadow:0 0 0 5px #ffd23f,0 6px 0 rgba(140,95,50,.16)}
      .ssMini .got{position:absolute;left:6px;right:6px;bottom:2.2em;display:flex;flex-wrap:wrap;justify-content:center;gap:2px}
      .ssMini .got img{width:clamp(30px,4vw,48px);height:clamp(30px,4vw,48px);animation:popIn .3s;filter:drop-shadow(0 3px 2px rgba(60,40,20,.3))}
      .ssTray{grid-column:1/-1;display:flex;gap:clamp(14px,3vw,36px);justify-content:center;align-items:center;min-height:clamp(88px,14vh,134px);
        background:linear-gradient(#f7ead6,#efdcc0);border-radius:28px;padding:8px 12px;box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12)}
      .ssItem{width:clamp(76px,min(11vw,13vh),116px);height:clamp(76px,min(11vw,13vh),116px);border-radius:26px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);box-shadow:0 6px 0 rgba(140,95,50,.18);position:relative;flex:none}
      .ssItem img{position:absolute;left:4%;top:4%;width:92%;height:92%;filter:drop-shadow(0 4px 3px rgba(80,40,20,.25));pointer-events:none}
      .ssItem.dragging{z-index:50;background:transparent;box-shadow:none}
      @media (max-aspect-ratio:3/4){
        .ssSort{grid-template-columns:repeat(2,1fr);grid-template-rows:minmax(0,1fr) minmax(0,1fr) auto}
        /* 세로 폰: 보기 4개를 2×2 로 크게(한 줄 4개는 그림이 작아 계절 구분이 어려웠음) */
        .ssAsk{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
        .ssAsk .choice{aspect-ratio:auto;height:clamp(100px,16vh,180px)}
      }
      @media (orientation:landscape) and (max-height:520px){
        .ss{flex-direction:row}
        .ssAsk{display:grid;grid-template-columns:repeat(2,auto);align-content:center}
        .ssAsk .choice{width:min(25vh,124px);height:min(38vh,134px);aspect-ratio:auto;flex:none;font-size:16px}
        .ssSort{grid-template-columns:repeat(4,1fr) auto;grid-template-rows:minmax(0,1fr)}
        .ssTray{grid-column:auto;flex-direction:column;gap:8px;min-height:0}
        .ssItem{width:min(22vh,84px);height:min(22vh,84px)}
        .ssMini .got img{width:28px;height:28px}
      }
    `);

      /* ---------- 계절 · 물건 ---------- */
      const SEA = [
        { name: "봄", em: "🌸" },
        { name: "여름", em: "☀️" },
        { name: "가을", em: "🍁" },
        { name: "겨울", em: "❄️" },
      ];
      // 계절 물건 (3단계) — [그림, 이름, 계절, 맞게 넣었을 때 말]
      const ITEMS = [
        ["🌸", "벚꽃", 0, "벚꽃은 봄에 활짝 펴요!"],
        ["🌷", "튤립", 0, "튤립은 봄에 펴요!"],
        ["🦋", "나비", 0, "봄에는 나비가 팔랑팔랑!"],
        ["🌱", "새싹", 0, "봄에는 새싹이 쏙 나와요!"],
        ["🍉", "수박", 1, "여름에는 시원한 수박!"],
        ["👙", "수영복", 1, "여름에는 수영복 입고 물놀이!"],
        ["🌻", "해바라기", 1, "해바라기는 여름에 펴요!"],
        ["⛱️", "파라솔", 1, "여름에는 바닷가에 가요!"],
        ["🌰", "밤", 2, "밤은 가을에 열려요!"],
        ["🍁", "단풍잎", 2, "가을에는 단풍잎이 빨개요!"],
        ["🍂", "낙엽", 2, "가을에는 낙엽이 떨어져요!"],
        ["🌾", "벼", 2, "가을에는 벼가 노랗게 익어요!"],
        ["🧤", "장갑", 3, "겨울에는 장갑을 껴요!"],
        ["⛄", "눈사람", 3, "겨울에는 눈사람을 만들어요!"],
        ["❄️", "눈송이", 3, "눈송이는 겨울에 내려요!"],
        ["🛷", "썰매", 3, "겨울에는 썰매를 타요!"],
      ];
      // 배경 4장(1344×752, 같은 구도): 가운데 흙 자리 [u, v, 가로 반지름, 세로 반지름] — 계절마다 조금 다름
      const BGF = ["spring", "summer", "autumn", "winter"].map((n) => IMG + n + ".jpg");
      const SPOT = [
        [0.503, 0.806, 0.197, 0.083],
        [0.497, 0.767, 0.147, 0.067],
        [0.503, 0.739, 0.197, 0.083],
        [0.497, 0.783, 0.178, 0.072],
      ];
      // 빛이 오는 쪽(화면): 여름 그림은 해가 오른쪽 위
      const LIGHT = [[-0.6, -0.75], [0.55, -0.8], [-0.6, -0.72], [-0.45, -0.8]];
      ctx.BG = {
        file: BGF[0], img: [1344, 752], vh: 0.5, near: 0.2, fov: 34, focus: [0.5, 0.56], focusP: [0.5, 0.6],
        sun: [-0.5, 1, 0.7], sunCol: "#fff4e2", spots: { tree: [0.5, 0.79] },
      };

      /* ---------- 화면 ---------- */
      const wrap = U.el("div", "ss");
      const scene = U.el("div", "ssScene");
      const ask = U.el("div", "ssAsk");
      const sort = U.el("div", "ssSort");
      wrap.append(scene, ask, sort);
      ctx.body.appendChild(wrap);
      // 무대에 붙는 것들 (무대를 새로 만들 때마다 옮겨 붙임)
      const bg2 = U.el("div", "ssBg2");
      const treeL = U.el("div", "ssTreeL t0");
      const sw = U.el("div", "ssSw");
      const cvA = U.el("canvas", ""), cvB = U.el("canvas", "off");
      sw.append(cvA, cvB);
      treeL.appendChild(sw);
      const soil = U.el("button", "ssBtn ssSoil off", '<img class="hole" alt="" src=""><img class="sprout" alt="" src="">');
      soil.setAttribute("aria-label", "흙");
      const sun = U.el("button", "ssBtn ssSun off", '<img alt="" src="">');
      const cloud = U.el("button", "ssBtn ssCloud off", '<img alt="" src="">');
      const man = U.el("button", "ssBtn ssMan off", '<img alt="" src="">');
      const tapZone = U.el("div", "ssTap"); // 나무 근처 아무 데나 누르면 가장 가까운 꽃봉오리·사과
      const can = U.el("div", "ssHeld ssCan", '<img alt="" src="">');
      const basket = U.el("div", "ssHeld ssBasket", '<img alt="" src=""><b>0</b>');
      const bugs = [0, 1].map(() => U.el("div", "ssBug", '<img alt="" src="">'));
      const meme = U.el("div", "ssMeme", "맴맴");
      const fx = U.el("canvas", "ssFx");
      const fg = fx.getContext("2d");
      [soil, sun, cloud, man, tapZone, can].forEach((el) => ctx.fast(el, (e) => el._on && el._on(e)));
      const tapOnce = (el) =>
        new Promise((res) => {
          el._on = (e) => {
            el._on = null;
            res(e);
          };
        });

      /* ---------- 상태 ---------- */
      let season = 0,
        grown = false,
        rid = 0,
        sprites = [],
        bugsOn = false,
        leafRate = 0,
        treeKey = "",
        treeV = "act",
        bgK = -1,
        st = null,
        act = null,
        fw = null,
        TL = { x: 0, y: 0, w: 100, h: 100, S: 100 }; // 나무 층 자리 (px)
      const alive = (r) => r === rid && ctx._active;
      const off = (el, v) => el.classList.toggle("off", v);
      const L = () => LIGHT[season];

      /* ---------- 무대 ---------- */
      async function makeStage() {
        const CS = KP.clayStage;
        dropStage();
        const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
        const slow = KP.store.get("seasons:flat", null);
        let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
        if (!flat) {
          try {
            await CS.load();
          } catch (e) {
            flat = true;
          }
        }
        if (!ctx._active || tok !== ctx._stTok) return null;
        let s;
        const opt = {
          flat,
          qKey: "play3d:q",
          onLost: () => ctx._active && st === s && ctx.begin(true),
          onSlow: () => {
            if (!ctx._active || st !== s) return;
            KP.store.set("seasons:flat", { t: Date.now() });
            KP.toast("기기가 바빠서 그림으로 바꿨어요");
            ctx.begin(true);
          },
        };
        ctx.BG.file = BGF[Math.max(0, bgK)];
        try {
          s = CS.create(scene, ctx.BG, opt);
        } catch (e) {
          opt.flat = true;
          s = CS.create(scene, ctx.BG, opt);
        }
        st = ctx.st = s;
        // 배경 겹침 층·나무 층은 배경 바로 위(3D 인형 아래), 누르는 것들은 맨 위 층
        scene.insertBefore(treeL, s.bgEl.nextSibling);
        scene.insertBefore(bg2, treeL);
        bg2.style.opacity = 0;
        s.ui.append(fx, tapZone, soil, sun, cloud, man, meme, ...bugs);
        treeKey = "";
        s.onResize = () => layout();
        layout();
        return s;
      }
      function dropStage() {
        ctx.track = null;
        if (fw) fw.clear();
        fw = null;
        if (act) act.dispose();
        act = ctx.actor = null;
        if (st) st.dispose();
        st = ctx.st = null;
        treeL.remove();
        bg2.remove();
      }
      async function makeActor(s) {
        const U2 = KP.u, D = KP.DOLL;
        const dolls = await KP.dollActor.painted();
        if (st !== s || s.dead) return null;
        let pick;
        if (dolls.length) {
          const c = dolls.length > 1 ? dolls.filter((x) => x.id !== ctx.lastDoll) : dolls;
          const it = U2.pick(c);
          ctx.lastDoll = it.id;
          pick = { item: it };
        } else {
          const sp = U2.pick(D.ORDER.filter((x) => x !== ctx.lastDoll));
          ctx.lastDoll = sp;
          pick = { species: sp };
        }
        let a;
        try {
          a = s.gl ? await KP.dollActor.create(s, pick) : await KP.dollActor.create2D(s, pick);
        } catch (e) {
          console.warn("인형 준비 실패", e && e.message);
          if (st !== s || s.dead) return null;
          a = await KP.dollActor.create2D(s, { species: "bear" });
        }
        if (!a) return null;
        if (st !== s || s.dead) {
          a.dispose();
          return null;
        }
        return a;
      }

      /* ---------- 자리 잡기 (화면 크기가 바뀔 때마다) ---------- */
      const pxToGround = (x, y) => {
        const v = st.bc.view;
        return st.bc.ground((x + v.ox) / v.fw, (y + v.oy) / v.fh);
      };
      let dollAt = null,
        renderT = null;
      function layout() {
        if (!st || !st.bc) return;
        const W = st.w, H = st.h, sp = SPOT[season];
        fx.width = Math.round(W * Math.min(1.5, devicePixelRatio || 1));
        fx.height = Math.round(H * Math.min(1.5, devicePixelRatio || 1));
        fx.style.width = W + "px";
        fx.style.height = H + "px";
        fg.setTransform(fx.width / W, 0, 0, fx.height / H, 0, 0);
        if (bg2.style.backgroundImage) {
          bg2.style.backgroundSize = st.bgEl.style.backgroundSize;
          bg2.style.backgroundPosition = st.bgEl.style.backgroundPosition;
        }
        // 나무: 밑동 = 흙 자리 가운데(조금 뒤), 키 = 그림 높이의 62% (위로 잘리지 않게, 폭이 화면을 넘지 않게)
        const base = st.uvToPx(sp[0], sp[1] - sp[3] * 0.15);
        const fh = st.bc.view.fh;
        const S = Math.max(80, Math.min(fh * 0.62, (base.y - Math.max(14, H * 0.035)) / 1.07, (W * 0.96) / 0.92)); // 꼭대기 잎 뭉치까지 화면 안
        const cw = S * 1.12, chh = S * 1.08; // 수관 덩어리·그림자가 잘리지 않게 여유
        TL = { x: base.x, y: base.y, w: cw, h: chh, S };
        Object.assign(treeL.style, { width: cw + "px", height: chh + "px", left: base.x - cw / 2 + "px", top: base.y - chh + S * 0.04 + "px" });
        // 흙 자리 (누르는 곳)
        const sv = st.uvToPx(sp[0], sp[1]), rx = sp[2] * st.bc.view.fw, ry = sp[3] * fh;
        const sw2 = Math.min(W * 0.9, Math.max(110, rx * 1.5)), sh2 = Math.max(70, ry * 2.4);
        soil.style.cssText = `width:${sw2}px;height:${sh2}px;transform:translate(${sv.x - sw2 / 2}px,${sv.y - sh2 / 2}px)`;
        const hs = Math.max(60, S * 0.22);
        soil.querySelector(".sprout").style.width = hs + "px";
        soil.querySelector(".hole").style.width = Math.max(40, S * 0.12) + "px";
        // 해님(오른쪽 위)·구름(나무 왼쪽 위)·눈사람(나무 오른쪽)
        const ss = U.clamp(Math.min(W, H) * 0.2, 80, 150);
        sun.style.cssText = `--s:${ss}px;transform:translate(${W - ss * 1.08}px,${Math.max(6, H * 0.03)}px)`;
        const cs = U.clamp(S * 0.5, 110, 240);
        cloud.style.cssText = `--s:${cs}px;transform:translate(${U.clamp(base.x - cs * 0.95, 4, W - cs - 4)}px,${Math.max(4, base.y - S * 1.08 - cs * 0.1)}px)`;
        const mh = U.clamp(S * 0.42, 100, 260), mw = mh * 0.8;
        const mx = U.clamp(base.x + S * 0.34, mw * 0.5 + 4, W - mw * 0.5 - 4);
        man.style.cssText = `--s:${mh}px;--w:${mw}px;transform:translate(${mx - mw / 2}px,${base.y + ry * 0.6 - mh}px)`;
        tapZone.style.cssText = `width:${S}px;height:${S * 0.85}px;transform:translate(${base.x - S * 0.5}px,${base.y - S * 1.02}px)`;
        clearTimeout(renderT);
        renderT = setTimeout(() => ctx._active && st && renderTree(true), treeKey ? 220 : 0);
        placeSprites();
        // 인형: 나무 왼쪽 앞 (좁은 화면은 화면 안쪽으로)
        if (act) {
          const g0 = pxToGround(base.x, base.y + ry * 0.9) || st.spot("tree");
          act.setH(st.fitH(g0[0], g0[1], H > W ? 0.24 : 0.32));
          const bw = act.box().w || S * 0.3;
          // 세로 화면: 흙 자리가 화면 폭을 거의 다 차지해 옆에 설 곳이 없음 → 흙 자리 '뒤쪽 왼편'(풀밭)에 세워 흙을 가리지 않게
          const tall = H > W;
          const dx = U.clamp(tall ? sv.x - sw2 * 0.3 : base.x - cw * 0.44, bw * 0.6 + 4, W - bw * 0.6 - 4);
          dollAt = pxToGround(dx, tall ? sv.y - ry * 1.15 : base.y + ry * 1.05) || g0;
          if (act.a.state === "idle" && !act._jump && !ctx._dollEntering) act.place(dollAt[0], dollAt[1]);
        }
      }

      /* ---------- 나무 그리기 ---------- */
      let front = cvA;
      function renderTree(force) {
        if (!st) return;
        const key = season + treeV + "|" + Math.round(TL.S) + "|" + TL.w;
        if (!force && key === treeKey) return;
        const same = treeKey && treeKey.split("|")[0] === key.split("|")[0]; // 크기만 바뀜 → 겹치지 않고 바로
        treeKey = key;
        const d = Math.min(devicePixelRatio || 1, 1.5);
        const back = same ? front : front === cvA ? cvB : cvA;
        const cw = Math.round(TL.w * d), ch = Math.round(TL.h * d);
        back.width = cw;
        back.height = ch;
        const g = back.getContext("2d");
        g.clearRect(0, 0, cw, ch);
        const S = TL.S * d;
        g.setTransform(S, 0, 0, S, cw / 2, ch - S * 0.04);
        drawTree(g, season, treeV, L(), cw, ch);
        g.setTransform(1, 0, 0, 1, 0, 0);
        if (!same) {
          back.classList.remove("off");
          front.classList.add("off");
          front = back;
        }
      }
      /** 계절 장면 바꾸기. mode: "act"(아이가 할 일 준비) / "full"(다 된 모습) / "seed"(씨앗 심기 전) */
      function setSeason(k, mode) {
        const prev = season;
        season = k;
        setBg(k);
        [sun, cloud, man, soil].forEach((b) => {
          off(b, true);
          b._on = null;
        });
        tapZone._on = null;
        tapZone.classList.remove("on");
        soil.classList.remove("seeded", "wet", "sprouted", "ask");
        meme.classList.remove("on");
        setBugs(false);
        leafRate = 0;
        holdNone();
        // 다른 계절의 꽃잎·낙엽·눈은 스르르 사라짐
        parts.forEach((q) => {
          if ((q.k === "snow" && k !== 3) || (q.k === "leaf" && k !== 2) || (q.k === "petal" && k !== 0)) q.f = q.f || 1;
        });
        clearSprites();
        treeV = mode === "full" ? "full" : "act";
        if (mode === "seed") {
          treeL.className = "ssTreeL t0";
          off(soil, false);
        } else if (grown) treeL.className = "ssTreeL";
        if (prev !== k) layout();
        else renderTree();
        if (mode === "seed") return;
        if (k === 0) {
          if (mode === "act") addSprites("bud", DECO);
          else setBugs(true);
        } else if (k === 1) {
          if (mode === "act") {
            cloud.querySelector("img").src = spr("cloud", 200, L());
            off(cloud, false);
          } else addSprites("cicada", [[0.02, -0.25]], 0.13);
        } else if (k === 2) {
          addSprites("fruit", DECO);
          leafRate = mode === "act" ? 0.5 : 1.6;
        } else {
          man.dataset.n = mode === "act" ? "0" : "3";
          man.querySelector("img").src = spr("sm" + man.dataset.n, 200, L());
          off(man, false);
        }
      }
      /** 배경 바꾸기: 지금 그림을 위 층에 두고 아래에 새 그림 → 위 층을 서서히 투명하게 (두 장만) */
      let bgTok = 0;
      async function setBg(k, instant) {
        if (bgK === k || !st) return;
        const my = ++bgTok, s = st;
        const im = await Promise.race([loadImg(BGF[k]), new Promise((r) => setTimeout(r, 2500))]);
        if (my !== bgTok || st !== s || s.dead) return;
        const url = 'url("' + BGF[k] + '")';
        if (instant || bgK < 0 || !im) {
          s.bgEl.style.backgroundImage = url;
          bg2.style.opacity = 0;
          bgK = k;
          return;
        }
        bg2.style.transition = "none";
        bg2.style.backgroundImage = s.bgEl.style.backgroundImage;
        bg2.style.backgroundSize = s.bgEl.style.backgroundSize;
        bg2.style.backgroundPosition = s.bgEl.style.backgroundPosition;
        bg2.style.opacity = 1;
        s.bgEl.style.backgroundImage = url;
        void bg2.offsetWidth;
        bg2.style.transition = "opacity 1.3s ease";
        bg2.style.opacity = 0;
        bgK = k;
      }

      /* ---------- 나무 위 작은 그림 (꽃봉오리·사과·매미) ---------- */
      function clearSprites() {
        const old = sprites;
        sprites = [];
        old.forEach((s) => s.classList.add("gone"));
        setTimeout(() => old.forEach((s) => s.remove()), 600);
      }
      function addSprites(cls, pts, k) {
        const name = cls === "bud" ? "bud" : cls === "fruit" ? "apple" : cls;
        sprites = pts.map(([x, y]) => {
          const s = U.el("div", "ssSpr " + cls, '<img alt="" src="">');
          s._p = [x, y];
          s._k = k || (cls === "fruit" ? 0.15 : 0.14);
          s._name = name;
          sw.appendChild(s);
          return s;
        });
        placeSprites();
      }
      function placeSprites() {
        for (const s of sprites) {
          const px = Math.max(cls0(s) ? 46 : 30, s._k * TL.S);
          s.style.setProperty("--s", px + "px");
          s.style.left = 50 + (s._p[0] / 1.12) * 100 + "%";
          s.style.top = ((1.04 + s._p[1]) / 1.08) * 100 + "%";
          const name = s.classList.contains("open") ? "flower" : s._name;
          const img = s.querySelector("img"), src = spr(name, px, L());
          if (img.getAttribute("src") !== src) img.src = src;
        }
      }
      const cls0 = (s) => s.classList.contains("bud") || s.classList.contains("fruit") || s.classList.contains("open");
      function setBugs(on) {
        bugsOn = on;
        bugs.forEach((b) => {
          b.classList.toggle("on", on);
          if (on) b.querySelector("img").src = spr("butterfly", 48, LIGHT[0]);
        });
      }

      /* ---------- 인형 손에 든 것 (물뿌리개·바구니) ---------- */
      function holdNone() {
        if (fw) fw.clear();
        can._on = null;
        can.classList.remove("pour");
        if (act) {
          act.hug(false);
          pose({});
        }
      }
      function hold(el, nm, dx, dy, k, img) {
        if (!fw || !act) return;
        fw.clear();
        el.querySelector("img").src = img;
        const sz = Math.max(70, act.box().h * k);
        el.style.width = el.style.height = sz + "px";
        el.style.setProperty("--s", sz + "px");
        fw.add(el, nm, dx, dy);
      }

      /* ---------- 인형 몸짓: 놀이가 정하는 덧붙임 자세로 부드럽게 ---------- */
      let poseT = {},
        tiltOn = false;
      const pose = (o) => (poseT = o || {});
      const KEYS = ["fR", "fL", "uR", "uL", "nod", "tilt", "sway", "bob"];
      function poseStep(dt, t) {
        if (!act || !act.play) return;
        const p = act.play, k = Math.min(1, dt * 7);
        for (const key of KEYS) p[key] += ((poseT[key] || 0) - p[key]) * k;
        if (tiltOn) p.tilt += Math.sin(t * 2.6) * 0.012;
      }
      async function nodPat(n = 2) {
        for (let i = 0; i < n; i++) {
          pose({ nod: 0.38, fL: 0.7, fR: 0.4 });
          await ctx.wait(280);
          pose({ nod: 0.22, fL: 0.3, fR: 0.2 });
          await ctx.wait(220);
        }
        pose({});
      }

      /* ---------- 캔버스 (꽃잎 · 비 · 낙엽 · 눈 · 물) ---------- */
      let rainT = 0,
        waterT = 0;
      const parts = [];
      const rel = (el) => {
        const a = el.getBoundingClientRect(),
          s = scene.getBoundingClientRect();
        return { x: a.left - s.left, y: a.top - s.top, w: a.width, h: a.height };
      };
      let bugT = 0,
        drew = false;
      function step(dt) {
        if (!st || !st.w) return;
        const W = st.w, H = st.h, r = Math.random;
        const n = (kind) => parts.reduce((c, p) => c + (p.k === kind), 0);
        const ground = TL.y + SPOT[season][3] * st.bc.view.fh * 0.4;
        if (season === 0 && bugsOn && r() < dt * 1.6 && n("petal") < 14) parts.push({ k: "petal", x: TL.x + (r() - 0.5) * TL.w, y: TL.y - TL.S * 0.7, vx: 10 + r() * 20, vy: 22 + r() * 18, a: r() * 6, s: 4 + r() * 3 });
        if (season === 2 && leafRate && r() < dt * leafRate && n("leaf") < 18)
          parts.push({ k: "leaf", x: TL.x + (r() - 0.5) * TL.w * 0.7, y: TL.y - TL.S * (0.5 + r() * 0.35), vx: (r() - 0.5) * 30, vy: 26 + r() * 20, a: r() * 6, s: 6 + r() * 4, c: U.pick(["#ff9b3d", "#e8563b", "#ffc935", "#c9772f"]), fl: ground + r() * 20 });
        if (season === 3 && n("snow") < 60 && r() < dt * 14) parts.push({ k: "snow", x: r() * W, y: -6, vx: (r() - 0.5) * 14, vy: 26 + r() * 30, a: r() * 6, s: 2 + r() * 3 });
        if (rainT > 0) {
          rainT -= dt;
          const c = rel(cloud);
          for (let i = 0; i < 4; i++) parts.push({ k: "rain", x: c.x + c.w * (0.15 + r() * 0.7), y: c.y + c.h * 0.62, vx: 0, vy: 420 + r() * 160, a: 0, s: 1, fl: ground });
        }
        if (waterT > 0) {
          waterT -= dt;
          const c = rel(can);
          const wx = c.x + c.w * 0.9, wy = c.y + c.h * 0.36;
          for (let i = 0; i < 3; i++) parts.push({ k: "drop", x: wx + (r() - 0.5) * 10, y: wy, vx: 50 + r() * 40, vy: 20 + r() * 40, a: 0, s: 1, g: 1, fl: ground + 6 });
        }
        if (parts.length > 260) parts.splice(0, parts.length - 260);
        if (!parts.length && !drew) return;
        fg.clearRect(0, 0, W, H);
        drew = parts.length > 0;
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.a += dt * 2;
          if (p.f) {
            p.f -= dt * 1.5;
            if (p.f <= 0) {
              parts.splice(i, 1);
              continue;
            }
          }
          if (p.g) p.vy += 600 * dt;
          p.x += (p.vx + (p.k === "petal" || p.k === "leaf" || p.k === "snow" ? Math.sin(p.a) * 18 : 0)) * dt;
          p.y += p.vy * dt;
          if (p.y > (p.fl || H + 12) || p.x < -20 || p.x > W + 20) {
            parts.splice(i, 1);
            continue;
          }
          if (p.k === "rain" || p.k === "drop") {
            fg.strokeStyle = "rgba(110,190,240,.85)";
            fg.lineWidth = 3;
            fg.lineCap = "round";
            fg.beginPath();
            fg.moveTo(p.x, p.y);
            fg.lineTo(p.x, p.y + (p.k === "rain" ? 12 : 6));
            fg.stroke();
          } else {
            fg.globalAlpha = p.f ? Math.max(0, p.f) : 1;
            fg.fillStyle = p.k === "petal" ? "#ffb3cf" : p.k === "snow" ? "#ffffff" : p.c;
            fg.beginPath();
            if (p.k === "snow") fg.arc(p.x, p.y, p.s, 0, 6.29);
            else fg.ellipse(p.x, p.y, p.s, p.s * 0.55, p.a, 0, 6.29);
            fg.fill();
            fg.globalAlpha = 1;
          }
        }
      }
      function bugStep(dt) {
        if (!bugsOn || !st) return;
        bugT += dt;
        const bs = U.clamp(TL.S * 0.12, 36, 70);
        bugs.forEach((b, i) => {
          const t = bugT * (0.5 + i * 0.15) + i * 2;
          const x = TL.x + Math.sin(t * 0.8) * TL.w * 0.55 - bs / 2,
            y = TL.y - TL.S * (0.75 + Math.sin(t * 1.9) * 0.12 - i * 0.18);
          b.style.setProperty("--s", bs + "px");
          b.style.transform = "translate(" + x + "px," + y + "px) scaleX(" + (Math.cos(t * 0.8) > 0 ? -1 : 1) + ") rotate(" + Math.sin(t * 9) * 8 + "deg)";
        });
      }

      /* ---------- 소리 ---------- */
      const chime = (i) => A.note(A.SCALE[i % A.SCALE.length], { inst: "bell", dur: 0.45, vol: 0.18 });
      const arp = (ns) => ns.forEach((nn, i) => A.note(nn, { inst: "bell", dur: 0.5, vol: 0.14, when: i * 0.09 }));
      function cicadaSing() {
        const c = sprites.find((s) => s._name === "cicada");
        if (c) c.classList.add("sing");
        const r = c ? rel(c) : { x: TL.x, y: TL.y - TL.S * 0.3, w: 40, h: 40 };
        meme.style.transform = `translate(${r.x + r.w * 0.9}px,${r.y - r.h * 0.2}px)`;
        meme.classList.add("on");
        for (let i = 0; i < 4; i++) A.tone(1300, { to: 1500, dur: 0.16, vol: 0.03, when: i * 0.32, type: "triangle" });
        ctx.after(1500, () => {
          if (c) c.classList.remove("sing");
          meme.classList.remove("on");
        });
      }
      const sparkle = (x, y, n = 8) => KP.pfx.burst(st.ui, x, y, "spark", n, ctx);

      /* ---------- 1단계: 씨앗 → 나무 ---------- */
      async function seedPhase(r) {
        setSeason(0, "seed");
        soil.querySelector(".hole").src = spr("hole", 60, L());
        soil.querySelector(".sprout").src = spr("sprout", 90, L());
        soil.classList.add("ask");
        ctx.say("씨앗을 콕 심어 봐요!");
        ctx.hint(() => soil, "흙을 콕 눌러요!");
        await tapOnce(soil);
        if (!alive(r)) return false;
        soil.classList.remove("ask");
        ctx.hint(null);
        // 인형이 손에 든 씨앗을 흙에 쏙 → 고개 숙여 톡톡
        const sr = rel(soil);
        const from = act ? act.anchor("handL") : { x: sr.x, y: sr.y - 80 };
        await flyTo("seed", Math.max(30, TL.S * 0.07), from, { x: sr.x + sr.w / 2, y: sr.y + sr.h / 2 }, 600);
        if (!alive(r)) return false;
        soil.classList.add("seeded");
        A.sfx("drop");
        await nodPat(2);
        if (!alive(r)) return false;
        // 물뿌리개: 인형이 들고 있음 → 아이가 누르면 기울여 물을 줌
        hold(can, "handL", 0.16, -0.02, 0.42, spr("can", 120, L()));
        ctx.say("씨앗을 심었어요! 물뿌리개를 눌러 물을 줘요!");
        ctx.hint(() => can, "물뿌리개를 눌러요!");
        await tapOnce(can);
        if (!alive(r)) return false;
        can.classList.add("pour");
        pose({ fL: 0.75, nod: 0.15 });
        waterT = 1.2;
        A.sfx("water");
        ctx.after(400, () => A.sfx("water"));
        ctx.hint(null);
        await ctx.wait(1300);
        if (!alive(r)) return false;
        holdNone();
        soil.classList.add("wet", "sprouted");
        A.sfx("sparkle");
        sun.querySelector("img").src = spr("sun", 150, L());
        off(sun, false);
        ctx.say("새싹이 쏙 나왔어요! 해님을 눌러요!");
        ctx.hint(() => sun, "해님을 눌러요!");
        await tapOnce(sun);
        if (!alive(r)) return false;
        U.replay(sun, "shine");
        arp(["C5", "E5", "G5", "C6"]);
        ctx.hint(null);
        await ctx.wait(600);
        if (!alive(r)) return false;
        off(sun, true);
        soil.classList.remove("sprouted");
        treeL.className = "ssTreeL";
        A.sfx("levelup");
        for (let i = 0; i < 4; i++) ctx.after(i * 260, () => st && sparkle(TL.x + U.randf(-0.3, 0.3) * TL.w, TL.y - TL.S * U.randf(0.3, 0.9), 6));
        grown = true;
        if (act) act.happy();
        await ctx.say("쑥쑥 자라서 나무가 됐어요!");
        await ctx.wait(800);
        off(soil, true);
        return alive(r);
      }
      /** 작은 그림 하나를 a → b 로 휙 (포물선 느낌) */
      function flyTo(name, size, a, b, ms) {
        const f = U.el("div", "ssFly", '<img alt="" src="' + spr(name, size, L()) + '">');
        f.style.setProperty("--s", size + "px");
        f.style.transition = "none";
        f.style.transform = `translate(${a.x - size / 2}px,${a.y - size / 2}px)`;
        st.ui.appendChild(f);
        void f.offsetWidth;
        f.style.transition = `transform ${ms}ms cubic-bezier(.5,-0.4,.6,1)`;
        f.style.transform = `translate(${b.x - size / 2}px,${b.y - size / 2}px) scale(.8)`;
        return ctx.wait(ms + 30).then(() => f.remove());
      }

      /* ---------- 1단계: 계절마다 할 일 ---------- */
      function nearSpot(e, list) {
        let best = null,
          bd = 1e9;
        list.forEach((s) => {
          const b = s.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
          if (d < bd) {
            bd = d;
            best = s;
          }
        });
        return best;
      }
      function spotsDone(cls, onEach) {
        return new Promise((res) => {
          const left = () => sprites.filter((s) => s.classList.contains(cls));
          const hint = () => {
            if (left().length) ctx.hint(() => left()[0], null);
          };
          hint();
          tapZone.classList.add("on");
          tapZone._on = (e) => {
            const s = nearSpot(e, left());
            if (!s) return;
            onEach(s);
            if (!left().length) {
              tapZone._on = null;
              tapZone.classList.remove("on");
              ctx.hint(null);
              res();
            } else hint();
          };
        });
      }
      async function spring(r) {
        setSeason(0, "act");
        ctx.say("봄이 왔어요! 꽃봉오리를 콕콕 눌러 꽃을 피워요!");
        let i = 0;
        await spotsDone("bud", (s) => {
          s.classList.remove("bud");
          s.classList.add("open");
          s.querySelector("img").src = spr("flower", s._k * TL.S, L());
          U.replay(s, "open");
          A.sfx("pop");
          chime(i++ * 2);
          if (act) {
            if (i % 2) act.hop();
            else pose({ uR: 1.2 });
            ctx.after(400, () => pose({}));
          }
        });
        if (!alive(r)) return false;
        treeV = "full";
        renderTree();
        ctx.after(1200, () => alive(r) && season === 0 && clearSprites());
        setBugs(true);
        A.sfx("sparkle");
        if (act) act.wave(1.6);
        await ctx.say("꽃이 활짝 피었어요! 나비가 날아왔어요!");
        await ctx.wait(900);
        if (!alive(r)) return false;
        return seasonWin({ msg: "봄 🌸", quiet: true });
      }
      async function summer(r) {
        setSeason(1, "act");
        ctx.say("여름이 왔어요! 구름을 눌러 비를 내려요!");
        for (let k = 0; k < 3; k++) {
          ctx.hint(() => cloud, "구름을 눌러요!");
          await tapOnce(cloud);
          if (!alive(r)) return false;
          ctx.hint(null);
          U.replay(cloud, "ssHop");
          cloud.querySelector("img").src = spr("rainCloud", 200, L());
          rainT = 1.2;
          pose({ uR: 2.3, uL: 2.3, nod: -0.1 }); // 비 온다! 두 손을 머리 위로
          A.sfx("water");
          ctx.after(350, () => A.sfx("water"));
          ctx.after(700, () => A.sfx("water"));
          await ctx.wait(1300);
          if (!alive(r)) return false;
          pose({});
          cloud.querySelector("img").src = spr("cloud", 200, L());
        }
        off(cloud, true);
        arp(["G5", "C6", "E6"]);
        await ctx.wait(700);
        if (!alive(r)) return false;
        addSprites("cicada", [[0.02, -0.25]], 0.13);
        cicadaSing();
        if (act) act.happy();
        await ctx.say("시원한 소나기! 매미가 맴맴 노래해요!");
        await ctx.wait(700);
        if (!alive(r)) return false;
        return seasonWin({ msg: "여름 ☀️", quiet: true });
      }
      async function autumn(r) {
        setSeason(2, "act");
        // 인형이 바구니를 두 손으로 들고 있음
        if (act) act.hug(true);
        hold(basket, "belly", 0, 0.1, 0.42, spr("basket", 120, L()));
        basket.querySelector("b").textContent = "0";
        ctx.say("가을이 왔어요! 빨간 사과를 따서 바구니에 담아요!");
        let got = 0;
        await spotsDone("fruit", (s) => {
          s.classList.remove("fruit");
          const a = rel(s), b = rel(basket);
          s.style.visibility = "hidden";
          flyTo("apple", a.w, { x: a.x + a.w / 2, y: a.y + a.h / 2 }, { x: b.x + b.w / 2, y: b.y + b.h * 0.35 }, 700);
          A.sfx("pick");
          const n = ++got;
          ctx.after(700, () => {
            basket.querySelector("b").textContent = n;
            U.replay(basket, "ssSqz");
            A.sfx("drop");
            if (act) act.hop();
          });
        });
        if (!alive(r)) return false;
        await ctx.wait(800);
        if (!alive(r)) return false;
        leafRate = 2.2;
        A.sfx("whoosh");
        if (act) act.happy();
        await ctx.say("사과를 다 땄어요! 나뭇잎이 알록달록 떨어져요!");
        await ctx.wait(900);
        if (!alive(r)) return false;
        holdNone();
        return seasonWin({ msg: "가을 🍁", quiet: true });
      }
      async function winter(r) {
        setSeason(3, "act");
        ctx.say("겨울이 왔어요! 눈을 콕콕 눌러 눈사람을 만들어요!");
        for (let k = 1; k <= 3; k++) {
          ctx.hint(() => man, "눈을 콕 눌러요!");
          await tapOnce(man);
          if (!alive(r)) return false;
          man.dataset.n = String(k);
          man.querySelector("img").src = spr("sm" + k, 200, L());
          U.replay(man, "ssSqz");
          const mr = rel(man);
          sparkle(mr.x + mr.w / 2, mr.y + mr.h * 0.5, 5);
          A.sfx(k === 3 ? "sparkle" : "boing");
          chime(k * 2);
          nodPat(1); // 인형도 토닥토닥
        }
        ctx.hint(null);
        if (act) {
          act.happy();
          act.wave(1.4);
        }
        await ctx.say("눈사람 완성!");
        await ctx.wait(600);
        if (!alive(r)) return false;
        ctx.score.add();
        return ctx.win({ big: true, msg: "{부름} 사계절 박사!" });
      }
      /** 봄·여름·가을 축하: ctx.win 그대로(열쇠 별·마지막 판 처리 포함) 하되 단계 연승(streak)에는 넣지 않음 */
      function seasonWin(o) {
        const lv = KP.level.get("seasons");
        const keep = lv.streak || 0;
        lv.streak = -1; // win 이 +1 → 0, 3연승 승급 안 됨
        KP.level.save("seasons", lv);
        const p = ctx.win(o);
        const lv2 = KP.level.get("seasons");
        lv2.streak = keep;
        KP.level.save("seasons", lv2);
        return p;
      }
      async function cycle(r) {
        if (!grown && !(await seedPhase(r))) return;
        for (const f of [spring, summer, autumn, winter]) if (!(await f(r)) || !alive(r)) return;
        setSeason(0, "full");
        A.sfx("sparkle");
        await ctx.say("다시 봄이 와요!");
        await ctx.wait(900);
        if (alive(r)) next();
      }

      /* ---------- 작은 정원 그림 (2·3단계 보기) ---------- */
      const thumbs = {};
      async function thumb(k) {
        if (thumbs[k]) return thumbs[k];
        const im = await loadImg(BGF[k]);
        const cw = 320, ch = 380, c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        const g = c.getContext("2d");
        const sp = SPOT[k];
        // 흙 자리 둘레를 잘라 그림 (가로 0.5 · 세로 0.45 정도)
        const sw0 = 0.4 * 1344, sh0 = sw0 * (ch / cw);
        const sx = sp[0] * 1344 - sw0 / 2, sy = U.clamp(sp[1] * 752 + sh0 * 0.2 - sh0, 0, 752 - sh0);
        if (im) g.drawImage(im, sx, sy, sw0, sh0, 0, 0, cw, ch);
        else {
          g.fillStyle = ["#bfe6c8", "#9fd6ff", "#ffd9a8", "#e6eef8"][k];
          g.fillRect(0, 0, cw, ch);
        }
        const bx = ((sp[0] * 1344 - sx) / sw0) * cw, by = ((sp[1] * 752 - sp[3] * 752 * 0.15 - sy) / sh0) * ch;
        const S = ch * 0.64;
        g.setTransform(S, 0, 0, S, bx, by);
        drawTree(g, k, "full", LIGHT[k], cw, ch, true);
        g.setTransform(1, 0, 0, 1, 0, 0);
        thumbs[k] = c.toDataURL("image/jpeg", 0.85);
        return thumbs[k];
      }

      /* ---------- 2단계: 다음은 어떤 계절? ---------- */
      let lastQ = -1,
        round2 = 0;
      async function quizNext(r) {
        let k = U.rand(4);
        if (k === lastQ) k = (k + 1 + U.rand(3)) % 4;
        lastQ = k;
        grown = true;
        treeL.className = "ssTreeL";
        setSeason(k, "full");
        const nx = (k + 1) % 4,
          now = SEA[k].name,
          nxt = SEA[nx].name;
        const th = await Promise.all([0, 1, 2, 3].map(thumb));
        if (!alive(r)) return;
        const q = now + " 다음은 어떤 계절일까요?";
        ctx.say("지금은 " + now + "이에요. 다음은 어떤 계절일까요?");
        if (act) {
          tiltOn = true;
          pose({ tilt: 0.12 });
        }
        const btns = ctx.choices(ask, [0, 1, 2, 3], {
          cls: "ssCh",
          render: (v) => '<img alt="" src="' + th[v] + '"><span>' + SEA[v].name + "</span>",
          right: (v) => v === nx,
          wrongMsg: (v) => {
            if (act) {
              pose({ tilt: -0.2 }); // 갸웃
              ctx.after(900, () => pose({ tilt: 0.12 }));
            }
            return v === k ? "지금이 " + now + "이에요. 그 다음 계절을 찾아봐요!" : q;
          },
          onRight: async () => {
            ctx.hint(null);
            tiltOn = false;
            pose({});
            setSeason(nx, "full");
            if (nx === 1) ctx.after(400, cicadaSing);
            if (act) act.happy();
            arp(["C5", "E5", "G5", "C6"]);
            KP.voice.say("딩동댕! " + now + " 다음은 " + nxt + "!");
            ctx.score.add();
            round2++;
            await ctx.wait(2200);
            if (!alive(r)) return;
            const big = round2 % 4 === 0;
            const ok = await ctx.win({ big, msg: big ? "{부름} 계절 박사!" : nxt + " " + SEA[nx].em, quiet: !big });
            if (ok) next();
          },
        });
        ctx.hint(() => btns.find((b) => b.dataset.right), q);
      }

      /* ---------- 3단계: 계절 물건 나누기 ---------- */
      let lastItems = [],
        round3 = 0;
      async function sortNext(r) {
        sort.innerHTML = "";
        const th = await Promise.all([0, 1, 2, 3].map(thumb));
        if (!alive(r)) return;
        const trees = SEA.map((s, k) => {
          const t = U.el("div", "ssMini k" + k, '<img class="th" alt="" src="' + th[k] + '"><span>' + s.name + '</span><div class="got"></div>');
          t.dataset.k = k;
          sort.appendChild(t);
          return t;
        });
        const tray = U.el("div", "ssTray");
        sort.appendChild(tray);
        // 서로 다른 계절 3개 (지난 판과 같은 물건은 되도록 피함)
        const ks = U.sample([0, 1, 2, 3], 3);
        const pick = ks.map((k) => {
          const pool = ITEMS.filter((it) => it[2] === k && !lastItems.includes(it[0]));
          return U.pick(pool.length ? pool : ITEMS.filter((it) => it[2] === k));
        });
        lastItems = pick.map((p) => p[0]);
        const imgs = await Promise.all(pick.map((it) => clayEmoji(it[0], 110).catch(() => null)));
        if (!alive(r)) return;
        const src = (it) => imgs[pick.indexOf(it)] || KP.esrc(it[0]);
        // 나무 4그루(놓을 곳 4곳) 중에서 고르는 판 = 보기 충분 → 열쇠 별 받을 수 있음.
        // fewChoice(false): 놀이가 직접 정함(KP.drag 자동 판정 끔). 자동 판정도 놓을 곳이 4곳이라 같은 결과지만 뜻을 분명히 함
        ctx.fewChoice(false);
        let left = pick.length;
        const els = U.shuffle(pick.slice()).map((it, i) => {
          const el = U.el("div", "ssItem item", '<img alt="" draggable="false" src="' + src(it) + '">');
          el.style.setProperty("--i", i);
          el.dataset.k = it[2]; // 점검용
          tray.appendChild(el);
          const d = KP.drag(el, {
            targets: () => trees,
            accept: (t) => +t.dataset.k === it[2],
            onReject: (t) => ctx.miss(t, "음, 다른 계절일까요?"),
            onDrop: (t) => {
              if (!t || !alive(r)) return;
              d.lock();
              el.remove();
              t.querySelector(".got").insertAdjacentHTML("beforeend", '<img alt="" src="' + src(it) + '">');
              U.replay(t, "jump");
              A.sfx("snap");
              chime(it[2] * 2);
              KP.voice.say(it[3]);
              left--;
              if (!left) done();
              else hint();
            },
          });
          return el;
        });
        const hint = () => {
          const el = els.find((x) => x.isConnected);
          if (el) ctx.hint(() => (el.isConnected ? el : null), "물건을 끌어서 알맞은 계절 나무에 넣어요!");
        };
        ctx.say("물건을 끌어서 알맞은 계절 나무에 넣어요!");
        hint();
        const done = async () => {
          ctx.hint(null);
          ctx.score.add();
          round3++;
          await ctx.wait(1600);
          if (!alive(r)) return;
          const big = round3 % 3 === 0;
          const ok = await ctx.win({ big, msg: big ? "{부름} 계절 박사!" : "다 넣었다!" });
          if (ok) next();
        };
      }

      /* ---------- 판 고르기 ---------- */
      async function next() {
        const r = ++rid;
        const lv = ctx.level;
        ctx.hint(null);
        tiltOn = false;
        pose({});
        scene.style.display = lv === 3 ? "none" : "";
        ask.style.display = lv === 2 ? "" : "none";
        sort.style.display = lv === 3 ? "" : "none";
        ask.innerHTML = "";
        if (lv === 3) {
          if (st) dropStage(); // 3단계는 무대(3D) 없이 — 그래픽 메모리 돌려줌
          return sortNext(r);
        }
        if (!st) {
          if (!(await ready(r))) return;
        }
        if (lv === 1) cycle(r);
        else quizNext(r);
      }
      /** 무대 + 인형 준비 (처음·다시 만들 때) */
      async function ready(r) {
        scene.querySelectorAll(".ssLoad").forEach((e) => e.remove());
        const wait = U.el("div", "ssLoad", KP.E("🌳") + " 준비 중");
        const wt = ctx.after(400, () => scene.appendChild(wait));
        const s = await makeStage();
        if (!s || !alive(r)) {
          ctx.cancel(wt);
          wait.remove();
          return false;
        }
        const a = await makeActor(s);
        ctx.cancel(wt);
        wait.remove();
        if (!alive(r) || st !== s) {
          if (a) a.dispose();
          return false;
        }
        act = ctx.actor = a;
        fw = a ? KP.dollFollow(s.ui, a, { cls: "dfT" }) : null;
        if (a) {
          // 왼쪽 밖에서 폴짝 들어옴
          layout();
          ctx._dollEntering = true;
          const tgt = dollAt || s.spot("tree");
          a.place(tgt[0] - s.pxToWorld(tgt[0], tgt[1], s.w * 0.5), tgt[1]);
          a.jumpTo(tgt[0], tgt[1], 0.8, 0.5).then(() => {
            ctx._dollEntering = false;
            layout();
          });
        }
        ctx.loop((dt) => {
          if (st !== s || s.dead) return false;
          s.tick(dt);
          poseStep(dt, s.time);
          if (fw) fw.update();
          step(dt);
          bugStep(dt);
        });
        // 점검용
        ctx.ssState = () => ({ season, grown, gl: !!(st && st.gl), painted: !!(act && act.painted), who: act && act.name, tree: treeL.className, bg: bgK, sprites: sprites.length, level: ctx.level });
        return true;
      }
      ctx.begin = (again) => {
        rid++;
        parts.length = 0;
        rainT = waterT = 0;
        if (!again) round2 = round3 = 0;
        dropStage();
        if (!again) {
          grown = false;
          bgK = -1;
          season = 0;
        }
        next();
      };
      ctx.drop = () => {
        rid++;
        dropStage();
        holdNone();
      };
      ctx.ssParts = {
        soil, sun, cloud, man, can, tapZone,
        sprites: () => sprites,
      };
      // 점검용
      ctx.ssDbg = { setSeason, tree: () => [cvA.className, cvB.className, front === cvA ? "A" : "B", treeKey, getComputedStyle(cvA).opacity, getComputedStyle(cvB).opacity] };
    },
    start(ctx) {
      ctx.begin();
    },
    stop(ctx) {
      ctx.drop();
    },
  });
})();

;

/* ==== js/games/smart/shadow.js ==== */
/* 그림자 찾기 — 위 그림과 똑같은 그림자를 골라요. 맞히면 그림자에 색이 아래부터 차올라요.
   1단계: 3개, 모양이 확 다른 것 / 2단계: 3개, 같은 무리(바다·새·탈것·과일)
   3단계: 4개, 윤곽이 비슷한 무리(동물 얼굴 등) */
"use strict";
KP.game({
  id: "shadow",
  icon: "🌓",
  name: "그림자 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("shadow", `
      .shdWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 18px}
      .shdPic{position:relative;font-size:var(--psz);line-height:1;background:#fff;border-radius:36px;padding:clamp(12px,2vw,22px);box-shadow:0 8px 0 rgba(47,58,102,.12);border:5px solid #ffe7a3}
      .shdPic .e{display:block}
      .shdPic.fly{animation:shdFly .9s}
      @keyframes shdFly{30%{transform:translateY(-18px) rotate(-6deg) scale(1.08)}60%{transform:translateY(0) rotate(4deg)}}
      .shdGrid{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);gap:clamp(12px,2.4vw,28px);justify-content:center}
      @media (max-aspect-ratio:1/1){.shdGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}.shdWrap{--psz:var(--pszp)!important}
        /* 세로 폰 보기 3개: 2+1 (셋째는 가운데) → 그림자를 크게 */
        .shdGrid.three>.shdBtn:nth-child(3){grid-column:1/-1;justify-self:center}}
      .shdBtn{background:#e9eef8;border-radius:28px;padding:clamp(8px,1.2vw,14px)}
      .shdBox{position:relative;display:block;width:var(--sz);height:var(--sz);font-size:var(--sz);line-height:1}
      .shdBox .e{position:absolute;inset:0;width:100%;height:100%}
      .shdSil .e{filter:brightness(0) opacity(.75)}
      .shdCol{position:absolute;inset:0;clip-path:inset(100% 0 0 0);transition:clip-path 1s ease-in-out}
      .shdFill .shdCol{clip-path:inset(0 0 0 0)}
      .shdBtn.right{background:#d9ffe4}
      .shdFill{animation:shdHop .5s 1.1s 2}
      @keyframes shdHop{40%{transform:translateY(-16px) scale(1.06)}}
    `);
    ctx.wrap = U.el("div", "shdWrap");
    ctx.pic = U.el("div", "shdPic");
    ctx.grid = U.el("div", "shdGrid");
    ctx.wrap.append(ctx.pic, ctx.grid);
    ctx.body.appendChild(ctx.wrap);
    ctx.EASY = [
      ["🐘", "코끼리"], ["🦒", "기린"], ["🐌", "달팽이"], ["⭐", "별"], ["🎈", "풍선"], ["🌙", "달"], ["☂️", "우산"], ["🍌", "바나나"],
      ["✈️", "비행기"], ["🚲", "자전거"], ["🦖", "공룡"], ["🐟", "물고기"], ["🍎", "사과"], ["🐢", "거북이"], ["🦀", "꽃게"],
    ];
    ctx.GROUPS = {
      sea: [["🐟", "물고기"], ["🐠", "열대어"], ["🐡", "복어"], ["🐬", "돌고래"], ["🐳", "고래"], ["🦈", "상어"], ["🐙", "문어"], ["🦀", "꽃게"]],
      bird: [["🦆", "오리"], ["🐔", "닭"], ["🐤", "병아리"], ["🦉", "부엉이"], ["🦜", "앵무새"], ["🐧", "펭귄"], ["🦅", "독수리"], ["🕊️", "비둘기"]],
      car: [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚜", "트랙터"], ["🚑", "구급차"], ["🚓", "경찰차"], ["🚂", "기차"], ["🚁", "헬리콥터"]],
      fruit: [["🍎", "사과"], ["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"], ["🍐", "배"], ["🍒", "체리"], ["🍍", "파인애플"]],
      // 얼굴: 곰·판다·코알라·호랑이·개구리는 그림자가 거의 같아서 뺌
      face: [["🐻", "곰"], ["🐷", "돼지"], ["🐵", "원숭이"], ["🐭", "쥐"], ["🐰", "토끼"], ["🐱", "고양이"], ["🦊", "여우"], ["🐮", "소"], ["🐶", "강아지"], ["🦁", "사자"]],
    };
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
    let list;
    if (lv === 1) list = U.sample(ctx.EASY, 3);
    else if (lv === 2) list = U.sample(ctx.GROUPS[U.pick(["sea", "bird", "car", "fruit"])], 3);
    else list = U.sample(ctx.GROUPS[U.pick(["face", "face", "sea", "bird", "car"])], 4);
    let target = U.pick(list);
    if (ctx.last && target[0] === ctx.last) target = list.find((x) => x !== target);
    ctx.last = target[0];
    ctx.pic.innerHTML = KP.E(target[0]);
    U.replay(ctx.pic, "pop");
    ctx.wrap.style.setProperty("--psz", "clamp(90px,min(16vw,22vh),170px)");
    ctx.wrap.style.setProperty("--pszp", "clamp(90px,34vw,150px)");
    ctx.grid.style.setProperty("--cl", list.length);
    ctx.grid.style.setProperty("--cp", 2);
    ctx.grid.classList.toggle("three", list.length === 3);
    ctx.grid.style.setProperty("--szl", list.length === 3 ? "clamp(80px,min(15vw,24vh),170px)" : "clamp(76px,min(13vw,22vh),150px)");
    ctx.grid.style.setProperty("--szp", list.length === 3 ? "clamp(80px,min(36vw,16vh),150px)" : "clamp(76px,min(34vw,15vh),130px)");
    const ask = U.josa(target[1], "이/가") + " 숨었어요! " + target[1] + " 그림자를 찾아요!";
    // "트랙터가"처럼 녹음 없는 조각이면 "트랙터! 숨었어요! …"(이미 있는 조각)로
    const askV = KP.voice._natUrls && !KP.voice._natUrls(ask) ? target[1] + "! 숨었어요! " + target[1] + " 그림자를 찾아요!" : ask;
    ctx.say("🌓 " + ask, askV);
    const btns = ctx.choices(ctx.grid, U.shuffle(list), {
      cls: "shdBtn",
      render: (v) => '<span class="shdBox"><span class="shdSil">' + KP.E(v[0]) + '</span><span class="shdCol">' + KP.E(v[0]) + "</span></span>",
      right: (v) => v === target,
      wrongMsg: (v) => "이건 " + v[1] + " 그림자예요. " + target[1] + " 그림자를 찾아봐요!",
      onRight: async (v, b) => {
        b.classList.add("shdFill");
        U.replay(ctx.pic, "fly");
        [0, 0.12, 0.24, 0.36, 0.48].forEach((w, i) => KP.audio.note(KP.audio.SCALE[i * 2], { inst: "bell", dur: 0.4, vol: 0.18, when: w }));
        KP.voice.say("딩동댕! " + target[1] + " 그림자!");
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1700);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 그림자 탐정!" : "똑같아요!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), target[1] + " 그림자를 찾아요!");
  },
});

;

/* ==== js/games/smart/shape.js ==== */
/* 모양 찾기 — 말한 모양을 찾아 눌러요. 모양 친구들은 맞히면 웃으며 폴짝!
   1단계: 동그라미·네모·세모 3개 (색이 모두 다름)
   2단계: 6가지 모양 중 4개 (모두 같은 색 → 모양만 보고 찾기)
   3단계: 생활 물건에서 모양 찾기 (🍕 세모, ⚽ 동그라미, 📺 네모, 🪁 마름모, ⭐ 별, 💝 하트 — 6가지 모양 모두 정답이 될 수 있음)
   음성: "도넛은 동그라미 모양이에요."처럼 녹음 없는 조합은 "이건 도넛! 동그라미 모양이에요."(이미 있는 조각)로 */
"use strict";
KP.game({
  id: "shape",
  icon: "🔷",
  name: "모양 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("shape", `
      .shpWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,26px);padding:6px 12px 20px}
      .shpRef{display:none;align-items:center;gap:12px;background:#fff;border-radius:28px;padding:10px 22px;box-shadow:var(--shadow)}
      .shpRef.on{display:flex}
      .shpRef svg{width:clamp(70px,min(16vw,14vh),130px);height:clamp(70px,min(16vw,14vh),130px)}
      .shpGrid{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);justify-content:center;align-content:center;gap:clamp(14px,3vw,34px)}
      @media (max-aspect-ratio:1/1){.shpGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .shpBtn{padding:clamp(8px,1.4vw,16px);border-radius:30px}
      .shpBtn svg{display:block;width:var(--sz);height:var(--sz);overflow:visible}
      .shpObj{font-size:var(--sz);border-radius:30px;padding:clamp(10px,1.4vw,16px)}
      .shpHappy{animation:shpHop .55s 2}
      @keyframes shpHop{30%{transform:translateY(-26px) rotate(8deg) scale(1.08)}60%{transform:translateY(0) scale(1.08,.92)}}
      .shpMouth2{display:none}.shpHappy .shpMouth2{display:inline}.shpHappy .shpMouth{display:none}
      .shpRing{animation:shpRing 1s ease-out}
      @keyframes shpRing{from{box-shadow:0 0 0 0 rgba(47,180,102,.7)}to{box-shadow:0 0 0 40px rgba(47,180,102,0)}}
    `);
    ctx.wrap = U.el("div", "shpWrap");
    ctx.ref = U.el("div", "shpRef");
    ctx.grid = U.el("div", "shpGrid");
    ctx.wrap.append(ctx.ref, ctx.grid);
    ctx.body.appendChild(ctx.wrap);
    const star = (() => {
      const p = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 21 : 47,
          a = -Math.PI / 2 + (i * Math.PI) / 5;
        p.push((50 + Math.cos(a) * r).toFixed(1) + "," + (54 + Math.sin(a) * r).toFixed(1));
      }
      return p.join(" ");
    })();
    // [키, 이름, svg 모양, 얼굴 높이]
    ctx.SHAPES = {
      circle: ["동그라미", '<circle cx="50" cy="50" r="45"/>', 50],
      square: ["네모", '<rect x="7" y="7" width="86" height="86" rx="10"/>', 50],
      triangle: ["세모", '<path d="M50 5 L96 91 L4 91 Z" stroke-linejoin="round"/>', 64],
      star: ["별", '<polygon points="' + star + '" stroke-linejoin="round"/>', 56],
      heart: ["하트", '<path d="M50 92 C22 72 4 54 4 32 C4 15 17 5 31 5 C41 5 47 11 50 19 C53 11 59 5 69 5 C83 5 96 15 96 32 C96 54 78 72 50 92 Z"/>', 40],
      diamond: ["마름모", '<polygon points="50,3 97,50 50,97 3,50" stroke-linejoin="round"/>', 50],
    };
    ctx.COLORS = ["#ff5b6e", "#ffb020", "#3fbf6a", "#3b8cff", "#a259ff", "#ff7eb9"];
    // 3단계 생활 물건 [그림, 이름, 모양]
    ctx.OBJ = [
      ["⚽", "축구공", "circle"], ["🍩", "도넛", "circle"], ["🍪", "쿠키", "circle"], ["🏀", "농구공", "circle"],
      ["🍕", "피자", "triangle"], ["🧀", "치즈", "triangle"], ["🍙", "주먹밥", "triangle"], ["⛺", "텐트", "triangle"],
      ["📺", "텔레비전", "square"], ["🎁", "선물 상자", "square"], ["🖼️", "액자", "square"], ["🚪", "문", "square"],
      ["🍊", "귤", "circle"], ["🌕", "달", "circle"],
      ["🪁", "연", "diamond"], ["⭐", "별", "star"], ["🌟", "반짝별", "star"], ["❤️", "하트", "heart"], ["💝", "하트 상자", "heart"],
    ];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 모양 그림(웃는 얼굴) */
  svg(ctx, k, color, face = true, dashed = false) {
    const [, body, fy] = ctx.SHAPES[k];
    const style = dashed
      ? 'fill="#f3f6fc" stroke="#9aa6c8" stroke-width="5" stroke-dasharray="10 8"'
      : 'fill="' + color + '" stroke="rgba(0,0,0,.16)" stroke-width="4"';
    let s = '<svg viewBox="0 0 100 100"><g ' + style + ">" + body + "</g>";
    if (face)
      s +=
        '<g transform="translate(0,' + (fy - 50) + ')"><circle cx="39" cy="48" r="5.5" fill="#2f3a66"/><circle cx="61" cy="48" r="5.5" fill="#2f3a66"/>' +
        '<circle cx="40.5" cy="46.3" r="1.8" fill="#fff"/><circle cx="62.5" cy="46.3" r="1.8" fill="#fff"/>' +
        '<circle cx="31" cy="57" r="4" fill="rgba(255,120,150,.45)"/><circle cx="69" cy="57" r="4" fill="rgba(255,120,150,.45)"/>' +
        '<g transform="translate(0,56)"><path class="shpMouth" d="M43 0 Q50 7 57 0" fill="none" stroke="#2f3a66" stroke-width="3" stroke-linecap="round"/>' +
        '<path class="shpMouth2" d="M41 -1 Q50 13 59 -1 Z" fill="#ff7a8a" stroke="#2f3a66" stroke-width="2.5" stroke-linejoin="round"/></g></g>';
    return s + "</svg>";
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    const S = ctx.SHAPES;
    let list, target, render, nameOf, ask;
    ctx.ref.classList.toggle("on", lv === 3);
    if (lv < 3) {
      const keys = lv === 1 ? ["circle", "square", "triangle"] : U.sample(Object.keys(S), 4);
      const one = U.pick(ctx.COLORS);
      const cols = U.shuffle([...ctx.COLORS]);
      list = U.shuffle(keys.map((k, i) => ({ k, c: lv === 1 ? cols[i] : one })));
      target = U.pick(list);
      if (target.k === ctx.lastK) target = list.find((x) => x !== target);
      ctx.lastK = target.k;
      render = (v) => self.svg(ctx, v.k, v.c);
      nameOf = (v) => S[v.k][0];
      ask = U.josa(S[target.k][0], "을/를") + " 찾아요!";
      ctx.grid.style.setProperty("--cl", list.length);
      ctx.grid.style.setProperty("--cp", lv === 1 ? 1 : 2);
      ctx.grid.style.setProperty("--szl", lv === 1 ? "clamp(90px,min(18vw,30vh),200px)" : "clamp(90px,min(15vw,24vh),170px)");
      ctx.grid.style.setProperty("--szp", lv === 1 ? "clamp(90px,min(40vw,19vh),170px)" : "clamp(90px,min(34vw,19vh),160px)");
    } else {
      const groups = ["circle", "triangle", "square", "diamond", "star", "heart"];
      let tk = U.pick(groups);
      if (tk === ctx.lastK) tk = U.pick(groups.filter((g) => g !== tk));
      ctx.lastK = tk;
      target = U.pick(ctx.OBJ.filter((o) => o[2] === tk));
      const otherKinds = U.sample(Object.keys(S).filter((k) => k !== tk), 3);
      list = U.shuffle([target, ...otherKinds.map((k) => U.pick(ctx.OBJ.filter((o) => o[2] === k)))]);
      render = (o) => KP.E(o[0]);
      nameOf = (o) => o[1];
      ctx.ref.innerHTML = self.svg(ctx, tk, "", false, true);
      ask = S[tk][0] + " 모양을 찾아요!";
      ctx.grid.style.setProperty("--cl", 4);
      ctx.grid.style.setProperty("--cp", 2);
      ctx.grid.style.setProperty("--szl", "clamp(64px,min(13vw,22vh),150px)");
      ctx.grid.style.setProperty("--szp", "clamp(64px,min(28vw,14vh),130px)");
    }
    ctx.say("🔷 " + ask);
    // 같은 뜻 문장 중 자연 음성이 있는 것
    const nat = (...l) => (KP.voice._natUrls && l.find((t) => KP.voice._natUrls(t))) || l[0];
    const btns = ctx.choices(ctx.grid, list, {
      cls: lv < 3 ? "shpBtn" : "shpObj",
      render,
      right: (v) => v === target,
      wrongMsg: (v) =>
        lv < 3
          ? "이건 " + U.josa(nameOf(v), "이에요/예요") + ". " + ask
          : nat(U.josa(nameOf(v), "은/는") + " " + S[v[2]][0] + " 모양이에요. " + ask, "이건 " + nameOf(v) + "! " + S[v[2]][0] + " 모양이에요. " + ask),
      onRight: async (v, b) => {
        b.classList.add("shpHappy", "shpRing");
        KP.audio.sfx("boing");
        KP.voice.say(lv < 3 ? nameOf(v) + "! 딩동댕!" : nat(U.josa(nameOf(v), "은/는") + " " + S[v[2]][0] + " 모양! 딩동댕!", nameOf(v) + "! " + S[v[2]][0] + " 모양! 딩동댕!"));
        if (lv === 3) U.replay(ctx.ref, "jump");
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1000);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 모양 박사!" : (lv < 3 ? nameOf(v) : S[v[2]][0]) + "!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});

;

/* ==== js/games/smart/size.js ==== */
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
    const sumK = ks.reduce((a, b) => a + Math.max(b, 0.56), 0); // 작은 칸도 최소 84px(.choice) → 작은 그림은 0.56 으로 셈
    ctx.shelf.style.setProperty("--szp", "clamp(64px,calc((100vw - " + (16 * n + 8 * (n - 1) + 68) + "px) / " + sumK.toFixed(2) + "),min(" + (n === 3 ? 170 : 150) + "px,32vh))");
    ctx.shelf.innerHTML = "";
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
      ctx.shelf.appendChild(b);
      return b;
    });
    const hint = () => ctx.hint(() => btns.find((b) => +b.dataset.seq === step), step === 0 ? first : "그다음 큰 걸 눌러요!");
    // "제일 작은 OO부터" 녹음이 없는 그림은 이미 있는 문장으로
    const first = KP.voice._natUrls && !KP.voice._natUrls("제일 작은 " + name + "부터 눌러요!") ? say : "제일 작은 " + name + "부터 눌러요!";
    hint();
  },
});
