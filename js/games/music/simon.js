/* 순서 기억하기 — 동물 친구 4명이 차례로 노래하면 같은 순서로 눌러요
   - 하나씩 늘어나서 목표 길이(1단계 3 / 2단계 5 / 3단계 7)까지 가면 성공
   - 틀려도 "다시 잘 보세요!" 하고 같은 순서를 다시 보여 줌 (처음부터 아님) */
"use strict";
KP.game({
  id: "simon",
  icon: "💡",
  name: "순서 기억하기",
  cat: "music",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("simon", `
      .sm{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:10px;padding:0 14px 14px}
      .sm-prog{flex:0 0 auto;display:flex;gap:10px;align-items:center;justify-content:center;min-height:44px}
      .sm-pdot{width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 3px #d6dcef;display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .2s}
      .sm-pdot.have{background:#ffe9a8;box-shadow:inset 0 0 0 3px #f1c84a}
      .sm-pdot.ok{background:var(--grass);box-shadow:none;transform:scale(1.15)}
      .sm-eye{font-size:clamp(26px,4vh,36px);margin-left:6px;transition:opacity .2s}
      .sm-grid{flex:1;min-height:0;aspect-ratio:1;max-width:100%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:clamp(12px,2.4vh,22px)}
      .sm-pad{position:relative;border-radius:34px;background:var(--c);box-shadow:0 10px 0 color-mix(in srgb,var(--c) 60%,#000),inset 0 6px 0 rgba(255,255,255,.35);
        display:flex;align-items:center;justify-content:center;font-size:clamp(70px,13vh,130px);line-height:1;transition:filter .15s,transform .1s;filter:saturate(.75) brightness(.92);touch-action:none}
      .sm-pad .e{transition:transform .2s}
      .sm-pad.lit{filter:saturate(1.15) brightness(1.18);transform:scale(1.05);box-shadow:0 10px 0 color-mix(in srgb,var(--c) 60%,#000),0 0 0 8px #fff,0 0 40px 14px color-mix(in srgb,var(--c) 70%,#fff)}
      .sm-pad.lit .e{transform:translateY(-10%) scale(1.15) rotate(-6deg)}
      .sm-pad:active{transform:translateY(5px)}
      .sm-grid.watch .sm-pad{pointer-events:none}
      .sm-grid.watch{cursor:wait}
    `);
    const PADS = [
      ["🐶", "강아지", "#ff6b6b", "C4"], ["🐱", "고양이", "#4dabf7", "E4"],
      ["🐰", "토끼", "#ffd43b", "G4"], ["🐸", "개구리", "#51cf66", "C5"],
    ];
    const wrap = U.el("div", "sm");
    const prog = U.el("div", "sm-prog");
    const grid = U.el("div", "sm-grid");
    wrap.append(prog, grid);
    ctx.body.appendChild(wrap);

    let seq = [],
      pos = 0,
      target = 3,
      busy = true,
      gen = 0;
    const pads = PADS.map(([em, name, col, note], i) => {
      const p = U.el("div", "sm-pad", KP.E(em));
      p.style.setProperty("--c", col);
      p.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        A.unlock();
        if (busy) return;
        input(i);
      });
      grid.appendChild(p);
      return p;
    });
    function light(i, ms) {
      const p = pads[i];
      p.classList.add("lit");
      A.note(PADS[i][3], { inst: "bell", dur: 0.55, vol: 0.28 });
      A.note(PADS[i][3], { inst: "marimba", dur: 0.4, vol: 0.18 });
      ctx.after(ms, () => p.classList.remove("lit"));
    }
    function renderProg(okUpTo) {
      prog.innerHTML = "";
      for (let k = 0; k < target; k++) {
        const d = U.el("span", "sm-pdot" + (k < seq.length ? " have" : "") + (k < okUpTo ? " ok" : ""));
        prog.appendChild(d);
      }
      prog.appendChild(U.el("span", "sm-eye", KP.E(busy ? "👀" : "👆")));
    }
    async function show(again) {
      busy = true;
      grid.classList.add("watch");
      const g = ++gen;
      pos = 0;
      renderProg(0);
      ctx.hint(null);
      if (again) {
        ctx.say("다시 잘 보세요! 👀");
        await ctx.wait(1500);
      } else {
        ctx.say(seq.length === 1 ? "잘 보세요! 누가 노래할까요? 👀" : "잘 보세요! " + seq.length + "번 노래해요 👀");
        await ctx.wait(seq.length === 1 ? 1600 : 1200);
      }
      if (g !== gen) return;
      const lv = ctx.level,
        step = [720, 620, 540][lv - 1];
      for (const i of seq) {
        if (g !== gen || !ctx._active) return;
        light(i, step * 0.7);
        await ctx.wait(step);
      }
      if (g !== gen) return;
      busy = false;
      grid.classList.remove("watch");
      renderProg(0);
      ctx.say("이제 똑같이 눌러 봐요! 👆");
      setHint();
    }
    function setHint() {
      ctx.hint(() => pads[seq[pos]], "아까 누가 노래했지? 눌러 봐요!");
    }
    async function input(i) {
      light(i, 260);
      if (i !== seq[pos]) {
        busy = true;
        grid.classList.add("watch");
        ctx.miss(pads[i]);
        await ctx.wait(700);
        show(true);
        return;
      }
      pos++;
      renderProg(pos);
      if (pos < seq.length) return setHint();
      busy = true;
      grid.classList.add("watch");
      ctx.hint(null);
      if (seq.length >= target) {
        ctx.score.add();
        ctx.round = (ctx.round || 0) + 1;
        await ctx.wait(400);
        const big = ctx.round % 4 === 0;
        const ok = await ctx.win({ big, msg: big ? "기억력 대장!" : seq.length + "개 다 기억했어요!" });
        if (ok) newRound();
        return;
      }
      A.sfx("good");
      KP.voice.say(U.pick(["잘했어요! 하나 더!", "딩동댕! 이번엔 하나 더!", "좋아요! 더 길어져요!"]));
      await ctx.wait(1300);
      seq.push(U.rand(4));
      show(false);
    }
    function newRound() {
      target = [3, 5, 7][ctx.level - 1];
      seq = [U.rand(4)];
      show(false);
    }
    ctx.newRound = newRound;
    ctx.stopAll = () => gen++;
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.round = 0;
    ctx.newRound();
  },
  stop(ctx) {
    ctx.stopAll();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
