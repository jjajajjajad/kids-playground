/* =====================================================================
   소리 엔진 (Web Audio 합성, 음원 파일 없음)
   - 버스 3개: sfx(효과음) / music(배경음악) / voice(목소리 음량 표시용)
   - 컴프레서로 여러 소리가 겹쳐도 찢어지지 않게 함
   - 악기: bell(오르골 종), marimba(마림바), pluck(뜯는 소리), pad(부드러운 화음), bass
   - 동요 멜로디 라이브러리 + 화음 반주 배경음악
===================================================================== */
"use strict";
(function (KP) {
  const A = (KP.audio = {});
  let ctx = null,
    comp = null,
    master = null;
  const bus = {};
  let noiseBuf = null;

  const vol = () => (KP.settings ? KP.settings.get() : { sfx: 0.8, music: 0.35, voice: 1 });

  A.ctx = function () {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      master = ctx.createGain();
      master.gain.value = 0.95;
      comp.connect(master);
      master.connect(ctx.destination);
      ["sfx", "music"].forEach((b) => {
        bus[b] = ctx.createGain();
        bus[b].connect(comp);
      });
      A.applyVolumes();
    }
    if (ctx.state !== "running") ctx.resume().catch(() => {}); // iOS: suspended / interrupted
    return ctx;
  };
  A.applyVolumes = function () {
    if (!ctx) return;
    const v = vol();
    bus.sfx.gain.value = v.sfx;
    bus.music.gain.value = v.music * (ducked ? 0.35 : 1);
  };
  /** iOS 등에서 첫 터치 때 소리 잠금 해제 */
  A.unlock = function () {
    const c = A.ctx();
    if (!c) return;
    try {
      const b = c.createBuffer(1, 1, 22050),
        s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch (e) {}
  };
  /* 목소리가 나올 때 배경음악을 살짝 줄이기 */
  let ducked = false;
  A.duck = function (on) {
    ducked = on;
    if (!ctx) return;
    const v = vol();
    bus.music.gain.cancelScheduledValues(ctx.currentTime);
    bus.music.gain.setTargetAtTime(v.music * (on ? 0.35 : 1), ctx.currentTime, 0.12);
  };

  /* ---------------- 음 이름 → 주파수 ---------------- */
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  A.hz = function (n) {
    if (typeof n === "number") return n;
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    if (!m) return 440;
    let s = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    const midi = (+m[3] + 1) * 12 + s;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };
  A.midiOf = function (n) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    return (+m[3] + 1) * 12 + SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  };
  /** 도레미 음계 (C4 ~ E5) */
  A.SCALE = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"];
  A.SOLFA = ["도", "레", "미", "파", "솔", "라", "시", "도", "레", "미", "파", "솔"];

  /* ---------------- 기본 부품 ---------------- */
  /* 효과음은 '화면 묶음'을 거쳐 나간다. 화면을 나가면 묶음을 끊어서
     미리 예약해 둔 노래(생일 노래 등)까지 함께 멈춘다. */
  let scene = null;
  function out(b) {
    if (b === "music") return bus.music;
    if (!scene) {
      scene = ctx.createGain();
      scene.connect(bus.sfx);
    }
    return scene;
  }
  A.newScene = function () {
    if (!ctx || !scene) return;
    const old = scene;
    scene = null;
    old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
    setTimeout(() => {
      try {
        old.disconnect();
      } catch (e) {}
    }, 400);
  };
  function osc(type, f, t, dur, peak, dest, attack = 0.004, detune = 0) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
    return { o, g };
  }

  /* ---------------- 악기 ---------------- */
  const INST = {
    bell(f, t, dur, v, d) {
      [
        [1, 1, 1],
        [2.0, 0.42, 0.6],
        [3.0, 0.16, 0.38],
        [4.16, 0.08, 0.22],
      ].forEach(([m, a, dl]) => osc("sine", f * m, t, dur * dl + 0.05, v * a, d));
    },
    marimba(f, t, dur, v, d) {
      osc("sine", f, t, Math.min(dur, 0.7), v, d, 0.003);
      osc("sine", f * 4, t, 0.09, v * 0.22, d, 0.002);
      osc("sine", f * 9.9, t, 0.03, v * 0.06, d, 0.001);
    },
    pluck(f, t, dur, v, d) {
      const o = ctx.createOscillator(),
        g = ctx.createGain(),
        lp = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.value = f;
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(5000, t);
      lp.frequency.exponentialRampToValueAtTime(700, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp);
      lp.connect(g);
      g.connect(d);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    pad(f, t, dur, v, d) {
      const g = ctx.createGain(),
        lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + Math.min(0.25, dur * 0.4));
      g.gain.setValueAtTime(v, t + Math.max(0.05, dur - 0.25));
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
      lp.connect(g);
      g.connect(d);
      [-7, 7].forEach((dt) => {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        o.detune.value = dt;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.4);
      });
    },
    bass(f, t, dur, v, d) {
      osc("sine", f, t, dur, v, d, 0.01);
      osc("triangle", f * 2, t, dur * 0.4, v * 0.15, d, 0.01);
    },
    soft(f, t, dur, v, d) {
      osc("sine", f, t, dur, v, d, 0.04);
    },
    square(f, t, dur, v, d) {
      osc("square", f, t, dur, v * 0.35, d, 0.003);
    },
  };

  /** 음 하나 연주: A.note("C5",{inst:"bell",dur:0.4,vol:0.3,when:0,bus:"sfx"}) */
  A.note = function (n, o = {}) {
    if (!A.ctx()) return;
    const f = A.hz(n);
    const t = ctx.currentTime + (o.when || 0);
    (INST[o.inst || "bell"] || INST.bell)(f, t, o.dur || 0.4, o.vol == null ? 0.3 : o.vol, o.dest || out(o.bus));
  };
  /** 단순 음(주파수 미끄러짐 지원) */
  A.tone = function (f, o = {}) {
    if (!A.ctx()) return;
    const t = ctx.currentTime + (o.when || 0);
    const os = ctx.createOscillator(),
      g = ctx.createGain();
    os.type = o.type || "sine";
    os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + (o.dur || 0.2));
    const v = o.vol == null ? 0.25 : o.vol,
      dur = o.dur || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(g);
    g.connect(o.dest || out(o.bus));
    os.start(t);
    os.stop(t + dur + 0.05);
  };
  /** 잡음(바람·북·물 소리 재료) */
  A.noise = function (o = {}) {
    if (!A.ctx()) return;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + (o.when || 0),
      dur = o.dur || 0.2;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    let node = s;
    if (o.hp) {
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = o.hp;
      node.connect(f);
      node = f;
    }
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      node.connect(f);
      node = f;
    }
    if (o.bp) {
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = o.q || 1.2;
      f.frequency.setValueAtTime(o.bp, t);
      if (o.bpTo) f.frequency.exponentialRampToValueAtTime(o.bpTo, t + dur);
      node.connect(f);
      node = f;
    }
    const g = ctx.createGain();
    const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    g.connect(o.dest || out(o.bus));
    s.start(t, Math.random() * 0.4);
    s.stop(t + dur + 0.05);
  };
  A.kick = function (o = {}) {
    if (!A.ctx()) return;
    const t = ctx.currentTime + (o.when || 0);
    const os = ctx.createOscillator(),
      g = ctx.createGain();
    os.frequency.setValueAtTime(150, t);
    os.frequency.exponentialRampToValueAtTime(42, t + 0.28);
    g.gain.setValueAtTime(o.vol || 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    os.connect(g);
    g.connect(out(o.bus));
    os.start(t);
    os.stop(t + 0.4);
  };

  /* ---------------- 효과음 라이브러리 ---------------- */
  const SFX = {
    tap: () => A.note("G5", { inst: "marimba", dur: 0.25, vol: 0.22 }),
    tap2: () => A.note(KP.u.pick(["C5", "D5", "E5", "G5", "A5"]), { inst: "marimba", dur: 0.25, vol: 0.22 }),
    select: () => A.note("E5", { inst: "marimba", dur: 0.2, vol: 0.2 }),
    pop: () => {
      A.tone(900, { to: 320, dur: 0.12, vol: 0.3 });
      A.noise({ dur: 0.06, vol: 0.12, hp: 2500 });
    },
    bubble: () => A.tone(500 + Math.random() * 300, { to: 1400, dur: 0.12, vol: 0.22 }),
    good: () => ["C5", "E5", "G5"].forEach((n, i) => A.note(n, { when: i * 0.07, dur: 0.5, vol: 0.24 })),
    bad: () => {
      A.note("E4", { inst: "soft", dur: 0.18, vol: 0.18 });
      A.note("C4", { inst: "soft", dur: 0.32, vol: 0.16, when: 0.16 });
    },
    whoosh: () => A.noise({ dur: 0.45, vol: 0.18, bp: 400, bpTo: 2600, q: 0.8, attack: 0.08 }),
    sparkle: () => {
      for (let i = 0; i < 5; i++) A.note(A.hz("C6") * Math.pow(2, KP.u.rand(8) / 12), { when: i * 0.05, dur: 0.35, vol: 0.09 });
    },
    boom: () => {
      A.kick({ vol: 0.6 });
      A.noise({ dur: 0.5, vol: 0.14, lp: 1400 });
    },
    snap: () => {
      A.noise({ dur: 0.03, vol: 0.2, hp: 3000 });
      A.note("A5", { inst: "marimba", dur: 0.25, vol: 0.2, when: 0.02 });
    },
    drop: () => A.note("C4", { inst: "pluck", dur: 0.3, vol: 0.25 }),
    pick: () => A.tone(420, { to: 640, dur: 0.08, vol: 0.14 }),
    boing: () => A.tone(220, { to: 660, dur: 0.22, vol: 0.2, type: "triangle" }),
    slide: () => A.tone(880, { to: 330, dur: 0.3, vol: 0.14, type: "triangle" }),
    levelup: () => ["C5", "E5", "G5", "C6", "E6"].forEach((n, i) => A.note(n, { when: i * 0.06, dur: 0.45, vol: 0.2 })),
    sticker: () => {
      ["G5", "C6", "E6", "G6"].forEach((n, i) => A.note(n, { when: i * 0.08, dur: 0.6, vol: 0.18 }));
      A.noise({ dur: 0.5, vol: 0.05, hp: 6000, when: 0.25 });
    },
    open: () => {
      A.note("C5", { inst: "marimba", vol: 0.18, dur: 0.2 });
      A.note("G5", { inst: "marimba", vol: 0.18, dur: 0.25, when: 0.07 });
    },
    back: () => {
      A.note("G5", { inst: "marimba", vol: 0.16, dur: 0.2 });
      A.note("C5", { inst: "marimba", vol: 0.16, dur: 0.25, when: 0.07 });
    },
    water: () => A.noise({ dur: 0.35, vol: 0.12, bp: 900, bpTo: 2200, q: 2 }),
    rub: () => A.noise({ dur: 0.06, vol: 0.05, hp: 1500 }),
    tick: () => A.note("C6", { inst: "marimba", dur: 0.06, vol: 0.12 }),
  };
  A.sfx = function (name) {
    if (!A.ctx()) return;
    try {
      (SFX[name] || SFX.tap)();
    } catch (e) {}
  };

  /* ---------------- 동요 멜로디 (모두 다장조, [음, 박]) ---------------- */
  A.SONGS = {
    twinkle: {
      name: "반짝반짝 작은 별",
      notes: [["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2],
              ["G4",1],["G4",1],["F4",1],["F4",1],["E4",1],["E4",1],["D4",2],["G4",1],["G4",1],["F4",1],["F4",1],["E4",1],["E4",1],["D4",2],
              ["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2],["F4",1],["F4",1],["E4",1],["E4",1],["D4",1],["D4",1],["C4",2]],
    },
    airplane: {
      name: "비행기",
      notes: [["E4",1.5],["D4",0.5],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2],["D4",1],["D4",1],["D4",2],["E4",1],["G4",1],["G4",2],
              ["E4",1.5],["D4",0.5],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2],["D4",1],["D4",1],["E4",1.5],["D4",0.5],["C4",4]],
    },
    butterfly: {
      name: "나비야",
      notes: [["G4",1],["E4",1],["E4",2],["F4",1],["D4",1],["D4",2],["C4",1],["D4",1],["E4",1],["F4",1],["G4",1],["G4",1],["G4",2],
              ["G4",1],["E4",1],["E4",1],["E4",1],["F4",1],["D4",1],["D4",1],["D4",1],["C4",1],["E4",1],["G4",1],["G4",1],["E4",1],["E4",1],["E4",2]],
    },
    schoolbell: {
      name: "학교종",
      notes: [["G4",1],["G4",1],["A4",1],["A4",1],["G4",1],["G4",1],["E4",2],["G4",1],["G4",1],["E4",1],["E4",1],["D4",3],["R",1],
              ["G4",1],["G4",1],["A4",1],["A4",1],["G4",1],["G4",1],["E4",2],["G4",1],["E4",1],["D4",1],["E4",1],["C4",3],["R",1]],
    },
    bears: {
      name: "곰 세 마리",
      notes: [["C4",1],["C4",0.5],["C4",0.5],["C4",1],["C4",1],["E4",1],["G4",0.5],["G4",0.5],["E4",1],["C4",1],
              ["G4",0.5],["G4",0.5],["E4",1],["G4",0.5],["G4",0.5],["E4",1],["C4",1],["C4",1],["C4",2]],
    },
    birthday: {
      name: "생일 축하합니다",
      notes: [["G4",0.75],["G4",0.25],["A4",1],["G4",1],["C5",1],["B4",2],["G4",0.75],["G4",0.25],["A4",1],["G4",1],["D5",1],["C5",2],
              ["G4",0.75],["G4",0.25],["G5",1],["E5",1],["C5",1],["B4",1],["A4",1],["F5",0.75],["F5",0.25],["E5",1],["C5",1],["D5",1],["C5",3]],
    },
  };
  /** 첫 소절만(칭찬 징글용) */
  const JINGLES = [
    [["E4",1],["D4",1],["C4",1],["D4",1],["E4",1],["E4",1],["E4",2]],
    [["C4",1],["C4",1],["G4",1],["G4",1],["A4",1],["A4",1],["G4",2]],
    [["G4",1],["G4",1],["A4",1],["A4",1],["G4",1],["G4",1],["E4",2]],
    [["G4",1],["E4",1],["E4",2],["F4",1],["D4",1],["D4",2]],
    [["C4",1],["E4",1],["G4",1],["C5",1],["G4",1],["C5",3]],
    [["C5",1],["G4",1],["E4",1],["G4",1],["C5",1],["E5",3]],
  ];

  /** 멜로디 연주. 반환값: 재생 길이(초). octave: 옥타브 올림 수 */
  A.melody = function (notes, o = {}) {
    if (!A.ctx()) return 0;
    const beat = o.beat || 0.2,
      up = o.octave || 0;
    let t = o.when || 0;
    notes.forEach(([n, b]) => {
      if (n !== "R") {
        const f = A.hz(n) * Math.pow(2, up);
        A.note(f, { inst: o.inst || "bell", dur: Math.max(0.25, b * beat * 1.6), vol: o.vol || 0.22, when: t, bus: o.bus, dest: o.dest });
      }
      t += b * beat;
    });
    return t;
  };
  /** 성공 징글 (동요 첫 소절, 한 옥타브 위 오르골) */
  A.jingle = function () {
    const len = A.melody(KP.u.pick(JINGLES), { beat: 0.14, octave: 1, vol: 0.2 });
    A.sfx("sparkle");
    return len;
  };

  /* ---------------- 배경음악 (멜로디 + 화음 + 베이스) ---------------- */
  const CHORDS = { C: [0, 4, 7], F: [5, 9, 0], G: [7, 11, 2], Am: [9, 0, 4] };
  const ROOT = { C: "C3", F: "F2", G: "G2", Am: "A2" };
  function chordFor(notes) {
    // 두 박 구간의 음들을 가장 많이 품는 화음 고르기
    const pcs = notes.filter((n) => n !== "R").map((n) => A.midiOf(n) % 12);
    let best = "C",
      bs = -1;
    for (const [k, set] of Object.entries(CHORDS)) {
      let s = 0;
      pcs.forEach((p, i) => {
        if (set.includes(p)) s += i === 0 ? 2 : 1;
      });
      if (k === "C") s += 0.3;
      if (s > bs) {
        bs = s;
        best = k;
      }
    }
    return best;
  }
  const bgm = (A.bgm = { on: false, gain: null, timer: null, order: [], idx: 0 });
  function scheduleSong(key, startAt) {
    const song = A.SONGS[key].notes;
    const beat = 0.46;
    const dest = bgm.gain;
    // 멜로디(오르골)
    let t = 0;
    song.forEach(([n, b]) => {
      if (n !== "R")
        A.note(A.hz(n) * 2, { inst: "bell", dur: Math.max(0.35, b * beat * 1.5), vol: 0.13, when: startAt + t, dest });
      t += b * beat;
    });
    const total = t;
    // 2박 단위 화음 + 베이스
    let bt = 0;
    const timeline = [];
    song.forEach(([n, b]) => {
      timeline.push({ n, s: bt, e: bt + b });
      bt += b;
    });
    const c4 = A.hz("C4");
    for (let w = 0; w < bt; w += 2) {
      const inWin = timeline.filter((x) => x.s < w + 2 && x.e > w).map((x) => x.n);
      const ch = chordFor(inWin.length ? inWin : ["C4"]);
      const when = startAt + w * beat;
      CHORDS[ch].forEach((pc) => A.note(c4 * Math.pow(2, pc / 12), { inst: "pad", dur: beat * 2 - 0.05, vol: 0.035, when, dest }));
      A.note(ROOT[ch], { inst: "bass", dur: beat * 1.6, vol: 0.12, when, dest });
    }
    return total;
  }
  bgm.start = function () {
    if (!A.ctx() || bgm.on) return;
    bgm.on = true;
    bgm.gain = ctx.createGain();
    bgm.gain.gain.value = 1;
    bgm.gain.connect(bus.music);
    const next = () => {
      if (!bgm.on) return;
      if (!bgm.order.length || bgm.idx >= bgm.order.length) {
        bgm.order = KP.u.shuffle(["twinkle", "airplane", "butterfly", "schoolbell", "bears"]);
        bgm.idx = 0;
      }
      const len = scheduleSong(bgm.order[bgm.idx++], 0.15);
      bgm.timer = setTimeout(next, (len + 1.6) * 1000);
    };
    next();
  };
  bgm.stop = function () {
    bgm.on = false;
    clearTimeout(bgm.timer);
    if (bgm.gain && ctx) {
      const g = bgm.gain;
      g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      setTimeout(() => {
        try {
          g.disconnect();
        } catch (e) {}
      }, 900);
    }
    bgm.gain = null;
  };
})(window.KP);
