/* 동물 밴드 — 동물 연주자를 무대에 끌어다 올리면 각자 짧은 악구를 같은 박자에 맞춰 반복 연주
   - 연주자 5명: 곰(드럼) · 코끼리(베이스) · 토끼(실로폰 멜로디) · 원숭이(탬버린) · 새(노래 '랄라')
   - 모두 같은 조성(다장조, C-Am-F-G 4마디 반복)·같은 빠르기. 새로 올린 친구는 다음 마디 첫 박에 들어옴
   - 내리면(의자로 끌어 내리거나 톡) 바로 멈춤. 연주 중인 친구는 박자에 맞춰 들썩
   - 빠르기 🐢🚶🐇, 분위기 🎉 신나게 / 🌙 잔잔하게
   1단계: 자리 2개 / 2단계: 자리 4개 (자유 합주 — 2명 이상이 몇 마디 함께 연주하면 칭찬, 자주 부르지 않음)
   3단계: 따라 해 봐요 — 들려준 조합(2~3명)을 듣고 똑같이 무대에 올리기 (보기는 늘 5명)
   소리는 모두 KP.audio 합성(새 음원 없음). 화면을 나가면 예약된 소리까지 멈춤(KP.audio.newScene) */
"use strict";
KP.game({
  id: "band",
  icon: "🎸",
  name: "동물 밴드",
  cat: "music",
  levels: 3,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("band", `
      .bd{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px;--an:clamp(64px,min(15vw,15vh),124px);--beat:.55s}
      .bd-top{flex:0 0 auto;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}
      .bd-grp{display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.55);border-radius:40px;padding:5px}
      .bd-b{width:64px;height:64px;border-radius:50%;background:#fff;box-shadow:var(--shadow);font-size:32px;display:flex;align-items:center;justify-content:center}
      .bd-b.sel{background:var(--sun);box-shadow:0 6px 0 #d9a000}
      .bd-b.ear{background:#ffe0f0;box-shadow:0 6px 0 #e79cbf}
      .bd-b.ear.go{animation:bdPulse 1s ease-in-out infinite}
      @keyframes bdPulse{50%{transform:scale(1.1)}}
      .bd-stage{position:relative;flex:1 1 auto;min-height:calc(var(--an) + 40px);border-radius:30px;overflow:hidden;
        background:radial-gradient(ellipse at 50% 0%,#6b4bc9 0%,#3b2a7a 60%,#2a1d5c 100%);box-shadow:0 8px 0 #1d1442;
        display:flex;align-items:center;justify-content:center;padding:34px 10px 26px}
      .bd-stage::before{content:"";position:absolute;left:0;right:0;top:0;height:24px;background:radial-gradient(circle at 20px -6px,#e8394d 22px,transparent 23px) 0 0/40px 24px repeat-x;filter:drop-shadow(0 3px 0 rgba(0,0,0,.25))}
      .bd-stage::after{content:"";position:absolute;left:0;right:0;bottom:0;height:22%;background:linear-gradient(#a8743f,#8a5a2e);border-top:4px solid #c99257}
      .bd-lights{position:absolute;top:30px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:2}
      .bd-light{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.25);transition:background .08s}
      .bd-light.on{background:#ffd23f;box-shadow:0 0 12px 3px rgba(255,210,63,.9)}
      .bd-light.on.one{background:#ff7aa8;box-shadow:0 0 12px 3px rgba(255,122,168,.9)}
      .bd-slots{position:relative;z-index:1;display:flex;gap:clamp(8px,2.4vw,30px);justify-content:center;align-items:flex-end;flex-wrap:wrap;max-width:100%}
      .bd-slot{position:relative;width:calc(var(--an) + 14px);height:calc(var(--an) + 14px);border-radius:50%;border:4px dashed rgba(255,255,255,.45);display:flex;align-items:center;justify-content:center;
        background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,.03))}
      .bd-slot .q{font-size:calc(var(--an) * .45);opacity:.75;pointer-events:none}
      .bd-slot.has{border-color:transparent;background:radial-gradient(circle,rgba(255,240,170,.55),rgba(255,240,170,0) 70%)}
      .bd-slot.has .q{display:none}
      .bd-slot.dropHover{border-color:#ffd23f;background:rgba(255,210,63,.3)}
      .bd-slot.beat{animation:bdSpot var(--beat) ease-out}
      @keyframes bdSpot{0%{box-shadow:0 0 0 0 rgba(255,210,63,.8)}100%{box-shadow:0 0 0 18px rgba(255,210,63,0)}}
      .bd-bench{flex:0 0 auto;display:flex;gap:clamp(6px,1.6vw,18px);justify-content:center;align-items:center;padding:8px 10px;border-radius:26px;background:linear-gradient(#ffd99a,#f2b866);box-shadow:0 6px 0 #c98a3a}
      .bd-bench.dropHover{background:linear-gradient(#ffe7bd,#ffcf85)}
      .bd-seat{width:var(--an);height:var(--an);border-radius:22px;background:rgba(150,90,20,.16);display:flex;align-items:center;justify-content:center;position:relative}
      .bd-an{position:relative;width:var(--an);height:var(--an);border-radius:24px;background:var(--c);box-shadow:0 6px 0 color-mix(in srgb,var(--c) 65%,#000);display:flex;align-items:center;justify-content:center;touch-action:none;z-index:2}
      .bd-an.dragging{z-index:20}
      .bd-an.locked{filter:saturate(.6) brightness(.95)}
      .bd-em{font-size:calc(var(--an) * .62);line-height:1;transform-origin:50% 90%;pointer-events:none}
      .bd-ins{position:absolute;right:-6px;bottom:-6px;width:calc(var(--an) * .42);height:calc(var(--an) * .42);border-radius:50%;background:#fff;box-shadow:0 3px 0 rgba(0,0,0,.18);
        display:flex;align-items:center;justify-content:center;font-size:calc(var(--an) * .27);pointer-events:none}
      .bd-an.bop .bd-em{animation:bdBop var(--beat) ease-out}
      @keyframes bdBop{25%{transform:translateY(-14%) scale(1.06,.94) rotate(-5deg)}60%{transform:translateY(0) scale(.96,1.04) rotate(4deg)}}
      .bd-an.wait .bd-em{animation:bdWait .7s ease-in-out infinite}
      @keyframes bdWait{50%{transform:scale(1.08)}}
      .bd-an.no{animation:bdNo .35s}
      @keyframes bdNo{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
      .bd-note{position:absolute;left:50%;top:0;font-size:calc(var(--an) * .3);pointer-events:none;animation:bdFly 1.1s ease-out forwards;z-index:3}
      @keyframes bdFly{from{transform:translate(-50%,0) scale(.5);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-120%) scale(1.1);opacity:0}}
      @media (max-aspect-ratio:1/1){
        .bd{--an:clamp(60px,min(19vw,10vh),124px)}
        .bd-bench{flex-wrap:wrap}
      }
      /* 폰 세로: 자리는 2×2, 의자는 3+2 줄, 단추는 한 줄 */
      @media (max-aspect-ratio:1/1) and (max-width:600px){
        .bd{gap:8px;padding:0 10px 10px}
        .bd-top{gap:6px}
        .bd-grp{gap:4px;padding:3px}
        .bd-b{width:56px;height:56px;font-size:27px}
        .bd-slots{max-width:calc((var(--an) + 14px) * 2 + 30px);gap:12px 20px}
        .bd-bench{max-width:calc(var(--an) * 3 + 60px);align-self:center;gap:8px 10px}
        .bd-stage{padding:30px 8px 18px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .bd{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) auto;gap:6px;padding:0 10px 8px;--an:clamp(60px,16vh,90px)}
        .bd-stage{grid-column:1;grid-row:1;padding:26px 8px 12px}
        .bd-bench{grid-column:1;grid-row:2;padding:5px 8px}
        .bd-top{grid-column:2;grid-row:1/3;flex-direction:column;flex-wrap:nowrap;gap:6px;justify-content:center}
        .bd-grp{padding:4px;gap:5px}
        .bd-b{width:58px;height:58px;font-size:27px}
      }
    `);

    /* ---------- 화음 진행 (다장조 4마디: C - Am - F - G) ---------- */
    const PROG = [
      { r: 48, t: [60, 64, 67] }, // C
      { r: 45, t: [57, 60, 64] }, // Am
      { r: 41, t: [53, 57, 60] }, // F
      { r: 43, t: [55, 59, 62] }, // G
    ];
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

    /* ---------- 악기 소리 (한 박의 1/2 = 한 칸, 마디당 8칸) ---------- */
    const snd = {
      kick: (w, v = 0.6) => A.kick({ vol: v, when: w }),
      snare: (w, v = 1) => {
        A.noise({ dur: 0.16, vol: 0.17 * v, bp: 1900, q: 0.7, when: w });
        A.tone(200, { to: 150, dur: 0.1, vol: 0.13 * v, type: "triangle", when: w });
      },
      hat: (w, v = 1) => A.noise({ dur: 0.04, vol: 0.045 * v, hp: 8000, when: w }),
      brush: (w) => A.noise({ dur: 0.28, vol: 0.06, bp: 2400, q: 0.6, attack: 0.03, when: w }),
      tamb: (w) => {
        for (let k = 0; k < 3; k++) A.noise({ dur: 0.09, vol: 0.075, hp: 6500, when: w + k * 0.026 });
        A.tone(5600, { dur: 0.12, vol: 0.014, when: w });
      },
      shake: (w, v = 1) => A.noise({ dur: 0.08, vol: 0.06 * v, hp: 5000, attack: 0.02, when: w }),
      ting: (w) => {
        const f = hz(100);
        A.note(f, { inst: "bell", dur: 1.4, vol: 0.06, when: w });
        A.tone(f * 2.76, { dur: 1, vol: 0.015, when: w });
      },
      xylo: (m, w) => {
        const f = hz(m);
        A.note(f, { inst: "marimba", dur: 0.6, vol: 0.2, when: w });
        A.tone(f * 3, { dur: 0.12, vol: 0.025, when: w });
      },
      bell: (m, w, d) => A.note(hz(m), { inst: "bell", dur: d, vol: 0.12, when: w }),
      bass: (m, w, d, v = 0.2) => A.note(hz(m), { inst: "bass", dur: d, vol: v, when: w }),
      // 노래 '랄라': 살짝 올려 짚는 시작 + 부드러운 사인 + 배음 하나
      sing: (m, w, d, v = 1) => {
        const f = hz(m);
        A.tone(f * 0.9, { to: f, dur: 0.08, vol: 0.05 * v, type: "triangle", when: w });
        A.note(f, { inst: "soft", dur: d, vol: 0.16 * v, when: w + 0.015 });
        A.tone(f * 2, { dur: d * 0.6, vol: 0.025 * v, attack: 0.05, when: w + 0.02 });
      },
    };
    // 마디별 멜로디 (칸 → 음)
    const MEL = [
      { 0: 76, 2: 79, 4: 76, 5: 74, 6: 72 },
      { 0: 72, 2: 76, 4: 69, 6: 72 },
      { 0: 69, 2: 72, 4: 77, 6: 76 },
      { 0: 74, 2: 71, 4: 67, 6: 71, 7: 74 },
    ];
    const SING = [
      { 0: [67, 3], 4: [64, 1], 6: [67, 2] },
      { 0: [64, 3], 4: [60, 1], 6: [64, 2] },
      { 0: [65, 3], 4: [69, 1], 6: [65, 2] },
      { 0: [62, 3], 4: [67, 1], 6: [71, 2] },
    ];
    const SING_CALM = [
      { 0: [67, 4], 4: [64, 4] },
      { 0: [64, 4], 4: [60, 4] },
      { 0: [65, 4], 4: [69, 4] },
      { 0: [62, 4], 4: [67, 4] },
    ];
    /** 각 연주자: play(분위기, 칸, 마디, 시각, 칸 길이) */
    const PLAYERS = [
      {
        id: "bear", name: "곰", em: "🐻", ins: "🥁", c: "#ffd4d9",
        play(mood, s, bar, w, sd) {
          if (mood === "fun") {
            if (s === 0 || s === 4 || (s === 5 && bar % 2 === 1)) snd.kick(w);
            if (s === 2 || s === 6) snd.snare(w);
            snd.hat(w, s % 2 ? 0.6 : 1);
          } else {
            if (s === 0) snd.kick(w, 0.4);
            if (s === 4) snd.brush(w);
            if (s === 6 && bar % 2 === 1) snd.kick(w, 0.25);
          }
        },
      },
      {
        id: "elephant", name: "코끼리", em: "🐘", ins: "🎸", c: "#d9e6ff",
        play(mood, s, bar, w, sd) {
          const r = PROG[bar % 4].r;
          if (mood === "fun") {
            if (s === 0) snd.bass(r, w, sd * 1.6);
            if (s === 3) snd.bass(r, w, sd * 0.9, 0.15);
            if (s === 4) snd.bass(r + 7, w, sd * 1.6);
            if (s === 6) snd.bass(r + 12, w, sd * 1.4, 0.15);
          } else {
            if (s === 0) snd.bass(r, w, sd * 3.6, 0.17);
            if (s === 4) snd.bass(r + 7, w, sd * 3.6, 0.14);
          }
        },
      },
      {
        id: "rabbit", name: "토끼", em: "🐰", ins: "🎹", c: "#fff1c2",
        play(mood, s, bar, w, sd) {
          if (mood === "fun") {
            const m = MEL[bar % 4][s];
            if (m) snd.xylo(m, w);
          } else if (s % 2 === 0) {
            const t = PROG[bar % 4].t;
            snd.bell([t[0], t[1], t[2], t[1]][s / 2] + 12, w, sd * 3);
          }
        },
      },
      {
        id: "monkey", name: "원숭이", em: "🐵", ins: "🪇", c: "#e2f7d9",
        play(mood, s, bar, w, sd) {
          if (mood === "fun") {
            if (s === 2 || s === 6) snd.tamb(w);
            else if (s % 2 === 1) snd.shake(w, 0.8);
          } else {
            snd.shake(w, s % 2 ? 0.45 : 0.7);
            if (s === 0 && bar % 2 === 0) snd.ting(w);
          }
        },
      },
      {
        id: "bird", name: "새", em: "🐦", ins: "🎤", c: "#efe2ff",
        play(mood, s, bar, w, sd) {
          const n = (mood === "fun" ? SING : SING_CALM)[bar % 4][s];
          if (n) snd.sing(n[0], w, n[1] * sd * (mood === "fun" ? 0.9 : 0.95), mood === "fun" ? 1 : 0.85);
        },
      },
    ];
    const byId = {};
    PLAYERS.forEach((p) => (byId[p.id] = p));

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "bd");
    const top = U.el("div", "bd-top");
    const MOODS = [["fun", "🎉", "신나게"], ["calm", "🌙", "잔잔하게"]];
    const TEMPOS = [["🐢", 84, "느리게"], ["🚶", 104, "보통"], ["🐇", 126, "빠르게"]];
    let mood = KP.store.get("band:mood", "fun");
    if (!MOODS.some((m) => m[0] === mood)) mood = "fun";
    let tempo = KP.store.get("band:tempo", 104);
    if (!TEMPOS.some((t) => t[1] === tempo)) tempo = 104;
    const gMood = U.el("div", "bd-grp"),
      gTempo = U.el("div", "bd-grp");
    const moodBtns = MOODS.map(([id, em, word]) => {
      const b = U.btn(KP.E(em), "bd-b");
      ctx.tap(b, () => {
        mood = id;
        KP.store.set("band:mood", id);
        paintSel();
        U.replay(b, "jump");
        A.sfx("select");
        KP.voice.say(word);
      });
      gMood.appendChild(b);
      return b;
    });
    const tempoBtns = TEMPOS.map(([em, bpm, word]) => {
      const b = U.btn(KP.E(em), "bd-b");
      ctx.tap(b, () => {
        tempo = bpm;
        KP.store.set("band:tempo", bpm);
        paintSel();
        U.replay(b, "jump");
        A.sfx("select");
        KP.voice.say(word);
      });
      gTempo.appendChild(b);
      return b;
    });
    function paintSel() {
      moodBtns.forEach((b, i) => b.classList.toggle("sel", MOODS[i][0] === mood));
      tempoBtns.forEach((b, i) => b.classList.toggle("sel", TEMPOS[i][1] === tempo));
      wrap.style.setProperty("--beat", Math.min(0.6, (60 / tempo) * 0.9).toFixed(2) + "s");
    }
    const bEar = U.btn(KP.E("👂"), "bd-b ear");
    top.append(gMood, gTempo, bEar);
    const stage = U.el("div", "bd-stage");
    const lights = U.el("div", "bd-lights");
    const lightEls = [0, 1, 2, 3].map((i) => {
      const l = U.el("i", "bd-light" + (i === 0 ? " one" : ""));
      lights.appendChild(l);
      return l;
    });
    const slotBox = U.el("div", "bd-slots");
    stage.append(lights, slotBox);
    const bench = U.el("div", "bd-bench");
    wrap.append(top, stage, bench);
    ctx.body.appendChild(wrap);
    paintSel();

    /* ---------- 상태 ---------- */
    let slots = []; // 무대 자리 요소들
    const where = {}; // 동물 id → 자리 요소(무대) 또는 null(의자)
    const seats = {};
    const els = {};
    const drags = {};
    const players = new Map(); // 무대에서 연주 중: id → {start: 들어오는 칸}
    let preview = null; // 3단계 들려주기 중: Map
    let curLevel = 1,
      mode = "free",
      muted = false,
      winning = false,
      together = 0,
      lastWin = 0,
      lastKey = "",
      wins = 0,
      soloBars = 0,
      nudged = false,
      target = [],
      roundId = 0,
      copyRound = 0,
      earWait = false, // 들려주기를 기다리는 중(다시 듣기 연타로 안내가 겹치지 않게)
      done = false;

    PLAYERS.forEach((p) => {
      const seat = U.el("div", "bd-seat");
      const el = U.el("div", "bd-an", '<span class="bd-em">' + KP.E(p.em) + '</span><span class="bd-ins">' + KP.E(p.ins) + "</span>");
      el.style.setProperty("--c", p.c);
      el.dataset.id = p.id;
      seat.appendChild(el);
      bench.appendChild(seat);
      seats[p.id] = seat;
      els[p.id] = el;
      where[p.id] = null;
      // 톡 누르기 구분 (거의 안 움직이고 놓으면 톡)
      let sx = 0,
        sy = 0,
        moved = 0;
      el.addEventListener("pointerdown", (e) => {
        sx = e.clientX;
        sy = e.clientY;
        moved = 0;
      });
      el.addEventListener("pointermove", (e) => {
        moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
      });
      drags[p.id] = KP.drag(el, {
        pad: 30,
        targets: () => {
          const own = where[p.id];
          const t = slots.filter((s) => s !== own);
          if (own) t.push(bench);
          return t;
        },
        accept: (t) => t === bench || mode !== "copy" || target.includes(p.id),
        onReject: (t) => {
          if (mode !== "copy") return;
          ctx.miss(t, "다시 들어 볼까요?");
          checkLevel();
        },
        onDrop: (t) => {
          el.style.transform = "";
          if (!t) {
            if (moved < 14) tapped(p.id);
            return;
          }
          if (t === bench) unplace(p.id);
          else place(p.id, t);
        },
      });
    });

    function occupant(slot) {
      return PLAYERS.find((p) => where[p.id] === slot);
    }
    function tapped(id) {
      if (where[id]) return unplace(id);
      const free = slots.find((s) => !occupant(s));
      if (!free) {
        U.replay(els[id], "no");
        A.sfx("boing");
        return;
      }
      if (mode === "copy" && !target.includes(id)) {
        U.replay(els[id], "no");
        ctx.miss(free, "다시 들어 볼까요?");
        checkLevel();
        return;
      }
      place(id, free);
    }
    function place(id, slot) {
      const prev = where[id];
      const other = occupant(slot);
      if (other && other.id !== id) {
        if (prev) {
          // 무대 위끼리 자리 바꾸기 (연주는 그대로)
          where[other.id] = prev;
          prev.appendChild(els[other.id]);
        } else unplace(other.id, true);
      }
      where[id] = slot;
      slot.appendChild(els[id]);
      A.sfx("snap");
      if (!prev) startPlaying(id);
      refresh();
    }
    function unplace(id, quiet) {
      if (!where[id]) return;
      where[id] = null;
      seats[id].appendChild(els[id]);
      els[id].classList.remove("wait", "bop");
      players.delete(id);
      if (!quiet) A.sfx("slide");
      if (!players.size && !preview) stopT();
      refresh();
    }
    function refresh() {
      slots.forEach((s) => s.classList.toggle("has", !!occupant(s)));
      const any = slots.some((s) => occupant(s));
      if (mode === "free") {
        if (!any) ctx.hint(() => benchFirst(), "동물 친구를 무대에 올려 봐요!");
        else ctx.hint(null);
      } else if (!done && !preview) checkCopy();
    }
    function benchFirst() {
      const p = PLAYERS.find((x) => !where[x.id]);
      return p ? els[p.id] : null;
    }
    const key = () => PLAYERS.filter((p) => where[p.id]).map((p) => p.id).join(",") + "|" + mood + "|" + tempo;

    /* ---------- 박자 (미리 예약하는 스케줄러, 마디당 8칸) ---------- */
    const T = { on: false, step: 0, nextT: 0, timer: 0 };
    const sd = () => 30 / tempo; // 한 칸 = 반 박
    function startT() {
      const c = A.ctx();
      if (!c || T.on) return;
      T.on = true;
      T.step = 0;
      T.nextT = c.currentTime + 0.08;
      T.timer = ctx.every(30, tick);
      tick();
    }
    function stopT() {
      if (T.timer) ctx.cancel(T.timer);
      T.timer = 0;
      T.on = false;
      lightEls.forEach((l) => l.classList.remove("on"));
    }
    function startPlaying(id) {
      // 처음 연주자는 바로, 그다음부터는 다음 마디 첫 박에 들어옴
      if (!T.on) {
        startT();
        players.set(id, { start: 0 });
      } else players.set(id, { start: Math.ceil(T.step / 8) * 8 });
      if (players.get(id).start > T.step) els[id].classList.add("wait");
    }
    function tick() {
      if (!T.on) return;
      const c = A.ctx();
      if (!c) return;
      const now = c.currentTime;
      if (T.nextT < now - 0.1) T.nextT = now + 0.05; // 화면이 잠깐 멈췄다 돌아오면 몰아서 치지 않게
      const ahead = now + 0.16;
      while (T.on && T.nextT < ahead) {
        const s = T.step,
          sb = s % 8,
          bar = Math.floor(s / 8),
          w = Math.max(0, T.nextT - now),
          d = sd();
        if (sb === 0) onBar(bar);
        if (!T.on) break;
        const src = preview || players;
        const live = [];
        src.forEach((p, id) => {
          if (s < p.start) return;
          live.push(id);
          if (!muted) byId[id].play(mood, sb, bar, w, d);
        });
        if (sb % 2 === 0 && !muted) {
          const beat = sb / 2;
          ctx.after(w * 1000, () => beatVis(beat, live, sb === 0));
        }
        T.step++;
        T.nextT += d;
      }
    }
    function beatVis(beat, live, down) {
      lightEls.forEach((l, i) => l.classList.toggle("on", i === beat));
      if (preview) {
        slots.forEach((s) => U.replay(s, "beat"));
        return;
      }
      live.forEach((id) => {
        if (!where[id]) return;
        const el = els[id];
        el.classList.remove("wait");
        U.replay(el, "bop");
        if (down) {
          const n = U.el("div", "bd-note", KP.E(U.pick(["🎵", "🎶"])));
          n.style.setProperty("--dx", (Math.random() - 0.5) * 70 + "px");
          el.appendChild(n);
          setTimeout(() => n.remove(), 1100);
        }
      });
    }
    function onBar(bar) {
      if (preview) {
        if (bar >= preview.endBar) endPreview();
        return;
      }
      if (mode !== "free" || winning || muted) return;
      let n = 0;
      players.forEach((p) => {
        if (p.start <= bar * 8) n++;
      });
      if (n >= 2) together++;
      if (n === 1) {
        soloBars++;
        if (soloBars === 4 && !nudged) {
          nudged = true;
          ctx.tell("친구를 한 명 더 올려 볼까요?");
          ctx.hint(() => benchFirst(), "친구를 한 명 더 올려 볼까요?");
        }
      }
      // 칭찬: 2명 이상이 함께 4마디(두 번째부터 8마디) + 45초 이상 지남 + 지난 칭찬 뒤 무언가 바꿈
      const need = wins ? 8 : 4;
      if (n >= 2 && together >= need && Date.now() - lastWin >= 45000 && key() !== lastKey) freeWin();
    }

    /* ---------- 1·2단계: 자유 합주 ---------- */
    async function freeWin() {
      winning = true;
      muted = true;
      const sess = ctx._session;
      const ok = await ctx.win({ msg: U.pick(["멋진 합주예요!", "{부름} 최고!"]) });
      if (sess !== ctx._session) return;
      winning = false;
      muted = false;
      together = 0;
      wins++;
      lastWin = Date.now();
      lastKey = key();
      if (ok) checkLevel();
    }
    function checkLevel() {
      const lv = ctx.level;
      if (lv === curLevel) return;
      const wasCopy = mode === "copy";
      setLevel(lv, wasCopy || lv >= 3);
    }
    function makeSlots(n, q) {
      slotBox.innerHTML = "";
      slots = [];
      for (let i = 0; i < n; i++) {
        const s = U.el("div", "bd-slot", q ? '<span class="q">' + KP.E("❓") + "</span>" : "");
        slotBox.appendChild(s);
        slots.push(s);
      }
    }
    function resetAll() {
      roundId++;
      preview = null;
      PLAYERS.forEach((p) => {
        where[p.id] = null;
        seats[p.id].appendChild(els[p.id]);
        els[p.id].classList.remove("wait", "bop");
        els[p.id].style.transform = "";
        drags[p.id].unlock();
      });
      players.clear();
      stopT();
    }
    function setLevel(lv, reset) {
      curLevel = lv;
      if (lv >= 3) {
        mode = "copy";
        resetAll();
        bEar.style.display = "";
        copyRound = 0;
        nextCopy();
        return;
      }
      mode = "free";
      bEar.style.display = "none";
      bEar.classList.remove("go");
      if (reset) resetAll();
      // 1→2단계: 무대에 있던 친구는 그대로 두고 자리만 늘림
      const keep = PLAYERS.filter((p) => where[p.id]).map((p) => p.id);
      makeSlots(lv === 1 ? 2 : 4);
      keep.forEach((id, i) => {
        if (slots[i]) {
          where[id] = slots[i];
          slots[i].appendChild(els[id]);
        } else unplace(id, true);
      });
      refresh();
    }

    /* ---------- 3단계: 따라 해 봐요 ---------- */
    function lockAll(on) {
      PLAYERS.forEach((p) => (on ? drags[p.id].lock() : drags[p.id].unlock()));
    }
    async function nextCopy() {
      resetAll();
      done = false;
      const my = roundId;
      const k = copyRound < 2 ? 2 : U.pick([2, 3]);
      target = U.sample(PLAYERS.map((p) => p.id), k);
      makeSlots(k, true);
      bEar.classList.remove("go");
      lockAll(true);
      ctx.hint(null);
      earWait = true; // 첫 들려주기 전에는 다시 듣기 단추를 막음
      await Promise.race([ctx.say("잘 들어 보세요!"), ctx.wait(3000)]);
      if (my !== roundId || !ctx._active) return;
      startPreview();
    }
    function startPreview() {
      earWait = false;
      if (!ctx._active || mode !== "copy" || done || preview) return;
      lockAll(true);
      bEar.classList.remove("go");
      const was = T.on;
      preview = new Map();
      // 무대에 이미 있는 친구 소리는 잠깐 쉬고, 들려줄 조합만 2마디
      if (was) {
        const st = Math.ceil(T.step / 8) * 8;
        target.forEach((id) => preview.set(id, { start: st }));
        preview.endBar = st / 8 + 2;
      } else {
        startT();
        target.forEach((id) => preview.set(id, { start: 0 }));
        preview.endBar = 2;
      }
    }
    function endPreview() {
      preview = null;
      if (players.size) {
        const st = T.step; // 이 마디부터 무대 친구들 다시 연주
        players.forEach((p) => (p.start = st));
      } else stopT();
      lockAll(false);
      bEar.classList.add("go");
      ctx.say("똑같이 꾸며 봐요!");
      ctx.hint(() => bEar, "다시 들어 볼까요?");
      checkCopy();
    }
    function checkCopy() {
      if (mode !== "copy" || done || preview) return;
      const on = PLAYERS.filter((p) => where[p.id]).map((p) => p.id);
      if (on.length !== target.length || !target.every((id) => on.includes(id))) return;
      done = true;
      lockAll(true);
      bEar.classList.remove("go");
      ctx.hint(null);
      const my = roundId;
      // 한 마디쯤 다 같이 연주하는 걸 들려준 뒤 칭찬
      ctx.after(Math.max(1500, sd() * 8 * 1000 + 600), async () => {
        if (my !== roundId) return;
        muted = true;
        const ok = await ctx.win({ msg: "와, 똑같아요!", big: (copyRound + 1) % 4 === 0 });
        muted = false;
        if (!ok || my !== roundId) return;
        copyRound++;
        if (ctx.level < 3) return checkLevel();
        nextCopy();
      });
    }
    ctx.tap(bEar, () => {
      if (mode !== "copy" || done || preview || earWait) return;
      earWait = true;
      A.sfx("tap");
      KP.voice.say("잘 들어 보세요!");
      ctx.after(900, startPreview);
    });

    ctx.band = {
      begin() {
        winning = false;
        muted = false;
        together = 0;
        wins = 0;
        lastWin = 0;
        lastKey = "";
        soloBars = 0;
        nudged = false;
        done = false;
        resetAll();
        setLevel(ctx.level, true);
      },
      end() {
        roundId++;
        stopT();
        players.clear();
        preview = null;
        muted = false;
        winning = false;
      },
      // 점검용
      _state: () => ({ mode, level: curLevel, on: T.on, step: T.step, players: [...players.keys()], target: [...target], preview: !!preview, together }),
    };
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.band.begin();
    if (ctx.level >= 3) return;
    ctx.say("동물 친구를 무대에 올려 봐요!");
  },
  stop(ctx) {
    ctx.band.end();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
