/* 무엇이 없어졌을까? — 잘 보고, 커튼이 닫혔다 열리면 사라진 것 찾기
   1단계: 3개 (빈자리가 점선으로 보임) · 보기 3개
   2단계: 4개 (두 종류 2개씩, 빈자리는 그대로, 점선 없음) · 보기 4개(남아 있는 것 1개 섞임)
   3단계: 6개 (남은 것들 자리도 섞임) · 보기 4개(같은 종류끼리)
   - 처음 안내가 끝나면 하나씩 통통 튀며 이름을 불러 줌 → 커튼 닫힘 "눈 감아요! 하나, 둘, 셋!" → 열림
   - 보는 동안 그림을 누르면 통통 튀며 이름을 말해 주고, 커튼이 닫혔을 때 누르면 🙈 가 "하나, 둘, 셋!"
   - 보는 시간 줄이기(2차 보강): 열고 둘째 판부터 안내는 짧게 "잘 봐요!", 1·2단계는 이름 대신 통통+소리만 빠르게(3단계는 이름 그대로)
   - 좁은 세로 화면 1단계(3개): 2+1 로 그림을 크게 */
"use strict";
KP.game({
  id: "missing",
  icon: "❓",
  name: "무엇이 없어졌을까?",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("missing", `
      .msWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 14px;gap:10px}
      .msStage{position:relative;overflow:hidden;border-radius:30px;padding:clamp(14px,2.4vw,26px) clamp(14px,2.4vw,30px) clamp(26px,3.6vw,40px);background:linear-gradient(180deg,#fff9ea,#ffe9bf);box-shadow:0 10px 0 #d9a65a,0 14px 24px rgba(47,58,102,.12);max-width:100%}
      .msStage::after{content:"";position:absolute;left:0;right:0;bottom:0;height:clamp(16px,2.4vw,24px);background:linear-gradient(180deg,#c98a3c,#a96d26)}
      .msRow{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--mg,14px)}
      .msSpot{width:var(--ms,120px);height:var(--ms,120px);display:flex;align-items:center;justify-content:center;font-size:calc(var(--ms,120px)*.8);line-height:1;border-radius:24px;transition:transform .45s cubic-bezier(.3,1.3,.5,1)}
      .msSpot.gap{border:4px dashed rgba(169,109,38,.45)}
      .msSpot .eb{animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*90ms)}
      .msCur{position:absolute;top:0;bottom:0;width:51%;z-index:3;transition:transform .7s cubic-bezier(.5,0,.3,1);background:repeating-linear-gradient(90deg,#d2344a 0 18px,#b8213a 18px 30px,#e0485c 30px 40px);box-shadow:inset 0 -12px 0 #8e1529}
      .msCur.l{left:0;transform:translateX(-102%);border-right:3px solid #8e1529}
      .msCur.r{right:0;transform:translateX(102%);border-left:3px solid #8e1529}
      .msStage.closed .msCur{transform:none}
      .msEyes{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;font-size:calc(var(--ms,120px)*.9);opacity:0;transition:opacity .3s;pointer-events:none}
      .msEyes .eb.jump{animation:jumpA .5s}
      .msStage.closed .msEyes{opacity:1}
      .msEyes .eb{animation:bob 1.2s ease-in-out infinite}
      .msAns{display:flex;gap:clamp(12px,2.4vw,26px);justify-content:center;flex-wrap:wrap;min-height:clamp(90px,13vw,140px);transition:opacity .3s}
      .msAns.hide{visibility:hidden;opacity:0}
      .msAns .choice{font-size:clamp(54px,8vw,84px)}
    `);
    ctx.wrap = U.el("div", "msWrap");
    ctx.stage = U.el("div", "msStage");
    ctx.row = U.el("div", "msRow");
    ctx.eyes = U.el("div", "msEyes", '<span class="eb">' + KP.E("🙈") + "</span>");
    ctx.stage.append(ctx.row, U.el("div", "msCur l"), U.el("div", "msCur r"), ctx.eyes);
    ctx.ans = U.el("div", "msAns hide");
    ctx.wrap.append(ctx.stage, ctx.ans);
    ctx.body.appendChild(ctx.wrap);

    ctx.POOLS = [
      [["🍎", "사과"], ["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"], ["🍑", "복숭아"], ["🍒", "체리"], ["🍊", "귤"], ["🍋", "레몬"]],
      [["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰"], ["🐼", "판다"], ["🐸", "개구리"], ["🦁", "사자"], ["🐯", "호랑이"], ["🐵", "원숭이"]],
      [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚓", "경찰차"], ["🚜", "트랙터"], ["🚲", "자전거"], ["✈️", "비행기"], ["🚀", "로켓"], ["🚂", "기차"]],
      [["⚽", "공"], ["🎈", "풍선"], ["🧸", "곰인형"], ["🪀", "요요"], ["🎁", "선물"], ["🥁", "북"], ["🪁", "연"], ["🎨", "물감"], ["🧩", "퍼즐"]],
      [["🍦", "아이스크림"], ["🍩", "도넛"], ["🍪", "쿠키"], ["🧁", "컵케이크"], ["🍭", "사탕"], ["🍰", "케이크"], ["🍕", "피자"], ["🍔", "햄버거"], ["🍞", "빵"]],
    ];
    ctx.msSize = () => {
      const n = ctx.row.children.length || 3;
      const W = ctx.body.clientWidth - 24 - 60,
        H = ctx.body.clientHeight;
      const gap = W < 500 ? 10 : 16;
      let per = n,
        s = W / per - gap;
      if (s < 96 && n > 3) {
        per = Math.ceil(n / 2);
        s = W / per - gap;
      }
      // 좁은 세로(폰) 3개: 한 줄이면 92px 안팎 → 2+1 로 (높이에 여유가 있을 때)
      if (n === 3 && s < 110 && H > W * 1.2) {
        per = 2;
        s = W / per - gap;
      }
      s = Math.min(s, 180, (H * 0.46) / Math.ceil(n / per));
      ctx.row.style.setProperty("--ms", Math.floor(s) + "px");
      ctx.row.style.setProperty("--mg", gap + "px");
      ctx.stage.style.setProperty("--ms", Math.floor(s) + "px");
      ctx.row.style.width = per * (s + gap) - gap + "px";
    };
    addEventListener("resize", () => ctx._active && ctx.msSize());
    // 기다리는 동안에도 반응: 보는 중엔 누른 그림이 튀며 이름, 커튼이 닫혀 있으면 🙈 가 "하나, 둘, 셋!"
    ctx.fast(ctx.stage, (e) => {
      const g = ctx.ms;
      if (!g || g.phase === "ask") return;
      if (ctx.stage.classList.contains("closed")) {
        const eb = ctx.eyes.firstChild;
        U.replay(eb, "jump");
        KP.audio.sfx("boing");
        if (g.phase === "closed" && g.shutDone && !g.eyesSaid) {
          g.eyesSaid = true;
          KP.voice.say("하나, 둘, 셋!");
        }
        return;
      }
      const sp = e.target.closest && e.target.closest(".msSpot");
      if (!sp || !sp.dataset.em || !sp.firstChild) return;
      U.replay(sp, "jump");
      KP.audio.note(KP.audio.SCALE[g.spots.indexOf(sp)] || "C6", { inst: "marimba", dur: 0.3, vol: 0.22 });
      if (g.phase === "look") KP.voice.say(sp.dataset.name); // 이름 부르는 중엔 소리만 (호명이 끊기지 않게)
    });
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 6][lv - 1];
    // 1·2단계는 여러 종류를 섞고, 3단계는 같은 종류끼리(더 헷갈림)
    let shown, spare;
    if (lv === 3) {
      const pool = U.shuffle([...U.pick(ctx.POOLS)]);
      shown = pool.slice(0, n);
      spare = pool.slice(n);
    } else if (lv === 2) {
      // 2단계: 두 종류에서 2개씩 (1단계보다 헷갈리고 3단계보다 쉬움)
      const pools = U.sample(ctx.POOLS, 2);
      shown = U.shuffle(pools.flatMap((p) => U.sample(p, 2)));
      spare = U.shuffle(ctx.POOLS.flat().filter((x) => !shown.includes(x)));
    } else {
      const pools = U.sample(ctx.POOLS, n);
      shown = pools.map((p) => U.pick(p));
      spare = U.shuffle(ctx.POOLS.flat().filter((x) => !shown.includes(x)));
    }
    const gone = U.rand(n);
    const goneItem = shown[gone];
    ctx.goneItem = goneItem;
    ctx.stage.classList.remove("closed");
    ctx.ans.classList.add("hide");
    ctx.ans.innerHTML = "";
    ctx.row.innerHTML = "";
    const spots = shown.map(([em, name], k) => {
      const sp = U.el("div", "msSpot");
      const e = KP.Eel(em);
      e.style.setProperty("--i", k);
      sp.appendChild(e);
      sp.dataset.em = em;
      sp.dataset.name = name;
      ctx.row.appendChild(sp);
      return sp;
    });
    ctx.msSize();
    ctx.hint(null);
    const tok = (ctx.msTok = (ctx.msTok || 0) + 1);
    const g = (ctx.ms = { phase: "names", spots, eyesSaid: false });
    const alive = () => ctx._active && ctx.msTok === tok;
    // 열고 첫 판은 긴 안내, 그다음부터는 "잘 봐요!"만
    const quick = ctx.round > 0;
    const intro = ctx.say(quick ? "잘 봐요!" : "잘 봐요! 무엇 무엇이 있나요?");
    // 하나씩 이름 불러 주기 — 첫 안내가 끝난 뒤에 시작 (예전엔 1.7초 뒤 첫 이름이 안내를 끊었음)
    // 둘째 판부터 1·2단계는 이름 없이 통통+소리만 빠르게 (3단계는 비슷한 것끼리라 이름이 도움)
    const names = !quick || lv === 3;
    const STEP = names ? 800 : 420;
    const look = [1000, 900, 1200][lv - 1];
    const run = async () => {
      const t0 = Date.now();
      await Promise.race([intro, ctx.wait(3600)]);
      if (!alive()) return;
      const waited = Date.now() - t0;
      const minW = quick ? 500 : 900;
      if (waited < minW) await ctx.wait(minW - waited);
      for (let k = 0; k < n; k++) {
        if (!alive()) return;
        U.replay(spots[k], "jump");
        A.note(A.SCALE[k] || "C6", { inst: "marimba", dur: 0.3, vol: 0.22 });
        if (names) KP.voice.say(shown[k][1]);
        await ctx.wait(STEP);
      }
      if (!alive()) return;
      g.phase = "look";
      await ctx.wait(look);
      if (!alive()) return;
      g.phase = "closed";
      ctx.stage.classList.add("closed");
      A.sfx("whoosh");
      const shut = KP.voice.say("눈 감아요! 하나, 둘, 셋!");
      shut.then(() => (g.shutDone = true));
      await ctx.wait(700);
      if (!alive()) return;
      hide();
      // 커튼은 1.8초 또는 "하나, 둘, 셋!"이 끝날 때까지 (말이 잘리지 않게, 최대 3초)
      await Promise.all([ctx.wait(1100), Promise.race([shut, ctx.wait(2300)])]);
      if (!alive()) return;
      g.phase = "ask";
      ctx.stage.classList.remove("closed");
      A.sfx("open");
      await ctx.wait(450);
      if (!alive()) return;
      ctx.say("무엇이 없어졌을까요?");
      showChoices();
    };
    const hide = () => {
      // 하나 숨기기
      const sp = spots[gone];
      sp.innerHTML = "";
      if (lv === 1) sp.classList.add("gap");
      if (lv === 3) {
        // 남은 것들 자리 섞기 (빈자리는 맨 끝으로)
        sp.remove();
        const rest = U.shuffle(spots.filter((s) => s !== sp));
        rest.forEach((s) => ctx.row.appendChild(s));
        ctx.row.appendChild(sp);
      }
    };

    const showChoices = () => {
      let opts;
      const present = shown.filter((x) => x !== goneItem);
      if (lv === 1) opts = [goneItem, ...spare.slice(0, 2)];
      else if (lv === 2) opts = [goneItem, U.pick(present), ...spare.slice(0, 2)];
      else opts = [goneItem, ...spare.slice(0, 3)];
      opts = U.shuffle(opts);
      ctx.ans.classList.remove("hide");
      const btns = ctx.choices(ctx.ans, opts, {
        render: ([em]) => KP.E(em),
        right: (v) => v === goneItem,
        wrongMsg: ([em, name]) => {
          if (present.some((p) => p[0] === em)) {
            const s = spots.find((x) => x.dataset.em === em && x.isConnected);
            if (s) U.replay(s, "jump");
            // 말은 "컵케이크! 여기 있어요! 다시 찾아봐요." — 이름(조사 없이)·공용 조각 모두 자연 음성
            KP.voice.say(name + "! 여기 있어요! 다시 찾아봐요.");
            return "";
          }
          return U.pick(["음, 다시 생각해 볼까요?", "아깝다! 무엇이 있었더라?"]);
        },
        onRight: async ([em, name], b) => {
          // 사라졌던 것이 제자리로 돌아오기
          const sp = spots[gone];
          sp.classList.remove("gap");
          const e = KP.Eel(em);
          sp.appendChild(e);
          U.replay(sp, "jump");
          A.sfx("sparkle");
          KP.voice.say("찾았다!");
          ctx.score.add();
          ctx.round++;
          await ctx.wait(1100);
          if (!ctx._active) return;
          const big = ctx.round % 4 === 0;
          // 화면은 "물감이 없어졌었어요!", 말은 "물감! 없어졌었어요!" (이름+조사 조각이 없어 쪼개어 자연 음성)
          const ok = await ctx.win({ big, msg: big ? "{부름} 기억력 대장!" : U.josa(name, "이/가") + " 없어졌었어요!", say: big ? undefined : name + "! 없어졌었어요!" });
          if (ok) this.next(ctx);
        },
      });
      ctx.hint(() => btns.find((b) => b.dataset.right), "무엇이 없어졌을까? 생각나는 걸 눌러요!");
    };
    run();
  },
});
