/* 응가 끙끙 화장실 — 꼼지락꼼지락 신호 알아차리기 → 바지 내리기 → 변기 앉기 → 끙끙 → 휴지 → 바지 올리기 → 물 내리기 → 손 씻기
   - 부드럽고 유쾌하게: 지저분한 그림·말 없음 ('퐁당!', '시원하다!' 정도)
   - 처음엔 '어디에 가야 할까요?' 보기 3개(화장실·간식·장난감), 다음은 아래 도구 줄(바지·변기·휴지·물·비누)
   - 단계: 1 순서 안내(할 도구가 반짝) → 2 '다음엔 뭘 할까요?' 순서 고르기 → 3 혼자서
   공통 도우미: js/games/play/_care.js (KP.care) */
"use strict";
KP.game({
  id: "potty",
  icon: "🚽",
  name: "응가 끙끙 화장실",
  cat: "play",
  levels: 3,
  score: "🧻",
  setup(ctx) {
    const U = KP.u;
    KP.care.css();
    KP.css("potty", `
      .pt-scene{background:linear-gradient(#e9f6ff 0 64%,#cfe6f5 64% 66%,#f6efe4 66%)}
      .pt-scene::before{content:"";position:absolute;left:0;right:0;top:0;height:64%;background:repeating-linear-gradient(90deg,transparent 0 60px,rgba(255,255,255,.8) 60px 63px)}
      .pt-kid{position:absolute;z-index:4;transition:left .9s ease,bottom .6s ease;cursor:pointer}
      .pt-kid>*{position:absolute;pointer-events:none}
      .pt-head{left:0;top:0;width:100%;height:calc(var(--k)*1);z-index:3}
      .pt-head .e{width:100%;height:100%;display:block}
      .pt-body{left:22%;width:56%;top:calc(var(--k)*.8);height:calc(var(--k)*.42);border-radius:30% 30% 14% 14%;background:var(--shirt);z-index:2}
      .pt-shorts{left:22%;width:56%;top:calc(var(--k)*1.13);height:calc(var(--k)*.2);border-radius:6px 6px 10px 10px;z-index:2;
        background:linear-gradient(90deg,var(--pants) 0 47%,rgba(0,0,0,.12) 47% 53%,var(--pants) 53%);transition:transform .45s ease}
      .pt-kid.down .pt-shorts{transform:translateY(calc(var(--k)*.22)) scaleX(.92)}
      .pt-leg{top:calc(var(--k)*1.2);width:17%;height:calc(var(--k)*.32);border-radius:0 0 12px 12px;background:var(--skin);z-index:1}
      .pt-leg.l{left:30%}.pt-leg.r{right:30%}
      .pt-kid.wiggle{animation:pt-wig .28s ease-in-out infinite alternate}
      @keyframes pt-wig{from{transform:rotate(-5deg)}to{transform:rotate(5deg) translateY(-3%)}}
      .pt-kid.push .pt-head{animation:pt-push .3s ease-in-out}
      @keyframes pt-push{50%{transform:scale(1.08,.94)}}
      .pt-kid.walk{animation:pt-walk .3s ease-in-out infinite alternate}
      @keyframes pt-walk{to{transform:translateY(-6%)}}
      .pt-win{position:absolute;left:50%;top:9%;width:min(26%,24vmin);aspect-ratio:1;transform:translateX(-50%);border-radius:50%;pointer-events:none;
        background:radial-gradient(circle at 30% 70%,#fff 0 12%,transparent 13%),radial-gradient(circle at 45% 64%,#fff 0 14%,transparent 15%),linear-gradient(#8fd3ff,#d6f0ff);box-shadow:0 0 0 clamp(6px,1.4vmin,12px) #fff,0 0 0 calc(clamp(6px,1.4vmin,12px) + 3px) #cfe0ee}
      .pt-win::before,.pt-win::after{content:"";position:absolute;background:#fff}
      .pt-win::before{left:48%;top:0;bottom:0;width:4%}.pt-win::after{top:48%;left:0;right:0;height:4%}
      .pt-toilet,.pt-paper,.pt-toy{position:absolute;pointer-events:none}
      .pt-toilet{z-index:3}
      .pt-toilet .e,.pt-paper .e,.pt-toy .e{width:100%;height:100%;display:block}
      .pt-paper{z-index:2}
      .pt-paper.spin{animation:pt-spin .3s linear 3}
      @keyframes pt-spin{50%{transform:rotate(-15deg) scale(1.08)}}
      .pt-toy{z-index:3;transition:opacity .5s}
      .pt-swirl{position:absolute;z-index:5;pointer-events:none;border-radius:50%;opacity:0;
        background:conic-gradient(from 0deg,rgba(120,200,255,.0),rgba(120,200,255,.85),rgba(255,255,255,.6),rgba(120,200,255,.85),rgba(120,200,255,0));transition:opacity .3s}
      .pt-swirl.on{opacity:1;animation:pt-swirl .5s linear infinite}
      @keyframes pt-swirl{to{transform:rotate(360deg) scale(.9)}}
    `);
    const scene = U.el("div", "kc-scene pt-scene");
    scene.innerHTML =
      '<div class="pt-win"></div><div class="pt-toy">' + KP.E("🧸") + '</div><div class="pt-paper">' + KP.E("🧻") + '</div><div class="pt-toilet">' + KP.E("🚽") + '</div><div class="pt-swirl"></div>' +
      '<div class="pt-kid"><div class="pt-head"></div><div class="pt-body"></div><div class="pt-shorts"></div><i class="pt-leg l"></i><i class="pt-leg r"></i></div>';
    const bar = U.el("div", "kc-bar");
    ctx.body.append(scene, bar);
    ctx.body.classList.add("kc-stage"); // 폰 가로: 도구 줄을 오른쪽 세로로
    const $ = (s) => U.$(s, scene);
    Object.assign(ctx, { scene, bar, kid: $(".pt-kid"), head: $(".pt-head"), toilet: $(".pt-toilet"), paper: $(".pt-paper"), toy: $(".pt-toy"), swirl: $(".pt-swirl") });
    ctx.S = KP.care.surface(ctx, scene); // 반짝이·물방울만 (문지르기 없음)
    ctx.S.cv.style.pointerEvents = "none";
    ctx.pos = "play";
    ctx.layout = () => {
      const W = scene.clientWidth,
        H = scene.clientHeight;
      const ks = Math.max(60, Math.min(H * 0.33, W * 0.34)),
        ts = Math.max(80, Math.min(H * 0.48, W * 0.44));
      const tx = W - W * 0.07 - ts,
        ty = H * 0.05; // 변기 왼쪽, 아래
      ctx.G = { W, H, ks, ts, tx, ty };
      const box = (e, x, b, w, h) => (e.style.cssText += `;left:${x}px;bottom:${b}px;width:${w}px;height:${h}px`);
      box(ctx.toilet, tx, ty, ts, ts);
      box(ctx.swirl, tx + ts * 0.3, ty + ts * 0.42, ts * 0.46, ts * 0.3);
      box(ctx.paper, tx - ts * 0.34, ty + ts * 0.62, ts * 0.3, ts * 0.3);
      ctx.kid.style.setProperty("--k", ks + "px");
      ctx.kid.style.width = ks + "px";
      ctx.kid.style.height = ks * 1.52 + "px";
      box(ctx.toy, W * 0.05 + ks * 0.95, H * 0.05, ks * 0.6, ks * 0.6);
      ctx.place(ctx.pos, true);
    };
    /** 친구 자리: play(놀이 자리) / toilet(변기 옆에 섬) / sit(변기에 앉음) */
    ctx.place = (p, now) => {
      ctx.pos = p;
      const G = ctx.G,
        k = ctx.kid;
      if (now) k.style.transition = "none";
      let x = G.W * 0.05,
        b = G.H * 0.05;
      if (p === "toilet") x = Math.max(G.W * 0.05, G.tx - G.ks * 0.85);
      if (p === "sit") {
        x = G.tx + G.ts * 0.5 - G.ks * 0.5;
        b = G.ty + G.ts * 0.22;
      }
      k.style.left = x + "px";
      k.style.bottom = b + "px";
      if (now) {
        void k.offsetWidth;
        k.style.transition = "";
      }
    };
    addEventListener("resize", () => ctx._active && ctx.layout());
    ctx.fast(ctx.kid, () => ctx.onKid && ctx.onKid());
    ctx.FRIENDS = [
      ["🐰", "#ff9ec4", "#5b8def", "#ffe3ec"],
      ["🐻", "#7ccf8a", "#f2a33a", "#d9a36b"],
      ["🐼", "#ffcf4a", "#8a63ee", "#f3f3f3"],
      ["🐷", "#6cc4ff", "#ff7a7a", "#ffc7d2"],
      ["🐵", "#ff9a6a", "#3fb7a5", "#e8b98c"],
    ];
    ctx.EMS = ctx.FRIENDS.map((f) => f[0]).concat(["🚽", "🧻", "🧸", "🍪", "👖", "🌊", "🧼"]);
    KP.loadE(ctx.EMS);
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastF = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const sess = ctx._session;
    const alive = () => ctx._active && ctx._session === sess;
    const lv = ctx.level;
    const f = U.pick(ctx.FRIENDS.filter((x) => x !== ctx.lastF));
    ctx.lastF = f;
    ctx.head.innerHTML = KP.E(f[0]);
    ctx.kid.style.setProperty("--shirt", f[1]);
    ctx.kid.style.setProperty("--pants", f[2]);
    ctx.kid.style.setProperty("--skin", f[3]);
    ctx.kid.classList.remove("down", "wiggle", "walk", "push");
    delete ctx.kid.dataset.next;
    ctx.onKid = null;
    ctx.toy.style.opacity = "1";
    ctx.swirl.classList.remove("on");
    ctx.bar.innerHTML = "";
    ctx.pos = "play";
    ctx.layout();
    S.reset();
    S.run();
    const G = () => ctx.G;
    const kx = () => parseFloat(ctx.kid.style.left) + G().ks / 2,
      ky = () => G().H - parseFloat(ctx.kid.style.bottom) - G().ks * 1.2;
    const walk = async (p) => {
      ctx.kid.classList.add("walk");
      ctx.place(p);
      await ctx.wait(950);
      ctx.kid.classList.remove("walk");
    };
    const TOOLS = [
      { id: "pants", html: KP.E("👖"), label: "바지" },
      { id: "toilet", html: KP.E("🚽"), label: "변기" },
      { id: "paper", html: KP.E("🧻"), label: "휴지" },
      { id: "flush", html: KP.E("🌊"), label: "물" },
      { id: "wash", html: KP.E("🧼"), label: "손" },
    ];
    const steps = [
      {
        tool: "pants",
        say: "먼저 바지를 내려요!",
        act: async () => {
          ctx.kid.classList.add("down");
          A.sfx("slide");
          C.pop(ctx, ctx.scene, kx(), ky(), "쓱");
          await ctx.wait(700);
        },
      },
      {
        tool: "toilet",
        say: "변기에 앉아요!",
        act: async () => {
          ctx.place("sit");
          A.sfx("boing");
          await ctx.wait(800);
        },
      },
      {
        auto: true,
        act: () =>
          new Promise((res) => {
            let n = 0;
            ctx.kid.dataset.next = "1";
            ctx.say("끙끙 힘을 줘요! 친구를 콕콕 눌러요!");
            ctx.hint(() => ctx.kid, "친구를 콕콕 눌러요!");
            ctx.onKid = () => {
              if (n >= 3) return;
              n++;
              U.replay(ctx.kid, "push");
              A.tone(220 - n * 20, { to: 180 - n * 20, dur: 0.18, vol: 0.18 });
              C.pop(ctx, ctx.scene, kx() + U.randf(-20, 20), ky() - 10, "끙!");
              if (n < 3) return;
              delete ctx.kid.dataset.next;
              ctx.onKid = null;
              ctx.hint(null);
              ctx.after(600, () => {
                A.sfx("drop");
                C.pop(ctx, ctx.scene, G().tx + G().ts * 0.5, G().H - G().ty - G().ts * 0.55, "퐁당!", true);
                ctx.after(700, () => {
                  KP.voice.say("시원하다!");
                  S.burst(kx(), ky(), 18, "star", 0.8);
                  A.sfx("sparkle");
                  ctx.after(900, res);
                });
              });
            };
          }),
      },
      {
        tool: "paper",
        say: "휴지로 쓱쓱 닦아요!",
        act: async () => {
          ctx.paper.classList.remove("spin");
          void ctx.paper.offsetWidth;
          ctx.paper.classList.add("spin");
          for (let i = 0; i < 3; i++) ctx.after(i * 260, () => A.sfx("rub"));
          C.pop(ctx, ctx.scene, kx(), ky(), "쓱쓱");
          await ctx.wait(1000);
          ctx.paper.classList.remove("spin");
        },
      },
      {
        tool: "pants",
        say: "일어나서 바지를 올려요!",
        act: async () => {
          ctx.place("toilet");
          await ctx.wait(500);
          ctx.kid.classList.remove("down");
          A.sfx("slide");
          C.pop(ctx, ctx.scene, kx(), ky(), "쑥");
          await ctx.wait(600);
        },
      },
      {
        tool: "flush",
        say: "물을 내려요!",
        act: async () => {
          ctx.swirl.classList.add("on");
          A.noise({ dur: 1.3, vol: 0.16, bp: 700, bpTo: 250, q: 0.8, attack: 0.1 });
          C.pop(ctx, ctx.scene, G().tx + G().ts * 0.5, G().H - G().ty - G().ts * 0.9, "쏴아~");
          await ctx.wait(1500);
          ctx.swirl.classList.remove("on");
        },
      },
      {
        tool: "wash",
        say: "마지막으로 손을 뽀득뽀득 씻어요!",
        act: async () => {
          await walk("play");
          for (let i = 0; i < 5; i++)
            ctx.after(i * 220, () => {
              A.sfx("bubble");
              S.burst(kx() + U.randf(-G().ks * 0.3, G().ks * 0.3), ky() + G().ks * 0.5, 3, "drop", 0.5);
            });
          C.pop(ctx, ctx.scene, kx(), ky(), "뽀득뽀득");
          await ctx.wait(1300);
          S.burst(kx(), ky(), 24, "star", 1);
          A.sfx("sparkle");
          await ctx.wait(500);
        },
      },
    ];
    // 1) 신호 알아차리기
    (async () => {
      await ctx.wait(500);
      if (!alive()) return;
      ctx.kid.classList.add("wiggle");
      C.pop(ctx, ctx.scene, kx(), ky(), "꼼지락");
      await ctx.wait(900);
      if (!alive()) return;
      const box = U.el("div", "qAns");
      const ask = U.el("div", "kc-ask");
      ask.appendChild(box);
      ctx.scene.appendChild(ask);
      ctx.say("어? 친구가 꼼지락꼼지락! 어디에 가야 할까요?");
      const OPTS = U.shuffle([
        { id: "toilet", em: "🚽" },
        { id: "snack", em: "🍪" },
        { id: "toy", em: "🧸" },
      ]);
      const picked = await new Promise((res) => {
        const bs = ctx.choices(box, OPTS, {
          render: (v) => KP.E(v.em),
          right: (v) => v.id === "toilet",
          wrongMsg: () => "음, 배가 신호를 보내는 것 같아요!",
          onRight: () => res(true),
        });
        const rb = bs.find((b) => b.dataset.right === "1");
        if (lv === 1) {
          ctx._hinted = true; // 안내 단계: 정답이 반짝
          rb.classList.add("kc-glowc");
        }
        ctx.hint(() => rb, "화장실을 눌러요!");
      });
      if (!picked || !alive()) return;
      ctx.hint(null);
      A.sfx("good");
      await ctx.wait(400);
      ask.remove();
      ctx.kid.classList.remove("wiggle");
      ctx.toy.style.opacity = "0";
      KP.voice.say("응가가 마려운가 봐요! 화장실에 가요!");
      await walk("toilet");
      if (!alive()) return;
      // 2) 순서대로
      const ok = await C.routine(ctx, { bar: ctx.bar, tools: TOOLS, steps, mode: lv, ask: lv === 2 ? "화장실에 왔어요! 먼저 뭘 할까요?" : lv === 3 ? "혼자서 해 볼까요?" : null });
      if (!ok || !alive()) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const msg = big ? "화장실 가고 싶으면 말해 줘요!" : U.pick(["응가 끙끙, 시원하다!", "{부름} 화장실 박사!", "혼자서도 잘해요!"]);
      const r = await ctx.win({ big, msg });
      if (r) this.next(ctx);
    })();
  },
});
