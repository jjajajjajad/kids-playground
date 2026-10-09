/* 색깔 섞기 — 물감 두 개를 끌어서 그릇에 넣으면 빙글빙글 섞여 새 색이 돼요. "빨강이랑 노랑을 섞으면 주황!"
   1단계: 물감 2개(정해진 짝) 넣어 보기 / 2단계: 빨강·노랑·파랑 중 마음대로 두 개
   3단계: "초록을 만들려면?" 퀴즈 (빨강·노랑·파랑·하양 중 알맞은 두 개) */
"use strict";
KP.game({
  id: "mix",
  icon: "🎨",
  name: "색깔 섞기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("mix", `
      .mxWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 16px}
      .mxTop{display:flex;align-items:center;gap:clamp(16px,4vw,50px)}
      .mxGoal{display:none;flex-direction:column;align-items:center;gap:4px;font-size:clamp(18px,2.4vw,24px)}
      .mxGoal.on{display:flex}
      .mxGoalBlob{width:clamp(70px,min(11vw,13vh),110px);height:clamp(70px,min(11vw,13vh),110px);border-radius:46% 54% 50% 50% / 52% 46% 54% 48%;background:var(--g);box-shadow:inset -6px -8px 0 rgba(0,0,0,.12),0 0 0 6px #fff,0 6px 0 6px rgba(47,58,102,.1);
        display:flex;align-items:center;justify-content:center;font-size:clamp(34px,5vw,50px);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.2)}
      .mxBowl{position:relative;width:var(--bw);height:calc(var(--bw) * .62);border-radius:12px 12px 50% 50% / 12px 12px 100% 100%;background:linear-gradient(180deg,#fff,#e8eef9);
        box-shadow:0 0 0 4px #cfdcf2,0 10px 0 4px rgba(47,58,102,.13),inset 0 -12px 0 rgba(47,58,102,.06);overflow:hidden;border:6px solid #fff}
      .mxBowl.dropHover{outline:none;box-shadow:0 0 0 8px rgba(255,197,49,.6),0 10px 0 rgba(47,58,102,.15)}
      .mxLiq{position:absolute;left:4%;right:4%;bottom:6%;height:0;border-radius:40% 40% 50% 50% / 20% 20% 100% 100%;background:var(--m,#fff);transition:height .6s ease-out,background .8s}
      .mxLiq.on{height:62%}
      .mxSwirl{position:absolute;left:50%;top:58%;width:150%;aspect-ratio:1;margin-left:-75%;margin-top:-75%;border-radius:50%;opacity:0;
        background:radial-gradient(circle,transparent 0 8%,rgba(255,255,255,.35) 9% 11%,transparent 12% 30%,rgba(255,255,255,.3) 31% 33%,transparent 34%),
          repeating-conic-gradient(from 0deg,var(--a) 0 22deg,var(--b) 38deg 60deg,var(--a) 76deg 90deg);filter:blur(5px);transition:opacity .4s}
      .mxSwirl.on{opacity:1;animation:mxSpin 1.6s cubic-bezier(.4,0,.6,1)}
      @keyframes mxSpin{from{transform:rotate(0) scale(.6)}to{transform:rotate(900deg) scale(1)}}
      .mxRes{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(26px,3.6vw,40px);color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.25);opacity:0;transition:opacity .3s}
      .mxRes.on{opacity:1;animation:popBig .4s}
      .mxSay{min-height:1.3em;font-size:clamp(22px,3vw,34px);text-align:center;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}
      .mxDot{display:inline-block;width:1em;height:1em;border-radius:50%;background:var(--c);box-shadow:inset -3px -4px 0 rgba(0,0,0,.12)}
      .mxTray{display:flex;gap:clamp(14px,3.6vw,40px);justify-content:center;flex-wrap:wrap}
      .mxPot{position:relative;width:var(--pw);height:calc(var(--pw) * 1.05);padding:0}
      .mxPot .mxJar{position:absolute;left:8%;right:8%;bottom:0;height:70%;border-radius:14px 14px 30px 30px;background:linear-gradient(90deg,rgba(255,255,255,.7),rgba(255,255,255,.35));border:4px solid #fff;box-shadow:0 6px 0 rgba(47,58,102,.13);overflow:hidden}
      .mxPot .mxJar::after{content:"";position:absolute;left:0;right:0;bottom:0;height:78%;background:var(--c);border-radius:6px 6px 24px 24px}
      .mxPot .mxBlob{position:absolute;left:14%;right:14%;top:2%;height:42%;border-radius:50% 50% 46% 54% / 60% 60% 40% 40%;background:var(--c);box-shadow:inset -5px -6px 0 rgba(0,0,0,.12),inset 6px 6px 0 rgba(255,255,255,.35);z-index:1}
      .mxPot .mxName{position:absolute;left:0;right:0;bottom:-30px;text-align:center;font-size:clamp(17px,2.2vw,22px)}
      .mxPot.used{visibility:hidden}
      .mxPot.pour{transition:transform .5s,opacity .5s;opacity:0}
    `);
    ctx.wrap = U.el("div", "mxWrap");
    ctx.top = U.el("div", "mxTop");
    ctx.goal = U.el("div", "mxGoal");
    ctx.bowl = U.el("div", "mxBowl", '<div class="mxLiq"></div><div class="mxSwirl"></div><div class="mxRes"></div>');
    ctx.bowl.dataset.drop = "bowl";
    ctx.top.append(ctx.goal, ctx.bowl);
    ctx.line = U.el("div", "mxSay");
    ctx.tray = U.el("div", "mxTray");
    ctx.wrap.append(ctx.top, ctx.line, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.P = {
      red: { n: "빨강", c: "#ff3b3b" },
      yellow: { n: "노랑", c: "#ffd400" },
      blue: { n: "파랑", c: "#2f6bff" },
      white: { n: "하양", c: "#ffffff" },
    };
    ctx.MIX = {
      "red+yellow": { n: "주황", c: "#ff8c1a" },
      "blue+yellow": { n: "초록", c: "#2fb84f" },
      "blue+red": { n: "보라", c: "#8a3ffc" },
      "red+white": { n: "분홍", c: "#ff8fb6" },
      "blue+white": { n: "하늘색", c: "#7cc4ff" },
      "white+yellow": { n: "연한 노랑", c: "#fff08a" },
    };
    ctx.key = (a, b) => [a, b].sort().join("+");
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    const P = ctx.P;
    let pots, goal = null;
    if (lv === 1) {
      const pairs = [["red", "yellow"], ["blue", "yellow"], ["red", "blue"]];
      let p = U.pick(pairs);
      if (ctx.lastPair && p.join() === ctx.lastPair) p = pairs[(pairs.indexOf(p) + 1) % 3];
      ctx.lastPair = p.join();
      pots = U.shuffle([...p]);
    } else if (lv === 2) pots = ["red", "yellow", "blue"];
    else {
      const goals = ["red+yellow", "blue+yellow", "blue+red", "red+white", "blue+white"];
      let g = U.pick(goals);
      if (g === ctx.lastGoal) g = U.pick(goals.filter((x) => x !== g));
      ctx.lastGoal = g;
      goal = g;
      pots = U.shuffle(["red", "yellow", "blue", "white"]);
    }
    ctx.goalKey = goal;
    ctx.goal.classList.toggle("on", !!goal);
    if (goal) {
      const m = ctx.MIX[goal];
      ctx.goal.innerHTML = '<div class="mxGoalBlob" style="--g:' + m.c + '">?</div><span>' + m.n + "</span>";
    }
    const portrait = innerHeight > innerWidth;
    ctx.wrap.style.setProperty("--bw", portrait ? (goal ? "min(56vw,240px)" : "min(74vw,320px)") : "clamp(220px,min(34vw,46vh),380px)");
    ctx.wrap.style.setProperty("--pw", portrait ? (pots.length > 3 ? "min(19vw,84px)" : "min(24vw,100px)") : "clamp(84px,min(10vw,15vh),120px)");
    this.resetBowl(ctx);
    ctx.line.innerHTML = "";
    ctx.tray.innerHTML = "";
    let inBowl = [],
      busy = false;
    const ask =
      lv === 1 ? "두 물감을 끌어서 그릇에 넣어 봐요! 무슨 색이 될까요?" : lv === 2 ? "물감 두 개를 골라서 그릇에 넣어 봐요!" : U.josa(ctx.MIX[goal].n, "을/를") + " 만들려면 어떤 물감을 섞을까요?";
    ctx.say("🎨 " + ask);
    const potEls = pots.map((k, i) => {
      const p = P[k];
      const el = U.el("div", "mxPot item", '<span class="mxBlob"></span><span class="mxJar"></span><span class="mxName">' + p.n + "</span>");
      el.style.setProperty("--c", p.c);
      el.style.setProperty("--i", i);
      if (!goal || goal.split("+").includes(k)) el.dataset.go = "bowl";
      ctx.tray.appendChild(el);
      const d = KP.drag(el, {
        targets: () => (busy ? [] : [ctx.bowl]),
        pad: 40,
        onDrop: async (t) => {
          if (!t) return;
          d.lock();
          el.dataset.done = "1";
          el.style.transform += " rotate(-60deg)";
          el.classList.add("pour");
          KP.audio.sfx("water");
          inBowl.push(k);
          ctx.after(450, () => {
            el.classList.remove("pour");
            el.classList.add("used");
            el.style.transform = "";
          });
          if (inBowl.length === 1) {
            this.fill(ctx, p.c);
            KP.voice.say(p.n + "!");
            ctx.line.innerHTML = '<span class="mxDot" style="--c:' + p.c + '"></span>' + p.n + " +";
            hint();
          } else {
            busy = true;
            await this.swirl(ctx, inBowl[0], k);
            await done();
          }
        },
      });
      return { el, d, k };
    });
    const hint = () =>
      ctx.hint(() => {
        const left = potEls.filter((x) => !x.el.dataset.done);
        return (left.find((x) => x.el.dataset.go) || left[0] || {}).el;
      }, lv === 3 ? ask : "물감을 끌어서 그릇에 넣어요!");
    hint();
    const done = async () => {
      const key = ctx.key(inBowl[0], inBowl[1]);
      const m = ctx.MIX[key];
      if (!goal || key === goal) {
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1600);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "색깔 마법사 형아!" : m.n + "!", quiet: !big });
        if (ok) self.next(ctx);
      } else {
        await ctx.wait(2300);
        ctx.miss(null, U.josa(ctx.MIX[goal].n, "이/가") + " 아니네요! 다른 물감으로 다시 해 봐요!");
        await ctx.wait(1500);
        if (!ctx._active) return;
        // 다시: 그릇 비우고 물감 돌려놓기
        this.resetBowl(ctx);
        ctx.line.innerHTML = "";
        inBowl = [];
        busy = false;
        potEls.forEach((x) => {
          x.el.classList.remove("used");
          delete x.el.dataset.done;
          x.d.unlock();
          U.replay(x.el, "pop");
        });
        KP.audio.sfx("whoosh");
        hint();
      }
    };
  },
  resetBowl(ctx) {
    const liq = ctx.bowl.querySelector(".mxLiq");
    liq.classList.remove("on");
    liq.style.setProperty("--m", "#fff");
    ctx.bowl.querySelector(".mxSwirl").classList.remove("on");
    ctx.bowl.querySelector(".mxRes").classList.remove("on");
  },
  fill(ctx, c) {
    const liq = ctx.bowl.querySelector(".mxLiq");
    liq.style.setProperty("--m", c);
    liq.classList.add("on");
  },
  async swirl(ctx, a, b) {
    const U = KP.u,
      A = KP.audio;
    const P = ctx.P;
    const m = ctx.MIX[ctx.key(a, b)];
    const sw = ctx.bowl.querySelector(".mxSwirl");
    sw.style.setProperty("--a", P[a].c);
    sw.style.setProperty("--b", P[b].c);
    sw.classList.remove("on");
    void sw.offsetWidth;
    sw.classList.add("on");
    A.noise({ bp: 500, bpTo: 1800, q: 1.2, dur: 1.5, vol: 0.12, attack: 0.3 });
    for (let i = 0; i < 6; i++) A.note(A.SCALE[i], { inst: "bell", dur: 0.3, vol: 0.12, when: 0.2 + i * 0.2 });
    ctx.line.innerHTML =
      '<span class="mxDot" style="--c:' + P[a].c + '"></span>' + P[a].n + " + " + '<span class="mxDot" style="--c:' + P[b].c + '"></span>' + P[b].n;
    await ctx.wait(1500);
    this.fill(ctx, m.c);
    sw.classList.remove("on");
    const res = ctx.bowl.querySelector(".mxRes");
    res.textContent = m.n + "!";
    res.classList.add("on");
    ctx.line.innerHTML += ' = <span class="mxDot" style="--c:' + m.c + '"></span><b style="font-weight:400;color:' + (m.c === "#fff08a" ? "#c9a400" : m.c) + '">' + m.n + "</b>";
    A.sfx("sparkle");
    KP.voice.say(U.josa(P[a].n, "이랑/랑") + " " + U.josa(P[b].n, "을/를") + " 섞으면 " + m.n + "!");
    U.replay(ctx.bowl, "jump");
  },
});
