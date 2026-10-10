/* =====================================================================
   쓰기 공책 엔진 — 한글·ABC·숫자 쓰기 공책이 함께 쓰는 틀 (학습지식 따라 쓰기)
   KP.notebook({
     id, name, icon, cat,
     key: "저장 키",            // 별 기록
     paper: "han" | "abc" | "num", // 칸 모양 (십자 칸 / 영어 4줄)
     book: () => [{id, name, items:[...]}],
     partStrokes: (part) => 획,   // 낱말 쓰기에서 한 칸(글자)의 획
     partSmall: bool,            // 낱말 칸 획이 작은지(한글 글자 = 자음+모음이 한 칸에)
     firstHint: "처음 안내",
   })
   항목: {id, kind:"line"|"jamo"|"word", label, ch, say(한국어로 읽기), en(영어로 읽기, 선택),
          color, strokes, word:[낱말, 그림], syl(획이 작은 칸), parts(낱말의 칸들)}
   한 항목 = 공책 한 줄: ① 보고 따라 쓰기(획순 시범·번호·화살표) ② 흐린 글씨 ③ 보고 혼자 쓰기
   펜을 쓰면 손바닥 터치 무시, 필압 굵기, 획 95%+시작·끝점 판정, 별 1~3·도장
   다른 놀이에서 특정 글자로 바로 열기: KP.nbWant = {id, ch}; KP.open(id)
===================================================================== */
"use strict";
(function (KP) {
  KP.notebook = function (cfg) {
    KP.game({
      id: cfg.id,
      icon: cfg.icon,
      name: cfg.name,
      cat: cfg.cat || "study",
      setup(ctx) {
        const U = KP.u;
        const self = this;
        ctx.cfg = cfg;
        ctx.root.classList.add("nb");
        KP.css("notebook", `
          .screen.nb .stage{background:#fffdf6}
          .hwView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
          .hwView.on{display:flex}
          /* 목차 */
          .hwBook{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px clamp(10px,2vw,24px) 26px}
          .hwGo{display:flex;justify-content:center;margin:2px 0 10px}
          .hwSec{margin-bottom:14px}
          .hwSecH{display:flex;align-items:center;gap:10px;font-size:clamp(20px,2.6vw,26px);color:var(--night);margin:4px 2px 8px}
          .hwSecH .n{background:var(--night);color:#fff;border-radius:12px;padding:1px 10px;font-size:.8em}
          .hwSecH small{font-size:.65em;color:var(--ink2)}
          .hwTiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(74px,9.5vw,100px),1fr));gap:10px}
          .hwTile{position:relative;aspect-ratio:1;background:#fff;border-radius:18px;border:3px solid #e8ebf4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 4px 0 #e3e7f2;color:var(--c)}
          .hwTile .ch{font-size:clamp(34px,4.6vw,48px);line-height:1}
          .hwTile .ch .e{font-size:.9em}
          .hwTile.word .ch{font-size:clamp(20px,2.6vw,28px)}
          .hwTile .st{font-size:13px;letter-spacing:1px;color:#d9dce8;line-height:1}
          .hwTile .st b{color:#ffb800;font-weight:400}
          .hwTile.next{border-color:var(--star);animation:glow 1.4s ease-in-out infinite}
          .hwTile:active{transform:translateY(3px)}
          /* 쓰기 페이지 */
          .hwPage{flex:1;min-height:0;display:grid;grid-template-columns:minmax(150px,22%) 1fr minmax(120px,15%);grid-template-rows:minmax(0,1fr) auto;gap:8px 12px;padding:8px 12px 10px}
          .hwModel{grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--c);text-align:center}
          .hwModel .big{font-size:clamp(70px,min(11vw,17vh),140px);line-height:1;background:#fff;border-radius:24px;padding:8px 16px;box-shadow:0 5px 0 #eceff6;min-width:1.3em}
          .hwModel .big .e{font-size:.8em}
          .hwModel .pic{display:flex;flex-direction:column;align-items:center;font-size:clamp(16px,2.2vw,24px);color:var(--ink)}
          .hwModel .pic .e{font-size:clamp(46px,min(6vw,9vh),78px)}
          .hwModel .pic b{color:var(--c);font-weight:400}
          .hwStepName{font-size:clamp(17px,2.2vw,24px);color:var(--night);background:var(--star);border-radius:14px;padding:4px 14px}
          .hwBoard{position:relative;min-width:0;min-height:0}
          .hwBoard canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);touch-action:none}
          .hwBoard canvas.guide{background:#fff;border-radius:6px;box-shadow:0 0 0 3px #f2b8a8,0 8px 0 rgba(47,58,102,.08)}
          .hwSide{grid-row:1/3;grid-column:3;display:flex;flex-direction:column;justify-content:center;gap:12px}
          .hwSide .btn{justify-content:center}
          .hwLine{grid-column:2;display:flex;gap:8px;justify-content:center;align-items:center}
          .hwCell{width:clamp(54px,min(7vw,10vh),76px);aspect-ratio:1;border-radius:6px;background:#fff;box-shadow:0 0 0 2px #f2b8a8;position:relative;display:flex;align-items:center;justify-content:center;font-size:13px;color:#c9cede;overflow:hidden}
          .hwCell canvas{width:100%;height:100%}
          .hwCell.cur{box-shadow:0 0 0 4px var(--star)}
          .hwCell .s{position:absolute;bottom:1px;left:0;right:0;text-align:center;font-size:11px;color:#ffb800;letter-spacing:-1px}
          .hwDone{opacity:.35;pointer-events:none}
          .glowNext{animation:glow 1s ease-in-out infinite}
          @media (max-aspect-ratio:1/1){
            .hwPage{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto auto;padding:6px 8px 8px}
            .hwModel{grid-row:auto;flex-direction:row;gap:14px}
            .hwModel .big{font-size:58px;padding:4px 12px}
            .hwModel .pic{flex-direction:row;gap:6px}.hwModel .pic .e{font-size:44px}
            .hwSide{grid-row:auto;grid-column:auto;flex-direction:row;justify-content:center;flex-wrap:wrap;gap:8px}
            .hwLine{grid-column:auto}
            .hwStepName{font-size:16px}
          }
          /* 도장 */
          .hwStamp{position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(255,253,246,.88);flex-direction:column;gap:14px}
          .hwStamp.on{display:flex}
          .hwSeal{width:clamp(170px,min(26vw,34vh),250px);aspect-ratio:1;border-radius:50%;border:8px solid #e8413a;color:#e8413a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(30px,min(4.6vw,6vh),44px);line-height:1.15;transform:rotate(-12deg);box-shadow:inset 0 0 0 5px #fff,inset 0 0 0 9px #e8413a;background:rgba(255,255,255,.6);animation:seal .5s cubic-bezier(.2,1.5,.4,1)}
          .hwSeal small{font-size:.45em;margin-top:4px}
          @keyframes seal{from{transform:rotate(-12deg) scale(2.4);opacity:0}}
          .hwStars{font-size:clamp(34px,5vw,52px);letter-spacing:6px}
          .hwStars .off{filter:grayscale(1) opacity(.25)}
          .hwRes{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:0 8px}
          @media (max-width:520px){.hwRes .btn.big{font-size:18px;padding:10px 16px}}
        `);
        ctx.book = cfg.book();
        ctx.items = ctx.book.flatMap((s) => s.items);
        ctx.stars = KP.store.get(cfg.key, {});
        if (!ctx.stars || typeof ctx.stars !== "object") ctx.stars = {};

        /* ---- 목차 화면 ---- */
        ctx.vBook = U.el("div", "hwView");
        const book = U.el("div", "hwBook");
        const go = U.el("div", "hwGo");
        ctx.bGo = U.btn(KP.E("✏️") + " 이어서 쓰기", "btn big primary");
        go.appendChild(ctx.bGo);
        book.appendChild(go);
        ctx.tap(ctx.bGo, () => self.openItem(ctx, self.nextIdx(ctx)));
        ctx.tiles = [];
        ctx.book.forEach((s, si) => {
          const box = U.el("section", "hwSec");
          box.appendChild(U.el("div", "hwSecH", '<span class="n">' + (si + 1) + "</span>" + s.name + " <small>" + s.items.length + "개</small>"));
          const grid = U.el("div", "hwTiles");
          s.items.forEach((it) => {
            const t = U.btn('<span class="ch">' + (it.kind === "line" ? KP.E(it.label) : it.label) + '</span><span class="st"></span>', "hwTile" + (it.kind === "word" || String(it.label).length > 2 ? " word" : ""));
            t.style.setProperty("--c", it.color);
            const idx = ctx.items.indexOf(it);
            ctx.tap(t, () => self.openItem(ctx, idx));
            t.dataset.idx = idx;
            grid.appendChild(t);
            ctx.tiles[idx] = t;
          });
          box.appendChild(grid);
          book.appendChild(box);
        });
        ctx.vBook.appendChild(book);

        /* ---- 쓰기 화면 ---- */
        ctx.vPage = U.el("div", "hwView");
        const page = U.el("div", "hwPage");
        ctx.model = U.el("div", "hwModel");
        ctx.board = U.el("div", "hwBoard");
        ctx.gcv = U.el("canvas", "guide");
        ctx.icv = U.el("canvas", "ink");
        ctx.board.append(ctx.gcv, ctx.icv);
        ctx.side = U.el("div", "hwSide");
        ctx.bShow = U.btn(KP.E("👀") + " 다시 보기", "btn");
        ctx.bAgain = U.btn(KP.E("🔄") + " 지우기", "btn");
        ctx.bDone = U.btn(KP.E("👍") + " 다 썼어요", "btn primary");
        ctx.bBook = U.btn(KP.E("📒") + " 목차", "btn");
        ctx.side.append(ctx.bShow, ctx.bAgain, ctx.bDone, ctx.bBook);
        ctx.line = U.el("div", "hwLine");
        page.append(ctx.model, ctx.board, ctx.side, ctx.line);
        ctx.stamp = U.el("div", "hwStamp");
        ctx.vPage.append(page, ctx.stamp);
        ctx.tap(ctx.bShow, () => self.demo(ctx));
        ctx.tap(ctx.bAgain, () => {
          KP.audio.sfx("back");
          self.cellReset(ctx);
        });
        ctx.tap(ctx.bDone, () => self.finishCell(ctx, true));
        ctx.tap(ctx.bBook, () => self.showBook(ctx));

        ctx.body.append(ctx.vBook, ctx.vPage);
        this.setupInk(ctx);
        addEventListener("resize", () => {
          if (ctx._active && ctx.vPage.classList.contains("on") && ctx.cell) {
            self.fit(ctx);
            self.drawGuide(ctx);
            self.redrawInk(ctx);
          }
        });
      },

      start(ctx) {
        const want = KP.nbWant && KP.nbWant.id === cfg.id ? KP.nbWant.ch : null;
        KP.nbWant = null;
        const i = want != null ? ctx.items.findIndex((it) => it.ch === want) : -1;
        if (i >= 0) this.openItem(ctx, i, true);
        else this.showBook(ctx, true);
      },
      stop(ctx) {
        ctx.tok = (ctx.tok || 0) + 1;
      },

      /* ================= 목차 ================= */
      nextIdx(ctx) {
        const i = ctx.items.findIndex((it) => !ctx.stars[it.id]);
        return i < 0 ? 0 : i;
      },
      showBook(ctx, first) {
        ctx.tok = (ctx.tok || 0) + 1;
        ctx.vBook.classList.add("on");
        ctx.vPage.classList.remove("on");
        const nx = this.nextIdx(ctx);
        ctx.items.forEach((it, i) => {
          const t = ctx.tiles[i];
          const n = ctx.stars[it.id] || 0;
          t.querySelector(".st").innerHTML = n ? "<b>" + "★".repeat(n) + "</b>" + "★".repeat(3 - n) : "☆☆☆";
          t.classList.toggle("next", i === nx);
        });
        const done = Object.keys(ctx.stars).length;
        ctx.say("✍️ 쓰기 공책이에요! " + (done ? done + "개 썼어요. 반짝이는 칸부터 써 봐요!" : cfg.firstHint || "첫 칸부터 시작해 볼까요?"));
        if (!first) KP.audio.sfx("open");
        ctx.hint(() => ctx.tiles[nx], "반짝이는 칸을 눌러요!");
        ctx.after(60, () => ctx.tiles[nx] && ctx.tiles[nx].scrollIntoView && ctx.tiles[nx].scrollIntoView({ block: "center", behavior: "smooth" }));
      },

      /* ================= 쓰기 페이지 ================= */
      /** 한 항목을 쓰는 칸 목록 */
      cellsOf(it) {
        if (it.kind === "line") return [{ strokes: it.strokes, mode: "dot", demo: true }, { strokes: it.strokes, mode: "faint" }, { strokes: it.strokes, mode: "faint" }];
        if (it.kind === "word") {
          const sm = !!cfg.partSmall;
          const a = it.parts.map((s) => ({ strokes: cfg.partStrokes(s), mode: "dot", demo: true, syl: sm, ch: s }));
          const b = it.parts.map((s) => ({ strokes: cfg.partStrokes(s), mode: "faint", syl: sm, ch: s }));
          return a.concat(b);
        }
        return [
          { strokes: it.strokes, mode: "dot", demo: true, syl: it.syl, ch: it.ch },
          { strokes: it.strokes, mode: "faint", syl: it.syl, ch: it.ch },
          { strokes: it.strokes, mode: "alone", syl: it.syl, ch: it.ch },
        ];
      },
      openItem(ctx, idx, quiet) {
        const U = KP.u;
        ctx.tok = (ctx.tok || 0) + 1;
        ctx.idx = (idx + ctx.items.length) % ctx.items.length;
        const it = (ctx.it = ctx.items[ctx.idx]);
        ctx.cells = this.cellsOf(it);
        ctx.ci = 0;
        ctx.cellStars = [];
        ctx.vBook.classList.remove("on");
        ctx.vPage.classList.add("on");
        ctx.stamp.classList.remove("on");
        ctx.vPage.style.setProperty("--c", it.color);
        // 공책 줄 칸
        ctx.line.innerHTML = "";
        ctx.cellEls = ctx.cells.map((c, i) => {
          const e = U.el("div", "hwCell", c.ch && it.kind === "word" ? c.ch : String(i + 1));
          ctx.line.appendChild(e);
          return e;
        });
        if (!quiet) KP.audio.sfx("open");
        const intro =
          it.kind === "line" ? it.guide : it.kind === "word" ? U.josa(it.say, "을/를") + " 써 봐요! 한 글자씩!" : U.josa(it.say, "을/를") + " 써 봐요!";
        if (it.en) {
          KP.voice.en(it.en);
          KP.voice.say(intro, { queue: true });
        } else KP.voice.say(intro);
        this.startCell(ctx);
      },
      startCell(ctx) {
        const U = KP.u;
        const it = ctx.it;
        const cell = (ctx.cell = ctx.cells[ctx.ci]);
        ctx.cellEls.forEach((e, i) => e.classList.toggle("cur", i === ctx.ci));
        // 왼쪽 본보기
        const big = it.kind === "line" ? KP.E(it.from) + (it.to !== it.from ? '<span style="font-size:.5em;color:#c9cede">→</span>' + KP.E(it.to) : "") : it.kind === "word" ? cell.ch : it.label;
        const step = it.kind === "line" ? (cell.mode === "dot" ? "① 점선 따라 긋기" : ctx.ci === 1 ? "② 흐린 선 따라 긋기" : "③ 한 번 더!") : cell.mode === "dot" ? "① 보고 따라 쓰기" : cell.mode === "faint" ? "② 흐린 글씨 따라 쓰기" : "③ 보고 혼자 쓰기";
        let pic = "";
        if (it.kind === "line") pic = '<div class="pic"><span>' + it.name + "</span></div>";
        else if (it.word) pic = '<div class="pic">' + KP.E(it.word[1]) + "<span>" + (it.kind === "word" ? it.word[0] : "<b>" + it.word[0][0] + "</b>" + it.word[0].slice(1)) + "</span></div>";
        ctx.model.innerHTML = '<div class="hwStepName">' + step + '</div><div class="big">' + big + "</div>" + pic;
        ctx.bShow.classList.toggle("hwDone", !(cell.mode === "dot"));
        ctx.bDone.classList.remove("glowNext");
        this.fit(ctx);
        this.cellReset(ctx);
        const say = cell.mode === "dot" ? (cell.demo ? "잘 봐요! 이렇게 써요." : "점선을 따라 써요!") : cell.mode === "faint" ? "흐린 글씨를 따라 써요!" : "이번엔 혼자 써 볼까요? 옆의 글자를 보고 써요!";
        ctx.say((it.kind === "line" ? "〰️ " : "✍️ ") + step.replace(/^. /, "") + (it.kind === "word" ? " · " + cell.ch : ""), false);
        ctx.instr = say;
        const stok = ctx.tok;
        if (cell.demo && (ctx.ci === 0 || it.kind === "word")) ctx.after(it.kind === "word" && ctx.ci > 0 ? 200 : 900, () => stok === ctx.tok && ctx.cell === cell && this.demo(ctx));
        else KP.voice.say(say);
        ctx.hint(() => this.startPoint(ctx), cell.mode === "alone" ? "옆의 글자를 보고 써요!" : "노란 동그라미에서 시작해요!");
      },
      fit(ctx) {
        const w = ctx.board.clientWidth,
          h = ctx.board.clientHeight;
        if (!w || !h) return;
        const sz = Math.max(150, Math.min(w - 10, h - 10, 640));
        const d = Math.min(devicePixelRatio || 1, 2);
        [ctx.gcv, ctx.icv].forEach((c) => {
          c.style.width = c.style.height = sz + "px";
          c.width = c.height = Math.round(sz * d);
        });
      },
      /** 획을 잘게 나눈 점 (획 진행 순서대로) */
      points(strokes) {
        const out = [];
        (strokes || []).forEach((s, si) => {
          if (s.o) {
            const [cx, cy, r] = s.o;
            const n = Math.max(10, Math.ceil((2 * Math.PI * r) / 3));
            for (let k = 0; k <= n; k++) {
              const a = -Math.PI / 2 - (k / n) * Math.PI * 2; // 위에서 시작, 시계 반대 방향
              out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, s: si, hit: false });
            }
          } else {
            for (let k = 1; k < s.length; k++) {
              const [x1, y1] = s[k - 1],
                [x2, y2] = s[k];
              const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
              for (let j = k === 1 ? 0 : 1; j <= n; j++) out.push({ x: x1 + ((x2 - x1) * j) / n, y: y1 + ((y2 - y1) * j) / n, s: si, hit: false });
            }
          }
        });
        return out;
      },
      cellReset(ctx) {
        const T = ctx.T;
        const c = ctx.cell;
        T.pts = this.points(c.strokes);
        T.n = (c.strokes || []).length;
        T.sdone = new Array(T.n).fill(false);
        // 획마다 '시작점부터 차례로 따라온 곳'(앞으로)과 '끝에서부터'(거꾸로) 진행 위치
        T.byS = [];
        T.pts.forEach((q) => (T.byS[q.s] = T.byS[q.s] || []).push(q));
        T.fw = T.byS.map(() => -1);
        T.bw = T.byS.map((P) => P.length);
        T.done = false;
        T.ink = [];
        T.segs = [];
        T.pid = null;
        T.last = null;
        T.demoing = false;
        ctx.dtok = (ctx.dtok || 0) + 1;
        T.color = ctx.it.kind === "line" ? ctx.it.color : "#33395e";
        ctx.icv.getContext("2d").clearRect(0, 0, ctx.icv.width, ctx.icv.height);
        this.drawGuide(ctx);
      },
      /** 아래 판: 공책 칸 + 안내 글씨 */
      drawGuide(ctx) {
        const T = ctx.T,
          c = ctx.cell,
          it = ctx.it;
        const cv = ctx.gcv,
          g = cv.getContext("2d");
        const k = cv.width / 100;
        g.clearRect(0, 0, cv.width, cv.height);
        if (cfg.paper === "abc") {
          // 영어 쓰기 4줄: 윗줄 · 가운데 점선 · 밑줄(빨강) · 아랫줄 점선
          const line = (y, col, dash, w) => {
            g.strokeStyle = col;
            g.lineWidth = w * k;
            g.setLineDash(dash ? [2.2 * k, 2 * k] : []);
            g.beginPath();
            g.moveTo(0, y * k);
            g.lineTo(100 * k, y * k);
            g.stroke();
          };
          line(14, "#b9c8e8", false, 0.8);
          line(47, "#b9c8e8", true, 0.8);
          line(82, "#f08c7d", false, 1.1);
          line(96, "#d6deef", true, 0.7);
          g.setLineDash([]);
        } else {
          // 십자 점선 (쓰기 칸)
          g.strokeStyle = "#f6c9bd";
          g.lineWidth = 0.7 * k;
          g.setLineDash([2 * k, 2 * k]);
          g.beginPath();
          g.moveTo(50 * k, 0);
          g.lineTo(50 * k, 100 * k);
          g.moveTo(0, 50 * k);
          g.lineTo(100 * k, 50 * k);
          g.stroke();
          g.setLineDash([]);
        }
        const strokes = c.strokes || [];
        const path = (s) => {
          g.beginPath();
          if (s.o) g.arc(s.o[0] * k, s.o[1] * k, s.o[2] * k, 0, Math.PI * 2);
          else s.forEach(([x, y], j) => (j ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)));
        };
        const lw = (c.syl ? 9 : 13) * k;
        g.lineCap = g.lineJoin = "round";
        const nextS = T.sdone.indexOf(false);
        strokes.forEach((s, si) => {
          if (c.mode === "alone" && !T.done) return;
          const done = T.sdone[si];
          g.strokeStyle = done ? it.color : c.mode === "dot" ? "#e4e7f1" : "#eff1f7";
          g.globalAlpha = done ? 0.28 : 1;
          g.lineWidth = lw;
          path(s);
          g.stroke();
          g.globalAlpha = 1;
          if (c.mode === "dot" && !done) {
            g.strokeStyle = "#9aa3c4";
            g.lineWidth = 1.3 * k;
            g.setLineDash([2.4 * k, 2.6 * k]);
            path(s);
            g.stroke();
            g.setLineDash([]);
          }
        });
        // 방향 화살표 (따라 쓰기 칸)
        if (c.mode === "dot") {
          strokes.forEach((s, si) => {
            if (T.sdone[si]) return;
            const P = T.pts.filter((q) => q.s === si);
            if (P.length < 4) return;
            const a = P[Math.floor(P.length * 0.5)],
              b = P[Math.min(P.length - 1, Math.floor(P.length * 0.5) + 2)];
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            // 획 옆으로 살짝 비켜서 그림
            const off = (c.syl ? 7.5 : 10.5) * k;
            const ox = Math.cos(ang - Math.PI / 2) * off,
              oy = Math.sin(ang - Math.PI / 2) * off;
            const x = a.x * k + ox,
              y = a.y * k + oy,
              L = (c.syl ? 4 : 5.5) * k;
            g.strokeStyle = "#ff7452";
            g.fillStyle = "#ff7452";
            g.lineWidth = 1.2 * k;
            g.beginPath();
            g.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L);
            g.lineTo(x + Math.cos(ang) * L * 0.4, y + Math.sin(ang) * L * 0.4);
            g.stroke();
            g.beginPath();
            g.moveTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L);
            g.lineTo(x + Math.cos(ang + 2.5) * L * 0.6, y + Math.sin(ang + 2.5) * L * 0.6);
            g.lineTo(x + Math.cos(ang - 2.5) * L * 0.6, y + Math.sin(ang - 2.5) * L * 0.6);
            g.closePath();
            g.fill();
          });
        }
        // 시작점 번호 (따라 쓰기: 모든 획 / 흐린 글씨: 다음 획만)
        if (!T.done && c.mode !== "alone") {
          strokes.forEach((s, si) => {
            if (T.sdone[si]) return;
            if (c.mode === "faint" && si !== nextS) return;
            let p = T.pts.find((q) => q.s === si);
            if (!p) return;
            // 앞 획과 시작점이 겹치면(ㄷ·ㄹ·ㅁ·ㅌ) 번호를 이 획 쪽으로 조금 옮겨 둘 다 보이게
            const clash = strokes.some((_, sj) => {
              if (sj >= si) return false;
              const q = T.pts.find((z) => z.s === sj);
              return q && Math.hypot(q.x - p.x, q.y - p.y) < 6;
            });
            if (clash) {
              const mine = T.pts.filter((z) => z.s === si);
              p = mine.find((z) => Math.hypot(z.x - p.x, z.y - p.y) >= (c.syl ? 8 : 11)) || p;
            }
            const r = (c.syl ? 4.2 : 5.6) * k;
            const isNext = si === nextS;
            g.fillStyle = isNext ? "#ffd23f" : "#fff";
            g.strokeStyle = isNext ? "#fff" : "#c3c9dd";
            g.lineWidth = 1.2 * k;
            g.beginPath();
            g.arc(p.x * k, p.y * k, r, 0, Math.PI * 2);
            g.fill();
            g.stroke();
            if (it.kind !== "line" && T.n > 1) {
              g.fillStyle = isNext ? "#1b2550" : "#8b93b3";
              g.font = r * 1.3 + "px Jua, sans-serif";
              g.textAlign = "center";
              g.textBaseline = "middle";
              g.fillText(String(si + 1), p.x * k, p.y * k + 0.06 * r);
            }
          });
        }
        // 선 긋기: 출발·도착 그림
        if (it.kind === "line" && T.pts.length) {
          const P = T.pts;
          const a = P[0],
            z = P[P.length - 1];
          KP.drawE(g, it.from, a.x * k, a.y * k, 14 * k);
          if (it.to !== it.from || Math.hypot(a.x - z.x, a.y - z.y) > 10) KP.drawE(g, it.to, z.x * k, z.y * k, 14 * k);
        }
      },
      startPoint(ctx) {
        const T = ctx.T;
        if (!ctx.vPage.classList.contains("on") || T.done || T.demoing) return null;
        const ni = T.sdone.indexOf(false);
        const p = T.pts.find((q) => q.s === ni);
        if (!p) return null;
        const r = ctx.icv.getBoundingClientRect();
        return { x: r.left + (p.x / 100) * r.width, y: r.top + (p.y / 100) * r.height };
      },

      /* ---- 획순 시범: 연필이 한 획씩 써 보임 ---- */
      demo(ctx) {
        const T = ctx.T;
        const c = ctx.cell;
        if (!c || c.mode !== "dot" || ctx.T.done) return;
        const tok = ctx.tok; // 화면을 떠나면 멈춤
        const dtok = (ctx.dtok = (ctx.dtok || 0) + 1); // 다시 보기를 누르면 이전 시범 멈춤
        const alive = () => tok === ctx.tok && dtok === ctx.dtok && ctx.cell === c;
        T.demoing = true;
        const g = ctx.icv.getContext("2d");
        const k = ctx.icv.width / 100;
        const byS = [];
        T.pts.forEach((p) => (byS[p.s] = byS[p.s] || []).push(p));
        const lw = (c.syl ? 6.5 : 8.5) * k;
        let si = 0,
          j = 0,
          pause = 0;
        const speed = c.syl ? 85 : 75; // 점/초
        KP.voice.say(ctx.it.kind === "line" ? "잘 봐요! 이렇게 그어요." : "잘 봐요! 하나, 둘, 차례대로 써요.");
        const drawUpTo = () => {
          g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
          g.strokeStyle = ctx.it.color;
          g.lineWidth = lw;
          g.lineCap = g.lineJoin = "round";
          for (let s = 0; s <= si && s < byS.length; s++) {
            const P = byS[s];
            const upto = s < si ? P.length : Math.min(P.length, Math.floor(j) + 1);
            if (upto < 1) continue;
            g.beginPath();
            g.moveTo(P[0].x * k, P[0].y * k);
            for (let q = 1; q < upto; q++) g.lineTo(P[q].x * k, P[q].y * k);
            g.stroke();
          }
          const P = byS[Math.min(si, byS.length - 1)];
          if (!P || !P.length) return;
          const tip = P[Math.max(0, Math.min(P.length - 1, Math.floor(j)))];
          KP.drawE(g, "✏️", tip.x * k + 6 * k, tip.y * k - 6 * k, 13 * k);
        };
        KP.audio.note(KP.audio.SCALE[0], { inst: "marimba", dur: 0.2, vol: 0.2 });
        if (!byS.length) return;
        ctx.loop((dt) => {
          if (!alive()) return false;
          if (pause > 0) {
            pause -= dt;
            return;
          }
          j += dt * speed;
          if (j >= byS[si].length - 1) {
            j = byS[si].length - 1;
            drawUpTo();
            si++;
            j = 0;
            pause = c.syl ? 0.22 : 0.35;
            if (si >= byS.length) {
              ctx.after(700, () => {
                if (!alive()) return;
                g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
                T.demoing = false;
                KP.voice.say(ctx.it.kind === "line" ? "이제 따라 그어 봐요! 동그라미에서 시작!" : "이제 따라 써 봐요! 1번 동그라미부터!");
                ctx.hint(() => this.startPoint(ctx), "노란 동그라미에서 시작해요!");
              });
              return false;
            }
            KP.audio.note(KP.audio.SCALE[(si * 2) % 8], { inst: "marimba", dur: 0.2, vol: 0.2 });
            return;
          }
          drawUpTo();
        });
      },

      /* ---- 펜·손가락 입력 ---- */
      setupInk(ctx) {
        const U = KP.u;
        const ink = ctx.icv;
        const g = ink.getContext("2d");
        const T = (ctx.T = { pts: [], pid: null, pen: false, ink: [], segs: [] });
        const pos = (e) => {
          const r = ink.getBoundingClientRect();
          return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, p: e.pressure };
        };
        const width = (p) => (ctx.cell && ctx.cell.syl ? 0.75 : 1) * (T.isPen ? 3.5 + 6 * Math.min(1, p > 0 ? p : 0.5) : 7.5);
        ink.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          KP.audio.unlock();
          if (e.pointerType === "pen") T.pen = true;
          else if (T.pen && e.pointerType === "touch") return; // 펜으로 쓰는 중 손바닥
          if (T.done || T.demoing || T.pid !== null || !ctx.cell) return;
          T.pid = e.pointerId;
          try {
            ink.setPointerCapture(e.pointerId);
          } catch (_) {}
          T.isPen = e.pointerType === "pen";
          T.last = pos(e);
          const w = width(T.last.p);
          T.segs.push([T.last.x, T.last.y, T.last.x, T.last.y, w]);
          const k = ink.width / 100;
          g.fillStyle = T.color;
          g.beginPath();
          g.arc(T.last.x * k, T.last.y * k, (w / 2) * k, 0, Math.PI * 2);
          g.fill();
          T.ink.push({ x: T.last.x, y: T.last.y });
          this.hit(ctx, T.last);
        });
        ink.addEventListener("pointermove", (e) => {
          if (e.pointerId !== T.pid || T.done) return;
          const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
          const list = evs.length ? evs : [e];
          const k = ink.width / 100;
          g.strokeStyle = T.color;
          g.lineCap = g.lineJoin = "round";
          for (const ev of list) {
            const p = pos(ev);
            const d = U.dist(T.last.x, T.last.y, p.x, p.y);
            if (d < 0.25) continue;
            const w = width(p.p);
            g.lineWidth = w * k;
            g.beginPath();
            g.moveTo(T.last.x * k, T.last.y * k);
            g.lineTo(p.x * k, p.y * k);
            g.stroke();
            T.segs.push([T.last.x, T.last.y, p.x, p.y, w]);
            const n = Math.max(1, Math.ceil(d / 2));
            for (let j = 1; j <= n; j++) {
              const q = { x: T.last.x + ((p.x - T.last.x) * j) / n, y: T.last.y + ((p.y - T.last.y) * j) / n };
              T.ink.push(q);
              this.hit(ctx, q);
            }
            if (d > 1.2 && Math.random() < 0.12) KP.audio.sfx("rub");
            T.last = p;
            if (T.done) break;
          }
        });
        const end = (e) => {
          if (e.pointerId !== T.pid) return;
          T.pid = null;
          T.last = null;
          // 혼자 쓰기·흐린 글씨: 어느 정도 썼으면 [다 썼어요] 반짝
          if (!T.done && T.ink.length > 25) ctx.bDone.classList.add("glowNext");
        };
        ink.addEventListener("pointerup", end);
        ink.addEventListener("pointercancel", end);
        ink.addEventListener("lostpointercapture", end);
      },
      redrawInk(ctx) {
        const T = ctx.T;
        const g = ctx.icv.getContext("2d"),
          k = ctx.icv.width / 100;
        g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
        g.strokeStyle = T.color;
        g.lineCap = g.lineJoin = "round";
        T.segs.forEach(([a, b, c, d, w]) => {
          g.lineWidth = w * k;
          g.beginPath();
          g.moveTo(a * k, b * k);
          g.lineTo(c * k + 0.01, d * k);
          g.stroke();
        });
      },
      /** 펜이 지나간 안내 점 표시 → 획을 처음부터 끝까지 차례로(95% 이상) 따라오면 그 획 완성 */
      hit(ctx, p) {
        const T = ctx.T,
          c = ctx.cell;
        if (T.done) return;
        // 판정 범위: 안내 글씨 굵기 정도만 (넓으면 옆으로 지나가도 된 걸로 쳐져서 일찍 넘어감)
        const R = c.syl ? 5.5 : c.mode === "alone" ? 8.5 : 7.5;
        for (const q of T.pts) if (!q.hit && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) q.hit = true;
        let changed = false;
        for (let si = 0; si < T.n; si++) {
          if (T.sdone[si]) continue;
          const mine = T.pts.filter((q) => q.s === si);
          // 획을 한쪽 끝에서 다른 끝까지 끊김 없이 차례로 따라와야 완성
          // (판정 범위만 넓게 보면 동그라미 글자(ㅇ·o·a·0)는 덜 그려도 시작점과 끝점이 붙어 있어 통과되던 문제 방지)
          const P = T.byS[si];
          const near = (q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R;
          while (T.fw[si] + 1 < P.length && near(P[T.fw[si] + 1])) T.fw[si]++;
          while (T.bw[si] - 1 >= 0 && near(P[T.bw[si] - 1])) T.bw[si]--;
          const along = T.fw[si] >= P.length - 1 || T.bw[si] <= 0;
          const full = mine.filter((q) => q.hit).length / mine.length >= 0.95;
          if (along && full) {
            T.sdone[si] = true;
            changed = true;
            if (c.mode !== "alone") KP.audio.note(KP.audio.SCALE[(si * 2) % 8], { inst: "marimba", dur: 0.22, vol: 0.2 });
          }
        }
        if (!changed) return;
        if (c.mode !== "alone") this.drawGuide(ctx);
        if (T.sdone.every(Boolean)) this.finishCell(ctx, false);
      },
      /** 칸 채점: 따라간 정도(coverage) + 선 안에 쓴 정도(accuracy) → 별 1~3 */
      grade(ctx) {
        const T = ctx.T,
          c = ctx.cell;
        const cov = T.pts.length ? T.pts.filter((q) => q.hit).length / T.pts.length : 0;
        const R = c.syl ? 8 : 11;
        let inside = 0;
        for (const p of T.ink) {
          for (const q of T.pts) {
            if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) {
              inside++;
              break;
            }
          }
        }
        const acc = T.ink.length ? inside / T.ink.length : 0;
        const sc = 0.6 * cov + 0.4 * acc;
        return sc >= 0.82 ? 3 : sc >= 0.58 ? 2 : 1;
      },
      finishCell(ctx, byButton) {
        const U = KP.u;
        const T = ctx.T;
        if (T.done || T.demoing || !ctx.cell) return;
        if (byButton) {
          // [다 썼어요]는 막혔을 때 넘어가는 용도 — 덜 썼으면 조금 더 쓰도록 안내
          const cov = T.pts.length ? T.pts.filter((q) => q.hit).length / T.pts.length : 0;
          const need = ctx.cell.mode === "alone" ? 0.6 : 0.75;
          if (T.ink.length < 8 || cov < need) {
            KP.audio.sfx("tap");
            KP.voice.say(T.ink.length < 8 ? "먼저 써 볼까요? 동그라미에서 시작해요!" : "아직 덜 썼어요! 회색 길을 끝까지 따라가요.");
            if (ctx.cell.mode !== "alone") ctx.hint(() => this.startPoint(ctx), "끝까지 따라가요!");
            return;
          }
        }
        T.done = true;
        T.pid = null;
        const st = this.grade(ctx);
        ctx.cellStars[ctx.ci] = st;
        this.drawGuide(ctx);
        // 공책 줄 칸에 작게 남기기
        const cellEl = ctx.cellEls[ctx.ci];
        const mini = document.createElement("canvas");
        mini.width = mini.height = 120;
        const mg = mini.getContext("2d");
        mg.fillStyle = "#fff";
        mg.fillRect(0, 0, 120, 120);
        mg.globalAlpha = 0.5;
        mg.drawImage(ctx.gcv, 0, 0, 120, 120);
        mg.globalAlpha = 1;
        mg.drawImage(ctx.icv, 0, 0, 120, 120);
        cellEl.innerHTML = "";
        cellEl.appendChild(mini);
        cellEl.appendChild(U.el("span", "s", "★".repeat(st)));
        KP.audio.sfx("good");
        KP.voice.say(U.pick(st === 3 ? ["와, 아주 잘 썼어요!", "멋져요!", "최고예요!"] : st === 2 ? ["잘했어요!", "좋아요!"] : ["좋아요! 다음엔 선을 따라가 봐요!", "잘했어요! 점선을 보며 써요!"]));
        ctx.bDone.classList.remove("glowNext");
        const tok = ctx.tok;
        ctx.after(1100, () => {
          if (tok !== ctx.tok) return;
          if (ctx.ci < ctx.cells.length - 1) {
            ctx.ci++;
            this.startCell(ctx);
          } else this.finishItem(ctx);
        });
      },
      finishItem(ctx) {
        const U = KP.u;
        const it = ctx.it;
        const avg = ctx.cellStars.reduce((a, b) => a + b, 0) / ctx.cellStars.length;
        const stars = Math.max(1, Math.min(3, Math.round(avg)));
        const prev = ctx.stars[it.id] || 0;
        ctx.stars[it.id] = Math.max(prev, stars);
        KP.store.set(cfg.key, ctx.stars);
        ctx.cellEls.forEach((e) => e.classList.remove("cur"));
        const word = stars === 3 ? "참 잘했어요" : stars === 2 ? "잘했어요" : "좋아요";
        ctx.stamp.innerHTML = "";
        const seal = U.el("div", "hwSeal", word.replace(" ", "<br>") + "<small>" + (it.kind === "line" ? it.name : it.label) + "</small>");
        const starsEl = U.el("div", "hwStars", [1, 2, 3].map((n) => '<span class="' + (n <= stars ? "" : "off") + '">' + KP.E("⭐") + "</span>").join(""));
        const row = U.el("div", "hwRes");
        const bRe = U.btn(KP.E("🔄") + " 한 번 더", "btn big");
        const bNext = U.btn("다음 " + KP.E("▶️"), "btn big primary");
        const bList = U.btn(KP.E("📒") + " 목차", "btn big");
        row.append(bRe, bNext, bList);
        ctx.stamp.append(seal, starsEl, row);
        ctx.stamp.classList.add("on");
        ctx.tap(bRe, () => this.openItem(ctx, ctx.idx));
        ctx.tap(bNext, () => this.openItem(ctx, ctx.idx + 1));
        ctx.tap(bList, () => this.showBook(ctx));
        KP.audio.sfx("sparkle");
        if (it.en) KP.voice.en(it.en + "!");
        KP.voice.say(word + "! " + (it.kind === "line" ? it.name : it.say) + " 완성!", it.en ? { queue: true } : undefined);
        ctx.hint(() => (ctx.stamp.classList.contains("on") ? bNext : null), "다음 것도 써 볼까요?");
        KP.confetti && KP.confetti(stars === 3 ? 160 : 90);
        // 세 개 완성할 때마다 스티커 한 장
        const n = (KP.store.get("nb:count", 0) || 0) + 1;
        KP.store.set("nb:count", n);
        if (n % 3 === 0 && KP.stickers) {
          const [e, nm] = KP.stickers.award();
          ctx.after(1600, () => KP.toast(e + " " + nm + " 스티커를 받았어요!"));
        }
      },
    });
  };
})(window.KP);
