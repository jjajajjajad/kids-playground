/* 로켓 발사 — 숫자를 차례대로 눌러 로켓에 힘을 모으고, 발사! 우주를 지나 달에 착륙!
   1단계: 1→5 세기 / 2단계: 1→10 세기 / 3단계: 10→1 카운트다운
   - 누를 때마다 큰 숫자 + 목소리, 로켓이 점점 더 덜덜 떨고 연기가 뭉게뭉게
   - 발사: 연기 기둥 → 별·행성 지나기 → 달 착륙 → 곰돌이 우주인이 손 흔들기 */
"use strict";
KP.game({
  id: "rocket",
  icon: "🚀",
  name: "로켓 발사",
  cat: "play",
  levels: 3,
  score: "🚀",
  setup(ctx) {
    const U = KP.u;
    KP.css("rocket", `
      .rk-scene{flex:1;min-height:0;position:relative;margin:0 12px 8px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#3b4aa8 0%,#7a6fd1 45%,#f4a6c0 80%,#ffd3a1 100%)}
      .rk-night{position:absolute;inset:0;background:linear-gradient(180deg,#05071d,#121a4a);opacity:0;transition:opacity 1.6s;pointer-events:none}
      .rk-scene.fly .rk-night,.rk-scene.land .rk-night{opacity:1}
      .rk-stars{position:absolute;left:0;right:0;top:-100%;height:200%;pointer-events:none;opacity:.55;
        background-image:radial-gradient(circle at 20% 30%,#fff 0 1.5px,transparent 2.5px),radial-gradient(circle at 70% 60%,#fff 0 1px,transparent 2px),radial-gradient(circle at 45% 85%,#fffbd0 0 2px,transparent 3px),radial-gradient(circle at 85% 15%,#fff 0 1px,transparent 2px);
        background-size:140px 140px,90px 110px,200px 170px,120px 90px}
      .rk-scene.fly .rk-stars{opacity:1;animation:rk-stream .5s linear infinite}
      .rk-scene.land .rk-stars{opacity:1}
      @keyframes rk-stream{to{transform:translateY(50%)}}
      .rk-ground{position:absolute;left:0;right:0;bottom:0;height:24%;transition:transform 1.6s ease-in;pointer-events:none}
      .rk-scene.fly .rk-ground,.rk-scene.land .rk-ground{transform:translateY(400%)}
      .rk-hill{position:absolute;left:-10%;right:-10%;bottom:0;height:80%;border-radius:50% 50% 0 0;background:linear-gradient(#6fcf6a,#3f9f4a)}
      .rk-padbase{position:absolute;left:50%;bottom:28%;width:clamp(120px,18vw,200px);height:16px;margin-left:calc(clamp(120px,18vw,200px)/-2);background:#5d6684;border-radius:6px;box-shadow:0 6px 0 #3e4560}
      .rk-tower{position:absolute;left:calc(50% + clamp(50px,7vw,80px));bottom:28%;width:22px;height:min(clamp(120px,24vh,230px),var(--rs) * 1.5);
        background:repeating-linear-gradient(45deg,transparent 0 8px,#d64545 8px 11px),repeating-linear-gradient(-45deg,transparent 0 8px,#d64545 8px 11px);border-left:4px solid #b83232;border-right:4px solid #b83232}
      .rk-moon{position:absolute;left:-20%;right:-20%;bottom:0;height:30%;border-radius:50% 50% 0 0/60% 60% 0 0;transform:translateY(110%);transition:transform 1.8s cubic-bezier(.2,.8,.3,1);pointer-events:none;
        background:radial-gradient(circle at 30% 30%,#9aa0b5 0 6%,transparent 6.5%),radial-gradient(circle at 62% 50%,#9aa0b5 0 4%,transparent 4.5%),radial-gradient(circle at 80% 25%,#9aa0b5 0 3%,transparent 3.5%),radial-gradient(circle at 45% 70%,#a8aec2 0 5%,transparent 5.5%),linear-gradient(#e9ebf3,#b9bed0)}
      .rk-scene.land .rk-moon{transform:none}
      .rk-thing{position:absolute;pointer-events:none;font-size:clamp(60px,10vw,110px);line-height:1;top:-30%;opacity:0}
      .rk-scene.fly .rk-thing{animation:rk-pass 2.6s linear forwards;animation-delay:var(--dl)}
      @keyframes rk-pass{0%{top:-30%;opacity:1}100%{top:120%;opacity:1}}
      .rk-rocket{position:absolute;left:50%;bottom:calc(6.7% + 16px);width:var(--rs);height:calc(var(--rs)*1.15);margin-left:calc(var(--rs)/-2);z-index:3;transition:bottom 1.6s ease-in}
      .rk-scene.fly .rk-rocket{bottom:42%}
      .rk-scene.land .rk-rocket{bottom:calc(30% - 18px);transition:bottom 2.2s cubic-bezier(.3,.7,.4,1)}
      .rk-ship{position:absolute;inset:0;animation:rk-shake .09s linear infinite alternate}
      @keyframes rk-shake{from{transform:translate(calc(var(--a,0)*-1px),calc(var(--a,0)*.5px))}to{transform:translate(calc(var(--a,0)*1px),calc(var(--a,0)*-.5px))}}
      .rk-img{position:absolute;left:0;right:0;top:0;height:var(--rs);font-size:var(--rs);line-height:1;transform:rotate(-45deg)}
      .rk-img .e{width:100%;height:100%;display:block}
      .rk-flame{position:absolute;left:50%;top:calc(var(--rs)*.9);width:calc(var(--rs)*.28);height:calc(var(--rs)*.55);margin-left:calc(var(--rs)*-.14);border-radius:50% 50% 50% 50%/30% 30% 70% 70%;
        background:radial-gradient(ellipse at 50% 25%,#fff 0 18%,#ffe76a 35%,#ff9a2e 60%,rgba(255,80,40,0) 75%);transform-origin:50% 0;transform:scaleY(0);transition:transform .25s;filter:blur(.5px)}
      .rk-scene.go .rk-flame{transform:scaleY(1);animation:rk-flick .08s linear infinite alternate}
      .rk-scene.land .rk-flame{transform:scaleY(.45)}
      .rk-scene.landed .rk-flame{transform:scaleY(0);animation:none}
      @keyframes rk-flick{from{transform:scaleY(1) scaleX(.9)}to{transform:scaleY(1.25) scaleX(1.05)}}
      .rk-puff{position:absolute;width:var(--p);height:var(--p);margin:calc(var(--p)/-2) 0 0 calc(var(--p)/-2);border-radius:50%;pointer-events:none;z-index:2;
        background:radial-gradient(circle at 40% 35%,#fff,#e4e6ee 60%,rgba(220,222,232,.0) 72%);animation:rk-puff var(--t) ease-out forwards}
      @keyframes rk-puff{0%{transform:scale(.3);opacity:.95}100%{transform:translate(var(--dx),var(--dy)) scale(1.6);opacity:0}}
      .rk-big{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);font-size:clamp(90px,16vw,170px);line-height:1;color:#fff;-webkit-text-stroke:6px #ff7452;paint-order:stroke;
        text-shadow:0 8px 0 #c94a2c;pointer-events:none;z-index:5;opacity:0}
      .rk-big.show{animation:rk-big .9s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes rk-big{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-70%) scale(.9)}}
      .rk-astro{position:absolute;left:calc(50% + var(--rs)*.55);bottom:calc(30% - 14px);width:clamp(80px,12vw,120px);height:clamp(80px,12vw,120px);z-index:4;pointer-events:none;opacity:0;transform:scale(.2)}
      .rk-scene.hello .rk-astro{opacity:1;transform:none;transition:transform .5s cubic-bezier(.2,1.6,.4,1),opacity .2s}
      .rk-astro .bear{position:absolute;inset:12%;font-size:clamp(56px,8.5vw,86px);line-height:1}
      .rk-astro .bear .e{width:100%;height:100%;display:block}
      .rk-astro .helm{position:absolute;inset:0;border-radius:50%;border:5px solid #e7ecf8;background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.7) 0 10%,rgba(190,225,255,.18) 30%,rgba(150,200,255,.12));box-shadow:0 0 0 3px #9aa6c4}
      .rk-astro .wave{position:absolute;right:-34%;top:-8%;font-size:clamp(34px,5vw,52px);transform-origin:20% 90%;animation:rk-wave .5s ease-in-out infinite alternate}
      .rk-astro .flag{position:absolute;left:-55%;bottom:0;font-size:clamp(40px,6vw,60px)}
      @keyframes rk-wave{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}
      .rk-nums{flex:0 0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(6px,1vw,12px);padding:4px 12px 14px;max-width:1100px;margin:0 auto}
      .rk-n{width:clamp(72px,8.6vw,98px);height:clamp(72px,8.6vw,98px);border-radius:24px;background:#fff;font-size:clamp(36px,5vw,54px);color:var(--ocean);box-shadow:0 7px 0 rgba(47,58,102,.14);
        display:flex;align-items:center;justify-content:center;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*50ms)}
      .rk-n:active{transform:translateY(5px)}
      .rk-n.next{box-shadow:0 0 0 5px #ffc531,0 7px 0 rgba(47,58,102,.14)}
      .rk-n.done{background:#ffdf6e;color:#c45e00;box-shadow:0 7px 0 #e0a800}
      .rk-n.done::after{content:"";position:absolute}
      .rk-nums.off{opacity:.35;pointer-events:none;transition:opacity .4s}
    `);
    const scene = U.el("div", "rk-scene");
    scene.innerHTML =
      '<div class="rk-night"></div><div class="rk-stars"></div>' +
      '<div class="rk-thing" style="left:8%;--dl:.2s">' + KP.E("🪐") + "</div>" +
      '<div class="rk-thing" style="right:6%;--dl:1s;font-size:clamp(70px,12vw,130px)">' + KP.E("🌍") + "</div>" +
      '<div class="rk-thing" style="left:18%;--dl:1.7s;font-size:clamp(36px,5vw,56px)">' + KP.E("🛸") + "</div>" +
      '<div class="rk-thing" style="right:22%;--dl:.6s;font-size:clamp(30px,4vw,44px)">' + KP.E("🌟") + "</div>" +
      '<div class="rk-ground"><div class="rk-hill"></div><div class="rk-tower"></div><div class="rk-padbase"></div></div>' +
      '<div class="rk-moon"></div>' +
      '<div class="rk-rocket"><div class="rk-ship"><div class="rk-flame"></div><div class="rk-img">' + KP.E("🚀") + "</div></div></div>" +
      '<div class="rk-astro"><div class="bear">' + KP.E("🐻") + '</div><div class="helm"></div><div class="wave">' + KP.E("👋") + '</div><div class="flag">' + KP.E("🚩") + "</div></div>" +
      '<div class="rk-big"></div>';
    const nums = U.el("div", "rk-nums");
    ctx.body.append(scene, nums);
    ctx.scene = scene;
    ctx.nums = nums;
    ctx.rocketEl = U.$(".rk-rocket", scene);
    ctx.ship = U.$(".rk-ship", scene);
    ctx.big = U.$(".rk-big", scene);
    ctx.size = () => {
      const h = scene.clientHeight,
        w = scene.clientWidth;
      scene.style.setProperty("--rs", Math.round(U.clamp(Math.min(h * 0.3, w * 0.28), 90, 190)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
    ctx.round = 0;
    ctx.SINO = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구", "십"];

    ctx.puff = (n, spread, life) => {
      const sr = scene.getBoundingClientRect(),
        rr = ctx.rocketEl.getBoundingClientRect();
      const x = rr.left - sr.left + rr.width / 2,
        y = rr.bottom - sr.top - 4;
      for (let i = 0; i < n; i++) {
        const p = U.el("div", "rk-puff");
        const dir = Math.random() < 0.5 ? -1 : 1;
        p.style.cssText = "left:" + (x + U.randf(-10, 10)) + "px;top:" + (y + U.randf(-6, 6)) + "px;--p:" + U.randf(40, 80) + "px;--dx:" + dir * U.randf(20, spread) + "px;--dy:" + U.randf(-30, 10) + "px;--t:" + (life || U.randf(0.9, 1.6)) + "s";
        scene.appendChild(p);
        ctx.after((life || 1.6) * 1000 + 100, () => p.remove());
      }
    };
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const seq = lv === 1 ? [1, 2, 3, 4, 5] : lv === 2 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const down = lv === 3;
    let idx = 0,
      busy = false;
    const scene = ctx.scene;
    scene.className = "rk-scene";
    ctx.size();
    ctx.ship.style.setProperty("--a", 0);
    ctx.nums.classList.remove("off");
    ctx.nums.innerHTML = "";
    scene.querySelectorAll(".rk-puff").forEach((p) => p.remove());
    ctx.say(down ? "카운트다운! 10부터 거꾸로 눌러요! 🚀" : "1부터 " + seq.length + "까지 차례대로 눌러서 로켓에 힘을 모아요! 🚀");
    const say = (n) => (down ? ctx.SINO[n] : U.NAT[n]);

    const btns = seq.map((n, i) => {
      const b = U.el("button", "rk-n", String(n));
      b.style.setProperty("--i", i);
      b.dataset.n = n;
      ctx.fast(b, () => {
        if (busy || b.classList.contains("done")) return;
        if (n !== seq[idx]) {
          ctx.miss(b, "다음은 " + seq[idx] + "이에요!");
          return;
        }
        b.classList.add("done");
        b.classList.remove("next");
        U.replay(b, "jump");
        idx++;
        const pr = idx / seq.length;
        // 큰 숫자 + 목소리
        ctx.big.textContent = n;
        U.replay(ctx.big, "show");
        KP.voice.say(say(n));
        A.note(A.SCALE[Math.min(idx - 1 + (lv === 1 ? 2 : 0), 11)], { inst: "marimba", dur: 0.4, vol: 0.28 });
        // 덜덜 + 연기 + 우르르
        ctx.ship.style.setProperty("--a", (1 + pr * 6).toFixed(1));
        ctx.puff(2 + Math.round(pr * 5), 40 + pr * 90);
        A.noise({ dur: 0.35 + pr * 0.4, vol: 0.06 + pr * 0.1, lp: 300 + pr * 500 });
        if (idx < seq.length) {
          btns[idx].classList.add("next");
          hint();
        } else launch();
      });
      ctx.nums.appendChild(b);
      return b;
    });
    btns[0].classList.add("next");
    const hint = () => ctx.hint(() => btns[idx], "다음 숫자 " + seq[idx] + "을 눌러요!");
    hint();

    const launch = async () => {
      busy = true;
      ctx.hint(null);
      ctx.nums.classList.add("off");
      await ctx.wait(700);
      KP.voice.say("발사!");
      ctx.big.textContent = "발사!";
      U.replay(ctx.big, "show");
      scene.classList.add("go");
      // 연기 기둥
      for (let k = 0; k < 6; k++) ctx.after(k * 120, () => ctx.puff(6, 170, 1.8));
      A.kick({ vol: 0.6 });
      A.noise({ dur: 2.6, vol: 0.22, lp: 700, attack: 0.2 });
      A.tone(120, { to: 520, dur: 2.4, vol: 0.06, type: "triangle" });
      await ctx.wait(500);
      scene.classList.add("fly");
      A.sfx("whoosh");
      ctx.ship.style.setProperty("--a", 2);
      await ctx.wait(1500);
      A.sfx("sparkle");
      KP.voice.say("우와! 우주다!");
      await ctx.wait(1800);
      // 달 착륙
      scene.classList.remove("fly");
      scene.classList.add("land");
      KP.voice.say("달이 보여요! 살살 내려가요~");
      A.tone(700, { to: 300, dur: 1.8, vol: 0.06 });
      await ctx.wait(2300);
      scene.classList.add("landed");
      ctx.ship.style.setProperty("--a", 0);
      A.noise({ dur: 0.4, vol: 0.12, lp: 600 });
      ctx.puff(8, 120, 1.2);
      await ctx.wait(500);
      scene.classList.add("hello");
      A.sfx("levelup");
      KP.voice.say("달에 도착! 곰돌이 우주인이 안녕~ 하고 손을 흔들어요!");
      await ctx.wait(2200);
      if (!ctx._active) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "우주 비행사 형아!" : "달 착륙 성공!" });
      if (ok) this.next(ctx);
    };
  },
});
