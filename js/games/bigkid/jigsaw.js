/* 조각 퍼즐 — 진짜 직소 조각을 끌어다 맞추기
   - 바탕판에 흐린 밑그림과 조각 자리 선, 맞는 자리 근처에 놓으면 착!
   - 크기 2×2 / 3×3 / 4×4 : 단계와 연동(1→2×2, 2→3×3, 3→4×4), 버튼으로도 고를 수 있음
   - 그림: 내장 장면 6개(일러스트로 그린 장면) + 📷 내 사진(영구 저장, 썸네일 목록)
   - 조각은 볼록/오목 탭이 있는 직소 모양, 완성하면 경계선이 스르륵 사라지며 큰 축하 */
"use strict";
KP.game({
  id: "jigsaw",
  icon: "🧩",
  name: "조각 퍼즐",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("jigsaw", `
      .jgTools{display:flex;gap:clamp(6px,1.4vw,12px);justify-content:center;align-items:center;padding:2px 10px 8px;flex:0 0 auto;flex-wrap:nowrap}
      .jgSize{min-width:clamp(72px,9vw,90px);height:clamp(62px,7.4vw,72px);border-radius:18px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);display:flex;align-items:center;justify-content:center;padding:6px}
      .jgSize.sel{background:var(--sun);box-shadow:0 5px 0 #d9a000}
      .jgGrid{display:grid;gap:2px;width:clamp(30px,4.2vw,40px);height:clamp(30px,4.2vw,40px)}
      .jgGrid i{background:#6a76a3;border-radius:2px}
      .jgSize.sel .jgGrid i{background:#2f3a66}
      .jgPicBtn{height:clamp(54px,7.4vw,66px);border-radius:18px;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.14);display:flex;align-items:center;gap:6px;padding:5px 12px 5px 5px;font-size:clamp(17px,2.4vw,22px)}
      .jgPicBtn img.th{height:100%;aspect-ratio:1;border-radius:12px;object-fit:cover}
      .jgPicBtn .e{font-size:1.4em}
      .jgBoard{background:linear-gradient(180deg,#fff9ec,#ffeccc)}
      .board .jgSpot{position:absolute;pointer-events:none;border-radius:16px;left:0;top:0}
      .jgPick{position:absolute;inset:0;z-index:20;background:rgba(255,247,227,.97);display:none;flex-direction:column;padding:10px 14px 14px;border-radius:24px}
      .jgPick.on{display:flex;animation:popIn .3s}
      .jgPickTop{display:flex;justify-content:space-between;align-items:center;font-size:clamp(20px,3vw,28px);padding:0 4px 8px}
      .jgPickList{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(100px,16vw,160px),1fr));gap:clamp(10px,1.8vw,18px);align-content:start;padding:6px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
      .jgTh{position:relative;aspect-ratio:1;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.14);border:4px solid #fff}
      .jgTh img{width:100%;height:100%;object-fit:cover;display:block}
      .jgTh.cur{border-color:var(--sun)}
      .jgTh.add{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(36px,5.4vw,56px);gap:2px;background:#e9f6ff;padding:4px}
      .jgTh.add span{font-size:clamp(17px,2.4vw,22px);color:var(--ocean)}
      .jgTh .del{position:absolute;right:6px;top:6px;width:48px;height:48px;border-radius:50%;background:#fff;font-size:28px;display:none;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15)}
      .jgTh.armed .del{display:flex}
      .jgTh .badge{position:absolute;left:6px;bottom:6px;font-size:26px;line-height:1}
    `);

    /* ---------- 화면 ---------- */
    const tools = U.el("div", "jgTools");
    const board = U.el("div", "board jgBoard");
    const cv = U.el("canvas");
    const spot = U.el("div", "jgSpot");
    const pick = U.el("div", "jgPick");
    board.append(cv, spot);
    ctx.body.append(tools, board, pick);
    ctx.body.style.position = "relative";
    const cx = cv.getContext("2d");

    const sizeBtns = [2, 3, 4].map((n) => {
      const b = U.btn('<div class="jgGrid" style="grid-template-columns:repeat(' + n + ',1fr)">' + "<i></i>".repeat(n * n) + "</div>", "jgSize");
      b.dataset.n = n;
      ctx.tap(b, () => {
        A.sfx("select");
        U.replay(b, "pop");
        ctx.sizePick = n;
        KP.voice.say(["", "", "네 조각!", "아홉 조각!", "열여섯 조각!"][n]);
        ctx.def.next(ctx, true);
      });
      tools.appendChild(b);
      return b;
    });
    const picBtn = U.btn("", "jgPicBtn");
    tools.appendChild(picBtn);
    ctx.tap(picBtn, () => {
      A.sfx("open");
      openPicker();
    });

    /* ---------- 내장 장면 그리기 ---------- */
    const SZ = 800;
    const SCENES = [
      {
        name: "농장",
        em: ["☀️", "🏠", "🌳", "🐄", "🐷", "🐥", "🚜", "🌼"],
        draw(g) {
          sky(g, "#8fd8ff", "#e4f7ff", 0.62);
          cloud(g, 300, 120, 1);
          cloud(g, 560, 230, 0.7);
          g.fillStyle = "#86d36e";
          g.beginPath();
          g.moveTo(0, 470);
          g.quadraticCurveTo(260, 390, 520, 460);
          g.quadraticCurveTo(700, 500, 800, 440);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          g.fillStyle = "#6cc257";
          g.fillRect(0, 640, 800, 160);
          E(g, "☀️", 660, 120, 170);
          E(g, "🏠", 190, 400, 230);
          E(g, "🌳", 640, 400, 230);
          E(g, "🐄", 390, 590, 230);
          E(g, "🐷", 650, 680, 170);
          E(g, "🐥", 140, 700, 130);
          E(g, "🌼", 280, 730, 80);
          E(g, "🌼", 500, 760, 70);
        },
      },
      {
        name: "바다",
        em: ["⛵", "☀️", "🐳", "🐠", "🐙", "🦀", "🐬", "🐚"],
        draw(g) {
          sky(g, "#bfeaff", "#e9f8ff", 0.25);
          const sea = g.createLinearGradient(0, 200, 0, 800);
          sea.addColorStop(0, "#38b6ff");
          sea.addColorStop(1, "#1a5fc4");
          g.fillStyle = sea;
          g.fillRect(0, 200, 800, 600);
          g.fillStyle = "rgba(255,255,255,.5)";
          for (let x = 0; x < 800; x += 80) {
            g.beginPath();
            g.arc(x + 40, 205, 40, Math.PI, 0);
            g.fill();
          }
          g.fillStyle = "#f6d68e";
          g.beginPath();
          g.moveTo(0, 720);
          g.quadraticCurveTo(400, 650, 800, 730);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          E(g, "☀️", 120, 90, 130);
          E(g, "⛵", 600, 120, 170);
          E(g, "🐳", 250, 360, 250);
          E(g, "🐠", 620, 330, 140);
          E(g, "🐬", 560, 510, 170);
          E(g, "🐙", 230, 610, 180);
          E(g, "🦀", 640, 720, 130);
          E(g, "🐚", 420, 735, 90);
        },
      },
      {
        name: "우주",
        em: ["🌙", "🚀", "🪐", "🛸", "🌍", "⭐"],
        draw(g) {
          sky(g, "#141a4d", "#3b2b80", 1);
          for (let k = 0; k < 120; k++) {
            g.fillStyle = "rgba(255,255,255," + (0.4 + Math.random() * 0.6) + ")";
            g.beginPath();
            g.arc(Math.random() * 800, Math.random() * 800, 1 + Math.random() * 2.5, 0, 7);
            g.fill();
          }
          E(g, "🌙", 650, 140, 190);
          E(g, "🚀", 220, 300, 250, -0.4);
          E(g, "🪐", 590, 460, 220);
          E(g, "🛸", 230, 630, 190);
          E(g, "🌍", 640, 700, 150);
          E(g, "⭐", 420, 170, 80);
          E(g, "⭐", 420, 560, 60);
          E(g, "⭐", 90, 470, 60);
        },
      },
      {
        name: "공룡 나라",
        em: ["🌋", "🦖", "🦕", "🌴", "🥚", "☁️"],
        draw(g) {
          sky(g, "#ffc98a", "#fff1d6", 0.6);
          E(g, "🌋", 590, 270, 300);
          g.fillStyle = "#9fd36a";
          g.beginPath();
          g.moveTo(0, 480);
          g.quadraticCurveTo(400, 420, 800, 490);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          g.fillStyle = "#86c257";
          g.fillRect(0, 690, 800, 110);
          E(g, "☁️", 220, 110, 150);
          E(g, "🌴", 110, 360, 230);
          E(g, "🦕", 590, 580, 270);
          E(g, "🦖", 260, 560, 270);
          E(g, "🥚", 430, 730, 100);
          E(g, "🥚", 500, 750, 80);
        },
      },
      {
        name: "자동차 마을",
        em: ["🚒", "🚓", "🚌", "🚁", "☀️", "🌳"],
        draw(g) {
          sky(g, "#9fdcff", "#eaf8ff", 0.6);
          const cols = ["#ff8a80", "#ffd54f", "#81d4fa", "#a5d6a7", "#ce93d8"];
          let x = 0;
          for (let k = 0; x < 800; k++) {
            const w = 110 + (k % 3) * 30,
              h = 200 + ((k * 73) % 160);
            g.fillStyle = cols[k % cols.length];
            g.fillRect(x, 480 - h, w - 8, h);
            g.fillStyle = "rgba(255,255,255,.75)";
            for (let yy = 480 - h + 20; yy < 450; yy += 44) for (let xx = x + 14; xx < x + w - 34; xx += 34) g.fillRect(xx, yy, 20, 24);
            x += w;
          }
          g.fillStyle = "#7cc96b";
          g.fillRect(0, 470, 800, 60);
          g.fillStyle = "#5b6475";
          g.fillRect(0, 530, 800, 270);
          g.fillStyle = "#fff";
          for (let xx = 20; xx < 800; xx += 110) g.fillRect(xx, 660, 60, 12);
          E(g, "☀️", 680, 90, 130);
          E(g, "🚁", 230, 120, 170);
          E(g, "🌳", 740, 440, 120);
          E(g, "🚌", 600, 590, 200);
          E(g, "🚒", 200, 600, 210);
          E(g, "🚓", 420, 730, 160);
        },
      },
      {
        name: "동물원",
        em: ["🦁", "🐘", "🦒", "🐒", "🌴", "🦜", "☀️"],
        draw(g) {
          sky(g, "#b6ecff", "#f2fbff", 0.55);
          g.fillStyle = "#e9c46a";
          g.beginPath();
          g.moveTo(0, 520);
          g.quadraticCurveTo(400, 470, 800, 520);
          g.lineTo(800, 800);
          g.lineTo(0, 800);
          g.fill();
          E(g, "☀️", 110, 100, 130);
          E(g, "🌴", 700, 330, 240);
          E(g, "🦒", 160, 400, 300);
          E(g, "🦜", 640, 150, 120);
          E(g, "🐘", 440, 520, 260);
          E(g, "🦁", 220, 680, 200);
          E(g, "🐒", 640, 680, 180);
        },
      },
    ];
    function sky(g, a, b, frac) {
      const gr = g.createLinearGradient(0, 0, 0, SZ * frac);
      gr.addColorStop(0, a);
      gr.addColorStop(1, b);
      g.fillStyle = gr;
      g.fillRect(0, 0, SZ, SZ);
    }
    function cloud(g, x, y, k) {
      g.fillStyle = "rgba(255,255,255,.95)";
      [[0, 0, 50], [45, -20, 42], [85, 5, 40], [-40, 10, 34]].forEach(([dx, dy, r]) => {
        g.beginPath();
        g.arc(x + dx * k, y + dy * k, r * k, 0, 7);
        g.fill();
      });
    }
    function E(g, em, x, y, size, rot) {
      g.save();
      g.shadowColor = "rgba(0,0,0,.18)";
      g.shadowBlur = 10;
      g.shadowOffsetY = 6;
      KP.drawE(g, em, x, y, size, rot || 0);
      g.restore();
    }

    ctx.pics = [];
    ctx.picIdx = 0;
    const allEm = SCENES.flatMap((s) => s.em);
    ctx.picsReady = KP.loadE(allEm).then(async () => {
      SCENES.forEach((sc) => {
        const c = document.createElement("canvas");
        c.width = c.height = SZ;
        sc.draw(c.getContext("2d"));
        ctx.pics.push({ id: "scene:" + sc.name, kind: "scene", name: sc.name, src: c, thumb: c.toDataURL("image/jpeg", 0.7) });
      });
      const photos = (await KP.db.all("photos")).filter((p) => p.kind === "jigsaw");
      for (const p of photos) ctx.pics.push(await photoPic(p));
    });
    function photoPic(p) {
      return new Promise((res) => {
        const im = new Image();
        const o = { id: p.id, kind: "photo", name: "내 사진", src: im, thumb: p.img };
        im.onload = () => res(o);
        im.onerror = () => res(o);
        im.src = p.img;
      });
    }

    /* ---------- 그림 고르기 ---------- */
    function openPicker() {
      pick.innerHTML = "";
      const top = U.el("div", "jgPickTop", "<span>" + KP.E("🖼️") + " 어떤 그림으로 할까요?</span>");
      const close = U.btn(KP.E("✖️"), "barBtn");
      ctx.tap(close, () => {
        A.sfx("back");
        pick.classList.remove("on");
      });
      top.appendChild(close);
      const list = U.el("div", "jgPickList");
      const add = U.el("button", "jgTh add", KP.E("📷") + "<span>내 사진</span>");
      ctx.tap(add, async () => {
        A.sfx("tap");
        const got = await KP.pickPhotos(false, 800);
        if (!got || !got.length) return;
        if (!ctx._active) return;
        const rec = { id: KP.newId(), kind: "jigsaw", img: got[0], t: Date.now() };
        const saved = await KP.db.put("photos", rec);
        if (saved === false) KP.toast("사진을 저장하지 못했어요. 이번에만 쓸 수 있어요");
        KP.persist && KP.persist();
        const p = await photoPic(rec);
        ctx.pics.push(p);
        pick.classList.remove("on");
        ctx.picIdx = ctx.pics.length - 1;
        KP.voice.say("내 사진 퍼즐이에요!");
        ctx.def.next(ctx, true);
      });
      list.appendChild(add);
      ctx.pics.forEach((p, k) => {
        const th = U.el("button", "jgTh" + (k === ctx.picIdx ? " cur" : ""), '<img src="' + KP.safeImg(p.thumb) + '" alt="" draggable="false">');
        if (p.kind === "photo") {
          th.appendChild(U.el("span", "badge", KP.E("📷")));
          // 어른용: 1초 꾹 누르면 지우기 버튼
          const del = U.el("span", "del", KP.E("🗑️"));
          th.appendChild(del);
          let hold = 0;
          th.addEventListener("pointerdown", () => (hold = setTimeout(() => (th.classList.add("armed"), A.sfx("pop")), 1000)));
          ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => th.addEventListener(ev, () => clearTimeout(hold)));
          del.addEventListener("click", async (e) => {
            e.stopPropagation();
            await KP.db.del("photos", p.id);
            const i = ctx.pics.indexOf(p);
            ctx.pics.splice(i, 1);
            if (ctx.picIdx >= ctx.pics.length) ctx.picIdx = 0;
            A.sfx("whoosh");
            openPicker();
          });
        }
        ctx.tap(th, () => {
          if (th.classList.contains("armed")) return;
          A.sfx("select");
          ctx.picIdx = k;
          pick.classList.remove("on");
          KP.voice.say(p.kind === "photo" ? "내 사진 퍼즐!" : p.name + " 퍼즐!");
          ctx.def.next(ctx, true);
        });
        list.appendChild(th);
      });
      pick.append(top, list);
      pick.classList.add("on");
    }
    ctx.jgClosePicker = () => pick.classList.remove("on");

    /* ---------- 조각 모양 ---------- */
    // 탭(볼록) 모양: 가장자리 방향 u(0..1), 바깥 방향 v(칸 크기 비율)
    const TAB = [
      ["L", 0.34, 0],
      ["C", 0.4, 0, 0.43, 0.04, 0.4, 0.1],
      ["C", 0.35, 0.2, 0.42, 0.28, 0.5, 0.28],
      ["C", 0.58, 0.28, 0.65, 0.2, 0.6, 0.1],
      ["C", 0.57, 0.04, 0.6, 0, 0.66, 0],
      ["L", 1, 0],
    ];
    const PADR = 0.32; // 조각 그림 여백(탭이 튀어나올 자리)
    function piecePath(pc, s) {
      const p = new Path2D();
      const C = [[0, 0], [s, 0], [s, s], [0, s]];
      const NRM = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      p.moveTo(0, 0);
      for (let e = 0; e < 4; e++) {
        const [ax, ay] = C[e],
          [bx, by] = C[(e + 1) % 4],
          [nx, ny] = NRM[e],
          t = pc.edges[e];
        const m = (u, v) => [ax + (bx - ax) * u + nx * s * v * t, ay + (by - ay) * u + ny * s * v * t];
        if (!t) {
          p.lineTo(bx, by);
          continue;
        }
        for (const sg of TAB) {
          if (sg[0] === "L") p.lineTo(...m(sg[1], sg[2]));
          else p.bezierCurveTo(...m(sg[1], sg[2]), ...m(sg[3], sg[4]), ...m(sg[5], sg[6]));
        }
      }
      p.closePath();
      return p;
    }

    /* ---------- 상태 · 배치 ---------- */
    let W = 0,
      H = 0;
    const st = (ctx.jg = { pieces: [], n: 2, ready: false });
    function fit() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = board.clientWidth;
      H = board.clientHeight;
      if (!W || !H) return;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      if (st.ready) layout(true);
    }
    ctx.jgFit = fit;
    addEventListener("resize", () => ctx._active && fit());

    function layout(keep) {
      const n = st.n;
      const land = W >= H * 1.05;
      const gap = 14;
      let F;
      if (land) {
        F = Math.min(H - gap * 2, W * 0.56);
        st.fx = gap + Math.max(0, (W * 0.58 - F) / 2);
        st.fy = (H - F) / 2;
        st.tray = { x: st.fx + F + gap, y: gap, w: W - (st.fx + F + gap) - gap, h: H - gap * 2 };
      } else {
        F = Math.min(W - gap * 2, H * 0.56);
        st.fx = (W - F) / 2;
        st.fy = gap;
        st.tray = { x: gap, y: st.fy + F + gap, w: W - gap * 2, h: H - (st.fy + F + gap) - gap };
      }
      st.F = F;
      const s = (st.s = F / n);
      // 조각 그림 만들기
      const pad = s * PADR,
        full = s + pad * 2,
        d = Math.min(devicePixelRatio || 1, 2);
      st.pieces.forEach((pc) => {
        pc.path = piecePath(pc, s);
        const c = document.createElement("canvas");
        c.width = c.height = Math.ceil(full * d);
        const g = c.getContext("2d");
        g.setTransform(d, 0, 0, d, 0, 0);
        g.translate(pad, pad);
        g.save();
        g.clip(pc.path);
        g.drawImage(st.img, -pc.i * s, -pc.j * s, F, F);
        g.restore();
        g.lineJoin = "round";
        g.strokeStyle = "rgba(255,255,255,.75)";
        g.lineWidth = 3;
        g.stroke(pc.path);
        g.strokeStyle = "rgba(60,50,40,.45)";
        g.lineWidth = 1.4;
        g.stroke(pc.path);
        pc.cv = c;
        pc.full = full;
        pc.cx = st.fx + (pc.i + 0.5) * s;
        pc.cy = st.fy + (pc.j + 0.5) * s;
      });
      // 바구니(쟁반) 자리
      const T = st.tray,
        loose = st.pieces.filter((p) => !p.placed);
      const cnt = st.pieces.length;
      let best = { c: 0, cols: 1, rows: 1 };
      for (let cols = 1; cols <= cnt; cols++) {
        const rows = Math.ceil(cnt / cols);
        const c = Math.min(T.w / cols, T.h / rows);
        if (c > best.c) best = { c, cols, rows };
      }
      st.ts = Math.min(1, (best.c * 0.8) / s);
      const slots = [];
      for (let k = 0; k < cnt; k++) {
        const col = k % best.cols,
          row = Math.floor(k / best.cols);
        slots.push({
          x: T.x + (T.w - best.c * best.cols) / 2 + (col + 0.5) * best.c,
          y: T.y + (T.h - best.c * best.rows) / 2 + (row + 0.5) * best.c,
        });
      }
      const order = keep ? loose : U.shuffle([...loose]);
      order.forEach((pc, k) => {
        const sl = slots[k];
        pc.hx = sl.x + U.randf(-0.06, 0.06) * best.c;
        pc.hy = sl.y + U.randf(-0.06, 0.06) * best.c;
        if (!keep || !pc.moved) {
          pc.x = pc.hx;
          pc.y = pc.hy;
        } else {
          pc.x = U.clamp(pc.x, 0, W);
          pc.y = U.clamp(pc.y, 0, H);
        }
        pc.sc = st.ts;
        pc.tsc = st.ts;
      });
      st.pieces.filter((p) => p.placed).forEach((pc) => {
        pc.x = pc.tx = pc.cx;
        pc.y = pc.ty = pc.cy;
        pc.sc = pc.tsc = 1;
      });
    }

    /* ---------- 그리기 ---------- */
    function draw(now, dt) {
      if (!W || !st.ready) return;
      cx.clearRect(0, 0, W, H);
      const { fx, fy, F, s } = st;
      // 바탕판
      cx.save();
      cx.fillStyle = "#fff";
      cx.shadowColor = "rgba(47,58,102,.18)";
      cx.shadowBlur = 14;
      cx.shadowOffsetY = 6;
      cx.fillRect(fx - 6, fy - 6, F + 12, F + 12);
      cx.restore();
      cx.globalAlpha = st.n === 2 ? 0.32 : 0.24;
      cx.drawImage(st.img, fx, fy, F, F);
      cx.globalAlpha = 1;
      cx.save();
      cx.translate(fx, fy);
      cx.strokeStyle = "rgba(47,58,102,.22)";
      cx.lineWidth = 2;
      cx.setLineDash([6, 6]);
      st.pieces.forEach((pc) => {
        if (pc.placed) return;
        cx.save();
        cx.translate(pc.i * s, pc.j * s);
        cx.stroke(pc.path);
        cx.restore();
      });
      cx.restore();
      // 쟁반 바탕
      const T = st.tray;
      cx.fillStyle = "rgba(255,197,49,.13)";
      rr(T.x, T.y, T.w, T.h, 22);
      cx.fill();
      // 조각 (움직임 보간)
      const k = Math.min(1, dt * 14);
      for (const pc of st.order) {
        if (pc.anim) {
          pc.x += (pc.tx - pc.x) * k;
          pc.y += (pc.ty - pc.y) * k;
          if (Math.hypot(pc.tx - pc.x, pc.ty - pc.y) < 0.6) {
            pc.x = pc.tx;
            pc.y = pc.ty;
            pc.anim = false;
          }
        }
        pc.sc += (pc.tsc - pc.sc) * k;
        if (st.done && pc.placed) continue;
        const size = pc.full * pc.sc;
        cx.save();
        if (pc === st.drag) {
          cx.shadowColor = "rgba(0,0,0,.3)";
          cx.shadowBlur = 16;
          cx.shadowOffsetY = 10;
        } else if (!pc.placed) {
          cx.shadowColor = "rgba(0,0,0,.18)";
          cx.shadowBlur = 6;
          cx.shadowOffsetY = 3;
        }
        cx.drawImage(pc.cv, pc.x - size / 2, pc.y - size / 2, size, size);
        cx.restore();
        if (pc.flash > 0) {
          pc.flash -= dt * 2;
          cx.save();
          cx.globalAlpha = Math.max(0, pc.flash) * 0.6;
          cx.translate(pc.x - (s * pc.sc) / 2, pc.y - (s * pc.sc) / 2);
          cx.scale(pc.sc, pc.sc);
          cx.fillStyle = "#fff";
          cx.fill(pc.path);
          cx.restore();
        }
      }
      // 완성: 경계선이 사라지며 온전한 그림으로
      if (st.done) {
        const a = Math.min(1, (now - st.doneAt) / 900);
        st.order.forEach((pc) => {
          if (!pc.placed) return;
          const size = pc.full;
          cx.globalAlpha = 1 - a;
          cx.drawImage(pc.cv, pc.x - size / 2, pc.y - size / 2, size, size);
        });
        cx.globalAlpha = a;
        cx.drawImage(st.img, fx, fy, F, F);
        cx.globalAlpha = 1;
        // 반짝 지나가기
        const sw = ((now - st.doneAt) / 1200) % 1.6;
        if (sw < 1) {
          cx.save();
          cx.beginPath();
          cx.rect(fx, fy, F, F);
          cx.clip();
          const gx = fx - F * 0.3 + sw * F * 1.6;
          const gr = cx.createLinearGradient(gx - F * 0.15, fy, gx + F * 0.15, fy + F * 0.2);
          gr.addColorStop(0, "rgba(255,255,255,0)");
          gr.addColorStop(0.5, "rgba(255,255,255,.55)");
          gr.addColorStop(1, "rgba(255,255,255,0)");
          cx.fillStyle = gr;
          cx.fillRect(fx, fy, F, F);
          cx.restore();
        }
      }
      // 힌트 자리 표시
      const hp = st.order.find((p) => !p.placed);
      if (hp) {
        spot.style.left = hp.x + "px";
        spot.style.top = hp.y + "px";
        spot.style.width = spot.style.height = s * hp.sc + "px";
        spot.style.margin = (-s * hp.sc) / 2 + "px 0 0 " + (-s * hp.sc) / 2 + "px";
      }
    }
    function rr(x, y, w, h, r) {
      cx.beginPath();
      cx.moveTo(x + r, y);
      cx.arcTo(x + w, y, x + w, y + h, r);
      cx.arcTo(x + w, y + h, x, y + h, r);
      cx.arcTo(x, y + h, x, y, r);
      cx.arcTo(x, y, x + w, y, r);
      cx.closePath();
    }
    ctx.jgDraw = draw;
    ctx.jgLayout = layout;

    /* ---------- 손가락 ---------- */
    const P = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    let pid = null,
      off = { x: 0, y: 0 },
      lastTalk = 0;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (!st.ready || st.done || pid !== null) return;
      const q = P(e);
      for (let k = st.order.length - 1; k >= 0; k--) {
        const pc = st.order[k];
        if (pc.placed) continue;
        const half = (st.s * pc.sc) / 2 + st.s * 0.12 * pc.sc;
        if (Math.abs(q.x - pc.x) <= half && Math.abs(q.y - pc.y) <= half) {
          pid = e.pointerId;
          try {
            cv.setPointerCapture(pid);
          } catch (_) {}
          st.drag = pc;
          pc.anim = false;
          pc.tsc = 1;
          off = { x: pc.x - q.x, y: pc.y - q.y };
          // 확대될 때 손가락 아래에 머물도록
          off.x /= Math.max(pc.sc, 0.01);
          off.y /= Math.max(pc.sc, 0.01);
          st.order.splice(k, 1);
          st.order.push(pc);
          A.sfx("pick");
          return;
        }
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || !st.drag) return;
      e.preventDefault();
      const q = P(e),
        pc = st.drag;
      pc.x = q.x + off.x * pc.sc;
      pc.y = q.y + off.y * pc.sc;
      pc.moved = true;
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      const pc = st.drag;
      st.drag = null;
      if (!pc) return;
      const near = Math.hypot(pc.x - pc.cx, pc.y - pc.cy) < st.s * 0.42;
      const inFrame = pc.x > st.fx && pc.x < st.fx + st.F && pc.y > st.fy && pc.y < st.fy + st.F;
      if (near) {
        pc.placed = true;
        pc.tx = pc.cx;
        pc.ty = pc.cy;
        pc.anim = true;
        pc.tsc = 1;
        pc.flash = 1;
        // 맞춘 조각은 아래층으로
        st.order.splice(st.order.indexOf(pc), 1);
        st.order.unshift(pc);
        A.sfx("snap");
        const left = st.pieces.filter((p) => !p.placed).length;
        if (left === 0) finish();
        else {
          if (Math.random() < 0.5) KP.voice.say(U.pick(["착!", "딱 맞아요!", "좋아요!", "맞았다!"]));
          setHint();
        }
      } else if (inFrame) {
        // 다른 자리: 부드럽게 쟁반으로 돌아가기
        pc.tx = pc.hx;
        pc.ty = pc.hy;
        pc.anim = true;
        pc.tsc = st.ts;
        pc.moved = false;
        A.sfx("boing");
        const now = performance.now();
        if (now - lastTalk > 3500) {
          lastTalk = now;
          KP.voice.say(U.pick(["여기는 아니에요. 흐린 그림을 잘 봐요!", "다른 자리일까? 다시 해 봐요!", "아깝다! 그림이 이어지는 곳을 찾아봐요."]));
        }
      } else {
        // 쟁반 위: 놓은 자리에 그대로
        pc.hx = U.clamp(pc.x, st.s * 0.3, W - st.s * 0.3);
        pc.hy = U.clamp(pc.y, st.s * 0.3, H - st.s * 0.3);
        pc.tx = pc.hx;
        pc.ty = pc.hy;
        pc.anim = true;
        pc.tsc = st.ts;
        A.sfx("drop");
      }
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);

    function setHint() {
      ctx.hint(() => spot, "조각을 끌어서 그림 자리에 맞춰 봐요!");
    }
    ctx.jgSetHint = setHint;

    async function finish() {
      st.done = true;
      st.doneAt = performance.now() + 250;
      ctx.hint(null);
      await ctx.wait(450);
      A.sfx("sparkle");
      KP.voice.say("와! 그림이 완성됐어요!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1300);
      if (!ctx._active) return;
      const ok = await ctx.win({ big: true, msg: ctx.round % 4 === 0 ? "퍼즐 박사 형아!" : "퍼즐 완성!" });
      if (ok) {
        ctx.picIdx = (ctx.picIdx + 1) % ctx.pics.length;
        ctx.def.next(ctx);
      }
    }

    ctx.jgUpdateTools = () => {
      sizeBtns.forEach((b) => b.classList.toggle("sel", +b.dataset.n === st.n));
      const p = ctx.pics[ctx.picIdx];
      picBtn.innerHTML = (p ? '<img class="th" src="' + KP.safeImg(p.thumb) + '" alt="">' : "") + KP.E("🖼️");
    };
  },
  start(ctx) {
    ctx.round = 0;
    ctx.sizePick = 0;
    ctx.jgClosePicker();
    ctx.jg.ready = false;
    ctx.picsReady.then(() => {
      if (!ctx._active) return;
      this.next(ctx);
    });
    ctx.loop((dt, now) => ctx.jgDraw(now, dt));
  },
  next(ctx, manual) {
    const U = KP.u;
    const st = ctx.jg;
    if (!ctx.pics.length) return;
    ctx.lastLevel = ctx.lastLevel || ctx.level;
    if (ctx.level !== ctx.lastLevel) {
      ctx.sizePick = 0; // 단계가 바뀌면 단계 크기로
      ctx.lastLevel = ctx.level;
    }
    const n = ctx.sizePick || ctx.level + 1;
    st.n = n;
    st.img = ctx.pics[ctx.picIdx % ctx.pics.length].src;
    st.done = false;
    st.drag = null;
    const H = [],
      V = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      H[j * n + i] = U.pick([1, -1]); // 오른쪽 가장자리
      V[j * n + i] = U.pick([1, -1]); // 아래 가장자리
    }
    st.pieces = [];
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const top = j === 0 ? 0 : -V[(j - 1) * n + i],
          right = i === n - 1 ? 0 : H[j * n + i],
          bottom = j === n - 1 ? 0 : V[j * n + i],
          left = i === 0 ? 0 : -H[j * n + i - 1];
        st.pieces.push({ i, j, edges: [top, right, bottom, left], placed: false, flash: 0 });
      }
    st.order = [...st.pieces];
    ctx.jgFit();
    st.ready = true;
    ctx.jgLayout(false);
    ctx.jgUpdateTools();
    if (!manual) ctx.say("조각을 끌어다 그림을 맞춰 봐요!");
    else ctx.say("조각을 끌어다 그림을 맞춰 봐요!", false);
    ctx.jgSetHint();
  },
});
