/* 사계절 나무 — 씨앗이 나무가 되고, 봄 → 여름 → 가을 → 겨울 → 다시 봄 (계절 변화와 순환)
   1단계: 씨앗 심기·물·해님 → 나무. 계절마다 행동 하나
          봄 꽃봉오리 콕콕(꽃·나비) / 여름 구름 눌러 소나기(매미) / 가을 사과 따서 바구니(낙엽) / 겨울 눈사람 만들기(눈·앙상한 가지)
          한 바퀴(사계절)는 단계가 올라가도 끝까지 이어서 함
   2단계: 지금 계절을 보고 '다음은 어떤 계절?' (보기 4개 그림)
   3단계: 계절 물건(벚꽃·수박·밤·장갑…)을 끌어서 알맞은 계절 나무에 넣기 (나무 4그루)
   - 날씨 옷 입히기(dress)와 달리 옷이 아니라 '자연이 바뀌는 모습' 중심. 한국 사계절 기준 */
"use strict";
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
    KP.css("seasons", `
      .ss{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .ssScene{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);container-type:size;background:#bfe6ff}
      .ssSky{position:absolute;inset:0;opacity:0;transition:opacity 1.4s}
      .ssSky.on{opacity:1}
      .ssSky.k0{background:linear-gradient(#9fdcff,#e8f8ff)}
      .ssSky.k1{background:linear-gradient(#4fbdff,#c6eeff)}
      .ssSky.k2{background:linear-gradient(#ffc98a,#fff1dc)}
      .ssSky.k3{background:linear-gradient(#b9cbe3,#eef4fb)}
      .ssGround{position:absolute;left:-6%;right:-6%;bottom:0;height:20%;border-radius:50% 50% 0 0/40% 40% 0 0;background:var(--gr);transition:background-color 1.4s}
      .ssScene{--gr:#9be07a}
      .ssScene.s1{--gr:#5cbf4c}
      .ssScene.s2{--gr:#d8ad62}
      .ssScene.s3{--gr:#ffffff}
      .ssScene.s3 .ssGround{box-shadow:0 -4px 0 #dfe9f6 inset}
      .ssTree{position:absolute;left:50%;bottom:8cqh;height:min(80cqh,calc(86cqw * 1.133));aspect-ratio:300/340;transform:translateX(-50%);z-index:2}
      .ssTreeArt{position:absolute;inset:0;transform-origin:50% 97%;transition:transform 1.6s cubic-bezier(.3,1.25,.5,1),opacity .6s}
      .ssTreeArt svg{width:100%;height:100%;display:block;overflow:visible}
      .ssScene.seed .ssTreeArt{transform:scale(.08);opacity:0}
      .ssLeaf{transition:fill 1.4s,opacity 1.2s,transform 1.2s;transform-box:fill-box;transform-origin:center}
      .ssLeaf.a{fill:#a6e486}.ssLeaf.b{fill:#86d56e}.ssLeaf.c{fill:#97dd78}
      .s1 .ssLeaf.a{fill:#3faf47}.s1 .ssLeaf.b{fill:#2e9a3d}.s1 .ssLeaf.c{fill:#38a543}
      .s2 .ssLeaf.a{fill:#ff9b3d}.s2 .ssLeaf.b{fill:#e8563b}.s2 .ssLeaf.c{fill:#ffc935}
      .s3 .ssLeaf{opacity:0;transform:scale(.4)}
      .ssCap{opacity:0;transition:opacity 1.4s}
      .s3 .ssCap{opacity:1}
      .ssSpot{position:absolute;width:20%;aspect-ratio:1;margin:-10% 0 0 -10%;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:transform .3s,opacity .5s}
      .ssSpot .e{width:100%;height:100%}
      .ssSpot.bud::before{content:"";width:46%;height:56%;border-radius:50% 50% 46% 46%;background:radial-gradient(circle at 40% 35%,#ffe1ec,#ff9fc0 60%,#e8789f);box-shadow:0 0 0 4px rgba(255,255,255,.55);animation:ssBud 1.8s ease-in-out infinite}
      @keyframes ssBud{50%{transform:scale(1.12)}}
      .ssSpot.open{animation:ssBloom .5s cubic-bezier(.3,1.6,.5,1)}
      @keyframes ssBloom{from{transform:scale(.2) rotate(-40deg)}}
      .ssSpot.gone{opacity:0;transform:scale(.3)}
      .ssSpot.fruit .e{animation:ssSwing 2.6s ease-in-out infinite;transform-origin:50% 0}
      @keyframes ssSwing{50%{transform:rotate(8deg)}}
      .ssMound{position:absolute;left:50%;bottom:4cqh;width:max(90px,26cqmin);height:max(44px,11cqmin);transform:translateX(-50%);z-index:3;border-radius:50% 50% 40% 40%;background:radial-gradient(ellipse at 50% 30%,#b47c46,#8a5a2e);box-shadow:0 6px 0 rgba(0,0,0,.12)}
      .ssMound::after{content:"";position:absolute;left:44%;top:22%;width:12%;height:30%;border-radius:50%;background:#5e3a1a;opacity:0;transition:opacity .3s}
      .ssMound.seeded::after{opacity:1}
      .ssMound.wet{background:radial-gradient(ellipse at 50% 30%,#7a4f2a,#55351a)}
      .ssSprout{position:absolute;left:50%;bottom:9cqh;width:max(60px,16cqmin);transform:translateX(-50%) scale(0);transform-origin:50% 100%;transition:transform .7s cubic-bezier(.3,1.6,.5,1);z-index:3;pointer-events:none}
      .ssSprout svg{width:100%;display:block}
      .ssSprout.on{transform:translateX(-50%) scale(1)}
      .ssBtn{position:absolute;z-index:5;display:flex;align-items:center;justify-content:center;transition:transform .5s,opacity .5s;filter:drop-shadow(0 6px 4px rgba(0,0,0,.15))}
      .ssBtn .e{width:100%;height:100%}
      .ssBtn.off{opacity:0;pointer-events:none;transform:scale(.4)}
      .ssSun{right:4cqw;top:5cqh;width:max(80px,20cqmin);height:max(80px,20cqmin)}
      .ssSun .e{animation:grSunS 8s linear infinite}
      @keyframes grSunS{to{transform:rotate(360deg)}}
      .ssSun.shine::before{content:"";position:absolute;inset:-50%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,120,.9),rgba(255,236,120,0) 65%);animation:ssGlow 1.4s ease-out}
      @keyframes ssGlow{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
      .ssCloud{left:2%;top:-12%;width:max(100px,44%);aspect-ratio:1.35}
      .ssCloud.off{transform:translateX(-120%)}
      .ssCloud.rain .e{filter:brightness(.85)}
      .ssCan{left:calc(50% - max(45px,13cqmin) - max(90px,22cqmin) - 3cqmin);bottom:12cqh;width:max(90px,22cqmin);height:max(70px,17cqmin)}
      .ssCan svg{width:100%;height:100%;transition:transform .3s;transform-origin:70% 60%}
      .ssCan.pour svg{transform:rotate(-30deg)}
      .ssBasket{right:5cqw;bottom:4cqh;width:max(84px,22cqmin);height:max(84px,22cqmin);flex-direction:column}
      .ssBasket b{position:absolute;right:-6%;top:-6%;min-width:1.7em;height:1.7em;border-radius:1em;background:#fff;color:var(--coral);font-size:max(18px,4.5cqmin);font-weight:400;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)}
      .ssMan{left:7cqw;bottom:4cqh;width:max(90px,24cqmin);height:max(130px,36cqmin);align-items:flex-end;filter:none}
      .ssMan i{position:absolute;left:50%;border-radius:50%;background:radial-gradient(circle at 38% 30%,#fff,#e4edf8);box-shadow:0 4px 0 rgba(120,150,200,.35);transform:translateX(-50%) scale(0);transition:transform .45s cubic-bezier(.3,1.6,.5,1)}
      .ssMan .pile{width:100%;height:30%;bottom:0;border-radius:50% 50% 12% 12%;transform:translateX(-50%) scale(1)}
      .ssMan .b1{width:84%;aspect-ratio:1;bottom:2%}
      .ssMan .b2{width:58%;aspect-ratio:1;bottom:52%}
      .ssMan .fc{position:absolute;left:50%;bottom:62%;width:40%;height:24%;transform:translateX(-50%) scale(0);transition:transform .4s cubic-bezier(.3,1.6,.5,1)}
      .ssMan .fc::before,.ssMan .fc::after{content:"";position:absolute;top:10%;width:16%;aspect-ratio:1;border-radius:50%;background:#2f3a4a}
      .ssMan .fc::before{left:14%}.ssMan .fc::after{right:14%}
      .ssMan .fc u{position:absolute;left:44%;top:46%;width:0;height:0;border-left:max(14px,3.4cqmin) solid #ff8a2a;border-top:max(4px,1cqmin) solid transparent;border-bottom:max(4px,1cqmin) solid transparent}
      .ssMan .sc{position:absolute;left:50%;bottom:50%;width:56%;height:8%;border-radius:8px;background:#ff5d73;transform:translateX(-50%) scale(0);transition:transform .4s}
      .ssMan[data-n="1"] .pile,.ssMan[data-n="2"] .pile,.ssMan[data-n="3"] .pile{transform:translateX(-50%) scale(0)}
      .ssMan[data-n="1"] .b1,.ssMan[data-n="2"] .b1,.ssMan[data-n="3"] .b1{transform:translateX(-50%) scale(1)}
      .ssMan[data-n="2"] .b2,.ssMan[data-n="3"] .b2{transform:translateX(-50%) scale(1)}
      .ssMan[data-n="3"] .fc,.ssMan[data-n="3"] .sc{transform:translateX(-50%) scale(1)}
      .ssBug{position:absolute;left:0;top:0;width:max(40px,9cqmin);height:max(40px,9cqmin);z-index:4;pointer-events:none;display:none}
      .ssBug.on{display:block}
      .ssBug .e{width:100%;height:100%}
      .ssCic{position:absolute;left:54%;top:66%;width:13%;z-index:3;pointer-events:none;opacity:0;transform:scale(.3);transition:opacity .5s,transform .5s}
      .ssCic.on{opacity:1;transform:none}
      .ssCic svg{width:100%;display:block}
      .ssCic.sing svg{animation:ssBuzz .12s linear infinite}
      @keyframes ssBuzz{50%{transform:translateX(2px)}}
      .ssMeme{position:absolute;left:68%;top:56%;z-index:4;background:#fff;border-radius:16px;padding:4px 10px;font-size:max(16px,4cqmin);color:var(--ink);box-shadow:var(--shadow);opacity:0;transition:opacity .4s;pointer-events:none;white-space:nowrap}
      .ssMeme.on{opacity:1}
      .ssFx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4}
      .ssTap{position:absolute;z-index:3;left:2%;right:2%;top:2%;bottom:30%}
      .ssAsk{display:flex;gap:clamp(8px,1.6vw,18px);justify-content:center;flex:0 0 auto}
      .ssAsk .choice{flex:0 1 clamp(84px,min(17vw,19vh),160px);min-width:0;aspect-ratio:1/1.1;min-height:0;padding:6px;flex-direction:column;gap:2px;font-size:clamp(18px,2.6vw,26px)}
      .ssAsk .choice svg,.ssMini svg{width:100%;flex:1;min-height:0;display:block}
      .ssSort{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:minmax(0,1fr) auto;gap:clamp(8px,1.4vw,16px)}
      .ssMini{min-height:0;border-radius:24px;padding:6px 6px 4px;display:flex;flex-direction:column;align-items:center;box-shadow:0 6px 0 rgba(47,58,102,.12);font-size:clamp(18px,2.6vw,28px);color:var(--ink);transition:transform .2s}
      .ssMini.k0{background:linear-gradient(#d7f1ff,#eefbe8)}
      .ssMini.k1{background:linear-gradient(#b5e6ff,#e1f7d6)}
      .ssMini.k2{background:linear-gradient(#ffe0b8,#fff4e2)}
      .ssMini.k3{background:linear-gradient(#dbe5f2,#fafcff)}
      .ssMini.dropHover{transform:scale(1.05);box-shadow:0 0 0 5px #ffd23f,0 6px 0 rgba(47,58,102,.12)}
      .ssMini .got{display:flex;flex-wrap:wrap;justify-content:center;min-height:1.2em;font-size:clamp(26px,3.6vw,40px);line-height:1}
      .ssMini .got .e{width:1em;height:1em;animation:popIn .3s}
      .ssTray{grid-column:1/-1;display:flex;gap:clamp(14px,3vw,36px);justify-content:center;align-items:center;min-height:clamp(84px,13vh,130px)}
      .ssItem{width:clamp(72px,min(11vw,13vh),112px);height:clamp(72px,min(11vw,13vh),112px);background:#fff;border-radius:24px;box-shadow:0 6px 0 rgba(47,58,102,.14);position:relative;flex:none}
      .ssItem .e{position:absolute;left:14%;top:14%;width:72%;height:72%}
      .ssItem.dragging{z-index:50;position:relative}
      @media (max-aspect-ratio:3/4){
        .ssSort{grid-template-columns:repeat(2,1fr);grid-template-rows:minmax(0,1fr) minmax(0,1fr) auto}
        .ssAsk{display:grid;grid-template-columns:repeat(4,1fr)}
        .ssAsk .choice{aspect-ratio:auto;height:clamp(84px,13vh,140px)}
      }
      @media (orientation:landscape) and (max-height:520px){
        .ss{flex-direction:row}
        .ssAsk{display:grid;grid-template-columns:repeat(2,auto);align-content:center}
        .ssAsk .choice{width:min(23vh,120px);height:min(37vh,130px);aspect-ratio:auto;flex:none;font-size:16px}
        .ssSort{grid-template-columns:repeat(4,1fr) auto;grid-template-rows:minmax(0,1fr)}
        .ssTray{grid-column:auto;flex-direction:column;gap:8px;min-height:0}
        .ssItem{width:min(22vh,84px);height:min(22vh,84px)}
        .ssMini .got{font-size:24px}
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
    KP.loadE(["🌸", "🍎", "🦋", "☀️", "☁️", "🧺"]);

    /* ---------- 나무 그림 ---------- */
    const BR = "#8a5a35";
    // 가지 (겨울에는 같은 선을 흰색으로 살짝 위에 겹쳐 '눈 쌓인 가지')
    const BRANCH =
      '<path d="M147 240 Q112 210 78 176" stroke-width="11"/><path d="M153 228 Q190 200 224 168" stroke-width="11"/>' +
      '<path d="M150 210 Q138 160 116 112" stroke-width="9"/><path d="M150 210 Q166 150 188 104" stroke-width="9"/>' +
      '<path d="M98 194 Q80 168 74 140" stroke-width="6"/><path d="M206 186 Q224 164 232 136" stroke-width="6"/>' +
      '<path d="M124 128 Q104 110 96 90" stroke-width="5"/><path d="M182 118 Q202 100 206 80" stroke-width="5"/>';
    const treeSVG =
      '<svg viewBox="0 0 300 340">' +
      '<path d="M134 336 Q140 270 141 205 L159 205 Q160 270 166 336Z" fill="' + BR + '"/>' +
      '<g fill="none" stroke="' + BR + '" stroke-linecap="round"><path d="M150 214 L150 70" stroke-width="10"/>' + BRANCH + "</g>" +
      '<g class="ssCap" fill="none" stroke="#fff" stroke-linecap="round" transform="translate(0 -4)"><path d="M150 76 L150 70" stroke-width="12"/>' +
      BRANCH.replace(/stroke-width="(\d+)"/g, (m, w) => 'stroke-width="' + Math.max(4, w - 4) + '"') + "</g>" +
      '<g><circle class="ssLeaf b" cx="98" cy="150" r="50"/><circle class="ssLeaf b" cx="204" cy="150" r="50"/>' +
      '<circle class="ssLeaf c" cx="150" cy="160" r="52"/><circle class="ssLeaf a" cx="114" cy="92" r="46"/>' +
      '<circle class="ssLeaf c" cx="188" cy="92" r="46"/><circle class="ssLeaf a" cx="150" cy="66" r="44"/>' +
      '<circle class="ssLeaf a" cx="150" cy="118" r="50"/></g></svg>';
    // 작은 나무 (2단계 보기·3단계 나무)
    function miniSVG(k) {
      const L = [["#a6e486", "#86d56e"], ["#3faf47", "#2e9a3d"], ["#ff9b3d", "#e8563b"], null][k];
      const gr = ["#9be07a", "#5cbf4c", "#d8ad62", "#ffffff"][k];
      let s = '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="97" rx="48" ry="9" fill="' + gr + '"' + (k === 3 ? ' stroke="#cfdbea" stroke-width="2"' : "") + "/>" +
        '<path d="M45 96 L47 62 L53 62 L55 96Z" fill="' + BR + '"/>' +
        '<g fill="none" stroke="' + BR + '" stroke-linecap="round" stroke-width="4"><path d="M49 72 Q36 60 26 50"/><path d="M51 70 Q64 58 74 48"/><path d="M50 66 L50 24"/><path d="M50 60 Q42 44 36 34"/><path d="M50 58 Q58 42 64 32"/></g>';
      if (L)
        s += '<circle cx="32" cy="50" r="17" fill="' + L[1] + '"/><circle cx="68" cy="50" r="17" fill="' + L[1] + '"/><circle cx="50" cy="52" r="18" fill="' + L[0] + '"/>' +
          '<circle cx="40" cy="32" r="16" fill="' + L[0] + '"/><circle cx="60" cy="32" r="16" fill="' + L[1] + '"/><circle cx="50" cy="22" r="14" fill="' + L[0] + '"/>';
      if (k === 0) [[34, 44], [62, 30], [50, 54], [44, 22], [70, 52], [28, 30]].forEach(([x, y]) => (s += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#ff9fc0" stroke="#fff" stroke-width="2"/>'));
      if (k === 1) s += '<circle cx="88" cy="12" r="9" fill="#ffd23f"/>';
      if (k === 2) [[36, 46], [62, 34], [54, 56], [70, 50]].forEach(([x, y]) => (s += '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="#e8253f"/>'));
      if (k === 3) {
        s += '<g stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"><path d="M28 48 Q38 56 46 66"/><path d="M72 46 Q62 56 54 66"/><path d="M37 33 Q42 42 48 54"/><path d="M63 31 Q58 42 52 54"/><path d="M47 25 L53 25"/></g>';
        [[14, 20], [86, 30], [22, 70], [80, 74], [70, 14]].forEach(([x, y]) => (s += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#fff" stroke="#cfdbea"/>'));
      }
      return s + "</svg>";
    }
    const canSVG =
      '<svg viewBox="0 0 160 120"><path d="M112 54 L154 22 L158 30 L122 66Z" fill="#3fb0c9" stroke="#2c5a6b" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M28 40 Q22 6 64 8 Q104 10 98 40" fill="none" stroke="#2c5a6b" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M22 44 H118 L110 112 H30Z" fill="#ffb347" stroke="#7a4a1e" stroke-width="5" stroke-linejoin="round"/><circle cx="66" cy="80" r="10" fill="#fff" opacity=".7"/></svg>';
    const sproutSVG =
      '<svg viewBox="0 0 60 60"><path d="M30 60 Q29 44 30 30" stroke="#3ea33f" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M30 34 Q14 18 4 26 Q14 40 30 34Z" fill="#5fc95a" stroke="#2b7a2e" stroke-width="2.5"/><path d="M30 30 Q46 12 57 20 Q46 36 30 30Z" fill="#5fc95a" stroke="#2b7a2e" stroke-width="2.5"/></svg>';
    const cicSVG =
      '<svg viewBox="0 0 40 56"><path d="M8 18 Q-2 40 14 52 L20 26Z" fill="rgba(220,240,255,.85)" stroke="#6a8aa0" stroke-width="1.5"/><path d="M32 18 Q42 40 26 52 L20 26Z" fill="rgba(220,240,255,.85)" stroke="#6a8aa0" stroke-width="1.5"/>' +
      '<ellipse cx="20" cy="28" rx="8" ry="16" fill="#5a4030"/><ellipse cx="20" cy="12" rx="10" ry="7" fill="#6b4c38"/><circle cx="12" cy="11" r="3.5" fill="#2a1c12"/><circle cx="28" cy="11" r="3.5" fill="#2a1c12"/></svg>';

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "ss");
    const scene = U.el("div", "ssScene");
    const skies = SEA.map((_, k) => {
      const s = U.el("div", "ssSky k" + k);
      scene.appendChild(s);
      return s;
    });
    scene.append(U.el("div", "ssGround"));
    const tree = U.el("div", "ssTree");
    const art = U.el("div", "ssTreeArt", treeSVG);
    const cic = U.el("div", "ssCic", cicSVG);
    const tapZone = U.el("div", "ssTap"); // 나뭇가지 근처 아무 데나 누르면 가장 가까운 꽃봉오리·사과
    const meme = U.el("div", "ssMeme", "맴맴");
    const mound = U.el("button", "ssMound");
    const sprout = U.el("div", "ssSprout", sproutSVG);
    const sun = U.el("button", "ssBtn ssSun off", KP.E("☀️"));
    const cloud = U.el("button", "ssBtn ssCloud off", KP.E("☁️"));
    const can = U.el("button", "ssBtn ssCan off", canSVG);
    const basket = U.el("button", "ssBtn ssBasket off", KP.E("🧺") + "<b>0</b>");
    const man = U.el("button", "ssBtn ssMan off", '<i class="pile"></i><i class="b1"></i><i class="b2"></i><span class="sc"></span><span class="fc"><u></u></span>');
    const bugs = [0, 1].map(() => U.el("div", "ssBug", KP.E("🦋")));
    const fx = U.el("canvas", "ssFx");
    tree.append(art, cic, meme, tapZone, cloud); // 구름은 나무 위에 (어느 화면이든 비가 나무에 내림)
    scene.append(tree, mound, sprout, sun, can, basket, man, ...bugs, fx);
    const ask = U.el("div", "ssAsk");
    const sort = U.el("div", "ssSort");
    wrap.append(scene, ask, sort);
    ctx.body.appendChild(wrap);
    const fg = fx.getContext("2d");

    // 누를 수 있는 것: 단계마다 _on 을 바꿔 끼움 (지난 판의 기다림은 그냥 버려짐)
    [mound, sun, cloud, can, basket, man, tapZone].forEach((el) => ctx.fast(el, (e) => el._on && el._on(e)));
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
      spots = [],
      bugsOn = false,
      leafRate = 0;
    const alive = (r) => r === rid && ctx._active;
    const SPOT_XY = [[26, 42], [50, 21], [74, 42], [38, 55], [62, 55]];

    function clearSpots() {
      spots.forEach((s) => s.remove());
      spots = [];
    }
    function addSpots(cls, html) {
      clearSpots();
      spots = SPOT_XY.map(([x, y]) => {
        const s = U.el("div", "ssSpot " + cls, html);
        s.style.left = x + "%";
        s.style.top = y + "%";
        tree.appendChild(s);
        return s;
      });
    }
    const off = (el, v) => el.classList.toggle("off", v);
    /** 계절 바꾸기. mode: "act"(아이가 할 일 준비) / "full"(다 된 모습) / "seed"(씨앗 심기 전) */
    function setSeason(k, mode) {
      season = k;
      skies.forEach((s, i) => s.classList.toggle("on", i === k));
      scene.className = "ssScene s" + k + (mode === "seed" ? " seed" : "");
      [sun, cloud, can, basket, man].forEach((b) => {
        off(b, true);
        b._on = null;
      });
      tapZone._on = null;
      mound.style.display = mode === "seed" ? "" : "none";
      mound.classList.remove("seeded", "wet");
      mound._on = null;
      sprout.classList.remove("on");
      cic.classList.remove("on", "sing");
      meme.classList.remove("on");
      bugsOn = false;
      bugs.forEach((b) => b.classList.remove("on"));
      leafRate = 0;
      // 다른 계절의 꽃잎·낙엽·눈은 스르르 사라짐
      parts.forEach((q) => {
        if ((q.k === "snow" && k !== 3) || (q.k === "leaf" && k !== 2) || (q.k === "petal" && k !== 0)) q.f = q.f || 1;
      });
      // 지난 계절의 꽃·사과는 떨어지며 사라짐
      spots.forEach((s) => s.classList.add("gone"));
      const old = spots;
      spots = [];
      setTimeout(() => old.forEach((s) => s.remove()), 600);
      if (mode === "seed") return;
      if (k === 0) {
        if (mode === "act") addSpots("bud", "");
        else {
          addSpots("open", KP.E("🌸"));
          setBugs(true);
        }
      } else if (k === 1) {
        if (mode === "act") off(cloud, false);
        else {
          off(sun, false);
          cic.classList.add("on");
        }
      } else if (k === 2) {
        addSpots("fruit", KP.E("🍎"));
        leafRate = mode === "act" ? 0.5 : 1.6;
        if (mode === "act") {
          basket.querySelector("b").textContent = "0";
          off(basket, false);
        }
      } else {
        man.dataset.n = mode === "act" ? "0" : "3";
        off(man, false);
      }
    }
    function setBugs(on) {
      bugsOn = on;
      bugs.forEach((b) => b.classList.toggle("on", on));
    }

    /* ---------- 캔버스 (꽃잎 · 비 · 낙엽 · 눈 · 물) ---------- */
    let D = 1,
      W = 0,
      H = 0,
      rainT = 0,
      waterT = 0,
      waterAt = null;
    const parts = [];
    function fit() {
      const r = scene.getBoundingClientRect();
      D = Math.min(devicePixelRatio || 1, 1.5); // 저사양 기기 고려
      W = r.width;
      H = r.height;
      const cw = Math.max(1, Math.round(W * D)),
        ch = Math.max(1, Math.round(H * D));
      if (fx.width === cw && fx.height === ch) return; // 크기가 그대로면 다시 만들지 않음 (3단계처럼 숨겨진 동안 매 장면 다시 만들던 것)
      fx.width = cw;
      fx.height = ch;
      fg.setTransform(D, 0, 0, D, 0, 0);
    }
    addEventListener("resize", () => ctx._active && fit());
    const rel = (el) => {
      const a = el.getBoundingClientRect(),
        s = scene.getBoundingClientRect();
      return { x: a.left - s.left, y: a.top - s.top, w: a.width, h: a.height };
    };
    let bugT = 0;
    function step(dt) {
      if (!W) {
        fit();
        if (!W) return; // 화면이 숨겨져 있으면(3단계) 그리지 않음
      }
      const r = Math.random;
      // 만들기
      const n = (kind) => parts.reduce((c, p) => c + (p.k === kind), 0);
      if (season === 0 && bugsOn && r() < dt * 1.6 && n("petal") < 14) parts.push({ k: "petal", x: r() * W, y: -10, vx: 10 + r() * 20, vy: 22 + r() * 18, a: r() * 6, s: 4 + r() * 3 });
      if (season === 2 && leafRate && r() < dt * leafRate && n("leaf") < 18)
        parts.push({ k: "leaf", x: W * (0.3 + r() * 0.4), y: H * (0.2 + r() * 0.3), vx: (r() - 0.5) * 30, vy: 26 + r() * 20, a: r() * 6, s: 6 + r() * 4, c: U.pick(["#ff9b3d", "#e8563b", "#ffc935", "#c9772f"]) });
      if (season === 3 && n("snow") < 60 && r() < dt * 14) parts.push({ k: "snow", x: r() * W, y: -6, vx: (r() - 0.5) * 14, vy: 26 + r() * 30, a: r() * 6, s: 2 + r() * 3 });
      if (rainT > 0) {
        rainT -= dt;
        const c = rel(cloud);
        for (let i = 0; i < 4; i++) parts.push({ k: "rain", x: c.x + c.w * (0.15 + r() * 0.7), y: c.y + c.h * 0.7, vx: 0, vy: 420 + r() * 160, a: 0, s: 1 });
      }
      if (waterT > 0 && waterAt) {
        waterT -= dt;
        for (let i = 0; i < 3; i++) parts.push({ k: "drop", x: waterAt.x + (r() - 0.5) * 16, y: waterAt.y, vx: 60 + r() * 50, vy: 30 + r() * 50, a: 0, s: 1, g: 1 });
      }
      if (parts.length > 260) parts.splice(0, parts.length - 260);
      // 움직이기 · 그리기
      fg.clearRect(0, 0, W, H);
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
        const floor = p.k === "rain" || p.k === "drop" ? H * 0.86 : H + 12;
        if (p.y > floor || p.x < -20 || p.x > W + 20) {
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
      // 나비
      if (bugsOn) {
        bugT += dt;
        bugs.forEach((b, i) => {
          const t = bugT * (0.5 + i * 0.15) + i * 2;
          const x = W * (0.5 + Math.sin(t * 0.8) * 0.32) - 20,
            y = H * (0.3 + Math.sin(t * 1.9) * 0.1 + i * 0.12);
          b.style.transform = "translate(" + x + "px," + y + "px) scaleX(" + (Math.cos(t * 0.8) > 0 ? -1 : 1) + ") rotate(" + Math.sin(t * 9) * 8 + "deg)";
        });
      }
    }

    /* ---------- 소리 ---------- */
    const chime = (i) => A.note(A.SCALE[i % A.SCALE.length], { inst: "bell", dur: 0.45, vol: 0.18 });
    const arp = (ns) => ns.forEach((nn, i) => A.note(nn, { inst: "bell", dur: 0.5, vol: 0.14, when: i * 0.09 }));
    function cicadaSing() {
      cic.classList.add("sing");
      meme.classList.add("on");
      for (let i = 0; i < 4; i++) A.tone(1300, { to: 1500, dur: 0.16, vol: 0.03, when: i * 0.32, type: "triangle" });
      ctx.after(1500, () => {
        cic.classList.remove("sing");
        meme.classList.remove("on");
      });
    }

    /* ---------- 1단계: 씨앗 → 나무 ---------- */
    async function seedPhase(r) {
      setSeason(0, "seed");
      ctx.say("씨앗을 콕 심어 봐요!");
      ctx.hint(() => mound, "흙을 콕 눌러요!");
      await tapOnce(mound);
      if (!alive(r)) return false;
      mound.classList.add("seeded");
      U.replay(mound, "jump");
      A.sfx("drop");
      off(can, false);
      ctx.say("씨앗을 심었어요! 물뿌리개를 눌러 물을 줘요!");
      ctx.hint(() => can, "물뿌리개를 눌러요!");
      await tapOnce(can);
      if (!alive(r)) return false;
      can.classList.add("pour");
      const c = rel(can);
      waterAt = { x: c.x + c.w * 0.95, y: c.y + c.h * 0.25 };
      waterT = 1.1;
      A.sfx("water");
      ctx.after(400, () => A.sfx("water"));
      ctx.hint(null);
      await ctx.wait(1200);
      if (!alive(r)) return false;
      can.classList.remove("pour");
      off(can, true);
      mound.classList.add("wet");
      sprout.classList.add("on");
      A.sfx("sparkle");
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
      sprout.classList.remove("on");
      scene.classList.remove("seed");
      mound.style.display = "none";
      A.sfx("levelup");
      grown = true;
      await ctx.say("쑥쑥 자라서 나무가 됐어요!");
      await ctx.wait(800);
      return alive(r);
    }

    /* ---------- 1단계: 계절마다 할 일 ---------- */
    // 가장 가까운 꽃봉오리·사과 (손가락이 조금 빗나가도)
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
        const left = () => spots.filter((s) => s.classList.contains(cls));
        const hint = () => {
          const l = left();
          if (l.length) ctx.hint(() => left()[0], null);
        };
        hint();
        tapZone._on = (e) => {
          const s = nearSpot(e, left());
          if (!s) return;
          onEach(s);
          if (!left().length) {
            tapZone._on = null;
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
        s.innerHTML = KP.E("🌸");
        U.replay(s, "open");
        A.sfx("pop");
        chime(i++ * 2);
      });
      if (!alive(r)) return false;
      setBugs(true);
      A.sfx("sparkle");
      await ctx.say("꽃이 활짝 피었어요! 나비가 날아왔어요!");
      await ctx.wait(900);
      if (!alive(r)) return false;
      return ctx.win({ msg: "봄 🌸", quiet: true });
    }
    async function summer(r) {
      setSeason(1, "act");
      ctx.say("여름이 왔어요! 구름을 눌러 비를 내려요!");
      for (let k = 0; k < 3; k++) {
        ctx.hint(() => cloud, "구름을 눌러요!");
        await tapOnce(cloud);
        if (!alive(r)) return false;
        ctx.hint(null);
        U.replay(cloud, "jump");
        cloud.classList.add("rain");
        rainT = 1.2;
        A.sfx("water");
        ctx.after(350, () => A.sfx("water"));
        ctx.after(700, () => A.sfx("water"));
        await ctx.wait(1300);
        if (!alive(r)) return false;
        cloud.classList.remove("rain");
      }
      off(cloud, true);
      off(sun, false);
      arp(["G5", "C6", "E6"]);
      await ctx.wait(700);
      if (!alive(r)) return false;
      cic.classList.add("on");
      cicadaSing();
      await ctx.say("시원한 소나기! 매미가 맴맴 노래해요!");
      await ctx.wait(700);
      if (!alive(r)) return false;
      return ctx.win({ msg: "여름 ☀️", quiet: true });
    }
    async function autumn(r) {
      setSeason(2, "act");
      ctx.say("가을이 왔어요! 빨간 사과를 따서 바구니에 담아요!");
      let got = 0;
      await spotsDone("fruit", (s) => {
        s.classList.remove("fruit");
        const a = s.getBoundingClientRect(),
          b = basket.getBoundingClientRect();
        const f = U.el("div", "", KP.E("🍎"));
        Object.assign(f.style, { position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", zIndex: 90, pointerEvents: "none", transition: "transform .7s cubic-bezier(.5,-0.3,.6,1)" });
        document.body.appendChild(f);
        s.style.visibility = "hidden";
        requestAnimationFrame(() => requestAnimationFrame(() => (f.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height * 0.3 - a.top - a.height / 2) + "px) scale(.6)")));
        setTimeout(() => f.remove(), 750);
        A.sfx("pick");
        const n = ++got;
        ctx.after(700, () => {
          basket.querySelector("b").textContent = n;
          U.replay(basket, "bump");
          A.sfx("drop");
        });
      });
      if (!alive(r)) return false;
      await ctx.wait(800);
      if (!alive(r)) return false;
      leafRate = 2.2;
      A.sfx("whoosh");
      await ctx.say("사과를 다 땄어요! 나뭇잎이 알록달록 떨어져요!");
      await ctx.wait(900);
      if (!alive(r)) return false;
      return ctx.win({ msg: "가을 🍁", quiet: true });
    }
    async function winter(r) {
      setSeason(3, "act");
      ctx.say("겨울이 왔어요! 눈을 콕콕 눌러 눈사람을 만들어요!");
      for (let k = 1; k <= 3; k++) {
        ctx.hint(() => man, "눈을 콕 눌러요!");
        await tapOnce(man);
        if (!alive(r)) return false;
        man.dataset.n = String(k);
        A.sfx(k === 3 ? "sparkle" : "boing");
        chime(k * 2);
      }
      ctx.hint(null);
      await ctx.say("눈사람 완성!");
      await ctx.wait(600);
      if (!alive(r)) return false;
      ctx.score.add();
      return ctx.win({ big: true, msg: "{부름} 사계절 박사!" });
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

    /* ---------- 2단계: 다음은 어떤 계절? ---------- */
    let lastQ = -1,
      round2 = 0;
    function quizNext(r) {
      let k = U.rand(4);
      if (k === lastQ) k = (k + 1 + U.rand(3)) % 4;
      lastQ = k;
      setSeason(k, "full");
      const nx = (k + 1) % 4,
        now = SEA[k].name,
        nxt = SEA[nx].name;
      const q = now + " 다음은 어떤 계절일까요?";
      ctx.say("지금은 " + now + "이에요. 다음은 어떤 계절일까요?");
      const btns = ctx.choices(ask, [0, 1, 2, 3], {
        cls: "ssCh",
        render: (v) => miniSVG(v) + "<span>" + SEA[v].name + "</span>",
        right: (v) => v === nx,
        wrongMsg: (v) => (v === k ? "지금이 " + now + "이에요. 그 다음 계절을 찾아봐요!" : q),
        onRight: async () => {
          ctx.hint(null);
          setSeason(nx, "full");
          if (nx === 1) cicadaSing();
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
    function sortNext(r) {
      sort.innerHTML = "";
      const trees = SEA.map((s, k) => {
        const t = U.el("div", "ssMini k" + k, miniSVG(k) + "<span>" + s.name + '</span><div class="got"></div>');
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
      ctx._fewChoice = false; // 나무 4그루 중에서 고름
      let left = pick.length;
      const els = U.shuffle(pick).map((it, i) => {
        const el = U.el("div", "ssItem item", KP.E(it[0]));
        el.style.setProperty("--i", i);
        tray.appendChild(el);
        const d = KP.drag(el, {
          targets: () => trees,
          accept: (t) => +t.dataset.k === it[2],
          onReject: (t) => ctx.miss(t, "음, 다른 계절일까요?"),
          onDrop: (t) => {
            if (!t || !alive(r)) return;
            d.lock();
            el.remove();
            t.querySelector(".got").insertAdjacentHTML("beforeend", KP.E(it[0]));
            U.replay(t, "jump");
            A.sfx("snap");
            chime(it[2] * 2);
            KP.voice.say(it[3]);
            left--;
            if (!left) done();
            else hint();
          },
        });
        el._it = it;
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
    function next() {
      const r = ++rid;
      const lv = ctx.level;
      ctx.hint(null);
      scene.style.display = lv === 3 ? "none" : "";
      ask.style.display = lv === 2 ? "" : "none";
      sort.style.display = lv === 3 ? "" : "none";
      ask.innerHTML = "";
      requestAnimationFrame(fit);
      if (lv === 1) cycle(r);
      else {
        grown = true;
        if (lv === 2) quizNext(r);
        else sortNext(r);
      }
    }
    let loopTok = 0;
    ctx.begin = () => {
      rid++;
      parts.length = 0;
      rainT = waterT = 0;
      round2 = round3 = 0;
      const my = ++loopTok; // 다시 시작하면 옛 그리기 반복은 멈춤 (두 개가 겹쳐 돌지 않게)
      requestAnimationFrame(() => {
        fit();
        ctx.loop((dt) => (my === loopTok ? step(dt) : false));
      });
      next();
    };
  },
  start(ctx) {
    ctx.begin();
  },
});
