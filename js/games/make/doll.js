/* =====================================================================
   🧸 3D 인형 친구 — 불러오기 · 칠하기(도안 위 채우기·크레파스·지우개) · 완성 그림 만들기
   - 미리 구운 도안: assets/doll/<종>.bin(정점 UV) · <종>-map.png(부위·칠하기 영역) · <종>-lines.png(도안 선)
     (tools/doll-bake.js 가 doll-bake.js 의 bake() 로 만듦). 못 읽으면 기기에서 직접 굽기(느리지만 같은 결과)
   - 모든 그림 좌표 = 정면 직교 투영 (S×S). 아이 그림판 = 도안 = 3D 텍스처
   - 저장(동물원): KP.db "art" {kind:"zoo", tid:"doll", species, img(3D 텍스처 JPEG), thumb(정면 그림 PNG, 2D·카드용)}
===================================================================== */
"use strict";
(function () {
  const D = (KP.DOLL = KP.DOLL || {});
  const BASE = "assets/doll/";
  const CLAY = (D.CLAY = "#f6f1e8"); // 칠하지 않은 곳 = 흰 점토
  // 이름(종 설정)·울음·움직임(2D 동물원·누르기 말)
  const INFO = {
    dog: { cry: "멍멍!" }, cat: { cry: "야옹!" }, bear: { cry: "으르렁!" }, rabbit: { cry: "깡충깡충!", move: "hop" },
    pig: { cry: "꿀꿀!" }, lion: { cry: "어흥!" }, elephant: { cry: "뿌우우!" }, dino: { cry: "크아앙!" },
  };
  D.ok = (sp) => typeof sp === "string" && !!INFO[sp] && !!(D.SPECIES && D.SPECIES[sp]);
  /** 동물원용 정보 (zoo.js 의 도안 T 와 같은 모양) */
  D.tOf = (sp) => ({ name: D.SPECIES[sp].name, cry: INFO[sp].cry, move: INFO[sp].move || "walk", doll: true });
  D.thumbUrl = (sp) => BASE + "thumbs/" + sp + ".png";

  const hexRGB = (h) => {
    const n = parseInt(String(h).slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const cv = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h || w;
    return c;
  };
  const loadImg = (src) =>
    new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("그림을 못 읽었어요: " + src));
      im.src = src;
    });

  /* ---------------- 미리 구운 파일: 만들기(도구용) · 읽기 ---------------- */
  /** 영역·부위 지도 검사값 (읽은 PNG 가 만든 것과 같은지 확인 — 색 관리 등으로 값이 바뀌면 직접 굽기로) */
  function sumOf(label, fillOf, inner) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < label.length; i += 7) h = Math.imul(h ^ (label[i] * 131 + (fillOf[i] + 1) * 7 + inner[i]), 16777619) >>> 0;
    return h;
  }
  function innerOf(B) {
    // 번지기 출발 칸: 실루엣 안 + 가장자리에서 2.5칸 넘게 안쪽 (bake 와 같은 규칙)
    const W = B.S, out = new Uint8Array(W * W);
    for (let y = 0; y < W - 1; y++)
      for (let x = 0; x < W - 1; x++) {
        const i = y * W + x, a = B.label[i];
        for (const j of [i + 1, i + W]) {
          const b = B.label[j];
          if (a !== b && (!a || !b)) out[a ? i : j] = 1;
        }
      }
    const d = D.edt(out, W, W), inner = new Uint8Array(W * W);
    for (let i = 0; i < W * W; i++) inner[i] = B.label[i] && d[i] > 2.5 * B.f ? 1 : 0;
    return inner;
  }
  /** 구운 결과 → 파일 3개 (bin: ArrayBuffer, map·lines: 캔버스) — tools/doll-bake.js 가 씀 */
  D.encode = function (B, model) {
    const W = B.S, inner = B.inner || innerOf(B);
    const nv = model.POSITION.length / 3;
    const mapC = cv(W), g = mapC.getContext("2d");
    const im = g.createImageData(W, W), d = im.data;
    if (B.nReg > 32766) throw new Error("영역이 너무 많아요");
    for (let i = 0; i < W * W; i++) {
      const v = B.fillOf[i] + 1;
      d[i * 4] = B.label[i];
      d[i * 4 + 1] = v & 255;
      d[i * 4 + 2] = (inner[i] << 7) | (v >> 8);
      d[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const meta = { v: 1, S: W, nReg: B.nReg, regPart: B.regPart, nv, box: B.box, sum: sumOf(B.label, B.fillOf, inner), stats: B.stats };
    const js = new TextEncoder().encode(JSON.stringify(meta));
    const head = 8 + js.length, pad = (4 - (head % 4)) % 4;
    const buf = new ArrayBuffer(head + pad + nv * 4);
    const dv = new DataView(buf);
    dv.setUint32(0, 0x3144504b, true); // "KPD1"
    dv.setUint32(4, js.length, true);
    new Uint8Array(buf, 8, js.length).set(js);
    const uv = new Uint16Array(buf, head + pad, nv * 2);
    for (let i = 0; i < nv * 2; i++) uv[i] = Math.round(Math.max(0, Math.min(1, B.uv[i])) * 65535);
    return { bin: buf, mapC, linesC: B.lineC, meta };
  };
  async function loadPre(sp, model) {
    const spec = D.SPECIES[sp];
    const [buf, mapIm, lineIm] = await Promise.all([
      fetch(BASE + sp + ".bin").then((r) => {
        if (!r.ok) throw new Error("bin " + r.status);
        return r.arrayBuffer();
      }),
      loadImg(BASE + sp + "-map.png"),
      loadImg(BASE + sp + "-lines.png"),
    ]);
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x3144504b) throw new Error("형식이 달라요");
    const jl = dv.getUint32(4, true);
    const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jl)));
    const nv = model.POSITION.length / 3;
    if (meta.nv !== nv) throw new Error("모델과 도안이 맞지 않아요");
    const W = meta.S, head = 8 + jl, pad = (4 - (head % 4)) % 4;
    const uq = new Uint16Array(buf, head + pad, nv * 2), uv = new Float32Array(nv * 2);
    for (let i = 0; i < nv * 2; i++) uv[i] = uq[i] / 65535;
    const mc = cv(W), mg = mc.getContext("2d", { willReadFrequently: true });
    mg.drawImage(mapIm, 0, 0);
    const d = mg.getImageData(0, 0, W, W).data;
    const label = new Uint8Array(W * W), fillOf = new Int32Array(W * W), inner = new Uint8Array(W * W);
    for (let i = 0; i < W * W; i++) {
      label[i] = d[i * 4];
      fillOf[i] = (d[i * 4 + 1] | ((d[i * 4 + 2] & 127) << 8)) - 1;
      inner[i] = d[i * 4 + 2] >> 7;
    }
    if (sumOf(label, fillOf, inner) !== meta.sum) throw new Error("도안 지도 값이 달라요");
    const lineC = cv(W);
    lineC.getContext("2d").drawImage(lineIm, 0, 0);
    // 영역별 칸 목록 (CSR)
    const nReg = meta.nReg, cnt = new Int32Array(nReg + 1);
    for (let i = 0; i < W * W; i++) if (fillOf[i] >= 0) cnt[fillOf[i] + 1]++;
    for (let r = 0; r < nReg; r++) cnt[r + 1] += cnt[r];
    const list = new Int32Array(cnt[nReg]), at = cnt.slice();
    for (let i = 0; i < W * W; i++) if (fillOf[i] >= 0) list[at[fillOf[i]]++] = i;
    // 정점 부위·움직임 가중치 (빠름 — 굽기와 같은 규칙)
    const pos = model.POSITION, part = new Uint8Array(nv);
    for (let v = 0; v < nv; v++) part[v] = spec.part(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
    const f = W / 1024, K = spec.K * f, CX = spec.CX * f, OY = spec.OY * f;
    return {
      S: W, f, spec, label, lineC, fillOf, regPart: meta.regPart, nReg, regStart: cnt, regList: list, inner, uv, part,
      weights: D.makeWeights(model, part, spec), box: meta.box || {}, X: (x) => CX + x * K, Y: (y) => OY - y * K, pre: true,
    };
  }
  const cache = {};
  /** 종 하나 준비: {model, B} (한 번만 — 같은 종은 같이 씀) */
  D.load = function (sp) {
    if (!D.ok(sp)) return Promise.reject(new Error("모르는 인형: " + sp));
    if (!cache[sp])
      cache[sp] = (async () => {
        const model = await D.loadGLB(BASE + sp + ".glb");
        let B;
        try {
          B = await loadPre(sp, model);
        } catch (e) {
          // 미리 구운 파일을 못 읽으면 기기에서 직접 (저가 기기 수 초)
          console.warn("인형 도안 직접 굽기:", sp, e && e.message);
          B = D.bake(model, D.SPECIES[sp], { W: 1024 });
          B.inner = innerOf(B);
        }
        return { model, B };
      })().catch((e) => {
        delete cache[sp];
        throw e;
      });
    return cache[sp];
  };
  /** 실루엣 밖 칸 → 가장 가까운 안쪽 칸 (3D 텍스처 번지기, 종마다 한 번) */
  D.bleedOf = (B) => B.bleed || (B.bleed = D.nearestSeed(B.inner, B.S, B.S, null));
  /** 실루엣(도안 선 포함) 가리개 — 크레파스가 동물 밖으로 안 나가게, 완성 그림 오려 내기 */
  function maskOf(B) {
    if (B._mask) return B._mask;
    const W = B.S, c = cv(W), g = c.getContext("2d");
    const la = B.lineC.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, W).data;
    const im = g.createImageData(W, W), d = im.data;
    let x0 = W, y0 = W, x1 = 0, y1 = 0;
    for (let i = 0; i < W * W; i++) {
      const a = B.label[i] ? 255 : la[i * 4 + 3];
      if (!a) continue;
      d[i * 4 + 3] = a;
      const x = i % W, y = (i / W) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    g.putImageData(im, 0, 0);
    return (B._mask = { c, box: [x0, y0, x1 + 1, y1 + 1] });
  }
  /** 얼굴(눈·코·입) 3D 덧칠 그림 — size 로 줄여서 (그래픽 메모리) */
  D.faceCanvas = function (spec, size) {
    const c = cv(size);
    const g = c.getContext("2d");
    g.scale(size / 1024, size / 1024);
    D.drawFace(g, spec, "3d");
    return c;
  };

  /* =================================================================
     칠하기 — 층: [채우기(불투명, 흰 점토 바탕)] → [크레파스(투명)] → [도안 선(맨 위)]
     좌표: 모든 층이 도안 크기 S×S = 3D 텍스처 좌표
  ================================================================= */
  const patCache = new Map();
  /** 크레파스 무늬: 색 + 칸마다 다른 진하기 + 작은 구멍 (종이 결) */
  function crayonPattern(g, col) {
    if (!patCache.has(col)) {
      const c = cv(64), x = c.getContext("2d"), im = x.createImageData(64, 64), [r, gg, b] = hexRGB(col);
      let s = 12345;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 64 * 64; i++) {
        const y = (i / 64) | 0, xx = i % 64;
        const streak = 0.5 + 0.5 * Math.sin(xx * 0.9 + Math.sin(y * 0.7) * 2 + y * 0.2);
        const a = rnd() < 0.07 ? 0 : 0.62 + 0.38 * (0.6 * rnd() + 0.4 * streak);
        im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = Math.round(a * 255);
      }
      x.putImageData(im, 0, 0);
      patCache.set(col, c);
    }
    return g.createPattern(patCache.get(col), "repeat");
  }

  D.createPainter = function (host, B) {
    const S = B.S;
    const wrap = document.createElement("div");
    wrap.className = "dollPaper";
    host.appendChild(wrap);
    const mk = (cls) => {
      const c = cv(S);
      c.className = cls;
      wrap.appendChild(c);
      return c;
    };
    const fillC = mk("lyr"), crayC = mk("lyr"), lineC = mk("lyr");
    const fg = fillC.getContext("2d", { willReadFrequently: true }), cg = crayC.getContext("2d", { willReadFrequently: true });
    lineC.getContext("2d").drawImage(B.lineC, 0, 0);
    const mask = maskOf(B);
    let fillImg = null, fill32 = null;
    const clayRGB = hexRGB(CLAY), clay32 = ((255 << 24) | (clayRGB[2] << 16) | (clayRGB[1] << 8) | clayRGB[0]) >>> 0; // Uint32Array 값과 비교하려면 양수로
    const st = { tool: "brush", color: "#ff5b6e", size: 30, onChange: null, onStroke: null };
    const changed = () => st.onChange && st.onChange();
    const reread = () => {
      fillImg = fg.getImageData(0, 0, S, S);
      fill32 = new Uint32Array(fillImg.data.buffer);
    };
    /** 동물 밖은 종이색(흰색)으로 — 그림판에 베이지 네모가 보이지 않게 (bx..: 그 부분만) */
    function paperOut(bx = 0, by = 0, bw = S, bh = S) {
      fg.save();
      // destination-in 은 그린 범위 밖을 전부 지우므로, 그 부분만 잘라서(clip) 적용
      fg.beginPath();
      fg.rect(bx, by, bw, bh);
      fg.clip();
      fg.globalCompositeOperation = "destination-in";
      fg.drawImage(mask.c, bx, by, bw, bh, bx, by, bw, bh);
      fg.globalCompositeOperation = "destination-over";
      fg.fillStyle = "#ffffff";
      fg.fillRect(bx, by, bw, bh);
      fg.restore();
    }
    function reset() {
      fg.fillStyle = CLAY;
      fg.fillRect(0, 0, S, S);
      paperOut();
      reread();
      cg.clearRect(0, 0, S, S);
    }
    /* ----- 되돌리기: 두 층을 통째로 복사 (최대 3번 — 그림 한 장 4MB 라 기기 메모리 아낌) ----- */
    const undo = [];
    function save() {
      const a = cv(S), b = cv(S);
      a.getContext("2d").drawImage(fillC, 0, 0);
      b.getContext("2d").drawImage(crayC, 0, 0);
      undo.push([a, b]);
      while (undo.length > 3) undo.shift();
    }
    function back() {
      const u = undo.pop();
      if (!u) return false;
      fg.drawImage(u[0], 0, 0);
      cg.clearRect(0, 0, S, S);
      cg.drawImage(u[1], 0, 0);
      reread();
      changed();
      return true;
    }
    /* ----- 채우기: 누른 칸의 영역(선 칸 포함)을 한 번에 — 선 위·살짝 밖을 눌러도 가까운 영역 ----- */
    function regionAt(px, py) {
      const at = (x, y) => {
        x = x | 0;
        y = y | 0;
        return x < 0 || y < 0 || x >= S || y >= S ? -1 : B.fillOf[y * S + x];
      };
      let r = at(px, py);
      for (const rad of [10, 20, 32, 46]) {
        if (r >= 0) break;
        for (let k = 0; k < 12 && r < 0; k++) r = at(px + Math.cos((k / 12) * 6.283) * rad * B.f, py + Math.sin((k / 12) * 6.283) * rad * B.f);
      }
      return r;
    }
    function fillRegion(r, col) {
      const [R, G, Bb] = hexRGB(col), v = (255 << 24) | (Bb << 16) | (G << 8) | R;
      // 크레파스로 그 영역에 그린 것도 덮음 (붓기는 그 부위를 새로 칠함)
      let x0 = S, y0 = S, x1 = 0, y1 = 0;
      for (let k = B.regStart[r]; k < B.regStart[r + 1]; k++) {
        const i = B.regList[k];
        fill32[i] = v;
        const x = i % S, y = (i / S) | 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      fg.putImageData(fillImg, 0, 0);
      if (x1 >= x0) {
        const w = x1 - x0 + 1, h = y1 - y0 + 1, cd = cg.getImageData(x0, y0, w, h), c32 = new Uint32Array(cd.data.buffer);
        let any = false;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) if (c32[y * w + x] && B.fillOf[(y0 + y) * S + x0 + x] === r) { c32[y * w + x] = 0; any = true; }
        if (any) cg.putImageData(cd, x0, y0);
      }
    }
    function fillAt(px, py, col) {
      const r = regionAt(px, py);
      if (r < 0) return false;
      save();
      fillRegion(r, col);
      changed();
      return true;
    }
    /* ----- 크레파스 / 지우개 (동물 밖으로는 안 나감) ----- */
    function strokeSeg(pts, col, size, erase) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of pts) {
        x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
      }
      const pad = size * (erase ? 1 : 0.6) + 2;
      const bx = Math.max(0, Math.floor(x0 - pad)), by = Math.max(0, Math.floor(y0 - pad)), bw = Math.min(S, Math.ceil(x1 + pad)) - bx, bh = Math.min(S, Math.ceil(y1 + pad)) - by;
      if (bw <= 0 || bh <= 0) return;
      for (const g of erase ? [cg, fg] : [cg]) {
        g.save();
        g.lineCap = g.lineJoin = "round";
        g.lineWidth = erase ? size * 1.6 : size;
        if (erase && g === cg) g.globalCompositeOperation = "destination-out";
        g.strokeStyle = erase ? (g === cg ? "#000" : CLAY) : crayonPattern(g, col);
        g.beginPath();
        g.moveTo(pts[0][0], pts[0][1]);
        if (pts.length === 1) g.lineTo(pts[0][0] + 0.1, pts[0][1]);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
        g.stroke();
        g.restore();
      }
      if (!erase) {
        // 그은 곳 둘레만 동물 모양으로 오려 냄
        cg.save();
        cg.beginPath(); // destination-in 이 그 둘레 밖의 이전 획까지 지우지 않게 범위를 잘라 둠
        cg.rect(bx, by, bw, bh);
        cg.clip();
        cg.globalCompositeOperation = "destination-in";
        cg.drawImage(mask.c, bx, by, bw, bh, bx, by, bw, bh);
        cg.restore();
      } else paperOut(bx, by, bw, bh); // 지우개가 동물 밖에 점토색을 남기지 않게
    }
    let cur = null,
      fillPid = null;
    const toPx = (e) => {
      const r = wrap.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * S, ((e.clientY - r.top) / r.height) * S];
    };
    wrap.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (cur || fillPid !== null) return; // 다른 손가락·손바닥은 무시
      const p = toPx(e);
      if (st.tool === "fill") {
        fillPid = e.pointerId; // 이 손가락을 뗄 때까지 다른 손가락의 채우기는 무시
        try {
          wrap.setPointerCapture(e.pointerId); // 그림판 밖에서 떼도 끝났다는 소식을 받게
        } catch (_) {}
        const ok = fillAt(p[0], p[1], st.color);
        if (st.onStroke) st.onStroke(ok ? "fill" : "miss", e);
        return;
      }
      try {
        wrap.setPointerCapture(e.pointerId);
      } catch (_) {}
      save();
      cur = { id: e.pointerId, last: p };
      strokeSeg([p], st.color, st.size, st.tool === "erase");
      if (st.onStroke) st.onStroke("down", e);
    });
    wrap.addEventListener("pointermove", (e) => {
      if (!cur || e.pointerId !== cur.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      const pts = [cur.last];
      for (const ev of evs.length ? evs : [e]) pts.push(toPx(ev));
      strokeSeg(pts, st.color, st.size, st.tool === "erase");
      cur.last = pts[pts.length - 1];
    });
    const end = (e) => {
      if (e.pointerId === fillPid) fillPid = null;
      if (!cur || e.pointerId !== cur.id) return;
      cur = null;
      if (st.tool === "erase") reread(); // 지운 채우기 층을 다시 읽어 둠
      changed();
    };
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);
    wrap.addEventListener("lostpointercapture", end);

    /* ----- 3D 텍스처: 채우기 + 크레파스, 실루엣 밖은 가까운 색으로 번지기 ----- */
    function compose(size = S) {
      const c = cv(S), g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(fillC, 0, 0);
      g.drawImage(crayC, 0, 0);
      const im = g.getImageData(0, 0, S, S), d = new Uint32Array(im.data.buffer), lab = B.label, bl = D.bleedOf(B);
      for (let i = 0; i < S * S; i++) if (!lab[i] && bl[i] >= 0) d[i] = d[bl[i]];
      g.putImageData(im, 0, 0);
      if (size === S) return c;
      const o = cv(size), og = o.getContext("2d");
      og.imageSmoothingQuality = "high";
      og.drawImage(c, 0, 0, size, size);
      return o;
    }
    /** 보이는 그대로(도안 선 포함) 동물 모양만 오려 낸 정면 그림 (2D 동물원·카드) — 가장 긴 변 size */
    function cutout(size) {
      const [x0, y0, x1, y1] = mask.box, w = x1 - x0, h = y1 - y0, k = size / Math.max(w, h);
      const c = cv(S), g = c.getContext("2d");
      g.drawImage(fillC, 0, 0);
      g.drawImage(crayC, 0, 0);
      g.drawImage(lineC, 0, 0);
      g.globalCompositeOperation = "destination-in";
      g.drawImage(mask.c, 0, 0);
      const o = cv(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))), og = o.getContext("2d");
      og.imageSmoothingQuality = "high";
      og.drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height);
      return o;
    }
    /** 아무것도 안 칠했는지 (표본 검사) */
    function isEmpty() {
      const cd = cg.getImageData(0, 0, S, S).data;
      for (let i = 3; i < cd.length; i += 4 * 97) if (cd[i]) return false;
      for (let i = 0; i < fill32.length; i += 89) if (fill32[i] !== clay32 && B.label[i]) return false;
      return true;
    }
    /** 아직 흰 점토인 큰 영역 수 ('다 칠했다' 알림용) */
    function blank() {
      let n = 0;
      for (let r = 0; r < B.nReg; r++) {
        const a = B.regStart[r], b = B.regStart[r + 1];
        if (b - a < 1500 * B.f * B.f) continue; // 아주 작은 영역은 빼고
        const mid = B.regList[a + ((b - a) >> 1)];
        if (fill32[mid] !== clay32) continue;
        // 크레파스로만 칠한 칸도 칠한 것으로 (가운데 둘레 몇 곳의 크레파스 층 확인)
        const cd = cg.getImageData(mid % S, (mid / S) | 0, 1, 1).data;
        if (!cd[3]) n++;
      }
      return n;
    }
    /** 마법 색칠: 부위마다 다른 색 */
    function magic(colors) {
      save();
      const byPart = {};
      let k = 0;
      for (let r = 0; r < B.nReg; r++) {
        if (B.regStart[r] === B.regStart[r + 1]) continue;
        const p = B.regPart[r];
        if (!(p in byPart)) byPart[p] = colors[k++ % colors.length];
        fillRegion(r, byPart[p]);
      }
      cg.clearRect(0, 0, S, S);
      changed();
    }
    function clear() {
      save();
      reset();
      changed();
    }
    /** 칠하던 그림 보관/불러오기 (PNG dataURL 두 장) */
    function layers() {
      return { fill: fillC.toDataURL("image/png"), cray: crayC.toDataURL("image/png") };
    }
    async function setLayers(fill, cray) {
      const [a, b] = await Promise.all([fill ? loadImg(fill).catch(() => null) : null, cray ? loadImg(cray).catch(() => null) : null]);
      reset();
      if (a) fg.drawImage(a, 0, 0, S, S);
      if (b) cg.drawImage(b, 0, 0, S, S);
      reread();
    }
    reset();
    return {
      st, wrap, B, reset, compose, cutout, isEmpty, blank, magic, clear, back, layers, setLayers, box: mask.box,
      canUndo: () => undo.length > 0,
      destroy() {
        undo.length = 0;
        wrap.remove();
        for (const c of [fillC, crayC, lineC]) c.width = c.height = 1; // 메모리 바로 돌려줌 (iPad)
      },
    };
  };
})();
