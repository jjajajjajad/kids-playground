/* 규칙 찾기 — 줄의 다음에 올 것을 끌어서 빈칸에 쏙!
   1단계: AB AB (보기 2개)
   2단계: AAB · ABC (보기 3개)
   3단계: ABB · AABB · 두 가지 속성(모양은 번갈아, 색은 두 개씩) (보기 3~4개)
   - 판이 시작되면 줄이 순서대로 통통 튀며 리듬으로 들려줌
   - 맞으면 줄 전체가 순서대로 튀며 리듬 소리 */
"use strict";
KP.game({
  id: "pattern",
  icon: "🔁",
  name: "규칙 찾기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("pattern", `
      .ptWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 12px 14px;gap:10px}
      .ptRow{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--pg,10px);padding:clamp(12px,2vw,20px);border-radius:30px;background:rgba(255,255,255,.75);box-shadow:var(--shadow);max-width:100%}
      .ptCell{width:var(--cs,96px);height:var(--cs,96px);border-radius:24%;background:#fff;box-shadow:0 5px 0 rgba(47,58,102,.12);display:flex;align-items:center;justify-content:center;font-size:calc(var(--cs,96px)*.72);line-height:1;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*45ms)}
      .ptCell.slot{background:rgba(255,255,255,.5);border:4px dashed #f29a00;box-shadow:none;position:relative}
      .ptCell.slot .q{font-size:.6em;opacity:.55;animation:ptQ 1.4s ease-in-out infinite}
      .ptCell.slot.filled{border-style:solid;background:#fff6d6}
      .ptCell.slot.filled .q{display:none}
      @keyframes ptQ{50%{transform:scale(1.18) rotate(8deg)}}
      .ptCell.beat{animation:ptBeat .32s}
      @keyframes ptBeat{40%{transform:translateY(-18%) scale(1.12)}}
      .ptOpts{display:flex;gap:clamp(14px,3vw,34px);justify-content:center;flex-wrap:wrap}
      .ptOpt{width:clamp(92px,13vw,136px);height:clamp(92px,13vw,136px);border-radius:28px;background:#fff;box-shadow:0 8px 0 rgba(47,58,102,.14);display:flex;align-items:center;justify-content:center;font-size:clamp(64px,9.4vw,100px);line-height:1;animation:itemIn .35s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*70ms + .2s)}
      .ptCell.slot .ptOpt{position:absolute;inset:-4px;width:auto;height:auto;font-size:inherit;box-shadow:none;background:transparent;animation:popIn .3s}
    `);
    ctx.wrap = U.el("div", "ptWrap");
    ctx.row = U.el("div", "ptRow");
    ctx.opts = U.el("div", "ptOpts");
    ctx.wrap.append(ctx.row, ctx.opts);
    ctx.body.appendChild(ctx.wrap);

    ctx.SETS = [
      [["🍎", "사과"], ["🍌", "바나나"], ["🍇", "포도"], ["🍓", "딸기"], ["🍉", "수박"]],
      [["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰"], ["🐸", "개구리"]],
      [["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚀", "로켓"], ["🚲", "자전거"]],
      [["☀️", "해님"], ["🌙", "달님"], ["⭐", "별"], ["☁️", "구름"], ["🌈", "무지개"]],
      [["🔴", "빨강"], ["🔵", "파랑"], ["🟡", "노랑"], ["🟢", "초록"], ["🟣", "보라"]],
    ];
    // 두 가지 속성: 모양 × 색
    ctx.SHAPE2 = {
      circle: { name: "동그라미", r: "🔴", b: "🔵", y: "🟡", g: "🟢" },
      square: { name: "네모", r: "🟥", b: "🟦", y: "🟨", g: "🟩" },
      heart: { name: "하트", r: "❤️", b: "💙", y: "💛", g: "💚" },
    };
    ctx.COLORN = { r: "빨간", b: "파란", y: "노란", g: "초록" };
    ctx.NOTES = ["C5", "E5", "G5", "A5"];

    // 줄 크기: 한 줄에 다 들어가면 한 줄, 아니면 두 줄
    ctx.ptSize = () => {
      const n = ctx.row.children.length;
      if (!n) return;
      const W = ctx.body.clientWidth - 24 - 40,
        H = ctx.body.clientHeight;
      const gap = W < 600 ? 8 : 12;
      let per = n,
        cs = W / per - gap;
      if (cs < 74 && n > 3) {
        per = Math.ceil(n / 2);
        cs = W / per - gap;
      }
      cs = Math.min(cs, 124, H * 0.26);
      ctx.row.style.setProperty("--cs", Math.floor(cs) + "px");
      ctx.row.style.setProperty("--pg", gap + "px");
      ctx.row.style.maxWidth = per * (cs + gap) + 40 + 4 + "px";
    };
    addEventListener("resize", () => ctx._active && ctx.ptSize());
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  /** 이번 판 규칙 만들기 → {seq:[아이템], answer, options, label} */
  make(ctx) {
    const U = KP.u,
      lv = ctx.level;
    const rule = U.pick(lv === 1 ? ["AB"] : lv === 2 ? ["AAB", "ABC"] : ["ABB", "AABB", "TWO", "TWO"]);
    if (rule === "TWO") {
      const [sa, sb] = U.sample(Object.keys(ctx.SHAPE2), 2);
      const [ca, cb] = U.sample(["r", "b", "y", "g"], 2);
      const item = (s, c) => ({ em: ctx.SHAPE2[s][c], name: ctx.COLORN[c] + " " + ctx.SHAPE2[s].name, sym: (s === sa ? 0 : 1) + (c === ca ? 0 : 2) });
      // 모양은 AB, 색은 AABB → 4개가 한 묶음
      const unit = [item(sa, ca), item(sb, ca), item(sa, cb), item(sb, cb)];
      const shown = U.pick([6, 7]);
      const seq = Array.from({ length: shown }, (_, k) => unit[k % 4]);
      const answer = unit[shown % 4];
      // 헷갈리는 보기: 모양만 맞음, 색만 맞음
      const sameShape = unit.find((u) => u !== answer && (u.sym & 1) === (answer.sym & 1));
      const sameColor = unit.find((u) => u !== answer && (u.sym & 2) === (answer.sym & 2));
      return { seq, answer, options: U.shuffle([answer, sameShape, sameColor]), rule, two: true };
    }
    const syms = [...new Set(rule)];
    const set = U.pick(ctx.SETS);
    const items = U.sample(set, syms.length + 1).map(([em, name], k) => ({ em, name, sym: k }));
    const symItem = {};
    syms.forEach((s, k) => (symItem[s] = items[k]));
    const P = rule.length;
    const shownChoices = lv === 1 ? [4, 5] : rule === "AABB" ? [8, 9] : [6, 7, 8];
    const shown = U.pick(shownChoices.filter((n) => n >= P * 2 - 1));
    const seq = Array.from({ length: shown }, (_, k) => symItem[rule[k % P]]);
    const answer = symItem[rule[shown % P]];
    let options = syms.map((s) => symItem[s]);
    const nOpt = lv === 1 ? 2 : 3;
    if (options.length < nOpt) options.push(items[syms.length]);
    options = U.shuffle(options.slice(0, Math.max(nOpt, options.length)));
    return { seq, answer, options, rule };
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const g = this.make(ctx);
    ctx.g = g;
    ctx.row.innerHTML = "";
    ctx.opts.innerHTML = "";
    const cells = g.seq.map((it, k) => {
      const c = U.el("div", "ptCell", KP.E(it.em));
      c.style.setProperty("--i", k);
      c.dataset.sym = it.sym;
      ctx.row.appendChild(c);
      return c;
    });
    const slot = U.el("div", "ptCell slot", '<span class="q">' + KP.E("❓") + "</span>");
    slot.style.setProperty("--i", cells.length);
    ctx.row.appendChild(slot);
    ctx.ptSize();
    let busy = false;
    const beat = (upto, then) => {
      const all = [...cells, ...(slot.classList.contains("filled") ? [slot] : [])].slice(0, upto);
      all.forEach((c, k) =>
        ctx.after(k * 330, () => {
          U.replay(c, "beat");
          const sym = +c.dataset.sym;
          A.note(ctx.NOTES[sym % 4], { inst: "marimba", dur: 0.3, vol: 0.26 });
        })
      );
      if (then) ctx.after(all.length * 330 + 150, then);
    };
    const opts = g.options.map((it, i) => {
      const o = U.el("div", "ptOpt item", KP.E(it.em));
      o.style.setProperty("--i", i);
      const right = it === g.answer;
      ctx.opts.appendChild(o);
      let lastTap = 0;
      const d = KP.drag(o, {
        targets: () => (busy ? [] : [slot]),
        accept: () => right,
        onReject: () => {
          ctx.miss(o, U.pick(["음, 다시 볼까요? 다음은 뭐가 올 차례일까?", "아깝다! 줄을 다시 들어 봐요.", "다시 생각해 봐요!"]));
          ctx.after(900, () => beat(cells.length));
        },
        onDrop: (t) => {
          if (!t) {
            const now = performance.now();
            if (now - lastTap > 2500) {
              lastTap = now;
              KP.voice.say(it.name + "! 빈칸으로 끌어 봐요.");
            }
            return;
          }
          busy = true;
          d.lock();
          o.style.transform = "";
          slot.dataset.sym = it.sym;
          slot.appendChild(o);
          slot.classList.add("filled");
          A.sfx("snap");
          ctx.hint(null);
          // 줄 전체가 순서대로 튀며 리듬
          ctx.after(250, () =>
            beat(cells.length + 1, async () => {
              ctx.score.add();
              ctx.round++;
              const big = ctx.round % 4 === 0;
              const ok = await ctx.win({ big, msg: big ? "규칙 박사 형아!" : "딩동댕! " + it.name + "!" });
              if (ok) this.next(ctx);
            })
          );
        },
      });
      o.dataset.right = right ? "1" : "";
      return o;
    });
    ctx.say(g.two ? "모양도 색도 잘 봐요! 빈칸에는 무엇이 올까요?" : "줄을 잘 봐요! 빈칸에 올 것을 끌어다 넣어요.");
    // 처음에 줄을 리듬으로 들려주기
    ctx.after(700, () => beat(cells.length, () => U.replay(slot, "wig")));
    ctx.hint(() => opts.find((o) => o.dataset.right), "빈칸에 들어갈 것을 끌어다 놓아요!");
  },
});
