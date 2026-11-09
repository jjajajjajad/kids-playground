/* 자동 생성 — tools/build.js 묶음. 고치려면 원본(13개)을 고치고 다시 빌드 */

/* ==== js/games/make/decal.js ==== */
/* =====================================================================
   🦋 데칼코마니
   - 가운데 세로 접는 선이 있는 종이. 왼쪽 반에 물감을 콕콕 찍거나(꾹 누르면 방울이 커짐) 문질러 올림
     (반짝이는 젖은 물감 방울, 가장자리 살짝 울퉁불퉁)
   - 팔레트: 내 물감(물감 실험실에서 담은 색)을 맨 앞에 크게 + 기본 물감
   - 📄 접기 → 종이가 반으로 접히는 3D 연출 → 꾹꾹 누르기 → 펼치면 오른쪽에 좌우 반전 무늬가 찍혀 있음
     (찍힌 쪽은 1~2px 어긋나게 낮은 투명도로 여러 번 겹쳐 그려 번진 느낌, ctx.filter 안 씀)
   - 🐛 나비 만들기(몸통·더듬이 자동), 💾 저장(내 작품 kind "decal"), 🧽 새 종이(꾹)
===================================================================== */
"use strict";
KP.game({
  id: "decal",
  icon: "🦋",
  name: "데칼코마니",
  cat: "make",
  badge: "NEW",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio,
      P = KP.paint;
    KP.css("decal", `
      .dcW{flex:1;min-height:0;display:grid;gap:10px;padding:2px 12px 12px;
        grid-template-areas:"board" "pal" "acts";grid-template-rows:minmax(0,1fr) auto auto;grid-template-columns:minmax(0,1fr)}
      .dcBoard{grid-area:board;position:relative;min-height:0;min-width:0;perspective:1800px}
      .dcPaper{position:absolute;border-radius:10px;background:#fffaf0;box-shadow:0 8px 0 rgba(47,58,102,.12),0 0 0 3px #fff;touch-action:none;transform-style:preserve-3d}
      .dcPaper.folding{background:transparent;box-shadow:none}
      .dcPaper.press{animation:dcPress .28s ease-out}
      @keyframes dcPress{40%{transform:scale(.975)}}
      .dcPaper.flutter{animation:dcFlut .5s ease-in-out 3}
      @keyframes dcFlut{50%{transform:scaleX(.82)}}
      .dcLayers{position:absolute;inset:0;border-radius:10px;overflow:hidden}
      .dcLayers.half{-webkit-clip-path:inset(0 0 0 50%);clip-path:inset(0 0 0 50%)}
      .dcLayers canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
      .dcHere{position:absolute;left:50%;top:0;bottom:0;right:0;border-radius:0 10px 10px 0;background:rgba(214,224,244,.35);
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#9aa6c8;font-size:clamp(14px,1.8vw,18px);pointer-events:none;transition:opacity .4s}
      .dcHere .e{font-size:clamp(46px,7vw,84px);opacity:.28;filter:grayscale(.6)}
      .dcHere.off{opacity:0}
      .dcShade{position:absolute;left:50%;top:0;bottom:0;right:0;pointer-events:none;opacity:0;transition:opacity .8s;
        background:linear-gradient(90deg,rgba(47,58,102,.28),rgba(47,58,102,0) 70%)}
      .dcShade.on{opacity:1}
      .dcFlap{position:absolute;left:0;top:0;width:50%;height:100%;transform-origin:100% 50%;transform-style:preserve-3d;
        transition:transform .85s cubic-bezier(.45,.05,.35,1);z-index:3;pointer-events:none}
      .dcFlap > *{position:absolute;inset:0;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:10px 0 0 10px;overflow:hidden}
      .dcFlap canvas{width:100%;height:100%;display:block}
      .dcFlap .bk{transform:rotateY(180deg);border-radius:0 10px 10px 0;background:linear-gradient(90deg,#f3ead6,#fffaf0 30%,#fbf3e2);box-shadow:inset 6px 0 14px rgba(0,0,0,.08)}
      .dcFlap.shut{transform:rotateY(180deg)}
      .dcHand{position:absolute;z-index:5;font-size:clamp(60px,8vw,90px);pointer-events:none;transform:translate(-50%,-60%);animation:dcHand .5s ease-out forwards}
      @keyframes dcHand{0%{transform:translate(-50%,-90%) scale(1.2);opacity:0}35%{transform:translate(-50%,-55%) scale(.9);opacity:1}100%{transform:translate(-50%,-60%) scale(1);opacity:0}}
      .dcPal{grid-area:pal;display:flex;gap:10px;align-items:center;overflow-x:auto;overflow-y:hidden;padding:10px 8px;scrollbar-width:none;min-width:0}
      .dcPal::-webkit-scrollbar{display:none}
      .dcSw{flex:0 0 auto;width:var(--s,48px);height:var(--s,48px);border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.14);position:relative;transition:transform .12s}
      .dcSw.mine{--s:clamp(56px,7.6vh,70px);border-color:#ffe7a3}
      .dcSw.base{--s:clamp(56px,7.8vh,64px)}
      .dcSw.light{border-color:#e4e8f2}
      .dcSw.sel{transform:scale(1.14);box-shadow:0 0 0 4px var(--ink),0 4px 0 rgba(0,0,0,.14)}
      .dcSw .tag{position:absolute;right:-8px;top:-8px;font-size:20px;line-height:1;pointer-events:none}
      .dcSw::before{content:"";position:absolute;left:18%;top:14%;width:30%;height:20%;border-radius:50%;background:rgba(255,255,255,.55);transform:rotate(-30deg)}
      .dcSep{flex:0 0 auto;width:3px;align-self:stretch;margin:6px 2px;border-radius:3px;background:repeating-linear-gradient(#c9d2e6 0 6px,transparent 6px 11px)}
      .dcEmpty{flex:0 0 auto;display:flex;align-items:center;gap:8px;background:#fff;border-radius:20px;padding:6px 8px 6px 12px;box-shadow:0 5px 0 rgba(47,58,102,.1);font-size:13.5px;line-height:1.25;color:var(--ink2);max-width:290px}
      .dcEmpty .e{font-size:30px;flex:0 0 auto}
      .dcEmpty button{flex:0 0 auto;background:var(--cat);color:#fff;border-radius:16px;padding:8px 10px;font-size:14px;box-shadow:0 4px 0 color-mix(in srgb,var(--cat) 60%,#000);min-height:64px;display:flex;align-items:center;gap:4px}
      .dcEmpty button .e{font-size:24px}
      .dcActs{grid-area:acts;display:flex;gap:8px;justify-content:center}
      .dcB{background:#fff;border-radius:20px;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 8px;min-width:72px;min-height:72px;font-size:14px;line-height:1.1;flex:1;max-width:130px}
      .dcB .e{font-size:30px}
      .dcB:active{transform:translateY(4px)}
      .dcB.main{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000);flex:1.4;max-width:170px}
      .dcB.off{opacity:.4}
      .dcB.hide{display:none}
      @media (max-aspect-ratio:1/1){
        .dcSw.mine{--s:56px}
        .dcEmpty{order:9;padding:4px;background:none;box-shadow:none}
        .dcEmpty > .e,.dcEmpty > span{display:none}
        .dcSw.base{--s:clamp(50px,6.6vh,56px)}
        .dcEmpty button{flex-direction:column;min-width:64px;font-size:12px;padding:6px 8px;gap:0}
      }
      @media (orientation:landscape) and (min-height:500px){
        .dcW{grid-template-areas:"pal board acts";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);gap:14px;padding:2px 14px 14px}
        .dcPal{display:grid;grid-template-columns:repeat(2,auto);justify-content:center;align-content:center;justify-items:center;
          overflow-x:hidden;overflow-y:auto;max-height:100%;padding:10px 8px;gap:12px;width:clamp(160px,15vw,180px)}
        .dcSep{width:auto;height:3px;margin:2px 8px;grid-column:1/-1;background:repeating-linear-gradient(90deg,#c9d2e6 0 6px,transparent 6px 11px)}
        .dcEmpty{grid-column:1/-1;flex-direction:column;text-align:center;padding:10px 8px;max-width:none}
        .dcEmpty .e{font-size:34px}
        .dcActs{flex-direction:column;justify-content:center}
        .dcB{min-width:104px;flex:0 0 auto;max-width:none;min-height:84px;font-size:15px}
        .dcB .e{font-size:36px}
        .dcB.main{flex:0 0 auto;max-width:none;min-height:104px}
      }
      /* 폰 가로(키 작은 가로 화면, 2026-11-09): 예전엔 세로용 쌓기 배치라 종이가 186×116px 로 작았음
         → 물감은 왼쪽 2칸 줄, 단추는 오른쪽 세로줄, 종이가 높이를 다 씀 */
      @media (orientation:landscape) and (max-height:500px){
        .dcW{grid-template-areas:"pal board acts";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);gap:10px;padding:0 10px 8px}
        .dcPal{display:grid;grid-template-columns:repeat(2,auto);justify-content:center;align-content:center;justify-items:center;
          overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;max-height:100%;padding:8px 10px;gap:10px}
        .dcSw.base,.dcSw.mine{--s:min(16.5vh,64px)}
        .dcSep{width:auto;height:3px;margin:2px 6px;grid-column:1/-1;background:repeating-linear-gradient(90deg,#c9d2e6 0 6px,transparent 6px 11px)}
        .dcEmpty{grid-column:1/-1;padding:0;background:none;box-shadow:none;max-width:none;justify-content:center}
        .dcEmpty > .e,.dcEmpty > span{display:none}
        .dcEmpty button{flex-direction:column;min-height:64px;min-width:64px;font-size:12px;padding:6px 8px}
        .dcActs{flex-direction:column;justify-content:center;gap:8px;min-height:0}
        .dcB{flex:0 1 84px;max-width:none;min-width:84px;min-height:64px;font-size:13px}
        .dcB .e{font-size:28px}
        .dcB.main{flex:0 1 96px;max-width:none;min-height:64px}
      }
    `);

    /* ---------- 화면 ---------- */
    const W0 = U.el("div", "dcW");
    const boardCell = U.el("div", "dcBoard");
    const paper = U.el("div", "dcPaper");
    const layers = U.el("div", "dcLayers");
    const paperCv = U.el("canvas"),
      inkCv = U.el("canvas"),
      glossCv = U.el("canvas");
    layers.append(paperCv, inkCv, glossCv);
    const here = U.el("div", "dcHere", KP.E("🦋") + "<span>여기에 찍혀요</span>");
    const shade = U.el("div", "dcShade");
    paper.append(layers, here, shade);
    boardCell.appendChild(paper);
    const pal = U.el("div", "dcPal");
    const acts = U.el("div", "dcActs");
    W0.append(boardCell, pal, acts);
    ctx.body.appendChild(W0);
    const pg = paperCv.getContext("2d"),
      ig = inkCv.getContext("2d"),
      gg = glossCv.getContext("2d");

    const mk = (em, label, cls = "") => U.btn(KP.E(em) + "<span>" + label + "</span>", "dcB " + cls);
    const bFold = mk("📄", "접기", "main");
    const bFly = mk("🐛", "나비 만들기", "hide");
    const bSave = mk("💾", "저장");
    const bNew = mk("🧽", "새 종이");
    acts.append(bFold, bFly, bSave, bNew);

    /* ---------- 상태 ---------- */
    const st = { color: KP.store.get("decal:color", null), name: "", blobs: 0, folds: 0, busy: false, unsaved: false, fly: false };
    Object.assign(ctx, { st, pal, bFold, bFly, bSave, paper });

    /* ---------- 크기 ---------- */
    let W = 0,
      H = 0,
      D = 1;
    function fit() {
      const r = boardCell.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return false;
      let w = r.width - 8,
        h = r.height - 8;
      if (w / h > 1.6) w = h * 1.6;
      if (w / h < 0.62) h = w / 0.62;
      w = Math.floor(w / 2) * 2;
      h = Math.floor(h);
      Object.assign(paper.style, { width: w + "px", height: h + "px", left: (r.width - w) / 2 + "px", top: (r.height - h) / 2 + "px" });
      if (w === W && h === H) return true;
      const old = W ? [snap(inkCv), snap(glossCv)] : null;
      W = w;
      H = h;
      D = Math.min(2, window.devicePixelRatio || 1);
      [paperCv, inkCv, glossCv].forEach((c) => {
        c.width = Math.round(W * D);
        c.height = Math.round(H * D);
      });
      drawPaper();
      if (old) {
        [ig, gg].forEach((g, i) => {
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.drawImage(old[i], 0, 0, g.canvas.width, g.canvas.height);
        });
      }
      return true;
    }
    const snap = (cv) => {
      const c = document.createElement("canvas");
      c.width = cv.width;
      c.height = cv.height;
      c.getContext("2d").drawImage(cv, 0, 0);
      return c;
    };
    ctx.fit = fit;
    addEventListener("resize", () => ctx._active && requestAnimationFrame(fit));

    function drawPaper() {
      const g = pg;
      g.setTransform(D, 0, 0, D, 0, 0);
      g.fillStyle = "#fffaf0";
      g.fillRect(0, 0, W, H);
      // 종이 결 (아주 옅은 점)
      const r = rng(11);
      for (let i = 0; i < (W * H) / 900; i++) {
        g.fillStyle = r() < 0.5 ? "rgba(180,160,120,.06)" : "rgba(255,255,255,.5)";
        g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
      }
      // 접는 선: 살짝 들어간 그림자 + 점선
      const gr = g.createLinearGradient(W / 2 - 10, 0, W / 2 + 10, 0);
      gr.addColorStop(0, "rgba(120,110,90,0)");
      gr.addColorStop(0.5, "rgba(120,110,90,.12)");
      gr.addColorStop(1, "rgba(120,110,90,0)");
      g.fillStyle = gr;
      g.fillRect(W / 2 - 10, 0, 20, H);
      g.strokeStyle = "rgba(120,130,170,.45)";
      g.lineWidth = 2;
      g.setLineDash([10, 9]);
      g.beginPath();
      g.moveTo(W / 2, 8);
      g.lineTo(W / 2, H - 8);
      g.stroke();
      g.setLineDash([]);
    }

    function rng(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    /* ---------- 물감 방울 ---------- */
    function blobPath(g, x, y, r, seed) {
      const R = rng(seed);
      const n = 18,
        ph = R() * 6.28,
        ph2 = R() * 6.28,
        pts = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rr = r * (1 + 0.09 * Math.sin(3 * a + ph) + 0.06 * Math.sin(5 * a + ph2) + (R() - 0.5) * 0.1);
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
      }
      g.beginPath();
      const m = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
      const s = m(n - 1);
      g.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) {
        const e = m(i);
        g.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]);
      }
      g.closePath();
    }
    const clipLeft = (g) => {
      g.beginPath();
      g.rect(0, 0, W / 2, H);
      g.clip();
    };
    /** 물감 한 방울 (rim: 가장자리 진하게 정도) */
    function blob(x, y, r, color, seed, rim = 1) {
      const g = ig;
      g.save();
      g.setTransform(D, 0, 0, D, 0, 0);
      clipLeft(g);
      blobPath(g, x, y, r, seed);
      g.fillStyle = color;
      g.fill();
      if (rim > 0) {
        const gr = g.createRadialGradient(x - r * 0.15, y - r * 0.15, r * 0.35, x, y, r * 1.05);
        gr.addColorStop(0, "rgba(0,0,0,0)");
        gr.addColorStop(0.75, "rgba(0,0,0,0)");
        gr.addColorStop(1, "rgba(30,20,40," + 0.2 * rim + ")");
        g.fillStyle = gr;
        g.fill();
      }
      g.restore();
    }
    /** 젖은 물감의 반짝임 */
    function gloss(x, y, r, a = 1) {
      const g = gg;
      g.save();
      g.setTransform(D, 0, 0, D, 0, 0);
      clipLeft(g);
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.32, 0, x - r * 0.3, y - r * 0.32, r * 0.7);
      gr.addColorStop(0, "rgba(255,255,255," + 0.28 * a + ")");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x - r * 0.3, y - r * 0.32, r * 0.7, 0, 6.29);
      g.fill();
      g.translate(x - r * 0.38, y - r * 0.42);
      g.rotate(-0.6);
      g.fillStyle = "rgba(255,255,255," + 0.75 * a + ")";
      g.beginPath();
      g.ellipse(0, 0, r * 0.26, r * 0.11, 0, 0, 6.29);
      g.fill();
      g.beginPath();
      g.arc(r * 0.42, r * 0.12, r * 0.06, 0, 6.29);
      g.fill();
      g.restore();
    }

    function smear(x0, y0, x1, y1, r) {
      let g = ig;
      g.save();
      g.setTransform(D, 0, 0, D, 0, 0);
      clipLeft(g);
      g.lineCap = "round";
      g.strokeStyle = st.color;
      g.lineWidth = r * 2;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      g.restore();
      g = gg;
      g.save();
      g.setTransform(D, 0, 0, D, 0, 0);
      clipLeft(g);
      g.lineCap = "butt";
      g.strokeStyle = "rgba(255,255,255,.3)";
      g.lineWidth = r * 0.24;
      g.beginPath();
      g.moveTo(x0 - r * 0.32, y0 - r * 0.42);
      g.lineTo(x1 - r * 0.32, y1 - r * 0.42);
      g.stroke();
      g.restore();
    }

    /* ---------- 칠하기 ---------- */
    let down = null;
    const pos = (e) => {
      const r = paper.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    const baseR = () => Math.max(14, Math.min(W, H) * 0.065);
    paper.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (st.busy === "folded") return press(e);
      if (st.busy || down || !W) return;
      const [x, y] = pos(e);
      if (x > W / 2 + 6) {
        // 오른쪽은 찍히는 곳
        U.replay(here, "wig");
        A.sfx("tap");
        if (!st.rightTold || Date.now() - st.rightTold > 6000) {
          st.rightTold = Date.now();
          ctx.say(st.folds ? "왼쪽에 물감을 더 올리고 다시 접어 봐요!" : "물감은 왼쪽에 올려요! 오른쪽은 접으면 찍혀요.");
        }
        return;
      }
      try {
        paper.setPointerCapture(e.pointerId);
      } catch (_) {}
      const seed = (Math.random() * 2e9) | 0;
      down = { id: e.pointerId, x, y, sx: x, sy: y, r: baseR() * U.randf(0.85, 1.1), seed, moved: 0, t0: performance.now(), lastSnd: 0 };
      blob(x, y, down.r, st.color, seed);
      A.sfx("drop");
      A.noise({ dur: 0.1, vol: 0.06, bp: 700, bpTo: 300, q: 2 });
      changed();
    });
    paper.addEventListener("pointermove", (e) => {
      if (!down || e.pointerId !== down.id) return;
      e.preventDefault();
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of list.length ? list : [e]) {
        const [x, y] = pos(ev);
        const d = Math.hypot(x - down.x, y - down.y);
        const r = baseR() * 0.72;
        if (d < r * 0.25) continue;
        down.moved += d;
        // 문지르기: 굵기가 조금씩 달라지는 물감 줄 + 위쪽에 젖은 반짝임 줄
        smear(down.x, down.y, x, y, r * U.randf(0.9, 1.1));
        down.x = x;
        down.y = y;
        if (down.moved - down.lastSnd > 34) {
          down.lastSnd = down.moved;
          A.noise({ dur: 0.09, vol: 0.045, bp: 420 + Math.random() * 260, q: 3 });
        }
      }
    });
    function endDown(e) {
      if (!down || e.pointerId !== down.id) return;
      if (down.moved < 8) gloss(down.sx, down.sy, down.r);
      else gloss(down.x, down.y, baseR() * 0.72, 0.6);
      down = null;
      st.blobs++;
      if (st.blobs === 3 && !st.folds) {
        ctx.hint(() => bFold, "다 했으면 접기를 눌러 봐요!");
      }
    }
    paper.addEventListener("pointerup", endDown);
    paper.addEventListener("pointercancel", endDown);
    // 가만히 꾹 누르고 있으면 방울이 점점 커짐
    ctx.growLoop = () =>
      ctx.loop((dt) => {
        if (down && down.moved < 8 && performance.now() - down.t0 > 250 && down.r < baseR() * 1.9) {
          down.r += dt * baseR() * 0.9;
          blob(down.sx, down.sy, down.r, st.color, down.seed);
          if (Math.random() < dt * 6) A.noise({ dur: 0.08, vol: 0.03, bp: 500, q: 2 });
        }
      });

    function changed() {
      st.unsaved = true;
    }

    /* ---------- 접기 ---------- */
    function leftEmpty() {
      const c = document.createElement("canvas");
      c.width = 40;
      c.height = 50;
      const x = c.getContext("2d");
      x.drawImage(inkCv, 0, 0, inkCv.width / 2, inkCv.height, 0, 0, 40, 50);
      const d = x.getImageData(0, 0, 40, 50).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 20) return false;
      return true;
    }
    async function fold() {
      if (st.busy || down) return;
      if (leftEmpty()) {
        ctx.miss(bFold, "먼저 왼쪽에 물감을 콕콕 올려 봐요!", { soft: true });
        ctx.hint(() => leftPoint(), "왼쪽에 물감을 콕콕 올려요!");
        return;
      }
      st.busy = "anim";
      ctx.hint(null);
      const sess = ctx._session;
      const alive = () => ctx._active && ctx._session === sess;
      // 왼쪽 반 그림 → 접히는 날개
      const flap = U.el("div", "dcFlap");
      const front = U.el("div", "fr");
      const fc = document.createElement("canvas");
      fc.width = Math.round(paperCv.width / 2);
      fc.height = paperCv.height;
      const fx = fc.getContext("2d");
      [paperCv, inkCv, glossCv].forEach((c) => fx.drawImage(c, 0, 0, fc.width, fc.height, 0, 0, fc.width, fc.height));
      front.appendChild(fc);
      // 뒷면: 얇은 종이 너머로 물감이 살짝 비쳐 보임 (펼친 뒤 찍힐 자리와 같은 모양)
      const back = U.el("div", "bk");
      const bc = document.createElement("canvas");
      bc.width = fc.width;
      bc.height = fc.height;
      const bx = bc.getContext("2d");
      bx.globalAlpha = 0.16;
      bx.setTransform(-1, 0, 0, 1, bc.width, 0);
      bx.drawImage(inkCv, 0, 0, fc.width, fc.height, 0, 0, fc.width, fc.height);
      back.appendChild(bc);
      flap.append(front, back);
      paper.appendChild(flap);
      layers.classList.add("half");
      paper.classList.add("folding");
      A.sfx("whoosh");
      ctx.say("반으로 접어요!");
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      flap.classList.add("shut");
      shade.classList.add("on");
      await ctx.wait(880);
      if (!alive()) return cleanupFlap(flap);
      A.noise({ dur: 0.12, vol: 0.08, lp: 700 });
      print(); // 접힌 종이 아래에서 찍힘
      st.busy = "folded";
      st.presses = 0;
      ctx.say("꾹꾹 눌러요!");
      ctx.hint(() => ({ x: paper.getBoundingClientRect().left + paper.getBoundingClientRect().width * 0.75, y: paper.getBoundingClientRect().top + paper.getBoundingClientRect().height * 0.5 }), "종이를 꾹꾹 눌러요!");
      // 안 누르면 저절로 꾹꾹
      st.autoT = ctx.after(4200, async () => {
        for (let i = 0; i < 2 && st.busy === "folded"; i++) {
          press(null);
          await ctx.wait(420);
        }
      });
      st.flap = flap;
    }
    function press(e) {
      if (st.busy !== "folded") return;
      st.presses++;
      const r = paper.getBoundingClientRect();
      const x = e ? e.clientX - r.left : r.width * (0.6 + Math.random() * 0.3),
        y = e ? e.clientY - r.top : r.height * (0.3 + Math.random() * 0.4);
      const h = U.el("div", "dcHand", KP.E("👐"));
      h.style.left = x + "px";
      h.style.top = y + "px";
      paper.appendChild(h);
      setTimeout(() => h.remove(), 520);
      U.replay(paper, "press");
      A.tone(150, { to: 70, dur: 0.16, vol: 0.25, type: "sine" });
      A.noise({ dur: 0.16, vol: 0.09, lp: 600 });
      if (st.presses === 1) ctx.cancel(st.autoT);
      if (st.presses >= 3) {
        st.busy = "anim";
        ctx.after(450, unfold);
      } else {
        ctx.cancel(st.autoT);
        st.autoT = ctx.after(2600, () => {
          if (st.busy === "folded") {
            st.presses = 2;
            press(null);
          }
        });
      }
    }
    async function unfold() {
      const flap = st.flap;
      if (!flap) return;
      const sess = ctx._session;
      ctx.hint(null);
      A.sfx("slide");
      ctx.say("살살 펼쳐 볼까요?");
      flap.classList.remove("shut");
      shade.classList.remove("on");
      await ctx.wait(500);
      // 펼쳐지는 동안 원래 종이 보이게
      layers.classList.remove("half");
      paper.classList.remove("folding");
      here.classList.add("off");
      await ctx.wait(420);
      cleanupFlap(flap);
      if (!ctx._active || ctx._session !== sess) return;
      st.busy = false;
      A.sfx("sparkle");
      bFly.classList.toggle("hide", st.fly);
      const msg = U.pick(["우와, 나비가 됐어요!", "와, 양쪽이 똑같아요!", "우와, 멋진 무늬가 찍혔어요!"]);
      ctx.say(msg);
      ctx.round = (ctx.round || 0) + 1;
      // 열쇠 별: 지난 접기 뒤로 물감을 3번 이상 올렸을 때만 (방울 하나 + 접기 반복으로 별 모으기 방지)
      if (st.blobs - (st.winBlobs || 0) < 3) ctx._fewChoice = true;
      st.winBlobs = st.blobs;
      const ok = await ctx.win({ msg, big: ctx.round % 4 === 0 });
      if (!ok) return;
      ctx.say(st.fly ? "저장 단추를 눌러 내 작품에 넣어요!" : "나비 만들기를 누르면 몸통이 생겨요! 저장도 할 수 있어요.");
      ctx.hint(() => (st.fly ? bSave : bFly), st.fly ? "저장을 눌러 봐요!" : "나비 만들기를 눌러 봐요!");
    }
    function cleanupFlap(flap) {
      flap.remove();
      layers.classList.remove("half");
      paper.classList.remove("folding");
      shade.classList.remove("on");
      st.flap = null;
      if (st.busy) st.busy = false;
    }
    /** 찍기: 오른쪽 ← 왼쪽(좌우 반전, 번지게), 왼쪽 ← 오른쪽에 이미 있던 물감(약하게), 왼쪽은 눌린 느낌 */
    function print() {
      here.classList.add("off");
      st.folds++;
      st.unsaved = true;
      const cw = inkCv.width,
        ch = inkCv.height,
        hw = cw / 2;
      const L = document.createElement("canvas");
      L.width = hw;
      L.height = ch;
      L.getContext("2d").drawImage(inkCv, 0, 0, hw, ch, 0, 0, hw, ch);
      const R0 = document.createElement("canvas");
      R0.width = hw;
      R0.height = ch;
      R0.getContext("2d").drawImage(inkCv, hw, 0, hw, ch, 0, 0, hw, ch);
      const g = ig;
      const rr = rng((Math.random() * 1e9) | 0);
      const j = () => (rr() - 0.5) * 2 * 1.6 * D; // 1~2px 어긋남
      // 오른쪽 ← 왼쪽 거울
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.beginPath();
      g.rect(hw, 0, hw, ch);
      g.clip();
      for (let i = 0; i < 6; i++) {
        g.globalAlpha = 0.2;
        g.setTransform(-1, 0, 0, 1, cw + j(), j());
        g.drawImage(L, 0, 0);
      }
      g.globalAlpha = 0.72;
      g.setTransform(-1, 0, 0, 1, cw, 0);
      g.drawImage(L, 0, 0);
      g.restore();
      // 왼쪽 ← 오른쪽에 있던 것(두 번째 접기부터)
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.beginPath();
      g.rect(0, 0, hw, ch);
      g.clip();
      g.globalAlpha = 0.45;
      g.setTransform(-1, 0, 0, 1, hw, 0);
      g.drawImage(R0, 0, 0);
      // 왼쪽도 살짝 눌려 퍼짐
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.14;
        g.drawImage(L, j() * 1.4, j() * 1.4);
      }
      g.restore();
      // 떼어 낸 물감 결: 아주 작은 빈 자국 (양쪽, 오른쪽이 더 많이)
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "destination-out";
      const n = Math.round((cw * ch) / (2600 * D * D));
      for (let i = 0; i < n; i++) {
        const right = rr() < 0.7;
        const x = (right ? hw : 0) + rr() * hw,
          y = rr() * ch;
        // 접는 선에서 바깥으로 뻗는 결
        const ang = Math.atan2(y - ch / 2, x - hw) + (rr() - 0.5) * 0.8;
        g.globalAlpha = (right ? 0.12 : 0.07) + rr() * 0.14;
        g.beginPath();
        g.ellipse(x, y, (1.5 + rr() * 4.5) * D, (0.6 + rr() * 1.2) * D, ang, 0, 6.29);
        g.fill();
      }
      g.restore();
      // 반짝임은 눌려서 줄어듦
      const G = snap(glossCv);
      gg.setTransform(1, 0, 0, 1, 0, 0);
      gg.clearRect(0, 0, cw, ch);
      gg.globalAlpha = 0.35;
      gg.drawImage(G, 0, 0);
      gg.globalAlpha = 1;
    }

    /* ---------- 나비 만들기 ---------- */
    function butterfly() {
      if (st.busy || st.fly) return;
      if (!st.folds) {
        ctx.miss(bFly, "먼저 접어서 무늬를 찍어요!", { soft: true });
        return;
      }
      st.fly = true;
      const g = ig;
      g.save();
      g.setTransform(D, 0, 0, D, 0, 0);
      const cx = W / 2,
        s = Math.min(W * 0.5, H) / 10;
      const top = H * 0.3,
        bot = H * 0.74;
      // 몸통 (마디)
      g.fillStyle = "#3b3552";
      for (let y = top + s * 1.6, k = 0; y < bot; y += s * 0.85, k++) {
        g.beginPath();
        g.ellipse(cx, y, s * (0.5 - Math.max(0, (y - (bot - s * 2)) / (s * 8))), s * 0.55, 0, 0, 6.29);
        g.fill();
      }
      // 머리
      g.beginPath();
      g.arc(cx, top + s * 0.7, s * 0.8, 0, 6.29);
      g.fill();
      // 더듬이
      g.strokeStyle = "#3b3552";
      g.lineWidth = Math.max(2.5, s * 0.16);
      g.lineCap = "round";
      [-1, 1].forEach((d) => {
        g.beginPath();
        g.moveTo(cx + d * s * 0.3, top + s * 0.1);
        g.quadraticCurveTo(cx + d * s * 0.6, top - s * 1.6, cx + d * s * 1.8, top - s * 2.1);
        g.stroke();
        g.beginPath();
        g.arc(cx + d * s * 1.8, top - s * 2.1, s * 0.32, 0, 6.29);
        g.fill();
      });
      // 눈과 웃는 입
      g.fillStyle = "#fff";
      [-1, 1].forEach((d) => {
        g.beginPath();
        g.arc(cx + d * s * 0.3, top + s * 0.55, s * 0.2, 0, 6.29);
        g.fill();
      });
      g.strokeStyle = "#fff";
      g.lineWidth = Math.max(1.5, s * 0.08);
      g.beginPath();
      g.arc(cx, top + s * 0.8, s * 0.32, 0.4, Math.PI - 0.4);
      g.stroke();
      // 몸통 반짝
      g.fillStyle = "rgba(255,255,255,.35)";
      g.beginPath();
      g.ellipse(cx - s * 0.18, top + s * 2.6, s * 0.12, s * 0.9, 0, 0, 6.29);
      g.fill();
      g.restore();
      st.unsaved = true;
      bFly.classList.add("hide");
      U.replay(paper, "flutter");
      A.sfx("sparkle");
      A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.12, inst: "bell", vol: 0.18 });
      ctx.say("나비 완성! 팔랑팔랑 날아요!");
      ctx.hint(() => bSave, "저장을 눌러 내 작품에 넣어요!");
    }

    /* ---------- 저장 / 새 종이 ---------- */
    function jpeg() {
      const s = Math.min(1, 1000 / Math.max(inkCv.width, inkCv.height));
      const c = document.createElement("canvas");
      c.width = Math.round(inkCv.width * s);
      c.height = Math.round(inkCv.height * s);
      const x = c.getContext("2d");
      [paperCv, inkCv, glossCv].forEach((cv) => x.drawImage(cv, 0, 0, c.width, c.height));
      return c.toDataURL("image/jpeg", 0.86);
    }
    async function save() {
      if (st.busy || bSave.dataset.busy) return;
      if (leftEmpty()) return ctx.miss(bSave, "먼저 물감을 올리고 접어 봐요!", { soft: true });
      if (!st.unsaved) {
        U.replay(bSave, "wig");
        return KP.voice.say("벌써 내 작품에 저장했어요!");
      }
      bSave.dataset.busy = "1";
      const img = jpeg();
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "decal", img, t: Date.now(), date: KP.gate.monthDay() });
      delete bSave.dataset.busy;
      if (ok === false) {
        KP.toast("저장하지 못했어요. 기기 저장공간을 확인해 주세요");
        ctx.miss(bSave, "앗, 저장이 안 됐어요. 다시 눌러 볼까요?", { soft: true });
        return;
      }
      st.unsaved = false;
      flyAway(img);
      KP.toast("🖼️ 내 작품에 저장했어요!");
      A.sfx("sticker");
      ctx.say("내 작품에 저장했어요! 새 종이에 또 해 볼까요?");
      ctx.hint(() => bNew, "새 종이를 꾹 눌러요!");
    }
    function flyAway(img) {
      const a = paper.getBoundingClientRect();
      const home = ctx.root.querySelector(".bar .home");
      const b = home ? home.getBoundingClientRect() : { left: 0, top: 0, width: 40, height: 40 };
      const f = U.el("img");
      f.src = img;
      Object.assign(f.style, {
        position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", objectFit: "contain",
        zIndex: 90, borderRadius: "14px", pointerEvents: "none", boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        transition: "transform .9s cubic-bezier(.5,-0.35,.6,1), opacity .9s",
      });
      document.body.appendChild(f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          f.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.06) rotate(25deg)";
          f.style.opacity = "0.5";
        })
      );
      setTimeout(() => {
        f.remove();
        if (home) U.replay(home, "bump");
      }, 950);
    }
    function newPaper(quiet) {
      [ig, gg].forEach((g) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, g.canvas.width, g.canvas.height);
      });
      Object.assign(st, { blobs: 0, winBlobs: 0, folds: 0, unsaved: false, fly: false });
      here.classList.remove("off");
      bFly.classList.add("hide");
      if (!quiet) {
        A.sfx("whoosh");
        U.replay(paper, "jump");
        ctx.say("새 종이예요! 왼쪽에 물감을 콕콕 올려요.");
        ctx.hint(() => leftPoint(), "왼쪽에 물감을 콕콕 올려요!");
      }
    }
    const leftPoint = () => {
      const r = paper.getBoundingClientRect();
      return { x: r.left + r.width * 0.28, y: r.top + r.height * 0.5 };
    };
    ctx.leftPoint = leftPoint;

    ctx.tap(bFold, fold);
    ctx.tap(bFly, butterfly);
    ctx.tap(bSave, save);
    KP.hold(
      bNew,
      700,
      () => newPaper(false),
      () => {
        if (st.busy) return;
        A.sfx("tick");
      }
    );
    let newDownAt = 0;
    bNew.addEventListener("pointerdown", () => (newDownAt = performance.now()));
    bNew.addEventListener("click", () => {
      // 짧게 톡 누른 경우만 안내 (꾹 눌러 새 종이가 된 뒤의 click 은 무시)
      if (performance.now() - newDownAt < 650) KP.voice.say("새 종이는 꾹 누르고 있어요");
    });

    /* ---------- 팔레트 ---------- */
    ctx.renderPal = () => {
      pal.innerHTML = "";
      const mine = P.mine();
      const base = [0, 1, 2, 4].map((i) => P.BASE[i]);
      const all = [];
      if (!mine.length) {
        const box = U.el("div", "dcEmpty", KP.E("🧪") + "<span>물감 실험실에서 색을 만들어 담아 오세요</span>");
        const go = U.btn(KP.E("🧪") + "<span>실험실 가기</span>");
        ctx.tap(go, () => {
          A.sfx("open");
          KP.open("paintlab");
        });
        box.appendChild(go);
        pal.appendChild(box);
        ctx.goLab = go;
      } else ctx.goLab = null;
      mine.forEach((m) => all.push({ hex: m.hex, n: m.n || "내 물감", mine: true }));
      base.forEach((b) => all.push({ hex: b.hex, n: b.n }));
      if (!st.color || !all.some((c) => c.hex === st.color)) st.color = all[0].hex;
      all.forEach((c, i) => {
        const b = U.el("button", "dcSw " + (c.mine ? "mine" : "base") + (c.hex === st.color ? " sel" : ""), c.mine ? '<span class="tag">' + KP.E("🎨") + "</span>" : "");
        b.style.background = c.hex;
        const rgb = P.rgb(c.hex);
        if (rgb[0] + rgb[1] + rgb[2] > 2.7) b.classList.add("light");
        b.addEventListener("click", () => {
          A.unlock();
          st.color = c.hex;
          KP.store.set("decal:color", c.hex);
          U.$$(".dcSw", pal).forEach((x) => x.classList.toggle("sel", x === b));
          U.replay(b, "jump");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.22 });
          KP.voice.say(c.mine ? "내가 만든 " + c.n : c.n);
        });
        if (mine.length && i === mine.length) pal.appendChild(U.el("span", "dcSep"));
        pal.appendChild(b);
      });
      return mine.length;
    };
    ctx.newPaper = newPaper;
  },

  start(ctx) {
    const st = ctx.st;
    const nMine = ctx.renderPal();
    if (st.flap) st.flap.remove(), (st.flap = null);
    ctx.paper.querySelector(".dcLayers").classList.remove("half");
    ctx.paper.classList.remove("folding");
    ctx.paper.querySelector(".dcShade").classList.remove("on");
    st.busy = false;
    ctx.bFly.classList.toggle("hide", !(st.folds && !st.fly));
    const go = () => {
      if (!ctx._active) return;
      if (!ctx.fit()) return requestAnimationFrame(go);
      ctx.growLoop();
    };
    requestAnimationFrame(go);
    if (!nMine) {
      ctx.say("왼쪽에 물감을 콕콕 올리고 반으로 접어 봐요! 물감 실험실에서 내 물감을 만들어 와도 좋아요.");
      ctx.hint(() => ctx.leftPoint(), "왼쪽에 물감을 콕콕 올려요!");
    } else {
      ctx.say("내 물감으로 왼쪽에 콕콕 찍고, 반으로 접어 봐요!");
      ctx.hint(() => (ctx.st.blobs ? ctx.bFold : ctx.leftPoint()), ctx.st.blobs ? "접기를 눌러 봐요!" : "왼쪽에 물감을 콕콕 올려요!");
    }
  },
  stop(ctx) {
    ctx.st.busy = false;
  },
});

;

/* ==== js/games/make/doll-bake.js ==== */
/* =====================================================================
   🧸 3D 인형 친구 — 종별 설정 + 도안 굽기 (시험판 lab/doll 의 species.js·bake.js·glb.js 를 앱용으로 옮김)
   - 앱에서는 미리 구운 결과(assets/doll/<종>.bin·-map.png·-lines.png, tools/doll-bake.js 가 만듦)를 읽어 씀
     → 저가 태블릿에서도 도안 고르기 즉시. 이 파일의 bake() 는 생성 도구와 '파일을 못 읽었을 때' 대체용
   - KP.DOLL 에 모아 둠 (ES 모듈이 아닌 일반 스크립트: 빌드가 js/games/** 를 그대로 불러옴)
===================================================================== */
"use strict";
(function () {
/* =====================================================================
   종별 설정 (8종) — 굽기(bake.js)·움직임(stage.js)·예시(examples.js)가 함께 씀
   모델 좌표: 키 1, 발바닥 y=0, 정면 +z, 오른쪽 +x (lab/doll/pipeline/clean.js 가 맞춤)
   그림 좌표: px = CX + x·K, py = OY − y·K  (도안·텍스처 S=1024 정사각형)
   part(x,y,z) → 부위 번호 : 모델의 '겉면 한 점'이 어느 부위인지 (같은 규칙으로 도안 경계·UV 고치기·움직임 가중치)
   face : 도안·3D 얼굴 (눈·코·입 위치는 모델의 볼록한 자리에 맞춤 — tools/out/doll8/probe.js 로 잼)
   move : 움직임 차이 (걸음 빠르기·흔들림·깡충·꼬리/코 흔들기)
===================================================================== */
const PARTS = ["bg", "head", "earR", "earL", "body", "armR", "armL", "legR", "legL", "tail", "snout", "mane", "spike"];
const P = Object.fromEntries(PARTS.map((n, i) => [n, i]));

const ell = (x, y, z, c, r) => ((x - c[0]) / r[0]) ** 2 + ((y - c[1]) / r[1]) ** 2 + ((z - c[2]) / r[2]) ** 2;
const side = (x, R, L) => (x > 0 ? R : L);
/** 꺾은선(관)까지 거리 — 코끼리 코처럼 휜 관 모양 부위 */
function distLine(x, y, z, pts) {
  let best = 9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * d[0] + (y - a[1]) * d[1] + (z - a[2]) * d[2]) / l2));
    best = Math.min(best, Math.hypot(x - a[0] - d[0] * t, y - a[1] - d[1] * t, z - a[2] - d[2] * t));
  }
  return best;
}
const TRUNK = [[0, 0.68, 0.25], [0, 0.6, 0.3], [0, 0.52, 0.325], [0, 0.44, 0.335], [0, 0.38, 0.335]];

/** 흔한 몸 규칙: 꼬리 → 팔 → 다리 → 몸 */
function bodyPart(x, y, z, b) {
  const ax = Math.abs(x);
  if (b.tail && z < b.tail.z && y > b.tail.y0 && y < b.tail.y1 && ax < b.tail.ax) return P.tail;
  const T = b.arm.T0 - b.arm.k * Math.max(0, y - b.arm.Ty);
  if (y > b.arm.y0 && y < b.arm.y1 && ax > T) return side(x, P.armR, P.armL);
  if (y < b.leg) return side(x, P.legR, P.legL);
  return P.body;
}

/* 기본 움직임 값 (강아지 = 예전 그대로) */
const MOVE0 = {
  gait: 7.5, speed: 0.5, bob: 0.035, roll: 0.07, armSwing: 0.55, legLift: 0.045, legStep: 0.06,
  ear: 0.14, earBase: 0.05, earHappy: 0.25, earAx: [0, 0, 1],
  tail: 0.35, tailRate: 8, tailAx: [0, 1, 0], hop: 0, size: 1,
};

const SPECIES = {
  /* ---------- 강아지 (시험 2 그대로) ---------- */
  dog: {
    name: "강아지", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const ax = Math.abs(x), R = x > 0;
      const hy = (y - 0.77) / 0.245, hz = (z + 0.035) / 0.25;
      const hx = 0.25 * Math.sqrt(Math.max(0, 1 - hy * hy - hz * hz));
      if (y > 0.57 && y < 0.985 && ax > 0.15 && ax > hx + 0.012 && z > -0.22 && z < 0.26) return R ? P.earR : P.earL;
      const h = (x / 0.25) ** 2 + hy * hy + hz * hz;
      if (y > 0.537 + 1.6 * x * x && h < 1.6) return P.head;
      if (z < -0.185 && y > 0.17 && y < 0.37 && ax < 0.1) return P.tail;
      const T = 0.2 - 0.6 * Math.max(0, y - 0.4);
      if (y > 0.26 && y < 0.53 && ax > T) return R ? P.armR : P.armL;
      if (y < 0.175) return R ? P.legR : P.legL;
      return P.body;
    },
    merge: { tail: "body" }, // 앞에서 안 보이는 부위 → 이 부위 색
    pivot: { arm: [0.155, 0.47, 0.04], leg: 0.2, ear: [0.215, 0.93, -0.03], head: [0, 0.53, 0], tail: [0, 0.27, -0.17] },
    face: {
      eyes: [[-0.104, 0.711], [0.104, 0.711]], eyeR: [0.026, 0.022],
      nose: { type: "tri", x: 0, y: 0.684, w: 0.072, h: 0.046 },
      mouth: { type: "w", y: 0.632, w: 0.064, h: 0.022, top: 0.656 },
      toes: [[0.085, 0.0], [0.145, 0.0]], toeH: 0.042,
    },
    move: {},
    sound: "dog",
  },

  /* ---------- 고양이: 뾰족 귀, 동그란 꼬리 ---------- */
  cat: {
    name: "고양이", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const h = ell(x, y, z, [0, 0.705, -0.015], [0.31, 0.255, 0.285]);
      const ax = Math.abs(x);
      // 귀 밑선: 안쪽 (0.12, 0.955) → 바깥 (0.29, 0.845) 비스듬한 직선
      if (ax > 0.1 && y > 0.955 - (ax - 0.12) * 0.65 && z > -0.12 && z < 0.1) return side(x, P.earR, P.earL);
      if (y > 0.455 + 1.2 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.21, y0: 0.12, y1: 0.31, ax: 0.1 }, arm: { y0: 0.26, y1: 0.47, T0: 0.205, k: 0.55, Ty: 0.37 }, leg: 0.135 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.17, 0.42, 0.0], leg: 0.16, ear: [0.2, 0.9, -0.02], head: [0, 0.46, 0], tail: [0, 0.22, -0.2] },
    face: {
      eyes: [[-0.167, 0.646], [0.167, 0.646]], eyeR: [0.03, 0.03],
      nose: { type: "tri", x: 0, y: 0.611, w: 0.052, h: 0.032 },
      mouth: { type: "w", y: 0.566, w: 0.05, h: 0.018, top: 0.588 },
      toes: [[0.078, 0.0], [0.13, 0.0]], toeH: 0.032,
    },
    move: { gait: 8, bob: 0.03, ear: 0.08, earBase: 0.02, tail: 0.5, tailRate: 6 },
    sound: "cat",
  },

  /* ---------- 곰: 동그란 귀, 주둥이 ---------- */
  bear: {
    name: "곰", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      if (ell(x, y, z, [0, 0.672, 0.29], [0.125, 0.1, 0.08]) < 1) return P.snout;
      const h = ell(x, y, z, [0, 0.775, -0.005], [0.285, 0.225, 0.262]);
      if (y > 0.84 && Math.abs(x) > 0.13 && h > 1.02) return side(x, P.earR, P.earL);
      if (y > 0.555 + 1.0 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.27, y0: 0.18, y1: 0.36, ax: 0.1 }, arm: { y0: 0.33, y1: 0.545, T0: 0.245, k: 0.5, Ty: 0.44 }, leg: 0.165 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.21, 0.5, 0.0], leg: 0.2, ear: [0.2, 0.92, -0.02], head: [0, 0.56, 0], tail: [0, 0.27, -0.27] },
    face: {
      eyes: [[-0.121, 0.758], [0.121, 0.758]], eyeR: [0.022, 0.022],
      nose: { type: "oval", x: 0, y: 0.725, w: 0.07, h: 0.042 },
      mouth: { type: "w", y: 0.64, w: 0.055, h: 0.02, top: 0.665 },
      toes: [[0.09, 0.0], [0.15, 0.0]], toeH: 0.035,
    },
    move: { gait: 6, speed: 0.42, bob: 0.03, roll: 0.1, ear: 0.06, earBase: 0.02, earHappy: 0.12, tail: 0.25, size: 1.04 },
    sound: "bear",
  },

  /* ---------- 토끼: 긴 귀, 깡충 ---------- */
  rabbit: {
    name: "토끼", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const h = ell(x, y, z, [0, 0.578, -0.015], [0.228, 0.185, 0.225]);
      if (y > 0.7 && h > 1.0 && Math.abs(x) > 0.02) return side(x, P.earR, P.earL);
      if (y > 0.4 + 1.0 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.18, y0: 0.12, y1: 0.28, ax: 0.09 }, arm: { y0: 0.21, y1: 0.41, T0: 0.165, k: 0.5, Ty: 0.32 }, leg: 0.13 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.13, 0.37, 0.0], leg: 0.15, ear: [0.08, 0.74, -0.05], head: [0, 0.41, 0], tail: [0, 0.2, -0.18] },
    face: {
      eyes: [[-0.113, 0.568], [0.113, 0.568]], eyeR: [0.02, 0.022],
      nose: { type: "tri", x: 0, y: 0.546, w: 0.04, h: 0.026 },
      mouth: { type: "w", y: 0.51, w: 0.04, h: 0.015, top: 0.528 },
    },
    move: { gait: 5.5, speed: 0.55, bob: 0.0, hop: 0.13, roll: 0.03, armSwing: 0.25, legLift: 0.0, legStep: 0.0, ear: 0.18, earBase: 0.0, earHappy: 0.3, earAx: [1, 0, 0], tail: 0.3, size: 0.98 },
    sound: "rabbit",
  },

  /* ---------- 돼지: 접힌 귀, 코 ---------- */
  pig: {
    name: "돼지", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      if (z > 0.21 && ell(x, y, z, [0, 0.7, 0.3], [0.115, 0.085, 0.12]) < 1) return P.snout;
      const h = ell(x, y, z, [0, 0.74, -0.03], [0.28, 0.215, 0.245]);
      const ax = Math.abs(x);
      if (ax > 0.1 && y > 0.975 - (ax - 0.1) * 0.76 && z > -0.14) return side(x, P.earR, P.earL);
      if (y > 0.535 + 1.0 * x * x && h < 2.4) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.25, y0: 0.16, y1: 0.32, ax: 0.1 }, arm: { y0: 0.28, y1: 0.54, T0: 0.232, k: 0.5, Ty: 0.42 }, leg: 0.15 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.2, 0.47, 0.0], leg: 0.18, ear: [0.2, 0.9, -0.02], head: [0, 0.54, 0], tail: [0, 0.24, -0.25] },
    face: {
      eyes: [[-0.149, 0.752], [0.149, 0.752]], eyeR: [0.022, 0.022],
      nose: { type: "pig", x: 0, y: 0.705, w: 0.024, h: 0.034, gap: 0.04 },
      mouth: { type: "smile", y: 0.6, w: 0.05, h: 0.02 },
      toes: [[0.125, 0.0]], toeH: 0.04,
    },
    move: { gait: 9, speed: 0.48, bob: 0.04, roll: 0.06, ear: 0.1, earBase: 0.03, tail: 0.6, tailRate: 14 },
    sound: "pig",
  },

  /* ---------- 사자: 갈기 ---------- */
  lion: {
    name: "사자", K: 900, CX: 512, OY: 966,
    smooth: 9, // 갈기 방울 때문에 얼굴 경계가 울퉁불퉁 → 더 매끈하게
    part(x, y, z) {
      const ax = Math.abs(x);
      if (ell(ax, y, z, [0.215, 0.866, 0.09], [0.078, 0.078, 0.14]) < 1) return side(x, P.earR, P.earL);
      // 얼굴: 정면에서 본 타원 안 + 갈기보다 앞(z) — 얼굴은 갈기 앞에 붙은 납작한 원판 모양
      const f = (x / 0.25) ** 2 + ((y - 0.665) / 0.22) ** 2;
      if (y > 0.42 && f < 1.0 && z > 0.04) return P.head;
      if (y > 0.455 + 0.8 * x * x) return P.mane;
      return bodyPart(x, y, z, { tail: { z: -0.19, y0: 0.13, y1: 0.3, ax: 0.1 }, arm: { y0: 0.22, y1: 0.39, T0: 0.18, k: 0.5, Ty: 0.34 }, leg: 0.145 });
    },
    merge: { tail: "body" },
    pivot: { arm: [0.15, 0.38, 0.0], leg: 0.17, ear: [0.215, 0.85, 0.0], head: [0, 0.43, 0], tail: [0, 0.2, -0.2] },
    face: {
      eyes: [[-0.135, 0.64], [0.135, 0.64]], eyeR: [0.022, 0.024],
      nose: { type: "tri", x: 0, y: 0.598, w: 0.06, h: 0.036 },
      mouth: { type: "w", y: 0.553, w: 0.052, h: 0.02, top: 0.576 },
      toes: [[0.06, 0.0], [0.12, 0.0]], toeH: 0.035,
    },
    move: { gait: 7, speed: 0.48, bob: 0.035, ear: 0.06, earBase: 0.0, earHappy: 0.1, tail: 0.3, size: 1.03 },
    sound: "lion",
  },

  /* ---------- 코끼리: 큰 귀, 긴 코 ---------- */
  elephant: {
    name: "코끼리", K: 840, CX: 512, OY: 940,
    part(x, y, z) {
      const ax = Math.abs(x);
      if (y > 0.36 && y < 0.72 && distLine(x, y, z, TRUNK) < 0.078) return P.snout;
      const hy = (y - 0.765) / 0.23, hz = (z - 0.0) / 0.255;
      const hx = 0.215 * Math.sqrt(Math.max(0, 1 - hy * hy - hz * hz));
      if (y > 0.54 && y < 0.96 && ax > 0.17 && ax > hx + 0.01 && z > -0.2) return side(x, P.earR, P.earL);
      const h = (x / 0.215) ** 2 + hy * hy + hz * hz;
      if (y > 0.535 + 1.0 * x * x && h < 1.7) return P.head;
      return bodyPart(x, y, z, { tail: { z: -0.24, y0: 0.15, y1: 0.32, ax: 0.1 }, arm: { y0: 0.29, y1: 0.55, T0: 0.23, k: 0.5, Ty: 0.42 }, leg: 0.15 });
    },
    merge: { tail: "body" },
    swing: "snout", // 꼬리 대신 코를 흔듦
    pivot: { arm: [0.2, 0.48, 0.0], leg: 0.18, ear: [0.19, 0.76, -0.02], head: [0, 0.54, 0], tail: [0, 0.66, 0.24] },
    face: {
      eyes: [[-0.151, 0.729], [0.151, 0.729]], eyeR: [0.02, 0.022],
      nose: { type: "none" },
      mouth: { type: "none" },
      toes: [[0.07, 0.0], [0.13, 0.0]], toeH: 0.035,
    },
    move: { gait: 5, speed: 0.36, bob: 0.02, roll: 0.1, armSwing: 0.4, ear: 0.3, earBase: 0.0, earHappy: 0.35, earAx: [0, 1, 0], tail: 0.22, tailRate: 3.2, tailAx: [0, 0, 1], size: 1.1 },
    sound: "elephant",
  },

  /* ---------- 공룡: 등 뿔, 긴 꼬리 ---------- */
  dino: {
    name: "공룡", K: 900, CX: 512, OY: 966,
    part(x, y, z) {
      const ax = Math.abs(x);
      const h = ell(x, y, z, [0, 0.7, 0.0], [0.245, 0.228, 0.235]);
      if (y > 0.46 && h > 1.12 && ax < 0.135 && (y > 0.86 || (z < -0.19 && y > 0.62 && h > 1.25))) return P.spike;
      if (y > 0.4 && y < 0.64 && z < (y > 0.5 ? -0.25 : -0.215) && ax < 0.1) return P.spike; // 목·등 뿔
      if (y > 0.47 + 1.0 * x * x && h < 1.7) return P.head;
      // 꼬리: 몸 뒤로 나온 굵은 관 + 앞에서 보이는 오른쪽 끝
      const tTop = 0.42 + (z + 0.13) * 0.55; // 꼬리 윗면 (z 가 작을수록 낮음)
      if (z < -0.18 && y < 0.44 && y > 0.06) return y > tTop + 0.025 ? P.spike : P.tail;
      if (x > 0.205 && y < 0.27 && y > 0.07 && z < 0.02) return P.tail;
      return bodyPart(x, y, z, { arm: { y0: 0.29, y1: 0.48, T0: 0.175, k: 0.5, Ty: 0.38 }, leg: 0.12 });
    },
    merge: {},
    pivot: { arm: [0.15, 0.43, 0.0], leg: 0.14, ear: [0.2, 0.9, 0.0], head: [0, 0.48, 0], tail: [0, 0.25, -0.13] },
    face: {
      eyes: [[-0.131, 0.664], [0.131, 0.664]], eyeR: [0.03, 0.032],
      nose: { type: "dots", x: 0, y: 0.615, w: 0.012, h: 0.01, gap: 0.035 },
      mouth: { type: "smile", y: 0.57, w: 0.075, h: 0.028 },
      toes: [[0.09, 0.0], [0.15, 0.0]], toeH: 0.035,
    },
    move: { gait: 6.5, speed: 0.42, bob: 0.03, roll: 0.1, tail: 0.45, tailRate: 3, ear: 0, earBase: 0, earHappy: 0, size: 1.06 },
    sound: "dino",
  },
};
const ORDER = ["dog", "cat", "bear", "rabbit", "pig", "lion", "elephant", "dino"];
for (const id of ORDER) {
  const s = SPECIES[id];
  s.id = id;
  s.move = Object.assign({}, MOVE0, s.move);
}

/* =====================================================================
   인형 굽기 — 3D 모델 하나에서 (1) 정면 투영 UV (2) 색칠 도안 (3) 칠하기용 영역 지도 를 만듦
   - 모든 그림 좌표 = 정면에서 직교 투영한 좌표 (S×S 정사각형). 아이 캔버스 = 도안 = 텍스처.
   - 부위(머리·귀·몸·팔·다리·꼬리 + 종 특징: 주둥이/코·갈기·뿔)는 종마다 손으로 정한 간단한 규칙(species.js 의 part) 으로 나눔.
     같은 규칙으로 ① 도안의 부위 경계선 ② 가려진 면의 UV 고치기 ③ 움직임 가중치 를 모두 만듦.
   - 안 보이는 면 처리:
       뒷면 = 같은 (x,y) 를 그대로 씀 → 앞 그림이 거울처럼 비침 (얼굴 눈코입은 앞면만)
       다른 부위에 가려진 면(귀 밑 머리 옆, 팔 뒤 몸 옆, 꼬리) = 그 부위의 '가장 가까운 보이는 곳' 색
       옆면 늘어짐 = 그림 바깥으로 색 번지기(bleed) + 3D 에서 옆면일수록 흐린 밉맵으로 읽기
===================================================================== */
const S = 1024; // 도안·텍스처 크기 (종 설정의 CX·OY·K 는 이 크기 기준)
const DOG = SPECIES.dog; // 예전 이름 (시험 2)

/* ---------- 거리 변환 (Felzenszwalb) : 0 인 칸에서의 제곱 거리 ---------- */
function edt1(f, n, d, v, z) {
  let k = 0;
  v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function edt(src, w, h) {
  // src: Uint8Array (1 = 출발 칸) → Float32Array 거리
  const INF = 1e12, g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = src[i] ? 0 : INF;
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    edt1(f, h, d, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    edt1(f, w, d, v, z);
    for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]);
  }
  return g;
}
/** 여러 출발점 BFS: seed(칸 → 1) 에서 가장 가까운 출발 칸 번호 (8방향, 근사) */
function nearestSeed(seed, w, h, allow) {
  const near = new Int32Array(w * h).fill(-1), q = new Int32Array(w * h);
  let qh = 0, qt = 0;
  for (let i = 0; i < w * h; i++) if (seed[i]) { near[i] = i; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % w, y = (i / w) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (near[j] >= 0 || (allow && !allow[j])) continue;
      near[j] = near[i];
      q[qt++] = j;
    }
  }
  return near;
}

/* ---------- 부위 경계 다듬기: 반지름 r 안에서 가장 많은 부위로 (실루엣은 그대로) → 계단 모양 경계를 매끈하게 ---------- */
function smoothLabels(label, W, r) {
  const nL = PARTS.length, best = new Float32Array(W * W), out = label.slice();
  const tmp = new Float32Array(W * W), acc = new Float32Array(W * W);
  for (let L = 1; L < nL; L++) {
    let any = false;
    for (let i = 0; i < W * W; i++) if (label[i] === L) { any = true; break; }
    if (!any) continue;
    // 가로 상자 합
    for (let y = 0; y < W; y++) {
      let s = 0;
      const row = y * W;
      for (let x = -r; x < W; x++) {
        if (x + r < W && label[row + x + r] === L) s++;
        if (x - r - 1 >= 0 && label[row + x - r - 1] === L) s--;
        if (x >= 0) tmp[row + x] = s;
      }
    }
    // 세로 상자 합
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y < W; y++) {
        if (y + r < W) s += tmp[(y + r) * W + x];
        if (y - r - 1 >= 0) s -= tmp[(y - r - 1) * W + x];
        if (y >= 0) acc[y * W + x] = s;
      }
    }
    for (let i = 0; i < W * W; i++) if (label[i] && acc[i] > best[i]) { best[i] = acc[i]; out[i] = L; }
  }
  label.set(out);
}

/* ---------- 작은 부위 조각 없애기: 같은 부위로 이어진 덩어리가 minA 칸보다 작으면 둘레에 가장 많은 부위로 ----------
   (예: 공룡 꼬리 뿔 끝이 앞에서 몇 칸만 보임 → 칠하기 힘든 부스러기 영역이 생기지 않게) */
function dropSpecks(label, W, minA) {
  const seen = new Uint8Array(W * W), st = new Int32Array(W * W), fix = [];
  for (let s0 = 0; s0 < W * W; s0++) {
    if (!label[s0] || seen[s0]) continue;
    const L = label[s0];
    let sp = 0, n = 0;
    st[sp++] = s0; seen[s0] = 1;
    const cells = [], around = new Map();
    while (sp) {
      const i = st[--sp], x = i % W;
      n++;
      if (n <= minA) cells.push(i);
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
        if (j < 0 || j >= W * W) continue;
        const b = label[j];
        if (b === L) { if (!seen[j]) { seen[j] = 1; st[sp++] = j; } }
        else if (b) around.set(b, (around.get(b) || 0) + 1);
      }
    }
    if (n < minA && around.size) {
      let best = 0, bn = -1;
      for (const [b, c] of around) if (c > bn) { bn = c; best = b; }
      fix.push([cells, best]);
    }
  }
  for (const [cells, b] of fix) for (const i of cells) label[i] = b;
  return fix.length;
}

/* ---------- 실루엣의 아주 좁은 틈 메우기 (닫힘 연산, 반지름 r 칸) ----------
   (예: 고양이 턱 밑과 어깨 사이 몇 칸짜리 틈 → 도안에 선이 두 줄로 겹쳐 보임) 메운 칸은 가장 가까운 부위로 */
function closeGaps(label, W, r) {
  const fg = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) fg[i] = label[i] ? 1 : 0;
  const dFg = edt(fg, W, W);
  const outD = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) outD[i] = dFg[i] > r ? 1 : 0;
  const dOut = edt(outD, W, W);
  const add = new Uint8Array(W * W);
  let n = 0;
  for (let i = 0; i < W * W; i++) if (!fg[i] && dOut[i] > r + 0.5) { add[i] = 1; n++; }
  if (!n) return 0;
  const near = nearestSeed(fg, W, W, null);
  for (let i = 0; i < W * W; i++) if (add[i]) label[i] = label[near[i]];
  return n;
}

/* ---------- 얇은 띠 없애기 (부위별 열림 연산을 한 번에) ----------
   경계(다른 부위·바깥과 닿은 칸)에서 r 보다 먼 칸 = 속. 모든 칸을 '가장 가까운 속 칸'의 부위로 다시 정함
   → 폭 2r 보다 얇은 띠(예: 고양이 턱 밑 실 같은 띠)는 옆 부위로 흡수, 두꺼운 부위 경계는 그대로 */
function openLabels(label, W, r) {
  const edge = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) {
    const L = label[i];
    if (!L) continue;
    const x = i % W;
    if ((x > 0 && label[i - 1] !== L) || (x < W - 1 && label[i + 1] !== L) || (i >= W && label[i - W] !== L) || (i < W * W - W && label[i + W] !== L)) edge[i] = 1;
  }
  const d = edt(edge, W, W), core = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) core[i] = label[i] && d[i] > r ? 1 : 0;
  const near = nearestSeed(core, W, W, null), out = label.slice();
  for (let i = 0; i < W * W; i++) if (label[i] && near[i] >= 0) out[i] = label[near[i]];
  label.set(out);
}

/* ---------- 정면 직교 래스터: 칸마다 가장 앞(z 최대) 깊이 ---------- */
function rasterFront(pos, idx, spec, W) {
  const k = (spec.K * W) / S, cx = (spec.CX * W) / S, oy = (spec.OY * W) / S;
  const depth = new Float32Array(W * W).fill(-1e9);
  const n = idx.length / 3;
  for (let t = 0; t < n; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const x0 = cx + pos[a] * k, y0 = oy - pos[a + 1] * k, z0 = pos[a + 2];
    const x1 = cx + pos[b] * k, y1 = oy - pos[b + 1] * k, z1 = pos[b + 2];
    const x2 = cx + pos[c] * k, y2 = oy - pos[c + 1] * k, z2 = pos[c + 2];
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-9) continue;
    const minx = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxx = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
    const miny = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxy = Math.min(W - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let py = miny; py <= maxy; py++) {
      const sy = py + 0.5;
      for (let px = minx; px <= maxx; px++) {
        const sx = px + 0.5;
        const w0 = ((x1 - sx) * (y2 - sy) - (x2 - sx) * (y1 - sy)) / area;
        const w1 = ((x2 - sx) * (y0 - sy) - (x0 - sx) * (y2 - sy)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const zz = w0 * z0 + w1 * z1 + w2 * z2, i = py * W + px;
        if (zz > depth[i]) depth[i] = zz;
      }
    }
  }
  return depth;
}

/* ---------- 굽기 본체 ---------- */
/** opt.W: 도안 크기 (기본 1024. 3D 에만 쓰는 다른 종은 512 로 약 4배 빨리) */
function bake(model, spec = DOG, opt = {}) {
  const t0 = performance.now();
  const pos = model.POSITION, idx = model.index, nv = pos.length / 3;
  const W = opt.W || S, f = W / S;
  const K = spec.K * f, CX = spec.CX * f, OY = spec.OY * f;
  // 앞에서 안 보이는 부위 → 다른 부위 색 (예: 강아지 꼬리 → 몸)
  const mergeTo = PARTS.map((n, i) => (spec.merge && spec.merge[n] ? P[spec.merge[n]] : i));
  const depth = rasterFront(pos, idx, spec, W);
  const label = new Uint8Array(W * W);
  for (let py = 0; py < W; py++)
    for (let px = 0; px < W; px++) {
      const i = py * W + px;
      if (depth[i] < -1e8) continue;
      label[i] = mergeTo[spec.part((px + 0.5 - CX) / K, (OY - py - 0.5) / K, depth[i])];
    }
  smoothLabels(label, W, Math.max(2, Math.round((spec.smooth || 5) * f)));
  closeGaps(label, W, 5 * f);
  openLabels(label, W, 4.5 * f);
  const specks = dropSpecks(label, W, Math.round(1400 * f * f));
  // 경계: 바깥(실루엣) / 안쪽(부위 사이)
  const outB = new Uint8Array(W * W), inB = new Uint8Array(W * W);
  for (let y = 0; y < W - 1; y++)
    for (let x = 0; x < W - 1; x++) {
      const i = y * W + x, a = label[i];
      for (const j of [i + 1, i + W]) {
        const b = label[j];
        if (a === b) continue;
        if (!a || !b) { outB[a ? i : j] = 1; } else { inB[i] = 1; inB[j] = 1; }
      }
    }
  const dOut = edt(outB, W, W), dIn = edt(inB, W, W);
  // 선 굵기 (도안 칸 기준): 바깥 8, 안쪽 5.5 (반지름 4 / 2.75)
  const LW_OUT = 4.2 * f, LW_IN = 2.9 * f;
  const lineC = document.createElement("canvas");
  lineC.width = lineC.height = W;
  const lg = lineC.getContext("2d");
  const im = lg.createImageData(W, W);
  for (let i = 0; i < W * W; i++) {
    const a = Math.max(Math.min(1, Math.max(0, LW_OUT - dOut[i] + 0.5)), Math.min(1, Math.max(0, LW_IN - dIn[i] + 0.5)));
    if (a <= 0) continue;
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 34;
    im.data[i * 4 + 3] = Math.round(a * 255);
  }
  lg.putImageData(im, 0, 0);
  lg.save();
  lg.scale(f, f);
  drawFace(lg, spec, "sheet");
  lg.restore();
  // 선 지도 (칠하기 막힘)
  const la = lg.getImageData(0, 0, W, W).data;
  const line = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) line[i] = la[i * 4 + 3] > 110 ? 1 : 0;

  // 칠하기 영역: 선이 아닌 칸의 4방향 연결 덩어리 (실루엣 안만)
  const region = new Int32Array(W * W).fill(-1);
  const stack = new Int32Array(W * W);
  let nReg = 0;
  const regPart = [];
  for (let s = 0; s < W * W; s++) {
    if (region[s] >= 0 || line[s] || !label[s]) continue;
    let sp = 0;
    stack[sp++] = s;
    region[s] = nReg;
    const cnt = {};
    while (sp) {
      const i = stack[--sp], x = i % W;
      cnt[label[i]] = (cnt[label[i]] || 0) + 1;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
      for (const j of nb) {
        if (j < 0 || j >= W * W || region[j] >= 0 || line[j] || !label[j]) continue;
        region[j] = nReg;
        stack[sp++] = j;
      }
    }
    regPart.push(+Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]);
    nReg++;
  }
  // 아주 작은 영역(선 사이 틈 — 손가락으로 못 채움)은 따로 두지 않고 가까운 큰 영역에 붙임
  const regArea = new Int32Array(nReg);
  for (let i = 0; i < W * W; i++) if (region[i] >= 0) regArea[region[i]]++;
  const minReg = Math.round(500 * f * f);
  let tiny = 0;
  for (let r = 0; r < nReg; r++) if (regArea[r] < minReg) tiny++;
  // 선 칸(실루엣 안·선 위)도 가까운 영역에 붙여 채울 때 같이 칠함 → 3D 에 흰 이음매가 안 생김
  const seedR = new Uint8Array(W * W), allowR = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) { seedR[i] = region[i] >= 0 && regArea[region[i]] >= minReg ? 1 : 0; allowR[i] = region[i] >= 0 || line[i] || label[i] ? 1 : 0; }
  const nr = nearestSeed(seedR, W, W, allowR);
  const fillOf = new Int32Array(W * W).fill(-1);
  for (let i = 0; i < W * W; i++) if (nr[i] >= 0 && (label[i] || line[i])) fillOf[i] = region[nr[i]];
  // 영역별 칸 목록 (CSR)
  const cnt = new Int32Array(nReg + 1);
  for (let i = 0; i < W * W; i++) if (fillOf[i] >= 0) cnt[fillOf[i] + 1]++;
  for (let r = 0; r < nReg; r++) cnt[r + 1] += cnt[r];
  const list = new Int32Array(cnt[nReg]), fillPos = cnt.slice();
  for (let i = 0; i < W * W; i++) if (fillOf[i] >= 0) list[fillPos[fillOf[i]]++] = i;

  // 텍스처 번지기: 실루엣 밖 칸 → 가장 가까운 실루엣 안 칸 (실루엣 가장자리 2칸 안쪽에서 가져옴: 선 자국 피함)
  const inner = new Uint8Array(W * W);
  for (let i = 0; i < W * W; i++) inner[i] = label[i] && dOut[i] > 2.5 * f ? 1 : 0;
  const bleed = nearestSeed(inner, W, W, null);

  // 부위별 '가장 가까운 보이는 칸' (반 크기, 선 피해서 4칸 안쪽)
  const H = W / 2, nearPart = {};
  for (let L = 1; L < PARTS.length; L++) {
    const sd = new Uint8Array(H * H);
    let any = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < H; x++) {
      const i = y * 2 * W + x * 2;
      if (label[i] === L && dIn[i] > 5 * f && dOut[i] > 5 * f) { sd[y * H + x] = 1; any = 1; }
    }
    if (any) nearPart[L] = nearestSeed(sd, H, H, null);
  }

  // 정점마다: 부위, UV, 가중치
  const part = new Uint8Array(nv), uv = new Float32Array(nv * 2), fixed = new Uint8Array(nv);
  for (let v = 0; v < nv; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let L = spec.part(x, y, z);
    part[v] = L;
    L = mergeTo[L];
    let px = CX + x * K, py = OY - y * K;
    const ix = Math.min(W - 1, Math.max(0, px | 0)), iy = Math.min(W - 1, Math.max(0, py | 0));
    const vis = label[iy * W + ix];
    // 이 정점이 앞에서 보이는 그 부위인가? (같은 부위면 앞·뒤 모두 그대로 = 거울)
    if (vis !== L && nearPart[L]) {
      const hi = ((iy >> 1) * H + (ix >> 1)), n = nearPart[L][hi];
      if (n >= 0) { px = (n % H) * 2 + 1; py = ((n / H) | 0) * 2 + 1; fixed[v] = 1; }
    }
    uv[v * 2] = px / W;
    uv[v * 2 + 1] = 1 - py / W;
  }
  const weights = makeWeights(model, part, spec);
  // 부위별 보이는 범위 (모델 좌표) — 예시 그림이 부위 기준으로 그리게
  const box = {};
  for (let i = 0; i < W * W; i++) {
    const L = label[i];
    if (!L) continue;
    const x = ((i % W) + 0.5 - CX) / K, y = (OY - ((i / W) | 0) - 0.5) / K;
    const b = box[PARTS[L]] || (box[PARTS[L]] = { x0: 9, x1: -9, y0: 9, y1: -9, sx: 0, sy: 0, n: 0 });
    if (x < b.x0) b.x0 = x;
    if (x > b.x1) b.x1 = x;
    if (y < b.y0) b.y0 = y;
    if (y > b.y1) b.y1 = y;
    b.sx += x; b.sy += y; b.n++;
  }
  for (const k in box) { const b = box[k]; b.cx = b.sx / b.n; b.cy = b.sy / b.n; }
  return {
    S: W, f, spec, label, line, lineC, region, fillOf, regPart, nReg, regStart: cnt, regList: list, bleed, uv, part, fixed, weights, box,
    X: (x) => CX + x * K, Y: (y) => OY - y * K,
    ms: Math.round(performance.now() - t0),
    stats: { fixedVerts: fixed.reduce((a, b) => a + b, 0), regions: nReg - tiny, tiny, specks },
  };
}

/* ---------- 움직임 가중치: 부위 표시를 이웃 평균으로 부드럽게 (이음매 찢어짐 방지) ---------- */
function makeWeights(model, part, spec) {
  const pos = model.POSITION, idx = model.index, nv = pos.length / 3;
  const nb = Array.from({ length: nv }, () => []);
  for (let t = 0; t < idx.length; t += 3)
    for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]], [idx[t + 2], idx[t]]]) { nb[a].push(b); nb[b].push(a); }
  // 채널: armR, armL, legR, legL, earR, earL, 머리 묶음(귀·주둥이·갈기·머리 뿔), 흔들기(꼬리 — 코끼리는 코)
  // 뿔(spike)은 목(머리 중심점) 위면 머리와 함께, 아래(등·꼬리)면 꼬리와 함께 움직임
  const neckY = spec.pivot.head[1];
  const swingPart = spec.swing ? P[spec.swing] : P.tail;
  const HEAD = [P.head, P.earR, P.earL, P.snout, P.mane];
  const inHead = (v) => HEAD.includes(part[v]) || (part[v] === P.spike && pos[v * 3 + 1] > neckY);
  const inSwing = (v) => part[v] === swingPart || (part[v] === P.spike && pos[v * 3 + 1] <= neckY);
  const ch = [[P.armR], [P.armL], [P.legR], [P.legL], [P.earR], [P.earL], inHead, inSwing];
  const out = ch.map((set) => {
    let w = new Float32Array(nv);
    for (let v = 0; v < nv; v++) w[v] = (typeof set === "function" ? set(v) : set.includes(part[v])) ? 1 : 0;
    for (let k = 0; k < 6; k++) {
      const n = new Float32Array(nv);
      for (let v = 0; v < nv; v++) {
        let s = w[v];
        for (const j of nb[v]) s += w[j];
        n[v] = s / (nb[v].length + 1);
      }
      w = n;
    }
    return w;
  });
  const A = new Float32Array(nv * 4), B = new Float32Array(nv * 4);
  for (let v = 0; v < nv; v++) for (let k = 0; k < 4; k++) { A[v * 4 + k] = out[k][v]; B[v * 4 + k] = out[k + 4][v]; }
  return { A, B };
}

/* ---------- 얼굴 (도안: 검은 선/칠, 3D: 얼굴 덧칠 텍스처) — 그림 좌표는 S=1024 기준 ---------- */
function drawFace(g, spec, mode) {
  const F = spec.face, X = (x) => spec.CX + x * spec.K, Y = (y) => spec.OY - y * spec.K, L = (l) => l * spec.K;
  const sheet = mode === "sheet";
  g.save();
  const ink = sheet ? "#222" : "#1d1714", soft = sheet ? ink : "#4a3631";
  g.fillStyle = ink;
  g.strokeStyle = ink;
  g.lineCap = g.lineJoin = "round";
  // 눈
  for (const [x, y] of F.eyes) {
    g.beginPath();
    g.ellipse(X(x), Y(y), L(F.eyeR[0]), L(F.eyeR[1]), 0, 0, Math.PI * 2);
    g.fill();
    if (!sheet) {
      g.fillStyle = "rgba(255,255,255,.9)";
      g.beginPath();
      g.arc(X(x) - L(F.eyeR[0]) * 0.35, Y(y) - L(F.eyeR[1]) * 0.4, L(F.eyeR[0]) * 0.28, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = ink;
    }
  }
  // 코: tri(둥근 역삼각형) · oval · pig(콧구멍 둘, 돼지) · dots(작은 콧구멍) · none
  const N = F.nose || { type: "none" };
  const nx = X(N.x || 0), ny = Y(N.y || 0), nw = L(N.w || 0) / 2, nh = L(N.h || 0) / 2;
  g.fillStyle = soft;
  if (N.type === "tri" || N.type === "oval") {
    g.beginPath();
    if (N.type === "tri") {
      g.moveTo(nx - nw, ny - nh * 0.7);
      g.quadraticCurveTo(nx, ny - nh * 1.35, nx + nw, ny - nh * 0.7);
      g.quadraticCurveTo(nx + nw * 0.9, ny + nh * 0.2, nx, ny + nh);
      g.quadraticCurveTo(nx - nw * 0.9, ny + nh * 0.2, nx - nw, ny - nh * 0.7);
    } else g.ellipse(nx, ny, nw, nh, 0, 0, Math.PI * 2);
    g.fill();
  } else if (N.type === "pig" || N.type === "dots") {
    if (!sheet) g.fillStyle = N.type === "pig" ? "#8a4f55" : "#4a3631";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(nx + (s * L(N.gap)) / 2, ny, nw, nh, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // 입: w(ω, 코 밑 줄 포함) · smile(웃는 선) · none
  const M = F.mouth || { type: "none" };
  g.lineWidth = sheet ? 5.5 : 6;
  g.strokeStyle = soft;
  if (M.type === "w") {
    const my = Y(M.y), mw = L(M.w), mh = L(M.h), top = Y(M.top);
    g.beginPath();
    g.moveTo(nx, ny + nh);
    g.lineTo(nx, top + 2);
    g.moveTo(nx - mw, my - mh * 0.6);
    g.quadraticCurveTo(nx - mw * 0.5, my + mh * 1.2, nx, top);
    g.quadraticCurveTo(nx + mw * 0.5, my + mh * 1.2, nx + mw, my - mh * 0.6);
    g.stroke();
  } else if (M.type === "smile") {
    const mx = X(M.x || 0), my = Y(M.y), mw = L(M.w), mh = L(M.h);
    g.beginPath();
    g.moveTo(mx - mw, my - mh * 0.5);
    g.quadraticCurveTo(mx, my + mh * 1.5, mx + mw, my - mh * 0.5);
    g.stroke();
  }
  // 발가락 줄 (도안에만)
  if (sheet && F.toes) {
    g.lineWidth = 4.5;
    for (const s of [-1, 1])
      for (const [x, y] of F.toes) {
        g.beginPath();
        g.moveTo(X(s * x), Y(y + 0.004));
        g.lineTo(X(s * x), Y(y + F.toeH));
        g.stroke();
      }
  }
  g.restore();
}
/** 3D 얼굴 덧칠 텍스처 (같은 종이 같이 씀) */
function faceCanvas(spec = DOG) {
  const c = document.createElement("canvas");
  c.width = c.height = S;
  drawFace(c.getContext("2d"), spec, "3d");
  return c;
}

/* 아주 작은 GLB 읽기 (한 메시·한 프리미티브, 압축 없음) — GLTFLoader 를 들이지 않으려고 직접 읽음
   models/<종>.glb 는 lab/doll/pipeline/clean.js 가 만든 파일: POSITION, NORMAL, _AO(정점 그늘, 0~255) */
const CT = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
async function loadGLB(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("모델을 못 읽었어요: " + url);
  const buf = await r.arrayBuffer();
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("GLB 가 아니에요");
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const binOff = 20 + jl + 8;
  const acc = (i) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
    const T = CT[a.componentType], n = a.count * NC[a.type];
    const s = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new T(buf.slice(s, s + n * T.BYTES_PER_ELEMENT));
  };
  const p = json.meshes[0].primitives[0];
  const out = { index: acc(p.indices), extras: json.meshes[0].extras || {} };
  for (const k in p.attributes) out[k] = acc(p.attributes[k]);
  return out;
}

  KP.DOLL = Object.assign(KP.DOLL || {}, { PARTS, P, SPECIES, ORDER, S, edt, nearestSeed, bake, makeWeights, drawFace, faceCanvas, loadGLB });
})();

;

/* ==== js/games/make/doll.js ==== */
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
    /** '다 칠했다'·열쇠 별 판정에 쓰는 큰 영역 수 (blank() 와 같은 기준) */
    function bigRegions() {
      let n = 0;
      for (let r = 0; r < B.nReg; r++) if (B.regStart[r + 1] - B.regStart[r] >= 1500 * B.f * B.f) n++;
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
      st, wrap, B, reset, compose, cutout, isEmpty, blank, bigRegions, magic, clear, back, layers, setLayers, box: mask.box,
      canUndo: () => undo.length > 0,
      destroy() {
        undo.length = 0;
        wrap.remove();
        for (const c of [fillC, crayC, lineC]) c.width = c.height = 1; // 메모리 바로 돌려줌 (iPad)
      },
    };
  };
})();

;

/* ==== js/games/make/draw.js ==== */
/* 그림 그리기 — 크레용·사인펜·무지개펜·반짝이펜·도장·지우개
   - 고해상도 캔버스(종이 층 + 그림 층), 굵기 3단계, 색 14가지, 종이 4종
   - 되돌리기 최근 20번(획을 기록해 다시 그림 → 메모리 적게 씀), 다 지우기(꾹)도 되돌리기 가능
   - 💾 저장 → 내 작품(kind "draw"), 나갈 때·그리다 멈출 때 자동 임시저장 → 다시 들어오면 복원
   - 갤러리 '이어 그리기'(KP.pendingDraw) 지원 */
"use strict";
KP.game({
  id: "draw",
  icon: "✏️",
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
      /* 태블릿 세로(큰 세로 화면, 2026-11-09): 폰 규칙 그대로라 색 50·단추 56px → 64px 이상 */
      @media (orientation:portrait) and (min-width:700px){
        .dw{--tb:72px;--sw:64px;--ab:64px;padding-top:8px}
        .dw-pal,.dw-pal.mine3{grid-template-columns:repeat(7,var(--sw));gap:10px 14px}
      }
      /* 폰 세로(2026-11-08): 도구 6 + 굵기 3 + 단추 4 를 한 줄 5칸씩 3줄로(가운데 맞춤) → 모두 폰에서 64px 안팎.
         (도구·굵기·단추 묶음은 display:contents 로 풀어서 .dw 의 10칸 격자에 2칸씩 차지) */
      @media (orientation:portrait) and (max-width:480px){
        .dw{--ab:clamp(46px,min(calc((100vw - 64px) / 5),7.7vh),72px);--tb:var(--ab);--sw:clamp(46px,min(calc((100vw - 64px) / 5),7.7vh),72px);
          gap:6px;padding:2px 8px 8px;grid-template-columns:repeat(10,minmax(0,1fr));grid-template-rows:repeat(3,auto) minmax(0,1fr) auto;grid-template-areas:none}
        .dw-tools,.dw-sizes,.dw-acts{display:contents}
        .dw-tools > *,.dw-sizes > *,.dw-acts > *{grid-column:span 2;justify-self:center}
        .dw-acts > :nth-child(2){grid-column:3 / span 2}
        .dw-tool{border-radius:18px}
        .dw-tool.sel{transform:none}
        .dw .board{grid-column:1 / -1;grid-row:4}
        .dw-pal,.dw-pal.mine3{grid-column:1 / -1;grid-row:5;grid-template-columns:repeat(5,var(--sw));gap:6px 8px}
      }
      @media (orientation:landscape) and (max-height:500px){
        /* (2026-11-09) 단추 44px → 도구 64px·색·굵기·단추 56px (키 작은 폰은 조금 작게). 내 물감이 많으면 색 칸만 위아래로 밀기 */
        .dw{gap:6px 8px;padding:0 10px 8px;--tb:min(16.4vh,64px);--sw:min(14.4vh,56px);--ab:min(14.4vh,56px)}
        .dw-tools{display:grid;grid-template-columns:repeat(3,var(--tb));gap:8px;align-content:center;justify-content:center}
        .dw-tool{border-radius:16px}
        .dw-tool.sel{transform:scale(1.04)}
        .dw-sizes{flex-direction:row;gap:8px}
        .dw-pal,.dw-pal.mine3{grid-template-columns:repeat(4,var(--sw));gap:6px;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:5px;align-content:start}
        .dw-acts{grid-template-columns:repeat(4,var(--ab));gap:6px}
      }
      @media (orientation:landscape) and (max-height:500px) and (max-width:720px){
        .dw{--tb:52px;--sw:46px;--ab:46px}
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
      if (speak && !pref.toolTried) {
        pref.toolTried = true;
        savePref();
        if (ctx.toolHinted) ctx.hint(null);
      }
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
    let strokesSince = 0; // 지난 저장 뒤로 그린 획 수 (열쇠 별 기준)
    function commit(op) {
      strokesSince++;
      // 처음 그림을 그린 뒤에도 도구를 한 번도 안 바꿨으면 → 도구 줄(무지개 펜)을 손가락으로 한 번 알려 줌
      if (strokesSince === 3 && !pref.toolTried && !ctx.toolHinted) {
        ctx.toolHinted = true;
        ctx.hint(() => toolBtns.rainbow, "눌러 봐요!");
      }
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
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "draw", img, t: Date.now(), date: KP.gate.monthDay() });
      if (ok) {
        flyAway(img, board); // 저장됐을 때만 '내 작품으로 날아가기' (실패해도 날아가서 저장된 줄 알던 것)
        unsaved = false;
        KP.toast("🖼️ 내 작품에 저장했어요!");
        A.sfx("sticker");
        delete bSave.dataset.busy; // 기다리는 중에 나가도 버튼이 잠기지 않게
        // 열쇠 별: 지난 저장 뒤로 6획 이상 그렸을 때만 (점 하나 + 💾 반복 방지)
        const few = strokesSince < 6;
        strokesSince = 0;
        ctx.after(900, async () => {
          if (few) ctx._fewChoice = true;
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
          } else KP.voice.say(innerWidth > innerHeight ? "손가락으로 쓱쓱 그려 봐요!" : "손가락으로 쓱쓱 그려 봐요! 아래에서 색을 골라요."); // 가로 화면은 색이 오른쪽
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

;

/* ==== js/games/make/face.js ==== */
/* 얼굴 꾸미기 — 점토 화장대 거울 앞에서 얼굴색·머리·눈·눈썹·코·입·모자·안경을 골라 꾸미기
   - 무대: 점토 화장대 그림(assets/play-clay/face/bg.jpg)을 잘라 둥근 거울이 크게 보이게, 얼굴은 거울 속에 비침
   - 모든 부위를 SVG 로 직접 그림 + 점토 느낌(부드러운 음영 그라디언트·하이라이트·약한 결·바닥 그림자) — 필터 없이(저가 기기)
     보기 단추에는 '그 부위를 바꾼 얼굴'이 같은 점토 모양으로 미리 보임
   - 부위마다 다른 반응: 코 에취(돼지 코는 꿀꿀) · 볼 빨개지며 수줍 · 눈·눈썹·안경 윙크 · 입 노래/깔깔 · 머리·모자 들썩 · 귀 쫑긋 · 옷 간지럼
   - 🎲 랜덤(새 얼굴), 📸 사진 찍기 → 내 작품(kind "face", 부위 설정 cfg 도 함께) + 친구 앨범에 폴라로이드로 걸림
   - 친구 앨범: 꾸민 얼굴 여러 명(부위 설정째 저장 → 다시 꺼내 고치기), 가족 칸(아빠·엄마·나·아기·할머니·할아버지 — 그림 표시), 가족 사진
   저장(KP.store — 백업·복원 okKey 규칙 "face:..." 에 맞음):
     face:cfg      지금 꾸미는 얼굴 {skin,hair,hairC,eyes,brows,nose,mouth,hat,glasses,shirt}
     face:cur      지금 고치는 앨범 친구 id (없으면 null = 새 얼굴) · face:who 새 얼굴을 찍으면 걸 가족 칸(선택)
     face:friends  [{id, who, t, cfg}] 최대 MAXF 명 (꽉 차면 가족 칸이 아닌 가장 오래된 친구부터 내려감)
     사진(JPEG)은 KP.db "art" {id, kind:"face", img, t, date, cfg, fid, who} — 예전 사진(cfg 없음)도 그대로 보임 */
"use strict";
KP.game({
  id: "face",
  icon: "🤡",
  name: "얼굴 꾸미기",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    const BG = "assets/play-clay/face/bg.jpg";
    // 배경 그림(1344×752)의 거울: 가운데·안쪽 반지름·전구까지 바깥 반지름 (그림 픽셀)
    const IW = 1344, IH = 752, MX = 673, MY0 = 269, MR = 205, MRO = 236;
    KP.css("face", `
      .fc{flex:1;min-height:0;position:relative;display:grid;gap:12px;padding:0 14px 12px;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr);grid-template-areas:"face panel"}
      .fc-stage{grid-area:face;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);
        background:#f1c8c0 url("${BG}") no-repeat;background-size:cover;background-position:50% 30%}
      .fc-mirror{position:absolute;left:0;top:0;border-radius:50%;overflow:hidden;touch-action:none;
        background:radial-gradient(circle at 44% 34%,#fffdf8 0,#fbefe6 46%,#f1d9cc 100%);box-shadow:inset 0 0 0 3px rgba(190,120,110,.35)}
      .fc-mirror svg{position:absolute;inset:0;width:100%;height:100%;display:block}
      .fc-glass{position:absolute;inset:0;border-radius:50%;pointer-events:none;
        background:linear-gradient(128deg,rgba(255,255,255,0) 22%,rgba(255,255,255,.26) 28%,rgba(255,255,255,0) 35%,rgba(255,255,255,0) 70%,rgba(255,255,255,.14) 74%,rgba(255,255,255,0) 78%);
        box-shadow:inset 0 0 18px 4px rgba(150,80,70,.22)}
      .fc-mirror .bounce{animation:fcBounce .7s cubic-bezier(.3,1.6,.5,1)}
      @keyframes fcBounce{30%{transform:translateY(-5%) scale(1.04)}60%{transform:scale(.97,1.03)}}
      .fc-mirror g{transform-box:fill-box;transform-origin:center}
      .fc-mirror g.eyes{transition:transform .08s}
      .fc-mirror g.eyes.blink{transform:scaleY(.12)}
      .fc-mirror g.hat,.fc-mirror g.hairF{transform-origin:50% 100%}
      .fc-mirror g.hop{animation:fcHop .65s cubic-bezier(.3,1.5,.5,1)}
      @keyframes fcHop{35%{transform:translateY(-16%) rotate(-7deg)}62%{transform:translateY(2%) rotate(3deg) scale(1.04,.96)}}
      .fc-mirror g.squish{animation:fcSquish .6s ease-out}
      @keyframes fcSquish{30%{transform:scale(1.06,.9)}60%{transform:scale(.97,1.05)}}
      .fc-mirror g.ear{transform-origin:50% 60%}
      .fc-mirror g.perk{animation:fcPerk .8s ease-out}
      @keyframes fcPerk{25%{transform:scale(1.35) rotate(var(--r,8deg))}50%{transform:scale(1.15) rotate(calc(var(--r,8deg) * -1))}75%{transform:scale(1.25)}}
      .fc-mirror g.all{transform-origin:50% 60%}
      .fc-mirror g.all.sneeze{animation:fcSneeze .55s cubic-bezier(.2,1.4,.4,1)}
      @keyframes fcSneeze{0%{transform:scale(.97) translateY(1%)}30%{transform:scale(1.07) translateY(-3%)}60%{transform:scale(.99)}}
      .fc-mirror g.all.shy{animation:fcShy 1.3s ease-in-out}
      @keyframes fcShy{20%{transform:rotate(-5deg) translateY(1%)}45%{transform:rotate(4deg)}70%{transform:rotate(-3deg)}}
      .fc-mirror g.all.tickle{animation:fcTickle .7s linear}
      @keyframes fcTickle{15%,45%,75%{transform:rotate(-3deg)}30%,60%,90%{transform:rotate(3deg)}}
      .fc-mirror g.all.sing{animation:fcSing .3s ease-in-out}
      @keyframes fcSing{50%{transform:translateY(-1.5%) rotate(2deg)}}
      .fc-mirror g.cheeks{transition:opacity .25s}
      .fc-mirror g.cheeks.hot{opacity:1!important}
      .fc-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:6}
      .fc-flash.on{animation:fcFlash .5s ease-out}
      @keyframes fcFlash{from{opacity:1}to{opacity:0}}
      .fc-badge{position:absolute;left:10px;top:10px;z-index:5;width:clamp(52px,9vmin,72px);height:clamp(52px,9vmin,72px);border-radius:50%;background:rgba(255,250,244,.92);box-shadow:0 4px 0 rgba(120,70,60,.18);display:none;align-items:center;justify-content:center;font-size:clamp(30px,5.4vmin,44px)}
      .fc-badge.on{display:flex;animation:popIn .35s backwards}
      .fc-note{font-size:clamp(26px,4.4vmin,40px)}
      .fc-panel{grid-area:panel;min-height:0;display:flex;flex-direction:column;gap:10px}
      .fc-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;flex:0 0 auto}
      .fc-tab{height:clamp(54px,8vh,68px);border-radius:18px;background:rgba(255,255,255,.75);font-size:clamp(28px,4.4vh,38px);display:flex;align-items:center;justify-content:center;border-bottom:5px solid transparent;transition:transform .12s}
      .fc-tab.sel{background:#fff;border-bottom-color:var(--cat);box-shadow:var(--shadow);transform:translateY(-2px)}
      .fc-tab.hc{display:none}
      .fc-opts{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:8px;background:rgba(255,236,228,.6);border-radius:22px;padding:8px}
      .fc-opt{background:radial-gradient(circle at 45% 35%,#fffdf9,#f7e9e1);border-radius:16px;box-shadow:0 4px 0 rgba(140,80,70,.14);display:flex;align-items:center;justify-content:center;padding:2px;min-height:0;overflow:hidden;animation:itemIn .3s backwards;animation-delay:calc(var(--i) * 25ms)}
      .fc-opt svg{width:100%;height:100%;max-height:100%}
      .fc-opt.sel{box-shadow:0 0 0 4px var(--sun),0 4px 0 #d9a000;background:#fff8dc}
      .fc-opt:active{transform:scale(.95)}
      .fc-colors{display:flex;gap:8px;justify-content:center;flex:0 0 auto}
      .fc-col{width:clamp(36px,5.4vh,46px);height:clamp(36px,5.4vh,46px);border-radius:50%;border:4px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.14);background-image:radial-gradient(circle at 35% 30%,rgba(255,255,255,.55),rgba(255,255,255,0) 45%,rgba(0,0,0,.18))!important}
      .fc-col.sel{transform:scale(1.15);box-shadow:0 0 0 3px var(--ink)}
      .fc-acts{display:flex;gap:10px;justify-content:center;flex:0 0 auto}
      .fc-act{font-size:clamp(20px,2.6vw,26px);padding:10px 18px;min-height:64px;white-space:nowrap}
      .fc-act .e{font-size:1.5em}
      /* 사진 줄 (폴라로이드) */
      .fc-line{position:relative;flex:0 0 auto;height:clamp(84px,12vh,112px);display:none}
      .fc-line .rope{position:absolute;left:0;top:0;width:100%;height:40px;pointer-events:none}
      .fc-pols{position:absolute;inset:0;display:flex;gap:10px;padding:0 10px;align-items:flex-start}
      .fc-pol{box-sizing:border-box;position:relative;flex:0 0 auto;height:calc(100% - 6px);aspect-ratio:.84;margin-top:6px;background:#fffdf7;border-radius:6px;padding:6px 6px 18px;box-shadow:0 4px 6px rgba(110,60,50,.22);transform:rotate(var(--rot,0deg));transform-origin:50% 0}
      .fc-pol .ph{width:100%;height:100%;border-radius:3px;background:linear-gradient(#cfe6d5,#b6d4c0);overflow:hidden;position:relative}
      .fc-pol .ph svg{width:100%;height:100%;display:block}
      .fc-pol .pin{position:absolute;left:50%;top:-7px;width:12px;height:20px;margin-left:-6px;border-radius:3px;background:linear-gradient(90deg,#f39ab3,#e57d99);box-shadow:0 1px 0 rgba(0,0,0,.15)}
      .fc-pol .who{position:absolute;right:-6px;bottom:-6px;font-size:26px;line-height:1}
      .fc-pol.new{animation:fcSwing 1.2s ease-out}
      @keyframes fcSwing{0%{transform:rotate(-16deg)}30%{transform:rotate(10deg)}55%{transform:rotate(-6deg)}80%{transform:rotate(3deg)}}
      .fc-pol.empty{background:rgba(255,253,247,.5);box-shadow:none;border:3px dashed rgba(200,140,130,.5)}
      .fc-pol.empty .ph{background:none;display:flex;align-items:center;justify-content:center;font-size:34px;opacity:.5}
      .fc-fly{position:fixed;z-index:90;pointer-events:none;background:#fffdf7;border-radius:8px;padding:12px 12px 40px;box-shadow:0 10px 20px rgba(80,40,30,.3);transition:transform .85s cubic-bezier(.45,-0.2,.5,1),opacity .85s;transform-origin:50% 50%}
      .fc-fly img{width:100%;height:100%;object-fit:cover;border-radius:4px;display:block}
      /* 덮개 화면 (앨범 · 누구예요?) */
      .fc-ov{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-radius:28px;
        background:#f6d9d2 url("${BG}") no-repeat;background-size:cover;background-position:85% 20%;animation:fadeIn .25s}
      .fc-ov:before{content:"";position:absolute;inset:0;border-radius:inherit;background:rgba(255,244,238,.72);pointer-events:none}
      .fc-ov>*{position:relative}
      .fc-fam{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;flex:0 0 auto;background:rgba(255,255,255,.55);border-radius:20px;padding:12px 10px 8px}
      .fc-fam .fc-pol,.fc-grid .fc-pol{height:auto;width:100%;margin:0;cursor:pointer}
      .fc-fam .fc-pol .ph{aspect-ratio:1/1;height:auto}
      .fc-fam .fc-slot{display:flex;flex-direction:column;align-items:center;gap:4px}
      .fc-fam .tag{font-size:clamp(26px,4vmin,36px);line-height:1}
      .fc-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(92px,15vmin,130px),1fr));gap:16px 12px;align-content:start;padding:10px 6px}
      .fc-grid .fc-pol .ph{aspect-ratio:1/1;height:auto}
      .fc-obar{display:flex;gap:10px;justify-content:center;flex:0 0 auto;flex-wrap:wrap}
      .fc-obar .btn{min-height:64px;font-size:clamp(20px,2.6vw,26px);padding:8px 18px}
      .fc-obar .btn .e{font-size:1.4em}
      .fc-pick{flex-direction:row;align-items:center;justify-content:center;gap:clamp(16px,4vw,48px)}
      .fc-snap{position:relative;flex:0 0 auto;width:min(38vmin,300px);transform:rotate(-3deg);animation:popIn .4s backwards}
      .fc-snap img{width:100%;display:block;border-radius:8px;box-shadow:0 10px 18px rgba(90,40,30,.28)}
      .fc-snap .pin{position:absolute;left:50%;top:-10px;width:18px;height:30px;margin-left:-9px;border-radius:4px;background:linear-gradient(90deg,#f39ab3,#e57d99)}
      .fc-side{display:flex;flex-direction:column;align-items:center;gap:12px;flex:0 1 auto}
      .fc-pick .q{font-size:clamp(40px,7vmin,60px);line-height:1;animation:wig 1.6s ease-in-out infinite}
      .fc-whos{display:grid;grid-template-columns:repeat(4,auto);gap:12px}
      .fc-whos .btn{width:clamp(72px,12vmin,104px);height:clamp(72px,12vmin,104px);padding:4px;font-size:clamp(36px,6.4vmin,58px);border-radius:22px;display:flex;align-items:center;justify-content:center;animation:popIn .35s backwards;animation-delay:calc(var(--i) * 50ms)}
      .fc-empty{grid-column:1/-1;text-align:center;font-size:clamp(40px,8vmin,64px);opacity:.55;padding:20px}
      @media (min-width:600px) and (min-height:600px){.fc-line{display:block}}
      @media (max-aspect-ratio:1/1){
        .fc{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(170px,1fr) auto;grid-template-areas:"face" "panel";gap:8px;padding:0 10px 10px}
        .fc-panel{gap:7px}
        .fc-tabs{grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}
        .fc-colors{gap:6px}
        .fc-col{width:min(calc((100vw - 92px) / 8),42px);height:min(calc((100vw - 92px) / 8),42px);border-width:3px}
        .fc-tab{height:56px;font-size:30px;border-radius:14px}
        .fc-opts{grid-auto-rows:clamp(62px,9vh,84px);flex:0 0 auto;padding:6px;gap:6px}
        .fc-act{min-height:56px;padding:8px 14px}
        .fc-fam{grid-template-columns:repeat(3,minmax(0,1fr))}
        .fc-pick{flex-direction:column}
        .fc-snap{width:min(56vw,300px)}
      }
      /* 폰 세로(2026-11-08): 탭 9개(머리 색 탭 추가) 5칸씩 2줄 64px, 작은 머리색 점 줄은 숨김(머리 색 탭이 대신) */
      @media (orientation:portrait) and (max-width:480px){
        .fc-tabs{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
        .fc-tab{height:64px;font-size:30px}
        .fc-tab.hc{display:flex}
        .fc-colors{display:none}
        .fc-opts{grid-auto-rows:clamp(64px,8.8vh,80px)}
        .fc-act{font-size:20px;padding:6px 12px;min-height:64px;min-width:68px}
        .fc-act .t{display:none}
        .fc-act.primary .t{display:inline}
        .fc-obar .btn{font-size:19px;padding:6px 12px;min-height:64px;min-width:64px}
      }
      @media (orientation:portrait) and (max-height:720px){
        .fc{grid-template-rows:minmax(136px,1fr) auto}
        .fc-tab{height:56px;font-size:26px}
        .fc-opts{grid-auto-rows:58px}
        .fc-col{width:40px;height:40px}
        .fc-act{min-height:56px}
      }
      /* 태블릿 세로(큰 세로 화면, 2026-11-09): 폰 크기 그대로라 탭·단추 56px → 72px */
      @media (orientation:portrait) and (min-width:700px){
        .fc-tab{height:72px;font-size:36px}
        .fc-opts{grid-auto-rows:clamp(84px,9vh,110px)}
        .fc-act{min-height:72px;font-size:24px}
        .fc-col{width:64px;height:64px}
        .fc-obar .btn{min-height:72px}
      }
      /* 폰 가로(2026-11-09): 머리색 점 36px·보기 46px·단추 52px 로 작고 보기 둘째 줄이 잘렸음
         → 폰 세로처럼 '🎨 머리 색' 탭을 쓰고(점 줄 숨김), 단추 셋은 오른쪽 세로줄로 빼서 탭·보기가 64px 두 줄씩 다 보이게 */
      @media (orientation:landscape) and (max-height:500px){
        .fc{grid-template-columns:minmax(0,1fr) minmax(300px,44vw) auto;grid-template-rows:auto minmax(0,1fr);grid-template-areas:"face tabs acts" "face opts acts";gap:6px 8px;padding:0 10px 8px}
        .fc-panel{display:contents}
        .fc-tabs{grid-area:tabs;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
        .fc-tab{height:64px;font-size:28px;border-radius:14px}
        .fc-tab.sel{transform:none}
        .fc-tab.hc{display:flex}
        .fc-colors{display:none}
        .fc-opts{grid-area:opts;grid-auto-rows:minmax(64px,1fr);overflow-y:auto;padding:6px;gap:6px}
        .fc-acts{grid-area:acts;flex-direction:column;justify-content:center;gap:8px}
        .fc-act{min-height:64px;min-width:76px;font-size:24px;padding:4px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
        .fc-act .t{display:none}
        .fc-act.primary{min-height:96px}
        .fc-act.primary .t{display:inline;font-size:14px;white-space:normal;word-break:keep-all;text-align:center;line-height:1.15}
        .fc-ov{padding:8px 10px;gap:6px}
        .fc-fam{grid-template-columns:repeat(6,minmax(0,1fr));padding:8px 8px 4px;gap:8px}
        .fc-fam .fc-pol{width:72%}
        .fc-fam .tag{font-size:24px}
        .fc-grid{grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:10px}
        .fc-obar .btn{min-height:64px;min-width:64px;font-size:18px;padding:4px 12px}
        .fc-snap{width:min(46vh,220px)}
        .fc-pick .q{font-size:34px}
        .fc-whos{gap:8px}
        .fc-whos .btn{width:64px;height:64px;font-size:36px}
      }
    `);

    /* ---------- 점토 색칠 도우미 ---------- */
    const INK = "#3b2b2f";
    const SKINS = ["#ffe0c4", "#f6c79f", "#e2a477", "#c48558", "#8f5d3b", "#ffc9de", "#b9e3ff", "#c6efa9"];
    const HAIRC = ["#3b2a20", "#7a4a26", "#e0a83a", "#f2603b", "#8e5cf7", "#2f95f5", "#ff6fae", "#f4f4f4"];
    const SHIRTS = ["#2f95f5", "#ff7452", "#2fb466", "#8a63ee", "#ffc531", "#ff5d8f"];
    const full = (c) => (/^#[0-9a-f]{3}$/i.test(c) ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c).toLowerCase();
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
    const hex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const mixc = (c, t, k) => {
      const a = rgb(c), b = rgb(t);
      return hex(a.map((v, i) => v + (b[i] - v) * k));
    };
    let pfx = "f0_", defs = null, shade = false; // 그리는 중인 SVG 의 id 앞말 · 그라디언트 모음 · 그림자 모드
    let uid = 0;
    const SHC = "#5a2e22"; // 그림자 색
    /** 점토 덩이 색: 왼쪽 위가 밝고 오른쪽 아래가 어두운 둥근 그라디언트 */
    const cl = (c) => {
      if (shade) return SHC;
      if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c)) return c;
      c = full(c);
      const id = pfx + "k" + c.slice(1);
      if (defs && !defs.has(id))
        defs.set(id, '<radialGradient id="' + id + '" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="' + mixc(c, "#fffaf0", 0.5) + '"/><stop offset=".42" stop-color="' + c + '"/><stop offset="1" stop-color="' + mixc(c, "#3a2418", 0.2) + '"/></radialGradient>');
      return "url(#" + id + ")";
    };
    const edge = (c) => (shade ? SHC : /^#/.test(c) ? mixc(full(c), "#3a2418", 0.45) : INK);
    const ink = () => (shade ? SHC : INK);
    /** 말아 붙인 점토 줄(선): 진한 줄 + 위쪽 옅은 하이라이트 */
    const S = (d, w = 6, fill = "none") => {
      if (fill !== "none") return '<path d="' + d + '" fill="' + cl(fill) + '" stroke="' + edge(fill) + '" stroke-width="' + Math.min(w, 4) + '" stroke-linejoin="round" stroke-linecap="round"/>';
      const base = '<path d="' + d + '" fill="none" stroke="' + ink() + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
      if (shade) return base;
      return base + '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="' + (w * 0.3).toFixed(1) + '" stroke-linecap="round" stroke-linejoin="round" transform="translate(' + (-w * 0.1).toFixed(1) + " " + (-w * 0.2).toFixed(1) + ')"/>';
    };
    const C = (cx, cy, r, fill, sw = 0) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + cl(fill) + '"' + (sw ? ' stroke="' + edge(fill) + '" stroke-width="' + Math.min(sw, 4) + '"' : "") + "/>";
    const E = (cx, cy, rx, ry, fill, sw = 0, extra = "") => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + cl(fill) + '"' + (sw ? ' stroke="' + edge(fill) + '" stroke-width="' + Math.min(sw, 4) + '"' : "") + extra + "/>";
    const R = (x, y, w, h, rx, fill, sw = 0, extra = "") => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + cl(fill) + '"' + (sw ? ' stroke="' + edge(fill) + '" stroke-width="' + Math.min(sw, 4) + '"' : "") + extra + "/>";
    /** 반짝 하이라이트 (그림자 모드에서는 없음) */
    const HL = (cx, cy, r, o = 0.85) => (shade ? "" : '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" fill-opacity="' + o + '"/>');
    /** 붙인 부위 아래 옅은 그림자 — 같은 모양을 그림자 색으로 한 번 더 (필터 없이) */
    const shadow = (markup, dx = 3, dy = 6, op = 0.16) => {
      if (!markup) return "";
      shade = true;
      const s = markup();
      shade = false;
      return '<g transform="translate(' + dx + " " + dy + ')" opacity="' + op + '">' + s + "</g>" + markup();
    };

    /* ---------- 부위 그림 ---------- */
    const eyeL = 112,
      eyeR = 188,
      eyeY = 186;
    const heartD = (x, y, s) =>
      "M" + x + " " + (y + s * 0.9) + " C" + (x - s * 1.6) + " " + (y - s * 0.2) + " " + (x - s * 0.7) + " " + (y - s * 1.2) + " " + x + " " + (y - s * 0.35) +
      " C" + (x + s * 0.7) + " " + (y - s * 1.2) + " " + (x + s * 1.6) + " " + (y - s * 0.2) + " " + x + " " + (y + s * 0.9) + "Z";
    const heart = (x, y, s, fill) => (/^#/.test(fill) ? S(heartD(x, y, s), 3, fill) : '<path d="' + heartD(x, y, s) + '" fill="' + (shade ? SHC : fill) + '" stroke="' + ink() + '" stroke-width="3" stroke-linejoin="round"/>');
    const starD = (cx, cy, R0) => {
      const p = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5,
          rad = k % 2 ? R0 * 0.45 : R0;
        p.push((cx + Math.cos(a) * rad).toFixed(1) + "," + (cy + Math.sin(a) * rad).toFixed(1));
      }
      return "M" + p.join(" L") + "Z";
    };
    const starP = (cx, cy, R0, fill, sw = 3) => (/^#/.test(fill) ? S(starD(cx, cy, R0), sw, fill) : '<path d="' + starD(cx, cy, R0) + '" fill="' + (shade ? SHC : fill) + '" stroke="' + ink() + '" stroke-width="' + sw + '" stroke-linejoin="round"/>');
    const bothEyes = (f) => f(eyeL, 1) + f(eyeR, -1);
    const pupil = (x, y, r) => C(x, y, r, INK) + HL(x - r * 0.35, y - r * 0.4, r * 0.34);

    const EYES = [
      ["dot", "점 눈", () => bothEyes((x) => pupil(x, eyeY, 11))],
      ["big", "반짝 눈", () => bothEyes((x) => C(x, eyeY, 21, "#fff", 4) + C(x, eyeY + 2, 13, "#6b4a2e") + C(x, eyeY + 2, 7, INK) + HL(x - 5, eyeY - 4, 4.5, 0.95) + HL(x + 5, eyeY + 7, 2, 0.9))],
      ["happy", "웃는 눈", () => bothEyes((x) => S("M" + (x - 16) + " " + (eyeY + 6) + " Q" + x + " " + (eyeY - 16) + " " + (x + 16) + " " + (eyeY + 6), 7))],
      ["wink", "윙크", () => C(eyeL, eyeY, 21, "#fff", 4) + C(eyeL, eyeY + 2, 12, "#3f7fd8") + C(eyeL, eyeY + 2, 6, INK) + HL(eyeL - 5, eyeY - 4, 4, 0.95) + S("M" + (eyeR - 16) + " " + eyeY + " L" + (eyeR + 14) + " " + (eyeY - 8) + " M" + (eyeR - 16) + " " + eyeY + " L" + (eyeR + 14) + " " + (eyeY + 8), 6)],
      ["star", "별 눈", () => bothEyes((x) => starP(x, eyeY, 21, "#ffd23f") + HL(x - 5, eyeY - 6, 3.5, 0.8))],
      ["heart", "하트 눈", () => bothEyes((x) => heart(x, eyeY + 2, 15, "#ff4f7b") + HL(x - 7, eyeY - 4, 3.5, 0.8))],
      ["sleepy", "졸린 눈", () => bothEyes((x) => S("M" + (x - 17) + " " + eyeY + " Q" + x + " " + (eyeY + 14) + " " + (x + 17) + " " + eyeY, 6) + S("M" + (x - 8) + " " + (eyeY + 10) + " l-3 6 M" + x + " " + (eyeY + 12) + " v7 M" + (x + 8) + " " + (eyeY + 10) + " l3 6", 3))],
      ["googly", "왕눈", () => C(eyeL, eyeY, 24, "#fff", 4) + C(eyeL + 8, eyeY + 8, 11, INK) + HL(eyeL + 5, eyeY + 4, 3.5) + C(eyeR, eyeY, 24, "#fff", 4) + C(eyeR - 9, eyeY - 6, 11, INK) + HL(eyeR - 12, eyeY - 10, 3.5)],
    ];
    // 반응 때만 잠깐 쓰는 눈 (보기에는 없음)
    const EYES_TMP = {
      shut: () => bothEyes((x, s) => S("M" + (x - 15 * s) + " " + (eyeY - 10) + " L" + (x + 9 * s) + " " + eyeY + " L" + (x - 15 * s) + " " + (eyeY + 10), 6)),
      winkR: () => C(eyeL, eyeY, 21, "#fff", 4) + C(eyeL, eyeY + 2, 12, "#6b4a2e") + C(eyeL, eyeY + 2, 6, INK) + HL(eyeL - 5, eyeY - 4, 4, 0.95) + S("M" + (eyeR - 16) + " " + (eyeY + 4) + " Q" + eyeR + " " + (eyeY - 12) + " " + (eyeR + 16) + " " + (eyeY + 4), 6),
    };
    const BROWS = [
      ["none", "없음", () => ""],
      ["normal", "보통", () => S("M92 152 Q112 140 132 150", 7) + S("M168 150 Q188 140 208 152", 7)],
      ["angry", "화난", () => S("M92 144 L132 158", 8) + S("M168 158 L208 144", 8)],
      ["up", "놀란", () => S("M94 142 Q112 124 130 138", 6) + S("M170 138 Q188 124 206 142", 6)],
      ["thick", "굵은", () => R(88, 140, 46, 14, 7, INK, 0, ' transform="rotate(-6 111 147)"') + R(166, 140, 46, 14, 7, INK, 0, ' transform="rotate(6 189 147)"') + (shade ? "" : '<path d="M94 143 H126 M172 142 H204" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>')],
      ["sad", "슬픈", () => S("M92 150 Q110 152 130 138", 6) + S("M170 138 Q190 152 208 150", 6)],
    ];
    const NOSES = [
      ["dot", "콩 코", () => E(150, 226, 11, 8, "#e58d7a") + HL(146, 223, 3, 0.7)],
      ["clown", "빨간 코", () => C(150, 226, 19, "#ff3b30", 4) + HL(143, 218, 6, 0.9)],
      ["tri", "세모 코", () => S("M150 206 L138 236 L162 236 Z", 4, "#f0b48f") + HL(147, 222, 2.5, 0.6)],
      ["pig", "돼지 코", () => E(150, 228, 22, 16, "#ffa3b8", 4) + E(142, 228, 4, 6, INK) + E(158, 228, 4, 6, INK) + HL(140, 220, 4, 0.7)],
      ["curve", "오뚝 코", () => S("M152 204 Q136 232 156 236", 5)],
    ];
    const MY = 270;
    const mouthHole = (d) => S(d, 4, "#8e2b3c");
    const MOUTHS = [
      ["smile", "웃는 입", () => S("M116 " + (MY - 8) + " Q150 " + (MY + 26) + " 184 " + (MY - 8), 7)],
      ["grin", "이 보이는 입", () => mouthHole("M108 " + (MY - 12) + " Q150 " + (MY - 8) + " 192 " + (MY - 12) + " Q186 " + (MY + 34) + " 150 " + (MY + 36) + " Q114 " + (MY + 34) + " 108 " + (MY - 12) + "Z") + (shade ? "" : '<path d="M114 ' + (MY - 9) + " Q150 " + (MY - 5) + " 186 " + (MY - 9) + " L183 " + (MY + 4) + " Q150 " + (MY + 8) + " 117 " + (MY + 4) + 'Z" fill="#fffaf2"/>')],
      ["laugh", "깔깔 입", () => mouthHole("M110 " + (MY - 10) + " Q150 " + (MY - 14) + " 190 " + (MY - 10) + " Q184 " + (MY + 42) + " 150 " + (MY + 42) + " Q116 " + (MY + 42) + " 110 " + (MY - 10) + "Z") + E(150, MY + 28, 22, 12, "#ff7d93")],
      ["o", "오 입", () => E(150, MY + 4, 15, 20, "#8e2b3c", 4) + HL(144, MY - 6, 3, 0.5)],
      ["tongue", "메롱", () => S("M136 " + (MY + 2) + " Q136 " + (MY + 34) + " 150 " + (MY + 34) + " Q164 " + (MY + 34) + " 164 " + (MY + 2) + "Z", 4, "#ff7d93") + S("M114 " + (MY - 4) + " Q150 " + (MY + 16) + " 186 " + (MY - 4), 7) + S("M150 " + (MY + 8) + " V" + (MY + 22), 3)],
      ["sad", "시무룩", () => S("M118 " + (MY + 16) + " Q150 " + (MY - 10) + " 182 " + (MY + 16), 7)],
      ["cat", "고양이 입", () => S("M122 " + MY + " Q136 " + (MY + 16) + " 150 " + MY + " Q164 " + (MY + 16) + " 178 " + MY, 6)],
      ["kiss", "뽀뽀 입", () => heart(150, MY + 2, 13, "#ff4f7b") + HL(144, MY - 2, 3, 0.7)],
      ["teeth", "토끼 이", () => S("M114 " + (MY - 8) + " Q150 " + (MY + 18) + " 186 " + (MY - 8), 7) + R(138, MY + 3, 24, 18, 4, "#fffaf2", 4) + S("M150 " + (MY + 4) + " V" + (MY + 20), 3)],
    ];
    const HAIRS = [
      ["none", "민머리", () => ({ back: "", front: "" })],
      ["short", "짧은 머리", (h) => ({ back: "", front: () => S("M50 196 Q42 86 150 78 Q258 86 250 196 Q238 128 200 118 Q150 140 100 118 Q62 128 50 196Z", 4, h) + strands(h, [[96, 96, 126, 112], [150, 88, 170, 110], [196, 98, 222, 120]]) })],
      ["spiky", "뾰족 머리", (h) => ({ back: "", front: () => S("M54 180 L58 118 L80 134 L88 80 L114 112 L128 58 L150 100 L172 58 L186 112 L212 80 L220 134 L242 118 L246 180 Q222 126 150 126 Q78 126 54 180Z", 4, h) })],
      ["bowl", "바가지 머리", (h) => ({ back: "", front: () => S("M46 204 Q38 78 150 74 Q262 78 254 204 L238 204 Q234 150 222 140 L78 140 Q66 150 62 204Z", 4, h) + strands(h, [[100, 100, 104, 136], [150, 92, 150, 136], [200, 100, 196, 136]]) })],
      ["curly", "곱슬 머리", (h) => ({ back: "", front: () => [[60, 160], [66, 124], [88, 96], [118, 80], [150, 74], [182, 80], [212, 96], [234, 124], [240, 160]].map(([x, y]) => C(x, y, 26, h, 4)).join("") + C(100, 118, 22, h) + C(150, 108, 24, h) + C(200, 118, 22, h) })],
      ["long", "긴 머리", (h) => ({ back: () => S("M38 200 Q28 64 150 64 Q272 64 262 200 L272 340 Q244 352 224 330 L76 330 Q56 352 28 340Z", 4, h), front: () => S("M52 182 Q58 92 150 86 Q242 92 248 182 Q212 122 150 128 Q122 110 100 130 Q72 140 52 182Z", 4, h) + strands(h, [[120, 100, 140, 120], [180, 98, 206, 124]]) })],
      ["pigtail", "양갈래", (h) => ({ back: () => C(34, 132, 32, h, 4) + C(266, 132, 32, h, 4) + C(58, 146, 9, "#ff5d8f", 3) + C(242, 146, 9, "#ff5d8f", 3), front: () => S("M52 186 Q48 88 150 80 Q252 88 248 186 Q232 126 150 124 Q68 126 52 186Z", 4, h) + strands(h, [[110, 96, 132, 116], [176, 94, 200, 116]]) })],
      ["mohawk", "닭벼슬", (h) => ({ back: "", front: () => S("M126 122 Q116 36 150 10 Q184 36 174 122 Q150 112 126 122Z", 4, h) })],
    ];
    /** 머리카락 결 (짧은 점토 줄 몇 개 — 머리색보다 조금 어둡게) */
    function strands(h, list) {
      if (shade) return "";
      const c = mixc(full(h), "#3a2418", 0.28);
      return list.map(([x1, y1, x2, y2]) => '<path d="M' + x1 + " " + y1 + " Q" + ((x1 + x2) / 2 - 8) + " " + ((y1 + y2) / 2) + " " + x2 + " " + y2 + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" opacity=".55"/>').join("");
    }
    const HATS = [
      ["none", "없음", () => ""],
      ["crown", "왕관", () => S("M88 112 L92 50 L122 84 L150 34 L178 84 L208 50 L212 112Z", 4, "#ffd23f") + C(150, 74, 9, "#ff4f7b", 3) + HL(147, 71, 3) + C(110, 96, 7, "#4fc3ff", 3) + C(190, 96, 7, "#4fc3ff", 3) + C(92, 50, 6, "#ffd23f", 3) + C(150, 34, 6, "#ffd23f", 3) + C(208, 50, 6, "#ffd23f", 3)],
      ["tophat", "신사 모자", () => R(98, 0, 104, 100, 10, "#2a2b45", 4) + R(98, 70, 104, 18, 2, "#ff5d8f") + E(150, 100, 98, 15, "#2a2b45", 4) + (shade ? "" : '<path d="M112 10 V62" stroke="#fff" stroke-opacity=".18" stroke-width="7" stroke-linecap="round"/>')],
      ["cap", "야구 모자", () => S("M58 124 Q56 46 150 42 Q244 46 242 124Z", 4, "#2f95f5") + S("M146 116 Q246 102 292 126 Q244 140 146 128Z", 4, "#1f6fc0") + C(150, 44, 9, "#ffd23f", 3) + S("M150 46 V120", 3)],
      ["bow", "리본", () => S("M206 98 L170 70 L174 126Z", 4, "#ff5d8f") + S("M206 98 L244 70 L240 126Z", 4, "#ff5d8f") + C(206, 98, 13, "#ff8fb3", 4) + HL(202, 94, 3.5, 0.7)],
      ["party", "고깔 모자", () => S("M108 108 L150 4 L192 108Z", 4, "#8a63ee") + (shade ? "" : '<path d="M120 80 L180 76" stroke="#ffd23f" stroke-width="8" stroke-linecap="round"/><path d="M131 50 L169 48" stroke="#2fd47a" stroke-width="8" stroke-linecap="round"/>') + C(150, 6, 14, "#ffd23f", 4) + HL(145, 1, 4)],
      ["flower", "꽃 머리띠", () => S("M56 128 Q150 62 244 128", 9) + [[64, 120, "#ff5d8f"], [100, 96, "#ffd23f"], [150, 86, "#4fc3ff"], [200, 96, "#ff9f40"], [236, 120, "#8a63ee"]].map(([x, y, c]) => [0, 72, 144, 216, 288].map((a) => C(x + Math.cos((a * Math.PI) / 180) * 10, y + Math.sin((a * Math.PI) / 180) * 10, 9, c, 2)).join("") + C(x, y, 7, "#fff3a0", 2)).join("")],
    ];
    const lens = (fill) => (shade ? "none" : fill);
    const GLASSES = [
      ["none", "없음", () => ""],
      ["round", "동글 안경", () => '<circle cx="' + eyeL + '" cy="' + eyeY + '" r="31" fill="' + lens("rgba(200,235,255,.3)") + '" stroke="' + ink() + '" stroke-width="6"/><circle cx="' + eyeR + '" cy="' + eyeY + '" r="31" fill="' + lens("rgba(200,235,255,.3)") + '" stroke="' + ink() + '" stroke-width="6"/>' + S("M143 182 Q150 174 157 182", 6) + S("M81 180 L56 172 M219 180 L244 172", 6) + (shade ? "" : '<path d="M94 172 Q100 164 110 162 M170 172 Q176 164 186 162" stroke="#fff" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/>')],
      ["sun", "선글라스", () => R(74, 162, 74, 48, 18, "#1d1f33", 4) + R(152, 162, 74, 48, 18, "#1d1f33", 4) + S("M144 176 H156", 6) + (shade ? "" : '<path d="M86 172 l18 0 M164 172 l18 0" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>') + S("M74 176 L54 168 M226 176 L246 168", 6)],
      ["star", "별 안경", () => starP(eyeL, eyeY, 38, lens("rgba(255,210,63,.5)"), 5) + starP(eyeR, eyeY, 38, lens("rgba(255,210,63,.5)"), 5) + S("M144 184 H156", 5)],
      ["heart", "하트 안경", () => heart(eyeL, eyeY + 4, 25, lens("rgba(255,79,123,.45)")) + heart(eyeR, eyeY + 4, 25, lens("rgba(255,79,123,.45)")) + S("M144 182 H156", 5)],
    ];
    const PARTS = {
      skin: { em: "🙂", name: "얼굴색", list: SKINS.map((c, i) => [i, "", null]) },
      hair: { em: "💇", name: "머리", list: HAIRS },
      // 폰 세로 전용 '머리 색' 칸: 좁은 화면에선 작은 색 점 줄 대신 큰 칸(머리 색이 다른 얼굴 그림)으로 고름
      hairC: { em: "🎨", name: "머리", list: HAIRC.map((c, i) => [i, "", null]) },
      eyes: { em: "👀", name: "눈", list: EYES },
      brows: { em: "🤨", name: "눈썹", list: BROWS },
      nose: { em: "👃", name: "코", list: NOSES },
      mouth: { em: "👄", name: "입", list: MOUTHS },
      hat: { em: "🎩", name: "모자", list: HATS },
      glasses: { em: "👓", name: "안경", list: GLASSES },
    };
    const TAB_ORDER = ["skin", "hair", "hairC", "eyes", "brows", "nose", "mouth", "hat", "glasses"];
    const DEF = { skin: 0, hair: "short", hairC: 0, eyes: "big", brows: "normal", nose: "dot", mouth: "smile", hat: "none", glasses: "none", shirt: 0 };
    // 가족·친구 칸 (글자 대신 그림) — 앞 6개가 가족 칸
    const WHO = [["dad", "👨", "아빠"], ["mom", "👩", "엄마"], ["me", "🙋", "나"], ["baby", "👶", "아기"], ["grandma", "👵", "할머니"], ["grandpa", "👴", "할아버지"], ["friend", "🧒", "친구"]];
    const FAM = WHO.slice(0, 6).map((w) => w[0]);
    const whoOf = (k) => WHO.find((w) => w[0] === k) || WHO[6];
    const MAXF = 40;
    const fn = (part, id) => (PARTS[part].list.find((x) => x[0] === id) || PARTS[part].list[0])[2];
    const isInt = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
    /** 저장된 값·백업에서 온 값을 믿지 않고 아는 값만 받아들임 */
    function cleanCfg(c) {
      const o = Object.assign({}, DEF);
      if (!c || typeof c !== "object") return o;
      for (const k of ["hair", "eyes", "brows", "nose", "mouth", "hat", "glasses"]) if (PARTS[k].list.some((x) => x[0] === c[k])) o[k] = c[k];
      if (isInt(c.skin, SKINS.length)) o.skin = c.skin;
      if (isInt(c.hairC, HAIRC.length)) o.hairC = c.hairC;
      if (isInt(c.shirt, SHIRTS.length)) o.shirt = c.shirt;
      return o;
    }
    function loadFriends() {
      const raw = KP.store.get("face:friends", []);
      if (!Array.isArray(raw)) return [];
      const seen = new Set();
      return raw
        .filter((f) => f && typeof f === "object" && typeof f.id === "string" && f.id.length <= 40 && !seen.has(f.id) && seen.add(f.id))
        .map((f) => ({ id: f.id, who: whoOf(f.who)[0], t: Number.isFinite(f.t) ? f.t : 0, cfg: cleanCfg(f.cfg) }))
        .sort((a, b) => a.t - b.t)
        .slice(-MAXF);
    }
    let friends = loadFriends();
    let cfg = cleanCfg(KP.store.get("face:cfg", null));
    let cur = KP.store.get("face:cur", null); // 고치는 중인 친구 id
    let pendWho = KP.store.get("face:who", null); // 새 얼굴을 찍으면 걸 가족 칸
    const saveFriends = () => KP.store.set("face:friends", friends);
    const friendOf = (id) => friends.find((f) => f.id === id) || null;

    /** 얼굴 SVG 전체. o.vb: 보기 영역, o.hit: 큰 누르기 영역(부위 반응)까지 */
    function faceSVG(c, o = {}) {
      pfx = "f" + uid++ + "_";
      defs = new Map();
      const skin = SKINS[c.skin] || SKINS[0];
      const hcol = HAIRC[c.hairC] || HAIRC[0];
      const hair = fn("hair", c.hair)(hcol);
      const shirt = SHIRTS[c.shirt % SHIRTS.length] || SHIRTS[0];
      const eyes = EYES_TMP[c.eyes] || fn("eyes", c.eyes);
      const call = (m) => (typeof m === "function" ? m() : m || "");
      const gid = pfx + "grain", bid = pfx + "blush";
      const blushO = c.blush ? 1 : 0.55, br = c.blush ? 27 : 19; // 수줍으면 볼이 크고 진하게
      const body =
        '<g class="all">' +
        '<g class="hairB" data-p="hair">' + shadow(typeof hair.back === "function" ? hair.back : null, 2, 5, 0.12) + "</g>" +
        '<g data-p="body">' +
        S("M60 370 Q64 316 150 308 Q236 316 240 370Z", 5, shirt) +
        (shade ? "" : '<path d="M96 346 Q150 330 204 346" stroke="#fff" stroke-opacity=".22" stroke-width="5" fill="none" stroke-linecap="round"/>') +
        S("M126 300 h48 v20 q-24 14 -48 0Z", 4, skin) +
        "</g>" +
        '<g class="ear" data-p="ears" style="--r:-10deg">' + C(52, 206, 22, skin, 4) + '<path d="M50 196 Q42 206 52 218" stroke="' + mixc(full(skin), "#3a2418", 0.3) + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></g>' +
        '<g class="ear" data-p="ears" style="--r:10deg">' + C(248, 206, 22, skin, 4) + '<path d="M250 196 Q258 206 248 218" stroke="' + mixc(full(skin), "#3a2418", 0.3) + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></g>' +
        '<g data-p="face">' + E(150, 200, 100, 112, skin, 4) + '<ellipse cx="150" cy="200" rx="98" ry="110" fill="url(#' + gid + ')"/>' + "</g>" +
        '<g class="hairF" data-p="hair">' + shadow(typeof hair.front === "function" ? hair.front : null, 2, 7, 0.16) + "</g>" +
        '<g class="cheeks" data-p="cheek" style="opacity:' + blushO + '"><circle cx="96" cy="240" r="' + br + '" fill="url(#' + bid + ')"/><circle cx="204" cy="240" r="' + br + '" fill="url(#' + bid + ')"/></g>' +
        '<g class="brows" data-p="eyes">' + fn("brows", c.brows)() + "</g>" +
        '<g class="eyes" data-p="eyes">' + eyes() + "</g>" +
        '<g class="nose" data-p="nose">' + shadow(fn("nose", c.nose), 2, 5, 0.18) + "</g>" +
        '<g class="mouth" data-p="mouth">' + fn("mouth", c.mouth)() + "</g>" +
        '<g class="glasses" data-p="eyes">' + shadow(fn("glasses", c.glasses), 2, 6, 0.12) + "</g>" +
        '<g class="hat" data-p="hat">' + shadow(fn("hat", c.hat), 3, 7, 0.18) + "</g>" +
        (o.hit
          ? '<g fill="#fff" fill-opacity="0">' +
            '<circle data-p="cheek" cx="92" cy="244" r="28"/><circle data-p="cheek" cx="208" cy="244" r="28"/>' +
            '<circle data-p="eyes" cx="' + eyeL + '" cy="' + eyeY + '" r="36"/><circle data-p="eyes" cx="' + eyeR + '" cy="' + eyeY + '" r="36"/>' +
            '<circle data-p="nose" cx="150" cy="226" r="27"/>' +
            '<ellipse data-p="mouth" cx="150" cy="' + (MY + 10) + '" rx="46" ry="30"/>' +
            '<circle data-p="ears" cx="44" cy="206" r="30"/><circle data-p="ears" cx="256" cy="206" r="30"/>' +
            "</g>"
          : "") +
        "</g>";
      const blush = '<radialGradient id="' + bid + '"><stop offset="0" stop-color="#ff5f80" stop-opacity="' + (c.blush ? 0.95 : 0.7) + '"/><stop offset=".6" stop-color="#ff7d96" stop-opacity=".4"/><stop offset="1" stop-color="#ff8aa0" stop-opacity="0"/></radialGradient>';
      // 점토 결: 아주 옅은 점 무늬 두 겹 (패턴은 한 번 그려 반복 → 가벼움)
      const grain =
        '<pattern id="' + gid + '" width="23" height="19" patternUnits="userSpaceOnUse">' +
        '<circle cx="3" cy="4" r="1.3" fill="#fff" fill-opacity=".16"/><circle cx="14" cy="9" r="1.1" fill="#5a2e22" fill-opacity=".07"/><circle cx="19" cy="2" r=".9" fill="#fff" fill-opacity=".12"/>' +
        '<circle cx="8" cy="15" r="1.2" fill="#5a2e22" fill-opacity=".06"/><circle cx="20" cy="16" r="1" fill="#fff" fill-opacity=".1"/></pattern>';
      const out =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (o.vb || "0 -14 300 384") + '" preserveAspectRatio="xMidYMid meet"><defs>' + blush + grain + Array.from(defs.values()).join("") + "</defs>" + body + "</svg>";
      defs = null;
      return out;
    }
    const MIRROR_VB = "-30 -12 360 360";
    const POL_VB = "22 52 256 256";

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "fc");
    const stage = U.el("div", "fc-stage");
    const mirror = U.el("div", "fc-mirror");
    const glass = U.el("div", "fc-glass");
    const flash = U.el("div", "fc-flash");
    const badge = U.el("div", "fc-badge");
    stage.append(mirror, flash, badge);
    const panel = U.el("div", "fc-panel");
    const line = U.el("div", "fc-line", '<svg class="rope" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 8 Q50 30 100 8" fill="none" stroke="#c9955f" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg>');
    const pols = U.el("div", "fc-pols");
    line.appendChild(pols);
    const tabs = U.el("div", "fc-tabs");
    const opts = U.el("div", "fc-opts");
    const colors = U.el("div", "fc-colors");
    const acts = U.el("div", "fc-acts");
    const bRand = U.btn(KP.E("🎲") + '<span class="t"> 랜덤</span>', "btn fc-act");
    const bPhoto = U.btn(KP.E("📸") + '<span class="t"> 사진 찍기</span>', "btn primary fc-act");
    const bAlbum = U.btn(KP.E("📒") + '<span class="t"> 앨범</span>', "btn fc-act fc-albumBtn");
    acts.append(bRand, bPhoto, bAlbum);
    panel.append(line, tabs, opts, colors, acts);
    wrap.append(stage, panel);
    ctx.body.appendChild(wrap);
    let tab = "eyes",
      temp = null,
      unsaved = true,
      ver = 0, // 편집 버전 (사진 찍는 동안 바뀌었는지 확인)
      shooting = false; // 사진 만드는 중(찰칵 → 저장 → 누구예요?/축하 전까지) — 편집·친구 바꾸기 잠금
    /** 사진 만드는 중이면 편집을 막고 사진 단추만 살짝 흔듦 */
    const locked = () => {
      if (!shooting) return false;
      U.replay(bPhoto, "wig");
      return true;
    };

    /* 거울 자리: 배경 그림을 잘라 거울(전구 포함)이 무대에 크게 들어오게 */
    let mGeom = { x: 0, y: 0, r: 100 };
    function layout() {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      // 전구까지 다 보이게 — 옆이 넉넉하면(납작한 무대) 거울 안쪽이 높이를 꽉 채우게(위아래 전구는 조금 잘림)
      let k = Math.max(Math.min(w, h) / (2 * MRO), Math.min(w / (2 * MRO), h / (2 * MR)) * 0.98);
      k = Math.max(k, w / IW, h / IH);
      const fw = IW * k, fh = IH * k;
      const ox = Math.max(0, Math.min(fw - w, MX * k - w / 2));
      const oy = Math.max(0, Math.min(fh - h, MY0 * k - h / 2));
      stage.style.backgroundSize = fw + "px " + fh + "px";
      stage.style.backgroundPosition = -ox + "px " + -oy + "px";
      const r = MR * k * 0.985;
      mGeom = { x: MX * k - ox, y: MY0 * k - oy, r };
      Object.assign(mirror.style, { left: mGeom.x - r + "px", top: mGeom.y - r + "px", width: 2 * r + "px", height: 2 * r + "px" });
      badge.style.left = Math.max(8, mGeom.x - r * 1.05 - 20) + "px";
      badge.style.top = Math.max(8, mGeom.y - r * 1.05) + "px";
      renderLine();
    }
    // 화면은 한 번 만들어 계속 씀 → 지켜보기도 한 번만 (숨겨진 동안은 크기 0 이라 그냥 넘어감)
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => layout());
      ro.observe(stage);
      ro.observe(line);
    } else window.addEventListener("resize", layout);

    function render() {
      const c = temp ? Object.assign({}, cfg, temp) : cfg;
      mirror.innerHTML = faceSVG(c, { vb: MIRROR_VB, hit: true });
      mirror.appendChild(glass);
    }
    const svgAll = () => mirror.querySelector("g.all");
    function renderBadge() {
      const f = cur && friendOf(cur);
      const w = f ? f.who : pendWho;
      if (w && w !== "friend") {
        badge.innerHTML = KP.E(whoOf(w)[1]);
        badge.classList.add("on");
      } else badge.classList.remove("on");
    }
    // 열쇠 별: 지난 사진 뒤로 3번 이상 꾸몄을 때만 (부위 하나 바꾸고 📸 반복 방지)
    let editsSince = 0,
      fewEdits = false;
    function saveCfg() {
      KP.store.set("face:cfg", cfg);
      unsaved = true;
      ver++;
      editsSince++;
    }
    function setCur(id, who) {
      cur = id || null;
      pendWho = cur ? null : who || null;
      KP.store.set("face:cur", cur);
      KP.store.set("face:who", pendWho);
      renderBadge();
    }
    TAB_ORDER.forEach((k) => {
      const b = U.btn(KP.E(PARTS[k].em), "fc-tab" + (k === "hairC" ? " hc" : ""));
      b.dataset.k = k;
      ctx.tap(b, () => {
        tab = k;
        renderTabs();
        renderOpts();
        A.sfx("select");
        U.replay(b, "jump");
        KP.voice.say(PARTS[k].name);
      });
      tabs.appendChild(b);
    });
    function renderTabs() {
      U.$$(".fc-tab", tabs).forEach((b) => b.classList.toggle("sel", b.dataset.k === tab));
    }
    const VB = { skin: "0 -14 300 384", hair: "20 -20 260 260", hairC: "20 -20 260 260", eyes: "60 130 180 110", brows: "70 110 160 80", nose: "100 180 100 80", mouth: "90 230 120 90", hat: "20 -20 260 200", glasses: "40 130 220 110" };
    function renderOpts() {
      opts.innerHTML = "";
      colors.innerHTML = "";
      const P = PARTS[tab];
      P.list.forEach(([id, name], i) => {
        const c = Object.assign({}, cfg, { [tab]: id });
        if (tab === "brows" || tab === "eyes" || tab === "nose" || tab === "mouth" || tab === "glasses") Object.assign(c, { hat: "none", hair: tab === "glasses" ? "none" : c.hair });
        // 머리 색 칸: 민머리면 색이 안 보여 8칸이 똑같아 보임 → 미리보기는 짧은 머리로, 모자도 벗겨서 색이 잘 보이게
        if (tab === "hairC") Object.assign(c, { hat: "none", hair: cfg.hair === "none" ? "short" : cfg.hair });
        const b = U.btn(faceSVG(c, { vb: VB[tab] }), "fc-opt" + (cfg[tab] === id ? " sel" : ""));
        b.style.setProperty("--i", i);
        ctx.tap(b, () => {
          if (locked()) return;
          cfg[tab] = id;
          if (tab === "hairC" && cfg.hair === "none") cfg.hair = "short"; // 민머리에서 머리 색을 고르면 고른 색 머리가 보이게 (미리보기와 같게)
          saveCfg();
          U.$$(".fc-opt", opts).forEach((x) => x.classList.toggle("sel", x === b));
          stopReact();
          render();
          U.replay(mirror.firstChild, "bounce");
          U.replay(b, "pop");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.24 });
          if (tab === "mouth" || tab === "eyes") A.sfx("boing");
          if (name) KP.voice.say(name);
        });
        opts.appendChild(b);
      });
      if (tab === "hair") {
        HAIRC.forEach((c, i) => {
          const b = U.btn("", "fc-col" + (cfg.hairC === i ? " sel" : ""));
          b.style.backgroundColor = c;
          ctx.tap(b, () => {
            if (locked()) return;
            cfg.hairC = i;
            saveCfg();
            stopReact();
            render();
            renderOpts();
            A.note(A.SCALE[i], { inst: "bell", dur: 0.3, vol: 0.2 });
          });
          colors.appendChild(b);
        });
      }
    }

    /* ---------- 부위마다 다른 반응 ---------- */
    const LINES = ["안녕! 나는 멋쟁이야!", "히히, 간지러워!", "까꿍!", "나랑 같이 놀자!", "우와, 멋지게 꾸며 줘서 고마워!", "하하하! 재밌다!", "나 예뻐?"];
    let reactT = [], busyUntil = 0, mouthN = 0;
    if (KP.sampler) KP.sampler.load(["choir"]).catch(() => {}); // 입 노래(합창 '아~') — 못 불러오면 마림바
    function stopReact() {
      reactT.forEach((t) => ctx.cancel(t));
      reactT = [];
      temp = null;
      busyUntil = 0;
    }
    const later = (ms, f) => reactT.push(ctx.after(ms, f));
    /** 잠깐 다른 얼굴(temp) → ms 뒤 원래대로 */
    function face(t, ms) {
      temp = t;
      render();
      if (ms) later(ms, () => { temp = null; render(); });
    }
    /** 부위 위치(무대 기준 px) */
    function spot(sel) {
      const el = mirror.querySelector(sel), sr = stage.getBoundingClientRect();
      if (!el) return { x: mGeom.x, y: mGeom.y };
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
    }
    const addCls = (sel, cls) => {
      const g = mirror.querySelectorAll(sel);
      g.forEach((x) => U.replay(x, cls));
      return g.length;
    };
    const sing = (n, when) => {
      if (KP.sampler && KP.sampler.ok("choir")) KP.sampler.note("choir", n, { when, vol: 0.5, dur: 0.32 });
      else A.note(n, { inst: "bell", dur: 0.3, vol: 0.22, when });
    };
    const note = (x, y) => KP.pfx && KP.pfx.float(stage, x, y, '<span class="fc-note">' + KP.E("🎵") + "</span>", "", 900, ctx);

    function react(part, ev) {
      const now = performance.now();
      if (now < busyUntil) return; // 반응 중 연타는 무시(다음 반응이 앞 반응을 자르지 않게)
      stopReact();
      const sr = stage.getBoundingClientRect();
      const tx = ev ? ev.clientX - sr.left : mGeom.x, ty = ev ? ev.clientY - sr.top : mGeom.y;
      const fx = KP.pfx;
      if (part === "hat" && cfg.hat === "none") part = "hair";
      if (part === "hair" && cfg.hair === "none" && cfg.hat === "none") part = "face";
      switch (part) {
        case "nose": {
          busyUntil = now + 1200;
          if (cfg.nose === "pig") {
            face({ eyes: "happy" }, 900);
            addCls("g.nose", "squish");
            A.noise({ dur: 0.12, vol: 0.28, bp: 320, q: 4 });
            A.noise({ dur: 0.14, vol: 0.28, bp: 280, q: 4, when: 0.2 });
            KP.voice.say("꿀꿀!");
            if (fx) fx.burst(stage, tx, ty, "heart", 3, ctx);
            break;
          }
          // 에취: 아… 아… (눈 질끈, 입 오) → 에취! (얼굴 앞으로, 콧바람 가루)
          face({ eyes: "shut", mouth: "o", brows: "up" }, 0);
          A.tone(300, { to: 520, dur: 0.4, vol: 0.08, type: "sine" });
          later(430, () => {
            face({ eyes: "shut", mouth: "grin", brows: "up" }, 650);
            addCls("g.all", "sneeze");
            A.noise({ dur: 0.32, vol: 0.32, bp: 2600, bpTo: 700, q: 0.9 });
            KP.voice.say("에취!");
            const n = spot("g.nose");
            if (fx) fx.burst(stage, n.x, n.y + 10, "cool", 10, ctx);
          });
          break;
        }
        case "cheek": {
          busyUntil = now + 1100;
          face({ blush: 1, eyes: "happy", mouth: cfg.mouth === "sad" ? "cat" : cfg.mouth }, 1500);
          addCls("g.cheeks", "hot");
          addCls("g.all", "shy");
          A.tone(330, { to: 620, dur: 0.35, vol: 0.12, type: "sine" });
          KP.voice.say("부끄러워요");
          if (fx) fx.hearts(stage, tx, ty - 10, 3, ctx);
          break;
        }
        case "eyes": {
          busyUntil = now + 700;
          face({ eyes: cfg.eyes === "wink" ? "winkR" : "wink" }, 750);
          A.note("E6", { inst: "bell", dur: 0.25, vol: 0.18 });
          A.note("B6", { inst: "bell", dur: 0.35, vol: 0.14, when: 0.1 });
          KP.voice.say("윙크!");
          if (fx) fx.burst(stage, tx + 20, ty - 14, "spark", 6, ctx);
          break;
        }
        case "mouth": {
          busyUntil = now + 1400;
          if (mouthN++ % 2 === 0) {
            // 노래: 도-미-솔-도 에 맞춰 입을 오므렸다 벌렸다
            ["C5", "E5", "G5", "C6"].forEach((n, i) => {
              later(i * 300, () => {
                face({ mouth: i % 2 ? "laugh" : "o", eyes: cfg.eyes === "sleepy" ? "sleepy" : "happy" }, 0);
                addCls("g.all", "sing");
                const m = spot("g.mouth");
                note(m.x + (i % 2 ? 40 : -40), m.y - 30);
              });
              sing(n, i * 0.3);
            });
            later(1250, () => { temp = null; render(); });
          } else {
            face({ mouth: "laugh", eyes: "happy", brows: cfg.brows === "angry" ? "up" : cfg.brows }, 1300);
            U.replay(mirror.firstChild, "bounce");
            A.sfx("boing");
            ["G5", "C6", "E6"].forEach((n, i) => A.note(n, { inst: "marimba", dur: 0.18, vol: 0.18, when: 0.1 + i * 0.12 }));
            KP.voice.say("하하하!");
          }
          break;
        }
        case "hat":
        case "hair": {
          busyUntil = now + 700;
          face({ eyes: "happy" }, 700);
          addCls(part === "hat" ? "g.hat" : "g.hairF", "hop");
          if (part === "hair") addCls("g.hairB", "squish");
          A.sfx("boing");
          A.note(part === "hat" ? "G6" : "C6", { inst: "marimba", dur: 0.2, vol: 0.16, when: 0.18 });
          if (fx) fx.burst(stage, tx, ty, "spark", 5, ctx);
          break;
        }
        case "ears": {
          busyUntil = now + 900;
          face({ eyes: cfg.eyes === "sleepy" ? "big" : cfg.eyes, brows: "up" }, 900);
          addCls("g.ear", "perk");
          A.note("A6", { inst: "bell", dur: 0.2, vol: 0.16 });
          A.note("E6", { inst: "bell", dur: 0.3, vol: 0.14, when: 0.14 });
          note(tx + (tx < mGeom.x ? -30 : 30), ty - 30);
          break;
        }
        case "body": {
          busyUntil = now + 900;
          face({ mouth: "laugh", eyes: "happy" }, 900);
          addCls("g.all", "tickle");
          A.note("E5", { inst: "marimba", dur: 0.12, vol: 0.16 });
          A.note("G5", { inst: "marimba", dur: 0.12, vol: 0.16, when: 0.1 });
          A.note("E5", { inst: "marimba", dur: 0.12, vol: 0.16, when: 0.2 });
          KP.voice.say("히히, 간지러워!", { pitch: 1.35 });
          break;
        }
        default: {
          busyUntil = now + 600;
          face({ mouth: "laugh", eyes: "happy", brows: cfg.brows === "angry" ? "up" : cfg.brows }, 1300);
          U.replay(mirror.firstChild, "bounce");
          A.sfx("boing");
          A.note("G5", { inst: "marimba", dur: 0.2, vol: 0.18, when: 0.1 });
          A.note("C6", { inst: "marimba", dur: 0.3, vol: 0.18, when: 0.2 });
          KP.voice.say(U.pick(LINES), { pitch: 1.35 });
        }
      }
    }
    ctx.fast(mirror, (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-p]") : null;
      react(t ? t.getAttribute("data-p") : "face", e);
    });
    // 눈 깜빡
    ctx.blink = () => {
      if (temp) return;
      if (!["dot", "big", "googly", "wink", "star", "heart"].includes(cfg.eyes)) return;
      const g = mirror.querySelector("g.eyes");
      if (!g) return;
      g.classList.add("blink");
      ctx.after(140, () => g.classList.remove("blink"));
    };

    /* ---------- 랜덤 (새 얼굴) ---------- */
    ctx.tap(bRand, () => {
      if (locked()) return;
      const r = (k) => U.pick(PARTS[k].list)[0];
      stopReact();
      cfg = Object.assign({}, cfg, {
        skin: U.rand(SKINS.length), hair: r("hair"), hairC: U.rand(HAIRC.length), eyes: r("eyes"), brows: r("brows"), nose: r("nose"), mouth: r("mouth"),
        hat: Math.random() < 0.7 ? r("hat") : "none", glasses: Math.random() < 0.45 ? r("glasses") : "none", shirt: U.rand(SHIRTS.length),
      });
      saveCfg();
      if (cur) setCur(null, null); // 앨범 친구를 고치던 중이면 → 새 얼굴로 (친구는 그대로 남음)
      for (let i = 0; i < 6; i++) A.note(A.SCALE[U.rand(8)], { inst: "marimba", dur: 0.12, vol: 0.18, when: i * 0.06 });
      A.sfx("boing");
      render();
      renderOpts();
      U.replay(mirror.firstChild, "bounce");
      U.replay(bRand, "wig");
      KP.voice.say(U.pick(["짜잔! 누구일까요?", "우와, 재미있는 얼굴!", "하하, 웃기다!"]));
    });

    /* ---------- 사진 줄 (폴라로이드) ---------- */
    function polEl(f, cls = "", noWho) {
      const p = U.el("div", "fc-pol " + cls, '<i class="pin"></i><div class="ph">' + faceSVG(f.cfg, { vb: POL_VB }) + "</div>" + (f.who !== "friend" && !noWho ? '<span class="who">' + KP.E(whoOf(f.who)[1]) + "</span>" : ""));
      p.dataset.id = f.id;
      return p;
    }
    let lineIds = "";
    function renderLine(newId) {
      if (!line.offsetParent) {
        lineIds = "";
        pols.innerHTML = "";
        return; // 사진 줄이 안 보이는 화면(폰)
      }
      const h = line.clientHeight, w = line.clientWidth;
      const pw = (h - 6) * 0.84 + 10;
      const n = Math.max(1, Math.floor((w - 20) / pw));
      const list = friends.slice(-n).reverse();
      const ids = list.map((f) => f.id + f.t + f.who).join(",") + "|" + n;
      if (ids === lineIds && !newId) return;
      lineIds = ids;
      pols.innerHTML = "";
      list.forEach((f, i) => {
        const p = polEl(f, f.id === newId ? "new" : "");
        p.style.setProperty("--rot", (i % 2 ? 3 : -3) + "deg");
        p.style.marginTop = 6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10) + "px";
        p.style.height = "calc(100% - " + (6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10)) + "px)";
        ctx.tap(p, () => loadFriend(f.id, p));
        pols.appendChild(p);
      });
      for (let i = list.length; i < Math.min(n, 3); i++) {
        const p = U.el("div", "fc-pol empty", '<div class="ph">' + KP.E("📸") + "</div>");
        p.style.setProperty("--rot", (i % 2 ? 3 : -3) + "deg");
        p.style.marginTop = 6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10) + "px";
        p.style.height = "calc(100% - " + (6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10)) + "px)";
        ctx.tap(p, () => {
          U.replay(bPhoto, "wig");
          KP.voice.say("찰칵!");
        });
        pols.appendChild(p);
      }
    }

    /* ---------- 친구 불러오기 (다시 꾸미기) ---------- */
    function loadFriend(id, el) {
      const f = friendOf(id);
      if (!f || locked()) return;
      stopReact();
      closeOv();
      cfg = Object.assign({}, f.cfg);
      KP.store.set("face:cfg", cfg);
      setCur(f.id);
      unsaved = false; // 그대로 찍으면 '벌써 찍었어요'
      if (el) U.replay(el, "pop");
      A.sfx("open");
      render();
      renderOpts();
      U.replay(mirror.firstChild, "bounce");
      KP.voice.say(f.who !== "friend" ? whoOf(f.who)[2] + "!" : "새 친구");
      ctx.after(900, () => KP.voice.say("얼굴을 꾸며 봐요!"));
    }
    function newFace(who) {
      if (locked()) return;
      stopReact();
      closeOv();
      cfg = Object.assign({}, DEF, { shirt: U.rand(SHIRTS.length) });
      KP.store.set("face:cfg", cfg);
      setCur(null, who || null);
      unsaved = true;
      A.sfx("pop");
      render();
      renderOpts();
      U.replay(mirror.firstChild, "bounce");
      KP.voice.say(who ? whoOf(who)[2] + "!" : "새 친구");
      ctx.after(900, () => KP.voice.say("얼굴을 꾸며 봐요!"));
    }

    /* ---------- 덮개 화면 ---------- */
    let ov = null;
    function closeOv() {
      if (ov) {
        ov.remove();
        ov = null;
      }
    }
    function openOv(cls) {
      closeOv();
      ov = U.el("div", "fc-ov " + cls);
      wrap.appendChild(ov);
      return ov;
    }
    /** 앨범: 가족 칸 + 친구들 + 새 얼굴·가족 사진·닫기 */
    function openAlbum() {
      stopReact();
      render();
      const o = openOv("fc-album");
      const fam = U.el("div", "fc-fam");
      FAM.forEach((k) => {
        const w = whoOf(k);
        const f = friends.filter((x) => x.who === k).pop();
        const slot = U.el("div", "fc-slot");
        const p = f ? polEl(f, "", true) : U.el("div", "fc-pol empty", '<div class="ph">' + KP.E("➕") + "</div>");
        p.style.setProperty("--rot", (FAM.indexOf(k) % 2 ? 2 : -2) + "deg");
        const tag = U.el("span", "tag", KP.E(w[1]));
        slot.append(p, tag);
        ctx.tap(slot, () => (f ? loadFriend(f.id, p) : newFace(k)));
        fam.appendChild(slot);
      });
      const grid = U.el("div", "fc-grid");
      const list = friends.slice().reverse();
      if (!list.length) grid.appendChild(U.el("div", "fc-empty", KP.E("📸") + " " + KP.E("🙂")));
      list.forEach((f, i) => {
        const p = polEl(f);
        p.style.setProperty("--rot", (i % 3) * 2 - 2 + "deg");
        ctx.tap(p, () => loadFriend(f.id, p));
        grid.appendChild(p);
      });
      const bar = U.el("div", "fc-obar");
      const bNew = U.btn(KP.E("➕") + '<span class="t"> 새 얼굴</span>', "btn");
      const famN = FAM.filter((k) => friends.some((x) => x.who === k)).length;
      const bFam = U.btn(KP.E("🏡") + '<span class="t"> 가족 사진</span>', "btn primary");
      const bClose = U.btn(KP.E("↩️"), "btn");
      ctx.tap(bNew, () => newFace(null));
      ctx.tap(bFam, () => familyPhoto(bFam));
      ctx.tap(bClose, () => {
        A.sfx("back");
        closeOv();
      });
      bar.append(bNew);
      if (famN >= 2) bar.append(bFam);
      bar.append(bClose);
      o.append(fam, grid, bar);
      A.sfx("open");
      KP.voice.say("내 사진");
    }
    ctx.tap(bAlbum, () => {
      if (locked()) return;
      U.replay(bAlbum, "pop");
      openAlbum();
    });

    /* ---------- 사진 찍기 → 내 작품 + 앨범(사진 줄) ---------- */
    let bgImg = null;
    const loadImg = (src) =>
      new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = src;
      });
    const svgImg = (svg) => loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    async function getBg() {
      if (!bgImg) bgImg = await loadImg(BG);
      return bgImg;
    }
    /** 거울 속 얼굴 한 장 (폴라로이드 모양 JPEG 780×940) */
    async function toJpeg(c) {
      const [im, bg] = await Promise.all([svgImg(faceSVG(c, { vb: MIRROR_VB })), getBg()]);
      if (!im) return null;
      const Wd = 780, Ht = 940, P = 36, PW = Wd - P * 2, PH = PW; // 사진 칸(정사각)
      const cv = document.createElement("canvas");
      cv.width = Wd;
      cv.height = Ht;
      const x = cv.getContext("2d");
      x.fillStyle = "#fffdf7";
      x.fillRect(0, 0, Wd, Ht);
      x.save();
      x.beginPath();
      x.rect(P, P, PW, PH);
      x.clip();
      if (bg) {
        // 배경 그림에서 거울(전구 포함) 둘레를 정사각으로
        const s = MR * 2.36;
        x.drawImage(bg, MX - s / 2, MY0 - s / 2, s, s, P, P, PW, PH);
      } else {
        x.fillStyle = "#f1c8c0";
        x.fillRect(P, P, PW, PH);
      }
      const k = PW / (MR * 2.36), r = MR * k, cx = P + PW / 2, cy = P + PH / 2;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.clip();
      const g = x.createRadialGradient(cx - r * 0.12, cy - r * 0.3, 0, cx, cy, r);
      g.addColorStop(0, "#fffdf8");
      g.addColorStop(0.46, "#fbefe6");
      g.addColorStop(1, "#f1d9cc");
      x.fillStyle = g;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
      x.drawImage(im, cx - r, cy - r, r * 2, r * 2);
      x.restore();
      // 아래 여백에 작은 하트 셋
      x.fillStyle = "#ff8fab";
      [-60, 0, 60].forEach((dx, i) => {
        const hx = Wd / 2 + dx, hy = P + PH + (Ht - P - PH) / 2, s = i === 1 ? 22 : 16;
        x.beginPath();
        x.moveTo(hx, hy + s * 0.9);
        x.bezierCurveTo(hx - s * 1.6, hy - s * 0.2, hx - s * 0.7, hy - s * 1.2, hx, hy - s * 0.35);
        x.bezierCurveTo(hx + s * 0.7, hy - s * 1.2, hx + s * 1.6, hy - s * 0.2, hx, hy + s * 0.9);
        x.fill();
      });
      try {
        return cv.toDataURL("image/jpeg", 0.85);
      } catch (e) {
        return null;
      }
    }
    /** 사진이 거울에서 사진 줄(또는 앨범 단추)로 날아가 걸림 */
    let fly = null; // 날아가는 사진 {el, rafs, t} — 나가면 stop 에서 치움
    function clearFly() {
      if (!fly) return;
      fly.rafs.forEach(cancelAnimationFrame);
      if (fly.t) ctx.cancel(fly.t);
      fly.el.remove();
      fly = null;
    }
    function flyTo(img, target, done) {
      clearFly();
      const a = mirror.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const f = U.el("div", "fc-fly");
      const im = U.el("img");
      im.src = img;
      f.appendChild(im);
      const w = a.width * 0.7;
      Object.assign(f.style, { left: a.left + a.width / 2 - w / 2 + "px", top: a.top + a.height / 2 - w * 0.6 + "px", width: w + "px", height: w * 1.2 + "px" });
      document.body.appendChild(f);
      const me = (fly = { el: f, rafs: new Set(), t: 0 });
      const sc = Math.max(0.08, Math.min(1, b.height / (w * 1.2)));
      const raf = (fn) => {
        const id = requestAnimationFrame(() => {
          me.rafs.delete(id);
          fn();
        });
        me.rafs.add(id);
      };
      raf(() =>
        raf(() => {
          f.style.transform = "translate(" + (b.left + b.width / 2 - (a.left + a.width / 2)) + "px," + (b.top + b.height / 2 - (a.top + a.height / 2 - w * 0.1)) + "px) scale(" + sc + ") rotate(8deg)";
          f.style.opacity = "0.7";
        })
      );
      // ctx.after: 나가면 자동 취소(그때 사진은 stop → clearFly 가 치움)
      me.t = ctx.after(900, () => {
        if (fly === me) {
          me.t = 0;
          clearFly();
        }
        if (done) done();
      });
    }
    /** 앨범에 넣기(새 친구) 또는 고치던 친구 바꾸기 → 친구
        (사진 저장이 성공한 뒤에만 부름 — 찍기 시작할 때 고정한 shot 기준) */
    function putFriend(shot) {
      let f = friendOf(shot.fid);
      if (f) {
        f.cfg = Object.assign({}, shot.cfg);
        f.t = Date.now();
        friends = friends.filter((x) => x !== f).concat(f);
      } else {
        f = { id: shot.fid, who: shot.who, t: Date.now(), cfg: Object.assign({}, shot.cfg) };
        friends.push(f);
        // 꽉 차면: 가족 칸의 맨 마지막 사람은 지키고, 가장 오래된 사람부터 내려감
        while (friends.length > MAXF) {
          const keep = new Set(FAM.map((k) => (friends.filter((x) => x.who === k).pop() || {}).id));
          const i = friends.findIndex((x) => !keep.has(x.id));
          friends.splice(i < 0 ? 0 : i, 1);
        }
      }
      saveFriends();
      setCur(f.id);
      return f;
    }
    ctx.tap(bPhoto, async () => {
      if (bPhoto.dataset.busy) return;
      if (!unsaved) {
        U.replay(bPhoto, "wig");
        KP.voice.say("이 얼굴은 벌써 찍었어요! 바꿔서 또 찍어 봐요.");
        return;
      }
      bPhoto.dataset.busy = "1";
      shooting = true; // 사진이 끝날 때까지 편집·친구 바꾸기 잠금
      const sess = ctx._session;
      const live = () => ctx._active && ctx._session === sess;
      stopReact();
      render();
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      A.noise({ dur: 0.08, vol: 0.18, hp: 1200, when: 0.09 });
      U.replay(flash, "on");
      KP.voice.say("찰칵!");
      // 찍는 순간의 얼굴·친구·편집 버전을 고정 (뒤에서 cfg/cur 가 바뀌어도 사진과 저장 내용이 같게)
      const old = cur && friendOf(cur);
      const shot = { cfg: Object.assign({}, cfg), fid: old ? old.id : KP.newId(), who: old ? old.who : whoOf(pendWho)[0], ver };
      const wasNew = !old && !pendWho;
      fewEdits = editsSince < 3;
      editsSince = 0;
      const unlock = () => {
        shooting = false;
        delete bPhoto.dataset.busy;
      };
      const img = await toJpeg(Object.assign({}, shot.cfg, { mouth: shot.cfg.mouth === "sad" ? "smile" : shot.cfg.mouth }));
      if (!live()) return;
      if (!img) {
        unlock();
        KP.toast("사진을 만들지 못했어요");
        return;
      }
      // 사진(DB)이 먼저 저장된 뒤에만 친구 앨범·face:cur 를 확정 (실패하면 아무것도 바뀌지 않음)
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "face", img, t: Date.now(), date: KP.gate.monthDay(), cfg: Object.assign({}, shot.cfg), fid: shot.fid, who: shot.who });
      if (ctx._session !== sess) return; // 나갔다 다시 들어온 뒤면 새 판을 건드리지 않음
      if (ok === false) {
        if (!ctx._active) return;
        unlock();
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
        return;
      }
      const f = putFriend(shot); // 나가는 중이어도(같은 판) 저장된 사진과 친구 앨범은 맞춰 둠
      if (ver === shot.ver) unsaved = false;
      if (!ctx._active) return;
      A.sfx("sticker");
      const target = line.offsetParent ? line : bAlbum;
      flyTo(img, target, () => {
        if (!live()) return;
        lineIds = "";
        renderLine(f.id);
        U.replay(bAlbum, "bump");
        A.note("C6", { inst: "bell", dur: 0.3, vol: 0.18 });
        if (wasNew) askWho(f, img);
        else finish();
      });
    });
    async function finish() {
      shooting = false;
      delete bPhoto.dataset.busy;
      KP.toast("🖼️ 내 작품에 저장했어요!");
      await ctx.wait(500);
      if (fewEdits) ctx._fewChoice = true;
      await ctx.win({ msg: "찰칵! 내 작품에 저장했어요!" });
    }
    /** 새 얼굴: 누구예요? (가족 칸 그림 고르기 — 아무거나 골라도 됨) */
    function askWho(f, img) {
      const o = openOv("fc-pick");
      const big = U.el("div", "fc-snap", '<img alt="" src="' + img + '"><i class="pin"></i>');
      const q = U.el("div", "q", KP.E("❓"));
      const whos = U.el("div", "fc-whos");
      WHO.forEach(([k, em, nm], i) => {
        const b = U.btn(KP.E(em), "btn");
        b.style.setProperty("--i", i);
        ctx.tap(b, () => {
          U.replay(b, "pop");
          f.who = k;
          saveFriends();
          renderBadge();
          lineIds = "";
          renderLine(f.id);
          A.sfx("good");
          KP.voice.say(k === "friend" ? "새 친구" : nm + "!");
          closeOv();
          finish();
        });
        whos.appendChild(b);
      });
      const side = U.el("div", "fc-side");
      side.append(q, whos);
      o.append(big, side);
      ctx.after(700, () => KP.voice.say("누구일까요?"));
      ctx.hint(() => (ov ? ov.querySelector(".fc-whos .btn") : null), "누구일까요?");
    }
    /** 가족 사진: 가족 칸 사람들을 사진 줄처럼 나란히 한 장 */
    async function familyPhoto(btn) {
      if (btn.dataset.busy) return;
      btn.dataset.busy = "1";
      const sess = ctx._session;
      const live = () => ctx._active && ctx._session === sess;
      const mem = FAM.map((k) => friends.filter((x) => x.who === k).pop()).filter(Boolean);
      // 같은 가족(사람·얼굴 그대로)을 또 찍으면 사진은 저장하되 열쇠 별은 없음
      const famKey = JSON.stringify(mem.map((f) => [f.who, f.id, cleanCfg(f.cfg)]));
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      KP.voice.say("찰칵!");
      const ims = await Promise.all(mem.map((f) => svgImg(faceSVG(f.cfg, { vb: POL_VB }))));
      const bg = await getBg();
      const Wd = 1400, Ht = 900, cv = document.createElement("canvas");
      cv.width = Wd;
      cv.height = Ht;
      const x = cv.getContext("2d");
      if (bg) {
        const kc = Math.max(Wd / IW, Ht / IH); // 꽉 채우기
        x.drawImage(bg, (Wd - IW * kc) / 2, (Ht - IH * kc) / 2, IW * kc, IH * kc);
      } else {
        x.fillStyle = "#f6d9d2";
        x.fillRect(0, 0, Wd, Ht);
      }
      x.fillStyle = "rgba(255,244,238,.55)";
      x.fillRect(0, 0, Wd, Ht);
      // 줄
      x.strokeStyle = "#c9955f";
      x.lineWidth = 6;
      x.beginPath();
      x.moveTo(0, 150);
      x.quadraticCurveTo(Wd / 2, 260, Wd, 150);
      x.stroke();
      const n = mem.length, pw = Math.min(300, (Wd - 80) / n - 24), ph = pw * 1.2;
      mem.forEach((f, i) => {
        const cx = Wd / 2 + (i - (n - 1) / 2) * (pw + 24), t = cx / Wd;
        const top = (1 - t) * (1 - t) * 150 + 2 * t * (1 - t) * 260 + t * t * 150 + 6; // 줄(2차 곡선) 위 그 자리에 집게
        x.save();
        x.translate(cx, top);
        x.rotate(((i % 2 ? 3 : -3) * Math.PI) / 180);
        x.shadowColor = "rgba(90,40,30,.3)";
        x.shadowBlur = 16;
        x.shadowOffsetY = 8;
        x.fillStyle = "#fffdf7";
        x.fillRect(-pw / 2, 0, pw, ph);
        x.shadowColor = "transparent";
        const m = pw * 0.07, s = pw - m * 2;
        const gr = x.createLinearGradient(0, m, 0, m + s);
        gr.addColorStop(0, "#cfe6d5");
        gr.addColorStop(1, "#b6d4c0");
        x.fillStyle = gr;
        x.fillRect(-pw / 2 + m, m, s, s);
        if (ims[i]) x.drawImage(ims[i], -pw / 2 + m, m, s, s);
        x.fillStyle = "#e57d99";
        x.fillRect(-9, -18, 18, 34);
        x.restore();
      });
      let img = null;
      try {
        img = cv.toDataURL("image/jpeg", 0.85);
      } catch (e) {}
      if (!live()) return;
      const ok = img && (await KP.db.put("art", { id: KP.newId(), kind: "face", img, t: Date.now(), date: KP.gate.monthDay(), fam: mem.map((f) => f.id) }));
      delete btn.dataset.busy;
      if (!live()) return;
      if (!img || ok === false) {
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
        return;
      }
      // 별을 받은 가족 구성 기록(짧은 지문 최근 30개) — 두 얼굴을 번갈아 바꿔 찍어도 별은 구성마다 한 번
      let hsh = 2166136261;
      for (let i = 0; i < famKey.length; i++) hsh = Math.imul(hsh ^ famKey.charCodeAt(i), 16777619);
      const fp = (hsh >>> 0).toString(36);
      const won = KP.store.get("face:famWon", []);
      const wonList = Array.isArray(won) ? won.filter((x) => typeof x === "string").slice(-30) : [];
      const again = wonList.includes(fp);
      if (!again) KP.store.set("face:famWon", wonList.concat(fp).slice(-30));
      A.sfx("sticker");
      closeOv();
      KP.toast("🖼️ 내 작품에 저장했어요!");
      await ctx.wait(400);
      if (again) ctx._fewChoice = true; // 축하는 하되 열쇠 별은 없음 (ui.js win 의 clean 규칙)
      await ctx.win({ msg: "찰칵! 내 작품에 저장했어요!" });
    }

    // 나갈 때(def.stop): 날아가던 사진 치우기 · 사진 잠금 풀기
    ctx.cleanup = () => {
      clearFly();
      shooting = false;
    };
    ctx.init = () => {
      stopReact();
      closeOv();
      clearFly();
      shooting = false;
      ver = 0;
      friends = loadFriends();
      cfg = cleanCfg(KP.store.get("face:cfg", null));
      cur = KP.store.get("face:cur", null);
      if (typeof cur !== "string" || !friendOf(cur)) cur = null;
      pendWho = KP.store.get("face:who", null);
      if (cur || !FAM.includes(pendWho)) pendWho = null;
      // 고치던 친구를 그대로 다시 열었으면 '벌써 찍었어요' 상태
      const f = cur && friendOf(cur);
      unsaved = !(f && JSON.stringify(cleanCfg(f.cfg)) === JSON.stringify(cfg));
      delete bPhoto.dataset.busy;
      render();
      renderBadge();
      renderTabs();
      renderOpts();
      layout();
    };
  },
  start(ctx) {
    ctx.init();
    ctx.say("얼굴을 꾸며 봐요! 코, 볼, 입을 콕 눌러 봐요."); // 뒤 문장은 새 음성(tools/out/new-voice/face.txt)
    ctx.every(3600, () => ctx.blink());
    ctx.hint(() => ctx.body.querySelector(".fc-opt:not(.sel)"), "그림을 눌러서 바꿔 봐요!");
  },
  stop(ctx) {
    ctx.cleanup && ctx.cleanup();
  },
});

;

/* ==== js/games/make/grow.js ==== */
/* 꽃 키우기 — 물뿌리개로 물 주고, 해님을 누르면 쑥쑥!
   - 화분 3개: 씨앗 → 싹 → 봉오리 → 꽃 (꽃 종류는 랜덤) — 물 주기·해님 3번이면 꽃 (예전 4번은 지루해서 줄임, 2026-11-08)
   - 물뿌리개를 끌어다 화분에 겹치게 대면(몸통이든 주둥이든) 물방울이 떨어짐 → 흙이 촉촉해지면 해님 누르기 → 한 단계 자람
   - 꽃이 피면 잠시 그대로 두고 감상(꽃을 콕 → 이름) → 축하 뒤 정원으로
   - 가만히 있으면 반투명 물뿌리개가 목마른 화분까지 날아가 '끌기'를 보여 줌
   - 핀 꽃은 "내 정원"(KP.store "grow:garden")에 영구 저장 → 정원이 날마다 커짐, 🌼 단추로 정원 보기
   - 화분 상태도 저장(KP.store "grow:pots") → 껐다 켜도 이어서 키우기
   - 나비·벌이 날아다님 (꽃이 많을수록 더 많이) */
"use strict";
KP.game({
  id: "grow",
  icon: "🌱",
  name: "꽃 키우기",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("grow", `
      .gr{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(#8fd3ff,#d9f2ff 58%,#a7df86 58%,#7fcc63)}
      .gr-hill{position:absolute;left:-10%;right:-10%;top:52%;height:20%;background:#b6e797;border-radius:50% 50% 0 0}
      .gr-sun{position:absolute;right:3%;top:3%;width:clamp(100px,17vh,160px);height:clamp(100px,17vh,160px);display:flex;align-items:center;justify-content:center;z-index:3}
      .gr-sun .e{width:100%;height:100%;filter:drop-shadow(0 0 18px rgba(255,200,40,.7));animation:grSun 6s linear infinite}
      @keyframes grSun{to{transform:rotate(360deg)}}
      .gr-sun.shine::before{content:"";position:absolute;inset:-60%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,120,.9),rgba(255,236,120,0) 65%);animation:grGlow 1.4s ease-out}
      @keyframes grGlow{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
      .gr-beam{position:absolute;pointer-events:none;z-index:1;background:linear-gradient(rgba(255,240,150,.75),rgba(255,240,150,0));transform-origin:top center;animation:grBeam 1.5s ease-out forwards;border-radius:40px}
      @keyframes grBeam{from{opacity:0}25%{opacity:1}to{opacity:0}}
      .gr-cloud{position:absolute;top:8%;font-size:clamp(50px,9vh,90px);opacity:.95;animation:grCloud 40s linear infinite}
      @keyframes grCloud{from{transform:translateX(-30vw)}to{transform:translateX(110vw)}}
      .gr-garden{position:absolute;left:12px;top:12px;z-index:3;display:flex;align-items:center;gap:6px;font-size:clamp(18px,2.4vw,24px);background:#fff;border-radius:20px;padding:8px 14px;box-shadow:var(--shadow);min-height:64px}
      .gr-garden .e{font-size:1.6em}
      .gr-garden b{font-weight:400;color:var(--coral)}
      .gr-pots{position:absolute;left:0;right:0;bottom:3%;display:flex;justify-content:space-evenly;align-items:flex-end;z-index:2;pointer-events:none}
      .gr-pots>.gr-pot{pointer-events:auto}
      .gr-pot{position:relative;width:clamp(100px,19vw,200px);aspect-ratio:100/170;transition:transform .2s}
      .gr-pot svg{width:100%;height:100%;overflow:visible}
      .gr-pot.over{transform:scale(1.06)}
      .gr-pot .grow{animation:grGrow .8s cubic-bezier(.3,1.5,.5,1);transform-box:fill-box;transform-origin:bottom center}
      @keyframes grGrow{from{transform:scaleY(.4) scaleX(.8)}}
      .gr-need{position:absolute;left:50%;top:76%;margin-left:-.8em;z-index:1;font-size:clamp(24px,3.6vh,38px);background:#fff;border-radius:50%;width:1.6em;height:1.6em;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);animation:bob 1.6s ease-in-out infinite;pointer-events:none}
      .gr-need .e{font-size:.9em}
      .gr-can{position:absolute;left:3%;top:38%;width:clamp(110px,15vw,170px);z-index:5;touch-action:none;cursor:grab;filter:drop-shadow(0 8px 6px rgba(0,0,0,.2))}
      .gr-can svg{width:100%;display:block;transition:transform .2s;transform-origin:70% 60%}
      .gr-can.pour svg{transform:rotate(-34deg)}
      .gr-can.drag{cursor:grabbing}
      .gr-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4}
      .gr-bug{position:absolute;left:0;top:0;font-size:clamp(34px,5vh,50px);z-index:3;pointer-events:none}
      .gr-view{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;background:linear-gradient(#bfe8ff,#e9f8ff 30%,#b8e79a 30%,#8fd56d)}
      .gr-view.show{display:flex;animation:enter .3s}
      .gr-vtop{display:flex;align-items:center;gap:10px;padding:12px 14px;font-size:clamp(20px,3vw,30px)}
      .gr-vtop .btn{font-size:clamp(18px,2.4vw,22px);min-height:64px}
      .gr-vscroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;position:relative;z-index:1}
      .gr-vgrid{margin-top:auto;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:2px clamp(6px,2vw,22px);padding:20px 14px 18px}
      .gr-vgrid .gr-vf{min-width:var(--fs,74px)}
      .gr-vsun{position:absolute;right:4%;top:9%;font-size:clamp(56px,10vh,96px);animation:grSun 8s linear infinite;pointer-events:none}
      .gr-vbug{position:absolute;left:0;top:0;font-size:clamp(32px,5vh,46px);pointer-events:none;z-index:2;animation:grFly var(--d,11s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
      @keyframes grFly{0%{transform:translate(8vw,42vh) rotate(-8deg)}25%{transform:translate(34vw,30vh) rotate(8deg)}50%{transform:translate(58vw,46vh) rotate(-6deg)}75%{transform:translate(76vw,32vh) rotate(6deg)}100%{transform:translate(86vw,48vh) rotate(-8deg)}}
      .gr-vgrass{position:absolute;left:0;right:0;bottom:0;height:14%;background:repeating-linear-gradient(100deg,#7fcc63 0 10px,#8fd56d 10px 20px);pointer-events:none}
      .gr-ghost{position:absolute;z-index:6;pointer-events:none;opacity:0;width:clamp(110px,15vw,170px);filter:drop-shadow(0 6px 4px rgba(0,0,0,.15))}
      .gr-ghost svg{width:100%;display:block}
      .gr-pot.bloom{animation:grBloom 1.2s ease-in-out infinite}
      @keyframes grBloom{50%{transform:translateY(-4%) rotate(2deg)}}
      .gr-vf{display:flex;flex-direction:column;align-items:center;font-size:var(--fs,74px);line-height:1;animation:itemIn .4s backwards;animation-delay:calc(var(--i) * 18ms)}
      .gr-vf .e{animation:grSway 3s ease-in-out infinite;animation-delay:calc(var(--i) * -0.37s);transform-origin:bottom center}
      .gr-vf small{font-size:12px;color:#2e6b2a;margin-top:2px}
      @keyframes grSway{50%{transform:rotate(6deg)}}
      .gr-vempty{grid-column:1/-1;width:100%;text-align:center;font-size:22px;color:#2e6b2a;padding-top:40px}
      @media (max-aspect-ratio:1/1){ .gr{margin:0 10px 10px} .gr-pot{width:30vw} .gr-can,.gr-ghost{width:28vw} .gr-can{top:36%} }
      /* 폰 가로(키 작은 가로 화면): 화분 상자가 해님 자리까지 올라가 해님을 덮던 문제(2026-11-09) → 화분·물뿌리개를 높이 기준으로 줄임 */
      @media (orientation:landscape) and (max-height:500px){ .gr-pot{width:min(19vw,25vh)} .gr-sun{width:clamp(80px,24vh,120px);height:clamp(80px,24vh,120px)} .gr-can,.gr-ghost{width:min(15vw,30vh)} .gr-can{top:30%} }
    `);

    const FLOWERS = [
      ["🌷", "튤립", "#ff5d73"], ["🌻", "해바라기", "#ffc531"], ["🌹", "장미", "#e8253f"], ["🌸", "벚꽃", "#ffb3cf"],
      ["🌼", "데이지", "#fff3a0"], ["🌺", "무궁화", "#ff6fa8"], ["🪻", "히아신스", "#9a73d4"],
    ];
    KP.loadE(FLOWERS.map((f) => f[0]).concat(["🦋", "🐝"]));
    const STAGE_NAMES = ["씨앗", "싹", "잎", "봉오리", "꽃"];
    // "튤립 꽃이 피었어요!" — 꽃 이름 + 공용 꼬리말 조각이라 모두 자연 음성 ("튤립이 피었어요!" 는 해바라기만 녹음돼 있었음, 2026-11-09)
    const bloomMsg = (n) => (n.endsWith("꽃") ? n + "! 꽃이 피었어요!" : n + " 꽃이 피었어요!");
    // 자라는 순서: 씨앗(0) → 싹(1) → 봉오리(3) → 꽃(4). '잎(2)' 단계는 건너뜀 (예전에 저장된 2 는 3 으로)
    const NEXT = { 0: 1, 1: 3, 2: 3, 3: 4 };

    /* ---------- 저장된 상태 ---------- */
    const newPot = () => ({ stage: 0, water: 0, kind: U.rand(FLOWERS.length) });
    let pots = KP.store.get("grow:pots", null);
    if (!Array.isArray(pots) || pots.length !== 3) pots = [newPot(), newPot(), newPot()];
    const savePots = () => KP.store.set("grow:pots", pots);
    const garden = () => KP.store.get("grow:garden", []);

    /* ---------- 화면 ---------- */
    const scene = U.el("div", "gr");
    scene.append(U.el("div", "gr-hill"));
    const cl1 = U.el("div", "gr-cloud", KP.E("☁️"));
    const cl2 = U.el("div", "gr-cloud", KP.E("☁️"));
    cl2.style.top = "20%";
    cl2.style.animationDelay = "-22s";
    scene.append(cl1, cl2);
    const sun = U.el("button", "gr-sun", KP.E("☀️"));
    const bGarden = U.btn(KP.E("🌼") + "<span>내 정원</span> <b>0</b>", "gr-garden");
    const potsEl = U.el("div", "gr-pots");
    const can = U.el("div", "gr-can");
    can.innerHTML =
      '<svg viewBox="0 0 160 120"><path d="M112 54 L154 22 L158 30 L122 66Z" fill="#3fb0c9" stroke="#2c5a6b" stroke-width="5" stroke-linejoin="round"/>' +
      '<ellipse cx="156" cy="26" rx="8" ry="12" fill="#7fd6ea" stroke="#2c5a6b" stroke-width="4" transform="rotate(-38 156 26)"/>' +
      '<path d="M28 40 Q22 6 64 8 Q104 10 98 40" fill="none" stroke="#2c5a6b" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M22 44 H118 L110 112 H30Z" fill="#4cc4dd" stroke="#2c5a6b" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M30 60 H112" stroke="#fff" stroke-width="7" opacity=".6"/><circle cx="56" cy="86" r="9" fill="#ffd23f"/><circle cx="82" cy="80" r="6" fill="#ff8fb3"/></svg>';
    const fx = U.el("canvas", "gr-fx");
    const view = U.el("div", "gr-view");
    scene.append(sun, bGarden, potsEl, can, fx, view);
    ctx.body.appendChild(scene);
    const fg = fx.getContext("2d");

    /* ---------- 화분 그림 ---------- */
    function plantSVG(p) {
      const [em, , col] = FLOWERS[p.kind];
      const wet = p.water >= 1;
      const soil = wet ? "#6b4426" : "#a8743f";
      let plant = "";
      const st = p.stage;
      const leaf = (x, y, s, flip) =>
        '<path d="M' + x + " " + y + " q" + (flip ? -1 : 1) * 16 * s + " " + -14 * s + " " + (flip ? -1 : 1) * 30 * s + " " + -4 * s + " q" + (flip ? 1 : -1) * 12 * s + " " + 12 * s + " " + (flip ? 1 : -1) * 30 * s + " " + 4 * s + 'Z" fill="#4cbf4a" stroke="#2b7a2e" stroke-width="2.5" stroke-linejoin="round"/>';
      if (st === 0) {
        plant = '<ellipse cx="50" cy="98" rx="20" ry="7" fill="' + soil + '" opacity=".7"/><ellipse cx="50" cy="94" rx="8" ry="6" fill="#8a5a2b" stroke="#5a3a1a" stroke-width="2" transform="rotate(-20 50 94)"/><path d="M47 91 q3 -2 5 0" stroke="#c99a5c" stroke-width="2" fill="none"/>';
      } else {
        const topY = [0, 74, 46, 26, 14][st];
        plant = '<path d="M50 100 Q' + (st > 2 ? 46 : 52) + " " + (100 + topY) / 2 + " 50 " + topY + '" stroke="#3ea33f" stroke-width="' + (st > 1 ? 6 : 5) + '" fill="none" stroke-linecap="round"/>';
        if (st === 1) plant += leaf(50, 78, 0.55, true) + leaf(50, 78, 0.55, false);
        if (st >= 2) plant += leaf(50, 84, 0.9, true) + leaf(50, 68, 0.85, false) + (st >= 3 ? leaf(50, 56, 0.7, true) : "");
        if (st === 3)
          plant += '<path d="M50 6 Q36 20 42 30 Q50 36 58 30 Q64 20 50 6Z" fill="' + col + '" stroke="#5a3a4a" stroke-width="2.5"/><path d="M40 30 Q50 22 60 30 Q56 38 50 36 Q44 38 40 30Z" fill="#4cbf4a" stroke="#2b7a2e" stroke-width="2.5"/>';
        if (st === 4) plant += '<image href="' + KP.esrc(em) + '" x="18" y="-26" width="64" height="64"/>';
      }
      return (
        '<svg viewBox="0 -30 100 200"><g class="plant">' + plant + "</g>" +
        '<path d="M18 104 H82 L74 166 H26Z" fill="#e8835a" stroke="#8a4a2e" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<rect x="12" y="96" width="76" height="14" rx="5" fill="#f19a70" stroke="#8a4a2e" stroke-width="3.5"/>' +
        '<ellipse cx="50" cy="99" rx="34" ry="4.5" fill="' + soil + '"/>' +
        (wet ? '<circle cx="34" cy="132" r="4" fill="#9fe0ff"/><circle cx="62" cy="142" r="3" fill="#9fe0ff"/>' : "") +
        "</svg>"
      );
    }
    const potEls = [0, 1, 2].map((i) => {
      const el = U.el("div", "gr-pot");
      potsEl.appendChild(el);
      ctx.fast(el, () => {
        const p = pots[i];
        U.replay(el, "jump");
        if (p.stage >= 4) {
          // 핀 꽃: 이름을 말하고 꽃가루가 퐁
          A.note(A.SCALE[(i * 2 + 3) % 8], { inst: "bell", dur: 0.5, vol: 0.2 });
          A.sfx("sparkle");
          KP.voice.say(FLOWERS[p.kind][1] + "!");
          puff(i, 14);
          return;
        }
        A.sfx("tap2");
        const nm = STAGE_NAMES[p.stage];
        KP.voice.say(p.water >= 1 ? nm + "! 물을 먹었어요. 해님을 눌러요!" : nm + "! 목말라요. 물을 주세요!");
      });
      return el;
    });
    function renderPot(i, grew) {
      const p = pots[i],
        el = potEls[i];
      el.innerHTML = plantSVG(p);
      if (grew) el.querySelector(".plant").classList.add("grow");
      if (p.stage < 4) el.appendChild(U.el("div", "gr-need", KP.E(p.water >= 1 ? "☀️" : "💧")));
    }
    const renderAll = () => pots.forEach((_, i) => renderPot(i));
    function updateGardenBtn() {
      bGarden.querySelector("b").textContent = garden().length;
    }

    /* ---------- 물뿌리개 끌기 ---------- */
    let drag = null,
      pourAcc = 0,
      sndAcc = 0,
      saidSun = false;
    const drops = [];
    can.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (drag) return;
      try {
        can.setPointerCapture(e.pointerId);
      } catch (_) {}
      const r = can.getBoundingClientRect();
      drag = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, x0: r.left, y0: r.top };
      can.classList.add("drag");
      A.sfx("pick");
    });
    can.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const dx = e.clientX - drag.ox - drag.x0,
        dy = e.clientY - drag.oy - drag.y0;
      can.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      can.classList.remove("drag", "pour");
      can.style.transition = "transform .4s cubic-bezier(.3,1.3,.5,1)";
      can.style.transform = "";
      setTimeout(() => (can.style.transition = ""), 420);
      potEls.forEach((p) => p.classList.remove("over"));
    }
    can.addEventListener("pointerup", release);
    can.addEventListener("pointercancel", release);
    function spout() {
      const r = can.getBoundingClientRect(),
        s = scene.getBoundingClientRect();
      // 기울였을 때 주둥이 끝 (대략 오른쪽 위)
      return { x: r.left - s.left + r.width * 0.96, y: r.top - s.top + r.height * (can.classList.contains("pour") ? 0.45 : 0.2) };
    }
    /** 물 줄 화분: 주둥이 끝이 화분 위에 있거나, 물뿌리개 몸통이 화분(위쪽 공간 포함)과 겹치면 — 가장 많이 겹친 화분.
        (예전엔 주둥이 끝만 봐서 아이가 몸통을 화분 위에 올리면 물이 안 나왔음) */
    function potUnder() {
      if (!drag) return -1;
      const sp = spout(),
        s = scene.getBoundingClientRect(),
        c = can.getBoundingClientRect();
      const cx0 = c.left - s.left + c.width * 0.12,
        cx1 = c.left - s.left + c.width * 0.9,
        cy0 = c.top - s.top,
        cy1 = c.top - s.top + c.height * 0.9;
      let best = -1,
        bestA = 0;
      for (let i = 0; i < 3; i++) {
        const r = potEls[i].getBoundingClientRect();
        const x = r.left - s.left,
          y = r.top - s.top;
        if (sp.x > x - 30 && sp.x < x + r.width + 30 && sp.y < y + r.height * 0.75 && sp.y > y - r.height * 0.9) return i;
        // 화분 + 그 위 공간(화분 높이의 0.9배)과 물뿌리개 몸통이 겹친 넓이
        const ox = Math.min(cx1, x + r.width) - Math.max(cx0, x),
          oy = Math.min(cy1, y + r.height * 0.7) - Math.max(cy0, y - r.height * 0.9);
        const a = ox > 0 && oy > 0 ? ox * oy : 0;
        if (a > bestA) {
          bestA = a;
          best = i;
        }
      }
      return bestA > c.width * c.height * 0.12 ? best : -1;
    }
    /** 물방울이 나올 자리: 주둥이가 화분 위면 주둥이, 아니면 물뿌리개 아래쪽에서 화분 가운데로 */
    function pourFrom(i) {
      const sp = spout(),
        s = scene.getBoundingClientRect(),
        r = potEls[i].getBoundingClientRect();
      const px = r.left - s.left + r.width / 2;
      if (Math.abs(sp.x - px) < r.width * 0.75) return { x: sp.x, y: sp.y, vx: 30 };
      const c = can.getBoundingClientRect();
      return { x: Math.max(c.left, Math.min(c.right, r.left + r.width / 2)) - s.left, y: c.top - s.top + c.height * 0.8, vx: (px - (c.left - s.left + c.width / 2)) * 0.3 };
    }
    /** 꽃가루 퐁 */
    function puff(i, n) {
      const s2 = scene.getBoundingClientRect(),
        pr = potEls[i].getBoundingClientRect();
      for (let k = 0; k < n; k++) {
        const a = Math.random() * 6.28,
          sp = 80 + Math.random() * 200;
        drops.push({ x: pr.left - s2.left + pr.width / 2, y: pr.top - s2.top + pr.height * 0.15, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: 1.4, c: U.pick(["#ffd23f", "#ff8fb8", "#ffffff", FLOWERS[pots[i].kind][2]]), s: 3 + Math.random() * 4 });
      }
    }
    let dropsDrawn = false;
    function step(dt) {
      // 물 주기
      const i = potUnder();
      potEls.forEach((p, k) => p.classList.toggle("over", k === i));
      can.classList.toggle("pour", i >= 0);
      if (i >= 0) {
        idle = 0;
        const sp = pourFrom(i);
        for (let k = 0; k < 3; k++) drops.push({ x: sp.x + (Math.random() - 0.3) * 18, y: sp.y + 10, vx: sp.vx + Math.random() * 40, vy: 40 + Math.random() * 60, life: 1 });
        sndAcc += dt;
        if (sndAcc > 0.32) {
          sndAcc = 0;
          A.sfx("water");
        }
        const p = pots[i];
        if (p.stage < 4 && p.water < 1) {
          p.water = Math.min(1, p.water + dt * 0.9);
          if (p.water >= 1) {
            savePots();
            renderPot(i);
            A.note("C6", { inst: "bell", dur: 0.4, vol: 0.15 });
            A.note("G6", { inst: "bell", dur: 0.5, vol: 0.12, when: 0.1 });
            // 말풍선도 바꿈 (소리를 못 들어도 다음 할 일이 보이게)
            if (pots.some((q) => q.stage < 4 && q.water < 1)) ctx.say(saidSun ? "꿀꺽꿀꺽! 촉촉해졌어요!" : "꿀꺽꿀꺽! 이제 해님을 눌러 주세요!");
            else ctx.say("꿀꺽꿀꺽! 이제 해님을 눌러 주세요!");
            saidSun = true;
            setHint();
          }
        } else if (p.stage === 4) {
          pourAcc += dt;
        }
      }
      // 물방울 · 꽃가루 그리기
      const W = fx.width / D,
        H = fx.height / D;
      // 물방울이 없고 지난 장면에도 없었으면 지우지 않음 (매 장면 화면 전체를 지우던 것)
      if (drops.length || dropsDrawn) fg.clearRect(0, 0, W, H);
      dropsDrawn = drops.length > 0;
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k];
        d.vy += 600 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.life -= dt * 1.2;
        if (d.life <= 0 || d.y > H) {
          drops.splice(k, 1);
          continue;
        }
        fg.globalAlpha = Math.min(1, d.life * 1.5);
        fg.fillStyle = d.c || "#6cc8f5";
        fg.beginPath();
        if (d.c) fg.arc(d.x, d.y, d.s || 4, 0, 6.28);
        else fg.ellipse(d.x, d.y, 3.2, 5.5, 0, 0, 6.28);
        fg.fill();
      }
      fg.globalAlpha = 1;
      if (drops.length > 400) drops.splice(0, drops.length - 400);
      // 끌기 보여 주기: 9초 넘게 가만히 있고 목마른 화분이 있으면 반투명 물뿌리개가 그 화분까지 날아감
      if (!drag && !busy && !view.classList.contains("show")) {
        idle += dt;
        if (idle > 9) {
          idle = 0;
          const k = pots.findIndex((p) => p.stage < 4 && p.water < 1);
          if (k >= 0 && !pots.some((p) => p.stage < 4 && p.water >= 1)) ghostTo(k);
        }
      } else if (drag) idle = 0;
      // 나비·벌
      bugs.forEach((b) => {
        b.t += dt * b.sp;
        const x = (b.cx + Math.sin(b.t * 0.7 + b.ph) * b.ax) * W,
          y = (b.cy + Math.sin(b.t * 1.9 + b.ph) * b.ay) * H;
        b.el.style.transform = "translate(" + x + "px," + y + "px) scaleX(" + (Math.cos(b.t * 0.7 + b.ph) > 0 ? -1 : 1) + ") rotate(" + Math.sin(b.t * 9) * 8 + "deg)";
      });
    }
    let idle = 0;
    const ghost = U.el("div", "gr-ghost", can.innerHTML);
    function ghostTo(k) {
      if (!ghost.animate) return;
      const s = scene.getBoundingClientRect(),
        c = can.getBoundingClientRect(),
        r = potEls[k].getBoundingClientRect();
      const x0 = c.left - s.left,
        y0 = c.top - s.top;
      const x1 = r.left - s.left + r.width * 0.5 - c.width * 0.9,
        y1 = r.top - s.top - c.height * 0.6;
      Object.assign(ghost.style, { left: x0 + "px", top: y0 + "px" });
      ghost.animate(
        [
          { transform: "translate(0,0)", opacity: 0 },
          { transform: "translate(0,0)", opacity: 0.6, offset: 0.15 },
          { transform: "translate(" + (x1 - x0) + "px," + (y1 - y0) + "px)", opacity: 0.6, offset: 0.65 },
          { transform: "translate(" + (x1 - x0) + "px," + (y1 - y0) + "px) rotate(-30deg)", opacity: 0.6, offset: 0.85 },
          { transform: "translate(" + (x1 - x0) + "px," + (y1 - y0) + "px) rotate(-30deg)", opacity: 0 },
        ],
        { duration: 2200, easing: "ease-in-out" }
      );
      U.replay(can, "wig");
    }
    let D = 1;
    function fit() {
      const r = scene.getBoundingClientRect();
      D = Math.min(devicePixelRatio || 1, 2);
      fx.width = Math.round(r.width * D);
      fx.height = Math.round(r.height * D);
      fg.setTransform(D, 0, 0, D, 0, 0);
    }
    addEventListener("resize", () => ctx._active && fit());

    /* ---------- 나비 · 벌 ---------- */
    let bugs = [];
    function makeBugs() {
      bugs.forEach((b) => b.el.remove());
      const n = Math.min(5, 2 + Math.floor(garden().length / 3) + pots.filter((p) => p.stage >= 3).length);
      bugs = Array.from({ length: n }, (_, i) => {
        const el = U.el("div", "gr-bug", KP.E(i % 2 ? "🐝" : "🦋"));
        scene.insertBefore(el, fx);
        return { el, t: Math.random() * 10, sp: 0.6 + Math.random() * 0.5, ph: Math.random() * 6, cx: 0.2 + Math.random() * 0.6, cy: 0.3 + Math.random() * 0.15, ax: 0.3, ay: 0.1 };
      });
    }

    /* ---------- 해님 ---------- */
    ctx.fast(sun, async () => {
      if (busy) return;
      U.replay(sun, "shine");
      ["C5", "E5", "G5", "C6"].forEach((n, i) => A.note(n, { inst: "bell", dur: 0.6, vol: 0.14, when: i * 0.07 }));
      const ready = pots.map((p, i) => (p.stage < 4 && p.water >= 1 ? i : -1)).filter((i) => i >= 0);
      if (!ready.length) {
        if (pots.some((p) => p.stage < 4)) ctx.say("해님이 반짝! 그런데 먼저 물을 주세요!");
        else KP.voice.say("해님이 반짝반짝!");
        U.replay(can, "jump");
        return;
      }
      // 햇살
      const s = scene.getBoundingClientRect(),
        sr = sun.getBoundingClientRect();
      ready.forEach((i) => {
        const pr = potEls[i].getBoundingClientRect();
        const x1 = sr.left - s.left + sr.width / 2,
          y1 = sr.top - s.top + sr.height / 2,
          x2 = pr.left - s.left + pr.width / 2,
          y2 = pr.top - s.top + pr.height * 0.3;
        const len = Math.hypot(x2 - x1, y2 - y1),
          ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90;
        const b = U.el("div", "gr-beam");
        Object.assign(b.style, { left: x1 - 40 + "px", top: y1 + "px", width: "80px", height: len + "px", transform: "rotate(" + ang + "deg)" });
        scene.appendChild(b);
        setTimeout(() => b.remove(), 1600);
      });
      busy = true;
      await ctx.wait(700);
      let bloomed = [];
      ready.forEach((i) => {
        const p = pots[i];
        p.stage = NEXT[p.stage] || 4;
        p.water = 0;
        renderPot(i, true);
        if (p.stage === 4) bloomed.push(i);
      });
      savePots();
      A.sfx("levelup");
      makeBugs();
      if (!bloomed.length) {
        const st = pots[ready[0]].stage;
        ctx.say(["", "싹이 났어요!", "잎이 쑥쑥 자랐어요!", "봉오리가 생겼어요! 곧 꽃이 필 거예요!"][st] + " 또 물을 주세요!");
        busy = false;
        setHint();
        return;
      }
      for (const i of bloomed) {
        const p = pots[i];
        const [em, name] = FLOWERS[p.kind];
        const g = garden();
        g.push({ e: em, n: name, d: KP.gate.monthDay(), t: Date.now() });
        KP.store.set("grow:garden", g);
        // 꽃가루 터짐 + 꽃이 살랑살랑
        puff(i, 40);
        potEls[i].classList.add("bloom");
        A.sfx("sparkle");
        updateGardenBtn();
        U.replay(bGarden, "bump");
        ctx.say(bloomMsg(name) + " 내 정원에 심었어요.");
      }
      // 내가 키운 꽃을 볼 시간 (꽃을 콕 누르면 이름을 말함)
      await ctx.wait(3200);
      ctx.round = (ctx.round || 0) + 1;
      const ok = await ctx.win({ big: ctx.round % 3 === 0, msg: bloomMsg(FLOWERS[pots[bloomed[0]].kind][1]) });
      if (!ok) return;
      // 핀 꽃은 정원으로 날아가고 새 씨앗
      for (const i of bloomed) {
        const a = potEls[i].getBoundingClientRect(),
          b = bGarden.getBoundingClientRect();
        const f = U.el("div", "", KP.E(FLOWERS[pots[i].kind][0]));
        Object.assign(f.style, { position: "fixed", left: a.left + a.width * 0.2 + "px", top: a.top - a.height * 0.1 + "px", fontSize: a.width * 0.6 + "px", zIndex: 90, pointerEvents: "none", transition: "transform .9s cubic-bezier(.5,-0.3,.6,1)" });
        document.body.appendChild(f);
        requestAnimationFrame(() => requestAnimationFrame(() => (f.style.transform = "translate(" + (b.left - a.left - a.width * 0.2) + "px," + (b.top - a.top + a.height * 0.1) + "px) scale(.25)")));
        setTimeout(() => f.remove(), 950);
        potEls[i].classList.remove("bloom");
        pots[i] = newPot();
        renderPot(i, true);
      }
      savePots();
      A.sfx("whoosh");
      ctx.say("새 씨앗을 심었어요! 물을 주세요!");
      busy = false;
      setHint();
    });
    let busy = false;

    /* ---------- 내 정원 ---------- */
    ctx.tap(bGarden, () => {
      A.sfx("open");
      const g = garden();
      view.innerHTML = "";
      const top = U.el("div", "gr-vtop");
      const back = U.btn(KP.E("↩️") + " 돌아가기", "btn");
      top.append(back, U.el("div", "", KP.E("🌼") + " 내 정원 · 꽃 " + g.length + "송이"));
      // 하늘·해님·나비가 있는 정원: 꽃은 아래 풀밭부터 크게 심음 (꽃이 많아지면 조금씩 작게, 넘치면 위로 스크롤)
      view.append(U.el("div", "gr-vsun", KP.E("☀️")), U.el("div", "gr-vgrass"));
      const nb = Math.min(4, 1 + Math.floor(g.length / 4));
      for (let k = 0; k < nb; k++) {
        const b = U.el("div", "gr-vbug", KP.E(k % 2 ? "🐝" : "🦋"));
        b.style.setProperty("--d", 9 + k * 2.5 + "s");
        b.style.setProperty("--dl", -k * 3.1 + "s");
        view.appendChild(b);
      }
      const scroll = U.el("div", "gr-vscroll");
      const grid = U.el("div", "gr-vgrid");
      scroll.appendChild(grid);
      const fs = g.length > 80 ? 48 : g.length > 40 ? 62 : g.length > 16 ? 84 : 112;
      grid.style.setProperty("--fs", fs + "px");
      if (!g.length) grid.appendChild(U.el("div", "gr-vempty", "아직 핀 꽃이 없어요. 물을 주고 해님을 눌러 꽃을 피워요!"));
      requestAnimationFrame(() => (scroll.scrollTop = scroll.scrollHeight));
      g.forEach((f, i) => {
        const c = U.el("div", "gr-vf", KP.E(f.e) + "<small>" + (f.d || "") + "</small>");
        c.style.setProperty("--i", Math.min(i, 60));
        c.addEventListener("pointerdown", () => {
          U.replay(c, "jump");
          A.note(A.SCALE[i % 8], { inst: "bell", dur: 0.4, vol: 0.2 });
          KP.voice.say(f.n + "!"); // 날짜는 화면에만(숫자 날짜는 자연 음성이 없음)
        });
        grid.appendChild(c);
      });
      view.append(top, scroll);
      view.classList.add("show");
      KP.voice.say(g.length ? "내 정원에 꽃이 피었어요!" : "아직 핀 꽃이 없어요. 꽃을 피워 봐요!"); // 송이 수는 화면 위에
      back.addEventListener("click", () => {
        A.sfx("back");
        view.classList.remove("show");
      });
    });

    function setHint() {
      if (pots.some((p) => p.stage < 4 && p.water >= 1)) ctx.hint(() => sun, "해님을 눌러요!");
      else ctx.hint(() => can, "물뿌리개를 화분으로 끌어 와요!");
    }
    ctx.begin = () => {
      busy = false;
      // 꽃이 핀 직후 나가서 '꽃 핀 상태'로 굳은 화분은 새 씨앗으로 (꽃은 이미 정원에 저장됨)
      if (pots.some((p) => p.stage >= 4)) {
        pots = pots.map((p) => (p.stage >= 4 ? newPot() : p));
        savePots();
      }
      view.classList.remove("show");
      potEls.forEach((el) => el.classList.remove("bloom"));
      idle = 0;
      if (!ghost.parentNode) scene.insertBefore(ghost, fx);
      renderAll();
      updateGardenBtn();
      requestAnimationFrame(() => {
        fit();
        makeBugs();
        ctx.loop((dt) => step(dt));
      });
      const any = pots.some((p) => p.stage > 0);
      ctx.say(any ? "꽃이 자라고 있어요! 물을 주고 해님을 눌러요." : "물뿌리개를 끌어서 화분에 물을 주세요!");
      setHint();
    };
  },
  start(ctx) {
    ctx.begin();
  },
});

;

/* ==== js/games/make/icecream.js ==== */
/* 아이스크림 가게 — 손님 동물의 주문대로 아이스크림 만들기
   1단계: "딸기 주세요!"(맛 하나, 개수는 마음대로) — 가끔 자유 주문(아무거나 → 축하는 하되 열쇠 별 없음)
   2단계: "딸기 두 개 주세요!"(맛 하나·개수) / 3단계: 맛 두 가지(각 1~2개)
   4단계: 맛 두 가지 + 콘·컵, 토핑 주문 (예전 3단계 — 3~4세에 한 번에 오르면 벅차서 나눔, 2026-11-08)
   - 콘/컵 고르기, 스쿱 최대 5개 쌓기(뚝 떨어지는 연출), 토핑: 스프링클·체리·초코칩
   - 드리기 → 손님이 냠냠 먹고 하트 / 틀리면 무엇이 다른지 말해 줌
   - 📸 → 내 작품(kind "icecream") */
"use strict";
KP.game({
  id: "icecream",
  icon: "🍦",
  name: "아이스크림 가게",
  cat: "make",
  levels: 4,
  score: "🍦",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("icecream", `
      .ic{flex:1;min-height:0;display:grid;gap:12px;padding:0 14px 12px;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);grid-template-areas:"shop ctl"}
      .ic-shop{grid-area:shop;position:relative;min-height:0;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(#ffeef6 0 62%,#f7c6dc 62% 64%,#ffd9b8 64%)}
      .ic-shop::before{content:"";position:absolute;left:0;right:0;top:0;height:16%;background:repeating-linear-gradient(90deg,#ff8fb8 0 40px,#fff 40px 80px);
        -webkit-mask:radial-gradient(circle at 20px 100%,transparent 18px,#000 19px) 0 0/40px 100%;mask:radial-gradient(circle at 20px 100%,transparent 18px,#000 19px) 0 0/40px 100%}
      .ic-cust{position:absolute;left:4%;bottom:30%;width:40%;display:flex;flex-direction:column;align-items:center;transition:transform .6s cubic-bezier(.3,1.3,.5,1),opacity .4s}
      .ic-cust.away{transform:translateX(-140%);opacity:0}
      .ic-animal{font-size:clamp(90px,20vh,180px);line-height:1;filter:drop-shadow(0 8px 4px rgba(0,0,0,.15))}
      .ic-animal.nom{animation:icNom .25s ease-in-out 5}
      @keyframes icNom{50%{transform:scale(1.08,.92)}}
      .ic-bub{position:absolute;z-index:2;left:4%;top:18%;max-width:48%;background:#fff;border-radius:24px;padding:10px 16px;box-shadow:var(--shadow);display:flex;align-items:center;gap:10px;font-size:clamp(18px,2.6vw,26px);line-height:1.25;animation:popIn .4s cubic-bezier(.2,1.5,.4,1)}
      .ic-bub::after{content:"";position:absolute;left:30%;bottom:-16px;border:10px solid transparent;border-top:16px solid #fff}
      .ic-bub svg{height:clamp(70px,12vh,120px);width:auto;flex:0 0 auto}
      /* 주문 그림 줄 (2026-11-09): 글 못 읽는 아이가 그림만 보고 맞히게 — 스쿱을 개수만큼, 콘/컵·토핑도 크게 */
      .ic-bub.has-ord{flex-direction:column;gap:4px}
      .ic-shop.has-ord .ic-cust{bottom:4%}
      .ic-bub.has-ord > svg{display:none}
      .ic-ord .g{display:flex;align-items:center;gap:2px;white-space:nowrap}
      .ic-ord{flex:0 0 100%;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 6px;--ic:clamp(56px,min(9vw,11vh),84px)}
      .ic-bub .ic-ord svg{width:var(--ic);height:calc(var(--ic) * .75)}
      .ic-bub .ic-ord .ct svg{width:calc(var(--ic) * .7);height:calc(var(--ic) * .75)}
      .ic-ord .e{font-size:calc(var(--ic) * .62)}
      .ic-ord .plus{font-size:calc(var(--ic) * .4);color:#c7a2b6;margin:0 -2px}
      .ic-cone{position:absolute;right:6%;bottom:6%;height:86%;aspect-ratio:200/370;transition:transform .7s cubic-bezier(.5,0,.5,1),opacity .5s}
      .ic-cone svg{width:100%;height:100%;overflow:visible}
      .ic-cone.serve{opacity:0}
      .ic-cone .drop{animation:icDrop .45s cubic-bezier(.3,1.4,.5,1)}
      @keyframes icDrop{from{transform:translateY(-260px)}}
      .ic-cone .wob{animation:wig .35s}
      .ic-heart{position:absolute;font-size:44px;pointer-events:none;animation:icHeart 1.4s ease-out forwards}
      @keyframes icHeart{from{transform:translate(-50%,0) scale(.4);opacity:1}to{transform:translate(-50%,-180px) scale(1.3);opacity:0}}
      .ic-ctl{grid-area:ctl;display:flex;flex-direction:column;gap:10px;justify-content:center;width:clamp(260px,30vw,340px)}
      .ic-row{display:grid;gap:8px}
      .ic-mix{display:flex;flex-direction:column;gap:10px}
      .ic-fl{grid-template-columns:repeat(3,1fr)}
      .ic-tp{grid-template-columns:repeat(3,1fr)}
      .ic-ct{grid-template-columns:repeat(2,1fr)}
      .ic-ac{grid-template-columns:repeat(3,1fr)}
      .ic-b{background:#fff;border-radius:20px;box-shadow:0 5px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px;font-size:clamp(14px,1.8vw,18px);min-height:clamp(70px,10.5vh,92px)}
      .ic-b svg{width:clamp(38px,5.6vh,52px);height:clamp(38px,5.6vh,52px)}
      .ic-b .e{font-size:clamp(34px,5vh,46px)}
      .ic-b.sel{box-shadow:0 0 0 4px var(--sun),0 5px 0 #d9a000;background:#fff8dc}
      .ic-b:active{transform:translateY(3px)}
      .ic-b.serve{background:var(--grass);color:#fff;box-shadow:0 5px 0 #1d7f45}
      @media (max-aspect-ratio:1/1){
        .ic{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"shop" "ctl";gap:8px;padding:0 10px 10px}
        .ic-ctl{width:auto;gap:7px}
        .ic-fl{grid-template-columns:repeat(6,1fr)}
        .ic-mix{display:grid;grid-template-columns:2fr 3fr;gap:8px}
        .ic-b{min-height:62px;border-radius:16px;font-size:13px}
        .ic-b svg{width:36px;height:36px}
        .ic-b .e{font-size:32px}
        .ic-bub{max-width:62%;font-size:17px;padding:8px 12px}
        .ic-bub svg{height:64px}
        .ic-bub.has-ord{font-size:15px}
        .ic-cust{width:44%;bottom:24%}
        .ic-animal{font-size:clamp(80px,11vh,120px)}
      }
      /* 폰 세로(2026-11-08): 맛 단추 6칸 한 줄(51px) → 3칸씩 2줄, 모든 단추 64px 이상 (가게 그림은 조금 줄어듦) */
      @media (orientation:portrait) and (max-width:480px){
        .ic{padding:0 6px 8px;gap:6px}
        .ic-ctl{gap:6px}
        .ic-row{gap:6px}
        .ic-fl{grid-template-columns:repeat(3,1fr)}
        .ic-mix{gap:6px}
        .ic-b{min-height:clamp(58px,7.8vh,68px);min-width:0;flex-direction:row;gap:4px;font-size:14px}
        .ic-mix .ic-b,.ic-ac .ic-b{flex-direction:column;gap:1px;font-size:12.5px}
        .ic-animal{font-size:clamp(76px,10vh,110px)}
      }
      /* 태블릿 세로(큰 세로 화면): 폰 크기 그대로라 단추·손님이 작고 화면이 비어 보였음 */
      @media (orientation:portrait) and (min-width:700px){
        .ic-ctl{gap:12px}
        .ic-row,.ic-mix{gap:12px}
        .ic-b{min-height:clamp(76px,8vh,96px);font-size:16px;border-radius:20px}
        .ic-b svg{width:50px;height:50px}
        .ic-b .e{font-size:42px}
        .ic-animal{font-size:clamp(130px,15vh,190px)}
        .ic-bub,.ic-bub.has-ord{font-size:20px}
        .ic-ord{--ic:84px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .ic{gap:8px;padding:0 10px 8px}
        .ic-ctl{width:clamp(360px,46vw,420px);gap:8px}
        .ic-fl{grid-template-columns:repeat(3,1fr);gap:6px}
        .ic-mix{display:grid;grid-template-columns:2fr 3fr;gap:6px}
        .ic-ac{gap:6px}
        .ic-b{min-height:64px;border-radius:16px;font-size:13px;padding:2px 2px}
        .ic-fl .ic-b{flex-direction:row;gap:6px;font-size:14px}
        .ic-b svg{width:32px;height:32px}
        .ic-b .e{font-size:28px}
        .ic-bub{max-width:72%;font-size:16px;padding:6px 10px;top:12%}
        .ic-bub svg{height:48px}
        .ic-bub.has-ord{gap:2px;font-size:14px}
        .ic-ord{--ic:clamp(50px,14.5vh,56px)}
        .ic-cust{width:46%}
        .ic-animal{font-size:clamp(70px,22vh,100px)}
      }
    `);

    const FLAVORS = [
      ["딸기", "#ff9fbc", "#e86f95"], ["초코", "#8d5a3b", "#6a3f26"], ["바닐라", "#fff1c9", "#e8cf8a"],
      ["민트", "#9fe8cf", "#5cc4a2"], ["포도", "#c4a3f0", "#9a73d4"], ["바나나", "#ffe773", "#e2c13a"],
    ];
    const CUSTOMERS = [
      ["🐻", "곰"], ["🐰", "토끼"], ["🐱", "고양이"], ["🐶", "강아지"], ["🐼", "판다"], ["🦊", "여우"],
      ["🐸", "개구리"], ["🐵", "원숭이"], ["🐯", "호랑이"], ["🐧", "펭귄"], ["🐨", "코알라"], ["🐷", "돼지"],
    ];
    const INK = "#5a3a4a";

    /* ---------- 아이스크림 그림 ---------- */
    const SPR = [[-22, -12, 20], [8, -22, -30], [24, -4, 60], [-6, -2, 10], [-30, 4, -50], [14, 8, 35]];
    const SPRC = ["#ff5d8f", "#2f95f5", "#ffd23f", "#2fd47a", "#ffffff", "#8a63ee"];
    const CHIP = [[-18, -6], [14, -16], [26, 6], [-2, 8], [-30, -14]];
    function iceSVG(st, o = {}) {
      const scoops = st.scoops;
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -76 200 376">';
      if (st.cont === "cup") {
        s += '<path d="M46 184 H154 L138 288 H62Z" fill="#7cc8ff" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        s += '<path d="M51 214 H149 M56 246 H144" stroke="#fff" stroke-width="9" opacity=".8"/>';
        s += '<rect x="40" y="176" width="120" height="16" rx="7" fill="#a6dcff" stroke="' + INK + '" stroke-width="5"/>';
      } else {
        s += '<path d="M56 180 H144 L100 292Z" fill="#f2b863" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        s += '<path d="M68 196 L118 254 M86 186 L126 232 M110 182 L134 210 M132 196 L84 254 M114 186 L74 230 M92 182 L66 210" stroke="#c98a3c" stroke-width="4"/>';
      }
      scoops.forEach((f, i) => {
        const cy = 166 - i * 36;
        const [, col, dark] = FLAVORS[f];
        const cls = o.dropLast && i === scoops.length - 1 ? ' class="drop"' : "";
        s += "<g" + cls + ">";
        s += '<path d="M54 ' + (cy + 10) + " C48 " + (cy - 44) + " 152 " + (cy - 44) + " 146 " + (cy + 10) +
          " Q138 " + (cy + 22) + " 128 " + (cy + 13) + " Q118 " + (cy + 28) + " 106 " + (cy + 15) + " Q96 " + (cy + 30) + " 86 " + (cy + 15) +
          " Q74 " + (cy + 26) + " 66 " + (cy + 13) + " Q58 " + (cy + 22) + " 54 " + (cy + 10) + 'Z" fill="' + col + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        s += '<path d="M66 ' + (cy + 6) + " Q100 " + (cy + 16) + " 134 " + (cy + 6) + '" stroke="' + dark + '" stroke-width="4" fill="none" opacity=".5"/>';
        s += '<ellipse cx="80" cy="' + (cy - 14) + '" rx="11" ry="7" fill="#fff" opacity=".55" transform="rotate(-25 80 ' + (cy - 14) + ')"/>';
        if (st.chip) CHIP.forEach(([dx, dy], k) => (s += '<ellipse cx="' + (100 + dx) + '" cy="' + (cy + dy) + '" rx="4.5" ry="3.2" fill="#4a2a1a" transform="rotate(' + k * 40 + " " + (100 + dx) + " " + (cy + dy) + ')"/>'));
        if (st.sprinkle) SPR.forEach(([dx, dy, rot], k) => (s += '<rect x="' + (100 + dx - 6) + '" y="' + (cy + dy - 2) + '" width="12" height="4.5" rx="2.2" fill="' + SPRC[(k + i) % 6] + '" transform="rotate(' + rot + " " + (100 + dx) + " " + (cy + dy) + ')"/>'));
        s += "</g>";
      });
      if (st.cherry && scoops.length) {
        const ty = 166 - (scoops.length - 1) * 36 - 40;
        s += '<path d="M100 ' + (ty - 4) + " Q104 " + (ty - 30) + " 120 " + (ty - 36) + '" stroke="#3f8a3a" stroke-width="4" fill="none" stroke-linecap="round"/>';
        s += '<circle cx="100" cy="' + ty + '" r="15" fill="#e8253f" stroke="' + INK + '" stroke-width="4"/><circle cx="94" cy="' + (ty - 5) + '" r="4.5" fill="#fff" opacity=".8"/>';
      }
      return s + "</svg>";
    }
    const scoopIcon = (f) => iceSVG({ cont: "none", scoops: [f] }).replace('viewBox="0 -76 200 376"', 'viewBox="44 112 112 84"');

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "ic");
    const shop = U.el("div", "ic-shop");
    const cust = U.el("div", "ic-cust");
    const animal = U.el("div", "ic-animal");
    cust.appendChild(animal);
    const bub = U.el("div", "ic-bub");
    const cone = U.el("div", "ic-cone");
    shop.append(cust, bub, cone);
    const ctl = U.el("div", "ic-ctl");
    const rowFl = U.el("div", "ic-row ic-fl");
    const mix = U.el("div", "ic-mix");
    const rowCt = U.el("div", "ic-row ic-ct");
    const rowTp = U.el("div", "ic-row ic-tp");
    const rowAc = U.el("div", "ic-row ic-ac");
    mix.append(rowCt, rowTp);
    ctl.append(rowFl, mix, rowAc);
    wrap.append(shop, ctl);
    ctx.body.appendChild(wrap);

    let st = { cont: "cone", scoops: [], sprinkle: false, cherry: false, chip: false };
    let order = null,
      who = null,
      busy = false,
      unsavedPic = false;
    function draw(dropLast) {
      cone.innerHTML = iceSVG(st, { dropLast });
      unsavedPic = true;
    }

    const flBtns = FLAVORS.map(([name], i) => {
      const b = U.btn(scoopIcon(i) + "<span>" + name + "</span>", "ic-b");
      ctx.tap(b, () => {
        if (busy) return;
        if (st.scoops.length >= 5) {
          ctx.miss(b, "아이스크림이 가득 찼어요!");
          return;
        }
        st.scoops.push(i);
        draw(true);
        U.replay(b, "jump");
        A.note(A.SCALE[st.scoops.length + 1], { inst: "marimba", dur: 0.3, vol: 0.26, when: 0.25 });
        A.tone(700, { to: 260, dur: 0.28, vol: 0.12, when: 0.0, type: "sine" });
        A.sfx("drop");
        KP.voice.say(name + "! " + ["", "한", "두", "세", "네", "다섯"][st.scoops.length] + " 개");
        afterChange();
      });
      rowFl.appendChild(b);
      return b;
    });
    const CONTS = [["cone", "콘", '<svg viewBox="40 170 120 130">' + '<path d="M56 180 H144 L100 292Z" fill="#f2b863" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/></svg>'],
      ["cup", "컵", '<svg viewBox="30 166 140 130"><path d="M46 184 H154 L138 288 H62Z" fill="#7cc8ff" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><rect x="40" y="176" width="120" height="16" rx="7" fill="#a6dcff" stroke="' + INK + '" stroke-width="6"/></svg>']];
    const ctBtns = CONTS.map(([id, name, svg]) => {
      const b = U.btn(svg + "<span>" + name + "</span>", "ic-b");
      ctx.tap(b, () => {
        if (busy) return;
        st.cont = id;
        draw();
        markSel();
        U.replay(b, "jump");
        A.sfx("pick");
        KP.voice.say(name);
        afterChange();
      });
      rowCt.appendChild(b);
      return b;
    });
    const TOPS = [["sprinkle", "스프링클", "🌈"], ["cherry", "체리", "🍒"], ["chip", "초코칩", "🍫"]];
    const tpBtns = TOPS.map(([id, name, em]) => {
      const b = U.btn(KP.E(em) + "<span>" + name + "</span>", "ic-b");
      ctx.tap(b, () => {
        if (busy) return;
        if (!st.scoops.length) {
          ctx.miss(b, "먼저 아이스크림을 담아요!");
          return;
        }
        st[id] = !st[id];
        draw();
        markSel();
        U.replay(b, "jump");
        if (st[id]) {
          A.sfx("sparkle");
          KP.voice.say(name + "!");
        } else A.sfx("slide");
        afterChange();
      });
      rowTp.appendChild(b);
      return b;
    });
    const bUndo = U.btn(KP.E("↩️") + "<span>빼기</span>", "ic-b");
    const bPic = U.btn(KP.E("📸") + "<span>사진</span>", "ic-b");
    const bServe = U.btn(KP.E("🤲") + "<span>드리기</span>", "ic-b serve");
    rowAc.append(bUndo, bPic, bServe);
    function markSel() {
      ctBtns.forEach((b, i) => b.classList.toggle("sel", CONTS[i][0] === st.cont));
      tpBtns.forEach((b, i) => b.classList.toggle("sel", !!st[TOPS[i][0]]));
    }
    ctx.tap(bUndo, () => {
      if (busy) return;
      if (!st.scoops.length) {
        U.replay(bUndo, "wrong");
        A.sfx("bad");
        return;
      }
      st.scoops.pop();
      if (!st.scoops.length) Object.assign(st, { sprinkle: false, cherry: false, chip: false });
      draw();
      markSel();
      A.sfx("slide");
      U.replay(bUndo, "wig");
      afterChange();
    });

    /* ---------- 손님 · 주문 ---------- */
    function makeOrder() {
      const lv = ctx.level;
      if (lv === 1) {
        // 맛 하나만 (몇 개든 좋음). 세 번에 한 번쯤은 자유 주문
        ctx.freeN = (ctx.freeN || 0) + 1;
        if (ctx.freeN % 3 === 0) return { free: true };
        return { only: U.rand(FLAVORS.length) };
      }
      if (lv === 2) {
        const f = U.rand(FLAVORS.length);
        return { counts: { [f]: 1 + U.rand(3) } };
      }
      const [f1, f2] = U.sample([0, 1, 2, 3, 4, 5], 2);
      const o = { counts: { [f1]: 1 + U.rand(2), [f2]: 1 + U.rand(2) } };
      if (lv >= 4) {
        if (Math.random() < 0.5) o.cont = U.pick(["cone", "cup"]);
        if (Math.random() < 0.45) o.top = U.pick(["cherry", "sprinkle", "chip"]);
      }
      return o;
    }
    function orderText(o) {
      if (o.free) return U.pick(["아이스크림 주세요! 맛있게 만들어 주세요!", "제일 맛있는 아이스크림 주세요!", "아이스크림 하나 주세요!"]);
      if (o.only != null) return FLAVORS[o.only][0] + " 주세요!";
      const parts = Object.entries(o.counts).map(([f, n]) => FLAVORS[f][0] + " " + ["", "하나", "두 개", "세 개"][n]);
      let t = parts.join(", ");
      if (o.cont) t = (o.cont === "cup" ? "컵에 " : "콘에 ") + t;
      t += " 주세요!";
      if (o.top) t += " " + { cherry: "체리", sprinkle: "스프링클", chip: "초코칩" }[o.top] + " 주세요!"; // "체리도 올려 주세요!" 는 녹음이 없어 자연 음성 조각으로
      return t;
    }
    function orderPic(o) {
      if (o.free) return iceSVG({ cont: "cone", scoops: [0, 2, 1] }).replace("<svg ", '<svg style="opacity:.9" ');
      if (o.only != null) return iceSVG({ cont: "cone", scoops: [o.only] });
      const scoops = [];
      Object.entries(o.counts).forEach(([f, n]) => {
        for (let i = 0; i < n; i++) scoops.push(+f);
      });
      return iceSVG({ cont: o.cont || "cone", scoops, sprinkle: o.top === "sprinkle", cherry: o.top === "cherry", chip: o.top === "chip" });
    }
    /** 주문 그림 줄: 스쿱 아이콘을 개수만큼 (+ 4단계 콘/컵·토핑). 자유 주문은 없음 */
    function orderRow(o) {
      if (o.free) return "";
      // 묶음(같은 맛 스쿱들, 콘/컵, 토핑)끼리는 줄이 바뀌지 않게 → 좁은 화면에서 묶음 단위로 다음 줄
      const gs = [];
      if (o.only != null) gs.push(scoopIcon(o.only));
      else Object.entries(o.counts).forEach(([f, n]) => gs.push(Array.from({ length: n }, () => scoopIcon(+f)).join("")));
      if (o.cont) gs.push('<span class="ct">' + CONTS[o.cont === "cone" ? 0 : 1][2] + "</span>");
      if (o.top) gs.push(KP.E(TOPS.find((t) => t[0] === o.top)[2]));
      return '<div class="ic-ord">' + gs.map((g, k) => '<span class="g">' + (k ? '<span class="plus">+</span>' : "") + g + "</span>").join("") + "</div>";
    }
    function newCustomer() {
      busy = false;
      st = { cont: "cone", scoops: [], sprinkle: false, cherry: false, chip: false };
      draw();
      unsavedPic = false;
      cone.classList.remove("serve");
      cone.style.transform = "";
      markSel();
      const pool = CUSTOMERS.filter((c) => !who || c[0] !== who[0]);
      who = U.pick(pool);
      order = makeOrder();
      freeHint = null;
      animal.innerHTML = KP.E(who[0]);
      cust.classList.add("away");
      bub.style.display = "none";
      ctx.after(60, () => {
        cust.classList.remove("away");
        A.sfx("open");
      });
      ctx.after(650, () => {
        const txt = orderText(order);
        const row = orderRow(order);
        bub.innerHTML = orderPic(order) + "<span>" + txt + "</span>" + row;
        bub.classList.toggle("has-ord", !!row);
        shop.classList.toggle("has-ord", !!row); // 주문 그림 줄로 말풍선이 커지면 손님은 바닥 쪽으로 (가려지지 않게)
        bub.style.display = "";
        U.replay(bub, "pop");
        ctx.say(who[1] + " 손님이 왔어요! " + (order.free ? "맛있는 아이스크림을 만들어 드려요." : txt));
        hint();
      });
    }
    let freeHint = null; // 자유 주문 힌트: 손님마다 한 단추만 가리킴 (부를 때마다 바뀌면 손가락이 왔다 갔다 함)
    function need() {
      // 다음에 눌러야 할 맛 단추 (힌트용)
      if (!order || order.free) {
        if (st.scoops.length) return bServe;
        if (!freeHint) freeHint = flBtns[U.rand(6)];
        return freeHint;
      }
      if (order.only != null) {
        if (st.scoops.some((f) => f !== order.only)) return bUndo;
        return st.scoops.length ? bServe : flBtns[order.only];
      }
      const have = {};
      st.scoops.forEach((f) => (have[f] = (have[f] || 0) + 1));
      for (const [f, n] of Object.entries(order.counts)) if ((have[f] || 0) < n) return flBtns[f];
      if (order.cont && st.cont !== order.cont) return ctBtns[order.cont === "cone" ? 0 : 1];
      if (order.top && !st[order.top]) return tpBtns[TOPS.findIndex((t) => t[0] === order.top)];
      return bServe;
    }
    function hint() {
      // 손가락이 다음에 누를 맛·콘/컵·토핑(정답)을 가리키면 그 판은 열쇠 별 없음. 다 맞게 만든 뒤 '드리기'를 가리키는 것은 괜찮음
      const answer = !!order && !order.free && need() !== bServe;
      ctx.hint(need, order && !order.free ? orderText(order) : "맛을 골라 아이스크림을 만들어요!", { answer });
    }
    function afterChange() {
      hint();
    }
    function check() {
      if (order.free) return null;
      if (order.only != null) {
        const bad = st.scoops.find((f) => f !== order.only);
        return bad == null ? null : FLAVORS[bad][0] + "! 안 시켰어요!";
      }
      const have = {};
      st.scoops.forEach((f) => (have[f] = (have[f] || 0) + 1));
      // 틀림 안내는 주문 문장·맛 이름 + 공용 조각으로만 (모두 자연 음성, 2026-11-09 — 예전 "딸기가 두 개 있어야 해요!" 류 47개는 기기 음성이었음)
      const CN = ["", "하나", "두 개", "세 개"];
      for (const [f, n] of Object.entries(order.counts)) {
        const h = have[f] || 0,
          nm = FLAVORS[f][0];
        if (h < n) return nm + " " + CN[n] + " 주세요!";
        if (h > n) return "너무 많아요! " + nm + " " + CN[n] + " 주세요!";
      }
      for (const f of Object.keys(have)) if (!(f in order.counts)) return FLAVORS[f][0] + "! 안 시켰어요!";
      if (order.cont && st.cont !== order.cont) return (order.cont === "cup" ? "컵" : "콘") + "에 주세요!";
      if (order.top && !st[order.top]) return { cherry: "체리", sprinkle: "스프링클", chip: "초코칩" }[order.top] + " 주세요!";
      return null;
    }
    ctx.tap(bServe, async () => {
      if (busy) return;
      if (!st.scoops.length) {
        ctx.miss(bServe, "먼저 아이스크림을 담아요!");
        return;
      }
      const wrong = check();
      if (wrong) {
        ctx.miss(animal, wrong);
        U.replay(bub, "pop");
        return;
      }
      busy = true;
      ctx.hint(null);
      // 아이스크림이 손님에게
      const a = cone.getBoundingClientRect(),
        b = animal.getBoundingClientRect();
      cone.style.transform = "translate(" + (b.left + b.width * 0.7 - a.left - a.width / 2) + "px," + (b.top + b.height * 0.6 - a.top - a.height / 2) + "px) scale(.45)";
      A.sfx("whoosh");
      bub.style.display = "none";
      await ctx.wait(700);
      cone.classList.add("serve");
      animal.classList.add("nom");
      for (let i = 0; i < 4; i++) A.noise({ dur: 0.09, vol: 0.12, bp: 700, q: 1.5, when: i * 0.26 });
      KP.voice.say(U.pick(["냠냠! 정말 맛있어요! 고마워요!", "우와, 맛있다! 고마워요!", "냠냠냠! 최고예요!"]));
      for (let i = 0; i < 6; i++)
        ctx.after(i * 160, () => {
          const h = U.el("div", "ic-heart", KP.E(U.pick(["❤️", "💖", "😋"])));
          const r = cust.getBoundingClientRect(),
            sr = shop.getBoundingClientRect();
          h.style.left = r.left - sr.left + r.width * (0.3 + Math.random() * 0.4) + "px";
          h.style.top = r.top - sr.top + "px";
          shop.appendChild(h);
          setTimeout(() => h.remove(), 1500);
        });
      await ctx.wait(1400);
      animal.classList.remove("nom");
      ctx.score.add();
      ctx.round = (ctx.round || 0) + 1;
      if (order.free) ctx._fewChoice = true; // 아무거나 드려도 되는 판 → 축하만, 열쇠 별 없음
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "최고의 아이스크림 가게!" : U.pick(["손님이 좋아해요!", "맛있대요!", "잘 만들었어요!"]) });
      if (!ok) return;
      cust.classList.add("away");
      await ctx.wait(500);
      newCustomer();
    });

    /* ---------- 📸 내 작품 ---------- */
    ctx.tap(bPic, async () => {
      if (busy || bPic.dataset.busy) return;
      if (!st.scoops.length) {
        ctx.miss(bPic, "먼저 아이스크림을 만들어요!");
        return;
      }
      if (!unsavedPic) {
        KP.voice.say("벌써 찍었어요!");
        return;
      }
      bPic.dataset.busy = "1";
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      A.noise({ dur: 0.08, vol: 0.18, hp: 1200, when: 0.09 });
      const img = await toJpeg(iceSVG(st));
      if (img) {
        const ok = await KP.db.put("art", { id: KP.newId(), kind: "icecream", img, t: Date.now(), date: KP.gate.monthDay() });
        flyAway(img, cone);
        if (ok) {
          unsavedPic = false;
          KP.toast("🖼️ 내 작품에 저장했어요!");
          KP.voice.say("찰칵! 내 작품에 저장했어요!");
          A.sfx("sticker");
        } else KP.toast("저장하지 못했어요");
      }
      delete bPic.dataset.busy;
    });
    function toJpeg(svg) {
      return new Promise((res) => {
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = 760;
          c.height = 1000;
          const x = c.getContext("2d");
          const g = x.createLinearGradient(0, 0, 0, 1000);
          g.addColorStop(0, "#ffeef6");
          g.addColorStop(0.7, "#ffe0ee");
          g.addColorStop(0.7, "#ffd9b8");
          g.addColorStop(1, "#ffcfa3");
          x.fillStyle = g;
          x.fillRect(0, 0, 760, 1000);
          for (let i = 0; i < 19; i++) {
            x.fillStyle = i % 2 ? "#fff" : "#ff8fb8";
            x.fillRect(i * 40, 0, 40, 90);
          }
          x.drawImage(im, 130, 140, 500, 940 * (500 / 540));
          try {
            res(c.toDataURL("image/jpeg", 0.85));
          } catch (e) {
            res(null);
          }
        };
        im.onerror = () => res(null);
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg width="200" height="376" '));
      });
    }
    function flyAway(img, fromEl) {
      const a = fromEl.getBoundingClientRect();
      const home = ctx.root.querySelector(".bar .home");
      const b = home ? home.getBoundingClientRect() : { left: 0, top: 0, width: 40, height: 40 };
      const f = U.el("img");
      f.src = img;
      Object.assign(f.style, {
        position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", objectFit: "contain",
        zIndex: 90, borderRadius: "18px", pointerEvents: "none", transition: "transform .9s cubic-bezier(.5,-0.35,.6,1), opacity .9s",
      });
      document.body.appendChild(f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          f.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.06) rotate(25deg)";
          f.style.opacity = "0.5";
        })
      );
      setTimeout(() => {
        f.remove();
        if (home) U.replay(home, "bump");
      }, 950);
    }
    ctx.newCustomer = newCustomer;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.newCustomer();
  },
});

;

/* ==== js/games/make/paintbook.js ==== */
/* 색칠 놀이 — 그림 칸을 톡 눌러 색 채우기 + 🖍️ 크레파스로 칸 안에 쓱쓱 칠하기
   - 장면 8개(쉬운 것 → 칸이 많은 것: 집·자동차·물고기·로켓·꽃·성·나비·공룡), 장면 고르기는 썸네일 창
   - 도구: 🪣 붓기(칸 한 번에) / 🖍️ 크레파스(누른 칸 안에서만 칠해짐 — 칸 모양 clipPath)
   - 작은 칸(꽃잎·공룡 점)은 살짝 빗나가도 가까운 작은 칸이 칠해짐
   - 색 12가지 + 무지개·반짝이 특수색, 되돌리기, 처음처럼(꾹)
   - 칠한 상태는 장면마다 자동 저장(KP.store "paintbook:fills") → 껐다 켜도 그대로
   - ✅ 완성 → 내 작품(kind "paint") 저장 → 그림을 액자로 크게 보여 주고 → 축하 → 그다음 새 종이
   - 🖨️ 장면 고르기 화면에서 빈 도안 출력(종이에 크레파스로 칠하기) */
"use strict";
KP.game({
  id: "paintbook",
  icon: "🖍️",
  name: "색칠 놀이",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("paintbook", `
      .pb{flex:1;min-height:0;display:grid;gap:10px;padding:2px 12px 12px;
        --sw:clamp(40px,6.6vh,54px);--ab:clamp(54px,8.6vh,68px);
        grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"acts board pal"}
      .pb .board{grid-area:board;margin:0;background:#fff;border:4px solid #fff}
      .pb-acts{grid-area:acts;display:flex;flex-direction:column;gap:10px;justify-content:center;align-items:center}
      .pb-pal{grid-area:pal;display:grid;grid-template-columns:repeat(2,var(--sw));gap:10px;align-content:center;justify-content:center}
      .pb-act{width:var(--ab);height:var(--ab);border-radius:20px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);font-size:calc(var(--ab) * .56);display:flex;align-items:center;justify-content:center;position:relative}
      .pb-act:active{transform:translateY(3px)}
      .pb-act.done{background:var(--grass);box-shadow:0 5px 0 #1d7f45}
      .pb-act.off{opacity:.4}
      .pb-act.scn svg{width:80%;height:80%}
      .pb-tools{grid-column:1/-1;display:flex;gap:8px;justify-content:center}
      .pb-tool{min-width:var(--sw);height:var(--sw);padding:0 6px;border-radius:16px;background:#fff;box-shadow:0 4px 0 rgba(47,58,102,.14);display:flex;align-items:center;justify-content:center;gap:4px;font-size:calc(var(--sw) * .5);line-height:1}
      .pb-tool span{display:none;font-size:14px;color:var(--ink)}
      .pb-tool.sel{background:#ffe79a;box-shadow:0 0 0 3px var(--ink),0 4px 0 rgba(47,58,102,.14)}
      .pb-card .lv{font-size:.8em;opacity:.85;margin-left:2px}
      .pb-polar{position:fixed;left:50%;top:46%;z-index:90;width:min(74vw,520px);background:#fff;border-radius:18px;padding:12px 12px 8px;box-shadow:0 16px 40px rgba(0,0,0,.3);
        transform:translate(-50%,-50%) rotate(-3deg);animation:pbPolar .45s cubic-bezier(.3,1.5,.6,1) backwards;pointer-events:none;text-align:center;font-size:clamp(18px,2.6vw,26px);color:var(--ink)}
      .pb-polar img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 2px #eef1f7}
      .pb-polar b{display:block;font-weight:400;padding-top:6px}
      .pb-polar.go{transition:transform .9s cubic-bezier(.5,-0.35,.6,1),opacity .9s}
      @keyframes pbPolar{from{transform:translate(-50%,-50%) scale(.3) rotate(-14deg);opacity:0}}
      .pb-board.wipe svg{animation:pbWipe .7s ease-in-out}
      @keyframes pbWipe{0%{transform:none}45%{transform:translateX(-8%) rotate(-3deg);opacity:.2}55%{transform:translateX(8%) rotate(3deg);opacity:.2}100%{transform:none;opacity:1}}
      .pb-sw{width:var(--sw);height:var(--sw);border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.14);transition:transform .12s}
      .pb-sw.light{border-color:#e4e8f2}
      .pb-sw.sel{transform:scale(1.18);box-shadow:0 0 0 4px var(--ink),0 4px 0 rgba(0,0,0,.14)}
      .pb-sw.myPaint{position:relative;border-color:#ffe7a3}
      .pb-sw.myPaint .tag{position:absolute;right:-9px;top:-9px;font-size:calc(var(--sw) * .36);line-height:1;pointer-events:none}
      .pb-sep{grid-column:1/-1;height:3px;margin:1px 4px;border-radius:3px;background:repeating-linear-gradient(90deg,#c9d2e6 0 6px,transparent 6px 11px)}
      .pb-pal.mine3{grid-template-columns:repeat(3,var(--sw))}
      /* 내 물감 묶음: 넓은 화면에선 격자에 그대로 섞임(display:contents), 폰에선 한 줄 가로 스크롤 */
      .pb-mine{display:contents}
      .pb-svg .pb-r{cursor:pointer;transition:fill .18s}
      .pb-svg .pb-r.pop{animation:pbPop .35s ease-out;transform-box:fill-box;transform-origin:center}
      @keyframes pbPop{40%{transform:scale(1.06)}}
      .pb-spark{position:fixed;pointer-events:none;z-index:40;font-size:34px;animation:pbSpark .7s ease-out forwards}
      @keyframes pbSpark{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(-50%,-120%) scale(1.3);opacity:0}}
      .pb-pick{position:absolute;inset:0;z-index:20;background:rgba(238,249,255,.97);display:none;flex-direction:column;align-items:center;padding:10px 14px 16px;gap:10px}
      .pb-pick.show{display:flex;animation:enter .3s}
      .pb-pick h3{font-weight:400;font-size:clamp(22px,3.4vw,32px);color:var(--ink)}
      .pb-grid{flex:1;min-height:0;width:100%;max-width:980px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-content:center;overflow-y:auto}
      .pb-card{background:#fff;border-radius:20px;padding:8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:4px;font-size:clamp(16px,2.2vw,22px);animation:cardIn .4s backwards;animation-delay:calc(var(--i) * 40ms)}
      .pb-card svg{width:100%;aspect-ratio:4/3;display:block;border-radius:12px;background:#fff}
      .pb-card.now{box-shadow:0 0 0 5px var(--sun),var(--shadow)}
      .pb-card:active{transform:scale(.96)}
      /* 세로 화면(폰·세로 태블릿): 위 단추 줄 / 그림 / 아래 도구+색. 폰에서도 단추·색 64px 안팎 (2026-11-08) */
      @media (max-aspect-ratio:1/1){
        .pb{gap:8px;padding:2px 6px 8px;--sw:clamp(52px,min(calc((100vw - 50px) / 5 - 4px),8vh),72px);--ab:clamp(56px,min(calc((100vw - 56px) / 5),9vh),86px);
          grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"acts" "board" "pal"}
        .pb-acts{flex-direction:row;gap:6px}
        .pb-pal,.pb-pal.mine3{grid-template-columns:repeat(auto-fit,var(--sw));gap:6px 5px}
        /* 내 물감이 많아도 그림판이 작아지지 않게: 한 줄로 두고 옆으로 밀어 봄 (2026-11-08) */
        .pb-mine{grid-column:1/-1;display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:8px 10px;margin:-6px 0;scrollbar-width:none;touch-action:pan-x}
        .pb-mine::-webkit-scrollbar{display:none}
        .pb-mine>.pb-sw{flex:none}
        .pb-mine>:first-child{margin-left:auto}
        .pb-mine>:last-child{margin-right:auto}
      }
      /* 폰 세로 + 내 물감: 도구 2개(글자 숨김)와 내 물감 줄을 한 줄에 → 그림판이 덜 줄어듦 */
      @media (max-aspect-ratio:1/1) and (max-width:560px){
        .pb-pal.hasMine .pb-tools{grid-column:1/span 2;gap:5px}
        .pb-pal.hasMine .pb-tool{padding:0;width:var(--sw)}
        .pb-pal.hasMine .pb-tool span{display:none}
        .pb-pal.hasMine .pb-mine{grid-column:3/-1;padding:8px 6px;margin:-8px 0}
        .pb-tool span{display:inline}
        .pb-tool{padding:0 14px}
        .pb-grid{grid-template-columns:repeat(2,1fr);gap:10px}
      }
      @media (orientation:landscape) and (max-height:500px){
        /* 폰 가로: 5칸 격자 → 기본 14색이 3줄에 다 보임(무지개·반짝이 안 잘림), 내 물감은 위 한 줄 가로 스크롤 (2026-11-08) */
        .pb{gap:8px;padding:2px 10px 8px;--sw:min(14.4vh,56px);--ab:min(16.4vh,64px)}
        .pb-tool{min-width:var(--ab);height:var(--ab);font-size:calc(var(--ab) * .5)} /* 도구(🪣/🖍️) 64px (2026-11-09) */
        .pb-acts{gap:6px}
        .pb-pal,.pb-pal.mine3{grid-template-columns:repeat(5,var(--sw));gap:6px;align-content:center;overflow-y:auto;padding:8px 10px}
        .pb-mine{grid-column:1/-1;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:7px 9px;margin:-7px -9px;scrollbar-width:none;touch-action:pan-x}
        .pb-mine::-webkit-scrollbar{display:none}
        .pb-mine>.pb-sw{flex:none}
      }
    `);

    /* ---------- 장면 ---------- */
    const LINE = "#3b3552";
    const at = (o) =>
      Object.entries(o)
        .map(([k, v]) => k + '="' + v + '"')
        .join(" ");
    const r = (tag, o) => "<" + tag + ' class="pb-r" fill="#ffffff" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round" ' + at(o) + "/>";
    const bgR = (o) => "<rect class=\"pb-r\" fill=\"#ffffff\" stroke=\"none\" " + at(Object.assign({ x: 0, y: 0, width: 400, height: 300 }, o || {})) + "/>";
    const l = (d, w) => '<path d="' + d + '" fill="none" stroke="' + LINE + '" stroke-width="' + (w || 4) + '" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>';
    const dk = (tag, o) => "<" + tag + ' fill="' + LINE + '" pointer-events="none" ' + at(o) + "/>";
    const star = (cx, cy, R, rr = 0.45) => {
      const p = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5,
          rad = k % 2 ? R * rr : R;
        p.push((cx + Math.cos(a) * rad).toFixed(1) + "," + (cy + Math.sin(a) * rad).toFixed(1));
      }
      return r("polygon", { points: p.join(" ") });
    };
    const cloud = (x, y, s = 1) =>
      r("path", { d: `M${x} ${y} a${16 * s} ${16 * s} 0 0 1 ${22 * s} ${-18 * s} a${22 * s} ${22 * s} 0 0 1 ${40 * s} ${2 * s} a${16 * s} ${16 * s} 0 0 1 ${8 * s} ${30 * s} h${-62 * s} a${12 * s} ${12 * s} 0 0 1 ${-8 * s} ${-14 * s}z` });
    const smallFlower = (x, y) =>
      [0, 72, 144, 216, 288].map((a) => r("circle", { cx: x + Math.cos((a * Math.PI) / 180) * 9, cy: y + Math.sin((a * Math.PI) / 180) * 9, r: 7 })).join("") + r("circle", { cx: x, cy: y, r: 6 });

    const SCENES = [
      {
        id: "house", em: "🏠", name: "집", hard: 0,
        svg: () =>
          bgR() + r("path", { d: "M0 228 Q200 205 400 228 L400 300 L0 300Z" }) +
          r("circle", { cx: 58, cy: 56, r: 28 }) + l("M58 16 V6 M58 96 V106 M18 56 H8 M98 56 H108 M30 28 L23 21 M86 84 L93 91 M86 28 L93 21 M30 84 L23 91", 4) +
          cloud(278, 64, 1.1) +
          r("rect", { x: 240, y: 70, width: 24, height: 48 }) +
          r("polygon", { points: "92,138 200,58 308,138" }) +
          r("rect", { x: 112, y: 138, width: 176, height: 104 }) +
          r("rect", { x: 180, y: 176, width: 42, height: 66, rx: 6 }) + dk("circle", { cx: 213, cy: 211, r: 3.5 }) +
          r("rect", { x: 128, y: 156, width: 38, height: 36, rx: 4 }) + l("M147 156 V192 M128 174 H166", 3) +
          r("rect", { x: 236, y: 156, width: 38, height: 36, rx: 4 }) + l("M255 156 V192 M236 174 H274", 3) +
          r("path", { d: "M186 242 L216 242 L240 300 L162 300Z" }) +
          r("rect", { x: 338, y: 176, width: 16, height: 58, rx: 3 }) + r("circle", { cx: 346, cy: 156, r: 34 }) +
          smallFlower(40, 262) + smallFlower(80, 280) + smallFlower(300, 270),
      },
      {
        id: "flower", em: "🌻", name: "꽃", hard: 1,
        svg: () =>
          bgR() + r("path", { d: "M0 238 Q110 214 210 236 T400 230 L400 300 L0 300Z" }) +
          r("circle", { cx: 352, cy: 50, r: 24 }) + cloud(40, 60, 0.9) +
          r("path", { d: "M195 128 Q188 196 198 250 L208 250 Q198 196 207 128Z" }) +
          r("path", { d: "M200 206 Q160 174 136 196 Q162 224 200 212Z" }) +
          r("path", { d: "M205 184 Q246 152 268 172 Q242 202 205 192Z" }) +
          [0, 45, 90, 135, 180, 225, 270, 315].map((a) => r("ellipse", { cx: 200, cy: 58, rx: 19, ry: 33, transform: "rotate(" + a + " 200 98)" })).join("") +
          r("circle", { cx: 200, cy: 98, r: 27 }) + dk("circle", { cx: 191, cy: 92, r: 3.5 }) + dk("circle", { cx: 209, cy: 92, r: 3.5 }) + l("M190 104 Q200 113 210 104", 3) +
          r("rect", { x: 144, y: 240, width: 112, height: 16, rx: 6 }) + r("path", { d: "M152 256 H248 L236 298 H164Z" }) +
          smallFlower(60, 262) + smallFlower(340, 266),
      },
      {
        id: "fish", em: "🐠", name: "물고기", hard: 0,
        svg: () =>
          bgR() + r("path", { d: "M0 262 Q100 248 200 262 T400 258 L400 300 L0 300Z" }) +
          r("path", { d: "M40 262 Q20 222 42 190 Q60 160 44 130 Q74 160 60 190 Q46 224 58 262Z" }) +
          r("path", { d: "M356 262 Q336 230 352 200 Q368 176 356 152 Q384 176 372 204 Q360 232 372 262Z" }) +
          r("path", { d: "M262 150 L338 96 Q326 150 338 204Z" }) +
          r("path", { d: "M150 98 Q190 50 242 98Z" }) + r("path", { d: "M168 198 Q200 238 228 200Z" }) +
          r("ellipse", { cx: 180, cy: 150, rx: 100, ry: 58 }) +
          r("path", { d: "M196 94 Q178 150 196 206 L222 202 Q206 150 220 98Z" }) +
          r("path", { d: "M240 104 Q228 150 240 196 L258 186 Q250 150 258 114Z" }) +
          l("M122 120 Q138 150 122 180", 3) + r("circle", { cx: 108, cy: 136, r: 13 }) + dk("circle", { cx: 105, cy: 137, r: 6 }) + l("M82 162 Q92 168 100 162", 3) +
          r("circle", { cx: 70, cy: 88, r: 10 }) + r("circle", { cx: 52, cy: 58, r: 14 }) + r("circle", { cx: 78, cy: 30, r: 8 }) +
          star(300, 272, 18, 0.5),
      },
      {
        id: "car", em: "🚗", name: "자동차", hard: 0,
        svg: () =>
          bgR() + r("rect", { x: 0, y: 236, width: 400, height: 64 }) + '<path d="M10 272 H390" stroke="' + LINE + '" stroke-width="4" stroke-dasharray="26 18" pointer-events="none"/>' +
          r("circle", { cx: 340, cy: 52, r: 26 }) + cloud(50, 62, 1) +
          r("path", { d: "M118 140 L150 90 H252 L292 140Z" }) +
          r("path", { d: "M140 136 L162 100 H196 V136Z" }) + r("path", { d: "M206 136 V100 H244 L270 136Z" }) +
          r("rect", { x: 54, y: 136, width: 294, height: 66, rx: 22 }) + l("M201 140 V198", 3) + l("M180 156 H192 M220 156 H232", 3) +
          r("circle", { cx: 332, cy: 158, r: 10 }) + r("rect", { x: 58, y: 150, width: 12, height: 18, rx: 3 }) +
          r("rect", { x: 40, y: 184, width: 30, height: 14, rx: 6 }) + r("rect", { x: 332, y: 184, width: 30, height: 14, rx: 6 }) +
          r("circle", { cx: 120, cy: 206, r: 30 }) + r("circle", { cx: 120, cy: 206, r: 12 }) +
          r("circle", { cx: 284, cy: 206, r: 30 }) + r("circle", { cx: 284, cy: 206, r: 12 }),
      },
      {
        id: "castle", em: "🏰", name: "성", hard: 1,
        svg: () =>
          bgR() + r("path", { d: "M0 250 Q200 232 400 250 L400 300 L0 300Z" }) + cloud(300, 60, 0.9) + r("circle", { cx: 50, cy: 44, r: 22 }) +
          r("path", { d: "M118 150 V132 H136 V146 H152 V132 H170 V146 H186 V132 H214 V146 H230 V132 H248 V146 H264 V132 H282 V252 H118Z" }) +
          r("rect", { x: 58, y: 118, width: 60, height: 134 }) + r("polygon", { points: "50,120 88,48 126,120" }) + l("M88 48 V22", 3) + r("polygon", { points: "88,22 114,30 88,38" }) +
          r("rect", { x: 282, y: 118, width: 60, height: 134 }) + r("polygon", { points: "274,120 312,48 350,120" }) + l("M312 48 V22", 3) + r("polygon", { points: "312,22 338,30 312,38" }) +
          r("rect", { x: 166, y: 92, width: 68, height: 160 }) + r("polygon", { points: "158,94 200,26 242,94" }) + l("M200 26 V8", 3) + r("polygon", { points: "200,8 222,15 200,22" }) +
          r("path", { d: "M178 252 V214 a22 22 0 0 1 44 0 V252Z" }) + l("M200 194 V252", 3) +
          r("circle", { cx: 200, cy: 134, r: 13 }) +
          r("path", { d: "M78 178 v-16 a10 10 0 0 1 20 0 v16Z" }) + r("path", { d: "M302 178 v-16 a10 10 0 0 1 20 0 v16Z" }) +
          smallFlower(30, 276) + smallFlower(370, 276),
      },
      {
        id: "rocket", em: "🚀", name: "로켓", hard: 0,
        svg: () =>
          bgR() + r("circle", { cx: 332, cy: 60, r: 32 }) + r("circle", { cx: 322, cy: 50, r: 7 }) + r("circle", { cx: 344, cy: 74, r: 5 }) +
          r("circle", { cx: 72, cy: 228, r: 36 }) + r("path", { d: "M14 246 Q72 214 132 214 Q140 220 128 226 Q72 240 18 256 Q8 254 14 246Z" }) +
          star(60, 60, 16) + star(126, 126, 11) + star(352, 172, 14) + star(300, 262, 12) + star(360, 120, 8) +
          r("path", { d: "M176 238 Q200 300 224 238Z" }) + r("path", { d: "M188 238 Q200 272 212 238Z" }) +
          r("path", { d: "M168 186 L130 238 L172 232Z" }) + r("path", { d: "M232 186 L270 238 L228 232Z" }) +
          r("path", { d: "M200 40 Q250 92 236 240 H164 Q150 92 200 40Z" }) +
          r("path", { d: "M200 40 Q222 60 232 86 H168 Q178 60 200 40Z" }) +
          r("rect", { x: 166, y: 210, width: 68, height: 22, rx: 4 }) +
          r("circle", { cx: 200, cy: 134, r: 22 }) + r("circle", { cx: 200, cy: 134, r: 13 }),
      },
      {
        id: "dino", em: "🦕", name: "공룡", hard: 1,
        svg: () =>
          bgR() + r("path", { d: "M0 246 Q200 230 400 246 L400 300 L0 300Z" }) + r("circle", { cx: 60, cy: 50, r: 24 }) +
          r("path", { d: "M276 248 L330 132 H356 L400 210 V248Z" }) + r("path", { d: "M330 132 Q343 112 356 132 L350 146 Q343 136 336 146Z" }) + cloud(330, 70, 0.7) +
          r("rect", { x: 110, y: 200, width: 24, height: 46, rx: 9 }) + r("rect", { x: 142, y: 206, width: 24, height: 42, rx: 9 }) +
          r("rect", { x: 182, y: 204, width: 24, height: 44, rx: 9 }) + r("rect", { x: 210, y: 198, width: 24, height: 48, rx: 9 }) +
          r("path", { d: "M106 184 Q44 198 12 150 Q56 182 112 162Z" }) +
          r("polygon", { points: "108,152 116,128 128,148" }) + r("polygon", { points: "128,142 140,116 152,138" }) + r("polygon", { points: "152,136 166,110 178,136" }) + r("polygon", { points: "178,140 192,116 202,146" }) +
          r("path", { d: "M198 168 Q214 86 248 72 L268 90 Q238 102 232 178Z" }) +
          r("ellipse", { cx: 164, cy: 180, rx: 72, ry: 46 }) +
          r("ellipse", { cx: 266, cy: 78, rx: 28, ry: 19 }) + dk("circle", { cx: 274, cy: 72, r: 4 }) + l("M270 88 Q280 92 290 84", 3) +
          r("circle", { cx: 140, cy: 168, r: 11 }) + r("circle", { cx: 172, cy: 154, r: 8 }) + r("circle", { cx: 192, cy: 186, r: 10 }) + r("circle", { cx: 124, cy: 194, r: 7 }),
      },
      {
        id: "butterfly", em: "🦋", name: "나비", hard: 1,
        svg: () =>
          bgR() + r("path", { d: "M0 262 Q200 246 400 262 L400 300 L0 300Z" }) +
          r("path", { d: "M196 140 Q120 36 68 68 Q38 110 90 150 Q140 170 196 152Z" }) + r("path", { d: "M204 140 Q280 36 332 68 Q362 110 310 150 Q260 170 204 152Z" }) +
          r("path", { d: "M196 158 Q122 168 100 218 Q118 262 160 236 Q190 212 196 168Z" }) + r("path", { d: "M204 158 Q278 168 300 218 Q282 262 240 236 Q210 212 204 168Z" }) +
          r("circle", { cx: 106, cy: 98, r: 17 }) + r("circle", { cx: 294, cy: 98, r: 17 }) + r("circle", { cx: 152, cy: 128, r: 10 }) + r("circle", { cx: 248, cy: 128, r: 10 }) +
          r("circle", { cx: 140, cy: 212, r: 13 }) + r("circle", { cx: 260, cy: 212, r: 13 }) +
          r("ellipse", { cx: 200, cy: 166, rx: 11, ry: 50 }) + r("circle", { cx: 200, cy: 108, r: 15 }) +
          l("M195 96 Q180 70 170 64 M205 96 Q220 70 230 64", 3) + r("circle", { cx: 168, cy: 62, r: 6 }) + r("circle", { cx: 232, cy: 62, r: 6 }) +
          smallFlower(40, 274) + smallFlower(120, 282) + smallFlower(290, 280) + smallFlower(364, 272),
      },
    ];
    // 고르기 화면 순서: 칸이 큰 쉬운 그림 먼저 → 칸이 많은 그림(성·나비·공룡)은 뒤에 ⭐ 표시 (저장된 칠은 id 로 찾으니 순서와 무관)
    const EASY_ORDER = ["house", "car", "fish", "rocket", "flower", "castle", "butterfly", "dino"];
    SCENES.sort((a, b) => EASY_ORDER.indexOf(a.id) - EASY_ORDER.indexOf(b.id));
    const DEFS =
      '<defs><linearGradient id="pbRainbow" x1="0" y1="0" x2="1" y2="1">' +
      ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#5ac8fa", "#1e6cff", "#8e5cf7"].map((c, i) => '<stop offset="' + (i / 6).toFixed(2) + '" stop-color="' + c + '"/>').join("") +
      '</linearGradient><pattern id="pbGlitter" patternUnits="userSpaceOnUse" width="36" height="36">' +
      '<rect width="36" height="36" fill="#ffd56b"/><rect width="18" height="18" fill="#ffb0e6"/><rect x="18" y="18" width="18" height="18" fill="#a8dcff"/>' +
      '<circle cx="6" cy="7" r="2" fill="#fff"/><circle cx="27" cy="12" r="1.5" fill="#fff"/><circle cx="14" cy="28" r="2.2" fill="#fff"/><circle cx="31" cy="30" r="1.3" fill="#fff"/>' +
      '<path d="M22 2 L23.2 6 L27 7 L23.2 8 L22 12 L20.8 8 L17 7 L20.8 6Z" fill="#fff"/><path d="M8 18 L9 21 L12 22 L9 23 L8 26 L7 23 L4 22 L7 21Z" fill="#fff"/></pattern></defs>';
    const svgFor = (sc) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">' + DEFS + sc.svg() + "</svg>";

    const COLORS = [
      ["#ff3b30", "빨강"], ["#ff9500", "주황"], ["#ffd60a", "노랑"], ["#9be22d", "연두"], ["#1fb35a", "초록"], ["#5ac8fa", "하늘색"],
      ["#1e6cff", "파랑"], ["#8e5cf7", "보라"], ["#ff8fc1", "분홍"], ["#9a5b2e", "갈색"], ["#3b3552", "검정"], ["#ffffff", "하양"],
      ["url(#pbRainbow)", "무지개"], ["url(#pbGlitter)", "반짝이"],
    ];

    /* ---------- 상태 (장면별 칠한 색 영구 저장) ---------- */
    const fills = KP.store.get("paintbook:fills", {});
    let sceneId = KP.store.get("paintbook:scene", "house");
    if (!SCENES.find((s) => s.id === sceneId)) sceneId = "house";
    let color = KP.store.get("paintbook:color", "#ff3b30");
    let tool = KP.store.get("paintbook:tool", "fill"); // "fill" 붓기 | "crayon" 크레파스
    // 크레파스 획: 장면마다 [[칸 번호, 색, 굵기, 경로], ...] (오래된 것부터, 장면당 최근 MAX_STROKES 개·MAX_CHARS 글자까지만 저장)
    // 저장 용량(2026-11-08): 좌표는 정수, 획을 뗄 때 거의 일직선인 점은 빼고(간략화), 장면당 약 90KB 이하
    //   → iPad Safari localStorage(약 5MB)를 크레파스가 다 차지해 설정·사용 시간 저장까지 실패하는 일 방지
    let strokes = KP.store.get("paintbook:strokes", {});
    if (!strokes || typeof strokes !== "object" || Array.isArray(strokes)) strokes = {};
    const MAX_STROKES = 120,
      MAX_CHARS = 90000;
    /** 저장된 획 하나가 쓸 수 있는 모양인지 ([칸 번호, 색 글자, 굵기, 경로 글자]) — 깨진 백업이 와도 놀이가 안 터지게 */
    const okStroke = (x) =>
      Array.isArray(x) && x.length === 4 && Number.isInteger(x[0]) && x[0] >= 0 && typeof x[1] === "string" && x[1].length < 40 && Number.isFinite(+x[2]) && typeof x[3] === "string" && /^M[-\d. ML]+$/.test(x[3]);
    /** 경로 간략화: "M x y L x y …" → 정수 좌표 + 1.2px 안쪽으로 일직선인 점 빼기(더글러스-포커). 점 하나(콕 찍기)는 1px 짧은 선으로 */
    function simplify(d) {
      const n = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      const pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) {
        const q = [Math.round(n[i]), Math.round(n[i + 1])];
        const last = pts[pts.length - 1];
        if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
      }
      if (!pts.length) return d;
      if (pts.length === 1) return "M" + pts[0][0] + " " + pts[0][1] + "L" + (pts[0][0] + 1) + " " + pts[0][1];
      const keep = new Uint8Array(pts.length);
      keep[0] = keep[pts.length - 1] = 1;
      const stack = [[0, pts.length - 1]];
      while (stack.length) {
        const [a, b] = stack.pop();
        const [ax, ay] = pts[a],
          [bx, by] = pts[b];
        const L = Math.hypot(bx - ax, by - ay);
        let best = -1,
          bd = 1.2;
        for (let i = a + 1; i < b; i++) {
          // 양 끝이 거의 같은 점(동그라미처럼 시작점으로 돌아온 획)이면 선까지의 거리 대신 시작점에서 떨어진 거리로 — 아니면 중간 점이 전부 지워짐
          const dd = L < 0.5 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
          if (dd > bd) {
            bd = dd;
            best = i;
          }
        }
        if (best > 0) {
          keep[best] = 1;
          stack.push([a, best], [best, b]);
        }
      }
      let out = "";
      pts.forEach((q, i) => keep[i] && (out += (out ? "L" : "M") + q[0] + " " + q[1]));
      return out;
    }
    /** 장면 하나의 획 목록 → 최근 것부터 MAX_STROKES 개·MAX_CHARS 글자까지 (오래된 획부터 빠짐) */
    function capList(list) {
      let chars = 0,
        k = list.length;
      while (k > 0 && list.length - k < MAX_STROKES) {
        const c = JSON.stringify(list[k - 1]).length + 1;
        if (chars + c > MAX_CHARS) break;
        chars += c;
        k--;
      }
      return list.slice(k);
    }
    // 예전 저장값(간략화 전)은 한 번만 줄여 둠 — 읽기는 그대로 되고, 모양이 이상한 획만 빠짐
    if (KP.store.get("paintbook:strokesV", 0) < 2) {
      try {
        for (const k of Object.keys(strokes)) {
          const list = Array.isArray(strokes[k]) ? strokes[k].filter(okStroke).map(([ri, c, w, d]) => [ri, c, w, simplify(d)]) : [];
          if (list.length) strokes[k] = capList(list);
          else delete strokes[k];
        }
        KP.store.set("paintbook:strokes", strokes);
        KP.store.set("paintbook:strokesV", 2);
      } catch (_) {}
    }
    let undo = []; // {f:[[칸, 이전 색]...], p:[[획, 층]...] (지운 획 되살리기), add:획(새 획 지우기)}
    let regions = [];
    let doneSaid = false,
      unsaved = false,
      saving = false,
      loadGen = 0; // 그림판을 새로 열 때마다 +1 (저장 축하 뒤 '새 종이'가 다른 그림을 지우지 않게)
    const NS = "http://www.w3.org/2000/svg";
    /** 칸 바로 뒤의 크레파스 층(<g class="pb-lay">) — 칸 모양으로 잘려서 밖으로 안 나감, 뒤에 그려지는 칸에는 가려짐 */
    const layOf = (e) => (e && e.nextSibling && e.nextSibling.classList && e.nextSibling.classList.contains("pb-lay") ? e.nextSibling : null);
    const colored = (e) => e.getAttribute("fill") !== "#ffffff" || !!(layOf(e) && layOf(e).firstChild);
    function strokeEl(svg, sid, regs, ri, c, w, d) {
      const reg = regs[ri];
      if (!reg) return null;
      let lay = layOf(reg);
      if (!lay) {
        const cid = "pbc-" + sid + "-" + ri;
        if (!svg.querySelector("[id='" + cid + "']")) {
          const cp = document.createElementNS(NS, "clipPath");
          cp.setAttribute("id", cid);
          const sh = reg.cloneNode(false);
          sh.removeAttribute("class");
          cp.appendChild(sh);
          svg.querySelector("defs").appendChild(cp);
        }
        lay = document.createElementNS(NS, "g");
        lay.setAttribute("class", "pb-lay");
        lay.setAttribute("clip-path", "url(#" + cid + ")");
        lay.setAttribute("pointer-events", "none");
        reg.after(lay);
      }
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", c);
      p.setAttribute("stroke-width", w);
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      p.setAttribute("stroke-opacity", ".92");
      lay.appendChild(p);
      return p;
    }
    /** 저장된 획 그리기 — 모양이 깨진 획은 조용히 건너뜀(예외 없음) */
    const drawSaved = (svg, sid, regs) => {
      const list = strokes[sid];
      if (!Array.isArray(list)) return;
      list.forEach((x) => {
        if (!okStroke(x)) return;
        try {
          strokeEl(svg, sid, regs, x[0], x[1], x[2], x[3]);
        } catch (_) {}
      });
    };
    /** 칸 색 저장 (작아서 바로) */
    const saveFills = () => {
      fills[sceneId] = regions.map((e) => e.getAttribute("fill"));
      KP.store.set("paintbook:fills", fills);
    };
    /** 크레파스 획 저장 — 지금 그림판(sceneId)의 획을 모아 씀 */
    let strokeT = 0;
    const saveStrokes = () => {
      clearTimeout(strokeT);
      strokeT = 0;
      const list = [];
      regions.forEach((e, i) => {
        const lay = layOf(e);
        if (lay) [...lay.children].forEach((p) => list.push([i, p.getAttribute("stroke"), +p.getAttribute("stroke-width"), p.getAttribute("d")]));
      });
      if (list.length) strokes[sceneId] = capList(list);
      else delete strokes[sceneId];
      KP.store.set("paintbook:strokes", strokes);
    };
    /** 획을 뗄 때마다 전체를 다시 쓰지 않고 0.8초 모았다가 한 번에 (저가 태블릿 멈칫 방지) */
    const saveStrokesSoon = () => {
      clearTimeout(strokeT);
      strokeT = setTimeout(saveStrokes, 800);
    };
    /** 모아 둔 획 저장이 남아 있으면 지금 저장 (그림 바꾸기·나가기·앱 숨김 전에) */
    const flushStrokes = () => strokeT && saveStrokes();
    const saveAll = () => {
      saveFills();
      saveStrokes();
    };
    document.addEventListener("visibilitychange", () => document.hidden && flushStrokes());
    window.addEventListener("pagehide", flushStrokes);
    ctx.flushStrokes = flushStrokes;

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "pb");
    const acts = U.el("div", "pb-acts");
    const board = U.el("div", "board pb-board");
    const pal = U.el("div", "pb-pal");
    wrap.append(acts, board, pal);
    const picker = U.el("div", "pb-pick");
    ctx.body.append(wrap, picker);
    const bScene = U.btn("", "pb-act scn");
    const bUndo = U.btn(KP.E("↩️"), "pb-act");
    const bReset = U.btn(KP.E("🗑️"), "pb-act");
    const bDone = U.btn(KP.E("✅"), "pb-act done");
    acts.append(bScene, bUndo, bReset, bDone);

    /** 팔레트: 내 물감(물감 실험실에서 담은 색, 최근 6개)을 맨 앞에 🎨 표시로 → 열 때마다 다시 그림 */
    function renderPal() {
      pal.innerHTML = "";
      const mine = KP.paint
        ? KP.paint.mine().map((m) => ({ hex: m.hex.toLowerCase(), n: m.n })).filter((m) => !COLORS.some((c) => c[0] === m.hex)).slice(0, 6)
        : [];
      pal.classList.toggle("mine3", mine.length > 2);
      pal.classList.toggle("hasMine", mine.length > 0);
      // 도구: 🪣 붓기(칸 한 번에) / 🖍️ 크레파스(칸 안에서만 쓱쓱)
      const tools = U.el("div", "pb-tools");
      [["fill", "🪣", "붓기"], ["crayon", "🖍️", "크레파스"]].forEach(([k, em, nm]) => {
        const b = U.btn(KP.E(em) + "<span>" + nm + "</span>", "pb-tool" + (tool === k ? " sel" : ""));
        b.dataset.tool = k;
        ctx.tap(b, () => {
          tool = k;
          KP.store.set("paintbook:tool", k);
          U.$$(".pb-tool", pal).forEach((x) => x.classList.toggle("sel", x === b));
          U.replay(b, "jump");
          A.sfx("tap");
          KP.voice.say(nm + "!");
          ctx.hint(() => regions[Math.min(regions.length - 1, 2)], k === "crayon" ? "색을 고르고 쓱쓱 칠해요." : "그림을 톡 눌러 칠해 봐요!");
        });
        tools.appendChild(b);
      });
      pal.appendChild(tools);
      const mineBox = mine.length ? pal.appendChild(U.el("div", "pb-mine")) : null;
      mine.map((m) => [m.hex, m.n, true]).concat(COLORS).forEach(([c, name, my], i) => {
        if (mine.length && i === mine.length) pal.appendChild(U.el("span", "pb-sep"));
        const b = U.btn(my ? '<span class="tag">' + KP.E("🎨") + "</span>" : "", "pb-sw" + (my ? " myPaint" : "") + (c === "#ffffff" ? " light" : "") + (c === "url(#pbRainbow)" ? " rainbow swatch" : "") + (c === "url(#pbGlitter)" ? " glitter swatch" : ""));
        if (!c.startsWith("url")) b.style.background = c;
        b.dataset.c = c;
        ctx.tap(b, () => {
          color = c;
          KP.store.set("paintbook:color", c);
          U.$$(".pb-sw", pal).forEach((x) => x.classList.toggle("sel", x === b));
          U.replay(b, "jump");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.22 });
          if (c === "url(#pbGlitter)") A.sfx("sparkle");
          KP.voice.say(my ? "내가 만든 " + (name || "물감") : name);
        });
        (my ? mineBox : pal).appendChild(b);
      });
    }
    renderPal();
    ctx.renderPal = renderPal;
    const markColor = () => U.$$(".pb-sw", pal).forEach((x) => x.classList.toggle("sel", x.dataset.c === color));

    function load(id) {
      flushStrokes(); // 앞 그림의 모아 둔 획부터 저장 (sceneId 가 바뀌기 전에)
      loadGen++;
      sceneId = id;
      KP.store.set("paintbook:scene", id);
      const sc = SCENES.find((s) => s.id === id);
      board.innerHTML = svgFor(sc);
      const svg = board.firstChild;
      svg.classList.add("pb-svg");
      regions = U.$$(".pb-r", svg);
      const saved = fills[id] || [];
      regions.forEach((e, i) => {
        if (saved[i]) e.setAttribute("fill", saved[i]);
      });
      drawSaved(svg, id, regions);
      bScene.innerHTML = svgFor(sc);
      undo = [];
      saving = false;
      st = null;
      board.classList.remove("wipe");
      doneSaid = isComplete();
      unsaved = regions.some(colored);
      updateUndo();
      svg.addEventListener("pointerdown", onPaint);
      svg.addEventListener("pointermove", onMove);
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => svg.addEventListener(ev, endStroke));
    }
    function isComplete() {
      return regions.length && regions.every(colored);
    }
    /** 누른 칸 찾기: 작은 칸(화면에서 28px 미만 — 폰의 꽃잎·공룡 점)은 12px 안쪽으로 빗나가도 그 칸으로 */
    function pickRegion(e) {
      const t = e.target && e.target.closest ? e.target.closest(".pb-r") : null;
      const small = (r) => Math.max(r.width, r.height) < 28;
      if (t && small(t.getBoundingClientRect())) return t;
      const ti = t ? regions.indexOf(t) : -1;
      let best = null,
        bd = 12;
      regions.forEach((g, i) => {
        if (i <= ti) return; // 누른 칸보다 위에 그려진(가리는) 칸만
        const r = g.getBoundingClientRect();
        if (!small(r)) return;
        const d = Math.hypot(Math.max(r.left - e.clientX, 0, e.clientX - r.right), Math.max(r.top - e.clientY, 0, e.clientY - r.bottom));
        if (d < bd) {
          bd = d;
          best = g;
        }
      });
      return best || t;
    }
    /* 🖍️ 크레파스 획 */
    let st = null; // {p:획, d, x, y, n, id:pointerId, svg, t}
    const svgPt = (svg, e) => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: Math.round(q.x), y: Math.round(q.y) };
    };
    function onMove(e) {
      if (!st || e.pointerId !== st.id) return;
      const q = svgPt(st.svg, e);
      if (!q || Math.hypot(q.x - st.x, q.y - st.y) < 3 || st.n > 400) return;
      st.d += "L" + q.x + " " + q.y;
      st.x = q.x;
      st.y = q.y;
      st.n++;
      st.p.setAttribute("d", st.d);
      if (st.n % 6 === 0) A.noise({ dur: 0.07, vol: 0.035, bp: 2600, bpTo: 1400, q: 1 });
    }
    function endStroke(e) {
      if (!st || (e && e.pointerId !== st.id)) return;
      const done = st;
      st = null;
      const p = done.p;
      const d2 = simplify(p.getAttribute("d") || "");
      if (d2) p.setAttribute("d", d2);
      saveStrokesSoon();
      afterPaint();
    }
    function updateUndo() {
      bUndo.classList.toggle("off", !undo.length);
    }
    function onPaint(e) {
      e.preventDefault();
      A.unlock();
      if (saving || st) return;
      const t = pickRegion(e);
      if (!t) return;
      if (tool === "crayon") {
        const svg = board.firstChild;
        const q = svgPt(svg, e);
        if (!q) return;
        const d = "M" + q.x + " " + q.y + "L" + (q.x + 0.5) + " " + q.y;
        const p = strokeEl(svg, sceneId, regions, regions.indexOf(t), color, 14, d);
        if (!p) return;
        st = { p, d, x: q.x, y: q.y, n: 0, id: e.pointerId, svg };
        try {
          svg.setPointerCapture(e.pointerId);
        } catch (_) {}
        undo.push({ add: p });
        if (undo.length > 60) undo.shift();
        updateUndo();
        unsaved = true;
        const i = Math.max(0, COLORS.findIndex((c) => c[0] === color));
        A.note(["C5", "D5", "E5", "G5", "A5", "C6"][i % 6], { inst: "marimba", dur: 0.25, vol: 0.2 });
        if (color.startsWith("url")) A.sfx("sparkle");
        ctx.hint(null);
        return;
      }
      const prev = t.getAttribute("fill");
      if (prev === color) {
        U.replay(t, "pop");
        A.sfx("tap");
        return;
      }
      undo.push({ f: [[t, prev]] });
      if (undo.length > 60) undo.shift();
      t.setAttribute("fill", color);
      U.replay(t, "pop");
      updateUndo();
      saveFills();
      unsaved = true;
      const i = Math.max(0, COLORS.findIndex((c) => c[0] === color));
      A.note(["C5", "D5", "E5", "G5", "A5", "C6"][i % 6], { inst: "marimba", dur: 0.3, vol: 0.25 });
      if (color.startsWith("url")) A.sfx("sparkle");
      else A.noise({ dur: 0.12, vol: 0.05, bp: 1800, bpTo: 600, q: 1 });
      const sp = U.el("div", "pb-spark", KP.E(color === "url(#pbGlitter)" ? "✨" : color === "url(#pbRainbow)" ? "🌈" : "⭐"));
      sp.style.left = e.clientX + "px";
      sp.style.top = e.clientY + "px";
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 800);
      ctx.hint(null);
      afterPaint();
    }
    function afterPaint() {
      if (!doneSaid && isComplete()) {
        doneSaid = true;
        ctx.after(500, () => {
          ctx.say("우와, 다 칠했어요! ✅ 초록 단추를 누르면 내 작품에 저장돼요.", "우와, 다 칠했어요! 초록 단추를 누르면 내 작품에 저장돼요.");
          U.replay(bDone, "jump");
          ctx.hint(() => bDone, "초록 단추를 눌러 저장해요!");
        });
      }
    }

    ctx.tap(bUndo, () => {
      const op = undo.pop();
      if (!op) {
        U.replay(bUndo, "wrong");
        A.sfx("bad");
        KP.voice.say("더 되돌릴 수 없어요");
        return;
      }
      if (op.add) op.add.remove();
      (op.f || []).forEach(([t, prev]) => {
        t.setAttribute("fill", prev);
        U.replay(t, "pop");
      });
      (op.p || []).forEach(([p, lay]) => lay.appendChild(p));
      saveAll();
      updateUndo();
      U.replay(bUndo, "wig");
      A.sfx("slide");
      doneSaid = isComplete();
    });
    KP.hold(
      bReset,
      900,
      () => {
        if (saving) return;
        const f = regions.filter((t) => t.getAttribute("fill") !== "#ffffff").map((t) => [t, t.getAttribute("fill")]);
        const p = [];
        regions.forEach((t) => {
          const lay = layOf(t);
          if (lay) [...lay.children].forEach((x) => p.push([x, lay]));
        });
        if (!f.length && !p.length) return;
        undo.push({ f, p });
        regions.forEach((t) => t.setAttribute("fill", "#ffffff"));
        p.forEach(([x]) => x.remove());
        saveAll();
        updateUndo();
        doneSaid = false;
        A.sfx("whoosh");
        KP.voice.say("처음처럼 하얗게 되었어요!");
      },
      () => KP.voice.say("꾹 누르고 있어요")
    );

    /* ---------- 장면 고르기 ---------- */
    function openPicker() {
      picker.innerHTML = "<h3>" + KP.E("🖼️") + " 어떤 그림을 칠할까요?</h3>";
      const bPrint = U.btn(KP.E("🖨️") + " 지금 그림 빈 도안 출력", "btn");
      bPrint.style.cssText = "position:absolute;right:14px;top:10px;font-size:clamp(14px,1.8vw,18px)";
      ctx.tap(bPrint, async () => {
        const sc = SCENES.find((s) => s.id === sceneId);
        const tmp = U.el("div");
        tmp.innerHTML = svgFor(sc);
        const img = await toJpeg(tmp.firstChild);
        if (img) KP.printImg(img, "색칠 도안 - " + sc.name);
      });
      picker.appendChild(bPrint);
      const grid = U.el("div", "pb-grid");
      SCENES.forEach((sc, i) => {
        const c = U.btn(svgFor(sc) + "<span>" + KP.E(sc.em) + " " + sc.name + (sc.hard ? '<i class="lv">' + KP.E("⭐") + "</i>" : "") + "</span>", "pb-card" + (sc.id === sceneId ? " now" : ""));
        c.style.setProperty("--i", i);
        const saved = fills[sc.id] || [];
        const cr = U.$$(".pb-r", c);
        cr.forEach((e, k) => saved[k] && e.setAttribute("fill", saved[k]));
        drawSaved(c.querySelector("svg"), sc.id, cr);
        ctx.tap(c, () => {
          A.sfx("open");
          picker.classList.remove("show");
          load(sc.id);
          ctx.say(U.josa(sc.name, "을/를") + " 예쁘게 칠해 봐요! 색을 고르고 그림을 톡!");
          ctx.hint(() => regions[Math.min(regions.length - 1, 2)], "그림을 톡 눌러 칠해 봐요!");
        });
        grid.appendChild(c);
      });
      picker.appendChild(grid);
      picker.classList.add("show");
      KP.voice.say("어떤 그림을 칠할까요?");
    }
    ctx.tap(bScene, () => {
      if (saving || bDone.dataset.busy) {
        // 액자·축하 중: 다른 그림을 고르면 '새 종이'가 그 그림을 지워 버리던 문제 → 잠깐 막음
        U.replay(bScene, "wig");
        return;
      }
      A.sfx("open");
      openPicker();
    });

    /* ---------- 완성 → 저장 ---------- */
    ctx.tap(bDone, async () => {
      if (bDone.dataset.busy || saving) return;
      const nColored = regions.filter(colored).length;
      if (!nColored) {
        ctx.miss(bDone, "먼저 색을 칠해 봐요!");
        return;
      }
      if (!unsaved) {
        U.replay(bDone, "wig");
        KP.voice.say("벌써 내 작품에 저장했어요!");
        return;
      }
      bDone.dataset.busy = "1";
      const img = await toJpeg(board.firstChild);
      if (!img) {
        delete bDone.dataset.busy;
        KP.toast("저장하지 못했어요");
        return;
      }
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "paint", img, t: Date.now(), date: KP.gate.monthDay() });
      if (ok) {
        unsaved = false;
        saving = true; // 축하가 끝날 때까지 그림은 그대로 보여 주고 칠하기는 잠시 멈춤
        const gen = loadGen; // 저장한 그림판 — 그사이 다른 그림(또는 다시 연 그림판)이면 지우지 않음
        clearTimeout(strokeT); // 모아 둔 획 저장은 버림 (이 그림 기록은 아래에서 비움)
        strokeT = 0;
        const full = isComplete();
        // 칠한 기록은 바로 비워 둠 (축하 중에 나가도 다음엔 새 종이) — 화면의 그림은 축하 뒤에 지움
        delete fills[sceneId];
        delete strokes[sceneId];
        KP.store.set("paintbook:fills", fills);
        KP.store.set("paintbook:strokes", strokes);
        undo = [];
        updateUndo();
        doneSaid = false;
        delete bDone.dataset.busy; // 기다리는 중에 나가도 버튼이 잠기지 않게
        // 내 그림을 액자로 크게 보여 준 뒤 → 홈(내 작품) 쪽으로 날아감
        showSaved(img);
        A.sfx("sticker");
        ctx.say("🖼️ 내 작품에 저장했어요!", "내 작품에 저장했어요!");
        await ctx.wait(2300);
        ctx.round = (ctx.round || 0) + 1;
        // 열쇠 별: 칸을 충분히(4칸 이상·전체의 30% 이상) 칠했을 때만 (한 칸만 칠하고 저장 반복 방지)
        if (nColored < Math.max(4, Math.ceil(regions.length * 0.3))) ctx._fewChoice = true;
        const res = await ctx.win({ big: full, msg: "내 작품에 저장했어요!" });
        if (res === false) return;
        if (gen !== loadGen) return; // 그사이 다른 그림을 열었음 → 그 그림은 그대로 (load 가 saving 을 풀어 둠)
        // 새 종이: 종이를 휙 바꾸는 연출과 함께 하얗게
        board.classList.remove("wipe");
        void board.offsetWidth;
        board.classList.add("wipe");
        A.sfx("whoosh");
        await ctx.wait(330);
        if (gen !== loadGen) return;
        regions.forEach((t) => {
          t.setAttribute("fill", "#ffffff");
          const lay = layOf(t);
          if (lay) lay.remove();
        });
        saving = false;
        ctx.say("새 종이가 준비됐어요. 새 종이에 또 해 볼까요?");
        ctx.hint(() => regions[Math.min(regions.length - 1, 2)], "그림을 톡 눌러 칠해 봐요!");
        await ctx.wait(500);
        board.classList.remove("wipe");
      } else {
        delete bDone.dataset.busy;
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
      }
    });
    /** 저장한 그림을 액자처럼 가운데 크게 1.6초 → 홈 단추(내 작품) 쪽으로 날아감 (화면을 나가도 저절로 사라짐) */
    function showSaved(img) {
      const f = U.el("div", "pb-polar", '<img alt="" draggable="false"><b>' + KP.E("🖼️") + " 내 작품</b>");
      f.querySelector("img").src = img;
      document.body.appendChild(f);
      setTimeout(() => {
        const a = f.getBoundingClientRect();
        const home = ctx.root.querySelector(".bar .home");
        const b = home ? home.getBoundingClientRect() : { left: 0, top: 0, width: 40, height: 40 };
        f.classList.add("go");
        f.style.transform =
          "translate(calc(-50% + " + (b.left + b.width / 2 - a.left - a.width / 2) + "px), calc(-50% + " + (b.top + b.height / 2 - a.top - a.height / 2) + "px)) scale(.06) rotate(25deg)";
        f.style.opacity = "0.4";
        setTimeout(() => {
          f.remove();
          if (home) U.replay(home, "bump");
        }, 950);
      }, 1600);
    }
    function toJpeg(svgEl) {
      return new Promise((res) => {
        const clone = svgEl.cloneNode(true);
        clone.setAttribute("width", "1000");
        clone.setAttribute("height", "750");
        const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = 1000;
          c.height = 750;
          const x = c.getContext("2d");
          x.fillStyle = "#fff";
          x.fillRect(0, 0, 1000, 750);
          x.drawImage(im, 0, 0, 1000, 750);
          try {
            res(c.toDataURL("image/jpeg", 0.85));
          } catch (e) {
            res(null);
          }
        };
        im.onerror = () => res(null);
        im.src = src;
      });
    }
    ctx.load = () => load(sceneId);
    ctx.markColor = markColor;
    ctx.picker = picker;
    ctx.sceneName = () => SCENES.find((s) => s.id === sceneId).name;
    ctx.firstRegion = () => regions[Math.min(regions.length - 1, 2)];
  },
  start(ctx) {
    ctx.picker.classList.remove("show");
    ctx.renderPal();
    ctx.load();
    ctx.markColor();
    ctx.say("색을 고르고 그림을 톡 눌러 칠해 봐요! " + KP.u.josa(ctx.sceneName(), "을/를") + " 칠해 볼까요?");
    ctx.hint(() => ctx.firstRegion(), "그림을 톡 눌러 칠해 봐요!");
  },
  stop(ctx) {
    ctx.flushStrokes(); // 모아 둔 크레파스 획 저장
  },
});

;

/* ==== js/games/make/paintlab.js ==== */
/* =====================================================================
   🧪 물감 실험실 + 📖 색깔 도감 — 점토 물감 작업실
   - 점토 작업실 배경(assets/play-clay/paint/bg.jpg) 의 흰 팔레트 접시 자리에 섞는 그릇(탁자 위처럼 살짝 눕힘)
   - 점토 물감 튜브를 누르면 한 방울 쭉, 꾹 누르면 계속 (양만큼 색이 변함 — 진짜 물감처럼 섞는 계산, core/paint.js)
   - 나무 주걱(손가락)으로 빙글빙글 저으면 걸쭉한 물감이 줄무늬로 끌리다가 한 색이 됨 (두께 음영·광택·주걱 자국)
   - 다 섞이면 색 이름을 말해 주고, 처음 만든 색이면 "새 색깔 발견!" → 도감에 기록 (못 찾은 색은 레시피 방울로 힌트)
   - 🫙 내 물감에 담기 → 🖌️ 칠하러 가기(색칠 공방, 방금 담은 색을 골라 둠)·그림 그리기·색칠 놀이·데칼코마니 팔레트
   - 그릇 상태는 나갔다 와도, 앱을 껐다 켜도 그대로 (예전 44칸 그릇도 옮겨 담음)
===================================================================== */
"use strict";
KP.game({
  id: "paintlab",
  icon: "🧪",
  name: "물감 실험실",
  cat: "make",
  badge: "NEW",
  setup(ctx) {
    const U = KP.u,
      P = KP.paint;
    const TILT = 0.74; // 그릇을 탁자 위처럼 눕힌 정도
    KP.css("paintlab", `
      .plStage{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;margin:0 10px 10px;border-radius:26px;overflow:hidden;box-shadow:var(--shadow)}
      .plW{flex:1;min-height:0;display:grid;gap:8px;padding:8px 10px 10px;
        grid-template-areas:"jars" "bowl" "acts" "mine";grid-template-rows:auto minmax(0,1fr) auto auto;justify-items:center;align-items:center}
      .plBowlCell{grid-area:bowl;min-height:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
      .plJarsCell{grid-area:jars}
      .plActs{grid-area:acts;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
      .plB{background:rgba(255,251,242,.95);border-radius:20px;box-shadow:0 6px 0 rgba(110,70,30,.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-width:76px;min-height:66px;font-size:14px;line-height:1.1;color:var(--ink)}
      .plB .e{font-size:30px}
      .plB .pi{width:38px;height:34px;object-fit:contain}
      .plB:active{transform:translateY(4px)}
      .plB.main{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .plB.go{background:#fff3c4}
      .plMine{grid-area:mine;display:flex;align-items:center;gap:8px;max-width:100%;overflow-x:auto;padding:4px 10px;scrollbar-width:none;background:rgba(255,251,242,.85);border-radius:999px}
      .plMine::-webkit-scrollbar{display:none}
      .plMine .lb{font-size:15px;color:var(--ink2);white-space:nowrap}
      .plSw{flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.13);position:relative}
      .plSw.new{animation:popBig .5s}
      .plName{position:absolute;left:50%;top:2%;transform:translateX(-50%);background:#fffaf0;border-radius:999px;padding:6px 18px;font-size:clamp(20px,2.8vw,28px);box-shadow:0 5px 0 rgba(110,70,30,.18);display:none;align-items:center;gap:8px;white-space:nowrap;z-index:4}
      .plName.on{display:flex;animation:popIn .35s}
      .plName i{display:inline-block;width:1em;height:1em;border-radius:50%;box-shadow:inset -3px -4px 0 rgba(0,0,0,.12)}
      .plFly{position:fixed;z-index:80;width:60px;height:60px;border-radius:50%;border:4px solid #fff;pointer-events:none;transition:transform .7s cubic-bezier(.5,0,.6,1),opacity .7s}
      .plJarsCell .psJars{background:rgba(255,251,242,.55);border-radius:22px;padding:6px 8px 8px}
      @media (orientation:landscape) and (min-height:500px){
        .plW{grid-template-areas:"jars bowl acts" "mine mine mine";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) auto;padding:10px 16px 10px;gap:12px}
        .plJarsCell .psJars{display:grid;grid-template-columns:repeat(2,auto);gap:4px 6px}
        .plJarsCell .psJar{width:clamp(60px,7.5vh,82px);height:clamp(84px,12vh,112px)}
        .plActs{display:grid;grid-template-columns:repeat(2,auto)}
        .plB{min-width:92px;min-height:76px;font-size:15px}
        .plB .e{font-size:34px}
        .plB .pi{width:44px;height:38px}
      }
      @media (orientation:portrait) and (max-width:480px){
        .plStage{margin:0 6px 6px}
        .plW{padding:6px 6px 8px;gap:6px}
        .plJarsCell{max-width:100%}
        .plJarsCell .psJars{flex-wrap:nowrap;gap:4px}
        .plJarsCell .psJar{width:clamp(52px,16vw,64px);height:86px;flex:0 0 auto}
        .plJarsCell .psJar .jn{left:-3px;right:-3px;font-size:13px}
        /* (2026-11-08) 한 줄 5개(59px) → 3칸씩 2줄, 모두 64px 이상 */
        .plActs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;max-width:100%;width:100%}
        .plB{min-width:0;min-height:66px;padding:6px 2px;font-size:12.5px;word-break:keep-all;white-space:nowrap}
        .plB .pi{width:32px;height:28px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .plStage{margin:0 8px 6px}
        .plW{grid-template-areas:"bowl jars" "bowl acts" "bowl mine";grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;align-content:center;padding:4px 10px 6px;gap:6px 12px}
        .plBowlCell{grid-row:1/4;align-self:stretch}
        .plJarsCell .psJars{flex-wrap:nowrap;gap:4px;padding:4px 6px 6px}
        .plJarsCell .psJar{width:64px;height:min(22vh,86px)} /* (2026-11-09) 물감 통·단추 64px 이상 */
        .plJarsCell .psJar .jn{font-size:12px}
        .plActs{flex-wrap:nowrap;gap:5px}
        .plB{min-width:66px;min-height:66px;font-size:12px;padding:4px 5px}
        .plB .e{font-size:24px}
        .plB .pi{width:30px;height:26px}
        .plMine{justify-self:stretch}
      }
      /* 도감 */
      .dxPanel{position:absolute;inset:0;z-index:30;background:#fff8ec;display:none;flex-direction:column;padding:max(10px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))} /* 아이폰 시계 줄 아래로 */
      .dxPanel.on{display:flex;animation:enter .3s}
      .dxHead{display:flex;align-items:center;gap:12px;font-size:clamp(20px,2.8vw,28px);padding:4px 4px 10px}
      .dxHead .sp{flex:1}
      .dxGrid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:12px;align-content:start}
      .dxC{background:#fff;border-radius:22px;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 5px 0 rgba(110,70,30,.1);border:3px dashed #eadfcd}
      .dxC.got{border:3px solid #fff}
      .dxBlob{width:64px;height:64px;border-radius:46% 54% 50% 50%/52% 46% 54% 48%;background:#f1ebe0;display:flex;align-items:center;justify-content:center;font-size:28px;color:#c9bca6;box-shadow:inset -5px -6px 0 rgba(0,0,0,.08)}
      .dxC b{font-weight:400;font-size:17px}
      .dxC small{font-size:12px;color:var(--ink2)}
      .dxRec{display:flex;gap:2px;align-items:center;min-height:16px}
      .dxRec i{width:12px;height:15px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -2px -2px 0 rgba(0,0,0,.12),0 0 0 1.5px #fff}
    `);
    const stage = U.el("div", "plStage");
    const W = U.el("div", "plW");
    const bowlCell = U.el("div", "plBowlCell");
    const jarsCell = U.el("div", "plJarsCell");
    const acts = U.el("div", "plActs");
    const mine = U.el("div", "plMine");
    const nameTag = U.el("div", "plName");
    W.append(bowlCell, jarsCell, acts, mine);
    stage.appendChild(W);
    ctx.body.appendChild(stage);
    const bg = P.stageBg(stage);
    Object.assign(ctx, { W, bowlCell, mine, nameTag });

    const studio = P.studio({
      ctx,
      capacity: 60,
      tilt: TILT,
      onPour: () => {
        ctx.changed = true;
        nameTag.classList.remove("on");
        ctx.hint(() => studio.bowl.cv, "숟가락으로 빙글빙글 저어 봐요!");
      },
      onStir: () => {},
    });
    ctx.studio = studio;
    jarsCell.appendChild(studio.jarsEl);
    bowlCell.append(studio.bowlEl, nameTag);

    const img = (f) => '<img class="pi" alt="" draggable="false" src="' + P.ART + f + '">';
    const mk = (icon, label, cls = "") => U.btn(icon + "<span>" + label + "</span>", "plB " + cls);
    const bKeep = mk(KP.E("🫙"), "내 물감에 담기", "main");
    const bGo = mk(img("brush.png"), "칠하러 가기", "go");
    const bDrain = mk(img("cloth.png"), "비우기");
    const bDex = mk(KP.E("📖"), "색깔 도감");
    const bDecal = mk(KP.E("🦋"), "데칼코마니");
    acts.append(bKeep, bGo, bDrain, bDex, bDecal);
    Object.assign(ctx, { bKeep, bGo });

    // 비우기: 실수로 톡 쳐서 애써 섞은 물감이 사라지지 않게 '꾹(0.6초)' 눌러야 비워짐 (데칼코마니 새 종이와 같은 방식)
    const drain = async () => {
      if (studio.bowl.volume() < 0.05) return KP.voice.say("그릇이 벌써 비어 있어요!");
      nameTag.classList.remove("on");
      KP.voice.say("쏴아! 그릇을 비웠어요.");
      await studio.drain();
      ctx.lastName = null;
      ctx.changed = false;
      this.saveBowl(ctx);
    };
    KP.hold(bDrain, 600, drain, () => KP.audio.sfx("tick"));
    let drainDownAt = 0;
    bDrain.addEventListener("pointerdown", () => (drainDownAt = performance.now()));
    bDrain.addEventListener("click", () => {
      // 짧게 톡 누른 경우만 안내 (꾹 눌러 비운 뒤의 click 은 무시)
      if (performance.now() - drainDownAt < 550 && studio.bowl.volume() >= 0.05) KP.voice.say("꾹 누르고 있어요");
    });
    bKeep.addEventListener("click", () => this.keep(ctx));
    bGo.addEventListener("click", () => this.goPaint(ctx));
    bDex.addEventListener("click", () => this.openDex(ctx));
    bDecal.addEventListener("click", () => {
      KP.audio.sfx("open");
      if (KP.GAMES.decal) KP.open("decal");
    });

    // 도감 화면
    const dx = U.el("div", "dxPanel");
    ctx.root.appendChild(dx);
    ctx.dx = dx;

    // 크기 맞추기 + 배경의 팔레트 접시를 그릇 밑에
    ctx.fitBowl = () => {
      const r = bowlCell.getBoundingClientRect();
      const meterH = 36;
      studio.fit(Math.min(r.width * 0.96, (r.height - meterH - 8) / TILT, 760));
      requestAnimationFrame(ctx.alignBg);
    };
    // 그릇 자리가 바뀌었을 때만 배경 다시 맞춤 (글꼴·스크롤 막대 등으로 늦게 바뀌는 것도 잡게 반복에서 가끔 확인)
    let bgKey = "";
    ctx.alignBg = () => {
      const b = studio.bowl.cv.getBoundingClientRect(),
        s = stage.getBoundingClientRect();
      const key = [b.left - s.left, b.top - s.top, b.width, s.width, s.height].map(Math.round).join();
      if (key === bgKey) return;
      bgKey = key;
      bg.align(b, s);
    };
    addEventListener("resize", () => ctx._active && requestAnimationFrame(ctx.fitBowl));
  },

  start(ctx) {
    ctx.dx.classList.remove("on");
    ctx.nameTag.classList.remove("on");
    ctx.studio.setEnabled(true);
    ctx.studio.bowl.load(KP.store.get("lab:bowl", null));
    ctx.lastName = KP.store.get("lab:lastName", null);
    ctx.changed = false;
    this.renderMine(ctx);
    requestAnimationFrame(() => {
      ctx.fitBowl();
      let checkT = 0,
        stirTold = 0,
        saveT = 0;
      ctx.loop((dt, now) => {
        ctx.studio.tick(dt);
        checkT += dt;
        saveT += dt;
        if (saveT > 4) {
          saveT = 0;
          this.saveBowl(ctx);
        }
        if (checkT < 0.3) return;
        checkT = 0;
        ctx.alignBg();
        const st = ctx.studio.state,
          bowl = ctx.studio.bowl;
        const vol = bowl.volume();
        if (vol < 0.6) return;
        // 부은 뒤 가만히 있으면 젓기 안내
        if (ctx.changed && st.even < 0.78 && now - st.lastPourAt > 2600 && now - st.lastStirAt > 2600 && now - stirTold > 9000) {
          stirTold = now;
          KP.voice.say("숟가락으로 빙글빙글 저어 봐요!");
        }
        // 다 섞이면 색 이름 / 새 색깔 발견
        if (st.even >= 0.8 && ctx.changed && now - st.lastPourAt > 600) {
          ctx.changed = false;
          this.announce(ctx);
        }
      });
    });
    ctx.say(
      ctx.studio.bowl.volume() > 0.5 ? "만들던 물감이 그대로 있어요! 더 넣거나 저어 봐요." : "물감 통을 눌러서 그릇에 넣고, 손가락으로 빙글빙글 저어 봐요!"
    );
    ctx.hint(() => ctx.studio.jar(1), "물감 통을 눌러 봐요!");
  },
  stop(ctx) {
    this.saveBowl(ctx);
  },
  saveBowl(ctx) {
    const b = ctx.studio.bowl;
    KP.store.set("lab:bowl", b.volume() > 0.01 ? b.save() : null);
    KP.store.set("lab:lastName", ctx.lastName || null);
  },

  /** 다 섞였을 때 */
  async announce(ctx) {
    const U = KP.u,
      P = KP.paint;
    const c = ctx.studio.bowl.color();
    if (!c) return;
    const nm = P.nameOf(c);
    const hex = P.hex(c);
    ctx.nameTag.innerHTML = '<i style="background:' + hex + '"></i>' + nm.n + "!";
    ctx.nameTag.classList.add("on");
    const isNew = P.discover(nm.n);
    ctx.hint(() => ctx.bKeep, "마음에 들면 내 물감에 담아요!");
    if (isNew) {
      KP.audio.sfx("levelup");
      await ctx.win({ msg: "새 색깔 발견! " + nm.n + "!", big: true });
      if (ctx._active) KP.voice.say(nm.n + "! 도감에 생겼어요! 마음에 들면 내 물감에 담아요."); // 색 이름 + 공용 조각 → 자연 음성 (2026-11-09)
    } else if (nm.n !== ctx.lastName) {
      KP.audio.sfx("sparkle");
      KP.voice.say(nm.n + "! 됐어요!");
    }
    ctx.lastName = nm.n;
  },

  /** 내 물감에 담기 */
  keep(ctx) {
    const U = KP.u,
      P = KP.paint;
    const st = ctx.studio.state,
      bowl = ctx.studio.bowl;
    if (bowl.volume() < 0.5) return ctx.miss(ctx.bKeep, "먼저 물감을 넣어 봐요!", { soft: true });
    if (st.even < 0.7) return ctx.miss(ctx.bKeep, "먼저 빙글빙글 섞어 볼까요?", { soft: true });
    const tot = bowl.total(),
      c = bowl.color(),
      hex = P.hex(c),
      nm = P.nameOf(c).n;
    P.saveMine(hex, nm, tot);
    ctx.keptHex = hex;
    // 그릇에서 물감 통으로 날아가는 연출
    const a = bowl.cv.getBoundingClientRect();
    const fly = U.el("div", "plFly");
    fly.style.background = hex;
    fly.style.left = a.left + a.width / 2 - 30 + "px";
    fly.style.top = a.top + a.height / 2 - 30 + "px";
    document.body.appendChild(fly);
    this.renderMine(ctx, hex);
    const t = ctx.mine.querySelector(".plSw");
    const b = t ? t.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    requestAnimationFrame(() => {
      fly.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.6)";
      fly.style.opacity = ".6";
    });
    setTimeout(() => fly.remove(), 750);
    KP.audio.sfx("sticker");
    KP.voice.say(nm + "! 내 물감 통에 담았어요! 그림 그릴 때 쓸 수 있어요.");
    U.replay(ctx.bGo, "jump");
    ctx.hint(() => ctx.bGo, "칠하러 가요!");
  },

  /** 🖌️ 칠하러 가기: 색칠 공방을 열고 방금(또는 마지막에) 담은 내 물감을 골라 둠 */
  goPaint(ctx) {
    const P = KP.paint;
    const list = P.mine();
    if (!list.length) return ctx.miss(ctx.bGo, "먼저 내 물감에 담아요!", { soft: true });
    this.saveBowl(ctx);
    P.pick(ctx.keptHex && list.some((m) => m.hex === ctx.keptHex) ? ctx.keptHex : list[0].hex);
    KP.audio.sfx("open");
    if (KP.GAMES.zoopaint) KP.open("zoopaint");
  },

  renderMine(ctx, newHex) {
    const U = KP.u,
      P = KP.paint;
    const list = P.mine();
    ctx.mine.innerHTML = '<span class="lb">' + KP.E("🎨") + " 내 물감</span>";
    if (!list.length) {
      ctx.mine.appendChild(U.el("span", "lb", "· 아직 없어요. 섞어서 담아 보세요!"));
      return;
    }
    list.forEach((m) => {
      const s = U.el("button", "plSw" + (m.hex === newHex ? " new" : ""));
      s.style.background = m.hex;
      s.addEventListener("click", () => {
        KP.audio.sfx("tap2");
        KP.voice.say(m.n || "내 물감");
        U.replay(s, "jump");
      });
      // 어른용: 꾹 누르면 지우기
      KP.hold(s, 1500, () => {
        P.delMine(m.hex);
        this.renderMine(ctx);
        KP.toast("물감을 지웠어요");
      });
      ctx.mine.appendChild(s);
    });
  },

  /** 색깔 도감 — 못 찾은 색은 레시피 방울(물감 색 점)로 힌트 */
  openDex(ctx) {
    const U = KP.u,
      P = KP.paint;
    KP.audio.sfx("open");
    const dex = P.dex();
    const all = P.NAMES.filter((x) => x.dex);
    const got = all.filter((x) => dex[x.n]).length;
    const dx = ctx.dx;
    dx.innerHTML = "";
    const head = U.el("div", "dxHead", KP.E("📖") + "<span>색깔 도감</span><span class=\"sp\"></span><b style=\"font-weight:400\">" + got + " / " + all.length + "</b>");
    const close = U.btn(KP.E("↩️") + " 실험실로", "btn");
    close.addEventListener("click", () => {
      KP.audio.sfx("back");
      dx.classList.remove("on");
    });
    head.appendChild(close);
    const grid = U.el("div", "dxGrid");
    const recipe = (v) => {
      const m = Math.min(...v.filter((x) => x > 0));
      let h = "";
      v.forEach((x, i) => {
        const n = Math.min(4, Math.round(x / m));
        for (let k = 0; k < n; k++) h += '<i style="--c:' + P.BASE[i].hex + '"></i>';
      });
      return '<span class="dxRec">' + h + "</span>";
    };
    all.forEach((x, i) => {
      const has = dex[x.n];
      const c = U.el("button", "dxC" + (has ? " got" : ""));
      c.style.animation = "cardIn .4s backwards";
      c.style.animationDelay = i * 25 + "ms";
      c.innerHTML =
        '<span class="dxBlob" style="' + (has ? "background:" + x.hex : "") + '">' + (has ? "" : "?") + "</span><b>" + (has ? x.n : "???") + "</b>" + (has ? "<small>" + has + "</small>" : recipe(x.v));
      c.addEventListener("click", () => {
        U.replay(c, has ? "jump" : "wrong");
        KP.voice.say(has ? x.n + "! 찾았다!" : "아직 못 찾은 색이에요. 섞어서 찾아봐요!"); // 날짜는 화면에만
      });
      grid.appendChild(c);
    });
    dx.append(head, grid);
    dx.classList.add("on");
    KP.voice.say("색깔 도감이에요!"); // 몇 가지 찾았는지는 화면에만(숫자 문장은 자연 음성이 없음)
  },
});

;

/* ==== js/games/make/wipe.js ==== */
/* 숨은 그림 찾기 — 덮개를 손가락으로 문질러 숨은 친구 찾기 (아이 최애)
   - 친구는 매번 화면 이곳저곳 랜덤 위치에 숨음
   - 친구 모양(그림의 실제 윤곽 / 사진 네모) 영역을 93% 이상 지우면 성공 → 남은 덮개는 스르륵 사라짐
   - 판마다 덮개 테마: 모래·눈·뿌연 유리·진흙·낙엽·거품 (색·질감·문지르는 소리가 다름)
   - 📷 우리 캐릭터 넣기: 사진 여러 장을 한꺼번에 등록 → KP.db "photos" kind "wipe" 로 영구 저장
     (등록 직후엔 그 사진부터 숨고, 이후 기본 친구와 섞여 나옴)
   - 썸네일 줄: 개수·저장 상태 표시, 누르면 바로 그 친구가 숨음, ✖ 꾹 누르면 삭제
   - 예전 버전 localStorage "kidsWipePhotos" 가 있으면 db 로 옮기고 지움
   - 단계: 1 큰 친구 → 3 작은 친구 */
"use strict";
KP.game({
  id: "wipe",
  icon: "🧽",
  name: "숨은 그림 찾기",
  cat: "make",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("wipe", `
      .wp-top{display:flex;align-items:center;gap:10px;padding:0 12px 8px;flex:0 0 auto;min-width:0}
      .wp-add{flex:0 0 auto;display:flex;align-items:center;gap:6px;font-size:clamp(17px,2.3vw,22px);background:var(--cat);color:#fff;border-radius:20px;padding:8px 14px;
        box-shadow:0 5px 0 color-mix(in srgb,var(--cat) 60%,#000);min-height:64px}
      .wp-add .e{font-size:1.6em}
      .wp-add:active{transform:translateY(3px)}
      .wp-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
      .wp-info{font-size:clamp(13px,1.8vw,16px);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:2px}
      .wp-info b{font-weight:400;color:var(--grass)}
      .wp-info b.bad{color:#d23b3b}
      .wp-strip{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:8px 4px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;min-height:66px;align-items:center}
      .wp-strip::-webkit-scrollbar{display:none}
      .wp-th{position:relative;flex:0 0 auto;width:clamp(52px,6.4vw,62px);height:clamp(52px,6.4vw,62px);border-radius:14px;background:#fff;padding:3px;box-shadow:0 4px 0 rgba(47,58,102,.15)}
      .wp-th img{width:100%;height:100%;object-fit:cover;border-radius:11px;display:block;pointer-events:none}
      .wp-th.now{box-shadow:0 0 0 4px var(--sun),0 4px 0 rgba(47,58,102,.15)}
      .wp-th:active{transform:scale(.94)}
      .wp-del{position:absolute;top:-9px;right:-9px;width:28px;height:28px;border-radius:50%;background:#ff7b54;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.2);z-index:1}
      .wp-del.holding::before{inset:-4px;border-radius:50%}
      .wp-empty{font-size:clamp(14px,1.9vw,17px);color:var(--ink2);white-space:nowrap}
      .wp-new{flex:0 0 auto;width:64px;height:64px;border-radius:20px;background:#fff;box-shadow:var(--shadow);font-size:34px;display:flex;align-items:center;justify-content:center}
      .wp-new:active{transform:translateY(3px)}
      .wp-board{background:#fff}
      .wp-scene{position:absolute;inset:0}
      .wp-char{position:absolute;display:flex;align-items:center;justify-content:center;line-height:1;pointer-events:none}
      .wp-char .e{width:100%;height:100%;filter:drop-shadow(0 6px 4px rgba(0,0,0,.18))}
      .wp-char img.ph{width:100%;height:100%;object-fit:cover;border-radius:20%;border:5px solid #fff;box-shadow:0 8px 16px rgba(0,0,0,.25)}
      .wp-char.found{animation:wpFound 1.1s cubic-bezier(.3,1.6,.5,1) 2}
      @keyframes wpFound{0%{transform:scale(1)}25%{transform:translateY(-18%) scale(1.18) rotate(-6deg)}50%{transform:scale(.94,1.06)}75%{transform:translateY(-8%) scale(1.1) rotate(5deg)}100%{transform:scale(1)}}
      .wp-name{position:absolute;left:50%;top:100%;transform:translate(-50%,6px);background:#fff;border-radius:999px;padding:4px 16px;font-size:clamp(22px,3.4vw,34px);white-space:nowrap;box-shadow:var(--shadow);animation:popIn .4s cubic-bezier(.2,1.5,.4,1)}
      .wp-name.up{top:auto;bottom:100%;transform:translate(-50%,-6px)}
      .wp-cover{transition:none}
      .wp-cover.gone{transition:opacity 1.1s ease;opacity:0}
      .wp-fx{pointer-events:none}
      .wp-spot{position:absolute;pointer-events:none;border-radius:50%}
      .wp-sponge{position:absolute;font-size:clamp(54px,8vw,80px);line-height:1;pointer-events:none;opacity:0;transition:opacity .2s;z-index:3;transform:translate(-30%,-75%) rotate(-12deg)}
      .wp-sponge.on{opacity:1}
      /* 폰: 글자는 숨기고 그림 단추만 — 그래도 64px 이상 (2026-11-08) */
      @media (max-width:600px){ .wp-add span{display:none} .wp-add{padding:8px 12px;min-width:64px;min-height:64px;justify-content:center} .wp-new{width:64px;height:64px;font-size:32px} }
    `);

    /* ---------- 기본 친구들 ---------- */
    const FRIENDS = [
      ["🦖", "공룡"], ["🚂", "기차"], ["🐳", "고래"], ["🦒", "기린"], ["🐘", "코끼리"], ["🚒", "소방차"], ["🦁", "사자"], ["🐧", "펭귄"],
      ["🚀", "로켓"], ["🐶", "강아지"], ["🦄", "유니콘"], ["🐙", "문어"], ["🚜", "트랙터"], ["🐢", "거북이"], ["🦋", "나비"], ["🐼", "판다"],
      ["🚓", "경찰차"], ["🐰", "토끼"], ["🦕", "목 긴 공룡"], ["🐬", "돌고래"], ["🚁", "헬리콥터"], ["🐸", "개구리"], ["🍉", "수박"], ["⛄", "눈사람"],
    ];
    KP.loadE(FRIENDS.map((f) => f[0]).concat(["🐚", "⭐", "❄️", "🐾", "🍂", "🍁"]));

    /* ---------- 덮개 테마 ---------- */
    const THEMES = [
      {
        id: "sand", name: "모래", scene: "linear-gradient(#8fd3ff 0 30%,#5bbbe9 30% 44%,#f7e0a8 44%)", fx: ["#fff3c4", "#ffd98a", "#ffffff"],
        say: "모래 속에 누가 숨었을까요? 문질문질 털어 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#e6c486";
          g.fillRect(0, 0, W, H);
          const cs = ["#d4ab66", "#f3dcaa", "#c79a55", "#fff0cc", "#e0b878"];
          for (let i = 0; i < (W * H) / 26; i++) {
            g.fillStyle = cs[(r() * cs.length) | 0];
            const s = 0.7 + r() * 1.8;
            g.fillRect(r() * W, r() * H, s, s);
          }
          for (let i = 0; i < 8; i++) {
            g.globalAlpha = 0.18;
            g.strokeStyle = "#a77d3d";
            g.lineWidth = 3;
            g.beginPath();
            const y = r() * H;
            g.moveTo(0, y);
            for (let x = 0; x <= W; x += 30) g.lineTo(x, y + Math.sin(x / 60 + i) * 10);
            g.stroke();
          }
          g.globalAlpha = 0.9;
          for (let i = 0; i < 5; i++) KP.drawE(g, r() < 0.6 ? "🐚" : "⭐", r() * W, r() * H, 34 + r() * 20, r() * 6);
          g.globalAlpha = 1;
        },
        snd: () => A.noise({ dur: 0.07, vol: 0.07, bp: 3800 + Math.random() * 800, q: 0.6 }),
      },
      {
        id: "snow", name: "눈", scene: "linear-gradient(#b9dcff,#eef7ff 62%,#ffffff 62%)", fx: ["#ffffff", "#d6ecff", "#eaf6ff"],
        say: "하얀 눈 밑에 누가 있을까요? 쓱쓱 치워 봐요!",
        draw(g, W, H, r) {
          const gr = g.createLinearGradient(0, 0, 0, H);
          gr.addColorStop(0, "#fbfdff");
          gr.addColorStop(1, "#dce9f8");
          g.fillStyle = gr;
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < 26; i++) {
            const x = r() * W,
              y = r() * H,
              rr = 40 + r() * 120;
            const rg = g.createRadialGradient(x, y, 0, x, y, rr);
            rg.addColorStop(0, "rgba(160,190,230,.22)");
            rg.addColorStop(1, "rgba(160,190,230,0)");
            g.fillStyle = rg;
            g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
          }
          g.fillStyle = "#fff";
          for (let i = 0; i < (W * H) / 900; i++) {
            g.globalAlpha = 0.5 + r() * 0.5;
            g.beginPath();
            g.arc(r() * W, r() * H, 0.8 + r() * 2.2, 0, 6.28);
            g.fill();
          }
          g.globalAlpha = 0.75;
          for (let i = 0; i < 6; i++) KP.drawE(g, "❄️", r() * W, r() * H, 26 + r() * 22, r() * 6);
          g.globalAlpha = 1;
        },
        snd: () => {
          A.noise({ dur: 0.08, vol: 0.08, lp: 2200, hp: 350 });
          if (Math.random() < 0.3) A.noise({ dur: 0.03, vol: 0.05, hp: 2500, when: 0.04 });
        },
      },
      {
        id: "fog", name: "뿌연 유리", scene: "linear-gradient(#a8dbff,#e8f6ff 60%,#9ed98a 60%)", fx: ["#ffffff", "#e6f3ff", "#c9e6ff"],
        say: "뿌연 유리창이에요. 뽀득뽀득 닦아 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#c3d1df";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < 40; i++) {
            const x = r() * W,
              y = r() * H,
              rr = 50 + r() * 140;
            const rg = g.createRadialGradient(x, y, 0, x, y, rr);
            rg.addColorStop(0, "rgba(255,255,255,.35)");
            rg.addColorStop(1, "rgba(255,255,255,0)");
            g.fillStyle = rg;
            g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
          }
          for (let i = 0; i < (W * H) / 2500; i++) {
            const x = r() * W,
              y = r() * H,
              s = 1.5 + r() * 4.5;
            g.fillStyle = "rgba(120,140,165,.35)";
            g.beginPath();
            g.arc(x, y, s, 0, 6.28);
            g.fill();
            g.fillStyle = "rgba(255,255,255,.8)";
            g.beginPath();
            g.arc(x - s * 0.3, y - s * 0.3, s * 0.35, 0, 6.28);
            g.fill();
          }
        },
        snd: () => A.tone(1000 + Math.random() * 500, { to: 1500 + Math.random() * 600, dur: 0.07, vol: 0.03, type: "sine" }),
      },
      {
        id: "mud", name: "진흙", scene: "linear-gradient(#a6dcff 0 38%,#9bd67a 38%)", fx: ["#a0703f", "#6b4423", "#c48a52"],
        say: "진흙 속에 누가 숨었을까요? 철벅철벅 닦아 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#86562f";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < 70; i++) {
            const x = r() * W,
              y = r() * H,
              rr = 20 + r() * 70;
            g.fillStyle = r() < 0.5 ? "rgba(98,60,30,.55)" : "rgba(170,115,66,.45)";
            g.beginPath();
            g.ellipse(x, y, rr, rr * (0.5 + r() * 0.4), r() * 3, 0, 6.28);
            g.fill();
          }
          for (let i = 0; i < 26; i++) {
            g.fillStyle = "rgba(255,240,220,.25)";
            g.beginPath();
            g.ellipse(r() * W, r() * H, 6 + r() * 12, 3 + r() * 5, r() * 3, 0, 6.28);
            g.fill();
          }
          g.globalAlpha = 0.55;
          for (let i = 0; i < 5; i++) KP.drawE(g, "🐾", r() * W, r() * H, 34 + r() * 16, r() * 6);
          g.globalAlpha = 1;
        },
        snd: () => A.noise({ dur: 0.12, vol: 0.09, bp: 240 + Math.random() * 80, bpTo: 520, q: 2.5 }),
      },
      {
        id: "leaf", name: "낙엽", scene: "linear-gradient(#ffe7a8,#fff6dc 52%,#c3e39a 52%)", fx: ["#ffb347", "#e2553a", "#ffd166"],
        say: "낙엽 밑에 누가 숨었을까요? 바스락바스락 치워 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#c97a33";
          g.fillRect(0, 0, W, H);
          const sz = Math.max(46, Math.min(W, H) * 0.12);
          const n = Math.ceil(((W * H) / (sz * sz)) * 2.6);
          for (let i = 0; i < n; i++) KP.drawE(g, r() < 0.55 ? "🍂" : "🍁", r() * (W + sz) - sz / 2, r() * (H + sz) - sz / 2, sz * (0.8 + r() * 0.5), r() * 6.28);
        },
        snd: () => A.noise({ dur: 0.09, vol: 0.07, hp: 2800 + Math.random() * 1500 }),
      },
      {
        id: "foam", name: "거품", scene: "linear-gradient(#bfe6ff,#e9f8ff)", fx: ["#ffffff", "#bfe6ff", "#ffd6f5"],
        say: "보글보글 거품 속에 누가 있을까요? 문질러 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#eef8ff";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < (W * H) / 1400; i++) {
            const x = r() * W,
              y = r() * H,
              s = 6 + r() * 26;
            g.fillStyle = "rgba(255,255,255,.95)";
            g.strokeStyle = "rgba(140,190,235,.55)";
            g.lineWidth = 1.5;
            g.beginPath();
            g.arc(x, y, s, 0, 6.28);
            g.fill();
            g.stroke();
            g.fillStyle = "rgba(255,190,240,.35)";
            g.beginPath();
            g.arc(x + s * 0.25, y + s * 0.3, s * 0.35, 0, 6.28);
            g.fill();
            g.fillStyle = "#fff";
            g.beginPath();
            g.arc(x - s * 0.35, y - s * 0.35, s * 0.18, 0, 6.28);
            g.fill();
          }
        },
        snd: () => A.tone(500 + Math.random() * 400, { to: 1300, dur: 0.08, vol: 0.06 }),
      },
    ];

    /* ---------- 화면 ---------- */
    const top = U.el("div", "wp-top");
    const bAdd = U.btn(KP.E("📷") + "<span>우리 캐릭터 넣기</span>", "wp-add");
    const mid = U.el("div", "wp-mid");
    const info = U.el("div", "wp-info");
    const strip = U.el("div", "wp-strip");
    mid.append(info, strip);
    const bNew = U.btn(KP.E("🔄"), "wp-new");
    top.append(bAdd, mid, bNew);
    const board = U.el("div", "board wp-board");
    const scene = U.el("div", "wp-scene");
    const charEl = U.el("div", "wp-char");
    const cover = U.el("canvas", "wp-cover");
    const fx = U.el("canvas", "wp-fx");
    const sponge = U.el("div", "wp-sponge", KP.E("🧽"));
    const spot = U.el("div", "wp-spot"); // 힌트 손가락이 가리킬 자리(덮개 위, 투명)
    board.append(scene, charEl, cover, fx, spot, sponge);
    ctx.body.append(top, board);
    const cg = cover.getContext("2d");
    const fg = fx.getContext("2d");

    /* ---------- 사진 (영구 저장) ---------- */
    let photos = [],
      queue = [],
      saveBad = false,
      loaded = false;
    const hash = (s) => {
      let h = 0;
      for (let i = 0; i < s.length; i += 7) h = (h * 31 + s.charCodeAt(i)) | 0;
      return (h >>> 0).toString(36);
    };
    async function migrate() {
      let raw = null;
      try {
        raw = localStorage.getItem("kidsWipePhotos");
      } catch (e) {}
      if (!raw) return;
      let arr = null;
      try {
        arr = JSON.parse(raw);
      } catch (e) {}
      let ok = true;
      if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
          const url = arr[i];
          if (typeof url !== "string" || !url.startsWith("data:image")) continue;
          const r = await KP.db.put("photos", { id: "wipe-old-" + i + "-" + hash(url), kind: "wipe", img: url, t: Date.now() - (arr.length - i) * 1000 });
          if (!r) ok = false;
        }
      }
      if (ok) {
        try {
          localStorage.removeItem("kidsWipePhotos");
        } catch (e) {}
      }
    }
    async function loadPhotos() {
      await migrate();
      photos = (await KP.db.all("photos")).filter((p) => p.kind === "wipe" && p.img);
      loaded = true;
      renderStrip();
    }
    ctx.loadPhotos = loadPhotos;
    function renderStrip() {
      strip.innerHTML = "";
      if (!photos.length) {
        info.innerHTML = "사진을 넣으면 우리 캐릭터가 숨어요";
        strip.appendChild(U.el("div", "wp-empty", KP.E("👈") + " 여러 장 한꺼번에 넣을 수 있어요"));
        return;
      }
      info.innerHTML =
        "우리 캐릭터 " + photos.length + "개 · " + (saveBad ? '<b class="bad">저장 안 됨(저장공간 부족)</b>' : "<b>" + KP.E("✅") + " 이 기기에 저장됨</b>") + " · ✖ 꾹 누르면 삭제";
      photos.forEach((p) => {
        const t = U.btn('<img src="' + KP.safeImg(p.img) + '" alt="">', "wp-th" + (cur && cur.photo && cur.photo.id === p.id ? " now" : ""));
        t.dataset.id = p.id;
        const del = U.el("span", "wp-del", "✖");
        t.appendChild(del);
        ctx.tap(t, (e) => {
          if (e.target === del) return;
          A.sfx("select");
          U.replay(t, "jump");
          newRound({ photo: p });
        });
        del.addEventListener("click", (e) => e.stopPropagation());
        KP.hold(
          del,
          800,
          async () => {
            await KP.db.del("photos", p.id);
            photos = photos.filter((x) => x.id !== p.id);
            queue = queue.filter((id) => id !== p.id);
            KP.toast("사진을 지웠어요");
            A.sfx("whoosh");
            renderStrip();
          },
          () => KP.toast("꾹 누르고 있으면 지워져요")
        );
        strip.appendChild(t);
      });
    }
    ctx.tap(bAdd, async () => {
      A.sfx("open");
      U.replay(bAdd, "pop");
      const urls = await KP.pickPhotos(true, 600);
      if (!urls || !urls.length) return;
      const added = [];
      saveBad = false;
      for (let i = 0; i < urls.length; i++) {
        const p = { id: "wipe-" + KP.newId(), kind: "wipe", img: urls[i], t: Date.now() + i };
        const ok = await KP.db.put("photos", p);
        if (!ok) saveBad = true;
        photos.push(p);
        added.push(p.id);
      }
      queue = added.concat(queue);
      renderStrip();
      strip.scrollLeft = strip.scrollWidth;
      if (!ctx._active) return;
      A.sfx("sticker");
      KP.voice.say("우리 캐릭터들이 숨을 준비를 했어요! 찾아볼까요?");
      ctx.after(1200, () => newRound());
    });
    ctx.tap(bNew, () => {
      A.sfx("whoosh");
      U.replay(bNew, "wig");
      newRound();
    });

    /* ---------- 판 ---------- */
    let W = 0,
      H = 0,
      D = 1,
      cur = null,
      lastKey = "",
      lastTheme = "",
      lastPos = null,
      samples = [],
      cleared = 0,
      done = false,
      theme = THEMES[0],
      R = 40,
      said = 0,
      busy = false;
    function fit() {
      const r = board.getBoundingClientRect();
      W = r.width;
      H = r.height;
      D = Math.min(window.devicePixelRatio || 1, 2);
      [cover, fx].forEach((c) => {
        c.width = Math.round(W * D);
        c.height = Math.round(H * D);
      });
      cg.setTransform(D, 0, 0, D, 0, 0);
      fg.setTransform(D, 0, 0, D, 0, 0);
    }
    function choose(force) {
      if (force) return force;
      while (queue.length) {
        const id = queue.shift();
        const p = photos.find((x) => x.id === id);
        if (p) return { photo: p };
      }
      if (photos.length && Math.random() < 0.5) {
        const pool = photos.length > 1 ? photos.filter((p) => "p" + p.id !== lastKey) : photos;
        return { photo: U.pick(pool) };
      }
      const pool = FRIENDS.filter((f) => "e" + f[0] !== lastKey);
      const f = U.pick(pool);
      return { em: f[0], name: f[1] };
    }
    async function newRound(force) {
      if (!ctx._active) return;
      busy = false;
      done = false;
      said = 0;
      cleared = 0;
      cur = choose(force);
      lastKey = cur.photo ? "p" + cur.photo.id : "e" + cur.em;
      const themes = THEMES.filter((t) => t.id !== lastTheme);
      theme = U.pick(themes);
      lastTheme = theme.id;
      fit();
      // 크기·위치
      const lv = ctx.level;
      const S = Math.max(84, Math.min(W, H) * [0.46, 0.34, 0.25][lv - 1]);
      R = Math.max(24, Math.min(W, H) * [0.085, 0.075, 0.066][lv - 1]);
      const m = 12;
      let x = 0,
        y = 0;
      for (let k = 0; k < 14; k++) {
        x = m + Math.random() * Math.max(1, W - S - 2 * m);
        y = m + Math.random() * Math.max(1, H - S - 2 * m);
        if (!lastPos || Math.hypot(x - lastPos[0], y - lastPos[1]) > Math.min(W, H) * 0.3) break;
      }
      lastPos = [x, y];
      Object.assign(charEl.style, { left: x + "px", top: y + "px", width: S + "px", height: S + "px", fontSize: S + "px" });
      Object.assign(spot.style, { left: x + S * 0.2 + "px", top: y + S * 0.2 + "px", width: S * 0.6 + "px", height: S * 0.6 + "px" });
      charEl.classList.remove("found");
      charEl.innerHTML = cur.photo ? '<img class="ph" src="' + KP.safeImg(cur.photo.img) + '" alt="">' : KP.E(cur.em);
      scene.style.background = theme.scene;
      U.$$(".wp-th", strip).forEach((t) => t.classList.toggle("now", !!(cur.photo && t.dataset.id === cur.photo.id)));
      // 덮개
      cover.classList.remove("gone");
      await KP.loadE(cur.em ? [cur.em] : []);
      if (!ctx._active) return;
      const seed = (Math.random() * 1e9) | 0;
      let a = seed;
      const r = () => {
        a = (a * 1664525 + 1013904223) | 0;
        return (a >>> 0) / 4294967296;
      };
      cg.globalCompositeOperation = "source-over";
      cg.clearRect(0, 0, W, H);
      theme.draw(cg, W, H, r);
      // 친구 영역 표본점 (그림이면 실제 윤곽, 사진이면 둥근 네모)
      samples = makeSamples(x, y, S);
      ctx.say(cur.photo && Math.random() < 0.5 ? "우리 캐릭터가 숨었어요! 어디 있을까요?" : theme.say);
      ctx.hint(() => spot, "여기를 문질문질 해 봐요!", { answer: true }); // 친구 자리를 알려 주는 힌트 → 그 판은 열쇠 별 없음
    }
    function makeSamples(x, y, S) {
      const N = 44,
        out = [];
      let mask = null;
      if (cur.em) {
        const c = document.createElement("canvas");
        c.width = c.height = N;
        const g = c.getContext("2d");
        KP.drawE(g, cur.em, N / 2, N / 2, N);
        try {
          mask = g.getImageData(0, 0, N, N).data;
        } catch (e) {
          mask = null;
        }
      }
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          let inside;
          if (mask) inside = mask[(j * N + i) * 4 + 3] > 60;
          else {
            // 둥근 네모(모서리 20%)
            const u = (i + 0.5) / N,
              v = (j + 0.5) / N,
              rr = 0.2;
            const dx = Math.max(rr - u, 0, u - (1 - rr)),
              dy = Math.max(rr - v, 0, v - (1 - rr));
            inside = dx * dx + dy * dy <= rr * rr;
          }
          if (inside) out.push({ x: x + ((i + 0.5) / N) * S, y: y + ((j + 0.5) / N) * S, c: false });
        }
      return out;
    }

    /* ---------- 문지르기 ---------- */
    let last = null,
      pid = null,
      sndAcc = 0,
      parts = [];
    const pos = (e) => {
      const r = cover.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    function rubSeg(x1, y1, x2, y2) {
      cg.save();
      cg.globalCompositeOperation = "destination-out";
      cg.lineCap = "round";
      cg.strokeStyle = "#000";
      cg.globalAlpha = 0.35;
      cg.lineWidth = R * 2.5;
      cg.beginPath();
      cg.moveTo(x1, y1);
      cg.lineTo(x2 + 0.01, y2);
      cg.stroke();
      cg.globalAlpha = 1;
      cg.lineWidth = R * 2;
      cg.stroke();
      cg.restore();
      // 표본점 지우기 판정 (선분과의 거리)
      const dx = x2 - x1,
        dy = y2 - y1,
        L2 = dx * dx + dy * dy || 1,
        R2 = R * R;
      for (const s of samples) {
        if (s.c) continue;
        let t = ((s.x - x1) * dx + (s.y - y1) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = x1 + dx * t - s.x,
          ey = y1 + dy * t - s.y;
        if (ex * ex + ey * ey <= R2) {
          s.c = true;
          cleared++;
        }
      }
      // 반짝이
      for (let i = 0; i < 2; i++)
        parts.push({ x: x2 + (Math.random() - 0.5) * R * 1.6, y: y2 + (Math.random() - 0.5) * R * 1.6, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 60, life: 1, s: 3 + Math.random() * 5, c: U.pick(theme.fx), star: Math.random() < 0.4 });
      const d = Math.hypot(dx, dy);
      sndAcc += d;
      if (sndAcc > 20) {
        sndAcc = 0;
        theme.snd();
      }
      progress();
    }
    function progress() {
      if (done || !samples.length) return;
      const ratio = cleared / samples.length;
      if (ratio >= 0.93) return found();
      if (ratio > 0.45 && said < 1) {
        said = 1;
        KP.voice.say(U.pick(["와, 조금 보여요! 누구일까?", "어? 뭔가 보여요!", "누구지? 조금 더!"]));
      } else if (ratio > 0.78 && said < 2) {
        said = 2;
        KP.voice.say("거의 다 찾았어요!");
      }
    }
    async function found() {
      done = true;
      busy = true;
      sponge.classList.remove("on");
      ctx.hint(null);
      cover.classList.add("gone"); // 나머지 덮개는 스르륵
      const cx = parseFloat(charEl.style.left) + charEl.offsetWidth / 2,
        cy = parseFloat(charEl.style.top) + charEl.offsetHeight / 2;
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * 6.28,
          sp = 80 + Math.random() * 260;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 1.3, s: 4 + Math.random() * 6, c: U.pick(["#ffd54a", "#ff7ac6", "#7ad7ff", "#ffffff", "#9cff8a"]), star: true });
      }
      A.sfx("sparkle");
      ctx.after(250, () => {
        charEl.classList.add("found");
        A.sfx("boing");
        const name = cur.photo ? "우리 친구" : cur.name;
        const tag = U.el("div", "wp-name" + (parseFloat(charEl.style.top) + charEl.offsetHeight + 60 > H ? " up" : ""), KP.E(name + "!"));
        charEl.appendChild(tag);
        KP.voice.say(name + "! 찾았다!");
      });
      await ctx.wait(1700);
      ctx.score.add();
      ctx.round = (ctx.round || 0) + 1;
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "숨은 그림 박사!" : U.pick(["찾았다!", "와, 찾았어요!", "까꿍! 찾았다!"]) });
      if (ok) newRound();
    }
    cover.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (done || busy || pid !== null) return;
      pid = e.pointerId;
      try {
        cover.setPointerCapture(pid);
      } catch (_) {}
      last = pos(e);
      rubSeg(last[0], last[1], last[0], last[1]);
      moveSponge(last);
      sponge.classList.add("on");
    });
    cover.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || done) return;
      e.preventDefault();
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of list.length ? list : [e]) {
        const p = pos(ev);
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) continue;
        rubSeg(last[0], last[1], p[0], p[1]);
        last = p;
        if (done) break;
      }
      moveSponge(last);
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      sponge.classList.remove("on");
    };
    cover.addEventListener("pointerup", up);
    cover.addEventListener("pointercancel", up);
    function moveSponge(p) {
      sponge.style.left = p[0] + "px";
      sponge.style.top = p[1] + "px";
    }

    /* ---------- 반짝이 그리기 ---------- */
    let fxDrawn = false; // 지난 장면에 반짝이를 그렸나 (아무것도 없으면 매 장면 지우지 않음)
    ctx.fxLoop = (dt) => {
      if (!parts.length && !fxDrawn) return;
      fg.clearRect(0, 0, W, H);
      fxDrawn = parts.length > 0;
      if (!parts.length) return;
      const next = [];
      for (const p of parts) {
        p.life -= dt * 1.4;
        if (p.life <= 0) continue;
        p.vy += 220 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        fg.globalAlpha = Math.min(1, p.life);
        fg.fillStyle = p.c;
        if (p.star) {
          fg.beginPath();
          for (let k = 0; k < 8; k++) {
            const rad = k % 2 ? p.s * 0.4 : p.s * 1.3,
              an = (k * Math.PI) / 4 + p.life * 3;
            fg.lineTo(p.x + Math.cos(an) * rad, p.y + Math.sin(an) * rad);
          }
          fg.fill();
        } else {
          fg.beginPath();
          fg.arc(p.x, p.y, p.s * 0.6, 0, 6.28);
          fg.fill();
        }
        next.push(p);
      }
      fg.globalAlpha = 1;
      parts = next.length > 500 ? next.slice(-500) : next;
    };
    ctx.newRound = newRound;
    ctx.isLoaded = () => loaded;
    // 화면 크기 변화: 회전·크게 바뀜이면 새 판, 조금(주소창·내비게이션 바)이면 닦던 덮개를 그대로 옮겨 이어 하기
    function onResize() {
      if (!ctx._active || done) return;
      const oW = W,
        oH = H,
        oD = D;
      const r = board.getBoundingClientRect();
      if (Math.abs(r.width - oW) < 1 && Math.abs(r.height - oH) < 1) return;
      const flip = oW >= oH !== r.width >= r.height;
      const big = !oW || !oH || Math.abs(r.width - oW) / oW > 0.2 || Math.abs(r.height - oH) / oH > 0.2;
      const nd = Math.min(window.devicePixelRatio || 1, 2);
      // 숨은 친구가 화면 밖으로 잘리면 끝까지 닦을 수 없으니 새 판
      const cx = parseFloat(charEl.style.left) || 0,
        cy = parseFloat(charEl.style.top) || 0,
        cs = parseFloat(charEl.style.width) || 0;
      const cut = cx + cs > r.width || cy + cs > r.height;
      if (flip || big || cut || nd !== oD || !samples.length) return newRound(cur && cur.photo ? { photo: cur.photo } : cur);
      const keep = document.createElement("canvas");
      keep.width = cover.width;
      keep.height = cover.height;
      keep.getContext("2d").drawImage(cover, 0, 0);
      fit();
      // 새로 생긴 가장자리는 새 덮개로, 원래 자리는 닦은 그대로
      cg.globalCompositeOperation = "source-over";
      theme.draw(cg, W, H, Math.random);
      cg.clearRect(0, 0, oW, oH);
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.drawImage(keep, 0, 0);
      cg.setTransform(D, 0, 0, D, 0, 0);
    }
    addEventListener("resize", () => {
      if (ctx._active && !done) requestAnimationFrame(onResize);
    });
  },
  start(ctx) {
    ctx.round = 0;
    const go = () => {
      if (!ctx._active) return;
      ctx.newRound();
      ctx.loop((dt) => {
        ctx.fxLoop(dt);
      });
    };
    // 사진 목록을 먼저 읽고(옛 저장 옮기기 포함) 시작
    ctx.loadPhotos().then(() => requestAnimationFrame(go));
  },
});

;

/* ==== js/games/make/zoo-clay.js ==== */
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

;

/* ==== js/games/make/zoo.js ==== */
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
  /** 동물 정보 {name, cry, move}: 도안 동물(T) 또는 🧸 3D 인형 친구(tid "doll" + species, doll.js) — 모르는 것은 null */
  const DOLL = () => (KP.DOLL && KP.DOLL.ok ? KP.DOLL : null);
  const tOf = (it) => (!it ? null : it.tid === "doll" ? (DOLL() && DOLL().ok(it.species) ? DOLL().tOf(it.species) : null) : T[it.tid] || null);
  KP.zooT = tOf;

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
        /* 🧸 3D 인형 도안 */
        .zpDollHead{grid-column:1/-1;font-size:clamp(18px,2.4vw,24px);color:#7a4a1e;display:flex;align-items:center;gap:6px;padding:6px 4px 0}
        .zpDollHead::after{content:"";flex:1;height:3px;border-radius:3px;background:repeating-linear-gradient(90deg,#e6c99a 0 8px,transparent 8px 14px)}
        .zpCard.zpDoll{background:linear-gradient(180deg,#fff 60%,#fff4dc)}
        .zpCard.zpDoll .zpThumb img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
        .zpPaper .dollPaper{position:absolute;touch-action:none;z-index:1}
        .zpPaper .dollPaper .lyr{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
        .zpPaper.fly .dollPaper{transition:transform .9s cubic-bezier(.5,-0.3,.7,1),opacity .9s;transform:translate(0,-110%) scale(.3) rotate(-12deg);opacity:0}
        .zpWait{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:72px;animation:bob 1.2s ease-in-out infinite}
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
          .zpTool{min-width:54px;min-height:58px;justify-content:center;padding:4px 6px}
          .zpSize{width:50px;height:50px}
          .zpAct{flex-direction:column;flex-wrap:nowrap;justify-content:center}
          .zpB{min-width:96px;padding:8px 10px;font-size:15px}
          .zpB .e{font-size:34px}
          .zpB.send{min-width:96px;padding:12px 10px}
        }
        /* 폰 가로(키 작은 가로 화면, 2026-11-09): 예전엔 세로용 쌓기 배치라 그림판이 73px 로 찌그러짐
           → 색·도구는 왼쪽(색 6칸씩 3줄, 내 물감이 있거나 아주 작은 폰이면 그 칸만 위아래로 밀기), 단추는 오른쪽 2줄, 그림판이 높이를 다 씀 */
        @media (orientation:landscape) and (max-height:500px){
          .zpWork{grid-template-areas:"pal paper act";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);padding:0 10px 8px;gap:10px}
          .zpPal{display:grid;grid-template-columns:repeat(6,auto);gap:6px;align-content:start;justify-content:center;overflow-y:auto;overscroll-behavior:contain;padding:4px 4px 8px}
          .zpSep{grid-column:1/-1;height:3px}
          .zpSp{width:min(12.8vh,52px);height:min(12.8vh,52px);font-size:22px;border-width:3px}
          .zpSp.sel{transform:scale(1.08)}
          .zpTools{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:0}
          .zpTool{min-width:0;min-height:64px;justify-content:center;padding:3px 4px;font-size:11px}
          .zpTool .e{font-size:26px}
          .zpSize{width:auto;height:64px;border-radius:18px}
          .zpAct{display:grid;grid-template-columns:repeat(2,minmax(68px,auto));grid-auto-rows:minmax(64px,1fr);align-content:center;gap:8px}
          .zpB{min-width:68px;padding:4px 6px;font-size:12px}
          .zpB span{word-break:keep-all;text-align:center}
          .zpB .e{font-size:28px}
          .zpB.send{grid-column:1/-1;min-width:0}
        }
        @media (orientation:landscape) and (max-height:500px) and (max-width:720px){
          .zpPal{grid-template-columns:repeat(4,auto)}
          .zpSp{width:min(14vh,48px);height:min(14vh,48px)}
          .zpTool,.zpSize{min-height:56px;height:56px}
        }
        /* 태블릿 세로(큰 세로 화면): 폰 크기 그대로라 작던 색·도구·단추를 크게 */
        @media (orientation:portrait) and (min-width:700px){
          .zpPal{gap:10px}
          .zpSp{width:64px;height:64px;font-size:28px}
          .zpTools{gap:10px}
          .zpTool{min-width:80px;min-height:72px;justify-content:center;font-size:14px}
          .zpTool .e{font-size:32px}
          .zpSize{width:64px;height:64px}
          .zpAct{gap:12px}
          .zpB{min-width:104px;min-height:84px;font-size:16px}
          .zpB .e{font-size:36px}
          .zpB.send{min-width:150px}
        }
        /* 폰처럼 좁은 세로 화면 */
        /* (2026-11-08) 손가락이 닿기 쉽게: 색 36→최대 52px(키 작은 폰은 조금 작게), 도구·굵기 52px 이상, '보내기' 글자는 낱말 단위로 줄바꿈 */
        @media (max-width:500px){
          .zpSp{width:clamp(42px,min(6.2vh,calc((100vw - 80px) / 6)),52px);height:clamp(42px,min(6.2vh,calc((100vw - 80px) / 6)),52px);font-size:22px;border-width:3px}
          .zpTools{gap:5px}
          .zpTool{min-width:52px;min-height:clamp(48px,6.4vh,56px);justify-content:center;padding:3px 4px;font-size:11px}
          .zpTool .e{font-size:24px}
          .zpSize{width:clamp(44px,min(6.2vh,calc((100vw - 80px) / 6)),52px);height:clamp(44px,min(6.2vh,calc((100vw - 80px) / 6)),52px)}
          .zpPal{gap:6px 5px}
          .zpB{min-width:0;flex:1;min-height:clamp(56px,7.6vh,66px);padding:5px 3px;font-size:12.5px}
          .zpB span{word-break:keep-all}
          .zpB .e{font-size:26px}
          .zpB.send{min-width:0;flex:1.3}
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
      const DSIZES = [16, 30, 52]; // 🧸 인형 도안 붓 굵기 (도안 1024 칸 기준)
      /** 🧸 인형 칠하기: 지금 고른 도구·색·굵기를 그림판에 */
      ctx.syncDoll = () => {
        const P = ctx.dollP;
        if (!P) return;
        P.st.tool = ctx.tool === "fill" ? "fill" : ctx.tool === "erase" ? "erase" : "brush";
        P.st.size = DSIZES[ctx.size] || 30;
        P.st.color = ctx.paint.kind === "color" ? ctx.paint.color : ctx.paint.base || "#5cc6ff";
      };

      /* 색 + 특수 색 */
      ctx.paint = { kind: "color", color: COLORS[0] };
      const sw = [];
      const sel = (b) => {
        sw.forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
        ctx.syncDoll();
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
        // 🧸 인형은 단색만 (무늬 붓 없음) — 무늬를 고르고 있었으면 그 바탕색으로
        if (ctx.doll && ctx.paint.kind !== "color") ctx.paint = { kind: "color", color: COLORS.includes(ctx.paint.base) ? ctx.paint.base : COLORS[0] };
        // 물감 실험실에서 '칠하러 가기'로 왔으면 방금 담은 내 물감을 골라 둠 (한 번만)
        const pk = KP.paint && KP.paint.takePick ? KP.paint.takePick() : null;
        if (pk && mine.some((m) => m.hex === pk)) ctx.paint = { kind: "color", color: pk };
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
        if (!ctx.doll) [["rainbow", "🌈", "무지개"], ["glitter", "✨", "반짝이"], ["dots", "⚪", "물방울 무늬"], ["stripes", "〰️", "줄무늬"]].forEach(([k, em, nm]) => {
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
        ctx.syncDoll();
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
        if (ctx.doll) {
          // 🧸 인형: 그림판이 두 층을 통째로 되돌림
          if (!ctx.dollP || !ctx.dollP.back()) return KP.audio.sfx("bad");
          KP.audio.sfx("slide");
          return;
        }
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
        const pal2 = U.shuffle(COLORS.filter((c) => c !== "#3b3355" && c !== "#ffffff"));
        if (ctx.doll) {
          if (!ctx.dollP) return;
          ctx.dollP.magic(pal2); // 부위마다 다른 색 (크레파스 칠은 지움)
          KP.audio.sfx("sparkle");
          KP.voice.say("뾰로롱! 마법 색칠!");
          U.replay(paper, "jump");
          return;
        }
        const svg = paper.querySelector("svg");
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
        if (ctx.doll) {
          if (!ctx.dollP) return;
          ctx.dollP.clear();
          ctx.toldDone = false;
          KP.audio.sfx("whoosh");
          return;
        }
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
        saveT = setTimeout(() => ctx._active && this.keepCurrent(ctx), ctx.doll ? 3000 : 1500); // 인형 그림판은 그림이 커서 조금 더 모아서
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
      // 🧸 인형 그림판이 바뀌면(도안 크기에 맞춰) 다시 맞춤
      if (window.ResizeObserver) new ResizeObserver(() => ctx.dollP && this.fitDoll(ctx)).observe(paper);
      paper.addEventListener("pointerdown", (e) => {
        KP.audio.unlock();
        if (ctx.doll) return; // 🧸 인형은 그림판(doll.js)이 직접 받음
        e.preventDefault();
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
        if (e.pointerId !== down || ctx.doll) return;
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
    /** 🧸 인형 칠하던 그림 보관: 채우기·크레파스 두 층 (PNG) — 키 "doll-<종>" */
    keepDollDraft(ctx, key, L) {
      ctx.drafts[key] = { fill: L.fill, cray: L.cray };
      KP.db.put("photos", { id: "zoodraft-" + key, kind: "zoodraft", tid: "doll", species: key.slice(5), fill: L.fill, cray: L.cray, t: Date.now() });
    },
    dropDraft(ctx, tid) {
      if (!tid) return;
      delete ctx.drafts[tid];
      KP.db.del("photos", "zoodraft-" + tid);
    },
    /** 지금 그림판의 그림을 보관(칠한 게 있으면) 또는 보관본 삭제(다 지웠으면) */
    keepCurrent(ctx) {
      if (ctx.doll) {
        // 🧸 인형: 바뀐 게 있을 때만 (그림 두 장을 PNG 로 만드는 데 시간이 걸림)
        const P = ctx.dollP;
        if (!P || !ctx.tid || ctx.sending || !ctx.dollDirty) return;
        ctx.dollDirty = false;
        if (!P.isEmpty()) this.keepDollDraft(ctx, ctx.tid, P.layers());
        else this.dropDraft(ctx, ctx.tid);
        return;
      }
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
      // 🧸 3D 인형 친구 8종 (칠하면 동물원에서 입체 인형이 됨)
      const D = DOLL();
      if (D) {
        ctx.choose.appendChild(U.el("div", "zpDollHead", KP.E("🧸") + " 3D 인형"));
        D.ORDER.forEach((sp, j) => {
          const key = "doll-" + sp;
          const c = U.btn('<div class="zpThumb"><img src="' + D.thumbUrl(sp) + '" alt="" draggable="false"></div><b>' + D.SPECIES[sp].name + "</b>", "zpCard zpDoll");
          c.style.setProperty("--i", ORDER.length + j);
          if (ctx.drafts[key]) c.appendChild(U.el("span", "zpDraft", "칠하던 중"));
          c.addEventListener("click", () => {
            KP.audio.sfx("open");
            this.load(ctx, key);
          });
          ctx.choose.appendChild(c);
        });
      }
      ctx.say("어떤 동물을 색칠할까요? 골라 보세요!");
      ctx.hint(() => cards[0], "색칠하고 싶은 동물을 콕 눌러요!");
    },
    /* 칠하던 그림 임시 보관 */
    stash(ctx) {
      this.keepCurrent(ctx);
      this.dropDoll(ctx);
      ctx.pp = {};
      ctx.paper.innerHTML = "";
      ctx.tid = null;
    },
    /** 🧸 인형 그림판 치우기 (그림판 4장 = 메모리 큼 → 바로 돌려줌) */
    dropDoll(ctx) {
      ctx._dTok = (ctx._dTok || 0) + 1; // 불러오던 중이면 그만
      if (ctx.dollP) ctx.dollP.destroy();
      ctx.dollP = null;
      ctx.doll = null;
      ctx.dollDirty = false;
      ctx.paper.classList.remove("doll");
    },
    /* ② 색칠 화면 */
    load(ctx, tid) {
      if (/^doll-/.test(tid)) return this.loadDoll(ctx, tid.slice(5));
      this.dropDoll(ctx);
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
    /* ②-🧸 3D 인형 색칠: 미리 구운 도안(doll.js) 위에 붓기·크레파스·지우개 */
    async loadDoll(ctx, sp) {
      const D = DOLL();
      if (!D || !D.ok(sp)) return this.showChoose(ctx);
      const key = "doll-" + sp;
      const reuse = ctx.dollP && ctx.doll === sp; // 나갔다 들어오면 그리던 그림판(되돌리기 포함) 그대로
      if (!reuse) this.dropDoll(ctx);
      ctx.tid = key;
      ctx.doll = sp;
      ctx.undo = [];
      ctx.toldDone = false;
      ctx.paper.classList.remove("fly");
      ctx.paper.classList.add("doll");
      ctx.choose.style.display = "none";
      ctx.choose.innerHTML = "";
      ctx.renderPal();
      ctx.work.style.display = "";
      ctx.bubble.style.display = "none";
      const nm = D.SPECIES[sp].name;
      if (!reuse) {
        ctx.paper.innerHTML = '<div class="zpWait">' + KP.E("🧸") + "</div>";
        const tok = ctx._dTok;
        let B;
        try {
          ({ B } = await D.load(sp));
        } catch (e) {
          if (tok !== ctx._dTok) return;
          KP.toast("인형 도안을 불러오지 못했어요");
          return this.showChoose(ctx);
        }
        if (tok !== ctx._dTok || ctx.tid !== key) return;
        ctx.paper.innerHTML = "";
        const P = (ctx.dollP = D.createPainter(ctx.paper, B));
        P.st.onChange = () => {
          ctx.dollDirty = true;
          this.checkDone(ctx);
        };
        P.st.onStroke = (k, e) => {
          if (k === "miss") return;
          KP.audio.note(U.pick(KP.audio.SCALE.slice(4, 11)), { inst: "marimba", dur: k === "fill" ? 0.3 : 0.2, vol: k === "fill" ? 0.22 : 0.12 });
          if (k !== "fill") return;
          const r = ctx.paper.getBoundingClientRect();
          const s = U.el("div", "zpSpark", KP.E("✨"));
          s.style.left = e.clientX - r.left - 15 + "px";
          s.style.top = e.clientY - r.top - 22 + "px";
          ctx.paper.appendChild(s);
          setTimeout(() => s.remove(), 650);
        };
        const d = ctx.drafts[key];
        if (d) await P.setLayers(d.fill, d.cray);
        if (tok !== ctx._dTok || ctx.dollP !== P) return;
        ctx.dollDirty = false;
        this.checkDone(ctx, true);
      }
      ctx.syncDoll();
      this.fitDoll(ctx);
      ctx.instr = U.josa(nm, "을/를") + " 색칠해요! 색을 고르고 쓱쓱 칠해요.";
      KP.voice.say(ctx.instr);
      ctx.hint(() => (ctx.dollP ? ctx.dollP.wrap : ctx.bSend), "색을 고르고 그림을 콕 눌러 봐요!");
    },
    /** 인형 도안을 그림판에 꽉 차게 (동물 둘레 여백은 잘라 냄) */
    fitDoll(ctx) {
      const P = ctx.dollP;
      if (!P) return;
      const pw = ctx.paper.clientWidth,
        ph = ctx.paper.clientHeight;
      if (!pw || !ph) return;
      const [x0, y0, x1, y1] = P.box,
        pad = 22 * P.B.f;
      const k = Math.min(pw / (x1 - x0 + pad * 2), ph / (y1 - y0 + pad * 2)),
        S = P.B.S;
      P.wrap.style.width = P.wrap.style.height = S * k + "px";
      P.wrap.style.left = pw / 2 - ((x0 + x1) / 2) * k + "px";
      P.wrap.style.top = ph / 2 - ((y0 + y1) / 2) * k + "px";
    },
    checkDone(ctx, quiet) {
      if (ctx.doll) {
        if (!ctx.dollP) return;
        if (!quiet && ctx.saveSoon) ctx.saveSoon();
        if (ctx.dollP.blank() === 0 && !ctx.toldDone) {
          ctx.toldDone = true;
          if (quiet) return;
          KP.voice.say("우와, 다 칠했다! 동물원에 보내 볼까?");
          U.replay(ctx.bSend, "jump");
          ctx.hint(() => ctx.bSend, "동물원에 보내기를 눌러요!");
        }
        return;
      }
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
      if (ctx.doll) return this.sendDoll(ctx);
      const fbs = [...ctx.paper.querySelectorAll(".fb")];
      if (!fbs.some((e, i) => !isWhite(e) || ctx.pp[i])) {
        ctx.miss(ctx.bSend, "먼저 예쁘게 색칠해 봐요!", { soft: true });
        return;
      }
      const nPainted = fbs.filter((e, i) => !isWhite(e) || ctx.pp[i]).length; // 칠한 부위 수 (열쇠 별 기준)
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
      // 열쇠 별: 부위를 3곳 이상(또는 절반 이상) 칠했을 때만 (한 부위만 칠하고 보내기 반복 방지)
      if (nPainted < Math.min(3, Math.ceil(fbs.length / 2))) ctx._fewChoice = true;
      const ok = await ctx.win({ msg: T[tid].name + " 출발!", big: true });
      ctx.paper.innerHTML = "";
      ctx.paper.classList.remove("fly");
      ctx.sending = false;
      if (ok) KP.open("zoo");
    },
    /** 🧸 인형 보내기: 3D 텍스처(JPEG, 768) + 정면 그림(PNG, 동물 모양으로 오림) 저장 */
    async sendDoll(ctx) {
      const P = ctx.dollP,
        sp = ctx.doll;
      if (!P) return;
      if (P.isEmpty()) {
        ctx.miss(ctx.bSend, "먼저 예쁘게 색칠해 봐요!", { soft: true });
        return;
      }
      ctx.sending = true; // 보내는 동안은 나가도 '칠하던 그림'으로 보관하지 않음
      let img = "",
        thumb = "";
      try {
        img = P.compose(768).toDataURL("image/jpeg", 0.86);
        thumb = P.cutout(320).toDataURL("image/png");
      } catch (e) {}
      const item = { id: KP.newId(), kind: "zoo", tid: "doll", species: sp, img, thumb, t: Date.now(), date: KP.gate.monthDay() };
      const saved = KP.safeImg(img) && KP.safeImg(thumb) ? await KP.db.put("art", item) : false;
      if (saved === false) {
        ctx.sending = false;
        KP.toast("저장하지 못했어요. 기기 저장공간을 확인해 주세요");
        ctx.miss(ctx.bSend, "앗, 저장이 안 됐어요. 다시 눌러 볼까요?", { soft: true });
        return;
      }
      const key = ctx.tid;
      ctx.dollDirty = false;
      this.dropDraft(ctx, key);
      ctx.tid = null;
      KP.zooNew = item.id;
      ctx.paper.classList.add("fly");
      KP.audio.sfx("whoosh");
      // 열쇠 별: 동물 도안과 같은 기준 — 큰 영역을 3곳 이상(또는 절반 이상) 칠했을 때만 (한 획만 칠하고 보내기 반복 방지, 2026-11-09)
      const nBig = P.bigRegions(),
        nDone = nBig - P.blank();
      if (nDone < Math.min(3, Math.ceil(nBig / 2))) ctx.fewChoice();
      const ok = await ctx.win({ msg: DOLL().SPECIES[sp].name + " 출발!", big: true });
      if (ctx.doll === sp && !ctx.tid) this.dropDoll(ctx);
      ctx.paper.innerHTML = "";
      ctx.paper.classList.remove("fly");
      ctx.sending = false;
      if (ok) KP.open("zoo");
    },
    async start(ctx) {
      if (!ctx.draftsLoaded) {
        // 앱을 다시 켰을 때 칠하던 그림 불러오기
        ctx.draftsLoaded = true;
        const list = (await KP.db.all("photos")).filter((x) => x.kind === "zoodraft" && (T[x.tid] || x.tid === "doll"));
        list.forEach((x) => {
          if (x.tid === "doll") {
            // 🧸 인형: 두 층 그림 (백업 파일로 들어온 값도 안전한 그림만)
            const fill = KP.safeImg(x.fill),
              cray = KP.safeImg(x.cray);
            if (DOLL() && DOLL().ok(x.species) && (fill || cray)) ctx.drafts["doll-" + x.species] = { fill, cray };
            return;
          }
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
      // 3D 인형 친구는 그림(img: 3D 텍스처, thumb: 정면 그림)이 안전한 그림일 때만
      return (await KP.db.all("art")).filter((x) => x && x.kind === "zoo" && tOf(x) && (x.tid !== "doll" || (KP.safeImg(x.img) && KP.safeImg(x.thumb))));
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
        const on = list.filter((x) => !x.rest && (tOf(x).move === "swim") === pond);
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
    if (item && item.tid === "doll") return dollImg(item, "zDollTh");
    if (!document.querySelector(".zDefs")) document.body.insertAdjacentHTML("beforeend", SHADE_DEFS);
    return shadeSvg(freshSvg(item), item.paint);
  };
  /** 🧸 인형 친구 정면 그림 (아이가 칠한 그대로, 동물 모양으로 오린 것). 없으면 흰 인형 그림 */
  function dollImg(item, cls) {
    const src = KP.safeImg(item.thumb) || (DOLL() && DOLL().ok(item.species) ? DOLL().thumbUrl(item.species) : "");
    return '<img class="' + cls + '" src="' + src + '" alt="" draggable="false">';
  }

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
        .zBar .btn{min-height:64px}
        @media (max-width:500px){.zBar{gap:8px}.zBar .btn{min-height:64px;padding-top:6px;padding-bottom:6px}}
        .zEmpty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;z-index:9700;font-size:clamp(20px,3vw,30px);color:#2f3a66;text-shadow:0 2px 0 #fff}
        .zDel{position:absolute;z-index:9999;background:#fff;border-radius:999px;padding:8px 14px;font-size:18px;box-shadow:0 4px 0 rgba(0,0,0,.15);color:#c62828}
        .z3Canvas{position:absolute;inset:0;width:100%;height:100%;display:none;touch-action:none;z-index:1}
        .zooW.mode3d .z3Canvas{display:block}
        .zooW.mode3d>.zSky,.zooW.mode3d>.zFar,.zooW.mode3d>.zGround,.zooW.mode3d>.zSun,.zooW.mode3d>.zStar,.zooW.mode3d>.zCloud,.zooW.mode3d>.zSign,.zooW.mode3d>.zPond,.zooW.mode3d>.zFence,.zooW.mode3d>.zProps,.zooW.mode3d>.zVig,.zooW.mode3d>.zTint,.zooW.mode3d>.zA,.zooW.mode3d>.zTreat{display:none}
        .z3Bg{position:absolute;inset:0;background-repeat:no-repeat;display:none;z-index:0;pointer-events:none;transition:filter .6s}
        .zooW.mode3d .z3Bg{display:block}
        .z3Bg.night{filter:brightness(.55) saturate(.8) hue-rotate(-8deg)}
        .z3BgBtn{position:absolute;left:10px;top:8px;z-index:9600;display:none;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.9);font-size:30px;box-shadow:0 4px 0 rgba(0,0,0,.14);align-items:center;justify-content:center}
        .zooW.mode3d .z3BgBtn{display:flex}
        .z3Load{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9600;background:rgba(255,255,255,.92);border-radius:999px;padding:8px 18px;font-size:clamp(17px,2.2vw,22px);color:#2f3a66;pointer-events:none}
        .zA.doll .zDoll{width:100%;height:100%;object-fit:contain;object-position:50% 100%;display:block;pointer-events:none}
        .zhPic .zDollTh{width:100%;height:100%;object-fit:contain;display:block}
        .z3Tip{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:9600;background:rgba(255,255,255,.8);border-radius:999px;padding:4px 14px;font-size:clamp(13px,1.8vw,17px);color:#2f3a66;pointer-events:none;transition:opacity .6s;white-space:nowrap}
        .zCount{position:absolute;right:10px;top:8px;z-index:9600;background:#fff;border:4px solid #b9773a;border-radius:999px;padding:4px 14px;min-height:64px;min-width:72px;font-size:clamp(17px,2.2vw,21px);color:#5a3a1a;box-shadow:0 4px 0 #8a5528}
        .zCount.pulse{animation:zPulse 1s ease-in-out 4}
        @keyframes zPulse{50%{transform:scale(1.15)}}
        .zHouse{position:absolute;inset:0;z-index:9900;background:linear-gradient(180deg,#fff4dc,#ffe6b8);display:flex;flex-direction:column;border-radius:inherit}
        .zhTop{display:flex;align-items:center;gap:8px;padding:10px 12px 6px;flex-wrap:wrap}
        .zhTitle{font-size:clamp(20px,3vw,28px);color:#7a4a1e;flex:1 1 auto;white-space:nowrap}
        .zhClose{min-height:64px}
        .zhFilter{display:flex;gap:6px;padding:0 12px 6px;overflow-x:auto;scrollbar-width:none;flex:0 0 auto}
        .zhFilter::-webkit-scrollbar{display:none}
        .zhF{flex:0 0 auto;min-width:64px;min-height:64px;border-radius:16px;background:#fff;border:3px solid #f0cf94;font-size:24px;padding:2px 8px}
        .zhF.sel{background:#ffd34d;border-color:#b9773a}
        .zhGrid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(120px,17vw,170px),1fr));gap:12px;padding:6px 12px 16px;align-content:start}
        .zhCard{position:relative;border-radius:22px;border:4px solid #fff;padding:6px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 5px 0 rgba(122,74,30,.25)}
        .zhCard.play{background:linear-gradient(180deg,#c8f0ff 0%,#c8f0ff 55%,#9fd77a 56%)}
        .zhCard.rest{background:linear-gradient(180deg,#5b4f8f,#8a7cc0)}
        .zhCard.rest .zhPic{opacity:.75}
        .zhPic{width:100%;aspect-ratio:200/170}
        .zhPic svg{width:100%;height:100%;display:block;overflow:visible}
        .zhState{font-size:clamp(14px,1.8vw,17px);background:rgba(255,255,255,.9);border-radius:999px;padding:1px 10px;color:#3b3355}
        .zhFav{position:absolute;right:4px;top:4px;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.85);font-size:30px;display:flex;align-items:center;justify-content:center;opacity:.45}
        .zhFav.on{opacity:1;background:#ffe27a}
        .zhCard.busy{pointer-events:none;opacity:.6}
        .zEmpty .btn{min-height:64px} /* (2026-11-09) 터치 64px 이상 */
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
      bPaint.addEventListener("click", () => KP.open("zoopaint"));
      const houseOpen = () => !!U.$(".zHouse", W);
      bTreat.addEventListener("click", () => !houseOpen() && this.treats(ctx));
      bCall.addEventListener("click", () => !houseOpen() && this.callAll(ctx));
      // 🏞️ 배경 바꾸기 (3D 동물원 — 날마다 바뀌고, 고른 배경은 그날 하루 기억)
      const bgB = U.btn(KP.E("🏞️"), "z3BgBtn");
      W.appendChild(bgB);
      bgB.addEventListener("click", () => {
        if (!ctx.z3 || !ctx.use3d || houseOpen()) return;
        const ids = KP.zoo3d.BG_IDS,
          next = ids[(ids.indexOf(ctx.z3.bgId) + 1) % ids.length];
        KP.store.set("zoo3d:bg", { d: this.dayNo(), id: next });
        KP.audio.sfx("whoosh");
        U.$$(".zDel", W).forEach((e) => e.remove());
        ctx.z3.setBg(next);
      });
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
    /** 한국 날짜 번호 (배경이 날마다 바뀜) */
    dayNo: () => Math.floor((Date.now() + 9 * 3600e3) / 864e5),
    /** 오늘의 3D 배경: 오늘 고른 것 → 없으면 날짜 차례 */
    bgNow() {
      const ids = KP.zoo3d.BG_IDS,
        s = KP.store.get("zoo3d:bg", null),
        d = this.dayNo();
      return s && s.d === d && ids.includes(s.id) ? s.id : ids[d % ids.length];
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
        ctx.z3.setBg(this.bgNow());
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
        // 인형 모양·그림, 도안 동물 점토 굽기 (처음 한 번 — 다시 꾸밀 때는 있던 것 재사용). 오래 걸리면 '준비 중' 표시
        const z = ctx.z3;
        let wait = null;
        const wt = setTimeout(() => W.appendChild((wait = U.el("div", "z3Load", KP.E("🧸") + " 준비 중"))), 400);
        await z.prepare(items);
        clearTimeout(wt);
        if (wait) wait.remove();
        if (!ctx._active || tok !== ctx._tok || z !== ctx.z3 || z.dead) return;
        items.forEach((it) => {
          const a = z.addAnimal(it, it.id === newId);
          if (it.id === newId) newcomer = a;
        });
      } else {
        items.forEach((it) => this.add(ctx, it, it.id === newId));
        newcomer = ctx.animals.find((x) => x.item.id === newId);
      }
      if (newcomer) {
        const nn = tOf(newcomer.item).name; // '새가' 는 녹음이 없어 새만 "새 친구 새! …" (자연 음성)
        ctx.say(nn === "새" ? "새 친구 새! 동물원에 왔어요! 환영해!" : "새 친구 " + U.josa(nn, "이/가") + " 동물원에 왔어요! 환영해!");
        ctx.after(600, () => KP.confetti(140));
      }
      // 자리가 꽉 차 집에서 쉬러 간 친구가 있으면: 환영 인사 뒤에 짧게 + 집 버튼 반짝
      if (rested.length) {
        KP.voice.say("집에서 쉬는 친구도 있어요!", { queue: true });
        U.replay(ctx.count, "pulse");
      } else ctx.say(U.pick(["동물 친구들을 콕 눌러 보세요!", "빈 땅을 누르면 간식을 줄 수 있어요!", "내가 색칠한 친구들이 놀고 있어요!"]));
      if (use3d) {
        const tip = U.el("div", "z3Tip", KP.E("👆") + " 콕 누르면 폴짝 · 빈 땅은 간식");
        W.appendChild(tip);
        ctx.after(6000, () => (tip.style.opacity = "0"));
        ctx.after(7000, () => tip.remove());
        // 3D 도 가만히 있으면 손가락이 동물 친구를 가리킴 (2.5D 와 같게, 2026-11-09)
        ctx.hint(() => {
          const z = ctx.z3,
            a = z && z.animals && z.animals[0];
          if (!a || tok !== ctx._tok) return null;
          const p = z.toScreen(a, 0.5),
            r = W.getBoundingClientRect();
          return { x: r.left + p.x, y: r.top + p.y };
        }, "동물 친구를 콕 눌러 보세요!");
        ctx.loop((dt) => {
          if (tok !== ctx._tok || !ctx.z3) return false;
          ctx.z3.tick(dt);
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
      const EM = { dino: "🦖", lion: "🦁", elephant: "🐘", rabbit: "🐰", bear: "🐻", pig: "🐷", dog: "🐶", fish: "🐟", bird: "🐦", butterfly: "🦋", turtle: "🐢", doll: "🧸" };
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
      // 동물 종류 그림 탭 (만든 적 있는 종류만, 두 종류 이상일 때) — 🧸 인형 친구는 한 탭에 모두
      const kinds = ORDER.concat(["doll"]).filter((k) => all.some((x) => x.tid === k));
      const drawFilter = () => {
        filt.innerHTML = "";
        if (kinds.length < 2) return;
        [""].concat(kinds).forEach((k) => {
          const b = U.btn(k ? KP.E(EM[k] || "🐾") : KP.E("🐾"), "zhF" + (k === kind ? " sel" : ""));
          b.addEventListener("click", () => {
            kind = k;
            KP.audio.sfx("tap");
            if (k) KP.voice.say(k === "doll" ? "인형 친구!" : T[k].name);
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
      const t = tOf(item);
      const el = U.el("div", "zA" + (item.tid === "doll" ? " doll" : ""));
      const ground = t.move === "walk" || t.move === "hop";
      // 🧸 인형 친구는 2D 에서 칠한 정면 그림으로
      const pic = item.tid === "doll" ? dollImg(item, "zDoll") : shadeSvg(freshSvg(item), item.paint);
      el.innerHTML = (ground ? '<div class="zShadow"></div>' : "") + '<div class="zLift"><div class="zIn"><div class="zBob">' + pic + "</div></div></div>";
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
      // 주의: 누르면 poke() 가 몸통을 튀게(jump) 해서 손가락 아래가 잠깐 비므로 pointerleave 로 취소하면
      //       꾹 누르기가 절대 안 됨(2026-11-08 확인). → 12px 넘게 움직였을 때만 취소 (3D 와 같은 방식)
      let lp = 0,
        lx = 0,
        ly = 0;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        KP.audio.unlock();
        this.poke(ctx, a);
        clearTimeout(lp);
        lx = e.clientX;
        ly = e.clientY;
        try {
          el.setPointerCapture(e.pointerId);
        } catch (_) {}
        lp = setTimeout(() => {
          lp = 0;
          if (el.isConnected) this.askDelete(ctx, a);
        }, 1200); // 꾹 → 집에서 쉬기 버튼
      });
      el.addEventListener("pointermove", (e) => {
        if (lp && Math.hypot(e.clientX - lx, e.clientY - ly) > 12) {
          clearTimeout(lp);
          lp = 0;
        }
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) =>
        el.addEventListener(ev, () => {
          clearTimeout(lp);
          lp = 0;
        })
      );
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
          z.animals.forEach((a, i) => ctx.after(i * 90, () => !z.dead && z.cheer(a)));
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

;

/* ==== js/games/make/zoo3d.js ==== */
/* =====================================================================
   🦁 내 동물원 — 점토 3D (Three.js r170, vendor/three.module.min.js 를 필요할 때만 불러옴)
   - 배경: 점토 디오라마 그림 6종(assets/zoo-bg) — 날마다 바뀌고 🏞️ 버튼으로 바꿀 수 있음.
     그림과 같은 원근 카메라(bgCam)로 3D 를 그 위에 겹침 (그림은 CSS 배경 → 그리기 비용 0)
   - 🧸 3D 인형 친구(doll.js): 칠한 그림을 정면 투영으로 입힌 점토 인형, 뼈대 없이 부위 가중치로 절차적 움직임
   - 🐾 도안 동물(zoo-clay.js, Clay 2.0): 옆모습 도안을 통통한 점토 조각으로 — 다리·꼬리·머리·날개 관절
   - 동물 콕 → 폴짝 + 말, 빈 땅 콕 → 간식, 모두 모여라, 꾹 → 집에서 쉬기(zoo.js)
   - 자동 화질(zoo3d:q) · 가장 낮은 화질에서도 느리면 그림 동물원으로(onSlow) · 화면이 끊기면 새로(onLost)
   - WebGL 이 안 되면 zoo.js 의 2.5D 화면으로 자동 전환
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  let THREE = null;
  let loading = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DEG = Math.PI / 180;

  /* ---------------- 배경 그림 (1600×900) — 손으로 정한 값 (시험판 lab/zoo/bgs.js 그대로 + 연못) ----------------
     vh 지평선 높이(그림 비율) · near 맨 아래 줄에서 세상 1단위 크기 · fov 화각 · poly 걷는 풀밭(그림 좌표 0~1)
     focus 잘릴 때 남길 곳 · sun 햇빛 방향/색 · pond 그림 속 연못 물(타원, 그림 좌표) — 물고기가 헤엄침 */
  const BGS = {
    A: {
      file: "assets/zoo-bg/bg-A-zoo.jpg", vh: 0.3, near: 0.165, fov: 40, focus: [0.5, 0.66], sun: [-0.45, 1, 0.6], sunCol: "#fff3e0",
      poly: [[0.2, 0.615], [0.35, 0.615], [0.4, 0.575], [0.47, 0.545], [0.6, 0.54], [0.66, 0.555], [0.73, 0.6], [0.86, 0.61], [0.875, 0.66], [0.84, 0.71], [0.76, 0.78], [0.69, 0.86], [0.67, 0.93], [0.25, 0.93], [0.21, 0.85], [0.14, 0.76], [0.14, 0.68]],
      pond: { u: 0.255, v: 0.555, ru: 0.055, rv: 0.025 },
    },
    B: {
      file: "assets/zoo-bg/bg-B-farm.jpg", vh: -0.5, near: 0.17, fov: 40, focus: [0.52, 0.6], sun: [-0.5, 1, 0.45], sunCol: "#fff1dc",
      poly: [[0.3, 0.42], [0.36, 0.37], [0.55, 0.36], [0.62, 0.43], [0.8, 0.46], [0.83, 0.56], [0.84, 0.64], [0.79, 0.72], [0.66, 0.79], [0.6, 0.86], [0.31, 0.86], [0.28, 0.76], [0.18, 0.7], [0.16, 0.6], [0.19, 0.5], [0.26, 0.47]],
      pond: { u: 0.765, v: 0.325, ru: 0.08, rv: 0.04 },
    },
    C: {
      file: "assets/zoo-bg/bg-C-zoo.jpg", vh: 0.1, near: 0.18, fov: 40, focus: [0.5, 0.62], sun: [-0.35, 1, 0.55], sunCol: "#fff4dc",
      poly: [[0.32, 0.385], [0.45, 0.345], [0.62, 0.345], [0.76, 0.37], [0.8, 0.43], [0.86, 0.52], [0.89, 0.6], [0.86, 0.71], [0.8, 0.82], [0.7, 0.9], [0.36, 0.91], [0.27, 0.84], [0.15, 0.71], [0.11, 0.6], [0.2, 0.565], [0.29, 0.52], [0.31, 0.44]],
      pond: { u: 0.13, v: 0.43, ru: 0.095, rv: 0.055 },
    },
    D: {
      file: "assets/zoo-bg/bg-D-farm.jpg", vh: -0.12, near: 0.17, fov: 40, focus: [0.5, 0.6], sun: [-0.4, 1, 0.5], sunCol: "#fff2da",
      poly: [[0.12, 0.38], [0.24, 0.3], [0.4, 0.27], [0.6, 0.27], [0.7, 0.37], [0.84, 0.4], [0.9, 0.48], [0.88, 0.6], [0.8, 0.72], [0.66, 0.8], [0.36, 0.8], [0.24, 0.73], [0.14, 0.62], [0.11, 0.5]],
      pond: { u: 0.875, v: 0.275, ru: 0.095, rv: 0.04 },
    },
    E: {
      file: "assets/zoo-bg/bg-E-camp.jpg", vh: -0.25, near: 0.165, fov: 40, focus: [0.5, 0.6], sun: [-0.5, 1, 0.5], sunCol: "#fff6e4",
      poly: [[0.07, 0.5], [0.24, 0.43], [0.36, 0.3], [0.52, 0.24], [0.7, 0.24], [0.78, 0.34], [0.9, 0.42], [0.93, 0.52], [0.9, 0.66], [0.88, 0.9], [0.14, 0.9], [0.12, 0.76], [0.06, 0.62]],
    },
    F: {
      file: "assets/zoo-bg/bg-F-park.jpg", vh: -0.08, near: 0.17, fov: 40, focus: [0.48, 0.6], sun: [-0.6, 0.9, 0.35], sunCol: "#ffeccc",
      poly: [[0.27, 0.45], [0.36, 0.38], [0.5, 0.36], [0.68, 0.37], [0.74, 0.45], [0.8, 0.54], [0.88, 0.63], [0.86, 0.74], [0.76, 0.86], [0.62, 0.9], [0.32, 0.9], [0.25, 0.84], [0.26, 0.7], [0.18, 0.6], [0.22, 0.52]],
    },
  };
  const BG_IDS = Object.keys(BGS);
  const IA = 16 / 9;
  // 그림에 맞춘 카메라(bgCam)·다각형 안 판정은 공용 clay-stage.js (놀이 무대와 같이 씀)
  const inPoly = (pts, x, y) => KP.clayStage.inPoly(pts, x, y);
  const bgCam = (def, vw, vh) => KP.clayStage.bgCam(def, vw, vh);

  KP.zoo3d = {
    ok: null,
    BG_IDS,
    /** WebGL 지원 여부 (한 번만 검사) */
    supported() {
      if (this.ok === null) this.ok = KP.clayStage.supported();
      return this.ok;
    },
    load() {
      if (THREE) return Promise.resolve(THREE);
      if (!loading)
        loading = KP.clayStage
          .load()
          .then((m) => {
            THREE = m;
            KP.CLAY2.use(m);
            return m;
          })
          .catch((e) => {
            loading = null;
            throw e;
          });
      return loading;
    },
    create(ctx, host, T) {
      try {
        return (this._last = new World(ctx, host, T));
      } catch (e) {
        this.ok = false; // WebGL 을 아예 못 만들면 그때만 3D 끄기
        throw e;
      }
    },
  };

  /* ---------------- 함께 쓰는 작은 것들 ---------------- */
  const DOLL_H = 1.6; // 인형 키 (세상 단위, 종의 move.size 를 곱함)
  const CLAY_K = 1.3; // 도안 동물 크기 배율 (인형과 어울리게)
  const CLAY_GAIN = 1.2; // 도안 동물 밝기 맞춤 (인형과 같은 빛에서 아이 그림 색이 그대로 보이게)
  let G = null;
  function geos() {
    if (G) return G;
    G = {
      sph: new THREE.SphereGeometry(1, 18, 12),
      sphLo: new THREE.SphereGeometry(1, 10, 8),
      cone: new THREE.ConeGeometry(1, 1, 14),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
      cap: new THREE.CapsuleGeometry(0.13, 0.29, 4, 10),
      plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    };
    return G;
  }
  const treatMats = new Map();
  function treatMat(color, roughness) {
    const k = color + roughness;
    if (!treatMats.has(k)) treatMats.set(k, new THREE.MeshStandardMaterial({ color, roughness }));
    return treatMats.get(k);
  }
  const angDiff = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  function canvasOf(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h || w;
    return c;
  }
  const loadImg = (src) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });

  /* ================================================================= 3D 세계 */
  function World(ctx, host, T) {
    this.ctx = ctx;
    this.host = host;
    this.T = T;
    geos();
    this.hi = Math.min(screen.width || 0, screen.height || 0) >= 600;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" }));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.setClearColor(0x000000, 0);
    r.domElement.className = "z3Canvas";
    this.bgEl = U.el("div", "z3Bg");
    host.appendChild(this.bgEl);
    host.appendChild(r.domElement);
    // 화면이 잠깐 끊기면(백그라운드·메모리 부족) 동물원이 새로 만들어 다시 보여 줌 (멈춘 화면으로 두지 않게) — 정리 중이면 무시
    r.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      if (this.dead) return;
      this.lost = true;
      if (this.onLost) this._lostT = setTimeout(() => this.onLost(), 600);
    });
    const S = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    this.hemi = new THREE.HemisphereLight(0xeef6ff, 0xd8cfb8, 0.62 * Math.PI);
    this.sun = new THREE.DirectionalLight(0xfff3e0, 0.5 * Math.PI);
    S.add(this.hemi, this.sun, this.sun.target);
    this.cam = { az: 0, taz: 0, baseAz: 0, zoom: 1, tzoom: 1 }; // 고정 카메라 (그림과 같은 원근 — 돌리기 없음)
    this.animals = [];
    this.treats = [];
    this.kinds = {}; // 인형 종: 모양·얼굴 (같은 종이 같이 씀)
    this.res = new Map(); // 동물 하나의 그림 자원 (item.id → {…}) — 다시 꾸밀 때 재사용
    this.seq = 0;
    this.time = 0;
    this.makeShared();
    const qs = KP.store.get("zoo3d:q", null);
    this.q = qs && Number.isFinite(qs.q) ? clamp(qs.q, 0, 3) : 0;
    if (qs && this.q > 0 && Date.now() - (qs.t || 0) > 7 * 864e5) this.q--; // 7일 지나면 한 단계 올려 다시 시도
    this.applyQ(this.q);
    this.bindInput();
    this.setBg(BG_IDS[0]);
    if (window.ResizeObserver) (this.ro = new ResizeObserver(() => this.resize())).observe(host);
  }
  const W3 = World.prototype;

  W3.makeShared = function () {
    // 점토 결(인형) · 발밑 그림자 원판 — 공용 clay-stage.js 와 같은 것
    this.grainT = KP.clayStage.grainTex();
    this.blobT = KP.clayStage.blobTex();
    this.contactM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: 0x1d3a12, opacity: 0.42 });
    this.castM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: 0x1d3a12, opacity: 0.2 });
    // Clay 2.0 가장자리 하늘빛(림)
    this.rimU = { value: new THREE.Color("#eaf6ff") };
    this.eyeMat = this.clayMat({ vertexColors: true, specular: 0x8c8c8c, shininess: 70 });
  };
  /** Clay 2.0 재질: 은은한 광택 + 가장자리 하늘빛 */
  W3.clayMat = function (params) {
    const m = new THREE.MeshPhongMaterial(params);
    const rimU = this.rimU;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.rimCol = rimU;
      sh.fragmentShader =
        "uniform vec3 rimCol;\n" +
        sh.fragmentShader.replace(
          "#include <opaque_fragment>",
          "float rimK = 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) );\noutgoingLight += rimCol * ( rimK * rimK * rimK ) * 0.12;\n#include <opaque_fragment>"
        );
    };
    m.customProgramCacheKey = () => "clay2rim";
    return m;
  };

  /** 다 쓴 세계 정리 (화면이 끊겨 새로 만들 때·느려서 그림 동물원으로 바꿀 때) */
  W3.dispose = function () {
    if (this.dead) return;
    this.dead = this.lost = true;
    clearTimeout(this._lostT);
    clearTimeout(this._slowT);
    if (this.ro) this.ro.disconnect();
    this.clear();
    for (const R of this.res.values()) this.freeRes(R);
    this.res.clear();
    for (const k of Object.values(this.kinds)) {
      k.geo.dispose();
      k.faceT.dispose();
    }
    this.kinds = {};
    this.dropPond();
    for (const x of [this.grainT, this.blobT, this.contactM, this.castM, this.eyeMat]) x.dispose();
    this.renderer.dispose();
    try {
      this.renderer.forceContextLoss(); // 그래픽 메모리를 바로 돌려줌 (iPad)
    } catch (e) {}
    this.renderer.domElement.remove();
    this.bgEl.remove();
  };

  /* ---------- 배경 ---------- */
  W3.setBg = function (id) {
    const def = BGS[id] || BGS.A;
    if (this.bgDef === def) return;
    this.bgId = BGS[id] ? id : "A";
    this.bgDef = def;
    this.bgEl.style.backgroundImage = 'url("' + def.file + '")';
    this.sunDir = new THREE.Vector3(def.sun[0], def.sun[1], def.sun[2]).normalize();
    this.sun.position.copy(this.sunDir).multiplyScalar(10);
    this.lightUp();
    // 그림의 하늘·풀밭 평균색 → 하늘빛(위)·땅 반사빛(아래). 아이 그림 색이 너무 변하지 않게 흰색 쪽으로 많이 섞음
    const im = new Image();
    im.onload = () => {
      if (this.dead || this.bgDef !== def) return;
      const c = canvasOf(64, 36), g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(im, 0, 0, 64, 36);
      const d = g.getImageData(0, 0, 64, 36).data, sky = [0, 0, 0, 0], grass = [0, 0, 0, 0];
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4, u = (x + 0.5) / 64, v = (y + 0.5) / 36;
          const a = inPoly(def.poly, u, v) ? grass : v < 0.12 ? sky : null;
          if (a) {
            a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; a[3]++;
          }
        }
      const av = (a, f) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : f);
      def.tint = { sky: av(sky, [170, 210, 240]), grass: av(grass, [120, 180, 90]) };
      this.lightUp();
    };
    im.src = def.file;
    this.w = 0; // 다음 resize 에서 카메라 다시
    this.resize();
  };
  /** 빛: 배경 그림의 해 방향·색 + 하늘/풀빛 (밤에는 어둡게) */
  W3.lightUp = function () {
    const def = this.bgDef, t = def.tint, n = !!this.night;
    this.sun.color.set(n ? "#b8c8ff" : def.sunCol || "#fff3e0");
    if (t) {
      this.hemi.color.setRGB(...t.sky.map((v) => (v / 255) * 0.35 + 0.65), THREE.SRGBColorSpace);
      this.hemi.groundColor.setRGB(...t.grass.map((v, k) => (v / 255) * 0.4 + [0.85, 0.8, 0.7][k] * 0.6), THREE.SRGBColorSpace);
      this.rimU.value.setRGB(...t.sky.map((v) => (v / 255) * 0.4 + 0.6), THREE.SRGBColorSpace);
      const gm = t.grass.map((v) => v / 255);
      this.contactM.color.setRGB(gm[0] * 0.25, gm[1] * 0.3, gm[2] * 0.2, THREE.SRGBColorSpace);
      this.castM.color.copy(this.contactM.color);
    }
    this.hemi.intensity = (n ? 0.42 : 0.62) * Math.PI;
    this.sun.intensity = (n ? 0.2 : 0.5) * Math.PI;
  };
  W3.setNight = function (n) {
    this.night = !!n;
    this.bgEl.classList.toggle("night", this.night);
    this.lightUp();
  };

  /* ---------- 크기 · 카메라 ---------- */
  W3.resize = function () {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w;
    this.h = h;
    const r = this.renderer;
    r.setSize(w, h, false);
    r.domElement.style.width = w + "px";
    r.domElement.style.height = h + "px";
    const cam = (this.bc = bgCam(this.bgDef, w, h));
    const c = this.camera;
    c.fov = cam.fov;
    c.position.set(...cam.pos);
    c.lookAt(...cam.target);
    c.aspect = cam.view.fw / cam.view.fh;
    c.setViewOffset(cam.view.fw, cam.view.fh, cam.view.ox, cam.view.oy, w, h);
    c.updateProjectionMatrix();
    this.bgEl.style.backgroundSize = cam.view.fw + "px " + cam.view.fh + "px";
    this.bgEl.style.backgroundPosition = -cam.view.ox + "px " + -cam.view.oy + "px";
    this.sk = Math.min(1, cam.scale * 1.55); // 좁은 화면(폰 세로)은 덜 줄임
    this.setupPond();
    this.placeAll();
    this.render();
  };
  /** 동물 하나의 폭·키 (세상 단위) */
  W3.dims = function (a) {
    if (a.type === "doll") a.w = a.kind.w * a.size, a.h = a.size;
    else {
      const m = a.art.model, s = 0.01 * a.size;
      a.w = (m.bbox.x1 - m.bbox.x0) * s;
      a.h = (m.foot[1] - m.bbox.y0) * s;
    }
  };
  W3.sizeOf = function (a) {
    const sk = this.sk || 1;
    if (a.type === "doll") a.size = DOLL_H * a.kind.mv.size * sk;
    else {
      a.size = a.rig.size * CLAY_K * sk;
      if (a.swim && this.pond) a.size = Math.min(a.size, this.pond.fish);
    }
    this.dims(a);
  };
  W3.inside = function (a, x, z) {
    if (!this.bc) return false;
    if (a.swim) return this.inPondXZ(x, z, 0.8);
    if (!this.bc.inside(a, x, z)) return false;
    if (this.pond && this.pond.mesh && !a.fly && this.inPondXZ(x, z, 1.25 + a.w * 0.4 / this.pond.rx)) return false;
    return true;
  };
  /** 처음 자리: 후보 여러 개 중 다른 동물과 가장 먼 곳 */
  W3.placeAll = function () {
    if (!this.bc) return;
    const done = [];
    for (const a of this.animals) {
      this.sizeOf(a);
      if (a.swim) {
        const p = this.pondPick(a);
        a.x = a.tx = p[0];
        a.z = a.tz = p[1];
        continue;
      }
      let best = null, bd = -1;
      for (let k = 0; k < 14; k++) {
        const g = this.pickFor(a);
        if (!g) continue;
        let d = 9;
        for (const q of done) d = Math.min(d, Math.hypot(g[0] - q[0], (g[1] - q[1]) * 0.8) / (q[2] + a.w));
        if (d > bd) {
          bd = d;
          best = g;
        }
      }
      if (best) {
        a.x = a.tx = best[0];
        a.z = a.tz = best[1];
        done.push([best[0], best[1], a.w]);
      }
      if (a.fly) a.y = a.ty = 0.7 + Math.random() * 0.8;
      a.state = "idle";
      a.wait = Math.random() * 1.5;
      a.isNew = 0;
      a.treat = null;
    }
  };
  W3.pickFor = function (a) {
    for (let i = 0; i < 6; i++) {
      const g = this.bc.pick(a);
      if (g && this.inside(a, g[0], g[1])) return g;
    }
    return null;
  };

  /* ---------- 연못 (물고기): 그림 속 연못이 화면에 보이면 거기, 아니면 풀밭 앞쪽에 점토 연못 ---------- */
  W3.dropPond = function () {
    const p = this.pond;
    if (p && p.mesh) {
      this.scene.remove(p.mesh);
      p.mesh.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
    this.pond = null;
  };
  W3.setupPond = function () {
    this.dropPond();
    if (!this.animals.some((a) => a.swim) && !this._wantPond) return;
    const bc = this.bc, d = this.bgDef.pond;
    if (d && bc.vis.u0 < d.u - d.ru * 0.3 && bc.vis.u1 > d.u + d.ru * 0.3 && bc.vis.v1 > d.v + d.rv * 0.5) {
      const c = bc.ground(d.u, d.v), l = bc.ground(d.u - d.ru, d.v), f = bc.ground(d.u, d.v - d.rv), n = bc.ground(d.u, d.v + d.rv);
      if (c && l && f && n) {
        const rx = Math.abs(c[0] - l[0]), rz = Math.abs(n[1] - f[1]) / 2;
        // 물고기 폭 ≈ 연못 반지름의 62% (물고기 도안 폭 약 150 단위 × 0.01 × size)
        this.pond = { x: c[0], z: (n[1] + f[1]) / 2, rx, rz, fish: (rx * 0.62) / 1.5 };
        return;
      }
    }
    // 점토 연못: 풀밭 앞쪽 왼쪽/오른쪽 중 들어가는 곳
    const sk = this.sk || 1, rx = 1.25 * sk, rz = 0.72 * sk;
    let at = null;
    for (const [u, v] of [[0.78, 0.8], [0.24, 0.8], [0.7, 0.7], [0.3, 0.7], [0.5, 0.78]]) {
      const uu = bc.vis.u0 + (bc.vis.u1 - bc.vis.u0) * u, vv = bc.vis.v0 + (bc.vis.v1 - bc.vis.v0) * v;
      const g = bc.ground(uu, vv);
      if (g && bc.inside({ w: rx * 2.4, h: 0.2 }, g[0], g[1])) {
        at = g;
        break;
      }
    }
    if (!at) at = bc.pick({ w: rx * 2, h: 0.2 }) || bc.ground(0.5, 0.8) || [0, -6];
    const grp = new THREE.Group();
    grp.position.set(at[0], 0, at[1]);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: "#5fb9ec", specular: 0x99bbcc, shininess: 60 }));
    water.scale.set(rx, 1, rz);
    water.position.y = 0.02;
    const deep = new THREE.Mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#2f86c8", transparent: true, opacity: 0.35, depthWrite: false }));
    deep.scale.set(rx * 0.6, 1, rz * 0.55);
    deep.position.y = 0.025;
    grp.add(water, deep);
    const stones = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, s = (0.16 + ((i * 7) % 4) * 0.025) * sk;
      const g = new THREE.IcosahedronGeometry(1, 1);
      g.scale(s * 1.3, s * 0.7, s);
      g.rotateY(a);
      g.translate(Math.cos(a) * rx * 1.04, s * 0.3, Math.sin(a) * rz * 1.08);
      stones.push(g);
    }
    const sg = mergeGeos(stones);
    const sm = new THREE.Mesh(sg, new THREE.MeshPhongMaterial({ color: "#b9c0cc", shininess: 8, flatShading: false }));
    grp.add(sm);
    this.scene.add(grp);
    this.pond = { x: at[0], z: at[1], rx, rz, mesh: grp, fish: (rx * 0.6) / 1.5 };
  };
  function mergeGeos(list) {
    let n = 0, ni = 0;
    for (const g of list) {
      n += g.attributes.position.count;
      ni += g.index ? g.index.count : g.attributes.position.count;
    }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint32Array(ni);
    let o = 0, io = 0;
    for (const g of list) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + o;
      else for (let i = 0; i < c; i++) idx[io++] = i + o;
      o += c;
      g.dispose();
    }
    const m = new THREE.BufferGeometry();
    m.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    m.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    m.setIndex(new THREE.BufferAttribute(idx, 1));
    return m;
  }
  W3.inPondXZ = function (x, z, m = 1) {
    const p = this.pond;
    if (!p) return false;
    const dx = (x - p.x) / (p.rx * m), dz = (z - p.z) / (p.rz * m);
    return dx * dx + dz * dz < 1;
  };
  W3.pondPick = function (self) {
    const p = this.pond;
    if (!p) return [0, -6];
    let best = null, bd = -1;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * 0.62;
      const q = [p.x + Math.cos(a) * p.rx * rr, p.z + Math.sin(a) * p.rz * rr];
      let d = 9;
      for (const o of this.animals) if (o !== self && o.swim) d = Math.min(d, Math.hypot(o.tx - q[0], o.tz - q[1]), Math.hypot(o.x - q[0], o.z - q[1]));
      if (d > bd) {
        bd = d;
        best = q;
      }
    }
    return best;
  };

  /* ---------- 준비: 인형 종 모양·그림, 도안 동물 점토 굽기 (다시 꾸밀 때는 있던 것 재사용) ---------- */
  W3.prepare = async function (items) {
    const D = KP.DOLL, want = new Set(items.map((x) => x.id));
    this._wantPond = items.some((x) => this.tOf(x).move === "swim");
    // 더는 안 나오는 친구의 그림 자원 정리
    for (const [id, R] of this.res) if (!want.has(id)) {
      this.freeRes(R);
      this.res.delete(id);
    }
    const nDoll = items.filter((x) => x.tid === "doll").length;
    const texSize = nDoll > 6 || !this.hi ? 512 : 768;
    for (const it of items) {
      if (this.dead) return;
      if (this.res.has(it.id)) continue;
      try {
        if (it.tid === "doll") {
          const sp = it.species;
          if (!this.kinds[sp]) {
            const { model, B } = await D.load(sp);
            if (this.dead) return;
            this.kinds[sp] = this.addKind(sp, model, B);
          }
          const im = await loadImg(KP.safeImg(it.img));
          if (!im || this.dead) continue;
          let src = im;
          if (Math.max(im.width, im.height) > texSize) {
            src = canvasOf(texSize);
            const g = src.getContext("2d");
            g.imageSmoothingQuality = "high";
            g.drawImage(im, 0, 0, texSize, texSize);
          }
          const tex = new THREE.Texture(src);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.needsUpdate = true;
          this.res.set(it.id, { type: "doll", tex });
        } else {
          const art = await KP.CLAY2.buildArt(it);
          if (!art || this.dead) continue;
          this.res.set(it.id, this.clayRes(art));
        }
      } catch (e) {
        console.warn("동물 준비 실패", it.tid, e && e.message);
      }
      await new Promise((r) => setTimeout(r, 0)); // 한 마리씩 (화면이 멈추지 않게)
    }
  };
  W3.freeRes = function (R) {
    if (R.type === "doll") R.tex.dispose();
    else {
      R.tex.dispose();
      R.ntex.dispose();
      R.mat.dispose();
      for (const g of Object.values(R.groups)) g && g.dispose();
      for (const e of R.eyes) e.geo && e.geo.dispose();
    }
  };
  /** 도안 동물 그림 한 장 → 점토 질감·입체 (Clay 2.0) */
  W3.clayRes = function (art) {
    const C = KP.CLAY2;
    C.layout(art.model, 1.15, true);
    const bk = C.bakeClay2(art, { grain: 1 });
    const aniso = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    const tex = new THREE.CanvasTexture(bk.colorC);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    const ntex = new THREE.CanvasTexture(bk.normalC);
    ntex.colorSpace = THREE.NoColorSpace;
    ntex.anisotropy = aniso;
    const mat = this.clayMat({ map: tex, normalMap: ntex, vertexColors: true, specular: 0x1c1a18, shininess: 14 });
    mat.color.setScalar(CLAY_GAIN);
    const groups = {}, eyes = [];
    for (const [name, gr] of Object.entries(art.model.groups)) {
      const list = [];
      for (const pc of art.model.pieces) {
        if (pc.group !== name) continue;
        if (pc.kind === "eye") eyes.push({ pc, geo: C.merge(C.pieceGeo(pc, art, [pc.cx, pc.cy], true)), group: name });
        else list.push(...C.pieceGeo(pc, art, gr.pivot, true));
      }
      groups[name] = C.merge(list);
    }
    return { type: "clay", art, tex, ntex, mat, groups, eyes };
  };
  /** 인형 종 등록: 같은 종 인형들이 모양·얼굴 텍스처를 같이 씀 */
  W3.addKind = function (id, model, B) {
    return KP.dollActor.kind(id, model, B, this.hi);
  };
  /** 인형 재질: 그림 텍스처 + 절차적 움직임 (모든 종이 같은 셰이더 하나) */
  W3.dollMat = function (tex, k) {
    return KP.dollActor.material(tex, k, this.grainT);
  };

  /* ---------- 동물 ---------- */
  W3.tOf = function (item) {
    return item.tid === "doll" ? KP.DOLL.tOf(item.species) : this.T[item.tid];
  };
  /** 동물 하나의 자기 것(재질·그림자)만 장면에서 빼고 정리 — 그림 자원(res)은 다시 꾸밀 때 재사용 */
  W3.freeAnimal = function (a) {
    this.scene.remove(a.root, a.contact, a.cast);
    if (a.type === "doll") a.mat.dispose();
  };
  W3.clear = function () {
    for (const a of this.animals) this.freeAnimal(a);
    for (const t of this.treats) this.scene.remove(t.obj);
    this.animals = [];
    this.treats = [];
  };
  W3.addAnimal = function (item, isNew) {
    const R = this.res.get(item.id);
    if (!R) return null; // 준비 못 한 친구(그림 오류 등)는 빼고
    const t = this.tOf(item);
    const a = {
      id: ++this.seq, item, t, type: R.type, x: 0, z: -5, y: 0, tx: 0, tz: -5, ty: 0, state: "idle", wait: Math.random() * 2, speed: 0,
      isNew: 0, treat: null, gather: false, look: 0, react: -1, seed: Math.random() * 100,
    };
    const S = this.scene;
    a.contact = new THREE.Mesh(G.plane, this.contactM);
    a.cast = new THREE.Mesh(G.plane, this.castM);
    a.contact.renderOrder = a.cast.renderOrder = -1;
    if (R.type === "doll") {
      const k = (a.kind = this.kinds[item.species]);
      a.mat = this.dollMat(R.tex, k);
      a.root = new THREE.Mesh(k.geo, a.mat);
      Object.assign(a, { yaw: 0, ph: Math.random() * 6, amp: 0, sq: 0, sqv: 0, happy: 0, hop: 0, M: k.mv });
      a.hopper = k.mv.hop > 0;
    } else {
      const art = (a.art = R.art), m = art.model;
      a.rig = m.rig;
      a.fly = !!m.rig.fly;
      a.swim = !!m.rig.swim;
      a.hopper = !!m.rig.hop;
      const obj = new THREE.Group(), poseO = new THREE.Group();
      obj.add(poseO);
      const joints = {};
      for (const [name, gr] of Object.entries(m.groups)) {
        const j = new THREE.Group(), parent = gr.parent ? joints[gr.parent] : null;
        const pp = parent ? m.groups[gr.parent].pivot : m.foot;
        j.position.set(gr.pivot[0] - pp[0], -(gr.pivot[1] - pp[1]), 0);
        (parent || poseO).add(j);
        joints[name] = j;
        if (R.groups[name]) j.add(new THREE.Mesh(R.groups[name], R.mat));
      }
      const eyes = [];
      for (const e of R.eyes) {
        if (!e.geo) continue;
        const pv = m.groups[e.group].pivot, mesh = new THREE.Mesh(e.geo, this.eyeMat);
        mesh.position.set(e.pc.cx - pv[0], -(e.pc.cy - pv[1]), 0);
        joints[e.group].add(mesh);
        eyes.push(mesh);
      }
      a.root = obj;
      Object.assign(a, { poseO, joints, eyes, walk: Math.random() * 6, face: Math.random() < 0.5 ? 1 : -1, turn: 0, hopT: 0, blinkT: 1 + Math.random() * 3, blink: 0, wag: Math.random() * 6, flap: Math.random() * 6, oyaw: 0 });
      a.faceShow = a.face;
    }
    S.add(a.contact, a.cast, a.root);
    this.animals.push(a);
    if (a.swim && !this.pond) this.setupPond();
    this.sizeOf(a);
    if (a.swim) {
      const p = this.pondPick(a);
      a.x = a.tx = p[0];
      a.z = a.tz = p[1];
    } else {
      // 다른 친구와 가장 먼 자리
      let best = null, bd = -1;
      for (let i = 0; i < 12; i++) {
        const g = this.pickFor(a);
        if (!g) continue;
        let d = 9;
        for (const o of this.animals) if (o !== a && !o.fly && !o.swim) d = Math.min(d, Math.hypot(o.x - g[0], (o.z - g[1]) * 0.8) / ((o.w + a.w) / 2));
        if (d > bd) {
          bd = d;
          best = g;
        }
      }
      if (best) {
        a.x = a.tx = best[0];
        a.z = a.tz = best[1];
      } else if (this.bc) {
        const g = this.bc.ground(0.5, 0.75) || [0, -5];
        a.x = a.tx = g[0];
        a.z = a.tz = g[1];
      }
      if (a.fly) a.y = a.ty = 0.7 + Math.random() * 0.8;
      if (isNew && this.bc) {
        // 새 친구: 화면 왼쪽 밖에서 걸어(날아) 들어옴
        const v = this.bc.uv(a.x, 0, a.z), zc = v[2], t = Math.tan((this.bc.fov * Math.PI) / 360);
        const xl = (this.bc.vis.u0 - 0.04 - 0.5) * 2 * zc * t * IA - a.w * 0.6;
        a.tx = a.x;
        a.tz = a.z;
        a.x = xl;
        a.state = "walk";
        a.walkT = 12;
        a.isNew = 7;
        a.face = a.faceShow = 1;
      }
    }
    this.place(a, 0);
    return a;
  };

  /* ---------- 움직임 ---------- */
  const gapOf = (a, b) => ((a.w + b.w) / 2) * 1.02;
  const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, (az - bz) * 0.8);
  /** 걸어갈 곳 고르기 — 인형: 정면~3/4 위주(얼굴이 보이게), 도안 동물: 옆모습 위주(±25°) */
  W3.pickWalk = function (a) {
    let best = null, bs = -1e9;
    const tn = Math.tan(25 * DEG);
    for (let k = 0; k < 10; k++) {
      const g = this.pickFor(a);
      if (!g) continue;
      const dx = g[0] - a.x, dz = g[1] - a.z, d = Math.hypot(dx, dz);
      if (d < 0.35) continue;
      let crowd = false;
      for (const o of this.animals) {
        if (o === a || o.fly || o.swim) continue;
        const gp = gapOf(a, o);
        if (dist2(g[0], g[1], o.x, o.z) < gp || (o.state === "walk" && dist2(g[0], g[1], o.tx, o.tz) < gp)) {
          crowd = true;
          break;
        }
      }
      if (crowd) continue;
      let score;
      if (a.type === "doll") score = (dz >= 0 ? 1 : 1 + (dz / (Math.abs(dx) + 0.01)) * 0.8) - d * 0.08 + Math.random() * 0.3;
      else {
        // 옆으로 걷기: 앞뒤가 많이 바뀌면 앞뒤만 줄여 봄
        let gz = g[1];
        if (Math.abs(dz) > Math.abs(dx) * tn) {
          gz = a.z + Math.sign(dz) * Math.abs(dx) * tn;
          if (!this.inside(a, g[0], gz)) continue;
        }
        g[1] = gz;
        score = Math.abs(dx) > 0.35 ? 1 - d * 0.05 + Math.random() * 0.3 : -1;
      }
      if (score > bs) {
        bs = score;
        best = g;
      }
    }
    return best;
  };
  W3.tick = function (dt) {
    if (this.lost || this.dead) return;
    this.measure();
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.resize();
    const t = this.time;
    for (const a of this.animals) this.stepA(a, dt, t);
    // 겹치지 않게 살짝 밀기 (땅 친구끼리)
    const land = this.animals.filter((a) => !a.fly && !a.swim && !a.isNew);
    for (let i = 0; i < land.length; i++)
      for (let j = i + 1; j < land.length; j++) {
        const a = land[i], b = land[j], dx = b.x - a.x, dz = (b.z - a.z) * 0.8, d = Math.hypot(dx, dz), min = gapOf(a, b) * 0.85;
        if (d > 0.001 && d < min) {
          const p = ((min - d) / d) * 0.5 * Math.min(1, dt * 4);
          const ax = a.x - dx * p, az = a.z - (dz / 0.8) * p * 0.5, bx = b.x + dx * p, bz = b.z + (dz / 0.8) * p * 0.5;
          if (this.inside(a, ax, az)) (a.x = ax), (a.z = az);
          if (this.inside(b, bx, bz)) (b.x = bx), (b.z = bz);
        }
      }
    for (const a of this.animals) this.place(a, dt);
    this.tickTreats(dt);
    this.render();
    this.frames = (this.frames || 0) + 1;
  };
  W3.stepA = function (a, dt, t) {
    if (a.isNew) a.isNew = Math.max(0, a.isNew - dt);
    if (a.react >= 0 && (a.react += dt) > 1.25) a.react = -1;
    if (a.type === "clay") {
      a.blinkT -= dt;
      if (a.blinkT <= 0) {
        a.blink = 0.16;
        a.blinkT = 2 + Math.random() * 3.5;
      }
      if (a.blink > 0) a.blink -= dt;
      a.wag += dt * (a.react >= 0 ? 16 : 8);
      if (a.turn > 0) {
        a.turn -= dt / 0.36;
        if (a.turn <= 0.5 && a.faceShow !== a.face) a.faceShow = a.face;
        if (a.turn < 0) a.turn = 0;
      }
    }
    const busy = a.treat || a.gather;
    if (a.fly) {
      // 하늘: 천천히 다른 곳으로
      a.flap += dt * (a.react >= 0 ? 30 : 20);
      a.wait -= dt;
      if (a.state !== "walk" || a.wait <= 0 || Math.hypot(a.tx - a.x, a.tz - a.z) < 0.25) {
        if (!a.gather || a.state !== "walk") {
          a.ty = 0.7 + Math.random() * 0.9;
          const g = this.pickFor(Object.assign({}, a, { y: a.ty }));
          if (g) (a.tx = g[0]), (a.tz = g[1]);
          a.gather = false;
        }
        a.state = "walk";
        a.wait = 2.5 + Math.random() * 2.5;
      }
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz) || 1, sp = 0.9 * this.sk * (a.isNew ? 1.4 : 1);
      if (d > 0.05) {
        a.x += (dx / d) * Math.min(d, sp * dt);
        a.z += (dz / d) * Math.min(d, sp * dt);
      }
      a.y += (a.ty - a.y) * dt * 0.8;
      const f = dx > 0.05 ? 1 : dx < -0.05 ? -1 : a.face;
      if (f !== a.face && a.turn === 0) (a.face = f), (a.turn = 1);
      return;
    }
    if (a.swim) {
      a.wait -= dt;
      if (a.state === "idle" && a.wait <= 0) {
        const p = this.pondPick(a);
        a.tx = p[0];
        a.tz = p[1];
        a.state = "walk";
      }
      if (a.state === "walk") {
        const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
        if (d < 0.05) {
          a.state = "idle";
          a.wait = 0.8 + Math.random() * 2;
        } else {
          const sp = 0.32 * this.sk;
          a.x += (dx / d) * Math.min(d, sp * dt);
          a.z += (dz / d) * Math.min(d, sp * dt);
          const f = dx > 0.02 ? 1 : dx < -0.02 ? -1 : a.face;
          if (f !== a.face && a.turn === 0) (a.face = f), (a.turn = 1);
        }
      }
      return;
    }
    // 땅
    if (a.react >= 0 && a.react < 0.9 && a.type === "clay") return; // 누르면 그 자리에서 반응
    if (a.state === "idle") {
      a.speed = Math.max(0, a.speed - dt * 3);
      a.wait -= dt;
      if (a.wait <= 0) {
        let g = null;
        if (a.treat) g = [a.treat.ax, a.treat.az];
        else if (!a.gather) g = this.pickWalk(a);
        if (g) {
          a.tx = g[0];
          a.tz = g[1];
          a.state = "walk";
          a.walkT = 12;
          a.hopT = a.hopper ? 99 : Math.random() < 0.25 ? 1.4 : 0;
          if (a.type === "clay") {
            const f = a.tx > a.x ? 1 : -1;
            if (f !== a.face) (a.face = f), (a.turn = 1);
          }
        } else a.wait = 0.6 + Math.random();
      }
    } else {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
      // a.speed: 화면 크기와 무관한 빠르기 (도안 동물 다리 박자용) — 실제 이동은 × mul
      const doll = a.type === "doll", mul = doll ? a.size / DOLL_H : this.sk;
      const base = doll ? a.M.speed * 1.15 : (a.hopT > 0 ? 1.0 : 0.6) * (a.rig.slow ? 0.45 : 1);
      const vmax = base * (busy ? 1.8 : 1) * (a.isNew ? 1.3 : 1) * (doll && a.happy > 0.2 ? 1.4 : 1);
      a.speed = Math.min(vmax, a.speed + dt * 2.2);
      if (a.hopT > 0 && !a.hopper) a.hopT -= dt;
      a.walkT -= dt;
      if (d < 0.06 || (a.walkT <= 0 && !busy && !a.isNew)) {
        a.state = "idle";
        a.wait = busy ? 0 : 1.2 + Math.random() * 2.8;
        if (a.treat) this.eat(a);
        else if (a.gather) {
          a.gather = false;
          a.look = 4;
          a.wait = 4;
        }
      } else {
        const st = Math.min(d, a.speed * mul * dt), nx = a.x + (dx / d) * st, nz = a.z + (dz / d) * st;
        let block = false;
        if (!a.isNew && !busy)
          for (const o of this.animals) {
            if (o === a || o.fly || o.swim) continue;
            const gp = gapOf(a, o), now = dist2(a.x, a.z, o.x, o.z), next = dist2(nx, nz, o.x, o.z);
            if (next < gp && next < now) {
              block = true;
              break;
            }
          }
        if (block) {
          a.state = "idle";
          a.wait = 0.3 + Math.random() * 0.6;
        } else if (a.isNew || busy || this.inside(a, nx, nz)) {
          a.x = nx;
          a.z = nz;
        } else {
          a.state = "idle";
          a.wait = 0.5;
        }
        if (a.type === "clay") {
          const f = dx > 0.05 ? 1 : dx < -0.05 ? -1 : a.face;
          if (f !== a.face && a.turn === 0) (a.face = f), (a.turn = 1);
          a.walk += dt * a.speed * 9.5;
        }
      }
    }
    if (a.look > 0) a.look -= dt;
  };

  /** 화면에 놓기 (자세·그림자) */
  W3.place = function (a, dt) {
    const t = this.time, sun = this.sunDir || new THREE.Vector3(-0.4, 1, 0.5);
    let topY = 0;
    if (a.type === "doll") {
      KP.dollActor.pose(a, dt, t); // 인형 자세 (공용 doll-actor.js — 놀이 무대와 같이 씀)
    } else {
      const C = KP.CLAY2, m = a.art.model, s = C.U * a.size;
      const ps = C.pose(a, t);
      a.root.position.set(a.x, a.swim ? 0.06 * this.sk : a.y, a.z);
      // 옆모습 위주: 걷는 방향 쪽으로 최대 ±25°, 서 있을 땐 카메라 쪽으로 10° (입체가 보이게)
      const mir = ps.root.mirror, moving = !a.fly && a.state === "walk" && a.react < 0;
      let ty = -mir * 10 * DEG;
      if (moving) ty = clamp(-mir * Math.atan2(a.tz - a.z, Math.abs(a.tx - a.x) + 1e-6), -25 * DEG, 25 * DEG);
      if (a.turn > 0) ty = 0;
      if (a.omir !== mir) {
        a.oyaw = a.omir == null ? ty : -(a.oyaw || 0);
        a.omir = mir;
      }
      a.oyaw += (ty - a.oyaw) * Math.min(1, dt * 4);
      let ksx = 1, ksy = 1, by = 0, headBob = 0;
      const sp = Math.min(1, a.speed / 0.6);
      if (moving && !(a.hopT > 0)) {
        const c = Math.cos(2 * a.walk);
        ksy = 1 - 0.04 * c * sp;
        ksx = 1 + 0.028 * c * sp;
        by = Math.abs(Math.sin(a.walk)) * 1.6 * sp;
        headBob = Math.sin(2 * a.walk - 0.8) * 2.4 * sp;
      } else if (!a.fly && a.react < 0) {
        const b = Math.sin(t * 2.3 + a.id * 1.7);
        ksy = 1 + 0.018 * b;
        ksx = 1 - 0.012 * b;
      }
      a.root.rotation.y = ps.root.ry * DEG + a.oyaw;
      a.root.scale.set(s * ps.root.mirror, s, s);
      a.poseO.position.y = ps.root.y + by;
      a.poseO.rotation.z = -ps.root.rz * DEG;
      a.poseO.scale.set(ps.root.sx * ksx, ps.root.sy * ksy, (ps.root.sx * ksx + ps.root.sy * ksy) / 2);
      for (const [name, gr] of Object.entries(m.groups)) {
        if (!gr.parent) continue;
        const j = a.joints[name], q = ps.g[name];
        j.rotation.z = (q && q.rz ? -q.rz * DEG : 0) + (name === "head" ? -headBob * DEG : 0);
        j.rotation.y = q && q.ry ? (gr.flap ? 1 : -1) * q.ry * DEG : 0;
        j.scale.set((q && q.sx) || 1, (q && q.sy) || 1, 1);
      }
      for (const e of a.eyes) e.scale.y = ps.eye;
      a.bobY = (ps.root.y + by) * s;
      topY = a.fly ? a.y : 0;
    }
    // 그림자: 발밑 접촉 + 햇빛 반대쪽으로 길게. 하늘 친구는 높이 따라 작고 흐리게
    const hgt = a.fly ? a.y : a.bobY || 0;
    const sr = a.w * 0.62 * (a.swim ? 0.7 : 1), k = 1 - Math.min(0.6, hgt * 0.35);
    a.contact.position.set(a.x, 0.003, a.z + 0.02 * a.h);
    a.contact.scale.set(sr * k, 1, sr * 0.55 * k);
    a.contact.visible = !a.swim;
    const sl = Math.hypot(sun.x, sun.z) || 1, L = clamp(1.6 / Math.max(0.3, sun.y / sl), 0.6, 2.4) * 0.5 * a.h;
    a.cast.visible = !a.fly && !a.swim;
    a.cast.position.set(a.x - (sun.x / sl) * L * 0.55, 0.002, a.z - (sun.z / sl) * L * 0.55);
    a.cast.rotation.y = Math.atan2(-sun.x, -sun.z);
    a.cast.scale.set(sr * 0.95, 1, sr * 0.6 + L);
    void topY;
  };

  /** 화질 단계: 0 고화질 · 1 해상도↓ · 2 더↓ · 3 최저 */
  W3.applyQ = function (q) {
    this.q = q;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(dpr, [2, 1.5, 1.25, 1][q]));
    if (this.w) this.renderer.setSize(this.w, this.h, false);
  };
  /** 느린 기기면 화질을 한 단계씩 낮춤 (초당 약 28장 미만이 이어질 때) */
  W3.measure = function () {
    const now = performance.now();
    if (!this._warm) this._warm = now + 3000; // 처음 3초(불러오기)는 빼고
    const f = now - (this._lt || now);
    this._lt = now;
    if (now < this._warm || f <= 0 || f > 3000) return; // 3초 넘는 틈은 화면이 가려졌던 것
    this._fs = (this._fs || 0) + f;
    this._fn = (this._fn || 0) + 1;
    if (this._fs < 4000 || this._fn < 8) return; // 약 4초마다 판단
    const avg = this._fs / this._fn;
    this._fs = this._fn = 0;
    this.fps = Math.round(1000 / avg);
    if (avg > 36 && this.q < 3) {
      this.applyQ(this.q + 1);
      KP.store.set("zoo3d:q", { q: this.q, t: Date.now() });
      this._warm = now + 1500;
    } else if (this.q >= 3 && avg > 55) {
      // 가장 낮은 화질에서도 초당 18장도 안 나오면(두 번 연속) 그림 동물원으로
      this._slowN = (this._slowN || 0) + 1;
      if (this._slowN >= 2 && this.onSlow && !this._slowTold) {
        this._slowTold = true;
        this._slowT = setTimeout(() => this.onSlow(), 0); // 지금 그리는 장면을 마친 뒤에
      }
    } else this._slowN = 0;
  };
  W3.render = function () {
    if (this.lost || this.dead || !this.bc) return;
    this.renderer.render(this.scene, this.camera);
  };

  /* ---------- 간식 ---------- */
  W3.makeTreat = function () {
    const g = new THREE.Group();
    const kind = U.pick(["apple", "carrot", "corn", "apple"]);
    if (kind === "apple") {
      const a = new THREE.Mesh(G.sph, treatMat("#ff4d5e", 0.35));
      a.scale.set(0.32, 0.29, 0.32);
      const s = new THREE.Mesh(G.cyl, treatMat("#6b4226", 0.7));
      s.position.y = 0.32;
      s.scale.set(0.03, 0.14, 0.03);
      const l = new THREE.Mesh(G.sphLo, treatMat("#4fae45", 0.7));
      l.position.set(0.09, 0.34, 0);
      l.scale.set(0.11, 0.03, 0.06);
      g.add(a, s, l);
      g.userData.rest = 0.29;
    } else if (kind === "carrot") {
      const c = new THREE.Mesh(G.cone, treatMat("#ff8a2b", 0.35));
      c.scale.set(0.16, 0.6, 0.16);
      c.rotation.z = Math.PI / 2;
      g.add(c);
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(G.cone, treatMat("#3f9a3c", 0.7));
        l.position.set(-0.36, 0, (i - 1) * 0.05);
        l.scale.set(0.04, 0.22, 0.04);
        l.rotation.z = Math.PI / 2 + (i - 1) * 0.4;
        g.add(l);
      }
      g.userData.rest = 0.16;
    } else {
      const c = new THREE.Mesh(G.cap, treatMat("#ffd54a", 0.35));
      c.rotation.z = Math.PI / 2;
      const l = new THREE.Mesh(G.sph, treatMat("#7fc95a", 0.7));
      l.position.set(-0.12, 0.02, 0);
      l.scale.set(0.2, 0.12, 0.16);
      g.add(c, l);
      g.userData.rest = 0.14;
    }
    return g;
  };
  /** 땅 위 점을 풀밭 안으로 (풀밭 가운데 쪽으로 당김) */
  W3.toGrass = function (x, z) {
    const probe = { w: 0.6 * this.sk, h: 0.3, fly: false };
    if (this.inside(probe, x, z)) return [x, z];
    const c = this.bc.ground((this.bc.vis.u0 + this.bc.vis.u1) / 2, Math.min(this.bc.vis.v1 - 0.12, 0.8)) || [0, -6];
    for (let i = 1; i <= 20; i++) {
      const k = i / 20, px = x + (c[0] - x) * k, pz = z + (c[1] - z) * k;
      if (this.inside(probe, px, pz)) return [px, pz];
    }
    return this.bc.pick(probe);
  };
  W3.dropTreat = function (x, z) {
    const p = this.toGrass(x, z);
    if (!p) return;
    [x, z] = p;
    const obj = this.makeTreat(), k = 0.75 * this.sk;
    obj.scale.setScalar(k);
    obj.position.set(x, 4, z);
    obj.rotation.y = Math.random() * 6;
    this.scene.add(obj);
    const tr = { x, z, obj, vy: 0, rest: obj.userData.rest * k, bounce: 2, taken: false, k };
    this.treats.push(tr);
    KP.audio.sfx("drop");
    const land = this.animals.filter((a) => !a.fly && !a.swim && !a.treat && !a.isNew);
    land.sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z));
    const a = land[0];
    if (a) {
      // 간식 바로 옆에서 멈춤 (입이 간식에 닿게: 도안 동물은 옆, 인형은 앞)
      const side = a.type === "clay" ? (a.x < x ? -1 : 1) : 0;
      tr.ax = x + side * a.w * 0.55;
      tr.az = z + (side ? 0 : 0.35 * a.h);
      if (!this.inside(a, tr.ax, tr.az)) (tr.ax = x), (tr.az = z);
      a.treat = tr;
      a.gather = false;
      a.state = "idle";
      a.wait = 0;
    } else this.ctx.after(4000, () => this.removeTreat(tr));
  };
  W3.tickTreats = function (dt) {
    for (const t of this.treats) {
      if (t.vy !== undefined) {
        t.vy -= 22 * dt;
        t.obj.position.y += t.vy * dt;
        if (t.obj.position.y < t.rest) {
          t.obj.position.y = t.rest;
          t.vy = t.bounce > 0 ? -t.vy * 0.35 : 0;
          t.bounce--;
          if (t.bounce < 0) delete t.vy;
        }
      }
      if (t.eating !== undefined) {
        t.eating -= dt;
        t.obj.scale.setScalar(Math.max(0.01, (t.eating / 0.3) * t.k));
        if (t.eating <= 0) {
          this.scene.remove(t.obj);
          t.gone = true;
        }
      }
    }
    if (this.treats.some((t) => t.gone)) this.treats = this.treats.filter((t) => !t.gone);
  };
  W3.removeTreat = function (tr) {
    if (!tr || tr.gone || tr.eating !== undefined) return;
    tr.taken = true;
    tr.eating = 0.3;
  };
  W3.eat = function (a) {
    const tr = a.treat;
    a.treat = null;
    if (!tr || tr.taken) return;
    if (a.type === "clay" && Math.abs(tr.x - a.x) > 0.05) {
      const f = tr.x > a.x ? 1 : -1;
      if (f !== a.face) (a.face = f), (a.turn = 1);
    }
    this.removeTreat(tr);
    this.cheer(a);
    this.hearts(a, 3);
    KP.audio.sfx("bubble");
    KP.voice.say(U.pick(["냠냠! 맛있다!", "고마워요!", "냠냠냠!"]));
  };
  W3.treatTime = function () {
    for (let i = 0; i < 3; i++)
      this.ctx.after(i * 250, () => {
        if (this.dead || !this.bc) return;
        const g = this.bc.pick({ w: 0.6 * this.sk, h: 0.3 });
        if (g) this.dropTreat(g[0], g[1]);
      });
  };
  /** 📣 모두 모여라: 땅 친구는 앞쪽에 줄지어, 하늘 친구는 그 위로 */
  W3.callAll = function () {
    const bc = this.bc;
    if (!bc) return;
    this.treats.forEach((t) => this.removeTreat(t));
    const land = this.animals.filter((a) => !a.fly && !a.swim);
    land.forEach((a) => (a.treat = null));
    const uc = (bc.vis.u0 + bc.vis.u1) / 2;
    const rows = [];
    let left = land.slice().sort((p, q) => q.w - p.w);
    for (let r = 0; r < 6 && left.length; r++) {
      const v = Math.min(bc.vis.v1 - 0.08, 0.92) - r * 0.12 * (this.sk || 1);
      const c = bc.ground(uc, v);
      if (!c) break;
      // 이 줄에서 풀밭 안인 왼쪽·오른쪽 끝
      const probe = { w: 0.5, h: 0.3 };
      let x0 = c[0], x1 = c[0];
      for (let i = 0; i < 60 && this.inside(probe, x0 - 0.15, c[1]); i++) x0 -= 0.15;
      for (let i = 0; i < 60 && this.inside(probe, x1 + 0.15, c[1]); i++) x1 += 0.15;
      if (x1 - x0 < 0.5) continue;
      const row = [];
      let wsum = 0;
      for (const a of left) {
        if (wsum + a.w * 1.1 > x1 - x0 && row.length) break;
        row.push(a);
        wsum += a.w * 1.1;
      }
      left = left.slice(row.length);
      let x = (x0 + x1) / 2 - wsum / 2;
      for (const a of row) {
        const ax = x + a.w * 0.55;
        x += a.w * 1.1;
        let g = [ax, c[1]];
        if (!this.inside(a, g[0], g[1])) g = this.toGrass(g[0], g[1]) || g;
        a.tx = g[0];
        a.tz = g[1];
      }
      rows.push(row);
    }
    for (const a of land) {
      if (left.includes(a)) {
        const g = this.pickFor(a);
        if (g) (a.tx = g[0]), (a.tz = g[1]);
      }
      a.state = "walk";
      a.walkT = 12;
      a.gather = true;
      a.hopT = a.hopper ? 99 : 0;
      if (a.type === "clay") {
        const f = a.tx > a.x ? 1 : -1;
        if (f !== a.face) (a.face = f), (a.turn = 1);
      }
    }
    for (const a of this.animals)
      if (a.fly) {
        const g = bc.ground(uc + (Math.random() - 0.5) * 0.2, Math.min(bc.vis.v1 - 0.25, 0.7));
        if (g) (a.tx = g[0]), (a.tz = g[1]);
        a.ty = 1.2 + Math.random() * 0.5;
        a.state = "walk";
        a.gather = true;
        a.wait = 4;
      }
  };
  /** 다 같이 폴짝 (모여라 끝·간식 먹기) */
  W3.cheer = function (a) {
    if (a.type === "doll") {
      a.sqv = 7;
      a.happy = 1;
      a.hop = 0.0001;
    } else a.react = 0;
  };

  /* ---------- 화면 좌표 ---------- */
  const v3 = { x: 0, y: 0, z: 0 };
  W3.project = function (x, y, z) {
    const v = (this._v = this._v || new THREE.Vector3()).set(x, y, z).project(this.camera);
    v3.x = ((v.x + 1) / 2) * this.w;
    v3.y = ((1 - v.y) / 2) * this.h;
    v3.z = v.z;
    return v3;
  };
  W3.toScreen = function (a, up = 1) {
    const p = this.project(a.x, (a.fly ? a.y : 0) + a.h * up, a.z);
    return { x: p.x, y: p.y };
  };
  W3.hearts = function (a, n) {
    const p = this.toScreen(a);
    for (let i = 0; i < n; i++) {
      const h = U.el("div", "zHeart", KP.E(U.pick(["💖", "💕", "⭐"])));
      h.style.left = p.x - 14 + U.randf(-20, 20) + "px";
      h.style.top = p.y - 20 + "px";
      h.style.animationDelay = i * 0.15 + "s";
      this.host.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
  };

  /* ---------- 터치: 동물은 화면에서 넉넉한 네모로 (어린아이 손가락), 빈 땅은 간식 ---------- */
  W3.pick = function (cx, cy) {
    const rc = this.renderer.domElement.getBoundingClientRect(), px = cx - rc.left, py = cy - rc.top;
    let best = null, bz = 9;
    for (const a of this.animals) {
      const y0 = a.fly ? a.y : 0;
      const b = this.project(a.x, y0, a.z), bx = b.x, by = b.y, bzz = b.z;
      const tp = this.project(a.x, y0 + a.h * 1.05, a.z).y;
      const hh = Math.max(40, by - tp), hw = Math.max(34, hh * (a.w / a.h) * 0.55);
      const top = a.swim ? by - hh * 1.3 : tp - 8, bot = a.swim ? by + hh * 0.5 : by + 10;
      if (px > bx - hw && px < bx + hw && py > top && py < bot && bzz < bz) {
        best = a;
        bz = bzz;
      }
    }
    if (best) return { animal: best };
    const ray = (this._ray = this._ray || new THREE.Raycaster());
    ray.setFromCamera(new THREE.Vector2((px / rc.width) * 2 - 1, -(py / rc.height) * 2 + 1), this.camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    if (d.y < -1e-4) {
      const s = -o.y / d.y;
      return { ground: { x: o.x + d.x * s, z: o.z + d.z * s } };
    }
    return {};
  };
  W3.bindInput = function () {
    const el = this.renderer.domElement;
    let start = null, lp = 0;
    el.addEventListener("pointerdown", (e) => {
      KP.audio.unlock();
      if (start) return; // 두 번째 손가락은 무시
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      const hit = this.pick(e.clientX, e.clientY);
      start.animal = hit.animal || null;
      if (hit.animal) {
        this.poke(hit.animal);
        clearTimeout(lp);
        lp = setTimeout(() => start && !start.moved && this.onDelete && this.onDelete(hit.animal), 1200); // 꾹 → 집에서 쉬기 버튼
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) {
        start.moved = true;
        clearTimeout(lp);
      }
    });
    const end = (e) => {
      if (!start || e.pointerId !== start.id) return;
      clearTimeout(lp);
      if (!start.moved && !start.animal && e.type === "pointerup") {
        const hit = this.pick(e.clientX, e.clientY);
        if (hit.ground && this.animals.length) this.dropTreat(hit.ground.x, hit.ground.z);
      }
      start = null;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  };
  W3.poke = function (a) {
    this.cheer(a);
    a.look = 1.8;
    if (a.state === "walk" && !a.treat && !a.gather && !a.isNew && !a.fly && !a.swim) {
      a.state = "idle";
      a.wait = 2;
    }
    const nm = a.t.name;
    KP.voice.say(nm + "! " + a.t.cry + " 내가 색칠한 " + U.josa(nm, "이에요/예요") + "!");
    KP.audio.sfx(U.pick(["boing", "pop", "tap2"]));
    this.hearts(a, 2);
  };
  W3.remove = function (a) {
    this.animals = this.animals.filter((x) => x !== a);
    if (a.treat) this.removeTreat(a.treat);
    // 작아지며 사라짐
    let k = 1;
    const sx = a.root.scale.x, sy = a.root.scale.y, sz = a.root.scale.z;
    const shrink = () => {
      if (this.dead) return;
      k -= 0.08;
      a.root.scale.set(sx * Math.max(0.01, k), sy * Math.max(0.01, k), sz * Math.max(0.01, k));
      a.contact.scale.multiplyScalar(0.92);
      a.cast.scale.multiplyScalar(0.92);
      this.render();
      if (k > 0) requestAnimationFrame(shrink);
      else this.freeAnimal(a);
    };
    shrink();
  };
  W3.resetView = function () {};
})();
