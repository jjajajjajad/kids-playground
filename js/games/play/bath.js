/* 동물 목욕 — 점토 욕실의 둥근 욕조에 아이가 칠한 3D 인형 친구가 풍덩! 진흙 묻은 친구를 씻겨 줘요.
   - 욕조 앞벽·물이 인형 아랫몸을 가림(배경 그림 + 알파 마스크 앞가림, clay-stage frontMask)
   - 진흙·거품·물기는 인형 위에 겹친 '표면 마스크'(KP.care setSkin) — 인형 모양 안에서만 생기고, 문지른 자리만 지워짐.
     아이가 칠한 원본 그림(텍스처)은 건드리지 않음. 모양은 인형이 욕조에 앉은 뒤 화면에서 한 번 떠 냄(앞가림 부분은 뺌)
   - 비누로 문지르면 그 자리만 거품 + 진흙이 지워짐 → 샤워기로 헹구면 거품이 흘러내림 → 수건으로 물기 닦기 → 부르르(몸 흔들기 + 물방울)
   - 물 위에 점토 오리: 누르면 꽥!
   - 단계: 1 진흙 조금(첫 친구는 강아지) → 2 여러 친구·진흙 더 → 3 진흙 많이 (모두 안내 있음, 시간 제한 없음)
   공용: _shared/clay-stage.js · doll-actor.js · play-feedback.js · play/_care.js(문지르기 판·표면 마스크) */
