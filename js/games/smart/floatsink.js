/* 둥실? 퐁당! — 물건을 물에 넣어 뜨는지 가라앉는지 직접 보는 탐구 놀이
   1단계: 자유롭게 넣어 보기 (물건 4개) — 별 없는 탐구형 (해 본 것을 칭찬)
   2단계: 넣기 전에 '뜰까? 가라앉을까?' 예상(둥실/퐁당 그림) → 넣어서 확인 (물건 3개)
   3단계: 두 물건 비교 — "어느 게 둥실 뜰까?" 하나 고르고 같이 넣기 (3쌍)
   열쇠 별: 2·3단계는 보기가 2개라 한 번만으로는 '찍어도 반' → 한 판의 예상 3번이 모두 맞을 때만 깨끗한 판
            (찍어서 다 맞힐 확률 1/8 — 보기 3개 한 문제(1/3)보다 낮음). 하나라도 다르면 _fewChoice 로 별 없음.
            예상이 달라도 틀림 소리·단계 내림 없음(직접 해 보고 알게 되는 놀이).
   물건: 실제로 결과가 분명한 것만. "큰 건 가라앉아" 같은 잘못된 일반화가 안 생기게
         큰데 뜨는 것(나무토막·수박)과 작은데 가라앉는 것(동전·열쇠·나사·반지)을 판마다 꼭 섞고,
         말도 "커도 둥실 떠요 / 작아도 퐁당 가라앉아요". '가벼워서 뜬다' 같은 이유는 말하지 않음(동전도 가벼움). */
