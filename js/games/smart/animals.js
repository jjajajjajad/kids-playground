/* 동물 소리 — 동물 카드를 누르면 동물이 움직이며 이름과 울음소리를 들려줘요. (자유 탐색, 퀴즈 아님)
   위쪽 버튼으로 사는 곳(농장/정글/바다/하늘)별로 나눠 보기. 한 곳의 친구들을 모두 만나면 큰 축하.
   동물 목록·합성 울음소리는 KP.smartAnimals 로 공개 → 소리 듣고 찾기(listen)·먹이 주기(feed)에서도 사용 */
"use strict";
(function (KP) {
  const A = () => KP.audio;
  const T = (f, o) => A().tone(f, o);
  const N = (o) => A().noise(o);
  /* 합성 울음소리 (부드러운 sine/triangle + 걸러낸 잡음) */
  const CRY = {
    bark: () => [0, 0.24].forEach((w) => { T(560, { to: 300, dur: 0.13, type: "triangle", vol: 0.3, when: w }); N({ bp: 900, q: 2, dur: 0.08, vol: 0.18, when: w }); }),
    meow: () => { T(560, { to: 880, dur: 0.2, type: "triangle", vol: 0.2 }); T(880, { to: 480, dur: 0.38, type: "triangle", vol: 0.2, when: 0.19 }); },
    moo: () => { T(150, { to: 112, dur: 1.0, type: "triangle", vol: 0.4, attack: 0.12 }); T(300, { to: 224, dur: 0.9, vol: 0.08, attack: 0.12 }); },
    oink: () => [0, 0.2].forEach((w) => { N({ bp: 480, q: 4, dur: 0.13, vol: 0.4, when: w }); T(240, { to: 170, dur: 0.12, type: "triangle", vol: 0.16, when: w }); }),
    rooster: () => [[640, 820, 0], [820, 1000, 0.14], [1000, 1180, 0.28], [1180, 760, 0.42]].forEach(([a, b, w], i) => T(a, { to: b, dur: i === 3 ? 0.45 : 0.13, type: "triangle", vol: 0.2, when: w })),
    chick: () => [0, 0.13, 0.42, 0.55].forEach((w) => T(2300, { to: 2900, dur: 0.08, vol: 0.18, when: w })),
    quack: () => [0, 0.22].forEach((w) => { N({ bp: 1300, q: 5, dur: 0.13, vol: 0.32, when: w }); T(420, { to: 360, dur: 0.12, type: "triangle", vol: 0.12, when: w }); }),
    neigh: () => { for (let i = 0; i < 9; i++) T(i % 2 ? 1150 : 980, { to: i % 2 ? 1000 : 1100, dur: 0.07, type: "triangle", vol: 0.14 * (1 - i / 12), when: i * 0.065 }); },
    baa: () => { for (let i = 0; i < 8; i++) T(i % 2 ? 360 : 390, { dur: 0.08, type: "triangle", vol: 0.2, when: i * 0.07 }); },
    roar: () => { N({ lp: 650, dur: 1.0, vol: 0.45, attack: 0.12 }); T(130, { to: 78, dur: 1.0, type: "triangle", vol: 0.3, attack: 0.1 }); },
    trumpet: () => { T(330, { to: 720, dur: 0.45, type: "triangle", vol: 0.28, attack: 0.05 }); T(720, { to: 560, dur: 0.5, type: "triangle", vol: 0.24, when: 0.44 }); },
    monkey: () => [0, 0.11, 0.22, 0.33].forEach((w, i) => T(620 + i * 60, { to: 1050 + i * 60, dur: 0.08, type: "triangle", vol: 0.2, when: w })),
    yawn: () => T(320, { to: 140, dur: 1.0, type: "triangle", vol: 0.3, attack: 0.15 }),
    snap: () => [0, 0.3].forEach((w) => { N({ hp: 1800, dur: 0.05, vol: 0.4, when: w }); T(180, { to: 90, dur: 0.12, vol: 0.3, when: w }); }),
    hiss: () => N({ hp: 4200, dur: 1.0, vol: 0.16, attack: 0.25 }),
    parrot: () => [0, 0.3].forEach((w) => { T(1100, { to: 1600, dur: 0.1, type: "triangle", vol: 0.16, when: w }); T(1600, { to: 1000, dur: 0.12, type: "triangle", vol: 0.16, when: w + 0.1 }); }),
    spout: () => { N({ bp: 500, bpTo: 2600, q: 0.8, dur: 1.1, vol: 0.3, attack: 0.1 }); T(110, { to: 70, dur: 0.9, vol: 0.2, attack: 0.2 }); },
    dolphin: () => { for (let i = 0; i < 6; i++) T(1800 + i * 90, { to: 2700, dur: 0.06, vol: 0.14, when: i * 0.08 }); },
    chomp: () => [0, 0.28].forEach((w) => { A().kick({ vol: 0.35, when: w }); N({ hp: 1500, dur: 0.06, vol: 0.25, when: w }); }),
    bubble: () => { for (let i = 0; i < 5; i++) T(420 + Math.random() * 300, { to: 1500, dur: 0.11, vol: 0.2, when: i * 0.13 }); },
    snip: () => [0, 0.18, 0.5, 0.68].forEach((w) => { N({ hp: 3500, dur: 0.03, vol: 0.3, when: w }); A().note("A5", { inst: "marimba", dur: 0.1, vol: 0.12, when: w }); }),
    slow: () => ["C3", "E3", "C3", "E3"].forEach((n, i) => A().note(n, { inst: "marimba", dur: 0.4, vol: 0.35, when: i * 0.32 })),
    seal: () => [0, 0.3].forEach((w) => T(520, { to: 330, dur: 0.22, type: "triangle", vol: 0.25, when: w })),
    waddle: () => ["E4", "C4", "E4", "C4", "G4"].forEach((n, i) => A().note(n, { inst: "marimba", dur: 0.2, vol: 0.25, when: i * 0.15 })),
    screech: () => { T(2100, { to: 1300, dur: 0.6, type: "triangle", vol: 0.16 }); N({ hp: 3000, dur: 0.5, vol: 0.08 }); },
    hoot: () => [0, 0.45].forEach((w) => T(430, { to: 380, dur: 0.35, vol: 0.32, attack: 0.05, when: w })),
    tweet: () => [0, 0.09, 0.3, 0.39].forEach((w) => T(3000, { to: 3700, dur: 0.06, vol: 0.12, when: w })),
    coo: () => [0, 0.32, 0.64].forEach((w) => { T(290, { to: 350, dur: 0.14, vol: 0.28, when: w }); T(350, { to: 280, dur: 0.16, vol: 0.28, when: w + 0.14 }); }),
    buzz: () => { for (let i = 0; i < 22; i++) T(i % 2 ? 175 : 195, { dur: 0.05, type: "triangle", vol: 0.16, when: i * 0.04 }); },
    flutter: () => { for (let i = 0; i < 7; i++) N({ hp: 2500, dur: 0.05, vol: 0.06, when: i * 0.1 }); A().sfx("sparkle"); },
    squeak: () => [0, 0.15, 0.3].forEach((w) => T(2600, { to: 3100, dur: 0.06, vol: 0.12, when: w })),
    hop: () => [0, 0.3].forEach((w) => T(220, { to: 660, dur: 0.2, type: "triangle", vol: 0.2, when: w })),
    tall: () => ["C5", "E5", "G5", "C6"].forEach((n, i) => A().note(n, { inst: "bell", dur: 0.4, vol: 0.18, when: i * 0.12 })),
  };
  /* [그림, 이름, 사는 곳, 울음(말), 합성 소리, 소리 듣고 찾기에 쓸 수 있나] */
  const LIST = [
    ["🐶", "강아지", "farm", "멍멍!", "bark", 1], ["🐱", "고양이", "farm", "야옹!", "meow", 1], ["🐮", "소", "farm", "음메!", "moo", 1],
    ["🐷", "돼지", "farm", "꿀꿀!", "oink", 1], ["🐔", "닭", "farm", "꼬끼오!", "rooster", 1], ["🐤", "병아리", "farm", "삐약삐약!", "chick", 1],
    ["🦆", "오리", "farm", "꽥꽥!", "quack", 1], ["🐴", "말", "farm", "히히힝!", "neigh", 1], ["🐑", "양", "farm", "메에에!", "baa", 1],
    ["🐰", "토끼", "farm", "깡충깡충!", "hop", 0],
    ["🦁", "사자", "jungle", "어흥!", "roar", 1], ["🐯", "호랑이", "jungle", "어흥!", "roar", 0], ["🐘", "코끼리", "jungle", "뿌우우!", "trumpet", 1],
    ["🐵", "원숭이", "jungle", "우끼끼!", "monkey", 1], ["🦒", "기린", "jungle", "목이 길어요!", "tall", 0], ["🦓", "얼룩말", "jungle", "줄무늬가 있어요!", "neigh", 0],
    ["🦛", "하마", "jungle", "하아암! 입이 커요!", "yawn", 0], ["🐊", "악어", "jungle", "쩍! 쩍!", "snap", 0], ["🐍", "뱀", "jungle", "쉬이익!", "hiss", 1],
    ["🦜", "앵무새", "jungle", "안녕! 안녕!", "parrot", 0],
    ["🐳", "고래", "sea", "푸우! 물을 뿜어요!", "spout", 0], ["🐬", "돌고래", "sea", "끼익끼익!", "dolphin", 1], ["🦈", "상어", "sea", "덥석!", "chomp", 0],
    ["🐙", "문어", "sea", "다리가 여덟 개!", "bubble", 0], ["🦀", "꽃게", "sea", "싹둑싹둑!", "snip", 0], ["🐠", "열대어", "sea", "뻐끔뻐끔!", "bubble", 0],
    ["🐢", "거북이", "sea", "엉금엉금!", "slow", 0], ["🦭", "물범", "sea", "아우! 아우!", "seal", 0], ["🐧", "펭귄", "sea", "뒤뚱뒤뚱!", "waddle", 0],
    ["🦅", "독수리", "sky", "끼이약!", "screech", 0], ["🦉", "부엉이", "sky", "부엉부엉!", "hoot", 1], ["🐦", "참새", "sky", "짹짹!", "tweet", 1],
    ["🕊️", "비둘기", "sky", "구구구!", "coo", 1], ["🐝", "꿀벌", "sky", "윙윙!", "buzz", 1], ["🦋", "나비", "sky", "팔랑팔랑!", "flutter", 0],
    ["🦇", "박쥐", "sky", "찍찍!", "squeak", 0],
  ];
  KP.smartAnimals = {
    LIST,
    HABITATS: [
      { k: "all", n: "모두", e: "🌍", c: "#ffffff" },
      { k: "farm", n: "농장", e: "🚜", c: "#e6f7d4" },
      { k: "jungle", n: "정글", e: "🌴", c: "#d3f1dc" },
      { k: "sea", n: "바다", e: "🌊", c: "#d6ecff" },
      { k: "sky", n: "하늘", e: "☁️", c: "#eaf3ff" },
    ],
    cry(key) {
      if (!A().ctx()) return;
      try {
        (CRY[key] || CRY.tall)();
      } catch (e) {}
    },
  };
})(window.KP);

