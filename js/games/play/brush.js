/* 치카치카 양치 — 입을 크게 벌린 점토 하마(그림)의 이를 점토 칫솔로 닦아요
   - 이 12개(위 6 · 아래 6)의 자리는 그림에 맡기지 않고 코드 데이터(TEETH, 그림 px 사각형)로 정함 → 화면 크기와 상관없이 제자리
   - 이 모양을 '표면 마스크'(KP.care setSkin)로 넘겨: 누런 막·치석(dirt)·치약 거품(foam)은 이 안에서만 생기고 문지른 자리만 지워짐
     → 문지른 이만 하얗게 밝아짐. 세균·얼룩 친구(점토 그림)는 문지르면 작아지다 '뿅'. 이 하나가 다 깨끗하면 반짝 광택 + 별
   - 구역 4곳: 위 앞니 · 아래 앞니 · 위 안쪽 이 · 아래 안쪽 이 (구역마다 85% 닦으면 반짝) — 문지른 거리로 지워짐(톡 누르기로는 안 지워짐)
   - 흐름: 치약 꾹(장면 속 치약을 누름) → 칫솔로 치카치카 → 컵을 누르면 물을 머금고 볼이 부풀었다(웃는 하마 그림 + 살짝 늘이기) '퉤!' → 웃는 하마
   - 단계: 1 한 구역씩(안내) → 2 세 구역을 차례로(안내) → 3 네 구역 안내 없이 골고루(멈추면 덜 닦인 곳이 반짝). 시간 제한 없음
   - 아이가 칠한 인형 친구(정면 그림)가 옆에서 작은 칫솔로 따라 하며 응원
   공통 도우미: js/games/play/_care.js (KP.care) */
