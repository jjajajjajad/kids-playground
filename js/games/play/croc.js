/* 악어 이빨 — 입을 쩍 벌린 악어의 이빨을 하나씩 콕! 쏙 들어가요.
   숨어 있는 아픈 이빨을 누르면 '앙!' 입이 닫히는 깜짝 놀이 (실패 아님, 웃음 + 다음 판)
   - 누를 때마다 악어가 움찔·눈 깜빡 + 숫자 세기, 입이 조금씩 내려와 두근두근
   - 몇몇 이빨에는 보물(별·사탕·보석)이 숨어 있음
   - 안 아픈 이빨을 누르면 악어가 아픈 이빨 쪽을 힐끔 봄(1단계는 그 이빨이 덜덜) → 피해서 다 누르면 '이빨 청소 성공' 축하
   - 앙! 당한 판은 짧게 웃고 바로 다음 판, 2판마다 한 번 축하(운이라 단계·열쇠 별 없음)
   1단계: 이빨 5개 / 2단계: 7개 / 3단계: 9개 (작은 화면은 이빨이 64px 이상 되도록 개수를 줄임) */
"use strict";
KP.game({
  id: "croc",
  icon: "🐊",
  name: "악어 이빨",
  cat: "play",
  levels: 3,
  score: "🦷",
  setup(ctx) {
    const U = KP.u;
    KP.css("croc", `
      .cr-stage{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#c6f0ff 0%,#e3f8ff 40%,#8fd6a0 40%,#6cc48a 60%,#4fb3d9 60%,#3b9ccc 100%);display:flex;align-items:center;justify-content:center}
      .cr-stage.cr-shake{animation:cr-shake .45s}
      @keyframes cr-shake{20%{transform:translate(-10px,4px)}40%{transform:translate(9px,-4px)}60%{transform:translate(-6px,2px)}80%{transform:translate(4px,0)}}
      .cr-reed{position:absolute;bottom:38%;font-size:clamp(34px,5vw,56px);pointer-events:none}
      .cr-pad{position:absolute;width:clamp(50px,7vw,80px);height:clamp(20px,3vw,32px);border-radius:50%;background:#3fae5c;box-shadow:inset 0 -4px 0 rgba(0,0,0,.12);pointer-events:none}
      .cr-wave{position:absolute;left:0;right:0;bottom:0;height:40%;overflow:hidden;pointer-events:none}
      /* 물결 줄무늬는 120px(무늬 2칸) 더 넓은 한 장(::before)에 그려 두고 옆으로 밀기만 함 (무늬를 매번 다시 칠하면 저가 태블릿이 버벅임) */
      .cr-wave::before{content:"";position:absolute;left:-120px;right:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 30px,transparent 30px 60px);animation:cr-wave 6s linear infinite}
      @keyframes cr-wave{to{transform:translateX(120px)}}
      .cr-croc{position:relative;width:var(--cwx,var(--cw));height:var(--ch,calc(var(--cw)*1.02));z-index:1}
      .cr-croc.cr-flinch{animation:cr-flinch .32s ease-out}
      @keyframes cr-flinch{30%{transform:rotate(-2deg) scale(1.025)}65%{transform:rotate(1.4deg)}}
      .cr-croc.blink .cr-lid{height:62%}
      /* 아래턱: 세로로 긴 화면에서는 입이 깊어짐(--ch) → 이빨이 더 크게 들어감 */
      .cr-lower{position:absolute;left:0;right:0;top:calc(var(--cw)*.47);bottom:0;border-radius:12% 12% 50% 50%/10% 10% 60% 60%;z-index:1;
        background:radial-gradient(circle at 30% 80%,rgba(255,255,255,.12) 0 8%,transparent 9%),linear-gradient(#4fc46a,#2f9a4c);box-shadow:inset 0 -10px 0 rgba(0,0,0,.12),0 8px 0 rgba(0,0,0,.1)}
      .cr-mouth{position:absolute;left:5%;right:5%;top:0;bottom:12%;border-radius:0 0 50% 50%/0 0 70% 70%;background:radial-gradient(ellipse at 50% 20%,#ff9db3,#e9567a 70%,#c93a62);box-shadow:inset 0 10px 18px rgba(120,0,40,.35)}
      /* 앙!(bite): 내려온 위턱 머리 둥근 모서리 옆으로 분홍 입 안의 네모난 윗모서리가 삐져나와 보였음
         (세로로 깊은 입(--ch, 태블릿 세로)에서는 위턱이 입을 다 못 덮어 입 안·이빨이 통째로 위로 드러났음)
         → 닫힌 동안 아래턱 윗변을 위턱 머리 바로 아래까지 내리고, 입 안 윗부분은 잘라 숨기고, 아래 이빨은 입 속이라 숨김 */
      .cr-lower{transition:top .45s ease-out}
      .cr-croc.bite .cr-lower{top:max(calc(var(--cw)*.47),calc(var(--ch,calc(var(--cw)*1.02)) - var(--cw)*.5));transition:top .14s cubic-bezier(.7,0,1,.6)}
      .cr-croc.bite .cr-mouth{clip-path:inset(calc(var(--cw)*.15) 0 0 0)}
      .cr-croc.bite .cr-teeth{opacity:0;transition:opacity .1s}
      .cr-tongue{position:absolute;left:30%;right:30%;top:30%;bottom:16%;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 30%,#ffc1cf,#ff7d9b);box-shadow:inset 0 -6px 0 rgba(0,0,0,.08)}
      .cr-tongue::after{content:"";position:absolute;left:49%;top:12%;bottom:30%;width:3px;background:rgba(160,30,70,.35);border-radius:2px}
      /* --close(0~1, 누를수록 커짐)만큼 위턱이 내려옴 — 최대 0.4배로 제한(끝자리 이빨이 위턱에 가려지지 않게). 앙!(bite)은 따로 끝까지
         위턱은 그림일 뿐이라 터치를 통과시킴(pointer-events:none) → 끝자리 이빨 윗부분이 살짝 겹쳐도 그대로 눌림 */
      .cr-upper{position:absolute;left:2%;right:2%;top:0;height:calc(var(--cw)*.55);z-index:2;pointer-events:none;transition:transform .5s cubic-bezier(.3,1.3,.5,1);
        transform:translateY(calc(var(--close,0)*var(--cw)*.036))}
      .cr-croc.bite .cr-upper{transform:translateY(calc(var(--ch,calc(var(--cw)*1.02)) - var(--cw)*.58));transition:transform .14s cubic-bezier(.7,0,1,.6)}
      .cr-head{position:absolute;left:0;right:0;top:14%;bottom:30%;border-radius:46% 46% 18% 18%/60% 60% 20% 20%;background:linear-gradient(#5bd277,#36a854);box-shadow:inset 0 -8px 0 rgba(0,0,0,.1)}
      .cr-head::before{content:"";position:absolute;left:12%;right:12%;top:18%;height:40%;background:radial-gradient(circle,rgba(0,0,0,.12) 0 6%,transparent 7%) 0 0/34px 28px;border-radius:50%}
      .cr-nose{position:absolute;top:30%;width:calc(var(--cw)*.067);height:9%;border-radius:50%;background:#1f6b35}
      .cr-nose.l{left:calc(50% - var(--cw)*.1)}.cr-nose.r{right:calc(50% - var(--cw)*.1)}
      /* 눈·코는 --cw 기준 크기 (가로로 넓힌 악어(--cwx)에서도 동그랗게) */
      .cr-eye{position:absolute;top:0;width:calc(var(--cw)*.25);height:44%;border-radius:50% 50% 40% 40%;background:#4bc66a;box-shadow:inset 0 -6px 0 rgba(0,0,0,.1)}
      .cr-eye.l{left:6%}.cr-eye.r{right:6%}
      .cr-ball{position:absolute;left:16%;right:16%;top:16%;bottom:14%;border-radius:50%;background:#fff;overflow:hidden;transition:transform .15s}
      .cr-pupil{position:absolute;left:30%;top:24%;width:44%;height:56%;border-radius:50%;background:#2a2a3a;transition:transform .3s}
      .cr-pupil::after{content:"";position:absolute;left:18%;top:14%;width:32%;height:32%;border-radius:50%;background:#fff}
      .cr-lid{position:absolute;left:0;right:0;top:0;height:0;background:#3fb85e;transition:height .15s;border-bottom:3px solid #2a7d40}
      .cr-croc.bite .cr-lid,.cr-croc.laugh .cr-lid{height:62%}
      .cr-croc.laugh{animation:cr-laugh .25s ease-in-out 6 alternate}
      @keyframes cr-laugh{to{transform:rotate(3deg) translateY(-6px)}}
      .cr-palate{position:absolute;left:8%;right:8%;bottom:0;height:34%;border-radius:0 0 30% 30%/0 0 50% 50%;background:linear-gradient(#e9567a,#ff8fab);overflow:visible}
      .cr-up-teeth{position:absolute;left:6%;right:6%;bottom:-14%;height:30%;background:#fff;filter:drop-shadow(0 2px 0 rgba(0,0,0,.1))}
      .cr-t{position:absolute;width:var(--tw);height:var(--tw);margin:calc(var(--tw)/-2) 0 0 calc(var(--tw)/-2);z-index:2;display:flex;align-items:flex-start;justify-content:center;cursor:pointer}
      .cr-t.hintGlow{position:absolute;border-radius:50%}
      .cr-tv{width:62%;height:78%;margin-top:6%;border-radius:50% 50% 22% 22%/72% 72% 28% 28%;background:linear-gradient(90deg,#fff,#fdfdf7 55%,#e8e6d6);box-shadow:0 3px 0 #d8d4bf,inset 0 -4px 0 rgba(0,0,0,.05);transition:transform .2s cubic-bezier(.3,1.5,.5,1),filter .2s}
      .cr-t.down .cr-tv{transform:translateY(42%) scale(.86);filter:brightness(.82)}
      .cr-t:active .cr-tv{transform:translateY(12%)}
      .cr-t.sore .cr-tv{animation:cr-sore .12s linear 8 alternate}
      .cr-t.sore.lite .cr-tv{animation-iteration-count:4}
      @keyframes cr-sore{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
      .cr-t.last .cr-tv{box-shadow:0 0 0 4px #ffe066,0 3px 0 #d8d4bf;animation:cr-sore .18s linear infinite alternate}
      .cr-gem{position:absolute;width:var(--gs);height:var(--gs);margin:calc(var(--gs)/-2) 0 0 calc(var(--gs)/-2);font-size:var(--gs);line-height:1;pointer-events:none;z-index:7;animation:cr-gem 1.2s cubic-bezier(.2,1.4,.4,1) forwards}
      @keyframes cr-gem{0%{transform:translateY(20%) scale(.2);opacity:0}25%{transform:translateY(-70%) scale(1.15);opacity:1}70%{transform:translateY(-90%) scale(1);opacity:1}100%{transform:translateY(-150%) scale(.7);opacity:0}}
      .cr-big{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:clamp(70px,13vw,140px);color:#fff;-webkit-text-stroke:6px #2f9a4c;paint-order:stroke;text-shadow:0 7px 0 #1f6b35;z-index:6;pointer-events:none;white-space:nowrap;opacity:0}
      .cr-big.show{animation:cr-big 1.1s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes cr-big{0%{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(-10deg)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.15) rotate(4deg)}75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0}}
      .cr-pop{position:absolute;font-size:clamp(18px,2.6vw,26px);color:#fff;-webkit-text-stroke:3px #e9567a;paint-order:stroke;pointer-events:none;z-index:5;animation:cr-pop .6s ease-out forwards;transform:translate(-50%,-50%)}
      @keyframes cr-pop{to{transform:translate(-50%,-160%);opacity:0}}
      .cr-ha{position:absolute;font-size:clamp(26px,4vw,40px);color:#ff7452;-webkit-text-stroke:2px #fff;paint-order:stroke;pointer-events:none;z-index:6;animation:cr-ha 1.4s ease-out forwards}
      @keyframes cr-ha{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-80px) rotate(var(--r))}}
    `);
    const stage = U.el("div", "cr-stage");
    stage.innerHTML =
      '<div class="cr-wave"></div>' +
      '<div class="cr-reed" style="left:3%">' + KP.E("🌿") + '</div><div class="cr-reed" style="right:4%">' + KP.E("🌿") + "</div>" +
      '<div class="cr-pad" style="left:8%;bottom:14%"></div><div class="cr-pad" style="right:10%;bottom:22%"></div><div class="cr-pad" style="right:22%;bottom:6%"></div>';
    const croc = U.el("div", "cr-croc");
    const eye = (s) => '<div class="cr-eye ' + s + '"><div class="cr-ball"><div class="cr-pupil"></div><div class="cr-lid"></div></div></div>';
    // 윗니 지그재그
    let zz = "0 0,100% 0";
    const N = 12;
    for (let i = N; i >= 0; i--) zz += "," + (i * 100) / N + "% " + (i % 2 ? "100%" : "0");
    croc.innerHTML =
      '<div class="cr-lower"><div class="cr-mouth"><div class="cr-tongue"></div></div><div class="cr-teeth"></div></div>' +
      '<div class="cr-upper"><div class="cr-palate"><div class="cr-up-teeth" style="clip-path:polygon(' + zz + ')"></div></div>' +
      '<div class="cr-head"><div class="cr-nose l"></div><div class="cr-nose r"></div></div>' + eye("l") + eye("r") + "</div>" +
      '<div class="cr-big"></div>';
    stage.appendChild(croc);
    ctx.body.appendChild(stage);
    Object.assign(ctx, { stage, croc, teethEl: U.$(".cr-teeth", croc), mouth: U.$(".cr-mouth", croc), bigEl: U.$(".cr-big", croc), pupils: U.$$(".cr-pupil", croc) });
    ctx.size = () => {
      const W = stage.clientWidth,
        H = stage.clientHeight;
      const cw = Math.round(U.clamp(Math.min(W * 0.96, (H - 20) / 1.04, 640), 240, 640));
      // 세로로 긴 화면(폰 세로): 아래턱을 길게 늘여 입을 깊게 (이빨이 들어갈 자리가 커짐)
      const ch = Math.round(U.clamp(H - 24, cw * 1.02, cw * 1.45));
      // 가로로 넓은 화면(폰 가로 등): 이빨이 다 안 들어가면 악어를 옆으로 넓힘 (ctx.wx 배, next 에서 정함)
      const cwx = Math.round(Math.min(W * 0.94, cw * (ctx.wx || 1)));
      croc.style.setProperty("--cw", cw + "px");
      croc.style.setProperty("--ch", ch + "px");
      croc.style.setProperty("--cwx", Math.max(cw, cwx) + "px");
      ctx.cw = cw;
      ctx.ch = ch;
      ctx.cwx = Math.max(cw, cwx);
    };
    /* 이빨 자리: 아래턱 입 모양(U자) 위에 '같은 간격'으로 (예전엔 같은 각도라 아래쪽 이빨이 촘촘·작았음)
       반환 {tw, pts:[{x,y,rot}]} — tw 는 이빨 칸 크기(= 가장 가까운 이빨 사이 거리, 터치 영역) */
    ctx.teethLayout = (n) => {
      const cw = ctx.cw,
        cwx = ctx.cwx || cw;
      const mw = cwx * 0.9,
        mh = (ctx.ch - cw * 0.47) * 0.88;
      const cap = Math.max(cw * 0.17, 72);
      const build = (tw) => {
        const rx = mw / 2 - tw * 0.42,
          ry = mh - tw * 0.68;
        const a0 = Math.PI * 0.02,
          a1 = Math.PI * 0.98,
          M = 240;
        const acc = [0];
        let px = rx * Math.cos(a0),
          py = ry * Math.sin(a0);
        for (let j = 1; j <= M; j++) {
          const th = a0 + ((a1 - a0) * j) / M,
            x = rx * Math.cos(th),
            y = ry * Math.sin(th);
          acc.push(acc[j - 1] + Math.hypot(x - px, y - py));
          px = x;
          py = y;
        }
        const pts = [];
        for (let i = 0; i < n; i++) {
          const sL = (acc[M] * (i + 0.5)) / n;
          let j = 1;
          while (j < M && acc[j] < sL) j++;
          const f = (sL - acc[j - 1]) / (acc[j] - acc[j - 1] || 1);
          const th = a0 + ((a1 - a0) * (j - 1 + f)) / M;
          pts.push({ x: cwx / 2 + rx * Math.cos(th), y: tw * 0.32 + ry * Math.sin(th), rot: (th * 180) / Math.PI - 90 });
        }
        let d = 1e9;
        for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) d = Math.min(d, Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y));
        return { pts, d };
      };
      let tw = cap,
        r = build(tw);
      for (let it = 0; it < 30; it++) {
        const nt = Math.min(cap, r.d);
        if (Math.abs(nt - tw) < 0.4) break;
        tw = (tw + nt) / 2;
        r = build(tw);
      }
      return { tw: Math.floor(Math.min(tw, r.d)), pts: r.pts };
    };
    /* 이빨 n개가 64px 이상 되도록 악어 가로 넓힘(ctx.wx)을 정함 — next 와 화면 회전(resize) 공용 */
    ctx.fitWide = (n) => {
      ctx.wx = 1;
      ctx.size();
      // 폰(짧은 변 430 이하)은 가능하면 72px 까지 넓힘 (개수를 줄이는 기준은 그대로 64px)
      const want = Math.min(innerWidth, innerHeight) <= 430 ? 72 : 64;
      for (let wx = 1.15; wx <= 1.81 && ctx.teethLayout(n).tw < want; wx += 0.15) {
        ctx.wx = wx;
        ctx.size();
      }
    };
    addEventListener("resize", () => {
      if (ctx._active) {
        // 판 도중 화면을 돌려도 이빨 칸이 64px 아래로 줄지 않게 넓힘을 다시 계산
        if (ctx.teethN) {
          ctx.fitWide(ctx.teethN);
          // 넓혀도 64px 가 안 되면(예: 폰 세로 8개 → 가로) 이번 판을 새 화면에 맞는 개수로 다시 차림
          if (ctx.teethLayout(ctx.teethN).tw < 64 && ctx.reround && ctx.reround()) return;
        } else ctx.size();
        ctx.placeTeeth && ctx.placeTeeth();
      }
    });
  },
  start(ctx) {
    ctx.round = 0; // 끝난 판 수
    ctx.clean = 0; // 아픈 이빨을 피해 다 누른 판 수
    ctx.luck = 0; // 마지막 축하 뒤 '앙!' 당한 판 수 (2판마다 축하)
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const croc = ctx.croc;
    croc.classList.remove("bite", "laugh", "blink");
    croc.style.setProperty("--close", 0);
    // 앙! 당한 판은 win 없이 다음 판으로 넘어가므로, 열쇠 별 표시(힌트 봄·별 없음)를 판마다 새로
    ctx._hinted = false;
    ctx._resetFew();
    // 이빨 수: 단계별 5·7·9 — 터치 칸이 64px 이상 안 되면 ① 악어를 옆으로 넓히고 ② 그래도 모자라면 개수를 줄임
    let n = [5, 7, 9][lv - 1];
    ctx.teethN = 0;
    ctx.fitWide(n);
    while (n > 4 && ctx.teethLayout(n).tw < 64) n--;
    ctx.teethN = n;
    ctx.teethEl.innerHTML = "";
    const sore = U.rand(n);
    // 보물 이빨 (아픈 이빨 말고): 1·2단계 2개, 3단계 1개
    const gems = new Map();
    const GEMS = [["⭐", "별 찾았다!"], ["🍬", "사탕 찾았다!"], ["💎", "보석 찾았다!"]];
    U.sample(U.shuffle([...Array(n).keys()].filter((k) => k !== sore)), lv === 3 ? 1 : 2).forEach((k) => gems.set(k, U.pick(GEMS)));
    // 힐끔 보기(추리 힌트): 단계가 오를수록 짧게·가끔
    const GLANCE = { ms: [1300, 800, 450][lv - 1], p: [1, 0.85, 0.6][lv - 1] };
    let busy = false,
      pressed = 0;
    if (ctx.round === 0) ctx.say("악어 이빨을 하나씩 콕! 아픈 이빨을 누르면… 앙! 🐊");
    else ctx.say("이빨을 하나씩 콕 눌러 봐요! 🐊");
    const teeth = [];
    for (let i = 0; i < n; i++) {
      const t = U.el("div", "cr-t", '<div class="cr-tv"></div>');
      t.dataset.tap = "1";
      ctx.teethEl.appendChild(t);
      teeth.push(t);
      // 이빨 칸이 살짝 겹칠 수 있어, 누른 자리에서 가장 가까운 이빨로
      ctx.fast(t, (e) => {
        let best = i,
          bd = 1e9;
        teeth.forEach((q, k) => {
          const r = q.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
          if (d < bd) {
            bd = d;
            best = k;
          }
        });
        press(teeth[best], best);
      });
    }
    ctx.placeTeeth = () => {
      const L = ctx.teethLayout(n);
      ctx.teethEl.style.setProperty("--tw", L.tw + "px");
      teeth.forEach((t, i) => {
        const p = L.pts[i];
        t.style.left = p.x + "px";
        t.style.top = p.y + "px";
        t.style.rotate = p.rot.toFixed(1) + "deg";
      });
    };
    ctx.placeTeeth();
    // 화면 회전으로 이빨이 너무 작아질 때 이번 판 다시 차리기 (앙! 연출 중이면 안 함 — 다음 판에서 맞춰짐)
    ctx.reround = () => {
      if (busy || !ctx._active) return false;
      ctx.cancel(glanceT);
      this.next(ctx);
      return true;
    };
    // 눈동자가 이빨 쪽을 봄
    const look = (t) => {
      const cr = croc.getBoundingClientRect(),
        r = t.getBoundingClientRect();
      const dx = (r.left + r.width / 2 - cr.left) / cr.width - 0.5;
      ctx.pupils.forEach((p) => (p.style.transform = "translate(" + dx * 40 + "%," + 30 + "%)"));
    };
    const lookFront = () => ctx.pupils.forEach((p) => (p.style.transform = ""));
    let glanceT = null;
    const glance = () => {
      if (Math.random() > GLANCE.p) return;
      ctx.cancel(glanceT);
      glanceT = ctx.after(280, () => {
        if (busy) return;
        look(teeth[sore]);
        // 1·2단계: 아픈 이빨이 덜덜 (2단계는 짧게)
        // 1단계는 누를 때마다 덜덜이 보여 정답을 알려 주는 셈 → 덜덜을 본 판은 열쇠 별 없음(축하·단계는 그대로)
        if (lv === 1) ctx.noStar();
        if (lv < 3) {
          teeth[sore].classList.toggle("lite", lv === 2);
          U.replay(teeth[sore], "sore");
        }
        glanceT = ctx.after(GLANCE.ms, () => !busy && lookFront());
      });
    };
    const press = async (t, i) => {
      if (busy || t.classList.contains("down")) return;
      look(t);
      if (i !== sore) {
        t.classList.add("down");
        pressed++;
        // 악어 반응: 움찔 + 눈 깜빡 + 입이 조금씩 내려옴(두근두근)
        U.replay(croc, "cr-flinch");
        croc.classList.add("blink");
        ctx.after(160, () => croc.classList.remove("blink"));
        croc.style.setProperty("--close", (pressed / (n - 1)).toFixed(2));
        A.tone(900, { to: 500, dur: 0.08, vol: 0.18 });
        A.note(A.SCALE[Math.min(pressed + 2, 11)], { inst: "marimba", dur: 0.25, vol: 0.2, when: 0.03 });
        A.tone(170, { to: 240, dur: 0.14, vol: 0.07, type: "triangle", when: 0.06 }); // 음~ (악어 콧소리)
        const p = U.el("div", "cr-pop", U.pick(["뽁!", "쏙!", "콕!"]));
        p.style.left = t.style.left;
        p.style.top = parseFloat(t.style.top) + ctx.cw * 0.47 + "px";
        croc.appendChild(p);
        ctx.after(620, () => p.remove());
        ctx.score.add();
        const gem = gems.get(i);
        if (gem) {
          // 보물 뿅!
          const g = U.el("div", "cr-gem", KP.E(gem[0]));
          g.style.setProperty("--gs", Math.round(ctx.cw * 0.13) + "px");
          g.style.left = t.style.left;
          g.style.top = parseFloat(t.style.top) + ctx.cw * 0.47 + "px";
          croc.appendChild(g);
          ctx.after(1250, () => g.remove());
          A.sfx("sparkle");
          ctx.score.add();
        }
        if (pressed === n - 1) {
          KP.voice.say("이제 하나 남았다! 두근두근!");
          lookFront();
          teeth[sore].classList.add("last");
        } else if (gem) KP.voice.say(gem[1]);
        else KP.voice.say(U.NAT[pressed] + "!"); // 하나! 둘! 셋! (같이 세기)
        if (pressed < n - 1) glance();
        hint();
        return;
      }
      /* ---------- 앙! ---------- */
      busy = true;
      const cleanRound = pressed === n - 1; // 아픈 이빨만 남기고 다 눌렀음
      ctx.hint(null);
      ctx.cancel(glanceT);
      t.classList.remove("last", "sore");
      t.classList.add("down");
      croc.classList.add("bite");
      A.kick({ vol: 0.7 });
      A.noise({ dur: 0.25, vol: 0.25, lp: 1200 });
      A.tone(300, { to: 90, dur: 0.3, vol: 0.2, type: "triangle" });
      U.replay(ctx.stage, "cr-shake");
      ctx.bigEl.textContent = "앙!";
      U.replay(ctx.bigEl, "show");
      // 연출 시간: 단계가 오를수록 짧게 (예전 1.3초 + 1.5초 + 0.5초 + 축하)
      const T = { bite: [1000, 850, 750][lv - 1], laugh: [1100, 950, 800][lv - 1] };
      KP.voice.say(cleanRound || ctx.round === 0 ? "앙! 아야야, 거기가 아픈 이빨이야!" : "앙!");
      await ctx.wait(cleanRound || ctx.round === 0 ? T.bite + 500 : T.bite);
      if (!ctx._active) return;
      // 웃음
      croc.classList.add("laugh");
      for (let k = 0; k < 4; k++) {
        const h = U.el("div", "cr-ha", "하하");
        h.style.cssText = "left:" + (15 + k * 20) + "%;top:" + (8 + (k % 2) * 10) + "%;--r:" + (k % 2 ? 15 : -15) + "deg;animation-delay:" + k * 0.18 + "s";
        croc.appendChild(h);
        ctx.after(1800, () => h.remove());
        A.note(["E5", "C5", "E5", "C5"][k], { inst: "pluck", dur: 0.18, vol: 0.2, when: k * 0.18 });
      }
      KP.voice.say(cleanRound ? "고마워요!" : "하하하! 깜짝 놀랐지?");
      await ctx.wait(T.laugh);
      if (!ctx._active) return;
      croc.classList.remove("bite", "laugh");
      croc.style.setProperty("--close", 0);
      lookFront();
      A.sfx("open");
      await ctx.wait(300);
      if (!ctx._active) return;
      ctx.round++;
      if (cleanRound) {
        // 아픈 이빨을 피해 다 눌렀어요 → 축하 (실력 판: 열쇠 별 대상)
        ctx.clean++;
        ctx.luck = 0;
        const big = ctx.clean % 3 === 0;
        const ok = await ctx.win({ big, msg: big ? "{부름} 정말 용감해!" : "이빨 청소 끝!", say: big ? "" : KP.voice._natUrls && KP.voice._natUrls("이빨 청소 끝!") ? "이빨 청소 끝!" : "정말 용감해!" }); // "이빨 청소 끝!" 음성은 new-voice/croc.txt
        if (ok) this.next(ctx);
        return;
      }
      ctx.luck++;
      if (ctx.luck >= 2) {
        // 앙! 당한 판도 2판마다 한 번 축하 — 운으로 끝난 판이라 단계·열쇠 별에는 넣지 않음(noLevel)
        ctx.luck = 0;
        const ok = await ctx.win({ noLevel: true, msg: "깜짝 놀랐지?", say: "깜짝 놀랐지?" });
        if (ok) this.next(ctx);
        return;
      }
      // 그 사이 판은 축하 없이 바로 다음 판 (매 판 긴 연출 반복 줄이기)
      this.next(ctx);
    };
    // 힌트는 늘 '안 아픈 이빨'을 가리킴(= 정답) → 손가락이 가리킨 판은 열쇠 별 없음(answer)
    const hint = () => ctx.hint(() => teeth.find((t, k) => k !== sore && !t.classList.contains("down")) || teeth[sore], "이빨을 하나씩 콕 눌러 봐요!", { answer: true });
    hint();
  },
});
