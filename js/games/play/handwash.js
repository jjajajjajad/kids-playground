/* 뽀득뽀득 손 씻기 — 점토 세면대 앞, 내 손(점토 손 그림)을 직접 씻어요
   - 장면 속 물건을 직접 눌러요: 꽃 수도꼭지(물 틀기·잠그기, 손잡이가 돌아감) → 물비누 펌프(꾹 → 거품 덩이) → 손 문지르기 → 헹구기 → 수건
   - 손 그림 3자세(손바닥 → 손등 → 깍지)로 바뀌며, 문지른 자리만 거품이 생김 (표면 마스크 KP.care setSkin — 손 모양 안에서만)
     3단계는 놀다 온 흙 묻은 손: 문지른 곳만 깨끗해짐. 헹굴 때는 물줄기 아래에서 비빈 자리만 거품이 흘러내림
   - 단계: 1 순서 안내(할 물건이 반짝) → 2 '다음엔 뭘 할까요?' 순서 고르기 → 3 흙 묻은 손을 혼자서 (시간 제한 없음)
   - 아이가 칠한 인형 친구(정면 그림)가 시작·끝에 옆에서 작게 응원
   공용: play/_care.js(문지르기 판·표면 마스크·순서) · _shared/clay-stage.js(배경 자르기만, 3D 없음) */
