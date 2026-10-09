/* 날씨 옷 입히기 — 오늘 날씨를 보고 곰돌이에게 알맞은 옷·소품을 끌어다 입히기
   날씨: 더움 ☀️ / 비 🌧️ / 눈 ❄️ / 쌀쌀함 🍂
   1단계: 1개 입히기 (보기 2개)   2단계: 2개 (보기 4개)   3단계: 3개 (보기 5개)
   안 맞는 옷은 "비 오는 날엔 젖어요!" 하고 돌아오고, 다 입으면 밖에 나가 신나게 논다. */
"use strict";
KP.game({
  id: "dress",
  icon: "👕",
  name: "날씨 옷 입히기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("dress", `
      .drWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px;gap:8px}
      .drScene{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);container-type:size;transition:background .6s}
      .drScene.hot{background:linear-gradient(#8fd6ff,#d9f3ff 66%,#f7e08a 66.3%,#f1cf62)}
      .drScene.rain{background:linear-gradient(#8a9bb5,#c3cedd 66%,#8fb878 66.3%,#79a764)}
      .drScene.snow{background:linear-gradient(#c7d7ec,#eef4fb 66%,#fff 66.3%,#e9f1fb)}
      .drScene.cool{background:linear-gradient(#ffd9a8,#fff0d6 66%,#d9a65f 66.3%,#c48f48)}
      .drSky{position:absolute;left:3cqw;top:3cqh;display:flex;align-items:center;gap:1.4cqw;background:rgba(255,255,255,.85);border-radius:999px;padding:.6cqh 2.4cqw .6cqh .8cqw;box-shadow:0 4px 0 rgba(0,0,0,.08);z-index:3}
      .drSky .em{font-size:min(15cqh,15cqw);line-height:1;animation:drBob 2.4s ease-in-out infinite}
      .drSky .tx{font-size:min(6cqh,6cqw);color:var(--ink)}
      @keyframes drBob{50%{transform:translateY(-6%) rotate(-4deg)}}
      .drFx{position:absolute;inset:0;pointer-events:none;z-index:1}
      .drFx i{position:absolute;top:-10%;display:block}
      .drScene.rain .drFx i{width:3px;height:6cqh;background:linear-gradient(transparent,rgba(255,255,255,.9));border-radius:2px;animation:drFall linear infinite}
      .drScene.snow .drFx i{width:1.6cqh;height:1.6cqh;border-radius:50%;background:#fff;box-shadow:0 0 4px rgba(120,150,200,.6);animation:drSnow linear infinite}
      .drScene.cool .drFx i{font-style:normal;font-size:5cqh;animation:drSnow linear infinite}
      .drScene.hot .drFx i{display:none}
      @keyframes drFall{to{transform:translateY(120cqh)}}
      @keyframes drSnow{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(3cqw,60cqh) rotate(180deg)}100%{transform:translate(-2cqw,120cqh) rotate(360deg)}}
      .drScene.hot:after{content:"";position:absolute;right:-12cqh;top:-12cqh;width:44cqh;height:44cqh;border-radius:50%;background:repeating-conic-gradient(rgba(255,230,120,.5) 0 10deg,transparent 10deg 22deg);-webkit-mask:radial-gradient(circle,#000 25%,transparent 70%);mask:radial-gradient(circle,#000 25%,transparent 70%);animation:spin 14s linear infinite;pointer-events:none}
      /* 곰돌이 */
      .drBear{--u:min(8.4cqh,15cqw);position:absolute;left:50%;bottom:6cqh;width:calc(var(--u)*5);height:calc(var(--u)*7.2);margin-left:calc(var(--u)*-2.5);z-index:2;transition:left 1s ease-in-out}
      .drBear>*{position:absolute;line-height:1}
      .drHead{left:50%;top:0;font-size:calc(var(--u)*3);transform:translateX(-50%);z-index:5}
      .drBody{left:50%;top:calc(var(--u)*2.45);width:calc(var(--u)*2.8);height:calc(var(--u)*2.7);transform:translateX(-50%);border-radius:45%;background:radial-gradient(ellipse at 50% 60%,#f2d2a6 0 32%,#c58a52 34%);z-index:2}
      .drArm{top:calc(var(--u)*2.8);width:calc(var(--u)*.95);height:calc(var(--u)*2.1);border-radius:calc(var(--u)*.5);background:#b97c45;z-index:1}
      .drArm.l{left:calc(var(--u)*.55);transform:rotate(28deg)}.drArm.r{right:calc(var(--u)*.55);transform:rotate(-28deg)}
      .drLeg{top:calc(var(--u)*4.7);width:calc(var(--u)*1.05);height:calc(var(--u)*1.7);border-radius:calc(var(--u)*.5);background:#b97c45;z-index:1}
      .drLeg.l{left:calc(var(--u)*1.35)}.drLeg.r{right:calc(var(--u)*1.35)}
      .drWear{animation:popBig .4s cubic-bezier(.2,1.6,.4,1);transform-origin:50% 50%;pointer-events:none}
      .drWear .e{display:block}
      .s-hat{left:50%;top:calc(var(--u)*-.55);font-size:calc(var(--u)*2.1);margin-left:calc(var(--u)*-1.05);z-index:7}
      .s-eyes{left:50%;top:calc(var(--u)*1.05);font-size:calc(var(--u)*1.7);margin-left:calc(var(--u)*-.85);z-index:7}
      .s-neck{left:50%;top:calc(var(--u)*2.15);font-size:calc(var(--u)*1.9);margin-left:calc(var(--u)*-.95);z-index:6}
      .s-body{left:50%;top:calc(var(--u)*2.35);font-size:calc(var(--u)*3.1);margin-left:calc(var(--u)*-1.55);z-index:4}
      .s-legs{left:50%;top:calc(var(--u)*4.35);font-size:calc(var(--u)*2.3);margin-left:calc(var(--u)*-1.15);z-index:3}
      .s-feet{top:calc(var(--u)*5.95);font-size:calc(var(--u)*1.35);z-index:4}
      .s-feet.l{left:calc(var(--u)*1.05)}.s-feet.r{right:calc(var(--u)*1.05);transform:scaleX(-1)}
      .s-hands{top:calc(var(--u)*4.35);font-size:calc(var(--u)*1.15);z-index:4}
      .s-hands.l{left:calc(var(--u)*.05)}.s-hands.r{right:calc(var(--u)*.05);transform:scaleX(-1)}
      .s-umb{right:calc(var(--u)*-1.3);top:calc(var(--u)*-1.7);font-size:calc(var(--u)*3.2);z-index:8;transform:rotate(14deg)}
      .yellow .e{filter:hue-rotate(18deg) saturate(3.2) brightness(1.08)}
      .red .e{filter:hue-rotate(-40deg) saturate(2.2)}
      .drBear.play{animation:drPlay .7s ease-in-out infinite}
      @keyframes drPlay{0%,100%{transform:none}25%{transform:translateY(-12%) rotate(-6deg)}75%{transform:translateY(-12%) rotate(6deg)}}
      .drFun{position:absolute;bottom:4cqh;font-size:min(20cqh,26cqw);line-height:1;z-index:2;animation:popBig .6s cubic-bezier(.2,1.6,.4,1)}
      .drTray{flex:0 0 auto;display:flex;gap:clamp(10px,2.4vw,24px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:clamp(92px,12vw,124px);background:rgba(255,255,255,.7);border-radius:24px;padding:6px 10px}
      .drItem{width:clamp(80px,10.5vw,112px);height:clamp(80px,10.5vw,112px);border-radius:22px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;align-items:center;justify-content:center;font-size:clamp(54px,7.4vw,80px);line-height:1}
      .drItem.used{display:none}
      @media (orientation:portrait){.drItem{width:clamp(72px,19vw,96px);height:clamp(72px,19vw,96px);font-size:clamp(48px,13vw,66px)}.drTray{gap:8px}}
    `);
    ctx.WEATHER = {
      hot: { em: "☀️", tx: "더워요", say: "오늘은 해님이 쨍쨍, 아주 더워요!", wrong: "더운 날엔 땀이 뻘뻘 나요! 시원한 걸 골라 볼까?", fun: ["⚽", "공놀이하자! 뻥!"], fx: 0 },
      rain: { em: "🌧️", tx: "비가 와요", say: "오늘은 주룩주룩 비가 와요!", wrong: "비 오는 날엔 다 젖어요! 다른 걸 골라 볼까?", fun: ["💦", "물웅덩이에서 첨벙첨벙!"], fx: 40 },
      snow: { em: "❄️", tx: "눈이 와요", say: "오늘은 하얀 눈이 펑펑 와요. 추워요!", wrong: "눈 오는 날엔 추워서 덜덜 떨려요! 따뜻한 걸 골라 볼까?", fun: ["⛄", "눈사람 만들자!"], fx: 30 },
      cool: { em: "🍂", tx: "쌀쌀해요", say: "오늘은 바람이 쌀쌀해요!", wrong: "쌀쌀한 날엔 감기 걸려요! 따뜻한 걸 골라 볼까?", fun: ["🍁", "낙엽 밟기, 바스락바스락!"], fx: 10 },
    };
    // [그림, 이름, 자리, 맞는 날씨, 색]
    ctx.ITEMS = [
      ["🧢", "모자", "hat", ["hot"]],
      ["🕶️", "선글라스", "eyes", ["hot"]],
      ["👕", "반팔 티셔츠", "body", ["hot"]],
      ["🩳", "반바지", "legs", ["hot"]],
      ["🩴", "샌들", "feet", ["hot"]],
      ["☂️", "우산", "umb", ["rain"]],
      ["🥾", "장화", "feet", ["rain"], "red"],
      ["🧥", "노란 우비", "body", ["rain"], "yellow"],
      ["🧣", "목도리", "neck", ["snow", "cool"]],
      ["🧤", "장갑", "hands", ["snow"]],
      ["🧥", "두꺼운 패딩", "body", ["snow"]],
      ["🥾", "털부츠", "feet", ["snow"]],
      ["🧥", "점퍼", "body", ["cool"]],
      ["👖", "긴바지", "legs", ["cool", "snow"]],
    ];
    // 날씨별 틀린 보기 (확실히 안 맞는 것만)
    ctx.WRONG = {
      hot: [["🧣", "목도리"], ["🧤", "장갑"], ["🧥", "두꺼운 패딩"], ["🥾", "털부츠"]],
      rain: [["🕶️", "선글라스", "비 오는 날엔 해님이 없어요!"], ["🩴", "샌들", "샌들을 신으면 발이 다 젖어요!"], ["🧢", "모자", "모자는 비에 젖어요! 우산이 필요해요."]],
      snow: [["🩳", "반바지"], ["🩴", "샌들"], ["👕", "반팔 티셔츠"], ["🕶️", "선글라스", "선글라스는 해님 쨍쨍한 날에 써요!"]],
      cool: [["🩳", "반바지"], ["🩴", "샌들"], ["☂️", "우산", "오늘은 비가 안 와요!"], ["🕶️", "선글라스", "선글라스는 해님 쨍쨍한 날에 써요!"]],
    };
    ctx.wrap = U.el("div", "drWrap");
    ctx.scene = U.el("div", "drScene");
    ctx.tray = U.el("div", "drTray");
    ctx.wrap.append(ctx.scene, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastW = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const wk = U.pick(Object.keys(ctx.WEATHER).filter((k) => k !== ctx.lastW));
    ctx.lastW = wk;
    const W = ctx.WEATHER[wk];
    const need = lv;
    const nWrong = lv === 1 ? 1 : 2;

    // 장면
    const sc = ctx.scene;
    sc.className = "drScene " + wk;
    sc.innerHTML = "";
    sc.appendChild(U.el("div", "drSky", '<span class="em">' + KP.E(W.em) + '</span><span class="tx">' + W.tx + "</span>"));
    const fx = U.el("div", "drFx");
    for (let i = 0; i < W.fx; i++) {
      const p = U.el("i", "", wk === "cool" ? KP.E(U.pick(["🍂", "🍁"])) : "");
      p.style.left = U.randf(0, 100) + "%";
      p.style.animationDuration = (wk === "rain" ? U.randf(0.6, 1.1) : U.randf(4, 8)) + "s";
      p.style.animationDelay = -U.randf(0, 8) + "s";
      fx.appendChild(p);
    }
    sc.appendChild(fx);
    const bear = U.el("div", "drBear", '<div class="drArm l"></div><div class="drArm r"></div><div class="drLeg l"></div><div class="drLeg r"></div><div class="drBody"></div><div class="drHead">' + KP.E("🐻") + "</div>");
    sc.appendChild(bear);

    // 보기
    const good = U.sample(ctx.ITEMS.filter((it) => it[3].includes(wk)), need);
    const bad = U.sample(ctx.WRONG[wk], nWrong).map(([e, n, msg]) => ({ e, n, msg, ok: false }));
    const list = U.shuffle([...good.map(([e, n, slot, , col]) => ({ e, n, slot, col, ok: true })), ...bad]);
    ctx.tray.innerHTML = "";
    let left = need;
    ctx.say(W.say + " 곰돌이한테 " + (need === 1 ? "알맞은 옷을 하나" : "알맞은 옷 " + U.NAT[need] + " 가지를") + " 입혀 줘요!");
    const els = list.map((it, i) => {
      const b = U.el("div", "drItem item " + (it.col || ""), KP.E(it.e));
      b.style.animation = "itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)";
      b.style.animationDelay = 200 + i * 80 + "ms";
      ctx.tray.appendChild(b);
      const d = KP.drag(b, {
        targets: () => [bear],
        pad: 40,
        accept: () => it.ok,
        onReject: () => {
          ctx.miss(b, it.msg || W.wrong);
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          b.style.transform = "";
          b.classList.add("used");
          wear(it);
          left--;
          if (left === 0) finish();
          else hint();
        },
      });
      b._it = it;
      return b;
    });
    const wear = (it) => {
      const pair = it.slot === "feet" || it.slot === "hands";
      (pair ? ["l", "r"] : [""]).forEach((s) => {
        const w = U.el("div", "drWear s-" + it.slot + " " + s + " " + (it.col || ""), KP.E(it.e));
        bear.appendChild(w);
      });
      U.replay(bear, "jump");
      A.sfx("snap");
      A.sfx("sparkle");
      KP.voice.say(U.josa(it.n, "을/를") + " " + (it.slot === "umb" ? "썼어요" : it.slot === "feet" ? "신었어요" : it.slot === "hat" || it.slot === "eyes" ? "썼어요" : it.slot === "hands" ? "꼈어요" : it.slot === "neck" ? "둘렀어요" : "입었어요") + "!");
    };
    const hint = () => {
      const b = els.find((x) => x._it.ok && !x.classList.contains("used"));
      ctx.hint(() => b, W.tx + "! 곰돌이한테 맞는 옷을 끌어다 입혀요!");
    };
    hint();

    const finish = async () => {
      ctx.hint(null);
      await ctx.wait(1300);
      if (tok !== ctx.token) return;
      // 밖에 나가 놀기
      ctx.say("다 입었다! 밖에 나가서 놀자! " + W.fun[1]);
      ctx.tray.innerHTML = "";
      const fun = U.el("div", "drFun", KP.E(W.fun[0]));
      fun.style.left = "8%";
      sc.appendChild(fun);
      bear.classList.add("play");
      bear.style.left = "64%";
      A.melody(
        [["C5", 1], ["E5", 1], ["G5", 1], ["E5", 1], ["C5", 1], ["D5", 1], ["E5", 2]],
        { beat: 0.16, inst: "marimba", vol: 0.22 }
      );
      ctx.after(1100, () => (bear.style.left = "40%"));
      ctx.after(2200, () => (bear.style.left = "56%"));
      const splash = wk === "rain" ? ctx.every(500, () => A.sfx("water")) : null;
      await ctx.wait(3400);
      if (splash) ctx.cancel(splash);
      if (tok !== ctx.token) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "옷 입기 박사 형아!" : "날씨에 딱 맞아요!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});
