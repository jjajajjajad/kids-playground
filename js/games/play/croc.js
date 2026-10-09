/* 악어 이빨 — 입을 쩍 벌린 악어의 이빨을 하나씩 콕! 쏙 들어가요.
   숨어 있는 아픈 이빨을 누르면 '앙!' 입이 닫히는 깜짝 놀이 (실패 아님, 웃음 + 다음 판)
   1단계: 이빨 5개 / 2단계: 7개 / 3단계: 9개 */
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
      .cr-wave{position:absolute;left:0;right:0;bottom:0;height:40%;background:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 30px,transparent 30px 60px);animation:cr-wave 6s linear infinite;pointer-events:none}
      @keyframes cr-wave{to{background-position:120px 0}}
      .cr-croc{position:relative;width:var(--cw);height:calc(var(--cw)*1.02);z-index:1}
      .cr-lower{position:absolute;left:0;right:0;top:46%;height:54%;border-radius:12% 12% 50% 50%/10% 10% 60% 60%;z-index:1;
        background:radial-gradient(circle at 30% 80%,rgba(255,255,255,.12) 0 8%,transparent 9%),linear-gradient(#4fc46a,#2f9a4c);box-shadow:inset 0 -10px 0 rgba(0,0,0,.12),0 8px 0 rgba(0,0,0,.1)}
      .cr-mouth{position:absolute;left:10%;right:10%;top:0;bottom:12%;border-radius:0 0 50% 50%/0 0 70% 70%;background:radial-gradient(ellipse at 50% 20%,#ff9db3,#e9567a 70%,#c93a62);box-shadow:inset 0 10px 18px rgba(120,0,40,.35)}
      .cr-tongue{position:absolute;left:30%;right:30%;top:30%;bottom:16%;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 30%,#ffc1cf,#ff7d9b);box-shadow:inset 0 -6px 0 rgba(0,0,0,.08)}
      .cr-tongue::after{content:"";position:absolute;left:49%;top:12%;bottom:30%;width:3px;background:rgba(160,30,70,.35);border-radius:2px}
      .cr-upper{position:absolute;left:2%;right:2%;top:0;height:54%;z-index:2;transition:transform .5s cubic-bezier(.3,1.3,.5,1)}
      .cr-croc.bite .cr-upper{transform:translateY(80%);transition:transform .14s cubic-bezier(.7,0,1,.6)}
      .cr-head{position:absolute;left:0;right:0;top:14%;bottom:30%;border-radius:46% 46% 18% 18%/60% 60% 20% 20%;background:linear-gradient(#5bd277,#36a854);box-shadow:inset 0 -8px 0 rgba(0,0,0,.1)}
      .cr-head::before{content:"";position:absolute;left:12%;right:12%;top:18%;height:40%;background:radial-gradient(circle,rgba(0,0,0,.12) 0 6%,transparent 7%) 0 0/34px 28px;border-radius:50%}
      .cr-nose{position:absolute;top:30%;width:7%;height:9%;border-radius:50%;background:#1f6b35}
      .cr-nose.l{left:41%}.cr-nose.r{right:41%}
      .cr-eye{position:absolute;top:0;width:26%;height:44%;border-radius:50% 50% 40% 40%;background:#4bc66a;box-shadow:inset 0 -6px 0 rgba(0,0,0,.1)}
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
      const cw = Math.round(U.clamp(Math.min(W * 0.92, (H - 20) / 1.04, 640), 260, 640));
      croc.style.setProperty("--cw", cw + "px");
      ctx.cw = cw;
    };
    addEventListener("resize", () => {
      if (ctx._active) {
        ctx.size();
        ctx.placeTeeth && ctx.placeTeeth();
      }
    });
  },
  start(ctx) {
    ctx.round = 0;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const n = [5, 7, 9][lv - 1];
    const croc = ctx.croc;
    croc.classList.remove("bite", "laugh");
    ctx.size();
    ctx.teethEl.innerHTML = "";
    const sore = U.rand(n);
    let busy = false,
      pressed = 0;
    ctx.say("악어 이빨을 하나씩 콕! 아픈 이빨을 누르면… 앙! 🐊");
    const teeth = [];
    for (let i = 0; i < n; i++) {
      const t = U.el("div", "cr-t", '<div class="cr-tv"></div>');
      t.dataset.tap = "1";
      ctx.teethEl.appendChild(t);
      teeth.push(t);
      ctx.fast(t, () => press(t, i));
    }
    // 아래턱 입 모양(U자)을 따라 이빨 배치
    ctx.placeTeeth = () => {
      const cw = ctx.cw;
      const mw = cw * 0.8,
        mh = cw * 0.54 * 0.88;
      const tw = Math.round(U.clamp((Math.PI * (mw / 2 + mh) * 0.5) / n, 46, cw * 0.15));
      ctx.teethEl.style.setProperty("--tw", tw + "px");
      const cx = cw / 2,
        top = tw * 0.32;
      const rx = mw / 2 - tw * 0.42,
        ry = mh - tw * 0.55;
      teeth.forEach((t, i) => {
        const th = Math.PI * (0.04 + (0.92 * (i + 0.5)) / n);
        const x = cx + rx * Math.cos(th),
          y = top + ry * Math.sin(th);
        t.style.left = x + "px";
        t.style.top = y + "px";
        t.style.rotate = ((th * 180) / Math.PI - 90).toFixed(1) + "deg";
      });
    };
    ctx.placeTeeth();
    // 눈동자가 누르는 이빨 쪽을 봄
    const look = (t) => {
      const cr = croc.getBoundingClientRect(),
        r = t.getBoundingClientRect();
      const dx = (r.left + r.width / 2 - cr.left) / cr.width - 0.5;
      ctx.pupils.forEach((p) => (p.style.transform = "translate(" + dx * 40 + "%," + 30 + "%)"));
    };
    const press = async (t, i) => {
      if (busy || t.classList.contains("down")) return;
      look(t);
      if (i !== sore) {
        t.classList.add("down");
        pressed++;
        A.tone(900, { to: 500, dur: 0.08, vol: 0.18 });
        A.note(A.SCALE[Math.min(pressed + 2, 11)], { inst: "marimba", dur: 0.25, vol: 0.2, when: 0.03 });
        const p = U.el("div", "cr-pop", U.pick(["뽁!", "쏙!", "콕!"]));
        p.style.left = t.style.left;
        p.style.top = parseFloat(t.style.top) + ctx.cw * 0.47 + "px";
        croc.appendChild(p);
        ctx.after(620, () => p.remove());
        ctx.score.add();
        if (pressed === n - 1) KP.voice.say("이제 하나 남았다! 두근두근!");
        else if (pressed % 3 === 0) KP.voice.say(U.pick(["괜찮아요!", "휴~ 다행이다!", "시원하다~"]));
        hint();
        return;
      }
      /* ---------- 앙! ---------- */
      busy = true;
      ctx.hint(null);
      t.classList.add("down");
      croc.classList.add("bite");
      A.kick({ vol: 0.7 });
      A.noise({ dur: 0.25, vol: 0.25, lp: 1200 });
      A.tone(300, { to: 90, dur: 0.3, vol: 0.2, type: "triangle" });
      U.replay(ctx.stage, "cr-shake");
      ctx.bigEl.textContent = "앙!";
      U.replay(ctx.bigEl, "show");
      KP.voice.say("앙! 아야야, 거기가 아픈 이빨이야!");
      await ctx.wait(1300);
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
      KP.voice.say("하하하! 깜짝 놀랐지?");
      await ctx.wait(1500);
      if (!ctx._active) return;
      croc.classList.remove("bite", "laugh");
      A.sfx("open");
      await ctx.wait(500);
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "용감한 형아!" : "깜짝 놀랐지?" });
      if (ok) this.next(ctx);
    };
    const hint = () => ctx.hint(() => teeth.find((t) => !t.classList.contains("down")), "이빨을 하나씩 콕 눌러 봐요!");
    hint();
  },
});
