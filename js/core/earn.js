/* =====================================================================
   🔑 열쇠 별 모으기 → 문 열기
   - 잠그지 않은 카테고리(기본: 공부 놀이)에서 '한 번에 맞힌' 판마다 별 1개
     (찍어서 맞힌 판·너무 빠른 연타·같은 놀이 반복은 세지 않음)
   - 별을 다 모으면 홈의 문을 눌러 정해진 시간 동안 잠긴 놀이가 열림
   - 하루에 별로 열 수 있는 시간에 상한, 하루 사용 시간·잘 시간이 항상 우선
   - 문이 열려 있는 동안은 별 칸 대신 줄어드는 막대(그림 타이머)를 보여 줌
   저장: KP.store "earn" {d, stars, used(분), per:{게임id:별}, last(ms), one(한 번만 더 썼나)}
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const day = () => KP.gate.today();
  function st() {
    const s = KP.store.get("earn", null);
    if (!s || typeof s !== "object" || s.d !== day()) return { d: day(), stars: 0, used: 0, per: {}, last: 0, one: 0 };
    s.stars = Math.max(0, +s.stars || 0);
    s.used = Math.max(0, +s.used || 0);
    if (!s.per || typeof s.per !== "object") s.per = {};
    return s;
  }
  const save = (s) => KP.store.set("earn", s);
  const cfg = () => KP.settings.get();
  /** 별 모으기가 의미 있는 상태인가 (잠금 켜짐 + 잠긴 카테고리 있음 + 켜 둠) */
  const active = () => {
    const s = cfg();
    if (!(s.earnOn && s.lock && s.lockCats.length > 0)) return false;
    // 별을 모을 수 있는(잠기지 않은) 놀이가 하나라도 있어야 함
    return KP.ORDER.some((id) => !s.lockCats.includes(KP.GAMES[id].cat) && !s.hidden[id]);
  };
  /** 별을 주는 놀이인가 = 잠그지 않은 카테고리의 놀이 */
  const earnsIn = (cat) => !cfg().lockCats.includes(cat);
  const capLeft = (s) => (cfg().earnCapMin > 0 ? Math.max(0, cfg().earnCapMin - s.used) : Infinity);

  const E = (KP.earn = {
    state: st,
    active,
    earnsIn,
    /** 문이 열려 있는 동안(별로·퀴즈로·어른 30분) 남은 비율 0~1, 닫혀 있으면 -1 */
    doorFrac() {
      const left = KP.gate.kidLeft();
      if (!left) return -1;
      const tot = (+KP.store.get("gate:len", 0) || left) || 1;
      return Math.max(0, Math.min(1, left / tot));
    },
    full: () => st().stars >= cfg().earnStars,
    capDone: () => capLeft(st()) <= 0,

    /** 놀이에서 성공했을 때 (ui.js win 에서 호출) */
    onWin(ctx, clean) {
      if (!active() || !ctx || !earnsIn(ctx.def.cat)) return false;
      return give(ctx, clean, 1);
    },
    /** 공책(쓰기) 한 장을 끝냈을 때: 별 2개 이상이면 열쇠 별 1개 */
    onNotebook(ctx, stars) {
      if (!active() || !ctx || !earnsIn(ctx.def.cat)) return false;
      return give(ctx, stars >= 2, 1);
    },
    /** 어른이 별 선물 */
    gift(n = 1) {
      const s = st();
      s.stars = Math.min(cfg().earnStars, s.stars + n);
      save(s);
      E.render();
    },
    /** 문 열기 (별이 다 모였을 때) */
    open() {
      const s = st();
      if (s.stars < cfg().earnStars) return false;
      const cap = capLeft(s);
      if (cap <= 0) return false;
      if (KP.timeLeft && KP.timeLeft().left <= 0) return false;
      const min = Math.min(cfg().earnMin, cap);
      s.stars = 0;
      s.used += min;
      save(s);
      KP.gate.unlockFor(min, "earn");
      doorScene();
      KP.voice.say("문이 열렸어요! 신나게 놀아요!");
      E.render();
      KP.renderHome();
      return true;
    },
    /** 한 번만 더 (하루 1번, 아이가 누름) */
    canOneMore: () => cfg().oneMore && !st().one,
    useOneMore() {
      const s = st();
      if (!cfg().oneMore || s.one) return false;
      s.one = 1;
      save(s);
      return true;
    },
    render,
    flyStar,
  });

  function give(ctx, clean, n) {
    const s = st();
    const now = Date.now();
    const id = ctx.def.id;
    const c = cfg();
    if (KP.gate.unlocked()) return false; // 문이 이미 열려 있으면 모으지 않음
    if (!clean) return false; // 찍어서 맞힌 판
    if (now - (s.last || 0) < 6000) return false; // 너무 빠른 연타
    if ((s.per[id] || 0) >= c.earnPerGame) {
      // 같은 놀이는 하루 상한까지 — 다른 놀이로 이끌기 (가끔만 말함)
      if (!s.toldVar || now - s.toldVar > 60000) {
        s.toldVar = now;
        save(s);
        setTimeout(() => KP.voice.say("다른 공부 놀이에서도 별을 찾아봐요!", { queue: true }), 2500);
      }
      return false;
    }
    if (s.stars >= c.earnStars || capLeft(s) <= 0) return false;
    if (KP.timeLeft && KP.timeLeft().left <= 0) return false;
    // 오늘의 도전 놀이는 별 2개
    const hero = KP.heroOf && KP.heroOf(ctx.def.cat) === id;
    const add = Math.min(hero ? 2 : n, c.earnStars - s.stars, c.earnPerGame - (s.per[id] || 0)); // 같은 놀이 상한도 넘지 않게
    s.stars += add;
    s.per[id] = (s.per[id] || 0) + add; // 같은 놀이 상한은 '별 수' 기준 (오늘의 도전 하나로 다 채우지 않게)
    s.last = now;
    save(s);
    setTimeout(() => flyStar(ctx, add), 700);
    if (s.stars >= c.earnStars) setTimeout(() => KP.voice.say("별을 다 모았어요! 홈에서 문을 열어요!", { queue: true }), 2600);
    return true;
  }

  /* ---------- 그리기: 놀이 상단 열쇠 칸 + 홈 열쇠 버튼 ---------- */
  function slotsHTML(n, max) {
    let h = '<span class="kStars">';
    for (let i = 0; i < max; i++) h += '<i class="' + (i < n ? "on" : "") + '">' + (i < n ? KP.E("⭐") : "") + "</i>";
    return h + "</span>";
  }
  function barHTML(f) {
    return '<span class="kBar"><i style="width:' + Math.round(f * 100) + '%"></i></span>';
  }
  function content() {
    const s = st(),
      c = cfg();
    const f = E.doorFrac();
    if (f >= 0 && !KP.gate.adultOpen()) return { cls: "open", html: KP.E("🔓") + barHTML(f) };
    if (KP.gate.adultOpen()) return { cls: "adult", html: KP.E("🔓") };
    if (capLeft(s) <= 0) return { cls: "done", html: KP.E("🚪") + '<span class="kZz">' + KP.E("💤") + "</span>" };
    const full = s.stars >= c.earnStars;
    return { cls: full ? "full" : "", html: KP.E(full ? "🚪" : "🔑") + slotsHTML(s.stars, c.earnStars) };
  }
  function paint(el) {
    if (!el) return;
    const bar = el.closest(".bar");
    if (!active()) {
      el.style.display = "none";
      if (bar) bar.classList.remove("hasKey");
      return;
    }
    el.style.display = "";
    if (bar) bar.classList.add("hasKey");
    const { cls, html } = content();
    if (el._h !== html) {
      el._h = html;
      el.innerHTML = html;
    }
    el.classList.toggle("full", cls === "full");
    el.classList.toggle("open", cls === "open");
    el.classList.toggle("done", cls === "done");
  }
  function render() {
    const cur = KP.current && KP.current();
    if (cur && cur.keyPill) paint(cur.keyPill);
    paint(document.querySelector("#home .keyBtn"));
  }
  setInterval(() => !document.hidden && render(), 1000);

  /** 문이 열리는 장면: 별 다섯 개가 열쇠 구멍으로 → 문이 활짝 → 빛과 꽃가루 */
  function doorScene() {
    const n = cfg().earnStars;
    const ov = U.el("div", "doorScene");
    ov.innerHTML =
      '<div class="dsFrame"><div class="dsLight"></div><div class="dsDoor"><span class="dsKnob"></span><span class="dsHole"></span></div></div>' +
      '<div class="dsStars">' + Array.from({ length: n }, (_, i) => '<span style="--i:' + i + '">' + KP.E("⭐") + "</span>").join("") + "</div>";
    document.body.appendChild(ov);
    KP.audio.sfx("sparkle");
    setTimeout(() => {
      ov.classList.add("open");
      KP.audio.sfx("levelup");
    }, 1100);
    setTimeout(() => KP.confetti && KP.confetti(200), 1500);
    setTimeout(() => ov.classList.add("bye"), 2900);
    setTimeout(() => ov.remove(), 3400);
    ov.addEventListener("click", () => ov.remove());
  }

  /** 별이 열쇠 칸으로 날아가기 */
  function flyStar(ctx, n) {
    const target = (ctx && ctx._active && ctx.keyPill) || document.querySelector("#home .keyBtn");
    if (!target || !target.offsetParent) return render();
    const b = target.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const fly = U.el("div", "flyStar", KP.E("⭐"));
      const x0 = innerWidth / 2 - 30 + i * 40,
        y0 = innerHeight / 2 - 30;
      Object.assign(fly.style, { left: x0 + "px", top: y0 + "px" });
      document.body.appendChild(fly);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          fly.style.transform = "translate(" + (b.left + b.width / 2 - x0 - 30) + "px," + (b.top + b.height / 2 - y0 - 30) + "px) scale(.35) rotate(360deg)";
        })
      );
      setTimeout(() => {
        fly.remove();
        if (i === n - 1) {
          render();
          U.replay(target, "bump");
          KP.audio.sfx("sparkle");
        }
      }, 900 + i * 120);
    }
  }
})(window.KP);
