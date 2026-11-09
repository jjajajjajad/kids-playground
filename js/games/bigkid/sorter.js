/* 모양 끼우기 — 모양 조각을 끌어다 같은 모양 구멍에 쏙!
   1단계: 3개 / 2단계: 4개 / 3단계: 5개 (구멍 위치도 섞임)
   - 구멍은 조각보다 1개 많음(빈 구멍) → 마지막 조각도 생각해서 넣어야 함
   - 3단계에 같은 모양이 색만 달리 둘(🔴·🟣, 🟦·🟩) 나오면 구멍에 연한 본래 색을 보여 줌(실루엣만으로는 똑같아서) */
"use strict";
KP.game({
  id: "sorter",
  icon: "🔺",
  name: "모양 끼우기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sorter", `
      .srtBoard{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:6px 12px 14px}
      .srtBox{display:flex;gap:clamp(10px,2.4vw,26px);flex-wrap:wrap;justify-content:center;padding:clamp(14px,2.4vw,26px);border-radius:32px;background:linear-gradient(180deg,#ffcf7a,#f4a944);box-shadow:0 10px 0 #c97f22, inset 0 4px 0 rgba(255,255,255,.5)}
      .srtHole{width:clamp(84px,13vw,140px);height:clamp(84px,13vw,140px);border-radius:24px;background:rgba(120,60,0,.18);box-shadow:inset 0 6px 10px rgba(80,40,0,.35);display:flex;align-items:center;justify-content:center;font-size:clamp(60px,9.5vw,104px);position:relative}
      .srtHole .ghost{filter:brightness(0) opacity(.35)}
      /* 색 구멍(3단계): 흰 동그라미 위에 본래 색을 진하게 — 주황 상자 위에 반투명으로 겹치면 보라가 갈색·파랑이 회색처럼 보였음 */
      .srtBox.tint .srtHole::before{content:"";position:absolute;inset:9%;border-radius:50%;background:rgba(255,255,255,.88);box-shadow:inset 0 3px 6px rgba(80,40,0,.18)}
      .srtBox.tint .srtHole .ghost{filter:opacity(.8);position:relative}
      .srtBox.tint .srtHole.filled::before{display:none}
      /* 🔺 그림은 여백이 커서 다른 모양의 절반처럼 보임 → 그림만 키움(끄는 상자 크기는 그대로) */
      [data-k="🔺"] .e{transform:scale(1.7)}
      .srtHole.filled .ghost{display:none}
      .srtTray{display:flex;gap:clamp(12px,2.6vw,30px);flex-wrap:wrap;justify-content:center;min-height:clamp(96px,14vw,150px);align-items:center}
      .srtPiece{font-size:clamp(60px,9.5vw,104px);line-height:1;padding:8px;filter:drop-shadow(0 6px 0 rgba(0,0,0,.15))}
      .srtHole .srtPiece{position:absolute;padding:0;filter:none;animation:popIn .3s}
      /* 폰 가로처럼 낮은 화면: 빈 구멍까지 6개가 한 줄에 들어가게 */
      @media (max-height:520px) and (orientation:landscape){.srtHole{width:min(12vw,23vh);height:min(12vw,23vh);font-size:min(8.6vw,16vh)}.srtPiece{font-size:min(8.6vw,16vh)}.srtTray{min-height:0}}
    `);
    ctx.SHAPES = [
      ["🔴", "동그라미"], ["🟦", "네모"], ["🔺", "세모"], ["⭐", "별"], ["❤️", "하트"], ["🌙", "달"], ["🔶", "마름모"], ["🟩", "초록 네모"], ["🟣", "보라 동그라미"],
    ];
    // 같은 모양 계열 (색만 다름)
    ctx.FAMILY = { "🟣": "🔴", "🟩": "🟦" };
    ctx.boardEl = U.el("div", "srtBoard");
    ctx.box = U.el("div", "srtBox");
    ctx.tray = U.el("div", "srtTray");
    ctx.boardEl.append(ctx.box, ctx.tray);
    ctx.body.appendChild(ctx.boardEl);
    ctx.round = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastLine = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [3, 4, 5][lv - 1];
    // 같은 계열(네모 두 개 등)은 3단계에서만 같이 나오게
    const pool = lv < 3 ? ctx.SHAPES.slice(0, 7) : ctx.SHAPES;
    const pick = U.sample(pool, n);
    // 같은 모양이 색만 달리 두 개 있으면(🔴·🟣, 🟦·🟩) 검은 실루엣으로는 구별이 안 됨 → 이 판은 구멍에 본래 색을 연하게
    const fam = (em) => ctx.FAMILY[em] || em;
    const famCount = {};
    pick.forEach(([em]) => (famCount[fam(em)] = (famCount[fam(em)] || 0) + 1));
    const tint = Object.values(famCount).some((c) => c > 1);
    // 빈 구멍 1개(맞는 조각 없음) — 마지막 조각이 저절로 맞는 '소거'를 막음. 실루엣이 같은 계열은 빼고
    const decoyPool = pool.filter(([em]) => !pick.some(([e]) => e === em) && (tint || !famCount[fam(em)]));
    const decoy = decoyPool.length ? U.pick(decoyPool) : null;
    // 안내: 첫 판은 자세히, 그다음은 짧은 말을 돌아가며 (늘 같은 한 문장이면 금방 질림)
    const lines = ["모양 조각을 끌어서 같은 모양 구멍에 쏙 넣어 봐요!", "모양을 끌어서 같은 구멍에 넣어요!", "모양을 찾아요!"];
    let line = ctx.round === 0 ? lines[0] : U.pick(lines.filter((l) => l !== ctx.lastLine));
    ctx.lastLine = line;
    if (tint) line = "모양도 색도 잘 봐요! " + line;
    ctx.say(line);
    ctx.box.innerHTML = "";
    ctx.tray.innerHTML = "";
    ctx.box.classList.toggle("tint", tint);
    const holes = U.shuffle(decoy ? [...pick, decoy] : [...pick]).map(([em]) => {
      const h = U.el("div", "srtHole", '<span class="ghost">' + KP.E(em) + "</span>");
      h.dataset.k = em;
      ctx.box.appendChild(h);
      return h;
    });
    let left = n;
    const pieces = U.shuffle([...pick]).map(([em, name], i) => {
      const p = U.el("div", "srtPiece item", KP.E(em));
      p.style.setProperty("--i", i);
      p.dataset.k = em;
      ctx.tray.appendChild(p);
      const d = KP.drag(p, {
        targets: () => holes.filter((h) => !h.classList.contains("filled")),
        accept: (t) => t.dataset.k === em,
        onReject: (t) => ctx.miss(t, "이 모양이 아니에요. 다른 구멍을 찾아봐요!"),
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          p.style.transform = "";
          t.appendChild(p);
          t.classList.add("filled");
          A.sfx("snap");
          // 하나 끼울 때마다 도-레-미 계단 소리
          A.note(A.SCALE[Math.min(A.SCALE.length - 1, n - left)], { inst: "marimba", dur: 0.3, vol: 0.24 });
          U.replay(t, "pop");
          KP.voice.say(name + "!");
          left--;
          if (left === 0) {
            U.replay(ctx.box, "jump");
            done();
          } else hint();
        },
      });
      return p;
    });
    // 두 번째 힌트부터는 손가락이 맞는 구멍까지 움직여 보여 줌(KP.drag 공용 기능)
    const hint = () => {
      const p = pieces.find((x) => !x.parentElement.classList.contains("srtHole"));
      ctx.hint(() => p, "모양을 끌어서 같은 구멍에 넣어요!");
    };
    hint();
    const done = async () => {
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 모양 박사!" : U.pick(["다 끼웠다!", "딱 맞아요!", "잘했어요!"]) });
      if (ok) this.next(ctx);
    };
  },
});
