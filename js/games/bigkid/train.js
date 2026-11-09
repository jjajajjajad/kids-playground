/* 숫자 기차 — 기관차 뒤에 숫자 객차를 순서대로 끌어 이어 붙이기
   1단계: 1~3 차례로 잇기 (숫자 + 점 개수 함께 보임)
   2단계: 1~5 차례로 잇기 (숫자 + 점)
          1·2단계 판 셋 중 하나쯤은 앞 칸(1, 또는 1·2)이 이미 붙어 있어 그다음 숫자부터 이어요(시작 숫자 변화, 이을 칸 수는 같음)
   3단계: 1~10 기차에서 빈 칸 4개 채우기 (숫자만, 앞뒤 숫자 보고 추리)
          — 3단계에 처음 들어오면 첫 2판은 디딤판: 1~6 기차에 빈 칸 2개 (점도 보임)
   칸 크기(--cw)는 무대 폭에 맞춰 계산 → 한 줄에 다 들어가게. 너무 좁으면(폰 세로) 반씩 2줄(5+5)로 나눔
   다 이으면 동물 승객이 창문에서 손을 흔들고 기차가 칙칙폭폭 달려 나간다. */
"use strict";
KP.game({
  id: "train",
  icon: "🚂",
  name: "숫자 기차",
  cat: "study",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("train", `
      .trWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 10px 14px;gap:8px;overflow:hidden;--cw:clamp(62px,8.2vw,104px)}
      .trWrap.big{--cw:clamp(76px,13vw,128px)}
      .trTrain.split{justify-content:flex-start}
      .trWrap.tight{padding-left:2px;padding-right:2px}
      .trTrain.split .trCar,.trTrain.split .trSlot{margin:0 1px}
      .trTrain.split .trLoco{font-size:var(--cw);width:var(--cw)}
      .trTrain.split .trLink{left:-4px;width:5px}
      .trTrack{width:100%;display:flex;justify-content:center;position:relative}
      .trTrain{position:relative;z-index:0;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;row-gap:16px;max-width:100%;transition:transform 2.6s cubic-bezier(.55,0,.75,.4)}
      .trTrain.enter{animation:trEnter 1.1s cubic-bezier(.2,.9,.3,1)}
      @keyframes trEnter{from{transform:translateX(70vw)}}
      .trTrain.go{transform:translateX(-140vw)}
      .trUnit{position:relative;padding-bottom:calc(var(--cw)*.2)}
      .trUnit:after{content:"";position:absolute;left:-3px;right:-3px;bottom:2px;height:6px;border-radius:3px;background:#9a7b5b;box-shadow:0 5px 0 #d8c3a4}
      .trLoco{font-size:calc(var(--cw)*1.25);line-height:.9;display:flex;align-items:flex-end;justify-content:center;width:calc(var(--cw)*1.25);margin-right:2px}
      .trLoco .e{transform:scaleX(var(--flip,1))}
      .trTrain.go .trLoco,.trTrain.chug .trLoco{animation:trBob .3s infinite}
      .trTrain.go .trCar,.trTrain.chug .trCar{animation:trBob .3s infinite;animation-delay:calc(var(--k,0)*40ms)}
      @keyframes trBob{50%{transform:translateY(-3px)}}
      .trCar{width:var(--cw);height:calc(var(--cw)*.78);border-radius:14px 14px 8px 8px;position:relative;margin:0 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:inset 0 -6px 0 rgba(0,0,0,.14);background:var(--c,#ff7452)}
      .trCar:before,.trCar:after{content:"";position:absolute;bottom:calc(var(--cw)*-.16);width:calc(var(--cw)*.24);height:calc(var(--cw)*.24);border-radius:50%;background:radial-gradient(circle,#ddd 0 26%,#3b4160 28%);}
      .trCar:before{left:14%}.trCar:after{right:14%}
      .trN{font-size:calc(var(--cw)*.46);line-height:1;text-shadow:0 3px 0 rgba(0,0,0,.18)}
      .trDots{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;max-width:90%;margin-top:2px}
      .trDots i{width:calc(var(--cw)*.1);height:calc(var(--cw)*.1);border-radius:50%;background:#fff;opacity:.95}
      .trLink{position:absolute;left:-7px;top:62%;width:8px;height:5px;background:#555b7a;border-radius:2px}
      .trSlot{width:var(--cw);height:calc(var(--cw)*.78);margin:0 3px;border-radius:14px 14px 8px 8px;border:4px dashed rgba(47,58,102,.3);background:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.42);color:rgba(47,58,102,.35);box-sizing:border-box}
      .trSlot.next{border-color:var(--cat);color:var(--cat);animation:trPulse 1.4s ease-in-out infinite}
      @keyframes trPulse{50%{transform:scale(1.06)}}
      .trCar.fresh{animation:popIn .35s}
      .trPass{position:absolute;left:50%;top:0;transform:translate(-50%,-62%);font-size:calc(var(--cw)*.55);line-height:1;z-index:-1;animation:trPeek .5s backwards cubic-bezier(.2,1.5,.4,1);animation-delay:calc(var(--k,0)*90ms)}
      .trWave{position:absolute;right:-18%;top:-6%;font-size:.5em;transform-origin:70% 90%;animation:trWave .5s ease-in-out infinite alternate}
      @keyframes trPeek{from{transform:translate(-50%,10%)}}
      @keyframes trWave{from{transform:rotate(-20deg)}to{transform:rotate(25deg)}}
      .trTray{display:flex;gap:clamp(10px,2.2vw,22px);justify-content:center;flex-wrap:wrap;align-items:center;min-height:calc(var(--tw)*.8);--tw:clamp(84px,11vw,120px);max-width:min(100%,760px)}
      .trTray .trCar{--cw:var(--tw);margin:0 0 calc(var(--tw)*.16)}
      .trSmoke{position:absolute;font-size:calc(var(--cw)*.5);opacity:0;pointer-events:none;animation:trSmoke 1.2s ease-out forwards}
      @keyframes trSmoke{0%{opacity:.9;transform:translate(0,0) scale(.5)}100%{opacity:0;transform:translate(30px,-80px) scale(1.4)}}
    `);
    ctx.COLORS = ["#ff7452", "#ffb020", "#2fb466", "#2f95f5", "#8a63ee", "#ff5d8f", "#16b5b0", "#f27d2c", "#5c7cfa", "#e8590c"];
    ctx.ANIMALS = ["🐶", "🐱", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐷", "🐸", "🐵", "🦊"];
    ctx.wrap = U.el("div", "trWrap");
    ctx.track = U.el("div", "trTrack");
    ctx.train = U.el("div", "trTrain");
    ctx.track.appendChild(ctx.train);
    ctx.tray = U.el("div", "trTray");
    ctx.wrap.append(ctx.track, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
    // 화면을 돌리면 칸 크기·줄 나눔만 다시 맞춤 (판은 그대로)
    let rt = null;
    addEventListener("resize", () => {
      if (!ctx._active) return;
      if (rt) ctx.cancel(rt);
      rt = ctx.after(250, () => this.fit(ctx));
    });
  },
  /** 칸 크기 맞추기: 기관차 + 칸 total 개가 한 줄에 들어가는 가장 큰 크기. 50px 보다 작아지면 반씩 2줄.
      2줄일 때는 '촘촘' 배치(좌우 여백 10→2px, 칸 사이 6→2px, 기관차 1.25→1칸)로 칸을 키움
      — 폰 세로(390)에서 10칸 기차 칸이 48→56px (끌어 놓기 쉽게) */
  fit(ctx) {
    const total = ctx.total || 0;
    ctx.wrap.classList.remove("tight");
    const W = ctx.track.clientWidth;
    if (!total || !W) return;
    const lv = ctx.level;
    const max = lv === 1 ? 128 : 104;
    // 칸 하나 = cw + 여백 g, 기관차 = L칸 + 2px
    const room = (per, w, g, L) => (w - 8 - per * g) / (per + L);
    let per = total,
      g = 6,
      L = 1.25,
      cw = Math.min(max, room(total, W, g, L));
    if (cw < 50) {
      per = Math.ceil(total / 2);
      g = 2;
      L = 1;
      cw = Math.min(max, room(per, W + 16, g, L)); // tight: 좌우 여백이 8px씩 늘어남
    }
    cw = Math.floor(Math.max(44, cw));
    const split = per < total;
    ctx.wrap.classList.toggle("tight", split);
    ctx.wrap.style.setProperty("--cw", cw + "px");
    ctx.train.classList.toggle("split", split);
    const lw = cw * L + 2;
    ctx.train.style.width = split ? Math.ceil(lw + per * (cw + g)) + 1 + "px" : "";
    // 둘째 줄 첫 칸은 기관차 폭만큼 들여서 윗줄 칸 아래에 맞춤
    (ctx.units || []).forEach((u) => (u.style.marginLeft = split && +u.dataset.n === per + 1 ? lw + "px" : ""));
  },
  start(ctx) {
    ctx.round = 0;
    ctx.l3n = 0; // 3단계 디딤판 판 수 (열 때마다 처음 2판)
    ctx.lastPre = -1; // 열고 첫 판은 늘 1부터
    this.next(ctx);
  },
  car(ctx, n, dots) {
    const U = KP.u;
    const c = U.el("div", "trCar", '<span class="trN">' + n + "</span>" + (dots ? '<span class="trDots">' + "<i></i>".repeat(n) + "</span>" : ""));
    c.style.setProperty("--c", ctx.COLORS[(n - 1) % ctx.COLORS.length]);
    c.dataset.n = n;
    return c;
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const tok = ++ctx.token;
    // 3단계 첫 2판(이번에 연 뒤)은 디딤판: 1~6 에 빈 칸 2개 + 점
    if (lv < 3) ctx.l3n = 0;
    const step = lv === 3 && (ctx.l3n || 0) < 2;
    if (lv === 3) ctx.l3n = (ctx.l3n || 0) + 1;
    const seq = lv < 3; // 차례로 잇기
    // 1·2단계: 가끔 앞 칸이 이미 붙어 있음 → 2(또는 3)부터 이어 붙이기. 연달아 두 번은 안 함
    let pre = 0;
    if (seq && !ctx.lastPre && U.rand(3) === 0) pre = lv === 1 ? 1 : 1 + U.rand(2);
    ctx.lastPre = pre;
    const total = step ? 6 : [3, 5, 10][lv - 1] + pre;
    const dots = lv < 3 || step;
    ctx.wrap.classList.toggle("big", lv === 1);
    ctx.train.style.transition = "none"; // 떠난 자리에서 미끄러져 돌아오지 않게
    ctx.train.className = "trTrain";
    ctx.train.style.transform = "";
    ctx.train.innerHTML = "";
    ctx.tray.innerHTML = "";
    void ctx.train.offsetWidth;
    ctx.train.style.transition = "";
    ctx.train.classList.add("enter");
    A.sfx("whoosh");

    const loco = U.el("div", "trUnit trLoco", KP.E("🚂"));
    ctx.train.appendChild(loco);
    const units = []; // [{n, el(unit), slot|car}]
    let blanks;
    if (seq) blanks = new Set(Array.from({ length: total - pre }, (_, i) => i + 1 + pre));
    else {
      blanks = new Set(U.sample(Array.from({ length: total - 1 }, (_, i) => i + 2), step ? 2 : 4));
    }
    for (let n = 1; n <= total; n++) {
      const u = U.el("div", "trUnit");
      u.style.setProperty("--k", n);
      const inner = blanks.has(n) ? U.el("div", "trSlot", "?") : this.car(ctx, n, dots);
      inner.appendChild(U.el("span", "trLink"));
      u.appendChild(inner);
      u.dataset.n = n;
      units.push(u);
      if (!seq || !blanks.has(n)) ctx.train.appendChild(u);
    }
    ctx.total = total;
    ctx.units = units;
    this.fit(ctx);
    // 차례로 잇기: 다음 칸만 보여 줌
    let nextN = pre + 1;
    const showNext = () => {
      const u = units[nextN - 1];
      if (!u) return;
      ctx.train.appendChild(u);
      u.firstChild.classList.add("next");
    };
    if (seq) showNext();
    else units.forEach((u) => blanks.has(+u.dataset.n) && u.firstChild.classList.add("next"));

    // 앞 칸이 붙어 있는 판: "하나! 둘! 다음은 뭐가 올 차례일까?" — 모두 자연 음성 조각
    const preSay = Array.from({ length: pre }, (_, i) => U.NAT[i + 1] + "!").join(" ") + " 다음은 뭐가 올 차례일까?";
    ctx.say(seq ? (pre ? preSay : "기차 칸을 1부터 순서대로 이어 주세요!") : "빈 칸에 어떤 숫자가 들어갈까요? 기차를 이어 주세요!");
    // 디딤판(끌 것 2개·빈 칸 2개): 첫 카드를 아무 칸에 놓아도 반은 맞고 나머지는 저절로 맞음 → 열쇠 별 없음
    if (step) ctx.fewChoice();

    const openSlots = () => units.filter((u) => u.isConnected && u.firstChild.classList.contains("trSlot"));
    const cars = U.shuffle([...blanks]).map((n, k) => {
      const c = this.car(ctx, n, dots);
      c.classList.add("item");
      c.style.animation = "itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)";
      c.style.animationDelay = 300 + k * 70 + "ms";
      ctx.tray.appendChild(c);
      const d = KP.drag(c, {
        targets: openSlots,
        pad: 30,
        accept: (u) => +u.dataset.n === n,
        onReject: (u) => {
          const want = +u.dataset.n;
          if (seq) {
            // "하나! 둘! 다음은 뭐가 올 차례일까?" — 모두 자연 음성 조각
            const cnt = Array.from({ length: want - 1 }, (_, i) => U.NAT[i + 1] + "!").join(" ");
            ctx.miss(u, want === 1 ? "맨 처음은 1이에요. 1을 찾아볼까?" : cnt + " 다음은 뭐가 올 차례일까?");
          } else {
            // 말로만 나감 → 숫자는 글자로 끊어 말하기(자연 음성 조각): "일곱! 아홉! 빈 칸에 들어갈 숫자를 찾아요!"
            ctx.miss(u, U.NAT[want - 1] + "! " + (want + 1 <= total ? U.NAT[want + 1] + "! 빈 칸에 들어갈 숫자를 찾아요!" : "다음은 뭐가 올 차례일까?"));
          }
        },
        onDrop: (u) => {
          if (!u) return;
          d.lock();
          c.remove();
          const car = this.car(ctx, n, dots);
          car.classList.add("fresh");
          car.appendChild(U.el("span", "trLink"));
          u.innerHTML = "";
          u.appendChild(car);
          A.sfx("snap");
          A.note(A.SCALE[Math.min(n - 1, A.SCALE.length - 1)], { inst: "marimba", dur: 0.4, vol: 0.3 });
          KP.voice.say(U.NAT[n] + "!");
          blanks.delete(n);
          if (seq) {
            nextN++;
            showNext();
          }
          if (!blanks.size) finish();
          else hint();
        },
      });
      return c;
    });
    const hint = () => {
      const want = seq ? nextN : Math.min(...blanks);
      const c = cars.find((x) => +x.dataset.n === want);
      ctx.hint(() => c, seq ? (want === 1 ? "1번 칸을 끌어서 기차 뒤에 붙여요!" : U.NAT[want - 1] + " 다음은 몇일까? 찾아서 붙여요!") : "빈 칸에 들어갈 숫자를 찾아요!");
    };
    hint();

    const finish = async () => {
      ctx.hint(null);
      await ctx.wait(450);
      if (tok !== ctx.token) return;
      // 승객 태우기
      const animals = U.shuffle([...ctx.ANIMALS]);
      units.forEach((u, i) => {
        const car = u.querySelector(".trCar");
        const p = U.el("span", "trPass", KP.E(animals[i % animals.length]) + '<span class="trWave">' + KP.E("👋") + "</span>");
        p.style.setProperty("--k", i);
        car.appendChild(p);
      });
      A.sfx("pop");
      // 다 함께 세기 (1~5까지만 빠르게 세고, 10칸이면 마지막 숫자만)
      ctx.say("칙칙폭폭! 친구들이 탔어요. 출발!");
      await ctx.wait(1600);
      if (tok !== ctx.token) return;
      // 기적 소리 + 출발
      A.tone(660, { dur: 0.45, vol: 0.16, type: "triangle" });
      A.tone(830, { dur: 0.45, vol: 0.12, type: "triangle", when: 0.02 });
      ctx.train.classList.add("chug");
      let k = 0;
      const steam = ctx.every(260, () => {
        A.noise({ dur: 0.12, vol: 0.06 + (k % 2) * 0.03, bp: 700, q: 1 });
        k++;
        if (k % 3 === 0) {
          const r = loco.getBoundingClientRect(),
            w = ctx.wrap.getBoundingClientRect();
          const s = U.el("span", "trSmoke", KP.E("☁️"));
          s.style.left = r.left - w.left + r.width * 0.3 + "px";
          s.style.top = r.top - w.top - 10 + "px";
          ctx.wrap.appendChild(s);
          ctx.after(1300, () => s.remove());
        }
      });
      await ctx.wait(700);
      if (tok !== ctx.token) return;
      ctx.train.classList.add("go");
      KP.voice.say("칙칙폭폭! 칙칙폭폭!");
      await ctx.wait(2400);
      ctx.cancel(steam);
      if (tok !== ctx.token) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 기관사 최고!" : "기차 완성!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});
