/* 실로폰 — 무지개 실로폰 8음 (도~도)
   - 누른 곳으로 채(말렛)가 날아가 '똑' 치는 애니메이션, 손가락으로 쓸면 주르륵
   - 🌟 따라 치기: 동요를 고르면 칠 막대가 반짝 → 차례로 치면 한 곡 완성 (피아노 따라 치기와 같은 방식, 한 옥타브 위)
     단계: 음 개수 기준 1단계 약 6~10음 → 2단계 약 절반 → 3단계 끝까지(partLen). 틀리면 부드러운 '톡' + 칠 막대가 들썩. 쓸기로 지나간 막대는 진행에 안 셈
   - 🔴 녹음: 누르고 치다가 잠깐(2.5초) 멈추면 저절로 끝나고 바로 들려줌 (채가 혼자 연주) — 그만 단추를 눌러도 됨
     ▶ 듣기(녹음이 있을 때만 보임)로 다시 듣기. 3음 이상일 때만 축하(자유 연주라 열쇠 별은 없음). 듣는 동안 막대를 치면 같이 연주(소리 남)
   - 안내는 "반짝이는 막대를 쳐요!" (새 문장 — 녹음 전엔 기기 목소리)
   - 녹음은 KP.store "xylo:rec" 에 저장 → 다음에 열어도 들을 수 있음 */
