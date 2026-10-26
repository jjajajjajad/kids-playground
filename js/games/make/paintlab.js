/* =====================================================================
   🧪 물감 실험실 + 📖 색깔 도감 — 점토 물감 작업실
   - 점토 작업실 배경(assets/play-clay/paint/bg.jpg) 의 흰 팔레트 접시 자리에 섞는 그릇(탁자 위처럼 살짝 눕힘)
   - 점토 물감 튜브를 누르면 한 방울 쭉, 꾹 누르면 계속 (양만큼 색이 변함 — 진짜 물감처럼 섞는 계산, core/paint.js)
   - 나무 주걱(손가락)으로 빙글빙글 저으면 걸쭉한 물감이 줄무늬로 끌리다가 한 색이 됨 (두께 음영·광택·주걱 자국)
   - 다 섞이면 색 이름을 말해 주고, 처음 만든 색이면 "새 색깔 발견!" → 도감에 기록 (못 찾은 색은 레시피 방울로 힌트)
   - 🫙 내 물감에 담기 → 🖌️ 칠하러 가기(색칠 공방, 방금 담은 색을 골라 둠)·그림 그리기·색칠 놀이·데칼코마니 팔레트
   - 그릇 상태는 나갔다 와도, 앱을 껐다 켜도 그대로 (예전 44칸 그릇도 옮겨 담음)
===================================================================== */
"use strict";
KP.game({
  id: "paintlab",
  icon: "🧪",
  name: "물감 실험실",
  cat: "make",
  badge: "NEW",
  setup(ctx) {
    const U = KP.u,
      P = KP.paint;
    const TILT = 0.74; // 그릇을 탁자 위처럼 눕힌 정도
    KP.css("paintlab", `
      .plStage{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;margin:0 10px 10px;border-radius:26px;overflow:hidden;box-shadow:var(--shadow)}
      .plW{flex:1;min-height:0;display:grid;gap:8px;padding:8px 10px 10px;
        grid-template-areas:"jars" "bowl" "acts" "mine";grid-template-rows:auto minmax(0,1fr) auto auto;justify-items:center;align-items:center}
      .plBowlCell{grid-area:bowl;min-height:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
      .plJarsCell{grid-area:jars}
      .plActs{grid-area:acts;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
      .plB{background:rgba(255,251,242,.95);border-radius:20px;box-shadow:0 6px 0 rgba(110,70,30,.2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-width:76px;min-height:66px;font-size:14px;line-height:1.1;color:var(--ink)}
      .plB .e{font-size:30px}
      .plB .pi{width:38px;height:34px;object-fit:contain}
      .plB:active{transform:translateY(4px)}
      .plB.main{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .plB.go{background:#fff3c4}
      .plMine{grid-area:mine;display:flex;align-items:center;gap:8px;max-width:100%;overflow-x:auto;padding:4px 10px;scrollbar-width:none;background:rgba(255,251,242,.85);border-radius:999px}
      .plMine::-webkit-scrollbar{display:none}
      .plMine .lb{font-size:15px;color:var(--ink2);white-space:nowrap}
      .plSw{flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.13);position:relative}
      .plSw.new{animation:popBig .5s}
      .plName{position:absolute;left:50%;top:2%;transform:translateX(-50%);background:#fffaf0;border-radius:999px;padding:6px 18px;font-size:clamp(20px,2.8vw,28px);box-shadow:0 5px 0 rgba(110,70,30,.18);display:none;align-items:center;gap:8px;white-space:nowrap;z-index:4}
      .plName.on{display:flex;animation:popIn .35s}
      .plName i{display:inline-block;width:1em;height:1em;border-radius:50%;box-shadow:inset -3px -4px 0 rgba(0,0,0,.12)}
      .plFly{position:fixed;z-index:80;width:60px;height:60px;border-radius:50%;border:4px solid #fff;pointer-events:none;transition:transform .7s cubic-bezier(.5,0,.6,1),opacity .7s}
      .plJarsCell .psJars{background:rgba(255,251,242,.55);border-radius:22px;padding:6px 8px 8px}
      @media (orientation:landscape) and (min-height:500px){
        .plW{grid-template-areas:"jars bowl acts" "mine mine mine";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) auto;padding:10px 16px 10px;gap:12px}
        .plJarsCell .psJars{display:grid;grid-template-columns:repeat(2,auto);gap:4px 6px}
        .plJarsCell .psJar{width:clamp(60px,7.5vh,82px);height:clamp(84px,12vh,112px)}
        .plActs{display:grid;grid-template-columns:repeat(2,auto)}
        .plB{min-width:92px;min-height:76px;font-size:15px}
        .plB .e{font-size:34px}
        .plB .pi{width:44px;height:38px}
      }
      @media (orientation:portrait) and (max-width:480px){
        .plStage{margin:0 6px 6px}
        .plW{padding:6px 6px 8px;gap:6px}
        .plJarsCell{max-width:100%}
        .plJarsCell .psJars{flex-wrap:nowrap;gap:4px}
        .plJarsCell .psJar{width:clamp(52px,16vw,64px);height:86px;flex:0 0 auto}
        .plJarsCell .psJar .jn{left:-3px;right:-3px;font-size:13px}
        .plActs{flex-wrap:nowrap;gap:5px;max-width:100%;width:100%}
        .plB.main{flex:1.5 1 0}
        .plB{min-width:0;flex:1 1 0;min-height:66px;padding:6px 2px;font-size:12px;word-break:keep-all;white-space:nowrap}
        .plB .pi{width:32px;height:28px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .plStage{margin:0 8px 6px}
        .plW{grid-template-areas:"bowl jars" "bowl acts" "bowl mine";grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;align-content:center;padding:4px 10px 6px;gap:6px 12px}
        .plBowlCell{grid-row:1/4;align-self:stretch}
        .plJarsCell .psJars{flex-wrap:nowrap;gap:4px;padding:4px 6px 6px}
        .plJarsCell .psJar{width:54px;height:74px}
        .plJarsCell .psJar .jn{font-size:12px}
        .plActs{flex-wrap:nowrap;gap:5px}
        .plB{min-width:64px;min-height:58px;font-size:12px;padding:4px 5px}
        .plB .e{font-size:24px}
        .plB .pi{width:30px;height:26px}
        .plMine{justify-self:stretch}
      }
      /* 도감 */
      .dxPanel{position:absolute;inset:0;z-index:30;background:#fff8ec;display:none;flex-direction:column;padding:max(10px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))} /* 아이폰 시계 줄 아래로 */
      .dxPanel.on{display:flex;animation:enter .3s}
      .dxHead{display:flex;align-items:center;gap:12px;font-size:clamp(20px,2.8vw,28px);padding:4px 4px 10px}
      .dxHead .sp{flex:1}
      .dxGrid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:12px;align-content:start}
      .dxC{background:#fff;border-radius:22px;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 5px 0 rgba(110,70,30,.1);border:3px dashed #eadfcd}
      .dxC.got{border:3px solid #fff}
      .dxBlob{width:64px;height:64px;border-radius:46% 54% 50% 50%/52% 46% 54% 48%;background:#f1ebe0;display:flex;align-items:center;justify-content:center;font-size:28px;color:#c9bca6;box-shadow:inset -5px -6px 0 rgba(0,0,0,.08)}
      .dxC b{font-weight:400;font-size:17px}
      .dxC small{font-size:12px;color:var(--ink2)}
      .dxRec{display:flex;gap:2px;align-items:center;min-height:16px}
      .dxRec i{width:12px;height:15px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -2px -2px 0 rgba(0,0,0,.12),0 0 0 1.5px #fff}
    `);
    const stage = U.el("div", "plStage");
    const W = U.el("div", "plW");
    const bowlCell = U.el("div", "plBowlCell");
    const jarsCell = U.el("div", "plJarsCell");
    const acts = U.el("div", "plActs");
    const mine = U.el("div", "plMine");
    const nameTag = U.el("div", "plName");
    W.append(bowlCell, jarsCell, acts, mine);
    stage.appendChild(W);
    ctx.body.appendChild(stage);
    const bg = P.stageBg(stage);
    Object.assign(ctx, { W, bowlCell, mine, nameTag });

    const studio = P.studio({
      ctx,
      capacity: 60,
      tilt: TILT,
      onPour: () => {
        ctx.changed = true;
        nameTag.classList.remove("on");
        ctx.hint(() => studio.bowl.cv, "숟가락으로 빙글빙글 저어 봐요!");
      },
      onStir: () => {},
    });
    ctx.studio = studio;
    jarsCell.appendChild(studio.jarsEl);
    bowlCell.append(studio.bowlEl, nameTag);

    const img = (f) => '<img class="pi" alt="" draggable="false" src="' + P.ART + f + '">';
    const mk = (icon, label, cls = "") => U.btn(icon + "<span>" + label + "</span>", "plB " + cls);
    const bKeep = mk(KP.E("🫙"), "내 물감에 담기", "main");
    const bGo = mk(img("brush.png"), "칠하러 가기", "go");
    const bDrain = mk(img("cloth.png"), "비우기");
    const bDex = mk(KP.E("📖"), "색깔 도감");
    const bDecal = mk(KP.E("🦋"), "데칼코마니");
    acts.append(bKeep, bGo, bDrain, bDex, bDecal);
    Object.assign(ctx, { bKeep, bGo });

    bDrain.addEventListener("click", async () => {
      if (studio.bowl.volume() < 0.05) return KP.voice.say("그릇이 벌써 비어 있어요!");
      nameTag.classList.remove("on");
      KP.voice.say("쏴아! 그릇을 비웠어요.");
      await studio.drain();
      ctx.lastName = null;
      ctx.changed = false;
      this.saveBowl(ctx);
    });
    bKeep.addEventListener("click", () => this.keep(ctx));
    bGo.addEventListener("click", () => this.goPaint(ctx));
    bDex.addEventListener("click", () => this.openDex(ctx));
    bDecal.addEventListener("click", () => {
      KP.audio.sfx("open");
      if (KP.GAMES.decal) KP.open("decal");
    });

    // 도감 화면
    const dx = U.el("div", "dxPanel");
    ctx.root.appendChild(dx);
    ctx.dx = dx;

    // 크기 맞추기 + 배경의 팔레트 접시를 그릇 밑에
    ctx.fitBowl = () => {
      const r = bowlCell.getBoundingClientRect();
      const meterH = 36;
      studio.fit(Math.min(r.width * 0.96, (r.height - meterH - 8) / TILT, 760));
      requestAnimationFrame(ctx.alignBg);
    };
    // 그릇 자리가 바뀌었을 때만 배경 다시 맞춤 (글꼴·스크롤 막대 등으로 늦게 바뀌는 것도 잡게 반복에서 가끔 확인)
    let bgKey = "";
    ctx.alignBg = () => {
      const b = studio.bowl.cv.getBoundingClientRect(),
        s = stage.getBoundingClientRect();
      const key = [b.left - s.left, b.top - s.top, b.width, s.width, s.height].map(Math.round).join();
      if (key === bgKey) return;
      bgKey = key;
      bg.align(b, s);
    };
    addEventListener("resize", () => ctx._active && requestAnimationFrame(ctx.fitBowl));
  },

  start(ctx) {
    ctx.dx.classList.remove("on");
    ctx.nameTag.classList.remove("on");
    ctx.studio.setEnabled(true);
    ctx.studio.bowl.load(KP.store.get("lab:bowl", null));
    ctx.lastName = KP.store.get("lab:lastName", null);
    ctx.changed = false;
    this.renderMine(ctx);
    requestAnimationFrame(() => {
      ctx.fitBowl();
      let checkT = 0,
        stirTold = 0,
        saveT = 0;
      ctx.loop((dt, now) => {
        ctx.studio.tick(dt);
        checkT += dt;
        saveT += dt;
        if (saveT > 4) {
          saveT = 0;
          this.saveBowl(ctx);
        }
        if (checkT < 0.3) return;
        checkT = 0;
        ctx.alignBg();
        const st = ctx.studio.state,
          bowl = ctx.studio.bowl;
        const vol = bowl.volume();
        if (vol < 0.6) return;
        // 부은 뒤 가만히 있으면 젓기 안내
        if (ctx.changed && st.even < 0.78 && now - st.lastPourAt > 2600 && now - st.lastStirAt > 2600 && now - stirTold > 9000) {
          stirTold = now;
          KP.voice.say("숟가락으로 빙글빙글 저어 봐요!");
        }
        // 다 섞이면 색 이름 / 새 색깔 발견
        if (st.even >= 0.8 && ctx.changed && now - st.lastPourAt > 600) {
          ctx.changed = false;
          this.announce(ctx);
        }
      });
    });
    ctx.say(
      ctx.studio.bowl.volume() > 0.5 ? "만들던 물감이 그대로 있어요! 더 넣거나 저어 봐요." : "물감 통을 눌러서 그릇에 넣고, 손가락으로 빙글빙글 저어 봐요!"
    );
    ctx.hint(() => ctx.studio.jar(1), "물감 통을 눌러 봐요!");
  },
  stop(ctx) {
    this.saveBowl(ctx);
  },
  saveBowl(ctx) {
    const b = ctx.studio.bowl;
    KP.store.set("lab:bowl", b.volume() > 0.01 ? b.save() : null);
    KP.store.set("lab:lastName", ctx.lastName || null);
  },

  /** 다 섞였을 때 */
  async announce(ctx) {
    const U = KP.u,
      P = KP.paint;
    const c = ctx.studio.bowl.color();
    if (!c) return;
    const nm = P.nameOf(c);
    const hex = P.hex(c);
    ctx.nameTag.innerHTML = '<i style="background:' + hex + '"></i>' + nm.n + "!";
    ctx.nameTag.classList.add("on");
    const isNew = P.discover(nm.n);
    ctx.hint(() => ctx.bKeep, "마음에 들면 내 물감에 담아요!");
    if (isNew) {
      KP.audio.sfx("levelup");
      await ctx.win({ msg: "새 색깔 발견! " + nm.n + "!", big: true });
      if (ctx._active) KP.voice.say("도감에 " + U.josa(nm.n, "이/가") + " 생겼어요! 마음에 들면 내 물감에 담아요.");
    } else if (nm.n !== ctx.lastName) {
      KP.audio.sfx("sparkle");
      KP.voice.say(U.josa(nm.n, "이/가") + " 됐어요!");
    }
    ctx.lastName = nm.n;
  },

  /** 내 물감에 담기 */
  keep(ctx) {
    const U = KP.u,
      P = KP.paint;
    const st = ctx.studio.state,
      bowl = ctx.studio.bowl;
    if (bowl.volume() < 0.5) return ctx.miss(ctx.bKeep, "먼저 물감을 넣어 봐요!", { soft: true });
    if (st.even < 0.7) return ctx.miss(ctx.bKeep, "먼저 빙글빙글 섞어 볼까요?", { soft: true });
    const tot = bowl.total(),
      c = bowl.color(),
      hex = P.hex(c),
      nm = P.nameOf(c).n;
    P.saveMine(hex, nm, tot);
    ctx.keptHex = hex;
    // 그릇에서 물감 통으로 날아가는 연출
    const a = bowl.cv.getBoundingClientRect();
    const fly = U.el("div", "plFly");
    fly.style.background = hex;
    fly.style.left = a.left + a.width / 2 - 30 + "px";
    fly.style.top = a.top + a.height / 2 - 30 + "px";
    document.body.appendChild(fly);
    this.renderMine(ctx, hex);
    const t = ctx.mine.querySelector(".plSw");
    const b = t ? t.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    requestAnimationFrame(() => {
      fly.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.6)";
      fly.style.opacity = ".6";
    });
    setTimeout(() => fly.remove(), 750);
    KP.audio.sfx("sticker");
    KP.voice.say(U.josa(nm, "을/를") + " 내 물감 통에 담았어요! 그림 그릴 때 쓸 수 있어요.");
    U.replay(ctx.bGo, "jump");
    ctx.hint(() => ctx.bGo, "칠하러 가요!");
  },

  /** 🖌️ 칠하러 가기: 색칠 공방을 열고 방금(또는 마지막에) 담은 내 물감을 골라 둠 */
  goPaint(ctx) {
    const P = KP.paint;
    const list = P.mine();
    if (!list.length) return ctx.miss(ctx.bGo, "먼저 내 물감에 담아요!", { soft: true });
    this.saveBowl(ctx);
    P.pick(ctx.keptHex && list.some((m) => m.hex === ctx.keptHex) ? ctx.keptHex : list[0].hex);
    KP.audio.sfx("open");
    if (KP.GAMES.zoopaint) KP.open("zoopaint");
  },

  renderMine(ctx, newHex) {
    const U = KP.u,
      P = KP.paint;
    const list = P.mine();
    ctx.mine.innerHTML = '<span class="lb">' + KP.E("🎨") + " 내 물감</span>";
    if (!list.length) {
      ctx.mine.appendChild(U.el("span", "lb", "· 아직 없어요. 섞어서 담아 보세요!"));
      return;
    }
    list.forEach((m) => {
      const s = U.el("button", "plSw" + (m.hex === newHex ? " new" : ""));
      s.style.background = m.hex;
      s.addEventListener("click", () => {
        KP.audio.sfx("tap2");
        KP.voice.say(m.n || "내 물감");
        U.replay(s, "jump");
      });
      // 어른용: 꾹 누르면 지우기
      KP.hold(s, 1500, () => {
        P.delMine(m.hex);
        this.renderMine(ctx);
        KP.toast("물감을 지웠어요");
      });
      ctx.mine.appendChild(s);
    });
  },

  /** 색깔 도감 — 못 찾은 색은 레시피 방울(물감 색 점)로 힌트 */
  openDex(ctx) {
    const U = KP.u,
      P = KP.paint;
    KP.audio.sfx("open");
    const dex = P.dex();
    const all = P.NAMES.filter((x) => x.dex);
    const got = all.filter((x) => dex[x.n]).length;
    const dx = ctx.dx;
    dx.innerHTML = "";
    const head = U.el("div", "dxHead", KP.E("📖") + "<span>색깔 도감</span><span class=\"sp\"></span><b style=\"font-weight:400\">" + got + " / " + all.length + "</b>");
    const close = U.btn(KP.E("↩️") + " 실험실로", "btn");
    close.addEventListener("click", () => {
      KP.audio.sfx("back");
      dx.classList.remove("on");
    });
    head.appendChild(close);
    const grid = U.el("div", "dxGrid");
    const recipe = (v) => {
      const m = Math.min(...v.filter((x) => x > 0));
      let h = "";
      v.forEach((x, i) => {
        const n = Math.min(4, Math.round(x / m));
        for (let k = 0; k < n; k++) h += '<i style="--c:' + P.BASE[i].hex + '"></i>';
      });
      return '<span class="dxRec">' + h + "</span>";
    };
    all.forEach((x, i) => {
      const has = dex[x.n];
      const c = U.el("button", "dxC" + (has ? " got" : ""));
      c.style.animation = "cardIn .4s backwards";
      c.style.animationDelay = i * 25 + "ms";
      c.innerHTML =
        '<span class="dxBlob" style="' + (has ? "background:" + x.hex : "") + '">' + (has ? "" : "?") + "</span><b>" + (has ? x.n : "???") + "</b>" + (has ? "<small>" + has + "</small>" : recipe(x.v));
      c.addEventListener("click", () => {
        U.replay(c, has ? "jump" : "wrong");
        KP.voice.say(has ? x.n + "! 찾았어요!" : "아직 못 찾은 색이에요. 섞어서 찾아봐요!"); // 날짜는 화면에만
      });
      grid.appendChild(c);
    });
    dx.append(head, grid);
    dx.classList.add("on");
    KP.voice.say("색깔 도감이에요!"); // 몇 가지 찾았는지는 화면에만(숫자 문장은 자연 음성이 없음)
  },
});
