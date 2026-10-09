/* =====================================================================
   🎨 색 주문 맞추기 (형아 도전)
   - 동물 손님이 견본 색 카드를 들고 "이런 색 주세요!"
   - 물감 작업대(KP.paint.studio: 물감 통 + 젓는 그릇)로 섞어서 맞춤
   - "점점 비슷해져요" 막대: 그릇 전체 색과 목표 색의 거리(Lab)로 0~100%
   - 🤲 드리기: 허용 거리 안이면 성공. 아니면 한 방울씩 더 넣어 보는 계산으로
     가장 가까워지는 물감을 찾아 그 통을 가리키며 알려 줌. 되돌릴 수 없으면 "비우고 다시"
   - 단계: 1) 두 물감 1:1  2) 두 물감 2:1·1:2  3) 하양·검정이 들어간 색
===================================================================== */
"use strict";
KP.game({
  id: "colororder",
  icon: "🎨",
  name: "색 주문 맞추기",
  cat: "bigkid",
  badge: "NEW",
  levels: 3,
  score: "⭐",
  bubble: false,
  setup(ctx) {
    const U = KP.u,
      P = KP.paint;
    KP.css("colororder", `
      .coW{flex:1;min-height:0;display:grid;gap:8px;padding:4px 12px 10px;
        grid-template-areas:"cust" "bowl" "jars" "acts";grid-template-rows:auto minmax(0,1fr) auto auto;grid-template-columns:minmax(0,1fr);justify-items:center;align-items:center}
      .coSide{display:contents}
      .coBowlCell{grid-area:bowl;min-height:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
      .coBowlCell .psMeter{display:none}
      .coJarsCell{grid-area:jars}
      .coCust{grid-area:cust;width:100%;max-width:560px;background:#fff;border-radius:26px;box-shadow:0 6px 0 rgba(47,58,102,.12);
        display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:"ani card" "meter meter";gap:4px 12px;padding:8px 14px 10px;align-items:center;position:relative}
      .coAni{grid-area:ani;font-size:clamp(58px,8.4vh,100px);line-height:1;position:relative;cursor:pointer}
      .coAni.in{animation:coIn .55s cubic-bezier(.3,1.4,.6,1)}
      @keyframes coIn{from{transform:translateX(120%) rotate(18deg);opacity:0}}
      .coAni.out{transition:transform .45s,opacity .45s;transform:translateX(-140%) rotate(-14deg);opacity:0}
      .coSay{grid-area:card;position:relative;justify-self:start;display:flex;align-items:center;gap:10px;background:#f4f7ff;border-radius:20px;padding:8px 12px}
      .coSay::before{content:"";position:absolute;left:-12px;top:50%;margin-top:-10px;border:10px solid transparent;border-right:12px solid #f4f7ff;border-left:0}
      .coCard{width:clamp(76px,11vh,118px);aspect-ratio:5/4;border-radius:14px;border:5px solid #fff;box-shadow:0 5px 0 rgba(47,58,102,.15);background:var(--t);position:relative;overflow:hidden;flex:0 0 auto}
      .coCard::after{content:"";position:absolute;left:12%;top:12%;width:34%;height:22%;border-radius:50%;background:rgba(255,255,255,.45);transform:rotate(-20deg)}
      .coCard.pop{animation:popBig .5s}
      .coRec{display:flex;align-items:center;gap:4px;font-size:22px;color:var(--ink2)}
      .coDrop{width:24px;height:30px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -3px -4px 0 rgba(0,0,0,.12),0 0 0 2px #fff,0 2px 0 2px rgba(47,58,102,.12)}
      .coRec .q{font-size:30px;color:#b5bdd3;padding:0 4px}
      .coMeter{grid-area:meter;display:flex;align-items:center;gap:8px;width:100%}
      .coDot{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:4px solid #fff;box-shadow:0 3px 0 rgba(47,58,102,.14);background:#eef1f7;position:relative}
      .coDot.goal .e{position:absolute;right:-10px;top:-12px;font-size:20px}
      .coBar{flex:1;height:20px;border-radius:999px;background:#eef1f7;box-shadow:inset 0 2px 4px rgba(0,0,0,.1);overflow:hidden;position:relative}
      .coBar i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ffb3c7,#ffd166,#06d6a0);transition:width .35s}
      .coBar.near{box-shadow:0 0 0 3px var(--sun),inset 0 2px 4px rgba(0,0,0,.1);animation:coGlow 1s ease-in-out infinite alternate}
      @keyframes coGlow{to{box-shadow:0 0 0 5px #ffe28a,inset 0 2px 4px rgba(0,0,0,.1)}}
      .coActs{grid-area:acts;display:flex;gap:10px;justify-content:center;width:100%;max-width:560px}
      .coB{background:#fff;border-radius:20px;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-height:72px;font-size:15px;line-height:1.1;flex:1}
      .coB .e{font-size:32px}
      .coB:active{transform:translateY(4px)}
      .coB.main{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000);flex:1.6;font-size:17px}
      .coFly{position:fixed;z-index:80;width:70px;height:70px;border-radius:50%;border:5px solid #fff;pointer-events:none;box-shadow:0 6px 14px rgba(0,0,0,.2);
        transition:transform .75s cubic-bezier(.5,-0.2,.5,1),opacity .75s}
      .coHeart{position:absolute;pointer-events:none;font-size:34px;animation:coHeart 1.1s ease-out forwards;z-index:3}
      @keyframes coHeart{from{transform:translate(-50%,0) scale(.4);opacity:1}to{transform:translate(-50%,-90px) scale(1.2);opacity:0}}
      @media (max-width:420px){
        .psJars{gap:6px}
        .coJarsCell .psJar{width:62px;height:80px}
      }
      @media (orientation:landscape) and (min-height:500px){
        .coW{grid-template-areas:"jars bowl side";grid-template-columns:auto minmax(0,1fr) minmax(280px,30vw);grid-template-rows:minmax(0,1fr);padding:4px 16px 12px;gap:16px}
        .coSide{grid-area:side;display:flex;flex-direction:column;gap:16px;align-self:stretch;justify-content:center;width:100%}
        .coCust{grid-template-columns:minmax(0,1fr);grid-template-areas:"ani" "card" "meter";justify-items:center;padding:16px 16px 18px;gap:12px}
        .coAni{font-size:clamp(90px,14vh,130px)}
        .coSay{justify-self:center;flex-direction:column;padding:12px 16px}
        .coSay::before{left:50%;top:-12px;margin:0 0 0 -10px;border:10px solid transparent;border-bottom:12px solid #f4f7ff;border-top:0}
        .coCard{width:clamp(110px,15vh,150px)}
        .coJarsCell .psJars{flex-direction:column;flex-wrap:nowrap}
        .coJarsCell .psJar{width:clamp(60px,7vh,82px);height:clamp(70px,9vh,98px)}
        .coB{min-height:84px;font-size:16px}
        .coB .e{font-size:36px}
      }
    `);
    const W = U.el("div", "coW");
    const bowlCell = U.el("div", "coBowlCell");
    const jarsCell = U.el("div", "coJarsCell");
    const side = U.el("div", "coSide");
    const cust = U.el("div", "coCust");
    const ani = U.el("div", "coAni");
    const say = U.el("div", "coSay");
    const card = U.el("div", "coCard");
    const rec = U.el("div", "coRec");
    say.append(card, rec);
    const meter = U.el("div", "coMeter");
    const nowDot = U.el("span", "coDot");
    const bar = U.el("span", "coBar", "<i></i>");
    const goalDot = U.el("span", "coDot goal", KP.E("⭐"));
    meter.append(nowDot, bar, goalDot);
    cust.append(ani, say, meter);
    const acts = U.el("div", "coActs");
    const mk = (em, label, cls = "") => U.btn(KP.E(em) + "<span>" + label + "</span>", "coB " + cls);
    const bGive = mk("🤲", "드리기", "main");
    const bDrain = mk("🫗", "비우기");
    acts.append(bDrain, bGive);
    side.append(cust, acts);
    W.append(bowlCell, jarsCell, side);
    ctx.body.appendChild(W);

    const studio = P.studio({
      ctx,
      capacity: 40,
      onPour: () => {
        if (!ctx.poured) ctx.hint(() => studio.bowl.cv, "숟가락으로 빙글빙글 저어 봐요!");
        ctx.poured = true;
        ctx.nearTold = false;
        ctx.dirty = true;
      },
      onStir: () => (ctx.dirty = true),
    });
    jarsCell.appendChild(studio.jarsEl);
    bowlCell.appendChild(studio.bowlEl);
    Object.assign(ctx, { studio, ani, card, rec, bar, nowDot, goalDot, bGive, bDrain, cust });

    ctx.fitBowl = () => {
      const r = bowlCell.getBoundingClientRect();
      studio.fit(Math.min(r.width * 0.96, r.height - 6, 560));
    };
    addEventListener("resize", () => ctx._active && requestAnimationFrame(ctx.fitBowl));

    ctx.tap(bGive, () => this.give(ctx));
    ctx.tap(bDrain, async () => {
      if (ctx.busy) return;
      if (studio.bowl.volume() < 0.05) return KP.voice.say("그릇이 벌써 비어 있어요!");
      ctx.busy = true;
      KP.voice.say("쏴아! 비웠어요. 다시 섞어 봐요.");
      await studio.drain();
      ctx.poured = false;
      ctx.busy = false;
      ctx.dirty = true;
      ctx.nearTold = false;
      this.hintFirst(ctx);
    });
    ani.addEventListener("click", () => {
      U.replay(ani, "jump");
      KP.audio.sfx("boing");
      if (ctx.order) KP.voice.say("이런 색 주세요! " + ctx.order.name + "!");
    });
    card.addEventListener("click", () => {
      U.replay(card, "pop");
      if (ctx.order) KP.voice.say(ctx.order.name + "!");
    });
  },

  /* ---------- 단계별 주문 ---------- */
  RECIPES: {
    1: [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [1, 0, 1, 0, 0]],
    2: [[1, 2, 0, 0, 0], [2, 1, 0, 0, 0], [0, 2, 1, 0, 0], [0, 1, 2, 0, 0], [2, 0, 1, 0, 0]],
    3: [[0, 0, 1, 2, 0], [1, 0, 1, 2, 0], [1, 1, 0, 3, 0], [0, 0, 0, 2, 1], [0, 0, 2, 0, 1], [0, 1, 0, 1, 0], [0, 1, 1, 0, 1], [3, 0, 1, 3, 0], [1, 1, 1, 0, 0]],
  },
  /* 허용 거리: 각 물감 양을 단계별 비율(1단계 ±30%, 2단계 ±25%, 3단계 ±20%)만큼 바꿨을 때의
     평균 색 차이를 쓰고, 단계별 범위로 자름 → 예민한 색(청록 등)과 둔한 색(귤색 등)의 공정성 맞춤 */
  TOL: { 1: [0.3, 12, 18], 2: [0.25, 8, 14], 3: [0.2, 6, 10] },
  tolFor(v, lv) {
    const P = KP.paint;
    const [s, lo, hi] = this.TOL[lv];
    const t = P.mix(v);
    let sum = 0,
      n = 0;
    v.forEach((x, i) => {
      if (!x) return;
      for (const k of [1 + s, 1 / (1 + s)]) {
        const w = v.slice();
        w[i] = x * k;
        sum += P.dist(P.mix(w), t);
        n++;
      }
    });
    return KP.u.clamp(sum / n, lo, hi);
  },
  ANIMALS: [["🐻", "곰"], ["🐰", "토끼"], ["🐱", "고양이"], ["🐶", "강아지"], ["🐼", "판다"], ["🦊", "여우"], ["🐸", "개구리"], ["🐧", "펭귄"], ["🐨", "코알라"], ["🐷", "돼지"]],
  MORE: ["빨갛게", "노랗게", "파랗게", "밝게", "어둡게"],

  start(ctx) {
    ctx.busy = false;
    ctx.giveWait = 0;
    ctx.round = 0;
    ctx.studio.setEnabled(true);
    ctx.studio.bowl.clear();
    requestAnimationFrame(() => {
      ctx.fitBowl();
      let acc = 0,
        stirTold = 0;
      ctx.loop((dt, now) => {
        ctx.studio.tick(dt);
        acc += dt;
        if (acc < 0.25) return;
        acc = 0;
        this.updateMeter(ctx);
        const st = ctx.studio.state,
          vol = ctx.studio.bowl.volume();
        // 넣고 가만히 있으면 젓기 안내
        if (!ctx.busy && ctx.poured && vol > 0.6 && st.even < 0.72 && now - st.lastPourAt > 3000 && now - st.lastStirAt > 3000 && now - stirTold > 10000) {
          stirTold = now;
          KP.voice.say("숟가락으로 빙글빙글 저어요!");
        }
      });
    });
    this.next(ctx, true);
  },

  next(ctx, first) {
    const U = KP.u,
      P = KP.paint;
    const lv = ctx.level;
    const list = this.RECIPES[lv];
    let v;
    do v = U.pick(list);
    while (list.length > 1 && ctx.order && v === ctx.order.v);
    const target = P.mix(v);
    const name = P.nameOf(target).n;
    let an;
    do an = U.pick(this.ANIMALS);
    while (ctx.order && an[0] === ctx.order.an[0]);
    ctx.order = { v, target, name, hex: P.hex(target), tol: this.tolFor(v, lv), an, lv };
    ctx.poured = false;
    ctx.nearTold = false;
    ctx.dirty = true;
    ctx.busy = false;
    ctx.studio.setEnabled(true);
    ctx.studio.bowl.clear();
    // 하양·검정은 3단계에서만
    [3, 4].forEach((id) => (ctx.studio.jar(id).style.display = lv >= 3 ? "" : "none"));
    // 손님 등장
    ctx.ani.classList.remove("out");
    ctx.ani.innerHTML = KP.E(an[0]);
    U.replay(ctx.ani, "in");
    ctx.card.style.setProperty("--t", ctx.order.hex);
    ctx.goalDot.style.background = ctx.order.hex;
    U.replay(ctx.card, "pop");
    // 레시피 힌트: 1단계 = 넣을 물감과 양, 2단계 = 넣을 물감만, 3단계 = 비밀
    const R = ctx.rec;
    R.innerHTML = "";
    if (lv <= 2) {
      v.forEach((x, i) => {
        if (!x) return;
        if (R.childNodes.length) R.appendChild(U.el("span", "", "+"));
        const d = U.el("span", "coDrop");
        d.style.setProperty("--c", P.BASE[i].hex);
        R.appendChild(d);
      });
    } else R.appendChild(U.el("span", "q", "?"));
    const hello = first ? "안녕! 나는 " + an[1] + "예요. " : "";
    ctx.say(an[0] + " " + hello + "이런 색 물감 주세요! " + U.josa(name, "이에요/예요") + ".");
    this.hintFirst(ctx);
  },
  hintFirst(ctx) {
    const o = ctx.order;
    if (!o) return;
    const first = o.v.findIndex((x) => x > 0);
    ctx.hint(() => ctx.studio.jar(first), "물감 통을 눌러 그릇에 넣어요!");
  },

  /** 비슷한 정도 0~100 (허용 거리 안 = 85% 이상) */
  closeness(d, tol) {
    if (d <= tol) return 85 + 15 * (1 - d / tol);
    return 85 * Math.max(0, 1 - (d - tol) / 55);
  },
  updateMeter(ctx) {
    if (!ctx.order) return;
    const P = KP.paint,
      bowl = ctx.studio.bowl;
    const vol = bowl.volume();
    let pct = 0;
    if (vol > 0.3) {
      const c = bowl.color();
      ctx.nowDot.style.background = P.hex(c);
      const d = P.dist(c, ctx.order.target);
      pct = this.closeness(d, ctx.order.tol);
      ctx.lastD = d;
    } else ctx.nowDot.style.background = "#eef1f7";
    ctx.bar.firstChild.style.width = Math.round(pct) + "%";
    const near = pct >= 85;
    ctx.bar.classList.toggle("near", near);
    if (near && !ctx.nearTold && !ctx.busy && ctx.studio.state.even >= 0.72 && performance.now() - ctx.studio.state.lastPourAt > 700) {
      ctx.nearTold = true;
      KP.audio.sfx("sparkle");
      KP.voice.say("거의 똑같아요! 드리기를 눌러요!");
      ctx.hint(() => ctx.bGive, "드리기를 눌러요!");
    }
  },

  /**
   * 도움말 계산
   * 1) 그릇이 넘치기 전에 허용 거리 안으로 갈 길이 있는지: 주문 레시피 비율로 맞추려면
   *    각 물감을 얼마나 더 넣어야 하는지(부족분) 를 양을 늘려 가며 찾음 (다른 색이 섞였으면 묽혀서)
   * 2) 부족한 물감들 중에서 '한 방울 더 넣었을 때 거리가 가장 줄어드는' 물감을 고름
   *    (한 방울만 보는 방식은 하늘색에 노랑을 권하는 등 엉뚱한 길로 빠질 때가 있어 부족분 안에서만 고름)
   * → {id, lot} 또는 null(되돌릴 수 없음 → 비우고 다시)
   */
  advice(ctx, tot) {
    const P = KP.paint,
      o = ctx.order,
      v = o.v;
    const cap = ctx.studio.bowl.capacity;
    const vol = tot.reduce((x, y) => x + y, 0);
    let k = 0;
    v.forEach((x, i) => x > 0 && (k = Math.max(k, tot[i] / x)));
    k = Math.max(k, 0.9 / Math.min(...v.filter((x) => x > 0)));
    let add = null;
    for (; ; k += 0.3) {
      const a = v.map((x, i) => Math.max(0, k * x - tot[i]));
      const sum = a.reduce((x, y) => x + y, 0);
      if (vol + sum > cap) break;
      const w = tot.map((x, i) => x + a[i]);
      if (P.dist(P.mix(w), o.target) <= o.tol * 0.8) {
        add = a;
        break;
      }
    }
    if (!add) return null;
    const cur = P.dist(P.mix(tot), o.target);
    let best = null;
    add.forEach((need, id) => {
      if (need < 0.45) return;
      const w = tot.slice();
      w[id] += 0.9;
      const gain = cur - P.dist(P.mix(w), o.target);
      if (!best || gain > best.gain + 0.01 || (Math.abs(gain - best.gain) <= 0.01 && need > best.need)) best = { id, gain, need };
    });
    return best ? { id: best.id, lot: best.need >= 2.7 } : null;
  },

  async give(ctx) {
    const U = KP.u,
      P = KP.paint;
    if (ctx.busy || !ctx.order) return;
    const o = ctx.order,
      studio = ctx.studio,
      bowl = studio.bowl;
    const vol = bowl.volume() + studio.state.pending;
    if (vol < 0.5) {
      ctx.miss(ctx.bGive, "먼저 물감을 넣어요!", { soft: true });
      return this.hintFirst(ctx);
    }
    if (studio.state.pending > 0.01 || performance.now() - studio.state.lastPourAt < 400) {
      // 방울이 아직 떨어지는 중 → 잠깐 뒤에 다시 봄
      if (!ctx.giveWait) ctx.giveWait = ctx.after(450, () => ((ctx.giveWait = 0), this.give(ctx)));
      return;
    }
    if (studio.state.even < 0.72) {
      ctx.miss(ctx.bGive, "먼저 숟가락으로 빙글빙글 저어요!", { soft: true });
      ctx.hint(() => bowl.cv, "그릇을 빙글빙글 저어요!");
      return;
    }
    const tot = bowl.total();
    const d = P.dist(P.mix(tot), o.target);
    if (d <= o.tol) return this.success(ctx);
    // 도움말
    U.replay(ctx.card, "pop");
    const best = this.advice(ctx, tot);
    if (best) {
      const p = P.BASE[best.id];
      const lot = best.lot;
      const tip = U.josa(p.n, "을/를") + (lot ? " 많이 넣어 봐요!" : " 조금 더 넣어 봐요!");
      ctx.miss(null, null, { soft: true });
      KP.voice.say("음, 조금 달라요. " + (lot ? "훨씬 더 " : "조금 더 ") + this.MORE[best.id] + " 해 볼까요? " + tip);
      U.replay(ctx.ani, "wig");
      ctx.hint(() => studio.jar(best.id), tip);
    } else {
      ctx.miss(null, null, { soft: true });
      KP.voice.say("앗, 물감이 너무 많이 들어갔어요. 비우고 다시 해 볼까요?");
      U.replay(ctx.ani, "wig");
      ctx.hint(() => ctx.bDrain, "비우기를 누르고 다시 해 봐요!");
    }
  },

  async success(ctx) {
    const U = KP.u,
      P = KP.paint;
    const o = ctx.order;
    ctx.busy = true;
    ctx.hint(null);
    ctx.studio.setEnabled(false);
    const sess = ctx._session;
    // 그릇에서 손님에게 물감이 날아감
    const a = ctx.studio.bowl.cv.getBoundingClientRect(),
      b = ctx.ani.getBoundingClientRect();
    const fly = U.el("div", "coFly");
    fly.style.background = P.hex(ctx.studio.bowl.color());
    fly.style.left = a.left + a.width / 2 - 35 + "px";
    fly.style.top = a.top + a.height / 2 - 35 + "px";
    document.body.appendChild(fly);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fly.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.5)";
        fly.style.opacity = ".3";
      })
    );
    setTimeout(() => fly.remove(), 800);
    KP.audio.sfx("whoosh");
    await ctx.wait(750);
    if (ctx._session !== sess) return;
    U.replay(ctx.ani, "jump");
    KP.audio.sfx("good");
    for (let i = 0; i < 3; i++) {
      const h = U.el("span", "coHeart", KP.E(U.pick(["💖", "✨", "💛"])));
      h.style.left = 30 + i * 22 + "%";
      h.style.top = "10%";
      h.style.animationDelay = i * 0.15 + "s";
      ctx.cust.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
    const isNew = P.discover(o.name);
    KP.voice.say(U.pick(["와, 똑같아요! 고마워요!", "딱 이 색이에요! 고마워요!", "우와, 정말 예뻐요! 고마워요!"]) + (isNew ? " 도감에 " + U.josa(o.name, "이/가") + " 생겼어요!" : ""));
    ctx.score.add(1);
    ctx.round++;
    await ctx.wait(1400);
    if (ctx._session !== sess) return;
    const ok = await ctx.win({ msg: o.name + " 완성!", big: ctx.round % 4 === 0 });
    if (!ok) return;
    ctx.ani.classList.add("out");
    await ctx.studio.drain();
    if (!ctx._active || ctx._session !== sess) return;
    this.next(ctx);
  },
});
