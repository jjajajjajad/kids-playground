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
  /** 그림 한 장 출력
      - iPad/iPhone: 홈 화면 앱에서는 인쇄 창이 안 뜰 수 있어 공유 창을 띄움 → 거기서 '프린트' (또는 '이미지 저장')
      - 그 밖(안드로이드·PC): 브라우저 인쇄 창 (A4 가로, 그림만 한 장) */
  KP.printImg = async function (dataUrl, title) {
    const src = KP.safeImg(dataUrl);
    if (!src) return;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios && navigator.share && navigator.canShare) {
      try {
        // data: 주소를 직접 바이트로 (fetch 는 보안 설정상 data: 를 못 씀)
        const [head, b64] = src.split(",");
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: head.slice(5, head.indexOf(";")) });
        const file = new File([blob], (title || "그림").replace(/[\\/:*?"<>|]/g, "") + ".jpg", { type: blob.type || "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          KP.toast("🖨️ 아래 목록에서 '프린트'를 눌러 주세요");
          await navigator.share({ files: [file] });
          return;
        }
      } catch (e) {
        if (e && e.name === "AbortError") return; // 공유 창을 닫음
      }
    }
    KP.css("printImg", `
      #printArea{display:none}
      @media print{
        @page{size:A4 landscape;margin:10mm}
        html,body{background:#fff!important;height:auto!important;overflow:visible!important}
        body>*:not(#printArea){display:none!important}
        #printArea{display:flex!important;position:static;width:100%;height:180mm;align-items:center;justify-content:center}
        #printArea img{max-width:100%;max-height:100%;object-fit:contain}
      }`);
    let pa = document.getElementById("printArea");
    if (!pa) {
      pa = document.createElement("div");
      pa.id = "printArea";
      document.body.appendChild(pa);
    }
    pa.innerHTML = "";
    const im = new Image();
    im.alt = "";
    pa.appendChild(im);
    await new Promise((r) => {
      im.onload = im.onerror = r;
      im.src = src;
    });
    const t0 = document.title;
    if (title) document.title = title;
    const fin = () => {
      document.title = t0;
      pa.innerHTML = "";
      removeEventListener("afterprint", fin);
    };
    addEventListener("afterprint", fin);
    try {
      window.print();
    } catch (e) {
      fin();
      KP.toast("이 기기에서는 출력할 수 없어요");
    }
  };
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
    const bPrint = U.btn(KP.E("🖨️") + " 출력", "btn");
    const bPuz = U.btn(KP.E("🧩") + " 퍼즐로", "btn");
    bPuz.addEventListener("click", () => {
      KP.pendingPuzzle = it.id;
      KP.open("jigsaw");
    });
    bPrint.addEventListener("click", () => KP.printImg(it.img, "내 작품 " + String(it.date || "")));
    row.append(bClose, bEdit, bPuz, bPrint, bDel);
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
    sTime.appendChild(U.el("p", "pNote", "오늘 사용: " + Math.floor(u.s / 60) + "분. 5분 전·1분 전에 미리 알려 주고, 시간이 되면 '잘 시간' 화면으로 잠겨요. 더 놀게 하려면 어른이 오늘 날짜 8자리를 넣어요."));
    // 이번만 타이머
    const sSess = sec("이번만 타이머 (지금부터)");
    const sRow = U.el("div", "pChips");
    const sNote = U.el("p", "pNote");
    const drawSess = () => {
      const su = KP.session.until();
      const left = su ? Math.max(0, Math.ceil((su - Date.now()) / 60000)) : 0;
      sNote.textContent = su ? "켜짐: 약 " + left + "분 뒤 잠겨요. (앱을 껐다 켜도 유지)" : "꺼짐. 아이에게 건네기 전에 눌러 두면 그 시간이 지나 잠겨요.";
    };
    [10, 15, 20, 30, 45].forEach((m) => {
      const c = U.btn(m + "분", "chip");
      c.addEventListener("click", () => {
        KP.session.start(m);
        KP.toast("지금부터 " + m + "분 타이머를 켰어요");
        drawSess();
      });
      sRow.appendChild(c);
    });
    const cOff = U.btn("끄기", "chip");
    cOff.addEventListener("click", () => {
      KP.session.stop();
      KP.toast("이번만 타이머를 껐어요");
      drawSess();
    });
    sRow.appendChild(cOff);
    sSess.append(sRow, sNote);
    drawSess();

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
    // 열쇠 별 모으기
    const sEarn = sec(KP.E("🔑") + " 열쇠 별 모으기");
    const eRow = U.el("label", "pRow", "<span>잠그지 않은 놀이(공부 놀이)에서 한 번에 맞히면 별 — 별을 다 모으면 아이가 문을 열어요</span>");
    const ec = U.el("input");
    ec.type = "checkbox";
    ec.checked = s.earnOn;
    ec.addEventListener("change", () => {
      KP.settings.set({ earnOn: ec.checked });
      KP.earn.render();
    });
    eRow.appendChild(ec);
    sEarn.appendChild(eRow);
    const eChips = (label, key, vals, fmt) => {
      const row = U.el("div", "pChips");
      row.appendChild(U.el("span", "pNote", label));
      vals.forEach((v) => {
        const c = U.btn(fmt(v), "chip" + (KP.settings.get()[key] === v ? " sel" : ""));
        c.addEventListener("click", () => {
          KP.settings.set({ [key]: v });
          U.$$(".chip", row).forEach((x) => x.classList.remove("sel"));
          c.classList.add("sel");
          KP.earn.render();
          drawEarn();
        });
        row.appendChild(c);
      });
      sEarn.appendChild(row);
    };
    eChips("필요한 별", "earnStars", [3, 5, 7], (v) => v + "개");
    eChips("열리는 시간", "earnMin", [10, 15, 20], (v) => v + "분");
    eChips("하루 최대", "earnCapMin", [30, 45, 60, 0], (v) => (v ? v + "분" : "제한 없음"));
    eChips("같은 놀이 별", "earnPerGame", [2, 3, 5], (v) => "하루 " + v + "개");
    const oRow = U.el("label", "pRow", "<span>끝날 때 '한 번만 더' 버튼 (하루 1번, 2분)</span>");
    const oc = U.el("input");
    oc.type = "checkbox";
    oc.checked = s.oneMore;
    oc.addEventListener("change", () => KP.settings.set({ oneMore: oc.checked }));
    oRow.appendChild(oc);
    sEarn.appendChild(oRow);
    const eNote = U.el("p", "pNote");
    const drawEarn = () => {
      const es = KP.earn.state(),
        c = KP.settings.get();
      const per = Object.entries(es.per)
        .map(([id, n]) => (KP.GAMES[id] ? KP.GAMES[id].name : id) + " " + n)
        .join(", ");
      eNote.textContent =
        "오늘: 별 " + es.stars + "/" + c.earnStars + " · 별로 연 시간 " + es.used + "분" + (c.earnCapMin ? "/" + c.earnCapMin + "분" : "") + (per ? " · 놀이별 " + per : "") +
        ". 틀렸다가 맞힌 문제, 6초 안에 연달아 맞힌 문제, 같은 놀이 상한을 넘긴 판은 별을 주지 않아요. 오늘의 도전 놀이는 별 2개.";
    };
    drawEarn();
    sEarn.appendChild(eNote);
    const eAct = U.el("div", "pChips");
    const bGift = U.btn(KP.E("⭐") + " 별 하나 선물", "chip");
    bGift.addEventListener("click", () => {
      KP.earn.gift(1);
      KP.toast("별 하나를 선물했어요");
      drawEarn();
    });
    const b30 = U.btn(KP.E("⏰") + " 지금 30분 열기", "chip");
    b30.addEventListener("click", () => {
      KP.gate.unlockFor(30, "adult");
      KP.toast("30분 동안 열었어요");
      KP.earn.render();
    });
    eAct.append(bGift, b30);
    sEarn.appendChild(eAct);
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
    chipRow("하루 횟수", "kidQuizMax", [1, 2, 3], (v) => v + "번");
    sLock.appendChild(U.el("p", "pNote", "문지기 퀴즈는 한글 자음·모음, 숫자(1~20), 알파벳을 소리로 묻고, 한 번에 맞힌 문제만 세요. 보기가 3개라 아무거나 눌러도 통과될 수 있어서 기본으로 꺼 두었어요(열쇠 별 모으기 권장). 시간이 끝나면 이번 판을 마치고 홈으로 나와요."));
    const bRelock = U.btn("지금 다시 잠그기", "chip");
    bRelock.addEventListener("click", () => {
      KP.gate.relock();
      KP.toast("다시 잠갔어요");
    });
    sLock.appendChild(U.el("p", "pNote", "어른이 날짜로 열 때 '30분만' 또는 '오늘 계속'을 고를 수 있어요. 공부 놀이처럼 잠그지 않은 카테고리는 바로 들어갈 수 있어요."));
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
