/* 숨은 그림 찾기 — 덮개를 손가락으로 문질러 숨은 친구 찾기 (아이 최애)
   - 친구는 매번 화면 이곳저곳 랜덤 위치에 숨음
   - 친구 모양(그림의 실제 윤곽 / 사진 네모) 영역을 93% 이상 지우면 성공 → 남은 덮개는 스르륵 사라짐
   - 판마다 덮개 테마: 모래·눈·뿌연 유리·진흙·낙엽·거품 (색·질감·문지르는 소리가 다름)
   - 📷 우리 캐릭터 넣기: 사진 여러 장을 한꺼번에 등록 → KP.db "photos" kind "wipe" 로 영구 저장
     (등록 직후엔 그 사진부터 숨고, 이후 기본 친구와 섞여 나옴)
   - 썸네일 줄: 개수·저장 상태 표시, 누르면 바로 그 친구가 숨음, ✖ 꾹 누르면 삭제
   - 예전 버전 localStorage "kidsWipePhotos" 가 있으면 db 로 옮기고 지움
   - 단계: 1 큰 친구 → 3 작은 친구 */
"use strict";
KP.game({
  id: "wipe",
  icon: "🧽",
  name: "숨은 그림 찾기",
  cat: "make",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u,
      A = KP.audio;
    KP.css("wipe", `
      .wp-top{display:flex;align-items:center;gap:10px;padding:0 12px 8px;flex:0 0 auto;min-width:0}
      .wp-add{flex:0 0 auto;display:flex;align-items:center;gap:6px;font-size:clamp(17px,2.3vw,22px);background:var(--cat);color:#fff;border-radius:20px;padding:8px 14px;
        box-shadow:0 5px 0 color-mix(in srgb,var(--cat) 60%,#000);min-height:64px}
      .wp-add .e{font-size:1.6em}
      .wp-add:active{transform:translateY(3px)}
      .wp-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
      .wp-info{font-size:clamp(13px,1.8vw,16px);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:2px}
      .wp-info b{font-weight:400;color:var(--grass)}
      .wp-info b.bad{color:#d23b3b}
      .wp-strip{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:8px 4px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;min-height:66px;align-items:center}
      .wp-strip::-webkit-scrollbar{display:none}
      .wp-th{position:relative;flex:0 0 auto;width:clamp(52px,6.4vw,62px);height:clamp(52px,6.4vw,62px);border-radius:14px;background:#fff;padding:3px;box-shadow:0 4px 0 rgba(47,58,102,.15)}
      .wp-th img{width:100%;height:100%;object-fit:cover;border-radius:11px;display:block;pointer-events:none}
      .wp-th.now{box-shadow:0 0 0 4px var(--sun),0 4px 0 rgba(47,58,102,.15)}
      .wp-th:active{transform:scale(.94)}
      .wp-del{position:absolute;top:-9px;right:-9px;width:28px;height:28px;border-radius:50%;background:#ff7b54;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.2);z-index:1}
      .wp-del.holding::before{inset:-4px;border-radius:50%}
      .wp-empty{font-size:clamp(14px,1.9vw,17px);color:var(--ink2);white-space:nowrap}
      .wp-new{flex:0 0 auto;width:64px;height:64px;border-radius:20px;background:#fff;box-shadow:var(--shadow);font-size:34px;display:flex;align-items:center;justify-content:center}
      .wp-new:active{transform:translateY(3px)}
      .wp-board{background:#fff}
      .wp-scene{position:absolute;inset:0}
      .wp-char{position:absolute;display:flex;align-items:center;justify-content:center;line-height:1;pointer-events:none}
      .wp-char .e{width:100%;height:100%;filter:drop-shadow(0 6px 4px rgba(0,0,0,.18))}
      .wp-char img.ph{width:100%;height:100%;object-fit:cover;border-radius:20%;border:5px solid #fff;box-shadow:0 8px 16px rgba(0,0,0,.25)}
      .wp-char.found{animation:wpFound 1.1s cubic-bezier(.3,1.6,.5,1) 2}
      @keyframes wpFound{0%{transform:scale(1)}25%{transform:translateY(-18%) scale(1.18) rotate(-6deg)}50%{transform:scale(.94,1.06)}75%{transform:translateY(-8%) scale(1.1) rotate(5deg)}100%{transform:scale(1)}}
      .wp-name{position:absolute;left:50%;top:100%;transform:translate(-50%,6px);background:#fff;border-radius:999px;padding:4px 16px;font-size:clamp(22px,3.4vw,34px);white-space:nowrap;box-shadow:var(--shadow);animation:popIn .4s cubic-bezier(.2,1.5,.4,1)}
      .wp-name.up{top:auto;bottom:100%;transform:translate(-50%,-6px)}
      .wp-cover{transition:none}
      .wp-cover.gone{transition:opacity 1.1s ease;opacity:0}
      .wp-fx{pointer-events:none}
      .wp-spot{position:absolute;pointer-events:none;border-radius:50%}
      .wp-sponge{position:absolute;font-size:clamp(54px,8vw,80px);line-height:1;pointer-events:none;opacity:0;transition:opacity .2s;z-index:3;transform:translate(-30%,-75%) rotate(-12deg)}
      .wp-sponge.on{opacity:1}
      @media (max-width:600px){ .wp-add span{display:none} .wp-add{padding:8px 12px} .wp-new{width:58px;height:58px;font-size:30px} }
    `);

    /* ---------- 기본 친구들 ---------- */
    const FRIENDS = [
      ["🦖", "공룡"], ["🚂", "기차"], ["🐳", "고래"], ["🦒", "기린"], ["🐘", "코끼리"], ["🚒", "소방차"], ["🦁", "사자"], ["🐧", "펭귄"],
      ["🚀", "로켓"], ["🐶", "강아지"], ["🦄", "유니콘"], ["🐙", "문어"], ["🚜", "트랙터"], ["🐢", "거북이"], ["🦋", "나비"], ["🐼", "판다"],
      ["🚓", "경찰차"], ["🐰", "토끼"], ["🦕", "목 긴 공룡"], ["🐬", "돌고래"], ["🚁", "헬리콥터"], ["🐸", "개구리"], ["🍉", "수박"], ["⛄", "눈사람"],
    ];
    KP.loadE(FRIENDS.map((f) => f[0]).concat(["🐚", "⭐", "❄️", "🐾", "🍂", "🍁"]));

    /* ---------- 덮개 테마 ---------- */
    const THEMES = [
      {
        id: "sand", name: "모래", scene: "linear-gradient(#8fd3ff 0 30%,#5bbbe9 30% 44%,#f7e0a8 44%)", fx: ["#fff3c4", "#ffd98a", "#ffffff"],
        say: "모래 속에 누가 숨었을까요? 문질문질 털어 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#e6c486";
          g.fillRect(0, 0, W, H);
          const cs = ["#d4ab66", "#f3dcaa", "#c79a55", "#fff0cc", "#e0b878"];
          for (let i = 0; i < (W * H) / 26; i++) {
            g.fillStyle = cs[(r() * cs.length) | 0];
            const s = 0.7 + r() * 1.8;
            g.fillRect(r() * W, r() * H, s, s);
          }
          for (let i = 0; i < 8; i++) {
            g.globalAlpha = 0.18;
            g.strokeStyle = "#a77d3d";
            g.lineWidth = 3;
            g.beginPath();
            const y = r() * H;
            g.moveTo(0, y);
            for (let x = 0; x <= W; x += 30) g.lineTo(x, y + Math.sin(x / 60 + i) * 10);
            g.stroke();
          }
          g.globalAlpha = 0.9;
          for (let i = 0; i < 5; i++) KP.drawE(g, r() < 0.6 ? "🐚" : "⭐", r() * W, r() * H, 34 + r() * 20, r() * 6);
          g.globalAlpha = 1;
        },
        snd: () => A.noise({ dur: 0.07, vol: 0.07, bp: 3800 + Math.random() * 800, q: 0.6 }),
      },
      {
        id: "snow", name: "눈", scene: "linear-gradient(#b9dcff,#eef7ff 62%,#ffffff 62%)", fx: ["#ffffff", "#d6ecff", "#eaf6ff"],
        say: "하얀 눈 밑에 누가 있을까요? 쓱쓱 치워 봐요!",
        draw(g, W, H, r) {
          const gr = g.createLinearGradient(0, 0, 0, H);
          gr.addColorStop(0, "#fbfdff");
          gr.addColorStop(1, "#dce9f8");
          g.fillStyle = gr;
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < 26; i++) {
            const x = r() * W,
              y = r() * H,
              rr = 40 + r() * 120;
            const rg = g.createRadialGradient(x, y, 0, x, y, rr);
            rg.addColorStop(0, "rgba(160,190,230,.22)");
            rg.addColorStop(1, "rgba(160,190,230,0)");
            g.fillStyle = rg;
            g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
          }
          g.fillStyle = "#fff";
          for (let i = 0; i < (W * H) / 900; i++) {
            g.globalAlpha = 0.5 + r() * 0.5;
            g.beginPath();
            g.arc(r() * W, r() * H, 0.8 + r() * 2.2, 0, 6.28);
            g.fill();
          }
          g.globalAlpha = 0.75;
          for (let i = 0; i < 6; i++) KP.drawE(g, "❄️", r() * W, r() * H, 26 + r() * 22, r() * 6);
          g.globalAlpha = 1;
        },
        snd: () => {
          A.noise({ dur: 0.08, vol: 0.08, lp: 2200, hp: 350 });
          if (Math.random() < 0.3) A.noise({ dur: 0.03, vol: 0.05, hp: 2500, when: 0.04 });
        },
      },
      {
        id: "fog", name: "뿌연 유리", scene: "linear-gradient(#a8dbff,#e8f6ff 60%,#9ed98a 60%)", fx: ["#ffffff", "#e6f3ff", "#c9e6ff"],
        say: "뿌연 유리창이에요. 뽀득뽀득 닦아 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#c3d1df";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < 40; i++) {
            const x = r() * W,
              y = r() * H,
              rr = 50 + r() * 140;
            const rg = g.createRadialGradient(x, y, 0, x, y, rr);
            rg.addColorStop(0, "rgba(255,255,255,.35)");
            rg.addColorStop(1, "rgba(255,255,255,0)");
            g.fillStyle = rg;
            g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
          }
          for (let i = 0; i < (W * H) / 2500; i++) {
            const x = r() * W,
              y = r() * H,
              s = 1.5 + r() * 4.5;
            g.fillStyle = "rgba(120,140,165,.35)";
            g.beginPath();
            g.arc(x, y, s, 0, 6.28);
            g.fill();
            g.fillStyle = "rgba(255,255,255,.8)";
            g.beginPath();
            g.arc(x - s * 0.3, y - s * 0.3, s * 0.35, 0, 6.28);
            g.fill();
          }
        },
        snd: () => A.tone(1000 + Math.random() * 500, { to: 1500 + Math.random() * 600, dur: 0.07, vol: 0.03, type: "sine" }),
      },
      {
        id: "mud", name: "진흙", scene: "linear-gradient(#a6dcff 0 38%,#9bd67a 38%)", fx: ["#a0703f", "#6b4423", "#c48a52"],
        say: "진흙 속에 누가 숨었을까요? 철벅철벅 닦아 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#86562f";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < 70; i++) {
            const x = r() * W,
              y = r() * H,
              rr = 20 + r() * 70;
            g.fillStyle = r() < 0.5 ? "rgba(98,60,30,.55)" : "rgba(170,115,66,.45)";
            g.beginPath();
            g.ellipse(x, y, rr, rr * (0.5 + r() * 0.4), r() * 3, 0, 6.28);
            g.fill();
          }
          for (let i = 0; i < 26; i++) {
            g.fillStyle = "rgba(255,240,220,.25)";
            g.beginPath();
            g.ellipse(r() * W, r() * H, 6 + r() * 12, 3 + r() * 5, r() * 3, 0, 6.28);
            g.fill();
          }
          g.globalAlpha = 0.55;
          for (let i = 0; i < 5; i++) KP.drawE(g, "🐾", r() * W, r() * H, 34 + r() * 16, r() * 6);
          g.globalAlpha = 1;
        },
        snd: () => A.noise({ dur: 0.12, vol: 0.09, bp: 240 + Math.random() * 80, bpTo: 520, q: 2.5 }),
      },
      {
        id: "leaf", name: "낙엽", scene: "linear-gradient(#ffe7a8,#fff6dc 52%,#c3e39a 52%)", fx: ["#ffb347", "#e2553a", "#ffd166"],
        say: "낙엽 밑에 누가 숨었을까요? 바스락바스락 치워 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#c97a33";
          g.fillRect(0, 0, W, H);
          const sz = Math.max(46, Math.min(W, H) * 0.12);
          const n = Math.ceil(((W * H) / (sz * sz)) * 2.6);
          for (let i = 0; i < n; i++) KP.drawE(g, r() < 0.55 ? "🍂" : "🍁", r() * (W + sz) - sz / 2, r() * (H + sz) - sz / 2, sz * (0.8 + r() * 0.5), r() * 6.28);
        },
        snd: () => A.noise({ dur: 0.09, vol: 0.07, hp: 2800 + Math.random() * 1500 }),
      },
      {
        id: "foam", name: "거품", scene: "linear-gradient(#bfe6ff,#e9f8ff)", fx: ["#ffffff", "#bfe6ff", "#ffd6f5"],
        say: "보글보글 거품 속에 누가 있을까요? 문질러 봐요!",
        draw(g, W, H, r) {
          g.fillStyle = "#eef8ff";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < (W * H) / 1400; i++) {
            const x = r() * W,
              y = r() * H,
              s = 6 + r() * 26;
            g.fillStyle = "rgba(255,255,255,.95)";
            g.strokeStyle = "rgba(140,190,235,.55)";
            g.lineWidth = 1.5;
            g.beginPath();
            g.arc(x, y, s, 0, 6.28);
            g.fill();
            g.stroke();
            g.fillStyle = "rgba(255,190,240,.35)";
            g.beginPath();
            g.arc(x + s * 0.25, y + s * 0.3, s * 0.35, 0, 6.28);
            g.fill();
            g.fillStyle = "#fff";
            g.beginPath();
            g.arc(x - s * 0.35, y - s * 0.35, s * 0.18, 0, 6.28);
            g.fill();
          }
        },
        snd: () => A.tone(500 + Math.random() * 400, { to: 1300, dur: 0.08, vol: 0.06 }),
      },
    ];

    /* ---------- 화면 ---------- */
    const top = U.el("div", "wp-top");
    const bAdd = U.btn(KP.E("📷") + "<span>우리 캐릭터 넣기</span>", "wp-add");
    const mid = U.el("div", "wp-mid");
    const info = U.el("div", "wp-info");
    const strip = U.el("div", "wp-strip");
    mid.append(info, strip);
    const bNew = U.btn(KP.E("🔄"), "wp-new");
    top.append(bAdd, mid, bNew);
    const board = U.el("div", "board wp-board");
    const scene = U.el("div", "wp-scene");
    const charEl = U.el("div", "wp-char");
    const cover = U.el("canvas", "wp-cover");
    const fx = U.el("canvas", "wp-fx");
    const sponge = U.el("div", "wp-sponge", KP.E("🧽"));
    const spot = U.el("div", "wp-spot"); // 힌트 손가락이 가리킬 자리(덮개 위, 투명)
    board.append(scene, charEl, cover, fx, spot, sponge);
    ctx.body.append(top, board);
    const cg = cover.getContext("2d");
    const fg = fx.getContext("2d");

    /* ---------- 사진 (영구 저장) ---------- */
    let photos = [],
      queue = [],
      saveBad = false,
      loaded = false;
    const hash = (s) => {
      let h = 0;
      for (let i = 0; i < s.length; i += 7) h = (h * 31 + s.charCodeAt(i)) | 0;
      return (h >>> 0).toString(36);
    };
    async function migrate() {
      let raw = null;
      try {
        raw = localStorage.getItem("kidsWipePhotos");
      } catch (e) {}
      if (!raw) return;
      let arr = null;
      try {
        arr = JSON.parse(raw);
      } catch (e) {}
      let ok = true;
      if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
          const url = arr[i];
          if (typeof url !== "string" || !url.startsWith("data:image")) continue;
          const r = await KP.db.put("photos", { id: "wipe-old-" + i + "-" + hash(url), kind: "wipe", img: url, t: Date.now() - (arr.length - i) * 1000 });
          if (!r) ok = false;
        }
      }
      if (ok) {
        try {
          localStorage.removeItem("kidsWipePhotos");
        } catch (e) {}
      }
    }
    async function loadPhotos() {
      await migrate();
      photos = (await KP.db.all("photos")).filter((p) => p.kind === "wipe" && p.img);
      loaded = true;
      renderStrip();
    }
    ctx.loadPhotos = loadPhotos;
    function renderStrip() {
      strip.innerHTML = "";
      if (!photos.length) {
        info.innerHTML = "사진을 넣으면 우리 캐릭터가 숨어요";
        strip.appendChild(U.el("div", "wp-empty", KP.E("👈") + " 여러 장 한꺼번에 넣을 수 있어요"));
        return;
      }
      info.innerHTML =
        "우리 캐릭터 " + photos.length + "개 · " + (saveBad ? '<b class="bad">저장 안 됨(저장공간 부족)</b>' : "<b>" + KP.E("✅") + " 이 기기에 저장됨</b>") + " · ✖ 꾹 누르면 삭제";
      photos.forEach((p) => {
        const t = U.btn('<img src="' + p.img + '" alt="">', "wp-th" + (cur && cur.photo && cur.photo.id === p.id ? " now" : ""));
        t.dataset.id = p.id;
        const del = U.el("span", "wp-del", "✖");
        t.appendChild(del);
        ctx.tap(t, (e) => {
          if (e.target === del) return;
          A.sfx("select");
          U.replay(t, "jump");
          newRound({ photo: p });
        });
        del.addEventListener("click", (e) => e.stopPropagation());
        KP.hold(
          del,
          800,
          async () => {
            await KP.db.del("photos", p.id);
            photos = photos.filter((x) => x.id !== p.id);
            queue = queue.filter((id) => id !== p.id);
            KP.toast("사진을 지웠어요");
            A.sfx("whoosh");
            renderStrip();
          },
          () => KP.toast("꾹 누르고 있으면 지워져요")
        );
        strip.appendChild(t);
      });
    }
    ctx.tap(bAdd, async () => {
      A.sfx("open");
      U.replay(bAdd, "pop");
      const urls = await KP.pickPhotos(true, 600);
      if (!urls || !urls.length) return;
      const added = [];
      saveBad = false;
      for (let i = 0; i < urls.length; i++) {
        const p = { id: "wipe-" + KP.newId(), kind: "wipe", img: urls[i], t: Date.now() + i };
        const ok = await KP.db.put("photos", p);
        if (!ok) saveBad = true;
        photos.push(p);
        added.push(p.id);
      }
      queue = added.concat(queue);
      renderStrip();
      strip.scrollLeft = strip.scrollWidth;
      if (!ctx._active) return;
      A.sfx("sticker");
      KP.voice.say("우리 캐릭터 " + urls.length + "개가 숨을 준비를 했어요! 찾아볼까요?");
      ctx.after(1200, () => newRound());
    });
    ctx.tap(bNew, () => {
      A.sfx("whoosh");
      U.replay(bNew, "wig");
      newRound();
    });

    /* ---------- 판 ---------- */
    let W = 0,
      H = 0,
      D = 1,
      cur = null,
      lastKey = "",
      lastTheme = "",
      lastPos = null,
      samples = [],
      cleared = 0,
      done = false,
      theme = THEMES[0],
      R = 40,
      said = 0,
      busy = false;
    function fit() {
      const r = board.getBoundingClientRect();
      W = r.width;
      H = r.height;
      D = Math.min(window.devicePixelRatio || 1, 2);
      [cover, fx].forEach((c) => {
        c.width = Math.round(W * D);
        c.height = Math.round(H * D);
      });
      cg.setTransform(D, 0, 0, D, 0, 0);
      fg.setTransform(D, 0, 0, D, 0, 0);
    }
    function choose(force) {
      if (force) return force;
      while (queue.length) {
        const id = queue.shift();
        const p = photos.find((x) => x.id === id);
        if (p) return { photo: p };
      }
      if (photos.length && Math.random() < 0.5) {
        const pool = photos.length > 1 ? photos.filter((p) => "p" + p.id !== lastKey) : photos;
        return { photo: U.pick(pool) };
      }
      const pool = FRIENDS.filter((f) => "e" + f[0] !== lastKey);
      const f = U.pick(pool);
      return { em: f[0], name: f[1] };
    }
    async function newRound(force) {
      if (!ctx._active) return;
      busy = false;
      done = false;
      said = 0;
      cleared = 0;
      cur = choose(force);
      lastKey = cur.photo ? "p" + cur.photo.id : "e" + cur.em;
      const themes = THEMES.filter((t) => t.id !== lastTheme);
      theme = U.pick(themes);
      lastTheme = theme.id;
      fit();
      // 크기·위치
      const lv = ctx.level;
      const S = Math.max(84, Math.min(W, H) * [0.46, 0.34, 0.25][lv - 1]);
      R = Math.max(24, Math.min(W, H) * [0.085, 0.075, 0.066][lv - 1]);
      const m = 12;
      let x = 0,
        y = 0;
      for (let k = 0; k < 14; k++) {
        x = m + Math.random() * Math.max(1, W - S - 2 * m);
        y = m + Math.random() * Math.max(1, H - S - 2 * m);
        if (!lastPos || Math.hypot(x - lastPos[0], y - lastPos[1]) > Math.min(W, H) * 0.3) break;
      }
      lastPos = [x, y];
      Object.assign(charEl.style, { left: x + "px", top: y + "px", width: S + "px", height: S + "px", fontSize: S + "px" });
      Object.assign(spot.style, { left: x + S * 0.2 + "px", top: y + S * 0.2 + "px", width: S * 0.6 + "px", height: S * 0.6 + "px" });
      charEl.classList.remove("found");
      charEl.innerHTML = cur.photo ? '<img class="ph" src="' + cur.photo.img + '" alt="">' : KP.E(cur.em);
      scene.style.background = theme.scene;
      U.$$(".wp-th", strip).forEach((t) => t.classList.toggle("now", !!(cur.photo && t.dataset.id === cur.photo.id)));
      // 덮개
      cover.classList.remove("gone");
      await KP.loadE(cur.em ? [cur.em] : []);
      if (!ctx._active) return;
      const seed = (Math.random() * 1e9) | 0;
      let a = seed;
      const r = () => {
        a = (a * 1664525 + 1013904223) | 0;
        return (a >>> 0) / 4294967296;
      };
      cg.globalCompositeOperation = "source-over";
      cg.clearRect(0, 0, W, H);
      theme.draw(cg, W, H, r);
      // 친구 영역 표본점 (그림이면 실제 윤곽, 사진이면 둥근 네모)
      samples = makeSamples(x, y, S);
      ctx.say(cur.photo && Math.random() < 0.5 ? "우리 캐릭터가 숨었어요! 어디 있을까요?" : theme.say);
      ctx.hint(() => spot, "여기를 문질문질 해 봐요!");
    }
    function makeSamples(x, y, S) {
      const N = 44,
        out = [];
      let mask = null;
      if (cur.em) {
        const c = document.createElement("canvas");
        c.width = c.height = N;
        const g = c.getContext("2d");
        KP.drawE(g, cur.em, N / 2, N / 2, N);
        try {
          mask = g.getImageData(0, 0, N, N).data;
        } catch (e) {
          mask = null;
        }
      }
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          let inside;
          if (mask) inside = mask[(j * N + i) * 4 + 3] > 60;
          else {
            // 둥근 네모(모서리 20%)
            const u = (i + 0.5) / N,
              v = (j + 0.5) / N,
              rr = 0.2;
            const dx = Math.max(rr - u, 0, u - (1 - rr)),
              dy = Math.max(rr - v, 0, v - (1 - rr));
            inside = dx * dx + dy * dy <= rr * rr;
          }
          if (inside) out.push({ x: x + ((i + 0.5) / N) * S, y: y + ((j + 0.5) / N) * S, c: false });
        }
      return out;
    }

    /* ---------- 문지르기 ---------- */
    let last = null,
      pid = null,
      sndAcc = 0,
      parts = [];
    const pos = (e) => {
      const r = cover.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    function rubSeg(x1, y1, x2, y2) {
      cg.save();
      cg.globalCompositeOperation = "destination-out";
      cg.lineCap = "round";
      cg.strokeStyle = "#000";
      cg.globalAlpha = 0.35;
      cg.lineWidth = R * 2.5;
      cg.beginPath();
      cg.moveTo(x1, y1);
      cg.lineTo(x2 + 0.01, y2);
      cg.stroke();
      cg.globalAlpha = 1;
      cg.lineWidth = R * 2;
      cg.stroke();
      cg.restore();
      // 표본점 지우기 판정 (선분과의 거리)
      const dx = x2 - x1,
        dy = y2 - y1,
        L2 = dx * dx + dy * dy || 1,
        R2 = R * R;
      for (const s of samples) {
        if (s.c) continue;
        let t = ((s.x - x1) * dx + (s.y - y1) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = x1 + dx * t - s.x,
          ey = y1 + dy * t - s.y;
        if (ex * ex + ey * ey <= R2) {
          s.c = true;
          cleared++;
        }
      }
      // 반짝이
      for (let i = 0; i < 2; i++)
        parts.push({ x: x2 + (Math.random() - 0.5) * R * 1.6, y: y2 + (Math.random() - 0.5) * R * 1.6, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 60, life: 1, s: 3 + Math.random() * 5, c: U.pick(theme.fx), star: Math.random() < 0.4 });
      const d = Math.hypot(dx, dy);
      sndAcc += d;
      if (sndAcc > 20) {
        sndAcc = 0;
        theme.snd();
      }
      progress();
    }
    function progress() {
      if (done || !samples.length) return;
      const ratio = cleared / samples.length;
      if (ratio >= 0.93) return found();
      if (ratio > 0.45 && said < 1) {
        said = 1;
        KP.voice.say(U.pick(["와, 조금 보여요! 누구일까?", "어? 뭔가 보여요!", "누구지? 조금 더!"]));
      } else if (ratio > 0.78 && said < 2) {
        said = 2;
        KP.voice.say("거의 다 찾았어요!");
      }
    }
    async function found() {
      done = true;
      busy = true;
      sponge.classList.remove("on");
      ctx.hint(null);
      cover.classList.add("gone"); // 나머지 덮개는 스르륵
      const cx = parseFloat(charEl.style.left) + charEl.offsetWidth / 2,
        cy = parseFloat(charEl.style.top) + charEl.offsetHeight / 2;
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * 6.28,
          sp = 80 + Math.random() * 260;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 1.3, s: 4 + Math.random() * 6, c: U.pick(["#ffd54a", "#ff7ac6", "#7ad7ff", "#ffffff", "#9cff8a"]), star: true });
      }
      A.sfx("sparkle");
      ctx.after(250, () => {
        charEl.classList.add("found");
        A.sfx("boing");
        const name = cur.photo ? "우리 친구" : cur.name;
        const tag = U.el("div", "wp-name" + (parseFloat(charEl.style.top) + charEl.offsetHeight + 60 > H ? " up" : ""), KP.E(name + "!"));
        charEl.appendChild(tag);
        KP.voice.say(name + "! 찾았다!");
      });
      await ctx.wait(1700);
      ctx.score.add();
      ctx.round = (ctx.round || 0) + 1;
      const big = ctx.round % 5 === 0;
      const ok = await ctx.win({ big, msg: big ? "숨은 그림 박사!" : U.pick(["찾았다!", "와, 찾았어요!", "까꿍! 찾았다!"]) });
      if (ok) newRound();
    }
    cover.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      if (done || busy || pid !== null) return;
      pid = e.pointerId;
      try {
        cover.setPointerCapture(pid);
      } catch (_) {}
      last = pos(e);
      rubSeg(last[0], last[1], last[0], last[1]);
      moveSponge(last);
      sponge.classList.add("on");
    });
    cover.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid || done) return;
      e.preventDefault();
      const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of list.length ? list : [e]) {
        const p = pos(ev);
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) continue;
        rubSeg(last[0], last[1], p[0], p[1]);
        last = p;
        if (done) break;
      }
      moveSponge(last);
    });
    const up = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      sponge.classList.remove("on");
    };
    cover.addEventListener("pointerup", up);
    cover.addEventListener("pointercancel", up);
    function moveSponge(p) {
      sponge.style.left = p[0] + "px";
      sponge.style.top = p[1] + "px";
    }

    /* ---------- 반짝이 그리기 ---------- */
    ctx.fxLoop = (dt) => {
      fg.clearRect(0, 0, W, H);
      if (!parts.length) return;
      const next = [];
      for (const p of parts) {
        p.life -= dt * 1.4;
        if (p.life <= 0) continue;
        p.vy += 220 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        fg.globalAlpha = Math.min(1, p.life);
        fg.fillStyle = p.c;
        if (p.star) {
          fg.beginPath();
          for (let k = 0; k < 8; k++) {
            const rad = k % 2 ? p.s * 0.4 : p.s * 1.3,
              an = (k * Math.PI) / 4 + p.life * 3;
            fg.lineTo(p.x + Math.cos(an) * rad, p.y + Math.sin(an) * rad);
          }
          fg.fill();
        } else {
          fg.beginPath();
          fg.arc(p.x, p.y, p.s * 0.6, 0, 6.28);
          fg.fill();
        }
        next.push(p);
      }
      fg.globalAlpha = 1;
      parts = next.length > 500 ? next.slice(-500) : next;
    };
    ctx.newRound = newRound;
    ctx.isLoaded = () => loaded;
    addEventListener("resize", () => {
      if (ctx._active && !done) requestAnimationFrame(() => newRound(cur && cur.photo ? { photo: cur.photo } : cur));
    });
  },
  start(ctx) {
    ctx.round = 0;
    const go = () => {
      if (!ctx._active) return;
      ctx.newRound();
      ctx.loop((dt) => {
        ctx.fxLoop(dt);
      });
    };
    // 사진 목록을 먼저 읽고(옛 저장 옮기기 포함) 시작
    ctx.loadPhotos().then(() => requestAnimationFrame(go));
  },
});
