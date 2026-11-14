/* 변신 로봇 — 하성이가 만들자고 한 놀이 (2026-11-14)
   친구 일곱: 하송(h, 비행기 — 하성이가 전에 만든 캐릭터) · 삐뽀(p, 경찰차) · 소방이(f, 소방차) · 두두(c, 헬리콥터)
              쿵쿵이(d, 공룡) · 어흥이(l, 사자) · 깡총이(r, 토끼) — 동물 친구는 '로봇 ↔ 동물 모습'으로 변신(-veh = 동물 모습)
   그림은 힉스필드로 뽑아 assets/robot/*.webp 에 둠 (원본·만드는 법: tools/out/robot/hf, 굽기: hf/bake.js)
     <친구>-robot · -veh(탈것 모습) · -eat · -brush · -hello · -t-<도구> : 낱장
     <친구>-tf-veh(로봇→탈것 6칸) · <친구>-dance(춤 6칸) · h-tf-car/rocket/boat + h-car/rocket/boat(하송만 네 가지로 변신) : 3×2 시트는 칸을 차례로 넘겨 움직임
     bg-* : 배경
   ① 친구 고르기 → 도구 둘 고르기(9가지) (저장: robot:me)
   ② 시키기(집): 아침·치카·춤·인사·도구 둘·출발 단추를 누르면 로봇이 그대로 함. 곰돌이가 시킨 것을 차례로 누르면 성공
      1단계: 하나 / 2단계: 둘 / 3단계: 셋 ("아침 먹고! 치카하고! 슝 날아가요!" — 하성이 주문)
      딴 단추를 눌러도 로봇은 그대로 하고 벌은 없음(두 번 넘게 딴 것을 누르면 열쇠 별만 없음)
   ③ 출동(세 판에 한 번): 일이 생기면 알맞은 친구를 골라 보냄 — 길 잃은 오리(경찰차)·불(소방차)·나무 위 고양이(헬리콥터)·하늘 별(비행기)
      ·길 막은 바위(공룡)·당근 뽑기(토끼)·늦잠 자는 마을 깨우기(사자)
      1단계: "경찰차 친구, 출동!" 들은 친구 고르기(보기 3) / 2단계: 일을 보고 고르기(보기 4)
      3단계: 달나라·바다도 나옴 → 하송을 고른 뒤 무엇으로 변신할지(로켓·배)까지 고르기 */
