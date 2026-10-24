/* 시험 3 — 8종 인형: 동물 고르기 → 그 종 도안 색칠 → 3D 배경 위를 여러 종이 섞여 걸어 다님
   흐름: 고르기(thumbs/<종>.png) → 모델(models/<종>.glb) → 굽기(정면 투영 UV·도안·영역) → 색칠 → [완성] → 3D
   다른 종(3D 에만 나옴)은 [완성] 때 512 크기로 빨리 굽고 예시 그림을 입힘
   주소 옵션(점검용): ?sp=cat (고르기 건너뜀) &ex=1~3 (예시 칠하기) &go=3d &bg=A~F &n=1|6|12 &view=walk|front|q|side|back &q=low */
import { loadGLB } from "./glb.js";
import { bake } from "./bake.js";
import { createPainter, PALETTE, CLAY } from "./paint.js";
import { examplesFor } from "./examples.js";
import { createStage } from "./stage.js";
import { SPECIES, ORDER } from "./species.js";

const $ = (s) => document.querySelector(s);
const qs = new URLSearchParams(location.search);
const low = qs.get("q") === "low";
const msg = (t) => { const m = $("#msg"); m.hidden = !t; if (t) m.textContent = t; };
const state = { bg: qs.get("bg") || "A", n: +(qs.get("n") || 6), view: qs.get("view") || "walk", sp: null };
const texSize = low ? 512 : 1024;
window.__doll = { ready: false };
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/* ---- 모델·굽기 보관 (종마다 한 번) ---- */
const models = {}, bakes = {}, painters = {}, exCache = {};
async function model(id) { return models[id] || (models[id] = await loadGLB(`models/${id}.glb`)); }
/** full: 색칠할 종(1024). 아니면 3D 에만 쓸 512 (이미 1024 로 구웠으면 그것) */
async function baked(id, full) {
  const b = bakes[id];
  if (b && (b.S === 1024 || !full)) return b;
  const B = bake(await model(id), SPECIES[id], { W: full ? 1024 : 512 });
  bakes[id] = B;
  delete exCache[id];
  return B;
}

