/* 같은 색 풍선 — 말해 준 색깔 풍선만 팡! (풍선 터뜨리기와 같은 그림체)
   - 다른 색을 누르면 풍선이 통통 튕기며 "이건 ○○색이에요" (벌 없음)
   - 5개 터뜨리면 축하 후 색깔 바꾸기
   1단계: 2가지 색, 느리게 / 2단계: 3가지 색 / 3단계: 5가지 색, 빠르게 */
"use strict";
KP.game({
  id: "colorpop",
  icon: "🎯",
  name: "같은 색 풍선",
  cat: "play",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("colorpop", `
      .cp-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;touch-action:none;
        background:linear-gradient(180deg,#ffe7f3 0%,#e9f3ff 60%,#f4fff0 100%);box-shadow:var(--shadow)}
      .cp-field::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 30%,rgba(255,255,255,.8) 0 6%,transparent 7%),radial-gradient(circle at 80% 60%,rgba(255,255,255,.6) 0 4%,transparent 5%);pointer-events:none}
      .cp-grass{position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(#9be08a,#62c25c);border-radius:50% 50% 0 0/20px 20px 0 0}
      .cp-sign{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:6;display:flex;align-items:center;gap:10px;background:#fff;border-radius:999px;
        padding:6px 16px 6px 8px;box-shadow:0 5px 0 rgba(47,58,102,.12);pointer-events:none}
      .cp-sign>*{flex-shrink:0;white-space:nowrap}
      .cp-mini{width:clamp(34px,4.6vw,46px);height:clamp(40px,5.5vw,55px);border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 8%,var(--c) 45%,var(--d) 100%)}
      .cp-name{font-size:clamp(22px,3.4vw,32px);color:var(--d)}
      .cp-dots{display:flex;gap:6px}
      .cp-dot{width:clamp(14px,2vw,20px);height:clamp(14px,2vw,20px);border-radius:50%;background:#e7eaf4;transition:transform .2s}
      .cp-dot.on{background:var(--c);transform:scale(1.25);box-shadow:0 0 0 3px #fff,0 0 0 5px var(--c)}
      .cp-b{position:absolute;left:0;top:0;width:var(--w);height:calc(var(--w)*1.2);cursor:pointer;z-index:2}
      .cp-b.hintGlow{position:absolute;border-radius:50%}
      .cp-body{position:absolute;inset:0;border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 7%,var(--c) 45%,var(--d) 100%);
        box-shadow:inset -7px -10px 16px rgba(0,0,0,.16),0 8px 16px rgba(30,60,120,.15);transform-origin:50% 100%}
      .cp-body::before{content:"";position:absolute;left:17%;top:11%;width:21%;height:30%;border-radius:50%;background:rgba(255,255,255,.72);transform:rotate(26deg);filter:blur(1px)}
      .cp-body::after{content:"";position:absolute;left:41%;top:12%;width:7%;height:7%;border-radius:50%;background:rgba(255,255,255,.75)}
      .cp-knot{position:absolute;left:50%;bottom:-6%;width:16%;height:9%;margin-left:-8%;background:var(--d);clip-path:polygon(50% 0,92% 100%,8% 100%)}
      .cp-str{position:absolute;left:50%;top:102%;width:30px;margin-left:-15px;height:calc(var(--w)*.9);pointer-events:none;transform-origin:50% 0;animation:cp-sway 1.6s ease-in-out infinite alternate}
      .cp-str path{fill:none;stroke:rgba(80,90,130,.5);stroke-width:2;stroke-linecap:round}
      @keyframes cp-sway{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
      .cp-boing .cp-body{animation:cp-boing .55s}
      @keyframes cp-boing{20%{transform:scale(1.18,.78)}45%{transform:scale(.86,1.16)}65%{transform:scale(1.06,.94)}}
      .cp-tag{position:absolute;left:50%;bottom:105%;transform:translateX(-50%);white-space:nowrap;background:#fff;color:var(--d);font-size:clamp(18px,2.6vw,24px);
        padding:3px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.1);pointer-events:none;animation:cp-tag 1.4s forwards}
      @keyframes cp-tag{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}25%{transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0}}
      .cp-shard{position:absolute;width:var(--s);height:var(--s);background:var(--c);clip-path:polygon(50% 0,100% 70%,20% 100%);pointer-events:none;z-index:4;
        animation:cp-shard .7s cubic-bezier(.2,.7,.4,1) forwards}
      @keyframes cp-shard{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
      .cp-pang{position:absolute;font-size:clamp(28px,4.4vw,46px);color:#fff;-webkit-text-stroke:2px var(--d);paint-order:stroke;text-shadow:0 3px 0 var(--d);pointer-events:none;z-index:5;
        animation:cp-pang .7s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes cp-pang{0%{transform:translate(-50%,-50%) scale(.3)}40%{transform:translate(-50%,-80%) scale(1.15)}100%{transform:translate(-50%,-120%) scale(1);opacity:0}}
    `);
    // [이름(꾸밈), 이름(색), 색, 밝은색, 어두운색]
    ctx.COLORS = [
      ["빨간", "빨간색", "#ff4256", "#ffb3ba", "#c41a35"],
      ["노란", "노란색", "#ffd21f", "#fff3b0", "#c99a00"],
      ["초록", "초록색", "#33c76a", "#b9f5cd", "#178a40"],
      ["파란", "파란색", "#2f8cff", "#bfe0ff", "#1559c4"],
      ["보라", "보라색", "#9a5cff", "#ddd0ff", "#6230cf"],
      ["분홍", "분홍색", "#ff70b8", "#ffd0e7", "#d0377f"],
      ["주황", "주황색", "#ff8a1f", "#ffd6a3", "#c45e00"],
    ];
    const field = U.el("div", "cp-field");
    field.innerHTML = '<div class="cp-grass"></div>';
    const sign = U.el("div", "cp-sign", '<div class="cp-mini"></div><div class="cp-name"></div><div class="cp-dots"></div>');
    field.appendChild(sign);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.sign = sign;
    const dots = U.$(".cp-dots", sign);
    for (let i = 0; i < 5; i++) dots.appendChild(U.el("i", "cp-dot"));

    const PENTA = ["C6", "A5", "G5", "E5", "D5", "C5", "A4", "G4"];
    let lastTalk = 0;

    ctx.setTarget = (c) => {
      ctx.target = c;
      sign.style.cssText = "--c:" + c[2] + ";--l:" + c[3] + ";--d:" + c[4];
      U.$(".cp-name", sign).textContent = c[0] + " 풍선";
      U.$$(".cp-dot", sign).forEach((d) => d.classList.remove("on"));
      U.replay(sign, "pop");
    };

    ctx.make = (c) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const w = Math.round(U.clamp(Math.min(W, H) * 0.2, 80, 136) * U.randf(0.92, 1.12));
      const el = U.el("div", "cp-b");
      el.dataset.tap = "1";
      el.style.cssText = "--w:" + w + "px;--c:" + c[2] + ";--l:" + c[3] + ";--d:" + c[4];
      el.innerHTML = '<div class="cp-body"></div><div class="cp-knot"></div><svg class="cp-str" viewBox="0 0 30 100" preserveAspectRatio="none"><path d="M15 0 C 4 20, 26 40, 15 60 S 6 85, 15 100"/></svg>';
      const speed = [45, 62, 85][lv - 1] * U.randf(0.85, 1.2) * (H / 650 + 0.4);
      // 겹치지 않게 x 자리 고르기
      let x0 = U.randf(w * 0.6, W - w * 0.6);
      for (let k = 0; k < 6; k++) {
        if (ctx.balloons.every((o) => o.dead || o.y < H - o.h * 1.6 || Math.abs(o.x0 - x0) > w)) break;
        x0 = U.randf(w * 0.6, W - w * 0.6);
      }
      const b = { el, w, h: w * 1.2, c, x0, y: H + 10, speed, ph: Math.random() * 6.28, amp: U.randf(8, 20), fq: U.randf(0.6, 1.2), x: x0, dead: false, push: 0 };
      ctx.fast(el, (e) => {
        e.stopPropagation();
        ctx.touch(b);
      });
      field.appendChild(el);
      ctx.balloons.push(b);
      return b;
    };

    ctx.burst = (b, cx, cy) => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 6.28 + Math.random() * 0.4,
          d = b.w * U.randf(0.6, 1.1);
        const s = U.el("div", "cp-shard");
        s.style.cssText = "left:" + cx + "px;top:" + cy + "px;--s:" + Math.round(b.w * U.randf(0.12, 0.2)) + "px;--c:" + b.c[2] +
          ";--dx:" + Math.cos(a) * d + "px;--dy:" + (Math.sin(a) * d + 30) + "px;--r:" + U.rand(540) + "deg";
        field.appendChild(s);
        ctx.after(750, () => s.remove());
      }
      const t = U.el("div", "cp-pang", "팡!");
      t.style.cssText = "left:" + cx + "px;top:" + cy + "px;--d:" + b.c[4];
      field.appendChild(t);
      ctx.after(800, () => t.remove());
    };

    ctx.touch = async (b) => {
      if (b.dead || ctx.busy) return;
      if (b.c === ctx.target) {
        b.dead = true;
        b.el.remove();
        const k = U.clamp((b.w - 70) / 80, 0, 1);
        A.tone(1400 - k * 700, { to: 420, dur: 0.12, vol: 0.3 });
        A.noise({ dur: 0.08, vol: 0.18, hp: 2200 });
        A.note(PENTA[ctx.got % PENTA.length], { inst: "marimba", dur: 0.35, vol: 0.18, when: 0.03 });
        ctx.burst(b, b.x, b.y + b.h / 2);
        ctx.got++;
        const d = U.$$(".cp-dot", ctx.sign)[ctx.got - 1];
        if (d) d.classList.add("on");
        KP.voice.say(U.NAT[ctx.got] + "!");
        ctx.score.add();
        if (ctx.got >= 5) {
          ctx.busy = true;
          ctx.round++;
          const big = ctx.round % 4 === 0;
          const ok = await ctx.win({ big, msg: big ? "색깔 박사 형아!" : ctx.target[0] + " 풍선 다섯 개!" });
          if (ok) this.nextColor(ctx);
        } else this.hint(ctx);
      } else {
        // 다른 색 — 통통 튕기기
        U.replay(b.el, "cp-boing");
        b.push = 260;
        A.sfx("boing");
        const tag = U.el("div", "cp-tag", b.c[1]);
        b.el.appendChild(tag);
        ctx.after(1400, () => tag.remove());
        const now = Date.now();
        if (now - lastTalk > 1800) {
          lastTalk = now;
          KP.voice.say("이건 " + b.c[1] + "이에요. " + ctx.target[0] + " 풍선을 찾아요!");
        }
      }
    };

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const maxN = [5, 7, 8][lv - 1];
      const alive = ctx.balloons.filter((b) => !b.dead);
      ctx.spawnT -= dt;
      if (ctx.spawnT <= 0 && alive.length < maxN) {
        ctx.spawnT = [1.2, 0.95, 0.75][lv - 1] * U.randf(0.7, 1.3);
        const visibleTargets = alive.filter((b) => b.c === ctx.target && b.y > 30).length;
        const useTarget = visibleTargets === 0 || Math.random() < 0.42;
        ctx.make(useTarget ? ctx.target : U.pick(ctx.pool.filter((c) => c !== ctx.target)));
      }
      for (const b of alive) {
        b.push *= Math.pow(0.04, dt);
        b.y -= (b.speed + b.push) * dt;
        b.x = U.clamp(b.x0 + Math.sin(t * b.fq + b.ph) * b.amp, b.w / 2, W - b.w / 2);
        b.el.style.left = b.x - b.w / 2 + "px";
        b.el.style.top = b.y + "px";
        b.el.style.rotate = Math.sin(t * b.fq * 1.3 + b.ph) * 6 + "deg";
        if (b.y < -b.h * 2.2) {
          b.dead = true;
          b.el.remove();
        }
      }
      ctx.balloons = ctx.balloons.filter((b) => !b.dead);
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".cp-b,.cp-shard,.cp-pang").forEach((e) => e.remove());
    ctx.balloons = [];
    ctx.round = 0;
    ctx.prev = null;
    this.nextColor(ctx);
    requestAnimationFrame(() => {
      const H = ctx.field.clientHeight;
      [0.4, 0.7].forEach((p, i) => {
        const b = ctx.make(i === 0 ? ctx.target : U2(ctx));
        b.y = H * p;
      });
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    function U2(ctx) {
      return KP.u.pick(ctx.pool.filter((c) => c !== ctx.target));
    }
  },
  nextColor(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const n = [2, 3, 5][lv - 1];
    const choices = ctx.COLORS.filter((c) => c !== ctx.prev);
    const target = U.pick(choices);
    ctx.prev = target;
    ctx.pool = [target, ...U.sample(ctx.COLORS.filter((c) => c !== target), n - 1)];
    ctx.got = 0;
    ctx.busy = false;
    ctx.setTarget(target);
    ctx.spawnT = 0.3;
    ctx.say(target[0] + " 풍선만 콕! 터뜨려요!");
    this.hint(ctx);
  },
  hint(ctx) {
    ctx.hint(() => {
      const H = ctx.field.clientHeight;
      const t = ctx.balloons.filter((b) => !b.dead && b.c === ctx.target && b.y > 40 && b.y < H - b.h).sort((a, b) => b.y - a.y);
      return t[0] && t[0].el;
    }, ctx.target[0] + " 풍선을 찾아서 콕 눌러요!");
  },
});
