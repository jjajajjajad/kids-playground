/* 분류하기 — 물건을 끌어서 알맞은 바구니에 나눠 담기
   1단계: 바구니 2개, 물건 4개
   2단계: 바구니 2개, 물건 6개
   3단계: 바구니 3개, 물건 9개
   판마다 주제가 바뀜(동물/과일, 바다/하늘, 빨강/파랑, 큰 것/작은 것, 탈것/먹을 것, 낮/밤 …)
   바구니 위 그림 라벨 + 바구니를 누르면 이름을 말해 줌 */
"use strict";
KP.game({
  id: "sort",
  icon: "🧺",
  name: "분류하기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sort", `
      .soWrap{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:4px 12px 12px;gap:8px}
      .soItems{flex:1;min-height:0;display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:clamp(8px,1.6vw,18px)}
      .soItem{width:var(--is,110px);height:var(--is,110px);display:flex;align-items:center;justify-content:center;font-size:calc(var(--is,110px)*.74);line-height:1;border-radius:26px;background:rgba(255,255,255,.8);box-shadow:0 6px 0 rgba(47,58,102,.12);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*60ms)}
      .soItem.small .e{transform:scale(.55)}
      .soItem.big .e{transform:scale(1.18)}
      .soBaskets{display:flex;justify-content:center;gap:clamp(10px,2.4vw,30px);flex:0 0 auto}
      .soBasket{flex:1 1 0;max-width:340px;min-width:0;display:flex;flex-direction:column;align-items:center;cursor:pointer}
      .soLabel{display:flex;align-items:center;gap:6px;background:#fff;border-radius:999px;padding:4px 14px 4px 6px;box-shadow:0 4px 0 rgba(47,58,102,.12);font-size:clamp(17px,2.4vw,23px);margin-bottom:-12px;position:relative;z-index:2;white-space:nowrap;max-width:100%}
      .soLabel .e{font-size:clamp(34px,4.6vw,48px)}
      .soLabel span{overflow:hidden;text-overflow:ellipsis}
      .soBin{width:100%;height:var(--bh,150px);border-radius:18px 18px 46px 46px;background:repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 10px,transparent 10px 22px),linear-gradient(180deg,var(--bc,#e9a85a),color-mix(in srgb,var(--bc,#e9a85a) 70%,#5a3200));box-shadow:inset 0 10px 0 rgba(255,255,255,.25),0 8px 0 color-mix(in srgb,var(--bc,#e9a85a) 55%,#3a2000);display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;padding:22px 8px 12px;gap:2px;overflow:hidden}
      .soBin .soIn{font-size:var(--inS,44px);line-height:1;animation:popIn .3s;margin:-2px}
      .soBin .soIn.small .e{transform:scale(.6)}
      .soBasket.dropHover{outline:none}
      .soBasket.dropHover .soBin{transform:scale(1.05);filter:brightness(1.08)}
      .soBasket.bigB .soBin{height:calc(var(--bh,150px)*1.12)}
      .soBasket.smallB .soBin{height:calc(var(--bh,150px)*.8);max-width:72%;margin:0 auto}
    `);
    ctx.wrap = U.el("div", "soWrap");
    ctx.items = U.el("div", "soItems");
    ctx.baskets = U.el("div", "soBaskets");
    ctx.wrap.append(ctx.items, ctx.baskets);
    ctx.body.appendChild(ctx.wrap);

    // 주제: 바구니 [라벨 그림, 이름, 바구니 색, [물건들]]
    const B = {
      animal: ["🐾", "동물", "#e9a85a", [["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰"], ["🐼", "판다"], ["🐸", "개구리"], ["🦁", "사자"]]],
      fruit: ["🍎", "과일", "#ef7f6a", [["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"], ["🍑", "복숭아"], ["🍒", "체리"], ["🍊", "귤"]]],
      ride: ["🚦", "탈것", "#7aa7e9", [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚜", "트랙터"], ["🚲", "자전거"], ["🚂", "기차"], ["🚓", "경찰차"]]],
      sea: ["🌊", "바다", "#4aa3df", [["🐳", "고래"], ["🐙", "문어"], ["🦀", "꽃게"], ["🐠", "열대어"], ["🐬", "돌고래"], ["🦈", "상어"], ["🐚", "조개"]]],
      sky: ["☁️", "하늘", "#8fc9f2", [["✈️", "비행기"], ["🚁", "헬리콥터"], ["🎈", "풍선"], ["🦋", "나비"], ["🚀", "로켓"], ["🐦", "새"], ["🪁", "연"]]],
      land: ["🌳", "땅", "#8bc34a", [["🐘", "코끼리"], ["🚗", "자동차"], ["🐄", "소"], ["🦒", "기린"], ["🐢", "거북이"], ["🚜", "트랙터"], ["🐕", "개"]]],
      red: ["🔴", "빨강", "#ef5350", [["🍎", "사과"], ["🍓", "딸기"], ["🚒", "소방차"], ["❤️", "하트"], ["🍒", "체리"], ["🌹", "장미"], ["🍅", "토마토"]]],
      blue: ["🔵", "파랑", "#42a5f5", [["🐳", "고래"], ["💙", "파란 하트"], ["🫐", "블루베리"], ["👖", "청바지"], ["🧢", "모자"], ["🦋", "나비"], ["🧊", "얼음"]]],
      yellow: ["🟡", "노랑", "#fdd835", [["🍌", "바나나"], ["🐥", "병아리"], ["🌻", "해바라기"], ["⭐", "별"], ["🍋", "레몬"], ["🌽", "옥수수"], ["🧀", "치즈"]]],
      day: ["☀️", "낮", "#ffb74d", [["🌻", "해바라기"], ["🌈", "무지개"], ["🕶️", "선글라스"], ["🦋", "나비"], ["⛱️", "파라솔"], ["🐓", "닭"]]],
      night: ["🌙", "밤", "#5c6bc0", [["⭐", "별"], ["🦉", "부엉이"], ["🌃", "밤하늘"], ["🛏️", "침대"], ["🔦", "손전등"], ["🦇", "박쥐"]]],
      food: ["🍽️", "먹을 것", "#ffa726", [["🍞", "빵"], ["🍙", "주먹밥"], ["🍕", "피자"], ["🍦", "아이스크림"], ["🥕", "당근"], ["🍪", "쿠키"], ["🧁", "컵케이크"]]],
    };
    ctx.B = B;
    // 2개짜리 주제, 3개짜리 주제
    ctx.THEMES2 = [["animal", "fruit"], ["sea", "sky"], ["red", "blue"], ["ride", "food"], ["day", "night"], ["SIZE"]];
    ctx.THEMES3 = [["animal", "fruit", "ride"], ["sea", "sky", "land"], ["red", "blue", "yellow"], ["animal", "fruit", "ride"], ["sea", "sky", "land"]];
    ctx.PHRASE = { red: "빨간 건", blue: "파란 건", yellow: "노란 건", day: "낮에 보는 건", night: "밤에 보는 건", sea: "바다에 사는 건", sky: "하늘에 뜨는 건", land: "땅에 있는 건", food: "먹는 건" };
    ctx.SIZE_THINGS = [["🍎", "사과"], ["⚽", "공"], ["🐶", "강아지"], ["🎈", "풍선"], ["🍓", "딸기"], ["🐟", "물고기"], ["🌼", "꽃"], ["🚗", "자동차"]];

    ctx.soSize = () => {
      const n = ctx.items.children.length || 4;
      const W = ctx.body.clientWidth - 24,
        H = ctx.body.clientHeight;
      const bh = U.clamp(H * 0.24, 96, 170);
      ctx.baskets.style.setProperty("--bh", bh + "px");
      const availH = H - bh - 70;
      // 물건이 다 보이게 크기 정하기
      let best = 60;
      for (let cols = 1; cols <= n; cols++) {
        const rows = Math.ceil(n / cols);
        const s = Math.min((W - cols * 14) / cols, (availH - rows * 14) / rows);
        if (s > best) best = s;
      }
      ctx.items.style.setProperty("--is", Math.floor(U.clamp(best, 72, 150)) + "px");
      // 바구니 안 그림 크기: 바구니 폭에 맞춰 (3개가 두 줄 안에 들어가게)
      const bw = ctx.baskets.firstElementChild ? ctx.baskets.firstElementChild.clientWidth : 200;
      ctx.baskets.style.setProperty("--inS", Math.floor(Math.min(bh * 0.32, (bw - 20) / 2.3)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.soSize());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.themeIdx = { 2: KP.u.rand(ctx.THEMES2.length), 3: KP.u.rand(ctx.THEMES3.length) };
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const nb = lv === 3 ? 3 : 2;
    const perB = [2, 3, 3][lv - 1];
    const list = nb === 3 ? ctx.THEMES3 : ctx.THEMES2;
    ctx.themeIdx[nb] = (ctx.themeIdx[nb] + 1) % list.length;
    const theme = list[ctx.themeIdx[nb]];
    // 바구니 정보와 물건 만들기
    let bins, things;
    if (theme[0] === "SIZE") {
      bins = [
        { key: "big", label: "⭐", name: "큰 것", color: "#e9a85a", cls: "bigB", lab: "big" },
        { key: "small", label: "⭐", name: "작은 것", color: "#9ccc65", cls: "smallB", lab: "small" },
      ];
      const picks = U.sample(ctx.SIZE_THINGS, perB);
      things = U.shuffle([...picks.map(([em, name]) => ({ em, name: "큰 " + name, key: "big", cls: "big" })), ...U.shuffle(picks).map(([em, name]) => ({ em, name: "작은 " + name, key: "small", cls: "small" }))]);
    } else {
      const used = new Set();
      bins = theme.map((k) => ({ key: k, label: ctx.B[k][0], name: ctx.B[k][1], color: ctx.B[k][2] }));
      things = [];
      theme.forEach((k) => {
        const pool = ctx.B[k][3].filter(([em]) => !used.has(em) && !theme.some((o) => o !== k && ctx.B[o][3].some(([e2]) => e2 === em)));
        U.sample(pool, perB).forEach(([em, name]) => {
          used.add(em);
          things.push({ em, name, key: k });
        });
      });
      things = U.shuffle(things);
    }
    ctx.bins = bins;
    // 화면
    ctx.items.innerHTML = "";
    ctx.baskets.innerHTML = "";
    const binEls = bins.map((b) => {
      const el = U.el("div", "soBasket " + (b.cls || ""));
      const lab = U.el("div", "soLabel", KP.E(b.label) + "<span>" + b.name + "</span>");
      if (b.lab === "small") lab.querySelector(".e").style.transform = "scale(.6)";
      if (b.lab === "big") lab.querySelector(".e").style.transform = "scale(1.15)";
      const bin = U.el("div", "soBin");
      bin.style.setProperty("--bc", b.color);
      el.append(lab, bin);
      el.dataset.key = b.key;
      ctx.tap(el, () => {
        A.sfx("tap");
        U.replay(el, "jump");
        KP.voice.say(b.name + "!");
      });
      ctx.baskets.appendChild(el);
      return el;
    });
    let left = things.length;
    const els = things.map((t, i) => {
      const el = U.el("div", "soItem " + (t.cls || ""), KP.E(t.em));
      el.style.setProperty("--i", i);
      el.dataset.key = t.key;
      ctx.items.appendChild(el);
      const d = KP.drag(el, {
        targets: () => binEls,
        accept: (b) => b.dataset.key === t.key,
        pad: 16,
        snap: false,
        onPick: () => KP.voice.say(t.name),
        onReject: (b) => {
          const bn = bins.find((x) => x.key === b.dataset.key).name;
          ctx.miss(b, U.pick([U.josa(t.name, "은/는") + " " + U.josa(bn, "이/가") + " 아니에요. 다른 바구니일까?", "음, 다른 바구니에 넣어 볼까요?"]));
        },
        onDrop: (b) => {
          if (!b) return;
          d.lock();
          el.remove();
          const inn = U.el("span", "soIn " + (t.cls || ""), KP.E(t.em));
          b.querySelector(".soBin").appendChild(inn);
          U.replay(b, "jump");
          A.sfx("drop");
          A.note(A.SCALE[Math.min(A.SCALE.length - 1, things.length - left)], { inst: "marimba", dur: 0.3, vol: 0.25 });
          left--;
          if (left === 0) done();
          else setHint();
        },
      });
      return el;
    });
    ctx.soSize();
    const setHint = () => {
      const first = els.find((e) => e.isConnected);
      ctx.hint(() => first, "물건을 끌어서 알맞은 바구니에 넣어요!");
    };
    setHint();
    ctx.say(theme[0] === "SIZE" ? "큰 것은 큰 바구니, 작은 것은 작은 바구니에 넣어요!" : bins.map((b) => (ctx.PHRASE[b.key] || U.josa(b.name, "은/는")) + " " + b.name + " 바구니").join(", ") + "에 넣어요!");
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      binEls.forEach((b, k) => ctx.after(k * 200, () => U.replay(b, "jump")));
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "정리 대장 형아!" : "다 나눴어요!" });
      if (ok) this.next(ctx);
    };
  },
});
