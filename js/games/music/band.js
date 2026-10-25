/* 동물 밴드 — 점토 공연장 무대에 아이가 칠한 3D 인형 친구들이 올라가 진짜 악기 소리로 함께 연주해요.
   - 연주자 6명(대기석 카드): 드럼 · 실로폰(멜로디) · 피아노(화음) · 기타(낮은 줄) · 탬버린 · 마이크(합창 '아아')
     인형은 아이가 칠한 인형 우선(종이 겹치지 않게), 모자라면 기본 색 인형. 악기 그림은 인형 몸 앞(부위 기준점)에 붙어 따라감
   - 카드를 무대로 끌거나 콕 누르면 인형이 폴짝 올라와, 다음 마디 첫 박부터 합류. 무대 인형을 콕(또는 대기석으로 끌면) 내려감
   - 모두 같은 조성(다장조, C-Am-F-G 4마디 반복)·같은 빠르기 — 미리 예약하는 박자 스케줄러(오디오 시계)
   - 악기마다 다른 연주 동작(두드리기·채 흔들기·건반 누르기·줄 튕기기·탬버린 흔들기·노래하며 갸웃), 무대 조명이 박자에 맞춰 반짝
   - 소리: 실제 녹음 샘플(KP.sampler, assets/sounds — CC0·MIT, LICENSES.md). 못 불러오면 예전 합성음으로 대신
   - 빠르기 🐢🚶🐇, 분위기 🎉 신나게 / 🌙 잔잔하게
   1단계: 자리 2개 / 2단계: 자리 4개 (자유 합주 — 2명 이상이 몇 마디 함께 연주하면 칭찬, 자주 부르지 않음)
   3단계: 따라 해 봐요 — 들려준 조합(2~3명)을 듣고 똑같이 무대에 올리기 (보기는 늘 6명)
   공용: _shared/clay-stage.js · doll-actor.js · doll-follow.js · sampler.js · play-feedback.js */
