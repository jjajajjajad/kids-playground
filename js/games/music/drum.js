/* 신나는 드럼 — 악기 패드 8개 (큰북·작은북·심벌즈·탬버린·트라이앵글·우드블록·봉고·마라카스)
   - 그림(SVG)이 맞을 때마다 출렁, 물결 + 음표, 여러 손가락 동시에 OK
   - 🎵 반주 켜기: 동요 멜로디 + 화음 + 부드러운 박자 (빠르기 3단계), 박자 불빛과 춤추는 곰
     → 반주에 맞춰 치면 칭찬. 화면을 나가면 반주 자동 정지
   - 50번 칠 때마다 축하 */
"use strict";
KP.game({
  id: "drum",
  icon: "🥁",
  name: "신나는 드럼",
  cat: "music",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("drum", `
      .dr{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .dr-top{flex:0 0 auto;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}
      .dr-acc{font-size:clamp(18px,2.4vw,24px);min-height:62px;padding:10px 18px}
      .dr-acc .e{font-size:1.5em}
      .dr-acc.on{background:var(--grass);color:#fff;box-shadow:0 7px 0 #1d7f45}
      .dr-tp{width:58px;height:58px;border-radius:50%;background:#fff;box-shadow:var(--shadow);font-size:32px;display:flex;align-items:center;justify-content:center}
      .dr-tp.sel{background:var(--sun);box-shadow:0 6px 0 #d9a000}
      .dr-lights{display:flex;gap:8px;align-items:center}
      .dr-light{width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 3px #d6dcef;transition:background .08s}
      .dr-light.on{background:#ffd23f;box-shadow:0 0 12px 3px rgba(255,210,63,.9)}
      .dr-light.on.one{background:#ff5d73;box-shadow:0 0 12px 3px rgba(255,93,115,.8)}
      .dr-dancer{font-size:clamp(46px,7vh,64px);line-height:1;transform-origin:bottom center}
      .dr-dancer.hop{animation:drHop .3s ease-out}
      @keyframes drHop{40%{transform:translateY(-16px) rotate(-8deg) scale(1.05,.95)}80%{transform:rotate(6deg)}}
      .dr-grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:12px}
      .dr-pad{position:relative;border-radius:28px;background:var(--bg);box-shadow:0 8px 0 color-mix(in srgb,var(--bg) 70%,#000);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;touch-action:none;min-height:0;padding:6px}
      .dr-pad svg{width:auto;height:72%;max-width:92%;flex:0 1 auto;min-height:0;overflow:visible;transform-origin:center 70%}
      .dr-pad span{font-size:clamp(16px,2.3vw,24px);color:#3a3a55}
      .dr-pad.pr{transform:translateY(5px);box-shadow:0 3px 0 color-mix(in srgb,var(--bg) 70%,#000)}
      .dr-pad.hit svg{animation:drSquash .28s ease-out}
      @keyframes drSquash{30%{transform:scale(1.12,.88)}65%{transform:scale(.95,1.05)}}
      .dr-pad.shake svg{animation:drShake .35s ease-out}
      @keyframes drShake{20%{transform:rotate(-14deg)}50%{transform:rotate(12deg)}80%{transform:rotate(-6deg)}}
      .dr-wave{position:absolute;left:50%;top:45%;width:60%;aspect-ratio:1;border-radius:50%;border:6px solid rgba(255,255,255,.9);pointer-events:none;animation:drWave .5s ease-out forwards}
      @keyframes drWave{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
      .dr-fly{position:absolute;pointer-events:none;font-size:34px;animation:pnFly3 .9s ease-out forwards;z-index:3}
      @keyframes pnFly3{from{transform:translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-160%) scale(1.1);opacity:0}}
      @media (max-aspect-ratio:1/1){
        .dr-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:9px}
        .dr-pad{border-radius:22px}
        .dr-pad svg{height:66%}
        .dr-pad span{font-size:15px}
        .dr-acc{min-height:54px;padding:8px 12px;font-size:16px}
        .dr-tp{width:48px;height:48px;font-size:26px}
        .dr-top{gap:7px}
        .dr-lights{gap:5px}
        .dr-light{width:14px;height:14px}
        .dr-dancer{display:none}
      }
    `);
    const K = "#4a3a50";
    const PADS = [
      {
        id: "kick", name: "큰북", bg: "#ffd4d9",
        svg: '<svg viewBox="0 0 100 100"><path d="M22 86 L14 98 M78 86 L86 98" stroke="' + K + '" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="50" r="44" fill="#e8394d" stroke="' + K + '" stroke-width="4"/><circle cx="50" cy="50" r="34" fill="#fff6e0" stroke="#d6bf8f" stroke-width="3"/>' +
          [0, 45, 90, 135, 180, 225, 270, 315].map((a) => '<circle cx="' + (50 + Math.cos((a * Math.PI) / 180) * 39) + '" cy="' + (50 + Math.sin((a * Math.PI) / 180) * 39) + '" r="3" fill="#f4f4f4"/>').join("") +
          '<path d="M50 36 L54 46 L65 46 L56 53 L60 64 L50 57 L40 64 L44 53 L35 46 L46 46Z" fill="#ffc531" stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round"/></svg>',
        snd: () => {
          A.kick({ vol: 0.85 });
          A.noise({ dur: 0.1, vol: 0.07, lp: 500 });
        },
      },
      {
        id: "snare", name: "작은북", bg: "#d4e8ff",
        svg: '<svg viewBox="0 0 100 100"><path d="M14 40 V70 Q50 84 86 70 V40" fill="#3f7de0" stroke="' + K + '" stroke-width="4"/><path d="M14 46 L26 66 L38 48 L50 70 L62 48 L74 66 L86 46" fill="none" stroke="#e6eefc" stroke-width="3"/><ellipse cx="50" cy="40" rx="36" ry="12" fill="#fff8ea" stroke="' + K + '" stroke-width="4"/>' +
          '<path d="M30 6 L56 36 M74 8 L46 36" stroke="#c98a4a" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="6" r="4" fill="#e6b47a"/><circle cx="74" cy="8" r="4" fill="#e6b47a"/></svg>',
        snd: () => {
          A.noise({ dur: 0.2, vol: 0.24, bp: 1900, q: 0.7 });
          A.tone(200, { to: 150, dur: 0.11, vol: 0.2, type: "triangle" });
        },
      },
      {
        id: "cymbal", name: "심벌즈", bg: "#fff1c2",
        svg: '<svg viewBox="0 0 100 100"><path d="M50 40 V96 M50 96 L32 100 M50 96 L68 100" stroke="' + K + '" stroke-width="4" stroke-linecap="round"/><ellipse cx="50" cy="38" rx="46" ry="13" fill="#f7c843" stroke="' + K + '" stroke-width="4"/><ellipse cx="50" cy="38" rx="30" ry="8" fill="none" stroke="#e0a91c" stroke-width="3"/><ellipse cx="50" cy="38" rx="14" ry="4" fill="none" stroke="#e0a91c" stroke-width="3"/><ellipse cx="50" cy="35" rx="6" ry="3" fill="#fff4c4"/></svg>',
        snd: () => {
          A.noise({ dur: 1.5, vol: 0.12, hp: 5500 });
          A.noise({ dur: 0.5, vol: 0.06, bp: 3400, q: 2 });
        },
      },
      {
        id: "tamb", name: "탬버린", bg: "#ffe0f0",
        svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#fff3d9" stroke="#d99a4a" stroke-width="12"/><circle cx="50" cy="50" r="44" fill="none" stroke="' + K + '" stroke-width="3"/><circle cx="50" cy="50" r="31" fill="none" stroke="' + K + '" stroke-width="3"/>' +
          [20, 80, 140, 200, 260, 320].map((a) => '<ellipse cx="' + (50 + Math.cos((a * Math.PI) / 180) * 38) + '" cy="' + (50 + Math.sin((a * Math.PI) / 180) * 38) + '" rx="7" ry="5" fill="#ffd23f" stroke="' + K + '" stroke-width="2.5"/>').join("") +
          '<path d="M40 44 Q50 34 60 44 Q50 62 40 44Z" fill="#ff7aa8"/></svg>',
        snd: () => {
          for (let k = 0; k < 4; k++) A.noise({ dur: 0.1, vol: 0.09, hp: 6500, when: k * 0.028 });
          A.tone(5600, { dur: 0.15, vol: 0.018 });
          A.noise({ dur: 0.05, vol: 0.06, bp: 900, q: 1 });
        },
      },
      {
        id: "tri", name: "트라이앵글", bg: "#e4f7ff",
        svg: '<svg viewBox="0 0 100 100"><path d="M50 4 V16" stroke="' + K + '" stroke-width="3"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#9fb0c8" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#e6edf7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M70 40 L96 22" stroke="#9fb0c8" stroke-width="5" stroke-linecap="round"/></svg>',
        snd: () => {
          const f = A.hz("E6");
          A.note(f, { inst: "bell", dur: 1.8, vol: 0.12 });
          A.tone(f * 2.76, { dur: 1.3, vol: 0.03 });
          A.tone(f * 5.4, { dur: 0.7, vol: 0.012 });
        },
      },
      {
        id: "wood", name: "우드블록", bg: "#f5e1c8",
        svg: '<svg viewBox="0 0 100 100"><rect x="12" y="34" width="76" height="38" rx="14" fill="#c98a4a" stroke="' + K + '" stroke-width="4"/><rect x="22" y="48" width="56" height="8" rx="4" fill="#6b3f1f"/><path d="M20 40 H80" stroke="#e8b07a" stroke-width="4" stroke-linecap="round"/><path d="M62 4 L46 32" stroke="#a46a35" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="6" r="6" fill="#e05a5a" stroke="' + K + '" stroke-width="2.5"/></svg>',
        snd: () => {
          A.tone(980, { to: 880, dur: 0.07, vol: 0.32 });
          A.tone(1960, { dur: 0.04, vol: 0.06 });
        },
      },
      {
        id: "bongo", name: "봉고", bg: "#e2f7d9",
        svg: '<svg viewBox="0 0 100 100"><path d="M8 42 L14 88 H44 L50 42Z" fill="#d9773f" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/><ellipse cx="29" cy="42" rx="21" ry="7" fill="#fff3d9" stroke="' + K + '" stroke-width="4"/>' +
          '<path d="M52 48 L57 88 H85 L90 48Z" fill="#e8a13f" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/><ellipse cx="71" cy="48" rx="19" ry="6" fill="#fff3d9" stroke="' + K + '" stroke-width="4"/><path d="M44 66 H57" stroke="' + K + '" stroke-width="5"/></svg>',
        snd: () => {
          const hi = Math.random() < 0.5;
          A.tone(hi ? 420 : 300, { to: hi ? 360 : 240, dur: 0.2, vol: 0.32 });
          A.noise({ dur: 0.03, vol: 0.05, bp: 1500 });
        },
      },
      {
        id: "maraca", name: "마라카스", bg: "#efe2ff",
        svg: '<svg viewBox="0 0 100 100"><path d="M40 60 L22 96 M60 60 L78 96" stroke="#a46a35" stroke-width="7" stroke-linecap="round"/><ellipse cx="38" cy="38" rx="20" ry="26" fill="#ff8a3d" stroke="' + K + '" stroke-width="4" transform="rotate(20 38 38)"/><ellipse cx="64" cy="36" rx="20" ry="26" fill="#3cc45a" stroke="' + K + '" stroke-width="4" transform="rotate(-20 64 36)"/>' +
          '<circle cx="34" cy="30" r="4" fill="#ffe14d"/><circle cx="42" cy="44" r="4" fill="#ffe14d"/><circle cx="66" cy="28" r="4" fill="#fff"/><circle cx="60" cy="44" r="4" fill="#fff"/></svg>',
        snd: () => {
          A.noise({ dur: 0.12, vol: 0.13, hp: 4500, attack: 0.02 });
          A.noise({ dur: 0.08, vol: 0.08, hp: 5000, when: 0.09 });
        },
        shake: true,
      },
    ];

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "dr");
    const top = U.el("div", "dr-top");
    const bAcc = U.btn(KP.E("🎵") + " 반주 켜기", "btn dr-acc");
    const TEMPOS = [["🐢", 84, "느리게"], ["🚶", 104, "보통"], ["🐇", 126, "빠르게"]];
    let tempo = KP.store.get("drum:tempo", 104);
    const tpBtns = TEMPOS.map(([em, bpm, name]) => {
      const b = U.btn(KP.E(em), "dr-tp");
      ctx.tap(b, () => {
        tempo = bpm;
        KP.store.set("drum:tempo", bpm);
        tpBtns.forEach((x, i) => x.classList.toggle("sel", TEMPOS[i][1] === tempo));
        U.replay(b, "jump");
        A.sfx("select");
        KP.voice.say(name);
        if (acc) acc.bpm = bpm;
      });
      return b;
    });
    tpBtns.forEach((x, i) => x.classList.toggle("sel", TEMPOS[i][1] === tempo));
    const lights = U.el("div", "dr-lights");
    const lightEls = [0, 1, 2, 3].map((i) => {
      const l = U.el("i", "dr-light" + (i === 0 ? " one" : ""));
      lights.appendChild(l);
      return l;
    });
    const dancer = U.el("div", "dr-dancer", KP.E("🐻"));
    top.append(bAcc, ...tpBtns, lights, dancer);
    const grid = U.el("div", "dr-grid");
    wrap.append(top, grid);
    ctx.body.appendChild(wrap);

    let hits = 0,
      onBeat = 0;
    const padEls = PADS.map((p) => {
      const el = U.el("div", "dr-pad", p.svg + "<span>" + p.name + "</span>");
      el.style.setProperty("--bg", p.bg);
      el.addEventListener("pointerdown", async (e) => {
        e.preventDefault();
        A.unlock();
        p.snd();
        el.classList.add("pr");
        setTimeout(() => el.classList.remove("pr"), 110);
        U.replay(el, p.shake || p.id === "tamb" || p.id === "tri" ? "shake" : "hit");
        const w = U.el("div", "dr-wave");
        el.appendChild(w);
        setTimeout(() => w.remove(), 520);
        const r = el.getBoundingClientRect();
        const f = U.el("div", "dr-fly", KP.E(U.pick(["🎵", "🎶", "⭐"])));
        f.style.left = e.clientX - r.left + "px";
        f.style.top = e.clientY - r.top + "px";
        f.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "px");
        el.appendChild(f);
        setTimeout(() => f.remove(), 900);
        U.replay(dancer, "hop");
        ctx.hint(null);
        hits++;
        checkBeat();
        if (hits % 50 === 0) await ctx.win({ msg: "멋진 드러머!" });
      });
      grid.appendChild(el);
      return el;
    });

    /* ---------- 반주 (미리 예약하는 박자 스케줄러) ---------- */
    const ACC_SONGS = ["twinkle", "bears", "airplane", "schoolbell", "butterfly"];
    let acc = null,
      accT = 0;
    const CH = { C: ["C3", ["C4", "E4", "G4"]], F: ["F2", ["F3", "A3", "C4"]], G: ["G2", ["G3", "B3", "D4"]] };
    function chordOf(n) {
      if (!n || n === "R") return "C";
      const pc = A.midiOf(n) % 12;
      return [11, 2].includes(pc) ? "G" : [5, 9].includes(pc) ? "F" : "C";
    }
    function startAcc() {
      const c = A.ctx();
      if (!c) return;
      const t = c.currentTime + 0.12;
      acc = { bpm: tempo, beatT: t, beat: 0, melT: t, songI: 0, noteI: 0, mel: [], times: [] };
      bAcc.classList.add("on");
      bAcc.innerHTML = KP.E("⏹️") + " 반주 끄기";
      accT = ctx.every(40, tick);
      tick();
    }
    function stopAcc() {
      if (accT) ctx.cancel(accT);
      accT = 0;
      acc = null;
      bAcc.classList.remove("on");
      bAcc.innerHTML = KP.E("🎵") + " 반주 켜기";
      lightEls.forEach((l) => l.classList.remove("on"));
    }
    function tick() {
      if (!acc) return;
      const c = A.ctx(),
        now = c.currentTime,
        ahead = now + 0.2,
        spb = 60 / acc.bpm;
      // 멜로디 (오르골)
      while (acc.melT < ahead) {
        const song = A.SONGS[ACC_SONGS[acc.songI % ACC_SONGS.length]].notes;
        if (acc.noteI >= song.length) {
          acc.songI++;
          acc.noteI = 0;
          acc.melT += spb * 2;
          continue;
        }
        const [n, b] = song[acc.noteI++];
        if (n !== "R") A.note(A.hz(n) * 2, { inst: "bell", dur: Math.max(0.3, b * spb * 1.3), vol: 0.09, when: acc.melT - now });
        acc.mel.push([acc.melT, n]);
        acc.melT += b * spb;
      }
      // 박자 · 화음 · 베이스
      while (acc.beatT < ahead) {
        const w = acc.beatT - now,
          pos = acc.beat % 4;
        let cur = null;
        for (const m of acc.mel) if (m[0] <= acc.beatT + 0.01) cur = m[1];
        const ch = CH[chordOf(cur)];
        A.noise({ dur: 0.04, vol: 0.03, hp: 8000, when: w });
        if (pos === 0 || pos === 2) {
          A.kick({ vol: 0.22, when: w });
          A.note(ch[0], { inst: "bass", dur: spb * 1.5, vol: 0.16, when: w });
          ch[1].forEach((n) => A.note(n, { inst: "pad", dur: spb * 1.8, vol: 0.03, when: w }));
        } else A.noise({ dur: 0.07, vol: 0.04, bp: 1600, q: 0.8, when: w });
        acc.times.push(acc.beatT);
        const p = pos;
        ctx.after(Math.max(0, w * 1000), () => {
          lightEls.forEach((l, i) => l.classList.toggle("on", i === p));
          U.replay(dancer, "hop");
        });
        acc.beat++;
        acc.beatT += spb;
      }
      if (acc.mel.length > 64) acc.mel.splice(0, acc.mel.length - 64);
      if (acc.times.length > 16) acc.times.splice(0, acc.times.length - 16);
    }
    function checkBeat() {
      if (!acc) return;
      const now = A.ctx().currentTime;
      const near = acc.times.some((t) => Math.abs(t - now) < 0.11);
      if (!near) return;
      onBeat++;
      if (onBeat % 12 === 0) {
        KP.voice.say(U.pick(["박자에 딱딱 맞아요!", "쿵짝쿵짝 잘한다!", "우와, 진짜 드러머 같아요!"]));
        A.sfx("sparkle");
      }
    }
    ctx.tap(bAcc, () => {
      if (acc) {
        stopAcc();
        A.sfx("slide");
        KP.voice.say("반주를 껐어요");
      } else {
        startAcc();
        KP.voice.say("반주에 맞춰 쿵짝쿵짝 쳐 봐요!");
      }
    });
    ctx.stopAcc = stopAcc;
  },
  start(ctx) {
    ctx.stopAcc();
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.say("악기를 두드려 봐요! 반주를 켜면 노래에 맞춰 칠 수 있어요.");
    ctx.hint(() => ctx.body.querySelector(".dr-pad"), "악기를 두드려 봐요!");
  },
  stop(ctx) {
    ctx.stopAcc();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
