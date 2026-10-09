/* =====================================================================
   홈 화면 · 사용 시간 제한(잘 시간 화면) · 어른 확인(꾹 누르기)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  /** 어른용 꾹 누르기 버튼: ms 동안 누르고 있어야 실행 */
  KP.hold = function (el, ms, onDone, onStart) {
    let t = null,
      t0 = 0,
      raf = 0;
    el.classList.add("holdBtn");
    const stop = () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      el.style.setProperty("--p", 0);
      el.classList.remove("holding");
    };
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      t0 = performance.now();
      el.classList.add("holding");
      onStart && onStart();
      const step = () => {
        el.style.setProperty("--p", Math.min(1, (performance.now() - t0) / ms));
        raf = requestAnimationFrame(step);
      };
      step();
      t = setTimeout(() => {
        stop();
        KP.audio.sfx("good");
        onDone();
      }, ms);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, stop));
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  };

  /* ---------------- 홈 ---------------- */
  const home = U.el("section", "screen on");
  home.id = "home";
  KP.buildHome = function () {
    home.innerHTML = "";
    const top = U.el("header", "homeTop");
    const brand = U.el("div", "brand");
    const mascot = U.el("div", "homeMascot", KP.E(KP.MASCOT));
    brand.append(mascot, U.el("h1", "", "아이 놀이터"));
    const acts = U.el("div", "homeActs");
    const bSt = U.btn(KP.E("📒") + "<b>0</b>", "act stickerBtn");
    const bGal = U.btn(KP.E("🖼️"), "act galBtn");
    const bMusic = U.btn(KP.E("🎵"), "act musicBtn");
    const bFs = U.btn(KP.E("📺"), "act fsBtn");
    const bSet = U.btn(KP.E("⚙️"), "act setBtn");
    acts.append(bSt, bGal, bMusic, bFs, bSet);
    top.append(brand, acts);

    const tabs = U.el("nav", "tabs");
    const grid = U.el("div", "grid");
    home.append(top, tabs, grid);

    mascot.addEventListener("click", () => {
      U.replay(mascot, "jump");
      KP.audio.sfx("boing");
      KP.voice.say(U.pick(["안녕! 오늘은 뭐 하고 놀까?", "같이 놀자!", "형아, 반가워!", "무슨 놀이를 할까?"]));
    });
    bSt.addEventListener("click", () => {
      KP.audio.sfx("open");
      KP.open("stickers");
    });
    bGal.addEventListener("click", () => {
      KP.audio.sfx("open");
      KP.open("gallery");
    });
    bMusic.addEventListener("click", () => {
      KP.audio.unlock();
      const on = !KP.settings.get().bgm;
      KP.settings.set({ bgm: on });
      on ? KP.audio.bgm.start() : KP.audio.bgm.stop();
      KP.renderHome();
    });
    if (U.isApp() || !(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) bFs.style.display = "none";
    bFs.addEventListener("click", () => {
      const de = document.documentElement;
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
      } catch (e) {}
    });
    KP.hold(bSet, 2000, () => KP.openSettings(), () => KP.toast("어른은 2초 동안 꾹 누르세요"));

    KP.CATS.forEach((c) => {
      const t = U.btn(KP.E(c.icon) + "<span>" + c.name + "</span>", "tab");
      t.dataset.cat = c.id;
      t.style.setProperty("--cat", c.color);
      t.addEventListener("click", () => {
        KP.audio.sfx("select");
        KP.voice.say(c.name);
        KP.settings.set({ lastCat: c.id });
        KP.renderHome();
        grid.scrollTop = 0;
      });
      tabs.appendChild(t);
    });
  };
  KP.renderHome = function () {
    const s = KP.settings.get();
    const cat = KP.CATS.find((c) => c.id === s.lastCat) ? s.lastCat : KP.CATS[0].id;
    U.$$(".tab", home).forEach((t) => t.classList.toggle("sel", t.dataset.cat === cat));
    const grid = U.$(".grid", home);
    const c = KP.CATS.find((x) => x.id === cat);
    grid.style.setProperty("--cat", c.color);
    grid.innerHTML = "";
    KP.ORDER.filter((id) => KP.GAMES[id].cat === cat && !s.hidden[id]).forEach((id, i) => {
      const g = KP.GAMES[id];
      const card = U.btn('<span class="cIco">' + KP.E(g.icon) + '</span><span class="cName">' + g.name + "</span>", "card");
      card.style.setProperty("--i", i);
      if (g.badge) card.appendChild(U.el("span", "cBadge", g.badge));
      const lv = KP.level.get(id);
      if (g.levels > 1 && lv.lvl > 1) card.appendChild(U.el("span", "cLv", KP.E("🏅") + Math.min(lv.lvl, g.levels)));
      card.addEventListener("click", () => {
        KP.audio.sfx("open");
        KP.voice.say(g.name);
        U.replay(card, "press");
        setTimeout(() => KP.open(id), 140);
      });
      grid.appendChild(card);
    });
    U.$(".stickerBtn b", home).textContent = KP.stickers.count();
    U.$(".musicBtn", home).classList.toggle("off", !s.bgm);
  };
  KP.homeEl = home;

  /* ---------------- 알림 토스트 ---------------- */
  let toastEl = null,
    toastT = 0;
  KP.toast = function (msg) {
    if (!toastEl) {
      toastEl = U.el("div", "toast");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = KP.E(msg);
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  /* ---------------- 사용 시간 제한 ---------------- */
  const today = () => new Date().toISOString().slice(0, 10);
  function usage() {
    const u = KP.store.get("usage", { d: today(), s: 0, bonus: 0 });
    if (u.d !== today()) return { d: today(), s: 0, bonus: 0 };
    return u;
  }
  KP.usage = usage;
  let bed = null;
  function showBedtime() {
    if (bed) return;
    KP.voice.stop();
    if (KP.current()) KP.home();
    bed = U.el("div", "bedtime");
    bed.innerHTML =
      '<div class="bedSky"><div class="bedMoon">' + KP.E("🌙") + '</div><div class="bedBear">' + KP.E("🐻") +
      '<span class="zzz">Z z z</span></div><div class="bedTxt">오늘은 여기까지!<br>내일 또 놀자</div></div>';
    const unlock = U.btn(KP.E("🔒") + " 어른: 3초 꾹", "bedUnlock");
    bed.appendChild(unlock);
    document.body.appendChild(bed);
    KP.audio.bgm.stop();
    KP.audio.melody(KP.audio.SONGS.twinkle.notes.slice(0, 14), { beat: 0.5, vol: 0.14 });
    KP.voice.say("오늘은 여기까지! 눈이 쉬어야 해요. 내일 또 놀자!");
    KP.hold(unlock, 3000, () => {
      const u = usage();
      u.bonus = (u.bonus || 0) + 10;
      KP.store.set("usage", u);
      bed.remove();
      bed = null;
      KP.toast("10분 더 놀 수 있어요");
      if (KP.settings.get().bgm) KP.audio.bgm.start();
    });
  }
  setInterval(() => {
    if (document.hidden) return;
    const u = usage();
    u.s += 5;
    KP.store.set("usage", u);
    const lim = KP.settings.get().timer;
    if (lim > 0 && u.s >= (lim + (u.bonus || 0)) * 60) showBedtime();
  }, 5000);
})(window.KP);
