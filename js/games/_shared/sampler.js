/* =====================================================================
   🎻 샘플 재생기 (공용) — 실제 악기 녹음(assets/sounds, 오프라인 저장됨)을 음 높이 맞춰 재생
   - 악기마다 몇 개 음만 들어 있음 → 가장 가까운 음을 골라 playbackRate 로 음 높이 보정
   - 미리 불러와 디코딩해 두고(악기 묶음 단위) 같은 소리를 여러 번 겹쳐 재생 (동시에 많은 소리)
   - 오디오 컨텍스트·음량은 KP.audio 것을 그대로 씀(효과음 음량). 화면을 나가면 KP.audio.newScene 으로 같이 끊기고,
     stopAll() 로 바로 멈출 수도 있음
   - 못 불러온 악기는 ok(kit) 가 false → 놀이가 KP.audio 합성음으로 대신 냄
   - 소리 파일·출처: tools/make-sounds.js, assets/sounds/LICENSES.md (목록을 바꾸면 여기 KITS 도 같이)

   KP.sampler.load(["drums","piano"]) → Promise({ok:[...], fail:[...]})
   KP.sampler.ok("piano")
   KP.sampler.note("piano", "C4" | 60, { when, vol, dur, rel })   // when: 지금부터 몇 초 뒤 (KP.audio 와 같음)
   KP.sampler.hit("drums", "kick", { when, vol, rate, dur })       // 음 높이 없는 소리
   KP.sampler.stopAll()
===================================================================== */
"use strict";
(function () {
  const B = "assets/sounds/";
  // notes: 녹음된 실제 음(미디 번호) → 파일 / hits: 이름 → 파일 / rel: 놓은 뒤 사라지는 시간(초)
  const KITS = {
    drums: { base: B + "drums/", hits: { kick: "kick.mp3", kick2: "kick2.mp3", snare: "snare.mp3", snareSoft: "snare-soft.mp3", hat: "hat.mp3", hatOpen: "hat-open.mp3", crash: "crash.mp3" } },
    tamb: { base: B + "tamb/", hits: { hit: "hit.mp3", shake: "shake.mp3" } },
    shaker: { base: B + "shaker/", hits: { down: "down.mp3", up: "up.mp3" } },
    xylo: { base: B + "xylo/", notes: { 67: "G4.mp3", 72: "C5.mp3", 79: "G5.mp3", 84: "C6.mp3", 91: "G6.mp3" }, rel: 0.15 },
    piano: { base: B + "piano/", notes: { 48: "C3.mp3", 54: "Fs3.mp3", 60: "C4.mp3", 66: "Fs4.mp3", 72: "C5.mp3", 78: "Fs5.mp3" }, rel: 0.25 },
    guitar: { base: B + "guitar/", notes: { 43: "G2.mp3", 48: "C3.mp3", 52: "E3.mp3", 56: "Ab3.mp3", 60: "C4.mp3", 64: "E4.mp3", 68: "Ab4.mp3" }, rel: 0.2 },
    choir: { base: B + "choir/", notes: { 60: "C4.mp3", 64: "E4.mp3", 68: "Ab4.mp3", 72: "C5.mp3" }, rel: 0.35 },
  };
  const bufs = {}; // url → {buf, off} (off: 앞 무음 건너뛸 초)
  const kitState = {}; // kit → "loading" | "ok" | "fail"
  const kitWait = {}; // kit → Promise
  const voices = new Set();
  const MAXV = 40; // 동시에 너무 많으면 오래된 소리부터 끔 (저가 기기)
  let errors = [];

  const midiOf = (n) => (typeof n === "number" ? n : KP.audio.midiOf(n));
  const decode = (c, ab) =>
    new Promise((res, rej) => {
      // 옛 Safari 는 콜백 방식만 됨 → 둘 다 받음
      const p = c.decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  /** mp3 앞에 붙는 인코더 지연(약 25ms, 브라우저마다 다름)을 디코딩한 소리에서 직접 찾아 건너뜀 → 모든 소리가 박자에 딱 맞게 */
  function leadOf(buf) {
    const d = buf.getChannelData(0), n = Math.min(d.length, Math.floor(buf.sampleRate * 0.12));
    for (let i = 0; i < n; i++) if (Math.abs(d[i]) > 0.004) return Math.max(0, i / buf.sampleRate - 0.002);
    return 0;
  }
  async function loadOne(c, url) {
    if (bufs[url]) return bufs[url];
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status + " " + url);
    const buf = await decode(c, await r.arrayBuffer());
    return (bufs[url] = { buf, off: leadOf(buf) });
  }
  function filesOf(k) {
    const K = KITS[k];
    return Object.values(K.notes || K.hits).map((f) => K.base + f);
  }

  const S = (KP.sampler = {
    KITS,
    /** 악기 묶음들을 불러옴 (이미 불러온 건 바로) */
    load(kits) {
      const c = KP.audio.ctx();
      if (!c) return Promise.resolve({ ok: [], fail: kits.slice() });
      return Promise.all(
        kits.map((k) => {
          if (!KITS[k]) return Promise.resolve([k, false]);
          if (kitState[k] === "ok") return Promise.resolve([k, true]);
          if (kitState[k] !== "loading") {
            kitState[k] = "loading";
            kitWait[k] = Promise.all(filesOf(k).map((u) => loadOne(c, u)))
              .then(() => (kitState[k] = "ok"))
              .catch((e) => {
                kitState[k] = "fail"; // 다음에 다시 시도
                errors.push(String((e && e.message) || e));
                console.warn("소리 샘플을 못 불러왔어요", k, e && e.message);
              });
          }
          return kitWait[k].then(() => [k, kitState[k] === "ok"]);
        })
      ).then((rs) => ({ ok: rs.filter((r) => r[1]).map((r) => r[0]), fail: rs.filter((r) => !r[1]).map((r) => r[0]) }));
    },
    ok(k) {
      return kitState[k] === "ok";
    },
    /** 음 하나: 가장 가까운 녹음 음을 골라 음 높이 보정. 성공하면 true (못 내면 false → 합성음으로 대신) */
    note(k, n, o = {}) {
      const K = KITS[k];
      if (!K || !K.notes || kitState[k] !== "ok") return false;
      const m = midiOf(n);
      let best = null, bd = 1e9;
      for (const s in K.notes) {
        const d = Math.abs(m - s);
        if (d < bd || (d === bd && +s > m)) (bd = d), (best = +s); // 같으면 위 음을 내려서 (내린 소리가 덜 탁함)
      }
      return play(K.base + K.notes[best], Math.pow(2, (m - best) / 12), o, o.rel != null ? o.rel : K.rel);
    },
    /** 음 높이 없는 소리 (북·탬버린 …) — rate 로 살짝 음색 바꾸기 가능 */
    hit(k, name, o = {}) {
      const K = KITS[k];
      if (!K || !K.hits || !K.hits[name] || kitState[k] !== "ok") return false;
      return play(K.base + K.hits[name], o.rate || 1, o, o.rel != null ? o.rel : 0.08);
    },
    stopAll() {
      const c = KP.audio.ctx && KP.audio.ctx();
      for (const v of voices) {
        try {
          if (c) {
            v.g.gain.cancelScheduledValues(c.currentTime);
            v.g.gain.setTargetAtTime(0, c.currentTime, 0.02);
          }
          v.s.stop(c ? c.currentTime + 0.08 : 0);
        } catch (e) {}
      }
      voices.clear();
    },
    /** 점검용 */
    stats() {
      return { kits: Object.assign({}, kitState), files: Object.keys(bufs).length, voices: voices.size, errors: errors.slice() };
    },
  });

  function play(url, rate, o, rel) {
    const b = bufs[url], c = KP.audio.ctx(), dest = KP.audio.dest(o.bus);
    if (!b || !c || !dest) return false;
    if (voices.size >= MAXV) {
      // 가장 먼저 시작한 소리를 살짝 줄이며 끔
      const v = voices.values().next().value;
      voices.delete(v);
      try {
        v.g.gain.setTargetAtTime(0, c.currentTime, 0.015);
        v.s.stop(c.currentTime + 0.06);
      } catch (e) {}
    }
    const t = c.currentTime + Math.max(0, o.when || 0);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b.buf;
    s.playbackRate.value = rate;
    const vol = o.vol == null ? 0.5 : o.vol;
    g.gain.setValueAtTime(vol, t);
    const len = (b.buf.duration - b.off) / rate; // 실제로 울리는 길이
    let end = t + len;
    if (o.dur && o.dur < len) {
      // 놓기: dur 뒤에 rel 동안 부드럽게 줄임
      const r = Math.max(0.03, rel);
      g.gain.setValueAtTime(vol, t + o.dur);
      g.gain.setTargetAtTime(0.0001, t + o.dur, r / 3);
      end = Math.min(end, t + o.dur + r + 0.05);
    }
    s.connect(g);
    g.connect(dest);
    s.start(t, b.off);
    s.stop(end + 0.02);
    const v = { s, g };
    voices.add(v);
    s.onended = () => {
      voices.delete(v);
      try {
        g.disconnect();
      } catch (e) {}
    };
    return true;
  }
})();
