/* =====================================================================
   사용 통계 (익명) — 놀이 보완용. 부모 설정 → 사용 통계 에서 끌 수 있음
   - 무엇을: 앱 켬 / 놀이 열기·나감(머문 초) / 이김·틀림 / 단계 오르내림 / 문 열기(방법·분) / 오류 / 주요 설정 변경
   - 무엇을 안 보내나: 아이 이름(있는지만), 사진·작품, 음성, 위치, IP(서버도 저장 안 함)
   - 어떻게: 기기에 모아 두었다가(최대 500개) 인터넷 될 때 묶어 보냄. 실패해도 놀이에 영향 없음. 서버 주소(KP.STATS_URL)가 없으면 아무것도 안 함
   - 기기번호: 처음 켤 때 무작위로 만든 글자 (설정에서 '기록 지우기' 하면 새로 만듦)
   KP.stats.on() · dev() · pending() · flush() · reset()
===================================================================== */
"use strict";
(function (KP) {
  const S = KP.store;
  const url = () => (typeof KP.STATS_URL === "string" && /^https:\/\//.test(KP.STATS_URL) ? KP.STATS_URL.replace(/\/$/, "") : "");
  const on = () => !!url() && KP.settings.get().stats !== false;
  const rnd = () => {
    const a = new Uint8Array(12);
    (self.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = (Math.random() * 256) | 0));
    return [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  let dev = S.get("stats:dev", "");
  if (typeof dev !== "string" || !/^[0-9a-f]{24}$/.test(dev)) S.set("stats:dev", (dev = rnd()));
  let q = S.get("stats:q", []);
  if (!Array.isArray(q)) q = [];
  let saveT = 0,
    sending = false,
    errN = 0,
    cur = "", // 지금 열린 놀이
    openAt = 0;
  const save = () => {
    if (saveT) return;
    saveT = setTimeout(() => {
      saveT = 0;
      S.set("stats:q", q);
    }, 800);
  };
  const push = (kind, game, a, b, c) => {
    if (!on()) return;
    q.push([Date.now(), kind, game || "", a == null ? null : a, b == null ? null : b, c == null ? null : String(c).slice(0, 40)]);
    if (q.length > 500) q.splice(0, q.length - 500);
    save();
  };
  const info = () => {
    const ua = navigator.userAgent || "";
    const os = /android/i.test(ua) ? "android" : /iP(hone|ad|od)/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Windows/.test(ua) ? "windows" : "other";
    const st = matchMedia && matchMedia("(display-mode: standalone)").matches ? "app" : "browser";
    return { os: os + "-" + st, scr: screen.width + "x" + screen.height, dpr: Math.round((devicePixelRatio || 1) * 10) / 10, lang: navigator.language || "", named: !!KP.settings.get().kidName };
  };
  function flush(keepalive) {
    if (!on() || !q.length || sending || navigator.onLine === false) return Promise.resolve(false);
    const batch = q.slice(0, 200);
    sending = true;
    const body = JSON.stringify({ d: dev, v: (KP.VERSION || "").split(" ")[0], p: info(), e: batch });
    return fetch(url() + "/e", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: !!keepalive })
      .then((r) => {
        if (r.ok) {
          q.splice(0, batch.length);
          S.set("stats:q", q);
        }
        return r.ok;
      })
      .catch(() => false)
      .finally(() => (sending = false));
  }
  KP.stats = {
    on,
    dev: () => dev,
    pending: () => q.length,
    flush: () => flush(false),
    /** 기록과 기기번호를 지우고 새로 시작 (끌 때·지우기 버튼) */
    reset() {
      q = [];
      S.set("stats:q", q);
      S.set("stats:dev", (dev = rnd()));
    },
  };

  /* ---- 걸어 두기: 놀이 열기·나감 ---- */
  const leaveNow = () => {
    if (!cur) return;
    push("leave", cur, Math.round((Date.now() - openAt) / 1000));
    cur = "";
  };
  const open0 = KP.open;
  KP.open = function (id) {
    if (KP.GAMES && KP.GAMES[id]) {
      leaveNow();
      const lv = KP.level.get(id);
      push("open", id, null, lv.lvl);
      cur = id;
      openAt = Date.now();
    }
    return open0.apply(this, arguments);
  };
  const home0 = KP.home;
  KP.home = function () {
    leaveNow();
    return home0.apply(this, arguments);
  };
  /* ---- 이김·틀림·단계: 난이도 저장을 보고 알아냄 (놀이 코드는 손대지 않음) ---- */
  const save0 = KP.level.save;
  KP.level.save = function (id, v) {
    try {
      const p = KP.level.get(id);
      if (v && typeof v === "object") {
        if ((v.wins || 0) > (p.wins || 0)) push("win", id, null, p.lvl);
        if ((v.miss || 0) > (p.miss || 0)) push("miss", id, null, p.lvl);
        if (Number.isFinite(v.lvl) && v.lvl !== p.lvl) push("lvl", id, v.lvl > p.lvl ? 1 : -1, v.lvl);
      }
    } catch (e) {}
    return save0.apply(this, arguments);
  };
  /* ---- 문 열기 ---- */
  if (KP.gate && typeof KP.gate.unlockFor === "function") {
    const u0 = KP.gate.unlockFor;
    KP.gate.unlockFor = function (min, src) {
      push("unlock", "", min, null, src || "quiz");
      return u0.apply(this, arguments);
    };
  }
  /* ---- 주요 설정 변경 (값이 숫자/참거짓인 것만) ---- */
  const WATCH = ["timer", "lock", "earnOn", "earnStars", "earnMin", "kidGate", "natural", "hints", "oneMore", "stats"];
  const set0 = KP.settings.set;
  KP.settings.set = function (patch) {
    const r = set0.apply(this, arguments);
    try {
      if (patch && typeof patch === "object") for (const k of WATCH) if (k in patch) push("set", "", +patch[k] || 0, null, k);
      if (patch && patch.stats === false) KP.stats.reset(); // 끄면 모아 둔 것도 지움
    } catch (e) {}
    return r;
  };
  /* ---- 오류 ---- */
  const onErr = (msg) => {
    if (errN++ < 20) push("err", cur, null, null, String(msg || "").replace(/^Uncaught\s+/i, "").slice(0, 40));
  };
  addEventListener("error", (e) => onErr(e.message));
  addEventListener("unhandledrejection", (e) => onErr(e.reason && (e.reason.message || e.reason)));

  /* ---- 보내기 시점: 켠 뒤 8초, 그 뒤 5분마다, 화면이 가려질 때(앱 닫힘), 인터넷이 돌아올 때 ---- */
  push("app", "", null, null, info().os);
  setTimeout(() => flush(false), 8000);
  setInterval(() => flush(false), 300000);
  addEventListener("online", () => setTimeout(() => flush(false), 3000));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      leaveNow(); // 앱을 닫는 중이면 머문 시간을 남김
      if (cur === "" && KP.current && KP.current()) {
        cur = KP.current().id; // 돌아오면 이어서 잼
        openAt = Date.now();
      }
      flush(true);
    }
  });
})(window.KP);
