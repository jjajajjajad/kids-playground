/* 실로폰 — 무지개 실로폰 8음 (도~도)
   - 누른 곳으로 채(말렛)가 날아가 '똑' 치는 애니메이션, 손가락으로 쓸면 주르륵
   - ⏺ 녹음 → 아이가 친 순서·간격 그대로 기록, ▶ 듣기로 다시 들려줌 (채가 혼자 연주)
   - 녹음은 KP.store "xylo:rec" 에 저장 → 다음에 열어도 들을 수 있음 */
"use strict";
KP.game({
  id: "xylo",
  icon: "🎼",
  name: "실로폰",
  cat: "music",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("xylo", `
      .xy{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .xy-top{display:flex;gap:12px;justify-content:center;align-items:center;flex:0 0 auto;flex-wrap:wrap}
      .xy-b{font-size:clamp(18px,2.4vw,24px);min-height:62px;padding:10px 20px}
      .xy-b .e{font-size:1.5em}
      .xy-rec{color:#e0283c}
      .xy-rec.on{background:#e0283c;color:#fff;box-shadow:0 7px 0 #9c1426;animation:xyPulse 1s ease-in-out infinite}
      @keyframes xyPulse{50%{transform:scale(1.06)}}
      .xy-play.on{background:var(--grass);color:#fff;box-shadow:0 7px 0 #1d7f45}
      .xy-st{font-size:clamp(17px,2.2vw,22px);color:var(--ink2);min-width:4em}
      .xy-board{flex:1;min-height:0;position:relative;border-radius:30px;background:linear-gradient(135deg,#ffe9c7,#ffd7a8);box-shadow:var(--shadow);overflow:hidden}
      .xy-frame{position:absolute;inset:6% 4%;display:flex;align-items:center;justify-content:space-between;gap:1.6%}
      .xy-rail{position:absolute;left:2%;right:2%;height:5%;border-radius:10px;background:linear-gradient(#a8662e,#7c4519);box-shadow:0 4px 0 rgba(0,0,0,.2)}
      .xy-bar{position:relative;flex:1;border-radius:16px;background:linear-gradient(90deg,color-mix(in srgb,var(--k) 75%,#fff),var(--k) 40%,color-mix(in srgb,var(--k) 80%,#000));
        box-shadow:0 7px 0 color-mix(in srgb,var(--k) 55%,#000),inset 0 3px 0 rgba(255,255,255,.4);display:flex;align-items:flex-end;justify-content:center;padding-bottom:12%;
        font-size:clamp(17px,2.6vw,28px);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.25);touch-action:none;transition:transform .06s}
      .xy-bar::before,.xy-bar::after{content:"";position:absolute;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#e8e2d6;box-shadow:inset 0 -2px 0 #9b9183}
      .xy-bar::before{top:14%}.xy-bar::after{bottom:7%}
      .xy-bar.hit{animation:xyHit .3s ease-out}
      @keyframes xyHit{30%{transform:translateY(5px) scale(.97);filter:brightness(1.3)}}
      .xy-ring{position:absolute;border-radius:50%;border:5px solid var(--k);pointer-events:none;animation:xyRing .6s ease-out forwards}
      @keyframes xyRing{from{transform:translate(-50%,-50%) scale(.2);opacity:1}to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
      .xy-mallet{position:absolute;width:clamp(70px,9vw,110px);z-index:4;pointer-events:none;transition:left .09s ease-out,top .09s ease-out;transform-origin:85% 85%;transform:translate(-14%,-14%) rotate(-20deg)}
      .xy-mallet svg{display:block;width:100%}
      .xy-mallet.strike{animation:xyStrike .22s ease-out}
      @keyframes xyStrike{0%{transform:translate(-14%,-14%) rotate(-48deg)}45%{transform:translate(-14%,-14%) rotate(4deg)}100%{transform:translate(-14%,-14%) rotate(-20deg)}}
      .xy-note{position:absolute;pointer-events:none;font-size:clamp(28px,4vw,42px);z-index:5;animation:pnFly2 1s ease-out forwards}
      @keyframes pnFly2{from{transform:translate(-50%,-50%) scale(.5);opacity:1}to{transform:translate(-50%,-180%) scale(1.2);opacity:0}}
      @media (max-aspect-ratio:1/1){
        .xy-frame{flex-direction:column;inset:4% 5%}
        .xy-rail{top:2%;bottom:2%;width:6%;height:auto;left:auto;right:auto}
        .xy-bar{align-items:center;justify-content:center;padding:0;background:linear-gradient(180deg,color-mix(in srgb,var(--k) 75%,#fff),var(--k) 40%,color-mix(in srgb,var(--k) 80%,#000))}
        .xy-bar::before,.xy-bar::after{display:none}
        .xy-b{min-height:56px;padding:8px 14px;font-size:17px}
      }
    `);
    const BARS = [
      ["C5", "도", "#ff4f5e"], ["D5", "레", "#ff9a2e"], ["E5", "미", "#f5c400"], ["F5", "파", "#3cc45a"],
      ["G5", "솔", "#22b5d8"], ["A5", "라", "#3f6cf0"], ["B5", "시", "#8a5cf0"], ["C6", "도", "#ff5fae"],
    ];

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "xy");
    const top = U.el("div", "xy-top");
    const bRec = U.btn(KP.E("🔴") + " 녹음", "btn xy-b xy-rec");
    const bPlay = U.btn(KP.E("▶️") + " 듣기", "btn xy-b xy-play");
    const st = U.el("div", "xy-st");
    top.append(bRec, bPlay, st);
    const board = U.el("div", "xy-board");
    const frame = U.el("div", "xy-frame");
    const rail1 = U.el("div", "xy-rail"),
      rail2 = U.el("div", "xy-rail");
    const mallet = U.el("div", "xy-mallet");
    mallet.innerHTML =
      '<svg viewBox="0 0 100 100"><path d="M24 24 L90 90" stroke="#b07a45" stroke-width="9" stroke-linecap="round"/><path d="M24 24 L90 90" stroke="#d9a46b" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="20" cy="20" r="17" fill="#ff5d73" stroke="#9c2a3c" stroke-width="4"/><circle cx="14" cy="14" r="5" fill="#fff" opacity=".7"/></svg>';
    board.append(rail1, rail2, frame, mallet);
    wrap.append(top, board);
    ctx.body.appendChild(wrap);
    const bars = BARS.map(([n, sol, col], i) => {
      const b = U.el("div", "xy-bar", sol);
      b.style.setProperty("--k", col);
      b.dataset.i = i;
      frame.appendChild(b);
      return b;
    });
    function layout() {
      const port = matchMedia("(max-aspect-ratio:1/1)").matches;
      bars.forEach((b, i) => {
        const s = 96 - i * 4.6 + "%";
        b.style.height = port ? "" : s;
        b.style.width = port ? s : "";
        b.style.alignSelf = "center";
      });
      if (port) {
        rail1.style.cssText = "left:24%;";
        rail2.style.cssText = "right:24%;";
      } else {
        rail1.style.cssText = "top:22%;";
        rail2.style.cssText = "bottom:22%;";
      }
      restMallet();
    }
    function restMallet() {
      mallet.style.left = "calc(100% - clamp(70px,9vw,110px) - 10px)";
      mallet.style.top = "10px";
    }
    addEventListener("resize", () => ctx._active && layout());

    /* ---------- 치기 ---------- */
    function sound(i) {
      const f = A.hz(BARS[i][0]);
      A.note(f, { inst: "marimba", dur: 0.8, vol: 0.3 });
      A.tone(f * 3, { dur: 0.16, vol: 0.04 });
      A.tone(f * 4.1, { dur: 0.08, vol: 0.035 });
    }
    function hit(i, x, y) {
      const b = bars[i];
      sound(i);
      U.replay(b, "hit");
      const br = board.getBoundingClientRect(),
        r = b.getBoundingClientRect();
      if (x == null) {
        x = r.left + r.width / 2;
        y = r.top + r.height * 0.45;
      }
      const lx = x - br.left,
        ly = y - br.top;
      mallet.style.left = lx + "px";
      mallet.style.top = ly + "px";
      U.replay(mallet, "strike");
      const ring = U.el("div", "xy-ring");
      ring.style.setProperty("--k", BARS[i][2]);
      const sz = Math.min(r.width, r.height) * 0.9;
      Object.assign(ring.style, { left: lx + "px", top: ly + "px", width: sz + "px", height: sz + "px" });
      board.appendChild(ring);
      setTimeout(() => ring.remove(), 650);
      const nt = U.el("div", "xy-note", KP.E(U.pick(["🎵", "🎶"])));
      Object.assign(nt.style, { left: lx + "px", top: ly + "px" });
      board.appendChild(nt);
      setTimeout(() => nt.remove(), 1000);
      ctx.cancel(restT);
      restT = ctx.after(1400, restMallet);
    }
    let restT = 0;
    const held = new Map();
    function userHit(i, x, y) {
      if (playing) return;
      hit(i, x, y);
      ctx.hint(null);
      if (rec) {
        const t = performance.now() - rec.t0;
        rec.list.push([i, Math.round(t)]);
        st.innerHTML = KP.E("🎵") + " " + rec.list.length;
        if (rec.list.length >= 150 || t > 45000) stopRec();
      }
    }
    frame.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".xy-bar");
      if (!b) return;
      e.preventDefault();
      A.unlock();
      try {
        b.releasePointerCapture(e.pointerId);
      } catch (_) {}
      held.set(e.pointerId, b);
      userHit(+b.dataset.i, e.clientX, e.clientY);
    });
    frame.addEventListener("pointermove", (e) => {
      if (!held.has(e.pointerId)) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const b = el && el.closest && el.closest(".xy-bar");
      if (b && b !== held.get(e.pointerId)) {
        held.set(e.pointerId, b);
        userHit(+b.dataset.i, e.clientX, e.clientY);
      }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => frame.addEventListener(ev, (e) => held.delete(e.pointerId)));

    /* ---------- 녹음 · 재생 ---------- */
    let rec = null,
      playing = false,
      saved = KP.store.get("xylo:rec", []);
    function stopRec(quiet) {
      if (!rec) return;
      const list = rec.list;
      rec = null;
      bRec.classList.remove("on");
      bRec.innerHTML = KP.E("🔴") + " 녹음";
      if (list.length) {
        saved = list;
        KP.store.set("xylo:rec", saved);
        st.innerHTML = KP.E("💾") + " " + list.length;
        if (quiet) return;
        KP.voice.say("녹음했어요! 듣기 단추를 누르면 내 연주를 들을 수 있어요.");
        ctx.hint(() => bPlay, "듣기 단추를 눌러요!");
      } else {
        st.textContent = "";
        if (!quiet) KP.voice.say("녹음을 그만했어요.");
      }
    }
    ctx.tap(bRec, () => {
      if (playing) stopPlay();
      if (rec) return stopRec();
      rec = { t0: performance.now(), list: [] };
      bRec.classList.add("on");
      bRec.innerHTML = KP.E("⏹️") + " 그만";
      st.innerHTML = KP.E("🎵") + " 0";
      A.note("A5", { inst: "bell", dur: 0.3, vol: 0.15 });
      KP.voice.say("녹음 시작! 실로폰을 쳐 봐요. 다 치면 그만 단추를 눌러요.");
      ctx.hint(() => bars[0], "실로폰을 쳐 봐요!");
    });
    let playGen = 0;
    function stopPlay() {
      playing = false;
      playGen++;
      bPlay.classList.remove("on");
      bPlay.innerHTML = KP.E("▶️") + " 듣기";
    }
    ctx.tap(bPlay, () => {
      if (rec) stopRec();
      if (playing) {
        stopPlay();
        return;
      }
      if (!saved.length) {
        U.replay(bPlay, "wrong");
        KP.voice.say("먼저 빨간 녹음 단추를 누르고 연주해 봐요!");
        ctx.hint(() => bRec, "빨간 녹음 단추를 눌러요!");
        return;
      }
      playing = true;
      const gen = ++playGen;
      bPlay.classList.add("on");
      bPlay.innerHTML = KP.E("⏹️") + " 멈춤";
      ctx.hint(null);
      const t0 = saved[0][1];
      saved.forEach(([i, t]) => ctx.after(t - t0 + 250, () => gen === playGen && hit(i)));
      const end = saved[saved.length - 1][1] - t0 + 1300;
      ctx.after(end, async () => {
        if (gen !== playGen) return;
        stopPlay();
        const ok = await ctx.win({ msg: "멋진 연주예요!" });
        if (ok) ctx.say("또 녹음해 볼까요? 빨간 단추를 눌러요!");
      });
    });

    ctx.stopRec = stopRec;
    ctx.init = () => {
      if (rec) stopRec(true);
      stopPlay();
      saved = KP.store.get("xylo:rec", []);
      st.innerHTML = saved.length ? KP.E("💾") + " " + saved.length : "";
      requestAnimationFrame(layout);
    };
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.init();
    ctx.say("실로폰을 똑똑 쳐 봐요! 빨간 단추를 누르면 녹음할 수 있어요.");
    ctx.hint(() => ctx.body.querySelector(".xy-bar"), "실로폰을 쳐 봐요!");
  },
  stop(ctx) {
    ctx.stopRec(true);
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
