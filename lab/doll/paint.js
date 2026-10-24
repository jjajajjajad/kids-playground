/* =====================================================================
   색칠 화면 (시험용) — 도안 위에 크레파스·채우기(통)·지우개
   층: [채우기 층(불투명, 점토 흰색 바탕)] → [크레파스 층(투명)] → [도안 선(맨 위, 칠해지지 않음)]
   좌표: 모든 층이 도안 크기 S×S 그대로 = 3D 텍스처 좌표 (정면 투영 UV)
   저가 기기: 크레파스는 무늬(pattern) 붓 한 번 긋기, 채우기는 미리 나눈 영역 목록을 한 번에 칠함
===================================================================== */
import { PARTS } from "./species.js";
export const PALETTE = ["#ff9aa2", "#ffb38a", "#ffe08a", "#c8e88a", "#8fd6a8", "#8fd3e8", "#9bb7ff", "#c3a6ff", "#c99a74", "#8a6a5a", "#5b5b6e", "#fdfaf4"];
export const CLAY = "#f6f1e8"; // 칠하지 않은 곳 = 흰 점토

function hexRGB(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** 크레파스 무늬: 색 + 칸마다 다른 진하기 + 작은 구멍 (종이 결) */
const patCache = new Map();
function crayonPattern(g, col) {
  if (patCache.has(col)) return g.createPattern(patCache.get(col), "repeat");
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d"), im = x.createImageData(64, 64), [r, gg, b] = hexRGB(col);
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 64 * 64; i++) {
    // 가로로 살짝 길쭉한 결
    const y = (i / 64) | 0, xx = i % 64;
    const streak = 0.5 + 0.5 * Math.sin(xx * 0.9 + Math.sin(y * 0.7) * 2 + y * 0.2);
    const a = rnd() < 0.07 ? 0 : 0.62 + 0.38 * (0.6 * rnd() + 0.4 * streak);
    im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = Math.round(a * 255);
  }
  x.putImageData(im, 0, 0);
  patCache.set(col, c);
  return g.createPattern(c, "repeat");
}

