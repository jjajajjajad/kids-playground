/* 숫자 배우기 — 위쪽 버튼으로 [배우기]/[퀴즈] 전환. (1단계는 배우기로, 2단계부터 퀴즈로 시작)
   배우기: 1~10 카드를 누르면 큰 숫자가 나오고, 숫자만큼 그림이 하나씩 튀어나오며 "하나, 둘, 셋…" 함께 세기.
           큰 숫자의 점선을 손가락으로 따라 써 볼 수 있어요.
   퀴즈 1단계: "셋을 찾아요!" 1~5 중 3개 / 2단계: 1~10 중 4개
   퀴즈 3단계: 큰 숫자만큼 사과를 바구니에 담고 ✔ 누르기 (빼기도 가능) */
"use strict";
KP.game({
  id: "numbers",
  icon: "💯",
  name: "숫자 배우기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("numbers", `
      .nbModes{display:flex;gap:10px;justify-content:center;padding:0 10px 6px;flex:0 0 auto}
      .nbMode{font-size:clamp(18px,2.4vw,24px);background:rgba(255,255,255,.7);border-radius:999px;padding:8px 22px;min-height:52px;display:flex;align-items:center;gap:8px;border-bottom:5px solid transparent}
      .nbMode .e{font-size:1.4em}
      .nbMode.sel{background:#fff;border-bottom-color:var(--cat);color:var(--cat);box-shadow:var(--shadow)}
      .nbMode.glow{animation:glow 1s ease-in-out 3}
      .nbView{flex:1;min-height:0;display:none;flex-direction:column}
      .nbView.on{display:flex}
      .nbShow{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(10px,3vw,40px);padding:4px 12px}
      @media (max-aspect-ratio:1/1){.nbShow{flex-direction:column}}
      .nbBig{position:relative;flex:0 0 auto;width:var(--nb);height:var(--nb);background:#fff;border-radius:30px;box-shadow:var(--shadow)}
      .nbBig svg,.nbBig canvas{position:absolute;inset:0;width:100%;height:100%}
      .nbBig canvas{touch-action:none}
      .nbBig text{font-family:var(--font);font-size:92px;text-anchor:middle;dominant-baseline:central;fill:#fff3d6;stroke:#ffb020;stroke-width:3;stroke-dasharray:7 6;stroke-linecap:round}
      .nbBig.two text{font-size:72px}
      .nbPen{position:absolute;right:8px;bottom:6px;font-size:clamp(14px,1.8vw,18px);color:var(--ink2);display:flex;align-items:center;gap:4px;pointer-events:none}
      .nbBig.pop{animation:popIn .35s}
      .nbObjs{flex:1 1 auto;min-width:0;max-width:560px;min-height:clamp(90px,16vh,200px);display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:clamp(4px,1vw,10px)}
      .nbObj{position:relative;font-size:var(--os);line-height:1;animation:nbPop .45s cubic-bezier(.2,1.6,.4,1)}
      @keyframes nbPop{from{transform:scale(0) translateY(40px)}}
      .nbObj b{position:absolute;right:-6px;top:-8px;font-size:18px;min-width:26px;height:26px;border-radius:13px;background:var(--coral);color:#fff;font-weight:400;display:flex;align-items:center;justify-content:center}
      .nbCards{flex:0 0 auto;display:grid;grid-template-columns:repeat(10,1fr);gap:clamp(6px,1vw,10px);padding:6px 12px 16px}
      @media (max-aspect-ratio:1/1){.nbCards{grid-template-columns:repeat(5,1fr)}}
      .nbCard{font-size:clamp(34px,4.6vw,52px);color:#fff;border-radius:22px;min-height:clamp(72px,9vw,96px);background:var(--c);box-shadow:0 6px 0 color-mix(in srgb,var(--c) 65%,#000);animation:itemIn .35s backwards;animation-delay:calc(var(--i)*40ms);text-shadow:0 2px 0 rgba(0,0,0,.15)}
      .nbCard:active,.nbCard.on{transform:translateY(4px);box-shadow:0 2px 0 color-mix(in srgb,var(--c) 65%,#000)}
      .nbCard.seen::after{content:"";position:absolute;top:6px;right:8px;width:10px;height:10px;border-radius:50%;background:#fff}
      .nbCard{position:relative}
      .nbQ{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,24px);padding:4px 12px 18px}
      .nbQ .qAns{padding:0}
      .nbQ .choice{font-size:clamp(52px,8vw,90px);min-width:clamp(96px,14vw,150px);min-height:clamp(96px,14vw,150px)}
      .nbMake{display:flex;align-items:center;gap:clamp(12px,3vw,40px)}
      @media (max-aspect-ratio:1/1){.nbMake{flex-direction:column;gap:62px}}
      .nbTarget{font-size:clamp(80px,12vw,140px);line-height:1;color:var(--ocean);background:#fff;border-radius:30px;padding:6px 30px;box-shadow:var(--shadow)}
      .nbBasket{position:relative;width:clamp(260px,40vw,460px);min-height:clamp(120px,20vh,190px);background:#f7d9a8;border-radius:16px 16px 60px 60px;
        border:6px solid #d79b4f;box-shadow:inset 0 -10px 0 rgba(0,0,0,.08);display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;gap:2px;padding:10px 10px 16px}
      .nbBasket::before{content:"";position:absolute;left:12%;right:12%;top:-50px;height:60px;border:7px solid #d79b4f;border-bottom:none;border-radius:120px 120px 0 0}
      .nbBasket .nbA{font-size:clamp(40px,5.4vw,58px);line-height:1;padding:2px;animation:nbPop .35s}
      .nbBasket .nbA b{display:none}
      .nbTools{display:flex;gap:clamp(14px,3vw,30px);align-items:center}
      .nbAdd,.nbOk{font-size:clamp(46px,6vw,64px);border-radius:28px;padding:10px 22px;min-width:110px;min-height:96px;display:flex;align-items:center;justify-content:center;gap:4px;background:#fff;box-shadow:0 7px 0 rgba(47,58,102,.14)}
      .nbAdd span{font-size:.7em;color:var(--grass)}
      .nbOk{background:var(--grass);box-shadow:0 7px 0 #1f8a4c}
      .nbAdd:active,.nbOk:active{transform:translateY(5px)}
      .nbChk{display:block;width:.42em;height:.8em;border:solid #fff;border-width:0 .16em .16em 0;border-radius:4px;transform:rotate(45deg) translate(-.06em,-.08em)}
    `);
    ctx.THINGS = [["🍎", "사과"], ["🐥", "병아리"], ["⭐", "별"], ["🍓", "딸기"], ["🚗", "자동차"], ["🐟", "물고기"], ["🎈", "풍선"], ["🌼", "꽃"], ["🍪", "쿠키"], ["🦋", "나비"]];
    ctx.CC = ["#ff5b6e", "#ff9f1c", "#f5b800", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#ff7452"];
    // 모드 버튼
    const modes = U.el("div", "nbModes");
    ctx.bLearn = U.btn(KP.E("📖") + "배우기", "nbMode");
    ctx.bQuiz = U.btn(KP.E("❓") + "퀴즈", "nbMode");
    modes.append(ctx.bLearn, ctx.bQuiz);
    ctx.tap(ctx.bLearn, () => this.mode(ctx, "learn"));
    ctx.tap(ctx.bQuiz, () => this.mode(ctx, "quiz"));
    // 배우기 화면
    ctx.vLearn = U.el("div", "nbView");
    ctx.show = U.el("div", "nbShow");
    ctx.big = U.el("div", "nbBig");
    ctx.objs = U.el("div", "nbObjs");
    ctx.show.append(ctx.big, ctx.objs);
    ctx.cards = U.el("div", "nbCards");
    ctx.vLearn.append(ctx.show, ctx.cards);
    ctx.cardEls = [];
    for (let n = 1; n <= 10; n++) {
      const c = U.btn(String(n), "nbCard");
      c.style.setProperty("--c", ctx.CC[n - 1]);
      c.style.setProperty("--i", n);
      ctx.tap(c, () => this.learn(ctx, n));
      ctx.cards.appendChild(c);
      ctx.cardEls.push(c);
    }
    // 퀴즈 화면
    ctx.vQuiz = U.el("div", "nbView");
    ctx.q = U.el("div", "nbQ");
    ctx.vQuiz.appendChild(ctx.q);
    ctx.body.append(modes, ctx.vLearn, ctx.vQuiz);
    // 따라 쓰기 캔버스
    this.setupTrace(ctx);
  },
  setupTrace(ctx) {
    const U = KP.u;
    const cv = (ctx.cv = document.createElement("canvas"));
    const g = (ctx.g = cv.getContext("2d"));
    let last = null;
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      KP.audio.unlock();
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      last = pos(e);
      ctx.hue = (ctx.hue || 0) + 40;
    });
    cv.addEventListener("pointermove", (e) => {
      if (!last) return;
      const p = pos(e);
      g.strokeStyle = "hsl(" + ctx.hue + ",85%,55%)";
      g.lineWidth = cv.width * 0.06;
      g.lineCap = g.lineJoin = "round";
      g.beginPath();
      g.moveTo(last.x, last.y);
      g.lineTo(p.x, p.y);
      g.stroke();
      if (U.dist(last.x, last.y, p.x, p.y) > 2 && Math.random() < 0.25) KP.audio.sfx("rub");
      last = p;
    });
    const end = () => (last = null);
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
  },
  start(ctx) {
    ctx.round = 0;
    ctx.seen = new Set();
    ctx.suggested = false;
    this.mode(ctx, ctx.level === 1 ? "learn" : "quiz", true);
  },
  mode(ctx, m, first) {
    ctx.m = m;
    ctx.token = (ctx.token || 0) + 1; // 세던 중이면 멈추기
    ctx.bLearn.classList.toggle("sel", m === "learn");
    ctx.bQuiz.classList.toggle("sel", m === "quiz");
    ctx.vLearn.classList.toggle("on", m === "learn");
    ctx.vQuiz.classList.toggle("on", m === "quiz");
    if (!first) KP.audio.sfx("select");
    ctx.hint(null);
    if (m === "learn") {
      ctx.say("🔢 숫자를 눌러 봐요! 같이 세어 봐요!");
      ctx.big.innerHTML = "";
      ctx.objs.innerHTML = "";
      ctx.cardEls.forEach((c) => c.classList.toggle("seen", ctx.seen.has(+c.textContent)));
      ctx.hint(() => ctx.cardEls.find((c) => !ctx.seen.has(+c.textContent)), "숫자를 눌러 봐요!");
    } else this.quiz(ctx);
  },
  /* ---------------- 배우기 ---------------- */
  learn(ctx, n) {
    const U = KP.u,
      A = KP.audio;
    ctx.token = (ctx.token || 0) + 1;
    const tk = ctx.token;
    ctx.cardEls.forEach((c, i) => c.classList.toggle("on", i === n - 1));
    ctx.seen.add(n);
    ctx.cardEls[n - 1].classList.add("seen");
    const portrait = innerHeight > innerWidth;
    const nb = portrait ? Math.min(innerWidth * 0.5, innerHeight * 0.24) : Math.min(innerWidth * 0.26, innerHeight * 0.44);
    ctx.big.style.setProperty("--nb", Math.round(nb) + "px");
    ctx.big.className = "nbBig" + (n === 10 ? " two" : "");
    ctx.big.innerHTML = '<svg viewBox="0 0 120 120"><text x="60" y="64">' + n + "</text></svg>";
    ctx.big.appendChild(ctx.cv);
    ctx.big.appendChild(U.el("span", "nbPen", KP.E("✏️") + "따라 써요"));
    ctx.cv.width = ctx.cv.height = Math.round(nb * Math.min(devicePixelRatio || 1, 2));
    U.replay(ctx.big, "pop");
    A.note(A.SCALE[n - 1], { inst: "bell", dur: 0.5, vol: 0.3 });
    KP.voice.say("숫자 " + n + "!");
    // 사물 하나씩
    const [em, name] = ctx.THINGS[(n - 1) % ctx.THINGS.length];
    ctx.objs.innerHTML = "";
    const os = portrait ? (n <= 4 ? 70 : n <= 6 ? 58 : 52) : n <= 5 ? 84 : 66;
    ctx.objs.style.setProperty("--os", os + "px");
    for (let i = 1; i <= n; i++) {
      ctx.after(700 + i * 620, () => {
        if (ctx.token !== tk) return;
        const o = U.el("span", "nbObj", KP.E(em) + "<b>" + i + "</b>");
        ctx.objs.appendChild(o);
        A.note(A.SCALE[i - 1], { inst: "marimba", dur: 0.35, vol: 0.28 });
        KP.voice.say(U.NAT[i]);
      });
    }
    ctx.after(700 + n * 620 + 700, () => {
      if (ctx.token !== tk) return;
      KP.voice.say(name + " " + U.NAT[n] + "! 숫자 " + n + "!");
      ctx.objs.querySelectorAll(".nbObj").forEach((o, i) => ctx.after(i * 60, () => U.replay(o, "jump")));
      if (ctx.seen.size >= 5 && !ctx.suggested) {
        ctx.suggested = true;
        ctx.after(2200, () => {
          if (ctx.m !== "learn") return;
          U.replay(ctx.bQuiz, "glow");
          KP.voice.say("우와, 숫자 박사! 퀴즈도 해 볼까요?");
        });
      }
    });
    ctx.hint(() => ctx.cardEls.find((c) => !ctx.seen.has(+c.textContent)) || null, "다른 숫자도 눌러 봐요!");
  },
  /* ---------------- 퀴즈 ---------------- */
  quiz(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const self = this;
    ctx.q.innerHTML = "";
    if (lv < 3) {
      const hi = lv === 1 ? 5 : 10;
      const nC = lv === 1 ? 3 : 4;
      let t = 1 + U.rand(hi);
      if (t === ctx.lastT) t = (t % hi) + 1;
      ctx.lastT = t;
      const opts = new Set([t]);
      while (opts.size < nC) opts.add(1 + U.rand(hi));
      const ask = U.josa(U.NAT[t], "을/를") + " 찾아요!";
      ctx.say("🔢 " + ask);
      const box = U.el("div", "qAns");
      ctx.q.appendChild(box);
      const btns = ctx.choices(box, U.shuffle([...opts]), {
        cls: "num",
        render: (v) => String(v),
        right: (v) => v === t,
        wrongMsg: (v) => "이건 " + U.josa(U.NAT[v], "이에요/예요") + ". " + ask,
        onRight: async (v, b) => {
          U.replay(b, "jump");
          A.sfx("good");
          KP.voice.say(U.NAT[v] + "! 숫자 " + v + "!");
          await this.done(ctx, "숫자 " + v + "!");
        },
      });
      ctx.hint(() => btns.find((b) => b.dataset.right), ask);
      return;
    }
    // 3단계: 숫자만큼 담기 (관형사: 한/두/세/네 개)
    const CNT = ["하나도 없는", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
    let t = 3 + U.rand(7);
    if (t === ctx.lastT) t = t === 9 ? 4 : t + 1;
    ctx.lastT = t;
    const [em, name] = U.pick(ctx.THINGS.slice(0, 4));
    const ask = U.josa(name, "을/를") + " " + CNT[t] + " 개 담아요! 다 담으면 초록 ✅ 버튼을 눌러요!";
    ctx.say("🧺 " + ask);
    const wrap = U.el("div", "nbMake");
    const tg = U.el("div", "nbTarget", String(t));
    const basket = U.el("div", "nbBasket");
    wrap.append(tg, basket);
    const tools = U.el("div", "nbTools");
    const add = U.btn(KP.E(em) + "<span>+</span>", "nbAdd");
    const ok = U.btn('<span class="nbChk"></span>', "nbOk");
    tools.append(add, ok);
    ctx.q.append(wrap, tools);
    let cnt = 0,
      busy = false;
    const mark = () => {
      if (cnt < t) add.dataset.right = "1";
      else delete add.dataset.right;
      if (cnt === t) ok.dataset.right = "1";
      else delete ok.dataset.right;
    };
    const say = () => KP.voice.say(U.NAT[cnt] || "영");
    ctx.fast(add, () => {
      if (busy) return;
      if (cnt >= 10) return ctx.miss(add, "바구니가 꽉 찼어요!");
      cnt++;
      const a = U.el("button", "nbA", KP.E(em));
      ctx.fast(a, () => {
        if (busy) return;
        a.remove();
        cnt--;
        A.sfx("slide");
        say();
        mark();
        hint();
      });
      basket.appendChild(a);
      U.replay(add, "pop");
      A.note(A.SCALE[cnt - 1], { inst: "marimba", dur: 0.3, vol: 0.28 });
      say();
      mark();
      hint();
    });
    ctx.fast(ok, async () => {
      if (busy) return;
      if (cnt === t) {
        busy = true;
        basket.querySelectorAll(".nbA").forEach((x, i) => ctx.after(i * 90, () => U.replay(x, "jump")));
        U.replay(tg, "jump");
        KP.voice.say(name + " " + CNT[t] + " 개! 딩동댕!");
        await this.done(ctx, CNT[t] + " 개 담았어요!");
      } else if (cnt === 0) ctx.miss(ok, "아직 하나도 없어요. " + U.josa(name, "을/를") + " 담아 봐요!");
      else if (cnt < t) ctx.miss(ok, "지금 " + CNT[cnt] + " 개예요. " + (t - cnt === 1 ? "하나 더" : "더") + " 담아요!");
      else ctx.miss(ok, "지금 " + CNT[cnt] + " 개예요. 너무 많아요! 바구니에서 눌러서 빼요!");
    });
    const hint = () => ctx.hint(() => (cnt < t ? add : cnt === t ? ok : basket.lastElementChild), cnt < t ? "더 담아요!" : cnt === t ? "초록 버튼을 눌러요!" : "하나 빼요!");
    mark();
    hint();
  },
  async done(ctx, msg) {
    ctx.score.add();
    ctx.round++;
    await ctx.wait(1000);
    const big = ctx.round % 5 === 0;
    const ok = await ctx.win({ big, msg: big ? "숫자 박사 형아!" : msg, quiet: !big });
    if (ok && ctx.m === "quiz") this.quiz(ctx);
  },
});
