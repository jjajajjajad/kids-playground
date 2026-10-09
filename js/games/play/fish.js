/* 물고기 잡기 — 바닷속 친구들이 물결 따라 헤엄친다. 콕 누르면 뜰채로 쏙! 양동이로 휘익~
   - 물고기·열대어·복어·거북이·돌고래는 가는 방향을 바라보고 헤엄, 문어는 둥실, 꽃게는 모래 위 옆걸음
   - 10마리마다 축하 / 단계: 마릿수·속도 */
"use strict";
KP.game({
  id: "fish",
  icon: "🐟",
  name: "물고기 잡기",
  cat: "play",
  levels: 3,
  score: "🐟",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("fish", `
      .fs-sea{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#6fd6ff 0%,#2fa6e8 30%,#1677c9 70%,#0f5ea8 100%)}
      .fs-sea::before{content:"";position:absolute;left:0;right:0;top:0;height:16px;background:repeating-radial-gradient(circle at 20px -6px,rgba(255,255,255,.55) 0 14px,transparent 15px 40px);background-size:40px 16px;opacity:.8;animation:fs-surf 4s linear infinite}
      @keyframes fs-surf{to{background-position:40px 0}}
      .fs-ray{position:absolute;top:-5%;width:12%;height:85%;background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0));transform-origin:top;transform:rotate(14deg);pointer-events:none;animation:fs-ray 6s ease-in-out infinite alternate}
      @keyframes fs-ray{to{transform:rotate(6deg);opacity:.5}}
      .fs-sand{position:absolute;left:-5%;right:-5%;bottom:-30px;height:90px;border-radius:50% 50% 0 0/40px 40px 0 0;background:linear-gradient(#ffe2a3,#f2c46f);pointer-events:none}
      .fs-weed{position:absolute;bottom:20px;width:clamp(30px,4vw,46px);height:clamp(110px,22vh,190px);transform-origin:50% 100%;pointer-events:none;animation:fs-weed 3.2s ease-in-out infinite alternate}
      .fs-weed path{fill:none;stroke-width:10;stroke-linecap:round}
      @keyframes fs-weed{from{transform:rotate(-7deg) skewX(-4deg)}to{transform:rotate(7deg) skewX(4deg)}}
      .fs-deco{position:absolute;bottom:16px;font-size:clamp(32px,5vw,54px);pointer-events:none}
      .fs-bub{position:absolute;bottom:-20px;width:var(--s);height:var(--s);border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(255,255,255,.12);pointer-events:none;
        animation:fs-bub var(--t) linear infinite;animation-delay:var(--dl)}
      @keyframes fs-bub{0%{transform:translate(0,0)}25%{transform:translate(8px,-25vh)}50%{transform:translate(-6px,-50vh)}75%{transform:translate(6px,-75vh)}100%{transform:translate(0,-110vh)}}
      .fs-c{position:absolute;left:0;top:0;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;z-index:2;cursor:pointer}
      .fs-c.hintGlow{position:absolute;border-radius:50%}
      .fs-i{width:100%;height:100%;transition:transform .3s}
      .fs-i .e{width:100%;height:100%;display:block}
      .fs-c.crab .fs-i .e{animation:fs-crab .35s ease-in-out infinite alternate}
      @keyframes fs-crab{from{transform:rotate(-6deg) translateY(0)}to{transform:rotate(6deg) translateY(-4px)}}
      .fs-c.octo .fs-i .e{animation:fs-octo 1.2s ease-in-out infinite}
      @keyframes fs-octo{50%{transform:scale(.9,1.12)}}
      .fs-c.swim .fs-i .e{animation:fs-swim .5s ease-in-out infinite alternate}
      @keyframes fs-swim{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
      .fs-net{position:absolute;width:calc(var(--s)*1.5);height:calc(var(--s)*1.5);left:calc(var(--s)*-.25);top:calc(var(--s)*-.25);pointer-events:none;z-index:3;
        animation:fs-net .35s cubic-bezier(.3,1.4,.5,1)}
      .fs-hoop{position:absolute;inset:0;border-radius:50%;border:clamp(4px,.6vw,7px) solid #b7793a;box-shadow:0 0 0 2px #7b4a1d inset;
        background:repeating-linear-gradient(45deg,rgba(255,255,255,.55) 0 2px,transparent 2px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.55) 0 2px,transparent 2px 12px)}
      .fs-stick{position:absolute;left:84%;top:84%;width:clamp(10px,1.2vw,14px);height:calc(var(--s)*1.4);border-radius:8px;background:linear-gradient(90deg,#d79a55,#9b6230);transform-origin:50% 0;transform:rotate(-45deg)}
      @keyframes fs-net{from{transform:translate(60%,60%) rotate(40deg) scale(.4);opacity:0}}
      .fs-bucket{position:absolute;right:10px;bottom:8px;width:clamp(86px,12vw,128px);height:clamp(86px,12vw,128px);z-index:4;pointer-events:none}
      .fs-bucket>.e{width:100%;height:100%;position:relative;z-index:2}
      .fs-peek{position:absolute;left:14%;right:14%;top:-6%;height:44%;display:flex;justify-content:center;z-index:1}
      .fs-peek .e{width:45%;height:auto;margin:0 -8%;animation:fs-swim .6s ease-in-out infinite alternate}
      .fs-cnt{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);z-index:3;font-size:clamp(26px,3.8vw,40px);color:#fff;-webkit-text-stroke:3px #1f6fd0;paint-order:stroke}
      .fs-splash{position:absolute;width:10px;height:10px;border-radius:50%;background:#bfe9ff;z-index:5;pointer-events:none;animation:fs-splash .5s ease-out forwards}
      @keyframes fs-splash{to{transform:translate(var(--dx),var(--dy));opacity:0}}
    `);
    const sea = U.el("div", "fs-sea");
    sea.dataset.tap = "1";
    let html = '<div class="fs-ray" style="left:10%"></div><div class="fs-ray" style="left:40%;animation-delay:-2s"></div><div class="fs-ray" style="left:72%;animation-delay:-4s"></div>';
    for (let i = 0; i < 10; i++)
      html += '<div class="fs-bub" style="left:' + U.rand(96) + "%;--s:" + (6 + U.rand(12)) + "px;--t:" + (5 + U.rand(6)) + "s;--dl:-" + U.rand(10) + 's"></div>';
    html += '<div class="fs-sand"></div>';
    [["4%", "#2fa35a", 0], ["10%", "#47c46f", -1.2], ["58%", "#2fa35a", -0.6], ["86%", "#3fbb68", -2]].forEach(([x, c, d]) => {
      html += '<svg class="fs-weed" viewBox="0 0 40 120" preserveAspectRatio="none" style="left:' + x + ";animation-delay:" + d + 's"><path stroke="' + c + '" d="M20 118 C 4 95, 36 75, 20 52 S 8 20, 24 4"/></svg>';
    });
    html += '<div class="fs-deco" style="left:22%">' + KP.E("🪸") + '</div><div class="fs-deco" style="left:44%;font-size:clamp(22px,3vw,32px)">' + KP.E("🐚") + '</div><div class="fs-deco" style="left:70%">' + KP.E("🪸") + "</div>";
    sea.innerHTML = html;
    const bucket = U.el("div", "fs-bucket", '<div class="fs-peek"></div>' + KP.E("🪣") + '<div class="fs-cnt">0</div>');
    sea.appendChild(bucket);
    ctx.body.appendChild(sea);
    ctx.sea = sea;
    ctx.bucket = bucket;

    // [이모지, 이름, 종류, 그림이 보는 방향(-1 왼쪽, 1 오른쪽, 0 정면)]
    ctx.KINDS = [
      ["🐟", "물고기", "swim", -1], ["🐠", "열대어", "swim", -1], ["🐡", "복어", "swim", -1], ["🐟", "물고기", "swim", -1], ["🐠", "열대어", "swim", -1],
      ["🐢", "거북이", "swim", -1], ["🐬", "돌고래", "swim", -1], ["🐙", "문어", "octo", 0], ["🦀", "꽃게", "crab", 0], ["🦑", "오징어", "octo", 0],
    ];

    ctx.spawn = (fromInside) => {
      const W = sea.clientWidth,
        H = sea.clientHeight;
      const lv = ctx.level;
      let k = U.pick(ctx.KINDS);
      if (k[2] === "crab" && ctx.fish.some((f) => f.kind === "crab")) k = ctx.KINDS[0];
      const base = U.clamp(Math.min(W, H) * 0.17, 74, 130);
      const s = Math.round(base * (k[0] === "🐬" || k[0] === "🐢" ? 1.25 : U.randf(0.9, 1.1)));
      const el = U.el("div", "fs-c " + k[2], '<div class="fs-i">' + KP.E(k[0]) + "</div>");
      el.style.setProperty("--s", s + "px");
      el.dataset.tap = "1";
      const dir = Math.random() < 0.5 ? 1 : -1;
      const sp = [55, 80, 110][lv - 1] * U.randf(0.8, 1.2) * (W / 1000 + 0.5);
      const f = { el, s, kind: k[2], face: k[3], name: k[1], dir, sp, ph: Math.random() * 6.28, amp: U.randf(10, 30), dead: false, t: 0 };
      const top = 30,
        bottom = H - 70 - s;
      if (f.kind === "crab") {
        f.y = H - 30 - s;
        f.x = fromInside ? U.randf(0, W - s) : dir > 0 ? -s : W;
        f.sp *= 0.6;
      } else if (f.kind === "octo") {
        f.x = U.randf(s, W - 2 * s);
        f.y = fromInside ? U.randf(top, bottom) : H;
        f.vx = dir * f.sp * 0.4;
        f.vy = -f.sp * 0.5;
      } else {
        f.x = fromInside ? U.randf(0, W - s) : dir > 0 ? -s : W;
        f.y0 = U.randf(top, Math.max(top, bottom - 40));
        f.y = f.y0;
      }
      ctx.fast(el, (e) => {
        e.stopPropagation();
        ctx.catchIt(f);
      });
      sea.insertBefore(el, bucket);
      ctx.fish.push(f);
    };

    ctx.place = (f) => {
      f.el.style.left = f.x + "px";
      f.el.style.top = f.y + "px";
      const goingRight = (f.vx != null ? f.vx : f.dir) > 0;
      const flip = f.face !== 0 && (goingRight ? f.face < 0 : f.face > 0);
      f.el.firstChild.style.transform = flip ? "scaleX(-1)" : "";
    };

    ctx.catchIt = (f) => {
      if (f.dead) return;
      f.dead = true;
      const net = U.el("div", "fs-net", '<div class="fs-stick"></div><div class="fs-hoop"></div>');
      f.el.appendChild(net);
      A.sfx("water");
      A.tone(300, { to: 900, dur: 0.15, vol: 0.12 });
      if (ctx.count % 2 === 0) KP.voice.say(U.josa(f.name, "을/를") + " 잡았다!");
      else KP.voice.say(U.pick(["잡았다!", "뜰채로 쏙!", f.name + "!"]));
      ctx.after(380, () => {
        const sr = ctx.sea.getBoundingClientRect(),
          br = ctx.bucket.getBoundingClientRect(),
          fr = f.el.getBoundingClientRect();
        const dx = br.left + br.width / 2 - (fr.left + fr.width / 2),
          dy = br.top + br.height * 0.3 - (fr.top + fr.height / 2);
        net.remove();
        A.sfx("whoosh");
        const an = f.el.animate(
          [
            { transform: "translate(0,0) scale(1) rotate(0)" },
            { transform: "translate(" + dx * 0.5 + "px," + (Math.min(dy, 0) * 0.5 - 140) + "px) scale(.85) rotate(" + (dx > 0 ? 200 : -200) + "deg)" },
            { transform: "translate(" + dx + "px," + dy + "px) scale(.35) rotate(" + (dx > 0 ? 360 : -360) + "deg)" },
          ],
          { duration: 750, easing: "cubic-bezier(.4,.1,.6,1)", fill: "forwards" }
        );
        an.onfinish = () => {
          f.gone = true;
          f.el.remove();
          ctx.inBucket(f, br.left - sr.left + br.width / 2, br.top - sr.top + br.height * 0.3);
        };
      });
    };

    ctx.inBucket = (f, x, y) => {
      if (!ctx._active) return;
      A.noise({ dur: 0.3, vol: 0.14, bp: 1200, bpTo: 400, q: 1 });
      A.note("C6", { inst: "bell", dur: 0.3, vol: 0.1, when: 0.05 });
      for (let i = 0; i < 6; i++) {
        const s = U.el("div", "fs-splash");
        const a = Math.PI + (i / 5) * Math.PI;
        s.style.cssText = "left:" + x + "px;top:" + y + "px;--dx:" + Math.cos(a) * 40 + "px;--dy:" + Math.sin(a) * 40 + "px";
        ctx.sea.appendChild(s);
        ctx.after(520, () => s.remove());
      }
      ctx.count++;
      ctx.score.add();
      U.$(".fs-cnt", ctx.bucket).textContent = ctx.count;
      U.replay(ctx.bucket, "jump");
      const peek = U.$(".fs-peek", ctx.bucket);
      ctx.peekList.push(U.$(".fs-i", f.el) ? f.el.querySelector(".e").outerHTML : "");
      peek.innerHTML = ctx.peekList.slice(-3).join("");
      if (ctx.count % 10 === 0) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.win({ big, msg: big ? "낚시왕 형아!" : ctx.count + "마리 잡았다!" });
      }
    };

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = ctx.sea.clientWidth,
        H = ctx.sea.clientHeight;
      const lv = ctx.level;
      const want = [4, 6, 7][lv - 1];
      const alive = ctx.fish.filter((f) => !f.dead);
      ctx.spawnT -= dt;
      if (alive.length < want && ctx.spawnT <= 0) {
        ctx.spawn(false);
        ctx.spawnT = 0.6;
      }
      for (const f of alive) {
        f.t += dt;
        if (f.kind === "crab") {
          f.x += f.dir * f.sp * dt;
          if (Math.random() < dt * 0.3) f.dir *= -1; // 가끔 방향 바꾸기
          if (f.x < -f.s * 1.2 || f.x > W + f.s * 0.2) f.gone = true;
        } else if (f.kind === "octo") {
          f.x += f.vx * dt;
          f.y += f.vy * dt + Math.sin(t * 2 + f.ph) * 0.6;
          if (f.y < 30) f.vy = Math.abs(f.vy);
          if (f.y > H - 80 - f.s && f.t > 3) f.vy = -Math.abs(f.vy);
          if (f.x < 0) f.vx = Math.abs(f.vx);
          if (f.x > W - f.s - 90) f.vx = -Math.abs(f.vx);
          if (f.t > 14) f.gone = true;
        } else {
          f.x += f.dir * f.sp * dt;
          f.y = f.y0 + Math.sin(t * 1.6 + f.ph) * f.amp;
          if ((f.dir > 0 && f.x > W + 10) || (f.dir < 0 && f.x < -f.s - 10)) f.gone = true;
        }
        if (f.gone) {
          f.dead = true;
          f.el.remove();
          continue;
        }
        ctx.place(f);
      }
      ctx.fish = ctx.fish.filter((f) => !f.gone);
    };
  },
  start(ctx) {
    ctx.sea.querySelectorAll(".fs-c,.fs-splash").forEach((e) => e.remove());
    ctx.fish = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.peekList = [];
    ctx.spawnT = 0.5;
    KP.u.$(".fs-cnt", ctx.bucket).textContent = "0";
    KP.u.$(".fs-peek", ctx.bucket).innerHTML = "";
    ctx.say("헤엄치는 친구를 콕! 뜰채로 잡아서 양동이에 쏙! 🪣");
    requestAnimationFrame(() => {
      for (let i = 0; i < 3; i++) ctx.spawn(true);
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    ctx.hint(() => {
      const W = ctx.sea.clientWidth;
      const f = ctx.fish.find((f) => !f.dead && f.x > 20 && f.x < W - f.s - 20);
      return f && f.el;
    }, "헤엄치는 친구를 콕 눌러요!");
  },
});
