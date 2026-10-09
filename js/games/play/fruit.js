/* 과일 받기 — 나무에서 과일이 대롱대롱 흔들리다 툭! 바구니를 끌어서 받아요
   - 바구니를 손가락으로 좌우로 끌기 (화면 아무 데나 눌러도 그 자리로 이동)
   - 받으면 바구니가 들썩 + 소리, 받은 과일이 바구니에 소복이 쌓임
   - 놓쳐도 벌 없음 (풀밭에 톡 떨어져 데굴) / 10개마다 축하
   1단계: 천천히 1개씩 / 2단계: 2개 / 3단계: 3개·빠르게 */
"use strict";
KP.game({
  id: "fruit",
  icon: "🧺",
  name: "과일 받기",
  cat: "play",
  levels: 3,
  score: "🍎",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("fruit", `
      .fr-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;
        background:linear-gradient(180deg,#bfe9ff 0%,#e4f7ff 60%,#f6ffe9 100%)}
      .fr-tree{position:absolute;left:-4%;right:-4%;top:-8%;height:30%;pointer-events:none;z-index:1}
      .fr-leaf{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 35%,#8fe07a,#46b04a 65%,#2f8f3c);box-shadow:inset -6px -8px 0 rgba(0,0,0,.08)}
      .fr-trunk{position:absolute;top:0;width:clamp(26px,3.4vw,40px);height:34%;background:linear-gradient(90deg,#9b6230,#c78a4f,#8a5426);border-radius:0 0 10px 10px;z-index:0;pointer-events:none}
      .fr-grass{position:absolute;left:-5%;right:-5%;bottom:-20px;height:60px;border-radius:50% 50% 0 0/26px 26px 0 0;background:linear-gradient(#8ddc7a,#55b955);pointer-events:none}
      .fr-f{position:absolute;left:0;top:0;width:var(--s);height:var(--s);font-size:var(--s);line-height:1;pointer-events:none;z-index:2}
      .fr-f .e{width:100%;height:100%;display:block}
      .fr-f.hang .e{animation:fr-hang .25s ease-in-out infinite alternate;transform-origin:50% 0}
      @keyframes fr-hang{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
      .fr-basket{position:absolute;left:0;bottom:8px;width:var(--bw);height:calc(var(--bw)*.62);z-index:3;cursor:grab}
      .fr-basket.hintGlow{position:absolute;border-radius:30px}
      .fr-handle{position:absolute;left:14%;right:14%;top:-34%;height:70%;border:clamp(7px,1vw,11px) solid #b5793b;border-bottom:none;border-radius:999px 999px 0 0;box-shadow:inset 0 3px 0 rgba(255,255,255,.25)}
      .fr-back{position:absolute;left:4%;right:4%;top:2%;height:22%;border-radius:50%;background:#7b4a1d}
      .fr-pile{position:absolute;left:8%;right:8%;bottom:66%;height:80%}
      .fr-pile .e{position:absolute;width:var(--ps);height:var(--ps);animation:fr-in .35s cubic-bezier(.2,1.6,.4,1)}
      @keyframes fr-in{from{transform:translateY(-40px) scale(1.3)}}
      .fr-front{position:absolute;left:0;right:0;top:12%;bottom:0;clip-path:polygon(0 0,100% 0,88% 100%,12% 100%);
        background:repeating-linear-gradient(90deg,rgba(0,0,0,.1) 0 3px,transparent 3px 22px),repeating-linear-gradient(0deg,#d79a55 0 10px,#c3833f 10px 20px)}
      .fr-rim{position:absolute;left:-2%;right:-2%;top:6%;height:18%;border-radius:12px;background:linear-gradient(#e2a865,#b7793a);box-shadow:0 3px 0 rgba(0,0,0,.12)}
      .fr-bump{animation:fr-bump .35s}
      @keyframes fr-bump{30%{transform:translateY(8px) scale(1.06,.92)}60%{transform:translateY(-6px) scale(.97,1.04)}}
      .fr-plus{position:absolute;font-size:clamp(26px,4vw,40px);color:#fff;-webkit-text-stroke:3px #f07a1a;paint-order:stroke;pointer-events:none;z-index:6;animation:fr-plus .8s ease-out forwards}
      @keyframes fr-plus{to{transform:translateY(-70px);opacity:0}}
    `);
    const field = U.el("div", "fr-field");
    field.dataset.tap = "1";
    // 나무 (잎 덩어리 여러 개 + 줄기)
    let tree = '<div class="fr-tree">';
    for (let i = 0; i < 9; i++) {
      const w = 18 + (i % 3) * 5;
      tree += '<div class="fr-leaf" style="left:' + (i * 11.5 - 4) + "%;top:" + (i % 2 ? 30 : 5) + "%;width:" + w + "%;height:" + (60 + (i % 3) * 14) + '%"></div>';
    }
    tree += "</div>";
    field.innerHTML = '<div class="fr-trunk" style="left:8%"></div><div class="fr-trunk" style="right:8%"></div>' + tree + '<div class="fr-grass"></div>';
    const basket = U.el("div", "fr-basket", '<div class="fr-handle"></div><div class="fr-back"></div><div class="fr-pile"></div><div class="fr-front"></div><div class="fr-rim"></div>');
    field.appendChild(basket);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.basket = basket;
    ctx.pile = U.$(".fr-pile", basket);
    ctx.FRUITS = [["🍎", "사과"], ["🍐", "배"], ["🍊", "귤"], ["🍋", "레몬"], ["🍑", "복숭아"], ["🍒", "체리"], ["🍇", "포도"], ["🍓", "딸기"], ["🍌", "바나나"], ["🥝", "키위"]];

    /* ---------- 바구니 끌기 ---------- */
    let down = false;
    const toX = (e) => {
      const r = field.getBoundingClientRect();
      ctx.tx = U.clamp(e.clientX - r.left, ctx.bw / 2, r.width - ctx.bw / 2);
    };
    ctx.fast(field, (e) => {
      down = true;
      try {
        field.setPointerCapture(e.pointerId);
      } catch (_) {}
      toX(e);
      A.sfx("pick");
    });
    field.addEventListener("pointermove", (e) => {
      if (down || (e.pointerType === "mouse" && e.buttons)) toX(e);
    });
    const up = () => (down = false);
    field.addEventListener("pointerup", up);
    field.addEventListener("pointercancel", up);

    ctx.size = () => {
      const W = field.clientWidth,
        H = field.clientHeight;
      ctx.bw = Math.round(U.clamp(Math.min(W * 0.36, H * 0.32), 130, 220));
      basket.style.setProperty("--bw", ctx.bw + "px");
      ctx.fs = Math.round(U.clamp(Math.min(W, H) * 0.12, 56, 92));
      ctx.pile.style.setProperty("--ps", Math.round(ctx.bw * 0.26) + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.size());

    ctx.spawn = () => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const [em, name] = U.pick(ctx.FRUITS);
      const s = ctx.fs;
      const el = U.el("div", "fr-f hang", KP.E(em));
      el.style.setProperty("--s", s + "px");
      // 다른 과일과 너무 가깝지 않은 자리
      let x = U.randf(10, W - s - 10);
      for (let k = 0; k < 8 && ctx.fruits.some((f) => Math.abs(f.x - x) < s * 1.3); k++) x = U.randf(10, W - s - 10);
      const f = { el, em, name, s, x, y: H * 0.1, vy: 0, hang: [0.9, 0.7, 0.55][ctx.level - 1], state: "hang", rot: 0, vr: 0 };
      field.insertBefore(el, basket);
      ctx.fruits.push(f);
      A.tone(700, { to: 900, dur: 0.06, vol: 0.05 });
    };

    ctx.addToPile = (em) => {
      const n = ctx.pile.children.length;
      if (n >= 14) ctx.pile.firstElementChild.remove();
      const i = ctx.pileN++;
      const row = Math.floor(Math.min(i, 13) / 4.5);
      const img = U.el("div", "", KP.E(em)).firstElementChild;
      const ps = ctx.bw * 0.26;
      img.style.left = U.clamp(((i * 37) % 80) + U.randf(-6, 6), 0, 78) + "%";
      img.style.bottom = ps * 0.3 + row * ps * 0.36 + "px";
      img.style.rotate = U.rand(50) - 25 + "deg";
      ctx.pile.appendChild(img);
    };

    const NOTES = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6", "A6"];
    ctx.caught = (f) => {
      f.el.remove();
      ctx.addToPile(f.em);
      U.replay(ctx.basket, "fr-bump");
      A.note(NOTES[ctx.count % 10], { inst: "marimba", dur: 0.35, vol: 0.28 });
      A.noise({ dur: 0.06, vol: 0.08, lp: 1200 });
      const p = U.el("div", "fr-plus", "+1");
      p.style.left = ctx.bx - 16 + "px";
      p.style.top = field.clientHeight - ctx.bw * 0.9 + "px";
      field.appendChild(p);
      ctx.after(820, () => p.remove());
      KP.voice.say(f.name + "!");
      ctx.count++;
      ctx.score.add();
      if (ctx.count % 10 === 0) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.pause = 2.5;
        ctx.after(300, async () => {
          const ok = await ctx.win({ big, msg: big ? "과일 부자 형아!" : ctx.count + "개 받았다!" });
          if (ok) {
            // 바구니 비우기
            ctx.pile.innerHTML = "";
            ctx.pileN = 0;
            A.sfx("slide");
          }
        });
      }
    };

    ctx.frame = (dt) => {
      const W = field.clientWidth,
        H = field.clientHeight;
      const lv = ctx.level;
      // 바구니 따라가기
      ctx.bx += (ctx.tx - ctx.bx) * Math.min(1, dt * 14);
      basket.style.left = ctx.bx - ctx.bw / 2 + "px";
      const bTop = H - 8 - ctx.bw * 0.62 + ctx.bw * 0.06;
      // 떨어뜨리기
      ctx.pause -= dt;
      ctx.spawnT -= dt;
      const active = ctx.fruits.filter((f) => f.state !== "ground").length;
      if (!KP.celebrating && ctx.pause <= 0 && ctx.spawnT <= 0 && active < [1, 2, 3][lv - 1]) {
        ctx.spawn();
        ctx.spawnT = [1.4, 1.0, 0.7][lv - 1] * U.randf(0.8, 1.3);
      }
      const g = H / ([3.4, 2.4, 1.8][lv - 1] ** 2) * 1.3; // 떨어지는 데 걸리는 시간에 맞춘 중력
      for (const f of ctx.fruits) {
        if (f.state === "hang") {
          f.hang -= dt;
          if (f.hang <= 0) {
            f.state = "fall";
            f.el.classList.remove("hang");
            A.sfx("whoosh");
          }
        } else if (f.state === "fall") {
          f.vy = Math.min(f.vy + g * dt, H * 0.9);
          f.y += f.vy * dt;
          f.rot += dt * 90;
          const cx = f.x + f.s / 2;
          if (f.y + f.s * 0.6 >= bTop && f.y + f.s * 0.3 < bTop + ctx.bw * 0.3 && Math.abs(cx - ctx.bx) < ctx.bw / 2 + f.s * 0.2) {
            f.state = "done";
            ctx.caught(f);
            continue;
          }
          if (f.y > H - 30 - f.s) {
            // 풀밭에 톡 — 벌 없음
            f.state = "ground";
            f.y = H - 30 - f.s;
            f.vy = -H * 0.35;
            f.vr = (Math.random() < 0.5 ? -1 : 1) * 260;
            f.t = 0;
            A.note("G3", { inst: "marimba", dur: 0.2, vol: 0.2 });
            if (Math.random() < 0.35) KP.voice.say(U.pick(["톡! 괜찮아요", "아이쿠!", "다음 건 받아 보자!"]));
          }
        } else if (f.state === "ground") {
          f.t += dt;
          f.vy += g * dt;
          f.y = Math.min(H - 30 - f.s, f.y + f.vy * dt);
          f.x += f.vr * 0.25 * dt;
          f.rot += f.vr * dt;
          if (f.t > 0.9) f.el.style.opacity = Math.max(0, 1 - (f.t - 0.9) * 2.5);
          if (f.t > 1.4) f.state = "done";
        }
        f.el.style.left = f.x + "px";
        f.el.style.top = f.y + "px";
        f.el.style.rotate = (f.state === "hang" ? 0 : f.rot % 360) + "deg";
      }
      ctx.fruits = ctx.fruits.filter((f) => {
        if (f.state === "done") {
          f.el.remove();
          return false;
        }
        return true;
      });
    };
  },
  start(ctx) {
    ctx.field.querySelectorAll(".fr-f,.fr-plus").forEach((e) => e.remove());
    ctx.pile.innerHTML = "";
    ctx.pileN = 0;
    ctx.fruits = [];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.pause = 0;
    ctx.spawnT = 1.6;
    ctx.say("바구니를 끌어서 떨어지는 과일을 받아요! 🧺");
    requestAnimationFrame(() => {
      ctx.size();
      ctx.bx = ctx.tx = ctx.field.clientWidth / 2;
      ctx.loop((dt) => ctx.frame(dt));
    });
    ctx.hint(() => ctx.basket, "바구니를 끌어서 과일 밑으로 가요!");
  },
});
