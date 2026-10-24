/* =====================================================================
   🐾 Clay 2.0 — 색칠 공방의 옆모습 도안 동물(SVG)을 '통통한 점토 조각' 3D 로 (시험판 lab/zoo 를 앱용으로 옮김)
   - 저장된 그림(item.svg + item.paint 크레파스)을 그대로 읽어 부위 조각으로 나누고(parseArt),
     조각마다 도안 모양을 얕게 돌출 + 둥근 모서리, 앞뒷면에 아이 그림을 그대로 붙임
   - 가짜 볼록 노멀맵·접합부 그림자(bakeClay2) → 평평한 판이지만 점토 인형처럼 빛을 받음
   - 관절 묶음(RIG)으로 다리·꼬리·머리·날개를 움직임(pose). 11종 모두 정의
   - THREE 는 zoo3d.js 가 불러온 것을 KP.CLAY2.use(THREE) 로 받음
===================================================================== */
"use strict";
(function () {
  let THREE = null;
  const INK = "#3b3355";
  const U = 0.01; // 도안 1단위 → 세상 단위

  /* ---------- 관절(뼈대) 정의: 도안 좌표 (zoo.js 의 도안과 같은 좌표, viewBox 0 0 200 170, 오른쪽을 봄) ----------
     group: 부위 → 관절 묶음. pivot: 회전 중심. thick: 두께(도안 단위). z: "back" = 몸통 뒤쪽(먼 다리), "mid" = 몸통 가운데(꼬리)
     size: 크기 배율. fly: 하늘(새·나비), swim: 연못(물고기), hop: 깡충(토끼), slow: 느림(거북이) */
  const RIG = {
    dog: {
      size: 1.0,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [53, 85], z: "mid" },
        head: { parent: "body", pivot: [134, 88] },
        ear: { parent: "head", pivot: [136, 58] },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ tail: "tail", head: "head", muzzle: "head", ear: "ear" })[p] || "body",
      thick: { body: 22, head: 20, muzzle: 8, ear: 6, tail: 8, spot: 3, leg: 11 },
    },
    elephant: {
      size: 1.3,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [35, 93], z: "mid" },
        head: { parent: "body", pivot: [124, 92] },
        trunk: { parent: "head", pivot: [164, 90] },
        ear: { parent: "head", pivot: [149, 76], flap: true },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ head: "head", tusk: "head", trunk: "trunk", ear: "ear" })[p] || "body",
      decorGroup: (cx) => (cx < 50 ? "tail" : null),
      thick: { body: 26, head: 22, trunk: 11, ear: 5, tusk: 6, leg: 13 },
    },
    butterfly: {
      size: 0.72,
      fly: true,
      groups: {
        body: { parent: null },
        wingL: { parent: "body", pivot: [100, 92] },
        wingR: { parent: "body", pivot: [100, 92] },
      },
      groupOf: (p, cls) => (cls.includes("wingL") ? "wingL" : cls.includes("wingR") ? "wingR" : "body"),
      thick: { wing1: 3.5, wing2: 3.5, spot: 1.6, body: 12 },
    },
    dino: {
      size: 1.15,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [58, 94], z: "mid" },
        head: { parent: "body", pivot: [138, 88] },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ tail: "tail", neck: "head", head: "head" })[p] || "body",
      thick: { body: 24, belly: 4, spike: 6, neck: 14, head: 18, tail: 10, leg: 12 },
    },
    lion: {
      size: 1.1,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [46, 92], z: "mid" },
        head: { parent: "body", pivot: [128, 92] },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ tuft: "tail", mane: "head", ear: "head", head: "head", muzzle: "head" })[p] || "body",
      decorGroup: (cx) => (cx < 50 ? "tail" : null),
      thick: { body: 22, mane: 10, ear: 6, head: 18, muzzle: 8, tuft: 8, leg: 11 },
    },
    rabbit: {
      size: 0.95,
      hop: true,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [62, 104], z: "mid" },
        head: { parent: "body", pivot: [130, 100] },
        l3: { parent: "body", leg: 3 },
      },
      groupOf: (p) => ({ tail: "tail", head: "head", ear: "head", inner: "head" })[p] || "body",
      thick: { body: 24, foot: 10, tail: 10, leg: 10, ear: 6, inner: 2, head: 20 },
    },
    bear: {
      size: 1.1,
      groups: {
        body: { parent: null },
        head: { parent: "body", pivot: [130, 94] },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ head: "head", ear: "head", inner: "head", muzzle: "head" })[p] || "body",
      thick: { body: 24, belly: 4, ear: 6, inner: 2, head: 20, muzzle: 8, leg: 12 },
    },
    pig: {
      size: 1.1,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [44, 90], z: "mid" },
        head: { parent: "body", pivot: [134, 100] },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ head: "head", ear: "head", snout: "head" })[p] || "body",
      decorGroup: (cx) => (cx < 50 ? "tail" : null),
      thick: { body: 26, spot: 3, ear: 6, head: 20, snout: 9, leg: 11 },
    },
    fish: {
      size: 0.75,
      swim: true,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [54, 85], z: "mid" },
      },
      groupOf: (p) => (p === "tail" ? "tail" : "body"),
      thick: { body: 18, stripe: 2, fin: 4, tail: 4 },
    },
    bird: {
      size: 0.8,
      fly: true,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [62, 94], z: "mid" },
        head: { parent: "body", pivot: [124, 80] },
        wing: { parent: "body", pivot: [78, 86] },
      },
      groupOf: (p, cls) => (cls.includes("wing") ? "wing" : ({ head: "head", beak: "head", tail: "tail" })[p] || "body"),
      thick: { body: 20, belly: 4, head: 16, beak: 6, wing: 5, tail: 4 },
    },
    turtle: {
      size: 1.0,
      slow: true,
      groups: {
        body: { parent: null },
        tail: { parent: "body", pivot: [48, 108], z: "mid" },
        head: { parent: "body", pivot: [160, 100] },
        l1: { parent: "body", leg: 1 }, l2: { parent: "body", leg: 2, z: "back" },
        l3: { parent: "body", leg: 3 }, l4: { parent: "body", leg: 4, z: "back" },
      },
      groupOf: (p) => ({ head: "head", tail: "tail" })[p] || "body",
      thick: { shell: 26, plate: 3, rim: 9, head: 14, tail: 6, leg: 10 },
    },
  };

  /* ---- lab/zoo/art.js: 저장 그림 SVG → 부위 조각 + 그림판(atlas) ---- */
  /* ---------- 작은 수학: 2D 아핀 [a,b,c,d,e,f] (x' = a x + c y + e, y' = b x + d y + f) ---------- */
  const I6 = [1, 0, 0, 1, 0, 0];
  const mul = (A, B) => [
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
  ];
  const ap = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
  function parseTransform(s) {
    let M = I6;
    if (!s) return M;
    const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
    let m;
    while ((m = re.exec(s))) {
      const v = m[2].trim().split(/[\s,]+/).map(Number);
      let T = I6;
      if (m[1] === "matrix" && v.length === 6) T = v;
      else if (m[1] === "translate") T = [1, 0, 0, 1, v[0] || 0, v[1] || 0];
      else if (m[1] === "scale") T = [v[0], 0, 0, v.length > 1 ? v[1] : v[0], 0, 0];
      else if (m[1] === "rotate") {
        const a = ((v[0] || 0) * Math.PI) / 180, c = Math.cos(a), s2 = Math.sin(a);
        T = [c, s2, -s2, c, 0, 0];
        if (v.length >= 3) T = mul(mul([1, 0, 0, 1, v[1], v[2]], T), [1, 0, 0, 1, -v[1], -v[2]]);
      } else if (m[1] === "skewX") T = [1, 0, Math.tan(((v[0] || 0) * Math.PI) / 180), 1, 0, 0];
      else if (m[1] === "skewY") T = [1, Math.tan(((v[0] || 0) * Math.PI) / 180), 0, 1, 0, 0];
      if (T.every(Number.isFinite)) M = mul(M, T);
    }
    return M;
  }

  /* ---------- SVG 모양 → 점 목록 (입체 만들기·안쪽 판정용) ---------- */
  function ellipsePts(cx, cy, rx, ry) {
    const n = Math.max(24, Math.min(64, Math.round((Math.PI * (rx + ry)) / 3)));
    const o = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return o;
  }
  function rrectPts(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    const o = [], k = 6;
    const corner = (cx, cy, a0) => {
      for (let i = 0; i <= k; i++) {
        const a = a0 + (i / k) * (Math.PI / 2);
        o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    if (r < 0.01) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    return o;
  }
  /** path d → 하위 경로별 점 목록 (M L H V Q T C S Z, 대소문자) */
  function pathPts(d) {
    const tok = String(d).match(/[MmLlHhVvQqTtCcSsZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
    const subs = [];
    let cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = "", i = 0, lcx = 0, lcy = 0, lq = null;
    const num = () => +tok[i++];
    const isNum = () => i < tok.length && !/^[A-Za-z]$/.test(tok[i]);
    const push = (px, py) => cur && cur.pts.push([px, py]);
    const quad = (x1, y1, x2, y2) => {
      for (let k = 1; k <= 8; k++) {
        const t = k / 8, u = 1 - t;
        push(u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2);
      }
    };
    const cub = (x1, y1, x2, y2, x3, y3) => {
      for (let k = 1; k <= 10; k++) {
        const t = k / 10, u = 1 - t;
        push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
      }
    };
    while (i < tok.length) {
      if (/^[A-Za-z]$/.test(tok[i])) cmd = tok[i++];
      const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
      const ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === "Z") {
        if (cur) cur.closed = true;
        x = sx; y = sy;
        cmd = "";
        lq = null;
        continue;
      }
      if (!isNum()) { i++; continue; }
      if (C === "M") {
        x = ox + num(); y = oy + num();
        sx = x; sy = y;
        cur = { pts: [[x, y]], closed: false };
        subs.push(cur);
        cmd = rel ? "l" : "L";
        lq = null;
      } else if (C === "L") { x = ox + num(); y = oy + num(); push(x, y); lq = null; }
      else if (C === "H") { x = ox + num(); push(x, y); lq = null; }
      else if (C === "V") { y = oy + num(); push(x, y); lq = null; }
      else if (C === "Q") {
        const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num();
        quad(x1, y1, x2, y2); lq = [x1, y1]; x = x2; y = y2;
      } else if (C === "T") {
        const x1 = lq ? 2 * x - lq[0] : x, y1 = lq ? 2 * y - lq[1] : y, x2 = ox + num(), y2 = oy + num();
        quad(x1, y1, x2, y2); lq = [x1, y1]; x = x2; y = y2;
      } else if (C === "C") {
        const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num();
        cub(x1, y1, x2, y2, x3, y3); lcx = x2; lcy = y2; x = x3; y = y3; lq = null;
      } else if (C === "S") {
        const x1 = 2 * x - lcx, y1 = 2 * y - lcy, x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num();
        cub(x1, y1, x2, y2, x3, y3); lcx = x2; lcy = y2; x = x3; y = y3; lq = null;
      } else i++;
    }
    // 같은 점 반복 정리
    for (const s of subs) {
      const o = [];
      for (const p of s.pts) if (!o.length || Math.hypot(p[0] - o[o.length - 1][0], p[1] - o[o.length - 1][1]) > 0.05) o.push(p);
      if (o.length > 2 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.05) o.pop();
      s.pts = o;
    }
    return subs.filter((s) => s.pts.length >= 2);
  }
  const n = (el, a) => +el.getAttribute(a) || 0;
  function shapeGeo(el, tag) {
    if (tag === "ellipse") return { subs: [{ pts: ellipsePts(n(el, "cx"), n(el, "cy"), n(el, "rx"), n(el, "ry")), closed: true }] };
    if (tag === "circle") return { subs: [{ pts: ellipsePts(n(el, "cx"), n(el, "cy"), n(el, "r"), n(el, "r")), closed: true }] };
    if (tag === "rect") return { subs: [{ pts: rrectPts(n(el, "x"), n(el, "y"), n(el, "width"), n(el, "height"), n(el, "rx") || n(el, "ry")), closed: true }] };
    if (tag === "polygon" || tag === "polyline") {
      const v = String(el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
      const pts = [];
      for (let i = 0; i + 1 < v.length; i += 2) if (Number.isFinite(v[i]) && Number.isFinite(v[i + 1])) pts.push([v[i], v[i + 1]]);
      return pts.length >= 2 ? { subs: [{ pts, closed: tag === "polygon" }] } : null;
    }
    if (tag === "line") return { subs: [{ pts: [[n(el, "x1"), n(el, "y1")], [n(el, "x2"), n(el, "y2")]], closed: false }] };
    if (tag === "path") {
      const subs = pathPts(el.getAttribute("d") || "");
      return subs.length ? { subs } : null;
    }
    return null;
  }
  /** 캔버스용 모양 (요소 자기 좌표) */
  function shapePath2D(sh) {
    const el = sh.el, t = sh.tag, p = new Path2D();
    if (t === "path") return new Path2D(el.getAttribute("d") || "");
    if (t === "ellipse") p.ellipse(n(el, "cx"), n(el, "cy"), Math.max(0, n(el, "rx")), Math.max(0, n(el, "ry")), 0, 0, Math.PI * 2);
    else if (t === "circle") p.arc(n(el, "cx"), n(el, "cy"), Math.max(0, n(el, "r")), 0, Math.PI * 2);
    else {
      for (const s of sh.subs) {
        s.pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
        if (s.closed) p.closePath();
      }
    }
    return p;
  }
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1] + 1e-9) + a[0]) c = !c;
    }
    return c;
  }
  const bboxOf = (pts) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1 };
  };
  const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const isInk = (c) => /^#3b3355$/i.test(String(c || "").trim());
  const isWhite = (c) => /^#(fff|ffffff)$/i.test(String(c || "").trim());

  /* ---------- 저장 그림 SVG → 부위 조각 ---------- */
  const SHAPES = new Set(["path", "ellipse", "circle", "rect", "polygon", "polyline", "line"]);
  function parseArt(svgStr, tid) {
    const rig = RIG[tid];
    if (!rig || typeof svgStr !== "string" || svgStr.length > 300000) return null;
    let doc;
    try {
      doc = new DOMParser().parseFromString(svgStr, "image/svg+xml"); // 읽기만 함 — 화면(문서)에 넣지 않음
    } catch (e) {
      return null;
    }
    const root = doc && doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return null;
    // 무늬 정의 (id: uid-종류(-색))
    const defs = {};
    for (const d of root.querySelectorAll("linearGradient,pattern")) {
      const id = d.getAttribute("id") || "";
      const m = /-(rainbow|glitter|dots|stripes)(?:-([0-9a-fA-F]{6}))?$/.exec(id);
      if (m) defs[id] = { kind: m[1], base: m[2] ? "#" + m[2] : "#ffffff" };
    }
    const shapes = [];
    let fbi = 0;
    const walk = (el, M, cls) => {
      for (const c of el.children) {
        const tag = c.nodeName.toLowerCase();
        if (tag === "defs" || tag === "clippath" || tag === "pattern" || tag === "lineargradient" || tag === "radialgradient" || tag === "image") continue;
        const k = c.getAttribute("class") || "";
        if (/\b(pp|ppo|zSh)\b/.test(k)) continue;
        const M2 = mul(M, parseTransform(c.getAttribute("transform")));
        const cls2 = cls.concat(k.split(/\s+/).filter(Boolean));
        if (tag === "g") {
          walk(c, M2, cls2);
          continue;
        }
        if (!SHAPES.has(tag)) continue;
        const geo = shapeGeo(c, tag);
        if (!geo) continue;
        const isFb = /\bfb\b/.test(k);
        const sh = {
          el: c, tag, M: M2, cls: cls2, isFb, p: c.getAttribute("data-p") || "", fb: isFb ? fbi++ : -1, subs: geo.subs,
          fill: c.getAttribute("fill"), stroke: c.getAttribute("stroke"), sw: c.hasAttribute("stroke-width") ? +c.getAttribute("stroke-width") || 0 : 1,
          op: c.hasAttribute("opacity") ? +c.getAttribute("opacity") : 1, cap: c.getAttribute("stroke-linecap") || "butt", join: c.getAttribute("stroke-linejoin") || "miter",
        };
        if (sh.fill == null) sh.fill = "#000";
        if (!sh.stroke || sh.stroke === "none") sh.sw = 0;
        sh.path = shapePath2D(sh);
        sh.rsubs = sh.subs.map((s) => ({ pts: s.pts.map((q) => ap(sh.M, q[0], q[1])), closed: s.closed }));
        sh.rpts = sh.rsubs.reduce((a, s) => (s.pts.length > a.length ? s.pts : a), []); // 가장 큰 하위 경로
        const all = sh.rsubs.flatMap((s) => s.pts);
        const bb = bboxOf(all);
        const pad = sh.sw / 2;
        sh.bb = { x0: bb.x0 - pad, y0: bb.y0 - pad, x1: bb.x1 + pad, y1: bb.y1 + pad };
        sh.lbb = bboxOf(sh.subs.flatMap((s) => s.pts)); // 자기 좌표 테두리 상자 (무지개 무늬용)
        sh.cx = (bb.x0 + bb.x1) / 2;
        sh.cy = (bb.y0 + bb.y1) / 2;
        shapes.push(sh);
      }
    };
    walk(root, I6, []);
    if (!shapes.some((s) => s.isFb)) return null;

    // 부위 조각
    const pieces = [];
    const parts = [];
    for (let i = 0; i < shapes.length; i++) {
      const sh = shapes[i];
      if (sh.isFb) {
        const g = rig.groupOf(sh.p, sh.cls);
        const legc = sh.cls.find((c) => /^l[1-4]$/.test(c));
        const pc = { kind: "part", shs: [sh], sh, group: sh.p === "leg" && legc ? legc : g, baked: [], bb: sh.bb, p: sh.p, order: pieces.length };
        pieces.push(pc);
        parts.push(pc);
        continue;
      }
      // 장식 (눈·코·볼·선)
      const host = [...parts].reverse().find((pc) => sh.rpts.length > 2 && inPoly(pc.sh.rpts, sh.cx, sh.cy)) || null;
      const isEye = sh.tag === "circle" && isInk(sh.fill) && n(sh.el, "r") >= 1.8 && n(sh.el, "r") <= 7 && host && /head|body/.test(host.p);
      if (isEye) {
        const nx = shapes[i + 1];
        const shs = [sh];
        if (nx && !nx.isFb && nx.tag === "circle" && isWhite(nx.fill) && Math.hypot(nx.cx - sh.cx, nx.cy - sh.cy) < n(sh.el, "r")) {
          shs.push(nx);
          i++;
        }
        pieces.push({ kind: "eye", shs, sh, group: host.group, bb: sh.bb, p: "eye", host, order: pieces.length, cx: sh.cx, cy: sh.cy });
        continue;
      }
      if (host) {
        for (const pc of parts) if (pc.group === host.group && overlap(pc.bb, sh.bb)) pc.baked.push(sh);
        continue;
      }
      // 어느 부위에도 안 들어가는 장식 → 따로 조각 (선은 끈, 면은 작은 조각)
      let near = null, best = Infinity;
      for (const pc of parts) {
        const dx = Math.max(pc.bb.x0 - sh.cx, 0, sh.cx - pc.bb.x1), dy = Math.max(pc.bb.y0 - sh.cy, 0, sh.cy - pc.bb.y1);
        const dd = dx * dx + dy * dy;
        if (dd < best) {
          best = dd;
          near = pc;
        }
      }
      const group = (rig.decorGroup && rig.decorGroup(sh.cx, sh.cy)) || (near ? near.group : "body");
      const stroke = !sh.fill || sh.fill === "none";
      pieces.push({ kind: stroke ? "tube" : "mini", shs: [sh], sh, group, bb: sh.bb, p: "decor", order: pieces.length });
    }

    // 관절 중심
    const groups = {};
    for (const [name, g] of Object.entries(rig.groups)) {
      groups[name] = { name, parent: g.parent, z: g.z || null, flap: !!g.flap, pivot: g.pivot ? g.pivot.slice() : null, leg: g.leg || 0 };
    }
    for (const pc of pieces) if (!groups[pc.group]) pc.group = "body";
    for (const g of Object.values(groups)) {
      if (g.leg) {
        const pc = pieces.find((q) => q.group === g.name && q.kind === "part");
        if (pc) {
          const b = pc.sh.lbb;
          g.pivot = ap(pc.sh.M, (b.x0 + b.x1) / 2, b.y0 + Math.min(b.x1 - b.x0, b.y1 - b.y0) * 0.42);
        }
      }
    }
    // 발 위치(몸 전체의 기준점)
    const all = pieces.map((p) => p.bb);
    const ab = { x0: Math.min(...all.map((b) => b.x0)), y0: Math.min(...all.map((b) => b.y0)), x1: Math.max(...all.map((b) => b.x1)), y1: Math.max(...all.map((b) => b.y1)) };
    const bodyPc = pieces.find((p) => p.p === "body") || pieces[0];
    let foot;
    if (rig.fly || rig.swim) foot = [(bodyPc.bb.x0 + bodyPc.bb.x1) / 2, (bodyPc.bb.y0 + bodyPc.bb.y1) / 2];
    else {
      const legs = pieces.filter((p) => /^l[1-4]$/.test(p.group));
      foot = [(bodyPc.bb.x0 + bodyPc.bb.x1) / 2, legs.length ? Math.max(...legs.map((p) => p.bb.y1)) - 2 : ab.y1];
    }
    groups.body.pivot = foot.slice();
    for (const g of Object.values(groups)) if (!g.pivot) g.pivot = foot.slice();
    return { tid, rig, pieces, groups, foot, bbox: ab, defs };
  }

  /* ---------- 캔버스에 부위 그리기 (2D 도안과 같은 모양·순서) ---------- */
  const RAINBOW = ["#ff5b6e", "#ffa14a", "#ffe14d", "#4fd37b", "#3fb0ff", "#9a6bff"];
  const tileCache = new Map();
  function tile(kind, base) {
    const key = kind + base;
    if (tileCache.has(key)) return tileCache.get(key);
    const R = 64, c = document.createElement("canvas");
    c.width = c.height = R;
    const g = c.getContext("2d");
    if (kind === "glitter") {
      const k = R / 18;
      g.fillStyle = "#ffd66b";
      g.fillRect(0, 0, R, R);
      [["#fff", 4, 4, 2], ["#ff8ad8", 13, 9, 1.5], ["#8ad1ff", 7, 14, 1.6]].forEach(([col, x, y, r]) => {
        g.fillStyle = col;
        g.beginPath();
        g.arc(x * k, y * k, r * k, 0, 7);
        g.fill();
      });
      g.fillStyle = "#fff";
      g.beginPath();
      g.moveTo(14 * k, 2 * k); g.lineTo(15 * k, 4 * k); g.lineTo(17 * k, 5 * k); g.lineTo(15 * k, 6 * k); g.lineTo(14 * k, 8 * k);
      g.lineTo(13 * k, 6 * k); g.lineTo(11 * k, 5 * k); g.lineTo(13 * k, 4 * k);
      g.fill();
    } else if (kind === "dots") {
      const k = R / 16;
      g.fillStyle = base;
      g.fillRect(0, 0, R, R);
      g.fillStyle = "rgba(255,255,255,.85)";
      g.beginPath();
      g.arc(8 * k, 8 * k, 3.6 * k, 0, 7);
      g.fill();
    } else {
      const k = R / 14;
      g.fillStyle = base;
      g.fillRect(0, 0, R, R);
      g.fillStyle = "rgba(255,255,255,.55)";
      g.fillRect(0, 0, 6 * k, R);
    }
    tileCache.set(key, c);
    return c;
  }
  function fillStyle(g, sh, defs) {
    const f = String(sh.fill || "").trim();
    const m = /^url\(#([^)]+)\)$/.exec(f);
    if (!m) return f === "none" ? null : f;
    const d = defs[m[1]];
    if (!d) return "#cccccc";
    if (d.kind === "rainbow") {
      const b = sh.lbb, gr = g.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
      RAINBOW.forEach((c, i) => gr.addColorStop(i / (RAINBOW.length - 1), c));
      return gr;
    }
    const t = tile(d.kind, d.base), pat = g.createPattern(t, "repeat");
    const size = d.kind === "glitter" ? 18 : d.kind === "dots" ? 16 : 14;
    let M = new DOMMatrix().scale(size / 64, size / 64);
    if (d.kind === "stripes") M = new DOMMatrix().rotate(45).scale(size / 64, size / 64);
    if (pat.setTransform) pat.setTransform(M);
    return pat;
  }
  /** 대표색 (옆면 점토색) — 단색은 그대로, 무늬는 바탕색 */
  function baseColor(sh, defs) {
    const f = String(sh.fill || "").trim();
    const m = /^url\(#([^)]+)\)$/.exec(f);
    if (!m) return /^#[0-9a-f]{3,6}$/i.test(f) ? f : "#cccccc";
    const d = defs[m[1]];
    return !d ? "#cccccc" : d.kind === "rainbow" ? "#ffa14a" : d.kind === "glitter" ? "#ffd66b" : d.base;
  }
  function withM(g, M) {
    g.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
  }
  function drawShape(g, sh, defs, doFill, doStroke, soft) {
    g.save();
    withM(g, sh.M);
    if (sh.op < 1) g.globalAlpha *= sh.op;
    if (doFill) {
      const fs = fillStyle(g, sh, defs);
      if (fs) {
        g.fillStyle = fs;
        g.fill(sh.path);
      }
    }
    if (doStroke && sh.sw > 0) {
      g.strokeStyle = soft ? soft.col : sh.stroke;
      g.lineWidth = soft ? sh.sw * soft.w : sh.sw;
      g.lineCap = sh.cap;
      g.lineJoin = sh.join;
      g.stroke(sh.path);
    }
    g.restore();
  }
  /** 조각 하나를 그림 (도안 좌표계 — 호출하는 쪽이 도안→픽셀 변환을 걸어 둠)
   *  layer: "all" | "fill" (대표색 계산용: 색+크레파스만)
   *  soft: {w, col} — Clay 2.0: 도안 테두리(안내선)만 얇고 부드러운 색으로 (아이 크레파스·눈·입은 그대로) */
  function drawPiece(g, pc, art, layer = "all", soft = null) {
    const defs = art.model.defs;
    if (pc.kind === "part") {
      const sh = pc.sh;
      if (layer !== "crayon") drawShape(g, sh, defs, true, false);
      if (layer === "fill") return;
      const im = art.imgs[sh.fb];
      const pp = art.paint[sh.fb];
      if (im && pp) {
        g.save();
        withM(g, sh.M);
        g.clip(sh.path);
        g.drawImage(im, pp.x, pp.y, pp.w, pp.h);
        g.restore();
      }
      if (layer === "crayon") return;
      drawShape(g, sh, defs, false, true, soft);
      if (pc.baked.length) {
        g.save();
        const T = g.getTransform();
        withM(g, sh.M);
        g.clip(sh.path);
        g.setTransform(T);
        for (const d of pc.baked) drawShape(g, d, defs, true, true);
        g.restore();
      }
      return;
    }
    for (const sh of pc.shs) drawShape(g, sh, defs, true, true);
  }

  /* ---------- 그림판(atlas): 조각마다 칸 하나, 한 장 512px 이하 ---------- */
  const ATLAS_MAX = 512;
  const PADU = 6; // 칸 둘레 여유 (도안 단위: 테두리 반 + 둥근 모서리)
  function packAtlas(pieces, scale) {
    const W = ATLAS_MAX;
    let x = 12, y = 2, rowH = 10; // 왼쪽 위 8×8 은 흰 칸(옆면용)
    const out = [];
    const order = pieces.map((p, i) => i).sort((a, b) => pieces[b].bb.y1 - pieces[b].bb.y0 - (pieces[a].bb.y1 - pieces[a].bb.y0));
    for (const i of order) {
      const b = pieces[i].bb;
      const w = Math.ceil((b.x1 - b.x0 + PADU * 2) * scale) + 2, h = Math.ceil((b.y1 - b.y0 + PADU * 2) * scale) + 2;
      if (w > W - 4) return null;
      if (x + w > W - 2) {
        x = 2;
        y += rowH + 2;
        rowH = 0;
      }
      out[i] = { x: x + 1, y: y + 1, w: w - 2, h: h - 2, ox: b.x0 - PADU, oy: b.y0 - PADU, s: scale };
      x += w;
      rowH = Math.max(rowH, h);
    }
    const H = y + rowH + 2;
    return H <= ATLAS_MAX ? { regs: out, H: Math.ceil(H / 4) * 4 } : null;
  }
  const loadImg = (src) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  const SAFE_IMG = /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/;
  function cleanPaint(pt) {
    const out = {};
    if (!pt || typeof pt !== "object") return out;
    for (const [k, v] of Object.entries(pt)) {
      if (!/^\d{1,3}$/.test(k) || !v || typeof v !== "object") continue;
      if (typeof v.src !== "string" || !SAFE_IMG.test(v.src) || v.src.length > 2e6) continue;
      const nums = ["x", "y", "w", "h"].map((q) => +v[q]);
      if (!nums.every(Number.isFinite) || nums[2] <= 0 || nums[3] <= 0 || nums[2] > 400 || nums[3] > 400) continue;
      out[k] = { x: nums[0], y: nums[1], w: nums[2], h: nums[3], src: v.src };
    }
    return out;
  }
  function shadeRegion(g, r, pc) {
    // 2.5D 용 입체 음영 (앱 2D 동물원의 zShG/zShB 와 같은 값) — 그려진 곳에만
    const back = /^l[24]$/.test(pc.group);
    const b = pc.bb, s = r.s;
    const x0 = r.x + (b.x0 - r.ox) * s, y0 = r.y + (b.y0 - r.oy) * s, w = (b.x1 - b.x0) * s, h = (b.y1 - b.y0) * s;
    const R = Math.max(w, h) * 0.78;
    const gr = g.createRadialGradient(x0 + w * 0.3, y0 + h * 0.2, 0, x0 + w * 0.38, y0 + h * 0.3, R);
    if (back) {
      gr.addColorStop(0, "rgba(255,255,255,.25)");
      gr.addColorStop(0.3, "rgba(26,16,64,.14)");
      gr.addColorStop(1, "rgba(26,16,64,.42)");
    } else {
      gr.addColorStop(0, "rgba(255,255,255,.55)");
      gr.addColorStop(0.22, "rgba(255,255,255,.16)");
      gr.addColorStop(0.5, "rgba(26,16,64,0)");
      gr.addColorStop(0.82, "rgba(26,16,64,.16)");
      gr.addColorStop(1, "rgba(26,16,64,.32)");
    }
    g.save();
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = gr;
    g.fillRect(r.x, r.y, r.w, r.h);
    g.restore();
  }
  /** 조각을 20px 로 작게 그려 평균색 + 덮인 정도 */
  function avgOf(gt, pc, art, layer) {
    const b = pc.bb, s = 20 / Math.max(b.x1 - b.x0, b.y1 - b.y0, 1);
    gt.setTransform(1, 0, 0, 1, 0, 0);
    gt.clearRect(0, 0, 20, 20);
    gt.setTransform(s, 0, 0, s, -b.x0 * s, -b.y0 * s);
    drawPiece(gt, pc, art, layer);
    try {
      const d = gt.getImageData(0, 0, 20, 20).data;
      let R = 0, G = 0, B = 0, A = 0;
      for (let k = 0; k < d.length; k += 4) {
        const a = d[k + 3] / 255;
        R += d[k] * a; G += d[k + 1] * a; B += d[k + 2] * a; A += a;
      }
      if (A < 0.5) return null;
      return { col: "#" + [R, G, B].map((v) => Math.round(v / A).toString(16).padStart(2, "0")).join(""), cover: A };
    } catch (e) {
      return null;
    }
  }
  let artSeq = 0;
  /** 그림 한 장 준비: {id, tid, svg, paint, label, from} → art */
  async function buildArt(src) {
    const model = parseArt(src.svg, src.tid);
    if (!model) return null;
    const paint = cleanPaint(src.paint);
    const imgs = {};
    await Promise.all(Object.entries(paint).map(async ([k, v]) => (imgs[k] = await loadImg(v.src))));
    const art = { key: "a" + ++artSeq, id: src.id, tid: src.tid, label: src.label || "", from: src.from, model, paint, imgs };
    let pack = null;
    for (const s of [4, 3.5, 3, 2.6, 2.2, 1.8, 1.4, 1]) if ((pack = packAtlas(model.pieces, s))) break;
    if (!pack) return null;
    art.regs = pack.regs;
    art.AW = ATLAS_MAX;
    art.AH = pack.H;
    const mk = () => {
      const c = document.createElement("canvas");
      c.width = art.AW;
      c.height = art.AH;
      return c;
    };
    const cC = mk(), cF = mk(); // cC: 점토 3D 앞면(배경은 테두리색) / cF: 2.5D(투명 배경 + 음영)
    const gC = cC.getContext("2d"), gF = cF.getContext("2d");
    gC.fillStyle = "#fff";
    gC.fillRect(0, 0, 10, 10);
    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = 20;
    const gt = tmp.getContext("2d", { willReadFrequently: true });
    model.pieces.forEach((pc, i) => {
      const r = art.regs[i];
      gC.fillStyle = INK;
      gC.fillRect(r.x, r.y, r.w, r.h);
      for (const [g, isF] of [[gC, false], [gF, true]]) {
        g.save();
        g.beginPath();
        g.rect(r.x, r.y, r.w, r.h);
        g.clip();
        g.setTransform(r.s, 0, 0, r.s, r.x - r.ox * r.s, r.y - r.oy * r.s);
        drawPiece(g, pc, art);
        g.restore();
        if (isF && (pc.kind === "part" || pc.kind === "mini")) shadeRegion(g, r, pc);
      }
      // 대표색(옆면): 칠한 색(무늬는 평균). 색을 안 칠하고(흰색) 크레파스로 많이 칠했으면 크레파스 평균
      let col = INK;
      if (pc.kind === "part" || pc.kind === "mini") {
        const fillAvg = avgOf(gt, pc, art, "fill"), cr = pc.kind === "part" ? avgOf(gt, pc, art, "crayon") : null;
        col = (fillAvg && fillAvg.col) || baseColor(pc.sh, model.defs);
        const area = fillAvg ? fillAvg.cover : 1;
        if (cr && isWhite(baseColor(pc.sh, model.defs)) && cr.cover > area * 0.3) col = cr.col;
      }
      pc.side = col;
    });
    art.atlasC = cC;
    art.atlasF = cF;
    return art;
  }
  /** 그림 한 장 작은 미리보기 (그림 고르기 칸) */
  function thumb(art, size = 96) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const s = size / 200;
    g.setTransform(s, 0, 0, s, 0, (size - 170 * s) / 2);
    for (const pc of art.model.pieces) drawPiece(g, pc, art);
    return c;
  }
  /* ---- lab/zoo/clay2.js: Clay 2.0 굽기(볼록 노멀맵·접합부 그림자) ---- */
  const hexRgb = (h) => {
    const s = String(h || "#cccccc").replace("#", "");
    const v = s.length === 3 ? s.split("").map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
    return v.map((x) => (Number.isFinite(x) ? x : 204));
  };
  const rgbHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mixHex = (a, b, t) => {
    const A = hexRgb(a), B = hexRgb(b);
    return rgbHex(A.map((v, i) => v + (B[i] - v) * t));
  };

  /** 부위 하나의 입체 치수 (geometry 와 굽기가 같은 값을 써야 함)
   *  bs: 둥근 모서리가 바깥으로 나오는 폭, bt: 앞뒤 둥근 두께, off: 앞면 = 모양 + off (테두리 바깥 일부를 둥근 모서리가 덮음) */
  function bevel2(pc) {
    const bw = pc.bb.x1 - pc.bb.x0, bh = pc.bb.y1 - pc.bb.y0, md = Math.min(bw, bh);
    const bs = Math.max(0.4, Math.min(3.4, md * 0.17));
    const half = (pc.sh.sw || 0) / 2;
    const shrink = Math.max(0, Math.min(bs * 0.5, 1.2, half - 0.3));
    return { bs, off: Math.max(0, half - shrink), bt: Math.min(pc.th * 0.44, 5.5) };
  }
  const EDGE_TILT = 0.85; // 볼록 면 가장자리 기울기(라디안, ≈49°) — 둥근 모서리 노멀이 여기서 이어짐

  /* ---------- 작은 도우미 ---------- */
  function cv(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    return c;
  }
  /** 조각 모양(채움 + 앞면 테두리 폭)을 그리기 — 변환은 호출하는 쪽 */
  function shapeMask(g, pc, strokeW) {
    const sh = pc.sh;
    g.save();
    g.transform(sh.M[0], sh.M[1], sh.M[2], sh.M[3], sh.M[4], sh.M[5]);
    g.fill(sh.path);
    if (strokeW > 0.05) {
      g.lineWidth = strokeW;
      g.lineJoin = "round";
      g.lineCap = "round";
      g.stroke(sh.path);
    }
    g.restore();
  }
  function boxBlur(a, w, h, r, passes) {
    if (r < 1) return a;
    let src = a, tmp = new Float32Array(a.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < h; y++) {
        let acc = 0;
        const row = y * w;
        for (let x = -r; x <= r; x++) acc += src[row + Math.max(0, Math.min(w - 1, x))];
        for (let x = 0; x < w; x++) {
          tmp[row + x] = acc / (2 * r + 1);
          acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
        }
      }
      const out = new Float32Array(a.length);
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
        for (let y = 0; y < h; y++) {
          out[y * w + x] = acc / (2 * r + 1);
          acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
        }
      }
      src = out;
    }
    return src;
  }
  const bil = (A, w, h, x, y) => {
    x = Math.max(0, Math.min(w - 1.001, x));
    y = Math.max(0, Math.min(h - 1.001, y));
    const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
    return (A[i] * (1 - fx) + A[i + 1] * fx) * (1 - fy) + (A[i + w] * (1 - fx) + A[i + w + 1] * fx) * fy;
  };

  /* 점토 결: 64×64 이어지는 부드러운 잡음 높이 (한 번만) */
  let grainH = null;
  function grainField() {
    if (grainH) return grainH;
    const N = 64, small = 16, s = new Float32Array(small * small);
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < s.length; i++) s[i] = rnd();
    const h = new Float32Array(N * N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const fx = (x / N) * small, fy = (y / N) * small, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const at = (i, j) => s[((j + small) % small) * small + ((i + small) % small)];
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        h[y * N + x] = (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
      }
    // 잔 결 섞기
    for (let i = 0; i < h.length; i++) h[i] = h[i] * 0.8 + rnd() * 0.2;
    grainH = { h: boxBlur(h, N, N, 1, 1), N };
    return grainH;
  }

  /**
   * 그림 한 장 굽기. layout()(앞뒤 깊이·두께) 다음에 불러야 함.
   * @returns {{colorC: HTMLCanvasElement, normalC: HTMLCanvasElement, ms: number}}
   */
  function bakeClay2(art, opt = {}) {
    const t0 = performance.now();
    const AW = art.AW, AH = art.AH, pcs = art.model.pieces;
    const grain = opt.grain == null ? 1 : opt.grain;
    const bulge = opt.bulge || 0.85; // 1 = 반구, 작을수록 납작
    const maxXY = Math.sin(EDGE_TILT);
    const colorC = cv(AW, AH), g = colorC.getContext("2d", { willReadFrequently: true });
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 10, 10);
    const nimg = g.createImageData(AW, AH), nd = nimg.data;
    for (let i = 0; i < nd.length; i += 4) {
      nd[i] = 128; nd[i + 1] = 128; nd[i + 2] = 255; nd[i + 3] = 255;
    }
    const maskC = cv(AW, AH), gm = maskC.getContext("2d", { willReadFrequently: true });
    const CMAX = 52;
    const coarse = cv(CMAX + 2, CMAX + 2), gc = coarse.getContext("2d", { willReadFrequently: true });
    const GF = grainField();
    const gAmp = [0, 0.05, 0.1][grain] || 0;

    pcs.forEach((pc, i) => {
      const r = art.regs[i];
      if (!r) return;
      const side = pc.side || "#cccccc";
      // 1) 색: 바탕 = 부위색을 조금 어둡게 (테두리 바깥이 보여도 검은 띠가 아니게), 안내선 = 얇고 부드러운 색
      g.save();
      g.beginPath();
      g.rect(r.x, r.y, r.w, r.h);
      g.clip();
      g.fillStyle = pc.kind === "part" ? mixHex(side, INK, 0.28) : pc.kind === "tube" ? INK : side;
      g.fillRect(r.x, r.y, r.w, r.h);
      g.setTransform(r.s, 0, 0, r.s, r.x - r.ox * r.s, r.y - r.oy * r.s);
      drawPiece(g, pc, art, "all", pc.kind === "part" ? { w: 0.52, col: mixHex(INK, side, 0.36) } : null);
      g.restore();
      if (pc.kind !== "part" && pc.kind !== "mini") return;

      // 2) 작은 격자에서 모양·부풀린 높이·접합부 그림자
      const k = Math.min(1, CMAX / Math.max(r.w, r.h));
      const cw = Math.max(4, Math.ceil(r.w * k)), ch = Math.max(4, Math.ceil(r.h * k));
      const cs = r.s * k; // 도안 1단위 → 작은 격자 칸
      const off = pc.c2 ? pc.c2.off : (pc.sh.sw || 0) / 2;
      gc.setTransform(1, 0, 0, 1, 0, 0);
      gc.clearRect(0, 0, coarse.width, coarse.height);
      gc.setTransform(cs, 0, 0, cs, -r.ox * cs, -r.oy * cs);
      gc.fillStyle = gc.strokeStyle = "#000";
      shapeMask(gc, pc, off * 2);
      let d = gc.getImageData(0, 0, cw, ch).data;
      const M = new Uint8Array(cw * ch);
      for (let j = 0; j < cw * ch; j++) M[j] = d[j * 4 + 3] > 110 ? 1 : 0;
      for (let x = 0; x < cw; x++) M[x] = M[(ch - 1) * cw + x] = 0;
      for (let y = 0; y < ch; y++) M[y * cw] = M[y * cw + cw - 1] = 0;
      // 풍선 높이: ∇²φ = −1 (가장자리 0), 과완화 반복
      const phi = new Float32Array(cw * ch);
      const iters = 30 + 2 * Math.max(cw, ch), w = 1.88;
      for (let it = 0; it < iters; it++)
        for (let y = 1; y < ch - 1; y++)
          for (let x = 1; x < cw - 1; x++) {
            const j = y * cw + x;
            if (!M[j]) continue;
            const v = (phi[j - 1] + phi[j + 1] + phi[j - cw] + phi[j + cw] + 1) * 0.25;
            phi[j] += w * (v - phi[j]);
          }
      const hgt = new Float32Array(cw * ch);
      for (let j = 0; j < hgt.length; j++) hgt[j] = M[j] ? 2 * Math.sqrt(Math.max(0, phi[j])) * bulge : 0;
      // 기울기 → 노멀(xy). 바깥 칸은 안쪽 값으로 채워 경계를 부드럽게
      const NX = new Float32Array(cw * ch), NY = new Float32Array(cw * ch), has = new Uint8Array(cw * ch);
      for (let y = 1; y < ch - 1; y++)
        for (let x = 1; x < cw - 1; x++) {
          const j = y * cw + x;
          if (!M[j]) continue;
          const dx = (hgt[j + 1] - hgt[j - 1]) / 2, dy = (hgt[j + cw] - hgt[j - cw]) / 2;
          let nx = -dx, ny = dy; // y: 그림판 아래 = 화면 아래 → 위쪽(+v) 성분은 +dh/dy(아래)
          const l = Math.hypot(nx, ny, 1);
          nx /= l; ny /= l;
          const q = Math.hypot(nx, ny);
          if (q > maxXY) {
            nx *= maxXY / q;
            ny *= maxXY / q;
          }
          NX[j] = nx; NY[j] = ny; has[j] = 1;
        }
      for (let pass = 0; pass < 3; pass++) {
        const add = [];
        for (let y = 0; y < ch; y++)
          for (let x = 0; x < cw; x++) {
            const j = y * cw + x;
            if (has[j]) continue;
            let sx = 0, sy = 0, c = 0;
            for (const o of [-1, 1, -cw, cw]) {
              const q = j + o;
              if (q < 0 || q >= cw * ch || (o === -1 && x === 0) || (o === 1 && x === cw - 1)) continue;
              if (has[q]) {
                sx += NX[q]; sy += NY[q]; c++;
              }
            }
            if (c) add.push([j, sx / c, sy / c]);
          }
        for (const [j, a, b] of add) {
          NX[j] = a; NY[j] = b; has[j] = 1;
        }
      }
      // 접합부 그림자: 이 부위보다 앞에 있고 겹치는 부위들의 모양 (두께 비례 진하기)
      gc.setTransform(1, 0, 0, 1, 0, 0);
      gc.clearRect(0, 0, coarse.width, coarse.height);
      gc.setTransform(cs, 0, 0, cs, -r.ox * cs, -r.oy * cs);
      let anyOcc = false;
      for (const q of pcs) {
        if (q === pc || (q.kind !== "part" && q.kind !== "mini") || q.front <= pc.front + 0.2) continue;
        const b = q.bb, a = pc.bb;
        if (!(b.x0 < a.x1 + 4 && a.x0 < b.x1 + 4 && b.y0 < a.y1 + 4 && a.y0 < b.y1 + 4)) continue;
        gc.globalAlpha = Math.min(1, 0.25 + q.th / 14);
        shapeMask(gc, q, q.sh.sw || 0);
        anyOcc = true;
      }
      gc.globalAlpha = 1;
      let AO = null;
      if (anyOcc) {
        d = gc.getImageData(0, 0, cw, ch).data;
        const occ = new Float32Array(cw * ch);
        for (let j = 0; j < occ.length; j++) occ[j] = d[j * 4 + 3] / 255;
        AO = boxBlur(occ, cw, ch, Math.max(1, Math.round(6 * cs)), 3);
      }

      // 3) 그림판 해상도로: 앞면 모양 안에서만 노멀·그림자 적기
      gm.setTransform(1, 0, 0, 1, 0, 0);
      gm.clearRect(r.x, r.y, r.w, r.h);
      gm.save();
      gm.beginPath();
      gm.rect(r.x, r.y, r.w, r.h);
      gm.clip();
      gm.setTransform(r.s, 0, 0, r.s, r.x - r.ox * r.s, r.y - r.oy * r.s);
      gm.fillStyle = gm.strokeStyle = "#000";
      shapeMask(gm, pc, off * 2 + 1.5); // 조금 넉넉히 (가장자리 거르기 여유)
      gm.restore();
      const md = gm.getImageData(r.x, r.y, r.w, r.h).data;
      const cimg = g.getImageData(r.x, r.y, r.w, r.h), cd = cimg.data;
      for (let py = 0; py < r.h; py++)
        for (let px = 0; px < r.w; px++) {
          const li = (py * r.w + px) * 4;
          if (md[li + 3] < 8) continue;
          const fx = (px + 0.5) * k - 0.5, fy = (py + 0.5) * k - 0.5;
          let nx = bil(NX, cw, ch, fx, fy), ny = bil(NY, cw, ch, fx, fy);
          if (gAmp) {
            const gx = (r.x + px) * 0.5, gy = (r.y + py) * 0.5, N = GF.N;
            const x0 = ((gx | 0) % N + N) % N, y0 = ((gy | 0) % N + N) % N;
            const hx = GF.h[y0 * N + ((x0 + 1) % N)] - GF.h[y0 * N + ((x0 + N - 1) % N)];
            const hy = GF.h[((y0 + 1) % N) * N + x0] - GF.h[((y0 + N - 1) % N) * N + x0];
            nx -= hx * gAmp * 3;
            ny += hy * gAmp * 3;
          }
          const q = Math.hypot(nx, ny);
          if (q > 0.92) {
            nx *= 0.92 / q;
            ny *= 0.92 / q;
          }
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const ai = ((r.y + py) * AW + r.x + px) * 4;
          nd[ai] = (nx * 0.5 + 0.5) * 255;
          nd[ai + 1] = (ny * 0.5 + 0.5) * 255;
          nd[ai + 2] = (nz * 0.5 + 0.5) * 255;
          if (AO) {
            const o = Math.min(1, bil(AO, cw, ch, fx, fy) * 1.15);
            const s = 1 - 0.62 * o;
            // 그림자는 살짝 보랏빛 (점토 사진의 그림자 색)
            cd[li] *= s * 0.97 + 0.03 * (1 - o);
            cd[li + 1] *= s;
            cd[li + 2] *= Math.min(1, s * 1.06);
          }
        }
      if (AO) g.putImageData(cimg, r.x, r.y);
    });
    const normalC = cv(AW, AH);
    normalC.getContext("2d").putImageData(nimg, 0, 0);
    return { colorC, normalC, ms: performance.now() - t0 };
  }

  /* ---- lab/zoo/clay3d.js: 조각 → 입체 ---- */
  /** 조각들의 앞면 깊이(z)와 두께 정하기 — 2D 그리는 순서 = 앞뒤 순서 */
  function layout(model, tf, v2) {
    const pcs = model.pieces, rig = model.rig, gap = 0.9;
    for (const pc of pcs) {
      pc.th = pc.kind === "eye" ? 1.2 : pc.kind === "tube" ? Math.max(1.5, pc.sh.sw) : pc.kind === "mini" ? 2.6 * Math.max(0.7, tf) : (rig.thick[pc.p] || 6) * tf;
    }
    pcs.forEach((pc, k) => {
      let f = 0;
      for (let j = 0; j < k; j++) {
        const q = pcs[j];
        if (q.bb.x0 < pc.bb.x1 && pc.bb.x0 < q.bb.x1 && q.bb.y0 < pc.bb.y1 && pc.bb.y0 < q.bb.y1) f = Math.max(f, q.front + gap);
      }
      pc.front = f;
      if (pc.kind === "eye") pc.front = Math.max(f, pc.host.front + 0.5);
    });
    const body = pcs.find((p) => p.p === "body" && p.group === "body") || pcs[0];
    for (const pc of pcs) {
      const gz = model.groups[pc.group] && model.groups[pc.group].z;
      if (gz === "back") pc.front = body.front - body.th * 0.62 + pc.th / 2; // 먼 다리: 몸통 뒤쪽
      else if (gz === "mid") pc.front = body.front - body.th / 2 + pc.th / 2; // 꼬리: 몸통 가운데
    }
    // 전체를 앞뒤 가운데로
    const zs = pcs.map((p) => p.front), zb = pcs.map((p) => p.front - p.th);
    const mid = (Math.max(...zs) + Math.min(...zb)) / 2;
    for (const pc of pcs) pc.front -= mid;
    for (const pc of pcs) pc.c2 = v2 && (pc.kind === "part" || pc.kind === "mini") ? bevel2(pc) : null;
  }

  function smoothSides(geo, start, count) {
    const pos = geo.attributes.position.array, nor = geo.attributes.normal.array;
    const acc = new Map();
    const key = (i) => Math.round(pos[i * 3] * 200) + "," + Math.round(pos[i * 3 + 1] * 200) + "," + Math.round(pos[i * 3 + 2] * 200);
    for (let i = start; i < start + count; i++) {
      const k = key(i);
      let a = acc.get(k);
      if (!a) acc.set(k, (a = [0, 0, 0]));
      a[0] += nor[i * 3]; a[1] += nor[i * 3 + 1]; a[2] += nor[i * 3 + 2];
    }
    for (let i = start; i < start + count; i++) {
      const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1;
      nor[i * 3] = a[0] / l; nor[i * 3 + 1] = a[1] / l; nor[i * 3 + 2] = a[2] / l;
    }
  }
  function lin(hex) {
    const c = new THREE.Color(hex);
    return [c.r, c.g, c.b];
  }
  /** 조각 하나 → 입체 (관절 중심 기준 좌표, y 는 위가 +) */
  /** Clay 2.0 눈: 작은 반짝 구슬 (검은 구슬 + 흰 광택점) — 머리 앞면 위에 반쯤 튀어나옴 */
  function eyeBead(pc) {
    const rr = Math.max(1.5, +pc.sh.el.getAttribute("r") || 5);
    const z0 = pc.host.front + rr * 0.04, dz = 0.62;
    const ball = new THREE.SphereGeometry(rr * 1.1, 14, 10).toNonIndexed();
    ball.scale(1, 1, dz);
    ball.translate(0, 0, z0);
    const hi = new THREE.SphereGeometry(rr * 0.32, 8, 6).toNonIndexed();
    hi.scale(1, 1, 0.5);
    hi.translate(rr * 0.36, rr * 0.38, z0 + rr * 1.1 * dz * 0.78);
    for (const [g, hex] of [[ball, "#251d3a"], [hi, "#ffffff"]]) {
      const c = lin(hex), n = g.attributes.position.count, cl = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        cl[i * 3] = c[0]; cl[i * 3 + 1] = c[1]; cl[i * 3 + 2] = c[2];
      }
      g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    }
    return [ball, hi];
  }
  function pieceGeo(pc, art, pv, v2) {
    if (v2 && pc.kind === "eye") return eyeBead(pc);
    const r = art.regs[art.model.pieces.indexOf(pc)];
    const wu = 5 / art.AW, wv = 1 - 5 / art.AH; // 흰 칸
    const rel = (p) => [p[0] - pv[0], -(p[1] - pv[1])];
    if (pc.kind === "tube") {
      const out = [];
      const rad = Math.max(0.8, pc.sh.sw / 2);
      for (const s of pc.sh.rsubs) {
        if (s.pts.length < 2) continue;
        const v3 = s.pts.map((p) => {
          const q = rel(p);
          return new THREE.Vector3(q[0], q[1], pc.front - pc.th / 2);
        });
        const curve = new THREE.CatmullRomCurve3(v3, false, "centripetal");
        out.push(new THREE.TubeGeometry(curve, Math.max(6, s.pts.length * 2), rad, 6, false).toNonIndexed());
        for (const e of [v3[0], v3[v3.length - 1]]) {
          const sp = new THREE.SphereGeometry(rad, 8, 6).toNonIndexed();
          sp.translate(e.x, e.y, e.z);
          out.push(sp);
        }
      }
      const col = lin(INK);
      for (const g of out) {
        g.deleteAttribute("uv");
        const n = g.attributes.position.count;
        const uv = new Float32Array(n * 2), cl = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          uv[i * 2] = wu; uv[i * 2 + 1] = wv;
          cl[i * 3] = col[0]; cl[i * 3 + 1] = col[1]; cl[i * 3 + 2] = col[2];
        }
        g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
      }
      return out;
    }
    const pts = pc.sh.rpts.map(rel);
    if (pts.length < 3) return [];
    const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
    const bw = pc.bb.x1 - pc.bb.x0, bh = pc.bb.y1 - pc.bb.y0;
    const c2 = v2 ? pc.c2 : null;
    const off = c2 ? c2.off : pc.kind === "eye" ? 0.3 : pc.sh.sw / 2; // 앞면 = 모양 + 테두리 바깥 절반
    const bs = c2 ? c2.bs : Math.min(1.1, Math.min(bw, bh) * 0.1);
    const bt = c2 ? c2.bt : Math.min(pc.th * 0.38, 2.4);
    const depth = Math.max(0.05, pc.th - 2 * bt);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelOffset: off, bevelSegments: c2 ? 3 : 2, steps: 1, curveSegments: 1 });
    geo.translate(0, 0, pc.front - (depth + bt));
    const pos = geo.attributes.position, n = pos.count;
    const uv = geo.attributes.uv.array, cl = new Float32Array(n * 3);
    const side = lin(pc.side || "#cccccc");
    const caps = geo.groups.find((q) => q.materialIndex === 0) || { start: 0, count: 0 };
    for (let i = 0; i < n; i++) {
      if (i >= caps.start && i < caps.start + caps.count) {
        const X = pos.getX(i) + pv[0], Y = pv[1] - pos.getY(i);
        uv[i * 2] = (r.x + (X - r.ox) * r.s) / art.AW;
        uv[i * 2 + 1] = 1 - (r.y + (Y - r.oy) * r.s) / art.AH;
        cl[i * 3] = cl[i * 3 + 1] = cl[i * 3 + 2] = 1;
      } else {
        uv[i * 2] = wu;
        uv[i * 2 + 1] = wv;
        cl[i * 3] = side[0]; cl[i * 3 + 1] = side[1]; cl[i * 3 + 2] = side[2];
      }
    }
    geo.attributes.uv.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    const sides = geo.groups.find((q) => q.materialIndex === 1);
    if (sides) smoothSides(geo, sides.start, sides.count);
    if (sides && c2) {
      // 둥근 모서리 노멀을 앞면 볼록 노멀(가장자리 EDGE_TILT)에서 이어지게: 앞면 쪽 → 옆 가운데로 갈수록 옆을 봄
      const nor = geo.attributes.normal.array, zf = pc.front, zb = pc.front - (depth + 2 * bt);
      for (let i = sides.start; i < sides.start + sides.count; i++) {
        const z = pos.getZ(i), uf = (zf - z) / bt, ub = (z - zb) / bt;
        const u = Math.max(0, Math.min(1, Math.min(uf, ub))), sg = uf <= ub ? 1 : -1;
        const nx = nor[i * 3], ny = nor[i * 3 + 1], l = Math.hypot(nx, ny) || 1;
        const A = EDGE_TILT + (Math.PI / 2 - EDGE_TILT) * u, sa = Math.sin(A);
        nor[i * 3] = (nx / l) * sa;
        nor[i * 3 + 1] = (ny / l) * sa;
        nor[i * 3 + 2] = sg * Math.cos(A);
      }
    }
    geo.clearGroups();
    return [geo];
  }
  function merge(geos) {
    const list = geos.filter(Boolean);
    if (!list.length) return null;
    const names = ["position", "normal", "uv", "color"];
    let n = 0;
    for (const g of list) n += g.attributes.position.count;
    const out = new THREE.BufferGeometry();
    for (const nm of names) {
      const sz = nm === "uv" ? 2 : 3, arr = new Float32Array(n * sz);
      let o = 0;
      for (const g of list) {
        const a = g.attributes[nm];
        arr.set(a.array.subarray(0, a.count * sz), o);
        o += a.count * sz;
      }
      out.setAttribute(nm, new THREE.BufferAttribute(arr, sz));
    }
    for (const g of list) g.dispose();
    out.computeBoundingSphere();
    out.computeBoundingBox();
    return out;
  }
  /* ---- lab/zoo/sim.js: 자세 ---- */
  const D = Math.PI / 180;
  const ease = (t) => t * t * (3 - 2 * t);
  function pose(a, t) {
    const g = {};
    const root = { y: 0, sx: 1, sy: 1, rz: 0, ry: 0, mirror: a.faceShow };
    const tid = a.art.tid;
    const moving = !a.fly && a.state === "walk" && a.react < 0;
    const sp = Math.min(1, a.speed / 0.6);
    const ph = a.walk;
    // 돌아서기: 0→90°(옆으로 섬)에서 거울 바꾸고 다시 0°
    if (a.turn > 0) root.ry = Math.sin((1 - a.turn) * Math.PI) * 88;
    if (!a.fly) {
      const sw = Math.sin(ph) * 24 * sp;
      g.l1 = { rz: sw };
      g.l4 = { rz: sw };
      g.l2 = { rz: -sw };
      g.l3 = { rz: -sw };
      root.y = Math.abs(Math.sin(ph)) * 3.2 * sp;
      root.rz = Math.sin(ph) * 1.6 * sp;
      if (a.hopT > 0 && moving) {
        // 깡충깡충
        const hp = (ph * 0.5) % Math.PI;
        const h = Math.sin(hp);
        root.y = h * 26;
        root.sy = 1 + (h - 0.5) * 0.14;
        root.sx = 1 - (h - 0.5) * 0.1;
        g.l1 = { rz: -18 * h }; g.l2 = { rz: -18 * h }; g.l3 = { rz: 18 * h }; g.l4 = { rz: 18 * h };
      }
      g.tail = { rz: Math.sin(a.wag) * (a.react >= 0 ? 26 : 14) };
      if (a.swim) {
        g.tail = { ry: Math.sin(a.wag * 1.3) * (a.react >= 0 ? 40 : 26) };
        root.y = Math.sin(t * 2.1 + a.id) * 2.5;
        root.rz = Math.sin(t * 1.4 + a.id) * 3;
      }
      g.head = { rz: Math.sin(ph * 0.5 + 1) * 3 * sp + Math.sin(t * 0.7 + a.id) * 2 };
      if (tid === "dog") g.ear = { rz: Math.sin(ph + 0.8) * 8 * sp + Math.sin(t * 1.3 + a.id) * 3 };
      if (tid === "elephant") {
        g.trunk = { rz: Math.sin(t * 1.4 + a.id) * 10 + (a.react >= 0 ? -28 * Math.sin(Math.min(1, a.react * 2) * Math.PI * 0.5) : 0) };
        g.ear = { ry: 18 + Math.sin(t * 2.2 + a.id) * 16 };
      }
    } else {
      const f = Math.sin(a.flap);
      const open = a.react >= 0 ? 1 : 0.75;
      g.wingL = { ry: (f * 0.5 + 0.5) * 70 * open };
      g.wingR = { ry: -(f * 0.5 + 0.5) * 70 * open };
      if (tid === "bird") {
        g.wing = { rz: -14 + f * 34 * open };
        g.tail = { rz: Math.sin(a.wag) * 8 };
      }
      root.y = Math.sin(a.flap * 0.5) * 6;
      root.rz = Math.sin(t * 0.9 + a.id) * 6;
    }
    // 누르기: 꾹 찌그러졌다 → 쭉 늘며 튀어오름 → 착지 찌그러짐 → 출렁 멈춤
    if (a.react >= 0) {
      const r = a.react;
      if (r < 0.12) {
        const k = ease(r / 0.12);
        root.sy = 1 - 0.24 * k;
        root.sx = 1 + 0.16 * k;
      } else if (r < 0.52) {
        const k = (r - 0.12) / 0.4;
        root.y = Math.sin(k * Math.PI) * (a.fly ? 22 : 46);
        root.sy = 1 + 0.14 * Math.sin(Math.min(1, k * 2) * Math.PI);
        root.sx = 1 - 0.08 * Math.sin(Math.min(1, k * 2) * Math.PI);
        if (!a.fly) {
          g.l1 = { rz: -20 }; g.l2 = { rz: -14 }; g.l3 = { rz: 20 }; g.l4 = { rz: 14 };
          g.head = { rz: -10 * Math.sin(k * Math.PI) };
        }
      } else {
        const k = (r - 0.52) / 0.73;
        const w = Math.exp(-k * 4) * Math.cos(k * 18);
        root.sy = 1 - 0.16 * w;
        root.sx = 1 + 0.11 * w;
      }
    }
    const happy = a.react >= 0 && a.react < 1.1;
    const eye = happy ? 0.16 : a.blink > 0 ? Math.max(0.1, Math.abs(a.blink / 0.08 - 1)) : 1;
    return { root, g, eye, happy };
  }

  KP.CLAY2 = {
    use(T) {
      THREE = T;
    },
    RIG, U, INK, parseArt, buildArt, layout, bakeClay2, pieceGeo, merge, pose, drawPiece, thumb, mixHex,
  };
})();
