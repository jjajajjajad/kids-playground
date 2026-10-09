/* 미로 탈출 — 캐릭터를 손가락으로 끌어 길을 따라 목표까지!
   - 미로는 격자 기반 자동 생성(깊이 우선 탐색 → 막다른 길이 있는 완전 미로)
   - 1단계 3×3 / 2단계 4×5 / 3단계 6×7 (가로 화면이면 가로·세로를 바꿔 넓게)
   - 벽에 닿으면 더 못 가고 살짝 튕김(벌칙 없음), 지나온 길에 발자국
   - 판마다 캐릭터와 목표가 바뀜, 한참 멈춰 있으면 갈 길이 반짝 */
"use strict";
KP.game({
  id: "maze",
  icon: "🌀",
  name: "미로 탈출",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("maze", `
      .mzBoard{background:linear-gradient(180deg,#a8e08f,#86cf6d)}
      .board .mzSpot{position:absolute;border-radius:50%;pointer-events:none;left:0;top:0}
    `);
    const board = U.el("div", "board mzBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "mzSpot");
    board.append(cv, spot);
    ctx.body.appendChild(board);
    const cx = cv.getContext("2d");

    ctx.PAIRS = [
      ["🐶", "강아지", "🦴", "뼈다귀"],
      ["🐰", "토끼", "🥕", "당근"],
      ["🐭", "생쥐", "🧀", "치즈"],
      ["🐝", "꿀벌", "🌻", "해바라기"],
      ["🐵", "원숭이", "🍌", "바나나"],
      ["🐧", "펭귄", "🐟", "물고기"],
      ["🐻", "곰", "🍯", "꿀"],
      ["🐿️", "다람쥐", "🌰", "도토리"],
      ["🦖", "공룡", "🥚", "알"],
      ["🐱", "고양이", "🥛", "우유"],
    ];
    KP.loadE(ctx.PAIRS.flatMap((p) => [p[0], p[2]]).concat(["🐾", "✨", "🏠"]));

    const N = 1, E = 2, S = 4, W_ = 8;
    const DIRS = [
      [N, 0, -1, S],
      [E, 1, 0, W_],
      [S, 0, 1, N],
      [W_, -1, 0, E],
    ];
    const M = 0.14; // 벽 두께(칸 비율, 양쪽)
    const R = 0.2; // 캐릭터 충돌 반지름(칸 비율)

    let W = 0,
      H = 0,
      s = 0,
      ox = 0,
      oy = 0,
      layer = null,
      trail = null; // 발자국은 찍을 때 한 번만 그려 두는 판 (매 화면 다시 그리지 않음)
    const st = (ctx.mz = { ready: false });

    /* ---------- 미로 만들기 ---------- */
    function gen(cols, rows) {
      const open = new Array(cols * rows).fill(0);
      const seen = new Array(cols * rows).fill(false);
      const stack = [[U.rand(cols), U.rand(rows)]];
      seen[stack[0][1] * cols + stack[0][0]] = true;
      while (stack.length) {
        const [x, y] = stack[stack.length - 1];
        const nb = DIRS.filter(([, dx, dy]) => {
          const nx = x + dx,
            ny = y + dy;
          return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx];
        });
        if (!nb.length) {
          stack.pop();
          continue;
        }
        const [b, dx, dy, ob] = U.pick(nb);
        const nx = x + dx,
          ny = y + dy;
        open[y * cols + x] |= b;
        open[ny * cols + nx] |= ob;
        seen[ny * cols + nx] = true;
        stack.push([nx, ny]);
      }
      return open;
    }
    /** 칸 a → 칸 b 최단 경로 (칸 번호 배열) */
    function solve(a, b) {
      const { cols, rows, open } = st;
      const prev = new Array(cols * rows).fill(-1);
      const q = [a];
      prev[a] = a;
      while (q.length) {
        const c = q.shift();
        if (c === b) break;
        const x = c % cols,
          y = (c / cols) | 0;
        for (const [bit, dx, dy] of DIRS) {
          if (!(open[c] & bit)) continue;
          const n = (y + dy) * cols + (x + dx);
          if (prev[n] < 0) {
            prev[n] = c;
            q.push(n);
          }
        }
      }
      const out = [];
      for (let c = b; c !== a && c >= 0; c = prev[c]) out.unshift(c);
      out.unshift(a);
      return out;
    }

    /* ---------- 길 판정 ---------- */
    function inPath(px, py) {
      const { cols, rows, open } = st;
      const i = Math.floor(px),
        j = Math.floor(py);
      if (i < 0 || j < 0 || i >= cols || j >= rows) return false;
      const u = px - i,
        v = py - j,
        o = open[j * cols + i];
      const inU = u >= M && u <= 1 - M,
        inV = v >= M && v <= 1 - M;
      if (inU && inV) return true;
      if (inV) return u < M ? !!(o & W_) : !!(o & E);
      if (inU) return v < M ? !!(o & N) : !!(o & S);
      return false;
    }
    const RING = [
      [1, 0], [-1, 0], [0, 1], [0, -1], [0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72],
    ];
    function ok(x, y) {
      if (!inPath(x, y)) return false;
      for (const [a, b] of RING) if (!inPath(x + a * R, y + b * R)) return false;
      return true;
    }
    /** 손가락 쪽으로 조금씩 이동 (벽에서는 미끄러지고, 모퉁이는 살짝 도와줌) */
    function moveToward(tx, ty) {
      const p = st.p;
      let blocked = false;
      const STEP = 0.05;
      for (let k = 0; k < 50; k++) {
        const dx = tx - p.x,
          dy = ty - p.y,
          d = Math.hypot(dx, dy);
        if (d < 0.01) break;
        const L = Math.min(STEP, d);
        if (ok(p.x + (dx / d) * L, p.y + (dy / d) * L)) {
          p.x += (dx / d) * L;
          p.y += (dy / d) * L;
          continue;
        }
        let done = false;
        const axes = Math.abs(dx) >= Math.abs(dy) ? ["x", "y"] : ["y", "x"];
        for (const a of axes) {
          const comp = a === "x" ? dx : dy;
          if (Math.abs(comp) < 0.004) continue;
          const sv = Math.sign(comp) * Math.min(STEP, Math.abs(comp));
          const nx = a === "x" ? p.x + sv : p.x,
            ny = a === "y" ? p.y + sv : p.y;
          if (ok(nx, ny)) {
            p.x = nx;
            p.y = ny;
            done = true;
            break;
          }
          // 모퉁이 도움: 가운데 줄로 살짝 당겨서 꺾을 수 있게
          const c = a === "x" ? Math.floor(p.y) + 0.5 : Math.floor(p.x) + 0.5;
          const cur = a === "x" ? p.y : p.x;
          if (Math.abs(c - cur) > 0.004) {
            const nudge = Math.sign(c - cur) * Math.min(STEP, Math.abs(c - cur));
            const ax2 = a === "x" ? p.x : p.x + nudge,
              ay2 = a === "x" ? p.y + nudge : p.y;
            const fx = a === "x" ? p.x + sv : c,
              fy = a === "x" ? c : p.y + sv;
            if (ok(ax2, ay2) && ok(fx, fy)) {
              p.x = ax2;
              p.y = ay2;
              done = true;
              break;
            }
          }
        }
        if (!done) {
          blocked = true;
          break;
        }
      }
      return blocked;
    }

    /* ---------- 그리기 ---------- */
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
    ctx.mzFit = fit;
    addEventListener("resize", () => ctx._active && fit());

    function layout() {
      const pad = Math.max(14, Math.min(W, H) * 0.03);
      s = Math.min((W - pad * 2) / st.cols, (H - pad * 2) / st.rows);
      ox = (W - s * st.cols) / 2;
      oy = (H - s * st.rows) / 2;
      st.s = s;
      st.ox = ox;
      st.oy = oy;
      spot.style.width = spot.style.height = s * 0.8 + "px";
      spot.style.margin = -s * 0.4 + "px 0 0 " + -s * 0.4 + "px";
      // 고정된 미로 그림은 한 번만 그려 둔다
      const d = Math.min(devicePixelRatio || 1, 2);
      layer = document.createElement("canvas");
      layer.width = W * d;
      layer.height = H * d;
      const g = layer.getContext("2d");
      g.setTransform(d, 0, 0, d, 0, 0);
      const { cols, rows, open } = st;
      // 울타리(덤불)
      const fr = s * 0.22;
      g.fillStyle = "#3f8f3a";
      rr(g, ox - fr * 0.6, oy - fr * 0.6, s * cols + fr * 1.2, s * rows + fr * 1.2, fr * 1.4);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.08)";
      for (let k = 0; k < cols * rows * 6; k++) {
        g.beginPath();
        g.arc(ox + Math.random() * s * cols, oy + Math.random() * s * rows, s * (0.06 + Math.random() * 0.08), 0, 7);
        g.fill();
      }
      // 길: 칸 가운데끼리 굵은 선으로 이어 부드러운 길 모양
      const w = s * (1 - 2 * M);
      const segs = new Path2D();
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const x = ox + (i + 0.5) * s,
            y = oy + (j + 0.5) * s,
            o = open[j * cols + i];
          segs.moveTo(x, y);
          segs.lineTo(x + 0.01, y);
          if (o & E) {
            segs.moveTo(x, y);
            segs.lineTo(x + s, y);
          }
          if (o & S) {
            segs.moveTo(x, y);
            segs.lineTo(x, y + s);
          }
        }
      g.lineCap = "round";
      g.lineJoin = "round";
      g.strokeStyle = "#d9b77a";
      g.lineWidth = w + Math.max(4, s * 0.05);
      g.stroke(segs);
      g.strokeStyle = "#fff1c9";
      g.lineWidth = w;
      g.stroke(segs);
      // 발자국 판 새로 만들고 지금까지의 발자국 다시 찍기
      trail = document.createElement("canvas");
      trail.width = W * d;
      trail.height = H * d;
      trail.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
      (st.steps || []).forEach(stamp);
      // 길 위 작은 점무늬
      g.fillStyle = "rgba(214,170,100,.25)";
      for (let k = 0; k < cols * rows * 3; k++) {
        const c = U.rand(cols * rows);
        g.beginPath();
        g.arc(ox + ((c % cols) + 0.25 + Math.random() * 0.5) * s, oy + (((c / cols) | 0) + 0.25 + Math.random() * 0.5) * s, s * 0.025, 0, 7);
        g.fill();
      }
    }
    function rr(g, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    const px = (u) => ox + u * s,
      py = (v) => oy + v * s;
    function stamp(f) {
      if (!trail) return;
      const g = trail.getContext("2d");
      g.globalAlpha = 0.42;
      KP.drawE(g, "🐾", px(f.x), py(f.y), s * 0.26, f.a + Math.PI / 2);
      g.globalAlpha = 1;
    }
    ctx.mzClearTrail = () => trail && trail.getContext("2d").clearRect(0, 0, W, H);

    function draw(now) {
      if (!W || !st.ready) return;
      cx.clearRect(0, 0, W, H);
      if (layer) cx.drawImage(layer, 0, 0, W, H);
      const t = now / 1000;
      // 길 안내 반짝이
      if (st.glowUntil > now && st.glowPath) {
        st.glowPath.forEach((c, k) => {
          const x = (c % st.cols) + 0.5,
            y = ((c / st.cols) | 0) + 0.5;
          const a = 0.5 + 0.5 * Math.sin(t * 6 - k * 0.9);
          cx.globalAlpha = 0.35 + 0.6 * a;
          KP.drawE(cx, "✨", px(x), py(y), s * (0.32 + 0.12 * a));
        });
        cx.globalAlpha = 1;
      }
      // 발자국
      if (trail) cx.drawImage(trail, 0, 0, W, H);
      // 목표
      const g = st.goal,
        gb = st.won ? 1.25 + 0.1 * Math.sin(t * 10) : 1 + 0.06 * Math.sin(t * 3);
      cx.save();
      cx.fillStyle = "rgba(255,213,74,.45)";
      cx.beginPath();
      cx.arc(px(g.x), py(g.y), s * 0.36 * gb, 0, 7);
      cx.fill();
      cx.restore();
      KP.drawE(cx, st.pair[2], px(g.x), py(g.y) + Math.sin(t * 3) * s * 0.03, s * 0.6 * gb);
      // 캐릭터 (튕김 효과)
      let bx = 0,
        by = 0;
      if (st.bump > 0) {
        const k = Math.sin(st.bump * Math.PI) * s * 0.09;
        bx = -st.bumpDir.x * k;
        by = -st.bumpDir.y * k;
      }
      const p = st.p;
      const lift = st.dragging ? 1.12 : 1;
      const hop = st.won ? Math.abs(Math.sin(t * 9)) * s * 0.14 : 0;
      cx.fillStyle = "rgba(0,0,0,.13)";
      cx.beginPath();
      cx.ellipse(px(p.x) + bx, py(p.y) + s * 0.3, s * 0.26, s * 0.08, 0, 0, 7);
      cx.fill();
      KP.drawE(cx, st.pair[0], px(p.x) + bx, py(p.y) + by - hop - (lift - 1) * s * 0.4, s * 0.74 * lift);
      // 힌트용 투명 점: 위치가 바뀔 때만 옮김
      const sl = Math.round(px(p.x)), stp = Math.round(py(p.y));
      if (sl !== st._sl || stp !== st._st) {
        st._sl = sl;
        st._st = stp;
        spot.style.transform = "translate(" + sl + "px," + stp + "px)";
      }
    }

    /* ---------- 손가락 ---------- */
    const toCell = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) * W) / r.width,
        y = ((e.clientY - r.top) * H) / r.height;
      return { x: (x - ox) / s, y: (y - oy) / s };
    };
    let pid = null,
      off = { x: 0, y: 0 },
      lastBump = 0,
      lastWallTalk = 0,
      lastGrabTalk = 0,
      lastHintReset = 0;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.won || pid !== null) return;
      const q = toCell(e);
      const d = Math.hypot(q.x - st.p.x, q.y - st.p.y);
      if (d > 0.95) {
        st.bump = 1;
        st.bumpDir = { x: 0, y: 1 };
        A.sfx("tap");
        if (performance.now() - lastGrabTalk > 4000) {
          lastGrabTalk = performance.now();
          ctx.tell(U.josa(st.pair[1], "을/를") + " 손가락으로 꾹 잡고 끌어요!");
        }
        return;
      }
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      off = { x: st.p.x - q.x, y: st.p.y - q.y };
      st.dragging = true;
      A.sfx("pick");
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || st.won) return;
      e.preventDefault();
      const q = toCell(e);
      const tx = q.x + off.x,
        ty = q.y + off.y;
      const bx = st.p.x,
        by = st.p.y;
      const blocked = moveToward(tx, ty);
      const moved = Math.hypot(st.p.x - bx, st.p.y - by);
      if (moved > 0) {
        st.lastMove = performance.now();
        st.glowUntil = 0;
        const lf = st.steps[st.steps.length - 1] || st.lastFoot;
        if (Math.hypot(st.p.x - lf.x, st.p.y - lf.y) > 0.34) {
          const a = Math.atan2(st.p.y - lf.y, st.p.x - lf.x);
          const f = { x: lf.x + Math.cos(a) * 0.34, y: lf.y + Math.sin(a) * 0.34, a };
          st.steps.push(f);
          if (st.steps.length > 400) st.steps.shift();
          stamp(f);
          if (st.steps.length % 2) A.note(U.pick(["C6", "E6", "G6"]), { inst: "marimba", dur: 0.08, vol: 0.05 });
        }
      }
      const now = performance.now();
      if (now - lastHintReset > 1000) {
        lastHintReset = now;
        setHint();
      }
      if (blocked && Math.hypot(tx - st.p.x, ty - st.p.y) > 0.45 && now - lastBump > 650) {
        lastBump = now;
        const d = Math.hypot(tx - st.p.x, ty - st.p.y) || 1;
        st.bump = 1;
        st.bumpDir = { x: (tx - st.p.x) / d, y: (ty - st.p.y) / d };
        A.sfx("boing");
        if (now - lastWallTalk > 7000) {
          lastWallTalk = now;
          ctx.tell(U.pick(["앗, 벽이에요! 다른 길로 가 봐요.", "콩! 여기는 막혔어요.", "벽이네! 길을 찾아봐요."]));
        }
      }
      if (Math.hypot(st.p.x - st.goal.x, st.p.y - st.goal.y) < 0.32) arrive();
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      st.dragging = false;
      if (!st.won) A.sfx("drop");
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function setHint() {
      ctx.hint(() => spot, U.josa(st.pair[1], "을/를") + " 끌어서 " + st.pair[3] + "까지" + " 데려다 줘요!");
    }
    ctx.mzSetHint = setHint;

    const arrive = async () => {
      if (st.won) return;
      st.won = true;
      st.dragging = false;
      pid = null;
      A.sfx("sparkle");
      KP.voice.say(st.pair[3] + "! 찾았다!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(900);
      if (!ctx._active) return;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "미로 대장 형아!" : "미로 탈출 성공!" });
      if (ok) ctx.def.next(ctx);
    };

    ctx.mzDraw = draw;
    ctx.mzTick = (dt, now) => {
      if (st.bump > 0) st.bump = Math.max(0, st.bump - dt * 4);
      // 오래 멈춰 있으면 갈 길을 반짝
      if (st.ready && !st.won && !st.dragging && now - st.lastMove > 10000 && !(st.glowUntil > now)) {
        const here = Math.floor(st.p.y) * st.cols + Math.floor(st.p.x);
        st.glowPath = solve(here, st.goalCell).slice(1, 5);
        st.glowUntil = now + 3000;
        st.lastMove = now;
      }
      draw(now);
    };
    ctx.mzGen = gen;
    ctx.mzSolve = solve;
    ctx.mzLayout = () => layout();
  },
  start(ctx) {
    ctx.round = 0;
    ctx.pairIdx = KP.u.rand(ctx.PAIRS.length);
    this.next(ctx);
    ctx.loop((dt, now) => ctx.mzTick(dt, now));
  },
  next(ctx) {
    const U = KP.u;
    const st = ctx.mz;
    ctx.mzFit();
    const land = ctx.body.clientWidth >= ctx.body.clientHeight;
    let [a, b] = [[3, 3], [5, 4], [7, 6]][ctx.level - 1];
    const cols = land ? a : b;
    let rows = land ? b : a;
    // 세로로 긴 폰 화면은 2·3단계에서 한 줄 더 (칸 크기는 그대로, 화면을 꽉 채움)
    if (!land && ctx.level > 1 && ctx.body.clientHeight / ctx.body.clientWidth > 1.45) rows++;
    st.cols = cols;
    st.rows = rows;
    st.open = ctx.mzGen(cols, rows);
    // 출발은 무작위 모서리, 목표는 반대쪽 모서리
    const corner = U.rand(4);
    const sx = corner & 1 ? cols - 1 : 0,
      sy = corner & 2 ? rows - 1 : 0;
    const gx = cols - 1 - sx,
      gy = rows - 1 - sy;
    st.p = { x: sx + 0.5, y: sy + 0.5 };
    st.lastFoot = { x: st.p.x, y: st.p.y };
    st.goal = { x: gx + 0.5, y: gy + 0.5 };
    st.goalCell = gy * cols + gx;
    st.steps = [];
    st.won = false;
    st.bump = 0;
    st.bumpDir = { x: 0, y: 0 };
    st.dragging = false;
    st.glowUntil = 0;
    st.lastMove = performance.now();
    ctx.pairIdx = (ctx.pairIdx + 1) % ctx.PAIRS.length;
    st.pair = ctx.PAIRS[ctx.pairIdx];
    st.ready = true;
    ctx.mzLayout();
    const [, cn, , gn] = st.pair;
    ctx.say(st.pair[0] + " " + U.josa(cn, "을/를") + " 끌어서 " + st.pair[2] + " " + gn + "까지 데려다 줘요!");
    ctx.mzSetHint();
  },
});
