/* =====================================================================
   🦁 내 동물원 + 🖌️ 색칠 공방
   - 색칠 공방(zoopaint): 동물 도안(SVG)을 부위별로 눌러 색칠 → "동물원에 보내기"
   - 내 동물원(zoo): 아이가 색칠한 그대로의 동물이 걷고(다리 움직임)·날고·헤엄침
     누르면 폴짝 + 울음소리, 간식 주기, 새 친구 입장 연출
   저장: KP.db "art" {id, kind:"zoo", tid, uid, svg, t, date}
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  const INK = "#3b3355";
  const S = 'stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const F = (p, tag, a, cls = "") => "<" + tag + ' class="fb ' + cls + '" data-p="' + p + '" fill="#ffffff" ' + S + " " + a + "/>";
  const eye = (x, y, r = 5) =>
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + INK + '"/><circle cx="' + (x + 1.6) + '" cy="' + (y - 1.8) + '" r="' + r * 0.36 + '" fill="#fff"/>';
  const blush = (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="6.5" ry="4" fill="#ff8fa3" opacity=".55"/>';
  const line = (d, w = 4) => '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  const leg = (n, x, y, w, h) =>
    '<g class="leg l' + n + '">' + F("leg", "rect", 'x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(w, h) / 2.3 + '"') + "</g>";
  function starPts(cx, cy, R, r, n) {
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2,
        rr = i % 2 ? r : R;
      p.push((cx + Math.cos(a) * rr).toFixed(1) + "," + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return p.join(" ");
  }

  /* ---------------- 동물 도안 (viewBox 0 0 200 170, 오른쪽을 봄) ---------------- */
  const T = {
    dino: {
      name: "공룡", cry: "크아앙!", move: "walk",
      sample: { body: "#7bd389", neck: "#7bd389", head: "#7bd389", tail: "#7bd389", spike: "#ffb347", belly: "#fff3b0", leg: "#5cbf72" },
      svg: () =>
        leg(2, 58, 110, 20, 40) + leg(4, 118, 110, 20, 38) +
        F("tail", "path", 'd="M54 82 Q24 84 6 56 Q16 94 58 108 Z"') +
        ['62,76 66,56 78,70', '80,68 88,48 98,64', '100,64 108,46 116,66', '118,70 126,52 132,78'].map((p) => F("spike", "polygon", 'points="' + p + '"')).join("") +
        F("body", "ellipse", 'cx="96" cy="98" rx="52" ry="34"') +
        F("belly", "ellipse", 'cx="104" cy="114" rx="32" ry="12"') +
        F("neck", "path", 'd="M126 82 Q132 52 146 38 L168 46 Q154 60 150 96 Z"') +
        F("head", "ellipse", 'cx="160" cy="38" rx="28" ry="19"') +
        leg(1, 72, 114, 22, 40) + leg(3, 130, 114, 22, 38) +
        eye(166, 31) + blush(170, 42) + line("M170 46 Q178 48 184 42", 3) + '<circle cx="184" cy="33" r="1.8" fill="' + INK + '"/>',
    },
    lion: {
      name: "사자", cry: "어흥!", move: "walk",
      sample: { body: "#ffc65c", mane: "#e0782f", head: "#ffd27a", ear: "#ffc65c", muzzle: "#fff1d2", tuft: "#e0782f", leg: "#ffb74a" },
      svg: () =>
        leg(2, 60, 108, 20, 40) + leg(4, 116, 108, 20, 40) +
        line("M46 92 Q22 92 22 66", 6) + F("tuft", "circle", 'cx="22" cy="60" r="10"') +
        F("body", "ellipse", 'cx="92" cy="98" rx="50" ry="30"') +
        leg(1, 74, 110, 22, 40) + leg(3, 130, 110, 22, 40) +
        F("mane", "polygon", 'points="' + starPts(150, 68, 46, 36, 14) + '"') +
        F("ear", "circle", 'cx="130" cy="46" r="10"') + F("ear", "circle", 'cx="168" cy="44" r="10"') +
        F("head", "circle", 'cx="150" cy="70" r="28"') +
        F("muzzle", "ellipse", 'cx="160" cy="82" rx="14" ry="10"') +
        eye(142, 64) + eye(162, 62) + blush(136, 78) +
        '<path d="M155 75 L165 75 L160 81 Z" fill="' + INK + '"/>' + line("M154 88 Q160 92 166 88", 3),
    },
    elephant: {
      name: "코끼리", cry: "뿌우우!", move: "walk",
      sample: { body: "#a9b8d6", head: "#b7c5e2", ear: "#f6a6c1", trunk: "#b7c5e2", tusk: "#fffaf0", leg: "#98a8c8" },
      svg: () =>
        leg(2, 56, 112, 24, 38) + leg(4, 108, 112, 24, 38) +
        line("M34 92 Q24 102 28 116", 4) +
        F("body", "ellipse", 'cx="86" cy="96" rx="54" ry="38"') +
        leg(1, 70, 116, 26, 38) + leg(3, 122, 116, 26, 38) +
        F("head", "circle", 'cx="148" cy="74" r="31"') +
        F("trunk", "path", 'd="M168 84 Q188 104 182 130 Q178 140 168 135 Q172 112 156 96 Z"') +
        F("ear", "ellipse", 'cx="132" cy="78" rx="19" ry="27"') +
        F("tusk", "path", 'd="M160 98 Q170 110 158 114 Q158 106 154 100 Z"') +
        eye(158, 66) + blush(162, 84),
    },
    rabbit: {
      name: "토끼", cry: "깡충깡충!", move: "hop",
      sample: { body: "#ffffff", head: "#ffffff", ear: "#ffffff", inner: "#ffb6c9", tail: "#ffffff", foot: "#ffe0ea", leg: "#ffffff" },
      svg: () =>
        F("tail", "circle", 'cx="54" cy="104" r="13"') +
        F("foot", "ellipse", 'cx="84" cy="140" rx="27" ry="11"') +
        F("body", "ellipse", 'cx="92" cy="108" rx="41" ry="34"') +
        leg(3, 114, 116, 17, 34) +
        F("ear", "ellipse", 'cx="132" cy="36" rx="11" ry="31" transform="rotate(-12 132 36)"') +
        F("ear", "ellipse", 'cx="156" cy="34" rx="11" ry="31" transform="rotate(14 156 34)"') +
        F("inner", "ellipse", 'cx="132" cy="38" rx="4.5" ry="20" transform="rotate(-12 132 38)"') +
        F("inner", "ellipse", 'cx="156" cy="36" rx="4.5" ry="20" transform="rotate(14 156 36)"') +
        F("head", "circle", 'cx="146" cy="80" r="29"') +
        eye(154, 74) + blush(160, 88) + '<ellipse cx="172" cy="82" rx="4" ry="3" fill="#ff7a96"/>' + line("M166 92 Q170 96 175 92", 3),
    },
    bear: {
      name: "곰", cry: "으르렁!", move: "walk",
      sample: { body: "#b27b4f", head: "#c48a5a", ear: "#b27b4f", inner: "#f0c9a0", muzzle: "#f3d7b5", belly: "#e8c39b", leg: "#a06d44" },
      svg: () =>
        leg(2, 60, 108, 22, 40) + leg(4, 116, 108, 22, 40) +
        F("body", "ellipse", 'cx="92" cy="98" rx="52" ry="34"') +
        F("belly", "ellipse", 'cx="98" cy="108" rx="28" ry="16"') +
        leg(1, 74, 112, 24, 38) + leg(3, 130, 112, 24, 38) +
        F("ear", "circle", 'cx="134" cy="50" r="12"') + F("ear", "circle", 'cx="166" cy="48" r="12"') +
        F("inner", "circle", 'cx="134" cy="50" r="5"') + F("inner", "circle", 'cx="166" cy="48" r="5"') +
        F("head", "circle", 'cx="150" cy="74" r="29"') +
        F("muzzle", "ellipse", 'cx="166" cy="84" rx="15" ry="11"') +
        '<ellipse cx="170" cy="80" rx="5" ry="4" fill="' + INK + '"/>' + eye(152, 66) + blush(146, 84) + line("M163 90 Q168 94 174 90", 3),
    },
    pig: {
      name: "돼지", cry: "꿀꿀!", move: "walk",
      sample: { body: "#ffb3c7", head: "#ffbfd0", ear: "#ff93ae", snout: "#ff93ae", spot: "#ff93ae", leg: "#ffa3bb" },
      svg: () =>
        leg(2, 62, 114, 20, 34) + leg(4, 118, 114, 20, 34) +
        line("M42 90 q-12 -4 -8 -14 q6 -8 12 0 q4 8 -6 10", 4) +
        F("body", "ellipse", 'cx="96" cy="98" rx="56" ry="36"') +
        F("spot", "ellipse", 'cx="80" cy="88" rx="13" ry="10"') +
        leg(1, 74, 118, 22, 32) + leg(3, 128, 118, 22, 32) +
        F("ear", "polygon", 'points="136,64 130,42 152,58"') + F("ear", "polygon", 'points="160,58 174,40 174,64"') +
        F("head", "circle", 'cx="152" cy="84" r="28"') +
        F("snout", "ellipse", 'cx="177" cy="90" rx="11" ry="13"') +
        '<circle cx="174" cy="87" r="2.2" fill="' + INK + '"/><circle cx="174" cy="94" r="2.2" fill="' + INK + '"/>' + eye(156, 76) + blush(150, 94),
    },
    dog: {
      name: "강아지", cry: "멍멍!", move: "walk",
      sample: { body: "#f5d6a8", head: "#f7dcb2", ear: "#a0663a", spot: "#a0663a", muzzle: "#fff4e3", tail: "#f5d6a8", leg: "#ecc897" },
      svg: () =>
        leg(2, 62, 108, 20, 40) + leg(4, 116, 108, 20, 40) +
        '<g class="tail">' + F("tail", "path", 'd="M48 88 Q30 72 34 52 Q44 70 56 80 Z"') + "</g>" +
        F("body", "ellipse", 'cx="92" cy="98" rx="50" ry="30"') +
        F("spot", "ellipse", 'cx="84" cy="88" rx="16" ry="11"') +
        leg(1, 74, 110, 22, 40) + leg(3, 128, 110, 22, 40) +
        F("head", "circle", 'cx="150" cy="70" r="28"') +
        F("ear", "path", 'd="M128 54 Q116 80 130 98 Q146 80 142 56 Z"') +
        F("muzzle", "ellipse", 'cx="167" cy="80" rx="15" ry="11"') +
        '<ellipse cx="176" cy="75" rx="5" ry="4" fill="' + INK + '"/>' + eye(156, 62) + blush(160, 90) +
        '<path d="M164 88 Q168 98 174 90" fill="#ff7a96" stroke="' + INK + '" stroke-width="2.5"/>',
    },
    fish: {
      name: "물고기", cry: "뻐끔뻐끔!", move: "swim",
      sample: { body: "#5cc6ff", tail: "#ff9f43", fin: "#ff9f43", stripe: "#ffe066" },
      svg: () =>
        '<g class="tailfin">' + F("tail", "polygon", 'points="54,85 16,56 26,85 16,114"') + "</g>" +
        F("fin", "path", 'd="M82 60 Q102 28 132 58 Z"') +
        F("fin", "path", 'd="M94 108 Q106 134 124 112 Z"') +
        F("body", "ellipse", 'cx="106" cy="85" rx="58" ry="34"') +
        F("stripe", "path", 'd="M86 56 Q76 85 86 114 L100 117 Q90 85 100 53 Z"') +
        F("stripe", "path", 'd="M114 52 Q104 85 114 118 L126 116 Q116 85 126 54 Z"') +
        F("fin", "ellipse", 'cx="122" cy="96" rx="12" ry="7" transform="rotate(-20 122 96)"') +
        eye(146, 76, 6) + line("M160 92 Q156 96 160 100", 3),
    },
    bird: {
      name: "새", cry: "짹짹!", move: "fly",
      sample: { body: "#ffd93d", head: "#ffd93d", belly: "#fff4b8", wing: "#ff9f1c", beak: "#ff7f11", tail: "#ff9f1c" },
      svg: () =>
        F("tail", "polygon", 'points="60,88 30,72 34,92 26,106 62,100"') +
        line("M90 120 L88 140 M104 120 L104 140", 4) +
        F("body", "ellipse", 'cx="96" cy="92" rx="42" ry="32"') +
        F("belly", "ellipse", 'cx="106" cy="104" rx="26" ry="15"') +
        F("head", "circle", 'cx="138" cy="66" r="25"') +
        F("beak", "polygon", 'points="158,60 182,68 158,78"') +
        '<g class="wing">' + F("wing", "path", 'd="M72 86 Q92 48 128 74 Q108 106 72 86 Z"') + "</g>" +
        eye(144, 60) + blush(142, 76),
    },
    butterfly: {
      name: "나비", cry: "팔랑팔랑!", move: "fly",
      sample: { wing1: "#ff7eb6", wing2: "#b38cff", spot: "#ffe066", body: "#5b4b8a" },
      svg: () => {
        const half = F("wing1", "path", 'd="M100 84 Q52 16 26 46 Q18 86 100 92 Z"') + F("wing2", "path", 'd="M100 94 Q40 96 46 130 Q66 152 100 102 Z"') +
          F("spot", "circle", 'cx="56" cy="56" r="9"') + F("spot", "circle", 'cx="64" cy="118" r="7"');
        return '<g class="wingL">' + half + '</g><g class="wingR"><g transform="translate(200 0) scale(-1 1)">' + half + "</g></g>" +
          line("M100 62 Q92 40 84 34 M100 62 Q108 40 116 34", 3) + '<circle cx="84" cy="34" r="3.5" fill="' + INK + '"/><circle cx="116" cy="34" r="3.5" fill="' + INK + '"/>' +
          F("body", "ellipse", 'cx="100" cy="96" rx="8" ry="32"') + F("body", "circle", 'cx="100" cy="62" r="10"') +
          '<circle cx="96.5" cy="60" r="2" fill="' + INK + '"/><circle cx="103.5" cy="60" r="2" fill="' + INK + '"/>';
      },
    },
    turtle: {
      name: "거북이", cry: "엉금엉금!", move: "walk", slow: true,
      sample: { shell: "#55b36b", plate: "#8bd99a", rim: "#3d8f52", head: "#a7d86d", leg: "#a7d86d", tail: "#a7d86d" },
      svg: () =>
        leg(2, 64, 106, 20, 26) + leg(4, 128, 106, 20, 26) +
        F("tail", "polygon", 'points="46,104 30,112 48,112"') +
        F("head", "circle", 'cx="172" cy="96" r="17"') +
        F("shell", "path", 'd="M48 106 Q58 46 110 44 Q162 46 170 106 Z"') +
        F("plate", "polygon", 'points="110,56 128,66 128,86 110,96 92,86 92,66"') +
        F("plate", "polygon", 'points="76,74 88,80 88,96 76,102 64,96 64,80"') +
        F("plate", "polygon", 'points="144,74 156,80 156,96 144,102 132,96 132,80"') +
        F("rim", "rect", 'x="44" y="100" width="130" height="13" rx="6.5"') +
        leg(1, 76, 108, 22, 28) + leg(3, 140, 108, 22, 28) +
        eye(178, 90, 4) + line("M176 102 Q181 104 186 100", 3),
    },
  };
  KP.ZOO_T = T;
  const ORDER = ["dino", "lion", "elephant", "rabbit", "bear", "pig", "dog", "fish", "bird", "butterfly", "turtle"];

  /* 공통 CSS */
  KP.css("zoo-common", `
    .zSvg{width:100%;height:100%;overflow:visible;display:block}
    .zSvg .leg{transform-box:fill-box;transform-origin:50% 6%}
    .walking .zSvg .l1,.walking .zSvg .l3{animation:zLegA .42s ease-in-out infinite alternate}
    .walking .zSvg .l2,.walking .zSvg .l4{animation:zLegB .42s ease-in-out infinite alternate}
    @keyframes zLegA{from{transform:rotate(20deg)}to{transform:rotate(-20deg)}}
    @keyframes zLegB{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}
    .zSvg .tail{transform-box:fill-box;transform-origin:100% 100%;animation:zWag .5s ease-in-out infinite alternate}
    @keyframes zWag{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}
    .zSvg .tailfin{transform-box:fill-box;transform-origin:100% 50%;animation:zFin .4s ease-in-out infinite alternate}
    @keyframes zFin{from{transform:scaleY(.8) rotate(-10deg)}to{transform:scaleY(1.05) rotate(10deg)}}
    .zSvg .wing{transform-box:fill-box;transform-origin:30% 70%}
    .flying .zSvg .wing{animation:zFlap .22s ease-in-out infinite alternate}
    @keyframes zFlap{from{transform:rotate(18deg) scaleY(1.1)}to{transform:rotate(-30deg) scaleY(.75)}}
    .zSvg .wingL,.zSvg .wingR{transform-box:view-box;transform-origin:100px 92px}
    .flying .zSvg .wingL,.flying .zSvg .wingR{animation:zBfly .28s ease-in-out infinite alternate}
    @keyframes zBfly{from{transform:scaleX(1)}to{transform:scaleX(.35)}}
  `);

  /* 무늬(특수 색) 정의 */
  const RAINBOW = ["#ff5b6e", "#ffa14a", "#ffe14d", "#4fd37b", "#3fb0ff", "#9a6bff"];
  function ensureDef(svg, uid, kind, base) {
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    const id = uid + "-" + kind + (base ? "-" + base.slice(1) : "");
    if (svg.querySelector("#" + CSS.escape(id))) return "url(#" + id + ")";
    let html = "";
    if (kind === "rainbow")
      html = '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' + RAINBOW.map((c, i) => '<stop offset="' + (i / (RAINBOW.length - 1)) * 100 + '%" stop-color="' + c + '"/>').join("") + "</linearGradient>";
    else if (kind === "glitter")
      html = '<pattern id="' + id + '" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#ffd66b"/><circle cx="4" cy="4" r="2" fill="#fff"/><circle cx="13" cy="9" r="1.5" fill="#ff8ad8"/><circle cx="7" cy="14" r="1.6" fill="#8ad1ff"/><path d="M14 2 l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fff"/></pattern>';
    else if (kind === "dots")
      html = '<pattern id="' + id + '" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="' + base + '"/><circle cx="8" cy="8" r="3.6" fill="#fff" opacity=".85"/></pattern>';
    else if (kind === "stripes")
      html = '<pattern id="' + id + '" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="' + base + '"/><rect width="6" height="14" fill="#fff" opacity=".55"/></pattern>';
    defs.insertAdjacentHTML("beforeend", html);
    return "url(#" + id + ")";
  }

  /** 도안 SVG 문자열 만들기 (fills: data-p → 색, 없으면 흰색) */
  function makeSvg(tid, uid, fills) {
    const svg = '<svg class="zSvg" data-uid="' + uid + '" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg"><defs></defs>' + T[tid].svg() + "</svg>";
    if (!fills) return svg;
    const box = document.createElement("div");
    box.innerHTML = svg;
    box.querySelectorAll(".fb").forEach((e) => {
      const c = fills[e.dataset.p];
      if (c) e.setAttribute("fill", c);
    });
    return box.innerHTML;
  }
  /** 저장된 SVG 를 새 uid 로 (같은 동물 여러 마리여도 무늬 id 충돌 없게) */
  function freshSvg(item) {
    const nu = "z" + KP.newId();
    return item.svg.split(item.uid).join(nu);
  }

  /* =================================================================
     색칠 공방
     ① 동물 고르기 화면(큰 카드) → ② 색칠 화면(그림판이 화면을 꽉 채움)
     - 태블릿 가로: 색은 왼쪽 세로줄, 버튼은 오른쪽 세로줄
     - 폰 세로: 그림판 아래에 색·버튼
     - 도안 여백을 잘라 동물이 그림판을 꽉 채우고,
       부위를 살짝 빗나가도 가장 가까운 부위가 칠해지며, 쓱쓱 문질러도 칠해짐
  ================================================================= */
  const COLORS = ["#ff5b6e", "#ff9f43", "#ffe14d", "#7bd389", "#2fb466", "#5cc6ff", "#2f6fe0", "#9a6bff", "#ff8ad8", "#b27b4f", "#f5d6a8", "#3b3355", "#a9b8d6", "#ffffff"];
  const isWhite = (e) => (e.getAttribute("fill") || "").toLowerCase() === "#ffffff";
  KP.game({
    id: "zoopaint",
    icon: "🖌️",
    name: "색칠 공방",
    cat: "make",
    badge: "NEW",
    setup(ctx) {
      KP.css("zoopaint", `
        /* ① 고르기 */
        .zpChoose{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(130px,19vw,210px),1fr));gap:clamp(10px,1.8vw,18px);padding:8px clamp(12px,2vw,22px) 20px;align-content:start}
        .zpCard{position:relative;background:#fff;border-radius:26px;padding:10px 8px 8px;box-shadow:0 7px 0 rgba(47,58,102,.12);display:flex;flex-direction:column;align-items:center;gap:2px;animation:cardIn .4s backwards;animation-delay:calc(var(--i)*35ms)}
        .zpCard:active{transform:translateY(5px)}
        .zpCard .zpThumb{width:100%;aspect-ratio:200/150}
        .zpCard b{font-weight:400;font-size:clamp(17px,2.4vw,22px)}
        .zpDraft{position:absolute;top:-6px;right:-4px;background:var(--sun);font-size:13px;padding:3px 8px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.12)}
        /* ② 색칠 */
        .zpWork{flex:1;min-height:0;display:grid;gap:10px;padding:2px 12px 12px;grid-template-areas:"paper" "pal" "act";grid-template-rows:minmax(0,1fr) auto auto}
        .zpPaper{grid-area:paper;position:relative;min-height:0;background:radial-gradient(circle at 50% 42%,#fff 55%,#f1f9ff);border-radius:30px;box-shadow:0 8px 0 rgba(47,58,102,.12);touch-action:none;overflow:hidden}
        .zpPaper > svg{position:absolute;inset:2%;width:96%;height:96%}
        .zpPaper .fb{transition:fill .15s;stroke-width:3.2px}
        .zpPaper.fly svg{transition:transform .9s cubic-bezier(.5,-0.3,.7,1),opacity .9s;transform:translate(0,-110%) scale(.3) rotate(-12deg);opacity:0}
        .zpPal{grid-area:pal;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-content:center}
        .zpSp{font-size:22px;width:44px;height:44px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center;flex:0 0 auto}
        .zpSp.sel{border-color:var(--ink);transform:scale(1.15)}
        .zpAct{grid-area:act;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
        .zpB{background:#fff;border-radius:20px;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-width:70px;font-size:14px;line-height:1.1}
        .zpB .e{font-size:30px}
        .zpB:active{transform:translateY(4px)}
        .zpB.send{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000);min-width:110px}
        .zpSpark{position:absolute;pointer-events:none;font-size:30px;animation:zpSpark .6s forwards;z-index:2}
        @keyframes zpSpark{to{transform:translateY(-34px) scale(.4);opacity:0}}
        /* 가로 화면(태블릿): 색은 왼쪽, 버튼은 오른쪽 세로줄 → 그림판이 높이를 다 씀 */
        @media (orientation:landscape) and (min-height:500px){
          .zpWork{grid-template-areas:"pal paper act";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);padding:2px 14px 14px;gap:14px}
          .zpPal{display:grid;grid-template-columns:repeat(2,auto);gap:10px 10px;align-content:center;overflow-y:auto;padding:4px}
          .zpSp{width:clamp(44px,5.2vh,58px);height:clamp(44px,5.2vh,58px);font-size:26px}
          .zpAct{flex-direction:column;flex-wrap:nowrap;justify-content:center}
          .zpB{min-width:96px;padding:8px 10px;font-size:15px}
          .zpB .e{font-size:34px}
          .zpB.send{min-width:96px;padding:12px 10px}
        }
        /* 폰처럼 좁은 세로 화면 */
        @media (max-width:500px){
          .zpSp{width:36px;height:36px;font-size:18px;border-width:3px}
          .zpPal{gap:6px}
          .zpB{min-width:0;flex:1;padding:5px 4px;font-size:12.5px}
          .zpB .e{font-size:26px}
          .zpB.send{min-width:0;flex:1.4}
        }
      `);
      const choose = U.el("div", "zpChoose");
      const work = U.el("div", "zpWork");
      const paper = U.el("div", "zpPaper");
      const pal = U.el("div", "zpPal");
      const act = U.el("div", "zpAct");
      work.append(paper, pal, act);
      ctx.body.append(choose, work);
      Object.assign(ctx, { choose, work, paper, pal, act, drafts: {}, undo: [] });

      /* 색 + 특수 색 */
      ctx.paint = { kind: "color", color: COLORS[0] };
      const sw = [];
      const sel = (b) => {
        sw.forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
      };
      COLORS.forEach((c, i) => {
        const b = U.el("button", "zpSp" + (i === 0 ? " sel" : ""));
        b.style.background = c;
        if (c === "#ffffff") b.style.borderColor = "#e3e7f2";
        b.addEventListener("click", () => {
          ctx.paint = { kind: "color", color: c };
          sel(b);
          KP.audio.sfx("tap");
        });
        pal.appendChild(b);
        sw.push(b);
      });
      [["rainbow", "🌈", "무지개"], ["glitter", "✨", "반짝이"], ["dots", "⚪", "물방울 무늬"], ["stripes", "〰️", "줄무늬"]].forEach(([k, em, nm]) => {
        const b = U.el("button", "zpSp", KP.E(em));
        b.style.background = k === "rainbow" ? "conic-gradient(#ff5b6e,#ffa14a,#ffe14d,#4fd37b,#3fb0ff,#9a6bff,#ff5b6e)" : k === "glitter" ? "linear-gradient(135deg,#ffd56b,#ff8ad8,#8ad1ff)" : "#fff";
        b.addEventListener("click", () => {
          const base = ctx.paint.kind === "color" ? ctx.paint.color : ctx.paint.base || "#5cc6ff";
          ctx.paint = { kind: k, base: base === "#ffffff" ? "#5cc6ff" : base };
          sel(b);
          KP.audio.sfx("sparkle");
          KP.voice.say(nm + "!");
        });
        pal.appendChild(b);
        sw.push(b);
      });

      /* 버튼 (그림 + 짧은 이름) */
      const mk = (em, label, cls = "") => U.btn(KP.E(em) + "<span>" + label + "</span>", "zpB " + cls);
      const bBack = mk("🐾", "다른 동물");
      const bUndo = mk("↩️", "되돌리기");
      const bMagic = mk("🪄", "마법 색칠");
      const bClear = mk("🧽", "처음부터");
      const bSend = mk("🦁", "동물원에 보내기", "send");
      act.append(bBack, bUndo, bMagic, bClear, bSend);
      ctx.bSend = bSend;
      bBack.addEventListener("click", () => {
        KP.audio.sfx("back");
        this.showChoose(ctx);
      });
      bUndo.addEventListener("click", () => {
        const u = ctx.undo.pop();
        if (!u) return KP.audio.sfx("bad");
        u.el.setAttribute("fill", u.prev);
        KP.audio.sfx("slide");
      });
      bMagic.addEventListener("click", () => {
        const svg = paper.querySelector("svg");
        const pal2 = U.shuffle(COLORS.filter((c) => c !== "#3b3355" && c !== "#ffffff"));
        const byPart = {};
        svg.querySelectorAll(".fb").forEach((e, i) => {
          if (!byPart[e.dataset.p]) byPart[e.dataset.p] = Math.random() < 0.15 ? ensureDef(svg, ctx.uid, U.pick(["rainbow", "glitter", "dots"]), pal2[i % pal2.length]) : pal2[Object.keys(byPart).length % pal2.length];
          ctx.undo.push({ el: e, prev: e.getAttribute("fill") });
          e.setAttribute("fill", byPart[e.dataset.p]);
        });
        KP.audio.sfx("sparkle");
        KP.voice.say("뾰로롱! 마법 색칠!");
        U.replay(paper, "jump");
        this.checkDone(ctx);
      });
      bClear.addEventListener("click", () => {
        paper.querySelectorAll(".fb").forEach((e) => {
          ctx.undo.push({ el: e, prev: e.getAttribute("fill") });
          e.setAttribute("fill", "#ffffff");
        });
        ctx.toldDone = false;
        KP.audio.sfx("whoosh");
      });
      bSend.addEventListener("click", () => this.send(ctx));

      /* 칠하기: 누른 곳 → 없으면 가까운 부위(최대 약 40px) */
      const partAt = (x, y) => {
        const hit = (px, py) => {
          const el = document.elementFromPoint(px, py);
          const fb = el && el.closest && el.closest(".fb");
          return fb && paper.contains(fb) ? fb : null;
        };
        let f = hit(x, y);
        if (f) return f;
        for (const r of [10, 20, 30, 42]) {
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            f = hit(x + Math.cos(a) * r, y + Math.sin(a) * r);
            if (f) return f;
          }
        }
        return null;
      };
      const fillPart = (t, x, y, quiet) => {
        const svg = paper.querySelector("svg");
        const fill = ctx.paint.kind === "color" ? ctx.paint.color : ensureDef(svg, ctx.uid, ctx.paint.kind, ctx.paint.base);
        if (t.getAttribute("fill") === fill) return;
        ctx.undo.push({ el: t, prev: t.getAttribute("fill") });
        if (ctx.undo.length > 80) ctx.undo.shift();
        t.setAttribute("fill", fill);
        KP.audio.note(U.pick(KP.audio.SCALE.slice(4, 11)), { inst: "marimba", dur: 0.3, vol: quiet ? 0.12 : 0.22 });
        const r = paper.getBoundingClientRect();
        const sp = U.el("div", "zpSpark", KP.E(ctx.paint.kind === "color" ? "✨" : "🌟"));
        sp.style.left = x - r.left - 15 + "px";
        sp.style.top = y - r.top - 22 + "px";
        paper.appendChild(sp);
        setTimeout(() => sp.remove(), 650);
        this.checkDone(ctx);
      };
      let down = false;
      paper.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        KP.audio.unlock();
        down = true;
        const t = partAt(e.clientX, e.clientY);
        if (t) fillPart(t, e.clientX, e.clientY);
      });
      // 쓱쓱 문질러 칠하기
      paper.addEventListener("pointermove", (e) => {
        if (!down) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const t = el && el.closest && el.closest(".fb");
        if (t && paper.contains(t)) fillPart(t, e.clientX, e.clientY, true);
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => paper.addEventListener(ev, () => (down = false)));
    },
    /* ① 동물 고르기 */
    showChoose(ctx) {
      this.stash(ctx);
      ctx.work.style.display = "none";
      ctx.choose.style.display = "";
      ctx.bubble.style.display = "";
      ctx.choose.innerHTML = "";
      const cards = ORDER.map((tid, i) => {
        const d = ctx.drafts[tid];
        const c = U.btn('<div class="zpThumb">' + (d ? d.svg.replace(/viewBox="[^"]*"/, 'viewBox="0 0 200 170"') : makeSvg(tid, "thumb" + tid, T[tid].sample)) + "</div><b>" + T[tid].name + "</b>", "zpCard");
        c.style.setProperty("--i", i);
        if (d) c.appendChild(U.el("span", "zpDraft", "칠하던 중"));
        c.addEventListener("click", () => {
          KP.audio.sfx("open");
          this.load(ctx, tid);
        });
        ctx.choose.appendChild(c);
        return c;
      });
      ctx.say("어떤 동물을 색칠할까요? 골라 보세요!");
      ctx.hint(() => cards[0], "색칠하고 싶은 동물을 콕 눌러요!");
    },
    /* 칠하던 그림 임시 보관 */
    stash(ctx) {
      const cur = ctx.paper.querySelector("svg");
      if (cur && ctx.tid && [...cur.querySelectorAll(".fb")].some((e) => !isWhite(e))) ctx.drafts[ctx.tid] = { svg: ctx.paper.innerHTML, uid: ctx.uid };
      ctx.paper.innerHTML = "";
      ctx.tid = null;
    },
    /* ② 색칠 화면 */
    load(ctx, tid) {
      ctx.tid = tid;
      ctx.undo = [];
      ctx.toldDone = false;
      ctx.paper.classList.remove("fly");
      const d = ctx.drafts[tid];
      if (d) {
        ctx.uid = d.uid;
        ctx.paper.innerHTML = d.svg;
      } else {
        ctx.uid = "z" + KP.newId();
        ctx.paper.innerHTML = makeSvg(tid, ctx.uid);
      }
      ctx.choose.style.display = "none";
      ctx.work.style.display = "";
      ctx.bubble.style.display = "none"; // 그림판 공간 확보 (안내는 목소리로)
      // 도안 둘레 여백 잘라내기 → 동물이 그림판을 꽉 채움
      requestAnimationFrame(() => {
        const svg = ctx.paper.querySelector("svg");
        if (!svg) return;
        svg.setAttribute("viewBox", "0 0 200 170");
        try {
          const bb = svg.getBBox(),
            pad = 6;
          if (bb.width > 20) svg.setAttribute("viewBox", [bb.x - pad, bb.y - pad, bb.width + pad * 2, bb.height + pad * 2].map((v) => v.toFixed(1)).join(" "));
        } catch (e) {}
      });
      const nm = T[tid].name;
      ctx.instr = U.josa(nm, "을/를") + " 색칠해요! 색을 고르고 콕콕 눌러요.";
      KP.voice.say(ctx.instr);
      ctx.hint(() => ctx.paper.querySelector('.fb[fill="#ffffff"]') || ctx.bSend, "색을 고르고 그림을 콕 눌러 봐요!");
    },
    checkDone(ctx) {
      const left = [...ctx.paper.querySelectorAll(".fb")].filter(isWhite).length;
      if (left === 0 && !ctx.toldDone) {
        ctx.toldDone = true;
        KP.voice.say("우와, 다 칠했다! 동물원에 보내 볼까?");
        U.replay(ctx.bSend, "jump");
        ctx.hint(() => ctx.bSend, "동물원에 보내기를 눌러요!");
      }
    },
    async send(ctx) {
      const fbs = [...ctx.paper.querySelectorAll(".fb")];
      if (!fbs.some((e) => !isWhite(e))) {
        ctx.miss(ctx.bSend, "먼저 예쁘게 색칠해 봐요!", { soft: true });
        return;
      }
      const svg = ctx.paper.querySelector("svg");
      // 동물원에서는 원래 도안 크기 기준으로 그림
      const vb = svg.getAttribute("viewBox");
      svg.setAttribute("viewBox", "0 0 200 170");
      const html = svg.outerHTML;
      svg.setAttribute("viewBox", vb);
      const d = new Date();
      const item = { id: KP.newId(), kind: "zoo", tid: ctx.tid, uid: ctx.uid, svg: html, t: Date.now(), date: d.getMonth() + 1 + "월 " + d.getDate() + "일" };
      await KP.db.put("art", item);
      KP.zooNew = item.id;
      delete ctx.drafts[ctx.tid];
      ctx.paper.classList.add("fly");
      KP.audio.sfx("whoosh");
      const nm = T[ctx.tid].name;
      const ok = await ctx.win({ msg: nm + " 출발!", big: true });
      ctx.paper.innerHTML = "";
      ctx.tid = null;
      if (ok) KP.open("zoo");
    },
    start(ctx) {
      if (ctx.tid) this.load(ctx, ctx.tid);
      else this.showChoose(ctx);
    },
    stop(ctx) {
      // 나갔다 와도 칠하던 그림은 남겨 둠
      const cur = ctx.paper.querySelector("svg");
      if (cur && ctx.tid) ctx.drafts[ctx.tid] = { svg: ctx.paper.innerHTML, uid: ctx.uid };
    },
  });

  /* =================================================================
     내 동물원
  ================================================================= */
  KP.game({
    id: "zoo",
    icon: "🦁",
    name: "내 동물원",
    cat: "make",
    badge: "NEW",
    setup(ctx) {
      KP.css("zoo", `
        .zooW{flex:1;min-height:0;position:relative;margin:0 12px 10px;border-radius:26px;overflow:hidden;box-shadow:0 8px 0 rgba(47,58,102,.12);
          background:linear-gradient(180deg,#9fdcff 0%,#d8f3ff 34%,#c7ef9a 34.2%,#9ad86c 100%)}
        .zooW.night{background:linear-gradient(180deg,#1d2457 0%,#3c4b8a 34%,#4f8a4a 34.2%,#3e7a3b 100%)}
        .zHill{position:absolute;bottom:63%;width:60%;height:22%;border-radius:50% 50% 0 0;background:#b7e58a;opacity:.9}
        .zooW.night .zHill{background:#3f7244}
        .zSun{position:absolute;right:6%;top:5%;font-size:clamp(40px,6vw,64px);animation:bob 5s ease-in-out infinite}
        .zCloud{position:absolute;font-size:clamp(40px,7vw,80px);opacity:.95;animation:zCl 50s linear infinite}
        @keyframes zCl{from{transform:translateX(-30vw)}to{transform:translateX(110vw)}}
        .zPond{position:absolute;right:4%;bottom:5%;width:36%;height:22%;border-radius:50%;background:radial-gradient(ellipse at 40% 35%,#9be3ff,#3fa8e6 70%);border:6px solid #d8c08a;box-shadow:inset 0 6px 12px rgba(0,60,120,.25)}
        .zPond::after{content:"";position:absolute;inset:18% 20%;border-radius:50%;border:3px solid rgba(255,255,255,.35);animation:zRip 2.6s ease-in-out infinite}
        @keyframes zRip{50%{transform:scale(1.15);opacity:.3}}
        .zDeco{position:absolute;line-height:1;pointer-events:none}
        .zFence{position:absolute;left:0;right:0;top:31%;height:7%;background:repeating-linear-gradient(90deg,#c98f4a 0 10px,transparent 10px 34px),linear-gradient(transparent 30%,#c98f4a 30% 42%,transparent 42% 70%,#c98f4a 70% 82%,transparent 82%);opacity:.8;pointer-events:none}
        .zSign{position:absolute;left:3%;top:18%;background:#ffefc2;border:4px solid #b9773a;border-radius:14px;padding:4px 12px;font-size:clamp(16px,2.4vw,24px);color:#7a4a1e;box-shadow:0 4px 0 rgba(0,0,0,.12);z-index:1}
        .zA{position:absolute;left:0;top:0;transform-origin:50% 100%;will-change:transform;cursor:pointer;touch-action:none}
        .zA .zIn{width:100%;height:100%;transition:transform .2s}
        .zA.left .zIn{transform:scaleX(-1)}
        .zA .zBob{width:100%;height:100%}
        .zA.walking .zBob{animation:zBob .21s ease-in-out infinite alternate}
        @keyframes zBob{to{transform:translateY(-4%)}}
        .zA.jump .zBob{animation:zJump .6s ease-out}
        @keyframes zJump{30%{transform:translateY(-38%) scale(1.06)}60%{transform:translateY(0) scale(1.08,.92)}}
        .zA.new .zBob{filter:drop-shadow(0 0 12px #fff6a8)}
        .zShadow{position:absolute;left:12%;right:12%;bottom:-4%;height:10%;border-radius:50%;background:rgba(0,40,0,.18)}
        .zHeart{position:absolute;pointer-events:none;font-size:28px;animation:zHeart 1.2s ease-out forwards;z-index:999}
        @keyframes zHeart{to{transform:translateY(-70px) scale(1.3);opacity:0}}
        .zTreat{position:absolute;font-size:clamp(30px,4.4vw,44px);line-height:1;pointer-events:none;transition:top .7s cubic-bezier(.4,1.6,.6,1)}
        .zBar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:0 10px 12px;flex:0 0 auto}
        .zEmpty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;z-index:5;font-size:clamp(20px,3vw,30px);color:#2f3a66;text-shadow:0 2px 0 #fff}
        .zDel{position:absolute;z-index:1000;background:#fff;border-radius:999px;padding:8px 14px;font-size:18px;box-shadow:0 4px 0 rgba(0,0,0,.15);color:#c62828}
        .zCount{position:absolute;right:10px;top:8px;z-index:2;background:rgba(255,255,255,.85);border-radius:999px;padding:4px 12px;font-size:clamp(16px,2.2vw,20px)}
      `);
      const W = U.el("div", "zooW");
      const bar = U.el("div", "zBar");
      ctx.body.append(W, bar);
      ctx.W = W;
      // 배경
      W.innerHTML =
        '<div class="zHill" style="left:-10%"></div><div class="zHill" style="left:45%;width:70%;height:18%"></div>' +
        '<div class="zSun">' + KP.E("☀️") + "</div>" +
        Array.from({ length: 14 }, (_, i) => '<div class="zDeco zStar" style="left:' + ((i * 37) % 96 + 2) + "%;top:" + ((i * 13) % 26 + 2) + '%;font-size:' + (10 + (i % 3) * 5) + 'px">' + KP.E("✨") + "</div>").join("") +
        '<div class="zCloud" style="top:4%">' + KP.E("☁️") + '</div><div class="zCloud" style="top:12%;animation-duration:75s;animation-delay:-30s">' + KP.E("☁️") + "</div>" +
        '<div class="zFence"></div><div class="zSign">' + KP.E("🎪") + " 우리 동물원</div>" +
        '<div class="zPond"></div>' +
        '<div class="zDeco" style="left:2%;top:26%;font-size:clamp(60px,9vw,110px)">' + KP.E("🌳") + "</div>" +
        '<div class="zDeco" style="left:30%;top:24%;font-size:clamp(46px,7vw,84px)">' + KP.E("🌲") + "</div>" +
        '<div class="zDeco" style="left:58%;top:25%;font-size:clamp(54px,8vw,96px)">' + KP.E("🌳") + "</div>" +
        '<div class="zDeco" style="left:6%;bottom:6%;font-size:clamp(30px,4vw,44px)">' + KP.E("🌷") + "</div>" +
        '<div class="zDeco" style="left:44%;bottom:3%;font-size:clamp(28px,4vw,42px)">' + KP.E("🌼") + "</div>" +
        '<div class="zDeco" style="right:40%;bottom:30%;font-size:clamp(26px,3.6vw,38px)">' + KP.E("🍄") + "</div>";
      ctx.count = U.el("div", "zCount");
      W.appendChild(ctx.count);

      const bPaint = U.btn(KP.E("🖌️") + " 새 친구 색칠하기", "btn primary");
      const bTreat = U.btn(KP.E("🍎") + " 간식 주기", "btn");
      const bCall = U.btn(KP.E("📣") + " 모두 모여라", "btn");
      bar.append(bPaint, bTreat, bCall);
      ctx.bPaint = bPaint;
      bPaint.addEventListener("click", () => KP.open("zoopaint"));
      bTreat.addEventListener("click", () => this.treats(ctx));
      bCall.addEventListener("click", () => this.callAll(ctx));
      // 빈 땅을 누르면 그곳에 간식
      W.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".zA,.zDel,.zEmpty,.btn")) return;
        const r = W.getBoundingClientRect();
        const x = e.clientX - r.left,
          y = e.clientY - r.top;
        if (y > r.height * 0.4 && ctx.animals && ctx.animals.length) this.dropTreat(ctx, x, y);
      });
    },
    async start(ctx) {
      const W = ctx.W;
      const h = new Date().getHours();
      const night = h >= 19 || h < 6;
      W.classList.toggle("night", night);
      U.$(".zSun", W).innerHTML = KP.E(night ? "🌙" : "☀️");
      U.$$(".zStar", W).forEach((e) => (e.style.display = night ? "" : "none"));
      U.$$(".zA,.zTreat,.zEmpty,.zDel", W).forEach((e) => e.remove());
      ctx.animals = [];
      ctx.treatsArr = [];
      const items = (await KP.db.all("art")).filter((x) => x.kind === "zoo" && T[x.tid]).slice(-30);
      if (!ctx._active) return;
      ctx.count.innerHTML = KP.E("🐾") + " " + items.length + "마리";
      if (!items.length) {
        ctx.say("아직 동물원이 비어 있어요. 색칠 공방에서 동물을 색칠해서 보내 주세요!");
        const em = U.el("div", "zEmpty", '<div class="big-em">' + KP.E("🐻") + "</div><div>동물 친구를 데려와요!</div>");
        const go = U.btn(KP.E("🖌️") + " 색칠하러 가기", "btn big primary");
        go.addEventListener("click", () => KP.open("zoopaint"));
        em.appendChild(go);
        W.appendChild(em);
        ctx.hint(() => go);
        return;
      }
      const newId = KP.zooNew;
      KP.zooNew = null;
      items.forEach((it) => this.add(ctx, it, it.id === newId));
      if (newId) {
        const a = ctx.animals.find((x) => x.item.id === newId);
        if (a) {
          ctx.say("새 친구 " + U.josa(T[a.item.tid].name, "이/가") + " 동물원에 왔어요! 환영해!");
          ctx.after(600, () => KP.confetti(140));
        }
      } else ctx.say(U.pick(["동물 친구들을 콕 눌러 보세요!", "빈 땅을 누르면 간식을 줄 수 있어요!", "내가 색칠한 친구들이 놀고 있어요!"]));
      ctx.hint(() => (ctx.animals[0] ? ctx.animals[0].el : null), "동물 친구를 콕 눌러 보세요!");
      ctx.loop((dt, now) => this.tick(ctx, dt, now));
    },
    /* --- 동물 하나 배치 --- */
    add(ctx, item, isNew) {
      const W = ctx.W,
        Wd = W.clientWidth,
        Ht = W.clientHeight;
      const t = T[item.tid];
      const el = U.el("div", "zA");
      el.innerHTML = '<div class="zIn"><div class="zBob">' + (t.move === "walk" || t.move === "hop" ? '<div class="zShadow"></div>' : "") + freshSvg(item) + "</div></div>";
      const base = U.clamp(Math.min(Wd, Ht * 1.5) * 0.2, 90, 200);
      const size = t.move === "swim" ? base * 0.62 : t.move === "fly" ? base * 0.7 : t.slow ? base * 0.8 : base;
      el.style.width = size + "px";
      el.style.height = size * 0.85 + "px";
      W.appendChild(el);
      const a = { el, item, t, size, x: 0, y: 0, tx: 0, ty: 0, state: "idle", wait: Math.random() * 2, dir: 1, ph: Math.random() * 6, treat: null };
      const p = this.randPos(ctx, t.move);
      a.x = p.x;
      a.y = p.y;
      if (isNew && t.move !== "swim") {
        // 새 친구는 왼쪽 문에서 걸어 들어옴
        a.x = -size;
        a.y = Ht * 0.7;
        a.state = "walk";
        a.tx = Wd * 0.3;
        a.ty = Ht * 0.7;
        el.classList.add("new");
        setTimeout(() => el.classList.remove("new"), 6000);
      }
      a.tx = a.tx || a.x;
      a.ty = a.ty || a.y;
      // 누르기 / 길게 누르기(보내기)
      let lp = 0;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        KP.audio.unlock();
        this.poke(ctx, a);
        clearTimeout(lp);
        lp = setTimeout(() => this.askDelete(ctx, a), 1800);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => clearTimeout(lp)));
      ctx.animals.push(a);
      this.place(ctx, a);
      return a;
    },
    randPos(ctx, move) {
      const Wd = ctx.W.clientWidth,
        Ht = ctx.W.clientHeight;
      if (move === "fly") return { x: U.randf(0.1, 0.9) * Wd, y: U.randf(0.12, 0.3) * Ht };
      if (move === "swim") {
        const a = U.randf(0, 6.28),
          rr = Math.sqrt(Math.random()) * 0.7;
        return { x: Wd * (0.78 + Math.cos(a) * 0.16 * rr), y: Ht * (0.84 + Math.sin(a) * 0.09 * rr) };
      }
      for (let i = 0; i < 20; i++) {
        const x = U.randf(0.08, 0.92) * Wd,
          y = U.randf(0.5, 0.95) * Ht;
        // 연못 피하기
        const dx = (x / Wd - 0.78) / 0.2,
          dy = (y / Ht - 0.84) / 0.13;
        if (dx * dx + dy * dy > 1) return { x, y };
      }
      return { x: 0.2 * Wd, y: 0.7 * Ht };
    },
    place(ctx, a) {
      const Ht = ctx.W.clientHeight;
      let s = 1;
      if (a.t.move === "walk" || a.t.move === "hop") s = 0.62 + 0.48 * U.clamp((a.y / Ht - 0.45) / 0.5, 0, 1);
      let lift = 0;
      if (a.t.move === "hop" && a.state === "walk") lift = Math.abs(Math.sin(a.ph * 2.2)) * a.size * 0.18;
      if (a.t.move === "fly") lift = Math.sin(a.ph * 1.6) * 10;
      // 땅 동물은 발(아래 가운데), 물고기·새는 몸 가운데를 기준점으로
      const anchorY = a.t.move === "swim" || a.t.move === "fly" ? a.size * 0.425 : a.size * 0.85;
      a.el.style.transform = "translate(" + (a.x - a.size / 2) + "px," + (a.y - anchorY - lift) + "px) scale(" + s + ")";
      a.el.style.zIndex = a.t.move === "fly" ? 900 : Math.round(a.y);
    },
    tick(ctx, dt) {
      for (const a of ctx.animals) {
        a.ph += dt * 4;
        const speed = (a.t.move === "fly" ? 70 : a.t.move === "swim" ? 30 : a.t.slow ? 16 : a.t.move === "hop" ? 60 : 46) * (a.treat ? 1.8 : 1);
        if (a.state === "idle") {
          a.wait -= dt;
          a.el.classList.remove("walking");
          if (a.t.move === "fly") a.el.classList.add("flying");
          if (a.wait <= 0) {
            const p = a.treat || this.randPos(ctx, a.t.move);
            a.tx = p.x;
            a.ty = p.y;
            a.state = "walk";
          }
        } else {
          const dx = a.tx - a.x,
            dy = a.ty - a.y,
            d = Math.hypot(dx, dy);
          if (d < 4) {
            a.state = "idle";
            a.wait = a.t.move === "fly" ? U.randf(0.3, 1) : U.randf(1, 3.5);
            if (a.treat) this.eat(ctx, a);
          } else {
            const st = Math.min(d, speed * dt);
            a.x += (dx / d) * st;
            a.y += (dy / d) * st;
            if (Math.abs(dx) > 2) {
              const left = dx < 0;
              a.el.classList.toggle("left", left);
            }
            a.el.classList.add(a.t.move === "fly" ? "flying" : "walking");
          }
        }
        this.place(ctx, a);
      }
    },
    poke(ctx, a) {
      U.replay(a.el, "jump");
      const nm = a.t.name;
      KP.voice.say(nm + "! " + a.t.cry + " 내가 색칠한 " + nm + "예요!");
      KP.audio.sfx(U.pick(["boing", "pop", "tap2"]));
      this.hearts(ctx, a, 2);
    },
    hearts(ctx, a, n) {
      const W = ctx.W;
      for (let i = 0; i < n; i++) {
        const h = U.el("div", "zHeart", KP.E(U.pick(["💖", "💕", "⭐"])));
        h.style.left = a.x - 14 + U.randf(-20, 20) + "px";
        h.style.top = a.y - a.size * 0.9 + "px";
        h.style.animationDelay = i * 0.15 + "s";
        W.appendChild(h);
        setTimeout(() => h.remove(), 1500);
      }
    },
    dropTreat(ctx, x, y) {
      const W = ctx.W;
      const em = U.pick(["🍎", "🥕", "🍌", "🐟", "🍖", "🌽"]);
      const t = U.el("div", "zTreat", KP.E(em));
      t.style.left = x - 20 + "px";
      t.style.top = "-50px";
      W.appendChild(t);
      requestAnimationFrame(() => (t.style.top = y - 30 + "px"));
      KP.audio.sfx("drop");
      const tr = { x, y, el: t, taken: false };
      ctx.treatsArr.push(tr);
      // 가장 가까운 땅 친구가 먹으러 감
      const land = ctx.animals.filter((a) => (a.t.move === "walk" || a.t.move === "hop") && !a.treat);
      land.sort((p, q) => Math.hypot(p.x - x, p.y - y) - Math.hypot(q.x - x, q.y - y));
      const a = land[0];
      if (a) {
        a.treat = tr;
        a.tx = x;
        a.ty = y;
        a.state = "walk";
      } else ctx.after(4000, () => t.remove());
    },
    eat(ctx, a) {
      const tr = a.treat;
      a.treat = null;
      if (!tr || tr.taken) return;
      tr.taken = true;
      tr.el.remove();
      U.replay(a.el, "jump");
      this.hearts(ctx, a, 3);
      KP.audio.sfx("bubble");
      KP.voice.say(U.pick(["냠냠! 맛있다!", "고마워요!", "냠냠냠!"]));
    },
    treats(ctx) {
      const Wd = ctx.W.clientWidth,
        Ht = ctx.W.clientHeight;
      if (!ctx.animals.length) return;
      for (let i = 0; i < 3; i++) ctx.after(i * 250, () => {
        const p = this.randPos(ctx, "walk");
        this.dropTreat(ctx, p.x, p.y);
      });
      KP.voice.say("간식 시간이에요!");
    },
    callAll(ctx) {
      if (!ctx.animals.length) return;
      const Wd = ctx.W.clientWidth,
        Ht = ctx.W.clientHeight;
      KP.audio.sfx("levelup");
      KP.voice.say("모두 모여라! 하나, 둘, 셋!");
      ctx.animals.forEach((a, i) => {
        if (a.t.move === "swim") return;
        a.treat = null;
        const ang = (i / ctx.animals.length) * Math.PI * 2;
        a.tx = Wd * 0.42 + Math.cos(ang) * Wd * 0.2;
        a.ty = a.t.move === "fly" ? Ht * 0.22 : Ht * 0.68 + Math.sin(ang) * Ht * 0.12;
        a.state = "walk";
      });
      ctx.after(3200, () => {
        ctx.animals.forEach((a, i) => ctx.after(i * 80, () => U.replay(a.el, "jump")));
        KP.confetti(100);
        KP.audio.jingle();
      });
    },
    askDelete(ctx, a) {
      U.$$(".zDel", ctx.W).forEach((e) => e.remove());
      const b = U.btn(KP.E("👋") + " 집으로 보내기(꾹)", "zDel");
      b.style.left = U.clamp(a.x - 80, 4, ctx.W.clientWidth - 200) + "px";
      b.style.top = Math.max(4, a.y - a.size - 50) + "px";
      ctx.W.appendChild(b);
      KP.hold(b, 1500, async () => {
        await KP.db.del("art", a.item.id);
        a.el.style.transition = "opacity .5s, transform .5s";
        a.el.style.opacity = "0";
        ctx.animals = ctx.animals.filter((x) => x !== a);
        setTimeout(() => a.el.remove(), 520);
        b.remove();
        ctx.count.innerHTML = KP.E("🐾") + " " + ctx.animals.length + "마리";
        KP.voice.say("안녕! 또 만나!");
      });
      ctx.after(4000, () => b.remove());
    },
  });
})();
