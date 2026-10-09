/* 선 따라 그리기 — 점선 길을 손가락으로 따라가요 (깃발 → 도착)
   1단계: 직선·세로선·내리막·지그재그·번개 (길이 넓음)
   2단계: 무지개·물결·동그라미·언덕·S자 곡선
   3단계: 숫자 1~5, 한글 ㄱ ㄴ ㄷ ㅅ (두 획짜리는 획 순서대로)
   - 길에서 너무 벗어나면 선이 그려지지 않고, 이어 갈 곳이 반짝 (벌칙 없음)
   - 끝까지 따라가면 그림이 살아나 길을 따라 달려요 */
"use strict";
KP.game({
  id: "trace",
  icon: "✍️",
  name: "선 따라 그리기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("trace", `
      .trBoard{background:radial-gradient(circle at 50% 40%,#ffffff,#f3f7ff)}
      .board .trSpot{position:absolute;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;pointer-events:none;left:0;top:0}
      .trSvg{position:absolute;width:0;height:0;overflow:hidden;visibility:hidden}
    `);
    const board = U.el("div", "board trBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "trSpot");
    board.append(cv, spot);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "trSvg");
    ctx.body.append(board, svg);
    const cx = cv.getContext("2d");

    // rider: 완성 후 길을 달리는 친구, face: 그림이 보는 방향(왼쪽이면 오른쪽으로 갈 때 뒤집음)
    ctx.SHAPES = [
      [
        { name: "곧은 길", box: [100, 30], d: ["M6 15 L94 15"], rider: "🚗", face: "left", rot: { rider: "🚀", face: "rocket" } },
        { name: "로켓 길", box: [30, 100], d: ["M15 94 L15 6"], rider: "🚀", face: "rocket" },
        { name: "미끄럼틀", box: [100, 70], d: ["M8 8 L92 62"], rider: "🐧", face: null },
        { name: "지그재그 길", box: [100, 50], d: ["M5 42 L27 8 L50 42 L73 8 L95 42"], rider: "🐰", face: null, hop: true, rot: {} },
        { name: "번개 길", box: [60, 100], d: ["M42 5 L14 50 L46 50 L18 95"], rider: "⚡", face: null },
      ],
      [
        { name: "무지개 길", box: [100, 55], d: ["M8 50 A42 42 0 0 1 92 50"], rider: "🐞", face: null },
        { name: "물결 길", box: [100, 40], d: ["M5 20 Q 16.25 -2 27.5 20 T 50 20 T 72.5 20 T 95 20"], rider: "🐟", face: "left", rot: { rider: "🐝", face: null } },
        { name: "동그라미", box: [100, 100], d: ["M50 8 A42 42 0 1 0 50.01 8"], rider: "🐞", face: null },
        { name: "언덕 길", box: [100, 50], d: ["M5 45 Q 27.5 -15 50 45 Q 72.5 -15 95 45"], rider: "🚲", face: "left", rot: { rider: "🐞", face: null } },
        { name: "꼬불꼬불 길", box: [70, 100], d: ["M60 8 C 0 8, 0 50, 35 50 C 70 50, 70 92, 10 92"], rider: "🐝", face: null },
      ],
      [
        { name: "숫자 1", say: "숫자 일", box: [70, 100], d: ["M20 25 L40 8 L40 92"], rider: "⭐", face: null },
        { name: "숫자 2", say: "숫자 이", box: [70, 100], d: ["M12 28 C12 0, 62 0, 60 28 C58 48, 30 64, 10 92 L62 92"], rider: "⭐", face: null },
        { name: "숫자 3", say: "숫자 삼", box: [70, 100], d: ["M12 18 C25 0, 60 2, 58 26 C56 44, 36 47, 32 47 C42 47, 62 52, 60 72 C58 96, 22 98, 10 82"], rider: "⭐", face: null },
        { name: "숫자 4", say: "숫자 사", box: [70, 100], d: ["M46 8 L8 66 L64 66", "M48 40 L48 94"], rider: "⭐", face: null },
        { name: "숫자 5", say: "숫자 오", box: [70, 100], d: ["M18 10 L14 46 C30 34, 62 40, 60 66 C58 94, 22 96, 10 82", "M18 10 L58 10"], rider: "⭐", face: null },
        { name: "ㄱ", say: "기역", box: [80, 100], d: ["M12 18 L66 18 C66 50, 60 72, 44 92"], rider: "⭐", face: null },
        { name: "ㄴ", say: "니은", box: [80, 100], d: ["M16 10 L16 82 L72 82"], rider: "⭐", face: null },
        { name: "ㄷ", say: "디귿", box: [80, 100], d: ["M14 16 L68 16", "M14 16 L14 84 L70 84"], rider: "⭐", face: null },
        { name: "ㅅ", say: "시옷", box: [80, 100], d: ["M42 12 C40 50, 28 74, 8 90", "M42 46 C52 66, 62 80, 74 90"], rider: "⭐", face: null },
      ],
    ];
    KP.loadE(["🚩", "🏁", "✨", "🚗", "🚀", "🐧", "🐰", "⚡", "🐞", "🐟", "🚲", "🐝", "⭐"]);
    const INK = ["#ff5d8f", "#2f95f5", "#ff8a1f", "#2fb466", "#8a63ee"];

    /** SVG 경로 → 단위 좌표 점 목록 (약 1.2단위 간격) */
    function sample(d) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
      const L = p.getTotalLength();
      const n = Math.max(8, Math.ceil(L / 1.2));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const q = p.getPointAtLength((L * k) / n);
        pts.push({ x: q.x, y: q.y });
      }
      p.remove();
      return pts;
    }

    let W = 0,
      H = 0;
    const st = (ctx.tr = { ready: false });
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
    ctx.trFit = fit;
    addEventListener("resize", () => ctx._active && fit());
    function layout() {
      const [bw, bh] = st.shape.box;
      const m = Math.max(44, Math.min(W, H) * 0.09);
      st.u = Math.min((W - 2 * m) / bw, (H - 2 * m) / bh);
      st.ox = (W - bw * st.u) / 2;
      st.oy = (H - bh * st.u) / 2;
      const laneU = [9, 7.5, 6.5][st.lv - 1];
      st.hw = Math.max(24, laneU * st.u);
      st.tolU = (st.hw * 1.25 + 8) / st.u;
    }
    const X = (x) => st.ox + x * st.u,
      Y = (y) => st.oy + y * st.u;

    function polyline(pts, a, b) {
      cx.beginPath();
      cx.moveTo(X(pts[a].x), Y(pts[a].y));
      for (let k = a + 1; k <= b; k++) cx.lineTo(X(pts[k].x), Y(pts[k].y));
    }

    function draw(now) {
      if (!W || !st.ready) return;
      const t = now / 1000;
      cx.clearRect(0, 0, W, H);
      cx.lineCap = "round";
      cx.lineJoin = "round";
      // 길 바탕
      st.strokes.forEach((s, k) => {
        const cur = k === st.cur;
        polyline(s.pts, 0, s.pts.length - 1);
        cx.strokeStyle = k < st.cur || st.done ? "rgba(0,0,0,0)" : cur ? "#e3e9fb" : "#eef1f9";
        cx.lineWidth = st.hw * 2;
        cx.stroke();
        if (k >= st.cur && !st.done) {
          cx.strokeStyle = cur ? "#9aa6d6" : "#c9d0ea";
          cx.lineWidth = Math.max(5, st.hw * 0.22);
          cx.setLineDash([0.1, Math.max(14, st.hw * 0.7)]);
          cx.stroke();
          cx.setLineDash([]);
        }
      });
      // 완성한 획: 깨끗한 색 길
      st.strokes.forEach((s, k) => {
        if (!(k < st.cur || st.done)) return;
        polyline(s.pts, 0, s.pts.length - 1);
        cx.strokeStyle = st.ink;
        cx.lineWidth = st.hw * 1.5;
        cx.stroke();
        cx.strokeStyle = "rgba(255,255,255,.35)";
        cx.lineWidth = st.hw * 0.45;
        cx.stroke();
      });
      // 손가락 자국
      if (!st.done) {
        cx.strokeStyle = st.ink;
        cx.lineWidth = st.hw * 1.05;
        for (const line of st.inks) {
          if (line.length < 2) {
            if (line.length === 1) {
              cx.fillStyle = st.ink;
              cx.beginPath();
              cx.arc(X(line[0].x), Y(line[0].y), st.hw * 0.52, 0, 7);
              cx.fill();
            }
            continue;
          }
          cx.beginPath();
          cx.moveTo(X(line[0].x), Y(line[0].y));
          for (let k = 1; k < line.length; k++) cx.lineTo(X(line[k].x), Y(line[k].y));
          cx.stroke();
        }
      }
      // 깃발 · 도착
      if (!st.done) {
        const s = st.strokes[st.cur];
        const a = s.pts[0],
          b = s.pts[s.pts.length - 1];
        const fs = Math.max(40, st.hw * 1.7);
        const closed = Math.hypot(a.x - b.x, a.y - b.y) < 3;
        if (!closed) KP.drawE(cx, "🏁", X(b.x) + fs * 0.15, Y(b.y) - fs * 0.35, fs);
        // 이어 갈 곳(처음엔 깃발 자리) 반짝
        const f = s.pts[Math.min(s.f, s.pts.length - 1)];
        const pulse = 0.5 + 0.5 * Math.sin(t * 5);
        const strong = st.flashUntil > now;
        cx.beginPath();
        cx.arc(X(f.x), Y(f.y), st.hw * (strong ? 1.2 + 0.35 * pulse : 0.95 + 0.15 * pulse), 0, 7);
        cx.fillStyle = "rgba(255,213,74," + (strong ? 0.22 + 0.2 * pulse : 0.12 + 0.1 * pulse) + ")";
        cx.fill();
        cx.strokeStyle = "rgba(255,170,0," + (strong ? 0.6 + 0.4 * pulse : 0.35 + 0.3 * pulse) + ")";
        cx.lineWidth = Math.max(4, st.hw * 0.22);
        cx.stroke();
        if (strong) KP.drawE(cx, "✨", X(f.x) + st.hw, Y(f.y) - st.hw, st.hw * 1.3 * (0.8 + 0.3 * pulse));
        if (s.f === 0) {
          KP.drawE(cx, "🚩", X(a.x) - fs * 0.12, Y(a.y) - fs * 0.55, fs);
          if (st.strokes.length > 1) {
            cx.fillStyle = "#ff7452";
            cx.font = Math.round(fs * 0.5) + "px Jua, sans-serif";
            cx.textAlign = "center";
            cx.textBaseline = "middle";
            cx.fillText(String(st.cur + 1), X(a.x) - fs * 0.62, Y(a.y) - fs * 0.05);
          }
        }
        spot.style.left = X(f.x) + "px";
        spot.style.top = Y(f.y) + "px";
      }
      // 완성: 길을 따라 달리기
      if (st.done && st.ride) {
        const r = st.ride;
        const k = U.clamp((now - r.t0) / r.dur, 0, 1);
        const idx = Math.min(r.pts.length - 1, Math.floor(k * (r.pts.length - 1)));
        const p = r.pts[idx],
          q = r.pts[Math.min(r.pts.length - 1, idx + 2)],
          o = r.pts[Math.max(0, idx - 2)];
        const dx = q.x - o.x,
          dy = q.y - o.y;
        // 지나간 자리 반짝
        if (Math.random() < 0.5) r.sp.push({ x: p.x, y: p.y, life: 1 });
        r.sp.forEach((s) => (s.life -= 0.02));
        r.sp = r.sp.filter((s) => s.life > 0);
        r.sp.forEach((s) => {
          cx.globalAlpha = s.life;
          KP.drawE(cx, "✨", X(s.x), Y(s.y), st.hw * 0.9 * s.life + 6);
        });
        cx.globalAlpha = 1;
        const size = Math.max(56, st.hw * 2.6);
        const sh = st.shape;
        let hop = sh.hop ? Math.abs(Math.sin(k * Math.PI * 8)) * size * 0.3 : Math.sin(t * 14) * 2;
        cx.save();
        cx.translate(X(p.x), Y(p.y) - size * 0.25 - hop);
        if (sh.face === "rocket") cx.rotate(Math.atan2(dy, dx) + Math.PI / 4);
        else if (sh.face === "left") {
          if (dx > 0) cx.scale(-1, 1);
          cx.rotate(Math.atan2(dy, Math.abs(dx)) * (dx > 0 ? -1 : 1) * 0.6);
        } else if (sh.rider === "⭐") cx.rotate(t * 4);
        KP.drawE(cx, sh.rider, 0, 0, size);
        cx.restore();
      }
    }

    /* ---------- 손가락 ---------- */
    const P = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) * W) / r.width,
        y = ((e.clientY - r.top) * H) / r.height;
      return { x: (x - st.ox) / st.u, y: (y - st.oy) / st.u };
    };
    let pid = null,
      last = null,
      lastTalk = 0,
      inkLine = null;
    function offPath() {
      const now = performance.now();
      st.flashUntil = now + 1600;
      inkLine = null;
      if (now - lastTalk > 4500) {
        lastTalk = now;
        const s = st.strokes[st.cur];
        KP.voice.say(s.f === 0 ? "깃발에서 시작해요!" : U.pick(["반짝이는 곳에서 이어서 그려요!", "길을 따라 가 봐요!"]));
      }
    }
    /** 한 점 처리: 길 위면 true */
    function visit(q) {
      const s = st.strokes[st.cur],
        pts = s.pts,
        n = pts.length;
      const K = Math.ceil(16 / 1.2);
      const tol = st.tolU;
      let on = false;
      const lo = Math.max(0, s.f - 2 * K),
        hi = Math.min(n - 1, s.f + K);
      for (let k = lo; k <= hi; k++) {
        if (Math.hypot(pts[k].x - q.x, pts[k].y - q.y) <= tol) {
          on = true;
          if (k >= s.f) s.cov[k] = 1;
        }
      }
      const before = s.f;
      while (s.f < n && s.cov[s.f]) s.f++;
      if (s.f > before && Math.floor(s.f / 14) > Math.floor(before / 14)) A.note(A.SCALE[Math.min(A.SCALE.length - 1, Math.floor((s.f / n) * 8))], { inst: "marimba", dur: 0.15, vol: 0.12 });
      return on;
    }
    function feed(q) {
      if (!last) last = q;
      const dist = Math.hypot(q.x - last.x, q.y - last.y);
      const steps = Math.max(1, Math.ceil(dist / 1.5));
      for (let i = 1; i <= steps; i++) {
        const p = { x: last.x + ((q.x - last.x) * i) / steps, y: last.y + ((q.y - last.y) * i) / steps };
        if (visit(p)) {
          if (!inkLine) {
            inkLine = [];
            st.inks.push(inkLine);
          }
          const lp = inkLine[inkLine.length - 1];
          if (!lp || Math.hypot(lp.x - p.x, lp.y - p.y) > 0.8) inkLine.push(p);
        } else {
          offPath();
          break;
        }
        const s = st.strokes[st.cur];
        if (s.f >= s.pts.length - 2) {
          strokeDone();
          break;
        }
      }
      last = q;
    }
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.done || pid !== null) return;
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      last = null;
      inkLine = null;
      A.sfx("tap");
      feed(P(e));
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || st.done) return;
      e.preventDefault();
      feed(P(e));
      const now = performance.now();
      if (now - (st.hintAt || 0) > 1000) {
        st.hintAt = now;
        setHint();
      }
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      last = null;
      inkLine = null;
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function strokeDone() {
      pid = null;
      inkLine = null;
      if (st.cur < st.strokes.length - 1) {
        st.cur++;
        st.inks = [];
        A.sfx("good");
        KP.voice.say("좋아요! 이번엔 " + (st.cur + 1) + "번 깃발에서 시작!");
        setHint();
        return;
      }
      finish();
    }
    async function finish() {
      st.done = true;
      ctx.hint(null);
      A.sfx("sparkle");
      const sh = st.shape;
      KP.voice.say(sh.say ? sh.say + "! 멋지게 그렸어요!" : "끝까지 왔어요! 우와, 달려간다!");
      const pts = st.strokes.flatMap((s) => s.pts);
      st.ride = { pts, t0: performance.now() + 200, dur: 2300, sp: [] };
      ctx.score.add();
      ctx.round++;
      await ctx.wait(2700);
      if (!ctx._active) return;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "그리기 대장 형아!" : sh.say ? sh.name + " 완성!" : "잘 따라 그렸어요!" });
      if (ok) ctx.def.next(ctx);
    }
    function setHint() {
      ctx.hint(() => spot, st.strokes[st.cur].f === 0 ? "깃발에서 시작해서 점선을 따라 그려요!" : "반짝이는 곳부터 이어서 그려요!");
    }

    ctx.trBuild = (shape, lv) => {
      st.ready = false;
      fit();
      // 세로로 긴 화면에서 가로로 긴 모양은 세워서(아래 → 위) 크게
      const [bw, bh] = shape.box;
      const turn = shape.rot && H > W * 1.2 && bw > bh * 1.4;
      if (turn) shape = Object.assign({}, shape, { box: [bh, bw] }, shape.rot);
      st.shape = shape;
      st.lv = lv;
      st.strokes = shape.d.map((d) => {
        let pts = sample(d);
        if (turn) pts = pts.map((p) => ({ x: p.y, y: bw - p.x }));
        return { pts, cov: new Array(pts.length).fill(0), f: 0 };
      });
      st.cur = 0;
      st.inks = [];
      st.done = false;
      st.ride = null;
      st.flashUntil = 0;
      st.ink = U.pick(INK);
      fit();
      st.ready = true;
      layout();
      setHint();
    };
    ctx.trDraw = draw;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.bag = {};
    this.next(ctx);
    ctx.loop((dt, now) => ctx.trDraw(now));
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    // 같은 단계 안에서는 모양이 골고루 나오도록 주머니에서 뽑기
    if (!ctx.bag[lv] || !ctx.bag[lv].length) ctx.bag[lv] = lv === 3 ? [...ctx.SHAPES[2]] : U.shuffle([...ctx.SHAPES[lv - 1]]);
    const shape = ctx.bag[lv].shift();
    ctx.trBuild(shape, lv);
    if (shape.say) {
      ctx.say("🚩 깃발에서 시작해서 " + shape.name + " 따라 그려요!", false);
      ctx.tell("깃발에서 시작해서 " + U.josa(shape.say, "을/를") + " 따라 그려요!");
    } else ctx.say("🚩 깃발에서 시작해서 " + U.josa(shape.name, "을/를") + " 따라 그려요!");
  },
});
