/* 색칠 놀이 — 그림 칸을 톡 눌러 색 채우기
   - 장면 8개(집·꽃·물고기·자동차·성·로켓·공룡·나비), 장면 고르기는 썸네일 창
   - 색 12가지 + 무지개·반짝이 특수색, 되돌리기, 처음처럼(꾹)
   - 칠한 상태는 장면마다 자동 저장(KP.store "paintbook:fills") → 껐다 켜도 그대로
   - ✅ 완성 → 내 작품(kind "paint") 저장 + 축하 */
"use strict";
KP.game({
  id: "paintbook",
  icon: "🖍️",
  name: "색칠 놀이",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("paintbook", `
      .pb{flex:1;min-height:0;display:grid;gap:10px;padding:2px 12px 12px;
        --sw:clamp(40px,6.6vh,54px);--ab:clamp(54px,8.6vh,68px);
        grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"acts board pal"}
      .pb .board{grid-area:board;margin:0;background:#fff;border:4px solid #fff}
      .pb-acts{grid-area:acts;display:flex;flex-direction:column;gap:10px;justify-content:center;align-items:center}
      .pb-pal{grid-area:pal;display:grid;grid-template-columns:repeat(2,var(--sw));gap:10px;align-content:center;justify-content:center}
      .pb-act{width:var(--ab);height:var(--ab);border-radius:20px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);font-size:calc(var(--ab) * .56);display:flex;align-items:center;justify-content:center;position:relative}
      .pb-act:active{transform:translateY(3px)}
      .pb-act.done{background:var(--grass);box-shadow:0 5px 0 #1d7f45}
      .pb-act.off{opacity:.4}
      .pb-act.scn svg{width:80%;height:80%}
      .pb-sw{width:var(--sw);height:var(--sw);border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.14);transition:transform .12s}
      .pb-sw.light{border-color:#e4e8f2}
      .pb-sw.sel{transform:scale(1.18);box-shadow:0 0 0 4px var(--ink),0 4px 0 rgba(0,0,0,.14)}
      .pb-sw.myPaint{position:relative;border-color:#ffe7a3}
      .pb-sw.myPaint .tag{position:absolute;right:-9px;top:-9px;font-size:calc(var(--sw) * .36);line-height:1;pointer-events:none}
      .pb-sep{grid-column:1/-1;height:3px;margin:1px 4px;border-radius:3px;background:repeating-linear-gradient(90deg,#c9d2e6 0 6px,transparent 6px 11px)}
      .pb-pal.mine3{grid-template-columns:repeat(3,var(--sw))}
      .pb-svg .pb-r{cursor:pointer;transition:fill .18s}
      .pb-svg .pb-r.pop{animation:pbPop .35s ease-out;transform-box:fill-box;transform-origin:center}
      @keyframes pbPop{40%{transform:scale(1.06)}}
      .pb-spark{position:fixed;pointer-events:none;z-index:40;font-size:34px;animation:pbSpark .7s ease-out forwards}
      @keyframes pbSpark{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(-50%,-120%) scale(1.3);opacity:0}}
      .pb-pick{position:absolute;inset:0;z-index:20;background:rgba(238,249,255,.97);display:none;flex-direction:column;align-items:center;padding:10px 14px 16px;gap:10px}
      .pb-pick.show{display:flex;animation:enter .3s}
      .pb-pick h3{font-weight:400;font-size:clamp(22px,3.4vw,32px);color:var(--ink)}
      .pb-grid{flex:1;min-height:0;width:100%;max-width:980px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-content:center;overflow-y:auto}
      .pb-card{background:#fff;border-radius:20px;padding:8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:4px;font-size:clamp(16px,2.2vw,22px);animation:cardIn .4s backwards;animation-delay:calc(var(--i) * 40ms)}
      .pb-card svg{width:100%;aspect-ratio:4/3;display:block;border-radius:12px;background:#fff}
      .pb-card.now{box-shadow:0 0 0 5px var(--sun),var(--shadow)}
      .pb-card:active{transform:scale(.96)}
      @media (max-aspect-ratio:1/1){
        .pb{gap:8px;padding:2px 10px 10px;--sw:min(calc((100vw - 74px) / 7),50px);--ab:min(calc((100vw - 60px) / 5),62px);
          grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"acts" "board" "pal"}
        .pb-acts{flex-direction:row}
        .pb-pal,.pb-pal.mine3{grid-template-columns:repeat(7,var(--sw));gap:8px}
        .pb-grid{grid-template-columns:repeat(2,1fr);gap:10px}
      }
    `);

    /* ---------- 장면 ---------- */
    const LINE = "#3b3552";
    const at = (o) =>
      Object.entries(o)
        .map(([k, v]) => k + '="' + v + '"')
        .join(" ");
    const r = (tag, o) => "<" + tag + ' class="pb-r" fill="#ffffff" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round" ' + at(o) + "/>";
    const bgR = (o) => "<rect class=\"pb-r\" fill=\"#ffffff\" stroke=\"none\" " + at(Object.assign({ x: 0, y: 0, width: 400, height: 300 }, o || {})) + "/>";
    const l = (d, w) => '<path d="' + d + '" fill="none" stroke="' + LINE + '" stroke-width="' + (w || 4) + '" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>';
    const dk = (tag, o) => "<" + tag + ' fill="' + LINE + '" pointer-events="none" ' + at(o) + "/>";
    const star = (cx, cy, R, rr = 0.45) => {
      const p = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5,
          rad = k % 2 ? R * rr : R;
        p.push((cx + Math.cos(a) * rad).toFixed(1) + "," + (cy + Math.sin(a) * rad).toFixed(1));
      }
      return r("polygon", { points: p.join(" ") });
    };
    const cloud = (x, y, s = 1) =>
      r("path", { d: `M${x} ${y} a${16 * s} ${16 * s} 0 0 1 ${22 * s} ${-18 * s} a${22 * s} ${22 * s} 0 0 1 ${40 * s} ${2 * s} a${16 * s} ${16 * s} 0 0 1 ${8 * s} ${30 * s} h${-62 * s} a${12 * s} ${12 * s} 0 0 1 ${-8 * s} ${-14 * s}z` });
    const smallFlower = (x, y) =>
      [0, 72, 144, 216, 288].map((a) => r("circle", { cx: x + Math.cos((a * Math.PI) / 180) * 9, cy: y + Math.sin((a * Math.PI) / 180) * 9, r: 7 })).join("") + r("circle", { cx: x, cy: y, r: 6 });

    const SCENES = [
      {
        id: "house", em: "🏠", name: "집",
        svg: () =>
          bgR() + r("path", { d: "M0 228 Q200 205 400 228 L400 300 L0 300Z" }) +
          r("circle", { cx: 58, cy: 56, r: 28 }) + l("M58 16 V6 M58 96 V106 M18 56 H8 M98 56 H108 M30 28 L23 21 M86 84 L93 91 M86 28 L93 21 M30 84 L23 91", 4) +
          cloud(278, 64, 1.1) +
          r("rect", { x: 240, y: 70, width: 24, height: 48 }) +
          r("polygon", { points: "92,138 200,58 308,138" }) +
          r("rect", { x: 112, y: 138, width: 176, height: 104 }) +
          r("rect", { x: 180, y: 176, width: 42, height: 66, rx: 6 }) + dk("circle", { cx: 213, cy: 211, r: 3.5 }) +
          r("rect", { x: 128, y: 156, width: 38, height: 36, rx: 4 }) + l("M147 156 V192 M128 174 H166", 3) +
          r("rect", { x: 236, y: 156, width: 38, height: 36, rx: 4 }) + l("M255 156 V192 M236 174 H274", 3) +
          r("path", { d: "M186 242 L216 242 L240 300 L162 300Z" }) +
          r("rect", { x: 338, y: 176, width: 16, height: 58, rx: 3 }) + r("circle", { cx: 346, cy: 156, r: 34 }) +
          smallFlower(40, 262) + smallFlower(80, 280) + smallFlower(300, 270),
      },
      {
        id: "flower", em: "🌻", name: "꽃",
        svg: () =>
          bgR() + r("path", { d: "M0 238 Q110 214 210 236 T400 230 L400 300 L0 300Z" }) +
          r("circle", { cx: 352, cy: 50, r: 24 }) + cloud(40, 60, 0.9) +
          r("path", { d: "M195 128 Q188 196 198 250 L208 250 Q198 196 207 128Z" }) +
          r("path", { d: "M200 206 Q160 174 136 196 Q162 224 200 212Z" }) +
          r("path", { d: "M205 184 Q246 152 268 172 Q242 202 205 192Z" }) +
          [0, 45, 90, 135, 180, 225, 270, 315].map((a) => r("ellipse", { cx: 200, cy: 58, rx: 19, ry: 33, transform: "rotate(" + a + " 200 98)" })).join("") +
          r("circle", { cx: 200, cy: 98, r: 27 }) + dk("circle", { cx: 191, cy: 92, r: 3.5 }) + dk("circle", { cx: 209, cy: 92, r: 3.5 }) + l("M190 104 Q200 113 210 104", 3) +
          r("rect", { x: 144, y: 240, width: 112, height: 16, rx: 6 }) + r("path", { d: "M152 256 H248 L236 298 H164Z" }) +
          smallFlower(60, 262) + smallFlower(340, 266),
      },
      {
        id: "fish", em: "🐠", name: "물고기",
        svg: () =>
          bgR() + r("path", { d: "M0 262 Q100 248 200 262 T400 258 L400 300 L0 300Z" }) +
          r("path", { d: "M40 262 Q20 222 42 190 Q60 160 44 130 Q74 160 60 190 Q46 224 58 262Z" }) +
          r("path", { d: "M356 262 Q336 230 352 200 Q368 176 356 152 Q384 176 372 204 Q360 232 372 262Z" }) +
          r("path", { d: "M262 150 L338 96 Q326 150 338 204Z" }) +
          r("path", { d: "M150 98 Q190 50 242 98Z" }) + r("path", { d: "M168 198 Q200 238 228 200Z" }) +
          r("ellipse", { cx: 180, cy: 150, rx: 100, ry: 58 }) +
          r("path", { d: "M196 94 Q178 150 196 206 L222 202 Q206 150 220 98Z" }) +
          r("path", { d: "M240 104 Q228 150 240 196 L258 186 Q250 150 258 114Z" }) +
          l("M122 120 Q138 150 122 180", 3) + r("circle", { cx: 108, cy: 136, r: 13 }) + dk("circle", { cx: 105, cy: 137, r: 6 }) + l("M82 162 Q92 168 100 162", 3) +
          r("circle", { cx: 70, cy: 88, r: 10 }) + r("circle", { cx: 52, cy: 58, r: 14 }) + r("circle", { cx: 78, cy: 30, r: 8 }) +
          star(300, 272, 18, 0.5),
      },
      {
        id: "car", em: "🚗", name: "자동차",
        svg: () =>
          bgR() + r("rect", { x: 0, y: 236, width: 400, height: 64 }) + '<path d="M10 272 H390" stroke="' + LINE + '" stroke-width="4" stroke-dasharray="26 18" pointer-events="none"/>' +
          r("circle", { cx: 340, cy: 52, r: 26 }) + cloud(50, 62, 1) +
          r("path", { d: "M118 140 L150 90 H252 L292 140Z" }) +
          r("path", { d: "M140 136 L162 100 H196 V136Z" }) + r("path", { d: "M206 136 V100 H244 L270 136Z" }) +
          r("rect", { x: 54, y: 136, width: 294, height: 66, rx: 22 }) + l("M201 140 V198", 3) + l("M180 156 H192 M220 156 H232", 3) +
          r("circle", { cx: 332, cy: 158, r: 10 }) + r("rect", { x: 58, y: 150, width: 12, height: 18, rx: 3 }) +
          r("rect", { x: 40, y: 184, width: 30, height: 14, rx: 6 }) + r("rect", { x: 332, y: 184, width: 30, height: 14, rx: 6 }) +
          r("circle", { cx: 120, cy: 206, r: 30 }) + r("circle", { cx: 120, cy: 206, r: 12 }) +
          r("circle", { cx: 284, cy: 206, r: 30 }) + r("circle", { cx: 284, cy: 206, r: 12 }),
      },
      {
        id: "castle", em: "🏰", name: "성",
        svg: () =>
          bgR() + r("path", { d: "M0 250 Q200 232 400 250 L400 300 L0 300Z" }) + cloud(300, 60, 0.9) + r("circle", { cx: 50, cy: 44, r: 22 }) +
          r("path", { d: "M118 150 V132 H136 V146 H152 V132 H170 V146 H186 V132 H214 V146 H230 V132 H248 V146 H264 V132 H282 V252 H118Z" }) +
          r("rect", { x: 58, y: 118, width: 60, height: 134 }) + r("polygon", { points: "50,120 88,48 126,120" }) + l("M88 48 V22", 3) + r("polygon", { points: "88,22 114,30 88,38" }) +
          r("rect", { x: 282, y: 118, width: 60, height: 134 }) + r("polygon", { points: "274,120 312,48 350,120" }) + l("M312 48 V22", 3) + r("polygon", { points: "312,22 338,30 312,38" }) +
          r("rect", { x: 166, y: 92, width: 68, height: 160 }) + r("polygon", { points: "158,94 200,26 242,94" }) + l("M200 26 V8", 3) + r("polygon", { points: "200,8 222,15 200,22" }) +
          r("path", { d: "M178 252 V214 a22 22 0 0 1 44 0 V252Z" }) + l("M200 194 V252", 3) +
          r("circle", { cx: 200, cy: 134, r: 13 }) +
          r("path", { d: "M78 178 v-16 a10 10 0 0 1 20 0 v16Z" }) + r("path", { d: "M302 178 v-16 a10 10 0 0 1 20 0 v16Z" }) +
          smallFlower(30, 276) + smallFlower(370, 276),
      },
      {
        id: "rocket", em: "🚀", name: "로켓",
        svg: () =>
          bgR() + r("circle", { cx: 332, cy: 60, r: 32 }) + r("circle", { cx: 322, cy: 50, r: 7 }) + r("circle", { cx: 344, cy: 74, r: 5 }) +
          r("circle", { cx: 72, cy: 228, r: 36 }) + r("path", { d: "M14 246 Q72 214 132 214 Q140 220 128 226 Q72 240 18 256 Q8 254 14 246Z" }) +
          star(60, 60, 16) + star(126, 126, 11) + star(352, 172, 14) + star(300, 262, 12) + star(360, 120, 8) +
          r("path", { d: "M176 238 Q200 300 224 238Z" }) + r("path", { d: "M188 238 Q200 272 212 238Z" }) +
          r("path", { d: "M168 186 L130 238 L172 232Z" }) + r("path", { d: "M232 186 L270 238 L228 232Z" }) +
          r("path", { d: "M200 40 Q250 92 236 240 H164 Q150 92 200 40Z" }) +
          r("path", { d: "M200 40 Q222 60 232 86 H168 Q178 60 200 40Z" }) +
          r("rect", { x: 166, y: 210, width: 68, height: 22, rx: 4 }) +
          r("circle", { cx: 200, cy: 134, r: 22 }) + r("circle", { cx: 200, cy: 134, r: 13 }),
      },
      {
        id: "dino", em: "🦕", name: "공룡",
        svg: () =>
          bgR() + r("path", { d: "M0 246 Q200 230 400 246 L400 300 L0 300Z" }) + r("circle", { cx: 60, cy: 50, r: 24 }) +
          r("path", { d: "M276 248 L330 132 H356 L400 210 V248Z" }) + r("path", { d: "M330 132 Q343 112 356 132 L350 146 Q343 136 336 146Z" }) + cloud(330, 70, 0.7) +
          r("rect", { x: 110, y: 200, width: 24, height: 46, rx: 9 }) + r("rect", { x: 142, y: 206, width: 24, height: 42, rx: 9 }) +
          r("rect", { x: 182, y: 204, width: 24, height: 44, rx: 9 }) + r("rect", { x: 210, y: 198, width: 24, height: 48, rx: 9 }) +
          r("path", { d: "M106 184 Q44 198 12 150 Q56 182 112 162Z" }) +
          r("polygon", { points: "108,152 116,128 128,148" }) + r("polygon", { points: "128,142 140,116 152,138" }) + r("polygon", { points: "152,136 166,110 178,136" }) + r("polygon", { points: "178,140 192,116 202,146" }) +
          r("path", { d: "M198 168 Q214 86 248 72 L268 90 Q238 102 232 178Z" }) +
          r("ellipse", { cx: 164, cy: 180, rx: 72, ry: 46 }) +
          r("ellipse", { cx: 266, cy: 78, rx: 28, ry: 19 }) + dk("circle", { cx: 274, cy: 72, r: 4 }) + l("M270 88 Q280 92 290 84", 3) +
          r("circle", { cx: 140, cy: 168, r: 11 }) + r("circle", { cx: 172, cy: 154, r: 8 }) + r("circle", { cx: 192, cy: 186, r: 10 }) + r("circle", { cx: 124, cy: 194, r: 7 }),
      },
      {
        id: "butterfly", em: "🦋", name: "나비",
        svg: () =>
          bgR() + r("path", { d: "M0 262 Q200 246 400 262 L400 300 L0 300Z" }) +
          r("path", { d: "M196 140 Q120 36 68 68 Q38 110 90 150 Q140 170 196 152Z" }) + r("path", { d: "M204 140 Q280 36 332 68 Q362 110 310 150 Q260 170 204 152Z" }) +
          r("path", { d: "M196 158 Q122 168 100 218 Q118 262 160 236 Q190 212 196 168Z" }) + r("path", { d: "M204 158 Q278 168 300 218 Q282 262 240 236 Q210 212 204 168Z" }) +
          r("circle", { cx: 106, cy: 98, r: 17 }) + r("circle", { cx: 294, cy: 98, r: 17 }) + r("circle", { cx: 152, cy: 128, r: 10 }) + r("circle", { cx: 248, cy: 128, r: 10 }) +
          r("circle", { cx: 140, cy: 212, r: 13 }) + r("circle", { cx: 260, cy: 212, r: 13 }) +
          r("ellipse", { cx: 200, cy: 166, rx: 11, ry: 50 }) + r("circle", { cx: 200, cy: 108, r: 15 }) +
          l("M195 96 Q180 70 170 64 M205 96 Q220 70 230 64", 3) + r("circle", { cx: 168, cy: 62, r: 6 }) + r("circle", { cx: 232, cy: 62, r: 6 }) +
          smallFlower(40, 274) + smallFlower(120, 282) + smallFlower(290, 280) + smallFlower(364, 272),
      },
    ];
    const DEFS =
      '<defs><linearGradient id="pbRainbow" x1="0" y1="0" x2="1" y2="1">' +
      ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#5ac8fa", "#1e6cff", "#8e5cf7"].map((c, i) => '<stop offset="' + (i / 6).toFixed(2) + '" stop-color="' + c + '"/>').join("") +
      '</linearGradient><pattern id="pbGlitter" patternUnits="userSpaceOnUse" width="36" height="36">' +
      '<rect width="36" height="36" fill="#ffd56b"/><rect width="18" height="18" fill="#ffb0e6"/><rect x="18" y="18" width="18" height="18" fill="#a8dcff"/>' +
      '<circle cx="6" cy="7" r="2" fill="#fff"/><circle cx="27" cy="12" r="1.5" fill="#fff"/><circle cx="14" cy="28" r="2.2" fill="#fff"/><circle cx="31" cy="30" r="1.3" fill="#fff"/>' +
      '<path d="M22 2 L23.2 6 L27 7 L23.2 8 L22 12 L20.8 8 L17 7 L20.8 6Z" fill="#fff"/><path d="M8 18 L9 21 L12 22 L9 23 L8 26 L7 23 L4 22 L7 21Z" fill="#fff"/></pattern></defs>';
    const svgFor = (sc) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">' + DEFS + sc.svg() + "</svg>";

    const COLORS = [
      ["#ff3b30", "빨강"], ["#ff9500", "주황"], ["#ffd60a", "노랑"], ["#9be22d", "연두"], ["#1fb35a", "초록"], ["#5ac8fa", "하늘색"],
      ["#1e6cff", "파랑"], ["#8e5cf7", "보라"], ["#ff8fc1", "분홍"], ["#9a5b2e", "갈색"], ["#3b3552", "검정"], ["#ffffff", "하양"],
      ["url(#pbRainbow)", "무지개"], ["url(#pbGlitter)", "반짝이"],
    ];

    /* ---------- 상태 (장면별 칠한 색 영구 저장) ---------- */
    const fills = KP.store.get("paintbook:fills", {});
    let sceneId = KP.store.get("paintbook:scene", "house");
    if (!SCENES.find((s) => s.id === sceneId)) sceneId = "house";
    let color = KP.store.get("paintbook:color", "#ff3b30");
    let undo = [];
    let regions = [];
    let doneSaid = false,
      unsaved = false;
    const saveFills = () => {
      fills[sceneId] = regions.map((e) => e.getAttribute("fill"));
      KP.store.set("paintbook:fills", fills);
    };

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "pb");
    const acts = U.el("div", "pb-acts");
    const board = U.el("div", "board pb-board");
    const pal = U.el("div", "pb-pal");
    wrap.append(acts, board, pal);
    const picker = U.el("div", "pb-pick");
    ctx.body.append(wrap, picker);
    const bScene = U.btn("", "pb-act scn");
    const bUndo = U.btn(KP.E("↩️"), "pb-act");
    const bReset = U.btn(KP.E("🗑️"), "pb-act");
    const bDone = U.btn(KP.E("✅"), "pb-act done");
    acts.append(bScene, bUndo, bReset, bDone);

    /** 팔레트: 내 물감(물감 실험실에서 담은 색, 최근 6개)을 맨 앞에 🎨 표시로 → 열 때마다 다시 그림 */
    function renderPal() {
      pal.innerHTML = "";
      const mine = KP.paint
        ? KP.paint.mine().map((m) => ({ hex: m.hex.toLowerCase(), n: m.n })).filter((m) => !COLORS.some((c) => c[0] === m.hex)).slice(0, 6)
        : [];
      pal.classList.toggle("mine3", mine.length > 2);
      mine.map((m) => [m.hex, m.n, true]).concat(COLORS).forEach(([c, name, my], i) => {
        if (mine.length && i === mine.length) pal.appendChild(U.el("span", "pb-sep"));
        const b = U.btn(my ? '<span class="tag">' + KP.E("🎨") + "</span>" : "", "pb-sw" + (my ? " myPaint" : "") + (c === "#ffffff" ? " light" : "") + (c === "url(#pbRainbow)" ? " rainbow swatch" : "") + (c === "url(#pbGlitter)" ? " glitter swatch" : ""));
        if (!c.startsWith("url")) b.style.background = c;
        b.dataset.c = c;
        ctx.tap(b, () => {
          color = c;
          KP.store.set("paintbook:color", c);
          U.$$(".pb-sw", pal).forEach((x) => x.classList.toggle("sel", x === b));
          U.replay(b, "jump");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.22 });
          if (c === "url(#pbGlitter)") A.sfx("sparkle");
          KP.voice.say(my ? "내가 만든 " + (name || "물감") : name);
        });
        pal.appendChild(b);
      });
    }
    renderPal();
    ctx.renderPal = renderPal;
    const markColor = () => U.$$(".pb-sw", pal).forEach((x) => x.classList.toggle("sel", x.dataset.c === color));

    function load(id) {
      sceneId = id;
      KP.store.set("paintbook:scene", id);
      const sc = SCENES.find((s) => s.id === id);
      board.innerHTML = svgFor(sc);
      const svg = board.firstChild;
      svg.classList.add("pb-svg");
      regions = U.$$(".pb-r", svg);
      const saved = fills[id] || [];
      regions.forEach((e, i) => {
        if (saved[i]) e.setAttribute("fill", saved[i]);
      });
      bScene.innerHTML = svgFor(sc);
      undo = [];
      doneSaid = isComplete();
      unsaved = regions.some((e) => e.getAttribute("fill") !== "#ffffff");
      updateUndo();
      svg.addEventListener("pointerdown", onPaint);
    }
    function isComplete() {
      return regions.length && regions.every((e) => e.getAttribute("fill") !== "#ffffff");
    }
    function updateUndo() {
      bUndo.classList.toggle("off", !undo.length);
    }
    function onPaint(e) {
      e.preventDefault();
      A.unlock();
      const t = e.target.closest(".pb-r");
      if (!t) return;
      const prev = t.getAttribute("fill");
      if (prev === color) {
        U.replay(t, "pop");
        A.sfx("tap");
        return;
      }
      undo.push([[t, prev]]);
      if (undo.length > 60) undo.shift();
      t.setAttribute("fill", color);
      U.replay(t, "pop");
      updateUndo();
      saveFills();
      unsaved = true;
      const i = Math.max(0, COLORS.findIndex((c) => c[0] === color));
      A.note(["C5", "D5", "E5", "G5", "A5", "C6"][i % 6], { inst: "marimba", dur: 0.3, vol: 0.25 });
      if (color.startsWith("url")) A.sfx("sparkle");
      else A.noise({ dur: 0.12, vol: 0.05, bp: 1800, bpTo: 600, q: 1 });
      const sp = U.el("div", "pb-spark", KP.E(color === "url(#pbGlitter)" ? "✨" : color === "url(#pbRainbow)" ? "🌈" : "⭐"));
      sp.style.left = e.clientX + "px";
      sp.style.top = e.clientY + "px";
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 800);
      ctx.hint(null);
      if (!doneSaid && isComplete()) {
        doneSaid = true;
        ctx.after(500, () => {
          KP.voice.say("우와, 다 칠했어요! 초록 단추를 누르면 내 작품에 저장돼요.");
          U.replay(bDone, "jump");
          ctx.hint(() => bDone, "초록 단추를 눌러 저장해요!");
        });
      }
    }

    ctx.tap(bUndo, () => {
      const op = undo.pop();
      if (!op) {
        U.replay(bUndo, "wrong");
        A.sfx("bad");
        KP.voice.say("더 되돌릴 수 없어요");
        return;
      }
      op.forEach(([t, prev]) => {
        t.setAttribute("fill", prev);
        U.replay(t, "pop");
      });
      saveFills();
      updateUndo();
      U.replay(bUndo, "wig");
      A.sfx("slide");
      doneSaid = isComplete();
    });
    KP.hold(
      bReset,
      900,
      () => {
        const op = regions.filter((t) => t.getAttribute("fill") !== "#ffffff").map((t) => [t, t.getAttribute("fill")]);
        if (!op.length) return;
        undo.push(op);
        regions.forEach((t) => t.setAttribute("fill", "#ffffff"));
        saveFills();
        updateUndo();
        doneSaid = false;
        A.sfx("whoosh");
        KP.voice.say("처음처럼 하얗게 되었어요!");
      },
      () => KP.voice.say("꾹 누르고 있어요")
    );

    /* ---------- 장면 고르기 ---------- */
    function openPicker() {
      picker.innerHTML = "<h3>" + KP.E("🖼️") + " 어떤 그림을 칠할까요?</h3>";
      const grid = U.el("div", "pb-grid");
      SCENES.forEach((sc, i) => {
        const c = U.btn(svgFor(sc) + "<span>" + KP.E(sc.em) + " " + sc.name + "</span>", "pb-card" + (sc.id === sceneId ? " now" : ""));
        c.style.setProperty("--i", i);
        const saved = fills[sc.id] || [];
        U.$$(".pb-r", c).forEach((e, k) => saved[k] && e.setAttribute("fill", saved[k]));
        ctx.tap(c, () => {
          A.sfx("open");
          picker.classList.remove("show");
          load(sc.id);
          ctx.say(U.josa(sc.name, "을/를") + " 예쁘게 칠해 봐요! 색을 고르고 그림을 톡!");
          ctx.hint(() => regions[Math.min(regions.length - 1, 2)], "그림을 톡 눌러 칠해 봐요!");
        });
        grid.appendChild(c);
      });
      picker.appendChild(grid);
      picker.classList.add("show");
      KP.voice.say("어떤 그림을 칠할까요?");
    }
    ctx.tap(bScene, () => {
      A.sfx("open");
      openPicker();
    });

    /* ---------- 완성 → 저장 ---------- */
    ctx.tap(bDone, async () => {
      if (bDone.dataset.busy) return;
      const colored = regions.filter((e) => e.getAttribute("fill") !== "#ffffff").length;
      if (!colored) {
        ctx.miss(bDone, "먼저 색을 칠해 봐요!");
        return;
      }
      if (!unsaved) {
        U.replay(bDone, "wig");
        KP.voice.say("벌써 내 작품에 저장했어요!");
        return;
      }
      bDone.dataset.busy = "1";
      const img = await toJpeg(board.firstChild);
      if (!img) {
        delete bDone.dataset.busy;
        KP.toast("저장하지 못했어요");
        return;
      }
      const d = new Date();
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "paint", img, t: Date.now(), date: d.getMonth() + 1 + "월 " + d.getDate() + "일" });
      flyAway(img, board);
      if (ok) {
        unsaved = false;
        KP.toast("🖼️ 내 작품에 저장했어요!");
        A.sfx("sticker");
        delete bDone.dataset.busy; // 기다리는 중에 나가도 버튼이 잠기지 않게
        await ctx.wait(900);
        ctx.round = (ctx.round || 0) + 1;
        await ctx.win({ big: isComplete(), msg: "내 작품에 저장했어요!" });
      } else {
        delete bDone.dataset.busy;
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
      }
    });
    function toJpeg(svgEl) {
      return new Promise((res) => {
        const clone = svgEl.cloneNode(true);
        clone.setAttribute("width", "1000");
        clone.setAttribute("height", "750");
        const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = 1000;
          c.height = 750;
          const x = c.getContext("2d");
          x.fillStyle = "#fff";
          x.fillRect(0, 0, 1000, 750);
          x.drawImage(im, 0, 0, 1000, 750);
          try {
            res(c.toDataURL("image/jpeg", 0.85));
          } catch (e) {
            res(null);
          }
        };
        im.onerror = () => res(null);
        im.src = src;
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
        zIndex: 90, borderRadius: "18px", background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,.25)", pointerEvents: "none",
        transition: "transform .9s cubic-bezier(.5,-0.35,.6,1), opacity .9s",
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

    ctx.load = () => load(sceneId);
    ctx.markColor = markColor;
    ctx.picker = picker;
    ctx.sceneName = () => SCENES.find((s) => s.id === sceneId).name;
    ctx.firstRegion = () => regions[Math.min(regions.length - 1, 2)];
  },
  start(ctx) {
    ctx.picker.classList.remove("show");
    ctx.renderPal();
    ctx.load();
    ctx.markColor();
    ctx.say("색을 고르고 그림을 톡 눌러 칠해 봐요! " + KP.u.josa(ctx.sceneName(), "을/를") + " 칠해 볼까요?");
    ctx.hint(() => ctx.firstRegion(), "그림을 톡 눌러 칠해 봐요!");
  },
});
