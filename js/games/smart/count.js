/* 숫자 세기 — 하나씩 눌러 세고, 알맞은 숫자 고르기
   1단계: 2~4개 / 2단계: 1~5개 / 3단계: 3~10개(보기 4개) — 앞 판과 같은 개수·같은 그림은 피함
   3단계 판 둘 중 하나는 '흩어진 그림'(줄 맞춤 대신 여기저기) → 어디까지 셌는지 기억하는 게 진짜 과제 */
"use strict";
KP.game({
  id: "count",
  icon: "🔢",
  name: "숫자 세기",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("count", `
      .countTile{position:relative;background:#fff;border-radius:26px;padding:12px;box-shadow:0 6px 0 rgba(47,58,102,.12);font-size:clamp(46px,7.5vw,84px);line-height:1}
      .countTile[data-n]{background:#fff8d6;box-shadow:0 6px 0 #f1cf5b}
      .countBadge{position:absolute;top:-10px;right:-10px;min-width:38px;height:38px;border-radius:50%;background:var(--coral);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:popBig .4s}
      /* 흩어진 판(3단계): 칸 안에서 자리를 잡아 겹치지 않게 (scatter) */
      .countItems.scat{position:relative;display:block;width:100%;max-width:none!important;flex:1;min-height:0}
      .countItems.scat .countTile{position:absolute;font-size:var(--ts);padding:calc(var(--ts) * .14)}
      /* 폰 가로(낮은 화면): 타일을 높이 기준으로 줄여 8~10개도 한 줄에 — 위로 잘리거나 보기와 겹치지 않게 */
      @media (max-height:500px) and (min-aspect-ratio:1/1){.qStage .countTile{font-size:clamp(36px,12vh,70px);padding:9px;border-radius:20px}.countItems{padding-top:14px}.countBadge{top:-8px;right:-8px;min-width:32px;height:32px;font-size:20px}}
    `);
    ctx.items = U.el("div", "qStage countItems");
    ctx.ans = U.el("div", "qAns");
    ctx.body.append(ctx.items, ctx.ans);
    // 흩어진 판에서 화면을 돌리면 자리를 다시 잡음 (예전 자리 그대로면 화면 밖으로 나감)
    const self = this;
    addEventListener("resize", () => ctx._active && ctx.scatTiles && ctx.items.classList.contains("scat") && requestAnimationFrame(() => self.scatter(ctx, ctx.scatTiles)));
    ctx.THINGS = [
      ["🍎", "사과"], ["🍌", "바나나"], ["🐟", "물고기"], ["🚗", "자동차"], ["🌼", "꽃"], ["🍪", "쿠키"],
      ["🐥", "병아리"], ["⚽", "공"], ["🦆", "오리"], ["🍓", "딸기"], ["🦋", "나비"], ["⭐", "별"],
    ];
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
    const [lo, hi, nChoice] = lv === 1 ? [2, 4, 3] : lv === 2 ? [1, 5, 3] : [3, 10, 4];
    let answer = lo + U.rand(hi - lo + 1);
    if (answer === ctx.lastA) answer = answer === hi ? lo : answer + 1; // 앞 판과 같은 개수 피하기
    ctx.lastA = answer;
    const thing = U.pick(ctx.THINGS.filter((t) => t !== ctx.lastThing));
    ctx.lastThing = thing;
    const [em, name] = thing;
    if (lv === 3) ctx.l3 = (ctx.l3 || 0) + 1;
    const scat = lv === 3 && ctx.l3 % 2 === 0 && answer >= 4; // 흩어진 그림 판
    let counted = 0,
      busy = false;

    ctx.say(U.josa(name, "이/가") + " 몇 개일까요? 하나씩 눌러서 세어 봐요!");
    ctx.items.innerHTML = "";
    const low = innerHeight <= 500 && innerWidth >= innerHeight;
    ctx.items.style.maxWidth = low ? "none" : answer > 5 ? "900px" : "760px";
    ctx.items.style.margin = "0 auto";
    ctx.items.classList.toggle("scat", scat);
    const tiles = [];
    for (let i = 0; i < answer; i++) {
      const t = U.el("button", "item countTile", KP.E(em));
      t.style.setProperty("--i", i);
      t.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (t.dataset.n || busy) return;
        counted++;
        t.dataset.n = counted;
        t.appendChild(U.el("span", "countBadge", counted));
        U.replay(t, "jump");
        A.note(A.SCALE[Math.min(counted - 1, A.SCALE.length - 1)], { inst: "marimba", dur: 0.4, vol: 0.3 });
        KP.voice.say(U.NAT[counted] || String(counted));
        if (counted === answer) ctx.after(700, () => KP.voice.say("모두 몇 개예요?"));
        hint();
      });
      tiles.push(t);
      ctx.items.appendChild(t);
    }

    ctx.scatTiles = scat ? tiles : null;
    if (scat) this.scatter(ctx, tiles);
    // 보기
    // 정답 근처 수 중에서 보기 고르기 (정답 10처럼 근처 수가 모자라면 아래로 넓혀 채움 — 무한 반복 방지)
    const opts = new Set([answer]);
    const near = U.shuffle([-2, -1, 1, 2, 3].map((d) => answer + d).filter((v) => v >= 1 && v <= Math.max(hi, 5)));
    for (const v of near) if (opts.size < nChoice) opts.add(v);
    for (let v = answer - 3; opts.size < nChoice && v >= 1; v--) opts.add(v);
    ctx.ans.innerHTML = "";
    const btns = U.shuffle([...opts]).map((n, i) => {
      const b = U.el("button", "choice num", String(n));
      b.style.setProperty("--i", i);
      b.dataset.v = n;
      b.addEventListener("click", async () => {
        if (busy) return;
        KP.audio.unlock();
        if (n === answer) {
          busy = true;
          b.classList.add("right");
          // 하나씩 다 세기 전에 숫자를 찍어 맞힌 판은 열쇠 별 제외 (1단계는 보기 3개라 찍어도 1/3) — 축하·단계는 그대로
          if (counted < answer) ctx._softMiss = (ctx._softMiss || 0) + 2;
          ctx.score.add();
          tiles.forEach((t, k) => ctx.after(k * 70, () => U.replay(t, "jump")));
          ctx.round++;
          const big = ctx.round % 5 === 0;
          const CNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
          const ok = await ctx.win({ big, msg: big ? "{부름} 숫자 박사!" : (CNT[answer] || answer) + " 개! 딩동댕!" });
          if (ok) this.next(ctx);
        } else {
          ctx.miss(b, counted < answer ? "하나씩 눌러서 같이 세어 볼까?" : "다시 세어 볼까요?");
        }
      });
      ctx.ans.appendChild(b);
      return b;
    });

    const hint = () =>
      ctx.hint(() => tiles.find((t) => !t.dataset.n) || btns.find((b) => +b.dataset.v === answer), counted < answer ? "하나씩 눌러서 세어 봐요!" : "몇 개였지? 숫자를 눌러요!");
    hint();
  },
  /** 흩어진 배치: 칸(격자)마다 하나씩, 칸 안에서 조금씩 비켜 — 겹치지 않게. 빈 칸도 섞여 줄이 안 보임 */
  scatter(ctx, tiles) {
    const U = KP.u;
    const box = ctx.items;
    const W = box.clientWidth,
      H = box.clientHeight;
    if (!W || !H) return;
    const n = tiles.length;
    let cols = Math.max(2, Math.round(Math.sqrt(((n + 2) * W) / H)));
    let rows = Math.ceil((n + 2) / cols);
    const cw = W / cols,
      ch = H / rows;
    // 그림 크기: 칸보다 작게(배지 자리까지), 너무 작지 않게
    const ts = Math.round(Math.min(Math.min(cw, ch) * 0.52, 84));
    // 작은 화면(360×640 등)에서 타일이 64px 보다 작아지면 흩어진 판 대신 보통 줄 배치
    if (ts * 1.28 < 64) {
      box.classList.remove("scat");
      return;
    }
    box.style.setProperty("--ts", ts + "px");
    const tw = ts * 1.28; // 타일 한 변(여백 포함)
    const jx = Math.max(0, (cw - tw) / 2 - 6),
      jy = Math.max(0, (ch - tw) / 2 - 10);
    const cells = U.shuffle([...Array(cols * rows).keys()]).slice(0, n);
    tiles.forEach((t, i) => {
      const c = cells[i];
      const x = ((c % cols) + 0.5) * cw + U.randf(-jx, jx),
        y = (Math.floor(c / cols) + 0.5) * ch + U.randf(-jy, jy) + 6;
      t.style.left = Math.round(x - tw / 2) + "px"; // 가운데 기준(transform 은 튀는 연출이 씀)
      t.style.top = Math.round(y - tw / 2) + "px";
    });
  },
});
