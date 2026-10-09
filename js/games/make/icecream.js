/* 아이스크림 가게 — 손님 동물의 주문대로 아이스크림 만들기
   1단계: 자유롭게 만들어 드리기 / 2단계: "딸기 두 개 주세요!"(맛 하나·개수) / 3단계: 맛 두 가지 + 콘·컵, 토핑 주문
   - 콘/컵 고르기, 스쿱 최대 5개 쌓기(뚝 떨어지는 연출), 토핑: 스프링클·체리·초코칩
   - 드리기 → 손님이 냠냠 먹고 하트 / 틀리면 무엇이 다른지 말해 줌
   - 📸 → 내 작품(kind "icecream") */
"use strict";
KP.game({
  id: "icecream",
  icon: "🍦",
  name: "아이스크림 가게",
  cat: "make",
  levels: 3,
  score: "🍦",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("icecream", `
      .ic{flex:1;min-height:0;display:grid;gap:12px;padding:0 14px 12px;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);grid-template-areas:"shop ctl"}
      .ic-shop{grid-area:shop;position:relative;min-height:0;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);
        background:linear-gradient(#ffeef6 0 62%,#f7c6dc 62% 64%,#ffd9b8 64%)}
      .ic-shop::before{content:"";position:absolute;left:0;right:0;top:0;height:16%;background:repeating-linear-gradient(90deg,#ff8fb8 0 40px,#fff 40px 80px);
        -webkit-mask:radial-gradient(circle at 20px 100%,transparent 18px,#000 19px) 0 0/40px 100%;mask:radial-gradient(circle at 20px 100%,transparent 18px,#000 19px) 0 0/40px 100%}
      .ic-cust{position:absolute;left:4%;bottom:30%;width:40%;display:flex;flex-direction:column;align-items:center;transition:transform .6s cubic-bezier(.3,1.3,.5,1),opacity .4s}
      .ic-cust.away{transform:translateX(-140%);opacity:0}
      .ic-animal{font-size:clamp(90px,20vh,180px);line-height:1;filter:drop-shadow(0 8px 4px rgba(0,0,0,.15))}
      .ic-animal.nom{animation:icNom .25s ease-in-out 5}
      @keyframes icNom{50%{transform:scale(1.08,.92)}}
      .ic-bub{position:absolute;z-index:2;left:4%;top:18%;max-width:48%;background:#fff;border-radius:24px;padding:10px 16px;box-shadow:var(--shadow);display:flex;align-items:center;gap:10px;font-size:clamp(18px,2.6vw,26px);line-height:1.25;animation:popIn .4s cubic-bezier(.2,1.5,.4,1)}
      .ic-bub::after{content:"";position:absolute;left:30%;bottom:-16px;border:10px solid transparent;border-top:16px solid #fff}
      .ic-bub svg{height:clamp(70px,12vh,120px);width:auto;flex:0 0 auto}
      .ic-cone{position:absolute;right:6%;bottom:6%;height:86%;aspect-ratio:200/370;transition:transform .7s cubic-bezier(.5,0,.5,1),opacity .5s}
      .ic-cone svg{width:100%;height:100%;overflow:visible}
      .ic-cone.serve{opacity:0}
      .ic-cone .drop{animation:icDrop .45s cubic-bezier(.3,1.4,.5,1)}
      @keyframes icDrop{from{transform:translateY(-260px)}}
      .ic-cone .wob{animation:wig .35s}
      .ic-heart{position:absolute;font-size:44px;pointer-events:none;animation:icHeart 1.4s ease-out forwards}
      @keyframes icHeart{from{transform:translate(-50%,0) scale(.4);opacity:1}to{transform:translate(-50%,-180px) scale(1.3);opacity:0}}
      .ic-ctl{grid-area:ctl;display:flex;flex-direction:column;gap:10px;justify-content:center;width:clamp(260px,30vw,340px)}
      .ic-row{display:grid;gap:8px}
      .ic-mix{display:flex;flex-direction:column;gap:10px}
      .ic-fl{grid-template-columns:repeat(3,1fr)}
      .ic-tp{grid-template-columns:repeat(3,1fr)}
      .ic-ct{grid-template-columns:repeat(2,1fr)}
      .ic-ac{grid-template-columns:repeat(3,1fr)}
      .ic-b{background:#fff;border-radius:20px;box-shadow:0 5px 0 rgba(47,58,102,.13);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 2px;font-size:clamp(14px,1.8vw,18px);min-height:clamp(70px,10.5vh,92px)}
      .ic-b svg{width:clamp(38px,5.6vh,52px);height:clamp(38px,5.6vh,52px)}
      .ic-b .e{font-size:clamp(34px,5vh,46px)}
      .ic-b.sel{box-shadow:0 0 0 4px var(--sun),0 5px 0 #d9a000;background:#fff8dc}
      .ic-b:active{transform:translateY(3px)}
      .ic-b.serve{background:var(--grass);color:#fff;box-shadow:0 5px 0 #1d7f45}
      @media (max-aspect-ratio:1/1){
        .ic{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"shop" "ctl";gap:8px;padding:0 10px 10px}
        .ic-ctl{width:auto;gap:7px}
        .ic-fl{grid-template-columns:repeat(6,1fr)}
        .ic-mix{display:grid;grid-template-columns:2fr 3fr;gap:8px}
        .ic-b{min-height:62px;border-radius:16px;font-size:13px}
        .ic-b svg{width:36px;height:36px}
        .ic-b .e{font-size:32px}
        .ic-bub{max-width:62%;font-size:17px;padding:8px 12px}
        .ic-bub svg{height:64px}
        .ic-cust{width:44%;bottom:24%}
        .ic-animal{font-size:clamp(80px,11vh,120px)}
      }
    `);

    const FLAVORS = [
      ["딸기", "#ff9fbc", "#e86f95"], ["초코", "#8d5a3b", "#6a3f26"], ["바닐라", "#fff1c9", "#e8cf8a"],
      ["민트", "#9fe8cf", "#5cc4a2"], ["포도", "#c4a3f0", "#9a73d4"], ["바나나", "#ffe773", "#e2c13a"],
    ];
    const CUSTOMERS = [
      ["🐻", "곰"], ["🐰", "토끼"], ["🐱", "고양이"], ["🐶", "강아지"], ["🐼", "판다"], ["🦊", "여우"],
      ["🐸", "개구리"], ["🐵", "원숭이"], ["🐯", "호랑이"], ["🐧", "펭귄"], ["🐨", "코알라"], ["🐷", "돼지"],
    ];
    const INK = "#5a3a4a";

    /* ---------- 아이스크림 그림 ---------- */
    const SPR = [[-22, -12, 20], [8, -22, -30], [24, -4, 60], [-6, -2, 10], [-30, 4, -50], [14, 8, 35]];
    const SPRC = ["#ff5d8f", "#2f95f5", "#ffd23f", "#2fd47a", "#ffffff", "#8a63ee"];
    const CHIP = [[-18, -6], [14, -16], [26, 6], [-2, 8], [-30, -14]];
    function iceSVG(st, o = {}) {
      const scoops = st.scoops;
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -76 200 376">';
      if (st.cont === "cup") {
        s += '<path d="M46 184 H154 L138 288 H62Z" fill="#7cc8ff" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        s += '<path d="M51 214 H149 M56 246 H144" stroke="#fff" stroke-width="9" opacity=".8"/>';
        s += '<rect x="40" y="176" width="120" height="16" rx="7" fill="#a6dcff" stroke="' + INK + '" stroke-width="5"/>';
      } else {
        s += '<path d="M56 180 H144 L100 292Z" fill="#f2b863" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        s += '<path d="M68 196 L118 254 M86 186 L126 232 M110 182 L134 210 M132 196 L84 254 M114 186 L74 230 M92 182 L66 210" stroke="#c98a3c" stroke-width="4"/>';
      }
      scoops.forEach((f, i) => {
        const cy = 166 - i * 36;
        const [, col, dark] = FLAVORS[f];
        const cls = o.dropLast && i === scoops.length - 1 ? ' class="drop"' : "";
        s += "<g" + cls + ">";
        s += '<path d="M54 ' + (cy + 10) + " C48 " + (cy - 44) + " 152 " + (cy - 44) + " 146 " + (cy + 10) +
          " Q138 " + (cy + 22) + " 128 " + (cy + 13) + " Q118 " + (cy + 28) + " 106 " + (cy + 15) + " Q96 " + (cy + 30) + " 86 " + (cy + 15) +
          " Q74 " + (cy + 26) + " 66 " + (cy + 13) + " Q58 " + (cy + 22) + " 54 " + (cy + 10) + 'Z" fill="' + col + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
        s += '<path d="M66 ' + (cy + 6) + " Q100 " + (cy + 16) + " 134 " + (cy + 6) + '" stroke="' + dark + '" stroke-width="4" fill="none" opacity=".5"/>';
        s += '<ellipse cx="80" cy="' + (cy - 14) + '" rx="11" ry="7" fill="#fff" opacity=".55" transform="rotate(-25 80 ' + (cy - 14) + ')"/>';
        if (st.chip) CHIP.forEach(([dx, dy], k) => (s += '<ellipse cx="' + (100 + dx) + '" cy="' + (cy + dy) + '" rx="4.5" ry="3.2" fill="#4a2a1a" transform="rotate(' + k * 40 + " " + (100 + dx) + " " + (cy + dy) + ')"/>'));
        if (st.sprinkle) SPR.forEach(([dx, dy, rot], k) => (s += '<rect x="' + (100 + dx - 6) + '" y="' + (cy + dy - 2) + '" width="12" height="4.5" rx="2.2" fill="' + SPRC[(k + i) % 6] + '" transform="rotate(' + rot + " " + (100 + dx) + " " + (cy + dy) + ')"/>'));
        s += "</g>";
      });
      if (st.cherry && scoops.length) {
        const ty = 166 - (scoops.length - 1) * 36 - 40;
        s += '<path d="M100 ' + (ty - 4) + " Q104 " + (ty - 30) + " 120 " + (ty - 36) + '" stroke="#3f8a3a" stroke-width="4" fill="none" stroke-linecap="round"/>';
        s += '<circle cx="100" cy="' + ty + '" r="15" fill="#e8253f" stroke="' + INK + '" stroke-width="4"/><circle cx="94" cy="' + (ty - 5) + '" r="4.5" fill="#fff" opacity=".8"/>';
      }
      return s + "</svg>";
    }
    const scoopIcon = (f) => iceSVG({ cont: "none", scoops: [f] }).replace('viewBox="0 -76 200 376"', 'viewBox="44 112 112 84"');

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "ic");
    const shop = U.el("div", "ic-shop");
    const cust = U.el("div", "ic-cust");
    const animal = U.el("div", "ic-animal");
    cust.appendChild(animal);
    const bub = U.el("div", "ic-bub");
    const cone = U.el("div", "ic-cone");
    shop.append(cust, bub, cone);
    const ctl = U.el("div", "ic-ctl");
    const rowFl = U.el("div", "ic-row ic-fl");
    const mix = U.el("div", "ic-mix");
    const rowCt = U.el("div", "ic-row ic-ct");
    const rowTp = U.el("div", "ic-row ic-tp");
    const rowAc = U.el("div", "ic-row ic-ac");
    mix.append(rowCt, rowTp);
    ctl.append(rowFl, mix, rowAc);
    wrap.append(shop, ctl);
    ctx.body.appendChild(wrap);

    let st = { cont: "cone", scoops: [], sprinkle: false, cherry: false, chip: false };
    let order = null,
      who = null,
      busy = false,
      unsavedPic = false;
    function draw(dropLast) {
      cone.innerHTML = iceSVG(st, { dropLast });
      unsavedPic = true;
    }

    const flBtns = FLAVORS.map(([name], i) => {
      const b = U.btn(scoopIcon(i) + "<span>" + name + "</span>", "ic-b");
      ctx.tap(b, () => {
        if (busy) return;
        if (st.scoops.length >= 5) {
          ctx.miss(b, "아이스크림이 가득 찼어요!");
          return;
        }
        st.scoops.push(i);
        draw(true);
        U.replay(b, "jump");
        A.note(A.SCALE[st.scoops.length + 1], { inst: "marimba", dur: 0.3, vol: 0.26, when: 0.25 });
        A.tone(700, { to: 260, dur: 0.28, vol: 0.12, when: 0.0, type: "sine" });
        A.sfx("drop");
        KP.voice.say(name + "! " + ["", "한", "두", "세", "네", "다섯"][st.scoops.length] + " 개");
        afterChange();
      });
      rowFl.appendChild(b);
      return b;
    });
    const CONTS = [["cone", "콘", '<svg viewBox="40 170 120 130">' + '<path d="M56 180 H144 L100 292Z" fill="#f2b863" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/></svg>'],
      ["cup", "컵", '<svg viewBox="30 166 140 130"><path d="M46 184 H154 L138 288 H62Z" fill="#7cc8ff" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><rect x="40" y="176" width="120" height="16" rx="7" fill="#a6dcff" stroke="' + INK + '" stroke-width="6"/></svg>']];
    const ctBtns = CONTS.map(([id, name, svg]) => {
      const b = U.btn(svg + "<span>" + name + "</span>", "ic-b");
      ctx.tap(b, () => {
        if (busy) return;
        st.cont = id;
        draw();
        markSel();
        U.replay(b, "jump");
        A.sfx("pick");
        KP.voice.say(name);
        afterChange();
      });
      rowCt.appendChild(b);
      return b;
    });
    const TOPS = [["sprinkle", "스프링클", "🌈"], ["cherry", "체리", "🍒"], ["chip", "초코칩", "🍫"]];
    const tpBtns = TOPS.map(([id, name, em]) => {
      const b = U.btn(KP.E(em) + "<span>" + name + "</span>", "ic-b");
      ctx.tap(b, () => {
        if (busy) return;
        if (!st.scoops.length) {
          ctx.miss(b, "먼저 아이스크림을 담아요!");
          return;
        }
        st[id] = !st[id];
        draw();
        markSel();
        U.replay(b, "jump");
        if (st[id]) {
          A.sfx("sparkle");
          KP.voice.say(name + "!");
        } else A.sfx("slide");
        afterChange();
      });
      rowTp.appendChild(b);
      return b;
    });
    const bUndo = U.btn(KP.E("↩️") + "<span>빼기</span>", "ic-b");
    const bPic = U.btn(KP.E("📸") + "<span>사진</span>", "ic-b");
    const bServe = U.btn(KP.E("🤲") + "<span>드리기</span>", "ic-b serve");
    rowAc.append(bUndo, bPic, bServe);
    function markSel() {
      ctBtns.forEach((b, i) => b.classList.toggle("sel", CONTS[i][0] === st.cont));
      tpBtns.forEach((b, i) => b.classList.toggle("sel", !!st[TOPS[i][0]]));
    }
    ctx.tap(bUndo, () => {
      if (busy) return;
      if (!st.scoops.length) {
        U.replay(bUndo, "wrong");
        A.sfx("bad");
        return;
      }
      st.scoops.pop();
      if (!st.scoops.length) Object.assign(st, { sprinkle: false, cherry: false, chip: false });
      draw();
      markSel();
      A.sfx("slide");
      U.replay(bUndo, "wig");
      afterChange();
    });

    /* ---------- 손님 · 주문 ---------- */
    function makeOrder() {
      const lv = ctx.level;
      if (lv === 1) return { free: true };
      if (lv === 2) {
        const f = U.rand(FLAVORS.length);
        return { counts: { [f]: 1 + U.rand(3) } };
      }
      const [f1, f2] = U.sample([0, 1, 2, 3, 4, 5], 2);
      const o = { counts: { [f1]: 1 + U.rand(2), [f2]: 1 + U.rand(2) } };
      if (Math.random() < 0.5) o.cont = U.pick(["cone", "cup"]);
      if (Math.random() < 0.45) o.top = U.pick(["cherry", "sprinkle", "chip"]);
      return o;
    }
    function orderText(o) {
      if (o.free) return U.pick(["아이스크림 주세요! 맛있게 만들어 주세요!", "제일 맛있는 아이스크림 주세요!", "아이스크림 하나 주세요!"]);
      const parts = Object.entries(o.counts).map(([f, n]) => FLAVORS[f][0] + " " + ["", "하나", "두 개", "세 개"][n]);
      let t = parts.join(", ");
      if (o.cont) t = (o.cont === "cup" ? "컵에 " : "콘에 ") + t;
      t += " 주세요!";
      if (o.top) t += " " + { cherry: "체리", sprinkle: "스프링클", chip: "초코칩" }[o.top] + "도 올려 주세요!";
      return t;
    }
    function orderPic(o) {
      if (o.free) return iceSVG({ cont: "cone", scoops: [0, 2, 1] }).replace("<svg ", '<svg style="opacity:.9" ');
      const scoops = [];
      Object.entries(o.counts).forEach(([f, n]) => {
        for (let i = 0; i < n; i++) scoops.push(+f);
      });
      return iceSVG({ cont: o.cont || "cone", scoops, sprinkle: o.top === "sprinkle", cherry: o.top === "cherry", chip: o.top === "chip" });
    }
    function newCustomer() {
      busy = false;
      st = { cont: "cone", scoops: [], sprinkle: false, cherry: false, chip: false };
      draw();
      unsavedPic = false;
      cone.classList.remove("serve");
      cone.style.transform = "";
      markSel();
      const pool = CUSTOMERS.filter((c) => !who || c[0] !== who[0]);
      who = U.pick(pool);
      order = makeOrder();
      animal.innerHTML = KP.E(who[0]);
      cust.classList.add("away");
      bub.style.display = "none";
      ctx.after(60, () => {
        cust.classList.remove("away");
        A.sfx("open");
      });
      ctx.after(650, () => {
        const txt = orderText(order);
        bub.innerHTML = orderPic(order) + "<span>" + txt + "</span>";
        bub.style.display = "";
        U.replay(bub, "pop");
        ctx.say(who[1] + " 손님이 왔어요! " + (order.free ? "맛있는 아이스크림을 만들어 드려요." : txt));
        hint();
      });
    }
    function need() {
      // 다음에 눌러야 할 맛 단추 (힌트용)
      if (!order || order.free) return st.scoops.length ? bServe : flBtns[U.rand(6)];
      const have = {};
      st.scoops.forEach((f) => (have[f] = (have[f] || 0) + 1));
      for (const [f, n] of Object.entries(order.counts)) if ((have[f] || 0) < n) return flBtns[f];
      if (order.cont && st.cont !== order.cont) return ctBtns[order.cont === "cone" ? 0 : 1];
      if (order.top && !st[order.top]) return tpBtns[TOPS.findIndex((t) => t[0] === order.top)];
      return bServe;
    }
    function hint() {
      ctx.hint(need, order && !order.free ? orderText(order) : "맛을 골라 아이스크림을 만들어요!");
    }
    function afterChange() {
      hint();
    }
    function check() {
      if (order.free) return null;
      const have = {};
      st.scoops.forEach((f) => (have[f] = (have[f] || 0) + 1));
      const CNT = ["", "한", "두", "세", "네", "다섯"];
      for (const [f, n] of Object.entries(order.counts)) {
        const h = have[f] || 0,
          nm = FLAVORS[f][0];
        if (h < n) return U.josa(nm, "이/가") + " " + CNT[n] + " 개 있어야 해요!";
        if (h > n) return U.josa(nm, "이/가") + " 너무 많아요! " + CNT[n] + " 개만 주세요.";
      }
      for (const f of Object.keys(have)) if (!(f in order.counts)) return U.josa(FLAVORS[f][0], "은/는") + " 안 시켰어요!";
      if (order.cont && st.cont !== order.cont) return (order.cont === "cup" ? "컵" : "콘") + "에 담아 주세요!";
      if (order.top && !st[order.top]) return { cherry: "체리", sprinkle: "스프링클", chip: "초코칩" }[order.top] + "도 올려 주세요!";
      return null;
    }
    ctx.tap(bServe, async () => {
      if (busy) return;
      if (!st.scoops.length) {
        ctx.miss(bServe, "먼저 아이스크림을 담아요!");
        return;
      }
      const wrong = check();
      if (wrong) {
        ctx.miss(animal, "음… " + wrong);
        U.replay(bub, "pop");
        return;
      }
      busy = true;
      ctx.hint(null);
      // 아이스크림이 손님에게
      const a = cone.getBoundingClientRect(),
        b = animal.getBoundingClientRect();
      cone.style.transform = "translate(" + (b.left + b.width * 0.7 - a.left - a.width / 2) + "px," + (b.top + b.height * 0.6 - a.top - a.height / 2) + "px) scale(.45)";
      A.sfx("whoosh");
      bub.style.display = "none";
      await ctx.wait(700);
      cone.classList.add("serve");
      animal.classList.add("nom");
      for (let i = 0; i < 4; i++) A.noise({ dur: 0.09, vol: 0.12, bp: 700, q: 1.5, when: i * 0.26 });
      KP.voice.say(U.pick(["냠냠! 정말 맛있어요! 고마워요!", "우와, 맛있다! 고마워요!", "냠냠냠! 최고예요!"]));
      for (let i = 0; i < 6; i++)
        ctx.after(i * 160, () => {
          const h = U.el("div", "ic-heart", KP.E(U.pick(["❤️", "💖", "😋"])));
          const r = cust.getBoundingClientRect(),
            sr = shop.getBoundingClientRect();
          h.style.left = r.left - sr.left + r.width * (0.3 + Math.random() * 0.4) + "px";
          h.style.top = r.top - sr.top + "px";
          shop.appendChild(h);
          setTimeout(() => h.remove(), 1500);
        });
      await ctx.wait(1400);
      animal.classList.remove("nom");
      ctx.score.add();
      ctx.round = (ctx.round || 0) + 1;
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "최고의 아이스크림 가게!" : U.pick(["손님이 좋아해요!", "맛있대요!", "잘 만들었어요!"]) });
      if (!ok) return;
      cust.classList.add("away");
      await ctx.wait(500);
      newCustomer();
    });

    /* ---------- 📸 내 작품 ---------- */
    ctx.tap(bPic, async () => {
      if (busy || bPic.dataset.busy) return;
      if (!st.scoops.length) {
        ctx.miss(bPic, "먼저 아이스크림을 만들어요!");
        return;
      }
      if (!unsavedPic) {
        KP.voice.say("벌써 찍었어요!");
        return;
      }
      bPic.dataset.busy = "1";
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      A.noise({ dur: 0.08, vol: 0.18, hp: 1200, when: 0.09 });
      const img = await toJpeg(iceSVG(st));
      if (img) {
        const d = new Date();
        const ok = await KP.db.put("art", { id: KP.newId(), kind: "icecream", img, t: Date.now(), date: d.getMonth() + 1 + "월 " + d.getDate() + "일" });
        flyAway(img, cone);
        if (ok) {
          unsavedPic = false;
          KP.toast("🖼️ 내 작품에 저장했어요!");
          KP.voice.say("찰칵! 내 작품에 저장했어요!");
          A.sfx("sticker");
        } else KP.toast("저장하지 못했어요");
      }
      delete bPic.dataset.busy;
    });
    function toJpeg(svg) {
      return new Promise((res) => {
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = 760;
          c.height = 1000;
          const x = c.getContext("2d");
          const g = x.createLinearGradient(0, 0, 0, 1000);
          g.addColorStop(0, "#ffeef6");
          g.addColorStop(0.7, "#ffe0ee");
          g.addColorStop(0.7, "#ffd9b8");
          g.addColorStop(1, "#ffcfa3");
          x.fillStyle = g;
          x.fillRect(0, 0, 760, 1000);
          for (let i = 0; i < 19; i++) {
            x.fillStyle = i % 2 ? "#fff" : "#ff8fb8";
            x.fillRect(i * 40, 0, 40, 90);
          }
          x.drawImage(im, 130, 140, 500, 940 * (500 / 540));
          try {
            res(c.toDataURL("image/jpeg", 0.85));
          } catch (e) {
            res(null);
          }
        };
        im.onerror = () => res(null);
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg width="200" height="376" '));
      });
    }
    function flyAway(img, fromEl) {
      const a = fromEl.getBoundingClientRect();
      const home = ctx.root.querySelector(".bar .home");
      const b = home ? home.getBoundingClientRect() : { left: 0, top: 0, width: 40, height: 40 };
      const f = U.el("img");
      f.src = img;
      Object.assign(f.style, {
        position: "fixed", left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", objectFit: "contain",
        zIndex: 90, borderRadius: "18px", pointerEvents: "none", transition: "transform .9s cubic-bezier(.5,-0.35,.6,1), opacity .9s",
      });
      document.body.appendChild(f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          f.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.06) rotate(25deg)";
          f.style.opacity = "0.5";
        })
      );
      setTimeout(() => {
        f.remove();
        if (home) U.replay(home, "bump");
      }, 950);
    }
    ctx.newCustomer = newCustomer;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.newCustomer();
  },
});
