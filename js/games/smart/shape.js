/* 모양 찾기 — 말한 모양을 찾아 눌러요. 모양 친구들은 맞히면 웃으며 폴짝!
   1단계: 동그라미·네모·세모 3개 (색이 모두 다름)
   2단계: 6가지 모양 중 4개 (모두 같은 색 → 모양만 보고 찾기)
   3단계: 생활 물건에서 모양 찾기 (🍕 세모, ⚽ 동그라미, 📺 네모 …) */
"use strict";
KP.game({
  id: "shape",
  icon: "🔷",
  name: "모양 찾기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("shape", `
      .shpWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4vh,26px);padding:6px 12px 20px}
      .shpRef{display:none;align-items:center;gap:12px;background:#fff;border-radius:28px;padding:10px 22px;box-shadow:var(--shadow)}
      .shpRef.on{display:flex}
      .shpRef svg{width:clamp(70px,min(16vw,14vh),130px);height:clamp(70px,min(16vw,14vh),130px)}
      .shpGrid{--sz:var(--szl);display:grid;grid-template-columns:repeat(var(--cl),auto);justify-content:center;align-content:center;gap:clamp(14px,3vw,34px)}
      @media (max-aspect-ratio:1/1){.shpGrid{--sz:var(--szp);grid-template-columns:repeat(var(--cp),auto)}}
      .shpBtn{padding:clamp(8px,1.4vw,16px);border-radius:30px}
      .shpBtn svg{display:block;width:var(--sz);height:var(--sz);overflow:visible}
      .shpObj{font-size:var(--sz);border-radius:30px;padding:clamp(10px,1.4vw,16px)}
      .shpHappy{animation:shpHop .55s 2}
      @keyframes shpHop{30%{transform:translateY(-26px) rotate(8deg) scale(1.08)}60%{transform:translateY(0) scale(1.08,.92)}}
      .shpMouth2{display:none}.shpHappy .shpMouth2{display:inline}.shpHappy .shpMouth{display:none}
      .shpRing{animation:shpRing 1s ease-out}
      @keyframes shpRing{from{box-shadow:0 0 0 0 rgba(47,180,102,.7)}to{box-shadow:0 0 0 40px rgba(47,180,102,0)}}
    `);
    ctx.wrap = U.el("div", "shpWrap");
    ctx.ref = U.el("div", "shpRef");
    ctx.grid = U.el("div", "shpGrid");
    ctx.wrap.append(ctx.ref, ctx.grid);
    ctx.body.appendChild(ctx.wrap);
    const star = (() => {
      const p = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 21 : 47,
          a = -Math.PI / 2 + (i * Math.PI) / 5;
        p.push((50 + Math.cos(a) * r).toFixed(1) + "," + (54 + Math.sin(a) * r).toFixed(1));
      }
      return p.join(" ");
    })();
    // [키, 이름, svg 모양, 얼굴 높이]
    ctx.SHAPES = {
      circle: ["동그라미", '<circle cx="50" cy="50" r="45"/>', 50],
      square: ["네모", '<rect x="7" y="7" width="86" height="86" rx="10"/>', 50],
      triangle: ["세모", '<path d="M50 5 L96 91 L4 91 Z" stroke-linejoin="round"/>', 64],
      star: ["별", '<polygon points="' + star + '" stroke-linejoin="round"/>', 56],
      heart: ["하트", '<path d="M50 92 C22 72 4 54 4 32 C4 15 17 5 31 5 C41 5 47 11 50 19 C53 11 59 5 69 5 C83 5 96 15 96 32 C96 54 78 72 50 92 Z"/>', 40],
      diamond: ["마름모", '<polygon points="50,3 97,50 50,97 3,50" stroke-linejoin="round"/>', 50],
    };
    ctx.COLORS = ["#ff5b6e", "#ffb020", "#3fbf6a", "#3b8cff", "#a259ff", "#ff7eb9"];
    // 3단계 생활 물건 [그림, 이름, 모양]
    ctx.OBJ = [
      ["⚽", "축구공", "circle"], ["🍩", "도넛", "circle"], ["🍪", "쿠키", "circle"], ["🏀", "농구공", "circle"],
      ["🍕", "피자", "triangle"], ["🧀", "치즈", "triangle"], ["🍙", "주먹밥", "triangle"], ["⛺", "텐트", "triangle"],
      ["📺", "텔레비전", "square"], ["🎁", "선물 상자", "square"], ["🖼️", "액자", "square"], ["🚪", "문", "square"],
      ["🪁", "연", "diamond"], ["⭐", "별", "star"], ["❤️", "하트", "heart"],
    ];
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 모양 그림(웃는 얼굴) */
  svg(ctx, k, color, face = true, dashed = false) {
    const [, body, fy] = ctx.SHAPES[k];
    const style = dashed
      ? 'fill="#f3f6fc" stroke="#9aa6c8" stroke-width="5" stroke-dasharray="10 8"'
      : 'fill="' + color + '" stroke="rgba(0,0,0,.16)" stroke-width="4"';
    let s = '<svg viewBox="0 0 100 100"><g ' + style + ">" + body + "</g>";
    if (face)
      s +=
        '<g transform="translate(0,' + (fy - 50) + ')"><circle cx="39" cy="48" r="5.5" fill="#2f3a66"/><circle cx="61" cy="48" r="5.5" fill="#2f3a66"/>' +
        '<circle cx="40.5" cy="46.3" r="1.8" fill="#fff"/><circle cx="62.5" cy="46.3" r="1.8" fill="#fff"/>' +
        '<circle cx="31" cy="57" r="4" fill="rgba(255,120,150,.45)"/><circle cx="69" cy="57" r="4" fill="rgba(255,120,150,.45)"/>' +
        '<g transform="translate(0,56)"><path class="shpMouth" d="M43 0 Q50 7 57 0" fill="none" stroke="#2f3a66" stroke-width="3" stroke-linecap="round"/>' +
        '<path class="shpMouth2" d="M41 -1 Q50 13 59 -1 Z" fill="#ff7a8a" stroke="#2f3a66" stroke-width="2.5" stroke-linejoin="round"/></g></g>';
    return s + "</svg>";
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const self = this;
    const S = ctx.SHAPES;
    let list, target, render, nameOf, ask;
    ctx.ref.classList.toggle("on", lv === 3);
    if (lv < 3) {
      const keys = lv === 1 ? ["circle", "square", "triangle"] : U.sample(Object.keys(S), 4);
      const one = U.pick(ctx.COLORS);
      const cols = U.shuffle([...ctx.COLORS]);
      list = U.shuffle(keys.map((k, i) => ({ k, c: lv === 1 ? cols[i] : one })));
      target = U.pick(list);
      if (target.k === ctx.lastK) target = list.find((x) => x !== target);
      ctx.lastK = target.k;
      render = (v) => self.svg(ctx, v.k, v.c);
      nameOf = (v) => S[v.k][0];
      ask = U.josa(S[target.k][0], "을/를") + " 찾아요!";
      ctx.grid.style.setProperty("--cl", list.length);
      ctx.grid.style.setProperty("--cp", lv === 1 ? 1 : 2);
      ctx.grid.style.setProperty("--szl", lv === 1 ? "clamp(90px,min(18vw,30vh),200px)" : "clamp(90px,min(15vw,24vh),170px)");
      ctx.grid.style.setProperty("--szp", lv === 1 ? "clamp(90px,min(40vw,19vh),170px)" : "clamp(90px,min(34vw,19vh),160px)");
    } else {
      const groups = ["circle", "triangle", "square", "diamond"];
      let tk = U.pick(groups);
      if (tk === ctx.lastK) tk = U.pick(groups.filter((g) => g !== tk));
      ctx.lastK = tk;
      target = U.pick(ctx.OBJ.filter((o) => o[2] === tk));
      const otherKinds = U.sample(Object.keys(S).filter((k) => k !== tk), 3);
      list = U.shuffle([target, ...otherKinds.map((k) => U.pick(ctx.OBJ.filter((o) => o[2] === k)))]);
      render = (o) => KP.E(o[0]);
      nameOf = (o) => o[1];
      ctx.ref.innerHTML = self.svg(ctx, tk, "", false, true);
      ask = S[tk][0] + " 모양을 찾아요!";
      ctx.grid.style.setProperty("--cl", 4);
      ctx.grid.style.setProperty("--cp", 2);
      ctx.grid.style.setProperty("--szl", "clamp(64px,min(13vw,22vh),150px)");
      ctx.grid.style.setProperty("--szp", "clamp(64px,min(28vw,14vh),130px)");
    }
    ctx.say("🔷 " + ask);
    const btns = ctx.choices(ctx.grid, list, {
      cls: lv < 3 ? "shpBtn" : "shpObj",
      render,
      right: (v) => v === target,
      wrongMsg: (v) =>
        lv < 3
          ? "이건 " + U.josa(nameOf(v), "이에요/예요") + ". " + ask
          : U.josa(nameOf(v), "은/는") + " " + S[v[2]][0] + " 모양이에요. " + ask,
      onRight: async (v, b) => {
        b.classList.add("shpHappy", "shpRing");
        KP.audio.sfx("boing");
        KP.voice.say(lv < 3 ? nameOf(v) + "! 딩동댕!" : U.josa(nameOf(v), "은/는") + " " + S[v[2]][0] + " 모양! 딩동댕!");
        if (lv === 3) U.replay(ctx.ref, "jump");
        ctx.score.add();
        ctx.round++;
        await ctx.wait(1000);
        const big = ctx.round % 5 === 0;
        const ok = await ctx.win({ big, msg: big ? "모양 박사 형아!" : (lv < 3 ? nameOf(v) : S[v[2]][0]) + "!", quiet: !big });
        if (ok) self.next(ctx);
      },
    });
    ctx.hint(() => btns.find((b) => b.dataset.right), ask);
  },
});
