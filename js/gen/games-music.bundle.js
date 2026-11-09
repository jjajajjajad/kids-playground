/* 자동 생성 — tools/build.js 묶음. 고치려면 원본(8개)을 고치고 다시 빌드 */

/* ==== js/games/music/band.js ==== */
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
   🎶 마음대로(어느 단계든): 자리 6개, 문제·칭찬·재촉·단계 넘김 없이 넣고 빼며 계속 듣기 (켜 둔 상태 기억 band:free)
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
        id: "drum", say: "북", img: "drum", at: "belly", dx: 0.02, dy: 0.08, k: 0.62, kit: ["drums"],
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

    // 셋째 칸: 말할 문장 ('신나게'는 녹음이 없어 녹음된 "신나게 놀아요!"로, '잔잔하게'는 녹음 대기 — tools/out/new-voice/band.txt)
    const MOODS = [["fun", "🎉", "신나게 놀아요!"], ["calm", "🌙", "잔잔하게"]];
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
      bJam.classList.toggle("sel", jam);
    }
    // 🎶 마음대로 연주 — 문제 없이 원하는 친구를 넣고 빼며 듣기
    let jam = KP.store.get("band:free", false) === true;
    const gJam = U.el("div", "bnGrp");
    const bJam = U.btn(KP.E("🎶"), "bnB");
    bJam.setAttribute("aria-label", "마음대로 연주");
    gJam.appendChild(bJam);
    ctx.tap(bJam, () => {
      if (winning || preview) return;
      jam = !jam;
      KP.store.set("band:free", jam);
      paintSel();
      U.replay(bJam, "jump");
      A.sfx("select");
      ctx.hint(null);
      setLevel(ctx.level, curLevel >= 3 || mode === "copy");
      if (jam || ctx.level < 3) sayStart(); // 3단계로 돌아가면 문제 문구는 nextCopy 가 말함
    });
    ctl.append(gMood, gTempo, gJam);
    /** 첫 안내 — 말풍선 글자는 그대로, 말은 자연 음성이 있는 문장으로 (카드를 콕 누르면 무대에 올라감) */
    function sayStart() {
      if (jam) ctx.say("마음대로 연주해요!", "동물 친구들을 콕 눌러 보세요!");
      else ctx.say("동물 친구를 무대에 올려 봐요!", "동물 친구를 눌러 봐요!");
    }
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
        if (T.on && !muted && !preview) tasteOf(id); // 다음 마디에 합류하기 전, 누르자마자 그 악기 소리 한 번
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
    /** 맛보기 소리: 그 연주자의 첫 박 하나만 바로 (움직임 없이) */
    function tasteOf(id) {
      try {
        byId[id].play(mood, 0, 0, 0.02, sd(), () => {});
      } catch (e) {}
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
      if (mode !== "free" || winning || muted || jam) return; // 마음대로: 칭찬·재촉 없음
      let n = 0;
      players.forEach((p) => {
        if (p.start <= bar * 8) n++;
      });
      if (n >= 2) together++;
      if (n === 1) {
        soloBars++;
        if (soloBars === 4 && !nudged) {
          nudged = true;
          ctx.tell("다른 친구도 눌러 봐요!");
          ctx.hint(() => benchFirst(), "다른 친구도 눌러 봐요!");
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
      ctx.noStar(); // 맞힐 것이 없는 자유 합주 → 열쇠 별 없음 (축하·단계는 그대로)
      const ok = await ctx.win(U.pick([{ msg: "멋진 합주예요!", say: "멋진 연주예요!" }, { msg: "{부름} 최고!" }]));
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
      if (jam) return;
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
      if (lv >= 3 && !jam) {
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
      const n = jam ? 6 : lv === 1 ? 2 : 4;
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
      ctx.say("똑같이 꾸며 봐요!", "이제 똑같이 눌러 봐요!");
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
        if (jam || ctx.level < 3) sayStart();
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

;

/* ==== js/games/music/drum.js ==== */
/* 신나는 드럼 — 악기 패드 8개 (큰북·작은북·심벌즈·탬버린·트라이앵글·우드블록·봉고·마라카스)
   - 그림(SVG)이 맞을 때마다 출렁, 물결 + 음표, 여러 손가락 동시에 OK
   - 🎵 반주 켜기: 동요 멜로디 + 화음 + 부드러운 박자 (빠르기 3단계), 박자 불빛과 춤추는 곰
     → 반주에 맞춰 치면 칭찬. 화면을 나가면 반주 자동 정지
   - 50번 칠 때마다 축하 (자유 연주라 열쇠 별은 없음)
   - 🎵 박자 놀이(반주 켜면, 3단계): 위 진행 점이 다 차면 '박자 박사' 축하 (친 것의 절반 이상이 박자에 맞았을 때만 열쇠 별)
       1단계 반짝이는 큰북만 8번(판정 ±0.2초) → 2단계 큰북·작은북 번갈아 12번(±0.15초) → 3단계 아무 악기나 박자에 24번(±0.11초)
       반짝임은 박자 반 박 앞부터 켜짐(보고 치면 늦지 않게). 한 박에 한 번만 셈(두 손가락 동시는 1번)
   - 50번 축하는 자유 연주라 단계에도 안 넣음(noLevel)
   - 축하하는 동안엔 패드를 쳐도 소리·횟수 없음 (축하 소리 위에 북소리가 겹치지 않게) */
"use strict";
KP.game({
  id: "drum",
  icon: "🥁",
  name: "신나는 드럼",
  cat: "music",
  levels: 3,
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("drum", `
      .dr{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:0 12px 12px}
      .dr-top{flex:0 0 auto;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}
      .dr-acc{font-size:clamp(18px,2.4vw,24px);min-height:62px;padding:10px 18px}
      .dr-acc .e{font-size:1.5em}
      .dr-acc.on{background:var(--grass);color:#fff;box-shadow:0 7px 0 #1d7f45}
      .dr-tp{width:64px;height:64px;border-radius:50%;background:#fff;box-shadow:var(--shadow);font-size:32px;display:flex;align-items:center;justify-content:center}
      .dr-tp.sel{background:var(--sun);box-shadow:0 6px 0 #d9a000}
      .dr-lights{display:flex;gap:8px;align-items:center}
      .dr-light{width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 3px #d6dcef;transition:background .08s}
      .dr-light.on{background:#ffd23f;box-shadow:0 0 12px 3px rgba(255,210,63,.9)}
      .dr-light.on.one{background:#ff5d73;box-shadow:0 0 12px 3px rgba(255,93,115,.8)}
      .dr-goal{flex:0 0 auto;display:none;gap:5px;flex-wrap:wrap;justify-content:center;align-items:center;min-height:20px;max-width:100%}
      .dr-goal.on{display:flex}
      .dr-goal i{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 3px #d6dcef;transition:transform .2s}
      .dr-goal i.ok{background:#ffd23f;box-shadow:0 0 6px 1px rgba(255,190,40,.8);transform:scale(1.15)}
      .dr-goal.many i{width:12px;height:12px}
      .dr-goal b{font-weight:400;font-size:20px;line-height:1;margin-left:4px}
      /* 박자 놀이 1·2단계: 칠 북이 박자 반 박 앞부터 반짝 (밝기 한 장만 바꿈 — 저가 태블릿) */
      .dr-pad::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;box-shadow:inset 0 0 0 7px #ffd23f,inset 0 0 30px 8px rgba(255,230,120,.9);transition:opacity .12s}
      .dr-pad.beat::after{opacity:1}
      .dr-pad.goal{outline:4px dashed rgba(255,190,40,.7);outline-offset:-4px}
      .dr-dancer{font-size:clamp(46px,7vh,64px);line-height:1;transform-origin:bottom center}
      .dr-dancer.hop{animation:drHop .3s ease-out}
      @keyframes drHop{40%{transform:translateY(-16px) rotate(-8deg) scale(1.05,.95)}80%{transform:rotate(6deg)}}
      .dr-grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:12px}
      .dr-pad{position:relative;border-radius:28px;background:var(--bg);box-shadow:0 8px 0 color-mix(in srgb,var(--bg) 70%,#000);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;touch-action:none;min-height:0;padding:6px}
      .dr-pad svg{width:auto;height:72%;max-width:92%;flex:0 1 auto;min-height:0;overflow:visible;transform-origin:center 70%}
      .dr-pad span{font-size:clamp(16px,2.3vw,24px);color:#3a3a55}
      .dr-pad.pr{transform:translateY(5px);box-shadow:0 3px 0 color-mix(in srgb,var(--bg) 70%,#000)}
      .dr-pad.hit svg{animation:drSquash .28s ease-out}
      @keyframes drSquash{30%{transform:scale(1.12,.88)}65%{transform:scale(.95,1.05)}}
      .dr-pad.shake svg{animation:drShake .35s ease-out}
      @keyframes drShake{20%{transform:rotate(-14deg)}50%{transform:rotate(12deg)}80%{transform:rotate(-6deg)}}
      .dr-wave{position:absolute;left:50%;top:45%;width:60%;aspect-ratio:1;border-radius:50%;border:6px solid rgba(255,255,255,.9);pointer-events:none;animation:drWave .5s ease-out forwards}
      @keyframes drWave{from{transform:translate(-50%,-50%) scale(.3);opacity:1}to{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
      .dr-fly{position:absolute;pointer-events:none;font-size:34px;animation:pnFly3 .9s ease-out forwards;z-index:3}
      @keyframes pnFly3{from{transform:translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(calc(-50% + var(--dx)),-160%) scale(1.1);opacity:0}}
      @media (max-aspect-ratio:1/1){
        .dr-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:9px}
        .dr-pad{border-radius:22px}
        .dr-pad svg{height:66%}
        .dr-pad span{font-size:15px}
        .dr-acc{min-height:54px;padding:8px 12px;font-size:16px}
        .dr-tp{width:56px;height:56px;font-size:28px}
        .dr-top{gap:7px}
        .dr-lights{gap:5px}
        .dr-light{width:14px;height:14px}
        .dr-dancer{display:none}
      }
    `);
    const K = "#4a3a50";
    const PADS = [
      {
        id: "kick", name: "큰북", bg: "#ffd4d9",
        svg: '<svg viewBox="0 0 100 100"><path d="M22 86 L14 98 M78 86 L86 98" stroke="' + K + '" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="50" r="44" fill="#e8394d" stroke="' + K + '" stroke-width="4"/><circle cx="50" cy="50" r="34" fill="#fff6e0" stroke="#d6bf8f" stroke-width="3"/>' +
          [0, 45, 90, 135, 180, 225, 270, 315].map((a) => '<circle cx="' + (50 + Math.cos((a * Math.PI) / 180) * 39) + '" cy="' + (50 + Math.sin((a * Math.PI) / 180) * 39) + '" r="3" fill="#f4f4f4"/>').join("") +
          '<path d="M50 36 L54 46 L65 46 L56 53 L60 64 L50 57 L40 64 L44 53 L35 46 L46 46Z" fill="#ffc531" stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round"/></svg>',
        snd: () => {
          A.kick({ vol: 0.85 });
          A.noise({ dur: 0.1, vol: 0.07, lp: 500 });
        },
      },
      {
        id: "snare", name: "작은북", bg: "#d4e8ff",
        svg: '<svg viewBox="0 0 100 100"><path d="M14 40 V70 Q50 84 86 70 V40" fill="#3f7de0" stroke="' + K + '" stroke-width="4"/><path d="M14 46 L26 66 L38 48 L50 70 L62 48 L74 66 L86 46" fill="none" stroke="#e6eefc" stroke-width="3"/><ellipse cx="50" cy="40" rx="36" ry="12" fill="#fff8ea" stroke="' + K + '" stroke-width="4"/>' +
          '<path d="M30 6 L56 36 M74 8 L46 36" stroke="#c98a4a" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="6" r="4" fill="#e6b47a"/><circle cx="74" cy="8" r="4" fill="#e6b47a"/></svg>',
        snd: () => {
          A.noise({ dur: 0.2, vol: 0.24, bp: 1900, q: 0.7 });
          A.tone(200, { to: 150, dur: 0.11, vol: 0.2, type: "triangle" });
        },
      },
      {
        id: "cymbal", name: "심벌즈", bg: "#fff1c2",
        svg: '<svg viewBox="0 0 100 100"><path d="M50 40 V96 M50 96 L32 100 M50 96 L68 100" stroke="' + K + '" stroke-width="4" stroke-linecap="round"/><ellipse cx="50" cy="38" rx="46" ry="13" fill="#f7c843" stroke="' + K + '" stroke-width="4"/><ellipse cx="50" cy="38" rx="30" ry="8" fill="none" stroke="#e0a91c" stroke-width="3"/><ellipse cx="50" cy="38" rx="14" ry="4" fill="none" stroke="#e0a91c" stroke-width="3"/><ellipse cx="50" cy="35" rx="6" ry="3" fill="#fff4c4"/></svg>',
        snd: () => {
          A.noise({ dur: 1.5, vol: 0.12, hp: 5500 });
          A.noise({ dur: 0.5, vol: 0.06, bp: 3400, q: 2 });
        },
      },
      {
        id: "tamb", name: "탬버린", bg: "#ffe0f0",
        svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#fff3d9" stroke="#d99a4a" stroke-width="12"/><circle cx="50" cy="50" r="44" fill="none" stroke="' + K + '" stroke-width="3"/><circle cx="50" cy="50" r="31" fill="none" stroke="' + K + '" stroke-width="3"/>' +
          [20, 80, 140, 200, 260, 320].map((a) => '<ellipse cx="' + (50 + Math.cos((a * Math.PI) / 180) * 38) + '" cy="' + (50 + Math.sin((a * Math.PI) / 180) * 38) + '" rx="7" ry="5" fill="#ffd23f" stroke="' + K + '" stroke-width="2.5"/>').join("") +
          '<path d="M40 44 Q50 34 60 44 Q50 62 40 44Z" fill="#ff7aa8"/></svg>',
        snd: () => {
          for (let k = 0; k < 4; k++) A.noise({ dur: 0.1, vol: 0.09, hp: 6500, when: k * 0.028 });
          A.tone(5600, { dur: 0.15, vol: 0.018 });
          A.noise({ dur: 0.05, vol: 0.06, bp: 900, q: 1 });
        },
      },
      {
        id: "tri", name: "트라이앵글", bg: "#e4f7ff",
        svg: '<svg viewBox="0 0 100 100"><path d="M50 4 V16" stroke="' + K + '" stroke-width="3"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#9fb0c8" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#e6edf7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M70 40 L96 22" stroke="#9fb0c8" stroke-width="5" stroke-linecap="round"/></svg>',
        snd: () => {
          const f = A.hz("E6");
          A.note(f, { inst: "bell", dur: 1.8, vol: 0.12 });
          A.tone(f * 2.76, { dur: 1.3, vol: 0.03 });
          A.tone(f * 5.4, { dur: 0.7, vol: 0.012 });
        },
      },
      {
        id: "wood", name: "우드블록", bg: "#f5e1c8",
        svg: '<svg viewBox="0 0 100 100"><rect x="12" y="34" width="76" height="38" rx="14" fill="#c98a4a" stroke="' + K + '" stroke-width="4"/><rect x="22" y="48" width="56" height="8" rx="4" fill="#6b3f1f"/><path d="M20 40 H80" stroke="#e8b07a" stroke-width="4" stroke-linecap="round"/><path d="M62 4 L46 32" stroke="#a46a35" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="6" r="6" fill="#e05a5a" stroke="' + K + '" stroke-width="2.5"/></svg>',
        snd: () => {
          A.tone(980, { to: 880, dur: 0.07, vol: 0.32 });
          A.tone(1960, { dur: 0.04, vol: 0.06 });
        },
      },
      {
        id: "bongo", name: "봉고", bg: "#e2f7d9",
        svg: '<svg viewBox="0 0 100 100"><path d="M8 42 L14 88 H44 L50 42Z" fill="#d9773f" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/><ellipse cx="29" cy="42" rx="21" ry="7" fill="#fff3d9" stroke="' + K + '" stroke-width="4"/>' +
          '<path d="M52 48 L57 88 H85 L90 48Z" fill="#e8a13f" stroke="' + K + '" stroke-width="4" stroke-linejoin="round"/><ellipse cx="71" cy="48" rx="19" ry="6" fill="#fff3d9" stroke="' + K + '" stroke-width="4"/><path d="M44 66 H57" stroke="' + K + '" stroke-width="5"/></svg>',
        snd: () => {
          const hi = Math.random() < 0.5;
          A.tone(hi ? 420 : 300, { to: hi ? 360 : 240, dur: 0.2, vol: 0.32 });
          A.noise({ dur: 0.03, vol: 0.05, bp: 1500 });
        },
      },
      {
        id: "maraca", name: "마라카스", bg: "#efe2ff",
        svg: '<svg viewBox="0 0 100 100"><path d="M40 60 L22 96 M60 60 L78 96" stroke="#a46a35" stroke-width="7" stroke-linecap="round"/><ellipse cx="38" cy="38" rx="20" ry="26" fill="#ff8a3d" stroke="' + K + '" stroke-width="4" transform="rotate(20 38 38)"/><ellipse cx="64" cy="36" rx="20" ry="26" fill="#3cc45a" stroke="' + K + '" stroke-width="4" transform="rotate(-20 64 36)"/>' +
          '<circle cx="34" cy="30" r="4" fill="#ffe14d"/><circle cx="42" cy="44" r="4" fill="#ffe14d"/><circle cx="66" cy="28" r="4" fill="#fff"/><circle cx="60" cy="44" r="4" fill="#fff"/></svg>',
        snd: () => {
          A.noise({ dur: 0.12, vol: 0.13, hp: 4500, attack: 0.02 });
          A.noise({ dur: 0.08, vol: 0.08, hp: 5000, when: 0.09 });
        },
        shake: true,
      },
    ];

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "dr");
    const top = U.el("div", "dr-top");
    const bAcc = U.btn(KP.E("🎵") + " 반주 켜기", "btn dr-acc");
    const TEMPOS = [["🐢", 84, "느리게"], ["🚶", 104, "보통"], ["🐇", 126, "빠르게"]];
    let tempo = KP.store.get("drum:tempo", 104);
    const tpBtns = TEMPOS.map(([em, bpm, name]) => {
      const b = U.btn(KP.E(em), "dr-tp");
      ctx.tap(b, () => {
        tempo = bpm;
        KP.store.set("drum:tempo", bpm);
        tpBtns.forEach((x, i) => x.classList.toggle("sel", TEMPOS[i][1] === tempo));
        U.replay(b, "jump");
        A.sfx("select");
        KP.voice.say(name);
        if (acc) acc.bpm = bpm;
      });
      return b;
    });
    tpBtns.forEach((x, i) => x.classList.toggle("sel", TEMPOS[i][1] === tempo));
    const lights = U.el("div", "dr-lights");
    const lightEls = [0, 1, 2, 3].map((i) => {
      const l = U.el("i", "dr-light" + (i === 0 ? " one" : ""));
      lights.appendChild(l);
      return l;
    });
    const dancer = U.el("div", "dr-dancer", KP.E("🐻"));
    top.append(bAcc, ...tpBtns, lights, dancer);
    const goalEl = U.el("div", "dr-goal");
    const grid = U.el("div", "dr-grid");
    wrap.append(top, goalEl, grid);
    ctx.body.appendChild(wrap);

    let hits = 0,
      onBeat = 0,
      accHits = 0; // 반주 켜고 친 횟수 (박자 맞힌 비율 계산)
    const padEls = PADS.map((p, pi) => {
      const el = U.el("div", "dr-pad", p.svg + "<span>" + p.name + "</span>");
      el.style.setProperty("--bg", p.bg);
      el.addEventListener("pointerdown", async (e) => {
        e.preventDefault();
        A.unlock();
        if (KP.celebrating) return; // 축하 중엔 쉬기
        p.snd();
        el.classList.add("pr");
        setTimeout(() => el.classList.remove("pr"), 110);
        U.replay(el, p.shake || p.id === "tamb" || p.id === "tri" ? "shake" : "hit");
        const w = U.el("div", "dr-wave");
        el.appendChild(w);
        setTimeout(() => w.remove(), 520);
        const r = el.getBoundingClientRect();
        const f = U.el("div", "dr-fly", KP.E(U.pick(["🎵", "🎶", "⭐"])));
        f.style.left = e.clientX - r.left + "px";
        f.style.top = e.clientY - r.top + "px";
        f.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "px");
        el.appendChild(f);
        setTimeout(() => f.remove(), 900);
        U.replay(dancer, "hop");
        ctx.hint(null);
        if (acc) beatHint();
        hits++;
        if (checkBeat(pi)) return;
        if (hits % 50 === 0) {
          ctx.noStar ? ctx.noStar() : (ctx._fewChoice = true); // 아무렇게나 50번 두드려도 되는 자유 연주 → 열쇠 별 제외
          await ctx.win({ msg: "멋진 드러머!", noLevel: true }); // 박자 놀이 단계에도 안 넣음
        }
      });
      grid.appendChild(el);
      return el;
    });

    /* ---------- 반주 (미리 예약하는 박자 스케줄러) ---------- */
    const ACC_SONGS = ["twinkle", "bears", "airplane", "schoolbell", "butterfly"];
    let acc = null,
      accT = 0;
    const CH = { C: ["C3", ["C4", "E4", "G4"]], F: ["F2", ["F3", "A3", "C4"]], G: ["G2", ["G3", "B3", "D4"]] };
    function chordOf(n) {
      if (!n || n === "R") return "C";
      const pc = A.midiOf(n) % 12;
      return [11, 2].includes(pc) ? "G" : [5, 9].includes(pc) ? "F" : "C";
    }
    function startAcc() {
      const c = A.ctx();
      if (!c) return;
      const t = c.currentTime + 0.12;
      acc = { bpm: tempo, beatT: t, beat: 0, melT: t, songI: 0, noteI: 0, mel: [], times: [] };
      onBeat = 0;
      accHits = 0;
      renderGoal();
      bAcc.classList.add("on");
      bAcc.innerHTML = KP.E("⏹️") + " 반주 끄기";
      accT = ctx.every(40, tick);
      tick();
    }
    function stopAcc() {
      if (accT) ctx.cancel(accT);
      accT = 0;
      acc = null;
      bAcc.classList.remove("on");
      bAcc.innerHTML = KP.E("🎵") + " 반주 켜기";
      lightEls.forEach((l) => l.classList.remove("on"));
      padEls.forEach((el) => el.classList.remove("beat", "goal"));
      goalEl.classList.remove("on");
      ctx.hint(null);
    }
    /* ---------- 박자 놀이 단계 ---------- */
    const BEAT = {
      win: [0.2, 0.15, 0.11],
      goal: [8, 12, 24],
    };
    const lvI = () => Math.max(0, Math.min(2, (ctx.level || 1) - 1));
    /** 이 박(0~3)에 칠 패드: 1단계 큰북(0)만, 2단계 큰북·작은북(1) 번갈아, 3단계 아무거나(-1) */
    const padFor = (p) => (lvI() === 0 ? 0 : lvI() === 1 ? (p % 2 === 0 ? 0 : 1) : -1);
    function renderGoal() {
      const n = BEAT.goal[lvI()];
      goalEl.innerHTML = "";
      for (let k = 0; k < n; k++) goalEl.appendChild(U.el("i", k < onBeat ? "ok" : ""));
      goalEl.appendChild(U.el("b", "", KP.E("🏆")));
      goalEl.classList.toggle("many", n > 12);
      goalEl.classList.add("on");
      padEls.forEach((el, i) => el.classList.toggle("goal", lvI() === 0 ? i === 0 : lvI() === 1 ? i < 2 : false));
      beatHint();
    }
    /** 1·2단계: 오래 안 치면 칠 북을 가리킴 (정답 패드라 그 판은 열쇠 별 없음). 칠 때마다 지워지므로 다시 검 */
    function beatHint() {
      if (acc && lvI() < 2) ctx.hint(() => padEls[0], "노래에 맞춰 눌러 봐요!", { answer: true });
      else ctx.hint(null);
    }
    function goalHelp() {
      const L = lvI();
      ctx.say(L === 0 ? "반짝이는 큰북을 쿵! 쿵! 쳐요 🥁" : L === 1 ? "반짝이는 북을 쳐요! 큰북 쿵, 작은북 짝!" : "박자에 맞춰 아무 악기나 쳐요!", "반주에 맞춰 쿵짝쿵짝 쳐 봐요!");
    }
    function tick() {
      if (!acc) return;
      const c = A.ctx(),
        now = c.currentTime,
        ahead = now + 0.2,
        spb = 60 / acc.bpm;
      // 축하 동안은 반주를 쉼(축하 징글과 겹치지 않게) → 끝나면 쉰 만큼 박자 단위로 밀어서 이어 감
      if (KP.celebrating) {
        acc.paused = true;
        return;
      }
      if (acc.paused) {
        acc.paused = false;
        const lag = now + 0.12 - Math.min(acc.beatT, acc.melT);
        if (lag > 0) {
          const sh = Math.ceil(lag / spb) * spb;
          acc.beatT += sh;
          acc.melT += sh;
          acc.mel.forEach((m) => (m[0] += sh));
          acc.times = [];
        }
      }
      // 멜로디 (오르골)
      while (acc.melT < ahead) {
        const song = A.SONGS[ACC_SONGS[acc.songI % ACC_SONGS.length]].notes;
        if (acc.noteI >= song.length) {
          acc.songI++;
          acc.noteI = 0;
          acc.melT += spb * 2;
          continue;
        }
        const [n, b] = song[acc.noteI++];
        if (n !== "R") A.note(A.hz(n) * 2, { inst: "bell", dur: Math.max(0.3, b * spb * 1.3), vol: 0.09, when: acc.melT - now });
        acc.mel.push([acc.melT, n]);
        acc.melT += b * spb;
      }
      // 박자 · 화음 · 베이스
      while (acc.beatT < ahead) {
        const w = acc.beatT - now,
          pos = acc.beat % 4;
        let cur = null;
        for (const m of acc.mel) if (m[0] <= acc.beatT + 0.01) cur = m[1];
        const ch = CH[chordOf(cur)];
        A.noise({ dur: 0.04, vol: 0.03, hp: 8000, when: w });
        if (pos === 0 || pos === 2) {
          A.kick({ vol: 0.22, when: w });
          A.note(ch[0], { inst: "bass", dur: spb * 1.5, vol: 0.16, when: w });
          ch[1].forEach((n) => A.note(n, { inst: "pad", dur: spb * 1.8, vol: 0.03, when: w }));
        } else A.noise({ dur: 0.07, vol: 0.04, bp: 1600, q: 0.8, when: w });
        acc.times.push({ t: acc.beatT, p: pos });
        const p = pos,
          want = padFor(pos);
        if (want >= 0) {
          // 칠 북은 반 박 앞부터 박자 조금 뒤까지 반짝 (보고 치면 딱 맞게)
          const el = padEls[want],
            me = acc;
          ctx.after(Math.max(0, (w - spb * 0.5) * 1000), () => acc === me && !KP.celebrating && el.classList.add("beat"));
          ctx.after(Math.max(0, (w + Math.min(0.18, spb * 0.3)) * 1000), () => el.classList.remove("beat"));
        }
        ctx.after(Math.max(0, w * 1000), () => {
          lightEls.forEach((l, i) => l.classList.toggle("on", i === p));
          U.replay(dancer, "hop");
        });
        acc.beat++;
        acc.beatT += spb;
      }
      if (acc.mel.length > 64) acc.mel.splice(0, acc.mel.length - 64);
      if (acc.times.length > 16) acc.times.splice(0, acc.times.length - 16);
    }
    /** 반주 박자에 맞았는지(단계별 칠 북·판정 창) — 진행 점이 다 차면 축하(축하했으면 true) */
    function checkBeat(pi) {
      if (!acc) return false;
      accHits++;
      const now = A.ctx().currentTime,
        L = lvI(),
        goal = BEAT.goal[L];
      const near = acc.times.find((x) => !x.used && Math.abs(x.t - now) < BEAT.win[L]);
      if (!near) return false;
      const want = padFor(near.p);
      if (want >= 0 && pi !== want) return false; // 다른 악기는 소리만 (틀림 없음)
      near.used = true; // 한 박에 한 번만
      onBeat++;
      const d = goalEl.children[onBeat - 1];
      if (d) {
        d.classList.add("ok");
        U.replay(d, "pop");
      }
      if (onBeat >= goal) {
        // 마구 두드려도 몇 번은 박자에 걸림 → 친 것의 절반 이상이 박자에 맞았을 때만 열쇠 별
        if (onBeat / Math.max(1, accHits) < 0.5) ctx.noStar ? ctx.noStar() : (ctx._fewChoice = true);
        onBeat = 0;
        accHits = 0;
        hits = 0; // 바로 뒤 '50번' 축하와 겹치지 않게
        padEls.forEach((el) => el.classList.remove("beat"));
        const was = ctx.level;
        ctx.win({ msg: "박자 박사!", say: "박자에 딱딱 맞아요!" }).then((ok) => {
          if (!ok || !acc) return;
          renderGoal(); // 단계가 바뀌었으면 진행 점·칠 북도 새로
          if (ctx.level !== was) goalHelp();
        });
        return true;
      }
      if (onBeat === Math.floor(goal / 2) && goal >= 12) {
        KP.voice.say(U.pick(["박자에 딱딱 맞아요!", "쿵짝쿵짝 잘한다!", "우와, 진짜 드러머 같아요!"]));
        A.sfx("sparkle");
      }
    }
    ctx.tap(bAcc, () => {
      if (acc) {
        stopAcc();
        A.sfx("slide");
        KP.voice.say("반주를 껐어요");
      } else {
        startAcc();
        goalHelp();
      }
    });
    ctx.stopAcc = stopAcc;
  },
  start(ctx) {
    ctx.stopAcc();
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.say("악기를 두드려 봐요! 반주를 켜면 노래에 맞춰 칠 수 있어요.");
    ctx.hint(() => ctx.body.querySelector(".dr-pad"), "악기를 두드려 봐요!");
  },
  stop(ctx) {
    ctx.stopAcc();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});

;

/* ==== js/games/music/inst.js ==== */
/* 악기 소리 맞추기 — 소리를 듣고 어떤 악기인지 그림 고르기
   - 악기 11가지: 북·피아노·나팔·기타·종·바이올린·피리·마라카스·실로폰·트라이앵글·탬버린
     (모두 Web Audio 합성으로 악기 특징을 살림 — 나팔은 부드러운 금관 느낌)
   - 진짜 악기 녹음(KP.sampler: 북·피아노·실로폰·기타·탬버린·마라카스)을 불러오면 그 소리로, 못 불러오면 합성음
   - 🔊 다시 듣기, 단계: 보기 3 / 3 / 4개
     (1·2단계는 소리가 비슷한 악기끼리 — 종·트라이앵글·실로폰 / 마라카스·탬버린 / 나팔·피리·바이올린 — 같이 나오지 않게,
      3단계는 같은 묶음 최대 2개까지 — 비슷한 소리 셋이 한 문제에 몰리지 않게)
   - 정답 악기는 최근 3문제와 겹치지 않게. 문제 시작 뒤 🔊를 먼저 누르면 예약된 자동 듣기는 취소(소리 두 번 겹침 방지) */
"use strict";
KP.game({
  id: "inst",
  icon: "🔔",
  name: "악기 소리 맞추기",
  cat: "music",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio,
      SM = KP.sampler;
    KP.css("inst", `
      .in-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
      .in-listen{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff;border-radius:50%;width:clamp(150px,26vh,230px);height:clamp(150px,26vh,230px);justify-content:center;position:relative;
        box-shadow:0 10px 0 color-mix(in srgb,var(--cat) 45%,#fff),0 0 0 10px color-mix(in srgb,var(--cat) 18%,transparent);font-size:clamp(17px,2.4vw,22px);color:var(--cat)}
      .in-listen .e{font-size:clamp(64px,11vh,100px)}
      .in-listen:active{transform:translateY(5px)}
      .in-listen.play{animation:inPulse .5s ease-in-out infinite}
      @keyframes inPulse{50%{transform:scale(1.08)}}
      /* 커지는 바깥 고리(10px→22px)는 따로 한 장(::after, 10~22px 띠)에 그려 두고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
      .in-listen::after{content:"";position:absolute;inset:-10px;border-radius:50%;pointer-events:none;opacity:0;box-shadow:0 0 0 12px color-mix(in srgb,var(--cat) 12%,transparent)}
      .in-listen.play::after{animation:inPulseR .5s ease-in-out infinite}
      @keyframes inPulseR{50%{opacity:1}}
      .in-ch{flex-direction:column;gap:4px;min-width:clamp(120px,19vw,190px);min-height:clamp(120px,19vw,190px)}
      .in-ch .e,.in-ch svg{width:clamp(64px,10vw,104px);height:clamp(64px,10vw,104px)}
      .in-ch span{font-size:clamp(17px,2.2vw,22px)}
      .in-ch.play{animation:wig .4s 2}
      @media (max-aspect-ratio:1/1){ .in-ch{min-width:clamp(120px,40vw,170px);min-height:clamp(110px,16vh,150px)} .in-ch .e,.in-ch svg{width:64px;height:64px} }
      @media (orientation:landscape) and (max-height:500px){
        .in-stage{padding-top:10px}
        .in-listen{width:104px;height:104px;gap:2px;font-size:15px;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 45%,#fff),0 0 0 6px color-mix(in srgb,var(--cat) 18%,transparent)}
        .in-listen .e{font-size:46px}
        .in-listen::after{inset:-6px;box-shadow:0 0 0 16px color-mix(in srgb,var(--cat) 12%,transparent)}
        .in-ch{min-width:96px;min-height:96px}
        .in-ch .e,.in-ch svg{width:56px;height:56px}
        .in-ch span{font-size:15px}
        .qAns{padding:4px 12px 10px}
      }
    `);
    const K = "#4a3a50";
    const SVG = {
      xylo:
        '<svg viewBox="0 0 100 100"><path d="M8 34 L92 26 M8 74 L92 82" stroke="#a8662e" stroke-width="6" stroke-linecap="round"/>' +
        ["#ff4f5e", "#ff9a2e", "#f5c400", "#3cc45a", "#22b5d8", "#8a5cf0"].map((c, i) => '<rect x="' + (12 + i * 13.5) + '" y="' + (18 + i * 3) + '" width="11" height="' + (70 - i * 6) + '" rx="4" fill="' + c + '" stroke="' + K + '" stroke-width="2.5"/>').join("") +
        '<path d="M60 96 L84 62" stroke="#b07a45" stroke-width="4" stroke-linecap="round"/><circle cx="86" cy="58" r="7" fill="#ff5d73" stroke="' + K + '" stroke-width="2.5"/></svg>',
      tri: '<svg viewBox="0 0 100 100"><path d="M50 4 V16" stroke="' + K + '" stroke-width="3"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#9fb0c8" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 18 L12 84 H88 L56 18" fill="none" stroke="#e6edf7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M70 40 L96 22" stroke="#9fb0c8" stroke-width="5" stroke-linecap="round"/></svg>',
      tamb:
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#fff3d9" stroke="#d99a4a" stroke-width="12"/><circle cx="50" cy="50" r="44" fill="none" stroke="' + K + '" stroke-width="3"/><circle cx="50" cy="50" r="31" fill="none" stroke="' + K + '" stroke-width="3"/>' +
        [20, 80, 140, 200, 260, 320].map((a) => '<ellipse cx="' + (50 + Math.cos((a * Math.PI) / 180) * 38) + '" cy="' + (50 + Math.sin((a * Math.PI) / 180) * 38) + '" rx="7" ry="5" fill="#ffd23f" stroke="' + K + '" stroke-width="2.5"/>').join("") +
        '<path d="M40 44 Q50 34 60 44 Q50 62 40 44Z" fill="#ff7aa8"/></svg>',
    };
    const piano = (n, when = 0) => {
      const f = A.hz(n);
      A.tone(f, { type: "triangle", dur: 1.4, vol: 0.2, attack: 0.004, when });
      A.tone(f * 2, { dur: 0.9, vol: 0.07, when });
      A.tone(f * 3, { dur: 0.5, vol: 0.035, when });
      A.noise({ dur: 0.025, vol: 0.025, lp: 2500, when });
    };
    const brass = (n, dur, when) => {
      const f = A.hz(n);
      A.note(f, { inst: "pad", dur, vol: 0.2, when });
      A.tone(f * 2, { type: "triangle", attack: 0.04, dur: dur + 0.1, vol: 0.07, when });
      A.tone(f * 3, { attack: 0.06, dur: dur * 0.8, vol: 0.035, when });
    };
    // 진짜 악기 녹음이 있으면 그걸로 (sampler.js 의 폴백 방식: 성공하면 true, 아니면 합성음)
    const ok = (k) => SM && SM.ok(k);
    const INSTS = [
      { id: "drum", g: "hit", name: "북", pic: KP.E("🥁"), snd: () => [0, 0.42, 0.84, 1.05].forEach((w, i) => {
        if (ok("drums")) { SM.hit("drums", "kick", { when: w, vol: 0.85 }); if (i > 1) SM.hit("drums", "snare", { when: w, vol: 0.4 }); return; }
        A.kick({ vol: 0.75, when: w }); if (i > 1) A.noise({ dur: 0.15, vol: 0.12, bp: 1600, when: w });
      }), len: 1.6 },
      { id: "piano", g: "keys", name: "피아노", pic: KP.E("🎹"), snd: () => ["C4", "E4", "G4", "C5", "G4", "C5"].forEach((n, i) => (ok("piano") ? SM.note("piano", n, { when: i * 0.22, vol: 0.3, dur: 0.9 }) : piano(n, i * 0.22))), len: 2 },
      { id: "trumpet", g: "long", name: "나팔", pic: KP.E("🎺"), snd: () => [["G4", 0.16], ["G4", 0.16], ["G4", 0.16], ["C5", 0.8]].reduce((t, [n, d]) => (brass(n, d, t), t + d + 0.06), 0), len: 1.8 },
      { id: "guitar", g: "pluck", name: "기타", pic: KP.E("🎸"), snd: () => [0, 0.6].forEach((w) => ["C3", "E3", "G3", "C4", "E4"].forEach((n, i) => (ok("guitar") ? SM.note("guitar", n, { when: w + i * 0.035, vol: 0.3, dur: 1.3 }) : A.note(n, { inst: "pluck", dur: 1.4, vol: 0.2, when: w + i * 0.035 })))), len: 2 },
      { id: "bell", g: "metal", name: "종", pic: KP.E("🔔"), snd: () => { A.note("G4", { inst: "bell", dur: 1.6, vol: 0.32 }); A.note("E4", { inst: "bell", dur: 1.8, vol: 0.32, when: 0.7 }); }, len: 2.2 },
      { id: "violin", g: "long", name: "바이올린", pic: KP.E("🎻"), snd: () => [["E4", 0.6], ["G4", 0.6], ["C5", 1.1]].reduce((t, [n, d]) => { const f = A.hz(n); A.note(f, { inst: "pad", dur: d, vol: 0.2, when: t }); A.tone(f * 2, { type: "triangle", attack: 0.15, dur: d + 0.2, vol: 0.05, when: t }); A.tone(f * 3, { attack: 0.2, dur: d, vol: 0.02, when: t }); return t + d; }, 0), len: 2.4 },
      { id: "flute", g: "long", name: "피리", pic: KP.E("🪈"), snd: () => [["G5", 0.3], ["E5", 0.3], ["C5", 0.6], ["D5", 0.3], ["E5", 0.6]].reduce((t, [n, d]) => { A.note(n, { inst: "soft", dur: d + 0.15, vol: 0.24, when: t }); A.noise({ dur: d, vol: 0.02, bp: A.hz(n), q: 4, when: t }); return t + d; }, 0), len: 2.1 },
      { id: "maraca", g: "shake", name: "마라카스", pic: KP.E("🪇"), snd: () => [0, 0.2, 0.4, 0.5, 0.8, 1.0, 1.2, 1.3].forEach((w, i) => (ok("shaker") ? SM.hit("shaker", i % 2 ? "up" : "down", { when: w, vol: 0.5 }) : A.noise({ dur: 0.1, vol: 0.13, hp: 4500, attack: 0.02, when: w }))), len: 1.6 },
      { id: "xylo", g: "metal", name: "실로폰", pic: SVG.xylo, snd: () => ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"].forEach((n, i) => { if (ok("xylo")) return void SM.note("xylo", n, { when: i * 0.11, vol: 0.45 }); const f = A.hz(n); A.note(f, { inst: "marimba", dur: 0.5, vol: 0.28, when: i * 0.11 }); A.tone(f * 4.1, { dur: 0.06, vol: 0.03, when: i * 0.11 }); }), len: 1.4 },
      { id: "tri", g: "metal", name: "트라이앵글", pic: SVG.tri, snd: () => [0, 0.8].forEach((w) => { const f = A.hz("E6"); A.note(f, { inst: "bell", dur: 1.6, vol: 0.14, when: w }); A.tone(f * 2.76, { dur: 1.2, vol: 0.035, when: w }); }), len: 2.2 },
      { id: "tamb", g: "shake", name: "탬버린", pic: SVG.tamb, snd: () => [0, 0.3, 0.6, 0.75, 0.9].forEach((w) => { if (ok("tamb")) return void SM.hit("tamb", "hit", { when: w, vol: 0.5 }); for (let k = 0; k < 4; k++) A.noise({ dur: 0.1, vol: 0.09, hp: 6500, when: w + k * 0.025 }); A.noise({ dur: 0.05, vol: 0.06, bp: 900, when: w }); }), len: 1.5 },
    ];

    const stage = U.el("div", "in-stage");
    const bListen = U.btn(KP.E("🔊") + "<span>다시 듣기</span>", "in-listen");
    stage.appendChild(bListen);
    const ans = U.el("div", "qAns");
    ctx.body.append(stage, ans);
    let answer = null,
      recent = [], // 최근 정답 3개 (같은 악기가 금방 또 나오지 않게)
      playT = 0,
      autoT = 0, // 문제 시작 뒤 자동 듣기 예약
      replayT = 0,
      btns = [];
    function playIt(inst) {
      inst = inst || answer;
      if (!inst) return;
      inst.snd();
      bListen.classList.add("play");
      ctx.cancel(playT);
      playT = ctx.after(inst.len * 1000, () => bListen.classList.remove("play"));
    }
    ctx.tap(bListen, () => {
      ctx.cancel(autoT); // 자동 듣기 전에 먼저 눌렀으면 자동 듣기는 취소 (두 번 겹쳐 울리지 않게)
      U.replay(bListen, "pop");
      playIt();
    });
    /** 보기 고르기: 1·2단계는 소리 묶음(g)이 서로 다른 악기만 (비슷한 소리끼리 헷갈리지 않게), 3단계는 같은 묶음 최대 2개 */
    function pickOpts(n) {
      const cap = ctx.level >= 3 ? 2 : 1,
        used = { [answer.g]: 1 },
        out = [];
      for (const x of U.shuffle(INSTS.filter((x) => x !== answer))) {
        if (out.length >= n - 1) break;
        if ((used[x.g] || 0) >= cap) continue;
        used[x.g] = (used[x.g] || 0) + 1;
        out.push(x);
      }
      return out;
    }
    function next() {
      const n = [3, 3, 4][ctx.level - 1];
      ctx.cancel(replayT);
      answer = U.pick(INSTS.filter((x) => !recent.includes(x)));
      recent.push(answer);
      if (recent.length > 3) recent.shift();
      const opts = U.shuffle([answer, ...pickOpts(n)]);
      ans.innerHTML = "";
      btns = ctx.choices(ans, opts, {
        cls: "in-ch",
        render: (v) => v.pic + "<span>" + v.name + "</span>",
        right: (v) => v === answer,
        wrongMsg: (v) => U.josa(v.name, "이/가") + " 아니에요. 다시 들어 볼까요?",
        onRight: async (v, b) => {
          ctx.hint(null);
          ctx.cancel(autoT);
          ctx.cancel(replayT); // 오답 뒤 예약해 둔 '다시 들려주기'가 정답 소리와 겹치지 않게
          b.classList.add("play");
          playIt(v);
          ctx.score.add();
          ctx.round = (ctx.round || 0) + 1;
          await ctx.wait(Math.min(1400, v.len * 1000));
          const big = ctx.round % 5 === 0;
          const ok = await ctx.win({ big, msg: big ? "소리 박사!" : U.josa(v.name, "이/가") + " 맞아요!" });
          if (ok) next();
        },
      });
      // 틀리면 정답 소리를 다시 들려주기 — 연달아 틀려도 예약은 하나만 (소리가 겹치지 않게)
      btns.forEach((b) => {
        if (!b.dataset.right)
          b.addEventListener("click", () => {
            if (KP.celebrating) return;
            ctx.cancel(replayT);
            ctx.cancel(autoT);
            replayT = ctx.after(1700, () => !KP.celebrating && playIt());
          });
      });
      ctx.say("무슨 악기 소리일까요? 잘 들어 보세요!");
      ctx.cancel(autoT);
      autoT = ctx.after(2300, () => playIt());
      ctx.hint(() => btns.find((b) => b.dataset.right), "소리를 듣고 악기 그림을 눌러요!");
    }
    ctx.next = next;
  },
  start(ctx) {
    // 진짜 악기 녹음 미리 불러오기 (기다리지 않음 — 그사이엔 합성음)
    if (KP.sampler) KP.sampler.load(["drums", "piano", "xylo", "guitar", "tamb", "shaker"]);
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.round = 0;
    ctx.next();
  },
  stop(ctx) {
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});

;

/* ==== js/games/music/musicbox.js ==== */
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

;

/* ==== js/games/music/piano.js ==== */
/* 피아노 — 도~도 무지개 건반 8개 (+ 작은 검은 건반, 켜고 끄기)
   - 악기: 피아노 / 오르골 / 마림바
   - 누르면 건반 위로 음표가 날아오르고 동물 합창단이 들썩
   - 손가락을 건반 위로 쓸면 주르륵(글리산도), 여러 손가락 동시에 OK
   - 🌟 따라 치기: 동요를 고르면 다음에 칠 건반이 반짝 → 누르면 다음 음 → 한 곡 완성 시 축하
     (1단계: 앞 두 소절, 2단계: 절반, 3단계: 끝까지)
     틀린 건반: 부드러운 '톡' + 칠 건반이 들썩 (벌 없음). 쓸기(글리산도)로 지나간 건반은 소리만 나고 진행엔 안 셈
     (쓸어서 정답을 지나가는 것 방지) — 따라 치기는 콕 눌러야 다음으로. 틀린 횟수가 많으면 열쇠 별 없음
   - 폰 세로 따라 치기: 노래에 필요한 건반까지만 보여 넓게(비행기·나비야·곰 세 마리 5개, 반짝반짝·학교종 6개). 마음대로 칠 땐 8개 */
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
      .pn-ib{font-size:clamp(16px,2.2vw,21px);padding:8px 14px;min-height:62px}
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
      .pn-bk{position:absolute;top:10px;height:52%;width:calc((100% - 20px) / var(--kn,8) * .58);margin-left:calc((100% - 20px) / var(--kn,8) * -.29);border-radius:0 0 12px 12px;background:linear-gradient(#3a3550,#1f1b30);box-shadow:0 5px 0 #0c0a14;z-index:2;touch-action:none;display:none}
      .pn-keys.black .pn-bk{display:block}
      .pn-keys .pn-key.off,.pn-keys.black .pn-bk.off{display:none}
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
        .pn-ib{padding:6px 10px;min-height:58px;font-size:15px}
        .pn-ib span{display:none}
        .pn-song span{display:inline}
        .pn-top{gap:6px}
        .pn-ib{flex:0 0 auto;min-width:48px}
        .pn-song{padding:6px 12px}
        .pn-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
        .pn-choir{font-size:min(8.5vh,14vw);gap:clamp(4px,1.6vw,14px)}
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
      k.style.left = "calc(10px + (100% - 20px) / var(--kn,8) * " + pos + ")";
      k.dataset.pos = pos;
      k.dataset.n = n;
      keysEl.appendChild(k);
      return k;
    });
    const picker = U.el("div", "pn-pick");
    wrap.append(top, choir, prog, keysEl);
    ctx.body.append(wrap, picker);
    /** 폰 세로 따라 치기: 칠 음 중 가장 높은 건반까지만 (최소 5개) — 건반 폭 39px → 약 55~67px */
    function fitKeys() {
      const narrow = matchMedia("(max-aspect-ratio:1/1) and (max-width:560px)").matches;
      let n = 8;
      if (narrow && follow) n = Math.max(5, ...follow.notes.map(([x]) => KEYS.findIndex((k) => k[0] === x) + 1));
      keysEl.style.setProperty("--kn", n);
      keyEls.forEach((k, i) => k.classList.toggle("off", i >= n));
      blackEls.forEach((k) => k.classList.toggle("off", +k.dataset.pos >= n));
    }
    addEventListener("resize", () => ctx._active && fitKeys());
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
    function press(k, slid) {
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
      if (follow) followPress(i, n, slid);
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
        press(k, true);
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
    let playGen = 0; // 노래 완성 마무리(다시 들려주기 → 축하) 세대 — 새 노래를 고르면 옛 마무리 취소
    function startFollow(key) {
      playGen++;
      const song = A.SONGS[key];
      const ph = phrasesOf(song.notes);
      const lv = ctx.level;
      const notes = song.notes.filter(([n]) => n !== "R").slice(0, partLen(song.notes, lv));
      follow = { key, notes, idx: 0, wrong: 0 };
      dots.innerHTML = "";
      notes.forEach(() => dots.appendChild(U.el("span", "pn-dot")));
      prog.classList.add("on");
      picker.classList.remove("show");
      fitKeys();
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
    async function followPress(i, n, slid) {
      const want = follow.notes[follow.idx];
      if (!want || KP.celebrating) return;
      if (slid) return; // 쓸면서 지나간 건반은 소리만
      if (n !== want[0]) {
        follow.wrong++;
        ctx._softMiss = (ctx._softMiss || 0) + 1; // 마구 눌러 끝내면 열쇠 별 없음 (1번은 봐줌)
        const k = keyEls.find((x) => x.dataset.n === want[0]);
        A.sfx("tap2"); // "아니야, 이쪽" — 부드러운 신호만
        if (k) U.replay(k, "bump");
        if (follow.wrong % 3 === 0) KP.voice.say("반짝이는 건반을 눌러요!");
        if (k) ctx.hint(() => k, "반짝이는 건반을 눌러요!"); // 누를 때 지운 힌트를 다시 걸기 (헷갈려 멈춘 아이에게 도움)
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
      // 친 노래를 들려주되 앞부분만(최대 약 2.5초) — 곡 전체를 다 들려주면 축하까지 너무 오래 기다림
      const back = [];
      let sum = 0;
      for (const nb of f.notes) {
        if (sum + nb[1] * 0.3 > 2.5 && back.length >= 5) break;
        back.push(nb);
        sum += nb[1] * 0.3;
      }
      const gen = ++playGen;
      const len = A.melody(back, { beat: 0.3, inst: "bell", octave: 1, vol: 0.2, when: 0.9 });
      back.forEach(([, b], k) => ctx.after(900 + k * 300, () => gen === playGen && U.replay(singers[k % singers.length], "sing")));
      await ctx.wait(900 + len * 1000);
      if (gen !== playGen) return; // 그사이 새 노래를 골랐으면 옛 축하는 건너뜀
      prog.classList.remove("on");
      fitKeys(); // 다 쳤으면 건반 8개로 (마음대로 치기)
      const ok = await ctx.win({ big: true, msg: song.name + " 완성!" });
      if (!ok) return;
      ctx.say("또 다른 노래를 쳐 볼까요? 별 단추를 눌러요!");
      ctx.hint(() => bSong, "별 단추를 누르면 노래를 고를 수 있어요!");
    }
    function stopFollow() {
      follow = null;
      fitKeys();
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

;

/* ==== js/games/music/realpiano.js ==== */
/* 진짜 피아노 — 집에 있는 진짜 피아노(키보드·실로폰)를 치면 아이패드가 마이크로 듣고 알아채요
   - 🎵 마음대로 쳐요: 친 음이 화면 건반에 무지개로 켜짐 (마이크가 잘 듣는지 확인하는 놀이 겸)
   - ✋ 손 자리 따라 치기: 오른손 엄지(1)를 도에 — 반짝이는 건반과 손가락 번호를 보고 동요 따라 치기
   - 🦜 메아리 놀이: 앱이 들려준 음을 따라 치기 (1단계 1음 → 3단계 3음). 칠 때는 반짝임 없이 들은 대로 — 1단계만 틀리면 칠 건반이 반짝
   소리 알아채기: McLeod(MPM) 음높이 찾기 · 100~1100Hz만(여러 건반을 쾅 치면 생기는 낮은 허상음 제외)
     · 같은 음 3번 연속(약 50ms)일 때만 인정 · 옥타브는 따지지 않고 음이름(도·레·미)만 맞으면 정답
     · 피아노 음정이 조금 어긋나 있어도 맞추도록 평균 어긋남을 천천히 학습
     · 앱이 말하거나 소리 내는 동안은 듣지 않음(앱 소리를 아이 소리로 착각하지 않게)
   마이크를 못 쓰면 화면 건반을 눌러서 똑같이 놀 수 있음
   단계는 놀이마다 따로 셈(KP.store "rp:lvl:<놀이>") — 쉬운 놀이에서 오른 단계로 메아리가 갑자기 어려워지지 않게
   틀린 건반: 부드러운 '톡' + 칠 건반이 들썩(따라 치기·노래 게임), 메아리는 살짝 흔들림. 오래 멈추면 손가락이 칠 건반을 가리킴
   폰 세로: 칠 음이 도~솔 안이면 건반 5개, 라까지면 6개, 시까지면 7개만 크게
   마이크 없이(화면 건반) 고르면 놀이 고르기에서 노래 게임·메아리를 앞에 두고 '화면 건반 추천' 표시 (피아노 놀이와 다른 재미) */
"use strict";
(function () {
  /** 단계를 따로 세는 놀이 4가지 (rp:lvl:<놀이>) */
  const RP_MODES = ["free", "follow", "game", "echo"];
  /** McLeod pitch method — 한 덩어리 소리에서 기본 주파수 찾기 (없으면 null) */
  function mpm(buf, sr, fmin, fmax) {
    const N = buf.length;
    const maxLag = Math.min(N >> 1, Math.ceil(sr / fmin) + 2),
      minLag = Math.max(2, Math.floor(sr / fmax));
    const d = new Float32Array(maxLag + 2);
    for (let t = 0; t <= maxLag + 1; t++) {
      let ac = 0,
        m = 0;
      for (let i = 0, n = N - t; i < n; i++) {
        const a = buf[i],
          b = buf[i + t];
        ac += a * b;
        m += a * a + b * b;
      }
      d[t] = m > 0 ? (2 * ac) / m : 0;
    }
    let t = 1;
    while (t < maxLag && d[t] > 0) t++;
    const peaks = [];
    let mx = -1;
    for (; t <= maxLag; t++) {
      if (d[t] > 0) {
        if (mx < 0 || d[t] > d[mx]) mx = t;
      } else if (mx >= 0) {
        peaks.push(mx);
        mx = -1;
      }
    }
    if (mx >= 0 && mx < maxLag) peaks.push(mx);
    if (!peaks.length) return null;
    let hi = 0;
    for (const p of peaks) hi = Math.max(hi, d[p]);
    if (hi < 0.5) return null;
    const p = peaks.find((q) => d[q] >= 0.9 * hi);
    const a = d[p - 1],
      b = d[p],
      c = d[p + 1];
    const den = a - 2 * b + c;
    const tau = p + (den ? (a - c) / (2 * den) : 0);
    if (tau < minLag || tau > sr / fmin) return null;
    return { f: sr / tau, clarity: b };
  }
  KP.pitchMPM = mpm; // 점검용

  /* ---------- 귀(소리 → 음이름) : 화면과 떨어진 순수 계산 — 점검 스크립트에서도 그대로 씀 ----------
     ① MPM 으로 소리 높이를 찾아 음이름으로 (3번 연속 같아야 인정)
     ② 칠 음을 아는 놀이(따라 치기·메아리·노래 게임)에서는 "기대 음 확인"도 함께:
        그 음의 배음(1~6배)이 소리 안에 다른 음보다 뚜렷하면 인정 (2번 연속)
        → 약지로 파를 칠 때 옆 건반(미·솔)이 같이 눌려 높이가 섞여도 알아챔 */
  const HW = [1, 1, 0.8, 0.6, 0.5, 0.4];
  function makeEar(opt) {
    const E = { floor: 0.002, minSince: 1, lastPc: null, cand: null, silent: 0, armed: false, tune: (opt && opt.tune) || 0, cents: [], onTune: opt && opt.onTune };
    let win = null,
      re = null,
      im = null,
      mag = null,
      rev = null,
      cosT = null,
      sinT = null;
    /** 크기 N(2의 거듭제곱) FFT → mag[k] (Hann 창) — 배음 216개를 하나씩 계산하는 것보다 약 20배 가벼움 */
    function spectrum(buf) {
      const N = buf.length;
      if (!win || win.length !== N) {
        win = new Float32Array(N);
        re = new Float32Array(N);
        im = new Float32Array(N);
        mag = new Float32Array(N >> 1);
        rev = new Uint32Array(N);
        cosT = new Float32Array(N >> 1);
        sinT = new Float32Array(N >> 1);
        const bits = Math.round(Math.log2(N));
        for (let i = 0; i < N; i++) {
          win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
          let r = 0;
          for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
          rev[i] = r;
        }
        for (let i = 0; i < N >> 1; i++) {
          cosT[i] = Math.cos((2 * Math.PI * i) / N);
          sinT[i] = -Math.sin((2 * Math.PI * i) / N);
        }
      }
      for (let i = 0; i < N; i++) {
        re[rev[i]] = buf[i] * win[i];
        im[i] = 0;
      }
      for (let size = 2; size <= N; size <<= 1) {
        const half = size >> 1,
          step = N / size;
        for (let i = 0; i < N; i += size)
          for (let j = 0, k = 0; j < half; j++, k += step) {
            const a = i + j,
              b = a + half;
            const tr = re[b] * cosT[k] - im[b] * sinT[k],
              ti = re[b] * sinT[k] + im[b] * cosT[k];
            re[b] = re[a] - tr;
            im[b] = im[a] - ti;
            re[a] += tr;
            im[a] += ti;
          }
      }
      for (let k = 0; k < N >> 1; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / N;
      return mag;
    }
    /** 음이름 12개 각각의 뚜렷함 (도3~시5 중 가장 큰 옥타브, 배음 1~6배) */
    E.salience = function (buf, sr) {
      const N = buf.length,
        M = spectrum(buf),
        df = sr / N,
        top = M.length - 2;
      const at = (f) => {
        const x = f / df,
          k = Math.round(x);
        if (k < 1 || k > top) return 0;
        return Math.max(M[k], 0.7 * Math.max(M[k - 1], M[k + 1])); // 약간 어긋난 배음도 잡게
      };
      const S = new Float32Array(12);
      for (let pc = 0; pc < 12; pc++) {
        let best = 0;
        for (let oct = 3; oct <= 5; oct++) {
          const f0 = 440 * Math.pow(2, (12 * (oct + 1) + pc - 69 + E.tune / 100) / 12);
          let sum = 0;
          for (let h = 1; h <= 6; h++) {
            const f = f0 * h * Math.sqrt(1 + 0.0004 * h * h); // 피아노 배음은 살짝 높음
            if (f > 4200) break;
            sum += HW[h - 1] * at(f);
          }
          if (sum > best) best = sum;
        }
        S[pc] = best;
      }
      return S;
    };
    function learn(c) {
      E.cents.push(c);
      if (E.cents.length < 8) return;
      const s = E.cents.slice().sort((a, b) => a - b);
      const med = s[s.length >> 1];
      E.cents = [];
      E.tune = Math.max(-60, Math.min(60, E.tune + med * 0.5));
      if (E.onTune) E.onTune(E.tune);
    }
    /** 소리 한 덩어리(최근 4096개) → { rms, f, clarity, pc(새로 친 음이면), via } */
    E.feed = function (buf, sr, stepMs, deaf, expect) {
      const N = buf.length,
        n2 = Math.min(2048, N),
        b2 = buf.subarray(N - n2);
      let e = 0;
      for (let i = 0; i < n2; i++) e += b2[i] * b2[i];
      const rms = Math.sqrt(e / n2);
      const out = { rms };
      E.floor = Math.min(E.floor * 1.004 + 1e-6, Math.max(rms, 0.0005)); // 주변 소음(천천히 오르고 바로 내림)
      const gate = Math.max(0.004, E.floor * 3.5);
      if (rms < gate) {
        E.silent += stepMs;
        if (E.silent > 140) E.lastPc = null;
        E.cand = null;
        E.minSince = Math.min(E.minSince, rms);
        return out;
      }
      E.silent = 0;
      if (deaf) {
        E.cand = null;
        E.minSince = rms; // 앱 소리·울림 중 — 새로 쳐야 셈
        return out;
      }
      if (rms > Math.max(E.minSince * 1.8, gate * 1.4)) E.armed = true; // 새로 친 소리(세기가 확 커짐)
      E.minSince = Math.min(E.minSince, rms);
      let pc = null,
        dev = 0,
        via = "";
      const r = mpm(b2, sr, 100, 1100);
      if (r) {
        out.f = r.f;
        out.clarity = r.clarity;
        if (r.clarity >= 0.8) {
          const m = 69 + 12 * Math.log2(r.f / 440) - E.tune / 100;
          const rm = Math.round(m);
          if (Math.abs(m - rm) <= 0.42) {
            pc = ((rm % 12) + 12) % 12;
            dev = m - rm;
            via = "pitch";
          }
        }
      }
      if (expect == null && pc != null) {
        // 자유 연주: 높이로 찾은 음이 실제 배음 분포와 안 맞으면(두 건반이 섞인 경우) 가장 뚜렷한 음으로 바로잡기
        const S = E.salience(buf, sr);
        let mx = 0,
          arg = pc;
        for (let k = 0; k < 12; k++)
          if (S[k] > mx) {
            mx = S[k];
            arg = k;
          }
        if (S[pc] < 0.5 * mx) {
          pc = arg;
          via = "sal";
        }
      }
      if (expect != null && pc !== expect) {
        const S = E.salience(buf, sr);
        let mx = 0;
        for (let k = 0; k < 12; k++) mx = Math.max(mx, S[k]);
        out.sal = S[expect] / (mx || 1);
        if (S[expect] >= 0.6 * mx && S[expect] >= rms * 0.12) {
          pc = expect;
          via = "expect";
        }
      }
      if (pc == null) {
        E.cand = null;
        return out;
      }
      if (E.cand && E.cand.pc === pc) {
        E.cand.n++;
        if (via === "pitch") {
          E.cand.k++;
          E.cand.c += dev;
        }
      } else E.cand = { pc, n: 1, k: via === "pitch" ? 1 : 0, c: via === "pitch" ? dev : 0 };
      const need = pc === expect ? 2 : 3;
      if (E.cand.n >= need && (pc !== E.lastPc || E.armed)) {
        E.lastPc = pc;
        E.armed = false;
        E.minSince = rms;
        if (E.cand.k >= 2) learn((E.cand.c / E.cand.k) * 100);
        out.pc = pc;
        out.via = via;
      }
      return out;
    };
    return E;
  }
  KP.pianoEar = makeEar; // 점검용

  const KEYS = [
    ["C4", "도", "#ff4f5e", 0], ["D4", "레", "#ff9a2e", 2], ["E4", "미", "#f2c200", 4], ["F4", "파", "#3cc45a", 5],
    ["G4", "솔", "#2fb6e8", 7], ["A4", "라", "#3f6cf0", 9], ["B4", "시", "#8a5cf0", 11], ["C5", "도", "#ff5fae", 0],
  ];
  const FINGER = ["엄지", "검지", "가운데 손가락", "약지", "새끼손가락"];
  const SONGS = [
    // 도레미 계단은 단계마다 따로: 1단계 올라가기(5) → 2단계 올라갔다 내려오기(9) → 3단계 + 건너뛰기 미솔미도(13)
    {
      id: "steps", em: "🪜", name: "도레미 계단",
      notes: ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4"],
      lv: [
        ["C4", "D4", "E4", "F4", "G4"],
        ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4"],
        ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4", "E4", "G4", "E4", "C4"],
      ],
    },
    { id: "airplane", em: "✈️", name: "비행기", song: "airplane" },
    { id: "butterfly", em: "🦋", name: "나비야", song: "butterfly" },
    { id: "bears", em: "🐻", name: "곰 세 마리", song: "bears" },
    { id: "twinkle", em: "⭐", name: "반짝반짝 작은 별", song: "twinkle" },
    { id: "schoolbell", em: "🔔", name: "학교종", song: "schoolbell" },
  ];

  KP.game({
    id: "realpiano",
    icon: "🎼",
    name: "진짜 피아노",
    cat: "music",
    levels: 3,
    setup(ctx) {
      const U = KP.u,
        A = KP.audio,
        self = this;
      KP.css("realpiano", `
        .rp{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:0 12px 12px;position:relative}
        .rp-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap}
        .rp-ear{display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:6px 14px 6px 8px;box-shadow:0 4px 0 rgba(47,58,102,.12);font-size:clamp(15px,2vw,19px);color:#555c7d}
        .rp-ear .e{font-size:30px;line-height:1}
        .rp-ear.on .e{animation:rpEar 1.2s ease-in-out infinite}
        @keyframes rpEar{50%{transform:scale(1.12) rotate(-6deg)}}
        .rp-meter{width:clamp(70px,12vw,140px);height:12px;border-radius:8px;background:#e9ecf5;overflow:hidden}
        .rp-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3cc45a,#f2c200,#ff4f5e);transition:width .08s}
        .rp-mid{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
        .rp-big{font-size:clamp(64px,15vh,150px);line-height:1;color:#c9cede;text-shadow:0 6px 0 rgba(0,0,0,.08);min-height:1em}
        .rp-big.pop{animation:rpPop .45s cubic-bezier(.3,1.6,.5,1)}
        @keyframes rpPop{0%{transform:scale(.5)}60%{transform:scale(1.15)}}
        .rp-sub{font-size:clamp(17px,2.4vw,24px);color:#555c7d;text-align:center;min-height:1.3em}
        .rp-dots{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;max-width:min(760px,86vw)}
        .rp-dots i{width:clamp(14px,2vw,20px);height:clamp(14px,2vw,20px);border-radius:50%;background:#e3e7f1}
        .rp-dots i.ok{background:var(--c)}
        .rp-dots i.now{box-shadow:0 0 0 3px var(--ink);background:#fff}
        .rp-kb{flex:0 0 auto;height:clamp(150px,36vh,300px);display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:42% 58%;column-gap:6px;position:relative}
        .rp-palm{grid-row:1;grid-column:1/6;align-self:start;height:44%;margin:0 6%;border-radius:40px 40px 18px 18px;background:#ffe2c6;border:3px solid #e9b98f;position:relative;z-index:1;pointer-events:none}
        .rp-fing{grid-row:1;align-self:end;justify-self:center;width:62%;border-radius:12px 12px 40px 40px;background:#ffe2c6;border:3px solid #e9b98f;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;position:relative;z-index:2;pointer-events:none;transition:transform .15s}
        .rp-fing b{width:clamp(26px,4.2vw,40px);height:clamp(26px,4.2vw,40px);border-radius:50%;background:var(--c);color:#fff;display:flex;align-items:center;justify-content:center;font-size:clamp(17px,2.6vw,26px);font-weight:400;box-shadow:0 2px 0 rgba(0,0,0,.15)}
        .rp-fing.go{transform:translateY(10%);border-color:var(--c);box-shadow:0 0 0 4px var(--c)}
        .rp-fing.go b{animation:rpPop .7s infinite}
        .rp-kb.nohand .rp-palm,.rp-kb.nohand .rp-fing{visibility:hidden}
        .rp-key{grid-row:2;border-radius:0 0 18px 18px;background:#fff;box-shadow:0 6px 0 #d5d9e6,inset 0 -10px 0 color-mix(in srgb,var(--c) 22%,#fff);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:10px;font-size:clamp(18px,3vw,30px);color:var(--c);position:relative;isolation:isolate;transition:background .12s,transform .08s}
        .rp-key.lit{background:var(--c);color:#fff;transform:translateY(4px);box-shadow:0 2px 0 #d5d9e6}
        /* 칠할 건반 깜빡임: 옅은 색을 따로 한 장(::after, 글자 아래·아래쪽 색 띠 10px 제외)에 깔고 밝기만 바꿈 (매번 다시 칠하면 저가 태블릿이 버벅임) */
        .rp-key::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;opacity:0;
          background:linear-gradient(to top,transparent 10px,color-mix(in srgb,var(--c) 45%,#fff) 10px)}
        .rp-key.want{animation:none}
        .rp-key.want::after{animation:rpWant 1s ease-in-out infinite}
        @keyframes rpWant{50%{opacity:1}}
        .rp-key.heard{box-shadow:0 6px 0 #d5d9e6,inset 0 0 0 5px color-mix(in srgb,var(--c) 50%,#fff)}
        .rp-ov{position:absolute;inset:0;z-index:20;background:rgba(244,247,255,.97);display:none;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2vh,18px);padding:12px 16px;text-align:center}
        .rp-ov.show{display:flex;animation:enter .3s}
        .rp-ov h3{font-weight:400;font-size:clamp(22px,3.4vw,32px);color:var(--ink)}
        .rp-ov p{font-size:clamp(15px,2vw,19px);color:#555c7d;max-width:640px;line-height:1.45}
        .rp-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;max-width:900px}
        .rp-card{background:#fff;border-radius:22px;padding:14px 8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:6px;font-size:clamp(17px,2.3vw,23px);min-height:clamp(120px,22vh,190px);justify-content:center;animation:cardIn .4s backwards;animation-delay:calc(var(--i) * 50ms)}
        .rp-card .e{font-size:clamp(46px,8vh,72px);line-height:1}
        .rp-card small{font-size:.7em;color:#7a809c}
        .rp-card:active{transform:scale(.96)}
        .rp-cards.songs{grid-template-columns:repeat(3,minmax(0,1fr))}
        .rp-cards.four{grid-template-columns:repeat(4,minmax(0,1fr))}
        /* 마이크 없이: 화면 건반으로 더 재미있는 노래 게임·메아리를 앞에 + 노란 테두리·추천 표시 */
        .rp-card .tag{display:none;white-space:nowrap;font-size:.62em;background:#ffd23f;color:#5a4300;border-radius:999px;padding:2px 10px}
        .rp-cards.nomic .rp-card.rec{order:-1;box-shadow:0 0 0 4px #ffd23f,var(--shadow)}
        .rp-cards.nomic .rp-card.rec .tag{display:block}
        .rp-cards.nomic .rp-card:not(.rec){opacity:.85}
        .rp-ov .rp-tip{display:none}
        .rp-ov.nomic .rp-tip{display:block}
        .rp-diag{font-size:13px;color:#9aa0bb;min-height:1.2em}
        .rp.game .rp-mid{display:none}
        .rp.game .rp-kb{grid-template-rows:0 1fr;height:clamp(110px,22vh,200px);row-gap:0}
        .rp.game .rp-palm,.rp.game .rp-fing{display:none}
        .rp.game .rp-key{border-radius:0 0 18px 18px}
        .rp-lanes{display:none;flex:1;min-height:0;flex-direction:column;gap:6px}
        .rp.game .rp-lanes{display:flex}
        .rp-gbar{flex:0 0 auto;display:flex;align-items:center;gap:10px;justify-content:center}
        .rp-track{position:relative;flex:1;max-width:620px;height:16px;border-radius:10px;background:#e3e7f1}
        .rp-track i{position:absolute;left:0;top:0;bottom:0;border-radius:10px;background:linear-gradient(90deg,#ffd23f,#ff9a2e);width:0;transition:width .3s}
        .rp-runner{position:absolute;top:50%;transform:translate(-50%,-62%);font-size:34px;line-height:1;transition:left .3s;left:0}
        .rp-goal{font-size:30px;line-height:1}
        .rp-score{font-size:clamp(18px,2.4vw,24px);color:var(--ink);min-width:3.5em;text-align:center}
        .rp-listen{font-size:clamp(14px,1.8vw,17px);padding:6px 12px;min-height:44px}
        .rp-field{flex:1;min-height:0;display:grid;grid-template-columns:repeat(8,1fr);column-gap:6px;position:relative;border-bottom:5px solid #ffd23f;border-radius:14px 14px 0 0}
        .rp-lane{position:relative;overflow:hidden;background:repeating-linear-gradient(180deg,rgba(255,255,255,.55) 0 2px,transparent 2px 46px);border-radius:12px 12px 0 0}
        .rp-lane:nth-child(odd){background-color:rgba(255,255,255,.35)}
        .rp-blk{position:absolute;left:4%;right:4%;bottom:0;border-radius:14px;background:var(--c);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:6px;gap:2px;font-size:clamp(15px,2.2vw,22px);box-shadow:0 4px 0 rgba(0,0,0,.12);will-change:transform}
        .rp-blk b{width:clamp(22px,3.2vw,30px);height:clamp(22px,3.2vw,30px);border-radius:50%;background:#fff;color:var(--c);display:flex;align-items:center;justify-content:center;font-size:.85em;font-weight:400}
        /* 기다리는 블록 반짝: 흰 테두리·빛·밝아짐(흰 막 20%)을 따로 한 장(::after)에 그려 두고 밝기만 바꿈 (filter·그림자를 매번 다시 칠하면 저가 태블릿이 버벅임) */
        .rp-blk::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;background:rgba(255,255,255,.2);box-shadow:0 0 0 5px #fff,0 0 18px 6px var(--c)}
        .rp-blk.wait{animation:none}
        .rp-blk.wait::after{animation:rpWait .6s ease-in-out infinite}
        @keyframes rpWait{50%{opacity:1}}
        .rp-blk.hit{animation:rpHit .45s ease-out forwards}
        @keyframes rpHit{to{transform:translateY(0) scale(1.4);opacity:0}}
        .rp-pop{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:clamp(28px,4vw,40px);pointer-events:none;animation:rpFly .8s ease-out forwards;z-index:3}
        @keyframes rpFly{to{transform:translate(-50%,-140px) scale(1.3);opacity:0}}
        .rp-cheer{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-size:clamp(26px,4vw,40px);color:var(--ink);background:#fff;border-radius:999px;padding:6px 18px;box-shadow:var(--shadow);pointer-events:none;animation:rpCheer .9s ease-out forwards;z-index:4;white-space:nowrap}
        @keyframes rpCheer{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}25%{transform:translate(-50%,-50%) scale(1.1);opacity:1}100%{transform:translate(-50%,-90%) scale(1);opacity:0}}
        .rp-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        .rp-mini{position:absolute;left:12px;top:0;z-index:5;font-size:clamp(14px,1.8vw,17px);padding:6px 12px;min-height:44px}
        /* 폰 세로: 칠 음이 도~라(6)·시(7)까지면 그만큼만 보여 건반을 넓게 (5건반·6건반·7건반) */
        .rp.kn .rp-kb,.rp.kn .rp-field{grid-template-columns:repeat(var(--kn),1fr)}
        .rp.kn .rp-x{display:none}
        /* 폰 가로(키 낮은 가로 화면) 노래 게임: 위 '마이크 꺼짐' 줄을 빼고 놀이 고르기를 진행 막대 줄 왼쪽에, 건반은 조금 낮게 → 떨어지는 칸을 높게 */
        @media (max-height:500px) and (min-aspect-ratio:1/1){
          .rp.game.nomic .rp-top{height:0;overflow:visible}
          .rp.game.nomic .rp-ear{display:none}
          .rp.game.nomic .rp-gbar{padding-left:clamp(118px,16vw,150px)}
          .rp.game .rp-kb{height:max(80px,21vh)}
          .rp.game .rp-lanes{gap:4px}
          .rp.game{gap:6px}
        }
        @media (max-aspect-ratio:1/1){
          .rp-cards,.rp-cards.songs,.rp-cards.four{grid-template-columns:repeat(2,minmax(0,1fr))}
          .rp-field{column-gap:4px}
          .rp-kb{height:clamp(170px,30vh,260px);column-gap:4px}
          .rp-key{font-size:clamp(15px,4.4vw,22px);border-radius:0 0 12px 12px}
          .rp-mini{position:static}
        }
      `);

      /* ---------- 화면 ---------- */
      const wrap = U.el("div", "rp");
      const top = U.el("div", "rp-top");
      const bMenu = U.btn(KP.E("📋") + " 놀이 고르기", "btn rp-mini");
      const ear = U.el("div", "rp-ear", '<span class="e">' + KP.E("👂") + '</span><span class="t">마이크 꺼짐</span><span class="rp-meter"><i></i></span>');
      top.append(bMenu, ear);
      const mid = U.el("div", "rp-mid");
      const big = U.el("div", "rp-big", "");
      const sub = U.el("div", "rp-sub", "");
      const dots = U.el("div", "rp-dots");
      const diag = U.el("div", "rp-diag", "");
      mid.append(big, sub, dots, diag);
      // 🎮 노래 게임 화면: 위 진행 막대(토끼가 깃발까지) + 8줄 떨어지는 음표
      const lanes = U.el("div", "rp-lanes");
      const gbar = U.el("div", "rp-gbar");
      const bListen = U.btn(KP.E("👂") + " 들어 보기", "btn rp-listen");
      const track = U.el("div", "rp-track", '<i></i><span class="rp-runner">' + KP.E("🐰") + "</span>");
      const score = U.el("div", "rp-score", KP.E("⭐") + " 0");
      gbar.append(bListen, track, U.el("span", "rp-goal", KP.E("🥕")), score);
      const field = U.el("div", "rp-field");
      const laneEls = KEYS.map((_, i) => field.appendChild(U.el("div", "rp-lane")));
      lanes.append(gbar, field);
      const kb = U.el("div", "rp-kb");
      kb.appendChild(U.el("div", "rp-palm"));
      const fingEls = [0.64, 0.8, 0.92, 0.84, 0.66].map((h, i) => {
        const f = U.el("div", "rp-fing", "<b>" + (i + 1) + "</b>");
        f.style.gridColumn = String(i + 1);
        f.style.height = h * 100 + "%";
        f.style.setProperty("--c", KEYS[i][2]);
        kb.appendChild(f);
        return f;
      });
      const keyEls = KEYS.map(([n, sol, col], i) => {
        const k = U.btn("<span>" + sol + "</span>", "rp-key");
        k.style.gridColumn = String(i + 1);
        k.style.setProperty("--c", col);
        kb.appendChild(k);
        ctx.fast(k, () => {
          // 화면 건반도 됨(마이크 없을 때·엄마 아빠가 도와줄 때) — 이때는 앱이 소리를 냄
          A.unlock();
          playTone(n);
          deafFor(700);
          heard(i, true);
        });
        return k;
      });
      wrap.append(top, mid, lanes, kb);
      ctx.tap(bListen, () => self.gameListen(ctx));
      addEventListener("resize", () => ctx._active && ctx.mode && self.fitKeys(ctx)); // 폰을 돌리면 5건반/8건반 다시
      const ovStart = U.el("div", "rp-ov");
      const ovMenu = U.el("div", "rp-ov");
      const ovSong = U.el("div", "rp-ov");
      ctx.body.append(wrap, ovStart, ovMenu, ovSong);
      Object.assign(ctx, { wrap, ear, big, sub, dots, diag, kb, keyEls, fingEls, ovStart, ovMenu, ovSong, lanes, field, laneEls, track, scoreEl: score, bListen });

      function playTone(n) {
        const f = A.hz(n);
        A.tone(f, { type: "triangle", dur: 1.4, vol: 0.2, attack: 0.004 });
        A.tone(f * 2, { dur: 0.8, vol: 0.06, attack: 0.004 });
        A.tone(f * 3, { dur: 0.4, vol: 0.03, attack: 0.003 });
      }
      ctx.playTone = playTone;

      /* ---------- 마이크 ---------- */
      const M = (ctx.mic = { stream: null, src: null, an: null, buf: null, on: false, deafUntil: 0, tune: Number(KP.store.get("rp:tune", 0)) || 0 });
      if (!Number.isFinite(M.tune) || Math.abs(M.tune) > 60) M.tune = 0;
      function deafFor(ms) {
        M.deafUntil = Math.max(M.deafUntil, performance.now() + ms);
      }
      ctx.deafFor = deafFor;
      /** 앱이 말할 때는 듣지 않기 */
      ctx.talk = (text, bubble = true, spoken) => {
        // spoken: 말풍선 글자와 다르게 말할 문장(없으면 글자 그대로)
        deafFor(60000);
        const p = bubble ? ctx.say(text, spoken || true) : KP.voice.say(spoken || text);
        return Promise.resolve(p).then(() => {
          M.deafUntil = performance.now() + 450;
        });
      };
      ctx.micOn = async function () {
        A.unlock();
        const c = A.ctx();
        if (!c || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return "nosupport";
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
          if (!ctx._active) {
            stream.getTracks().forEach((t) => t.stop());
            return "left";
          }
          M.stream = stream;
          M.src = c.createMediaStreamSource(stream);
          M.an = c.createAnalyser();
          M.an.fftSize = 4096; // 최근 약 0.09초 (높이는 뒤쪽 2048개로, 기대 음 확인은 전체로)
          M.src.connect(M.an); // 스피커로는 보내지 않음
          M.buf = new Float32Array(M.an.fftSize);
          M.on = true;
          M.acc = 0;
          ear.classList.add("on");
          ear.querySelector(".t").textContent = "듣고 있어요";
          if (c.state !== "running") c.resume().catch(() => {});
          listen();
          return "ok";
        } catch (e) {
          return e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "denied" : "error";
        }
      };
      ctx.micOff = function () {
        M.on = false;
        try {
          M.src && M.src.disconnect();
        } catch (e) {}
        if (M.stream) M.stream.getTracks().forEach((t) => t.stop());
        M.stream = M.src = M.an = null;
        ear.classList.remove("on");
        ear.querySelector(".t").textContent = "마이크 꺼짐";
        ear.querySelector("i").style.width = "0";
      };
      const meter = ear.querySelector("i");
      function listen() {
        const E = (M.ear = makeEar({ tune: M.tune, onTune: (t) => KP.store.set("rp:tune", Math.round((M.tune = t))) }));
        ctx.loop((dt) => {
          if (!M.on || !M.an) return false;
          M.acc += dt;
          if (M.acc < 0.016) return; // 약 60번/초
          const step = M.acc * 1000;
          M.acc = 0;
          M.an.getFloatTimeDomainData(M.buf);
          const vb = KP.voice.busy();
          if (vb) M.deafUntil = Math.max(M.deafUntil, performance.now() + 450); // 힌트 말 등 앱 목소리 뒤 울림까지
          const deaf = performance.now() < M.deafUntil || vb;
          const want = ctx.wantIdx >= 0 ? KEYS[ctx.wantIdx][3] : null;
          const r = E.feed(M.buf, M.an.context.sampleRate, step, deaf, want);
          meter.style.width = U.clamp(((20 * Math.log10(r.rms + 1e-9) + 60) / 50) * 100, 0, 100) + "%";
          if (ctx.mode === "free" && r.f) ctx.diag.textContent = Math.round(r.f) + "Hz · 선명도 " + r.clarity.toFixed(2) + (r.sal != null ? " · 기대음 " + Math.round(r.sal * 100) + "%" : "") + " · 조율 " + Math.round(E.tune) + "c";
          if (r.pc != null) onPc(r.pc);
        });
      }
      function onPc(pc) {
        const want = ctx.wantIdx;
        let i = KEYS.findIndex((k) => k[3] === pc);
        if (i < 0) {
          // 검은 건반(반음)
          ctx.sub.textContent = "검은 건반 소리가 들렸어요";
          return;
        }
        if (pc === 0 && want === 7) i = 7;
        heard(i, false);
      }
      /** 음 하나를 알아챔(마이크 또는 화면 건반) */
      function heard(i, byTap) {
        ctx._idleAt = Date.now();
        const k = keyEls[i];
        k.classList.add("lit");
        ctx.after(260, () => k.classList.remove("lit"));
        big.textContent = KEYS[i][1];
        big.style.color = KEYS[i][2];
        U.replay(big, "pop");
        self.onNote(ctx, i, byTap);
      }

      /* ---------- 시작(마이크 켜기) 화면 ---------- */
      ovStart.innerHTML =
        "<h3>" + KP.E("🎹") + " 진짜 피아노를 쳐 볼까요?</h3>" +
        "<p>피아노(키보드·실로폰) 바로 옆에 아이패드를 세워 두고 아래 단추를 눌러 주세요.<br>마이크를 허용하면 아이가 친 음을 알아들어요. 주변이 조용할수록 잘 들어요.</p>";
      const sRow = U.el("div", "rp-row");
      const bMic = U.btn(KP.E("🎤") + " 피아노 소리 듣기 시작", "btn big primary");
      const bNoMic = U.btn(KP.E("👆") + " 마이크 없이 화면 건반으로", "btn");
      sRow.append(bMic, bNoMic);
      const sMsg = U.el("p", "", "");
      ovStart.append(sRow, sMsg);
      ctx.tap(bMic, async () => {
        if (bMic.disabled) return;
        bMic.disabled = true;
        sMsg.textContent = "마이크를 켜는 중…";
        const r = await ctx.micOn();
        bMic.disabled = false;
        if (r === "ok") {
          sMsg.textContent = "";
          ovStart.classList.remove("show");
          self.menu(ctx);
        } else if (r === "denied") sMsg.textContent = "마이크가 허용되지 않았어요. 아이패드 설정 › Safari › 마이크(또는 이 앱)에서 허용한 뒤 다시 눌러 주세요. 화면 건반으로도 놀 수 있어요.";
        else if (r !== "left") sMsg.textContent = "이 기기에서는 마이크를 쓸 수 없어요. 화면 건반으로 놀아요.";
      });
      ctx.tap(bNoMic, () => {
        ovStart.classList.remove("show");
        self.menu(ctx);
      });
      ctx.tap(bMenu, () => {
        A.sfx("open");
        self.menu(ctx);
      });

      /* ---------- 놀이 고르기 ---------- */
      ovMenu.innerHTML = "<h3>" + KP.E("🎼") + " 무엇을 할까요?</h3><p class='rp-tip'>화면 건반으로는 " + KP.E("🎮") + " 노래 게임과 " + KP.E("🦜") + " 메아리 놀이가 특히 재미있어요. 진짜 피아노가 있으면 마이크를 켜 보세요!</p>";
      const cards = (ctx.menuCards = U.el("div", "rp-cards four"));
      [
        ["free", "🎵", "마음대로 쳐요", "친 음이 화면에 반짝"],
        ["follow", "✋", "손 자리 따라 치기", "반짝이는 건반을 쳐요"],
        ["game", "🎮", "노래 게임", "내려오는 음표를 쳐요"],
        ["echo", "🦜", "메아리 놀이", "들은 음을 똑같이"],
      ].forEach(([id, em, name, d], i) => {
        const rec = id === "game" || id === "echo";
        const c = U.btn('<span class="e">' + KP.E(em) + "</span>" + name + "<small>" + d + "</small>" + (rec ? '<span class="tag">화면 건반 추천</span>' : ""), "rp-card" + (rec ? " rec" : ""));
        c.style.setProperty("--i", i);
        ctx.tap(c, () => {
          A.sfx("select");
          ovMenu.classList.remove("show");
          if (id === "follow" || id === "game") self.songMenu(ctx, id);
          else self.begin(ctx, id);
        });
        cards.appendChild(c);
      });
      ovMenu.appendChild(cards);

      /* ---------- 노래 고르기 ---------- */
      ovSong.innerHTML = "<h3>" + KP.E("✋") + " 어떤 노래를 칠까요?</h3><p>오른손 엄지(1번)를 도에 올려요. 손가락 번호와 건반 색이 같아요.</p>";
      const scards = U.el("div", "rp-cards songs");
      SONGS.forEach((s, i) => {
        const c = U.btn('<span class="e">' + KP.E(s.em) + "</span>" + s.name, "rp-card");
        c.style.setProperty("--i", i);
        ctx.tap(c, () => {
          A.sfx("select");
          ovSong.classList.remove("show");
          ctx.song = s;
          self.begin(ctx, ctx.songFor || "follow");
        });
        scards.appendChild(c);
      });
      ovSong.appendChild(scards);
    },

    start(ctx) {
      ctx.mode = null;
      ctx.wantIdx = -1;
      this.clearMarks(ctx);
      ctx.big.textContent = "";
      ctx.sub.textContent = "";
      ctx.dots.innerHTML = "";
      [ctx.ovMenu, ctx.ovSong].forEach((o) => o.classList.remove("show"));
      if (ctx.mic.on) this.menu(ctx);
      else {
        ctx.ovStart.classList.add("show");
        ctx.say("진짜 피아노를 치면 아이패드가 들어요! 엄마 아빠, 아래 단추를 눌러 주세요.");
      }
    },
    stop(ctx) {
      ctx.micOff();
      KP.voice.stop();
    },

    menu(ctx) {
      ctx.mode = null;
      ctx.tok = (ctx.tok || 0) + 1;
      ctx.busy = false;
      ctx.wrap.classList.remove("game", "kn");
      ctx.wantIdx = -1;
      ctx.hint(null);
      this.clearMarks(ctx);
      ctx.ovSong.classList.remove("show");
      ctx.menuCards.classList.toggle("nomic", !ctx.mic.on);
      ctx.ovMenu.classList.toggle("nomic", !ctx.mic.on);
      ctx.ovMenu.classList.add("show");
      ctx.talk("무엇을 할까요? 골라 보세요!");
    },
    songMenu(ctx, target) {
      ctx.songFor = target || "follow";
      ctx.ovSong.querySelector("h3").innerHTML = KP.E(ctx.songFor === "game" ? "🎮" : "✋") + (ctx.songFor === "game" ? " 어떤 노래로 게임할까요?" : " 어떤 노래를 칠까요?");
      ctx.ovSong.classList.add("show");
      ctx.talk("어떤 노래를 칠까요?");
    },
    clearMarks(ctx) {
      ctx.keyEls.forEach((k) => k.classList.remove("want", "heard"));
      ctx.fingEls.forEach((f) => f.classList.remove("go"));
    },
    mark(ctx, i) {
      this.clearMarks(ctx);
      ctx.wantIdx = i;
      if (i < 0) return;
      ctx.keyEls[i].classList.add("want");
      if (i < 5) ctx.fingEls[i].classList.add("go");
    },

    /* ---------- 놀이 시작 ---------- */
    /** 놀이(mode)마다 단계를 따로: 지금 놀이의 단계를 KP.level 에 넣어 두면 ctx.level·win·miss·위 단계 표시가 그대로 씀 */
    syncLv(ctx, mode) {
      const prev = KP.store.get("rp:lvMode", null);
      if (prev === mode) return;
      const lv = KP.level.get("realpiano");
      if (prev) KP.store.set("rp:lvl:" + prev, { lvl: lv.lvl, streak: lv.streak, miss: lv.miss });
      else if (!RP_MODES.some((k) => KP.store.get("rp:lvl:" + k, null))) {
        // 놀이별 단계 이전(처음 한 번): 예전 공용 단계(lv:realpiano)를 네 놀이 모두의 시작 단계로 옮겨 담음 → 기존 사용자가 1단계로 돌아가지 않게
        const old = Math.max(1, Math.min(3, Math.round(+lv.lvl) || 1));
        RP_MODES.forEach((k) => KP.store.set("rp:lvl:" + k, { lvl: old, streak: 0, miss: 0 }));
      }
      const m = Object.assign({ lvl: 1, streak: 0, miss: 0 }, KP.store.get("rp:lvl:" + mode, {}));
      lv.lvl = Math.max(1, Math.min(3, Math.round(+m.lvl) || 1));
      lv.streak = +m.streak || 0;
      lv.miss = +m.miss || 0;
      KP.level.save("realpiano", lv);
      KP.store.set("rp:lvMode", mode);
      ctx._updateLevel();
    },
    /** 폰 세로에서 칠 음이 도~솔(0~4)이면 건반 5개, 라까지면 6개, 시까지면 7개만 (넓게) */
    fitKeys(ctx) {
      const narrow = matchMedia("(max-aspect-ratio:1/1) and (max-width:560px)").matches;
      let max = 7;
      if (ctx.mode === "echo") max = 4;
      else if (ctx.mode === "follow" && ctx.seq) max = Math.max(...ctx.seq);
      else if (ctx.mode === "game" && ctx.g) max = Math.max(...ctx.g.list.map((n) => n.k));
      const n = Math.max(5, max + 1),
        on = narrow && n < 8;
      ctx.wrap.classList.toggle("kn", on);
      ctx.wrap.style.setProperty("--kn", n);
      ctx.keyEls.forEach((k, i) => k.classList.toggle("rp-x", on && i >= n));
      ctx.laneEls.forEach((l, i) => l.classList.toggle("rp-x", on && i >= n));
    },
    /** 틀린 건반: "아니야, 이쪽" — 부드러운 톡 + 칠 건반 들썩 (byTap: 화면 건반 → 열쇠 별 계산에 넣음) */
    nudge(ctx, i, want, byTap) {
      ctx.keyEls[i].classList.add("heard");
      ctx.after(400, () => ctx.keyEls[i].classList.remove("heard"));
      ctx.deafFor(350); // 앱이 낸 '톡'을 아이 소리로 듣지 않게
      KP.audio.sfx("tap2");
      if (want >= 0) KP.u.replay(ctx.keyEls[want], "bump");
      if (byTap) ctx._softMiss = (ctx._softMiss || 0) + 1; // 마구 눌러 끝내면 열쇠 별 없음 (1번은 봐줌)
    },
    begin(ctx, mode) {
      ctx.mode = mode;
      this.syncLv(ctx, mode);
      ctx.tok = (ctx.tok || 0) + 1;
      ctx.big.textContent = "";
      ctx.dots.innerHTML = "";
      ctx.kb.classList.toggle("nohand", mode === "free" || mode === "game");
      ctx.wrap.classList.toggle("game", mode === "game");
      ctx.wrap.classList.toggle("nomic", !ctx.mic.on);
      ctx.diag.textContent = "";
      ctx.busy = false;
      const how = ctx.mic.on ? "진짜 피아노로" : "화면 건반을 눌러서";
      ctx.hint(null);
      if (mode === "free") {
        ctx.count = 0;
        this.fitKeys(ctx);
        this.mark(ctx, -1);
        ctx.sub.textContent = ctx.mic.on ? "피아노를 쳐 보세요. 친 음이 여기 나와요!" : "화면 건반을 눌러 보세요!";
        ctx.talk(how + " 마음대로 쳐 봐요! 친 음이 화면에 반짝여요.");
      } else if (mode === "follow") this.songStart(ctx);
      else if (mode === "game") this.gameStart(ctx, true);
      else this.echoRound(ctx);
    },

    /** 소리를 하나 알아들었을 때 */
    onNote(ctx, i, byTap) {
      if (ctx.mode === "free") {
        ctx.count++;
        ctx.sub.textContent = KEYS[i][1] + "! " + (ctx.count % 10 === 0 ? "우와, " + ctx.count + "개 쳤어요!" : "");
        if (ctx.count % 20 === 0) {
          ctx.noStar ? ctx.noStar() : (ctx._fewChoice = true); // 아무 건반이나 20번 → 자유 연주라 열쇠 별 제외
          this.celebrate(ctx, false);
        }
      } else if (ctx.mode === "follow") this.songHit(ctx, i, byTap);
      else if (ctx.mode === "game") this.gameHit(ctx, i, byTap);
      else if (ctx.mode === "echo") this.echoHit(ctx, i, byTap);
    },
    /** 축하(축하 소리를 아이 소리로 듣지 않게 그동안 귀 닫기) */
    async celebrate(ctx, big, msg, say) {
      ctx.deafFor(60000);
      const ok = await ctx.win({ big, msg, say });
      ctx.mic.deafUntil = performance.now() + 500;
      return ok;
    },

    /* ---------- ✋ 손 자리 따라 치기 ---------- */
    songStart(ctx) {
      const s = ctx.song || SONGS[0];
      if (s.lv) {
        ctx.seq = s.lv[ctx.level - 1].map((n) => KEYS.findIndex((k) => k[0] === n));
        return this.songSeqReady(ctx, s);
      }
      const all = s.notes || KP.audio.SONGS[s.song].notes.filter((n) => n[0] !== "R").map((n) => n[0]);
      const len1 = Math.min(all.length, s.notes ? all.length : 7); // 짧은 연습곡(도레미 계단)은 1단계부터 전체
      const len = ctx.level === 1 ? len1 : ctx.level === 2 ? Math.max(len1, Math.ceil(all.length / 2)) : all.length; // 2단계가 1단계보다 짧아지지 않게
      ctx.seq = all.slice(0, len).map((n) => KEYS.findIndex((k) => k[0] === n));
      this.songSeqReady(ctx, s);
    },
    songSeqReady(ctx, s) {
      ctx.pos = 0;
      this.fitKeys(ctx);
      ctx.dots.innerHTML = "";
      ctx.seq.forEach((k) => {
        const d = document.createElement("i");
        d.style.setProperty("--c", KEYS[k][2]);
        ctx.dots.appendChild(d);
      });
      ctx.big.textContent = "";
      ctx.talk(s.name + "! 오른손 엄지를 빨간 도에 올려요. 반짝이는 건반을 쳐요!");
      this.songShow(ctx);
    },
    songShow(ctx) {
      const i = ctx.seq[ctx.pos];
      this.mark(ctx, i);
      [...ctx.dots.children].forEach((d, k) => {
        d.classList.toggle("ok", k < ctx.pos);
        d.classList.toggle("now", k === ctx.pos);
      });
      ctx.big.textContent = KEYS[i][1];
      ctx.big.style.color = KEYS[i][2];
      ctx.sub.innerHTML = (i < 5 ? KP.E(["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][i]) + " " + KP.u.josa(FINGER[i], "으로/로") + " " : "") + "<b style='color:" + KEYS[i][2] + "'>" + KEYS[i][1] + "</b>";
      // 한참 못 치면 손가락이 칠 건반을 가리키며 "반짝이는 건반을 쳐요!" (마이크로 들은 음도 조작으로 셈 — heard)
      ctx.hint(() => ctx.keyEls[ctx.seq[ctx.pos]], "반짝이는 건반을 쳐요!");
    },
    /** 메아리: 한참 못 치면 다시 들려줌 (아이 소리를 듣는 동안 앱이 계속 떠들지 않게 12초 간격) */
    idle(ctx) {
      const tok = ctx.tok,
        pos = ctx.pos,
        mode = ctx.mode;
      ctx.after(12000, () => {
        if (tok !== ctx.tok || ctx.pos !== pos || ctx.mode !== mode || ctx.busy) return;
        if (mode === "echo") this.echoPlay(ctx); // 다시 들려준 뒤 echoPlay 가 다음 기다림을 잡음
      });
    },
    async songHit(ctx, i, byTap) {
      if (ctx.busy) return;
      const want = ctx.seq[ctx.pos];
      if (i !== want) {
        this.nudge(ctx, i, want, byTap);
        ctx.after(400, () => {
          if (ctx.mode === "follow" && !ctx.busy) {
            ctx.big.textContent = KEYS[want][1];
            ctx.big.style.color = KEYS[want][2];
          }
        });
        return; // 벌은 없음 — 반짝이는 건반을 기다림
      }
      ctx.pos++;
      KP.audio.sfx("tap");
      ctx.deafFor(120);
      if (ctx.pos < ctx.seq.length) return this.songShow(ctx);
      // 한 곡 끝
      ctx.busy = true;
      ctx.hint(null);
      this.mark(ctx, -1);
      [...ctx.dots.children].forEach((d) => d.classList.add("ok"));
      const tok = ctx.tok;
      ctx.round = (ctx.round || 0) + 1;
      const ok = await this.celebrate(ctx, ctx.round % 3 === 0, (ctx.song || SONGS[0]).name + " 완성!");
      ctx.busy = false;
      if (!ok || tok !== ctx.tok) return;
      this.songStart(ctx);
    },

    /* ---------- 🎮 노래 게임 ----------
       8줄로 음표 블록이 내려와 노란 줄에 닿으면 멈춰서 기다림(아이가 칠 때까지 — 놓쳐서 실패하는 일 없음)
       블록 길이 = 음 길이, 블록 안에 손가락 번호. 맞게 치면 별이 톡, 토끼가 당근까지 한 칸씩.
       다 치면 앱이 방금 친 노래를 이어서 들려주고 축하. 👂 들어 보기로 먼저 들어 볼 수도 있음 */
    gameNotes(ctx) {
      const s = ctx.song || SONGS[0];
      const lvNotes = s.lv && s.lv[ctx.level - 1];
      const raw = lvNotes ? lvNotes.map((n, k) => [n, k === lvNotes.length - 1 ? 2 : 1]) : s.notes ? s.notes.map((n) => [n, 1]) : KP.audio.SONGS[s.song].notes;
      const playable = raw.filter((n) => n[0] !== "R").length;
      const want1 = Math.min(playable, s.notes ? playable : 8);
      const want = lvNotes ? playable : ctx.level === 1 ? want1 : ctx.level === 2 ? Math.max(want1, Math.ceil(playable / 2)) : playable; // 2단계 ≥ 1단계
      const list = [];
      let beat = 0;
      for (const [n, b] of raw) {
        if (list.length >= want) break;
        if (n !== "R") list.push({ k: KEYS.findIndex((x) => x[0] === n), beat, len: b });
        beat += b;
      }
      return list;
    },
    gameStart(ctx, intro) {
      const U = KP.u,
        s = ctx.song || SONGS[0];
      ctx.tok = (ctx.tok || 0) + 1;
      const tok = ctx.tok;
      ctx.busy = false;
      ctx.laneEls.forEach((l) => (l.innerHTML = ""));
      const list = this.gameNotes(ctx);
      const g = (ctx.g = { list, pos: 0, cur: -3, bps: [0.75, 0.95, 1.15][ctx.level - 1] || 0.95, score: 0, combo: 0, waitT: 0, ended: false, laneH: 0, ppb: 80 });
      list.forEach((n) => {
        const el = U.el("div", "rp-blk", (n.k < 5 ? "<b>" + (n.k + 1) + "</b>" : "") + "<span>" + KEYS[n.k][1] + "</span>");
        el.style.setProperty("--c", KEYS[n.k][2]);
        el.style.display = "none";
        ctx.laneEls[n.k].appendChild(el);
        n.el = el;
      });
      ctx.scoreEl.innerHTML = KP.E("⭐") + " 0";
      this.fitKeys(ctx);
      this.gameProg(ctx);
      this.mark(ctx, list[0].k);
      ctx.fingEls.forEach((f) => f.classList.remove("go"));
      if (intro) ctx.talk(s.name + "! 음표가 노란 줄에 닿으면 그 건반을 쳐요!");
      ctx.loop((dt) => {
        if (tok !== ctx.tok || ctx.mode !== "game") return false;
        const H = ctx.field.clientHeight;
        if (H !== g.laneH && H > 0) {
          g.laneH = H;
          g.ppb = Math.max(46, H / 3.4); // 한 박 = 줄 높이의 약 1/3.4
          list.forEach((n) => (n.el.style.height = Math.max(42, n.len * g.ppb - 8) + "px"));
        }
        const next = list[g.pos];
        if (!g.ended && next) {
          const target = next.beat;
          if (g.cur < target) {
            // 미리 쳤으면 빨리 따라잡고, 아니면 박자대로 내려옴
            const sp = g.cur < target - 2.5 && g.pos > 0 ? 4 : g.boost ? 5 : 1;
            g.cur = Math.min(target, g.cur + dt * g.bps * sp);
            if (g.cur >= target) g.boost = false;
            g.waitT = 0;
          } else g.waitT += dt;
          next.el.classList.toggle("wait", g.waitT > 0.15);
          if (g.waitT > 11 && !ctx.busy) {
            g.waitT = -4;
            const k = next.k;
            ctx.talk("반짝이는 건반을 쳐요!", false); // 손가락 번호는 블록 안 숫자로 (숫자 문장은 기기 목소리라)
            KP.u.replay(ctx.keyEls[k], "bump");
          }
        }
        for (let i = g.pos; i < list.length; i++) {
          const n = list[i],
            y = (n.beat - g.cur) * g.ppb;
          if (y > g.laneH + 10) {
            n.el.style.display = "none";
            break; // 뒤 음표들은 더 위(안 보임)
          }
          n.el.style.display = "";
          n.el.style.transform = "translateY(" + -Math.max(0, y) + "px)";
        }
      });
    },
    gameProg(ctx) {
      const g = ctx.g,
        f = g.list.length ? g.pos / g.list.length : 0;
      ctx.track.querySelector("i").style.width = f * 100 + "%";
      ctx.track.querySelector(".rp-runner").style.left = f * 100 + "%";
    },
    gameHit(ctx, i, byTap) {
      const U = KP.u,
        g = ctx.g;
      if (!g || g.ended || ctx.busy) return;
      const next = g.list[g.pos];
      if (!next) return;
      if (i !== next.k) {
        this.nudge(ctx, i, next.k, byTap);
        g.combo = 0;
        return;
      }
      const early = next.beat - g.cur; // 몇 박 일찍 쳤는지
      const good = early < 0.6;
      next.el.classList.remove("wait");
      next.el.classList.add("hit");
      const el = next.el;
      ctx.after(500, () => (el.style.visibility = "hidden"));
      const pop = U.el("div", "rp-pop", KP.E(good ? "🌟" : "⭐"));
      ctx.laneEls[i].appendChild(pop);
      ctx.after(850, () => pop.remove());
      if (early > 0) g.boost = true;
      g.pos++;
      g.score++;
      g.combo++;
      ctx.scoreEl.innerHTML = KP.E("⭐") + " " + g.score;
      U.replay(ctx.scoreEl, "pop");
      this.gameProg(ctx);
      KP.audio.sfx("tap");
      ctx.deafFor(120);
      if (g.combo > 0 && g.combo % 5 === 0) this.cheer(ctx, g.combo + "번 연속! " + KP.E("🔥"));
      if (g.pos < g.list.length) {
        this.mark(ctx, g.list[g.pos].k);
        ctx.fingEls.forEach((f) => f.classList.remove("go"));
        return;
      }
      this.gameEnd(ctx);
    },
    cheer(ctx, html) {
      const c = KP.u.el("div", "rp-cheer", html);
      ctx.field.appendChild(c);
      ctx.after(950, () => c.remove());
    },
    /** 노래 들려주기 — 건반이 차례로 켜짐 (그동안은 듣지 않음) */
    async playSong(ctx, list, beatSec) {
      const tok = ctx.tok;
      ctx.deafFor(600000);
      const t0 = performance.now();
      for (const n of list) {
        const at = t0 + n.beat * beatSec * 1000;
        const w = at - performance.now();
        if (w > 0) await ctx.wait(w);
        if (tok !== ctx.tok) return false;
        const k = ctx.keyEls[n.k];
        k.classList.add("lit");
        ctx.playTone(KEYS[n.k][0]);
        ctx.after(Math.min(400, n.len * beatSec * 900), () => k.classList.remove("lit"));
      }
      const last = list[list.length - 1];
      await ctx.wait(last.len * beatSec * 1000 + 400);
      ctx.mic.deafUntil = performance.now() + 900;
      return tok === ctx.tok;
    },
    async gameEnd(ctx) {
      const g = ctx.g,
        s = ctx.song || SONGS[0];
      g.ended = true;
      ctx.busy = true;
      this.mark(ctx, -1);
      const tok = ctx.tok;
      this.cheer(ctx, "다 쳤어요! " + KP.E("🎉"));
      await ctx.wait(900);
      if (tok !== ctx.tok) return;
      await ctx.talk("내가 친 노래를 들어 봐요!", false);
      if (tok !== ctx.tok) return;
      if (!(await this.playSong(ctx, g.list, 0.42))) return;
      ctx.round = (ctx.round || 0) + 1;
      const ok = await this.celebrate(ctx, ctx.round % 2 === 0, s.name + " 완성! 별 " + g.score + "개", s.name + " 완성!");
      if (!ok || tok !== ctx.tok) return;
      this.gameStart(ctx, false);
    },
    async gameListen(ctx) {
      if (ctx.mode !== "game" || ctx.busy) return;
      ctx.busy = true;
      ctx.tok = (ctx.tok || 0) + 1;
      const tok = ctx.tok;
      KP.audio.sfx("open");
      this.mark(ctx, -1);
      ctx.laneEls.forEach((l) => (l.innerHTML = ""));
      const list = this.gameNotes(ctx);
      await ctx.talk("잘 들어 봐요!", false);
      if (tok !== ctx.tok) return;
      if (!(await this.playSong(ctx, list, 0.5))) return;
      ctx.busy = false;
      this.gameStart(ctx, false);
      ctx.talk("이제 쳐 봐요!", false);
    },

    /* ---------- 🦜 메아리 놀이 ---------- */
    echoRound(ctx) {
      const n = ctx.level; // 1~3음
      const pool = ctx.level === 1 ? [0, 2, 4] : [0, 1, 2, 3, 4];
      ctx.seq = [];
      for (let k = 0; k < n; k++) {
        let x;
        do x = KP.u.pick(pool);
        while (ctx.seq.length && x === ctx.seq[ctx.seq.length - 1] && pool.length > 1);
        ctx.seq.push(x);
      }
      ctx.pos = 0;
      ctx.wrong = 0;
      this.fitKeys(ctx);
      ctx.dots.innerHTML = "";
      ctx.seq.forEach(() => ctx.dots.appendChild(document.createElement("i")));
      ctx.big.textContent = "";
      ctx.sub.textContent = "잘 들어요…";
      this.mark(ctx, -1);
      const tok = ctx.tok,
        rt = (ctx.eRound = (ctx.eRound || 0) + 1); // 판 표시 (지난 판의 늦은 echoPlay 막기)
      ctx.busy = true; // 말하는 동안 건반 무시
      ctx.talk(n === 1 ? "잘 듣고 똑같이 쳐 봐요!" : "잘 듣고 " + n + "개를 똑같이 쳐 봐요!", true, n === 1 ? "" : "잘 듣고 " + KP.u.cntWord(n) + " 개를 똑같이 쳐 봐요!").then(() => tok === ctx.tok && rt === ctx.eRound && this.echoPlay(ctx));
    },
    async echoPlay(ctx) {
      const tok = ctx.tok;
      ctx.busy = true;
      ctx.pos = 0;
      ctx.hint(null);
      this.mark(ctx, -1); // 다시 들려줄 때는 반짝이던 힌트 건반도 끄고 '듣기'부터
      [...ctx.dots.children].forEach((d) => d.classList.remove("ok", "now"));
      ctx.deafFor(60000);
      for (const i of ctx.seq) {
        if (tok !== ctx.tok) return;
        const k = ctx.keyEls[i];
        k.classList.add("lit");
        ctx.playTone(KEYS[i][0]);
        await ctx.wait(650);
        k.classList.remove("lit");
        await ctx.wait(150);
      }
      if (tok !== ctx.tok) return;
      ctx.mic.deafUntil = performance.now() + 900; // 남은 울림이 사라질 때까지
      ctx.busy = false;
      ctx.sub.textContent = ctx.mic.on ? "이제 피아노로 따라 쳐요!" : "이제 건반을 눌러요!";
      // 모든 단계: 칠 때는 반짝임 없이 '들은 소리'만으로 (진짜 듣고 따라 치기). 1단계는 틀리면 칠 건반이 반짝(echoHit)
      this.idle(ctx); // 답을 가리키지 않고 12초 뒤 다시 들려줌
    },
    async echoHit(ctx, i, byTap) {
      if (ctx.busy) return;
      const want = ctx.seq[ctx.pos];
      if (i !== want) {
        // 기억해서 고르는 놀이 → 틀리면 ctx.miss (마이크로 잘못 들었을 수도 있으니 마이크는 가벼운 실수로)
        ctx.keyEls[i].classList.add("heard");
        ctx.after(400, () => ctx.keyEls[i].classList.remove("heard"));
        ctx.deafFor(400);
        ctx.miss(ctx.keyEls[i], null, byTap ? {} : { soft: true });
        if (ctx.level === 1) {
          // 1단계 힌트: 틀리면 칠 건반이 반짝 + 오래 멈추면 손가락 (정답을 가리키므로 열쇠 별 없음 — answer)
          this.mark(ctx, want);
          KP.u.replay(ctx.keyEls[want], "bump");
          ctx.hint(() => ctx.keyEls[ctx.seq[ctx.pos]], "반짝이는 건반을 쳐요!", { answer: true });
        }
        ctx.wrong++;
        if (ctx.wrong >= 3) {
          ctx.wrong = 0;
          const tok = ctx.tok,
            rt = ctx.eRound;
          ctx.busy = true; // 말하는 동안 더 틀리거나 끝내지 못하게 (echoPlay 가 끝나면 풀림)
          ctx.talk("한 번 더 들어 봐요!", false).then(() => tok === ctx.tok && rt === ctx.eRound && this.echoPlay(ctx));
        }
        return;
      }
      const d = ctx.dots.children[ctx.pos];
      d.style.setProperty("--c", KEYS[i][2]);
      d.classList.add("ok");
      ctx.pos++;
      KP.audio.sfx("tap");
      ctx.deafFor(120);
      if (ctx.pos < ctx.seq.length) {
        if (ctx.wantIdx >= 0) {
          this.mark(ctx, -1);
          ctx.hint(null);
        } // 힌트로 반짝이던 건반은 맞히면 끔 (다음 음은 다시 들은 대로)
        return;
      }
      ctx.busy = true;
      ctx.hint(null);
      this.mark(ctx, -1);
      const tok = ctx.tok;
      ctx.round = (ctx.round || 0) + 1;
      const ok = await this.celebrate(ctx, ctx.round % 4 === 0, "똑같이 쳤어요!");
      ctx.busy = false;
      if (!ok || tok !== ctx.tok) return;
      this.echoRound(ctx);
    },
  });
})();

;

/* ==== js/games/music/simon.js ==== */
/* 순서 기억하기 — 동물 친구 4명이 차례로 노래하면 같은 순서로 눌러요
   - 하나씩 늘어나서 목표 길이(1단계 3 / 2단계 5 / 3단계 6 — 7개는 한 판이 1분 30초를 넘어 6으로)까지 가면 성공
   - 틀려도 "다시 잘 보세요!" 하고 같은 순서를 다시 보여 줌 (처음부터 아님) */
"use strict";
KP.game({
  id: "simon",
  icon: "💡",
  name: "순서 기억하기",
  cat: "music",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("simon", `
      .sm{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:10px;padding:0 14px 14px}
      .sm-prog{flex:0 0 auto;display:flex;gap:10px;align-items:center;justify-content:center;min-height:44px}
      .sm-pdot{width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 3px #d6dcef;display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .2s}
      .sm-pdot.have{background:#ffe9a8;box-shadow:inset 0 0 0 3px #f1c84a}
      .sm-pdot.ok{background:var(--grass);box-shadow:none;transform:scale(1.15)}
      .sm-eye{font-size:clamp(26px,4vh,36px);margin-left:6px;transition:opacity .2s}
      .sm-grid{flex:1;min-height:0;aspect-ratio:1;max-width:100%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:clamp(12px,2.4vh,22px)}
      .sm-pad{position:relative;border-radius:34px;background:var(--c);box-shadow:0 10px 0 color-mix(in srgb,var(--c) 60%,#000),inset 0 6px 0 rgba(255,255,255,.35);
        display:flex;align-items:center;justify-content:center;font-size:clamp(70px,13vh,130px);line-height:1;transition:filter .15s,transform .1s;filter:saturate(.75) brightness(.92);touch-action:none}
      .sm-pad .e{transition:transform .2s}
      .sm-pad.lit{filter:saturate(1.15) brightness(1.18);transform:scale(1.05);box-shadow:0 10px 0 color-mix(in srgb,var(--c) 60%,#000),0 0 0 8px #fff,0 0 40px 14px color-mix(in srgb,var(--c) 70%,#fff)}
      .sm-pad.lit .e{transform:translateY(-10%) scale(1.15) rotate(-6deg)}
      .sm-pad:active{transform:translateY(5px)}
      .sm-grid.watch .sm-pad{pointer-events:none}
      .sm-grid.watch{cursor:wait}
    `);
    const PADS = [
      ["🐶", "강아지", "#ff6b6b", "C4"], ["🐱", "고양이", "#4dabf7", "E4"],
      ["🐰", "토끼", "#ffd43b", "G4"], ["🐸", "개구리", "#51cf66", "C5"],
    ];
    const wrap = U.el("div", "sm");
    const prog = U.el("div", "sm-prog");
    const grid = U.el("div", "sm-grid");
    wrap.append(prog, grid);
    ctx.body.appendChild(wrap);

    let seq = [],
      pos = 0,
      target = 3,
      busy = true,
      gen = 0;
    const pads = PADS.map(([em, name, col, note], i) => {
      const p = U.el("div", "sm-pad", KP.E(em));
      p.style.setProperty("--c", col);
      p.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        A.unlock();
        if (busy) return;
        input(i);
      });
      grid.appendChild(p);
      return p;
    });
    function light(i, ms) {
      const p = pads[i];
      p.classList.add("lit");
      A.note(PADS[i][3], { inst: "bell", dur: 0.55, vol: 0.28 });
      A.note(PADS[i][3], { inst: "marimba", dur: 0.4, vol: 0.18 });
      ctx.after(ms, () => p.classList.remove("lit"));
    }
    function renderProg(okUpTo) {
      prog.innerHTML = "";
      for (let k = 0; k < target; k++) {
        const d = U.el("span", "sm-pdot" + (k < seq.length ? " have" : "") + (k < okUpTo ? " ok" : ""));
        prog.appendChild(d);
      }
      prog.appendChild(U.el("span", "sm-eye", KP.E(busy ? "👀" : "👆")));
    }
    async function show(again) {
      busy = true;
      grid.classList.add("watch");
      const g = ++gen;
      pos = 0;
      renderProg(0);
      ctx.hint(null);
      if (again) {
        ctx.say("다시 잘 보세요! 👀");
        await ctx.wait(1500);
      } else {
        // 말은 자연 음성이 있는 고정 문장으로 (숫자 섞인 문장은 기기 목소리라) — 몇 번인지는 말풍선 글자와 위 점으로
        ctx.say(seq.length === 1 ? "잘 보세요! 누가 노래할까요? 👀" : "잘 보세요! " + seq.length + "번 노래해요 👀", seq.length === 1 ? true : "잘 보세요!");
        await ctx.wait(seq.length === 1 ? 1600 : 1200);
      }
      if (g !== gen) return;
      const lv = ctx.level,
        step = [720, 620, 540][lv - 1];
      for (let k = 0; k < seq.length; k++) {
        const i = seq[k];
        if (g !== gen || !ctx._active) return;
        light(i, step * (seq[k + 1] === i ? 0.55 : 0.7)); // 같은 친구가 또 노래하면 불을 일찍 꺼서 '두 번'으로 보이게
        await ctx.wait(step);
      }
      if (g !== gen) return;
      busy = false;
      grid.classList.remove("watch");
      renderProg(0);
      ctx.say("이제 똑같이 눌러 봐요! 👆");
      setHint();
    }
    function setHint() {
      ctx.hint(() => pads[seq[pos]], "아까 누가 노래했지? 눌러 봐요!", { answer: true }); // 정답 패드를 가리킴 → 그 판은 열쇠 별 없음
    }
    async function input(i) {
      light(i, 260);
      if (i !== seq[pos]) {
        busy = true;
        grid.classList.add("watch");
        ctx.miss(pads[i]);
        await ctx.wait(700);
        show(true);
        return;
      }
      pos++;
      renderProg(pos);
      if (pos < seq.length) return setHint();
      busy = true;
      grid.classList.add("watch");
      ctx.hint(null);
      if (seq.length >= target) {
        ctx.score.add();
        ctx.round = (ctx.round || 0) + 1;
        await ctx.wait(400);
        const big = ctx.round % 4 === 0;
        const ok = await ctx.win({ big, msg: big ? "기억력 대장!" : seq.length + "개 다 기억했어요!", say: big ? "" : "순서대로 척척!" });
        if (ok) newRound();
        return;
      }
      A.sfx("good");
      KP.voice.say(U.pick(["잘했어요! 하나 더!", "딩동댕! 이번엔 하나 더!", "좋아요! 더 길어져요!"]));
      await ctx.wait(1300);
      seq.push(nextPad());
      show(false);
    }
    /** 다음 패드: 1단계는 바로 앞과 다른 친구만 (같은 친구가 연달아 노래하면 3~4세는 한 번으로 봄),
        2·3단계도 같은 친구는 최대 2번 연속 */
    function nextPad() {
      if (!seq.length) return U.rand(4);
      const prev = seq[seq.length - 1];
      if (ctx.level > 1 && !(seq.length >= 2 && seq[seq.length - 2] === prev)) return U.rand(4);
      return U.pick([0, 1, 2, 3].filter((i) => i !== prev));
    }
    function newRound() {
      target = [3, 5, 6][ctx.level - 1];
      seq = [];
      seq.push(nextPad());
      show(false);
    }
    ctx.newRound = newRound;
    ctx.stopAll = () => gen++;
  },
  start(ctx) {
    ctx.bgmWas = KP.audio.bgm.on;
    if (ctx.bgmWas) KP.audio.bgm.stop();
    ctx.round = 0;
    ctx.newRound();
  },
  stop(ctx) {
    ctx.stopAll();
    if (ctx.bgmWas && KP.settings.get().bgm) KP.audio.bgm.start();
  },
});

;

/* ==== js/games/music/xylo.js ==== */
/* 실로폰 — 무지개 실로폰 8음 (도~도)
   - 누른 곳으로 채(말렛)가 날아가 '똑' 치는 애니메이션, 손가락으로 쓸면 주르륵
   - 🌟 따라 치기: 동요를 고르면 칠 막대가 반짝 → 차례로 치면 한 곡 완성 (피아노 따라 치기와 같은 방식, 한 옥타브 위)
     1단계: 앞 두 소절, 2단계: 절반, 3단계: 끝까지. 틀리면 부드러운 '톡' + 칠 막대가 들썩. 쓸기로 지나간 막대는 진행에 안 셈
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
