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
    const mascot = U.el("button", "homeMascot", KP.E(KP.MASCOT));
    mascot.setAttribute("aria-label", "곰돌이");
    brand.append(U.el("h1", "", "아이 놀이터"));
    const acts = U.el("div", "homeActs");
    const bSt = U.btn(KP.E("📒") + "<b>0</b>", "act stickerBtn");
    const bGal = U.btn(KP.E("🖼️"), "act galBtn");
    const bMusic = U.btn(KP.E("🎵"), "act musicBtn");
    const bFs = U.btn(KP.E("📺"), "act fsBtn");
    const bSet = U.btn(KP.E("⚙️"), "act setBtn");
    acts.append(bSt, bGal, bMusic, bFs, bSet);
    top.append(brand, acts);

    const tabs = U.el("nav", "tabs");
    tabs.appendChild(mascot);
    const grid = U.el("div", "grid");
    home.append(tabs, top, grid);

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
      t.style.setProperty("--tsoft", c.soft);
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
    grid.style.setProperty("--soft", c.soft);
    grid.innerHTML = "";
    const ids = KP.ORDER.filter((id) => KP.GAMES[id].cat === cat && !s.hidden[id]);
    // 오늘의 도전: 날짜와 카테고리로 정해지는 하루 한 놀이 (하루 동안은 그대로)
    let hero = null;
    if (ids.length > 1) {
      const key = today() + cat;
      let hsh = 0;
      for (let k = 0; k < key.length; k++) hsh = (hsh * 31 + key.charCodeAt(k)) >>> 0;
      hero = ids[hsh % ids.length];
      ids.splice(ids.indexOf(hero), 1);
      ids.unshift(hero);
    }
    const ROT = [1.5, -1, 2, -2, 1, -1.5, -1, 2, -0.5, 1.2, -1.8, 0.6];
    ids.forEach((id, i) => {
      const g = KP.GAMES[id];
      const isHero = id === hero;
      const card = U.btn(
        isHero
          ? '<span class="hTag">오늘의 도전</span><span class="cIco">' + KP.E(g.icon) + '</span><span class="cName">' + g.name + '</span><span class="hGo">시작!</span>'
          : '<span class="cIco">' + KP.E(g.icon) + '</span><span class="cName">' + g.name + "</span>",
        "card" + (isHero ? " hero" : "")
      );
      card.style.setProperty("--i", i);
      card.style.setProperty("--rot", (isHero ? -1.5 : ROT[i % ROT.length]) + "deg");
      if (g.badge) card.appendChild(U.el("span", "cBadge", g.badge));
      const lv = KP.level.get(id);
      if (g.levels > 1 && lv.lvl > 1) card.appendChild(U.el("span", "cLv", KP.E("🏅") + Math.min(lv.lvl, g.levels)));
      card.addEventListener("click", () => {
        if (card.dataset.busy) return; // 연타 시 두 번 열리지 않게
        card.dataset.busy = "1";
        KP.audio.sfx("open");
        KP.voice.say(isHero ? "오늘의 도전! " + g.name : g.name);
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
  // 기기 시간(한국 시간) 기준 날짜 — toISOString 은 UTC 라 아침 9시에 날짜가 바뀌는 문제가 있었음
  const today = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  function usage() {
    const u = KP.store.get("usage", null);
    if (!u || typeof u !== "object" || u.d !== today() || !Number.isFinite(u.s)) return { d: today(), s: 0, bonus: 0 };
    if (!Number.isFinite(u.bonus)) u.bonus = 0;
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
