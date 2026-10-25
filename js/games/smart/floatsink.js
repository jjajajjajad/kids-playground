/* 둥실? 퐁당! — 점토 실험대 위 둥근 어항에 물건을 넣어 뜨는지 가라앉는지 직접 보는 탐구 놀이
   - 배경: 점토 방의 실험대 위 둥근 어항(물 2/3, 바닥 자갈). 물건은 점토 그림(15종)
   - 물건을 끌어 어항에 놓으면: 떨어짐 → 물보라(첨벙) → 뜨는 것은 물 위에서 둥실 흔들리고, 가라앉는 것은 거품을 내며 내려가 바닥에 '톡'
     물속에 잠긴 부분만 푸르게(그림을 물높이에서 둘로 나눠 아래쪽만 물빛·살짝 굴절) — 물건마다 잠기는 정도가 다름(얼음은 거의 다 잠김)
   - 아이가 칠한 3D 인형 1마리가 어항 옆에서 관찰 친구: 예상 고를 때 고개 갸웃(?) · 뜨면 폴짝 · 가라앉으면 아래를 내려다봄 · 생각이랑 다르면 깜짝(!)
   1단계: 자유롭게 넣어 보기 (물건 4개) — 별 없는 탐구형 (해 본 것을 칭찬)
   2단계: 넣기 전에 '뜰까? 가라앉을까?' 예상(둥실/퐁당 그림) → 넣어서 확인 (물건 3개)
   3단계: 두 물건 비교 — "어느 게 둥실 뜰까?" 하나 고르고 같이 넣기 (3쌍)
   열쇠 별: 2·3단계는 보기가 2개라 한 번만으로는 '찍어도 반' → 한 판의 예상 3번이 모두 맞을 때만 깨끗한 판
            (찍어서 다 맞힐 확률 1/8 — 보기 3개 한 문제(1/3)보다 낮음). 하나라도 다르면 _fewChoice 로 별 없음.
            예상이 달라도 틀림 소리·단계 내림 없음(직접 해 보고 알게 되는 놀이).
   물건: 실제로 결과가 분명한 것만. "큰 건 가라앉아" 같은 잘못된 일반화가 안 생기게
         큰데 뜨는 것(나무토막·수박)과 작은데 가라앉는 것(동전·열쇠·나사·반지)을 판마다 꼭 섞고,
         말도 "커도 둥실 떠요 / 작아도 퐁당 가라앉아요". '가벼워서 뜬다' 같은 이유는 말하지 않음(동전도 가벼움).
   공용: _shared/clay-stage.js(무대) · doll-actor.js(인형) · doll-follow.js(말풍선 따라가기) */
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
    const IMG = (ctx.IMG = "assets/play-clay/floatsink/");
    KP.css("floatsink", `
      .fsWrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(6px,1.2vh,12px);padding:2px 12px 12px}
      .fsScene{position:relative;flex:1 1 0;min-height:150px;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);background:#e9dcc6}
      .fsGlass{position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;pointer-events:none;mix-blend-mode:screen;opacity:.32;z-index:0}
      .fsZone{position:absolute;left:0;top:0;border-radius:46% 46% 44% 44%;pointer-events:none!important;transition:box-shadow .2s}
      .fsZone.dropHover{box-shadow:0 0 0 8px rgba(255,214,90,.55),inset 0 0 40px rgba(255,236,170,.35)}
      .fsObjL{position:absolute;inset:0;pointer-events:none!important;z-index:0;overflow:hidden}
      .fo{position:absolute;left:0;top:0;width:var(--s,80px);height:var(--s,80px);pointer-events:none;will-change:transform}
      .fo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
      .fo .a{filter:drop-shadow(0 4px 3px rgba(40,60,80,.18))}
      .fo .w{position:absolute;inset:0}
      .fo .w img{transform:translateX(3%) scale(1.05,1);filter:saturate(.7) brightness(.92)}
      .fo .w i{position:absolute;inset:0;transform:translateX(3%) scale(1.05,1);background:linear-gradient(rgba(120,205,240,.26),rgba(50,140,205,.4));
        -webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}
      .fo .ln{position:absolute;left:8%;right:8%;height:6px;margin-top:-3px;border-radius:50%;border:2px solid rgba(255,255,255,.85);border-bottom-color:rgba(255,255,255,.25);display:none}
      .fsTag{position:absolute;left:0;top:0;transform:translate(-50%,-100%);font-size:clamp(14px,1.9vw,20px);background:#fffaf2;border-radius:999px;padding:2px 10px;white-space:nowrap;box-shadow:0 3px 0 rgba(120,80,40,.15);animation:fsTagIn .3s cubic-bezier(.2,1.5,.4,1);pointer-events:none!important;z-index:5}
      @keyframes fsTagIn{from{scale:.5;opacity:0}}
      .fsDrop{position:absolute;left:0;top:0;width:12px;height:16px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#bfe8ff;box-shadow:inset -2px -3px 0 rgba(60,150,220,.35);pointer-events:none!important;z-index:6;animation:fsDrop .75s ease-out forwards}
      @keyframes fsDrop{0%{transform:translate(var(--x),var(--y)) translate(-50%,0) scale(.6);opacity:1}55%{transform:translate(calc(var(--x) + var(--dx)*.7),calc(var(--y) + var(--dy))) translate(-50%,0) scale(1)}100%{transform:translate(calc(var(--x) + var(--dx)),calc(var(--y) + var(--dy)*.2 + 30px)) translate(-50%,0) scale(.5);opacity:0}}
      .fsRing{position:absolute;left:0;top:0;width:var(--w,60px);height:calc(var(--w,60px)*.24);border:3px solid rgba(255,255,255,.9);border-radius:50%;pointer-events:none!important;z-index:2;animation:fsRing .9s ease-out forwards}
      @keyframes fsRing{from{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(2.2);opacity:0}}
      .fsBub{position:absolute;left:0;top:0;width:var(--b,12px);height:var(--b,12px);border-radius:50%;border:2px solid rgba(255,255,255,.9);background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.7),rgba(255,255,255,.1) 60%);pointer-events:none!important;z-index:2;animation:fsBub 1.4s ease-in forwards}
      @keyframes fsBub{from{transform:translate(var(--x),var(--y)) translate(-50%,-50%)}to{transform:translate(calc(var(--x) + var(--dx)),calc(var(--y) + var(--rise))) translate(-50%,-50%) scale(1.3);opacity:0}}
      .fsThink{display:flex;align-items:center;justify-content:center;min-width:1.5em;height:1.5em;padding:0 .2em;border-radius:999px;background:#fffaf2;box-shadow:0 4px 0 rgba(120,80,40,.15);font-size:clamp(20px,calc(var(--dh,200px)*.12),40px);font-weight:bold;color:#7b6ad8;animation:popIn .35s cubic-bezier(.2,1.5,.4,1)}
      .fsThink.ex{color:#ff7a3d}
      .fsThink.q{animation:fsWob 1.6s ease-in-out infinite}
      @keyframes fsWob{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
      .fsLoad{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      .fsSide{flex:0 0 auto;display:flex;flex-direction:row;gap:clamp(8px,1.6vw,18px);align-items:center;justify-content:center;flex-wrap:wrap}
      .fsPred{display:flex;gap:clamp(10px,2vw,22px);justify-content:center}
      .fsPred[hidden]{display:none}
      .fsPB{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px 6px;border-radius:24px;background:#fffaf2;box-shadow:0 6px 0 rgba(140,95,50,.18);font-size:clamp(18px,2.4vw,24px);color:var(--ink);min-width:96px}
      .fsPB:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(140,95,50,.18)}
      .fsPB.picked{background:#fff3c4;box-shadow:0 0 0 5px #ffc531,0 6px 0 rgba(140,95,50,.18)}
      .fsPB.off{opacity:.45}
      .fsMini{position:relative;width:var(--mw,84px);height:calc(var(--mw,84px)*.8);border-radius:40% 40% 34% 34%;overflow:hidden;background:#f2f8fb;border:3px solid #cfe4ef}
      .fsMini::before{content:"";position:absolute;left:0;right:0;top:40%;bottom:0;background:linear-gradient(180deg,#8fd4f5,#4aa6e0)}
      .fsMini::after{content:"";position:absolute;left:0;right:0;bottom:0;height:16%;background:radial-gradient(circle at 30% 40%,#d9c08f 3px,transparent 4px) 0 0/12px 8px,#e6cf9e}
      .fsMini img{position:absolute;left:50%;width:46%;height:46%;object-fit:contain;transform:translate(-50%,-50%);z-index:1}
      .fsMini.up img{top:38%;animation:fsBob 2.2s ease-in-out infinite}
      .fsMini.down img{top:66%}
      @keyframes fsBob{50%{transform:translate(-50%,-44%) rotate(4deg)}}
      .fsMini .fsArrow{position:absolute;right:3px;top:50%;width:24%;transform:translateY(-50%);z-index:2}
      .fsMini .fsArrow .e{width:100%;height:auto}
      .fsTray{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,2vw,22px);padding:clamp(8px,1.4vh,14px) clamp(12px,2.4vw,26px);border-radius:28px;
        background:linear-gradient(#f7ead6,#efdcc0);box-shadow:inset 0 -6px 0 rgba(160,110,60,.16),0 4px 0 rgba(120,80,40,.12);max-width:100%}
      .fsItem{width:var(--is,84px);height:var(--is,84px);display:flex;align-items:center;justify-content:center;border-radius:24px;background:radial-gradient(circle at 50% 38%,#fffaf2,#f6e7d2);box-shadow:0 6px 0 rgba(140,95,50,.18);position:relative;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1)}
      .fsItem img{width:calc(78% * var(--sc,1));height:calc(78% * var(--sc,1));object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(80,40,20,.22))}
      .fsItem.dragging{background:transparent;box-shadow:none;z-index:20}
      .fsItem.used{visibility:hidden}
      .fsItem.dim{opacity:.35}
      .fsItem.cur{box-shadow:0 0 0 5px #ffc531,0 6px 0 rgba(140,95,50,.18);animation:fsCur 1.4s ease-in-out infinite}
      @keyframes fsCur{50%{transform:scale(1.06)}}
      .fsItem.picked{background:#fff3c4;box-shadow:0 0 0 6px #ffc531,0 6px 0 rgba(140,95,50,.18)}
      .fsWrap.pair .fsItem{--is:var(--is2,110px)}
      @media (orientation:portrait){
        .fsScene{flex:0 1 auto;height:min(calc((100vw - 24px) / 1.08), 64vh)}
        .fsSide{flex:1 1 0;flex-direction:column;justify-content:center}
      }
      @media (orientation:landscape) and (max-height:520px){
        .fsWrap{flex-direction:row;padding:2px 10px 8px}
        .fsScene{min-height:0}
        .fsSide{width:min(40vw,300px);flex-direction:column;flex-wrap:nowrap}
        .fsTray{gap:8px;padding:8px 10px}
      }
    `);
    const wrap = (ctx.fsWrap = U.el("div", "fsWrap"));
    const scene = (ctx.scene = U.el("div", "fsScene"));
    const side = U.el("div", "fsSide");
    ctx.pred = U.el("div", "fsPred");
    ctx.pred.hidden = true;
    ctx.shelf = U.el("div", "fsTray");
    side.append(ctx.pred, ctx.shelf);
    wrap.append(scene, side);
    ctx.body.appendChild(wrap);
    // 무대 위 층들 (무대를 새로 만들 때마다 옮겨 붙임)
    ctx.zone = U.el("div", "fsZone");
    ctx.objL = U.el("div", "fsObjL");
    ctx.glass = U.el("div", "fsGlass");

    // [그림, 이름, 뜨나?, 크기(big/mid/small), 결과 말, 잠기는 정도(뜨는 것)]
    // 크기는 그림 크기(sc)로도 보여 줌 — 큰데 뜨는 것·작은데 가라앉는 것을 눈으로 보게
    const T = (img, name, fl, sz, line, sub) => ({ img: IMG + img + ".png", em: img, name, fl, sz, line, sub: sub || 0 });
    ctx.FLOAT = [
      T("wood", "나무토막", true, "big", "나무토막은 커도 둥실 떠요!", 0.5),
      T("melon", "수박", true, "big", "수박은 커도 둥실 떠요!", 0.6),
      T("duck", "오리", true, "mid", "오리는 둥실 떠요!", 0.3),
      T("apple", "사과", true, "mid", "사과는 둥실 떠요!", 0.72),
      T("ball", "공", true, "mid", "공은 둥실 떠요!", 0.16),
      T("ice", "얼음", true, "mid", "얼음은 둥실 떠요!", 0.86),
      T("leaf", "나뭇잎", true, "small", "나뭇잎은 둥실 떠요!", 0.12),
      T("feather", "깃털", true, "small", "깃털은 둥실 떠요!", 0.08),
    ];
    ctx.SINK = [
      T("stone", "돌", false, "big", "돌은 퐁당 가라앉아요!"),
      T("anchor", "닻", false, "big", "닻은 퐁당 가라앉아요!"),
      T("spoon", "숟가락", false, "mid", "숟가락은 퐁당 가라앉아요!"),
      T("coin", "동전", false, "small", "동전은 작아도 퐁당 가라앉아요!"),
      T("key", "열쇠", false, "small", "열쇠는 작아도 퐁당 가라앉아요!"),
      T("bolt", "나사", false, "small", "나사는 작아도 퐁당 가라앉아요!"),
      T("ring", "반지", false, "small", "반지는 작아도 퐁당 가라앉아요!"),
    ];
    ctx.SC = { big: 1.3, mid: 1, small: 0.76 };
    // 잘못된 일반화를 깨는 물건: 큰데 뜸 / 작은데 가라앉음
    ctx.isCounter = (t) => (t.fl && t.sz === "big") || (!t.fl && t.sz === "small");
    // 어항 그림(1344×752) 안의 자리 (그림 px): 물높이·바닥(자갈 위)·물 안쪽 좌우
    ctx.TANK = { surf: 311, rest: 588, l: 352, r: 992, slots: [452, 562, 672, 782, 892], top: 140 };
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1344, 752], vh: 0.52, near: 0.2, fov: 34, focus: [0.55, 0.5], focusP: [0.558, 0.5],
      sun: [-0.6, 1, 0.5], sunCol: "#fff3e0",
    };
    ctx.fsSize = () => {
      const vw = innerWidth, vh = innerHeight;
      const row = getComputedStyle(wrap).flexDirection === "row";
      const portrait = vh > vw;
      const n = ctx.shelf.children.length || 4;
      let is;
      if (row) is = U.clamp(Math.min((Math.min(vw * 0.4, 300) - 30) / Math.min(n, 2) - 10, vh * 0.2), 58, 96);
      else if (portrait) is = U.clamp(Math.min((vw - 60) / n - 14, vh * 0.12), 60, 112);
      else is = U.clamp(Math.min((vw * 0.55) / n - 14, vh * 0.12), 60, 104);
      wrap.style.setProperty("--is", Math.round(is) + "px");
      wrap.style.setProperty("--is2", Math.round(row ? U.clamp(Math.min(vw * 0.17, vh * 0.3), 70, 120) : U.clamp(Math.min(vw * 0.3, vh * 0.15), 80, 136)) + "px");
      ctx.pred.style.setProperty("--mw", Math.round(row ? U.clamp(vh * 0.2, 60, 84) : U.clamp(Math.min(vw * 0.18, vh * 0.1), 64, 96)) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.fsSize());
    ctx.token = 0;
    ctx.objs = [];
  },

  /* ---------- 무대 · 인형 (병원·목욕과 같은 방식) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("floatsink:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active || tok !== ctx._stTok) return null;
    let st;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => ctx._active && ctx.st === st && this.start(ctx, true),
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("floatsink:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    try {
      st = CS.create(ctx.scene, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.scene, ctx.BG, opt);
    }
    ctx.st = st;
    // 물건 층·유리 반사는 배경 바로 위(3D 인형 아래) — 인형은 어항 앞에 서 있으니 늘 물건보다 앞
    st.ui.append(ctx.zone);
    ctx.scene.insertBefore(ctx.objL, st.bgEl.nextSibling);
    ctx.scene.insertBefore(ctx.glass, ctx.objL.nextSibling); // 어항 유리 반사: 물건 위에 살짝 (물건이 유리 안에 있는 느낌)
    ctx.glass.style.backgroundImage = 'url("' + ctx.BG.file + '")';
    st.onResize = () => this.layout(ctx);
    this.layout(ctx);
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.fw) ctx.fw.clear();
    ctx.fw = null;
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
    ctx.glass.remove();
    ctx.objL.remove();
  },
  /** 화면 크기에 맞춰: 넣는 곳(어항)·유리 반사·인형 자리 */
  layout(ctx) {
    const st = ctx.st, U = KP.u;
    if (!st || !st.bc) return;
    const v = st.bc.view, k = v.fw / 1344, TK = ctx.TANK;
    const p = (x, y) => ({ x: x * k - v.ox, y: y * k - v.oy });
    const a = p(TK.l - 10, 170), b = p(TK.r + 10, 660);
    ctx.zone.style.cssText = `width:${b.x - a.x}px;height:${b.y - a.y}px;transform:translate(${a.x}px,${a.y}px)`;
    // 유리 반사 층: 배경과 같은 크기·자리, 어항 모양만
    const g = ctx.glass.style;
    g.backgroundSize = v.fw + "px " + v.fh + "px";
    g.backgroundPosition = -v.ox + "px " + -v.oy + "px";
    const c = p((TK.l + TK.r) / 2 - 2, 405), rx = 330 * k, ry = 262 * k;
    g.clipPath = `ellipse(${rx}px ${ry}px at ${c.x}px ${c.y}px)`;
    ctx.K = k;
    ctx.P = p;
    // 인형: 어항 오른쪽 실험대 위 (좁은 화면은 화면 안쪽으로 — 어항 앞 오른쪽)
    const act = ctx.actor;
    if (act) {
      const foot = p(1080, 690);
      const gr = (x, y) => st.bc.ground((x + v.ox) / v.fw, (y + v.oy) / v.fh);
      const g0 = gr(foot.x, foot.y) || st.spot("x");
      act.setH(st.fitH(g0[0], g0[1], st.h > st.w * 0.95 ? 0.3 : 0.4));
      const bw = act.box().w || 120;
      const right = p(TK.r, 500).x;
      const dx = U.clamp(Math.max(foot.x, right + bw * 0.42), bw * 0.6, st.w - bw * 0.55);
      ctx.dollAt = gr(dx, foot.y) || g0;
      if (act.a.state === "idle" && !act._jump && !ctx._entering) act.place(ctx.dollAt[0], ctx.dollAt[1]);
    }
  },
  pickDoll(ctx) {
    const U = KP.u, D = KP.DOLL;
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
    if (!again) ctx.round = 0;
    ctx.rid = ctx.rid || 0; // 판 번호는 계속 올림 (다시 열어도 done 중복 막기와 겹치지 않게)
    const tok = ++ctx.token;
    ctx.shelf.innerHTML = "";
    ctx.pred.hidden = true;
    this.clearObjs(ctx);
    ctx.scene.querySelectorAll(".fsLoad").forEach((e) => e.remove());
    const wait = KP.u.el("div", "fsLoad", KP.E("🦆") + " 준비 중");
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted().catch(() => []); // 저장 인형을 못 읽으면 기본 인형으로
    if (tok !== ctx.token || !ctx._active) {
      ctx.cancel(wt); // '준비 중' 표시가 뒤늦게 붙거나 남지 않게
      wait.remove();
      return;
    }
    const st = await this.makeStage(ctx);
    if (!st || tok !== ctx.token || !ctx._active) {
      ctx.cancel(wt);
      wait.remove();
      return;
    }
    // 관찰 친구 인형
    let act = null;
    try {
      act = st.gl ? await KP.dollActor.create(st, this.pickDoll(ctx)) : await KP.dollActor.create2D(st, this.pickDoll(ctx));
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (tok === ctx.token && ctx.st === st && !st.dead) act = await KP.dollActor.create2D(st, { species: "bear" }).catch(() => null);
    }
    ctx.cancel(wt);
    wait.remove();
    if (tok !== ctx.token || !ctx._active || ctx.st !== st || st.dead) {
      if (act) act.dispose();
      return;
    }
    ctx.actor = act;
    ctx.fw = act ? KP.dollFollow(st.ui, act, { cls: "dfT" }) : null;
    ctx.poseT = {};
    if (act) {
      this.layout(ctx);
      ctx._entering = true;
      const tgt = ctx.dollAt;
      act.place(tgt[0] + st.pxToWorld(tgt[0], tgt[1], st.w * 0.45), tgt[1]);
      act.jumpTo(tgt[0], tgt[1], 0.8, 0.5).then(() => {
        ctx._entering = false;
        this.layout(ctx);
      });
    }
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      this.poseStep(ctx, dt, st.time);
      if (ctx.fw) ctx.fw.update();
      this.stepObjs(ctx, dt, st.time);
    });
    // 점검용
    ctx.fsState = () => ({ gl: !!st.gl, painted: !!(act && act.painted), who: act && act.name, objs: ctx.objs.map((o) => ({ n: o.t.name, fl: o.t.fl, st: o.state, wl: Math.round(o.wl) })), level: ctx.level });
    this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    this.clearObjs(ctx);
    this.dropStage(ctx);
  },

  /* ---------- 인형 몸짓 ---------- */
  pose(ctx, o) {
    ctx.poseT = o || {};
  },
  poseStep(ctx, dt, t) {
    const act = ctx.actor;
    if (!act || !act.play) return;
    const p = act.play, k = Math.min(1, dt * 7), T = ctx.poseT || {};
    for (const key of ["fR", "fL", "uR", "uL", "nod", "tilt", "sway", "bob"]) p[key] += ((T[key] || 0) - p[key]) * k;
    if (ctx.tiltOn) p.tilt += Math.sin(t * 2.4) * 0.014;
  },
  /** 머리 위 생각 말풍선: "?" (궁금) · "!" (깜짝) · null (없앰) */
  think(ctx, ch) {
    if (!ctx.fw) return;
    if (ctx.thinkEl) ctx.fw.kill(ctx.thinkEl);
    ctx.thinkEl = null;
    if (!ch) return;
    const el = KP.u.el("span", "fsThink " + (ch === "?" ? "q" : "ex"), ch);
    ctx.thinkEl = el;
    ctx.fw.add(el, "headTop", -0.3, -0.12); // 머리 왼쪽 위(어항 쪽) — 인형이 화면 오른쪽 끝에 있어도 잘리지 않게
    ctx.scene.style.setProperty("--dh", ctx.fw.dh + "px");
  },
  /** 결과 보고 반응: 뜨면 폴짝·만세, 가라앉으면 아래를 내려다봄 → 끄덕 */
  react(ctx, fl, surprised) {
    const act = ctx.actor;
    if (!act) return;
    ctx.tiltOn = false;
    if (surprised) this.think(ctx, "!");
    else this.think(ctx, null);
    if (fl) {
      act.happy();
      this.pose(ctx, { uR: 1.6, uL: 1.6 });
      ctx.after(700, () => this.pose(ctx, {}));
    } else {
      this.pose(ctx, { nod: 0.32, tilt: -0.08 });
      ctx.after(900, () => {
        this.pose(ctx, {});
        act.hop();
      });
    }
    if (surprised) ctx.after(1400, () => this.think(ctx, null));
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
  clearObjs(ctx) {
    ctx.objs.forEach((o) => o.el.remove());
    ctx.objs = [];
    ctx.objL.innerHTML = "";
  },
  next(ctx) {
    ctx.rid++;
    this.clearObjs(ctx);
    ctx.slots = { true: [], false: [] };
    ctx.shelf.innerHTML = "";
    ctx.pred.hidden = true;
    ctx.tiltOn = false;
    this.think(ctx, null);
    this.pose(ctx, {});
    ctx.fsWrap.classList.toggle("pair", ctx.level === 3);
    const lv = ctx.level;
    if (lv === 1) this.free(ctx);
    else if (lv === 2) this.guess(ctx);
    else this.pair(ctx);
    ctx.fsSize();
  },
  item(ctx, t, i) {
    const U = KP.u;
    const el = U.el("div", "fsItem item", '<img alt="" draggable="false" src="' + t.img + '">');
    el.style.setProperty("--sc", ctx.SC[t.sz]);
    el.style.setProperty("--i", i);
    el.dataset.fl = t.fl ? "1" : "0"; // 점검용 (힌트는 이 값을 보지 않음)
    el.setAttribute("aria-label", t.name);
    ctx.shelf.appendChild(el);
    return el;
  },
  /** 끌어서 어항에 넣기 — 놓은 자리(가로 위치)로 떨어짐 */
  dragIn(ctx, el, t, opt) {
    const self = this;
    let lx = 0;
    const d = KP.drag(el, {
      targets: () => (ctx.st ? [ctx.zone] : []),
      pad: 30,
      snap: false,
      onPick: () => opt.pick && opt.pick(),
      onMove: (x) => (lx = x),
      onDrop: (tg) => {
        if (!tg || !ctx.st) return;
        d.lock();
        el.classList.add("used");
        el.style.transform = "";
        const r = ctx.scene.getBoundingClientRect(), v = ctx.st.bc.view;
        const ix = (lx - r.left + v.ox) / ctx.K; // 그림 px
        opt.drop(self.dropIn(ctx, t, ix));
      },
    });
    return d;
  },
  /** 떠 있는 줄 / 바닥 줄에서 비어 있는 가장 가까운 칸 (그림 px) */
  slot(ctx, fl, ix) {
    const S = ctx.TANK.slots;
    const used = ctx.slots[fl];
    const free = S.filter((s) => !used.includes(s));
    const list = free.length ? free : S;
    let best = list[0];
    list.forEach((s) => Math.abs(s - ix) < Math.abs(best - ix) && (best = s));
    used.push(best);
    return best;
  },

  /* ---------- 물에 넣기: 떨어짐 → 첨벙 → 둥실 / 퐁당·톡 (그림 px 좌표로 움직이고 매 장면 화면에 옮김) ---------- */
  dropIn(ctx, t, ix) {
    const U = KP.u;
    const x = this.slot(ctx, t.fl, U.clamp(ix, ctx.TANK.l + 60, ctx.TANK.r - 60));
    const size = 150 * ctx.SC[t.sz];
    const el = U.el("div", "fo", '<img class="a" alt="" src="' + t.img + '"><div class="w"><img alt="" src="' + t.img + '"><i></i></div><span class="ln"></span>');
    el.querySelector(".w i").style.maskImage = el.querySelector(".w i").style.webkitMaskImage = 'url("' + t.img + '")';
    ctx.objL.appendChild(el);
    const rid = ctx.rid;
    return new Promise((res) => {
      const o = {
        t, el, x, y: ctx.TANK.top, vy: 0, size, rot: U.randf(-10, 10), vr: U.randf(-40, 40), state: "fall", ph: Math.random() * 6, wl: 0, res, rid, tt: 0,
        a: el.querySelector(".a"), w: el.querySelector(".w"), ln: el.querySelector(".ln"),
      };
      // 그림 비율 (세로가 짧은 것은 실제로 차지하는 높이가 작음)
      const im = new Image();
      im.onload = () => (o.ar = im.naturalHeight / im.naturalWidth);
      im.src = t.img;
      o.ar = 1;
      ctx.objs.push(o);
      KP.audio.tone(700, { to: 300, dur: 0.25, vol: 0.06, type: "sine" }); // 휘익
    });
  },
  /** 매 장면: 물건 움직이기 + 물에 잠긴 부분 나누기 */
  stepObjs(ctx, dt, time) {
    if (!ctx.objs.length || !ctx.P) return;
    const TK = ctx.TANK, k = ctx.K, A = KP.audio, U = KP.u;
    for (const o of ctx.objs) {
      const hh = (o.size * Math.min(1, o.ar || 1)) / 2; // 실제 그림 반 높이 (그림 px)
      o.tt += dt;
      if (o.state === "fall") {
        o.vy += 2200 * dt;
        o.y += o.vy * dt;
        o.rot += o.vr * dt;
        if (o.y + hh >= TK.surf) {
          o.state = o.t.fl ? "float" : "sink";
          o.vy *= o.t.fl ? 0.35 : 0.3;
          this.splash(ctx, o.x, o.size);
          o.splashT = o.tt;
        }
      } else if (o.state === "float") {
        // 잠기는 정도(sub)만큼 물에 잠긴 자리로 — 출렁이며 자리 잡기
        const eq = TK.surf - hh + o.t.sub * hh * 2;
        o.vy += ((eq - o.y) * 60 - o.vy * 5) * dt;
        o.y += o.vy * dt;
        o.rot += (Math.sin(time * 1.7 + o.ph) * 4 - o.rot) * Math.min(1, dt * 3);
        if (!o.done && o.tt - o.splashT > 1.1) {
          o.done = true;
          [0, 0.12, 0.24].forEach((w, i) => A.note(["C5", "E5", "G5"][i], { inst: "marimba", dur: 0.25, vol: 0.2, when: w }));
          this.tag(ctx, o, "둥실");
          o.res();
        }
        if (o.done) o.y = eq + Math.sin(time * 2 + o.ph) * 2.5; // 둥실 흔들림
      } else if (o.state === "sink") {
        // 물속에서는 천천히 (끝 속도) · 좌우로 살랑
        o.vy += (230 - o.vy) * Math.min(1, dt * 3);
        o.y += o.vy * dt;
        o.rot += (Math.sin(o.tt * 3.2 + o.ph) * 12 - o.rot) * Math.min(1, dt * 4);
        o.bubT = (o.bubT || 0) - dt;
        if (o.bubT <= 0 && o.y < TK.rest - hh - 30) {
          o.bubT = 0.22;
          this.bubble(ctx, o, hh);
        }
        if (o.y + hh >= TK.rest) {
          o.y = TK.rest - hh;
          o.state = "land";
          o.vy = -60;
          o.settle = U.randf(-12, 12);
          A.tone(950, { to: 620, dur: 0.06, vol: 0.16, type: "triangle" }); // 톡
          A.noise({ dur: 0.08, vol: 0.08, bp: 900, q: 1.5 });
          if (ctx.st) KP.pfx.ring(ctx.objL, ctx.P(o.x, TK.rest).x, ctx.P(o.x, TK.rest).y, "rgba(255,255,255,.8)", ctx, o.size * k * 0.9);
        }
      } else if (o.state === "land") {
        o.vy += 900 * dt;
        o.y = Math.min(TK.rest - hh, o.y + o.vy * dt);
        o.rot += (o.settle - o.rot) * Math.min(1, dt * 6);
        if (!o.done && o.y >= TK.rest - hh - 0.5 && o.vy > 0) {
          o.done = true;
          this.tag(ctx, o, "퐁당");
          o.res();
        }
      }
      // 화면에 옮기기
      const c = ctx.P(o.x, o.y), s = o.size * k;
      o.el.style.setProperty("--s", s + "px");
      o.el.style.transform = `translate(${c.x - s / 2}px,${c.y - s / 2}px) rotate(${o.rot}deg)`;
      // 물높이 = 상자 위에서 몇 % 인가 (상자 = 정사각형 s, 가운데 o.y)
      const wl = U.clamp(((TK.surf - (o.y - o.size / 2)) / o.size) * 100, 0, 100);
      if (Math.abs(wl - o.wl) > 0.3 || o.tt < 0.05) {
        o.wl = wl;
        o.a.style.clipPath = `inset(0 0 ${100 - wl}% 0)`;
        o.w.style.clipPath = `inset(${wl}% 0 0 0)`;
        const show = wl > 1 && wl < 99 && o.state !== "fall";
        o.ln.style.display = show ? "block" : "none";
        if (show) o.ln.style.top = wl + "%";
      }
      if (o.tagEl) this.tagAt(ctx, o, hh);
    }
  },
  tag(ctx, o, txt) {
    o.tagEl = KP.u.el("span", "fsTag", txt);
    this.tagAt(ctx, o, (o.size * Math.min(1, o.ar || 1)) / 2);
    ctx.objL.appendChild(o.tagEl);
  },
  tagAt(ctx, o, hh) {
    const tp = ctx.P(o.x, o.y - hh - 6);
    o.tagEl.style.transform = `translate(${tp.x}px,${tp.y}px) translate(-50%,-100%)`;
  },
  splash(ctx, x, size) {
    const U = KP.u, A = KP.audio, P = ctx.P(x, ctx.TANK.surf), k = ctx.K;
    A.noise({ dur: 0.4, vol: 0.28, bp: 1400, bpTo: 400, q: 0.9 });
    A.sfx("water");
    const ring = U.el("span", "fsRing");
    ring.style.cssText = `--x:${P.x}px;--y:${P.y}px;--w:${size * k * 1.1}px`;
    ctx.objL.appendChild(ring);
    ctx.after(950, () => ring.remove());
    const n = 9, sp = size * k * 0.22;
    for (let i = 0; i < n; i++) {
      const d = U.el("span", "fsDrop");
      d.style.cssText = `--x:${P.x}px;--y:${P.y - 8}px;--dx:${(i - (n - 1) / 2) * sp * 0.5 + U.randf(-6, 6)}px;--dy:${-U.randf(30, 80) * Math.max(0.7, k * 1.6)}px`;
      ctx.objL.appendChild(d);
      ctx.after(800, () => d.remove());
    }
  },
  bubble(ctx, o, hh) {
    const U = KP.u, TK = ctx.TANK, k = ctx.K;
    const p = ctx.P(o.x + U.randf(-0.25, 0.25) * o.size, o.y - hh * 0.4);
    const b = U.el("span", "fsBub");
    const sz = U.randf(8, 16) * Math.max(0.7, k * 1.4);
    b.style.cssText = `--x:${p.x}px;--y:${p.y}px;--b:${sz}px;--dx:${U.randf(-12, 12)}px;--rise:${-Math.max(10, (o.y - hh * 0.4 - TK.surf) * k)}px`;
    ctx.objL.appendChild(b);
    KP.audio.tone(U.randf(700, 1100), { to: 1500, dur: 0.07, type: "sine", vol: 0.05 });
    ctx.after(1450, () => b.remove());
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
          if (ctx.actor) ctx.tiltOn = true;
          p.then(async () => {
            if (!self.alive(ctx, rid, sess)) return;
            self.react(ctx, t.fl, false);
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
            self.react(ctx, t.fl, !right);
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
      // 관찰 친구: 고개 갸웃 + "?"
      ctx.tiltOn = true;
      this.pose(ctx, { tilt: 0.14 });
      this.think(ctx, "?");
      // 예상 단추: 같은 물건이 물 위에 뜬 그림 / 바닥에 가라앉은 그림
      ctx.pred.innerHTML = "";
      ctx.pred.hidden = false;
      const mk = (fl) => {
        const b = U.el("button", "fsPB", '<span class="fsMini ' + (fl ? "up" : "down") + '"><img alt="" src="' + t.img + '"><span class="fsArrow">' + KP.E(fl ? "⬆️" : "⬇️") + "</span></span><b>" + (fl ? "둥실" : "퐁당") + "</b>");
        b.dataset.fl = fl ? "1" : "0";
        ctx.tap(b, () => {
          if (ctx.myGuess !== null) return;
          ctx.myGuess = fl;
          b.classList.add("picked");
          [...ctx.pred.children].forEach((x) => x !== b && x.classList.add("off"));
          A.sfx("tap");
          this.pose(ctx, { tilt: 0.05, nod: 0.08 });
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
      this.clearObjs(ctx);
      ctx.slots = { true: [], false: [] };
      let chosen = null;
      ctx.tiltOn = true;
      this.pose(ctx, { tilt: 0.14 });
      this.think(ctx, "?");
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
            if (!self.alive(ctx, rid, sess) || !ctx.st) return;
            els.forEach((e) => e.classList.add("used"));
            const TK = ctx.TANK, mid = (TK.l + TK.r) / 2;
            const ps = pr.map((p, j) => (j === 0 ? self.dropIn(ctx, p, mid - 150) : new Promise((r) => ctx.after(150, () => r(self.dropIn(ctx, p, mid + 150))))));
            await Promise.all(ps);
            if (!self.alive(ctx, rid, sess)) return;
            const right = chosen.fl;
            if (right) A.sfx("good");
            else ctx.allRight = false;
            self.react(ctx, true, !right);
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
    ctx.tiltOn = false;
    this.think(ctx, null);
    // 1단계(자유 탐색)와 예상이 하나라도 달랐던 판은 별 없음 — 보기 2개라 '찍어도 반'이므로
    if (!clean) ctx._fewChoice = true;
    ctx.score.add();
    ctx.round++;
    if (ctx.actor) {
      ctx.actor.happy();
      ctx.actor.wave(1.4);
    }
    await ctx.wait(600);
    const big = ctx.round % 4 === 0;
    const ok = await ctx.win({ big, msg: big ? "{부름} 꼬마 과학자!" : msg });
    if (ok && ctx.st) this.next(ctx);
  },
});