"use strict";
KP.game({
  id: "bath",
  icon: "🛁",
  name: "동물 목욕",
  cat: "play",
  levels: 3,
  score: "🛁",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/bath/");
    KP.care.css();
    KP.css("bath", `
      .ba-scene{background:#e6efe4}
      .ba-skin{position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;pointer-events:none}
      .ba-rest{position:absolute;left:0;top:0;z-index:4;pointer-events:none;width:var(--s,80px);height:var(--s,80px);transition:opacity .2s}
      .ba-rest img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 6px 5px rgba(70,50,30,.3));animation:ba-bob 1.4s ease-in-out infinite alternate}
      .ba-rest.hide{opacity:0}
      .ba-rest.pop{animation:popIn .4s cubic-bezier(.2,1.5,.4,1)}
      .ba-duck{position:absolute;left:0;top:0;z-index:6;width:var(--s,70px);height:var(--s,70px);touch-action:none;cursor:pointer}
      .ba-duck img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(40,80,110,.25));animation:ba-bob 1.7s ease-in-out infinite alternate}
      .ba-duck.quack img{animation:ba-quack .4s ease-out}
      @keyframes ba-bob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-7%) rotate(4deg)}}
      @keyframes ba-quack{35%{transform:scale(1.18,.84) rotate(-8deg)}70%{transform:scale(.95,1.08)}}
      .kc-tool .ba-shw{position:relative;width:100%;height:100%}
      .kc-tool .ba-shw img{position:absolute;left:18%;top:-62%;width:74%;height:auto;transform:rotate(196deg);filter:drop-shadow(0 -6px 5px rgba(0,0,0,.22))}
      .ba-spray{position:absolute;left:24%;top:30%;width:52%;height:52%;clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);opacity:.85;
        background:repeating-linear-gradient(97deg,rgba(170,220,255,0) 0 5px,rgba(170,220,255,.95) 5px 8px,rgba(255,255,255,0) 8px 13px);
        -webkit-mask-image:linear-gradient(#000 40%,transparent);mask-image:linear-gradient(#000 40%,transparent);animation:ba-spray .22s linear infinite}
      @keyframes ba-spray{from{background-position:0 0}to{background-position:0 26px}}
      .ba-load{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene ba-scene"));
    ctx.body.appendChild(scene);
    // 표면(진흙·거품·물기)은 욕조 앞벽보다 뒤에 그림: z 2, 무대가 나중에 붙이는 앞가림(z 2)보다 DOM 이 앞
    ctx.skinCv = U.el("canvas", "ba-skin");
    scene.appendChild(ctx.skinCv);
    ctx.rest = U.el("div", "ba-rest");
    ctx.duck = U.el("div", "ba-duck", '<img alt="" draggable="false" src="' + IMG + 'duck.png">');
    ctx.duck.setAttribute("aria-label", "오리");
    scene.append(ctx.rest, ctx.duck);
    ctx.F = { x: 0, y: 0, w: 1, h: 1 };
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F });
    ctx.S.radius = 0.1;
    // 오리: 누르면 꽥! (언제든)
    ctx.fast(ctx.duck, () => {
      const A = KP.audio;
      A.tone(1150, { to: 720, dur: 0.1, vol: 0.15, type: "square" });
      A.tone(1050, { to: 640, dur: 0.13, vol: 0.13, type: "square", when: 0.13 });
      U.replay(ctx.duck, "quack");
      const r = ctx.duck.getBoundingClientRect(), hr = scene.getBoundingClientRect();
      KP.care.pop(ctx, scene, r.left - hr.left + r.width / 2, r.top - hr.top, "꽥!");
      KP.pfx.ring(scene, r.left - hr.left + r.width / 2, r.top - hr.top + r.height * 0.85, "#bfe6ff", ctx, r.width * 1.2);
    });
    // 욕실 배경 (1600×900): 욕조 가운데. 가로 화면은 조금 당겨서(zoom) 인형을 크게
    ctx.BG = {
      file: IMG + "bg.jpg", frontMask: IMG + "front-mask.png", img: [1600, 900], vh: 0.2, near: 0.2, fov: 34,
      focus: [0.5, 0.36], focusP: [0.5, 0.38], sun: [-0.35, 1, 0.8], sunCol: "#fff4e6",
      zoom: (w, h) => (w / h > 1.9 ? 1 : w / h > 1.6 ? 1.12 : 1.18), // 납작한 폰 가로 화면은 당기지 않음(머리 잘림 방지)
    };
    // 앞가림 마스크 그림 (표면에서 가려진 곳 빼기용)
    ctx.frontImg = new Image();
    ctx.frontImg.src = ctx.BG.frontMask;
    ctx.TOOLS = {
      soap: '<img alt="" src="' + IMG + 'soap.png">',
      shower: '<div class="ba-shw"><i class="ba-spray"></i><img alt="" src="' + IMG + 'shower.png"></div>',
      towel: '<img alt="" src="' + IMG + 'towel.png">',
    };
    ctx.token = 0;
  },

  /* ---------- 무대 · 인형 (동물 병원과 같은 방식) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const slow = KP.store.get("bath:flat", null);
    let flat = !CS.supported() || (slow && Date.now() - (slow.t || 0) < 7 * 864e5);
    if (!flat) {
      try {
        await CS.load();
      } catch (e) {
        flat = true;
      }
    }
    if (!ctx._active) return null;
    let st;
    const opt = {
      flat,
      qKey: "play3d:q",
      onLost: () => ctx._active && ctx.st === st && this.start(ctx, true),
      onSlow: () => {
        if (!ctx._active || ctx.st !== st) return;
        KP.store.set("bath:flat", { t: Date.now() });
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
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
    if (ctx.S) {
      ctx.S.reset();
      ctx.S.dropSkin();
    }
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    if (ctx.st) ctx.st.dispose();
    ctx.st = null;
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
    const sp = ctx.level === 1 && !ctx.round ? "dog" : U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },
  async start(ctx, again) {
    if (!again) ctx.round = 0;
    const tok = ++ctx.token;
    ctx.scene.querySelectorAll(".ba-load").forEach((e) => e.remove());
    const wait = KP.u.el("div", "ba-load", KP.E("🛁") + " 준비 중");
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      st.tick(dt);
      if (ctx.track) ctx.track(dt);
    });
    ctx.S.run();
    return this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    this.dropStage(ctx);
  },

  /** 인형 모양 떠 내기: 화면에 그려진 인형(3D 캔버스 또는 그림)의 알파 − 앞가림(욕조 앞벽·물) → 틀(F) 크기의 작은 캔버스 */
  captureShape(ctx, F, size) {
    const st = ctx.st, act = ctx.actor;
    const k = size ? size.w / F.w : Math.min(1.5, 300 / Math.max(F.w, F.h));
    const mw = size ? size.w : Math.max(8, Math.round(F.w * k)),
      mh = size ? size.h : Math.max(8, Math.round(F.h * k));
    const c = document.createElement("canvas");
    c.width = mw;
    c.height = mh;
    const g = c.getContext("2d", { willReadFrequently: true });
    // 원본 밖을 가리키지 않게 자른 뒤 그림 (옛 Safari 는 밖을 가리키면 아무것도 안 그림)
    const blit = (src, sw, sh, sx, sy, w, h, dx, dy, dw, dh) => {
      const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(sw, sx + w), y1 = Math.min(sh, sy + h);
      if (x1 <= x0 || y1 <= y0) return;
      const kx = dw / w, ky = dh / h;
      g.drawImage(src, x0, y0, x1 - x0, y1 - y0, dx + (x0 - sx) * kx, dy + (y0 - sy) * ky, (x1 - x0) * kx, (y1 - y0) * ky);
    };
    try {
      if (st.gl) {
        st.render(); // 같은 순간에 읽어야 그림이 남아 있음
        const src = st.renderer.domElement, s = src.width / st.w;
        blit(src, src.width, src.height, F.x * s, F.y * s, F.w * s, F.h * s, 0, 0, mw, mh);
      } else if (act && act.el) {
        const img = act.el.querySelector("img");
        if (img && img.naturalWidth) {
          const r = img.getBoundingClientRect(), hr = st.host.getBoundingClientRect();
          const sc = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
          const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
          const dx = r.left - hr.left + (r.width - dw) / 2, dy = r.top - hr.top + (r.height - dh) / 2;
          g.drawImage(img, (dx - F.x) * k, (dy - F.y) * k, dw * k, dh * k);
        }
      }
    } catch (e) {
      console.warn("인형 모양을 못 떴어요", e && e.message);
    }
    KP.care.hardAlpha(c, 170); // 바닥 그림자(반투명)는 뺌
    if (ctx.frontImg.complete && ctx.frontImg.naturalWidth) {
      const v = st.bc.view;
      g.globalCompositeOperation = "destination-out";
      g.drawImage(ctx.frontImg, (-v.ox - F.x) * k, (-v.oy - F.y) * k, v.fw * k, v.fh * k);
      g.globalCompositeOperation = "source-over";
    }
    // 못 떴으면(그래픽 읽기 막힘 등) 틀 위쪽의 둥근 모양으로
    const d = g.getImageData(0, 0, mw, mh).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 128) n++;
    if (n < (mw * mh) / 4 * 0.04) {
      g.clearRect(0, 0, mw, mh);
      g.fillStyle = "#fff";
      g.beginPath();
      g.ellipse(mw / 2, mh * 0.42, mw * 0.36, mh * 0.36, 0, 0, 6.283);
      g.fill();
      if (ctx.frontImg.naturalWidth) {
        const v = st.bc.view;
        g.globalCompositeOperation = "destination-out";
        g.drawImage(ctx.frontImg, (-v.ox - F.x) * k, (-v.oy - F.y) * k, v.fw * k, v.fh * k);
        g.globalCompositeOperation = "source-over";
      }
      ctx._shapeFallback = true;
    } else ctx._shapeFallback = false;
    return c;
  },

  async next(ctx) {
    const U = KP.u,
      A = KP.audio,
      C = KP.care,
      S = ctx.S,
      st = ctx.st;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    S.reset();
    S.dropSkin();
    ctx.track = null;
    ctx.rest.classList.add("hide");
    ctx.stage = "enter";
    ctx.baState = null;

    /* ---------- 인형 ---------- */
    const pick = this.pickDoll(ctx);
    if (ctx.actor) ctx.actor.dispose();
    ctx.actor = null;
    let act;
    try {
      act = st.gl ? await KP.dollActor.create(st, pick) : await KP.dollActor.create2D(st, pick);
    } catch (e) {
      console.warn("인형 준비 실패", e && e.message);
      if (!live()) return;
      act = await KP.dollActor.create2D(st, { species: "dog" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    // 자리: 욕조 가운데. 발은 물속(그림 v 0.593), 머리 꼭대기는 그림 v 0.07 → 물 위로 몸 위쪽 3/4
    const FOOT = [0.5, 0.593], TOPV = 0.07;
    const layout = () => {
      const g = st.bc.ground(FOOT[0], FOOT[1]) || st.spot("x");
      const fp = st.uvToPx(FOOT[0], FOOT[1]), tp = st.uvToPx(FOOT[0], TOPV);
      act.setH(st.fitH(g[0], g[1], (fp.y - tp.y) / st.h));
      return g;
    };
    let seat = layout();
    let entering = true;
    let shapeT = null;
    st.onResize = () => {
      seat = layout();
      if (!entering && !act._jump) act.place(seat[0], seat[1]);
      // 화면 크기가 바뀌면 모양만 다시 뜸 (진흙·거품 층은 틀 비율이라 그대로)
      if (S.skin) {
        ctx.cancel(shapeT);
        shapeT = ctx.after(300, () => {
          if (!live() || !S.skin) return;
          S.skin.shape = this.captureShape(ctx, ctx.F, { w: S.skin.w, h: S.skin.h });        });
      }
    };
    const offX = () => {
      const b = act.box();
      return seat[0] + st.pxToWorld(seat[0], seat[1], st.w - st.project(seat[0], 0, seat[1]).x + b.w / 2 + 20);
    };
    act.place(offX(), seat[1]);
    act.mood("normal");
    const name = act.name;
    // 화면에 붙는 것들 (매 장면)
    const restAt = (u, v, s) => {
      const p = st.uvToPx(u, v);
      return [U.clamp(p.x - s / 2, 6, st.w - s - 6), U.clamp(p.y - s / 2, 6, st.h - s - 6)];
    };
    let restTool = null;
    ctx.track = () => {
      const b = act.box();
      ctx.F = { x: b.l - b.w * 0.12, y: b.t - b.h * 0.06, w: b.w * 1.24, h: b.h * 1.12 };
      const fh = st.bc.view.fh;
      // 오리: 인형 왼쪽 물 위 (좁은 화면이면 가장자리 안쪽)
      const ds = Math.max(54, fh * 0.11);
      const dp = st.uvToPx(0.335, 0.425);
      const dx = U.clamp(Math.min(dp.x, b.l - ds * 0.35) - ds / 2, 4, st.w - ds - 4);
      ctx.duck.style.cssText = `--s:${ds}px;transform:translate(${dx}px,${dp.y - ds * 0.72}px)`;
      // 쉬고 있는 도구: 욕조 오른쪽 가장자리 위
      if (restTool) {
        const rs = Math.max(64, fh * 0.13);
        const [rx, ry] = restAt(0.735, 0.355, rs);
        const lx = b.r + 4 + rs > st.w ? rx : Math.max(rx, b.r + 4);
        ctx.rest.style.cssText = `--s:${rs}px;left:${lx}px;top:${ry}px`;
        ctx.rest.classList.toggle("hide", S.toolEl.classList.contains("on"));
      }
      // 비누로 문지르는 동안 간지러워 웃음
      if (ctx.stage === "soap") act.mood(S.toolEl.classList.contains("on") ? "happy" : "normal");
    };
    const dollPt = () => {
      const r = ctx.scene.getBoundingClientRect(), p = act.anchor("chest");
      return { x: r.left + p.x, y: r.top + p.y };
    };

    /* ---------- 들어오기: 폴짝 → 첨벙 ---------- */
    let line = "진흙투성이 " + name + "! 깨끗이 씻겨 줘요";
    if (!(KP.voice._natUrls && KP.voice._natUrls(line))) line = "진흙투성이 친구! 깨끗이 씻겨 줘요";
    await Promise.race([act.jumpTo(seat[0], seat[1], 0.85, 0.55), ctx.wait(1300)]);
    if (!live()) return;
    entering = false;
    act.place(seat[0], seat[1]);
    A.sfx("water");
    A.tone(320, { to: 120, dur: 0.18, vol: 0.18, type: "sine" });
    {
      const w = st.uvToPx(0.5, 0.44);
      S.burst(w.x - act.box().w * 0.3, w.y, 10, "drop", 1);
      S.burst(w.x + act.box().w * 0.3, w.y, 10, "drop", 1);
      C.pop(ctx, ctx.scene, w.x, act.box().t, "첨벙!");
    }
    ctx.say(line + " 🛁");
    await ctx.wait(650); // 자리 잡고 고개가 정면을 볼 때까지
    if (!live()) return;

    /* ---------- 표면: 인형 모양 + 진흙 ---------- */
    ctx.track();
    const shape = this.captureShape(ctx, ctx.F);
    S.setSkin(shape, { el: ctx.skinCv });
    const body = C.ptsIn(shape, 10, 0.025);
    const mudN = [4, 6, 8][lv - 1];
    const COLS = ["#8a5a2b", "#7a4e24", "#9b6a3a"];
    const cand = C.ptsIn(shape, 12, 0.06);
    const mud = U.sample(cand.length >= mudN ? cand : body, mudN).map((p) => ({ zone: "a", x: p.x, y: p.y, r: U.randf(0.13, 0.18), need: 1.6, col: U.pick(COLS), seed: Math.random() }));
    S.skinMud(mud);
    ctx.mud = mud;
    // 점검용
    ctx.baState = () => ({ tok, stage: ctx.stage, on: S.on, painted: act.painted, gl: !!st.gl, who: name, fallback: !!ctx._shapeFallback, prog: S.zones[ctx.stage] ? S.prog(ctx.stage) : 0 });
    ctx.baPt = (u, v) => {
      const r = ctx.scene.getBoundingClientRect();
      return { x: r.left + ctx.F.x + u * ctx.F.w, y: r.top + ctx.F.y + v * ctx.F.h };
    };
    ctx.baBody = () => body;
    await ctx.wait(1200);
    if (!live()) return;

    /* ---------- 단계: 비누 → 샤워기 → 수건 ---------- */
    const setTool = (tool) => {
      restTool = tool;
      ctx.rest.innerHTML = '<img alt="" src="' + ctx.IMG + tool + '.png">'; // 쉬는 도구는 그림만 (물줄기 없이)
      ctx.rest.classList.remove("hide");
      U.replay(ctx.rest, "pop");
      S.setTool(ctx.TOOLS[tool], Math.max(70, ctx.F.w * 0.36));
    };
    let lastWater = 0;
    const stage = (tool, mode, say, need, extra) =>
      new Promise((res) => {
        S.reset(true);
        S.add(body.map((p) => ({ zone: tool, x: p.x, y: p.y, need })));
        if (extra) S.add(extra);
        S.mode = mode;
        S.need = 0.8;
        ctx.stage = tool;
        setTool(tool);
        S.sound =
          tool === "shower"
            ? () => {
                if (Date.now() - lastWater > 260) (lastWater = Date.now()), A.sfx("water");
              }
            : () => A.sfx("rub");
        let rubD = 0;
        S.onRub = (x, y, len) => {
          rubD += len;
          if (rubD > 110) {
            rubD = 0;
            if (tool === "soap") A.sfx("bubble");
            const part = act.hit(x, y, ["chest", "belly", "forehead", "cheekR", "cheekL", "armR", "armL"]);
            if (part) act.poke(part, -0.012, 0.12); // 만진 자리가 살짝 쏙
          }
        };
        ctx.say(say);
        ctx.hint(dollPt, say);
        S.on = true;
        S.onZone = (k) => {
          if (k !== tool) return;
          S.on = false;
          ctx.hint(null);
          res();
        };
      });
    const cx = () => ctx.F.x + ctx.F.w / 2;
    const topY = () => Math.max(56, act.box().t + act.box().h * 0.08); // 떠오르는 글자가 위로 잘리지 않게

    await stage("soap", { foam: true }, "비누로 거품을 뽀글뽀글 문질러요! 🧼", 1.4, mud);
    if (!live()) return;
    S.finishZone("a");
    S.skinFade("dirt"); // 남은 진흙은 스르륵
    act.mood("happy");
    A.sfx("bubble");
    C.pop(ctx, ctx.scene, cx(), topY(), "뽀글뽀글");
    await ctx.wait(800);
    if (!live()) return;
    act.mood("normal");

    await stage("shower", { unfoam: true, drops: true }, "샤워기로 거품을 씻어요! 🚿", 1.2);
    if (!live()) return;
    S.skinFade("foam");
    A.sfx("water");
    C.pop(ctx, ctx.scene, cx(), topY(), "쏴아");
    await ctx.wait(800);
    if (!live()) return;

    // 물기가 아직 없는 곳도 촉촉하게 (수건으로 닦을 게 보이게)
    S.skinFill("wet", 0.8);
    await stage("towel", { dry: true, sparkle: true }, "수건으로 보송보송 닦아요!", 1.1);
    if (!live()) return;
    S.skinFade("wet");
    ctx.stage = "shake";
    restTool = null;
    ctx.rest.classList.add("hide");

    /* ---------- 부르르 → 기뻐하기 ---------- */
    C.pop(ctx, ctx.scene, cx(), topY(), "부르르", true);
    A.sfx("boing");
    for (let i = 0; i < 6; i++) ctx.after(i * 120, () => A.noise({ dur: 0.08, vol: 0.06, bp: 1800, q: 1.2 }));
    const t0 = st.time, DUR = 1.2;
    const shake = (dt, t) => {
      const e = (t - t0) / DUR;
      if (e >= 1) {
        act.play.sway = act.play.tilt = 0;
        st.updaters = st.updaters.filter((f) => f !== shake);
        return;
      }
      const env = Math.sin(Math.PI * Math.min(1, e * 1.3));
      act.play.sway = Math.sin(t * 44) * 0.085 * env;
      act.play.tilt = Math.sin(t * 38 + 1) * 0.14 * env;
    };
    st.updaters.push(shake);
    for (let i = 0; i < 6; i++)
      ctx.after(i * 180, () => {
        const b = act.box();
        S.burst(b.l + b.w * 0.15, b.t + b.h * U.randf(0.25, 0.6), 5, "drop", 0.9);
        S.burst(b.r - b.w * 0.15, b.t + b.h * U.randf(0.25, 0.6), 5, "drop", 0.9);
      });
    await ctx.wait(1300);
    if (!live()) return;
    act.mood("happy");
    act.happy();
    const b = act.box();
    S.burst(b.cx, b.t + b.h * 0.35, 30, "star", 1.1);
    KP.pfx.hearts(ctx.scene, b.cx, b.t + b.h * 0.1, 4, ctx);
    A.sfx("sparkle");
    await ctx.wait(900);
    if (!live()) return;
    ctx.score.add();
    ctx.round++;
    const big = ctx.round % 4 === 0;
    const msg = big ? "{부름} 목욕 최고!" : U.pick(["뽀송뽀송 깨끗해!", "깨끗해졌어요!", "{부름} 고마워요!"]);
    const ok = await ctx.win({ big, msg });
    if (ok && live()) this.next(ctx);
  },
});