"use strict";
KP.game({
  id: "floatsink",
  icon: "🦆",
  name: "둥실? 퐁당!",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("floatsink", `
      .fsWrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);padding:2px 12px 12px;--surf:34%}
      .fsTank{position:relative;flex:1 1 0;min-height:150px;border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#f4fbff,#e3f3ff);border:6px solid rgba(255,255,255,.95);box-shadow:0 8px 0 rgba(47,58,102,.12),inset 0 0 0 2px rgba(80,150,210,.25);touch-action:none}
      .fsTank.dropHover{box-shadow:0 0 0 8px rgba(255,197,49,.45),0 8px 0 rgba(47,58,102,.12)}
      .fsWater{position:absolute;left:0;right:0;top:var(--surf);bottom:0;background:linear-gradient(180deg,rgba(110,195,245,.82),rgba(45,130,215,.9));transition:transform .3s}
      .fsWater::before{content:"";position:absolute;left:-40px;right:-40px;top:-11px;height:12px;background:radial-gradient(20px 12px at 50% 100%,rgba(110,195,245,.82) 98%,transparent 101%) 0 0/40px 12px repeat-x;animation:fsWave 2.6s linear infinite}
      .fsWater::after{content:"";position:absolute;left:8%;right:8%;top:10px;height:5px;border-radius:9px;background:rgba(255,255,255,.35)}
      @keyframes fsWave{to{transform:translateX(40px)}}
      .fsTank.slosh .fsWater{animation:fsSlosh .7s ease-out}
      @keyframes fsSlosh{25%{transform:translateY(-6px)}55%{transform:translateY(3px)}80%{transform:translateY(-1px)}}
      .fsSand{position:absolute;left:0;right:0;bottom:0;height:9%;background:radial-gradient(circle at 20% 30%,#e9c98d 3px,transparent 4px) 0 0/26px 14px,linear-gradient(180deg,#f2d79e,#dcb873)}
      .fsObj{position:absolute;width:var(--ts,80px);height:var(--ts,80px);margin:calc(var(--ts,80px)*-.5) 0 0 calc(var(--ts,80px)*-.5);display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}
      .fsObj .fsIn{font-size:calc(var(--ts,80px)*.8*var(--sc,1));line-height:1;display:block}
      .fsObj.bob .fsIn{animation:fsBob 2.2s ease-in-out infinite}
      @keyframes fsBob{50%{transform:translateY(5px) rotate(4deg)}}
      .fsObj.sinking .fsIn{animation:fsSway 1.5s ease-in-out}
      @keyframes fsSway{30%{transform:rotate(-12deg)}65%{transform:rotate(9deg)}}
      .fsTag{position:absolute;left:50%;top:-18%;transform:translateX(-50%);font-size:clamp(14px,1.9vw,20px);background:#fff;border-radius:999px;padding:2px 10px;white-space:nowrap;box-shadow:0 3px 0 rgba(47,58,102,.12);animation:popIn .3s}
      .fsObj.sunk .fsTag{top:auto;bottom:100%}
      .fsDrop{position:absolute;width:12px;height:16px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#8fd3ff;pointer-events:none;z-index:3;animation:fsDrop .75s ease-out forwards}
      @keyframes fsDrop{0%{transform:translate(-50%,0) scale(.6);opacity:1}55%{transform:translate(calc(-50% + var(--dx)*.7),var(--dy)) scale(1)}100%{transform:translate(calc(-50% + var(--dx)),calc(var(--dy)*.2 + 30px)) scale(.5);opacity:0}}
      .fsRing{position:absolute;width:30px;height:10px;margin-left:-15px;margin-top:-5px;border:3px solid rgba(255,255,255,.85);border-radius:50%;pointer-events:none;z-index:1;animation:fsRing .9s ease-out forwards}
      @keyframes fsRing{to{transform:scale(5);opacity:0}}
      .fsBub{position:absolute;width:12px;height:12px;margin-left:-6px;border-radius:50%;border:2px solid rgba(255,255,255,.85);background:rgba(255,255,255,.2);pointer-events:none;z-index:1;animation:fsBub 1.3s ease-in forwards}
      @keyframes fsBub{to{transform:translate(var(--dx),var(--rise)) scale(1.3);opacity:0}}
      .fsSide{flex:0 0 auto;display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);align-items:center}
      .fsPred{display:flex;gap:clamp(12px,3vw,30px);justify-content:center}
      .fsPred[hidden]{display:none}
      .fsPB{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px 6px;border-radius:24px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.14);font-size:clamp(18px,2.4vw,24px);color:var(--ink);min-width:96px}
      .fsPB:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(47,58,102,.14)}
      .fsPB.picked{background:#fff3c4;box-shadow:0 0 0 5px #ffc531,0 6px 0 rgba(47,58,102,.14)}
      .fsPB.off{opacity:.45}
      .fsMini{position:relative;width:var(--mw,84px);height:calc(var(--mw,84px)*.8);border-radius:14px;overflow:hidden;background:#eef8ff;border:3px solid #cfe7fb}
      .fsMini::before{content:"";position:absolute;left:0;right:0;top:36%;bottom:0;background:linear-gradient(180deg,#7ecbf6,#3a8fd9)}
      .fsMini .fsIn{position:absolute;left:50%;font-size:calc(var(--mw,84px)*.36);line-height:1;transform:translate(-50%,-50%)}
      .fsMini.up .fsIn{top:34%;animation:fsBob 2.2s ease-in-out infinite}
      .fsMini.down .fsIn{top:80%}
      .fsMini .fsArrow{position:absolute;right:4px;top:50%;font-size:calc(var(--mw,84px)*.22);transform:translateY(-50%)}
      .fsShelf{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,2vw,22px);padding:clamp(8px,1.4vh,14px) clamp(12px,2.4vw,26px) clamp(12px,1.8vh,18px);border-radius:26px;background:linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,255,255,.8)) padding-box;box-shadow:inset 0 -12px 0 #d9a96a,0 4px 0 rgba(47,58,102,.08);max-width:100%}
      .fsItem{width:var(--is,84px);height:var(--is,84px);display:flex;align-items:center;justify-content:center;border-radius:22px;background:#fff;box-shadow:0 6px 0 rgba(47,58,102,.12);position:relative}
      .fsItem .fsIn{font-size:calc(var(--is,84px)*.62*var(--sc,1));line-height:1;display:block}
      .fsItem.dragging{background:transparent;box-shadow:none;z-index:20}
      .fsItem.used{visibility:hidden}
      .fsItem.dim{opacity:.35}
      .fsItem.cur{box-shadow:0 0 0 5px #ffc531,0 6px 0 rgba(47,58,102,.12);animation:fsCur 1.4s ease-in-out infinite}
      @keyframes fsCur{50%{transform:scale(1.06)}}
      .fsItem.picked{background:#fff3c4;box-shadow:0 0 0 6px #ffc531,0 6px 0 rgba(47,58,102,.12)}
      .fsItem .fsSz{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:12px;color:var(--ink2);white-space:nowrap}
      .fsWrap.pair .fsItem{--is:var(--is2,110px)}
      @media (min-aspect-ratio:3/2) and (max-height:560px){
        .fsWrap{flex-direction:row;padding:2px 10px 8px}
        .fsTank{min-height:0}
        .fsSide{width:min(44vw,330px);justify-content:center}
        .fsShelf{gap:8px;padding:8px 10px 14px}
      }
    `);
    const wrap = (ctx.fsWrap = U.el("div", "fsWrap"));
    const tank = (ctx.tank = U.el("div", "fsTank"));
    tank.append(U.el("div", "fsWater"), U.el("div", "fsSand"));
    const side = U.el("div", "fsSide");
    ctx.pred = U.el("div", "fsPred");
    ctx.pred.hidden = true;
    ctx.shelf = U.el("div", "fsShelf");
    side.append(ctx.pred, ctx.shelf);
    wrap.append(tank, side);
    ctx.body.appendChild(wrap);

    // [그림, 이름, 뜨나?, 크기(big/mid/small), 결과 말]
    // 크기는 그림 크기(sc)로도 보여 줌 — 큰데 뜨는 것·작은데 가라앉는 것을 눈으로 보게
    const T = (em, name, fl, sz, line) => ({ em, name, fl, sz, line });
    ctx.FLOAT = [
      T("🪵", "나무토막", true, "big", "나무토막은 커도 둥실 떠요!"),
      T("🍉", "수박", true, "big", "수박은 커도 둥실 떠요!"),
      T("🦆", "오리", true, "mid", "오리는 둥실 떠요!"),
      T("🍎", "사과", true, "mid", "사과는 둥실 떠요!"),
      T("⚽", "공", true, "mid", "공은 둥실 떠요!"),
      T("🧊", "얼음", true, "mid", "얼음은 둥실 떠요!"),
      T("🍃", "나뭇잎", true, "small", "나뭇잎은 둥실 떠요!"),
      T("🪶", "깃털", true, "small", "깃털은 둥실 떠요!"),
    ];
    ctx.SINK = [
      T("🪨", "돌", false, "big", "돌은 퐁당 가라앉아요!"),
      T("⚓", "닻", false, "big", "닻은 퐁당 가라앉아요!"),
      T("🥄", "숟가락", false, "mid", "숟가락은 퐁당 가라앉아요!"),
      T("🪙", "동전", false, "small", "동전은 작아도 퐁당 가라앉아요!"),
      T("🔑", "열쇠", false, "small", "열쇠는 작아도 퐁당 가라앉아요!"),
      T("🔩", "나사", false, "small", "나사는 작아도 퐁당 가라앉아요!"),
      T("💍", "반지", false, "small", "반지는 작아도 퐁당 가라앉아요!"),
    ];
    ctx.SC = { big: 1.3, mid: 1, small: 0.76 };
    // 잘못된 일반화를 깨는 물건: 큰데 뜸 / 작은데 가라앉음
    ctx.isCounter = (t) => (t.fl && t.sz === "big") || (!t.fl && t.sz === "small");

    ctx.fsSize = () => {
      const r = tank.getBoundingClientRect();
      if (!r.width) return;
      tank.style.setProperty("--ts", Math.round(U.clamp(Math.min(r.height * 0.2, r.width * 0.17), 38, 110)) + "px");
      const row = getComputedStyle(wrap).flexDirection === "row";
      const vw = innerWidth,
        vh = innerHeight;
      const n = ctx.shelf.children.length || 4;
      // 선반 물건 크기: 폰 세로는 한 줄에, 폰 가로(옆 칸)는 두 줄까지
      let is;
      if (row) is = U.clamp(Math.min((Math.min(vw * 0.44, 330) - 30) / Math.min(n, 2) - 10, vh * 0.2), 58, 96);
      else is = U.clamp(Math.min((vw - 60) / n - 14, vh * 0.12), 60, 108);
      wrap.style.setProperty("--is", Math.round(is) + "px");
      wrap.style.setProperty("--is2", Math.round(row ? U.clamp(Math.min(vw * 0.17, vh * 0.3), 70, 120) : U.clamp(Math.min(vw * 0.3, vh * 0.16), 80, 140)) + "px");
      ctx.pred.style.setProperty("--mw", Math.round(row ? U.clamp(vh * 0.2, 60, 84) : U.clamp(Math.min(vw * 0.2, vh * 0.1), 64, 100)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.fsSize());
  },
  start(ctx) {
    ctx.round = 0;
    ctx.rid = ctx.rid || 0; // 판 번호는 계속 올림 (다시 열어도 done 중복 막기와 겹치지 않게)
    this.next(ctx);
  },
  /** 물건 고르기: 뜨는 것 nF, 가라앉는 것 nS — 반드시 '반대 예'(큰데 뜸/작은데 가라앉음) 하나 이상 */
  pick(ctx, nF, nS) {
    const U = KP.u;
    let f, s;
    do {
      f = U.sample(ctx.FLOAT, nF);
      s = U.sample(ctx.SINK, nS);
    } while (![...f, ...s].some(ctx.isCounter) || (ctx.lastSet && [...f, ...s].every((t) => ctx.lastSet.includes(t.em))));
    ctx.lastSet = [...f, ...s].map((t) => t.em);
    return { f, s };
  },
  /** 이번 판이 아직 그대로인가 (나갔다 오거나 다음 판으로 넘어가면 false) */
  alive(ctx, rid, sess) {
    return ctx._active && ctx._session === sess && ctx.rid === rid;
  },
  next(ctx) {
    const U = KP.u;
    ctx.rid++;
    ctx.tank.querySelectorAll(".fsObj,.fsDrop,.fsRing,.fsBub").forEach((e) => e.remove());
    ctx.slots = { true: [], false: [] };
    ctx.shelf.innerHTML = "";
    ctx.pred.hidden = true;
    ctx.fsWrap.classList.toggle("pair", ctx.level === 3);
    const lv = ctx.level;
    if (lv === 1) this.free(ctx);
    else if (lv === 2) this.guess(ctx);
    else this.pair(ctx);
    ctx.fsSize();
  },
  item(ctx, t, i) {
    const U = KP.u;
    const el = U.el("div", "fsItem item", '<span class="fsIn">' + KP.E(t.em) + "</span>");
    el.style.setProperty("--sc", ctx.SC[t.sz]);
    el.style.setProperty("--i", i);
    el.dataset.fl = t.fl ? "1" : "0"; // 점검용 (힌트는 이 값을 보지 않음)
    ctx.shelf.appendChild(el);
    return el;
  },
  /** 끌어서 수조에 넣기 — 놓은 자리(가로 위치)로 떨어짐 */
  dragIn(ctx, el, t, opt) {
    const self = this;
    let lx = 0;
    const d = KP.drag(el, {
      targets: () => [ctx.tank],
      pad: 20,
      snap: false,
      onPick: () => opt.pick && opt.pick(),
      onMove: (x) => (lx = x),
      onDrop: (tg) => {
        if (!tg) return;
        d.lock();
        el.classList.add("used");
        el.style.transform = "";
        const r = ctx.tank.getBoundingClientRect();
        const xp = ((lx - r.left) / r.width) * 100;
        opt.drop(self.dropIn(ctx, t, xp));
      },
    });
    return d;
  },
  /** 떠 있는 줄 / 바닥 줄에서 비어 있는 가장 가까운 칸 (%) */
  slot(ctx, fl, xp) {
    const S = [14, 32, 50, 68, 86];
    const used = ctx.slots[fl];
    const free = S.filter((s) => !used.includes(s));
    const list = free.length ? free : S;
    let best = list[0];
    list.forEach((s) => Math.abs(s - xp) < Math.abs(best - xp) && (best = s));
    used.push(best);
    return best;
  },
  /** 물에 떨어뜨리기: 첨벙 → 둥실(떠오름) 또는 퐁당(가라앉음). 끝나면 resolve */
  dropIn(ctx, t, xp) {
    const U = KP.u,
      A = KP.audio;
    const tank = ctx.tank;
    const x = this.slot(ctx, t.fl, U.clamp(xp, 8, 92));
    const o = U.el("div", "fsObj", '<span class="fsIn">' + KP.E(t.em) + "</span>");
    o.style.setProperty("--sc", ctx.SC[t.sz]);
    o.style.left = x + "%";
    o.style.top = "6%";
    tank.appendChild(o);
    void o.offsetWidth;
    const rid = ctx.rid;
    return new Promise((res) => {
      const ok = () => ctx._active && ctx.rid === rid && o.isConnected;
      o.style.transition = "top .3s cubic-bezier(.5,0,1,1)";
      o.style.top = "var(--surf)";
      ctx.after(300, () => {
        if (!ok()) return res();
        this.splash(ctx, x);
        if (t.fl) {
          o.style.transition = "top .22s ease-out";
          o.style.top = "calc(var(--surf) + var(--ts,80px)*.5)";
          ctx.after(230, () => {
            if (!ok()) return res();
            o.style.transition = "top .9s cubic-bezier(.25,1.5,.5,1)";
            o.style.top = "calc(var(--surf) - var(--ts,80px)*.12)";
            [0, 0.12, 0.24].forEach((w, i) => A.note(["C5", "E5", "G5"][i], { inst: "marimba", dur: 0.25, vol: 0.2, when: w + 0.1 }));
            ctx.after(950, () => {
              if (!ok()) return res();
              o.classList.add("bob");
              o.appendChild(U.el("span", "fsTag", "둥실"));
              res();
            });
          });
        } else {
          o.classList.add("sinking");
          o.style.transition = "top 1.5s cubic-bezier(.4,.1,.6,1)";
          o.style.top = "calc(100% - var(--ts,80px)*.42 - 6px)";
          A.tone(520, { to: 160, dur: 0.5, type: "sine", vol: 0.22, when: 0.05 });
          for (let i = 0; i < 5; i++) ctx.after(150 + i * 230, () => ok() && this.bubble(ctx, o));
          ctx.after(1550, () => {
            if (!ok()) return res();
            o.classList.add("sunk");
            A.noise({ dur: 0.12, vol: 0.12, bp: 300, q: 1.2 });
            o.appendChild(U.el("span", "fsTag", "퐁당"));
            res();
          });
        }
      });
    });
  },
  splash(ctx, x) {
    const U = KP.u,
      A = KP.audio;
    const tank = ctx.tank;
    A.noise({ dur: 0.4, vol: 0.28, bp: 1400, bpTo: 400, q: 0.9 });
    A.sfx("water");
    U.replay(tank, "slosh");
    const ring = U.el("div", "fsRing");
    ring.style.left = x + "%";
    ring.style.top = "var(--surf)";
    tank.appendChild(ring);
    ctx.after(950, () => ring.remove());
    for (let i = 0; i < 8; i++) {
      const d = U.el("div", "fsDrop");
      d.style.left = x + "%";
      d.style.top = "calc(var(--surf) - 10px)";
      d.style.setProperty("--dx", (i - 3.5) * 16 + U.randf(-6, 6) + "px");
      d.style.setProperty("--dy", -U.randf(30, 70) + "px");
      tank.appendChild(d);
      ctx.after(800, () => d.remove());
    }
  },
  bubble(ctx, o) {
    const U = KP.u;
    const tank = ctx.tank;
    const r = tank.getBoundingClientRect(),
      orr = o.getBoundingClientRect();
    const b = U.el("div", "fsBub");
    b.style.left = ((orr.left + orr.width / 2 - r.left) / r.width) * 100 + U.randf(-3, 3) + "%";
    b.style.top = orr.top - r.top + orr.height * 0.3 + "px";
    const surfY = r.height * 0.34;
    b.style.setProperty("--rise", -Math.max(10, orr.top - r.top - surfY) + "px");
    b.style.setProperty("--dx", U.randf(-12, 12) + "px");
    tank.appendChild(b);
    KP.audio.tone(U.randf(700, 1100), { to: 1500, dur: 0.07, type: "sine", vol: 0.06 });
    ctx.after(1350, () => b.remove());
  },

  /* ---------- 1단계: 자유롭게 넣어 보기 ---------- */
  free(ctx) {
    const U = KP.u;
    const self = this;
    const rid = ctx.rid,
      sess = ctx._session;
    const { f, s } = this.pick(ctx, 2, 2);
    const list = U.shuffle([...f, ...s]);
    let left = list.length;
    const els = list.map((t, i) => {
      const el = this.item(ctx, t, i);
      this.dragIn(ctx, el, t, {
        pick: () => KP.voice.say(t.name),
        drop: (p) => {
          setHint();
          p.then(async () => {
            if (!self.alive(ctx, rid, sess)) return;
            await KP.voice.say(t.line);
            left--;
            if (left === 0 && self.alive(ctx, rid, sess)) self.done(ctx, "다 넣어 봤어요!", false);
          });
        },
      });
      return el;
    });
    const setHint = () => {
      const e = els.find((x) => !x.classList.contains("used"));
      ctx.hint(e ? () => e : null, "물건을 끌어서 물에 넣어 봐요!");
    };
    ctx.say("🫗 물건을 끌어서 물에 넣어 봐요!");
    setHint();
  },

  /* ---------- 2단계: 예상하고 넣기 ---------- */
  guess(ctx) {
    const U = KP.u,
      A = KP.audio;
    const self = this;
    const rid = ctx.rid,
      sess = ctx._session;
    const two = U.rand(2) === 0;
    const { f, s } = this.pick(ctx, two ? 2 : 1, two ? 1 : 2);
    const list = U.shuffle([...f, ...s]);
    ctx.allRight = true;
    const els = [],
      drags = [];
    list.forEach((t, i) => {
      const el = this.item(ctx, t, i);
      els.push(el);
      const d = this.dragIn(ctx, el, t, {
        pick: () => KP.voice.say(t.name),
        drop: (p) => {
          ctx.hint(null);
          p.then(async () => {
            if (!self.alive(ctx, rid, sess)) return;
            const right = ctx.myGuess === t.fl;
            if (right) A.sfx("good");
            else ctx.allRight = false;
            await ctx.say((right ? "⭕ 맞았어요! " : "👀 어? 생각이랑 달라요! ") + t.line);
            await ctx.wait(400);
            if (!self.alive(ctx, rid, sess)) return;
            if (k + 1 < list.length) ask(k + 1);
            else self.done(ctx, "예상하고 확인했어요!", ctx.allRight);
          });
        },
      });
      d.lock();
      drags.push(d);
    });
    let k = 0;
    const ask = (n) => {
      k = n;
      const t = list[n],
        el = els[n];
      els.forEach((e, j) => {
        e.classList.toggle("cur", j === n);
        e.classList.toggle("dim", j > n);
      });
      ctx.myGuess = null;
      // 예상 단추: 같은 물건이 물 위에 뜬 그림 / 바닥에 가라앉은 그림
      ctx.pred.innerHTML = "";
      ctx.pred.hidden = false;
      const mk = (fl) => {
        const b = U.el("button", "fsPB", '<span class="fsMini ' + (fl ? "up" : "down") + '"><span class="fsIn">' + KP.E(t.em) + '</span><span class="fsArrow">' + KP.E(fl ? "⬆️" : "⬇️") + "</span></span><b>" + (fl ? "둥실" : "퐁당") + "</b>");
        b.dataset.fl = fl ? "1" : "0";
        ctx.tap(b, () => {
          if (ctx.myGuess !== null) return;
          ctx.myGuess = fl;
          b.classList.add("picked");
          [...ctx.pred.children].forEach((x) => x !== b && x.classList.add("off"));
          A.sfx("tap");
          KP.voice.say(fl ? "둥실!" : "퐁당!").then(() => {
            if (!self.alive(ctx, rid, sess) || k !== n) return;
            ctx.say("🫗 그럼 물에 넣어 봐요!");
          });
          drags[n].unlock();
          ctx.hint(() => el, "그럼 물에 넣어 봐요!");
        });
        return b;
      };
      ctx.pred.append(mk(true), mk(false));
      ctx.fsSize();
      ctx.say("🤔 이건 뜰까요? 가라앉을까요?");
      // 힌트는 물건을 가리킴 (정답 단추를 가리키지 않게)
      ctx.hint(() => el, "이건 뜰까요? 가라앉을까요?");
    };
    ask(0);
  },

  /* ---------- 3단계: 두 물건 비교 ---------- */
  pair(ctx) {
    const U = KP.u,
      A = KP.audio;
    const self = this;
    const rid = ctx.rid,
      sess = ctx._session;
    // 세 쌍: 큰데 뜨는 것 vs 작은데 가라앉는 것 / 작은데 뜨는 것 vs 큰데 가라앉는 것 / 아무거나
    const F = ctx.FLOAT,
      S = ctx.SINK;
    const by = (arr, sz) => arr.filter((t) => t.sz === sz);
    const pairs = [];
    const usedEm = new Set();
    const take = (arr) => {
      const c = U.pick(arr.filter((t) => !usedEm.has(t.em)));
      usedEm.add(c.em);
      return c;
    };
    pairs.push([take(by(F, "big")), take(by(S, "small"))]);
    pairs.push([take(by(F, "small")), take(by(S, "big"))]);
    pairs.push([take(F), take(S)]);
    const order = U.shuffle(pairs);
    ctx.allRight = true;
    const run = (n) => {
      const pr = U.shuffle(order[n].slice());
      ctx.shelf.innerHTML = "";
      let chosen = null;
      const els = pr.map((t, i) => {
        const el = this.item(ctx, t, i);
        ctx.tap(el, () => {
          if (chosen) return;
          chosen = t;
          el.classList.add("picked");
          els.forEach((e) => e !== el && e.classList.add("dim"));
          A.sfx("tap");
          ctx.hint(null);
          ctx.say("🫗 같이 넣어 볼까요?");
          ctx.after(1300, async () => {
            if (!self.alive(ctx, rid, sess)) return;
            els.forEach((e) => e.classList.add("used"));
            const ps = pr.map((p, j) => (j === 0 ? self.dropIn(ctx, p, 30) : new Promise((r) => ctx.after(120, () => r(self.dropIn(ctx, p, 70))))));
            await Promise.all(ps);
            if (!self.alive(ctx, rid, sess)) return;
            const right = chosen.fl;
            if (right) A.sfx("good");
            else ctx.allRight = false;
            const fl = pr.find((p) => p.fl),
              sk = pr.find((p) => !p.fl);
            await ctx.say((right ? "⭕ 맞았어요! " : "👀 어? 생각이랑 달라요! ") + fl.line + " " + sk.line);
            await ctx.wait(500);
            if (!self.alive(ctx, rid, sess)) return;
            if (n + 1 < order.length) run(n + 1);
            else self.done(ctx, "둘을 비교해 봤어요!", ctx.allRight);
          });
        });
        return el;
      });
      ctx.fsSize();
      ctx.say("🤔 어느 게 둥실 뜰까요? 하나를 눌러 봐요!");
      // 힌트는 늘 왼쪽 물건 (자리가 매번 섞여 정답을 알려 주지 않음)
      ctx.hint(() => els[0], "어느 게 둥실 뜰까요? 하나를 눌러 봐요!");
    };
    run(0);
  },

  /** 한 판 끝: clean=false 면 열쇠 별 없음(보기 2개 판 규칙) */
  async done(ctx, msg, clean) {
    if (ctx._fsDone === ctx.rid) return;
    ctx._fsDone = ctx.rid;
    ctx.hint(null);
    ctx.pred.hidden = true;
    // 1단계(자유 탐색)와 예상이 하나라도 달랐던 판은 별 없음 — 보기 2개라 '찍어도 반'이므로
    if (!clean) ctx._fewChoice = true;
    ctx.score.add();
    ctx.round++;
    await ctx.wait(600);
    const big = ctx.round % 4 === 0;
    const ok = await ctx.win({ big, msg: big ? "{부름} 꼬마 과학자!" : msg });
    if (ok) this.next(ctx);
  },
});
