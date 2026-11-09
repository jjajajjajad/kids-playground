/* 다른 그림 찾기 — 똑같은 그림들 사이에서 하나만 다른 걸 찾아요.
   1단계: 4개, 확 다른 것(강아지 속 고양이)
   2단계: 6개, 비슷한 것(빨간 사과 속 초록 사과)
   3단계: 9개, 혼자 반대쪽을 보거나 거꾸로 있거나 아주 비슷한 것 */
"use strict";
KP.game({
  id: "odd",
  icon: "🔍",
  name: "다른 그림 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("odd", `
      .oddGrid{--sz:var(--szl);flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--cl),auto);justify-content:center;align-content:center;gap:clamp(10px,2vw,22px);padding:8px 12px 20px}
      @media (max-aspect-ratio:1/1){.oddGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      /* 폰 가로(낮은 가로 화면): 9칸을 3줄 대신 5+4 두 줄로 — 3줄이면 위·아래가 잘림 */
      @media (min-aspect-ratio:1/1) and (max-height:500px){.oddGrid{--sz:var(--szs);grid-template-columns:repeat(var(--cs),auto);padding:4px 12px 10px}}
      .oddBtn{font-size:var(--sz);border-radius:28px;padding:clamp(8px,1.2vw,14px)}
      .oddBtn .e{transition:transform .2s}
      .oddFlip .e{transform:scaleX(-1)}
      .oddTurn .e{transform:rotate(180deg)}
      .oddBtn.right{animation:oddWin .6s 2}
      @keyframes oddWin{30%{transform:translateY(-20px) scale(1.12)}60%{transform:none}}
      .oddLook{animation:wig .5s}
      .oddMag{position:absolute;font-size:.55em;right:-10px;bottom:-10px;animation:popIn .3s}
    `);
    ctx.grid = U.el("div", "oddGrid");
    ctx.body.appendChild(ctx.grid);
    // 1단계: 서로 확 다른 것들
    ctx.EASY = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐸", "개구리"], ["🐻", "곰"], ["🐵", "원숭이"], ["🐷", "돼지"],
      ["🍎", "사과"], ["🍌", "바나나"], ["🚗", "자동차"], ["⭐", "별"], ["🎈", "풍선"], ["🐟", "물고기"], ["🌻", "해바라기"], ["🦋", "나비"],
    ];
    // 2단계: 비슷한 짝 [같은 것, 다른 것, 같은 것 이름, 다른 것 이름]
    ctx.SIMILAR = [
      ["🍎", "🍏", "빨간 사과", "초록 사과"], ["🚗", "🚙", "빨간 자동차", "파란 자동차"], ["🐟", "🐠", "파란 물고기", "노란 물고기"],
      ["🌻", "🌼", "해바라기", "작은 꽃"], ["🍊", "🍋", "귤", "레몬"], ["🐻", "🐼", "곰", "판다"], ["🐯", "🦁", "호랑이", "사자"],
      ["💛", "🧡", "노란 하트", "주황 하트"], ["⚽", "🏀", "축구공", "농구공"], ["📘", "📗", "파란 책", "초록 책"], ["🐶", "🐺", "강아지", "늑대"],
      ["🐮", "🐷", "소", "돼지"], ["🍓", "🍒", "딸기", "체리"], ["🐔", "🐤", "닭", "병아리"],
    ];
    // 3단계: 방향이 보이는 그림 (좌우 반전·뒤집기)
    ctx.SIDE = [
      ["🐕", "강아지"], ["🦆", "오리"], ["🐌", "달팽이"], ["🦒", "기린"], ["🚒", "소방차"], ["🐘", "코끼리"], ["🐢", "거북이"],
      ["🐿️", "다람쥐"], ["🦖", "공룡"], ["🚂", "기차"], ["🚜", "트랙터"], ["🐊", "악어"], ["🦜", "앵무새"], ["🐬", "돌고래"], ["🍌", "바나나"], ["🚗", "자동차"],
    ];
    ctx.SUBTLE = [["🐤", "🐥", "병아리", "앞을 보는 병아리"], ["🌷", "🌸", "튤립", "벚꽃"], ["🐟", "🐡", "물고기", "복어"], ["🚗", "🚓", "자동차", "경찰차"], ["🍩", "🍪", "도넛", "쿠키"]];
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
    const n = [4, 6, 9][lv - 1];
    let same, odd, sameName, oddName, mode = "pic",
      why;
    if (lv === 1) {
      const [a, b] = U.sample(ctx.EASY, 2);
      [same, sameName, odd, oddName] = [a[0], a[1], b[0], b[1]];
      why = U.josa(oddName, "이/가") + " 숨어 있었어요!";
    } else if (lv === 2) {
      const p = U.pick(ctx.SIMILAR);
      [same, odd, sameName, oddName] = U.rand(2) ? p : [p[1], p[0], p[3], p[2]];
      why = U.josa(oddName, "이/가") + " 숨어 있었어요!";
    } else {
      const r = U.rand(3);
      if (r < 2) {
        const p = U.pick(ctx.SIDE);
        same = odd = p[0];
        sameName = oddName = p[1];
        mode = r === 0 ? "flip" : "turn";
        why = mode === "flip" ? U.josa(oddName, "이/가") + " 혼자 반대쪽을 봐요!" : U.josa(oddName, "이/가") + " 혼자 거꾸로예요!";
      } else {
        const p = U.pick(ctx.SUBTLE);
        [same, odd, sameName, oddName] = p;
        why = U.josa(oddName, "이/가") + " 숨어 있었어요!";
      }
    }
    const list = [];
    for (let i = 0; i < n - 1; i++) list.push({ odd: false });
    list.push({ odd: true });
    U.shuffle(list);
    const cols = { 4: [4, 2, 4], 6: [3, 2, 3], 9: [3, 3, 5] }[n]; // [가로, 세로, 낮은 가로]
    ctx.grid.style.setProperty("--cl", cols[0]);
    ctx.grid.style.setProperty("--cp", cols[1]);
    ctx.grid.style.setProperty("--cs", cols[2]);
    ctx.grid.style.setProperty("--szl", { 4: "clamp(80px,min(14vw,30vh),170px)", 6: "clamp(70px,min(13vw,22vh),150px)", 9: "clamp(60px,min(11vw,15vh),110px)" }[n]);
    ctx.grid.style.setProperty("--szs", { 4: "clamp(80px,min(14vw,30vh),170px)", 6: "clamp(60px,min(13vw,20vh),150px)", 9: "clamp(56px,min(11vw,22vh),110px)" }[n]);
    ctx.grid.style.setProperty("--szp", { 4: "clamp(80px,34vw,160px)", 6: "clamp(70px,min(32vw,16vh),140px)", 9: "clamp(60px,min(22vw,14vh),110px)" }[n]);
    const ask = "하나만 달라요! 다른 걸 찾아요!";
    const nat = (...l) => (KP.voice._natUrls && l.find((t) => KP.voice._natUrls(t))) || l[0]; // 같은 뜻 중 자연 음성(이미 있는 조각)이 있는 문장
    ctx.say("🔍 " + ask);
    const btns = ctx.choices(ctx.grid, list, {
      cls: "oddBtn",
      render: (v) => KP.E(v.odd ? odd : same),
      right: (v) => v.odd,
      wrongMsg: () => nat("이건 똑같은 " + U.josa(sameName, "이에요/예요") + ". 다른 걸 찾아봐요!", "이건 똑같은 " + sameName + "! 다른 걸 찾아봐요!", "이건 똑같아요. 다른 걸 찾아봐요!"),
      onRight: async (v, b) => {
        b.appendChild(U.el("span", "oddMag", KP.E("🔍")));
        btns.forEach((x, i) => x !== b && ctx.after(i * 50, () => U.replay(x, "oddLook")));
        KP.audio.sfx("sparkle");
        KP.voice.say(nat("찾았다! " + why, "찾았다! " + oddName + "!", "찾았다!"));
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1300);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 눈이 반짝!" : "찾았다!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    if (mode !== "pic") btns.find((b) => b.dataset.right).classList.add(mode === "flip" ? "oddFlip" : "oddTurn");
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});