"use strict";
KP.game({
  id: "xylo",
  icon: "🎐",
  name: "실로폰",
  cat: "music",
  levels: 3,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("xylo", `
      .xy{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .xy-top{display:flex;gap:12px;justify-content:center;align-items:center;flex:0 0 auto;flex-wrap:wrap}
      .xy-b{font-size:clamp(18px,2.4vw,24px);min-height:62px;padding:10px 20px}
      .xy-b .e{font-size:1.5em}
      .xy-rec{color:#e0283c}
      .xy-rec.on{background:#e0283c;color:#fff;box-shadow:0 7px 0 #9c1426;animation:xyPulse 1s ease-in-out infinite}
      @keyframes xyPulse{50%{transform:scale(1.06)}}
      .xy-play.on{background:var(--grass);color:#fff;box-shadow:0 7px 0 #1d7f45}
      .xy-st{font-size:clamp(17px,2.2vw,22px);color:var(--ink2);min-width:4em}
      .xy-song{background:var(--cat);color:#fff;box-shadow:0 7px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .xy-prog{flex:0 0 auto;display:none;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
      .xy-prog.on{display:flex}
      .xy-dots{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:min(760px,80vw)}
      .xy-dot{width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 2px #e8cfa6}
      .xy-dot.done{background:var(--grass);box-shadow:none}
      .xy-dot.now{background:var(--sun);transform:scale(1.4);box-shadow:none}
      .xy-bar.next{animation:xyNext 1s ease-in-out infinite;z-index:2;box-shadow:0 7px 0 color-mix(in srgb,var(--k) 55%,#000),0 0 0 6px #fff36b,0 0 26px 10px rgba(255,225,77,.85)}
      @keyframes xyNext{50%{transform:scale(1.04)}}
      .xy-star{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:clamp(30px,4.6vw,48px);pointer-events:none;animation:bob 1s ease-in-out infinite}
      .xy-pick{position:absolute;inset:0;z-index:20;background:rgba(255,246,232,.97);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:14px}
      .xy-pick.show{display:flex;animation:enter .3s}
      .xy-pick h3{font-weight:400;font-size:clamp(22px,3.4vw,32px)}
      .xy-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:min(860px,100%)}
      .xy-card{background:#fff;border-radius:24px;padding:14px 8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:6px;font-size:clamp(17px,2.4vw,24px);min-height:90px;justify-content:center;animation:cardIn .4s backwards;animation-delay:calc(var(--i) * 50ms)}
      .xy-card .e{font-size:clamp(48px,8vw,80px)}
      .xy-card:active{transform:scale(.96)}
      .xy-b[hidden]{display:none}
      .xy-board{flex:1;min-height:0;position:relative;border-radius:30px;background:linear-gradient(135deg,#ffe9c7,#ffd7a8);box-shadow:var(--shadow);overflow:hidden}
      .xy-frame{position:absolute;inset:6% 4%;display:flex;align-items:center;justify-content:space-between;gap:1.6%}
      .xy-rail{position:absolute;left:2%;right:2%;height:5%;border-radius:10px;background:linear-gradient(#a8662e,#7c4519);box-shadow:0 4px 0 rgba(0,0,0,.2)}
      .xy-bar{position:relative;flex:1;border-radius:16px;background:linear-gradient(90deg,color-mix(in srgb,var(--k) 75%,#fff),var(--k) 40%,color-mix(in srgb,var(--k) 80%,#000));
        box-shadow:0 7px 0 color-mix(in srgb,var(--k) 55%,#000),inset 0 3px 0 rgba(255,255,255,.4);display:flex;align-items:flex-end;justify-content:center;padding-bottom:12%;
        font-size:clamp(17px,2.6vw,28px);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.25);touch-action:none;transition:transform .06s}
      .xy-bar::before,.xy-bar::after{content:"";position:absolute;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#e8e2d6;box-shadow:inset 0 -2px 0 #9b9183}
      .xy-bar::before{top:14%}.xy-bar::after{bottom:7%}
      .xy-bar.hit{animation:xyHit .3s ease-out}
      @keyframes xyHit{30%{transform:translateY(5px) scale(.97);filter:brightness(1.3)}}
      .xy-ring{position:absolute;border-radius:50%;border:5px solid var(--k);pointer-events:none;animation:xyRing .6s ease-out forwards}
      @keyframes xyRing{from{transform:translate(-50%,-50%) scale(.2);opacity:1}to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
      .xy-mallet{position:absolute;width:clamp(70px,9vw,110px);z-index:4;pointer-events:none;transition:left .09s ease-out,top .09s ease-out;transform-origin:85% 85%;transform:translate(-14%,-14%) rotate(-20deg)}
      .xy-mallet svg{display:block;width:100%}
      .xy-mallet.strike{animation:xyStrike .22s ease-out}
      @keyframes xyStrike{0%{transform:translate(-14%,-14%) rotate(-48deg)}45%{transform:translate(-14%,-14%) rotate(4deg)}100%{transform:translate(-14%,-14%) rotate(-20deg)}}
      .xy-note{position:absolute;pointer-events:none;font-size:clamp(28px,4vw,42px);z-index:5;animation:pnFly2 1s ease-out forwards}
      @keyframes pnFly2{from{transform:translate(-50%,-50%) scale(.5);opacity:1}to{transform:translate(-50%,-180%) scale(1.2);opacity:0}}
      @media (max-aspect-ratio:1/1){
        .xy-frame{flex-direction:column;inset:4% 5%}
        .xy-rail{top:2%;bottom:2%;width:6%;height:auto;left:auto;right:auto}
        .xy-bar{align-items:center;justify-content:center;padding:0;background:linear-gradient(180deg,color-mix(in srgb,var(--k) 75%,#fff),var(--k) 40%,color-mix(in srgb,var(--k) 80%,#000))}
        .xy-bar::before,.xy-bar::after{display:none}
        .xy-b{min-height:64px;padding:8px 14px;font-size:17px}
        .xy-top{gap:8px}
        .xy-star{top:50%}
        .xy-prog{gap:8px;flex-wrap:nowrap}
        .xy-dots{gap:3px;max-width:62vw}
        .xy-dot{width:11px;height:11px}
        .xy-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
        .xy-card .e{font-size:44px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .xy-b{min-height:64px;padding:6px 14px;font-size:16px}
        .xy-bar{align-items:center;padding-bottom:0} /* 막대가 낮아 글자가 위 못에 겹침 → 가운데로 */
        .xy-cards{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
        .xy-card{padding:8px 4px;font-size:15px}
        .xy-card .e{font-size:40px}
      }
    `);
    const BARS = [
      ["C5", "도", "#ff4f5e"], ["D5", "레", "#ff9a2e"], ["E5", "미", "#f5c400"], ["F5", "파", "#3cc45a"],
      ["G5", "솔", "#22b5d8"], ["A5", "라", "#3f6cf0"], ["B5", "시", "#8a5cf0"], ["C6", "도", "#ff5fae"],
    ];

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "xy");
    const top = U.el("div", "xy-top");
    const bSong = U.btn(KP.E("🌟") + " 따라 치기", "btn xy-b xy-song");
    const bRec = U.btn(KP.E("🔴") + " 녹음", "btn xy-b xy-rec");
    const bPlay = U.btn(KP.E("▶️") + " 듣기", "btn xy-b xy-play");
    const st = U.el("div", "xy-st");
    top.append(bSong, bRec, bPlay, st);
    const prog = U.el("div", "xy-prog");
    const dots = U.el("div", "xy-dots");
    const bStop = U.btn(KP.E("✖️") + " 그만", "btn xy-b");
    prog.append(dots, bStop);
    const picker = U.el("div", "xy-pick");
    const board = U.el("div", "xy-board");
    const frame = U.el("div", "xy-frame");
    const rail1 = U.el("div", "xy-rail"),
      rail2 = U.el("div", "xy-rail");
    const mallet = U.el("div", "xy-mallet");
    mallet.innerHTML =
      '<svg viewBox="0 0 100 100"><path d="M24 24 L90 90" stroke="#b07a45" stroke-width="9" stroke-linecap="round"/><path d="M24 24 L90 90" stroke="#d9a46b" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="20" cy="20" r="17" fill="#ff5d73" stroke="#9c2a3c" stroke-width="4"/><circle cx="14" cy="14" r="5" fill="#fff" opacity=".7"/></svg>';
    board.append(rail1, rail2, frame, mallet);
    wrap.append(top, prog, board);
    ctx.body.append(wrap, picker);
    const bars = BARS.map(([n, sol, col], i) => {
      const b = U.el("div", "xy-bar", sol);
      b.style.setProperty("--k", col);
      b.dataset.i = i;
      frame.appendChild(b);
      return b;
    });
    function layout() {
      const port = matchMedia("(max-aspect-ratio:1/1)").matches;
      bars.forEach((b, i) => {
        const s = 96 - i * 4.6 + "%";
        b.style.height = port ? "" : s;
        b.style.width = port ? s : "";
        b.style.alignSelf = "center";
      });
      if (port) {
        rail1.style.cssText = "left:24%;";
        rail2.style.cssText = "right:24%;";
      } else {
        rail1.style.cssText = "top:22%;";
        rail2.style.cssText = "bottom:22%;";
      }
      restMallet();
    }
    function restMallet() {
      mallet.style.left = "calc(100% - clamp(70px,9vw,110px) - 10px)";
      mallet.style.top = "10px";
    }
    addEventListener("resize", () => ctx._active && layout());

    /* ---------- 치기 ---------- */
    function sound(i) {
      const f = A.hz(BARS[i][0]);
      A.note(f, { inst: "marimba", dur: 0.8, vol: 0.3 });
      A.tone(f * 3, { dur: 0.16, vol: 0.04 });
      A.tone(f * 4.1, { dur: 0.08, vol: 0.035 });
    }
    function hit(i, x, y) {
      const b = bars[i];
      sound(i);
      U.replay(b, "hit");
      const br = board.getBoundingClientRect(),
        r = b.getBoundingClientRect();
      if (x == null) {
        x = r.left + r.width / 2;
        y = r.top + r.height * 0.45;
      }
      const lx = x - br.left,
        ly = y - br.top;
      mallet.style.left = lx + "px";
      mallet.style.top = ly + "px";
      U.replay(mallet, "strike");
      const ring = U.el("div", "xy-ring");
      ring.style.setProperty("--k", BARS[i][2]);
      const sz = Math.min(r.width, r.height) * 0.9;
      Object.assign(ring.style, { left: lx + "px", top: ly + "px", width: sz + "px", height: sz + "px" });
      board.appendChild(ring);
      setTimeout(() => ring.remove(), 650);
      const nt = U.el("div", "xy-note", KP.E(U.pick(["🎵", "🎶"])));
      Object.assign(nt.style, { left: lx + "px", top: ly + "px" });
      board.appendChild(nt);
      setTimeout(() => nt.remove(), 1000);
      ctx.cancel(restT);
      restT = ctx.after(1400, restMallet);
    }
    let restT = 0;
    const held = new Map();
    function userHit(i, x, y, slid) {
      hit(i, x, y);
      if (playing) return; // 내 녹음을 듣는 동안 쳐도 소리가 남 (같이 연주 — 재생·축하는 그대로 이어 감, 녹음엔 안 들어감)
      ctx.hint(null);
      if (follow) return followHit(i, slid);
      if (rec) {
        const t = performance.now() - rec.t0;
        rec.list.push([i, Math.round(t)]);
        st.innerHTML = KP.E("🎵") + " " + rec.list.length;
        if (rec.list.length >= 150 || t > 45000) return stopRec();
        // 잠깐 멈추면 저절로 녹음 끝 → 바로 들려주기 ('그만'을 몰라도 됨)
        ctx.cancel(rec.quietT);
        rec.quietT = ctx.after(2500, () => rec && stopRec());
      }
    }
    frame.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".xy-bar");
      if (!b) return;
      e.preventDefault();
      A.unlock();
      try {
        b.releasePointerCapture(e.pointerId);
      } catch (_) {}
      held.set(e.pointerId, b);
      userHit(+b.dataset.i, e.clientX, e.clientY);
    });
    frame.addEventListener("pointermove", (e) => {
      if (!held.has(e.pointerId)) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const b = el && el.closest && el.closest(".xy-bar");
      if (b && b !== held.get(e.pointerId)) {
        held.set(e.pointerId, b);
        userHit(+b.dataset.i, e.clientX, e.clientY, true);
      }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => frame.addEventListener(ev, (e) => held.delete(e.pointerId)));

    /* ---------- 녹음 · 재생 ---------- */
    let rec = null,
      playing = false,
      saved = KP.store.get("xylo:rec", []);
    function showPlayBtn() {
      bPlay.hidden = !saved.length;
    }
    /** 녹음 끝 → 저장하고 바로 들려줌 (quiet: 화면을 나갈 때 — 저장만) */
    function stopRec(quiet) {
      if (!rec) return;
      const list = rec.list;
      ctx.cancel(rec.quietT);
      rec = null;
      bRec.classList.remove("on");
      bRec.innerHTML = KP.E("🔴") + " 녹음";
      if (list.length) {
        saved = list;
        KP.store.set("xylo:rec", saved);
        st.innerHTML = KP.E("💾") + " " + list.length;
        showPlayBtn();
        if (quiet) return;
        A.sfx("pop");
        KP.voice.say("내가 친 노래를 들어 봐요!");
        ctx.after(1600, () => !rec && !playing && !follow && playBack());
      } else {
        st.textContent = "";
        if (!quiet) KP.voice.say("녹음을 그만했어요.");
      }
    }
    ctx.tap(bRec, () => {
      if (playing) stopPlay();
      if (follow) stopFollow();
      if (rec) return stopRec();
      playGen++; // 앞 노래 완성 마무리(채가 다시 쳐 주기·축하)가 남아 있으면 취소
      rec = { t0: performance.now(), list: [], quietT: 0 };
      bRec.classList.add("on");
      bRec.innerHTML = KP.E("⏹️") + " 그만";
      st.innerHTML = KP.E("🎵") + " 0";
      A.note("A5", { inst: "bell", dur: 0.3, vol: 0.15 });
      KP.voice.say("녹음 시작! 실로폰을 쳐 봐요.");
      // 아무것도 안 치면 20초 뒤 조용히 끝 (녹음 단추가 계속 깜빡이지 않게)
      const me = rec;
      ctx.after(20000, () => rec === me && !rec.list.length && stopRec());
      ctx.hint(() => bars[0], "실로폰을 쳐 봐요!");
    });
    let playGen = 0;
    function stopPlay() {
      playing = false;
      playGen++;
      bPlay.classList.remove("on");
      bPlay.innerHTML = KP.E("▶️") + " 듣기";
    }
    ctx.tap(bPlay, () => {
      if (rec) return stopRec(); // 녹음 중이면 끝내고 바로 들려줌
      if (playing) {
        stopPlay();
        return;
      }
      if (follow) stopFollow();
      playBack();
    });
    function playBack() {
      if (!saved.length) {
        U.replay(bPlay, "wrong");
        KP.voice.say("먼저 빨간 녹음 단추를 누르고 연주해 봐요!");
        ctx.hint(() => bRec, "빨간 녹음 단추를 눌러요!");
        return;
      }
      playing = true;
      const gen = ++playGen;
      bPlay.classList.add("on");
      bPlay.innerHTML = KP.E("⏹️") + " 멈춤";
      ctx.hint(null);
      const t0 = saved[0][1];
      saved.forEach(([i, t]) => ctx.after(t - t0 + 250, () => gen === playGen && hit(i)));
      const end = saved[saved.length - 1][1] - t0 + 1300;
      const n = saved.length;
      ctx.after(end, async () => {
        if (gen !== playGen) return;
        stopPlay();
        if (n < 3) {
          // 한두 음은 축하 없이 칭찬만 (1음 녹음으로 축하·별 받는 것 방지)
          KP.voice.say("멋진 연주예요!");
          ctx.say("또 녹음해 볼까요? 빨간 단추를 눌러요!", false);
          return;
        }
        ctx.noStar ? ctx.noStar() : (ctx._fewChoice = true); // 자유 연주 → 열쇠 별 제외
        // 녹음 자유 연주 축하는 '따라 치기' 단계(lvl/streak)에 넣지 않음
        const ok = await ctx.win({ msg: "멋진 연주예요!", noLevel: true });
        if (ok) ctx.say("또 녹음해 볼까요? 빨간 단추를 눌러요!");
      });
    }

    /* ---------- 따라 치기 (piano.js 의 따라 치기와 같은 방식) ---------- */
    const SONGS = [["twinkle", "⭐"], ["airplane", "✈️"], ["butterfly", "🦋"], ["schoolbell", "🔔"], ["bears", "🐻"]];
    /** 실로폰은 '막대' — 새 문장(tools/out/new-voice/xylo.txt). 녹음 전에는 기기 목소리로 말함 */
    const TAP_LIT = "반짝이는 막대를 쳐요!";
    let follow = null; // {key, seq:[막대 번호], len:[박], idx, wrong}
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
    /** 단계별 칠 음 개수(음 개수 기준) — 1단계 약 6~10음 < 2단계 약 절반 < 3단계 끝까지.
        목표 근처(±3음)에서 긴 음·쉼표 뒤를 골라 끊음 (piano·xylo·musicbox 같은 방식) */
    function partLen(list, lv) {
      const seq = []; // 쉼표 뺀 음마다 '뒤에 쉬는 길이'
      list.forEach(([n, b]) => {
        if (n === "R") {
          if (seq.length) seq[seq.length - 1] += b + 1; // 쉼표 앞은 더 좋은 끊는 자리
        } else seq.push(b);
      });
      const N = seq.length;
      if (lv >= 3 || N < 8) return N;
      const cut = (t, lo, hi) => {
        let best = Math.max(lo, Math.min(hi, t)),
          bs = -1e9;
        for (let c = Math.max(lo, t - 3); c <= Math.min(hi, t + 3); c++) {
          const s = seq[c - 1] * 2 - Math.abs(c - t) * 0.6;
          if (s > bs) {
            bs = s;
            best = c;
          }
        }
        return best;
      };
      const c1 = cut(Math.max(6, Math.min(10, Math.round(N * 0.3))), 4, N - 4);
      if (lv === 1) return c1;
      return cut(Math.round(N * 0.5), c1 + 3, N - 2);
    }
    /** 동요(도4~도5)를 실로폰(도5~도6)으로 한 옥타브 올려 막대 번호로 */
    const barOf = (n) => BARS.findIndex((b) => A.midiOf(b[0]) === A.midiOf(n) + 12);
    function startFollow(key) {
      playGen++; // 앞 노래 완성 마무리가 남아 있으면 취소 (새 노래 도중에 옛 축하가 끼어들지 않게)
      const song = A.SONGS[key];
      const ph = phrasesOf(song.notes);
      const lv = ctx.level;
      const notes = song.notes.filter(([n]) => n !== "R").slice(0, partLen(song.notes, lv)).filter(([n]) => barOf(n) >= 0);
      follow = { key, seq: notes.map(([n]) => barOf(n)), len: notes.map(([, b]) => b), idx: 0, wrong: 0 };
      dots.innerHTML = "";
      follow.seq.forEach(() => dots.appendChild(U.el("span", "xy-dot")));
      prog.classList.add("on");
      picker.classList.remove("show");
      requestAnimationFrame(layout);
      ctx.say(song.name + "! " + TAP_LIT);
      // 첫 소절을 살짝 들려주고 바로 시작
      A.melody(ph[0], { beat: 0.34, inst: "marimba", octave: 1, vol: 0.16, when: 0.6 });
      markNext();
    }
    function markNext(quiet) {
      bars.forEach((b) => b.classList.remove("next"));
      U.$$(".xy-star", frame).forEach((x) => x.remove());
      if (!follow) return;
      U.$$(".xy-dot", dots).forEach((d, i) => {
        d.classList.toggle("done", i < follow.idx);
        d.classList.toggle("now", i === follow.idx);
      });
      if (quiet) return;
      const b = bars[follow.seq[follow.idx]];
      if (!b) return;
      b.classList.add("next");
      b.appendChild(U.el("span", "xy-star", KP.E("⭐")));
      ctx.hint(() => b, TAP_LIT);
    }
    async function followHit(i, slid) {
      if (!follow || KP.celebrating || slid) return; // 쓸면서 지나간 막대는 소리만
      const want = follow.seq[follow.idx];
      if (want == null) return;
      if (i !== want) {
        follow.wrong++;
        ctx._softMiss = (ctx._softMiss || 0) + 1; // 마구 쳐서 끝내면 열쇠 별 없음 (1번은 봐줌)
        A.sfx("tap2");
        U.replay(bars[want], "bump");
        if (follow.wrong % 3 === 0) KP.voice.say(TAP_LIT);
        ctx.hint(() => bars[want], TAP_LIT); // 누를 때 지운 힌트를 다시 걸기
        return;
      }
      follow.wrong = 0;
      follow.idx++;
      if (follow.idx < follow.seq.length) return markNext();
      // 완성!
      markNext(true);
      const f = follow;
      follow = null;
      bars.forEach((b) => b.classList.remove("next"));
      ctx.hint(null);
      const song = A.SONGS[f.key];
      KP.voice.say("우와! " + song.name + " 완성!");
      // 친 노래 앞부분(최대 약 2.5초)을 채가 혼자 다시 쳐 줌
      let t = 900;
      const gen = ++playGen;
      for (let k = 0; k < f.seq.length && t < 3400; k++) {
        const bi = f.seq[k];
        ctx.after(t, () => gen === playGen && hit(bi));
        t += f.len[k] * 300;
      }
      await ctx.wait(t + 500);
      if (gen !== playGen) return;
      prog.classList.remove("on");
      requestAnimationFrame(layout);
      const ok = await ctx.win({ big: true, msg: song.name + " 완성!" });
      if (!ok) return;
      ctx.say("또 다른 노래를 쳐 볼까요? 별 단추를 눌러요!");
      ctx.hint(() => bSong, "별 단추를 누르면 노래를 고를 수 있어요!");
    }
    function stopFollow() {
      follow = null;
      prog.classList.remove("on");
      markNext(true);
      ctx.hint(null);
      requestAnimationFrame(layout);
    }
    ctx.tap(bStop, () => {
      A.sfx("back");
      stopFollow();
      ctx.say("마음대로 쳐 봐요!");
    });
    ctx.tap(bSong, () => {
      if (rec) stopRec(true);
      if (playing) stopPlay();
      A.sfx("open");
      picker.innerHTML = "<h3>" + KP.E("🌟") + " 어떤 노래를 칠까요?</h3>";
      const cards = U.el("div", "xy-cards");
      SONGS.forEach(([key, em], i) => {
        const c = U.btn(KP.E(em) + "<span>" + A.SONGS[key].name + "</span>", "xy-card");
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

    ctx.stopRec = stopRec;
    ctx.stopFollow = stopFollow;
    ctx.init = () => {
      if (rec) stopRec(true);
      stopPlay();
      stopFollow();
      picker.classList.remove("show");
      saved = KP.store.get("xylo:rec", []);
      st.innerHTML = saved.length ? KP.E("💾") + " " + saved.length : "";
      showPlayBtn();
      requestAnimationFrame(layout);
    };
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.init();
    ctx.say("실로폰을 똑똑 쳐 봐요! 별 단추를 누르면 노래를 따라 칠 수 있어요.");
    ctx.hint(() => ctx.body.querySelector(".xy-bar"), "실로폰을 쳐 봐요!");
  },
  stop(ctx) {
    ctx.stopRec(true);
    ctx.stopFollow();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
