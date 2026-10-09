/* 사탕 가게 — 말한 색 사탕을 끌어서 병에 담아요. 병에 사탕이 차곡차곡 차올라요.
   1단계: 2가지 색 중 말한 색 사탕 모두(3개) / 2단계: 3~4가지 색 중 말한 색 모두(3~4개)
   3단계: "빨간 사탕 3개!" — 개수까지 맞춰 담기(말한 색이 더 많이 섞여 있음) */
"use strict";
KP.game({
  id: "candy",
  icon: "🍭",
  name: "사탕 가게",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("candy", `
      .cdWrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;gap:clamp(16px,4vw,50px);padding:4px 14px 18px}
      @media (max-aspect-ratio:1/1){.cdWrap{flex-direction:column;justify-content:space-evenly}}
      .cdJarBox{position:relative;flex:0 0 auto;display:flex;flex-direction:column;align-items:center}
      .cdLid{width:calc(var(--jw) * .78);height:calc(var(--jw) * .14);border-radius:14px 14px 6px 6px;background:linear-gradient(180deg,#ff8fb6,#ff5d8f);box-shadow:0 5px 0 #d94374;position:relative;z-index:2;transition:transform .5s cubic-bezier(.3,1.5,.5,1)}
      .cdLid.open{transform:translateY(-34px) rotate(-14deg)}
      .cdJar{position:relative;width:var(--jw);height:calc(var(--jw) * 1.15);margin-top:-4px;border-radius:26px 26px 44px 44px;background:linear-gradient(90deg,rgba(255,255,255,.75),rgba(220,240,255,.45) 30%,rgba(220,240,255,.3) 70%,rgba(255,255,255,.65));
        border:6px solid rgba(255,255,255,.95);box-shadow:0 10px 0 rgba(47,58,102,.12),inset 0 -14px 0 rgba(47,58,102,.06);overflow:hidden}
      .cdJar.dropHover{outline:none;box-shadow:0 0 0 8px rgba(255,197,49,.55),0 10px 0 rgba(47,58,102,.12)}
      .cdJar::after{content:"";position:absolute;left:12%;top:8%;width:10%;height:60%;border-radius:999px;background:rgba(255,255,255,.7)}
      .cdJar.yay{animation:wig .45s 3}
      .cdIn{position:absolute;inset:0}
      .cdIn .cdC{--cs:calc(var(--jw) * .19);position:absolute;transform:rotate(var(--r));animation:cdIn .35s cubic-bezier(.3,1.5,.5,1)}
      @keyframes cdIn{from{transform:translateY(-60px) rotate(var(--r))}}
      .cdLabel{position:absolute;left:50%;top:9%;transform:translateX(-50%);white-space:nowrap;background:#fff;border-radius:18px;padding:4px 10px;display:flex;align-items:center;gap:6px;box-shadow:0 3px 0 rgba(47,58,102,.12);z-index:2;font-size:calc(var(--cs) * .6);color:var(--ink)}
      .cdLabel .cdC{--cs:calc(var(--jw) * .14)}
      .cdCount{position:absolute;right:-14px;top:-10px;min-width:54px;height:54px;border-radius:27px;background:var(--coral);color:#fff;font-size:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 rgba(0,0,0,.15);z-index:3}
      .cdCount.bump{animation:bump .35s}
      .cdPile{flex:0 1 auto;display:grid;grid-template-columns:repeat(var(--pc),auto);gap:clamp(6px,1.4vw,14px);justify-content:center;align-content:center;padding:clamp(10px,1.6vw,18px);background:rgba(255,255,255,.55);border-radius:30px}
      .cdC{display:block;position:relative;width:calc(var(--cs) * 1.7);height:var(--cs)}
      .cdC .cdBall{position:absolute;left:22%;right:22%;top:0;bottom:0;border-radius:50%;background:repeating-linear-gradient(-45deg,var(--c) 0 9px,color-mix(in srgb,var(--c) 70%,#fff) 9px 15px);
        box-shadow:inset -4px -5px 0 rgba(0,0,0,.12),inset 4px 4px 0 rgba(255,255,255,.4);z-index:1}
      .cdC::before,.cdC::after{content:"";position:absolute;top:18%;bottom:18%;width:30%;background:color-mix(in srgb,var(--c) 75%,#fff);opacity:.95}
      .cdC::before{left:0;clip-path:polygon(0 0,100% 35%,100% 65%,0 100%,18% 50%)}
      .cdC::after{right:0;clip-path:polygon(100% 0,0 35%,0 65%,100% 100%,82% 50%)}
      .cdPile .cdC{padding:0;transform:rotate(var(--r))}
      .cdHit{position:absolute;inset:-16px -4px;z-index:2}
      .cdIn .cdHit{display:none}
      .cdPile .cdC.dragging{z-index:50}
      .cdSlot{display:flex;align-items:center;justify-content:center;width:calc(var(--cs) * 1.8);height:calc(var(--cs) * 1.3)}
    `);
    ctx.wrap = U.el("div", "cdWrap");
    ctx.jarBox = U.el("div", "cdJarBox");
    ctx.lid = U.el("div", "cdLid");
    ctx.jar = U.el("div", "cdJar");
    ctx.jar.dataset.drop = "jar";
    ctx.jarIn = U.el("div", "cdIn");
    ctx.jar.appendChild(ctx.jarIn);
    ctx.cnt = U.el("div", "cdCount", "0");
    ctx.jarBox.append(ctx.lid, ctx.jar, ctx.cnt);
    ctx.pile = U.el("div", "cdPile");
    ctx.wrap.append(ctx.jarBox, ctx.pile);
    ctx.body.appendChild(ctx.wrap);
    ctx.COL = [
      { k: "red", a: "빨간", n: "빨간색", c: "#ff4d5e" },
      { k: "yellow", a: "노란", n: "노란색", c: "#ffc61a" },
      { k: "blue", a: "파란", n: "파란색", c: "#3b82f6" },
      { k: "green", a: "초록", n: "초록색", c: "#2fbf5a" },
      { k: "purple", a: "보라", n: "보라색", c: "#9b5de5" },
      { k: "orange", a: "주황", n: "주황색", c: "#ff8a1f" },
      { k: "pink", a: "분홍", n: "분홍색", c: "#ff7eb9" },
    ];
    ctx.CNT = ["", "한", "두", "세", "네", "다섯", "여섯"];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const self = this;
    const nCol = lv === 1 ? 2 : lv === 2 ? 3 + U.rand(2) : 3 + U.rand(2);
    const cols = U.sample(lv === 1 ? ctx.COL.slice(0, 4) : ctx.COL, nCol);
    let target = cols[0];
    if (ctx.lastK === target.k) [cols[0], cols[1]] = [cols[1], cols[0]];
    target = cols[0];
    ctx.lastK = target.k;
    let need, nTarget, candies = [];
    if (lv === 1) {
      need = nTarget = 3;
      candies = [...Array(3).fill(cols[0]), ...Array(3).fill(cols[1])];
    } else if (lv === 2) {
      need = nTarget = 3 + U.rand(2);
      candies = Array(need).fill(target);
      const rest = cols.slice(1);
      for (let i = 0; candies.length < 9; i++) candies.push(rest[i % rest.length]);
    } else {
      need = 2 + U.rand(4); // 2~5개
      nTarget = need + 2;
      candies = Array(nTarget).fill(target);
      const rest = cols.slice(1);
      for (let i = 0; candies.length < 12; i++) candies.push(rest[i % rest.length]);
    }
    U.shuffle(candies);
    const portrait = innerHeight > innerWidth;
    const pc = portrait ? (candies.length > 9 ? 4 : 3) : candies.length > 9 ? 4 : 3;
    ctx.pile.style.setProperty("--pc", pc);
    const rows = Math.ceil(candies.length / pc);
    // 사탕 크기: 사탕 더미가 화면 안에 들어가도록 (가로 칸 수·세로 줄 수 기준)
    const availW = portrait ? innerWidth - 70 : innerWidth * 0.55,
      availH = portrait ? innerHeight * 0.36 : innerHeight * 0.62;
    const cs = Math.min(availW / (pc * 1.95), availH / rows / 1.4, 64);
    ctx.wrap.style.setProperty("--cs", Math.round(Math.max(40, cs)) + "px");
    ctx.wrap.style.setProperty("--jw", portrait ? "min(46vw,30vh)" : "clamp(200px,min(26vw,48vh),330px)");
    ctx.jarIn.innerHTML = "";
    // 병 앞 이름표: 담을 사탕 색(3단계는 개수도) → 글 못 읽어도 알 수 있게
    ctx.jar.querySelectorAll(".cdLabel").forEach((x) => x.remove());
    const label = U.el("div", "cdLabel", '<span class="cdC" style="--c:' + target.c + '"><span class="cdBall"></span></span>' + (lv === 3 ? "× " + need : ""));
    ctx.jar.appendChild(label);
    ctx.pile.innerHTML = "";
    ctx.lid.classList.add("open");
    ctx.cnt.textContent = "0";
    ctx.cnt.style.display = lv === 3 ? "" : "none";
    const ask = lv < 3 ? target.a + " 사탕을 모두 병에 담아요!" : target.a + " 사탕 " + ctx.CNT[need] + " 개를 병에 담아요!";
    ctx.say("🍬 " + ask);
    let got = 0,
      busy = false;
    const els = candies.map((col, i) => {
      const slot = U.el("div", "cdSlot");
      // cdHit: 보이지 않는 넓은 터치 영역(작은 화면에서도 잡기 쉽게)
      const c = U.el("div", "cdC item", '<span class="cdBall"></span><span class="cdHit"></span>');
      c.style.setProperty("--c", col.c);
      c.style.setProperty("--r", U.randf(-25, 25).toFixed(0) + "deg");
      c.style.setProperty("--i", i);
      if (col === target) c.dataset.go = "jar";
      slot.appendChild(c);
      ctx.pile.appendChild(slot);
      const d = KP.drag(c, {
        targets: () => (busy ? [] : [ctx.jar]),
        accept: () => col === target,
        pad: 36,
        onReject: (t) => ctx.miss(t, "이건 " + col.a + " 사탕이에요. " + target.a + " 사탕을 찾아요!"),
        onDrop: (t) => {
          if (!t) return;
          if (busy || got >= need) return d.home(); // 이미 다 담았으면 더 받지 않음
          d.lock();
          c.dataset.done = "1";
          got++;
          // 병 안에 차곡차곡 쌓기
          const k = got - 1;
          const perRow = 3;
          const row = Math.floor(k / perRow),
            colI = k % perRow;
          c.classList.remove("item", "draggable");
          c.style.transform = "";
          c.style.left = 6 + colI * 30 + (row % 2) * 8 + "%";
          c.style.bottom = 4 + row * 15 + "%";
          c.style.setProperty("--r", U.randf(-30, 30).toFixed(0) + "deg");
          ctx.jarIn.appendChild(c);
          A.note(A.SCALE[Math.min(got - 1, 11)], { inst: "marimba", dur: 0.3, vol: 0.28 });
          A.sfx("drop");
          ctx.cnt.textContent = got;
          U.replay(ctx.cnt, "bump");
          if (lv === 3) KP.voice.say(U.NAT[got] + "!");
          else KP.voice.say(U.josa(target.a + " 사탕", "이/가") + " 쏙!");
          if (got >= need) {
            busy = true;
            done();
          } else hint();
        },
      });
      return c;
    });
    const hint = () => ctx.hint(() => els.find((c) => c.dataset.go && !c.dataset.done), ask);
    hint();
    const done = async () => {
      await ctx.wait(400);
      ctx.lid.classList.remove("open");
      A.sfx("snap");
      U.replay(ctx.jar, "yay");
      A.sfx("sparkle");
      KP.voice.say(target.a + " 사탕 " + ctx.CNT[need] + " 개! 병이 가득!");
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1300);
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "사탕 가게 사장님 형아!" : "다 담았어요!", quiet: !big });
      if (ok) self.next(ctx);
    };
  },
});
