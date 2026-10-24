/* 생활 습관 놀이 공통 도우미 (KP.care) — 치카치카 양치(brush)·손 씻기(handwash)·동물 목욕(bath)·화장실(potty)
   - surface(ctx, host, o) : 문지르기 판. 얼룩(점) 목록을 손가락으로 문질러 지우고, 거품을 남기거나 지움.
       점 좌표는 '틀(frame)' 기준 0~1 이라 화면 크기가 바뀌어도 제자리에 다시 그려짐 (wipe.js 의 픽셀 지우기와 다름).
       점마다 문지른 거리(life)를 깎아서, 한 번 톡 누르기가 아니라 '문지르기'를 해야 지워짐.
       구역(zone)마다 85% 지우면 그 구역 완료 → 남은 얼룩은 스르륵.
   - routine(ctx, o) : 도구 줄(큰 버튼)로 순서대로 하기. mode 1 안내(정답 반짝) / 2 다음 할 일 고르기 / 3 혼자서.
   - pop(host, x, y, 글자) : 둥실 떠오르는 짧은 글자 ("치카", "끙!", "퉤!")
   이 파일은 놀이를 등록하지 않음. 각 놀이의 setup 안에서만 쓰므로 파일 순서와 상관없음. */
"use strict";
(function (KP) {
  const U = KP.u;
  const care = (KP.care = {});

  care.css = function () {
    KP.css("care", `
      .kc-scene{flex:1;min-height:0;position:relative;margin:0 12px 10px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;user-select:none;-webkit-user-select:none}
      .kc-cv{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;z-index:5}
      .kc-tool{position:absolute;left:0;top:0;width:var(--ts,90px);height:var(--ts,90px);margin:calc(var(--ts,90px)*-.5) 0 0 calc(var(--ts,90px)*-.5);pointer-events:none;z-index:7;display:none;
        filter:drop-shadow(0 6px 6px rgba(0,0,0,.25))}
      .kc-tool.on{display:block}
      .kc-tool .e{width:100%;height:100%;display:block}
      .kc-tool .kc-towel{width:100%;height:80%;margin-top:10%}
      .kc-bar{flex:0 0 auto;display:flex;justify-content:center;align-items:center;gap:clamp(6px,1.6vw,16px);padding:0 10px 10px;min-height:calc(clamp(64px,11vmin,100px) + 10px)}
      .kc-tb{position:relative;width:clamp(64px,11vmin,100px);height:clamp(64px,11vmin,100px);border-radius:22px;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.13);
        display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;flex:0 0 auto}
      @media (orientation: landscape) and (max-height: 500px){
        .kc-stage{flex-direction:row}
        .kc-stage .kc-bar{display:grid;grid-template-columns:repeat(2,auto);align-content:center;padding:0 10px 10px 0;min-height:0;min-width:calc(clamp(64px,11vmin,100px) * 2 + 16px)}
      }
      .kc-tb .e{width:62%;height:62%}
      .kc-tb .kc-towel{width:62%;height:48%}
      .kc-tb span{font-size:clamp(12px,1.7vmin,16px);color:var(--ink2);line-height:1.1;margin-top:2px;white-space:nowrap}
      .kc-tb:active{transform:translateY(3px)}
      .kc-tb.glow{animation:kc-glow 1.1s ease-in-out infinite alternate}
      @keyframes kc-glow{from{box-shadow:0 5px 0 rgba(0,0,0,.13),0 0 0 0 rgba(255,200,40,.0)}to{box-shadow:0 5px 0 rgba(0,0,0,.13),0 0 0 7px rgba(255,200,40,.75)}}
      .kc-bar.off .kc-tb{opacity:.55}
      .kc-towel{display:block;border-radius:12%;background:repeating-linear-gradient(90deg,#ff8fb1 0 18%,#ffd1df 18% 30%);box-shadow:inset 0 -18% 0 rgba(0,0,0,.08),inset 0 0 0 3px rgba(255,255,255,.6)}
      .kc-pop{position:absolute;z-index:8;pointer-events:none;white-space:nowrap;font-size:clamp(24px,4.4vmin,44px);color:#fff;-webkit-text-stroke:0;
        text-shadow:0 3px 0 rgba(0,0,0,.25),0 0 8px rgba(0,0,0,.15);transform:translate(-50%,-50%);animation:kc-pop 1.1s ease-out forwards}
      .kc-pop.big{font-size:clamp(40px,8vmin,80px)}
      @keyframes kc-pop{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}20%{opacity:1;transform:translate(-50%,-60%) scale(1.1)}100%{opacity:0;transform:translate(-50%,-160%) scale(1)}}
      .kc-zone{position:absolute;z-index:6;pointer-events:none;border-radius:16px;border:4px dashed rgba(255,255,255,.95);box-shadow:0 0 0 5px rgba(255,205,60,.55);opacity:0;transition:opacity .3s}
      .kc-zone.on{opacity:1;animation:kc-zone 1.3s ease-in-out infinite alternate}
      @keyframes kc-zone{from{box-shadow:0 0 0 3px rgba(255,205,60,.35)}to{box-shadow:0 0 0 9px rgba(255,205,60,.75)}}
      .kc-ask{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.35)}
      .kc-ask .qAns{gap:clamp(10px,2vw,22px)}
      .kc-ask .choice{width:clamp(92px,17vmin,150px);height:clamp(92px,17vmin,150px)}
      .kc-ask .choice .e{width:70%;height:70%}
      .kc-ask .choice.kc-glowc{animation:kc-glow 1.1s ease-in-out infinite alternate}
    `);
  };

  /** 둥실 떠오르는 짧은 글자 */
  care.pop = function (ctx, host, x, y, txt, big) {
    const e = U.el("div", "kc-pop" + (big ? " big" : ""), KP.E(txt));
    e.style.left = x + "px";
    e.style.top = y + "px";
    host.appendChild(e);
    ctx.after(1200, () => e.remove());
    return e;
  };

  /** 그림(이모지)의 실제 모양 안쪽 격자점 → 틀 기준 0~1 좌표 [{x,y}] (그림이 아직 안 불렸으면 둥근 모양으로) */
  care.maskPts = function (em, n = 16, inset = 0) {
    const N = 48,
      out = [];
    let mask = null;
    try {
      const c = document.createElement("canvas");
      c.width = c.height = N;
      const g = c.getContext("2d");
      KP.drawE(g, em, N / 2, N / 2, N);
      mask = g.getImageData(0, 0, N, N).data;
      let any = false;
      for (let i = 3; i < mask.length; i += 4)
        if (mask[i] > 60) {
          any = true;
          break;
        }
      if (!any) mask = null;
    } catch (e) {
      mask = null;
    }
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n,
          v = (j + 0.5) / n;
        let inside;
        if (mask) {
          const px = Math.min(N - 1, Math.floor(u * N)),
            py = Math.min(N - 1, Math.floor(v * N));
          inside = mask[(py * N + px) * 4 + 3] > 120;
        } else inside = (u - 0.5) ** 2 + (v - 0.5) ** 2 < 0.2;
        if (inside && u > inset && u < 1 - inset && v > inset && v < 1 - inset) out.push({ x: u, y: v });
      }
    return out;
  };

  /* ---------------- 문지르기 판 ---------------- */
  care.surface = function (ctx, host, o = {}) {
    const cv = U.el("canvas", "kc-cv"),
      g = cv.getContext("2d");
    const toolEl = U.el("div", "kc-tool");
    host.append(cv, toolEl);
    const S = {
      cv,
      toolEl,
      frame: o.frame || (() => ({ x: 0, y: 0, w: host.clientWidth, h: host.clientHeight })),
      spots: [],
      foam: [],
      parts: [],
      zones: {},
      radius: 0.07, // 문지르개 반지름 (틀 너비 비율)
      need: 0.85, // 구역 완료 비율
      on: false,
      mode: {},
      sound: o.sound || (() => KP.audio.sfx("rub")),
      onZone: null,
      onAll: null,
      onRub: null,
      lastRub: 0,
      rubbed: 0, // 이번 판 문지른 거리(px)
    };
    let W = 0,
      H = 0,
      dpr = 1,
      sess = -1,
      t = 0;
    function fit() {
      const w = host.clientWidth,
        h = host.clientHeight,
        d = Math.min(2, window.devicePixelRatio || 1);
      if (w === W && h === H && d === dpr) return;
      W = w;
      H = h;
      dpr = d;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
    }
    S.setTool = (html, size) => {
      toolEl.innerHTML = html;
      if (size) toolEl.style.setProperty("--ts", Math.round(size) + "px");
    };
    /** 판 비우기 (keepFoam: 거품은 남김 — 손 씻기·목욕에서 다음 동작으로 넘어갈 때) */
    S.reset = (keepFoam) => {
      S.spots = [];
      if (!keepFoam) S.foam = [];
      S.onZone = S.onAll = S.onRub = null;
      S.zones = {};
      S.on = false;
      S.rubbed = 0;
      toolEl.classList.remove("on");
    };
    /** 점 추가: {x,y(틀 0~1), r(틀 너비 비율), need(문지를 거리 = R 의 몇 배), zone, draw(g,px,py,pr,life,t)} */
    S.add = (list) => {
      for (const s of list) {
        s.life = 1;
        s.fade = false;
        s.zone = s.zone || "all";
        s.need = s.need || 2;
        s.r = s.r || 0;
        s.seed = s.seed || Math.random();
        S.spots.push(s);
        const z = (S.zones[s.zone] = S.zones[s.zone] || { total: 0, clean: 0, done: false });
        z.total++;
      }
    };
    S.prog = (zone) => {
      const z = S.zones[zone];
      return z ? (z.total ? z.clean / z.total : 1) : 1;
    };
    S.leftZones = () => Object.keys(S.zones).filter((k) => !S.zones[k].done);
    /** 남은 구역 중 가장 덜 닦인 곳 */
    S.leastZone = () => {
      let best = null,
        bp = 2;
      for (const k of S.leftZones()) {
        const p = S.prog(k);
        if (p < bp) {
          bp = p;
          best = k;
        }
      }
      return best;
    };
    /** 한 구역을 끝냄 (남은 얼룩은 스르륵) */
    S.finishZone = (k) => {
      const z = S.zones[k];
      if (!z || z.done) return;
      z.done = true;
      for (const s of S.spots) if (s.zone === k && s.life > 0) s.fade = true;
      S.onZone && S.onZone(k);
      if (!S.leftZones().length && S.onAll) {
        const f = S.onAll;
        S.onAll = null;
        f();
      }
    };
    S.clearFoam = () => S.foam.forEach((b) => (b.fade = true));
    S.clearSpots = () => S.spots.forEach((s) => s.life > 0 && (s.fade = true));
    /** 거품 하나 (틀 0~1 좌표) */
    S.bubble = (x, y, r) => {
      S.foam.push({ x, y, r, life: 1, fade: false, wob: Math.random() * 6 });
      if (S.foam.length > 420) S.foam.shift();
    };
    /** 반짝이·물방울 (화면 px 좌표) */
    S.burst = (x, y, n, kind = "star", spread = 1) => {
      const cols = kind === "drop" ? ["#7cc8ff", "#a8dcff", "#5fb4f5", "#ffffff"] : ["#ffd54a", "#ff9ed2", "#8fe0ff", "#ffffff", "#b6ff9c"];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28,
          sp = (60 + Math.random() * 220) * spread;
        S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80 * spread, life: 1, s: 3 + Math.random() * 6, c: U.pick(cols), kind });
      }
    };
    const toPx = (F, s) => [F.x + s.x * F.w, F.y + s.y * F.h];

    function rubSeg(x1, y1, x2, y2) {
      const F = S.frame();
      const R = S.radius * F.w;
      const dx = x2 - x1,
        dy = y2 - y1,
        len = Math.hypot(dx, dy),
        L2 = dx * dx + dy * dy || 1;
      S.rubbed += len;
      S.lastRub = Date.now();
      const hit = (px, py, rr) => {
        let tt = ((px - x1) * dx + (py - y1) * dy) / L2;
        tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        const ex = x1 + dx * tt - px,
          ey = y1 + dy * tt - py;
        return ex * ex + ey * ey <= (R + rr) * (R + rr);
      };
      if (len > 0)
        for (const s of S.spots) {
          if (s.life <= 0 || s.fade) continue;
          const [px, py] = toPx(F, s);
          if (!hit(px, py, s.r * F.w * 0.5)) continue;
          s.life -= len / (s.need * R);
          if (s.life <= 0.02) {
            s.life = 0;
            const z = S.zones[s.zone];
            z.clean++;
            if (!z.done && z.clean / z.total >= S.need) S.finishZone(s.zone);
          }
        }
      if (S.mode.unfoam)
        for (const b of S.foam) {
          if (b.fade) continue;
          const [px, py] = toPx(F, b);
          if (hit(px, py, 0)) b.fade = true;
        }
      // 거품 남기기 (지나간 거리만큼)
      if (S.mode.foam) {
        S._fa = (S._fa || 0) + len;
        while (S._fa > R * 0.28) {
          S._fa -= R * 0.28;
          const a = Math.random() * 6.28,
            d = Math.random() * R * 0.9;
          S.bubble((x2 + Math.cos(a) * d - F.x) / F.w, (y2 + Math.sin(a) * d - F.y) / F.h, (0.18 + Math.random() * 0.3) * S.radius);
        }
      }
      S._pa = (S._pa || 0) + len;
      if (S._pa > 26) {
        S._pa = 0;
        if (S.mode.drops) S.burst(x2, y2 + R * 0.3, 2, "drop", 0.5);
        else if (S.mode.sparkle) S.burst(x2, y2, 1, "star", 0.4);
      }
      S._sa = (S._sa || 0) + len;
      if (S._sa > 24) {
        S._sa = 0;
        S.sound();
      }
      S.onRub && S.onRub(x2, y2, len);
    }

    let pid = null,
      last = null;
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const moveTool = (p) => {
      toolEl.style.transform = "translate(" + p[0] + "px," + p[1] + "px) rotate(" + Math.sin(t * 18) * 8 + "deg)";
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      KP.audio.unlock();
      if (!S.on || pid !== null) return;
      pid = e.pointerId;
      try {
        cv.setPointerCapture(pid);
      } catch (_) {}
      last = pos(e);
      rubSeg(last[0], last[1], last[0], last[1]);
      moveTool(last);
      toolEl.classList.add("on");
    });
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      e.preventDefault();
      if (!S.on) return;
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of list.length ? list : [e]) {
        const p = pos(ev);
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) continue;
        rubSeg(last[0], last[1], p[0], p[1]);
        last = p;
        if (!S.on) break;
      }
      moveTool(last);
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      toolEl.classList.remove("on");
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("lostpointercapture", up);

    /** 그리기 반복 시작 (판마다 불러도 됨 — 이번 화면 들어온 뒤 한 번만 돔) */
    S.run = () => {
      if (sess === ctx._session) return;
      sess = ctx._session;
      ctx.loop((dt) => {
        t += dt;
        fit();
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, W, H);
        const F = S.frame();
        // 얼룩
        for (const s of S.spots) {
          if (s.fade) {
            s.life -= dt * 2.2;
            if (s.life <= 0) {
              s.life = 0;
              s.fade = false;
            }
          }
          if (s.life <= 0 || !s.draw) continue;
          const [px, py] = toPx(F, s);
          g.save();
          s.draw(g, px, py, s.r * F.w, s.life, t, s);
          g.restore();
        }
        // 거품
        if (S.foam.length) {
          for (let i = S.foam.length - 1; i >= 0; i--) {
            const b = S.foam[i];
            if (b.fade) {
              b.life -= dt * 2.5;
              if (b.life <= 0) {
                S.foam.splice(i, 1);
                continue;
              }
            }
            const [px, py] = toPx(F, b);
            const r = b.r * F.w * (0.9 + 0.1 * Math.sin(t * 3 + b.wob));
            g.globalAlpha = Math.max(0, b.life);
            g.fillStyle = "rgba(255,255,255,.88)";
            g.beginPath();
            g.arc(px, py, r, 0, 6.283);
            g.fill();
            g.strokeStyle = "rgba(150,200,255,.7)";
            g.lineWidth = Math.max(1, r * 0.12);
            g.stroke();
            g.fillStyle = "rgba(255,255,255,1)";
            g.beginPath();
            g.arc(px - r * 0.35, py - r * 0.35, r * 0.22, 0, 6.283);
            g.fill();
          }
          g.globalAlpha = 1;
        }
        // 반짝이·물방울
        for (let i = S.parts.length - 1; i >= 0; i--) {
          const p = S.parts[i];
          p.life -= dt * (p.kind === "drop" ? 1.1 : 1.4);
          if (p.life <= 0) {
            S.parts.splice(i, 1);
            continue;
          }
          p.vy += (p.kind === "drop" ? 700 : 160) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          g.globalAlpha = Math.min(1, p.life * 1.5);
          g.fillStyle = p.c;
          g.beginPath();
          if (p.kind === "drop") {
            g.ellipse(p.x, p.y, p.s * 0.7, p.s, 0, 0, 6.283);
          } else {
            const s = p.s;
            for (let k = 0; k < 8; k++) {
              const a = (k * Math.PI) / 4,
                rr = k % 2 ? s * 0.4 : s;
              g.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
            }
            g.closePath();
          }
          g.fill();
        }
        g.globalAlpha = 1;
      });
    };
    return S;
  };

  /* 얼룩 그리기 모양 */
  care.drawGerm = (g, x, y, r, life, t, s) => {
    g.globalAlpha = Math.min(1, life * 1.3);
    const k = 0.55 + 0.45 * life;
    KP.drawE(g, "🦠", x, y, r * 2 * k, Math.sin(t * 2 + s.seed * 9) * 0.25);
  };
  care.drawStain = (g, x, y, r, life, t, s) => {
    g.globalAlpha = 0.6 * life;
    g.fillStyle = "#e6c34a";
    g.beginPath();
    g.ellipse(x, y, r, r * 0.7, s.seed * 3, 0, 6.283);
    g.fill();
  };
  care.drawMud = (g, x, y, r, life, t, s) => {
    g.globalAlpha = 0.9 * Math.min(1, life * 1.4);
    g.fillStyle = s.col || "#8a5a2b";
    let a = s.seed * 1000;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    g.beginPath();
    g.arc(x, y, r * 0.7 * (0.5 + 0.5 * life), 0, 6.283);
    for (let i = 0; i < 4; i++) {
      const ang = rnd() * 6.28,
        d = r * 0.5 * rnd();
      g.moveTo(x + Math.cos(ang) * d, y + Math.sin(ang) * d);
      g.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, r * (0.3 + 0.3 * rnd()) * (0.5 + 0.5 * life), 0, 6.283);
    }
    g.fill();
  };

  /* ---------------- 순서대로 하기 (도구 줄) ----------------
     o = { bar, tools:[{id, html, label}], steps:[{tool, say, act:async(btn)=>{}, auto?:true, wrong?}], mode:1|2|3, ask?:첫 질문 }
     돌려줌: Promise<boolean> — 다 끝나면 true, 화면을 나가면 끝나지 않음 */
  care.routine = function (ctx, o) {
    const sess = ctx._session;
    const alive = () => ctx._active && ctx._session === sess;
    const bar = o.bar;
    bar.innerHTML = "";
    const btns = {};
    const order = o.mode === 1 ? o.tools.slice() : U.shuffle(o.tools.slice());
    let want = null,
      waiting = null,
      busy = true,
      wrongN = 0;
    for (const tl of order) {
      const b = U.el("button", "kc-tb", tl.html + (tl.label ? "<span>" + tl.label + "</span>" : ""));
      b.dataset.tool = tl.id;
      bar.appendChild(b);
      btns[tl.id] = b;
      ctx.tap(b, () => {
        if (busy || !alive()) return;
        if (b.dataset.tool === want) {
          const r = waiting;
          waiting = null;
          r && r(b);
        } else {
          wrongN++;
          if (o.mode === 1) ctx.miss(b, "이건 조금 있다가 해요!", { soft: true });
          else {
            ctx.miss(b, cur && cur.wrong ? cur.wrong : "음, 그 전에 할 일이 있어요!");
            if (wrongN >= 2 && btns[want]) btns[want].classList.add("glow"); // 두 번 헷갈리면 살짝 알려 주기
          }
        }
      });
    }
    let cur = null;
    const setRight = (id) => {
      for (const k in btns) {
        btns[k].classList.remove("glow");
        if (k === id) btns[k].dataset.right = "1";
        else delete btns[k].dataset.right;
      }
    };
    return (async () => {
      let first = true;
      for (const st of o.steps) {
        if (!alive()) return false;
        cur = st;
        if (st.auto) {
          busy = true;
          bar.classList.add("off");
          setRight(null);
          await st.act();
          continue;
        }
        bar.classList.remove("off");
        want = st.tool;
        wrongN = 0;
        setRight(st.tool);
        if (o.mode === 1) {
          ctx._hinted = true; // 정답이 반짝이는 안내 단계 — 열쇠 별 '깨끗한 판'은 아님
          btns[st.tool].classList.add("glow");
          ctx.say(st.say);
          ctx.hint(() => btns[st.tool], st.say);
        } else if (o.mode === 2) {
          ctx.say(first && o.ask ? o.ask : "다음엔 뭘 할까요?");
          ctx.hint(() => btns[st.tool], st.say);
        } else {
          if (first && o.ask) ctx.say(o.ask);
          ctx.hint(() => btns[st.tool], st.say);
        }
        first = false;
        busy = false;
        const b = await new Promise((r) => (waiting = r));
        if (!alive()) return false;
        if (btns[st.tool].classList.contains("glow") && o.mode !== 1) ctx._hinted = true;
        busy = true;
        bar.classList.add("off");
        setRight(null);
        ctx.hint(null);
        U.replay(b, "pop");
        KP.audio.sfx("select");
        await st.act(b);
      }
      cur = null;
      return alive();
    })();
  };
})(window.KP);
