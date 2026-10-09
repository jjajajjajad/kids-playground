/* 그림자 찾기 — 위 그림과 똑같은 그림자를 골라요. 맞히면 그림자에 색이 아래부터 차올라요.
   1단계: 3개, 모양이 확 다른 것 / 2단계: 3개, 같은 무리(바다·새·탈것·과일)
   3단계: 4개, 윤곽이 비슷한 무리(동물 얼굴 등) */
"use strict";
KP.game({
  id: "shadow",
  icon: "🌓",
  name: "그림자 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("shadow", `
      .shdWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 18px}
      .shdPic{position:relative;font-size:var(--psz);line-height:1;background:#fff;border-radius:36px;padding:clamp(12px,2vw,22px);box-shadow:0 8px 0 rgba(47,58,102,.12);border:5px solid #ffe7a3}
      .shdPic .e{display:block}
      .shdPic.fly{animation:shdFly .9s}
      @keyframes shdFly{30%{transform:translateY(-18px) rotate(-6deg) scale(1.08)}60%{transform:translateY(0) rotate(4deg)}}
      .shdGrid{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);gap:clamp(12px,2.4vw,28px);justify-content:center}
      @media (max-aspect-ratio:1/1){.shdGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}.shdWrap{--psz:var(--pszp)!important}}
      .shdBtn{background:#e9eef8;border-radius:28px;padding:clamp(8px,1.2vw,14px)}
      .shdBox{position:relative;display:block;width:var(--sz);height:var(--sz);font-size:var(--sz);line-height:1}
      .shdBox .e{position:absolute;inset:0;width:100%;height:100%}
      .shdSil .e{filter:brightness(0) opacity(.75)}
      .shdCol{position:absolute;inset:0;clip-path:inset(100% 0 0 0);transition:clip-path 1s ease-in-out}
      .shdFill .shdCol{clip-path:inset(0 0 0 0)}
      .shdBtn.right{background:#d9ffe4}
      .shdFill{animation:shdHop .5s 1.1s 2}
      @keyframes shdHop{40%{transform:translateY(-16px) scale(1.06)}}
    `);
    ctx.wrap = U.el("div", "shdWrap");
    ctx.pic = U.el("div", "shdPic");
    ctx.grid = U.el("div", "shdGrid");
    ctx.wrap.append(ctx.pic, ctx.grid);
    ctx.body.appendChild(ctx.wrap);
    ctx.EASY = [
      ["🐘", "코끼리"], ["🦒", "기린"], ["🐌", "달팽이"], ["⭐", "별"], ["🎈", "풍선"], ["🌙", "달"], ["☂️", "우산"], ["🍌", "바나나"],
      ["✈️", "비행기"], ["🚲", "자전거"], ["🦖", "공룡"], ["🐟", "물고기"], ["🍎", "사과"], ["🐢", "거북이"], ["🦀", "꽃게"],
    ];
    ctx.GROUPS = {
      sea: [["🐟", "물고기"], ["🐠", "열대어"], ["🐡", "복어"], ["🐬", "돌고래"], ["🐳", "고래"], ["🦈", "상어"], ["🐙", "문어"], ["🦀", "꽃게"]],
      bird: [["🦆", "오리"], ["🐔", "닭"], ["🐤", "병아리"], ["🦉", "부엉이"], ["🦜", "앵무새"], ["🐧", "펭귄"], ["🦅", "독수리"], ["🕊️", "비둘기"]],
      car: [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚜", "트랙터"], ["🚑", "구급차"], ["🚓", "경찰차"], ["🚂", "기차"], ["🚁", "헬리콥터"]],
      fruit: [["🍎", "사과"], ["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"], ["🍐", "배"], ["🍒", "체리"], ["🍍", "파인애플"]],
      // 얼굴: 곰·판다·코알라·호랑이·개구리는 그림자가 거의 같아서 뺌
      face: [["🐻", "곰"], ["🐷", "돼지"], ["🐵", "원숭이"], ["🐭", "쥐"], ["🐰", "토끼"], ["🐱", "고양이"], ["🦊", "여우"], ["🐮", "소"], ["🐶", "강아지"], ["🦁", "사자"]],
    };
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
    let list;
    if (lv === 1) list = U.sample(ctx.EASY, 3);
    else if (lv === 2) list = U.sample(ctx.GROUPS[U.pick(["sea", "bird", "car", "fruit"])], 3);
    else list = U.sample(ctx.GROUPS[U.pick(["face", "face", "sea", "bird", "car"])], 4);
    let target = U.pick(list);
    if (ctx.last && target[0] === ctx.last) target = list.find((x) => x !== target);
    ctx.last = target[0];
    ctx.pic.innerHTML = KP.E(target[0]);
    U.replay(ctx.pic, "pop");
    ctx.wrap.style.setProperty("--psz", "clamp(90px,min(16vw,22vh),170px)");
    ctx.wrap.style.setProperty("--pszp", "clamp(90px,34vw,150px)");
    ctx.grid.style.setProperty("--cl", list.length);
    ctx.grid.style.setProperty("--cp", list.length === 3 ? 3 : 2);
    ctx.grid.style.setProperty("--szl", list.length === 3 ? "clamp(80px,min(15vw,24vh),170px)" : "clamp(76px,min(13vw,22vh),150px)");
    ctx.grid.style.setProperty("--szp", list.length === 3 ? "clamp(76px,24vw,110px)" : "clamp(76px,min(34vw,15vh),130px)");
    const ask = U.josa(target[1], "이/가") + " 숨었어요! " + target[1] + " 그림자를 찾아요!";
    ctx.say("🌓 " + ask);
    const btns = ctx.choices(ctx.grid, U.shuffle(list), {
      cls: "shdBtn",
      render: (v) => '<span class="shdBox"><span class="shdSil">' + KP.E(v[0]) + '</span><span class="shdCol">' + KP.E(v[0]) + "</span></span>",
      right: (v) => v === target,
      wrongMsg: (v) => "이건 " + v[1] + " 그림자예요. " + target[1] + " 그림자를 찾아봐요!",
      onRight: async (v, b) => {
        b.classList.add("shdFill");
        U.replay(ctx.pic, "fly");
        [0, 0.12, 0.24, 0.36, 0.48].forEach((w, i) => KP.audio.note(KP.audio.SCALE[i * 2], { inst: "bell", dur: 0.4, vol: 0.18, when: w }));
        KP.voice.say("딩동댕! " + target[1] + " 그림자!");
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1700);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "그림자 탐정 형아!" : "똑같아요!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), target[1] + " 그림자를 찾아요!");
  },
});
