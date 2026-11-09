/* 숫자 순서 놀이 — 흩어진 숫자 풍선을 1부터 차례로 눌러요. 누를 때마다 도레미가 올라가고 선이 이어져요.
   다 이으면 풍선들이 하늘로 날아가요.
   1단계: 1~5 / 2단계: 1~8 / 3단계: 1~10
   풍선 자리: 앞 번호와 너무 멀지 않게, 이은 선이 서로 엇갈리지 않게 고름(선이 지저분해 보이던 판 줄이기)
   그림 점잇기: 2단계 판 셋 중 하나는 하트, 3단계 판 둘 중 하나는 별 모양 자리 — 끝까지 이으면 선이 닫히며 그 그림이 '짠' */
"use strict";
KP.game({
  id: "dots",
  icon: "1️⃣",
  name: "숫자 순서 놀이",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    // 화면 크기가 바뀌면: 진짜 회전(가로↔세로)이나 크게 바뀐 경우만 새 판으로 다시 배치하고,
    // 주소창이 숨겨지거나 나타나는 정도의 작은 변화는 풍선·선 위치만 비율로 옮겨 하던 판을 이어 감
    let rt = null;
    addEventListener("resize", () => {
      if (!ctx._active) return;
      if (rt) ctx.cancel(rt);
      rt = ctx.after(350, () => this.refit(ctx));
    });
    const U = KP.u;
    KP.css("dots", `
      .dtBoard{flex:1;min-height:0;position:relative;margin:0 10px 14px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.2));overflow:hidden}
      .dtSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
      .dtSvg line{stroke:#ff8a3d;stroke-width:8;stroke-linecap:round;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:dtDraw .35s forwards}
      @keyframes dtDraw{to{stroke-dashoffset:0}}
      .dtB{position:absolute;width:var(--b);height:calc(var(--b) * 1.18);margin:calc(var(--b) * -.55) 0 0 calc(var(--b) * -.5);padding:0;display:block;
        animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*60ms)}
      .dtBody{position:absolute;left:0;top:0;width:100%;height:calc(var(--b) * 1.1);border-radius:50% 50% 47% 47% / 55% 55% 45% 45%;background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.75) 0 10%,transparent 26%),var(--c);
        box-shadow:inset -6px -8px 0 rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center;color:#fff;font-size:calc(var(--b) * .5);text-shadow:0 3px 0 rgba(0,0,0,.18);
        animation:dtBob 3s ease-in-out infinite;animation-delay:calc(var(--i) * -.37s)}
      @keyframes dtBob{50%{transform:translateY(-5px) rotate(2deg)}}
      .dtBody::after{content:"";position:absolute;bottom:-7px;left:50%;margin-left:-7px;border:7px solid transparent;border-bottom:9px solid var(--c);transform:rotate(180deg);border-bottom-color:var(--c)}
      .dtB.wrong .dtBody{animation:none}
      .dtB[data-done] .dtBody{box-shadow:inset -6px -8px 0 rgba(0,0,0,.12),0 0 0 6px #fff,0 0 0 11px var(--sun)}
      .dtB.pop{animation:dtPop .4s}
      @keyframes dtPop{40%{transform:scale(1.25)}}
      .dtPic{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--w);margin:calc(var(--w) * -.5) 0 0 calc(var(--w) * -.5);z-index:3;pointer-events:none;animation:popBig .6s cubic-bezier(.2,1.6,.4,1)}
      .dtPic .e{width:100%;height:100%}
      .dtSvg polygon{fill:var(--pf);opacity:0;animation:dtFill .6s .2s forwards}
      @keyframes dtFill{to{opacity:.35}}
      .dtB.away{transition:transform 1.4s cubic-bezier(.5,0,.7,1),opacity 1.4s;transform:translateY(-120vh) rotate(var(--r));opacity:.2}
    `);
    ctx.board = U.el("div", "dtBoard");
    ctx.body.appendChild(ctx.board);
    ctx.COLORS = ["#ff5b6e", "#ff9f1c", "#f5c400", "#3fbf6a", "#2f95f5", "#8a63ee", "#ff7eb9", "#14b8a6", "#ef6c3a", "#5b7cfa"];
    ctx.SINO = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 말할 숫자 + 조사 ("삼이에요", "이예요") — 말로만 쓰므로 숫자도 글자로(자연 음성 조각으로 이어 말하기) */
  nj(ctx, n, pair) {
    return KP.u.josa(ctx.SINO[n], pair);
  },
  /** 선분 ab 와 cd 가 엇갈리나 (끝점 공유는 제외) */
  cross(a, b, c, d) {
    const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  },
  place(W, H, n, B) {
    const U = KP.u;
    const pad = 8;
    const far = Math.hypot(W, H) * 0.45; // 앞 번호와 이만큼 안쪽이면 좋음
    for (let tries = 0; tries < 60; tries++) {
      const pts = [];
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        let placed = false;
        for (let k = 0; k < 300; k++) {
          const x = U.randf(B / 2 + pad, W - B / 2 - pad),
            y = U.randf(B * 0.6 + pad, H - B * 0.75 - pad);
          const prev = pts[i - 1];
          // 처음 200번은 '가깝고 안 엇갈리는' 자리만, 그다음은 겹치지만 않으면
          if (k < 200 && prev) {
            if (U.dist(prev.x, prev.y, x, y) > far) continue;
            const c = { x, y };
            let bad = false;
            for (let j = 0; j + 1 < i - 1 && !bad; j++) bad = this.cross(pts[j], pts[j + 1], prev, c);
            if (bad) continue;
          }
          if (pts.every((p) => U.dist(p.x, p.y, x, y) > B * 1.25)) {
            pts.push({ x, y });
            placed = true;
            break;
          }
        }
        if (!placed) ok = false;
      }
      if (ok) return pts;
      B *= 0.95;
    }
    // 안 되면 격자
    const cols = Math.ceil(Math.sqrt((n * W) / H));
    const rows = Math.ceil(n / cols);
    return U.shuffle([...Array(cols * rows).keys()]).slice(0, n).map((i) => ({ x: ((i % cols) + 0.5) * (W / cols), y: (Math.floor(i / cols) + 0.5) * (H / rows) }));
  },
  /** 그림 점잇기 자리: 하트(8개) · 별(10개, 바깥·안쪽 번갈아) — 시작 꼭짓점은 매번 달라짐 */
  shape(W, H, n, B, kind) {
    const U = KP.u;
    const R = Math.min(W / 2 - B * 0.6 - 8, (H - B * 1.4) / 2 - 8);
    if (R < B * 1.6) return null; // 너무 좁으면 그냥 흩어진 풍선
    const cx = W / 2,
      cy = H / 2 + B * 0.05;
    let pts = [];
    if (kind === "star") {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? R * 0.5 : R,
          a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.96 });
      }
    } else {
      // 하트: 매개변수 곡선에서 8점 (위 가운데 오목한 곳부터 시계 방향)
      const T = [0, 0.98, 1.65, 2.22, Math.PI, 4.07, 4.63, 5.3]; // 둘레를 고르게 나눈 자리
      pts = T.map((t) => {
        const x = 16 * Math.pow(Math.sin(t), 3),
          y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x: cx + (x / 17) * R, y: cy + (y / 17) * R - R * 0.08 };
      });
    }
    const s = U.rand(n);
    return pts.slice(s).concat(pts.slice(0, s));
  },
  refit(ctx) {
    const g = ctx.dt;
    const W = ctx.board.clientWidth,
      H = ctx.board.clientHeight;
    if (!g || !W || !H || !g.W || !g.H) return;
    if (W === g.W && H === g.H) return;
    const rotated = W > H !== g.W > g.H;
    const big = Math.abs(W - g.W) / g.W > 0.2 && Math.abs(H - g.H) / g.H > 0.2;
    if ((rotated || big) && !g.busy()) return this.next(ctx);
    const sx = W / g.W,
      sy = H / g.H;
    g.pts.forEach((p, i) => {
      p.x *= sx;
      p.y *= sy;
      const b = g.balloons[i];
      b.style.left = p.x + "px";
      b.style.top = p.y + "px";
    });
    g.svg.querySelectorAll("line").forEach((l) => {
      ["x1", "x2"].forEach((a) => l.setAttribute(a, +l.getAttribute(a) * sx));
      ["y1", "y2"].forEach((a) => l.setAttribute(a, +l.getAttribute(a) * sy));
      l.style.animation = "none";
      l.style.strokeDashoffset = "0";
    });
    g.W = W;
    g.H = H;
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const self = this;
    const n = [5, 8, 10][lv - 1];
    // 그림 점잇기 판: 2단계 셋 중 하나 하트, 3단계 둘 중 하나 별
    ctx.pn = (ctx.pn || 0) + 1;
    const kind = lv === 2 && ctx.pn % 3 === 0 ? "heart" : lv === 3 && ctx.pn % 2 === 0 ? "star" : null;
    ctx.board.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "dtSvg");
    ctx.board.appendChild(svg);
    const W = ctx.board.clientWidth,
      H = ctx.board.clientHeight;
    let B = Math.max(64, Math.min(116, Math.sqrt((W * H) / (n * 4.6))));
    let pts = kind ? this.shape(W, H, n, B, kind) : null;
    // 그림 판: 이웃 점 사이가 풍선보다 넉넉해야 함 → 모자라면 풍선을 조금 작게(64px 아래로는 안 줄임), 그래도 안 되면 흩어진 판
    if (pts) {
      // 모든 풍선 사이(이웃만이 아니라 별 안쪽 꼭짓점끼리도) 흩어진 판과 같은 간격(1.25배)
      let gap = Infinity;
      pts.forEach((p, i) => pts.forEach((q, j) => j > i && (gap = Math.min(gap, U.dist(p.x, p.y, q.x, q.y)))));
      B = Math.min(B, gap / 1.25);
      if (B < 64) {
        pts = null;
        B = Math.max(64, Math.min(116, Math.sqrt((W * H) / (n * 4.6))));
      }
    }
    const pic = pts ? kind : null;
    ctx.board.style.setProperty("--b", B + "px");
    if (!pts) pts = this.place(W, H, n, B);
    const cols = U.shuffle([...ctx.COLORS]);
    let step = 1,
      busy = false;
    // 화면 글자 그대로 말하기: 숫자는 lookup 이 알아서 읽음 (1단계 "1부터 5까지 차례로 눌러요!"는 자연 음성 클립)
    ctx.say("🎈 1부터 " + n + "까지 차례로 눌러요!");
    const balloons = pts.map((p, i) => {
      const v = i + 1;
      const b = U.el("button", "dtB", '<span class="dtBody">' + v + "</span>");
      b.style.cssText = "left:" + p.x + "px;top:" + p.y + "px;--c:" + cols[i % cols.length] + ";--i:" + i + ";--r:" + U.randf(-20, 20) + "deg";
      b.dataset.seq = v;
      ctx.fast(b, () => tapB(b, v, p));
      ctx.board.appendChild(b);
      return b;
    });
    ctx.dt = { W, H, pts, svg, balloons, busy: () => busy };
    let prev = null;
    const tapB = async (b, v, p) => {
      if (busy || b.dataset.done) return;
      if (v === step) {
        b.dataset.done = "1";
        U.replay(b, "pop");
        A.note(A.SCALE[Math.min(v - 1, A.SCALE.length - 1)], { inst: "bell", dur: 0.6, vol: 0.3 });
        KP.voice.say(String(v));
        if (prev) {
          const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
          l.setAttribute("x1", prev.x);
          l.setAttribute("y1", prev.y);
          l.setAttribute("x2", p.x);
          l.setAttribute("y2", p.y);
          l.style.setProperty("--len", Math.ceil(U.dist(prev.x, prev.y, p.x, p.y)));
          svg.appendChild(l);
        }
        prev = p;
        step++;
        if (step > n) {
          busy = true;
          ctx.score.add();
          ctx.round++;
          if (pic) {
            // 마지막 점 → 첫 점으로 선이 닫히고 안이 살짝 칠해짐 + 그 그림이 가운데에 '짠'
            await ctx.wait(350);
            const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
            l.setAttribute("x1", p.x);
            l.setAttribute("y1", p.y);
            l.setAttribute("x2", pts[0].x);
            l.setAttribute("y2", pts[0].y);
            l.style.setProperty("--len", Math.ceil(U.dist(p.x, p.y, pts[0].x, pts[0].y)));
            svg.appendChild(l);
            const pg = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            pg.setAttribute("points", pts.map((q) => q.x.toFixed(1) + "," + q.y.toFixed(1)).join(" "));
            pg.style.setProperty("--pf", pic === "star" ? "#ffd23f" : "#ff7eb9");
            svg.insertBefore(pg, svg.firstChild);
            await ctx.wait(450);
            const xs = pts.map((q) => q.x),
              ys = pts.map((q) => q.y);
            const pe = U.el("div", "dtPic", KP.E(pic === "star" ? "⭐" : "💖"));
            pe.style.cssText = "--x:" + (Math.min(...xs) + Math.max(...xs)) / 2 + "px;--y:" + (Math.min(...ys) + Math.max(...ys)) / 2 + "px;--w:" + Math.round(B * 1.3) + "px";
            ctx.board.appendChild(pe);
            A.sfx("sparkle");
            await Promise.race([KP.voice.say(pic === "star" ? "우와! 별이 됐어요!" : "와! 하트가 됐어요!"), ctx.wait(2600)]);
          }
          await ctx.wait(500);
          A.melody(A.SCALE.slice(0, 8).map((x) => [x, 1]), { beat: 0.09, inst: "marimba", vol: 0.2 });
          A.sfx("whoosh");
          balloons.forEach((x, k) => ctx.after(k * 90, () => x.classList.add("away")));
          KP.voice.say("풍선이 날아가요! 와아!");
          await ctx.wait(1500);
          const big = ctx.round % 5 === 0;
          // 1단계 "1부터 5까지 다 했어요!"는 클립 있음. 8·10 은 클립이 없어 말은 자연 음성 "차례차례 잘했어요!"로
          const msg = big ? "{부름} 숫자 박사!" : "1부터 " + n + "까지 다 했어요!";
          const ok = await ctx.win({ big, msg, say: big || n === 5 ? undefined : "차례차례 잘했어요!" });
          if (ok) self.next(ctx);
        } else hint();
      } else {
        // "이건 칠! 오를 찾아요!" — 모두 자연 음성 조각 ("이건 칠!", "오를", "찾아요!")
        ctx.miss(b, "이건 " + ctx.SINO[v] + "! " + self.nj(ctx, step, "을/를") + " 찾아요!");
      }
    };
    const hint = () => ctx.hint(() => balloons[step - 1], self.nj(ctx, step, "을/를") + " 찾아요!", { answer: true });
    hint();
  },
});
