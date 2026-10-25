/* 응가 끙끙 화장실 — 점토 화장실에서 아이가 칠한 3D 인형 친구(없으면 기본 인형)가 혼자 화장실 가기
   - 꼼지락 신호(인형이 들썩들썩) → 장면 속 물건 고르기(변기 / 창가 쿠키 / 곰인형, 보기 3개) → 변기 앞으로 걸어감
   - 순서(장면 속 물건을 직접 눌러요): 친구(바지 내리기) → 변기(뚜껑이 열리고 폴짝 앉기) → 끙끙(친구를 콕콕) → 휴지걸이(휴지 쭉)
     → 친구(내려와서 바지 올리기) → 변기 물 내림 손잡이(물 소용돌이) → 세면대(걸어가서 손 씻기 — 손 씻기 놀이의 세면대·손 장면을 짧게)
   - 앉기: 인형 자세는 그대로, 변기 앞면·발판 앞가림(배경 그림 + 알파 마스크, clay-stage frontMask)이 아랫몸을 가림. 바지(점토 소품)도 가림 뒤
   - 뚜껑은 배경 그림에서 닫혀 있어 → 변기에 가면 캔버스로 연 모습(세운 뚜껑·변기 시트·물)을 덮어 그림. 물 내림 소용돌이도 여기
   - 세로 화면(폰·태블릿 세로)은 배경이 양옆으로 잘려서 → 카메라가 친구를 따라 옆으로 이동(focusP 를 바꾸고 무대 다시 맞춤)
   - 지저분한 그림·말 없음 ('퐁당!', '시원하다!' 정도). 단계: 1 순서 안내(할 물건이 반짝) → 2 '다음엔 뭘 할까요?' → 3 혼자서. 시간 제한 없음
   공용: _shared/clay-stage.js · doll-actor.js · play-feedback.js · play/_care.js(순서·문지르기 판·표면 마스크) */