"use strict";
KP.game({
  id: "robot",
  icon: "🤖",
  name: "변신 로봇",
  cat: "make",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("robot", `
      .rb-wrap{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;width:100%}
      .rb-scene{position:relative;flex:1;min-height:0;border-radius:28px;overflow:hidden;box-shadow:0 0 0 5px #fff,0 8px 0 5px rgba(47,58,102,.14);background:#cfeeff;margin:5px}
      .rb-bg{position:absolute;inset:0;opacity:0;transition:opacity .45s;pointer-events:none;background-size:cover;background-repeat:no-repeat}
      .rb-bg.on{opacity:1}
      .rb-goal{position:absolute;left:0;top:0;font-size:clamp(46px,10vmin,88px);margin:-.55em 0 0 -.5em;pointer-events:none;transition:opacity .3s,transform .5s;z-index:1}
      .rb-goal::before{content:"";position:absolute;left:50%;top:50%;width:1.8em;height:1.8em;margin:-.9em 0 0 -.9em;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.9),rgba(255,255,255,0) 68%);z-index:-1}
      .rb-goal>*{display:block;animation:rbGoal 1.2s ease-in-out infinite alternate}
      .rb-goal.got{opacity:0}
      .rb-fix[hidden],.rb-goal[hidden],.rb-bot[hidden]{display:none}
      @keyframes rbGoal{to{transform:translateY(-8%) scale(1.08)}}
      .rb-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:4}
      .rb-flash.on{animation:rbFlash .5s}
      @keyframes rbFlash{15%{opacity:.95}100%{opacity:0}}
      .rb-scene.shake{animation:rbShake .3s}
      @keyframes rbShake{25%{transform:translateY(5px)}50%{transform:translateY(-3px)}75%{transform:translateY(3px)}}
      /* 로봇: 왼쪽 위(0,0)에서 px 로 옮김(가운데 기준). 이동은 transition */
      .rb-bot{position:absolute;left:0;top:0;width:var(--bs);height:var(--bs);margin:calc(var(--bs) / -2) 0 0 calc(var(--bs) / -2);transition:transform 1.7s cubic-bezier(.45,.05,.3,1);--bs:300px;touch-action:manipulation;cursor:pointer;z-index:2}
      .rb-bot.snap{transition:none}
      .rb-bob{width:100%;height:100%;animation:rbIdle 2.4s ease-in-out infinite alternate;transform-origin:50% 100%}
      @keyframes rbIdle{to{transform:translateY(-2.5%) scale(1.01,.99)}}
      .rb-bot.hop .rb-bob{animation:rbHop .5s}
      @keyframes rbHop{30%{transform:translateY(-12%) scale(.96,1.05)}60%{transform:translateY(0) scale(1.06,.94)}}
      .rb-bot.no .rb-bob{animation:rbNo .5s}
      @keyframes rbNo{20%,60%{transform:translateX(-5%) rotate(-5deg)}40%,80%{transform:translateX(5%) rotate(5deg)}}
      .rb-bot.chomp .rb-bob{animation:rbChomp .32s 4}
      @keyframes rbChomp{50%{transform:translateY(2.5%) scale(1.03,.96)}}
      .rb-bot.wob .rb-bob{animation:rbWob .3s ease-in-out 5 alternate}
      @keyframes rbWob{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}
      .rb-bot.hover .rb-bob{animation:rbHover 1.5s ease-in-out}
      @keyframes rbHover{35%,65%{transform:translateY(-16%)}}
      .rb-bot.going .rb-bob{animation:rbGo .28s ease-in-out infinite alternate}
      @keyframes rbGo{from{transform:translateY(-1.5%) rotate(-1.5deg)}to{transform:translateY(1.5%) rotate(1.5deg)}}
      .rb-bot.in .rb-bob{animation:rbIn .45s cubic-bezier(.3,1.5,.5,1)}
      @keyframes rbIn{from{transform:translateY(-60%) scale(.6);opacity:0}}
      .rb-pic{position:relative;width:100%;height:100%;background:center/contain no-repeat;pointer-events:none}
      /* 발밑 그림자: filter:drop-shadow 는 그림이 바뀔 때마다 다시 계산해 저가 기기에 무거워서(2026-11-14) 타원 하나로 바꿈. 날 때는 숨김 */
      .rb-sh{position:absolute;left:20%;right:20%;bottom:1.5%;height:8%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(20,30,70,.3),rgba(20,30,70,0) 70%);pointer-events:none;transition:opacity .25s}
      .rb-bot.going .rb-sh,.rb-bot.air .rb-sh,.rb-bot.hover .rb-sh{opacity:0}
      .rb-pic.pp{animation:rbPp .28s}
      @keyframes rbPp{0%{transform:scale(.9)}60%{transform:scale(1.05)}}
      /* 효과 그림(로봇 상자 안, % 자리) */
      .rb-fx{position:absolute;inset:0;pointer-events:none}
      .rb-f{position:absolute;font-size:calc(var(--bs) * .22);line-height:1;transform:translate(-50%,-50%);opacity:0}
      .rb-f.f-pop{animation:rbFpop var(--t,1.2s) forwards}
      @keyframes rbFpop{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}20%,75%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.3)}}
      .rb-f.f-rise{animation:rbFrise var(--t,1.6s) ease-in forwards}
      @keyframes rbFrise{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-320%) scale(1.2)}}
      .rb-f.f-fly{animation:rbFfly var(--t,1s) ease-out forwards}
      @keyframes rbFfly{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(var(--s,1))}}
      .rb-f.f-in{animation:rbFin var(--t,.8s) ease-in forwards}
      @keyframes rbFin{0%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.2)}20%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) scale(.4)}}
      .rb-f.f-big{font-size:calc(var(--bs) * .5);animation:rbFpop var(--t,1.3s) forwards}
      /* 아래 단추 줄: 반짝 장난감 단추 */
      .rb-bar{display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;flex:none;min-height:clamp(84px,14vmin,124px);padding:2px 0 6px}
      .rb-t{--k:#5aa9ff;--k2:#2f79cf;position:relative;font-size:clamp(40px,8.2vmin,68px);line-height:1;width:clamp(76px,14.5vmin,116px);height:clamp(76px,13.5vmin,108px);border-radius:26px;border:4px solid #fff;box-sizing:border-box;padding:0;display:flex;align-items:center;justify-content:center;
        background:radial-gradient(120% 90% at 50% 0%,rgba(255,255,255,.95) 0 38%,rgba(255,255,255,0) 60%),linear-gradient(var(--k),var(--k));box-shadow:0 7px 0 var(--k2),0 12px 14px rgba(20,30,70,.22)}
      .rb-t:active{transform:translateY(5px);box-shadow:0 2px 0 var(--k2),0 4px 6px rgba(20,30,70,.2)}
      .rb-t.k-eat{--k:#ffd166;--k2:#e0a92a}.rb-t.k-brush{--k:#ff9ec4;--k2:#e06a9b}.rb-t.k-dance{--k:#c4a5ff;--k2:#8e63e6}.rb-t.k-hello{--k:#8fe3a0;--k2:#49b565}
      .rb-t.k-tool{--k:#8fd0ff;--k2:#3f93d6}.rb-t.k-go{--k:#ff9d7a;--k2:#e3623a}.rb-t.k-pick{--k:#e9f1ff;--k2:#b9c8e6}
      .rb-t.right{--k:#b9f5b9;--k2:#5fc66a}
      .rb-t.sel{--k:#ffe680;--k2:#e0b62a}
      .rb-t svg{width:74%;height:74%}
      .rb-face{width:100%;height:100%;border-radius:20px;background:50% 14%/215% no-repeat}
      .rb-bar[data-many] .rb-t{width:clamp(66px,10.5vmin,98px);height:clamp(66px,10.5vmin,98px);font-size:clamp(36px,6.4vmin,58px);border-radius:22px}
      .rb-bar[data-big] .rb-t{width:clamp(80px,19vmin,170px);height:clamp(80px,19vmin,170px);border-radius:30px}
      @media (max-width:560px){.rb-bar{gap:9px}}
      .rb-fix{position:absolute;left:10px;top:10px;width:68px;height:68px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px #fff,0 5px 0 4px rgba(47,58,102,.18);border:0;padding:0;z-index:3;overflow:visible}
      .rb-fix .rb-face{border-radius:50%}
      .rb-fix i{position:absolute;right:-6px;bottom:-6px;width:30px;height:30px;border-radius:50%;background:#ffd93d;font-size:19px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(47,58,102,.2)}
      .rb-step{position:absolute;left:50%;top:10px;transform:translateX(-50%);display:flex;gap:8px;z-index:3;align-items:center;background:rgba(255,255,255,.55);border-radius:20px;padding:6px}
      .rb-step:empty{display:none}
      .rb-step b{width:48px;height:48px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;opacity:.7;box-shadow:0 3px 0 rgba(47,58,102,.12)}
      .rb-step b svg{width:80%;height:80%}
      .rb-step b.on{opacity:1;background:#d8ffd8;box-shadow:0 3px 0 #7fd67f}
      .rb-step b.now{opacity:1;outline:4px solid #ffd93d}
      @media (max-height:500px) and (min-aspect-ratio:1/1){.rb-wrap{flex-direction:row}.rb-bar{display:grid;grid-template-columns:repeat(2,auto);align-content:center;min-height:0;gap:8px;padding:0 4px}.rb-bar[data-many]{grid-template-columns:repeat(3,auto)}.rb-t,.rb-bar[data-many] .rb-t,.rb-bar[data-big] .rb-t{width:clamp(60px,17vh,80px);height:clamp(60px,17vh,80px);font-size:clamp(34px,10vh,50px);border-radius:20px}}
    `);
    const IMG = (ctx.IMG = (n) => (window.__RB && window.__RB[n]) || "assets/robot/" + n + ".webp");
    // 친구: [이름, 탈것 이름, 출발 단추 그림, 출발할 때 말, 날아가는지]
    ctx.CH = {
      h: { name: "하송", veh: "비행기", em: "✈️", go: "슝 날아가요!", fly: true },
      p: { name: "삐뽀", veh: "경찰차", em: "🚓", go: "부릉 출발해요!" },
      f: { name: "소방이", veh: "소방차", em: "🚒", go: "부릉 출발해요!" },
      c: { name: "두두", veh: "헬리콥터", em: "🚁", go: "슝 날아가요!", fly: true },
      d: { name: "쿵쿵이", veh: "공룡", em: "🦖", go: "쿵쿵 달려가요!" },
      l: { name: "어흥이", veh: "사자", em: "🦁", go: "다다다 달려가요!" },
      r: { name: "깡총이", veh: "토끼", em: "🐰", go: "깡충깡충 뛰어가요!" },
    };
    // 하송만 할 수 있는 변신: [단추 그림, 이름, 낱장, 시트]
    ctx.HMODE = { veh: ["✈️", "비행기", "h-veh", "h-tf-veh"], rocket: ["🚀", "로켓", "h-rocket", "h-tf-rocket"], boat: ["⛵", "배", "h-boat", "h-tf-boat"], car: ["🚗", "자동차", "h-car", "h-tf-car"] };
    // 도구: [단추 그림(null = 직접 그림), 이름, 시킬 때 말, 그림 파일 꼬리]
    ctx.TOOLS = [
      ["🔨", "망치", "망치로 쿵쿵!", "t-hammer"], ["🎈", "풍선", "풍선을 불어요!", "t-balloon"], ["⏰", "시계", "시계가 따르릉!", "t-clock"],
      ["🔫", "물총", "물총을 쏴요!", "t-water"], [null, "미사일", "미사일 발사!", "t-missile"], [null, "프로펠러", "프로펠러 빙글빙글!", "t-prop"],
      ["📷", "카메라", "사진을 찰칵!", "t-camera"], ["🛡️", "방패", "방패로 막아요!", "t-shield"], ["🧲", "자석", "자석으로 붙여요!", "t-magnet"],
    ];
    // 시키기: [단추 그림, 이어 말할 때, 끝에 말할 때]
    ctx.CMDS = { eat: ["🥣", "아침 먹고!", "아침 먹어요!"], brush: ["🪥", "치카하고!", "치카해요!"], dance: ["🎵", "춤추고!", "춤춰요!"], hello: ["👋", "인사하고!", "인사해요!"] };
    /* 배경: ax·ay = 그림을 화면에 맞출 때 기준(0~1, CSS background-position 과 같음), at = 로봇이 서는 자리
       자리: {x: 화면 가로 %} 또는 {ix: 그림 가로 비율} / {g: 그림 세로 비율(발 닿는 땅)} 또는 {iy: 그림 세로 비율(가운데)} 또는 {y: 화면 세로 %(가운데)} */
    ctx.GEO = {
      shop: { ax: 0.5, ay: 0.8, at: { x: 50, g: 0.74 } },
      home: { ax: 0.5, ay: 0.9, at: { x: 50, g: 0.86 } },
      road: { ax: 0.5, ay: 0.9, at: { x: 20, g: 0.84 } },
      sky: { ax: 0.5, ay: 0.5, at: { x: 20, g: 0.98 } },
      space: { ax: 0.5, ay: 0.8, at: { x: 20, g: 0.94 } },
      sea: { ax: 0, ay: 0.15, at: { ix: 0.085, g: 0.5 } },
      fire: { ax: 1, ay: 0.9, at: { x: 18, g: 0.84 } },
      mount: { ax: 1, ay: 0.3, at: { x: 18, g: 0.93 } },
      farm: { ax: 0.5, ay: 0.6, at: { x: 18, g: 0.64 } },
      dawn: { ax: 1, ay: 0.8, at: { x: 18, g: 0.82 } },
    };
    /* 출동할 일: bg 배경, who 가야 할 친구, mode(하송만) 무엇으로 변신, ask 물음, prop 화면에 놓이는 것 [그림, 자리], goal 탈것이 가는 자리, done 끝났을 때 말 */
    ctx.SITS = {
      duck: { bg: "road", who: "p", ask: "아기 오리가 길을 잃었어요! 누가 도와줄까요?", prop: ["🐥", { x: 84, iy: 0.74 }], goal: { x: 70, g: 0.84 }, done: "삐뽀삐뽀! 오리를 집에 데려다줘요!" },
      fire: { bg: "fire", who: "f", ask: "앗, 불이 났어요! 누가 도와줄까요?", prop: ["🔥🔥", { ix: 0.86, iy: 0.2 }], goal: { x: 46, g: 0.84 }, done: "쏴아! 불을 껐어요!" },
      cat: { bg: "mount", who: "c", ask: "고양이가 높은 나무에 올라갔어요! 누가 도와줄까요?", prop: ["🐱", { ix: 0.86, iy: 0.17 }], goal: { ix: 0.8, iy: 0.26 }, done: "두두두! 고양이를 구했어요!" },
      rock: { bg: "road", who: "d", ask: "큰 바위가 길을 막았어요! 누가 도와줄까요?", prop: ["🪨", { x: 70, iy: 0.74 }], goal: { x: 50, g: 0.84 }, done: "영차영차! 바위를 밀었어요!" },
      carrot: { bg: "farm", who: "r", ask: "당근을 뽑아야 해요! 누가 도와줄까요?", prop: ["🥕", { x: 82, iy: 0.56 }], goal: { x: 66, g: 0.64 }, done: "깡충깡충! 당근을 뽑았어요!" },
      wake: { bg: "dawn", who: "l", ask: "모두 늦잠을 자요! 누가 깨워 줄까요?", prop: ["😴", { ix: 0.86, iy: 0.24 }], goal: { x: 42, g: 0.82 }, done: "어흥! 일어날 시간이에요!" },
      star: { bg: "sky", who: "h", mode: "veh", ask: "하늘 높이 별이 떴어요! 누가 가져올까요?", prop: ["⭐", { x: 80, y: 26 }], goal: { x: 80, y: 26 }, done: "슝! 별을 가져왔어요!" },
      moon: { bg: "space", who: "h", mode: "rocket", ask: "달나라에 별이 떴어요! 누가 가져올까요?", prop: ["⭐", { x: 76, y: 26 }], goal: { x: 76, y: 26 }, done: "발사! 우주에서 별을 가져왔어요!" },
      sea: { bg: "sea", who: "h", mode: "boat", ask: "바다 건너에 별이 있어요! 누가 가져올까요?", prop: ["⭐", { x: 82, g: 0.62 }], goal: { x: 80, g: 0.66 }, done: "둥실둥실! 별을 가져왔어요!" },
    };
    const w = (ctx.wrap = U.el("div", "rb-wrap"));
    const sc = (ctx.scene = U.el("div", "rb-scene"));
    ctx.bgs = {};
    Object.keys(ctx.GEO).forEach((k) => {
      const e = (ctx.bgs[k] = U.el("div", "rb-bg"));
      e.dataset.src = IMG("bg-" + k); // 처음 쓸 때 불러옴
      e.style.backgroundPosition = ctx.GEO[k].ax * 100 + "% " + ctx.GEO[k].ay * 100 + "%";
      sc.appendChild(e);
    });
    ctx.goal = U.el("div", "rb-goal");
    ctx.goal.hidden = true;
    ctx.bot = U.el("div", "rb-bot snap", '<div class="rb-sh"></div><div class="rb-bob"><div class="rb-pic"></div></div><div class="rb-fx"></div>');
    ctx.pic = ctx.bot.querySelector(".rb-pic");
    ctx.steps = U.el("div", "rb-step");
    ctx.fix = U.el("button", "rb-fix");
    ctx.fix.setAttribute("aria-label", "친구와 도구 다시 고르기");
    ctx.flash = U.el("div", "rb-flash");
    sc.append(ctx.goal, ctx.bot, ctx.steps, ctx.fix, ctx.flash);
    ctx.bar = U.el("div", "rb-bar");
    w.append(sc, ctx.bar);
    ctx.body.appendChild(w);
    ctx.loaded = {}; // 이름 → 불러오는 중/끝난 약속
    ctx.imgs = {}; // 이름 → Image (붙잡고 있어야 풀어 둔 그림이 유지됨)
    ctx.bad = {};
    ctx.recent = []; // 최근에 화면에 나온 친구 (그림을 붙잡아 둘 친구)
    const d = KP.store.get("robot:me", null);
    const ok = (v) => Number.isInteger(v) && v >= 0 && v < 9;
    ctx.me = d && typeof d === "object" && ctx.CH[d.c] && ok(d.t1) && ok(d.t2) && d.t1 !== d.t2 ? d : null;
    const self = this;
    ctx.fast(ctx.bot, () => !ctx.busy && self.poke(ctx));
    ctx.tap(ctx.fix, () => !ctx.busy && self.build(ctx));
    addEventListener("resize", () => ctx._active && ctx.spot && requestAnimationFrame(() => (self.place(ctx, ctx.spot, true), ctx.goalSpot && self.putGoal(ctx, ctx.goalSpot))));
  },

  /* ---------- 그림 ---------- */
  /** 그림 미리 불러오기 (움직일 때 깜빡이지 않게). 다 불러오면 resolve (실패해도 넘어감) */
  load(ctx, names) {
    return Promise.all(
      names.map(
        (n) =>
          ctx.loaded[n] ||
          (ctx.loaded[n] = new Promise((res) => {
            const im = (ctx.imgs[n] = new Image());
            // 받은 뒤 미리 풀어 둠(decode) — 큰 변신 시트를 처음 화면에 올릴 때 멈칫하지 않게
            im.onload = () => (im.decode ? im.decode().then(res, res) : res());
            im.onerror = () => ((ctx.bad[n] = 1), res()); // 그림이 없는 친구·임무는 빼고 보여 줌
            im.src = ctx.IMG(n);
          }))
      )
    );
  },
  /** 화면에 없는 친구의 그림 내려놓기 — 친구 한 명 그림이 풀면 약 33MB 라 일곱을 다 붙잡으면 저가 기기가 버거움(2026-11-14).
   *  최근 두 친구(keep)만 남기고, 얼굴 단추에 쓰는 -robot 낱장은 늘 남김 */
  drop(ctx, keep) {
    for (const n in ctx.imgs) {
      if (keep.includes(n.split("-")[0]) || /-robot$/.test(n)) continue;
      if (!ctx.imgs[n].complete) continue; // 받는 중인 그림은 건드리지 않음 (다음에 내려놓음)
      delete ctx.imgs[n];
      delete ctx.loaded[n];
    }
  },
  /** 그 친구에게 필요한 그림 이름들 */
  names(ctx, c, all) {
    const a = [c + "-robot", c + "-veh", c + "-tf-veh"];
    if (all) a.push(c + "-eat", c + "-brush", c + "-hello", c + "-dance", ...(ctx.me ? [ctx.me.t1, ctx.me.t2].filter((t) => ctx.TOOLS[t]).map((t) => c + "-" + ctx.TOOLS[t][3]) : []));
    return a;
  },
  face(ctx, c) {
    return '<div class="rb-face" style="background-image:url(&quot;' + ctx.IMG(c + "-robot") + '&quot;)"></div>';
  },
  toolIcon(ctx, i) {
    const em = ctx.TOOLS[i][0];
    if (i === 4) return `<svg viewBox="-36 -36 72 72" aria-hidden="true"><g transform="rotate(45)"><path d="M-11 22v-34a11 16 0 0 1 22 0v34z" fill="#fff"/><path d="M-11 -12a11 18 0 0 1 22 0z" fill="#ff5d5d"/><path d="M-11 22l-10 8v-18zM11 22l10 8v-18z" fill="#ff5d5d"/><rect x="-11" y="2" width="22" height="7" fill="#2f79cf"/></g></svg>`;
    return em ? KP.E(em) : `<svg viewBox="-36 -36 72 72" aria-hidden="true"><ellipse rx="32" ry="8" fill="#f1b70f"/><ellipse rx="8" ry="32" fill="#f1b70f" opacity=".85"/><circle r="8" fill="#2f3a66"/></svg>`;
  },
  /** 낱장 그림으로 바꾸기 (톡) */
  show(ctx, name) {
    const p = ctx.pic;
    if (ctx.cur === name) return;
    ctx.cur = name;
    ctx.bot.classList.toggle("air", /^(h-veh|h-rocket|c-veh)$/.test(name)); // 나는 모습은 발밑 그림자 없음
    p.style.backgroundImage = 'url("' + ctx.IMG(name) + '")';
    p.style.backgroundSize = "contain";
    p.style.backgroundPosition = "center";
    KP.u.replay(p, "pp");
  },
  /** 3×2 시트의 i번째 칸(0~5) 보이기 */
  frame(ctx, sheet, i) {
    const p = ctx.pic;
    ctx.bot.classList.remove("air");
    ctx.cur = sheet + "#" + i;
    p.style.backgroundImage = 'url("' + ctx.IMG(sheet) + '")';
    p.style.backgroundSize = "300% 200%";
    p.style.backgroundPosition = (i % 3) * 50 + "% " + Math.floor(i / 3) * 100 + "%";
  },
  /** 변신: 시트를 차례로(back 이면 거꾸로) 넘기고 끝에 낱장 end 로. 철컥철컥 소리 */
  async morph(ctx, sheet, end, back) {
    const A = KP.audio;
    const tok = ctx.tok;
    await this.load(ctx, [sheet, end]);
    if (!ctx._active || tok !== ctx.tok) return; // 그림을 받는 사이 놀이를 나갔거나 판이 바뀜
    A.tone(back ? 620 : 260, { to: back ? 260 : 660, dur: 0.75, vol: 0.1, type: "triangle" });
    for (let k = 0; k < 6; k++) {
      this.frame(ctx, sheet, back ? 5 - k : k);
      A.sfx(k < 5 ? "snap" : "whoosh");
      await ctx.wait(k === 0 ? 160 : 125);
    }
    this.fx(ctx, "✨", 50, 50, "f-big", 600);
    this.show(ctx, end);
    return ctx.wait(260);
  },
  /** 장면 바꾸기 */
  setScene(ctx, key) {
    ctx.scene.dataset.s = key;
    for (const k in ctx.bgs) {
      const e = ctx.bgs[k];
      if (k === key && e.dataset.src) {
        e.style.backgroundImage = 'url("' + e.dataset.src + '")';
        delete e.dataset.src;
      }
      e.classList.toggle("on", k === key);
    }
    // 지금 장면과 집(자주 돌아옴) 말고는 배경 그림을 내려놓음 — 사라지는 효과(0.45초)가 끝난 뒤에
    ctx.after(700, () => {
      const now = ctx.scene.dataset.s;
      for (const k in ctx.bgs) {
        const e = ctx.bgs[k];
        if (k === now || k === "home" || e.dataset.src) continue;
        e.dataset.src = ctx.IMG("bg-" + k);
        e.style.backgroundImage = "";
      }
    });
  },
  /** 자리 → 화면 px (로봇 가운데). 배경 그림(1280×853, cover)이 화면에 놓인 곳을 계산해 땅 높이를 맞춤 */
  xy(ctx, spot, prop) {
    const sc = ctx.scene,
      W = sc.clientWidth || 1,
      H = sc.clientHeight || 1,
      g = ctx.GEO[sc.dataset.s] || ctx.GEO.home,
      s = Math.max(W / 1280, H / 853),
      iw = 1280 * s,
      ih = 853 * s,
      ox = (W - iw) * g.ax,
      oy = (H - ih) * g.ay,
      bs = prop ? 0 : ctx.bot.offsetWidth || 200,
      m = prop ? 34 : bs * 0.36;
    let x = spot.ix != null ? ox + spot.ix * iw : (spot.x / 100) * W;
    x = Math.max(m, Math.min(W - m, x));
    let y = spot.g != null ? oy + spot.g * ih - bs * 0.44 : spot.iy != null ? oy + spot.iy * ih : (spot.y / 100) * H;
    if (spot.off) return [x, y]; // 화면 밖으로 나가는 자리는 그대로
    y = prop ? Math.max(40, Math.min(H - 40, y)) : Math.max(bs * 0.5 + 4, Math.min(y, H - bs * 0.46)); // 머리·발이 화면 밖으로 나가지 않게
    return [x, y];
  },
  /** 로봇 크기: 화면 짧은 쪽의 52%, 장면 높이의 66% 를 넘지 않게 (가로로 넓은 화면에서 머리가 잘리지 않게) */
  size(ctx) {
    const H = ctx.scene.clientHeight || 400,
      bs = Math.round(Math.max(130, Math.min(400, Math.min(innerWidth, innerHeight) * 0.52, H * 0.66)));
    ctx.bot.style.setProperty("--bs", bs + "px");
  },
  place(ctx, spot, snap) {
    ctx.spot = spot;
    this.size(ctx);
    const [x, y] = this.xy(ctx, spot);
    ctx.bot.classList.toggle("snap", !!snap);
    ctx.bot.style.transform = "translate(" + x + "px," + y + "px)";
    if (snap) void ctx.bot.offsetWidth;
  },
  putGoal(ctx, spot) {
    ctx.goalSpot = spot;
    const [x, y] = this.xy(ctx, spot, true);
    ctx.goal.style.transform = "translate(" + x + "px," + y + "px)";
  },
  poke(ctx) {
    // 로봇을 콕 누르면 삐리삐리 폴짝
    const A = KP.audio;
    KP.u.replay(ctx.bot, "hop");
    [0, 90, 180].forEach((t, i) => ctx.after(t, () => A.note(["E5", "G5", "C6"][i], { inst: "bell", dur: 0.18, vol: 0.22 })));
  },
  /** 효과 그림 하나: 로봇 상자 안 (x%, y%) 에 cls 애니메이션으로 ms 동안 */
  fx(ctx, em, x, y, cls, ms, vars) {
    const box = ctx.bot.querySelector(".rb-fx");
    const e = KP.u.el("div", "rb-f " + cls, KP.E(em));
    e.style.left = x + "%";
    e.style.top = y + "%";
    e.style.setProperty("--t", ms / 1000 + "s");
    if (vars) for (const k in vars) e.style.setProperty(k, vars[k]);
    box.appendChild(e);
    ctx.after(ms + 60, () => e.remove());
  },
  /** 로봇에게 시키기: 동작을 보여 주고 끝나면 resolve. cmd = eat|brush|dance|hello|go|T1|T2 */
  async act(ctx, cmd, stay) {
    const A = KP.audio,
      U = KP.u,
      bot = ctx.bot,
      self = this,
      c = ctx.who;
    const cls = (k, ms) => {
      bot.classList.add(k);
      ctx.after(ms, () => bot.classList.remove(k));
    };
    const back = () => self.show(ctx, c + "-robot");
    if (cmd === "eat") {
      self.show(ctx, c + "-eat");
      cls("chomp", 1300);
      [150, 470, 790, 1110].forEach((t) => ctx.after(t, () => A.sfx("pop")));
      await ctx.wait(1500);
      return back();
    }
    if (cmd === "brush") {
      self.show(ctx, c + "-brush");
      cls("chomp", 1300);
      [100, 400, 700, 1000].forEach((t) => ctx.after(t, () => A.sfx("rub")));
      ctx.after(1200, () => (self.fx(ctx, "✨", 50, 34, "f-pop", 500), A.sfx("sparkle")));
      await ctx.wait(1750);
      return back();
    }
    if (cmd === "dance") {
      // 춤 시트 6칸을 두 바퀴
      const tok = ctx.tok;
      await self.load(ctx, [c + "-dance"]);
      if (!ctx._active || tok !== ctx.tok) return;
      A.melody([["C5", 1], ["E5", 1], ["G5", 1], ["E5", 1], ["A5", 1], ["G5", 1], ["E5", 1], ["C5", 1], ["E5", 1], ["G5", 1], ["C6", 2]], { beat: 0.2, inst: "marimba", vol: 0.3 });
      for (let k = 0; k < 12; k++) {
        self.frame(ctx, c + "-dance", k % 6);
        U.replay(ctx.pic, "pp");
        if (k % 3 === 0) self.fx(ctx, k % 2 ? "🎶" : "🎵", k % 2 ? 90 : 10, 16, "f-rise", 900);
        await ctx.wait(200);
      }
      return back();
    }
    if (cmd === "hello") {
      self.show(ctx, c + "-hello");
      cls("wob", 1500);
      KP.voice.say("안녕!");
      [0, 160].forEach((t, i) => ctx.after(t, () => A.note(["G5", "C6"][i], { inst: "bell", dur: 0.2, vol: 0.2 })));
      await ctx.wait(1650);
      return back();
    }
    if (cmd === "go") {
      // 탈것으로 변신 → 화면 밖으로 출발 (stay 가 아니면 돌아와 로봇으로)
      const home = ctx.spot,
        fly = ctx.CH[c].fly;
      await self.morph(ctx, c + "-tf-veh", c + "-veh");
      bot.classList.add("going");
      A.tone(200, { to: fly ? 900 : 500, dur: 0.9, vol: 0.14, type: "triangle" });
      A.sfx("whoosh");
      self.place(ctx, fly ? { x: 120, y: -50, off: 1 } : { x: 150, g: ctx.GEO[ctx.scene.dataset.s].at.g, off: 1 });
      await ctx.wait(1600);
      if (stay) return;
      bot.classList.remove("going");
      self.place(ctx, home, true);
      U.replay(bot, "in");
      await ctx.wait(450);
      return self.morph(ctx, c + "-tf-veh", c + "-robot", true);
    }
    // 도구 (T1/T2)
    const t = cmd === "T1" ? ctx.me.t1 : ctx.me.t2,
      bs = bot.offsetWidth;
    self.show(ctx, c + "-" + ctx.TOOLS[t][3]);
    if (t === 0) {
      // 망치: 쿵쿵
      cls("chomp", 1000);
      [300, 640, 980].forEach((ms) => ctx.after(ms, () => (A.kick(), U.replay(ctx.scene, "shake"), self.fx(ctx, "💥", 78, 20, "f-pop", 320))));
    } else if (t === 1) {
      // 풍선: 두둥실
      cls("hover", 1500);
      A.tone(300, { to: 700, dur: 0.6, vol: 0.1, type: "sine" });
      ctx.after(650, () => A.sfx("boing"));
    } else if (t === 2) {
      // 시계: 똑딱똑딱 따르릉
      [0, 200, 400, 600].forEach((ms) => ctx.after(ms, () => A.sfx("tick")));
      ctx.after(780, () => cls("wob", 600));
      [800, 950, 1100].forEach((ms) => ctx.after(ms, () => A.note("E6", { inst: "bell", dur: 0.15, vol: 0.2 })));
    } else if (t === 3) {
      // 물총: 물방울 쭉쭉
      A.sfx("water");
      [0, 200, 400, 600].forEach((ms, i) => ctx.after(ms, () => self.fx(ctx, "💦", 92, 52, "f-fly", 700, { "--dx": bs * (0.35 + i * 0.1) + "px", "--dy": -bs * (0.02 + (i % 2) * 0.08) + "px" })));
      ctx.after(450, () => A.sfx("water"));
    } else if (t === 4) {
      // 미사일: 슝 날아가서 하늘에 불꽃놀이 (무서운 소리 없이 반짝)
      A.sfx("whoosh");
      ctx.after(760, () => {
        A.sfx("sparkle");
        A.note("C6", { inst: "bell", dur: 0.5, vol: 0.2 });
        self.fx(ctx, "🎆", 100, -24, "f-big", 900);
      });
    } else if (t === 5) {
      // 프로펠러: 둥실 떠오름
      cls("hover", 1500);
      A.sfx("whoosh");
      A.tone(180, { to: 420, dur: 1.2, vol: 0.08, type: "triangle" });
    } else if (t === 6) {
      // 카메라: 찰칵 번쩍
      ctx.after(420, () => {
        A.sfx("snap");
        U.replay(ctx.flash, "on");
      });
    } else if (t === 7) {
      // 방패: 짠!
      cls("hop", 500);
      A.sfx("sparkle");
      [0, 140, 280].forEach((ms, i) => ctx.after(ms, () => A.note(["C5", "G5", "C6"][i], { inst: "bell", dur: 0.25, vol: 0.2 })));
    } else {
      // 자석: 별이 착착 붙음
      [[-1.1, -0.5], [0.7, -0.9], [-0.4, -1.1]].forEach(([dx, dy], i) =>
        ctx.after(150 + i * 260, () => {
          self.fx(ctx, "⭐", 74, 22, "f-in", 600, { "--dx": dx * bs + "px", "--dy": dy * bs + "px" });
          ctx.after(560, () => A.sfx("pick"));
        })
      );
    }
    await ctx.wait(1600);
    return back();
  },
  /** 화면의 로봇을 그 친구로 */
  setWho(ctx, c) {
    ctx.who = c;
    ctx.recent = [c].concat(ctx.recent.filter((x) => x !== c)).slice(0, 2);
    this.drop(ctx, ctx.recent.concat(ctx.me ? [ctx.me.c] : []));
    ctx.cur = "";
    ctx.bot.hidden = false;
    ctx.bot.classList.remove("going");
    this.show(ctx, c + "-robot");
  },

  start(ctx) {
    ctx.round = 0;
    ctx.busy = false;
    ctx.last = null;
    ctx.lastSeq = "";
    const tok = (ctx.tok = (ctx.tok || 0) + 1);
    this.load(ctx, Object.keys(ctx.CH).map((c) => c + "-robot")).then(() => {
      if (tok !== ctx.tok) return;
      ctx.pals = Object.keys(ctx.CH).filter((c) => !ctx.bad[c + "-robot"]);
      if (ctx.me && ctx.pals.includes(ctx.me.c)) {
        this.setWho(ctx, ctx.me.c);
        this.next(ctx);
      } else this.build(ctx);
    });
  },

  /* ---------- ① 친구 고르기 → 도구 둘 고르기 ---------- */
  build(ctx) {
    const U = KP.u,
      self = this;
    const tok = (ctx.tok = (ctx.tok || 0) + 1);
    ctx.busy = false;
    ctx.hint(null);
    self.setScene(ctx, "shop");
    ctx.goal.hidden = true;
    ctx.goalSpot = null;
    ctx.fix.hidden = true;
    ctx.steps.innerHTML = "";
    self.setWho(ctx, (ctx.me && ctx.me.c) || "h");
    // 1) 누구랑 놀까요?
    ctx.say("누구랑 놀까요?");
    ctx.bar.innerHTML = "";
    ctx.bar.removeAttribute("data-big");
    ctx.bar.setAttribute("data-many", "");
    const fb = ctx.pals.map((c, i) => {
      const b = U.el("button", "item rb-t k-pick", self.face(ctx, c));
      b.style.setProperty("--i", i);
      b.setAttribute("aria-label", ctx.CH[c].name);
      ctx.tap(b, async () => {
        if (tok !== ctx.tok || ctx.busy) return;
        ctx.busy = true;
        ctx.hint(null);
        fb.forEach((x) => x.classList.toggle("sel", x === b));
        KP.audio.sfx("select");
        self.setWho(ctx, c);
        U.replay(ctx.bot, "in");
        ctx.me = { c, t1: -1, t2: -1 };
        ctx.say(ctx.CH[c].veh + " 로봇! " + ctx.CH[c].name + "!");
        self.load(ctx, self.names(ctx, c, true).concat(ctx.TOOLS.map((t) => c + "-" + t[3])));
        await ctx.wait(1300);
        if (tok !== ctx.tok) return;
        ctx.busy = false;
        tools();
      });
      ctx.bar.appendChild(b);
      return b;
    });
    self.place(ctx, ctx.GEO.shop.at, true); // 단추 줄이 놓인 뒤의 화면 크기로 자리 잡기
    ctx.hint(() => fb[0], "누구랑 놀까요?");
    // 2) 도구 둘
    const tools = () => {
      const picked = [];
      ctx.say("도구를 골라요!");
      ctx.bar.innerHTML = "";
      ctx.bar.setAttribute("data-many", "");
      const btns = ctx.TOOLS.map((t, i) => {
        const b = U.el("button", "item rb-t k-tool", self.toolIcon(ctx, i));
        b.style.setProperty("--i", i);
        b.setAttribute("aria-label", t[1]);
        ctx.tap(b, async () => {
          if (tok !== ctx.tok || ctx.busy || picked.includes(i)) return;
          ctx.busy = true;
          ctx.hint(null);
          picked.push(i);
          b.classList.add("sel");
          KP.audio.sfx("snap");
          ctx.me.t1 = picked[0];
          ctx.me.t2 = picked[1] != null ? picked[1] : picked[0];
          ctx.say(t[1] + "!");
          await self.act(ctx, picked.length === 1 ? "T1" : "T2"); // 고른 도구를 바로 써 봄
          if (tok !== ctx.tok) return;
          ctx.busy = false;
          if (picked.length < 2) {
            ctx.say("하나 더 골라요!");
            ctx.hint(() => btns.find((x, k) => !picked.includes(k)), "하나 더 골라요!");
          } else done();
        });
        ctx.bar.appendChild(b);
        return b;
      });
      self.place(ctx, ctx.GEO.shop.at, true);
      ctx.hint(() => btns[0], "도구를 골라요!");
    };
    const done = async () => {
      KP.store.set("robot:me", ctx.me);
      ctx.bar.innerHTML = "";
      ctx.bar.removeAttribute("data-many");
      self.place(ctx, ctx.GEO.shop.at, true);
      // 변신 쇼 (틀릴 수 없는 판 → 단계·열쇠 별 없음)
      ctx.busy = true;
      const c = ctx.me.c;
      ctx.say("짜잔! " + U.josa(ctx.CH[c].veh, "으로/로") + " 변신!");
      await self.morph(ctx, c + "-tf-veh", c + "-veh");
      await ctx.wait(700);
      if (tok !== ctx.tok) return;
      await self.morph(ctx, c + "-tf-veh", c + "-robot", true);
      if (tok !== ctx.tok) return;
      const ok = await ctx.win({ noLevel: true, msg: "멋진 변신 로봇 친구!" });
      ctx.busy = false;
      if (ok && tok === ctx.tok) self.next(ctx);
    };
  },

  /* ---------- 판 고르기: 시키기 두 판 → 출동 한 판 ---------- */
  next(ctx) {
    ctx.steps.innerHTML = "";
    ctx.bar.removeAttribute("data-big");
    ctx.fix.hidden = false;
    ctx.fix.innerHTML = this.face(ctx, ctx.me.c) + "<i>" + KP.E("🔧") + "</i>";
    ctx.goal.hidden = true;
    ctx.goalSpot = null;
    if (ctx.round % 3 === 2) this.trip(ctx);
    else this.order(ctx);
  },

  /* ---------- ② 시키기 ---------- */
  order(ctx) {
    const U = KP.u,
      self = this,
      lv = ctx.level,
      d = ctx.me,
      ch = ctx.CH[d.c];
    const tok = (ctx.tok = (ctx.tok || 0) + 1);
    ctx.busy = false;
    self.setScene(ctx, "home");
    self.setWho(ctx, d.c);
    self.load(ctx, self.names(ctx, d.c, true));
    // 단추: 아침·치카·춤·인사 + 도구 둘 + 출발
    const keys = ["eat", "brush", "dance", "hello", "T1", "T2", "go"];
    const ti = (k) => (k === "T1" ? d.t1 : d.t2);
    const isT = (k) => k === "T1" || k === "T2";
    const icon = (k) => (isT(k) ? self.toolIcon(ctx, ti(k)) : KP.E(k === "go" ? ch.em : ctx.CMDS[k][0]));
    const word = (k, last) => (isT(k) ? ctx.TOOLS[ti(k)][2] : k === "go" ? ch.go : ctx.CMDS[k][last ? 2 : 1]);
    const label = (k) => (isT(k) ? ctx.TOOLS[ti(k)][1] : { eat: "아침", brush: "치카", dance: "춤", hello: "인사", go: "출발" }[k]);
    // 시킬 것: 단계 수만큼, '출발'은 맨 끝에만. 3단계 첫 판(과 가끔)은 하성이 주문 '아침 먹고 치카하고 슝'
    let seq;
    const n = Math.min(lv, 3);
    for (let guard = 0; guard < 20; guard++) {
      if (lv >= 3 && (!ctx.did3 || U.rand(4) === 0)) seq = ["eat", "brush", "go"];
      else {
        seq = U.shuffle(keys.filter((k) => k !== "go")).slice(0, n);
        if (U.rand(3) === 0) seq[n - 1] = "go";
      }
      if (seq.join() !== ctx.lastSeq) break;
    }
    if (lv >= 3) ctx.did3 = true;
    ctx.lastSeq = seq.join();
    const q = "로봇아! " + seq.map((k, i) => word(k, i === seq.length - 1)).join(" ");
    ctx.say(q);
    // 2·3단계는 차례 그림을 위에 보여 줌 (세 가지를 귀로만 기억하기는 어려움)
    let idx = 0,
      wrong = 0;
    const chips = seq.length > 1 ? seq.map((k) => { const b = U.el("b", "", icon(k)); ctx.steps.appendChild(b); return b; }) : [];
    const mark = () => chips.forEach((c, i) => (c.classList.toggle("on", i < idx), c.classList.toggle("now", i === idx)));
    mark();
    ctx.bar.innerHTML = "";
    ctx.bar.setAttribute("data-many", "");
    const btns = {};
    keys.forEach((k, i) => {
      const b = (btns[k] = U.el("button", "item rb-t k-" + (isT(k) ? "tool" : k), icon(k)));
      b.style.setProperty("--i", i);
      b.setAttribute("aria-label", label(k));
      ctx.tap(b, async () => {
        if (ctx.busy || tok !== ctx.tok) return;
        KP.audio.unlock();
        ctx.busy = true;
        ctx.hint(null);
        const hit = k === seq[idx],
          fin = hit && idx === seq.length - 1;
        KP.audio.sfx(hit ? "good" : "tap");
        if (hit) {
          U.replay(b, "jump");
          idx++;
          mark();
        } else wrong++;
        await self.act(ctx, k, fin && k === "go"); // 딴 것을 눌러도 로봇은 시킨 대로 함
        if (tok !== ctx.tok) return;
        if (fin) {
          if (wrong >= 2) ctx.noStar(); // 이것저것 눌러 보다 맞힌 판은 열쇠 별만 없음
          ctx.score.add();
          ctx.round++;
          const big = ctx.round % 4 === 0;
          const ok = await ctx.win({ big, msg: big ? "{부름} 로봇 박사!" : "말 잘 듣는 로봇!" });
          if (ok && tok === ctx.tok) self.next(ctx);
          return;
        }
        ctx.busy = false;
        if (!hit) ctx.say(q);
        setHint();
      });
      ctx.bar.appendChild(b);
    });
    self.place(ctx, ctx.GEO.home.at, true); // 단추 줄이 놓인 뒤의 화면 크기로 자리 잡기
    // 처음엔 곰돌이 말만 다시, 딴 것을 누른 뒤에는 눌러야 할 단추를 가리킴(그 판은 별 없음)
    const setHint = () => ctx.hint(() => (wrong ? btns[seq[idx]] : ctx.bot), q, { answer: true });
    setHint();
  },

  /* ---------- ③ 출동 ---------- */
  trip(ctx) {
    const U = KP.u,
      A = KP.audio,
      self = this,
      lv = ctx.level;
    const tok = (ctx.tok = (ctx.tok || 0) + 1);
    const all = ["duck", "fire", "cat", "star", "rock", "carrot", "wake"].concat(lv >= 3 ? ["moon", "sea"] : []).filter((k) => ctx.pals.includes(ctx.SITS[k].who));
    if (!all.length) return this.order(ctx); // 보낼 친구 그림이 하나도 없으면 시키기 판으로
    const pool = all.length > 1 ? all.filter((k) => k !== ctx.last) : all;
    const key = (ctx.last = U.pick(pool)),
      st = ctx.SITS[key],
      ch = ctx.CH[st.who];
    let missed = false;
    ctx.busy = false;
    self.setScene(ctx, st.bg);
    ctx.bot.hidden = true; // 누가 갈지 고르면 나타남
    self.load(ctx, self.names(ctx, st.who));
    ctx.goal.innerHTML = KP.E(st.prop[0]);
    ctx.goal.hidden = false;
    ctx.goal.classList.remove("got");
    const q = lv === 1 ? ch.veh + " 친구! 출동!" : st.ask;
    ctx.say(q);
    const bar = (list, cls, render, label, onPick) => {
      ctx.bar.innerHTML = "";
      ctx.bar.removeAttribute("data-many");
      ctx.bar.toggleAttribute("data-big", cls === "k-pick");
      const btns = list.map((v, i) => {
        const b = U.el("button", "item rb-t " + cls, render(v));
        b.style.setProperty("--i", i);
        b.setAttribute("aria-label", label(v));
        ctx.tap(b, () => {
          if (ctx.busy || tok !== ctx.tok) return;
          KP.audio.unlock();
          ctx.busy = true;
          onPick(v, b);
        });
        ctx.bar.appendChild(b);
        return b;
      });
      self.putGoal(ctx, st.prop[1]); // 단추 줄이 놓인 뒤의 화면 크기로
      return btns;
    };
    // 1) 누가 갈까? — 1단계 3명, 2·3단계 4명
    const who = U.shuffle([st.who, ...U.shuffle(ctx.pals.filter((c) => c !== st.who)).slice(0, lv === 1 ? 2 : 3)]);
    const fb = bar(who, "k-pick", (c) => self.face(ctx, c), (c) => ctx.CH[c].name, async (c, b) => {
      self.setWho(ctx, c);
      self.place(ctx, ctx.GEO[st.bg].at, true);
      U.replay(ctx.bot, "in");
      A.sfx("select");
      await ctx.wait(500);
      if (tok !== ctx.tok) return;
      if (c !== st.who) {
        // 다른 친구: 도리도리 하고 돌아감 (벌 없음)
        missed = true;
        U.replay(ctx.bot, "no");
        ctx.miss(b, lv === 1 ? "다시 들어 봐요! " + q : ctx.CH[c].name + "! 지금은 못 도와줘요! 다른 친구를 골라 봐요!");
        await ctx.wait(1000);
        if (tok !== ctx.tok) return;
        ctx.bot.hidden = true;
        ctx.busy = false;
        return;
      }
      b.classList.add("right");
      ctx.hint(null);
      if (st.who === "h" && lv >= 3) return pickMode();
      go(st.mode || "veh");
    });
    ctx.hint(() => (missed ? fb[who.indexOf(st.who)] : ctx.goal), q, { answer: true });
    // 2) (3단계, 하송) 무엇으로 변신할까?
    const pickMode = () => {
      ctx.busy = false;
      let miss2 = false;
      const q2 = "무엇으로 변신할까요?";
      ctx.say(q2);
      const modes = U.shuffle(Object.keys(ctx.HMODE));
      const mb = bar(modes, "k-go", (m) => KP.E(ctx.HMODE[m][0]), (m) => ctx.HMODE[m][1], async (m, b) => {
        if (m !== st.mode) {
          miss2 = true;
          await self.morph(ctx, ctx.HMODE[m][3], ctx.HMODE[m][2]);
          if (tok !== ctx.tok) return;
          U.replay(ctx.bot, "no");
          ctx.miss(b, ctx.HMODE[m][1] + "! 여기서는 못 가요! 다시 골라 봐요!");
          await ctx.wait(800);
          if (tok !== ctx.tok) return;
          await self.morph(ctx, ctx.HMODE[m][3], "h-robot", true);
          ctx.busy = false;
          return;
        }
        b.classList.add("right");
        ctx.hint(null);
        go(m);
      });
      ctx.hint(() => (miss2 ? mb[modes.indexOf(st.mode)] : ctx.bot), q2, { answer: true });
    };
    // 3) 변신해서 출동 → 일 해결
    const go = async (mode) => {
      const c = st.who,
        sheet = c === "h" ? ctx.HMODE[mode][3] : c + "-tf-veh",
        veh = c === "h" ? ctx.HMODE[mode][2] : c + "-veh";
      await self.morph(ctx, sheet, veh);
      if (tok !== ctx.tok) return;
      ctx.say(st.done);
      ctx.bot.classList.add("going");
      if (c === "p" || c === "f") [0, 300, 600, 900].forEach((t, i) => ctx.after(t, () => A.note(i % 2 ? "A5" : "E5", { inst: "bell", dur: 0.22, vol: 0.18 }))); // 삐뽀삐뽀
      else if (ctx.CH[c].fly) A.tone(220, { to: 700, dur: 1.2, vol: 0.1, type: "triangle" });
      else [0, 280, 560, 840, 1120].forEach((t) => ctx.after(t, () => A.sfx(c === "d" ? "drop" : "boing"))); // 쿵쿵 · 깡충
      self.place(ctx, st.goal);
      await ctx.wait(1750);
      if (tok !== ctx.tok) return;
      ctx.bot.classList.remove("going");
      if (key === "fire") {
        // 물을 쏴아 → 불이 작아지다 꺼짐
        const bs = ctx.bot.offsetWidth;
        [0, 220, 440, 660, 880].forEach((t, i) => ctx.after(t, () => (A.sfx("water"), self.fx(ctx, "💦", 96, 30, "f-fly", 650, { "--dx": bs * (0.5 + (i % 2) * 0.12) + "px", "--dy": -bs * (0.3 + (i % 3) * 0.08) + "px" }))));
        await ctx.wait(1150);
        if (tok !== ctx.tok) return;
      }
      if (key === "rock") {
        // 영차! 바위가 옆으로 굴러감
        A.kick();
        U.replay(ctx.scene, "shake");
        const [gx, gy] = self.xy(ctx, st.prop[1], true);
        ctx.goal.style.transform = "translate(" + (gx + ctx.scene.clientWidth) + "px," + gy + "px) rotate(360deg)";
        await ctx.wait(650);
        if (tok !== ctx.tok) return;
      } else if (key === "wake") {
        // 어흥! → 잠자던 얼굴이 활짝
        A.tone(170, { to: 110, dur: 0.6, vol: 0.16, type: "triangle" });
        U.replay(ctx.scene, "shake");
        self.fx(ctx, "💥", 100, 20, "f-pop", 500);
        await ctx.wait(650);
        if (tok !== ctx.tok) return;
        ctx.goal.innerHTML = KP.E("😃");
        self.fx(ctx, "🌞", 50, -10, "f-pop", 900);
        await ctx.wait(700);
        if (tok !== ctx.tok) return;
      }
      ctx.goal.classList.add("got");
      A.sfx("sparkle");
      self.fx(ctx, key === "fire" || key === "rock" ? "✨" : "💖", 50, 10, "f-rise", 900);
      ctx.score.add();
      await ctx.wait(600);
      if (tok !== ctx.tok) return;
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 출동 대장!" : "출동 성공!" });
      if (ok && tok === ctx.tok) self.next(ctx);
    };
  },
  stop(ctx) {
    ctx.tok = (ctx.tok || 0) + 1;
    ctx.busy = false;
  },
});
