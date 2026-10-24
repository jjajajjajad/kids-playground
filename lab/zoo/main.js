/* =====================================================================
   동물원 시험판 — 화면·단추·측정 (앱과 분리: 앱 코드·설정·잠금·타이머를 건드리지 않음)
   주소 옵션: ?mode=clay|flat|both &n=1|6|12|18 &art=sample|saved &thick=0.6|1|1.5
             &shadow=0|1 &q=1|1.5|2 &freeze=1(멈춤) &seed=숫자 &front=1(정면 — 그림 맞춤 확인)
             &bg=A~F|none(기존 배경) &grain=0|1|2(점토 결) &poly=1(걷는 영역 선 보기 — 맞춤 확인용)
===================================================================== */
import { buildArt, sampleSrc, loadSavedRO, thumb, SPECIES, TPL } from "./art.js";
import { camFor, camAt, makeAnimals, step, setSeed, sound, propsFor, opts, projector, U } from "./sim.js";
import { createFlat } from "./flat25d.js";
import { BGS, BG_IDS, loadBg, bgCam } from "./bgs.js";

const $ = (s) => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const st = {
  mode: ["clay", "flat", "both"].includes(Q.get("mode")) ? Q.get("mode") : "both",
  n: [1, 6, 12, 18].includes(+Q.get("n")) ? +Q.get("n") : 6,
  art: Q.get("art") === "sample" ? "sample" : Q.get("art") === "saved" ? "saved" : "auto",
  thick: [0.6, 1, 1.5].includes(+Q.get("thick")) ? +Q.get("thick") : 1,
  shadow: Q.get("shadow") !== "0",
  q: [1, 1.5, 2].includes(+Q.get("q")) ? +Q.get("q") : Math.min(2, window.devicePixelRatio || 1),
  freeze: Q.get("freeze") === "1",
  front: Q.get("front") === "1",
  close: Q.get("close") === "1", // 1마리 가까이 (그림 맞춤 확인)
  bg: BG_IDS.includes(Q.get("bg")) || Q.get("bg") === "none" ? Q.get("bg") : "C",
  grain: [0, 1, 2].includes(+Q.get("grain")) && Q.get("grain") !== null ? +Q.get("grain") : 1,
  poly: Q.get("poly") === "1",
};
let bgInfo = null; // 지금 배경 그림 {img, grass, sky, def}
setSeed(+Q.get("seed") || 0);
opts.demo = ["walk", "hop"].includes(Q.get("demo")) ? Q.get("demo") : "";

const R = { clay: null, flat: null }; // 지금 켜진 그리기
let animals = [], arts = [], bounds = null, props = [], baseCam = null;
let saved = { ok: false, list: [] }, savedSel = new Set();
const sampleCache = new Map();
let token = 0;

/* ---------- 그림 준비 ---------- */
async function sampleArt(i) {
  const tid = SPECIES[i % 3], v = Math.floor(i / 3);
  const key = tid + v;
  if (!sampleCache.has(key)) sampleCache.set(key, buildArt(sampleSrc(tid, v)));
  return sampleCache.get(key);
}
const savedArtCache = new Map();
async function savedArt(src) {
  if (!savedArtCache.has(src.id)) savedArtCache.set(src.id, buildArt(src));
  return savedArtCache.get(src.id);
}
function useSaved() {
  return st.art !== "sample" && saved.list.length && savedSel.size;
}
async function prepareArts() {
  const out = [];
  if (useSaved()) {
    const sel = saved.list.filter((s) => savedSel.has(s.id));
    for (const s of sel.slice(0, 18)) {
      const a = await savedArt(s);
      if (a) out.push(a);
    }
  }
  if (!out.length) for (let i = 0; i < Math.min(18, Math.max(3, st.n)); i++) {
    const a = await sampleArt(i);
    if (a) out.push(a);
  }
  const sp = Q.get("sp"); // 점검용: 한 동물만 (dog|elephant|butterfly)
  if (SPECIES.includes(sp) && out.some((a) => a.tid === sp)) return out.filter((a) => a.tid === sp);
  return out;
}

