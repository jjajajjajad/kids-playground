/* =====================================================================
   화면 틀 · 게임 등록 · 게임 컨텍스트(ctx)

   게임 등록:
   KP.game({
     id:"count", icon:"🔢", name:"숫자 세기", cat:"smart",
     levels: 3,            // (선택) 자동 난이도 단계 수
     score: "⭐",          // (선택) 상단 점수 표시 아이콘
     bubble: true,         // (선택, 기본 true) 안내 말풍선 표시
     setup(ctx){},         // 처음 열 때 한 번: 화면 요소 만들기
     start(ctx){},         // 열 때마다: 새 판 시작
     stop(ctx){},          // 나갈 때: (타이머 등은 자동 정리됨)
   })

   ctx 주요 기능 — docs/GAME_API.md 참고
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const GAMES = (KP.GAMES = {});
  const ORDER = (KP.ORDER = []);

  KP.CATS = [
    // color: 놀이 안 강조색, soft: 홈 카드·제목 스티커의 파스텔색
    { id: "play", name: "신나는 놀이", icon: "🎈", color: "#2f95f5", soft: "#ffb4a2" },
    { id: "make", name: "만들기", icon: "🎨", color: "#ff7452", soft: "#ffe08a" },
    { id: "music", name: "음악", icon: "🎵", color: "#8a63ee", soft: "#d6c4ff" },
    { id: "smart", name: "똑똑 놀이", icon: "🧠", color: "#2fb466", soft: "#a8e8c2" },
    { id: "study", name: "공부 놀이", icon: "📚", color: "#ff5d8f", soft: "#ffc6da" },
    { id: "bigkid", name: "형아 도전", icon: "🦸", color: "#f29a00", soft: "#a9d0ff" },
  ];
  KP.SOFT_DEFAULT = "#c9e4ff";
  KP.MASCOT = "🐻";

  KP.game = function (def) {
    if (GAMES[def.id]) console.warn("duplicate game id", def.id);
    GAMES[def.id] = Object.assign({ bubble: true, levels: 1 }, def);
    ORDER.push(def.id);
  };

  /* ---------------- 자동 난이도 ---------------- */
  KP.level = {
    get(id) {
      const d = { lvl: 1, streak: 0, miss: 0, wins: 0, best: 0, plays: 0 };
      const v = KP.store.get("lv:" + id, d);
      if (!v || typeof v !== "object") return d;
      const o = Object.assign({}, d, v);
      for (const k in d) if (!Number.isFinite(o[k])) o[k] = d[k];
      o.lvl = Math.max(1, Math.round(o.lvl));
      return o;
    },
    save(id, v) {
      KP.store.set("lv:" + id, v);
    },
  };

  /* ---------------- 화면 전환 ---------------- */
  let current = null; // 현재 ctx (홈이면 null)
  const screens = {};
  KP.current = () => current;

  KP.open = function (id) {
    const def = GAMES[id];
    if (!def) return;
    if (current) leave();
    KP.voice.stop();
    let ctx = screens[id];
    if (!ctx) {
      ctx = screens[id] = makeCtx(def);
      try {
        def.setup && def.setup(ctx);
      } catch (e) {
        console.error(e);
        KP.reportError && KP.reportError(id, e);
      }
    }
    U.$$(".screen.on").forEach((s) => s.classList.remove("on"));
    ctx.root.classList.add("on");
    U.replay(ctx.root, "enter");
    current = ctx;
    ctx._active = true;
    ctx._session = (ctx._session || 0) + 1; // 나갔다 다시 들어오면 이전 판의 후속 동작 무효
    ctx._idleAt = Date.now();
    const lv = KP.level.get(id);
    lv.plays++;
    KP.level.save(id, lv);
    ctx._updateLevel();
    if (def.score) ctx.score.set(0);
    try {
      def.start && def.start(ctx);
    } catch (e) {
      console.error(e);
      KP.reportError && KP.reportError(id, e);
    }
    KP.store.set("lastGame", id);
  };
  function leave() {
    const ctx = current;
    if (!ctx) return;
    ctx._active = false;
    ctx._clearTimers();
    KP.cancelCelebrate && KP.cancelCelebrate();
    KP.audio.newScene();
    ctx.hint(null);
    try {
      ctx.def.stop && ctx.def.stop(ctx);
    } catch (e) {
      console.error(e);
    }
    if (ctx.def.score) {
      const lv = KP.level.get(ctx.id);
      if (ctx.score.get() > (lv.best || 0)) {
        lv.best = ctx.score.get();
        KP.level.save(ctx.id, lv);
      }
    }
    current = null;
  }
  KP.home = function () {
    leave();
    KP.voice.stop();
    U.$$(".screen.on").forEach((s) => s.classList.remove("on"));
    const h = U.$("#home");
    h.classList.add("on");
    U.replay(h, "enter");
    KP.renderHome && KP.renderHome();
  };

  /* ---------------- 게임 컨텍스트 ---------------- */
  function makeCtx(def) {
    const cat = KP.CATS.find((c) => c.id === def.cat) || KP.CATS[0];
    const root = U.el("section", "screen game cat-" + def.cat);
    root.id = "g-" + def.id;
    root.style.setProperty("--cat", cat.color);
    root.style.setProperty("--soft", def.cat === cat.id ? cat.soft : KP.SOFT_DEFAULT);

    const bar = U.el("header", "bar");
    const homeBtn = U.btn(KP.E("🏠"), "barBtn home");
    const title = U.el("div", "title", KP.E(def.icon) + "<span>" + def.name + "</span>");
    const right = U.el("div", "barRight");
    const lvDots = U.el("div", "lvDots");
    lvDots.setAttribute("aria-hidden", "true");
    const lvBadge = U.el("div", "pill lvPill");
    const scorePill = U.el("div", "pill scorePill", KP.E(def.score || "⭐") + "<b>0</b>");
    const stPill = U.el("div", "pill stickerPill", KP.E("📒") + "<b>0</b>");
    if (!def.score) scorePill.style.display = "none";
    right.append(lvDots, lvBadge, scorePill, stPill);
    bar.append(homeBtn, title, right);

    const bubble = U.el("div", "bubble");
    const bubbleTxt = U.el("div", "bubbleTxt");
    bubble.append(U.el("span", "bubbleMascot", KP.E(KP.MASCOT)), bubbleTxt, U.el("span", "bubbleSpk", KP.E("🔊")));
    if (!def.bubble) bubble.style.display = "none";

    const stage = U.el("main", "stage");
    root.append(bar, bubble, stage);
    U.$("#app").appendChild(root);

    const timers = new Set(),
      intervals = new Set(),
      rafs = new Set();
    let score = 0;

    const ctx = {
      id: def.id,
      def,
      root,
      bar,
      body: stage,
      stage,
      bubble,
      cat,
      _active: false,
      _idleAt: Date.now(),
      instr: "",
      /** 현재 난이도 단계 (1부터) */
      get level() {
        return Math.min(KP.level.get(def.id).lvl, def.levels || 1);
      },
      /** 안내 문장 표시 + 읽어주기 */
      say(text, speak = true) {
        const spoken = typeof speak === "string" ? speak : text;
        ctx.instr = spoken;
        bubbleTxt.innerHTML = KP.E(text);
        U.replay(bubble, "pop");
        if (speak) return KP.voice.say(spoken.replace(/\p{Extended_Pictographic}|️/gu, ""));
        return Promise.resolve();
      },
      /** 읽어주기만 (말풍선은 그대로) */
      tell(text, o) {
        KP.voice.say(text, o);
      },
      score: {
        get: () => score,
        set(n) {
          score = n;
          scorePill.querySelector("b").textContent = n;
        },
        add(n = 1) {
          score += n;
          const b = scorePill.querySelector("b");
          b.textContent = score;
          U.replay(scorePill, "bump");
          return score;
        },
      },
      /* --- 자동 정리되는 타이머 --- */
      after(ms, fn) {
        const t = setTimeout(() => {
          timers.delete(t);
          if (ctx._active) fn();
        }, ms);
        timers.add(t);
        return t;
      },
      every(ms, fn) {
        const t = setInterval(() => {
          if (ctx._active) fn();
        }, ms);
        intervals.add(t);
        return t;
      },
      cancel(t) {
        clearTimeout(t);
        clearInterval(t);
        timers.delete(t);
        intervals.delete(t);
      },
      /** 매 프레임 실행. fn(dt초)가 false 를 돌려주면 멈춤 */
      loop(fn) {
        let last = performance.now(),
          id = 0;
        const step = (now) => {
          rafs.delete(id);
          if (!ctx._active) return;
          const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); // 첫 프레임 시각이 앞설 수 있어 음수 방지
          last = now;
          if (fn(dt, now) === false) return;
          id = requestAnimationFrame(step);
          rafs.add(id);
        };
        id = requestAnimationFrame(step);
        rafs.add(id);
      },
      wait(ms) {
        return new Promise((res) => ctx.after(ms, res));
      },
      _clearTimers() {
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
        rafs.forEach(cancelAnimationFrame);
        timers.clear();
        intervals.clear();
        rafs.clear();
      },
      /* --- 터치 --- */
      /** 버튼류: 스크롤과 구분되는 click (살짝 늦지만 오작동 없음) */
      tap(el, fn) {
        el.addEventListener("click", (e) => {
          KP.audio.unlock();
          if (el.dataset.busy) return;
          fn(e);
        });
        return el;
      },
      /** 게임판: 닿는 순간 즉시 반응 */
      fast(el, fn) {
        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          KP.audio.unlock();
          fn(e);
        });
        return el;
      },
      /* --- 결과 --- */
      /**
       * 성공 처리: 축하 연출 + 난이도/스티커 진행
       * @param {{big?:boolean, msg?:string, quiet?:boolean}} o
       * @returns Promise (연출이 끝나면 resolve)
       */
      win(o = {}) {
        const lv = KP.level.get(def.id);
        lv.wins = (lv.wins || 0) + 1;
        lv.streak = (lv.streak || 0) + 1;
        lv.miss = 0;
        let up = false;
        if (def.levels > 1 && lv.streak >= 3 && lv.lvl < def.levels) {
          lv.lvl++;
          lv.streak = 0;
          up = true;
        }
        KP.level.save(def.id, lv);
        ctx._updateLevel();
        ctx.hint(null);
        const sess = ctx._session;
        return KP.celebrate(Object.assign({ levelUp: up, ctx }, o)).then(() => ctx._active && ctx._session === sess);
      },
      /** 틀렸을 때: 흔들기 + 부드러운 소리 + (선택) 안내 */
      miss(el, msg, o = {}) {
        if (el) U.replay(el, "wrong");
        KP.audio.sfx("bad");
        if (msg) KP.voice.say(msg);
        if (o.soft) return; // 단계 계산에 넣지 않는 가벼운 실수
        const lv = KP.level.get(def.id);
        lv.miss = (lv.miss || 0) + 1;
        lv.streak = 0;
        if (lv.miss >= 5 && lv.lvl > 1) {
          lv.lvl--;
          lv.miss = 0;
        }
        KP.level.save(def.id, lv);
        ctx._updateLevel();
      },
      /**
       * 보기 고르기 버튼 묶음 만들기 (퀴즈형 공통)
       * @param {HTMLElement} box   버튼을 넣을 곳 (내용은 비워짐)
       * @param {Array} list        보기 값들
       * @param {{render:(v)=>string, right:(v)=>boolean, wrongMsg?:(v)=>string,
       *          onRight:(v,btn)=>any, cls?:string}} o
       * @returns {HTMLElement[]} 버튼들 (각 버튼 dataset.right="1" 이면 정답)
       */
      choices(box, list, o) {
        box.innerHTML = "";
        let busy = false;
        return list.map((v, i) => {
          const b = U.el("button", "choice " + (o.cls || ""), o.render ? o.render(v) : KP.E(String(v)));
          b.style.setProperty("--i", i);
          if (o.right(v)) b.dataset.right = "1";
          b.addEventListener("click", async () => {
            if (busy) return;
            KP.audio.unlock();
            if (o.right(v)) {
              busy = true;
              b.classList.add("right");
              await (o.onRight && o.onRight(v, b));
            } else ctx.miss(b, o.wrongMsg ? o.wrongMsg(v) : "다시 해 볼까요?");
          });
          box.appendChild(b);
          return b;
        });
      },
      /** 진행형 게임용: 일정 개수마다 축하 (예: 풍선 10개) */
      milestone(n, every = 10) {
        if (n > 0 && n % every === 0) return ctx.win({ msg: n + "개!" });
        return Promise.resolve(true);
      },
      /* --- 힌트 --- */
      _hint: null,
      /**
       * 아이가 한동안 멈춰 있으면 손가락으로 가리키며 다시 안내
       * @param {Function|null} getTarget  () => 가리킬 요소
       * @param {string} text  다시 읽어줄 말 (없으면 현재 안내)
       */
      hint(getTarget, text) {
        ctx._hint = getTarget ? { getTarget, text, shown: 0 } : null;
        ctx._idleAt = Date.now();
        KP.hideHint();
      },
      _updateLevel() {
        const lv = KP.level.get(def.id);
        if (def.levels > 1) {
          lvBadge.style.display = "";
          lvBadge.innerHTML = KP.E("🏅") + "<b>" + Math.min(lv.lvl, def.levels) + "단계</b>";
          // 다음 단계까지: 연속 3번 성공하면 단계가 오른다 (win 의 규칙과 같음)
          if (lv.lvl < def.levels) {
            const n = Math.min(3, lv.streak || 0);
            lvDots.innerHTML = "<i></i><i></i><i></i>";
            [...lvDots.children].forEach((d, i) => d.classList.toggle("on", i < n));
            lvDots.style.display = "";
          } else lvDots.style.display = "none";
        } else {
          lvBadge.style.display = "none";
          lvDots.style.display = "none";
        }
        stPill.querySelector("b").textContent = KP.stickers ? KP.stickers.count() : 0;
      },
      stickerPill: stPill,
    };
    homeBtn.addEventListener("click", () => {
      KP.home();
      KP.audio.sfx("back");
    });
    bubble.addEventListener("click", () => {
      if (ctx.instr) KP.voice.say(ctx.instr.replace(/\p{Extended_Pictographic}|️/gu, ""));
      U.replay(bubble, "pop");
    });
    root.addEventListener("pointerdown", () => {
      ctx._idleAt = Date.now();
      KP.hideHint();
    }, true);
    // 끄는 동안에도 '멈춰 있음'으로 보지 않기
    root.addEventListener("pointermove", (e) => {
      if (e.buttons || e.pointerType !== "mouse") ctx._idleAt = Date.now();
    }, { capture: true, passive: true });
    return ctx;
  }

  /* ---------------- 힌트 손가락 ---------------- */
  let hand = null;
  KP.hideHint = function () {
    if (hand) hand.classList.remove("show");
    U.$$(".hintGlow").forEach((e) => e.classList.remove("hintGlow"));
  };
  function showHint(ctx) {
    const h = ctx._hint;
    let t = null;
    try {
      t = h.getTarget();
    } catch (e) {}
    if (!t) return;
    let x, y;
    if (typeof t.x === "number" && !(t instanceof Element)) {
      // 캔버스 게임: 화면 좌표 {x, y}
      x = t.x;
      y = t.y;
    } else {
      if (!t.isConnected) return;
      const r = t.getBoundingClientRect();
      if (!r.width) return;
      x = r.left + r.width / 2;
      y = r.top + r.height * 0.6;
      t.classList.add("hintGlow");
    }
    if (!hand) {
      hand = U.el("div", "hintHand", KP.E("👆"));
      document.body.appendChild(hand);
    }
    hand.style.left = x + "px";
    hand.style.top = y + "px";
    hand.classList.add("show");
    const txt = h.text || ctx.instr;
    if (txt) KP.voice.say(txt.replace(/\p{Extended_Pictographic}|️/gu, ""));
    h.shown++;
    setTimeout(KP.hideHint, 3200);
  }
  setInterval(() => {
    const ctx = current;
    if (!ctx || !ctx._hint || !KP.settings.get().hints || KP.celebrating) return;
    const idle = Date.now() - ctx._idleAt;
    const wait = ctx._hint.shown === 0 ? 8000 : 14000;
    if (idle > wait && ctx._hint.shown < 3) {
      ctx._idleAt = Date.now();
      showHint(ctx);
    }
  }, 1000);

  /* ---------------- 오류 기록 (자동 점검용) ---------------- */
  KP.errors = [];
  KP.reportError = (where, e) => KP.errors.push(where + ": " + (e && e.message));
  window.addEventListener("error", (e) => KP.errors.push("window: " + e.message));
})(window.KP);
