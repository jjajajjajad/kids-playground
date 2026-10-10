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

  /* ---------------- 게임 잠금 (오늘 날짜 8자리) ----------------
     공부 놀이 외의 카테고리는 한국 시간 기준 오늘 날짜(예: 20261010)를 넣어야 열린다.
     한 번 풀면 앱을 다시 열 때까지(또는 날짜가 바뀔 때까지) 열려 있다. */
  const todayKST = () => {
    try {
      const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      const g = (t) => (p.find((x) => x.type === t) || {}).value || "";
      const v = g("year") + g("month") + g("day");
      if (/^\d{8}$/.test(v)) return v;
    } catch (e) {}
    return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
  };
  let openedOn = ""; // 어른이 날짜로 연 날(한국 시간). 날짜가 바뀌면 다시 잠김
  // 아이가 문지기 퀴즈로 연 경우: 정해진 시간까지만 (앱을 껐다 켜도 그 시간까지는 유지)
  let kidUntil = +KP.store.get("gate:until", 0) || 0;
  const gate = (KP.gate = {
    today: todayKST,
    unlocked: () => openedOn === todayKST() || Date.now() < kidUntil,
    kidLeft: () => Math.max(0, kidUntil - Date.now()),
    unlock() {
      openedOn = todayKST();
    },
    unlockFor(min) {
      kidUntil = Date.now() + min * 60000;
      KP.store.set("gate:until", kidUntil);
    },
    relock() {
      openedOn = "";
      kidUntil = 0;
      KP.store.set("gate:until", 0);
    },
    /** 이 카테고리가 지금 잠겨 있나 */
    locked(cat) {
      const s = KP.settings.get();
      return !!s.lock && s.lockCats.includes(cat) && !gate.unlocked();
    },
    /** 날짜 입력판을 띄우고, 맞으면 then() */
    ask(then) {
      if (gate.unlocked()) return then && then();
      showPad(then);
    },
  });
  let pad = null;
  function showPad(then) {
    if (pad) pad.remove();
    KP.voice.stop();
    let val = "";
    pad = U.el("div", "gatePad");
    const box = U.el("div", "gateBox");
    box.innerHTML =
      '<div class="gateTitle">' + KP.E("🔒") + " 어른이 열어 주세요</div>" +
      '<div class="gateSub">오늘 날짜 8자리를 눌러 주세요 <small>(예: 2026년 1월 5일 → 20260105)</small></div>';
    const slots = U.el("div", "gateSlots");
    for (let i = 0; i < 8; i++) slots.appendChild(U.el("span", "gateSlot" + (i === 3 || i === 5 ? " gap" : "")));
    const keys = U.el("div", "gateKeys");
    const draw = () => U.$$(".gateSlot", slots).forEach((el, i) => {
      el.textContent = val[i] || "";
      el.classList.toggle("on", i === val.length);
    });
    const close = () => {
      if (pad) pad.remove();
      pad = null;
    };
    const press = (k) => {
      KP.audio.unlock();
      if (k === "del") val = val.slice(0, -1);
      else if (val.length < 8) val += k;
      KP.audio.sfx("tap");
      draw();
      if (val.length === 8) {
        if (val === todayKST()) {
          gate.unlock();
          KP.audio.sfx("good");
          close();
          KP.renderHome();
          then && then();
        } else {
          U.replay(slots, "wrong");
          KP.audio.sfx("bad");
          setTimeout(() => {
            val = "";
            draw();
          }, 450);
        }
      }
    };
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "cancel", "0", "del"].forEach((k) => {
      const b = U.btn(k === "del" ? "⌫" : k === "cancel" ? "닫기" : k, "gateKey" + (k.length > 1 ? " fn" : ""));
      b.addEventListener("click", () => (k === "cancel" ? (KP.audio.sfx("back"), close()) : press(k)));
      keys.appendChild(b);
    });
    box.append(slots, keys);
    const st = KP.settings.get();
    if (st.kidGate) {
      const kid = U.btn(KP.E("🐻") + " 형아: 문제 " + st.kidQ + "개 맞히고 열기", "gateKid");
      kid.addEventListener("click", () => {
        KP.audio.sfx("open");
        kidQuiz(box, then, close);
      });
      box.appendChild(kid);
    }
    pad.appendChild(box);
    pad.addEventListener("click", (e) => e.target === pad && close());
    document.body.appendChild(pad);
    draw();
  }
  /* ---------- 문지기 퀴즈: 아이가 배운 것(한글·숫자·알파벳)을 맞히면 정해진 시간 동안 열림 ----------
     한 번에 맞힌 문제만 셈(틀리면 새 문제). 소리로만 묻고 보기는 글자·숫자·그림. */
  const GQ = {
    C: [["ㄱ", "기역", "🚂", "기차"], ["ㄴ", "니은", "🦋", "나비"], ["ㄷ", "디귿", "🐿️", "다람쥐"], ["ㄹ", "리을", "📻", "라디오"], ["ㅁ", "미음", "🎩", "모자"],
      ["ㅂ", "비읍", "🍌", "바나나"], ["ㅅ", "시옷", "🦁", "사자"], ["ㅇ", "이응", "🦆", "오리"], ["ㅈ", "지읒", "🚲", "자전거"], ["ㅊ", "치읓", "🧀", "치즈"],
      ["ㅋ", "키읔", "🐘", "코끼리"], ["ㅌ", "티읕", "🐰", "토끼"], ["ㅍ", "피읖", "🍇", "포도"], ["ㅎ", "히읗", "🦛", "하마"]],
    V: [["ㅏ", "아"], ["ㅑ", "야"], ["ㅓ", "어"], ["ㅕ", "여"], ["ㅗ", "오"], ["ㅛ", "요"], ["ㅜ", "우"], ["ㅠ", "유"], ["ㅡ", "으"], ["ㅣ", "이"]],
    A: [["A", "에이"], ["B", "비"], ["C", "씨"], ["D", "디"], ["E", "이"], ["F", "에프"], ["G", "지"], ["H", "에이치"], ["K", "케이"], ["L", "엘"], ["M", "엠"],
      ["N", "엔"], ["O", "오"], ["P", "피"], ["R", "알"], ["S", "에스"], ["T", "티"], ["W", "더블유"], ["X", "엑스"], ["Z", "제트"]],
  };
  function makeQ() {
    const t = U.pick(["cons", "cons", "pic", "vow", "num", "num", "abc"]);
    if (t === "cons" || t === "pic") {
      const opts = U.sample(GQ.C, 3);
      const ans = opts[0];
      if (t === "pic") return { show: ans[2], say: ans[3] + "! 무슨 글자로 시작할까요?", opts: U.shuffle(opts.map((o) => o[0])), ans: ans[0], right: ans[3] + "! " + ans[1] + "!" };
      return { show: "👂", say: U.josa(ans[1], "을/를") + " 찾아요!", opts: U.shuffle(opts.map((o) => o[0])), ans: ans[0], right: ans[1] + "!" };
    }
    if (t === "vow") {
      const opts = U.sample(GQ.V, 3);
      return { show: "👂", say: U.josa(opts[0][1], "을/를") + " 찾아요!", opts: U.shuffle(opts.map((o) => o[0])), ans: opts[0][0], right: opts[0][1] + "!" };
    }
    if (t === "abc") {
      const opts = U.sample(GQ.A, 3);
      return { show: "👂", say: U.josa(opts[0][1], "을/를") + " 찾아요!", en: "Find " + opts[0][0] + "!", opts: U.shuffle(opts.map((o) => o[0])), ans: opts[0][0], right: opts[0][1] + "!" };
    }
    const n = 1 + U.rand(20);
    const set = new Set([n]);
    while (set.size < 3) {
      const x = Math.max(1, Math.min(20, n + U.pick([-2, -1, 1, 2, 10, -10]) ));
      set.add(x === n ? 1 + U.rand(20) : x);
    }
    return { show: "👂", say: U.josa(U.numSino(n), "을/를") + " 찾아요! " + U.numNative(n) + "!", opts: U.shuffle([...set].map(String)), ans: String(n), right: U.numSino(n) + "!" };
  }
  function kidQuiz(box, then, close) {
    const need = KP.settings.get().kidQ;
    let got = 0,
      q = null;
    box.innerHTML = "";
    const title = U.el("div", "gateTitle", KP.E("🐻") + " 문제를 맞히면 문이 열려요!");
    const dots = U.el("div", "gateDots");
    const ask = U.btn("", "gateAsk");
    const opts = U.el("div", "gateOpts");
    const back = U.btn("닫기", "gateKey fn gateBack");
    box.append(title, dots, ask, opts, back);
    back.addEventListener("click", () => {
      KP.audio.sfx("back");
      KP.voice.stop();
      close();
    });
    const drawDots = () => (dots.innerHTML = Array.from({ length: need }, (_, i) => "<i class='" + (i < got ? "on" : "") + "'></i>").join(""));
    const speak = () => {
      if (q.en) {
        KP.voice.en(q.en);
        KP.voice.say(q.say, { queue: true });
      } else KP.voice.say(q.say);
    };
    ask.addEventListener("click", () => speak());
    const next = () => {
      q = gate.cur = makeQ(); // gate.cur: 자동 점검용
      ask.innerHTML = KP.E(q.show);
      opts.innerHTML = "";
      let tried = false,
        busy = false;
      q.opts.forEach((o) => {
        const b = U.btn(o, "gateOpt");
        b.addEventListener("click", () => {
          if (busy) return;
          KP.audio.unlock();
          if (o !== q.ans) {
            tried = true;
            U.replay(b, "wrong");
            KP.audio.sfx("bad");
            busy = true;
            KP.voice.say("아니에요! 다른 문제를 줄게요.");
            setTimeout(() => pad && next(), 1300);
            return;
          }
          busy = true;
          b.classList.add("right");
          KP.audio.sfx("good");
          KP.voice.say(q.right);
          if (!tried) got++;
          drawDots();
          setTimeout(() => {
            if (!pad) return;
            if (got >= need) {
              const min = KP.settings.get().kidMin;
              gate.unlockFor(min);
              KP.audio.sfx("sparkle");
              KP.confetti && KP.confetti(140);
              KP.voice.say("문이 열렸어요! " + min + "분 동안 놀 수 있어요!");
              close();
              KP.renderHome();
              then && then();
            } else next();
          }, 1100);
        });
        opts.appendChild(b);
      });
      speak();
    };
    drawDots();
    next();
  }
  // 문지기로 연 시간이 끝나면: 홈은 다시 잠그고, 잠긴 놀이 중이면 홈으로
  setInterval(() => {
    if (!kidUntil || Date.now() < kidUntil) return;
    kidUntil = 0;
    KP.store.set("gate:until", 0);
    if (gate.unlocked()) return; // 어른이 날짜로 연 날은 그대로
    const c = KP.current();
    KP.toast("⏰ 놀이 시간 끝! 공부하고 또 열어요");
    KP.voice.say("놀이 시간이 끝났어요! 공부 놀이를 하고 또 열어요.");
    if (c && gate.locked(c.def.cat)) setTimeout(() => KP.current() === c && KP.home(), 3500);
    else if (!c) KP.renderHome();
  }, 5000);

  // 어떤 길로 놀이를 열든(홈 카드, 작품 '이어 그리기' 등) 잠금 확인
  const rawOpen = KP.open;
  KP.open = function (id) {
    const g = KP.GAMES[id];
    if (g && gate.locked(g.cat)) return gate.ask(() => rawOpen(id));
    return rawOpen(id);
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
        if (gate.locked(c.id)) {
          KP.audio.sfx("tap");
          return gate.ask(() => {
            KP.settings.set({ lastCat: c.id });
            KP.renderHome();
          });
        }
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
    let cat = KP.CATS.find((c) => c.id === s.lastCat) ? s.lastCat : KP.CATS[0].id;
    // 잠긴 카테고리면 열린 카테고리(공부 놀이 우선)로 보여 줌
    if (gate.locked(cat)) cat = (KP.CATS.find((c) => c.id === "study" && !gate.locked(c.id)) || KP.CATS.find((c) => !gate.locked(c.id)) || { id: cat }).id;
    U.$$(".tab", home).forEach((t) => {
      t.classList.toggle("sel", t.dataset.cat === cat);
      t.classList.toggle("locked", gate.locked(t.dataset.cat));
    });
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
