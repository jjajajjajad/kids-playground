/* 동요 오르골 — 노래 카드 6곡(반짝반짝 작은 별·비행기·나비야·학교종·곰 세 마리·생일 축하합니다)
   - 🎧 듣기: 오르골 손잡이가 돌고 음표가 톡톡 튀어나오며 동물 밴드가 춤춤
   - 👆 내가 연주: 화면 아무 데나 누를 때마다 다음 음이 나옴 → 리듬대로 눌러 한 곡 완성하면 축하
   - 가사는 넣지 않음(저작권) — 멜로디만 */
"use strict";
KP.game({
  id: "musicbox",
  icon: "🎶",
  name: "동요 오르골",
  cat: "music",
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
      @keyframes mbNote{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.2) rotate(var(--r));opacity:0}}
      .mb-dots{position:absolute;left:3%;right:3%;top:3%;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;pointer-events:none}
      .mb-dot{height:12px;border-radius:6px;background:rgba(255,255,255,.85);box-shadow:inset 0 0 0 2px #d9cdf2}
      .mb-dot.done{background:var(--cat);box-shadow:none}
      .mb-dot.now{background:var(--sun);box-shadow:0 0 8px 2px rgba(255,197,49,.8)}
      .mb-tap{position:absolute;left:0;right:0;text-align:center;bottom:24%;font-size:clamp(50px,9vh,80px);pointer-events:none;animation:bob 1.2s ease-in-out infinite;display:none}
      .mb-stage.mine .mb-tap{display:block}
      @media (max-aspect-ratio:1/1){
        .mb-songs{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
        .mb-card{flex-direction:row;justify-content:center;gap:4px;padding:6px 4px;font-size:13px}
        .mb-card .e{font-size:30px;flex:0 0 auto}
        .mb-mode{min-height:54px;padding:8px 14px;font-size:17px}
        .mb-box{height:auto;width:72%}
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
      notes = [];
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
    function renderDots() {
      dots.innerHTML = "";
      notes.forEach(([n, b]) => {
        const d = U.el("i", "mb-dot");
        d.style.width = 8 + b * 9 + "px";
        if (n === "R") d.style.opacity = ".35";
        dots.appendChild(d);
      });
      markDots(mode === "mine" ? idx : -1);
    }
    function markDots(cur) {
      U.$$(".mb-dot", dots).forEach((d, i) => {
        d.classList.toggle("done", cur >= 0 && i < cur);
        d.classList.toggle("now", i === cur);
      });
    }
    function burst(k) {
      const r = stage.getBoundingClientRect(),
        br = box.getBoundingClientRect();
      const nt = U.el("div", "mb-note", KP.E(U.pick(["🎵", "🎶", "⭐", "💖"])));
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
    ctx.fast(stage, async () => {
      if (mode !== "mine") {
        // 듣는 중에 누르면 춤만
        U.replay(bandEls[U.rand(4)], "dance");
        return;
      }
      if (KP.celebrating) return;
      while (idx < notes.length && notes[idx][0] === "R") idx++;
      if (idx >= notes.length) return;
      const [n, b] = notes[idx];
      sound(n, b);
      burst(idx);
      stage.classList.add("play");
      ctx.cancel(lastTap);
      lastTap = ctx.after(Math.max(500, b * BEAT * 1000 + 200), () => stage.classList.remove("play"));
      idx++;
      while (idx < notes.length && notes[idx][0] === "R") idx++;
      markDots(idx);
      ctx.hint(null);
      if (idx >= notes.length) {
        stage.classList.remove("play");
        await ctx.wait(700);
        const name = A.SONGS[song].name;
        const ok = await ctx.win({ big: true, msg: name + " 완성!" });
        if (!ok) return;
        idx = 0;
        markDots(0);
        ctx.say("한 번 더 연주해 볼까요? 다른 노래 카드도 골라 봐요!");
      } else ctx.hint(() => box, "톡톡 눌러서 다음 음을 연주해요!");
    });

    function setMode(m, speak) {
      mode = m;
      bListen.classList.toggle("sel", m === "listen");
      bMine.classList.toggle("sel", m === "mine");
      stage.classList.toggle("mine", m === "mine");
      stopPlay();
      idx = 0;
      markDots(m === "mine" ? 0 : -1);
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
