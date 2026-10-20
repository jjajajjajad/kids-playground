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
      raf = 0,
      pid = null; // 누르고 있는 손가락 하나만 인정 (두 손가락 톡 → 실행되는 문제 방지)
    el.classList.add("holdBtn");
    const stop = () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      t = null;
      pid = null;
      el.style.setProperty("--p", 0);
      el.classList.remove("holding");
    };
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (pid !== null) {
        stop(); // 다른 손가락이 또 닿으면 처음부터 다시
        return;
      }
      pid = e.pointerId;
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
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, (e) => (pid === null || e.pointerId === pid) && stop()));
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
    /** 한국 날짜 "5월 3일" (작품·도감 날짜 표시용) */
    monthDay: () => {
      const t = todayKST();
      return +t.slice(4, 6) + "월 " + +t.slice(6, 8) + "일";
    },
    unlocked: () => openedOn === todayKST() || Date.now() < kidUntil,
    kidLeft: () => Math.max(0, kidUntil - Date.now()),
    unlock() {
      openedOn = todayKST();
    },
    /** 어른이 날짜로 '오늘 계속' 연 상태 */
    adultOpen: () => openedOn === todayKST(),
    /** 정해진 시간만 열기. src: "earn"(별) | "quiz"(문지기) | "adult"(어른 30분) */
    unlockFor(min, src = "quiz") {
      kidUntil = Date.now() + min * 60000;
      KP.store.set("gate:until", kidUntil);
      KP.store.set("gate:len", min * 60000);
      KP.store.set("gate:src", src);
    },
    src: () => KP.store.get("gate:src", "quiz"),
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
    /** 어른만: 날짜 입력판 (이미 열려 있어도 항상 묻고, 놀이 잠금은 건드리지 않음) */
    adult(then) {
      showPad(then, { adultOnly: true });
    },
  });
  let pad = null;
  function showPad(then, opt = {}) {
    if (pad) pad.remove();
    KP.voice.stop();
    let val = "";
    // 부모 비밀번호(4자리)를 정해 두었으면 그걸로, 아니면 오늘 날짜 8자리
    const pin = KP.settings.get().pin;
    const usePin = !!pin && !opt.dateMode;
    const N = usePin ? 4 : 8;
    const answer = () => (usePin ? pin : todayKST());
    pad = U.el("div", "gatePad" + (opt.adultOnly ? " top" : ""));
    const box = U.el("div", "gateBox");
    box.innerHTML =
      '<div class="gateTitle">' + KP.E("🔒") + " 어른이 열어 주세요</div>" +
      (usePin
        ? '<div class="gateSub">부모 비밀번호 4자리를 눌러 주세요</div>'
        : '<div class="gateSub">오늘 날짜 8자리를 눌러 주세요 <small>(예: 2026년 1월 5일 → 20260105)</small></div>');
    const slots = U.el("div", "gateSlots" + (usePin ? " pin" : ""));
    for (let i = 0; i < N; i++) slots.appendChild(U.el("span", "gateSlot" + (!usePin && (i === 3 || i === 5) ? " gap" : "")));
    const keys = U.el("div", "gateKeys");
    const draw = () => U.$$(".gateSlot", slots).forEach((el, i) => {
      el.textContent = val[i] ? (usePin ? "●" : val[i]) : "";
      el.classList.toggle("on", i === val.length);
    });
    const close = () => {
      if (pad) pad.remove();
      pad = null;
    };
    // 여러 번 틀리면 잠시 입력 막기 (아이가 마구 눌러 우연히 맞히는 것 방지, 새로고침해도 유지)
    const sub = U.$(".gateSub", box);
    const subTxt = sub.innerHTML;
    const lockLeft = () => Math.max(0, (+(KP.store.get("gate:fail", {}).until) || 0) - Date.now());
    const showLock = () => {
      const s = Math.ceil(lockLeft() / 1000);
      sub.innerHTML = s > 0 ? "잠시 후 다시 눌러 주세요 (" + s + "초)" : subTxt;
      if (s > 0) setTimeout(() => pad && sub.isConnected && showLock(), 1000);
    };
    const failed = () => {
      const f = KP.store.get("gate:fail", {});
      f.n = (f.n || 0) + 1;
      if (f.n >= 5) f.until = Date.now() + Math.min(600, 30 * 2 ** (f.n - 5)) * 1000; // 30초부터 두 배씩, 최대 10분
      KP.store.set("gate:fail", f);
      if (f.until > Date.now()) showLock();
    };
    if (lockLeft() > 0) showLock();
    const press = (k) => {
      KP.audio.unlock();
      if (lockLeft() > 0) {
        U.replay(slots, "wrong");
        return;
      }
      if (k === "del") val = val.slice(0, -1);
      else if (val.length < N) val += k;
      KP.audio.sfx("tap");
      draw();
      if (val.length === N) {
        if (val === answer()) {
          KP.store.set("gate:fail", {});
          KP.audio.sfx("good");
          if (opt.adultOnly) {
            close();
            then && then();
            return;
          }
          // 어른: 오늘 계속 열기 / 30분만 열기
          box.innerHTML = '<div class="gateTitle">' + KP.E("🔓") + " 얼마나 열까요?</div>";
          const row = U.el("div", "gateChoice");
          const bAll = U.btn(KP.E("☀️") + " 오늘 계속", "gateKid");
          const b30 = U.btn(KP.E("⏰") + " 30분만", "gateKid");
          row.append(b30, bAll);
          box.appendChild(row);
          const done = (min) => {
            if (min) gate.unlockFor(min, "adult");
            else gate.unlock();
            close();
            KP.renderHome();
            then && then();
          };
          b30.addEventListener("click", () => done(30));
          bAll.addEventListener("click", () => done(0));
        } else {
          U.replay(slots, "wrong");
          KP.audio.sfx("bad");
          failed();
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
    if (usePin) {
      // 비밀번호를 잊었을 때: 5초 꾹 → 오늘 날짜로 열기
      const forgot = U.btn("비밀번호를 잊었어요 (5초 꾹)", "gateForgot");
      KP.hold(forgot, 5000, () => showPad(then, Object.assign({}, opt, { dateMode: true })));
      box.appendChild(forgot);
    }
    const st = KP.settings.get();
    // 아이에게: 별 모으기 안내
    if (!opt.adultOnly && KP.earn && KP.earn.active()) {
      const es = KP.earn.state();
      const need = Math.max(0, st.earnStars - es.stars);
      const go = U.btn(
        KP.earn.capDone() ? KP.E("💤") + " 오늘은 문을 다 열었어요" : need ? KP.E("⭐") + " 별 " + need + "개 더 모으러 가기" : KP.E("🚪") + " 별을 다 모았어요! 문 열기",
        "gateKid gateEarn"
      );
      go.addEventListener("click", () => {
        KP.audio.sfx("open");
        close();
        if (KP.earn.capDone()) return KP.voice.say("오늘은 문을 다 열었어요. 내일 또 열어요!");
        if (!need) return KP.earn.open();
        KP.voice.say("공부 놀이에서 별을 모으면 문이 열려요!");
        if (KP.current()) KP.home();
        KP.settings.set({ lastCat: (KP.CATS.find((c) => !st.lockCats.includes(c.id)) || {}).id || st.lastCat });
        KP.renderHome();
      });
      box.appendChild(go);
    }
    const quiz = KP.store.get("gate:quiz", {});
    const quizLeft = quiz.d === todayKST() ? Math.max(0, st.kidQuizMax - (quiz.n || 0)) : st.kidQuizMax;
    if (st.kidGate && !opt.adultOnly && quizLeft <= 0) box.appendChild(U.el("div", "gateSub", KP.E("🐻") + " 문지기 퀴즈는 오늘 다 했어요"));
    if (st.kidGate && !opt.adultOnly && quizLeft > 0) {
      const kid = U.btn(KP.E("🐻") + " " + (KP.kid.nick() ? KP.kid.nick() + ": " : "") + "문제 " + st.kidQ + "개 맞히고 열기", "gateKid");
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
            setTimeout(() => box.isConnected && next(), 1300); // 닫은 뒤 새로 연 입력판에 이전 퀴즈가 끼어들지 않게
            return;
          }
          busy = true;
          b.classList.add("right");
          KP.audio.sfx("good");
          KP.voice.say(q.right);
          if (!tried) got++;
          drawDots();
          setTimeout(() => {
            if (!box.isConnected) return;
            if (got >= need) {
              const min = KP.settings.get().kidMin;
              const q0 = KP.store.get("gate:quiz", {});
              KP.store.set("gate:quiz", { d: todayKST(), n: (q0.d === todayKST() ? q0.n || 0 : 0) + 1 });
              gate.unlockFor(min, "quiz");
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
  let kidWarned = 0;
  setInterval(() => {
    if (kidUntil && kidUntil - Date.now() <= 60000 && kidUntil - Date.now() > 0 && kidWarned !== kidUntil && openedOn !== todayKST()) {
      kidWarned = kidUntil;
      KP.toast("⏰ 1분 뒤에 문이 잠겨요");
      KP.voice.say("1분 뒤에 문이 잠겨요!");
    }
    // 어른이 '오늘 계속' 연 날이 지나면(자정) 다시 잠금
    const dayOver = openedOn && openedOn !== todayKST();
    if (dayOver) openedOn = "";
    if (!dayOver && (!kidUntil || Date.now() < kidUntil)) return;
    if (kidUntil && Date.now() >= kidUntil) {
      kidUntil = 0;
      KP.store.set("gate:until", 0);
    }
    if (gate.unlocked()) return; // 어른이 날짜로 연 날은 그대로
    const c = KP.current();
    if (c && gate.locked(c.def.cat)) KP.lastRound(() => doorClosed());
    else {
      if (!c) KP.renderHome();
      KP.toast("🚪 문이 닫혔어요");
    }
  }, 2000);
  /** 문이 닫힘: 곰이 안내 + 큰 버튼 (공부 놀이로 / 한 번만 더) */
  function doorClosed() {
    if (KP.current()) KP.home();
    const ov = U.el("div", "doorOv");
    const earnOn = KP.earn && KP.earn.active();
    ov.innerHTML = '<div class="doorBox"><div class="doorEm">' + KP.E("🐻") + KP.E("🚪") + '</div><div class="doorTxt">문이 닫혔어요<br><small>' + (earnOn ? "별을 모으면 또 열려요" : "공부 놀이를 하고 또 열어요") + "</small></div></div>";
    const box = ov.firstChild;
    const row = U.el("div", "doorBtns");
    const bGo = U.btn(KP.E("📚") + (earnOn ? " 별 모으러 가기" : " 공부 놀이로"), "btn big primary");
    row.appendChild(bGo);
    if (KP.earn && KP.earn.canOneMore()) {
      const bOne = U.btn(KP.E("☝️") + " 한 번만 더", "btn big");
      bOne.addEventListener("click", () => {
        if (!KP.earn.useOneMore()) return;
        gate.unlockFor(2, "quiz");
        KP.voice.say("딱 한 번만 더!");
        ov.remove();
        KP.renderHome();
      });
      row.appendChild(bOne);
    }
    box.appendChild(row);
    bGo.addEventListener("click", () => {
      KP.audio.sfx("open");
      ov.remove();
      const st = KP.settings.get();
      KP.settings.set({ lastCat: (KP.CATS.find((c) => !st.lockCats.includes(c.id)) || {}).id || st.lastCat });
      KP.renderHome();
    });
    document.body.appendChild(ov);
    KP.audio.sfx("back");
    KP.voice.say(earnOn ? "문이 닫혔어요. 별을 모으면 또 열려요!" : "놀이 시간이 끝났어요! 공부 놀이를 하고 또 열어요.");
    KP.renderHome();
  }

  /* 마지막 판: 놀이 중이면 바로 끊지 않고, 이번 판이 끝날 때(성공 연출 뒤) 또는 최대 90초 뒤에 fn */
  let lastFn = null,
    lastT = 0;
  KP.lastRound = function (fn) {
    const c = KP.current();
    if (!c) return fn();
    if (lastFn) return; // 이미 기다리는 중
    // 판(성공)이 있는 놀이만 판 끝까지 기다림. 자유 놀이(그리기·피아노 등)는 20초 뒤 마무리
    const rounds = (KP.level.get(c.id).wins || 0) > 0;
    KP.toast(rounds ? "⏳ 이번 판이 마지막이에요" : "⏳ 곧 문이 닫혀요");
    if (rounds) KP.voice.say("이번 판이 마지막이에요!", { queue: true });
    lastFn = fn;
    lastT = setTimeout(KP.lastRoundNow, rounds ? 90000 : 20000);
  };
  KP.lastRoundNow = function () {
    const f = lastFn;
    lastFn = null;
    clearTimeout(lastT);
    if (f) f();
  };
  KP.lastRoundWaiting = () => !!lastFn;

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
    const bKey = U.btn("", "act keyBtn");
    bKey.addEventListener("click", () => {
      KP.audio.unlock();
      const E = KP.earn;
      if (gate.unlocked()) return KP.voice.say("문이 열려 있어요! 신나게 놀아요!");
      if (E.capDone()) return KP.voice.say("오늘은 문을 다 열었어요. 내일 또 열어요!");
      if (E.full()) return E.open();
      KP.audio.sfx("tap");
      const st = KP.settings.get();
      KP.voice.say("공부 놀이에서 별을 모으면 문이 열려요!");
      KP.settings.set({ lastCat: (KP.CATS.find((c) => !st.lockCats.includes(c.id)) || {}).id || st.lastCat });
      KP.renderHome();
    });
    const bSt = U.btn(KP.E("📒") + "<b>0</b>", "act stickerBtn");
    const bGal = U.btn(KP.E("🖼️"), "act galBtn");
    const bMusic = U.btn(KP.E("🎵"), "act musicBtn");
    const bFs = U.btn(KP.E("📺"), "act fsBtn");
    const bSet = U.btn(KP.E("⚙️"), "act setBtn");
    acts.append(bKey, bSt, bGal, bMusic, bFs, bSet);
    top.append(brand, acts);

    const tabs = U.el("nav", "tabs");
    tabs.appendChild(mascot);
    const grid = U.el("div", "grid");
    home.append(tabs, top, grid);

    mascot.addEventListener("click", () => {
      U.replay(mascot, "jump");
      KP.audio.sfx("boing");
      KP.voice.say(U.pick(["안녕! 오늘은 뭐 하고 놀까?", "같이 놀자!", "{부름} 반가워!", "무슨 놀이를 할까?"]));
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
    KP.hold(
      bSet,
      2000,
      // 시간 제한이 켜져 있으면 아이가 끄지 못하게 날짜 확인을 한 번 더
      () => KP.gate.adult(() => KP.openSettings()), // 늘 오늘 날짜로 한 번 더 확인 (아이가 잠금을 끄지 못하게)
      () => KP.toast("어른용 버튼이에요")
    );

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
    // 아이 이름을 바꾸면 탭 이름도 ("동훈이 도전")
    KP.settings.on(() =>
      U.$$(".tab", tabs).forEach((t) => {
        const c = KP.CATS.find((x) => x.id === t.dataset.cat);
        const sp = t.querySelector("span");
        if (c && sp && sp.textContent !== c.name) sp.textContent = c.name;
      })
    );
  };
  /** 오늘의 도전: 날짜와 카테고리로 정해지는 하루 한 놀이 */
  KP.heroOf = function (cat) {
    const s = KP.settings.get();
    const ids = KP.ORDER.filter((id) => KP.GAMES[id].cat === cat && !s.hidden[id]);
    if (ids.length < 2) return null;
    const key = today() + cat;
    let hsh = 0;
    for (let k = 0; k < key.length; k++) hsh = (hsh * 31 + key.charCodeAt(k)) >>> 0;
    return ids[hsh % ids.length];
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
    const hero = KP.heroOf(cat);
    if (hero && ids.includes(hero)) {
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
        setTimeout(() => delete card.dataset.busy, 1000); // 잠금판을 닫고 돌아와도 다시 누를 수 있게
        KP.audio.sfx("open");
        KP.voice.hold(isHero ? "오늘의 도전! " + g.name : g.name); // 이름을 끝까지 읽고 놀이 안내가 이어짐
        U.replay(card, "press");
        setTimeout(() => KP.open(id), 140);
      });
      grid.appendChild(card);
    });
    U.$(".stickerBtn b", home).textContent = KP.stickers.count();
    KP.earn && KP.earn.render();
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
    const t = todayKST(); // 잠금과 같은 한국 날짜 기준
    return t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6);
  };
  function usage() {
    const u = KP.store.get("usage", null);
    if (!u || typeof u !== "object" || u.d !== today() || !Number.isFinite(u.s)) return { d: today(), s: 0, bonus: 0 };
    if (!Number.isFinite(u.bonus)) u.bonus = 0;
    return u;
  }
  KP.usage = usage;
  /* 이번만 타이머: 어른이 "지금부터 N분" 을 켜면 그 시각에 잠김 (앱을 껐다 켜도 유지) */
  const sessUntil = () => +KP.store.get("session:until", 0) || 0;
  KP.session = {
    until: sessUntil,
    start(min) {
      KP.store.set("session:until", Date.now() + min * 60000);
      warned = { 5: 0, 1: 0 };
      tick();
    },
    stop() {
      KP.store.set("session:until", 0);
      tick();
    },
  };
  /** 남은 시간(초) — 하루 사용 시간과 이번만 타이머 중 먼저 끝나는 쪽. 제한 없으면 Infinity */
  function timeLeft() {
    let left = Infinity,
      why = "";
    const lim = KP.settings.get().timer;
    const u = usage();
    if (lim > 0 && !(u.bonus >= 100000)) {
      // "오늘은 제한 없이"를 고른 날은 하루 제한을 보지 않음
      left = (lim + (u.bonus || 0)) * 60 - u.s;
      why = "day";
    }
    const su = sessUntil();
    if (su) {
      const l = (su - Date.now()) / 1000;
      if (l < left) {
        left = l;
        why = "session";
      }
    }
    return { left, why };
  }
  KP.timeLeft = timeLeft;

  let bed = null,
    bedWait = false;
  function showBedtime(why) {
    if (bed || bedWait) return;
    // 놀이 중이면 이번 판을 마치고
    if (KP.current() && !KP.lastRoundWaiting()) {
      bedWait = true;
      return KP.lastRound(() => {
        bedWait = false;
        if (KP.current()) KP.home();
        showBedtime(why);
      });
    }
    if (KP.lastRoundWaiting()) return;
    KP.voice.stop();
    if (KP.current()) KP.home();
    const sess = why === "session";
    bed = U.el("div", "bedtime");
    bed.innerHTML =
      '<div class="bedSky"><div class="bedMoon">' + KP.E("🌙") + '</div><div class="bedBear">' + KP.E("🐻") +
      '<span class="zzz">Z z z</span></div><div class="bedTxt">' + (sess ? "놀이 시간 끝!<br>눈을 쉬고 또 놀아요" : "오늘은 여기까지!<br>내일 또 놀자") + "</div></div>";
    const unlock = U.btn(KP.E("🔒") + " 어른 확인", "bedUnlock");
    bed.appendChild(unlock);
    // 아이: 하루 한 번만 "한 번만 더" (2분)
    if (KP.earn && KP.earn.canOneMore()) {
      const one = U.btn(KP.E("☝️") + " 한 번만 더", "bedUnlock bedOne");
      one.addEventListener("click", () => {
        if (!KP.earn.useOneMore()) return;
        KP.voice.say("딱 한 번만 더!");
        extend(2, true);
      });
      bed.appendChild(one);
    }
    document.body.appendChild(bed);
    KP.audio.bgm.stop();
    KP.audio.melody(KP.audio.SONGS.twinkle.notes.slice(0, 14), { beat: 0.5, vol: 0.14 });
    KP.voice.say(sess ? "놀이 시간이 끝났어요! 눈을 쉬고 또 놀아요." : "오늘은 여기까지! 눈이 쉬어야 해요. 내일 또 놀자!");
    // 어른만 풀 수 있게: 오늘 날짜 8자리 → 더 놀 시간 고르기
    unlock.addEventListener("click", () => {
      KP.audio.sfx("tap");
      KP.gate.adult(() => {
        unlock.remove();
        const row = U.el("div", "bedMore");
        const add = (label, min) => {
          const b = U.btn(label, "bedUnlock");
          b.addEventListener("click", () => extend(min));
          row.appendChild(b);
        };
        add(KP.E("⏰") + " 10분 더", 10);
        add(KP.E("⏰") + " 30분 더", 30);
        add(KP.E("🔓") + " 오늘은 제한 없이", -1);
        bed.appendChild(row);
      });
    });
  }
  function extend(min, quiet) {
    const u = usage(),
      lim = KP.settings.get().timer;
    if (min < 0) {
      KP.store.set("session:until", 0);
      if (lim > 0) u.bonus = 100000;
    } else {
      if (sessUntil() && sessUntil() - Date.now() < min * 60000) KP.store.set("session:until", Date.now() + min * 60000);
      if (lim > 0) u.bonus = Math.max(u.bonus || 0, Math.ceil(u.s / 60) - lim + min);
    }
    KP.store.set("usage", u);
    warned = { 5: 0, 1: 0 };
    if (bed) bed.remove();
    bed = null;
    if (!quiet) KP.toast(min < 0 ? "오늘은 시간 제한 없이 놀아요" : min + "분 더 놀 수 있어요");
    if (KP.settings.get().bgm) KP.audio.bgm.start();
    tick();
  }

  /* 남은 시간 표시 + 미리 알려 주기 (5분 전, 1분 전) */
  const pill = U.el("div", "timePill");
  let warned = { 5: 0, 1: 0 };
  function tick() {
    const { left, why } = timeLeft();
    if (left === Infinity) {
      pill.classList.remove("show", "soon");
      return;
    }
    if (left <= 0) {
      pill.classList.toggle("show", bedWait);
      if (bedWait) pill.innerHTML = KP.E("⏳") + " 마지막 판";
      showBedtime(why);
      return;
    }
    if (!pill.parentNode) document.body.appendChild(pill);
    const inGame = !!KP.current();
    const m = Math.ceil(left / 60);
    // 홈에서는 늘 보이고, 놀이 중에는 마지막 5분만 보임
    pill.classList.toggle("show", !bed && (!inGame || left <= 300));
    pill.classList.toggle("soon", left <= 60);
    pill.innerHTML = KP.E("⏳") + " " + (left <= 60 ? Math.ceil(left) + "초" : m + "분");
    if (left <= 300 && left > 240 && !warned[5]) {
      warned[5] = 1;
      KP.toast("⏳ 5분 남았어요");
      KP.voice.say("5분 남았어요!", { queue: true });
    }
    if (left <= 60 && !warned[1]) {
      warned[1] = 1;
      warned[5] = 1;
      KP.toast("⏳ 1분 남았어요");
      KP.voice.say("1분 남았어요! 이제 마무리해요.", { queue: true });
    }
    if (left > 310) warned = { 5: 0, 1: 0 };
  }
  // 아무도 만지지 않고 2분이 지나면 하루 사용 시간을 세지 않음 (켜 두고 자리를 비운 경우)
  let lastTouch = Date.now();
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => (lastTouch = Date.now()), true));
  setInterval(() => {
    if (document.hidden || bed) return;
    if (Date.now() - lastTouch > 120000) return;
    const u = usage();
    u.s += 5;
    KP.store.set("usage", u);
  }, 5000);
  setInterval(() => !document.hidden && tick(), 1000);
})(window.KP);
