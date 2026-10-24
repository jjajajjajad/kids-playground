/* 동물 병원 — 아픈 동물 친구가 찾아와요. 의사 선생님(아이)이 증상을 듣고 알맞은 도구를 끌어다 치료해요.
   병원이 무섭지 않게: 주사·피·무서운 장면 없음. 토닥토닥·꼭 안아 주기도 치료예요.
   1단계: 증상 하나 + 필요한 도구가 반짝 (보기 2개 → 열쇠 별 없음)
   2단계: 도구 3개 중 알맞은 것 고르기
   3단계: 두 가지를 순서대로 (예: 가시 빼고 → 반창고) — 보기 4개, 토닥토닥·꼭 안아 주기 포함
   다 나으면 웃으며 "고마워요, 의사 선생님!" 하고 손 흔들며 나가요. */
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
    KP.css("hospital", `
      .hpWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px;gap:8px}
      .hpRoom{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);container-type:size;
        background:linear-gradient(#e3f6f1 0 70%,#f4dcb8 70% 100%)}
      .hpSeat{position:absolute;left:50%;top:76%;width:min(34cqw,52cqh);height:min(8cqh,7cqw);border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#ffd1dc,#ff9fb6);box-shadow:0 1.2cqh 0 #e5839b,0 2.6cqh 2cqh rgba(120,80,40,.18);transform:translate(-50%,-50%)}
      .hpRoom:before{content:"";position:absolute;left:0;right:0;top:70%;height:1.2cqh;background:#e9c99a}
      .hpSign{position:absolute;left:2.4cqw;top:3cqh;width:min(14cqh,12cqw);height:min(14cqh,12cqw);border-radius:50%;background:#fff;box-shadow:0 4px 0 rgba(0,0,0,.07);display:flex;align-items:center;justify-content:center;font-size:min(9cqh,8cqw)}
      .hpSteps{position:absolute;right:2.4cqw;top:3cqh;display:flex;gap:1.2cqw;background:rgba(255,255,255,.85);border-radius:999px;padding:1cqh 1.6cqw}
      .hpSteps i{width:min(6cqh,5cqw);height:min(6cqh,5cqw);border-radius:50%;background:#dfe6ef;transition:background .3s,transform .3s}
      .hpSteps i.on{background:#ff8fab;transform:scale(1.15)}
      .hpPat{--u:min(8.4cqh,12cqw,60px);position:absolute;left:50%;top:calc(76% - var(--u)*5.2);width:calc(var(--u)*6);height:calc(var(--u)*6);margin-left:calc(var(--u)*-3);touch-action:none;border-radius:50%}
      .hpPat.dropHover{background:radial-gradient(circle,rgba(255,197,49,.38) 0 58%,transparent 72%)}
      .hpIn{position:absolute;inset:0;animation:hpEnter .9s cubic-bezier(.3,1.25,.5,1) both}
      @keyframes hpEnter{from{transform:translateX(75cqw) rotate(8deg)}}
      .hpPat.out .hpIn{animation:hpExit .8s ease-in forwards}
      @keyframes hpExit{to{transform:translateX(-80cqw) rotate(-8deg)}}
      .hpBod{position:absolute;inset:0;transform-origin:50% 90%}
      .hpPat.sick .hpBod{animation:hpSway 3s ease-in-out infinite}
      @keyframes hpSway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) translateY(2%)}}
      .hpPat.well .hpBod{animation:hpHop .5s ease-in-out 3}
      @keyframes hpHop{50%{transform:translateY(-12%) scale(1.05)}}
      .hpPat.squish{transform:scale(1.06,.92)}
      .hpEm{position:absolute;left:50%;top:50%;font-size:calc(var(--u)*4.6);line-height:1;transform:translate(-50%,-50%);transition:filter .6s}
      .hpPat.sick .hpEm{filter:saturate(.75) brightness(.97)}
      .hpPat.fever.sick .hpEm{filter:drop-shadow(0 0 calc(var(--u)*.5) rgba(255,90,60,.75)) saturate(1.1)}
      .hpBub{position:absolute;left:calc(var(--u)*-.8);top:calc(var(--u)*-.5);display:flex;align-items:center;gap:calc(var(--u)*.15);background:#fff;border-radius:999px;padding:calc(var(--u)*.15) calc(var(--u)*.45) calc(var(--u)*.15) calc(var(--u)*.2);box-shadow:0 4px 0 rgba(47,58,102,.1);font-size:calc(var(--u)*.62);white-space:nowrap;z-index:8;animation:popIn .4s 1s backwards}
      .hpBub .m{font-size:calc(var(--u)*1.25);line-height:1}
      .hpBub .w{color:var(--ink)}
      .hpMk{position:absolute;pointer-events:none;line-height:1;z-index:4}
      .hpMk.leg{font-size:calc(var(--u)*1.3);transform:translate(-50%,-50%)}
      .hpMk.leg:after{content:"";position:absolute;left:38%;top:42%;width:28%;height:22%;border-radius:50%;background:rgba(255,120,140,.75)}
      .hpMk.paw{font-size:calc(var(--u)*1.3);transform:translate(-50%,-50%)}
      .hpMk.thorn{font-size:calc(var(--u)*.75);transform:translate(-10%,-90%) rotate(20deg)}
      .hpMk.bump{width:calc(var(--u)*1.1);height:calc(var(--u)*.75);border-radius:50% 50% 30% 30%;background:radial-gradient(circle at 40% 35%,#ffd0da,#ff9fb4);transform:translate(-50%,-30%);transition:transform .9s,opacity .9s}
      .hpMk.bump.small{transform:translate(-50%,-10%) scale(.45);opacity:.5}
      .hpMk.dots{width:calc(var(--u)*.9);height:calc(var(--u)*.9);transform:translate(-50%,-50%)}
      .hpMk.dots i{position:absolute;width:30%;height:30%;border-radius:50%;background:#ff8fa0}
      .hpMk.swirl{font-size:calc(var(--u)*1.1);transform:translate(-50%,-50%);animation:spin 3s linear infinite}
      .hpMk.drop{font-size:calc(var(--u)*.8);animation:hpDrip 1.6s ease-in infinite}
      @keyframes hpDrip{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}30%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{transform:translate(-50%,120%) scale(.8);opacity:0}}
      .hpMk.sweat{font-size:calc(var(--u)*.8);animation:hpDrip 2.2s ease-in infinite}
      .hpMk.puff{font-size:calc(var(--u)*.7);color:#6b7a99;white-space:nowrap;animation:hpPuff 2.6s ease-out infinite}
      @keyframes hpPuff{0%,40%{opacity:0;transform:translate(0,0) scale(.6)}55%{opacity:1;transform:translate(10%,-10%) scale(1)}100%{opacity:0;transform:translate(40%,-60%) scale(1.15)}}
      .hpStay{position:absolute;pointer-events:none;line-height:1;z-index:5;animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .hpStay.band{font-size:calc(var(--u)*1.3);transform:translate(-50%,-50%) rotate(-20deg)}
      .hpStay.doll{left:66%;top:74%;font-size:calc(var(--u)*2.2);transform:translate(-50%,-50%)}
      .hpFx{position:absolute;pointer-events:none;line-height:1;z-index:7;font-size:calc(var(--u)*2);transform:translate(-50%,-50%)}
      .hpFx.rub{animation:hpRub .5s ease-in-out 3}
      @keyframes hpRub{0%,100%{transform:translate(-50%,-50%)}25%{transform:translate(-95%,-40%) rotate(-12deg)}75%{transform:translate(-5%,-60%) rotate(12deg)}}
      .hpFx.hold{animation:hpHold 1.5s ease-in-out forwards}
      @keyframes hpHold{0%{transform:translate(-50%,-50%) scale(.3);opacity:0}18%{transform:translate(-50%,-50%) scale(1.1);opacity:1}30%,80%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(.8);opacity:0}}
      .hpFx.beat{animation:hpHold 1.6s ease-in-out forwards}
      .hpFx.drink{animation:hpDrink 1.5s ease-in-out forwards}
      @keyframes hpDrink{0%{transform:translate(-50%,-20%) scale(.4);opacity:0}20%{transform:translate(-50%,-50%);opacity:1}40%,70%{transform:translate(-40%,-60%) rotate(-28deg);opacity:1}100%{transform:translate(-50%,-50%) rotate(0);opacity:0}}
      .hpFx.pull{animation:hpPull 1.4s ease-in-out forwards}
      @keyframes hpPull{0%{transform:translate(-50%,-160%) scale(.5);opacity:0}25%{transform:translate(-30%,-80%);opacity:1}55%{transform:translate(-30%,-80%)}85%{transform:translate(-30%,-230%);opacity:1}100%{transform:translate(-30%,-260%);opacity:0}}
      .hpFx.heart{font-size:calc(var(--u)*.9);animation:hpHeart 1.2s ease-out forwards;z-index:9}
      @keyframes hpHeart{from{transform:translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(calc(-50% + var(--dx,0px)),-260%) scale(1.1);opacity:0}}
      .hpFx.zz{font-size:calc(var(--u)*1);animation:hpZz 1.8s ease-out forwards}
      @keyframes hpZz{from{transform:translate(-50%,-50%) scale(.4);opacity:0}30%{opacity:1}to{transform:translate(40%,-200%) scale(1.2);opacity:0}}
      .hpBed{position:absolute;left:50%;top:80%;font-size:calc(var(--u)*4.4);line-height:1;transform:translate(-50%,-50%);animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .hpPat.sleep .hpBod{animation:none;transform:rotate(-24deg) translate(-4%,8%);transition:transform .5s}
      .hpHug{position:absolute;left:50%;top:55%;font-size:calc(var(--u)*2.4);line-height:1;transform:translate(-50%,-50%) scale(.2);opacity:0;transition:transform 1s ease-out,opacity .3s;z-index:9;pointer-events:none}
      .hpHug.on{transform:translate(-50%,-50%) scale(1.5);opacity:.95}
      .hpHug.done{transform:translate(-50%,-50%) scale(2.2);opacity:0;transition:transform .5s,opacity .5s}
      .hpPat.ask{animation:hpAsk 1.6s ease-in-out infinite}
      @keyframes hpAsk{0%,100%{box-shadow:0 0 0 0 rgba(255,143,171,0)}50%{box-shadow:0 0 0 calc(var(--u)*.35) rgba(255,143,171,.35)}}
      .hpTray{flex:0 0 auto;display:flex;gap:clamp(10px,2.4vw,24px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:clamp(92px,12vw,124px);background:rgba(255,255,255,.7);border-radius:24px;padding:6px 10px;transition:opacity .3s}
      .hpTray.off{opacity:.45;pointer-events:none}
      .hpTool{width:clamp(80px,10.5vw,112px);height:clamp(80px,10.5vw,112px);border-radius:22px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;align-items:center;justify-content:center;font-size:clamp(54px,7.4vw,80px);line-height:1;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)}
      .hpTool.used{visibility:hidden}
      .hpTool.glow{animation:hpGlow 1.3s ease-in-out infinite}
      @keyframes hpGlow{0%,100%{box-shadow:0 6px 0 rgba(47,58,102,.13),0 0 0 0 rgba(255,197,49,.0)}50%{box-shadow:0 6px 0 rgba(47,58,102,.13),0 0 0 10px rgba(255,197,49,.65)}}
      .hpTw{position:relative;display:inline-block;width:1em;height:1em;transform:rotate(-35deg)}
      .hpTw i{position:absolute;left:44%;top:6%;width:.12em;height:.88em;border-radius:.06em .06em .03em .03em;background:linear-gradient(90deg,#8d97a8,#eef2f8 45%,#9aa4b5);transform-origin:50% 4%;box-shadow:0 .02em .03em rgba(0,0,0,.25)}
      .hpTw i:first-child{transform:rotate(-11deg)}
      .hpTw i:last-child{transform:rotate(11deg)}
      .hpTw b{position:absolute;left:39%;top:2%;width:.22em;height:.14em;border-radius:.07em;background:#7c8697}
      @media (orientation:portrait){.hpTool{width:clamp(66px,17.5vw,96px);height:clamp(66px,17.5vw,96px);font-size:clamp(44px,12vw,66px)}.hpTray{gap:8px}}
      @media (orientation:landscape) and (max-height:520px){
        .hpWrap{flex-direction:row;padding:0 10px 8px}
        .hpTray{flex-direction:row;width:calc(2*76px + 26px);min-height:0;gap:8px;align-content:center}
        .hpTool{width:72px;height:72px;font-size:48px;border-radius:18px}
      }
    `);
    const TW = '<span class="hpTw"><i></i><i></i><b></b></span>';
    // 도구: 그림·이름·1단계 안내·잘못 골랐을 때 설명·쓴 뒤 말·연출(어디에 대나)
    ctx.T = {
      band: { e: "🩹", n: "반창고", ask: "반창고를 붙여 줘요!", use: "반창고는 다친 곳에 붙여요.", done: "반창고 착!", fx: "stick", at: "spot" },
      oint: { e: "🧴", n: "연고", ask: "연고를 쓱쓱 발라 줘요!", use: "연고는 상처나 가려운 곳에 발라요.", done: "쓱쓱, 발랐어요!", fx: "rub", at: "spot" },
      thermo: { e: "🌡️", n: "체온계", ask: "체온계로 열을 재 줘요!", use: "체온계는 열이 나는지 재요.", done: "삐빅! 열을 쟀어요.", fx: "hold", at: "mouth" },
      bed: { e: "🛏️", n: "침대", ask: "침대에 눕혀 줘요!", use: "침대는 푹 쉴 때 누워요.", done: "쿨쿨, 푹 쉬어요.", fx: "sleep" },
      steth: { e: "🩺", n: "청진기", ask: "청진기로 콩닥콩닥 소리를 들어 줘요!", use: "청진기는 몸속 소리를 들어요.", done: "콩닥콩닥, 잘 들려요!", fx: "beat", at: "chest" },
      tea: { e: "🍵", n: "따뜻한 차", ask: "따뜻한 차를 줘요!", use: "따뜻한 차는 목이나 배가 아플 때 마셔요.", done: "호로록, 따뜻해요!", fx: "drink", at: "mouth" },
      tweez: { html: TW, n: "핀셋", ask: "핀셋으로 가시를 쏙 빼 줘요!", use: "핀셋은 가시를 뺄 때 써요.", done: "쏙! 가시가 빠졌어요!", fx: "pull", at: "spot" },
      ice: { e: "🧊", n: "얼음주머니", ask: "얼음주머니를 대 줘요!", use: "얼음주머니는 부딪친 곳에 대요.", done: "아, 시원해요!", fx: "hold", at: "spot" },
      tissue: { e: "🧻", n: "휴지", ask: "휴지로 코를 닦아 줘요!", use: "휴지는 콧물을 닦을 때 써요.", done: "흥! 코가 뻥 뚫렸어요!", fx: "rub", at: "nose" },
      doll: { e: "🧸", n: "인형", ask: "인형을 안겨 줘요!", use: "인형은 속상할 때 꼭 안아요.", done: "인형이 생겼어요!", fx: "doll" },
    };
    // 손으로 하는 돌봄 (3단계 두 번째 순서)
    ctx.ACT = {
      pat: { ask: "토닥토닥 해 줘요!", hint: "친구를 토닥토닥 해 줘요!" },
      hug: { ask: "꼭 안아 줘요!", hint: "친구를 꾹 누르고 꼭 안아 줘요!" },
    };
    // 환자: 그림·이름·증상 꾸밈(sym)·말풍선 얼굴/말·증상 문장·1·2단계 도구·3단계 순서와 안내·헷갈리는 도구(보기에서 뺌)·다친 자리(%)
    ctx.P = [
      { a: "🐰", n: "토끼", sym: "leg", m: "😣", w: "아야", say: "토끼가 넘어져서 무릎이 까졌어요.", one: "band", seq: ["oint", "band"], seqSay: "먼저 연고를 바르고, 반창고를 붙여 줘요!", near: ["oint", "band", "ice"], spot: [30, 84] },
      { a: "🐻", n: "곰", sym: "fever", m: "🥵", w: "뜨거워", say: "곰이 열이 나요. 몸이 뜨끈뜨끈해요.", one: "thermo", seq: ["thermo", "bed"], seqSay: "먼저 체온계로 열을 재고, 침대에 눕혀 줘요!", near: ["thermo", "bed", "tea", "ice"] },
      { a: "🐶", n: "강아지", sym: "cough", m: "😖", w: "콜록", say: "강아지가 콜록콜록 기침을 해요.", one: "steth", seq: ["steth", "tea"], seqSay: "먼저 청진기로 소리를 듣고, 따뜻한 차를 줘요!", near: ["steth", "tea", "bed", "thermo", "tissue"] },
      { a: "🐱", n: "고양이", sym: "thorn", m: "😣", w: "아야", say: "고양이 발에 가시가 콕 박혔어요.", one: "tweez", seq: ["tweez", "band"], seqSay: "먼저 핀셋으로 가시를 빼고, 반창고를 붙여 줘요!", near: ["tweez", "band", "oint"], spot: [72, 84] },
      { a: "🐷", n: "돼지", sym: "tummy", m: "😖", w: "꾸르륵", say: "돼지가 배가 아파요. 꾸르륵 꾸르륵.", one: "tea", seq: ["tea", "pat"], seqSay: "먼저 따뜻한 차를 주고, 배를 살살 토닥토닥 해 줘요!", near: ["tea", "bed", "doll"] },
      { a: "🐼", n: "판다", sym: "sad", m: "😢", w: "흑흑", say: "판다가 풍선을 놓쳐서 속상해요.", one: "doll", seq: ["doll", "hug"], seqSay: "먼저 인형을 안겨 주고, 꼭 안아 줘요!", near: ["doll", "tea", "bed"] },
      { a: "🐵", n: "원숭이", sym: "bump", m: "😣", w: "아야", say: "원숭이가 콩! 머리에 혹이 났어요.", one: "ice", seq: ["ice", "pat"], seqSay: "먼저 얼음주머니를 대 주고, 토닥토닥 해 줘요!", near: ["ice", "oint", "band"], spot: [50, 22] },
      { a: "🐘", n: "코끼리", sym: "sneeze", m: "🤧", w: "에취", say: "코끼리가 에취! 콧물이 주르륵 나요.", one: "tissue", seq: ["tissue", "tea"], seqSay: "먼저 휴지로 코를 닦고, 따뜻한 차를 줘요!", near: ["tissue", "tea", "bed", "thermo", "steth"] },
      { a: "🐸", n: "개구리", sym: "itch", m: "😖", w: "가려워", say: "개구리가 모기에 물려서 간지러워요.", one: "oint", seq: ["oint", "pat"], seqSay: "먼저 연고를 바르고, 살살 토닥토닥 해 줘요!", near: ["oint", "band", "ice"], spot: [72, 40] },
    ];
    ctx.wrap = U.el("div", "hpWrap");
    ctx.room = U.el("div", "hpRoom");
    ctx.tray = U.el("div", "hpTray");
    ctx.wrap.append(ctx.room, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.last = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      T = ctx.T;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active;
    const P = U.pick(ctx.P.filter((p) => p !== ctx.last));
    ctx.last = P;
    const steps = lv === 3 ? P.seq.slice() : [P.one];
    const toolSteps = steps.filter((s) => T[s]);
    const nOpt = lv === 1 ? 2 : lv === 2 ? 3 : 4;
    const distract = U.sample(Object.keys(T).filter((k) => !P.near.includes(k)), nOpt - toolSteps.length);
    const opts = U.shuffle([...toolSteps, ...distract]);
    if (opts.length < 3) ctx._fewChoice = true; // 보기 2개(찍어도 반)는 열쇠 별 없음

    /* ---------- 장면 ---------- */
    const room = ctx.room;
    room.innerHTML = "";
    room.appendChild(U.el("div", "hpSign", KP.E("🏥")));
    room.appendChild(U.el("div", "hpSeat"));
    let dots = [];
    if (steps.length > 1) {
      const st = U.el("div", "hpSteps", steps.map(() => "<i></i>").join(""));
      room.appendChild(st);
      dots = [...st.children];
    }
    const pat = U.el("div", "hpPat sick " + P.sym);
    const inn = U.el("div", "hpIn");
    const bod = U.el("div", "hpBod", '<span class="hpEm">' + KP.E(P.a) + "</span>");
    const bub = U.el("div", "hpBub", '<span class="m">' + KP.E(P.m) + '</span><span class="w">' + P.w + "</span>");
    inn.append(bod, bub);
    pat.appendChild(inn);
    room.appendChild(pat);
    const spot = P.spot || [50, 80];
    const AT = { spot, mouth: [50, 66], chest: [50, 86], nose: [50, 58] };
    const mk = (cls, xy, html = "") => {
      const e = U.el("span", "hpMk " + cls, html);
      e.style.left = xy[0] + "%";
      e.style.top = xy[1] + "%";
      bod.appendChild(e);
      return e;
    };
    // 증상 꾸밈 (피·상처 그림 없이 부드럽게)
    const marks = [];
    if (P.sym === "leg") marks.push(mk("leg", spot, KP.E("🦵")));
    if (P.sym === "thorn") {
      marks.push(mk("paw", spot, KP.E("🐾")));
      marks.push(mk("thorn", spot, KP.E("🌵")));
    }
    if (P.sym === "bump") marks.push(mk("bump", spot));
    if (P.sym === "itch") {
      const d = mk("dots", spot, "<i></i><i></i><i></i>");
      [[10, 10], [60, 20], [30, 60]].forEach(([x, y], i) => Object.assign(d.children[i].style, { left: x + "%", top: y + "%" }));
      marks.push(d);
    }
    if (P.sym === "tummy") marks.push(mk("swirl", [50, 88], KP.E("🌀")));
    if (P.sym === "fever") {
      marks.push(mk("sweat", [80, 22], KP.E("💦")));
      marks.push(mk("sweat", [20, 30], KP.E("💦")));
    }
    if (P.sym === "cough") marks.push(mk("puff", [74, 58], "콜록!"));
    if (P.sym === "sad") {
      marks.push(mk("drop", [34, 46], KP.E("💧")));
      marks.push(mk("drop", [66, 46], KP.E("💧")));
    }
    if (P.sym === "sneeze") marks.push(mk("drop", [50, 62], KP.E("💧")));
    marks.forEach((m, i) => (m.style.animationDelay = i * 0.7 + "s"));
    const fx = (cls, xy, html, ms) => {
      const e = U.el("span", "hpFx " + cls, html);
      e.style.left = xy[0] + "%";
      e.style.top = xy[1] + "%";
      inn.appendChild(e);
      if (ms) ctx.after(ms, () => e.remove());
      return e;
    };
    const hearts = (n = 5, xy = [50, 40]) => {
      for (let i = 0; i < n; i++) {
        const h = fx("heart", [xy[0] + (i - (n - 1) / 2) * 6, xy[1]], KP.E(i % 2 ? "💖" : "❤️"), 1400);
        h.style.setProperty("--dx", (i - (n - 1) / 2) * 18 + "px");
        h.style.animationDelay = i * 0.1 + "s";
      }
    };
    // 들어오기: 똑똑
    A.noise({ bp: 500, q: 2, dur: 0.07, vol: 0.3, when: 0.1 });
    A.noise({ bp: 500, q: 2, dur: 0.07, vol: 0.3, when: 0.3 });

    /* ---------- 도구 쟁반 ---------- */
    const tray = ctx.tray;
    tray.innerHTML = "";
    tray.classList.remove("off");
    let si = 0,
      busy = false;
    const els = {};
    opts.forEach((k, i) => {
      const t = T[k];
      const b = U.el("div", "hpTool item", t.html || KP.E(t.e));
      b.style.animationDelay = 300 + i * 80 + "ms";
      b.dataset.k = k;
      if (toolSteps.includes(k)) b.dataset.right = "1"; // 손가락 힌트가 가리키면 열쇠 별 없음
      if (lv === 1 && toolSteps.includes(k)) b.classList.add("glow"); // 1단계: 필요한 도구만 반짝
      tray.appendChild(b);
      els[k] = b;
      const d = KP.drag(b, {
        targets: () => (busy || !T[steps[si]] ? [] : [pat]),
        pad: 40,
        accept: () => k === steps[si],
        onReject: () => {
          U.replay(pat, "wig");
          if (steps.indexOf(k) > si) ctx.miss(b, "먼저 " + T[steps[si]].ask);
          else ctx.miss(b, t.use + " 다른 걸 골라 볼까?");
        },
        onDrop: (tg) => {
          if (!tg || busy) return;
          d.lock();
          b.classList.remove("glow");
          b.classList.add("used");
          b.style.transform = "";
          useTool(k);
        },
      });
    });

    /* ---------- 손으로 돌보기: 토닥토닥(누르기·문지르기) / 꼭 안아 주기(꾹 누르기) ---------- */
    let mode = null,
      pressing = false,
      lx = 0,
      ly = 0,
      dist = 0,
      pats = 0,
      shortHug = 0,
      hugT = null,
      hugEl = null;
    const relXY = (e) => {
      const r = inn.getBoundingClientRect();
      return [U.clamp(((e.clientX - r.left) / r.width) * 100, 5, 95), U.clamp(((e.clientY - r.top) / r.height) * 100, 5, 95)];
    };
    const patOne = (e) => {
      pats++;
      A.note(["C5", "E5", "G5", "A5", "C6", "E6"][Math.min(5, pats - 1)], { inst: "marimba", dur: 0.25, vol: 0.2 });
      A.sfx("rub");
      U.replay(pat, "squish");
      ctx.after(140, () => pat.classList.remove("squish"));
      const h = fx("heart", relXY(e), KP.E(pats % 2 ? "💖" : "❤️"), 1300);
      h.style.setProperty("--dx", U.randf(-20, 20) + "px");
      if (pats >= 6) {
        mode = null;
        pressing = false;
        KP.voice.say("토닥토닥.");
        careDone();
      }
    };
    let pid = null; // 토닥토닥·안아 주기를 하는 손가락
    pat.addEventListener("pointerdown", (e) => {
      if (!mode || !live()) return;
      e.preventDefault();
      if (pressing) return; // 이미 한 손가락으로 누르는 중이면 다른 손가락·손바닥은 무시
      pid = e.pointerId;
      A.unlock();
      try {
        pat.setPointerCapture(e.pointerId);
      } catch (_) {}
      pressing = true;
      lx = e.clientX;
      ly = e.clientY;
      dist = 0;
      if (mode === "pat") patOne(e);
      else if (mode === "hug") {
        pat.classList.add("squish");
        if (!hugEl) {
          hugEl = U.el("span", "hpHug", KP.E("💗"));
          inn.appendChild(hugEl);
        }
        void hugEl.offsetWidth;
        hugEl.classList.add("on");
        A.tone(330, { to: 660, dur: 1, vol: 0.12, type: "triangle" });
        hugT = ctx.after(1000, () => {
          if (!pressing || mode !== "hug") return;
          mode = null;
          pressing = false;
          pat.classList.remove("squish");
          hugEl.classList.add("done");
          A.sfx("sparkle");
          hearts(6, [50, 45]);
          KP.voice.say("꼭 안아 줬어요!");
          careDone();
        });
      }
    });
    pat.addEventListener("pointermove", (e) => {
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
        pat.classList.remove("squish");
        if (hugEl) hugEl.classList.remove("on");
        shortHug++;
        if (shortHug === 2) KP.voice.say("손가락을 꾹 누르고 기다려요!");
      }
    };
    pat.addEventListener("pointerup", up);
    pat.addEventListener("pointercancel", up);

    /* ---------- 진행 ---------- */
    const askOf = (s) => (T[s] ? T[s].ask : ctx.ACT[s].ask);
    const startStep = () => {
      const s = steps[si];
      if (T[s]) {
        mode = null;
        pat.classList.remove("ask");
        tray.classList.remove("off");
        ctx.hint(() => els[s], si > 0 ? "이제 " + T[s].ask : lv === 3 ? P.seqSay : T[s].ask);
      } else {
        mode = s;
        pats = 0;
        shortHug = 0;
        tray.classList.add("off");
        pat.classList.add("ask");
        ctx.hint(() => pat, ctx.ACT[s].hint);
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
      pat.classList.remove("ask");
      await ctx.wait(900);
      if (!live()) return;
      stepDone();
    };
    const useTool = async (k) => {
      const t = T[k];
      busy = true;
      ctx.hint(null);
      tray.classList.add("off");
      const xy = AT[t.at] || [50, 50];
      const pic = t.html || KP.E(t.e);
      if (t.fx === "stick") {
        const s = U.el("span", "hpStay band", pic);
        s.style.left = spot[0] + "%";
        s.style.top = spot[1] + "%";
        bod.appendChild(s);
        A.sfx("snap");
      } else if (t.fx === "doll") {
        bod.appendChild(U.el("span", "hpStay doll", pic));
        A.sfx("boing");
        hearts(3, [66, 60]);
      } else if (t.fx === "rub") {
        fx("rub", xy, pic, 1600);
        [0, 300, 600, 900, 1200].forEach((w) => ctx.after(w, () => A.sfx("rub")));
        ctx.after(1500, () => A.sfx("sparkle"));
        if (k === "tissue") ctx.after(900, () => marks.forEach((m) => m.remove()));
      } else if (t.fx === "hold") {
        fx("hold", xy, pic, 1600);
        if (k === "thermo") [600, 820].forEach((w) => ctx.after(w, () => A.note("A6", { inst: "square", dur: 0.08, vol: 0.08 })));
        else {
          A.sfx("water");
          ctx.after(500, () => marks.forEach((m) => m.classList.add("small")));
        }
      } else if (t.fx === "beat") {
        fx("beat", xy, pic, 1700);
        [300, 520, 1000, 1220].forEach((w) => ctx.after(w, () => A.tone(90, { to: 60, dur: 0.12, vol: 0.3, type: "sine" })));
        ctx.after(400, () => hearts(2, [50, 70]));
      } else if (t.fx === "drink") {
        fx("drink", xy, pic, 1600);
        ctx.after(600, () => A.noise({ bp: 1200, bpTo: 600, q: 1, dur: 0.45, vol: 0.12 }));
      } else if (t.fx === "pull") {
        fx("pull", spot, pic, 1500);
        ctx.after(650, () => {
          const th = marks.find((m) => m.classList.contains("thorn"));
          if (th) th.remove();
          fx("pull", [spot[0] + 4, spot[1] - 4], KP.E("🌵"), 900).style.fontSize = "calc(var(--u)*.75)";
          A.sfx("pop");
        });
      } else if (t.fx === "sleep") {
        const bed = U.el("span", "hpBed", pic);
        inn.insertBefore(bed, bod);
        pat.classList.add("sleep");
        [200, 800].forEach((w) => ctx.after(w, () => fx("zz", [66, 30], KP.E("💤"), 1900)));
        A.melody([["E5", 2], ["C5", 2], ["G4", 3]], { beat: 0.22, inst: "soft", vol: 0.18 });
        ctx.after(1700, () => {
          pat.classList.remove("sleep");
          bed.remove();
        });
      }
      KP.voice.say(t.done);
      await ctx.wait(1800);
      if (!live()) return;
      busy = false;
      stepDone();
    };
    const cure = async () => {
      tray.classList.add("off");
      marks.forEach((m) => m.remove());
      pat.classList.remove("sick", "ask");
      pat.classList.add("well");
      bub.innerHTML = '<span class="m">' + KP.E("😊") + '</span><span class="w">고마워요!</span>';
      U.replay(bub, "popIn");
      hearts(7, [50, 30]);
      A.sfx("good");
      A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.14, inst: "marimba", vol: 0.22, when: 0.3 });
      await Promise.race([ctx.say("😊 다 나았어요! 고마워요, 의사 선생님!"), ctx.wait(4500)]);
      if (!live()) return;
      await ctx.wait(300);
      if (!live()) return;
      bub.innerHTML = '<span class="m">' + KP.E("👋") + '</span><span class="w">안녕!</span>';
      pat.classList.remove("well");
      pat.classList.add("out");
      A.sfx("whoosh");
      await ctx.wait(800);
      if (!live()) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 최고의 의사 선생님!" : "친구가 다 나았어요!" });
      if (ok && live()) this.next(ctx);
    };

    // 안내
    const intro = lv === 1 ? P.say + " " + T[P.one].ask : lv === 2 ? P.say + " 무엇이 필요할까요?" : P.say + " " + P.seqSay;
    ctx.say("🏥 " + intro);
    ctx.hpState = () => ({ tok, steps, si, mode, busy, who: P.n, off: tray.classList.contains("off") }); // 점검용
    startStep();
  },
});
