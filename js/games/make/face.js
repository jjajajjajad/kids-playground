/* 얼굴 꾸미기 — 점토 화장대 거울 앞에서 얼굴색·머리·눈·눈썹·코·입·모자·안경을 골라 꾸미기
   - 무대: 점토 화장대 그림(assets/play-clay/face/bg.jpg)을 잘라 둥근 거울이 크게 보이게, 얼굴은 거울 속에 비침
   - 모든 부위를 SVG 로 직접 그림 + 점토 느낌(부드러운 음영 그라디언트·하이라이트·약한 결·바닥 그림자) — 필터 없이(저가 기기)
     보기 단추에는 '그 부위를 바꾼 얼굴'이 같은 점토 모양으로 미리 보임
   - 부위마다 다른 반응: 코 에취(돼지 코는 꿀꿀) · 볼 빨개지며 수줍 · 눈·눈썹·안경 윙크 · 입 노래/깔깔 · 머리·모자 들썩 · 귀 쫑긋 · 옷 간지럼
   - 🎲 랜덤(새 얼굴), 📸 사진 찍기 → 내 작품(kind "face", 부위 설정 cfg 도 함께) + 친구 앨범에 폴라로이드로 걸림
   - 친구 앨범: 꾸민 얼굴 여러 명(부위 설정째 저장 → 다시 꺼내 고치기), 가족 칸(아빠·엄마·나·아기·할머니·할아버지 — 그림 표시), 가족 사진
   저장(KP.store — 백업·복원 okKey 규칙 "face:..." 에 맞음):
     face:cfg      지금 꾸미는 얼굴 {skin,hair,hairC,eyes,brows,nose,mouth,hat,glasses,shirt}
     face:cur      지금 고치는 앨범 친구 id (없으면 null = 새 얼굴) · face:who 새 얼굴을 찍으면 걸 가족 칸(선택)
     face:friends  [{id, who, t, cfg}] 최대 MAXF 명 (꽉 차면 가족 칸이 아닌 가장 오래된 친구부터 내려감)
     사진(JPEG)은 KP.db "art" {id, kind:"face", img, t, date, cfg, fid, who} — 예전 사진(cfg 없음)도 그대로 보임 */