"use strict";
KP.game({
  id: "band",
  icon: "🎸",
  name: "동물 밴드",
  cat: "music",
  levels: 3,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio,
      SM = KP.sampler;
    const IMG = "assets/play-clay/band/";
    KP.css("band", `
      .bnWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px;gap:8px}
      .bnRoom{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#6b3a26;container-type:size}
      .bnOv{position:absolute;inset:0;pointer-events:none;--dh:200px}
      .bnOv>*{position:absolute;left:0;top:0;pointer-events:none}
      .bnLoad{left:50%!important;top:45%!important;transform:translate(-50%,-50%);background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px;z-index:9}
      /* 조명 */
      .bnBulb{width:var(--s,22px);height:var(--s,22px);margin:calc(var(--s,22px)/-2) 0 0 calc(var(--s,22px)/-2);border-radius:50%;
        background:radial-gradient(circle,rgba(255,250,215,.95) 0 22%,rgba(255,214,110,.55) 45%,rgba(255,190,60,0) 72%);opacity:0;transition:opacity .25s;mix-blend-mode:screen}
      .bnBulb.on{opacity:1;transition:opacity .03s}
      .bnBulb.pink{background:radial-gradient(circle,rgba(255,240,250,.95) 0 22%,rgba(255,130,190,.6) 45%,rgba(255,110,170,0) 72%)}
      .bnCone{transform-origin:50% 0;opacity:.18;transition:opacity .35s;mix-blend-mode:screen;
        background:linear-gradient(rgba(255,244,200,.0),rgba(255,236,170,.55) 70%,rgba(255,230,160,.0));clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
      .bnCone.on{opacity:.55;transition:opacity .04s}
      .bnCone.pink{background:linear-gradient(rgba(255,200,230,0),rgba(255,160,210,.5) 70%,rgba(255,160,210,0))}
      /* 무대 자리 */
      .bnSpot{pointer-events:auto!important;touch-action:none;display:flex;align-items:flex-end;justify-content:center}
      .bnSpot i{display:block;width:100%;height:28%;border-radius:50%;border:4px dashed rgba(255,246,220,.75);background:radial-gradient(ellipse,rgba(255,240,190,.35),rgba(255,240,190,0) 70%);
        transform:translateY(40%);transition:border-color .2s,background .2s}
      .bnSpot b{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);font-size:calc(var(--dh)*.26);line-height:1;opacity:.85;animation:bnBob 1.6s ease-in-out infinite}
      @keyframes bnBob{50%{translate:0 -10%}}
      .bnSpot.has i,.bnSpot.has b{opacity:0}
      .bnSpot.dropHover i{border-color:#ffd23f;border-style:solid;background:radial-gradient(ellipse,rgba(255,215,90,.6),rgba(255,215,90,0) 72%)}
      .bnSpot.ask i{animation:bnAsk .55s ease-out}
      @keyframes bnAsk{30%{border-color:#ffd23f;scale:1.15}}
      .bnHit{pointer-events:auto!important;touch-action:none;border-radius:30%;z-index:5}
      .bnHit img{width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none}
      .bnHit.dragging img{opacity:.9}
      /* 악기 (인형 부위를 따라감) */
      .bnInst{height:calc(var(--dh)*var(--k,.5));z-index:4}
      .bnInst img{height:100%;width:auto;display:block;filter:drop-shadow(0 5px 4px rgba(60,25,10,.35))}
      .bnInst.in img{animation:bnIn .35s cubic-bezier(.2,1.5,.4,1) backwards}
      @keyframes bnIn{from{scale:.3;opacity:0}}
      .bnInst.out{transition:opacity .3s;opacity:0}
      .bnInst.flip img{transform:scaleX(-1)}
      .bnNote{font-size:calc(var(--dh)*.16);line-height:1;animation:bnNote 1.1s ease-out forwards;z-index:6}
      @keyframes bnNote{from{translate:0 0;scale:.5;opacity:0}20%{opacity:1;scale:1}to{translate:var(--nx,20%) -160%;opacity:0;scale:1.1}}
      /* 단추 (무대 위 왼쪽 위) */
      .bnCtl{position:absolute;left:10px;top:10px;display:flex;gap:6px;z-index:7;pointer-events:none;flex-wrap:wrap;max-width:calc(100% - 100px)}
      .bnGrp{display:flex;gap:4px;background:rgba(255,248,235,.82);border-radius:40px;padding:4px;pointer-events:auto;box-shadow:0 3px 0 rgba(90,40,20,.25)}
      .bnB{width:52px;height:52px;border-radius:50%;background:#fff;box-shadow:0 4px 0 rgba(120,70,30,.25);font-size:27px;display:flex;align-items:center;justify-content:center}
      .bnB.sel{background:var(--sun);box-shadow:0 4px 0 #d9a000}
      .bnEar{position:absolute;right:12px;top:10px;width:72px;height:72px;font-size:38px;border-radius:50%;background:#ffe0f0;box-shadow:0 6px 0 #e79cbf;z-index:7;display:flex;align-items:center;justify-content:center}
      .bnEar.go{animation:bnPulse 1s ease-in-out infinite}
      @keyframes bnPulse{50%{transform:scale(1.1)}}
      /* 대기석 (점토 쟁반) */
      .bnBench{flex:0 0 auto;display:flex;gap:clamp(8px,1.8vw,18px);justify-content:center;flex-wrap:wrap;align-items:center;align-self:center;
        background:linear-gradient(#f7ead6,#efdcc0);border-radius:28px;padding:8px 14px;box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12);transition:background .2s}
      .bnBench.dropHover{background:linear-gradient(#fff3df,#ffe2b8)}
      .bnCard{position:relative;width:clamp(78px,10vw,108px);height:clamp(78px,10vw,108px);border-radius:26px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);
        box-shadow:0 6px 0 rgba(140,95,50,.18),inset 0 -4px 0 rgba(160,110,60,.1);animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);transition:opacity .25s}
      .bnCard .dl{position:absolute;left:2%;top:3%;width:70%;height:86%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 3px 2px rgba(80,40,20,.2))}
      .bnCard .in{position:absolute;right:2%;bottom:3%;width:52%;height:52%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 3px 2px rgba(80,40,20,.25))}
      .bnCard.on{opacity:.38}
      .bnCard.dragging{z-index:60;opacity:1;background:transparent;box-shadow:none}
      .bnCard.locked{filter:saturate(.7)}
      @media (orientation:portrait){
        .bnCard{width:clamp(70px,19vw,104px);height:clamp(70px,19vw,104px)}
        .bnBench{max-width:calc(3 * clamp(70px,19vw,104px) + 2 * 12px + 30px);gap:10px 12px}
      }
      @media (orientation:portrait) and (min-width:700px){.bnBench{max-width:none}}
      @media (max-width:430px){.bnB{width:44px;height:44px;font-size:23px}.bnEar{width:64px;height:64px;font-size:33px}}
      @media (orientation:landscape) and (max-height:520px){
        .bnWrap{flex-direction:row;padding:0 10px 8px}
        .bnBench{flex-direction:row;width:calc(2*72px + 34px);gap:8px;align-content:center;padding:6px;align-self:stretch}
        .bnCard{width:72px;height:72px;border-radius:20px}
        .bnB{width:44px;height:44px;font-size:23px}
      }
    `);

    /* ---------- 화음 진행 (다장조 4마디: C - Am - F - G) ---------- */
    const PROG = [
      { r: 48, t: [60, 64, 67] }, // C
      { r: 45, t: [57, 60, 64] }, // Am
      { r: 41, t: [53, 57, 60] }, // F
      { r: 43, t: [55, 59, 62] }, // G
    ];
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const hum = (v) => v * (0.92 + Math.random() * 0.16); // 사람이 치는 것처럼 세기를 살짝씩 다르게

    /* ---------- 악기 소리: 실제 녹음 샘플(KP.sampler) → 못 불러왔으면 합성음 ---------- */
    const snd = {
      kick(w, v = 1) {
        if (SM.hit("drums", "kick", { when: w, vol: 0.85 * v })) SM.hit("drums", "kick2", { when: w, vol: 0.4 * v });
        else A.kick({ vol: 0.6 * v, when: w });
      },
      snare(w, v = 1) {
        if (SM.hit("drums", v < 0.6 ? "snareSoft" : "snare", { when: w, vol: 0.2 + 0.4 * v })) return;
        A.noise({ dur: 0.16, vol: 0.17 * v, bp: 1900, q: 0.7, when: w });
        A.tone(200, { to: 150, dur: 0.1, vol: 0.13 * v, type: "triangle", when: w });
      },
      hat(w, v = 1) {
        SM.hit("drums", "hat", { when: w, vol: 0.26 * v }) || A.noise({ dur: 0.04, vol: 0.045 * v, hp: 8000, when: w });
      },
      hatOpen(w, v = 1) {
        SM.hit("drums", "hatOpen", { when: w, vol: 0.2 * v, dur: 0.4, rel: 0.15 }) || A.noise({ dur: 0.2, vol: 0.04 * v, hp: 7000, when: w });
      },
      crash(w, v = 1) {
        SM.hit("drums", "crash", { when: w, vol: 0.3 * v }) || A.noise({ dur: 0.9, vol: 0.05 * v, hp: 5000, when: w });
      },
      tamb(w, v = 1) {
        if (SM.hit("tamb", "hit", { when: w, vol: 0.45 * v })) return;
        for (let k = 0; k < 3; k++) A.noise({ dur: 0.09, vol: 0.075 * v, hp: 6500, when: w + k * 0.026 });
      },
      shake(w, v = 1) {
        SM.hit("tamb", "shake", { when: w, vol: 0.28 * v, dur: 0.25, rel: 0.12 }) || A.noise({ dur: 0.08, vol: 0.06 * v, hp: 5000, attack: 0.02, when: w });
      },
      xylo(m, w, v = 1) {
        if (SM.note("xylo", m, { when: w, vol: 0.5 * v })) return;
        A.note(hz(m), { inst: "marimba", dur: 0.6, vol: 0.2 * v, when: w });
      },
      piano(m, w, d, v = 1) {
        SM.note("piano", m, { when: w, vol: 0.26 * v, dur: d }) || A.note(hz(m), { inst: "pluck", dur: Math.max(0.25, d), vol: 0.1 * v, when: w });
      },
      guitar(m, w, d, v = 1) {
        SM.note("guitar", m, { when: w, vol: 0.42 * v, dur: d }) || A.note(hz(m), { inst: "bass", dur: d, vol: 0.2 * v, when: w });
      },
      choir(m, w, d, v = 1) {
        if (SM.note("choir", m, { when: w, vol: 0.38 * v, dur: d })) return;
        const f = hz(m);
        A.note(f, { inst: "soft", dur: d, vol: 0.16 * v, when: w + 0.015 });
        A.tone(f * 2, { dur: d * 0.6, vol: 0.025 * v, attack: 0.05, when: w + 0.02 });
      },
    };
    // 마디별 멜로디 (칸 → 음)
    const MEL = [
      { 0: 76, 2: 79, 4: 76, 5: 74, 6: 72 },
      { 0: 72, 2: 76, 4: 69, 6: 72 },
      { 0: 69, 2: 72, 4: 77, 6: 76 },
      { 0: 74, 2: 71, 4: 67, 6: 71, 7: 74 },
    ];
    const SING = [
      { 0: [67, 3], 4: [64, 1], 6: [67, 2] },
      { 0: [64, 3], 4: [60, 1], 6: [64, 2] },
      { 0: [65, 3], 4: [69, 1], 6: [65, 2] },
      { 0: [62, 3], 4: [67, 1], 6: [71, 2] },
    ];
    const SING_CALM = [
      { 0: [67, 4], 4: [64, 4] },
      { 0: [64, 4], 4: [60, 4] },
      { 0: [65, 4], 4: [69, 4] },
      { 0: [62, 4], 4: [67, 4] },
    ];
    /* 연주자: 악기 그림(img)·악기 이름(say: 이미 녹음된 말)·붙일 부위(at)·위치(dx,dy: 인형 키 비율)·크기(k)·회전(rot)
       play(분위기, 칸, 마디, 시각, 칸 길이, 동작 hit(손, 세기, 음)) */
    const PLAYERS = [
      {
        id: "drum", say: "드럼", img: "drum", at: "belly", dx: 0.02, dy: 0.08, k: 0.62, kit: ["drums"],
        play(mood, s, bar, w, sd, hit) {
          if (mood === "fun") {
            const fill = bar % 4 === 3;
            if (s === 0 && bar % 4 === 0) (snd.crash(w, 0.8), hit(w, "B", 1));
            if (s === 0 || s === 4 || (s === 3 && bar % 2 === 1)) (snd.kick(w, s === 3 ? 0.7 : 1), hit(w, "K", 1));
            if (s === 2 || s === 6) (snd.snare(w, hum(1)), hit(w, "L", 1));
            if (fill && s === 7) (snd.snare(w, 0.5), hit(w, "L", 0.6));
            if (!(fill && s >= 6)) (snd.hat(w, hum(s % 2 ? 0.55 : 0.9)), hit(w, "R", s % 2 ? 0.4 : 0.7));
            if (s === 7 && bar % 4 === 1) snd.hatOpen(w, 0.6);
          } else {
            if (s === 0) (snd.kick(w, 0.55), hit(w, "K", 0.6));
            if (s === 5 && bar % 2 === 1) snd.kick(w, 0.35);
            if (s === 4) (snd.snare(w, 0.4), hit(w, "L", 0.5));
            if (s % 2 === 0) (snd.hat(w, hum(0.45)), hit(w, "R", 0.35));
            if (s === 0 && bar % 8 === 0) snd.crash(w, 0.35);
          }
        },
      },
      {
        id: "xylo", say: "실로폰", img: "xylo", at: "belly", dx: 0, dy: 0.13, k: 0.5, kit: ["xylo"],
        play(mood, s, bar, w, sd, hit) {
          if (mood === "fun") {
            const m = MEL[bar % 4][s];
            if (m) (snd.xylo(m, w, hum(s === 0 ? 1 : 0.8)), hit(w, s % 4 < 2 ? "R" : "L", 1, m));
          } else if (s % 2 === 0) {
            const t = PROG[bar % 4].t, m = [t[0], t[1], t[2], t[1]][s / 2] + 12;
            snd.xylo(m, w, hum(0.5));
            hit(w, s % 4 ? "L" : "R", 0.6, m);
          }
        },
      },
      {
        id: "piano", say: "피아노", img: "piano", at: "belly", dx: 0, dy: 0.09, k: 0.66, kit: ["piano"],
        play(mood, s, bar, w, sd, hit) {
          const P = PROG[bar % 4], lh = P.r < 48 ? P.r + 12 : P.r;
          const chord = (v, d) => P.t.forEach((m) => snd.piano(m, w, d * sd, hum(v)));
          if (mood === "fun") {
            if (s === 0) (chord(0.85, 2.6), snd.piano(lh, w, 3.6 * sd, 0.7), hit(w, "B", 1));
            if (s === 3) (chord(0.55, 0.9), hit(w, "R", 0.6));
            if (s === 4) (chord(0.7, 1.6), snd.piano(lh, w, 1.8 * sd, 0.55), hit(w, "B", 0.8));
            if (s === 6) (chord(0.5, 1.6), hit(w, "R", 0.6));
          } else {
            if (s === 0) (chord(0.6, 7.5), snd.piano(lh, w, 7.5 * sd, 0.55), hit(w, "B", 0.7));
            if (s === 2 || s === 6) (snd.piano(P.t[1] + 12, w, 1.8 * sd, 0.35), hit(w, "R", 0.4));
            if (s === 4) (snd.piano(P.t[2] + 12, w, 1.8 * sd, 0.4), hit(w, "R", 0.4));
          }
        },
      },
      {
        id: "guitar", say: "기타", img: "guitar", at: "belly", dx: 0.05, dy: -0.05, k: 0.62, rot: -28, flip: true, kit: ["guitar"],
        play(mood, s, bar, w, sd, hit) {
          const r = PROG[bar % 4].r;
          if (mood === "fun") {
            if (s === 0) (snd.guitar(r, w, 2.5 * sd, 1), hit(w, "R", 1));
            if (s === 3) (snd.guitar(r, w, 0.9 * sd, 0.6), hit(w, "R", 0.5));
            if (s === 4) (snd.guitar(r + 7, w, 1.6 * sd, 0.85), hit(w, "R", 0.8));
            if (s === 6) (snd.guitar(r + 12, w, 1.5 * sd, 0.7), hit(w, "R", 0.7));
          } else {
            if (s === 0) (snd.guitar(r, w, 3.8 * sd, 0.8), hit(w, "R", 0.7));
            if (s === 4) (snd.guitar(r + 7, w, 3.6 * sd, 0.6), hit(w, "R", 0.5));
          }
        },
      },
      {
        id: "tamb", say: "탬버린", img: "tamb", at: "handR", dx: 0, dy: -0.05, k: 0.26, kit: ["tamb"],
        play(mood, s, bar, w, sd, hit) {
          if (mood === "fun") {
            if (s === 2 || s === 6) (snd.tamb(w, hum(1)), hit(w, "L", 1));
            else if (s % 2 === 1) (snd.shake(w, hum(0.75)), hit(w, "R", 0.6));
          } else {
            if (s === 0 || s === 4) (snd.shake(w, hum(s ? 0.45 : 0.6)), hit(w, "R", 0.5));
            if (s === 0 && bar % 2 === 0) (snd.tamb(w, 0.35), hit(w, "L", 0.4));
          }
        },
      },
      {
        id: "mic", say: "노래", img: "mic", at: "mouth", dx: 0, dy: 0.24, k: 0.62, kit: ["choir"],
        play(mood, s, bar, w, sd, hit) {
          const n = (mood === "fun" ? SING : SING_CALM)[bar % 4][s];
          if (!n) return;
          const d = n[1] * sd * (mood === "fun" ? 0.92 : 0.96);
          snd.choir(n[0], w, d, mood === "fun" ? 1 : 0.85);
          hit(w, "S", 1, n[0], d);
        },
      },
    ];
    const byId = {};
    PLAYERS.forEach((p) => (byId[p.id] = p));
    ctx.PLAYERS = PLAYERS;
    ctx.IMG = IMG;

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "bnWrap");
    const room = U.el("div", "bnRoom");
    const bench = U.el("div", "bnBench");
    wrap.append(room, bench);
    ctx.body.appendChild(wrap);
    ctx.room = room;
    ctx.benchEl = bench;
    // 공연장 그림(1600×900): 지평선·화각·잘릴 때 남길 곳(무대 가운데)·조명(위)
    ctx.BG = { file: IMG + "bg.jpg", img: [1600, 900], vh: 0.5, near: 0.2, fov: 30, focus: [0.5, 0.56], focusP: [0.5, 0.6], sun: [0.1, 1, 0.9], sunCol: "#fff0d6" };

    const MOODS = [["fun", "🎉", "신나게"], ["calm", "🌙", "잔잔하게"]];
    const TEMPOS = [["🐢", 84, "느리게"], ["🚶", 104, "보통"], ["🐇", 126, "빠르게"]];
    let mood = KP.store.get("band:mood", "fun");
    if (!MOODS.some((m) => m[0] === mood)) mood = "fun";
    let tempo = KP.store.get("band:tempo", 104);
    if (!TEMPOS.some((t) => t[1] === tempo)) tempo = 104;
    const ctl = U.el("div", "bnCtl");
    const gMood = U.el("div", "bnGrp"),
      gTempo = U.el("div", "bnGrp");
    const moodBtns = MOODS.map(([id, em, word]) => {
      const b = U.btn(KP.E(em), "bnB");
      ctx.tap(b, () => {
        mood = id;
        KP.store.set("band:mood", id);
        paintSel();
        U.replay(b, "jump");
        A.sfx("select");
        KP.voice.say(word);
      });
      gMood.appendChild(b);
      return b;
    });
    const tempoBtns = TEMPOS.map(([em, bpm, word]) => {
      const b = U.btn(KP.E(em), "bnB");
      ctx.tap(b, () => {
        tempo = bpm;
        KP.store.set("band:tempo", bpm);
        paintSel();
        U.replay(b, "jump");
        A.sfx("select");
        KP.voice.say(word);
      });
      gTempo.appendChild(b);
      return b;
    });
    function paintSel() {
      moodBtns.forEach((b, i) => b.classList.toggle("sel", MOODS[i][0] === mood));
      tempoBtns.forEach((b, i) => b.classList.toggle("sel", TEMPOS[i][1] === tempo));
    }
    ctl.append(gMood, gTempo);
    const bEar = U.btn(KP.E("👂"), "bnEar");
    paintSel();

    /* ---------- 대기석 카드 ---------- */
    const cards = {},
      drags = {};
    const where = {}; // 연주자 id → 무대 자리 번호 또는 null(대기석)
    PLAYERS.forEach((p) => {
      const c = U.el("div", "bnCard", '<img class="dl" alt="" draggable="false"><img class="in" alt="" draggable="false" src="' + IMG + p.img + '.png">');
      c.setAttribute("aria-label", p.say);
      c.dataset.id = p.id;
      cards[p.id] = c;
      where[p.id] = null;
      bench.appendChild(c);
      let sx = 0,
        sy = 0,
        moved = 0;
      c.addEventListener("pointerdown", (e) => {
        sx = e.clientX;
        sy = e.clientY;
        moved = 0;
      });
      c.addEventListener("pointermove", (e) => {
        moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
      });
      drags[p.id] = KP.drag(c, {
        pad: 26,
        snap: false,
        targets: () => (where[p.id] != null ? [] : spots.map((s) => s.el)),
        accept: () => mode !== "copy" || target.includes(p.id),
        onReject: (t) => {
          if (mode !== "copy") return;
          wrongPick(p.id, t);
        },
        onDrop: (t) => {
          c.style.transform = "";
          if (!t) {
            if (moved < 14) tapped(p.id);
            return;
          }
          const i = spots.findIndex((s) => s.el === t);
          if (i >= 0) place(p.id, i);
        },
      });
    });

    /* ---------- 상태 ---------- */
    let spots = []; // 무대 자리: {u, v, el, row}
    const dolls = {}; // 연주자 id → 무대 위 인형 {act, fw, inst, hit, drag, spot, h, motion…}
    const players = new Map(); // 연주 중: id → {start: 들어오는 칸}
    let preview = null; // 3단계 들려주기 중: Map
    let curLevel = 1,
      mode = "free",
      muted = false,
      winning = false,
      together = 0,
      lastWin = 0,
      lastKey = "",
      wins = 0,
      soloBars = 0,
      nudged = false,
      target = [],
      roundId = 0,
      copyRound = 0,
      earWait = false, // 들려주기를 기다리는 중(다시 듣기 연타로 안내가 겹치지 않게)
      done = false;
    const occupant = (i) => PLAYERS.find((p) => where[p.id] === i);
    const key = () => PLAYERS.filter((p) => where[p.id] != null).map((p) => p.id).join(",") + "|" + mood + "|" + tempo;

    function tapped(id) {
      if (where[id] != null) return unplace(id);
      const free = spots.findIndex((s, i) => !occupant(i));
      if (free < 0) {
        U.replay(cards[id], "wrong");
        A.sfx("boing");
        spots.forEach((s) => U.replay(s.el, "ask"));
        return;
      }
      if (mode === "copy" && !target.includes(id)) return wrongPick(id, spots[free].el);
      place(id, free);
    }
    function wrongPick(id, el) {
      U.replay(cards[id], "wrong");
      ctx.miss(el, "다시 들어 볼까요?");
      checkLevel();
    }
    function place(id, i) {
      const prev = where[id];
      const other = occupant(i);
      if (other && other.id !== id) {
        if (prev != null) {
          // 무대 위끼리 자리 바꾸기 (연주는 그대로)
          where[other.id] = prev;
          moveDoll(other.id, prev);
        } else unplace(other.id, true);
      }
      where[id] = i;
      if (prev != null) moveDoll(id, i);
      else {
        cards[id].classList.add("on");
        enterDoll(id, i);
        startPlaying(id);
        A.sfx("snap");
        KP.voice.say(byId[id].say);
      }
      refresh();
    }
    function unplace(id, quiet) {
      if (where[id] == null) return;
      where[id] = null;
      cards[id].classList.remove("on");
      players.delete(id);
      leaveDoll(id);
      if (!quiet) A.sfx("slide");
      if (!players.size && !preview) stopT();
      refresh();
    }
    function refresh() {
      spots.forEach((s, i) => s.el.classList.toggle("has", !!occupant(i)));
      const any = PLAYERS.some((p) => where[p.id] != null);
      if (mode === "free") {
        if (!any) ctx.hint(() => benchFirst(), "동물 친구를 무대에 올려 봐요!");
        else ctx.hint(null);
      } else if (!done && !preview) checkCopy();
    }
    function benchFirst() {
      const p = PLAYERS.find((x) => where[x.id] == null);
      return p ? cards[p.id] : null;
    }

    /* ---------- 무대 · 인형 ---------- */
    const T3 = () => KP.clayStage.THREE;
    let st = null,
      ov = null,
      spotLayer = null;
    const bulbs = [],
      cones = [];
    let cast = {}; // 연주자 id → 인형 고르기 {item}|{species}
    /** 연주자마다 인형 정하기: 칠한 인형 먼저(종이 겹치지 않게) → 모자라면 기본 색 인형(남은 종) */
    function castDolls(list) {
      const D = KP.DOLL, used = new Set(), out = {};
      const pool = U.shuffle(list.slice());
      const picks = [];
      for (const it of pool) if (!used.has(it.species) && picks.length < PLAYERS.length) (used.add(it.species), picks.push({ item: it }));
      for (const sp of U.shuffle(D.ORDER.slice())) if (!used.has(sp) && picks.length < PLAYERS.length) (used.add(sp), picks.push({ species: sp }));
      // 종이 6가지가 안 되면(칠한 인형이 같은 종뿐 등) 칠한 인형을 겹쳐 씀
      for (let i = 0; picks.length < PLAYERS.length; i++) picks.push(pool.length ? { item: pool[i % pool.length] } : { species: D.ORDER[i % D.ORDER.length] });
      PLAYERS.forEach((p, i) => (out[p.id] = picks[i]));
      return out;
    }
    function paintCards() {
      PLAYERS.forEach((p) => {
        const c = cast[p.id], img = cards[p.id].querySelector(".dl"), sp = c.item ? c.item.species : c.species;
        const own = c.item && KP.safeImg(c.item.thumb);
        img.src = own || KP.DOLL.thumbUrl(sp);
        if (!own) tintThumb(sp).then((u) => u && cast[p.id] === c && (img.src = u));
      });
    }
    /** 기본 색 인형 카드 그림: 흰 점토 정면 그림에 무대 인형과 같은 몸 색을 입힘 (선은 그대로) */
    const tints = {};
    function tintThumb(sp) {
      if (tints[sp]) return tints[sp];
      const col = KP.dollActor.BASE_COL && KP.dollActor.BASE_COL[sp];
      if (!col) return Promise.resolve(null);
      return (tints[sp] = new Promise((res) => {
        const im = new Image();
        im.onload = () => {
          try {
            const c = document.createElement("canvas");
            c.width = im.naturalWidth;
            c.height = im.naturalHeight;
            const g = c.getContext("2d");
            g.drawImage(im, 0, 0);
            g.globalCompositeOperation = "multiply";
            g.fillStyle = col[0];
            g.fillRect(0, 0, c.width, c.height);
            g.globalCompositeOperation = "destination-in";
            g.drawImage(im, 0, 0);
            res(c.toDataURL("image/png"));
          } catch (e) {
            res(null);
          }
        };
        im.onerror = () => res(null);
        im.src = KP.DOLL.thumbUrl(sp);
      }));
    }

    /** 무대 자리 배치: 보이는 무대 폭에 한 줄로 고르게 (악기 그림이 앞 인형을 가리지 않게 두 줄은 쓰지 않음) */
    function layoutSpots() {
      if (!st || !st.bc) return;
      const n = spots.length, vis = st.bc.vis, fw = st.bc.view.fw;
      const u0 = Math.max(vis.u0 + 0.025, 0.16), u1 = Math.min(vis.u1 - 0.025, 0.84), W = u1 - u0;
      const tall = st.h > st.w;
      // 자리 → 땅 위 점 · 인형 키 (화면 높이 비율, 옆 자리와 너무 겹치지 않게)
      for (let i = 0; i < n; i++) {
        const s = Object.assign(spots[i], { u: u0 + (W * (i + 0.5)) / n, v: 0.745, row: 0 });
        const g = st.bc.ground(s.u, s.v) || [0, -6];
        s.x = g[0];
        s.z = g[1];
        const gap = (W * fw) / Math.max(n, 1.6);
        let h = st.fitH(s.x, s.z, n <= 2 ? (tall ? 0.36 : 0.44) : 0.4);
        h = Math.min(h, st.pxToWorld(s.x, s.z, gap * (tall ? 1.02 : 0.9)) / 0.95);
        s.h = h;
      }
    }
    function makeSpots(n, q) {
      if (spotLayer) spotLayer.innerHTML = "";
      spots = [];
      for (let i = 0; i < n; i++) {
        const el = U.el("div", "bnSpot", "<i></i>" + (q ? "<b>" + KP.E("❓") + "</b>" : ""));
        if (spotLayer) spotLayer.appendChild(el);
        spots.push({ el, u: 0.5, v: 0.75, row: 0 });
      }
      layoutSpots();
      PLAYERS.forEach((p) => {
        const d = dolls[p.id];
        if (d && where[p.id] != null) {
          const s = spots[where[p.id]];
          if (s) (d.act.place(s.x, s.z, s.h * d.kh), (d.spot = where[p.id]));
        }
      });
    }
    function posSpots() {
      if (!st) return;
      for (const s of spots) {
        const f = Object.assign({}, st.project(s.x, 0, s.z)), t = st.project(s.x, s.h, s.z); // project 는 같은 객체를 돌려주므로 복사
        const hh = Math.max(40, f.y - t.y), ww = hh * 0.85;
        s.el.style.cssText = `width:${ww}px;height:${hh}px;transform:translate(${f.x - ww / 2}px,${f.y - hh}px);--dh:${hh}px`;
        s.px = { x: f.x, y: f.y, h: hh };
      }
    }
    /** 조명: 무대 앞 전구(그림의 전구 자리) + 연주자 위 스포트라이트 */
    function makeLights() {
      bulbs.length = 0;
      cones.length = 0;
      // 그림 속 무대 앞 전구 자리 (bg.jpg 1600×900 기준)
      const BU = [0.0175, 0.085, 0.1625, 0.2625, 0.3725, 0.4875, 0.61, 0.725, 0.8275, 0.916, 0.981];
      const BV = [0.789, 0.818, 0.838, 0.856, 0.862, 0.867, 0.862, 0.856, 0.838, 0.818, 0.789];
      for (let i = 0; i < BU.length; i++) {
        const u = BU[i], v = BV[i];
        const b = U.el("span", "bnBulb" + (i % 2 ? " pink" : ""));
        b.dataset.u = u;
        b.dataset.v = v;
        ov.appendChild(b);
        bulbs.push(b);
      }
      for (let i = 0; i < 4; i++) {
        const c = U.el("span", "bnCone" + (i % 2 ? " pink" : ""));
        c.style.display = "none";
        ov.insertBefore(c, ov.firstChild);
        cones.push(c);
      }
    }
    function posLights() {
      const s = Math.max(14, Math.min(34, st.h * 0.05));
      for (const b of bulbs) {
        const p = st.uvToPx(+b.dataset.u, +b.dataset.v);
        b.style.transform = `translate(${p.x}px,${p.y}px)`;
        b.style.setProperty("--s", s + "px");
      }
      let k = 0;
      for (const p of PLAYERS) {
        const d = dolls[p.id];
        if (!d || d.leaving || !d.act || k >= cones.length) continue;
        const c = cones[k++], b = d.act.box(), top = st.uvToPx(0.5, 0.0).y;
        const w = b.w * 1.5, hgt = Math.max(10, b.b - top + b.h * 0.05);
        c.style.cssText = `display:block;width:${w}px;height:${hgt}px;transform:translate(${b.cx - w / 2}px,${top}px)`;
        c.dataset.id = p.id;
      }
      for (; k < cones.length; k++) cones[k].style.display = "none";
    }

    /** 무대 만들기 (3D 가 되면 3D, 아니면 그림) — 화면이 끊기면 새로, 너무 느리면 그림으로 (병원과 같은 규칙) */
    async function makeStage() {
      const CS = KP.clayStage;
      dropStage();
      const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
      const slow = KP.store.get("band:flat", null);
      let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
      if (!flat) {
        try {
          await CS.load();
        } catch (e) {
          flat = true;
        }
      }
      if (!ctx._active || tok !== ctx._stTok) return null;
      let s;
      const opt = {
        flat,
        qKey: "play3d:q",
        onLost: () => ctx._active && st === s && rebuild(),
        onSlow: () => {
          if (!ctx._active || st !== s) return;
          KP.store.set("band:flat", { t: Date.now() });
          KP.toast("기기가 바빠서 그림으로 바꿨어요");
          rebuild();
        },
      };
      try {
        s = CS.create(room, ctx.BG, opt);
      } catch (e) {
        opt.flat = true;
        s = CS.create(room, ctx.BG, opt);
      }
      st = s;
      ov = U.el("div", "bnOv");
      spotLayer = U.el("div", "bnOv");
      s.ui.append(ov, spotLayer, ctl, bEar);
      makeLights();
      spots.forEach((sp) => spotLayer.appendChild(sp.el));
      s.onResize = () => {
        layoutSpots();
        PLAYERS.forEach((p) => {
          const d = dolls[p.id];
          if (d && !d.leaving && where[p.id] != null && spots[where[p.id]]) {
            const sp = spots[where[p.id]];
            d.act.setH(sp.h * d.kh);
            if (!d.act._jump && d.act.a.state === "idle") d.act.place(sp.x, sp.z);
          }
        });
      };
      layoutSpots();
      return s;
    }
    function dropStage() {
      PLAYERS.forEach((p) => killDoll(p.id));
      if (st) st.dispose();
      st = null;
      ov = spotLayer = null;
    }
    /** 화면이 끊기거나 그림으로 바꿀 때: 무대만 새로 만들고 무대 위 친구들을 다시 세움 (연주는 이어서) */
    async function rebuild() {
      const on = PLAYERS.filter((p) => where[p.id] != null).map((p) => [p.id, where[p.id]]);
      const s = await makeStage();
      if (!s) return;
      startLoop(s);
      on.forEach(([id, i]) => enterDoll(id, i, true));
    }
    function startLoop(s) {
      ctx.loop((dt) => {
        if (st !== s || s.dead) return false;
        frame(dt);
        s.tick(dt);
        afterTick();
      });
    }

    /** 인형 올라오기: 무대 앞쪽 아래에서 폴짝 → 자리. 악기는 몸 앞에 붙음 */
    async function enterDoll(id, i, instant) {
      killDoll(id);
      if (!st) return;
      const s0 = st, p = byId[id];
      const d = (dolls[id] = { id, act: null, spot: i, leaving: false, kh: 1, hand: { R: -9, L: -9, B: -9, K: -9, S: -9 }, sEnd: 0, pitch: 0, beat: -9, pend: [] });
      let act;
      try {
        act = s0.gl ? await KP.dollActor.create(s0, cast[id]) : await KP.dollActor.create2D(s0, cast[id]);
      } catch (e) {
        console.warn("인형 준비 실패", e && e.message);
        if (st !== s0 || dolls[id] !== d) return;
        act = await KP.dollActor.create2D(s0, { species: "bear" });
      }
      if (!act) return;
      if (st !== s0 || dolls[id] !== d || where[id] == null) return act.dispose();
      d.act = act;
      // 종마다 모양 비율이 달라 폭이 넓은 종(코끼리 등)은 살짝 작게
      d.kh = Math.min(1, 0.95 / Math.max(0.6, act.k.w));
      const sp = spots[where[id]];
      act.setH(sp.h * d.kh);
      act.mood("happy");
      act.a.look = 1e9;
      if (instant) act.place(sp.x, sp.z);
      else {
        act.place(sp.x, sp.z + sp.h * 1.2);
        act.jumpTo(sp.x, sp.z, 0.55, 0.6);
      }
      // 악기 그림 (부위를 따라감)
      d.fw = KP.dollFollow(ov, act);
      d.inst = U.el("span", "bnInst in", '<img alt="" draggable="false" src="' + IMG + p.img + '.png">');
      d.inst.style.setProperty("--k", p.k);
      if (p.flip) d.inst.classList.add("flip"); // 기타: 목이 왼손(들어 올린 손) 쪽으로
      d.instO = d.fw.add(d.inst, p.at, p.dx, p.dy, p.rot || 0);
      // 무대 위 인형을 만지는 곳 (콕 → 내려가기, 끌어서 다른 자리·대기석으로)
      d.hit = U.el("div", "bnHit", '<img alt="" draggable="false" src="' + cards[id].querySelector(".dl").src + '">');
      ov.appendChild(d.hit);
      let moved = 0, sx = 0, sy = 0;
      d.hit.addEventListener("pointerdown", (e) => {
        sx = e.clientX;
        sy = e.clientY;
        moved = 0;
      });
      d.hit.addEventListener("pointermove", (e) => {
        moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
      });
      d.drag = KP.drag(d.hit, {
        pad: 20,
        snap: false,
        targets: () => (done || preview ? [] : [bench, ...spots.filter((s, k) => k !== where[id]).map((s) => s.el)]),
        onDrop: (t) => {
          d.hit.style.transform = "";
          if (!t) {
            if (moved < 14 && !done && !preview) unplace(id);
            return;
          }
          if (t === bench) unplace(id);
          else {
            const k = spots.findIndex((s) => s.el === t);
            if (k >= 0) place(id, k);
          }
        },
      });
      if (mode === "copy" && (done || preview)) d.drag.lock();
    }
    function moveDoll(id, i) {
      const d = dolls[id], sp = spots[i];
      if (!d || !sp) return;
      d.spot = i;
      if (d.act) {
        d.act.setH(sp.h * d.kh);
        d.act.jumpTo(sp.x, sp.z, 0.45, 0.35);
      }
    }
    function leaveDoll(id) {
      const d = dolls[id];
      if (!d) return;
      if (!d.act) return killDoll(id);
      d.leaving = true;
      const s0 = st, a = d.act;
      if (d.hit) d.hit.remove();
      d.inst.classList.add("out");
      a.play.fR = a.play.fL = a.play.uR = a.play.uL = 0;
      a.jumpTo(a.a.x, a.a.z + (a.h || 1) * 1.6, 0.45, 0.5);
      ctx.after(460, () => {
        if (dolls[id] === d && st === s0) killDoll(id);
      });
    }
    function killDoll(id) {
      const d = dolls[id];
      if (!d) return;
      delete dolls[id];
      if (d.fw) d.fw.clear();
      if (d.hit) d.hit.remove();
      if (d.act) d.act.dispose();
    }

    /* ---------- 연주 동작 (오디오 시계에 맞춰) ---------- */
    const motion = []; // 예약된 동작 {t, id, hand, v, m, d}
    const beats = []; // 예약된 박 {t, beat, down, live}
    function queueHit(id) {
      return (w, hand, v = 1, m = 0, dur = 0) => {
        const c = A.ctx();
        if (c) motion.push({ t: c.currentTime + w, id, hand, v, m, d: dur });
      };
    }
    const ex = (dt, k) => (dt < 0 ? 0 : Math.exp(-dt * k));
    /** 매 장면: 때가 된 동작·박을 꺼내 인형 자세에 반영 */
    function frame() {
      const c = A.ctx();
      if (!c || !st) return;
      const now = c.currentTime, t = st.time;
      for (let i = motion.length - 1; i >= 0; i--) {
        const e = motion[i];
        if (e.t > now) continue;
        motion.splice(i, 1);
        const d = dolls[e.id];
        if (!d || !d.act) continue;
        d.hand[e.hand] = e.t;
        d.vel = e.v;
        if (e.m) d.pitch = e.m;
        if (e.hand === "S") {
          d.sEnd = e.t + e.d;
          noteFloat(d);
        }
        if (e.hand === "K" || e.hand === "B") d.act.a.sqv += 2.2 * e.v;
      }
      for (let i = beats.length - 1; i >= 0; i--) {
        const b = beats[i];
        if (b.t > now) continue;
        beats.splice(i, 1);
        beatVis(b);
      }
      const calm = mood === "calm", bk = calm ? 5 : 9;
      for (const p of PLAYERS) {
        const d = dolls[p.id];
        if (!d || !d.act || d.leaving) continue;
        const a = d.act, pl = a.play, H = d.hand;
        const live = players.has(p.id) && T.step >= players.get(p.id).start && !muted;
        const eb = ex(now - d.beat, bk); // 박마다 들썩
        pl.bob = (live ? 0.018 : 0.008) * eb;
        pl.nod = (live ? 0.1 : 0.04) * eb - (calm ? 0 : 0.02);
        pl.sway = Math.sin(t * (calm ? 1.6 : 2.6) + d.spot) * (live ? 0.05 : 0.025);
        pl.tilt = 0;
        const eR = ex(now - H.R, 13), eL = ex(now - H.L, 13), eB = ex(now - H.B, 12);
        switch (p.id) {
          case "drum": // 두 손으로 번갈아 두드리기: 친 순간 손이 내려가고(북) 다시 올라감
            pl.fR = 0.95 + 0.55 * (1 - Math.max(eR, eB));
            pl.fL = 0.95 + 0.55 * (1 - Math.max(eL, eB));
            pl.uR = 0.25;
            pl.uL = 0.25;
            break;
          case "xylo": {
            // 채 흔들기: 높은 음일수록 오른쪽으로
            const side = d.pitch ? U.clamp((d.pitch - 74) / 12, -1, 1) : 0;
            pl.fR = 0.8 + 0.45 * (1 - eR);
            pl.fL = 0.8 + 0.45 * (1 - eL);
            pl.uR = 0.15 - side * 0.18;
            pl.uL = 0.15 + side * 0.18;
            break;
          }
          case "piano": // 건반 누르기: 두 손 살짝 아래로
            pl.fR = 1.15 + 0.2 * (1 - Math.max(eR, eB));
            pl.fL = 1.15 + 0.2 * (1 - eB);
            pl.uR = 0.1 + 0.08 * Math.sin(t * 3);
            pl.uL = 0.1 - 0.08 * Math.sin(t * 3);
            break;
          case "guitar": // 오른손은 줄 튕기기(아래로 쓸어내림), 왼손은 기타 목을 잡음
            pl.fR = 0.75 - 0.3 * eR;
            pl.uR = 0.1 + 0.15 * eR;
            pl.fL = 0.9;
            pl.uL = 0.75;
            break;
          case "tamb": // 오른손은 높이 들고 흔들기, 왼손으로 톡 치기
            pl.uR = 1.45 + 0.25 * eR * Math.sin((now - H.R) * 40);
            pl.fR = 0.35;
            pl.fL = 0.2 + 0.9 * eL;
            pl.uL = 0.1 + 0.3 * eL;
            break;
          case "mic": {
            // 두 손으로 마이크 잡고 노래: 소리 나는 동안 고개 들고 갸웃
            const sing = now < d.sEnd ? 1 : ex(now - d.sEnd, 4);
            pl.fR = pl.fL = 0.95;
            pl.uR = pl.uL = -0.12;
            pl.nod -= 0.12 * sing;
            pl.tilt = Math.sin(t * 2.2) * 0.12 * sing;
            pl.sway *= 1 + sing;
            break;
          }
        }
      }
    }
    function afterTick() {
      if (!st) return;
      posSpots();
      posLights();
      for (const p of PLAYERS) {
        const d = dolls[p.id];
        if (!d || !d.act) continue;
        const dh = d.fw.update();
        if (d.hit && !d.leaving) {
          const b = d.act.box();
          d.hit.style.cssText = `left:${b.l - b.w * 0.05}px;top:${b.t}px;width:${b.w * 1.1}px;height:${b.h * 1.08}px;--dh:${dh}px`;
        }
        d.inst.style.setProperty("--dh", dh + "px");
      }
    }
    function noteFloat(d) {
      if (!ov || !d.act) return;
      const p = d.act.anchor("headTop"), dh = d.fw ? d.fw.dh : 200;
      const n = KP.pfx.float(ov, p.x + dh * 0.22, p.y - dh * 0.05, KP.E(U.pick(["🎵", "🎶"])), "bnNote", 1100, ctx);
      n.style.setProperty("--dh", dh + "px");
      n.style.setProperty("--nx", U.randf(-30, 50) + "%");
    }
    function beatVis(b) {
      const n = bulbs.length;
      bulbs.forEach((el, i) => el.classList.toggle("on", b.down ? i % 2 === 0 : (i + b.beat) % 4 === 0));
      cones.forEach((c) => c.classList.toggle("on", b.down || (b.live && b.live.includes(c.dataset.id) && b.beat % 2 === 0)));
      if (preview) {
        spots.forEach((s) => U.replay(s.el, "ask"));
        return;
      }
      for (const id of b.live || []) {
        const d = dolls[id];
        if (!d) continue;
        d.beat = b.t;
        if (b.down && (id === "drum" || id === "piano" || id === "xylo")) noteFloat(d);
      }
      if (n && b.down) ctx.after(160, () => bulbs.forEach((el) => el.classList.remove("on")));
    }

    /* ---------- 박자 (미리 예약하는 스케줄러, 마디당 8칸) ---------- */
    const T = { on: false, step: 0, nextT: 0, timer: 0 };
    const sd = () => 30 / tempo; // 한 칸 = 반 박
    function startT() {
      const c = A.ctx();
      if (!c || T.on) return;
      T.on = true;
      T.step = 0;
      T.nextT = c.currentTime + 0.08;
      T.timer = ctx.every(30, tick);
      tick();
    }
    function stopT() {
      if (T.timer) ctx.cancel(T.timer);
      T.timer = 0;
      T.on = false;
      motion.length = 0;
      beats.length = 0;
      bulbs.forEach((l) => l.classList.remove("on"));
      cones.forEach((l) => l.classList.remove("on"));
    }
    function startPlaying(id) {
      // 처음 연주자는 바로, 그다음부터는 다음 마디 첫 박에 들어옴
      if (!T.on) {
        startT();
        players.set(id, { start: 0 });
      } else players.set(id, { start: Math.ceil(T.step / 8) * 8 });
    }
    function tick() {
      if (!T.on) return;
      const c = A.ctx();
      if (!c) return;
      const now = c.currentTime;
      if (T.nextT < now - 0.1) T.nextT = now + 0.05; // 화면이 잠깐 멈췄다 돌아오면 몰아서 치지 않게
      const ahead = now + 0.16;
      while (T.on && T.nextT < ahead) {
        const s = T.step,
          sb = s % 8,
          bar = Math.floor(s / 8),
          w = Math.max(0, T.nextT - now),
          d = sd();
        if (sb === 0) onBar(bar);
        if (!T.on) break;
        const src = preview || players;
        const live = [];
        src.forEach((p, id) => {
          if (s < p.start) return;
          live.push(id);
          if (!muted) byId[id].play(mood, sb, bar, w, d, preview ? () => {} : queueHit(id));
        });
        if (sb % 2 === 0 && !muted) beats.push({ t: now + w, beat: sb / 2, down: sb === 0, live: preview ? [] : live });
        T.step++;
        T.nextT += d;
      }
    }
    function onBar(bar) {
      if (preview) {
        if (bar >= preview.endBar) endPreview();
        return;
      }
      if (mode !== "free" || winning || muted) return;
      let n = 0;
      players.forEach((p) => {
        if (p.start <= bar * 8) n++;
      });
      if (n >= 2) together++;
      if (n === 1) {
        soloBars++;
        if (soloBars === 4 && !nudged) {
          nudged = true;
          ctx.tell("친구를 한 명 더 올려 볼까요?");
          ctx.hint(() => benchFirst(), "친구를 한 명 더 올려 볼까요?");
        }
      }
      // 칭찬: 2명 이상이 함께 4마디(두 번째부터 8마디) + 45초 이상 지남 + 지난 칭찬 뒤 무언가 바꿈
      const need = wins ? 8 : 4;
      if (n >= 2 && together >= need && Date.now() - lastWin >= 45000 && key() !== lastKey) freeWin();
    }

    /* ---------- 1·2단계: 자유 합주 ---------- */
    async function freeWin() {
      winning = true;
      muted = true;
      const sess = ctx._session;
      PLAYERS.forEach((p) => dolls[p.id] && dolls[p.id].act && dolls[p.id].act.happy());
      const ok = await ctx.win({ msg: U.pick(["멋진 합주예요!", "{부름} 최고!"]) });
      if (sess !== ctx._session) return;
      winning = false;
      muted = false;
      together = 0;
      wins++;
      lastWin = Date.now();
      lastKey = key();
      if (ok) checkLevel();
    }
    function checkLevel() {
      const lv = ctx.level;
      if (lv === curLevel) return;
      const wasCopy = mode === "copy";
      setLevel(lv, wasCopy || lv >= 3);
    }
    function resetAll() {
      roundId++;
      preview = null;
      PLAYERS.forEach((p) => {
        if (where[p.id] != null) killDoll(p.id);
        where[p.id] = null;
        cards[p.id].classList.remove("on");
        cards[p.id].style.transform = "";
        drags[p.id].unlock();
      });
      players.clear();
      stopT();
    }
    function setLevel(lv, reset) {
      curLevel = lv;
      if (lv >= 3) {
        mode = "copy";
        resetAll();
        bEar.style.display = "";
        copyRound = 0;
        nextCopy();
        return;
      }
      mode = "free";
      bEar.style.display = "none";
      bEar.classList.remove("go");
      if (reset) resetAll();
      // 1→2단계: 무대에 있던 친구는 그대로 두고 자리만 늘림
      const keep = PLAYERS.filter((p) => where[p.id] != null).map((p) => p.id);
      const n = lv === 1 ? 2 : 4;
      keep.forEach((id, i) => {
        if (i < n) where[id] = i;
      });
      keep.slice(n).forEach((id) => unplace(id, true));
      makeSpots(n);
      refresh();
    }

    /* ---------- 3단계: 따라 해 봐요 ---------- */
    function lockAll(on) {
      PLAYERS.forEach((p) => {
        on ? drags[p.id].lock() : drags[p.id].unlock();
        const d = dolls[p.id];
        if (d && d.drag) on ? d.drag.lock() : d.drag.unlock();
      });
    }
    async function nextCopy() {
      resetAll();
      done = false;
      const my = roundId;
      const k = copyRound < 2 ? 2 : U.pick([2, 3]);
      target = U.sample(PLAYERS.map((p) => p.id), k);
      makeSpots(k, true);
      bEar.classList.remove("go");
      lockAll(true);
      ctx.hint(null);
      earWait = true; // 첫 들려주기 전에는 다시 듣기 단추를 막음
      await Promise.race([ctx.say("잘 들어 보세요!"), ctx.wait(3000)]);
      if (my !== roundId || !ctx._active) return;
      startPreview();
    }
    function startPreview() {
      earWait = false;
      if (!ctx._active || mode !== "copy" || done || preview) return;
      lockAll(true);
      bEar.classList.remove("go");
      const was = T.on;
      preview = new Map();
      // 무대에 이미 있는 친구 소리는 잠깐 쉬고, 들려줄 조합만 2마디
      if (was) {
        const s0 = Math.ceil(T.step / 8) * 8;
        target.forEach((id) => preview.set(id, { start: s0 }));
        preview.endBar = s0 / 8 + 2;
      } else {
        startT();
        target.forEach((id) => preview.set(id, { start: 0 }));
        preview.endBar = 2;
      }
    }
    function endPreview() {
      preview = null;
      if (players.size) {
        const s0 = T.step; // 이 마디부터 무대 친구들 다시 연주
        players.forEach((p) => (p.start = s0));
      } else stopT();
      lockAll(false);
      bEar.classList.add("go");
      ctx.say("똑같이 꾸며 봐요!");
      ctx.hint(() => bEar, "다시 들어 볼까요?");
      checkCopy();
    }
    function checkCopy() {
      if (mode !== "copy" || done || preview) return;
      const on = PLAYERS.filter((p) => where[p.id] != null).map((p) => p.id);
      if (on.length !== target.length || !target.every((id) => on.includes(id))) return;
      done = true;
      lockAll(true);
      bEar.classList.remove("go");
      ctx.hint(null);
      const my = roundId;
      // 한 마디쯤 다 같이 연주하는 걸 들려준 뒤 칭찬
      ctx.after(Math.max(1500, sd() * 8 * 1000 + 600), async () => {
        if (my !== roundId) return;
        muted = true;
        on.forEach((id) => dolls[id] && dolls[id].act && dolls[id].act.happy());
        const ok = await ctx.win({ msg: "와, 똑같아요!", big: (copyRound + 1) % 4 === 0 });
        muted = false;
        if (!ok || my !== roundId) return;
        copyRound++;
        if (ctx.level < 3) return checkLevel();
        nextCopy();
      });
    }
    ctx.tap(bEar, () => {
      if (mode !== "copy" || done || preview || earWait) return;
      earWait = true;
      A.sfx("tap");
      KP.voice.say("잘 들어 보세요!");
      ctx.after(900, startPreview);
    });

    ctx.band = {
      async begin() {
        winning = false;
        muted = false;
        together = 0;
        wins = 0;
        lastWin = 0;
        lastKey = "";
        soloBars = 0;
        nudged = false;
        done = false;
        resetAll();
        const tok = ++ctx.bandTok;
        // 진짜 악기 소리 미리 불러오기 (기다리지 않음 — 그사이엔 합성음)
        SM.load(["drums", "tamb", "xylo", "piano", "guitar", "choir"]).then((r) => (ctx.soundLoad = r));
        room.querySelectorAll(".bnLoad").forEach((e) => e.remove());
        const wait = U.el("div", "bnLoad", KP.E("🎸") + " 준비 중");
        const wt = ctx.after(400, () => room.appendChild(wait));
        cast = castDolls(await KP.dollActor.painted());
        if (tok !== ctx.bandTok || !ctx._active) return;
        paintCards();
        const s = await makeStage();
        ctx.cancel(wt);
        wait.remove();
        if (!s || tok !== ctx.bandTok || !ctx._active) return;
        startLoop(s);
        setLevel(ctx.level, true);
        if (ctx.level < 3) ctx.say("동물 친구를 무대에 올려 봐요!");
      },
      end() {
        ctx.bandTok++;
        roundId++;
        stopT();
        players.clear();
        preview = null;
        muted = false;
        winning = false;
        SM.stopAll();
        PLAYERS.forEach((p) => {
          where[p.id] = null;
          cards[p.id].classList.remove("on");
        });
        dropStage();
      },
      // 점검용
      _state: () => ({
        mode, level: curLevel, on: T.on, step: T.step, players: [...players.keys()], target: [...target], preview: !!preview, together, done,
        dolls: Object.keys(dolls).filter((id) => dolls[id].act && !dolls[id].leaving), spots: spots.length, gl: !!(st && st.gl), timer: !!T.timer,
        where: Object.assign({}, where), sound: SM.stats(), load: ctx.soundLoad || null,
        starts: Object.fromEntries([...players].map(([k, v]) => [k, v.start])),
      }),
      _spots: () => spots.map((s) => ({ u: s.u, v: s.v, x: s.x, z: s.z, h: s.h, px: s.px })),
      _pose: (id) => dolls[id] && dolls[id].act && Object.assign({}, dolls[id].act.play),
      _spotXY: (i) => {
        const r = room.getBoundingClientRect(), s = spots[i];
        return s && s.px ? { x: r.left + s.px.x, y: r.top + s.px.y - s.px.h * 0.4 } : null;
      },
      _dollXY: (id) => {
        const d = dolls[id];
        if (!d || !d.act) return null;
        const r = room.getBoundingClientRect(), b = d.act.box();
        return { x: r.left + b.cx, y: r.top + b.cy };
      },
    };
    ctx.bandTok = 0;
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    return ctx.band.begin();
  },
  stop(ctx) {
    ctx.band.end();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});
