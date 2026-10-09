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
    if (!has || vol <= 0) {
      if (o.onend) setTimeout(o.onend, 300);
      return;
    }
    try {
      if (!voices.length) load();
      if (!o.queue) speechSynthesis.cancel();
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
      speechSynthesis.speak(u);
      if (speechSynthesis.paused) speechSynthesis.resume();
    } catch (e) {
      if (o.onend) setTimeout(o.onend, 300);
    }
  }
  V.en = (text, o = {}) => V.say(text, Object.assign({ en: true }, o));
  V.stop = function () {
    try {
      if (has) speechSynthesis.cancel();
      if (clipAudio) clipAudio.pause();
    } catch (e) {}
    KP.audio && KP.audio.duck(false);
  };
})(window.KP);
