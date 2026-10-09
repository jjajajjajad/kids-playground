/* 풍선 터뜨리기 — CSS로 그린 진짜 풍선이 흔들흔들 올라온다. 콕! 누르면 팡!
   - 풍선 크기에 따라 터지는 소리 높이가 다름 (큰 풍선 = 낮은 소리)
   - 특별 풍선: 🎁 선물 풍선(동물 친구가 튀어나와 이름을 말함), ⭐ 별 풍선(+3)
   - 10개마다 축하 / 1단계: 느리고 적게 → 3단계: 빠르고 많이 */
"use strict";
KP.game({
  id: "balloon",
  icon: "🎈",
  name: "풍선 터뜨리기",
  cat: "play",
  levels: 3,
  score: "🎈",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("balloon", `
      .bl-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;touch-action:none;
        background:linear-gradient(180deg,#7cc8ff 0%,#b5e2ff 55%,#e3f6ff 100%);box-shadow:var(--shadow)}
      .bl-sun{position:absolute;right:6%;top:7%;width:clamp(60px,9vw,110px);aspect-ratio:1;border-radius:50%;
        background:radial-gradient(circle,#fff6b0 0 45%,#ffd84a 70%,rgba(255,216,74,0) 72%);box-shadow:0 0 60px 20px rgba(255,236,140,.55);animation:bl-sun 6s ease-in-out infinite}
      @keyframes bl-sun{50%{transform:scale(1.07)}}
      .bl-cloud{position:absolute;height:clamp(26px,4vw,44px);width:clamp(90px,14vw,170px);border-radius:999px;background:#fff;opacity:.9;
        box-shadow:clamp(20px,3vw,40px) calc(clamp(10px,1.6vw,20px)*-1) 0 4px #fff;animation:bl-cloud linear infinite}
      @keyframes bl-cloud{from{transform:translateX(-30vw)}to{transform:translateX(120vw)}}
      .bl-hill{position:absolute;bottom:-60px;border-radius:50%;background:linear-gradient(#8fdc7a,#5fbf5a)}
      .bl-b{position:absolute;left:0;top:0;width:var(--w);height:calc(var(--w)*1.2);cursor:pointer;z-index:2}
      .bl-b.hintGlow{position:absolute;border-radius:50%}
      .bl-body{position:absolute;inset:0;border-radius:50% 50% 46% 46%/56% 56% 44% 44%;
        background:radial-gradient(circle at 33% 27%,var(--l) 0 7%,var(--c) 45%,var(--d) 100%);
        box-shadow:inset -7px -10px 16px rgba(0,0,0,.16),0 8px 16px rgba(30,60,120,.15)}
      .bl-body::before{content:"";position:absolute;left:17%;top:11%;width:21%;height:30%;border-radius:50%;background:rgba(255,255,255,.72);transform:rotate(26deg);filter:blur(1px)}
      .bl-body::after{content:"";position:absolute;left:41%;top:12%;width:7%;height:7%;border-radius:50%;background:rgba(255,255,255,.75)}
      .bl-knot{position:absolute;left:50%;bottom:-6%;width:16%;height:9%;margin-left:-8%;background:var(--d);clip-path:polygon(50% 0,92% 100%,8% 100%);border-radius:3px}
      .bl-str{position:absolute;left:50%;top:102%;width:30px;margin-left:-15px;height:calc(var(--w)*.95);pointer-events:none;transform-origin:50% 0;animation:bl-sway 1.6s ease-in-out infinite alternate}
      .bl-str path{fill:none;stroke:rgba(80,90,130,.55);stroke-width:2;stroke-linecap:round}
      @keyframes bl-sway{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
      .bl-gift{position:absolute;left:50%;top:calc(102% + var(--w)*.8);font-size:calc(var(--w)*.48);margin-left:calc(var(--w)*-.24);line-height:1;pointer-events:none;animation:bl-sway 1.6s ease-in-out infinite alternate-reverse}
      .bl-star{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--w)*.5);pointer-events:none;animation:bl-twk 1s ease-in-out infinite}
      .bl-b.star .bl-body{box-shadow:inset -7px -10px 16px rgba(0,0,0,.12),0 0 26px 6px rgba(255,220,80,.7)}
      @keyframes bl-twk{50%{transform:scale(1.15) rotate(10deg)}}
      .bl-shard{position:absolute;width:var(--s);height:var(--s);background:var(--c);clip-path:polygon(50% 0,100% 70%,20% 100%);pointer-events:none;z-index:4;
        animation:bl-shard .7s cubic-bezier(.2,.7,.4,1) forwards}
      @keyframes bl-shard{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
      .bl-ring{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:4px solid var(--c);pointer-events:none;z-index:4;animation:bl-ring .45s ease-out forwards}
      @keyframes bl-ring{to{transform:scale(var(--k));opacity:0}}
      .bl-pang{position:absolute;font-size:clamp(28px,4.4vw,46px);color:#fff;-webkit-text-stroke:2px var(--d);paint-order:stroke;text-shadow:0 3px 0 var(--d);pointer-events:none;z-index:5;
        transform:translate(-50%,-50%);animation:bl-pang .7s cubic-bezier(.2,1.6,.4,1) forwards}
      @keyframes bl-pang{0%{transform:translate(-50%,-50%) scale(.3)}40%{transform:translate(-50%,-80%) scale(1.15)}100%{transform:translate(-50%,-120%) scale(1);opacity:0}}
      .bl-friend{position:absolute;font-size:clamp(90px,15vw,150px);line-height:1;z-index:6;pointer-events:none;transform:translate(-50%,-50%);
        animation:bl-friend 2.3s cubic-bezier(.2,1.4,.4,1) forwards;filter:drop-shadow(0 8px 6px rgba(0,0,0,.18))}
      .bl-friend b{position:absolute;left:50%;top:100%;transform:translateX(-50%);font-size:.26em;font-weight:400;color:#fff;background:var(--coral);padding:2px 12px;border-radius:999px;white-space:nowrap}
      @keyframes bl-friend{0%{transform:translate(-50%,-50%) scale(.1) rotate(-30deg)}25%{transform:translate(-50%,-70%) scale(1.15) rotate(6deg)}35%{transform:translate(-50%,-62%) scale(1) rotate(0)}
        80%{transform:translate(-50%,-62%) scale(1);opacity:1}100%{transform:translate(-50%,-130%) scale(.7);opacity:0}}
    `);
    const field = U.el("div", "bl-field");
    field.innerHTML =
      '<div class="bl-sun"></div>' +
      '<div class="bl-cloud" style="top:12%;animation-duration:70s;animation-delay:-20s"></div>' +
      '<div class="bl-cloud" style="top:32%;animation-duration:95s;animation-delay:-70s;transform:scale(.7)"></div>' +
      '<div class="bl-hill" style="left:-10%;width:70%;height:150px"></div>' +
      '<div class="bl-hill" style="right:-15%;width:75%;height:130px;background:linear-gradient(#a6e58f,#6cc764)"></div>';
    ctx.body.appendChild(field);
    ctx.field = field;

    ctx.COLORS = [
      ["#ff4d5e", "#ffb3ba", "#c81e3a"], ["#ff9a2e", "#ffd6a3", "#d06a00"], ["#ffd23f", "#fff3b0", "#d6a400"],
      ["#3ccf6e", "#b9f5cd", "#1f9a4c"], ["#3aa0ff", "#bfe0ff", "#1f6fd0"], ["#9a6bff", "#ddd0ff", "#6a3fd4"], ["#ff6fb5", "#ffd0e7", "#d33f8a"],
    ];
    ctx.FRIENDS = [
      ["🐶", "강아지"], ["🐱", "고양이"], ["🐰", "토끼"], ["🐻", "곰돌이"], ["🐼", "판다"], ["🦁", "사자"], ["🐯", "호랑이"],
      ["🐵", "원숭이"], ["🐷", "돼지"], ["🦊", "여우"], ["🐨", "코알라"], ["🐸", "개구리"], ["🐧", "펭귄"], ["🦄", "유니콘"], ["🦖", "공룡"],
    ];

    /* ---------- 소리 ---------- */
    const PENTA = ["C6", "A5", "G5", "E5", "D5", "C5", "A4", "G4"];
    ctx.popSound = (w) => {
      // 작을수록 높은 소리
      const k = U.clamp((w - 70) / 90, 0, 1);
      const f = 1500 - k * 900;
      A.tone(f, { to: f * 0.32, dur: 0.13, vol: 0.3 });
      A.noise({ dur: 0.09, vol: 0.2, hp: 1400 + (1 - k) * 2000 });
      A.note(PENTA[Math.round(k * (PENTA.length - 1))], { inst: "marimba", dur: 0.35, vol: 0.16, when: 0.03 });
    };

    /* ---------- 풍선 ---------- */
    let uid = 0;
    ctx.make = (kind) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const base = U.clamp(Math.min(W, H) * 0.2, 78, 140);
      const w = Math.round(base * U.randf(lv === 3 ? 0.8 : 0.9, 1.15) * (kind ? 1.08 : 1));
      const col = kind === "star" ? ["#ffcf33", "#fff6c4", "#e09a00"] : U.pick(ctx.COLORS);
      const el = U.el("div", "bl-b" + (kind ? " " + kind : ""));
      el.dataset.tap = "1";
      el.style.cssText = "--w:" + w + "px;--c:" + col[0] + ";--l:" + col[1] + ";--d:" + col[2];
      el.innerHTML =
        '<div class="bl-body"></div><div class="bl-knot"></div>' +
        '<svg class="bl-str" viewBox="0 0 30 100" preserveAspectRatio="none"><path d="M15 0 C 4 20, 26 40, 15 60 S 6 85, 15 100"/></svg>' +
        (kind === "gift" ? '<div class="bl-gift">' + KP.E("🎁") + "</div>" : "") +
        (kind === "star" ? '<div class="bl-star">' + KP.E("⭐") + "</div>" : "");
      const speed = [55, 78, 105][lv - 1] * U.randf(0.85, 1.2) * (H / 650 + 0.4);
      const b = { id: ++uid, el, w, h: w * 1.2, col, kind, x0: U.randf(w * 0.6, W - w * 0.6), y: H + 20, speed, ph: Math.random() * 6.28, amp: U.randf(8, 26), fq: U.randf(0.7, 1.3), x: 0, dead: false };
      ctx.fast(el, (e) => {
        e.stopPropagation();
        ctx.pop(b);
      });
      field.appendChild(el);
      ctx.balloons.push(b);
      return b;
    };

    ctx.burst = (b, cx, cy) => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + Math.random() * 0.4,
          d = b.w * U.randf(0.6, 1.1);
        const s = U.el("div", "bl-shard");
        s.style.cssText = "left:" + cx + "px;top:" + cy + "px;--s:" + Math.round(b.w * U.randf(0.12, 0.2)) + "px;--c:" + b.col[0] +
          ";--dx:" + Math.cos(a) * d + "px;--dy:" + (Math.sin(a) * d + 30) + "px;--r:" + U.rand(540) + "deg";
        field.appendChild(s);
        ctx.after(750, () => s.remove());
      }
      const r = U.el("div", "bl-ring");
      r.style.cssText = "left:" + cx + "px;top:" + cy + "px;--c:" + b.col[1] + ";--k:" + b.w / 9;
      field.appendChild(r);
      const t = U.el("div", "bl-pang", U.pick(["팡!", "펑!", "빵!", "팡!"]));
      t.style.cssText = "left:" + cx + "px;top:" + cy + "px;--d:" + b.col[2];
      field.appendChild(t);
      ctx.after(800, () => {
        r.remove();
        t.remove();
      });
    };

    ctx.pop = (b) => {
      if (b.dead) return;
      b.dead = true;
      const cx = b.x,
        cy = b.y + b.h / 2;
      b.el.remove();
      ctx.popSound(b.w);
      ctx.burst(b, cx, cy);
      let add = 1;
      if (b.kind === "star") {
        add = 3;
        A.sfx("sparkle");
        const t = U.el("div", "bl-pang", "+3");
        t.style.cssText = "left:" + cx + "px;top:" + (cy - b.w * 0.5) + "px;--d:#e09a00;font-size:clamp(40px,6vw,64px)";
        field.appendChild(t);
        ctx.after(800, () => t.remove());
        KP.voice.say("반짝 별 풍선! 세 개!");
      } else if (b.kind === "gift") {
        const [em, name] = U.pick(ctx.FRIENDS);
        const f = U.el("div", "bl-friend", KP.E(em) + "<b>" + name + "</b>");
        const fx = U.clamp(cx, 80, field.clientWidth - 80),
          fy = U.clamp(cy + b.w * 0.6, 110, field.clientHeight - 80);
        f.style.left = fx + "px";
        f.style.top = fy + "px";
        field.appendChild(f);
        ctx.after(2400, () => f.remove());
        ctx.after(120, () => A.sfx("levelup"));
        KP.voice.say("짠! " + name + "!");
      }
      const prev = ctx.count;
      ctx.count += add;
      ctx.score.add(add);
      if (Math.floor(ctx.count / 10) > Math.floor(prev / 10)) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.after(b.kind === "gift" ? 1300 : 250, () => ctx.win({ big, msg: big ? "풍선 대장 형아!" : ctx.count + "개 팡팡!" }));
      }
    };

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const maxN = [5, 7, 9][lv - 1];
      ctx.spawnT -= dt;
      const alive = ctx.balloons.filter((b) => !b.dead);
      if (ctx.spawnT <= 0 && alive.length < maxN) {
        ctx.spawnT = [1.1, 0.8, 0.6][lv - 1] * U.randf(0.7, 1.3);
        const r = Math.random();
        ctx.make(r < 0.08 ? "star" : r < 0.18 ? "gift" : null);
      }
      for (const b of ctx.balloons) {
        if (b.dead) continue;
        b.y -= b.speed * dt;
        b.x = U.clamp(b.x0 + Math.sin(t * b.fq + b.ph) * b.amp, b.w / 2, W - b.w / 2);
        const rot = Math.sin(t * b.fq * 1.3 + b.ph) * 6;
        // left/top 으로 위치 (힌트 반짝임이 transform 을 쓰기 때문)
        b.el.style.left = b.x - b.w / 2 + "px";
        b.el.style.top = b.y + "px";
        b.el.style.rotate = rot + "deg";
        if (b.y < -b.h * 2.4) {
          b.dead = true;
          b.el.remove();
        }
      }
      ctx.balloons = ctx.balloons.filter((b) => !b.dead);
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".bl-b,.bl-shard,.bl-ring,.bl-pang,.bl-friend").forEach((e) => e.remove());
    ctx.balloons = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.spawnT = 0.2;
    ctx.say("풍선을 콕! 눌러서 팡 터뜨려 봐요! 🎈");
    requestAnimationFrame(() => {
      // 처음부터 화면에 풍선 몇 개
      const H = ctx.field.clientHeight;
      [0.35, 0.6, 0.85].forEach((p, i) => {
        const b = ctx.make(i === 1 ? "gift" : null);
        b.y = H * p;
      });
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    ctx.hint(() => {
      const alive = ctx.balloons.filter((b) => !b.dead && b.y > 0 && b.y < ctx.field.clientHeight - b.h);
      alive.sort((a, b) => b.y - a.y);
      return alive[0] && alive[0].el;
    }, "풍선을 콕 눌러 봐요!");
  },
});
