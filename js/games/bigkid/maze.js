/* 미로 탈출 — 캐릭터를 손가락으로 끌어 길을 따라 목표까지!
   - 미로는 격자 기반 자동 생성(깊이 우선 탐색 → 막다른 길이 있는 미로) + 작은 고리(갈림길) 1~2개
   - 1단계 3×3(긴 화면은 3×4·3×5) / 2단계 4×5 / 3단계 6×7 (가로 화면이면 가로·세로를 바꿔 넓게,
     폰 세로는 칸 크기 그대로 아래를 줄로 채움 — 2단계 최대 7줄, 3단계 최대 9줄)
   - 점토 미로판: 벽은 도톰한 점토(그림자·본색·하이라이트), 길은 눌러 만든 홈(벽 두께가 아래로 보이는 가짜 2.5D).
     미로판은 판이 바뀔 때 한 번만 그려 둠(매 프레임은 그림 한 장 + 작은 그림 몇 개)
   - 테마 4종(잔디 정원·바다·겨울·우주): 동물 짝에 맞춰 자동 선택. 막다른 길 끝 벽 위에 소품
   - 벽에 닿으면 더 못 가고 살짝 튕김(벌칙 없음), 지나온 길에 발자국, 끌면 가는 쪽으로 살짝 기울기
   - 길 위 모으기(별·과일, 막다른 길 우선) → 도착하면 모은 것으로 소풍(냠냠). 안 모아도 도착하면 이김
   - 특수 칸 공통 틀: st.items (칸 번호 → {kind, e, done, ...}) — star·fruit·bubble·bush·friend
   - 친구 구하기(2·3단계 일부 판): 길 중간 친구를 지나가면 졸졸 따라와 함께 도착
   - 2·3단계 '술래 도전': 출발점 옆 둥지에서 낮잠 → 아이가 출발하면 깨서 셋 세고 출발.
     손을 떼면 술래도 앉아 쉼. 가까우면 따뜻한 두근두근(웃는 얼굴). 잡히면 간지럼 놀이 후 둥지로.
     비눗방울을 밟으면 뱅글뱅글, 덤불에 숨으면 앞에서 ❓ 두리번. 도착하면 술래도 와서 같이 축하.
     술래 속도는 단계별로 기억(잡히면 조금 느리게, 한 번도 안 잡히고 이기면 조금 빠르게) */
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
      .mzBoard{background:linear-gradient(180deg,#bdeaa3,#8ed173)}
      .board .mzSpot{position:absolute;border-radius:50%;pointer-events:none;left:0;top:0}
      .mzBoard::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;border-radius:inherit;
        box-shadow:inset 0 0 0 7px rgba(255,200,90,.8),inset 0 0 30px 10px rgba(255,170,120,.45)}
      .mzBoard.near::after{animation:mzPulse .5s ease-in-out infinite alternate}
      @keyframes mzPulse{from{opacity:.1}to{opacity:.85}}
      .mzChase{position:absolute;right:10px;top:8px;z-index:3;height:60px;min-width:96px;padding:0 12px;border-radius:999px;
        display:flex;align-items:center;justify-content:center;gap:2px;font-size:32px;line-height:1;
        background:rgba(255,255,255,.92);box-shadow:0 4px 0 rgba(0,0,0,.14)}
      .mzChase .e:last-child{font-size:24px;width:24px;height:24px;opacity:.85}
      .mzChase.on{background:#ffd54a;animation:bump .4s}
      .mzBag{position:absolute;left:10px;top:8px;z-index:3;height:52px;padding:0 12px;border-radius:999px;display:flex;align-items:center;gap:4px;
        font-size:30px;line-height:1;background:rgba(255,255,255,.88);box-shadow:0 4px 0 rgba(0,0,0,.12);pointer-events:none}
      .mzBag .mzI{opacity:.28;filter:grayscale(1)}
      .mzBag .mzI.got{opacity:1;filter:none;animation:bump .4s}
    `);
    const board = U.el("div", "board mzBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "mzSpot");
    const bChase = U.btn("", "mzChase");
    const bag = U.el("div", "mzBag");
    board.append(cv, spot, bag, bChase);
    ctx.bChase = bChase;
    ctx.body.appendChild(board);
    const cx = cv.getContext("2d");

    // [캐릭터, 이름, 목표, 목표 이름, 테마]
    ctx.PAIRS = [
      ["🐶", "강아지", "🦴", "뼈다귀", "garden"],
      ["🐰", "토끼", "🥕", "당근", "garden"],
      ["🐭", "생쥐", "🧀", "치즈", "space"],
      ["🐝", "꿀벌", "🌻", "해바라기", "garden"],
      ["🐵", "원숭이", "🍌", "바나나", "sea"],
      ["🐧", "펭귄", "🐟", "물고기", "snow"],
      ["🐻", "곰", "🍯", "꿀", "snow"],
      ["🐿️", "다람쥐", "🌰", "도토리", "garden"],
      ["🦖", "공룡", "🥚", "알", "sea"],
      ["🐱", "고양이", "🥛", "우유", "space"],
    ];
    // 술래(같이 놀자며 쫓아오는 친구) — 짝마다
    ctx.CHASERS = {
      강아지: ["🐱", "아기 고양이"], 토끼: ["🦊", "아기 여우"], 생쥐: ["🐱", "아기 고양이"], 꿀벌: ["🐻", "아기 곰"], 원숭이: ["🐯", "아기 호랑이"],
      펭귄: ["🦭", "아기 물개"], 곰: ["🐝", "꿀벌"], 다람쥐: ["🦉", "아기 부엉이"], 공룡: ["🐊", "아기 악어"], 고양이: ["🐶", "강아지"],
    };
    // 테마: 바탕·벽(옆면/본색/하이라이트/홈 안쪽 벽면)·길(그늘/바닥/점무늬)·덤불·막다른 길 소품·벽 위 작은 장식 색
    const THEMES = {
      garden: { bg: "linear-gradient(180deg,#bdeaa3,#8ed173)", dot: "rgba(255,255,255,.16)", side: "#2e7a2b", wall: "#55ad48", hi: "#9ee08a", face: "#3b8c35", floor: "#fff3cf", shade: "#e6cd98", speck: "rgba(205,160,95,.30)", bush: ["#3f9e3a", "#78d266"], props: ["🌼", "🍄", "🌷"], deco: ["#ffe066", "#ff9ec4", "#ffffff"] },
      sea: { bg: "linear-gradient(180deg,#a6e8f7,#5fc4e8)", dot: "rgba(255,255,255,.24)", side: "#1d6aa0", wall: "#3d98d6", hi: "#91d4f6", face: "#2a7cb9", floor: "#ffeec2", shade: "#e8cd94", speck: "rgba(200,150,80,.28)", bush: ["#1f9c8f", "#5ad6c4"], props: ["🐚", "🦀", "🐠"], deco: ["#ffffff", "#ffc9d6", "#fff3a0"] },
      snow: { bg: "linear-gradient(180deg,#f3f8ff,#cfe3f6)", dot: "rgba(255,255,255,.8)", side: "#557fae", wall: "#86b4e2", hi: "#e3f2ff", face: "#6a99cc", floor: "#ffffff", shade: "#d7e5f3", speck: "rgba(120,160,210,.22)", bush: ["#3f8f6a", "#eaf6ff"], props: ["⛄", "🌲", "❄️"], deco: ["#ffffff", "#ffffff", "#ffd6e6"] },
      space: { bg: "linear-gradient(180deg,#3b3192,#1f1a55)", dot: "rgba(255,255,255,.6)", side: "#2b2178", wall: "#6a5cd0", hi: "#aea4f7", face: "#5042b0", floor: "#f1ecff", shade: "#d2c7f6", speck: "rgba(130,110,220,.25)", bush: ["#7a4fc9", "#c9a4ff"], props: ["🪐", "🌙", "🚀"], deco: ["#fff6a8", "#ffffff", "#ffc6f0"] },
    };
    const FRUITS = ["🍓", "🍎", "🍇", "🍒", "🍊"];
    const FRIENDS = ["🐥", "🐹", "🐨", "🐼", "🐸"];
    const preload = KP.loadE(
      ctx.PAIRS.flatMap((p) => [p[0], p[2]])
        .concat(["🐾", "✨", "💕", "💤", "💨", "❓", "💫", "😆", "🎵", "👋", "⭐", "🫧"], FRUITS, FRIENDS, Object.values(ctx.CHASERS).map((c) => c[0]))
        .concat(...Object.values(THEMES).map((t) => t.props))
    );

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
      dep = 0, // 벽 두께가 아래로 보이는 높이(px)
      fo = 0, // 길 바닥이 그만큼 아래에 보이므로 길 위 그림도 살짝 내려 그림(px)
      layer = null,
      trail = null; // 발자국은 찍을 때 한 번만 그려 두는 판 (매 화면 다시 그리지 않음)
    const st = (ctx.mz = { ready: false, items: new Map(), fx: [] });

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
    const deg = (o) => (o & 1 ? 1 : 0) + (o & 2 ? 1 : 0) + (o & 4 ? 1 : 0) + (o & 8 ? 1 : 0);
    /** 벽 n개를 더 열어 작은 고리(갈림길)를 만듦. 막다른 길은 되도록 남기고, 2×2 빈 마당은 안 만듦 */
    function braid(open, cols, rows, n) {
      const cand = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const c = j * cols + i;
          if (i + 1 < cols && !(open[c] & E)) cand.push([c, E, c + 1, W_]);
          if (j + 1 < rows && !(open[c] & S)) cand.push([c, S, c + cols, N]);
        }
      const dead = (x) => (deg(open[x[0]]) < 2 || deg(open[x[2]]) < 2 ? 1 : 0);
      const order = U.shuffle(cand).sort((x, y) => dead(x) - dead(y));
      const plaza = (c) => {
        const ci = c % cols,
          cj = (c / cols) | 0;
        for (let j = cj - 1; j <= cj; j++)
          for (let i = ci - 1; i <= ci; i++) {
            if (i < 0 || j < 0 || i + 1 >= cols || j + 1 >= rows) continue;
            const a = j * cols + i;
            if (open[a] & E && open[a] & S && open[a + 1] & S && open[a + cols] & E) return true;
          }
        return false;
      };
      let done = 0;
      for (const [a, b, c2, ob] of order) {
        if (done >= n) break;
        open[a] |= b;
        open[c2] |= ob;
        if (plaza(a) || plaza(c2)) {
          open[a] &= ~b;
          open[c2] &= ~ob;
          continue;
        }
        done++;
      }
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
        if (k) touchItems(); // 빠르게 끌어도 지나친 별·과일·친구를 놓치지 않게 (한 번에 여러 칸 이동)
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
      st.W = W;
      st.H = H;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      if (st.ready) layout();
    }
    ctx.mzFit = fit;
    addEventListener("resize", () => ctx._active && fit());
    // 그림이 다 불러와지면 미로판(소품 포함)을 한 번 다시 그림 (처음엔 글자 그림으로 그려질 수 있어서)
    preload.then(() => ctx._active && st.ready && layout());

    /** 판마다 같은 무늬가 나오게 하는 작은 난수 (화면 회전으로 다시 그려도 장식이 그대로) */
    function rng(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function layout() {
      const th = st.theme;
      board.style.background = th.bg;
      const { cols, rows, open } = st;
      // 세로 화면은 위쪽에 버튼(모은 것·술래) 자리를 비워 둠, 가로 화면은 옆 빈 곳에 버튼
      const top = H > W * 1.08 ? Math.min(70, H * 0.09) : 0;
      const pad = Math.max(12, Math.min(W, H) * 0.025);
      s = Math.min((W - pad * 2) / (cols + 0.4), (H - top - pad * 2) / (rows + 0.6));
      dep = Math.max(4, Math.min(26, s * 0.13));
      fo = dep * 0.7;
      ox = (W - s * cols) / 2;
      oy = top + (H - top - s * rows - dep * 1.3) / 2;
      st.s = s;
      st.ox = ox;
      st.oy = oy;
      st.fo = fo;
      spot.style.width = spot.style.height = s * 0.8 + "px";
      spot.style.margin = -s * 0.4 + "px 0 0 " + -s * 0.4 + "px";
      // 고정된 미로 그림은 한 번만 그려 둔다
      const d = Math.min(devicePixelRatio || 1, 2);
      const rnd = rng(st.seed);
      layer = document.createElement("canvas");
      layer.width = W * d;
      layer.height = H * d;
      const g = layer.getContext("2d");
      g.setTransform(d, 0, 0, d, 0, 0);
      // 바탕 무늬 (우주는 작은 별, 나머지는 말랑한 점)
      g.fillStyle = th.dot;
      for (let k = 0; k < 40; k++) {
        g.beginPath();
        g.arc(rnd() * W, rnd() * H, st.themeId === "space" ? 1 + rnd() * 1.8 : s * (0.04 + rnd() * 0.07), 0, 7);
        g.fill();
      }
      // 점토 미로판: 그림자 → 옆면(두께) → 윗면 → 윗면 가장자리 하이라이트
      const fr = s * 0.17,
        X0 = ox - fr,
        Y0 = oy - fr,
        SW = s * cols + fr * 2,
        SH = s * rows + fr * 2,
        rad = Math.min(fr * 2.2, s * 0.45);
      g.fillStyle = "rgba(0,0,0,.15)";
      rr(g, X0 + dep * 0.4, Y0 + dep * 2.1, SW, SH, rad);
      g.fill();
      g.fillStyle = th.side;
      rr(g, X0, Y0 + dep * 1.3, SW, SH, rad);
      g.fill();
      g.fillStyle = th.wall;
      rr(g, X0, Y0, SW, SH, rad);
      g.fill();
      g.save();
      rr(g, X0, Y0, SW, SH, rad);
      g.clip();
      g.globalAlpha = 0.5;
      g.strokeStyle = th.hi;
      g.lineWidth = Math.max(2, fr * 0.3);
      rr(g, X0 + fr * 0.3, Y0 + fr * 0.25, SW - fr * 0.6, SH - fr * 0.7, rad * 0.8);
      g.stroke();
      // 손으로 누른 듯한 점토 자국
      for (let k = 0; k < cols * rows * 5; k++) {
        const x = X0 + rnd() * SW,
          y = Y0 + rnd() * SH,
          r = s * (0.025 + rnd() * 0.04);
        g.globalAlpha = 0.08;
        g.fillStyle = "#000";
        g.beginPath();
        g.arc(x + r * 0.3, y + r * 0.35, r, 0, 7);
        g.fill();
        g.globalAlpha = 0.3;
        g.fillStyle = th.hi;
        g.beginPath();
        g.arc(x - r * 0.2, y - r * 0.25, r * 0.75, 0, 7);
        g.fill();
      }
      g.restore();
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
      // 홈 둘레: 점토 벽 윗면의 둥근 모서리(밝게) + 얇은 윤곽(어둡게)
      g.save();
      g.globalAlpha = 0.55;
      g.strokeStyle = th.hi;
      g.lineWidth = w + Math.max(3, s * 0.08);
      g.translate(0, -dep * 0.3);
      g.stroke(segs);
      g.restore();
      g.save();
      g.globalAlpha = 0.45;
      g.strokeStyle = th.side;
      g.lineWidth = w + Math.max(2, s * 0.025);
      g.stroke(segs);
      g.restore();
      // 홈(길) — 따로 그린 뒤 얹음: 위쪽엔 벽 옆면(두께), 그 아래 그늘, 바닥
      const gc = document.createElement("canvas");
      gc.width = layer.width;
      gc.height = layer.height;
      const gg = gc.getContext("2d");
      gg.setTransform(d, 0, 0, d, 0, 0);
      gg.lineCap = "round";
      gg.lineJoin = "round";
      gg.strokeStyle = th.face;
      gg.lineWidth = w;
      gg.stroke(segs);
      gg.globalCompositeOperation = "source-atop";
      gg.save();
      gg.translate(0, dep);
      gg.strokeStyle = th.shade;
      gg.stroke(segs);
      gg.restore();
      gg.save();
      gg.translate(0, dep * 1.4);
      gg.strokeStyle = th.floor;
      gg.lineWidth = Math.max(4, w - dep * 0.5);
      gg.stroke(segs);
      gg.restore();
      // 길 위 작은 점무늬
      gg.fillStyle = th.speck;
      for (let k = 0; k < cols * rows * 4; k++) {
        const c = Math.floor(rnd() * cols * rows);
        gg.beginPath();
        gg.arc(ox + ((c % cols) + 0.2 + rnd() * 0.6) * s, oy + (((c / cols) | 0) + 0.25 + rnd() * 0.6) * s + fo, s * 0.022, 0, 7);
        gg.fill();
      }
      gg.globalCompositeOperation = "source-over";
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(gc, 0, 0);
      g.restore();
      // 벽이 만나는 꼭짓점 위 작은 점토 꽃·알갱이 (꼭짓점은 늘 벽이라 길을 가리지 않음)
      const nest = st.nestCorner;
      for (let j = 0; j <= rows; j++)
        for (let i = 0; i <= cols; i++) {
          if (rnd() > 0.32) continue;
          if (nest && i === nest[0] && j === nest[1]) continue;
          const x = ox + i * s + (i === 0 ? -fr * 0.35 : i === cols ? fr * 0.35 : 0),
            y = oy + j * s + (j === 0 ? -fr * 0.35 : j === rows ? fr * 0.35 : 0);
          const col = th.deco[Math.floor(rnd() * th.deco.length)],
            r = s * 0.04;
          g.fillStyle = "rgba(0,0,0,.12)";
          g.beginPath();
          g.arc(x + r * 0.4, y + r * 0.6, r * 1.9, 0, 7);
          g.fill();
          g.fillStyle = col;
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2 + rnd();
            g.beginPath();
            g.arc(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1, r * 0.8, 0, 7);
            g.fill();
          }
          g.fillStyle = col === "#ffe066" || col === "#fff3a0" || col === "#fff6a8" ? "#ff9f43" : "#ffd54a";
          g.beginPath();
          g.arc(x, y, r * 0.65, 0, 7);
          g.fill();
        }
      // 막다른 길 소품: 막힌 쪽 벽 위에 (길은 가리지 않게)
      for (const pr of st.props) {
        const c0 = center(pr.c);
        KP.drawE(g, pr.e, px(c0.x + pr.dx * 0.5), py(c0.y + pr.dy * 0.5) - s * 0.02, s * 0.36);
      }
      // 발자국 판 새로 만들고 지금까지의 발자국 다시 찍기
      trail = document.createElement("canvas");
      trail.width = W * d;
      trail.height = H * d;
      trail.getContext("2d").setTransform(d, 0, 0, d, 0, 0);
      (st.steps || []).forEach(stamp);
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
    const fy = (v) => oy + v * s + fo; // 길 바닥 위 (그림용)
    function stamp(f) {
      if (!trail) return;
      const g = trail.getContext("2d");
      g.globalAlpha = 0.42;
      KP.drawE(g, "🐾", px(f.x), fy(f.y), s * 0.26, f.a + Math.PI / 2);
      g.globalAlpha = 1;
    }
    ctx.mzClearTrail = () => trail && trail.getContext("2d").clearRect(0, 0, W, H);
    function shadow(x, y, rx) {
      cx.fillStyle = "rgba(0,0,0,.14)";
      cx.beginPath();
      cx.ellipse(x, y, rx, rx * 0.3, 0, 0, 7);
      cx.fill();
    }
    function drawBush(c, alpha) {
      const o = center(c),
        x = px(o.x),
        y = fy(o.y) + s * 0.1,
        r = s * 0.2;
      const [base, hi] = st.theme.bush;
      cx.globalAlpha = alpha;
      shadow(x, y + r * 0.9, r * 1.6);
      cx.fillStyle = base;
      for (const [a, b, k] of [[-1, 0.15, 1], [1, 0.15, 1], [0, -0.35, 1.15], [-0.45, 0.45, 0.9], [0.45, 0.45, 0.9]]) {
        cx.beginPath();
        cx.arc(x + a * r * 0.85, y + b * r, r * k, 0, 7);
        cx.fill();
      }
      cx.fillStyle = hi;
      cx.globalAlpha = alpha * 0.6;
      for (const [a, b] of [[-0.9, -0.05], [0.15, -0.6], [0.95, 0]]) {
        cx.beginPath();
        cx.arc(x + a * r * 0.85 - r * 0.15, y + b * r - r * 0.2, r * 0.32, 0, 7);
        cx.fill();
      }
      cx.globalAlpha = 1;
    }

    function draw(now) {
      if (!W || !st.ready) return;
      cx.clearRect(0, 0, W, H);
      if (layer) cx.drawImage(layer, 0, 0, W, H);
      const t = now / 1000;
      // 길 안내 반짝이
      if (st.glowUntil > now && st.glowPath) {
        st.glowPath.forEach((c, k) => {
          const o = center(c);
          const a = 0.5 + 0.5 * Math.sin(t * 6 - k * 0.9);
          cx.globalAlpha = 0.35 + 0.6 * a;
          KP.drawE(cx, "✨", px(o.x), fy(o.y), s * (0.32 + 0.12 * a));
        });
        cx.globalAlpha = 1;
      }
      // 발자국
      if (trail) cx.drawImage(trail, 0, 0, W, H);
      // 목표 (도착하면 소풍 돗자리)
      const g = st.goal,
        gb = st.won ? 1.25 + 0.1 * Math.sin(t * 10) : 1 + 0.06 * Math.sin(t * 3);
      if (st.won) {
        cx.fillStyle = "rgba(255,138,160,.55)";
        cx.beginPath();
        cx.ellipse(px(g.x), fy(g.y) + s * 0.08, s * 0.58, s * 0.3, 0, 0, 7);
        cx.fill();
      }
      cx.fillStyle = "rgba(255,213,74,.45)";
      cx.beginPath();
      cx.arc(px(g.x), fy(g.y), s * 0.36 * gb, 0, 7);
      cx.fill();
      KP.drawE(cx, st.pair[2], px(g.x), fy(g.y) + Math.sin(t * 3) * s * 0.03, s * 0.6 * gb);
      // 특수 칸
      const hidden = kidHidden();
      let friend = null;
      st.items.forEach((it, c) => {
        const o = center(c),
          x = px(o.x),
          y = fy(o.y);
        if (it.kind === "star" || it.kind === "fruit") {
          if (it.done) return;
          const b = Math.sin(t * 3 + c) * s * 0.04;
          shadow(x, y + s * 0.2, s * 0.15);
          KP.drawE(cx, it.e, x, y - b, s * 0.42, it.kind === "star" ? Math.sin(t * 2 + c) * 0.15 : 0);
        } else if (it.kind === "bubble") {
          if (it.done) return;
          const k = 1 + Math.sin(t * 4 + c) * 0.06;
          cx.globalAlpha = 0.9;
          KP.drawE(cx, "🫧", x, y - s * 0.04, s * 0.5 * k);
          cx.globalAlpha = 1;
        } else if (it.kind === "bush") {
          if (!hidden) drawBush(c, 1);
        } else if (it.kind === "friend") friend = it;
      });
      // 친구 (기다리는 중이면 손 흔들기, 따라오는 중이면 졸졸)
      if (friend) {
        const fxp = px(friend.x),
          fyy = fy(friend.y);
        const hop = friend.done ? Math.abs(Math.sin(t * 9)) * s * 0.05 : Math.abs(Math.sin(t * 3)) * s * 0.03;
        shadow(fxp, fyy + s * 0.2, s * 0.17);
        KP.drawE(cx, friend.e, fxp, fyy - hop, s * 0.5, friend.done ? 0 : Math.sin(t * 3) * 0.12);
        if (!friend.done) KP.drawE(cx, "👋", fxp + s * 0.26, fyy - s * 0.3 + Math.sin(t * 6) * s * 0.03, s * 0.24, Math.sin(t * 6) * 0.4);
      }
      // 술래
      const ch = st.ch;
      if (ch) drawChaser(ch, t);
      // 캐릭터 (튕김·기울기·간지럼 흔들기)
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
      const wig = ch && ch.mode === "hug" ? Math.sin(t * 22) * 0.22 : 0;
      shadow(px(p.x) + bx, fy(p.y) + s * 0.3, s * 0.26 * (1 + Math.abs(st.tilt) * 0.8));
      KP.drawE(cx, st.pair[0], px(p.x) + bx, fy(p.y) + by - hop - (lift - 1) * s * 0.4, s * 0.74 * lift, st.tilt + wig);
      if (hidden) drawBush(st.bushCell, 0.93);
      // 소풍: 모은 것들이 목표 둘레에서 폴짝, 과일은 냠냠 먹으면 작아짐
      if (st.won && st.got && st.got.length) {
        const eat = st.eatAt ? Math.min(1, (performance.now() - st.eatAt) / 1100) : 0;
        st.got.forEach((it, k) => {
          // 목표 아래쪽 반원에 둘러앉기 (캐릭터 얼굴을 가리지 않게)
          const n = st.got.length,
            a = Math.PI * (0.12 + (0.76 * (k + 0.5)) / n);
          const sz = it.kind === "fruit" ? 1 - eat * 0.85 : 1;
          if (sz <= 0.05) return;
          const x = px(g.x) + Math.cos(a) * s * 0.5,
            y = fy(g.y) + s * 0.06 + Math.sin(a) * s * 0.34 - Math.abs(Math.sin(t * 8 + k)) * s * 0.06;
          KP.drawE(cx, it.e, x, y, s * 0.3 * sz);
        });
      }
      // 반짝·하트 같은 짧은 효과
      if (st.fx.length) {
        const nowp = performance.now();
        st.fx = st.fx.filter((f) => nowp - f.t0 < f.dur);
        for (const f of st.fx) {
          const a = (nowp - f.t0) / f.dur;
          cx.globalAlpha = 1 - a;
          KP.drawE(cx, f.e, px(f.x + f.vx * a), fy(f.y) - a * s * f.up, s * f.size * (0.7 + a * 0.5));
        }
        cx.globalAlpha = 1;
      }
      // 힌트용 투명 점: 위치가 바뀔 때만 옮김
      const sl = Math.round(px(p.x)), stp = Math.round(fy(p.y));
      if (sl !== st._sl || stp !== st._st) {
        st._sl = sl;
        st._st = stp;
        spot.style.transform = "translate(" + sl + "px," + stp + "px)";
      }
    }
    function drawChaser(ch, t) {
      const x = px(ch.x),
        y = fy(ch.y);
      if (ch.mode === "nap") {
        // 둥지(점토 방석)에서 낮잠
        cx.fillStyle = "rgba(0,0,0,.14)";
        cx.beginPath();
        cx.ellipse(x, y + s * 0.16, s * 0.3, s * 0.11, 0, 0, 7);
        cx.fill();
        cx.fillStyle = "#e9a05b";
        cx.beginPath();
        cx.ellipse(x, y + s * 0.1, s * 0.28, s * 0.12, 0, 0, 7);
        cx.fill();
        cx.fillStyle = "#ffcf8f";
        cx.beginPath();
        cx.ellipse(x, y + s * 0.08, s * 0.2, s * 0.07, 0, 0, 7);
        cx.fill();
        const br = 1 + Math.sin(t * 2.2) * 0.04;
        KP.drawE(cx, ch.e, x, y - s * 0.04, s * 0.5 * br, -0.35);
        const zz = (t * 0.6) % 1;
        cx.globalAlpha = 1 - zz;
        KP.drawE(cx, "💤", x + s * (0.2 + zz * 0.12), y - s * (0.28 + zz * 0.25), s * 0.26);
        cx.globalAlpha = 1;
        return;
      }
      let rot = 0,
        sx = 1,
        sy = 1,
        dy = 0,
        dx = 0,
        size = 0.68;
      const run = ch.mode === "run" || ch.mode === "home" || ch.mode === "join";
      if (run) {
        dy = -Math.abs(Math.sin(t * (ch.near ? 11 : 8))) * s * 0.06;
        rot = Math.sin(t * 8) * 0.08;
      } else if (ch.mode === "sit") {
        sx = 1.08;
        sy = 0.86;
        dy = s * 0.05;
      } else if (ch.mode === "wake" || ch.mode === "stand") {
        const k = Math.sin(t * 7) * 0.06;
        sx = 1 - k;
        sy = 1 + k;
      } else if (ch.mode === "spin") rot = t * 14;
      else if (ch.mode === "look") {
        dx = Math.sin(t * 3.5) * s * 0.06;
        rot = Math.sin(t * 3.5) * 0.2;
      } else if (ch.mode === "hug") rot = Math.sin(t * 22) * 0.25;
      if (ch.mode === "join" && ch.arrived) dy = -Math.abs(Math.sin(t * 9)) * s * 0.12;
      shadow(x + dx, y + s * 0.28, s * 0.24);
      cx.save();
      cx.translate(x + dx, y + dy);
      cx.scale(sx, sy);
      KP.drawE(cx, ch.e, 0, 0, s * size, rot);
      cx.restore();
      // 머리 위 신호
      let sig = null;
      if (ch.mode === "hug") sig = "💕";
      else if (ch.mode === "spin") sig = "💫";
      else if (ch.mode === "look") sig = "❓";
      else if (ch.mode === "sit") sig = "💤";
      else if (ch.mode === "run" && ch.near) sig = "😆";
      else if (ch.mode === "run" && ch.mid) sig = "🎵";
      else if (ch.mode === "join" && ch.arrived) sig = "💕";
      if (sig) {
        const b = Math.sin(t * 6) * s * 0.03;
        KP.drawE(cx, sig, x + dx + s * 0.26, y - s * 0.42 + b, s * (sig === "💕" ? 0.34 : 0.28));
      }
      if (ch.mode === "wake" && ch.t < 3.2) {
        cx.fillStyle = "#fff";
        cx.strokeStyle = "rgba(47,58,102,.8)";
        cx.lineWidth = s * 0.06;
        cx.font = "bold " + Math.round(s * 0.5) + "px Jua, sans-serif";
        cx.textAlign = "center";
        cx.textBaseline = "middle";
        const n = String(Math.max(1, Math.ceil(ch.t)));
        cx.strokeText(n, x, y - s * 0.62);
        cx.fillText(n, x, y - s * 0.62);
      }
    }

    /* ---------- 손가락 ---------- */
    const toCell = (e) => {
      const r = cv.getBoundingClientRect();
      const x = ((e.clientX - r.left) * W) / r.width,
        y = ((e.clientY - r.top) * H) / r.height;
      return { x: (x - ox) / s, y: (y - oy - fo) / s };
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
      const now = performance.now();
      if (moved > 0) {
        st.lastMove = now;
        st.glowUntil = 0;
        // 가는 쪽으로 살짝 기울기
        st.tiltT = U.clamp((st.p.x - bx) * 4.5, -0.2, 0.2);
        st.tiltAt = now;
        // 친구가 따라올 길 기록
        const lt = st.track[st.track.length - 1];
        if (!lt || Math.hypot(st.p.x - lt.x, st.p.y - lt.y) > 0.06) {
          st.track.push({ x: st.p.x, y: st.p.y });
          if (st.track.length > 120) st.track.shift();
        }
        const lf = st.steps[st.steps.length - 1] || st.lastFoot;
        if (Math.hypot(st.p.x - lf.x, st.p.y - lf.y) > 0.34) {
          const a = Math.atan2(st.p.y - lf.y, st.p.x - lf.x);
          const f = { x: lf.x + Math.cos(a) * 0.34, y: lf.y + Math.sin(a) * 0.34, a };
          st.steps.push(f);
          if (st.steps.length > 400) st.steps.shift();
          stamp(f);
          if (st.steps.length % 2) A.note(U.pick(["C6", "E6", "G6"]), { inst: "marimba", dur: 0.08, vol: 0.05 });
        }
        touchItems();
      }
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
    // 새 판에서는 잡고 있던 손가락을 놓은 것으로 (이어서 끌리지 않게)
    ctx.mzDrop = () => {
      pid = null;
      st.dragging = false;
    };

    function setHint() {
      ctx.hint(() => spot, U.josa(st.pair[1], "을/를") + " 끌어서 " + st.pair[3] + "까지" + " 데려다 줘요!");
    }
    ctx.mzSetHint = setHint;
    const fx = (x, y, e, o = {}) => st.fx.push(Object.assign({ x, y, e, t0: performance.now(), dur: 700, up: 0.6, vx: 0, size: 0.32 }, o));

    /* ---------- 길 위 특수 칸 ---------- */
    const collectibles = () => [...st.items.values()].filter((it) => it.kind === "star" || it.kind === "fruit");
    function touchItems() {
      const p = st.p;
      st.items.forEach((it, c) => {
        if (it.done) return;
        const o = center(c);
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if ((it.kind === "star" || it.kind === "fruit") && d < 0.42) {
          it.done = true;
          if (it.kind === "star") A.sfx("sparkle");
          else {
            A.sfx("pop");
            A.note("E6", { inst: "marimba", dur: 0.12, vol: 0.12, when: 0.08 });
          }
          for (let k = 0; k < 3; k++) fx(o.x, o.y, "✨", { vx: (k - 1) * 0.35, up: 0.7 + k * 0.1, size: 0.26 });
          renderBag();
          const all = collectibles();
          if (all.every((x) => x.done)) KP.voice.say(all[0].kind === "star" ? "별을 다 모았어요!" : "과일 부자!");
          else KP.voice.say("반짝!");
        } else if (it.kind === "friend" && d < 0.55) {
          it.done = true;
          A.sfx("good");
          fx(it.x, it.y, "💕", { up: 0.8, size: 0.34, dur: 900 });
          KP.voice.say("친구 찾았다!");
        }
      });
    }
    function renderBag() {
      const list = collectibles();
      bag.style.display = list.length ? "" : "none";
      bag.innerHTML = list.map((it) => '<span class="mzI' + (it.done ? " got" : "") + '">' + KP.E(it.e) + "</span>").join("");
    }
    const kidHidden = () => st.bushCell != null && !st.won && cellOf(st.p) === st.bushCell && Math.hypot(st.p.x - center(st.bushCell).x, st.p.y - center(st.bushCell).y) < 0.45;
    /** 술래용 칸(비눗방울·덤불)을 놓거나 치움 — 술래를 켜고 끌 때도 씀 */
    function placeChaseItems(on) {
      st.items.forEach((it, c) => (it.kind === "bubble" || it.kind === "bush") && st.items.delete(c));
      st.bushCell = null;
      if (!on) return;
      const free = (c) => !st.items.has(c) && c !== st.startCell && c !== st.goalCell && (!st.reach || st.reach.has(c));
      // 비눗방울: 정답 길 위(아이가 지나간 뒤 따라오는 술래가 밟게)
      const sol = st.sol;
      const nb = ctx.level >= 3 ? 2 : 1;
      const spots = nb === 2 ? [0.4, 0.72] : [0.55];
      for (const f of spots) {
        const k0 = Math.round((sol.length - 1) * f);
        for (const dk of [0, 1, -1, 2, -2]) {
          const c = sol[k0 + dk];
          if (c != null && free(c) && k0 + dk > 1 && k0 + dk < sol.length - 1) {
            st.items.set(c, { kind: "bubble", e: "🫧", done: false });
            break;
          }
        }
      }
      // 숨는 덤불: 막다른 길 한 곳 (출발 칸 근처는 피함). 막다른 길이 모두 차 있으면 정답 길 밖의 칸
      const far = (c) => free(c) && solve(st.startCell, c).length > 2;
      const onSol = new Set(sol);
      const dead = U.shuffle(st.deadEnds.filter(far));
      const off = U.shuffle([...Array(st.cols * st.rows).keys()].filter((c) => !onSol.has(c) && free(c)));
      const pool = dead.length ? dead : off.filter(far).length ? off.filter(far) : off;
      if (pool.length) {
        st.bushCell = pool[0];
        st.items.set(pool[0], { kind: "bush", done: false });
      }
    }
    ctx.mzPlaceChaseItems = placeChaseItems;

    /** 새 판 만들기 (칸 수는 next 가 화면에 맞춰 정함) */
    ctx.mzRound = (cols, rows) => {
      const lv = ctx.level;
      st.cols = cols;
      st.rows = rows;
      st.open = gen(cols, rows);
      braid(st.open, cols, rows, lv === 1 ? (cols * rows >= 12 ? 2 : 1) : lv === 2 ? 1 : 2);
      st.seed = (Math.random() * 1e9) | 0;
      // 출발은 무작위 모서리, 목표는 반대쪽 모서리
      const corner = U.rand(4);
      const sx = corner & 1 ? cols - 1 : 0,
        sy = corner & 2 ? rows - 1 : 0;
      const gx = cols - 1 - sx,
        gy = rows - 1 - sy;
      st.outDir = { x: sx === 0 ? -1 : 1, y: sy === 0 ? -1 : 1 }; // 출발 칸에서 바깥 모서리 쪽
      st.nestCorner = [sx === 0 ? 0 : cols, sy === 0 ? 0 : rows];
      st.startCell = sy * cols + sx;
      st.p = { x: sx + 0.5, y: sy + 0.5 };
      st.lastFoot = { x: st.p.x, y: st.p.y };
      st.goal = { x: gx + 0.5, y: gy + 0.5 };
      st.goalCell = gy * cols + gx;
      st.sol = solve(st.startCell, st.goalCell);
      st.steps = [];
      st.track = [{ x: st.p.x, y: st.p.y }];
      st.won = false;
      st.got = null;
      st.eatAt = 0;
      st.bump = 0;
      st.bumpDir = { x: 0, y: 0 };
      st.tilt = 0;
      st.tiltT = 0;
      st.dragging = false;
      st.glowUntil = 0;
      st.fx = [];
      st.lastMove = performance.now();
      st.roundId = (st.roundId || 0) + 1;
      ctx.pairIdx = (ctx.pairIdx + 1) % ctx.PAIRS.length;
      st.pair = ctx.PAIRS[ctx.pairIdx];
      st.themeId = st.pair[4] || "garden";
      st.theme = THEMES[st.themeId];
      // 특수 칸
      st.items = new Map();
      st.deadEnds = [];
      for (let c = 0; c < cols * rows; c++) if (deg(st.open[c]) === 1 && c !== st.startCell && c !== st.goalCell) st.deadEnds.push(c);
      const onSol = new Set(st.sol);
      // 목표 칸을 지나지 않고 갈 수 있는 칸만 (목표 너머에 두면 먼저 도착해 버려 못 모음)
      st.reach = new Set([st.startCell]);
      for (const q = [st.startCell]; q.length; ) {
        const c = q.shift();
        for (const [bit, dx, dy] of DIRS) {
          const n = c + dy * cols + dx;
          if (st.open[c] & bit && n !== st.goalCell && !st.reach.has(n)) {
            st.reach.add(n);
            q.push(n);
          }
        }
      }
      const free = (c) => !st.items.has(c) && c !== st.startCell && c !== st.goalCell && st.reach.has(c);
      // 모으기: 별 또는 과일 2~3개 — 막다른 길 우선, 1단계는 하나를 정답 길 위에(규칙을 자연스럽게 익히게)
      const nItem = lv === 1 ? 2 : lv === 2 ? 2 + U.rand(2) : 3;
      const fruit = Math.random() < 0.5;
      const fr = U.shuffle(FRUITS.slice());
      const spots = [];
      if (lv === 1) {
        const mid = st.sol.slice(1, -1);
        if (mid.length) spots.push(mid[Math.floor(mid.length / 2)]);
      }
      const offSol = U.shuffle([...Array(cols * rows).keys()].filter((c) => !onSol.has(c) && deg(st.open[c]) > 1));
      const onPath = U.shuffle(st.sol.slice(2, -1));
      for (const c of U.shuffle(st.deadEnds.slice()).concat(offSol, onPath)) {
        if (spots.length >= nItem) break;
        if (!spots.includes(c) && free(c)) spots.push(c);
      }
      spots.forEach((c, k) => st.items.set(c, { kind: fruit ? "fruit" : "star", e: fruit ? fr[k % fr.length] : "⭐", done: false }));
      // 친구 구하기 (2·3단계 일부 판): 정답 길 중간에서 기다림
      if (lv >= 2 && Math.random() < 0.4) {
        const k0 = Math.floor(st.sol.length / 2);
        for (const dk of [0, 1, -1, 2, -2]) {
          const c = st.sol[k0 + dk];
          if (c != null && free(c) && k0 + dk > 1 && k0 + dk < st.sol.length - 1) {
            const o = center(c);
            st.items.set(c, { kind: "friend", e: U.pick(FRIENDS), done: false, x: o.x, y: o.y });
            break;
          }
        }
      }
      // 술래
      st.ch = null;
      st.bushCell = null;
      const chaseOn = KP.store.get("maze:chase", false) && lv >= 2;
      if (chaseOn) {
        addChaser();
        // 아이는 둥지 반대쪽으로 살짝 비켜 서서 시작 (겹치지 않게)
        st.p.x -= st.outDir.x * 0.14;
        st.p.y -= st.outDir.y * 0.14;
        st.lastFoot = { x: st.p.x, y: st.p.y };
        st.track = [{ x: st.p.x, y: st.p.y }];
      }
      placeChaseItems(chaseOn);
      // 남은 막다른 길에는 테마 소품 (막힌 쪽 벽 위)
      st.props = [];
      let pk = U.rand(3);
      for (const c of st.deadEnds) {
        if (st.items.has(c)) continue;
        const dir = DIRS.find(([b]) => st.open[c] & b);
        if (!dir) continue;
        st.props.push({ c, dx: -dir[1], dy: -dir[2], e: st.theme.props[pk++ % st.theme.props.length] });
      }
      renderBag();
      st.ready = true;
      layout();
    };
    function addChaser() {
      const cs = ctx.CHASERS[st.pair[1]] || ["🐶", "강아지"];
      const sc = center(st.startCell);
      const nest = { x: sc.x + st.outDir.x * 0.36, y: sc.y + st.outDir.y * 0.36 };
      st.ch = { e: cs[0], name: cs[1], x: nest.x, y: nest.y, nest, home: st.startCell, mode: "nap", t: 0, idle: 0, near: false, mid: false, catches: 0, grace: 0, speed: ctx.chaseSpeed(), foot: false };
    }
    function chaseOnOff(on) {
      if (on) {
        if (!st.ch) addChaser();
      } else {
        st.ch = null;
        board.classList.remove("near");
      }
      placeChaseItems(on);
    }
    ctx.mzChaseOnOff = chaseOnOff;

    const arrive = async () => {
      if (st.won) return;
      st.won = true;
      st.dragging = false;
      pid = null;
      const rid = st.roundId;
      // 도착 순간의 술래 상태를 기록 (축하 연출 중 바뀌어도 결과는 그대로)
      const ch = st.ch;
      const chase = !!(ch && ch.mode !== "nap");
      const catches = ch ? ch.catches : 0;
      if (ch) {
        ch.mode = "join";
        ch.arrived = false;
        board.classList.remove("near");
      }
      const fr = [...st.items.values()].find((it) => it.kind === "friend" && it.done);
      st.got = collectibles().filter((it) => it.done);
      A.sfx("sparkle");
      KP.voice.say(st.pair[3] + "! 찾았다!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1100);
      if (!ctx._active || st.roundId !== rid) return;
      if (st.got.length) {
        // 소풍: 모은 과일은 냠냠, 별은 반짝
        st.eatAt = performance.now();
        const fruit = st.got[0].kind === "fruit";
        A.sfx(fruit ? "pop" : "sticker");
        KP.voice.say(fruit ? "냠냠! 맛있다!" : "반짝!");
        await ctx.wait(1300);
        if (!ctx._active || st.roundId !== rid) return;
      }
      if (chase) ctx.chaseResult(true, catches);
      const big = ctx.round % 4 === 0;
      const o = { big };
      if (chase && !catches) o.msg = "술래보다 먼저 도착!";
      else if (fr) {
        o.msg = "친구랑 같이 도착!";
        o.say = "야호! 미로 탈출 성공!";
      } else o.msg = big ? "{부름} 미로 대장!" : "미로 탈출 성공!";
      const okWin = await ctx.win(o);
      if (okWin) ctx.def.next(ctx);
    };

    /* ---------- 술래 ---------- */
    const cellOf = (o) => Math.min(st.rows - 1, Math.max(0, Math.floor(o.y))) * st.cols + Math.min(st.cols - 1, Math.max(0, Math.floor(o.x)));
    const center = (c) => ({ x: (c % st.cols) + 0.5, y: ((c / st.cols) | 0) + 0.5 });
    /** 칸 가운데를 따라 가장 짧은 길로 목표 칸까지 (목표 칸 안에서는 fin 지점으로). 남은 거리 */
    function walk(ch, goalCell, fin, speed, dt) {
      const cc = cellOf(ch);
      let tx, ty;
      if (cc === goalCell) {
        tx = fin.x;
        ty = fin.y;
      } else {
        const here = center(cc);
        const offc = Math.hypot(ch.x - here.x, ch.y - here.y);
        const path = solve(cc, goalCell);
        const nx = path[1] !== undefined ? center(path[1]) : here;
        // 칸 가운데를 지나서 꺾기 (벽을 가로지르지 않게)
        const sameRow = Math.abs(nx.y - here.y) < 0.01;
        const aligned = sameRow ? Math.abs(ch.y - here.y) < 0.02 : Math.abs(ch.x - here.x) < 0.02;
        if (aligned || offc < 0.02) {
          tx = nx.x;
          ty = nx.y;
        } else {
          tx = here.x;
          ty = here.y;
        }
      }
      const dx = tx - ch.x,
        dy = ty - ch.y,
        d = Math.hypot(dx, dy);
      if (d > 0.0001) {
        const k = Math.min(1, (speed * dt) / d);
        ch.x += dx * k;
        ch.y += dy * k;
      }
      return cc === goalCell ? Math.hypot(fin.x - ch.x, fin.y - ch.y) : 9;
    }
    const giggle = () => {
      ["E6", "C6", "G6", "E6", "C7"].forEach((n, i) => A.note(n, { inst: "marimba", when: i * 0.07, dur: 0.12, vol: 0.13 }));
      A.sfx("sparkle");
    };
    const silly = () => {
      A.tone(760, { to: 260, dur: 0.22, vol: 0.14, type: "triangle" });
      A.tone(260, { to: 900, dur: 0.28, vol: 0.12, type: "triangle", when: 0.22 });
      A.tone(900, { to: 380, dur: 0.3, vol: 0.1, type: "triangle", when: 0.5 });
    };
    /** "하나, 둘, 셋! ○○가 잡으러 와요!" — 녹음 조각이 다 있으면 통째로, 아니면 "하나, 둘, 셋!"만 말하고 나머지는 말풍선 글자로 */
    function countVoice(ch) {
      const rest = U.josa(ch.name, "이/가") + " 잡으러 와요!";
      const full = "하나, 둘, 셋! " + rest;
      const nat = KP.voice._natUrls ? KP.voice._natUrls(full) : null;
      ctx.say(ch.e + " " + rest, false);
      KP.voice.say(nat ? full : "하나, 둘, 셋!");
    }
    let stepT = 0;
    function chaseTick(dt) {
      const ch = st.ch;
      if (!ch) return;
      const now = performance.now();
      if (st.won) {
        // 도착: 술래도 목표 옆으로 와서 같이 폴짝
        if (ch.mode !== "join") ch.mode = "join";
        if (!ch.arrived) {
          const g = center(st.goalCell);
          walk(ch, st.goalCell, g, 3.2, dt);
          if (Math.hypot(ch.x - g.x, ch.y - g.y) < 0.62) ch.arrived = true;
        }
        return;
      }
      const hidden = kidHidden();
      const setNear = (n) => {
        if (ch.near !== n) {
          ch.near = n;
          board.classList.toggle("near", n);
        }
      };
      if (ch.mode !== "run") setNear(false);
      switch (ch.mode) {
        case "nap":
          // 아이가 둥지에서 멀어지면 깨서 셋 세고 출발
          if (Math.hypot(st.p.x - ch.nest.x, st.p.y - ch.nest.y) > 1.2) {
            ch.mode = "wake";
            ch.t = 3.2;
            ch.lastN = 0;
            A.sfx("pop");
            countVoice(ch);
          }
          return;
        case "wake": {
          ch.t -= dt;
          const n = Math.ceil(ch.t);
          if (ch.lastN !== n && n <= 3 && n >= 1) {
            ch.lastN = n;
            A.note(["G5", "E5", "C5"][3 - n] || "C5", { inst: "marimba", dur: 0.15, vol: 0.15 });
          }
          if (ch.t <= 0) {
            ch.mode = "run";
            ch.idle = 0;
            ch.grace = Math.max(ch.grace, now + 800);
            ch.speed = ctx.chaseSpeed();
          }
          return;
        }
        case "hug":
          ch.t -= dt;
          if (ch.t <= 0) {
            // 둥지로 돌아가 잠깐 쉬었다가 다시 셋 세고 출발 (아이는 그 자리에서 계속)
            fx(ch.x, ch.y, "✨", { size: 0.4 });
            ch.x = ch.nest.x;
            ch.y = ch.nest.y;
            fx(ch.x, ch.y, "✨", { size: 0.4 });
            ch.mode = "wake";
            ch.t = 4.2;
            ch.lastN = 0;
            ch.grace = now + 6000;
            st.items.forEach((it) => it.kind === "bubble" && (it.done = false)); // 비눗방울도 다시
          }
          return;
        case "spin":
          ch.t -= dt;
          if (ch.t <= 0) ch.mode = "run";
          return;
        case "sit":
          // 다시 잡으면 기지개 켜고 출발. 손을 안 대고 한참 있으면 천천히 다시 일어남(한 번만 쉼)
          ch.t += dt;
          if (st.dragging || ch.t > 3.5) {
            ch.mode = "stand";
            ch.t = 0.45;
            ch.rested = !st.dragging;
          }
          return;
        case "stand":
          ch.t -= dt;
          if (ch.t <= 0) ch.mode = "run";
          return;
        case "look":
          ch.t += dt;
          if (!hidden) ch.mode = "run";
          else if (ch.t > 3.5) ch.mode = "home"; // 못 찾으면 둥지로 돌아감 → 아이가 나올 기회
          return;
        case "home": {
          if (!hidden) {
            ch.mode = "run";
            return;
          }
          const hc = center(ch.home);
          if (walk(ch, ch.home, hc, ch.speed * 0.8, dt) < 0.03) {
            ch.mode = "wake";
            ch.t = 3.2;
            ch.lastN = 0;
          }
          bubbleCheck(ch);
          return;
        }
      }
      // ---- run ----
      // 손을 떼면 술래도 잠깐 앉아 쉼 (생각할 여유)
      if (!st.dragging && !ch.rested) {
        ch.idle += dt;
        if (ch.idle > 0.35) {
          ch.mode = "sit";
          ch.t = 0;
          ch.idle = 0;
          setNear(false);
          return;
        }
      } else ch.idle = 0;
      if (st.dragging) ch.rested = false;
      const pc = cellOf(st.p),
        cc = cellOf(ch);
      if (hidden) {
        // 덤불에 숨었으면 덤불 앞 칸까지만 와서 두리번
        const b = st.bushCell;
        const dir = DIRS.find(([bit]) => st.open[b] & bit);
        const front = dir ? b + dir[2] * st.cols + dir[1] : ch.home;
        const fc = center(front);
        setNear(false);
        if (walk(ch, front, fc, ch.speed, dt) < 0.04) {
          ch.mode = "look";
          ch.t = 0;
          if (!ch.saidLook) {
            ch.saidLook = true;
            KP.voice.say("어디 있을까?");
          }
        }
        bubbleCheck(ch);
        return;
      }
      ch.saidLook = false;
      walk(ch, pc, st.p, ch.speed, dt);
      if (bubbleCheck(ch)) return;
      // 거리(길 따라 칸 수)로 가까움 판단 → 웃는 얼굴·두근두근·발소리
      const steps = solve(cellOf(ch), pc).length - 1;
      setNear(steps <= 1);
      ch.mid = steps >= 2 && steps <= 3;
      stepT -= dt;
      if (stepT <= 0) {
        stepT = ch.near ? 0.28 : 0.42;
        const vol = Math.max(0.03, 0.2 - steps * 0.05);
        A.note(ch.foot ? "C4" : "G3", { inst: "marimba", dur: 0.07, vol });
        ch.foot = !ch.foot;
      }
      if (Math.hypot(st.p.x - ch.x, st.p.y - ch.y) < 0.42 && now > ch.grace) caught();
    }
    /** 비눗방울을 밟으면 뱅글뱅글 */
    function bubbleCheck(ch) {
      for (const [c, it] of st.items) {
        if (it.kind !== "bubble" || it.done) continue;
        const o = center(c);
        if (Math.hypot(ch.x - o.x, ch.y - o.y) < 0.3) {
          it.done = true;
          ch.mode = "spin";
          ch.t = 1.5;
          board.classList.remove("near");
          ch.near = false;
          silly();
          for (let k = 0; k < 4; k++) fx(o.x, o.y, "🫧", { vx: (k - 1.5) * 0.3, up: 0.6 + (k % 2) * 0.3, size: 0.22, dur: 900 });
          if (!st.saidSpin) {
            st.saidSpin = true;
            KP.voice.say("하하하!");
          }
          return true;
        }
      }
      return false;
    }
    function caught() {
      const ch = st.ch;
      ch.catches++;
      ch.mode = "hug";
      ch.t = 1.6;
      ch.near = false;
      board.classList.remove("near");
      giggle();
      for (let k = 0; k < 3; k++) fx(st.p.x, st.p.y, "💕", { vx: (k - 1) * 0.4, up: 0.9, size: 0.28, dur: 1200 });
      KP.voice.say(U.pick(["잡았다! 간지럼 간지럼!", "잡았다! 꼭 안아 줄게!", "잡았다! 다시 도망가 봐!"]));
      ctx.chaseResult(false);
    }

    ctx.mzDraw = draw;
    ctx.mzTick = (dt, now) => {
      chaseTick(dt);
      if (st.bump > 0) st.bump = Math.max(0, st.bump - dt * 4);
      // 기울기는 움직임이 멈추면 제자리로
      if (now - (st.tiltAt || 0) > 140) st.tiltT = 0;
      st.tilt += (st.tiltT - st.tilt) * Math.min(1, dt * 12);
      // 따라오는 친구: 아이가 지나온 길을 0.7칸 뒤에서 졸졸
      st.items.forEach((it) => {
        if (it.kind !== "friend" || !it.done) return;
        let acc = 0,
          tgt = st.track[0];
        for (let k = st.track.length - 1; k > 0; k--) {
          acc += Math.hypot(st.track[k].x - st.track[k - 1].x, st.track[k].y - st.track[k - 1].y);
          tgt = st.track[k - 1];
          if (acc >= 0.7) break;
        }
        if (st.track.length < 2) tgt = st.track[0];
        it.x += (tgt.x - it.x) * Math.min(1, dt * 8);
        it.y += (tgt.y - it.y) * Math.min(1, dt * 8);
      });
      // 오래 멈춰 있으면 갈 길을 반짝
      if (st.ready && !st.won && !st.dragging && now - st.lastMove > 10000 && !(st.glowUntil > now)) {
        const here = Math.floor(st.p.y) * st.cols + Math.floor(st.p.x);
        st.glowPath = solve(here, st.goalCell).slice(1, 5);
        st.glowUntil = now + 3000;
        st.lastMove = now;
      }
      draw(now);
    };
    ctx.mzSolve = solve;
  },
  start(ctx) {
    ctx.round = 0;
    // 술래 속도 배율: 단계별로 기억(2단계에서 잘해도 3단계 첫 판이 갑자기 빠르지 않게). 예전 공용 값은 처음 한 번 옮겨 옴
    const kKey = () => "maze:chaseK:" + Math.max(2, ctx.level);
    ctx.chaseK = () => {
      let v = KP.store.get(kKey(), null);
      if (v == null) {
        v = +KP.store.get("maze:chaseK", 1) || 1;
        KP.store.set(kKey(), v);
      }
      return +v || 1;
    };
    ctx.chaseSpeed = () => [0, 0.85, 0.95, 1.15][ctx.level] * ctx.chaseK();
    ctx.chaseResult = (won, catches) => {
      let k = ctx.chaseK();
      if (won) k = Math.min(1.6, k * (catches ? 1.0 : 1.06));
      else k = Math.max(0.5, k * 0.85);
      KP.store.set(kKey(), k);
    };
    const paint = () => {
      const on = !!KP.store.get("maze:chase", false);
      const st = ctx.mz;
      const cs = (st.pair && ctx.CHASERS[st.pair[1]]) || ["🦊"];
      // 그림 버튼: 술래 얼굴 + 💤(쉬는 중) / 💨(술래잡기 중) — 글을 몰라도 스스로 켜고 끌 수 있게
      ctx.bChase.innerHTML = KP.E(cs[0]) + KP.E(on ? "💨" : "💤");
      ctx.bChase.setAttribute("aria-label", on ? "술래잡기 끄기" : "술래잡기 켜기");
      ctx.bChase.classList.toggle("on", on);
      ctx.bChase.style.display = ctx.level >= 2 ? "" : "none";
    };
    ctx.paintChase = paint;
    if (!ctx.bChase._bound) {
      ctx.bChase._bound = true;
      ctx.bChase.addEventListener("click", () => {
        KP.audio.unlock();
        const st = ctx.mz;
        if (!st.ready || st.won || ctx.level < 2) return; // 도착 축하 중에는 무시
        const on = !KP.store.get("maze:chase", false);
        KP.store.set("maze:chase", on);
        KP.audio.sfx(on ? "levelup" : "pop");
        KP.voice.say(on ? "술래잡기 도전! 친구가 쫓아와요. 먼저 도착해요!" : "술래잡기 끝! 천천히 가요.");
        // 새 판으로 바꾸지 않고, 지금 미로·지금 위치 그대로 술래만 들어오고 나감
        ctx.mzChaseOnOff(on);
        ctx.say(ctx.mzIntro(), false);
        paint();
      });
    }
    ctx.mzIntro = () => {
      const U = KP.u,
        st = ctx.mz;
      const [, cn, , gn] = st.pair;
      if (st.ch) return st.ch.e + " " + U.josa(st.ch.name, "이/가") + " 쫓아와요! " + st.pair[0] + " " + U.josa(cn, "을/를") + " " + gn + "까지 먼저 데려가요!";
      return st.pair[0] + " " + U.josa(cn, "을/를") + " 끌어서 " + st.pair[2] + " " + gn + "까지 데려다 줘요!";
    };
    ctx.pairIdx = KP.u.rand(ctx.PAIRS.length);
    this.next(ctx);
    ctx.loop((dt, now) => ctx.mzTick(dt, now));
  },
  next(ctx) {
    const st = ctx.mz;
    ctx.mzDrop && ctx.mzDrop();
    ctx.mzFit();
    const bw = ctx.body.clientWidth,
      bh = ctx.body.clientHeight;
    const land = bw >= bh;
    const ratio = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
    const phone = Math.min(bw, bh) < 560;
    let [a, b] = [[3, 3], [5, 4], [7, 6]][ctx.level - 1];
    // 1단계: 길쭉한 화면은 긴 쪽 칸을 늘려 화면을 채움 (폰 세로 3×5, 태블릿 4×3)
    if (ctx.level === 1) a = phone ? (ratio > 1.6 ? 5 : ratio > 1.25 ? 4 : 3) : ratio > 1.3 ? 4 : 3;
    const cols = land ? a : b;
    let rows = land ? b : a;
    // 세로로 긴 화면(폰 세로)은 2·3단계에서 칸 크기는 그대로 두고 아래 빈 곳을 줄로 채움 (2단계 최대 7줄, 3단계 최대 9줄)
    if (!land && ctx.level > 1 && st.W && st.H) {
      const top = st.H > st.W * 1.08 ? Math.min(70, st.H * 0.09) : 0,
        pad = Math.max(12, Math.min(st.W, st.H) * 0.025);
      const sw = (st.W - pad * 2) / (cols + 0.4);
      const fitRows = Math.floor((st.H - top - pad * 2) / sw - 0.6);
      rows = Math.max(rows, Math.min(fitRows, ctx.level === 2 ? 7 : 9));
    }
    ctx.mzRound(cols, rows);
    st.saidSpin = false;
    ctx.paintChase && ctx.paintChase();
    ctx.say(ctx.mzIntro());
    ctx.mzSetHint();
  },
});
