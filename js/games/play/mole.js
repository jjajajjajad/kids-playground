/* 두더지 잡기 — 잔디 정원의 흙구멍에서 두더지가 쏙! 망치로 콩!
   - 맞으면 '콩!' + 눈이 빙글빙글 + 별이 빙글빙글 돌며 쏙 들어감
   - 가끔 보너스 친구(토끼·개구리·병아리)가 나옴 → +3
   - 빈 구멍을 눌러도 벌 없음(흙만 폴폴) / 10마리마다 축하
   1단계: 구멍 4개·느리게 / 2단계: 6개 / 3단계: 9개·빠르게 */
"use strict";
KP.game({
  id: "mole",
  icon: "🐹",
  name: "두더지 잡기",
  cat: "play",
  levels: 3,
  score: "🔨",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("mole", `
      .ml-field{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);
        background:repeating-linear-gradient(100deg,rgba(255,255,255,.07) 0 40px,rgba(0,0,0,0) 40px 80px),radial-gradient(120% 90% at 50% 10%,#9be36f,#5cbf4a 70%,#4aa83d);
        display:flex;align-items:center;justify-content:center}
      .ml-deco{position:absolute;font-size:clamp(24px,3.6vw,36px);pointer-events:none;opacity:.95}
      .ml-grid{display:grid;grid-template-columns:repeat(var(--cols),var(--cs));grid-auto-rows:var(--cs);gap:calc(var(--cs)*.06);position:relative;z-index:1}
      .ml-cell{position:relative;width:var(--cs);height:var(--cs);cursor:pointer}
      .ml-hole{position:absolute;left:8%;right:8%;top:58%;height:28%;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#2b1a0e 0 55%,#4a2f1a 75%,#6b4628 100%);
        box-shadow:inset 0 6px 10px rgba(0,0,0,.5)}
      .ml-win{position:absolute;left:0;right:0;top:-12%;height:84%;overflow:hidden;pointer-events:none;border-radius:0 0 50% 50%/0 0 22% 22%}
      .ml-mole{position:absolute;left:18%;right:18%;bottom:0;height:78%;transform:translateY(105%);transition:transform .2s cubic-bezier(.3,1.4,.6,1)}
      .ml-cell.up .ml-mole{transform:translateY(8%)}
      .ml-cell.hit .ml-mole{transition:transform .35s ease-in .55s}
      .ml-body{position:absolute;inset:0;border-radius:50% 50% 38% 38%/62% 62% 38% 38%;background:radial-gradient(circle at 38% 28%,#b98a5e,#8a5c38 60%,#6d4528);
        box-shadow:inset -6px -8px 12px rgba(0,0,0,.18)}
      .ml-belly{position:absolute;left:22%;right:22%;top:52%;bottom:-10%;border-radius:50%;background:#e6c49a}
      .ml-eye{position:absolute;top:26%;width:12%;height:13%;border-radius:50%;background:#2a1a10}
      .ml-eye::after{content:"";position:absolute;left:22%;top:18%;width:38%;height:38%;border-radius:50%;background:#fff}
      .ml-eye.l{left:27%}.ml-eye.r{right:27%}
      .ml-x{position:absolute;top:21%;font-size:calc(var(--cs)*.13);line-height:1;color:#2a1a10;display:none}
      .ml-x.l{left:24%}.ml-x.r{right:24%}
      .ml-nose{position:absolute;left:39%;right:39%;top:39%;height:13%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffd0dc,#ff7b9c 60%,#e2557a)}
      .ml-cheek{position:absolute;top:43%;width:14%;height:9%;border-radius:50%;background:rgba(255,120,140,.45)}
      .ml-cheek.l{left:15%}.ml-cheek.r{right:15%}
      .ml-teeth{position:absolute;left:44%;right:44%;top:53%;height:8%;background:#fff;border-radius:0 0 4px 4px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
      .ml-paw{position:absolute;bottom:22%;width:20%;height:13%;border-radius:50%;background:#f0b8a0;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}
      .ml-paw.l{left:4%}.ml-paw.r{right:4%}
      .ml-hat{position:absolute;left:22%;right:22%;top:-6%;height:20%;border-radius:50% 50% 10% 10%;background:linear-gradient(#ffd84a,#f2b400);box-shadow:inset 0 -4px 0 rgba(0,0,0,.12);display:none}
      .ml-cell.hat .ml-hat{display:block}
      .ml-cell.dizzy .ml-eye{display:none}.ml-cell.dizzy .ml-x{display:block}
      .ml-cell.dizzy .ml-body{animation:ml-squash .4s}
      @keyframes ml-squash{30%{transform:scale(1.15,.8)}}
      .ml-friend{position:absolute;inset:0;display:none;align-items:flex-end;justify-content:center;font-size:calc(var(--cs)*.56);line-height:1}
      .ml-cell.friend .ml-friend{display:flex}.ml-cell.friend .ml-body,.ml-cell.friend .ml-belly,.ml-cell.friend .ml-eye,.ml-cell.friend .ml-nose,.ml-cell.friend .ml-cheek,.ml-cell.friend .ml-teeth,.ml-cell.friend .ml-paw,.ml-cell.friend .ml-hat{display:none}
      .ml-lip{position:absolute;left:2%;right:2%;top:70%;height:22%;border-radius:50%;background:radial-gradient(ellipse at 50% 20%,#a27248,#7b5131 70%);pointer-events:none;
        box-shadow:0 5px 0 rgba(0,0,0,.12)}
      .ml-lip::before{content:"";position:absolute;left:10%;right:10%;top:12%;height:30%;border-radius:50%;background:rgba(255,255,255,.12)}
      .ml-ham{position:absolute;width:calc(var(--cs)*.62);height:calc(var(--cs)*.62);left:38%;top:-30%;font-size:calc(var(--cs)*.62);line-height:1;pointer-events:none;z-index:5;
        transform-origin:85% 85%;animation:ml-ham .5s ease-out forwards}
      @keyframes ml-ham{0%{transform:rotate(55deg);opacity:1}35%{transform:rotate(-18deg)}55%{transform:rotate(-8deg)}85%{opacity:1}100%{transform:rotate(-8deg);opacity:0}}
      .ml-kong{position:absolute;left:50%;top:-8%;font-size:calc(var(--cs)*.24);color:#fff;-webkit-text-stroke:3px #e2557a;paint-order:stroke;pointer-events:none;z-index:6;
        text-shadow:0 4px 0 #b93a5c;animation:ml-kong .8s cubic-bezier(.2,1.6,.4,1) forwards;white-space:nowrap}
      @keyframes ml-kong{0%{transform:translate(-50%,0) scale(.3)}30%{transform:translate(-50%,-30%) scale(1.15)}75%{opacity:1}100%{transform:translate(-50%,-60%) scale(1);opacity:0}}
      .ml-stars{position:absolute;left:50%;top:8%;width:calc(var(--cs)*.5);height:calc(var(--cs)*.18);margin-left:calc(var(--cs)*-.25);pointer-events:none;z-index:4;animation:ml-fade 1s forwards}
      .ml-stars i{position:absolute;left:50%;top:50%;font-size:calc(var(--cs)*.14);line-height:1;margin:-.5em;animation:ml-orbit .7s linear infinite;animation-delay:var(--dl)}
      @keyframes ml-orbit{0%{transform:translate(-110%,0) scale(.8)}25%{transform:translate(0,40%) scale(1.1)}50%{transform:translate(110%,0) scale(.8)}75%{transform:translate(0,-40%) scale(.6)}100%{transform:translate(-110%,0) scale(.8)}}
      @keyframes ml-fade{80%{opacity:1}100%{opacity:0}}
      .ml-dust{position:absolute;width:14%;height:14%;border-radius:50%;background:#a27248;top:72%;pointer-events:none;z-index:4;animation:ml-dust .5s ease-out forwards}
      @keyframes ml-dust{to{transform:translate(var(--dx),-60%) scale(.3);opacity:0}}
      .ml-plus{position:absolute;left:50%;top:-14%;font-size:calc(var(--cs)*.22);color:#ffcf33;-webkit-text-stroke:3px #c47f00;paint-order:stroke;pointer-events:none;z-index:6;animation:ml-kong 1s forwards}
    `);
    const field = U.el("div", "ml-field");
    const deco = [["🌼", "4%", "6%"], ["🌷", "92%", "8%"], ["🍄", "6%", "88%"], ["🌸", "90%", "86%"], ["🐞", "48%", "3%"], ["🌼", "50%", "92%"]];
    deco.forEach(([e, x, y]) => {
      const d = U.el("div", "ml-deco", KP.E(e));
      d.style.left = x;
      d.style.top = y;
      d.style.transform = "translate(-50%,-50%)";
      field.appendChild(d);
    });
    const grid = U.el("div", "ml-grid");
    field.appendChild(grid);
    ctx.body.appendChild(field);
    ctx.field = field;
    ctx.grid = grid;
    ctx.FRIENDS = [["🐰", "토끼"], ["🐸", "개구리"], ["🐥", "병아리"], ["🐼", "판다"]];

    const MOLE =
      '<div class="ml-hole"></div><div class="ml-win"><div class="ml-mole">' +
      '<div class="ml-body"></div><div class="ml-belly"></div><div class="ml-hat"></div>' +
      '<div class="ml-eye l"></div><div class="ml-eye r"></div><div class="ml-x l">×</div><div class="ml-x r">×</div>' +
      '<div class="ml-cheek l"></div><div class="ml-cheek r"></div><div class="ml-nose"></div><div class="ml-teeth"></div>' +
      '<div class="ml-paw l"></div><div class="ml-paw r"></div><div class="ml-friend"></div>' +
      '</div></div><div class="ml-lip"></div>';

    ctx.layout = () => {
      const n = ctx.holes.length;
      const W = field.clientWidth,
        H = field.clientHeight;
      const portrait = H > W * 1.15;
      let cols = n === 4 ? 2 : 3;
      if (n === 6 && portrait) cols = 2;
      const rows = Math.ceil(n / cols);
      const cs = Math.floor(Math.min((W - 24) / (cols * 1.06), (H - 24) / (rows * 1.06), 250));
      grid.style.setProperty("--cols", cols);
      grid.style.setProperty("--cs", cs + "px");
      field.style.setProperty("--cs", cs + "px");
    };
    addEventListener("resize", () => ctx._active && ctx.layout());

    ctx.build = (n) => {
      grid.innerHTML = "";
      ctx.holes = [];
      for (let i = 0; i < n; i++) {
        const c = U.el("div", "ml-cell", MOLE);
        c.dataset.tap = "1";
        const h = { el: c, state: "down", t: 0, kind: null };
        ctx.fast(c, () => ctx.whack(h));
        grid.appendChild(c);
        ctx.holes.push(h);
      }
      ctx.layout();
    };

    ctx.popUp = (h) => {
      const lv = ctx.level;
      const r = Math.random();
      h.kind = r < 0.13 ? "friend" : "mole";
      h.el.classList.remove("hit", "dizzy", "friend", "hat");
      if (h.kind === "friend") {
        h.friend = U.pick(ctx.FRIENDS);
        U.$(".ml-friend", h.el).innerHTML = KP.E(h.friend[0]);
        h.el.classList.add("friend");
      } else if (Math.random() < 0.3) h.el.classList.add("hat");
      h.state = "up";
      h.t = [2.1, 1.55, 1.15][lv - 1] * U.randf(0.9, 1.2);
      void h.el.offsetWidth;
      h.el.classList.add("up");
      A.tone(320, { to: 760, dur: 0.12, vol: 0.12, type: "triangle" });
    };
    ctx.goDown = (h) => {
      h.state = "down";
      h.el.classList.remove("up");
      h.t = 0.45; // 다시 나오기 전 쉬는 시간
    };

    ctx.whack = (h) => {
      const c = h.el;
      // 망치는 언제나 콩
      const ham = U.el("div", "ml-ham", KP.E("🔨"));
      c.appendChild(ham);
      ctx.after(520, () => ham.remove());
      if (h.state !== "up") {
        // 빈 구멍: 흙만 폴폴
        A.noise({ dur: 0.12, vol: 0.12, lp: 700 });
        A.note("C4", { inst: "marimba", dur: 0.15, vol: 0.12 });
        for (let i = 0; i < 4; i++) {
          const d = U.el("div", "ml-dust");
          d.style.cssText = "left:" + (30 + i * 12) + "%;--dx:" + (i - 1.5) * 30 + "%";
          c.appendChild(d);
          ctx.after(520, () => d.remove());
        }
        return;
      }
      h.state = "hit";
      c.classList.add("hit", "dizzy");
      ctx.after(60, () => c.classList.remove("up"));
      // 콩!
      A.kick({ vol: 0.35 });
      A.note("G5", { inst: "marimba", dur: 0.2, vol: 0.3 });
      A.note("C6", { inst: "marimba", dur: 0.2, vol: 0.18, when: 0.05 });
      const k = U.el("div", "ml-kong", U.pick(["콩!", "뿅!", "콩!"]));
      c.appendChild(k);
      ctx.after(850, () => k.remove());
      let add = 1;
      if (h.kind === "friend") {
        add = 3;
        const p = U.el("div", "ml-plus", "+3");
        c.appendChild(p);
        ctx.after(1000, () => p.remove());
        A.sfx("sparkle");
        KP.voice.say(h.friend[1] + " 친구 찾았다! 세 개!");
      } else {
        // 어지러운 별
        const st = U.el("div", "ml-stars", ["💫", "⭐", "💫"].map((e, i) => '<i style="--dl:-' + i * 0.23 + 's">' + KP.E(e) + "</i>").join(""));
        c.appendChild(st);
        ctx.after(1000, () => st.remove());
        // 삐요삐요
        [0, 0.18, 0.36].forEach((w, i) => A.tone(i % 2 ? 1100 : 1400, { to: i % 2 ? 1400 : 1100, dur: 0.15, vol: 0.06, when: 0.15 + w }));
        if (ctx.count % 3 === 0) KP.voice.say(U.pick(["콩!", "잡았다!", "아야야~", "어지러워~"]));
      }
      h.t = 1.1;
      const prev = ctx.count;
      ctx.count += add;
      ctx.score.add(add);
      if (Math.floor(ctx.count / 10) > Math.floor(prev / 10)) {
        ctx.ms++;
        const big = ctx.ms % 3 === 0;
        ctx.pause = 3;
        ctx.after(700, () => ctx.win({ big, msg: big ? "두더지 대장 형아!" : ctx.count + "마리 콩콩!" }));
      }
    };

    ctx.frame = (dt) => {
      if (KP.celebrating) return;
      ctx.pause -= dt;
      const lv = ctx.level;
      for (const h of ctx.holes) {
        h.t -= dt;
        if (h.state === "up" && h.t <= 0) ctx.goDown(h);
        else if (h.state === "hit" && h.t <= 0) {
          h.el.classList.remove("hit", "dizzy");
          h.state = "down";
          h.t = 0.4;
        }
      }
      ctx.spawnT -= dt;
      const ups = ctx.holes.filter((h) => h.state === "up").length;
      const maxUp = [1, 2, 2][lv - 1];
      if (ctx.pause <= 0 && ctx.spawnT <= 0 && ups < maxUp) {
        const free = ctx.holes.filter((h) => h.state === "down" && h.t <= 0 && h !== ctx.lastHole);
        if (free.length) {
          const h = U.pick(free);
          ctx.lastHole = h;
          ctx.popUp(h);
          ctx.spawnT = [0.9, 0.65, 0.45][lv - 1] * U.randf(0.7, 1.3);
        }
      }
    };
  },
  start(ctx) {
    const n = [4, 6, 9][ctx.level - 1];
    ctx.count = 0;
    ctx.ms = 0;
    ctx.pause = 0;
    ctx.spawnT = 1.2;
    ctx.lastHole = null;
    ctx.build(n);
    ctx.curN = n;
    ctx.say("두더지가 쏙 나오면 콩! 눌러요 🔨");
    requestAnimationFrame(() => {
      ctx.layout();
      ctx.loop((dt) => {
        // 단계가 바뀌면 구멍 수도 바꾸기
        const want = [4, 6, 9][ctx.level - 1];
        if (want !== ctx.curN && !KP.celebrating) {
          ctx.curN = want;
          ctx.build(want);
          KP.voice.say("구멍이 " + (want === 6 ? "여섯" : "아홉") + " 개가 되었어요!");
        }
        ctx.frame(dt);
      });
    });
    ctx.hint(() => {
      const h = ctx.holes.find((x) => x.state === "up");
      return h && h.el;
    }, "두더지가 나오면 콩 눌러요!");
  },
});
