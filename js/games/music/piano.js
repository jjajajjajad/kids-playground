/* 피아노 — 도~도 무지개 건반 8개 (+ 작은 검은 건반, 켜고 끄기)
   - 악기: 피아노 / 오르골 / 마림바
   - 누르면 건반 위로 음표가 날아오르고 동물 합창단이 들썩
   - 손가락을 건반 위로 쓸면 주르륵(글리산도), 여러 손가락 동시에 OK
   - 🌟 따라 치기: 동요를 고르면 다음에 칠 건반이 반짝 → 누르면 다음 음 → 한 곡 완성 시 축하
     (1단계: 앞 두 소절, 2단계: 절반, 3단계: 끝까지) */
"use strict";
KP.game({
  id: "piano",
  icon: "🎹",
  name: "피아노",
  cat: "music",
  levels: 3,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("piano", `
      .pn{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:0 12px 12px}
      .pn-top{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;flex:0 0 auto}
      .pn-ib{font-size:clamp(16px,2.2vw,21px);padding:8px 14px;min-height:56px}
      .pn-ib .e{font-size:1.5em}
      .pn-ib.sel{background:var(--sun);box-shadow:0 6px 0 #d9a000}
      .pn-song{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .pn-choir{flex:0 0 auto;display:flex;justify-content:center;gap:clamp(6px,2vw,26px);font-size:clamp(46px,8.5vh,82px);line-height:1;height:clamp(60px,11vh,100px);align-items:flex-end}
      .pn-choir span{display:inline-block;transform-origin:bottom center}
      .pn-choir .sing{animation:pnSing .45s cubic-bezier(.3,1.6,.5,1)}
      @keyframes pnSing{40%{transform:translateY(-22%) scale(1.12,.92) rotate(-6deg)}}
      .pn-prog{flex:0 0 auto;display:none;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
      .pn-prog.on{display:flex}
      .pn-dots{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:min(760px,80vw)}
      .pn-dot{width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px #d6dcef}
      .pn-dot.done{background:var(--grass);box-shadow:none}
      .pn-dot.now{background:var(--sun);transform:scale(1.4);box-shadow:none}
      .pn-keys{flex:1;min-height:0;position:relative;display:flex;gap:6px;padding:10px;border-radius:26px;background:linear-gradient(#5b4a8a,#3d3166);box-shadow:0 8px 0 #2a2048}
      .pn-key{flex:1;position:relative;border-radius:0 0 18px 18px;background:#fff;box-shadow:inset 0 -14px 0 var(--k),0 5px 0 rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:20px;
        font-size:clamp(17px,2.6vw,28px);color:var(--k);transition:transform .06s;touch-action:none}
      .pn-key::before{content:"";position:absolute;left:14%;right:14%;top:12px;height:30%;border-radius:12px;background:var(--k);opacity:.22}
      .pn-key b{font-weight:400;position:relative;color:#3a3a55}
      .pn-key.down{transform:translateY(5px);box-shadow:inset 0 -8px 0 var(--k),0 1px 0 rgba(0,0,0,.25);background:color-mix(in srgb,var(--k) 28%,#fff)}
      .pn-key.next{animation:pnNext 1s ease-in-out infinite}
      .pn-key.next::after{content:"";position:absolute;inset:-5px;border-radius:0 0 20px 20px;box-shadow:0 0 0 6px #ffe14d,0 0 26px 10px rgba(255,225,77,.85);pointer-events:none}
      @keyframes pnNext{50%{transform:translateY(-6px)}}
      .pn-star{position:absolute;left:0;right:0;text-align:center;top:6%;font-size:clamp(30px,4.6vw,48px);animation:bob 1s ease-in-out infinite;pointer-events:none}
      .pn-bk{position:absolute;top:10px;height:52%;width:calc((100% - 20px) / 8 * .58);margin-left:calc((100% - 20px) / 8 * -.29);border-radius:0 0 12px 12px;background:linear-gradient(#3a3550,#1f1b30);box-shadow:0 5px 0 #0c0a14;z-index:2;touch-action:none;display:none}
      .pn-keys.black .pn-bk{display:block}
      .pn-bk.down{transform:translateY(4px);background:#6a5a9a}
      .pn-note{position:absolute;pointer-events:none;font-size:clamp(28px,4vw,44px);z-index:5;animation:pnFly 1.1s ease-out forwards}
      @keyframes pnFly{from{transform:translate(-50%,0) scale(.5);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-170px) scale(1.2) rotate(var(--r));opacity:0}}
      .pn-pick{position:absolute;inset:0;z-index:20;background:rgba(244,238,255,.97);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:14px}
      .pn-pick.show{display:flex;animation:enter .3s}
      .pn-pick h3{font-weight:400;font-size:clamp(22px,3.4vw,32px)}
      .pn-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:min(860px,100%)}
      .pn-card{background:#fff;border-radius:24px;padding:14px 8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:6px;font-size:clamp(17px,2.4vw,24px);animation:cardIn .4s backwards;animation-delay:calc(var(--i) * 50ms)}
      .pn-card .e{font-size:clamp(48px,8vw,80px)}
      .pn-card:active{transform:scale(.96)}
      @media (max-aspect-ratio:1/1){
        .pn{padding:0 8px 10px;gap:6px}
        .pn-keys{gap:3px;padding:8px}
        .pn-key{border-radius:0 0 12px 12px;font-size:16px;padding-bottom:12px}
        .pn-ib{padding:6px 10px;min-height:50px;font-size:15px}
        .pn-ib span{display:none}
        .pn-song span{display:inline}
        .pn-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
    `);

    const KEYS = [
      ["C4", "도", "#ff4f5e"], ["D4", "레", "#ff9a2e"], ["E4", "미", "#f2c200"], ["F4", "파", "#3cc45a"],
      ["G4", "솔", "#2fb6e8"], ["A4", "라", "#3f6cf0"], ["B4", "시", "#8a5cf0"], ["C5", "도", "#ff5fae"],
    ];
    const BLACKS = [["C#4", 1], ["D#4", 2], ["F#4", 4], ["G#4", 5], ["A#4", 6]];
    const CHOIR = ["🐻", "🐰", "🐱", "🐶", "🐸"];
    const INSTS = [["piano", "🎹", "피아노"], ["bell", "🔔", "오르골"], ["marimba", "🪵", "마림바"]];
    const SONGS = [["twinkle", "⭐"], ["airplane", "✈️"], ["butterfly", "🦋"], ["schoolbell", "🔔"], ["bears", "🐻"]];
    const pref = Object.assign({ inst: "piano", black: false }, KP.store.get("piano:prefs", {}));
    const savePref = () => KP.store.set("piano:prefs", pref);

    /* ---------- 소리 ---------- */
    function play(n) {
      const f = A.hz(n);
      if (pref.inst === "piano") {
        A.tone(f, { type: "triangle", dur: 1.7, vol: 0.2, attack: 0.004 });
        A.tone(f * 2, { dur: 1.0, vol: 0.07, attack: 0.004 });
        A.tone(f * 3, { dur: 0.55, vol: 0.035, attack: 0.003 });
        A.tone(f * 4.02, { dur: 0.25, vol: 0.018, attack: 0.002 });
        A.noise({ dur: 0.025, vol: 0.025, lp: 2500 });
      } else if (pref.inst === "bell") {
        A.note(f * 2, { inst: "bell", dur: 1.1, vol: 0.24 });
      } else {
        A.note(f, { inst: "marimba", dur: 0.9, vol: 0.34 });
        A.note(f * 2, { inst: "marimba", dur: 0.3, vol: 0.06 });
      }
    }

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "pn");
    const top = U.el("div", "pn-top");
    const instBtns = INSTS.map(([id, em, name]) => {
      const b = U.btn(KP.E(em) + "<span>" + name + "</span>", "btn pn-ib");
      ctx.tap(b, () => {
        pref.inst = id;
        savePref();
        markInst();
        U.replay(b, "jump");
        play("C5");
        KP.voice.say(name);
      });
      top.appendChild(b);
      return [id, b];
    });
    const bBlack = U.btn('<i style="display:inline-block;width:.9em;height:1.2em;background:#2a2540;border-radius:0 0 5px 5px;vertical-align:-.2em"></i><span> 검은 건반</span>', "btn pn-ib");
    const bSong = U.btn(KP.E("🌟") + "<span>따라 치기</span>", "btn pn-ib pn-song");
    top.append(bBlack, bSong);
    const choir = U.el("div", "pn-choir");
    const singers = CHOIR.map((e) => {
      const s = U.el("span", "", KP.E(e));
      choir.appendChild(s);
      return s;
    });
    const prog = U.el("div", "pn-prog");
    const dots = U.el("div", "pn-dots");
    const bStop = U.btn(KP.E("✖️") + " 그만", "btn");
    prog.append(dots, bStop);
    const keysEl = U.el("div", "pn-keys");
    const keyEls = KEYS.map(([n, sol, col], i) => {
      const k = U.el("div", "pn-key", "<b>" + sol + "</b>");
      k.style.setProperty("--k", col);
      k.dataset.n = n;
      k.dataset.i = i;
      keysEl.appendChild(k);
      return k;
    });
    const blackEls = BLACKS.map(([n, pos]) => {
      const k = U.el("div", "pn-bk");
      k.style.left = "calc(10px + (100% - 20px) / 8 * " + pos + ")";
      k.dataset.n = n;
      keysEl.appendChild(k);
      return k;
    });
    const picker = U.el("div", "pn-pick");
    wrap.append(top, choir, prog, keysEl);
    ctx.body.append(wrap, picker);
    function markInst() {
      instBtns.forEach(([id, b]) => b.classList.toggle("sel", id === pref.inst));
      bBlack.classList.toggle("sel", pref.black);
      keysEl.classList.toggle("black", pref.black);
    }
    ctx.tap(bBlack, () => {
      pref.black = !pref.black;
      savePref();
      markInst();
      A.sfx(pref.black ? "pick" : "slide");
      KP.voice.say(pref.black ? "검은 건반이 나왔어요" : "검은 건반을 숨겼어요");
    });

    /* ---------- 누르기 (여러 손가락 + 쓸기) ---------- */
    const held = new Map(); // pointerId → key element
    function press(k) {
      const n = k.dataset.n;
      play(n);
      k.classList.add("down");
      const i = k.dataset.i != null ? +k.dataset.i : -1;
      // 음표 날리기
      const kr = k.getBoundingClientRect(),
        wr = keysEl.getBoundingClientRect();
      const nt = U.el("div", "pn-note", KP.E(U.pick(["🎵", "🎶"])));
      nt.style.left = kr.left - wr.left + kr.width / 2 + "px";
      nt.style.top = kr.top - wr.top + 10 + "px";
      nt.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "px");
      nt.style.setProperty("--r", (Math.random() - 0.5) * 60 + "deg");
      keysEl.appendChild(nt);
      setTimeout(() => nt.remove(), 1150);
      const s = singers[i >= 0 ? i % singers.length : U.rand(singers.length)];
      U.replay(s, "sing");
      ctx.hint(null);
      if (follow) followPress(i, n);
    }
    function release(k) {
      if (k) k.classList.remove("down");
    }
    const keyAt = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el && el.closest && el.closest(".pn-key,.pn-bk");
    };
    keysEl.addEventListener("pointerdown", (e) => {
      const k = e.target.closest(".pn-key,.pn-bk");
      if (!k) return;
      e.preventDefault();
      A.unlock();
      try {
        k.releasePointerCapture(e.pointerId);
      } catch (_) {}
      held.set(e.pointerId, k);
      press(k);
    });
    keysEl.addEventListener("pointermove", (e) => {
      if (!held.has(e.pointerId)) return;
      const k = keyAt(e.clientX, e.clientY);
      const was = held.get(e.pointerId);
      if (k && k !== was) {
        release(was);
        held.set(e.pointerId, k);
        press(k);
      }
    });
    const up = (e) => {
      if (!held.has(e.pointerId)) return;
      release(held.get(e.pointerId));
      held.delete(e.pointerId);
    };
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => keysEl.addEventListener(ev, up));

    /* ---------- 따라 치기 ---------- */
    let follow = null; // {key, notes, idx, wrong}
    function phrasesOf(notes) {
      const out = [];
      let cur = [];
      notes.forEach(([n, b]) => {
        if (n !== "R") cur.push([n, b]);
        if (b >= 2 || n === "R") {
          if (cur.length) out.push(cur);
          cur = [];
        }
      });
      if (cur.length) out.push(cur);
      return out;
    }
    function startFollow(key) {
      const song = A.SONGS[key];
      const ph = phrasesOf(song.notes);
      const lv = ctx.level;
      const take = lv === 1 ? 2 : lv === 2 ? Math.max(2, Math.ceil(ph.length / 2)) : ph.length;
      const notes = [].concat(...ph.slice(0, take));
      follow = { key, notes, idx: 0, wrong: 0 };
      dots.innerHTML = "";
      notes.forEach(() => dots.appendChild(U.el("span", "pn-dot")));
      prog.classList.add("on");
      picker.classList.remove("show");
      ctx.say(song.name + "! 반짝이는 건반을 차례로 눌러요.");
      // 첫 소절을 살짝 들려주고, 바로 반짝이는 건반으로 시작
      A.melody(ph[0], { beat: 0.34, inst: "bell", octave: 1, vol: 0.14, when: 0.6 });
      markNext();
    }
    function markNext(quiet) {
      keyEls.forEach((k) => {
        k.classList.remove("next");
        const st = k.querySelector(".pn-star");
        if (st) st.remove();
      });
      if (!follow) return;
      U.$$(".pn-dot", dots).forEach((d, i) => {
        d.classList.toggle("done", i < follow.idx);
        d.classList.toggle("now", i === follow.idx);
      });
      if (quiet) return;
      const n = follow.notes[follow.idx];
      if (!n) return;
      const k = keyEls.find((x) => x.dataset.n === n[0]);
      if (k) {
        k.classList.add("next");
        k.appendChild(U.el("span", "pn-star", KP.E("⭐")));
        ctx.hint(() => k, "반짝이는 건반을 눌러요!");
      }
    }
    async function followPress(i, n) {
      const want = follow.notes[follow.idx];
      if (!want || KP.celebrating) return;
      if (n !== want[0]) {
        follow.wrong++;
        const k = keyEls.find((x) => x.dataset.n === want[0]);
        if (k) U.replay(k, "jump");
        if (follow.wrong % 3 === 0) KP.voice.say("반짝이는 건반을 눌러요!");
        return;
      }
      follow.wrong = 0;
      follow.idx++;
      if (follow.idx < follow.notes.length) return markNext();
      // 완성!
      markNext(true);
      const f = follow;
      follow = null;
      keyEls.forEach((k) => k.classList.remove("next"));
      ctx.hint(null);
      const song = A.SONGS[f.key];
      KP.voice.say("우와! " + song.name + " 완성!");
      const len = A.melody(f.notes, { beat: 0.3, inst: "bell", octave: 1, vol: 0.2, when: 0.9 });
      f.notes.forEach(([, b], k) => ctx.after(900 + k * 300, () => U.replay(singers[k % singers.length], "sing")));
      await ctx.wait(900 + len * 1000);
      prog.classList.remove("on");
      const ok = await ctx.win({ big: true, msg: song.name + " 완성!" });
      if (!ok) return;
      ctx.say("또 다른 노래를 쳐 볼까요? 별 단추를 눌러요!");
      ctx.hint(() => bSong, "별 단추를 누르면 노래를 고를 수 있어요!");
    }
    function stopFollow() {
      follow = null;
      prog.classList.remove("on");
      markNext(true);
      keyEls.forEach((k) => k.classList.remove("next"));
      U.$$(".pn-star", keysEl).forEach((s) => s.remove());
      ctx.hint(null);
    }
    ctx.tap(bStop, () => {
      A.sfx("back");
      stopFollow();
      ctx.say("마음대로 쳐 봐요!");
    });
    ctx.tap(bSong, () => {
      A.sfx("open");
      picker.innerHTML = "<h3>" + KP.E("🌟") + " 어떤 노래를 칠까요?</h3>";
      const cards = U.el("div", "pn-cards");
      SONGS.forEach(([key, em], i) => {
        const c = U.btn(KP.E(em) + "<span>" + A.SONGS[key].name + "</span>", "pn-card");
        c.style.setProperty("--i", i);
        ctx.tap(c, () => {
          A.sfx("select");
          startFollow(key);
        });
        cards.appendChild(c);
      });
      const close = U.btn(KP.E("↩️") + " 돌아가기", "btn");
      ctx.tap(close, () => picker.classList.remove("show"));
      picker.append(cards, close);
      picker.classList.add("show");
      KP.voice.say("어떤 노래를 칠까요?");
    });

    ctx.init = () => {
      stopFollow();
      picker.classList.remove("show");
      markInst();
    };
    ctx.stopFollow = stopFollow;
  },
  start(ctx) {
    ctx.init();
    // 피아노 칠 때는 배경음악 잠시 끄기
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.say("건반을 눌러 연주해 봐요! 별 단추를 누르면 노래를 따라 칠 수 있어요.");
    ctx.hint(() => ctx.body.querySelector(".pn-key"), "건반을 눌러 봐요!");
  },
  stop(ctx) {
    ctx.stopFollow();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
