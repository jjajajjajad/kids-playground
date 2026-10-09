/* 얼굴 꾸미기 — 얼굴색·머리·눈·눈썹·코·입·모자·안경을 골라 꾸미기
   - 모든 부위를 SVG로 직접 그림(표정 다양), 보기 단추에는 '그 부위를 바꾼 얼굴'이 미리 보임
   - 얼굴을 누르면 활짝 웃으며 말함, 가끔 눈 깜빡
   - 🎲 랜덤, 📸 사진 찍기 → 내 작품(kind "face")
   - 꾸민 얼굴은 KP.store "face:cfg" 에 저장 → 다시 열어도 그대로 */
"use strict";
KP.game({
  id: "face",
  icon: "🤡",
  name: "얼굴 꾸미기",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("face", `
      .fc{flex:1;min-height:0;display:grid;gap:12px;padding:0 14px 12px;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);grid-template-rows:minmax(0,1fr);grid-template-areas:"face panel"}
      .fc-face{grid-area:face;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;border-radius:28px;
        background:radial-gradient(circle at 50% 45%,#fff 0 30%,#ffe9f3 31% 52%,#fff5d6 53%);box-shadow:var(--shadow);overflow:hidden}
      .fc-face svg{width:100%;height:100%;max-height:100%;display:block}
      .fc-face .bounce{animation:fcBounce .7s cubic-bezier(.3,1.6,.5,1)}
      @keyframes fcBounce{30%{transform:translateY(-6%) scale(1.04)}60%{transform:scale(.97,1.03)}}
      .fc-face g.eyes{transform-box:fill-box;transform-origin:center;transition:transform .08s}
      .fc-face g.eyes.blink{transform:scaleY(.12)}
      .fc-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
      .fc-flash.on{animation:fcFlash .5s ease-out}
      @keyframes fcFlash{from{opacity:1}to{opacity:0}}
      .fc-panel{grid-area:panel;min-height:0;display:flex;flex-direction:column;gap:10px}
      .fc-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;flex:0 0 auto}
      .fc-tab{height:clamp(54px,8vh,68px);border-radius:18px;background:rgba(255,255,255,.75);font-size:clamp(28px,4.4vh,38px);display:flex;align-items:center;justify-content:center;border-bottom:5px solid transparent;transition:transform .12s}
      .fc-tab.sel{background:#fff;border-bottom-color:var(--cat);box-shadow:var(--shadow);transform:translateY(-2px)}
      .fc-opts{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:8px;background:rgba(255,255,255,.55);border-radius:22px;padding:8px}
      .fc-opt{background:#fff;border-radius:16px;box-shadow:0 4px 0 rgba(47,58,102,.12);display:flex;align-items:center;justify-content:center;padding:2px;min-height:0;overflow:hidden;animation:itemIn .3s backwards;animation-delay:calc(var(--i) * 25ms)}
      .fc-opt svg{width:100%;height:100%;max-height:100%}
      .fc-opt.sel{box-shadow:0 0 0 4px var(--sun),0 4px 0 #d9a000;background:#fff8dc}
      .fc-opt:active{transform:scale(.95)}
      .fc-colors{display:flex;gap:8px;justify-content:center;flex:0 0 auto}
      .fc-col{width:clamp(36px,5.4vh,46px);height:clamp(36px,5.4vh,46px);border-radius:50%;border:4px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.14)}
      .fc-col.sel{transform:scale(1.15);box-shadow:0 0 0 3px var(--ink)}
      .fc-acts{display:flex;gap:12px;justify-content:center;flex:0 0 auto}
      .fc-act{font-size:clamp(20px,2.6vw,26px);padding:10px 20px;min-height:62px}
      .fc-act .e{font-size:1.5em}
      @media (max-aspect-ratio:1/1){
        .fc{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(150px,1fr) auto;grid-template-areas:"face" "panel";gap:8px;padding:0 10px 10px}
        .fc-panel{gap:7px}
        .fc-tabs{grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}
        .fc-colors{gap:6px}
        .fc-col{width:min(calc((100vw - 92px) / 8),42px);height:min(calc((100vw - 92px) / 8),42px);border-width:3px}
        .fc-tab{height:56px;font-size:30px;border-radius:14px}
        .fc-opts{grid-auto-rows:clamp(62px,9vh,84px);flex:0 0 auto;padding:6px;gap:6px}
        .fc-act{min-height:56px;padding:8px 16px}
      }
    `);

    const INK = "#3b3552";
    const SKINS = ["#ffe0c4", "#f6c79f", "#e2a477", "#c48558", "#8f5d3b", "#ffc9de", "#b9e3ff", "#c6efa9"];
    const HAIRC = ["#3b2a20", "#7a4a26", "#e0a83a", "#f2603b", "#8e5cf7", "#2f95f5", "#ff6fae", "#f4f4f4"];
    const SHIRTS = ["#2f95f5", "#ff7452", "#2fb466", "#8a63ee", "#ffc531", "#ff5d8f"];

    /* ---------- 부위 그림 ---------- */
    const eyeL = 112,
      eyeR = 188,
      eyeY = 186;
    const heart = (x, y, s, fill) =>
      '<path d="M' + x + " " + (y + s * 0.9) + " C" + (x - s * 1.6) + " " + (y - s * 0.2) + " " + (x - s * 0.7) + " " + (y - s * 1.2) + " " + x + " " + (y - s * 0.35) +
      " C" + (x + s * 0.7) + " " + (y - s * 1.2) + " " + (x + s * 1.6) + " " + (y - s * 0.2) + " " + x + " " + (y + s * 0.9) + 'Z" fill="' + fill + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    const starP = (cx, cy, R, fill, sw = 3) => {
      const p = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5,
          rad = k % 2 ? R * 0.45 : R;
        p.push((cx + Math.cos(a) * rad).toFixed(1) + "," + (cy + Math.sin(a) * rad).toFixed(1));
      }
      return '<polygon points="' + p.join(" ") + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    };
    const S = (d, w = 6, fill = "none") => '<path d="' + d + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
    const C = (cx, cy, r, fill, sw = 0) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + "/>";
    const bothEyes = (f) => f(eyeL, 1) + f(eyeR, -1);

    const EYES = [
      ["dot", "점 눈", () => bothEyes((x) => C(x, eyeY, 10, INK) + C(x - 3, eyeY - 4, 3.5, "#fff"))],
      ["big", "반짝 눈", () => bothEyes((x) => C(x, eyeY, 21, "#fff", 4) + C(x, eyeY + 2, 13, "#6b4a2e") + C(x, eyeY + 2, 7, INK) + C(x - 5, eyeY - 4, 4.5, "#fff") + C(x + 5, eyeY + 7, 2, "#fff"))],
      ["happy", "웃는 눈", () => bothEyes((x) => S("M" + (x - 16) + " " + (eyeY + 6) + " Q" + x + " " + (eyeY - 16) + " " + (x + 16) + " " + (eyeY + 6), 7))],
      ["wink", "윙크", () => C(eyeL, eyeY, 21, "#fff", 4) + C(eyeL, eyeY + 2, 12, "#3f7fd8") + C(eyeL, eyeY + 2, 6, INK) + C(eyeL - 5, eyeY - 4, 4, "#fff") + S("M" + (eyeR - 16) + " " + eyeY + " L" + (eyeR + 14) + " " + (eyeY - 8) + " M" + (eyeR - 16) + " " + eyeY + " L" + (eyeR + 14) + " " + (eyeY + 8), 6)],
      ["star", "별 눈", () => bothEyes((x) => starP(x, eyeY, 21, "#ffd23f"))],
      ["heart", "하트 눈", () => bothEyes((x) => heart(x, eyeY + 2, 15, "#ff4f7b"))],
      ["sleepy", "졸린 눈", () => bothEyes((x) => S("M" + (x - 17) + " " + eyeY + " Q" + x + " " + (eyeY + 14) + " " + (x + 17) + " " + eyeY, 6) + S("M" + (x - 8) + " " + (eyeY + 10) + " l-3 6 M" + x + " " + (eyeY + 12) + " v7 M" + (x + 8) + " " + (eyeY + 10) + " l3 6", 3))],
      ["googly", "왕눈", () => C(eyeL, eyeY, 24, "#fff", 4) + C(eyeL + 8, eyeY + 8, 11, INK) + C(eyeR, eyeY, 24, "#fff", 4) + C(eyeR - 9, eyeY - 6, 11, INK)],
    ];
    const BROWS = [
      ["none", "없음", () => ""],
      ["normal", "보통", () => S("M92 152 Q112 140 132 150", 7) + S("M168 150 Q188 140 208 152", 7)],
      ["angry", "화난", () => S("M92 144 L132 158", 8) + S("M168 158 L208 144", 8)],
      ["up", "놀란", () => S("M94 142 Q112 124 130 138", 6) + S("M170 138 Q188 124 206 142", 6)],
      ["thick", "굵은", () => '<rect x="88" y="140" width="46" height="14" rx="7" fill="' + INK + '" transform="rotate(-6 111 147)"/><rect x="166" y="140" width="46" height="14" rx="7" fill="' + INK + '" transform="rotate(6 189 147)"/>'],
      ["sad", "슬픈", () => S("M92 150 Q110 152 130 138", 6) + S("M170 138 Q190 152 208 150", 6)],
    ];
    const NOSES = [
      ["dot", "콩 코", () => '<ellipse cx="150" cy="226" rx="9" ry="7" fill="#e58d7a"/>'],
      ["clown", "빨간 코", () => C(150, 226, 19, "#ff3b30", 4) + C(144, 219, 6, "#fff")],
      ["tri", "세모 코", () => S("M150 206 L138 236 L162 236 Z", 5, "rgba(0,0,0,.06)")],
      ["pig", "돼지 코", () => '<ellipse cx="150" cy="228" rx="22" ry="16" fill="#ffa3b8" stroke="' + INK + '" stroke-width="4"/>' + '<ellipse cx="142" cy="228" rx="4" ry="6" fill="' + INK + '"/><ellipse cx="158" cy="228" rx="4" ry="6" fill="' + INK + '"/>'],
      ["curve", "오뚝 코", () => S("M152 204 Q136 232 156 236", 5)],
    ];
    const MY = 270;
    const MOUTHS = [
      ["smile", "웃는 입", () => S("M116 " + (MY - 8) + " Q150 " + (MY + 26) + " 184 " + (MY - 8), 7)],
      ["grin", "이 보이는 입", () => '<path d="M108 ' + (MY - 12) + " Q150 " + (MY - 8) + " 192 " + (MY - 12) + " Q186 " + (MY + 34) + " 150 " + (MY + 36) + " Q114 " + (MY + 34) + " 108 " + (MY - 12) + 'Z" fill="#8e2b3c" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><path d="M114 ' + (MY - 9) + " Q150 " + (MY - 5) + " 186 " + (MY - 9) + " L183 " + (MY + 4) + " Q150 " + (MY + 8) + " 117 " + (MY + 4) + 'Z" fill="#fff"/>'],
      ["laugh", "깔깔 입", () => '<path d="M110 ' + (MY - 10) + " Q150 " + (MY - 14) + " 190 " + (MY - 10) + " Q184 " + (MY + 42) + " 150 " + (MY + 42) + " Q116 " + (MY + 42) + " 110 " + (MY - 10) + 'Z" fill="#8e2b3c" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><ellipse cx="150" cy="' + (MY + 28) + '" rx="22" ry="12" fill="#ff7d93"/>'],
      ["o", "오 입", () => '<ellipse cx="150" cy="' + (MY + 4) + '" rx="15" ry="20" fill="#8e2b3c" stroke="' + INK + '" stroke-width="5"/>'],
      ["tongue", "메롱", () => '<path d="M136 ' + (MY + 2) + " Q136 " + (MY + 34) + " 150 " + (MY + 34) + " Q164 " + (MY + 34) + " 164 " + (MY + 2) + 'Z" fill="#ff7d93" stroke="' + INK + '" stroke-width="4"/>' + S("M114 " + (MY - 4) + " Q150 " + (MY + 16) + " 186 " + (MY - 4), 7) + S("M150 " + (MY + 8) + " V" + (MY + 22), 3)],
      ["sad", "시무룩", () => S("M118 " + (MY + 16) + " Q150 " + (MY - 10) + " 182 " + (MY + 16), 7)],
      ["cat", "고양이 입", () => S("M122 " + MY + " Q136 " + (MY + 16) + " 150 " + MY + " Q164 " + (MY + 16) + " 178 " + MY, 6)],
      ["kiss", "뽀뽀 입", () => heart(150, MY + 2, 13, "#ff4f7b")],
      ["teeth", "토끼 이", () => S("M114 " + (MY - 8) + " Q150 " + (MY + 18) + " 186 " + (MY - 8), 7) + '<rect x="138" y="' + (MY + 3) + '" width="24" height="18" rx="4" fill="#fff" stroke="' + INK + '" stroke-width="4"/>' + S("M150 " + (MY + 4) + " V" + (MY + 20), 3)],
    ];
    const HAIRS = [
      ["none", "민머리", () => ({ back: "", front: "" })],
      ["short", "짧은 머리", (h) => ({ back: "", front: S("M50 196 Q42 86 150 78 Q258 86 250 196 Q238 128 200 118 Q150 140 100 118 Q62 128 50 196Z", 4, h) })],
      ["spiky", "뾰족 머리", (h) => ({ back: "", front: S("M54 180 L58 118 L80 134 L88 80 L114 112 L128 58 L150 100 L172 58 L186 112 L212 80 L220 134 L242 118 L246 180 Q222 126 150 126 Q78 126 54 180Z", 4, h) })],
      ["bowl", "바가지 머리", (h) => ({ back: "", front: S("M46 204 Q38 78 150 74 Q262 78 254 204 L238 204 Q234 150 222 140 L78 140 Q66 150 62 204Z", 4, h) })],
      ["curly", "곱슬 머리", (h) => ({ back: "", front: [[60, 160], [66, 124], [88, 96], [118, 80], [150, 74], [182, 80], [212, 96], [234, 124], [240, 160]].map(([x, y]) => C(x, y, 26, h, 4)).join("") + C(100, 118, 22, h) + C(150, 108, 24, h) + C(200, 118, 22, h) })],
      ["long", "긴 머리", (h) => ({ back: S("M38 200 Q28 64 150 64 Q272 64 262 200 L272 340 Q244 352 224 330 L76 330 Q56 352 28 340Z", 4, h), front: S("M52 182 Q58 92 150 86 Q242 92 248 182 Q212 122 150 128 Q122 110 100 130 Q72 140 52 182Z", 4, h) })],
      ["pigtail", "양갈래", (h) => ({ back: C(34, 132, 32, h, 4) + C(266, 132, 32, h, 4) + C(58, 146, 8, "#ff5d8f", 3) + C(242, 146, 8, "#ff5d8f", 3), front: S("M52 186 Q48 88 150 80 Q252 88 248 186 Q232 126 150 124 Q68 126 52 186Z", 4, h) })],
      ["mohawk", "닭벼슬", (h) => ({ back: "", front: S("M126 122 Q116 36 150 10 Q184 36 174 122 Q150 112 126 122Z", 4, h) })],
    ];
    const HATS = [
      ["none", "없음", () => ""],
      ["crown", "왕관", () => S("M88 112 L92 50 L122 84 L150 34 L178 84 L208 50 L212 112Z", 4, "#ffd23f") + C(150, 74, 8, "#ff4f7b", 3) + C(110, 96, 6, "#4fc3ff", 3) + C(190, 96, 6, "#4fc3ff", 3)],
      ["tophat", "신사 모자", () => '<rect x="98" y="0" width="104" height="100" rx="6" fill="#2a2b45" stroke="' + INK + '" stroke-width="4"/><rect x="98" y="70" width="104" height="18" fill="#ff5d8f"/><ellipse cx="150" cy="100" rx="98" ry="15" fill="#2a2b45" stroke="' + INK + '" stroke-width="4"/>'],
      ["cap", "야구 모자", () => S("M58 124 Q56 46 150 42 Q244 46 242 124Z", 4, "#2f95f5") + S("M146 116 Q246 102 292 126 Q244 140 146 128Z", 4, "#1f6fc0") + C(150, 44, 8, "#ffd23f", 3) + S("M150 46 V120", 3)],
      ["bow", "리본", () => S("M206 98 L170 70 L174 126Z", 4, "#ff5d8f") + S("M206 98 L244 70 L240 126Z", 4, "#ff5d8f") + C(206, 98, 13, "#ff8fb3", 4)],
      ["party", "고깔 모자", () => S("M108 108 L150 4 L192 108Z", 4, "#8a63ee") + S("M122 74 L176 70 M134 44 L164 42", 6) + C(150, 6, 14, "#ffd23f", 4) + '<path d="M118 78 L182 74" stroke="#ffd23f" stroke-width="7"/><path d="M130 48 L170 46" stroke="#2fd47a" stroke-width="7"/>'],
      ["flower", "꽃 머리띠", () => S("M56 128 Q150 62 244 128", 9) + [[64, 120, "#ff5d8f"], [100, 96, "#ffd23f"], [150, 86, "#4fc3ff"], [200, 96, "#ff9f40"], [236, 120, "#8a63ee"]].map(([x, y, c]) => [0, 72, 144, 216, 288].map((a) => C(x + Math.cos((a * Math.PI) / 180) * 10, y + Math.sin((a * Math.PI) / 180) * 10, 9, c, 2)).join("") + C(x, y, 7, "#fff3a0", 2)).join("")],
    ];
    const GLASSES = [
      ["none", "없음", () => ""],
      ["round", "동글 안경", () => C(eyeL, eyeY, 31, "rgba(200,235,255,.35)", 6) + C(eyeR, eyeY, 31, "rgba(200,235,255,.35)", 6) + S("M143 182 Q150 174 157 182", 6) + S("M81 180 L56 172 M219 180 L244 172", 6)],
      ["sun", "선글라스", () => '<rect x="74" y="162" width="74" height="48" rx="18" fill="#1d1f33" stroke="' + INK + '" stroke-width="5"/><rect x="152" y="162" width="74" height="48" rx="18" fill="#1d1f33" stroke="' + INK + '" stroke-width="5"/>' + S("M144 176 H156", 6) + '<path d="M86 172 l18 0 M164 172 l18 0" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>' + S("M74 176 L54 168 M226 176 L246 168", 6)],
      ["star", "별 안경", () => starP(eyeL, eyeY, 38, "rgba(255,210,63,.55)", 5) + starP(eyeR, eyeY, 38, "rgba(255,210,63,.55)", 5) + S("M144 184 H156", 5)],
      ["heart", "하트 안경", () => heart(eyeL, eyeY + 4, 25, "rgba(255,79,123,.5)") + heart(eyeR, eyeY + 4, 25, "rgba(255,79,123,.5)") + S("M144 182 H156", 5)],
    ];
    const PARTS = {
      skin: { em: "🙂", name: "얼굴색", list: SKINS.map((c, i) => [i, "", null]) },
      hair: { em: "💇", name: "머리", list: HAIRS },
      eyes: { em: "👀", name: "눈", list: EYES },
      brows: { em: "🤨", name: "눈썹", list: BROWS },
      nose: { em: "👃", name: "코", list: NOSES },
      mouth: { em: "👄", name: "입", list: MOUTHS },
      hat: { em: "🎩", name: "모자", list: HATS },
      glasses: { em: "👓", name: "안경", list: GLASSES },
    };
    const TAB_ORDER = ["skin", "hair", "eyes", "brows", "nose", "mouth", "hat", "glasses"];
    const DEF = { skin: 0, hair: "short", hairC: 0, eyes: "big", brows: "normal", nose: "dot", mouth: "smile", hat: "none", glasses: "none", shirt: 0 };
    let cfg = Object.assign({}, DEF, KP.store.get("face:cfg", {}));
    const fn = (part, id) => (PARTS[part].list.find((x) => x[0] === id) || PARTS[part].list[0])[2];

    /** 얼굴 SVG 전체 */
    function faceSVG(c, o = {}) {
      const skin = SKINS[c.skin] || SKINS[0];
      const hair = fn("hair", c.hair)(HAIRC[c.hairC] || HAIRC[0]);
      const shirt = SHIRTS[c.shirt % SHIRTS.length];
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (o.vb || "0 -14 300 384") + '" preserveAspectRatio="xMidYMid meet">' +
        '<g class="all">' +
        hair.back +
        '<path d="M60 370 Q64 316 150 308 Q236 316 240 370Z" fill="' + shirt + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M126 300 h48 v20 q-24 14 -48 0Z" fill="' + skin + '" stroke="' + INK + '" stroke-width="5"/>' +
        C(52, 206, 22, skin, 5) + C(248, 206, 22, skin, 5) +
        '<ellipse cx="150" cy="200" rx="100" ry="112" fill="' + skin + '" stroke="' + INK + '" stroke-width="5"/>' +
        hair.front +
        C(96, 240, 16, "rgba(255,110,140,.32)") + C(204, 240, 16, "rgba(255,110,140,.32)") +
        fn("brows", c.brows)() +
        '<g class="eyes">' + fn("eyes", c.eyes)() + "</g>" +
        fn("nose", c.nose)() +
        fn("mouth", c.mouth)() +
        fn("glasses", c.glasses)() +
        fn("hat", c.hat)() +
        "</g></svg>"
      );
    }

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "fc");
    const faceBox = U.el("div", "fc-face");
    const flash = U.el("div", "fc-flash");
    const panel = U.el("div", "fc-panel");
    const tabs = U.el("div", "fc-tabs");
    const opts = U.el("div", "fc-opts");
    const colors = U.el("div", "fc-colors");
    const acts = U.el("div", "fc-acts");
    const bRand = U.btn(KP.E("🎲") + " 랜덤", "btn fc-act");
    const bPhoto = U.btn(KP.E("📸") + " 사진 찍기", "btn primary fc-act");
    acts.append(bRand, bPhoto);
    panel.append(tabs, opts, colors, acts);
    wrap.append(faceBox, panel);
    ctx.body.appendChild(wrap);
    let tab = "eyes",
      temp = null,
      unsaved = true;

    function render() {
      const c = temp ? Object.assign({}, cfg, temp) : cfg;
      faceBox.innerHTML = faceSVG(c);
      faceBox.appendChild(flash);
    }
    function saveCfg() {
      KP.store.set("face:cfg", cfg);
      unsaved = true;
    }
    TAB_ORDER.forEach((k) => {
      const b = U.btn(KP.E(PARTS[k].em), "fc-tab");
      b.dataset.k = k;
      ctx.tap(b, () => {
        tab = k;
        renderTabs();
        renderOpts();
        A.sfx("select");
        U.replay(b, "jump");
        KP.voice.say(PARTS[k].name);
      });
      tabs.appendChild(b);
    });
    function renderTabs() {
      U.$$(".fc-tab", tabs).forEach((b) => b.classList.toggle("sel", b.dataset.k === tab));
    }
    const VB = { skin: "0 -14 300 384", hair: "20 -20 260 260", eyes: "60 130 180 110", brows: "70 110 160 80", nose: "100 180 100 80", mouth: "90 230 120 90", hat: "20 -20 260 200", glasses: "40 130 220 110" };
    function renderOpts() {
      opts.innerHTML = "";
      colors.innerHTML = "";
      const P = PARTS[tab];
      P.list.forEach(([id, name], i) => {
        const c = Object.assign({}, cfg, { [tab]: id });
        if (tab === "brows" || tab === "eyes" || tab === "nose" || tab === "mouth" || tab === "glasses") Object.assign(c, { hat: "none", hair: tab === "glasses" ? "none" : c.hair });
        const b = U.btn(faceSVG(c, { vb: VB[tab] }), "fc-opt" + (cfg[tab] === id ? " sel" : ""));
        b.style.setProperty("--i", i);
        ctx.tap(b, () => {
          cfg[tab] = id;
          saveCfg();
          U.$$(".fc-opt", opts).forEach((x) => x.classList.toggle("sel", x === b));
          render();
          U.replay(faceBox.firstChild, "bounce");
          U.replay(b, "pop");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.24 });
          if (tab === "mouth" || tab === "eyes") A.sfx("boing");
          if (name) KP.voice.say(name);
        });
        opts.appendChild(b);
      });
      opts.style.gridTemplateRows = "";
      if (tab === "hair") {
        HAIRC.forEach((c, i) => {
          const b = U.btn("", "fc-col" + (cfg.hairC === i ? " sel" : ""));
          b.style.background = c;
          ctx.tap(b, () => {
            cfg.hairC = i;
            saveCfg();
            U.$$(".fc-col", colors).forEach((x) => x.classList.toggle("sel", x === b));
            render();
            renderOpts();
            A.note(A.SCALE[i], { inst: "bell", dur: 0.3, vol: 0.2 });
          });
          colors.appendChild(b);
        });
      }
    }

    /* ---------- 얼굴 누르기: 웃으며 말하기 ---------- */
    const LINES = ["안녕! 나는 멋쟁이야!", "히히, 간지러워!", "까꿍!", "나랑 같이 놀자!", "우와, 멋지게 꾸며 줘서 고마워!", "하하하! 재밌다!", "나 예뻐?"];
    let laughT = 0;
    ctx.fast(faceBox, () => {
      ctx.cancel(laughT);
      temp = { mouth: "laugh", eyes: "happy", brows: cfg.brows === "angry" ? "up" : cfg.brows };
      render();
      U.replay(faceBox.firstChild, "bounce");
      A.sfx("boing");
      A.note("G5", { inst: "marimba", dur: 0.2, vol: 0.18, when: 0.1 });
      A.note("C6", { inst: "marimba", dur: 0.3, vol: 0.18, when: 0.2 });
      KP.voice.say(U.pick(LINES), { pitch: 1.35 });
      laughT = ctx.after(1300, () => {
        temp = null;
        render();
      });
    });
    // 눈 깜빡
    ctx.blink = () => {
      if (temp) return;
      if (!["dot", "big", "googly", "wink", "star", "heart"].includes(cfg.eyes)) return;
      const g = faceBox.querySelector("g.eyes");
      if (!g) return;
      g.classList.add("blink");
      ctx.after(140, () => g.classList.remove("blink"));
    };

    /* ---------- 랜덤 ---------- */
    ctx.tap(bRand, () => {
      const r = (k) => U.pick(PARTS[k].list)[0];
      cfg = Object.assign({}, cfg, {
        skin: U.rand(SKINS.length), hair: r("hair"), hairC: U.rand(HAIRC.length), eyes: r("eyes"), brows: r("brows"), nose: r("nose"), mouth: r("mouth"),
        hat: Math.random() < 0.7 ? r("hat") : "none", glasses: Math.random() < 0.45 ? r("glasses") : "none", shirt: U.rand(SHIRTS.length),
      });
      saveCfg();
      for (let i = 0; i < 6; i++) A.note(A.SCALE[U.rand(8)], { inst: "marimba", dur: 0.12, vol: 0.18, when: i * 0.06 });
      A.sfx("boing");
      render();
      renderOpts();
      U.replay(faceBox.firstChild, "bounce");
      U.replay(bRand, "wig");
      KP.voice.say(U.pick(["짜잔! 누구일까요?", "우와, 재미있는 얼굴!", "하하, 웃기다!"]));
    });

    /* ---------- 사진 찍기 → 내 작품 ---------- */
    ctx.tap(bPhoto, async () => {
      if (bPhoto.dataset.busy) return;
      if (!unsaved) {
        U.replay(bPhoto, "wig");
        KP.voice.say("이 얼굴은 벌써 찍었어요! 바꿔서 또 찍어 봐요.");
        return;
      }
      bPhoto.dataset.busy = "1";
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      A.noise({ dur: 0.08, vol: 0.18, hp: 1200, when: 0.09 });
      U.replay(flash, "on");
      temp = { mouth: cfg.mouth === "sad" ? "smile" : cfg.mouth };
      const img = await toJpeg();
      temp = null;
      if (!img) {
        delete bPhoto.dataset.busy;
        KP.toast("사진을 만들지 못했어요");
        return;
      }
      const d = new Date();
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "face", img, t: Date.now(), date: d.getMonth() + 1 + "월 " + d.getDate() + "일" });
      flyAway(img, faceBox);
      if (ok) {
        unsaved = false;
        KP.toast("🖼️ 내 작품에 저장했어요!");
        A.sfx("sticker");
        delete bPhoto.dataset.busy; // 기다리는 중에 나가도 버튼이 잠기지 않게
        await ctx.wait(900);
        await ctx.win({ msg: "찰칵! 내 작품에 저장했어요!" });
      } else {
        delete bPhoto.dataset.busy;
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
      }
    });
    function toJpeg() {
      return new Promise((res) => {
        const svg = faceSVG(cfg, { vb: "0 -20 300 390" });
        const im = new Image();
        im.onload = () => {
          const Wd = 780,
            Ht = 1000;
          const c = document.createElement("canvas");
          c.width = Wd;
          c.height = Ht;
          const x = c.getContext("2d");
          const g = x.createRadialGradient(Wd / 2, Ht * 0.42, 40, Wd / 2, Ht * 0.45, Ht * 0.7);
          g.addColorStop(0, "#ffffff");
          g.addColorStop(0.45, "#ffe9f3");
          g.addColorStop(1, "#ffd9a8");
          x.fillStyle = g;
          x.fillRect(0, 0, Wd, Ht);
          const cols = ["#ff5d8f", "#ffc531", "#2f95f5", "#2fb466", "#8a63ee"];
          for (let i = 0; i < 60; i++) {
            x.fillStyle = cols[i % 5];
            x.globalAlpha = 0.5;
            x.beginPath();
            x.arc(Math.random() * Wd, Math.random() * Ht, 4 + Math.random() * 7, 0, 6.28);
            x.fill();
          }
          x.globalAlpha = 1;
          x.drawImage(im, 40, 40, Wd - 80, Ht - 80);
          try {
            res(c.toDataURL("image/jpeg", 0.85));
          } catch (e) {
            res(null);
          }
        };
        im.onerror = () => res(null);
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      });
    }
    function flyAway(img, fromEl) {
      const a = fromEl.getBoundingClientRect();
      const home = ctx.root.querySelector(".bar .home");
      const b = home ? home.getBoundingClientRect() : { left: 0, top: 0, width: 40, height: 40 };
      const f = U.el("img");
      f.src = img;
      Object.assign(f.style, {
        position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", objectFit: "contain",
        zIndex: 90, borderRadius: "18px", pointerEvents: "none", transition: "transform .9s cubic-bezier(.5,-0.35,.6,1), opacity .9s",
      });
      document.body.appendChild(f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          f.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.06) rotate(25deg)";
          f.style.opacity = "0.5";
        })
      );
      setTimeout(() => {
        f.remove();
        if (home) U.replay(home, "bump");
      }, 950);
    }

    ctx.init = () => {
      temp = null;
      unsaved = true;
      render();
      renderTabs();
      renderOpts();
    };
  },
  start(ctx) {
    ctx.init();
    ctx.say("얼굴을 꾸며 봐요! 위 단추로 고르고, 얼굴을 누르면 웃어요.");
    ctx.every(3600, () => ctx.blink());
    ctx.hint(() => ctx.body.querySelector(".fc-opt:not(.sel)"), "그림을 눌러서 바꿔 봐요!");
  },
});
