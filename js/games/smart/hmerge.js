/* 글자 합체 — 자음 카드·모음 카드를 '합체 기계'에 넣어 글자를 만드는 놀이 (한글 놀이에서 떨어져 나옴)
   위쪽 단추로 단계를 고름(잠금 없음, 마지막으로 고른 단계를 "hmerge:stage" 에 기억, 처음은 1):
   1 합체(자유): 카드를 기계로 끌어 넣기(눌러도 됨) → 덜컹·뿅 하고 글자 탄생 "기역에 아 하면, 가! 가방의 가!"
     세로 모음(ㅏㅑㅓㅕㅣ)은 자음 오른쪽, 가로 모음(ㅗㅛㅜㅠㅡ)은 아래로 조각이 미끄러져 붙음.
     🔄 모음 돌리기: 자음을 넣은 채 누를 때마다 가→갸→거→겨… 다음 모음으로 바꿔 읽어 줌.
     새 글자 6개마다 칭찬(자유 놀이라 열쇠 별은 없음)
   2 만들기: 소리(👂) 또는 그림(🦊 "여우의 여!")을 보고 자음 → 모음 차례로 골라 합체 (보기 3개, 닮은 모양 섞기)
   3 낱말: 받침 없는 두 글자 낱말 그림을 보고 칸 두 개에 글자를 하나씩 골라 채우기 (보기 3개 — 만 3~4세라 완성 글자 고르기)
   4 쪼개기: 글자를 가위로 싹둑 → 숨은 자음·모음 카드 고르기 (보기 3개)
   5 받침(형님): 받침 없는 글자 + 받침 자음 → 받침 글자 (고+ㅁ=곰). 받침이 아래로 쏙 붙는 연출 (보기 3개)
   📒 도감: 1~4단계에서 만든 받침 없는 글자 140칸(자음 14 × 모음 10). 줄 하나를 다 채우면 도장·칭찬, 다 채우면 큰 칭찬.
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
    KP.css("hmerge", `
      .hmModes{display:flex;gap:clamp(5px,1vw,10px);justify-content:center;padding:8px 8px 4px;flex:0 0 auto}
      .hmMode{font-size:clamp(15px,1.9vw,21px);background:#fff;color:var(--night);border-radius:18px;padding:4px 12px;min-height:52px;display:flex;align-items:center;gap:5px;border:4px solid #fff;box-shadow:0 5px 0 rgba(27,37,80,.18);white-space:nowrap}
      .hmMode .e{font-size:1.3em}
      .hmN{display:inline-flex;align-items:center;justify-content:center;width:1.45em;height:1.45em;border-radius:50%;background:var(--cat);color:#fff;font-weight:400;font-size:.92em;flex:0 0 auto}
      .hmMode.sel{background:var(--night);border-color:var(--night);color:#fff;box-shadow:0 5px 0 var(--deep)}
      .hmMode.sel .hmN{background:var(--star);color:var(--night)}
      .hmMode.glow{animation:glow 1s ease-in-out 3}
      @media (max-width:760px){.hmModes{gap:4px;padding:6px 4px 2px}.hmMode{padding:2px 4px;min-height:48px;border-width:3px;gap:2px;flex:1 1 0;justify-content:center;min-width:0;font-size:16px}.hmTx{display:none}}
      .hmView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
      .hmView.on{display:flex}

      /* 글자 상자: 조각(자음 c·모음 v·받침 j)이 모음 모양에 따라 자리를 잡고, 합체(fused)하면 글자 하나로 */
      .hmSyl{position:relative;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;color:var(--night);flex:0 0 auto}
      .hmP,.hmG{position:absolute;display:flex;align-items:center;justify-content:center;line-height:1}
      .hmP{left:0;top:0;width:100%;height:100%;font-size:.62em;
        transition:left .45s cubic-bezier(.3,1.3,.5,1),top .45s cubic-bezier(.3,1.3,.5,1),width .45s,height .45s,font-size .45s,opacity .3s,transform .55s cubic-bezier(.3,1.1,.4,1)}
      .hmP.j{opacity:0;top:72%;height:28%}
      .hmSyl.T .hmP.c{left:3%;width:53%}
      .hmSyl.T .hmP.v{left:50%;width:47%}
      .hmSyl.W .hmP.c{top:3%;height:52%}
      .hmSyl.W .hmP.v{top:43%;height:52%}
      .hmSyl.J .hmP{font-size:.47em}
      .hmSyl.J.T .hmP.c,.hmSyl.J.T .hmP.v{top:1%;height:57%}
      .hmSyl.J.W .hmP.c{top:0;height:37%}
      .hmSyl.J.W .hmP.v{top:24%;height:37%}
      .hmSyl.J .hmP.j{opacity:1;top:57%;height:42%}
      .hmP.q{color:rgba(47,58,102,.32)!important}
      .hmP.q::before{content:"";position:absolute;inset:7%;border:4px dashed rgba(47,58,102,.25);border-radius:18px}
      .hmP.got{animation:popIn .35s cubic-bezier(.2,1.5,.4,1)}
      .hmG{inset:0;font-size:.84em;opacity:0;transform:scale(.5);transition:opacity .25s,transform .45s cubic-bezier(.2,1.6,.4,1)}
      .hmSyl.fused .hmG{opacity:1;transform:none}
      .hmSyl.fused .hmP{opacity:0}
      .hmSyl::before,.hmSyl::after{content:"";position:absolute;border:0 dashed rgba(47,58,102,.22);opacity:0;transition:opacity .3s}
      .hmSyl:not(.fused)::before{opacity:1}
      .hmSyl.T::before{left:51%;top:8%;bottom:8%;border-left-width:3px}
      .hmSyl.W::before{top:49%;left:8%;right:8%;border-top-width:3px}
      .hmSyl.J.T::before{bottom:44%}
      .hmSyl.J.W::before{top:30%}
      .hmSyl.J:not(.fused)::after{opacity:1;top:58%;left:8%;right:8%;border-top-width:3px}
      .hmSyl.noAnim .hmP,.hmSyl.noAnim .hmG{transition:none}
      .hmSyl.boom{animation:popBig .5s cubic-bezier(.2,1.6,.4,1)}

      /* 합체 기계 */
      .hmMac{position:relative;display:flex;align-items:center;justify-content:center;gap:clamp(8px,1.8vw,22px);flex-wrap:wrap;align-content:center;border-radius:32px;padding:10px;
        --hop:clamp(62px,min(11vw,14vh),116px);--s:clamp(100px,min(18vw,24vh),200px)}
      .hmHop{position:relative;width:var(--hop);height:var(--hop);border-radius:24px;border:5px dashed rgba(47,58,102,.25);background:rgba(255,255,255,.8);display:flex;align-items:center;justify-content:center;font-size:calc(var(--hop) * .62);line-height:1;flex:0 0 auto;transition:transform .45s cubic-bezier(.3,1.2,.5,1)}
      .hmHop:not(.full)::after{content:attr(data-l);font-size:clamp(14px,1.6vw,18px);color:rgba(47,58,102,.38)}
      .hmHop.full{border-style:solid;border-color:#fff;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.12)}
      .hmHop.got{animation:popIn .35s cubic-bezier(.2,1.5,.4,1)}
      .hmOp{font-size:clamp(26px,3.4vw,44px);color:var(--ink2);flex:0 0 auto}
      .hmOut{position:relative;background:var(--star);border:6px solid #fff;border-radius:34px;box-shadow:0 8px 0 rgba(27,37,80,.25);padding:4px;flex:0 0 auto}
      .hmOut.empty{background:rgba(255,255,255,.6);border-style:dashed;border-color:rgba(47,58,102,.2);box-shadow:none}
      .hmOut.empty .hmG{color:rgba(47,58,102,.2)}
      .hmTag{position:absolute;right:-20%;bottom:-16%;background:#fff;border-radius:20px;padding:4px 10px 3px;box-shadow:0 5px 0 rgba(47,58,102,.15);display:flex;flex-direction:column;align-items:center;font-size:clamp(14px,1.7vw,18px);z-index:2;animation:popIn .35s}
      .hmTag .e{font-size:clamp(36px,4.6vw,56px)}
      .hmBr{display:none}
      @keyframes hmRattle{15%{transform:translate(-4px,2px) rotate(-3deg)}35%{transform:translate(4px,-2px) rotate(3deg)}55%{transform:translate(-3px,1px) rotate(-2deg)}75%{transform:translate(2px,0) rotate(1deg)}}
      .hmMac.run .hmHop,.hmMac.run .hmOut{animation:hmRattle .42s}

      /* 1단계: 자유 합체 */
      .hmFree{align-items:center;justify-content:space-between;gap:6px;padding:4px 10px 12px}
      .hmFree .hmMac{flex:1;min-height:0;width:100%;background:rgba(255,255,255,.35);border:4px dashed rgba(47,58,102,.12);transition:background .2s,box-shadow .2s}
      .hmFree .hmMac.dropHover{outline:none;background:rgba(255,197,49,.28);box-shadow:inset 0 0 0 6px rgba(255,197,49,.55)}
      .hmRow{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:clamp(5px,.8vw,10px);width:min(100%,1100px);flex:0 0 auto}
      @media (max-width:700px){.hmRow.cons{--n:7!important}.hmRow.vows{--n:5!important}}
      .hmT{aspect-ratio:1;max-height:84px;min-width:0;border-radius:18px;background:#fff;font-size:clamp(26px,min(4.2vw,6vh),46px);color:var(--c);box-shadow:0 5px 0 color-mix(in srgb,var(--c) 45%,#fff);border:3px solid color-mix(in srgb,var(--c) 30%,#fff);display:flex;align-items:center;justify-content:center;line-height:1;position:relative;z-index:1}
      .hmT.sel{background:var(--c);color:#fff}
      .hmT.dragging{z-index:20}
      .hmSpin{width:clamp(64px,8vw,86px);height:clamp(64px,8vw,86px);border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 6px 0 rgba(47,58,102,.15);font-size:13px;color:var(--ink2);flex:0 0 auto;line-height:1.1}
      .hmSpin .e{font-size:clamp(30px,3.6vw,40px)}
      .hmSpin:active{transform:translateY(3px)}
      .hmSpin.go .e{animation:spin .5s}
      @media (max-aspect-ratio:1/1){.hmFree .hmBr{display:block;flex-basis:100%;height:0}.hmFree .hmOp.eq{display:none}.hmFree .hmMac{--hop:clamp(62px,17vw,110px);--s:clamp(104px,min(32vw,19vh),190px)}}
      @media (max-height:520px) and (min-aspect-ratio:4/3){.hmFree{gap:4px;padding:2px 8px 8px}.hmFree .hmMac{padding:4px;--hop:clamp(48px,13vh,80px);--s:clamp(72px,24vh,124px)}.hmT{max-height:56px;border-radius:14px;font-size:clamp(24px,7vh,34px)}}

      /* 2~5단계: 문제 */
      .hmQ{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.6vh,28px);padding:4px 12px 16px}
      .hmTop{display:flex;align-items:center;justify-content:center;gap:clamp(10px,2.4vw,30px);flex-wrap:wrap;
        --hop:clamp(60px,min(10vw,12vh),106px);--s:clamp(96px,min(16vw,21vh),176px)}
      .hmTop .hmMac{padding:0}
      .hmAsk{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;border-radius:30px;padding:6px 14px;box-shadow:var(--shadow);min-width:var(--s);min-height:var(--s);line-height:1;flex:0 0 auto}
      .hmAsk .e{font-size:calc(var(--s) * .6)}
      .hmAsk .hmW{font-size:calc(var(--s) * .2);margin-top:4px;letter-spacing:.06em}
      .hmAsk .hmW i{font-style:normal;color:var(--coral)}
      .hmAsk.ear{cursor:pointer}
      .hmAsk.yay{animation:jumpA .5s 2}
      .hmSlots{display:flex;gap:clamp(8px,1.6vw,16px)}
      .hmSlot{width:calc(var(--s) * .86);height:calc(var(--s) * .86);border-radius:26px;border:5px dashed rgba(47,58,102,.25);background:rgba(255,255,255,.8);display:flex;align-items:center;justify-content:center;font-size:calc(var(--s) * .6);line-height:1;color:var(--night)}
      .hmSlot.now{border-color:var(--sun);background:#fff8dc}
      .hmSlot.full{border-style:solid;border-color:#fff;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.12);transition:transform .45s cubic-bezier(.3,1.2,.5,1)}
      .hmSlots.yay{animation:jumpA .5s 2}
      .hmCut{position:absolute;z-index:3;font-size:calc(var(--s) * .38);line-height:1;pointer-events:none;transition:transform .7s ease-in-out}
      .hmCutWrap{position:relative}
      .hmAns{display:flex;gap:clamp(12px,2.4vw,26px);justify-content:center;flex-wrap:wrap;min-height:clamp(80px,min(13vw,16vh),130px)}
      .hmOpt{font-size:clamp(44px,min(7.6vw,10vh),80px);min-width:clamp(80px,min(13vw,16vh),130px);min-height:clamp(80px,min(13vw,16vh),130px);border-radius:28px;color:var(--ink)}
      .hmStep{font-size:clamp(17px,2.2vw,23px);color:var(--ink2);min-height:1.3em}
      @media (max-aspect-ratio:1/1){.hmTop{--hop:clamp(58px,16vw,100px);--s:clamp(92px,min(28vw,17vh),170px)}.hmOpt{min-width:clamp(80px,24vw,120px);min-height:clamp(80px,24vw,120px)}}
      .hmRight{display:contents}
      /* 폰 가로(키 작음): 위 그림·기계, 아래 보기 — 모두 작게 */
      @media (max-height:520px) and (min-aspect-ratio:4/3){.hmQ{gap:6px;padding:2px 10px 8px}.hmTop{--hop:clamp(46px,13vh,72px);--s:clamp(72px,27vh,118px);gap:clamp(8px,2vw,20px)}
        .hmStep{font-size:15px;min-height:0}.hmAns{min-height:0;gap:clamp(10px,2vw,20px)}.hmOpt{min-width:clamp(64px,18vh,80px);min-height:clamp(64px,18vh,80px);font-size:clamp(34px,10vh,48px);border-radius:22px;padding:4px}}

      /* 도감 */
      .hmDex{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 10px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
      .hmDexTop{display:flex;align-items:center;gap:10px;font-size:clamp(18px,2.4vw,26px);color:var(--night);flex:0 0 auto}
      .hmDexTop .e{font-size:1.4em}
      .hmDexTop b{font-weight:400;color:var(--coral)}
      .hmGridD{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:clamp(2px,.5vw,6px);width:min(100%,900px,max(330px,calc((100dvh - 300px) * .68)));flex:0 0 auto}
      .hmDc,.hmDh{aspect-ratio:1;min-height:0;height:auto;border-radius:22%;display:flex;align-items:center;justify-content:center;font-size:clamp(12px,min(1.9vw,2.5vh),26px);line-height:1;min-width:0;padding:0;overflow:hidden}
      .hmDc{background:rgba(255,255,255,.45);color:rgba(47,58,102,.16);border:2px dashed rgba(47,58,102,.14)}
      .hmDc.on{background:#fff;color:var(--c);border:2px solid color-mix(in srgb,var(--c) 35%,#fff);box-shadow:0 3px 0 color-mix(in srgb,var(--c) 40%,#fff)}
      .hmDc.new{animation:hmNew 1.2s ease-in-out 2}
      @keyframes hmNew{50%{transform:scale(1.18);box-shadow:0 0 0 5px rgba(255,197,49,.7)}}
      .hmDh{color:var(--c);background:transparent;position:relative;overflow:visible}
      .hmDh.v{color:var(--ink2)}
      .hmDh .hmStamp{position:absolute;inset:-12%;display:flex;align-items:center;justify-content:center;pointer-events:none;animation:popBig .5s cubic-bezier(.2,1.6,.4,1)}
      .hmDh .hmStamp .e{width:100%;height:100%;opacity:.85}
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
    // 그림이 있는 첫 글자 (2단계 그림 문제): 표 안의 글자마다 wordFor 낱말
    ctx.PIC = ctx.ALL.map((s) => D.wordFor(s)).filter(Boolean);
    // 3단계 낱말: 받침 없는 두 글자 (두 글자 모두 140칸 안)
    ctx.W2 = [
      ["나무", "🌳"], ["하마", "🦛"], ["오이", "🥒"], ["기차", "🚂"], ["포도", "🍇"], ["바다", "🌊"], ["우유", "🥛"], ["모자", "🎩"],
      ["나비", "🦋"], ["사자", "🦁"], ["치마", "👗"], ["피자", "🍕"], ["지구", "🌍"], ["거미", "🕷️"], ["가지", "🍆"], ["다리", "🦵"],
      ["모기", "🦟"], ["지도", "🗺️"], ["아기", "👶"], ["여우", "🦊"], ["야구", "⚾"], ["버스", "🚌"], ["치즈", "🧀"],
      ["주스", "🧃"],["라마", "🦙"], ["휴지", "🧻"], ["비누", "🧼"], ["기타", "🎸"], ["커피", "☕"], ["고추", "🌶️"],
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

    /* ---------- 화면 틀 ---------- */
    const modes = U.el("div", "hmModes");
    ctx.STAGES = [
      [1, "🧲", "합체"],
      [2, "🔨", "만들기"],
      [3, "🧱", "낱말"],
      [4, "✂️", "쪼개기"],
      [5, "👇", "받침"],
    ];
    ctx.bSt = ctx.STAGES.map(([n, em, t]) => {
      const b = U.btn('<b class="hmN">' + n + "</b>" + KP.E(em) + '<span class="hmTx">' + t + "</span>", "hmMode");
      ctx.tap(b, () => self.go(ctx, n));
      modes.appendChild(b);
      return b;
    });
    ctx.bDex = U.btn(KP.E("📒") + '<span class="hmTx">도감</span>', "hmMode dex");
    ctx.tap(ctx.bDex, () => self.go(ctx, "dex"));
    modes.appendChild(ctx.bDex);

    /* 1단계 화면: 위 자음 줄 · 가운데 합체 기계 · 아래 모음 줄 */
    ctx.vFree = U.el("div", "hmView hmFree");
    ctx.consRow = U.el("div", "hmRow cons");
    ctx.consRow.style.setProperty("--n", 14);
    ctx.vowRow = U.el("div", "hmRow vows");
    ctx.vowRow.style.setProperty("--n", 10);
    ctx.mac = U.el("div", "hmMac");
    ctx.hopC = U.el("div", "hmHop");
    ctx.hopC.dataset.l = "자음";
    ctx.hopV = U.el("div", "hmHop");
    ctx.hopV.dataset.l = "모음";
    ctx.outF = U.el("div", "hmOut empty");
    ctx.sylF = this.mkSyl();
    ctx.outF.appendChild(ctx.sylF);
    ctx.spin = U.btn(KP.E("🔄") + "<span>돌리기</span>", "hmSpin");
    ctx.mac.append(ctx.hopC, U.el("span", "hmOp", "+"), ctx.hopV, U.el("span", "hmBr"), U.el("span", "hmOp eq", "="), ctx.outF, ctx.spin);
    ctx.vFree.append(ctx.consRow, ctx.mac, ctx.vowRow);
    ctx.consT = D.H.map((h, i) => {
      const t = U.el("button", "hmT", h[0]);
      t.type = "button";
      t.style.setProperty("--c", D.CC[i]);
      self.dragCard(ctx, t, () => self.putC(ctx, i));
      ctx.consRow.appendChild(t);
      return t;
    });
    ctx.vowT = D.V.map((v, i) => {
      const t = U.el("button", "hmT", v[0]);
      t.type = "button";
      t.style.setProperty("--c", D.VC[i]);
      self.dragCard(ctx, t, () => self.putV(ctx, i));
      ctx.vowRow.appendChild(t);
      return t;
    });
    ctx.tap(ctx.outF, () => ctx.fs && self.sayMerge(ctx, ctx.fc, ctx.fv));
    ctx.tap(ctx.spin, () => self.spinV(ctx));

    /* 2~5단계 화면 (판마다 새로 채움) */
    ctx.vQ = U.el("div", "hmView");
    ctx.q = U.el("div", "hmQ");
    ctx.vQ.appendChild(ctx.q);

    /* 도감 화면 */
    ctx.vDex = U.el("div", "hmView");
    ctx.dexBox = U.el("div", "hmDex");
    ctx.vDex.appendChild(ctx.dexBox);

    ctx.body.append(modes, ctx.vFree, ctx.vQ, ctx.vDex);
  },

  start(ctx) {
    ctx.round = 0;
    ctx.wins = {};
    ctx.freeNew = 0;
    ctx.freeMade = 0;
    ctx.dexNew = new Set();
    ctx.dex = this.loadDex();
    let st = +KP.store.get("hmerge:stage", 1);
    if (!(st >= 1 && st <= 5)) st = 1;
    this.go(ctx, st, true);
  },

  /* ================= 말하는 문장 (게임과 lines() 가 같이 씀 — 녹음된 조각을 최대한 재사용) ================= */
  TX: {
    hintC: "위에서 자음을 골라 봐요!",
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

  /* ================= 단계 고르기 ================= */
  go(ctx, st, first) {
    ctx.tk = (ctx.tk || 0) + 1; // 판·연출 무효화 표시
    ctx.st = st;
    if (st !== "dex") KP.store.set("hmerge:stage", st);
    ctx.bSt.forEach((b, i) => b.classList.toggle("sel", st === i + 1));
    ctx.bDex.classList.toggle("sel", st === "dex");
    ctx.vFree.classList.toggle("on", st === 1);
    ctx.vQ.classList.toggle("on", st >= 2 && st <= 5);
    ctx.vDex.classList.toggle("on", st === "dex");
    if (!first) KP.audio.sfx("select");
    ctx.hint(null);
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

  /* ================= 글자 상자 (조각 → 글자) ================= */
  mkSyl(cls) {
    const U = KP.u;
    const el = U.el("div", "hmSyl fused" + (cls ? " " + cls : ""));
    el.pc = U.el("span", "hmP c");
    el.pv = U.el("span", "hmP v");
    el.pj = U.el("span", "hmP j");
    el.g = U.el("span", "hmG", "?");
    el.append(el.pc, el.pv, el.pj, el.g);
    return el;
  },
  /** 조각 배치: 모음 모양(lay)으로 세로(T)/가로(W) 자리, j 가 있으면 받침 자리(J). 빈 조각은 q 면 '?' 칸 */
  sylSet(el, o) {
    const D = KP.hangul;
    el.classList.remove("fused", "T", "W", "J");
    el.classList.add(D.isTall(o.lay || o.v) ? "T" : "W");
    if (o.j || o.jSlot) el.classList.add("J");
    [["pc", o.c, o.cc], ["pv", o.v, o.vc], ["pj", o.j, o.jc]].forEach(([k, t, col]) => {
      const p = el[k];
      p.textContent = t || (o.q ? "?" : "");
      p.classList.toggle("q", !t && !!o.q);
      p.style.color = t ? col || "" : "";
    });
  },
  fuse(el, glyph) {
    el.g.textContent = glyph;
    el.classList.add("fused");
    KP.u.replay(el, "boom");
  },
  /** 조각이 from 요소 자리에서 날아와 제자리에 붙기 (FLIP) */
  flyIn(p, from) {
    const a = from.getBoundingClientRect(),
      b = p.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const fa = parseFloat(getComputedStyle(from).fontSize) || 1,
      fb = parseFloat(getComputedStyle(p).fontSize) || 1;
    const k = Math.max(0.3, Math.min(3, fa / fb));
    p.style.transition = "none";
    p.style.transform = "translate(" + (a.left + a.width / 2 - b.left - b.width / 2) + "px," + (a.top + a.height / 2 - b.top - b.height / 2) + "px) scale(" + k + ")";
    void p.offsetWidth;
    p.style.transition = "";
    p.style.transform = "";
  },
  /** 덜컹 소리 */
  clunk(ctx) {
    const A = KP.audio;
    A.tone(140, { to: 80, dur: 0.12, type: "square", vol: 0.1 });
    A.tone(120, { to: 70, dur: 0.12, type: "square", vol: 0.1, when: 0.16 });
  },
  boomFx(ctx, el) {
    KP.audio.sfx("sparkle");
    const r = el.getBoundingClientRect();
    KP.confetti && KP.confetti(30, r.left + r.width / 2, r.top + r.height / 2);
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

  /* ================= 1단계: 자유 합체 ================= */
  /** 카드 끌기(기계에 놓으면 넣기) + 눌러도 넣기 */
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
      targets: () => [ctx.mac],
      pad: 30,
      onDrop: (tg) => {
        if (!tg) return;
        t.style.transition = "none";
        t.style.transform = "";
        KP.u.replay(t, "pop");
        put();
      },
    });
    t.addEventListener("click", () => {
      if (far) return; // 끌다가 놓은 것은 이미 처리(또는 제자리로)
      KP.audio.unlock();
      put();
    });
  },
  freeStart(ctx) {
    ctx.fc = -1;
    ctx.fv = -1;
    ctx.fs = "";
    ctx.mTok = (ctx.mTok || 0) + 1;
    [ctx.hopC, ctx.hopV].forEach((h) => {
      h.textContent = "";
      h.className = "hmHop";
    });
    ctx.consT.forEach((t) => t.classList.remove("sel"));
    ctx.vowT.forEach((t) => t.classList.remove("sel"));
    ctx.outF.className = "hmOut empty";
    ctx.outF.querySelectorAll(".hmTag").forEach((x) => x.remove());
    ctx.sylF.className = "hmSyl fused";
    ctx.sylF.g.textContent = "?";
    ctx.spin.style.visibility = "hidden";
    ctx.say("🧲 자음 하나, 모음 하나를 골라요. 둘이 만나면 글자가 돼요!");
    ctx.hint(() => ctx.consT[0], this.TX.hintC);
  },
  /** 기계 칸 채우기 (fly: 보기 버튼에서 날아오는 중이면 톡 튀는 효과는 생략 — 겹치면 날아오기가 안 보임) */
  fillHop(ctx, hop, ch, color, fly) {
    hop.textContent = ch;
    hop.style.color = color;
    hop.className = "hmHop full";
    if (!fly) KP.u.replay(hop, "got");
    KP.audio.sfx("drop");
  },
  putC(ctx, i) {
    if (ctx.st !== 1) return;
    const D = ctx.D;
    ctx.fc = i;
    ctx.consT.forEach((t, j) => t.classList.toggle("sel", j === i));
    this.fillHop(ctx, ctx.hopC, D.H[i][0], D.CC[i]);
    ctx.spin.style.visibility = "";
    if (ctx.fv >= 0) this.freeMerge(ctx);
    else {
      KP.voice.say(D.H[i][1] + "!");
      ctx.hint(() => ctx.vowT[0], "이번엔 아래에서 모음을 골라요!");
    }
  },
  putV(ctx, i) {
    if (ctx.st !== 1) return;
    const D = ctx.D;
    ctx.fv = i;
    ctx.vowT.forEach((t, j) => t.classList.toggle("sel", j === i));
    this.fillHop(ctx, ctx.hopV, D.V[i][0], D.VC[i]);
    if (ctx.fc >= 0) this.freeMerge(ctx);
    else {
      KP.voice.say(D.V[i][1] + "!");
      ctx.hint(() => ctx.consT[0], "위에서 자음도 골라요!");
    }
  },
  /** 🔄 모음 돌리기: 자음은 그대로, 모음만 다음 것으로 (가→갸→거→겨…) */
  spinV(ctx) {
    if (ctx.st !== 1 || ctx.fc < 0) return;
    const D = ctx.D;
    const i = (ctx.fv + 1) % D.V.length;
    KP.u.replay(ctx.spin, "go");
    ctx.fv = i;
    ctx.vowT.forEach((t, j) => t.classList.toggle("sel", j === i));
    this.fillHop(ctx, ctx.hopV, D.V[i][0], D.VC[i]);
    this.freeMerge(ctx, true);
  },
  /** 기계 덜컹 → 조각이 모음 모양대로 제자리에 미끄러져 붙음 → 뿅! 글자 */
  freeMerge(ctx, quick) {
    const U = KP.u,
      D = ctx.D,
      self = this;
    const tk = (ctx.mTok = (ctx.mTok || 0) + 1);
    const ci = ctx.fc,
      vi = ctx.fv;
    const c = D.H[ci][0],
      v = D.V[vi][0];
    const s = D.compose(c, v);
    ctx.fs = s;
    U.replay(ctx.mac, "run");
    this.clunk(ctx);
    ctx.outF.className = "hmOut";
    ctx.outF.querySelectorAll(".hmTag").forEach((x) => x.remove());
    const box = ctx.sylF;
    this.sylSet(box, { c, v, cc: D.CC[ci], vc: D.VC[vi] });
    this.flyIn(box.pc, ctx.hopC);
    this.flyIn(box.pv, ctx.hopV);
    ctx.hint(null);
    ctx.after(quick ? 380 : 650, () => {
      if (tk !== ctx.mTok || ctx.st !== 1) return;
      self.fuse(box, s);
      self.boomFx(ctx, box);
      const w = D.wordFor(s);
      if (w) ctx.outF.appendChild(U.el("span", "hmTag", KP.E(w[1]) + "<span>" + w[0] + "</span>"));
      if (quick) KP.voice.say(s + "!");
      else self.sayMerge(ctx, ci, vi);
      ctx.freeMade++;
      const r = self.addDex(ctx, s);
      if (r.fresh) ctx.freeNew++;
      if (ctx.freeMade === 3) ctx.after(2600, () => ctx.st === 1 && tk === ctx.mTok && KP.voice.say("모음만 바꿔 봐요! 가, 갸, 거, 겨!"));
      ctx.hint(() => (ctx.spin.style.visibility ? null : ctx.spin), self.TX.spin);
      // 칭찬: 도감 한 줄·전부 채움, 또는 새 글자 6개마다 (자유 놀이라 열쇠 별은 없음)
      const o = self.dexWin(r, r.fresh && ctx.freeNew % 6 === 0 ? { msg: "{부름} 글자 박사!" } : null);
      if (o)
        ctx.after(quick ? 900 : 2400, async () => {
          if (ctx.st !== 1) return;
          ctx._fewChoice = true; // 자유 놀이: 열쇠 별 없이 칭찬만
          ctx.score.add();
          await ctx.win(o);
        });
    });
  },

  /* ================= 2~5단계 공통 ================= */
  next(ctx) {
    ctx.tk = (ctx.tk || 0) + 1;
    ctx.q.innerHTML = "";
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
  /** 묻는 카드: 그림(+낱말, 첫 글자는 ?) 또는 귀 */
  askCard(ctx, o) {
    const U = KP.u;
    const a = U.el("div", "hmAsk" + (o.ear ? " ear" : ""));
    a.innerHTML = KP.E(o.em) + (o.word ? '<span class="hmW">' + o.word + "</span>" : "");
    if (o.tap) ctx.tap(a, o.tap);
    return a;
  },
  /** 맞는 보기 버튼에서 조각이 날아오는 연출 */
  flyFromBtn(ctx, el, btn) {
    if (btn) this.flyIn(el, btn);
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
    const top = U.el("div", "hmTop");
    const ask = pic
      ? this.askCard(ctx, { em: w[1], word: "<i>?</i>" + w[0].slice(1), tap: () => KP.voice.say(w[0] + "!") })
      : this.askCard(ctx, { em: "👂", ear: true, tap: () => KP.voice.say(s + "!") });
    const mac = U.el("div", "hmMac");
    const hc = U.el("div", "hmHop"),
      hv = U.el("div", "hmHop");
    hc.dataset.l = "자음";
    hv.dataset.l = "모음";
    const out = U.el("div", "hmOut empty");
    const box = this.mkSyl();
    out.appendChild(box);
    mac.append(hc, U.el("span", "hmOp", "+"), hv, U.el("span", "hmOp", "="), out);
    top.append(ask, mac);
    const step = U.el("div", "hmStep", "① 자음");
    const ans = U.el("div", "hmAns");
    const right = U.el("div", "hmRight");
    right.append(step, ans);
    ctx.q.append(top, right);
    const T = this.TX;
    ctx.say("🔨 " + U.josa(s, "을/를") + " 만들어 봐요!", T.make(s, pic && w));
    const b1 = ctx.choices(ans, this.consOpts(ctx, c, 3), {
      cls: "hmOpt",
      render: (x) => x,
      right: (x) => x === c,
      wrongMsg: () => T.cWrong(s),
      onRight: async (x, b) => {
        self.fillHop(ctx, hc, c, D.CC[ci], true);
        self.flyIn(hc, b);
        KP.audio.sfx("good");
        KP.voice.say(T.cRight(nm));
        await ctx.wait(700);
        if (tk !== ctx.tk) return;
        step.textContent = "② 모음";
        const b2 = ctx.choices(ans, self.vowOpts(ctx, v, 3), {
          cls: "hmOpt",
          render: (x) => x,
          right: (x) => x === v,
          wrongMsg: () => T.vWrong(s, snd),
          onRight: async (x2, bb) => {
            self.fillHop(ctx, hv, v, D.VC[vi], true);
            self.flyIn(hv, bb);
            await ctx.wait(350);
            if (tk !== ctx.tk) return;
            U.replay(mac, "run");
            self.clunk(ctx);
            out.className = "hmOut";
            self.sylSet(box, { c, v, cc: D.CC[ci], vc: D.VC[vi] });
            self.flyIn(box.pc, hc);
            self.flyIn(box.pv, hv);
            await ctx.wait(650);
            if (tk !== ctx.tk) return;
            self.fuse(box, s);
            self.boomFx(ctx, box);
            if (pic) {
              ask.innerHTML = KP.E(w[1]) + '<span class="hmW"><i>' + s + "</i>" + w[0].slice(1) + "</span>";
              U.replay(ask, "yay");
            }
            KP.voice.say(self.mergeLine(ci, vi, true));
            self.done(ctx, tk, "글자 완성!", self.addDex(ctx, s), 2200);
          },
        });
        ctx.hint(() => b2.find((b) => b.dataset.right), T.vWrong(s, snd));
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
    const top = U.el("div", "hmTop");
    const ask = this.askCard(ctx, { em: w[1], tap: () => KP.voice.say(w[0] + "!") });
    const slots = U.el("div", "hmSlots");
    const sl = syl.map(() => U.el("div", "hmSlot"));
    slots.append(...sl);
    top.append(ask, slots);
    const step = U.el("div", "hmStep");
    const ans = U.el("div", "hmAns");
    const right = U.el("div", "hmRight");
    right.append(step, ans);
    ctx.q.append(top, right);
    const T = this.TX;
    ctx.say("🧱 " + w[0] + "! 글자 칸을 채워요!", T.w1(w[0]));
    const made = [];
    const ask1 = (k) => {
      sl.forEach((x, j) => x.classList.toggle("now", j === k));
      step.textContent = k + 1 + " / " + syl.length;
      const t = syl[k];
      const btns = ctx.choices(ans, this.sylOpts(ctx, t, syl.filter((x) => x !== t)), {
        cls: "hmOpt",
        render: (x) => x,
        right: (x) => x === t,
        wrongMsg: () => T.wWrong(w[0], k),
        onRight: async (x, b) => {
          const slot = sl[k];
          slot.textContent = t;
          slot.classList.remove("now");
          slot.classList.add("full");
          self.flyIn(slot, b);
          KP.audio.sfx("good");
          made.push(self.addDex(ctx, t));
          if (k + 1 < syl.length) {
            KP.voice.say(T.w2(t));
            await ctx.wait(650);
            if (tk !== ctx.tk) return;
            ask1(k + 1);
          } else {
            await ctx.wait(450);
            if (tk !== ctx.tk) return;
            U.replay(slots, "yay");
            KP.audio.sfx("sparkle");
            KP.voice.say(T.wDone(w[0]));
            const r = { all: made.some((m) => m.all), row: (made.find((m) => m.row >= 0) || { row: -1 }).row };
            self.done(ctx, tk, "딩동댕!", r, 1500);
          }
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
    const s = this.pickNew(ctx, ctx.ALL.filter((x) => D.wordFor(x)).concat(ctx.ALL), "last4");
    const ci = ctx.ci(s),
      vi = ctx.vi(s);
    const [c, nm] = D.H[ci];
    const [v, snd] = D.V[vi];
    const w = D.wordFor(s);
    const top = U.el("div", "hmTop");
    const wrap = U.el("div", "hmCutWrap");
    const out = U.el("div", "hmOut");
    const box = this.mkSyl();
    box.g.textContent = s;
    out.appendChild(box);
    wrap.appendChild(out);
    top.appendChild(wrap);
    if (w) top.appendChild(this.askCard(ctx, { em: w[1], word: w[0], tap: () => KP.voice.say(w[0] + "의 " + s + "!") }));
    ctx.tap(out, () => KP.voice.say(s + "!"));
    const step = U.el("div", "hmStep");
    const ans = U.el("div", "hmAns");
    const right = U.el("div", "hmRight");
    right.append(step, ans);
    ctx.q.append(top, right);
    const T = this.TX;
    ctx.say("✂️ " + T.cut(s));
    // 가위가 자음과 모음 사이(세로 모음은 세로로, 가로 모음은 가로로)를 지나감
    const cut = U.el("div", "hmCut", KP.E("✂️"));
    wrap.appendChild(cut);
    const tall = D.isTall(v);
    ctx.after(500, () => {
      if (tk !== ctx.tk) return;
      const W = out.offsetWidth,
        H = out.offsetHeight,
        cw = cut.offsetWidth,
        ch = cut.offsetHeight;
      if (tall) {
        cut.style.left = W * 0.53 - cw / 2 + "px";
        cut.style.top = -ch * 0.6 + "px";
        cut.style.transform = "rotate(90deg)";
        requestAnimationFrame(() => (cut.style.transform = "translateY(" + (H + ch * 0.2) + "px) rotate(90deg)"));
      } else {
        cut.style.top = H * 0.5 - ch / 2 + "px";
        cut.style.left = -cw * 0.6 + "px";
        requestAnimationFrame(() => (cut.style.transform = "translateX(" + (W + cw * 0.2) + "px)"));
      }
      KP.audio.noise({ dur: 0.08, vol: 0.18, hp: 2500 });
      KP.audio.noise({ dur: 0.08, vol: 0.18, hp: 2500, when: 0.3 });
    });
    ctx.after(1350, () => {
      if (tk !== ctx.tk) return;
      cut.remove();
      self.sylSet(box, { lay: v, q: true });
      KP.audio.sfx("pop");
      askC();
    });
    const askC = () => {
      step.textContent = "① 자음";
      KP.voice.say(T.cutC);
      const b1 = ctx.choices(ans, self.consOpts(ctx, c, 3), {
        cls: "hmOpt",
        render: (x) => x,
        right: (x) => x === c,
        wrongMsg: () => T.cutCWrong(s),
        onRight: async (x, b) => {
          self.sylSet(box, { lay: v, c, cc: D.CC[ci], q: true });
          self.flyIn(box.pc, b);
          KP.audio.sfx("good");
          KP.voice.say(T.cRight(nm));
          await ctx.wait(700);
          if (tk !== ctx.tk) return;
          step.textContent = "② 모음";
          const b2 = ctx.choices(ans, self.vowOpts(ctx, v, 3), {
            cls: "hmOpt",
            render: (x) => x,
            right: (x) => x === v,
            wrongMsg: () => T.cutVWrong(s, snd),
            onRight: async (x2, bb) => {
              self.sylSet(box, { c, v, cc: D.CC[ci], vc: D.VC[vi] });
              self.flyIn(box.pv, bb);
              KP.audio.sfx("good");
              await ctx.wait(650);
              if (tk !== ctx.tk) return;
              self.clunk(ctx);
              self.fuse(box, s);
              self.boomFx(ctx, box);
              KP.voice.say(self.mergeLine(ci, vi, false));
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
    const ci = ctx.ci(base),
      vi = ctx.vi(base);
    const jn = D.nameOfC(j);
    const jc = D.CC[Math.max(0, D.H.findIndex((h) => h[0] === j))];
    const top = U.el("div", "hmTop");
    const ask = this.askCard(ctx, { em: w[1], tap: () => KP.voice.say(s + "!") });
    const mac = U.el("div", "hmMac");
    const out = U.el("div", "hmOut");
    const box = this.mkSyl();
    box.g.textContent = base;
    out.appendChild(box);
    const hj = U.el("div", "hmHop");
    hj.dataset.l = "받침";
    mac.append(out, U.el("span", "hmOp", "+"), hj);
    top.append(ask, mac);
    ctx.tap(out, () => KP.voice.say(base + "!"));
    const step = U.el("div", "hmStep", "받침");
    const ans = U.el("div", "hmAns");
    const right = U.el("div", "hmRight");
    right.append(step, ans);
    ctx.q.append(top, right);
    const T = this.TX;
    ctx.say("👇 " + T.bat(s, base));
    const btns = ctx.choices(ans, this.consOpts(ctx, j, 3, ctx.JPOOL), {
      cls: "hmOpt",
      render: (x) => x,
      right: (x) => x === j,
      wrongMsg: () => T.batWrong(s),
      onRight: async (x, b) => {
        self.fillHop(ctx, hj, j, jc, true);
        self.flyIn(hj, b);
        await ctx.wait(400);
        if (tk !== ctx.tk) return;
        // 받침 없는 글자가 조각으로 풀렸다가 → 위로 올라가고 받침이 아래로 쏙
        box.classList.add("noAnim");
        self.sylSet(box, { c, v, cc: D.CC[ci], vc: D.VC[vi] });
        void box.offsetWidth;
        box.classList.remove("noAnim");
        U.replay(mac, "run");
        self.clunk(ctx);
        requestAnimationFrame(() => {
          if (tk !== ctx.tk) return;
          self.sylSet(box, { c, v, j, cc: D.CC[ci], vc: D.VC[vi], jc });
          self.flyIn(box.pj, hj);
          hj.textContent = "";
          hj.className = "hmHop";
        });
        await ctx.wait(800);
        if (tk !== ctx.tk) return;
        self.fuse(box, s);
        self.boomFx(ctx, box);
        U.replay(ask, "yay");
        KP.voice.say(T.batRight(base, jn, s));
        self.done(ctx, tk, "글자 완성!", null, 2000);
      },
    });
    ctx.hint(() => btns.find((bb) => bb.dataset.right), T.batWrong(s).replace("아니에요! ", ""));
  },

  /* ================= 도감 ================= */
  dexShow(ctx) {
    const U = KP.u,
      D = ctx.D,
      self = this;
    const box = ctx.dexBox;
    box.innerHTML = "";
    const n = ctx.dex.size;
    box.appendChild(U.el("div", "hmDexTop", KP.E("📒") + "<span><b>" + n + "</b> / " + ctx.ALL.length + "</span>"));
    const grid = U.el("div", "hmGridD");
    grid.appendChild(U.el("span", "hmDh v", ""));
    D.V.forEach(([v]) => grid.appendChild(U.el("span", "hmDh v", v)));
    D.H.forEach(([c, nm], ci) => {
      const row = ctx.ALL.slice(ci * 10, ci * 10 + 10);
      const full = row.every((x) => ctx.dex.has(x));
      const h = U.btn(c, "hmDh");
      h.style.setProperty("--c", D.CC[ci]);
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
    box.appendChild(grid);
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
      "자음 하나, 모음 하나를 골라요. 둘이 만나면 글자가 돼요!", T.hintC, "이번엔 아래에서 모음을 골라요!", "위에서 자음도 골라요!", "모음만 바꿔 봐요! 가, 갸, 거, 겨!", T.spin,
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
