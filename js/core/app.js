/* =====================================================================
   시작 (모든 게임 파일이 등록된 뒤 마지막에 실행)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  // 길게 누르기 메뉴·글자 선택·확대 제스처 차단
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("selectstart", (e) => {
    const t = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
    if (t && t.closest && t.closest("input,textarea")) return; // 입력칸(부모 비밀번호)은 허용
    e.preventDefault();
  });
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("dblclick", (e) => e.preventDefault());

  // 첫 터치에서 소리 잠금 해제 + 배경음악 재개
  let first = true;
  document.addEventListener(
    "pointerdown",
    () => {
      KP.audio.unlock();
      KP.voice.unlockEl && KP.voice.unlockEl();
      if (first) {
        first = false;
        if (KP.settings.get().bgm) KP.audio.bgm.start();
        // 자연 음성 파일을 한가할 때 미리 받아 두기 (셀룰러·데이터 절약 모드면 voice.js 가 건너뜀)
        setTimeout(() => KP.voice.prefetch && KP.voice.prefetch(), 2500);
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
  /* 업데이트 알림 (처음 설치 때는 안 띄움 — 이미 서비스 워커가 화면을 맡고 있을 때만)
     받는 동안: 아래 작은 알림 "새 버전 받는 중 37%" (바뀐 파일이 있을 때만)
     다 받으면: '새 버전이 준비됐어요' 창 — 놀이 도중에 다시 시작하면 하던 놀이가 끊기므로 홈에 있을 때만. 안 눌러도 다음에 켤 때 적용 */
  if ("serviceWorker" in navigator) {
    let pill = null,
      ready = false,
      got = { fetched: 0, bytes: 0 };
    const mb = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(b / 1024)) + "KB");
    const dropPill = () => {
      if (pill) pill.remove();
      pill = null;
    };
    const offer = () => {
      if (!ready || KP.current() || U.$(".updOv")) return; // 놀이 중이면 홈으로 돌아올 때
      ready = false;
      const ov = U.el("div", "updOv", '<div class="updBox"><div class="updEm">' + KP.E("✨") + '</div><div class="updTxt">새 버전이 준비됐어요!</div><div class="updSub">' + (got.fetched ? "파일 " + got.fetched + "개 (" + mb(got.bytes) + ")를 받았어요.<br>" : "") + '지금 적용하면 앱이 잠깐 다시 시작해요</div></div>');
      const row = U.el("div", "updBtns");
      const bNow = U.btn(KP.E("🔄") + " 지금 적용", "btn big primary");
      const bLater = U.btn("나중에", "btn");
      bNow.addEventListener("click", () => location.reload());
      bLater.addEventListener("click", () => ov.remove()); // 다음에 켤 때 적용됨
      row.append(bNow, bLater);
      ov.firstChild.appendChild(row);
      document.body.appendChild(ov);
    };
    navigator.serviceWorker.addEventListener("message", (e) => {
      const m = e.data || {};
      if (m.kp !== "update" || !navigator.serviceWorker.controller) return;
      if (m.phase === "progress" && m.changed > 0 && m.total) {
        if (!pill) {
          pill = U.el("div", "updPill");
          document.body.appendChild(pill);
        }
        // 받은 양(인터넷에서 내려받은 파일 수·크기) · 설치 진행률(전체 파일 중 확인을 마친 비율)
        pill.innerHTML = KP.E("⬇️") + " 새 버전 받는 중 · 받은 파일 " + (m.fetched || 0) + "개 (" + mb(m.bytes || 0) + ") · 설치 " + Math.min(99, Math.round((m.done / m.total) * 100)) + "%";
      } else if (m.phase === "ready") {
        dropPill();
        if (m.changed > 0) {
          got = { fetched: m.fetched || 0, bytes: m.bytes || 0 };
          ready = true;
          offer();
        }
      } else if (m.phase === "fail") dropPill();
    });
    // 놀이에서 홈으로 돌아오면 그때 '준비됐어요' 창
    const goHome = KP.home;
    KP.home = function () {
      const r = goHome.apply(this, arguments);
      setTimeout(offer, 600);
      return r;
    };
  }
  // iPad/iPhone 의 Safari 탭으로 쓰는 중이면 '홈 화면에 추가' 한 번 안내 (기록 보존을 위해)
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS && !U.isApp() && !KP.store.get("a2hsTold", false)) {
    KP.store.set("a2hsTold", true);
    setTimeout(() => KP.toast("공유 버튼 → '홈 화면에 추가'로 설치하면 기록이 안전해요"), 2500);
  }
  // 자동 점검 도구용
  KP.voice.loadStored && KP.voice.loadStored(); // 기기에 받아 둔 자연 음성 목록
  KP.ready = true;
})(window.KP);
