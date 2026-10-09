/* 숫자 순서 놀이 — 흩어진 숫자 풍선을 1부터 차례로 눌러요. 누를 때마다 도레미가 올라가고 선이 이어져요.
   다 이으면 풍선들이 하늘로 날아가요.
   1단계: 1~5 / 2단계: 1~8 / 3단계: 1~10 */
"use strict";
KP.game({
  id: "dots",
  icon: "1️⃣",
  name: "숫자 순서 놀이",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
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
  /** 숫자 + 조사 ("3이에요", "2예요") */
  nj(ctx, n, pair) {
    const s = ctx.SINO[n];
    return n + KP.u.josa(s, pair).slice(s.length);
  },
  place(W, H, n, B) {
    const U = KP.u;
    const pad = 8;
    for (let tries = 0; tries < 60; tries++) {
      const pts = [];
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        let placed = false;
        for (let k = 0; k < 300; k++) {
          const x = U.randf(B / 2 + pad, W - B / 2 - pad),
            y = U.randf(B * 0.6 + pad, H - B * 0.75 - pad);
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
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const self = this;
    const n = [5, 8, 10][lv - 1];
    ctx.board.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "dtSvg");
    ctx.board.appendChild(svg);
    const W = ctx.board.clientWidth,
      H = ctx.board.clientHeight;
    const B = Math.max(64, Math.min(116, Math.sqrt((W * H) / (n * 4.6))));
    ctx.board.style.setProperty("--b", B + "px");
    const pts = this.place(W, H, n, B);
    const cols = U.shuffle([...ctx.COLORS]);
    let step = 1,
      busy = false;
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
          await ctx.wait(500);
          A.melody(A.SCALE.slice(0, 8).map((x) => [x, 1]), { beat: 0.09, inst: "marimba", vol: 0.2 });
          A.sfx("whoosh");
          balloons.forEach((x, k) => ctx.after(k * 90, () => x.classList.add("away")));
          KP.voice.say("풍선이 날아가요! 와아!");
          await ctx.wait(1500);
          const big = ctx.round % 5 === 0;
          const ok = await ctx.win({ big, msg: big ? "숫자 박사 형아!" : "1부터 " + n + "까지 다 했어요!" });
          if (ok) self.next(ctx);
        } else hint();
      } else {
        ctx.miss(b, "이건 " + self.nj(ctx, v, "이에요/예요") + ". " + self.nj(ctx, step, "을/를") + " 찾아요!");
      }
    };
    const hint = () => ctx.hint(() => balloons[step - 1], self.nj(ctx, step, "을/를") + " 찾아요!");
    hint();
  },
});
