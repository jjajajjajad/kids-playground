/* 그림 그리기 — 크레용·사인펜·무지개펜·반짝이펜·도장·지우개
   - 고해상도 캔버스(종이 층 + 그림 층), 굵기 3단계, 색 14가지, 종이 4종
   - 되돌리기 최근 20번(획을 기록해 다시 그림 → 메모리 적게 씀), 다 지우기(꾹)도 되돌리기 가능
   - 💾 저장 → 내 작품(kind "draw"), 나갈 때·그리다 멈출 때 자동 임시저장 → 다시 들어오면 복원
   - 갤러리 '이어 그리기'(KP.pendingDraw) 지원 */
"use strict";
KP.game({
  id: "draw",
  icon: "🎨",
  name: "그림 그리기",
  cat: "make",
  bubble: false,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("draw", `
      .dw{flex:1;min-height:0;display:grid;gap:10px;padding:2px 12px 12px;
        --tb:clamp(50px,8.4vh,70px);--sw:clamp(38px,6.2vh,52px);--ab:clamp(50px,8vh,64px);
        grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) auto;
        grid-template-areas:"tools board pal" "sizes board acts"}
      .dw .board{grid-area:board;margin:0;min-width:0;border:4px solid #fff;box-shadow:0 7px 0 rgba(47,58,102,.13),0 0 0 2px rgba(47,58,102,.06)}
      .dw-tools{grid-area:tools;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center}
      .dw-sizes{grid-area:sizes;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center}
      .dw-pal{grid-area:pal;display:grid;grid-template-columns:repeat(2,var(--sw));gap:9px;align-content:center;justify-content:center}
      .dw-acts{grid-area:acts;display:grid;grid-template-columns:repeat(2,var(--ab));gap:9px;justify-content:center}
      .dw-tool{width:var(--tb);height:var(--tb);border-radius:20px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);
        font-size:calc(var(--tb) * .56);display:flex;align-items:center;justify-content:center;position:relative;transition:transform .15s,background .15s}
      .dw-tool .e{margin-top:-6px}
      .dw-tool::after{content:"";position:absolute;left:24%;right:24%;bottom:6px;height:7px;border-radius:4px;background:var(--c,transparent)}
      .dw-tool.sel{background:#fff3bf;box-shadow:0 0 0 4px var(--sun),0 5px 0 #d9a000;transform:scale(1.08)}
      .dw-tool:active{transform:translateY(3px)}
      .dw-size{width:var(--ab);height:var(--ab);border-radius:50%;background:#fff;box-shadow:0 4px 0 rgba(47,58,102,.14);display:flex;align-items:center;justify-content:center}
      .dw-size i{display:block;border-radius:50%;background:var(--c,#333)}
      .dw-size.sel{box-shadow:0 0 0 4px var(--sun),0 4px 0 #d9a000;background:#fff3bf}
      .dw-sw{width:var(--sw);height:var(--sw);border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.14);transition:transform .12s}
      .dw-sw.light{border-color:#e4e8f2}
      .dw-sw.sel{transform:scale(1.16);box-shadow:0 0 0 4px var(--ink),0 4px 0 rgba(0,0,0,.14)}
      .dw-sw.myPaint{position:relative;border-color:#ffe7a3}
      .dw-sw.myPaint .tag{position:absolute;right:-9px;top:-9px;font-size:calc(var(--sw) * .36);line-height:1;pointer-events:none}
      .dw-sep{grid-column:1/-1;height:3px;margin:1px 4px;border-radius:3px;background:repeating-linear-gradient(90deg,#c9d2e6 0 6px,transparent 6px 11px)}
      .dw-pal.mine3{grid-template-columns:repeat(3,var(--sw))}
      .dw-stamp{width:var(--sw);height:var(--sw);border-radius:14px;background:#fff;box-shadow:0 4px 0 rgba(0,0,0,.12);font-size:calc(var(--sw) * .7);display:flex;align-items:center;justify-content:center}
      .dw-stamp.sel{background:#fff3bf;box-shadow:0 0 0 4px var(--sun)}
      .dw-act{width:var(--ab);height:var(--ab);border-radius:18px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);font-size:calc(var(--ab) * .55);display:flex;align-items:center;justify-content:center;position:relative}
      .dw-act:active{transform:translateY(3px)}
      .dw-act.save{background:var(--cat);box-shadow:0 5px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .dw-act.off{opacity:.4}
      .dw-paperIco{width:62%;height:62%;border-radius:6px;border:3px solid #fff;box-shadow:0 0 0 2px #c9d2e6}
      .dw-shake{animation:wobble .4s}
      @media (max-aspect-ratio:1/1){
        .dw{gap:8px;padding:2px 10px 10px;--tb:min(calc((100vw - 70px) / 6),64px);--sw:min(calc((100vw - 74px) / 7),50px);--ab:min(calc((100vw - 90px) / 7),56px);
          grid-template-columns:auto 1fr;grid-template-rows:auto auto minmax(0,1fr) auto;
          grid-template-areas:"tools tools" "sizes acts" "board board" "pal pal"}
        .dw-tools{flex-direction:row;gap:8px}
        .dw-sizes{flex-direction:row;gap:6px}
        .dw-pal,.dw-pal.mine3{grid-template-columns:repeat(7,var(--sw));gap:8px}
        .dw-acts{grid-template-columns:repeat(4,var(--ab));gap:8px;justify-content:end}
      }
    `);

    const COLORS = [
      ["#ff3b30", "빨강"], ["#ff9500", "주황"], ["#ffd60a", "노랑"], ["#9be22d", "연두"], ["#1fb35a", "초록"], ["#5ac8fa", "하늘색"], ["#1e6cff", "파랑"],
      ["#8e5cf7", "보라"], ["#ff6fae", "분홍"], ["#9a5b2e", "갈색"], ["#ffd0a6", "살구색"], ["#9aa0ad", "회색"], ["#222631", "검정"], ["#ffffff", "하양"],
    ];
    const TOOLS = [
      { id: "crayon", em: "🖍️", name: "크레용" },
      { id: "marker", em: "🖊️", name: "사인펜" },
      { id: "rainbow", em: "🌈", name: "무지개 펜" },
      { id: "glitter", em: "✨", name: "반짝이 펜" },
      { id: "stamp", em: "⭐", name: "도장" },
      { id: "eraser", em: "🧽", name: "지우개" },
    ];
    const STAMPS = [
      ["⭐", "별"], ["❤️", "하트"], ["🌸", "꽃"], ["🦋", "나비"], ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"],
      ["🦖", "공룡"], ["🚗", "자동차"], ["🚀", "로켓"], ["🍓", "딸기"], ["🐠", "물고기"], ["🍦", "아이스크림"], ["🌈", "무지개"],
    ];
    const PAPERS = [
      { id: "white", name: "흰 종이", css: "#fffdf8" },
      { id: "sky", name: "하늘 종이", css: "linear-gradient(#9fd8ff,#e6f6ff 70%,#a5df8c 71%)" },
      { id: "grid", name: "모눈 종이", css: "repeating-linear-gradient(0deg,#cfe0f7 0 2px,#fff 2px 9px),#fff" },
      { id: "night", name: "밤하늘 종이", css: "linear-gradient(#1c2350,#3b4a96)" },
    ];
    const SIZES = { crayon: [9, 18, 34], marker: [6, 13, 26], rainbow: [8, 16, 30], glitter: [8, 16, 30], eraser: [20, 40, 72], stamp: [56, 90, 136] };
    const SIZE_NAMES = ["가늘게", "보통", "굵게"];
    KP.loadE(STAMPS.map((s) => s[0]));

    /* ---------- 상태 ---------- */
    const pref = Object.assign({ tool: "crayon", color: "#ff3b30", size: 1, stamp: "⭐", paper: "white", lastPen: "crayon" }, KP.store.get("draw:prefs", {}));
    const savePref = () => KP.store.set("draw:prefs", pref);

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "dw");
    const toolsEl = U.el("div", "dw-tools");
    const sizesEl = U.el("div", "dw-sizes");
    const board = U.el("div", "board dw-board");
    const palEl = U.el("div", "dw-pal");
    const actsEl = U.el("div", "dw-acts");
    const paperCv = U.el("canvas"),
      inkCv = U.el("canvas");
    board.append(paperCv, inkCv);
    wrap.append(toolsEl, sizesEl, board, palEl, actsEl);
    ctx.body.appendChild(wrap);
    const pg = paperCv.getContext("2d");
    const ig = inkCv.getContext("2d");
    const base = document.createElement("canvas");
    const bg = base.getContext("2d");

    const toolBtns = {};
    TOOLS.forEach((t) => {
      const b = U.btn(KP.E(t.em), "dw-tool");
      b.dataset.t = t.id;
      ctx.tap(b, () => selectTool(t.id, true));
      toolsEl.appendChild(b);
      toolBtns[t.id] = b;
    });
    const sizeBtns = [0, 1, 2].map((i) => {
      const b = U.btn("<i></i>", "dw-size");
      const px = [9, 17, 28][i];
      Object.assign(b.firstChild.style, { width: px + "px", height: px + "px" });
      ctx.tap(b, () => {
        pref.size = i;
        savePref();
        refresh();
        A.note(["G5", "E5", "C5"][i], { inst: "marimba", dur: 0.2, vol: 0.2 });
        U.replay(b, "pop");
        KP.voice.say(SIZE_NAMES[i]);
      });
      sizesEl.appendChild(b);
      return b;
    });
    const bUndo = U.btn(KP.E("↩️"), "dw-act");
    const bClear = U.btn(KP.E("🗑️"), "dw-act");
    const bPaper = U.btn('<span class="dw-paperIco"></span>', "dw-act");
    const bSave = U.btn(KP.E("💾"), "dw-act save");
    actsEl.append(bUndo, bClear, bPaper, bSave);

    function renderPal() {
      palEl.innerHTML = "";
      if (pref.tool === "stamp") {
        STAMPS.forEach(([em, name]) => {
          const b = U.btn(KP.E(em), "dw-stamp" + (pref.stamp === em ? " sel" : ""));
          ctx.tap(b, () => {
            pref.stamp = em;
            savePref();
            U.$$(".dw-stamp", palEl).forEach((x) => x.classList.toggle("sel", x === b));
            toolBtns.stamp.innerHTML = KP.E(em);
            U.replay(b, "jump");
            A.sfx("pop");
            KP.voice.say(name + " 도장");
          });
          palEl.appendChild(b);
        });
        return;
      }
      // 내 물감(물감 실험실에서 담은 색, 최근 6개)을 맨 앞에 🎨 표시로
      const mine = myPaints();
      palEl.classList.toggle("mine3", mine.length > 2);
      const list = mine.map((m) => [m.hex, m.n, true]).concat(COLORS);
      list.forEach(([c, name, my], i) => {
        if (mine.length && i === mine.length) palEl.appendChild(U.el("span", "dw-sep"));
        const b = U.btn(my ? '<span class="tag">' + KP.E("🎨") + "</span>" : "", "dw-sw" + (my ? " myPaint" : "") + (c === "#ffffff" || c === "#ffd0a6" ? " light" : "") + (pref.color === c && pref.tool !== "rainbow" ? " sel" : ""));
        b.style.background = c;
        ctx.tap(b, () => {
          pref.color = c;
          if (pref.tool === "eraser" || pref.tool === "rainbow") pref.tool = pref.lastPen === "rainbow" ? "crayon" : pref.lastPen || "crayon";
          savePref();
          refresh();
          U.replay(b, "jump");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.22 });
          KP.voice.say(my ? "내가 만든 " + (name || "물감") : name);
        });
        palEl.appendChild(b);
      });
    }
    function myPaints() {
      return KP.paint ? KP.paint.mine().map((m) => ({ hex: m.hex.toLowerCase(), n: m.n })).filter((m) => !COLORS.some((c) => c[0] === m.hex)).slice(0, 6) : [];
    }
    function refresh() {
      Object.entries(toolBtns).forEach(([id, b]) => {
        b.classList.toggle("sel", id === pref.tool);
        b.style.setProperty("--c", id === "crayon" || id === "marker" || id === "glitter" ? pref.color : id === "rainbow" ? "linear-gradient(90deg,red,orange,yellow,lime,cyan,blue,violet)" : "transparent");
      });
      toolBtns.stamp.innerHTML = KP.E(pref.stamp);
      sizeBtns.forEach((b, i) => {
        b.classList.toggle("sel", i === pref.size);
        b.style.setProperty("--c", pref.tool === "eraser" ? "#c9d2e6" : pref.tool === "rainbow" ? "#ff5d8f" : pref.color === "#ffffff" ? "#c9d2e6" : pref.color);
      });
      bPaper.firstChild.style.background = PAPERS.find((p) => p.id === pref.paper).css;
      renderPal();
    }
    function selectTool(id, speak) {
      const was = pref.tool;
      pref.tool = id;
      if (id !== "eraser" && id !== "stamp") pref.lastPen = id;
      savePref();
      refresh();
      U.replay(toolBtns[id], "jump");
      A.sfx("select");
      if (speak) KP.voice.say(TOOLS.find((t) => t.id === id).name + (id === "stamp" && was !== "stamp" ? "! 콩콩 찍어 봐요" : ""));
    }

    /* ---------- 캔버스 크기 ---------- */
    let W = 0,
      H = 0,
      D = 1;
    function fit() {
      const r = board.getBoundingClientRect();
      const w = Math.round(r.width - 8),
        h = Math.round(r.height - 8); // 테두리 4px 제외
      if (w < 20 || h < 20) return false;
      if (w === W && h === H) return true;
      const old = W ? flatInk() : null;
      W = w;
      H = h;
      D = Math.min(window.devicePixelRatio || 1, 2);
      [paperCv, inkCv, base].forEach((c) => {
        c.width = Math.round(W * D);
        c.height = Math.round(H * D);
      });
      drawPaper();
      bg.setTransform(1, 0, 0, 1, 0, 0);
      bg.clearRect(0, 0, base.width, base.height);
      if (old) drawContain(bg, old, base.width, base.height);
      ops = [];
      renderInk();
      return true;
    }
    function drawContain(g, img, cw, ch) {
      const iw = img.naturalWidth || img.width,
        ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const s = Math.min(cw / iw, ch / ih);
      g.drawImage(img, (cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s);
    }
    addEventListener("resize", () => {
      if (ctx._active) requestAnimationFrame(fit);
    });

    /* ---------- 종이 ---------- */
    function drawPaper() {
      const g = pg;
      g.setTransform(D, 0, 0, D, 0, 0);
      const p = pref.paper;
      if (p === "white") {
        g.fillStyle = "#fffdf8";
        g.fillRect(0, 0, W, H);
      } else if (p === "sky") {
        const gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, "#9fd8ff");
        gr.addColorStop(0.75, "#e9f7ff");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
        g.fillStyle = "#a5df8c";
        g.beginPath();
        g.moveTo(0, H * 0.82);
        for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.82 + Math.sin(x / 70) * 8);
        g.lineTo(W, H);
        g.lineTo(0, H);
        g.fill();
        g.fillStyle = "rgba(255,255,255,.85)";
        [[0.18, 0.16, 1], [0.72, 0.1, 0.8]].forEach(([fx, fy, s]) => {
          const x = W * fx,
            y = H * fy,
            r = Math.min(W, H) * 0.05 * s;
          [[0, 0, 1], [r, -r * 0.4, 1.2], [r * 2.1, 0, 0.9]].forEach(([dx, dy, k]) => {
            g.beginPath();
            g.arc(x + dx, y + dy, r * k, 0, 6.28);
            g.fill();
          });
        });
      } else if (p === "grid") {
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, W, H);
        const step = Math.max(24, Math.round(Math.min(W, H) / 16));
        g.lineWidth = 1;
        for (let x = step; x < W; x += step) {
          g.strokeStyle = (x / step) % 5 ? "#dce8f8" : "#bcd1ef";
          g.beginPath();
          g.moveTo(x + 0.5, 0);
          g.lineTo(x + 0.5, H);
          g.stroke();
        }
        for (let y = step; y < H; y += step) {
          g.strokeStyle = (y / step) % 5 ? "#dce8f8" : "#bcd1ef";
          g.beginPath();
          g.moveTo(0, y + 0.5);
          g.lineTo(W, y + 0.5);
          g.stroke();
        }
      } else {
        const gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, "#161d48");
        gr.addColorStop(1, "#3b4a96");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
        const r = rng(7);
        for (let i = 0; i < (W * H) / 5000; i++) {
          g.fillStyle = "rgba(255,255,255," + (0.3 + r() * 0.6) + ")";
          g.beginPath();
          g.arc(r() * W, r() * H * 0.9, 0.6 + r() * 1.6, 0, 6.28);
          g.fill();
        }
      }
    }

    /* ---------- 붓 ---------- */
    function rng(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    // 크레용 질감: 색마다 고정된 '종이 결' 무늬 (조금씩 비고 밝기가 다른 점들)
    const crayonPat = {};
    function crayonPattern(color) {
      if (crayonPat[color]) return crayonPat[color];
      const c = document.createElement("canvas");
      c.width = c.height = 96;
      const x = c.getContext("2d");
      const r = rng(parseInt(color.slice(1), 16) || 3);
      const n = parseInt(color.slice(1), 16);
      const R = (n >> 16) & 255,
        G = (n >> 8) & 255,
        B = n & 255;
      const im = x.createImageData(96, 96);
      for (let i = 0; i < 96 * 96; i++) {
        const v = r();
        // 결 방향으로 살짝 늘어진 빈 자리
        const hole = v < 0.17 || (i % 96 > 0 && im.data[(i - 1) * 4 + 3] === 0 && v < 0.45);
        const k = 0.86 + r() * 0.22;
        im.data[i * 4] = Math.min(255, R * k);
        im.data[i * 4 + 1] = Math.min(255, G * k);
        im.data[i * 4 + 2] = Math.min(255, B * k);
        im.data[i * 4 + 3] = hole ? 0 : 255;
      }
      x.putImageData(im, 0, 0);
      return (crayonPat[color] = ig.createPattern(c, "repeat"));
    }
    function quad(g, a, c, b) {
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.quadraticCurveTo(c[0], c[1], b[0], b[1]);
      g.stroke();
    }
    /** 획 하나를 그리는 붓 (실시간·되돌리기 다시 그리기 모두 같은 결과) */
    function painter(op, g) {
      const r = rng(op.seed);
      let dist = 0;
      const P = op.pts;
      function seg(a, c, b) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.01;
        g.save();
        g.lineCap = "round";
        g.lineJoin = "round";
        const w = op.w;
        switch (op.tool) {
          case "marker":
            g.strokeStyle = op.color;
            g.lineWidth = w;
            quad(g, a, c, b);
            break;
          case "rainbow":
            g.strokeStyle = "hsl(" + ((op.hue + dist * 0.55) % 360) + ",92%,57%)";
            g.lineWidth = w;
            quad(g, a, c, b);
            break;
          case "crayon":
            g.strokeStyle = crayonPattern(op.color);
            g.lineWidth = w * (0.82 + r() * 0.3);
            quad(g, a, c, b);
            // 가장자리 거친 알갱이
            g.fillStyle = crayonPattern(op.color);
            for (let i = 0, n = Math.ceil(len / 4); i < n; i++) {
              const t = r(),
                ang = r() * 6.28,
                rr = w * (0.45 + r() * 0.2);
              g.fillRect(a[0] + (b[0] - a[0]) * t + Math.cos(ang) * rr, a[1] + (b[1] - a[1]) * t + Math.sin(ang) * rr, 1.6, 1.6);
            }
            break;
          case "glitter": {
            g.strokeStyle = op.color;
            g.globalAlpha = 0.92;
            g.lineWidth = w;
            quad(g, a, c, b);
            g.globalAlpha = 1;
            const nx = -(b[1] - a[1]) / len,
              ny = (b[0] - a[0]) / len;
            for (let i = 0, n = Math.ceil(len / 5); i < n; i++) {
              const t = r(),
                off = (r() - 0.5) * w * 1.15,
                x = a[0] + (b[0] - a[0]) * t + nx * off,
                y = a[1] + (b[1] - a[1]) * t + ny * off;
              const s = (0.8 + r() * 1.8) * Math.max(1, w / 14);
              const pick = r();
              g.fillStyle = pick < 0.45 ? "#ffffff" : pick < 0.75 ? "#fff3a0" : "hsl(" + Math.floor(r() * 360) + ",100%,85%)";
              if (r() < 0.3) {
                // 작은 반짝 별
                g.beginPath();
                for (let k = 0; k < 8; k++) {
                  const rad = k % 2 ? s * 0.45 : s * 2.2,
                    an = (k * Math.PI) / 4;
                  g.lineTo(x + Math.cos(an) * rad, y + Math.sin(an) * rad);
                }
                g.fill();
              } else {
                g.beginPath();
                g.arc(x, y, s * 0.7, 0, 6.28);
                g.fill();
              }
            }
            break;
          }
          case "eraser":
            g.globalCompositeOperation = "destination-out";
            g.strokeStyle = "#000";
            g.lineWidth = w;
            quad(g, a, c, b);
            break;
        }
        g.restore();
        dist += len;
      }
      function dot(x, y) {
        g.save();
        if (op.tool === "eraser") g.globalCompositeOperation = "destination-out";
        g.fillStyle =
          op.tool === "crayon" ? crayonPattern(op.color) : op.tool === "rainbow" ? "hsl(" + (op.hue % 360) + ",92%,57%)" : op.tool === "eraser" ? "#000" : op.color;
        g.beginPath();
        g.arc(x, y, op.w / 2, 0, 6.28);
        g.fill();
        g.restore();
        if (op.tool === "glitter") seg([x - 0.5, y], [x, y], [x + 0.5, y]);
      }
      const pt = (i) => [P[2 * i], P[2 * i + 1]];
      const mid = (i, j) => [(P[2 * i] + P[2 * j]) / 2, (P[2 * i + 1] + P[2 * j + 1]) / 2];
      return {
        point(i) {
          if (op.tool === "stamp") {
            KP.drawE(g, op.stamp, P[2 * i], P[2 * i + 1], op.w, (r() - 0.5) * 0.5);
            return;
          }
          if (i === 0) return dot(P[0], P[1]);
          seg(i === 1 ? pt(0) : mid(i - 2, i - 1), pt(i - 1), mid(i - 1, i));
        },
        end() {
          const n = P.length / 2;
          if (op.tool === "stamp" || n < 2) return;
          const m = mid(n - 2, n - 1),
            l = pt(n - 1);
          seg(m, l, l);
        },
        get dist() {
          return dist;
        },
      };
    }

    /* ---------- 기록 · 되돌리기 ---------- */
    let ops = [];
    function replay(op, g) {
      if (op.tool === "clear") {
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, g.canvas.width, g.canvas.height);
        g.restore();
        return;
      }
      const p = painter(op, g);
      for (let i = 0; i < op.pts.length / 2; i++) p.point(i);
      p.end();
    }
    function renderInk() {
      ig.setTransform(1, 0, 0, 1, 0, 0);
      ig.globalCompositeOperation = "source-over";
      ig.clearRect(0, 0, inkCv.width, inkCv.height);
      ig.drawImage(base, 0, 0);
      ig.setTransform(D, 0, 0, D, 0, 0);
      ops.forEach((op) => replay(op, ig));
      updateUndo();
    }
    function commit(op) {
      ops.push(op);
      if (ops.length > 20) {
        bg.setTransform(D, 0, 0, D, 0, 0);
        replay(ops.shift(), bg);
      }
      changed();
    }
    function updateUndo() {
      bUndo.classList.toggle("off", !ops.length);
    }
    let unsaved = false,
      draftDirty = false,
      draftT = 0;
    function changed() {
      unsaved = true;
      draftDirty = true;
      updateUndo();
      ctx.cancel(draftT);
      draftT = ctx.after(1500, saveDraft);
    }
    function flatInk() {
      const c = document.createElement("canvas");
      c.width = inkCv.width;
      c.height = inkCv.height;
      c.getContext("2d").drawImage(inkCv, 0, 0);
      return c;
    }
    function isEmpty() {
      const c = document.createElement("canvas");
      c.width = 80;
      c.height = 60;
      const x = c.getContext("2d");
      x.drawImage(inkCv, 0, 0, 80, 60);
      const d = x.getImageData(0, 0, 80, 60).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 6) return false;
      return true;
    }
    /** 종이 + 그림 → jpeg (긴 변 1000px 이하) */
    function flatJpeg() {
      const s = Math.min(1, 1000 / Math.max(inkCv.width, inkCv.height));
      const c = document.createElement("canvas");
      c.width = Math.round(inkCv.width * s);
      c.height = Math.round(inkCv.height * s);
      const x = c.getContext("2d");
      x.drawImage(paperCv, 0, 0, c.width, c.height);
      x.drawImage(inkCv, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.85);
    }
    function inkPng() {
      const s = Math.min(1, 1600 / Math.max(inkCv.width, inkCv.height));
      const c = document.createElement("canvas");
      c.width = Math.round(inkCv.width * s);
      c.height = Math.round(inkCv.height * s);
      c.getContext("2d").drawImage(inkCv, 0, 0, c.width, c.height);
      return c.toDataURL("image/png");
    }
    /** 임시저장 (그리던 그림 → 다시 들어오면 복원) */
    function saveDraft() {
      if (!draftDirty || !W) return;
      draftDirty = false;
      if (isEmpty()) {
        KP.db.del("photos", "draw-draft");
        return;
      }
      KP.db.put("photos", { id: "draw-draft", kind: "draft", img: flatJpeg(), ink: inkPng(), paper: pref.paper, t: Date.now() });
    }
    ctx.saveDraft = saveDraft;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && ctx._active) saveDraft();
    });
    addEventListener("pagehide", () => ctx._active && saveDraft());

    function loadInto(src, cb) {
      const im = new Image();
      im.onload = () => {
        bg.setTransform(1, 0, 0, 1, 0, 0);
        bg.clearRect(0, 0, base.width, base.height);
        drawContain(bg, im, base.width, base.height);
        ops = [];
        renderInk();
        cb && cb(true);
      };
      im.onerror = () => cb && cb(false);
      im.src = src;
    }
    ctx.loadInto = loadInto;

    /* ---------- 그리기 ---------- */
    let active = null,
      hue = U.rand(360),
      sndAt = 0,
      sndStep = 0;
    const pos = (e) => {
      const r = inkCv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    function sound(op, moved) {
      sndAt += moved;
      const every = { crayon: 26, marker: 34, rainbow: 46, glitter: 34, eraser: 30, stamp: 1 }[op.tool];
      if (sndAt < every) return;
      sndAt = 0;
      sndStep++;
      switch (op.tool) {
        case "crayon":
          A.noise({ dur: 0.07, vol: 0.05, bp: 2600 + Math.random() * 1400, q: 0.9 });
          break;
        case "marker":
          A.noise({ dur: 0.06, vol: 0.025, bp: 5200, q: 1.5 });
          break;
        case "rainbow":
          A.note(["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6"][sndStep % 8], { inst: "bell", dur: 0.3, vol: 0.06 });
          break;
        case "glitter":
          A.note(A.hz("C6") * Math.pow(2, U.rand(12) / 12), { inst: "bell", dur: 0.25, vol: 0.05 });
          break;
        case "eraser":
          A.noise({ dur: 0.08, vol: 0.05, lp: 900 });
          break;
      }
    }
    inkCv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (active || !W) return;
      try {
        inkCv.setPointerCapture(e.pointerId);
      } catch (_) {}
      const [x, y] = pos(e);
      const op = { tool: pref.tool, color: pref.color, w: SIZES[pref.tool][pref.size], pts: [x, y], seed: (Math.random() * 2e9) | 0, hue };
      if (op.tool === "stamp") op.stamp = pref.stamp;
      ig.setTransform(D, 0, 0, D, 0, 0);
      active = { id: e.pointerId, op, p: painter(op, ig) };
      active.p.point(0);
      if (op.tool === "stamp") {
        A.sfx("pop");
        A.note(U.pick(["C5", "E5", "G5", "C6"]), { inst: "marimba", dur: 0.2, vol: 0.15, when: 0.03 });
      } else sound(op, 999);
      if (!ctx.drewOnce) {
        ctx.drewOnce = true;
        ctx.hint(null);
      }
    });
    inkCv.addEventListener("pointermove", (e) => {
      if (!active || e.pointerId !== active.id) return;
      e.preventDefault();
      const op = active.op,
        P = op.pts;
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of list.length ? list : [e]) {
        const [x, y] = pos(ev);
        const n = P.length / 2;
        const d = Math.hypot(x - P[2 * n - 2], y - P[2 * n - 1]);
        const need = op.tool === "stamp" ? op.w * 0.95 : 1.6;
        if (d < need) continue;
        P.push(x, y);
        active.p.point(n);
        if (op.tool === "stamp") {
          A.sfx("pop");
        } else sound(op, d);
      }
    });
    function end(e) {
      if (!active || e.pointerId !== active.id) return;
      const { op, p } = active;
      p.end();
      if (op.tool === "rainbow") hue = (op.hue + p.dist * 0.55) % 360;
      active = null;
      commit(op);
    }
    inkCv.addEventListener("pointerup", end);
    inkCv.addEventListener("pointercancel", end);

    /* ---------- 버튼 ---------- */
    ctx.tap(bUndo, () => {
      if (active) return;
      if (!ops.length) {
        U.replay(bUndo, "wrong");
        A.sfx("bad");
        KP.voice.say("더 되돌릴 수 없어요");
        return;
      }
      ops.pop();
      renderInk();
      changed();
      U.replay(bUndo, "wig");
      A.sfx("slide");
    });
    KP.hold(
      bClear,
      900,
      () => {
        commit({ tool: "clear" });
        renderInk();
        A.sfx("whoosh");
        U.replay(board, "dw-shake");
        KP.voice.say("깨끗해졌어요! 새로 그려 봐요");
      },
      () => {
        A.sfx("tick");
        KP.voice.say("꾹 누르고 있어요");
      }
    );
    ctx.tap(bPaper, () => {
      const i = PAPERS.findIndex((p) => p.id === pref.paper);
      const p = PAPERS[(i + 1) % PAPERS.length];
      pref.paper = p.id;
      savePref();
      drawPaper();
      refresh();
      draftDirty = true;
      unsaved = true;
      ctx.cancel(draftT);
      draftT = ctx.after(1500, saveDraft);
      U.replay(bPaper, "jump");
      A.sfx("slide");
      KP.voice.say(p.name);
    });
    ctx.tap(bSave, async () => {
      if (bSave.dataset.busy || active) return;
      if (isEmpty()) {
        ctx.miss(bSave, "먼저 그림을 그려 봐요!");
        return;
      }
      if (!unsaved) {
        U.replay(bSave, "wig");
        KP.voice.say("벌써 내 작품에 저장했어요!");
        return;
      }
      bSave.dataset.busy = "1";
      const img = flatJpeg();
      const d = new Date();
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "draw", img, t: Date.now(), date: d.getMonth() + 1 + "월 " + d.getDate() + "일" });
      flyAway(img, board);
      if (ok) {
        unsaved = false;
        KP.toast("🖼️ 내 작품에 저장했어요!");
        A.sfx("sticker");
        delete bSave.dataset.busy; // 기다리는 중에 나가도 버튼이 잠기지 않게
        ctx.after(900, async () => {
          await ctx.win({ msg: "내 작품에 저장했어요!" });
        });
      } else {
        delete bSave.dataset.busy;
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
      }
    });
    /** 저장한 그림이 홈(갤러리) 쪽으로 날아가는 연출 */
    function flyAway(img, fromEl) {
      const a = fromEl.getBoundingClientRect();
      const home = ctx.root.querySelector(".bar .home");
      const b = home ? home.getBoundingClientRect() : { left: 0, top: 0, width: 40, height: 40 };
      const f = U.el("img");
      f.src = img;
      Object.assign(f.style, {
        position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", objectFit: "contain",
        zIndex: 90, borderRadius: "18px", background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,.25)", pointerEvents: "none",
        transition: "transform .9s cubic-bezier(.5,-0.35,.6,1), opacity .9s", transformOrigin: "center",
      });
      document.body.appendChild(f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          f.style.transform =
            "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.06) rotate(25deg)";
          f.style.opacity = "0.5";
        })
      );
      setTimeout(() => {
        f.remove();
        if (home) U.replay(home, "bump");
      }, 950);
    }

    ctx.fit = fit;
    ctx.refresh = refresh;
    ctx.setPaper = (p) => {
      pref.paper = p;
      savePref();
      drawPaper();
      refresh();
    };
    ctx.markLoaded = (dirty, draft = false) => {
      unsaved = dirty;
      draftDirty = draft;
    };
    refresh();
  },
  start(ctx) {
    ctx.refresh();
    const go = () => {
      if (!ctx._active) return;
      if (!ctx.fit()) return requestAnimationFrame(go);
      const pend = KP.pendingDraw;
      if (pend) {
        KP.pendingDraw = null;
        ctx.setPaper("white");
        ctx.loadInto(pend.img, () => {
          ctx.markLoaded(false, true); // 이어 그리기: 임시저장은 하고, 그대로 다시 저장해 중복 작품이 생기지는 않게
          ctx.saveDraft();
        });
        KP.voice.say("이어서 그려 봐요!");
      } else if (!ctx.loadedOnce) {
        KP.db.get("photos", "draw-draft").then((dr) => {
          if (dr && ctx._active) {
            if (dr.paper) ctx.setPaper(dr.paper);
            ctx.loadInto(dr.ink || dr.img, () => ctx.markLoaded(true));
            KP.voice.say("그리던 그림이에요. 이어서 그려 봐요!");
          } else KP.voice.say("손가락으로 쓱쓱 그려 봐요! 아래에서 색을 골라요.");
        });
      } else KP.voice.say("손가락으로 쓱쓱 그려 봐요!");
      ctx.loadedOnce = true;
    };
    requestAnimationFrame(go);
    if (!ctx.drewOnce) ctx.hint(() => ctx.body.querySelector(".dw-board"), "손가락으로 그림을 그려 봐요!");
  },
  stop(ctx) {
    ctx.saveDraft();
  },
});
