/* 한글 쓰기 공책 — 학습지(따라 쓰기 교재) 방식을 태블릿으로
   차례: ① 선 긋기(운필) → ② 모음 → ③ 자음 → ④ 글자(가~하, 고~호) → ⑤ 낱말
   한 글자 쓰기 = 공책 한 줄 3칸
     1칸 '보고 따라 쓰기' : 획순 시범 애니메이션 → 진한 점선 + 획 번호 + 방향 화살표
     2칸 '흐린 글씨'       : 흐린 글씨 위에 쓰기 (다음 획 시작점만 표시)
     3칸 '혼자 쓰기'       : 빈 칸에 옆의 본보기 글자를 보고 쓰기
   다 쓰면 칸마다 채점(얼마나 따라 썼나 + 선 밖으로 덜 나갔나) → 별 1~3개, '참 잘했어요' 도장.
   - 획 순서는 보여 주기만 하고 강요하지 않음(만 3~4세). 막히지 않게 [다 썼어요] 버튼.
   - 펜(애플펜슬 등)을 쓰면 손바닥 터치는 무시, 펜은 누르는 힘에 따라 굵기 변화.
   - 획순: 국어 교과서식 일반 기준(가로는 왼→오, 세로는 위→아래, ㅇ은 위에서 시계 반대 방향).
     ㄹ=ㄱ·가운데 가로·ㄴ(3획), ㅈ=가로·삐침·내림(3획), ㅊ=꼭지+ㅈ(4획), ㅎ=꼭지·가로·ㅇ(3획) */
