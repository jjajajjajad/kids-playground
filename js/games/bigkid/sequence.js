/* 순서대로 놓기 — 그림 카드를 일어난 순서대로 빈칸 1·2·3 에 끌어 놓기
   1단계: 3장 (첫 장면은 미리 놓여 있음, 쉬운 이야기만)
   2단계: 3장 모두 직접 놓기 (이야기 전체)
   3단계: 4장 모두 직접 놓기
   완성하면 카드가 차례로 반짝이며 짧은 이야기를 들려준다. */
"use strict";
KP.game({
  id: "sequence",
  icon: "🎞️",
  name: "순서대로 놓기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("sequence", `
      .sqWrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:4px 10px 14px;gap:10px}
      .sqRow{display:flex;align-items:center;justify-content:center;gap:clamp(4px,1vw,12px);flex-wrap:nowrap;max-width:100%}
      .sqWrap{--cw:clamp(96px,24vw,200px)}
      .sqWrap.n4{--cw:clamp(76px,20.5vw,180px)}
      @media (orientation:portrait){.sqWrap{--cw:min(27vw,200px)}.sqWrap.n4{--cw:min(19.5vw,180px)}.sqRow{gap:3px}.sqTray .sqCard{width:calc(var(--cw)*1.2);height:calc(var(--cw)*1.2)}.sqArrow{font-size:14px}}
      @media (max-height:700px) and (orientation:landscape){.sqWrap{--cw:clamp(96px,23vh,180px)}.sqWrap.n4{--cw:clamp(86px,23vh,170px)}}
      .sqSlot{width:var(--cw);height:var(--cw);position:relative;border-radius:24px;flex:0 0 auto}
      .sqNum{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:calc(var(--cw)*.42);color:rgba(47,58,102,.22);line-height:1}
      .sqSlot.filled .sqNum{display:none}
      .sqTag{position:absolute;left:-6px;top:-8px;z-index:4;width:calc(var(--cw)*.26);height:calc(var(--cw)*.26);min-width:26px;min-height:26px;border-radius:50%;background:var(--cat);color:#fff;display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.16);box-shadow:0 3px 0 rgba(0,0,0,.15)}
      .sqArrow{font-size:clamp(18px,3vw,34px);color:#f2a640;flex:0 0 auto;line-height:1}
      .sqTray{display:flex;gap:clamp(10px,2.4vw,26px);justify-content:center;flex-wrap:wrap;min-height:var(--cw);align-items:center}
      .sqCard{width:var(--cw);height:var(--cw);border-radius:24px;background:#fff;box-shadow:0 7px 0 rgba(47,58,102,.14);position:relative;display:flex;align-items:center;justify-content:center;font-size:calc(var(--cw)*.62);line-height:1;flex:0 0 auto}
      .sqCard.item{animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*80ms)}
      .sqSlot .sqCard{position:absolute;inset:0;width:auto;height:auto;box-shadow:0 5px 0 color-mix(in srgb,var(--cat) 45%,#fff);animation:popIn .3s}
      .sqSub{position:absolute;right:6%;bottom:6%;font-size:.42em;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
      .sqSubL{position:absolute;left:6%;bottom:6%;font-size:.42em}
      .sqMain{position:relative;display:inline-flex}
      .sqMain.s1{font-size:.55em}.sqMain.s2{font-size:.78em}.sqMain.s3{font-size:1em}
      .sqMain.melt{transform:scaleY(.55) translateY(40%)}
      .sqCocoon{width:.36em;height:.62em;border-radius:50% 50% 46% 46%/58% 58% 42% 42%;background:linear-gradient(90deg,#9a7b3a,#c9a85a 45%,#8d6c2c);box-shadow:inset 0 -.05em 0 rgba(0,0,0,.18);position:relative;top:.12em}
      .sqCocoon:before{content:"";position:absolute;left:50%;top:-.24em;width:.03em;height:.26em;background:#6b4f1d;transform:translateX(-50%)}
      .sqCocoon:after{content:"";position:absolute;left:12%;right:12%;top:30%;height:.04em;background:rgba(80,55,10,.35);box-shadow:0 .12em 0 rgba(80,55,10,.35),0 .24em 0 rgba(80,55,10,.3)}
      .sqLeaf{position:absolute;left:8%;top:6%;font-size:.42em;transform:rotate(-20deg)}
      .sqBall{width:.5em;height:.5em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#e6f1ff 60%,#bcd3ef);box-shadow:0 .04em 0 rgba(0,0,0,.12)}
      .sqCard.shine{animation:sqShine .9s ease-in-out;z-index:3}
      @keyframes sqShine{0%,100%{transform:none}40%{transform:scale(1.14) rotate(-3deg);box-shadow:0 0 0 8px #ffd54a,0 0 34px 10px rgba(255,213,74,.8)}}
      .sqCard.done{background:#fffbe8}
    `);
    // 이야기: [그림, 작은그림, 말, 꾸밈] — 4장면. 3장면은 s3 (사용할 장면 번호)
    ctx.STORIES = [
      { name: "꽃", easy: 1, s3: [0, 1, 3], steps: [["🫘", "", "씨앗을 심었어요"], ["🌱", "", "새싹이 쏙 났어요"], ["🌿", "", "쑥쑥 자랐어요"], ["🌻", "", "꽃이 활짝 피었어요"]] },
      { name: "닭", easy: 1, s3: [0, 1, 3], steps: [["🥚", "", "알이 있어요"], ["🐣", "", "알이 톡톡 깨졌어요"], ["🐥", "", "삐약삐약 병아리가 나왔어요"], ["🐔", "", "꼬끼오! 닭이 되었어요"]] },
      { name: "풍선", easy: 1, s3: [0, 2, 3], steps: [["🎈", "", "풍선을 후 불어요", "s1"], ["🎈", "", "후우 더 커졌어요", "s2"], ["🎈", "", "커다란 풍선이 되었어요", "s3"], ["💥", "", "펑! 터졌어요"]] },
      { name: "무지개", easy: 1, s3: [1, 2, 3], steps: [["☀️", "", "해님이 반짝반짝"], ["☁️", "", "구름이 몰려와요"], ["🌧️", "", "주룩주룩 비가 와요"], ["🌈", "", "비가 그치고 무지개가 떴어요"]] },
      { name: "나비", s3: [0, 1, 2], steps: [["🐛", "🍃", "애벌레가 냠냠 잎을 먹어요"], ["cocoon", "", "번데기가 되었어요"], ["🦋", "", "나비가 되었어요"], ["🦋", "🌸", "나비가 꽃으로 훨훨 날아가요"]] },
      { name: "케이크", s3: [0, 1, 2], steps: [["🥚", "🥛", "달걀이랑 우유를 준비해요"], ["🥣", "", "반죽을 휘휘 섞어요"], ["🎂", "", "케이크가 완성됐어요"], ["😋", "🍰", "냠냠 맛있게 먹어요"]] },
      { name: "아침", s3: [0, 1, 2], steps: [["😴", "", "쿨쿨 잠을 자요"], ["🧼", "🫧", "일어나서 세수해요"], ["👕", "", "옷을 입어요"], ["🎒", "", "유치원에 가요"]] },
      { name: "눈사람", s3: [0, 1, 2], steps: [["❄️", "", "하얀 눈이 펑펑 와요"], ["ball", "", "눈을 데굴데굴 굴려요"], ["⛄", "", "눈사람 완성"], ["💧", "☀️", "해님이 나와서 눈사람이 녹았어요", "melt"]] },
      { name: "사과", s3: [0, 1, 2], steps: [["🌸", "", "사과나무에 꽃이 피어요"], ["🍏", "", "작은 초록 사과가 열렸어요"], ["🍎", "", "빨갛게 익었어요"], ["😋", "🍎", "아삭아삭 맛있어요"]] },
    ];
    ctx.wrap = U.el("div", "sqWrap");
    ctx.row = U.el("div", "sqRow");
    ctx.tray = U.el("div", "sqTray");
    ctx.wrap.append(ctx.row, ctx.tray);
    ctx.body.appendChild(ctx.wrap);
    ctx.round = 0;
    ctx.token = 0;
  },
  start(ctx) {
    ctx.round = 0;
    ctx.last = null;
    this.next(ctx);
  },
  art(step) {
    const [main, sub, , mod] = step;
    let m;
    if (main === "cocoon") m = '<span class="sqMain"><span class="sqLeaf">' + KP.E("🍃") + '</span><span class="sqCocoon"></span></span>';
    else if (main === "ball") m = '<span class="sqMain"><span class="sqBall"></span></span>';
    else m = '<span class="sqMain ' + (mod || "") + '">' + KP.E(main) + "</span>";
    return m + (sub ? '<span class="sqSub">' + KP.E(sub) + "</span>" : "");
  },
  speak(ctx, text) {
    return new Promise((res) => {
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        res();
      };
      KP.voice.say(text, { onend: fin });
      ctx.after(Math.max(1300, text.length * 210), fin);
    });
  },
  next(ctx) {
    const U = KP.u;
    const lv = ctx.level;
    const tok = ++ctx.token;
    const n = lv === 3 ? 4 : 3;
    let pool = ctx.STORIES.filter((s) => (lv === 1 ? s.easy : true) && s !== ctx.last);
    const story = U.pick(pool);
    ctx.last = story;
    const steps = n === 4 ? story.steps : story.s3.map((i) => story.steps[i]);
    const pre = lv === 1 ? 1 : 0; // 1단계: 첫 장면은 미리 놓아 줌

    ctx.wrap.classList.toggle("n4", n === 4);
    ctx.row.innerHTML = "";
    ctx.tray.innerHTML = "";
    ctx.say(pre ? "다음엔 무슨 일이 생길까? 그림을 순서대로 놓아요!" : (n === 4 ? "어떤 순서로 일어났을까? 1부터 4까지 차례로 놓아요!" : "어떤 순서로 일어났을까? 1, 2, 3 순서대로 놓아요!"));

    const slots = steps.map((s, i) => {
      if (i) ctx.row.appendChild(U.el("span", "sqArrow", "▶"));
      const sl = U.el("div", "sqSlot slot", '<span class="sqNum">' + (i + 1) + '</span><span class="sqTag">' + (i + 1) + "</span>");
      sl.dataset.i = i;
      ctx.row.appendChild(sl);
      return sl;
    });
    const cards = steps.map((s, i) => {
      const c = U.el("div", "sqCard", this.art(s));
      c.dataset.i = i;
      return c;
    });
    let left = n - pre;
    for (let i = 0; i < pre; i++) {
      slots[i].appendChild(cards[i]);
      slots[i].classList.add("filled");
    }
    U.shuffle(cards.slice(pre)).forEach((c, k) => {
      c.classList.add("item");
      c.style.setProperty("--i", k);
      ctx.tray.appendChild(c);
      const i = +c.dataset.i;
      const d = KP.drag(c, {
        targets: () => slots.filter((s) => !s.classList.contains("filled")),
        accept: (t) => +t.dataset.i === i,
        onReject: (t) => {
          const want = slots.find((s) => !s.classList.contains("filled"));
          ctx.miss(t, +t.dataset.i < i ? "음, 이건 조금 나중 일이에요. 다른 그림을 찾아볼까?" : "이건 조금 먼저 일어난 일이에요. 다시 생각해 볼까?");
        },
        onDrop: (t) => {
          if (!t) return;
          d.lock();
          c.style.transform = "";
          c.classList.remove("item");
          t.appendChild(c);
          t.classList.add("filled");
          KP.audio.sfx("snap");
          KP.voice.say(steps[i][2]);
          left--;
          if (left === 0) finish();
          else hint();
        },
      });
    });
    const hint = () => {
      const s = slots.find((x) => !x.classList.contains("filled"));
      const c = cards[+s.dataset.i];
      ctx.hint(() => c, (+s.dataset.i + 1) + "번에 올 그림은 뭘까? 끌어서 놓아요!");
    };
    hint();
    const finish = async () => {
      ctx.hint(null);
      await ctx.wait(500);
      if (tok !== ctx.token) return;
      // 차례로 반짝이며 이야기 들려주기
      for (let i = 0; i < n; i++) {
        if (tok !== ctx.token || !ctx._active) return;
        const c = cards[i];
        U.replay(c, "shine");
        c.classList.add("done");
        KP.audio.note(KP.audio.SCALE[Math.min(i * 2, KP.audio.SCALE.length - 1)], { inst: "bell", dur: 0.5, vol: 0.22 });
        await this.speak(ctx, steps[i][2]);
      }
      if (tok !== ctx.token) return;
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "이야기 박사 형아!" : "순서대로 척척!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});
