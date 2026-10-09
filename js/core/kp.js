/* =====================================================================
   아이 놀이터 — 공용 네임스페이스와 유틸리티
   모든 코어/게임 파일은 window.KP 하나만 공유한다.
===================================================================== */
"use strict";
window.KP = window.KP || {};
(function (KP) {
  const U = (KP.u = {});

  U.$ = (s, p = document) => p.querySelector(s);
  U.$$ = (s, p = document) => [...p.querySelectorAll(s)];
  U.rand = (n) => Math.floor(Math.random() * n);
  U.randf = (a, b) => a + Math.random() * (b - a);
  U.pick = (a) => a[Math.floor(Math.random() * a.length)];
  U.shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  /** 배열에서 겹치지 않게 n개 뽑기 */
  U.sample = (a, n) => U.shuffle([...a]).slice(0, n);
  U.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  /** 요소 생성: el("div","cls","<b>html</b>") */
  U.el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  /** 버튼 생성 (모양은 CSS .btn 계열) */
  U.btn = (html, cls = "btn") => {
    const b = U.el("button", cls, html);
    b.type = "button";
    return b;
  };
  /** CSS 애니메이션을 처음부터 다시 재생 */
  U.replay = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };
  /** 요소 중심 좌표(화면 기준) */
  U.center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  };
  /** 한국어 조사 자동 선택: josa("사과","을/를") → "사과를" */
  U.josa = (word, pair) => {
    const [a, b] = pair.split("/");
    const ch = word.charCodeAt(word.length - 1);
    if (ch < 0xac00 || ch > 0xd7a3) return word + b;
    const has = (ch - 0xac00) % 28 !== 0;
    if (pair === "으로/로") return word + (has && (ch - 0xac00) % 28 !== 8 ? "으로" : "로");
    return word + (has ? a : b);
  };
  /** 앱(홈 화면 설치)으로 실행 중인지 */
  U.isApp = () =>
    !!(
      (window.matchMedia &&
        (matchMedia("(display-mode: standalone)").matches ||
          matchMedia("(display-mode: fullscreen)").matches)) ||
      navigator.standalone
    );
  /** 한국어 숫자(고유어) */
  U.NAT = ["영", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
  /** 게임 전용 CSS 넣기 (같은 id 는 한 번만) */
  KP.css = (id, text) => {
    if (document.getElementById("css-" + id)) return;
    const st = document.createElement("style");
    st.id = "css-" + id;
    st.textContent = text;
    document.head.appendChild(st);
  };
  /** 이벤트 한 번만 */
  U.once = (el, ev, fn) => el.addEventListener(ev, fn, { once: true });
})(window.KP);