try {
  /* ---- 동물 고르기 ---- */
  const grid = $("#pickGrid");
  for (const id of ORDER) {
    const b = document.createElement("button");
    b.dataset.sp = id;
    b.setAttribute("aria-label", SPECIES[id].name);
    const img = document.createElement("img");
    img.src = `thumbs/${id}.png`;
    img.alt = "";
    img.draggable = false;
    img.onerror = () => { img.remove(); b.textContent = SPECIES[id].name; };
    b.appendChild(img);
    b.onclick = () => choose(id);
    grid.appendChild(b);
  }
  function showPick() {
    if (stage) stage.stop();
    $("#stageView").hidden = true;
    $("#paintView").hidden = true;
    $("#pickView").hidden = false;
  }

  /* ---- 색칠 화면 ---- */
  let painter = null;
  const fit = () => {
    if (!painter) return;
    const box = $("#paperBox").getBoundingClientRect();
    const s = Math.max(100, Math.floor(Math.min(box.width, box.height) - 16));
    painter.wrap.style.width = painter.wrap.style.height = s + "px";
  };
  addEventListener("resize", fit);
  async function choose(id) {
    msg("도안 만드는 중…");
    await nextFrame();
    const t0 = performance.now();
    const B = await baked(id, true);
    window.__doll.bakeMs = B.ms;
    window.__doll.loadMs = Math.round(performance.now() - t0);
    state.sp = id;
    for (const k in painters) painters[k].wrap.hidden = k !== id;
    if (!painters[id]) {
      painters[id] = createPainter($("#paperBox"), B);
      painters[id].st.onChange = null;
    }
    painter = painters[id];
    painter.wrap.hidden = false;
    // 지금 고른 색·도구 이어 쓰기
    painter.st.color = curColor;
    painter.st.tool = curTool;
    // 예시 단추 (종마다 2~3개)
    const exRow = $("#exRow");
    exRow.querySelectorAll("button").forEach((b) => b.remove());
    examplesFor(id).forEach((ex, i) => {
      const b = document.createElement("button");
      b.textContent = String(i + 1);
      b.dataset.ex = i;
      b.setAttribute("aria-label", "예시 " + (i + 1));
      b.onclick = () => { painter.reset(); ex.draw(painter); };
      exRow.appendChild(b);
    });
    $("#pickView").hidden = true;
    $("#stageView").hidden = true;
    $("#paintView").hidden = false;
    fit();
    Object.assign(window.__doll, { B, painter });
    msg("");
  }
  let curColor = PALETTE[0], curTool = "crayon";
  const pal = $("#pal");
  PALETTE.forEach((c, i) => {
    const b = document.createElement("button");
    b.style.background = c;
    b.setAttribute("aria-label", "색 " + (i + 1));
    if (!i) b.classList.add("on");
    b.onclick = () => {
      curColor = painter.st.color = c;
      pal.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      if (curTool === "erase") setTool("crayon");
    };
    pal.appendChild(b);
  });
  function setTool(t) {
    curTool = t;
    if (painter) painter.st.tool = t;
    document.querySelectorAll("#toolRow [data-tool]").forEach((x) => x.classList.toggle("on", x.dataset.tool === t));
  }
  document.querySelectorAll("#toolRow [data-tool]").forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
  $("#clearBtn").onclick = () => painter.reset();
  $("#pickBtn").onclick = showPick;

  /* ---- 예시 그림 (3D 에서 다른 인형들이 입을 옷) ---- */
  let exHost = null;
  async function examplesOf(id) {
    if (exCache[id]) return exCache[id];
    const B = await baked(id, false);
    exHost = exHost || document.createElement("div");
    const p = createPainter(exHost, B);
    const out = examplesFor(id).map((ex) => { p.reset(); ex.draw(p); return p.compose(Math.min(texSize, B.S)); });
    p.wrap.remove();
    return (exCache[id] = out);
  }
  /** 3D 에 나올 순서: [아이 그림] → 다른 종 예시 1 → 다른 종 예시 2 → 고른 종 예시 — 6·12마리가 서로 다른 종·그림이 되게 */
  async function paintingList(mine) {
    const me = state.sp;
    const others = ORDER.filter((k) => k !== me);
    const list = [];
    if (mine) list.push({ kind: me, canvas: mine });
    const myEx = await examplesOf(me);
    if (!mine) list.push({ kind: me, canvas: myEx[0] });
    for (let r = 0; r < 2; r++)
      for (const k of others) {
        const ex = await examplesOf(k);
        list.push({ kind: k, canvas: ex[r % ex.length] });
      }
    for (let i = mine ? 0 : 1; i < myEx.length; i++) list.push({ kind: me, canvas: myEx[i] });
    return list;
  }

  /* ---- 3D ---- */
  let stage = null;
  const hud = $("#hud");
  async function go3d() {
    msg("인형 만드는 중…");
    await nextFrame();
    const t0 = performance.now();
    const mine = painter.isEmpty() ? null : painter.compose(texSize);
    if (!stage) {
      stage = await createStage($("#stage3d"), {
        low, keep: qs.has("keep"),
        onFps: (f, info) => { hud.textContent = `${f.toFixed(0)} fps · ${stage.dolls.length}마리 · 삼각형 ${info.triangles} · 그리기 ${info.calls}${low ? " · 저화질" : ""}`; },
      });
      window.__doll.stage = stage;
    }
    const list = await paintingList(mine);
    for (const it of list) stage.addKind(it.kind, await model(it.kind), bakes[it.kind]);
    window.__doll.go3dMs = Math.round(performance.now() - t0);
    $("#paintView").hidden = true;
    $("#pickView").hidden = true;
    $("#stageView").hidden = false;
    stage.setPaintings(list);
    stage.setBg(state.bg);
    stage.setCount(state.n);
    setView(state.view);
    stage.start();
    sync();
    msg("");
  }
  function back() {
    if (stage) stage.stop();
    $("#stageView").hidden = true;
    $("#paintView").hidden = false;
    fit();
  }
  function setView(v) {
    state.view = v;
    const yaw = { front: 0, q: 0.7, side: Math.PI / 2, back: Math.PI }[v];
    if (v === "walk") { stage.setCloseup(null); stage.setCount(state.n); }
    else { stage.setCount(1); stage.setCloseup({ yaw, walk: qs.get("walk") === "1" }); }
    sync();
  }
  function sync() {
    document.querySelectorAll("#bgGrp button").forEach((b) => b.classList.toggle("on", b.dataset.bg === state.bg));
    document.querySelectorAll("#nGrp button").forEach((b) => b.classList.toggle("on", +b.dataset.n === state.n && state.view === "walk"));
    document.querySelectorAll("#viewGrp button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.view));
  }
  $("#doneBtn").onclick = go3d;
  $("#backBtn").onclick = back;
  document.querySelectorAll("#bgGrp button").forEach((b) => (b.onclick = () => { state.bg = b.dataset.bg; if (state.view !== "walk") setView("walk"); stage.setBg(state.bg); sync(); }));
  document.querySelectorAll("#nGrp button").forEach((b) => (b.onclick = () => { state.n = +b.dataset.n; if (state.view !== "walk") setView("walk"); else stage.setCount(state.n); sync(); }));
  document.querySelectorAll("#viewGrp button").forEach((b) => (b.onclick = () => setView(b.dataset.v)));

  /* ---- 점검 도우미 ---- */
  /** 종 하나를 칠하지 않은 흰 점토로 정면에서 (고르기 단추 그림 만들기용) — 투명 바탕 PNG dataURL */
  async function thumb(id, size = 256) {
    const B = await baked(id, false);
    const c = document.createElement("canvas");
    c.width = c.height = B.S;
    const g = c.getContext("2d");
    g.fillStyle = CLAY;
    g.fillRect(0, 0, B.S, B.S);
    if (!stage) stage = await createStage($("#stage3d"), { keep: true });
    window.__doll.stage = stage;
    stage.addKind(id, await model(id), B);
    $("#stageView").hidden = false;
    stage.setPaintings([{ kind: id, canvas: c }]);
    stage.setCount(1);
    stage.setCloseup({ yaw: 0.0 });
    stage.resize();
    stage.renderOnce();
    const src = stage.renderer.domElement, o = document.createElement("canvas");
    o.width = o.height = size;
    // 가운데 정사각형 잘라 담기
    const s = Math.min(src.width, src.height) * 0.84;
    o.getContext("2d").drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, size, size);
    return o.toDataURL("image/png");
  }
  Object.assign(window.__doll, { go3d, back, setView, state, choose, showPick, bakes, models, examplesOf, thumb, examplesFor });

  const sp0 = qs.get("sp");
  if (sp0 && SPECIES[sp0]) {
    await choose(sp0);
    const ex = +(qs.get("ex") || 0), list = examplesFor(sp0);
    if (ex >= 1 && ex <= list.length) list[ex - 1].draw(painter);
    if (qs.get("go") === "3d") await go3d();
  } else showPick();
  msg("");
  window.__doll.ready = true;
} catch (e) {
  console.error(e);
  msg("오류: " + e.message);
  window.__doll.error = String((e && e.stack) || e);
}
