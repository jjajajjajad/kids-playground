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
        go.style.gridColumn = "1 / -1";
        go.addEventListener("click", () => KP.open("draw"));
        ctx.grid.appendChild(go);
      }
      items.forEach((it, i) => {
        const c = U.el("button", "galItem");
        c.style.setProperty("--i", i);
        const im = U.el("img");
        im.alt = "";
        im.src = KP.safeImg(it.img);
        const dt = U.el("span", "galDate");
        dt.textContent = String(it.date || "");
        c.append(im, dt);
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
    img.src = KP.safeImg(it.img);
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
    const nRow = U.el("label", "pRow", "<span>자연스러운 목소리 쓰기 (미리 만든 음성)</span>");
    const nc = U.el("input");
    nc.type = "checkbox";
    nc.checked = s.natural;
    nc.addEventListener("change", () => KP.settings.set({ natural: nc.checked }));
    nRow.appendChild(nc);
    sSnd.appendChild(nRow);
    const nInfo = U.el("p", "pNote natInfo", "");
    const showN = async (extra) => {
      const r = await KP.voice.natReport();
      let t;
      if (r.stored >= r.total && r.total) t = "✅ 자연 음성 " + r.total + "개 모두 이 기기에 저장됨 — 인터넷 없어도 나와요.";
      else if (r.nocors && !r.stored) t = "🌐 자연 음성은 인터넷이 될 때만 나와요 (파일 서버가 기기 저장을 막음). 오프라인일 땐 기기 목소리.";
      else if (r.stored) t = "⏳ " + r.total + "개 중 " + r.stored + "개 저장됨" + (r.failed ? " · 못 받은 것 " + r.failed + "개" : "") + " — 아래 버튼을 다시 눌러 주세요.";
      else if (!r.online) t = "📴 인터넷이 꺼져 있어요. 연결한 뒤 아래 버튼을 눌러 주세요.";
      else t = "아직 받지 않았어요 (" + r.total + "개). 아래 버튼을 눌러 주세요.";
      nInfo.textContent = t + (extra ? " " + extra : "") + " 준비 안 된 문장은 기기 목소리로 읽어요.";
    };
    showN();
    sSnd.appendChild(nInfo);
    const bNat = U.btn(KP.E("⬇️") + " 지금 받아 두기 / 들어 보기", "chip");
    bNat.addEventListener("click", async () => {
      if (bNat.disabled) return;
      bNat.disabled = true;
      KP.audio.unlock();
      KP.voice.unlockEl && KP.voice.unlockEl();
      await KP.voice.prefetch((i, n) => (bNat.textContent = "받는 중… " + i + " / " + n));
      bNat.innerHTML = KP.E("⬇️") + " 지금 받아 두기 / 들어 보기";
      bNat.disabled = false;
      await showN();
      KP.voice.lastVia = "";
      await KP.voice.say("기역! 기차의 기!");
      const v = KP.voice.lastVia;
      showN(v === "natural" ? "▶ 방금 소리: 자연 음성 ✓" : v === "el" ? "▶ 방금 소리: 자연 음성 ✓ (인터넷으로 재생)" : v === "tts" ? "▶ 방금 소리: 기기 목소리 (자연 음성 아님)" : "▶ 소리 크기가 0이거나 소리가 꺼져 있어요.");
    });
    sSnd.appendChild(bNat);
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

    // 게임 잠금
    const sLock = sec("게임 잠금");
    const lRow = U.el("label", "pRow", "<span>잠긴 카테고리는 오늘 날짜 8자리(한국 시간)를 넣어야 열기</span>");
    const lc = U.el("input");
    lc.type = "checkbox";
    lc.checked = s.lock;
    lc.addEventListener("change", () => KP.settings.set({ lock: lc.checked }));
    lRow.appendChild(lc);
    sLock.appendChild(lRow);
    const lChips = U.el("div", "pChips");
    KP.CATS.forEach((c) => {
      const on = () => KP.settings.get().lockCats.includes(c.id);
      const b = U.btn((on() ? "🔒 " : "🔓 ") + c.name, "chip" + (on() ? " sel" : ""));
      b.addEventListener("click", () => {
        const cur = KP.settings.get().lockCats.slice();
        const i = cur.indexOf(c.id);
        if (i >= 0) cur.splice(i, 1);
        else cur.push(c.id);
        KP.settings.set({ lockCats: cur });
        b.classList.toggle("sel", on());
        b.textContent = (on() ? "🔒 " : "🔓 ") + c.name;
      });
      lChips.appendChild(b);
    });
    sLock.appendChild(lChips);
    // 아이용 문지기 퀴즈
    const kRow = U.el("label", "pRow", "<span>아이가 문제를 맞히면 잠시 열기 (문지기 퀴즈)</span>");
    const kc = U.el("input");
    kc.type = "checkbox";
    kc.checked = s.kidGate;
    kc.addEventListener("change", () => KP.settings.set({ kidGate: kc.checked }));
    kRow.appendChild(kc);
    sLock.appendChild(kRow);
    const chipRow = (label, key, vals, fmt) => {
      const row = U.el("div", "pChips");
      row.appendChild(U.el("span", "pNote", label));
      vals.forEach((v) => {
        const c = U.btn(fmt(v), "chip" + (KP.settings.get()[key] === v ? " sel" : ""));
        c.addEventListener("click", () => {
          KP.settings.set({ [key]: v });
          U.$$(".chip", row).forEach((x) => x.classList.remove("sel"));
          c.classList.add("sel");
        });
        row.appendChild(c);
      });
      sLock.appendChild(row);
    };
    chipRow("맞힐 문제", "kidQ", [2, 3, 5], (v) => v + "개");
    chipRow("열리는 시간", "kidMin", [10, 20, 30], (v) => v + "분");
    sLock.appendChild(U.el("p", "pNote", "문지기 퀴즈는 한글 자음·모음, 숫자(1~20), 알파벳을 소리로 묻고, 한 번에 맞힌 문제만 세요. 시간이 끝나면 다시 잠기고 놀던 놀이에서 홈으로 나와요."));
    const bRelock = U.btn("지금 다시 잠그기", "chip");
    bRelock.addEventListener("click", () => {
      KP.gate.relock();
      KP.toast("다시 잠갔어요");
    });
    sLock.appendChild(U.el("p", "pNote", "한 번 열면 앱을 껐다 켜거나 날짜가 바뀔 때까지 열려 있어요. 공부 놀이처럼 잠그지 않은 카테고리는 바로 들어갈 수 있어요."));
    sLock.appendChild(bRelock);

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
        "<br>모든 기록은 이 기기 안에만 저장돼요. 기기를 바꾸거나 앱을 지우기 전에는 백업 파일을 내보내 두세요." +
        "<br>백업 파일에는 등록한 사진과 그림이 들어 있으니, 믿을 수 있는 곳에만 보관하세요." +
        (KP.u.isApp() ? "" : "<br><b>홈 화면에 추가한 앱으로 쓰면 기록이 더 안전하게 남아요.</b> (Safari 탭으로만 쓰다가 오래 안 열면 기기가 기록을 지울 수 있어요)");
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
