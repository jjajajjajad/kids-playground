/* 기분 알아보기 — 상황 그림 + 짧은 이야기를 듣고 친구의 기분(표정) 고르기
   1단계: 기뻐요 / 슬퍼요 문제 (보기 3개: 기뻐요·슬퍼요 + 화나요/놀라요 중 하나 — 찍어서 반은 안 되게)
   2단계: + 화나요 / 놀라요 (3개 중 고르기)
   3단계: + 무서워요 / 부끄러워요 (4개 중 고르기). 헷갈리기 쉬운 장면(lv:3)은 3단계에만
   맞히면 친구 얼굴에 표정이 생기고, "슬플 땐 꼭 안아줘요" 같은 따뜻한 한마디(말이 끝나면 바로 다음).
   장면을 누르면 이야기를 다시 읽어 줌(🔊 표시). 1단계는 상황 그림(💧 같은 작은 단서)을 더 크게.
   맞힌 뒤 나오는 돌봄 그림(🙌 🫂 💨 …)은 '따라 해 봐요' 단추 — 누르면 박수·토닥·후~ 같은 소리와 하트(누르지 않아도 다음으로 넘어감)
   2단계 화난 장면 2개 추가(과자·새치기) — 이야기 문장은 녹음 대기(tools/out/new-voice/emotion.txt), 그전엔 기기 목소리 */