"use strict";
KP.game({
  id: "handwash",
  icon: "🧼",
  name: "뽀득뽀득 손 씻기",
  cat: "play",
  levels: 3,
  score: "🫧",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/handwash/");
    KP.care.css();
    KP.css("handwash", `
      .hw-scene{background:#cfe6cf}
      .hw-tap{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
      .hw-tap img{width:100%;height:100%;display:block}
      .hw-on .hw-tap{transform:rotate(-36deg)}
      .hw-stream{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transform-origin:50% 0;transform:scaleY(0);opacity:0;transition:transform .3s ease-in,opacity .2s;
        border-radius:45% 45% 40% 40%/6% 6% 5% 5%;
        background:linear-gradient(90deg,rgba(140,200,250,.35),rgba(215,240,255,.85) 28%,rgba(255,255,255,.95) 40%,rgba(180,222,252,.7) 62%,rgba(120,185,240,.4));
        -webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent)}
      .hw-stream::after{content:"";position:absolute;inset:0 12%;border-radius:inherit;opacity:.9;
        background:repeating-linear-gradient(176deg,rgba(255,255,255,0) 0 14px,rgba(255,255,255,.8) 14px 17px,rgba(255,255,255,0) 17px 30px);animation:hw-flow .28s linear infinite}
      @keyframes hw-flow{to{background-position:0 30px}}
      .hw-on .hw-stream{transform:scaleY(1);opacity:1}
      .hw-hands{position:absolute;left:0;top:0;z-index:4;pointer-events:none;transition:transform .16s ease-in,filter .4s}
      .hw-hands img{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 8px rgba(60,40,20,.25))}
      .hw-hands.flip{transform:scaleX(0)}
      .hw-hands.glow img{animation:hw-glowF 1.1s ease-in-out infinite alternate}
      .hw-obj{position:absolute;left:0;top:0;z-index:6;touch-action:manipulation;cursor:pointer}
      .hw-obj img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 6px 5px rgba(60,40,20,.28))}
      .hw-obj.glow img{animation:hw-glowF 1.1s ease-in-out infinite alternate}
      @keyframes hw-glowF{from{filter:drop-shadow(0 6px 5px rgba(60,40,20,.28))}to{filter:drop-shadow(0 0 9px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .hw-obj.press img{animation:hw-press .32s ease-out}
      @keyframes hw-press{40%{transform:scale(1.04,.84);transform-origin:50% 100%}}
      .hw-obj.away img{opacity:.25}
      .hw-hit{position:absolute;left:0;top:0;z-index:6;border-radius:50%;touch-action:manipulation;cursor:pointer}
      .hw-hit.glow{animation:hw-ring 1.1s ease-in-out infinite alternate}
      @keyframes hw-ring{from{box-shadow:0 0 0 0 rgba(255,205,40,0);background:rgba(255,240,170,0)}to{box-shadow:0 0 0 7px rgba(255,205,40,.75);background:rgba(255,240,170,.18)}}
      .hw-handsHit.glow{animation:none}
      .hw-scene.rubbing .hw-obj,.hw-scene.rubbing .hw-hit{pointer-events:none}
      .hw-blob{position:absolute;left:0;top:0;z-index:5;pointer-events:none;width:var(--s);height:var(--s);margin:calc(var(--s)*-.5) 0 0 calc(var(--s)*-.5);border-radius:50%;
        background:radial-gradient(circle at 35% 35%,#fff 0 18%,rgba(255,255,255,0) 19%),radial-gradient(circle at 30% 60%,#f6faff 0 26%,rgba(255,255,255,0) 27%),
          radial-gradient(circle at 68% 58%,#eef6ff 0 28%,rgba(255,255,255,0) 29%),radial-gradient(circle at 52% 40%,#fbfdff 0 34%,rgba(255,255,255,0) 35%);
        filter:drop-shadow(0 2px 2px rgba(120,160,200,.45));transition:transform .55s cubic-bezier(.5,0,.9,.6)}
      .hw-pal{position:absolute;left:0;top:0;z-index:6;pointer-events:none;width:var(--s);height:var(--s);transition:transform .45s cubic-bezier(.3,1.3,.5,1),opacity .3s;opacity:0}
      .hw-pal img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 6px 5px rgba(60,40,20,.3))}
      .hw-pal.on{opacity:1}
      .hw-pal.hop img{animation:hw-hop .5s ease-in-out 2}
      @keyframes hw-hop{50%{transform:translateY(-14%) scale(1.04)}}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene hw-scene"));
    ctx.body.appendChild(scene);
    const mk = (cls, html = "") => {
      const e = U.el("div", cls, html);
      scene.appendChild(e);
      return e;
    };
    ctx.taps = [mk("hw-tap", '<img alt="" src="' + IMG + 'tap-blue.png">'), mk("hw-tap", '<img alt="" src="' + IMG + 'tap-pink.png">')];
    ctx.stream = mk("hw-stream");
    ctx.hands = mk("hw-hands", '<img alt="" draggable="false">');
    ctx.handImg = ctx.hands.firstChild;
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F, pass: true });
    ctx.S.radius = 0.09;
    ctx.faucet = mk("hw-hit hw-faucet");
    ctx.faucet.setAttribute("aria-label", "수도꼭지");
    ctx.pump = mk("hw-obj hw-pump", '<img alt="" draggable="false" src="' + IMG + 'pump.png">');
    ctx.pump.setAttribute("aria-label", "물비누");
    ctx.towel = mk("hw-obj hw-towelObj", '<img alt="" draggable="false" src="assets/play-clay/bath/towel.png">');
    ctx.towel.setAttribute("aria-label", "수건");
    ctx.handsHit = mk("hw-hit hw-handsHit");
    ctx.handsHit.setAttribute("aria-label", "손");
    ctx.pal = mk("hw-pal", '<img alt="">');
    // 물 잠그기를 기다릴 때 수도꼭지를 누르면 (순서 고르기와 따로)
    ctx.faucet.addEventListener("click", () => ctx._closeTap && ctx._closeTap());
    ctx.POSES = [
      { f: "palms", say: "손바닥을 싹싹 문질러요!", cen: [[0.27, 0.6], [0.73, 0.6]] },
      { f: "backs", say: "손등도 싹싹 문질러요!", cen: [[0.28, 0.55], [0.72, 0.55]] },
      { f: "clasp", say: "손가락 사이도 쏙쏙 문질러요!", cen: [[0.5, 0.35]] },
    ];
    // 세면대 배경 (1600×900): 수도꼭지·세면대 가운데. 꽃 손잡이는 배경에서 지우고 따로 그림(돌아가게)
    ctx.BG = {
      file: IMG + "bg.jpg", img: [1600, 900], vh: 0.2, near: 0.2, fov: 34, focus: [0.52, 0.56], focusP: [0.525, 0.62],
      zoomP: (w, h) => (w / h > 0.7 ? 1.25 : 1), // 태블릿 세로: 거울 쪽 빈 곳을 줄이고 세면대를 크게 (폰 세로는 손잡이가 잘려서 그대로)
    };
    ctx.TAPBOX = [
      [0.3586, 0.3936, 0.0833, 0.1489],
      [0.5446, 0.3936, 0.0833, 0.1489],
    ];
    ctx.F = { x: 0, y: 0, w: 1, h: 1 };
    ctx.pose = 0;
    ctx.token = 0;
  },
  /** 손 그림 3장 불러와 모양(표면 마스크) 만들기 — 한 번만 */
  loadHands(ctx) {
    if (ctx._handsP) return ctx._handsP;
    const load = (p) =>
      new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("손 그림을 못 읽었어요: " + p.f));
        im.src = ctx.IMG + p.f + ".png";
      });
    ctx._handsP = Promise.all(ctx.POSES.map(load))
      .then((ims) => {
        ctx.POSES.forEach((p, i) => {
          const im = ims[i];
          p.a = im.naturalWidth / im.naturalHeight;
          p.shape = KP.care.shapeOf(im, 300, Math.round(300 / p.a));
        });
      })
      .catch((e) => {
        ctx._handsP = null; // 다음에 다시
        throw e;
      });
    return ctx._handsP;
  },
  async start(ctx) {
    ctx.round = 0;
    const tok = ++ctx.token;
    if (ctx.st) ctx.st.dispose();
    ctx.st = KP.clayStage.create(ctx.scene, ctx.BG, { flat: true });
    ctx.st.onResize = () => this.layout(ctx);
    // 응원하는 인형 친구: 아이가 칠한 인형(정면 그림) → 없으면 기본 인형
    const dolls = await KP.dollActor.painted();
    await this.loadHands(ctx);
    if (tok !== ctx.token || !ctx._active) return;
    const it = dolls.length ? KP.u.pick(dolls) : null;
    ctx.pal.firstChild.src = (it && KP.safeImg(it.thumb)) || KP.DOLL.thumbUrl(KP.u.pick(KP.DOLL.ORDER || ["bear"]));
    ctx.S.run();
    ctx.loop(() => {
      const S = ctx.S;
      ctx.scene.classList.toggle("rubbing", !!S.on);
      ctx.hands.classList.toggle("glow", ctx.handsHit.classList.contains("glow"));
    });
    this.layout(ctx);
    this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    ctx._closeTap = null;
    ctx.water = false;
    ctx.scene.classList.remove("hw-on", "rubbing");
    if (ctx.S) {
      ctx.S.reset();
      ctx.S.dropSkin();
    }
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
  },
  /** 자리 잡기: 배경 그림 좌표(u,v) → 화면 px */
  layout(ctx) {
    const st = ctx.st;
    if (!st || !st.bc) return;
    const U = KP.u, W = st.w, H = st.h, v = st.bc.view, vis = st.bc.vis;
    const P = (u, vv) => st.uvToPx(u, vv);
    const put = (e, x, y, w, h) => (e.style.cssText += `;left:${x}px;top:${y}px;width:${w}px;height:${h}px`);
    // 꽃 손잡이
    ctx.TAPBOX.forEach((b, i) => {
      const p = P(b[0], b[1]);
      put(ctx.taps[i], p.x, p.y, b[2] * v.fw, b[3] * v.fh);
    });
    // 수도꼭지 누르는 곳: 두 손잡이 + 꼭지 전체
    const a = P(0.352, 0.3), b = P(0.635, 0.56);
    const fx0 = Math.max(2, a.x), fx1 = Math.min(W - 2, b.x);
    put(ctx.faucet, fx0, a.y, fx1 - fx0, b.y - a.y);
    // 손: 물줄기 아래, 손목은 화면 아래로 (내 손처럼)
    const spout = P(0.521, 0.494);
    const pose = ctx.POSES[ctx.pose];
    // 세로 화면(폰): 배경 양옆이 잘려 펌프·수건 놓을 데가 없음 → 손을 조금 줄이고 펌프·수건은 손 양옆 아래(세면대 앞 가장자리)
    const tall = W / H < 0.8;
    const bottom = H * 1.04;
    const maxW = tall ? W * 0.64 : W * 0.92;
    let top = spout.y + H * (H < 450 ? 0.04 : 0.1), h = bottom - top, w = h * pose.a; // 납작한 폰 가로: 손을 조금 더 크게
    if (w > maxW) {
      w = maxW;
      h = w / pose.a;
      top = bottom - h;
    }
    const x = U.clamp(spout.x - w / 2, W * 0.04, W * 0.96 - w);
    ctx.F = { x, y: top, w, h };
    put(ctx.hands, x, top, w, h);
    put(ctx.handsHit, x + w * 0.06, top, w * 0.88, Math.min(h, H - top));
    // 물줄기: 꼭지에서 손 위(손가락 쪽)까지
    const sw = Math.max(14, v.fw * 0.032);
    put(ctx.stream, spout.x - sw / 2, spout.y - 3, sw, Math.max(24, top + h * 0.34 - spout.y));
    // 물비누 펌프(왼쪽)·수건(오른쪽): 세면대 가장자리 위, 좁은 화면이면 보이는 곳 안쪽으로
    if (tall) {
      const side = Math.max(70, Math.min(x - 6, W * 0.2));
      const ph = Math.max(96, side * 1.45), pw = ph * (172 / 256);
      put(ctx.pump, Math.max(4, x - pw * 0.72), H * 0.79 - ph, pw, ph);
      const tw = Math.max(80, side * 1.15), th = tw * (199 / 256);
      put(ctx.towel, Math.min(W - tw - 4, x + w - tw * 0.2), H * 0.8 - th, tw, th);
    } else {
      const ph = Math.max(96, v.fh * 0.19), pw = ph * (172 / 256);
      const pu = Math.max(0.285, vis.u0 + (pw / v.fw) * 0.5 + 0.012);
      const pp = P(pu, 0.57);
      put(ctx.pump, U.clamp(pp.x - pw / 2, 4, W - pw - 4), pp.y - ph, pw, ph);
      const tw = Math.max(96, v.fw * 0.12), th = tw * (199 / 256);
      const tu = Math.min(0.755, vis.u1 - (tw / v.fw) * 0.5 - 0.012);
      const tp = P(tu, 0.585);
      put(ctx.towel, U.clamp(tp.x - tw / 2, 4, W - tw - 4), tp.y - th, tw, th);
    }
    // 응원 친구: 왼쪽 아래 구석
    const ps = Math.max(72, Math.min(H * 0.24, W * 0.26));
    ctx.pal.style.setProperty("--s", ps + "px");
    ctx.pal.style.left = Math.max(6, W * 0.02) + "px";
    ctx.pal.style.top = (tall ? 6 : H - ps - 6) + "px"; // 세로 화면은 아래 구석에 펌프가 있어 위 구석으로
    if (ctx.towelTool) ctx.S.setTool(ctx.towelTool, Math.max(80, w * 0.34));
  },
  /** 손 자세 바꾸기 (뒤집히듯 짧게) */
  async setPose(ctx, i, alive) {
    if (ctx.pose === i && ctx.handImg.getAttribute("src")) return;
    const S = ctx.S;
    if (ctx.handImg.getAttribute("src")) {
      ctx.hands.classList.add("flip");
      await ctx.wait(170);
      if (!alive()) return;
    }
    S.dropSkin();
    ctx.pose = i;
    ctx.handImg.src = ctx.IMG + ctx.POSES[i].f + ".png";
    this.layout(ctx);
    S.setSkin(ctx.POSES[i].shape);
    ctx.hands.classList.remove("flip");
    await ctx.wait(170);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const tok = ++ctx.token;
    const alive = () => tok === ctx.token && ctx._active;
    const lv = ctx.level;
    const muddy = lv === 3;
    S.reset();
    S.dropSkin();
    ctx._closeTap = null;
    ctx.water = false;
    ctx.towelTool = null;
    ctx.scene.classList.remove("hw-on");
    ctx.towel.classList.remove("away");
    ctx.handImg.removeAttribute("src");
    const F = () => ctx.F;
    const cx = () => F().x + F().w / 2;
    const handPt = () => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + F().x + F().w / 2, y: r.top + F().y + F().h * 0.4 };
    };
    const COLS = ["#8a5a2b", "#7a4e24", "#9b6a3a"];
    const addMud = () => {
      if (!muddy) return [];
      const shape = ctx.POSES[ctx.pose].shape;
      const m = U.sample(C.ptsIn(shape, 10, 0.07), 5).map((p) => ({ zone: "mud", x: p.x, y: p.y, r: 0.1, need: 2.4, col: U.pick(COLS), seed: Math.random() }));
      S.skinMud(m);
      return m;
    };
    let mudNow = [];
    // 점검용
    ctx.hwState = () => ({ tok, pose: ctx.pose, water: !!ctx.water, on: !!S.on, closeWait: !!ctx._closeTap, mode: Object.keys(S.mode || {}).join(","), prog: S.zones.rub ? S.prog("rub") : S.zones.rinse ? S.prog("rinse") : S.zones.dry ? S.prog("dry") : 0 });
    ctx.hwPt = (u, v) => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + F().x + u * F().w, y: r.top + F().y + v * F().h };
    };
    ctx.hwBody = () => C.ptsIn(ctx.POSES[ctx.pose].shape, 9, 0.03);

    /* ---------- 물 ---------- */
    const faucet = (on) => {
      ctx.water = on;
      ctx.scene.classList.toggle("hw-on", on);
      A.tone(on ? 480 : 900, { to: on ? 900 : 480, dur: 0.16, vol: 0.12, type: "triangle" });
      if (on) {
        const tick = () => {
          if (!ctx.water || !alive()) return;
          A.sfx("water");
          S.burst(cx() + U.randf(-F().w * 0.06, F().w * 0.06), F().y + F().h * 0.28, 3, "drop", 0.5);
          ctx.after(330, tick);
        };
        ctx.after(250, tick);
        C.pop(ctx, ctx.scene, cx() + F().w * 0.25, F().y, "졸졸");
      }
    };
    const waitClose = () =>
      new Promise((res) => {
        ctx.say("물을 잠가요!");
        ctx.hint(() => ctx.faucet, "물을 잠가요!");
        ctx._closeTap = () => {
          ctx._closeTap = null;
          ctx.hint(null);
          res();
        };
      });
    /** 손 문지르기 한 번 (구역 rub·rinse·dry 를 80% 이상) */
    const rubZone = (zone, mode, say, need, extra) =>
      new Promise((res) => {
        S.reset(true);
        S.add(C.ptsIn(ctx.POSES[ctx.pose].shape, 9, 0.03).map((p) => ({ zone, x: p.x, y: p.y, need })));
        if (extra && extra.length) S.add(extra);
        S.mode = mode;
        S.need = zone === "dry" ? 0.75 : 0.8;
        S.sound = zone === "rinse" ? () => A.noise({ dur: 0.08, vol: 0.05, bp: 1400, q: 1 }) : () => A.sfx("rub");
        let d = 0;
        S.onRub = (x, y, len) => {
          d += len;
          if (d > 120 && zone === "rub") (d = 0), A.sfx("bubble");
        };
        if (ctx.towelTool && zone === "dry") S.setTool(ctx.towelTool, Math.max(80, F().w * 0.34));
        else S.setTool("", 0);
        ctx.say(say + (zone === "rub" ? " 🫧" : ""));
        ctx.hint(handPt, say);
        S.on = true;
        S.onZone = (k) => {
          if (k !== zone) return;
          S.on = false;
          ctx.hint(null);
          res();
        };
      });

    const rubAll = async () => {
      for (let i = 0; i < ctx.POSES.length; i++) {
        if (!alive()) return;
        if (i > 0) {
          await this.setPose(ctx, i, alive);
          if (!alive()) return;
          S.skinFill("wet", 0.6);
          // 앞 자세에서 묻은 거품이 조금 남아 있게
          for (const p of U.sample(C.ptsIn(ctx.POSES[i].shape, 8, 0.05), 4)) S.skinDab("foam", p.x, p.y, 0.07);
          mudNow = addMud();
        }
        await rubZone("rub", { foam: true }, ctx.POSES[i].say, 1.8, mudNow);
        if (!alive()) return;
        S.finishZone("mud");
        S.skinFade("dirt");
        S.burst(cx(), F().y + F().h * 0.4, 14, "star", 0.8);
        A.sfx("sparkle");
        C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.12, "뽀득뽀득");
        await ctx.wait(800);
      }
    };
    const TOOLS = [
      { id: "water", el: ctx.faucet },
      { id: "soap", el: ctx.pump },
      { id: "rub", el: ctx.handsHit },
      { id: "towel", el: ctx.towel },
    ];
    const steps = [
      {
        tool: "water",
        say: "수도꼭지를 눌러 물을 틀어요!",
        act: async () => {
          faucet(true);
          // 물줄기 아래에서 손이 점점 촉촉
          for (let i = 0; i < 4; i++) {
            await ctx.wait(300);
            if (!alive()) return;
            S.skinFill("wet", 0.3);
          }
          await waitClose();
          if (!alive()) return;
          faucet(false);
          await ctx.wait(300);
        },
      },
      {
        tool: "soap",
        say: "비누를 눌러요!",
        wrong: "음, 그 전에 할 일이 있어요!",
        act: async () => {
          U.replay(ctx.pump, "press");
          A.sfx("pop");
          const pr = ctx.pump.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
          const cen = ctx.POSES[0].cen;
          const blob = U.el("div", "hw-blob");
          const s = F().w * 0.16;
          blob.style.cssText = `--s:${s}px;transform:translate(${pr.left - hr.left + pr.width * 0.62}px,${pr.top - hr.top + pr.height * 0.1}px)`;
          ctx.scene.appendChild(blob);
          await ctx.wait(60);
          const tx = F().x + F().w * (cen[0][0] + cen[1][0]) / 2, ty = F().y + F().h * 0.5;
          blob.style.transform = `translate(${tx}px,${ty}px)`;
          await ctx.wait(580);
          blob.remove();
          if (!alive()) return;
          A.sfx("bubble");
          for (const [u, v] of cen) for (let k = 0; k < 4; k++) S.skinDab("foam", u + U.randf(-0.05, 0.05), v + U.randf(-0.06, 0.06), 0.08);
          C.pop(ctx, ctx.scene, tx, ty - F().h * 0.2, "쏙");
          await ctx.wait(300);
        },
      },
      { tool: "rub", say: "거품을 싹싹 문질러요!", act: rubAll },
      {
        tool: "water",
        say: "물로 헹궈요!",
        act: async () => {
          faucet(true);
          await this.setPose(ctx, 0, alive);
          if (!alive()) return;
          S.skinFill("wet", 0.7);
          S.skinFill("foam", 1.1);
          await rubZone("rinse", { unfoam: true, drops: true }, "싹싹 비벼서 헹궈요!", 1.2);
          if (!alive()) return;
          S.skinFade("foam");
          C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "쏴아");
          await ctx.wait(500);
          await waitClose();
          if (!alive()) return;
          faucet(false);
          KP.voice.say("깨끗해졌어요!");
          await ctx.wait(400);
        },
      },
      {
        tool: "towel",
        say: "수건으로 닦아요!",
        act: async () => {
          A.sfx("slide");
          ctx.towel.classList.add("away");
          ctx.towelTool = '<img alt="" src="assets/play-clay/bath/towel.png">';
          await rubZone("dry", { dry: true, sparkle: true }, "수건으로 보송보송 닦아요!", 1.0);
          if (!alive()) return;
          ctx.towelTool = null;
          S.setTool("", 0);
          ctx.towel.classList.remove("away");
          S.skinFade("wet");
          C.pop(ctx, ctx.scene, cx(), F().y + F().h * 0.1, "보송보송");
          S.burst(cx(), F().y + F().h * 0.4, 24, "star", 1);
          A.sfx("sparkle");
          await ctx.wait(600);
        },
      },
    ];
    const ask = lv === 1 ? null : lv === 2 ? "손을 씻어요! 먼저 뭘 할까요?" : "밖에서 놀고 왔어요! 손에 흙이 묻었네. 혼자서 씻어 볼까요?";
    const pal = (on) => {
      ctx.pal.classList.toggle("on", on);
      if (on) U.replay(ctx.pal, "hop");
    };
    const go = () =>
      C.routine(ctx, { bar: ctx._bar || (ctx._bar = U.el("div", "kc-bar")), tools: TOOLS, steps, mode: lv, ask }).then(async (ok) => {
        if (!ok || !alive()) return;
        // 끝: 인형 친구가 폴짝 + 하트
        pal(true);
        const pr = ctx.pal.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
        KP.pfx.hearts(ctx.scene, pr.left - hr.left + pr.width / 2, pr.top - hr.top + pr.height * 0.2, 4, ctx);
        await ctx.wait(700);
        if (!alive()) return;
        ctx.score.add();
        ctx.round++;
        const big = ctx.round % 4 === 0;
        const msg = big ? "이제 진짜로 손 씻어 볼까?" : U.pick(["뽀득뽀득 깨끗한 손!", "{부름} 손 씻기 박사!", "와, 깨끗해졌어요!"]);
        const r = await ctx.win({ big, msg });
        pal(false);
        if (r && alive()) this.next(ctx);
      });
    // 시작: 손바닥 그림 (3단계는 흙 묻은 손) + 인형 친구 응원
    (async () => {
      await this.setPose(ctx, 0, alive);
      if (!alive()) return;
      mudNow = addMud();
      pal(true);
      ctx.after(2400, () => alive() && pal(false));
      if (lv === 1) {
        ctx.say("손을 깨끗이 씻어 볼까요? 🧼");
        ctx.after(1600, () => alive() && go());
      } else go();
    })();
  },
});
