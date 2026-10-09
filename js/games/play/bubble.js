/* 비눗방울 팡팡 — 무지갯빛 비눗방울이 둥실둥실. 콕 누르거나 손가락으로 쓸면 팡!
   - 어떤 방울 안에는 작은 동물이 갇혀 있다 → 터뜨리면 기뻐하며 떨어져 나와 이름을 말함
   - 10개마다 축하 / 단계: 방울 수·속도 */
"use strict";
KP.game({
  id: "bubble",
  icon: "🫧",
  name: "비눗방울 팡팡",
  cat: "play",
  levels: 3,
  score: "🫧",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("bubble", `
      .bb-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;touch-action:none;
        background:radial-gradient(120% 80% at 50% 0%,#e9fbff 0%,rgba(233,251,255,0) 60%),linear-gradient(180deg,#9fe3ff 0%,#c9f0ff 55%,#fff3d6 100%);box-shadow:var(--shadow)}
      .bb-ray{position:absolute;top:-10%;width:18%;height:120%;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0));transform:rotate(18deg);transform-origin:top;pointer-events:none;animation:bb-ray 7s ease-in-out infinite alternate}
      @keyframes bb-ray{to{opacity:.35;transform:rotate(12deg)}}
      .bb-grass{position:absolute;left:-5%;right:-5%;bottom:-24px;height:70px;border-radius:50% 50% 0 0;background:linear-gradient(#8ddc7a,#55b955);pointer-events:none}
      .bb-flower{position:absolute;bottom:14px;font-size:clamp(26px,4vw,40px);pointer-events:none}
      .bb{position:absolute;left:0;top:0;width:var(--d);height:var(--d);border-radius:50%;pointer-events:none;z-index:2}
      .bb.hintGlow{position:absolute}
      .bb-in{position:absolute;inset:0;border-radius:50%;animation:bb-wob 2.4s ease-in-out infinite;
        background:radial-gradient(circle at 50% 50%,rgba(255,255,255,0) 55%,rgba(255,255,255,.22) 66%,rgba(255,255,255,.7) 71%,rgba(255,255,255,0) 72%)}
      .bb-in::before{content:"";position:absolute;inset:0;border-radius:50%;
        background:conic-gradient(from var(--h,0deg),#ff9ad5,#ffe38a,#9dffb0,#8fd8ff,#c39bff,#ff9ad5);opacity:.55;
        -webkit-mask:radial-gradient(circle,transparent 60%,#000 68%,#000 70%,transparent 71%);mask:radial-gradient(circle,transparent 60%,#000 68%,#000 70%,transparent 71%);
        animation:bb-spin 5s linear infinite}
      .bb-in::after{content:"";position:absolute;left:18%;top:14%;width:26%;height:16%;border-radius:50%;background:rgba(255,255,255,.9);transform:rotate(-35deg);
        box-shadow:calc(var(--d)*.42) calc(var(--d)*.46) 0 -2px rgba(255,255,255,.45)}
      @keyframes bb-wob{25%{transform:scale(1.04,.96)}50%{transform:scale(.97,1.03)}75%{transform:scale(1.02,.98)}}
      @keyframes bb-spin{to{transform:rotate(360deg)}}
      .bb-pet{position:absolute;inset:22%;font-size:calc(var(--d)*.5);line-height:1;display:flex;align-items:center;justify-content:center;animation:bb-pet 3s ease-in-out infinite;opacity:.95}
      @keyframes bb-pet{50%{transform:rotate(12deg) scale(.95)}}
      .bb-pop{position:absolute;width:var(--d);height:var(--d);margin:calc(var(--d)/-2) 0 0 calc(var(--d)/-2);border-radius:50%;pointer-events:none;z-index:3;
        border:3px dashed rgba(255,255,255,.95);animation:bb-pop .32s ease-out forwards}
      @keyframes bb-pop{to{transform:scale(1.35);opacity:0}}
      .bb-drop{position:absolute;width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,rgba(160,220,255,.7));pointer-events:none;z-index:3;
        animation:bb-drop .55s ease-out forwards}
      @keyframes bb-drop{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
      .bb-free{position:absolute;font-size:clamp(70px,11vw,110px);line-height:1;z-index:5;pointer-events:none;margin:-.5em 0 0 -.5em}
      .bb-free b{position:absolute;left:50%;bottom:105%;transform:translateX(-50%);font-size:.28em;font-weight:400;white-space:nowrap;background:#fff;color:var(--ink);
        padding:2px 12px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.1);animation:popBig .4s cubic-bezier(.2,1.6,.4,1)}
      .bb-heart{position:absolute;font-size:clamp(22px,3vw,30px);pointer-events:none;z-index:5;animation:bb-heart 1.1s ease-out forwards}
      @keyframes bb-heart{to{transform:translate(var(--dx),-90px) scale(1.3);opacity:0}}
    `);
    const field = U.el("div", "bb-field");
    field.innerHTML =
      '<div class="bb-ray" style="left:12%"></div><div class="bb-ray" style="left:46%;animation-delay:-3s"></div><div class="bb-ray" style="left:78%;animation-delay:-5s"></div>' +
      '<div class="bb-grass"></div>' +
      '<div class="bb-flower" style="left:6%">' + KP.E("🌷") + '</div><div class="bb-flower" style="left:30%">' + KP.E("🌼") + "</div>" +
      '<div class="bb-flower" style="right:24%">' + KP.E("🌸") + '</div><div class="bb-flower" style="right:5%">' + KP.E("🌷") + "</div>";
    field.dataset.tap = "1";
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.PETS = [
      ["🐥", "병아리"], ["🐰", "토끼"], ["🐱", "고양이"], ["🐶", "강아지"], ["🐸", "개구리"], ["🐠", "물고기"], ["🐞", "무당벌레"],
      ["🦋", "나비"], ["🐹", "햄스터"], ["🐧", "펭귄"], ["🐢", "거북이"], ["🐝", "꿀벌"], ["🐙", "문어"], ["🐼", "판다"],
    ];

    ctx.make = (y) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      const pet = Math.random() < 0.28 ? U.pick(ctx.PETS) : null;
      const base = U.clamp(Math.min(W, H) * 0.2, 80, 150);
      const d = Math.round(base * (pet ? U.randf(1.05, 1.25) : U.randf(lv === 3 ? 0.7 : 0.8, 1.15)));
      const el = U.el("div", "bb");
      el.style.setProperty("--d", d + "px");
      el.innerHTML = '<div class="bb-in" style="--h:' + U.rand(360) + 'deg;animation-delay:-' + Math.random() * 2 + 's"></div>' + (pet ? '<div class="bb-pet">' + KP.E(pet[0]) + "</div>" : "");
      field.appendChild(el);
      const sp = [32, 46, 62][lv - 1] * U.randf(0.8, 1.25) * (H / 650 + 0.4);
      const b = { el, d, pet, x0: U.randf(d / 2, W - d / 2), y: y == null ? H + d * 0.2 : y, sp, ph: Math.random() * 6.28, amp: U.randf(14, 40), fq: U.randf(0.4, 0.9), x: 0, dead: false };
      ctx.bubbles.push(b);
      return b;
    };

    const NOTES = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6"];
    ctx.popB = (b) => {
      if (b.dead) return;
      b.dead = true;
      b.el.remove();
      const cx = b.x,
        cy = b.y + b.d / 2;
      // 소리: 뽁 + 맑은 음 (연속으로 터뜨리면 음계가 올라감)
      A.tone(U.randf(500, 800), { to: U.randf(1300, 1800), dur: 0.09, vol: 0.22 });
      A.note(NOTES[ctx.combo % NOTES.length], { inst: "bell", dur: 0.4, vol: 0.12, when: 0.02 });
      ctx.combo++;
      ctx.comboT = 0.9;
      const ring = U.el("div", "bb-pop");
      ring.style.cssText = "left:" + cx + "px;top:" + cy + "px;--d:" + b.d + "px";
      field.appendChild(ring);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.28,
          r = b.d * U.randf(0.45, 0.75);
        const dr = U.el("div", "bb-drop");
        dr.style.cssText = "left:" + cx + "px;top:" + cy + "px;--s:" + U.randf(6, 13) + "px;--dx:" + Math.cos(a) * r + "px;--dy:" + Math.sin(a) * r + "px";
        field.appendChild(dr);
        ctx.after(600, () => dr.remove());
      }
      ctx.after(350, () => ring.remove());
      if (b.pet) ctx.free(b.pet, cx, cy);
      ctx.count++;
      ctx.score.add();
      if (ctx.count % 10 === 0) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.after(b.pet ? 1200 : 300, () => ctx.win({ big, msg: big ? "비눗방울 대장 형아!" : ctx.count + "개 팡팡!" }));
      }
    };

    // 갇혀 있던 동물이 기뻐하며 떨어져 나옴 → 땅에 통통 → 사라짐
    ctx.free = ([em, name], x, y) => {
      const H = field.clientHeight;
      const f = U.el("div", "bb-free", KP.E(em) + "<b>" + name + "!</b>");
      f.style.left = x + "px";
      f.style.top = y + "px";
      field.appendChild(f);
      for (let i = 0; i < 3; i++) {
        const h = U.el("div", "bb-heart", KP.E("💖"));
        h.style.cssText = "left:" + (x - 10) + "px;top:" + (y - 30) + "px;--dx:" + (i - 1) * 40 + "px;animation-delay:" + i * 0.12 + "s";
        field.appendChild(h);
        ctx.after(1500, () => h.remove());
      }
      KP.voice.say(U.pick(["와, 고마워! ", "나왔다! ", "야호! "]) + "나는 " + name + "!");
      A.sfx("levelup");
      ctx.freed.push({ el: f, x, y, vy: -320, floor: H - 50, t: 0, bounces: 0 });
    };

    // 손가락으로 쓸어도 터지게 — 판 전체에서 위치로 판정
    const hitAt = (e) => {
      const r = field.getBoundingClientRect();
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      let hit = false;
      for (const b of ctx.bubbles) {
        if (b.dead) continue;
        if (U.dist(x, y, b.x, b.y + b.d / 2) < b.d / 2 + 14) {
          ctx.popB(b);
          hit = true;
        }
      }
      return hit;
    };
    let down = false;
    ctx.fast(field, (e) => {
      down = true;
      try {
        field.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (!hitAt(e)) A.sfx("rub");
    });
    field.addEventListener("pointermove", (e) => {
      if (!down && !(e.pointerType === "mouse" && e.buttons)) return;
      hitAt(e);
    });
    const up = () => (down = false);
    field.addEventListener("pointerup", up);
    field.addEventListener("pointercancel", up);

    ctx.frame = (dt, now) => {
      const t = now / 1000;
      const W = field.clientWidth;
      const lv = ctx.level;
      const maxN = [6, 8, 11][lv - 1];
      ctx.comboT -= dt;
      if (ctx.comboT < 0) ctx.combo = 0;
      const alive = ctx.bubbles.filter((b) => !b.dead);
      ctx.spawnT -= dt;
      if (ctx.spawnT <= 0 && alive.length < maxN) {
        ctx.spawnT = [0.9, 0.7, 0.5][lv - 1] * U.randf(0.6, 1.4);
        ctx.make();
      }
      for (const b of alive) {
        b.y -= b.sp * dt;
        b.x = U.clamp(b.x0 + Math.sin(t * b.fq + b.ph) * b.amp, b.d / 2, W - b.d / 2);
        b.el.style.left = b.x - b.d / 2 + "px";
        b.el.style.top = b.y + "px";
        if (b.y < -b.d - 10) {
          b.dead = true;
          b.el.remove();
        }
      }
      ctx.bubbles = ctx.bubbles.filter((b) => !b.dead);
      // 풀려난 동물: 통통 튀다가 사라짐
      ctx.freed = ctx.freed.filter((f) => {
        f.t += dt;
        f.vy += 1100 * dt;
        f.y += f.vy * dt;
        if (f.y > f.floor) {
          f.y = f.floor;
          f.bounces++;
          f.vy = f.bounces < 3 ? -380 / f.bounces : 0;
          if (f.bounces <= 2) A.note(f.bounces === 1 ? "G4" : "C5", { inst: "marimba", dur: 0.2, vol: 0.12 });
        }
        f.el.style.top = f.y + "px";
        f.el.style.rotate = Math.sin(f.t * 10) * 8 + "deg";
        if (f.t > 2.2) f.el.style.opacity = Math.max(0, 1 - (f.t - 2.2) * 2);
        if (f.t > 2.8) {
          f.el.remove();
          return false;
        }
        return true;
      });
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".bb,.bb-free,.bb-pop,.bb-drop,.bb-heart").forEach((e) => e.remove());
    ctx.bubbles = [];
    ctx.freed = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.combo = 0;
    ctx.comboT = 0;
    ctx.spawnT = 0.3;
    ctx.say("비눗방울을 콕! 손가락으로 쓱쓱 쓸어도 터져요 🫧");
    requestAnimationFrame(() => {
      const H = ctx.field.clientHeight;
      [0.25, 0.5, 0.75].forEach((p) => ctx.make(H * p));
      ctx.bubbles[1].pet = ctx.bubbles[1].pet || ["🐥", "병아리"];
      if (!ctx.bubbles[1].el.querySelector(".bb-pet")) ctx.bubbles[1].el.insertAdjacentHTML("beforeend", '<div class="bb-pet">' + KP.E("🐥") + "</div>");
      ctx.loop((dt, now) => ctx.frame(dt, now));
    });
    ctx.hint(() => {
      const H = ctx.field.clientHeight;
      const a = ctx.bubbles.filter((b) => !b.dead && b.y > 20 && b.y < H - b.d).sort((p, q) => (q.pet ? 1 : 0) - (p.pet ? 1 : 0) || q.y - p.y);
      return a[0] && a[0].el;
    }, "비눗방울을 콕 눌러 봐요!");
  },
});