/* ---------- 화면 나누기 ---------- */
function views() {
  const stage = $("#stage");
  const w = stage.clientWidth, h = stage.clientHeight;
  const both = st.mode === "both";
  const side = w >= h; // 가로 화면: 좌우, 세로 화면: 위아래
  stage.classList.toggle("split", both);
  stage.classList.toggle("stack", both && !side);
  $("#vC").hidden = st.mode === "flat";
  $("#vF").hidden = st.mode === "clay";
  const vw = both && side ? Math.floor(w / 2) : w, vh = both && !side ? Math.floor(h / 2) : h;
  return { vw, vh };
}
function layoutAll(rebuild) {
  const { vw, vh } = views();
  const cam = bgInfo ? bgCam(bgInfo.def, vw, vh) : camFor(vw / vh, st.front ? 0 : 21);
  const key = (b) => JSON.stringify([b.x0, b.x1, b.z0, b.z1, !!b.inside]);
  const changed = !bounds || key(cam.bounds) !== key(bounds);
  baseCam = cam;
  bounds = cam.bounds;
  props = bgInfo ? [] : propsFor(bounds);
  for (const r of Object.values(R)) if (r) r.resize(vw, vh, st.q);
  if (R.clay) R.clay.setProps(props, bounds);
  if (rebuild || changed) placeAnimals();
  drawPoly(vw, vh);
}
/** 점검용: 걷는 영역 선 (?poly=1) */
function drawPoly(vw, vh) {
  document.querySelectorAll(".polyCv").forEach((c) => c.remove());
  if (!st.poly || !bgInfo || !baseCam.view) return;
  const V = baseCam.view;
  for (const host of [$("#vC"), $("#vF")]) {
    if (host.hidden) continue;
    const c = document.createElement("canvas");
    c.className = "labCanvas polyCv";
    c.width = vw;
    c.height = vh;
    c.style.zIndex = 1;
    c.style.pointerEvents = "none";
    const g = c.getContext("2d");
    g.strokeStyle = "#ff2d55";
    g.lineWidth = 2;
    g.beginPath();
    bgInfo.def.poly.forEach(([u, v], i) => (i ? g.lineTo(u * V.fw - V.ox, v * V.fh - V.oy) : g.moveTo(u * V.fw - V.ox, v * V.fh - V.oy)));
    g.closePath();
    g.stroke();
    host.appendChild(c);
  }
}
function placeAnimals() {
  if (!arts.length || !bounds) return;
  // 마리 수만큼: 그림을 돌려 가며 (예시는 마리마다 다른 그림)
  const list = [];
  for (let i = 0; i < st.n; i++) list.push(arts[i % arts.length]);
  animals = makeAnimals(list, st.n, bounds);
  if (bounds.place) bounds.place(animals); // 배경 그림: 풀밭 안에 고루
  if (st.n === 1) animals[0].face = animals[0].faceShow = 1;
  if (st.close && baseCam && !bgInfo) {
    // 1마리 가까이: 동물 크기에 맞춰 화면 가득
    const a = animals[0], m = a.art.model, s = 0.01 * a.size;
    if (a.fly) a.y = a.ty = 1.1;
    const cy = a.y + (m.foot[1] - (m.bbox.y0 + m.bbox.y1) / 2) * s;
    const cx = ((m.bbox.x0 + m.bbox.x1) / 2 - m.foot[0]) * s;
    const tl = st.front ? 0 : (21 * Math.PI) / 180, d = 3.3 * a.size + 0.5;
    baseCam = { ...baseCam, target: [cx, cy, a.z], pos: [cx, cy + Math.sin(tl) * d, a.z + Math.cos(tl) * d] };
  }
  if (R.clay) R.clay.setAnimals(animals);
}

