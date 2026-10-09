/* =====================================================================
   그림(일러스트) — 이모지 문자를 통일된 Fluent 일러스트 SVG로 그린다.
   KP.EMAP 은 빌드 도구(tools/build.js)가 js/gen/emoji-map.js 로 생성.
   지도에 없는 문자는 기기 이모지 글자로 대체 표시된다.
===================================================================== */
"use strict";
(function (KP) {
  const MAP = () => KP.EMAP || {};
  const seg =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? new Intl.Segmenter("ko", { granularity: "grapheme" })
      : null;

  /** 문자열을 글자(그래핌) 단위로 나누기 */
  function graphemes(str) {
    if (seg) return [...seg.segment(str)].map((s) => s.segment);
    return Array.from(str);
  }
  function lookup(g) {
    const m = MAP();
    return m[g] || m[g.replace(/️/g, "")] || null;
  }
  /** 그림 파일 경로 (없으면 null) */
  KP.esrc = (ch) => {
    const f = lookup(ch);
    return f ? "assets/e/" + f + ".svg" : null;
  };
  /** 이모지가 섞인 문자열 → HTML (이모지는 <img>, 나머지는 글자 그대로) */
  KP.E = (str, cls = "") => {
    if (str == null) return "";
    let out = "";
    for (const g of graphemes(String(str))) {
      const f = lookup(g);
      if (f) out += '<img class="e ' + cls + '" src="assets/e/' + f + '.svg" alt="" draggable="false">';
      else if (/\p{Extended_Pictographic}/u.test(g)) out += '<span class="e et ' + cls + '">' + g + "</span>";
      else out += g.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
    }
    return out;
  };
  /** 이모지 하나를 담은 요소 */
  KP.Eel = (ch, cls = "") => {
    const span = document.createElement("span");
    span.className = "eb " + cls;
    span.innerHTML = KP.E(ch);
    return span;
  };

  /* ---- 저장된 SVG 정화: 그림 요소·속성만 남기고 스크립트 여지는 모두 제거 ---- */
  const OK_TAG = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "pattern", "stop"]);
  const OK_ATTR = new Set(["class", "id", "viewbox", "xmlns", "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "opacity", "fill-opacity",
    "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "d", "points", "transform", "offset", "stop-color", "stop-opacity",
    "patternunits", "patterntransform", "gradientunits", "data-p", "data-uid"]);
  KP.sanitizeSvg = (str) => {
    if (typeof str !== "string" || str.length > 300000) return "";
    try {
      const doc = new DOMParser().parseFromString(str, "image/svg+xml");
      const root = doc.documentElement;
      if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return "";
      const walk = (el) => {
        for (const c of [...el.children]) {
          if (!OK_TAG.has(c.nodeName.toLowerCase())) c.remove();
          else walk(c);
        }
        for (const a of [...el.attributes]) {
          const n = a.name.toLowerCase(),
            v = a.value;
          const bad = !OK_ATTR.has(n) || /javascript:|data:|expression|<|>/i.test(v) || (/url\(/i.test(v) && !/^url\(#[\w-]+\)$/.test(v.trim()));
          if (bad) el.removeAttribute(a.name);
        }
      };
      walk(root);
      return new XMLSerializer().serializeToString(root);
    } catch (e) {
      return "";
    }
  };

  /* ---- 캔버스용 이미지 캐시 ---- */
  const cache = new Map();
  KP.eImage = (ch) => {
    const src = KP.esrc(ch);
    if (!src) return null;
    if (cache.has(src)) return cache.get(src);
    const im = new Image();
    im.decoding = "async";
    im.src = src;
    cache.set(src, im);
    return im;
  };
  /** 여러 그림을 미리 불러오기 → Promise */
  KP.loadE = (chars) =>
    Promise.all(
      chars.map(
        (ch) =>
          new Promise((res) => {
            const im = KP.eImage(ch);
            if (!im) return res();
            if (im.complete && im.naturalWidth) return res();
            im.addEventListener("load", res, { once: true });
            im.addEventListener("error", res, { once: true });
          })
      )
    );
  /** 캔버스에 그림 그리기 (가운데 기준) */
  KP.drawE = (ctx, ch, x, y, size, rot = 0) => {
    const im = KP.eImage(ch);
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (im && im.complete && im.naturalWidth) {
      ctx.drawImage(im, -size / 2, -size / 2, size, size);
    } else {
      ctx.font = size * 0.85 + "px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, 0, size * 0.04);
    }
    ctx.restore();
  };
})(window.KP);
