/* 동물 병원 — 점토 진료실에 아이가 칠한 3D 인형 친구가 아파서 찾아와요. 의사 선생님(아이)이 증상을 보고
   알맞은 점토 도구를 끌어다 '아픈 곳'에 대면 그 부위가 반응해요 (청진기 → 가슴 콩닥, 반창고 → 무릎에 붙어 남음 …).
   병원이 무섭지 않게: 주사·피·무서운 장면 없음. 토닥토닥·꼭 안아 주기는 인형을 직접 만져서.
   1단계: 증상 하나 + 필요한 도구가 반짝 (보기 2개 → 열쇠 별 없음)
   2단계: 도구 3개 중 알맞은 것 고르기
   3단계: 두 가지를 순서대로 (예: 가시 빼고 → 반창고) — 보기 4개, 토닥토닥·꼭 안아 주기 포함
   다 나으면 웃으며 폴짝·하트·손 흔들며 나가요.
   공용: js/games/_shared/clay-stage.js(무대) · doll-actor.js(인형 배우) · doll-follow.js(부위 따라가기) · play-feedback.js(반응) */
"use strict";
KP.game({
  id: "hospital",
  icon: "🏥",
  name: "동물 병원",
  cat: "play",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    const IMG = "assets/play-clay/hospital/";
    ctx.IMG = IMG;
    KP.css("hospital", `
      .hpWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px;gap:8px}
      .hpRoom{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#f3e2c8;container-type:size}
      .hpOv{position:absolute;inset:0;pointer-events:none;--dh:300px}
      .hpOv>*{position:absolute;left:0;top:0;pointer-events:none}
      .hpT{will-change:transform}
      .hpT>*{position:relative;display:block}
      .hpSteps{position:absolute;left:2.4cqw!important;top:3cqh;display:flex;gap:1.2cqw;background:rgba(255,250,240,.88);border-radius:999px;padding:1cqh 1.6cqw;z-index:6;box-shadow:0 3px 0 rgba(120,80,40,.12)}
      .hpSteps i{width:min(5.5cqh,5cqw);height:min(5.5cqh,5cqw);border-radius:50%;background:#e6dccd;transition:background .3s,transform .3s}
      .hpSteps i.on{background:#ff8fab;transform:scale(1.15)}
      .hpBub{position:relative;display:flex;align-items:center;gap:.2em;background:#fffaf2;border-radius:999px;padding:.18em .55em;box-shadow:0 4px 0 rgba(120,80,40,.14);font-size:max(16px,calc(var(--dh)*.075));white-space:nowrap;color:var(--ink);transform-origin:0 100%;animation:popIn .4s .5s backwards;z-index:8}
      .hpBub .m{font-size:1.3em;line-height:1}
      .hpBub:after{content:"";position:absolute;left:.7em;bottom:-.35em;width:.7em;height:.7em;background:#fffaf2;transform:rotate(45deg);border-radius:0 0 .15em 0}
      .hpZone{border-radius:40%;z-index:4}
      .hpZone.on{pointer-events:auto;touch-action:none}
      .hpZone.ask{animation:hpAsk 1.6s ease-in-out infinite}
      @keyframes hpAsk{0%,100%{box-shadow:0 0 0 0 rgba(255,143,171,0)}50%{box-shadow:0 0 0 calc(var(--dh)*.04) rgba(255,143,171,.3)}}
      .hpSpot{width:calc(var(--dh)*.24);height:calc(var(--dh)*.24);border-radius:50%;border:4px dashed rgba(255,197,49,.0);transition:border-color .2s,background .2s;z-index:5}
      .hpSpot.show{border-color:rgba(255,190,40,.95);background:rgba(255,230,140,.25);animation:hpSpotP 1s ease-in-out infinite}
      .hpSpot.near{border-style:solid;border-color:#ffb21e;background:rgba(255,220,120,.4)}
      @keyframes hpSpotP{50%{scale:1.12}}
      /* 증상 */
      .hpScrape{width:calc(var(--dh)*.11);height:calc(var(--dh)*.08);border-radius:50%;background:radial-gradient(ellipse at 45% 45%,#ff8f9c 0 35%,#ff6f86 55%,rgba(255,111,134,0) 72%);transition:opacity .8s,width .8s,height .8s}
      .hpScrape.better{opacity:.45;width:calc(var(--dh)*.08);height:calc(var(--dh)*.06)}
      .hpThorn{width:0;height:0;border-left:calc(var(--dh)*.018) solid transparent;border-right:calc(var(--dh)*.018) solid transparent;border-bottom:calc(var(--dh)*.07) solid #5e8f3c;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3));transform-origin:50% 100%}
      .hpThorn.fly{transition:translate .7s ease-in,opacity .7s;translate:calc(var(--dh)*.3) calc(var(--dh)*-.6);opacity:0}
      .hpDots{width:calc(var(--dh)*.1);height:calc(var(--dh)*.1)}
      .hpDots i{position:absolute;width:32%;height:32%;border-radius:50%;background:#ff8fa0;box-shadow:0 0 0 2px rgba(255,170,180,.5);transition:opacity .8s}
      .hpDots.gone i{opacity:0}
      .hpSwirl{font-size:calc(var(--dh)*.1);line-height:1;animation:spin 3s linear infinite}
      .hpWord{font-size:calc(var(--dh)*.07);color:#7a6a9a;font-weight:bold;white-space:nowrap;animation:hpPuff 2.6s ease-out infinite}
      @keyframes hpPuff{0%,35%{opacity:0;translate:0 0;scale:.6}50%{opacity:1;translate:10% -20%;scale:1}100%{opacity:0;translate:40% -90%;scale:1.15}}
      .hpDrop{font-size:calc(var(--dh)*.09);line-height:1;animation:hpDrip 1.8s ease-in infinite}
      @keyframes hpDrip{0%{translate:0 -20%;scale:.4;opacity:0}30%{opacity:1;scale:1}100%{translate:0 150%;scale:.8;opacity:0}}
      /* 도구 쓰기 */
      .hpUse{width:calc(var(--dh)*var(--k,.3));height:calc(var(--dh)*var(--k,.3));z-index:7}
      .hpUse img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 5px rgba(80,40,20,.3))}
      .hpUse.in{animation:hpUseIn .35s cubic-bezier(.2,1.5,.4,1) backwards}
      @keyframes hpUseIn{from{scale:.3;opacity:0}}
      .hpUse.rub img{animation:hpRub .45s ease-in-out infinite}
      @keyframes hpRub{0%,100%{translate:0 0;rotate:0deg}25%{translate:-22% 6%;rotate:-10deg}75%{translate:22% -6%;rotate:10deg}}
      .hpUse.beat img{animation:hpBeat .55s ease-in-out infinite}
      @keyframes hpBeat{30%{scale:1.08}}
      .hpUse.tilt img{animation:hpTilt 1.4s ease-in-out forwards}
      @keyframes hpTilt{30%,75%{rotate:-28deg;translate:-8% -10%}}
      .hpUse.pull img{animation:hpPull 1.3s ease-in-out forwards}
      @keyframes hpPull{0%{translate:20% -40%}35%,55%{translate:5% -5%}100%{translate:35% -90%}}
      .hpUse.hold img{animation:hpHold 1.4s ease-in-out}
      @keyframes hpHold{20%{translate:0 4%}50%{translate:0 -2%}}
      .hpUse.out{transition:opacity .4s,scale .4s;opacity:0;scale:.6}
      .hpStick{width:calc(var(--dh)*.17);height:calc(var(--dh)*.17);z-index:6;animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .hpStick img{width:100%;height:100%;object-fit:contain;rotate:-24deg;filter:drop-shadow(0 2px 2px rgba(80,40,20,.25))}
      .hpFloat{font-size:calc(var(--dh)*.08);font-weight:bold;color:#ff6f91;white-space:nowrap;text-shadow:0 2px 0 #fff,0 0 6px #fff;animation:hpFloatUp 1.2s ease-out forwards;z-index:9}
      @keyframes hpFloatUp{from{translate:0 0;opacity:0;scale:.6}20%{opacity:1;scale:1.1}to{translate:0 -120%;opacity:0}}
      .hpZz{font-size:calc(var(--dh)*.09);animation:hpZz 1.8s ease-out forwards;z-index:9}
      @keyframes hpZz{from{translate:0 0;scale:.4;opacity:0}30%{opacity:1}to{translate:60% -160%;scale:1.2;opacity:0}}
      .hpGuide{width:84px;height:84px;z-index:30;pointer-events:none;transition:transform 1s cubic-bezier(.4,0,.3,1),opacity .3s}
      .hpGuide img{width:100%;height:100%;object-fit:contain;opacity:.85}
      .hpLoad{left:50%!important;top:45%!important;transform:translate(-50%,-50%);background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      /* 도구 쟁반 (점토) */
      .hpTray{flex:0 0 auto;display:flex;gap:clamp(10px,2.2vw,22px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:clamp(96px,12vw,128px);
        background:linear-gradient(#f7ead6,#efdcc0);border-radius:28px;padding:8px 12px;box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12);transition:opacity .3s}
      .hpTray.off{opacity:.5;pointer-events:none}
      .hpTool{position:relative;width:clamp(80px,10.5vw,112px);height:clamp(80px,10.5vw,112px);border-radius:26px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);box-shadow:0 6px 0 rgba(140,95,50,.18),inset 0 -4px 0 rgba(160,110,60,.1);display:flex;align-items:center;justify-content:center;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)}
      .hpTool img{width:84%;height:84%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(80,40,20,.22))}
      .hpTool.dragging{z-index:60;background:transparent;box-shadow:none}
      .hpTool.dragging img{width:110%;height:110%}
      .hpTool.used{visibility:hidden}
      .hpTool.glow{animation:hpGlow 1.3s ease-in-out infinite}
      @keyframes hpGlow{0%,100%{box-shadow:0 6px 0 rgba(140,95,50,.18),0 0 0 0 rgba(255,197,49,0)}50%{box-shadow:0 6px 0 rgba(140,95,50,.18),0 0 0 10px rgba(255,197,49,.65)}}
      @media (orientation:portrait){.hpTool{width:clamp(70px,18vw,104px);height:clamp(70px,18vw,104px)}.hpTray{gap:10px}}
      @media (orientation:landscape) and (max-height:520px){
        .hpWrap{flex-direction:row;padding:0 10px 8px}
        .hpTray{flex-direction:row;width:calc(2*78px + 30px);min-height:0;gap:8px;align-content:center;padding:6px}
        .hpTool{width:76px;height:76px;border-radius:20px}
      }
    `);
    // 도구: 그림·이름·1단계 안내·잘못 골랐을 때 설명·쓴 뒤 말·연출·어디에 대나(부위)·크기(인형 키 비율)
    ctx.T = {
      band: { n: "반창고", ask: "반창고를 붙여 줘요!", use: "반창고는 다친 곳에 붙여요.", done: "반창고 착!", fx: "stick", at: "spot", k: 0.24 },
      oint: { n: "연고", ask: "연고를 쓱쓱 발라 줘요!", use: "연고는 상처나 가려운 곳에 발라요.", done: "쓱쓱, 발랐어요!", fx: "rub", at: "spot", k: 0.3 },
      thermo: { n: "체온계", ask: "체온계로 열을 재 줘요!", use: "체온계는 열이 나는지 재요.", done: "삐빅! 열을 쟀어요.", fx: "thermo", at: "mouth", k: 0.3 },
      blanket: { n: "담요", ask: "담요를 덮어 줘요!", use: "담요는 푹 쉴 때 덮어요.", done: "쿨쿨, 푹 쉬어요.", fx: "blanket", at: "belly", k: 0.62 },
      steth: { n: "청진기", ask: "청진기로 콩닥콩닥 소리를 들어 줘요!", use: "청진기는 몸속 소리를 들어요.", done: "콩닥콩닥, 잘 들려요!", fx: "beat", at: "chest", k: 0.34 },
      tea: { n: "따뜻한 차", ask: "따뜻한 차를 줘요!", use: "따뜻한 차는 목이나 배가 아플 때 마셔요.", done: "호로록, 따뜻해요!", fx: "drink", at: "mouth", k: 0.28 },
      tweez: { n: "핀셋", ask: "핀셋으로 가시를 쏙 빼 줘요!", use: "핀셋은 가시를 뺄 때 써요.", done: "쏙! 가시가 빠졌어요!", fx: "pull", at: "spot", k: 0.3 },
      ice: { n: "얼음주머니", ask: "얼음주머니를 대 줘요!", use: "얼음주머니는 부딪친 곳에 대요.", done: "아, 시원해요!", fx: "ice", at: "spot", k: 0.3 },
      tissue: { n: "휴지", ask: "휴지로 코를 닦아 줘요!", use: "휴지는 콧물을 닦을 때 써요.", done: "흥! 코가 뻥 뚫렸어요!", fx: "rub", at: "nose", k: 0.28 },
      teddy: { n: "곰 인형", ask: "곰 인형을 안겨 줘요!", use: "곰 인형은 속상할 때 꼭 안아요.", done: "곰 인형을 꼭 안았어요!", fx: "teddy", at: "chest", k: 0.36 },
    };
    // 손으로 하는 돌봄 (3단계 두 번째 순서) — 인형을 직접 만져서
    ctx.ACT = {
      pat: { ask: "토닥토닥 해 줘요!", hint: "친구를 토닥토닥 해 줘요!" },
      hug: { ask: "꼭 안아 줘요!", hint: "친구를 꾹 누르고 꼭 안아 줘요!" },
    };
    // 증상 (어느 인형이든): 아픈 곳(spot: 부위 이름)·말풍선·증상 문장·1·2단계 도구·3단계 순서와 안내·헷갈리는 도구(보기에서 뺌)
    ctx.P = [
      { id: "knee", spot: "kneeR", w: "아야", m: "😣", mood: "pain", say: "넘어져서 무릎이 까졌어요.", one: "band", seq: ["oint", "band"], seqSay: "먼저 연고를 바르고, 반창고를 붙여 줘요!", near: ["oint", "band", "ice"] },
      { id: "fever", spot: "forehead", w: "뜨거워", m: "🥵", mood: "sick", blush: "fever", say: "열이 나요. 몸이 뜨끈뜨끈해요.", one: "thermo", seq: ["thermo", "blanket"], seqSay: "먼저 체온계로 열을 재고, 담요를 덮어 줘요!", near: ["thermo", "blanket", "tea", "ice"] },
      { id: "cough", spot: "chest", w: "콜록", m: "😖", mood: "sick", say: "콜록콜록 기침을 해요.", one: "steth", seq: ["steth", "tea"], seqSay: "먼저 청진기로 소리를 듣고, 따뜻한 차를 줘요!", near: ["steth", "tea", "blanket", "thermo", "tissue"] },
      { id: "thorn", spot: "handR", w: "아야", m: "😣", mood: "pain", say: "손에 가시가 콕 박혔어요.", one: "tweez", seq: ["tweez", "band"], seqSay: "먼저 핀셋으로 가시를 빼고, 반창고를 붙여 줘요!", near: ["tweez", "band", "oint"] },
      { id: "tummy", spot: "belly", w: "꾸르륵", m: "😖", mood: "sick", say: "배가 아파요. 꾸르륵 꾸르륵.", one: "tea", seq: ["tea", "pat"], seqSay: "먼저 따뜻한 차를 주고, 배를 살살 토닥토닥 해 줘요!", near: ["tea", "blanket", "teddy"] },
      { id: "sad", spot: "chest", w: "흑흑", m: "😢", mood: "sick", say: "풍선을 놓쳐서 속상해요.", one: "teddy", seq: ["teddy", "hug"], seqSay: "먼저 곰 인형을 안겨 주고, 꼭 안아 줘요!", near: ["teddy", "tea", "blanket"] },
      { id: "bump", spot: "headTop", w: "아야", m: "😣", mood: "pain", say: "콩! 머리에 혹이 났어요.", one: "ice", seq: ["ice", "pat"], seqSay: "먼저 얼음주머니를 대 주고, 토닥토닥 해 줘요!", near: ["ice", "oint", "band"] },
      { id: "sneeze", spot: "nose", w: "에취", m: "🤧", mood: "sick", say: "에취! 콧물이 주르륵 나요.", one: "tissue", seq: ["tissue", "tea"], seqSay: "먼저 휴지로 코를 닦고, 따뜻한 차를 줘요!", near: ["tissue", "tea", "blanket", "thermo", "steth"] },
      { id: "itch", spot: "armL", w: "가려워", m: "😖", mood: "sick", say: "모기에 물려서 간지러워요.", one: "oint", seq: ["oint", "pat"], seqSay: "먼저 연고를 바르고, 살살 토닥토닥 해 줘요!", near: ["oint", "band", "ice"] },
    ];
    // 진료실 배경 (1600×900): 지평선·화각·잘릴 때 남길 곳(방석)·햇빛(오른쪽 창문)·자리
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1600, 900], vh: 0.28, near: 0.2, fov: 34, focus: [0.49, 0.6], focusP: [0.49, 0.62],
      sun: [0.55, 1, 0.75], sunCol: "#fff1de", spots: { seat: [0.49, 0.695] },
    };
    ctx.wrap = U.el("div", "hpWrap");
    ctx.room = U.el("div", "hpRoom");
    ctx.tray = U.el("div", "hpTray");
    ctx.wrap.append(ctx.room, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },

  /* ---------- 무대 · 인형 ---------- */
  /** 무대 만들기 (3D 가 되면 3D, 아니면 그림) — 화면이 끊기면 새로, 너무 느리면 그림으로 */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const slow = KP.store.get("hospital:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active) return null;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => {
        if (!ctx._active || ctx.st !== st) return;
        this.start(ctx, true); // 새 무대로 지금 환자부터 다시
      },
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("hospital:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    let st;
    try {
      st = CS.create(ctx.room, ctx.BG, opt);
    } catch (e) {
      // WebGL 을 아예 못 만들면 그림 무대
      opt.flat = true;
      st = CS.create(ctx.room, ctx.BG, opt);
    }
    ctx.st = st;
    ctx.ov = KP.u.el("div", "hpOv");
    st.ui.appendChild(ctx.ov);
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
    ctx.ov = null;
  },
  /** 환자 인형 고르기: 아이가 칠한 인형(지난번과 다른 것) → 없으면 기본 색 인형 */
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
    ctx.round = again ? ctx.round : 0;
    if (!again) ctx.last = null;
    const tok = ++ctx.token;
    ctx.tray.innerHTML = "";
    ctx.room.querySelectorAll(".hpLoad").forEach((e) => e.remove());
    const wait = KP.u.el("div", "hpLoad", KP.E("🧸") + " 준비 중");
    const wt = ctx.after(400, () => ctx.room.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      if (ctx.track) ctx.track();
    });
    return this.next(ctx); // 첫 환자 준비 중 오류는 놀이 틀(다시 하기 화면)이 받음
  },
  stop(ctx) {
    ctx.token++;
    this.dropStage(ctx);
  },

  async next(ctx) {
    const U = KP.u,
      A = KP.audio,
      T = ctx.T,
      FX = KP.pfx,
      st = ctx.st,
      IMG = ctx.IMG;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    const P = U.pick(ctx.P.filter((p) => p !== ctx.last));
    ctx.last = P;
    const steps = lv === 3 ? P.seq.slice() : [P.one];
    const toolSteps = steps.filter((s) => T[s]);
    const nOpt = lv === 1 ? 2 : lv === 2 ? 3 : 4;
    const distract = U.sample(Object.keys(T).filter((k) => !P.near.includes(k)), nOpt - toolSteps.length);
    const opts = U.shuffle([...toolSteps, ...distract]);
    ctx._fewChoice = opts.length < 3; // 보기 2개(찍어도 반)는 열쇠 별 없음
    const room = ctx.room,
      ov = ctx.ov;
    ov.innerHTML = "";
    ctx.track = null;
    ctx.tray.innerHTML = "";
    ctx.tray.classList.add("off");

    /* ---------- 인형 배우 ---------- */
    const pick = this.pickDoll(ctx);
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
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
    const name = act.name;
    let leaving = false,
      heldTeddy = false,
      stick = null;
    // 자리·크기: 방석 위, 놀이 영역 높이의 약 절반 (세로 화면은 조금 더 크게)
    const layout = () => {
      const seat = st.spot("seat"), tall = st.h > st.w;
      const frac = tall ? 0.5 : st.h < 420 ? 0.6 : 0.58;
      const h = st.fitH(seat[0], seat[1], frac);
      act.setH(h);
      return seat;
    };
    let seat = layout();
    st.onResize = () => {
      const s = layout();
      if (act.a.state === "idle" && !act._jump && !leaving) act.place(s[0], s[1]);
      seat = s;
    };
    // 들어오기: 똑똑 → 오른쪽에서 폴짝
    const offX = (side) => {
      const b = act.box(), hwPx = b.w / 2 + 20;
      return seat[0] + st.pxToWorld(seat[0], seat[1], side > 0 ? st.w - st.project(seat[0], 0, seat[1]).x + hwPx : -st.project(seat[0], 0, seat[1]).x - hwPx);
    };
    act.place(seat[0], seat[1]);
    act.place(offX(1), seat[1]);
    act.mood(P.mood, P.blush);
    act.sick(1);
    A.noise({ bp: 500, q: 2, dur: 0.07, vol: 0.3, when: 0.1 });
    A.noise({ bp: 500, q: 2, dur: 0.07, vol: 0.3, when: 0.3 });
    const enter = act.jumpTo(seat[0], seat[1], 0.8, 0.5);

    /* ---------- 화면에 붙는 것들 (부위를 따라감) ---------- */
    // 부위를 따라가는 것은 바깥 껍데기(hpT)만 옮김 — 안쪽 그림은 마음대로 움직이는 효과(회전·톡 튀어나오기)를 써도 됨 (공용 doll-follow.js)
    const fw = KP.dollFollow(ov, act, { cls: "hpT" });
    const follow = (el, nm, dx = 0, dy = 0, rot = 0) => fw.add(el, nm, dx, dy, rot);
    const unfollow = (el) => fw.remove(el);
    const kill = (el) => fw.kill(el);
    const zone = U.el("div", "hpZone");
    ov.appendChild(zone);
    const spotEl = U.el("div", "hpSpot");
    const bubW = U.el("span", "hpBubW");
    const bub = U.el("div", "hpBub", '<span class="m">' + KP.E(P.m) + "</span><span>" + P.w + "</span>");
    bubW.appendChild(bub);
    ov.append(bubW);
    let dh = 300;
    ctx.track = () => {
      const b = act.box();
      dh = Math.max(60, b.h);
      ov.style.setProperty("--dh", dh + "px");
      zone.style.cssText = `left:${b.l - b.w * 0.08}px;top:${b.t - b.h * 0.04}px;width:${b.w * 1.16}px;height:${b.h * 1.06}px`;
      fw.dh = dh;
      for (const o of fw.list) fw.place(o);
      // 말풍선: 머리 오른쪽 위 (방 안으로)
      const hp = act.anchor("forehead"), bw = bub.offsetWidth, bh = bub.offsetHeight;
      const bx = U.clamp(hp.x + dh * 0.18, 6, st.w - bw - 6), by = U.clamp(hp.y - dh * 0.42 - bh, 6, st.h - bh - 6);
      bubW.style.transform = `translate(${bx}px,${by}px)`;
    };

    // 증상 꾸밈 (피·상처 그림 없이 부드럽게) — 아픈 부위에
    const marks = [];
    const mk = (cls, nm, html = "", dx = 0, dy = 0, rot = 0) => {
      const e = U.el("span", cls, html);
      follow(e, nm, dx, dy, rot);
      marks.push(e);
      return e;
    };
    let scrape = null, thorn = null;
    if (P.id === "knee") scrape = mk("hpScrape", "kneeR");
    if (P.id === "thorn") thorn = mk("hpThorn", "handR", "", 0.0, -0.03, 25);
    if (P.id === "bump") {
      act.bump("headTop", 0.06);
      act.glow("headTop", "#ff8fa0", 0.45, 0.1);
    }
    if (P.id === "itch") {
      const d = mk("hpDots", "armL", "<i></i><i></i><i></i>");
      [[10, 10], [58, 22], [28, 62]].forEach(([x, y], i) => Object.assign(d.children[i].style, { left: x + "%", top: y + "%" }));
    }
    if (P.id === "tummy") {
      mk("hpSwirl", "belly", KP.E("🌀"));
      mk("hpWord", "belly", "꾸르륵", 0.2, -0.04);
    }
    if (P.id === "fever") {
      act.glow("forehead", "#ff5a4a", 0.55, 0.24);
      mk("hpDrop", "forehead", KP.E("💦"), 0.17, 0.0);
      mk("hpDrop", "forehead", KP.E("💦"), -0.16, 0.04).style.animationDelay = "0.9s";
    }
    if (P.id === "cough") mk("hpWord", "mouth", "콜록!", 0.2, 0);
    if (P.id === "sad") {
      mk("hpDrop", "eyeR", KP.E("💧"), 0.01, 0.04);
      mk("hpDrop", "eyeL", KP.E("💧"), -0.01, 0.04).style.animationDelay = "0.8s";
    }
    if (P.id === "sneeze") mk("hpDrop", "nose", KP.E("💧"), 0, 0.04);
    const clearMarks = () => {
      marks.forEach(kill);
      marks.length = 0;
    };
    const spotOf = (k) => (T[k].at === "spot" ? P.spot : T[k].at);
    const host = ov;
    const pt = (nm, dx = 0, dy = 0) => {
      const p = act.anchor(nm);
      return { x: p.x + dx * dh, y: p.y + dy * dh };
    };

    /* ---------- 도구 쟁반 ---------- */
    const tray = ctx.tray;
    let si = 0,
      busy = false,
      lastXY = null,
      dragFrom = null,
      moved = 0;
    const els = {};
    const R = () => Math.max(46, dh * 0.2); // 부위에 닿았다고 보는 거리 (px)
    const nearSpot = (k) => {
      if (!lastXY) return false;
      const p = act.anchor(spotOf(k));
      return Math.hypot(p.x - lastXY.x, p.y - lastXY.y) <= R();
    };
    const toRoom = (x, y) => {
      const r = room.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };
    const showSpot = (k, on) => {
      if (on) {
        const o = fw.find(spotEl);
        if (!o) follow(spotEl, spotOf(k));
        else o.nm = spotOf(k);
        spotEl.classList.add("show");
      } else {
        spotEl.classList.remove("show", "near");
      }
    };
    opts.forEach((k, i) => {
      const t = T[k];
      const b = U.el("div", "hpTool item", '<img alt="" draggable="false" src="' + IMG + k + '.png">');
      b.setAttribute("aria-label", t.n);
      b.style.animationDelay = 300 + i * 80 + "ms";
      b.dataset.k = k;
      if (toolSteps.includes(k)) b.dataset.right = "1"; // 손가락 힌트가 가리키면 열쇠 별 없음
      if (lv === 1 && toolSteps.includes(k)) b.classList.add("glow"); // 1단계: 필요한 도구만 반짝
      tray.appendChild(b);
      els[k] = b;
      const d = KP.drag(b, {
        targets: () => (busy || !T[steps[si]] ? [] : [zone]),
        pad: 30,
        snap: false,
        onPick: (el) => {
          dragFrom = null;
          moved = 0;
          lastXY = null;
          FX.press(el);
          // 아픈 곳 보여 주기 — 어떤 도구를 집어도 같은 곳 (정답 도구가 드러나지 않게)
          if (T[steps[si]] && !busy) showSpot(steps[si], true);
        },
        onMove: (x, y) => {
          if (!dragFrom) dragFrom = { x, y };
          moved = Math.max(moved, Math.hypot(x - dragFrom.x, y - dragFrom.y));
          lastXY = toRoom(x, y);
          if (T[steps[si]]) spotEl.classList.toggle("near", nearSpot(steps[si]));
        },
        accept: () => k === steps[si] && nearSpot(k),
        onReject: () => {
          showSpot(k, false);
          if (k !== steps[si]) {
            act.react(lastXY ? act.hit(lastXY.x, lastXY.y) || "chest" : "chest", -0.02);
            if (steps.indexOf(k) > si) ctx.miss(b, "먼저 " + T[steps[si]].ask);
            else ctx.miss(b, t.use + " 다른 걸 골라 볼까?");
          } else {
            // 맞는 도구인데 아픈 곳이 아닌 데 댐 → 아픈 곳을 보여 줌
            ctx.miss(b, "아픈 곳에 대 줘요!", { soft: true });
            const p = act.anchor(spotOf(k));
            FX.ring(host, p.x, p.y, "#ffb21e", ctx, dh * 0.3);
            showSpot(k, true);
            ctx.after(1600, () => !busy && showSpot(k, false));
          }
        },
        onDrop: (tg) => {
          if (!tg) {
            showSpot(k, false);
            // 콕 누르기만 했으면: 어디에 대는지 보여 주기 (끌어다 대기 안내)
            if (moved < 12 && !busy && live()) guide(k, b);
            return;
          }
          if (busy) return;
          d.lock();
          b.classList.remove("glow");
          b.classList.add("used");
          b.style.transform = "";
          showSpot(k, false);
          useTool(k);
        },
      });
    });
    let guideEl = null;
    /** 도구를 콕 누르기만 하면: 그 도구 그림이 아픈 곳까지 날아가 보여 줌 (끌어다 대기 안내)
        — 어떤 도구든 똑같이 (정답 도구가 드러나지 않게), 도구 이름만 말해 줌 */
    const guide = (k, b) => {
      if (guideEl || !T[steps[si]]) return;
      const sp = spotOf(steps[si]);
      const br = b.getBoundingClientRect(), from = toRoom(br.left + br.width / 2, br.top + br.height / 2), to = act.anchor(sp);
      guideEl = U.el("div", "hpGuide", '<img alt="" src="' + IMG + k + '.png">');
      guideEl.style.transform = `translate(${from.x - 42}px,${from.y - 42}px)`;
      host.appendChild(guideEl);
      showSpot(steps[si], true);
      KP.voice.say(T[k].n + "! 끌어서 아픈 곳에 대 줘요!");
      requestAnimationFrame(() => guideEl && (guideEl.style.transform = `translate(${to.x - 42}px,${to.y - 42}px)`));
      ctx.after(1400, () => {
        if (guideEl) guideEl.remove();
        guideEl = null;
        if (!busy) showSpot(steps[si], false);
      });
    };

    /* ---------- 손으로 돌보기: 토닥토닥(누르기·문지르기) / 꼭 안아 주기(꾹 누르기) ---------- */
    let mode = null,
      pressing = false,
      lx = 0,
      ly = 0,
      dist = 0,
      pats = 0,
      shortHug = 0,
      hugT = null,
      pid = null;
    const patOne = (e) => {
      pats++;
      A.note(["C5", "E5", "G5", "A5", "C6", "E6"][Math.min(5, pats - 1)], { inst: "marimba", dur: 0.25, vol: 0.2 });
      A.sfx("rub");
      const p = toRoom(e.clientX, e.clientY);
      const part = act.hit(p.x, p.y) || "belly";
      act.poke(part, -0.03, 0.14); // 만진 자리가 쏙 들어갔다 나옴
      act.a.sqv = 3;
      FX.hearts(host, p.x, p.y, 1, ctx);
      if (pats >= 6) {
        mode = null;
        pressing = false;
        zone.classList.remove("on", "ask");
        KP.voice.say("토닥토닥.");
        act.happy();
        careDone();
      }
    };
    zone.addEventListener("pointerdown", (e) => {
      if (!mode || !live()) return;
      e.preventDefault();
      if (pressing) return; // 이미 한 손가락으로 누르는 중이면 다른 손가락·손바닥은 무시
      pid = e.pointerId;
      A.unlock();
      try {
        zone.setPointerCapture(e.pointerId);
      } catch (_) {}
      pressing = true;
      lx = e.clientX;
      ly = e.clientY;
      dist = 0;
      if (mode === "pat") patOne(e);
      else if (mode === "hug") {
        act.hug(true);
        act.leanT = 1;
        act.a.sqv = 3;
        A.tone(330, { to: 660, dur: 1, vol: 0.12, type: "triangle" });
        const p = pt("chest");
        FX.float(host, p.x, p.y, KP.E("💗"), "hpFloat", 1100, ctx);
        hugT = ctx.after(1000, () => {
          if (!pressing || mode !== "hug") return;
          mode = null;
          pressing = false;
          zone.classList.remove("on", "ask");
          act.leanT = 0;
          A.sfx("sparkle");
          const q = pt("chest");
          FX.hearts(host, q.x, q.y, 6, ctx);
          KP.voice.say("꼭 안아 줬어요!");
          act.happy();
          careDone();
        });
      }
    });
    zone.addEventListener("pointermove", (e) => {
      if (!pressing || mode !== "pat" || e.pointerId !== pid) return;
      dist += U.dist(lx, ly, e.clientX, e.clientY);
      lx = e.clientX;
      ly = e.clientY;
      if (dist > 70) {
        dist = 0;
        patOne(e);
      }
    });
    const up = (e) => {
      if (!pressing || e.pointerId !== pid) return;
      pressing = false;
      if (mode === "hug") {
        ctx.cancel(hugT);
        act.hug(heldTeddy);
        act.leanT = 0;
        shortHug++;
        if (shortHug === 2) KP.voice.say("손가락을 꾹 누르고 기다려요!");
      }
    };
    zone.addEventListener("pointerup", up);
    zone.addEventListener("pointercancel", up);

    /* ---------- 진행 ---------- */
    let dots = [];
    if (steps.length > 1) {
      const sEl = U.el("div", "hpSteps", steps.map(() => "<i></i>").join(""));
      ov.appendChild(sEl);
      dots = [...sEl.children];
    }
    const askOf = (s) => (T[s] ? T[s].ask : ctx.ACT[s].ask);
    const startStep = () => {
      const s = steps[si];
      if (T[s]) {
        mode = null;
        zone.classList.remove("on", "ask");
        tray.classList.remove("off");
        ctx.hint(() => els[s], si > 0 ? "이제 " + T[s].ask : lv === 3 ? P.seqSay : T[s].ask);
      } else {
        mode = s;
        pats = 0;
        shortHug = 0;
        tray.classList.add("off");
        zone.classList.add("on", "ask");
        ctx.hint(() => zone, ctx.ACT[s].hint);
      }
    };
    const stepDone = async () => {
      if (dots[si]) dots[si].classList.add("on");
      si++;
      ctx.hint(null);
      if (si >= steps.length) return cure();
      await ctx.wait(500);
      if (!live()) return;
      ctx.say("👩‍⚕️ 이제 " + askOf(steps[si]));
      startStep();
    };
    const careDone = async () => {
      await ctx.wait(900);
      if (!live()) return;
      stepDone();
    };
    /** 도구를 아픈 곳에 댔을 때: 도구 그림이 그 부위에 붙어 움직이고, 인형의 그 부위가 반응 */
    const useTool = async (k) => {
      const t = T[k];
      busy = true;
      ctx.hint(null);
      tray.classList.add("off");
      const nm = spotOf(k);
      const use = U.el("div", "hpUse in", '<img alt="" src="' + IMG + k + '.png">');
      use.style.setProperty("--k", t.k);
      const o = follow(use, nm, 0, 0);
      const drop = (ms) =>
        ctx.after(ms, () => {
          use.classList.add("out");
          ctx.after(450, () => kill(use));
        });
      act.react(nm, 0.03);
      FX.ring(host, pt(nm).x, pt(nm).y, "#fff2b0", ctx, dh * 0.3);
      if (t.fx === "stick") {
        // 반창고: 그 부위에 붙어 남음 (인형을 따라감)
        kill(use);
        stick = U.el("span", "hpStick", '<img alt="" src="' + IMG + "band.png" + '">');
        follow(stick, nm, 0, 0);
        A.sfx("snap");
        if (scrape) kill(scrape);
        ctx.after(300, () => FX.burst(host, pt(nm).x, pt(nm).y, "spark", 6, ctx));
        act.mood("sick");
      } else if (t.fx === "rub") {
        use.classList.add("rub");
        o.dx = k === "tissue" ? 0.04 : 0.03;
        o.dy = k === "tissue" ? 0.06 : -0.02;
        [0, 300, 600, 900, 1200].forEach((w) => ctx.after(w, () => (A.sfx("rub"), act.poke(nm, -0.015, 0.12))));
        if (k === "oint") act.glow(nm, "#ffffff", 0.45, 0.12);
        ctx.after(1300, () => {
          A.sfx("sparkle");
          FX.burst(host, pt(nm).x, pt(nm).y, "dust", 7, ctx);
          if (scrape) scrape.classList.add("better");
          if (P.id === "itch") marks.forEach((m) => m.classList.add("gone"));
          if (k === "tissue") {
            clearMarks();
            FX.float(host, pt("nose").x + dh * 0.2, pt("nose").y, "흥!", "hpFloat", 1200, ctx);
          }
          if (k === "oint") act.glow(nm, "#ffffff", 0, 0.12);
        });
        drop(1500);
      } else if (t.fx === "thermo") {
        // 체온계 끝(그림 왼쪽 아래)이 입에 닿게
        use.classList.add("hold");
        o.dx = 0.11;
        o.dy = -0.1;
        [600, 820].forEach((w) => ctx.after(w, () => FX.sound("beep")));
        ctx.after(820, () => FX.float(host, pt("mouth").x + dh * 0.25, pt("mouth").y - dh * 0.1, "삐빅!", "hpFloat", 1200, ctx));
        ctx.after(900, () => act.glow("forehead", "#ff6b5a", 0.2, 0.2));
        drop(1500);
      } else if (t.fx === "ice") {
        use.classList.add("hold");
        o.dy = -0.05;
        FX.sound("cool");
        ctx.after(300, () => FX.burst(host, pt(nm).x, pt(nm).y, "cool", 8, ctx));
        ctx.after(500, () => {
          act.bump("headTop", 0.012);
          act.glow("headTop", "#ff8fa0", 0.1, 0.1);
        });
        drop(1500);
      } else if (t.fx === "beat") {
        // 청진기: 가슴이 콩닥콩닥 (부위가 부풀었다 들어감) + 하트
        use.classList.add("beat");
        o.dy = 0.02;
        [300, 520, 1000, 1220].forEach((w) =>
          ctx.after(w, () => {
            FX.sound("thump");
            act.poke("chest", 0.035, 0.14);
          })
        );
        [400, 1100].forEach((w) => ctx.after(w, () => FX.hearts(host, pt("chest").x, pt("chest").y, 1, ctx)));
        drop(1600);
      } else if (t.fx === "drink") {
        use.classList.add("tilt");
        o.dx = 0.04;
        o.dy = 0.05;
        act.leanT = 0.4;
        ctx.after(600, () => FX.sound("sip"));
        ctx.after(1200, () => (act.leanT = 0));
        drop(1500);
      } else if (t.fx === "pull") {
        use.classList.add("pull");
        ctx.after(650, () => {
          if (thorn) {
            unfollow(thorn); // 껍데기는 그 자리에 두고 가시만 휙 날아감
            thorn.classList.add("fly");
            ctx.after(800, () => thorn.parentNode && thorn.parentNode.remove());
          }
          A.sfx("pop");
          act.react(nm, 0.04);
        });
        drop(1400);
      } else if (t.fx === "teddy") {
        // 곰 인형: 가슴에 안겨 남음 (두 팔로 안음)
        use.classList.remove("in");
        o.dy = 0.03;
        heldTeddy = true;
        act.hug(true);
        A.sfx("boing");
        ctx.after(300, () => FX.hearts(host, pt("chest").x, pt("chest").y, 3, ctx));
        marks.forEach((m) => (m.style.opacity = "0.4"));
      } else if (t.fx === "blanket") {
        // 담요: 몸을 덮고 쿨쿨
        use.classList.remove("in");
        o.dy = 0.08;
        act.mood("sleep", P.blush);
        act.sick(0.3);
        [200, 800].forEach((w) => ctx.after(w, () => FX.float(host, pt("headTop").x + dh * 0.15, pt("headTop").y, KP.E("💤"), "hpZz", 1900, ctx)));
        A.melody([["E5", 2], ["C5", 2], ["G4", 3]], { beat: 0.22, inst: "soft", vol: 0.18 });
        drop(1700);
        ctx.after(1700, () => act.mood(P.mood, P.blush));
      }
      KP.voice.say(t.done);
      await ctx.wait(1800);
      if (!live()) return;
      busy = false;
      stepDone();
    };
    const cure = async () => {
      tray.classList.add("off");
      clearMarks();
      act.sick(0);
      act.mood("happy");
      act.glow("forehead", "#ffffff", 0);
      act.bump("headTop", 0);
      act.hug(false);
      heldTeddy = false;
      ov.querySelectorAll(".hpUse").forEach((e) => {
        unfollow(e);
        e.classList.add("out");
        ctx.after(450, () => e.parentNode && e.parentNode.remove());
      });
      act.happy();
      bub.innerHTML = '<span class="m">' + KP.E("😊") + "</span><span>고마워요!</span>";
      U.replay(bub, "popIn");
      const p = pt("headTop", 0, -0.1);
      FX.hearts(host, p.x, p.y, 7, ctx);
      A.sfx("good");
      A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.14, inst: "marimba", vol: 0.22, when: 0.3 });
      ctx.after(700, () => act.happy());
      ctx.after(1300, () => act.wave(1.8));
      await Promise.race([ctx.say("😊 다 나았어요! 고마워요, 의사 선생님!"), ctx.wait(4500)]);
      if (!live()) return;
      await ctx.wait(300);
      if (!live()) return;
      bub.innerHTML = '<span class="m">' + KP.E("👋") + "</span><span>안녕!</span>";
      act.wave(1.2);
      leaving = true;
      A.sfx("whoosh");
      await Promise.race([act.jumpTo(offX(-1), seat[1], 0.9, 0.28), ctx.wait(1300)]);
      if (!live()) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 최고의 의사 선생님!" : "친구가 다 나았어요!" });
      if (ok && live()) this.next(ctx);
    };

    // 안내
    const intro = U.josa(name, "이/가") + " 아파요! " + P.say + " " + (lv === 1 ? T[P.one].ask : lv === 2 ? "무엇이 필요할까요?" : P.seqSay);
    ctx.say("🏥 " + intro);
    // 점검용
    ctx.hpState = () => ({ tok, steps, si, mode, busy, who: name, sym: P.id, painted: act.painted, gl: !!st.gl, off: tray.classList.contains("off"), spot: T[steps[si]] ? spotOf(steps[si]) : null });
    ctx.hpPoint = (nm) => {
      const r = room.getBoundingClientRect(), p = act.anchor(nm);
      return { x: r.left + p.x, y: r.top + p.y };
    };
    ctx.hpBox = () => {
      const r = room.getBoundingClientRect(), b = act.box();
      return { l: r.left + b.l, r: r.left + b.r, t: r.top + b.t, b: r.top + b.b };
    };
    await Promise.race([enter, ctx.wait(1200)]);
    if (!live()) return;
    startStep();
  },
});
