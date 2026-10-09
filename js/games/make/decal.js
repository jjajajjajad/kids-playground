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
      .dcSw.base{--s:clamp(44px,6vh,54px)}
      .dcSw.light{border-color:#e4e8f2}
      .dcSw.sel{transform:scale(1.14);box-shadow:0 0 0 4px var(--ink),0 4px 0 rgba(0,0,0,.14)}
      .dcSw .tag{position:absolute;right:-8px;top:-8px;font-size:20px;line-height:1;pointer-events:none}
      .dcSw::before{content:"";position:absolute;left:18%;top:14%;width:30%;height:20%;border-radius:50%;background:rgba(255,255,255,.55);transform:rotate(-30deg)}
      .dcSep{flex:0 0 auto;width:3px;align-self:stretch;margin:6px 2px;border-radius:3px;background:repeating-linear-gradient(#c9d2e6 0 6px,transparent 6px 11px)}
      .dcEmpty{flex:0 0 auto;display:flex;align-items:center;gap:8px;background:#fff;border-radius:20px;padding:6px 8px 6px 12px;box-shadow:0 5px 0 rgba(47,58,102,.1);font-size:13.5px;line-height:1.25;color:var(--ink2);max-width:290px}
      .dcEmpty .e{font-size:30px;flex:0 0 auto}
      .dcEmpty button{flex:0 0 auto;background:var(--cat);color:#fff;border-radius:16px;padding:8px 10px;font-size:14px;box-shadow:0 4px 0 color-mix(in srgb,var(--cat) 60%,#000);min-height:52px;display:flex;align-items:center;gap:4px}
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
          KP.voice.say(st.folds ? "왼쪽에 물감을 더 올리고 다시 접어 봐요!" : "물감은 왼쪽에 올려요! 오른쪽은 접으면 찍혀요.");
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
      KP.voice.say("반으로 접어요!");
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
      KP.voice.say("살살 펼쳐 볼까요?");
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
      const ok = await ctx.win({ msg, big: ctx.round % 4 === 0 });
      if (!ok) return;
      KP.voice.say(st.fly ? "저장 단추를 눌러 내 작품에 넣어요!" : "나비 만들기를 누르면 몸통이 생겨요! 저장도 할 수 있어요.");
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
      KP.voice.say("나비 완성! 팔랑팔랑 날아요!");
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
      const d = new Date();
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "decal", img, t: Date.now(), date: d.getMonth() + 1 + "월 " + d.getDate() + "일" });
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
      KP.voice.say("내 작품에 저장했어요! 새 종이에 또 해 볼까요?");
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
      Object.assign(st, { blobs: 0, folds: 0, unsaved: false, fly: false });
      here.classList.remove("off");
      bFly.classList.add("hide");
      if (!quiet) {
        A.sfx("whoosh");
        U.replay(paper, "jump");
        KP.voice.say("새 종이예요! 왼쪽에 물감을 콕콕 올려요.");
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