export function createPainter(host, B) {
  const S = B.S;
  const wrap = document.createElement("div");
  wrap.className = "paper";
  host.appendChild(wrap);
  const mk = (cls) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    c.className = cls;
    wrap.appendChild(c);
    return c;
  };
  const fillC = mk("lyr"), crayC = mk("lyr"), lineC = mk("lyr top");
  const fg = fillC.getContext("2d", { willReadFrequently: true }), cg = crayC.getContext("2d");
  lineC.getContext("2d").drawImage(B.lineC, 0, 0);
  let fillImg = null, fill32 = null;
  const clayRGB = hexRGB(CLAY);
  function reset() {
    fg.fillStyle = CLAY;
    fg.fillRect(0, 0, S, S);
    fillImg = fg.getImageData(0, 0, S, S);
    fill32 = new Uint32Array(fillImg.data.buffer);
    cg.clearRect(0, 0, S, S);
    changed();
  }
  const st = { tool: "crayon", color: PALETTE[0], size: 22, onChange: null };
  function changed() { if (st.onChange) st.onChange(); }

  /* ----- 채우기: 누른 칸의 영역(선 칸 포함) 을 한 번에 ----- */
  function fillAtPx(px, py, col) {
    px = Math.max(0, Math.min(S - 1, px | 0));
    py = Math.max(0, Math.min(S - 1, py | 0));
    const r = B.fillOf[py * S + px];
    if (r < 0) return false; // 도안 밖
    const [R, G, Bb] = hexRGB(col), v = (255 << 24) | (Bb << 16) | (G << 8) | R; // 리틀 엔디언 RGBA
    for (let k = B.regStart[r]; k < B.regStart[r + 1]; k++) fill32[B.regList[k]] = v;
    fg.putImageData(fillImg, 0, 0);
    changed();
    return true;
  }
  /* ----- 크레파스 / 지우개 ----- */
  function strokeSeg(pts, col, size, erase) {
    for (const g of erase ? [cg, fg] : [cg]) {
      g.save();
      g.lineCap = g.lineJoin = "round";
      g.lineWidth = erase ? size * 1.8 : size;
      if (erase && g === cg) g.globalCompositeOperation = "destination-out";
      g.strokeStyle = erase ? (g === cg ? "#000" : CLAY) : crayonPattern(g, col);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      if (pts.length === 1) g.lineTo(pts[0][0] + 0.1, pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
      g.restore();
    }
    if (erase) {
      // 지운 채우기 층을 다시 읽어 둠 (다음 채우기 때 덮어쓰지 않게)
      fillImg = fg.getImageData(0, 0, S, S);
      fill32 = new Uint32Array(fillImg.data.buffer);
    }
  }

  /* ----- 손가락 입력 ----- */
  let cur = null;
  const toPx = (e) => {
    const r = wrap.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * S, ((e.clientY - r.top) / r.height) * S];
  };
  wrap.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const p = toPx(e);
    if (st.tool === "fill") { fillAtPx(p[0], p[1], st.color); return; }
    wrap.setPointerCapture(e.pointerId);
    cur = { id: e.pointerId, last: p };
    strokeSeg([p], st.color, st.size, st.tool === "erase");
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!cur || e.pointerId !== cur.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const pts = [cur.last];
    for (const ev of evs) pts.push(toPx(ev));
    strokeSeg(pts, st.color, st.size, st.tool === "erase");
    cur.last = pts[pts.length - 1];
  });
  const end = (e) => {
    if (cur && e.pointerId === cur.id) { cur = null; changed(); }
  };
  wrap.addEventListener("pointerup", end);
  wrap.addEventListener("pointercancel", end);

  /* ----- 3D 용 텍스처 그림 만들기: 채우기 + 크레파스, 실루엣 밖은 가까운 색으로 번지기 ----- */
  function compose(size = S) {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(fillC, 0, 0);
    g.drawImage(crayC, 0, 0);
    const im = g.getImageData(0, 0, S, S), d = new Uint32Array(im.data.buffer), lab = B.label, bl = B.bleed;
    for (let i = 0; i < S * S; i++) if (!lab[i]) d[i] = d[bl[i]];
    g.putImageData(im, 0, 0);
    if (size === S) return c;
    const o = document.createElement("canvas");
    o.width = o.height = size;
    const og = o.getContext("2d");
    og.imageSmoothingQuality = "high";
    og.drawImage(c, 0, 0, size, size);
    return o;
  }
  /** 보이는 그대로 (도안 선 포함) 한 장 */
  function snapshot() {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    g.drawImage(fillC, 0, 0);
    g.drawImage(crayC, 0, 0);
    g.drawImage(lineC, 0, 0);
    return c;
  }
  // 모델 좌표 도우미 (예시 그림용)
  const X = B.X, Y = B.Y, PI = Object.fromEntries(PARTS.map((n, i) => [n, i]));
  /** 부위의 모든 영역을 한 색으로 (예시 그림: 종이 달라도 '머리'·'몸' 이름으로 칠함) */
  function fillPart(name, col) {
    const L = PI[name];
    let any = false;
    for (let r = 0; r < B.nReg; r++) {
      if (B.regPart[r] !== L) continue;
      if (B.regStart[r] === B.regStart[r + 1]) continue; // 작은 틈(다른 영역에 붙음)
      const k = B.regList[B.regStart[r]];
      fillAtPx(k % S, (k / S) | 0, col);
      any = true;
    }
    return any;
  }
  const api = {
    st, reset, compose, snapshot, wrap, clayRGB, B,
    fill: (x, y, col) => fillAtPx(X(x), Y(y), col),
    fillPart,
    /** 부위 보이는 범위 안의 비율 좌표 (u: 0 왼쪽~1 오른쪽, v: 0 아래~1 위) → 모델 좌표. 없으면 null */
    at(name, u, v) { const b = B.box[name]; return b ? [b.x0 + (b.x1 - b.x0) * u, b.y0 + (b.y1 - b.y0) * v] : null; },
    crayon: (pts, col, size = 22) => { strokeSeg(pts.map(([x, y]) => [X(x), Y(y)]), col, size * B.f, false); },
    isEmpty() {
      // 아무것도 안 칠했는지 (채우기 층이 모두 점토색이고 크레파스가 없음) — 대충 표본 검사
      const cd = cg.getImageData(0, 0, S, S).data;
      for (let i = 3; i < cd.length; i += 4 * 97) if (cd[i]) return false;
      for (let i = 0; i < fill32.length; i += 89) if ((fill32[i] & 0xffffff) !== ((clayRGB[2] << 16) | (clayRGB[1] << 8) | clayRGB[0])) return false;
      return true;
    },
  };
  reset();
  return api;
}