/* ---------- 그리기 켜고 끄기 (전환 때 바로 정리) ---------- */
async function applyMode() {
  const my = ++token;
  const needC = st.mode !== "flat", needF = st.mode !== "clay";
  if (!needF && R.flat) {
    R.flat.dispose();
    R.flat = null;
  }
  if (!needC && R.clay) {
    R.clay.dispose();
    R.clay = null;
  }
  if (needF && !R.flat) {
    R.flat = createFlat($("#vF"));
    R.flat.setBackdrop(bgInfo);
  }
  if (needC && !R.clay) {
    msg("점토 3D 준비 중…");
    try {
      const { createClay } = await import("./clay3d.js");
      const c = await createClay($("#vC"), { thick: st.thick, grain: st.grain, shadowSize: Math.min(screen.width, screen.height) >= 600 ? 2048 : 1024, onLost: lostC });
      if (my !== token || st.mode === "flat") {
        c.dispose();
        return;
      }
      R.clay = c;
      c.setShadows(st.shadow);
      c.setBackdrop(bgInfo);
    } catch (e) {
      msg("점토 3D 를 못 열었어요: " + (e && e.message ? e.message : e));
      console.error(e);
      return;
    }
    msg("");
  }
  layoutAll(false);
  if (R.clay) R.clay.setAnimals(animals);
  syncUI();
}
function lostC() {
  msg("3D 화면이 잠깐 끊겼어요 — 다시 여는 중");
  setTimeout(() => {
    if (R.clay && R.clay.lost) {
      R.clay.dispose();
      R.clay = null;
      applyMode();
    }
  }, 600);
}
function msg(t) {
  const m = $("#msg");
  m.textContent = t;
  m.hidden = !t;
}

/* ---------- 배경 그림 바꾸기 ---------- */
async function applyBg() {
  const my = ++bgTok;
  let info = null;
  if (st.bg !== "none") {
    try {
      info = await loadBg(st.bg);
    } catch (e) {
      msg(String(e.message || e));
      setTimeout(() => msg(""), 2500);
    }
  }
  if (my !== bgTok) return;
  bgInfo = info;
  for (const r of Object.values(R)) if (r) r.setBackdrop(bgInfo);
  bounds = null; // 세상 좌표가 바뀜 → 동물 다시 놓기
  layoutAll(true);
  syncUI();
}
let bgTok = 0;

/* ---------- 측정 ---------- */
const FT = new Float32Array(180);
let ftN = 0, ftI = 0, last = 0, hudT = 0;
function hud(now) {
  if (now - hudT < 400) return;
  hudT = now;
  const n = Math.min(ftN, FT.length);
  if (!n) return;
  const a = Array.from(FT.subarray(0, n)).sort((x, y) => x - y);
  const avg = a.reduce((s, v) => s + v, 0) / n, p95 = a[Math.floor(n * 0.95)] || avg;
  const L = ["fps " + (1000 / avg).toFixed(1) + " · 프레임 " + avg.toFixed(1) + "ms (95% " + p95.toFixed(1) + "ms)"];
  if (R.clay) {
    const s = R.clay.stats();
    L.push("점토3D 그리기 " + s.calls + " · 삼각형 " + (s.tris / 1000).toFixed(0) + "k · " + s.ms.toFixed(1) + "ms");
  }
  if (R.flat) {
    const s = R.flat.stats();
    L.push("2.5D 그리기 " + s.draws + " · " + s.ms.toFixed(1) + "ms");
  }
  L.push(st.n + "마리 · ×" + st.q + (st.shadow ? "" : " · 그림자 끔") + " · 배경 " + (bgInfo ? st.bg : "기존"));
  $("#hud").textContent = L.join("\n");
  window.__lab.last = { fps: 1000 / avg, avg, p95, clay: R.clay ? R.clay.stats() : null, flat: R.flat ? R.flat.stats() : null, n: st.n, mode: st.mode, bg: bgInfo ? st.bg : "none" };
}
let t0 = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) return;
  const dt = last ? (now - last) / 1000 : 0.016;
  if (last) {
    FT[ftI] = now - last;
    ftI = (ftI + 1) % FT.length;
    ftN++;
  }
  last = now;
  if (!bounds || !animals.length) return;
  const t = st.freeze ? 0 : (now - t0) / 1000;
  step(animals, dt, bounds, st.freeze);
  const cam = camAt(baseCam, t, st.freeze);
  if (R.clay) R.clay.render(animals, t, cam);
  if (R.flat) R.flat.render(animals, t, cam, bounds, props);
  hud(now);
}
document.addEventListener("visibilitychange", () => (last = 0));

