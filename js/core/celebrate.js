/* =====================================================================
   축하 연출 · 스티커 보상
   - KP.celebrate(o) : 색종이 + 칭찬 + 징글 (+ 단계 상승, + 스티커)
   - KP.stickers     : 스티커 모으기 (영구 저장)
   성공 3번마다, 그리고 단계가 오를 때마다 새 스티커 1장.
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  /* ---------------- 스티커 목록 ---------------- */
  const STICKERS = [
    ["🦖", "티라노사우루스"], ["🦕", "브라키오사우루스"], ["🐉", "용"], ["🦁", "사자"], ["🐯", "호랑이"], ["🐻", "곰"],
    ["🐼", "판다"], ["🐨", "코알라"], ["🐰", "토끼"], ["🦊", "여우"], ["🐶", "강아지"], ["🐱", "고양이"],
    ["🐵", "원숭이"], ["🐘", "코끼리"], ["🦒", "기린"], ["🦓", "얼룩말"], ["🦛", "하마"], ["🐊", "악어"],
    ["🐢", "거북이"], ["🐸", "개구리"], ["🐧", "펭귄"], ["🦉", "부엉이"], ["🦜", "앵무새"], ["🦩", "홍학"],
    ["🐳", "고래"], ["🐬", "돌고래"], ["🦈", "상어"], ["🐙", "문어"], ["🦀", "꽃게"], ["🐠", "열대어"],
    ["🦋", "나비"], ["🐞", "무당벌레"], ["🐝", "꿀벌"], ["🐌", "달팽이"], ["🦄", "유니콘"], ["🐿️", "다람쥐"],
    ["🚗", "자동차"], ["🚌", "버스"], ["🚒", "소방차"], ["🚓", "경찰차"], ["🚑", "구급차"], ["🚜", "트랙터"],
    ["🚂", "기차"], ["✈️", "비행기"], ["🚁", "헬리콥터"], ["🚀", "로켓"], ["⛵", "배"], ["🚲", "자전거"],
    ["🛸", "비행접시"], ["🏎️", "경주용 자동차"], ["🚛", "트럭"], ["🚧", "공사장"], ["⛽", "주유소"], ["🗽", "자유의 여신상"],
    ["🍎", "사과"], ["🍓", "딸기"], ["🍌", "바나나"], ["🍉", "수박"], ["🍇", "포도"], ["🍑", "복숭아"],
    ["🍦", "아이스크림"], ["🍩", "도넛"], ["🍪", "쿠키"], ["🧁", "컵케이크"], ["🍭", "막대사탕"], ["🍰", "케이크"],
    ["🌈", "무지개"], ["⭐", "별"], ["🌙", "달"], ["☀️", "해님"], ["⛄", "눈사람"], ["🌻", "해바라기"],
    ["🎈", "풍선"], ["🎁", "선물"], ["⚽", "축구공"], ["🏆", "트로피"], ["👑", "왕관"], ["💎", "보석"],
  ];
  const stickers = (KP.stickers = {
    LIST: STICKERS,
    have: () => KP.store.get("stickers", {}),
    count: () => Object.keys(KP.store.get("stickers", {})).length,
    /** 새 스티커 하나 주기 → [이모지, 이름] */
    award() {
      const have = stickers.have();
      const left = STICKERS.filter(([e]) => !have[e]);
      const s = left.length ? U.pick(left) : U.pick(STICKERS);
      have[s[0]] = (have[s[0]] || 0) + 1;
      KP.store.set("stickers", have);
      KP.store.set("lastSticker", s[0]);
      return s;
    },
    nameOf: (e) => (STICKERS.find((s) => s[0] === e) || [e, ""])[1],
  });

  /* ---------------- 색종이 ---------------- */
  let cv = null,
    cx = null,
    parts = [],
    running = false;
  const COLORS = ["#ff5b6e", "#ffb020", "#ffe14d", "#3fd17a", "#33b7ff", "#8a63ee", "#ff7ac6"];
  function ensureCanvas() {
    if (cv) return;
    cv = U.el("canvas", "confetti");
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    const fit = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * d;
      cv.height = innerHeight * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
    };
    fit();
    addEventListener("resize", fit);
  }
  KP.confetti = function (n = 140, x = innerWidth / 2, y = innerHeight * 0.38) {
    ensureCanvas();
    if (!cx) return;
    for (let i = 0; i < n; i++) {
      const a = U.randf(0, Math.PI * 2),
        sp = U.randf(4, 14);
      parts.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - U.randf(3, 8),
        r: U.randf(5, 10),
        rot: U.randf(0, 6),
        vr: U.randf(-0.3, 0.3),
        c: U.pick(COLORS),
        s: U.rand(3),
        life: 1,
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };
  function tick() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.006;
      cx.save();
      cx.globalAlpha = Math.min(1, p.life * 2);
      cx.translate(p.x, p.y);
      cx.rotate(p.rot);
      cx.fillStyle = p.c;
      if (p.s === 0) cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      else if (p.s === 1) {
        cx.beginPath();
        cx.arc(0, 0, p.r / 2.4, 0, Math.PI * 2);
        cx.fill();
      } else {
        cx.beginPath();
        for (let i = 0; i < 10; i++) {
          const rr = i % 2 ? p.r / 4 : p.r / 1.8,
            aa = (i * Math.PI) / 5;
          cx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
        }
        cx.fill();
      }
      cx.restore();
    }
    if (parts.length) requestAnimationFrame(tick);
    else {
      running = false;
      cx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  /* ---------------- 축하 ---------------- */
  const PRAISE = [
    ["🎉", "잘했어요!"], ["🌟", "최고예요!"], ["👏", "멋져요!"], ["💯", "딩동댕!"],
    ["🏆", "우와, 대단해!"], ["😎", "멋진 형아!"], ["💪", "정말 잘했어!"], ["🥳", "와아, 성공!"],
  ];
  let layer = null;
  function ensureLayer() {
    if (layer) return;
    layer = U.el("div", "celebrate");
    document.body.appendChild(layer);
  }
  let winCount = KP.store.get("winCount", 0);

  /**
   * @param {{msg?:string, big?:boolean, levelUp?:boolean, ctx?:object, quiet?:boolean, sticker?:boolean}} o
   */
  KP.celebrate = function (o = {}) {
    ensureLayer();
    KP.celebrating = true;
    KP.hideHint && KP.hideHint();
    const [em, word] = U.pick(PRAISE);
    const msg = o.msg || word;
    layer.innerHTML =
      '<div class="cBox"><div class="cEm">' + KP.E(em) + '</div><div class="cTxt">' + KP.E(msg) + "</div></div>";
    layer.className = "celebrate show" + (o.big ? " big" : "");
    KP.confetti(o.big ? 220 : 120);
    if (o.big) setTimeout(() => KP.confetti(140, innerWidth * 0.25, innerHeight * 0.3), 350);
    if (o.big) setTimeout(() => KP.confetti(140, innerWidth * 0.75, innerHeight * 0.3), 650);
    KP.audio.jingle();
    if (!o.quiet) KP.voice.say(msg.replace(/\p{Extended_Pictographic}|️/gu, ""));
    const base = o.big ? 2100 : 1350;

    winCount++;
    KP.store.set("winCount", winCount);
    const giveSticker = o.sticker !== false && (o.levelUp || winCount % 3 === 0);

    return new Promise((res) => {
      let t = base;
      setTimeout(() => layer.classList.remove("show"), base - 150);
      if (o.levelUp) {
        setTimeout(() => {
          const lv = o.ctx ? o.ctx.level : 2;
          layer.innerHTML =
            '<div class="cBox lvl"><div class="cEm">' + KP.E("🦸") + '</div><div class="cTxt">한 단계 올라갔어요!</div><div class="cSub">' +
            KP.E("⭐") + " " + lv + "단계 형아 도전!</div></div>";
          layer.className = "celebrate show big";
          KP.audio.sfx("levelup");
          KP.confetti(160);
          KP.voice.say("한 단계 올라갔어요! 이제 " + lv + "단계! 형아 최고!");
        }, base);
        t += 2300;
        setTimeout(() => layer.classList.remove("show"), t - 150);
      }
      if (giveSticker) {
        setTimeout(() => showSticker(o.ctx, () => finish()), t);
      } else setTimeout(finish, t);
      function finish() {
        layer.className = "celebrate";
        KP.celebrating = false;
        res();
      }
    });
  };

  function showSticker(ctx, done) {
    const [e, name] = stickers.award();
    layer.innerHTML =
      '<div class="cBox sticker"><div class="rays"></div><div class="cEm cStk">' + KP.E(e) +
      '</div><div class="cTxt">스티커 받았어요!</div><div class="cSub">' + name + "</div></div>";
    layer.className = "celebrate show sticker";
    KP.audio.sfx("sticker");
    KP.voice.say("스티커 받았어요! " + name + "!");
    setTimeout(() => {
      // 스티커가 스티커북 아이콘으로 날아가기
      const src = layer.querySelector(".cStk img, .cStk span");
      const target = ctx ? ctx.stickerPill : document.querySelector("#home .stickerBtn");
      if (src && target) {
        const a = src.getBoundingClientRect(),
          b = target.getBoundingClientRect();
        const fly = U.el("div", "flySticker", KP.E(e));
        Object.assign(fly.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
        document.body.appendChild(fly);
        layer.classList.remove("show");
        requestAnimationFrame(() => {
          fly.style.transform =
            "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.2)";
          fly.style.opacity = "0.4";
        });
        setTimeout(() => {
          fly.remove();
          if (ctx) {
            ctx._updateLevel();
            U.replay(target, "bump");
          }
          KP.audio.sfx("snap");
          done();
        }, 750);
      } else {
        layer.classList.remove("show");
        done();
      }
    }, 1900);
  }
})(window.KP);
