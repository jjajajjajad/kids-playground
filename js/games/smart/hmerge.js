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
      .hmMode{position:relative;width:calc(var(--mh) - 9px);height:calc(var(--mh) - 9px);border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;font-size:calc(var(--mh) * .44);line-height:1;
        background:radial-gradient(circle at 35% 28%,#fffaf0,#f0ddc0 60%,#d6b993);box-shadow:inset 0 -3px 4px rgba(120,80,40,.25),0 3px 0 #66391b;transition:transform .15s}
      .hmMode i{position:absolute;right:-3px;top:-3px;width:17px;height:17px;border-radius:50%;background:#66391b;color:#fff;font-size:11px;line-height:17px;font-style:normal;text-align:center}
      .hmMode.sel{background:radial-gradient(circle at 35% 28%,#fff7c8,#ffd45c 60%,#e6a52a);box-shadow:inset 0 -3px 4px rgba(150,90,0,.3),0 3px 0 #66391b,0 0 0 3px #fff1b0;transform:translateY(-2px)}
      .hmMode.sel i{background:#e8604a}
      .hmMode.glow{animation:glow 1s ease-in-out 3}

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
      .hmPlate.now{animation:hmPlateGlow 1.1s ease-in-out infinite alternate}
      @keyframes hmPlateGlow{from{box-shadow:0 0 0 0 rgba(255,236,150,0);background:rgba(255,240,180,0)}to{box-shadow:0 0 0 6px rgba(255,232,130,.95),0 0 26px 10px rgba(255,240,170,.7);background:rgba(255,246,205,.3)}}
      .hmPlate.dropHover,.hmTile.dropHover{box-shadow:0 0 0 7px rgba(255,255,255,.95),0 0 26px 10px rgba(255,236,160,.8)!important;animation:none}
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
      const mh = W < 520 || H < 440 ? 54 : 60;
      wrap.style.setProperty("--mh", mh + "px");
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
