/* 동요 오르골 — 노래 카드 6곡(반짝반짝 작은 별·비행기·나비야·학교종·곰 세 마리·생일 축하합니다)
   - 🎧 듣기: 오르골 손잡이가 돌고 음표가 톡톡 튀어나오며 동물 밴드가 춤춤
   - 👆 내가 연주: 화면 아무 데나 누를 때마다 다음 음이 나옴 → 리듬대로 눌러 한 곡 완성하면 축하
     단계: 음 개수 기준 1단계 약 6~10음 → 2단계 약 절반 → 3단계 끝까지. 한 소절 칠 때마다 밴드가 다 같이 춤추며 칭찬
     (아무 데나 누르면 되는 놀이라 열쇠 별은 없음)
     리듬 칭찬: 누른 간격이 음 길이(긴 음은 길게)에 맞으면 🌟 음표, 한 소절 대부분이 맞으면 "박자에 딱딱 맞아요!"
       빠르기는 아이 속도에 맞춤(최근 간격의 가운데 값). 너무 빠른 연타(한 박 반보다 빠름)는 리듬으로 안 셈
   - 가사는 넣지 않음(저작권) — 멜로디만 */
"use strict";
KP.game({
  id: "musicbox",
  icon: "🎶",
  name: "동요 오르골",
  cat: "music",
  levels: 3,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("musicbox", `
      .mb{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .mb-songs{flex:0 0 auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
      .mb-card{background:#fff;border-radius:20px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;font-size:clamp(14px,1.8vw,18px);line-height:1.15;text-align:center;word-break:keep-all}
      .mb-card .e{font-size:clamp(34px,5.4vh,48px)}
      .mb-card.sel{background:#fff3bf;box-shadow:0 0 0 4px var(--sun),0 6px 0 #d9a000}
      .mb-card:active{transform:scale(.96)}
      .mb-modes{flex:0 0 auto;display:flex;gap:12px;justify-content:center}
      .mb-mode{font-size:clamp(18px,2.4vw,24px);min-height:60px;padding:10px 22px}
      .mb-mode .e{font-size:1.5em}
      .mb-mode.sel{background:var(--cat);color:#fff;box-shadow:0 7px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .mb-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;box-shadow:var(--shadow);
        background:radial-gradient(circle at 50% 110%,#ffe0f0,#f3e9ff 55%,#e3f1ff);touch-action:none}
      .mb-box{position:absolute;left:50%;top:50%;height:68%;aspect-ratio:1;transform:translate(-50%,-46%)}
      .mb-box svg{width:100%;height:100%;overflow:visible}
      .mb-crank{transform-box:fill-box;transform-origin:0% 50%}
      .mb-stage.play .mb-crank{animation:mbCrank 1.2s linear infinite}
      @keyframes mbCrank{to{transform:rotate(360deg)}}
      .mb-dancer{position:absolute;left:50%;top:6%;font-size:clamp(40px,8vh,74px);transform:translateX(-50%);line-height:1}
      .mb-stage.play .mb-dancer .e{animation:mbSpin 1.6s linear infinite}
      @keyframes mbSpin{to{transform:rotateY(360deg)}}
      .mb-band{position:absolute;inset:auto 0 3% 0;display:flex;justify-content:space-between;padding:0 4%;pointer-events:none}
      .mb-band span{font-size:clamp(48px,9vh,86px);line-height:1;transform-origin:bottom center;display:inline-block}
      .mb-band .dance{animation:mbDance .4s cubic-bezier(.3,1.6,.5,1)}
      @keyframes mbDance{40%{transform:translateY(-18%) rotate(-8deg) scale(1.08,.94)}75%{transform:rotate(7deg)}}
      .mb-note{position:absolute;pointer-events:none;font-size:clamp(30px,5vh,48px);z-index:3;animation:mbNote 1.4s ease-out forwards}
      .mb-note.rh{font-size:clamp(38px,6.5vh,62px)}
      @keyframes mbNote{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.2) rotate(var(--r));opacity:0}}
      .mb-dots{position:absolute;left:3%;right:3%;top:3%;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;pointer-events:none}
      .mb-dot{height:12px;border-radius:6px;background:rgba(255,255,255,.85);box-shadow:inset 0 0 0 2px #d9cdf2}
      .mb-dot.done{background:var(--cat);box-shadow:none}
      .mb-dot.now{background:var(--sun);box-shadow:0 0 8px 2px rgba(255,197,49,.8)}
      .mb-dot.ph{margin-left:10px}
      .mb-cheer{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);font-size:clamp(26px,4.4vh,40px);background:#fff;border-radius:999px;padding:6px 18px;box-shadow:var(--shadow);pointer-events:none;z-index:4;white-space:nowrap;animation:mbCheer 1.1s ease-out forwards}
      @keyframes mbCheer{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}25%{transform:translate(-50%,-50%) scale(1.1);opacity:1}100%{transform:translate(-50%,-110%) scale(1);opacity:0}}
      .mb-tap{position:absolute;left:0;right:0;text-align:center;bottom:24%;font-size:clamp(50px,9vh,80px);pointer-events:none;animation:bob 1.2s ease-in-out infinite;display:none}
      .mb-stage.mine .mb-tap{display:block}
      @media (max-aspect-ratio:1/1){
        .mb-songs{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
        .mb-card{min-height:66px;justify-content:center;gap:0;padding:6px 4px;font-size:clamp(13px,2.2vw,19px)}
        .mb-card .e{font-size:clamp(30px,4.6vw,44px);flex:0 0 auto}
        .mb-mode{min-height:64px;padding:8px 14px;font-size:17px}
        .mb-box{height:auto;width:72%}
      }
      @media (orientation:landscape) and (max-height:500px){
        .mb-mode{min-height:64px;padding:6px 20px}
      }
      @media (orientation: portrait) and (max-width: 480px){
        .mb-songs{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
        .mb-card{min-height:66px;flex-direction:column;gap:0;font-size:13px;padding:4px 4px}
        .mb-card .e{font-size:30px}
        .mb-band span{font-size:54px}
      }
    `);
    const SONGS = [["twinkle", "⭐"], ["airplane", "✈️"], ["butterfly", "🦋"], ["schoolbell", "🔔"], ["bears", "🐻"], ["birthday", "🎂"]];
    const BAND = ["🐰", "🐻", "🐱", "🐸"];

    const wrap = U.el("div", "mb");
    const songsEl = U.el("div", "mb-songs");
    const modes = U.el("div", "mb-modes");
    const bListen = U.btn(KP.E("🎧") + " 듣기", "btn mb-mode");
    const bMine = U.btn(KP.E("👆") + " 내가 연주", "btn mb-mode");
    modes.append(bListen, bMine);
    const stage = U.el("div", "mb-stage");
    const box = U.el("div", "mb-box");
    box.innerHTML =
      '<svg viewBox="0 0 200 200">' +
      '<path d="M30 74 L46 18 H154 L170 74Z" fill="#ffb3cf" stroke="#7a3a55" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M52 30 H148 L158 66 H42Z" fill="#c9ecff" stroke="#7a3a55" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M100 34 L104 44 L115 44 L106 51 L109 62 L100 55 L91 62 L94 51 L85 44 L96 44Z" fill="#ffd23f" stroke="#7a3a55" stroke-width="2"/>' +
      '<rect x="24" y="74" width="152" height="96" rx="12" fill="#ff8fb8" stroke="#7a3a55" stroke-width="5"/>' +
      '<rect x="36" y="84" width="128" height="34" rx="8" fill="#ffe7a0" stroke="#7a3a55" stroke-width="3"/>' +
      '<g class="mb-pins">' + Array.from({ length: 12 }, (_, i) => '<circle cx="' + (44 + i * 10.4) + '" cy="' + (93 + (i * 7) % 18) + '" r="2.6" fill="#c98a1a"/>').join("") + "</g>" +
      '<path d="M40 136 H160" stroke="#ffd0e2" stroke-width="6" stroke-linecap="round"/><path d="M40 152 H160" stroke="#ffd0e2" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="100" cy="144" r="10" fill="#ffd23f" stroke="#7a3a55" stroke-width="3"/>' +
      '<g class="mb-crank"><rect x="176" y="116" width="22" height="8" rx="4" fill="#c98a4a" stroke="#7a3a55" stroke-width="3"/><rect x="192" y="104" width="8" height="22" rx="4" fill="#ffd23f" stroke="#7a3a55" stroke-width="3"/></g>' +
      "</svg>";
    const dancer = U.el("div", "mb-dancer", KP.E("🦄"));
    const band = U.el("div", "mb-band");
    const bandEls = BAND.map((e) => {
      const s = U.el("span", "", KP.E(e));
      band.appendChild(s);
      return s;
    });
    const dots = U.el("div", "mb-dots");
    const tapHint = U.el("div", "mb-tap", KP.E("👆"));
    stage.append(dots, box, dancer, band, tapHint);
    wrap.append(songsEl, modes, stage);
    ctx.body.appendChild(wrap);

    let song = KP.store.get("musicbox:song", "twinkle"),
      mode = "listen",
      gen = 0,
      idx = 0,
      notes = [], // 듣기: 곡 전체
      mine = [], // 내가 연주: 이번 단계만큼 (쉼표 뺌)
      phEnd = new Set(); // 소절이 끝나는 자리(mine 기준)
    if (!A.SONGS[song]) song = "twinkle";
    const cards = SONGS.map(([key, em]) => {
      const c = U.btn(KP.E(em) + "<span>" + A.SONGS[key].name + "</span>", "mb-card");
      ctx.tap(c, () => {
        A.sfx("select");
        U.replay(c, "jump");
        pick(key, true);
      });
      songsEl.appendChild(c);
      return [key, c];
    });

    function pick(key, auto) {
      song = key;
      KP.store.set("musicbox:song", key);
      cards.forEach(([k, c]) => c.classList.toggle("sel", k === key));
      notes = A.SONGS[key].notes;
      stopPlay();
      idx = 0;
      renderDots();
      if (!auto) return;
      if (mode === "listen") {
        KP.voice.say(A.SONGS[key].name + "!");
        const g = gen;
        ctx.after(1100, () => g === gen && mode === "listen" && song === key && listen());
      } else {
        ctx.say(A.SONGS[key].name + "! 화면을 톡톡 눌러서 연주해 봐요.");
      }
    }
    /** 소절 나누기(피아노 따라 치기와 같은 방식: 2박 이상 긴 음이나 쉼표에서 끊음) */
    function phrasesOf(list) {
      const out = [];
      let cur = [];
      list.forEach(([n, b]) => {
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
    function buildMine() {
      const ph = phrasesOf(notes),
        lv = ctx.level;
      const all = [].concat(...ph),
        take = partLen(notes, lv);
      mine = all.slice(0, take);
      phEnd = new Set();
      let k = 0;
      ph.forEach((p) => {
        k += p.length;
        if (k < take) phEnd.add(k);
      });
      phEnd.add(take); // 이번 단계 끝도 한 소절 끝
      mine.full = take >= all.length;
    }
    function renderDots() {
      dots.innerHTML = "";
      if (mode === "mine") {
        buildMine();
        mine.forEach(([n, b], i) => {
          const d = U.el("i", "mb-dot" + (i > 0 && phEnd.has(i) ? " ph" : ""));
          d.style.width = 8 + b * 9 + "px";
          dots.appendChild(d);
        });
        markDots(idx);
        return;
      }
      notes.forEach(([n, b]) => {
        const d = U.el("i", "mb-dot");
        d.style.width = 8 + b * 9 + "px";
        if (n === "R") d.style.opacity = ".35";
        dots.appendChild(d);
      });
      markDots(-1);
    }
    function markDots(cur) {
      U.$$(".mb-dot", dots).forEach((d, i) => {
        d.classList.toggle("done", cur >= 0 && i < cur);
        d.classList.toggle("now", i === cur);
      });
    }
    function burst(k, good) {
      const r = stage.getBoundingClientRect(),
        br = box.getBoundingClientRect();
      const nt = U.el("div", "mb-note" + (good ? " rh" : ""), KP.E(good ? "🌟" : U.pick(["🎵", "🎶", "⭐", "💖"])));
      nt.style.left = br.left - r.left + br.width * (0.3 + Math.random() * 0.4) + "px";
      nt.style.top = br.top - r.top + br.height * 0.35 + "px";
      nt.style.setProperty("--dx", (Math.random() - 0.5) * r.width * 0.6 + "px");
      nt.style.setProperty("--dy", -(r.height * (0.25 + Math.random() * 0.25)) + "px");
      nt.style.setProperty("--r", (Math.random() - 0.5) * 80 + "deg");
      stage.appendChild(nt);
      setTimeout(() => nt.remove(), 1400);
      U.replay(bandEls[k % bandEls.length], "dance");
    }
    const BEAT = 0.42;
    function sound(n, b) {
      A.note(A.hz(n) * 2, { inst: "bell", dur: Math.max(0.4, b * BEAT * 1.8), vol: 0.26 });
    }

    /* ---------- 듣기 ---------- */
    function listen() {
      stopPlay();
      const g = ++gen;
      stage.classList.add("play");
      let t = 300;
      notes.forEach(([n, b], i) => {
        ctx.after(t, () => {
          if (g !== gen) return;
          markDots(i);
          if (n === "R") return;
          sound(n, b);
          burst(i);
        });
        t += b * BEAT * 1000;
      });
      ctx.after(t + 400, () => {
        if (g !== gen) return;
        stage.classList.remove("play");
        markDots(notes.length);
        ctx.say("또 듣고 싶으면 듣기, 직접 치고 싶으면 내가 연주를 눌러요!");
        ctx.hint(() => bMine, "내가 연주를 눌러 봐요!");
      });
    }
    function stopPlay() {
      gen++;
      stage.classList.remove("play");
    }

    /* ---------- 내가 연주 ---------- */
    let lastTap = 0;
    /** 리듬: 앞 음 길이(박) 대비 실제 간격 비율 → 아이 빠르기(최근 비율의 가운데 값)와 가까우면 '리듬 맞음' */
    const RH = { at: 0, b: 0, rs: [], ph: [0, 0], all: [0, 0] };
    function rhReset() {
      RH.at = 0;
      RH.rs = [];
      RH.ph = [0, 0];
      RH.all = [0, 0];
    }
    function rhTap(b) {
      const now = performance.now(),
        iv = now - RH.at,
        prevB = RH.b;
      RH.at = now;
      RH.b = b;
      if (!prevB || iv > 2600 || iv < 60) return false; // 첫 음·한참 쉬었다 누름은 안 셈
      const r = iv / (prevB * BEAT * 1000);
      RH.rs.push(r);
      if (RH.rs.length > 6) RH.rs.shift();
      if (RH.rs.length < 3) return false; // 빠르기를 알 때까지
      const m = RH.rs.slice().sort((x, y) => x - y)[RH.rs.length >> 1];
      const good = m >= 0.65 && m <= 2.6 && Math.abs(Math.log(r / m)) < Math.log(1.45);
      RH.ph[1]++;
      RH.all[1]++;
      if (good) RH.ph[0]++, RH.all[0]++;
      return good;
    }
    ctx._rh = RH; // 점검용
    ctx.fast(stage, async () => {
      if (mode !== "mine") {
        // 듣는 중에 누르면 춤만
        U.replay(bandEls[U.rand(4)], "dance");
        return;
      }
      if (KP.celebrating || idx >= mine.length) return;
      const [n, b] = mine[idx];
      if (idx === 0) rhReset();
      sound(n, b);
      burst(idx, rhTap(b));
      stage.classList.add("play");
      ctx.cancel(lastTap);
      lastTap = ctx.after(Math.max(500, b * BEAT * 1000 + 200), () => stage.classList.remove("play"));
      idx++;
      markDots(idx);
      ctx.hint(null);
      if (idx >= mine.length) {
        stage.classList.remove("play");
        await ctx.wait(700);
        const name = A.SONGS[song].name;
        ctx.noStar ? ctx.noStar() : (ctx._fewChoice = true); // 아무 데나 눌러도 되는 놀이 → 열쇠 별 제외
        const rhy = RH.all[1] >= 4 && RH.all[0] / RH.all[1] >= 0.7; // 노래 리듬대로 눌렀어요
        const ok = await ctx.win(Object.assign(mine.full ? { big: true, msg: name + " 완성!" } : { msg: "멋진 연주예요!" }, rhy ? { msg: (mine.full ? name + " 완성! " : "") + "리듬도 딱딱 " + KP.E("🌟"), say: "박자에 딱딱 맞아요!" } : {}));
        if (!ok) return;
        idx = 0;
        renderDots(); // 단계가 올랐으면 더 길어짐
        ctx.say("한 번 더 연주해 볼까요? 다른 노래 카드도 골라 봐요!");
      } else {
        if (phEnd.has(idx)) phraseCheer();
        ctx.hint(() => box, "톡톡 눌러서 다음 음을 연주해요!");
      }
    });

    /** 한 소절 끝: 밴드가 다 같이 춤 + 짧은 칭찬 */
    function phraseCheer() {
      ctx.after(Math.max(250, BEAT * 1000), () => {
        if (mode !== "mine" || KP.celebrating) return;
        A.sfx("sparkle");
        bandEls.forEach((e, k) => ctx.after(k * 90, () => U.replay(e, "dance")));
        const c = U.el("div", "mb-cheer", KP.E(U.pick(["⭐", "🌟", "💖"])) + " " + KP.E("👏"));
        stage.appendChild(c);
        ctx.after(1150, () => c.remove());
        const [g, n] = RH.ph;
        KP.voice.say(n >= 3 && g / n >= 0.75 ? "박자에 딱딱 맞아요!" : U.pick(["좋아요!", "멋져요!", "잘했어요!"]));
        RH.ph = [0, 0];
      });
    }
    function setMode(m, speak) {
      mode = m;
      bListen.classList.toggle("sel", m === "listen");
      bMine.classList.toggle("sel", m === "mine");
      stage.classList.toggle("mine", m === "mine");
      stopPlay();
      idx = 0;
      renderDots();
      if (!speak) return;
      if (m === "listen") {
        listen();
        ctx.say(U.josa(A.SONGS[song].name, "을/를") + " 들어 봐요!");
      } else {
        ctx.say("화면을 톡톡 누를 때마다 다음 음이 나와요. 노래에 맞춰 눌러 봐요!");
        ctx.hint(() => box, "화면을 톡톡 눌러요!");
      }
    }
    ctx.tap(bListen, () => {
      A.sfx("select");
      setMode("listen", true);
    });
    ctx.tap(bMine, () => {
      A.sfx("select");
      setMode("mine", true);
    });

    ctx.init = () => {
      setMode("listen");
      pick(song, false);
    };
    ctx.stopPlay = stopPlay;
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.init();
    ctx.say("노래를 골라요! 듣기를 누르면 오르골이 연주하고, 내가 연주를 누르면 직접 칠 수 있어요.");
    ctx.hint(() => ctx.body.querySelector(".mb-mode:not(.sel)"), "내가 연주를 눌러 봐요!");
  },
  stop(ctx) {
    ctx.stopPlay();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
