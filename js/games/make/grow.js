/* 꽃 키우기 — 물뿌리개로 물 주고, 해님을 누르면 쑥쑥!
   - 화분 3개: 씨앗 → 싹 → 잎 → 봉오리 → 꽃 (꽃 종류는 랜덤)
   - 물뿌리개를 끌어다 화분 위에 대면 물방울이 떨어짐 → 흙이 촉촉해지면 해님 누르기 → 한 단계 자람
   - 핀 꽃은 "내 정원"(KP.store "grow:garden")에 영구 저장 → 정원이 날마다 커짐, 🌼 단추로 정원 보기
   - 화분 상태도 저장(KP.store "grow:pots") → 껐다 켜도 이어서 키우기
   - 나비·벌이 날아다님 (꽃이 많을수록 더 많이) */
"use strict";
KP.game({
  id: "grow",
  icon: "🌱",
  name: "꽃 키우기",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("grow", `
      .gr{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(#8fd3ff,#d9f2ff 58%,#a7df86 58%,#7fcc63)}
      .gr-hill{position:absolute;left:-10%;right:-10%;top:52%;height:20%;background:#b6e797;border-radius:50% 50% 0 0}
      .gr-sun{position:absolute;right:3%;top:3%;width:clamp(100px,17vh,160px);height:clamp(100px,17vh,160px);display:flex;align-items:center;justify-content:center;z-index:2}
      .gr-sun .e{width:100%;height:100%;filter:drop-shadow(0 0 18px rgba(255,200,40,.7));animation:grSun 6s linear infinite}
      @keyframes grSun{to{transform:rotate(360deg)}}
      .gr-sun.shine::before{content:"";position:absolute;inset:-60%;border-radius:50%;background:radial-gradient(circle,rgba(255,236,120,.9),rgba(255,236,120,0) 65%);animation:grGlow 1.4s ease-out}
      @keyframes grGlow{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
      .gr-beam{position:absolute;pointer-events:none;z-index:1;background:linear-gradient(rgba(255,240,150,.75),rgba(255,240,150,0));transform-origin:top center;animation:grBeam 1.5s ease-out forwards;border-radius:40px}
      @keyframes grBeam{from{opacity:0}25%{opacity:1}to{opacity:0}}
      .gr-cloud{position:absolute;top:8%;font-size:clamp(50px,9vh,90px);opacity:.95;animation:grCloud 40s linear infinite}
      @keyframes grCloud{from{transform:translateX(-30vw)}to{transform:translateX(110vw)}}
      .gr-garden{position:absolute;left:12px;top:12px;z-index:3;display:flex;align-items:center;gap:6px;font-size:clamp(18px,2.4vw,24px);background:#fff;border-radius:20px;padding:8px 14px;box-shadow:var(--shadow);min-height:60px}
      .gr-garden .e{font-size:1.6em}
      .gr-garden b{font-weight:400;color:var(--coral)}
      .gr-pots{position:absolute;left:0;right:0;bottom:3%;display:flex;justify-content:space-evenly;align-items:flex-end;z-index:2}
      .gr-pot{position:relative;width:clamp(100px,19vw,200px);aspect-ratio:100/170;transition:transform .2s}
      .gr-pot svg{width:100%;height:100%;overflow:visible}
      .gr-pot.over{transform:scale(1.06)}
      .gr-pot .grow{animation:grGrow .8s cubic-bezier(.3,1.5,.5,1);transform-box:fill-box;transform-origin:bottom center}
      @keyframes grGrow{from{transform:scaleY(.4) scaleX(.8)}}
      .gr-need{position:absolute;left:50%;top:76%;margin-left:-.8em;z-index:1;font-size:clamp(24px,3.6vh,38px);background:#fff;border-radius:50%;width:1.6em;height:1.6em;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);animation:bob 1.6s ease-in-out infinite;pointer-events:none}
      .gr-need .e{font-size:.9em}
      .gr-can{position:absolute;left:3%;top:38%;width:clamp(110px,15vw,170px);z-index:5;touch-action:none;cursor:grab;filter:drop-shadow(0 8px 6px rgba(0,0,0,.2))}
      .gr-can svg{width:100%;display:block;transition:transform .2s;transform-origin:70% 60%}
      .gr-can.pour svg{transform:rotate(-34deg)}
      .gr-can.drag{cursor:grabbing}
      .gr-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4}
      .gr-bug{position:absolute;left:0;top:0;font-size:clamp(34px,5vh,50px);z-index:3;pointer-events:none}
      .gr-view{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;background:linear-gradient(#bfe8ff,#e9f8ff 30%,#b8e79a 30%,#8fd56d)}
      .gr-view.show{display:flex;animation:enter .3s}
      .gr-vtop{display:flex;align-items:center;gap:10px;padding:12px 14px;font-size:clamp(20px,3vw,30px)}
      .gr-vtop .btn{font-size:clamp(18px,2.4vw,22px)}
      .gr-vgrid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--fs,74px),1fr));gap:4px 6px;padding:20px 14px 24px;align-content:start}
      .gr-vf{display:flex;flex-direction:column;align-items:center;font-size:var(--fs,74px);line-height:1;animation:itemIn .4s backwards;animation-delay:calc(var(--i) * 18ms)}
      .gr-vf .e{animation:grSway 3s ease-in-out infinite;animation-delay:calc(var(--i) * -0.37s);transform-origin:bottom center}
      .gr-vf small{font-size:12px;color:#2e6b2a;margin-top:2px}
      @keyframes grSway{50%{transform:rotate(6deg)}}
      .gr-vempty{grid-column:1/-1;text-align:center;font-size:22px;color:#2e6b2a;padding-top:40px}
      @media (max-aspect-ratio:1/1){ .gr{margin:0 10px 10px} .gr-pot{width:30vw} .gr-can{top:36%;width:28vw} }
    `);

    const FLOWERS = [
      ["🌷", "튤립", "#ff5d73"], ["🌻", "해바라기", "#ffc531"], ["🌹", "장미", "#e8253f"], ["🌸", "벚꽃", "#ffb3cf"],
      ["🌼", "데이지", "#fff3a0"], ["🌺", "무궁화", "#ff6fa8"], ["🪻", "히아신스", "#9a73d4"],
    ];
    KP.loadE(FLOWERS.map((f) => f[0]).concat(["🦋", "🐝"]));
    const STAGE_NAMES = ["씨앗", "싹", "잎", "봉오리", "꽃"];

    /* ---------- 저장된 상태 ---------- */
    const newPot = () => ({ stage: 0, water: 0, kind: U.rand(FLOWERS.length) });
    let pots = KP.store.get("grow:pots", null);
    if (!Array.isArray(pots) || pots.length !== 3) pots = [newPot(), newPot(), newPot()];
    const savePots = () => KP.store.set("grow:pots", pots);
    const garden = () => KP.store.get("grow:garden", []);

    /* ---------- 화면 ---------- */
    const scene = U.el("div", "gr");
    scene.append(U.el("div", "gr-hill"));
    const cl1 = U.el("div", "gr-cloud", KP.E("☁️"));
    const cl2 = U.el("div", "gr-cloud", KP.E("☁️"));
    cl2.style.top = "20%";
    cl2.style.animationDelay = "-22s";
    scene.append(cl1, cl2);
    const sun = U.el("button", "gr-sun", KP.E("☀️"));
    const bGarden = U.btn(KP.E("🌼") + "<span>내 정원</span> <b>0</b>", "gr-garden");
    const potsEl = U.el("div", "gr-pots");
    const can = U.el("div", "gr-can");
    can.innerHTML =
      '<svg viewBox="0 0 160 120"><path d="M112 54 L154 22 L158 30 L122 66Z" fill="#3fb0c9" stroke="#2c5a6b" stroke-width="5" stroke-linejoin="round"/>' +
      '<ellipse cx="156" cy="26" rx="8" ry="12" fill="#7fd6ea" stroke="#2c5a6b" stroke-width="4" transform="rotate(-38 156 26)"/>' +
      '<path d="M28 40 Q22 6 64 8 Q104 10 98 40" fill="none" stroke="#2c5a6b" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M22 44 H118 L110 112 H30Z" fill="#4cc4dd" stroke="#2c5a6b" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M30 60 H112" stroke="#fff" stroke-width="7" opacity=".6"/><circle cx="56" cy="86" r="9" fill="#ffd23f"/><circle cx="82" cy="80" r="6" fill="#ff8fb3"/></svg>';
    const fx = U.el("canvas", "gr-fx");
    const view = U.el("div", "gr-view");
    scene.append(sun, bGarden, potsEl, can, fx, view);
    ctx.body.appendChild(scene);
    const fg = fx.getContext("2d");

    /* ---------- 화분 그림 ---------- */
    function plantSVG(p) {
      const [em, , col] = FLOWERS[p.kind];
      const wet = p.water >= 1;
      const soil = wet ? "#6b4426" : "#a8743f";
      let plant = "";
      const st = p.stage;
      const leaf = (x, y, s, flip) =>
        '<path d="M' + x + " " + y + " q" + (flip ? -1 : 1) * 16 * s + " " + -14 * s + " " + (flip ? -1 : 1) * 30 * s + " " + -4 * s + " q" + (flip ? 1 : -1) * 12 * s + " " + 12 * s + " " + (flip ? 1 : -1) * 30 * s + " " + 4 * s + 'Z" fill="#4cbf4a" stroke="#2b7a2e" stroke-width="2.5" stroke-linejoin="round"/>';
      if (st === 0) {
        plant = '<ellipse cx="50" cy="98" rx="20" ry="7" fill="' + soil + '" opacity=".7"/><ellipse cx="50" cy="94" rx="8" ry="6" fill="#8a5a2b" stroke="#5a3a1a" stroke-width="2" transform="rotate(-20 50 94)"/><path d="M47 91 q3 -2 5 0" stroke="#c99a5c" stroke-width="2" fill="none"/>';
      } else {
        const topY = [0, 74, 46, 26, 14][st];
        plant = '<path d="M50 100 Q' + (st > 2 ? 46 : 52) + " " + (100 + topY) / 2 + " 50 " + topY + '" stroke="#3ea33f" stroke-width="' + (st > 1 ? 6 : 5) + '" fill="none" stroke-linecap="round"/>';
        if (st === 1) plant += leaf(50, 78, 0.55, true) + leaf(50, 78, 0.55, false);
        if (st >= 2) plant += leaf(50, 84, 0.9, true) + leaf(50, 68, 0.85, false) + (st >= 3 ? leaf(50, 56, 0.7, true) : "");
        if (st === 3)
          plant += '<path d="M50 6 Q36 20 42 30 Q50 36 58 30 Q64 20 50 6Z" fill="' + col + '" stroke="#5a3a4a" stroke-width="2.5"/><path d="M40 30 Q50 22 60 30 Q56 38 50 36 Q44 38 40 30Z" fill="#4cbf4a" stroke="#2b7a2e" stroke-width="2.5"/>';
        if (st === 4) plant += '<image href="' + KP.esrc(em) + '" x="18" y="-26" width="64" height="64"/>';
      }
      return (
        '<svg viewBox="0 -30 100 200"><g class="plant">' + plant + "</g>" +
        '<path d="M18 104 H82 L74 166 H26Z" fill="#e8835a" stroke="#8a4a2e" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<rect x="12" y="96" width="76" height="14" rx="5" fill="#f19a70" stroke="#8a4a2e" stroke-width="3.5"/>' +
        '<ellipse cx="50" cy="99" rx="34" ry="4.5" fill="' + soil + '"/>' +
        (wet ? '<circle cx="34" cy="132" r="4" fill="#9fe0ff"/><circle cx="62" cy="142" r="3" fill="#9fe0ff"/>' : "") +
        "</svg>"
      );
    }
    const potEls = [0, 1, 2].map((i) => {
      const el = U.el("div", "gr-pot");
      potsEl.appendChild(el);
      ctx.fast(el, () => {
        const p = pots[i];
        U.replay(el, "jump");
        A.sfx("tap2");
        const nm = p.stage === 4 ? FLOWERS[p.kind][1] : STAGE_NAMES[p.stage];
        KP.voice.say(p.water >= 1 ? nm + "! 물을 먹었어요. 해님을 눌러요!" : nm + "! 목말라요. 물을 주세요!");
      });
      return el;
    });
    function renderPot(i, grew) {
      const p = pots[i],
        el = potEls[i];
      el.innerHTML = plantSVG(p);
      if (grew) el.querySelector(".plant").classList.add("grow");
      if (p.stage < 4) el.appendChild(U.el("div", "gr-need", KP.E(p.water >= 1 ? "☀️" : "💧")));
    }
    const renderAll = () => pots.forEach((_, i) => renderPot(i));
    function updateGardenBtn() {
      bGarden.querySelector("b").textContent = garden().length;
    }

    /* ---------- 물뿌리개 끌기 ---------- */
    let drag = null,
      pourAcc = 0,
      sndAcc = 0,
      saidSun = false;
    const drops = [];
    can.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (drag) return;
      try {
        can.setPointerCapture(e.pointerId);
      } catch (_) {}
      const r = can.getBoundingClientRect();
      drag = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, x0: r.left, y0: r.top };
      can.classList.add("drag");
      A.sfx("pick");
    });
    can.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const dx = e.clientX - drag.ox - drag.x0,
        dy = e.clientY - drag.oy - drag.y0;
      can.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      can.classList.remove("drag", "pour");
      can.style.transition = "transform .4s cubic-bezier(.3,1.3,.5,1)";
      can.style.transform = "";
      setTimeout(() => (can.style.transition = ""), 420);
      potEls.forEach((p) => p.classList.remove("over"));
    }
    can.addEventListener("pointerup", release);
    can.addEventListener("pointercancel", release);
    function spout() {
      const r = can.getBoundingClientRect(),
        s = scene.getBoundingClientRect();
      // 기울였을 때 주둥이 끝 (대략 오른쪽 위)
      return { x: r.left - s.left + r.width * 0.96, y: r.top - s.top + r.height * (can.classList.contains("pour") ? 0.45 : 0.2) };
    }
    function potUnder() {
      if (!drag) return -1;
      const sp = spout(),
        s = scene.getBoundingClientRect();
      for (let i = 0; i < 3; i++) {
        const r = potEls[i].getBoundingClientRect();
        const x = r.left - s.left,
          y = r.top - s.top;
        if (sp.x > x - 30 && sp.x < x + r.width + 30 && sp.y < y + r.height * 0.75 && sp.y > y - r.height * 0.9) return i;
      }
      return -1;
    }
    function step(dt) {
      // 물 주기
      const i = potUnder();
      potEls.forEach((p, k) => p.classList.toggle("over", k === i));
      can.classList.toggle("pour", i >= 0);
      if (i >= 0) {
        const sp = spout();
        for (let k = 0; k < 3; k++) drops.push({ x: sp.x + (Math.random() - 0.3) * 18, y: sp.y + 10, vx: 30 + Math.random() * 40, vy: 40 + Math.random() * 60, life: 1 });
        sndAcc += dt;
        if (sndAcc > 0.32) {
          sndAcc = 0;
          A.sfx("water");
        }
        const p = pots[i];
        if (p.stage < 4 && p.water < 1) {
          p.water = Math.min(1, p.water + dt * 0.9);
          if (p.water >= 1) {
            savePots();
            renderPot(i);
            A.note("C6", { inst: "bell", dur: 0.4, vol: 0.15 });
            A.note("G6", { inst: "bell", dur: 0.5, vol: 0.12, when: 0.1 });
            KP.voice.say(saidSun ? "꿀꺽꿀꺽! 촉촉해졌어요!" : "꿀꺽꿀꺽! 이제 해님을 눌러 주세요!");
            saidSun = true;
            setHint();
          }
        } else if (p.stage === 4) {
          pourAcc += dt;
        }
      }
      // 물방울 · 꽃가루 그리기
      const W = fx.width / D,
        H = fx.height / D;
      fg.clearRect(0, 0, W, H);
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k];
        d.vy += 600 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.life -= dt * 1.2;
        if (d.life <= 0 || d.y > H) {
          drops.splice(k, 1);
          continue;
        }
        fg.globalAlpha = Math.min(1, d.life * 1.5);
        fg.fillStyle = d.c || "#6cc8f5";
        fg.beginPath();
        if (d.c) fg.arc(d.x, d.y, d.s || 4, 0, 6.28);
        else fg.ellipse(d.x, d.y, 3.2, 5.5, 0, 0, 6.28);
        fg.fill();
      }
      fg.globalAlpha = 1;
      if (drops.length > 400) drops.splice(0, drops.length - 400);
      // 나비·벌
      bugs.forEach((b) => {
        b.t += dt * b.sp;
        const x = (b.cx + Math.sin(b.t * 0.7 + b.ph) * b.ax) * W,
          y = (b.cy + Math.sin(b.t * 1.9 + b.ph) * b.ay) * H;
        b.el.style.transform = "translate(" + x + "px," + y + "px) scaleX(" + (Math.cos(b.t * 0.7 + b.ph) > 0 ? -1 : 1) + ") rotate(" + Math.sin(b.t * 9) * 8 + "deg)";
      });
    }
    let D = 1;
    function fit() {
      const r = scene.getBoundingClientRect();
      D = Math.min(devicePixelRatio || 1, 2);
      fx.width = Math.round(r.width * D);
      fx.height = Math.round(r.height * D);
      fg.setTransform(D, 0, 0, D, 0, 0);
    }
    addEventListener("resize", () => ctx._active && fit());

    /* ---------- 나비 · 벌 ---------- */
    let bugs = [];
    function makeBugs() {
      bugs.forEach((b) => b.el.remove());
      const n = Math.min(5, 1 + Math.floor(garden().length / 3) + pots.filter((p) => p.stage >= 3).length);
      bugs = Array.from({ length: n }, (_, i) => {
        const el = U.el("div", "gr-bug", KP.E(i % 2 ? "🐝" : "🦋"));
        scene.insertBefore(el, fx);
        return { el, t: Math.random() * 10, sp: 0.6 + Math.random() * 0.5, ph: Math.random() * 6, cx: 0.2 + Math.random() * 0.6, cy: 0.3 + Math.random() * 0.15, ax: 0.3, ay: 0.1 };
      });
    }

    /* ---------- 해님 ---------- */
    ctx.fast(sun, async () => {
      if (busy) return;
      U.replay(sun, "shine");
      ["C5", "E5", "G5", "C6"].forEach((n, i) => A.note(n, { inst: "bell", dur: 0.6, vol: 0.14, when: i * 0.07 }));
      const ready = pots.map((p, i) => (p.stage < 4 && p.water >= 1 ? i : -1)).filter((i) => i >= 0);
      if (!ready.length) {
        KP.voice.say(pots.some((p) => p.stage < 4) ? "해님이 반짝! 그런데 먼저 물을 주세요!" : "해님이 반짝반짝!");
        U.replay(can, "jump");
        return;
      }
      // 햇살
      const s = scene.getBoundingClientRect(),
        sr = sun.getBoundingClientRect();
      ready.forEach((i) => {
        const pr = potEls[i].getBoundingClientRect();
        const x1 = sr.left - s.left + sr.width / 2,
          y1 = sr.top - s.top + sr.height / 2,
          x2 = pr.left - s.left + pr.width / 2,
          y2 = pr.top - s.top + pr.height * 0.3;
        const len = Math.hypot(x2 - x1, y2 - y1),
          ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90;
        const b = U.el("div", "gr-beam");
        Object.assign(b.style, { left: x1 - 40 + "px", top: y1 + "px", width: "80px", height: len + "px", transform: "rotate(" + ang + "deg)" });
        scene.appendChild(b);
        setTimeout(() => b.remove(), 1600);
      });
      busy = true;
      await ctx.wait(700);
      let bloomed = [];
      ready.forEach((i) => {
        const p = pots[i];
        p.stage++;
        p.water = 0;
        renderPot(i, true);
        if (p.stage === 4) bloomed.push(i);
      });
      savePots();
      A.sfx("levelup");
      makeBugs();
      if (!bloomed.length) {
        const st = pots[ready[0]].stage;
        KP.voice.say(["", "싹이 났어요!", "잎이 쑥쑥 자랐어요!", "봉오리가 생겼어요! 곧 꽃이 필 거예요!"][st] + " 또 물을 주세요!");
        busy = false;
        setHint();
        return;
      }
      for (const i of bloomed) {
        const p = pots[i];
        const [em, name] = FLOWERS[p.kind];
        const d = new Date();
        const g = garden();
        g.push({ e: em, n: name, d: d.getMonth() + 1 + "월 " + d.getDate() + "일", t: Date.now() });
        KP.store.set("grow:garden", g);
        // 꽃가루 터짐
        const s2 = scene.getBoundingClientRect(),
          pr = potEls[i].getBoundingClientRect();
        for (let k = 0; k < 40; k++) {
          const a = Math.random() * 6.28,
            sp = 80 + Math.random() * 200;
          drops.push({ x: pr.left - s2.left + pr.width / 2, y: pr.top - s2.top + pr.height * 0.15, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, life: 1.4, c: U.pick(["#ffd23f", "#ff8fb8", "#ffffff", FLOWERS[p.kind][2]]), s: 3 + Math.random() * 4 });
        }
        A.sfx("sparkle");
        updateGardenBtn();
        U.replay(bGarden, "bump");
        ctx.say(U.josa(name, "이/가") + " 피었어요! 내 정원에 심었어요.");
      }
      await ctx.wait(1500);
      ctx.round = (ctx.round || 0) + 1;
      const ok = await ctx.win({ big: ctx.round % 3 === 0, msg: U.josa(FLOWERS[pots[bloomed[0]].kind][1], "이/가") + " 피었어요!" });
      if (!ok) return;
      // 핀 꽃은 정원으로 날아가고 새 씨앗
      for (const i of bloomed) {
        const a = potEls[i].getBoundingClientRect(),
          b = bGarden.getBoundingClientRect();
        const f = U.el("div", "", KP.E(FLOWERS[pots[i].kind][0]));
        Object.assign(f.style, { position: "fixed", left: a.left + a.width * 0.2 + "px", top: a.top - a.height * 0.1 + "px", fontSize: a.width * 0.6 + "px", zIndex: 90, pointerEvents: "none", transition: "transform .9s cubic-bezier(.5,-0.3,.6,1)" });
        document.body.appendChild(f);
        requestAnimationFrame(() => requestAnimationFrame(() => (f.style.transform = "translate(" + (b.left - a.left - a.width * 0.2) + "px," + (b.top - a.top + a.height * 0.1) + "px) scale(.25)")));
        setTimeout(() => f.remove(), 950);
        pots[i] = newPot();
        renderPot(i, true);
      }
      savePots();
      A.sfx("whoosh");
      KP.voice.say("새 씨앗을 심었어요! 물을 주세요!");
      busy = false;
      setHint();
    });
    let busy = false;

    /* ---------- 내 정원 ---------- */
    ctx.tap(bGarden, () => {
      A.sfx("open");
      const g = garden();
      view.innerHTML = "";
      const top = U.el("div", "gr-vtop");
      const back = U.btn(KP.E("↩️") + " 돌아가기", "btn");
      top.append(back, U.el("div", "", KP.E("🌼") + " 내 정원 · 꽃 " + g.length + "송이"));
      const grid = U.el("div", "gr-vgrid");
      const fs = g.length > 80 ? 44 : g.length > 40 ? 56 : 74;
      grid.style.setProperty("--fs", fs + "px");
      if (!g.length) grid.appendChild(U.el("div", "gr-vempty", "아직 핀 꽃이 없어요. 물을 주고 해님을 눌러 꽃을 피워요!"));
      g.forEach((f, i) => {
        const c = U.el("div", "gr-vf", KP.E(f.e) + "<small>" + (f.d || "") + "</small>");
        c.style.setProperty("--i", Math.min(i, 60));
        c.addEventListener("pointerdown", () => {
          U.replay(c, "jump");
          A.note(A.SCALE[i % 8], { inst: "bell", dur: 0.4, vol: 0.2 });
          KP.voice.say((f.d ? f.d + "에 핀 " : "") + f.n + "!");
        });
        grid.appendChild(c);
      });
      view.append(top, grid);
      view.classList.add("show");
      KP.voice.say(g.length ? "내 정원에 꽃이 " + g.length + "송이 피었어요!" : "아직 핀 꽃이 없어요. 꽃을 피워 봐요!");
      back.addEventListener("click", () => {
        A.sfx("back");
        view.classList.remove("show");
      });
    });

    function setHint() {
      if (pots.some((p) => p.stage < 4 && p.water >= 1)) ctx.hint(() => sun, "해님을 눌러요!");
      else ctx.hint(() => can, "물뿌리개를 화분으로 끌어 와요!");
    }
    ctx.begin = () => {
      busy = false;
      // 꽃이 핀 직후 나가서 '꽃 핀 상태'로 굳은 화분은 새 씨앗으로 (꽃은 이미 정원에 저장됨)
      if (pots.some((p) => p.stage >= 4)) {
        pots = pots.map((p) => (p.stage >= 4 ? newPot() : p));
        savePots();
      }
      view.classList.remove("show");
      renderAll();
      updateGardenBtn();
      requestAnimationFrame(() => {
        fit();
        makeBugs();
        ctx.loop((dt) => step(dt));
      });
      const any = pots.some((p) => p.stage > 0);
      ctx.say(any ? "꽃이 자라고 있어요! 물을 주고 해님을 눌러요." : "물뿌리개를 끌어서 화분에 물을 주세요!");
      setHint();
    };
  },
  start(ctx) {
    ctx.begin();
  },
});
