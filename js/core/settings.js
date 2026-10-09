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
  };
  let cur = Object.assign({}, DEF, KP.store.get("settings", {}));
  const subs = [];
  KP.settings = {
    DEF,
    get: () => cur,
    set(patch) {
      cur = Object.assign({}, cur, patch);
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
