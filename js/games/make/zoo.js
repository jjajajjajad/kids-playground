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
    const safe = KP.sanitizeSvg(String(item.svg || "")); // 백업 파일 등으로 들어온 값 방어
    return item.uid ? safe.split(String(item.uid)).join(nu) : safe;
  }

  /* =================================================================
     직접 칠하기(붓) 공통
     - 부위(.fb)마다 자기 좌표계의 그림판(캔버스)을 따로 둠 → 칠은 그 부위 안에만,
       나중 부위가 앞 부위를 가리는 순서도 그대로, 동물원에서 다리가 움직여도 그림이 따라감
     - 저장: item.paint = { 부위번호: {x,y,w,h,src(PNG data URL)} } (SVG 는 그대로 → 예전 그림과 호환)
  ================================================================= */
  const PK = 4; // 도안 1단위 = 4px
  const NS = "http://www.w3.org/2000/svg";
  /** 요소 자기 좌표계의 모양 (Path2D) */
  function elPath(el) {
    const t = el.tagName.toLowerCase(),
      n = (a) => +el.getAttribute(a) || 0;
    if (t === "path") return new Path2D(el.getAttribute("d") || "");
    const p = new Path2D();
    if (t === "ellipse") p.ellipse(n("cx"), n("cy"), n("rx"), n("ry"), 0, 0, Math.PI * 2);
    else if (t === "circle") p.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2);
    else if (t === "rect") {
      const r = Math.min(n("rx") || n("ry"), n("width") / 2, n("height") / 2);
      if (p.roundRect) p.roundRect(n("x"), n("y"), n("width"), n("height"), r);
      else p.rect(n("x"), n("y"), n("width"), n("height"));
    } else if (t === "polygon") {
      const v = String(el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
      if (v.length >= 4) {
        p.moveTo(v[0], v[1]);
        for (let i = 2; i + 1 < v.length; i += 2) p.lineTo(v[i], v[i + 1]);
        p.closePath();
      }
    }
    return p;
  }
  /** 저장된 칠 자료 검사 (백업 파일 등 바깥에서 들어온 값 방어) */
  function cleanPaint(pt) {
    const out = {};
    if (!pt || typeof pt !== "object") return out;
    for (const [k, v] of Object.entries(pt)) {
      if (!/^\d{1,3}$/.test(k) || !v || typeof v !== "object") continue;
      if (typeof v.src !== "string" || !/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v.src) || v.src.length > 2e6) continue;
      const nums = ["x", "y", "w", "h"].map((q) => +v[q]);
      if (!nums.every(Number.isFinite) || nums[2] <= 0 || nums[3] <= 0 || nums[2] > 400 || nums[3] > 400) continue;
      out[k] = { x: nums[0], y: nums[1], w: nums[2], h: nums[3], src: v.src };
    }
    return out;
  }
  KP.zooCleanPaint = cleanPaint;
  /** SVG 안 각 부위 바로 뒤에 그 부위의 그림을 끼워 넣음 (부위 모양으로 잘라서) */
  function applyPaint(svg, paints, pre, only) {
    if (!svg || !paints) return;
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(NS, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    svg.querySelectorAll(".fb").forEach((el, i) => {
      if (only !== undefined && only !== i) return;
      // 예전에 끼운 것 지우기
      while (el.nextElementSibling && /\bpp\b|\bppo\b/.test(el.nextElementSibling.getAttribute("class") || "")) el.nextElementSibling.remove();
      const pp = paints[i];
      if (!pp) return;
      const id = pre + "-cp" + i;
      let cp = defs.querySelector("#" + CSS.escape(id));
      if (!cp) {
        cp = document.createElementNS(NS, "clipPath");
        cp.setAttribute("id", id);
        defs.appendChild(cp);
      }
      cp.innerHTML = "";
      const sh = el.cloneNode(false);
      ["transform", "class", "data-p", "stroke", "stroke-width"].forEach((a) => sh.removeAttribute(a));
      cp.appendChild(sh);
      const im = document.createElementNS(NS, "image");
      im.setAttribute("class", "pp");
      im.setAttribute("x", pp.x);
      im.setAttribute("y", pp.y);
      im.setAttribute("width", pp.w);
      im.setAttribute("height", pp.h);
      im.setAttribute("preserveAspectRatio", "none");
      im.setAttribute("href", pp.src);
      im.setAttribute("clip-path", "url(#" + id + ")");
      im.setAttribute("pointer-events", "none");
      const tr = el.getAttribute("transform");
      if (tr) im.setAttribute("transform", tr);
      // 테두리는 그림 위에 다시 (칠이 선을 덮지 않게)
      const ol = el.cloneNode(false);
      ol.setAttribute("class", "ppo");
      ol.removeAttribute("data-p");
      ol.setAttribute("fill", "none");
      ol.setAttribute("pointer-events", "none");
      el.after(im, ol);
    });
  }
  KP.zooApplyPaint = applyPaint;
  /** 저장용: 화면에 끼워 넣은 칠(그림·잘라내기·테두리)을 뺀 원래 도안 */
  function plainSvg(svg) {
    const c = svg.cloneNode(true);
    c.querySelectorAll(".pp,.ppo").forEach((e) => e.remove());
    c.querySelectorAll("clipPath").forEach((e) => /-cp\d+$/.test(e.id) && e.remove());
    return c.outerHTML;
  }
  function packPaint(pp) {
    const o = {};
    for (const [k, v] of Object.entries(pp || {})) if (v && v.src) o[k] = { x: v.x, y: v.y, w: v.w, h: v.h, src: v.src };
    return o;
  }
  /** 붓 무늬 (무지개는 칠하면서 색이 바뀌고, 반짝이·물방울·줄무늬는 무늬 붓) */
  const brushTiles = new Map();
  function brushTile(kind, base) {
    const key = kind + base;
    if (brushTiles.has(key)) return brushTiles.get(key);
    const c = document.createElement("canvas");
    c.width = c.height = 40;
    const g = c.getContext("2d");
    if (kind === "glitter") {
      g.fillStyle = "#ffd66b";
      g.fillRect(0, 0, 40, 40);
      [["#fff", 8, 8, 3], ["#ff8ad8", 26, 18, 2.5], ["#8ad1ff", 14, 30, 2.6], ["#fff", 32, 34, 2]].forEach(([col, x, y, r]) => {
        g.fillStyle = col;
        g.beginPath();
        g.arc(x, y, r, 0, 7);
        g.fill();
      });
    } else if (kind === "dots") {
      g.fillStyle = base;
      g.fillRect(0, 0, 40, 40);
      g.fillStyle = "rgba(255,255,255,.88)";
      [[10, 10], [30, 30]].forEach(([x, y]) => {
        g.beginPath();
        g.arc(x, y, 6, 0, 7);
        g.fill();
      });
    } else {
      g.fillStyle = base;
      g.fillRect(0, 0, 40, 40);
      g.strokeStyle = "rgba(255,255,255,.6)";
      g.lineWidth = 8;
      for (let k = -40; k < 80; k += 20) {
        g.beginPath();
        g.moveTo(k, 0);
        g.lineTo(k + 40, 40);
        g.stroke();
      }
    }
    brushTiles.set(key, c);
    return c;
  }
  /** 붓 한 획을 그리기 (점 목록, 요소 좌표) */
  function drawStroke(g, pts, paint, width, from = 1) {
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = width;
    if (paint.kind === "rainbow") {
      // 길이에 따라 색이 바뀌는 무지개 붓
      let len = paint._len || 0;
      for (let i = Math.max(1, from); i < pts.length; i++) {
        const a = pts[i - 1],
          b = pts[i];
        len += Math.hypot(b.x - a.x, b.y - a.y);
        g.strokeStyle = "hsl(" + ((len * 4) % 360) + ",90%,62%)";
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
      if (pts.length === 1) {
        g.fillStyle = "hsl(0,90%,62%)";
        g.beginPath();
        g.arc(pts[0].x, pts[0].y, width / 2, 0, 7);
        g.fill();
      }
      return len;
    }
    g.strokeStyle = paint.kind === "color" ? paint.color : g.createPattern(brushTile(paint.kind, paint.base || "#5cc6ff"), "repeat");
    g.beginPath();
    g.moveTo(pts[Math.max(0, from - 1)].x, pts[Math.max(0, from - 1)].y);
    for (let i = from; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    if (pts.length === 1) g.lineTo(pts[0].x + 0.01, pts[0].y);
    g.stroke();
    return 0;
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
        .zpSp.myPaint{position:relative;border-color:#ffe7a3}
        .zpSp.myPaint.sel{border-color:var(--ink)}
        .zpSp.myPaint .tag{position:absolute;right:-10px;top:-10px;font-size:17px;line-height:1;pointer-events:none}
        .zpSep{flex:0 0 100%;height:3px;border-radius:3px;background:repeating-linear-gradient(90deg,#c9d2e6 0 6px,transparent 6px 11px)}
        .zpAct{grid-area:act;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
        .zpB{background:#fff;border-radius:20px;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-width:70px;font-size:14px;line-height:1.1}
        .zpB .e{font-size:30px}
        .zpB:active{transform:translateY(4px)}
        .zpB.send{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000);min-width:110px}
        .zpSpark{position:absolute;pointer-events:none;font-size:30px;animation:zpSpark .6s forwards;z-index:2}
        .zpLive{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
        .zpTools{flex:0 0 100%;display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;grid-column:1/-1;margin-bottom:2px}
        .zpTool{background:#fff;border-radius:16px;box-shadow:0 4px 0 rgba(47,58,102,.13);padding:4px 8px;display:flex;flex-direction:column;align-items:center;font-size:12px;line-height:1.1;min-width:52px}
        .zpTool .e{font-size:26px}
        .zpTool.sel{background:#ffe79a;box-shadow:0 0 0 3px var(--ink),0 4px 0 rgba(47,58,102,.13)}
        .zpSize{width:40px;height:40px;border-radius:50%;background:#fff;box-shadow:0 3px 0 rgba(47,58,102,.13);display:flex;align-items:center;justify-content:center}
        .zpSize i{display:block;border-radius:50%;background:var(--ink)}
        .zpSize.sel{background:#ffe79a;box-shadow:0 0 0 3px var(--ink)}
        .zpTools.noSize .zpSize{display:none}
        @keyframes zpSpark{to{transform:translateY(-34px) scale(.4);opacity:0}}
        /* 가로 화면(태블릿): 색은 왼쪽, 버튼은 오른쪽 세로줄 → 그림판이 높이를 다 씀 */
        @media (orientation:landscape) and (min-height:500px){
          .zpWork{grid-template-areas:"pal paper act";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);padding:2px 14px 14px;gap:14px}
          .zpPal{display:grid;grid-template-columns:repeat(2,auto);gap:10px 10px;align-content:center;overflow-y:auto;padding:4px}
          .zpPal.mine3{grid-template-columns:repeat(3,auto)}
          .zpSep{grid-column:1/-1;height:3px}
          .zpSp{width:clamp(44px,5.2vh,58px);height:clamp(44px,5.2vh,58px);font-size:26px}
          .zpTools{display:grid;grid-template-columns:repeat(3,auto);justify-content:center}
          .zpTool{min-width:0;padding:4px 6px}
          .zpAct{flex-direction:column;flex-wrap:nowrap;justify-content:center}
          .zpB{min-width:96px;padding:8px 10px;font-size:15px}
          .zpB .e{font-size:34px}
          .zpB.send{min-width:96px;padding:12px 10px}
        }
        /* 폰처럼 좁은 세로 화면 */
        @media (max-width:500px){
          .zpSp{width:36px;height:36px;font-size:18px;border-width:3px}
          .zpTool{min-width:44px;padding:3px 5px;font-size:11px}
          .zpTool .e{font-size:22px}
          .zpSize{width:34px;height:34px}
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
      Object.assign(ctx, { choose, work, paper, pal, act, drafts: {}, undo: [], pp: {}, tool: "brush", size: 1 });
      const SIZES = [4, 8, 14]; // 붓 굵기 (도안 단위)

      /* 색 + 특수 색 */
      ctx.paint = { kind: "color", color: COLORS[0] };
      const sw = [];
      const sel = (b) => {
        sw.forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
      };
      // 팔레트: 내 물감(물감 실험실에서 담은 색, 최근 6개)을 맨 앞에 🎨 표시로 → 색칠 화면에 들어올 때마다 다시 그림
      ctx.renderPal = () => {
        pal.innerHTML = "";
        sw.length = 0;
        const mine = KP.paint
          ? KP.paint.mine().map((m) => ({ hex: m.hex.toLowerCase(), n: m.n })).filter((m) => !COLORS.includes(m.hex)).slice(0, 6)
          : [];
        pal.classList.toggle("mine3", mine.length > 2);
        // 도구: 크레파스(직접 칠하기) · 붓기(부위 한 번에) · 지우개 + 굵기
        const tools = U.el("div", "zpTools" + (ctx.tool === "fill" ? " noSize" : ""));
        [["brush", "🖍️", "크레파스"], ["fill", "🪣", "붓기"], ["erase", "🧽", "지우개"]].forEach(([k, em, nm]) => {
          const b = U.btn(KP.E(em) + "<span>" + nm + "</span>", "zpTool" + (ctx.tool === k ? " sel" : ""));
          b.addEventListener("click", () => {
            ctx.tool = k;
            KP.audio.sfx("tap");
            KP.voice.say(nm + "!");
            ctx.renderPal();
          });
          tools.appendChild(b);
        });
        SIZES.forEach((w, k) => {
          const b = U.btn('<i style="width:' + (6 + k * 7) + "px;height:" + (6 + k * 7) + 'px"></i>', "zpSize" + (ctx.size === k ? " sel" : ""));
          b.addEventListener("click", () => {
            ctx.size = k;
            KP.audio.sfx("tap");
            ctx.renderPal();
          });
          tools.appendChild(b);
        });
        pal.appendChild(tools);
        const cur = ctx.paint.kind === "color" ? ctx.paint.color : null;
        if (cur && !COLORS.includes(cur) && !mine.some((m) => m.hex === cur)) ctx.paint = { kind: "color", color: COLORS[0] };
        mine.forEach((m) => {
          const b = U.el("button", "zpSp zpMine myPaint" + (ctx.paint.color === m.hex ? " sel" : ""), '<span class="tag">' + KP.E("🎨") + "</span>");
          b.style.background = m.hex;
          b.addEventListener("click", () => {
            ctx.paint = { kind: "color", color: m.hex };
            sel(b);
            if (ctx.tool === "erase") {
              ctx.tool = "brush";
              ctx.renderPal();
            }
            KP.audio.sfx("tap");
            KP.voice.say("내가 만든 " + (m.n || "물감"));
          });
          pal.appendChild(b);
          sw.push(b);
        });
        if (mine.length) pal.appendChild(U.el("span", "zpSep"));
        COLORS.forEach((c) => {
          const b = U.el("button", "zpSp" + (ctx.paint.kind === "color" && ctx.paint.color === c ? " sel" : ""));
          b.style.background = c;
          if (c === "#ffffff") b.style.borderColor = "#e3e7f2";
          b.addEventListener("click", () => {
            ctx.paint = { kind: "color", color: c };
            sel(b);
            KP.audio.sfx("tap");
            if (ctx.tool === "erase") {
              ctx.tool = "brush";
              ctx.renderPal();
            }
          });
          pal.appendChild(b);
          sw.push(b);
        });
        [["rainbow", "🌈", "무지개"], ["glitter", "✨", "반짝이"], ["dots", "⚪", "물방울 무늬"], ["stripes", "〰️", "줄무늬"]].forEach(([k, em, nm]) => {
          const b = U.el("button", "zpSp" + (ctx.paint.kind === k ? " sel" : ""), KP.E(em));
          b.style.background = k === "rainbow" ? "conic-gradient(#ff5b6e,#ffa14a,#ffe14d,#4fd37b,#3fb0ff,#9a6bff,#ff5b6e)" : k === "glitter" ? "linear-gradient(135deg,#ffd56b,#ff8ad8,#8ad1ff)" : "#fff";
          b.addEventListener("click", () => {
            const base = ctx.paint.kind === "color" ? ctx.paint.color : ctx.paint.base || "#5cc6ff";
            ctx.paint = { kind: k, base: base === "#ffffff" ? "#5cc6ff" : base };
            sel(b);
            if (ctx.tool === "erase") {
              ctx.tool = "brush";
              ctx.renderPal();
            }
            KP.audio.sfx("sparkle");
            KP.voice.say(nm + "!");
          });
          pal.appendChild(b);
          sw.push(b);
        });
      };
      ctx.renderPal();

      /* 버튼 (그림 + 짧은 이름) */
      const mk = (em, label, cls = "") => U.btn(KP.E(em) + "<span>" + label + "</span>", "zpB " + cls);
      const bBack = mk("🐾", "다른 동물");
      const bUndo = mk("↩️", "되돌리기");
      const bMagic = mk("🪄", "마법 색칠");
      const bClear = mk("🗑️", "처음부터");
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
        const svg = paper.querySelector("svg");
        const back = (e) => {
          if (e.el) e.el.setAttribute("fill", e.prev);
          if (e.i !== undefined) {
            if (e.prevPaint) ctx.pp[e.i] = Object.assign({}, e.prevPaint, { cv: null });
            else delete ctx.pp[e.i];
            applyPaint(svg, ctx.pp, ctx.uid, e.i);
          }
        };
        (u.many || [u]).forEach(back);
        KP.audio.sfx("slide");
        if (ctx.saveSoon) ctx.saveSoon();
      });
      bMagic.addEventListener("click", () => {
        const svg = paper.querySelector("svg");
        const pal2 = U.shuffle(COLORS.filter((c) => c !== "#3b3355" && c !== "#ffffff"));
        const byPart = {};
        // 크레파스 칠도 같이 덮음 (안 지우면 마법 색이 크레파스 아래에 가려지고, 쓰지 않는 그림이 저장됨)
        const many = [];
        svg.querySelectorAll(".fb").forEach((e, i) => {
          if (!byPart[e.dataset.p]) byPart[e.dataset.p] = Math.random() < 0.15 ? ensureDef(svg, ctx.uid, U.pick(["rainbow", "glitter", "dots"]), pal2[i % pal2.length]) : pal2[Object.keys(byPart).length % pal2.length];
          many.push({ el: e, prev: e.getAttribute("fill"), i, prevPaint: ctx.pp[i] ? { x: ctx.pp[i].x, y: ctx.pp[i].y, w: ctx.pp[i].w, h: ctx.pp[i].h, src: ctx.pp[i].src } : null });
          e.setAttribute("fill", byPart[e.dataset.p]);
        });
        ctx.undo.push({ many });
        ctx.pp = {};
        applyPaint(svg, ctx.pp, ctx.uid);
        KP.audio.sfx("sparkle");
        KP.voice.say("뾰로롱! 마법 색칠!");
        U.replay(paper, "jump");
        this.checkDone(ctx);
      });
      bClear.addEventListener("click", () => {
        const svg = paper.querySelector("svg");
        const many = [];
        paper.querySelectorAll(".fb").forEach((e, i) => {
          many.push({ el: e, prev: e.getAttribute("fill"), i, prevPaint: ctx.pp[i] ? { x: ctx.pp[i].x, y: ctx.pp[i].y, w: ctx.pp[i].w, h: ctx.pp[i].h, src: ctx.pp[i].src } : null });
          e.setAttribute("fill", "#ffffff");
        });
        ctx.undo.push({ many });
        ctx.pp = {};
        applyPaint(svg, ctx.pp, ctx.uid);
        ctx.toldDone = false;
        KP.audio.sfx("whoosh");
        if (ctx.saveSoon) ctx.saveSoon();
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
      const idxOf = (t) => [...paper.querySelectorAll(".fb")].indexOf(t);
      const ppCopy = (i) => (ctx.pp[i] ? { x: ctx.pp[i].x, y: ctx.pp[i].y, w: ctx.pp[i].w, h: ctx.pp[i].h, src: ctx.pp[i].src } : null);
      const fillPart = (t, x, y, quiet) => {
        const svg = paper.querySelector("svg");
        const fill = ctx.paint.kind === "color" ? ctx.paint.color : ensureDef(svg, ctx.uid, ctx.paint.kind, ctx.paint.base);
        const i = idxOf(t);
        if (t.getAttribute("fill") === fill && !ctx.pp[i]) return;
        // 붓기는 그 부위 전체를 새로 칠함 (크레파스로 칠한 것도 덮음)
        ctx.undo.push({ el: t, prev: t.getAttribute("fill"), i, prevPaint: ppCopy(i) });
        if (ctx.undo.length > 80) ctx.undo.shift();
        t.setAttribute("fill", fill);
        if (ctx.pp[i]) {
          delete ctx.pp[i];
          applyPaint(svg, ctx.pp, ctx.uid, i);
        }
        KP.audio.note(U.pick(KP.audio.SCALE.slice(4, 11)), { inst: "marimba", dur: 0.3, vol: quiet ? 0.12 : 0.22 });
        const r = paper.getBoundingClientRect();
        const sp = U.el("div", "zpSpark", KP.E(ctx.paint.kind === "color" ? "✨" : "🌟"));
        sp.style.left = x - r.left - 15 + "px";
        sp.style.top = y - r.top - 22 + "px";
        paper.appendChild(sp);
        setTimeout(() => sp.remove(), 650);
        this.checkDone(ctx);
      };
      /* 크레파스·지우개: 획을 시작한 부위 안에만 칠해짐 (선 밖으로 안 나감) */
      let down = null, // 누르고 있는 손가락 pointerId (다른 손가락·손바닥은 무시)
        stroke = null;
      const live = () => {
        let c = paper.querySelector(".zpLive");
        if (!c) {
          c = U.el("canvas", "zpLive");
          paper.appendChild(c);
        }
        return c;
      };
      const toEl = (el, x, y) => new DOMPoint(x, y).matrixTransform(el.getScreenCTM().inverse());
      const liveDraw = () => {
        const c = live(),
          r = paper.getBoundingClientRect(),
          d = Math.min(devicePixelRatio || 1, 2);
        if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) {
          c.width = Math.round(r.width * d);
          c.height = Math.round(r.height * d);
        }
        const g = c.getContext("2d");
        const M = stroke.el.getScreenCTM();
        g.save();
        g.setTransform(d * M.a, d * M.b, d * M.c, d * M.d, d * (M.e - r.left), d * (M.f - r.top));
        g.clip(elPath(stroke.el));
        const pt = stroke.erase ? { kind: "color", color: "rgba(255,255,255,.92)" } : stroke.paint;
        if (pt.kind === "rainbow") pt._len = stroke.len;
        const len = drawStroke(g, stroke.pts, pt, stroke.width, stroke.drawn);
        if (pt.kind === "rainbow") stroke.len = len;
        stroke.drawn = stroke.pts.length;
        g.restore();
      };
      // 같은 부위를 빠르게 두 번 그으면, 그림을 다 불러오기 전에 두 번째 획을 그렸다가 덮여 사라지던 것 방지 → 불러오기를 함께 기다림
      const loadCv = (pp) =>
        pp.loading ||
        (pp.loading = new Promise((res) => {
          pp.cv = document.createElement("canvas");
          pp.cv.width = Math.max(1, Math.ceil(pp.w * PK));
          pp.cv.height = Math.max(1, Math.ceil(pp.h * PK));
          if (!pp.src) return res();
          const im = new Image();
          im.onload = () => {
            pp.cv.getContext("2d").drawImage(im, 0, 0, pp.cv.width, pp.cv.height);
            res();
          };
          im.onerror = () => res();
          im.src = pp.src;
        }));
      // 칠하는 중에 앱을 끄거나 다른 앱으로 가도 그림이 남게: 칠할 때마다 잠시 뒤 보관 + 화면을 떠나면 바로 보관
      let saveT = 0;
      const soon = () => {
        clearTimeout(saveT);
        saveT = setTimeout(() => ctx._active && this.keepCurrent(ctx), 1500);
      };
      ctx.saveSoon = soon;
      const now = () => {
        clearTimeout(saveT);
        if (ctx._active) this.keepCurrent(ctx);
      };
      document.addEventListener("visibilitychange", () => document.hidden && now());
      window.addEventListener("pagehide", now);
      const commit = async (st) => {
        const svg = paper.querySelector("svg");
        if (!svg || !st.el.isConnected) return;
        const i = st.i;
        if (st.erase && !ctx.pp[i]) {
          // 크레파스 칠이 없는 부위를 지우개로 문지른 경우: 지울 것 없음
          const c = paper.querySelector(".zpLive");
          if (c && !stroke) c.getContext("2d").clearRect(0, 0, c.width, c.height);
          return;
        }
        const prevPaint = ppCopy(i);
        let pp = ctx.pp[i];
        if (!pp) {
          const bb = st.el.getBBox(),
            pad = 3;
          pp = ctx.pp[i] = { x: +(bb.x - pad).toFixed(2), y: +(bb.y - pad).toFixed(2), w: +(bb.width + pad * 2).toFixed(2), h: +(bb.height + pad * 2).toFixed(2), src: "" };
        }
        await loadCv(pp);
        const g = pp.cv.getContext("2d");
        g.save();
        g.setTransform(PK, 0, 0, PK, -pp.x * PK, -pp.y * PK);
        g.clip(elPath(st.el));
        if (st.erase) g.globalCompositeOperation = "destination-out";
        const pt = st.erase ? { kind: "color", color: "#000" } : Object.assign({}, st.paint, { _len: 0 });
        drawStroke(g, st.pts, pt, st.width, 1);
        g.restore();
        pp.src = pp.cv.toDataURL("image/png");
        ctx.undo.push({ i, prevPaint });
        if (ctx.undo.length > 80) ctx.undo.shift();
        applyPaint(svg, ctx.pp, ctx.uid, i);
        const c = paper.querySelector(".zpLive");
        if (c && !stroke) c.getContext("2d").clearRect(0, 0, c.width, c.height);
        this.checkDone(ctx);
      };
      paper.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        KP.audio.unlock();
        if (down !== null) return;
        down = e.pointerId;
        try {
          paper.setPointerCapture(e.pointerId); // 밖에서 손을 떼도 pointerup 이 와서 down 이 풀림
        } catch (_) {}
        const t = partAt(e.clientX, e.clientY);
        if (!t) return;
        if (ctx.tool === "fill") return fillPart(t, e.clientX, e.clientY);
        const q = toEl(t, e.clientX, e.clientY);
        stroke = { el: t, i: idxOf(t), pts: [{ x: q.x, y: q.y }], paint: Object.assign({}, ctx.paint), width: SIZES[ctx.size] * (ctx.tool === "erase" ? 1.6 : 1), erase: ctx.tool === "erase", drawn: 0, len: 0 };
        liveDraw();
        KP.audio.note(U.pick(KP.audio.SCALE.slice(4, 11)), { inst: "marimba", dur: 0.2, vol: 0.12 });
      });
      paper.addEventListener("pointermove", (e) => {
        if (e.pointerId !== down) return;
        if (ctx.tool === "fill") {
          // 쓱쓱 문질러 붓기
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const t = el && el.closest && el.closest(".fb");
          if (t && paper.contains(t)) fillPart(t, e.clientX, e.clientY, true);
          return;
        }
        if (!stroke) return;
        const q = toEl(stroke.el, e.clientX, e.clientY);
        const l = stroke.pts[stroke.pts.length - 1];
        if (Math.hypot(q.x - l.x, q.y - l.y) < 0.8) return;
        stroke.pts.push({ x: q.x, y: q.y });
        if (stroke.pts.length > 4000) stroke.pts.shift();
        liveDraw();
      });
      const end = (e) => {
        if (e.pointerId !== down) return;
        down = null;
        if (!stroke) return;
        const st = stroke;
        stroke = null;
        commit(st);
      };
      ["pointerup", "pointercancel"].forEach((ev) => paper.addEventListener(ev, end));
    },
    /* 칠하던 그림 보관 (기기 저장 → 앱을 껐다 켜도 남음) */
    keepDraft(ctx, tid, svg, uid, paint) {
      ctx.drafts[tid] = { svg, uid, paint: paint || {} };
      KP.db.put("photos", { id: "zoodraft-" + tid, kind: "zoodraft", tid, svg, uid, paint: paint || {}, t: Date.now() });
    },
    dropDraft(ctx, tid) {
      if (!tid) return;
      delete ctx.drafts[tid];
      KP.db.del("photos", "zoodraft-" + tid);
    },
    /** 지금 그림판의 그림을 보관(칠한 게 있으면) 또는 보관본 삭제(다 지웠으면) */
    keepCurrent(ctx) {
      const cur = ctx.paper.querySelector("svg");
      if (!cur || !ctx.tid || ctx.sending) return;
      const paint = packPaint(ctx.pp);
      if ([...cur.querySelectorAll(".fb")].some((e) => !isWhite(e)) || Object.keys(paint).length) this.keepDraft(ctx, ctx.tid, plainSvg(cur), ctx.uid, paint);
      else this.dropDraft(ctx, ctx.tid);
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
        // 썸네일은 무늬 id 를 바꿔 넣어야 그림판과 id 가 겹치지 않음(겹치면 무늬가 하얗게 보임)
        const th = d ? d.svg.split(d.uid).join("th" + tid).replace(/viewBox="[^"]*"/, 'viewBox="0 0 200 170"') : makeSvg(tid, "thumb" + tid, T[tid].sample);
        const c = U.btn('<div class="zpThumb">' + th + "</div><b>" + T[tid].name + "</b>", "zpCard");
        c.style.setProperty("--i", i);
        if (d) c.appendChild(U.el("span", "zpDraft", "칠하던 중"));
        c.addEventListener("click", () => {
          KP.audio.sfx("open");
          this.load(ctx, tid);
        });
        ctx.choose.appendChild(c);
        if (d && d.paint) applyPaint(c.querySelector("svg"), d.paint, "th" + tid);
        return c;
      });
      ctx.say("어떤 동물을 색칠할까요? 골라 보세요!");
      ctx.hint(() => cards[0], "색칠하고 싶은 동물을 콕 눌러요!");
    },
    /* 칠하던 그림 임시 보관 */
    stash(ctx) {
      this.keepCurrent(ctx);
      ctx.pp = {};
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
      ctx.pp = {};
      if (d) {
        ctx.uid = d.uid;
        ctx.paper.innerHTML = d.svg;
        for (const [k, v] of Object.entries(d.paint || {})) ctx.pp[k] = { x: v.x, y: v.y, w: v.w, h: v.h, src: v.src };
        applyPaint(ctx.paper.querySelector("svg"), ctx.pp, ctx.uid);
      } else {
        ctx.uid = "z" + KP.newId();
        ctx.paper.innerHTML = makeSvg(tid, ctx.uid);
      }
      ctx.choose.style.display = "none";
      ctx.choose.innerHTML = "";
      ctx.renderPal(); // 실험실에서 새로 담아 온 내 물감도 바로 보이게
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
      ctx.instr = U.josa(nm, "을/를") + " 색칠해요! 색을 고르고 쓱쓱 칠해요.";
      KP.voice.say(ctx.instr);
      ctx.hint(() => ctx.paper.querySelector('.fb[fill="#ffffff"]') || ctx.bSend, "색을 고르고 그림을 콕 눌러 봐요!");
    },
    checkDone(ctx) {
      if (ctx.saveSoon) ctx.saveSoon(); // 칠할 때마다 잠시 뒤 자동 보관
      const left = [...ctx.paper.querySelectorAll(".fb")].filter((e, i) => isWhite(e) && !ctx.pp[i]).length;
      if (left === 0 && !ctx.toldDone) {
        ctx.toldDone = true;
        KP.voice.say("우와, 다 칠했다! 동물원에 보내 볼까?");
        U.replay(ctx.bSend, "jump");
        ctx.hint(() => ctx.bSend, "동물원에 보내기를 눌러요!");
      }
    },
    async send(ctx) {
      if (ctx.sending || !ctx.tid) return; // 두 번 눌러도 한 번만 저장
      const fbs = [...ctx.paper.querySelectorAll(".fb")];
      if (!fbs.some((e, i) => !isWhite(e) || ctx.pp[i])) {
        ctx.miss(ctx.bSend, "먼저 예쁘게 색칠해 봐요!", { soft: true });
        return;
      }
      const svg = ctx.paper.querySelector("svg");
      // 동물원에서는 원래 도안 크기 기준으로 그림
      const vb = svg.getAttribute("viewBox");
      svg.setAttribute("viewBox", "0 0 200 170");
      const html = plainSvg(svg);
      svg.setAttribute("viewBox", vb);
      const item = { id: KP.newId(), kind: "zoo", tid: ctx.tid, uid: ctx.uid, svg: html, paint: packPaint(ctx.pp), t: Date.now(), date: KP.gate.monthDay() };
      ctx.sending = true; // 보내는 동안은 나가도 '칠하던 그림'으로 보관하지 않음
      const tid = ctx.tid;
      const saved = await KP.db.put("art", item);
      if (saved === false) {
        ctx.sending = false;
        KP.toast("저장하지 못했어요. 기기 저장공간을 확인해 주세요");
        ctx.miss(ctx.bSend, "앗, 저장이 안 됐어요. 다시 눌러 볼까요?", { soft: true });
        return;
      }
      this.dropDraft(ctx, tid);
      ctx.tid = null;
      ctx.undo = [];
      ctx.pp = {};
      KP.zooNew = item.id;
      ctx.paper.classList.add("fly");
      KP.audio.sfx("whoosh");
      const ok = await ctx.win({ msg: T[tid].name + " 출발!", big: true });
      ctx.paper.innerHTML = "";
      ctx.paper.classList.remove("fly");
      ctx.sending = false;
      if (ok) KP.open("zoo");
    },
    async start(ctx) {
      if (!ctx.draftsLoaded) {
        // 앱을 다시 켰을 때 칠하던 그림 불러오기
        ctx.draftsLoaded = true;
        const list = (await KP.db.all("photos")).filter((x) => x.kind === "zoodraft" && T[x.tid]);
        list.forEach((x) => {
          const svg = KP.sanitizeSvg(String(x.svg || "").replace(/^<div[^>]*>|<\/div>$/g, ""));
          if (svg) ctx.drafts[x.tid] = { svg, uid: String(x.uid || ""), paint: cleanPaint(x.paint) };
        });
        if (!ctx._active) return;
      }
      if (ctx.sending) {
        // 보내는 도중 나갔다 다시 들어온 경우
        ctx.sending = false;
        ctx.paper.innerHTML = "";
        ctx.paper.classList.remove("fly");
      }
      if (ctx.tid) this.load(ctx, ctx.tid);
      else this.showChoose(ctx);
    },
    stop(ctx) {
      // 나갔다 와도 칠하던 그림은 남겨 둠 (보내는 중인 그림 제외, 다 지운 그림은 보관본도 삭제)
      this.keepCurrent(ctx);
    },
  });

  /* =================================================================
     내 동물원 (2.5D)
     - 원근 바닥(소실점 잔디 줄무늬·흙길)·지평선 안개·먼 산/언덕
     - 나무·덤불·울타리·연못을 그라데이션 SVG 로 그려 입체감, 깊이(y)로 동물과 앞뒤 정렬
     - 아이가 칠한 색은 그대로 두고, 렌더할 때만 부위마다 빛(왼쪽 위)·그늘(오른쪽 아래) 덧칠
       (저장된 SVG 는 건드리지 않음)
     - 땅 그림자는 몸과 분리돼 깡충·폴짝 때 작아짐
  ================================================================= */
  const SHADE_DEFS =
    '<svg class="zDefs" aria-hidden="true" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden"><defs>' +
    // 부위 입체 음영 (objectBoundingBox: 부위마다 자기 모양 기준)
    '<radialGradient id="zShG" cx=".38" cy=".3" r=".78" fx=".3" fy=".2">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".22" stop-color="#fff" stop-opacity=".16"/>' +
    '<stop offset=".5" stop-color="#1a1040" stop-opacity="0"/><stop offset=".82" stop-color="#1a1040" stop-opacity=".16"/>' +
    '<stop offset="1" stop-color="#1a1040" stop-opacity=".32"/></radialGradient>' +
    // 뒤쪽 다리: 조금 더 어둡게 → 앞뒤 깊이
    '<radialGradient id="zShB" cx=".38" cy=".3" r=".78" fx=".3" fy=".2">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#1a1040" stop-opacity=".14"/>' +
    '<stop offset="1" stop-color="#1a1040" stop-opacity=".42"/></radialGradient>' +
    // 나무
    '<radialGradient id="zLeaf" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#b6ef7c"/><stop offset=".55" stop-color="#5fbf4a"/><stop offset="1" stop-color="#2f8a3a"/></radialGradient>' +
    '<radialGradient id="zLeaf2" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#9fe28a"/><stop offset=".6" stop-color="#3ea35a"/><stop offset="1" stop-color="#22703f"/></radialGradient>' +
    '<linearGradient id="zTrunk" x1="0" x2="1"><stop offset="0" stop-color="#b9824f"/><stop offset=".55" stop-color="#8a5a33"/><stop offset="1" stop-color="#5e3b1f"/></linearGradient>' +
    '<radialGradient id="zRock" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f1f3f7"/><stop offset=".6" stop-color="#b9c0cc"/><stop offset="1" stop-color="#7d8597"/></radialGradient>' +
    '<radialGradient id="zGShadow"><stop offset="0" stop-color="#1d4a12" stop-opacity=".42"/><stop offset=".6" stop-color="#1d4a12" stop-opacity=".18"/><stop offset="1" stop-color="#1d4a12" stop-opacity="0"/></radialGradient>' +
    // 울타리
    '<linearGradient id="zWood" x1="0" x2="1"><stop offset="0" stop-color="#f0bb78"/><stop offset=".5" stop-color="#d0904c"/><stop offset="1" stop-color="#9d6431"/></linearGradient>' +
    '<linearGradient id="zRail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eab06c"/><stop offset="1" stop-color="#a86d37"/></linearGradient>' +
    // 연못
    '<radialGradient id="zWater" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#8fdcff"/><stop offset=".6" stop-color="#4fb4ec"/><stop offset="1" stop-color="#2a7fc4"/></radialGradient>' +
    '<linearGradient id="zSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e2b0"/><stop offset="1" stop-color="#c9a76a"/></linearGradient>' +
    '<radialGradient id="zPad" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#9be27a"/><stop offset="1" stop-color="#3f9a3c"/></radialGradient>' +
    "</defs></svg>";

  // 먼 산·언덕 (지평선 위 띠, 가로로 늘려도 괜찮은 모양)
  const FAR_SVG =
    '<svg class="zFar" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">' +
    '<defs><linearGradient id="zHillG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3e48d"/><stop offset="1" stop-color="#a2dc7f"/></linearGradient></defs>' +
    '<path d="M0 20 L0 9 Q8 3 16 8 Q24 1 34 7 Q44 2 52 8 Q62 0 72 6 Q82 2 90 8 Q96 5 100 7 L100 20Z" fill="#b9dcf0"/>' +
    '<path d="M0 20 L0 10 Q10 6 18 10 Q30 4 40 9 Q52 5 62 10 Q74 4 86 9 Q94 6 100 9 L100 20Z" fill="#a9d7ea" opacity=".8"/>' +
    '<path d="M0 20 L0 14 Q15 8 30 13 Q45 17 58 12 Q75 7 100 13 L100 20Z" fill="url(#zHillG)"/></svg>';

  // 원근 바닥: 소실점으로 모이는 잔디 줄무늬 + 흙길 + 지평선 안개
  function groundSvg() {
    let s = '<svg class="zGround" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs>' +
      '<linearGradient id="zGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6e38e"/><stop offset=".35" stop-color="#97d46c"/><stop offset="1" stop-color="#6cbd4c"/></linearGradient>' +
      '<linearGradient id="zPath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe0b4"/><stop offset="1" stop-color="#d9b676"/></linearGradient>' +
      '<linearGradient id="zHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eefaff" stop-opacity=".7"/><stop offset="1" stop-color="#eefaff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="zNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4a12" stop-opacity="0"/><stop offset="1" stop-color="#1d4a12" stop-opacity=".16"/></linearGradient>' +
      '</defs><rect width="100" height="100" fill="url(#zGr)"/>';
    const k = 60 / 160; // 소실점 (50,-60)
    for (let i = -12; i < 12; i += 2) {
      const b0 = 50 + i * 9, b1 = 50 + (i + 1) * 9;
      s += '<polygon points="' + (50 + (b0 - 50) * k).toFixed(2) + ",0 " + (50 + (b1 - 50) * k).toFixed(2) + ",0 " + b1 + ",100 " + b0 + ',100" fill="#fff" opacity=".07"/>';
    }
    s += '<path d="M46.5 0 Q41 42 24 100 L50 100 Q51 44 52.5 0 Z" fill="url(#zPath)" stroke="#c8a463" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
    s += '<rect width="100" height="22" fill="url(#zHaze)"/><rect y="70" width="100" height="30" fill="url(#zNear)"/></svg>';
    return s;
  }

  // 소품 (나무·덤불·바위·꽃) — viewBox 0 0 100 120, 발바닥 = (50,112)
  const outlineBlobs = (cs, fill, ink) =>
    cs.map((c) => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + ink + '" stroke="' + ink + '" stroke-width="5"/>').join("") +
    cs.map((c) => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + fill + '"/>').join("");
  const PROP = {
    tree: () =>
      '<ellipse cx="50" cy="112" rx="34" ry="7" fill="url(#zGShadow)"/>' +
      '<path d="M43 112 L45 70 L55 70 L57 112 Z" fill="url(#zTrunk)" stroke="#4a2f1a" stroke-width="2.5" stroke-linejoin="round"/>' +
      outlineBlobs([[50, 38, 26], [30, 58, 20], [70, 58, 20], [50, 64, 22]], "url(#zLeaf)", "#2d6b2f") +
      '<ellipse cx="40" cy="30" rx="9" ry="6" fill="#fff" opacity=".28"/>',
    pine: () =>
      '<ellipse cx="50" cy="112" rx="28" ry="6" fill="url(#zGShadow)"/>' +
      '<rect x="45" y="88" width="10" height="24" rx="3" fill="url(#zTrunk)" stroke="#4a2f1a" stroke-width="2.5"/>' +
      [[96, 40, 70], [74, 32, 50], [52, 24, 30]].map((p) => '<path d="M50 ' + (p[2] - 6) + " L" + (50 + p[1]) + " " + p[0] + " Q50 " + (p[0] + 6) + " " + (50 - p[1]) + " " + p[0] + ' Z" fill="url(#zLeaf2)" stroke="#1f5a33" stroke-width="2.5" stroke-linejoin="round"/>').join("") +
      '<path d="M50 22 L40 44" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>',
    bush: () =>
      '<ellipse cx="50" cy="112" rx="40" ry="7" fill="url(#zGShadow)"/>' +
      outlineBlobs([[30, 96, 16], [50, 88, 20], [70, 96, 16]], "url(#zLeaf)", "#2d6b2f") +
      '<circle cx="42" cy="84" r="3.5" fill="#ff7a96"/><circle cx="62" cy="92" r="3.5" fill="#ffd34d"/><circle cx="30" cy="98" r="3" fill="#fff"/>',
    rock: () =>
      '<ellipse cx="50" cy="112" rx="30" ry="6" fill="url(#zGShadow)"/>' +
      '<path d="M24 110 Q22 88 40 84 Q52 74 66 86 Q80 92 76 110 Z" fill="url(#zRock)" stroke="#5c6476" stroke-width="2.5" stroke-linejoin="round"/>',
    flower: () =>
      '<path d="M50 112 Q48 100 50 90" stroke="#3f9a3c" stroke-width="3" fill="none"/><ellipse cx="44" cy="104" rx="6" ry="3" fill="#5fbf4a" transform="rotate(-30 44 104)"/>' +
      [0, 72, 144, 216, 288].map((a) => '<circle cx="' + (50 + Math.cos((a * Math.PI) / 180) * 6).toFixed(1) + '" cy="' + (86 + Math.sin((a * Math.PI) / 180) * 6).toFixed(1) + '" r="5" fill="#ff8fb1" stroke="#c9507a" stroke-width="1.2"/>').join("") +
      '<circle cx="50" cy="86" r="4" fill="#ffd34d"/>',
    flower2: () =>
      '<path d="M50 112 Q52 100 50 92" stroke="#3f9a3c" stroke-width="3" fill="none"/>' +
      [0, 60, 120, 180, 240, 300].map((a) => '<ellipse cx="' + (50 + Math.cos((a * Math.PI) / 180) * 6).toFixed(1) + '" cy="' + (88 + Math.sin((a * Math.PI) / 180) * 6).toFixed(1) + '" rx="4.5" ry="4.5" fill="#fff" stroke="#c9c9de" stroke-width="1"/>').join("") +
      '<circle cx="50" cy="88" r="4" fill="#ffb23d"/>',
  };
  const propSvg = (k) => '<svg viewBox="0 0 100 120" aria-hidden="true">' + PROP[k]() + "</svg>";

  /** 저장된 SVG 에 렌더 전용 음영을 덧입힘 (아이 색·무늬 그대로, 저장본은 그대로) */
  function shadeSvg(str, paint) {
    const box = document.createElement("div");
    box.innerHTML = str;
    const svg = box.firstElementChild;
    if (!svg) return str;
    // 크레파스로 칠한 그림 끼워 넣기 (부위 모양으로 잘라서, 다리가 움직이면 같이 움직임)
    const pt = cleanPaint(paint);
    if (Object.keys(pt).length) applyPaint(svg, pt, "zp" + KP.newId());
    svg.querySelectorAll(".fb").forEach((e) => {
      const c = e.cloneNode(false);
      c.setAttribute("class", "zSh");
      c.removeAttribute("data-p");
      c.setAttribute("fill", e.closest(".l2,.l4") ? "url(#zShB)" : "url(#zShG)");
      // 칠 그림·테두리 뒤에 음영
      let after = e;
      while (after.nextElementSibling && /\bpp\b|\bppo\b/.test(after.nextElementSibling.getAttribute("class") || "")) after = after.nextElementSibling;
      after.after(c);
    });
    return box.innerHTML;
  }

  /* ---------- 동물 보관: 모두 보관하고 동물원에는 일부만 (나머지는 '집에서 쉬기') ----------
     item.rest: 집에서 쉬는 중 / item.outAt: 마지막으로 동물원에 나온 시각 / item.fav: 👑 단짝(자동으로 쉬러 가지 않음)
     예전 기록(필드 없음)은 '노는 중'. 동물원이 꽉 차면 오래 논 친구부터 쉬러 감(지우지 않음).
     영구 삭제는 부모 설정(동물원 정리)에서만. */
  const KEEP = (KP.zooKeep = {
    // 마당(땅·하늘)에 함께 놀 수 있는 수 — 태블릿 18 / 폰 12 (측정 후 조정), 연못(물고기)은 따로 5
    cap: () => (Math.min(screen.width, screen.height) >= 600 ? 18 : 12),
    POND: 5,
    async list() {
      return (await KP.db.all("art")).filter((x) => x && x.kind === "zoo" && T[x.tid]);
    },
    outAt: (x) => x.outAt || x.t || 0,
    /** 저장 (실패하면 false — 실패를 무시하면 지운/쉬게 한 친구가 다음에 다시 나타남) */
    async save(x) {
      return (await KP.db.put("art", x)) !== false;
    },
    /** 넘친 만큼 오래 논 친구를 쉬게 함 (keep: 이번에 꼭 남길 id) → 쉬러 간 친구 목록 */
    async enforce(list, keep) {
      const rested = [];
      for (const pond of [false, true]) {
        const on = list.filter((x) => !x.rest && (T[x.tid].move === "swim") === pond);
        let over = on.length - (pond ? KEEP.POND : KEEP.cap());
        if (over <= 0) continue;
        // 단짝이 아닌 친구가 먼저, 단짝만으로도 넘치면 오래 논 단짝부터 (아이가 모두 👑 해도 상한은 지킴)
        const cand = on.filter((x) => x.id !== keep).sort((a, b) => !!a.fav - !!b.fav || KEEP.outAt(a) - KEEP.outAt(b));
        for (const x of cand) {
          if (over <= 0) break;
          x.rest = true;
          if (await KEEP.save(x)) {
            rested.push(x);
            over--;
          } else x.rest = false;
        }
      }
      return rested;
    },
    /** 쉬기/놀기 바꾸기 → 실패면 null, 성공이면 (나가 놀면서) 대신 쉬러 간 친구 목록 */
    async setRest(x, rest, list) {
      const prev = { rest: x.rest, outAt: x.outAt };
      x.rest = !!rest;
      if (!rest) x.outAt = Date.now();
      if (!(await KEEP.save(x))) {
        Object.assign(x, prev);
        return null;
      }
      return rest ? [] : KEEP.enforce(list, x.id);
    },
    async setFav(x, fav) {
      const prev = x.fav;
      x.fav = !!fav;
      if (await KEEP.save(x)) return true;
      x.fav = prev;
      return false;
    },
  });
  /** 작은 그림(크레파스 칠 포함) — 동물 친구 집·부모 설정 동물원 정리에서 씀 */
  KP.zooThumb = (item) => {
    if (!document.querySelector(".zDefs")) document.body.insertAdjacentHTML("beforeend", SHADE_DEFS);
    return shadeSvg(freshSvg(item), item.paint);
  };

  KP.game({
    id: "zoo",
    icon: "🦁",
    name: "내 동물원",
    cat: "make",
    badge: "NEW",
    setup(ctx) {
      KP.css("zoo", `
        .zooW{flex:1;min-height:0;position:relative;margin:0 12px 10px;border-radius:26px;overflow:hidden;box-shadow:0 8px 0 rgba(47,58,102,.12);background:#9fd77a;isolation:isolate}
        .zSky{position:absolute;left:0;right:0;top:0;height:calc(var(--hz,34%) + 2px);background:linear-gradient(180deg,#6fc3f3 0%,#a9dcfa 55%,#e2f6ff 100%)}
        .zooW.night .zSky{background:linear-gradient(180deg,#141a46 0%,#2c3a78 60%,#4a5c9a 100%)}
        .zFar{position:absolute;left:0;width:100%;top:calc(var(--hz,34%) - 13%);height:13.4%;display:block}
        .zGround{position:absolute;left:0;width:100%;top:var(--hz,34%);height:calc(100% - var(--hz,34%));display:block}
        .zSun{position:absolute;right:7%;top:6%;width:clamp(56px,8vw,96px);height:clamp(56px,8vw,96px);display:flex;align-items:center;justify-content:center;font-size:clamp(40px,6vw,64px);z-index:9050;animation:bob 5s ease-in-out infinite;pointer-events:none}
        .zSun::before{content:"";position:absolute;inset:-45%;border-radius:50%;background:radial-gradient(circle,rgba(255,240,170,.75) 0%,rgba(255,240,170,.25) 40%,transparent 70%);z-index:-1}
        .zooW.night .zSun::before{background:radial-gradient(circle,rgba(220,230,255,.45) 0%,transparent 65%)}
        .zCloud{position:absolute;font-size:clamp(40px,7vw,80px);opacity:.95;animation:zCl 50s linear infinite;pointer-events:none;filter:drop-shadow(0 6px 4px rgba(40,90,140,.18))}
        @keyframes zCl{from{transform:translateX(-30vw)}to{transform:translateX(110vw)}}
        .zooW.night .zCloud{opacity:.45}
        .zStar{position:absolute;line-height:1;pointer-events:none;z-index:9050}
        .zP{position:absolute;left:0;top:0;pointer-events:none;transform-origin:50% 100%}
        .zP svg{width:100%;height:100%;display:block;overflow:visible}
        .zProps{display:contents}
        .zFence{position:absolute;left:0;pointer-events:none}
        .zFence svg{display:block}
        .zPond{position:absolute;pointer-events:none;z-index:2}
        .zPond svg{display:block;overflow:visible}
        .zPond .zRip{transform-box:fill-box;transform-origin:50% 50%;animation:zRip 2.8s ease-in-out infinite}
        @keyframes zRip{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.25);opacity:0}}
        .zTint{position:absolute;inset:0;background:rgba(14,22,74,.36);pointer-events:none;z-index:9000;display:none}
        .zooW.night .zTint{display:block}
        .zVig{position:absolute;inset:0;pointer-events:none;z-index:8990;box-shadow:inset 0 0 60px rgba(20,60,30,.22);border-radius:inherit}
        .zSign{position:absolute;left:3%;top:calc(var(--hz,34%) - 21%);background:linear-gradient(180deg,#fff4cf,#f6dea0);border:4px solid #b9773a;border-radius:14px;padding:4px 12px;font-size:clamp(16px,2.4vw,24px);color:#7a4a1e;box-shadow:0 5px 0 #8a5528,0 9px 10px rgba(0,0,0,.18);z-index:8000;pointer-events:none}
        .zA{position:absolute;left:0;top:0;transform-origin:50% 100%;will-change:transform;cursor:pointer;touch-action:none}
        .zA .zLift,.zA .zIn,.zA .zBob{width:100%;height:100%}
        .zA .zIn{transition:transform .22s ease-in-out}
        .zA.left .zIn{transform:scaleX(-1)}
        .zA .zBob{transform-origin:50% 92%}
        .zA.walking .zBob{animation:zBob .21s ease-in-out infinite alternate}
        @keyframes zBob{from{transform:translateY(0) scale(1.02,.98)}to{transform:translateY(-4%) scale(.98,1.02)}}
        .zA.jump .zBob{animation:zJump .6s ease-out}
        @keyframes zJump{25%{transform:translateY(-6%) scale(1.08,.9)}45%{transform:translateY(-38%) scale(.94,1.08)}75%{transform:translateY(0) scale(1.1,.9)}}
        .zA.new .zBob{filter:drop-shadow(0 0 12px #fff6a8)}
        .zShadow{position:absolute;left:4%;right:4%;bottom:3%;height:18%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(20,50,10,.42) 0%,rgba(20,50,10,.2) 45%,rgba(20,50,10,0) 70%);transform:translateX(-5%)}
        .zA.jump .zShadow{animation:zShJ .6s ease-out}
        @keyframes zShJ{45%{transform:translateX(-5%) scale(.55);opacity:.55}}
        .zA .zSh{pointer-events:none}
        .zHeart{position:absolute;pointer-events:none;font-size:28px;animation:zHeart 1.2s ease-out forwards;z-index:9500}
        @keyframes zHeart{to{transform:translateY(-70px) scale(1.3);opacity:0}}
        .zTreat{position:absolute;font-size:clamp(30px,4.4vw,44px);line-height:1;pointer-events:none;transition:top .7s cubic-bezier(.4,1.6,.6,1);filter:drop-shadow(0 4px 2px rgba(20,50,10,.3))}
        .zBar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:0 10px 12px;flex:0 0 auto}
        .zEmpty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;z-index:9700;font-size:clamp(20px,3vw,30px);color:#2f3a66;text-shadow:0 2px 0 #fff}
        .zDel{position:absolute;z-index:9999;background:#fff;border-radius:999px;padding:8px 14px;font-size:18px;box-shadow:0 4px 0 rgba(0,0,0,.15);color:#c62828}
        .z3Canvas{position:absolute;inset:0;width:100%;height:100%;display:none;touch-action:none;z-index:1}
        .zooW.mode3d .z3Canvas{display:block}
        .zooW.mode3d>.zSky,.zooW.mode3d>.zFar,.zooW.mode3d>.zGround,.zooW.mode3d>.zSun,.zooW.mode3d>.zStar,.zooW.mode3d>.zCloud,.zooW.mode3d>.zSign,.zooW.mode3d>.zPond,.zooW.mode3d>.zFence,.zooW.mode3d>.zProps,.zooW.mode3d>.zVig,.zooW.mode3d>.zTint,.zooW.mode3d>.zA,.zooW.mode3d>.zTreat{display:none}
        .z3Home{position:absolute;left:10px;top:8px;z-index:9600;display:none;background:rgba(255,255,255,.85);border-radius:999px;padding:4px 12px;font-size:clamp(15px,2vw,19px);min-height:40px}
        .zooW.mode3d.turned .z3Home{display:block}
        .z3Tip{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:9600;background:rgba(255,255,255,.8);border-radius:999px;padding:4px 14px;font-size:clamp(13px,1.8vw,17px);color:#2f3a66;pointer-events:none;transition:opacity .6s;white-space:nowrap}
        .zCount{position:absolute;right:10px;top:8px;z-index:9600;background:#fff;border:4px solid #b9773a;border-radius:999px;padding:4px 14px;min-height:48px;min-width:64px;font-size:clamp(17px,2.2vw,21px);color:#5a3a1a;box-shadow:0 4px 0 #8a5528}
        .zCount.pulse{animation:zPulse 1s ease-in-out 4}
        @keyframes zPulse{50%{transform:scale(1.15)}}
        .zHouse{position:absolute;inset:0;z-index:9900;background:linear-gradient(180deg,#fff4dc,#ffe6b8);display:flex;flex-direction:column;border-radius:inherit}
        .zhTop{display:flex;align-items:center;gap:8px;padding:10px 12px 6px;flex-wrap:wrap}
        .zhTitle{font-size:clamp(20px,3vw,28px);color:#7a4a1e;flex:1 1 auto;white-space:nowrap}
        .zhClose{min-height:48px}
        .zhFilter{display:flex;gap:6px;padding:0 12px 6px;overflow-x:auto;scrollbar-width:none;flex:0 0 auto}
        .zhFilter::-webkit-scrollbar{display:none}
        .zhF{flex:0 0 auto;min-width:52px;min-height:48px;border-radius:16px;background:#fff;border:3px solid #f0cf94;font-size:24px;padding:2px 8px}
        .zhF.sel{background:#ffd34d;border-color:#b9773a}
        .zhGrid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(120px,17vw,170px),1fr));gap:12px;padding:6px 12px 16px;align-content:start}
        .zhCard{position:relative;border-radius:22px;border:4px solid #fff;padding:6px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 5px 0 rgba(122,74,30,.25)}
        .zhCard.play{background:linear-gradient(180deg,#c8f0ff 0%,#c8f0ff 55%,#9fd77a 56%)}
        .zhCard.rest{background:linear-gradient(180deg,#5b4f8f,#8a7cc0)}
        .zhCard.rest .zhPic{opacity:.75}
        .zhPic{width:100%;aspect-ratio:200/170}
        .zhPic svg{width:100%;height:100%;display:block;overflow:visible}
        .zhState{font-size:clamp(14px,1.8vw,17px);background:rgba(255,255,255,.9);border-radius:999px;padding:1px 10px;color:#3b3355}
        .zhFav{position:absolute;right:4px;top:4px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.85);font-size:24px;display:flex;align-items:center;justify-content:center;opacity:.45}
        .zhFav.on{opacity:1;background:#ffe27a}
        .zhCard.busy{pointer-events:none;opacity:.6}
      `);
      if (!document.querySelector(".zDefs")) document.body.insertAdjacentHTML("beforeend", SHADE_DEFS);
      const W = U.el("div", "zooW");
      const bar = U.el("div", "zBar");
      ctx.body.append(W, bar);
      ctx.W = W;
      // 배경 (하늘·먼 산·원근 바닥은 고정, 소품·울타리·연못은 layout 에서 크기 맞춰 배치)
      W.innerHTML =
        '<div class="zSky"></div>' + FAR_SVG + groundSvg() +
        '<div class="zSun">' + KP.E("☀️") + "</div>" +
        Array.from({ length: 14 }, (_, i) => '<div class="zStar" style="left:' + ((i * 37) % 96 + 2) + "%;top:" + ((i * 13) % 22 + 2) + '%;font-size:' + (10 + (i % 3) * 5) + 'px">' + KP.E("✨") + "</div>").join("") +
        '<div class="zCloud" style="top:4%">' + KP.E("☁️") + '</div><div class="zCloud" style="top:13%;animation-duration:75s;animation-delay:-30s;font-size:clamp(30px,5vw,60px)">' + KP.E("☁️") + "</div>" +
        '<div class="zSign">' + KP.E("🎪") + " 우리 동물원</div>" +
        '<div class="zPond"></div><div class="zFence"></div><div class="zProps"></div>' +
        '<div class="zVig"></div><div class="zTint"></div>';
      // 오른쪽 위: 🏠 동물 친구 집 (노는 친구 수 · 쉬는 친구 수)
      ctx.count = U.btn("", "zCount");
      ctx.count.addEventListener("click", () => this.openHouse(ctx));
      W.appendChild(ctx.count);

      const bPaint = U.btn(KP.E("🖌️") + " 새 친구 색칠하기", "btn primary");
      const bTreat = U.btn(KP.E("🍎") + " 간식 주기", "btn");
      const bCall = U.btn(KP.E("📣") + " 모두 모여라", "btn");
      const bMode = U.btn("", "btn");
      bar.append(bPaint, bTreat, bCall, bMode);
      ctx.bPaint = bPaint;
      ctx.bMode = bMode;
      bMode.addEventListener("click", () => {
        ctx.modeNow = ctx.use3d ? "2d" : "3d";
        KP.store.set("zooMode", ctx.modeNow);
        this.start(ctx);
      });
      const home = U.btn(KP.E("🎥") + " 처음 자리로", "z3Home");
      W.appendChild(home);
      home.addEventListener("click", () => ctx.z3 && ctx.z3.resetView());
      bPaint.addEventListener("click", () => KP.open("zoopaint"));
      const houseOpen = () => !!U.$(".zHouse", W);
      bTreat.addEventListener("click", () => !houseOpen() && this.treats(ctx));
      bCall.addEventListener("click", () => !houseOpen() && this.callAll(ctx));
      // 빈 땅을 누르면 그곳에 간식
      W.addEventListener("pointerdown", (e) => {
        if (W.classList.contains("mode3d") || e.target.closest(".zA,.zDel,.zEmpty,.btn,.zCount,.zHouse")) return;
        const r = W.getBoundingClientRect();
        const x = e.clientX - r.left,
          y = e.clientY - r.top;
        const g = ctx.g;
        if (g && y > g.y0 - g.h * 0.06 && ctx.animals && ctx.animals.length) this.dropTreat(ctx, x, y);
      });
      // 화면 크기가 바뀌면(회전 등) 배경·동물 위치를 비율대로 다시 맞춤
      if (window.ResizeObserver) {
        let rt = 0;
        new ResizeObserver(() => {
          clearTimeout(rt);
          rt = setTimeout(() => ctx._active && !ctx.use3d && this.layout(ctx), 120);
        }).observe(W);
      }
    },
    /* --- 크기·지평선·연못·소품 배치 --- */
    layout(ctx) {
      const W = ctx.W,
        w = W.clientWidth,
        h = W.clientHeight;
      if (!w || !h) return;
      const old = ctx.g;
      if (old && old.w === w && old.h === h) return;
      const tall = w / h < 0.75;
      const hzf = tall ? 0.27 : 0.34;
      W.style.setProperty("--hz", hzf * 100 + "%");
      const hz = h * hzf,
        y0 = h * (hzf + 0.13),
        y1 = h * 0.95;
      const rx = Math.min(w * (tall ? 0.24 : 0.19), h * 0.3),
        ry = rx * (tall ? 0.46 : 0.38);
      const pond = { cx: w * (tall ? 0.7 : 0.76), cy: y0 + (y1 - y0) * (tall ? 0.8 : 0.74), rx, ry };
      pond.cy = Math.min(pond.cy, h - ry * 1.25);
      const g = (ctx.g = { w, h, hz, y0, y1, pond, base: U.clamp(Math.min(w, h * 1.5) * 0.2, 90, 200) });
      this.drawPond(ctx);
      this.drawFence(ctx);
      this.drawProps(ctx);
      // 동물 크기·위치 다시 맞춤
      if (old && ctx.animals) {
        const fx = w / old.w,
          fy = (v) => g.hz + ((v - old.hz) / (old.h - old.hz)) * (h - g.hz);
        for (const a of ctx.animals) {
          if (a.t.move === "swim") {
            const p = this.randPos(ctx, "swim");
            a.x = a.tx = p.x;
            a.y = a.ty = p.y;
          } else if (a.t.move === "fly") {
            a.x *= fx; a.tx *= fx;
            a.y = (a.y / old.h) * h; a.ty = (a.ty / old.h) * h;
          } else {
            a.x *= fx; a.tx *= fx;
            a.y = fy(a.y); a.ty = fy(a.ty);
          }
          this.sizeAnimal(ctx, a);
          this.place(ctx, a);
        }
      }
    },
    /** 깊이(y) → 크기 배율: 지평선 쪽은 작게, 앞쪽은 크게 */
    sc(ctx, y) {
      const g = ctx.g;
      return 0.34 + 0.78 * U.clamp((y - g.hz) / (g.y1 - g.hz), 0, 1);
    },
    inPond(ctx, x, y, m = 1) {
      const p = ctx.g.pond;
      const dx = (x - p.cx) / (p.rx * 1.12 * m),
        dy = (y - p.cy) / (p.ry * 1.35 * m);
      return dx * dx + dy * dy < 1;
    },
    crossPond(ctx, x0, y0, x1, y1) {
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        if (this.inPond(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return true;
      }
      return false;
    },
    drawPond(ctx) {
      const p = ctx.g.pond,
        el = U.$(".zPond", ctx.W);
      const R = p.rx * 1.1,
        Ry = p.ry * 1.22,
        Wv = R * 2,
        Hv = Ry * 2;
      el.style.left = p.cx - R + "px";
      el.style.top = p.cy - Ry + "px";
      let rocks = "";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + 0.2,
          rr = 0.92 + ((i * 7) % 3) * 0.03;
        const x = R + Math.cos(a) * R * rr,
          y = Ry + Math.sin(a) * Ry * rr;
        const s = (0.07 + ((i * 5) % 4) * 0.012) * R * (0.75 + 0.25 * Math.sin(a));
        rocks += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + s.toFixed(1) + '" ry="' + (s * 0.7).toFixed(1) + '" fill="url(#zRock)" stroke="#6d7588" stroke-width="1.5"/>';
      }
      const wx = p.rx * 0.9,
        wy = p.ry * 0.86;
      el.innerHTML =
        '<svg width="' + Wv + '" height="' + Hv + '" viewBox="0 0 ' + Wv + " " + Hv + '">' +
        '<ellipse cx="' + R + '" cy="' + (Ry + Ry * 0.08) + '" rx="' + R + '" ry="' + Ry + '" fill="rgba(29,74,18,.18)"/>' +
        '<ellipse cx="' + R + '" cy="' + Ry + '" rx="' + R * 0.97 + '" ry="' + Ry * 0.95 + '" fill="url(#zSand)"/>' +
        '<ellipse cx="' + R + '" cy="' + Ry + '" rx="' + wx + '" ry="' + wy + '" fill="url(#zWater)" stroke="#2a6fa8" stroke-width="2"/>' +
        // 먼 쪽 둑 그늘
        '<path d="M' + (R - wx) + " " + Ry + " A" + wx + " " + wy + " 0 0 1 " + (R + wx) + " " + Ry + " A" + wx + " " + wy * 0.72 + " 0 0 0 " + (R - wx) + " " + Ry + 'Z" fill="#1d5f99" opacity=".28"/>' +
        '<ellipse cx="' + (R - wx * 0.35) + '" cy="' + (Ry + wy * 0.25) + '" rx="' + wx * 0.28 + '" ry="' + wy * 0.1 + '" fill="#fff" opacity=".45"/>' +
        '<ellipse cx="' + (R + wx * 0.3) + '" cy="' + (Ry + wy * 0.5) + '" rx="' + wx * 0.15 + '" ry="' + wy * 0.06 + '" fill="#fff" opacity=".35"/>' +
        '<ellipse class="zRip" cx="' + R + '" cy="' + (Ry + wy * 0.1) + '" rx="' + wx * 0.45 + '" ry="' + wy * 0.42 + '" fill="none" stroke="#fff" stroke-width="2.5"/>' +
        // 연잎·연꽃
        '<ellipse cx="' + (R + wx * 0.45) + '" cy="' + (Ry - wy * 0.25) + '" rx="' + wx * 0.12 + '" ry="' + wy * 0.12 + '" fill="url(#zPad)" stroke="#2d6b2f" stroke-width="1.5"/>' +
        '<path d="M' + (R + wx * 0.45) + " " + (Ry - wy * 0.25) + " l" + wx * 0.12 + " " + -wy * 0.04 + " l0 " + wy * 0.08 + ' z" fill="#4f9fd9"/>' +
        '<ellipse cx="' + (R - wx * 0.6) + '" cy="' + (Ry + wy * 0.05) + '" rx="' + wx * 0.11 + '" ry="' + wy * 0.11 + '" fill="url(#zPad)" stroke="#2d6b2f" stroke-width="1.5"/>' +
        '<circle cx="' + (R - wx * 0.6) + '" cy="' + (Ry - wy * 0.02) + '" r="' + Math.max(3, wx * 0.035) + '" fill="#ff8fb1" stroke="#c9507a" stroke-width="1"/>' +
        rocks + "</svg>";
    },
    drawFence(ctx) {
      const g = ctx.g,
        el = U.$(".zFence", ctx.W);
      const fh = U.clamp(g.h * 0.075, 26, 64),
        w = g.w;
      const bottom = g.hz + g.h * 0.035;
      el.style.top = bottom - fh + "px";
      el.style.width = w + "px";
      el.style.zIndex = Math.round(bottom);
      const gap = U.clamp(fh * 1.15, 28, 60);
      let s = '<svg width="' + w + '" height="' + fh + '" viewBox="0 0 ' + w + " " + fh + '">';
      s += '<rect x="0" y="' + fh * 0.84 + '" width="' + w + '" height="' + fh * 0.16 + '" fill="rgba(29,74,18,.18)"/>';
      s += '<rect x="0" y="' + fh * 0.28 + '" width="' + w + '" height="' + fh * 0.14 + '" rx="3" fill="url(#zRail)" stroke="#7a4a1e" stroke-width="1.5"/>';
      s += '<rect x="0" y="' + fh * 0.58 + '" width="' + w + '" height="' + fh * 0.14 + '" rx="3" fill="url(#zRail)" stroke="#7a4a1e" stroke-width="1.5"/>';
      const pw = fh * 0.22;
      for (let x = gap * 0.4; x < w; x += gap)
        s += '<path d="M' + (x - pw / 2) + " " + fh * 0.9 + " L" + (x - pw / 2) + " " + fh * 0.12 + " L" + x + " 1 L" + (x + pw / 2) + " " + fh * 0.12 + " L" + (x + pw / 2) + " " + fh * 0.9 + ' Z" fill="url(#zWood)" stroke="#7a4a1e" stroke-width="1.5" stroke-linejoin="round"/>';
      el.innerHTML = s + "</svg>";
    },
    drawProps(ctx) {
      const g = ctx.g,
        box = U.$(".zProps", ctx.W);
      box.innerHTML = "";
      const big = Math.min(g.w * 0.42, g.h * 0.6);
      const back = g.hz + g.h * 0.02,
        mid = (f) => g.y0 + (g.y1 - g.y0) * f;
      const list = [
        // 울타리 너머 먼 나무 (울타리보다 뒤)
        ["tree", 0.04, back, 1], ["pine", 0.15, back - 2, 0.9], ["tree", 0.3, back, 0.85], ["pine", 0.44, back - 1, 0.8],
        ["tree", 0.6, back, 0.95], ["pine", 0.72, back - 2, 0.85], ["tree", 0.86, back, 0.9], ["pine", 0.97, back, 1],
        // 울타리 앞 덤불·바위
        ["bush", 0.24, g.hz + g.h * 0.07, 0.55], ["bush", 0.55, g.hz + g.h * 0.065, 0.5], ["rock", 0.83, g.hz + g.h * 0.08, 0.45],
        // 옆 나무 (동물이 앞뒤로 지나감)
        ["tree", 0.025, mid(0.3), 1], ["pine", 0.975, mid(0.08), 1],
        // 꽃
        ["flower", 0.14, mid(0.55), 0.3], ["flower2", 0.19, mid(0.62), 0.28], ["flower", 0.5, mid(0.95), 0.3], ["flower2", 0.36, mid(0.2), 0.26],
        ["rock", 0.42, mid(0.45), 0.32], ["flower2", 0.62, mid(0.35), 0.26],
        // 맨 앞 덤불 (화면 밖으로 살짝 잘림 → 가까움)
        ["bush", 0.03, g.h * 1.03, 0.75],
      ];
      let html = "";
      for (const [k, fx, y, f] of list) {
        const x = fx * g.w;
        if (this.inPond(ctx, x, y, 1.1)) continue;
        const ph = big * f * this.sc(ctx, y),
          pw = ph * (100 / 120);
        // 발바닥(50,112)/120 → 바닥 기준
        const top = y - ph * (112 / 120);
        html += '<div class="zP" style="width:' + pw.toFixed(1) + "px;height:" + ph.toFixed(1) + "px;transform:translate(" + (x - pw / 2).toFixed(1) + "px," + top.toFixed(1) + "px);z-index:" + Math.round(y) + '">' + propSvg(k) + "</div>";
      }
      box.innerHTML = html;
    },
    async start(ctx) {
      const W = ctx.W;
      const tok = (ctx._tok = (ctx._tok || 0) + 1);
      const h = new Date().getHours();
      const night = h >= 19 || h < 6;
      W.classList.toggle("night", night);
      U.$(".zSun", W).innerHTML = KP.E(night ? "🌙" : "☀️");
      U.$$(".zStar", W).forEach((e) => (e.style.display = night ? "" : "none"));
      U.$$(".zA,.zTreat,.zEmpty,.zDel,.zHeart,.z3Tip,.zHouse", W).forEach((e) => e.remove());
      ctx.animals = [];
      ctx.treatsArr = [];
      // 진짜 3D (WebGL) — 안 되면 2.5D
      // 3D/그림 동물원: 이번에 고른 것 → 저장된 것(KP.store) → 예전 방식으로 저장된 것 → 3D
      let legacy = null;
      try {
        legacy = localStorage.getItem("kp-zoo-mode");
      } catch (e) {}
      const pref = ctx.modeNow || KP.store.get("zooMode", legacy || "3d");
      let use3d = false;
      if (pref !== "2d" && KP.zoo3d && KP.zoo3d.supported()) {
        try {
          await KP.zoo3d.load();
          if (tok !== ctx._tok || !ctx._active) return;
          if (!ctx.z3 || ctx.z3.lost) {
            if (ctx.z3) ctx.z3.dispose(); // 화면이 끊긴 옛 세계 정리 후 새로
            ctx.z3 = KP.zoo3d.create(ctx, W, T);
            ctx.z3.onDelete = (a) => this.askDelete3(ctx, a);
            // 3D 화면이 끊기면(iPad 백그라운드·메모리 부족) 새로 만들어 다시 보여 줌
            const me = ctx.z3; // 이 3D 화면이 지금 쓰는 것일 때만 (나갔다 빨리 다시 들어와도 엉뚱하게 재시작 안 하게)
            me.onLost = () => ctx._active && ctx.use3d && ctx.z3 === me && this.start(ctx);
            // 가장 낮은 화질에서도 계속 느리면 그림 동물원으로 (3D 동물원 버튼으로 다시 켤 수 있음)
            me.onSlow = () => {
              if (!ctx._active || !ctx.use3d || ctx.z3 !== me) return;
              ctx.modeNow = "2d";
              KP.store.set("zooMode", "2d");
              // 3D 화면 자원(그래픽 메모리)도 정리 — 다시 3D 로 가면 새로 만듦
              me.dispose();
              ctx.z3 = null;
              KP.toast("기기가 바빠서 그림 동물원으로 바꿨어요 (3D 동물원 버튼으로 다시 켤 수 있어요)");
              this.start(ctx);
            };
          }
          use3d = true;
        } catch (e) {
          use3d = false;
        }
      }
      ctx.use3d = use3d;
      W.classList.toggle("mode3d", use3d);
      W.classList.remove("turned");
      ctx.bMode.innerHTML = use3d ? KP.E("🖼️") + " 그림 동물원" : KP.E("🧊") + " 3D 동물원";
      ctx.bMode.style.display = KP.zoo3d && KP.zoo3d.supported() ? "" : "none";
      if (use3d) {
        ctx.z3.clear();
        ctx.z3.setNight(night);
        ctx.z3.resize();
      } else {
        ctx.g = null;
        this.layout(ctx);
        if (!ctx.g) {
          await ctx.wait(150);
          this.layout(ctx);
          if (!ctx.g) return;
        }
      }
      // 모두 보관, 동물원에는 노는 친구만 (꽉 차면 오래 논 친구부터 집에서 쉬기 — 새 친구·단짝은 그대로)
      const all = await KEEP.list();
      if (!ctx._active || tok !== ctx._tok) return;
      const rested = await KEEP.enforce(all, KP.zooNew);
      if (!ctx._active || tok !== ctx._tok) return;
      ctx.allZoo = all;
      const items = all.filter((x) => !x.rest);
      if (!use3d && (!ctx.g || ctx.g.w !== W.clientWidth || ctx.g.h !== W.clientHeight)) this.layout(ctx);
      this.drawCount(ctx);
      if (!items.length && all.length) {
        // 모두 집에서 쉬는 중
        ctx.say("친구들이 집에서 쉬고 있어요. 집에서 데려와요!");
        const em = U.el("div", "zEmpty", '<div class="big-em">' + KP.E("🏠") + "</div><div>친구들이 집에서 쉬고 있어요</div>");
        const go = U.btn(KP.E("🏠") + " 집에서 데려오기", "btn big primary");
        go.addEventListener("click", () => this.openHouse(ctx));
        em.appendChild(go);
        W.appendChild(em);
        ctx.hint(() => go);
        if (use3d) ctx.loop((dt) => (tok === ctx._tok ? (ctx.z3.tick(dt), true) : false));
        return;
      }
      if (!items.length) {
        ctx.say("아직 동물원이 비어 있어요. 색칠 공방에서 동물을 색칠해서 보내 주세요!");
        const em = U.el("div", "zEmpty", '<div class="big-em">' + KP.E("🐻") + "</div><div>동물 친구를 데려와요!</div>");
        const go = U.btn(KP.E("🖌️") + " 색칠하러 가기", "btn big primary");
        go.addEventListener("click", () => KP.open("zoopaint"));
        em.appendChild(go);
        W.appendChild(em);
        ctx.hint(() => go);
        if (use3d) ctx.loop((dt) => (tok === ctx._tok ? (ctx.z3.tick(dt), true) : false));
        return;
      }
      const newId = KP.zooNew;
      KP.zooNew = null;
      let newcomer = null;
      if (use3d) {
        items.forEach((it) => {
          const a = ctx.z3.addAnimal(it, it.id === newId);
          if (it.id === newId) newcomer = a;
        });
      } else {
        items.forEach((it) => this.add(ctx, it, it.id === newId));
        newcomer = ctx.animals.find((x) => x.item.id === newId);
      }
      if (newcomer) {
        ctx.say("새 친구 " + U.josa(T[newcomer.item.tid].name, "이/가") + " 동물원에 왔어요! 환영해!");
        ctx.after(600, () => KP.confetti(140));
      }
      // 자리가 꽉 차 집에서 쉬러 간 친구가 있으면: 환영 인사 뒤에 짧게 + 집 버튼 반짝
      if (rested.length) {
        KP.voice.say("집에서 쉬는 친구도 있어요!", { queue: true });
        U.replay(ctx.count, "pulse");
      } else ctx.say(U.pick(["동물 친구들을 콕 눌러 보세요!", "빈 땅을 누르면 간식을 줄 수 있어요!", "내가 색칠한 친구들이 놀고 있어요!"]));
      if (use3d) {
        const tip = U.el("div", "z3Tip", KP.E("👆") + " 끌면 빙글 · 두 손가락으로 크게");
        W.appendChild(tip);
        ctx.after(6000, () => (tip.style.opacity = "0"));
        ctx.after(7000, () => tip.remove());
        ctx.loop((dt) => {
          if (tok !== ctx._tok) return false;
          ctx.z3.tick(dt);
          const c = ctx.z3.cam;
          W.classList.toggle("turned", Math.abs(c.taz - (c.baseAz || 0)) > 0.08 || Math.abs(c.tzoom - 1) > 0.08);
        });
      } else {
        ctx.hint(() => (ctx.animals[0] ? ctx.animals[0].el : null), "동물 친구를 콕 눌러 보세요!");
        ctx.loop((dt, now) => (tok === ctx._tok ? this.tick(ctx, dt, now) : false));
      }
    },
    /* 🏠 동물 친구 집: 저장된 친구 모두(쉬는 친구 포함)
       카드 콕 → 나가 놀기 ↔ 집에서 쉬기 / 👑 → 단짝(자리가 꽉 차도 쉬러 가지 않음). 지우기는 부모 설정에서만 */
    async openHouse(ctx) {
      if (ctx.houseBusy || U.$(".zHouse", ctx.W)) return; // 연타해도 한 번만
      U.$$(".zDel", ctx.W).forEach((e) => e.remove());
      ctx.hint(null);
      const tok = ctx._tok;
      // 동물원에 나와 있는 친구들과 같은 기록을 씀 (따로 불러오면 👑·쉬기가 서로 어긋남)
      ctx.houseBusy = true;
      const all = ctx.allZoo || (ctx.allZoo = await KEEP.list());
      ctx.houseBusy = false;
      if (!ctx._active || tok !== ctx._tok || U.$(".zHouse", ctx.W)) return;
      const EM = { dino: "🦖", lion: "🦁", elephant: "🐘", rabbit: "🐰", bear: "🐻", pig: "🐷", dog: "🐶", fish: "🐟", bird: "🐦", butterfly: "🦋", turtle: "🐢" };
      const box = U.el("div", "zHouse");
      const top = U.el("div", "zhTop", '<div class="zhTitle">' + KP.E("🏠") + " 동물 친구 집</div>");
      const bClose = U.btn(KP.E("🎪") + " 동물원으로", "btn primary zhClose");
      top.appendChild(bClose);
      const filt = U.el("div", "zhFilter");
      const grid = U.el("div", "zhGrid");
      box.append(top, filt, grid);
      ctx.W.appendChild(box);
      let changed = false,
        kind = "";
      // 동물 종류 그림 탭 (만든 적 있는 종류만, 두 종류 이상일 때)
      const kinds = ORDER.filter((k) => all.some((x) => x.tid === k));
      const drawFilter = () => {
        filt.innerHTML = "";
        if (kinds.length < 2) return;
        [""].concat(kinds).forEach((k) => {
          const b = U.btn(k ? KP.E(EM[k] || "🐾") : KP.E("🐾"), "zhF" + (k === kind ? " sel" : ""));
          b.addEventListener("click", () => {
            kind = k;
            KP.audio.sfx("tap");
            if (k) KP.voice.say(T[k].name);
            drawFilter();
            drawCards();
          });
          filt.appendChild(b);
        });
      };
      const cardOf = (x) => {
        const c = U.btn("", "zhCard " + (x.rest ? "rest" : "play"));
        c.innerHTML = '<div class="zhPic">' + KP.zooThumb(x) + '</div><div class="zhState">' + (x.rest ? KP.E("💤") + " 쉬는 중" : KP.E("☀️") + " 노는 중") + "</div>";
        const fav = U.btn(KP.E("👑"), "zhFav" + (x.fav ? " on" : ""));
        c.appendChild(fav);
        fav.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!(await KEEP.setFav(x, !x.fav))) return KP.toast("저장하지 못했어요");
          fav.classList.toggle("on", !!x.fav);
          KP.audio.sfx(x.fav ? "good" : "tap");
          if (x.fav) KP.voice.say("단짝 친구!");
        });
        c.addEventListener("click", async () => {
          if (c.classList.contains("busy")) return; // 연타해도 한 번만
          c.classList.add("busy");
          const out = await KEEP.setRest(x, !x.rest, all);
          c.classList.remove("busy");
          if (out === null) return KP.toast("저장하지 못했어요. 기기 저장공간을 확인해 주세요");
          changed = true;
          KP.audio.sfx(x.rest ? "slide" : "good");
          KP.voice.say(x.rest ? "코 자자~" : "나가 놀자!");
          // 나가 놀면서 자리가 꽉 차 대신 쉬러 간 친구가 있으면 그 카드도 바꿈
          if (out.length) {
            KP.voice.say("집에서 쉬는 친구도 있어요!", { queue: true });
            drawCards();
          } else c.replaceWith(cardOf(x));
          this.drawCount(ctx);
        });
        return c;
      };
      const drawCards = () => {
        grid.innerHTML = "";
        // 최근에 만든 친구가 앞에 (상태를 바꿔도 자리가 튀지 않게 만든 순서로만 정렬)
        all
          .filter((x) => !kind || x.tid === kind)
          .slice()
          .sort((a, b) => (b.t || 0) - (a.t || 0))
          .forEach((x) => grid.appendChild(cardOf(x)));
      };
      drawFilter();
      drawCards();
      this.drawCount(ctx);
      KP.voice.say("동물 친구 집이에요! 친구를 콕 누르면 나가 놀거나 쉴 수 있어요.");
      bClose.addEventListener("click", () => {
        KP.audio.sfx("back");
        box.remove();
        if (changed) this.start(ctx); // 바뀐 대로 동물원 다시 꾸미기
      });
    },
    /* 동물 꾹 → '집에서 쉬기' 버튼 (지우지 않음 — 🏠 집에서 다시 데려올 수 있음) */
    askDelete3(ctx, a) {
      const p = ctx.z3.toScreen(a, 1.2);
      this.restButton(ctx, a, U.clamp(p.x - 80, 4, ctx.W.clientWidth - 180), U.clamp(p.y - 60, 4, ctx.W.clientHeight - 60), () => ctx.z3.remove(a));
    },
    restButton(ctx, a, x, y, hide) {
      U.$$(".zDel", ctx.W).forEach((e) => e.remove());
      const b = U.btn(KP.E("💤") + " 집에서 쉬기", "zDel");
      b.style.left = x + "px";
      b.style.top = y + "px";
      ctx.W.appendChild(b);
      b.addEventListener("click", async () => {
        if (b.dataset.busy) return;
        b.dataset.busy = "1";
        // 집 화면과 같은 기록으로 (👑 단짝 표시가 옛 기록으로 덮어써지지 않게)
        const it = (ctx.allZoo || []).find((x) => x.id === a.item.id) || a.item;
        a.item = it;
        if ((await KEEP.setRest(it, true, ctx.allZoo || [])) === null) {
          b.remove();
          return KP.toast("저장하지 못했어요. 기기 저장공간을 확인해 주세요");
        }
        hide();
        b.remove();
        this.drawCount(ctx);
        KP.voice.say("코 자자~");
        // 마지막 친구까지 쉬러 가면 "집에서 데려오기" 화면으로
        if (!(ctx.allZoo || []).some((x) => !x.rest)) ctx.after(900, () => this.start(ctx));
      });
      ctx.after(4000, () => b.remove());
    },
    /** 🏠 버튼: 노는 친구 수 (쉬는 친구가 있으면 💤 수도) */
    drawCount(ctx) {
      const all = ctx.allZoo || [];
      const on = all.filter((x) => !x.rest).length,
        off = all.length - on;
      ctx.count.innerHTML = KP.E("🏠") + " " + KP.E("🐾") + on + (off ? " · " + KP.E("💤") + off : "");
    },
    sizeAnimal(ctx, a) {
      const g = ctx.g,
        t = a.t,
        base = g.base;
      a.size = t.move === "swim" ? Math.min(base * 0.62, g.pond.rx * 0.85) : t.move === "fly" ? base * 0.7 : t.slow ? base * 0.8 : base;
      a.el.style.width = a.size + "px";
      a.el.style.height = a.size * 0.85 + "px";
    },
    /* --- 동물 하나 배치 --- */
    add(ctx, item, isNew) {
      const W = ctx.W,
        g = ctx.g;
      const t = T[item.tid];
      const el = U.el("div", "zA");
      const ground = t.move === "walk" || t.move === "hop";
      el.innerHTML = (ground ? '<div class="zShadow"></div>' : "") + '<div class="zLift"><div class="zIn"><div class="zBob">' + shadeSvg(freshSvg(item), item.paint) + "</div></div></div>";
      W.appendChild(el);
      const a = { el, item, t, size: 0, s: 1, x: 0, y: 0, tx: 0, ty: 0, state: "idle", wait: Math.random() * 2, dir: 1, ph: Math.random() * 6, treat: null, lift: el.querySelector(".zLift"), shadow: el.querySelector(".zShadow"), z: -1, lv: -1 };
      this.sizeAnimal(ctx, a);
      ctx.animals.push(a);
      const p = this.randPos(ctx, t.move, a);
      a.x = p.x;
      a.y = p.y;
      if (isNew && t.move !== "swim") {
        // 새 친구는 왼쪽 먼 곳에서 앞쪽으로 걸어 들어옴 (점점 커짐)
        a.x = -a.size * 0.5;
        a.y = t.move === "fly" ? g.hz * 0.6 : g.y0 + (g.y1 - g.y0) * 0.2;
        a.state = "walk";
        a.tx = g.w * 0.3;
        a.ty = t.move === "fly" ? g.hz * 0.5 : g.y0 + (g.y1 - g.y0) * 0.75;
        el.classList.add("new");
        setTimeout(() => el.classList.remove("new"), 6000);
      } else {
        a.tx = a.x;
        a.ty = a.y;
      }
      // 누르기 / 길게 누르기(보내기)
      let lp = 0;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        KP.audio.unlock();
        this.poke(ctx, a);
        clearTimeout(lp);
        lp = setTimeout(() => this.askDelete(ctx, a), 1200); // 꾹 → 집에서 쉬기 버튼
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => clearTimeout(lp)));
      this.place(ctx, a);
      return a;
    },
    randPos(ctx, move, self) {
      const g = ctx.g,
        w = g.w;
      if (move === "fly") return { x: U.randf(0.1, 0.9) * w, y: U.randf(Math.max(0.1 * g.h, g.hz * 0.3), g.hz + g.h * 0.04) };
      if (move === "swim") {
        // 물고기끼리 겹쳐 쌓이지 않게: 여러 자리 중 다른 물고기와 가장 먼 곳
        const p = g.pond;
        let best = null,
          bd = -1;
        for (let i = 0; i < 12; i++) {
          const a = U.randf(0, 6.28),
            rr = Math.sqrt(Math.random()) * 0.6;
          const q = { x: p.cx + Math.cos(a) * p.rx * 0.8 * rr, y: p.cy + Math.sin(a) * p.ry * 0.7 * rr };
          let d = 1e9;
          for (const o of ctx.animals || []) if (o !== self && o.t.move === "swim") d = Math.min(d, Math.hypot(o.tx - q.x, o.ty - q.y), Math.hypot(o.x - q.x, o.y - q.y));
          if (d > bd) {
            bd = d;
            best = q;
          }
        }
        return best;
      }
      let best = null,
        bestD = -1;
      for (let i = 0; i < 30; i++) {
        const x = U.randf(0.08, 0.92) * w,
          y = U.randf(g.y0, g.y1);
        if (this.inPond(ctx, x, y)) continue;
        if (self && !this.inPond(ctx, self.x, self.y) && this.crossPond(ctx, self.x, self.y, x, y)) continue;
        // 다른 친구들과 너무 붙지 않게 (뭉침 방지)
        let d = 1e9;
        for (const o of ctx.animals || []) {
          if (o === self || o.t.move === "fly" || o.t.move === "swim") continue;
          d = Math.min(d, Math.hypot(o.tx - x, (o.ty - y) * 1.6), Math.hypot(o.x - x, (o.y - y) * 1.6));
        }
        if (d > g.base * 0.75) return { x, y };
        if (d > bestD) {
          bestD = d;
          best = { x, y };
        }
      }
      return best || { x: 0.2 * w, y: (g.y0 + g.y1) / 2 };
    },
    place(ctx, a) {
      const g = ctx.g;
      let s = 1;
      if (a.t.move === "walk" || a.t.move === "hop") s = this.sc(ctx, a.y);
      a.s = s;
      let lift = 0;
      if (a.t.move === "hop" && a.state === "walk") lift = Math.abs(Math.sin(a.ph * 2.2)) * a.size * 0.18;
      if (a.t.move === "fly") lift = Math.sin(a.ph * 1.6) * 10;
      // 땅 동물은 발(아래 가운데), 물고기·새는 몸 가운데를 기준점으로
      const anchorY = a.t.move === "swim" || a.t.move === "fly" ? a.size * 0.425 : a.size * 0.85;
      a.el.style.transform = "translate(" + (a.x - a.size / 2).toFixed(1) + "px," + (a.y - anchorY).toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
      const lv = Math.round(lift);
      if (lv !== a.lv) {
        a.lv = lv;
        a.lift.style.transform = lv ? "translateY(" + -lv + "px)" : "";
        if (a.shadow) {
          const k = 1 - Math.min(0.5, lv / a.size);
          a.shadow.style.transform = "translateX(-5%) scale(" + k.toFixed(2) + ")";
          a.shadow.style.opacity = k.toFixed(2);
        }
      }
      const z = a.t.move === "fly" ? 5000 : Math.round(a.y);
      if (z !== a.z) a.el.style.zIndex = a.z = z;
    },
    tick(ctx, dt) {
      if (!ctx.g) return;
      for (const a of ctx.animals) {
        a.ph += dt * 4;
        // 먼 곳(작게 보이는 곳)에서는 화면상 속도도 느리게 → 원근감
        const speed = (a.t.move === "fly" ? 70 : a.t.move === "swim" ? 30 : a.t.slow ? 16 : a.t.move === "hop" ? 60 : 46) * (a.treat ? 1.8 : 1) * (a.t.move === "walk" || a.t.move === "hop" ? 0.35 + 0.65 * a.s : 1);
        if (a.state === "idle") {
          a.wait -= dt;
          a.el.classList.remove("walking");
          if (a.t.move === "fly") a.el.classList.add("flying");
          if (a.wait <= 0) {
            const p = a.treat || this.randPos(ctx, a.t.move, a);
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
            if (Math.abs(dx) > 2) a.el.classList.toggle("left", dx < 0);
            a.el.classList.add(a.t.move === "fly" ? "flying" : "walking");
          }
        }
        this.place(ctx, a);
      }
    },
    poke(ctx, a) {
      U.replay(a.el, "jump");
      const nm = a.t.name;
      KP.voice.say(nm + "! " + a.t.cry + " 내가 색칠한 " + U.josa(nm, "이에요/예요") + "!");
      KP.audio.sfx(U.pick(["boing", "pop", "tap2"]));
      this.hearts(ctx, a, 2);
    },
    hearts(ctx, a, n) {
      const W = ctx.W;
      for (let i = 0; i < n; i++) {
        const h = U.el("div", "zHeart", KP.E(U.pick(["💖", "💕", "⭐"])));
        h.style.left = a.x - 14 + U.randf(-20, 20) + "px";
        h.style.top = a.y - a.size * 0.9 * (a.s || 1) + "px";
        h.style.animationDelay = i * 0.15 + "s";
        W.appendChild(h);
        setTimeout(() => h.remove(), 1500);
      }
    },
    dropTreat(ctx, x, y) {
      const W = ctx.W,
        g = ctx.g;
      y = U.clamp(y, g.y0, g.y1);
      // 연못 안이면 연못 가장자리 밖으로
      if (this.inPond(ctx, x, y)) {
        const p = g.pond;
        let dx = (x - p.cx) / p.rx,
          dy = (y - p.cy) / p.ry;
        if (!dx && !dy) dx = -1;
        const k = 1 / Math.hypot(dx, dy);
        x = p.cx + dx * k * p.rx * 1.2;
        y = p.cy + dy * k * p.ry * 1.45;
        if (y > g.y1) {
          y = p.cy - p.ry * 1.45;
        }
      }
      const em = U.pick(["🍎", "🥕", "🍌", "🐟", "🍖", "🌽"]);
      const t = U.el("div", "zTreat", KP.E(em));
      const sc = this.sc(ctx, y);
      t.style.left = x - 20 + "px";
      t.style.top = "-50px";
      t.style.zIndex = Math.round(y) - 1;
      t.style.transform = "scale(" + sc.toFixed(2) + ")";
      W.appendChild(t);
      requestAnimationFrame(() => (t.style.top = y - 34 + "px"));
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
      if (ctx.use3d) {
        if (!ctx.z3.animals.length) return;
        ctx.z3.treatTime();
        KP.voice.say("간식 시간이에요!");
        return;
      }
      if (!ctx.animals.length) return;
      for (let i = 0; i < 3; i++)
        ctx.after(i * 250, () => {
          const p = this.randPos(ctx, "walk");
          this.dropTreat(ctx, p.x, p.y);
        });
      KP.voice.say("간식 시간이에요!");
    },
    callAll(ctx) {
      if (ctx.use3d) {
        const z = ctx.z3;
        if (!z.animals.length) return;
        KP.audio.sfx("levelup");
        KP.voice.say("모두 모여라! 하나, 둘, 셋!");
        z.resetView();
        z.callAll();
        ctx.after(4200, () => {
          z.animals.forEach((a, i) => ctx.after(i * 90, () => (a.jump = 0.65)));
          KP.confetti(100);
          KP.audio.jingle();
        });
        return;
      }
      if (!ctx.animals.length) return;
      const g = ctx.g;
      KP.audio.sfx("levelup");
      KP.voice.say("모두 모여라! 하나, 둘, 셋!");
      // 화면 앞쪽(가까운 곳)으로 모여 → 걸어오며 커짐
      const land = ctx.animals.filter((a) => a.t.move !== "swim" && a.t.move !== "fly");
      const cx = g.w * 0.42,
        cy = g.y0 + (g.y1 - g.y0) * 0.66;
      ctx.animals.forEach((a) => {
        if (a.t.move === "swim") return;
        if (a.treat) {
          // 먹으러 가던 간식은 치움
          a.treat.taken = true;
          a.treat.el.remove();
          a.treat = null;
        }
        if (a.t.move === "fly") {
          a.tx = U.randf(0.3, 0.6) * g.w;
          a.ty = g.hz * 0.6;
        } else {
          const i = land.indexOf(a),
            ang = Math.PI * (0.1 + (0.8 * (i + 0.5)) / land.length);
          let x = cx + Math.cos(ang) * g.w * 0.28,
            y = cy + Math.sin(ang) * (g.y1 - g.y0) * 0.26 - (g.y1 - g.y0) * 0.1;
          for (let k = 0; k < 20 && this.inPond(ctx, x, y); k++) x -= g.w * 0.03;
          a.tx = x;
          a.ty = y;
        }
        a.state = "walk";
      });
      ctx.treatsArr = ctx.treatsArr.filter((t) => !t.taken);
      ctx.after(3200, () => {
        ctx.animals.forEach((a, i) => ctx.after(i * 80, () => U.replay(a.el, "jump")));
        KP.confetti(100);
        KP.audio.jingle();
      });
    },
    askDelete(ctx, a) {
      this.restButton(ctx, a, U.clamp(a.x - 80, 4, ctx.W.clientWidth - 180), Math.max(4, a.y - a.size * (a.s || 1) - 50), () => {
        // 먹으러 가던 간식이 있으면 같이 치움 (안 치우면 화면에 영영 남음)
        if (a.treat) {
          a.treat.taken = true;
          if (a.treat.el) a.treat.el.remove();
          a.treat = null;
        }
        a.el.style.transition = "opacity .5s";
        a.el.style.opacity = "0";
        ctx.animals = ctx.animals.filter((x) => x !== a);
        setTimeout(() => a.el.remove(), 520);
      });
    },
  });
})();
