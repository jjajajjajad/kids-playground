/* 자동 생성 — tools/build.js 묶음. 고치려면 원본(15개)을 고치고 다시 빌드 */

/* ==== js/games/bigkid/colororder.js ==== */
/* =====================================================================
   🎨 색 주문 맞추기 (도전 놀이)
   - 동물 손님이 견본 색 카드를 들고 "이런 색 주세요!"
   - 물감 작업대(KP.paint.studio: 물감 통 + 젓는 그릇)로 섞어서 맞춤
   - "점점 비슷해져요" 막대: 그릇 전체 색과 목표 색의 거리(Lab)로 0~100%
   - 🤲 드리기: 허용 거리 안이면 성공. 아니면 한 방울씩 더 넣어 보는 계산으로
     가장 가까워지는 물감을 찾아 그 통을 가리키며 알려 줌. 되돌릴 수 없으면 "비우고 다시"
   - 단계: 1) 두 물감 1:1 + 분홍·하늘색(빨강/파랑 1 + 하양 2) 2) 두 물감 2:1·1:2  3) 하양·검정이 들어간 색
   - 1단계는 쉽게: 통을 한 번 누르면 한 방울만(꾹 눌러 계속 붓기 없음 → 1:1 이 쉽게 안 틀어짐),
     조금만 저어도(고른 정도 0.5) 드릴 수 있음. 덜 저은 채 드리기를 누르면 곰돌이가 빙글빙글 저어 주고 바로 봄
     (2·3단계는 '먼저 저어요' 안내를 한 번 받은 뒤 또 누르면 저어 줌) → 한 판이 1분 안쪽
   - 손님 말풍선 안에 '넣기 → 젓기 → 드리기' 그림 진행표(✔) — 글 없이 다음 할 일이 보이게.
     말풍선을 누르면 주문을 다시 들려줌
===================================================================== */
"use strict";
KP.game({
  id: "colororder",
  icon: "🎨",
  name: "색 주문 맞추기",
  cat: "bigkid",
  badge: "NEW",
  levels: 3,
  score: "⭐",
  bubble: false,
  setup(ctx) {
    const U = KP.u,
      P = KP.paint;
    KP.css("colororder", `
      .coW{flex:1;min-height:0;display:grid;gap:8px;padding:4px 12px 10px;
        grid-template-areas:"cust" "bowl" "jars" "acts";grid-template-rows:auto minmax(0,1fr) auto auto;grid-template-columns:minmax(0,1fr);justify-items:center;align-items:center}
      .coSide{display:contents}
      .coBowlCell{grid-area:bowl;min-height:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
      .coBowlCell .psMeter{display:none}
      .coJarsCell{grid-area:jars}
      .coCust{grid-area:cust;width:100%;max-width:560px;background:#fff;border-radius:26px;box-shadow:0 6px 0 rgba(47,58,102,.12);
        display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:"ani card" "meter meter";gap:4px 12px;padding:8px 14px 10px;align-items:center;position:relative}
      .coAni{grid-area:ani;font-size:clamp(58px,8.4vh,100px);line-height:1;position:relative;cursor:pointer}
      .coAni.in{animation:coIn .55s cubic-bezier(.3,1.4,.6,1)}
      @keyframes coIn{from{transform:translateX(120%) rotate(18deg);opacity:0}}
      .coAni.out{transition:transform .45s,opacity .45s;transform:translateX(-140%) rotate(-14deg);opacity:0}
      .coSay{grid-area:card;position:relative;justify-self:start;display:flex;align-items:center;gap:10px;background:#f4f7ff;border-radius:20px;padding:8px 12px}
      .coSay::before{content:"";position:absolute;left:-12px;top:50%;margin-top:-10px;border:10px solid transparent;border-right:12px solid #f4f7ff;border-left:0}
      .coCard{width:clamp(76px,11vh,118px);aspect-ratio:5/4;border-radius:14px;border:5px solid #fff;box-shadow:0 5px 0 rgba(47,58,102,.15);background:var(--t);position:relative;overflow:hidden;flex:0 0 auto}
      .coCard::after{content:"";position:absolute;left:12%;top:12%;width:34%;height:22%;border-radius:50%;background:rgba(255,255,255,.45);transform:rotate(-20deg)}
      .coCard.pop{animation:popBig .5s}
      .coRec{display:flex;align-items:center;gap:4px;font-size:22px;color:var(--ink2)}
      .coDrop{width:24px;height:30px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -3px -4px 0 rgba(0,0,0,.12),0 0 0 2px #fff,0 2px 0 2px rgba(47,58,102,.12)}
      .coRec .q{font-size:30px;color:#b5bdd3;padding:0 4px}
      .coSay{cursor:pointer;flex-wrap:wrap}
      .coSteps{display:flex;align-items:center;gap:4px;flex-basis:100%;justify-content:center}
      .coStep{position:relative;width:34px;height:34px;border-radius:50%;background:#fff;box-shadow:0 2px 0 rgba(47,58,102,.12);display:flex;align-items:center;justify-content:center;font-size:21px;line-height:1;opacity:.45;transition:opacity .25s,transform .25s}
      .coStep.now{opacity:1;transform:scale(1.15);box-shadow:0 0 0 3px var(--sun),0 2px 0 rgba(47,58,102,.12)}
      .coStep.ok{opacity:1}
      .coStep.ok:after{content:"✔";position:absolute;right:-5px;bottom:-5px;width:17px;height:17px;border-radius:50%;background:#2fb466;color:#fff;font-size:11px;line-height:17px;text-align:center}
      .coStepA{color:#b5bdd3;font-size:13px}
      @media (orientation:portrait),(max-height:499px){.coSteps{flex-basis:auto}.coStep{width:30px;height:30px;font-size:18px}}
      .coMeter{grid-area:meter;display:flex;align-items:center;gap:8px;width:100%}
      .coDot{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:4px solid #fff;box-shadow:0 3px 0 rgba(47,58,102,.14);background:#eef1f7;position:relative}
      .coDot.goal .e{position:absolute;right:-10px;top:-12px;font-size:20px}
      .coBar{flex:1;height:20px;border-radius:999px;background:#eef1f7;box-shadow:inset 0 2px 4px rgba(0,0,0,.1);overflow:hidden;position:relative}
      .coBar i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ffb3c7,#ffd166,#06d6a0);transition:width .35s}
      .coBar.near{box-shadow:0 0 0 3px var(--sun),inset 0 2px 4px rgba(0,0,0,.1);animation:none}
      /* 굵은 빛 테두리는 막대 옆 한 장(coRing)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임).
         막대(coBar)는 overflow:hidden 이라 안쪽 장식은 잘리므로, 감싸개(coBarW) 안의 형제로 둠 */
      .coBarW{flex:1;min-width:0;position:relative;display:flex;align-items:center}
      .coRing{position:absolute;inset:0;border-radius:999px;pointer-events:none;box-shadow:0 0 0 5px #ffe28a;opacity:0}
      .coBar.near+.coRing{animation:coGlow 1s ease-in-out infinite alternate}
      @keyframes coGlow{to{opacity:1}}
      .coActs{grid-area:acts;display:flex;gap:10px;justify-content:center;width:100%;max-width:560px}
      .coB{background:#fff;border-radius:20px;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-height:72px;font-size:15px;line-height:1.1;flex:1}
      .coB .e{font-size:32px}
      .coB:active{transform:translateY(4px)}
      .coB.main{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000);flex:1.6;font-size:17px}
      .coFly{position:fixed;z-index:80;width:70px;height:70px;border-radius:50%;border:5px solid #fff;pointer-events:none;box-shadow:0 6px 14px rgba(0,0,0,.2);
        transition:transform .75s cubic-bezier(.5,-0.2,.5,1),opacity .75s}
      .coHeart{position:absolute;pointer-events:none;font-size:34px;animation:coHeart 1.1s ease-out forwards;z-index:3}
      @keyframes coHeart{from{transform:translate(-50%,0) scale(.4);opacity:1}to{transform:translate(-50%,-90px) scale(1.2);opacity:0}}
      @media (max-width:420px){
        .psJars{gap:6px}
        .coJarsCell .psJar{width:64px;height:82px}
      }
      /* 폰 세로(360~420px 폭): 3단계 물감 통 5개가 두 줄로 넘어가 그릇(최소 140px)이 통 줄과 겹쳤음 →
         옆 여백·통 사이를 줄여 한 줄로, 손님 칸·단추를 조금 낮게 */
      @media (orientation:portrait) and (max-width:420px){
        .coW{padding:2px 4px 6px;gap:6px}
        .coJarsCell .psJars{gap:4px;flex-wrap:nowrap}
        .coJarsCell .psJar{height:76px}
      }
      @media (orientation:portrait) and (max-height:700px){
        .coAni{font-size:clamp(46px,7.4vh,64px)}
        .coCard{width:clamp(64px,10vh,90px)}
        .coCust{padding:6px 10px 8px}
        .coB{min-height:64px}
        .coB .e{font-size:28px}
      }
      @media (orientation:landscape) and (min-height:500px){
        .coW{grid-template-areas:"jars bowl side";grid-template-columns:auto minmax(0,1fr) minmax(280px,30vw);grid-template-rows:minmax(0,1fr);padding:4px 16px 12px;gap:16px}
        .coSide{grid-area:side;display:flex;flex-direction:column;gap:16px;align-self:stretch;justify-content:center;width:100%}
        .coCust{grid-template-columns:minmax(0,1fr);grid-template-areas:"ani" "card" "meter";justify-items:center;padding:16px 16px 18px;gap:12px}
        .coAni{font-size:clamp(90px,14vh,130px)}
        .coSay{justify-self:center;flex-direction:column;padding:12px 16px}
        .coSay::before{left:50%;top:-12px;margin:0 0 0 -10px;border:10px solid transparent;border-bottom:12px solid #f4f7ff;border-top:0}
        .coCard{width:clamp(110px,15vh,150px)}
        .coJarsCell .psJars{flex-direction:column;flex-wrap:nowrap}
        .coJarsCell .psJar{width:clamp(64px,7.4vh,82px);height:clamp(80px,11vh,118px)}
        .coB{min-height:84px;font-size:16px}
        .coB .e{font-size:36px}
      }
      /* 폰 가로(높이 500 미만): 물감 통 | 그릇 | 손님·단추 — 위아래로 쌓으면 그릇이 통·막대에 가려짐 */
      @media (orientation:landscape) and (max-height:499px){
        .coW{grid-template-areas:"jars bowl side";grid-template-columns:auto minmax(0,1fr) minmax(250px,36vw);grid-template-rows:minmax(0,1fr);padding:4px 10px 8px;gap:10px}
        .coSide{grid-area:side;display:flex;flex-direction:column;gap:8px;align-self:stretch;justify-content:center;width:100%;min-height:0}
        .coCust{padding:6px 10px 8px;gap:4px 8px}
        .coAni{font-size:clamp(46px,13vh,64px)}
        .coSay{padding:6px 8px;gap:6px}
        .coCard{width:clamp(60px,17vh,84px);border-width:4px}
        .coDot{width:30px;height:30px}
        .coJarsCell .psJars{display:grid;grid-template-columns:repeat(2,auto);gap:6px 6px;align-items:end}
        .coJarsCell .psJar{width:64px;height:clamp(76px,22vh,90px)}
        .coB{min-height:68px}
        .coB .e{font-size:28px}
      }
    `);
    const W = U.el("div", "coW");
    const bowlCell = U.el("div", "coBowlCell");
    const jarsCell = U.el("div", "coJarsCell");
    const side = U.el("div", "coSide");
    const cust = U.el("div", "coCust");
    const ani = U.el("div", "coAni");
    const say = U.el("div", "coSay");
    const card = U.el("div", "coCard");
    const rec = U.el("div", "coRec");
    // 할 일 진행표: 💧 넣기 → 🥄 젓기 → 🤲 드리기
    const steps = U.el("div", "coSteps");
    const stepEls = ["💧", "🥄", "🤲"].map((em, i) => {
      if (i) steps.appendChild(U.el("span", "coStepA", "▶"));
      const e = U.el("span", "coStep", KP.E(em));
      steps.appendChild(e);
      return e;
    });
    say.append(card, rec, steps);
    const meter = U.el("div", "coMeter");
    const nowDot = U.el("span", "coDot");
    const bar = U.el("span", "coBar", "<i></i>");
    const goalDot = U.el("span", "coDot goal", KP.E("⭐"));
    const barW = U.el("span", "coBarW"); // 막대 + 빛 테두리(coRing) 감싸개
    barW.append(bar, U.el("span", "coRing"));
    meter.append(nowDot, barW, goalDot);
    cust.append(ani, say, meter);
    const acts = U.el("div", "coActs");
    const mk = (em, label, cls = "") => U.btn(KP.E(em) + "<span>" + label + "</span>", "coB " + cls);
    const bGive = mk("🤲", "드리기", "main");
    const bDrain = mk("🫗", "비우기");
    acts.append(bDrain, bGive);
    side.append(cust, acts);
    W.append(bowlCell, jarsCell, side);
    ctx.body.appendChild(W);

    const studio = P.studio({
      ctx,
      capacity: 40,
      // 1단계: 통을 한 번 누르면 한 방울만 (꾹 눌러도 계속 붓지 않음) — 누를 때마다 지금 단계를 물음
      hold: () => ctx.level !== 1,
      onPour: () => {
        if (!ctx.poured) ctx.hint(() => studio.bowl.cv, "숟가락으로 빙글빙글 저어 봐요!");
        ctx.poured = true;
        ctx.nearTold = false;
        ctx.dirty = true;
      },
      onStir: () => (ctx.dirty = true),
    });
    jarsCell.appendChild(studio.jarsEl);
    bowlCell.appendChild(studio.bowlEl);
    Object.assign(ctx, { studio, ani, card, rec, bar, nowDot, goalDot, bGive, bDrain, cust, stepEls });

    ctx.fitBowl = () => {
      const r = bowlCell.getBoundingClientRect();
      studio.fit(Math.min(r.width * 0.96, r.height - 6, 560));
    };
    addEventListener("resize", () => ctx._active && requestAnimationFrame(ctx.fitBowl));

    ctx.tap(bGive, () => this.give(ctx));
    ctx.tap(bDrain, async () => {
      if (ctx.busy) return;
      if (studio.bowl.volume() < 0.05) return KP.voice.say("그릇이 벌써 비어 있어요!");
      ctx.busy = true;
      KP.voice.say("쏴아! 비웠어요. 다시 섞어 봐요.");
      await studio.drain();
      ctx.poured = false;
      ctx.busy = false;
      ctx.dirty = true;
      ctx.nearTold = false;
      this.hintFirst(ctx);
    });
    ani.addEventListener("click", () => {
      U.replay(ani, "jump");
      KP.audio.sfx("boing");
      if (ctx.order) KP.voice.say("이런 색 주세요! " + ctx.order.name + "!");
    });
    // 말풍선(견본 카드 포함)을 누르면 주문을 다시 들려줌 (화면 위 말풍선을 끈 놀이라 여기가 말풍선 역할)
    say.addEventListener("click", () => {
      U.replay(card, "pop");
      if (ctx.order) KP.voice.say(ctx.order.ask);
    });
  },

  /* ---------- 단계별 주문 ---------- */
  RECIPES: {
    // 1단계: 주황·초록·보라 + 분홍·하늘색(하양을 넣으면 밝아져요) — 하양 통은 그 판에만 나옴
    1: [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [1, 0, 1, 0, 0], [1, 0, 0, 2, 0], [0, 0, 1, 2, 0]],
    2: [[1, 2, 0, 0, 0], [2, 1, 0, 0, 0], [0, 2, 1, 0, 0], [0, 1, 2, 0, 0], [2, 0, 1, 0, 0]],
    3: [[0, 0, 1, 2, 0], [1, 0, 1, 2, 0], [1, 1, 0, 3, 0], [0, 0, 0, 2, 1], [0, 0, 2, 0, 1], [0, 1, 0, 3, 0], [0, 1, 1, 0, 1], [3, 0, 1, 3, 0], [1, 1, 1, 0, 0]],
  },
  /* 허용 거리: 각 물감 양을 단계별 비율(1단계 ±30%, 2단계 ±25%, 3단계 ±20%)만큼 바꿨을 때의
     평균 색 차이를 쓰고, 단계별 범위로 자름 → 예민한 색(청록 등)과 둔한 색(귤색 등)의 공정성 맞춤 */
  TOL: { 1: [0.3, 12, 18], 2: [0.25, 8, 14], 3: [0.2, 6, 10] },
  // 이만큼 고르게 저어야 드릴 수 있음 (1단계는 조금만 저어도 됨)
  EVEN: { 1: 0.5, 2: 0.72, 3: 0.72 },
  evenNeed(ctx) {
    return this.EVEN[ctx.level] || 0.72;
  },
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
  ANIMALS: [["🐻", "곰"], ["🐰", "토끼"], ["🐱", "고양이"], ["🐶", "강아지"], ["🐼", "판다"], ["🦊", "여우"], ["🐸", "개구리"], ["🐧", "펭귄"], ["🐨", "코알라"], ["🐷", "돼지"]],
  MORE: ["빨갛게", "노랗게", "파랗게", "밝게", "어둡게"],

  start(ctx) {
    ctx.busy = false;
    ctx.giveWait = 0;
    ctx.round = 0;
    ctx.studio.setEnabled(true);
    ctx.studio.bowl.clear();
    requestAnimationFrame(() => {
      ctx.fitBowl();
      let acc = 0,
        stirTold = 0;
      ctx.loop((dt, now) => {
        ctx.studio.tick(dt);
        acc += dt;
        if (acc < 0.25) return;
        acc = 0;
        this.updateMeter(ctx);
        const st = ctx.studio.state,
          vol = ctx.studio.bowl.volume();
        // 넣고 가만히 있으면 젓기 안내
        if (!ctx.busy && ctx.poured && vol > 0.6 && st.even < this.evenNeed(ctx) && now - st.lastPourAt > 3000 && now - st.lastStirAt > 3000 && now - stirTold > 10000) {
          stirTold = now;
          KP.voice.say("숟가락으로 빙글빙글 저어요!");
        }
      });
    });
    this.next(ctx, true);
  },

  next(ctx, first) {
    const U = KP.u,
      P = KP.paint;
    const lv = ctx.level;
    const list = this.RECIPES[lv];
    // 최근 2판과 다른 주문 (주문이 5가지 이상이면)
    const recent = (ctx.recentV = ctx.recentV || []);
    let v;
    do v = U.pick(list);
    while ((list.length > 1 && ctx.order && v === ctx.order.v) || (list.length > 3 && recent.includes(v)));
    recent.push(v);
    while (recent.length > 2) recent.shift();
    const target = P.mix(v);
    const name = P.nameOf(target).n;
    let an;
    do an = U.pick(this.ANIMALS);
    while (ctx.order && an[0] === ctx.order.an[0]);
    ctx.order = { v, target, name, hex: P.hex(target), tol: this.tolFor(v, lv), an, lv };
    ctx.poured = false;
    ctx.nearTold = false;
    ctx.dirty = true;
    ctx.busy = false;
    ctx.stirAsk = 0;
    ctx.studio.setEnabled(true);
    ctx.studio.bowl.clear();
    // 하양·검정은 3단계에서만 (1단계 분홍·하늘색 판은 하양만)
    [3, 4].forEach((id) => (ctx.studio.jar(id).style.display = lv >= 3 || v[id] > 0 ? "" : "none"));
    // 손님 등장
    ctx.ani.classList.remove("out");
    ctx.ani.innerHTML = KP.E(an[0]);
    U.replay(ctx.ani, "in");
    ctx.card.style.setProperty("--t", ctx.order.hex);
    ctx.goalDot.style.background = ctx.order.hex;
    U.replay(ctx.card, "pop");
    // 레시피 힌트: 1단계 = 넣을 물감과 양, 2단계 = 넣을 물감만, 3단계 = 비밀
    const R = ctx.rec;
    R.innerHTML = "";
    if (lv <= 2) {
      v.forEach((x, i) => {
        if (!x) return;
        if (R.childNodes.length) R.appendChild(U.el("span", "", "+"));
        // 1단계는 양도 보여 줌(분홍 = 빨강 방울 1 + 하양 방울 2)
        for (let k = 0; k < (lv === 1 ? x : 1); k++) {
          const d = U.el("span", "coDrop");
          d.style.setProperty("--c", P.BASE[i].hex);
          R.appendChild(d);
        }
      });
    } else R.appendChild(U.el("span", "q", "?"));
    // 소리: "진초록이에요." 처럼 자연 음성이 없는 색 이름은 "진초록!" 으로 (조각마다 자연 음성)
    const nat = (t) => !KP.voice._natUrls || !!KP.voice._natUrls(t);
    // 인사도 같은 방식: "안녕! 나는 펭귄이에요." 통째 음성이 없으면 "안녕! 나는 펭귄!" (조각마다 자연 음성)
    const helloFull = "안녕! 나는 " + U.josa(an[1], "이에요/예요") + ". ";
    const hello = first ? helloFull : "";
    const helloSay = !first ? "" : nat(helloFull.trim()) ? helloFull : "안녕! 나는 " + an[1] + "! ";
    const nameSay = nat(U.josa(name, "이에요/예요") + ".") ? U.josa(name, "이에요/예요") + "." : name + "!";
    ctx.order.ask = "이런 색 물감 주세요! " + nameSay;
    ctx.say(an[0] + " " + hello + "이런 색 물감 주세요! " + U.josa(name, "이에요/예요") + ".", helloSay + ctx.order.ask);
    this.hintFirst(ctx);
  },
  hintFirst(ctx) {
    const o = ctx.order;
    if (!o) return;
    const first = o.v.findIndex((x) => x > 0);
    ctx.hint(() => ctx.studio.jar(first), "물감 통을 눌러 그릇에 넣어요!");
  },

  /** 비슷한 정도 0~100 (허용 거리 안 = 85% 이상) */
  closeness(d, tol) {
    if (d <= tol) return 85 + 15 * (1 - d / tol);
    return 85 * Math.max(0, 1 - (d - tol) / 55);
  },
  updateMeter(ctx) {
    if (!ctx.order) return;
    const P = KP.paint,
      bowl = ctx.studio.bowl;
    const vol = bowl.volume();
    let pct = 0;
    if (vol > 0.3) {
      const c = bowl.color();
      ctx.nowDot.style.background = P.hex(c);
      const d = P.dist(c, ctx.order.target);
      pct = this.closeness(d, ctx.order.tol);
      ctx.lastD = d;
    } else ctx.nowDot.style.background = "#eef1f7";
    ctx.bar.firstChild.style.width = Math.round(pct) + "%";
    const near = pct >= 85;
    ctx.bar.classList.toggle("near", near);
    // 진행표: 넣기(물감이 들어감) → 젓기(고르게) → 드리기
    const poured = vol > 0.5,
      stirred = poured && ctx.studio.state.even >= this.evenNeed(ctx);
    const stage = ctx.busy && ctx.order && ctx.order.served ? 3 : stirred ? 2 : poured ? 1 : 0;
    ctx.stepEls.forEach((e, i) => {
      e.classList.toggle("ok", i < stage);
      e.classList.toggle("now", i === stage);
    });
    if (near && !ctx.nearTold && !ctx.busy && ctx.studio.state.even >= this.evenNeed(ctx) && performance.now() - ctx.studio.state.lastPourAt > 700) {
      ctx.nearTold = true;
      KP.audio.sfx("sparkle");
      KP.voice.say("거의 똑같아요! 드리기를 눌러요!");
      ctx.hint(() => ctx.bGive, "드리기를 눌러요!");
    }
  },

  /**
   * 도움말 계산
   * 1) 그릇이 넘치기 전에 허용 거리 안으로 갈 길이 있는지: 주문 레시피 비율로 맞추려면
   *    각 물감을 얼마나 더 넣어야 하는지(부족분) 를 양을 늘려 가며 찾음 (다른 색이 섞였으면 묽혀서)
   * 2) 부족한 물감들 중에서 '한 방울 더 넣었을 때 거리가 가장 줄어드는' 물감을 고름
   *    (한 방울만 보는 방식은 하늘색에 노랑을 권하는 등 엉뚱한 길로 빠질 때가 있어 부족분 안에서만 고름)
   * → {id, lot} 또는 null(되돌릴 수 없음 → 비우고 다시)
   */
  advice(ctx, tot) {
    const o = ctx.order;
    return KP.paint.advise(tot, o.v, o.target, o.tol, ctx.studio.bowl.capacity); // 공용(paint.js) — 색깔 섞기도 같이 씀
  },

  async give(ctx) {
    const U = KP.u,
      P = KP.paint;
    if (ctx.busy || !ctx.order) return;
    const o = ctx.order,
      studio = ctx.studio,
      bowl = studio.bowl;
    const vol = bowl.volume() + studio.state.pending;
    if (vol < 0.5) {
      ctx.miss(ctx.bGive, "먼저 물감을 넣어요!", { soft: true });
      return this.hintFirst(ctx);
    }
    if (studio.state.pending > 0.01 || performance.now() - studio.state.lastPourAt < 400) {
      // 방울이 아직 떨어지는 중 → 잠깐 뒤에 다시 봄
      if (!ctx.giveWait) ctx.giveWait = ctx.after(450, () => ((ctx.giveWait = 0), this.give(ctx)));
      return;
    }
    if (studio.state.even < this.evenNeed(ctx)) {
      // 1단계(또는 한 번 안내받은 뒤): 대신 빙글빙글 저어 주고 바로 봄 — 한 판이 너무 길어지지 않게
      if (ctx.level === 1 || ctx.stirAsk >= 1) return this.autoStir(ctx);
      ctx.stirAsk++;
      ctx.miss(ctx.bGive, "먼저 숟가락으로 빙글빙글 저어요!", { soft: true });
      ctx.hint(() => bowl.cv, "그릇을 빙글빙글 저어요!");
      return;
    }
    const tot = bowl.total();
    const d = P.dist(P.mix(tot), o.target);
    if (d <= o.tol) return this.success(ctx);
    // 도움말
    U.replay(ctx.card, "pop");
    const best = this.advice(ctx, tot);
    if (best) {
      const p = P.BASE[best.id];
      const lot = best.lot;
      const tail = lot ? "많이 넣어 봐요!" : "조금 더 넣어 봐요!";
      // "노랑을 조금 더 넣어 봐요!" 통째 음성이 없으면 "노랑! 조금 더 넣어 봐요!" (조각마다 자연 음성)
      const tipFull = U.josa(p.n, "을/를") + " " + tail;
      const tip = !KP.voice._natUrls || KP.voice._natUrls(tipFull) ? tipFull : p.n + "! " + tail;
      ctx.miss(null, null, { soft: true });
      KP.voice.say("음, 조금 달라요. " + (lot ? "훨씬 더 " : "조금 더 ") + this.MORE[best.id] + " 해 볼까요? " + tip);
      U.replay(ctx.ani, "wig");
      ctx.hint(() => studio.jar(best.id), tip);
    } else {
      ctx.miss(null, null, { soft: true });
      KP.voice.say("앗, 물감이 너무 많이 들어갔어요. 비우고 다시 해 볼까요?");
      U.replay(ctx.ani, "wig");
      ctx.hint(() => ctx.bDrain, "비우기를 누르고 다시 해 봐요!");
    }
  },

  /** 대신 저어 주기: 그릇 가운데를 빙글빙글 (공용 bowl.stir 로 손가락 젓기와 같은 계산) → 고르게 되면 드리기 */
  async autoStir(ctx) {
    const studio = ctx.studio,
      bowl = studio.bowl;
    ctx.busy = true;
    ctx.autoStirs = (ctx.autoStirs || 0) + 1; // 점검용
    ctx.hint(null);
    KP.voice.say("먼저 빙글빙글 섞어 볼까요?"); // 자연 음성 있는 문장
    const sess = ctx._session,
      need = this.evenNeed(ctx);
    let t = 0,
      last = null;
    await new Promise((res) => {
      ctx.loop((dt) => {
        if (ctx._session !== sess) return res(), false;
        t += dt;
        const S = bowl.size(),
          a = t * 7.5,
          r = S * (0.18 + 0.1 * Math.sin(t * 2.3));
        const p = { x: S / 2 + Math.cos(a) * r, y: S / 2 + Math.sin(a) * r };
        if (last) bowl.stir(p.x, p.y, p.x - last.x, p.y - last.y);
        last = p;
        studio.state.lastStirAt = performance.now();
        // 1.2초 이상 젓고 고르게 됐으면 끝 (최대 4초)
        if ((t > 1.2 && studio.state.even >= need) || t > 4) return res(), false;
      });
    });
    if (ctx._session !== sess || !ctx._active) return;
    ctx.busy = false;
    if (studio.state.even < need) studio.state.even = need; // 4초 저었으면 고르게 된 걸로
    this.give(ctx);
  },

  async success(ctx) {
    const U = KP.u,
      P = KP.paint;
    const o = ctx.order;
    ctx.busy = true;
    o.served = true;
    this.updateMeter(ctx);
    ctx.hint(null);
    ctx.studio.setEnabled(false);
    const sess = ctx._session;
    // 그릇에서 손님에게 물감이 날아감
    const a = ctx.studio.bowl.cv.getBoundingClientRect(),
      b = ctx.ani.getBoundingClientRect();
    const fly = U.el("div", "coFly");
    fly.style.background = P.hex(ctx.studio.bowl.color());
    fly.style.left = a.left + a.width / 2 - 35 + "px";
    fly.style.top = a.top + a.height / 2 - 35 + "px";
    document.body.appendChild(fly);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fly.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.5)";
        fly.style.opacity = ".3";
      })
    );
    setTimeout(() => fly.remove(), 800);
    KP.audio.sfx("whoosh");
    await ctx.wait(750);
    if (ctx._session !== sess) return;
    U.replay(ctx.ani, "jump");
    KP.audio.sfx("good");
    for (let i = 0; i < 3; i++) {
      const h = U.el("span", "coHeart", KP.E(U.pick(["💖", "✨", "💛"])));
      h.style.left = 30 + i * 22 + "%";
      h.style.top = "10%";
      h.style.animationDelay = i * 0.15 + "s";
      ctx.cust.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
    const isNew = P.discover(o.name);
    // "도감에 보라가 생겼어요!" 통째 음성이 없으면 "보라! 도감에 생겼어요!" (조각마다 자연 음성)
    const newTxt = () => {
      const full = " 도감에 " + U.josa(o.name, "이/가") + " 생겼어요!";
      return KP.voice._natUrls && !KP.voice._natUrls(full) ? " " + o.name + "! 도감에 생겼어요!" : full;
    };
    KP.voice.say(U.pick(["와, 똑같아요! 고마워요!", "딱 이 색이에요! 고마워요!", "우와, 정말 예뻐요! 고마워요!"]) + (isNew ? newTxt() : ""));
    ctx.score.add(1);
    ctx.round++;
    await ctx.wait(1400);
    if (ctx._session !== sess) return;
    const ok = await ctx.win({ msg: o.name + " 완성!", big: ctx.round % 4 === 0 });
    if (!ok) return;
    ctx.ani.classList.add("out");
    await ctx.studio.drain();
    if (!ctx._active || ctx._session !== sess) return;
    this.next(ctx);
  },
});

;

/* ==== js/games/bigkid/connect.js ==== */
/* 짝 잇기 — 왼쪽 그림에서 오른쪽 짝까지 손가락으로 선을 그어 연결
   주제: 엄마와 아기, 동물과 먹이, 동물과 집, 탈것과 길, 짝꿍 물건
   1단계: 3쌍 (쉬운 주제)  2단계: 4쌍  3단계: 5쌍 (모든 주제) — 화면이 낮으면(폰 가로) 들어가는 만큼만
   짝 설명 말: [그림, 짝, 설명, 자연 음성 조각 문장] — 설명 문장에 자연 음성이 없으면 조각 문장("원숭이는 바나나 냠냠!")으로
   (선 긋기가 어려우면 왼쪽 → 오른쪽 차례로 톡톡 눌러도 이어진다) */
"use strict";
KP.game({
  id: "connect",
  icon: "🔗",
  name: "짝 잇기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("connect", `
      .cnBoard{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:26px;background:#fff;box-shadow:var(--shadow);overflow:hidden;touch-action:none;background-image:radial-gradient(circle at 50% 50%,rgba(242,154,0,.06),transparent 70%)}
      .cnSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
      .cnCol{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;z-index:2;width:44%}
      .cnCol.l{left:0}.cnCol.r{right:0}
      .cnItem{--s:min(clamp(80px,min(15vw,17vh),140px),var(--fs,999px));width:var(--s);height:var(--s);border-radius:26px;background:#fff8e6;box-shadow:0 6px 0 #f1d79a;display:flex;align-items:center;justify-content:center;font-size:calc(var(--s)*.66);line-height:1;position:relative;touch-action:none;transition:transform .12s;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*70ms)}
      .cnCol.r .cnItem{background:#eaf6ff;box-shadow:0 6px 0 #b8dcf7}
      .cnItem.sel{transform:scale(1.1);box-shadow:0 0 0 6px var(--sun),0 6px 0 #f1d79a}
      .cnItem.done{background:#e6fbec;box-shadow:0 6px 0 #9fe0b3}
      .cnItem.near{transform:scale(1.12)}
      .cnItem .baby{font-size:.6em}
      .cnDot{position:absolute;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:#fff;border:5px solid #f2a640;box-sizing:border-box}
      .cnCol.l .cnDot{right:-9px}.cnCol.r .cnDot{left:-9px;border-color:#5aaeea}
      .cnItem.done .cnDot{border-color:#2fb466}
      .cnLine{fill:none;stroke-linecap:round;stroke-width:11}
      .cnLine.live{stroke:#f2a640;stroke-dasharray:2 18;stroke-width:12}
      .cnLine.bad{stroke:#ff9aa9;transition:opacity .4s}
      .cnLine.ok{animation:cnDraw .35s ease-out}
      @keyframes cnDraw{from{stroke-width:22}}
      @media (orientation:portrait){.cnItem{--s:min(clamp(80px,min(26vw,13vh),130px),var(--fs,999px))}.cnCol{width:46%}}
      .cnSpark{position:absolute;z-index:3;pointer-events:none;font-size:clamp(26px,4vw,40px);line-height:1;margin:-.5em 0 0 -.5em;animation:cnSpark .9s ease-out forwards}
      @keyframes cnSpark{0%{transform:scale(.2);opacity:0}30%{transform:scale(1.2);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.6);opacity:0}}
    `);
    ctx.THEMES = [
      { name: "먹이", easy: 1, say: "동물 친구가 좋아하는 먹이를 이어 주세요!", pairs: [["🐰", "🥕", "토끼는 당근을 냠냠"], ["🐵", "🍌", "원숭이는 바나나를 냠냠", "원숭이는 바나나 냠냠!"], ["🐶", "🦴", "강아지는 뼈다귀를 좋아해요", "강아지는 뼈다귀 좋아해요!"], ["🐱", "🐟", "고양이는 생선을 좋아해요", "고양이는 생선 좋아해요!"], ["🐿️", "🌰", "다람쥐는 도토리를 냠냠", "다람쥐! 도토리 냠냠!"], ["🐼", "🎋", "판다는 대나무를 냠냠", "판다! 대나무 냠냠!"], ["🐭", "🧀", "생쥐는 치즈를 좋아해요", "생쥐! 치즈 좋아해요!"], ["🐝", "🌻", "꿀벌은 꽃에서 꿀을 모아요", "꿀벌은 윙윙! 꽃!"]] },
      { name: "탈것", easy: 1, say: "탈것이 다니는 길을 이어 주세요!", pairs: [["🚗", "🛣️", "자동차는 도로를 달려요", "자동차! 우와, 달려간다!"], ["⛵", "🌊", "배는 바다에 떠요"], ["✈️", "☁️", "비행기는 하늘을 날아요", "비행기! 하늘!"], ["🚂", "🛤️", "기차는 기찻길을 달려요", "기차! 칙칙폭폭!"], ["🚀", "🌙", "로켓은 우주로 슝"], ["🚒", "🔥", "소방차는 불을 꺼요", "소방차! 물을 뿜어요!"], ["🚌", "🏫", "버스 타고 유치원에 가요", "버스! 유치원에 가요"], ["🚑", "🏥", "구급차는 병원으로 가요", "구급차 출발!"]] }, // 8쌍 — 3단계(5쌍)도 판마다 달라짐
      { name: "엄마", easy: 1, say: "엄마와 아기를 이어 주세요!", pairs: [["🐔", "🐥", "엄마 닭과 아기 병아리", "엄마 닭! 아기 병아리!"], ["🐘", "baby:🐘", "엄마 코끼리와 아기 코끼리", "엄마 코끼리! 아기 코끼리!"], ["🦒", "baby:🦒", "엄마 기린과 아기 기린", "엄마 기린! 아기 기린!"], ["🐧", "baby:🐧", "엄마 펭귄과 아기 펭귄", "엄마 펭귄! 아기 펭귄!"], ["🐳", "baby:🐳", "엄마 고래와 아기 고래", "엄마 고래! 아기 고래!"], ["🐢", "baby:🐢", "엄마 거북이와 아기 거북이", "엄마 거북이! 아기 거북이!"]] },
      { name: "집", say: "동물 친구가 사는 곳을 이어 주세요!", pairs: [["🐦", "🪺", "새는 둥지에 살아요"], ["🐟", "🌊", "물고기는 물속에 살아요", "바다에 사는 건 물고기!"], ["🐧", "🧊", "펭귄은 얼음 나라에 살아요", "펭귄! 얼음!"], ["🐫", "🏜️", "낙타는 사막에 살아요"], ["🐒", "🌳", "원숭이는 나무 위에 살아요", "원숭이! 나무!"], ["🐶", "🏠", "강아지는 집에서 살아요", "강아지! 집!"]] },
      { name: "짝꿍", say: "같이 쓰는 짝꿍 물건을 이어 주세요!", pairs: [["🔒", "🔑", "자물쇠는 열쇠로 철컥"], ["🧦", "👟", "양말 신고 운동화 신어요"], ["🥄", "🥣", "숟가락으로 그릇 속 밥을 떠요"], ["⚽", "🥅", "공을 골대에 뻥"], ["🖌️", "🎨", "붓으로 물감을 콕콕"], ["🪥", "🦷", "칫솔로 이를 닦아요"]] },
    ];
    ctx.COLORS = ["#ff7452", "#2f95f5", "#2fb466", "#8a63ee", "#ff5d8f"];
    ctx.board = U.el("div", "cnBoard");
    ctx.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    ctx.svg.setAttribute("class", "cnSvg");
    ctx.colL = U.el("div", "cnCol l");
    ctx.colR = U.el("div", "cnCol r");
    ctx.board.append(ctx.svg, ctx.colL, ctx.colR);
    ctx.body.appendChild(ctx.board);
    ctx.round = 0;
    ctx.token = 0;
    // 화면을 돌리면 그림 크기 상한(--fs)도 다시 (n개가 세로로 들어가게)
    ctx.fitN = (n) => {
      const bh = ctx.board.clientHeight;
      if (bh) ctx.board.style.setProperty("--fs", Math.max(64, Math.floor((bh / n) * 0.84)) + "px");
    };
    addEventListener("resize", () => {
      if (!ctx._active) return;
      if (ctx.cnN) ctx.fitN(ctx.cnN);
      if (ctx.redraw) requestAnimationFrame(() => ctx._active && ctx.redraw());
    });
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastTheme = null;
    this.next(ctx);
  },
  art(e) {
    return e.startsWith("baby:") ? '<span class="baby">' + KP.E(e.slice(5)) + "</span>" : KP.E(e);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const tok = ++ctx.token;
    // 한 판 3~5쌍. 화면이 낮으면 그림이 64px 아래로 작아지지 않는 만큼만
    let n = lv + 2;
    const bh = ctx.board.clientHeight;
    if (bh) {
      while (n > 3 && bh / n < 64 / 0.84) n--;
    }
    ctx.cnN = n;
    ctx.fitN(n); // 세로로 n개가 들어가는 크기 상한
    // 3단계는 '엄마' 주제를 뺌 — 아기가 같은 그림의 작은 버전이라 그림만 맞추면 됨
    const theme = U.pick(ctx.THEMES.filter((t) => (lv === 1 ? t.easy : true) && !(lv === 3 && t.name === "엄마") && t !== ctx.lastTheme));
    ctx.lastTheme = theme;
    const pairs = U.sample(theme.pairs, n);
    let order = U.shuffle(pairs.map((_, i) => i));
    if (n > 1) while (order.every((v, i) => v === i)) order = U.shuffle(order);

    ctx.colL.innerHTML = "";
    ctx.colR.innerHTML = "";
    ctx.svg.innerHTML = "";
    ctx.say(theme.say);
    const L = pairs.map((p, i) => {
      const b = U.el("div", "cnItem", this.art(p[0]) + '<span class="cnDot"></span>');
      b.dataset.k = i;
      b.dataset.side = "l";
      b.style.setProperty("--i", i);
      ctx.colL.appendChild(b);
      return b;
    });
    const R = order.map((i, k) => {
      const b = U.el("div", "cnItem", this.art(pairs[i][1]) + '<span class="cnDot"></span>');
      b.dataset.k = i;
      b.dataset.side = "r";
      b.style.setProperty("--i", k + 0.5);
      ctx.colR.appendChild(b);
      return b;
    });
    const all = [...L, ...R];
    const done = []; // [k, color]
    const NS = "http://www.w3.org/2000/svg";
    const anchor = (el) => {
      const br = ctx.board.getBoundingClientRect(),
        r = el.getBoundingClientRect();
      return { x: (el.dataset.side === "l" ? r.right : r.left) - br.left, y: r.top + r.height / 2 - br.top };
    };
    const pathD = (a, b) => {
      const mx = (a.x + b.x) / 2;
      return "M" + a.x + " " + a.y + " C" + mx + " " + a.y + " " + mx + " " + b.y + " " + b.x + " " + b.y;
    };
    const mkPath = (cls, color) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "cnLine " + cls);
      if (color) p.setAttribute("stroke", color);
      ctx.svg.appendChild(p);
      return p;
    };
    ctx.redraw = () => {
      if (tok !== ctx.token) return;
      done.forEach(([k, , path]) => path.setAttribute("d", pathD(anchor(L[k]), anchor(R.find((x) => +x.dataset.k === k)))));
    };

    let from = null,
      live = null,
      pid = null,
      moved = false,
      selected = null,
      busy = false;
    const pick = (x, y, side) => {
      let best = null,
        bd = 1e9;
      for (const el of all) {
        if (el.dataset.side !== side || el.classList.contains("done")) continue;
        const r = el.getBoundingClientRect();
        const pad = 26;
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
          const d = U.dist(x, y, r.left + r.width / 2, r.top + r.height / 2);
          if (d < bd) {
            bd = d;
            best = el;
          }
        }
      }
      return best;
    };
    const other = (s) => (s === "l" ? "r" : "l");
    const connect = (a, b) => {
      // a, b: 서로 다른 쪽 그림
      const l = a.dataset.side === "l" ? a : b,
        r = l === a ? b : a;
      if (l.dataset.k === r.dataset.k) {
        const k = +l.dataset.k;
        const color = ctx.COLORS[done.length % ctx.COLORS.length];
        const path = mkPath("ok", color);
        path.setAttribute("d", pathD(anchor(l), anchor(r)));
        done.push([k, color, path]);
        l.classList.add("done");
        r.classList.add("done");
        U.replay(l, "jump");
        U.replay(r, "jump");
        A.sfx("snap");
        A.note(A.SCALE[4 + done.length], { inst: "bell", dur: 0.5, vol: 0.22 });
        // 설명 문장에 자연 음성이 없으면 조각 문장으로 (기기 목소리보다 자연 음성 우선)
        const full = pairs[k][2] + "!";
        KP.voice.say(pairs[k][3] && !(KP.voice._natUrls && KP.voice._natUrls(full)) ? pairs[k][3] : full);
        spark(anchor(l), anchor(r));
        if (done.length === n) finish();
        else hint();
        return true;
      }
      // 틀림: 선을 잠깐 보여 주고 사라짐
      const bad = mkPath("bad");
      bad.setAttribute("d", pathD(anchor(l), anchor(r)));
      ctx.after(350, () => (bad.style.opacity = "0"));
      ctx.after(800, () => bad.remove());
      ctx.miss(b, "음, 짝이 아니에요. 다른 친구를 찾아볼까?");
      return false;
    };
    // 맞춘 선 위로 반짝이 ✨
    const spark = (a, b) => {
      for (let i = 0; i < 4; i++) {
        const t = (i + 1) / 5;
        const sp = U.el("div", "cnSpark", KP.E(i % 2 ? "✨" : "⭐"));
        sp.style.left = a.x + (b.x - a.x) * t + "px";
        sp.style.top = a.y + (b.y - a.y) * t + "px";
        sp.style.setProperty("--dx", U.randf(-30, 30) + "px");
        sp.style.setProperty("--dy", U.randf(-50, -20) + "px");
        sp.style.animationDelay = i * 70 + "ms";
        ctx.board.appendChild(sp);
        ctx.after(1100 + i * 70, () => sp.remove());
      }
      A.sfx("sparkle");
    };
    const clearSel = () => {
      if (selected) selected.classList.remove("sel");
      selected = null;
    };
    const onDown = (e) => {
      if (busy || pid !== null || tok !== ctx.token) return;
      const el = e.target.closest(".cnItem");
      if (!el || el.classList.contains("done")) return;
      e.preventDefault();
      A.unlock();
      // 톡톡 모드: 이미 고른 그림이 반대쪽에 있으면 바로 잇기
      if (selected && selected.dataset.side !== el.dataset.side) {
        const s = selected;
        clearSel();
        connect(s, el);
        return;
      }
      clearSel();
      pid = e.pointerId;
      try {
        ctx.board.setPointerCapture(pid);
      } catch (_) {}
      from = el;
      moved = false;
      from.classList.add("sel");
      A.sfx("pick");
      live = mkPath("live");
      const a = anchor(from);
      live.setAttribute("d", pathD(a, a));
    };
    const onMove = (e) => {
      if (e.pointerId !== pid || !from) return;
      e.preventDefault();
      const br = ctx.board.getBoundingClientRect();
      const a = anchor(from);
      const p = { x: e.clientX - br.left, y: e.clientY - br.top };
      if (U.dist(a.x, a.y, p.x, p.y) > 30) moved = true;
      const t = pick(e.clientX, e.clientY, other(from.dataset.side));
      all.forEach((x) => x.classList.toggle("near", x === t));
      live.setAttribute("d", "M" + a.x + " " + a.y + " L" + p.x + " " + p.y);
      if (Math.random() < 0.12) A.sfx("rub");
    };
    const onUp = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      all.forEach((x) => x.classList.remove("near"));
      if (live) live.remove();
      live = null;
      const f = from;
      from = null;
      if (!f) return;
      f.classList.remove("sel");
      const t = pick(e.clientX, e.clientY, other(f.dataset.side));
      if (t) connect(f, t);
      else if (!moved) {
        // 그냥 톡 눌렀으면 골라 둔 상태로
        selected = f;
        f.classList.add("sel");
        KP.voice.say("이제 짝을 콕 눌러요!");
      }
    };
    ctx.board.onpointerdown = onDown;
    ctx.board.onpointermove = onMove;
    ctx.board.onpointerup = onUp;
    ctx.board.onpointercancel = onUp;

    const hint = () => {
      const l = L.find((x) => !x.classList.contains("done"));
      // 첫 힌트는 왼쪽 그림, 두 번째부터는 그 짝(정답을 보여 준 판은 열쇠 별 없음)
      ctx.hint(() => {
        if (ctx._hint && ctx._hint.shown >= 1) {
          ctx._hinted = true;
          return R.find((x) => x.dataset.k === l.dataset.k);
        }
        return l;
      }, "그림에서 짝까지 손가락으로 쭉 선을 그어요!");
    };
    hint();
    const finish = async () => {
      busy = true;
      ctx.hint(null);
      await ctx.wait(1200);
      if (tok !== ctx.token) return;
      all.forEach((x, i) => ctx.after(i * 60, () => U.replay(x, "jump")));
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 짝꿍 박사!" : "모두 짝을 찾았어요!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});

;

/* ==== js/games/bigkid/dotdot.js ==== */
/* 점 잇기 — 숫자 점을 1부터 차례로 이어서 그림 완성!
   1단계: 점 5~6개(별·집·물고기·보석·배·아이스크림·텐트·나뭇잎), 다음에 누를 점이 살짝 커지고 반짝
   2단계: 점 8개(하트·로켓·왕관·반짝별·레몬·우산·사과·달)
   3단계: 점 12개(나비·열대어·로켓·하트·나무·고양이·자동차·집)
   - 점을 차례로 콕콕 눌러도 되고, 손가락으로 쭉 그어도 이어짐
   - 다 이으면 색이 채워지고 진짜 그림으로 변신하며 이름을 말해요 */
"use strict";
KP.game({
  id: "dotdot",
  icon: "📍",
  name: "점 잇기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("dotdot", `
      .ddBoard{background:radial-gradient(circle at 50% 45%,#ffffff,#eef6ff)}
      .board .ddSpot{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;pointer-events:none;left:0;top:0}
    `);
    const board = U.el("div", "board ddBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "ddSpot");
    board.append(cv, spot);
    ctx.body.appendChild(board);
    const cx = cv.getContext("2d");

    const poly = (n, r1, r2, rot = -90, c = [50, 52]) =>
      Array.from({ length: n }, (_, k) => {
        const r = k % 2 ? r2 : r1,
          a = ((rot + (k * 360) / n) * Math.PI) / 180;
        return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
      });
    // 오각별(한 붓 그리기 별): 오각형 꼭짓점을 두 칸씩 건너 잇기
    const pent = poly(5, 46, 46, -90, [50, 54]);
    const star5 = [0, 2, 4, 1, 3].map((k) => pent[k]);
    function heart(n) {
      const dense = [];
      for (let k = 0; k <= 400; k++) {
        const t = (k / 400) * Math.PI * 2;
        dense.push([16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
      }
      let L = 0;
      const acc = [0];
      for (let k = 1; k < dense.length; k++) acc.push((L += Math.hypot(dense[k][0] - dense[k - 1][0], dense[k][1] - dense[k - 1][1])));
      const out = [];
      for (let i = 0; i < n; i++) {
        const want = (L * i) / n;
        let k = acc.findIndex((v) => v >= want);
        out.push([50 + dense[k][0] * 2.7, 46 + dense[k][1] * 2.7]);
      }
      return out;
    }
    ctx.SHAPES = [
      [
        { name: "별", em: "⭐", color: "#ffd23f", pts: star5 },
        { name: "집", em: "🏠", color: "#ff8a65", pts: [[50, 8], [92, 46], [92, 92], [8, 92], [8, 46]] },
        { name: "물고기", em: "🐟", color: "#4fc3f7", pts: [[6, 50], [40, 20], [94, 78], [94, 22], [40, 80]] },
        { name: "보석", em: "💎", color: "#7fdbff", pts: [[28, 16], [72, 16], [94, 40], [50, 94], [6, 40]] },
        { name: "배", em: "⛵", color: "#4dabf7", pts: [[54, 4], [90, 64], [78, 92], [22, 92], [8, 64]] },
        { name: "아이스크림", em: "🍦", color: "#ffb3c7", pts: [[50, 96], [18, 42], [30, 12], [70, 12], [82, 42]] },
        { name: "텐트", em: "⛺", color: "#ff922b", pts: [[50, 6], [94, 90], [62, 90], [50, 62], [38, 90], [6, 90]] },
        { name: "나뭇잎", em: "🍃", color: "#69db7c", pts: [[50, 4], [84, 36], [74, 80], [50, 96], [26, 80], [16, 36]] },
      ],
      [
        { name: "하트", em: "❤️", color: "#ff5d8f", pts: [[50, 28], [68, 10], [90, 16], [94, 40], [50, 92], [6, 40], [10, 16], [32, 10]] },
        { name: "로켓", em: "🚀", color: "#ff7452", pts: [[50, 4], [68, 28], [68, 62], [86, 90], [50, 78], [14, 90], [32, 62], [32, 28]] },
        { name: "왕관", em: "👑", color: "#ffc531", pts: [[8, 84], [8, 26], [30, 54], [50, 14], [70, 54], [92, 26], [92, 84], [50, 84]] },
        { name: "반짝별", em: "✨", color: "#ffe066", pts: poly(8, 47, 15, -90, [50, 50]) },
        { name: "레몬", em: "🍋", color: "#ffd43b", pts: [[6, 50], [22, 26], [50, 16], [78, 26], [94, 50], [78, 74], [50, 84], [22, 74]] },
        { name: "우산", em: "☂️", color: "#9775fa", pts: [[50, 4], [86, 18], [98, 48], [56, 48], [50, 94], [44, 48], [2, 48], [14, 18]] },
        { name: "사과", em: "🍎", color: "#ff6b6b", pts: [[50, 24], [72, 12], [92, 34], [84, 76], [50, 94], [16, 76], [8, 34], [28, 12]] },
        { name: "달", em: "🌙", color: "#ffd43b", pts: [[62, 4], [28, 14], [10, 50], [28, 86], [62, 96], [42, 76], [36, 50], [42, 24]] },
      ],
      [
        { name: "나비", em: "🦋", color: "#b388ff", pts: [[50, 30], [80, 6], [94, 42], [62, 52], [84, 82], [58, 92], [50, 66], [42, 92], [16, 82], [38, 52], [6, 42], [20, 6]] },
        { name: "열대어", em: "🐠", color: "#ffa94d", pts: [[6, 50], [20, 28], [42, 18], [62, 24], [76, 42], [94, 22], [90, 50], [94, 78], [76, 58], [62, 76], [42, 82], [20, 72]] },
        { name: "로켓", em: "🚀", color: "#ff7452", pts: [[50, 2], [66, 22], [70, 56], [92, 80], [92, 96], [64, 84], [50, 98], [36, 84], [8, 96], [8, 80], [30, 56], [34, 22]] },
        { name: "하트", em: "💖", color: "#ff5d8f", pts: heart(12) },
        { name: "나무", em: "🌲", color: "#43a047", pts: [[50, 2], [76, 34], [62, 34], [88, 68], [58, 68], [58, 96], [50, 96], [42, 96], [42, 68], [12, 68], [38, 34], [24, 34]] },
        { name: "고양이", em: "🐱", color: "#ffa94d", pts: [[20, 4], [36, 26], [50, 24], [64, 26], [80, 4], [86, 36], [94, 60], [80, 86], [50, 96], [20, 86], [6, 60], [14, 36]] },
        { name: "자동차", em: "🚗", color: "#ff6b6b", pts: [[6, 72], [8, 52], [26, 46], [36, 22], [66, 22], [80, 46], [94, 52], [94, 72], [76, 72], [66, 82], [34, 82], [24, 72]] },
        { name: "집", em: "🏡", color: "#ff8a65", pts: [[50, 4], [66, 18], [66, 8], [76, 8], [76, 28], [94, 44], [84, 44], [84, 94], [50, 94], [16, 94], [16, 44], [6, 44]] },
      ],
    ];
    KP.loadE(ctx.SHAPES.flat().map((s) => s.em));
    const COUNT = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열하나", "열둘"];

    let W = 0,
      H = 0;
    const st = (ctx.dd = { ready: false });
    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = board.clientWidth;
      H = board.clientHeight;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      lastSig = ""; // 크기를 다시 넣으면 그림이 지워지므로 다음 장면은 꼭 다시 그림
      st._half = false;
      if (st.ready) layout();
    }
    ctx.ddFit = fit;
    addEventListener("resize", () => ctx._active && fit());
    function layout() {
      st.dr = U.clamp(Math.min(W, H) * 0.036, 19, 27);
      const m = Math.max(st.dr * 1.5, Math.min(W, H) * 0.05);
      st.S = Math.min(W - 2 * m, H - 2 * m);
      // 길쭉한 화면에서는 남는 방향으로 조금 늘려서 점 사이를 넓게
      st.Sx = Math.min(W - 2 * m, st.S * 1.2);
      st.Sy = Math.min(H - 2 * m, st.S * 1.2);
      st.ox = (W - st.Sx) / 2;
      st.oy = (H - st.Sy) / 2;
      st.hitR = Math.max(st.dr * 1.9, 38);
    }
    const X = (p) => st.ox + (p[0] / 100) * st.Sx,
      Y = (p) => st.oy + (p[1] / 100) * st.Sy;

    // 바뀐 게 없으면 다시 그리지 않음 (가만히 있어도 매 장면 점·숫자를 다시 그려 저가 태블릿이 버벅였음)
    // 움직이는 중(1단계 두근두근·반짝·톡·흔들·완성 장면)에는 계속 그림
    let lastSig = "";
    function draw(now) {
      if (!W || !st.ready) return;
      const t = now / 1000;
      const pts = st.shape.pts,
        N = pts.length;
      const moving = st.done || (st.lv === 1 && st.next < N) || st.flashUntil > now || (st.closeK > 0 && st.closeK < 1) || st.pop.some((v) => v > 0) || st.shake.some((v) => v > 0);
      const sig = moving ? "" : [cv.width, cv.height, W, H, st.ox, st.oy, st.Sx, st.dr, st.shape.em, N, st.next, st.closeK, st.rubber ? st.rubber.x + "," + st.rubber.y : "-", document.fonts ? document.fonts.status : ""].join("|");
      if (sig && sig === lastSig) return;
      lastSig = sig;
      // 1단계에서 다음 점 두근두근만 움직일 때는 한 장 걸러 그림 (느린 움직임이라 30장/초로도 부드러움)
      const onlyPulse = !sig && !st.done && !st.rubber && !(st.flashUntil > now) && !(st.closeK > 0 && st.closeK < 1) && !st.pop.some((v) => v > 0) && !st.shake.some((v) => v > 0);
      if (onlyPulse && (st._half = !st._half)) return;
      cx.clearRect(0, 0, W, H);
      cx.lineCap = "round";
      cx.lineJoin = "round";
      // 완성: 색 채우기 → 그림으로 변신
      let fillA = 0,
        emA = 0;
      if (st.done) {
        const e = (now - st.doneAt) / 1000;
        fillA = U.clamp(e / 0.6, 0, 1);
        emA = U.clamp((e - 0.8) / 0.7, 0, 1);
      }
      if (fillA > 0) {
        cx.beginPath();
        pts.forEach((p, k) => (k ? cx.lineTo(X(p), Y(p)) : cx.moveTo(X(p), Y(p))));
        cx.closePath();
        cx.globalAlpha = fillA * (1 - emA * 0.75);
        cx.fillStyle = st.shape.color;
        cx.fill("nonzero");
        cx.globalAlpha = 1;
      }
      // 이은 선
      const lw = Math.max(6, st.dr * 0.42);
      if (st.next > 1) {
        cx.beginPath();
        cx.moveTo(X(pts[0]), Y(pts[0]));
        for (let k = 1; k < st.next; k++) cx.lineTo(X(pts[k]), Y(pts[k]));
        if (st.closeK > 0) {
          const a = pts[N - 1],
            b = pts[0],
            c = Math.min(1, st.closeK);
          cx.lineTo(X(a) + (X(b) - X(a)) * c, Y(a) + (Y(b) - Y(a)) * c);
        }
        cx.globalAlpha = 1 - emA * 0.8;
        cx.strokeStyle = "#2f3a66";
        cx.lineWidth = lw;
        cx.stroke();
        cx.globalAlpha = 1;
      }
      // 고무줄 선
      if (st.rubber && st.next > 0 && !st.done) {
        const a = pts[st.next - 1];
        cx.beginPath();
        cx.moveTo(X(a), Y(a));
        cx.lineTo(st.rubber.x, st.rubber.y);
        cx.strokeStyle = "rgba(47,58,102,.35)";
        cx.lineWidth = lw * 0.8;
        cx.setLineDash([lw, lw * 1.2]);
        cx.stroke();
        cx.setLineDash([]);
      }
      // 점
      if (emA < 1) {
        cx.globalAlpha = 1 - emA;
        pts.forEach((p, k) => {
          const isNext = k === st.next && !st.done;
          let r = st.dr;
          if (isNext && st.lv === 1) r *= 1.3 + 0.08 * Math.sin(t * 5);
          if (st.pop[k]) {
            st.pop[k] = Math.max(0, st.pop[k] - 0.04);
            r *= 1 + 0.35 * Math.sin(st.pop[k] * Math.PI);
          }
          let dx = 0;
          if (st.shake[k]) {
            st.shake[k] = Math.max(0, st.shake[k] - 0.035);
            dx = Math.sin(st.shake[k] * 30) * 6 * st.shake[k];
          }
          const flash = isNext && st.flashUntil > now;
          if ((isNext && st.lv === 1) || flash) {
            cx.fillStyle = "rgba(255,197,49," + (flash ? 0.55 + 0.3 * Math.sin(t * 10) : 0.35) + ")";
            cx.beginPath();
            cx.arc(X(p) + dx, Y(p), r * (flash ? 1.9 : 1.6), 0, 7);
            cx.fill();
          }
          const done = k < st.next;
          cx.fillStyle = done ? st.shape.color : "#fff";
          cx.strokeStyle = done ? "#2f3a66" : isNext ? "#ff7452" : "#6a76a3";
          cx.lineWidth = 4;
          cx.beginPath();
          cx.arc(X(p) + dx, Y(p), r, 0, 7);
          cx.fill();
          cx.stroke();
          cx.fillStyle = done ? "#2f3a66" : isNext ? "#ff7452" : "#2f3a66";
          cx.font = Math.round(r * (k >= 9 ? 0.95 : 1.15)) + "px Jua, sans-serif";
          cx.textAlign = "center";
          cx.textBaseline = "middle";
          cx.fillText(String(k + 1), X(p) + dx, Y(p) + r * 0.08);
        });
        cx.globalAlpha = 1;
      }
      if (emA > 0) {
        const c = st.center;
        const sz = st.S * 0.72 * (0.6 + 0.4 * emA) * (1 + 0.03 * Math.sin(t * 4));
        cx.globalAlpha = emA;
        KP.drawE(cx, st.shape.em, c.x, c.y, sz);
        cx.globalAlpha = 1;
      }
      if (st.next < N && !st.done) {
        spot.style.left = X(pts[st.next]) + "px";
        spot.style.top = Y(pts[st.next]) + "px";
      }
      if (st.closeK > 0 && st.closeK < 1) st.closeK = Math.min(1, st.closeK + 0.06);
    }

    /* ---------- 손가락 ---------- */
    const P = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    function nearest(q) {
      let best = -1,
        bd = 1e9;
      st.shape.pts.forEach((p, k) => {
        const d = Math.hypot(X(p) - q.x, Y(p) - q.y);
        if (d < bd) {
          bd = d;
          best = k;
        }
      });
      return { k: best, d: bd };
    }
    const nextHit = (q) => st.next < st.shape.pts.length && Math.hypot(X(st.shape.pts[st.next]) - q.x, Y(st.shape.pts[st.next]) - q.y) <= st.hitR;
    let pid = null,
      lastTalk = 0;
    function connect() {
      const k = st.next;
      st.pop[k] = 1;
      st.next++;
      A.note(A.SCALE[Math.min(A.SCALE.length - 1, k)] || "C6", { inst: "marimba", dur: 0.35, vol: 0.28 });
      KP.voice.say(COUNT[k + 1] || String(k + 1));
      st.flashUntil = 0;
      if (st.next >= st.shape.pts.length) finish();
      else setHint();
    }
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.done || pid !== null) return;
      const q = P(e);
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      if (nextHit(q)) {
        connect();
        st.rubber = q;
        return;
      }
      const n = nearest(q);
      if (n.d <= st.hitR && n.k < st.next) {
        // 이미 이은 점: 거기서 끌어서 이어 가기
        st.rubber = q;
        return;
      }
      if (n.d <= st.hitR) {
        st.shake[n.k] = 1;
        // 차례가 아닌 점: 가벼운 실수(단계엔 안 셈, 1번까지는 열쇠 별 그대로 — 마구 누르기만 별 제외)
        ctx.miss(null, null, { soft: true });
      }
      st.flashUntil = performance.now() + 1800;
      const now = performance.now();
      if (now - lastTalk > 3000) {
        lastTalk = now;
        KP.voice.say(st.next === 0 ? "1번 점부터 시작해요!" : "다음은 " + KP.u.numNative(st.next + 1) + "!");
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || st.done) return;
      e.preventDefault();
      const q = P(e);
      if (st.rubber) {
        st.rubber = q;
        if (nextHit(q)) connect();
      }
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      st.rubber = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function setHint() {
      ctx.hint(() => spot, st.next === 0 ? "1번 점부터 차례로 이어 봐요!" : KP.u.numNative(st.next + 1) + "! 찾아 봐요!");
    }
    async function finish() {
      st.rubber = null;
      pid = null;
      st.closeK = 0.01;
      ctx.hint(null);
      await ctx.wait(450);
      if (!ctx._active) return;
      st.done = true;
      st.doneAt = performance.now();
      A.sfx("sparkle");
      await ctx.wait(900);
      if (!ctx._active) return;
      const nm = st.shape.name;
      const last = nm.charCodeAt(nm.length - 1);
      const batchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
      // "우와! 집이에요!" 통째 자연 음성이 없으면 "우와! 집!" (조각마다 자연 음성)
      const full = "우와! " + nm + (batchim ? "이에요!" : "예요!");
      KP.voice.say(KP.voice._natUrls && !KP.voice._natUrls(full) ? "우와! " + nm + "!" : full);
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1500);
      if (!ctx._active) return;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 점 잇기 박사!" : st.shape.em + " " + nm + " 완성!" });
      if (ok) ctx.def.next(ctx);
    }
    ctx.ddBuild = (shape, lv) => {
      st.shape = shape;
      st.lv = lv;
      st.next = 0;
      st.done = false;
      st.closeK = 0;
      st.rubber = null;
      st.flashUntil = 0;
      st.pop = shape.pts.map(() => 0);
      st.shake = shape.pts.map(() => 0);
      const xs = shape.pts.map((p) => p[0]),
        ys = shape.pts.map((p) => p[1]);
      fit();
      st.ready = true;
      layout();
      st.center = { x: X([(Math.min(...xs) + Math.max(...xs)) / 2, 0]), y: Y([0, (Math.min(...ys) + Math.max(...ys)) / 2]) };
      setHint();
    };
    ctx.ddDraw = draw;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.bag = {};
    this.next(ctx);
    ctx.loop((dt, now) => ctx.ddDraw(now));
  },
  next(ctx) {
    const U = KP.u,
      lv = ctx.level;
    if (!ctx.bag[lv] || !ctx.bag[lv].length) {
      ctx.bag[lv] = U.shuffle([...ctx.SHAPES[lv - 1]]);
      // 다시 채운 주머니의 첫 모양이 바로 앞 판과 같으면 뒤로 (같은 모양 연달아 방지)
      if (ctx.bag[lv].length > 1 && ctx.bag[lv][0] === ctx.lastShape) ctx.bag[lv].push(ctx.bag[lv].shift());
    }
    const shape = ctx.bag[lv].shift();
    ctx.lastShape = shape;
    ctx.ddBuild(shape, lv);
    // 화면: "1번부터 8번까지 차례로 이어요…" / 소리: 자연 음성이 있는 "1번 점부터 차례로 이어 봐요! 무슨 그림이 나올까?"
    const full = "하나부터 " + KP.u.numNative(shape.pts.length) + "까지 차례로 이어요. 무슨 그림이 나올까?";
    ctx.say("1번부터 " + shape.pts.length + "번까지 차례로 이어요. 무슨 그림이 나올까?", KP.voice._natUrls && !KP.voice._natUrls(full) ? "1번 점부터 차례로 이어 봐요! 무슨 그림이 나올까?" : full);
  },
});

;

/* ==== js/games/bigkid/dress.js ==== */
/* 날씨 옷 입히기 — 오늘 날씨를 보고 곰돌이에게 알맞은 옷·소품을 끌어다 입히기
   날씨: 더움 ☀️ / 비 🌧️ / 눈 ❄️ / 쌀쌀함 🍂
   1단계: 1개 입히기 (보기 3개 — 틀린 2개는 '확실히 안 맞는 것'만)   2단계: 2개 (보기 4개)   3단계: 3개 (보기 5개)
   말은 자연 음성 조각으로: "모자! 썼어요!", "곰돌이한테 맞는 옷을 끌어다 입혀요!" (화면 문장과 소리 문장을 따로)
   안 맞는 옷은 "비 오는 날엔 젖어요!" 하고 돌아오고, 다 입으면 밖에 나가 신나게 논다. */
"use strict";
KP.game({
  id: "dress",
  icon: "👕",
  name: "날씨 옷 입히기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("dress", `
      .drWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px;gap:8px}
      .drScene{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);container-type:size;transition:background .6s}
      .drScene.hot{background:linear-gradient(#8fd6ff,#d9f3ff 66%,#f7e08a 66.3%,#f1cf62)}
      .drScene.rain{background:linear-gradient(#8a9bb5,#c3cedd 66%,#8fb878 66.3%,#79a764)}
      .drScene.snow{background:linear-gradient(#c7d7ec,#eef4fb 66%,#fff 66.3%,#e9f1fb)}
      .drScene.cool{background:linear-gradient(#ffd9a8,#fff0d6 66%,#d9a65f 66.3%,#c48f48)}
      .drSky{position:absolute;left:3cqw;top:3cqh;display:flex;align-items:center;gap:1.4cqw;background:rgba(255,255,255,.85);border-radius:999px;padding:.6cqh 2.4cqw .6cqh .8cqw;box-shadow:0 4px 0 rgba(0,0,0,.08);z-index:3}
      .drSky .em{font-size:min(15cqh,15cqw);line-height:1;animation:drBob 2.4s ease-in-out infinite}
      .drSky .tx{font-size:min(6cqh,6cqw);color:var(--ink)}
      @keyframes drBob{50%{transform:translateY(-6%) rotate(-4deg)}}
      .drFx{position:absolute;inset:0;pointer-events:none;z-index:1}
      .drFx i{position:absolute;top:-10%;display:block}
      .drScene.rain .drFx i{width:3px;height:6cqh;background:linear-gradient(transparent,rgba(255,255,255,.9));border-radius:2px;animation:drFall linear infinite}
      .drScene.snow .drFx i{width:1.6cqh;height:1.6cqh;border-radius:50%;background:#fff;box-shadow:0 0 4px rgba(120,150,200,.6);animation:drSnow linear infinite}
      .drScene.cool .drFx i{font-style:normal;font-size:5cqh;animation:drSnow linear infinite}
      .drScene.hot .drFx i{display:none}
      @keyframes drFall{to{transform:translateY(120cqh)}}
      @keyframes drSnow{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(3cqw,60cqh) rotate(180deg)}100%{transform:translate(-2cqw,120cqh) rotate(360deg)}}
      .drScene.hot:after{content:"";position:absolute;right:-12cqh;top:-12cqh;width:44cqh;height:44cqh;border-radius:50%;background:repeating-conic-gradient(rgba(255,230,120,.5) 0 10deg,transparent 10deg 22deg);-webkit-mask:radial-gradient(circle,#000 25%,transparent 70%);mask:radial-gradient(circle,#000 25%,transparent 70%);animation:spin 14s linear infinite;pointer-events:none}
      /* 곰돌이 */
      .drBear{--u:min(8.4cqh,15cqw);position:absolute;left:50%;bottom:6cqh;width:calc(var(--u)*5);height:calc(var(--u)*7.2);margin-left:calc(var(--u)*-2.5);z-index:2;transition:left 1s ease-in-out}
      .drBear>*{position:absolute;line-height:1}
      .drHead{left:50%;top:0;font-size:calc(var(--u)*3);transform:translateX(-50%);z-index:5}
      .drBody{left:50%;top:calc(var(--u)*2.45);width:calc(var(--u)*2.8);height:calc(var(--u)*2.7);transform:translateX(-50%);border-radius:45%;background:radial-gradient(ellipse at 50% 60%,#f2d2a6 0 32%,#c58a52 34%);z-index:2}
      .drArm{top:calc(var(--u)*2.8);width:calc(var(--u)*.95);height:calc(var(--u)*2.1);border-radius:calc(var(--u)*.5);background:#b97c45;z-index:1}
      .drArm.l{left:calc(var(--u)*.55);transform:rotate(28deg)}.drArm.r{right:calc(var(--u)*.55);transform:rotate(-28deg)}
      .drLeg{top:calc(var(--u)*4.7);width:calc(var(--u)*1.05);height:calc(var(--u)*1.7);border-radius:calc(var(--u)*.5);background:#b97c45;z-index:1}
      .drLeg.l{left:calc(var(--u)*1.35)}.drLeg.r{right:calc(var(--u)*1.35)}
      .drWear{animation:popBig .4s cubic-bezier(.2,1.6,.4,1);transform-origin:50% 50%;pointer-events:none}
      .drWear .e{display:block}
      .s-hat{left:50%;top:calc(var(--u)*-.55);font-size:calc(var(--u)*2.1);margin-left:calc(var(--u)*-1.05);z-index:7}
      .s-eyes{left:50%;top:calc(var(--u)*1.05);font-size:calc(var(--u)*1.7);margin-left:calc(var(--u)*-.85);z-index:7}
      .s-neck{left:50%;top:calc(var(--u)*2.15);font-size:calc(var(--u)*1.9);margin-left:calc(var(--u)*-.95);z-index:6}
      .s-body{left:50%;top:calc(var(--u)*2.35);font-size:calc(var(--u)*3.1);margin-left:calc(var(--u)*-1.55);z-index:4}
      .s-legs{left:50%;top:calc(var(--u)*4.35);font-size:calc(var(--u)*2.3);margin-left:calc(var(--u)*-1.15);z-index:3}
      .s-feet{top:calc(var(--u)*5.95);font-size:calc(var(--u)*1.35);z-index:4}
      .s-feet.l{left:calc(var(--u)*1.05)}.s-feet.r{right:calc(var(--u)*1.05);transform:scaleX(-1)}
      .s-hands{top:calc(var(--u)*4.35);font-size:calc(var(--u)*1.15);z-index:4}
      .s-hands.l{left:calc(var(--u)*.05)}.s-hands.r{right:calc(var(--u)*.05);transform:scaleX(-1)}
      .s-umb{right:calc(var(--u)*-1.3);top:calc(var(--u)*-1.7);font-size:calc(var(--u)*3.2);z-index:8;transform:rotate(14deg)}
      .yellow .e{filter:hue-rotate(18deg) saturate(3.2) brightness(1.08)}
      .red .e{filter:hue-rotate(-40deg) saturate(2.2)}
      .green .e{filter:hue-rotate(95deg) saturate(1.6)}
      .drBear.play{animation:drPlay .7s ease-in-out infinite}
      @keyframes drPlay{0%,100%{transform:none}25%{transform:translateY(-12%) rotate(-6deg)}75%{transform:translateY(-12%) rotate(6deg)}}
      .drFun{position:absolute;bottom:4cqh;font-size:min(20cqh,26cqw);line-height:1;z-index:2;animation:popBig .6s cubic-bezier(.2,1.6,.4,1)}
      .drTray{flex:0 0 auto;display:flex;gap:clamp(10px,2.4vw,24px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:clamp(92px,12vw,124px);background:rgba(255,255,255,.7);border-radius:24px;padding:6px 10px}
      .drItem{width:clamp(80px,10.5vw,112px);height:clamp(80px,10.5vw,112px);border-radius:22px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;align-items:center;justify-content:center;font-size:clamp(54px,7.4vw,80px);line-height:1}
      .drItem.used{display:none}
      @media (orientation:portrait){.drItem{width:clamp(72px,19vw,96px);height:clamp(72px,19vw,96px);font-size:clamp(48px,13vw,66px)}.drTray{gap:8px}}
    `);
    ctx.WEATHER = {
      hot: { em: "☀️", tx: "더워요", say: "오늘은 해님이 쨍쨍, 아주 더워요!", wrong: "더운 날엔 땀이 뻘뻘 나요! 시원한 걸 골라 볼까?", fun: ["⚽", "공놀이하자! 공을 골대에 뻥!"], fx: 0 },
      rain: { em: "🌧️", tx: "비가 와요", say: "오늘은 주룩주룩 비가 와요!", wrong: "비 오는 날엔 다 젖어요! 다른 걸 골라 볼까?", fun: ["💦", "물웅덩이에서 첨벙첨벙!"], fx: 40 },
      snow: { em: "❄️", tx: "눈이 와요", say: "오늘은 하얀 눈이 펑펑 와요. 추워요!", wrong: "눈 오는 날엔 추워서 덜덜 떨려요! 따뜻한 걸 골라 볼까?", fun: ["⛄", "눈사람 만들자!"], fx: 30 },
      cool: { em: "🍂", tx: "쌀쌀해요", say: "오늘은 바람이 쌀쌀해요!", wrong: "쌀쌀한 날엔 감기 걸려요! 따뜻한 걸 골라 볼까?", fun: ["🍁", "낙엽 밟기, 바스락바스락!"], fx: 10 },
    };
    // [그림, 이름, 자리, 맞는 날씨, 색]
    ctx.ITEMS = [
      ["🧢", "모자", "hat", ["hot"]],
      ["🕶️", "선글라스", "eyes", ["hot"]],
      ["👕", "반팔 티셔츠", "body", ["hot"]],
      ["🩳", "반바지", "legs", ["hot"]],
      ["🩴", "샌들", "feet", ["hot"]],
      ["☂️", "우산", "umb", ["rain"]],
      ["🥾", "장화", "feet", ["rain"], "red"],
      ["🧥", "노란 우비", "body", ["rain"], "yellow"],
      ["🧣", "목도리", "neck", ["snow", "cool"]],
      ["🧤", "장갑", "hands", ["snow", "cool"]], // 쌀쌀한 날도 장갑 → 3단계 쌀쌀 판이 4가지 조합 (말: "장갑! 꼈어요!" 자연 음성)
      ["🧥", "두꺼운 패딩", "body", ["snow"]],
      ["🥾", "털부츠", "feet", ["snow"]],
      ["🧥", "점퍼", "body", ["cool"], "green"], // 같은 🧥 그림이 우비·패딩·점퍼 셋 — 색으로 구별
      ["👖", "긴바지", "legs", ["cool", "snow", "rain"]], // 비 오는 날도 긴바지(3단계 비 판이 늘 같은 3개였음)
    ];
    // 날씨별 틀린 보기 (확실히 안 맞는 것만)
    ctx.WRONG = {
      hot: [["🧣", "목도리"], ["🧤", "장갑"], ["🧥", "두꺼운 패딩"], ["🥾", "털부츠"]],
      rain: [["🕶️", "선글라스", "비 오는 날엔 해님이 없어요!"], ["🩴", "샌들", "샌들을 신으면 발이 다 젖어요!"], ["🧢", "모자", "모자는 비에 젖어요! 우산이 필요해요."]],
      snow: [["🩳", "반바지"], ["🩴", "샌들"], ["👕", "반팔 티셔츠"], ["🕶️", "선글라스", "선글라스는 해님 쨍쨍한 날에 써요!"]],
      cool: [["🩳", "반바지"], ["🩴", "샌들"], ["☂️", "우산", "오늘은 비가 안 와요!"], ["🕶️", "선글라스", "선글라스는 해님 쨍쨍한 날에 써요!"]],
    };
    ctx.wrap = U.el("div", "drWrap");
    ctx.scene = U.el("div", "drScene");
    ctx.tray = U.el("div", "drTray");
    ctx.wrap.append(ctx.scene, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastW = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const wk = U.pick(Object.keys(ctx.WEATHER).filter((k) => k !== ctx.lastW));
    ctx.lastW = wk;
    const W = ctx.WEATHER[wk];
    const need = lv;
    const nWrong = 2; // 1단계도 보기 3개(찍어서 반반 맞히기 방지) — 틀린 보기는 WRONG(확실히 안 맞는 것)에서만

    // 장면
    const sc = ctx.scene;
    sc.className = "drScene " + wk;
    sc.innerHTML = "";
    sc.appendChild(U.el("div", "drSky", '<span class="em">' + KP.E(W.em) + '</span><span class="tx">' + W.tx + "</span>"));
    const fx = U.el("div", "drFx");
    for (let i = 0; i < W.fx; i++) {
      const p = U.el("i", "", wk === "cool" ? KP.E(U.pick(["🍂", "🍁"])) : "");
      p.style.left = U.randf(0, 100) + "%";
      p.style.animationDuration = (wk === "rain" ? U.randf(0.6, 1.1) : U.randf(4, 8)) + "s";
      p.style.animationDelay = -U.randf(0, 8) + "s";
      fx.appendChild(p);
    }
    sc.appendChild(fx);
    const bear = U.el("div", "drBear", '<div class="drArm l"></div><div class="drArm r"></div><div class="drLeg l"></div><div class="drLeg r"></div><div class="drBody"></div><div class="drHead">' + KP.E("🐻") + "</div>");
    sc.appendChild(bear);

    // 보기
    // 맞는 옷: 같은 자리(발·몸 등)는 하나만 — 장화+운동화처럼 겹치지 않게
    const good = [];
    U.shuffle(ctx.ITEMS.filter((it) => it[3].includes(wk))).forEach((it) => good.length < need && !good.some((g) => g[2] === it[2]) && good.push(it));
    const bad = U.sample(ctx.WRONG[wk], nWrong).map(([e, n, msg]) => ({ e, n, msg, ok: false }));
    const list = U.shuffle([...good.map(([e, n, slot, , col]) => ({ e, n, slot, col, ok: true })), ...bad]);
    ctx.tray.innerHTML = "";
    let left = need;
    // 화면: "알맞은 옷 두 가지를 입혀 줘요!" / 소리: 자연 음성이 있는 조각들로
    ctx.say(
      W.say + " 곰돌이한테 " + (need === 1 ? "알맞은 옷을 하나" : "알맞은 옷 " + U.cntWord(need) + " 가지를") + " 입혀 줘요!",
      W.say + " 곰돌이한테 맞는 옷을 끌어다 입혀요!" + (need === 2 ? " 두 개!" : need === 3 ? " 세 가지가 필요해요!" : "")
    );
    const els = list.map((it, i) => {
      const b = U.el("div", "drItem item " + (it.col || ""), KP.E(it.e));
      b.style.animation = "itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)";
      b.style.animationDelay = 200 + i * 80 + "ms";
      ctx.tray.appendChild(b);
      const d = KP.drag(b, {
        targets: () => [bear],
        pad: 40,
        accept: () => it.ok,
        onReject: () => {
          ctx.miss(b, it.msg || W.wrong);
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          b.style.transform = "";
          b.classList.add("used");
          wear(it);
          left--;
          if (left === 0) finish();
          else hint();
        },
      });
      b._it = it;
      return b;
    });
    const wear = (it) => {
      const pair = it.slot === "feet" || it.slot === "hands";
      (pair ? ["l", "r"] : [""]).forEach((s) => {
        const w = U.el("div", "drWear s-" + it.slot + " " + s + " " + (it.col || ""), KP.E(it.e));
        bear.appendChild(w);
      });
      U.replay(bear, "jump");
      A.sfx("snap");
      A.sfx("sparkle");
      const verb = it.slot === "umb" ? "썼어요" : it.slot === "feet" ? "신었어요" : it.slot === "hat" || it.slot === "eyes" ? "썼어요" : it.slot === "hands" ? "꼈어요" : it.slot === "neck" ? "둘렀어요" : "입었어요";
      // "우산을 썼어요!" 처럼 통째로 자연 음성이 있으면 그것, 없으면 "모자! 썼어요!" (조각마다 자연 음성)
      const full = U.josa(it.n, "을/를") + " " + verb + "!";
      const more = left > 1 ? " 하나 더!" : "";
      KP.voice.say((KP.voice._natUrls && KP.voice._natUrls(full) ? full : it.n + "! " + verb + "!") + more);
    };
    const hint = () => {
      const b = els.find((x) => x._it.ok && !x.classList.contains("used"));
      ctx.hint(() => b, W.tx + "! 곰돌이한테 맞는 옷을 끌어다 입혀요!");
    };
    hint();

    const finish = async () => {
      ctx.hint(null);
      await ctx.wait(1300);
      if (tok !== ctx.token) return;
      // 밖에 나가 놀기
      ctx.say("다 입었다! 밖에 나가서 놀자! " + W.fun[1]);
      ctx.tray.innerHTML = "";
      const fun = U.el("div", "drFun", KP.E(W.fun[0]));
      fun.style.left = "8%";
      sc.appendChild(fun);
      bear.classList.add("play");
      bear.style.left = "64%";
      A.melody(
        [["C5", 1], ["E5", 1], ["G5", 1], ["E5", 1], ["C5", 1], ["D5", 1], ["E5", 2]],
        { beat: 0.16, inst: "marimba", vol: 0.22 }
      );
      ctx.after(1100, () => (bear.style.left = "40%"));
      ctx.after(2200, () => (bear.style.left = "56%"));
      const splash = wk === "rain" ? ctx.every(500, () => A.sfx("water")) : null;
      await ctx.wait(3400);
      if (splash) ctx.cancel(splash);
      if (tok !== ctx.token) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 옷 입기 박사!" : "날씨에 딱 맞아요!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});

;

/* ==== js/games/bigkid/emotion.js ==== */
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
  /** 돌봄 동작: 기쁨=박수, 슬픔=토닥토닥, 화남=후~, 놀람=두근두근, 무서움=손 꼭, 부끄러움=반짝 */
  doCare(ctx, f, care, scene) {
    const U = KP.u,
      A = KP.audio;
    U.replay(care, "did");
    if (f === "joy") [0, 0.22, 0.44].forEach((w) => A.noise({ dur: 0.07, vol: 0.22, bp: 1800, q: 0.8, when: w }));
    else if (f === "sad") {
      [0, 0.35].forEach((w) => A.noise({ dur: 0.09, vol: 0.12, lp: 500, when: w }));
      if (!ctx.careSaid) KP.voice.say("토닥토닥.");
    } else if (f === "angry") {
      A.noise({ dur: 1.1, vol: 0.1, bp: 900, bpTo: 400, q: 0.6 });
      if (!ctx.careSaid) KP.voice.say("후~");
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

;

/* ==== js/games/bigkid/jigsaw.js ==== */
/* 조각 퍼즐 — 진짜 직소 조각을 끌어다 맞추기
   - 바탕판에 흐린 밑그림과 조각 자리 선, 맞는 자리 근처에 놓으면 착!
   - 크기 2×2 / 3×3 / 4×4 : 단계와 연동(1→2×2, 2→3×3, 3→4×4), 버튼으로도 고를 수 있음
   - 그림: 📷 내 사진(영구 저장) + 🎨 내 작품(그림 그리기·색칠 놀이에서 저장한 그림) + 내장 장면 6개
   - 내 작품 화면의 "🧩 퍼즐로" 단추로 바로 그 그림 퍼즐 시작 (KP.pendingPuzzle)
   - 조각은 볼록/오목 탭이 있는 직소 모양, 완성하면 경계선이 스르륵 사라지며 큰 축하 */
"use strict";
KP.game({
  id: "jigsaw",
  icon: "🧩",
  name: "조각 퍼즐",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("jigsaw", `
      .jgTools{display:flex;gap:clamp(6px,1.4vw,12px);justify-content:center;align-items:center;padding:2px 10px 8px;flex:0 0 auto;flex-wrap:nowrap}
      .jgSize{min-width:clamp(72px,9vw,90px);height:clamp(64px,7.4vw,72px);border-radius:18px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);display:flex;align-items:center;justify-content:center;padding:6px}
      .jgSize.sel{background:var(--sun);box-shadow:0 5px 0 #d9a000}
      .jgGrid{display:grid;gap:2px;width:clamp(30px,4.2vw,40px);height:clamp(30px,4.2vw,40px)}
      .jgGrid i{background:#6a76a3;border-radius:2px}
      .jgSize.sel .jgGrid i{background:#2f3a66}
      .jgPicBtn{height:clamp(64px,7.4vw,66px);border-radius:18px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);display:flex;align-items:center;gap:6px;padding:5px 12px 5px 5px;font-size:clamp(17px,2.4vw,22px)}
      .jgPicBtn img.th{height:100%;aspect-ratio:1;border-radius:12px;object-fit:cover}
      .jgPicBtn .e{font-size:1.4em}
      .jgBoard{background:linear-gradient(180deg,#fff9ec,#ffeccc)}
      .board .jgSpot{position:absolute;pointer-events:none;border-radius:16px;left:0;top:0}
      .jgPick{position:absolute;inset:0;z-index:20;background:rgba(255,247,227,.97);display:none;flex-direction:column;padding:10px 14px 14px;border-radius:24px}
      .jgPick.on{display:flex;animation:popIn .3s}
      .jgPickTop{display:flex;justify-content:space-between;align-items:center;font-size:clamp(20px,3vw,28px);padding:0 4px 8px}
      .jgPickList{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(100px,16vw,160px),1fr));gap:clamp(10px,1.8vw,18px);align-content:start;padding:6px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
      .jgTh{position:relative;aspect-ratio:1;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.14);border:4px solid #fff}
      .jgTh>img{width:100%;height:100%;object-fit:cover;display:block}
      .jgTh .badge img,.jgTh .del img{width:1em;height:1em;display:block}
      .jgTh.add>img{width:52%;height:auto}
      .jgTh.cur{border-color:var(--sun)}
      .jgTh.add{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(36px,5.4vw,56px);gap:2px;background:#e9f6ff;padding:4px}
      .jgTh.add span{font-size:clamp(17px,2.4vw,22px);color:var(--ocean)}
      .jgTh .del{position:absolute;right:6px;top:6px;width:48px;height:48px;border-radius:50%;background:#fff;font-size:28px;display:none;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15)}
      .jgTh.armed .del{display:flex}
      .jgTh .badge{position:absolute;left:6px;bottom:6px;font-size:26px;line-height:1}
      .jgSec{grid-column:1/-1;font-size:clamp(17px,2.3vw,21px);color:#6a5a3a;padding:6px 4px 0}
      .jgPicBtn .lb{white-space:nowrap}
      @media (max-width:520px){.jgPicBtn .lb{display:none}}
      @media (orientation: portrait) and (max-width: 480px), (orientation: landscape) and (max-height: 500px){.jgPicBtn{flex:0 0 auto;min-width:64px;min-height:64px;padding:5px}.jgPicBtn img.th{width:52px;height:52px;flex:0 0 auto}}
    `);

    /* ---------- 화면 ---------- */
    const tools = U.el("div", "jgTools");
    const board = U.el("div", "board jgBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "jgSpot");
    // 놓을 곳 표시(힌트 두 번째부터 손가락이 쟁반 조각 → 이 자리로 움직임 — 공용 힌트의 끌기 '놓을 곳' 안내를 캔버스 조각에도)
    const spotTo = U.el("div", "jgSpot");
    spot._kpDragDest = () => spotTo;
    const pick = U.el("div", "jgPick");
    board.append(cv, spot, spotTo);
    ctx.body.append(tools, board, pick);
    ctx.body.style.position = "relative";
    const cx = cv.getContext("2d");

    const sizeBtns = [2, 3, 4].map((n) => {
      const b = U.btn('<div class="jgGrid" style="grid-template-columns:repeat(' + n + ',1fr)">' + "<i></i>".repeat(n * n) + "</div>", "jgSize");
      b.dataset.n = n;
      ctx.tap(b, () => {
        A.sfx("select");
        U.replay(b, "pop");
        ctx.sizePick = n;
        KP.voice.say(["", "", "네 조각!", "아홉 조각!", "열여섯 조각!"][n]);
        ctx.def.next(ctx, true);
      });
      tools.appendChild(b);
      return b;
    });
    const picBtn = U.btn("", "jgPicBtn");
    tools.appendChild(picBtn);
    ctx.tap(picBtn, () => {
      A.sfx("open");
      openPicker();
    });

    /* ---------- 내장 장면 그리기 ---------- */
    const SZ = 800;
    const SCENES = [
      {
        name: "농장",
        em: ["☀️", "🏠", "🌳", "🐄", "🐷", "🐥", "🚜", "🌼"],
        draw(g) {
          sky(g, "#8fd8ff", "#e4f7ff", 0.62);
          cloud(g, 300, 120, 1);
          cloud(g, 560, 230, 0.7);
          g.fillStyle = "#86d36e";
          g.beginPath();
          g.moveTo(0, 470);
          g.quadraticCurveTo(260, 390, 520, 460);
          g.quadraticCurveTo(700, 500, 800, 440);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          g.fillStyle = "#6cc257";
          g.fillRect(0, 640, 800, 160);
          E(g, "☀️", 660, 120, 170);
          E(g, "🏠", 190, 400, 230);
          E(g, "🌳", 640, 400, 230);
          E(g, "🐄", 390, 590, 230);
          E(g, "🐷", 650, 680, 170);
          E(g, "🐥", 140, 700, 130);
          E(g, "🌼", 280, 730, 80);
          E(g, "🌼", 500, 760, 70);
        },
      },
      {
        name: "바다",
        em: ["⛵", "☀️", "🐳", "🐠", "🐙", "🦀", "🐬", "🐚"],
        draw(g) {
          sky(g, "#bfeaff", "#e9f8ff", 0.25);
          const sea = g.createLinearGradient(0, 200, 0, 800);
          sea.addColorStop(0, "#38b6ff");
          sea.addColorStop(1, "#1a5fc4");
          g.fillStyle = sea;
          g.fillRect(0, 200, 800, 600);
          g.fillStyle = "rgba(255,255,255,.5)";
          for (let x = 0; x < 800; x += 80) {
            g.beginPath();
            g.arc(x + 40, 205, 40, Math.PI, 0);
            g.fill();
          }
          g.fillStyle = "#f6d68e";
          g.beginPath();
          g.moveTo(0, 720);
          g.quadraticCurveTo(400, 650, 800, 730);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          E(g, "☀️", 120, 90, 130);
          E(g, "⛵", 600, 120, 170);
          E(g, "🐳", 250, 360, 250);
          E(g, "🐠", 620, 330, 140);
          E(g, "🐬", 560, 510, 170);
          E(g, "🐙", 230, 610, 180);
          E(g, "🦀", 640, 720, 130);
          E(g, "🐚", 420, 735, 90);
        },
      },
      {
        name: "우주",
        em: ["🌙", "🚀", "🪐", "🛸", "🌍", "⭐"],
        draw(g) {
          sky(g, "#141a4d", "#3b2b80", 1);
          for (let k = 0; k < 120; k++) {
            g.fillStyle = "rgba(255,255,255," + (0.4 + Math.random() * 0.6) + ")";
            g.beginPath();
            g.arc(Math.random() * 800, Math.random() * 800, 1 + Math.random() * 2.5, 0, 7);
            g.fill();
          }
          E(g, "🌙", 650, 140, 190);
          E(g, "🚀", 220, 300, 250, -0.4);
          E(g, "🪐", 590, 460, 220);
          E(g, "🛸", 230, 630, 190);
          E(g, "🌍", 640, 700, 150);
          E(g, "⭐", 420, 170, 80);
          E(g, "⭐", 420, 560, 60);
          E(g, "⭐", 90, 470, 60);
        },
      },
      {
        name: "공룡 나라",
        em: ["🌋", "🦖", "🦕", "🌴", "🥚", "☁️"],
        draw(g) {
          sky(g, "#ffc98a", "#fff1d6", 0.6);
          E(g, "🌋", 590, 270, 300);
          g.fillStyle = "#9fd36a";
          g.beginPath();
          g.moveTo(0, 480);
          g.quadraticCurveTo(400, 420, 800, 490);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          g.fillStyle = "#86c257";
          g.fillRect(0, 690, 800, 110);
          E(g, "☁️", 220, 110, 150);
          E(g, "🌴", 110, 360, 230);
          E(g, "🦕", 590, 580, 270);
          E(g, "🦖", 260, 560, 270);
          E(g, "🥚", 430, 730, 100);
          E(g, "🥚", 500, 750, 80);
        },
      },
      {
        name: "자동차 마을",
        em: ["🚒", "🚓", "🚌", "🚁", "☀️", "🌳"],
        draw(g) {
          sky(g, "#9fdcff", "#eaf8ff", 0.6);
          const cols = ["#ff8a80", "#ffd54f", "#81d4fa", "#a5d6a7", "#ce93d8"];
          let x = 0;
          for (let k = 0; x < 800; k++) {
            const w = 110 + (k % 3) * 30,
              h = 200 + ((k * 73) % 160);
            g.fillStyle = cols[k % cols.length];
            g.fillRect(x, 480 - h, w - 8, h);
            g.fillStyle = "rgba(255,255,255,.75)";
            for (let yy = 480 - h + 20; yy < 450; yy += 44) for (let xx = x + 14; xx < x + w - 34; xx += 34) g.fillRect(xx, yy, 20, 24);
            x += w;
          }
          g.fillStyle = "#7cc96b";
          g.fillRect(0, 470, 800, 60);
          g.fillStyle = "#5b6475";
          g.fillRect(0, 530, 800, 270);
          g.fillStyle = "#fff";
          for (let xx = 20; xx < 800; xx += 110) g.fillRect(xx, 660, 60, 12);
          E(g, "☀️", 680, 90, 130);
          E(g, "🚁", 230, 120, 170);
          E(g, "🌳", 740, 440, 120);
          E(g, "🚌", 600, 590, 200);
          E(g, "🚒", 200, 600, 210);
          E(g, "🚓", 420, 730, 160);
        },
      },
      {
        name: "동물원",
        em: ["🦁", "🐘", "🦒", "🐒", "🌴", "🦜", "☀️"],
        draw(g) {
          sky(g, "#b6ecff", "#f2fbff", 0.55);
          g.fillStyle = "#e9c46a";
          g.beginPath();
          g.moveTo(0, 520);
          g.quadraticCurveTo(400, 470, 800, 520);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          E(g, "☀️", 110, 100, 130);
          E(g, "🌴", 700, 330, 240);
          E(g, "🦒", 160, 400, 300);
          E(g, "🦜", 640, 150, 120);
          E(g, "🐘", 440, 520, 260);
          E(g, "🦁", 220, 680, 200);
          E(g, "🐒", 640, 680, 180);
        },
      },
    ];
    function sky(g, a, b, frac) {
      const gr = g.createLinearGradient(0, 0, 0, SZ * frac);
      gr.addColorStop(0, a);
      gr.addColorStop(1, b);
      g.fillStyle = gr;
      g.fillRect(0, 0, SZ, SZ);
    }
    function cloud(g, x, y, k) {
      g.fillStyle = "rgba(255,255,255,.95)";
      [[0, 0, 50], [45, -20, 42], [85, 5, 40], [-40, 10, 34]].forEach(([dx, dy, r]) => {
        g.beginPath();
        g.arc(x + dx * k, y + dy * k, r * k, 0, 7);
        g.fill();
      });
    }
    function E(g, em, x, y, size, rot) {
      g.save();
      g.shadowColor = "rgba(0,0,0,.18)";
      g.shadowBlur = 10;
      g.shadowOffsetY = 6;
      KP.drawE(g, em, x, y, size, rot || 0);
      g.restore();
    }

    ctx.pics = [];
    ctx.picIdx = 0;
    const allEm = SCENES.flatMap((s) => s.em);
    ctx.picsReady = KP.loadE(allEm).then(async () => {
      SCENES.forEach((sc) => {
        const c = document.createElement("canvas");
        c.width = c.height = SZ;
        sc.draw(c.getContext("2d"));
        ctx.pics.push({ id: "scene:" + sc.name, kind: "scene", name: sc.name, src: c, thumb: c.toDataURL("image/jpeg", 0.7) });
      });
      const photos = (await KP.db.all("photos")).filter((p) => p.kind === "jigsaw");
      for (const p of photos) ctx.pics.push(await photoPic(p));
    });
    /** 내 작품(4:3 등)은 잘리지 않게 흰 종이 가운데에 맞춰 정사각형으로 — 고를 때 만듦(메모리 절약) */
    function artPic(a) {
      const o = { id: "art:" + a.id, kind: "art", name: "내 작품", src: null, thumb: a.img };
      o.load = () =>
        o.src
          ? Promise.resolve(o)
          : new Promise((res) => {
              const im = new Image();
              im.onload = () => {
                const c = document.createElement("canvas");
                c.width = c.height = SZ;
                const g = c.getContext("2d");
                g.fillStyle = "#fffdf6";
                g.fillRect(0, 0, SZ, SZ);
                const k = Math.min(SZ / im.width, SZ / im.height);
                g.drawImage(im, (SZ - im.width * k) / 2, (SZ - im.height * k) / 2, im.width * k, im.height * k);
                o.src = c;
                res(o);
              };
              im.onerror = () => res(null);
              im.src = KP.safeImg(a.img);
            });
      return o;
    }
    /** 내 작품 목록 새로 고침 (다른 놀이에서 새로 저장했을 수 있음) */
    ctx.jgRefreshArt = async () => {
      let arts = [];
      try {
        arts = (await KP.db.all("art")).filter((x) => x.kind !== "zoo" && KP.safeImg(x.img));
      } catch (e) {}
      const have = new Set(ctx.pics.filter((p) => p.kind === "art").map((p) => p.id));
      const ids = new Set(arts.map((a) => "art:" + a.id));
      const cur = ctx.pics[ctx.picIdx];
      ctx.pics = ctx.pics.filter((p) => p.kind !== "art" || ids.has(p.id)); // 지운 작품 빼기
      arts.reverse().forEach((a) => !have.has("art:" + a.id) && ctx.pics.push(artPic(a)));
      const i = cur ? ctx.pics.indexOf(cur) : -1;
      ctx.picIdx = i >= 0 ? i : 0;
    };
    function photoPic(p) {
      return new Promise((res) => {
        const im = new Image();
        const o = { id: p.id, kind: "photo", name: "내 사진", src: im, thumb: p.img };
        im.onload = () => res(o);
        im.onerror = () => res(o);
        im.src = p.img;
      });
    }

    /* ---------- 그림 고르기 ---------- */
    async function openPicker() {
      await ctx.jgRefreshArt();
      if (!ctx._active) return;
      pick.innerHTML = "";
      const top = U.el("div", "jgPickTop", "<span>" + KP.E("🖼️") + " 어떤 그림으로 할까요?</span>");
      const close = U.btn(KP.E("✖️"), "barBtn");
      ctx.tap(close, () => {
        A.sfx("back");
        pick.classList.remove("on");
      });
      top.appendChild(close);
      const list = U.el("div", "jgPickList");
      const add = U.el("button", "jgTh add", KP.E("📷") + "<span>내 사진</span>");
      ctx.tap(add, async () => {
        A.sfx("tap");
        const got = await KP.pickPhotos(false, 800);
        if (!got || !got.length) return;
        if (!ctx._active) return;
        const rec = { id: KP.newId(), kind: "jigsaw", img: got[0], t: Date.now() };
        const saved = await KP.db.put("photos", rec);
        if (saved === false) KP.toast("사진을 저장하지 못했어요. 이번에만 쓸 수 있어요");
        KP.persist && KP.persist();
        const p = await photoPic(rec);
        ctx.pics.push(p);
        pick.classList.remove("on");
        ctx.picIdx = ctx.pics.length - 1;
        KP.voice.say("내 사진 퍼즐이에요!");
        ctx.def.next(ctx, true);
      });
      list.appendChild(add);
      const SEC = { photo: KP.E("📷") + " 내 사진", art: KP.E("🎨") + " 내가 그린 그림", scene: KP.E("🖼️") + " 그림 나라" };
      const order = ["photo", "art", "scene"];
      const sorted = ctx.pics.map((p, k) => [p, k]).sort((a, b) => order.indexOf(a[0].kind) - order.indexOf(b[0].kind) || a[1] - b[1]);
      let lastKind = "";
      sorted.forEach(([p, k]) => {
        if (p.kind !== lastKind) {
          lastKind = p.kind;
          if (p.kind !== "photo") list.appendChild(U.el("div", "jgSec", SEC[p.kind]));
        }
        const th = U.el("button", "jgTh" + (k === ctx.picIdx ? " cur" : ""), '<img src="' + KP.safeImg(p.thumb) + '" alt="" draggable="false">');
        if (p.kind === "photo") {
          th.appendChild(U.el("span", "badge", KP.E("📷")));
          // 어른용: 1초 꾹 누르면 지우기 버튼
          const del = U.el("span", "del", KP.E("🗑️"));
          th.appendChild(del);
          let hold = 0;
          th.addEventListener("pointerdown", () => (hold = setTimeout(() => (th.classList.add("armed"), A.sfx("pop")), 1000)));
          ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => th.addEventListener(ev, () => clearTimeout(hold)));
          del.addEventListener("click", async (e) => {
            e.stopPropagation();
            // 지우기에 실패하면(false) 목록에서 빼지 않음 — 다음에 열면 다시 나타나는 일 방지
            if ((await KP.db.del("photos", p.id)) === false) {
              th.classList.remove("armed");
              return KP.toast("지우지 못했어요. 다시 해 주세요");
            }
            const i = ctx.pics.indexOf(p);
            ctx.pics.splice(i, 1);
            if (ctx.picIdx >= ctx.pics.length) ctx.picIdx = 0;
            A.sfx("whoosh");
            openPicker();
          });
        }
        if (p.kind === "art") th.appendChild(U.el("span", "badge", KP.E("🎨")));
        ctx.tap(th, () => {
          if (th.classList.contains("armed")) return;
          A.sfx("select");
          ctx.picIdx = k;
          pick.classList.remove("on");
          KP.voice.say(p.kind === "photo" ? "내 사진 퍼즐!" : p.kind === "art" ? "내가 그린 그림 퍼즐!" : p.name + " 퍼즐!");
          ctx.def.next(ctx, true);
        });
        list.appendChild(th);
      });
      pick.append(top, list);
      pick.classList.add("on");
    }
    ctx.jgClosePicker = () => pick.classList.remove("on");

    /* ---------- 조각 모양 ---------- */
    // 탭(볼록) 모양: 가장자리 방향 u(0..1), 바깥 방향 v(칸 크기 비율)
    const TAB = [
      ["L", 0.34, 0],
      ["C", 0.4, 0, 0.43, 0.04, 0.4, 0.1],
      ["C", 0.35, 0.2, 0.42, 0.28, 0.5, 0.28],
      ["C", 0.58, 0.28, 0.65, 0.2, 0.6, 0.1],
      ["C", 0.57, 0.04, 0.6, 0, 0.66, 0],
      ["L", 1, 0],
    ];
    const PADR = 0.32; // 조각 그림 여백(탭이 튀어나올 자리)
    function piecePath(pc, s) {
      const p = new Path2D();
      const C = [[0, 0], [s, 0], [s, s], [0, s]];
      const NRM = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      p.moveTo(0, 0);
      for (let e = 0; e < 4; e++) {
        const [ax, ay] = C[e],
          [bx, by] = C[(e + 1) % 4],
          [nx, ny] = NRM[e],
          t = pc.edges[e];
        const m = (u, v) => [ax + (bx - ax) * u + nx * s * v * t, ay + (by - ay) * u + ny * s * v * t];
        if (!t) {
          p.lineTo(bx, by);
          continue;
        }
        for (const sg of TAB) {
          if (sg[0] === "L") p.lineTo(...m(sg[1], sg[2]));
          else p.bezierCurveTo(...m(sg[1], sg[2]), ...m(sg[3], sg[4]), ...m(sg[5], sg[6]));
        }
      }
      p.closePath();
      return p;
    }

    /* ---------- 상태 · 배치 ---------- */
    let W = 0,
      H = 0;
    const st = (ctx.jg = { pieces: [], n: 2, ready: false });
    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = board.clientWidth;
      H = board.clientHeight;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      lastSig = ""; // 크기를 다시 넣으면 그림이 지워지므로 다음 장면은 꼭 다시 그림
      if (st.ready) layout(true);
    }
    ctx.jgFit = fit;
    addEventListener("resize", () => ctx._active && fit());

    function layout(keep) {
      const n = st.n;
      const land = W >= H * 1.05;
      const gap = 14;
      let F;
      if (land) {
        F = Math.min(H - gap * 2, W * 0.56);
        st.fx = gap + Math.max(0, (W * 0.58 - F) / 2);
        st.fy = (H - F) / 2;
        st.tray = { x: st.fx + F + gap, y: gap, w: W - (st.fx + F + gap) - gap, h: H - gap * 2 };
      } else {
        // 세로 화면: 3×3 이상은 그림 판을 조금 줄이고(56% → 48%) 쟁반을 넓혀 쟁반 조각을 크게 (폰 3단계 조각이 42~58px 로 작았음)
        F = Math.min(W - gap * 2, H * (n >= 3 && W < 600 ? 0.48 : 0.56));
        st.fx = (W - F) / 2;
        st.fy = gap;
        st.tray = { x: gap, y: st.fy + F + gap, w: W - gap * 2, h: H - (st.fy + F + gap) - gap };
      }
      st.F = F;
      const s = (st.s = F / n);
      // 조각 그림 만들기
      const pad = s * PADR,
        full = s + pad * 2,
        d = Math.min(devicePixelRatio || 1, 2);
      st.pieces.forEach((pc) => {
        pc.path = piecePath(pc, s);
        const c = document.createElement("canvas");
        c.width = c.height = Math.ceil(full * d);
        const g = c.getContext("2d");
        g.setTransform(d, 0, 0, d, 0, 0);
        g.translate(pad, pad);
        g.save();
        g.clip(pc.path);
        g.drawImage(st.img, -pc.i * s, -pc.j * s, F, F);
        g.restore();
        g.lineJoin = "round";
        g.strokeStyle = "rgba(255,255,255,.75)";
        g.lineWidth = 3;
        g.stroke(pc.path);
        g.strokeStyle = "rgba(60,50,40,.45)";
        g.lineWidth = 1.4;
        g.stroke(pc.path);
        pc.cv = c;
        pc.full = full;
        pc.cx = st.fx + (pc.i + 0.5) * s;
        pc.cy = st.fy + (pc.j + 0.5) * s;
      });
      // 바구니(쟁반) 자리
      const T = st.tray,
        loose = st.pieces.filter((p) => !p.placed);
      const cnt = st.pieces.length;
      let best = { c: 0, cols: 1, rows: 1 };
      for (let cols = 1; cols <= cnt; cols++) {
        const rows = Math.ceil(cnt / cols);
        const c = Math.min(T.w / cols, T.h / rows);
        if (c > best.c) best = { c, cols, rows };
      }
      // 쟁반 조각 크기: 조각 몸통(s)만 보면 탭(튀어나온 부분)끼리 겹침 → 탭 몫(PADR)까지 넣어 계산
      // (탭은 조각마다 들쭉날쭉이라 양쪽 다 튀어나오는 일은 드물어 full 전체 대신 s×(1+PADR))
      st.ts = Math.min(1, (best.c * 0.9) / (s * (1 + PADR)));
      const slots = [];
      for (let k = 0; k < cnt; k++) {
        const col = k % best.cols,
          row = Math.floor(k / best.cols);
        slots.push({
          x: T.x + (T.w - best.c * best.cols) / 2 + (col + 0.5) * best.c,
          y: T.y + (T.h - best.c * best.rows) / 2 + (row + 0.5) * best.c,
        });
      }
      // 4×4 이상은 테두리 조각을 쟁반 앞쪽(위·왼쪽)에 — 가장자리부터 맞추면 쉬워서 한 판이 짧아짐
      const edge = (p) => p.i === 0 || p.j === 0 || p.i === n - 1 || p.j === n - 1;
      const order = keep ? loose : n >= 4 ? U.shuffle(loose.filter(edge)).concat(U.shuffle(loose.filter((p) => !edge(p)))) : U.shuffle([...loose]);
      order.forEach((pc, k) => {
        const sl = slots[k];
        pc.hx = sl.x + U.randf(-0.06, 0.06) * best.c;
        pc.hy = sl.y + U.randf(-0.06, 0.06) * best.c;
        if (!keep || !pc.moved) {
          pc.x = pc.hx;
          pc.y = pc.hy;
        } else {
          pc.x = U.clamp(pc.x, 0, W);
          pc.y = U.clamp(pc.y, 0, H);
        }
        pc.sc = st.ts;
        pc.tsc = st.ts;
      });
      st.pieces.filter((p) => p.placed).forEach((pc) => {
        pc.x = pc.tx = pc.cx;
        pc.y = pc.ty = pc.cy;
        pc.sc = pc.tsc = 1;
      });
    }

    /* ---------- 그리기 ---------- */
    // 바뀐 게 없으면 다시 그리지 않음 (그림자 그리기가 무거워 가만히 있어도 저가 태블릿이 버벅임)
    let lastSig = "";
    function draw(now, dt) {
      if (!W || !st.ready) return;
      const moving = st.done || st.order.some((pc) => pc.anim || pc.flash > 0 || Math.abs(pc.tsc - pc.sc) > 1e-3);
      const sig = moving ? "" : [cv.width, cv.height, W, H, st.fx, st.fy, st.F, st.drag ? st.drag.i + "," + st.drag.j : "-"].concat(st.order.map((pc) => pc.x + "," + pc.y + "," + pc.sc + (pc.placed ? "p" : ""))).join("|");
      if (sig && sig === lastSig) return;
      lastSig = sig;
      cx.clearRect(0, 0, W, H);
      const { fx, fy, F, s } = st;
      // 바탕판
      cx.save();
      cx.fillStyle = "#fff";
      cx.shadowColor = "rgba(47,58,102,.18)";
      cx.shadowBlur = 14;
      cx.shadowOffsetY = 6;
      cx.fillRect(fx - 6, fy - 6, F + 12, F + 12);
      cx.restore();
      cx.globalAlpha = st.n === 2 ? 0.32 : 0.24;
      cx.drawImage(st.img, fx, fy, F, F);
      cx.globalAlpha = 1;
      cx.save();
      cx.translate(fx, fy);
      cx.strokeStyle = "rgba(47,58,102,.22)";
      cx.lineWidth = 2;
      cx.setLineDash([6, 6]);
      st.pieces.forEach((pc) => {
        if (pc.placed) return;
        cx.save();
        cx.translate(pc.i * s, pc.j * s);
        cx.stroke(pc.path);
        cx.restore();
      });
      cx.restore();
      // 쟁반 바탕
      const T = st.tray;
      cx.fillStyle = "rgba(255,197,49,.13)";
      rr(T.x, T.y, T.w, T.h, 22);
      cx.fill();
      // 조각 (움직임 보간)
      const k = Math.min(1, dt * 14);
      for (const pc of st.order) {
        if (pc.anim) {
          pc.x += (pc.tx - pc.x) * k;
          pc.y += (pc.ty - pc.y) * k;
          if (Math.hypot(pc.tx - pc.x, pc.ty - pc.y) < 0.6) {
            pc.x = pc.tx;
            pc.y = pc.ty;
            pc.anim = false;
          }
        }
        pc.sc += (pc.tsc - pc.sc) * k;
        if (st.done && pc.placed) continue;
        const size = pc.full * pc.sc;
        cx.save();
        if (pc === st.drag) {
          cx.shadowColor = "rgba(0,0,0,.3)";
          cx.shadowBlur = 16;
          cx.shadowOffsetY = 10;
        } else if (!pc.placed) {
          cx.shadowColor = "rgba(0,0,0,.18)";
          cx.shadowBlur = 6;
          cx.shadowOffsetY = 3;
        }
        cx.drawImage(pc.cv, pc.x - size / 2, pc.y - size / 2, size, size);
        cx.restore();
        if (pc.flash > 0) {
          pc.flash -= dt * 2;
          cx.save();
          cx.globalAlpha = Math.max(0, pc.flash) * 0.6;
          cx.translate(pc.x - (s * pc.sc) / 2, pc.y - (s * pc.sc) / 2);
          cx.scale(pc.sc, pc.sc);
          cx.fillStyle = "#fff";
          cx.fill(pc.path);
          cx.restore();
        }
      }
      // 완성: 경계선이 사라지며 온전한 그림으로
      if (st.done) {
        const a = Math.min(1, (now - st.doneAt) / 900);
        st.order.forEach((pc) => {
          if (!pc.placed) return;
          const size = pc.full;
          cx.globalAlpha = 1 - a;
          cx.drawImage(pc.cv, pc.x - size / 2, pc.y - size / 2, size, size);
        });
        cx.globalAlpha = a;
        cx.drawImage(st.img, fx, fy, F, F);
        cx.globalAlpha = 1;
        // 반짝 지나가기
        const sw = ((now - st.doneAt) / 1200) % 1.6;
        if (sw < 1) {
          cx.save();
          cx.beginPath();
          cx.rect(fx, fy, F, F);
          cx.clip();
          const gx = fx - F * 0.3 + sw * F * 1.6;
          const gr = cx.createLinearGradient(gx - F * 0.15, fy, gx + F * 0.15, fy + F * 0.2);
          gr.addColorStop(0, "rgba(255,255,255,0)");
          gr.addColorStop(0.5, "rgba(255,255,255,.55)");
          gr.addColorStop(1, "rgba(255,255,255,0)");
          cx.fillStyle = gr;
          cx.fillRect(fx, fy, F, F);
          cx.restore();
        }
      }
      // 힌트 자리 표시
      const hp = st.order.find((p) => !p.placed);
      if (hp) {
        spot.style.left = hp.x + "px";
        spot.style.top = hp.y + "px";
        spot.style.width = spot.style.height = s * hp.sc + "px";
        spot.style.margin = (-s * hp.sc) / 2 + "px 0 0 " + (-s * hp.sc) / 2 + "px";
        spotTo.style.left = hp.cx + "px";
        spotTo.style.top = hp.cy + "px";
        spotTo.style.width = spotTo.style.height = s + "px";
        spotTo.style.margin = -s / 2 + "px 0 0 " + -s / 2 + "px";
      }
    }
    function rr(x, y, w, h, r) {
      cx.beginPath();
      cx.moveTo(x + r, y);
      cx.arcTo(x + w, y, x + w, y + h, r);
      cx.arcTo(x + w, y + h, x, y + h, r);
      cx.arcTo(x, y + h, x, y, r);
      cx.arcTo(x, y, x + w, y, r);
      cx.closePath();
    }
    ctx.jgDraw = draw;
    ctx.jgLayout = layout;

    /* ---------- 손가락 ---------- */
    const P = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    let pid = null,
      off = { x: 0, y: 0 },
      lastTalk = 0;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.done || pid !== null) return;
      const q = P(e);
      for (let k = st.order.length - 1; k >= 0; k--) {
        const pc = st.order[k];
        if (pc.placed) continue;
        const half = (st.s * pc.sc) / 2 + st.s * 0.12 * pc.sc;
        if (Math.abs(q.x - pc.x) <= half && Math.abs(q.y - pc.y) <= half) {
          pid = e.pointerId;
          try {
            cv.setPointerCapture(pid);
          } catch (_) {}
          st.drag = pc;
          pc.anim = false;
          pc.tsc = 1;
          off = { x: pc.x - q.x, y: pc.y - q.y };
          // 확대될 때 손가락 아래에 머물도록
          off.x /= Math.max(pc.sc, 0.01);
          off.y /= Math.max(pc.sc, 0.01);
          st.order.splice(k, 1);
          st.order.push(pc);
          A.sfx("pick");
          return;
        }
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || !st.drag) return;
      e.preventDefault();
      const q = P(e),
        pc = st.drag;
      pc.x = q.x + off.x * pc.sc;
      pc.y = q.y + off.y * pc.sc;
      pc.moved = true;
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      const pc = st.drag;
      st.drag = null;
      if (!pc) return;
      const near = Math.hypot(pc.x - pc.cx, pc.y - pc.cy) < st.s * 0.42;
      const inFrame = pc.x > st.fx && pc.x < st.fx + st.F && pc.y > st.fy && pc.y < st.fy + st.F;
      if (near) {
        pc.placed = true;
        pc.tx = pc.cx;
        pc.ty = pc.cy;
        pc.anim = true;
        pc.tsc = 1;
        pc.flash = 1;
        // 맞춘 조각은 아래층으로
        st.order.splice(st.order.indexOf(pc), 1);
        st.order.unshift(pc);
        A.sfx("snap");
        const left = st.pieces.filter((p) => !p.placed).length;
        if (left === 0) finish();
        else {
          if (Math.random() < 0.5) KP.voice.say(U.pick(["딱 맞아요!", "좋아요!", "맞았다!"])) // ("착!"은 자연 음성이 없어 뺌);
          setHint();
        }
      } else if (inFrame) {
        // 다른 자리: 부드럽게 쟁반으로 돌아가기
        pc.tx = pc.hx;
        pc.ty = pc.hy;
        pc.anim = true;
        pc.tsc = st.ts;
        pc.moved = false;
        A.sfx("boing");
        // 틀린 자리: 가벼운 실수로 기록(열쇠 별은 1번까지 봐줌, 조각 퍼즐은 이리저리 대 보는 게 자연스러워 단계는 안 내림)
        const now = performance.now();
        let msg = null;
        if (now - lastTalk > 3500) {
          lastTalk = now;
          msg = U.pick(["여기는 아니에요. 흐린 그림을 잘 봐요!", "다른 자리일까? 다시 해 봐요!", "아깝다! 그림이 이어지는 곳을 찾아봐요."]);
        }
        ctx.miss(null, msg, { soft: true });
      } else {
        // 쟁반 위: 놓은 자리에 그대로
        pc.hx = U.clamp(pc.x, st.s * 0.3, W - st.s * 0.3);
        pc.hy = U.clamp(pc.y, st.s * 0.3, H - st.s * 0.3);
        pc.tx = pc.hx;
        pc.ty = pc.hy;
        pc.anim = true;
        pc.tsc = st.ts;
        A.sfx("drop");
      }
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function setHint() {
      ctx.hint(() => spot, "조각을 끌어서 그림 자리에 맞춰 봐요!");
    }
    ctx.jgSetHint = setHint;

    async function finish() {
      st.done = true;
      st.doneAt = performance.now() + 250;
      ctx.hint(null);
      await ctx.wait(450);
      A.sfx("sparkle");
      KP.voice.say("와! 그림이 완성됐어요!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1300);
      if (!ctx._active) return;
      const ok = await ctx.win({ big: true, msg: ctx.round % 4 === 0 ? "{부름} 퍼즐 박사!" : "퍼즐 완성!" });
      if (ok) {
        ctx.picIdx = (ctx.picIdx + 1) % ctx.pics.length;
        ctx.def.next(ctx);
      }
    }

    ctx.jgUpdateTools = () => {
      sizeBtns.forEach((b) => b.classList.toggle("sel", +b.dataset.n === st.n));
      const p = ctx.pics[ctx.picIdx];
      picBtn.innerHTML = (p ? '<img class="th" src="' + KP.safeImg(p.thumb) + '" alt="">' : "") + KP.E("🖼️") + '<span class="lb">그림 바꾸기</span>';
    };
  },
  start(ctx) {
    ctx.round = 0;
    ctx.sizePick = 0;
    ctx.jgClosePicker();
    ctx.jg.ready = false;
    ctx.picsReady
      .then(() => ctx.jgRefreshArt())
      .then(() => {
        if (!ctx._active) return;
        const want = KP.pendingPuzzle;
        KP.pendingPuzzle = null;
        if (want) {
          const i = ctx.pics.findIndex((p) => p.id === "art:" + want);
          if (i >= 0) ctx.picIdx = i;
        }
        this.next(ctx);
        if (want) KP.voice.say("내가 그린 그림 퍼즐이에요!");
      });
    ctx.loop((dt, now) => ctx.jgDraw(now, dt));
  },
  next(ctx, manual) {
    const U = KP.u;
    const st = ctx.jg;
    if (!ctx.pics.length) return;
    ctx.lastLevel = ctx.lastLevel || ctx.level;
    if (ctx.level !== ctx.lastLevel) {
      ctx.sizePick = 0; // 단계가 바뀌면 단계 크기로
      ctx.lastLevel = ctx.level;
    }
    // 폰(짧은 쪽 500px 미만)에서는 단계 크기를 3×3 까지만 — 4×4 는 쟁반 조각이 45px 정도로 너무 작아짐 (직접 고른 크기는 그대로)
    const small = Math.min(innerWidth, innerHeight) < 500;
    const n = ctx.sizePick || Math.min(ctx.level + 1, small ? 3 : 4);
    st.n = n;
    const pic = ctx.pics[ctx.picIdx % ctx.pics.length];
    if (!pic.src) {
      // 내 작품: 처음 고를 때 정사각형 그림으로 만들기
      pic.load().then((o) => {
        if (!ctx._active) return;
        if (!o) {
          ctx.pics.splice(ctx.pics.indexOf(pic), 1);
          ctx.picIdx = 0;
        }
        this.next(ctx, manual);
      });
      return;
    }
    st.img = pic.src;
    st.done = false;
    st.drag = null;
    const H = [],
      V = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      H[j * n + i] = U.pick([1, -1]); // 오른쪽 가장자리
      V[j * n + i] = U.pick([1, -1]); // 아래 가장자리
    }
    st.pieces = [];
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const top = j === 0 ? 0 : -V[(j - 1) * n + i],
          right = i === n - 1 ? 0 : H[j * n + i],
          bottom = j === n - 1 ? 0 : V[j * n + i],
          left = i === 0 ? 0 : -H[j * n + i - 1];
        st.pieces.push({ i, j, edges: [top, right, bottom, left], placed: false, flash: 0 });
      }
    st.order = [...st.pieces];
    ctx.jgFit();
    st.ready = true;
    ctx.jgLayout(false);
    ctx.jgUpdateTools();
    if (!manual) ctx.say("조각을 끌어다 그림을 맞춰 봐요!");
    else ctx.say("조각을 끌어다 그림을 맞춰 봐요!", false);
    ctx.jgSetHint();
  },
});

;

/* ==== js/games/bigkid/maze.js ==== */
/* 미로 탈출 — 캐릭터를 손가락으로 끌어 길을 따라 목표까지!
   - 미로는 격자 기반 자동 생성(깊이 우선 탐색 → 막다른 길이 있는 미로) + 작은 고리(갈림길) 1~2개
   - 1단계 3×3(긴 화면은 3×4·3×5) / 2단계 4×5 / 3단계 6×7 (가로 화면이면 가로·세로를 바꿔 넓게,
     폰 세로는 칸 크기 그대로 아래를 줄로 채움 — 2단계 최대 7줄, 3단계 최대 9줄)
   - 점토 미로판: 벽은 도톰한 점토(그림자·본색·하이라이트), 길은 눌러 만든 홈(벽 두께가 아래로 보이는 가짜 2.5D).
     미로판은 판이 바뀔 때 한 번만 그려 둠(매 프레임은 그림 한 장 + 작은 그림 몇 개)
   - 테마 4종(잔디 정원·바다·겨울·우주): 동물 짝에 맞춰 자동 선택. 막다른 길 끝 벽 위에 소품
   - 벽에 닿으면 더 못 가고 살짝 튕김(벌칙 없음), 지나온 길에 발자국, 끌면 가는 쪽으로 살짝 기울기
   - 길 위 모으기(별·과일, 막다른 길 우선) → 도착하면 모은 것으로 소풍(냠냠). 안 모아도 도착하면 이김
   - 특수 칸 공통 틀: st.items (칸 번호 → {kind, e, done, ...}) — star·fruit·bubble·bush·friend
   - 친구 구하기(2·3단계 일부 판): 길 중간 친구를 지나가면 졸졸 따라와 함께 도착
   - 2·3단계 '술래 도전': 출발점 옆 둥지에서 낮잠 → 아이가 출발하면 깨서 셋 세고 출발.
     손을 떼면 술래도 앉아 쉼. 가까우면 따뜻한 두근두근(웃는 얼굴). 잡히면 간지럼 놀이 후 둥지로.
     비눗방울을 밟으면 뱅글뱅글, 덤불에 숨으면 앞에서 ❓ 두리번. 도착하면 술래도 와서 같이 축하.
     술래 속도는 단계별로 기억(잡히면 조금 느리게, 한 번도 안 잡히고 이기면 조금 빠르게) */
"use strict";
KP.game({
  id: "maze",
  icon: "🌀",
  name: "미로 탈출",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("maze", `
      .mzBoard{background:linear-gradient(180deg,#bdeaa3,#8ed173)}
      .board .mzSpot{position:absolute;border-radius:50%;pointer-events:none;left:0;top:0}
      .mzBoard::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;border-radius:inherit;
        box-shadow:inset 0 0 0 7px rgba(255,200,90,.8),inset 0 0 30px 10px rgba(255,170,120,.45)}
      .mzBoard.near::after{animation:mzPulse .5s ease-in-out infinite alternate}
      @keyframes mzPulse{from{opacity:.1}to{opacity:.85}}
      .mzRight{position:absolute;right:10px;top:8px;z-index:3;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
      .mzBoard.tall .mzRight{flex-direction:row-reverse;align-items:flex-start}
      .mzMe{height:64px;min-width:64px;padding:0 8px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:32px;line-height:1;
        background:rgba(255,255,255,.92);box-shadow:0 4px 0 rgba(0,0,0,.14)}
      .mzMe img{width:50px;height:50px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 0 0 2px #ffd54a;display:block}
      .mzPick{position:absolute;inset:0;z-index:8;background:rgba(29,34,70,.55);display:flex;align-items:center;justify-content:center;padding:12px}
      .mzPickBox{background:#fff;border-radius:26px;padding:16px 18px 18px;max-width:min(560px,94%);max-height:94%;overflow:auto;box-shadow:0 8px 0 rgba(0,0,0,.15);text-align:center}
      .mzPickBox h3{margin:0 0 12px;font-size:clamp(22px,3vw,28px);font-weight:400;color:var(--ink)}
      .mzPickGrid{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
      .mzPickT{position:relative;width:92px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:15px;color:var(--ink2)}
      .mzPickT .ph{width:84px;height:84px;border-radius:50%;background:#f1f4fb;display:flex;align-items:center;justify-content:center;font-size:46px;overflow:hidden;box-shadow:0 4px 0 rgba(47,58,102,.15)}
      .mzPickT .ph img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
      .mzPickT.now .ph{box-shadow:0 0 0 5px #ffd54a,0 4px 0 rgba(47,58,102,.15)}
      .mzPickT:active .ph{transform:scale(.94)}
      .mzPickDel{position:absolute;top:-6px;right:0;width:30px;height:30px;border-radius:50%;background:#ff7b54;color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.2)}
      .mzPickNote{margin-top:12px;font-size:13px;color:var(--ink2)}
      .mzChase{position:relative;height:64px;min-width:96px;padding:0 12px;border-radius:999px;
        display:flex;align-items:center;justify-content:center;gap:2px;font-size:32px;line-height:1;
        background:rgba(255,255,255,.92);box-shadow:0 4px 0 rgba(0,0,0,.14)}
      .mzChase .e:last-child{font-size:24px;width:24px;height:24px;opacity:.85}
      .mzChase.on{background:#ffd54a;animation:bump .4s}
      .mzBag{position:absolute;left:10px;top:8px;z-index:3;height:52px;padding:0 12px;border-radius:999px;display:flex;align-items:center;gap:4px;
        font-size:30px;line-height:1;background:rgba(255,255,255,.88);box-shadow:0 4px 0 rgba(0,0,0,.12);pointer-events:none}
      .mzBag .mzI{opacity:.28;filter:grayscale(1)}
      .mzBag .mzI.got{opacity:1;filter:none;animation:bump .4s}
    `);
    const board = U.el("div", "board mzBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "mzSpot");
    const bChase = U.btn("", "mzChase");
    const bMe = U.btn("", "mzMe"); // 누구로 할까? (동물 친구 / 내 얼굴 사진)
    bMe.setAttribute("aria-label", "누구로 할까요");
    const right = U.el("div", "mzRight");
    right.append(bChase, bMe);
    const bag = U.el("div", "mzBag");
    board.append(cv, spot, bag, right);
    ctx.bChase = bChase;
    ctx.mzBag = bag;
    ctx.mzRight = right;
    ctx.body.appendChild(board);
    const cx = cv.getContext("2d");

    // [캐릭터, 이름, 목표, 목표 이름, 테마]
    ctx.PAIRS = [
      ["🐶", "강아지", "🦴", "뼈다귀", "garden"],
      ["🐰", "토끼", "🥕", "당근", "garden"],
      ["🐭", "생쥐", "🧀", "치즈", "space"],
      ["🐝", "꿀벌", "🌻", "해바라기", "garden"],
      ["🐵", "원숭이", "🍌", "바나나", "sea"],
      ["🐧", "펭귄", "🐟", "물고기", "snow"],
      ["🐻", "곰", "🍯", "꿀", "snow"],
      ["🐿️", "다람쥐", "🌰", "도토리", "garden"],
      ["🦖", "공룡", "🥚", "알", "sea"],
      ["🐱", "고양이", "🥛", "우유", "space"],
    ];
    // 술래(같이 놀자며 쫓아오는 친구) — 짝마다
    ctx.CHASERS = {
      강아지: ["🐱", "아기 고양이"], 토끼: ["🦊", "아기 여우"], 생쥐: ["🐱", "아기 고양이"], 꿀벌: ["🐻", "아기 곰"], 원숭이: ["🐯", "아기 호랑이"],
      펭귄: ["🦭", "아기 물개"], 곰: ["🐝", "꿀벌"], 다람쥐: ["🦉", "아기 부엉이"], 공룡: ["🐊", "아기 악어"], 고양이: ["🐶", "강아지"],
    };
    // 테마: 바탕·벽(옆면/본색/하이라이트/홈 안쪽 벽면)·길(그늘/바닥/점무늬)·덤불·막다른 길 소품·벽 위 작은 장식 색
    const THEMES = {
      garden: { bg: "linear-gradient(180deg,#bdeaa3,#8ed173)", dot: "rgba(255,255,255,.16)", side: "#2e7a2b", wall: "#55ad48", hi: "#9ee08a", face: "#3b8c35", floor: "#fff3cf", shade: "#e6cd98", speck: "rgba(205,160,95,.30)", bush: ["#3f9e3a", "#78d266"], props: ["🌼", "🍄", "🌷"], deco: ["#ffe066", "#ff9ec4", "#ffffff"] },
      sea: { bg: "linear-gradient(180deg,#a6e8f7,#5fc4e8)", dot: "rgba(255,255,255,.24)", side: "#1d6aa0", wall: "#3d98d6", hi: "#91d4f6", face: "#2a7cb9", floor: "#ffeec2", shade: "#e8cd94", speck: "rgba(200,150,80,.28)", bush: ["#1f9c8f", "#5ad6c4"], props: ["🐚", "🦀", "🐠"], deco: ["#ffffff", "#ffc9d6", "#fff3a0"] },
      snow: { bg: "linear-gradient(180deg,#f3f8ff,#cfe3f6)", dot: "rgba(255,255,255,.8)", side: "#557fae", wall: "#86b4e2", hi: "#e3f2ff", face: "#6a99cc", floor: "#ffffff", shade: "#d7e5f3", speck: "rgba(120,160,210,.22)", bush: ["#3f8f6a", "#eaf6ff"], props: ["⛄", "🌲", "❄️"], deco: ["#ffffff", "#ffffff", "#ffd6e6"] },
      space: { bg: "linear-gradient(180deg,#3b3192,#1f1a55)", dot: "rgba(255,255,255,.6)", side: "#2b2178", wall: "#6a5cd0", hi: "#aea4f7", face: "#5042b0", floor: "#f1ecff", shade: "#d2c7f6", speck: "rgba(130,110,220,.25)", bush: ["#7a4fc9", "#c9a4ff"], props: ["🪐", "🌙", "🚀"], deco: ["#fff6a8", "#ffffff", "#ffc6f0"] },
    };
    const FRUITS = ["🍓", "🍎", "🍇", "🍒", "🍊"];
    const FRIENDS = ["🐥", "🐹", "🐨", "🐼", "🐸"];
    const preload = KP.loadE(
      ctx.PAIRS.flatMap((p) => [p[0], p[2]])
        .concat(["🐾", "✨", "💕", "💤", "💨", "❓", "💫", "😆", "🎵", "👋", "⭐", "🫧"], FRUITS, FRIENDS, Object.values(ctx.CHASERS).map((c) => c[0]))
        .concat(...Object.values(THEMES).map((t) => t.props))
    );

    const N = 1, E = 2, S = 4, W_ = 8;
    const DIRS = [
      [N, 0, -1, S],
      [E, 1, 0, W_],
      [S, 0, 1, N],
      [W_, -1, 0, E],
    ];
    const M = 0.14; // 벽 두께(칸 비율, 양쪽)
    const R = 0.2; // 캐릭터 충돌 반지름(칸 비율)

    let W = 0,
      H = 0,
      s = 0,
      ox = 0,
      oy = 0,
      dep = 0, // 벽 두께가 아래로 보이는 높이(px)
      fo = 0, // 길 바닥이 그만큼 아래에 보이므로 길 위 그림도 살짝 내려 그림(px)
      layer = null,
      trail = null; // 발자국은 찍을 때 한 번만 그려 두는 판 (매 화면 다시 그리지 않음)
    const st = (ctx.mz = { ready: false, items: new Map(), fx: [] });

    /* ---------- 미로 만들기 ---------- */
    function gen(cols, rows) {
      const open = new Array(cols * rows).fill(0);
      const seen = new Array(cols * rows).fill(false);
      const stack = [[U.rand(cols), U.rand(rows)]];
      seen[stack[0][1] * cols + stack[0][0]] = true;
      while (stack.length) {
        const [x, y] = stack[stack.length - 1];
        const nb = DIRS.filter(([, dx, dy]) => {
          const nx = x + dx,
            ny = y + dy;
          return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx];
        });
        if (!nb.length) {
          stack.pop();
          continue;
        }
        const [b, dx, dy, ob] = U.pick(nb);
        const nx = x + dx,
          ny = y + dy;
        open[y * cols + x] |= b;
        open[ny * cols + nx] |= ob;
        seen[ny * cols + nx] = true;
        stack.push([nx, ny]);
      }
      return open;
    }
    const deg = (o) => (o & 1 ? 1 : 0) + (o & 2 ? 1 : 0) + (o & 4 ? 1 : 0) + (o & 8 ? 1 : 0);
    /** 벽 n개를 더 열어 작은 고리(갈림길)를 만듦. 막다른 길은 되도록 남기고, 2×2 빈 마당은 안 만듦 */
    function braid(open, cols, rows, n) {
      const cand = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const c = j * cols + i;
          if (i + 1 < cols && !(open[c] & E)) cand.push([c, E, c + 1, W_]);
          if (j + 1 < rows && !(open[c] & S)) cand.push([c, S, c + cols, N]);
        }
      const dead = (x) => (deg(open[x[0]]) < 2 || deg(open[x[2]]) < 2 ? 1 : 0);
      const order = U.shuffle(cand).sort((x, y) => dead(x) - dead(y));
      const plaza = (c) => {
        const ci = c % cols,
          cj = (c / cols) | 0;
        for (let j = cj - 1; j <= cj; j++)
          for (let i = ci - 1; i <= ci; i++) {
            if (i < 0 || j < 0 || i + 1 >= cols || j + 1 >= rows) continue;
            const a = j * cols + i;
            if (open[a] & E && open[a] & S && open[a + 1] & S && open[a + cols] & E) return true;
          }
        return false;
      };
      let done = 0;
      for (const [a, b, c2, ob] of order) {
        if (done >= n) break;
        open[a] |= b;
        open[c2] |= ob;
        if (plaza(a) || plaza(c2)) {
          open[a] &= ~b;
          open[c2] &= ~ob;
          continue;
        }
        done++;
      }
    }
    /** 칸 a → 칸 b 최단 경로 (칸 번호 배열) */
    function solve(a, b) {
      const { cols, rows, open } = st;
      const prev = new Array(cols * rows).fill(-1);
      const q = [a];
      prev[a] = a;
      while (q.length) {
        const c = q.shift();
        if (c === b) break;
        const x = c % cols,
          y = (c / cols) | 0;
        for (const [bit, dx, dy] of DIRS) {
          if (!(open[c] & bit)) continue;
          const n = (y + dy) * cols + (x + dx);
          if (prev[n] < 0) {
            prev[n] = c;
            q.push(n);
          }
        }
      }
      const out = [];
      for (let c = b; c !== a && c >= 0; c = prev[c]) out.unshift(c);
      out.unshift(a);
      return out;
    }

    /* ---------- 길 판정 ---------- */
    function inPath(px, py) {
      const { cols, rows, open } = st;
      const i = Math.floor(px),
        j = Math.floor(py);
      if (i < 0 || j < 0 || i >= cols || j >= rows) return false;
      const u = px - i,
        v = py - j,
        o = open[j * cols + i];
      const inU = u >= M && u <= 1 - M,
        inV = v >= M && v <= 1 - M;
      if (inU && inV) return true;
      if (inV) return u < M ? !!(o & W_) : !!(o & E);
      if (inU) return v < M ? !!(o & N) : !!(o & S);
      return false;
    }
    const RING = [
      [1, 0], [-1, 0], [0, 1], [0, -1], [0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72],
    ];
    function ok(x, y) {
      if (!inPath(x, y)) return false;
      for (const [a, b] of RING) if (!inPath(x + a * R, y + b * R)) return false;
      return true;
    }
    /** 손가락 쪽으로 조금씩 이동 (벽에서는 미끄러지고, 모퉁이는 살짝 도와줌) */
    function moveToward(tx, ty) {
      const p = st.p;
      let blocked = false;
      const STEP = 0.05;
      for (let k = 0; k < 50; k++) {
        if (k) touchItems(); // 빠르게 끌어도 지나친 별·과일·친구를 놓치지 않게 (한 번에 여러 칸 이동)
        const dx = tx - p.x,
          dy = ty - p.y,
          d = Math.hypot(dx, dy);
        if (d < 0.01) break;
        const L = Math.min(STEP, d);
        if (ok(p.x + (dx / d) * L, p.y + (dy / d) * L)) {
          p.x += (dx / d) * L;
          p.y += (dy / d) * L;
          continue;
        }
        let done = false;
        const axes = Math.abs(dx) >= Math.abs(dy) ? ["x", "y"] : ["y", "x"];
        for (const a of axes) {
          const comp = a === "x" ? dx : dy;
          if (Math.abs(comp) < 0.004) continue;
          const sv = Math.sign(comp) * Math.min(STEP, Math.abs(comp));
          const nx = a === "x" ? p.x + sv : p.x,
            ny = a === "y" ? p.y + sv : p.y;
          if (ok(nx, ny)) {
            p.x = nx;
            p.y = ny;
            done = true;
            break;
          }
          // 모퉁이 도움: 가운데 줄로 살짝 당겨서 꺾을 수 있게
          const c = a === "x" ? Math.floor(p.y) + 0.5 : Math.floor(p.x) + 0.5;
          const cur = a === "x" ? p.y : p.x;
          if (Math.abs(c - cur) > 0.004) {
            const nudge = Math.sign(c - cur) * Math.min(STEP, Math.abs(c - cur));
            const ax2 = a === "x" ? p.x : p.x + nudge,
              ay2 = a === "x" ? p.y + nudge : p.y;
            const fx = a === "x" ? p.x + sv : c,
              fy = a === "x" ? c : p.y + sv;
            if (ok(ax2, ay2) && ok(fx, fy)) {
              p.x = ax2;
              p.y = ay2;
              done = true;
              break;
            }
          }
        }
        if (!done) {
          blocked = true;
          break;
        }
      }
      return blocked;
    }

    /* ---------- 그리기 ---------- */
    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = board.clientWidth;
      H = board.clientHeight;
      st.W = W;
      st.H = H;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      if (st.ready) layout();
    }
    ctx.mzFit = fit;
    addEventListener("resize", () => ctx._active && fit());
    // 그림이 다 불러와지면 미로판(소품 포함)을 한 번 다시 그림 (처음엔 글자 그림으로 그려질 수 있어서)
    preload.then(() => ctx._active && st.ready && layout());

    /** 판마다 같은 무늬가 나오게 하는 작은 난수 (화면 회전으로 다시 그려도 장식이 그대로) */
    function rng(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function layout() {
      const th = st.theme;
      board.style.background = th.bg;
      const { cols, rows, open } = st;
      // 세로 화면은 위쪽에 버튼(모은 것·술래) 자리를 비워 둠, 가로 화면은 옆 빈 곳에 버튼
      board.classList.toggle("tall", H > W * 1.08); // 세로 화면: 오른쪽 버튼(술래·내 얼굴)을 가로로 나란히
      const top = H > W * 1.08 ? Math.min(70, H * 0.09) : 0;
      const pad = Math.max(12, Math.min(W, H) * 0.025);
      s = Math.min((W - Math.max(pad, st.side || 0) * 2) / (cols + 0.4), (H - top - pad * 2) / (rows + 0.6)); // 넓힌 3단계는 양옆 버튼 자리를 비움
      dep = Math.max(4, Math.min(26, s * 0.13));
      fo = dep * 0.7;
      ox = (W - s * cols) / 2;
      oy = top + (H - top - s * rows - dep * 1.3) / 2;
      st.s = s;
      st.ox = ox;
      st.oy = oy;
      st.fo = fo;
      spot.style.width = spot.style.height = s * 0.8 + "px";
      spot.style.margin = -s * 0.4 + "px 0 0 " + -s * 0.4 + "px";
      // 고정된 미로 그림은 한 번만 그려 둔다
      const d = Math.min(devicePixelRatio || 1, 2);
      const rnd = rng(st.seed);
      layer = document.createElement("canvas");
      layer.width = W * d;
      layer.height = H * d;
      const g = layer.getContext("2d");
      g.setTransform(d, 0, 0, d, 0, 0);
      // 바탕 무늬 (우주는 작은 별, 나머지는 말랑한 점)
      g.fillStyle = th.dot;
      for (let k = 0; k < 40; k++) {
        g.beginPath();
        g.arc(rnd() * W, rnd() * H, st.themeId === "space" ? 1 + rnd() * 1.8 : s * (0.04 + rnd() * 0.07), 0, 7);
        g.fill();
      }
      // 점토 미로판: 그림자 → 옆면(두께) → 윗면 → 윗면 가장자리 하이라이트
      const fr = s * 0.17,
        X0 = ox - fr,
        Y0 = oy - fr,
        SW = s * cols + fr * 2,
        SH = s * rows + fr * 2,
        rad = Math.min(fr * 2.2, s * 0.45);
      g.fillStyle = "rgba(0,0,0,.15)";
      rr(g, X0 + dep * 0.4, Y0 + dep * 2.1, SW, SH, rad);
      g.fill();
      g.fillStyle = th.side;
      rr(g, X0, Y0 + dep * 1.3, SW, SH, rad);
      g.fill();
      g.fillStyle = th.wall;
      rr(g, X0, Y0, SW, SH, rad);
      g.fill();
      g.save();
      rr(g, X0, Y0, SW, SH, rad);
      g.clip();
      g.globalAlpha = 0.5;
      g.strokeStyle = th.hi;
      g.lineWidth = Math.max(2, fr * 0.3);
      rr(g, X0 + fr * 0.3, Y0 + fr * 0.25, SW - fr * 0.6, SH - fr * 0.7, rad * 0.8);
      g.stroke();
      // 손으로 누른 듯한 점토 자국
      for (let k = 0; k < cols * rows * 5; k++) {
        const x = X0 + rnd() * SW,
          y = Y0 + rnd() * SH,
          r = s * (0.025 + rnd() * 0.04);
        g.globalAlpha = 0.08;
        g.fillStyle = "#000";
        g.beginPath();
        g.arc(x + r * 0.3, y + r * 0.35, r, 0, 7);
        g.fill();
        g.globalAlpha = 0.3;
        g.fillStyle = th.hi;
        g.beginPath();
        g.arc(x - r * 0.2, y - r * 0.25, r * 0.75, 0, 7);
        g.fill();
      }
      g.restore();
      // 길: 칸 가운데끼리 굵은 선으로 이어 부드러운 길 모양
      const w = s * (1 - 2 * M);
      const segs = new Path2D();
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const x = ox + (i + 0.5) * s,
            y = oy + (j + 0.5) * s,
            o = open[j * cols + i];
          segs.moveTo(x, y);
          segs.lineTo(x + 0.01, y);
          if (o & E) {
            segs.moveTo(x, y);
            segs.lineTo(x + s, y);
          }
          if (o & S) {
            segs.moveTo(x, y);
            segs.lineTo(x, y + s);
          }
        }
      g.lineCap = "round";
      g.lineJoin = "round";
      // 홈 둘레: 점토 벽 윗면의 둥근 모서리(밝게) + 얇은 윤곽(어둡게)
      g.save();
      g.globalAlpha = 0.55;
      g.strokeStyle = th.hi;
      g.lineWidth = w + Math.max(3, s * 0.08);
      g.translate(0, -dep * 0.3);
      g.stroke(segs);
      g.restore();
      g.save();
      g.globalAlpha = 0.45;
      g.strokeStyle = th.side;
      g.lineWidth = w + Math.max(2, s * 0.025);
      g.stroke(segs);
      g.restore();
      // 홈(길) — 따로 그린 뒤 얹음: 위쪽엔 벽 옆면(두께), 그 아래 그늘, 바닥
      const gc = document.createElement("canvas");
      gc.width = layer.width;
      gc.height = layer.height;
      const gg = gc.getContext("2d");
      gg.setTransform(d, 0, 0, d, 0, 0);
      gg.lineCap = "round";
      gg.lineJoin = "round";
      gg.strokeStyle = th.face;
      gg.lineWidth = w;
      gg.stroke(segs);
      gg.globalCompositeOperation = "source-atop";
      gg.save();
      gg.translate(0, dep);
      gg.strokeStyle = th.shade;
      gg.stroke(segs);
      gg.restore();
      gg.save();
      gg.translate(0, dep * 1.4);
      gg.strokeStyle = th.floor;
      gg.lineWidth = Math.max(4, w - dep * 0.5);
      gg.stroke(segs);
      gg.restore();
      // 길 위 작은 점무늬
      gg.fillStyle = th.speck;
      for (let k = 0; k < cols * rows * 4; k++) {
        const c = Math.floor(rnd() * cols * rows);
        gg.beginPath();
        gg.arc(ox + ((c % cols) + 0.2 + rnd() * 0.6) * s, oy + (((c / cols) | 0) + 0.25 + rnd() * 0.6) * s + fo, s * 0.022, 0, 7);
        gg.fill();
      }
      gg.globalCompositeOperation = "source-over";
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(gc, 0, 0);
      g.restore();
      // 벽이 만나는 꼭짓점 위 작은 점토 꽃·알갱이 (꼭짓점은 늘 벽이라 길을 가리지 않음)
      const nest = st.nestCorner;
      for (let j = 0; j <= rows; j++)
        for (let i = 0; i <= cols; i++) {
          if (rnd() > 0.32) continue;
          if (nest && i === nest[0] && j === nest[1]) continue;
          const x = ox + i * s + (i === 0 ? -fr * 0.35 : i === cols ? fr * 0.35 : 0),
            y = oy + j * s + (j === 0 ? -fr * 0.35 : j === rows ? fr * 0.35 : 0);
          const col = th.deco[Math.floor(rnd() * th.deco.length)],
            r = s * 0.04;
          g.fillStyle = "rgba(0,0,0,.12)";
          g.beginPath();
          g.arc(x + r * 0.4, y + r * 0.6, r * 1.9, 0, 7);
          g.fill();
          g.fillStyle = col;
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 + rnd();
            g.beginPath();
            g.arc(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1, r * 0.8, 0, 7);
            g.fill();
          }
          g.fillStyle = col === "#ffe066" || col === "#fff3a0" || col === "#fff6a8" ? "#ff9f43" : "#ffd54a";
          g.beginPath();
          g.arc(x, y, r * 0.65, 0, 7);
          g.fill();
        }
      // 막다른 길 소품: 막힌 쪽 벽 위에 (길은 가리지 않게)
      for (const pr of st.props) {
        const c0 = center(pr.c);
        KP.drawE(g, pr.e, px(c0.x + pr.dx * 0.5), py(c0.y + pr.dy * 0.5) - s * 0.02, s * 0.36);
      }
      // 발자국 판 새로 만들고 지금까지의 발자국 다시 찍기
      trail = document.createElement("canvas");
      trail.width = W * d;
      trail.height = H * d;
      trail.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
      (st.steps || []).forEach(stamp);
    }
    function rr(g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    const px = (u) => ox + u * s,
      py = (v) => oy + v * s;
    const fy = (v) => oy + v * s + fo; // 길 바닥 위 (그림용)
    function stamp(f) {
      if (!trail) return;
      const g = trail.getContext("2d");
      g.globalAlpha = 0.42;
      KP.drawE(g, "🐾", px(f.x), fy(f.y), s * 0.26, f.a + Math.PI / 2);
      g.globalAlpha = 1;
    }
    ctx.mzClearTrail = () => trail && trail.getContext("2d").clearRect(0, 0, W, H);
    function shadow(x, y, rx) {
      cx.fillStyle = "rgba(0,0,0,.14)";
      cx.beginPath();
      cx.ellipse(x, y, rx, rx * 0.3, 0, 0, 7);
      cx.fill();
    }
    function drawBush(c, alpha) {
      const o = center(c),
        x = px(o.x),
        y = fy(o.y) + s * 0.1,
        r = s * 0.2;
      const [base, hi] = st.theme.bush;
      cx.globalAlpha = alpha;
      shadow(x, y + r * 0.9, r * 1.6);
      cx.fillStyle = base;
      for (const [a, b, k] of [[-1, 0.15, 1], [1, 0.15, 1], [0, -0.35, 1.15], [-0.45, 0.45, 0.9], [0.45, 0.45, 0.9]]) {
        cx.beginPath();
        cx.arc(x + a * r * 0.85, y + b * r, r * k, 0, 7);
        cx.fill();
      }
      cx.fillStyle = hi;
      cx.globalAlpha = alpha * 0.6;
      for (const [a, b] of [[-0.9, -0.05], [0.15, -0.6], [0.95, 0]]) {
        cx.beginPath();
        cx.arc(x + a * r * 0.85 - r * 0.15, y + b * r - r * 0.2, r * 0.32, 0, 7);
        cx.fill();
      }
      cx.globalAlpha = 1;
    }

    function draw(now) {
      if (!W || !st.ready) return;
      cx.clearRect(0, 0, W, H);
      if (layer) cx.drawImage(layer, 0, 0, W, H);
      const t = now / 1000;
      // 길 안내 반짝이
      if (st.glowUntil > now && st.glowPath) {
        st.glowPath.forEach((c, k) => {
          const o = center(c);
          const a = 0.5 + 0.5 * Math.sin(t * 6 - k * 0.9);
          cx.globalAlpha = 0.35 + 0.6 * a;
          KP.drawE(cx, "✨", px(o.x), fy(o.y), s * (0.32 + 0.12 * a));
        });
        cx.globalAlpha = 1;
      }
      // 발자국
      if (trail) cx.drawImage(trail, 0, 0, W, H);
      // 목표 (도착하면 소풍 돗자리)
      const g = st.goal,
        gb = st.won ? 1.25 + 0.1 * Math.sin(t * 10) : 1 + 0.06 * Math.sin(t * 3);
      if (st.won) {
        cx.fillStyle = "rgba(255,138,160,.55)";
        cx.beginPath();
        cx.ellipse(px(g.x), fy(g.y) + s * 0.08, s * 0.58, s * 0.3, 0, 0, 7);
        cx.fill();
      }
      cx.fillStyle = "rgba(255,213,74,.45)";
      cx.beginPath();
      cx.arc(px(g.x), fy(g.y), s * 0.36 * gb, 0, 7);
      cx.fill();
      KP.drawE(cx, st.pair[2], px(g.x), fy(g.y) + Math.sin(t * 3) * s * 0.03, s * 0.6 * gb);
      // 특수 칸
      const hidden = kidHidden();
      let friend = null;
      st.items.forEach((it, c) => {
        const o = center(c),
          x = px(o.x),
          y = fy(o.y);
        if (it.kind === "star" || it.kind === "fruit") {
          if (it.done) return;
          const b = Math.sin(t * 3 + c) * s * 0.04;
          shadow(x, y + s * 0.2, s * 0.15);
          KP.drawE(cx, it.e, x, y - b, s * 0.42, it.kind === "star" ? Math.sin(t * 2 + c) * 0.15 : 0);
        } else if (it.kind === "bubble") {
          if (it.done) return;
          const k = 1 + Math.sin(t * 4 + c) * 0.06;
          cx.globalAlpha = 0.9;
          KP.drawE(cx, "🫧", x, y - s * 0.04, s * 0.5 * k);
          cx.globalAlpha = 1;
        } else if (it.kind === "bush") {
          if (!hidden) drawBush(c, 1);
        } else if (it.kind === "friend") friend = it;
      });
      // 친구 (기다리는 중이면 손 흔들기, 따라오는 중이면 졸졸)
      if (friend) {
        const fxp = px(friend.x),
          fyy = fy(friend.y);
        const hop = friend.done ? Math.abs(Math.sin(t * 9)) * s * 0.05 : Math.abs(Math.sin(t * 3)) * s * 0.03;
        shadow(fxp, fyy + s * 0.2, s * 0.17);
        KP.drawE(cx, friend.e, fxp, fyy - hop, s * 0.5, friend.done ? 0 : Math.sin(t * 3) * 0.12);
        if (!friend.done) KP.drawE(cx, "👋", fxp + s * 0.26, fyy - s * 0.3 + Math.sin(t * 6) * s * 0.03, s * 0.24, Math.sin(t * 6) * 0.4);
      }
      // 술래
      const ch = st.ch;
      if (ch) drawChaser(ch, t);
      // 캐릭터 (튕김·기울기·간지럼 흔들기)
      let bx = 0,
        by = 0;
      if (st.bump > 0) {
        const k = Math.sin(st.bump * Math.PI) * s * 0.09;
        bx = -st.bumpDir.x * k;
        by = -st.bumpDir.y * k;
      }
      const p = st.p;
      const lift = st.dragging ? 1.12 : 1;
      const hop = st.won ? Math.abs(Math.sin(t * 9)) * s * 0.14 : 0;
      const wig = ch && ch.mode === "hug" ? Math.sin(t * 22) * 0.22 : 0;
      shadow(px(p.x) + bx, fy(p.y) + s * 0.3, s * 0.26 * (1 + Math.abs(st.tilt) * 0.8));
      if (ctx.me) {
        // 내 얼굴: 동그란 얼굴 그림 (동물 그림과 같은 자리·기울기·폴짝)
        const sz = s * 0.72 * lift;
        cx.save();
        cx.translate(px(p.x) + bx, fy(p.y) + by - hop - (lift - 1) * s * 0.4);
        cx.rotate(st.tilt + wig);
        cx.drawImage(ctx.me.spr, -sz / 2, -sz / 2, sz, sz);
        cx.restore();
      } else KP.drawE(cx, st.pair[0], px(p.x) + bx, fy(p.y) + by - hop - (lift - 1) * s * 0.4, s * 0.74 * lift, st.tilt + wig);
      if (hidden) drawBush(st.bushCell, 0.93);
      // 소풍: 모은 것들이 목표 둘레에서 폴짝, 과일은 냠냠 먹으면 작아짐
      if (st.won && st.got && st.got.length) {
        const eat = st.eatAt ? Math.min(1, (performance.now() - st.eatAt) / 1100) : 0;
        st.got.forEach((it, k) => {
          // 목표 아래쪽 반원에 둘러앉기 (캐릭터 얼굴을 가리지 않게)
          const n = st.got.length,
            a = Math.PI * (0.12 + (0.76 * (k + 0.5)) / n);
          const sz = it.kind === "fruit" ? 1 - eat * 0.85 : 1;
          if (sz <= 0.05) return;
          const x = px(g.x) + Math.cos(a) * s * 0.5,
            y = fy(g.y) + s * 0.06 + Math.sin(a) * s * 0.34 - Math.abs(Math.sin(t * 8 + k)) * s * 0.06;
          KP.drawE(cx, it.e, x, y, s * 0.3 * sz);
        });
      }
      // 반짝·하트 같은 짧은 효과
      if (st.fx.length) {
        const nowp = performance.now();
        st.fx = st.fx.filter((f) => nowp - f.t0 < f.dur);
        for (const f of st.fx) {
          const a = (nowp - f.t0) / f.dur;
          cx.globalAlpha = 1 - a;
          KP.drawE(cx, f.e, px(f.x + f.vx * a), fy(f.y) - a * s * f.up, s * f.size * (0.7 + a * 0.5));
        }
        cx.globalAlpha = 1;
      }
      // 힌트용 투명 점: 위치가 바뀔 때만 옮김
      const sl = Math.round(px(p.x)), stp = Math.round(fy(p.y));
      if (sl !== st._sl || stp !== st._st) {
        st._sl = sl;
        st._st = stp;
        spot.style.transform = "translate(" + sl + "px," + stp + "px)";
      }
    }
    function drawChaser(ch, t) {
      const x = px(ch.x),
        y = fy(ch.y);
      if (ch.mode === "nap") {
        // 둥지(점토 방석)에서 낮잠
        cx.fillStyle = "rgba(0,0,0,.14)";
        cx.beginPath();
        cx.ellipse(x, y + s * 0.16, s * 0.3, s * 0.11, 0, 0, 7);
        cx.fill();
        cx.fillStyle = "#e9a05b";
        cx.beginPath();
        cx.ellipse(x, y + s * 0.1, s * 0.28, s * 0.12, 0, 0, 7);
        cx.fill();
        cx.fillStyle = "#ffcf8f";
        cx.beginPath();
        cx.ellipse(x, y + s * 0.08, s * 0.2, s * 0.07, 0, 0, 7);
        cx.fill();
        const br = 1 + Math.sin(t * 2.2) * 0.04;
        KP.drawE(cx, ch.e, x, y - s * 0.04, s * 0.5 * br, -0.35);
        const zz = (t * 0.6) % 1;
        cx.globalAlpha = 1 - zz;
        KP.drawE(cx, "💤", x + s * (0.2 + zz * 0.12), y - s * (0.28 + zz * 0.25), s * 0.26);
        cx.globalAlpha = 1;
        return;
      }
      let rot = 0,
        sx = 1,
        sy = 1,
        dy = 0,
        dx = 0,
        size = 0.68;
      const run = ch.mode === "run" || ch.mode === "home" || ch.mode === "join";
      if (run) {
        dy = -Math.abs(Math.sin(t * (ch.near ? 11 : 8))) * s * 0.06;
        rot = Math.sin(t * 8) * 0.08;
      } else if (ch.mode === "sit") {
        sx = 1.08;
        sy = 0.86;
        dy = s * 0.05;
      } else if (ch.mode === "wake" || ch.mode === "stand") {
        const k = Math.sin(t * 7) * 0.06;
        sx = 1 - k;
        sy = 1 + k;
      } else if (ch.mode === "spin") rot = t * 14;
      else if (ch.mode === "look") {
        dx = Math.sin(t * 3.5) * s * 0.06;
        rot = Math.sin(t * 3.5) * 0.2;
      } else if (ch.mode === "hug") rot = Math.sin(t * 22) * 0.25;
      if (ch.mode === "join" && ch.arrived) dy = -Math.abs(Math.sin(t * 9)) * s * 0.12;
      shadow(x + dx, y + s * 0.28, s * 0.24);
      cx.save();
      cx.translate(x + dx, y + dy);
      cx.scale(sx, sy);
      KP.drawE(cx, ch.e, 0, 0, s * size, rot);
      cx.restore();
      // 머리 위 신호
      let sig = null;
      if (ch.mode === "hug") sig = "💕";
      else if (ch.mode === "spin") sig = "💫";
      else if (ch.mode === "look") sig = "❓";
      else if (ch.mode === "sit") sig = "💤";
      else if (ch.mode === "run" && ch.near) sig = "😆";
      else if (ch.mode === "run" && ch.mid) sig = "🎵";
      else if (ch.mode === "join" && ch.arrived) sig = "💕";
      if (sig) {
        const b = Math.sin(t * 6) * s * 0.03;
        KP.drawE(cx, sig, x + dx + s * 0.26, y - s * 0.42 + b, s * (sig === "💕" ? 0.34 : 0.28));
      }
      if (ch.mode === "wake" && ch.t < 3.2) {
        cx.fillStyle = "#fff";
        cx.strokeStyle = "rgba(47,58,102,.8)";
        cx.lineWidth = s * 0.06;
        cx.font = "bold " + Math.round(s * 0.5) + "px Jua, sans-serif";
        cx.textAlign = "center";
        cx.textBaseline = "middle";
        const n = String(Math.max(1, Math.ceil(ch.t)));
        cx.strokeText(n, x, y - s * 0.62);
        cx.fillText(n, x, y - s * 0.62);
      }
    }

    /* ---------- 손가락 ---------- */
    const toCell = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) * W) / r.width,
        y = ((e.clientY - r.top) * H) / r.height;
      return { x: (x - ox) / s, y: (y - oy - fo) / s };
    };
    let pid = null,
      off = { x: 0, y: 0 },
      lastBump = 0,
      lastWallTalk = 0,
      lastGrabTalk = 0,
      lastHintReset = 0;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.won || pid !== null) return;
      const q = toCell(e);
      const d = Math.hypot(q.x - st.p.x, q.y - st.p.y);
      if (d > 0.95) {
        st.bump = 1;
        st.bumpDir = { x: 0, y: 1 };
        A.sfx("tap");
        if (performance.now() - lastGrabTalk > 4000) {
          lastGrabTalk = performance.now();
          ctx.tell(ctx.me ? "내 얼굴을 손가락으로 꾹 잡고 끌어요!" : U.josa(st.pair[1], "을/를") + " 손가락으로 꾹 잡고 끌어요!");
        }
        return;
      }
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      off = { x: st.p.x - q.x, y: st.p.y - q.y };
      st.dragging = true;
      A.sfx("pick");
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || st.won) return;
      e.preventDefault();
      const q = toCell(e);
      const tx = q.x + off.x,
        ty = q.y + off.y;
      const bx = st.p.x,
        by = st.p.y;
      const blocked = moveToward(tx, ty);
      const moved = Math.hypot(st.p.x - bx, st.p.y - by);
      const now = performance.now();
      if (moved > 0) {
        st.lastMove = now;
        st.glowUntil = 0;
        // 가는 쪽으로 살짝 기울기
        st.tiltT = U.clamp((st.p.x - bx) * 4.5, -0.2, 0.2);
        st.tiltAt = now;
        // 친구가 따라올 길 기록
        const lt = st.track[st.track.length - 1];
        if (!lt || Math.hypot(st.p.x - lt.x, st.p.y - lt.y) > 0.06) {
          st.track.push({ x: st.p.x, y: st.p.y });
          if (st.track.length > 120) st.track.shift();
        }
        const lf = st.steps[st.steps.length - 1] || st.lastFoot;
        if (Math.hypot(st.p.x - lf.x, st.p.y - lf.y) > 0.34) {
          const a = Math.atan2(st.p.y - lf.y, st.p.x - lf.x);
          const f = { x: lf.x + Math.cos(a) * 0.34, y: lf.y + Math.sin(a) * 0.34, a };
          st.steps.push(f);
          if (st.steps.length > 400) st.steps.shift();
          stamp(f);
          if (st.steps.length % 2) A.note(U.pick(["C6", "E6", "G6"]), { inst: "marimba", dur: 0.08, vol: 0.05 });
        }
        touchItems();
      }
      if (now - lastHintReset > 1000) {
        lastHintReset = now;
        setHint();
      }
      if (blocked && Math.hypot(tx - st.p.x, ty - st.p.y) > 0.45 && now - lastBump > 650) {
        lastBump = now;
        const d = Math.hypot(tx - st.p.x, ty - st.p.y) || 1;
        st.bump = 1;
        st.bumpDir = { x: (tx - st.p.x) / d, y: (ty - st.p.y) / d };
        A.sfx("boing");
        if (now - lastWallTalk > 7000) {
          lastWallTalk = now;
          ctx.tell(U.pick(["앗, 벽이에요! 다른 길로 가 봐요.", "콩! 여기는 막혔어요.", "벽이네! 길을 찾아봐요."]));
        }
      }
      if (Math.hypot(st.p.x - st.goal.x, st.p.y - st.goal.y) < 0.32) arrive();
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      st.dragging = false;
      if (!st.won) A.sfx("drop");
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    // 새 판에서는 잡고 있던 손가락을 놓은 것으로 (이어서 끌리지 않게)
    ctx.mzDrop = () => {
      pid = null;
      st.dragging = false;
    };

    function setHint() {
      ctx.hint(() => spot, (ctx.me ? "내 얼굴을" : U.josa(st.pair[1], "을/를")) + " 끌어서 " + st.pair[3] + "까지" + " 데려다 줘요!");
    }
    ctx.mzSetHint = setHint;

    /* ---------- 내 얼굴로 하기 ----------
       사진을 찍거나 골라 얼굴을 동그랗게 맞추면(KP.faceCrop) 그 얼굴이 미로를 달림. 여러 명 등록 가능(형제).
       KP.db "photos" {id:"me-…", kind:"me", img, t} — 이 기기 안에만 저장. 고른 것은 store "maze:me" (없으면 동물 친구) */
    ctx.me = null; // { id, img, spr(동그란 얼굴 그림) }
    const meSprite = (url) =>
      new Promise((res) => {
        const im = new Image();
        im.onload = () => {
          const Z = 256,
            c = document.createElement("canvas");
          c.width = c.height = Z;
          const g = c.getContext("2d");
          g.save();
          g.beginPath();
          g.arc(Z / 2, Z / 2, Z / 2 - 10, 0, Math.PI * 2);
          g.clip();
          g.drawImage(im, 10, 10, Z - 20, Z - 20);
          g.restore();
          // 노란 둘레 + 하얀 테두리 (길 바닥색과 구분)
          g.lineWidth = 14;
          g.strokeStyle = "#ffd54a";
          g.beginPath();
          g.arc(Z / 2, Z / 2, Z / 2 - 7, 0, Math.PI * 2);
          g.stroke();
          g.lineWidth = 10;
          g.strokeStyle = "#fff";
          g.beginPath();
          g.arc(Z / 2, Z / 2, Z / 2 - 15, 0, Math.PI * 2);
          g.stroke();
          res(c);
        };
        im.onerror = () => res(null);
        im.src = url;
      });
    const paintMe = () => {
      bMe.innerHTML = ctx.me ? '<img alt="" src="' + KP.safeImg(ctx.me.img) + '">' : KP.E("🧒");
    };
    const useMe = async (rec) => {
      if (!rec) {
        ctx.me = null;
        KP.store.set("maze:me", "");
      } else {
        const spr = await meSprite(rec.img);
        ctx.me = spr ? { id: rec.id, img: rec.img, spr } : null;
        KP.store.set("maze:me", ctx.me ? rec.id : "");
      }
      paintMe();
      if (st.ready && ctx._active) {
        ctx.say(ctx.mzIntro(), false);
        setHint();
      }
    };
    ctx.mzLoadMe = async () => {
      const id = KP.store.get("maze:me", "");
      const rec = id ? await KP.db.get("photos", id) : null;
      if (rec && rec.img) await useMe(rec);
      else paintMe();
    };
    const closePick = () => board.querySelectorAll(".mzPick").forEach((e) => e.remove());
    ctx.mzClosePick = closePick;
    async function openPick() {
      const list = ((await KP.db.all("photos")) || []).filter((p) => p.kind === "me" && p.img).sort((a, b) => a.t - b.t);
      if (!ctx._active) return;
      closePick();
      const ov = U.el("div", "mzPick"),
        boxEl = U.el("div", "mzPickBox", "<h3>" + KP.E("🧒") + " 누구로 할까요?</h3>"),
        grid = U.el("div", "mzPickGrid");
      const tile = (html, label, now, fn) => {
        const t = U.btn('<span class="ph">' + html + "</span><span>" + label + "</span>", "mzPickT" + (now ? " now" : ""));
        t.addEventListener("click", fn);
        grid.appendChild(t);
        return t;
      };
      tile(KP.E(st.pair ? st.pair[0] : "🐶"), "동물 친구", !ctx.me, () => {
        closePick();
        A.sfx("pop");
        useMe(null);
      });
      list.forEach((p, i) => {
        const t = tile('<img alt="" src="' + KP.safeImg(p.img) + '">', "얼굴 " + (i + 1), ctx.me && ctx.me.id === p.id, () => {
          closePick();
          A.sfx("select");
          useMe(p);
        });
        // ✖ 꾹 누르면 지우기 (숨은 그림 찾기 사진과 같은 방식)
        const del = U.el("span", "mzPickDel", "✖");
        t.appendChild(del);
        del.addEventListener("click", (e) => e.stopPropagation());
        KP.hold(del, 1500, async () => {
          if ((await KP.db.del("photos", p.id)) === false) return KP.toast("지우지 못했어요. 다시 해 주세요");
          if (ctx.me && ctx.me.id === p.id) await useMe(null);
          openPick();
        });
      });
      tile(KP.E("📷"), "새 얼굴", false, async () => {
        KP.audio.unlock();
        const url = await KP.faceCrop.pick();
        if (!url || !ctx._active) return;
        const rec = { id: "me-" + Date.now(), kind: "me", img: url, t: Date.now() };
        if ((await KP.db.put("photos", rec)) === false) return KP.toast("저장하지 못했어요. 기기 저장공간을 확인해 주세요");
        closePick();
        A.sfx("levelup");
        await useMe(rec);
      });
      boxEl.append(grid, U.el("div", "mzPickNote", "사진은 이 기기 안에만 저장돼요 · ✖ 꾹 누르면 지워요"));
      ov.appendChild(boxEl);
      ov.addEventListener("click", (e) => e.target === ov && closePick());
      board.appendChild(ov);
    }
    bMe.addEventListener("click", () => {
      KP.audio.unlock();
      if (st.dragging) return;
      A.sfx("tap");
      openPick();
    });
    const fx = (x, y, e, o = {}) => st.fx.push(Object.assign({ x, y, e, t0: performance.now(), dur: 700, up: 0.6, vx: 0, size: 0.32 }, o));

    /* ---------- 길 위 특수 칸 ---------- */
    const collectibles = () => [...st.items.values()].filter((it) => it.kind === "star" || it.kind === "fruit");
    function touchItems() {
      const p = st.p;
      st.items.forEach((it, c) => {
        if (it.done) return;
        const o = center(c);
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if ((it.kind === "star" || it.kind === "fruit") && d < 0.42) {
          it.done = true;
          if (it.kind === "star") A.sfx("sparkle");
          else {
            A.sfx("pop");
            A.note("E6", { inst: "marimba", dur: 0.12, vol: 0.12, when: 0.08 });
          }
          for (let k = 0; k < 3; k++) fx(o.x, o.y, "✨", { vx: (k - 1) * 0.35, up: 0.7 + k * 0.1, size: 0.26 });
          renderBag();
          const all = collectibles();
          if (all.every((x) => x.done)) KP.voice.say(all[0].kind === "star" ? "별을 다 모았어요!" : "과일 부자!");
          else KP.voice.say("반짝!");
        } else if (it.kind === "friend" && d < 0.55) {
          it.done = true;
          A.sfx("good");
          fx(it.x, it.y, "💕", { up: 0.8, size: 0.34, dur: 900 });
          KP.voice.say("친구 찾았다!");
        }
      });
    }
    function renderBag() {
      const list = collectibles();
      bag.style.display = list.length ? "" : "none";
      bag.innerHTML = list.map((it) => '<span class="mzI' + (it.done ? " got" : "") + '">' + KP.E(it.e) + "</span>").join("");
    }
    const kidHidden = () => st.bushCell != null && !st.won && cellOf(st.p) === st.bushCell && Math.hypot(st.p.x - center(st.bushCell).x, st.p.y - center(st.bushCell).y) < 0.45;
    /** 술래용 칸(비눗방울·덤불)을 놓거나 치움 — 술래를 켜고 끌 때도 씀 */
    function placeChaseItems(on) {
      st.items.forEach((it, c) => (it.kind === "bubble" || it.kind === "bush") && st.items.delete(c));
      st.bushCell = null;
      if (!on) return;
      const free = (c) => !st.items.has(c) && c !== st.startCell && c !== st.goalCell && (!st.reach || st.reach.has(c));
      // 비눗방울: 정답 길 위(아이가 지나간 뒤 따라오는 술래가 밟게)
      const sol = st.sol;
      const nb = ctx.level >= 3 ? 2 : 1;
      const spots = nb === 2 ? [0.4, 0.72] : [0.55];
      for (const f of spots) {
        const k0 = Math.round((sol.length - 1) * f);
        for (const dk of [0, 1, -1, 2, -2]) {
          const c = sol[k0 + dk];
          if (c != null && free(c) && k0 + dk > 1 && k0 + dk < sol.length - 1) {
            st.items.set(c, { kind: "bubble", e: "🫧", done: false });
            break;
          }
        }
      }
      // 숨는 덤불: 막다른 길 한 곳 (출발 칸 근처는 피함). 막다른 길이 모두 차 있으면 정답 길 밖의 칸
      const far = (c) => free(c) && solve(st.startCell, c).length > 2;
      const onSol = new Set(sol);
      const dead = U.shuffle(st.deadEnds.filter(far));
      const off = U.shuffle([...Array(st.cols * st.rows).keys()].filter((c) => !onSol.has(c) && free(c)));
      const pool = dead.length ? dead : off.filter(far).length ? off.filter(far) : off;
      if (pool.length) {
        st.bushCell = pool[0];
        st.items.set(pool[0], { kind: "bush", done: false });
      }
    }
    ctx.mzPlaceChaseItems = placeChaseItems;

    /** 새 판 만들기 (칸 수는 next 가 화면에 맞춰 정함) */
    ctx.mzRound = (cols, rows) => {
      const lv = ctx.level;
      st.cols = cols;
      st.rows = rows;
      st.open = gen(cols, rows);
      braid(st.open, cols, rows, lv === 1 ? (cols * rows >= 12 ? 2 : 1) : lv === 2 ? 1 : 2);
      st.seed = (Math.random() * 1e9) | 0;
      // 출발은 무작위 모서리, 목표는 반대쪽 모서리
      const corner = U.rand(4);
      const sx = corner & 1 ? cols - 1 : 0,
        sy = corner & 2 ? rows - 1 : 0;
      const gx = cols - 1 - sx,
        gy = rows - 1 - sy;
      st.outDir = { x: sx === 0 ? -1 : 1, y: sy === 0 ? -1 : 1 }; // 출발 칸에서 바깥 모서리 쪽
      st.nestCorner = [sx === 0 ? 0 : cols, sy === 0 ? 0 : rows];
      st.startCell = sy * cols + sx;
      st.p = { x: sx + 0.5, y: sy + 0.5 };
      st.lastFoot = { x: st.p.x, y: st.p.y };
      st.goal = { x: gx + 0.5, y: gy + 0.5 };
      st.goalCell = gy * cols + gx;
      st.sol = solve(st.startCell, st.goalCell);
      st.steps = [];
      st.track = [{ x: st.p.x, y: st.p.y }];
      st.won = false;
      st.got = null;
      st.eatAt = 0;
      st.bump = 0;
      st.bumpDir = { x: 0, y: 0 };
      st.tilt = 0;
      st.tiltT = 0;
      st.dragging = false;
      st.glowUntil = 0;
      st.fx = [];
      st.lastMove = performance.now();
      st.roundId = (st.roundId || 0) + 1;
      ctx.pairIdx = (ctx.pairIdx + 1) % ctx.PAIRS.length;
      st.pair = ctx.PAIRS[ctx.pairIdx];
      st.themeId = st.pair[4] || "garden";
      st.theme = THEMES[st.themeId];
      // 특수 칸
      st.items = new Map();
      st.deadEnds = [];
      for (let c = 0; c < cols * rows; c++) if (deg(st.open[c]) === 1 && c !== st.startCell && c !== st.goalCell) st.deadEnds.push(c);
      const onSol = new Set(st.sol);
      // 목표 칸을 지나지 않고 갈 수 있는 칸만 (목표 너머에 두면 먼저 도착해 버려 못 모음)
      st.reach = new Set([st.startCell]);
      for (const q = [st.startCell]; q.length; ) {
        const c = q.shift();
        for (const [bit, dx, dy] of DIRS) {
          const n = c + dy * cols + dx;
          if (st.open[c] & bit && n !== st.goalCell && !st.reach.has(n)) {
            st.reach.add(n);
            q.push(n);
          }
        }
      }
      const free = (c) => !st.items.has(c) && c !== st.startCell && c !== st.goalCell && st.reach.has(c);
      // 모으기: 별 또는 과일 2~3개 — 막다른 길 우선, 1단계는 하나를 정답 길 위에(규칙을 자연스럽게 익히게)
      const nItem = lv === 1 ? 2 : lv === 2 ? 2 + U.rand(2) : 3;
      const fruit = Math.random() < 0.5;
      const fr = U.shuffle(FRUITS.slice());
      const spots = [];
      if (lv === 1) {
        const mid = st.sol.slice(1, -1);
        if (mid.length) spots.push(mid[Math.floor(mid.length / 2)]);
      }
      const offSol = U.shuffle([...Array(cols * rows).keys()].filter((c) => !onSol.has(c) && deg(st.open[c]) > 1));
      const onPath = U.shuffle(st.sol.slice(2, -1));
      for (const c of U.shuffle(st.deadEnds.slice()).concat(offSol, onPath)) {
        if (spots.length >= nItem) break;
        if (!spots.includes(c) && free(c)) spots.push(c);
      }
      spots.forEach((c, k) => st.items.set(c, { kind: fruit ? "fruit" : "star", e: fruit ? fr[k % fr.length] : "⭐", done: false }));
      // 친구 구하기 (2·3단계 일부 판): 정답 길 중간에서 기다림
      if (lv >= 2 && Math.random() < 0.4) {
        const k0 = Math.floor(st.sol.length / 2);
        for (const dk of [0, 1, -1, 2, -2]) {
          const c = st.sol[k0 + dk];
          if (c != null && free(c) && k0 + dk > 1 && k0 + dk < st.sol.length - 1) {
            const o = center(c);
            st.items.set(c, { kind: "friend", e: U.pick(FRIENDS), done: false, x: o.x, y: o.y });
            break;
          }
        }
      }
      // 술래
      st.ch = null;
      st.bushCell = null;
      const chaseOn = KP.store.get("maze:chase", false) && lv >= 2;
      if (chaseOn) {
        addChaser();
        // 아이는 둥지 반대쪽으로 살짝 비켜 서서 시작 (겹치지 않게)
        st.p.x -= st.outDir.x * 0.14;
        st.p.y -= st.outDir.y * 0.14;
        st.lastFoot = { x: st.p.x, y: st.p.y };
        st.track = [{ x: st.p.x, y: st.p.y }];
      }
      placeChaseItems(chaseOn);
      // 남은 막다른 길에는 테마 소품 (막힌 쪽 벽 위)
      st.props = [];
      let pk = U.rand(3);
      for (const c of st.deadEnds) {
        if (st.items.has(c)) continue;
        const dir = DIRS.find(([b]) => st.open[c] & b);
        if (!dir) continue;
        st.props.push({ c, dx: -dir[1], dy: -dir[2], e: st.theme.props[pk++ % st.theme.props.length] });
      }
      renderBag();
      st.ready = true;
      layout();
    };
    function addChaser() {
      const cs = ctx.CHASERS[st.pair[1]] || ["🐶", "강아지"];
      const sc = center(st.startCell);
      const nest = { x: sc.x + st.outDir.x * 0.36, y: sc.y + st.outDir.y * 0.36 };
      st.ch = { e: cs[0], name: cs[1], x: nest.x, y: nest.y, nest, home: st.startCell, mode: "nap", t: 0, idle: 0, near: false, mid: false, catches: 0, grace: 0, speed: ctx.chaseSpeed(), foot: false };
    }
    function chaseOnOff(on) {
      if (on) {
        if (!st.ch) addChaser();
      } else {
        st.ch = null;
        board.classList.remove("near");
      }
      placeChaseItems(on);
    }
    ctx.mzChaseOnOff = chaseOnOff;

    const arrive = async () => {
      if (st.won) return;
      st.won = true;
      st.dragging = false;
      pid = null;
      const rid = st.roundId;
      // 도착 순간의 술래 상태를 기록 (축하 연출 중 바뀌어도 결과는 그대로)
      const ch = st.ch;
      const chase = !!(ch && ch.mode !== "nap");
      const catches = ch ? ch.catches : 0;
      if (ch) {
        ch.mode = "join";
        ch.arrived = false;
        board.classList.remove("near");
      }
      const fr = [...st.items.values()].find((it) => it.kind === "friend" && it.done);
      st.got = collectibles().filter((it) => it.done);
      A.sfx("sparkle");
      KP.voice.say(st.pair[3] + "! 찾았다!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1100);
      if (!ctx._active || st.roundId !== rid) return;
      if (st.got.length) {
        // 소풍: 모은 과일은 냠냠, 별은 반짝
        st.eatAt = performance.now();
        const fruit = st.got[0].kind === "fruit";
        A.sfx(fruit ? "pop" : "sticker");
        KP.voice.say(fruit ? "냠냠! 맛있다!" : "반짝!");
        await ctx.wait(1300);
        if (!ctx._active || st.roundId !== rid) return;
      }
      if (chase) ctx.chaseResult(true, catches);
      const big = ctx.round % 4 === 0;
      const o = { big };
      if (chase && !catches) o.msg = "술래보다 먼저 도착!";
      else if (fr) {
        o.msg = "친구랑 같이 도착!";
        o.say = "야호! 미로 탈출 성공!";
      } else o.msg = big ? "{부름} 미로 대장!" : "미로 탈출 성공!";
      const okWin = await ctx.win(o);
      if (okWin) ctx.def.next(ctx);
    };

    /* ---------- 술래 ---------- */
    const cellOf = (o) => Math.min(st.rows - 1, Math.max(0, Math.floor(o.y))) * st.cols + Math.min(st.cols - 1, Math.max(0, Math.floor(o.x)));
    const center = (c) => ({ x: (c % st.cols) + 0.5, y: ((c / st.cols) | 0) + 0.5 });
    /** 칸 가운데를 따라 가장 짧은 길로 목표 칸까지 (목표 칸 안에서는 fin 지점으로). 남은 거리 */
    function walk(ch, goalCell, fin, speed, dt) {
      const cc = cellOf(ch);
      let tx, ty;
      if (cc === goalCell) {
        tx = fin.x;
        ty = fin.y;
      } else {
        const here = center(cc);
        const offc = Math.hypot(ch.x - here.x, ch.y - here.y);
        const path = solve(cc, goalCell);
        const nx = path[1] !== undefined ? center(path[1]) : here;
        // 칸 가운데를 지나서 꺾기 (벽을 가로지르지 않게)
        const sameRow = Math.abs(nx.y - here.y) < 0.01;
        const aligned = sameRow ? Math.abs(ch.y - here.y) < 0.02 : Math.abs(ch.x - here.x) < 0.02;
        if (aligned || offc < 0.02) {
          tx = nx.x;
          ty = nx.y;
        } else {
          tx = here.x;
          ty = here.y;
        }
      }
      const dx = tx - ch.x,
        dy = ty - ch.y,
        d = Math.hypot(dx, dy);
      if (d > 0.0001) {
        const k = Math.min(1, (speed * dt) / d);
        ch.x += dx * k;
        ch.y += dy * k;
      }
      return cc === goalCell ? Math.hypot(fin.x - ch.x, fin.y - ch.y) : 9;
    }
    const giggle = () => {
      ["E6", "C6", "G6", "E6", "C7"].forEach((n, i) => A.note(n, { inst: "marimba", when: i * 0.07, dur: 0.12, vol: 0.13 }));
      A.sfx("sparkle");
    };
    const silly = () => {
      A.tone(760, { to: 260, dur: 0.22, vol: 0.14, type: "triangle" });
      A.tone(260, { to: 900, dur: 0.28, vol: 0.12, type: "triangle", when: 0.22 });
      A.tone(900, { to: 380, dur: 0.3, vol: 0.1, type: "triangle", when: 0.5 });
    };
    /** "하나, 둘, 셋! ○○가 잡으러 와요!" — 녹음 조각이 다 있으면 통째로, 아니면 "하나, 둘, 셋!"만 말하고 나머지는 말풍선 글자로 */
    function countVoice(ch) {
      const rest = U.josa(ch.name, "이/가") + " 잡으러 와요!";
      const full = "하나, 둘, 셋! " + rest;
      const nat = KP.voice._natUrls ? KP.voice._natUrls(full) : null;
      ctx.say(ch.e + " " + rest, false);
      KP.voice.say(nat ? full : "하나, 둘, 셋!");
    }
    let stepT = 0;
    function chaseTick(dt) {
      const ch = st.ch;
      if (!ch) return;
      const now = performance.now();
      if (st.won) {
        // 도착: 술래도 목표 옆으로 와서 같이 폴짝
        if (ch.mode !== "join") ch.mode = "join";
        if (!ch.arrived) {
          const g = center(st.goalCell);
          walk(ch, st.goalCell, g, 3.2, dt);
          if (Math.hypot(ch.x - g.x, ch.y - g.y) < 0.62) ch.arrived = true;
        }
        return;
      }
      const hidden = kidHidden();
      const setNear = (n) => {
        if (ch.near !== n) {
          ch.near = n;
          board.classList.toggle("near", n);
        }
      };
      if (ch.mode !== "run") setNear(false);
      switch (ch.mode) {
        case "nap":
          // 아이가 둥지에서 멀어지면 깨서 셋 세고 출발
          if (Math.hypot(st.p.x - ch.nest.x, st.p.y - ch.nest.y) > 1.2) {
            ch.mode = "wake";
            ch.t = 3.2;
            ch.lastN = 0;
            A.sfx("pop");
            countVoice(ch);
          }
          return;
        case "wake": {
          ch.t -= dt;
          const n = Math.ceil(ch.t);
          if (ch.lastN !== n && n <= 3 && n >= 1) {
            ch.lastN = n;
            A.note(["G5", "E5", "C5"][3 - n] || "C5", { inst: "marimba", dur: 0.15, vol: 0.15 });
          }
          if (ch.t <= 0) {
            ch.mode = "run";
            ch.idle = 0;
            ch.grace = Math.max(ch.grace, now + 800);
            ch.speed = ctx.chaseSpeed();
          }
          return;
        }
        case "hug":
          ch.t -= dt;
          if (ch.t <= 0) {
            // 둥지로 돌아가 잠깐 쉬었다가 다시 셋 세고 출발 (아이는 그 자리에서 계속)
            fx(ch.x, ch.y, "✨", { size: 0.4 });
            ch.x = ch.nest.x;
            ch.y = ch.nest.y;
            fx(ch.x, ch.y, "✨", { size: 0.4 });
            ch.mode = "wake";
            ch.t = 4.2;
            ch.lastN = 0;
            ch.grace = now + 6000;
            st.items.forEach((it) => it.kind === "bubble" && (it.done = false)); // 비눗방울도 다시
          }
          return;
        case "spin":
          ch.t -= dt;
          if (ch.t <= 0) ch.mode = "run";
          return;
        case "sit":
          // 손을 뗀 동안은 술래도 계속 쉼 — 다시 잡아야 기지개 켜고 출발.
          // (예전엔 3.5초 뒤 혼자 일어나 달려와서, 길을 보며 생각하느라 멈춘 아이가 손을 안 대고도 잡혔음)
          ch.t += dt;
          if (st.dragging) {
            ch.mode = "stand";
            ch.t = 0.45;
            ch.rested = false;
          }
          return;
        case "stand":
          ch.t -= dt;
          if (ch.t <= 0) ch.mode = "run";
          return;
        case "look":
          ch.t += dt;
          if (!hidden) ch.mode = "run";
          else if (ch.t > 3.5) ch.mode = "home"; // 못 찾으면 둥지로 돌아감 → 아이가 나올 기회
          return;
        case "home": {
          if (!hidden) {
            ch.mode = "run";
            return;
          }
          const hc = center(ch.home);
          if (walk(ch, ch.home, hc, ch.speed * 0.8, dt) < 0.03) {
            ch.mode = "wake";
            ch.t = 3.2;
            ch.lastN = 0;
          }
          bubbleCheck(ch);
          return;
        }
      }
      // ---- run ----
      // 손을 떼면 술래도 잠깐 앉아 쉼 (생각할 여유)
      if (!st.dragging && !ch.rested) {
        ch.idle += dt;
        if (ch.idle > 0.35) {
          ch.mode = "sit";
          ch.t = 0;
          ch.idle = 0;
          setNear(false);
          return;
        }
      } else ch.idle = 0;
      if (st.dragging) ch.rested = false;
      const pc = cellOf(st.p),
        cc = cellOf(ch);
      if (hidden) {
        // 덤불에 숨었으면 덤불 앞 칸까지만 와서 두리번
        const b = st.bushCell;
        const dir = DIRS.find(([bit]) => st.open[b] & bit);
        const front = dir ? b + dir[2] * st.cols + dir[1] : ch.home;
        const fc = center(front);
        setNear(false);
        if (walk(ch, front, fc, ch.speed, dt) < 0.04) {
          ch.mode = "look";
          ch.t = 0;
          if (!ch.saidLook) {
            ch.saidLook = true;
            KP.voice.say("어디 있을까?");
          }
        }
        bubbleCheck(ch);
        return;
      }
      ch.saidLook = false;
      walk(ch, pc, st.p, ch.speed, dt);
      if (bubbleCheck(ch)) return;
      // 거리(길 따라 칸 수)로 가까움 판단 → 웃는 얼굴·두근두근·발소리
      const steps = solve(cellOf(ch), pc).length - 1;
      setNear(steps <= 1);
      ch.mid = steps >= 2 && steps <= 3;
      stepT -= dt;
      if (stepT <= 0) {
        stepT = ch.near ? 0.28 : 0.42;
        const vol = Math.max(0.03, 0.2 - steps * 0.05);
        A.note(ch.foot ? "C4" : "G3", { inst: "marimba", dur: 0.07, vol });
        ch.foot = !ch.foot;
      }
      if (Math.hypot(st.p.x - ch.x, st.p.y - ch.y) < 0.42 && now > ch.grace) caught();
    }
    /** 비눗방울을 밟으면 뱅글뱅글 */
    function bubbleCheck(ch) {
      for (const [c, it] of st.items) {
        if (it.kind !== "bubble" || it.done) continue;
        const o = center(c);
        if (Math.hypot(ch.x - o.x, ch.y - o.y) < 0.3) {
          it.done = true;
          ch.mode = "spin";
          ch.t = 1.5;
          board.classList.remove("near");
          ch.near = false;
          silly();
          for (let k = 0; k < 4; k++) fx(o.x, o.y, "🫧", { vx: (k - 1.5) * 0.3, up: 0.6 + (k % 2) * 0.3, size: 0.22, dur: 900 });
          if (!st.saidSpin) {
            st.saidSpin = true;
            KP.voice.say("하하하!");
          }
          return true;
        }
      }
      return false;
    }
    function caught() {
      const ch = st.ch;
      ch.catches++;
      ch.mode = "hug";
      ch.t = 1.6;
      ch.near = false;
      board.classList.remove("near");
      giggle();
      for (let k = 0; k < 3; k++) fx(st.p.x, st.p.y, "💕", { vx: (k - 1) * 0.4, up: 0.9, size: 0.28, dur: 1200 });
      KP.voice.say(U.pick(["잡았다! 간지럼 간지럼!", "잡았다! 꼭 안아 줄게!", "잡았다! 다시 도망가 봐!"]));
      ctx.chaseResult(false);
    }

    ctx.mzDraw = draw;
    ctx.mzTick = (dt, now) => {
      chaseTick(dt);
      if (st.bump > 0) st.bump = Math.max(0, st.bump - dt * 4);
      // 기울기는 움직임이 멈추면 제자리로
      if (now - (st.tiltAt || 0) > 140) st.tiltT = 0;
      st.tilt += (st.tiltT - st.tilt) * Math.min(1, dt * 12);
      // 따라오는 친구: 아이가 지나온 길을 0.7칸 뒤에서 졸졸
      st.items.forEach((it) => {
        if (it.kind !== "friend" || !it.done) return;
        let acc = 0,
          tgt = st.track[0];
        for (let k = st.track.length - 1; k > 0; k--) {
          acc += Math.hypot(st.track[k].x - st.track[k - 1].x, st.track[k].y - st.track[k - 1].y);
          tgt = st.track[k - 1];
          if (acc >= 0.7) break;
        }
        if (st.track.length < 2) tgt = st.track[0];
        it.x += (tgt.x - it.x) * Math.min(1, dt * 8);
        it.y += (tgt.y - it.y) * Math.min(1, dt * 8);
      });
      // 오래 멈춰 있으면 갈 길을 반짝
      if (st.ready && !st.won && !st.dragging && now - st.lastMove > 10000 && !(st.glowUntil > now)) {
        const here = Math.floor(st.p.y) * st.cols + Math.floor(st.p.x);
        st.glowPath = solve(here, st.goalCell).slice(1, 5);
        st.glowUntil = now + 3000;
        st.lastMove = now;
      }
      // 아무도 안 움직이고 둥실둥실만 할 때는 한 장 걸러 그림 (느린 흔들림이라 30장/초로도 부드러움, 그래픽 힘 절반)
      const calm = !st.dragging && !st.won && st.bump <= 0 && !st.fx.length && !(st.glowUntil > now) && (!st.ch || st.ch.mode === "nap") && now - (st.lastMove || 0) > 600;
      if (calm && (st._half = !st._half)) return;
      draw(now);
    };
    ctx.mzSolve = solve;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.mzClosePick && ctx.mzClosePick();
    ctx.mzLoadMe && ctx.mzLoadMe(); // 지난번에 고른 얼굴(없으면 동물 친구)
    // 술래 속도 배율: 단계별로 기억(2단계에서 잘해도 3단계 첫 판이 갑자기 빠르지 않게). 예전 공용 값은 처음 한 번 옮겨 옴
    const kKey = () => "maze:chaseK:" + Math.max(2, ctx.level);
    ctx.chaseK = () => {
      let v = KP.store.get(kKey(), null);
      if (v == null) {
        v = +KP.store.get("maze:chaseK", 1) || 1;
        KP.store.set(kKey(), v);
      }
      return +v || 1;
    };
    ctx.chaseSpeed = () => [0, 0.85, 0.95, 1.15][ctx.level] * ctx.chaseK();
    ctx.chaseResult = (won, catches) => {
      let k = ctx.chaseK();
      if (won) k = Math.min(1.6, k * (catches ? 1.0 : 1.06));
      else k = Math.max(0.5, k * 0.85);
      KP.store.set(kKey(), k);
    };
    const paint = () => {
      const on = !!KP.store.get("maze:chase", false);
      const st = ctx.mz;
      const cs = (st.pair && ctx.CHASERS[st.pair[1]]) || ["🦊"];
      // 그림 버튼: 술래 얼굴 + 💤(쉬는 중) / 💨(술래잡기 중) — 글을 몰라도 스스로 켜고 끌 수 있게
      ctx.bChase.innerHTML = KP.E(cs[0]) + KP.E(on ? "💨" : "💤");
      ctx.bChase.setAttribute("aria-label", on ? "술래잡기 끄기" : "술래잡기 켜기");
      ctx.bChase.classList.toggle("on", on);
      ctx.bChase.style.display = ctx.level >= 2 ? "" : "none";
    };
    ctx.paintChase = paint;
    if (!ctx.bChase._bound) {
      ctx.bChase._bound = true;
      ctx.bChase.addEventListener("click", () => {
        KP.audio.unlock();
        const st = ctx.mz;
        if (!st.ready || st.won || ctx.level < 2) return; // 도착 축하 중에는 무시
        const on = !KP.store.get("maze:chase", false);
        KP.store.set("maze:chase", on);
        KP.audio.sfx(on ? "levelup" : "pop");
        KP.voice.say(on ? "술래잡기 도전! 친구가 쫓아와요. 먼저 도착해요!" : "술래잡기 끝! 천천히 가요.");
        // 새 판으로 바꾸지 않고, 지금 미로·지금 위치 그대로 술래만 들어오고 나감
        ctx.mzChaseOnOff(on);
        ctx.say(ctx.mzIntro(), false);
        paint();
      });
    }
    ctx.mzIntro = () => {
      const U = KP.u,
        st = ctx.mz;
      const [, cn, , gn] = st.pair;
      const who = ctx.me ? "내 얼굴을" : st.pair[0] + " " + U.josa(cn, "을/를"); // 내 얼굴로 하는 중이면 "내 얼굴을"
      if (st.ch) return st.ch.e + " " + U.josa(st.ch.name, "이/가") + " 쫓아와요! " + who + " " + gn + "까지 먼저 데려가요!";
      return who + " 끌어서 " + st.pair[2] + " " + gn + "까지 데려다 줘요!";
    };
    ctx.pairIdx = KP.u.rand(ctx.PAIRS.length);
    this.next(ctx);
    ctx.loop((dt, now) => ctx.mzTick(dt, now));
  },
  next(ctx) {
    const st = ctx.mz;
    ctx.mzDrop && ctx.mzDrop();
    ctx.mzFit();
    const bw = ctx.body.clientWidth,
      bh = ctx.body.clientHeight;
    const land = bw >= bh;
    const ratio = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
    const phone = Math.min(bw, bh) < 560;
    let [a, b] = [[3, 3], [5, 4], [7, 6]][ctx.level - 1];
    // 1단계: 길쭉한 화면은 긴 쪽 칸을 늘려 화면을 채움 (폰 세로 3×5, 태블릿 4×3)
    if (ctx.level === 1) a = phone ? (ratio > 1.6 ? 5 : ratio > 1.25 ? 4 : 3) : ratio > 1.3 ? 4 : 3;
    let cols = land ? a : b;
    let rows = land ? b : a;
    st.side = 0;
    // 가로 화면 3단계: 칸 크기는 그대로 두고 좌우 빈 풀밭을 칸으로 채움 (태블릿 약 10~11칸) — 양옆 버튼(모은 것·술래) 자리는 비워 둠
    if (land && ctx.level === 3 && st.W && st.H) {
      // 버튼 자리 = 실제 버튼 너비 (모은 것 칸은 별 개수에 따라 넓어지므로 넉넉히 별 3개 기준) + 여유
      const bagW = Math.max(ctx.mzBag ? ctx.mzBag.offsetWidth : 0, 130),
        chW = ctx.mzRight ? ctx.mzRight.offsetWidth : 100;
      const pad = Math.max(12, Math.min(st.W, st.H) * 0.025),
        side = Math.max(bagW, chW) + 10 + 12;
      const sh = (st.H - pad * 2) / (rows + 0.6);
      const fitCols = Math.floor((st.W - side * 2) / sh - 0.4);
      if (fitCols > cols) {
        cols = Math.min(fitCols, 13);
        st.side = side;
      }
    }
    // 세로로 긴 화면(폰 세로)은 2·3단계에서 칸 크기는 그대로 두고 아래 빈 곳을 줄로 채움 (2단계 최대 7줄, 3단계 최대 9줄)
    if (!land && ctx.level > 1 && st.W && st.H) {
      const top = st.H > st.W * 1.08 ? Math.min(70, st.H * 0.09) : 0,
        pad = Math.max(12, Math.min(st.W, st.H) * 0.025);
      const sw = (st.W - pad * 2) / (cols + 0.4);
      const fitRows = Math.floor((st.H - top - pad * 2) / sw - 0.6);
      rows = Math.max(rows, Math.min(fitRows, ctx.level === 2 ? 7 : 9));
    }
    ctx.mzRound(cols, rows);
    st.saidSpin = false;
    ctx.paintChase && ctx.paintChase();
    // 1단계(술래 없음)를 거쳐 2단계로 다시 오르면 술래가 갑자기 나오지 않게 먼저 알림 (자연 음성 있는 문장) + 술래 단추 반짝
    const back = st.ch && ctx.prevLv === 1 && ctx.level >= 2;
    ctx.prevLv = ctx.level;
    if (back) {
      ctx.chaseWarned = (ctx.chaseWarned || 0) + 1; // 점검용
      ctx.say(ctx.mzIntro(), "술래잡기 도전! 친구가 쫓아와요. 먼저 도착해요!");
      ctx.bChase && KP.u.replay(ctx.bChase, "hintGlow");
    } else ctx.say(ctx.mzIntro());
    ctx.mzSetHint();
  },
});

;

/* ==== js/games/bigkid/missing.js ==== */
/* 무엇이 없어졌을까? — 잘 보고, 커튼이 닫혔다 열리면 사라진 것 찾기
   1단계: 3개 (빈자리가 점선으로 보임) · 보기 3개
   2단계: 4개 (두 종류 2개씩, 빈자리는 그대로, 점선 없음) · 보기 4개(남아 있는 것 1개 섞임)
   3단계: 6개 (남은 것들 자리도 섞임) · 보기 4개(같은 종류끼리)
   - 처음 안내가 끝나면 하나씩 통통 튀며 이름을 불러 줌 → 커튼 닫힘 "눈 감아요! 하나, 둘, 셋!" → 열림
   - 보는 동안 그림을 누르면 통통 튀며 이름을 말해 주고, 커튼이 닫혔을 때 누르면 🙈 가 "하나, 둘, 셋!"
   - 보는 시간 줄이기(2차 보강): 열고 둘째 판부터 안내는 짧게 "잘 봐요!", 1·2단계는 이름 대신 통통+소리만 빠르게(3단계는 이름 그대로)
   - 좁은 세로 화면 1단계(3개): 2+1 로 그림을 크게 */
"use strict";
KP.game({
  id: "missing",
  icon: "❓",
  name: "무엇이 없어졌을까?",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("missing", `
      .msWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 14px;gap:10px}
      .msStage{position:relative;overflow:hidden;border-radius:30px;padding:clamp(14px,2.4vw,26px) clamp(14px,2.4vw,30px) clamp(26px,3.6vw,40px);background:linear-gradient(180deg,#fff9ea,#ffe9bf);box-shadow:0 10px 0 #d9a65a,0 14px 24px rgba(47,58,102,.12);max-width:100%}
      .msStage::after{content:"";position:absolute;left:0;right:0;bottom:0;height:clamp(16px,2.4vw,24px);background:linear-gradient(180deg,#c98a3c,#a96d26)}
      .msRow{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--mg,14px)}
      .msSpot{width:var(--ms,120px);height:var(--ms,120px);display:flex;align-items:center;justify-content:center;font-size:calc(var(--ms,120px)*.8);line-height:1;border-radius:24px;transition:transform .45s cubic-bezier(.3,1.3,.5,1)}
      .msSpot.gap{border:4px dashed rgba(169,109,38,.45)}
      .msSpot .eb{animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*90ms)}
      .msCur{position:absolute;top:0;bottom:0;width:51%;z-index:3;transition:transform .7s cubic-bezier(.5,0,.3,1);background:repeating-linear-gradient(90deg,#d2344a 0 18px,#b8213a 18px 30px,#e0485c 30px 40px);box-shadow:inset 0 -12px 0 #8e1529}
      .msCur.l{left:0;transform:translateX(-102%);border-right:3px solid #8e1529}
      .msCur.r{right:0;transform:translateX(102%);border-left:3px solid #8e1529}
      .msStage.closed .msCur{transform:none}
      .msEyes{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;font-size:calc(var(--ms,120px)*.9);opacity:0;transition:opacity .3s;pointer-events:none}
      .msEyes .eb.jump{animation:jumpA .5s}
      .msStage.closed .msEyes{opacity:1}
      .msEyes .eb{animation:bob 1.2s ease-in-out infinite}
      .msAns{display:flex;gap:clamp(12px,2.4vw,26px);justify-content:center;flex-wrap:wrap;min-height:clamp(90px,13vw,140px);transition:opacity .3s}
      .msAns.hide{visibility:hidden;opacity:0}
      .msAns .choice{font-size:clamp(54px,8vw,84px)}
    `);
    ctx.wrap = U.el("div", "msWrap");
    ctx.stage = U.el("div", "msStage");
    ctx.row = U.el("div", "msRow");
    ctx.eyes = U.el("div", "msEyes", '<span class="eb">' + KP.E("🙈") + "</span>");
    ctx.stage.append(ctx.row, U.el("div", "msCur l"), U.el("div", "msCur r"), ctx.eyes);
    ctx.ans = U.el("div", "msAns hide");
    ctx.wrap.append(ctx.stage, ctx.ans);
    ctx.body.appendChild(ctx.wrap);

    ctx.POOLS = [
      [["🍎", "사과"], ["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"], ["🍑", "복숭아"], ["🍒", "체리"], ["🍊", "귤"], ["🍋", "레몬"]],
      [["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰"], ["🐼", "판다"], ["🐸", "개구리"], ["🦁", "사자"], ["🐯", "호랑이"], ["🐵", "원숭이"]],
      [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚓", "경찰차"], ["🚜", "트랙터"], ["🚲", "자전거"], ["✈️", "비행기"], ["🚀", "로켓"], ["🚂", "기차"]],
      [["⚽", "공"], ["🎈", "풍선"], ["🧸", "곰인형"], ["🪀", "요요"], ["🎁", "선물"], ["🥁", "북"], ["🪁", "연"], ["🎨", "물감"], ["🧩", "퍼즐"]],
      [["🍦", "아이스크림"], ["🍩", "도넛"], ["🍪", "쿠키"], ["🧁", "컵케이크"], ["🍭", "사탕"], ["🍰", "케이크"], ["🍕", "피자"], ["🍔", "햄버거"], ["🍞", "빵"]],
    ];
    ctx.msSize = () => {
      const n = ctx.row.children.length || 3;
      const W = ctx.body.clientWidth - 24 - 60,
        H = ctx.body.clientHeight;
      const gap = W < 500 ? 10 : 16;
      let per = n,
        s = W / per - gap;
      if (s < 96 && n > 3) {
        per = Math.ceil(n / 2);
        s = W / per - gap;
      }
      // 좁은 세로(폰) 3개: 한 줄이면 92px 안팎 → 2+1 로 (높이에 여유가 있을 때)
      if (n === 3 && s < 110 && H > W * 1.2) {
        per = 2;
        s = W / per - gap;
      }
      s = Math.min(s, 180, (H * 0.46) / Math.ceil(n / per));
      ctx.row.style.setProperty("--ms", Math.floor(s) + "px");
      ctx.row.style.setProperty("--mg", gap + "px");
      ctx.stage.style.setProperty("--ms", Math.floor(s) + "px");
      ctx.row.style.width = per * (s + gap) - gap + "px";
    };
    addEventListener("resize", () => ctx._active && ctx.msSize());
    // 기다리는 동안에도 반응: 보는 중엔 누른 그림이 튀며 이름, 커튼이 닫혀 있으면 🙈 가 "하나, 둘, 셋!"
    ctx.fast(ctx.stage, (e) => {
      const g = ctx.ms;
      if (!g || g.phase === "ask") return;
      if (ctx.stage.classList.contains("closed")) {
        const eb = ctx.eyes.firstChild;
        U.replay(eb, "jump");
        KP.audio.sfx("boing");
        if (g.phase === "closed" && g.shutDone && !g.eyesSaid) {
          g.eyesSaid = true;
          KP.voice.say("하나, 둘, 셋!");
        }
        return;
      }
      const sp = e.target.closest && e.target.closest(".msSpot");
      if (!sp || !sp.dataset.em || !sp.firstChild) return;
      U.replay(sp, "jump");
      KP.audio.note(KP.audio.SCALE[g.spots.indexOf(sp)] || "C6", { inst: "marimba", dur: 0.3, vol: 0.22 });
      if (g.phase === "look") KP.voice.say(sp.dataset.name); // 이름 부르는 중엔 소리만 (호명이 끊기지 않게)
    });
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 6][lv - 1];
    // 1·2단계는 여러 종류를 섞고, 3단계는 같은 종류끼리(더 헷갈림)
    let shown, spare;
    if (lv === 3) {
      const pool = U.shuffle([...U.pick(ctx.POOLS)]);
      shown = pool.slice(0, n);
      spare = pool.slice(n);
    } else if (lv === 2) {
      // 2단계: 두 종류에서 2개씩 (1단계보다 헷갈리고 3단계보다 쉬움)
      const pools = U.sample(ctx.POOLS, 2);
      shown = U.shuffle(pools.flatMap((p) => U.sample(p, 2)));
      spare = U.shuffle(ctx.POOLS.flat().filter((x) => !shown.includes(x)));
    } else {
      const pools = U.sample(ctx.POOLS, n);
      shown = pools.map((p) => U.pick(p));
      spare = U.shuffle(ctx.POOLS.flat().filter((x) => !shown.includes(x)));
    }
    const gone = U.rand(n);
    const goneItem = shown[gone];
    ctx.goneItem = goneItem;
    ctx.stage.classList.remove("closed");
    ctx.ans.classList.add("hide");
    ctx.ans.innerHTML = "";
    ctx.row.innerHTML = "";
    const spots = shown.map(([em, name], k) => {
      const sp = U.el("div", "msSpot");
      const e = KP.Eel(em);
      e.style.setProperty("--i", k);
      sp.appendChild(e);
      sp.dataset.em = em;
      sp.dataset.name = name;
      ctx.row.appendChild(sp);
      return sp;
    });
    ctx.msSize();
    ctx.hint(null);
    const tok = (ctx.msTok = (ctx.msTok || 0) + 1);
    const g = (ctx.ms = { phase: "names", spots, eyesSaid: false });
    const alive = () => ctx._active && ctx.msTok === tok;
    // 열고 첫 판은 긴 안내, 그다음부터는 "잘 봐요!"만
    const quick = ctx.round > 0;
    const intro = ctx.say(quick ? "잘 봐요!" : "잘 봐요! 무엇 무엇이 있나요?");
    // 하나씩 이름 불러 주기 — 첫 안내가 끝난 뒤에 시작 (예전엔 1.7초 뒤 첫 이름이 안내를 끊었음)
    // 둘째 판부터 1·2단계는 이름 없이 통통+소리만 빠르게 (3단계는 비슷한 것끼리라 이름이 도움)
    const names = !quick || lv === 3;
    const STEP = names ? 800 : 420;
    const look = [1000, 900, 1200][lv - 1];
    const run = async () => {
      const t0 = Date.now();
      await Promise.race([intro, ctx.wait(3600)]);
      if (!alive()) return;
      const waited = Date.now() - t0;
      const minW = quick ? 500 : 900;
      if (waited < minW) await ctx.wait(minW - waited);
      for (let k = 0; k < n; k++) {
        if (!alive()) return;
        U.replay(spots[k], "jump");
        A.note(A.SCALE[k] || "C6", { inst: "marimba", dur: 0.3, vol: 0.22 });
        if (names) KP.voice.say(shown[k][1]);
        await ctx.wait(STEP);
      }
      if (!alive()) return;
      g.phase = "look";
      await ctx.wait(look);
      if (!alive()) return;
      g.phase = "closed";
      ctx.stage.classList.add("closed");
      A.sfx("whoosh");
      const shut = KP.voice.say("눈 감아요! 하나, 둘, 셋!");
      shut.then(() => (g.shutDone = true));
      await ctx.wait(700);
      if (!alive()) return;
      hide();
      // 커튼은 1.8초 또는 "하나, 둘, 셋!"이 끝날 때까지 (말이 잘리지 않게, 최대 3초)
      await Promise.all([ctx.wait(1100), Promise.race([shut, ctx.wait(2300)])]);
      if (!alive()) return;
      g.phase = "ask";
      ctx.stage.classList.remove("closed");
      A.sfx("open");
      await ctx.wait(450);
      if (!alive()) return;
      ctx.say("무엇이 없어졌을까요?");
      showChoices();
    };
    const hide = () => {
      // 하나 숨기기
      const sp = spots[gone];
      sp.innerHTML = "";
      if (lv === 1) sp.classList.add("gap");
      if (lv === 3) {
        // 남은 것들 자리 섞기 (빈자리는 맨 끝으로)
        sp.remove();
        const rest = U.shuffle(spots.filter((s) => s !== sp));
        rest.forEach((s) => ctx.row.appendChild(s));
        ctx.row.appendChild(sp);
      }
    };

    const showChoices = () => {
      let opts;
      const present = shown.filter((x) => x !== goneItem);
      if (lv === 1) opts = [goneItem, ...spare.slice(0, 2)];
      else if (lv === 2) opts = [goneItem, U.pick(present), ...spare.slice(0, 2)];
      else opts = [goneItem, ...spare.slice(0, 3)];
      opts = U.shuffle(opts);
      ctx.ans.classList.remove("hide");
      const btns = ctx.choices(ctx.ans, opts, {
        render: ([em]) => KP.E(em),
        right: (v) => v === goneItem,
        wrongMsg: ([em, name]) => {
          if (present.some((p) => p[0] === em)) {
            const s = spots.find((x) => x.dataset.em === em && x.isConnected);
            if (s) U.replay(s, "jump");
            // 말은 "컵케이크! 여기 있어요! 다시 찾아봐요." — 이름(조사 없이)·공용 조각 모두 자연 음성
            KP.voice.say(name + "! 여기 있어요! 다시 찾아봐요.");
            return "";
          }
          return U.pick(["음, 다시 생각해 볼까요?", "아깝다! 무엇이 있었더라?"]);
        },
        onRight: async ([em, name], b) => {
          // 사라졌던 것이 제자리로 돌아오기
          const sp = spots[gone];
          sp.classList.remove("gap");
          const e = KP.Eel(em);
          sp.appendChild(e);
          U.replay(sp, "jump");
          A.sfx("sparkle");
          KP.voice.say("찾았다!");
          ctx.score.add();
          ctx.round++;
          await ctx.wait(1100);
          if (!ctx._active) return;
          const big = ctx.round % 4 === 0;
          // 화면은 "물감이 없어졌었어요!", 말은 "물감! 없어졌었어요!" (이름+조사 조각이 없어 쪼개어 자연 음성)
          const ok = await ctx.win({ big, msg: big ? "{부름} 기억력 대장!" : U.josa(name, "이/가") + " 없어졌었어요!", say: big ? undefined : name + "! 없어졌었어요!" });
          if (ok) this.next(ctx);
        },
      });
      ctx.hint(() => btns.find((b) => b.dataset.right), "무엇이 없어졌을까? 생각나는 걸 눌러요!");
    };
    run();
  },
});

;

/* ==== js/games/bigkid/pattern.js ==== */
/* 규칙 찾기 — 줄의 다음에 올 것을 끌어서 빈칸에 쏙!
   1단계: AB AB (보기 3개 — 세 번째 보기는 줄에 있는 그림과 닮은 것(🍎→🍏)이라 '줄에 없는 것 빼기'로 2택이 되지 않음)
   2단계: AAB · ABC (보기 3개)
   3단계: ABB · AABB · 두 가지 속성(모양은 번갈아, 색은 두 개씩) (보기 3~4개)
   - 판이 시작되면 줄이 순서대로 통통 튀며 리듬으로 들려줌
   - 맞으면 줄 전체가 순서대로 튀며 리듬 소리
   - 힌트: 첫 번째는 줄을 다시 들려주고 빈칸을 흔들기만, 두 번째부터 정답 보기를 가리킴 */
"use strict";
KP.game({
  id: "pattern",
  icon: "🔁",
  name: "규칙 찾기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("pattern", `
      .ptWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 14px;gap:10px}
      .ptRow{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--pg,10px);padding:clamp(12px,2vw,20px);border-radius:30px;background:rgba(255,255,255,.75);box-shadow:var(--shadow);max-width:100%}
      .ptCell{width:var(--cs,96px);height:var(--cs,96px);border-radius:24%;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.12);display:flex;align-items:center;justify-content:center;font-size:calc(var(--cs,96px)*.72);line-height:1;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*45ms)}
      .ptCell.slot{background:rgba(255,255,255,.5);border:4px dashed #f29a00;box-shadow:none;position:relative}
      .ptCell.slot .q{font-size:.6em;opacity:.55;animation:ptQ 1.4s ease-in-out infinite}
      .ptCell.slot.filled{border-style:solid;background:#fff6d6}
      .ptCell.slot.filled .q{display:none}
      @keyframes ptQ{50%{transform:scale(1.18) rotate(8deg)}}
      .ptCell.beat{animation:ptBeat .32s}
      @keyframes ptBeat{40%{transform:translateY(-18%) scale(1.12)}}
      .ptOpts{display:flex;gap:clamp(14px,3vw,34px);justify-content:center;flex-wrap:wrap}
      .ptOpt{width:clamp(92px,13vw,136px);height:clamp(92px,13vw,136px);border-radius:28px;background:#fff;box-shadow:0 8px 0 rgba(47,58,102,.14);display:flex;align-items:center;justify-content:center;font-size:clamp(64px,9.4vw,100px);line-height:1;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*70ms + .2s)}
      @media (orientation:landscape) and (max-height:500px){.ptOpt{width:clamp(72px,21vh,136px);height:clamp(72px,21vh,136px);font-size:clamp(50px,15vh,100px)}.ptWrap{gap:6px;padding-bottom:8px}}
      .ptCell.slot .ptOpt{position:absolute;inset:-4px;width:auto;height:auto;font-size:inherit;box-shadow:none;background:transparent;animation:popIn .3s}
      /* 하늘 묶음(☁️ 구름이 흰 칸에서 안 보였음): 칸·보기를 연한 하늘색으로 */
      .ptSky .ptCell:not(.slot),.ptSky .ptOpt{background:#dcefff}
    `);
    ctx.wrap = U.el("div", "ptWrap");
    ctx.row = U.el("div", "ptRow");
    ctx.opts = U.el("div", "ptOpts");
    ctx.wrap.append(ctx.row, ctx.opts);
    ctx.body.appendChild(ctx.wrap);

    ctx.SETS = [
      [["🍎", "사과"], ["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"]],
      [["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰"], ["🐸", "개구리"]],
      [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚀", "로켓"], ["🚲", "자전거"]],
      [["☀️", "해님"], ["🌙", "달님"], ["⭐", "별"], ["☁️", "구름"], ["🌈", "무지개"]],
      [["🔴", "빨강"], ["🔵", "파랑"], ["🟡", "노랑"], ["🟢", "초록"], ["🟣", "보라"]],
    ];
    // 두 가지 속성: 모양 × 색
    ctx.SHAPE2 = {
      circle: { name: "동그라미", r: "🔴", b: "🔵", y: "🟡", g: "🟢" },
      square: { name: "네모", r: "🟥", b: "🟦", y: "🟨", g: "🟩" },
      heart: { name: "하트", r: "❤️", b: "💙", y: "💛", g: "💚" },
    };
    ctx.COLORN = { r: "빨간", b: "파란", y: "노란", g: "초록" };
    // 1단계 닮은 보기 (그림이 비슷한 것 — 이름은 같게 불러 줌)
    ctx.LOOK = { "🍎": "🍏", "🍓": "🍒", "🍉": "🍈", "🐶": "🐕", "🐱": "🐈", "🐰": "🐇", "🐻": "🐼", "🚗": "🚙", "🚌": "🚎", "🚒": "🚑", "☀️": "🌞", "🌙": "🌛", "⭐": "🌟", "🔴": "🟠", "🔵": "🟦", "🟡": "🟨", "🟢": "🟩", "🟣": "🟪" };
    ctx.NOTES = ["C5", "E5", "G5", "A5"];

    // 줄 크기: 한 줄에 다 들어가면 한 줄, 아니면 두 줄
    ctx.ptSize = () => {
      const n = ctx.row.children.length;
      if (!n) return;
      const W = ctx.body.clientWidth - 24 - 40,
        H = ctx.body.clientHeight;
      const gap = W < 600 ? 8 : 12;
      let per = n,
        cs = W / per - gap;
      if (cs < 74 && n > 3) {
        per = Math.ceil(n / 2);
        cs = W / per - gap;
      }
      cs = Math.min(cs, 124, H * 0.26);
      // 낮은 화면(폰 가로): 줄 + 보기 줄이 세로로 다 들어가게
      const rows = Math.ceil(n / per),
        optH = ctx.opts.offsetHeight || 100;
      cs = Math.max(48, Math.min(cs, (H - optH - 40 - 24) / rows - gap));
      ctx.row.style.setProperty("--cs", Math.floor(cs) + "px");
      ctx.row.style.setProperty("--pg", gap + "px");
      ctx.row.style.maxWidth = per * (cs + gap) + 40 + 4 + "px";
    };
    addEventListener("resize", () => ctx._active && ctx.ptSize());
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 이번 판 규칙 만들기 → {seq:[아이템], answer, options, label} */
  make(ctx) {
    const U = KP.u,
      lv = ctx.level;
    const rule = U.pick(lv === 1 ? ["AB"] : lv === 2 ? ["AAB", "ABC"] : ["ABB", "AABB", "TWO", "TWO"]);
    if (rule === "TWO") {
      const [sa, sb] = U.sample(Object.keys(ctx.SHAPE2), 2);
      const [ca, cb] = U.sample(["r", "b", "y", "g"], 2);
      const item = (s, c) => ({ em: ctx.SHAPE2[s][c], name: ctx.COLORN[c] + " " + ctx.SHAPE2[s].name, sym: (s === sa ? 0 : 1) + (c === ca ? 0 : 2) });
      // 모양은 AB, 색은 AABB → 4개가 한 묶음
      const unit = [item(sa, ca), item(sb, ca), item(sa, cb), item(sb, cb)];
      const shown = U.pick([6, 7]);
      const seq = Array.from({ length: shown }, (_, k) => unit[k % 4]);
      const answer = unit[shown % 4];
      // 헷갈리는 보기: 모양만 맞음, 색만 맞음
      const sameShape = unit.find((u) => u !== answer && (u.sym & 1) === (answer.sym & 1));
      const sameColor = unit.find((u) => u !== answer && (u.sym & 2) === (answer.sym & 2));
      return { seq, answer, options: U.shuffle([answer, sameShape, sameColor]), rule, two: true };
    }
    const syms = [...new Set(rule)];
    const set = U.pick(ctx.SETS);
    const items = U.sample(set, syms.length + 1).map(([em, name], k) => ({ em, name, sym: k }));
    const symItem = {};
    syms.forEach((s, k) => (symItem[s] = items[k]));
    const P = rule.length;
    const shownChoices = lv === 1 ? [4, 5] : rule === "AABB" ? [8, 9] : [6, 7, 8];
    const shown = U.pick(shownChoices.filter((n) => n >= P * 2 - 1));
    const seq = Array.from({ length: shown }, (_, k) => symItem[rule[k % P]]);
    const answer = symItem[rule[shown % P]];
    let options = syms.map((s) => symItem[s]);
    const nOpt = 3; // 1단계도 보기 3개 (2개면 찍어도 반은 맞음 — 열쇠 별 규칙)
    if (lv === 1) {
      // 줄의 두 그림 중 닮은 그림이 있는 것 하나를 골라 그 닮은 것을 세 번째 보기로
      const lk = U.shuffle(options.filter((o) => ctx.LOOK[o.em]));
      if (lk.length) options.push({ em: ctx.LOOK[lk[0].em], name: lk[0].name, sym: 9 });
    }
    if (options.length < nOpt) options.push(items[syms.length]);
    options = U.shuffle(options.slice(0, Math.max(nOpt, options.length)));
    return { seq, answer, options, rule };
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const g = this.make(ctx);
    ctx.g = g;
    ctx.row.innerHTML = "";
    ctx.opts.innerHTML = "";
    ctx.wrap.classList.toggle("ptSky", g.seq.concat(g.options).some((it) => it.em === "☁️"));
    const cells = g.seq.map((it, k) => {
      const c = U.el("div", "ptCell", KP.E(it.em));
      c.style.setProperty("--i", k);
      c.dataset.sym = it.sym;
      ctx.row.appendChild(c);
      return c;
    });
    const slot = U.el("div", "ptCell slot", '<span class="q">' + KP.E("❓") + "</span>");
    slot.style.setProperty("--i", cells.length);
    ctx.row.appendChild(slot);
    ctx.ptSize();
    let busy = false;
    const beat = (upto, then) => {
      const all = [...cells, ...(slot.classList.contains("filled") ? [slot] : [])].slice(0, upto);
      all.forEach((c, k) =>
        ctx.after(k * 330, () => {
          U.replay(c, "beat");
          const sym = +c.dataset.sym;
          A.note(ctx.NOTES[sym % 4], { inst: "marimba", dur: 0.3, vol: 0.26 });
        })
      );
      if (then) ctx.after(all.length * 330 + 150, then);
    };
    const opts = g.options.map((it, i) => {
      const o = U.el("div", "ptOpt item", KP.E(it.em));
      o.style.setProperty("--i", i);
      const right = it === g.answer;
      ctx.opts.appendChild(o);
      let lastTap = 0;
      const d = KP.drag(o, {
        targets: () => (busy ? [] : [slot]),
        accept: () => right,
        onReject: () => {
          ctx.miss(o, U.pick(["음, 다시 볼까요? 다음은 뭐가 올 차례일까?", "아깝다! 줄을 다시 들어 봐요.", "다시 생각해 봐요!"]));
          ctx.after(900, () => beat(cells.length));
        },
        onDrop: (t) => {
          if (!t) {
            const now = performance.now();
            if (now - lastTap > 2500) {
              lastTap = now;
              KP.voice.say(it.name + "! 빈칸으로 끌어 봐요.");
            }
            return;
          }
          busy = true;
          d.lock();
          o.style.transform = "";
          slot.dataset.sym = it.sym;
          slot.appendChild(o);
          slot.classList.add("filled");
          A.sfx("snap");
          ctx.hint(null);
          // 줄 전체가 순서대로 튀며 리듬
          ctx.after(250, () =>
            beat(cells.length + 1, async () => {
              ctx.score.add();
              ctx.round++;
              const big = ctx.round % 4 === 0;
              const ok = await ctx.win({ big, msg: big ? "{부름} 규칙 박사!" : "딩동댕! " + it.name + "!" });
              if (ok) this.next(ctx);
            })
          );
        },
      });
      o.dataset.right = right ? "1" : "";
      return o;
    });
    ctx.ptSize(); // 보기 줄 높이까지 알고 다시 맞춤
    ctx.say(g.two ? "모양도 색도 잘 봐요! 빈칸에는 무엇이 올까요?" : "줄을 잘 봐요! 빈칸에 올 것을 끌어다 넣어요.");
    // 처음에 줄을 리듬으로 들려주기
    ctx.after(700, () => beat(cells.length, () => U.replay(slot, "wig")));
    // 힌트 2단계: 첫 힌트(8초)는 줄을 리듬으로 다시 들려주고 빈칸만 흔들기(정답은 안 가리킴) →
    // 두 번째부터 정답 보기를 가리킴(가리킨 판은 열쇠 별 없음 — 정답 보기는 data-right 라 자동)
    const hk = (ctx.ptHintK = (ctx.ptHintK || 0) + 1);
    ctx.hint(() => {
      if (busy || hk !== ctx.ptHintK) return null;
      beat(cells.length, () => U.replay(slot, "wig"));
      ctx.after(3400, () => {
        if (!busy && hk === ctx.ptHintK && ctx.g === g) ctx.hint(() => opts.find((o) => o.dataset.right), "빈칸에 들어갈 것을 끌어다 놓아요!");
      });
      return slot;
    }, "줄을 잘 봐요!");
  },
});

;

/* ==== js/games/bigkid/sequence.js ==== */
/* 순서대로 놓기 — 그림 카드를 일어난 순서대로 빈칸 1·2·3 에 끌어 놓기
   1단계: 3장 모두 직접 놓기 (쉬운 이야기만 — 예전엔 첫 장면을 놓아 줘서 사실상 2택이었음)
   2단계: 3장 모두 직접 놓기 (이야기 전체) + 이야기와 상관없는 그림 1장이 쟁반에 섞임(남는 카드) — 1단계와 차이
   3단계: 4장 모두 직접 놓기
   완성하면 카드가 차례로 반짝이며 짧은 이야기를 들려준다. */
"use strict";
KP.game({
  id: "sequence",
  icon: "🎞️",
  name: "순서대로 놓기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sequence", `
      .sqWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 10px 14px;gap:10px}
      .sqRow{display:flex;align-items:center;justify-content:center;gap:clamp(4px,1vw,12px);flex-wrap:nowrap;max-width:100%}
      .sqWrap{--cw:clamp(96px,24vw,200px)}
      .sqWrap.n4{--cw:clamp(76px,20.5vw,180px)}
      @media (orientation:portrait){.sqWrap{--cw:min(27vw,200px)}.sqWrap.n4{--cw:min(19.5vw,180px)}.sqRow{gap:3px}.sqTray .sqCard{width:calc(var(--cw)*1.2);height:calc(var(--cw)*1.2)}.sqArrow{font-size:14px}}
      @media (max-height:700px) and (orientation:landscape){.sqWrap{--cw:clamp(96px,23vh,180px)}.sqWrap.n4{--cw:clamp(86px,23vh,170px)}}
      @media (orientation:portrait) and (max-width:480px){.sqWrap{--cw:min(24vw,200px)}.sqWrap.n4{--cw:min(16.5vw,180px)}.sqRow{gap:2px}.sqArrow{font-size:12px}.sqTray{gap:10px}}
      .sqSlot{width:var(--cw);height:var(--cw);position:relative;border-radius:24px;flex:0 0 auto}
      .sqNum{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:calc(var(--cw)*.42);color:rgba(47,58,102,.22);line-height:1}
      .sqSlot.filled .sqNum{display:none}
      .sqTag{position:absolute;left:-6px;top:-8px;z-index:4;width:calc(var(--cw)*.26);height:calc(var(--cw)*.26);min-width:26px;min-height:26px;border-radius:50%;background:var(--cat);color:#fff;display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.16);box-shadow:0 3px 0 rgba(0,0,0,.15)}
      .sqArrow{font-size:clamp(18px,3vw,34px);color:#f2a640;flex:0 0 auto;line-height:1}
      .sqTray{display:flex;gap:clamp(10px,2.4vw,26px);justify-content:center;flex-wrap:wrap;min-height:var(--cw);align-items:center}
      .sqCard{width:var(--cw);height:var(--cw);border-radius:24px;background:#fff;box-shadow:0 7px 0 rgba(47,58,102,.14);position:relative;display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.62);line-height:1;flex:0 0 auto}
      .sqCard.item{animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*80ms)}
      .sqSlot .sqCard{position:absolute;inset:0;width:auto;height:auto;box-shadow:0 5px 0 color-mix(in srgb,var(--cat) 45%,#fff);animation:popIn .3s}
      .sqSub{position:absolute;right:6%;bottom:6%;font-size:.42em;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
      .sqSubL{position:absolute;left:6%;bottom:6%;font-size:.42em}
      .sqMain{position:relative;display:inline-flex}
      .sqMain.s1{font-size:.55em}.sqMain.s2{font-size:.78em}.sqMain.s3{font-size:1em}
      .sqMain.melt{transform:scaleY(.55) translateY(40%)}
      .sqCocoon{width:.36em;height:.62em;border-radius:50% 50% 46% 46%/58% 58% 42% 42%;background:linear-gradient(90deg,#9a7b3a,#c9a85a 45%,#8d6c2c);box-shadow:inset 0 -.05em 0 rgba(0,0,0,.18);position:relative;top:.12em}
      .sqCocoon:before{content:"";position:absolute;left:50%;top:-.24em;width:.03em;height:.26em;background:#6b4f1d;transform:translateX(-50%)}
      .sqCocoon:after{content:"";position:absolute;left:12%;right:12%;top:30%;height:.04em;background:rgba(80,55,10,.35);box-shadow:0 .12em 0 rgba(80,55,10,.35),0 .24em 0 rgba(80,55,10,.3)}
      .sqLeaf{position:absolute;left:8%;top:6%;font-size:.42em;transform:rotate(-20deg)}
      .sqBall{width:.5em;height:.5em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#e6f1ff 60%,#bcd3ef);box-shadow:0 .04em 0 rgba(0,0,0,.12)}
      .sqCard.shine{animation:sqShine .9s ease-in-out;z-index:3}
      @keyframes sqShine{0%,100%{transform:none}40%{transform:scale(1.14) rotate(-3deg);box-shadow:0 0 0 8px #ffd54a,0 0 34px 10px rgba(255,213,74,.8)}}
      .sqCard.done{background:#fffbe8}
    `);
    // 이야기: [그림, 작은그림, 말, 꾸밈] — 4장면. 3장면은 s3 (사용할 장면 번호)
    ctx.STORIES = [
      { name: "꽃", easy: 1, s3: [0, 1, 3], steps: [["🫘", "", "씨앗을 심었어요"], ["🌱", "", "새싹이 쏙 났어요"], ["🌿", "", "쑥쑥 자랐어요"], ["🌻", "", "꽃이 활짝 피었어요"]] },
      { name: "닭", easy: 1, s3: [0, 1, 3], steps: [["🥚", "", "알이 있어요"], ["🐣", "", "알이 톡톡 깨졌어요"], ["🐥", "", "삐약삐약! 병아리예요"], ["🐔", "", "꼬끼오! 닭이에요."]] },
      { name: "풍선", easy: 1, s3: [0, 2, 3], steps: [["🎈", "", "풍선을 후 불어요", "s1"], ["🎈", "", "후우 더 커졌어요", "s2"], ["🎈", "", "큰 풍선!", "s3"], ["💥", "", "풍선이 갑자기 펑 터졌어요!"]] },
      { name: "무지개", easy: 1, s3: [1, 2, 3], steps: [["☀️", "", "해님이 반짝반짝"], ["☁️", "", "구름이 몰려와요"], ["🌧️", "", "주룩주룩 비가 와요"], ["🌈", "", "무지개!"]] },
      { name: "나비", s3: [0, 1, 2], steps: [["🐛", "🍃", "애벌레가 냠냠 잎을 먹어요"], ["cocoon", "", "번데기가 되었어요"], ["🦋", "", "나비가 되었어요"], ["🌸", "🦋", "나비가 꽃으로 훨훨 날아가요"]] }, // 4번은 꽃이 크게(3번 나비와 헷갈리지 않게)
      { name: "케이크", s3: [0, 1, 2], steps: [["🥚", "🥛", "달걀이랑 우유를 준비해요"], ["🥣", "", "반죽을 휘휘 섞어요"], ["🎂", "", "케이크가 완성됐어요"], ["😋", "🍰", "냠냠 맛있게 먹어요"]] },
      { name: "아침", s3: [0, 1, 2], steps: [["😴", "", "쿨쿨 잠을 자요"], ["🧼", "🫧", "일어나서 세수해요"], ["👕", "", "옷을 입어요"], ["🎒", "", "유치원에 가요"]] },
      { name: "눈사람", s3: [0, 1, 2], steps: [["❄️", "", "오늘은 하얀 눈이 펑펑 와요."], ["ball", "", "눈을 데굴데굴 굴려요"], ["⛄", "", "눈사람 완성"], ["💧", "☀️", "해님이 나와서 눈사람이 녹았어요", "melt"]] },
      // 1단계 쉬운 이야기 늘림(4 → 8): 사과·로켓·밥·생일 — 말은 모두 이미 있는 자연 음성 문장
      { name: "로켓", easy: 1, s3: [0, 1, 3], steps: [["🚀", "", "출발 준비!", "s2"], ["🚀", "🔥", "출발!"], ["🚀", "⭐", "로켓은 우주로 슝"], ["🌙", "🚀", "달에 도착!"]] },
      { name: "밥", easy: 1, no4: 1, s3: [0, 1, 2], steps: [["🤤", "🍙", "배고파요!"], ["😋", "🍙", "냠냠 맛있게 먹어요"], ["🍽️", "", "배불러요!"]] },
      { name: "생일", easy: 1, no4: 1, s3: [0, 1, 2], steps: [["🎂", "", "생일!"], ["🎂", "🎵", "생일 축하합니다"], ["😋", "🍰", "냠냠 맛있게 먹어요"]] },
      { name: "사과", easy: 1, s3: [0, 1, 2], steps: [["🌸", "", "꽃이 활짝 피었어요"], ["🍏", "", "초록 사과!"], ["🍎", "", "빨갛게 익었어요"], ["😋", "🍎", "아삭아삭 맛있어요"]] },
    ];
    ctx.wrap = U.el("div", "sqWrap");
    ctx.row = U.el("div", "sqRow");
    ctx.tray = U.el("div", "sqTray");
    ctx.wrap.append(ctx.row, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
    addEventListener("resize", () => ctx._active && ctx.tray && (ctx.tray.style.minHeight = "")); // 화면을 돌리면 고정 높이 풀기 (놀이 중일 때만, dotdot 과 같은 방식)
  },
  start(ctx) {
    ctx.round = 0;
    ctx.last = null;
    this.next(ctx);
  },
  art(step) {
    const [main, sub, , mod] = step;
    let m;
    if (main === "cocoon") m = '<span class="sqMain"><span class="sqLeaf">' + KP.E("🍃") + '</span><span class="sqCocoon"></span></span>';
    else if (main === "ball") m = '<span class="sqMain"><span class="sqBall"></span></span>';
    else m = '<span class="sqMain ' + (mod || "") + '">' + KP.E(main) + "</span>";
    return m + (sub ? '<span class="sqSub">' + KP.E(sub) + "</span>" : "");
  },
  speak(ctx, text) {
    return new Promise((res) => {
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        res();
      };
      KP.voice.say(text, { onend: fin });
      ctx.after(Math.max(1300, text.length * 210), fin);
    });
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const n = lv === 3 ? 4 : 3;
    // no4: 3장면뿐인 이야기(3단계 4장 놓기에는 안 나옴)
    let pool = ctx.STORIES.filter((s) => (lv === 1 ? s.easy : true) && !(n === 4 && s.no4) && s !== ctx.last);
    const story = U.pick(pool);
    ctx.last = story;
    const steps = n === 4 ? story.steps : story.s3.map((i) => story.steps[i]);
    const pre = 0; // 1단계도 3장 모두 직접 (첫 장면을 놓아 주면 2장 중 고르기라 찍어도 반) — 1단계는 쉬운 이야기만

    ctx.wrap.classList.toggle("n4", n === 4);
    ctx.row.innerHTML = "";
    ctx.tray.innerHTML = "";
    ctx.say(pre ? "다음엔 무슨 일이 생길까? 그림을 순서대로 놓아요!" : (n === 4 ? "어떤 순서로 일어났을까? 1부터 4까지 차례로 놓아요!" : "어떤 순서로 일어났을까? 1, 2, 3 순서대로 놓아요!"));

    const slots = steps.map((s, i) => {
      if (i) ctx.row.appendChild(U.el("span", "sqArrow", "▶"));
      const sl = U.el("div", "sqSlot slot", '<span class="sqNum">' + (i + 1) + '</span><span class="sqTag">' + (i + 1) + "</span>");
      sl.dataset.i = i;
      ctx.row.appendChild(sl);
      return sl;
    });
    const cards = steps.map((s, i) => {
      const c = U.el("div", "sqCard", this.art(s));
      c.dataset.i = i;
      return c;
    });
    // 2단계: 다른 이야기의 그림 1장(남는 카드) — 어디에도 안 들어감
    let odd = null;
    if (lv === 2) {
      const mains = new Set(story.steps.map((s) => s[0]));
      const others = ctx.STORIES.filter((s) => s !== story).flatMap((s) => s.steps).filter((s) => !mains.has(s[0]) && s[0] !== "cocoon" && s[0] !== "ball" && !s[3]);
      const os = U.pick(others);
      odd = U.el("div", "sqCard", this.art(os));
      odd.dataset.i = -1;
    }
    let left = n - pre;
    for (let i = 0; i < pre; i++) {
      slots[i].appendChild(cards[i]);
      slots[i].classList.add("filled");
    }
    U.shuffle(cards.slice(pre).concat(odd ? [odd] : [])).forEach((c, k) => {
      c.classList.add("item");
      c.style.setProperty("--i", k);
      ctx.tray.appendChild(c);
      const i = +c.dataset.i;
      const d = KP.drag(c, {
        targets: () => slots.filter((s) => !s.classList.contains("filled")),
        accept: (t) => i >= 0 && +t.dataset.i === i,
        onReject: (t) => {
          if (i < 0) return ctx.miss(t, "다른 그림을 찾아볼까?"); // 이 이야기 그림이 아님
          ctx.miss(t, +t.dataset.i < i ? "음, 이건 조금 나중 일이에요. 다른 그림을 찾아볼까?" : "이건 조금 먼저 일어난 일이에요. 다시 생각해 볼까?");
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          c.style.transform = "";
          c.classList.remove("item");
          t.appendChild(c);
          t.classList.add("filled");
          KP.audio.sfx("snap");
          KP.voice.say(steps[i][2]);
          left--;
          if (left === 0) finish();
          else hint();
        },
      });
    });
    // 힌트 2단계: 첫 힌트(8초)는 안내를 다시 들려주고 다음 빈칸만 흔들기(정답 카드는 안 가리킴) →
    // 두 번째부터 정답 카드를 가리킴({answer:true} — 가리킨 판은 열쇠 별 없음, 기다렸다 끌기 방지)
    // 쟁반 높이 고정: 카드가 2줄(3+1)→1줄로 줄면 space-evenly 가 위 칸 줄을 약 70px 옮겼음(태블릿 세로 3단계)
    ctx.tray.style.minHeight = "";
    ctx.tray.style.minHeight = ctx.tray.offsetHeight + "px";
    let hk = 0;
    const hint = () => {
      const s = slots.find((x) => !x.classList.contains("filled"));
      const c = cards[+s.dataset.i];
      const k = ++hk;
      const say2 = U.NAT[+s.dataset.i + 1] + "! 그림을 순서대로 놓아요!"; // "하나! 그림을 순서대로 놓아요!"(자연 음성)
      ctx.hint(() => {
        if (k !== hk || tok !== ctx.token || s.classList.contains("filled")) return null;
        U.replay(s, "wig");
        ctx.after(3400, () => {
          if (k === hk && tok === ctx.token && !s.classList.contains("filled")) ctx.hint(() => c, say2, { answer: true });
        });
        return s;
      }, ctx.instr || say2);
    };
    hint();
    const finish = async () => {
      ctx.hint(null);
      if (odd) {
        odd.style.transition = "opacity .4s, transform .4s";
        odd.style.opacity = "0";
        odd.style.transform = "scale(.6)";
        odd.style.pointerEvents = "none";
      }
      await ctx.wait(500);
      if (tok !== ctx.token) return;
      // 차례로 반짝이며 이야기 들려주기
      for (let i = 0; i < n; i++) {
        if (tok !== ctx.token || !ctx._active) return;
        const c = cards[i];
        U.replay(c, "shine");
        c.classList.add("done");
        KP.audio.note(KP.audio.SCALE[Math.min(i * 2, KP.audio.SCALE.length - 1)], { inst: "bell", dur: 0.5, vol: 0.22 });
        await this.speak(ctx, steps[i][2]);
      }
      if (tok !== ctx.token) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 이야기 박사!" : "순서대로 척척!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});

;

/* ==== js/games/bigkid/sort.js ==== */
/* 분류하기 — 물건을 끌어서 알맞은 바구니에 나눠 담기
   1단계: 바구니 2개, 물건 4개
   2단계: 바구니 2개, 물건 6개
   3단계: 바구니 3개, 물건 9개
   판마다 주제가 바뀜(동물/과일, 바다/하늘, 빨강/파랑, 큰 것/작은 것, 탈것/먹을 것, 낮/밤 …, 3단계는 6가지)
   안내 말: 통째 문장에 자연 음성이 없으면 "물건을 끌어서 알맞은 바구니에 넣어요! 동물! 과일! 탈것!"(바구니가 차례로 통통)
   바구니 위 그림 라벨 + 바구니를 누르면 이름을 말해 줌 */
"use strict";
KP.game({
  id: "sort",
  icon: "🗂️",
  name: "분류하기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sort", `
      .soWrap{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:4px 12px 12px;gap:8px}
      .soItems{flex:1;min-height:0;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:clamp(8px,1.6vw,18px)}
      .soItem{width:var(--is,110px);height:var(--is,110px);display:flex;align-items:center;justify-content:center;font-size:calc(var(--is,110px)*.74);line-height:1;border-radius:26px;background:rgba(255,255,255,.8);box-shadow:0 6px 0 rgba(47,58,102,.12);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*60ms)}
      .soItem.small .e{transform:scale(.55)}
      .soItem.big .e{transform:scale(1.18)}
      .soBaskets{display:flex;justify-content:center;gap:clamp(10px,2.4vw,30px);flex:0 0 auto}
      .soBasket{flex:1 1 0;max-width:340px;min-width:0;display:flex;flex-direction:column;align-items:center;cursor:pointer}
      .soLabel{display:flex;align-items:center;gap:6px;background:#fff;border-radius:999px;padding:4px 14px 4px 6px;box-shadow:0 4px 0 rgba(47,58,102,.12);font-size:clamp(17px,2.4vw,23px);margin-bottom:-12px;position:relative;z-index:2;white-space:nowrap;max-width:100%}
      .soLabel .e{font-size:clamp(34px,4.6vw,48px)}
      .soLabel span{overflow:hidden;text-overflow:ellipsis}
      .soBin{width:100%;height:var(--bh,150px);border-radius:18px 18px 46px 46px;background:repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 10px,transparent 10px 22px),linear-gradient(180deg,var(--bc,#e9a85a),color-mix(in srgb,var(--bc,#e9a85a) 70%,#5a3200));box-shadow:inset 0 10px 0 rgba(255,255,255,.25),0 8px 0 color-mix(in srgb,var(--bc,#e9a85a) 55%,#3a2000);display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;padding:22px 8px 12px;gap:2px;overflow:hidden}
      .soBin .soIn{font-size:var(--inS,44px);line-height:1;animation:popIn .3s;margin:-2px}
      .soBin .soIn.small .e{transform:scale(.6)}
      .soBasket.dropHover{outline:none}
      .soBasket.dropHover .soBin{transform:scale(1.05);filter:brightness(1.08)}
      .soBasket.bigB .soBin{height:calc(var(--bh,150px)*1.12)}
      .soBasket.smallB .soBin{height:calc(var(--bh,150px)*.8);max-width:72%;margin:0 auto}
    `);
    ctx.wrap = U.el("div", "soWrap");
    ctx.items = U.el("div", "soItems");
    ctx.baskets = U.el("div", "soBaskets");
    ctx.wrap.append(ctx.items, ctx.baskets);
    ctx.body.appendChild(ctx.wrap);

    // 주제: 바구니 [라벨 그림, 이름, 바구니 색, [물건들]]
    const B = {
      animal: ["🐾", "동물", "#e9a85a", [["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰"], ["🐼", "판다"], ["🐸", "개구리"], ["🦁", "사자"]]],
      fruit: ["🍎", "과일", "#ef7f6a", [["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"], ["🍑", "복숭아"], ["🍒", "체리"], ["🍊", "귤"]]],
      ride: ["🚦", "탈것", "#7aa7e9", [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚜", "트랙터"], ["🚲", "자전거"], ["🚂", "기차"], ["🚓", "경찰차"]]],
      sea: ["🌊", "바다", "#4aa3df", [["🐳", "고래"], ["🐙", "문어"], ["🦀", "꽃게"], ["🐠", "열대어"], ["🐬", "돌고래"], ["🦈", "상어"], ["🐚", "조개"]]],
      sky: ["☁️", "하늘", "#8fc9f2", [["✈️", "비행기"], ["🚁", "헬리콥터"], ["🎈", "풍선"], ["🦋", "나비"], ["🚀", "로켓"], ["🐦", "새"], ["🪁", "연"]]],
      land: ["🌳", "땅", "#8bc34a", [["🐘", "코끼리"], ["🚗", "자동차"], ["🐄", "소"], ["🦒", "기린"], ["🐢", "거북이"], ["🚜", "트랙터"], ["🐕", "개"]]],
      red: ["🔴", "빨강", "#ef5350", [["🍎", "사과"], ["🍓", "딸기"], ["🚒", "소방차"], ["❤️", "하트"], ["🍒", "체리"], ["🌹", "장미"], ["🍅", "토마토"]]],
      blue: ["🔵", "파랑", "#42a5f5", [["🐳", "고래"], ["💙", "파란 하트"], ["🫐", "블루베리"], ["👖", "청바지"], ["🧢", "모자"], ["🦋", "나비"], ["🧊", "얼음"]]],
      yellow: ["🟡", "노랑", "#fdd835", [["🍌", "바나나"], ["🐥", "병아리"], ["🌻", "해바라기"], ["⭐", "별"], ["🍋", "레몬"], ["🌽", "옥수수"], ["🧀", "치즈"]]],
      day: ["☀️", "낮", "#ffb74d", [["🌻", "해바라기"], ["🌈", "무지개"], ["🕶️", "선글라스"], ["🦋", "나비"], ["⛱️", "파라솔"], ["🐓", "닭"]]],
      night: ["🌙", "밤", "#5c6bc0", [["⭐", "별"], ["🦉", "부엉이"], ["🌃", "밤하늘"], ["🛏️", "침대"], ["🔦", "손전등"], ["🦇", "박쥐"]]],
      green: ["🟢", "초록", "#66bb6a", [["🥦", "브로콜리"], ["🐸", "개구리"], ["🥒", "오이"], ["🍏", "초록 사과"], ["🦖", "공룡"], ["🍃", "나뭇잎"]]],
      food: ["🍽️", "먹을 것", "#ffa726", [["🍞", "빵"], ["🍙", "주먹밥"], ["🍕", "피자"], ["🍦", "아이스크림"], ["🥕", "당근"], ["🍪", "쿠키"], ["🧁", "컵케이크"]]],
    };
    ctx.B = B;
    // 2개짜리 주제, 3개짜리 주제
    ctx.THEMES2 = [["animal", "fruit"], ["sea", "sky"], ["red", "blue"], ["ride", "food"], ["day", "night"], ["SIZE"]];
    ctx.THEMES3 = [["animal", "fruit", "ride"], ["sea", "sky", "land"], ["red", "blue", "yellow"], ["red", "yellow", "green"], ["animal", "food", "ride"], ["fruit", "ride", "sea"]];
    ctx.PHRASE = { red: "빨간 건", blue: "파란 건", yellow: "노란 건", green: "초록색인 건", day: "낮에 보는 건", night: "밤에 보는 건", sea: "바다에 사는 건", sky: "하늘에 뜨는 건", land: "땅에 있는 건", food: "먹는 건" };
    ctx.SIZE_THINGS = [["🍎", "사과"], ["⚽", "공"], ["🐶", "강아지"], ["🎈", "풍선"], ["🍓", "딸기"], ["🐟", "물고기"], ["🌼", "꽃"], ["🚗", "자동차"]];

    ctx.soSize = () => {
      const n = ctx.items.children.length || 4;
      const W = ctx.body.clientWidth - 24,
        H = ctx.body.clientHeight;
      const bh = U.clamp(H * 0.24, 96, 170);
      ctx.baskets.style.setProperty("--bh", bh + "px");
      const availH = H - bh - 70;
      // 물건이 다 보이게 크기 정하기
      let best = 60;
      for (let cols = 1; cols <= n; cols++) {
        const rows = Math.ceil(n / cols);
        const s = Math.min((W - cols * 14) / cols, (availH - rows * 14) / rows);
        if (s > best) best = s;
      }
      ctx.items.style.setProperty("--is", Math.floor(U.clamp(best, 72, 150)) + "px");
      // 바구니 안 그림 크기: 바구니 폭에 맞춰 (3개가 두 줄 안에 들어가게)
      const bw = ctx.baskets.firstElementChild ? ctx.baskets.firstElementChild.clientWidth : 200;
      ctx.baskets.style.setProperty("--inS", Math.floor(Math.min(bh * 0.32, (bw - 20) / 2.3)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.soSize());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.themeIdx = { 2: KP.u.rand(ctx.THEMES2.length), 3: KP.u.rand(ctx.THEMES3.length) };
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const nat = (t) => !!(KP.voice._natUrls && KP.voice._natUrls(t));
    const lv = ctx.level;
    const nb = lv === 3 ? 3 : 2;
    const perB = [2, 3, 3][lv - 1];
    // 3단계는 바구니마다 2·2·3개(섞어서) = 7개 — 9개는 아이에게 1~2분이라 길었음
    const perBin = lv === 3 ? U.shuffle([2, 2, 3]) : null;
    const list = nb === 3 ? ctx.THEMES3 : ctx.THEMES2;
    ctx.themeIdx[nb] = (ctx.themeIdx[nb] + 1) % list.length;
    const theme = list[ctx.themeIdx[nb]];
    // 바구니 정보와 물건 만들기
    let bins, things;
    if (theme[0] === "SIZE") {
      bins = [
        { key: "big", label: "⭐", name: "큰 것", color: "#e9a85a", cls: "bigB", lab: "big" },
        { key: "small", label: "⭐", name: "작은 것", color: "#9ccc65", cls: "smallB", lab: "small" },
      ];
      const picks = U.sample(ctx.SIZE_THINGS, perB);
      things = U.shuffle([...picks.map(([em, name]) => ({ em, name: "큰 " + name, key: "big", cls: "big" })), ...U.shuffle(picks).map(([em, name]) => ({ em, name: "작은 " + name, key: "small", cls: "small" }))]);
    } else {
      const used = new Set();
      bins = theme.map((k) => ({ key: k, label: ctx.B[k][0], name: ctx.B[k][1], color: ctx.B[k][2] }));
      things = [];
      theme.forEach((k, bi) => {
        const pool = ctx.B[k][3].filter(([em]) => !used.has(em) && !theme.some((o) => o !== k && ctx.B[o][3].some(([e2]) => e2 === em)));
        U.sample(pool, perBin ? perBin[bi] : perB).forEach(([em, name]) => {
          used.add(em);
          things.push({ em, name, key: k });
        });
      });
      things = U.shuffle(things);
    }
    ctx.bins = bins;
    // 화면
    ctx.items.innerHTML = "";
    ctx.baskets.innerHTML = "";
    const binEls = bins.map((b) => {
      const el = U.el("div", "soBasket " + (b.cls || ""));
      const lab = U.el("div", "soLabel", KP.E(b.label) + "<span>" + b.name + "</span>");
      if (b.lab === "small") lab.querySelector(".e").style.transform = "scale(.6)";
      if (b.lab === "big") lab.querySelector(".e").style.transform = "scale(1.15)";
      const bin = U.el("div", "soBin");
      bin.style.setProperty("--bc", b.color);
      el.append(lab, bin);
      el.dataset.key = b.key;
      ctx.tap(el, () => {
        A.sfx("tap");
        U.replay(el, "jump");
        KP.voice.say(b.name + "!");
      });
      ctx.baskets.appendChild(el);
      return el;
    });
    let left = things.length;
    const els = things.map((t, i) => {
      const el = U.el("div", "soItem " + (t.cls || ""), KP.E(t.em));
      el.style.setProperty("--i", i);
      el.dataset.key = t.key;
      ctx.items.appendChild(el);
      const d = KP.drag(el, {
        targets: () => binEls,
        accept: (b) => b.dataset.key === t.key,
        pad: 16,
        snap: false,
        onPick: () => KP.voice.say(t.name),
        onReject: (b) => {
          const bn = bins.find((x) => x.key === b.dataset.key).name;
          // "강아지는 과일이 아니에요…" 에 자연 음성이 없으면 "강아지! 다른 바구니일까?"
          const full = U.josa(t.name, "은/는") + " " + U.josa(bn, "이/가") + " 아니에요. 다른 바구니일까?";
          ctx.miss(b, U.pick([nat(full) ? full : t.name + "! 다른 바구니일까?", "음, 다른 바구니에 넣어 볼까요?"]));
        },
        onDrop: (b) => {
          if (!b) return;
          d.lock();
          el.remove();
          const inn = U.el("span", "soIn " + (t.cls || ""), KP.E(t.em));
          b.querySelector(".soBin").appendChild(inn);
          U.replay(b, "jump");
          A.sfx("drop");
          A.note(A.SCALE[Math.min(A.SCALE.length - 1, things.length - left)], { inst: "marimba", dur: 0.3, vol: 0.25 });
          left--;
          if (left === 0) done();
          else setHint();
        },
      });
      return el;
    });
    ctx.soSize();
    // 두 번째 힌트부터는 손가락이 알맞은 바구니까지 움직여 보여 줌(KP.drag 공용 기능)
    const setHint = () => {
      const first = els.find((e) => e.isConnected);
      ctx.hint(() => first, "물건을 끌어서 알맞은 바구니에 넣어요!");
    };
    setHint();
    const line = theme[0] === "SIZE" ? "큰 것은 큰 바구니, 작은 것은 작은 바구니에 넣어요!" : bins.map((b) => (ctx.PHRASE[b.key] || U.josa(b.name, "은/는")) + " " + b.name + " 바구니").join(", ") + "에 넣어요!";
    if (nat(line)) ctx.say(line);
    else {
      // 통째 문장 음성이 없으면(3바구니 등): 공용 문장 + 바구니 이름을 하나씩, 이름 부를 때 그 바구니가 통통
      ctx.say(line, "물건을 끌어서 알맞은 바구니에 넣어요! " + bins.map((b) => b.name + "!").join(" "));
      binEls.forEach((el, k) => ctx.after(2900 + k * 750, () => U.replay(el, "jump")));
    }
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      // 확인하기: 바구니를 하나씩 통통 — 바구니 이름을 말하고 담긴 것이 톡톡 (복습)
      ctx.hint(null);
      const tk0 = ctx.round;
      for (let k = 0; k < binEls.length; k++) {
        if (!ctx._active || tk0 !== ctx.round) return;
        const b = binEls[k];
        U.replay(b, "jump");
        b.querySelectorAll(".soIn").forEach((e, j) => ctx.after(j * 120, () => U.replay(e, "pop")));
        A.note(A.SCALE[Math.min(A.SCALE.length - 1, k * 2)], { inst: "bell", dur: 0.4, vol: 0.2 });
        if (theme[0] !== "SIZE") KP.voice.say(bins[k].name + "!");
        await ctx.wait(850);
      }
      if (!ctx._active || tk0 !== ctx.round) return;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 정리 대장!" : "다 나눴어요!" });
      if (ok) this.next(ctx);
    };
  },
});

;

/* ==== js/games/bigkid/sorter.js ==== */
/* 모양 끼우기 — 모양 조각을 끌어다 같은 모양 구멍에 쏙!
   1단계: 3개 / 2단계: 4개 / 3단계: 5개 (구멍 위치도 섞임)
   - 2·3단계는 세모·별·하트·달 구멍이 살짝 돌아가 있음(20~35도) → '모양은 같고 방향만 다름'. 넣으면 조각도 그 방향으로 쏙
   - 구멍은 조각보다 1개 많음(빈 구멍) → 마지막 조각도 생각해서 넣어야 함
   - 3단계에 같은 모양이 색만 달리 둘(🔴·🟣, 🟦·🟩) 나오면 구멍에 연한 본래 색을 보여 줌(실루엣만으로는 똑같아서) */
"use strict";
KP.game({
  id: "sorter",
  icon: "🔺",
  name: "모양 끼우기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sorter", `
      .srtBoard{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:6px 12px 14px}
      .srtBox{display:flex;gap:clamp(10px,2.4vw,26px);flex-wrap:wrap;justify-content:center;padding:clamp(14px,2.4vw,26px);border-radius:32px;background:linear-gradient(180deg,#ffcf7a,#f4a944);box-shadow:0 10px 0 #c97f22, inset 0 4px 0 rgba(255,255,255,.5)}
      .srtHole{width:clamp(84px,13vw,140px);height:clamp(84px,13vw,140px);border-radius:24px;background:rgba(120,60,0,.18);box-shadow:inset 0 6px 10px rgba(80,40,0,.35);display:flex;align-items:center;justify-content:center;font-size:clamp(60px,9.5vw,104px);position:relative}
      .srtHole .ghost{filter:brightness(0) opacity(.35)}
      /* 색 구멍(3단계): 흰 동그라미 위에 본래 색을 진하게 — 주황 상자 위에 반투명으로 겹치면 보라가 갈색·파랑이 회색처럼 보였음 */
      .srtBox.tint .srtHole::before{content:"";position:absolute;inset:9%;border-radius:50%;background:rgba(255,255,255,.88);box-shadow:inset 0 3px 6px rgba(80,40,0,.18)}
      .srtBox.tint .srtHole .ghost{filter:opacity(.8);position:relative}
      .srtBox.tint .srtHole.filled::before{display:none}
      /* 🔺 그림은 여백이 커서 다른 모양의 절반처럼 보임 → 그림만 키움(끄는 상자 크기는 그대로) */
      [data-k="🔺"] .e{transform:scale(1.7)}
      .srtHole.filled .ghost{display:none}
      .srtTray{display:flex;gap:clamp(12px,2.6vw,30px);flex-wrap:wrap;justify-content:center;min-height:clamp(96px,14vw,150px);align-items:center}
      .srtPiece{font-size:clamp(60px,9.5vw,104px);line-height:1;padding:8px;filter:drop-shadow(0 6px 0 rgba(0,0,0,.15))}
      .srtHole .srtPiece{position:absolute;padding:0;filter:none;animation:popIn .3s}
      .srtHole .ghost{display:inline-block;transform:rotate(var(--rot,0deg))}
      /* 폰 가로처럼 낮은 화면: 빈 구멍까지 6개가 한 줄에 들어가게 */
      @media (max-height:520px) and (orientation:landscape){.srtHole{width:min(12vw,23vh);height:min(12vw,23vh);font-size:min(8.6vw,16vh)}.srtPiece{font-size:min(8.6vw,16vh)}.srtTray{min-height:0}}
    `);
    ctx.SHAPES = [
      ["🔴", "동그라미"], ["🟦", "네모"], ["🔺", "세모"], ["⭐", "별"], ["❤️", "하트"], ["🌙", "달"], ["🔶", "마름모"], ["🟩", "초록 네모"], ["🟣", "보라 동그라미"],
    ];
    // 같은 모양 계열 (색만 다름)
    ctx.FAMILY = { "🟣": "🔴", "🟩": "🟦" };
    ctx.boardEl = U.el("div", "srtBoard");
    ctx.box = U.el("div", "srtBox");
    ctx.tray = U.el("div", "srtTray");
    ctx.boardEl.append(ctx.box, ctx.tray);
    ctx.body.appendChild(ctx.boardEl);
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastLine = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 5][lv - 1];
    // 같은 계열(네모 두 개 등)은 3단계에서만 같이 나오게
    const pool = lv < 3 ? ctx.SHAPES.slice(0, 7) : ctx.SHAPES;
    const pick = U.sample(pool, n);
    // 같은 모양이 색만 달리 두 개 있으면(🔴·🟣, 🟦·🟩) 검은 실루엣으로는 구별이 안 됨 → 이 판은 구멍에 본래 색을 연하게
    const fam = (em) => ctx.FAMILY[em] || em;
    const famCount = {};
    pick.forEach(([em]) => (famCount[fam(em)] = (famCount[fam(em)] || 0) + 1));
    const tint = Object.values(famCount).some((c) => c > 1);
    // 빈 구멍 1개(맞는 조각 없음) — 마지막 조각이 저절로 맞는 '소거'를 막음. 실루엣이 같은 계열은 빼고
    const decoyPool = pool.filter(([em]) => !pick.some(([e]) => e === em) && (tint || !famCount[fam(em)]));
    const decoy = decoyPool.length ? U.pick(decoyPool) : null;
    // 안내: 첫 판은 자세히, 그다음은 짧은 말을 돌아가며 (늘 같은 한 문장이면 금방 질림)
    const lines = ["모양 조각을 끌어서 같은 모양 구멍에 쏙 넣어 봐요!", "모양을 끌어서 같은 구멍에 넣어요!", "모양을 찾아요!"];
    let line = ctx.round === 0 ? lines[0] : U.pick(lines.filter((l) => l !== ctx.lastLine));
    ctx.lastLine = line;
    if (tint) line = "모양도 색도 잘 봐요! " + line;
    ctx.say(line);
    ctx.box.innerHTML = "";
    ctx.tray.innerHTML = "";
    ctx.box.classList.toggle("tint", tint);
    const holes = U.shuffle(decoy ? [...pick, decoy] : [...pick]).map(([em]) => {
      const h = U.el("div", "srtHole", '<span class="ghost">' + KP.E(em) + "</span>");
      h.dataset.k = em;
      // 방향 바꾼 구멍 (2·3단계, 판마다 0~2개)
      if (lv >= 2 && "🔺⭐❤️🌙".includes(em) && Math.random() < 0.6) {
        const r = (U.pick([-1, 1]) * (20 + U.rand(16))).toFixed(0) + "deg";
        h.style.setProperty("--rot", r);
        h.dataset.rot = r;
      }
      ctx.box.appendChild(h);
      return h;
    });
    let left = n;
    const pieces = U.shuffle([...pick]).map(([em, name], i) => {
      const p = U.el("div", "srtPiece item", KP.E(em));
      p.style.setProperty("--i", i);
      p.dataset.k = em;
      ctx.tray.appendChild(p);
      const d = KP.drag(p, {
        targets: () => holes.filter((h) => !h.classList.contains("filled")),
        accept: (t) => t.dataset.k === em,
        onReject: (t) => ctx.miss(t, "이 모양이 아니에요. 다른 구멍을 찾아봐요!"),
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          p.style.transform = t.dataset.rot ? "rotate(" + t.dataset.rot + ")" : "";
          t.appendChild(p);
          t.classList.add("filled");
          A.sfx("snap");
          // 하나 끼울 때마다 도-레-미 계단 소리
          A.note(A.SCALE[Math.min(A.SCALE.length - 1, n - left)], { inst: "marimba", dur: 0.3, vol: 0.24 });
          U.replay(t, "pop");
          KP.voice.say(name + "!");
          left--;
          if (left === 0) {
            U.replay(ctx.box, "jump");
            done();
          } else hint();
        },
      });
      return p;
    });
    // 두 번째 힌트부터는 손가락이 맞는 구멍까지 움직여 보여 줌(KP.drag 공용 기능)
    const hint = () => {
      const p = pieces.find((x) => !x.parentElement.classList.contains("srtHole"));
      ctx.hint(() => p, "모양을 끌어서 같은 구멍에 넣어요!");
    };
    hint();
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 모양 박사!" : U.pick(["다 끼웠다!", "딱 맞아요!", "잘했어요!"]) });
      if (ok) this.next(ctx);
    };
  },
});

;

/* ==== js/games/bigkid/spatial.js ==== */
/* 위·아래·안·밖 — "고양이를 상자 위에 올려 줘!" 공간 말 듣고 끌어다 놓기
   1단계: 위 · 안 (상자) — 한 판에 친구 2명
   2단계: + 아래 · 옆 (상자 · 책상 · 침대) — 친구 2~3명
   3단계: + 앞 · 뒤 (멀리 = 화면 위쪽, 가까이 = 화면 아래쪽) — 친구 3명
   놓은 친구는 장면에 그대로 남아 판 끝에는 '고양이는 위, 강아지는 안' 장면이 완성된다.
   말은 자연 음성 조각으로: "고양이를"+"상자"+"위에 올려 줘!", 맞으면 "고양이가 상자 위!", 틀리면 "거기는 상자 안!"
   놓인 자리를 넉넉하게 판정하고, 틀리면 "거기는 옆이에요" 하고 알려 준다. */
"use strict";
KP.game({
  id: "spatial",
  icon: "📦",
  name: "위·아래·안·밖",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("spatial", `
      .spWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 10px 10px;gap:6px}
      .spBox0{flex:1;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center}
      .spScene{width:min(100cqw,133cqh);aspect-ratio:4/3;container-type:size;position:relative;border-radius:26px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#bfe8ff 0,#e6f6ff 52%,#c9e9a5 52.2%,#a8d987 100%)}
      @media (orientation:portrait){.spScene{width:min(100cqw,100cqh);aspect-ratio:1}}
      .spScene.indoor{background:linear-gradient(180deg,#fff1d6 0,#ffe7c2 52%,#e9c49a 52.2%,#d9ad7c 100%)}
      .spScene.indoor:before{content:"";position:absolute;left:8%;top:10%;width:18cqw;height:14cqw;border-radius:10px;background:linear-gradient(#bfe8ff,#e6f6ff);box-shadow:inset 0 0 0 1.2cqw #fff,0 4px 0 rgba(0,0,0,.08)}
      .spSun{position:absolute;right:6%;top:6%;font-size:11cqw;line-height:1}
      .spScene.beach{background:linear-gradient(180deg,#9fdcff 0,#d6f1ff 38%,#4fb3e8 38.2%,#7fcdf0 52%,#f6e3a6 52.2%,#eccf85 100%)}
      .spShell{position:absolute;left:8%;bottom:6%;font-size:8cqw;line-height:1;transform:rotate(-14deg)}
      .spScene.bedroom{background:linear-gradient(180deg,#e7dcff 0,#d9ccff 52%,#c99c78 52.2%,#b98a66 100%)}
      .spScene.bedroom:before{content:"";position:absolute;left:8%;top:10%;width:18cqw;height:14cqw;border-radius:10px;background:linear-gradient(#2c3e7a,#4b5fa8);box-shadow:inset 0 0 0 1.2cqw #fff,0 4px 0 rgba(0,0,0,.08)}
      .spMoon{position:absolute;left:13%;top:12.5%;font-size:8cqw;line-height:1;z-index:1}
      /* 침대 */
      .spBed{width:56cqw;height:24cqw}
      .spBed .mat{position:absolute;left:0;right:0;top:0;height:6cqw;background:linear-gradient(#ffffff,#e9eef8);border-radius:2cqw 2cqw .6cqw .6cqw;z-index:3;box-shadow:0 .8cqw 0 rgba(0,0,0,.1)}
      .spBed .blanket{position:absolute;left:30%;right:-.6cqw;top:1.2cqw;height:6.6cqw;background:repeating-linear-gradient(90deg,#7cc7ff 0 3cqw,#a5d8ff 3cqw 6cqw);border-radius:1.4cqw;z-index:4}
      .spBed.b2 .blanket{background:repeating-linear-gradient(90deg,#ff9fbf 0 3cqw,#ffc2d6 3cqw 6cqw)}
      .spBed .pillow{position:absolute;left:3cqw;top:-2.2cqw;width:12cqw;height:4.4cqw;background:#fff;border-radius:2.2cqw;box-shadow:inset 0 -.6cqw 0 rgba(0,0,0,.08);z-index:4}
      .spBed .head{position:absolute;left:-2cqw;top:-9cqw;bottom:0;width:3.2cqw;background:linear-gradient(90deg,#b0743f,#93582a);border-radius:1.6cqw 1.6cqw .6cqw .6cqw;z-index:2}
      .spBed .foot{position:absolute;right:-2cqw;top:-3cqw;bottom:0;width:3cqw;background:linear-gradient(90deg,#b0743f,#93582a);border-radius:1.4cqw 1.4cqw .6cqw .6cqw;z-index:5}
      .spBed .leg{position:absolute;top:5cqw;bottom:0;width:2.6cqw;background:#93582a;z-index:3}
      .spBed .leg.l{left:2.4cqw}.spBed .leg.r{right:2.4cqw}
      .spBed .spPut.r-위{bottom:calc(100% - 1.6cqw);z-index:6}
      .spBed .spPut.r-아래{font-size:16cqw}
      .spTable .spPut.r-옆L{right:calc(100% + .5cqw)}.spTable .spPut.r-옆R{left:calc(100% + .5cqw)}
      .spBed .spPut.r-옆L{right:calc(100% + 2.1cqw)}.spBed .spPut.r-옆R{left:calc(100% + 2.1cqw)}
      .spCloud{position:absolute;left:10%;top:8%;font-size:12cqw;line-height:1;opacity:.95}
      .spProp{position:absolute;left:50%;bottom:19cqh;transform:translateX(-50%);z-index:2}
      /* 상자 */
      .spCrate{width:38cqw;height:19cqw}
      .spCrate .back{position:absolute;left:0;right:0;top:-3.2cqw;height:3.4cqw;background:#a86a2c;border-radius:1cqw 1cqw 0 0;z-index:1}
      .spCrate .front{position:absolute;inset:0;background:linear-gradient(180deg,#e8a65a,#d48a3c);border-radius:.6cqw .6cqw 1.2cqw 1.2cqw;z-index:3;box-shadow:inset 0 -1cqw 0 rgba(0,0,0,.12)}
      .spCrate .front:after{content:"";position:absolute;left:44%;width:12%;top:0;bottom:0;background:rgba(255,255,255,.22)}
      .spCrate .flap{position:absolute;top:-1.2cqw;width:11cqw;height:3cqw;background:#f0b46c;z-index:4;border-radius:.6cqw}
      .spCrate .flap.l{left:-6.5cqw;transform:rotate(-24deg)}.spCrate .flap.r{right:-6.5cqw;transform:rotate(24deg)}
      .spCrate.c2 .front{background:linear-gradient(180deg,#7cc7ff,#4aa6ee)}.spCrate.c2 .back{background:#2f74b5}.spCrate.c2 .flap{background:#a5d8ff}
      .spCrate.c3 .front{background:linear-gradient(180deg,#ff9fbf,#f2709c)}.spCrate.c3 .back{background:#b8436b}.spCrate.c3 .flap{background:#ffc2d6}
      /* 책상 */
      .spTable{width:54cqw;height:28cqw}
      .spTable .top{position:absolute;left:-1cqw;right:-1cqw;top:0;height:3.2cqw;background:linear-gradient(#c98a4f,#a96a33);border-radius:1cqw;z-index:3;box-shadow:0 .8cqw 0 rgba(0,0,0,.12)}
      .spTable .leg{position:absolute;top:2cqw;bottom:0;width:3cqw;background:#9a5f2c;border-radius:0 0 .8cqw .8cqw;z-index:3}
      .spTable .leg.l{left:2cqw}.spTable .leg.r{right:2cqw}
      .spTable .leg.bl,.spTable .leg.br{z-index:0;top:1cqw;bottom:2.2cqw;background:#7e4c22}
      .spTable .leg.bl{left:6cqw}.spTable .leg.br{right:6cqw}
      .spShadow{position:absolute;left:4%;right:4%;bottom:-1.4cqw;height:2.8cqw;border-radius:50%;background:rgba(60,80,40,.22);z-index:0}
      /* 캐릭터 */
      .spChar{font-size:clamp(84px,12vw,124px);line-height:1;filter:drop-shadow(0 6px 0 rgba(0,0,0,.14))}
      .spTray{flex:0 0 auto;display:flex;justify-content:center;align-items:center;min-height:clamp(100px,14vw,140px)}
      .spPut{position:absolute;font-size:20cqw;line-height:1;animation:spPut .4s cubic-bezier(.2,1.5,.4,1);pointer-events:none}
      @keyframes spPut{from{transform:translate(var(--tx,-50%),12%) scale(.7)}}
      .spPut{--tx:-50%;transform:translateX(var(--tx))}
      .spPut.r-위{left:50%;bottom:100%;z-index:5}
      .spCrate .spPut.r-위{bottom:calc(100% - 1.4cqw)}
      .spPut.r-안{left:50%;bottom:8cqw;z-index:2}
      .spPut.r-아래{left:50%;bottom:-.4cqw;z-index:1}
      .spPut.r-옆L{left:auto;right:calc(100% + 4cqw);bottom:-.6cqw;--tx:0%}
      .spPut.r-옆R{left:calc(100% + 4cqw);bottom:-.6cqw;--tx:0%}
      .spPut.r-앞{left:50%;bottom:-10cqw;z-index:6;font-size:21cqw}
      .spPut.r-뒤{left:64%;bottom:13cqw;z-index:0;font-size:18cqw}
      .spGlow{position:absolute;inset:-2cqw;border-radius:3cqw;box-shadow:0 0 0 1cqw rgba(255,213,74,.9),0 0 5cqw 2cqw rgba(255,213,74,.7);animation:spGlow 1s ease-in-out 2;pointer-events:none;z-index:7;opacity:0}
      @keyframes spGlow{50%{opacity:1}}
      /* 폰 가로(높이 500 미만): 장면 | 친구 쟁반 을 옆으로 — 위아래로 쌓으면 장면이 작아짐 */
      @media (orientation:landscape) and (max-height:499px){.spWrap{flex-direction:row;padding:0 10px 8px;gap:10px}.spTray{min-height:0;min-width:clamp(120px,18vw,170px);background:rgba(255,255,255,.45);border-radius:26px}.spChar{font-size:clamp(84px,24vh,112px)}}
    `);
    // (판다는 "판다를" 자연 음성이 없어서 오리로)
    ctx.CHARS = [["🐱", "고양이"], ["🐶", "강아지"], ["🐰", "토끼"], ["🐥", "병아리"], ["🦆", "오리"], ["🧸", "곰 인형"], ["⚽", "공"], ["🐸", "개구리"]];
    // 관계 → 말
    ctx.REL = {
      위: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 위에 올려 줘!", got: "위" },
      안: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 안에 쏙 넣어 줘!", got: "안" },
      아래: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 아래에 놓아 줘!", got: "아래" },
      옆: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 옆에 놓아 줘!", got: "옆" },
      앞: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 앞에 놓아 줘!", got: "앞" },
      뒤: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 뒤에 숨겨 줘!", got: "뒤" },
    };
    ctx.wrap = U.el("div", "spWrap");
    ctx.box0 = U.el("div", "spBox0");
    ctx.scene = U.el("div", "spScene");
    ctx.box0.appendChild(ctx.scene);
    ctx.tray = U.el("div", "spTray");
    ctx.wrap.append(ctx.box0, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastKind = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const nat = (t) => !!(KP.voice._natUrls && KP.voice._natUrls(t));
    const lv = ctx.level;
    const tok = ++ctx.token;
    // 소품마다 할 수 있는 자리: 상자(위·안·옆) / 책상·침대(위·아래·옆) / 상자 앞뒤(앞·뒤·옆)
    // 1단계도 '옆'을 넣어 상자 위·안·옆 3가지 (예전엔 위·안 둘뿐이라 첫 친구는 찍어도 반)
    const levelRels = lv === 1 ? ["위", "안", "옆"] : lv === 2 ? ["위", "안", "아래", "옆"] : ["위", "안", "아래", "옆", "앞", "뒤"];
    const KINDS = { crate: ["위", "안", "옆"], table: ["위", "아래", "옆"], bed: ["위", "아래", "옆"], crateFB: ["앞", "뒤", "옆"] };
    let kinds = Object.keys(KINDS).filter((k) => KINDS[k].filter((r) => levelRels.includes(r)).length >= (lv === 1 ? 3 : 2)); // 1단계는 상자만(위·안·옆 3가지가 다 되는 소품)
    // 같은 소품이 연달아 나오지 않게, 3단계는 앞·뒤(새로 배우는 말)가 자주 나오게
    if (kinds.length > 1) kinds = kinds.filter((k) => k !== ctx.lastKind);
    if (lv === 3 && ctx.lastKind !== "crateFB" && Math.random() < 0.45) kinds = ["crateFB"];
    const kind = U.pick(kinds);
    ctx.lastKind = kind;
    const supports = KINDS[kind].filter((r) => levelRels.includes(r));
    // 한 판 = 친구 2~3명을 차례로 놓기 (끌기 1번이면 축하가 놀이보다 길어서)
    const nTask = Math.min(supports.length, lv === 1 ? 2 : lv === 2 ? U.pick([2, 3]) : 3);
    const tasks = U.sample(supports, nTask);
    const chars = U.sample(ctx.CHARS, nTask);
    const pName = kind === "table" ? "책상" : kind === "bed" ? "침대" : "상자";
    const flat = kind === "table" || kind === "bed";

    // 장면 (배경도 판마다 조금씩: 마당·바닷가 / 방·침실)
    const sc = ctx.scene;
    sc.innerHTML = "";
    const bg = kind === "table" ? "indoor" : kind === "bed" ? "bedroom" : U.pick(["", "beach"]);
    sc.className = "spScene item" + (bg ? " " + bg : "");
    if (bg === "") sc.append(U.el("div", "spSun", KP.E("☀️")), U.el("div", "spCloud", KP.E("☁️")));
    else if (bg === "beach") sc.append(U.el("div", "spSun", KP.E("☀️")), U.el("div", "spShell", KP.E("🐚")));
    else if (bg === "bedroom") sc.append(U.el("div", "spMoon", KP.E("🌙")));
    let prop;
    if (kind === "table") {
      prop = U.el("div", "spProp spTable", '<div class="spShadow"></div><div class="leg bl"></div><div class="leg br"></div><div class="top"></div><div class="leg l"></div><div class="leg r"></div>');
    } else if (kind === "bed") {
      prop = U.el("div", "spProp spBed " + U.pick(["", "b2"]), '<div class="spShadow"></div><div class="head"></div><div class="foot"></div><div class="mat"></div><div class="blanket"></div><div class="pillow"></div><div class="leg l"></div><div class="leg r"></div>');
    } else {
      prop = U.el("div", "spProp spCrate " + U.pick(["", "c2", "c3"]), '<div class="spShadow"></div><div class="back"></div><div class="front"></div><div class="flap l"></div><div class="flap r"></div>');
    }
    sc.appendChild(prop);

    /* 놓은 자리 판정 (화면 좌표) — 소품 모양 기준, 넉넉하게 */
    const classify = (x, y) => {
      const P = (flat ? prop : prop.querySelector(".front")).getBoundingClientRect();
      const S = sc.getBoundingClientRect();
      const c = S.width * 0.2; // 캐릭터 크기
      const inX = x >= P.left - c * 0.35 && x <= P.right + c * 0.35;
      const side = x < P.left - c * 0.1 ? "옆L" : x > P.right + c * 0.1 ? "옆R" : null;
      const res = [];
      if (y < P.top - c * 1.6) return { rel: null, side };
      if (flat) {
        if (inX && y < P.top + P.height * 0.2) res.push("위");
        if (x > P.left && x < P.right && y >= P.top + P.height * 0.2) res.push("아래");
      } else if (kind === "crateFB") {
        if (inX && y <= P.bottom - P.height * 0.08) res.push("뒤");
        if (inX && y > P.bottom - P.height * 0.08) res.push("앞");
      } else {
        if (inX && y < P.top + P.height * 0.12) res.push("위");
        if (x > P.left - c * 0.15 && x < P.right + c * 0.15 && y >= P.top + P.height * 0.12 && y < P.bottom + c * 0.3) res.push("안");
      }
      if (side && y > P.top - c * 0.6 && y < P.bottom + c * 0.8) res.push("옆");
      return { rel: res[0] || null, side };
    };

    // 친구 한 명씩: 쟁반에 나와서 → 말 듣고 → 끌어다 놓기
    const step = (k) => {
      if (tok !== ctx.token) return;
      const rel = tasks[k];
      const [cem, cname] = chars[k];
      ctx.tray.innerHTML = "";
      const ch = U.el("div", "spChar item", KP.E(cem));
      ctx.tray.appendChild(ch);
      const ask = ctx.REL[rel].ask(cname, pName);
      ctx.spCur = { rel, kind, k, n: tasks.length }; // 점검용(지금 할 일)
      ctx.say(ask);
      let last = null;
      const d = KP.drag(ch, {
        targets: () => [sc],
        pad: 0,
        snap: false,
        onMove: (x, y) => (last = { x, y }),
        onDrop: (t) => {
          if (tok !== ctx.token) return;
          if (!t) {
            KP.voice.say(ask);
            return;
          }
          const r = last ? classify(last.x, last.y) : { rel: null };
          if (r.rel === rel) {
            d.lock();
            put(k, ch, rel === "옆" ? r.side || "옆R" : rel);
          } else {
            d.home();
            // "거기는 상자 안이에요!" 에 자연 음성이 없으면 "거기는 상자 안!" (조각마다 자연 음성) + 다시 질문
            if (r.rel && supports.includes(r.rel)) {
              // 오답 말은 짧게 "거기는 상자 안!" 한 마디 → 1.6초 뒤 물음을 다시 (조각 5~7개를 한 번에 이어 붙이면 끊겨 들림)
              const full = "거기는 " + pName + " " + U.josa(r.rel, "이에요/예요") + "!";
              ctx.miss(ch, nat(full) ? full : "거기는 " + pName + " " + r.rel + "!");
              const k0 = ctx.spCur;
              ctx.after(1600, () => tok === ctx.token && ctx.spCur === k0 && ch.isConnected && ch.style.visibility !== "hidden" && KP.voice.say(ask, { queue: true }));
            } else if (!r.rel) ctx.miss(ch, ask, { soft: true }); // 하늘·풀밭 같은 빈 곳: 자리를 잘못 고른 게 아니라 단계·열쇠 별엔 안 셈
            else ctx.miss(ch, ask);
          }
        },
      });
      ctx.hint(() => ch, ask);
    };

    const put = async (k, ch, where) => {
      ctx.hint(null);
      const rel = tasks[k];
      const [cem, cname] = chars[k];
      ch.style.transition = "";
      ch.style.transform = "";
      ch.style.visibility = "hidden";
      const p = U.el("div", "spPut r-" + where, KP.E(cem));
      prop.appendChild(p);
      prop.querySelectorAll(".spGlow").forEach((g) => g.remove());
      prop.appendChild(U.el("div", "spGlow"));
      A.sfx(rel === "안" ? "drop" : "snap");
      A.sfx("good");
      A.note(A.SCALE[2 + k * 2], { inst: "bell", dur: 0.4, vol: 0.2 });
      const josa = U.josa(cname, "이/가");
      // 화면: "고양이가 상자 위에 있어요!" / 소리: 통째 음성이 없으면 "고양이가 상자 위!" (조각마다 자연 음성)
      const said = rel === "뒤" ? josa + " " + pName + " 뒤에 숨었어요! 까꿍!" : josa + " " + pName + " " + rel + "에 있어요!";
      const spoken = nat(said) || rel === "뒤" ? said : josa + " " + pName + " " + rel + "!";
      ctx.say(said, spoken);
      await ctx.wait(1900);
      if (tok !== ctx.token) return;
      if (k + 1 < tasks.length) return step(k + 1);
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 자리 박사!" : U.pick(["딩동댕!", "맞았어요!", "정확해요!"]) });
      if (ok && tok === ctx.token) this.next(ctx);
    };
    step(0);
  },
});

;

/* ==== js/games/bigkid/trace.js ==== */
/* 선 따라 그리기 — 점선 길을 손가락으로 따라가요 (깃발 → 도착)
   1단계: 직선·세로선·내리막·지그재그·번개·계단·산·네모 (길이 넓음)
   2단계: 무지개·물결·동그라미·언덕·S자 곡선·하트·달팽이·별
   3단계: 숫자 1~5, 한글 ㄱ ㄴ ㄷ ㅅ (두 획짜리는 획 순서대로) — 지난번에 멈춘 곳부터 이어서(trace:pos)
   - 길에서 너무 벗어나면 선이 그려지지 않고, 이어 갈 곳이 반짝 (벌칙 없음)
   - 끝까지 따라가면 그림이 살아나 길을 따라 달려요 */
"use strict";
KP.game({
  id: "trace",
  icon: "〰️",
  name: "선 따라 그리기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("trace", `
      .trBoard{background:radial-gradient(circle at 50% 40%,#ffffff,#f3f7ff)}
      .board .trSpot{position:absolute;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;pointer-events:none;left:0;top:0}
      .trSvg{position:absolute;width:0;height:0;overflow:hidden;visibility:hidden}
    `);
    const board = U.el("div", "board trBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "trSpot");
    board.append(cv, spot);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "trSvg");
    ctx.body.append(board, svg);
    let cx = cv.getContext("2d"); // 그리는 동안 잠깐 바탕 그림판으로 바꿔 씀 (draw 참고)
    const bg = document.createElement("canvas"),
      bcx = bg.getContext("2d");
    let bgSig = "";

    // rider: 완성 후 길을 달리는 친구, face: 그림이 보는 방향(왼쪽이면 오른쪽으로 갈 때 뒤집음)
    ctx.SHAPES = [
      [
        { name: "곧은 길", box: [100, 30], d: ["M6 15 L94 15"], rider: "🚗", face: "left", rot: { rider: "🚀", face: "rocket" } },
        { name: "로켓 길", box: [30, 100], d: ["M15 94 L15 6"], rider: "🚀", face: "rocket" },
        { name: "미끄럼틀", box: [100, 70], d: ["M8 8 L92 62"], rider: "🐧", face: null },
        { name: "지그재그 길", box: [100, 50], d: ["M5 42 L27 8 L50 42 L73 8 L95 42"], rider: "🐰", face: null, hop: true, rot: {} },
        { name: "번개 길", box: [60, 100], d: ["M42 5 L14 50 L46 50 L18 95"], rider: "⚡", face: null },
        { name: "계단 길", box: [100, 80], d: ["M6 74 L28 74 L28 52 L50 52 L50 30 L72 30 L72 8 L94 8"], rider: "🐱", face: null, hop: true },
        { name: "산 길", box: [100, 60], d: ["M6 54 L50 6 L94 54"], rider: "🚲", face: "left" },
        { name: "네모 길", box: [80, 80], d: ["M8 8 L72 8 L72 72 L8 72 L8 22"], rider: "🐞", face: null },
      ],
      [
        { name: "무지개 길", box: [100, 55], d: ["M8 50 A42 42 0 0 1 92 50"], rider: "🐞", face: null },
        { name: "물결 길", box: [100, 40], d: ["M5 20 Q 16.25 -2 27.5 20 T 50 20 T 72.5 20 T 95 20"], rider: "🐟", face: "left", rot: { rider: "🐝", face: null } },
        { name: "동그라미", box: [100, 100], d: ["M50 8 A42 42 0 1 0 50.01 8"], rider: "🐞", face: null },
        { name: "언덕 길", box: [100, 50], d: ["M5 45 Q 27.5 -15 50 45 Q 72.5 -15 95 45"], rider: "🚲", face: "left", rot: { rider: "🐞", face: null } },
        { name: "꼬불꼬불 길", box: [70, 100], d: ["M60 8 C 0 8, 0 50, 35 50 C 70 50, 70 92, 10 92"], rider: "🐝", face: null },
        { name: "하트 길", box: [100, 90], d: ["M50 26 C 50 14, 60 4, 74 10 C 98 20, 90 56, 50 84 C 10 56, 2 20, 26 10 C 40 4, 50 14, 50 24"], rider: "🐝", face: null },
        { name: "달팽이 길", box: [100, 100], d: ["M50 46 C 52 32, 72 34, 72 52 C 72 76, 30 78, 26 50 C 22 14, 86 8, 92 50 C 98 94, 18 100, 6 66"], rider: "🐌", face: "left" },
        { name: "별 길", box: [100, 96], d: ["M50 6 L61 38 L95 38 L68 58 L78 92 L50 72 L22 92 L32 58 L5 38 L39 38 L48 12"], rider: "⭐", face: null },
      ],
      [
        { name: "숫자 1", say: "숫자 일", box: [70, 100], d: ["M20 25 L40 8 L40 92"], rider: "⭐", face: null },
        { name: "숫자 2", say: "숫자 이", box: [70, 100], d: ["M12 28 C12 0, 62 0, 60 28 C58 48, 30 64, 10 92 L62 92"], rider: "⭐", face: null },
        { name: "숫자 3", say: "숫자 삼", box: [70, 100], d: ["M12 18 C25 0, 60 2, 58 26 C56 44, 36 47, 32 47 C42 47, 62 52, 60 72 C58 96, 22 98, 10 82"], rider: "⭐", face: null },
        { name: "숫자 4", say: "숫자 사", box: [70, 100], d: ["M46 8 L8 66 L64 66", "M48 40 L48 94"], rider: "⭐", face: null },
        { name: "숫자 5", say: "숫자 오", box: [70, 100], d: ["M18 10 L14 46 C30 34, 62 40, 60 66 C58 94, 22 96, 10 82", "M18 10 L58 10"], rider: "⭐", face: null },
        { name: "ㄱ", say: "기역", box: [80, 100], d: ["M12 18 L66 18 C66 50, 60 72, 44 92"], rider: "⭐", face: null },
        { name: "ㄴ", say: "니은", box: [80, 100], d: ["M16 10 L16 82 L72 82"], rider: "⭐", face: null },
        { name: "ㄷ", say: "디귿", box: [80, 100], d: ["M14 16 L68 16", "M14 16 L14 84 L70 84"], rider: "⭐", face: null },
        { name: "ㅅ", say: "시옷", box: [80, 100], d: ["M42 12 C40 50, 28 74, 8 90", "M42 46 C52 66, 62 80, 74 90"], rider: "⭐", face: null },
      ],
    ];
    KP.loadE(["🚩", "🏁", "✨", "🚗", "🚀", "🐧", "🐰", "⚡", "🐞", "🐟", "🚲", "🐝", "⭐", "🐱", "🐌"]);
    const INK = ["#ff5d8f", "#2f95f5", "#ff8a1f", "#2fb466", "#8a63ee"];

    /** SVG 경로 → 단위 좌표 점 목록 (약 1.2단위 간격) */
    function sample(d) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
      const L = p.getTotalLength();
      const n = Math.max(8, Math.ceil(L / 1.2));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const q = p.getPointAtLength((L * k) / n);
        pts.push({ x: q.x, y: q.y });
      }
      p.remove();
      return pts;
    }

    let W = 0,
      H = 0;
    const st = (ctx.tr = { ready: false });
    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = board.clientWidth;
      H = board.clientHeight;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      if (st.ready) layout();
    }
    ctx.trFit = fit;
    addEventListener("resize", () => ctx._active && fit());
    function layout() {
      const [bw, bh] = st.shape.box;
      const m = Math.max(44, Math.min(W, H) * 0.09);
      st.u = Math.min((W - 2 * m) / bw, (H - 2 * m) / bh);
      st.ox = (W - bw * st.u) / 2;
      st.oy = (H - bh * st.u) / 2;
      // 폰(짧은 쪽 500px 미만)은 2·3단계 길을 조금 넓게 — 길 폭 48px 은 손가락 굵기와 비슷했음
      const laneU = (Math.min(W, H) < 500 ? [9, 8.5, 7.5] : [9, 7.5, 6.5])[st.lv - 1];
      st.hw = Math.max(Math.min(W, H) < 500 ? 28 : 24, laneU * st.u); // 폰은 길 폭 최소 56px (48px 은 손가락 굵기와 비슷했음)
      st.tolU = (st.hw * 1.25 + 8) / st.u;
    }
    const X = (x) => st.ox + x * st.u,
      Y = (y) => st.oy + y * st.u;

    function polyline(pts, a, b) {
      cx.beginPath();
      cx.moveTo(X(pts[a].x), Y(pts[a].y));
      for (let k = a + 1; k <= b; k++) cx.lineTo(X(pts[k].x), Y(pts[k].y));
    }

    // 길·완성한 획·손가락 자국·도착 깃발은 바뀔 때만 바탕 그림판에 그려 두고, 매 장면에는 그 그림을 한 번 찍은 뒤
    // 반짝이는 곳만 새로 그림 (예전엔 가만히 있어도 매 장면 길 전체를 다시 그려 저가 태블릿이 버벅임)
    function draw(now) {
      if (!W || !st.ready) return;
      const t = now / 1000;
      if (st.done) return drawAll(now, t);
      const s = st.strokes[st.cur],
        li = st.inks[st.inks.length - 1];
      const sig = [cv.width, cv.height, W, H, st.ox, st.oy, st.u, st.hw, st.ink, st.cur, s.f, st.inks.length, li ? li.length : 0, document.fonts ? document.fonts.status : "", (KP.eImage("🏁") || {}).complete].join("|"); // 🏁 그림이 늦게 오면 다시
      if (sig !== bgSig) {
        bgSig = sig;
        if (bg.width !== cv.width || bg.height !== cv.height) {
          bg.width = cv.width;
          bg.height = cv.height;
        }
        bcx.setTransform(1, 0, 0, 1, 0, 0);
        bcx.clearRect(0, 0, bg.width, bg.height);
        bcx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
        const real = cx;
        cx = bcx;
        try {
          drawBase();
          const a = s.pts[0],
            b = s.pts[s.pts.length - 1];
          const fs = Math.max(40, st.hw * 1.7);
          if (Math.hypot(a.x - b.x, a.y - b.y) >= 3) KP.drawE(cx, "🏁", X(b.x) + fs * 0.15, Y(b.y) - fs * 0.35, fs);
        } finally {
          cx = real;
        }
      }
      cx.clearRect(0, 0, W, H);
      cx.drawImage(bg, 0, 0, W, H);
      drawFront(now, t);
    }
    function drawAll(now, t) {
      cx.clearRect(0, 0, W, H);
      drawBase();
      drawFront(now, t);
    }
    function drawBase() {
      cx.lineCap = "round";
      cx.lineJoin = "round";
      // 길 바탕
      st.strokes.forEach((s, k) => {
        const cur = k === st.cur;
        polyline(s.pts, 0, s.pts.length - 1);
        cx.strokeStyle = k < st.cur || st.done ? "rgba(0,0,0,0)" : cur ? "#e3e9fb" : "#eef1f9";
        cx.lineWidth = st.hw * 2;
        cx.stroke();
        if (k >= st.cur && !st.done) {
          cx.strokeStyle = cur ? "#9aa6d6" : "#c9d0ea";
          cx.lineWidth = Math.max(5, st.hw * 0.22);
          cx.setLineDash([0.1, Math.max(14, st.hw * 0.7)]);
          cx.stroke();
          cx.setLineDash([]);
        }
      });
      // 완성한 획: 깨끗한 색 길
      st.strokes.forEach((s, k) => {
        if (!(k < st.cur || st.done)) return;
        polyline(s.pts, 0, s.pts.length - 1);
        cx.strokeStyle = st.ink;
        cx.lineWidth = st.hw * 1.5;
        cx.stroke();
        cx.strokeStyle = "rgba(255,255,255,.35)";
        cx.lineWidth = st.hw * 0.45;
        cx.stroke();
      });
      // 손가락 자국
      if (!st.done) {
        cx.strokeStyle = st.ink;
        cx.lineWidth = st.hw * 1.05;
        for (const line of st.inks) {
          if (line.length < 2) {
            if (line.length === 1) {
              cx.fillStyle = st.ink;
              cx.beginPath();
              cx.arc(X(line[0].x), Y(line[0].y), st.hw * 0.52, 0, 7);
              cx.fill();
            }
            continue;
          }
          cx.beginPath();
          cx.moveTo(X(line[0].x), Y(line[0].y));
          for (let k = 1; k < line.length; k++) cx.lineTo(X(line[k].x), Y(line[k].y));
          cx.stroke();
        }
      }
    }
    function drawFront(now, t) {
      // 깃발 · 도착 (🏁 는 바탕에 그려 둠)
      if (!st.done) {
        const s = st.strokes[st.cur];
        const a = s.pts[0];
        const fs = Math.max(40, st.hw * 1.7);
        // 이어 갈 곳(처음엔 깃발 자리) 반짝
        const f = s.pts[Math.min(s.f, s.pts.length - 1)];
        const pulse = 0.5 + 0.5 * Math.sin(t * 5);
        const strong = st.flashUntil > now;
        cx.beginPath();
        cx.arc(X(f.x), Y(f.y), st.hw * (strong ? 1.2 + 0.35 * pulse : 0.95 + 0.15 * pulse), 0, 7);
        cx.fillStyle = "rgba(255,213,74," + (strong ? 0.22 + 0.2 * pulse : 0.12 + 0.1 * pulse) + ")";
        cx.fill();
        cx.strokeStyle = "rgba(255,170,0," + (strong ? 0.6 + 0.4 * pulse : 0.35 + 0.3 * pulse) + ")";
        cx.lineWidth = Math.max(4, st.hw * 0.22);
        cx.stroke();
        if (strong) KP.drawE(cx, "✨", X(f.x) + st.hw, Y(f.y) - st.hw, st.hw * 1.3 * (0.8 + 0.3 * pulse));
        if (s.f === 0) {
          KP.drawE(cx, "🚩", X(a.x) - fs * 0.12, Y(a.y) - fs * 0.55, fs);
          if (st.strokes.length > 1) {
            cx.fillStyle = "#ff7452";
            cx.font = Math.round(fs * 0.5) + "px Jua, sans-serif";
            cx.textAlign = "center";
            cx.textBaseline = "middle";
            cx.fillText(String(st.cur + 1), X(a.x) - fs * 0.62, Y(a.y) - fs * 0.05);
          }
        }
        spot.style.left = X(f.x) + "px";
        spot.style.top = Y(f.y) + "px";
      }
      // 완성: 길을 따라 달리기
      if (st.done && st.ride) {
        const r = st.ride;
        const k = U.clamp((now - r.t0) / r.dur, 0, 1);
        const idx = Math.min(r.pts.length - 1, Math.floor(k * (r.pts.length - 1)));
        const p = r.pts[idx],
          q = r.pts[Math.min(r.pts.length - 1, idx + 2)],
          o = r.pts[Math.max(0, idx - 2)];
        const dx = q.x - o.x,
          dy = q.y - o.y;
        // 지나간 자리 반짝
        if (Math.random() < 0.5) r.sp.push({ x: p.x, y: p.y, life: 1 });
        r.sp.forEach((s) => (s.life -= 0.02));
        r.sp = r.sp.filter((s) => s.life > 0);
        r.sp.forEach((s) => {
          cx.globalAlpha = s.life;
          KP.drawE(cx, "✨", X(s.x), Y(s.y), st.hw * 0.9 * s.life + 6);
        });
        cx.globalAlpha = 1;
        const size = Math.max(56, st.hw * 2.6);
        const sh = st.shape;
        let hop = sh.hop ? Math.abs(Math.sin(k * Math.PI * 8)) * size * 0.3 : Math.sin(t * 14) * 2;
        cx.save();
        cx.translate(X(p.x), Y(p.y) - size * 0.25 - hop);
        if (sh.face === "rocket") cx.rotate(Math.atan2(dy, dx) + Math.PI / 4);
        else if (sh.face === "left") {
          if (dx > 0) cx.scale(-1, 1);
          cx.rotate(Math.atan2(dy, Math.abs(dx)) * (dx > 0 ? -1 : 1) * 0.6);
        } else if (sh.rider === "⭐") cx.rotate(t * 4);
        KP.drawE(cx, sh.rider, 0, 0, size);
        cx.restore();
      }
    }

    /* ---------- 손가락 ---------- */
    const P = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) * W) / r.width,
        y = ((e.clientY - r.top) * H) / r.height;
      return { x: (x - st.ox) / st.u, y: (y - st.oy) / st.u };
    };
    let pid = null,
      last = null,
      lastTalk = 0,
      inkLine = null;
    function offPath() {
      const now = performance.now();
      st.flashUntil = now + 1600;
      inkLine = null;
      if (now - lastTalk > 4500) {
        lastTalk = now;
        const s = st.strokes[st.cur];
        KP.voice.say(s.f === 0 ? "깃발에서 시작해요!" : U.pick(["반짝이는 곳에서 이어서 그려요!", "길을 따라 가 봐요!"]));
      }
    }
    /** 한 점 처리: 길 위면 true */
    function visit(q) {
      const s = st.strokes[st.cur],
        pts = s.pts,
        n = pts.length;
      const K = Math.ceil(16 / 1.2);
      const tol = st.tolU;
      let on = false;
      const lo = Math.max(0, s.f - 2 * K),
        hi = Math.min(n - 1, s.f + K);
      for (let k = lo; k <= hi; k++) {
        if (Math.hypot(pts[k].x - q.x, pts[k].y - q.y) <= tol) {
          on = true;
          if (k >= s.f) s.cov[k] = 1;
        }
      }
      const before = s.f;
      while (s.f < n && s.cov[s.f]) s.f++;
      if (s.f > before && Math.floor(s.f / 14) > Math.floor(before / 14)) A.note(A.SCALE[Math.min(A.SCALE.length - 1, Math.floor((s.f / n) * 8))], { inst: "marimba", dur: 0.15, vol: 0.12 });
      return on;
    }
    function feed(q) {
      if (!last) last = q;
      const dist = Math.hypot(q.x - last.x, q.y - last.y);
      const steps = Math.max(1, Math.ceil(dist / 1.5));
      for (let i = 1; i <= steps; i++) {
        const p = { x: last.x + ((q.x - last.x) * i) / steps, y: last.y + ((q.y - last.y) * i) / steps };
        if (visit(p)) {
          if (!inkLine) {
            inkLine = [];
            st.inks.push(inkLine);
          }
          const lp = inkLine[inkLine.length - 1];
          if (!lp || Math.hypot(lp.x - p.x, lp.y - p.y) > 0.8) inkLine.push(p);
        } else {
          offPath();
          break;
        }
        const s = st.strokes[st.cur];
        if (s.f >= s.pts.length - 2) {
          strokeDone();
          break;
        }
      }
      last = q;
    }
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.done || pid !== null) return;
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      last = null;
      inkLine = null;
      A.sfx("tap");
      feed(P(e));
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || st.done) return;
      e.preventDefault();
      feed(P(e));
      const now = performance.now();
      if (now - (st.hintAt || 0) > 1000) {
        st.hintAt = now;
        setHint();
      }
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      last = null;
      inkLine = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function strokeDone() {
      pid = null;
      inkLine = null;
      if (st.cur < st.strokes.length - 1) {
        st.cur++;
        st.inks = [];
        A.sfx("good");
        // "이번엔 두 번째 깃발에서 시작!" 은 자연 음성이 없어 "다음 깃발에서 시작해요!"(자연 음성)로 — 깃발은 화면에서 반짝여 알려 줌
      KP.voice.say("좋아요! 다음 깃발에서 시작해요!");
        setHint();
        return;
      }
      finish();
    }
    async function finish() {
      st.done = true;
      ctx.hint(null);
      A.sfx("sparkle");
      const sh = st.shape;
      const i3 = ctx.SHAPES[2].findIndex((x) => x.name === sh.name);
      if (st.lv === 3 && i3 >= 0) KP.store.set("trace:pos", (i3 + 1) % ctx.SHAPES[2].length); // 다 그렸으면 다음 모양부터
      KP.voice.say(sh.say ? sh.say + "! 멋지게 그렸어요!" : "끝까지 왔어요! 우와, 달려간다!");
      const pts = st.strokes.flatMap((s) => s.pts);
      st.ride = { pts, t0: performance.now() + 200, dur: 2300, sp: [] };
      ctx.score.add();
      ctx.round++;
      await ctx.wait(2700);
      if (!ctx._active) return;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 그리기 대장!" : sh.say ? sh.name + " 완성!" : "잘 따라 그렸어요!", say: !big && sh.say ? sh.say + " 완성!" : "" }); // 말은 "기역 완성!"(화면은 "ㄱ 완성!")
      if (ok) ctx.def.next(ctx);
    }
    function setHint() {
      ctx.hint(() => spot, st.strokes[st.cur].f === 0 ? "깃발에서 시작해서 점선을 따라 그려요!" : "반짝이는 곳부터 이어서 그려요!");
    }

    ctx.trBuild = (shape, lv) => {
      bgSig = ""; // 새 모양 → 바탕 그림 다시 (틀 크기·잉크 색이 같아도)
      st.ready = false;
      fit();
      // 세로로 긴 화면에서 가로로 긴 모양은 세워서(아래 → 위) 크게
      const [bw, bh] = shape.box;
      const turn = shape.rot && H > W * 1.2 && bw > bh * 1.4;
      if (turn) shape = Object.assign({}, shape, { box: [bh, bw] }, shape.rot);
      st.shape = shape;
      st.lv = lv;
      st.strokes = shape.d.map((d) => {
        let pts = sample(d);
        if (turn) pts = pts.map((p) => ({ x: p.y, y: bw - p.x }));
        return { pts, cov: new Array(pts.length).fill(0), f: 0 };
      });
      st.cur = 0;
      st.inks = [];
      st.done = false;
      st.ride = null;
      st.flashUntil = 0;
      st.ink = U.pick(INK);
      fit();
      st.ready = true;
      layout();
      setHint();
    };
    ctx.trDraw = draw;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.bag = {};
    this.next(ctx);
    ctx.loop((dt, now) => ctx.trDraw(now));
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    // 같은 단계 안에서는 모양이 골고루 나오도록 주머니에서 뽑기
    if (!ctx.bag[lv] || !ctx.bag[lv].length) {
      // 3단계는 차례(숫자 1 → … → ㅅ)대로지만, 지난번에 멈춘 곳부터 이어서 (매일 '숫자 1'부터 하지 않게)
      const S3 = ctx.SHAPES[2],
        p0 = ((+KP.store.get("trace:pos", 0) || 0) % S3.length + S3.length) % S3.length;
      ctx.bag[lv] = lv === 3 ? S3.slice(p0).concat(S3.slice(0, p0)) : U.shuffle([...ctx.SHAPES[lv - 1]]);
      // 다시 채운 주머니의 첫 모양이 바로 앞 판과 같으면 뒤로 (같은 모양 연달아 방지)
      if (ctx.bag[lv].length > 1 && ctx.bag[lv][0] === ctx.lastShape) ctx.bag[lv].push(ctx.bag[lv].shift());
    }
    const shape = ctx.bag[lv].shift();
    ctx.lastShape = shape;
    if (lv === 3) KP.store.set("trace:pos", ctx.SHAPES[2].indexOf(shape)); // 다 그리지 않고 나가도 이 모양부터 다시
    ctx.trBuild(shape, lv);
    if (shape.say) {
      // 화면은 "ㄱ 따라 그려요!", 말(말풍선 다시 듣기·힌트 포함)은 "기역을 따라 그려요!"
      ctx.say("🚩 깃발에서 시작해서 " + shape.name + " 따라 그려요!", "깃발에서 시작해서 " + U.josa(shape.say, "을/를") + " 따라 그려요!");
    } else {
      // "무지개 길을" 처럼 자연 음성이 없는 이름은 "무지개 길! 깃발에서 시작해서 따라 그려요!"(조각마다 자연 음성)
      const full = "깃발에서 시작해서 " + U.josa(shape.name, "을/를") + " 따라 그려요!";
      const has = (t) => !KP.voice._natUrls || !!KP.voice._natUrls(t);
      // 이름 음성도 없으면(새로 넣은 길) 이름을 빼고 말함 — 기기 목소리 섞이지 않게
      ctx.say("🚩 " + full, has(full) ? full : has(shape.name + "!") ? shape.name + "! 깃발에서 시작해서 따라 그려요!" : "깃발에서 시작해서 따라 그려요!");
    }
  },
});

;

/* ==== js/games/bigkid/train.js ==== */
/* 숫자 기차 — 기관차 뒤에 숫자 객차를 순서대로 끌어 이어 붙이기
   1단계: 1~3 차례로 잇기 (숫자 + 점 개수 함께 보임)
   2단계: 1~5 차례로 잇기 (숫자 + 점)
          1·2단계 판 셋 중 하나쯤은 앞 칸(1, 또는 1·2)이 이미 붙어 있어 그다음 숫자부터 이어요(시작 숫자 변화, 이을 칸 수는 같음)
   3단계: 1~10 기차에서 빈 칸 4개 채우기 (숫자만, 앞뒤 숫자 보고 추리)
          — 3단계에 처음 들어오면 첫 2판은 디딤판: 1~6 기차에 빈 칸 2개 (점도 보임)
   2차 보강:
     · 2단계 판 셋 중 하나(앞 칸 붙은 판과 겹치지 않게)는 '빈 칸 하나 추리': 1~5 기차에 빈 칸 1개, 카드 3장(맞는 것 1 + 헷갈리는 것 2) — 3단계 디딤
     · 3단계(디딤판 뒤) 판 종류가 돌아가며 바뀜: 보통(빈 칸 4) → 헷갈리는 카드 1장 더(끝 카드가 저절로 맞지 않게) → 거꾸로 기차(10, 9, 8 … 1)
     · 다 이은 뒤 출발 연출(약 5초)은 둘째 판부터 화면을 누르면 건너뜀
   칸 크기(--cw)는 무대 폭에 맞춰 계산 → 한 줄에 다 들어가게. 너무 좁으면(폰 세로) 반씩 2줄(5+5)로 나눔
   다 이으면 동물 승객이 창문에서 손을 흔들고 기차가 칙칙폭폭 달려 나간다. */
"use strict";
KP.game({
  id: "train",
  icon: "🚂",
  name: "숫자 기차",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("train", `
      .trWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 10px 14px;gap:8px;overflow:hidden;--cw:clamp(62px,8.2vw,104px)}
      .trWrap.big{--cw:clamp(76px,13vw,128px)}
      .trTrain.split{justify-content:flex-start}
      .trWrap.tight{padding-left:2px;padding-right:2px}
      .trTrain.split .trCar,.trTrain.split .trSlot{margin:0 1px}
      .trTrain.split .trLoco{font-size:var(--cw);width:var(--cw)}
      .trTrain.split .trLink{left:-4px;width:5px}
      .trTrack{width:100%;display:flex;justify-content:center;position:relative}
      .trTrain{position:relative;z-index:0;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;row-gap:16px;max-width:100%;transition:transform 2.6s cubic-bezier(.55,0,.75,.4)}
      .trTrain.enter{animation:trEnter 1.1s cubic-bezier(.2,.9,.3,1)}
      @keyframes trEnter{from{transform:translateX(70vw)}}
      .trTrain.go{transform:translateX(-140vw)}
      .trUnit{position:relative;padding-bottom:calc(var(--cw)*.2)}
      .trUnit:after{content:"";position:absolute;left:-3px;right:-3px;bottom:2px;height:6px;border-radius:3px;background:#9a7b5b;box-shadow:0 5px 0 #d8c3a4}
      .trLoco{font-size:calc(var(--cw)*1.25);line-height:.9;display:flex;align-items:flex-end;justify-content:center;width:calc(var(--cw)*1.25);margin-right:2px}
      .trLoco .e{transform:scaleX(var(--flip,1))}
      .trTrain.go .trLoco,.trTrain.chug .trLoco{animation:trBob .3s infinite}
      .trTrain.go .trCar,.trTrain.chug .trCar{animation:trBob .3s infinite;animation-delay:calc(var(--k,0)*40ms)}
      @keyframes trBob{50%{transform:translateY(-3px)}}
      .trCar{width:var(--cw);height:calc(var(--cw)*.78);border-radius:14px 14px 8px 8px;position:relative;margin:0 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:inset 0 -6px 0 rgba(0,0,0,.14);background:var(--c,#ff7452)}
      .trCar:before,.trCar:after{content:"";position:absolute;bottom:calc(var(--cw)*-.16);width:calc(var(--cw)*.24);height:calc(var(--cw)*.24);border-radius:50%;background:radial-gradient(circle,#ddd 0 26%,#3b4160 28%);}
      .trCar:before{left:14%}.trCar:after{right:14%}
      .trN{font-size:calc(var(--cw)*.46);line-height:1;text-shadow:0 3px 0 rgba(0,0,0,.18)}
      .trDots{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;max-width:90%;margin-top:2px}
      .trDots i{width:calc(var(--cw)*.1);height:calc(var(--cw)*.1);border-radius:50%;background:#fff;opacity:.95}
      .trLink{position:absolute;left:-7px;top:62%;width:8px;height:5px;background:#555b7a;border-radius:2px}
      .trSlot{width:var(--cw);height:calc(var(--cw)*.78);margin:0 3px;border-radius:14px 14px 8px 8px;border:4px dashed rgba(47,58,102,.3);background:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.42);color:rgba(47,58,102,.35);box-sizing:border-box}
      .trSlot.next{border-color:var(--cat);color:var(--cat);animation:trPulse 1.4s ease-in-out infinite}
      @keyframes trPulse{50%{transform:scale(1.06)}}
      .trCar.fresh{animation:popIn .35s}
      .trPass{position:absolute;left:50%;top:0;transform:translate(-50%,-62%);font-size:calc(var(--cw)*.55);line-height:1;z-index:-1;animation:trPeek .5s backwards cubic-bezier(.2,1.5,.4,1);animation-delay:calc(var(--k,0)*90ms)}
      .trWave{position:absolute;right:-18%;top:-6%;font-size:.5em;transform-origin:70% 90%;animation:trWave .5s ease-in-out infinite alternate}
      @keyframes trPeek{from{transform:translate(-50%,10%)}}
      @keyframes trWave{from{transform:rotate(-20deg)}to{transform:rotate(25deg)}}
      .trTray{display:flex;gap:clamp(10px,2.2vw,22px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:calc(var(--tw)*.8);--tw:clamp(84px,11vw,120px);max-width:min(100%,760px)}
      .trTray .trCar{--cw:var(--tw);margin:0 0 calc(var(--tw)*.16)}
      .trSmoke{position:absolute;font-size:calc(var(--cw)*.5);opacity:0;pointer-events:none;animation:trSmoke 1.2s ease-out forwards}
      @keyframes trSmoke{0%{opacity:.9;transform:translate(0,0) scale(.5)}100%{opacity:0;transform:translate(30px,-80px) scale(1.4)}}
    `);
    ctx.COLORS = ["#ff7452", "#ffb020", "#2fb466", "#2f95f5", "#8a63ee", "#ff5d8f", "#16b5b0", "#f27d2c", "#5c7cfa", "#e8590c"];
    ctx.ANIMALS = ["🐶", "🐱", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐷", "🐸", "🐵", "🦊"];
    ctx.wrap = U.el("div", "trWrap");
    ctx.track = U.el("div", "trTrack");
    ctx.train = U.el("div", "trTrain");
    ctx.track.appendChild(ctx.train);
    ctx.tray = U.el("div", "trTray");
    ctx.wrap.append(ctx.track, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    // 출발 연출 건너뛰기 (finish 가 ctx.trSkip 을 걸어 둔 동안만)
    ctx.wrap.addEventListener("pointerdown", () => ctx.trSkip && ctx.trSkip());
    ctx.round = 0;
    ctx.token = 0;
    // 화면을 돌리면 칸 크기·줄 나눔만 다시 맞춤 (판은 그대로)
    let rt = null;
    addEventListener("resize", () => {
      if (!ctx._active) return;
      if (rt) ctx.cancel(rt);
      rt = ctx.after(250, () => this.fit(ctx));
    });
  },
  /** 칸 크기 맞추기: 기관차 + 칸 total 개가 한 줄에 들어가는 가장 큰 크기. 50px 보다 작아지면 반씩 2줄.
      2줄일 때는 '촘촘' 배치(좌우 여백 10→2px, 칸 사이 6→2px, 기관차 1.25→1칸)로 칸을 키움
      — 폰 세로(390)에서 10칸 기차 칸이 48→56px (끌어 놓기 쉽게) */
  fit(ctx) {
    const total = ctx.total || 0;
    ctx.wrap.classList.remove("tight");
    const W = ctx.track.clientWidth;
    if (!total || !W) return;
    const lv = ctx.level;
    const max = lv === 1 ? 128 : 104;
    // 칸 하나 = cw + 여백 g, 기관차 = L칸 + 2px
    const room = (per, w, g, L) => (w - 8 - per * g) / (per + L);
    let per = total,
      g = 6,
      L = 1.25,
      cw = Math.min(max, room(total, W, g, L));
    if (cw < 50) {
      per = Math.ceil(total / 2);
      g = 2;
      L = 1;
      cw = Math.min(max, room(per, W + 16, g, L)); // tight: 좌우 여백이 8px씩 늘어남
    }
    cw = Math.floor(Math.max(44, cw));
    const split = per < total;
    ctx.wrap.classList.toggle("tight", split);
    ctx.wrap.style.setProperty("--cw", cw + "px");
    ctx.train.classList.toggle("split", split);
    const lw = cw * L + 2;
    ctx.train.style.width = split ? Math.ceil(lw + per * (cw + g)) + 1 + "px" : "";
    // 둘째 줄 첫 칸은 기관차 폭만큼 들여서 윗줄 칸 아래에 맞춤
    (ctx.units || []).forEach((u) => (u.style.marginLeft = split && +u.dataset.pos === per + 1 ? lw + "px" : ""));
  },
  start(ctx) {
    ctx.round = 0;
    ctx.l3n = 0; // 3단계 디딤판 판 수 (열 때마다 처음 2판)
    ctx.lastPre = -1; // 열고 첫 판은 늘 1부터
    this.next(ctx);
  },
  car(ctx, n, dots) {
    const U = KP.u;
    const c = U.el("div", "trCar", '<span class="trN">' + n + "</span>" + (dots ? '<span class="trDots">' + "<i></i>".repeat(n) + "</span>" : ""));
    c.style.setProperty("--c", ctx.COLORS[(n - 1) % ctx.COLORS.length]);
    c.dataset.n = n;
    return c;
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const tok = ++ctx.token;
    // 3단계 첫 2판(이번에 연 뒤)은 디딤판: 1~6 에 빈 칸 2개 + 점
    if (lv < 3) ctx.l3n = 0;
    const step = lv === 3 && (ctx.l3n || 0) < 2;
    if (lv === 3) ctx.l3n = (ctx.l3n || 0) + 1;
    let seq = lv < 3; // 차례로 잇기
    // 1·2단계: 가끔 앞 칸이 이미 붙어 있음 → 2(또는 3)부터 이어 붙이기. 연달아 두 번은 안 함
    let pre = 0;
    if (seq && !ctx.lastPre && U.rand(3) === 0) pre = lv === 1 ? 1 : 1 + U.rand(2);
    // 2단계 빈 칸 하나 추리 판 (앞 칸 붙은 판이 아닐 때, 판 셋 중 하나)
    if (lv === 2) ctx.l2n = (ctx.l2n || 0) + 1;
    const one = lv === 2 && !pre && ctx.l2n % 3 === 0;
    if (one) seq = false;
    ctx.lastPre = pre;
    // 3단계 판 종류: 0 보통 · 1 헷갈리는 카드 · 2 거꾸로 (디딤판 뒤부터 돌아가며)
    const kind = lv === 3 && !step ? (ctx.l3n - 3) % 3 : 0;
    const rev = kind === 2;
    const total = step ? 6 : [3, 5, 10][lv - 1] + pre;
    const dots = lv < 3 || step;
    ctx.wrap.classList.toggle("big", lv === 1);
    ctx.train.style.transition = "none"; // 떠난 자리에서 미끄러져 돌아오지 않게
    ctx.train.className = "trTrain";
    ctx.train.style.transform = "";
    ctx.train.innerHTML = "";
    ctx.tray.innerHTML = "";
    void ctx.train.offsetWidth;
    ctx.train.style.transition = "";
    ctx.train.classList.add("enter");
    A.sfx("whoosh");

    const loco = U.el("div", "trUnit trLoco", KP.E("🚂"));
    ctx.train.appendChild(loco);
    const units = []; // [{n, el(unit), slot|car}]
    let blanks;
    if (seq) blanks = new Set(Array.from({ length: total - pre }, (_, i) => i + 1 + pre));
    else {
      // 빈 칸: 맨 앞 칸(보통 1, 거꾸로 기차는 10)은 늘 보이게
      blanks = new Set(U.sample(Array.from({ length: total - 1 }, (_, i) => (rev ? i + 1 : i + 2)), one ? 1 : step ? 2 : 4));
    }
    // 헷갈리는 카드: 빈 칸 숫자가 아닌 것 (2단계 추리 판 2장, 3단계 '헷갈리는 카드' 판 1장)
    const decoys = one ? U.sample([1, 2, 3, 4, 5, 6].filter((x) => !blanks.has(x)), 2) : kind === 1 ? U.sample(Array.from({ length: total }, (_, i) => i + 1).filter((x) => !blanks.has(x)), 1) : [];
    for (let k = 1; k <= total; k++) {
      const n = rev ? total + 1 - k : k; // 거꾸로 기차: 앞에서부터 10, 9, 8 …
      const u = U.el("div", "trUnit");
      u.style.setProperty("--k", n);
      const inner = blanks.has(n) ? U.el("div", "trSlot", "?") : this.car(ctx, n, dots);
      inner.appendChild(U.el("span", "trLink"));
      u.appendChild(inner);
      u.dataset.n = n;
      u.dataset.pos = k; // 화면에서 몇 번째 칸인지 (2줄 나눔용)
      units.push(u);
      if (!seq || !blanks.has(n)) ctx.train.appendChild(u);
    }
    const unitOf = (n) => units.find((u) => +u.dataset.n === n);
    ctx.total = total;
    ctx.units = units;
    this.fit(ctx);
    // 차례로 잇기: 다음 칸만 보여 줌
    let nextN = pre + 1;
    const showNext = () => {
      const u = unitOf(nextN);
      if (!u) return;
      ctx.train.appendChild(u);
      u.firstChild.classList.add("next");
    };
    if (seq) showNext();
    else units.forEach((u) => blanks.has(+u.dataset.n) && u.firstChild.classList.add("next"));

    // 앞 칸이 붙어 있는 판: "하나! 둘! 다음은 뭐가 올 차례일까?" — 모두 자연 음성 조각
    const preSay = Array.from({ length: pre }, (_, i) => U.NAT[i + 1] + "!").join(" ") + " 다음은 뭐가 올 차례일까?";
    // 거꾸로 기차: "열! 아홉! 여덟! 빈 칸에 들어갈 숫자를 찾아요!" — 모두 자연 음성 조각
    ctx.say(seq ? (pre ? preSay : "기차 칸을 1부터 순서대로 이어 주세요!") : rev ? "열! 아홉! 여덟! 빈 칸에 들어갈 숫자를 찾아요!" : "빈 칸에 어떤 숫자가 들어갈까요? 기차를 이어 주세요!");
    // 디딤판(끌 것 2개·빈 칸 2개): 첫 카드를 아무 칸에 놓아도 반은 맞고 나머지는 저절로 맞음 → 열쇠 별 없음
    if (step) ctx.fewChoice();

    const openSlots = () => units.filter((u) => u.isConnected && u.firstChild.classList.contains("trSlot"));
    const cars = U.shuffle([...blanks, ...decoys.map((d) => -d)]).map((v, k) => {
      const n = Math.abs(v),
        fake = v < 0; // 헷갈리는 카드(어느 빈 칸에도 안 맞음)
      const c = this.car(ctx, n, dots);
      c.classList.add("item");
      c.style.animation = "itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)";
      c.style.animationDelay = 300 + k * 70 + "ms";
      if (fake) c.dataset.fake = "1";
      ctx.tray.appendChild(c);
      const d = KP.drag(c, {
        targets: openSlots,
        pad: 30,
        accept: (u) => !fake && +u.dataset.n === n,
        onReject: (u) => {
          const want = +u.dataset.n;
          if (seq) {
            // "하나! 둘! 다음은 뭐가 올 차례일까?" — 모두 자연 음성 조각
            const cnt = Array.from({ length: want - 1 }, (_, i) => U.NAT[i + 1] + "!").join(" ");
            ctx.miss(u, want === 1 ? "맨 처음은 1이에요. 1을 찾아볼까?" : cnt + " 다음은 뭐가 올 차례일까?");
          } else {
            // 말로만 나감 → 숫자는 글자로 끊어 말하기(자연 음성 조각): "일곱! 아홉! 빈 칸에 들어갈 숫자를 찾아요!"
            // 화면에서 빈 칸 왼쪽·오른쪽 숫자 (거꾸로 기차는 왼쪽이 더 큰 수)
            const L = rev ? want + 1 : want - 1,
              R = rev ? want - 1 : want + 1;
            ctx.miss(u, U.NAT[L] + "! " + (R >= 1 && R <= total ? U.NAT[R] + "! 빈 칸에 들어갈 숫자를 찾아요!" : "다음은 뭐가 올 차례일까?"));
          }
        },
        onDrop: (u) => {
          if (!u) return;
          d.lock();
          c.remove();
          const car = this.car(ctx, n, dots);
          car.classList.add("fresh");
          car.appendChild(U.el("span", "trLink"));
          u.innerHTML = "";
          u.appendChild(car);
          A.sfx("snap");
          A.note(A.SCALE[Math.min(n - 1, A.SCALE.length - 1)], { inst: "marimba", dur: 0.4, vol: 0.3 });
          KP.voice.say(U.NAT[n] + "!");
          blanks.delete(n);
          if (seq) {
            nextN++;
            showNext();
          }
          if (!blanks.size) {
            // 남은 헷갈리는 카드는 쏙 사라짐
            cars.forEach((x) => {
              if (!x.isConnected) return;
              x.style.transition = "opacity .3s";
              x.style.opacity = "0";
              x.style.pointerEvents = "none";
            });
            finish();
          } else hint();
        },
      });
      return c;
    });
    const hint = () => {
      const want = seq ? nextN : rev ? Math.max(...blanks) : Math.min(...blanks);
      const c = cars.find((x) => +x.dataset.n === want && !x.dataset.fake);
      ctx.hint(() => c, seq ? (want === 1 ? "1번 칸을 끌어서 기차 뒤에 붙여요!" : U.NAT[want - 1] + " 다음은 몇일까? 찾아서 붙여요!") : "빈 칸에 들어갈 숫자를 찾아요!");
    };
    hint();

    const finish = async () => {
      ctx.hint(null);
      await ctx.wait(450);
      if (tok !== ctx.token) return;
      // 승객 태우기
      const animals = U.shuffle([...ctx.ANIMALS]);
      units.forEach((u, i) => {
        const car = u.querySelector(".trCar");
        const p = U.el("span", "trPass", KP.E(animals[i % animals.length]) + '<span class="trWave">' + KP.E("👋") + "</span>");
        p.style.setProperty("--k", i);
        car.appendChild(p);
      });
      A.sfx("pop");
      // 둘째 판부터: 화면을 누르면 출발 연출 건너뛰기
      let skipped = false;
      const skip = ctx.round > 0 ? new Promise((r) => (ctx.trSkip = () => ((skipped = true), r()))) : new Promise(() => {});
      const pause = (ms) => (skipped ? Promise.resolve() : Promise.race([ctx.wait(ms), skip]));
      // 다 함께 세기 (1~5까지만 빠르게 세고, 10칸이면 마지막 숫자만)
      ctx.say("칙칙폭폭! 친구들이 탔어요. 출발!");
      await pause(1600);
      if (tok !== ctx.token) return;
      // 기적 소리 + 출발
      A.tone(660, { dur: 0.45, vol: 0.16, type: "triangle" });
      A.tone(830, { dur: 0.45, vol: 0.12, type: "triangle", when: 0.02 });
      ctx.train.classList.add("chug");
      let k = 0;
      const steam = ctx.every(260, () => {
        A.noise({ dur: 0.12, vol: 0.06 + (k % 2) * 0.03, bp: 700, q: 1 });
        k++;
        if (k % 3 === 0) {
          const r = loco.getBoundingClientRect(),
            w = ctx.wrap.getBoundingClientRect();
          const s = U.el("span", "trSmoke", KP.E("☁️"));
          s.style.left = r.left - w.left + r.width * 0.3 + "px";
          s.style.top = r.top - w.top - 10 + "px";
          ctx.wrap.appendChild(s);
          ctx.after(1300, () => s.remove());
        }
      });
      await pause(700);
      if (tok !== ctx.token) return;
      ctx.train.classList.add("go");
      if (!skipped) KP.voice.say("칙칙폭폭! 칙칙폭폭!");
      await pause(2400);
      ctx.trSkip = null;
      ctx.cancel(steam);
      if (tok !== ctx.token) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 기관사 최고!" : "기차 완성!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});
