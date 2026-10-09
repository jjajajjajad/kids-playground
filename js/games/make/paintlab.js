/* =====================================================================
   🧪 물감 실험실 + 📖 색깔 도감
   - 물감 통을 누르면 방울이 그릇에 퐁, 꾹 누르면 계속 똑똑 (양만큼 색이 변함)
   - 손가락(나무 숟가락)으로 빙글빙글 저으면 마블링처럼 섞이다가 한 색이 됨
   - 다 섞이면 색 이름을 말해 주고, 처음 만든 색이면 "새 색깔 발견!" → 도감에 기록
   - 🫙 내 물감에 담기 → 그림 그리기·색칠 공방·색칠 놀이·데칼코마니 팔레트에 나옴
   - 그릇 상태는 나갔다 와도, 앱을 껐다 켜도 그대로
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
    KP.css("paintlab", `
      .plW{flex:1;min-height:0;display:grid;gap:10px;padding:0 12px 10px;
        grid-template-areas:"bowl" "jars" "acts" "mine";grid-template-rows:minmax(0,1fr) auto auto auto;justify-items:center;align-items:center}
      .plBowlCell{grid-area:bowl;min-height:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
      .plJarsCell{grid-area:jars}
      .plActs{grid-area:acts;display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
      .plB{background:#fff;border-radius:20px;box-shadow:0 6px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;min-width:76px;min-height:66px;font-size:14px;line-height:1.1}
      .plB .e{font-size:30px}
      .plB:active{transform:translateY(4px)}
      .plB.main{background:var(--cat);color:#fff;box-shadow:0 6px 0 color-mix(in srgb,var(--cat) 60%,#000)}
      .plMine{grid-area:mine;display:flex;align-items:center;gap:8px;max-width:100%;overflow-x:auto;padding:4px 6px;scrollbar-width:none}
      .plMine::-webkit-scrollbar{display:none}
      .plMine .lb{font-size:15px;color:var(--ink2);white-space:nowrap}
      .plSw{flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.13);position:relative}
      .plSw.new{animation:popBig .5s}
      .plName{position:absolute;left:50%;top:6%;transform:translateX(-50%);background:#fff;border-radius:999px;padding:6px 18px;font-size:clamp(20px,2.8vw,28px);box-shadow:0 5px 0 rgba(47,58,102,.12);display:none;align-items:center;gap:8px;white-space:nowrap;z-index:4}
      .plName.on{display:flex;animation:popIn .35s}
      .plName i{display:inline-block;width:1em;height:1em;border-radius:50%;box-shadow:inset -3px -4px 0 rgba(0,0,0,.12)}
      .plFly{position:fixed;z-index:80;width:60px;height:60px;border-radius:50%;border:4px solid #fff;pointer-events:none;transition:transform .7s cubic-bezier(.5,0,.6,1),opacity .7s}
      @media (orientation:landscape) and (min-height:500px){
        .plW{grid-template-areas:"jars bowl acts" "mine mine mine";grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) auto;padding:0 16px 10px;gap:14px}
        .plJarsCell .psJars{flex-direction:column;flex-wrap:nowrap}
        .plJarsCell .psJar{width:clamp(60px,7vh,82px);height:clamp(70px,9vh,98px)}
        .plActs{flex-direction:column;flex-wrap:nowrap}
        .plB{min-width:96px;min-height:72px;font-size:15px}
        .plB .e{font-size:34px}
      }
      /* 도감 */
      .dxPanel{position:absolute;inset:0;z-index:30;background:rgba(238,249,255,.97);display:none;flex-direction:column;padding:10px 16px 16px}
      .dxPanel.on{display:flex;animation:enter .3s}
      .dxHead{display:flex;align-items:center;gap:12px;font-size:clamp(20px,2.8vw,28px);padding:4px 4px 10px}
      .dxHead .sp{flex:1}
      .dxGrid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:12px;align-content:start}
      .dxC{background:#fff;border-radius:22px;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 5px 0 rgba(47,58,102,.1);border:3px dashed #dfe5f3}
      .dxC.got{border:3px solid #fff}
      .dxBlob{width:64px;height:64px;border-radius:46% 54% 50% 50%/52% 46% 54% 48%;background:#e9edf5;display:flex;align-items:center;justify-content:center;font-size:28px;color:#b5bdd3;box-shadow:inset -5px -6px 0 rgba(0,0,0,.08)}
      .dxC b{font-weight:400;font-size:17px}
      .dxC small{font-size:12px;color:var(--ink2)}
    `);
    const W = U.el("div", "plW");
    const bowlCell = U.el("div", "plBowlCell");
    const jarsCell = U.el("div", "plJarsCell");
    const acts = U.el("div", "plActs");
    const mine = U.el("div", "plMine");
    const nameTag = U.el("div", "plName");
    W.append(bowlCell, jarsCell, acts, mine);
    ctx.body.appendChild(W);
    Object.assign(ctx, { W, bowlCell, mine, nameTag });

    const studio = P.studio({
      ctx,
      capacity: 60,
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

    const mk = (em, label, cls = "") => U.btn(KP.E(em) + "<span>" + label + "</span>", "plB " + cls);
    const bKeep = mk("🫙", "내 물감에 담기", "main");
    const bDrain = mk("🫗", "비우기");
    const bDex = mk("📖", "색깔 도감");
    const bDecal = mk("🦋", "데칼코마니");
    acts.append(bKeep, bDrain, bDex, bDecal);
    ctx.bKeep = bKeep;

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
    bDex.addEventListener("click", () => this.openDex(ctx));
    bDecal.addEventListener("click", () => {
      KP.audio.sfx("open");
      if (KP.GAMES.decal) KP.open("decal");
    });

    // 도감 화면
    const dx = U.el("div", "dxPanel");
    ctx.root.appendChild(dx);
    ctx.dx = dx;

    // 크기 맞추기
    ctx.fitBowl = () => {
      const r = bowlCell.getBoundingClientRect();
      const meterH = 34;
      studio.fit(Math.min(r.width * 0.96, r.height - meterH - 8, 620));
    };
    addEventListener("resize", () => ctx._active && requestAnimationFrame(ctx.fitBowl));
  },

  start(ctx) {
    const U = KP.u;
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
        const st = ctx.studio.state,
          bowl = ctx.studio.bowl;
        const vol = bowl.volume();
        if (vol < 0.6) return;
        // 부은 뒤 가만히 있으면 젓기 안내
        if (ctx.changed && st.even < 0.84 && now - st.lastPourAt > 2600 && now - st.lastStirAt > 2600 && now - stirTold > 9000) {
          stirTold = now;
          KP.voice.say("숟가락으로 빙글빙글 저어 봐요!");
        }
        // 다 섞이면 색 이름 / 새 색깔 발견
        if (st.even >= 0.86 && ctx.changed && now - st.lastPourAt > 600) {
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
    const c = bowl.color(),
      hex = P.hex(c),
      nm = P.nameOf(c).n;
    P.saveMine(hex, nm);
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

  /** 색깔 도감 */
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
    all.forEach((x, i) => {
      const has = dex[x.n];
      const c = U.el("button", "dxC" + (has ? " got" : ""));
      c.style.animation = "cardIn .4s backwards";
      c.style.animationDelay = i * 25 + "ms";
      c.innerHTML =
        '<span class="dxBlob" style="' + (has ? "background:" + x.hex : "") + '">' + (has ? "" : "?") + "</span><b>" + (has ? x.n : "???") + "</b><small>" + (has ? has : "아직 몰라요") + "</small>";
      c.addEventListener("click", () => {
        U.replay(c, has ? "jump" : "wrong");
        KP.voice.say(has ? x.n + "! " + has + "에 찾았어요." : "아직 못 찾은 색이에요. 섞어서 찾아봐요!");
      });
      grid.appendChild(c);
    });
    dx.append(head, grid);
    dx.classList.add("on");
    KP.voice.say("색깔 도감이에요! " + all.length + "가지 중에 " + got + "가지를 찾았어요.");
  },
});
