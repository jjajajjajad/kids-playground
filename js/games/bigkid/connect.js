/* 짝 잇기 — 왼쪽 그림에서 오른쪽 짝까지 손가락으로 선을 그어 연결
   주제: 엄마와 아기, 동물과 먹이, 동물과 집, 탈것과 길, 짝꿍 물건
   1단계: 3쌍 (쉬운 주제)  2단계: 4쌍  3단계: 5쌍 (모든 주제) — 화면이 낮으면(폰 가로) 들어가는 만큼만
   짝 설명 말: [그림, 짝, 설명, 자연 음성 조각 문장] — 설명 문장에 자연 음성이 없으면 조각 문장("원숭이는 바나나 냠냠!")으로
   (선 긋기가 어려우면 왼쪽 → 오른쪽 차례로 톡톡 눌러도 이어진다) */
"use strict";
KP.game({
  id: "connect",
  icon: "🔗",
  name: "짝 잇기",
  cat: "bigkid",
  levels: 3,
  score: "⭐",
  setup(ctx) {
    const U = KP.u;
    KP.css("connect", `
      .cnBoard{flex:1;min-height:0;position:relative;margin:0 12px 12px;border-radius:26px;background:#fff;box-shadow:var(--shadow);overflow:hidden;touch-action:none;background-image:radial-gradient(circle at 50% 50%,rgba(242,154,0,.06),transparent 70%)}
      .cnSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
      .cnCol{position:absolute;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;z-index:2;width:44%}
      .cnCol.l{left:0}.cnCol.r{right:0}
      .cnItem{--s:min(clamp(80px,min(15vw,17vh),140px),var(--fs,999px));width:var(--s);height:var(--s);border-radius:26px;background:#fff8e6;box-shadow:0 6px 0 #f1d79a;display:flex;align-items:center;justify-content:center;font-size:calc(var(--s)*.66);line-height:1;position:relative;touch-action:none;transition:transform .12s;animation:itemIn .4s backwards cubic-bezier(.2,1.4,.4,1);animation-delay:calc(var(--i,0)*70ms)}
      .cnCol.r .cnItem{background:#eaf6ff;box-shadow:0 6px 0 #b8dcf7}
      .cnItem.sel{transform:scale(1.1);box-shadow:0 0 0 6px var(--sun),0 6px 0 #f1d79a}
      .cnItem.done{background:#e6fbec;box-shadow:0 6px 0 #9fe0b3}
      .cnItem.near{transform:scale(1.12)}
      .cnItem .baby{font-size:.6em}
      .cnDot{position:absolute;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:#fff;border:5px solid #f2a640;box-sizing:border-box}
      .cnCol.l .cnDot{right:-9px}.cnCol.r .cnDot{left:-9px;border-color:#5aaeea}
      .cnItem.done .cnDot{border-color:#2fb466}
      .cnLine{fill:none;stroke-linecap:round;stroke-width:11}
      .cnLine.live{stroke:#f2a640;stroke-dasharray:2 18;stroke-width:12}
      .cnLine.bad{stroke:#ff9aa9;transition:opacity .4s}
      .cnLine.ok{animation:cnDraw .35s ease-out}
      @keyframes cnDraw{from{stroke-width:22}}
      @media (orientation:portrait){.cnItem{--s:min(clamp(80px,min(26vw,13vh),130px),var(--fs,999px))}.cnCol{width:46%}}
      .cnSpark{position:absolute;z-index:3;pointer-events:none;font-size:clamp(26px,4vw,40px);line-height:1;margin:-.5em 0 0 -.5em;animation:cnSpark .9s ease-out forwards}
      @keyframes cnSpark{0%{transform:scale(.2);opacity:0}30%{transform:scale(1.2);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.6);opacity:0}}
    `);
    ctx.THEMES = [
      { name: "먹이", easy: 1, say: "동물 친구가 좋아하는 먹이를 이어 주세요!", pairs: [["🐰", "🥕", "토끼는 당근을 냠냠"], ["🐵", "🍌", "원숭이는 바나나를 냠냠", "원숭이는 바나나 냠냠!"], ["🐶", "🦴", "강아지는 뼈다귀를 좋아해요", "강아지는 뼈다귀 좋아해요!"], ["🐱", "🐟", "고양이는 생선을 좋아해요", "고양이는 생선 좋아해요!"], ["🐿️", "🌰", "다람쥐는 도토리를 냠냠", "다람쥐! 도토리 냠냠!"], ["🐼", "🎋", "판다는 대나무를 냠냠", "판다! 대나무 냠냠!"], ["🐭", "🧀", "생쥐는 치즈를 좋아해요", "생쥐! 치즈 좋아해요!"], ["🐝", "🌻", "꿀벌은 꽃에서 꿀을 모아요", "꿀벌은 윙윙! 꽃!"]] },
      { name: "탈것", easy: 1, say: "탈것이 다니는 길을 이어 주세요!", pairs: [["🚗", "🛣️", "자동차는 도로를 달려요", "자동차! 우와, 달려간다!"], ["⛵", "🌊", "배는 바다에 떠요"], ["✈️", "☁️", "비행기는 하늘을 날아요", "비행기! 하늘!"], ["🚂", "🛤️", "기차는 기찻길을 달려요", "기차! 칙칙폭폭!"], ["🚀", "🌙", "로켓은 우주로 슝"], ["🚒", "🔥", "소방차는 불을 꺼요", "소방차! 물을 뿜어요!"], ["🚌", "🏫", "버스 타고 유치원에 가요", "버스! 유치원에 가요"], ["🚑", "🏥", "구급차는 병원으로 가요", "구급차 출발!"]] }, // 8쌍 — 3단계(5쌍)도 판마다 달라짐
      { name: "엄마", easy: 1, say: "엄마와 아기를 이어 주세요!", pairs: [["🐔", "🐥", "엄마 닭과 아기 병아리", "엄마 닭! 아기 병아리!"], ["🐘", "baby:🐘", "엄마 코끼리와 아기 코끼리", "엄마 코끼리! 아기 코끼리!"], ["🦒", "baby:🦒", "엄마 기린과 아기 기린", "엄마 기린! 아기 기린!"], ["🐧", "baby:🐧", "엄마 펭귄과 아기 펭귄", "엄마 펭귄! 아기 펭귄!"], ["🐳", "baby:🐳", "엄마 고래와 아기 고래", "엄마 고래! 아기 고래!"], ["🐢", "baby:🐢", "엄마 거북이와 아기 거북이", "엄마 거북이! 아기 거북이!"]] },
      { name: "집", say: "동물 친구가 사는 곳을 이어 주세요!", pairs: [["🐦", "🪺", "새는 둥지에 살아요"], ["🐟", "🌊", "물고기는 물속에 살아요", "바다에 사는 건 물고기!"], ["🐧", "🧊", "펭귄은 얼음 나라에 살아요", "펭귄! 얼음!"], ["🐫", "🏜️", "낙타는 사막에 살아요"], ["🐒", "🌳", "원숭이는 나무 위에 살아요", "원숭이! 나무!"], ["🐶", "🏠", "강아지는 집에서 살아요", "강아지! 집!"]] },
      { name: "짝꿍", say: "같이 쓰는 짝꿍 물건을 이어 주세요!", pairs: [["🔒", "🔑", "자물쇠는 열쇠로 철컥"], ["🧦", "👟", "양말 신고 운동화 신어요"], ["🥄", "🥣", "숟가락으로 그릇 속 밥을 떠요"], ["⚽", "🥅", "공을 골대에 뻥"], ["🖌️", "🎨", "붓으로 물감을 콕콕"], ["🪥", "🦷", "칫솔로 이를 닦아요"]] },
    ];
    ctx.COLORS = ["#ff7452", "#2f95f5", "#2fb466", "#8a63ee", "#ff5d8f"];
    ctx.board = U.el("div", "cnBoard");
    ctx.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    ctx.svg.setAttribute("class", "cnSvg");
    ctx.colL = U.el("div", "cnCol l");
    ctx.colR = U.el("div", "cnCol r");
    ctx.board.append(ctx.svg, ctx.colL, ctx.colR);
    ctx.body.appendChild(ctx.board);
    ctx.round = 0;
    ctx.token = 0;
    // 화면을 돌리면 그림 크기 상한(--fs)도 다시 (n개가 세로로 들어가게)
    ctx.fitN = (n) => {
      const bh = ctx.board.clientHeight;
      if (bh) ctx.board.style.setProperty("--fs", Math.max(64, Math.floor((bh / n) * 0.84)) + "px");
    };
    addEventListener("resize", () => {
      if (!ctx._active) return;
      if (ctx.cnN) ctx.fitN(ctx.cnN);
      if (ctx.redraw) requestAnimationFrame(() => ctx._active && ctx.redraw());
    });
  },
  start(ctx) {
    ctx.round = 0;
    ctx.lastTheme = null;
    this.next(ctx);
  },
  art(e) {
    return e.startsWith("baby:") ? '<span class="baby">' + KP.E(e.slice(5)) + "</span>" : KP.E(e);
  },
  next(ctx) {
    const U = KP.u,
      A = KP.audio;
    const lv = ctx.level;
    const tok = ++ctx.token;
    // 한 판 3~5쌍. 화면이 낮으면 그림이 64px 아래로 작아지지 않는 만큼만
    let n = lv + 2;
    const bh = ctx.board.clientHeight;
    if (bh) {
      while (n > 3 && bh / n < 64 / 0.84) n--;
    }
    ctx.cnN = n;
    ctx.fitN(n); // 세로로 n개가 들어가는 크기 상한
    // 3단계는 '엄마' 주제를 뺌 — 아기가 같은 그림의 작은 버전이라 그림만 맞추면 됨
    const theme = U.pick(ctx.THEMES.filter((t) => (lv === 1 ? t.easy : true) && !(lv === 3 && t.name === "엄마") && t !== ctx.lastTheme));
    ctx.lastTheme = theme;
    const pairs = U.sample(theme.pairs, n);
    let order = U.shuffle(pairs.map((_, i) => i));
    if (n > 1) while (order.every((v, i) => v === i)) order = U.shuffle(order);

    ctx.colL.innerHTML = "";
    ctx.colR.innerHTML = "";
    ctx.svg.innerHTML = "";
    ctx.say(theme.say);
    const L = pairs.map((p, i) => {
      const b = U.el("div", "cnItem", this.art(p[0]) + '<span class="cnDot"></span>');
      b.dataset.k = i;
      b.dataset.side = "l";
      b.style.setProperty("--i", i);
      ctx.colL.appendChild(b);
      return b;
    });
    const R = order.map((i, k) => {
      const b = U.el("div", "cnItem", this.art(pairs[i][1]) + '<span class="cnDot"></span>');
      b.dataset.k = i;
      b.dataset.side = "r";
      b.style.setProperty("--i", k + 0.5);
      ctx.colR.appendChild(b);
      return b;
    });
    const all = [...L, ...R];
    const done = []; // [k, color]
    const NS = "http://www.w3.org/2000/svg";
    const anchor = (el) => {
      const br = ctx.board.getBoundingClientRect(),
        r = el.getBoundingClientRect();
      return { x: (el.dataset.side === "l" ? r.right : r.left) - br.left, y: r.top + r.height / 2 - br.top };
    };
    const pathD = (a, b) => {
      const mx = (a.x + b.x) / 2;
      return "M" + a.x + " " + a.y + " C" + mx + " " + a.y + " " + mx + " " + b.y + " " + b.x + " " + b.y;
    };
    const mkPath = (cls, color) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "cnLine " + cls);
      if (color) p.setAttribute("stroke", color);
      ctx.svg.appendChild(p);
      return p;
    };
    ctx.redraw = () => {
      if (tok !== ctx.token) return;
      done.forEach(([k, , path]) => path.setAttribute("d", pathD(anchor(L[k]), anchor(R.find((x) => +x.dataset.k === k)))));
    };

    let from = null,
      live = null,
      pid = null,
      moved = false,
      selected = null,
      busy = false;
    const pick = (x, y, side) => {
      let best = null,
        bd = 1e9;
      for (const el of all) {
        if (el.dataset.side !== side || el.classList.contains("done")) continue;
        const r = el.getBoundingClientRect();
        const pad = 26;
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
          const d = U.dist(x, y, r.left + r.width / 2, r.top + r.height / 2);
          if (d < bd) {
            bd = d;
            best = el;
          }
        }
      }
      return best;
    };
    const other = (s) => (s === "l" ? "r" : "l");
    const connect = (a, b) => {
      // a, b: 서로 다른 쪽 그림
      const l = a.dataset.side === "l" ? a : b,
        r = l === a ? b : a;
      if (l.dataset.k === r.dataset.k) {
        const k = +l.dataset.k;
        const color = ctx.COLORS[done.length % ctx.COLORS.length];
        const path = mkPath("ok", color);
        path.setAttribute("d", pathD(anchor(l), anchor(r)));
        done.push([k, color, path]);
        l.classList.add("done");
        r.classList.add("done");
        U.replay(l, "jump");
        U.replay(r, "jump");
        A.sfx("snap");
        A.note(A.SCALE[4 + done.length], { inst: "bell", dur: 0.5, vol: 0.22 });
        // 설명 문장에 자연 음성이 없으면 조각 문장으로 (기기 목소리보다 자연 음성 우선)
        const full = pairs[k][2] + "!";
        KP.voice.say(pairs[k][3] && !(KP.voice._natUrls && KP.voice._natUrls(full)) ? pairs[k][3] : full);
        spark(anchor(l), anchor(r));
        if (done.length === n) finish();
        else hint();
        return true;
      }
      // 틀림: 선을 잠깐 보여 주고 사라짐
      const bad = mkPath("bad");
      bad.setAttribute("d", pathD(anchor(l), anchor(r)));
      ctx.after(350, () => (bad.style.opacity = "0"));
      ctx.after(800, () => bad.remove());
      ctx.miss(b, "음, 짝이 아니에요. 다른 친구를 찾아볼까?");
      return false;
    };
    // 맞춘 선 위로 반짝이 ✨
    const spark = (a, b) => {
      for (let i = 0; i < 4; i++) {
        const t = (i + 1) / 5;
        const sp = U.el("div", "cnSpark", KP.E(i % 2 ? "✨" : "⭐"));
        sp.style.left = a.x + (b.x - a.x) * t + "px";
        sp.style.top = a.y + (b.y - a.y) * t + "px";
        sp.style.setProperty("--dx", U.randf(-30, 30) + "px");
        sp.style.setProperty("--dy", U.randf(-50, -20) + "px");
        sp.style.animationDelay = i * 70 + "ms";
        ctx.board.appendChild(sp);
        ctx.after(1100 + i * 70, () => sp.remove());
      }
      A.sfx("sparkle");
    };
    const clearSel = () => {
      if (selected) selected.classList.remove("sel");
      selected = null;
    };
    const onDown = (e) => {
      if (busy || pid !== null || tok !== ctx.token) return;
      const el = e.target.closest(".cnItem");
      if (!el || el.classList.contains("done")) return;
      e.preventDefault();
      A.unlock();
      // 톡톡 모드: 이미 고른 그림이 반대쪽에 있으면 바로 잇기
      if (selected && selected.dataset.side !== el.dataset.side) {
        const s = selected;
        clearSel();
        connect(s, el);
        return;
      }
      clearSel();
      pid = e.pointerId;
      try {
        ctx.board.setPointerCapture(pid);
      } catch (_) {}
      from = el;
      moved = false;
      from.classList.add("sel");
      A.sfx("pick");
      live = mkPath("live");
      const a = anchor(from);
      live.setAttribute("d", pathD(a, a));
    };
    const onMove = (e) => {
      if (e.pointerId !== pid || !from) return;
      e.preventDefault();
      const br = ctx.board.getBoundingClientRect();
      const a = anchor(from);
      const p = { x: e.clientX - br.left, y: e.clientY - br.top };
      if (U.dist(a.x, a.y, p.x, p.y) > 30) moved = true;
      const t = pick(e.clientX, e.clientY, other(from.dataset.side));
      all.forEach((x) => x.classList.toggle("near", x === t));
      live.setAttribute("d", "M" + a.x + " " + a.y + " L" + p.x + " " + p.y);
      if (Math.random() < 0.12) A.sfx("rub");
    };
    const onUp = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      all.forEach((x) => x.classList.remove("near"));
      if (live) live.remove();
      live = null;
      const f = from;
      from = null;
      if (!f) return;
      f.classList.remove("sel");
      const t = pick(e.clientX, e.clientY, other(f.dataset.side));
      if (t) connect(f, t);
      else if (!moved) {
        // 그냥 톡 눌렀으면 골라 둔 상태로
        selected = f;
        f.classList.add("sel");
        KP.voice.say("이제 짝을 콕 눌러요!");
      }
    };
    ctx.board.onpointerdown = onDown;
    ctx.board.onpointermove = onMove;
    ctx.board.onpointerup = onUp;
    ctx.board.onpointercancel = onUp;

    const hint = () => {
      const l = L.find((x) => !x.classList.contains("done"));
      // 첫 힌트는 왼쪽 그림, 두 번째부터는 그 짝(정답을 보여 준 판은 열쇠 별 없음)
      ctx.hint(() => {
        if (ctx._hint && ctx._hint.shown >= 1) {
          ctx._hinted = true;
          return R.find((x) => x.dataset.k === l.dataset.k);
        }
        return l;
      }, "그림에서 짝까지 손가락으로 쭉 선을 그어요!");
    };
    hint();
    const finish = async () => {
      busy = true;
      ctx.hint(null);
      await ctx.wait(1200);
      if (tok !== ctx.token) return;
      all.forEach((x, i) => ctx.after(i * 60, () => U.replay(x, "jump")));
      ctx.score.add();
      ctx.round++;
      const big = ctx.round % 4 === 0;
      const ok = await ctx.win({ big, msg: big ? "{부름} 짝꿍 박사!" : "모두 짝을 찾았어요!" });
      if (ok && tok === ctx.token) this.next(ctx);
    };
  },
});
