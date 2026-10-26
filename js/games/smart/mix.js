/* =====================================================================
   🥣 색깔 섞기 — 점토 물감 작업실에 3D 인형 손님이 와서 색을 주문해요
   - 무대: 물감 실험실과 같은 점토 작업실 그림(KP.clayStage) + 아이가 칠한 3D 인형 손님(KP.dollActor)
   - 말풍선에 '견본 색 + 레시피 방울'(어떤 물감을 몇 번 짜는지) — 목표색은 진짜 물감 계산(KP.paint.mix)으로 만든 색
   - 튜브를 꾹 짜서 그릇(그림 속 팔레트 자리)에 넣고 주걱으로 저으면, 고르게 섞였을 때 인형이 색을 봄
     · 가까우면: 그 색이 인형에게 날아가 몸이 그 색으로 물듦 + 폴짝·하트 → 도감·내 물감에 저장
     · 멀면: "조금 더 노랗게?" 처럼 가장 가까워지는 물감을 알려 줌(KP.paint.advise, 색 주문 맞추기와 같은 계산)
     · 되돌릴 수 없으면 "비우고 다시" (그릇을 억지로 비우지 않음)
   - 단계: 1) 두 색 1:1 (빨·노·파 중 둘)  2) 양 조절·세 색 (2:1, 셋 다)  3) 하양으로 연하게·검정으로 진하게
   - 열쇠 별: 도움말(색이 달라요)을 2번 이상 들으면 그 판은 별 없음 (가벼운 실수 1번까지 봐줌 — ui.js win 규칙)
   - 3D 가 안 되거나 느리면 인형 그림(create2D)으로
===================================================================== */
"use strict";
KP.game({
  id: "mix",
  icon: "🥣",
  name: "색깔 섞기",
  cat: "smart",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      P = KP.paint;
    KP.css("mix", `
      .mxWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 12px 10px}
      .mxRoom{flex:1;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#c98b4e}
      .mxRoom .psMeter{display:none}
      .mxRoom .psBowlBox{position:absolute;left:0;top:0;z-index:4}
      .mxRoom .psJars{position:absolute;z-index:5;background:rgba(255,251,242,.6);border-radius:22px;padding:6px 8px 8px}
      .mxRoom .psJars.col{display:grid;grid-template-columns:repeat(2,auto);gap:4px 6px}
      .mxRoom .psJars.row{flex-wrap:nowrap;gap:4px}
      .mxRoom .psJar{width:clamp(54px,8.6vmin,92px);height:clamp(78px,12.6vmin,128px)}
      .mxBub{position:absolute;left:0;top:0;z-index:6;display:flex;align-items:center;gap:.35em;background:#fffaf2;border-radius:26px;padding:.3em .5em .3em .35em;box-shadow:0 5px 0 rgba(120,80,40,.16);font-size:max(18px,min(30px,calc(var(--dh,300px)*.1)));color:var(--ink);cursor:pointer;will-change:transform}
      .mxBub:after{content:"";position:absolute;left:var(--tx,18%);bottom:-.4em;width:.8em;height:.8em;background:#fffaf2;transform:rotate(45deg);border-radius:0 0 .18em 0}
      .mxBub.in{animation:popIn .4s .5s backwards}
      .mxSw{width:2.3em;height:2.3em;border-radius:46% 54% 50% 50%/52% 46% 54% 48%;background:var(--t);box-shadow:inset -.2em -.25em 0 rgba(0,0,0,.14),inset .2em .2em 0 rgba(255,255,255,.3),0 0 0 .14em #fff;flex:0 0 auto}
      .mxRec{display:flex;flex-direction:column;align-items:flex-start;gap:.12em}
      .mxRec b{font-weight:400;font-size:.9em;line-height:1.1;white-space:nowrap}
      .mxDrops{display:flex;align-items:center;gap:.12em;font-size:.8em;color:var(--ink2)}
      .mxDrops i{width:.8em;height:1em;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -.12em -.14em 0 rgba(0,0,0,.14),0 0 0 .1em #fff}
      .mxDrops i.w{box-shadow:inset -.12em -.14em 0 rgba(0,0,0,.1),0 0 0 .1em #d9cfbf}
      .mxDrops .pl{margin:0 .08em}
      .mxB{position:absolute;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:clamp(64px,10vmin,88px);height:clamp(64px,10vmin,88px);border-radius:22px;background:rgba(255,251,242,.95);box-shadow:0 6px 0 rgba(110,70,30,.2);font-size:13px;color:var(--ink)}
      .mxB img{width:60%;height:50%;object-fit:contain}
      .mxB:active{transform:translateY(4px)}
      .mxFly{position:fixed;z-index:80;width:64px;height:64px;border-radius:50%;border:5px solid #fff;pointer-events:none;box-shadow:0 6px 14px rgba(0,0,0,.2);transition:transform .75s cubic-bezier(.5,-0.2,.5,1),opacity .75s}
      .mxLoad{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:22px;background:rgba(255,251,242,.9);border-radius:999px;padding:8px 18px;z-index:9}
    `);
    ctx.wrap = U.el("div", "mxWrap");
    ctx.room = U.el("div", "mxRoom");
    ctx.wrap.appendChild(ctx.room);
    ctx.body.appendChild(ctx.wrap);
    // 점토 물감 작업실 (실험실과 같은 그림) — 지평선·화각은 탁자 윗면에 인형이 서도록, 자르기(focus·zoom)는 layout 이 정함
    ctx.BG = { file: P.STAGE.file, img: P.STAGE.img, vh: 0.3, near: 0.24, fov: 34, focus: [0.5, 0.6], focusP: [0.5, 0.6], sun: [-0.6, 1, 0.7], sunCol: "#fff3df" };
    ctx.TILT = 0.74;
    const studio = (ctx.studio = P.studio({
      ctx,
      capacity: 30,
      dab: 0.13, // 방울이 적으니 덩어리를 조금 크게, 가운데 가까이 (젓기 쉽게)
      spread: 0.11,
      tilt: ctx.TILT,
      onPour: () => {
        ctx.dirty = true;
        ctx.poured = true;
        if (ctx.order && !ctx.order.stirTold) ctx.hint(() => studio.bowl.cv, "숟가락으로 빙글빙글 저어요!");
      },
      onStir: () => {},
    }));
    studio.bowlEl.addEventListener("pointerdown", () => ctx.order && (ctx.order.stirTold = true));
    ctx.bDrain = U.btn('<img alt="" draggable="false" src="' + P.ART + 'cloth.png"><span>비우기</span>', "mxB");
    ctx.bub = U.el("div", "mxBub");
    ctx.tap(ctx.bDrain, () => this.drain(ctx));
    ctx.bub.addEventListener("click", () => {
      U.replay(ctx.bub, "pop");
      if (ctx.order) KP.voice.say("이런 색 물감 주세요! " + U.josa(ctx.order.name, "이에요/예요") + ".");
      if (ctx.actor) ctx.actor.react("headTop");
    });
    ctx.round = 0;
    ctx.token = 0;
  },

  /* ---------- 단계별 주문 (물감 양 [빨,노,파,하,검] — 튜브 한 번 = 한 방울) ---------- */
  ORDERS: {
    1: [[1, 1, 0, 0, 0], [0, 1, 1, 0, 0], [1, 0, 1, 0, 0]],
    2: [[2, 1, 0, 0, 0], [1, 2, 0, 0, 0], [0, 2, 1, 0, 0], [1, 1, 1, 0, 0]],
    3: [[1, 0, 0, 2, 0], [0, 0, 1, 2, 0], [1, 0, 1, 2, 0], [1, 1, 0, 3, 0], [0, 0, 0, 2, 1], [0, 0, 2, 0, 1], [0, 1, 1, 0, 1]],
  },
  JARS: { 1: [0, 1, 2], 2: [0, 1, 2], 3: [0, 1, 2, 3, 4] },
  /* 허용 거리 (Lab): 각 물감 양을 ±s 바꿨을 때의 평균 색 차이 → 단계별 범위로 자름 (colororder 와 같은 방식, 더 너그럽게) */
  TOL: { 1: [0.35, 12, 22], 2: [0.3, 10, 18], 3: [0.25, 9, 16] },
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
  MORE: ["빨갛게", "노랗게", "파랗게", "밝게", "어둡게"],

  /* ---------- 무대 · 인형 (병원 놀이와 같은 틀) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("mix:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => {
        if (!ctx._active || ctx.st !== st) return;
        this.start(ctx, true);
      },
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("mix:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    let st;
    try {
      st = CS.create(ctx.room, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.room, ctx.BG, opt);
    }
    ctx.st = st;
    st.ui.append(ctx.studio.bowlEl, ctx.studio.jarsEl, ctx.bDrain, ctx.bub);
    let busyLayout = false;
    st.onResize = () => {
      if (busyLayout) return;
      busyLayout = true;
      try {
        this.layout(ctx);
      } finally {
        busyLayout = false;
      }
    };
    this.layout(ctx);
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
  },

  /** 화면 배치: 그릇(그림 속 팔레트 자리)·튜브·비우기·손님 자리 — 그림 자르기(focus·zoom)를 그릇 자리에 맞춤 */
  layout(ctx) {
    const st = ctx.st,
      P = KP.paint,
      S = P.STAGE;
    if (!st || st.dead) return;
    const w = ctx.room.clientWidth,
      h = ctx.room.clientHeight;
    if (!w || !h) return;
    const T = ctx.TILT,
      land = w >= h * 1.05,
      jars = ctx.studio.jarsEl;
    jars.classList.toggle("col", land);
    jars.classList.toggle("row", !land);
    const jw = jars.offsetWidth || 160,
      jh = jars.offsetHeight || 100;
    let D, cx, cy;
    if (land) {
      const left = jw + 16;
      D = Math.min((w - left) * 0.56, ((h - 20) / T) * 0.8, 580);
      cx = left + (w - left) * 0.4;
      cy = Math.min(h - 14 - (D * T) / 2, h * 0.6);
      jars.style.left = "10px";
      jars.style.top = Math.max(8, (h - jh) / 2) + "px";
      ctx.bDrain.style.left = "";
      ctx.bDrain.style.right = "12px";
      ctx.bDrain.style.top = "";
      ctx.bDrain.style.bottom = "12px";
    } else {
      D = Math.min(w * 0.86, ((h - jh - 24) / T) * 0.6, 560);
      cx = w / 2;
      cy = h - jh - 18 - (D * T) / 2;
      jars.style.left = Math.max(6, (w - jw) / 2) + "px";
      jars.style.top = h - jh - 8 + "px";
      ctx.bDrain.style.right = "";
      ctx.bDrain.style.left = "10px";
      ctx.bDrain.style.bottom = "";
      ctx.bDrain.style.top = "10px";
    }
    D = Math.max(160, Math.round(D));
    // 그림 자르기: 팔레트 폭 ≈ 그릇 지름, 팔레트 가운데 = 그릇 가운데
    const IW = S.img[0],
      IH = S.img[1];
    const k0 = Math.max(w / IW, h / IH);
    const zm = Math.max(1, Math.min(2.2, D / (S.pal[2] * IW * k0)));
    const fw = IW * k0 * zm,
      fh = IH * k0 * zm;
    const fu = (S.pal[0] * fw - cx + w / 2) / fw,
      fv = (S.pal[1] * fh - cy + h / 2) / fh;
    const B = ctx.BG;
    B.zoom = B.zoomP = zm;
    B.focus = B.focusP = [fu, fv];
    st.resize(true);
    // 실제 팔레트 자리(자르기 한계로 조금 어긋날 수 있음)에 그릇을 놓음
    const p = st.uvToPx(S.pal[0], S.pal[1]);
    const bx = U_clamp(p.x, D / 2 + 4, w - D / 2 - 4),
      by = U_clamp(p.y, (D * T) / 2 + 4, h - (D * T) / 2 - 4);
    ctx.studio.fit(D);
    const be = ctx.studio.bowlEl;
    be.style.transform = "translate(" + Math.round(bx - D / 2) + "px," + Math.round(by - (D * T) / 2) + "px)";
    ctx.bowlC = { x: bx, y: by, D };
    // 손님 자리: 가로 화면은 그릇 오른쪽 탁자, 세로 화면은 그릇 뒤
    const view = st.bc.view;
    let sx, sy;
    if (land) {
      sx = Math.min(w - 70, bx + D / 2 + (w - (bx + D / 2)) * 0.5);
      sy = by - D * T * 0.18;
    } else {
      sx = bx + D * 0.08;
      sy = by - D * T * 0.42;
    }
    const g = st.bc.ground((sx + view.ox) / view.fw, (sy + view.oy) / view.fh) || st.bc.ground(0.6, 0.62) || [0, -5];
    ctx.spot = g;
    ctx.guestFrac = land ? (h < 480 ? 0.42 : 0.36) : h > 900 ? 0.3 : 0.27;
    if (ctx.actor && !ctx.leaving) {
      ctx.actor.setH(st.fitH(g[0], g[1], ctx.guestFrac));
      if (ctx.actor.a.state === "idle" && !ctx.actor._jump) ctx.actor.place(g[0], g[1]);
    }
    function U_clamp(v, a, b) {
      return b < a ? (a + b) / 2 : Math.max(a, Math.min(b, v));
    }
  },
  pickDoll(ctx) {
    const U = KP.u,
      D = KP.DOLL;
    const list = ctx.dolls || [];
    if (list.length) {
      const c = list.length > 1 ? list.filter((x) => x.id !== ctx.lastDoll) : list;
      const it = U.pick(c);
      ctx.lastDoll = it.id;
      return { item: it };
    }
    const sp = U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },

  async start(ctx, again) {
    ctx.round = again ? ctx.round : 0;
    const tok = ++ctx.token;
    ctx.order = null;
    ctx.busy = true;
    ctx.room.querySelectorAll(".mxLoad").forEach((e) => e.remove());
    const wait = KP.u.el("div", "mxLoad", KP.E("🧸") + " 준비 중");
    const wt = ctx.after(400, () => ctx.room.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.studio.bowl.clear();
    let acc = 0,
      stirTold = 0;
    ctx.loop((dt, now) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      ctx.studio.tick(dt);
      if (ctx.track) ctx.track();
      acc += dt;
      if (acc < 0.25) return;
      acc = 0;
      const o = ctx.order,
        s = ctx.studio.state,
        vol = ctx.studio.bowl.volume();
      if (!o || ctx.busy) return;
      // 넣고 가만히 있으면 젓기 안내
      if (ctx.poured && vol > 0.6 && s.even < 0.72 && now - s.lastPourAt > 3200 && now - s.lastStirAt > 3200 && now - stirTold > 10000) {
        stirTold = now;
        KP.voice.say("숟가락으로 빙글빙글 저어요!");
      }
      this.check(ctx, now);
    });
    return this.next(ctx, !again);
  },
  stop(ctx) {
    ctx.token++;
    ctx.order = null;
    this.dropStage(ctx);
  },

  async next(ctx, first) {
    const U = KP.u,
      P = KP.paint,
      A = KP.audio,
      st = ctx.st;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    ctx.busy = true;
    ctx.order = null;
    ctx.track = null;
    ctx.bub.style.display = "none";
    // 주문: 지난번과 다른 색
    const list = this.ORDERS[lv];
    let v;
    do v = U.pick(list);
    while (list.length > 1 && ctx.lastV && v === ctx.lastV);
    ctx.lastV = v;
    const target = P.mix(v);
    const name = P.nameOf(target).n;
    // 튜브: 이 단계에서 쓰는 것만
    const jars = this.JARS[lv];
    [0, 1, 2, 3, 4].forEach((id) => (ctx.studio.jar(id).style.display = jars.includes(id) ? "" : "none"));
    ctx.studio.bowl.clear();
    ctx.studio.setEnabled(false);
    this.layout(ctx);

    /* 인형 손님 */
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    const pick = this.pickDoll(ctx);
    let act;
    try {
      act = st.gl ? await KP.dollActor.create(st, pick) : await KP.dollActor.create2D(st, pick);
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (!live()) return;
      act = await KP.dollActor.create2D(st, { species: "bear" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    ctx.leaving = false;
    const g = ctx.spot;
    act.setH(st.fitH(g[0], g[1], ctx.guestFrac));
    const offX = (side) => {
      const b = act.box(),
        hw = b.w / 2 + 20,
        px = st.project(g[0], 0, g[1]).x;
      return g[0] + st.pxToWorld(g[0], g[1], side > 0 ? st.w - px + hw : -px - hw);
    };
    act.place(g[0], g[1]);
    act.place(offX(1), g[1]);
    act.mood("normal");
    const enter = act.jumpTo(g[0], g[1], 0.8, 0.5);
    A.sfx("boing");

    /* 말풍선: 견본 색 + 레시피 방울 */
    const B = ctx.bub;
    const drops = v
      .map((x, i) => {
        if (!x) return "";
        let h = "";
        for (let k = 0; k < x; k++) h += '<i class="' + (i === 3 ? "w" : "") + '" style="--c:' + P.BASE[i].hex + '"></i>';
        return h;
      })
      .filter(Boolean)
      .join('<span class="pl">+</span>');
    B.innerHTML = '<span class="mxSw" style="--t:' + P.hex(target) + '"></span><span class="mxRec"><b>' + name + '</b><span class="mxDrops">' + drops + "</span></span>";
    B.style.display = "";
    U.replay(B, "in");
    ctx.track = () => {
      const bx = act.box(),
        hp = act.anchor("headTop");
      const dh = Math.max(80, bx.h);
      B.style.setProperty("--dh", Math.min(dh, 320) + "px");
      const bw = B.offsetWidth,
        bh = B.offsetHeight;
      // 머리 위 (자리가 없으면 옆) — 그릇과 겹치지 않게
      let x = hp.x - bw * 0.2,
        y = hp.y - bh - dh * 0.1;
      if (y < 6) {
        y = 6;
        x = bx.r + 8;
        if (x + bw > st.w - 6) x = bx.l - bw - 8;
      }
      x = U.clamp(x, 6, st.w - bw - 6);
      B.style.setProperty("--tx", U.clamp(hp.x - x - 8, 10, bw - 24) + "px");
      B.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
    };

    ctx.order = { v, target, name, hex: P.hex(target), tol: this.tolFor(v, lv), lv, advN: 0, asked: 0, stirTold: false };
    ctx.poured = false;
    ctx.dirty = false;
    const hello = first ? "안녕! 나는 " + U.josa(act.name, "이에요/예요") + ". " : "";
    ctx.say("🎨 " + hello + "이런 색 물감 주세요! " + U.josa(name, "이에요/예요") + ".");
    await Promise.race([enter, ctx.wait(1200)]);
    if (!live()) return;
    act.wave(1.4);
    ctx.busy = false;
    ctx.studio.setEnabled(true);
    const firstId = v.findIndex((x) => x > 0);
    ctx.hint(() => ctx.studio.jar(firstId), "물감 통을 눌러 그릇에 넣어요!");
    // 점검용
    ctx.mxState = () => ({ lv, v, name, hex: ctx.order && ctx.order.hex, tol: ctx.order && ctx.order.tol, busy: ctx.busy, gl: !!st.gl, painted: act.painted, even: ctx.studio.state.even, adv: ctx.order && ctx.order.advN });
  },

  /** 고르게 섞였으면 색 보기: 맞으면 성공, 아니면 도움말 (새로 넣은 뒤 한 번만) */
  check(ctx, now) {
    const P = KP.paint,
      U = KP.u,
      o = ctx.order,
      studio = ctx.studio,
      s = studio.state,
      bowl = studio.bowl;
    if (!ctx.dirty || s.pending > 0.01 || now - s.lastPourAt < 900 || s.even < 0.74) return;
    const tot = bowl.total();
    const vol = tot.reduce((a, b) => a + b, 0);
    if (vol < 0.5) return;
    const has = (i) => tot[i] >= 0.45;
    const need = o.v.map((x, i) => (x > 0 ? i : -1)).filter((i) => i >= 0);
    const missing = need.filter((i) => !has(i));
    const foreign = tot.some((x, i) => x >= 0.45 && !o.v[i]);
    const d = P.dist(P.mix(tot), o.target);
    if (d <= o.tol) return this.success(ctx);
    if (missing.length && !foreign) {
      // 아직 다 안 넣음 → 다음 물감 안내 (실수 아님)
      if (now - (o.askT || 0) < 6000) return;
      o.askT = now;
      ctx.dirty = false;
      KP.voice.say("좋아요! 하나 더 넣어 볼까요?");
      ctx.hint(() => studio.jar(missing[0]), "물감 통을 눌러 그릇에 넣어요!");
      return;
    }
    ctx.dirty = false;
    o.advN++;
    const act = ctx.actor;
    if (act) {
      act.react("headTop");
      act.mood("normal");
    }
    const best = P.advise(tot, o.v, o.target, o.tol, bowl.capacity);
    ctx.miss(null, null, { soft: true });
    if (best) {
      const p = P.BASE[best.id];
      const tip = U.josa(p.n, "을/를") + (best.lot ? " 많이 넣어 봐요!" : " 조금 더 넣어 봐요!");
      KP.voice.say("음, 조금 달라요. " + (best.lot ? "훨씬 더 " : "조금 더 ") + this.MORE[best.id] + " 해 볼까요? " + tip);
      ctx.hint(() => studio.jar(best.id), tip);
    } else {
      KP.voice.say("앗, 물감이 너무 많이 들어갔어요. 비우고 다시 해 볼까요?");
      ctx.hint(() => ctx.bDrain, "비우기를 누르고 다시 해 봐요!");
    }
  },

  async drain(ctx) {
    if (ctx.busy || !ctx.order) return;
    const studio = ctx.studio;
    if (studio.bowl.volume() < 0.05) return KP.voice.say("그릇이 벌써 비어 있어요!");
    ctx.busy = true;
    KP.voice.say("쏴아! 비웠어요. 다시 섞어 봐요.");
    await studio.drain();
    ctx.busy = false;
    ctx.dirty = false;
    ctx.poured = false;
    const o = ctx.order;
    if (o) ctx.hint(() => studio.jar(o.v.findIndex((x) => x > 0)), "물감 통을 눌러 그릇에 넣어요!");
  },

  async success(ctx) {
    const U = KP.u,
      P = KP.paint,
      A = KP.audio,
      FX = KP.pfx;
    const o = ctx.order,
      st = ctx.st,
      act = ctx.actor;
    const tok = ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && st && !st.dead;
    ctx.busy = true;
    ctx.dirty = false;
    ctx.hint(null);
    ctx.studio.setEnabled(false);
    const tot = ctx.studio.bowl.total();
    const made = ctx.studio.bowl.color(),
      hex = P.hex(made);
    // 그릇에서 손님에게 물감이 날아감
    const a = ctx.studio.bowl.cv.getBoundingClientRect(),
      r = ctx.room.getBoundingClientRect(),
      c = act.anchor("belly");
    const fly = U.el("div", "mxFly");
    fly.style.background = hex;
    fly.style.left = a.left + a.width / 2 - 32 + "px";
    fly.style.top = a.top + a.height / 2 - 32 + "px";
    document.body.appendChild(fly);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fly.style.transform = "translate(" + (r.left + c.x - a.left - a.width / 2) + "px," + (r.top + c.y - a.top - a.height / 2) + "px) scale(.5)";
        fly.style.opacity = ".2";
      })
    );
    setTimeout(() => fly.remove(), 800);
    A.sfx("whoosh");
    await ctx.wait(750);
    if (!live()) return;
    // 인형이 그 색으로 물듦 + 폴짝
    act.glow("belly", hex, 0.85, 1.25);
    act.mood("happy");
    act.happy();
    A.sfx("good");
    A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.14, inst: "marimba", vol: 0.2, when: 0.2 });
    const hp = act.anchor("headTop");
    if (FX) FX.hearts(st.ui, hp.x, hp.y, 6, ctx);
    ctx.bub.innerHTML = '<span class="mxSw" style="--t:' + hex + '"></span><span class="mxRec"><b>' + KP.E("💖") + "</b></span>";
    const isNew = P.discover(o.name);
    P.saveMine(hex, o.name, tot); // 만든 물감은 내 물감 통에도 (색칠 공방·그림 그리기 팔레트)
    KP.voice.say(U.pick(["와, 똑같아요! 고마워요!", "딱 이 색이에요! 고마워요!", "우와, 정말 예뻐요! 고마워요!"]) + (isNew ? " 도감에 " + U.josa(o.name, "이/가") + " 생겼어요!" : ""));
    ctx.after(900, () => live() && act.happy());
    ctx.score.add(1);
    ctx.round++;
    await ctx.wait(1500);
    if (!live()) return;
    const big = ctx.round % 4 === 0;
    const ok = await ctx.win({ msg: big ? "{부름} 색깔 마법사!" : o.name + " 완성!", big });
    if (!ok || !live()) return;
    // 손님은 인사하고 떠남 → 그릇 비우고 다음 손님
    ctx.leaving = true;
    ctx.bub.style.display = "none";
    act.wave(1.2);
    await ctx.wait(500);
    if (!live()) return;
    const g = ctx.spot,
      b = act.box(),
      px = st.project(g[0], 0, g[1]).x;
    const ox = g[0] + st.pxToWorld(g[0], g[1], -px - b.w / 2 - 20);
    A.sfx("whoosh");
    await Promise.race([act.jumpTo(ox, g[1], 0.9, 0.3), ctx.wait(1300)]);
    if (!live()) return;
    await ctx.studio.drain();
    if (!live()) return;
    this.next(ctx);
  },
});
