/* ABC 놀이 — 위쪽 버튼으로 [배우기]/[퀴즈] 전환. (1단계는 배우기로, 2단계부터 퀴즈로 시작)
   배우기: A~Z 카드(대문자·소문자+그림+낱말). 누르면 크게 나오며 영어 발음 "A! Apple!"
           크게 본 카드는 바깥을 누를 때까지 그대로 — [따라 쓰기](ABC 쓰기 공책) · [다른 낱말] · 그림을 누르면 다시 읽기
   퀴즈 1단계: "Find A!" 글자 3개 (닮지 않은 글자만 — 쉬움은 그대로, 찍어 맞히기 방지)
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
      .abSpotBtns .btn{min-height:64px}
      .abBig .abHintW{font-size:.32em;color:var(--ink);letter-spacing:1px}
      .abBig .abHintW b{color:var(--coral);font-weight:400}
      .abBig .abLow{color:var(--c);font-size:.95em}
      .abSpot.on .abSpotBox{animation:popBig .45s cubic-bezier(.2,1.6,.4,1)}
      .abSpotBox .abCh{font-size:clamp(100px,15vw,180px)}
      .abSpotPic .e{font-size:clamp(90px,min(13vw,22vh),160px)}
      .abSpotBox .abW{font-size:clamp(28px,4vw,46px);display:block;text-align:center}
      @media (max-aspect-ratio:1/1){.abSpotRow{flex-direction:column;gap:6px}}
      @media (max-height:500px){.abSpotBox .abCh{font-size:clamp(70px,22vh,120px)}.abSpotPic .e{font-size:clamp(60px,20vh,110px)}.abSpotBox .abW{font-size:24px}}
      @media (orientation:portrait) and (max-height:700px){.abSpotBox .abCh{font-size:clamp(70px,14vh,110px)}.abSpotPic .e{font-size:clamp(60px,12vh,100px)}.abSpotBox .abW{font-size:26px}.abSpotBox{gap:8px}}
      /* 폰 가로: 글자·그림 | 단추를 옆으로 놓아 카드 아래가 잘리지 않게 */
      @media (orientation:landscape) and (max-height:500px){.abSpot{padding:6px 0}.abSpotBox{flex-direction:row;gap:clamp(12px,3vw,28px);padding:10px clamp(16px,3vw,28px);border-width:5px;max-height:100%;border-radius:32px}.abSpotBtns{flex-direction:column;flex-wrap:nowrap;gap:10px}.abSpotBox .abCh{font-size:clamp(60px,19vh,110px)}.abSpotPic .e{font-size:clamp(54px,17vh,100px)}.abSpotBox .abW{font-size:22px}}
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
          // 글자 타일은 .choice 가 아니라서 정답 표시를 직접 (손가락이 가리킨 판은 열쇠 별 없음)
          ctx.hint(() => tileEls.find((x) => !x.classList.contains("used") && x.textContent === word[pos]), "다음 글자를 찾아요!", { answer: true });
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
    ctx.hint(() => tileEls.find((x) => !x.classList.contains("used") && x.textContent === word[pos]), "첫 글자를 찾아요!", { answer: true });
  },
  quiz(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    const tk = ctx.spTok; // 탭(배우기·단어 만들기)을 바꾸면 mode() 가 올림
    const qk = (ctx.qk = (ctx.qk || 0) + 1); // 이번 물음 표시 — 다음 물음으로 넘어가면 지난 물음 다시 말하기 취소
    let solved = false;
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
    const n = lv === 1 ? 3 : lv === 2 ? 3 : 4; // 1단계도 보기 3개(2개면 찍어도 반 — 열쇠 별 규칙). 1·2단계는 닮은 글자를 빼서 쉬움 유지
    const big = U.btn("", "abBig");
    const ans = U.el("div", "abAns");
    ctx.q.append(big, ans);
    let others;
    if (lv === 3) {
      const like = (ctx.LIKE.filter((g) => g.includes(c)).join("") || "").replace(new RegExp(c, "g"), "");
      others = [...new Set(like)].slice(0, n - 1);
    } else others = [];
    const likeC = lv < 3 ? ctx.LIKE.filter((g) => g.includes(c)).join("") : "";
    let rest = U.shuffle(ctx.L.map((l) => l[0]).filter((x) => x !== c && !others.includes(x)));
    rest = [...rest.filter((x) => likeC.includes(x)), ...rest.filter((x) => !likeC.includes(x))]; // pop() 은 끝에서 → 닮지 않은 글자부터
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
      en = c + "!"; // 글자 이름은 대문자·소문자가 같음 — 대문자 "E!" 는 26개 모두 자연 음성(소문자 "e!" 는 기기 목소리)
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
        solved = true;
        U.replay(big, "yay");
        U.replay(b, "jump");
        KP.audio.sfx("good");
        sayRight();
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1400);
        if (tk !== ctx.spTok) return; // 그새 탭을 바꿨으면 그 화면에서 축하하지 않음
        const bg = ctx.round % 5 === 0;
        const ok = await ctx.win({ big: bg, msg: bg ? "{부름} ABC 박사!" : "딩동댕!", quiet: !bg });
        if (ok && ctx.m === "quiz" && tk === ctx.spTok) self.quiz(ctx);
      },
    });
    btns.forEach((b, i) => b.style.setProperty("--c", ctx.CC[(ti + i * 2) % ctx.CC.length]));
    // 틀리면 영어로 다시 들려주기 — 그새 정답을 눌렀거나 물음·탭이 바뀌었으면 말하지 않음
    btns.forEach((b) => !b.dataset.right && b.addEventListener("click", () => ctx.after(1900, () => {
      if (!solved && qk === ctx.qk && tk === ctx.spTok && ctx.m === "quiz" && ctx._active) KP.voice.en(en);
    })));
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});
