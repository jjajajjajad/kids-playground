/* =====================================================================
   시작 (모든 게임 파일이 등록된 뒤 마지막에 실행)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  // 길게 누르기 메뉴·글자 선택·확대 제스처 차단
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("selectstart", (e) => e.preventDefault());
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("dblclick", (e) => e.preventDefault());

  // 첫 터치에서 소리 잠금 해제 + 배경음악 재개
  let first = true;
  document.addEventListener(
    "pointerdown",
    () => {
      KP.audio.unlock();
      if (first) {
        first = false;
        if (KP.settings.get().bgm) KP.audio.bgm.start();
      }
    },
    true
  );
  // 화면이 가려지면 음악 멈춤, 돌아오면 다시
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      KP.audio.bgm.stop();
      KP.voice.stop();
    } else if (!first && KP.settings.get().bgm) {
      const c = KP.current();
      if (!(c && c.def.cat === "music")) KP.audio.bgm.start();
    }
  });

  KP.persist();
  KP.sortGames();
  U.$("#app").appendChild(KP.homeEl);
  KP.buildHome();
  KP.renderHome();

  // 오프라인 실행용 서비스워커 (https 주소에서만)
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  // iPad/iPhone 의 Safari 탭으로 쓰는 중이면 '홈 화면에 추가' 한 번 안내 (기록 보존을 위해)
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS && !U.isApp() && !KP.store.get("a2hsTold", false)) {
    KP.store.set("a2hsTold", true);
    setTimeout(() => KP.toast("공유 버튼 → '홈 화면에 추가'로 설치하면 기록이 안전해요"), 2500);
  }
  // 자동 점검 도구용
  KP.ready = true;
})(window.KP);
