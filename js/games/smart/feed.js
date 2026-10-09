/* 동물 먹이 주기 — 배고픈 동물에게 맞는 먹이를 끌어다 입에 쏙! 먹으면 냠냠·하트.
   1단계: 동물 1마리, 먹이 2개 / 2단계: 동물 1마리, 먹이 3개 / 3단계: 동물 2마리, 먹이 4개(둘 다 먹여야 끝) */
"use strict";
KP.game({
  id: "feed",
  icon: "🥕",
  name: "동물 먹이 주기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("feed", `
      .fdWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 16px}
      .fdAnimals{display:flex;gap:clamp(8px,6vw,120px);max-width:100%;justify-content:center;align-items:flex-end}
      .fdAni{position:relative;display:flex;flex-direction:column;align-items:center;border-radius:40px;padding:8px 14px}
      @media (max-aspect-ratio:1/1){.fdWrap{--asz:var(--aszp)!important;--fsz:var(--fszp)!important}}
      .fdAni .fdEm{font-size:var(--asz);line-height:1;display:block;animation:fdIdle 2.4s ease-in-out infinite}
      @keyframes fdIdle{50%{transform:translateY(-6px) rotate(-2deg)}}
      .fdAni .fdName{font-size:clamp(20px,2.6vw,28px);margin-top:4px}
      .fdAni.dropHover{outline:none;background:rgba(255,197,49,.35);box-shadow:0 0 0 8px rgba(255,197,49,.35)}
      .fdAni.dropHover .fdEm{animation:fdOpen .5s ease-in-out infinite}
      @keyframes fdOpen{50%{transform:scale(1.12)}}
      .fdThink{position:absolute;top:-6px;right:-2px;font-size:clamp(28px,3.6vw,40px);background:#fff;border-radius:50%;width:1.5em;height:1.5em;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);animation:bob 2s ease-in-out infinite}
      .fdAni.full .fdThink{display:none}
      .fdChomp .fdEm{animation:fdChomp .9s ease-in-out}
      @keyframes fdChomp{15%,45%,75%{transform:scale(1.12,.86)}30%,60%,90%{transform:scale(.94,1.08)}}
      .fdHeart{position:absolute;left:50%;top:30%;font-size:clamp(30px,4vw,44px);pointer-events:none;animation:fdHeart 1.4s ease-out forwards}
      @keyframes fdHeart{from{transform:translate(-50%,0) scale(.3);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-140px) scale(1.1);opacity:0}}
      .fdYum{position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:var(--coral);color:#fff;border-radius:999px;padding:4px 14px;font-size:clamp(20px,2.6vw,28px);white-space:nowrap;animation:popIn .3s;z-index:3}
      .fdTray{display:flex;gap:clamp(12px,3vw,34px);justify-content:center;flex-wrap:wrap;background:rgba(255,255,255,.75);border-radius:32px;padding:clamp(10px,1.6vw,18px) clamp(14px,2.6vw,30px);box-shadow:inset 0 -6px 0 rgba(47,58,102,.08)}
      .fdFood{font-size:var(--fsz);line-height:1;padding:8px;border-radius:24px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.12)}
      .fdFood.dragging{background:transparent;box-shadow:none}
      .fdFood.eaten{transition:transform .35s ease-in,opacity .35s;opacity:0}
    `);
    ctx.wrap = U.el("div", "fdWrap");
    ctx.ani = U.el("div", "fdAnimals");
    ctx.tray = U.el("div", "fdTray");
    ctx.wrap.append(ctx.ani, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    // [동물, 이름, 먹이, 먹이 이름, 함께 먹는 것(보기에서 빼기)]
    ctx.FEED = [
      ["🐰", "토끼", "🥕", "당근", "🥬"], ["🐵", "원숭이", "🍌", "바나나", "🥜"], ["🐶", "강아지", "🦴", "뼈다귀", "🍖"],
      ["🐱", "고양이", "🐟", "생선", ""], ["🐼", "판다", "🎋", "대나무", "🍃"], ["🐿️", "다람쥐", "🌰", "도토리", "🥜"],
      ["🐮", "소", "🌾", "풀", "🥬🥕"], ["🐝", "꿀벌", "🌼", "꽃", "🍯"], ["🐻", "곰", "🍯", "꿀", "🐟🍓"], ["🐭", "쥐", "🧀", "치즈", "🌽🌰"],
      ["🐘", "코끼리", "🥜", "땅콩", "🍌🌾"], ["🐔", "닭", "🌽", "옥수수", "🌾"], ["🦁", "사자", "🍖", "고기", "🦴"], ["🐨", "코알라", "🍃", "나뭇잎", "🎋"],
    ];
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
    const nAni = lv === 3 ? 2 : 1;
    const nFood = [2, 3, 4][lv - 1];
    let pool = ctx.FEED.filter((f) => f !== ctx.last);
    const ani = U.sample(pool, nAni);
    ctx.last = ani[0];
    // 보기 먹이: 이번 동물들이 (함께) 먹는 것은 빼기 → 헷갈리는 정답 없음
    const ok = (f) => !ani.some((a) => a[2] === f[2] || a[4].includes(f[2]));
    const distract = U.sample(ctx.FEED.filter((f) => !ani.includes(f) && ok(f)), nFood - nAni);
    const foods = U.shuffle([...ani, ...distract]);

    ctx.wrap.style.setProperty("--asz", nAni === 1 ? "clamp(120px,min(28vw,28vh),230px)" : "clamp(96px,min(22vw,22vh),190px)");
    ctx.wrap.style.setProperty("--fsz", nFood <= 2 ? "clamp(70px,min(14vw,12vh),110px)" : "clamp(58px,min(12vw,10vh),96px)");
    ctx.wrap.style.setProperty("--aszp", nAni === 1 ? "clamp(120px,56vw,240px)" : "clamp(96px,36vw,190px)");
    ctx.wrap.style.setProperty("--fszp", ["", "", "clamp(70px,26vw,110px)", "clamp(64px,19vw,96px)", "clamp(56px,14vw,90px)"][nFood]);
    ctx.ani.innerHTML = "";
    ctx.tray.innerHTML = "";
    const aniEls = ani.map((a, i) => {
      const el = U.el("div", "fdAni item", '<span class="fdEm">' + KP.E(a[0]) + '</span><span class="fdName">' + a[1] + '</span><span class="fdThink">' + KP.E("❓") + "</span>");
      el.style.setProperty("--i", i);
      el.dataset.drop = a[1];
      ctx.ani.appendChild(el);
      return el;
    });
    const who = ani.map((a) => a[1]).join("랑 ");
    const ask = nAni === 1 ? U.josa(ani[0][1], "이/가") + " 배고파요! 맛있는 걸 끌어서 입에 쏙 넣어 줘요!" : U.josa(who, "이/가") + " 배고파요! 좋아하는 걸 하나씩 먹여 줘요!";
    ctx.say("🍽️ " + ask);
    KP.audio.tone(160, { to: 90, dur: 0.35, type: "triangle", vol: 0.18, when: 0.2 });

    let left = nAni;
    const foodEls = foods.map((f, i) => {
      const el = U.el("div", "fdFood item", KP.E(f[2]));
      el.style.setProperty("--i", i + 2);
      if (ani.includes(f)) el.dataset.go = f[1];
      ctx.tray.appendChild(el);
      const d = KP.drag(el, {
        targets: () => aniEls.filter((a) => !a.classList.contains("full")),
        accept: (t) => t.dataset.drop === f[1],
        pad: 34,
        onReject: (t) => {
          const a = ani.find((x) => x[1] === t.dataset.drop);
          U.replay(t.querySelector(".fdEm"), "wig");
          ctx.miss(null, U.josa(a[1], "은/는") + " " + U.josa(f[3], "을/를") + " 안 먹어요. 다른 걸 찾아봐요!");
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          el.dataset.done = "1";
          el.classList.add("eaten");
          el.style.transform += " scale(.15)";
          self.eat(ctx, t, f);
          left--;
          if (left === 0) done();
          else hint();
        },
      });
      return el;
    });
    const hint = () => ctx.hint(() => foodEls.find((e) => e.dataset.go && !e.dataset.done), "먹이를 끌어서 동물 입에 쏙 넣어 줘요!");
    hint();
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1500);
      const big = ctx.round % 5 === 0;
      const okk = await ctx.win({ big, msg: big ? "먹이 주기 대장 형아!" : "배불러요! 고마워요!" });
      if (okk) self.next(ctx);
    };
  },
  eat(ctx, t, f) {
    const U = KP.u,
      A = KP.audio;
    t.classList.add("full");
    U.replay(t, "fdChomp");
    t.querySelectorAll(".fdYum").forEach((x) => x.remove());
    t.appendChild(U.el("span", "fdYum", "냠냠!"));
    [0, 0.18, 0.36].forEach((w) => A.noise({ bp: 700, q: 1.5, dur: 0.1, vol: 0.25, when: w }));
    ctx.after(500, () => A.sfx("good"));
    for (let i = 0; i < 5; i++) {
      const h = U.el("span", "fdHeart", KP.E(i % 2 ? "💖" : "❤️"));
      h.style.setProperty("--dx", (i - 2) * 34 + "px");
      h.style.animationDelay = i * 0.12 + "s";
      t.appendChild(h);
      ctx.after(1800, () => h.remove());
    }
    KP.voice.say("냠냠! " + U.josa(f[1], "은/는") + " " + U.josa(f[3], "을/를") + " 좋아해요!");
  },
});
