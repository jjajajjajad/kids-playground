/* 악기 소리 맞추기 — 소리를 듣고 어떤 악기인지 그림 고르기
   - 악기 11가지: 북·피아노·나팔·기타·종·바이올린·피리·마라카스·실로폰·트라이앵글·탬버린
     (모두 Web Audio 합성으로 악기 특징을 살림 — 나팔은 부드러운 금관 느낌)
   - 진짜 악기 녹음(KP.sampler: 북·피아노·실로폰·기타·탬버린·마라카스)을 불러오면 그 소리로, 못 불러오면 합성음
   - 🔊 다시 듣기, 단계: 보기 3 / 3 / 4개
     (1·2단계는 소리가 비슷한 악기끼리 — 종·트라이앵글·실로폰 / 마라카스·탬버린 / 나팔·피리·바이올린 — 같이 나오지 않게,
      3단계는 같은 묶음 최대 2개까지 — 비슷한 소리 셋이 한 문제에 몰리지 않게)
   - 정답 악기는 최근 3문제와 겹치지 않게. 문제 시작 뒤 🔊를 먼저 누르면 예약된 자동 듣기는 취소(소리 두 번 겹침 방지) */
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
      A = KP.audio,
      SM = KP.sampler;
    KP.css("inst", `
      .in-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
      .in-listen{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff;border-radius:50%;width:clamp(150px,26vh,230px);height:clamp(150px,26vh,230px);justify-content:center;position:relative;
        box-shadow:0 10px 0 color-mix(in srgb,var(--cat) 45%,#fff),0 0 0 10px color-mix(in srgb,var(--cat) 18%,transparent);font-size:clamp(17px,2.4vw,22px);color:var(--cat)}
      .in-listen .e{font-size:clamp(64px,11vh,100px)}
      .in-listen:active{transform:translateY(5px)}
      .in-listen.play{animation:inPulse .5s ease-in-out infinite}
      @keyframes inPulse{50%{transform:scale(1.08)}}
      /* 커지는 바깥 고리(10px→22px)는 따로 한 장(::after, 10~22px 띠)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .in-listen::after{content:"";position:absolute;inset:-10px;border-radius:50%;pointer-events:none;opacity:0;box-shadow:0 0 0 12px color-mix(in srgb,var(--cat) 12%,transparent)}
      .in-listen.play::after{animation:inPulseR .5s ease-in-out infinite}
      @keyframes inPulseR{50%{opacity:1}}
      .in-ch{flex-direction:column;gap:4px;min-width:clamp(120px,19vw,190px);min-height:clamp(120px,19vw,190px)}
      .in-ch .e,.in-ch svg{width:clamp(64px,10vw,104px);height:clamp(64px,10vw,104px)}
      .in-ch span{font-size:clamp(17px,2.2vw,22px)}
      .in-ch.play{animation:wig .4s 2}
      @media (max-aspect-ratio:1/1){ .in-ch{min-width:clamp(120px,40vw,170px);min-height:clamp(110px,16vh,150px)} .in-ch .e,.in-ch svg{width:64px;height:64px} }
      @media (orientation:landscape) and (max-height:500px){
        .in-stage{padding-top:10px}
        .in-listen{width:104px;height:104px;gap:2px;font-size:15px;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 45%,#fff),0 0 0 6px color-mix(in srgb,var(--cat) 18%,transparent)}
        .in-listen .e{font-size:46px}
        .in-listen::after{inset:-6px;box-shadow:0 0 0 16px color-mix(in srgb,var(--cat) 12%,transparent)}
        .in-ch{min-width:96px;min-height:96px}
        .in-ch .e,.in-ch svg{width:56px;height:56px}
        .in-ch span{font-size:15px}
        .qAns{padding:4px 12px 10px}
      }
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
    // 진짜 악기 녹음이 있으면 그걸로 (sampler.js 의 폴백 방식: 성공하면 true, 아니면 합성음)
    const ok = (k) => SM && SM.ok(k);
    const INSTS = [
      { id: "drum", g: "hit", name: "북", pic: KP.E("🥁"), snd: () => [0, 0.42, 0.84, 1.05].forEach((w, i) => {
        if (ok("drums")) { SM.hit("drums", "kick", { when: w, vol: 0.85 }); if (i > 1) SM.hit("drums", "snare", { when: w, vol: 0.4 }); return; }
        A.kick({ vol: 0.75, when: w }); if (i > 1) A.noise({ dur: 0.15, vol: 0.12, bp: 1600, when: w });
      }), len: 1.6 },
      { id: "piano", g: "keys", name: "피아노", pic: KP.E("🎹"), snd: () => ["C4", "E4", "G4", "C5", "G4", "C5"].forEach((n, i) => (ok("piano") ? SM.note("piano", n, { when: i * 0.22, vol: 0.3, dur: 0.9 }) : piano(n, i * 0.22))), len: 2 },
      { id: "trumpet", g: "long", name: "나팔", pic: KP.E("🎺"), snd: () => [["G4", 0.16], ["G4", 0.16], ["G4", 0.16], ["C5", 0.8]].reduce((t, [n, d]) => (brass(n, d, t), t + d + 0.06), 0), len: 1.8 },
      { id: "guitar", g: "pluck", name: "기타", pic: KP.E("🎸"), snd: () => [0, 0.6].forEach((w) => ["C3", "E3", "G3", "C4", "E4"].forEach((n, i) => (ok("guitar") ? SM.note("guitar", n, { when: w + i * 0.035, vol: 0.3, dur: 1.3 }) : A.note(n, { inst: "pluck", dur: 1.4, vol: 0.2, when: w + i * 0.035 })))), len: 2 },
      { id: "bell", g: "metal", name: "종", pic: KP.E("🔔"), snd: () => { A.note("G4", { inst: "bell", dur: 1.6, vol: 0.32 }); A.note("E4", { inst: "bell", dur: 1.8, vol: 0.32, when: 0.7 }); }, len: 2.2 },
      { id: "violin", g: "long", name: "바이올린", pic: KP.E("🎻"), snd: () => [["E4", 0.6], ["G4", 0.6], ["C5", 1.1]].reduce((t, [n, d]) => { const f = A.hz(n); A.note(f, { inst: "pad", dur: d, vol: 0.2, when: t }); A.tone(f * 2, { type: "triangle", attack: 0.15, dur: d + 0.2, vol: 0.05, when: t }); A.tone(f * 3, { attack: 0.2, dur: d, vol: 0.02, when: t }); return t + d; }, 0), len: 2.4 },
      { id: "flute", g: "long", name: "피리", pic: KP.E("🪈"), snd: () => [["G5", 0.3], ["E5", 0.3], ["C5", 0.6], ["D5", 0.3], ["E5", 0.6]].reduce((t, [n, d]) => { A.note(n, { inst: "soft", dur: d + 0.15, vol: 0.24, when: t }); A.noise({ dur: d, vol: 0.02, bp: A.hz(n), q: 4, when: t }); return t + d; }, 0), len: 2.1 },
      { id: "maraca", g: "shake", name: "마라카스", pic: KP.E("🪇"), snd: () => [0, 0.2, 0.4, 0.5, 0.8, 1.0, 1.2, 1.3].forEach((w, i) => (ok("shaker") ? SM.hit("shaker", i % 2 ? "up" : "down", { when: w, vol: 0.5 }) : A.noise({ dur: 0.1, vol: 0.13, hp: 4500, attack: 0.02, when: w }))), len: 1.6 },
      { id: "xylo", g: "metal", name: "실로폰", pic: SVG.xylo, snd: () => ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"].forEach((n, i) => { if (ok("xylo")) return void SM.note("xylo", n, { when: i * 0.11, vol: 0.45 }); const f = A.hz(n); A.note(f, { inst: "marimba", dur: 0.5, vol: 0.28, when: i * 0.11 }); A.tone(f * 4.1, { dur: 0.06, vol: 0.03, when: i * 0.11 }); }), len: 1.4 },
      { id: "tri", g: "metal", name: "트라이앵글", pic: SVG.tri, snd: () => [0, 0.8].forEach((w) => { const f = A.hz("E6"); A.note(f, { inst: "bell", dur: 1.6, vol: 0.14, when: w }); A.tone(f * 2.76, { dur: 1.2, vol: 0.035, when: w }); }), len: 2.2 },
      { id: "tamb", g: "shake", name: "탬버린", pic: SVG.tamb, snd: () => [0, 0.3, 0.6, 0.75, 0.9].forEach((w) => { if (ok("tamb")) return void SM.hit("tamb", "hit", { when: w, vol: 0.5 }); for (let k = 0; k < 4; k++) A.noise({ dur: 0.1, vol: 0.09, hp: 6500, when: w + k * 0.025 }); A.noise({ dur: 0.05, vol: 0.06, bp: 900, when: w }); }), len: 1.5 },
    ];

    const stage = U.el("div", "in-stage");
    const bListen = U.btn(KP.E("🔊") + "<span>다시 듣기</span>", "in-listen");
    stage.appendChild(bListen);
    const ans = U.el("div", "qAns");
    ctx.body.append(stage, ans);
    let answer = null,
      recent = [], // 최근 정답 3개 (같은 악기가 금방 또 나오지 않게)
      playT = 0,
      autoT = 0, // 문제 시작 뒤 자동 듣기 예약
      replayT = 0,
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
      ctx.cancel(autoT); // 자동 듣기 전에 먼저 눌렀으면 자동 듣기는 취소 (두 번 겹쳐 울리지 않게)
      U.replay(bListen, "pop");
      playIt();
    });
    /** 보기 고르기: 1·2단계는 소리 묶음(g)이 서로 다른 악기만 (비슷한 소리끼리 헷갈리지 않게), 3단계는 같은 묶음 최대 2개 */
    function pickOpts(n) {
      const cap = ctx.level >= 3 ? 2 : 1,
        used = { [answer.g]: 1 },
        out = [];
      for (const x of U.shuffle(INSTS.filter((x) => x !== answer))) {
        if (out.length >= n - 1) break;
        if ((used[x.g] || 0) >= cap) continue;
        used[x.g] = (used[x.g] || 0) + 1;
        out.push(x);
      }
      return out;
    }
    function next() {
      const n = [3, 3, 4][ctx.level - 1];
      ctx.cancel(replayT);
      answer = U.pick(INSTS.filter((x) => !recent.includes(x)));
      recent.push(answer);
      if (recent.length > 3) recent.shift();
      const opts = U.shuffle([answer, ...pickOpts(n)]);
      ans.innerHTML = "";
      btns = ctx.choices(ans, opts, {
        cls: "in-ch",
        render: (v) => v.pic + "<span>" + v.name + "</span>",
        right: (v) => v === answer,
        wrongMsg: (v) => U.josa(v.name, "이/가") + " 아니에요. 다시 들어 볼까요?",
        onRight: async (v, b) => {
          ctx.hint(null);
          ctx.cancel(autoT);
          ctx.cancel(replayT); // 오답 뒤 예약해 둔 '다시 들려주기'가 정답 소리와 겹치지 않게
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
      // 틀리면 정답 소리를 다시 들려주기 — 연달아 틀려도 예약은 하나만 (소리가 겹치지 않게)
      btns.forEach((b) => {
        if (!b.dataset.right)
          b.addEventListener("click", () => {
            if (KP.celebrating) return;
            ctx.cancel(replayT);
            ctx.cancel(autoT);
            replayT = ctx.after(1700, () => !KP.celebrating && playIt());
          });
      });
      ctx.say("무슨 악기 소리일까요? 잘 들어 보세요!");
      ctx.cancel(autoT);
      autoT = ctx.after(2300, () => playIt());
      ctx.hint(() => btns.find((b) => b.dataset.right), "소리를 듣고 악기 그림을 눌러요!");
    }
    ctx.next = next;
  },
  start(ctx) {
    // 진짜 악기 녹음 미리 불러오기 (기다리지 않음 — 그사이엔 합성음)
    if (KP.sampler) KP.sampler.load(["drums", "piano", "xylo", "guitar", "tamb", "shaker"]);
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.round = 0;
    ctx.next();
  },
  stop(ctx) {
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
