/* 자동차 경주 — 내 차를 고르고, 화면을 콕콕 연타하면 부릉부릉 달려요!
   - 차 5종(경주차·자동차·경찰차·소방차·버스)을 직접 그림, 바퀴가 진짜로 굴러감, 먼지 폴폴
   - 출발 신호등 → 결승 깃발. 상대 차(여우)는 대부분 아이가 이길 수 있게 (단계마다 조금씩 빨라짐)
   - 지면 "아깝다! 다시 해 볼까?" — 벌 없음, 다음 판은 상대가 조금 더 느긋해짐 */
"use strict";
KP.game({
  id: "race",
  icon: "🏎️",
  name: "자동차 경주",
  cat: "play",
  levels: 3,
  score: "🏁",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("race", `
      .rc-board{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#8fd3ff 0%,#c6ecff 26%,#7ccf6a 26%,#5fb956 100%)}
      .rc-crowd{position:absolute;left:0;right:0;top:4%;height:18%;display:flex;justify-content:space-around;align-items:flex-end;font-size:clamp(28px,4.4vw,48px);pointer-events:none}
      .rc-crowd span{animation:rc-cheer 0.6s ease-in-out infinite alternate;animation-delay:var(--dl)}
      @keyframes rc-cheer{to{transform:translateY(-8px)}}
      .rc-road{position:absolute;left:0;right:0;top:32%;height:62%;background:linear-gradient(#6b7083,#585d70);box-shadow:inset 0 6px 0 #e9edf5,inset 0 -6px 0 #e9edf5}
      .rc-mid{position:absolute;left:0;right:0;top:calc(50% - 3px);height:6px;background:repeating-linear-gradient(90deg,#fff 0 34px,transparent 34px 68px)}
      .rc-road.move .rc-mid{animation:rc-dash .4s linear infinite}
      @keyframes rc-dash{to{background-position:-68px 0}}
      .rc-start{position:absolute;top:0;bottom:0;left:calc(var(--cw)*1.02 + 14px);width:8px;background:#fff;opacity:.85}
      .rc-finish{position:absolute;top:0;bottom:0;right:clamp(14px,3vw,40px);width:clamp(20px,2.6vw,30px);
        background:conic-gradient(#222 25%,#fff 0 50%,#222 0 75%,#fff 0) 0 0/clamp(10px,1.3vw,15px) clamp(10px,1.3vw,15px)}
      .rc-flag{position:absolute;right:clamp(0px,1vw,16px);top:calc(32% - clamp(56px,8vw,86px));font-size:clamp(56px,8vw,86px);line-height:1;pointer-events:none;transform-origin:20% 100%;animation:rc-flag 1s ease-in-out infinite alternate}
      @keyframes rc-flag{to{transform:rotate(-8deg)}}
      .rc-car{position:absolute;left:0;width:var(--cw);height:calc(var(--cw)*.5);z-index:2}
      .rc-car.hintGlow{position:absolute;border-radius:20px}
      .rc-car svg{width:100%;height:100%;display:block;overflow:visible}
      .rc-car .drv{position:absolute;width:var(--ds);height:var(--ds);font-size:var(--ds);line-height:1}
      .rc-car .drv .e{width:100%;height:100%;display:block}
      .rc-body{animation:rc-bob .18s ease-in-out infinite alternate;transform-origin:50% 100%}
      .rc-car.idle .rc-body{animation-duration:.5s}
      @keyframes rc-bob{to{transform:translateY(-2px)}}
      .rc-blink{animation:rc-blink .5s steps(1) infinite}
      @keyframes rc-blink{50%{opacity:.2}}
      .rc-dust{position:absolute;width:var(--p);height:var(--p);border-radius:50%;background:rgba(235,225,205,.9);pointer-events:none;z-index:1;animation:rc-dust .7s ease-out forwards}
      @keyframes rc-dust{from{transform:scale(.4)}to{transform:translate(-60px,-18px) scale(1.5);opacity:0}}
      .rc-line{position:absolute;height:4px;border-radius:2px;background:rgba(255,255,255,.8);pointer-events:none;animation:rc-line .35s linear forwards}
      @keyframes rc-line{to{transform:translateX(-70px);opacity:0}}
      .rc-light{position:absolute;left:50%;top:6%;transform:translateX(-50%);display:flex;gap:10px;background:#2d3142;padding:10px 14px;border-radius:22px;z-index:5;box-shadow:0 6px 0 rgba(0,0,0,.2);pointer-events:none;transition:opacity .4s}
      .rc-light i{width:clamp(34px,5vw,54px);height:clamp(34px,5vw,54px);border-radius:50%;background:#555a6b}
      .rc-light i.r{background:#ff4b4b;box-shadow:0 0 18px #ff4b4b}.rc-light i.g{background:#3ddc6a;box-shadow:0 0 22px #3ddc6a}
      .rc-light.hide{opacity:0}
      .rc-big{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:clamp(60px,11vw,120px);color:#fff;-webkit-text-stroke:5px #ff7452;paint-order:stroke;text-shadow:0 6px 0 #c94a2c;z-index:6;pointer-events:none;white-space:nowrap;opacity:0}
      .rc-big.show{animation:rc-big 1.1s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes rc-big{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
      .rc-tap{position:absolute;right:12px;bottom:12px;z-index:4;font-size:clamp(20px,3vw,28px);color:#fff;background:var(--coral);border-radius:999px;padding:10px 18px;box-shadow:0 6px 0 #c94a2c;pointer-events:none;animation:rc-tap .5s ease-in-out infinite alternate}
      @keyframes rc-tap{to{transform:scale(1.08)}}
      .rc-pick{position:absolute;inset:0;z-index:8;background:rgba(255,255,255,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2vh,22px);padding:12px}
      .rc-pick h2{font-weight:400;font-size:clamp(26px,4vw,40px);color:var(--ink)}
      .rc-opts{display:flex;flex-wrap:wrap;gap:clamp(10px,1.8vw,20px);justify-content:center;max-width:1000px}
      .rc-opt{width:clamp(140px,17vw,190px);padding:10px 10px 8px;background:#fff;border-radius:24px;box-shadow:0 7px 0 rgba(47,58,102,.14);display:flex;flex-direction:column;align-items:center;gap:4px;
        font-size:clamp(17px,2.2vw,22px);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*70ms)}
      .rc-opt .rc-car{position:relative;--cw:clamp(118px,calc(17vw - 22px),168px)}
      .rc-opt:active{transform:translateY(5px)}
      .rc-opt.sel{background:#fff5c9;box-shadow:0 0 0 5px #ffc531,0 7px 0 rgba(47,58,102,.14)}
    `);
    // 차 그리기 (오른쪽을 보는 옆모습, viewBox 200x100)
    const wheel = (x, r) =>
      '<g class="rc-wh" style="transform-origin:' + x + "px " + (96 - r) + 'px"><circle cx="' + x + '" cy="' + (96 - r) + '" r="' + r + '" fill="#2b2f3a"/>' +
      '<circle cx="' + x + '" cy="' + (96 - r) + '" r="' + r * 0.5 + '" fill="#d8dde9"/>' +
      '<path d="M' + x + " " + (96 - r * 1.45) + " V" + (96 - r * 0.55) + " M" + (x - r * 0.45) + " " + (96 - r) + " H" + (x + r * 0.45) + '" stroke="#8a93a8" stroke-width="3" stroke-linecap="round"/></g>';
    ctx.CARS = [
      {
        key: "race", name: "경주용 자동차", drv: [52, 14, 26],
        svg: '<path d="M4 44 h28 v8 h-9 l-4 14 h-6 l2-14 h-11z" fill="#333"/>' +
          '<path d="M6 76 Q6 62 22 60 L68 56 Q84 40 104 38 L128 38 Q142 40 148 54 L184 60 Q197 62 197 76 Z" fill="#ff3b3b"/>' +
          '<path d="M90 54 Q98 42 112 42 L126 42 Q136 44 138 54 Z" fill="#bfe6ff"/><rect x="18" y="64" width="172" height="5" rx="2" fill="#fff" opacity=".85"/>' +
          '<circle cx="66" cy="66" r="9" fill="#fff"/><text x="66" y="70.5" font-size="12" text-anchor="middle" fill="#ff3b3b" font-family="sans-serif" font-weight="bold">1</text>' +
          '<circle cx="192" cy="66" r="3.5" fill="#ffe36a"/>' + wheel(46, 19) + wheel(158, 19),
      },
      {
        key: "car", name: "파란 자동차", drv: [60, 18, 24],
        svg: '<path d="M8 78 Q8 58 26 56 L52 54 L72 30 Q78 24 88 24 L132 24 Q142 24 150 32 L168 54 L184 56 Q196 58 196 78 Z" fill="#2f8cff"/>' +
          '<path d="M78 52 L91 32 L111 32 L111 52 Z" fill="#bfe6ff"/><path d="M117 52 L117 32 L136 32 Q142 32 146 38 L157 52 Z" fill="#bfe6ff"/>' +
          '<rect x="10" y="60" width="8" height="6" rx="2" fill="#ff5b5b"/><circle cx="190" cy="63" r="4" fill="#ffe36a"/>' + wheel(50, 18) + wheel(154, 18),
      },
      {
        key: "police", name: "경찰차", drv: [60, 18, 24],
        svg: '<rect x="96" y="14" width="12" height="9" rx="3" fill="#ff3b3b" class="rc-blink"/><rect x="108" y="14" width="12" height="9" rx="3" fill="#2f8cff" class="rc-blink" style="animation-delay:-.25s"/>' +
          '<path d="M8 78 Q8 58 26 56 L52 54 L72 30 Q78 24 88 24 L132 24 Q142 24 150 32 L168 54 L184 56 Q196 58 196 78 Z" fill="#fff" stroke="#d6dbe8" stroke-width="2"/>' +
          '<path d="M8 66 L196 66 L196 78 L8 78 Z" fill="#2d3142"/>' +
          '<path d="M78 52 L91 32 L111 32 L111 52 Z" fill="#bfe6ff"/><path d="M117 52 L117 32 L136 32 Q142 32 146 38 L157 52 Z" fill="#bfe6ff"/>' +
          '<path d="M100 56 l3 6 6 1 -4.5 4 1 6 -5.5-3 -5.5 3 1-6 -4.5-4 6-1z" fill="#ffc531"/><circle cx="190" cy="62" r="4" fill="#ffe36a"/>' + wheel(50, 18) + wheel(154, 18),
      },
      {
        key: "fire", name: "소방차", drv: [81, 26, 18],
        svg: '<rect x="12" y="18" width="134" height="6" rx="2" fill="#c7ccd8"/>' +
          Array.from({ length: 9 }, (_, i) => '<rect x="' + (18 + i * 14) + '" y="16" width="3" height="10" fill="#c7ccd8"/>').join("") +
          '<rect x="6" y="28" width="150" height="50" rx="6" fill="#e83a3a"/><path d="M156 78 V40 Q156 30 166 30 L182 30 L197 54 V78 Z" fill="#e83a3a"/>' +
          '<path d="M164 36 L180 36 L191 54 L164 54 Z" fill="#bfe6ff"/><rect x="6" y="58" width="191" height="6" fill="#fff"/>' +
          '<rect x="20" y="36" width="34" height="16" rx="3" fill="#b82424"/><rect x="62" y="36" width="34" height="16" rx="3" fill="#b82424"/><rect x="104" y="36" width="34" height="16" rx="3" fill="#b82424"/>' +
          '<rect x="168" y="22" width="12" height="8" rx="3" fill="#2f8cff" class="rc-blink"/><circle cx="193" cy="66" r="3.5" fill="#ffe36a"/>' + wheel(40, 17) + wheel(160, 17),
      },
      {
        key: "bus", name: "노란 버스", drv: [83, 26, 17],
        svg: '<rect x="6" y="22" width="188" height="56" rx="14" fill="#ffc531"/>' +
          [14, 46, 78, 110, 142].map((x) => '<rect x="' + x + '" y="30" width="26" height="20" rx="4" fill="#bfe6ff"/>').join("") +
          '<path d="M172 30 H184 Q192 30 193 40 V50 H172 Z" fill="#bfe6ff"/><rect x="6" y="56" width="188" height="5" fill="#e08a00"/>' +
          '<circle cx="190" cy="66" r="4" fill="#fff4b0"/>' + wheel(44, 17) + wheel(156, 17),
      },
    ];
    ctx.carHTML = (c, driver) =>
      '<div class="rc-body"><svg viewBox="0 0 200 100">' + c.svg + '</svg><div class="drv" style="left:' + c.drv[0] + "%;top:" + c.drv[1] + "%;--ds:calc(var(--cw)*" + c.drv[2] / 100 + ')">' + KP.E(driver) + "</div></div>";

    const board = U.el("div", "rc-board");
    board.dataset.tap = "1";
    board.innerHTML =
      '<div class="rc-crowd">' + ["🐰", "🐼", "🐶", "🐱", "🐵", "🐸", "🐯"].map((e, i) => '<span style="--dl:-' + i * 0.17 + 's">' + KP.E(e) + "</span>").join("") + "</div>" +
      '<div class="rc-road"><div class="rc-mid"></div><div class="rc-start"></div><div class="rc-finish"></div></div>' +
      '<div class="rc-flag">' + KP.E("🏁") + "</div>" +
      '<div class="rc-light hide"><i></i><i></i><i></i></div><div class="rc-big"></div><div class="rc-tap">' + KP.E("👆") + " 콕콕!</div>";
    const me = U.el("div", "rc-car");
    const opp = U.el("div", "rc-car");
    board.append(opp, me);
    const pick = U.el("div", "rc-pick", "<h2>어떤 차를 탈까요?</h2>");
    const opts = U.el("div", "rc-opts");
    pick.appendChild(opts);
    board.appendChild(pick);
    ctx.body.appendChild(board);
    Object.assign(ctx, { board, me, opp, pick, opts, road: U.$(".rc-road", board), light: U.$(".rc-light", board), bigEl: U.$(".rc-big", board), tapEl: U.$(".rc-tap", board) });

    ctx.ctl = { state: "pick" };
    ctx.losses = 0;
    ctx.round = 0;

    ctx.size = () => {
      const W = board.clientWidth,
        H = board.clientHeight;
      const cw = Math.round(U.clamp(Math.min(W * 0.26, H * 0.5), 96, 230));
      board.style.setProperty("--cw", cw + "px");
      ctx.cw = cw;
      const roadTop = H * 0.32,
        roadH = H * 0.62;
      opp.style.top = roadTop + roadH * 0.25 - cw * 0.42 + "px";
      me.style.top = roadTop + roadH * 0.75 - cw * 0.42 + "px";
      ctx.startX = 8;
      ctx.finishX = W - U.clamp(W * 0.03, 14, 40) - cw * 0.92;
    };
    addEventListener("resize", () => ctx._active && ctx.size());

    ctx.bigText = (t) => {
      ctx.bigEl.textContent = t;
      U.replay(ctx.bigEl, "show");
    };
    const dust = (car, x) => {
      const top = parseFloat(car.style.top) + ctx.cw * 0.4;
      for (let i = 0; i < 3; i++) {
        const d = U.el("div", "rc-dust");
        d.style.cssText = "left:" + (x + U.randf(-4, 8)) + "px;top:" + (top + U.randf(-6, 6)) + "px;--p:" + U.randf(14, 28) + "px";
        board.appendChild(d);
        ctx.after(720, () => d.remove());
      }
    };
    const vroom = (pitch) => {
      A.tone(90 + pitch * 60, { to: 160 + pitch * 90, dur: 0.16, vol: 0.12, type: "triangle" });
      A.noise({ dur: 0.08, vol: 0.05, lp: 500 });
    };

    // 판 아무 데나 콕 → 내 차 달리기
    ctx.fast(board, () => {
      const c = ctx.ctl;
      if (c.state === "race") {
        c.pT = Math.min(1, c.pT + 1 / c.taps);
        c.tapN++;
        c.lastTap = c.t;
        dust(me, ctx.startX + c.p * (ctx.finishX - ctx.startX) - 6);
        vroom(c.p);
        if (c.tapN === 3) ctx.tapEl.style.display = "none";
      } else if (c.state === "ready") {
        A.note("E5", { inst: "soft", dur: 0.12, vol: 0.12 });
        A.note("E5", { inst: "soft", dur: 0.12, vol: 0.12, when: 0.16 });
      }
    });

    ctx.frame = (dt) => {
      const c = ctx.ctl;
      if (c.state !== "race" && c.state !== "end") return;
      if (c.state === "race") {
        // 내 차: 목표 위치로 부드럽게 (최고 속도 제한)
        const d = c.pT - c.p;
        c.p += Math.min(d, Math.max(0.1 * dt, d * 4 * dt), 0.45 * dt);
        // 상대 차: 기본 속도 + 아이가 뒤처지면 살짝 느려짐
        const gap = c.o - c.p;
        // 열심히 누르는 중이면 상대가 살짝 봐줌 (안 누르면 그냥 달림)
        const trying = c.t - (c.lastTap || -9) < 1.5;
        let v = c.ov * (trying ? (gap > 0.12 ? 0.55 : gap > 0.04 ? 0.8 : 1) : 1);
        if (c.t < 1) v *= c.t; // 천천히 출발
        c.o = Math.min(1, c.o + v * dt);
        c.t += dt;
        if (c.p >= 1 || c.o >= 1) {
          c.state = "end";
          ctx.finish(c.p >= 1);
        }
      }
      const span = ctx.finishX - ctx.startX;
      me.style.left = ctx.startX + c.p * span + "px";
      opp.style.left = ctx.startX + c.o * span + "px";
      // 바퀴 굴리기
      c.wm = (c.wm || 0) + (c.p - (c.lp || 0)) * span * 3.2;
      c.wo = (c.wo || 0) + (c.o - (c.lo || 0)) * span * 3.2;
      c.lp = c.p;
      c.lo = c.o;
      me.querySelectorAll(".rc-wh").forEach((w) => (w.style.transform = "rotate(" + c.wm + "deg)"));
      opp.querySelectorAll(".rc-wh").forEach((w) => (w.style.transform = "rotate(" + c.wo + "deg)"));
      ctx.road.classList.toggle("move", c.state === "race");
    };

    ctx.finish = async (won) => {
      ctx.hint(null);
      ctx.tapEl.style.display = "none";
      if (won) {
        ctx.losses = 0;
        ctx.bigText("1등!");
        A.sfx("levelup");
        KP.voice.say("우승! 1등이에요!");
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1200);
        const big = ctx.round % 4 === 0;
        const ok = await ctx.win({ big, msg: big ? "레이싱 챔피언 형아!" : "결승선 통과!" });
        if (ok) this.showPick(ctx);
      } else {
        ctx.losses++;
        ctx.bigText("아깝다!");
        A.sfx("boing");
        KP.voice.say("아깝다! 다시 해 볼까? 콕콕 더 빨리 눌러 봐요!");
        await ctx.wait(2600);
        if (ctx._active) this.race(ctx, ctx.myCar);
      }
    };
  },
  start(ctx) {
    ctx.round = 0;
    ctx.losses = 0;
    requestAnimationFrame(() => {
      ctx.size();
      ctx.loop((dt) => ctx.frame(dt));
    });
    this.showPick(ctx);
  },
  showPick(ctx) {
    const U = KP.u;
    ctx.ctl = { state: "pick", p: 0, o: 0 };
    ctx.pick.style.display = "";
    ctx.opts.innerHTML = "";
    ctx.light.classList.add("hide");
    ctx.tapEl.style.display = "none";
    ctx.say("어떤 차를 탈까요? 골라 봐요! 🏎️");
    const btns = ctx.CARS.map((c, i) => {
      const b = U.el("button", "rc-opt", '<div class="rc-car idle">' + ctx.carHTML(c, "👦") + "</div><span>" + c.name + "</span>");
      b.style.setProperty("--i", i);
      ctx.tap(b, () => {
        if (ctx.ctl.state !== "pick") return;
        ctx.ctl.state = "chosen";
        b.classList.add("sel");
        U.replay(b, "jump");
        KP.audio.sfx("select");
        KP.voice.say(c.name + " 출발 준비!");
        ctx.after(900, () => this.race(ctx, c));
      });
      ctx.opts.appendChild(b);
      return b;
    });
    ctx.hint(() => btns[0], "타고 싶은 차를 콕 눌러요!");
  },
  async race(ctx, car) {
    const U = KP.u,
      A = KP.audio;
    ctx.myCar = car;
    ctx.pick.style.display = "none";
    const others = ctx.CARS.filter((c) => c !== car);
    const oc = U.pick(others);
    ctx.me.innerHTML = ctx.carHTML(car, "👦");
    ctx.opp.innerHTML = ctx.carHTML(oc, "🦊");
    ctx.size();
    const lv = ctx.level;
    // 상대 차가 끝까지 가는 시간(초): 질수록 느긋해짐
    const T = [15, 12, 10][lv - 1] + Math.min(ctx.losses, 3) * 2.5;
    ctx.ctl = { state: "ready", p: 0, pT: 0, o: 0, ov: 1 / T, t: 0, taps: [18, 22, 26][lv - 1], tapN: 0 };
    ctx.say("화면을 콕콕콕 빨리 누르면 내 차가 달려요!");
    // 출발 신호
    const L = ctx.light,
      lamps = L.querySelectorAll("i");
    L.classList.remove("hide");
    lamps.forEach((l) => (l.className = ""));
    await ctx.wait(1700);
    if (!ctx._active) return;
    const SAY = ["셋", "둘", "하나"];
    for (let i = 0; i < 3; i++) {
      lamps[i].className = "r";
      ctx.bigText(3 - i);
      KP.voice.say(SAY[i]);
      A.note("C5", { inst: "bell", dur: 0.3, vol: 0.22 });
      await ctx.wait(850);
      if (!ctx._active) return;
    }
    lamps.forEach((l) => (l.className = "g"));
    ctx.bigText("출발!");
    KP.voice.say("출발!");
    A.note("C6", { inst: "bell", dur: 0.6, vol: 0.28 });
    ctx.ctl.state = "race";
    ctx.tapEl.style.display = "";
    ctx.hint(() => ctx.me, "화면을 콕콕콕 눌러요!");
    ctx.after(1500, () => L.classList.add("hide"));
  },
});
