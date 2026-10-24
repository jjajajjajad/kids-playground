/* 시험 2 — 칠한 도안이 3D 점토 강아지 인형에 입혀지는 시험판
   흐름: 모델(dog.glb) → 굽기(정면 투영 UV·도안·영역) → 색칠 → [완성] → 3D 배경 위를 걷는 인형
   주소 옵션(점검용): ?ex=1~3 (예시 칠하기) &go=3d &bg=A~F &n=1|6|12 &view=walk|front|q|side|back &q=low */
import { loadGLB } from "./glb.js";
import { bake } from "./bake.js";
import { createPainter, PALETTE } from "./paint.js";
import { EXAMPLES } from "./examples.js";
import { createStage } from "./stage.js";

const $ = (s) => document.querySelector(s);
const qs = new URLSearchParams(location.search);
const low = qs.get("q") === "low";
const msg = (t) => { const m = $("#msg"); m.hidden = !t; if (t) m.textContent = t; };
const state = { bg: qs.get("bg") || "A", n: +(qs.get("n") || 6), view: qs.get("view") || "walk" };
window.__doll = { ready: false };

try {
  const t0 = performance.now();
  const model = await loadGLB("dog.glb");
  const B = bake(model);
  window.__doll.bakeMs = B.ms;
  window.__doll.loadMs = Math.round(performance.now() - t0);

  /* ---- 색칠 화면 ---- */
  const painter = createPainter($("#paperBox"), B);
  const fit = () => {
    const box = $("#paperBox").getBoundingClientRect();
    const s = Math.max(100, Math.floor(Math.min(box.width, box.height) - 16));
    painter.wrap.style.width = painter.wrap.style.height = s + "px";
  };
  addEventListener("resize", fit);
  fit();
  const pal = $("#pal");
  PALETTE.forEach((c, i) => {
    const b = document.createElement("button");
    b.style.background = c;
    b.setAttribute("aria-label", "색 " + (i + 1));
    if (!i) b.classList.add("on");
    b.onclick = () => {
      painter.st.color = c;
      pal.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      if (painter.st.tool === "erase") setTool("crayon");
    };
    pal.appendChild(b);
  });
  function setTool(t) {
    painter.st.tool = t;
    document.querySelectorAll("#toolRow [data-tool]").forEach((x) => x.classList.toggle("on", x.dataset.tool === t));
  }
  document.querySelectorAll("#toolRow [data-tool]").forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
  $("#clearBtn").onclick = () => painter.reset();
  document.querySelectorAll("#exRow [data-ex]").forEach((b) => (b.onclick = () => { painter.reset(); EXAMPLES[+b.dataset.ex].draw(painter); }));

  /* ---- 예시 그림 (3D 에서 다른 강아지들이 입을 옷) ---- */
  const texSize = low ? 512 : 1024;
  const exHost = document.createElement("div");
  const exPainter = createPainter(exHost, B);
  const exCanvases = EXAMPLES.map((ex) => { exPainter.reset(); ex.draw(exPainter); return exPainter.compose(texSize); });

  /* ---- 3D ---- */
  let stage = null;
  const hud = $("#hud");
  async function go3d() {
    msg("인형 만드는 중…");
    const mine = painter.isEmpty() ? null : painter.compose(texSize);
    const list = mine ? [mine, ...exCanvases] : exCanvases;
    $("#paintView").hidden = true;
    $("#stageView").hidden = false;
    if (!stage) {
      stage = await createStage($("#stage3d"), model, B, {
        low,
        onFps: (f, info) => { hud.textContent = `${f.toFixed(0)} fps · ${stage.dogs.length}마리 · 삼각형 ${info.triangles} · 그리기 ${info.calls}${low ? " · 저화질" : ""}`; },
      });
      window.__doll.stage = stage;
    }
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

  Object.assign(window.__doll, { B, painter, model, go3d, back, setView, state, exCanvases, EXAMPLES });
  const ex = +(qs.get("ex") || 0);
  if (ex >= 1 && ex <= EXAMPLES.length) EXAMPLES[ex - 1].draw(painter);
  msg("");
  if (qs.get("go") === "3d") await go3d();
  window.__doll.ready = true;
} catch (e) {
  console.error(e);
  msg("오류: " + e.message);
  window.__doll.error = String(e && e.stack || e);
}
