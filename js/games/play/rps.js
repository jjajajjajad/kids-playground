/* 가위바위보 — 곰돌이와 대결! 내 손을 고르면 "가위! 바위! 보!" 박자에 맞춰 손을 흔들다 짠!
   - 곰돌이 얼굴을 직접 그려서 결과마다 표정이 바뀜 (놀람·울상·웃음)
   - 누가 이겼는지 이유도 말해 줌 ("바위가 가위를 이겨요!")
   - 비기거나 져도 즐겁게!
   1단계: 진짜 가위바위보(운) — 아이가 더 자주 이기게, 2번 이길 때마다 축하(운이라 열쇠 별 없음)
   2단계: '곰돌이를 이겨라' — 곰돌이가 먼저 손을 보여 주면 이기는 손을 골라요(정답 있음 → 틀리면 miss, 이유 문장으로 알려 줌)
   3단계: 같은 문제인데 곰돌이 손을 잠깐(2초)만 보여 주고 ❓로 가림 — 기억해서 이기는 손 고르기 */
"use strict";
KP.game({
  id: "rps",
  icon: "✋",
  name: "가위바위보",
  cat: "play",
  levels: 3,
  score: "🏆",
  setup(ctx) {
    const U = KP.u;
    KP.css("rps", `
      .rp-arena{flex:1;min-height:0;position:relative;margin:0 12px 6px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#ffe9d6 0%,#fff6ea 50%,#e3f4ff 50%,#cdeaff 100%);display:flex;flex-direction:column;justify-content:space-around;align-items:center;padding:8px}
      .rp-row{display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,40px);width:100%}
      /* 낮고 넓은 화면(폰 가로): 위아래 두 줄이 안 들어가 '내 줄'이 잘렸음 → 곰돌이 | 가위바위보 | 나 를 좌우로 */
      .rp-arena.wide{flex-direction:row;justify-content:space-evenly;background:linear-gradient(90deg,#ffe9d6 0%,#fff6ea 50%,#e3f4ff 50%,#cdeaff 100%)}
      .rp-arena.wide .rp-row{width:auto;flex:1 1 0;min-width:0;gap:clamp(8px,2vw,24px)}
      .rp-arena.wide .rp-mid{min-height:0;flex:0 0 auto;max-width:34%}
      .rp-arena.wide .rp-res{white-space:normal}
      .rp-arena.wide .rp-hand.bear{transform:rotate(90deg)}
      .rp-arena.wide .rp-hand.mine{transform:rotate(-90deg)}
      .rp-arena.wide .rp-hand.bear.shake{animation-name:rp-shbw}
      .rp-arena.wide .rp-hand.mine.shake{animation-name:rp-shmw}
      @keyframes rp-shbw{50%{transform:rotate(90deg) translateY(25%)}}
      @keyframes rp-shmw{50%{transform:rotate(-90deg) translateY(25%)}}
      .rp-side{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
      .rp-face{width:var(--fs);height:var(--fs);position:relative}
      .rp-face svg{width:100%;height:100%;display:block;overflow:visible}
      .rp-face.me{font-size:var(--fs);line-height:1}
      .rp-face.me .e{width:100%;height:100%;display:block}
      .rp-name{font-size:clamp(16px,2.4vw,24px);background:#fff;padding:1px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.08);white-space:nowrap}
      .rp-pts{font-size:clamp(30px,4.6vw,48px);color:var(--ocean);min-width:1.4em;text-align:center;background:#fff;border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.08)}
      .rp-hand{width:var(--hs);height:var(--hs);font-size:var(--hs);line-height:1}
      .rp-hand .e{width:100%;height:100%;display:block}
      .rp-hand.bear{transform:rotate(180deg)}
      .rp-hand.bear.shake{animation:rp-shb .36s ease-in-out 3}
      .rp-hand.mine.shake{animation:rp-shm .36s ease-in-out 3}
      @keyframes rp-shb{50%{transform:rotate(180deg) translateY(25%)}}
      @keyframes rp-shm{50%{transform:translateY(25%)}}
      .rp-arena .rp-hand.bear.hid{transform:none}
      .rp-hand.reveal .e{animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .rp-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:clamp(70px,14vh,130px);text-align:center}
      .rp-vs{font-size:clamp(30px,5vw,54px);color:#ff7452;-webkit-text-stroke:2px #fff;paint-order:stroke}
      .rp-word{font-size:clamp(34px,6vw,64px);line-height:1.1;color:#fff;-webkit-text-stroke:5px #8a63ee;paint-order:stroke;text-shadow:0 5px 0 #6a3fd4;white-space:nowrap;}
      .rp-word:empty{display:none}
      .rp-word.show{animation:popBig .35s cubic-bezier(.2,1.6,.4,1)}
      .rp-res{font-size:clamp(20px,3vw,30px);color:var(--ink);background:#fff;border-radius:16px;padding:4px 12px;box-shadow:0 4px 0 rgba(0,0,0,.08);white-space:nowrap}
      .rp-res:empty{display:none}
      .rp-btns{flex:0 0 auto;display:flex;justify-content:center;gap:clamp(10px,2vw,24px);padding:6px 12px 14px}
      .rp-b{width:clamp(96px,14vw,150px);padding:8px 6px;border-radius:26px;background:#fff;box-shadow:0 8px 0 rgba(47,58,102,.14);display:flex;flex-direction:column;align-items:center;gap:2px;
        font-size:clamp(17px,2.4vw,24px);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*80ms)}
      .rp-b .e{font-size:clamp(50px,7vw,80px)}
      .rp-b:active{transform:translateY(5px)}
      .rp-b.sel{background:#fff5c9;box-shadow:0 0 0 5px #ffc531,0 8px 0 rgba(47,58,102,.14)}
      .rp-btns.off .rp-b:not(.sel){opacity:.4}
      .rp-face.jump{animation:jumpA .5s 2}
      .rp-face.sad svg{animation:rp-sad 1.2s ease-in-out}
      @keyframes rp-sad{30%{transform:rotate(-8deg)}60%{transform:rotate(6deg)}}
      .rp-face.laugh svg{animation:rp-laugh .25s ease-in-out 6 alternate}
      @keyframes rp-laugh{to{transform:translateY(-6px) rotate(3deg)}}
    `);
    // 곰돌이 얼굴 (표정: normal / happy / sad / wow)
    const FACE = {
      normal: {
        eyes: '<circle cx="70" cy="96" r="10" fill="#2a1d14"/><circle cx="130" cy="96" r="10" fill="#2a1d14"/><circle cx="73" cy="92" r="3.5" fill="#fff"/><circle cx="133" cy="92" r="3.5" fill="#fff"/>',
        mouth: '<path d="M86 142 Q100 154 114 142" fill="none" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>',
      },
      happy: {
        eyes: '<path d="M58 100 Q70 84 82 100" fill="none" stroke="#2a1d14" stroke-width="6" stroke-linecap="round"/><path d="M118 100 Q130 84 142 100" fill="none" stroke="#2a1d14" stroke-width="6" stroke-linecap="round"/>',
        mouth: '<path d="M80 138 Q100 172 120 138 Z" fill="#8a2f3c"/><path d="M90 152 Q100 164 110 152 Q100 148 90 152Z" fill="#ff8fa3"/>',
      },
      sad: {
        eyes: '<circle cx="70" cy="100" r="9" fill="#2a1d14"/><circle cx="130" cy="100" r="9" fill="#2a1d14"/><path d="M56 82 L80 88" stroke="#5a3a24" stroke-width="5" stroke-linecap="round"/><path d="M144 82 L120 88" stroke="#5a3a24" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M64 112 Q60 126 66 130 Q72 126 68 112Z" fill="#6cc3ff"/>',
        mouth: '<path d="M86 152 Q100 138 114 152" fill="none" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>',
      },
      wow: {
        eyes: '<circle cx="70" cy="94" r="14" fill="#fff" stroke="#2a1d14" stroke-width="3"/><circle cx="130" cy="94" r="14" fill="#fff" stroke="#2a1d14" stroke-width="3"/><circle cx="70" cy="96" r="6" fill="#2a1d14"/><circle cx="130" cy="96" r="6" fill="#2a1d14"/>',
        mouth: '<ellipse cx="100" cy="148" rx="11" ry="14" fill="#8a2f3c"/>',
      },
    };
    ctx.bearSVG = (mood) =>
      '<svg viewBox="0 0 200 200">' +
      '<circle cx="44" cy="46" r="30" fill="#a8754a"/><circle cx="44" cy="46" r="16" fill="#e8b48a"/><circle cx="156" cy="46" r="30" fill="#a8754a"/><circle cx="156" cy="46" r="16" fill="#e8b48a"/>' +
      '<circle cx="100" cy="108" r="82" fill="#c08a5a"/><circle cx="80" cy="80" r="40" fill="#cf9a69" opacity=".5"/>' +
      '<ellipse cx="100" cy="140" rx="44" ry="34" fill="#f2d4b2"/><ellipse cx="100" cy="122" rx="15" ry="11" fill="#3a2a20"/><ellipse cx="96" cy="118" rx="5" ry="3" fill="#fff" opacity=".6"/>' +
      '<ellipse cx="48" cy="128" rx="13" ry="8" fill="#ff8fa3" opacity=".55"/><ellipse cx="152" cy="128" rx="13" ry="8" fill="#ff8fa3" opacity=".55"/>' +
      FACE[mood].eyes + FACE[mood].mouth + "</svg>";

    const arena = U.el("div", "rp-arena");
    arena.innerHTML =
      '<div class="rp-row"><div class="rp-side"><div class="rp-face bear"></div><div class="rp-name">곰돌이</div></div><div class="rp-hand bear">' + KP.E("✊") + '</div><div class="rp-pts bp">0</div></div>' +
      '<div class="rp-mid"><div class="rp-word"></div><div class="rp-vs">VS</div><div class="rp-res"></div></div>' +
      '<div class="rp-row"><div class="rp-pts mp">0</div><div class="rp-hand mine">' + KP.E("✊") + '</div><div class="rp-side"><div class="rp-face me">' + KP.E("👦") + '</div><div class="rp-name">나</div></div></div>';
    const btns = U.el("div", "rp-btns");
    ctx.body.append(arena, btns);
    Object.assign(ctx, {
      arena, btnsEl: btns, bearFace: U.$(".rp-face.bear", arena), meFace: U.$(".rp-face.me", arena),
      bh: U.$(".rp-hand.bear", arena), mh: U.$(".rp-hand.mine", arena), word: U.$(".rp-word", arena), res: U.$(".rp-res", arena),
      vs: U.$(".rp-vs", arena), bp: U.$(".bp", arena), mp: U.$(".mp", arena),
    });
    ctx.HANDS = [
      { k: "rock", em: "✊", name: "바위", beats: "scissors" },
      { k: "scissors", em: "✌️", name: "가위", beats: "paper" },
      { k: "paper", em: "✋", name: "보", beats: "rock" },
    ];
    ctx.size = () => {
      const W = arena.clientWidth,
        H = arena.clientHeight;
      // 두 줄(각 얼굴+이름 약 110px)+가운데가 안 들어가는 낮은 무대는 좌우 배치
      arena.classList.toggle("wide", H < 330 && W > H * 1.6);
      arena.style.setProperty("--fs", Math.round(U.clamp(Math.min(W * 0.28, H * 0.28), 80, 210)) + "px");
      arena.style.setProperty("--hs", Math.round(U.clamp(Math.min(W * 0.24, H * 0.22), 70, 180)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    const U = KP.u;
    ctx.wins = 0;
    ctx.bearPts = 0;
    ctx.myPts = 0;
    ctx.bp.textContent = "0";
    ctx.mp.textContent = "0";
    requestAnimationFrame(() => ctx.size());
    // 고르기 버튼
    ctx.btnsEl.innerHTML = "";
    ctx.choiceBtns = ctx.HANDS.map((h, i) => {
      const b = U.el("button", "rp-b", KP.E(h.em) + "<span>" + h.name + "</span>");
      b.style.setProperty("--i", i);
      ctx.tap(b, () => this.play(ctx, h, b));
      ctx.btnsEl.appendChild(b);
      return b;
    });
    this.reset(ctx, true);
  },
  reset(ctx, first) {
    ctx.busy = false;
    ctx.wrongN = 0;
    ctx.bearFace.className = "rp-face bear";
    ctx.bearFace.innerHTML = ctx.bearSVG("normal");
    ctx.bh.innerHTML = KP.E("✊");
    ctx.mh.innerHTML = KP.E("✊");
    ctx.bh.className = "rp-hand bear";
    ctx.mh.className = "rp-hand mine";
    ctx.word.textContent = "";
    ctx.res.textContent = "";
    ctx.vs.style.display = "";
    ctx.res.textContent = "";
    ctx.btnsEl.classList.remove("off");
    ctx.choiceBtns.forEach((b) => b.classList.remove("sel"));
    if (ctx.level >= 2) return this.quizSet(ctx, first);
    ctx.say(first ? "곰돌이랑 가위바위보! 내 손을 골라요 ✊✌️✋" : "또 해 볼까? 골라 봐요! ✊✌️✋", true);
    ctx.hint(() => KP.u.pick(ctx.choiceBtns), "가위, 바위, 보 중에 하나를 콕!");
  },
  /* ---------- 2·3단계: 곰돌이를 이기는 손 고르기 ---------- */
  quizSet(ctx, first) {
    const U = KP.u;
    const lv = ctx.level;
    // 곰돌이 손: 바로 앞 판과 다르게
    const bear = U.pick(ctx.HANDS.filter((h) => h !== ctx.quizBear));
    ctx.quizBear = bear;
    ctx.quizWin = ctx.HANDS.find((h) => h.beats === bear.k);
    ctx.vs.style.display = "none";
    ctx.bh.innerHTML = KP.E(bear.em);
    U.replay(ctx.bh, "reveal");
    ctx.word.textContent = bear.name + "!";
    U.replay(ctx.word, "show");
    KP.audio.sfx("pop");
    // 말: "곰돌이 바위!"(자연 음성 조각) + "무엇을 내야 이길까요?"(새 문장 new-voice/rps.txt — 녹음 전에는 기기 목소리)
    const Q = "무엇을 내야 이길까요?";
    ctx.say((first ? "곰돌이를 이겨라! " : "") + "곰돌이는 " + bear.em + " " + bear.name + "! " + Q, "곰돌이 " + bear.name + "! " + Q);
    if (lv >= 3) {
      // 3단계: 2초 뒤 곰돌이 손을 가림 → 기억해서 고르기
      const tok = (ctx.quizTok = (ctx.quizTok || 0) + 1);
      ctx.after(2000, () => {
        if (ctx.quizTok !== tok || ctx.busy || !ctx._active) return;
        ctx.bh.innerHTML = KP.E("❓");
        ctx.bh.classList.add("hid"); // 물음표는 돌리지 않게
        U.replay(ctx.bh, "reveal");
        ctx.word.textContent = "";
        ctx.say("곰돌이 손은 뭐였지? 무엇을 내야 이길까요? 🤔", false); // 말풍선 글자만 (답이 보이지 않게)
        KP.audio.sfx("whoosh");
      });
    }
    // 이기는 손(정답)을 가리킴 → 가리킨 판은 열쇠 별 없음
    ctx.hint(() => ctx.choiceBtns[ctx.HANDS.indexOf(ctx.quizWin)], U.josa(ctx.quizWin.name, "이/가") + " " + U.josa(bear.name, "을/를") + " 이겨요!", { answer: true });
  },
  async quiz(ctx, mine, btn) {
    const U = KP.u,
      A = KP.audio;
    if (ctx.busy) return;
    ctx.busy = true;
    ctx.quizTok = (ctx.quizTok || 0) + 1; // 가리기 예약 취소
    ctx.hint(null);
    const bear = ctx.quizBear,
      right = ctx.quizWin;
    const why = (a, b) => U.josa(a.name, "이/가") + " " + U.josa(b.name, "을/를") + " 이겨요!";
    btn.classList.add("sel");
    ctx.btnsEl.classList.add("off");
    A.sfx("select");
    // 짠! 둘 다 보여 주기
    ctx.bh.classList.remove("hid");
    ctx.bh.innerHTML = KP.E(bear.em);
    ctx.mh.innerHTML = KP.E(mine.em);
    U.replay(ctx.bh, "reveal");
    U.replay(ctx.mh, "reveal");
    await ctx.wait(450);
    if (!ctx._active) return;
    if (mine === right) {
      ctx.bearFace.innerHTML = ctx.bearSVG("wow");
      ctx.word.textContent = "이겼다!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = why(mine, bear);
      ctx.myPts++;
      ctx.mp.textContent = ctx.myPts;
      U.replay(ctx.mp, "bump");
      U.replay(ctx.meFace, "jump");
      ctx.score.add();
      A.sfx("good");
      KP.voice.say("이겼다! " + why(mine, bear));
      await ctx.wait(1500);
      if (!ctx._active) return;
      ctx.bearFace.innerHTML = ctx.bearSVG("sad");
      U.replay(ctx.bearFace, "sad");
      await ctx.wait(500);
      if (!ctx._active) return;
      ctx.round = (ctx.round || 0) + 1;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "가위바위보 챔피언!" : "곰돌이를 이겼어요!", say: big ? "" : "{부름} 최고!" });
      if (ok && ctx._active) this.reset(ctx);
      return;
    }
    // 틀림: 곰돌이가 깔깔 + 이기는 까닭을 말해 줌 (곰돌이 손은 그대로, 다시 고르기)
    ctx.wrongN++;
    ctx.bearFace.innerHTML = ctx.bearSVG("happy");
    U.replay(ctx.bearFace, "laugh");
    ctx.word.textContent = mine === bear ? "비겼다!" : "곰돌이 승!";
    U.replay(ctx.word, "show");
    ctx.res.textContent = why(right, bear);
    ctx.miss(btn, (mine === bear ? "똑같네! " : "") + why(right, bear));
    await ctx.wait(2300);
    if (!ctx._active) return;
    // 5번 틀려 1단계(운 판)로 내려갔으면: 문제 화면을 걷고 1단계로 (예전엔 '이기는 손' 안내가 남은 채 다음 누름이 운 판이 됨)
    if (ctx.level < 2) return this.reset(ctx);
    ctx.bearFace.innerHTML = ctx.bearSVG("normal");
    ctx.mh.innerHTML = KP.E("✊");
    ctx.word.textContent = bear.name + "!";
    ctx.res.textContent = "";
    ctx.btnsEl.classList.remove("off");
    ctx.choiceBtns.forEach((b) => b.classList.remove("sel"));
    const rb = ctx.choiceBtns[ctx.HANDS.indexOf(right)];
    if (ctx.wrongN >= 2) {
      // 두 번 헷갈리면 이기는 손을 살짝 반짝 (이번 판 열쇠 별 없음)
      ctx._hinted = true;
      rb.classList.add("hintGlow");
      ctx.after(3000, () => rb.classList.remove("hintGlow"));
    }
    ctx.busy = false;
    ctx.say("곰돌이는 " + bear.em + " " + bear.name + "! 무엇을 내야 이길까요?", "곰돌이 " + bear.name + "! 무엇을 내야 이길까요?");
    ctx.hint(() => rb, why(right, bear), { answer: true });
  },
  async play(ctx, mine, btn) {
    const U = KP.u,
      A = KP.audio;
    if (ctx.level >= 2) return this.quiz(ctx, mine, btn);
    if (ctx.busy) return;
    ctx.busy = true;
    ctx.hint(null);
    btn.classList.add("sel");
    ctx.btnsEl.classList.add("off");
    A.sfx("select");
    // 곰돌이 손 정하기 (1단계: 아이가 더 자주 이김) (단계별로 아이가 이길 확률 조절)
    const lv = ctx.level;
    const [pw, pd] = [[0.55, 0.25], [0.45, 0.28], [0.34, 0.33]][lv - 1]; // (2·3단계는 quiz 로 감 — 1단계 값만 씀)
    const r = Math.random();
    const want = r < pw ? "win" : r < pw + pd ? "draw" : "lose";
    const bear =
      want === "draw" ? mine : want === "win" ? ctx.HANDS.find((h) => h.k === mine.beats) : ctx.HANDS.find((h) => h.beats === mine.k);
    // 가위! 바위! 보!
    ctx.vs.style.display = "none";
    KP.voice.say("가위, 바위, 보!", { rate: 1.05 });
    const WORDS = ["가위!", "바위!", "보!"];
    for (let i = 0; i < 3; i++) {
      ctx.word.textContent = WORDS[i];
      U.replay(ctx.word, "show");
      if (i < 2) {
        U.replay(ctx.bh, "shake");
        U.replay(ctx.mh, "shake");
      }
      A.kick({ vol: 0.25 });
      A.note(["C5", "E5", "G5"][i], { inst: "marimba", dur: 0.25, vol: 0.25 });
      await ctx.wait(i < 2 ? 420 : 200);
      if (!ctx._active) return;
    }
    // 짠! 공개
    ctx.bh.classList.remove("shake");
    ctx.mh.classList.remove("shake");
    ctx.bh.innerHTML = KP.E(bear.em);
    ctx.mh.innerHTML = KP.E(mine.em);
    U.replay(ctx.bh, "reveal");
    U.replay(ctx.mh, "reveal");
    A.sfx("pop");
    await ctx.wait(600);
    if (!ctx._active) return;
    const result = mine.k === bear.k ? "draw" : mine.beats === bear.k ? "win" : "lose";
    const why = (a, b) => U.josa(a.name, "이/가") + " " + U.josa(b.name, "을/를") + " 이겨요!";
    if (result === "win") {
      ctx.bearFace.innerHTML = ctx.bearSVG("wow");
      ctx.word.textContent = "이겼다!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = why(mine, bear);
      ctx.myPts++;
      ctx.mp.textContent = ctx.myPts;
      U.replay(ctx.mp, "bump");
      U.replay(ctx.meFace, "jump");
      ctx.score.add();
      A.sfx("good");
      KP.voice.say("이겼다! " + why(mine, bear));
      await ctx.wait(1400);
      ctx.bearFace.innerHTML = ctx.bearSVG("sad");
      U.replay(ctx.bearFace, "sad");
      KP.voice.say("으앙, 졌다~ {부름} 최고!");
      ctx.wins++;
      await ctx.wait(1400);
      if (!ctx._active) return;
      if (ctx.wins % 2 === 0) {
        // 2번 이길 때마다 축하 (예전 3번 → 1단계 한 판 35~44초)
        const big = ctx.wins % 6 === 0;
        ctx.noStar(); // 가위바위보 결과는 운 → 열쇠 별 없음 (축하·단계는 그대로)
        const ok = await ctx.win({ big, msg: big ? "가위바위보 챔피언!" : "곰돌이를 이겼어요!" });
        if (!ok) return;
      } else KP.confetti(50, innerWidth * 0.75, innerHeight * 0.4);
    } else if (result === "draw") {
      ctx.bearFace.innerHTML = ctx.bearSVG("happy");
      U.replay(ctx.bearFace, "laugh");
      ctx.word.textContent = "비겼다!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = "똑같은 " + mine.name + "!";
      A.sfx("boing");
      KP.voice.say("똑같네! 비겼다! 하하");
      await ctx.wait(2200);
    } else {
      ctx.bearFace.innerHTML = ctx.bearSVG("happy");
      U.replay(ctx.bearFace, "laugh");
      ctx.word.textContent = "곰돌이 승!";
      U.replay(ctx.word, "show");
      ctx.res.textContent = why(bear, mine);
      ctx.bearPts++;
      ctx.bp.textContent = ctx.bearPts;
      U.replay(ctx.bp, "bump");
      A.note("E5", { inst: "pluck", dur: 0.2, vol: 0.2 });
      A.note("C5", { inst: "pluck", dur: 0.3, vol: 0.2, when: 0.18 });
      KP.voice.say("내가 이겼다~ " + why(bear, mine) + " 한 번 더 할까?");
      await ctx.wait(2800);
    }
    if (ctx._active) this.reset(ctx);
  },
});
