/* 초록불 빨간불 — 신호등을 보고 토끼를 당근까지 데려다줘요
   - 초록불일 때 누르면 토끼가 깡총 앞으로 / 빨간불일 때 누르면 깜짝 멈칫 ("빨간불엔 멈춰요!")
   - 뒤로 가는 벌칙은 2단계부터 아주 조금만
   1단계: 신호가 천천히 바뀜 / 2단계: 조금 빨리 / 3단계: 노란불 추가 */
"use strict";
KP.game({
  id: "light",
  icon: "🚦",
  name: "초록불 빨간불",
  cat: "play",
  levels: 3,
  score: "🥕",
  setup(ctx) {
    const U = KP.u;
    KP.css("light", `
      .lt-scene{flex:1;min-height:0;position:relative;margin:0 12px 8px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#bfe8ff 0%,#e6f7ff 44%,#9ddc86 44%,#74c262 100%)}
      .lt-hill{position:absolute;bottom:56%;border-radius:50% 50% 0 0;background:#b6e6a2;pointer-events:none}
      .lt-path{position:absolute;left:0;right:0;top:62%;height:clamp(54px,11%,96px);background:linear-gradient(#e9c88f,#d9b072);box-shadow:inset 0 5px 0 rgba(255,255,255,.35),inset 0 -5px 0 rgba(0,0,0,.08)}
      .lt-path::after{content:"";position:absolute;left:0;right:0;top:calc(50% - 3px);height:6px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.7) 0 26px,transparent 26px 52px)}
      .lt-deco{position:absolute;font-size:clamp(24px,3.6vw,38px);pointer-events:none}
      .lt-signal{position:absolute;left:50%;top:5%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:2}
      .lt-box{display:flex;flex-direction:column;gap:clamp(6px,1vh,10px);background:#2d3142;padding:clamp(8px,1.4vh,14px);border-radius:24px;box-shadow:0 6px 0 rgba(0,0,0,.25),inset 0 3px 0 rgba(255,255,255,.12)}
      .lt-lamp{width:var(--ls);height:var(--ls);border-radius:50%;background:#4a4f63;box-shadow:inset 0 4px 6px rgba(0,0,0,.4);transition:background .15s,box-shadow .15s;position:relative}
      .lt-lamp .face{position:absolute;inset:18%;display:none;font-size:calc(var(--ls)*.6);line-height:1;align-items:center;justify-content:center}
      .lt-lamp.on .face{display:flex}
      .lt-lamp.r.on{background:radial-gradient(circle at 40% 35%,#ffb3b3,#ff3b3b 60%);box-shadow:0 0 26px 8px rgba(255,60,60,.7)}
      .lt-lamp.y.on{background:radial-gradient(circle at 40% 35%,#fff3b0,#ffc531 60%);box-shadow:0 0 26px 8px rgba(255,197,49,.7)}
      .lt-lamp.g.on{background:radial-gradient(circle at 40% 35%,#c8ffd6,#2fd46a 60%);box-shadow:0 0 26px 8px rgba(47,212,106,.7)}
      .lt-pole{width:12px;height:clamp(20px,6vh,60px);background:linear-gradient(90deg,#666b80,#8a90a6,#666b80)}
      .lt-rab{position:absolute;left:0;top:0;width:var(--rs);height:var(--rs);z-index:3;transition:left .45s cubic-bezier(.3,.9,.5,1)}
      .lt-rab.hintGlow{position:absolute;border-radius:50%}
      .lt-rabi{width:100%;height:100%;transform:scaleX(-1);font-size:var(--rs);line-height:1}
      .lt-rabi .e{width:100%;height:100%;display:block}
      .lt-rab.hop .lt-rabi{animation:lt-hop .45s ease-out}
      @keyframes lt-hop{0%{transform:scaleX(-1) scale(1,.85)}40%{transform:scaleX(-1) translateY(-45%) scale(.95,1.08)}80%{transform:scaleX(-1) translateY(0) scale(1.06,.9)}100%{transform:scaleX(-1)}}
      .lt-rab.idle .lt-rabi{animation:lt-idle 1.6s ease-in-out infinite}
      @keyframes lt-idle{50%{transform:scaleX(-1) scale(1.03,.97)}}
      .lt-rab.oops .lt-rabi{animation:lt-oops .5s}
      @keyframes lt-oops{0%{transform:scaleX(-1)}30%{transform:scaleX(-1) translateY(-20%) rotate(8deg)}60%{transform:scaleX(-1) rotate(-6deg)}100%{transform:scaleX(-1)}}
      .lt-bang{position:absolute;left:50%;bottom:95%;transform:translateX(-50%);font-size:calc(var(--rs)*.5);pointer-events:none;animation:popBig .35s cubic-bezier(.2,1.6,.4,1)}
      .lt-carrot{position:absolute;width:var(--rs);height:var(--rs);font-size:var(--rs);line-height:1;z-index:2;transform:rotate(-20deg);animation:lt-car 1.2s ease-in-out infinite alternate;pointer-events:none}
      .lt-carrot .e{width:100%;height:100%;display:block}
      @keyframes lt-car{to{transform:rotate(-8deg) scale(1.06)}}
      .lt-carrot.eat{animation:lt-eat .9s forwards}
      @keyframes lt-eat{30%{transform:scale(.8) rotate(10deg)}60%{transform:scale(.5) rotate(-10deg)}100%{transform:scale(0);opacity:0}}
      .lt-print{position:absolute;font-size:calc(var(--rs)*.28);opacity:.5;pointer-events:none;animation:lt-print 2.5s forwards}
      @keyframes lt-print{to{opacity:0}}
      .lt-dot{position:absolute;width:calc(var(--rs)*.22);height:calc(var(--rs)*.22);border-radius:50%;background:rgba(255,255,255,.55);pointer-events:none;transform:translate(-50%,-50%)}
      .lt-dot.done{background:#ffc531;box-shadow:0 0 0 3px #fff}
      .lt-heart{position:absolute;font-size:clamp(24px,3.4vw,34px);pointer-events:none;z-index:5;animation:lt-heart 1.2s ease-out forwards}
      @keyframes lt-heart{to{transform:translate(var(--dx),-100px) scale(1.3);opacity:0}}
      .lt-go{flex:0 0 auto;align-self:center;margin:0 0 12px;font-size:clamp(26px,3.8vw,36px);display:flex;align-items:center;gap:10px;padding:12px 34px;border-radius:999px;color:#fff;
        background:#2fb466;box-shadow:0 7px 0 #1d8a49;transition:background .2s,box-shadow .2s;min-height:76px}
      .lt-go:active{transform:translateY(5px);box-shadow:0 2px 0 rgba(0,0,0,.2)}
      .lt-go.r{background:#ff5b5b;box-shadow:0 7px 0 #c93a3a}.lt-go.y{background:#ffb020;box-shadow:0 7px 0 #c98600}
      .lt-go .e{font-size:1.2em}
    `);
    const scene = U.el("div", "lt-scene");
    scene.dataset.tap = "1";
    scene.innerHTML =
      '<div class="lt-hill" style="left:-8%;width:46%;height:16%"></div><div class="lt-hill" style="right:-10%;width:55%;height:12%;background:#a6dd90"></div>' +
      '<div class="lt-path"></div>' +
      '<div class="lt-deco" style="left:4%;top:50%">' + KP.E("🌷") + '</div><div class="lt-deco" style="left:30%;top:84%">' + KP.E("🌼") + "</div>" +
      '<div class="lt-deco" style="left:62%;top:86%">' + KP.E("🍄") + '</div><div class="lt-deco" style="right:6%;top:50%">' + KP.E("🌸") + "</div>" +
      '<div class="lt-deco" style="left:14%;top:10%;font-size:clamp(30px,5vw,54px)">' + KP.E("☁️") + "</div>" +
      '<div class="lt-signal"><div class="lt-box"><div class="lt-lamp r"><span class="face">' + KP.E("✋") + '</span></div><div class="lt-lamp y"><span class="face">' + KP.E("✋") + '</span></div><div class="lt-lamp g"><span class="face">' + KP.E("🐾") + "</span></div></div>" +
      '<div class="lt-pole"></div></div>';
    const carrot = U.el("div", "lt-carrot", KP.E("🥕"));
    const rab = U.el("div", "lt-rab idle", '<div class="lt-rabi">' + KP.E("🐇") + "</div>");
    scene.append(carrot, rab);
    const go = U.btn(KP.E("🐾") + "<span>깡총!</span>", "lt-go");
    ctx.body.append(scene, go);
    Object.assign(ctx, { scene, carrot, rab, go, lamps: U.$$(".lt-lamp", scene), signalEl: U.$(".lt-box", scene) });

    ctx.size = () => {
      const W = scene.clientWidth,
        H = scene.clientHeight;
      const rs = Math.round(U.clamp(Math.min(W / (ctx.steps + 3), H * 0.2), 60, 130));
      scene.style.setProperty("--rs", rs + "px");
      scene.style.setProperty("--ls", Math.round(U.clamp(H * (ctx.yellow ? 0.1 : 0.13), 36, 84)) + "px");
      ctx.rs = rs;
      const pathTop = H * 0.62,
        pathH = U.clamp(H * 0.11, 54, 96);
      const y = pathTop + pathH / 2 - rs * 0.82;
      rab.style.top = y + "px";
      carrot.style.top = pathTop + pathH / 2 - rs * 0.7 + "px";
      ctx.x0 = 10;
      ctx.x1 = W - rs * 1.9;
      carrot.style.left = W - rs * 1.15 + "px";
      ctx.placeRab();
      // 발자국 자리 점
      scene.querySelectorAll(".lt-dot").forEach((d) => d.remove());
      for (let i = 1; i <= ctx.steps; i++) {
        const d = U.el("div", "lt-dot" + (i <= ctx.pos ? " done" : ""));
        d.style.left = ctx.x0 + rs / 2 + ((ctx.x1 - ctx.x0) * i) / ctx.steps + "px";
        d.style.top = pathTop + pathH / 2 + "px";
        scene.insertBefore(d, carrot);
      }
    };
    ctx.placeRab = () => {
      rab.style.left = ctx.x0 + ((ctx.x1 - ctx.x0) * Math.max(0, ctx.pos)) / ctx.steps + "px";
      U.$$(".lt-dot", scene).forEach((d, i) => d.classList.toggle("done", i < Math.floor(ctx.pos)));
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    ctx.steps = [7, 9, 11][lv - 1];
    ctx.yellow = lv === 3;
    ctx.pos = 0;
    ctx.lamps[1].style.display = ctx.yellow ? "" : "none";
    ctx.carrot.classList.remove("eat");
    ctx.rab.className = "lt-rab idle";
    ctx.size();
    let sig = "r",
      done = false,
      lastTalk = 0;
    const DUR = { g: [4.5, 3.4, 2.8][lv - 1], y: 1.3, r: [3, 2.8, 2.6][lv - 1] };
    const setSig = (s, speak = true) => {
      sig = s;
      ctx.lamps.forEach((l) => l.classList.toggle("on", l.classList.contains(s)));
      ctx.go.className = "lt-go " + s;
      ctx.go.querySelector("span").textContent = s === "g" ? "깡총!" : s === "y" ? "기다려" : "멈춰!";
      if (!speak) return;
      if (s === "g") {
        A.note("C5", { inst: "bell", dur: 0.3, vol: 0.2 });
        A.note("G5", { inst: "bell", dur: 0.4, vol: 0.2, when: 0.12 });
        KP.voice.say("초록불! 깡총깡총!");
      } else if (s === "y") {
        A.note("E5", { inst: "bell", dur: 0.3, vol: 0.16 });
        KP.voice.say("노란불! 기다려요");
      } else {
        A.note("G4", { inst: "bell", dur: 0.3, vol: 0.18 });
        A.note("C4", { inst: "bell", dur: 0.4, vol: 0.18, when: 0.12 });
        KP.voice.say("빨간불! 멈춰요!");
      }
    };
    const cycle = () => {
      if (done) return;
      const nextS = sig === "g" ? (ctx.yellow ? "y" : "r") : sig === "y" ? "r" : "g";
      setSig(nextS);
      ctx.sigT = ctx.after(DUR[nextS] * 1000 * U.randf(0.8, 1.25), cycle);
    };
    ctx.say("초록불일 때만 깡총! 빨간불엔 멈춰요 🚦");
    setSig("r", false);
    ctx.after(2600, () => {
      setSig("g");
      ctx.sigT = ctx.after(DUR.g * 1000, cycle);
    });

    const hop = () => {
      if (done || KP.celebrating) return;
      const rab = ctx.rab;
      if (sig === "g") {
        ctx.pos = Math.min(ctx.steps, Math.floor(ctx.pos) + 1);
        rab.classList.remove("idle", "oops");
        U.replay(rab, "hop");
        ctx.placeRab();
        A.tone(380 + ctx.pos * 40, { to: 760 + ctx.pos * 50, dur: 0.16, vol: 0.12, type: "triangle" });
        A.note(A.SCALE[Math.min(ctx.pos - 1, 11)], { inst: "marimba", dur: 0.3, vol: 0.18, when: 0.12 });
        // 발자국
        const pr = U.el("div", "lt-print", KP.E("🐾"));
        pr.style.left = parseFloat(rab.style.left) + "px";
        pr.style.top = parseFloat(rab.style.top) + ctx.rs * 0.95 + "px";
        ctx.scene.insertBefore(pr, ctx.carrot);
        ctx.after(2600, () => pr.remove());
        if (ctx.pos >= ctx.steps) arrive();
      } else {
        // 빨간불/노란불 — 깜짝 멈칫
        rab.classList.remove("hop", "idle");
        U.replay(rab, "oops");
        const b = U.el("div", "lt-bang", KP.E(sig === "r" ? "❗" : "✋"));
        rab.appendChild(b);
        ctx.after(700, () => b.remove());
        A.tone(700, { to: 500, dur: 0.15, vol: 0.1, type: "triangle" });
        if (sig === "r" && lv >= 2 && ctx.pos > 0) {
          ctx.pos = Math.max(0, ctx.pos - 0.35);
          ctx.after(250, ctx.placeRab);
        }
        const now = Date.now();
        if (now - lastTalk > 2200) {
          lastTalk = now;
          ctx.miss(null, sig === "r" ? "빨간불엔 멈춰요!" : "노란불엔 기다려요!");
        }
      }
    };
    ctx.onHop = hop;
    if (!ctx.bound) {
      ctx.bound = true;
      ctx.fast(ctx.scene, () => ctx.onHop());
      ctx.fast(ctx.go, (e) => {
        e.stopPropagation();
        U.replay(ctx.go, "pop");
        ctx.onHop();
      });
    }
    const arrive = async () => {
      done = true;
      ctx.cancel(ctx.sigT);
      ctx.hint(null);
      ctx.carrot.classList.add("eat");
      KP.voice.say("당근 도착! 냠냠냠!");
      for (let i = 0; i < 3; i++) {
        A.noise({ dur: 0.08, vol: 0.12, hp: 1800, when: 0.2 + i * 0.25 });
        const h = U.el("div", "lt-heart", KP.E("💖"));
        h.style.cssText = "left:" + (parseFloat(ctx.carrot.style.left) + 10) + "px;top:" + ctx.carrot.style.top + ";--dx:" + (i - 1) * 40 + "px;animation-delay:" + i * 0.2 + "s";
        ctx.scene.appendChild(h);
        ctx.after(1700, () => h.remove());
      }
      ctx.score.add();
      await ctx.wait(1300);
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "신호등 박사 형아!" : "잘 기다렸어요!" });
      if (ok) this.next(ctx);
    };
    ctx.hint(() => (sig === "g" ? ctx.go : ctx.signalEl), "초록불이 켜지면 눌러요!");
  },
});