"use strict";
(function () {
  /* ---------- 획 자료 (100×100 칸, 점 목록 / {o:[x,y,r]} 는 동그라미) ---------- */
  const ST = {
    ㄱ: [[[20, 22], [78, 22], [78, 82]]],
    ㄴ: [[[24, 18], [24, 78], [84, 78]]],
    ㄷ: [[[22, 22], [78, 22]], [[22, 22], [22, 78], [80, 78]]],
    ㄹ: [[[22, 16], [78, 16], [78, 48]], [[22, 48], [78, 48]], [[22, 48], [22, 82], [80, 82]]],
    ㅁ: [[[22, 20], [22, 80]], [[22, 20], [78, 20], [78, 80]], [[22, 80], [78, 80]]],
    ㅂ: [[[24, 16], [24, 82]], [[76, 16], [76, 82]], [[24, 48], [76, 48]], [[24, 82], [76, 82]]],
    ㅅ: [[[52, 16], [18, 84]], [[45, 44], [84, 84]]],
    ㅇ: [{ o: [50, 50, 32] }],
    ㅈ: [[[20, 20], [80, 20]], [[56, 20], [18, 84]], [[47, 48], [84, 84]]],
    ㅊ: [[[42, 6], [58, 14]], [[20, 30], [80, 30]], [[56, 30], [18, 88]], [[47, 54], [84, 88]]],
    ㅋ: [[[20, 20], [78, 20], [78, 82]], [[20, 50], [78, 50]]],
    ㅌ: [[[22, 18], [78, 18]], [[22, 48], [74, 48]], [[22, 18], [22, 80], [80, 80]]],
    ㅍ: [[[16, 20], [84, 20]], [[36, 20], [36, 78]], [[64, 20], [64, 78]], [[16, 78], [84, 78]]],
    ㅎ: [[[40, 8], [60, 8]], [[18, 26], [82, 26]], { o: [50, 62, 22] }],
    ㅏ: [[[40, 10], [40, 90]], [[40, 50], [72, 50]]],
    ㅑ: [[[38, 10], [38, 90]], [[38, 38], [70, 38]], [[38, 62], [70, 62]]],
    ㅓ: [[[28, 50], [60, 50]], [[60, 10], [60, 90]]],
    ㅕ: [[[30, 38], [62, 38]], [[30, 62], [62, 62]], [[62, 10], [62, 90]]],
    ㅗ: [[[50, 30], [50, 62]], [[12, 62], [88, 62]]],
    ㅛ: [[[38, 30], [38, 62]], [[62, 30], [62, 62]], [[12, 62], [88, 62]]],
    ㅜ: [[[12, 38], [88, 38]], [[50, 38], [50, 74]]],
    ㅠ: [[[12, 38], [88, 38]], [[38, 38], [38, 74]], [[62, 38], [62, 74]]],
    ㅡ: [[[10, 50], [90, 50]]],
    ㅣ: [[[50, 10], [50, 90]]],
  };
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const compose = (c, v) => String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28);
  const split = (s) => {
    const k = s.charCodeAt(0) - 0xac00;
    return [CHO[Math.floor(k / 588)], JUNG[Math.floor((k % 588) / 28)], k % 28];
  };
  const mapStrokes = (strokes, [x0, y0, x1, y1]) =>
    strokes.map((s) => {
      const sx = (x1 - x0) / 100,
        sy = (y1 - y0) / 100;
      if (s.o) return { o: [x0 + s.o[0] * sx, y0 + s.o[1] * sy, s.o[2] * Math.min(sx, sy)] };
      return s.map(([x, y]) => [x0 + x * sx, y0 + y * sy]);
    });
  /** 받침 없는 글자 → 획 (세로 모음은 오른쪽, 가로 모음은 아래) */
  function sylStrokes(syl) {
    const [c, v, jong] = split(syl);
    if (jong || !ST[c] || !ST[v]) return null;
    const vert = "ㅏㅑㅓㅕㅣ".includes(v);
    const cb = vert ? [2, 14, 62, 86] : [18, 2, 82, 56];
    const vb = vert ? [38, 2, 98, 98] : [2, 34, 98, 100];
    return mapStrokes(ST[c], cb).concat(mapStrokes(ST[v], vb));
  }
  // 선 긋기: [이름, 출발 그림, 도착 그림, 획들, 안내]
  const wave = () => {
    const p = [];
    for (let i = 0; i <= 24; i++) p.push([10 + (80 * i) / 24, 50 + Math.sin((i / 24) * Math.PI * 3) * 18]);
    return [p];
  };
  const spiral = () => {
    const p = [];
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * Math.PI * 4.2;
      const r = 36 - (i / 60) * 30;
      p.push([50 + Math.cos(t - Math.PI / 2) * r, 50 + Math.sin(t - Math.PI / 2) * r]);
    }
    return [p];
  };
  const LINES = [
    ["가로선", "🐶", "🦴", [[[12, 50], [88, 50]]], "강아지가 뼈다귀까지 쭉!"],
    ["세로선", "☁️", "🌷", [[[50, 12], [50, 88]]], "비가 주룩주룩, 꽃까지 내려가요!"],
    ["비스듬한 선", "🐿️", "🌰", [[[16, 16], [84, 84]]], "다람쥐가 미끄럼틀을 쭉!"],
    ["반대로 비스듬히", "🐝", "🌻", [[[84, 16], [16, 84]]], "꿀벌이 해바라기까지 슝!"],
    ["꺾은선", "🚗", "🏠", [[[14, 22], [80, 22], [80, 84]]], "자동차가 꺾어서 집까지!"],
    ["뾰족뾰족 산", "🐰", "🥕", [[[8, 72], [26, 30], [44, 72], [62, 30], [80, 72], [92, 50]]], "토끼가 산을 넘어 당근까지!"],
    ["구불구불 파도", "🐳", "🏝️", wave(), "고래가 파도를 타고 섬까지!"],
    ["동그라미", "🐞", "🐞", [{ o: [50, 50, 32] }], "무당벌레처럼 동글동글!"],
    ["달팽이", "🐌", "🐌", spiral(), "달팽이 집을 빙글빙글!"],
  ];
  const H = [
    ["ㄱ", "기역", "기차", "🚂"], ["ㄴ", "니은", "나비", "🦋"], ["ㄷ", "디귿", "다람쥐", "🐿️"], ["ㄹ", "리을", "라디오", "📻"],
    ["ㅁ", "미음", "모자", "🎩"], ["ㅂ", "비읍", "바나나", "🍌"], ["ㅅ", "시옷", "사자", "🦁"], ["ㅇ", "이응", "오리", "🦆"],
    ["ㅈ", "지읒", "자전거", "🚲"], ["ㅊ", "치읓", "치즈", "🧀"], ["ㅋ", "키읔", "코끼리", "🐘"], ["ㅌ", "티읕", "토끼", "🐰"],
    ["ㅍ", "피읖", "포도", "🍇"], ["ㅎ", "히읗", "하마", "🦛"],
  ];
  const V = [
    ["ㅏ", "아", "아기", "👶"], ["ㅑ", "야", "야구", "⚾"], ["ㅓ", "어", "어묵", "🍢"], ["ㅕ", "여", "여우", "🦊"], ["ㅗ", "오", "오리", "🦆"],
    ["ㅛ", "요", "요요", "🪀"], ["ㅜ", "우", "우유", "🥛"], ["ㅠ", "유", "유니콘", "🦄"], ["ㅡ", "으", "으르렁", "🦁"], ["ㅣ", "이", "이", "🦷"],
  ];
  const WORDS = [
    ["코", "👃"], ["소", "🐮"], ["아기", "👶"], ["오이", "🥒"], ["우유", "🥛"], ["오리", "🦆"], ["여우", "🦊"], ["나비", "🦋"],
    ["모자", "🎩"], ["기차", "🚂"], ["사자", "🦁"], ["하마", "🦛"], ["바다", "🌊"], ["포도", "🍇"], ["피자", "🍕"], ["치마", "👗"],
    ["거미", "🕷️"], ["고기", "🍖"], ["가지", "🍆"], ["야구", "⚾"], ["피아노", "🎹"], ["라디오", "📻"], ["너구리", "🦝"], ["도토리", "🌰"],
  ];
  const SYLW = {}; // 글자 → 그 글자로 시작하는 낱말
  [["가지", "🍆"], ["나비", "🦋"], ["다리", "🦵"], ["라디오", "📻"], ["마스크", "😷"], ["바다", "🌊"], ["사자", "🦁"], ["아기", "👶"], ["자전거", "🚲"],
    ["차", "🚙"], ["카메라", "📷"], ["타조", "🐦"], ["파도", "🌊"], ["하마", "🦛"], ["고래", "🐳"], ["노래", "🎵"], ["도토리", "🌰"], ["로봇", "🤖"],
    ["모자", "🎩"], ["보물", "💎"], ["소", "🐮"], ["오리", "🦆"], ["조개", "🐚"], ["초", "🕯️"], ["코", "👃"], ["토끼", "🐰"], ["포도", "🍇"], ["호랑이", "🐯"]]
    .forEach((w) => (SYLW[w[0][0]] = SYLW[w[0][0]] || w));
  const COLORS = ["#ff5b6e", "#ff8a3d", "#e6a700", "#3fbf6a", "#14b8a6", "#2f95f5", "#5b7cfa", "#8a63ee", "#d94fc2", "#2fb466", "#e0564f", "#3a86ff", "#c77dff", "#ff7452"];

  /* ---------- 목차 만들기 ---------- */
  function buildBook() {
    const sec = [];
    sec.push({ id: "line", name: "선 긋기", icon: "〰️", items: LINES.map((l, i) => ({ id: "L" + i, kind: "line", label: l[1], name: l[0], color: COLORS[i % 14], strokes: l[3], from: l[1], to: l[2], guide: l[4] })) });
    sec.push({ id: "vow", name: "모음", items: V.map((v, i) => ({ id: "V" + v[0], kind: "jamo", label: v[0], ch: v[0], say: v[1], color: COLORS[i], strokes: ST[v[0]], word: [v[2], v[3]] })) });
    sec.push({ id: "cons", name: "자음", items: H.map((h, i) => ({ id: "C" + h[0], kind: "jamo", label: h[0], ch: h[0], say: h[1], color: COLORS[i], strokes: ST[h[0]], word: [h[2], h[3]] })) });
    const syl = [];
    ["ㅏ", "ㅗ"].forEach((v) =>
      H.forEach((h, i) => {
        const s = compose(h[0], v);
        syl.push({ id: "S" + s, kind: "jamo", label: s, ch: s, say: s, color: COLORS[i], strokes: sylStrokes(s), word: SYLW[s] || null, syl: true });
      })
    );
    sec.push({ id: "syl", name: "글자", items: syl });
    sec.push({ id: "word", name: "낱말", items: WORDS.map((w, i) => ({ id: "W" + w[0], kind: "word", label: w[0], ch: w[0], say: w[0], color: COLORS[i % 14], word: w, syls: [...w[0]] })) });
    return sec;
  }

  KP.game({
    id: "hwrite",
    icon: "✍️",
    name: "한글 쓰기 공책",
    cat: "study",
    setup(ctx) {
      const U = KP.u;
      const self = this;
      KP.css("hwrite", `
        #g-hwrite .stage{background:#fffdf6}
        .hwView{flex:1;min-height:0;display:none;flex-direction:column;position:relative}
        .hwView.on{display:flex}
        /* 목차 */
        .hwBook{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px clamp(10px,2vw,24px) 26px}
        .hwGo{display:flex;justify-content:center;margin:2px 0 10px}
        .hwSec{margin-bottom:14px}
        .hwSecH{display:flex;align-items:center;gap:10px;font-size:clamp(20px,2.6vw,26px);color:var(--night);margin:4px 2px 8px}
        .hwSecH .n{background:var(--night);color:#fff;border-radius:12px;padding:1px 10px;font-size:.8em}
        .hwSecH small{font-size:.65em;color:var(--ink2)}
        .hwTiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(74px,9.5vw,100px),1fr));gap:10px}
        .hwTile{position:relative;aspect-ratio:1;background:#fff;border-radius:18px;border:3px solid #e8ebf4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 4px 0 #e3e7f2;color:var(--c)}
        .hwTile .ch{font-size:clamp(34px,4.6vw,48px);line-height:1}
        .hwTile .ch .e{font-size:.9em}
        .hwTile.word .ch{font-size:clamp(20px,2.6vw,28px)}
        .hwTile .st{font-size:13px;letter-spacing:1px;color:#d9dce8;line-height:1}
        .hwTile .st b{color:#ffb800;font-weight:400}
        .hwTile.next{border-color:var(--star);animation:glow 1.4s ease-in-out infinite}
        .hwTile:active{transform:translateY(3px)}
        /* 쓰기 페이지 */
        .hwPage{flex:1;min-height:0;display:grid;grid-template-columns:minmax(150px,22%) 1fr minmax(120px,15%);grid-template-rows:minmax(0,1fr) auto;gap:8px 12px;padding:8px 12px 10px}
        .hwModel{grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--c);text-align:center}
        .hwModel .big{font-size:clamp(70px,min(11vw,17vh),140px);line-height:1;background:#fff;border-radius:24px;padding:8px 16px;box-shadow:0 5px 0 #eceff6;min-width:1.3em}
        .hwModel .big .e{font-size:.8em}
        .hwModel .pic{display:flex;flex-direction:column;align-items:center;font-size:clamp(16px,2.2vw,24px);color:var(--ink)}
        .hwModel .pic .e{font-size:clamp(46px,min(6vw,9vh),78px)}
        .hwModel .pic b{color:var(--c);font-weight:400}
        .hwStepName{font-size:clamp(17px,2.2vw,24px);color:var(--night);background:var(--star);border-radius:14px;padding:4px 14px}
        .hwBoard{position:relative;min-width:0;min-height:0}
        .hwBoard canvas{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);touch-action:none}
        .hwBoard canvas.guide{background:#fff;border-radius:6px;box-shadow:0 0 0 3px #f2b8a8,0 8px 0 rgba(47,58,102,.08)}
        .hwSide{grid-row:1/3;grid-column:3;display:flex;flex-direction:column;justify-content:center;gap:12px}
        .hwSide .btn{justify-content:center}
        .hwLine{grid-column:2;display:flex;gap:8px;justify-content:center;align-items:center}
        .hwCell{width:clamp(54px,min(7vw,10vh),76px);aspect-ratio:1;border-radius:6px;background:#fff;box-shadow:0 0 0 2px #f2b8a8;position:relative;display:flex;align-items:center;justify-content:center;font-size:13px;color:#c9cede;overflow:hidden}
        .hwCell canvas{width:100%;height:100%}
        .hwCell.cur{box-shadow:0 0 0 4px var(--star)}
        .hwCell .s{position:absolute;bottom:1px;left:0;right:0;text-align:center;font-size:11px;color:#ffb800;letter-spacing:-1px}
        .hwDone{opacity:.35;pointer-events:none}
        .glowNext{animation:glow 1s ease-in-out infinite}
        @media (max-aspect-ratio:1/1){
          .hwPage{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto auto;padding:6px 8px 8px}
          .hwModel{grid-row:auto;flex-direction:row;gap:14px}
          .hwModel .big{font-size:58px;padding:4px 12px}
          .hwModel .pic{flex-direction:row;gap:6px}.hwModel .pic .e{font-size:44px}
          .hwSide{grid-row:auto;grid-column:auto;flex-direction:row;justify-content:center;flex-wrap:wrap;gap:8px}
          .hwLine{grid-column:auto}
          .hwStepName{font-size:16px}
        }
        /* 도장 */
        .hwStamp{position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(255,253,246,.88);flex-direction:column;gap:14px}
        .hwStamp.on{display:flex}
        .hwSeal{width:clamp(170px,min(26vw,34vh),250px);aspect-ratio:1;border-radius:50%;border:8px solid #e8413a;color:#e8413a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(30px,min(4.6vw,6vh),44px);line-height:1.15;transform:rotate(-12deg);box-shadow:inset 0 0 0 5px #fff,inset 0 0 0 9px #e8413a;background:rgba(255,255,255,.6);animation:seal .5s cubic-bezier(.2,1.5,.4,1)}
        .hwSeal small{font-size:.45em;margin-top:4px}
        @keyframes seal{from{transform:rotate(-12deg) scale(2.4);opacity:0}}
        .hwStars{font-size:clamp(34px,5vw,52px);letter-spacing:6px}
        .hwStars .off{filter:grayscale(1) opacity(.25)}
        .hwRes{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding:0 8px}
        @media (max-width:520px){.hwRes .btn.big{font-size:18px;padding:10px 16px}}
      `);
      ctx.book = buildBook();
      ctx.items = ctx.book.flatMap((s) => s.items);
      ctx.stars = KP.store.get("hw:stars", {});
      if (!ctx.stars || typeof ctx.stars !== "object") ctx.stars = {};

      /* ---- 목차 화면 ---- */
      ctx.vBook = U.el("div", "hwView");
      const book = U.el("div", "hwBook");
      const go = U.el("div", "hwGo");
      ctx.bGo = U.btn(KP.E("✏️") + " 이어서 쓰기", "btn big primary");
      go.appendChild(ctx.bGo);
      book.appendChild(go);
      ctx.tap(ctx.bGo, () => self.openItem(ctx, self.nextIdx(ctx)));
      ctx.tiles = [];
      ctx.book.forEach((s, si) => {
        const box = U.el("section", "hwSec");
        box.appendChild(U.el("div", "hwSecH", '<span class="n">' + (si + 1) + "</span>" + s.name + " <small>" + s.items.length + "개</small>"));
        const grid = U.el("div", "hwTiles");
        s.items.forEach((it) => {
          const t = U.btn('<span class="ch">' + (it.kind === "line" ? KP.E(it.label) : it.label) + '</span><span class="st"></span>', "hwTile" + (it.kind === "word" ? " word" : ""));
          t.style.setProperty("--c", it.color);
          const idx = ctx.items.indexOf(it);
          ctx.tap(t, () => self.openItem(ctx, idx));
          t.dataset.idx = idx;
          grid.appendChild(t);
          ctx.tiles[idx] = t;
        });
        box.appendChild(grid);
        book.appendChild(box);
      });
      ctx.vBook.appendChild(book);

      /* ---- 쓰기 화면 ---- */
      ctx.vPage = U.el("div", "hwView");
      const page = U.el("div", "hwPage");
      ctx.model = U.el("div", "hwModel");
      ctx.board = U.el("div", "hwBoard");
      ctx.gcv = U.el("canvas", "guide");
      ctx.icv = U.el("canvas", "ink");
      ctx.board.append(ctx.gcv, ctx.icv);
      ctx.side = U.el("div", "hwSide");
      ctx.bShow = U.btn(KP.E("👀") + " 다시 보기", "btn");
      ctx.bAgain = U.btn(KP.E("🔄") + " 지우기", "btn");
      ctx.bDone = U.btn(KP.E("👍") + " 다 썼어요", "btn primary");
      ctx.bBook = U.btn(KP.E("📒") + " 목차", "btn");
      ctx.side.append(ctx.bShow, ctx.bAgain, ctx.bDone, ctx.bBook);
      ctx.line = U.el("div", "hwLine");
      page.append(ctx.model, ctx.board, ctx.side, ctx.line);
      ctx.stamp = U.el("div", "hwStamp");
      ctx.vPage.append(page, ctx.stamp);
      ctx.tap(ctx.bShow, () => self.demo(ctx));
      ctx.tap(ctx.bAgain, () => {
        KP.audio.sfx("back");
        self.cellReset(ctx);
      });
      ctx.tap(ctx.bDone, () => self.finishCell(ctx, true));
      ctx.tap(ctx.bBook, () => self.showBook(ctx));

      ctx.body.append(ctx.vBook, ctx.vPage);
      this.setupInk(ctx);
      addEventListener("resize", () => {
        if (ctx._active && ctx.vPage.classList.contains("on") && ctx.cell) {
          self.fit(ctx);
          self.drawGuide(ctx);
          self.redrawInk(ctx);
        }
      });
    },

    start(ctx) {
      const want = KP.hwriteWant;
      KP.hwriteWant = null;
      const i = want ? ctx.items.findIndex((it) => it.ch === want) : -1;
      if (i >= 0) this.openItem(ctx, i, true);
      else this.showBook(ctx, true);
    },
    stop(ctx) {
      ctx.tok = (ctx.tok || 0) + 1;
    },

    /* ================= 목차 ================= */
    nextIdx(ctx) {
      const i = ctx.items.findIndex((it) => !ctx.stars[it.id]);
      return i < 0 ? 0 : i;
    },
    showBook(ctx, first) {
      ctx.tok = (ctx.tok || 0) + 1;
      ctx.vBook.classList.add("on");
      ctx.vPage.classList.remove("on");
      const nx = this.nextIdx(ctx);
      ctx.items.forEach((it, i) => {
        const t = ctx.tiles[i];
        const n = ctx.stars[it.id] || 0;
        t.querySelector(".st").innerHTML = n ? "<b>" + "★".repeat(n) + "</b>" + "★".repeat(3 - n) : "☆☆☆";
        t.classList.toggle("next", i === nx);
      });
      const done = Object.keys(ctx.stars).length;
      ctx.say("✍️ 쓰기 공책이에요! " + (done ? done + "개 썼어요. 반짝이는 칸부터 써 봐요!" : "선 긋기부터 시작해 볼까요?"));
      if (!first) KP.audio.sfx("open");
      ctx.hint(() => ctx.tiles[nx], "반짝이는 칸을 눌러요!");
      ctx.after(60, () => ctx.tiles[nx] && ctx.tiles[nx].scrollIntoView && ctx.tiles[nx].scrollIntoView({ block: "center", behavior: "smooth" }));
    },

    /* ================= 쓰기 페이지 ================= */
    /** 한 항목을 쓰는 칸 목록 */
    cellsOf(it) {
      if (it.kind === "line") return [{ strokes: it.strokes, mode: "dot", demo: true }, { strokes: it.strokes, mode: "faint" }, { strokes: it.strokes, mode: "faint" }];
      if (it.kind === "word") {
        const a = it.syls.map((s) => ({ strokes: sylStrokes(s), mode: "dot", demo: true, syl: true, ch: s }));
        const b = it.syls.map((s) => ({ strokes: sylStrokes(s), mode: "faint", syl: true, ch: s }));
        return a.concat(b);
      }
      return [
        { strokes: it.strokes, mode: "dot", demo: true, syl: it.syl, ch: it.ch },
        { strokes: it.strokes, mode: "faint", syl: it.syl, ch: it.ch },
        { strokes: it.strokes, mode: "alone", syl: it.syl, ch: it.ch },
      ];
    },
    openItem(ctx, idx, quiet) {
      const U = KP.u;
      ctx.tok = (ctx.tok || 0) + 1;
      ctx.idx = (idx + ctx.items.length) % ctx.items.length;
      const it = (ctx.it = ctx.items[ctx.idx]);
      ctx.cells = this.cellsOf(it);
      ctx.ci = 0;
      ctx.cellStars = [];
      ctx.vBook.classList.remove("on");
      ctx.vPage.classList.add("on");
      ctx.stamp.classList.remove("on");
      ctx.vPage.style.setProperty("--c", it.color);
      // 공책 줄 칸
      ctx.line.innerHTML = "";
      ctx.cellEls = ctx.cells.map((c, i) => {
        const e = U.el("div", "hwCell", c.ch && it.kind === "word" ? c.ch : String(i + 1));
        ctx.line.appendChild(e);
        return e;
      });
      if (!quiet) KP.audio.sfx("open");
      const intro =
        it.kind === "line" ? it.guide : it.kind === "word" ? U.josa(it.say, "을/를") + " 써 봐요! 한 글자씩!" : U.josa(it.say, "을/를") + " 써 봐요!";
      KP.voice.say(intro);
      this.startCell(ctx);
    },
    startCell(ctx) {
      const U = KP.u;
      const it = ctx.it;
      const cell = (ctx.cell = ctx.cells[ctx.ci]);
      ctx.cellEls.forEach((e, i) => e.classList.toggle("cur", i === ctx.ci));
      // 왼쪽 본보기
      const big = it.kind === "line" ? KP.E(it.from) + (it.to !== it.from ? '<span style="font-size:.5em;color:#c9cede">→</span>' + KP.E(it.to) : "") : it.kind === "word" ? cell.ch : it.label;
      const step = it.kind === "line" ? (cell.mode === "dot" ? "① 점선 따라 긋기" : ctx.ci === 1 ? "② 흐린 선 따라 긋기" : "③ 한 번 더!") : cell.mode === "dot" ? "① 보고 따라 쓰기" : cell.mode === "faint" ? "② 흐린 글씨 따라 쓰기" : "③ 보고 혼자 쓰기";
      let pic = "";
      if (it.kind === "line") pic = '<div class="pic"><span>' + it.name + "</span></div>";
      else if (it.word) pic = '<div class="pic">' + KP.E(it.word[1]) + "<span>" + (it.kind === "word" ? it.word[0] : "<b>" + it.word[0][0] + "</b>" + it.word[0].slice(1)) + "</span></div>";
      ctx.model.innerHTML = '<div class="hwStepName">' + step + '</div><div class="big">' + big + "</div>" + pic;
      ctx.bShow.classList.toggle("hwDone", !(cell.mode === "dot"));
      ctx.bDone.classList.remove("glowNext");
      this.fit(ctx);
      this.cellReset(ctx);
      const say = cell.mode === "dot" ? (cell.demo ? "잘 봐요! 이렇게 써요." : "점선을 따라 써요!") : cell.mode === "faint" ? "흐린 글씨를 따라 써요!" : "이번엔 혼자 써 볼까요? 옆의 글자를 보고 써요!";
      ctx.say((it.kind === "line" ? "〰️ " : "✍️ ") + step.replace(/^. /, "") + (it.kind === "word" ? " · " + cell.ch : ""), false);
      ctx.instr = say;
      if (cell.demo && (ctx.ci === 0 || it.kind === "word")) ctx.after(it.kind === "word" && ctx.ci > 0 ? 200 : 900, () => this.demo(ctx));
      else KP.voice.say(say);
      ctx.hint(() => this.startPoint(ctx), cell.mode === "alone" ? "옆의 글자를 보고 써요!" : "노란 동그라미에서 시작해요!");
    },
    fit(ctx) {
      const w = ctx.board.clientWidth,
        h = ctx.board.clientHeight;
      if (!w || !h) return;
      const sz = Math.max(150, Math.min(w - 10, h - 10, 640));
      const d = Math.min(devicePixelRatio || 1, 2);
      [ctx.gcv, ctx.icv].forEach((c) => {
        c.style.width = c.style.height = sz + "px";
        c.width = c.height = Math.round(sz * d);
      });
    },
    /** 획을 잘게 나눈 점 (획 진행 순서대로) */
    points(strokes) {
      const out = [];
      (strokes || []).forEach((s, si) => {
        if (s.o) {
          const [cx, cy, r] = s.o;
          const n = Math.max(10, Math.ceil((2 * Math.PI * r) / 3));
          for (let k = 0; k <= n; k++) {
            const a = -Math.PI / 2 - (k / n) * Math.PI * 2; // 위에서 시작, 시계 반대 방향
            out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, s: si, hit: false });
          }
        } else {
          for (let k = 1; k < s.length; k++) {
            const [x1, y1] = s[k - 1],
              [x2, y2] = s[k];
            const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
            for (let j = k === 1 ? 0 : 1; j <= n; j++) out.push({ x: x1 + ((x2 - x1) * j) / n, y: y1 + ((y2 - y1) * j) / n, s: si, hit: false });
          }
        }
      });
      return out;
    },
    cellReset(ctx) {
      const T = ctx.T;
      const c = ctx.cell;
      T.pts = this.points(c.strokes);
      T.n = (c.strokes || []).length;
      T.sdone = new Array(T.n).fill(false);
      T.done = false;
      T.ink = [];
      T.segs = [];
      T.pid = null;
      T.last = null;
      T.demoing = false;
      ctx.dtok = (ctx.dtok || 0) + 1;
      T.color = ctx.it.kind === "line" ? ctx.it.color : "#33395e";
      ctx.icv.getContext("2d").clearRect(0, 0, ctx.icv.width, ctx.icv.height);
      this.drawGuide(ctx);
    },
    /** 아래 판: 공책 칸 + 안내 글씨 */
    drawGuide(ctx) {
      const T = ctx.T,
        c = ctx.cell,
        it = ctx.it;
      const cv = ctx.gcv,
        g = cv.getContext("2d");
      const k = cv.width / 100;
      g.clearRect(0, 0, cv.width, cv.height);
      // 십자 점선 (쓰기 칸)
      g.strokeStyle = "#f6c9bd";
      g.lineWidth = 0.7 * k;
      g.setLineDash([2 * k, 2 * k]);
      g.beginPath();
      g.moveTo(50 * k, 0);
      g.lineTo(50 * k, 100 * k);
      g.moveTo(0, 50 * k);
      g.lineTo(100 * k, 50 * k);
      g.stroke();
      g.setLineDash([]);
      const strokes = c.strokes || [];
      const path = (s) => {
        g.beginPath();
        if (s.o) g.arc(s.o[0] * k, s.o[1] * k, s.o[2] * k, 0, Math.PI * 2);
        else s.forEach(([x, y], j) => (j ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)));
      };
      const lw = (c.syl ? 9 : 13) * k;
      g.lineCap = g.lineJoin = "round";
      const nextS = T.sdone.indexOf(false);
      strokes.forEach((s, si) => {
        if (c.mode === "alone" && !T.done) return;
        const done = T.sdone[si];
        g.strokeStyle = done ? it.color : c.mode === "dot" ? "#e4e7f1" : "#eff1f7";
        g.globalAlpha = done ? 0.28 : 1;
        g.lineWidth = lw;
        path(s);
        g.stroke();
        g.globalAlpha = 1;
        if (c.mode === "dot" && !done) {
          g.strokeStyle = "#9aa3c4";
          g.lineWidth = 1.3 * k;
          g.setLineDash([2.4 * k, 2.6 * k]);
          path(s);
          g.stroke();
          g.setLineDash([]);
        }
      });
      // 방향 화살표 (따라 쓰기 칸)
      if (c.mode === "dot") {
        strokes.forEach((s, si) => {
          if (T.sdone[si]) return;
          const P = T.pts.filter((q) => q.s === si);
          if (P.length < 4) return;
          const a = P[Math.floor(P.length * 0.5)],
            b = P[Math.min(P.length - 1, Math.floor(P.length * 0.5) + 2)];
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          // 획 옆으로 살짝 비켜서 그림
          const off = (c.syl ? 7.5 : 10.5) * k;
          const ox = Math.cos(ang - Math.PI / 2) * off,
            oy = Math.sin(ang - Math.PI / 2) * off;
          const x = a.x * k + ox,
            y = a.y * k + oy,
            L = (c.syl ? 4 : 5.5) * k;
          g.strokeStyle = "#ff7452";
          g.fillStyle = "#ff7452";
          g.lineWidth = 1.2 * k;
          g.beginPath();
          g.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L);
          g.lineTo(x + Math.cos(ang) * L * 0.4, y + Math.sin(ang) * L * 0.4);
          g.stroke();
          g.beginPath();
          g.moveTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L);
          g.lineTo(x + Math.cos(ang + 2.5) * L * 0.6, y + Math.sin(ang + 2.5) * L * 0.6);
          g.lineTo(x + Math.cos(ang - 2.5) * L * 0.6, y + Math.sin(ang - 2.5) * L * 0.6);
          g.closePath();
          g.fill();
        });
      }
      // 시작점 번호 (따라 쓰기: 모든 획 / 흐린 글씨: 다음 획만)
      if (!T.done && c.mode !== "alone") {
        strokes.forEach((s, si) => {
          if (T.sdone[si]) return;
          if (c.mode === "faint" && si !== nextS) return;
          let p = T.pts.find((q) => q.s === si);
          if (!p) return;
          // 앞 획과 시작점이 겹치면(ㄷ·ㄹ·ㅁ·ㅌ) 번호를 이 획 쪽으로 조금 옮겨 둘 다 보이게
          const clash = strokes.some((_, sj) => {
            if (sj >= si) return false;
            const q = T.pts.find((z) => z.s === sj);
            return q && Math.hypot(q.x - p.x, q.y - p.y) < 6;
          });
          if (clash) {
            const mine = T.pts.filter((z) => z.s === si);
            p = mine.find((z) => Math.hypot(z.x - p.x, z.y - p.y) >= (c.syl ? 8 : 11)) || p;
          }
          const r = (c.syl ? 4.2 : 5.6) * k;
          const isNext = si === nextS;
          g.fillStyle = isNext ? "#ffd23f" : "#fff";
          g.strokeStyle = isNext ? "#fff" : "#c3c9dd";
          g.lineWidth = 1.2 * k;
          g.beginPath();
          g.arc(p.x * k, p.y * k, r, 0, Math.PI * 2);
          g.fill();
          g.stroke();
          if (it.kind !== "line" && T.n > 1) {
            g.fillStyle = isNext ? "#1b2550" : "#8b93b3";
            g.font = r * 1.3 + "px Jua, sans-serif";
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText(String(si + 1), p.x * k, p.y * k + 0.06 * r);
          }
        });
      }
      // 선 긋기: 출발·도착 그림
      if (it.kind === "line" && T.pts.length) {
        const P = T.pts;
        const a = P[0],
          z = P[P.length - 1];
        KP.drawE(g, it.from, a.x * k, a.y * k, 14 * k);
        if (it.to !== it.from || Math.hypot(a.x - z.x, a.y - z.y) > 10) KP.drawE(g, it.to, z.x * k, z.y * k, 14 * k);
      }
    },
    startPoint(ctx) {
      const T = ctx.T;
      if (!ctx.vPage.classList.contains("on") || T.done || T.demoing) return null;
      const ni = T.sdone.indexOf(false);
      const p = T.pts.find((q) => q.s === ni);
      if (!p) return null;
      const r = ctx.icv.getBoundingClientRect();
      return { x: r.left + (p.x / 100) * r.width, y: r.top + (p.y / 100) * r.height };
    },

    /* ---- 획순 시범: 연필이 한 획씩 써 보임 ---- */
    demo(ctx) {
      const T = ctx.T;
      const c = ctx.cell;
      if (!c || c.mode !== "dot" || ctx.T.done) return;
      const tok = ctx.tok; // 화면을 떠나면 멈춤
      const dtok = (ctx.dtok = (ctx.dtok || 0) + 1); // 다시 보기를 누르면 이전 시범 멈춤
      const alive = () => tok === ctx.tok && dtok === ctx.dtok && ctx.cell === c;
      T.demoing = true;
      const g = ctx.icv.getContext("2d");
      const k = ctx.icv.width / 100;
      const byS = [];
      T.pts.forEach((p) => (byS[p.s] = byS[p.s] || []).push(p));
      const lw = (c.syl ? 6.5 : 8.5) * k;
      let si = 0,
        j = 0,
        pause = 0;
      const speed = c.syl ? 85 : 75; // 점/초
      KP.voice.say(ctx.it.kind === "line" ? "잘 봐요! 이렇게 그어요." : "잘 봐요! 하나, 둘, 차례대로 써요.");
      const drawUpTo = () => {
        g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
        g.strokeStyle = ctx.it.color;
        g.lineWidth = lw;
        g.lineCap = g.lineJoin = "round";
        for (let s = 0; s <= si && s < byS.length; s++) {
          const P = byS[s];
          const upto = s < si ? P.length : Math.min(P.length, Math.floor(j) + 1);
          if (upto < 1) continue;
          g.beginPath();
          g.moveTo(P[0].x * k, P[0].y * k);
          for (let q = 1; q < upto; q++) g.lineTo(P[q].x * k, P[q].y * k);
          g.stroke();
        }
        const P = byS[Math.min(si, byS.length - 1)];
        if (!P || !P.length) return;
        const tip = P[Math.max(0, Math.min(P.length - 1, Math.floor(j)))];
        KP.drawE(g, "✏️", tip.x * k + 6 * k, tip.y * k - 6 * k, 13 * k);
      };
      KP.audio.note(KP.audio.SCALE[0], { inst: "marimba", dur: 0.2, vol: 0.2 });
      if (!byS.length) return;
      ctx.loop((dt) => {
        if (!alive()) return false;
        if (pause > 0) {
          pause -= dt;
          return;
        }
        j += dt * speed;
        if (j >= byS[si].length - 1) {
          j = byS[si].length - 1;
          drawUpTo();
          si++;
          j = 0;
          pause = c.syl ? 0.22 : 0.35;
          if (si >= byS.length) {
            ctx.after(700, () => {
              if (!alive()) return;
              g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
              T.demoing = false;
              KP.voice.say(ctx.it.kind === "line" ? "이제 따라 그어 봐요! 동그라미에서 시작!" : "이제 따라 써 봐요! 1번 동그라미부터!");
              ctx.hint(() => this.startPoint(ctx), "노란 동그라미에서 시작해요!");
            });
            return false;
          }
          KP.audio.note(KP.audio.SCALE[(si * 2) % 8], { inst: "marimba", dur: 0.2, vol: 0.2 });
          return;
        }
        drawUpTo();
      });
    },

    /* ---- 펜·손가락 입력 ---- */
    setupInk(ctx) {
      const U = KP.u;
      const ink = ctx.icv;
      const g = ink.getContext("2d");
      const T = (ctx.T = { pts: [], pid: null, pen: false, ink: [], segs: [] });
      const pos = (e) => {
        const r = ink.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, p: e.pressure };
      };
      const width = (p) => (ctx.cell && ctx.cell.syl ? 0.75 : 1) * (T.isPen ? 3.5 + 6 * Math.min(1, p > 0 ? p : 0.5) : 7.5);
      ink.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        KP.audio.unlock();
        if (e.pointerType === "pen") T.pen = true;
        else if (T.pen && e.pointerType === "touch") return; // 펜으로 쓰는 중 손바닥
        if (T.done || T.demoing || T.pid !== null || !ctx.cell) return;
        T.pid = e.pointerId;
        try {
          ink.setPointerCapture(e.pointerId);
        } catch (_) {}
        T.isPen = e.pointerType === "pen";
        T.last = pos(e);
        const w = width(T.last.p);
        T.segs.push([T.last.x, T.last.y, T.last.x, T.last.y, w]);
        const k = ink.width / 100;
        g.fillStyle = T.color;
        g.beginPath();
        g.arc(T.last.x * k, T.last.y * k, (w / 2) * k, 0, Math.PI * 2);
        g.fill();
        T.ink.push({ x: T.last.x, y: T.last.y });
        this.hit(ctx, T.last);
      });
      ink.addEventListener("pointermove", (e) => {
        if (e.pointerId !== T.pid || T.done) return;
        const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        const list = evs.length ? evs : [e];
        const k = ink.width / 100;
        g.strokeStyle = T.color;
        g.lineCap = g.lineJoin = "round";
        for (const ev of list) {
          const p = pos(ev);
          const d = U.dist(T.last.x, T.last.y, p.x, p.y);
          if (d < 0.25) continue;
          const w = width(p.p);
          g.lineWidth = w * k;
          g.beginPath();
          g.moveTo(T.last.x * k, T.last.y * k);
          g.lineTo(p.x * k, p.y * k);
          g.stroke();
          T.segs.push([T.last.x, T.last.y, p.x, p.y, w]);
          const n = Math.max(1, Math.ceil(d / 2));
          for (let j = 1; j <= n; j++) {
            const q = { x: T.last.x + ((p.x - T.last.x) * j) / n, y: T.last.y + ((p.y - T.last.y) * j) / n };
            T.ink.push(q);
            this.hit(ctx, q);
          }
          if (d > 1.2 && Math.random() < 0.12) KP.audio.sfx("rub");
          T.last = p;
          if (T.done) break;
        }
      });
      const end = (e) => {
        if (e.pointerId !== T.pid) return;
        T.pid = null;
        T.last = null;
        // 혼자 쓰기·흐린 글씨: 어느 정도 썼으면 [다 썼어요] 반짝
        if (!T.done && T.ink.length > 25) ctx.bDone.classList.add("glowNext");
      };
      ink.addEventListener("pointerup", end);
      ink.addEventListener("pointercancel", end);
      ink.addEventListener("lostpointercapture", end);
    },
    redrawInk(ctx) {
      const T = ctx.T;
      const g = ctx.icv.getContext("2d"),
        k = ctx.icv.width / 100;
      g.clearRect(0, 0, ctx.icv.width, ctx.icv.height);
      g.strokeStyle = T.color;
      g.lineCap = g.lineJoin = "round";
      T.segs.forEach(([a, b, c, d, w]) => {
        g.lineWidth = w * k;
        g.beginPath();
        g.moveTo(a * k, b * k);
        g.lineTo(c * k + 0.01, d * k);
        g.stroke();
      });
    },
    /** 펜 근처의 안내 점을 '지나감'으로 → 획마다 85% 지나면 그 획 완성 */
    hit(ctx, p) {
      const T = ctx.T,
        c = ctx.cell;
      if (T.done) return;
      const R = c.syl ? 7.5 : c.mode === "alone" ? 12 : 10;
      for (const q of T.pts) if (!q.hit && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) q.hit = true;
      let changed = false;
      for (let si = 0; si < T.n; si++) {
        if (T.sdone[si]) continue;
        const mine = T.pts.filter((q) => q.s === si);
        if (mine.filter((q) => q.hit).length / mine.length >= 0.85) {
          T.sdone[si] = true;
          changed = true;
          if (c.mode !== "alone") KP.audio.note(KP.audio.SCALE[(si * 2) % 8], { inst: "marimba", dur: 0.22, vol: 0.2 });
        }
      }
      if (!changed) return;
      if (c.mode !== "alone") this.drawGuide(ctx);
      if (T.sdone.every(Boolean)) this.finishCell(ctx, false);
    },
    /** 칸 채점: 따라간 정도(coverage) + 선 안에 쓴 정도(accuracy) → 별 1~3 */
    grade(ctx) {
      const T = ctx.T,
        c = ctx.cell;
      const cov = T.pts.length ? T.pts.filter((q) => q.hit).length / T.pts.length : 0;
      const R = c.syl ? 8 : 11;
      let inside = 0;
      for (const p of T.ink) {
        for (const q of T.pts) {
          if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) {
            inside++;
            break;
          }
        }
      }
      const acc = T.ink.length ? inside / T.ink.length : 0;
      const sc = 0.6 * cov + 0.4 * acc;
      return sc >= 0.82 ? 3 : sc >= 0.58 ? 2 : 1;
    },
    finishCell(ctx, byButton) {
      const U = KP.u;
      const T = ctx.T;
      if (T.done || T.demoing || !ctx.cell) return;
      if (byButton && T.ink.length < 8) {
        KP.voice.say("먼저 써 볼까요? 동그라미에서 시작해요!");
        return;
      }
      T.done = true;
      T.pid = null;
      const st = this.grade(ctx);
      ctx.cellStars[ctx.ci] = st;
      this.drawGuide(ctx);
      // 공책 줄 칸에 작게 남기기
      const cellEl = ctx.cellEls[ctx.ci];
      const mini = document.createElement("canvas");
      mini.width = mini.height = 120;
      const mg = mini.getContext("2d");
      mg.fillStyle = "#fff";
      mg.fillRect(0, 0, 120, 120);
      mg.globalAlpha = 0.5;
      mg.drawImage(ctx.gcv, 0, 0, 120, 120);
      mg.globalAlpha = 1;
      mg.drawImage(ctx.icv, 0, 0, 120, 120);
      cellEl.innerHTML = "";
      cellEl.appendChild(mini);
      cellEl.appendChild(U.el("span", "s", "★".repeat(st)));
      KP.audio.sfx("good");
      KP.voice.say(U.pick(st === 3 ? ["와, 아주 잘 썼어요!", "멋져요!", "최고예요!"] : st === 2 ? ["잘했어요!", "좋아요!"] : ["좋아요! 다음엔 선을 따라가 봐요!", "잘했어요! 점선을 보며 써요!"]));
      ctx.bDone.classList.remove("glowNext");
      const tok = ctx.tok;
      ctx.after(1100, () => {
        if (tok !== ctx.tok) return;
        if (ctx.ci < ctx.cells.length - 1) {
          ctx.ci++;
          this.startCell(ctx);
        } else this.finishItem(ctx);
      });
    },
    finishItem(ctx) {
      const U = KP.u;
      const it = ctx.it;
      const avg = ctx.cellStars.reduce((a, b) => a + b, 0) / ctx.cellStars.length;
      const stars = Math.max(1, Math.min(3, Math.round(avg)));
      const prev = ctx.stars[it.id] || 0;
      ctx.stars[it.id] = Math.max(prev, stars);
      KP.store.set("hw:stars", ctx.stars);
      ctx.cellEls.forEach((e) => e.classList.remove("cur"));
      const word = stars === 3 ? "참 잘했어요" : stars === 2 ? "잘했어요" : "좋아요";
      ctx.stamp.innerHTML = "";
      const seal = U.el("div", "hwSeal", word.replace(" ", "<br>") + "<small>" + (it.kind === "line" ? it.name : it.label) + "</small>");
      const starsEl = U.el("div", "hwStars", [1, 2, 3].map((n) => '<span class="' + (n <= stars ? "" : "off") + '">' + KP.E("⭐") + "</span>").join(""));
      const row = U.el("div", "hwRes");
      const bRe = U.btn(KP.E("🔄") + " 한 번 더", "btn big");
      const bNext = U.btn("다음 " + KP.E("▶️"), "btn big primary");
      const bList = U.btn(KP.E("📒") + " 목차", "btn big");
      row.append(bRe, bNext, bList);
      ctx.stamp.append(seal, starsEl, row);
      ctx.stamp.classList.add("on");
      ctx.tap(bRe, () => this.openItem(ctx, ctx.idx));
      ctx.tap(bNext, () => this.openItem(ctx, ctx.idx + 1));
      ctx.tap(bList, () => this.showBook(ctx));
      KP.audio.sfx("sparkle");
      KP.voice.say(word + "! " + (it.kind === "line" ? it.name : it.say) + " 완성!");
      ctx.hint(() => (ctx.stamp.classList.contains("on") ? bNext : null), "다음 것도 써 볼까요?");
      KP.confetti && KP.confetti(stars === 3 ? 160 : 90);
      // 세 개 완성할 때마다 스티커 한 장
      const n = (KP.store.get("hw:count", 0) || 0) + 1;
      KP.store.set("hw:count", n);
      if (n % 3 === 0 && KP.stickers) {
        const [e, nm] = KP.stickers.award();
        ctx.after(1600, () => KP.toast(e + " " + nm + " 스티커를 받았어요!"));
      }
    },
  });
})();