/* ---------- 누르기 (두 화면 어느 쪽이든 같은 동물이 반응) ---------- */
function onTap(e, which) {
  sound.unlock();
  const r = R[which];
  if (!r) return;
  const b = e.currentTarget.getBoundingClientRect();
  const a = r.hit(e.clientX - b.left, e.clientY - b.top);
  if (!a) return;
  a.react = 0;
  a.heart = 0;
  sound.boing();
  sound.say(TPL[a.art.tid].cry);
}
$("#vC").addEventListener("pointerdown", (e) => onTap(e, "clay"));
$("#vF").addEventListener("pointerdown", (e) => onTap(e, "flat"));

/* ---------- 단추 ---------- */
function syncUI() {
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === st.mode));
  document.querySelectorAll("[data-n]").forEach((b) => b.classList.toggle("on", +b.dataset.n === st.n));
  document.querySelectorAll("[data-thick]").forEach((b) => b.classList.toggle("on", +b.dataset.thick === st.thick));
  $("#shadowBtn").textContent = st.shadow ? "그림자 켬" : "그림자 끔";
  $("#qBtn").textContent = "화질 ×" + st.q;
  $("#sndBtn").textContent = sound.muted ? "소리 끔" : "소리 켬";
  $("#freezeBtn").textContent = st.freeze ? "움직이기" : "멈추기";
  $("#artBtn").textContent = useSaved() ? "그림: 내 그림 " + savedSel.size : "그림: 예시";
  $("#thickGrp").classList.toggle("dim", st.mode === "flat");
  document.querySelectorAll("[data-bg]").forEach((b) => b.classList.toggle("on", b.dataset.bg === st.bg));
  $("#grainBtn").textContent = "점토 결 " + ["없음", "약하게", "보통"][st.grain];
}
document.querySelectorAll("[data-bg]").forEach((b) => b.addEventListener("click", () => {
  st.bg = b.dataset.bg;
  applyBg();
}));
$("#grainBtn").addEventListener("click", () => {
  st.grain = (st.grain + 1) % 3;
  if (R.clay) R.clay.setGrain(st.grain);
  syncUI();
});
document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
  st.mode = b.dataset.mode;
  applyMode();
}));
document.querySelectorAll("[data-n]").forEach(async (b) => b.addEventListener("click", async () => {
  st.n = +b.dataset.n;
  arts = await prepareArts();
  placeAnimals();
  syncUI();
}));
document.querySelectorAll("[data-thick]").forEach((b) => b.addEventListener("click", () => {
  st.thick = +b.dataset.thick;
  if (R.clay) R.clay.setThick(st.thick);
  syncUI();
}));
$("#shadowBtn").addEventListener("click", () => {
  st.shadow = !st.shadow;
  if (R.clay) R.clay.setShadows(st.shadow);
  syncUI();
});
$("#qBtn").addEventListener("click", () => {
  st.q = st.q >= 2 ? 1 : st.q >= 1.5 ? 2 : 1.5;
  layoutAll(false);
  syncUI();
});
$("#sndBtn").addEventListener("click", () => {
  sound.unlock();
  sound.muted = !sound.muted;
  syncUI();
});
$("#freezeBtn").addEventListener("click", () => {
  st.freeze = !st.freeze;
  syncUI();
});
$("#moreBtn").addEventListener("click", () => {
  $("#bar").classList.toggle("more");
  layoutAll(false);
});
// 그림 고르기
$("#artBtn").addEventListener("click", () => openPicker());
$("#pickClose").addEventListener("click", () => closePicker());
async function openPicker() {
  const p = $("#picker"), box = $("#pickList");
  p.hidden = false;
  box.textContent = "";
  const note = $("#pickNote");
  if (!saved.list.length) {
    note.textContent =
      (saved.note ? saved.note + ". " : "") +
      "앱의 색칠 공방에서 개·코끼리·나비를 칠해 동물원에 보내면 여기에 나와요. (아이패드에서 앱을 '홈 화면 앱'으로 쓰면 Safari 와 저장 공간이 달라 안 보일 수 있어요)" +
      (saved.other ? " 다른 동물 " + saved.other + "마리는 이 시험판에서 아직 안 써요." : "");
  } else note.textContent = "눌러서 고르기 (최대 18장). 읽기만 하고, 앱의 그림은 바꾸지 않아요." + (saved.other ? " 다른 동물 " + saved.other + "마리는 아직 안 써요." : "");
  const sampleB = document.createElement("button");
  sampleB.className = "pick" + (useSaved() ? "" : " on");
  sampleB.innerHTML = "<b>예시 그림</b><small>크레파스 낙서 포함</small>";
  sampleB.addEventListener("click", async () => {
    st.art = "sample";
    closePicker(true);
  });
  box.appendChild(sampleB);
  for (const s of saved.list) {
    const b = document.createElement("button");
    b.className = "pick" + (useSaved() && savedSel.has(s.id) ? " on" : "");
    const a = await savedArt(s);
    if (a) b.appendChild(thumb(a, 88));
    const sm = document.createElement("small");
    sm.textContent = s.label + (s.rest ? " (쉬는 중)" : "");
    b.appendChild(sm);
    b.addEventListener("click", () => {
      if (st.art === "sample") {
        st.art = "saved";
        savedSel = new Set();
      }
      if (savedSel.has(s.id)) savedSel.delete(s.id);
      else if (savedSel.size < 18) savedSel.add(s.id);
      b.classList.toggle("on", savedSel.has(s.id));
      sampleB.classList.toggle("on", !useSaved());
    });
    box.appendChild(b);
  }
}
async function closePicker(force) {
  $("#picker").hidden = true;
  arts = await prepareArts();
  placeAnimals();
  syncUI();
}

