/* =====================================================================
   동물원 시험판 — 그림 데이터 (앱과 분리, 앱 코드는 불러오지 않음)
   - 도안: js/games/make/zoo.js 의 개·코끼리·나비 도안을 그대로 옮김 (viewBox 0 0 200 170, 오른쪽을 봄)
   - 앱이 저장한 색칠 동물: IndexedDB "kids-playground" / "art" 를 **읽기 전용**으로만 엶
   - 그림 한 장 → 부위 조각(pieces) + 그림판(atlas, 512px 이하) — 점토 3D 와 2.5D 가 같은 그림을 씀
===================================================================== */
export const INK = "#3b3355";

/* ---------- 도안 (zoo.js 에서 복사 — 바꾸지 말 것: 저장 그림과 부위 순서가 같아야 함) ---------- */
const S = 'stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
const F = (p, tag, a, cls = "") => "<" + tag + ' class="fb ' + cls + '" data-p="' + p + '" fill="#ffffff" ' + S + " " + a + "/>";
const eye = (x, y, r = 5) =>
  '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + INK + '"/><circle cx="' + (x + 1.6) + '" cy="' + (y - 1.8) + '" r="' + r * 0.36 + '" fill="#fff"/>';
const blush = (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="6.5" ry="4" fill="#ff8fa3" opacity=".55"/>';
const line = (d, w = 4) => '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + w + '" stroke-linecap="round"/>';
const leg = (n, x, y, w, h) =>
  '<g class="leg l' + n + '">' + F("leg", "rect", 'x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(w, h) / 2.3 + '"') + "</g>";

export const TPL = {
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
};
export const SPECIES = ["dog", "elephant", "butterfly"];

/* ---------- 관절(뼈대) 정의: 도안 좌표 ----------
   group: 부위 → 관절 묶음 이름. pivot: 회전 중심. thick: 두께(도안 단위). z: "back" 은 몸통 뒤쪽(먼 다리) */
export const RIG = {
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
};

/* ---------- 작은 수학: 2D 아핀 [a,b,c,d,e,f] (x' = a x + c y + e, y' = b x + d y + f) ---------- */
const I6 = [1, 0, 0, 1, 0, 0];
export const mul = (A, B) => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
export const ap = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
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
export function parseArt(svgStr, tid) {
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
  if (rig.fly) foot = [(bodyPc.bb.x0 + bodyPc.bb.x1) / 2, (bodyPc.bb.y0 + bodyPc.bb.y1) / 2];
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
export function baseColor(sh, defs) {
  const f = String(sh.fill || "").trim();
  const m = /^url\(#([^)]+)\)$/.exec(f);
  if (!m) return /^#[0-9a-f]{3,6}$/i.test(f) ? f : "#cccccc";
  const d = defs[m[1]];
  return !d ? "#cccccc" : d.kind === "rainbow" ? "#ffa14a" : d.kind === "glitter" ? "#ffd66b" : d.base;
}
function withM(g, M) {
  g.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
}
function drawShape(g, sh, defs, doFill, doStroke) {
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
    g.strokeStyle = sh.stroke;
    g.lineWidth = sh.sw;
    g.lineCap = sh.cap;
    g.lineJoin = sh.join;
    g.stroke(sh.path);
  }
  g.restore();
}
/** 조각 하나를 그림 (도안 좌표계 — 호출하는 쪽이 도안→픽셀 변환을 걸어 둠)
 *  layer: "all" | "fill" (대표색 계산용: 색+크레파스만) */
function drawPiece(g, pc, art, layer = "all") {
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
    drawShape(g, sh, defs, false, true);
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
export const ATLAS_MAX = 512;
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
export function cleanPaint(pt) {
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
export async function buildArt(src) {
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
export function thumb(art, size = 96) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const s = size / 200;
  g.setTransform(s, 0, 0, s, 0, (size - 170 * s) / 2);
  for (const pc of art.model.pieces) drawPiece(g, pc, art);
  return c;
}

/* ---------- 내장 예시 그림 (저장된 그림이 없을 때) — 크레파스 낙서 포함 ---------- */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const PAL = ["#ff5b6e", "#ffa14a", "#ffe14d", "#4fd37b", "#3fb0ff", "#9a6bff", "#ff7eb6", "#8bd99a", "#5cc6ff", "#c88a5a", "#ffffff", "#ffd27a"];
function patDef(uid, kind, base) {
  const id = uid + "-" + kind + (base ? "-" + base.slice(1) : "");
  let html = "";
  if (kind === "rainbow")
    html = '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' + RAINBOW.map((c, i) => '<stop offset="' + (i / (RAINBOW.length - 1)) * 100 + '%" stop-color="' + c + '"/>').join("") + "</linearGradient>";
  else if (kind === "dots") html = '<pattern id="' + id + '" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="' + base + '"/><circle cx="8" cy="8" r="3.6" fill="#fff" opacity=".85"/></pattern>';
  else if (kind === "stripes") html = '<pattern id="' + id + '" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="' + base + '"/><rect width="6" height="14" fill="#fff" opacity=".55"/></pattern>';
  else html = '<pattern id="' + id + '" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#ffd66b"/></pattern>';
  return { url: "url(#" + id + ")", html };
}
/** 크레파스 느낌 획 (밀랍 질감: 굵은 선 + 작은 빈틈) */
function crayonStroke(g, pts, col, w, r) {
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = col;
  for (let k = 0; k < 3; k++) {
    g.globalAlpha = 0.55;
    g.lineWidth = w * (0.75 + k * 0.15);
    g.beginPath();
    pts.forEach((p, i) => {
      const jx = (r() - 0.5) * w * 0.35, jy = (r() - 0.5) * w * 0.35;
      i ? g.lineTo(p[0] + jx, p[1] + jy) : g.moveTo(p[0] + jx, p[1] + jy);
    });
    g.stroke();
  }
  g.restore();
}
function waxGaps(g, W, H, r) {
  g.save();
  g.globalCompositeOperation = "destination-out";
  for (let k = 0; k < (W * H) / 30; k++) {
    g.globalAlpha = 0.25 + r() * 0.4;
    g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 1.5);
  }
  g.restore();
}
/** 부위 하나 크레파스 그림 (data URL) — 앱과 같은 형식 {x,y,w,h,src}, 1단위=4px */
function crayonFor(sh, style, col, r) {
  const b = sh.lbb, PK = 4;
  const x = Math.floor(b.x0 - 3), y = Math.floor(b.y0 - 3), w = Math.ceil(b.x1 - b.x0 + 6), h = Math.ceil(b.y1 - b.y0 + 6);
  const c = document.createElement("canvas");
  c.width = w * PK;
  c.height = h * PK;
  const g = c.getContext("2d");
  const W = c.width, H = c.height;
  if (style === "zig") {
    const pts = [];
    const rows = 3 + Math.floor(r() * 2);
    for (let i = 0; i <= rows * 6; i++) pts.push([(i % 2 ? 0.2 : 0.8) * W + (r() - 0.5) * W * 0.1, H * 0.25 + (i / (rows * 6)) * H * 0.5]);
    crayonStroke(g, pts, col, 9, r);
  } else if (style === "dots") {
    for (let k = 0; k < 7; k++) {
      const cx = W * (0.2 + r() * 0.6), cy = H * (0.2 + r() * 0.6), rr = 6 + r() * 8;
      const pts = [];
      for (let a = 0; a <= 7; a += 0.5) pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      crayonStroke(g, pts, col, 8, r);
    }
  } else if (style === "edge") {
    // 경계선을 넘나드는 낙서 (잘려서 부위 안에만 보여야 함)
    const pts = [];
    for (let i = 0; i <= 10; i++) pts.push([W * (-0.1 + i * 0.12), H * (0.15 + (i % 2) * 0.7)]);
    crayonStroke(g, pts, col, 10, r);
  } else if (style === "line") {
    crayonStroke(g, [[W * 0.1, H * 0.8], [W * 0.5, H * 0.86], [W * 0.9, H * 0.8]], col, 8, r);
  } else {
    // 동그라미 낙서
    const pts = [];
    for (let a = 0; a <= 14; a += 0.35) pts.push([W * 0.5 + Math.cos(a) * W * (0.18 + a * 0.012), H * 0.5 + Math.sin(a * 1.1) * H * (0.16 + a * 0.01)]);
    crayonStroke(g, pts, col, 8, r);
  }
  waxGaps(g, W, H, r);
  return { x, y, w, h, src: c.toDataURL("image/png") };
}
/** 예시 그림 v번째 (색 조합·무늬·낙서가 조금씩 다름) */
export function sampleSrc(tid, v) {
  const t = TPL[tid];
  const r = rng(1000 * (SPECIES.indexOf(tid) + 1) + v * 7919);
  const uid = "lab" + tid + v;
  const fills = { ...t.sample };
  let defsHtml = "";
  if (v > 0) for (const k of Object.keys(fills)) if (r() < 0.6) fills[k] = PAL[Math.floor(r() * PAL.length)];
  // 무늬 하나씩 (무지개·땡땡이·줄무늬·반짝이)
  const patK = ["rainbow", "dots", "stripes", "glitter"][v % 4];
  const patPart = { dog: ["tail", "ear", "spot", "muzzle"], elephant: ["ear", "trunk", "ear", "tusk"], butterfly: ["wing2", "wing1", "wing2", "spot"] }[tid][v % 4];
  if (v % 2 === 0 || v > 2) {
    const pd = patDef(uid, patK, fills[patPart] && fills[patPart] !== "#ffffff" ? fills[patPart] : "#ff7eb6");
    defsHtml += pd.html;
    fills[patPart] = pd.url;
  }
  const svgStr = '<svg class="zSvg" data-uid="' + uid + '" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg"><defs>' + defsHtml + "</defs>" + t.svg() + "</svg>";
  const doc = new DOMParser().parseFromString(svgStr, "image/svg+xml");
  doc.querySelectorAll(".fb").forEach((e) => {
    const c = fills[e.getAttribute("data-p")];
    if (c) e.setAttribute("fill", c);
  });
  const svg = new XMLSerializer().serializeToString(doc.documentElement);
  // 크레파스: 눈 옆 점, 다리 끝 선, 경계 넘는 낙서, 몸통 낙서
  const model = parseArt(svg, tid);
  const paint = {};
  const fbs = model.pieces.filter((p) => p.kind === "part");
  const pick = (pred) => fbs.filter(pred);
  const crayCol = () => ["#e8384f", "#2f7de1", "#2ea44f", "#8e44ad", "#ff8c00", "#222a68"][Math.floor(r() * 6)];
  const plan = [];
  if (tid === "dog") plan.push([(p) => p.p === "body", v % 2 ? "dots" : "zig"], [(p) => p.p === "head", "scrib"], [(p) => p.p === "leg", "line"], [(p) => p.p === "ear", "edge"]);
  if (tid === "elephant") plan.push([(p) => p.p === "body", v % 2 ? "zig" : "scrib"], [(p) => p.p === "ear", "dots"], [(p) => p.p === "leg", "line"], [(p) => p.p === "head", "edge"]);
  if (tid === "butterfly") plan.push([(p) => p.p === "wing1", v % 2 ? "scrib" : "dots"], [(p) => p.p === "wing2", "zig"], [(p) => p.p === "body", "line"]);
  for (const [pred, style] of plan) {
    const col = crayCol();
    for (const pc of pick(pred)) if (style !== "line" || r() < 0.8) paint[pc.sh.fb] = crayonFor(pc.sh, style, col, r);
  }
  return { id: "sample-" + tid + "-" + v, tid, svg, paint, label: TPL[tid].name + " 예시 " + (v + 1), from: "sample" };
}

/* ---------- 공용 작은 그림 ---------- */
let heartC = null;
export function heartCanvas() {
  if (heartC) return heartC;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.translate(32, 34);
  g.beginPath();
  g.moveTo(0, 18);
  g.bezierCurveTo(-30, -2, -18, -26, 0, -10);
  g.bezierCurveTo(18, -26, 30, -2, 0, 18);
  g.closePath();
  g.fillStyle = "#ff5b7f";
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = "#fff";
  g.stroke();
  g.fillStyle = "rgba(255,255,255,.7)";
  g.beginPath();
  g.ellipse(-9, -8, 4, 3, -0.6, 0, 7);
  g.fill();
  heartC = c;
  return c;
}
let hillsC = null;
/** 먼 언덕 (가로 1024 × 128, 위쪽 투명) */
export function hillsCanvas() {
  if (hillsC) return hillsC;
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d");
  const band = (col, base, amp, f, ph) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, 128);
    for (let x = 0; x <= 1024; x += 16) g.lineTo(x, base - (Math.sin(x * f + ph) * 0.6 + Math.sin(x * f * 2.3 + ph * 2) * 0.4) * amp);
    g.lineTo(1024, 128);
    g.fill();
  };
  band("#b9dcf0", 60, 30, 0.009, 1);
  band("#a9d7ea", 76, 22, 0.012, 3);
  band("#a8dd85", 98, 16, 0.008, 5);
  hillsC = c;
  return c;
}

/* ---------- 앱이 저장한 색칠 동물 읽기 — 읽기 전용 ----------
   - 앱 저장소: IndexedDB "kids-playground" (판 1), 칸 "art", 동물 = {kind:"zoo", tid, svg, paint, ...}
   - 판(version)을 주지 않고 엶 → 있으면 지금 판 그대로(구조 변경 없음)
   - 저장소가 없으면 만들지 않음: databases() 로 먼저 확인 + 혹시 새로 만들어지려 하면(upgradeneeded) 즉시 취소
   - 읽기 트랜잭션은 "readonly" 만 사용, 읽고 나면 바로 닫음 (앱의 업그레이드를 막지 않게) */
const DBN = "kids-playground";
export async function loadSavedRO() {
  const out = { ok: false, list: [], note: "" };
  try {
    if (!("indexedDB" in self)) return { ...out, note: "이 브라우저는 저장소를 못 써요" };
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      if (!dbs.some((d) => d.name === DBN)) return { ...out, ok: true, note: "저장된 그림 없음" };
    }
    const db = await new Promise((res) => {
      let r;
      try {
        r = indexedDB.open(DBN);
      } catch (e) {
        return res(null);
      }
      r.onupgradeneeded = () => {
        try {
          r.transaction.abort(); // 없던 저장소가 생기지 않게
        } catch (e) {}
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
      r.onblocked = () => res(null);
    });
    if (!db) return { ...out, ok: true, note: "저장된 그림 없음" };
    db.onversionchange = () => db.close();
    let rows = [];
    try {
      if (db.objectStoreNames.contains("art")) {
        rows = await new Promise((res, rej) => {
          const t = db.transaction("art", "readonly");
          const q = t.objectStore("art").getAll();
          t.oncomplete = () => res(q.result || []);
          t.onerror = () => rej(t.error);
          t.onabort = () => rej(t.error);
        });
      }
    } finally {
      db.close();
    }
    const list = rows
      .filter((x) => x && x.kind === "zoo" && SPECIES.includes(x.tid) && typeof x.svg === "string")
      .sort((a, b) => (b.t || 0) - (a.t || 0))
      .map((x, i) => ({ id: "saved-" + String(x.id).slice(0, 40), tid: x.tid, svg: x.svg, paint: x.paint, label: TPL[x.tid].name + " " + (x.date || ""), from: "saved", rest: !!x.rest, fav: !!x.fav }));
    const other = rows.filter((x) => x && x.kind === "zoo" && !SPECIES.includes(x.tid)).length;
    return { ok: true, list, other, note: list.length ? "" : "개·코끼리·나비 그림 없음" };
  } catch (e) {
    return { ...out, note: "읽기 실패: " + (e && e.message ? e.message : e) };
  }
}
