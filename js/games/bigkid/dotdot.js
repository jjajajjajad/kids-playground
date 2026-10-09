/* 점 잇기 — 숫자 점을 1부터 차례로 이어서 그림 완성!
   1단계: 점 5개(별·집·물고기·보석), 다음에 누를 점이 살짝 커지고 반짝
   2단계: 점 8개(하트·로켓·왕관·반짝별)
   3단계: 점 12개(나비·열대어·로켓·하트·나무)
   - 점을 차례로 콕콕 눌러도 되고, 손가락으로 쭉 그어도 이어짐
   - 다 이으면 색이 채워지고 진짜 그림으로 변신하며 이름을 말해요 */
"use strict";
KP.game({
  id: "dotdot",
  icon: "✏️",
  name: "점 잇기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("dotdot", `
      .ddBoard{background:radial-gradient(circle at 50% 45%,#ffffff,#eef6ff)}
      .board .ddSpot{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;pointer-events:none;left:0;top:0}
    `);
    const board = U.el("div", "board ddBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "ddSpot");
    board.append(cv, spot);
    ctx.body.appendChild(board);
    const cx = cv.getContext("2d");

    const poly = (n, r1, r2, rot = -90, c = [50, 52]) =>
      Array.from({ length: n }, (_, k) => {
        const r = k % 2 ? r2 : r1,
          a = ((rot + (k * 360) / n) * Math.PI) / 180;
        return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
      });
    // 오각별(한 붓 그리기 별): 오각형 꼭짓점을 두 칸씩 건너 잇기
    const pent = poly(5, 46, 46, -90, [50, 54]);
    const star5 = [0, 2, 4, 1, 3].map((k) => pent[k]);
    function heart(n) {
      const dense = [];
      for (let k = 0; k <= 400; k++) {
        const t = (k / 400) * Math.PI * 2;
        dense.push([16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
      }
      let L = 0;
      const acc = [0];
      for (let k = 1; k < dense.length; k++) acc.push((L += Math.hypot(dense[k][0] - dense[k - 1][0], dense[k][1] - dense[k - 1][1])));
      const out = [];
      for (let i = 0; i < n; i++) {
        const want = (L * i) / n;
        let k = acc.findIndex((v) => v >= want);
        out.push([50 + dense[k][0] * 2.7, 46 + dense[k][1] * 2.7]);
      }
      return out;
    }
    ctx.SHAPES = [
      [
        { name: "별", em: "⭐", color: "#ffd23f", pts: star5 },
        { name: "집", em: "🏠", color: "#ff8a65", pts: [[50, 8], [92, 46], [92, 92], [8, 92], [8, 46]] },
        { name: "물고기", em: "🐟", color: "#4fc3f7", pts: [[6, 50], [40, 20], [94, 78], [94, 22], [40, 80]] },
        { name: "보석", em: "💎", color: "#7fdbff", pts: [[28, 16], [72, 16], [94, 40], [50, 94], [6, 40]] },
      ],
      [
        { name: "하트", em: "❤️", color: "#ff5d8f", pts: [[50, 28], [68, 10], [90, 16], [94, 40], [50, 92], [6, 40], [10, 16], [32, 10]] },
        { name: "로켓", em: "🚀", color: "#ff7452", pts: [[50, 4], [68, 28], [68, 62], [86, 90], [50, 78], [14, 90], [32, 62], [32, 28]] },
        { name: "왕관", em: "👑", color: "#ffc531", pts: [[8, 84], [8, 26], [30, 54], [50, 14], [70, 54], [92, 26], [92, 84], [50, 84]] },
        { name: "반짝별", em: "✨", color: "#ffe066", pts: poly(8, 47, 15, -90, [50, 50]) },
      ],
      [
        { name: "나비", em: "🦋", color: "#b388ff", pts: [[50, 30], [80, 6], [94, 42], [62, 52], [84, 82], [58, 92], [50, 66], [42, 92], [16, 82], [38, 52], [6, 42], [20, 6]] },
        { name: "열대어", em: "🐠", color: "#ffa94d", pts: [[6, 50], [20, 28], [42, 18], [62, 24], [76, 42], [94, 22], [90, 50], [94, 78], [76, 58], [62, 76], [42, 82], [20, 72]] },
        { name: "로켓", em: "🚀", color: "#ff7452", pts: [[50, 2], [66, 22], [70, 56], [92, 80], [92, 96], [64, 84], [50, 98], [36, 84], [8, 96], [8, 80], [30, 56], [34, 22]] },
        { name: "하트", em: "💖", color: "#ff5d8f", pts: heart(12) },
        { name: "나무", em: "🌲", color: "#43a047", pts: [[50, 2], [76, 34], [62, 34], [88, 68], [58, 68], [58, 96], [50, 96], [42, 96], [42, 68], [12, 68], [38, 34], [24, 34]] },
      ],
    ];
    KP.loadE(ctx.SHAPES.flat().map((s) => s.em));
    const COUNT = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열하나", "열둘"];

    let W = 0,
      H = 0;
    const st = (ctx.dd = { ready: false });
    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = board.clientWidth;
      H = board.clientHeight;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      if (st.ready) layout();
    }
    ctx.ddFit = fit;
    addEventListener("resize", () => ctx._active && fit());
    function layout() {
      st.dr = U.clamp(Math.min(W, H) * 0.036, 19, 27);
      const m = Math.max(st.dr * 1.5, Math.min(W, H) * 0.05);
      st.S = Math.min(W - 2 * m, H - 2 * m);
      // 길쭉한 화면에서는 남는 방향으로 조금 늘려서 점 사이를 넓게
      st.Sx = Math.min(W - 2 * m, st.S * 1.2);
      st.Sy = Math.min(H - 2 * m, st.S * 1.2);
      st.ox = (W - st.Sx) / 2;
      st.oy = (H - st.Sy) / 2;
      st.hitR = Math.max(st.dr * 1.9, 38);
    }
    const X = (p) => st.ox + (p[0] / 100) * st.Sx,
      Y = (p) => st.oy + (p[1] / 100) * st.Sy;

    function draw(now) {
      if (!W || !st.ready) return;
      const t = now / 1000;
      const pts = st.shape.pts,
        N = pts.length;
      cx.clearRect(0, 0, W, H);
      cx.lineCap = "round";
      cx.lineJoin = "round";
      // 완성: 색 채우기 → 그림으로 변신
      let fillA = 0,
        emA = 0;
      if (st.done) {
        const e = (now - st.doneAt) / 1000;
        fillA = U.clamp(e / 0.6, 0, 1);
        emA = U.clamp((e - 0.8) / 0.7, 0, 1);
      }
      if (fillA > 0) {
        cx.beginPath();
        pts.forEach((p, k) => (k ? cx.lineTo(X(p), Y(p)) : cx.moveTo(X(p), Y(p))));
        cx.closePath();
        cx.globalAlpha = fillA * (1 - emA * 0.75);
        cx.fillStyle = st.shape.color;
        cx.fill("nonzero");
        cx.globalAlpha = 1;
      }
      // 이은 선
      const lw = Math.max(6, st.dr * 0.42);
      if (st.next > 1) {
        cx.beginPath();
        cx.moveTo(X(pts[0]), Y(pts[0]));
        for (let k = 1; k < st.next; k++) cx.lineTo(X(pts[k]), Y(pts[k]));
        if (st.closeK > 0) {
          const a = pts[N - 1],
            b = pts[0],
            c = Math.min(1, st.closeK);
          cx.lineTo(X(a) + (X(b) - X(a)) * c, Y(a) + (Y(b) - Y(a)) * c);
        }
        cx.globalAlpha = 1 - emA * 0.8;
        cx.strokeStyle = "#2f3a66";
        cx.lineWidth = lw;
        cx.stroke();
        cx.globalAlpha = 1;
      }
      // 고무줄 선
      if (st.rubber && st.next > 0 && !st.done) {
        const a = pts[st.next - 1];
        cx.beginPath();
        cx.moveTo(X(a), Y(a));
        cx.lineTo(st.rubber.x, st.rubber.y);
        cx.strokeStyle = "rgba(47,58,102,.35)";
        cx.lineWidth = lw * 0.8;
        cx.setLineDash([lw, lw * 1.2]);
        cx.stroke();
        cx.setLineDash([]);
      }
      // 점
      if (emA < 1) {
        cx.globalAlpha = 1 - emA;
        pts.forEach((p, k) => {
          const isNext = k === st.next && !st.done;
          let r = st.dr;
          if (isNext && st.lv === 1) r *= 1.3 + 0.08 * Math.sin(t * 5);
          if (st.pop[k]) {
            st.pop[k] = Math.max(0, st.pop[k] - 0.04);
            r *= 1 + 0.35 * Math.sin(st.pop[k] * Math.PI);
          }
          let dx = 0;
          if (st.shake[k]) {
            st.shake[k] = Math.max(0, st.shake[k] - 0.035);
            dx = Math.sin(st.shake[k] * 30) * 6 * st.shake[k];
          }
          const flash = isNext && st.flashUntil > now;
          if ((isNext && st.lv === 1) || flash) {
            cx.fillStyle = "rgba(255,197,49," + (flash ? 0.55 + 0.3 * Math.sin(t * 10) : 0.35) + ")";
            cx.beginPath();
            cx.arc(X(p) + dx, Y(p), r * (flash ? 1.9 : 1.6), 0, 7);
            cx.fill();
          }
          const done = k < st.next;
          cx.fillStyle = done ? st.shape.color : "#fff";
          cx.strokeStyle = done ? "#2f3a66" : isNext ? "#ff7452" : "#6a76a3";
          cx.lineWidth = 4;
          cx.beginPath();
          cx.arc(X(p) + dx, Y(p), r, 0, 7);
          cx.fill();
          cx.stroke();
          cx.fillStyle = done ? "#2f3a66" : isNext ? "#ff7452" : "#2f3a66";
          cx.font = Math.round(r * (k >= 9 ? 0.95 : 1.15)) + "px Jua, sans-serif";
          cx.textAlign = "center";
          cx.textBaseline = "middle";
          cx.fillText(String(k + 1), X(p) + dx, Y(p) + r * 0.08);
        });
        cx.globalAlpha = 1;
      }
      if (emA > 0) {
        const c = st.center;
        const sz = st.S * 0.72 * (0.6 + 0.4 * emA) * (1 + 0.03 * Math.sin(t * 4));
        cx.globalAlpha = emA;
        KP.drawE(cx, st.shape.em, c.x, c.y, sz);
        cx.globalAlpha = 1;
      }
      if (st.next < N && !st.done) {
        spot.style.left = X(pts[st.next]) + "px";
        spot.style.top = Y(pts[st.next]) + "px";
      }
      if (st.closeK > 0 && st.closeK < 1) st.closeK = Math.min(1, st.closeK + 0.06);
    }

    /* ---------- 손가락 ---------- */
    const P = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    function nearest(q) {
      let best = -1,
        bd = 1e9;
      st.shape.pts.forEach((p, k) => {
        const d = Math.hypot(X(p) - q.x, Y(p) - q.y);
        if (d < bd) {
          bd = d;
          best = k;
        }
      });
      return { k: best, d: bd };
    }
    const nextHit = (q) => st.next < st.shape.pts.length && Math.hypot(X(st.shape.pts[st.next]) - q.x, Y(st.shape.pts[st.next]) - q.y) <= st.hitR;
    let pid = null,
      lastTalk = 0;
    function connect() {
      const k = st.next;
      st.pop[k] = 1;
      st.next++;
      A.note(A.SCALE[Math.min(A.SCALE.length - 1, k)] || "C6", { inst: "marimba", dur: 0.35, vol: 0.28 });
      KP.voice.say(COUNT[k + 1] || String(k + 1));
      st.flashUntil = 0;
      if (st.next >= st.shape.pts.length) finish();
      else setHint();
    }
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.done || pid !== null) return;
      const q = P(e);
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      if (nextHit(q)) {
        connect();
        st.rubber = q;
        return;
      }
      const n = nearest(q);
      if (n.d <= st.hitR && n.k < st.next) {
        // 이미 이은 점: 거기서 끌어서 이어 가기
        st.rubber = q;
        return;
      }
      if (n.d <= st.hitR) {
        st.shake[n.k] = 1;
        A.sfx("boing");
      }
      st.flashUntil = performance.now() + 1800;
      const now = performance.now();
      if (now - lastTalk > 3000) {
        lastTalk = now;
        KP.voice.say(st.next === 0 ? "1번 점부터 시작해요!" : "다음은 " + (st.next + 1) + "번이에요!");
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || st.done) return;
      e.preventDefault();
      const q = P(e);
      if (st.rubber) {
        st.rubber = q;
        if (nextHit(q)) connect();
      }
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      st.rubber = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function setHint() {
      ctx.hint(() => spot, st.next === 0 ? "1번 점부터 차례로 이어 봐요!" : (st.next + 1) + "번 점을 찾아봐요!");
    }
    async function finish() {
      st.rubber = null;
      pid = null;
      st.closeK = 0.01;
      ctx.hint(null);
      await ctx.wait(450);
      if (!ctx._active) return;
      st.done = true;
      st.doneAt = performance.now();
      A.sfx("sparkle");
      await ctx.wait(900);
      if (!ctx._active) return;
      const nm = st.shape.name;
      const last = nm.charCodeAt(nm.length - 1);
      const batchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
      KP.voice.say("우와! " + nm + (batchim ? "이에요!" : "예요!"));
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1500);
      if (!ctx._active) return;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "점 잇기 박사 형아!" : st.shape.em + " " + nm + " 완성!" });
      if (ok) ctx.def.next(ctx);
    }
    ctx.ddBuild = (shape, lv) => {
      st.shape = shape;
      st.lv = lv;
      st.next = 0;
      st.done = false;
      st.closeK = 0;
      st.rubber = null;
      st.flashUntil = 0;
      st.pop = shape.pts.map(() => 0);
      st.shake = shape.pts.map(() => 0);
      const xs = shape.pts.map((p) => p[0]),
        ys = shape.pts.map((p) => p[1]);
      fit();
      st.ready = true;
      layout();
      st.center = { x: X([(Math.min(...xs) + Math.max(...xs)) / 2, 0]), y: Y([0, (Math.min(...ys) + Math.max(...ys)) / 2]) };
      setHint();
    };
    ctx.ddDraw = draw;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.bag = {};
    this.next(ctx);
    ctx.loop((dt, now) => ctx.ddDraw(now));
  },
  next(ctx) {
    const U = KP.u,
      lv = ctx.level;
    if (!ctx.bag[lv] || !ctx.bag[lv].length) ctx.bag[lv] = U.shuffle([...ctx.SHAPES[lv - 1]]);
    const shape = ctx.bag[lv].shift();
    ctx.ddBuild(shape, lv);
    ctx.say("1번부터 " + shape.pts.length + "번까지 차례로 이어요. 무슨 그림이 나올까?");
  },
});