/* ---------- 시작 ---------- */
window.__lab = {
  st, R, ready: false, last: null, saved: () => saved, applyBg, BGS,
  get bounds() {
    return bounds;
  },
  get animals() {
    return animals;
  },
  /** 점검용: 동물 i 의 화면 위치 (보기 안 좌표, 대략 몸 가운데) */
  screenPos(i) {
    const a = animals[i], el = $(st.mode === "flat" ? "#vF" : "#vC");
    const P = projector(camAt(baseCam, 0, true), el.clientWidth, el.clientHeight), m = a.art.model;
    const p = P.p(a.x, a.y + (m.foot[1] - (m.bbox.y0 + m.bbox.y1) / 2) * U * a.size, a.z);
    return { x: p[0], y: p[1] };
  },
};
(async function start() {
  syncUI();
  saved = await loadSavedRO();
  if (saved.list.length) savedSel = new Set(saved.list.slice(0, 18).map((s) => s.id));
  if (st.art === "sample") savedSel = new Set();
  arts = await prepareArts();
  if (st.bg !== "none") {
    try {
      bgInfo = await loadBg(st.bg);
    } catch (e) {
      msg(String(e.message || e));
    }
  }
  await applyMode();
  layoutAll(true);
  syncUI();
  requestAnimationFrame(frame);
  window.__lab.ready = true;
})();
let rz = 0;
window.addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => layoutAll(false), 120);
});
