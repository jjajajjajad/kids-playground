/* =====================================================================
   특별 화면: 스티커북 · 내 작품 갤러리 · 부모 설정 패널
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;

  /* ---------------- 스티커북 ---------------- */
  KP.game({
    id: "stickers",
    icon: "📒",
    name: "내 스티커북",
    cat: "sys",
    bubble: true,
    setup(ctx) {
      ctx.head = U.el("div", "stkHead");
      ctx.grid = U.el("div", "stkGrid");
      ctx.body.append(ctx.head, ctx.grid);
    },
    start(ctx) {
      const have = KP.stickers.have();
      const n = Object.keys(have).length,
        all = KP.stickers.LIST.length;
      ctx.say(n ? "스티커를 " + n + "개 모았어요! 눌러 보세요." : "놀이를 하면 스티커를 받을 수 있어요!");
      ctx.head.innerHTML = '<div class="stkBar"><i style="width:' + (n / all) * 100 + '%"></i></div><b>' + n + " / " + all + "</b>";
      ctx.grid.innerHTML = "";
      const last = KP.store.get("lastSticker", "");
      KP.stickers.LIST.forEach(([e, name], i) => {
        const got = have[e];
        const c = U.el("button", "stk" + (got ? " got" : "") + (e === last ? " new" : ""), KP.E(e));
        c.style.setProperty("--i", i);
        if (got > 1) c.appendChild(U.el("span", "stkN", "×" + got));
        c.addEventListener("click", () => {
          if (got) {
            U.replay(c, "jump");
            KP.audio.sfx("tap2");
            KP.voice.say(name + "!");
          } else {
            U.replay(c, "wrong");
            KP.voice.say("아직 없어요. 놀이를 하면 받을 수 있어요!");
          }
        });
        ctx.grid.appendChild(c);
      });
    },
  });

  /* ---------------- 내 작품 갤러리 ---------------- */
  KP.game({
    id: "gallery",
    icon: "🖼️",
    name: "내 작품",
    cat: "sys",
    setup(ctx) {
      ctx.grid = U.el("div", "galGrid");
      ctx.body.appendChild(ctx.grid);
      ctx.viewer = U.el("div", "viewer");
      ctx.root.appendChild(ctx.viewer);
    },
    async start(ctx) {
      ctx.viewer.classList.remove("show");
      const items = (await KP.db.all("art")).filter((x) => x.kind !== "zoo").reverse();
      ctx.say(items.length ? "내가 만든 작품이 " + items.length + "개 있어요!" : "그림 그리기에서 저장하면 여기에 모여요!");
      ctx.grid.innerHTML = "";
      if (!items.length) {
        const go = U.btn(KP.E("🎨") + " 그림 그리러 가기", "btn big");
        go.addEventListener("click", () => KP.open("draw"));
        ctx.grid.appendChild(go);
      }
      items.forEach((it, i) => {
        const c = U.el("button", "galItem");
        c.style.setProperty("--i", i);
        c.innerHTML = '<img src="' + it.img + '" alt="">' + '<span class="galDate">' + (it.date || "") + "</span>";
        c.addEventListener("click", () => open(ctx, it));
        ctx.grid.appendChild(c);
      });
    },
  });
  function open(ctx, it) {
    KP.audio.sfx("open");
    const v = ctx.viewer;
    v.innerHTML = "";
    const img = U.el("img", "viewImg");
    img.src = it.img;
    const row = U.el("div", "viewRow");
    const bClose = U.btn(KP.E("↩️") + " 돌아가기", "btn");
    const bEdit = U.btn(KP.E("✏️") + " 이어 그리기", "btn primary");
    const bDel = U.btn(KP.E("🗑️") + " 지우기(꾹)", "btn danger");
    row.append(bClose, bEdit, bDel);
    v.append(img, row);
    v.classList.add("show");
    bClose.addEventListener("click", () => v.classList.remove("show"));
    bEdit.addEventListener("click", () => {
      KP.pendingDraw = it;
      KP.open("draw");
    });
    KP.hold(bDel, 1500, async () => {
      await KP.db.del("art", it.id);
      KP.toast("지웠어요");
      KP.GAMES.gallery.start(ctx);
    });
  }

  /* ---------------- 부모 설정 ---------------- */
  let panel = null;
  KP.openSettings = function () {
    if (panel) panel.remove();
    KP.voice.stop();
    const s = KP.settings.get();
    panel = U.el("div", "panel");
    const box = U.el("div", "panelBox");
    panel.appendChild(box);
    box.innerHTML = '<h2>' + KP.E("⚙️") + ' 부모 설정</h2>';
    const close = U.btn("✕", "panelClose");
    close.addEventListener("click", () => {
      panel.remove();
      panel = null;
      KP.renderHome();
    });
    box.appendChild(close);

    const sec = (title) => {
      const d = U.el("section", "pSec", "<h3>" + title + "</h3>");
      box.appendChild(d);
      return d;
    };

    // 소리
    const sSnd = sec("소리");
    [["sfx", "효과음"], ["music", "배경음악"], ["voice", "목소리 안내"]].forEach(([k, label]) => {
      const row = U.el("label", "pRow", "<span>" + label + "</span>");
      const r = U.el("input");
      r.type = "range";
      r.min = 0;
      r.max = 1;
      r.step = 0.05;
      r.value = s[k];
      r.addEventListener("input", () => KP.settings.set({ [k]: +r.value }));
      r.addEventListener("change", () => {
        if (k === "voice") KP.voice.say("목소리 크기예요");
        else if (k === "sfx") KP.audio.sfx("good");
      });
      row.appendChild(r);
      sSnd.appendChild(row);
    });
    const vName = KP.voice.koName();
    sSnd.appendChild(U.el("p", "pNote", vName ? "사용 중인 목소리: " + vName : "이 기기에서 한국어 음성을 찾지 못했어요. 기기 설정 > 손쉬운 사용 > 음성 콘텐츠에서 한국어 음성을 내려받으면 안내 목소리가 나와요."));

    // 시간
    const sTime = sec("하루 사용 시간");
    const tRow = U.el("div", "pChips");
    [0, 10, 20, 30, 45, 60].forEach((m) => {
      const c = U.btn(m ? m + "분" : "제한 없음", "chip" + (s.timer === m ? " sel" : ""));
      c.addEventListener("click", () => {
        KP.settings.set({ timer: m });
        U.$$(".chip", tRow).forEach((x) => x.classList.remove("sel"));
        c.classList.add("sel");
      });
      tRow.appendChild(c);
    });
    sTime.appendChild(tRow);
    const u = KP.usage();
    sTime.appendChild(U.el("p", "pNote", "오늘 사용: " + Math.floor(u.s / 60) + "분. 시간이 되면 '잘 시간' 화면이 나오고, 어른이 3초 꾹 누르면 10분 더 놀 수 있어요."));

    // 힌트
    const sHint = sec("도움말");
    const hRow = U.el("label", "pRow", "<span>멈춰 있으면 손가락 힌트 보여주기</span>");
    const hc = U.el("input");
    hc.type = "checkbox";
    hc.checked = s.hints;
    hc.addEventListener("change", () => KP.settings.set({ hints: hc.checked }));
    hRow.appendChild(hc);
    sHint.appendChild(hRow);

    // 게임 보이기
    const sGames = sec("보여줄 놀이 고르기");
    KP.CATS.forEach((c) => {
      sGames.appendChild(U.el("h4", "", KP.E(c.icon) + " " + c.name));
      const wrap = U.el("div", "pGames");
      KP.ORDER.filter((id) => KP.GAMES[id].cat === c.id).forEach((id) => {
        const g = KP.GAMES[id];
        const b = U.btn(KP.E(g.icon) + "<span>" + g.name + "</span>", "pGame" + (s.hidden[id] ? " off" : ""));
        b.addEventListener("click", () => {
          const h = Object.assign({}, KP.settings.get().hidden);
          if (h[id]) delete h[id];
          else h[id] = true;
          KP.settings.set({ hidden: h });
          b.classList.toggle("off", !!h[id]);
        });
        wrap.appendChild(b);
      });
      sGames.appendChild(wrap);
    });

    // 데이터
    const sData = sec("저장된 데이터");
    const info = U.el("p", "pNote", "계산 중…");
    sData.appendChild(info);
    Promise.all([KP.db.all("art"), KP.db.all("photos")]).then(([a, p]) => {
      const zoo = a.filter((x) => x.kind === "zoo").length;
      info.innerHTML =
        "스티커 " + KP.stickers.count() + "개 · 그림 작품 " + (a.length - zoo) + "개 · 동물원 친구 " + zoo + "마리 · 등록 사진 " + p.length + "장" +
        "<br>모든 기록은 이 기기 안에만 저장돼요. 기기를 바꾸거나 앱을 지우기 전에는 백업 파일을 내보내 두세요.";
    });
    const dRow = U.el("div", "pChips");
    const bExp = U.btn(KP.E("💾") + " 백업 내보내기", "chip");
    const bImp = U.btn(KP.E("📂") + " 백업 불러오기", "chip");
    const bReset = U.btn(KP.E("🔄") + " 단계·스티커 초기화(꾹)", "chip danger");
    bExp.addEventListener("click", () => KP.backup.export());
    bImp.addEventListener("click", async () => {
      const ok = await KP.backup.import();
      KP.toast(ok ? "백업을 불러왔어요" : "불러오지 못했어요");
      if (ok) setTimeout(() => location.reload(), 900);
    });
    KP.hold(bReset, 2000, () => {
      KP.store.keys().filter((k) => k.startsWith("lv:") || k === "stickers" || k === "winCount").forEach((k) => KP.store.del(k));
      KP.toast("초기화했어요");
    });
    dRow.append(bExp, bImp, bReset);
    sData.appendChild(dRow);

    box.appendChild(U.el("p", "pVer", "아이 놀이터 · 버전 " + (KP.VERSION || "dev")));
    document.body.appendChild(panel);
  };
})(window.KP);
