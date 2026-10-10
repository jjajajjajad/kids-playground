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
    kidGate: true, // 아이용 문지기 퀴즈로도 열기
    kidQ: 3, // 맞혀야 할 문제 수
    kidMin: 20, // 열리는 시간(분)
  };
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
    return c;
  }
  let cur = clean(KP.store.get("settings", {}));
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
})(window.KP);
