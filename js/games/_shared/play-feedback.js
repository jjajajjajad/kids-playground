/* =====================================================================
   놀이 반응 (공용) — 입력 직후 눌림·소리, 닿은 자리의 작은 반짝·하트, 짧은 마무리
   - 정해진 시간(눌림 80~120ms, 반응 300~600ms, 마무리 0.8~1.2초)에 맞춘 작은 연출 모음
   - 소리는 KP.audio, 말은 KP.voice — 놀이를 나가면 ctx 타이머와 함께 정리되도록 ctx 를 넘기면 ctx.after 사용
   KP.pfx.press(el) · KP.pfx.burst(host, x, y, kind, n, ctx) · KP.pfx.ring(host, x, y, color, ctx)
   KP.pfx.hearts(host, x, y, n, ctx) · KP.pfx.sound(kind) · KP.pfx.float(host, x, y, html, cls, ms, ctx)
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  KP.css(
    "playFx",
    `.pfxPress{animation:pfxPress .11s ease-out}
     @keyframes pfxPress{50%{transform:scale(.9)}}
     .pfxP{position:absolute;pointer-events:none;line-height:1;z-index:20;left:0;top:0;will-change:transform,opacity}
     .pfxP.heart{font-size:var(--s,30px);animation:pfxUp 1.1s ease-out forwards}
     .pfxP.spark{width:var(--s,16px);height:var(--s,16px);border-radius:50%;background:radial-gradient(circle,#fff 0 25%,rgba(255,236,150,.95) 40%,rgba(255,200,80,0) 70%);animation:pfxOut .6s ease-out forwards}
     .pfxP.cool{width:var(--s,14px);height:var(--s,14px);border-radius:50%;background:radial-gradient(circle,#fff 0 30%,rgba(170,225,255,.95) 45%,rgba(120,200,255,0) 72%);animation:pfxOut .8s ease-out forwards}
     .pfxP.dust{width:var(--s,12px);height:var(--s,12px);border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 6px rgba(255,255,255,.9);animation:pfxOut .7s ease-out forwards}
     @keyframes pfxUp{0%{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.3);opacity:0}15%{opacity:1;transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(1.1)}100%{transform:translate(calc(var(--x) + var(--dx,0px)),calc(var(--y) - 90px)) translate(-50%,-50%) scale(1);opacity:0}}
     @keyframes pfxOut{0%{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.4);opacity:1}100%{transform:translate(calc(var(--x) + var(--dx,0px)),calc(var(--y) + var(--dy,0px))) translate(-50%,-50%) scale(1);opacity:0}}
     .pfxRing{position:absolute;left:0;top:0;width:var(--s,70px);height:var(--s,70px);border-radius:50%;border:5px solid var(--c,#ffc531);pointer-events:none;z-index:19;animation:pfxRing .55s ease-out forwards}
     @keyframes pfxRing{from{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(.35);opacity:.95}to{transform:translate(var(--x),var(--y)) translate(-50%,-50%) scale(1.35);opacity:0}}
     .pfxF{position:absolute;left:0;top:0;pointer-events:none;z-index:21;transform:translate(var(--x),var(--y)) translate(-50%,-50%)}`
  );
  const later = (ctx, ms, fn) => (ctx ? ctx.after(ms, fn) : setTimeout(fn, ms));
  const at = (el, x, y) => {
    el.style.setProperty("--x", x + "px");
    el.style.setProperty("--y", y + "px");
  };
  const P = (KP.pfx = {
    /** 눌림 (80~120ms 살짝 작아짐) */
    press(el) {
      if (el) U.replay(el, "pfxPress");
    },
    /** 닿은 자리 작은 입자: kind = heart | spark | cool | dust */
    burst(host, x, y, kind = "spark", n = 6, ctx) {
      for (let i = 0; i < n; i++) {
        const e = U.el("span", "pfxP " + kind, kind === "heart" ? KP.E(i % 2 ? "💖" : "❤️") : "");
        at(e, x + U.randf(-8, 8), y + U.randf(-8, 8));
        const a = (i / n) * Math.PI * 2 + U.randf(-0.3, 0.3), r = kind === "heart" ? 0 : U.randf(26, 56);
        e.style.setProperty("--dx", (kind === "heart" ? U.randf(-30, 30) : Math.cos(a) * r) + "px");
        e.style.setProperty("--dy", Math.sin(a) * r - (kind === "cool" ? 0 : 10) + "px");
        e.style.animationDelay = i * (kind === "heart" ? 90 : 25) + "ms";
        host.appendChild(e);
        later(ctx, 1300 + i * 90, () => e.remove());
      }
    },
    hearts(host, x, y, n = 4, ctx) {
      P.burst(host, x, y, "heart", n, ctx);
    },
    /** 닿은 자리 동그라미 퍼짐 (어디에 닿았는지 보여 줌) */
    ring(host, x, y, color, ctx, size) {
      const e = U.el("span", "pfxRing");
      at(e, x, y);
      if (color) e.style.setProperty("--c", color);
      if (size) e.style.setProperty("--s", size + "px");
      host.appendChild(e);
      later(ctx, 650, () => e.remove());
      return e;
    },
    /** 잠깐 떠 있는 그림·글자 (html) */
    float(host, x, y, html, cls = "", ms = 1200, ctx) {
      const e = U.el("span", "pfxF " + cls, html);
      at(e, x, y);
      host.appendChild(e);
      if (ms) later(ctx, ms, () => e.remove());
      return e;
    },
    move(el, x, y) {
      at(el, x, y);
    },
    /** 짧은 접촉 소리 */
    sound(kind) {
      const A = KP.audio;
      switch (kind) {
        case "touch":
          return A.note(U.pick(["C5", "E5", "G5"]), { inst: "marimba", dur: 0.2, vol: 0.18 });
        case "soft":
          return A.tone(260, { to: 420, dur: 0.12, vol: 0.12, type: "sine" });
        case "beep":
          return A.note("A6", { inst: "square", dur: 0.08, vol: 0.08 });
        case "thump":
          return A.tone(90, { to: 60, dur: 0.12, vol: 0.3, type: "sine" });
        case "cool":
          return A.noise({ dur: 0.4, vol: 0.1, bp: 3000, bpTo: 1800, q: 1.5 });
        case "sip":
          return A.noise({ bp: 1200, bpTo: 600, q: 1, dur: 0.45, vol: 0.12 });
        case "squish":
          return A.tone(330, { to: 200, dur: 0.14, vol: 0.14, type: "triangle" });
        default:
          return A.sfx(kind);
      }
    },
  });
})();