"use strict";
KP.game({
  id: "potty",
  icon: "🚽",
  name: "응가 끙끙 화장실",
  cat: "play",
  levels: 3,
  score: "🧻",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/potty/");
    const HW = (ctx.HW = "assets/play-clay/handwash/");
    KP.care.css();
    KP.css("potty", `
      .pt-scene{background:#e9e2cf}
      .pt-back{position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none}
      .pt-pants{position:absolute;left:0;top:0;z-index:1;pointer-events:none;will-change:transform}
      .pt-pants img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 3px 3px rgba(60,40,20,.25))}
      .pt-hit{position:absolute;left:0;top:0;z-index:6;border-radius:40%;touch-action:manipulation;cursor:pointer}
      .pt-hit.glow{animation:pt-ring 1.1s ease-in-out infinite alternate}
      @keyframes pt-ring{from{box-shadow:0 0 0 0 rgba(255,205,40,0);background:rgba(255,240,170,0)}to{box-shadow:0 0 0 7px rgba(255,205,40,.75);background:rgba(255,240,170,.2)}}
      .pt-doll.glow{border-radius:45%}
      .pt-obj{position:absolute;left:0;top:0;z-index:6;touch-action:manipulation;cursor:pointer;transition:opacity .4s,transform .3s}
      .pt-obj img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 5px 4px rgba(60,40,20,.3))}
      .pt-obj.glow img{animation:pt-glowF 1.1s ease-in-out infinite alternate}
      @keyframes pt-glowF{from{filter:drop-shadow(0 5px 4px rgba(60,40,20,.3))}to{filter:drop-shadow(0 0 9px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .pt-obj.away{opacity:0;pointer-events:none}
      .pt-teddy{z-index:7}
      .pt-lever{z-index:5;pointer-events:none;transform-origin:72% 52%;transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
      .pt-lever img{transform:scaleX(-1);clip-path:inset(0 0 21% 0)}
      .pt-lever.down{transform:rotate(-38deg)}
      .pt-lever.glow img{animation:pt-glowL 1.1s ease-in-out infinite alternate}
      @keyframes pt-glowL{from{filter:drop-shadow(0 4px 3px rgba(60,40,20,.3))}to{filter:drop-shadow(0 0 8px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .pt-strip{position:absolute;left:0;top:0;z-index:4;pointer-events:none;transform-origin:50% 0;transform:scaleY(0);border-radius:0 0 18% 18%/0 0 8% 8%;
        background:repeating-linear-gradient(180deg,transparent 0 31%,rgba(170,155,130,.35) 31% 32.5%),linear-gradient(90deg,#efe9dc,#fffdf7 30%,#fbf6ec 70%,#e6dfd0);
        box-shadow:0 3px 4px rgba(60,40,20,.2);transition:transform .45s ease-out,opacity .4s}
      .pt-strip.on{transform:scaleY(1)}
      .pt-strip.fly{opacity:0;transition:transform .55s ease-in,opacity .55s}
      .pt-load{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,250,240,.9);border-radius:999px;padding:.4em 1em;font-size:22px}
      /* 손 씻기 (세면대 가까이 보기) */
      .pt-wash{position:absolute;inset:0;z-index:8;opacity:0;pointer-events:none;transition:opacity .35s;background:#cfe6cf;overflow:hidden;border-radius:inherit}
      .pt-wash.on{opacity:1;pointer-events:auto}
      .pt-wtap{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
      .pt-wtap img{width:100%;height:100%;display:block}
      .pt-wash.water .pt-wtap{transform:rotate(-36deg)}
      .pt-wstream{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transform-origin:50% 0;transform:scaleY(0);opacity:0;transition:transform .3s ease-in,opacity .2s;
        border-radius:45% 45% 40% 40%/6% 6% 5% 5%;
        background:linear-gradient(90deg,rgba(140,200,250,.35),rgba(215,240,255,.85) 28%,rgba(255,255,255,.95) 40%,rgba(180,222,252,.7) 62%,rgba(120,185,240,.4));
        -webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent)}
      .pt-wash.water .pt-wstream{transform:scaleY(1);opacity:1}
      .pt-whands{position:absolute;left:0;top:0;z-index:4;pointer-events:none}
      .pt-whands img{width:100%;height:100%;display:block;filter:drop-shadow(0 8px 8px rgba(60,40,20,.25))}
      .pt-wash .pt-hit{z-index:6}
      .pt-wash.rubbing .pt-hit{pointer-events:none}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene pt-scene"));
    ctx.body.appendChild(scene);
    const mk = (cls, html = "", tag = "div", host = scene) => {
      const e = U.el(tag, cls, html);
      host.appendChild(e);
      return e;
    };
    // 무대(clay-stage) 층 사이에 끼울 것: 뒤 캔버스(배경 바로 위) · 바지(3D 위, 앞가림 아래) — makeStage 에서 제자리로 옮김
    ctx.back = mk("pt-back", "", "canvas");
    ctx.pants = mk("pt-pants", '<img alt="" src="' + IMG + 'pants.png">');
    ctx.strip = mk("pt-strip");
    ctx.lever = mk("pt-obj pt-lever", '<img alt="" draggable="false" src="' + IMG + 'lever.png">');
    ctx.cookie = mk("pt-obj pt-cookie", '<img alt="" draggable="false" src="' + IMG + 'cookie.png">');
    ctx.teddy = mk("pt-obj pt-teddy", '<img alt="" draggable="false" src="' + IMG + 'teddy.png">');
    ctx.cookie.setAttribute("aria-label", "쿠키");
    ctx.teddy.setAttribute("aria-label", "곰인형");
    ctx.hit = {};
    for (const [k, label] of [["toilet", "변기"], ["paper", "휴지"], ["flush", "물 내림 손잡이"], ["sink", "세면대"], ["doll", "친구"]]) {
      ctx.hit[k] = mk("pt-hit pt-" + k);
      ctx.hit[k].setAttribute("aria-label", label);
    }
    ctx.S = KP.care.surface(ctx, scene, { pass: true }); // 반짝이·물방울
    ctx.fast(ctx.hit.doll, () => ctx.onKid && ctx.onKid());
    // 손 씻기 가까이 보기
    const ov = (ctx.wash = mk("pt-wash"));
    ctx.wTaps = [mk("pt-wtap", '<img alt="" src="' + HW + 'tap-blue.png">', "div", ov), mk("pt-wtap", '<img alt="" src="' + HW + 'tap-pink.png">', "div", ov)];
    ctx.wStream = mk("pt-wstream", "", "div", ov);
    ctx.wHands = mk("pt-whands", '<img alt="" draggable="false" src="' + HW + 'palms.png">', "div", ov);
    ctx.wF = { x: 0, y: 0, w: 1, h: 1 };
    ctx.W2 = KP.care.surface(ctx, ov, { frame: () => ctx.wF, pass: true });
    ctx.W2.radius = 0.09;
    ctx.wFaucet = mk("pt-hit pt-wfaucet", "", "div", ov);
    ctx.wFaucet.setAttribute("aria-label", "수도꼭지");
    ctx.wFaucet.addEventListener("click", () => ctx.onFaucet && ctx.onFaucet());
    ctx.HWBG = { file: HW + "bg.jpg", img: [1600, 900], vh: 0.2, near: 0.2, fov: 34, focus: [0.52, 0.56], focusP: [0.525, 0.62], zoomP: (w, h) => (w / h > 0.7 ? 1.25 : 1) };
    ctx.TAPBOX = [
      [0.3586, 0.3936, 0.0833, 0.1489],
      [0.5446, 0.3936, 0.0833, 0.1489],
    ];

    // 화장실 배경 (1600×900): 왼쪽 변기+발판, 가운데 빈 바닥, 오른쪽 세면대. 세로 화면은 focusP 를 바꿔 따라감
    ctx.BG = {
      file: IMG + "bg.jpg", frontMask: IMG + "front-mask.png", img: [1600, 900], vh: 0.35, near: 0.2, fov: 34,
      focus: [0.5, 0.56], focusP: [0.26, 0.6], sun: [0.3, 1, 0.8], sunCol: "#fff4e6",
    };
    // 그림 좌표(0~1)
    ctx.P = {
      lid: [0.1866, 0.5433, 0.0884, 0.0412], // 뚜껑 타원 (가운데 u,v · 반지름 u,v)
      lever: [0.0706, 0.4144],
      start: [0.5, 0.92], startP: [0.36, 0.92], front: [0.29, 0.94], seat: [0.1866, 0.775], mid: [0.63, 0.92], sink: [0.83, 0.93],
      boxes: { toilet: [0.04, 0.33, 0.28, 0.66], flush: [0.025, 0.36, 0.11, 0.47], paper: [0.256, 0.333, 0.338, 0.5], sink: [0.735, 0.31, 0.95, 0.58] },
      strip: [0.2956, 0.49, 0.05], // 휴지 끝 (가운데 u, 위 v, 폭 u)
      cookie: [0.415, 0.295, 0.072], teddy: [0.1, 0.9, 0.055], // 가운데 u · 바닥 v · 폭 u (쿠키는 창턱, 곰인형은 변기 왼쪽 앞 바닥)
    };
    ctx.token = 0;
  },

  /* ---------- 무대 · 인형 (목욕·병원과 같은 방식) ---------- */
  async makeStage(ctx) {
    const CS = KP.clayStage;
    this.dropStage(ctx);
    const tok = (ctx._stTok = (ctx._stTok || 0) + 1); // 기다리는 사이 다시 불렸으면 옛 호출은 무대를 만들지 않음
    const slow = KP.store.get("potty:flat", null);
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
        KP.store.set("potty:flat", { t: Date.now() });
        KP.toast("기기가 바빠서 그림으로 바꿨어요");
        this.start(ctx, true);
      },
    };
    ctx.BG.focusP = [0.26, 0.6];
    try {
      st = CS.create(ctx.scene, ctx.BG, opt);
    } catch (e) {
      opt.flat = true;
      st = CS.create(ctx.scene, ctx.BG, opt);
    }
    // 층 순서: 배경 → 뒤 캔버스(연 뚜껑) → [그림 인형] → 3D → 바지 → 앞가림 → …
    st.bgEl.after(ctx.back);
    st.frontEl.before(ctx.pants);
    st.frontEl.style.visibility = "hidden"; // 앞가림은 변기에 앉았을 때만
    ctx.st = st;
    return st;
  },
  dropStage(ctx) {
    ctx.track = null;
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
    const sp = U.pick(D.ORDER.filter((s) => s !== ctx.lastDoll));
    ctx.lastDoll = sp;
    return { species: sp };
  },
  async start(ctx, again) {
    if (!again) ctx.round = 0;
    const tok = ++ctx.token;
    ctx.scene.querySelectorAll(".pt-load").forEach((e) => e.remove());
    const wait = KP.u.el("div", "pt-load", KP.E("🚽") + " 준비 중");
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    ctx.dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const st = await this.makeStage(ctx);
    ctx.cancel(wt);
    wait.remove();
    if (!st || tok !== ctx.token || !ctx._active) return;
    ctx.loop((dt) => {
      if (ctx.st !== st || st.dead) return false;
      if (ctx.pan) ctx.pan(dt);
      st.tick(dt);
      if (ctx.track) ctx.track(dt);
    });
    ctx.S.run();
    ctx.W2.run();
    return this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    ctx.onKid = ctx.onFaucet = null;
    this.closeWash(ctx);
    this.dropStage(ctx);
  },
  closeWash(ctx) {
    ctx.wash.classList.remove("on", "water", "rubbing");
    if (ctx.W2) {
      ctx.W2.reset();
      ctx.W2.dropSkin();
    }
    if (ctx.wst) ctx.wst.dispose();
    ctx.wst = null;
  },

  /** 연 변기(세운 뚜껑 · 시트 · 물)와 물 내림 소용돌이 — 뒤 캔버스 (배경 위, 인형 아래) */
  drawBack(ctx, dt) {
    const c = ctx.back, st = ctx.st, d = Math.min(2, window.devicePixelRatio || 1), W = st.w, H = st.h;
    if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) {
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
    }
    const g = c.getContext("2d");
    const o = ctx.lidOpen || 0;
    if (o <= 0 && ctx._backClear) return; // 닫혀 있으면 한 번만 지우고 쉼 (저가 기기)
    ctx._backClear = o <= 0;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, H);
    if (o <= 0) return;
    const v = st.bc.view, L = ctx.P.lid, p = st.uvToPx(L[0], L[1]);
    const rx = L[2] * v.fw, ry = L[3] * v.fh;
    g.globalAlpha = Math.min(1, o * 1.5);
    // 세운 뚜껑 (물탱크에 기댐) — 열리며 위로 커짐
    const lh = ry * 2.3 * o, ly = p.y - ry * 0.3 - lh;
    let gr = g.createLinearGradient(p.x - rx, 0, p.x + rx, 0);
    gr.addColorStop(0, "#e9dcc2");
    gr.addColorStop(0.45, "#f8f0de");
    gr.addColorStop(1, "#dccdb0");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(p.x + rx * 0.02, ly + lh, rx * 0.86, lh, 0, Math.PI, 0);
    g.lineTo(p.x + rx * 0.88, p.y - ry * 0.2);
    g.lineTo(p.x - rx * 0.84, p.y - ry * 0.2);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(150,125,90,.45)";
    g.lineWidth = Math.max(1.5, rx * 0.025);
    g.stroke();
    // 뚜껑 안쪽 둥근 자국
    g.strokeStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.ellipse(p.x, ly + lh, rx * 0.66, lh * 0.75, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    // 변기 시트 (배경의 닫힌 뚜껑 윗면을 덮음)
    gr = g.createRadialGradient(p.x - rx * 0.3, p.y - ry * 0.6, ry * 0.2, p.x, p.y, rx * 1.05);
    gr.addColorStop(0, "#fffaf0");
    gr.addColorStop(0.7, "#f2e7d2");
    gr.addColorStop(1, "#ddcbab");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(p.x, p.y, rx + 2, ry + 2, 0, 0, 6.283);
    g.fill();
    // 물 (구멍)
    const wx = p.x + rx * 0.02, wy = p.y + ry * 0.06, wrx = rx * 0.66, wry = ry * 0.6;
    gr = g.createLinearGradient(0, wy - wry, 0, wy + wry);
    gr.addColorStop(0, "#c9b79a");
    gr.addColorStop(0.28, "#9fd4ef");
    gr.addColorStop(1, "#6fb8e2");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(wx, wy, wrx, wry, 0, 0, 6.283);
    g.fill();
    // 물 내림 소용돌이
    const sw = ctx.swirl || 0;
    if (sw > 0) {
      ctx._sa = (ctx._sa || 0) + dt * 9;
      g.save();
      g.beginPath();
      g.ellipse(wx, wy + wry * 0.1, wrx * 0.95, wry * 0.8, 0, 0, 6.283);
      g.clip();
      g.globalAlpha = Math.min(1, o * 1.5) * Math.min(1, sw * 2);
      g.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = k % 2 ? "rgba(255,255,255,.9)" : "rgba(60,150,215,.75)";
        g.lineWidth = Math.max(2, wry * 0.22);
        g.beginPath();
        for (let i = 0; i <= 20; i++) {
          const t = i / 20, an = ctx._sa + k * 2.1 + t * 4.5, rr = (1 - t * 0.85) * sw;
          const x = wx + Math.cos(an) * wrx * 0.85 * rr, y = wy + wry * 0.1 + Math.sin(an) * wry * 0.7 * rr;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.restore();
    }
    // 시트 안쪽 테두리 그림자·윤기
    g.globalAlpha = Math.min(1, o * 1.5);
    g.strokeStyle = "rgba(130,105,70,.45)";
    g.lineWidth = Math.max(1.5, ry * 0.12);
    g.beginPath();
    g.ellipse(wx, wy, wrx, wry, 0, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,.7)";
    g.lineWidth = Math.max(1.5, ry * 0.1);
    g.beginPath();
    g.ellipse(p.x, p.y, rx * 0.92, ry * 0.86, 0, Math.PI * 1.15, Math.PI * 1.55);
    g.stroke();
    g.globalAlpha = 1;
  },

  async next(ctx) {
    const U = KP.u,
      A = KP.audio,
      C = KP.care,
      S = ctx.S,
      st = ctx.st,
      P = ctx.P;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active && ctx.st === st && !st.dead;
    S.reset();
    ctx.track = null;
    ctx.onKid = null;
    ctx.lidOpen = 0;
    ctx.swirl = 0;
    ctx.pantsDown = 0;
    ctx.sit = false;
    ctx.stage = "enter";
    st.frontEl.style.visibility = "hidden";
    ctx.lever.classList.remove("down", "glow");
    ctx.strip.classList.remove("on", "fly");
    ctx.cookie.classList.remove("away", "glow");
    ctx.teddy.classList.remove("away", "glow");
    for (const k in ctx.hit) ctx.hit[k].classList.remove("glow");
    this.closeWash(ctx);
    const tall = () => st.w / st.h < 0.8;
    // 세로 화면 카메라: focusP 를 천천히 옮겨 무대 다시 맞춤
    let panTo = null;
    ctx.pan = (dt) => {
      if (panTo == null || !tall()) return;
      const f = ctx.BG.focusP, dx = panTo - f[0];
      if (Math.abs(dx) < 0.002) {
        f[0] = panTo;
        panTo = null;
      } else f[0] += dx * Math.min(1, dt * 3.2);
      st.resize(true);
    };
    const pan = (u) => {
      panTo = u;
    };
    ctx.BG.focusP[0] = 0.26;
    st.resize(true);

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
      act = await KP.dollActor.create2D(st, { species: "bear" });
    }
    if (!act) return;
    if (!live()) return act.dispose();
    ctx.actor = act;
    const G = (uv) => st.bc.ground(uv[0], uv[1]) || st.spot("x");
    const legK = (act.k && act.k.spec && act.k.spec.pivot && act.k.spec.pivot.leg) || 0.18;
    // 키: 변기 깊이에서 그림 높이의 0.4 (원근 때문에 앞쪽에서는 더 크게 보임) — 좁은 세로 화면은 0.32
    const sizeUp = () => {
      const g = G(P.seat);
      act.setH(st.fitH(g[0], g[1], ((tall() ? 0.32 : 0.4) * st.bc.view.fh) / st.h));
      return g;
    };
    sizeUp();
    /** 앉을 때 들어 올릴 높이: 엉덩이(다리 높이)가 시트 가운데에 오게 */
    const seatLift = () => {
      const g = G(P.seat), y0 = st.project(g[0], 0, g[1]).y, y1 = st.project(g[0], 1, g[1]).y;
      const sy = st.uvToPx(P.lid[0], P.lid[1] + 0.012).y;
      return (y0 - sy) / Math.max(1, y0 - y1) - legK * act.h;
    };
    st.onResize = () => {
      sizeUp();
      if (ctx.sit) {
        const g = G(P.seat);
        act.place(g[0], g[1]);
        act.lift = seatLift();
      }
    };
    const startG = G(tall() ? P.startP : P.start); // 세로 화면: 변기·쿠키·곰인형과 함께 보이게
    act.place(startG[0], startG[1]);
    act.mood("normal");

    /* ---------- 매 장면: 자리 맞추기 (누르는 곳·소품·바지·뒤 캔버스) ---------- */
    const box = (e, x0, y0, x1, y1) => Object.assign(e.style, { left: x0 + "px", top: y0 + "px", width: Math.max(1, x1 - x0) + "px", height: Math.max(1, y1 - y0) + "px" });
    const boxUV = (e, b, minPx = 70) => {
      const a = st.uvToPx(b[0], b[1]), c = st.uvToPx(b[2], b[3]);
      // 보이는 곳만 (세로 화면은 배경 양옆이 잘림) — 화면 밖이면 숨김
      let x0 = Math.max(0, a.x), y0 = Math.max(0, a.y), x1 = Math.min(st.w, c.x), y1 = Math.min(st.h, c.y);
      e.hidden = x1 - x0 < 24 || y1 - y0 < 24;
      // 너무 작으면 키움 (유아 손가락) — 화면 안쪽으로
      if (x1 - x0 < minPx) {
        if (x0 + minPx > st.w) x0 = x1 - minPx;
        else x1 = x0 + minPx;
      }
      if (y1 - y0 < minPx) (y0 -= (minPx - (y1 - y0)) / 2), (y1 = y0 + minPx);
      box(e, x0, y0, x1, y1);
    };
    const propAt = (e, spec, aspect) => {
      const v = st.bc.view, w = Math.max(80, spec[2] * v.fw), h = w / aspect, p = st.uvToPx(spec[0], spec[1]);
      const x = KP.u.clamp(p.x - w / 2, 8, st.w - w - 8); // 좁은 세로 화면: 보이는 곳 안으로
      box(e, x, p.y - h, x + w, p.y);
    };
    let wig = 0;
    ctx.track = (dt) => {
      const v = st.bc.view;
      for (const k of ["toilet", "flush", "paper", "sink"]) boxUV(ctx.hit[k], P.boxes[k]);
      // 물 내림 손잡이 (배경의 손잡이 위에 점토 손잡이를 겹침)
      const lp = st.uvToPx(P.lever[0], P.lever[1]), lw = 0.06 * v.fw, lh = lw * (211 / 239);
      box(ctx.lever, lp.x - lw * 0.6, lp.y - lh * 0.5, lp.x + lw * 0.4, lp.y + lh * 0.5);
      propAt(ctx.cookie, P.cookie, 252 / 219);
      propAt(ctx.teddy, P.teddy, 201 / 256);
      // 휴지 끝
      const sp = st.uvToPx(P.strip[0], P.strip[1]), sw = P.strip[2] * v.fw;
      box(ctx.strip, sp.x - sw / 2, sp.y, sp.x + sw / 2, sp.y + sw * 1.7);
      // 친구 누르는 곳(서 있으면 바지 둘레, 앉으면 윗몸) · 바지
      const b = act.box();
      const kr = act.anchor("kneeR"), kl = act.anchor("kneeL"), be = act.anchor("belly");
      const kx = (kr.x + kl.x) / 2, ky = (kr.y + kl.y) / 2;
      const pw = Math.max(Math.abs(kr.x - kl.x) * 2.3, b.w * 0.5), ph = pw * (226 / 256);
      const upY = be.y * 0.3 + ky * 0.7, dnY = b.b - ph * 0.42;
      const py = upY + (dnY - upY) * ctx.pantsDown;
      const pww = pw * (1 - 0.1 * ctx.pantsDown);
      // 앉으면 바지(발목)는 변기 앞면 뒤로 숨김
      ctx.pants.style.cssText = `width:${pww}px;height:${ph}px;transform:translate(${kx - pww / 2}px,${py - ph / 2}px);opacity:${ctx.sit ? 0 : 1}`;
      if (ctx.sit) box(ctx.hit.doll, b.l - 6, b.t, b.r + 6, b.t + b.h * 0.62);
      else {
        const hw = Math.max(pw * 0.75, 44);
        box(ctx.hit.doll, kx - hw, Math.min(upY, py) - ph * 0.75, kx + hw, Math.max(b.b, py + ph * 0.6));
      }
      // 꼼지락: 들썩들썩 + 좌우로
      if (ctx.stage === "wiggle") {
        wig += dt;
        act.play.sway = Math.sin(wig * 13) * 0.07;
        act.play.bob = Math.abs(Math.sin(wig * 6.5)) * 0.035;
        act.play.tilt = Math.sin(wig * 9) * 0.1;
      } else if (act.play.sway || act.play.bob || act.play.tilt) act.play.sway = act.play.bob = act.play.tilt = 0;
      this.drawBack(ctx, dt);
    };
    ctx.track(0);
    const dollTop = () => Math.max(56, act.box().t + act.box().h * 0.05);
    const dollCx = () => act.box().cx;
    const tween = (ms, f) =>
      new Promise((res) => {
        const t0 = performance.now();
        const step = () => {
          if (!live()) return res();
          const k = Math.min(1, (performance.now() - t0) / ms);
          f(k);
          if (k >= 1) res();
          else requestAnimationFrame(step);
        };
        step();
      });
    /** 폴짝: (x,z, 들어 올림) 로 — 가운데쯤 mid() */
    const hop = async (g, lift1, ms, mid) => {
      const a = act.a, x0 = a.x, z0 = a.z, l0 = act.lift || 0, hk = act.h * 0.28;
      let told = false;
      await tween(ms, (k) => {
        const e = k * k * (3 - 2 * k);
        act.place(x0 + (g[0] - x0) * e, z0 + (g[1] - z0) * e);
        act.lift = l0 + (lift1 - l0) * e + Math.sin(Math.PI * k) * hk;
        if (!told && k > 0.5) (told = true), mid && mid();
      });
      act.lift = lift1;
      if (act.a) act.a.sqv = 5;
    };
    const walk = async (uv) => {
      const g = G(uv);
      await Promise.race([act.walkTo(g[0], g[1], 1.4), ctx.wait(4000)]);
      if (live()) act.place(g[0], g[1]);
    };
    // 점검용
    ctx.ptState = () => ({ tok, stage: ctx.stage, gl: !!st.gl, painted: !!act.painted, who: act.name, sit: ctx.sit, lid: ctx.lidOpen, pants: ctx.pantsDown, front: st.frontEl.style.visibility, washing: ctx.wash.classList.contains("on"), swirl: ctx.swirl, focus: ctx.BG.focusP[0] });
    ctx.ptRect = (k) => {
      const e = k === "lever" ? ctx.lever : k === "cookie" || k === "teddy" ? ctx[k] : ctx.hit[k];
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    };

    /* ---------- 1) 꼼지락 신호 → 어디로 갈까? (장면 속 물건 3개) ---------- */
    await ctx.wait(400);
    if (!live()) return;
    ctx.stage = "wiggle";
    C.pop(ctx, ctx.scene, dollCx(), dollTop(), "꼼지락");
    A.tone(520, { to: 640, dur: 0.12, vol: 0.1, type: "triangle" });
    const ac = window.AbortController ? new AbortController() : null;
    let done = false;
    // 물건은 바로 누를 수 있음 (말이 끝나기 전에 눌러도 됨)
    ctx.after(900, () => live() && !done && ctx.say("어? 친구가 꼼지락꼼지락! 어디에 가야 할까요?"));
    const picked = await new Promise((res) => {
      const right = () => {
        if (done || !live()) return;
        done = true;
        res(true);
      };
      const wrong = (el) => {
        if (done || !live()) return;
        ctx.miss(el, "음, 배가 신호를 보내는 것 같아요!");
        A.tone(400, { to: 300, dur: 0.15, vol: 0.1 });
      };
      const on = (el, f) => el.addEventListener("click", () => (KP.audio.unlock(), f(el)), ac ? { signal: ac.signal } : false);
      on(ctx.hit.toilet, right);
      on(ctx.hit.flush, right);
      on(ctx.cookie, wrong);
      on(ctx.teddy, wrong);
      if (lv === 1) {
        ctx._hinted = true; // 안내 단계: 정답이 반짝
        ctx.hit.toilet.classList.add("glow");
      }
      ctx.hint(() => ctx.hit.toilet, "화장실을 눌러요!");
    });
    if (ac) ac.abort();
    if (!picked || !live()) return;
    ctx.hint(null);
    ctx.hit.toilet.classList.remove("glow");
    A.sfx("good");
    ctx.cookie.classList.add("away");
    ctx.teddy.classList.add("away");
    ctx.stage = "walk";
    KP.voice.say("응가가 마려운가 봐요! 화장실에 가요!");
    pan(0.2);
    await walk(P.front);
    if (!live()) return;
    act.a.yaw = 0;

    /* ---------- 2) 순서대로 (장면 속 물건) ---------- */
    const TOOLS = [
      { id: "pants", el: ctx.hit.doll },
      { id: "toilet", el: ctx.hit.toilet },
      { id: "paper", el: ctx.hit.paper },
      { id: "flush", el: ctx.hit.flush },
      { id: "wash", el: ctx.hit.sink },
    ];
    const pantsTo = (to) => {
      const from = ctx.pantsDown;
      A.sfx("slide");
      return tween(450, (k) => (ctx.pantsDown = from + (to - from) * k));
    };
    const steps = [
      {
        tool: "pants",
        say: "먼저 바지를 내려요!",
        act: async () => {
          ctx.stage = "pants";
          await pantsTo(1);
          C.pop(ctx, ctx.scene, dollCx(), act.box().b - act.box().h * 0.3, "쓱");
          await ctx.wait(350);
        },
      },
      {
        tool: "toilet",
        say: "변기에 앉아요!",
        act: async () => {
          ctx.stage = "sit";
          // 뚜껑이 열림
          A.tone(700, { to: 900, dur: 0.08, vol: 0.12, type: "triangle" });
          await tween(380, (k) => (ctx.lidOpen = k));
          if (!live()) return;
          await ctx.wait(150);
          A.sfx("boing");
          await hop(G(P.seat), seatLift(), 650, () => {
            ctx.sit = true;
            st.frontEl.style.visibility = "visible"; // 변기 앞면이 아랫몸을 가림
          });
          if (!live()) return;
          act.a.yaw = 0;
          await ctx.wait(300);
        },
      },
      {
        auto: true,
        act: () =>
          new Promise((res) => {
            let n = 0;
            ctx.stage = "push";
            ctx.say("끙끙 힘을 줘요! 친구를 콕콕 눌러요!");
            ctx.hit.doll.classList.add("glow");
            ctx.hint(() => ctx.hit.doll, "친구를 콕콕 눌러요!");
            ctx.onKid = () => {
              if (n >= 3 || !live()) return;
              n++;
              act.react("belly", 0.05);
              act.mood(n < 3 ? "pain" : "happy");
              A.tone(220 - n * 20, { to: 180 - n * 20, dur: 0.18, vol: 0.18 });
              C.pop(ctx, ctx.scene, dollCx() + U.randf(-20, 20), dollTop(), "끙!");
              if (n < 3) return;
              ctx.onKid = null;
              ctx.hit.doll.classList.remove("glow");
              ctx.hint(null);
              ctx.after(600, () => {
                A.sfx("drop");
                const lp = st.uvToPx(P.lid[0], P.lid[1]);
                C.pop(ctx, ctx.scene, lp.x + act.box().w * 0.6, lp.y, "퐁당!", true);
                ctx.after(700, () => {
                  KP.voice.say("시원하다!");
                  act.happy();
                  const b = act.box();
                  S.burst(b.cx, b.t + b.h * 0.3, 18, "star", 0.8);
                  A.sfx("sparkle");
                  ctx.after(900, () => {
                    act.mood("normal");
                    ctx.stage = "pushed";
                    res();
                  });
                });
              });
            };
          }),
      },
      {
        tool: "paper",
        say: "휴지로 쓱쓱 닦아요!",
        act: async () => {
          ctx.stage = "paper";
          // 휴지가 쭉 → 친구에게 날아가 쓱쓱
          ctx.strip.classList.remove("fly");
          ctx.strip.classList.add("on");
          A.noise({ dur: 0.35, vol: 0.08, bp: 2400, q: 1 });
          await ctx.wait(500);
          if (!live()) return;
          const sr = ctx.strip.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect(), b = act.box();
          ctx.strip.classList.add("fly");
          ctx.strip.style.transform = `translate(${b.cx - (sr.left - hr.left + sr.width / 2)}px,${b.t + b.h * 0.65 - (sr.top - hr.top)}px) scale(.6)`;
          for (let i = 0; i < 3; i++) ctx.after(300 + i * 220, () => A.sfx("rub"));
          C.pop(ctx, ctx.scene, dollCx(), dollTop(), "쓱쓱");
          await ctx.wait(900);
          ctx.strip.classList.remove("on", "fly");
          ctx.strip.style.transform = "";
        },
      },
      {
        tool: "pants",
        say: "일어나서 바지를 올려요!",
        act: async () => {
          ctx.stage = "stand";
          A.sfx("boing");
          await hop(G(P.front), 0, 600, () => {
            ctx.sit = false;
            st.frontEl.style.visibility = "hidden";
          });
          if (!live()) return;
          await pantsTo(0);
          C.pop(ctx, ctx.scene, dollCx(), act.box().b - act.box().h * 0.45, "쑥");
          await ctx.wait(350);
        },
      },
      {
        tool: "flush",
        say: "물을 내려요!",
        act: async () => {
          ctx.stage = "flush";
          ctx.lever.classList.add("down");
          A.tone(500, { to: 300, dur: 0.1, vol: 0.12, type: "triangle" });
          ctx.after(260, () => ctx.lever.classList.remove("down"));
          A.noise({ dur: 1.4, vol: 0.16, bp: 700, bpTo: 250, q: 0.8, attack: 0.1 });
          const lp = st.uvToPx(P.lid[0], P.lid[1]);
          C.pop(ctx, ctx.scene, lp.x, Math.max(50, lp.y - st.bc.view.fh * 0.2), "쏴아~");
          await tween(1500, (k) => (ctx.swirl = Math.sin(Math.PI * Math.min(1, k * 1.15))));
          ctx.swirl = 0;
          if (!live()) return;
          // 뚜껑 닫기
          await tween(300, (k) => (ctx.lidOpen = 1 - k));
          A.tone(900, { to: 700, dur: 0.08, vol: 0.1, type: "triangle" });
          if (!live()) return;
          // 가운데로 나옴 (세로 화면은 카메라도 따라가 세면대가 보이게)
          pan(0.72);
          await walk(P.mid);
          if (live()) act.a.yaw = 0;
        },
      },
      {
        tool: "wash",
        say: "마지막으로 손을 뽀득뽀득 씻어요!",
        act: async () => {
          ctx.stage = "towash";
          pan(0.83);
          await walk(P.sink);
          if (!live()) return;
          act.a.yaw = 0;
          await this.washMini(ctx, live);
          if (!live()) return;
          act.happy();
          const b = act.box();
          S.burst(b.cx, b.t + b.h * 0.35, 26, "star", 1);
          KP.pfx.hearts(ctx.scene, b.cx, b.t + b.h * 0.1, 4, ctx);
          A.sfx("sparkle");
          await ctx.wait(600);
        },
      },
    ];
    const ok = await C.routine(ctx, { bar: ctx._bar || (ctx._bar = U.el("div", "kc-bar")), tools: TOOLS, steps, mode: lv, ask: lv === 2 ? "화장실에 왔어요! 먼저 뭘 할까요?" : lv === 3 ? "혼자서 해 볼까요?" : null });
    if (!ok || !live()) return;
    ctx.stage = "done";
    ctx.score.add();
    ctx.round++;
    const big = ctx.round % 4 === 0;
    const msg = big ? "화장실 가고 싶으면 말해 줘요!" : U.pick(["응가 끙끙, 시원하다!", "{부름} 화장실 박사!", "혼자서도 잘해요!"]);
    const r = await ctx.win({ big, msg });
    if (r && live()) this.next(ctx);
  },

  /** 세면대 가까이 보기: 수도꼭지 누르기 → 거품 손 문지르기 → 헹굼 (손 씻기 놀이의 세면대·손 그림을 짧게) */
  async washMini(ctx, live) {
    const U = KP.u, A = KP.audio, C = KP.care, W2 = ctx.W2, ov = ctx.wash;
    // 손 모양 (한 번만)
    if (!ctx.palm) {
      const im = await new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = ctx.HW + "palms.png";
      });
      if (!live()) return;
      if (im) ctx.palm = { a: im.naturalWidth / im.naturalHeight, shape: C.shapeOf(im, 300, Math.round((300 * im.naturalHeight) / im.naturalWidth)) };
    }
    if (ctx.wst) ctx.wst.dispose();
    const wst = (ctx.wst = KP.clayStage.create(ov, ctx.HWBG, { flat: true }));
    const layout = () => {
      if (!wst.bc) return;
      const W = wst.w, H = wst.h, v = wst.bc.view, Pp = (u, vv) => wst.uvToPx(u, vv);
      const put = (e, x, y, w, h) => Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      ctx.TAPBOX.forEach((b, i) => {
        const p = Pp(b[0], b[1]);
        put(ctx.wTaps[i], p.x, p.y, b[2] * v.fw, b[3] * v.fh);
      });
      const a = Pp(0.352, 0.3), b = Pp(0.635, 0.56);
      put(ctx.wFaucet, Math.max(2, a.x), a.y, Math.min(W - 2, b.x) - Math.max(2, a.x), b.y - a.y);
      const spout = Pp(0.521, 0.494), pa = ctx.palm ? ctx.palm.a : 1.6;
      const maxW = W / H < 0.8 ? W * 0.7 : W * 0.86;
      let top = spout.y + H * (H < 450 ? 0.04 : 0.1), h = H * 1.04 - top, w = h * pa;
      if (w > maxW) {
        w = maxW;
        h = w / pa;
        top = H * 1.04 - h;
      }
      const x = U.clamp(spout.x - w / 2, W * 0.04, W * 0.96 - w);
      ctx.wF = { x, y: top, w, h };
      put(ctx.wHands, x, top, w, h);
      const sw = Math.max(14, v.fw * 0.032);
      put(ctx.wStream, spout.x - sw / 2, spout.y - 3, sw, Math.max(24, top + h * 0.34 - spout.y));
    };
    wst.onResize = layout;
    layout();
    W2.reset();
    W2.dropSkin();
    if (ctx.palm) W2.setSkin(ctx.palm.shape);
    ov.classList.remove("water", "rubbing");
    ov.classList.add("on");
    await ctx.wait(400);
    if (!live()) return;
    // 수도꼭지
    ctx.say("수도꼭지를 눌러 물을 틀어요!");
    ctx.wFaucet.classList.add("glow");
    ctx.hint(() => ctx.wFaucet, "수도꼭지를 눌러 물을 틀어요!");
    await new Promise((res) => (ctx.onFaucet = () => ((ctx.onFaucet = null), res())));
    if (!live()) return;
    ctx.hint(null);
    ctx.wFaucet.classList.remove("glow");
    ov.classList.add("water");
    A.tone(480, { to: 900, dur: 0.16, vol: 0.12, type: "triangle" });
    let wet = true;
    const drip = () => {
      if (!wet || !live()) return;
      A.sfx("water");
      ctx.after(330, drip);
    };
    drip();
    for (let i = 0; i < 3; i++) {
      await ctx.wait(250);
      if (!live()) return;
      W2.skinFill("wet", 0.35);
    }
    // 거품 → 문지르기
    A.sfx("bubble");
    for (const [u, v] of [[0.27, 0.6], [0.73, 0.6]]) for (let k = 0; k < 4; k++) W2.skinDab("foam", u + U.randf(-0.05, 0.05), v + U.randf(-0.06, 0.06), 0.08);
    const F = () => ctx.wF;
    const pts = ctx.palm ? C.ptsIn(ctx.palm.shape, 8, 0.03) : [{ x: 0.3, y: 0.6 }, { x: 0.7, y: 0.6 }];
    ctx.ptWashPts = () => pts.map((p) => {
      const r = ov.getBoundingClientRect();
      return { x: r.left + F().x + p.x * F().w, y: r.top + F().y + p.y * F().h };
    });
    await new Promise((res) => {
      W2.reset(true);
      W2.add(pts.map((p) => ({ zone: "rub", x: p.x, y: p.y, need: 1.3 })));
      W2.mode = { foam: true };
      W2.need = 0.75;
      W2.sound = () => A.sfx("rub");
      ctx.say("거품을 싹싹 문질러요!");
      ctx.hint(() => {
        const r = ov.getBoundingClientRect();
        return { x: r.left + F().x + F().w / 2, y: r.top + F().y + F().h * 0.45 };
      }, "거품을 싹싹 문질러요!");
      ov.classList.add("rubbing");
      W2.on = true;
      W2.onZone = () => {
        W2.on = false;
        ov.classList.remove("rubbing");
        ctx.hint(null);
        res();
      };
    });
    if (!live()) return;
    // 헹굼 (물줄기 아래에서 자동으로)
    W2.skinFade("foam");
    const cx = F().x + F().w / 2;
    for (let i = 0; i < 6; i++) ctx.after(i * 120, () => W2.burst(cx + U.randf(-F().w * 0.25, F().w * 0.25), F().y + F().h * 0.5, 4, "drop", 0.6));
    C.pop(ctx, ov, cx, F().y + F().h * 0.1, "쏴아");
    await ctx.wait(800);
    if (!live()) return;
    wet = false;
    ov.classList.remove("water");
    A.tone(900, { to: 480, dur: 0.16, vol: 0.12, type: "triangle" });
    W2.skinFade("wet");
    W2.burst(cx, F().y + F().h * 0.4, 22, "star", 1);
    A.sfx("sparkle");
    C.pop(ctx, ov, cx, F().y + F().h * 0.1, "뽀득뽀득");
    await ctx.wait(800);
    if (!live()) return;
    ov.classList.remove("on");
    await ctx.wait(380);
    this.closeWash(ctx);
  },
});