"use strict";
KP.game({
  id: "face",
  icon: "🤡",
  name: "얼굴 꾸미기",
  cat: "make",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    const BG = "assets/play-clay/face/bg.jpg";
    // 배경 그림(1344×752)의 거울: 가운데·안쪽 반지름·전구까지 바깥 반지름 (그림 픽셀)
    const IW = 1344, IH = 752, MX = 673, MY0 = 269, MR = 205, MRO = 236;
    KP.css("face", `
      .fc{flex:1;min-height:0;position:relative;display:grid;gap:12px;padding:0 14px 12px;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr);grid-template-areas:"face panel"}
      .fc-stage{grid-area:face;min-height:0;position:relative;border-radius:28px;overflow:hidden;box-shadow:var(--shadow);
        background:#f1c8c0 url("${BG}") no-repeat;background-size:cover;background-position:50% 30%}
      .fc-mirror{position:absolute;left:0;top:0;border-radius:50%;overflow:hidden;touch-action:none;
        background:radial-gradient(circle at 44% 34%,#fffdf8 0,#fbefe6 46%,#f1d9cc 100%);box-shadow:inset 0 0 0 3px rgba(190,120,110,.35)}
      .fc-mirror svg{position:absolute;inset:0;width:100%;height:100%;display:block}
      .fc-glass{position:absolute;inset:0;border-radius:50%;pointer-events:none;
        background:linear-gradient(128deg,rgba(255,255,255,0) 22%,rgba(255,255,255,.26) 28%,rgba(255,255,255,0) 35%,rgba(255,255,255,0) 70%,rgba(255,255,255,.14) 74%,rgba(255,255,255,0) 78%);
        box-shadow:inset 0 0 18px 4px rgba(150,80,70,.22)}
      .fc-mirror .bounce{animation:fcBounce .7s cubic-bezier(.3,1.6,.5,1)}
      @keyframes fcBounce{30%{transform:translateY(-5%) scale(1.04)}60%{transform:scale(.97,1.03)}}
      .fc-mirror g{transform-box:fill-box;transform-origin:center}
      .fc-mirror g.eyes{transition:transform .08s}
      .fc-mirror g.eyes.blink{transform:scaleY(.12)}
      .fc-mirror g.hat,.fc-mirror g.hairF{transform-origin:50% 100%}
      .fc-mirror g.hop{animation:fcHop .65s cubic-bezier(.3,1.5,.5,1)}
      @keyframes fcHop{35%{transform:translateY(-16%) rotate(-7deg)}62%{transform:translateY(2%) rotate(3deg) scale(1.04,.96)}}
      .fc-mirror g.squish{animation:fcSquish .6s ease-out}
      @keyframes fcSquish{30%{transform:scale(1.06,.9)}60%{transform:scale(.97,1.05)}}
      .fc-mirror g.ear{transform-origin:50% 60%}
      .fc-mirror g.perk{animation:fcPerk .8s ease-out}
      @keyframes fcPerk{25%{transform:scale(1.35) rotate(var(--r,8deg))}50%{transform:scale(1.15) rotate(calc(var(--r,8deg) * -1))}75%{transform:scale(1.25)}}
      .fc-mirror g.all{transform-origin:50% 60%}
      .fc-mirror g.all.sneeze{animation:fcSneeze .55s cubic-bezier(.2,1.4,.4,1)}
      @keyframes fcSneeze{0%{transform:scale(.97) translateY(1%)}30%{transform:scale(1.07) translateY(-3%)}60%{transform:scale(.99)}}
      .fc-mirror g.all.shy{animation:fcShy 1.3s ease-in-out}
      @keyframes fcShy{20%{transform:rotate(-5deg) translateY(1%)}45%{transform:rotate(4deg)}70%{transform:rotate(-3deg)}}
      .fc-mirror g.all.tickle{animation:fcTickle .7s linear}
      @keyframes fcTickle{15%,45%,75%{transform:rotate(-3deg)}30%,60%,90%{transform:rotate(3deg)}}
      .fc-mirror g.all.sing{animation:fcSing .3s ease-in-out}
      @keyframes fcSing{50%{transform:translateY(-1.5%) rotate(2deg)}}
      .fc-mirror g.cheeks{transition:opacity .25s}
      .fc-mirror g.cheeks.hot{opacity:1!important}
      .fc-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:6}
      .fc-flash.on{animation:fcFlash .5s ease-out}
      @keyframes fcFlash{from{opacity:1}to{opacity:0}}
      .fc-badge{position:absolute;left:10px;top:10px;z-index:5;width:clamp(52px,9vmin,72px);height:clamp(52px,9vmin,72px);border-radius:50%;background:rgba(255,250,244,.92);box-shadow:0 4px 0 rgba(120,70,60,.18);display:none;align-items:center;justify-content:center;font-size:clamp(30px,5.4vmin,44px)}
      .fc-badge.on{display:flex;animation:popIn .35s backwards}
      .fc-note{font-size:clamp(26px,4.4vmin,40px)}
      .fc-panel{grid-area:panel;min-height:0;display:flex;flex-direction:column;gap:10px}
      .fc-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;flex:0 0 auto}
      .fc-tab{height:clamp(54px,8vh,68px);border-radius:18px;background:rgba(255,255,255,.75);font-size:clamp(28px,4.4vh,38px);display:flex;align-items:center;justify-content:center;border-bottom:5px solid transparent;transition:transform .12s}
      .fc-tab.sel{background:#fff;border-bottom-color:var(--cat);box-shadow:var(--shadow);transform:translateY(-2px)}
      .fc-opts{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:8px;background:rgba(255,236,228,.6);border-radius:22px;padding:8px}
      .fc-opt{background:radial-gradient(circle at 45% 35%,#fffdf9,#f7e9e1);border-radius:16px;box-shadow:0 4px 0 rgba(140,80,70,.14);display:flex;align-items:center;justify-content:center;padding:2px;min-height:0;overflow:hidden;animation:itemIn .3s backwards;animation-delay:calc(var(--i) * 25ms)}
      .fc-opt svg{width:100%;height:100%;max-height:100%}
      .fc-opt.sel{box-shadow:0 0 0 4px var(--sun),0 4px 0 #d9a000;background:#fff8dc}
      .fc-opt:active{transform:scale(.95)}
      .fc-colors{display:flex;gap:8px;justify-content:center;flex:0 0 auto}
      .fc-col{width:clamp(36px,5.4vh,46px);height:clamp(36px,5.4vh,46px);border-radius:50%;border:4px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.14);background-image:radial-gradient(circle at 35% 30%,rgba(255,255,255,.55),rgba(255,255,255,0) 45%,rgba(0,0,0,.18))!important}
      .fc-col.sel{transform:scale(1.15);box-shadow:0 0 0 3px var(--ink)}
      .fc-acts{display:flex;gap:10px;justify-content:center;flex:0 0 auto}
      .fc-act{font-size:clamp(20px,2.6vw,26px);padding:10px 18px;min-height:62px;white-space:nowrap}
      .fc-act .e{font-size:1.5em}
      /* 사진 줄 (폴라로이드) */
      .fc-line{position:relative;flex:0 0 auto;height:clamp(84px,12vh,112px);display:none}
      .fc-line .rope{position:absolute;left:0;top:0;width:100%;height:40px;pointer-events:none}
      .fc-pols{position:absolute;inset:0;display:flex;gap:10px;padding:0 10px;align-items:flex-start}
      .fc-pol{box-sizing:border-box;position:relative;flex:0 0 auto;height:calc(100% - 6px);aspect-ratio:.84;margin-top:6px;background:#fffdf7;border-radius:6px;padding:6px 6px 18px;box-shadow:0 4px 6px rgba(110,60,50,.22);transform:rotate(var(--rot,0deg));transform-origin:50% 0}
      .fc-pol .ph{width:100%;height:100%;border-radius:3px;background:linear-gradient(#cfe6d5,#b6d4c0);overflow:hidden;position:relative}
      .fc-pol .ph svg{width:100%;height:100%;display:block}
      .fc-pol .pin{position:absolute;left:50%;top:-7px;width:12px;height:20px;margin-left:-6px;border-radius:3px;background:linear-gradient(90deg,#f39ab3,#e57d99);box-shadow:0 1px 0 rgba(0,0,0,.15)}
      .fc-pol .who{position:absolute;right:-6px;bottom:-6px;font-size:26px;line-height:1}
      .fc-pol.new{animation:fcSwing 1.2s ease-out}
      @keyframes fcSwing{0%{transform:rotate(-16deg)}30%{transform:rotate(10deg)}55%{transform:rotate(-6deg)}80%{transform:rotate(3deg)}}
      .fc-pol.empty{background:rgba(255,253,247,.5);box-shadow:none;border:3px dashed rgba(200,140,130,.5)}
      .fc-pol.empty .ph{background:none;display:flex;align-items:center;justify-content:center;font-size:34px;opacity:.5}
      .fc-fly{position:fixed;z-index:90;pointer-events:none;background:#fffdf7;border-radius:8px;padding:12px 12px 40px;box-shadow:0 10px 20px rgba(80,40,30,.3);transition:transform .85s cubic-bezier(.45,-0.2,.5,1),opacity .85s;transform-origin:50% 50%}
      .fc-fly img{width:100%;height:100%;object-fit:cover;border-radius:4px;display:block}
      /* 덮개 화면 (앨범 · 누구예요?) */
      .fc-ov{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-radius:28px;
        background:#f6d9d2 url("${BG}") no-repeat;background-size:cover;background-position:85% 20%;animation:fadeIn .25s}
      .fc-ov:before{content:"";position:absolute;inset:0;border-radius:inherit;background:rgba(255,244,238,.72);pointer-events:none}
      .fc-ov>*{position:relative}
      .fc-fam{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;flex:0 0 auto;background:rgba(255,255,255,.55);border-radius:20px;padding:12px 10px 8px}
      .fc-fam .fc-pol,.fc-grid .fc-pol{height:auto;width:100%;margin:0;cursor:pointer}
      .fc-fam .fc-pol .ph{aspect-ratio:1/1;height:auto}
      .fc-fam .fc-slot{display:flex;flex-direction:column;align-items:center;gap:4px}
      .fc-fam .tag{font-size:clamp(26px,4vmin,36px);line-height:1}
      .fc-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(92px,15vmin,130px),1fr));gap:16px 12px;align-content:start;padding:10px 6px}
      .fc-grid .fc-pol .ph{aspect-ratio:1/1;height:auto}
      .fc-obar{display:flex;gap:10px;justify-content:center;flex:0 0 auto;flex-wrap:wrap}
      .fc-obar .btn{min-height:62px;font-size:clamp(20px,2.6vw,26px);padding:8px 18px}
      .fc-obar .btn .e{font-size:1.4em}
      .fc-pick{flex-direction:row;align-items:center;justify-content:center;gap:clamp(16px,4vw,48px)}
      .fc-snap{position:relative;flex:0 0 auto;width:min(38vmin,300px);transform:rotate(-3deg);animation:popIn .4s backwards}
      .fc-snap img{width:100%;display:block;border-radius:8px;box-shadow:0 10px 18px rgba(90,40,30,.28)}
      .fc-snap .pin{position:absolute;left:50%;top:-10px;width:18px;height:30px;margin-left:-9px;border-radius:4px;background:linear-gradient(90deg,#f39ab3,#e57d99)}
      .fc-side{display:flex;flex-direction:column;align-items:center;gap:12px;flex:0 1 auto}
      .fc-pick .q{font-size:clamp(40px,7vmin,60px);line-height:1;animation:wig 1.6s ease-in-out infinite}
      .fc-whos{display:grid;grid-template-columns:repeat(4,auto);gap:12px}
      .fc-whos .btn{width:clamp(72px,12vmin,104px);height:clamp(72px,12vmin,104px);padding:4px;font-size:clamp(36px,6.4vmin,58px);border-radius:22px;display:flex;align-items:center;justify-content:center;animation:popIn .35s backwards;animation-delay:calc(var(--i) * 50ms)}
      .fc-empty{grid-column:1/-1;text-align:center;font-size:clamp(40px,8vmin,64px);opacity:.55;padding:20px}
      @media (min-width:600px) and (min-height:600px){.fc-line{display:block}}
      @media (max-aspect-ratio:1/1){
        .fc{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(170px,1fr) auto;grid-template-areas:"face" "panel";gap:8px;padding:0 10px 10px}
        .fc-panel{gap:7px}
        .fc-tabs{grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}
        .fc-colors{gap:6px}
        .fc-col{width:min(calc((100vw - 92px) / 8),42px);height:min(calc((100vw - 92px) / 8),42px);border-width:3px}
        .fc-tab{height:56px;font-size:30px;border-radius:14px}
        .fc-opts{grid-auto-rows:clamp(62px,9vh,84px);flex:0 0 auto;padding:6px;gap:6px}
        .fc-act{min-height:56px;padding:8px 14px}
        .fc-fam{grid-template-columns:repeat(3,minmax(0,1fr))}
        .fc-pick{flex-direction:column}
        .fc-snap{width:min(56vw,300px)}
      }
      @media (orientation:portrait) and (max-width:480px){
        .fc-tabs{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
        .fc-tab{height:48px;font-size:28px}
        .fc-act{font-size:20px;padding:6px 12px}
        .fc-act .t{display:none}
        .fc-act.primary .t{display:inline}
        .fc-obar .btn{font-size:19px;padding:6px 12px;min-height:56px}
      }
      @media (orientation:portrait) and (max-height:720px){
        .fc{grid-template-rows:minmax(136px,1fr) auto}
        .fc-tab{height:44px;font-size:26px}
        .fc-opts{grid-auto-rows:56px}
        .fc-col{width:34px;height:34px}
        .fc-act{min-height:52px}
      }
      @media (orientation:landscape) and (max-height:500px){
        .fc-opts{grid-auto-rows:minmax(46px,1fr);overflow-y:auto}
        .fc-act{min-height:52px;font-size:19px;padding:4px 12px}
        .fc-act .t{display:none}
        .fc-act.primary .t{display:inline}
        .fc-ov{padding:8px 10px;gap:6px}
        .fc-fam{grid-template-columns:repeat(6,minmax(0,1fr));padding:8px 8px 4px;gap:8px}
        .fc-fam .fc-pol{width:72%}
        .fc-fam .tag{font-size:24px}
        .fc-grid{grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:10px}
        .fc-obar .btn{min-height:50px;font-size:18px;padding:4px 12px}
        .fc-snap{width:min(46vh,220px)}
        .fc-pick .q{font-size:34px}
        .fc-whos{gap:8px}
        .fc-whos .btn{width:64px;height:64px;font-size:36px}
      }
    `);

    /* ---------- 점토 색칠 도우미 ---------- */
    const INK = "#3b2b2f";
    const SKINS = ["#ffe0c4", "#f6c79f", "#e2a477", "#c48558", "#8f5d3b", "#ffc9de", "#b9e3ff", "#c6efa9"];
    const HAIRC = ["#3b2a20", "#7a4a26", "#e0a83a", "#f2603b", "#8e5cf7", "#2f95f5", "#ff6fae", "#f4f4f4"];
    const SHIRTS = ["#2f95f5", "#ff7452", "#2fb466", "#8a63ee", "#ffc531", "#ff5d8f"];
    const full = (c) => (/^#[0-9a-f]{3}$/i.test(c) ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c).toLowerCase();
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
    const hex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const mixc = (c, t, k) => {
      const a = rgb(c), b = rgb(t);
      return hex(a.map((v, i) => v + (b[i] - v) * k));
    };
    let pfx = "f0_", defs = null, shade = false; // 그리는 중인 SVG 의 id 앞말 · 그라디언트 모음 · 그림자 모드
    let uid = 0;
    const SHC = "#5a2e22"; // 그림자 색
    /** 점토 덩이 색: 왼쪽 위가 밝고 오른쪽 아래가 어두운 둥근 그라디언트 */
    const cl = (c) => {
      if (shade) return SHC;
      if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c)) return c;
      c = full(c);
      const id = pfx + "k" + c.slice(1);
      if (defs && !defs.has(id))
        defs.set(id, '<radialGradient id="' + id + '" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="' + mixc(c, "#fffaf0", 0.5) + '"/><stop offset=".42" stop-color="' + c + '"/><stop offset="1" stop-color="' + mixc(c, "#3a2418", 0.2) + '"/></radialGradient>');
      return "url(#" + id + ")";
    };
    const edge = (c) => (shade ? SHC : /^#/.test(c) ? mixc(full(c), "#3a2418", 0.45) : INK);
    const ink = () => (shade ? SHC : INK);
    /** 말아 붙인 점토 줄(선): 진한 줄 + 위쪽 옅은 하이라이트 */
    const S = (d, w = 6, fill = "none") => {
      if (fill !== "none") return '<path d="' + d + '" fill="' + cl(fill) + '" stroke="' + edge(fill) + '" stroke-width="' + Math.min(w, 4) + '" stroke-linejoin="round" stroke-linecap="round"/>';
      const base = '<path d="' + d + '" fill="none" stroke="' + ink() + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
      if (shade) return base;
      return base + '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="' + (w * 0.3).toFixed(1) + '" stroke-linecap="round" stroke-linejoin="round" transform="translate(' + (-w * 0.1).toFixed(1) + " " + (-w * 0.2).toFixed(1) + ')"/>';
    };
    const C = (cx, cy, r, fill, sw = 0) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + cl(fill) + '"' + (sw ? ' stroke="' + edge(fill) + '" stroke-width="' + Math.min(sw, 4) + '"' : "") + "/>";
    const E = (cx, cy, rx, ry, fill, sw = 0, extra = "") => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + cl(fill) + '"' + (sw ? ' stroke="' + edge(fill) + '" stroke-width="' + Math.min(sw, 4) + '"' : "") + extra + "/>";
    const R = (x, y, w, h, rx, fill, sw = 0, extra = "") => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + cl(fill) + '"' + (sw ? ' stroke="' + edge(fill) + '" stroke-width="' + Math.min(sw, 4) + '"' : "") + extra + "/>";
    /** 반짝 하이라이트 (그림자 모드에서는 없음) */
    const HL = (cx, cy, r, o = 0.85) => (shade ? "" : '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" fill-opacity="' + o + '"/>');
    /** 붙인 부위 아래 옅은 그림자 — 같은 모양을 그림자 색으로 한 번 더 (필터 없이) */
    const shadow = (markup, dx = 3, dy = 6, op = 0.16) => {
      if (!markup) return "";
      shade = true;
      const s = markup();
      shade = false;
      return '<g transform="translate(' + dx + " " + dy + ')" opacity="' + op + '">' + s + "</g>" + markup();
    };

    /* ---------- 부위 그림 ---------- */
    const eyeL = 112,
      eyeR = 188,
      eyeY = 186;
    const heartD = (x, y, s) =>
      "M" + x + " " + (y + s * 0.9) + " C" + (x - s * 1.6) + " " + (y - s * 0.2) + " " + (x - s * 0.7) + " " + (y - s * 1.2) + " " + x + " " + (y - s * 0.35) +
      " C" + (x + s * 0.7) + " " + (y - s * 1.2) + " " + (x + s * 1.6) + " " + (y - s * 0.2) + " " + x + " " + (y + s * 0.9) + "Z";
    const heart = (x, y, s, fill) => (/^#/.test(fill) ? S(heartD(x, y, s), 3, fill) : '<path d="' + heartD(x, y, s) + '" fill="' + (shade ? SHC : fill) + '" stroke="' + ink() + '" stroke-width="3" stroke-linejoin="round"/>');
    const starD = (cx, cy, R0) => {
      const p = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5,
          rad = k % 2 ? R0 * 0.45 : R0;
        p.push((cx + Math.cos(a) * rad).toFixed(1) + "," + (cy + Math.sin(a) * rad).toFixed(1));
      }
      return "M" + p.join(" L") + "Z";
    };
    const starP = (cx, cy, R0, fill, sw = 3) => (/^#/.test(fill) ? S(starD(cx, cy, R0), sw, fill) : '<path d="' + starD(cx, cy, R0) + '" fill="' + (shade ? SHC : fill) + '" stroke="' + ink() + '" stroke-width="' + sw + '" stroke-linejoin="round"/>');
    const bothEyes = (f) => f(eyeL, 1) + f(eyeR, -1);
    const pupil = (x, y, r) => C(x, y, r, INK) + HL(x - r * 0.35, y - r * 0.4, r * 0.34);

    const EYES = [
      ["dot", "점 눈", () => bothEyes((x) => pupil(x, eyeY, 11))],
      ["big", "반짝 눈", () => bothEyes((x) => C(x, eyeY, 21, "#fff", 4) + C(x, eyeY + 2, 13, "#6b4a2e") + C(x, eyeY + 2, 7, INK) + HL(x - 5, eyeY - 4, 4.5, 0.95) + HL(x + 5, eyeY + 7, 2, 0.9))],
      ["happy", "웃는 눈", () => bothEyes((x) => S("M" + (x - 16) + " " + (eyeY + 6) + " Q" + x + " " + (eyeY - 16) + " " + (x + 16) + " " + (eyeY + 6), 7))],
      ["wink", "윙크", () => C(eyeL, eyeY, 21, "#fff", 4) + C(eyeL, eyeY + 2, 12, "#3f7fd8") + C(eyeL, eyeY + 2, 6, INK) + HL(eyeL - 5, eyeY - 4, 4, 0.95) + S("M" + (eyeR - 16) + " " + eyeY + " L" + (eyeR + 14) + " " + (eyeY - 8) + " M" + (eyeR - 16) + " " + eyeY + " L" + (eyeR + 14) + " " + (eyeY + 8), 6)],
      ["star", "별 눈", () => bothEyes((x) => starP(x, eyeY, 21, "#ffd23f") + HL(x - 5, eyeY - 6, 3.5, 0.8))],
      ["heart", "하트 눈", () => bothEyes((x) => heart(x, eyeY + 2, 15, "#ff4f7b") + HL(x - 7, eyeY - 4, 3.5, 0.8))],
      ["sleepy", "졸린 눈", () => bothEyes((x) => S("M" + (x - 17) + " " + eyeY + " Q" + x + " " + (eyeY + 14) + " " + (x + 17) + " " + eyeY, 6) + S("M" + (x - 8) + " " + (eyeY + 10) + " l-3 6 M" + x + " " + (eyeY + 12) + " v7 M" + (x + 8) + " " + (eyeY + 10) + " l3 6", 3))],
      ["googly", "왕눈", () => C(eyeL, eyeY, 24, "#fff", 4) + C(eyeL + 8, eyeY + 8, 11, INK) + HL(eyeL + 5, eyeY + 4, 3.5) + C(eyeR, eyeY, 24, "#fff", 4) + C(eyeR - 9, eyeY - 6, 11, INK) + HL(eyeR - 12, eyeY - 10, 3.5)],
    ];
    // 반응 때만 잠깐 쓰는 눈 (보기에는 없음)
    const EYES_TMP = {
      shut: () => bothEyes((x, s) => S("M" + (x - 15 * s) + " " + (eyeY - 10) + " L" + (x + 9 * s) + " " + eyeY + " L" + (x - 15 * s) + " " + (eyeY + 10), 6)),
      winkR: () => C(eyeL, eyeY, 21, "#fff", 4) + C(eyeL, eyeY + 2, 12, "#6b4a2e") + C(eyeL, eyeY + 2, 6, INK) + HL(eyeL - 5, eyeY - 4, 4, 0.95) + S("M" + (eyeR - 16) + " " + (eyeY + 4) + " Q" + eyeR + " " + (eyeY - 12) + " " + (eyeR + 16) + " " + (eyeY + 4), 6),
    };
    const BROWS = [
      ["none", "없음", () => ""],
      ["normal", "보통", () => S("M92 152 Q112 140 132 150", 7) + S("M168 150 Q188 140 208 152", 7)],
      ["angry", "화난", () => S("M92 144 L132 158", 8) + S("M168 158 L208 144", 8)],
      ["up", "놀란", () => S("M94 142 Q112 124 130 138", 6) + S("M170 138 Q188 124 206 142", 6)],
      ["thick", "굵은", () => R(88, 140, 46, 14, 7, INK, 0, ' transform="rotate(-6 111 147)"') + R(166, 140, 46, 14, 7, INK, 0, ' transform="rotate(6 189 147)"') + (shade ? "" : '<path d="M94 143 H126 M172 142 H204" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>')],
      ["sad", "슬픈", () => S("M92 150 Q110 152 130 138", 6) + S("M170 138 Q190 152 208 150", 6)],
    ];
    const NOSES = [
      ["dot", "콩 코", () => E(150, 226, 11, 8, "#e58d7a") + HL(146, 223, 3, 0.7)],
      ["clown", "빨간 코", () => C(150, 226, 19, "#ff3b30", 4) + HL(143, 218, 6, 0.9)],
      ["tri", "세모 코", () => S("M150 206 L138 236 L162 236 Z", 4, "#f0b48f") + HL(147, 222, 2.5, 0.6)],
      ["pig", "돼지 코", () => E(150, 228, 22, 16, "#ffa3b8", 4) + E(142, 228, 4, 6, INK) + E(158, 228, 4, 6, INK) + HL(140, 220, 4, 0.7)],
      ["curve", "오뚝 코", () => S("M152 204 Q136 232 156 236", 5)],
    ];
    const MY = 270;
    const mouthHole = (d) => S(d, 4, "#8e2b3c");
    const MOUTHS = [
      ["smile", "웃는 입", () => S("M116 " + (MY - 8) + " Q150 " + (MY + 26) + " 184 " + (MY - 8), 7)],
      ["grin", "이 보이는 입", () => mouthHole("M108 " + (MY - 12) + " Q150 " + (MY - 8) + " 192 " + (MY - 12) + " Q186 " + (MY + 34) + " 150 " + (MY + 36) + " Q114 " + (MY + 34) + " 108 " + (MY - 12) + "Z") + (shade ? "" : '<path d="M114 ' + (MY - 9) + " Q150 " + (MY - 5) + " 186 " + (MY - 9) + " L183 " + (MY + 4) + " Q150 " + (MY + 8) + " 117 " + (MY + 4) + 'Z" fill="#fffaf2"/>')],
      ["laugh", "깔깔 입", () => mouthHole("M110 " + (MY - 10) + " Q150 " + (MY - 14) + " 190 " + (MY - 10) + " Q184 " + (MY + 42) + " 150 " + (MY + 42) + " Q116 " + (MY + 42) + " 110 " + (MY - 10) + "Z") + E(150, MY + 28, 22, 12, "#ff7d93")],
      ["o", "오 입", () => E(150, MY + 4, 15, 20, "#8e2b3c", 4) + HL(144, MY - 6, 3, 0.5)],
      ["tongue", "메롱", () => S("M136 " + (MY + 2) + " Q136 " + (MY + 34) + " 150 " + (MY + 34) + " Q164 " + (MY + 34) + " 164 " + (MY + 2) + "Z", 4, "#ff7d93") + S("M114 " + (MY - 4) + " Q150 " + (MY + 16) + " 186 " + (MY - 4), 7) + S("M150 " + (MY + 8) + " V" + (MY + 22), 3)],
      ["sad", "시무룩", () => S("M118 " + (MY + 16) + " Q150 " + (MY - 10) + " 182 " + (MY + 16), 7)],
      ["cat", "고양이 입", () => S("M122 " + MY + " Q136 " + (MY + 16) + " 150 " + MY + " Q164 " + (MY + 16) + " 178 " + MY, 6)],
      ["kiss", "뽀뽀 입", () => heart(150, MY + 2, 13, "#ff4f7b") + HL(144, MY - 2, 3, 0.7)],
      ["teeth", "토끼 이", () => S("M114 " + (MY - 8) + " Q150 " + (MY + 18) + " 186 " + (MY - 8), 7) + R(138, MY + 3, 24, 18, 4, "#fffaf2", 4) + S("M150 " + (MY + 4) + " V" + (MY + 20), 3)],
    ];
    const HAIRS = [
      ["none", "민머리", () => ({ back: "", front: "" })],
      ["short", "짧은 머리", (h) => ({ back: "", front: () => S("M50 196 Q42 86 150 78 Q258 86 250 196 Q238 128 200 118 Q150 140 100 118 Q62 128 50 196Z", 4, h) + strands(h, [[96, 96, 126, 112], [150, 88, 170, 110], [196, 98, 222, 120]]) })],
      ["spiky", "뾰족 머리", (h) => ({ back: "", front: () => S("M54 180 L58 118 L80 134 L88 80 L114 112 L128 58 L150 100 L172 58 L186 112 L212 80 L220 134 L242 118 L246 180 Q222 126 150 126 Q78 126 54 180Z", 4, h) })],
      ["bowl", "바가지 머리", (h) => ({ back: "", front: () => S("M46 204 Q38 78 150 74 Q262 78 254 204 L238 204 Q234 150 222 140 L78 140 Q66 150 62 204Z", 4, h) + strands(h, [[100, 100, 104, 136], [150, 92, 150, 136], [200, 100, 196, 136]]) })],
      ["curly", "곱슬 머리", (h) => ({ back: "", front: () => [[60, 160], [66, 124], [88, 96], [118, 80], [150, 74], [182, 80], [212, 96], [234, 124], [240, 160]].map(([x, y]) => C(x, y, 26, h, 4)).join("") + C(100, 118, 22, h) + C(150, 108, 24, h) + C(200, 118, 22, h) })],
      ["long", "긴 머리", (h) => ({ back: () => S("M38 200 Q28 64 150 64 Q272 64 262 200 L272 340 Q244 352 224 330 L76 330 Q56 352 28 340Z", 4, h), front: () => S("M52 182 Q58 92 150 86 Q242 92 248 182 Q212 122 150 128 Q122 110 100 130 Q72 140 52 182Z", 4, h) + strands(h, [[120, 100, 140, 120], [180, 98, 206, 124]]) })],
      ["pigtail", "양갈래", (h) => ({ back: () => C(34, 132, 32, h, 4) + C(266, 132, 32, h, 4) + C(58, 146, 9, "#ff5d8f", 3) + C(242, 146, 9, "#ff5d8f", 3), front: () => S("M52 186 Q48 88 150 80 Q252 88 248 186 Q232 126 150 124 Q68 126 52 186Z", 4, h) + strands(h, [[110, 96, 132, 116], [176, 94, 200, 116]]) })],
      ["mohawk", "닭벼슬", (h) => ({ back: "", front: () => S("M126 122 Q116 36 150 10 Q184 36 174 122 Q150 112 126 122Z", 4, h) })],
    ];
    /** 머리카락 결 (짧은 점토 줄 몇 개 — 머리색보다 조금 어둡게) */
    function strands(h, list) {
      if (shade) return "";
      const c = mixc(full(h), "#3a2418", 0.28);
      return list.map(([x1, y1, x2, y2]) => '<path d="M' + x1 + " " + y1 + " Q" + ((x1 + x2) / 2 - 8) + " " + ((y1 + y2) / 2) + " " + x2 + " " + y2 + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" opacity=".55"/>').join("");
    }
    const HATS = [
      ["none", "없음", () => ""],
      ["crown", "왕관", () => S("M88 112 L92 50 L122 84 L150 34 L178 84 L208 50 L212 112Z", 4, "#ffd23f") + C(150, 74, 9, "#ff4f7b", 3) + HL(147, 71, 3) + C(110, 96, 7, "#4fc3ff", 3) + C(190, 96, 7, "#4fc3ff", 3) + C(92, 50, 6, "#ffd23f", 3) + C(150, 34, 6, "#ffd23f", 3) + C(208, 50, 6, "#ffd23f", 3)],
      ["tophat", "신사 모자", () => R(98, 0, 104, 100, 10, "#2a2b45", 4) + R(98, 70, 104, 18, 2, "#ff5d8f") + E(150, 100, 98, 15, "#2a2b45", 4) + (shade ? "" : '<path d="M112 10 V62" stroke="#fff" stroke-opacity=".18" stroke-width="7" stroke-linecap="round"/>')],
      ["cap", "야구 모자", () => S("M58 124 Q56 46 150 42 Q244 46 242 124Z", 4, "#2f95f5") + S("M146 116 Q246 102 292 126 Q244 140 146 128Z", 4, "#1f6fc0") + C(150, 44, 9, "#ffd23f", 3) + S("M150 46 V120", 3)],
      ["bow", "리본", () => S("M206 98 L170 70 L174 126Z", 4, "#ff5d8f") + S("M206 98 L244 70 L240 126Z", 4, "#ff5d8f") + C(206, 98, 13, "#ff8fb3", 4) + HL(202, 94, 3.5, 0.7)],
      ["party", "고깔 모자", () => S("M108 108 L150 4 L192 108Z", 4, "#8a63ee") + (shade ? "" : '<path d="M120 80 L180 76" stroke="#ffd23f" stroke-width="8" stroke-linecap="round"/><path d="M131 50 L169 48" stroke="#2fd47a" stroke-width="8" stroke-linecap="round"/>') + C(150, 6, 14, "#ffd23f", 4) + HL(145, 1, 4)],
      ["flower", "꽃 머리띠", () => S("M56 128 Q150 62 244 128", 9) + [[64, 120, "#ff5d8f"], [100, 96, "#ffd23f"], [150, 86, "#4fc3ff"], [200, 96, "#ff9f40"], [236, 120, "#8a63ee"]].map(([x, y, c]) => [0, 72, 144, 216, 288].map((a) => C(x + Math.cos((a * Math.PI) / 180) * 10, y + Math.sin((a * Math.PI) / 180) * 10, 9, c, 2)).join("") + C(x, y, 7, "#fff3a0", 2)).join("")],
    ];
    const lens = (fill) => (shade ? "none" : fill);
    const GLASSES = [
      ["none", "없음", () => ""],
      ["round", "동글 안경", () => '<circle cx="' + eyeL + '" cy="' + eyeY + '" r="31" fill="' + lens("rgba(200,235,255,.3)") + '" stroke="' + ink() + '" stroke-width="6"/><circle cx="' + eyeR + '" cy="' + eyeY + '" r="31" fill="' + lens("rgba(200,235,255,.3)") + '" stroke="' + ink() + '" stroke-width="6"/>' + S("M143 182 Q150 174 157 182", 6) + S("M81 180 L56 172 M219 180 L244 172", 6) + (shade ? "" : '<path d="M94 172 Q100 164 110 162 M170 172 Q176 164 186 162" stroke="#fff" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/>')],
      ["sun", "선글라스", () => R(74, 162, 74, 48, 18, "#1d1f33", 4) + R(152, 162, 74, 48, 18, "#1d1f33", 4) + S("M144 176 H156", 6) + (shade ? "" : '<path d="M86 172 l18 0 M164 172 l18 0" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>') + S("M74 176 L54 168 M226 176 L246 168", 6)],
      ["star", "별 안경", () => starP(eyeL, eyeY, 38, lens("rgba(255,210,63,.5)"), 5) + starP(eyeR, eyeY, 38, lens("rgba(255,210,63,.5)"), 5) + S("M144 184 H156", 5)],
      ["heart", "하트 안경", () => heart(eyeL, eyeY + 4, 25, lens("rgba(255,79,123,.45)")) + heart(eyeR, eyeY + 4, 25, lens("rgba(255,79,123,.45)")) + S("M144 182 H156", 5)],
    ];
    const PARTS = {
      skin: { em: "🙂", name: "얼굴색", list: SKINS.map((c, i) => [i, "", null]) },
      hair: { em: "💇", name: "머리", list: HAIRS },
      eyes: { em: "👀", name: "눈", list: EYES },
      brows: { em: "🤨", name: "눈썹", list: BROWS },
      nose: { em: "👃", name: "코", list: NOSES },
      mouth: { em: "👄", name: "입", list: MOUTHS },
      hat: { em: "🎩", name: "모자", list: HATS },
      glasses: { em: "👓", name: "안경", list: GLASSES },
    };
    const TAB_ORDER = ["skin", "hair", "eyes", "brows", "nose", "mouth", "hat", "glasses"];
    const DEF = { skin: 0, hair: "short", hairC: 0, eyes: "big", brows: "normal", nose: "dot", mouth: "smile", hat: "none", glasses: "none", shirt: 0 };
    // 가족·친구 칸 (글자 대신 그림) — 앞 6개가 가족 칸
    const WHO = [["dad", "👨", "아빠"], ["mom", "👩", "엄마"], ["me", "🙋", "나"], ["baby", "👶", "아기"], ["grandma", "👵", "할머니"], ["grandpa", "👴", "할아버지"], ["friend", "🧒", "친구"]];
    const FAM = WHO.slice(0, 6).map((w) => w[0]);
    const whoOf = (k) => WHO.find((w) => w[0] === k) || WHO[6];
    const MAXF = 40;
    const fn = (part, id) => (PARTS[part].list.find((x) => x[0] === id) || PARTS[part].list[0])[2];
    const isInt = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
    /** 저장된 값·백업에서 온 값을 믿지 않고 아는 값만 받아들임 */
    function cleanCfg(c) {
      const o = Object.assign({}, DEF);
      if (!c || typeof c !== "object") return o;
      for (const k of ["hair", "eyes", "brows", "nose", "mouth", "hat", "glasses"]) if (PARTS[k].list.some((x) => x[0] === c[k])) o[k] = c[k];
      if (isInt(c.skin, SKINS.length)) o.skin = c.skin;
      if (isInt(c.hairC, HAIRC.length)) o.hairC = c.hairC;
      if (isInt(c.shirt, SHIRTS.length)) o.shirt = c.shirt;
      return o;
    }
    function loadFriends() {
      const raw = KP.store.get("face:friends", []);
      if (!Array.isArray(raw)) return [];
      const seen = new Set();
      return raw
        .filter((f) => f && typeof f === "object" && typeof f.id === "string" && f.id.length <= 40 && !seen.has(f.id) && seen.add(f.id))
        .map((f) => ({ id: f.id, who: whoOf(f.who)[0], t: Number.isFinite(f.t) ? f.t : 0, cfg: cleanCfg(f.cfg) }))
        .sort((a, b) => a.t - b.t)
        .slice(-MAXF);
    }
    let friends = loadFriends();
    let cfg = cleanCfg(KP.store.get("face:cfg", null));
    let cur = KP.store.get("face:cur", null); // 고치는 중인 친구 id
    let pendWho = KP.store.get("face:who", null); // 새 얼굴을 찍으면 걸 가족 칸
    const saveFriends = () => KP.store.set("face:friends", friends);
    const friendOf = (id) => friends.find((f) => f.id === id) || null;

    /** 얼굴 SVG 전체. o.vb: 보기 영역, o.hit: 큰 누르기 영역(부위 반응)까지 */
    function faceSVG(c, o = {}) {
      pfx = "f" + uid++ + "_";
      defs = new Map();
      const skin = SKINS[c.skin] || SKINS[0];
      const hcol = HAIRC[c.hairC] || HAIRC[0];
      const hair = fn("hair", c.hair)(hcol);
      const shirt = SHIRTS[c.shirt % SHIRTS.length] || SHIRTS[0];
      const eyes = EYES_TMP[c.eyes] || fn("eyes", c.eyes);
      const call = (m) => (typeof m === "function" ? m() : m || "");
      const gid = pfx + "grain", bid = pfx + "blush";
      const blushO = c.blush ? 1 : 0.55, br = c.blush ? 27 : 19; // 수줍으면 볼이 크고 진하게
      const body =
        '<g class="all">' +
        '<g class="hairB" data-p="hair">' + shadow(typeof hair.back === "function" ? hair.back : null, 2, 5, 0.12) + "</g>" +
        '<g data-p="body">' +
        S("M60 370 Q64 316 150 308 Q236 316 240 370Z", 5, shirt) +
        (shade ? "" : '<path d="M96 346 Q150 330 204 346" stroke="#fff" stroke-opacity=".22" stroke-width="5" fill="none" stroke-linecap="round"/>') +
        S("M126 300 h48 v20 q-24 14 -48 0Z", 4, skin) +
        "</g>" +
        '<g class="ear" data-p="ears" style="--r:-10deg">' + C(52, 206, 22, skin, 4) + '<path d="M50 196 Q42 206 52 218" stroke="' + mixc(full(skin), "#3a2418", 0.3) + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></g>' +
        '<g class="ear" data-p="ears" style="--r:10deg">' + C(248, 206, 22, skin, 4) + '<path d="M250 196 Q258 206 248 218" stroke="' + mixc(full(skin), "#3a2418", 0.3) + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></g>' +
        '<g data-p="face">' + E(150, 200, 100, 112, skin, 4) + '<ellipse cx="150" cy="200" rx="98" ry="110" fill="url(#' + gid + ')"/>' + "</g>" +
        '<g class="hairF" data-p="hair">' + shadow(typeof hair.front === "function" ? hair.front : null, 2, 7, 0.16) + "</g>" +
        '<g class="cheeks" data-p="cheek" style="opacity:' + blushO + '"><circle cx="96" cy="240" r="' + br + '" fill="url(#' + bid + ')"/><circle cx="204" cy="240" r="' + br + '" fill="url(#' + bid + ')"/></g>' +
        '<g class="brows" data-p="eyes">' + fn("brows", c.brows)() + "</g>" +
        '<g class="eyes" data-p="eyes">' + eyes() + "</g>" +
        '<g class="nose" data-p="nose">' + shadow(fn("nose", c.nose), 2, 5, 0.18) + "</g>" +
        '<g class="mouth" data-p="mouth">' + fn("mouth", c.mouth)() + "</g>" +
        '<g class="glasses" data-p="eyes">' + shadow(fn("glasses", c.glasses), 2, 6, 0.12) + "</g>" +
        '<g class="hat" data-p="hat">' + shadow(fn("hat", c.hat), 3, 7, 0.18) + "</g>" +
        (o.hit
          ? '<g fill="#fff" fill-opacity="0">' +
            '<circle data-p="cheek" cx="92" cy="244" r="28"/><circle data-p="cheek" cx="208" cy="244" r="28"/>' +
            '<circle data-p="eyes" cx="' + eyeL + '" cy="' + eyeY + '" r="36"/><circle data-p="eyes" cx="' + eyeR + '" cy="' + eyeY + '" r="36"/>' +
            '<circle data-p="nose" cx="150" cy="226" r="27"/>' +
            '<ellipse data-p="mouth" cx="150" cy="' + (MY + 10) + '" rx="46" ry="30"/>' +
            '<circle data-p="ears" cx="44" cy="206" r="30"/><circle data-p="ears" cx="256" cy="206" r="30"/>' +
            "</g>"
          : "") +
        "</g>";
      const blush = '<radialGradient id="' + bid + '"><stop offset="0" stop-color="#ff5f80" stop-opacity="' + (c.blush ? 0.95 : 0.7) + '"/><stop offset=".6" stop-color="#ff7d96" stop-opacity=".4"/><stop offset="1" stop-color="#ff8aa0" stop-opacity="0"/></radialGradient>';
      // 점토 결: 아주 옅은 점 무늬 두 겹 (패턴은 한 번 그려 반복 → 가벼움)
      const grain =
        '<pattern id="' + gid + '" width="23" height="19" patternUnits="userSpaceOnUse">' +
        '<circle cx="3" cy="4" r="1.3" fill="#fff" fill-opacity=".16"/><circle cx="14" cy="9" r="1.1" fill="#5a2e22" fill-opacity=".07"/><circle cx="19" cy="2" r=".9" fill="#fff" fill-opacity=".12"/>' +
        '<circle cx="8" cy="15" r="1.2" fill="#5a2e22" fill-opacity=".06"/><circle cx="20" cy="16" r="1" fill="#fff" fill-opacity=".1"/></pattern>';
      const out =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (o.vb || "0 -14 300 384") + '" preserveAspectRatio="xMidYMid meet"><defs>' + blush + grain + Array.from(defs.values()).join("") + "</defs>" + body + "</svg>";
      defs = null;
      return out;
    }
    const MIRROR_VB = "-30 -12 360 360";
    const POL_VB = "22 52 256 256";

    /* ---------- 화면 ---------- */
    const wrap = U.el("div", "fc");
    const stage = U.el("div", "fc-stage");
    const mirror = U.el("div", "fc-mirror");
    const glass = U.el("div", "fc-glass");
    const flash = U.el("div", "fc-flash");
    const badge = U.el("div", "fc-badge");
    stage.append(mirror, flash, badge);
    const panel = U.el("div", "fc-panel");
    const line = U.el("div", "fc-line", '<svg class="rope" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 8 Q50 30 100 8" fill="none" stroke="#c9955f" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg>');
    const pols = U.el("div", "fc-pols");
    line.appendChild(pols);
    const tabs = U.el("div", "fc-tabs");
    const opts = U.el("div", "fc-opts");
    const colors = U.el("div", "fc-colors");
    const acts = U.el("div", "fc-acts");
    const bRand = U.btn(KP.E("🎲") + '<span class="t"> 랜덤</span>', "btn fc-act");
    const bPhoto = U.btn(KP.E("📸") + '<span class="t"> 사진 찍기</span>', "btn primary fc-act");
    const bAlbum = U.btn(KP.E("📒") + '<span class="t"> 앨범</span>', "btn fc-act fc-albumBtn");
    acts.append(bRand, bPhoto, bAlbum);
    panel.append(line, tabs, opts, colors, acts);
    wrap.append(stage, panel);
    ctx.body.appendChild(wrap);
    let tab = "eyes",
      temp = null,
      unsaved = true;

    /* 거울 자리: 배경 그림을 잘라 거울(전구 포함)이 무대에 크게 들어오게 */
    let mGeom = { x: 0, y: 0, r: 100 };
    function layout() {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      // 전구까지 다 보이게 — 옆이 넉넉하면(납작한 무대) 거울 안쪽이 높이를 꽉 채우게(위아래 전구는 조금 잘림)
      let k = Math.max(Math.min(w, h) / (2 * MRO), Math.min(w / (2 * MRO), h / (2 * MR)) * 0.98);
      k = Math.max(k, w / IW, h / IH);
      const fw = IW * k, fh = IH * k;
      const ox = Math.max(0, Math.min(fw - w, MX * k - w / 2));
      const oy = Math.max(0, Math.min(fh - h, MY0 * k - h / 2));
      stage.style.backgroundSize = fw + "px " + fh + "px";
      stage.style.backgroundPosition = -ox + "px " + -oy + "px";
      const r = MR * k * 0.985;
      mGeom = { x: MX * k - ox, y: MY0 * k - oy, r };
      Object.assign(mirror.style, { left: mGeom.x - r + "px", top: mGeom.y - r + "px", width: 2 * r + "px", height: 2 * r + "px" });
      badge.style.left = Math.max(8, mGeom.x - r * 1.05 - 20) + "px";
      badge.style.top = Math.max(8, mGeom.y - r * 1.05) + "px";
      renderLine();
    }
    // 화면은 한 번 만들어 계속 씀 → 지켜보기도 한 번만 (숨겨진 동안은 크기 0 이라 그냥 넘어감)
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => layout());
      ro.observe(stage);
      ro.observe(line);
    } else window.addEventListener("resize", layout);

    function render() {
      const c = temp ? Object.assign({}, cfg, temp) : cfg;
      mirror.innerHTML = faceSVG(c, { vb: MIRROR_VB, hit: true });
      mirror.appendChild(glass);
    }
    const svgAll = () => mirror.querySelector("g.all");
    function renderBadge() {
      const f = cur && friendOf(cur);
      const w = f ? f.who : pendWho;
      if (w && w !== "friend") {
        badge.innerHTML = KP.E(whoOf(w)[1]);
        badge.classList.add("on");
      } else badge.classList.remove("on");
    }
    function saveCfg() {
      KP.store.set("face:cfg", cfg);
      unsaved = true;
    }
    function setCur(id, who) {
      cur = id || null;
      pendWho = cur ? null : who || null;
      KP.store.set("face:cur", cur);
      KP.store.set("face:who", pendWho);
      renderBadge();
    }
    TAB_ORDER.forEach((k) => {
      const b = U.btn(KP.E(PARTS[k].em), "fc-tab");
      b.dataset.k = k;
      ctx.tap(b, () => {
        tab = k;
        renderTabs();
        renderOpts();
        A.sfx("select");
        U.replay(b, "jump");
        KP.voice.say(PARTS[k].name);
      });
      tabs.appendChild(b);
    });
    function renderTabs() {
      U.$$(".fc-tab", tabs).forEach((b) => b.classList.toggle("sel", b.dataset.k === tab));
    }
    const VB = { skin: "0 -14 300 384", hair: "20 -20 260 260", eyes: "60 130 180 110", brows: "70 110 160 80", nose: "100 180 100 80", mouth: "90 230 120 90", hat: "20 -20 260 200", glasses: "40 130 220 110" };
    function renderOpts() {
      opts.innerHTML = "";
      colors.innerHTML = "";
      const P = PARTS[tab];
      P.list.forEach(([id, name], i) => {
        const c = Object.assign({}, cfg, { [tab]: id });
        if (tab === "brows" || tab === "eyes" || tab === "nose" || tab === "mouth" || tab === "glasses") Object.assign(c, { hat: "none", hair: tab === "glasses" ? "none" : c.hair });
        const b = U.btn(faceSVG(c, { vb: VB[tab] }), "fc-opt" + (cfg[tab] === id ? " sel" : ""));
        b.style.setProperty("--i", i);
        ctx.tap(b, () => {
          cfg[tab] = id;
          saveCfg();
          U.$$(".fc-opt", opts).forEach((x) => x.classList.toggle("sel", x === b));
          stopReact();
          render();
          U.replay(mirror.firstChild, "bounce");
          U.replay(b, "pop");
          A.note(A.SCALE[i % 8], { inst: "marimba", dur: 0.25, vol: 0.24 });
          if (tab === "mouth" || tab === "eyes") A.sfx("boing");
          if (name) KP.voice.say(name);
        });
        opts.appendChild(b);
      });
      if (tab === "hair") {
        HAIRC.forEach((c, i) => {
          const b = U.btn("", "fc-col" + (cfg.hairC === i ? " sel" : ""));
          b.style.backgroundColor = c;
          ctx.tap(b, () => {
            cfg.hairC = i;
            saveCfg();
            stopReact();
            render();
            renderOpts();
            A.note(A.SCALE[i], { inst: "bell", dur: 0.3, vol: 0.2 });
          });
          colors.appendChild(b);
        });
      }
    }

    /* ---------- 부위마다 다른 반응 ---------- */
    const LINES = ["안녕! 나는 멋쟁이야!", "히히, 간지러워!", "까꿍!", "나랑 같이 놀자!", "우와, 멋지게 꾸며 줘서 고마워!", "하하하! 재밌다!", "나 예뻐?"];
    let reactT = [], busyUntil = 0, mouthN = 0;
    if (KP.sampler) KP.sampler.load(["choir"]).catch(() => {}); // 입 노래(합창 '아~') — 못 불러오면 마림바
    function stopReact() {
      reactT.forEach((t) => ctx.cancel(t));
      reactT = [];
      temp = null;
      busyUntil = 0;
    }
    const later = (ms, f) => reactT.push(ctx.after(ms, f));
    /** 잠깐 다른 얼굴(temp) → ms 뒤 원래대로 */
    function face(t, ms) {
      temp = t;
      render();
      if (ms) later(ms, () => { temp = null; render(); });
    }
    /** 부위 위치(무대 기준 px) */
    function spot(sel) {
      const el = mirror.querySelector(sel), sr = stage.getBoundingClientRect();
      if (!el) return { x: mGeom.x, y: mGeom.y };
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
    }
    const addCls = (sel, cls) => {
      const g = mirror.querySelectorAll(sel);
      g.forEach((x) => U.replay(x, cls));
      return g.length;
    };
    const sing = (n, when) => {
      if (KP.sampler && KP.sampler.ok("choir")) KP.sampler.note("choir", n, { when, vol: 0.5, dur: 0.32 });
      else A.note(n, { inst: "bell", dur: 0.3, vol: 0.22, when });
    };
    const note = (x, y) => KP.pfx && KP.pfx.float(stage, x, y, '<span class="fc-note">' + KP.E("🎵") + "</span>", "", 900, ctx);

    function react(part, ev) {
      const now = performance.now();
      if (now < busyUntil) return; // 반응 중 연타는 무시(다음 반응이 앞 반응을 자르지 않게)
      stopReact();
      const sr = stage.getBoundingClientRect();
      const tx = ev ? ev.clientX - sr.left : mGeom.x, ty = ev ? ev.clientY - sr.top : mGeom.y;
      const fx = KP.pfx;
      if (part === "hat" && cfg.hat === "none") part = "hair";
      if (part === "hair" && cfg.hair === "none" && cfg.hat === "none") part = "face";
      switch (part) {
        case "nose": {
          busyUntil = now + 1200;
          if (cfg.nose === "pig") {
            face({ eyes: "happy" }, 900);
            addCls("g.nose", "squish");
            A.noise({ dur: 0.12, vol: 0.28, bp: 320, q: 4 });
            A.noise({ dur: 0.14, vol: 0.28, bp: 280, q: 4, when: 0.2 });
            KP.voice.say("꿀꿀!");
            if (fx) fx.burst(stage, tx, ty, "heart", 3, ctx);
            break;
          }
          // 에취: 아… 아… (눈 질끈, 입 오) → 에취! (얼굴 앞으로, 콧바람 가루)
          face({ eyes: "shut", mouth: "o", brows: "up" }, 0);
          A.tone(300, { to: 520, dur: 0.4, vol: 0.08, type: "sine" });
          later(430, () => {
            face({ eyes: "shut", mouth: "grin", brows: "up" }, 650);
            addCls("g.all", "sneeze");
            A.noise({ dur: 0.32, vol: 0.32, bp: 2600, bpTo: 700, q: 0.9 });
            KP.voice.say("에취!");
            const n = spot("g.nose");
            if (fx) fx.burst(stage, n.x, n.y + 10, "cool", 10, ctx);
          });
          break;
        }
        case "cheek": {
          busyUntil = now + 1100;
          face({ blush: 1, eyes: "happy", mouth: cfg.mouth === "sad" ? "cat" : cfg.mouth }, 1500);
          addCls("g.cheeks", "hot");
          addCls("g.all", "shy");
          A.tone(330, { to: 620, dur: 0.35, vol: 0.12, type: "sine" });
          KP.voice.say("부끄러워요");
          if (fx) fx.hearts(stage, tx, ty - 10, 3, ctx);
          break;
        }
        case "eyes": {
          busyUntil = now + 700;
          face({ eyes: cfg.eyes === "wink" ? "winkR" : "wink" }, 750);
          A.note("E6", { inst: "bell", dur: 0.25, vol: 0.18 });
          A.note("B6", { inst: "bell", dur: 0.35, vol: 0.14, when: 0.1 });
          KP.voice.say("윙크!");
          if (fx) fx.burst(stage, tx + 20, ty - 14, "spark", 6, ctx);
          break;
        }
        case "mouth": {
          busyUntil = now + 1400;
          if (mouthN++ % 2 === 0) {
            // 노래: 도-미-솔-도 에 맞춰 입을 오므렸다 벌렸다
            ["C5", "E5", "G5", "C6"].forEach((n, i) => {
              later(i * 300, () => {
                face({ mouth: i % 2 ? "laugh" : "o", eyes: cfg.eyes === "sleepy" ? "sleepy" : "happy" }, 0);
                addCls("g.all", "sing");
                const m = spot("g.mouth");
                note(m.x + (i % 2 ? 40 : -40), m.y - 30);
              });
              sing(n, i * 0.3);
            });
            later(1250, () => { temp = null; render(); });
          } else {
            face({ mouth: "laugh", eyes: "happy", brows: cfg.brows === "angry" ? "up" : cfg.brows }, 1300);
            U.replay(mirror.firstChild, "bounce");
            A.sfx("boing");
            ["G5", "C6", "E6"].forEach((n, i) => A.note(n, { inst: "marimba", dur: 0.18, vol: 0.18, when: 0.1 + i * 0.12 }));
            KP.voice.say("하하하!");
          }
          break;
        }
        case "hat":
        case "hair": {
          busyUntil = now + 700;
          face({ eyes: "happy" }, 700);
          addCls(part === "hat" ? "g.hat" : "g.hairF", "hop");
          if (part === "hair") addCls("g.hairB", "squish");
          A.sfx("boing");
          A.note(part === "hat" ? "G6" : "C6", { inst: "marimba", dur: 0.2, vol: 0.16, when: 0.18 });
          if (fx) fx.burst(stage, tx, ty, "spark", 5, ctx);
          break;
        }
        case "ears": {
          busyUntil = now + 900;
          face({ eyes: cfg.eyes === "sleepy" ? "big" : cfg.eyes, brows: "up" }, 900);
          addCls("g.ear", "perk");
          A.note("A6", { inst: "bell", dur: 0.2, vol: 0.16 });
          A.note("E6", { inst: "bell", dur: 0.3, vol: 0.14, when: 0.14 });
          note(tx + (tx < mGeom.x ? -30 : 30), ty - 30);
          break;
        }
        case "body": {
          busyUntil = now + 900;
          face({ mouth: "laugh", eyes: "happy" }, 900);
          addCls("g.all", "tickle");
          A.note("E5", { inst: "marimba", dur: 0.12, vol: 0.16 });
          A.note("G5", { inst: "marimba", dur: 0.12, vol: 0.16, when: 0.1 });
          A.note("E5", { inst: "marimba", dur: 0.12, vol: 0.16, when: 0.2 });
          KP.voice.say("히히, 간지러워!", { pitch: 1.35 });
          break;
        }
        default: {
          busyUntil = now + 600;
          face({ mouth: "laugh", eyes: "happy", brows: cfg.brows === "angry" ? "up" : cfg.brows }, 1300);
          U.replay(mirror.firstChild, "bounce");
          A.sfx("boing");
          A.note("G5", { inst: "marimba", dur: 0.2, vol: 0.18, when: 0.1 });
          A.note("C6", { inst: "marimba", dur: 0.3, vol: 0.18, when: 0.2 });
          KP.voice.say(U.pick(LINES), { pitch: 1.35 });
        }
      }
    }
    ctx.fast(mirror, (e) => {
      const t = e.target && e.target.closest ? e.target.closest("[data-p]") : null;
      react(t ? t.getAttribute("data-p") : "face", e);
    });
    // 눈 깜빡
    ctx.blink = () => {
      if (temp) return;
      if (!["dot", "big", "googly", "wink", "star", "heart"].includes(cfg.eyes)) return;
      const g = mirror.querySelector("g.eyes");
      if (!g) return;
      g.classList.add("blink");
      ctx.after(140, () => g.classList.remove("blink"));
    };

    /* ---------- 랜덤 (새 얼굴) ---------- */
    ctx.tap(bRand, () => {
      const r = (k) => U.pick(PARTS[k].list)[0];
      stopReact();
      cfg = Object.assign({}, cfg, {
        skin: U.rand(SKINS.length), hair: r("hair"), hairC: U.rand(HAIRC.length), eyes: r("eyes"), brows: r("brows"), nose: r("nose"), mouth: r("mouth"),
        hat: Math.random() < 0.7 ? r("hat") : "none", glasses: Math.random() < 0.45 ? r("glasses") : "none", shirt: U.rand(SHIRTS.length),
      });
      saveCfg();
      if (cur) setCur(null, null); // 앨범 친구를 고치던 중이면 → 새 얼굴로 (친구는 그대로 남음)
      for (let i = 0; i < 6; i++) A.note(A.SCALE[U.rand(8)], { inst: "marimba", dur: 0.12, vol: 0.18, when: i * 0.06 });
      A.sfx("boing");
      render();
      renderOpts();
      U.replay(mirror.firstChild, "bounce");
      U.replay(bRand, "wig");
      KP.voice.say(U.pick(["짜잔! 누구일까요?", "우와, 재미있는 얼굴!", "하하, 웃기다!"]));
    });

    /* ---------- 사진 줄 (폴라로이드) ---------- */
    function polEl(f, cls = "", noWho) {
      const p = U.el("div", "fc-pol " + cls, '<i class="pin"></i><div class="ph">' + faceSVG(f.cfg, { vb: POL_VB }) + "</div>" + (f.who !== "friend" && !noWho ? '<span class="who">' + KP.E(whoOf(f.who)[1]) + "</span>" : ""));
      p.dataset.id = f.id;
      return p;
    }
    let lineIds = "";
    function renderLine(newId) {
      if (!line.offsetParent) {
        lineIds = "";
        pols.innerHTML = "";
        return; // 사진 줄이 안 보이는 화면(폰)
      }
      const h = line.clientHeight, w = line.clientWidth;
      const pw = (h - 6) * 0.84 + 10;
      const n = Math.max(1, Math.floor((w - 20) / pw));
      const list = friends.slice(-n).reverse();
      const ids = list.map((f) => f.id + f.t + f.who).join(",") + "|" + n;
      if (ids === lineIds && !newId) return;
      lineIds = ids;
      pols.innerHTML = "";
      list.forEach((f, i) => {
        const p = polEl(f, f.id === newId ? "new" : "");
        p.style.setProperty("--rot", (i % 2 ? 3 : -3) + "deg");
        p.style.marginTop = 6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10) + "px";
        p.style.height = "calc(100% - " + (6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10)) + "px)";
        ctx.tap(p, () => loadFriend(f.id, p));
        pols.appendChild(p);
      });
      for (let i = list.length; i < Math.min(n, 3); i++) {
        const p = U.el("div", "fc-pol empty", '<div class="ph">' + KP.E("📸") + "</div>");
        p.style.setProperty("--rot", (i % 2 ? 3 : -3) + "deg");
        p.style.marginTop = 6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10) + "px";
        p.style.height = "calc(100% - " + (6 + Math.round(Math.sin(((i + 0.5) / n) * Math.PI) * 10)) + "px)";
        ctx.tap(p, () => {
          U.replay(bPhoto, "wig");
          KP.voice.say("찰칵!");
        });
        pols.appendChild(p);
      }
    }

    /* ---------- 친구 불러오기 (다시 꾸미기) ---------- */
    function loadFriend(id, el) {
      const f = friendOf(id);
      if (!f) return;
      stopReact();
      closeOv();
      cfg = Object.assign({}, f.cfg);
      KP.store.set("face:cfg", cfg);
      setCur(f.id);
      unsaved = false; // 그대로 찍으면 '벌써 찍었어요'
      if (el) U.replay(el, "pop");
      A.sfx("open");
      render();
      renderOpts();
      U.replay(mirror.firstChild, "bounce");
      KP.voice.say(f.who !== "friend" ? whoOf(f.who)[2] + "!" : "새 친구");
      ctx.after(900, () => KP.voice.say("얼굴을 꾸며 봐요!"));
    }
    function newFace(who) {
      stopReact();
      closeOv();
      cfg = Object.assign({}, DEF, { shirt: U.rand(SHIRTS.length) });
      KP.store.set("face:cfg", cfg);
      setCur(null, who || null);
      unsaved = true;
      A.sfx("pop");
      render();
      renderOpts();
      U.replay(mirror.firstChild, "bounce");
      KP.voice.say(who ? whoOf(who)[2] + "!" : "새 친구");
      ctx.after(900, () => KP.voice.say("얼굴을 꾸며 봐요!"));
    }

    /* ---------- 덮개 화면 ---------- */
    let ov = null;
    function closeOv() {
      if (ov) {
        ov.remove();
        ov = null;
      }
    }
    function openOv(cls) {
      closeOv();
      ov = U.el("div", "fc-ov " + cls);
      wrap.appendChild(ov);
      return ov;
    }
    /** 앨범: 가족 칸 + 친구들 + 새 얼굴·가족 사진·닫기 */
    function openAlbum() {
      stopReact();
      render();
      const o = openOv("fc-album");
      const fam = U.el("div", "fc-fam");
      FAM.forEach((k) => {
        const w = whoOf(k);
        const f = friends.filter((x) => x.who === k).pop();
        const slot = U.el("div", "fc-slot");
        const p = f ? polEl(f, "", true) : U.el("div", "fc-pol empty", '<div class="ph">' + KP.E("➕") + "</div>");
        p.style.setProperty("--rot", (FAM.indexOf(k) % 2 ? 2 : -2) + "deg");
        const tag = U.el("span", "tag", KP.E(w[1]));
        slot.append(p, tag);
        ctx.tap(slot, () => (f ? loadFriend(f.id, p) : newFace(k)));
        fam.appendChild(slot);
      });
      const grid = U.el("div", "fc-grid");
      const list = friends.slice().reverse();
      if (!list.length) grid.appendChild(U.el("div", "fc-empty", KP.E("📸") + " " + KP.E("🙂")));
      list.forEach((f, i) => {
        const p = polEl(f);
        p.style.setProperty("--rot", (i % 3) * 2 - 2 + "deg");
        ctx.tap(p, () => loadFriend(f.id, p));
        grid.appendChild(p);
      });
      const bar = U.el("div", "fc-obar");
      const bNew = U.btn(KP.E("➕") + '<span class="t"> 새 얼굴</span>', "btn");
      const famN = FAM.filter((k) => friends.some((x) => x.who === k)).length;
      const bFam = U.btn(KP.E("🏡") + '<span class="t"> 가족 사진</span>', "btn primary");
      const bClose = U.btn(KP.E("↩️"), "btn");
      ctx.tap(bNew, () => newFace(null));
      ctx.tap(bFam, () => familyPhoto(bFam));
      ctx.tap(bClose, () => {
        A.sfx("back");
        closeOv();
      });
      bar.append(bNew);
      if (famN >= 2) bar.append(bFam);
      bar.append(bClose);
      o.append(fam, grid, bar);
      A.sfx("open");
      KP.voice.say("내 사진");
    }
    ctx.tap(bAlbum, () => {
      U.replay(bAlbum, "pop");
      openAlbum();
    });

    /* ---------- 사진 찍기 → 내 작품 + 앨범(사진 줄) ---------- */
    let bgImg = null;
    const loadImg = (src) =>
      new Promise((res) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = src;
      });
    const svgImg = (svg) => loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
    async function getBg() {
      if (!bgImg) bgImg = await loadImg(BG);
      return bgImg;
    }
    /** 거울 속 얼굴 한 장 (폴라로이드 모양 JPEG 780×940) */
    async function toJpeg(c) {
      const [im, bg] = await Promise.all([svgImg(faceSVG(c, { vb: MIRROR_VB })), getBg()]);
      if (!im) return null;
      const Wd = 780, Ht = 940, P = 36, PW = Wd - P * 2, PH = PW; // 사진 칸(정사각)
      const cv = document.createElement("canvas");
      cv.width = Wd;
      cv.height = Ht;
      const x = cv.getContext("2d");
      x.fillStyle = "#fffdf7";
      x.fillRect(0, 0, Wd, Ht);
      x.save();
      x.beginPath();
      x.rect(P, P, PW, PH);
      x.clip();
      if (bg) {
        // 배경 그림에서 거울(전구 포함) 둘레를 정사각으로
        const s = MR * 2.36;
        x.drawImage(bg, MX - s / 2, MY0 - s / 2, s, s, P, P, PW, PH);
      } else {
        x.fillStyle = "#f1c8c0";
        x.fillRect(P, P, PW, PH);
      }
      const k = PW / (MR * 2.36), r = MR * k, cx = P + PW / 2, cy = P + PH / 2;
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.clip();
      const g = x.createRadialGradient(cx - r * 0.12, cy - r * 0.3, 0, cx, cy, r);
      g.addColorStop(0, "#fffdf8");
      g.addColorStop(0.46, "#fbefe6");
      g.addColorStop(1, "#f1d9cc");
      x.fillStyle = g;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
      x.drawImage(im, cx - r, cy - r, r * 2, r * 2);
      x.restore();
      // 아래 여백에 작은 하트 셋
      x.fillStyle = "#ff8fab";
      [-60, 0, 60].forEach((dx, i) => {
        const hx = Wd / 2 + dx, hy = P + PH + (Ht - P - PH) / 2, s = i === 1 ? 22 : 16;
        x.beginPath();
        x.moveTo(hx, hy + s * 0.9);
        x.bezierCurveTo(hx - s * 1.6, hy - s * 0.2, hx - s * 0.7, hy - s * 1.2, hx, hy - s * 0.35);
        x.bezierCurveTo(hx + s * 0.7, hy - s * 1.2, hx + s * 1.6, hy - s * 0.2, hx, hy + s * 0.9);
        x.fill();
      });
      try {
        return cv.toDataURL("image/jpeg", 0.85);
      } catch (e) {
        return null;
      }
    }
    /** 사진이 거울에서 사진 줄(또는 앨범 단추)로 날아가 걸림 */
    function flyTo(img, target, done) {
      const a = mirror.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const f = U.el("div", "fc-fly");
      const im = U.el("img");
      im.src = img;
      f.appendChild(im);
      const w = a.width * 0.7;
      Object.assign(f.style, { left: a.left + a.width / 2 - w / 2 + "px", top: a.top + a.height / 2 - w * 0.6 + "px", width: w + "px", height: w * 1.2 + "px" });
      document.body.appendChild(f);
      const sc = Math.max(0.08, Math.min(1, b.height / (w * 1.2)));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          f.style.transform = "translate(" + (b.left + b.width / 2 - (a.left + a.width / 2)) + "px," + (b.top + b.height / 2 - (a.top + a.height / 2 - w * 0.1)) + "px) scale(" + sc + ") rotate(8deg)";
          f.style.opacity = "0.7";
        })
      );
      setTimeout(() => {
        f.remove();
        if (done) done();
      }, 900);
    }
    /** 앨범에 넣기(새 친구) 또는 고치던 친구 바꾸기 → 친구 */
    function putFriend(c) {
      let f = cur && friendOf(cur);
      if (f) {
        f.cfg = Object.assign({}, c);
        f.t = Date.now();
        friends = friends.filter((x) => x !== f).concat(f);
      } else {
        f = { id: KP.newId(), who: whoOf(pendWho)[0], t: Date.now(), cfg: Object.assign({}, c) };
        friends.push(f);
        // 꽉 차면: 가족 칸의 맨 마지막 사람은 지키고, 가장 오래된 사람부터 내려감
        while (friends.length > MAXF) {
          const keep = new Set(FAM.map((k) => (friends.filter((x) => x.who === k).pop() || {}).id));
          const i = friends.findIndex((x) => !keep.has(x.id));
          friends.splice(i < 0 ? 0 : i, 1);
        }
      }
      saveFriends();
      setCur(f.id);
      return f;
    }
    ctx.tap(bPhoto, async () => {
      if (bPhoto.dataset.busy) return;
      if (!unsaved) {
        U.replay(bPhoto, "wig");
        KP.voice.say("이 얼굴은 벌써 찍었어요! 바꿔서 또 찍어 봐요.");
        return;
      }
      bPhoto.dataset.busy = "1";
      stopReact();
      render();
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      A.noise({ dur: 0.08, vol: 0.18, hp: 1200, when: 0.09 });
      U.replay(flash, "on");
      KP.voice.say("찰칵!");
      const shotCfg = Object.assign({}, cfg, { mouth: cfg.mouth === "sad" ? "smile" : cfg.mouth });
      const img = await toJpeg(shotCfg);
      if (!ctx._active) return;
      if (!img) {
        delete bPhoto.dataset.busy;
        KP.toast("사진을 만들지 못했어요");
        return;
      }
      const wasNew = !(cur && friendOf(cur)) && !pendWho;
      const f = putFriend(cfg);
      const ok = await KP.db.put("art", { id: KP.newId(), kind: "face", img, t: Date.now(), date: KP.gate.monthDay(), cfg: Object.assign({}, cfg), fid: f.id, who: f.who });
      if (!ctx._active) return;
      if (ok === false) {
        delete bPhoto.dataset.busy;
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
        return;
      }
      unsaved = false;
      A.sfx("sticker");
      const target = line.offsetParent ? line : bAlbum;
      flyTo(img, target, () => {
        if (!ctx._active) return;
        lineIds = "";
        renderLine(f.id);
        U.replay(bAlbum, "bump");
        A.note("C6", { inst: "bell", dur: 0.3, vol: 0.18 });
        if (wasNew) askWho(f, img);
        else finish();
      });
    });
    async function finish() {
      delete bPhoto.dataset.busy;
      KP.toast("🖼️ 내 작품에 저장했어요!");
      await ctx.wait(500);
      await ctx.win({ msg: "찰칵! 내 작품에 저장했어요!" });
    }
    /** 새 얼굴: 누구예요? (가족 칸 그림 고르기 — 아무거나 골라도 됨) */
    function askWho(f, img) {
      const o = openOv("fc-pick");
      const big = U.el("div", "fc-snap", '<img alt="" src="' + img + '"><i class="pin"></i>');
      const q = U.el("div", "q", KP.E("❓"));
      const whos = U.el("div", "fc-whos");
      WHO.forEach(([k, em, nm], i) => {
        const b = U.btn(KP.E(em), "btn");
        b.style.setProperty("--i", i);
        ctx.tap(b, () => {
          U.replay(b, "pop");
          f.who = k;
          saveFriends();
          renderBadge();
          lineIds = "";
          renderLine(f.id);
          A.sfx("good");
          KP.voice.say(k === "friend" ? "새 친구" : nm + "!");
          closeOv();
          finish();
        });
        whos.appendChild(b);
      });
      const side = U.el("div", "fc-side");
      side.append(q, whos);
      o.append(big, side);
      ctx.after(700, () => KP.voice.say("누구일까요?"));
      ctx.hint(() => (ov ? ov.querySelector(".fc-whos .btn") : null), "누구일까요?");
    }
    /** 가족 사진: 가족 칸 사람들을 사진 줄처럼 나란히 한 장 */
    async function familyPhoto(btn) {
      if (btn.dataset.busy) return;
      btn.dataset.busy = "1";
      const mem = FAM.map((k) => friends.filter((x) => x.who === k).pop()).filter(Boolean);
      A.noise({ dur: 0.05, vol: 0.25, hp: 2000 });
      KP.voice.say("찰칵!");
      const ims = await Promise.all(mem.map((f) => svgImg(faceSVG(f.cfg, { vb: POL_VB }))));
      const bg = await getBg();
      const Wd = 1400, Ht = 900, cv = document.createElement("canvas");
      cv.width = Wd;
      cv.height = Ht;
      const x = cv.getContext("2d");
      if (bg) {
        const kc = Math.max(Wd / IW, Ht / IH); // 꽉 채우기
        x.drawImage(bg, (Wd - IW * kc) / 2, (Ht - IH * kc) / 2, IW * kc, IH * kc);
      } else {
        x.fillStyle = "#f6d9d2";
        x.fillRect(0, 0, Wd, Ht);
      }
      x.fillStyle = "rgba(255,244,238,.55)";
      x.fillRect(0, 0, Wd, Ht);
      // 줄
      x.strokeStyle = "#c9955f";
      x.lineWidth = 6;
      x.beginPath();
      x.moveTo(0, 150);
      x.quadraticCurveTo(Wd / 2, 260, Wd, 150);
      x.stroke();
      const n = mem.length, pw = Math.min(300, (Wd - 80) / n - 24), ph = pw * 1.2;
      mem.forEach((f, i) => {
        const cx = Wd / 2 + (i - (n - 1) / 2) * (pw + 24), t = cx / Wd;
        const top = (1 - t) * (1 - t) * 150 + 2 * t * (1 - t) * 260 + t * t * 150 + 6; // 줄(2차 곡선) 위 그 자리에 집게
        x.save();
        x.translate(cx, top);
        x.rotate(((i % 2 ? 3 : -3) * Math.PI) / 180);
        x.shadowColor = "rgba(90,40,30,.3)";
        x.shadowBlur = 16;
        x.shadowOffsetY = 8;
        x.fillStyle = "#fffdf7";
        x.fillRect(-pw / 2, 0, pw, ph);
        x.shadowColor = "transparent";
        const m = pw * 0.07, s = pw - m * 2;
        const gr = x.createLinearGradient(0, m, 0, m + s);
        gr.addColorStop(0, "#cfe6d5");
        gr.addColorStop(1, "#b6d4c0");
        x.fillStyle = gr;
        x.fillRect(-pw / 2 + m, m, s, s);
        if (ims[i]) x.drawImage(ims[i], -pw / 2 + m, m, s, s);
        x.fillStyle = "#e57d99";
        x.fillRect(-9, -18, 18, 34);
        x.restore();
      });
      let img = null;
      try {
        img = cv.toDataURL("image/jpeg", 0.85);
      } catch (e) {}
      if (!ctx._active) return;
      const ok = img && (await KP.db.put("art", { id: KP.newId(), kind: "face", img, t: Date.now(), date: KP.gate.monthDay(), fam: mem.map((f) => f.id) }));
      delete btn.dataset.busy;
      if (!ctx._active) return;
      if (!img || ok === false) {
        KP.toast("저장하지 못했어요. 저장공간을 확인해 주세요");
        return;
      }
      A.sfx("sticker");
      closeOv();
      KP.toast("🖼️ 내 작품에 저장했어요!");
      await ctx.wait(400);
      await ctx.win({ msg: "찰칵! 내 작품에 저장했어요!" });
    }

    ctx.init = () => {
      stopReact();
      closeOv();
      friends = loadFriends();
      cfg = cleanCfg(KP.store.get("face:cfg", null));
      cur = KP.store.get("face:cur", null);
      if (typeof cur !== "string" || !friendOf(cur)) cur = null;
      pendWho = KP.store.get("face:who", null);
      if (cur || !FAM.includes(pendWho)) pendWho = null;
      // 고치던 친구를 그대로 다시 열었으면 '벌써 찍었어요' 상태
      const f = cur && friendOf(cur);
      unsaved = !(f && JSON.stringify(cleanCfg(f.cfg)) === JSON.stringify(cfg));
      delete bPhoto.dataset.busy;
      render();
      renderBadge();
      renderTabs();
      renderOpts();
      layout();
    };
  },
  start(ctx) {
    ctx.init();
    ctx.say("얼굴을 꾸며 봐요! 코, 볼, 입을 콕 눌러 봐요."); // 뒤 문장은 새 음성(tools/out/new-voice/face.txt)
    ctx.every(3600, () => ctx.blink());
    ctx.hint(() => ctx.body.querySelector(".fc-opt:not(.sel)"), "그림을 눌러서 바꿔 봐요!");
  },
});
