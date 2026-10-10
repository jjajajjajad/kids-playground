/* =====================================================================
   목소리 안내 (기기 내장 음성 합성)
   - 기기에 있는 한국어 음성 중 가장 자연스러운 것을 자동 선택
     (iPad: Yuna/Sora 계열, Android: Google 한국어)
   - 말하는 동안 배경음악 자동으로 줄이기
   - 녹음 파일 연결용 자리(KP.voice.clips): 문장 → 오디오 파일 경로
===================================================================== */
"use strict";
(function (KP) {
  const V = (KP.voice = { clips: {} });
  const has = typeof window !== "undefined" && "speechSynthesis" in window;
  let voices = [],
    ko = null,
    en = null,
    current = null,
    clipAudio = null;

  function score(v, lang) {
    if (!v.lang || !v.lang.toLowerCase().startsWith(lang)) return -1;
    let s = 0;
    const n = v.name || "";
    if (/premium|enhanced|고품질|향상/i.test(n)) s += 6;
    if (/yuna|sora|유나|소라/i.test(n)) s += 5;
    if (/google/i.test(n)) s += 4;
    if (/samantha|ava|allison|susan/i.test(n)) s += 4;
    if (/heami|sunhi|injoon/i.test(n)) s += 2;
    if (/female|여/i.test(n)) s += 1;
    if (v.localService) s += 1;
    if (/compact|eloquence|grandma|grandpa|rocko|shelley|flo|reed|sandy|eddy/i.test(n)) s -= 4;
    return s;
  }
  function load() {
    if (!has) return;
    voices = speechSynthesis.getVoices() || [];
    const best = (lang) => voices.reduce((b, v) => (score(v, lang) > (b ? score(b, lang) : -1) ? v : b), null);
    ko = best("ko");
    en = best("en");
  }
  if (has) {
    load();
    try {
      speechSynthesis.addEventListener("voiceschanged", load);
    } catch (e) {
      speechSynthesis.onvoiceschanged = load;
    }
  }
  V.available = () => has;
  V.koName = () => (ko ? ko.name : "");

  function volume() {
    return KP.settings ? KP.settings.get().voice : 1;
  }
  function done(fn) {
    KP.audio && KP.audio.duck(false);
    if (fn) fn();
  }

  /**
   * 말하기
   * @param {string} text
   * @param {{en?:boolean, queue?:boolean, rate?:number, pitch?:number, onend?:Function}} o
   */
  V.say = function (text, o = {}) {
    // 말이 끝나면 resolve 되는 Promise (음성이 없어도 글자 수로 대략 기다림)
    return new Promise((resolve) => {
      let fin = false;
      const est = setTimeout(() => {
        if (!fin) {
          fin = true;
          KP.audio && KP.audio.duck(false); // onend 가 안 오는 기기 대비
          resolve();
        }
      }, 900 + String(text || "").length * 170);
      sayRaw(text, Object.assign({}, o, {
        onend() {
          clearTimeout(est);
          if (!fin) {
            fin = true;
            resolve();
          }
          if (o.onend) o.onend();
        },
      }));
    });
  };
  function sayRaw(text, o) {
    if (!text) return o.onend && o.onend();
    const vol = volume();
    // 녹음 파일이 등록되어 있으면 녹음 우선
    const clip = V.clips[text];
    if (clip && vol > 0) {
      try {
        if (clipAudio) clipAudio.pause();
        if (has) speechSynthesis.cancel();
        clipAudio = new Audio(clip);
        clipAudio.volume = vol;
        KP.audio && KP.audio.duck(true);
        clipAudio.onended = () => done(o.onend);
        clipAudio.play().catch(() => done(o.onend));
        return;
      } catch (e) {}
    }
    if (vol <= 0) {
      if (o.onend) setTimeout(o.onend, 300);
      return;
    }
    // 자연 음성(미리 만든 음성 파일): 문장의 모든 조각이 있으면 그걸로
    if (!o.en && natOn()) {
      const urls = natUrls(text);
      if (urls) return playNatural(text, urls, o, vol);
    }
    speakTTS(text, o, vol);
  }
  function speakTTS(text, o, vol) {
    V.lastVia = "tts";
    if (!has) {
      if (o.onend) setTimeout(o.onend, 300);
      return;
    }
    try {
      if (!voices.length) load();
      const busy = speechSynthesis.speaking || speechSynthesis.pending;
      if (!o.queue && busy) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = o.en ? en : ko;
      if (v) u.voice = v;
      u.lang = o.en ? "en-US" : "ko-KR";
      u.rate = o.rate || (o.en ? 0.85 : 0.95);
      u.pitch = o.pitch || 1.12;
      u.volume = vol;
      u.onstart = () => KP.audio && KP.audio.duck(true);
      u.onend = () => {
        if (current === u) current = null;
        done(o.onend);
      };
      u.onerror = () => done(o.onend);
      current = u;
      // iOS Safari: cancel() 직후 바로 speak() 하면 가끔 무시되므로 살짝 띄움
      if (!o.queue && busy) setTimeout(() => current === u && speechSynthesis.speak(u), 60);
      else speechSynthesis.speak(u);
      if (speechSynthesis.paused) speechSynthesis.resume();
    } catch (e) {
      if (o.onend) setTimeout(o.onend, 300);
    }
  }
  V.en = (text, o = {}) => V.say(text, Object.assign({ en: true }, o));

  /* ---------------- 자연 음성 (미리 만든 음성 파일) ----------------
     - KP.VOICE_CLIPS: 문장 조각 → 음성 파일 주소 (js/gen/clips.js, 빌드 때 생성)
     - 문장을 '!', '?', '.' 뒤에서 조각으로 나눠, 모든 조각에 파일이 있으면 이어서 재생.
       하나라도 없으면 기계 음성(한 목소리로 끝까지 — 섞이면 어색해서)
     - 처음 받을 때 기기 저장소(Cache)에 넣어 두어 그 뒤로는 인터넷 없이도 재생
     - 아직 안 받아진 파일이 늦게 오면(1.2초) 이번엔 기계 음성으로 말하고, 받는 건 계속 */
  const VCACHE = "kp-voice-1";
  const natOn = () => !KP.settings || KP.settings.get().natural !== false;
  const norm = (t) => String(t || "").replace(/\p{Extended_Pictographic}|\uFE0F/gu, "").replace(/\s+/g, " ").trim();
  function segs(t) {
    const out = [];
    let cur = "";
    for (let i = 0; i < t.length; i++) {
      cur += t[i];
      if ("!?.".includes(t[i]) && (i + 1 >= t.length || t[i + 1] === " ")) {
        if (cur.trim()) out.push(cur.trim());
        cur = "";
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function natUrls(text) {
    const M = KP.VOICE_CLIPS;
    if (!M) return null;
    const ss = segs(norm(text));
    if (!ss.length) return null;
    const u = ss.map((x) => M[x]);
    return u.every(Boolean) ? u : null;
  }
  const bufs = new Map(),
    loading = new Map(),
    nocors = new Set(); // 내려받기(CORS)가 막힌 주소 → 소리만 바로 재생(인터넷 필요)
  const failed = new Set();
  V.natStats = { ok: 0, fail: 0 };
  V.lastVia = ""; // 방금 말한 방식: natural(자연 음성) · el(자연 음성, 저장 안 됨) · tts(기기 음성)
  function loadBuf(url) {
    if (bufs.has(url)) return Promise.resolve(bufs.get(url));
    if (loading.has(url)) return loading.get(url);
    const c = KP.audio && KP.audio.ctx();
    if (!c) return Promise.reject(new Error("no audio"));
    const p = (async () => {
      let resp = null,
        cache = null;
      try {
        cache = await caches.open(VCACHE);
        resp = await cache.match(url);
      } catch (e) {}
      if (!resp) {
        const r = await fetch(url, { mode: "cors", credentials: "omit" });
        if (!r.ok) throw new Error("http " + r.status);
        if (cache) {
          try {
            await cache.put(url, r.clone());
          } catch (e) {}
        }
        resp = r;
      }
      const ab = await resp.arrayBuffer();
      // 옛 Safari 는 콜백만, 요즘 브라우저는 Promise 도 돌려줌 → 둘 다 받아 처리(실패가 밖으로 새지 않게)
      const b = await new Promise((res, rej) => {
        const pr = c.decodeAudioData(ab, res, rej);
        if (pr && pr.catch) pr.catch(rej);
      });
      bufs.set(url, b);
      failed.delete(url);
      V.natStats.ok = bufs.size;
      return b;
    })();
    loading.set(url, p);
    p.catch((e) => {
      loading.delete(url);
      failed.add(url);
      V.natStats.fail = failed.size;
      if (e && /fetch|network|cors|load failed/i.test(String(e.message || e)) && navigator.onLine !== false) nocors.add(url);
    });
    return p;
  }
  // iOS: 오디오 요소는 터치 안에서 한 번 재생해 둔 것만 나중에 자유롭게 재생 가능 → 하나를 미리 깨워 둠
  let el = null;
  V.unlockEl = function () {
    if (el) return;
    try {
      el = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=");
      el.play().then(() => el.pause()).catch(() => {});
    } catch (e) {
      el = null;
    }
  };
  function playEl(text, urls, o, vol, tok) {
    if (!el) return speakTTS(text, o, vol);
    let i = 0;
    V.lastVia = "el";
    KP.audio.duck(true);
    const next = () => {
      if (tok !== natTok) return;
      if (i >= urls.length) return done(o.onend);
      el.src = urls[i++];
      el.volume = Math.min(1, vol);
      el.onended = () => setTimeout(next, 80);
      el.onerror = () => tok === natTok && speakTTS(text, o, vol);
      el.play().catch(() => tok === natTok && speakTTS(text, o, vol));
    };
    next();
  }
  let natTok = 0,
    natSrcs = [],
    natEnd = 0;
  function playNatural(text, urls, o, vol) {
    const c = KP.audio.ctx();
    if (!c) return speakTTS(text, o, vol);
    const tok = ++natTok;
    if (!o.queue) stopNatural(true);
    if (urls.some((u) => nocors.has(u)) && navigator.onLine !== false) {
      try {
        if (has) speechSynthesis.cancel();
      } catch (e) {}
      return playEl(text, urls, o, vol, tok);
    }
    const ready = urls.every((u) => bufs.has(u));
    const all = Promise.all(urls.map(loadBuf));
    const late = new Promise((res) => setTimeout(() => res("late"), ready ? 0 : 1200));
    Promise.race([all, late])
      .then((list) => {
        if (tok !== natTok) return;
        if (list === "late") return speakTTS(text, o, vol); // 이번엔 기계 음성, 파일은 계속 받는 중
        try {
          if (has) speechSynthesis.cancel();
        } catch (e) {}
        V.lastVia = "natural";
        KP.audio.duck(true);
        const g = c.createGain();
        g.gain.value = Math.min(1, vol * 1.1);
        g.connect(c.destination);
        let t = Math.max(c.currentTime + 0.03, o.queue ? natEnd : 0);
        const mine = [];
        list.forEach((b, i) => {
          const src = c.createBufferSource();
          src.buffer = b;
          src.connect(g);
          src.start(t);
          t += b.duration + (i < list.length - 1 ? 0.08 : 0);
          mine.push(src);
          natSrcs.push(src);
        });
        mine[mine.length - 1].onended = () => {
          natSrcs = natSrcs.filter((x) => !mine.includes(x));
          if (!natSrcs.length) done(o.onend);
          else if (o.onend) o.onend();
        };
        natEnd = t;
      })
      .catch(() => {
        if (tok === natTok) speakTTS(text, o, vol);
      });
  }
  function stopNatural(keepTok) {
    if (!keepTok) natTok++;
    try {
      if (el && !el.paused) el.pause();
    } catch (e) {}
    natSrcs.forEach((s) => {
      try {
        s.onended = null;
        s.stop();
      } catch (e) {}
    });
    natSrcs = [];
    natEnd = 0;
  }
  /** 자연 음성 파일을 미리 받아 두기 (첫 터치 뒤 한가할 때) */
  V.prefetch = async function (onProg) {
    const L = Object.values(KP.VOICE_CLIPS || {});
    for (let i = 0; i < L.length; i++) {
      try {
        await loadBuf(L[i]);
      } catch (e) {}
      if (onProg) onProg(i + 1, L.length);
      await new Promise((r) => setTimeout(r, 40));
    }
    return V.natStats;
  };
  /** 상태 보고: 전체 · 기기 저장소에 있는 것 · 못 받은 것 · 저장은 막혔지만 바로 재생 가능한 것 */
  V.natReport = async function () {
    const L = Object.values(KP.VOICE_CLIPS || {});
    let stored = 0;
    try {
      const c = await caches.open(VCACHE);
      const keys = new Set((await c.keys()).map((r) => r.url));
      stored = L.filter((u) => keys.has(u)).length;
    } catch (e) {}
    return { total: L.length, stored, ready: bufs.size, failed: failed.size, nocors: nocors.size, online: navigator.onLine !== false };
  };
  V.natCount = () => Object.keys(KP.VOICE_CLIPS || {}).length;

  V.stop = function () {
    stopNatural();
    try {
      if (has) speechSynthesis.cancel();
      if (clipAudio) clipAudio.pause();
    } catch (e) {}
    KP.audio && KP.audio.duck(false);
  };
})(window.KP);
