/* 깜짝 달걀 — 둥지 속 달걀을 톡톡톡! 금이 점점 커지다가 쩍! 아기 동물이 나와 울음소리를 내요
   1단계: 달걀 3개 / 2단계: 4개 + 가끔 반짝 황금알(특별한 친구) / 3단계: 5개 + 황금알 + 단단한 알 1개(다섯 번 톡톡)
   - 좁은 폰 세로는 두 줄(2+1, 2+2, 3+2)로 달걀을 키우고, 풀밭(초록)이 맨 윗줄 둥지 높이부터 깔림
   - 다 깨면 성공, 다음 판엔 다른 친구들 */
"use strict";
KP.game({
  id: "egg",
  icon: "🥚",
  name: "깜짝 달걀",
  cat: "play",
  levels: 3,
  score: "🐣",
  setup(ctx) {
    const U = KP.u;
    KP.css("egg", `
      .eg-stage{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#fff4d6 0%,#ffe9b8 var(--gy,58%),#9fd889 var(--gy,58%),#7cc56b 100%);display:flex;align-items:center;justify-content:center}
      .eg-stage::before{content:"";position:absolute;left:6%;top:8%;width:clamp(60px,9vw,100px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff7b8 0 40%,#ffd84a 70%,transparent 72%);box-shadow:0 0 50px 16px rgba(255,220,100,.5)}
      .eg-row{position:relative;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:clamp(6px,2vw,26px);padding:10px;max-width:100%}
      .eg-cell{position:relative;width:var(--es);height:calc(var(--es)*1.55);display:flex;align-items:flex-end;justify-content:center}
      .eg-nest{position:absolute;left:-12%;right:-12%;bottom:0;height:34%;border-radius:50%;z-index:3;pointer-events:none;
        background:repeating-linear-gradient(160deg,#b67a3c 0 5px,#8e5a26 5px 9px,#d29a55 9px 13px);box-shadow:inset 0 8px 10px rgba(0,0,0,.25),0 6px 0 rgba(0,0,0,.08)}
      .eg-nest::before{content:"";position:absolute;inset:-6% 4% 40%;border-radius:50%;background:repeating-linear-gradient(20deg,#c48945 0 4px,#9b642c 4px 8px);opacity:.8}
      .eg-egg{position:absolute;left:0;right:0;bottom:16%;height:calc(var(--es)*1.24);cursor:pointer;z-index:2;transform-origin:50% 90%}
      .eg-egg.hintGlow{position:absolute;border-radius:50%}
      .eg-half{position:absolute;inset:0;border-radius:50% 50% 50% 50%/62% 62% 40% 40%;background:var(--bg);box-shadow:inset -10px -14px 22px rgba(120,80,30,.18),inset 8px 8px 14px rgba(255,255,255,.6)}
      .eg-top{clip-path:polygon(0 0,100% 0,100% 50%,90% 43%,80% 53%,70% 43%,60% 53%,50% 43%,40% 53%,30% 43%,20% 53%,10% 43%,0 50%);z-index:3;transition:transform .7s cubic-bezier(.3,1.2,.5,1),opacity .6s .5s}
      .eg-bot{clip-path:polygon(0 50%,10% 43%,20% 53%,30% 43%,40% 53%,50% 43%,60% 53%,70% 43%,80% 53%,90% 43%,100% 50%,100% 100%,0 100%);z-index:3}
      .eg-crack{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:visible}
      .eg-crack path{fill:none;stroke:#6b4a2a;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);transition:stroke-dashoffset .25s}
      .eg-egg[data-k="1"] .c1,.eg-egg[data-k="2"] .c1,.eg-egg[data-k="2"] .c2{stroke-dashoffset:0}
      .eg-baby{position:absolute;left:8%;right:8%;bottom:20%;height:calc(var(--es)*.84);font-size:calc(var(--es)*.84);line-height:1;z-index:2;transform:translateY(40%) scale(.4);opacity:0;pointer-events:none;
        transition:transform .55s cubic-bezier(.2,1.6,.4,1) .15s,opacity .2s .15s}
      .eg-baby .e{width:100%;height:100%;display:block}
      .eg-egg.open .eg-baby{transform:translateY(-34%) scale(1);opacity:1}
      .eg-egg.open .eg-top{transform:translate(30%,-95%) rotate(38deg);opacity:0}
      .eg-egg.open .eg-crack{display:none}
      .eg-egg.open{cursor:default}
      .eg-egg.open .eg-baby{animation:eg-happy .9s ease-in-out .8s infinite alternate}
      @keyframes eg-happy{from{transform:translateY(-34%) rotate(-6deg)}to{transform:translateY(-40%) rotate(6deg)}}
      .eg-tok{animation:eg-tok .3s}
      @keyframes eg-tok{25%{transform:rotate(-9deg) scale(1.03,.97)}60%{transform:rotate(7deg)}}
      .eg-wobble{animation:eg-wob 2.6s ease-in-out infinite}
      @keyframes eg-wob{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-5deg)}90%{transform:rotate(5deg)}95%{transform:rotate(-3deg)}}
      .eg-say{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%);white-space:nowrap;z-index:6;background:#fff;color:var(--ink);font-size:clamp(17px,2.4vw,24px);
        padding:4px 12px;border-radius:16px;box-shadow:0 4px 0 rgba(0,0,0,.1);animation:popBig .4s cubic-bezier(.2,1.6,.4,1);pointer-events:none}
      .eg-shell{position:absolute;width:var(--s);height:var(--s);background:var(--bg);clip-path:polygon(50% 0,100% 60%,30% 100%,0 40%);z-index:5;pointer-events:none;animation:eg-shell .8s ease-out forwards}
      @keyframes eg-shell{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
      .eg-tap{position:absolute;font-size:clamp(24px,3.4vw,34px);color:#fff;-webkit-text-stroke:5px #8a4b00;paint-order:stroke;text-shadow:0 3px 0 #8a4b00;z-index:6;pointer-events:none;animation:eg-tapT .6s ease-out forwards}
      @keyframes eg-tapT{from{transform:translate(-50%,0) scale(.5)}40%{transform:translate(-50%,-20px) scale(1.1)}to{transform:translate(-50%,-40px);opacity:0}}
      .eg-hard .eg-half{box-shadow:inset -12px -16px 22px rgba(70,45,20,.4),inset 8px 8px 14px rgba(255,255,255,.5),inset 0 0 0 4px rgba(120,90,55,.55)}
      .eg-hard.eg-tok{animation:eg-hardT .3s}
      @keyframes eg-hardT{30%{transform:translateX(-4px) scale(.98,1.02)}60%{transform:translateX(4px)}}
      .eg-gold .eg-half{box-shadow:inset -10px -14px 22px rgba(160,100,0,.25),inset 8px 8px 14px rgba(255,255,255,.7)}
      .eg-gold{filter:drop-shadow(0 0 12px rgba(255,210,60,.8))} /* 반짝임은 알 모양대로 (그림자는 반쪽 자르기에 네모로 잘려서) */
    `);
    const stage = U.el("div", "eg-stage");
    const row = U.el("div", "eg-row");
    stage.appendChild(row);
    ctx.body.appendChild(stage);
    ctx.stage = stage;
    ctx.row = row;
    // [이모지, 이름, 울음소리]
    ctx.BABIES = [
      ["🐥", "병아리", "삐약삐약"], ["🦆", "아기 오리", "꽥꽥"], ["🐢", "아기 거북이", "느릿느릿 엉금엉금"], ["🐊", "아기 악어", "쩝쩝 크앙"], ["🦖", "아기 공룡", "크아앙"],
      ["🐍", "아기 뱀", "쉬익쉬익"], ["🐧", "아기 펭귄", "뒤뚱뒤뚱 꽉꽉"], ["🦉", "아기 부엉이", "부엉부엉"], ["🦜", "아기 앵무새", "안녕 안녕"], ["🦕", "아기 목긴 공룡", "우우웅"],
      ["🐦", "아기 새", "짹짹"], ["🦩", "아기 홍학", "끼룩끼룩"],
    ];
    ctx.SPECIAL = [["🦄", "유니콘", "히히힝"], ["🐉", "아기 용", "크르릉 푸우"]];
    ctx.SKINS = [
      "radial-gradient(circle at 30% 30%,#fff 0 6%,transparent 7%),#fff8ec",
      "radial-gradient(circle at 30% 35%,#b9e3ff 0 7%,transparent 8%),radial-gradient(circle at 68% 58%,#b9e3ff 0 9%,transparent 10%),radial-gradient(circle at 40% 75%,#b9e3ff 0 6%,transparent 7%),#f2fbff",
      "repeating-linear-gradient(170deg,#ffe0ef 0 14px,#ffc7e1 14px 24px)",
      "radial-gradient(circle at 35% 30%,#c4f2c0 0 8%,transparent 9%),radial-gradient(circle at 65% 65%,#c4f2c0 0 10%,transparent 11%),#f4fff0",
      "repeating-linear-gradient(10deg,#fff5c8 0 16px,#ffe58a 16px 22px)",
      "radial-gradient(circle at 30% 60%,#d9c6ff 0 7%,transparent 8%),radial-gradient(circle at 70% 30%,#d9c6ff 0 8%,transparent 9%),#f8f3ff",
      "#f6e3c8",
    ];
    ctx.HARD = "radial-gradient(circle at 28% 30%,#a88a66 0 5%,transparent 6%),radial-gradient(circle at 66% 48%,#a88a66 0 6%,transparent 7%),radial-gradient(circle at 42% 72%,#a88a66 0 4%,transparent 5%),radial-gradient(circle at 75% 78%,#a88a66 0 5%,transparent 6%),#dcc6a4";
    ctx.GOLD = "radial-gradient(circle at 32% 26%,#fffbe0 0 10%,#ffd84a 40%,#f0a800 100%)";
    ctx.round = 0;
    ctx.size = () => {
      const n = ctx.n || 3;
      const W = stage.clientWidth,
        H = stage.clientHeight;
      // 좁은 폰 세로: 두 줄(3개 → 2+1, 4개 → 2+2, 5개 → 3+2)로 달걀을 크게
      const perRow = W < 560 ? (n <= 2 ? n : Math.ceil(n / 2)) : n;
      const rows = Math.ceil(n / perRow);
      const es = Math.floor(U.clamp(Math.min((W - 40) / perRow / 1.35, (H - 70) / rows / 1.75), 74, 190));
      row.style.setProperty("--es", es + "px");
      // 한 줄에 perRow 개만 (다음 달걀 하나가 더 들어갈 틈은 없게: 여유 es*0.5)
      const gap = U.clamp(innerWidth * 0.02, 6, 26);
      row.style.maxWidth = perRow * es + (perRow - 1) * gap + 20 + es * 0.5 + "px";
      // 풀밭은 맨 윗줄 둥지 높이부터 (위 줄 달걀이 하늘에 떠 보이지 않게)
      const first = row.firstElementChild;
      if (first && H) {
        const sr = stage.getBoundingClientRect(),
          cr = first.getBoundingClientRect();
        const gy = ((cr.bottom - cr.height * 0.3 - sr.top) / H) * 100;
        stage.style.setProperty("--gy", U.clamp(gy, 25, 75).toFixed(1) + "%");
      } else stage.style.removeProperty("--gy");
    };
    addEventListener("resize", () => ctx._active && ctx.size());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.used = [];
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 5][lv - 1];
    ctx.n = n;
    // 지난번과 다른 친구들
    let pool = ctx.BABIES.filter((b) => !ctx.used.includes(b[0]));
    if (pool.length < n) {
      ctx.used = [];
      pool = ctx.BABIES;
    }
    const babies = U.sample(pool, n);
    ctx.used.push(...babies.map((b) => b[0]));
    const goldAt = lv >= 2 && Math.random() < 0.5 ? U.rand(n) : -1;
    if (goldAt >= 0) babies[goldAt] = U.pick(ctx.SPECIAL);
    // 3단계: 단단한 알 하나 (다섯 번 톡톡 해야 깨짐) — 황금알과 겹치지 않게
    const hardAt = lv >= 3 ? U.pick(Array.from({ length: n }, (_, i) => i).filter((i) => i !== goldAt)) : -1;
    const skins = U.shuffle([...ctx.SKINS]);
    ctx.row.innerHTML = "";
    let left = n,
      busy = false;
    if (hardAt < 0) ctx.say("달걀을 톡톡톡! 세 번 두드려 봐요. 누가 나올까? 🥚");
    else {
      // 단단한 알(다섯 번)이 있는 판: 횟수 안내를 맞춤. "단단한 알은 다섯 번!" 자연 음성은 new-voice/egg.txt —
      // 녹음 전에는 그 문장만 말하지 않음(화면 글자로만), 톡톡할 때 "조금 더!"·"딱 한 번만 더!"로 이어서 안내
      const HARD_TXT = "단단한 알은 다섯 번!";
      const nat = KP.voice._natUrls && KP.voice._natUrls(HARD_TXT);
      ctx.say("달걀을 톡톡톡! 세 번 두드려 봐요. " + HARD_TXT + " 🥚", "달걀을 톡톡톡! 세 번 두드려 봐요. " + (nat ? HARD_TXT : "누가 나올까?"));
    }
    const eggs = babies.map((bb, i) => {
      const gold = i === goldAt,
        hard = i === hardAt,
        need = hard ? 5 : 3;
      const cell = U.el("div", "eg-cell item");
      cell.style.setProperty("--i", i);
      const egg = U.el("div", "eg-egg eg-wobble" + (gold ? " eg-gold" : "") + (hard ? " eg-hard" : ""));
      egg.style.setProperty("--bg", gold ? ctx.GOLD : hard ? ctx.HARD : skins[i % skins.length]);
      egg.style.animationDelay = -i * 0.7 + "s";
      egg.dataset.k = 0;
      egg.dataset.tap = "1";
      egg.innerHTML =
        '<div class="eg-baby">' + KP.E(bb[0]) + "</div>" +
        '<div class="eg-half eg-bot"></div><div class="eg-half eg-top"></div>' +
        '<svg class="eg-crack" viewBox="0 0 100 124" preserveAspectRatio="none">' +
        '<path class="c1" style="--len:70" d="M38 34 L46 44 L40 52 L50 60 L45 68"/>' +
        '<path class="c2" style="--len:130" d="M45 68 L36 62 L26 70 L16 62 L8 70 M50 60 L60 68 L70 60 L80 70 L92 62"/></svg>';
      cell.innerHTML = '<div class="eg-nest"></div>';
      cell.appendChild(egg);
      ctx.row.appendChild(cell);
      let k = 0,
        open = false;
      ctx.fast(egg, () => {
        if (open || busy) return;
        k++;
        egg.classList.remove("eg-wobble");
        U.replay(egg, "eg-tok");
        const r = egg.getBoundingClientRect(),
          cr = cell.getBoundingClientRect();
        const t = U.el("div", "eg-tap", k >= need ? "쩍!" : k % 2 ? "톡!" : "톡톡!");
        t.style.left = r.left - cr.left + r.width / 2 + "px";
        t.style.top = "10%";
        cell.appendChild(t);
        ctx.after(620, () => t.remove());
        if (k < need) {
          // 금: 보통 알은 1번째·2번째, 단단한 알은 2번째·4번째 톡에 생김
          egg.dataset.k = Math.floor((k * 2) / (need - 1));
          A.note(hard ? ["C5", "D5", "E5", "G5"][k - 1] : k === 1 ? "E5" : "G5", { inst: "marimba", dur: 0.2, vol: 0.3 });
          A.noise({ dur: 0.05, vol: 0.12, hp: 2500 });
          // 단단한 알: 세 번째에 안 깨지는 까닭을 말로 ("조금 더!") → 네 번째 "딱 한 번만 더!"
          if (hard && k === 3) KP.voice.say("조금 더!");
          else if (hard && k === need - 1) KP.voice.say("딱 한 번만 더!");
          else if (hard) {
            /* 1·2번째는 소리만 */
          } else if (k === need - 1) KP.voice.say(U.pick(["금이 갔어요!", "한 번 더!", "어? 움직여요!"]));
          hint();
          return;
        }
        // 쩍! 깨지기
        open = true;
        egg.classList.add("open");
        A.noise({ dur: 0.18, vol: 0.2, hp: 1500 });
        A.sfx("pop");
        ctx.after(250, () => A.sfx(gold ? "sticker" : "levelup"));
        for (let s = 0; s < 6; s++) {
          const sh = U.el("div", "eg-shell");
          sh.style.cssText = "--bg:" + egg.style.getPropertyValue("--bg") + ";left:" + (r.left - cr.left + r.width / 2) + "px;top:40%;--s:" + U.randf(12, 22) + "px;--dx:" + U.randf(-90, 90) + "px;--dy:" + U.randf(-90, 10) + "px;--r:" + U.rand(400) + "deg";
          cell.appendChild(sh);
          ctx.after(850, () => sh.remove());
        }
        const bub = U.el("div", "eg-say", bb[2] + "!");
        ctx.after(600, () => {
          cell.appendChild(bub);
          // 황금알 친구는 "…반짝반짝 아기 용!" (조사 붙은 자연 음성이 없어서 이름만)
          KP.voice.say(bb[2] + "! " + (gold ? "반짝반짝 " + bb[1] + "!" : U.josa(bb[1], "이에요/예요")));
        });
        left--;
        ctx.score.add();
        if (left === 0) {
          busy = true;
          ctx.after(2600, async () => {
            ctx.round++;
            const big = ctx.round % 4 === 0;
            const ok = await ctx.win({ big, msg: big ? "아기 동물 친구 부자!" : "모두 태어났어요!" });
            if (ok) this.next(ctx);
          });
        } else hint();
      });
      return egg;
    });
    ctx.size();
    const hint = () => {
      const e = eggs.find((x) => !x.classList.contains("open"));
      ctx.hint(() => e, "달걀을 톡톡톡 두드려 봐요!");
    };
    hint();
  },
});
