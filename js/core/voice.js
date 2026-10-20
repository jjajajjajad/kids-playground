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
  /* 놀이 카드를 누르면 이름을 읽는데, 곧바로 열리는 놀이 화면이 그 소리를 끊지 않게:
     이름을 다 읽을 때까지(최대 3초) 다른 말은 이름 뒤로 미루고, 멈춤 요청도 무시 */
  let holdP = null,
    holdUntil = 0;
  V.hold = function (text) {
    holdUntil = performance.now() + 3000;
    const p = (holdP = sayNow(text, {}));
    p.then(() => {
      if (holdP === p) {
        holdP = null;
        holdUntil = 0;
      }
    });
    return p;
  };
  const holding = () => holdP && performance.now() < holdUntil;
  V.say = function (text, o = {}) {
    if (holding() && !o.queue) {
      const p = holdP;
      return p.then(() => sayNow(text, o));
    }
    return sayNow(text, o);
  };
  function sayNow(text, o = {}) {
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
  }
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
    // 새 말이 시작되면 이전 말(자연 음성·녹음·받는 중인 것)을 먼저 멈춤 → 두 목소리가 겹치지 않게
    if (!o.queue) {
      stopNatural();
      try {
        if (clipAudio) clipAudio.pause();
      } catch (e) {}
    } else if (natSrcs.length && KP.audio.ctx()) {
      // 이어 말하기인데 자연 음성이 아직 나오는 중이면 끝난 뒤에
      const wait = Math.max(0, (natEnd - KP.audio.ctx().currentTime) * 1000);
      if (wait > 30 && !(natOn() && natUrls(text))) return void setTimeout(() => speakTTS(text, o, vol), wait + 60);
    }
    // 자연 음성(미리 만든 음성 파일): 문장의 모든 조각이 있으면 그걸로
    if (natOn()) {
      // 영어 낱말도 미리 만든 음성이 있으면 그것으로 ("A! Apple!")
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
  // 저장소 이름은 빌드가 정함(js/gen/clips.js 의 KP.VOICE_CACHE, sw.js 와 같은 이름) — clips.js 가 이 파일 뒤에 불려서 쓸 때 읽음
  const VCACHE = () => KP.VOICE_CACHE;
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
  /* 문장 → 음성 파일 목록. 각 문장 조각(! ? . 로 끊은 것)마다
       ① 통째로 있으면 그것 ② 끝 문장부호만 다른 것("오리!" ↔ "오리")
       ③ 낱말 단위로 나눠 가장 적은 조각으로 이어 붙이기("토끼를" + "상자 안에 쏙 넣어 줘!")
     하나라도 못 찾으면 null(→ 기기 목소리로 문장 전체). 조각 사이 쉼: 문장 사이 0.08초, 낱말 사이 0.02초 */
  const bare = (t) => t.replace(/[!?.…~,\s]+$/u, "");
  let bareMap = null,
    bareFor = null;
  function lookup(k) {
    const M = KP.VOICE_CLIPS;
    if (M[k]) return M[k];
    // 숫자만 있으면 한자어 읽기로 ("3" → "삼")
    const dm = /^(\d{1,3})([!?.]?)$/.exec(k);
    if (dm && KP.u && KP.u.numSino && +dm[1] > 0 && +dm[1] <= 100) return lookup(KP.u.numSino(+dm[1]) + "!");
    if (bareFor !== M) {
      bareFor = M;
      bareMap = new Map();
      for (const key in M) {
        const b = bare(key);
        if (b && !bareMap.has(b)) bareMap.set(b, M[key]);
      }
    }
    return bareMap.get(bare(k)) || null;
  }
  function splitWords(seg) {
    const w = seg.split(" ");
    const n = w.length;
    // best[i] = w[i..] 를 덮는 가장 적은 조각 목록
    const best = new Array(n + 1);
    best[n] = [];
    for (let i = n - 1; i >= 0; i--) {
      for (let j = n; j > i; j--) {
        if (!best[j]) continue;
        const u = lookup(w.slice(i, j).join(" "));
        if (u && (!best[i] || best[j].length + 1 < best[i].length)) best[i] = [u].concat(best[j]);
      }
    }
    return best[0] || null;
  }
  function natUrls(text) {
    const M = KP.VOICE_CLIPS;
    if (!M) return null;
    const ss = segs(norm(text));
    if (!ss.length) return null;
    const out = [],
      gaps = [];
    for (let k = 0; k < ss.length; k++) {
      const one = lookup(ss[k]);
      const parts = one ? [one] : splitWords(ss[k]);
      if (!parts) return null;
      parts.forEach((u, i) => {
        out.push(u);
        gaps.push(i < parts.length - 1 ? 0.02 : 0.08);
      });
    }
    out.gaps = gaps;
    return out;
  }
  V._natUrls = natUrls; // 점검용
  /** 앞뒤 빈 소리 잘라내기(조각을 이어 붙일 때 덜 끊기게) — 앞뒤 0.03초만 남김 */
  function trim(c, b) {
    try {
      const d = b.getChannelData(0),
        th = 0.012,
        pad = Math.round(b.sampleRate * 0.03);
      let a = 0,
        z = d.length - 1;
      while (a < d.length && Math.abs(d[a]) < th) a++;
      while (z > a && Math.abs(d[z]) < th) z--;
      a = Math.max(0, a - pad);
      z = Math.min(d.length - 1, z + pad);
      if (z - a < b.sampleRate * 0.05 || (a < pad * 2 && d.length - 1 - z < pad * 2)) return b;
      const nb = c.createBuffer(b.numberOfChannels, z - a + 1, b.sampleRate);
      for (let ch = 0; ch < b.numberOfChannels; ch++) nb.getChannelData(ch).set(b.getChannelData(ch).subarray(a, z + 1));
      return nb;
    } catch (e) {
      return b;
    }
  }
  const bufs = new Map(),
    loading = new Map(),
    nocors = new Set(); // 내려받기(CORS)가 막힌 주소 → 소리만 바로 재생(인터넷 필요)
  const failed = new Set();
  // 기기 저장소에 이미 받아 둔 주소 (있으면 인터넷 없이 금방 풀 수 있음 → 기기 목소리로 바꾸지 않고 기다림)
  const stored = new Set();
  let storedReady = null;
  function loadStored() {
    if (!storedReady)
      storedReady = (async () => {
        try {
          const c = await caches.open(VCACHE());
          (await c.keys()).forEach((r) => stored.add(r.url));
        } catch (e) {}
      })();
    return storedReady;
  }
  V.loadStored = loadStored;
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
        cache = await caches.open(VCACHE());
        resp = await cache.match(url);
      } catch (e) {}
      if (!resp) {
        const r = await fetch(url, { mode: "cors", credentials: "omit" });
        if (!r.ok) throw new Error("http " + r.status);
        if (cache) {
          try {
            await cache.put(url, r.clone());
            stored.add(url);
          } catch (e) {}
        }
        resp = r;
      }
      const ab = await resp.arrayBuffer();
      // 옛 Safari 는 콜백만, 요즘 브라우저는 Promise 도 돌려줌 → 둘 다 받아 처리(실패가 밖으로 새지 않게)
      const b = trim(
        c,
        await new Promise((res, rej) => {
          const pr = c.decodeAudioData(ab, res, rej);
          if (pr && pr.catch) pr.catch(rej);
        })
      );
      bufs.set(url, b);
      // 풀어 둔 소리는 최근 60개만 (수천 개를 다 풀면 메모리를 수백 MB 차지)
      if (bufs.size > 60) bufs.delete(bufs.keys().next().value);
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
  // 재생이 실제로 성공했을 때만 깨운 것으로 침 → 실패하면 다음 터치에서 다시 시도
  let el = null,
    elTrying = false;
  V.unlockEl = function () {
    if (el || elTrying) return;
    try {
      const a = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=");
      elTrying = true;
      Promise.resolve(a.play())
        .then(() => {
          a.pause();
          el = a;
        })
        .catch(() => {})
        .finally(() => (elTrying = false));
    } catch (e) {
      elTrying = false;
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
    const onDisk = urls.every((u) => bufs.has(u) || stored.has(u));
    const all = Promise.all(urls.map(loadBuf));
    // 기기에 저장된 파일이면 풀 때까지 기다림(최대 4초), 인터넷에서 받아야 하면 1.2초 넘으면 이번만 기기 목소리
    const late = new Promise((res) => setTimeout(() => res("late"), ready ? 0 : onDisk ? 4000 : 1200));
    Promise.race([all, late])
      .then((list) => {
        if (tok !== natTok) return;
        if (list === "late") return speakTTS(text, o, vol); // 이번엔 기계 음성, 파일은 계속 받는 중
        if (o.queue && has && (speechSynthesis.speaking || speechSynthesis.pending) && !(o._w > 80)) {
          // 이어 말하기: 기기 목소리가 끝날 때까지 기다렸다가(최대 8초) — 끊지도 겹치지도 않게
          o._w = (o._w || 0) + 1;
          return setTimeout(() => tok === natTok && playNatural(text, urls, o, vol), 100);
        }
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
          t += b.duration + (i < list.length - 1 ? (urls.gaps ? urls.gaps[i] : 0.08) : 0);
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
  /** 파일만 기기 저장소에 받아 두기(풀지는 않음) — 4개씩 동시에 */
  async function store(url, cache) {
    if (stored.has(url)) return true;
    if (cache && (await cache.match(url))) return (stored.add(url), true);
    const r = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!r.ok) throw new Error("http " + r.status);
    if (cache) {
      await cache.put(url, r);
      stored.add(url);
    }
    return true;
  }
  /** 지금 목록(VOICE_CLIPS)에 없는 옛 음성 파일을 저장소에서 지움 */
  async function prune(cache) {
    try {
      const keep = new Set(Object.values(KP.VOICE_CLIPS || {}));
      if (!keep.size) return; // 목록이 비었으면(빌드 이상) 지우지 않음
      for (const r of await cache.keys())
        if (!keep.has(r.url)) {
          await cache.delete(r);
          stored.delete(r.url);
        }
    } catch (e) {}
  }
  // 데이터 절약 모드·휴대폰 데이터(셀룰러)면 자동으로 전부 받지 않음 (설정 화면 버튼은 그대로 받음)
  const metered = () => {
    const c = navigator.connection;
    return !!(c && (c.saveData || c.type === "cellular"));
  };
  let prefetching = null;
  /** @param {Function} [onProg] 진행 표시(설정 화면) — 주면 직접 누른 것으로 보고 force
   *  @param {{force?:boolean}} [o] force: 셀룰러·데이터 절약이어도 받기 */
  V.prefetch = function (onProg, o = {}) {
    const force = !!(onProg || o.force);
    if (prefetching && !onProg) return prefetching;
    const run = async () => {
      await loadStored();
      const L = Object.values(KP.VOICE_CLIPS || {});
      let cache = null;
      try {
        cache = await caches.open(VCACHE());
      } catch (e) {}
      if (!cache) return V.natStats;
      if (!force && metered()) {
        await prune(cache);
        return V.natStats;
      }
      let i = 0,
        done = 0,
        corsFail = 0;
      const worker = async () => {
        while (i < L.length) {
          const u = L[i++];
          try {
            await store(u, cache);
            failed.delete(u);
          } catch (e) {
            failed.add(u);
            if (/fetch|network|cors|load failed/i.test(String(e.message || e)) && navigator.onLine !== false) {
              nocors.add(u);
              corsFail++;
            }
          }
          done++;
          if (onProg) onProg(done, L.length);
          // 처음 몇 개가 모두 막히면(서버가 저장을 막음) 더 받지 않음
          if (done === 8 && corsFail === 8) i = L.length;
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      await prune(cache);
      V.natStats.fail = failed.size;
      return V.natStats;
    };
    const p = run().finally(() => prefetching === p && (prefetching = null));
    prefetching = p;
    return p;
  };
  /** 상태 보고: 전체 · 기기 저장소에 있는 것 · 못 받은 것 · 저장은 막혔지만 바로 재생 가능한 것 */
  V.natReport = async function () {
    const L = Object.values(KP.VOICE_CLIPS || {});
    let stored = 0;
    try {
      const c = await caches.open(VCACHE());
      const keys = new Set((await c.keys()).map((r) => r.url));
      stored = L.filter((u) => keys.has(u)).length;
    } catch (e) {}
    return { total: L.length, stored, ready: bufs.size, failed: failed.size, nocors: nocors.size, online: navigator.onLine !== false };
  };
  V.natCount = () => Object.keys(KP.VOICE_CLIPS || {}).length;
  /** 지금 말하는 중인지 (마이크 놀이에서 앱 목소리를 아이 소리로 잘못 듣지 않게) */
  V.busy = function () {
    try {
      if (has && (speechSynthesis.speaking || speechSynthesis.pending)) return true;
    } catch (e) {}
    if (natSrcs.length) return true;
    if (el && !el.paused && !el.ended) return true;
    if (clipAudio && !clipAudio.paused && !clipAudio.ended) return true;
    return false;
  };

  V.stop = function () {
    if (holding()) return; // 놀이 이름을 읽는 중
    stopNatural();
    try {
      if (has) speechSynthesis.cancel();
      if (clipAudio) clipAudio.pause();
    } catch (e) {}
    KP.audio && KP.audio.duck(false);
  };
})(window.KP);
