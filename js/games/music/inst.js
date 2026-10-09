/* 악기 소리 맞추기 — 소리를 듣고 어떤 악기인지 그림 고르기
   - 악기 11가지: 북·피아노·나팔·기타·종·바이올린·피리·마라카스·실로폰·트라이앵글·탬버린
     (모두 Web Audio 합성으로 악기 특징을 살림 — 나팔은 부드러운 금관 느낌)
   - 🔊 다시 듣기, 단계: 보기 2 / 3 / 4개 */
"use strict";
KP.game({
  id: "inst",
  icon: "🔔",
  name: "악기 소리 맞추기",
  cat: "music",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("inst", `
      .in-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
      .in-listen{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff;border-radius:50%;width:clamp(150px,26vh,230px);height:clamp(150px,26vh,230px);justify-content:center;
        box-shadow:0 10px 0 color-mix(in srgb,var(--cat) 45%,#fff),0 0 0 10px color-mix(in srgb,var(--cat) 18%,transparent);font-size:clamp(17px,2.4vw,22px);color:var(--cat)}
      .in-listen .e{font-size:clamp(64px,11vh,100px)}
      .in-listen:active{transform:translateY(5px)}
      .in-listen.play{animation:inPulse .5s ease-in-out infinite}
      @keyframes inPulse{50%{transform:scale(1.08);box-shadow:0 10px 0 color-mix(in srgb,var(--cat) 45%,#fff),0 0 0 22px color-mix(in srgb,var(--cat) 12%,transparent)}}
      .in-ch{flex-direction:column;gap:4px;min-width:clamp(120px,19vw,190px);min-height:clamp(120px,19vw,190px)}
      .in-ch .e,.in-ch svg{width:clamp(64px,10vw,104px);height:clamp(64px,10vw,104px)}
      .in-ch span{font-size:clamp(17px,2.2vw,22px)}
      .in-ch.play{animation:wig .4s 2}
      @media (max-aspect-ratio:1/1){ .in-ch{min-width:clamp(120px,40vw,170px);min-height:clamp(110px,16vh,150px)} .in-ch .e,.in-ch svg{width:64px;height:64px} }
    `);
    const K = "#4a3a50";
    const SVG = {
      xylo:
        '<svg viewBox="0 0 100 100"><path d="M8 34 L92 26 M8 74 L92 82" stroke="#a8662e" stroke-width="6" stroke-linecap="round"/>' +
        ["#ff4f5e", "#ff9a2e", "#f5c400", "#3cc45a", "#22b5d8", "#8a5cf0"].map((c, i) => '<rect x="' + (12 + i * 13.5) + '" y="' + (18 + i * 3) + '" width="11" height="' + (70 - i * 6) + '" rx="4" fill="' + c + '" stroke="' + K + '" stroke-width="2.5"/>').join("") +
        '<path d="M60 96 L84 62" stroke="#b07a45" stroke-width="4" stroke-linecap="round"/><circle cx="86" cy="58" r="7" fill="#ff5d73" stroke="' + K + '" stroke-width="2.5"/></svg>',
      tri: '<svg viewBox="0 0 100 100"><path d="M50 4 V16" stroke="' + K + '" stroke-width="3"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#9fb0c8" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#e6edf7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M70 40 L96 22" stroke="#9fb0c8" stroke-width="5" stroke-linecap="round"/></svg>',
      tamb:
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#fff3d9" stroke="#d99a4a" stroke-width="12"/><circle cx="50" cy="50" r="44" fill="none" stroke="' + K + '" stroke-width="3"/><circle cx="50" cy="50" r="31" fill="none" stroke="' + K + '" stroke-width="3"/>' +
        [20, 80, 140, 200, 260, 320].map((a) => '<ellipse cx="' + (50 + Math.cos((a * Math.PI) / 180) * 38) + '" cy="' + (50 + Math.sin((a * Math.PI) / 180) * 38) + '" rx="7" ry="5" fill="#ffd23f" stroke="' + K + '" stroke-width="2.5"/>').join("") +
        '<path d="M40 44 Q50 34 60 44 Q50 62 40 44Z" fill="#ff7aa8"/></svg>',
    };
    const piano = (n, when = 0) => {
      const f = A.hz(n);
      A.tone(f, { type: "triangle", dur: 1.4, vol: 0.2, attack: 0.004, when });
      A.tone(f * 2, { dur: 0.9, vol: 0.07, when });
      A.tone(f * 3, { dur: 0.5, vol: 0.035, when });
      A.noise({ dur: 0.025, vol: 0.025, lp: 2500, when });
    };
    const brass = (n, dur, when) => {
      const f = A.hz(n);
      A.note(f, { inst: "pad", dur, vol: 0.2, when });
      A.tone(f * 2, { type: "triangle", attack: 0.04, dur: dur + 0.1, vol: 0.07, when });
      A.tone(f * 3, { attack: 0.06, dur: dur * 0.8, vol: 0.035, when });
    };
    const INSTS = [
      { id: "drum", name: "북", pic: KP.E("🥁"), snd: () => [0, 0.42, 0.84, 1.05].forEach((w, i) => { A.kick({ vol: 0.75, when: w }); if (i > 1) A.noise({ dur: 0.15, vol: 0.12, bp: 1600, when: w }); }), len: 1.6 },
      { id: "piano", name: "피아노", pic: KP.E("🎹"), snd: () => ["C4", "E4", "G4", "C5", "G4", "C5"].forEach((n, i) => piano(n, i * 0.22)), len: 2 },
      { id: "trumpet", name: "나팔", pic: KP.E("🎺"), snd: () => [["G4", 0.16], ["G4", 0.16], ["G4", 0.16], ["C5", 0.8]].reduce((t, [n, d]) => (brass(n, d, t), t + d + 0.06), 0), len: 1.8 },
      { id: "guitar", name: "기타", pic: KP.E("🎸"), snd: () => [0, 0.6].forEach((w) => ["C3", "E3", "G3", "C4", "E4"].forEach((n, i) => A.note(n, { inst: "pluck", dur: 1.4, vol: 0.2, when: w + i * 0.035 }))), len: 2 },
      { id: "bell", name: "종", pic: KP.E("🔔"), snd: () => { A.note("G4", { inst: "bell", dur: 1.6, vol: 0.32 }); A.note("E4", { inst: "bell", dur: 1.8, vol: 0.32, when: 0.7 }); }, len: 2.2 },
      { id: "violin", name: "바이올린", pic: KP.E("🎻"), snd: () => [["E4", 0.6], ["G4", 0.6], ["C5", 1.1]].reduce((t, [n, d]) => { const f = A.hz(n); A.note(f, { inst: "pad", dur: d, vol: 0.2, when: t }); A.tone(f * 2, { type: "triangle", attack: 0.15, dur: d + 0.2, vol: 0.05, when: t }); A.tone(f * 3, { attack: 0.2, dur: d, vol: 0.02, when: t }); return t + d; }, 0), len: 2.4 },
      { id: "flute", name: "피리", pic: KP.E("🪈"), snd: () => [["G5", 0.3], ["E5", 0.3], ["C5", 0.6], ["D5", 0.3], ["E5", 0.6]].reduce((t, [n, d]) => { A.note(n, { inst: "soft", dur: d + 0.15, vol: 0.24, when: t }); A.noise({ dur: d, vol: 0.02, bp: A.hz(n), q: 4, when: t }); return t + d; }, 0), len: 2.1 },
      { id: "maraca", name: "마라카스", pic: KP.E("🪇"), snd: () => [0, 0.2, 0.4, 0.5, 0.8, 1.0, 1.2, 1.3].forEach((w) => A.noise({ dur: 0.1, vol: 0.13, hp: 4500, attack: 0.02, when: w })), len: 1.6 },
      { id: "xylo", name: "실로폰", pic: SVG.xylo, snd: () => ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"].forEach((n, i) => { const f = A.hz(n); A.note(f, { inst: "marimba", dur: 0.5, vol: 0.28, when: i * 0.11 }); A.tone(f * 4.1, { dur: 0.06, vol: 0.03, when: i * 0.11 }); }), len: 1.4 },
      { id: "tri", name: "트라이앵글", pic: SVG.tri, snd: () => [0, 0.8].forEach((w) => { const f = A.hz("E6"); A.note(f, { inst: "bell", dur: 1.6, vol: 0.14, when: w }); A.tone(f * 2.76, { dur: 1.2, vol: 0.035, when: w }); }), len: 2.2 },
      { id: "tamb", name: "탬버린", pic: SVG.tamb, snd: () => [0, 0.3, 0.6, 0.75, 0.9].forEach((w) => { for (let k = 0; k < 4; k++) A.noise({ dur: 0.1, vol: 0.09, hp: 6500, when: w + k * 0.025 }); A.noise({ dur: 0.05, vol: 0.06, bp: 900, when: w }); }), len: 1.5 },
    ];

    const stage = U.el("div", "in-stage");
    const bListen = U.btn(KP.E("🔊") + "<span>다시 듣기</span>", "in-listen");
    stage.appendChild(bListen);
    const ans = U.el("div", "qAns");
    ctx.body.append(stage, ans);
    let answer = null,
      last = null,
      playT = 0,
      btns = [];
    function playIt(inst) {
      inst = inst || answer;
      if (!inst) return;
      inst.snd();
      bListen.classList.add("play");
      ctx.cancel(playT);
      playT = ctx.after(inst.len * 1000, () => bListen.classList.remove("play"));
    }
    ctx.tap(bListen, () => {
      U.replay(bListen, "pop");
      playIt();
    });
    function next() {
      const n = [2, 3, 4][ctx.level - 1];
      answer = U.pick(INSTS.filter((x) => x !== last));
      last = answer;
      const opts = U.shuffle([answer, ...U.sample(INSTS.filter((x) => x !== answer), n - 1)]);
      ans.innerHTML = "";
      btns = ctx.choices(ans, opts, {
        cls: "in-ch",
        render: (v) => v.pic + "<span>" + v.name + "</span>",
        right: (v) => v === answer,
        wrongMsg: (v) => U.josa(v.name, "이/가") + " 아니에요. 다시 들어 볼까요?",
        onRight: async (v, b) => {
          ctx.hint(null);
          b.classList.add("play");
          playIt(v);
          ctx.score.add();
          ctx.round = (ctx.round || 0) + 1;
          await ctx.wait(Math.min(1400, v.len * 1000));
          const big = ctx.round % 5 === 0;
          const ok = await ctx.win({ big, msg: big ? "소리 박사!" : U.josa(v.name, "이/가") + " 맞아요!" });
          if (ok) next();
        },
      });
      // 틀리면 정답 소리를 다시 들려주기
      btns.forEach((b) => {
        if (!b.dataset.right) b.addEventListener("click", () => !KP.celebrating && ctx.after(1700, () => !KP.celebrating && playIt()));
      });
      ctx.say("무슨 악기 소리일까요? 잘 들어 보세요!");
      ctx.after(2300, () => playIt());
      ctx.hint(() => btns.find((b) => b.dataset.right), "소리를 듣고 악기 그림을 눌러요!");
    }
    ctx.next = next;
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.round = 0;
    ctx.next();
  },
  stop(ctx) {
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
