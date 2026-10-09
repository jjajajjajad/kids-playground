/* 까꿍 놀이 — 알록달록 작은 집의 문을 열면 동물 친구가 까꿍!
   1단계: 문 3개를 마음대로 열기 (까꿍! + 이름 + 울음소리)
   2단계: 처음에 모두 잠깐 보여 준 뒤 닫고 "강아지는 어디 있을까?" 찾기 (2마리)
   3단계: 문 4개, 3마리 찾기
   - 틀리면 문 속 친구가 "나 아니야~" 하고 다시 닫힘 */
"use strict";
KP.game({
  id: "peekaboo",
  icon: "🚪",
  name: "까꿍 놀이",
  cat: "play",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("peekaboo", `
      .pk-stage{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#c9ecff 0%,#e8f7ff 62%,#9fdc86 62%,#78c466 100%);display:flex;align-items:center;justify-content:center}
      .pk-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:calc(var(--hs)*.18) clamp(10px,2.2vw,30px);padding:10px}
      .pk-house{position:relative;isolation:isolate;width:var(--hs);height:calc(var(--hs)*1.45);cursor:pointer}
      .pk-roof{position:absolute;left:-12%;right:-12%;top:0;height:30%;background:var(--roof);clip-path:polygon(50% 0,100% 100%,0 100%);filter:drop-shadow(0 4px 0 rgba(0,0,0,.15))}
      .pk-roof::after{content:"";position:absolute;left:44%;top:40%;width:12%;height:24%;border-radius:50%;background:#fff8d8;box-shadow:inset 0 0 0 3px rgba(0,0,0,.12)}
      .pk-wall{position:absolute;left:0;right:0;top:28%;bottom:0;background:var(--wall);border-radius:8px 8px 6px 6px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.08),0 6px 0 rgba(0,0,0,.1);perspective:600px}
      .pk-room{position:absolute;left:16%;right:16%;top:14%;bottom:0;border-radius:999px 999px 0 0;background:radial-gradient(circle at 50% 30%,#fff3c4,#ffd27a 70%,#e8a94a);overflow:hidden;
        display:flex;align-items:flex-end;justify-content:center}
      .pk-ani{font-size:calc(var(--hs)*.56);line-height:1;margin-bottom:6%;transform:translateY(30%) scale(.7);transition:transform .35s cubic-bezier(.2,1.6,.4,1)}
      .pk-ani .e{display:block}
      .pk-house.open .pk-ani{transform:none}
      .pk-door{position:absolute;left:16%;right:16%;top:14%;bottom:0;border-radius:999px 999px 0 0;transform-origin:0 50%;transition:transform .45s cubic-bezier(.3,1.1,.5,1);
        background:linear-gradient(90deg,rgba(0,0,0,.08),rgba(0,0,0,0) 30%),var(--door);box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
      .pk-door::before{content:"";position:absolute;left:16%;right:16%;top:12%;height:30%;border-radius:999px 999px 8px 8px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
      .pk-door::after{content:"";position:absolute;right:12%;top:55%;width:16%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff7c4,#f2b400);box-shadow:0 2px 0 rgba(0,0,0,.2)}
      .pk-low{position:absolute;left:16%;right:16%;top:56%;height:30%;border-radius:8px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.12)}
      .pk-house.open .pk-door{transform:rotateY(-100deg);filter:brightness(.85)}
      .pk-house.knock{animation:pk-knock .3s}
      @keyframes pk-knock{30%{transform:translateY(3px) scale(1.02,.98)}}
      .pk-say{position:absolute;left:50%;top:-6%;transform:translateX(-50%);white-space:nowrap;z-index:5;background:#fff;color:var(--ink);font-size:clamp(18px,2.6vw,26px);
        padding:4px 14px;border-radius:16px;box-shadow:0 4px 0 rgba(0,0,0,.1);animation:popBig .4s cubic-bezier(.2,1.6,.4,1);pointer-events:none}
      .pk-no .pk-ani{animation:pk-no .5s 2}
      @keyframes pk-no{25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
      .pk-yes .pk-ani{animation:pk-yes .5s 3}
      @keyframes pk-yes{50%{transform:translateY(-14%) scale(1.08)}}
      .pk-ask{position:absolute;left:50%;top:8px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:4px 18px 4px 8px;
        box-shadow:0 5px 0 rgba(47,58,102,.12);font-size:clamp(22px,3.4vw,32px);z-index:6;white-space:nowrap}
      .pk-ask .e{font-size:1.6em}
      .pk-ask.hide{display:none}
      .pk-house.found::before{content:"";position:absolute;inset:-8%;border-radius:20px;box-shadow:0 0 0 5px #ffc531,0 0 26px 8px rgba(255,200,60,.6);z-index:-1}
    `);
    const stage = U.el("div", "pk-stage");
    const row = U.el("div", "pk-row");
    const ask = U.el("div", "pk-ask hide");
    stage.append(ask, row);
    ctx.body.appendChild(stage);
    Object.assign(ctx, { stage, row, ask });
    ctx.ANIMALS = [
      ["🐶", "강아지", "멍멍"], ["🐱", "고양이", "야옹"], ["🐷", "돼지", "꿀꿀"], ["🐮", "소", "음메"], ["🐥", "병아리", "삐약삐약"], ["🐸", "개구리", "개굴개굴"],
      ["🦁", "사자", "어흥"], ["🐵", "원숭이", "우끼끼"], ["🐑", "양", "매에"], ["🐴", "말", "히히힝"], ["🐰", "토끼", "깡총깡총"], ["🐻", "곰", "크앙"], ["🐔", "닭", "꼬끼오"], ["🦆", "오리", "꽥꽥"],
    ];
    ctx.STYLES = [
      ["#ff6b6b", "#ffe3d0", "#ff9f43"], ["#4dabf7", "#e7f5ff", "#3ec1d3"], ["#8f6bff", "#f3eeff", "#c08cff"], ["#2fb466", "#eafbe7", "#7bd389"], ["#ff8ad8", "#fff0f8", "#ff6fb5"], ["#ffb020", "#fff6dd", "#f59f00"],
    ];
    ctx.size = (n) => {
      const W = stage.clientWidth,
        H = stage.clientHeight;
      const perRow = W < 560 && n > 3 ? 2 : n;
      const rows = Math.ceil(n / perRow);
      const hs = Math.floor(U.clamp(Math.min((W - 40) / perRow / 1.35, (H - 90) / rows / 1.6), 90, 220));
      row.style.setProperty("--hs", hs + "px");
      row.style.maxWidth = perRow * (hs * 1.3 + 30) + "px";
    };
    ctx.creak = () => {
      KP.audio.tone(260, { to: 420, dur: 0.25, vol: 0.06, type: "triangle" });
      KP.audio.note("C5", { inst: "marimba", dur: 0.2, vol: 0.2 });
    };
    ctx.shut = () => {
      KP.audio.kick({ vol: 0.18 });
      KP.audio.note("G3", { inst: "marimba", dur: 0.2, vol: 0.2 });
    };
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
    const n = lv === 3 ? 4 : 3;
    const animals = U.sample(ctx.ANIMALS, n);
    const styles = U.shuffle([...ctx.STYLES]);
    ctx.row.innerHTML = "";
    ctx.ask.classList.add("hide");
    ctx.size(n);
    let busy = true;
    const houses = animals.map((a, i) => {
      const [roof, wall, door] = styles[i % styles.length];
      const h = U.el("div", "pk-house item");
      h.style.cssText = "--roof:" + roof + ";--wall:" + wall + ";--door:" + door + ";--i:" + i;
      h.dataset.tap = "1";
      h.innerHTML = '<div class="pk-roof"></div><div class="pk-wall"><div class="pk-room"><div class="pk-ani">' + KP.E(a[0]) + '</div></div><div class="pk-door"><div class="pk-low"></div></div></div>';
      h.a = a;
      ctx.row.appendChild(h);
      ctx.fast(h, () => tapHouse(h));
      return h;
    });
    const bubble = (h, text, ms = 1600) => {
      const s = U.el("div", "pk-say", text);
      h.appendChild(s);
      ctx.after(ms, () => s.remove());
    };
    const open = (h) => {
      h.classList.add("open");
      ctx.creak();
    };
    const close = (h) => {
      h.classList.remove("open", "pk-no", "pk-yes");
      ctx.after(250, ctx.shut);
    };

    let tapHouse;
    if (lv === 1) {
      /* ---------- 자유롭게 열기 ---------- */
      busy = false;
      ctx.say("문을 콕! 열어 봐요. 누가 숨어 있을까? 🚪");
      let opened = 0;
      tapHouse = (h) => {
        if (busy) return;
        U.replay(h, "knock");
        if (h.classList.contains("open")) {
          // 열린 친구를 또 누르면 울음소리
          U.replay(h, "pk-yes");
          bubble(h, h.a[2] + "!", 1200);
          KP.voice.say(h.a[2] + "!");
          A.sfx("boing");
          return;
        }
        open(h);
        A.sfx("boing");
        bubble(h, "까꿍!");
        KP.voice.say("까꿍! " + h.a[1] + "! " + h.a[2] + "!");
        U.replay(h, "pk-yes");
        opened++;
        if (opened === n) {
          busy = true;
          ctx.after(2200, async () => {
            ctx.score.add();
            ctx.round++;
            const big = ctx.round % 4 === 0;
            const ok = await ctx.win({ big, msg: big ? "까꿍 대장 형아!" : "모두 찾았다!" });
            if (ok) this.next(ctx);
          });
        } else hintFree();
      };
      const hintFree = () => ctx.hint(() => houses.find((h) => !h.classList.contains("open")), "문을 콕 눌러서 열어 봐요!");
      hintFree();
      return;
    }

    /* ---------- 기억해서 찾기 ---------- */
    const asks = U.sample(animals, lv === 3 ? 3 : 2);
    let ai = 0;
    ctx.say("누가 어디에 사는지 잘 보세요! 👀");
    tapHouse = (h) => {
      if (busy || h.classList.contains("open")) return;
      const target = asks[ai];
      U.replay(h, "knock");
      open(h);
      if (h.a === target) {
        busy = true;
        h.classList.add("found", "pk-yes");
        A.sfx("good");
        bubble(h, "까꿍!");
        KP.voice.say("까꿍! 찾았다! " + h.a[1] + "! " + h.a[2] + "!");
        ctx.score.add();
        ai++;
        ctx.after(1800, async () => {
          if (ai < asks.length) {
            close(h);
            h.classList.remove("found");
            ctx.after(450, askNext);
          } else {
            ctx.round++;
            const big = ctx.round % 4 === 0;
            const ok = await ctx.win({ big, msg: big ? "기억력 대장 형아!" : "다 찾았어요!" });
            if (ok) this.next(ctx);
          }
        });
      } else {
        h.classList.add("pk-no");
        bubble(h, "나 아니야~");
        ctx.miss(null, "나는 " + h.a[1] + "! 나 아니야~");
        busy = true;
        ctx.after(1500, () => {
          close(h);
          busy = false;
        });
      }
    };
    const askNext = () => {
      const t = asks[ai];
      ctx.ask.innerHTML = KP.E(t[0]) + "<span>" + U.josa(t[1], "은/는") + " 어디?</span>";
      ctx.ask.classList.remove("hide");
      U.replay(ctx.ask, "pop");
      ctx.say(U.josa(t[1], "은/는") + " 어디 있을까? 문을 콕! 🚪");
      busy = false;
      ctx.hint(() => houses.find((h) => h.a === t), U.josa(t[1], "은/는") + " 어느 집에 있었지?");
    };
    // 처음에 모두 보여 주기
    ctx.after(500, () => {
      houses.forEach((h, i) =>
        ctx.after(i * 350, () => {
          open(h);
          bubble(h, h.a[1], lv === 3 ? 3000 : 2500);
        })
      );
      ctx.after(n * 350 + (lv === 3 ? 3000 : 2500), () => {
        houses.forEach(close);
        KP.voice.say("문을 닫았어요!");
        ctx.after(1100, askNext);
      });
    });
  },
});