KP.game({
  id: "animals",
  icon: "🐶",
  name: "동물 소리",
  cat: "smart",
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      Z = KP.smartAnimals;
    KP.css("animals", `
      .anTabs{display:flex;gap:clamp(6px,1.2vw,12px);justify-content:center;padding:2px 10px 8px;flex:0 0 auto;flex-wrap:nowrap}
      .anTab{flex:1 1 0;max-width:130px;min-width:0;min-height:72px;justify-content:center;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:clamp(15px,2.2vw,22px);
        background:rgba(255,255,255,.7);border-radius:20px;padding:6px clamp(8px,1.6vw,18px);border-bottom:5px solid transparent;transition:transform .15s}
      .anTab .e{font-size:clamp(30px,4.4vw,44px)}
      .anTab.sel{background:#fff;border-bottom-color:var(--cat);transform:translateY(-2px);box-shadow:var(--shadow)}
      .anGrid{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(104px,15vw,150px),1fr));
        gap:clamp(14px,2vw,20px) clamp(10px,1.8vw,18px);padding:18px clamp(10px,2vw,22px) 26px;align-content:start;border-radius:28px 28px 0 0;transition:background .3s}
      .anCard{position:relative;background:#fff;border-radius:24px;padding:12px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;
        box-shadow:0 6px 0 rgba(47,58,102,.12);font-size:clamp(17px,2.2vw,21px);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i)*25ms)}
      .anCard:active{transform:translateY(4px)}
      .anCard .anEm{font-size:clamp(56px,8vw,82px);line-height:1;display:block}
      .anCard.met::after{content:"";position:absolute;top:8px;right:8px;width:14px;height:14px;border-radius:50%;background:var(--sun);box-shadow:0 2px 0 #d9a000}
      .anSay{position:absolute;left:50%;top:-14px;transform:translateX(-50%);background:var(--coral);color:#fff;white-space:nowrap;font-size:clamp(16px,2.2vw,22px);
        padding:4px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.15);animation:anSay 1.6s forwards;pointer-events:none;z-index:2}
      @keyframes anSay{0%{transform:translate(-50%,10px) scale(.4);opacity:0}15%{transform:translate(-50%,-6px) scale(1.1);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-20px);opacity:0}}
      .anGo-farm .anEm{animation:anHop .8s}
      @keyframes anHop{20%{transform:translateY(-26px) rotate(-6deg)}40%{transform:translateY(0) scale(1.1,.9)}60%{transform:translateY(-16px) rotate(6deg)}80%{transform:translateY(0)}}
      .anGo-jungle .anEm{animation:anRoar .9s}
      @keyframes anRoar{15%{transform:scale(1.3) rotate(-8deg)}30%{transform:scale(1.3) rotate(8deg)}45%{transform:scale(1.3) rotate(-8deg)}60%{transform:scale(1.3) rotate(6deg)}100%{transform:none}}
      .anGo-sea .anEm{animation:anSwim 1.1s ease-in-out}
      @keyframes anSwim{25%{transform:translateX(-22px) rotate(-10deg)}50%{transform:translateX(22px) translateY(-8px) rotate(10deg)}75%{transform:translateX(-12px) rotate(-6deg)}}
      .anGo-sky .anEm{animation:anFly 1.1s ease-in-out}
      @keyframes anFly{25%{transform:translate(-14px,-30px) rotate(-12deg)}50%{transform:translate(14px,-46px) rotate(12deg)}75%{transform:translate(-6px,-20px) rotate(-6deg)}}
    `);
    ctx.tabs = U.el("div", "anTabs");
    ctx.grid = U.el("div", "anGrid");
    ctx.body.append(ctx.tabs, ctx.grid);
    ctx.tabBtns = Z.HABITATS.map((h) => {
      const b = U.btn(KP.E(h.e) + "<span>" + h.n + "</span>", "anTab");
      b.dataset.k = h.k;
      ctx.tap(b, () => {
        KP.audio.sfx("select");
        U.replay(b, "pop");
        this.show(ctx, h.k);
        KP.voice.say(h.k === "all" ? "동물 친구들 모두!" : h.n + "에 사는 친구들!");
      });
      ctx.tabs.appendChild(b);
      return b;
    });
  },
  start(ctx) {
    ctx.met = new Set();
    ctx.done = new Set();
    ctx.say("🐾 동물 친구를 눌러 봐요! 무슨 소리가 날까요?");
    this.show(ctx, "all");
  },
  show(ctx, k) {
    const U = KP.u,
      Z = KP.smartAnimals;
    ctx.hab = k;
    ctx.tabBtns.forEach((b) => b.classList.toggle("sel", b.dataset.k === k));
    const h = Z.HABITATS.find((x) => x.k === k);
    ctx.grid.style.background = k === "all" ? "transparent" : h.c;
    ctx.grid.innerHTML = "";
    ctx.grid.scrollTop = 0;
    const list = Z.LIST.filter((a) => k === "all" || a[2] === k);
    const cards = list.map((a, i) => {
      const [em, name, hab, cry, snd] = a;
      const c = U.btn('<span class="anEm">' + KP.E(em) + "</span><span>" + name + "</span>", "anCard");
      c.style.setProperty("--i", i);
      if (ctx.met.has(name)) c.classList.add("met");
      ctx.tap(c, () => this.play(ctx, c, a));
      ctx.grid.appendChild(c);
      return c;
    });
    ctx.cards = cards;
    ctx.hint(() => cards.find((c) => !c.classList.contains("met")) || null, "동물 친구를 눌러 봐요!");
  },
  async play(ctx, c, a) {
    const U = KP.u,
      Z = KP.smartAnimals;
    const [em, name, hab, cry, snd] = a;
    U.replay(c, "anGo-" + hab);
    c.querySelectorAll(".anSay").forEach((x) => x.remove());
    c.appendChild(U.el("span", "anSay", cry.split("!")[0] + "!"));
    Z.cry(snd);
    ctx.after(450, () => KP.voice.say(name + "! " + cry));
    if (!ctx.met.has(name)) {
      ctx.met.add(name);
      c.classList.add("met");
      ctx.score.add();
    }
    ctx.hint(() => ctx.cards.find((x) => !x.classList.contains("met")) || null, "다른 친구도 눌러 봐요!");
    // 한 곳의 친구를 모두 만나면 큰 축하
    if (ctx.hab !== "all" && !ctx.done.has(ctx.hab)) {
      const all = Z.LIST.filter((x) => x[2] === ctx.hab).every((x) => ctx.met.has(x[1]));
      if (all) {
        ctx.done.add(ctx.hab);
        const h = Z.HABITATS.find((x) => x.k === ctx.hab);
        await ctx.wait(2200);
        await ctx.win({ big: true, msg: h.n + " 친구들 다 만났어요!" });
      }
    }
  },
});