"use strict";
KP.game({
  id: "emotion",
  icon: "😊",
  name: "기분 알아보기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("emotion", `
      .emWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 6px;gap:6px}
      .emBox{flex:1;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center}
      .emScene{width:min(100cqw,160cqh);aspect-ratio:16/10;container-type:size;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:var(--bg,linear-gradient(#cfeeff,#f2fbff 62%,#bfe6a0 62.3%,#a6d985))}
      @media (orientation:portrait){.emScene{width:min(100cqw,100cqh);aspect-ratio:1}}
      .emScene.item{animation:popIn .4s}
      .emIt{position:absolute;line-height:1;transform:translate(-50%,-50%) rotate(var(--r,0deg));font-size:var(--s,16cqw)}
      .emIt.float{animation:emFloat 2.4s ease-in-out infinite}
      @keyframes emFloat{50%{transform:translate(-50%,-62%) rotate(var(--r,0deg))}}
      .emIt.shake{animation:emShake .5s ease-in-out infinite}
      @keyframes emShake{25%{transform:translate(-53%,-50%) rotate(var(--r,0deg))}75%{transform:translate(-47%,-50%) rotate(var(--r,0deg))}}
      .emIt.hop{animation:emHop .8s ease-in-out infinite}
      @keyframes emHop{50%{transform:translate(-50%,-70%) rotate(var(--r,0deg))}}
      .emIt.flash{animation:emFlash 1.2s steps(2) infinite}
      @keyframes emFlash{50%{opacity:.25}}
      .emIt.run{animation:emRun 2.6s ease-in-out infinite}
      @keyframes emRun{50%{transform:translate(-20%,-50%) rotate(var(--r,0deg))}}
      .emHero{position:absolute;left:var(--hx,26%);top:var(--hy,56%);transform:translate(-50%,-50%);width:26cqw;height:34cqw}
      .emHead{position:absolute;left:50%;top:0;width:19cqw;height:19cqw;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffe1a8,#ffc66e);box-shadow:inset 0 -1cqw 0 rgba(0,0,0,.08);z-index:2}
      .emHead:before{content:"";position:absolute;left:-4%;right:-4%;top:-6%;height:46%;border-radius:50% 50% 30% 30%/80% 80% 20% 20%;background:#6b4a2b}
      .emEye{position:absolute;top:50%;width:2.2cqw;height:2.6cqw;border-radius:50%;background:#3a2b20}
      .emEye.l{left:30%}.emEye.r{right:30%}
      .emMouth{position:absolute;left:50%;top:74%;transform:translate(-50%,-50%);width:4.4cqw;height:.9cqw;border-radius:1cqw;background:#c0603a}
      .emShirt{position:absolute;left:50%;top:16cqw;width:20cqw;height:16cqw;transform:translateX(-50%);border-radius:7cqw 7cqw 3cqw 3cqw;background:linear-gradient(#5aaeea,#3f8fd6);z-index:1}
      .emShirt:before,.emShirt:after{content:"";position:absolute;top:2cqw;width:5cqw;height:11cqw;border-radius:3cqw;background:#ffc66e;z-index:-1}
      .emShirt:before{left:-3.4cqw;transform:rotate(14deg)}.emShirt:after{right:-3.4cqw;transform:rotate(-14deg)}
      .emQ{position:absolute;right:-8%;top:-8%;font-size:6cqw;width:10cqw;height:10cqw;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:var(--cat);box-shadow:0 4px 0 rgba(0,0,0,.1);animation:emFloat 1.6s ease-in-out infinite;z-index:3}
      .emHero .face{position:absolute;left:50%;top:-.5cqw;margin-left:-10cqw;font-size:20cqw;line-height:1;z-index:4;animation:popBig .5s cubic-bezier(.2,1.6,.4,1)}
      .emHero.got .emQ,.emHero.got .emHead{visibility:hidden}
      .emCare{position:absolute;right:4%;top:6%;font-size:16cqw;line-height:1;padding:2cqw;border-radius:50%;background:rgba(255,255,255,.55);animation:popBig .5s cubic-bezier(.2,1.6,.4,1),emDo 1.4s .6s ease-in-out infinite;filter:drop-shadow(0 4px 4px rgba(0,0,0,.15));z-index:6;min-width:72px;min-height:72px;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
      @keyframes emDo{50%{transform:scale(1.1)}}
      .emCare.did{animation:popBig .4s}
      .emHeart{position:absolute;font-size:7cqw;pointer-events:none;z-index:7;animation:emHeart 1.2s ease-out forwards}
      @keyframes emHeart{from{transform:translate(-50%,0) scale(.4);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-22cqw) scale(1.1);opacity:0}}
      .emDark{--bg:linear-gradient(#1f2a55,#33407a 62%,#2a3463 62.3%,#222b52)}
      .emSnow{--bg:linear-gradient(#dfefff,#f6fbff 62%,#ffffff 62.3%,#e8f1fb)}
      .emIn{--bg:linear-gradient(#fff3dc,#ffe9c4 62%,#e5c193 62.3%,#d6ab78)}
      .emSnd{position:absolute;left:3%;top:4%;font-size:7cqw;line-height:1;opacity:.75;pointer-events:none;z-index:5}
      .emScene.say .emSnd{animation:popIn .4s}
      .emAns .choice{flex-direction:column;gap:2px;padding:8px 12px 6px;min-width:clamp(84px,14vw,150px)}
      .emFace{font-size:clamp(48px,7.4vw,80px);line-height:1}
      .emLbl{font-size:clamp(15px,2vw,20px);color:var(--ink2)}
      /* 좁은 세로(폰)만 단추를 좁힘 — 세로 태블릿(820px)은 기본 크기(약 115px) 그대로 */
      @media (orientation:portrait) and (max-width:600px){.emAns{gap:10px}.emAns .choice{min-width:76px;padding:8px 6px 6px}}
      @media (orientation:portrait) and (min-width:601px){.emAns .choice{min-height:clamp(120px,15vw,150px)}}
    `);
    ctx.FEEL = {
      joy: { face: "😊", name: "기뻐요", adj: "기쁜", care: "기쁠 땐 활짝 웃어요! 친구랑 같이 기뻐해요.", icon: "🙌" },
      sad: { face: "😢", name: "슬퍼요", adj: "슬픈", care: "슬플 땐 어떻게 할까? 꼭 안아 줘요. 토닥토닥.", icon: "🫂" },
      angry: { face: "😠", name: "화나요", adj: "화난", care: "화가 날 땐 숨을 크게 후~ 쉬어요. 그리고 말로 싫어! 해요.", icon: "💨" },
      surprise: { face: "😲", name: "놀라요", adj: "놀란", care: "깜짝 놀랐지? 가슴을 토닥토닥 해요.", icon: "💓" },
      fear: { face: "😨", name: "무서워요", adj: "무서운", care: "무서울 땐 엄마 아빠 손을 꼭 잡아요. 괜찮아요.", icon: "🤝" },
      shy: { face: "😳", name: "부끄러워요", adj: "부끄러운", care: "부끄러워도 괜찮아요. 작게 해도 멋져요!", icon: "🌟" },
    };
    // 장면: [그림, x%, y%, 크기(cqw), 꾸밈, 회전]
    ctx.SCENES = [
      { f: "joy", t: "생일 선물을 받았어요!", no: ["surprise"], it: [["🎁", 66, 60, 24, "hop"], ["🎈", 84, 26, 13, "float"], ["🎀", 52, 30, 10, "float"]] },
      { f: "joy", t: "강아지가 꼬리를 흔들며 달려왔어요!", it: [["🐶", 68, 60, 22, "hop"], ["💛", 82, 30, 10, "float"], ["🐾", 50, 82, 8]] },
      { f: "joy", t: "엄마가 맛있는 케이크를 만들어 줬어요!", bg: "emIn", it: [["🍰", 68, 60, 22], ["✨", 82, 36, 10, "float"]] },
      { f: "joy", t: "놀이터에서 미끄럼틀을 슝 탔어요!", it: [["🛝", 68, 56, 30], ["☀️", 86, 16, 12, "float"]] },
      { f: "joy", t: "오늘은 하얀 눈이 펑펑 와요.", no: ["surprise"], bg: "emSnow", it: [["⛄", 68, 60, 24, "hop"], ["❄️", 84, 22, 10, "float"], ["❄️", 54, 30, 8, "float"]] },
      { f: "joy", t: "스티커를 받았어요!", no: ["surprise"], bg: "emIn", it: [["🌟", 66, 50, 22, "hop"], ["✨", 84, 26, 10, "float"], ["💛", 52, 28, 9, "float"]] },
      { f: "joy", t: "다 같이 노래해요!", it: [["🎵", 64, 34, 14, "float"], ["🎶", 82, 52, 14, "float"], ["🐻", 72, 68, 18, "hop"]] },
      { f: "joy", t: "잘 만들었어요!", no: ["surprise"], it: [["🏰", 68, 58, 24], ["✨", 84, 28, 10, "float"], ["🚩", 70, 26, 9]] },
      { f: "sad", t: "아이스크림을 땅에 툭 떨어뜨렸어요.", no: ["surprise"], it: [["🍦", 64, 78, 18, "", 160], ["💧", 52, 40, 8, "float"]] },
      { f: "sad", t: "풍선이 하늘로 날아가 버렸어요.", no: ["surprise"], it: [["🎈", 72, 22, 16, "float"], ["☁️", 88, 12, 12]] },
      { f: "sad", t: "아끼는 장난감 자동차가 부서졌어요.", no: ["angry"], bg: "emIn", it: [["🚗", 66, 68, 20, "", 30], ["⚙️", 82, 80, 8, "", 20], ["💧", 50, 38, 8, "float"]] },
      { f: "sad", t: "넘어져서 무릎이 아파요.", no: ["surprise", "fear"], it: [["🩹", 66, 64, 18, "", -20], ["💧", 50, 38, 8, "float"], ["🪨", 82, 82, 10]] },
      { f: "sad", t: "비가 와서 밖에서 못 놀아요.", no: ["angry"], bg: "emIn", it: [["🌧️", 72, 26, 20, "float"], ["🛝", 76, 68, 18], ["💧", 50, 38, 8, "float"]] },
      { f: "angry", lv: 3, t: "친구가 내 장난감을 확 뺏어 갔어요!", no: ["sad"], it: [["🏃", 76, 56, 20, "run"], ["🧸", 66, 50, 11, "run"], ["💢", 48, 26, 10, "shake"]] },
      { f: "angry", t: "열심히 쌓은 블록 탑을 누가 쾅 무너뜨렸어요!", no: ["sad", "surprise"], bg: "emIn", it: [["🧱", 62, 80, 12, "", 30], ["🧱", 76, 76, 12, "", -20], ["🧱", 70, 60, 11, "", 60], ["💥", 72, 40, 14], ["💢", 46, 24, 10, "shake"]] },
      { f: "angry", t: "동생이 내 과자를 몰래 다 먹었어요!", no: ["sad", "surprise"], bg: "emIn", it: [["👶", 74, 58, 20, "hop"], ["🍪", 60, 80, 10, "", 20], ["🥣", 86, 78, 12], ["💢", 46, 24, 10, "shake"]] },
      { f: "angry", t: "줄을 서 있는데 친구가 새치기했어요!", no: ["sad", "surprise"], it: [["🏃", 62, 56, 18, "run"], ["🐻", 82, 58, 18], ["💢", 46, 24, 10, "shake"]] },
      { f: "angry", t: "동생이 내 그림에 마구 낙서를 했어요!", no: ["sad"], bg: "emIn", it: [["🖼️", 68, 50, 24], ["🖍️", 82, 74, 12, "shake", -30], ["💢", 46, 24, 10, "shake"]] },
      { f: "surprise", t: "문을 열었더니 깜짝 생일 파티!", no: ["joy"], bg: "emIn", it: [["🎉", 66, 34, 16, "shake"], ["🎂", 70, 66, 20], ["🎈", 88, 30, 12, "float"]] },
      { f: "surprise", t: "상자를 열었더니 개구리가 폴짝 튀어나왔어요!", no: ["fear", "joy"], it: [["📦", 68, 72, 20], ["🐸", 68, 40, 14, "hop"], ["❗", 50, 24, 10, "shake"]] },
      { f: "surprise", t: "풍선이 갑자기 펑 터졌어요!", no: ["fear", "sad"], it: [["💥", 70, 42, 22, "shake"], ["🎈", 86, 72, 9, "", 70], ["❗", 48, 22, 10, "shake"]] },
      { f: "fear", t: "우르르 쾅쾅! 천둥 번개가 쳐요.", no: ["surprise"], bg: "emDark", it: [["⛈️", 70, 26, 24], ["⚡", 62, 56, 14, "flash"], ["⚡", 84, 60, 12, "flash"]] },
      { f: "fear", t: "깜깜한 밤에 혼자 방에 있어요.", no: ["sad"], bg: "emDark", it: [["🌙", 78, 22, 14], ["🛏️", 70, 74, 22]] },
      { f: "fear", t: "커다란 개가 멍멍 크게 짖어요!", no: ["surprise", "angry"], it: [["🐕", 72, 58, 30, "shake"], ["💢", 60, 26, 10, "shake"]] },
      { f: "shy", t: "친구들 앞에서 혼자 노래를 해요.", no: ["fear", "joy"], bg: "emIn", it: [["🎤", 44, 48, 12, "", -20], ["👀", 72, 50, 12], ["👀", 86, 64, 11], ["👀", 70, 78, 11]] },
      { f: "shy", lv: 3, t: "선생님이 모두 앞에서 이름을 불러 칭찬했어요.", no: ["joy", "surprise"], bg: "emIn", it: [["⭐", 48, 24, 12, "float"], ["👀", 74, 48, 11], ["👀", 86, 70, 11], ["👏", 66, 74, 12, "shake"]] },
    ];
    ctx.wrap = U.el("div", "emWrap");
    ctx.box = U.el("div", "emBox");
    ctx.scene = U.el("div", "emScene");
    ctx.box.appendChild(ctx.scene);
    ctx.ans = U.el("div", "qAns emAns");
    ctx.wrap.append(ctx.box, ctx.ans);
    ctx.body.appendChild(ctx.wrap);
    ctx.tap(ctx.scene, () => {
      if (!ctx.cur) return;
      U.replay(ctx.scene, "say");
      KP.voice.say(ctx.cur.t + " 친구는 어떤 기분일까요?");
    });
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.cur = null;
    this.next(ctx);
  },
  /** 돌봄 동작: 기쁨=박수, 슬픔=토닥토닥, 화남=후~, 놀람=두근두근, 무서움=손 꼭, 부끄러움=반짝
      말("토닥토닥." "후~")은 queue — 돌봄 한마디("슬플 땐 꼭 안아줘요")를 끊지 않고 그 뒤에 */
  doCare(ctx, f, care, scene) {
    const U = KP.u,
      A = KP.audio;
    U.replay(care, "did");
    if (f === "joy") [0, 0.22, 0.44].forEach((w) => A.noise({ dur: 0.07, vol: 0.22, bp: 1800, q: 0.8, when: w }));
    else if (f === "sad") {
      [0, 0.35].forEach((w) => A.noise({ dur: 0.09, vol: 0.12, lp: 500, when: w }));
      if (!ctx.careSaid) KP.voice.say("토닥토닥.", { queue: true });
    } else if (f === "angry") {
      A.noise({ dur: 1.1, vol: 0.1, bp: 900, bpTo: 400, q: 0.6 });
      if (!ctx.careSaid) KP.voice.say("후~", { queue: true });
    } else if (f === "surprise") [0, 0.18, 0.6, 0.78].forEach((w, i) => A.tone(i % 2 ? 70 : 90, { dur: 0.12, vol: 0.22, type: "sine", when: w }));
    else A.melody([["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.12, inst: "bell", vol: 0.18 });
    ctx.careSaid = true;
    for (let i = 0; i < 4; i++) {
      const h = U.el("span", "emHeart", KP.E(i % 2 ? "💖" : "❤️"));
      h.style.left = 30 + i * 8 + "%";
      h.style.top = "48%";
      h.style.setProperty("--dx", (i - 1.5) * 6 + "cqw");
      h.style.animationDelay = i * 0.1 + "s";
      scene.appendChild(h);
      ctx.after(1500, () => h.remove());
    }
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    ctx.careSaid = false;
    const tok = ++ctx.token;
    const pool = lv === 1 ? ["joy", "sad"] : lv === 2 ? ["joy", "sad", "angry", "surprise"] : ["joy", "sad", "angry", "surprise", "fear", "shy"];
    const nC = lv < 3 ? 3 : 4; // 보기는 1단계부터 3개 이상 (열쇠 별 규칙)
    // 같은 장면·같은 기분 연속 피하기 (최근 3장면은 다시 안 나오게)
    const cand = ctx.SCENES.filter((s) => pool.includes(s.f) && (s.lv || 1) <= lv);
    ctx.recent = ctx.recent || [];
    let sc,
      guard = 0;
    do sc = U.pick(cand);
    while (guard++ < 40 && ((ctx.cur && (sc === ctx.cur || (sc.f === ctx.cur.f && Math.random() < 0.6))) || ctx.recent.includes(sc)));
    ctx.recent = [sc, ...ctx.recent].slice(0, Math.min(3, cand.length - 2));
    ctx.cur = sc;
    const F = ctx.FEEL[sc.f];

    // 장면 그리기
    const el = ctx.scene;
    el.className = "emScene item " + (sc.bg || "");
    el.innerHTML = "";
    sc.it.forEach(([e, x, y, s, cls, r]) => {
      const it = U.el("div", "emIt " + (cls || ""), KP.E(e));
      it.style.left = x + "%";
      it.style.top = y + "%";
      // 1단계: 작은 단서 그림(💧 💢 ❗ 같은 것)을 더 크게 보여 줌
      it.style.setProperty("--s", (lv === 1 && s < 14 ? Math.round(s * 1.5) : s) + "cqw");
      if (r) it.style.setProperty("--r", r + "deg");
      el.appendChild(it);
    });
    const hero = U.el("div", "emHero", '<div class="emShirt"></div><div class="emHead"><i class="emEye l"></i><i class="emEye r"></i><b class="emMouth"></b></div><span class="emQ">?</span>');
    el.appendChild(hero);
    el.appendChild(U.el("span", "emSnd", KP.E("🔊")));

    ctx.say(sc.t + " 친구는 어떤 기분일까요?");
    // 보기: 같은 단계의 기분에서 먼저 고르고, 모자라면(헷갈리는 기분은 빼므로) 다음 단계 기분으로 채움
    const no = sc.no || [];
    const okF = (f) => f !== sc.f && !no.includes(f);
    let others = U.shuffle(pool.filter(okF));
    if (lv === 1) others = [...others, ...U.shuffle(["angry", "surprise"].filter(okF))];
    others = [...others, ...U.shuffle(Object.keys(ctx.FEEL).filter((f) => okF(f) && !others.includes(f)))];
    const opts = U.shuffle([sc.f, ...others.slice(0, nC - 1)]);
    const btns = ctx.choices(ctx.ans, opts, {
      cls: "emCh",
      render: (f) => '<span class="emFace">' + KP.E(ctx.FEEL[f].face) + '</span><span class="emLbl">' + ctx.FEEL[f].name + "</span>",
      right: (f) => f === sc.f,
      wrongMsg: (f) => "이건 " + ctx.FEEL[f].adj + " 얼굴이에요. 친구 마음을 다시 생각해 볼까?",
      onRight: async (f, b) => {
        ctx.hint(null);
        hero.classList.add("got");
        hero.appendChild(U.el("span", "face", KP.E(F.face)));
        A.sfx("good");
        ctx.after(500, () => {
          const care = U.el("div", "emCare", KP.E(F.icon));
          // 따라 해 봐요: 누르면 기분에 맞는 소리 + 하트 (장면 다시 읽기와 겹치지 않게 막음)
          care.addEventListener("click", (e) => e.stopPropagation());
          ctx.fast(care, (e) => {
            e.stopPropagation();
            this.doCare(ctx, sc.f, care, el);
          });
          el.appendChild(care);
          A.sfx("sparkle");
        });
        const talk = ctx.say(F.name + "! " + F.care);
        // 돌봄 말이 끝나면 바로 다음으로 (최소 1.8초, 최대 예전 길이)
        await Promise.all([ctx.wait(1800), Promise.race([talk, ctx.wait(Math.max(3200, F.care.length * 200))])]);
        if (tok !== ctx.token) return;
        ctx.score.add();
        ctx.round++;
        const big = ctx.round % 4 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 마음 박사!" : "친구 마음을 알았어요!" });
        if (ok && tok === ctx.token) this.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), sc.t + " 이럴 땐 어떤 얼굴일까?");
  },
});
