/* 생일 촛불 끄기 — 오늘의 주인공 동물 친구 생일! 케이크 위 촛불을 콕 눌러 후~
   - 일렁이는 불꽃, 끄면 바람 소리 + 연기 모락모락
   - 다 끄면 생일 축하 노래 + "○○야 생일 축하해!"
   1단계: 촛불 3개 / 2단계: 4개 / 3단계: 5개 (장난꾸러기 촛불이 한 번 다시 켜짐!) */
"use strict";
KP.game({
  id: "candle",
  icon: "🎂",
  name: "생일 촛불 끄기",
  cat: "play",
  levels: 3,
  score: "🎂",
  setup(ctx) {
    const U = KP.u;
    KP.css("candle", `
      .cd-room{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:radial-gradient(circle at 50% 40%,#fff6e8,#ffe2ec 70%,#f7cde0);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;transition:filter .8s}
      .cd-room.dark{filter:brightness(.82) saturate(.9)}
      .cd-flags{position:absolute;left:0;right:0;top:0;height:clamp(40px,8vh,64px);display:flex;justify-content:space-around;pointer-events:none}
      .cd-flags::before{content:"";position:absolute;left:-5%;right:-5%;top:6px;height:30px;border-bottom:3px solid #c98ab0;border-radius:0 0 50% 50%}
      .cd-flags i{width:clamp(22px,3.4vw,38px);height:clamp(28px,4.4vw,48px);clip-path:polygon(0 0,100% 0,50% 100%);margin-top:clamp(10px,2vh,18px);background:var(--c)}
      .cd-banner{position:absolute;top:clamp(46px,9vh,74px);left:14px;font-size:clamp(22px,3.6vw,36px);color:#fff;background:#ff6fb5;padding:4px 22px;border-radius:999px;
        box-shadow:0 5px 0 #d0377f;white-space:nowrap;z-index:2}
      .cd-wrap{position:relative;width:var(--ck);margin-bottom:clamp(10px,3vh,30px)}
      .cd-hero{position:absolute;left:50%;bottom:calc(var(--ck)*.8);width:calc(var(--ck)*.5);height:calc(var(--ck)*.5);margin-left:calc(var(--ck)*-.25);font-size:calc(var(--ck)*.5);line-height:1;z-index:0}
      .cd-hero .e{width:100%;height:100%;display:block}
      .cd-hero.happy{animation:cd-happy .5s ease-in-out infinite alternate}
      @keyframes cd-happy{from{transform:rotate(-5deg) translateY(0)}to{transform:rotate(5deg) translateY(-8px)}}
      .cd-hat{position:absolute;left:58%;top:-26%;width:30%;height:40%;transform:rotate(18deg);z-index:1;
        background:repeating-linear-gradient(135deg,#ffd84a 0 10px,#ff6fb5 10px 20px);clip-path:polygon(50% 0,100% 100%,0 100%)}
      .cd-hat::after{content:"";position:absolute}
      .cd-pom{position:absolute;left:calc(58% + 15% - 9%);top:-34%;width:18%;height:18%;border-radius:50%;background:#fff;box-shadow:0 0 0 3px #ffd84a;transform:rotate(18deg);z-index:2}
      .cd-cake{position:relative;z-index:1;width:100%;height:calc(var(--ck)*.62)}
      .cd-plate{position:absolute;left:-6%;right:-6%;bottom:-4%;height:16%;border-radius:50%;background:linear-gradient(#fff,#dfe3ef);box-shadow:0 6px 0 rgba(0,0,0,.08)}
      .cd-t1{position:absolute;left:4%;right:4%;bottom:4%;height:46%;border-radius:18px;background:linear-gradient(90deg,#f39ac0,#ffc3dc 40%,#f39ac0)}
      .cd-t2{position:absolute;left:20%;right:20%;bottom:47%;height:34%;border-radius:16px;background:linear-gradient(90deg,#fff1d6,#fffaf0 40%,#f6e2bd)}
      .cd-drip{position:absolute;left:0;right:0;top:0;height:42%;border-radius:16px 16px 0 0;
        background:radial-gradient(circle at 10% 100%,var(--f) 0 9%,transparent 9.5%) 0 0/20% 100% repeat-x,linear-gradient(var(--f),var(--f)) 0 0/100% 62% no-repeat}
      .cd-t1 .cd-drip{--f:#fff}
      .cd-t2 .cd-drip{--f:#ff8ac0}
      .cd-dots{position:absolute;left:6%;right:6%;bottom:14%;height:30%;background:radial-gradient(circle,#ff5b6e 0 3px,transparent 4px) 0 0/24px 20px,radial-gradient(circle,#3aa0ff 0 3px,transparent 4px) 12px 10px/24px 20px}
      .cd-berry{position:absolute;bottom:72%;font-size:calc(var(--ck)*.09);line-height:1;z-index:3}
      .cd-candles{position:absolute;left:16%;right:16%;bottom:78%;display:flex;justify-content:space-around;align-items:flex-end;z-index:2}
      .cd-c{position:relative;flex:1;max-width:calc(var(--ck)*.2);height:calc(var(--ck)*.42);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer}
      .cd-c.hintGlow{border-radius:20px}
      .cd-stick{width:calc(var(--ck)*.055);height:48%;border-radius:5px 5px 2px 2px;background:repeating-linear-gradient(160deg,var(--c1) 0 7px,#fff 7px 12px);box-shadow:inset -3px 0 0 rgba(0,0,0,.08)}
      .cd-wick{width:3px;height:6%;background:#4a3a2a;border-radius:2px}
      .cd-fl{position:absolute;left:50%;bottom:52%;width:calc(var(--ck)*.06);height:34%;margin-left:calc(var(--ck)*-.03);transform-origin:50% 100%;transition:transform .35s,opacity .35s}
      .cd-glow{position:absolute;left:50%;top:50%;width:260%;height:220%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,220,120,.6),rgba(255,200,80,0) 65%);animation:cd-glow 1.2s ease-in-out infinite alternate}
      .cd-flame{position:absolute;inset:0;border-radius:50% 50% 50% 50%/62% 62% 38% 38%;background:radial-gradient(ellipse at 50% 72%,#fff 0 18%,#fff2a0 30%,#ffb020 60%,#ff6a2e 85%);
        animation:cd-flick .18s ease-in-out infinite alternate;transform-origin:50% 100%}
      @keyframes cd-flick{from{transform:scale(1,1) skewX(-3deg)}to{transform:scale(.92,1.08) skewX(4deg)}}
      @keyframes cd-glow{to{opacity:.6;transform:translate(-50%,-50%) scale(.9)}}
      .cd-c.out .cd-fl{transform:scale(.1,0);opacity:0}
      .cd-c.blow .cd-fl{transform:skewX(-35deg) scale(.7,.8)}
      .cd-smoke{position:absolute;left:50%;bottom:58%;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:rgba(150,150,165,.55);pointer-events:none;filter:blur(2px);
        animation:cd-smoke 1.6s ease-out forwards;animation-delay:var(--dl)}
      @keyframes cd-smoke{0%{transform:translate(0,0) scale(.4);opacity:.8}50%{transform:translate(var(--dx),-50px) scale(1.2)}100%{transform:translate(calc(var(--dx)*-1),-110px) scale(1.8);opacity:0}}
      .cd-hoo{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);font-size:clamp(20px,3vw,30px);color:#7aa7d9;white-space:nowrap;pointer-events:none;animation:cd-hoo .8s ease-out forwards}
      @keyframes cd-hoo{from{opacity:0;transform:translate(10%,10px)}30%{opacity:1}to{opacity:0;transform:translate(-90%,-10px)}}
      .cd-note{position:absolute;font-size:clamp(26px,4vw,42px);pointer-events:none;animation:cd-note 2s ease-out forwards;z-index:4}
      @keyframes cd-note{to{transform:translate(var(--dx),-160px) rotate(20deg);opacity:0}}
    `);
    const room = U.el("div", "cd-room");
    const COLS = ["#ff5b6e", "#ffc531", "#3fd17a", "#33b7ff", "#8a63ee", "#ff7ac6"];
    room.innerHTML = '<div class="cd-flags">' + Array.from({ length: 12 }, (_, i) => '<i style="--c:' + COLS[i % COLS.length] + '"></i>').join("") + '</div><div class="cd-banner"></div>';
    const wrap = U.el("div", "cd-wrap");
    wrap.innerHTML =
      '<div class="cd-hero"><span class="hero"></span><div class="cd-hat"></div><div class="cd-pom"></div></div>' +
      '<div class="cd-cake"><div class="cd-plate"></div><div class="cd-t1"><div class="cd-drip"></div><div class="cd-dots"></div></div>' +
      '<div class="cd-t2"><div class="cd-drip"></div></div>' +
      '<div class="cd-berry" style="left:22%">' + KP.E("🍓") + '</div><div class="cd-berry" style="right:22%">' + KP.E("🍓") + "</div>" +
      '<div class="cd-candles"></div></div>';
    room.appendChild(wrap);
    ctx.body.appendChild(room);
    Object.assign(ctx, { room, wrap, hero: U.$(".cd-hero", wrap), heroImg: U.$(".hero", wrap), candlesEl: U.$(".cd-candles", wrap), banner: U.$(".cd-banner", room) });
    ctx.HEROES = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰돌이"], ["🐼", "판다"], ["🦁", "사자"], ["🐯", "호랑이"],
      ["🐨", "코알라"], ["🐷", "돼지"], ["🐵", "원숭이"], ["🦊", "여우"], ["🐸", "개구리"], ["🦄", "유니콘"],
    ];
    ctx.CCOL = ["#ff5b6e", "#3aa0ff", "#3fd17a", "#ffb020", "#8a63ee"];
    ctx.size = () => {
      const W = room.clientWidth,
        H = room.clientHeight;
      const ck = Math.round(U.clamp(Math.min(W * 0.8, (H - 130) / 1.36), 200, 460));
      wrap.style.setProperty("--ck", ck + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastHero = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 5][lv - 1];
    const hero = U.pick(ctx.HEROES.filter((h) => h !== ctx.lastHero));
    ctx.lastHero = hero;
    ctx.heroImg.innerHTML = KP.E(hero[0]);
    ctx.hero.classList.remove("happy");
    ctx.room.classList.remove("dark");
    ctx.banner.textContent = hero[1] + " 생일";
    ctx.size();
    ctx.candlesEl.innerHTML = "";
    let left = n,
      trick = lv === 3 ? U.rand(n) : -1,
      busy = false;
    ctx.say("오늘은 " + hero[1] + " 생일! 촛불을 콕 눌러서 후~ 불어 줘요 🎂");
    const candles = Array.from({ length: n }, (_, i) => {
      const c = U.el("div", "cd-c");
      c.style.setProperty("--c1", ctx.CCOL[i % ctx.CCOL.length]);
      c.dataset.tap = "1";
      c.innerHTML = '<div class="cd-fl"><div class="cd-glow"></div><div class="cd-flame"></div></div><div class="cd-wick"></div><div class="cd-stick"></div>';
      ctx.candlesEl.appendChild(c);
      ctx.fast(c, () => blow(c, i));
      return c;
    });
    const blow = (c, i) => {
      if (busy || c.classList.contains("out")) return;
      c.classList.add("blow");
      // 후~ 바람 소리
      A.noise({ dur: 0.55, vol: 0.2, bp: 700, bpTo: 1500, q: 0.7, attack: 0.05 });
      const h = U.el("div", "cd-hoo", "후~");
      c.appendChild(h);
      ctx.after(800, () => h.remove());
      ctx.after(220, () => {
        c.classList.remove("blow");
        c.classList.add("out");
        A.note(A.SCALE[7 - left] || "C5", { inst: "bell", dur: 0.4, vol: 0.14 });
        for (let s = 0; s < 3; s++) {
          const sm = U.el("div", "cd-smoke");
          sm.style.cssText = "--dl:" + s * 0.18 + "s;--dx:" + U.randf(-14, 14) + "px";
          c.appendChild(sm);
          ctx.after(2000, () => sm.remove());
        }
      });
      left--;
      // 장난꾸러기 촛불: 한 번 다시 켜지기
      if (i === trick) {
        trick = -1;
        ctx.after(1400, () => {
          if (!ctx._active || busy) return;
          c.classList.remove("out");
          left++;
          A.sfx("boing");
          KP.voice.say("어? 다시 켜졌네! 한 번 더 후~");
          U.replay(c, "jump");
          hint();
        });
      }
      if (left === 0) ctx.after(1500, () => left === 0 && party());
      else hint();
    };
    const hint = () => ctx.hint(() => candles.find((c) => !c.classList.contains("out")), "촛불을 콕 눌러서 후~ 불어요!");
    hint();
    const party = async () => {
      if (busy) return;
      busy = true;
      ctx.hint(null);
      ctx.room.classList.add("dark");
      ctx.hero.classList.add("happy");
      KP.voice.say("다 껐다! 다 같이 노래해요!");
      await ctx.wait(1500);
      const len = A.melody(A.SONGS.birthday.notes, { beat: 0.36, inst: "bell", vol: 0.22 });
      // 음표가 둥실둥실
      const notes = ["🎵", "🎶", "🎈", "🎉"];
      for (let k = 0; k < 10; k++)
        ctx.after(k * len * 100, () => {
          const e = U.el("div", "cd-note", KP.E(U.pick(notes)));
          e.style.cssText = "left:" + U.randf(10, 85) + "%;top:" + U.randf(45, 75) + "%;--dx:" + U.randf(-40, 40) + "px";
          ctx.room.appendChild(e);
          ctx.after(2100, () => e.remove());
        });
      await ctx.wait(len * 1000 + 300);
      ctx.room.classList.remove("dark");
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: U.josa(hero[1], "아/야") + " 생일 축하해!" });
      if (ok) this.next(ctx);
    };
  },
});
