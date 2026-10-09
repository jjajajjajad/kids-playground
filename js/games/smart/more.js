/* 많은 쪽 찾기 — 접시 두 개 중 많은 쪽/적은 쪽을 골라요. 맞히면 접시 위 과일이 하나씩 폴짝 뛰며 함께 세어요.
   1단계: 확 차이 나는 두 접시 중 "많은 쪽" / 2단계: 1~2개 차이, 많은 쪽·적은 쪽
   3단계: 위 접시와 "같은 개수" 찾기(접시 3개) 또는 1개 차이(최대 9개) */
"use strict";
KP.game({
  id: "more",
  icon: "🍎",
  name: "많은 쪽 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("more", `
      .mrWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,26px);padding:4px 10px 20px}
      .mrRef{display:none;flex-direction:column;align-items:center;gap:4px}
      .mrRef.on{display:flex}
      .mrRef .mrPlate{--ps:var(--rs);cursor:default;box-shadow:0 6px 0 rgba(47,58,102,.12),0 0 0 6px #ffe7a3}
      .mrRow{--ps:var(--psl);display:flex;gap:clamp(12px,4vw,60px);justify-content:center;align-items:center}
      @media (max-aspect-ratio:1/1){.mrRow{--ps:var(--psp)}.mrRef .mrPlate{--ps:var(--rsp)}}
      .mrPlate{position:relative;width:var(--ps);height:var(--ps);min-width:0;min-height:0;padding:0;border-radius:50%;
        background:radial-gradient(circle,#fff 0 58%,#eef2fb 60% 66%,#fff 68%);box-shadow:0 8px 0 rgba(47,58,102,.14)}
      .mrPlate.right{background:radial-gradient(circle,#efffef 0 58%,#c9f2d4 60% 66%,#efffef 68%)}
      .mrIt{position:absolute;width:var(--is);height:var(--is);margin:calc(var(--is) / -2) 0 0 calc(var(--is) / -2);font-size:var(--is);line-height:1}
      .mrIt .e{display:block;width:100%;height:100%}
      .mrIt.jump{animation:jumpA .45s}
      .mrCnt{position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);min-width:48px;height:48px;border-radius:24px;padding:0 10px;background:var(--coral);color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:popBig .35s}
    `);
    ctx.wrap = U.el("div", "mrWrap");
    ctx.ref = U.el("div", "mrRef");
    ctx.row = U.el("div", "mrRow");
    ctx.wrap.append(ctx.ref, ctx.row);
    ctx.body.appendChild(ctx.wrap);
    ctx.THINGS = [["🍎", "사과"], ["🍓", "딸기"], ["🍪", "쿠키"], ["🍊", "귤"], ["🍩", "도넛"], ["🍇", "포도"], ["🍒", "체리"], ["🧁", "컵케이크"], ["🍌", "바나나"], ["🍑", "복숭아"]];
    ctx.CNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 접시 안 그림 배치 (0~1 좌표) */
  layout(n) {
    const U = KP.u;
    const pts = [];
    const rot = U.randf(0, Math.PI * 2);
    if (n === 1) pts.push([0.5, 0.5]);
    else if (n <= 6) {
      const r = n <= 3 ? 0.2 : 0.25;
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * Math.PI * 2;
        pts.push([0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]);
      }
    } else {
      pts.push([0.5, 0.5]);
      for (let i = 0; i < n - 1; i++) {
        const a = rot + (i / (n - 1)) * Math.PI * 2;
        pts.push([0.5 + Math.cos(a) * 0.29, 0.5 + Math.sin(a) * 0.29]);
      }
    }
    return pts;
  },
  /** 접시 하나. 크기 착시가 없도록 한 판의 모든 접시는 같은 그림 크기(가장 많은 접시 기준) */
  plate(n, em, maxN) {
    const m = maxN || n;
    const is = m <= 3 ? 0.27 : m <= 6 ? 0.22 : 0.17;
    let h = "";
    this.layout(n).forEach(([x, y], i) => {
      h += '<span class="mrIt" style="left:' + (x * 100).toFixed(1) + "%;top:" + (y * 100).toFixed(1) + "%;--is:calc(var(--ps) * " + is + ')">' + KP.E(em) + "</span>";
    });
    return h;
  },
  /** 접시 위 그림을 하나씩 세기 */
  countUp(ctx, b, n) {
    const U = KP.u;
    [...b.querySelectorAll(".mrIt")].forEach((it, i) =>
      ctx.after(i * 260, () => {
        U.replay(it, "jump");
        KP.audio.note(KP.audio.SCALE[Math.min(i, 11)], { inst: "marimba", dur: 0.3, vol: 0.26 });
      })
    );
    ctx.after(n * 260 + 100, () => b.appendChild(U.el("span", "mrCnt", n)));
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    let [em, name] = U.pick(ctx.THINGS);
    const C = ctx.CNT;
    const same = lv === 3 && U.rand(2) === 0;
    ctx.ref.classList.toggle("on", same);
    ctx.wrap.style.setProperty("--psl", same ? "clamp(110px,min(22vw,32vh),220px)" : "clamp(150px,min(34vw,52vh),360px)");
    ctx.wrap.style.setProperty("--psp", same ? "clamp(96px,30vw,140px)" : "clamp(140px,44vw,200px)");
    ctx.wrap.style.setProperty("--rs", "clamp(110px,min(22vw,26vh),200px)");
    ctx.wrap.style.setProperty("--rsp", "clamp(110px,40vw,170px)");
    let list, target, ask, wrongMsg, rightMsg;
    if (same) {
      const r = 1 + U.rand(5);
      const opts = new Set([r]);
      while (opts.size < 3) opts.add(U.clamp(r + U.pick([-2, -1, 1, 2]), 1, 6));
      list = U.shuffle([...opts]);
      target = r;
      ctx.ref.innerHTML = '<div class="mrPlate">' + this.plate(r, em, Math.max(...list)) + "</div>";
      ask = "위 접시랑 똑같은 개수를 찾아요!";
      wrongMsg = (n) => "이 접시는 " + C[n] + " 개예요. 위 접시를 세어 봐요!";
      rightMsg = (n) => "똑같이 " + C[n] + " 개! 딩동댕!";
    } else {
      let a, b;
      if (lv === 1) {
        a = 1 + U.rand(2);
        b = a + 3 + U.rand(2);
      } else if (lv === 2) {
        a = 1 + U.rand(5);
        b = a + 1 + U.rand(2);
      } else {
        a = 3 + U.rand(6);
        b = a + 1;
      }
      const many = lv === 1 || U.rand(2) === 0;
      list = U.shuffle([a, b]);
      target = many ? b : a;
      const word = many ? "많은" : "적은";
      ask = U.josa(name, "이/가") + " 더 " + word + " 접시를 찾아요!";
      wrongMsg = (n) => "이 접시는 " + C[n] + " 개예요. 더 " + word + " 쪽을 찾아봐요!";
      rightMsg = (n) => name + " " + C[n] + " 개! 이쪽이 더 " + (many ? "많아요" : "적어요") + "!";
    }
    ctx.say((same ? "🟰 " : "🍽️ ") + ask);
    const btns = ctx.choices(ctx.row, list, {
      cls: "mrPlate",
      render: (n) => this.plate(n, em, Math.max(...list)),
      right: (n) => n === target,
      wrongMsg,
      onRight: async (n, b) => {
        self.countUp(ctx, b, n);
        ctx.after(n * 260 + 200, () => KP.voice.say(rightMsg(n)));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(n * 260 + 1600);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "세기 대장 형아!" : "딩동댕!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});