"use strict";
KP.game({
  id: "brush",
  icon: "🪥",
  name: "치카치카 양치",
  cat: "play",
  levels: 3,
  score: "🦷",
  setup(ctx) {
    const U = KP.u;
    const IMG = (ctx.IMG = "assets/play-clay/brush/");
    KP.care.css();
    KP.css("brush", `
      .br-scene{background:#acd5f0}
      .br-face{position:absolute;left:0;top:0;z-index:1;pointer-events:none;transform-origin:50% 72%;transition:transform .35s cubic-bezier(.3,1.5,.5,1)}
      .br-face img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;transition:opacity .25s}
      .br-face .smile{opacity:0}
      .br-face.closed .smile{opacity:1}
      .br-face.puff{animation:br-puff .5s ease-in-out infinite alternate}
      @keyframes br-puff{from{transform:scale(1.06,1.01)}to{transform:scale(1.11,1.02)}}
      .br-face.pop{animation:br-pt .45s ease-out}
      @keyframes br-pt{30%{transform:scale(.95,1.05)}70%{transform:scale(1.02,.99)}}
      .br-shine{position:absolute;left:0;top:0;width:100%;height:100%;z-index:2;pointer-events:none}
      .br-water{position:absolute;z-index:3;pointer-events:none;border-radius:50%;overflow:hidden;opacity:0;transition:opacity .3s}
      .br-water i{position:absolute;left:0;right:0;bottom:0;height:0;transition:height .8s ease;
        background:linear-gradient(rgba(190,230,255,.55),rgba(110,185,240,.6));box-shadow:inset 0 6px 8px rgba(255,255,255,.6)}
      .br-water i{border-radius:45% 45% 0 0/14% 14% 0 0}
      .br-water.on{opacity:1}
      .br-shelf{position:absolute;left:0;top:0;z-index:4;pointer-events:none;border-radius:999px;
        background:linear-gradient(#fff6e6,#f1dfc2 55%,#dcc3a0);box-shadow:0 6px 8px rgba(60,70,110,.25),inset 0 2px 0 rgba(255,255,255,.8)}
      .br-water.on i{height:62%}
      .br-obj{position:absolute;left:0;top:0;z-index:6;touch-action:manipulation;cursor:pointer;transition:transform .55s cubic-bezier(.4,0,.3,1),opacity .3s}
      .br-obj img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 6px 5px rgba(40,60,90,.28))}
      .br-obj.glow img{animation:br-glow 1.1s ease-in-out infinite alternate}
      @keyframes br-glow{from{filter:drop-shadow(0 6px 5px rgba(40,60,90,.28))}to{filter:drop-shadow(0 0 10px rgba(255,205,40,1)) drop-shadow(0 0 3px #fff)}}
      .br-obj.press img{animation:br-press .35s ease-out}
      @keyframes br-press{40%{transform:scale(1.08,.8)}}
      .br-obj.off{opacity:0;pointer-events:none}
      .br-rest{pointer-events:none}
      .br-rest .paste,.kc-tool .paste{position:absolute;width:24%;height:13%;border-radius:50% 50% 45% 45%;opacity:0;transition:opacity .2s;
        background:linear-gradient(180deg,#fff 0 40%,#9fd3ff 40% 60%,#ff9fbf 60% 80%,#fff 80%);box-shadow:0 2px 2px rgba(0,0,0,.15)}
      .br-rest .paste{left:72%;top:4%;transform:rotate(42deg)}
      .br-rest.pasted .paste,.kc-tool .br-tb.pasted .paste{opacity:1}
      .kc-tool .br-tb{position:relative;width:100%;height:100%}
      .kc-tool .br-tb img{position:absolute;width:170%;height:auto;left:-89%;top:-9%;transform:none;filter:drop-shadow(0 6px 5px rgba(0,0,0,.25))}
      .kc-tool .br-tb .paste{left:30%;top:24%;transform:rotate(42deg)}
      .br-pal{position:absolute;left:0;top:0;z-index:6;pointer-events:none;transition:opacity .3s}
      .br-pal>img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 6px 5px rgba(40,60,90,.3))}
      .br-pal.hop>img{animation:br-hop .5s ease-in-out 2}
      @keyframes br-hop{50%{transform:translateY(-14%) scale(1.04)}}
      .br-pal .mini{position:absolute;left:58%;top:34%;width:46%;height:46%;transform-origin:20% 80%;transform:rotate(-20deg)}
      .br-pal .mini img{width:100%;height:100%;object-fit:contain;display:block}
      .br-pal.go .mini{animation:br-mini .22s ease-in-out infinite alternate}
      @keyframes br-mini{from{transform:rotate(-34deg) translateX(-6%)}to{transform:rotate(-8deg) translateX(6%)}}
      .br-scene .kc-zone{border:0;border-radius:22px;background:rgba(255,246,190,.16)}
      .br-scene .kc-zone.on{animation:br-zone 1.2s ease-in-out infinite alternate}
      @keyframes br-zone{from{box-shadow:0 0 0 3px rgba(255,215,70,.35),0 0 14px 4px rgba(255,235,140,.25)}to{box-shadow:0 0 0 6px rgba(255,215,70,.8),0 0 22px 10px rgba(255,240,160,.5)}}
      .br-star{position:absolute;left:0;top:0;z-index:7;pointer-events:none;width:var(--s);height:var(--s);margin:calc(var(--s)*-.5) 0 0 calc(var(--s)*-.5);animation:br-star 1s ease-out forwards}
      .br-star img{width:100%;height:100%;display:block}
      @keyframes br-star{0%{transform:scale(.2) rotate(-20deg);opacity:0}30%{transform:scale(1.15) rotate(8deg);opacity:1}100%{transform:translateY(-40%) scale(.8) rotate(0);opacity:0}}
      .br-load{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:9;background:rgba(255,255,255,.85);border-radius:999px;padding:.4em 1em;font-size:22px}
    `);
    const scene = (ctx.scene = U.el("div", "kc-scene br-scene"));
    ctx.body.appendChild(scene);
    const mk = (cls, html = "", tag = "div") => {
      const e = U.el(tag, cls, html);
      scene.appendChild(e);
      return e;
    };
    ctx.face = mk("br-face", '<img alt="" class="open" draggable="false" src="' + IMG + 'open.jpg"><img alt="" class="smile" draggable="false" src="' + IMG + 'smile.jpg">');
    ctx.shine = mk("br-shine", "", "canvas");
    ctx.water = mk("br-water", "<i></i>");
    ctx.shelf = mk("br-shelf");
    ctx.S = KP.care.surface(ctx, scene, { frame: () => ctx.F, pass: true });
    ctx.tube = mk("br-obj br-tube", '<img alt="" draggable="false" src="' + IMG + 'paste.png">');
    ctx.tube.setAttribute("aria-label", "치약");
    ctx.rest = mk("br-obj br-rest", '<img alt="" draggable="false" src="' + IMG + 'brush.png"><i class="paste"></i>');
    ctx.cup = mk("br-obj br-cup", '<img alt="" draggable="false" src="' + IMG + 'cup.png">');
    ctx.cup.setAttribute("aria-label", "컵");
    ctx.pal = mk("br-pal", '<img alt=""><span class="mini"><img alt="" src="' + IMG + 'brush.png"></span>');
    ctx.tube.addEventListener("click", () => ctx.onTube && ctx.onTube());
    ctx.cup.addEventListener("click", () => ctx.onCup && ctx.onCup());
    ctx.zoneEls = {};
    ctx.F = { x: 0, y: 0, w: 1, h: 1 };
    // 그림(1344×752) 기준 자리. 입 틀(MOUTH) 안에서 이 사각형(시계 방향 4꼭짓점, 그림 px) — tools/out/teeth-measure.js 로 잰 값
    ctx.IW = 1344;
    ctx.IH = 752;
    ctx.MOUTH = { x: 395, y: 380, w: 550, h: 320 };
    const UP = [
      [[418, 409], [486, 417], [482, 456], [414, 448]],
      [[496, 408], [571, 410], [570, 452], [495, 450]],
      [[581, 404], [666, 404], [666, 450], [581, 450]],
      [[680, 403], [766, 403], [766, 450], [680, 450]],
      [[774, 408], [849, 406], [850, 450], [775, 451]],
      [[853, 414], [923, 406], [928, 449], [858, 457]],
    ];
    const LO = [
      [[471, 538], [518, 598], [477, 629], [431, 569]],
      [[509, 588], [582, 617], [560, 670], [488, 640]],
      [[579, 613], [663, 624], [655, 682], [572, 672]],
      [[663, 622], [746, 617], [749, 677], [666, 681]],
      [[742, 620], [819, 590], [840, 646], [763, 676]],
      [[865, 544], [904, 581], [847, 641], [808, 605]],
    ];
    const M = ctx.MOUTH;
    const norm = (q) => q.map(([x, y]) => [(x - M.x) / M.w, (y - M.y) / M.h]);
    ctx.TEETH = [];
    UP.forEach((q, i) => ctx.TEETH.push({ row: "u", i, back: i === 0 || i === 5, q: norm(q) }));
    LO.forEach((q, i) => ctx.TEETH.push({ row: "l", i, back: i === 0 || i === 5, q: norm(q) }));
    for (const t of ctx.TEETH) {
      const xs = t.q.map((p) => p[0]), ys = t.q.map((p) => p[1]);
      t.x = Math.min(...xs);
      t.y = Math.min(...ys);
      t.w = Math.max(...xs) - t.x;
      t.h = Math.max(...ys) - t.y;
      // 사각형 안 점 (u: 첫 변 방향, v: 둘째 변 방향 0~1)
      t.at = (u, v) => {
        const [a, b, c, d] = t.q;
        const tx = a[0] + (b[0] - a[0]) * u, ty = a[1] + (b[1] - a[1]) * u, bx = d[0] + (c[0] - d[0]) * u, by = d[1] + (c[1] - d[1]) * u;
        return { x: tx + (bx - tx) * v, y: ty + (by - ty) * v };
      };
    }
    const T = ctx.TEETH;
    ctx.ZONES = {
      uf: { say: "위쪽 앞니를 치카치카!", teeth: T.filter((t) => t.row === "u" && !t.back) },
      lf: { say: "아래쪽 앞니를 치카치카!", teeth: T.filter((t) => t.row === "l" && !t.back) },
      ub: { say: "위쪽 안쪽 이를 닦아요!", teeth: T.filter((t) => t.row === "u" && t.back) },
      lb: { say: "아래쪽 안쪽 이를 닦아요!", teeth: T.filter((t) => t.row === "l" && t.back) },
    };
    // 이 모양 (표면 마스크) — 틀(MOUTH) 비율의 작은 캔버스
    ctx.shape = (() => {
      const c = document.createElement("canvas");
      c.width = 300;
      c.height = Math.round((300 * M.h) / M.w);
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.strokeStyle = "#fff";
      g.lineJoin = "round";
      g.lineWidth = 3;
      for (const t of T) {
        g.beginPath();
        t.q.forEach(([x, y], i) => (i ? g.lineTo(x * c.width, y * c.height) : g.moveTo(x * c.width, y * c.height)));
        g.closePath();
        g.fill();
        g.stroke();
      }
      return c;
    })();
    // 소품 그림 (캔버스에 그릴 것)
    ctx.PIC = {};
    for (const k of ["germ", "stain", "star"]) {
      const im = new Image();
      im.src = IMG + k + ".png";
      ctx.PIC[k] = im;
    }
    ctx.token = 0;
  },

  /** 자리 잡기: 하마 그림을 화면에 맞춰 놓고(입이 잘리지 않게, 가능하면 얼굴 전체), 입 틀 F 와 소품 자리 계산 */
  layout(ctx) {
    const U = KP.u, sc = ctx.scene, W = sc.clientWidth, H = sc.clientHeight;
    if (!W || !H) return;
    const IW = ctx.IW, IH = ctx.IH, M = ctx.MOUTH;
    const tall = W / H < 1.05;
    let s = U.clamp(Math.min(W, H) * 0.19, 70, 140);
    const m = Math.max(6, s * 0.08);
    const kv = H / IH, kw = (0.97 * W) / 545, kl = H < 500 ? (0.8 * H) / 320 : 0;
    // 세로 화면: 위에 소품 선반 자리를 남김 (얼굴은 아래에 붙임)
    let k = tall ? Math.min(kw, (H - s * 1.2 - m * 2) / IH) : Math.min(kw, Math.max(kv, kl));
    const iw = IW * k, ih = IH * k;
    let ox = W / 2 - 670 * k;
    ox = iw > W ? U.clamp(ox, W - iw, 0) : (W - iw) / 2;
    const oy = ih >= H ? U.clamp(H / 2 - 540 * k, H - ih, 0) : H - ih;
    ctx.view = { k, ox, oy, iw, ih, W, H };
    Object.assign(ctx.face.style, { left: ox + "px", top: oy + "px", width: iw + "px", height: ih + "px" });
    ctx.F = { x: ox + M.x * k, y: oy + M.y * k, w: M.w * k, h: M.h * k };
    const F = ctx.F;
    // 물 (입 안)
    Object.assign(ctx.water.style, { left: ox + 420 * k + "px", top: oy + 395 * k + "px", width: 500 * k + "px", height: 290 * k + "px" });
    // 구역 표시 (이 묶음마다)
    for (const key in ctx.ZONES) {
      (ctx.zoneEls[key] || []).forEach((e) => e.remove());
      const z = ctx.ZONES[key];
      const groups = z.teeth.every((t) => !t.back) ? [z.teeth] : z.teeth.map((t) => [t]);
      ctx.zoneEls[key] = groups.map((gr) => {
        const x0 = Math.min(...gr.map((t) => t.x)), x1 = Math.max(...gr.map((t) => t.x + t.w)), y0 = Math.min(...gr.map((t) => t.y)), y1 = Math.max(...gr.map((t) => t.y + t.h));
        const e = U.el("div", "kc-zone");
        const pad = 6;
        e.style.cssText = `left:${F.x + x0 * F.w - pad}px;top:${F.y + y0 * F.h - pad}px;width:${(x1 - x0) * F.w + pad * 2}px;height:${(y1 - y0) * F.h + pad * 2}px`;
        sc.appendChild(e);
        return e;
      });
    }
    if (ctx.glowZone) this.showZone(ctx, ctx.glowZone);
    // 소품: 넓은 화면은 얼굴 양옆(파란 하늘), 세로 화면은 위쪽 틈
    const put = (e, x, y, w, h) => Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    const gap = Math.max(0, oy);
    ctx.shelf.hidden = !tall;
    if (tall) {
      // 점토 선반 (얼굴 그림 윗변을 가림) 위에 친구·칫솔·치약·컵
      const sh = U.clamp(s * 0.17, 12, 24), sy = gap - sh * 0.55;
      put(ctx.shelf, -4, sy, W + 8, sh);
      if (sy > s * 2) s = Math.min(130, sy * 0.62, (W - m * 5) / 4.3); // 위 틈이 넓으면 소품도 크게
      const base = sy + 3;
      const ps = Math.min(sy - m, s * 1.5);
      put(ctx.pal, m, base - ps, ps, ps);
      put(ctx.cup, W - s * 0.92 - m, base - s, s * 0.92, s);
      put(ctx.tube, W - s * 0.92 - m - s * 1.05, base - s * 0.9, s, s);
      put(ctx.rest, W - s * 0.92 - m - s * 2.05, base - s * 0.92, s * 0.95, s * 0.95);
    } else {
      const ps = Math.min(s * 1.25, H * 0.34);
      put(ctx.pal, m, H - ps - m, ps, ps);
      put(ctx.tube, m, m, s, s);
      put(ctx.rest, m + s * 0.15, m + s * 1.05, s * 0.95, s * 0.95);
      put(ctx.cup, W - s * 0.92 - m, H - s - m, s * 0.92, s);
    }
    ctx.S.radius = 0.062;
    ctx.S.setTool('<div class="br-tb' + (ctx.pasted ? " pasted" : "") + '"><img alt="" src="' + ctx.IMG + 'brush.png"><i class="paste"></i></div>', F.w * 0.2);
    ctx.cupHome = { x: parseFloat(ctx.cup.style.left), y: parseFloat(ctx.cup.style.top) };
  },
  showZone(ctx, k) {
    ctx.glowZone = k;
    for (const z in ctx.zoneEls) ctx.zoneEls[z].forEach((e) => e.classList.toggle("on", z === k));
  },

  async start(ctx) {
    ctx.round = 0;
    const tok = ++ctx.token;
    const run = (ctx.runId = (ctx.runId || 0) + 1); // 이 화면에 들어온 한 번 (판마다 바뀌는 token 과 따로)
    const wait = KP.u.el("div", "br-load", KP.E("🪥"));
    const wt = ctx.after(400, () => ctx.scene.appendChild(wait));
    // 응원하는 인형 친구: 아이가 칠한 인형(정면 그림) → 없으면 기본 인형
    const dolls = await KP.dollActor.painted();
    if (tok !== ctx.token || !ctx._active) return;
    const it = dolls.length ? KP.u.pick(dolls) : null;
    ctx.pal.firstChild.src = (it && KP.safeImg(it.thumb)) || KP.DOLL.thumbUrl(KP.u.pick(KP.DOLL.ORDER || ["bear"]));
    ctx.palPainted = !!it;
    // 그림이 다 와야 자리·모양이 맞음
    await Promise.all([...ctx.face.querySelectorAll("img"), ...Object.values(ctx.PIC)].map((im) => (im.complete ? 0 : new Promise((r) => (im.onload = im.onerror = r)))));
    ctx.cancel(wt);
    wait.remove();
    if (tok !== ctx.token || !ctx._active) return;
    // 바탕색 = 그림 가장자리 하늘색 (그림이 화면보다 좁거나 볼이 부풀 때 이음매가 안 보이게)
    if (!ctx._bgSet)
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 1;
        const g = c.getContext("2d");
        g.drawImage(ctx.face.firstChild, 8, 8, 4, 4, 0, 0, 1, 1);
        const d = g.getImageData(0, 0, 1, 1).data;
        ctx.scene.style.background = "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
        ctx._bgSet = true;
      } catch (e) {}
    if (!ctx._ro && window.ResizeObserver) (ctx._ro = new ResizeObserver(() => ctx._active && this.layout(ctx))).observe(ctx.scene);
    this.layout(ctx);
    ctx.S.run();
    // 반짝 광택 (깨끗해진 이) · 따라 하기 친구 — 매 장면
    ctx.loop((dt) => {
      if (run !== ctx.runId) return false;
      this.drawShine(ctx, dt);
      ctx.pal.classList.toggle("go", ctx.S.toolEl.classList.contains("on"));
      ctx.rest.classList.toggle("off", ctx.S.toolEl.classList.contains("on") || !ctx.restOn);
    });
    this.next(ctx);
  },
  stop(ctx) {
    ctx.token++;
    ctx.runId = (ctx.runId || 0) + 1;
    ctx.onTube = ctx.onCup = null;
    if (ctx.S) {
      ctx.S.reset();
      ctx.S.dropSkin();
    }
  },

  /** 깨끗해진 이: 흰 광택 + 가끔 반짝 (작은 캔버스, 이 12개뿐이라 가벼움) */
  drawShine(ctx, dt) {
    const c = ctx.shine, sc = ctx.scene, d = Math.min(2, window.devicePixelRatio || 1), W = sc.clientWidth, H = sc.clientHeight;
    if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) {
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
    }
    const g = c.getContext("2d"), F = ctx.F;
    // 반짝이는 이가 없으면 한 번만 지우고 쉼 (저가 기기)
    const any = !ctx.face.classList.contains("closed") && ctx.TEETH.some((t) => t.shine);
    if (!any && ctx._shineClear) return;
    ctx._shineClear = !any;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, W, H);
    ctx._st = (ctx._st || 0) + dt;
    if (ctx.face.classList.contains("closed")) return; // 입을 다물면 이가 안 보임
    for (const t of ctx.TEETH) {
      if (!t.shine) continue;
      t.shine = Math.min(1, t.shine + dt * 2.5);
      const p = (u, v) => {
        const q = t.at(u, v);
        return [F.x + q.x * F.w, F.y + q.y * F.h];
      };
      // 윤기: 이 왼쪽에 부드러운 흰 빛
      const [hx, hy] = p(0.3, t.row === "u" ? 0.42 : 0.5), hr = Math.max(4, t.w * F.w * 0.2);
      const gr = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
      gr.addColorStop(0, "rgba(255,255,255,.95)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.globalAlpha = 0.9 * t.shine;
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(hx, hy, hr * 0.6, hr, 0, 0, 6.283);
      g.fill();
      // 반짝 (천천히 깜빡)
      const tw = 0.5 + 0.5 * Math.sin(ctx._st * 3 + t.i * 1.7 + (t.row === "u" ? 0 : 2));
      const [sx, sy] = p(0.72, 0.3), r = F.w * 0.018 * (0.6 + 0.6 * tw) * t.shine;
      g.globalAlpha = 0.9 * t.shine;
      g.fillStyle = "#fffbe0";
      g.beginPath();
      for (let k = 0; k < 8; k++) {
        const an = (k * Math.PI) / 4, rr = k % 2 ? r * 0.3 : r;
        g.lineTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr);
      }
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
  },

  next(ctx) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    const tok = ++ctx.token;
    const live = () => tok === ctx.token && ctx._active;
    const lv = ctx.level;
    const keys = Object.keys(ctx.ZONES);
    const list = lv === 1 ? [U.pick(keys)] : lv === 2 ? U.sample(keys, 3) : U.shuffle(keys);
    ctx.glowZone = null;
    ctx.pasted = false;
    ctx.restOn = true;
    ctx.onTube = ctx.onCup = null;
    ctx.face.classList.remove("closed", "puff");
    ctx.water.classList.remove("on");
    ctx.cup.classList.remove("glow", "off");
    ctx.cup.style.transform = "";
    ctx.tube.classList.remove("glow", "off");
    ctx.rest.classList.remove("pasted");
    for (const t of ctx.TEETH) t.shine = 0;
    this.layout(ctx);
    S.reset();
    S.dropSkin();
    S.setSkin(ctx.shape);
    S.mode = { foam: true };
    S.need = 0.85;
    S.sound = () => A.sfx("rub");
    const F = () => ctx.F;
    const toPx = (p) => ({ x: F().x + p.x * F().w, y: F().y + p.y * F().h });

    /* ---------- 더러운 이: 누런 막 + 치석(표면) · 세균/얼룩 친구(점) ---------- */
    const dirty = [];
    for (const k of list) for (const t of ctx.ZONES[k].teeth) dirty.push(t);
    const poly = (g, t, sk) => {
      g.beginPath();
      t.q.forEach(([x, y], i) => (i ? g.lineTo(x * sk.w, y * sk.h) : g.moveTo(x * sk.w, y * sk.h)));
      g.closePath();
    };
    S.skinMud([
      {
        x: 0.5, y: 0.5, r: 2,
        paint: (g, x, y, r, sk) => {
          for (const t of dirty) {
            // 누런 막
            g.fillStyle = "rgba(205,168,78,.55)";
            poly(g, t, sk);
            g.fill();
            // 잇몸 쪽 치석 (위 이는 위쪽, 아래 이는 아래쪽)
            for (let n = 0; n < 2; n++) {
              const q = t.at(U.randf(0.2, 0.8), t.row === "u" ? U.randf(0.05, 0.3) : U.randf(0.7, 0.95));
              const px = q.x * sk.w, py = q.y * sk.h, rr = t.w * sk.w * U.randf(0.22, 0.32);
              const gr = g.createRadialGradient(px, py, 0, px, py, rr);
              gr.addColorStop(0, "rgba(150,104,40,.85)");
              gr.addColorStop(0.6, "rgba(170,125,55,.6)");
              gr.addColorStop(1, "rgba(180,140,70,0)");
              g.fillStyle = gr;
              g.beginPath();
              g.arc(px, py, rr, 0, 6.283);
              g.fill();
            }
          }
        },
      },
    ]);
    // 이 하나마다: 안 보이는 점 4개(이 전체를 문질러야 함) + 절반쯤은 세균·얼룩 친구
    const charOf = (pic) => (g, x, y, r, life, t, s) => {
      const im = ctx.PIC[pic];
      if (!im.naturalWidth) return;
      const k = 0.45 + 0.55 * life, w = r * 2 * k, h = (w * im.naturalHeight) / im.naturalWidth;
      g.globalAlpha = Math.min(1, life * 1.6);
      g.translate(x, y);
      g.rotate(Math.sin(t * 2.4 + s.seed * 9) * 0.18 + (1 - life) * Math.sin(t * 30) * 0.3);
      g.drawImage(im, -w / 2, -h / 2, w, h);
    };
    const drawGerm = charOf("germ"), drawStain = charOf("stain");
    let ci = 0;
    for (const k of list)
      for (const t of ctx.ZONES[k].teeth) {
        t.spots = [];
        const add = (o) => {
          const s = Object.assign({ zone: k }, o);
          t.spots.push(s);
          return s;
        };
        const pts = [add(Object.assign(t.at(0.3, 0.3), { need: 1.5 })), add(Object.assign(t.at(0.7, 0.3), { need: 1.5 })), add(Object.assign(t.at(0.3, 0.7), { need: 1.5 })), add(Object.assign(t.at(0.7, 0.7), { need: 1.5 }))];
        const kind = (ci++ + (lv === 3 ? 1 : 0)) % 3; // 0 세균 · 1 얼룩 · 2 없음(막만)
        if (kind < 2) {
          const c = t.at(0.5, 0.5);
          pts.push(add({ x: c.x, y: c.y, r: t.w * (kind ? 0.55 : 0.62), need: 2.2, draw: kind ? drawStain : drawGerm }));
        }
        S.add(pts);
      }
    ctx.brState = () => ({ tok, list, on: S.on, zones: Object.fromEntries(Object.keys(S.zones).map((z) => [z, +S.prog(z).toFixed(2)])), pasted: ctx.pasted, cup: !!ctx.onCup, closed: ctx.face.classList.contains("closed"), palPainted: ctx.palPainted });
    ctx.brPt = (u, v) => {
      const r = ctx.scene.getBoundingClientRect(), p = toPx({ x: u, y: v });
      return { x: r.left + p.x, y: r.top + p.y };
    };
    ctx.brTooth = (t, u, v) => t.at(u, v);

    /* ---------- 이 하나 깨끗 → 광택 + 별 ---------- */
    const starAt = (p, s) => {
      const e = U.el("div", "br-star", '<img alt="" src="' + ctx.IMG + 'star.png">');
      e.style.cssText = `--s:${s}px;left:${p.x}px;top:${p.y}px`;
      ctx.scene.appendChild(e);
      ctx.after(1100, () => e.remove());
    };
    const toothClean = (t) => {
      if (t.shine) return;
      t.shine = 0.01;
      const c = toPx(t.at(0.5, 0.5));
      starAt(c, Math.max(40, F().w * 0.09));
      A.note(U.pick(["E6", "G6", "C7"]), { inst: "bell", dur: 0.25, vol: 0.12 });
      // 남은 막도 그 이만 스르륵
      const sk = S.skin;
      if (!sk) return;
      for (let i = 1; i <= 4; i++)
        ctx.after(i * 70, () => {
          if (!live() || S.skin !== sk) return;
          const g = sk.L.dirt.g;
          g.save();
          g.globalCompositeOperation = "destination-out";
          g.globalAlpha = 0.45;
          poly(g, t, sk);
          g.fill();
          g.restore();
        });
    };
    let watch = ctx.every(120, () => {
      if (!live()) return ctx.cancel(watch);
      for (const t of dirty) if (!t.shine && t.spots.every((s) => s.life <= 0)) toothClean(t);
    });

    /* ---------- 치약 꾹 → 문지르기 ---------- */
    const rub = () => {
      S.run();
      S.on = true;
      let chika = 0;
      S.onRub = (x, y, len) => {
        chika += len;
        if (chika > 320) {
          chika = 0;
          C.pop(ctx, ctx.scene, x + U.randf(-30, 30), y - 40, "치카");
          A.sfx("bubble");
        }
      };
      const guided = lv < 3;
      let at = 0;
      const guide = () => {
        while (at < list.length && S.zones[list[at]].done) at++;
        if (at >= list.length) return;
        const k = list[at];
        this.showZone(ctx, k);
        ctx.say(ctx.ZONES[k].say + " 🪥");
        ctx.hint(() => ctx.zoneEls[k][0], ctx.ZONES[k].say);
      };
      S.onZone = (k) => {
        for (const t of ctx.ZONES[k].teeth) {
          const c = toPx(t.at(0.5, 0.5));
          S.burst(c.x, c.y, 6, "star", 0.6);
        }
        A.sfx("sparkle");
        if (ctx.glowZone === k) this.showZone(ctx, null);
        if (S.leftZones().length) {
          KP.voice.say(U.pick(["반짝반짝!", "깨끗해졌어요!", "좋아요!"]));
          if (guided) ctx.after(900, () => live() && S.on && guide());
        }
      };
      if (guided) {
        if (lv === 1) guide();
        else {
          ctx.say("하마 이에 세균이 있어요! 치카치카 닦아 줘요 🪥");
          ctx.after(2200, () => live() && S.on && guide());
        }
      } else {
        ctx.say("구석구석 다 닦아 볼까요? 🪥");
        const least = () => {
          const k = S.leastZone();
          return k ? ctx.zoneEls[k][0] : null;
        };
        ctx.hint(least, "반짝이는 곳을 닦아요!");
        // 잠깐 멈추면 덜 닦인 곳이 반짝 (한 번도 안 닦았으면 이 판 시작부터 셈)
        const t0 = Date.now();
        const iv = ctx.every(1000, () => {
          if (!live() || !S.on) return ctx.cancel(iv);
          const idle = Date.now() - Math.max(S.lastRub || 0, t0);
          if (idle > 4000 && !ctx.glowZone) {
            const k = S.leastZone();
            if (k) this.showZone(ctx, k);
          } else if (idle < 500 && ctx.glowZone && S.prog(ctx.glowZone) > 0.4) this.showZone(ctx, null);
        });
      }
      S.onAll = () => this.rinse(ctx, tok, live);
    };
    ctx.say("치약을 꾹 눌러요! 🪥");
    ctx.tube.classList.add("glow");
    ctx.hint(() => ctx.tube, "치약을 꾹 눌러요!");
    ctx.onTube = () => {
      if (!live() || ctx.pasted) return;
      ctx.onTube = null;
      ctx.hint(null);
      ctx.tube.classList.remove("glow");
      U.replay(ctx.tube, "press");
      A.tone(300, { to: 200, dur: 0.18, vol: 0.14, type: "triangle" });
      ctx.after(220, () => {
        if (!live()) return;
        ctx.pasted = true;
        ctx.rest.classList.add("pasted");
        this.layout(ctx); // 칫솔 그림에도 치약
        const r = ctx.rest.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
        C.pop(ctx, ctx.scene, r.left - hr.left + r.width * 0.75, r.top - hr.top + r.height * 0.1, "쭉");
        ctx.after(500, () => live() && rub());
      });
    };
  },

  /** 다 닦음 → 컵 누르기 → 물 머금고 볼 부풀기 → 퉤! → 웃는 하마 */
  rinse(ctx, tok, live) {
    const U = KP.u,
      A = KP.audio,
      S = ctx.S,
      C = KP.care;
    S.on = false;
    S.onRub = null;
    this.showZone(ctx, null);
    ctx.after(700, () => {
      if (!live()) return;
      ctx.restOn = false;
      ctx.cup.classList.add("glow");
      U.replay(ctx.cup, "press");
      ctx.say("이제 물로 헹궈요! 컵을 눌러요");
      ctx.hint(() => ctx.cup, "컵을 눌러요!");
      ctx.onCup = go;
    });
    const go = async () => {
      if (!live() || ctx.onCup !== go) return;
      ctx.onCup = null;
      ctx.hint(null);
      ctx.cup.classList.remove("glow");
      const F = ctx.F, mx = F.x + F.w / 2, my = F.y + F.h * 0.45;
      // 컵이 입으로 가서 기울어짐
      const cw = parseFloat(ctx.cup.style.width), ch = parseFloat(ctx.cup.style.height);
      ctx.cup.style.transform = `translate(${mx + F.w * 0.3 - ctx.cupHome.x - cw / 2}px,${F.y + F.h * 0.12 - ctx.cupHome.y - ch / 2}px) rotate(-75deg)`;
      await ctx.wait(560);
      if (!live()) return;
      A.sfx("water");
      ctx.water.classList.add("on");
      S.skinFade("foam");
      await ctx.wait(800);
      if (!live()) return;
      ctx.cup.classList.add("off");
      // 입을 다물고 볼이 부풀어 우글우글
      ctx.water.classList.remove("on");
      ctx.face.classList.add("closed", "puff");
      S.skinFade("dirt");
      S.clearSpots();
      for (let i = 0; i < 5; i++)
        ctx.after(i * 250, () => {
          A.sfx("bubble");
          if (i % 2 === 0) C.pop(ctx, ctx.scene, mx + U.randf(-F.w * 0.25, F.w * 0.25), my - F.h * 0.2, "가글");
        });
      await ctx.wait(1500);
      if (!live()) return;
      // 퉤!
      ctx.face.classList.remove("closed", "puff");
      U.replay(ctx.face, "pop");
      C.pop(ctx, ctx.scene, mx, F.y + F.h * 0.25, "퉤!", true);
      A.sfx("whoosh");
      S.burst(mx, my, 40, "drop", 1.2);
      for (const t of ctx.TEETH) if (!t.shine) t.shine = 0.01;
      await ctx.wait(800);
      if (!live()) return;
      // 웃는 하마
      ctx.face.classList.add("closed");
      U.replay(ctx.face, "pop");
      A.sfx("sparkle");
      const pr = ctx.pal.getBoundingClientRect(), hr = ctx.scene.getBoundingClientRect();
      U.replay(ctx.pal, "hop");
      KP.pfx.hearts(ctx.scene, pr.left - hr.left + pr.width / 2, pr.top - hr.top + pr.height * 0.2, 4, ctx);
      S.burst(mx, F.y - F.h * 0.4, 26, "star", 1);
      await ctx.wait(800);
      if (!live()) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const msg = big ? "이제 진짜로 치카치카 해 볼까?" : U.pick(["반짝반짝 깨끗한 이!", "치카치카 최고!", "{부름} 치카치카 박사!"]);
      const ok = await ctx.win({ big, msg });
      if (ok && live()) this.next(ctx);
    };
  },
});
