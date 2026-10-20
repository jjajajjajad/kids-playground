/* =====================================================================
   설정 값 (영구 저장) — 화면(부모 설정 패널)은 pages.js
===================================================================== */
"use strict";
(function (KP) {
  const DEF = {
    sfx: 0.8, // 효과음 음량 0~1
    music: 0.35, // 배경음악 음량
    voice: 1, // 목소리 음량
    bgm: false, // 배경음악 켜짐
    timer: 0, // 하루 사용 시간(분), 0 = 제한 없음
    hidden: {}, // 숨긴 게임 {id:true}
    lastCat: "play", // 마지막으로 본 메뉴
    hints: true, // 손가락 힌트
    natural: true, // 자연 음성(미리 만든 음성 파일) 쓰기
    lock: true, // 게임 잠금: 오늘 날짜(한국 시간 8자리)를 넣어야 열림
    lockCats: ["play", "make", "music", "smart", "bigkid"], // 잠글 카테고리 (공부 놀이는 바로)
    kidGate: false, // 아이용 문지기 퀴즈로도 열기 (기본 끔: 열쇠 별 모으기를 씀)
    kidQ: 3, // 맞혀야 할 문제 수
    kidMin: 20, // 열리는 시간(분)
    kidQuizMax: 2, // 문지기 퀴즈로 열 수 있는 횟수(하루)
    earnOn: true, // 열쇠 별 모으기 → 문 열기
    earnStars: 5, // 문 여는 데 필요한 별
    earnMin: 15, // 문이 열리는 시간(분)
    earnCapMin: 45, // 하루에 별로 열 수 있는 최대 시간(분), 0 = 제한 없음
    earnPerGame: 3, // 같은 놀이에서 하루에 받을 수 있는 별
    oneMore: true, // 끝날 때 '한 번만 더'(하루 1번, 2분)
    pin: "", // 부모 비밀번호 4자리 ("" = 오늘 날짜 8자리 사용)
    kidName: "", // 아이 이름 (예: "동훈") — 칭찬할 때 "동훈아, 최고!" / 비우면 이름 없이 칭찬
    kidVoice: null, // 이름 음성 {v: "동훈아" 음성 주소, n: "동훈이" 음성 주소} — 부모가 '이름 음성 코드'로 넣음(기기에만 저장)
    ver: 2,
  };
  // 이름: 한글·영문·숫자만, 8자까지 (화면에 그대로 넣으므로 꺾쇠 등은 버림)
  const cleanName = (n) => (typeof n === "string" ? n.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 8) : "");
  // 이름 음성 주소: 자연 음성과 같은 서버(CSP 허용)만
  const VOICE_HOST = "https://d8j0ntlcm91z4.cloudfront.net/";
  const okUrl = (u) => typeof u === "string" && u.startsWith(VOICE_HOST) && u.length < 300 && !/[\s"'<>]/.test(u);
  const cleanVoice = (v) => (v && typeof v === "object" && okUrl(v.v) ? { v: v.v, n: okUrl(v.n) ? v.n : "" } : null);
  function clean(v) {
    const c = Object.assign({}, DEF, v && typeof v === "object" ? v : {});
    ["sfx", "music", "voice"].forEach((k) => {
      if (!Number.isFinite(c[k])) c[k] = DEF[k];
      c[k] = Math.min(1, Math.max(0, c[k]));
    });
    if (!Number.isFinite(c.timer) || c.timer < 0) c.timer = 0;
    if (!c.hidden || typeof c.hidden !== "object" || Array.isArray(c.hidden)) c.hidden = {};
    c.bgm = !!c.bgm;
    c.hints = c.hints !== false;
    c.natural = c.natural !== false;
    if (typeof c.lastCat !== "string") c.lastCat = DEF.lastCat;
    c.lock = c.lock !== false;
    if (!Array.isArray(c.lockCats)) c.lockCats = DEF.lockCats.slice();
    c.lockCats = c.lockCats.filter((x) => typeof x === "string");
    c.kidGate = c.kidGate !== false;
    if (![2, 3, 5].includes(c.kidQ)) c.kidQ = DEF.kidQ;
    if (![10, 20, 30].includes(c.kidMin)) c.kidMin = DEF.kidMin;
    if (![1, 2, 3].includes(c.kidQuizMax)) c.kidQuizMax = DEF.kidQuizMax;
    c.earnOn = c.earnOn !== false;
    if (![3, 5, 7].includes(c.earnStars)) c.earnStars = DEF.earnStars;
    if (![10, 15, 20].includes(c.earnMin)) c.earnMin = DEF.earnMin;
    if (![0, 30, 45, 60].includes(c.earnCapMin)) c.earnCapMin = DEF.earnCapMin;
    if (![2, 3, 5].includes(c.earnPerGame)) c.earnPerGame = DEF.earnPerGame;
    c.oneMore = c.oneMore !== false;
    c.pin = /^\d{4}$/.test(String(c.pin || "")) ? String(c.pin) : "";
    c.kidName = cleanName(c.kidName);
    c.kidVoice = cleanVoice(c.kidVoice);
    return c;
  }
  const raw = KP.store.get("settings", {}) || {};
  let cur = clean(raw);
  // 판 올림 2: 열쇠 별이 생기면서 문지기 퀴즈(아무거나 눌러도 통과 가능)는 기본으로 끔
  if (!(raw.ver >= 2)) {
    cur.kidGate = false;
    cur.ver = 2;
    KP.store.set("settings", cur);
  }
  const subs = [];
  KP.settings = {
    DEF,
    get: () => cur,
    set(patch) {
      cur = clean(Object.assign({}, cur, patch));
      KP.store.set("settings", cur);
      subs.forEach((f) => {
        try {
          f(cur);
        } catch (e) {}
      });
      if (KP.audio) KP.audio.applyVolumes();
      return cur;
    },
    on(fn) {
      subs.push(fn);
    },
  };

  /* ---------- 아이 이름 부르기 ----------
     문장 안의 "{부름}" → "동훈아," / "근호야," (이름이 없으면 빼고 칭찬만)
     받침 있으면 아/이, 없으면 야/(없음): 동훈아·동훈이 / 근호야·근호 */
  const hasBatchim = (w) => {
    const c = w.charCodeAt(w.length - 1);
    return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  };
  const isHangul = (w) => /[가-힣]$/.test(w);
  const kid = (KP.kid = {
    name: () => cur.kidName,
    /** 부르는 말: 동훈아 / 근호야 (한글 아니면 이름 그대로) */
    call() {
      const n = cur.kidName;
      if (!n) return "";
      return isHangul(n) ? n + (hasBatchim(n) ? "아" : "야") : n;
    },
    /** 이름(문장 속): 동훈이 / 근호 */
    nick() {
      const n = cur.kidName;
      if (!n) return "";
      return isHangul(n) && hasBatchim(n) ? n + "이" : n;
    },
    /** 이름 음성이 있으면 그 주소 (음성 조각 찾기에서 씀) */
    clip(word) {
      const v = cur.kidVoice;
      if (!v || !cur.kidName) return null;
      if (word === kid.call()) return v.v;
      if (word === kid.nick() && v.n) return v.n;
      return null;
    },
    /** '이름 음성 코드' 풀기: "KPV1." + base64(JSON {n, v, i}) → 성공하면 true */
    applyCode(code) {
      try {
        const m = /^KPV1\.([A-Za-z0-9+/=_-]+)$/.exec(String(code || "").trim());
        if (!m) return false;
        const b = atob(m[1].replace(/-/g, "+").replace(/_/g, "/"));
        const j = JSON.parse(decodeURIComponent(escape(b)));
        const name = cleanName(j.n);
        const voice = cleanVoice({ v: j.v, n: j.i });
        if (!name || !voice) return false;
        KP.settings.set({ kidName: name, kidVoice: voice });
        return true;
      } catch (e) {
        return false;
      }
    },
  });
  /** "{부름} 퍼즐 박사!" → "동훈아, 퍼즐 박사!" / "퍼즐 박사!"
      forVoice: 말할 때 — 자연 음성을 쓰는데 이름 음성이 없으면 이름은 빼고 말함(문장 전체가 기계 음성으로 바뀌지 않게) */
  KP.who = (t, forVoice) => {
    t = String(t == null ? "" : t);
    if (!t.includes("{부름}")) return t;
    let c = kid.call();
    if (forVoice && c && cur.natural !== false && !kid.clip(c)) c = "";
    return t.replace(/\{부름\}\s*/g, c ? c + ", " : "").replace(/\s{2,}/g, " ").trim();
  };
})(window.KP);
