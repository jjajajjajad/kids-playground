/* 동물 먹이 주기 — 배고픈 동물에게 맞는 먹이를 끌어다 입에 쏙! 먹으면 냠냠·하트.
   1단계: 동물 1마리, 먹이 3개 / 2단계: 동물 1마리, 먹이 4개 / 3단계: 동물 2마리, 먹이 5개(둘 다 먹여야 끝)
   2단계 판 셋 중 하나는 '두 개 먹이기': 좋아하는 것이 둘인 동물(강아지 뼈다귀+고기 등) — 하나 먹으면 생각 풍선에 남은 먹이, 말 '하나 더!'
   (예전 1단계 먹이 2개는 틀려도 남은 하나가 정답이라 찍어도 열쇠 별이 나왔음 → 보기 3개 이상으로)
   음성: 동물×먹이 조합 문장은 녹음이 없어서 이미 있는 조각("냠냠!" "당근!" "토끼가" "좋아해요!")으로 이어 말함 */
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
    // 2단계 '두 개 먹이기': 동물 이름 → [둘째 먹이 그림, 이름] (이름은 자연 음성 조각이 있는 것만)
    ctx.MORE = { 원숭이: ["🥜", "땅콩"], 강아지: ["🍖", "고기"], 판다: ["🍃", "나뭇잎"], 다람쥐: ["🥜", "땅콩"], 꿀벌: ["🍯", "꿀"], 닭: ["🌾", "풀"], 사자: ["🦴", "뼈다귀"], 코알라: ["🎋", "대나무"] };
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
    const nFood = [3, 4, 5][lv - 1];
    // 2단계: 판 셋 중 하나는 한 동물에게 좋아하는 것 두 개
    if (lv === 2) ctx.l2 = (ctx.l2 || 0) + 1;
    const two = lv === 2 && ctx.l2 % 3 === 0;
    let pool = ctx.FEED.filter((f) => f !== ctx.last && (!two || ctx.MORE[f[1]]));
    const ani = U.sample(pool, nAni);
    ctx.last = ani[0];
    // 두 번째 먹이: [동물 그림, 동물 이름, 먹이 그림, 먹이 이름, ""] 모양으로 만들어 같은 길로 끌기
    const extra = two ? [ani[0][0], ani[0][1], ctx.MORE[ani[0][1]][0], ctx.MORE[ani[0][1]][1], ""] : null;
    // 보기 먹이: 이번 동물들이 (함께) 먹는 것은 빼기 → 헷갈리는 정답 없음
    const ok = (f) => !ani.some((a) => a[2] === f[2] || a[4].includes(f[2])) && (!extra || f[2] !== extra[2]);
    const distract = U.sample(ctx.FEED.filter((f) => !ani.includes(f) && ok(f)), nFood - nAni - (extra ? 1 : 0));
    const foods = U.shuffle([...ani, ...(extra ? [extra] : []), ...distract]);

    ctx.wrap.style.setProperty("--asz", nAni === 1 ? "clamp(120px,min(28vw,28vh),230px)" : "clamp(96px,min(22vw,22vh),190px)");
    ctx.wrap.style.setProperty("--fsz", nFood <= 3 ? "clamp(70px,min(14vw,12vh),110px)" : "clamp(58px,min(12vw,10vh),96px)");
    ctx.wrap.style.setProperty("--aszp", nAni === 1 ? "clamp(120px,56vw,240px)" : "clamp(96px,36vw,190px)");
    ctx.wrap.style.setProperty("--fszp", ["", "", "clamp(70px,26vw,110px)", "clamp(64px,19vw,96px)", "clamp(56px,16vw,90px)", "clamp(56px,16vw,86px)"][nFood]);
    ctx.ani.innerHTML = "";
    ctx.tray.innerHTML = "";
    const aniEls = ani.map((a, i) => {
      const el = U.el("div", "fdAni item", '<span class="fdEm">' + KP.E(a[0]) + '</span><span class="fdName">' + a[1] + '</span><span class="fdThink">' + KP.E("❓") + "</span>");
      el.style.setProperty("--i", i);
      el.dataset.drop = a[1];
      ctx.ani.appendChild(el);
      return el;
    });
    const who = ani.map((a, i) => (i < ani.length - 1 ? U.josa(a[1], "이랑/랑") : a[1])).join(" "); // 곰이랑 토끼
    const ask = nAni === 1 && !extra ? U.josa(ani[0][1], "이/가") + " 배고파요! 맛있는 걸 끌어서 입에 쏙 넣어 줘요!" : nAni === 1 ? U.josa(ani[0][1], "이/가") + " 배고파요! 좋아하는 걸 하나씩 먹여 줘요!" : U.josa(who, "이/가") + " 배고파요! 좋아하는 걸 하나씩 먹여 줘요!";
    // 음성: "곰이랑" 녹음이 없어 "곰 하고 토끼가"(이미 있는 조각)로
    const tail = nAni === 1 && !extra ? " 배고파요! 맛있는 걸 끌어서 입에 쏙 넣어 줘요!" : " 배고파요! 좋아하는 걸 하나씩 먹여 줘요!"; // 두 개 먹이기 판은 '하나씩'
    const askV = nAni === 1 ? [ask, ani[0][1] + "!" + tail] : [ask, ani[0][1] + " 하고 " + U.josa(ani[1][1], "이/가") + tail, ani[0][1] + " 하고 " + ani[1][1] + "!" + tail];
    ctx.say("🍽️ " + ask, self.nat(...askV));
    KP.audio.tone(160, { to: 90, dur: 0.35, type: "triangle", vol: 0.18, when: 0.2 });

    let left = nAni + (extra ? 1 : 0);
    const need = new Map(aniEls.map((el) => [el, extra ? 2 : 1])); // 동물마다 먹어야 할 수
    const foodEls = foods.map((f, i) => {
      const el = U.el("div", "fdFood item", KP.E(f[2]));
      el.style.setProperty("--i", i + 2);
      if (ani.includes(f) || f === extra) el.dataset.go = f[1];
      ctx.tray.appendChild(el);
      const d = KP.drag(el, {
        targets: () => aniEls.filter((a) => !a.classList.contains("full")),
        accept: (t) => t.dataset.drop === f[1],
        pad: 34,
        onReject: (t) => {
          const a = ani.find((x) => x[1] === t.dataset.drop);
          U.replay(t.querySelector(".fdEm"), "wig");
          const m = U.josa(a[1], "은/는") + " " + U.josa(f[3], "을/를") + " 안 먹어요. 다른 걸 찾아봐요!";
          ctx.miss(null, self.nat(m, f[3] + "! " + U.josa(a[1], "은/는") + " 이건 안 먹어요. 다른 걸 찾아봐요!", f[3] + "! 이건 안 먹어요. 다른 걸 찾아봐요!"));
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          el.dataset.done = "1";
          el.classList.add("eaten");
          el.style.transform += " scale(.15)";
          need.set(t, need.get(t) - 1);
          self.eat(ctx, t, f, need.get(t) > 0);
          left--;
          if (left === 0) done();
          else hint();
        },
      });
      return el;
    });
    const hint = () => ctx.hint(() => foodEls.find((e) => e.dataset.go && !e.dataset.done), "먹이를 끌어서 동물 입에 쏙 넣어 줘요!", { answer: true });
    ctx.foodEls = foodEls; // 점검용
    hint();
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      await ctx.wait(1500);
      const big = ctx.round % 5 === 0;
      const okk = await ctx.win({ big, msg: big ? "{부름} 먹이 주기 대장!" : "배불러요! 고마워요!" });
      if (okk) self.next(ctx);
    };
  },
  /** 같은 뜻 문장들 중 자연 음성(이미 녹음된 조각)으로 말할 수 있는 첫 문장, 없으면 첫 문장(기기 목소리) */
  nat(...list) {
    const N = KP.voice._natUrls;
    return (N && list.find((t) => N(t))) || list[0];
  },
  eat(ctx, t, f, more) {
    const U = KP.u,
      A = KP.audio;
    if (!more) t.classList.add("full");
    else {
      // 아직 하나 더: 생각 풍선이 남은 먹이 그림으로 (두 개 먹이기 판)
      const th = t.querySelector(".fdThink");
      const m2 = ctx.MORE[f[1]];
      const main = ctx.FEED.find((x) => x[1] === f[1]);
      if (th && m2 && main) {
        th.innerHTML = KP.E(f[2] === main[2] ? m2[0] : main[2]);
        U.replay(th, "pop");
      }
    }
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
    const m = "냠냠! " + U.josa(f[1], "은/는") + " " + U.josa(f[3], "을/를") + " 좋아해요!";
    const said = KP.voice.say(this.nat(m, "냠냠! " + f[3] + "! " + U.josa(f[1], "이/가") + " 좋아해요!", "냠냠! " + f[3] + "! " + f[1] + "! 좋아해요!"));
    // 말이 끝나면 "하나 더!" — 그새 두 번째 먹이까지 먹였으면(full) 말하지 않음(뒤 '냠냠' 말을 끊고 틀린 말이 나왔음)
    if (more) Promise.resolve(said).then(() => ctx._active && t.isConnected && !t.classList.contains("full") && KP.voice.say("하나 더!"));
  },
});
