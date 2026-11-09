/* 위·아래·안·밖 — "고양이를 상자 위에 올려 줘!" 공간 말 듣고 끌어다 놓기
   1단계: 위 · 안 (상자) — 한 판에 친구 2명
   2단계: + 아래 · 옆 (상자 · 책상 · 침대) — 친구 2~3명
   3단계: + 앞 · 뒤 (멀리 = 화면 위쪽, 가까이 = 화면 아래쪽) — 친구 3명
   놓은 친구는 장면에 그대로 남아 판 끝에는 '고양이는 위, 강아지는 안' 장면이 완성된다.
   말은 자연 음성 조각으로: "고양이를"+"상자"+"위에 올려 줘!", 맞으면 "고양이가 상자 위!", 틀리면 "거기는 상자 안!"
   놓인 자리를 넉넉하게 판정하고, 틀리면 "거기는 옆이에요" 하고 알려 준다. */
"use strict";
KP.game({
  id: "spatial",
  icon: "📦",
  name: "위·아래·안·밖",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("spatial", `
      .spWrap{flex:1;min-height:0;display:flex;flex-direction:column;padding:0 10px 10px;gap:6px}
      .spBox0{flex:1;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center}
      .spScene{width:min(100cqw,133cqh);aspect-ratio:4/3;container-type:size;position:relative;border-radius:26px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(180deg,#bfe8ff 0,#e6f6ff 52%,#c9e9a5 52.2%,#a8d987 100%)}
      @media (orientation:portrait){.spScene{width:min(100cqw,100cqh);aspect-ratio:1}}
      .spScene.indoor{background:linear-gradient(180deg,#fff1d6 0,#ffe7c2 52%,#e9c49a 52.2%,#d9ad7c 100%)}
      .spScene.indoor:before{content:"";position:absolute;left:8%;top:10%;width:18cqw;height:14cqw;border-radius:10px;background:linear-gradient(#bfe8ff,#e6f6ff);box-shadow:inset 0 0 0 1.2cqw #fff,0 4px 0 rgba(0,0,0,.08)}
      .spSun{position:absolute;right:6%;top:6%;font-size:11cqw;line-height:1}
      .spScene.beach{background:linear-gradient(180deg,#9fdcff 0,#d6f1ff 38%,#4fb3e8 38.2%,#7fcdf0 52%,#f6e3a6 52.2%,#eccf85 100%)}
      .spShell{position:absolute;left:8%;bottom:6%;font-size:8cqw;line-height:1;transform:rotate(-14deg)}
      .spScene.bedroom{background:linear-gradient(180deg,#e7dcff 0,#d9ccff 52%,#c99c78 52.2%,#b98a66 100%)}
      .spScene.bedroom:before{content:"";position:absolute;left:8%;top:10%;width:18cqw;height:14cqw;border-radius:10px;background:linear-gradient(#2c3e7a,#4b5fa8);box-shadow:inset 0 0 0 1.2cqw #fff,0 4px 0 rgba(0,0,0,.08)}
      .spMoon{position:absolute;left:13%;top:12.5%;font-size:8cqw;line-height:1;z-index:1}
      /* 침대 */
      .spBed{width:56cqw;height:24cqw}
      .spBed .mat{position:absolute;left:0;right:0;top:0;height:6cqw;background:linear-gradient(#ffffff,#e9eef8);border-radius:2cqw 2cqw .6cqw .6cqw;z-index:3;box-shadow:0 .8cqw 0 rgba(0,0,0,.1)}
      .spBed .blanket{position:absolute;left:30%;right:-.6cqw;top:1.2cqw;height:6.6cqw;background:repeating-linear-gradient(90deg,#7cc7ff 0 3cqw,#a5d8ff 3cqw 6cqw);border-radius:1.4cqw;z-index:4}
      .spBed.b2 .blanket{background:repeating-linear-gradient(90deg,#ff9fbf 0 3cqw,#ffc2d6 3cqw 6cqw)}
      .spBed .pillow{position:absolute;left:3cqw;top:-2.2cqw;width:12cqw;height:4.4cqw;background:#fff;border-radius:2.2cqw;box-shadow:inset 0 -.6cqw 0 rgba(0,0,0,.08);z-index:4}
      .spBed .head{position:absolute;left:-2cqw;top:-9cqw;bottom:0;width:3.2cqw;background:linear-gradient(90deg,#b0743f,#93582a);border-radius:1.6cqw 1.6cqw .6cqw .6cqw;z-index:2}
      .spBed .foot{position:absolute;right:-2cqw;top:-3cqw;bottom:0;width:3cqw;background:linear-gradient(90deg,#b0743f,#93582a);border-radius:1.4cqw 1.4cqw .6cqw .6cqw;z-index:5}
      .spBed .leg{position:absolute;top:5cqw;bottom:0;width:2.6cqw;background:#93582a;z-index:3}
      .spBed .leg.l{left:2.4cqw}.spBed .leg.r{right:2.4cqw}
      .spBed .spPut.r-위{bottom:calc(100% - 1.6cqw);z-index:6}
      .spBed .spPut.r-아래{font-size:16cqw}
      .spTable .spPut.r-옆L{right:calc(100% + .5cqw)}.spTable .spPut.r-옆R{left:calc(100% + .5cqw)}
      .spBed .spPut.r-옆L{right:calc(100% + 2.1cqw)}.spBed .spPut.r-옆R{left:calc(100% + 2.1cqw)}
      .spCloud{position:absolute;left:10%;top:8%;font-size:12cqw;line-height:1;opacity:.95}
      .spProp{position:absolute;left:50%;bottom:19cqh;transform:translateX(-50%);z-index:2}
      /* 상자 */
      .spCrate{width:38cqw;height:19cqw}
      .spCrate .back{position:absolute;left:0;right:0;top:-3.2cqw;height:3.4cqw;background:#a86a2c;border-radius:1cqw 1cqw 0 0;z-index:1}
      .spCrate .front{position:absolute;inset:0;background:linear-gradient(180deg,#e8a65a,#d48a3c);border-radius:.6cqw .6cqw 1.2cqw 1.2cqw;z-index:3;box-shadow:inset 0 -1cqw 0 rgba(0,0,0,.12)}
      .spCrate .front:after{content:"";position:absolute;left:44%;width:12%;top:0;bottom:0;background:rgba(255,255,255,.22)}
      .spCrate .flap{position:absolute;top:-1.2cqw;width:11cqw;height:3cqw;background:#f0b46c;z-index:4;border-radius:.6cqw}
      .spCrate .flap.l{left:-6.5cqw;transform:rotate(-24deg)}.spCrate .flap.r{right:-6.5cqw;transform:rotate(24deg)}
      .spCrate.c2 .front{background:linear-gradient(180deg,#7cc7ff,#4aa6ee)}.spCrate.c2 .back{background:#2f74b5}.spCrate.c2 .flap{background:#a5d8ff}
      .spCrate.c3 .front{background:linear-gradient(180deg,#ff9fbf,#f2709c)}.spCrate.c3 .back{background:#b8436b}.spCrate.c3 .flap{background:#ffc2d6}
      /* 책상 */
      .spTable{width:54cqw;height:28cqw}
      .spTable .top{position:absolute;left:-1cqw;right:-1cqw;top:0;height:3.2cqw;background:linear-gradient(#c98a4f,#a96a33);border-radius:1cqw;z-index:3;box-shadow:0 .8cqw 0 rgba(0,0,0,.12)}
      .spTable .leg{position:absolute;top:2cqw;bottom:0;width:3cqw;background:#9a5f2c;border-radius:0 0 .8cqw .8cqw;z-index:3}
      .spTable .leg.l{left:2cqw}.spTable .leg.r{right:2cqw}
      .spTable .leg.bl,.spTable .leg.br{z-index:0;top:1cqw;bottom:2.2cqw;background:#7e4c22}
      .spTable .leg.bl{left:6cqw}.spTable .leg.br{right:6cqw}
      .spShadow{position:absolute;left:4%;right:4%;bottom:-1.4cqw;height:2.8cqw;border-radius:50%;background:rgba(60,80,40,.22);z-index:0}
      /* 캐릭터 */
      .spChar{font-size:clamp(84px,12vw,124px);line-height:1;filter:drop-shadow(0 6px 0 rgba(0,0,0,.14))}
      .spTray{flex:0 0 auto;display:flex;justify-content:center;align-items:center;min-height:clamp(100px,14vw,140px)}
      .spPut{position:absolute;font-size:20cqw;line-height:1;animation:spPut .4s cubic-bezier(.2,1.5,.4,1);pointer-events:none}
      @keyframes spPut{from{transform:translate(var(--tx,-50%),12%) scale(.7)}}
      .spPut{--tx:-50%;transform:translateX(var(--tx))}
      .spPut.r-위{left:50%;bottom:100%;z-index:5}
      .spCrate .spPut.r-위{bottom:calc(100% - 1.4cqw)}
      .spPut.r-안{left:50%;bottom:8cqw;z-index:2}
      .spPut.r-아래{left:50%;bottom:-.4cqw;z-index:1}
      .spPut.r-옆L{left:auto;right:calc(100% + 4cqw);bottom:-.6cqw;--tx:0%}
      .spPut.r-옆R{left:calc(100% + 4cqw);bottom:-.6cqw;--tx:0%}
      .spPut.r-앞{left:50%;bottom:-10cqw;z-index:6;font-size:21cqw}
      .spPut.r-뒤{left:64%;bottom:13cqw;z-index:0;font-size:18cqw}
      .spGlow{position:absolute;inset:-2cqw;border-radius:3cqw;box-shadow:0 0 0 1cqw rgba(255,213,74,.9),0 0 5cqw 2cqw rgba(255,213,74,.7);animation:spGlow 1s ease-in-out 2;pointer-events:none;z-index:7;opacity:0}
      @keyframes spGlow{50%{opacity:1}}
      /* 폰 가로(높이 500 미만): 장면 | 친구 쟁반 을 옆으로 — 위아래로 쌓으면 장면이 작아짐 */
      @media (orientation:landscape) and (max-height:499px){.spWrap{flex-direction:row;padding:0 10px 8px;gap:10px}.spTray{min-height:0;min-width:clamp(120px,18vw,170px);background:rgba(255,255,255,.45);border-radius:26px}.spChar{font-size:clamp(84px,24vh,112px)}}
    `);
    // (판다는 "판다를" 자연 음성이 없어서 오리로)
    ctx.CHARS = [["🐱", "고양이"], ["🐶", "강아지"], ["🐰", "토끼"], ["🐥", "병아리"], ["🦆", "오리"], ["🧸", "곰 인형"], ["⚽", "공"], ["🐸", "개구리"]];
    // 관계 → 말
    ctx.REL = {
      위: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 위에 올려 줘!", got: "위" },
      안: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 안에 쏙 넣어 줘!", got: "안" },
      아래: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 아래에 놓아 줘!", got: "아래" },
      옆: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 옆에 놓아 줘!", got: "옆" },
      앞: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 앞에 놓아 줘!", got: "앞" },
      뒤: { ask: (x, p) => U.josa(x, "을/를") + " " + p + " 뒤에 숨겨 줘!", got: "뒤" },
    };
    ctx.wrap = U.el("div", "spWrap");
    ctx.box0 = U.el("div", "spBox0");
    ctx.scene = U.el("div", "spScene");
    ctx.box0.appendChild(ctx.scene);
    ctx.tray = U.el("div", "spTray");
    ctx.wrap.append(ctx.box0, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastKind = null;
    this.next(ctx);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const nat = (t) => !!(KP.voice._natUrls && KP.voice._natUrls(t));
    const lv = ctx.level;
    const tok = ++ctx.token;
    // 소품마다 할 수 있는 자리: 상자(위·안·옆) / 책상·침대(위·아래·옆) / 상자 앞뒤(앞·뒤·옆)
    const levelRels = lv === 1 ? ["위", "안"] : lv === 2 ? ["위", "안", "아래", "옆"] : ["위", "안", "아래", "옆", "앞", "뒤"];
    const KINDS = { crate: ["위", "안", "옆"], table: ["위", "아래", "옆"], bed: ["위", "아래", "옆"], crateFB: ["앞", "뒤", "옆"] };
    let kinds = Object.keys(KINDS).filter((k) => KINDS[k].filter((r) => levelRels.includes(r)).length >= 2);
    // 같은 소품이 연달아 나오지 않게, 3단계는 앞·뒤(새로 배우는 말)가 자주 나오게
    if (kinds.length > 1) kinds = kinds.filter((k) => k !== ctx.lastKind);
    if (lv === 3 && ctx.lastKind !== "crateFB" && Math.random() < 0.45) kinds = ["crateFB"];
    const kind = U.pick(kinds);
    ctx.lastKind = kind;
    const supports = KINDS[kind].filter((r) => levelRels.includes(r));
    // 한 판 = 친구 2~3명을 차례로 놓기 (끌기 1번이면 축하가 놀이보다 길어서)
    const nTask = Math.min(supports.length, lv === 1 ? 2 : lv === 2 ? U.pick([2, 3]) : 3);
    const tasks = U.sample(supports, nTask);
    const chars = U.sample(ctx.CHARS, nTask);
    const pName = kind === "table" ? "책상" : kind === "bed" ? "침대" : "상자";
    const flat = kind === "table" || kind === "bed";

    // 장면 (배경도 판마다 조금씩: 마당·바닷가 / 방·침실)
    const sc = ctx.scene;
    sc.innerHTML = "";
    const bg = kind === "table" ? "indoor" : kind === "bed" ? "bedroom" : U.pick(["", "beach"]);
    sc.className = "spScene item" + (bg ? " " + bg : "");
    if (bg === "") sc.append(U.el("div", "spSun", KP.E("☀️")), U.el("div", "spCloud", KP.E("☁️")));
    else if (bg === "beach") sc.append(U.el("div", "spSun", KP.E("☀️")), U.el("div", "spShell", KP.E("🐚")));
    else if (bg === "bedroom") sc.append(U.el("div", "spMoon", KP.E("🌙")));
    let prop;
    if (kind === "table") {
      prop = U.el("div", "spProp spTable", '<div class="spShadow"></div><div class="leg bl"></div><div class="leg br"></div><div class="top"></div><div class="leg l"></div><div class="leg r"></div>');
    } else if (kind === "bed") {
      prop = U.el("div", "spProp spBed " + U.pick(["", "b2"]), '<div class="spShadow"></div><div class="head"></div><div class="foot"></div><div class="mat"></div><div class="blanket"></div><div class="pillow"></div><div class="leg l"></div><div class="leg r"></div>');
    } else {
      prop = U.el("div", "spProp spCrate " + U.pick(["", "c2", "c3"]), '<div class="spShadow"></div><div class="back"></div><div class="front"></div><div class="flap l"></div><div class="flap r"></div>');
    }
    sc.appendChild(prop);

    /* 놓은 자리 판정 (화면 좌표) — 소품 모양 기준, 넉넉하게 */
    const classify = (x, y) => {
      const P = (flat ? prop : prop.querySelector(".front")).getBoundingClientRect();
      const S = sc.getBoundingClientRect();
      const c = S.width * 0.2; // 캐릭터 크기
      const inX = x >= P.left - c * 0.35 && x <= P.right + c * 0.35;
      const side = x < P.left - c * 0.1 ? "옆L" : x > P.right + c * 0.1 ? "옆R" : null;
      const res = [];
      if (y < P.top - c * 1.6) return { rel: null, side };
      if (flat) {
        if (inX && y < P.top + P.height * 0.2) res.push("위");
        if (x > P.left && x < P.right && y >= P.top + P.height * 0.2) res.push("아래");
      } else if (kind === "crateFB") {
        if (inX && y <= P.bottom - P.height * 0.08) res.push("뒤");
        if (inX && y > P.bottom - P.height * 0.08) res.push("앞");
      } else {
        if (inX && y < P.top + P.height * 0.12) res.push("위");
        if (x > P.left - c * 0.15 && x < P.right + c * 0.15 && y >= P.top + P.height * 0.12 && y < P.bottom + c * 0.3) res.push("안");
      }
      if (side && y > P.top - c * 0.6 && y < P.bottom + c * 0.8) res.push("옆");
      return { rel: res[0] || null, side };
    };

    // 친구 한 명씩: 쟁반에 나와서 → 말 듣고 → 끌어다 놓기
    const step = (k) => {
      if (tok !== ctx.token) return;
      const rel = tasks[k];
      const [cem, cname] = chars[k];
      ctx.tray.innerHTML = "";
      const ch = U.el("div", "spChar item", KP.E(cem));
      ctx.tray.appendChild(ch);
      const ask = ctx.REL[rel].ask(cname, pName);
      ctx.spCur = { rel, kind, k, n: tasks.length }; // 점검용(지금 할 일)
      ctx.say(ask);
      let last = null;
      const d = KP.drag(ch, {
        targets: () => [sc],
        pad: 0,
        snap: false,
        onMove: (x, y) => (last = { x, y }),
        onDrop: (t) => {
          if (tok !== ctx.token) return;
          if (!t) {
            KP.voice.say(ask);
            return;
          }
          const r = last ? classify(last.x, last.y) : { rel: null };
          if (r.rel === rel) {
            d.lock();
            put(k, ch, rel === "옆" ? r.side || "옆R" : rel);
          } else {
            d.home();
            // "거기는 상자 안이에요!" 에 자연 음성이 없으면 "거기는 상자 안!" (조각마다 자연 음성) + 다시 질문
            if (r.rel && supports.includes(r.rel)) {
              const full = "거기는 " + pName + " " + U.josa(r.rel, "이에요/예요") + "!";
              ctx.miss(ch, (nat(full) ? full : "거기는 " + pName + " " + r.rel + "!") + " " + ask);
            } else if (!r.rel) ctx.miss(ch, ask, { soft: true }); // 하늘·풀밭 같은 빈 곳: 자리를 잘못 고른 게 아니라 단계·열쇠 별엔 안 셈
            else ctx.miss(ch, ask);
          }
        },
      });
      ctx.hint(() => ch, ask);
    };

    const put = async (k, ch, where) => {
      ctx.hint(null);
      const rel = tasks[k];
      const [cem, cname] = chars[k];
      ch.style.transition = "";
      ch.style.transform = "";
      ch.style.visibility = "hidden";
      const p = U.el("div", "spPut r-" + where, KP.E(cem));
      prop.appendChild(p);
      prop.querySelectorAll(".spGlow").forEach((g) => g.remove());
      prop.appendChild(U.el("div", "spGlow"));
      A.sfx(rel === "안" ? "drop" : "snap");
      A.sfx("good");
      A.note(A.SCALE[2 + k * 2], { inst: "bell", dur: 0.4, vol: 0.2 });
      const josa = U.josa(cname, "이/가");
      // 화면: "고양이가 상자 위에 있어요!" / 소리: 통째 음성이 없으면 "고양이가 상자 위!" (조각마다 자연 음성)
      const said = rel === "뒤" ? josa + " " + pName + " 뒤에 숨었어요! 까꿍!" : josa + " " + pName + " " + rel + "에 있어요!";
      const spoken = nat(said) || rel === "뒤" ? said : josa + " " + pName + " " + rel + "!";
      ctx.say(said, spoken);
      await ctx.wait(1900);
      if (tok !== ctx.token) return;
      if (k + 1 < tasks.length) return step(k + 1);
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 자리 박사!" : U.pick(["딩동댕!", "맞았어요!", "정확해요!"]) });
      if (ok && tok === ctx.token) this.next(ctx);
    };
    step(0);
  },
});
