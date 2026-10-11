/* 진짜 피아노 — 집에 있는 진짜 피아노(키보드·실로폰)를 치면 아이패드가 마이크로 듣고 알아채요
   - 🎵 마음대로 쳐요: 친 음이 화면 건반에 무지개로 켜짐 (마이크가 잘 듣는지 확인하는 놀이 겸)
   - ✋ 손 자리 따라 치기: 오른손 엄지(1)를 도에 — 반짝이는 건반과 손가락 번호를 보고 동요 따라 치기
   - 🦜 메아리 놀이: 앱이 들려준 음을 따라 치기 (1단계 1음 → 3단계 3음)
   소리 알아채기: McLeod(MPM) 음높이 찾기 · 100~1100Hz만(여러 건반을 쾅 치면 생기는 낮은 허상음 제외)
     · 같은 음 3번 연속(약 50ms)일 때만 인정 · 옥타브는 따지지 않고 음이름(도·레·미)만 맞으면 정답
     · 피아노 음정이 조금 어긋나 있어도 맞추도록 평균 어긋남을 천천히 학습
     · 앱이 말하거나 소리 내는 동안은 듣지 않음(앱 소리를 아이 소리로 착각하지 않게)
   마이크를 못 쓰면 화면 건반을 눌러서 똑같이 놀 수 있음 */
"use strict";
(function () {
  /** McLeod pitch method — 한 덩어리 소리에서 기본 주파수 찾기 (없으면 null) */
  function mpm(buf, sr, fmin, fmax) {
    const N = buf.length;
    const maxLag = Math.min(N >> 1, Math.ceil(sr / fmin) + 2),
      minLag = Math.max(2, Math.floor(sr / fmax));
    const d = new Float32Array(maxLag + 2);
    for (let t = 0; t <= maxLag + 1; t++) {
      let ac = 0,
        m = 0;
      for (let i = 0, n = N - t; i < n; i++) {
        const a = buf[i],
          b = buf[i + t];
        ac += a * b;
        m += a * a + b * b;
      }
      d[t] = m > 0 ? (2 * ac) / m : 0;
    }
    let t = 1;
    while (t < maxLag && d[t] > 0) t++;
    const peaks = [];
    let mx = -1;
    for (; t <= maxLag; t++) {
      if (d[t] > 0) {
        if (mx < 0 || d[t] > d[mx]) mx = t;
      } else if (mx >= 0) {
        peaks.push(mx);
        mx = -1;
      }
    }
    if (mx >= 0 && mx < maxLag) peaks.push(mx);
    if (!peaks.length) return null;
    let hi = 0;
    for (const p of peaks) hi = Math.max(hi, d[p]);
    if (hi < 0.5) return null;
    const p = peaks.find((q) => d[q] >= 0.9 * hi);
    const a = d[p - 1],
      b = d[p],
      c = d[p + 1];
    const den = a - 2 * b + c;
    const tau = p + (den ? (a - c) / (2 * den) : 0);
    if (tau < minLag || tau > sr / fmin) return null;
    return { f: sr / tau, clarity: b };
  }
  KP.pitchMPM = mpm; // 점검용

  const KEYS = [
    ["C4", "도", "#ff4f5e", 0], ["D4", "레", "#ff9a2e", 2], ["E4", "미", "#f2c200", 4], ["F4", "파", "#3cc45a", 5],
    ["G4", "솔", "#2fb6e8", 7], ["A4", "라", "#3f6cf0", 9], ["B4", "시", "#8a5cf0", 11], ["C5", "도", "#ff5fae", 0],
  ];
  const FINGER = ["엄지", "검지", "가운데 손가락", "약지", "새끼손가락"];
  const SONGS = [
    { id: "steps", em: "🪜", name: "도레미 계단", notes: ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4"] },
    { id: "airplane", em: "✈️", name: "비행기", song: "airplane" },
    { id: "butterfly", em: "🦋", name: "나비야", song: "butterfly" },
    { id: "bears", em: "🐻", name: "곰 세 마리", song: "bears" },
  ];

  KP.game({
    id: "realpiano",
    icon: "🎼",
    name: "진짜 피아노",
    cat: "music",
    levels: 3,
    setup(ctx) {
      const U = KP.u,
        A = KP.audio,
        self = this;
      KP.css("realpiano", `
        .rp{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:0 12px 12px;position:relative}
        .rp-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap}
        .rp-ear{display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:6px 14px 6px 8px;box-shadow:0 4px 0 rgba(47,58,102,.12);font-size:clamp(15px,2vw,19px);color:#555c7d}
        .rp-ear .e{font-size:30px;line-height:1}
        .rp-ear.on .e{animation:rpEar 1.2s ease-in-out infinite}
        @keyframes rpEar{50%{transform:scale(1.12) rotate(-6deg)}}
        .rp-meter{width:clamp(70px,12vw,140px);height:12px;border-radius:8px;background:#e9ecf5;overflow:hidden}
        .rp-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3cc45a,#f2c200,#ff4f5e);transition:width .08s}
        .rp-mid{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
        .rp-big{font-size:clamp(64px,15vh,150px);line-height:1;color:#c9cede;text-shadow:0 6px 0 rgba(0,0,0,.08);min-height:1em}
        .rp-big.pop{animation:rpPop .45s cubic-bezier(.3,1.6,.5,1)}
        @keyframes rpPop{0%{transform:scale(.5)}60%{transform:scale(1.15)}}
        .rp-sub{font-size:clamp(17px,2.4vw,24px);color:#555c7d;text-align:center;min-height:1.3em}
        .rp-dots{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;max-width:min(760px,86vw)}
        .rp-dots i{width:clamp(14px,2vw,20px);height:clamp(14px,2vw,20px);border-radius:50%;background:#e3e7f1}
        .rp-dots i.ok{background:var(--c)}
        .rp-dots i.now{box-shadow:0 0 0 3px var(--ink);background:#fff}
        .rp-kb{flex:0 0 auto;height:clamp(150px,36vh,300px);display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:42% 58%;column-gap:6px;position:relative}
        .rp-palm{grid-row:1;grid-column:1/6;align-self:start;height:44%;margin:0 6%;border-radius:40px 40px 18px 18px;background:#ffe2c6;border:3px solid #e9b98f;position:relative;z-index:1;pointer-events:none}
        .rp-fing{grid-row:1;align-self:end;justify-self:center;width:62%;border-radius:12px 12px 40px 40px;background:#ffe2c6;border:3px solid #e9b98f;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;position:relative;z-index:2;pointer-events:none;transition:transform .15s}
        .rp-fing b{width:clamp(26px,4.2vw,40px);height:clamp(26px,4.2vw,40px);border-radius:50%;background:var(--c);color:#fff;display:flex;align-items:center;justify-content:center;font-size:clamp(17px,2.6vw,26px);font-weight:400;box-shadow:0 2px 0 rgba(0,0,0,.15)}
        .rp-fing.go{transform:translateY(10%);border-color:var(--c);box-shadow:0 0 0 4px var(--c)}
        .rp-fing.go b{animation:rpPop .7s infinite}
        .rp-kb.nohand .rp-palm,.rp-kb.nohand .rp-fing{visibility:hidden}
        .rp-key{grid-row:2;border-radius:0 0 18px 18px;background:#fff;box-shadow:0 6px 0 #d5d9e6,inset 0 -10px 0 color-mix(in srgb,var(--c) 22%,#fff);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:10px;font-size:clamp(18px,3vw,30px);color:var(--c);position:relative;transition:background .12s,transform .08s}
        .rp-key.lit{background:var(--c);color:#fff;transform:translateY(4px);box-shadow:0 2px 0 #d5d9e6}
        .rp-key.want{animation:rpWant 1s ease-in-out infinite}
        @keyframes rpWant{50%{background:color-mix(in srgb,var(--c) 45%,#fff)}}
        .rp-key.heard{box-shadow:0 6px 0 #d5d9e6,inset 0 0 0 5px color-mix(in srgb,var(--c) 50%,#fff)}
        .rp-ov{position:absolute;inset:0;z-index:20;background:rgba(244,247,255,.97);display:none;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2vh,18px);padding:12px 16px;text-align:center}
        .rp-ov.show{display:flex;animation:enter .3s}
        .rp-ov h3{font-weight:400;font-size:clamp(22px,3.4vw,32px);color:var(--ink)}
        .rp-ov p{font-size:clamp(15px,2vw,19px);color:#555c7d;max-width:640px;line-height:1.45}
        .rp-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;max-width:900px}
        .rp-card{background:#fff;border-radius:22px;padding:14px 8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:6px;font-size:clamp(17px,2.3vw,23px);min-height:clamp(120px,22vh,190px);justify-content:center;animation:cardIn .4s backwards;animation-delay:calc(var(--i) * 50ms)}
        .rp-card .e{font-size:clamp(46px,8vh,72px);line-height:1}
        .rp-card small{font-size:.7em;color:#7a809c}
        .rp-card:active{transform:scale(.96)}
        .rp-cards.songs{grid-template-columns:repeat(4,minmax(0,1fr))}
        .rp-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        .rp-mini{position:absolute;left:12px;top:0;z-index:5;font-size:clamp(14px,1.8vw,17px);padding:6px 12px;min-height:44px}
        @media (max-aspect-ratio:1/1){
          .rp-cards,.rp-cards.songs{grid-template-columns:repeat(2,minmax(0,1fr))}
          .rp-kb{height:clamp(170px,30vh,260px);column-gap:4px}
          .rp-key{font-size:clamp(15px,4.4vw,22px);border-radius:0 0 12px 12px}
          .rp-mini{position:static}
        }
      `);

      /* ---------- 화면 ---------- */
      const wrap = U.el("div", "rp");
      const top = U.el("div", "rp-top");
      const bMenu = U.btn(KP.E("📋") + " 놀이 고르기", "btn rp-mini");
      const ear = U.el("div", "rp-ear", '<span class="e">' + KP.E("👂") + '</span><span class="t">마이크 꺼짐</span><span class="rp-meter"><i></i></span>');
      top.append(bMenu, ear);
      const mid = U.el("div", "rp-mid");
      const big = U.el("div", "rp-big", "");
      const sub = U.el("div", "rp-sub", "");
      const dots = U.el("div", "rp-dots");
      mid.append(big, sub, dots);
      const kb = U.el("div", "rp-kb");
      kb.appendChild(U.el("div", "rp-palm"));
      const fingEls = [0.64, 0.8, 0.92, 0.84, 0.66].map((h, i) => {
        const f = U.el("div", "rp-fing", "<b>" + (i + 1) + "</b>");
        f.style.gridColumn = String(i + 1);
        f.style.height = h * 100 + "%";
        f.style.setProperty("--c", KEYS[i][2]);
        kb.appendChild(f);
        return f;
      });
      const keyEls = KEYS.map(([n, sol, col], i) => {
        const k = U.btn("<span>" + sol + "</span>", "rp-key");
        k.style.gridColumn = String(i + 1);
        k.style.setProperty("--c", col);
        kb.appendChild(k);
        ctx.fast(k, () => {
          // 화면 건반도 됨(마이크 없을 때·엄마 아빠가 도와줄 때) — 이때는 앱이 소리를 냄
          A.unlock();
          playTone(n);
          deafFor(700);
          heard(i, true);
        });
        return k;
      });
      wrap.append(top, mid, kb);
      const ovStart = U.el("div", "rp-ov");
      const ovMenu = U.el("div", "rp-ov");
      const ovSong = U.el("div", "rp-ov");
      ctx.body.append(wrap, ovStart, ovMenu, ovSong);
      Object.assign(ctx, { wrap, ear, big, sub, dots, kb, keyEls, fingEls, ovStart, ovMenu, ovSong });

      function playTone(n) {
        const f = A.hz(n);
        A.tone(f, { type: "triangle", dur: 1.4, vol: 0.2, attack: 0.004 });
        A.tone(f * 2, { dur: 0.8, vol: 0.06, attack: 0.004 });
        A.tone(f * 3, { dur: 0.4, vol: 0.03, attack: 0.003 });
      }
      ctx.playTone = playTone;

      /* ---------- 마이크 ---------- */
      const M = (ctx.mic = { stream: null, src: null, an: null, buf: null, on: false, deafUntil: 0, tune: Number(KP.store.get("rp:tune", 0)) || 0, cents: [] });
      if (!Number.isFinite(M.tune) || Math.abs(M.tune) > 60) M.tune = 0;
      function deafFor(ms) {
        M.deafUntil = Math.max(M.deafUntil, performance.now() + ms);
      }
      ctx.deafFor = deafFor;
      /** 앱이 말할 때는 듣지 않기 */
      ctx.talk = (text, bubble = true) => {
        deafFor(60000);
        const p = bubble ? ctx.say(text) : KP.voice.say(text);
        return Promise.resolve(p).then(() => {
          M.deafUntil = performance.now() + 450;
        });
      };
      ctx.micOn = async function () {
        A.unlock();
        const c = A.ctx();
        if (!c || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return "nosupport";
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
          if (!ctx._active) {
            stream.getTracks().forEach((t) => t.stop());
            return "left";
          }
          M.stream = stream;
          M.src = c.createMediaStreamSource(stream);
          M.an = c.createAnalyser();
          M.an.fftSize = 2048;
          M.src.connect(M.an); // 스피커로는 보내지 않음
          M.buf = new Float32Array(M.an.fftSize);
          M.on = true;
          M.floor = 0.002;
          M.minSince = 1;
          M.lastPc = null;
          M.cand = null;
          M.silent = 0;
          M.acc = 0;
          ear.classList.add("on");
          ear.querySelector(".t").textContent = "듣고 있어요";
          if (c.state !== "running") c.resume().catch(() => {});
          listen();
          return "ok";
        } catch (e) {
          return e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "denied" : "error";
        }
      };
      ctx.micOff = function () {
        M.on = false;
        try {
          M.src && M.src.disconnect();
        } catch (e) {}
        if (M.stream) M.stream.getTracks().forEach((t) => t.stop());
        M.stream = M.src = M.an = null;
        ear.classList.remove("on");
        ear.querySelector(".t").textContent = "마이크 꺼짐";
        ear.querySelector("i").style.width = "0";
      };
      const meter = ear.querySelector("i");
      function listen() {
        ctx.loop((dt) => {
          if (!M.on || !M.an) return false;
          M.acc += dt;
          if (M.acc < 0.016) return; // 너무 잦은 계산 방지(약 60번/초)
          const step = M.acc * 1000;
          M.acc = 0;
          const sr = M.an.context.sampleRate;
          M.an.getFloatTimeDomainData(M.buf);
          let e = 0;
          for (let i = 0; i < M.buf.length; i++) e += M.buf[i] * M.buf[i];
          const rms = Math.sqrt(e / M.buf.length);
          meter.style.width = U.clamp(((20 * Math.log10(rms + 1e-9) + 60) / 50) * 100, 0, 100) + "%";
          // 주변 소음 바닥값(천천히 올라가고 바로 내려감)
          M.floor = Math.min(M.floor * 1.004 + 1e-6, Math.max(rms, 0.0005));
          const gate = Math.max(0.004, M.floor * 3.5);
          const now = performance.now();
          const deaf = now < M.deafUntil || KP.voice.busy();
          if (rms < gate) {
            M.silent += step;
            if (M.silent > 140) M.lastPc = null;
            M.cand = null;
            M.minSince = Math.min(M.minSince, rms);
            return;
          }
          M.silent = 0;
          if (deaf) {
            M.cand = null;
            M.minSince = rms; // 같은 음이 울리는 중이면 다시 세지 않음(새로 쳐야 셈)
            return;
          }
          // 새로 친 소리(세기가 확 커짐)
          if (rms > Math.max(M.minSince * 1.8, gate * 1.4)) M.armed = true;
          M.minSince = Math.min(M.minSince, rms);
          const r = mpm(M.buf, sr, 100, 1100);
          if (!r || r.clarity < 0.86) {
            M.cand = null;
            return;
          }
          const m = 69 + 12 * Math.log2(r.f / 440) - M.tune / 100;
          const rm = Math.round(m);
          const pc = ((rm % 12) + 12) % 12;
          if (Math.abs(m - rm) > 0.42) {
            M.cand = null; // 두 음 사이 애매한 높이 → 판단 보류
            return;
          }
          if (M.cand && M.cand.pc === pc) {
            M.cand.n++;
            M.cand.c += m - rm;
          } else M.cand = { pc, n: 1, c: m - rm };
          if (M.cand.n >= 3 && (pc !== M.lastPc || M.armed)) {
            M.lastPc = pc;
            M.armed = false;
            M.minSince = rms;
            learnTune((M.cand.c / M.cand.n) * 100);
            onPc(pc);
          }
        });
      }
      /** 피아노가 전체적으로 높거나 낮게 조율돼 있으면 천천히 맞춰 감 */
      function learnTune(c) {
        M.cents.push(c);
        if (M.cents.length < 8) return;
        const s = M.cents.slice().sort((a, b) => a - b);
        const med = s[s.length >> 1];
        M.cents = [];
        M.tune = U.clamp(M.tune + med * 0.5, -60, 60);
        KP.store.set("rp:tune", Math.round(M.tune));
      }
      function onPc(pc) {
        const want = ctx.wantIdx;
        let i = KEYS.findIndex((k) => k[3] === pc);
        if (i < 0) {
          // 검은 건반(반음)
          ctx.sub.textContent = "검은 건반 소리가 들렸어요";
          return;
        }
        if (pc === 0 && want === 7) i = 7;
        heard(i, false);
      }
      /** 음 하나를 알아챔(마이크 또는 화면 건반) */
      function heard(i, byTap) {
        const k = keyEls[i];
        k.classList.add("lit");
        ctx.after(260, () => k.classList.remove("lit"));
        big.textContent = KEYS[i][1];
        big.style.color = KEYS[i][2];
        U.replay(big, "pop");
        self.onNote(ctx, i, byTap);
      }

      /* ---------- 시작(마이크 켜기) 화면 ---------- */
      ovStart.innerHTML =
        "<h3>" + KP.E("🎹") + " 진짜 피아노를 쳐 볼까요?</h3>" +
        "<p>피아노(키보드·실로폰) 바로 옆에 아이패드를 세워 두고 아래 단추를 눌러 주세요.<br>마이크를 허용하면 아이가 친 음을 알아들어요. 주변이 조용할수록 잘 들어요.</p>";
      const sRow = U.el("div", "rp-row");
      const bMic = U.btn(KP.E("🎤") + " 피아노 소리 듣기 시작", "btn big primary");
      const bNoMic = U.btn(KP.E("👆") + " 마이크 없이 화면 건반으로", "btn");
      sRow.append(bMic, bNoMic);
      const sMsg = U.el("p", "", "");
      ovStart.append(sRow, sMsg);
      ctx.tap(bMic, async () => {
        if (bMic.disabled) return;
        bMic.disabled = true;
        sMsg.textContent = "마이크를 켜는 중…";
        const r = await ctx.micOn();
        bMic.disabled = false;
        if (r === "ok") {
          sMsg.textContent = "";
          ovStart.classList.remove("show");
          self.menu(ctx);
        } else if (r === "denied") sMsg.textContent = "마이크가 허용되지 않았어요. 아이패드 설정 › Safari › 마이크(또는 이 앱)에서 허용한 뒤 다시 눌러 주세요. 화면 건반으로도 놀 수 있어요.";
        else if (r !== "left") sMsg.textContent = "이 기기에서는 마이크를 쓸 수 없어요. 화면 건반으로 놀아요.";
      });
      ctx.tap(bNoMic, () => {
        ovStart.classList.remove("show");
        self.menu(ctx);
      });
      ctx.tap(bMenu, () => {
        A.sfx("open");
        self.menu(ctx);
      });

      /* ---------- 놀이 고르기 ---------- */
      ovMenu.innerHTML = "<h3>" + KP.E("🎼") + " 무엇을 할까요?</h3>";
      const cards = U.el("div", "rp-cards");
      [
        ["free", "🎵", "마음대로 쳐요", "친 음이 화면에 반짝"],
        ["follow", "✋", "손 자리 따라 치기", "반짝이는 건반을 쳐요"],
        ["echo", "🦜", "메아리 놀이", "들은 음을 똑같이"],
      ].forEach(([id, em, name, d], i) => {
        const c = U.btn('<span class="e">' + KP.E(em) + "</span>" + name + "<small>" + d + "</small>", "rp-card");
        c.style.setProperty("--i", i);
        ctx.tap(c, () => {
          A.sfx("select");
          ovMenu.classList.remove("show");
          if (id === "follow") self.songMenu(ctx);
          else self.begin(ctx, id);
        });
        cards.appendChild(c);
      });
      ovMenu.appendChild(cards);

      /* ---------- 노래 고르기 ---------- */
      ovSong.innerHTML = "<h3>" + KP.E("✋") + " 어떤 노래를 칠까요?</h3><p>오른손 엄지(1번)를 도에 올려요. 손가락 번호와 건반 색이 같아요.</p>";
      const scards = U.el("div", "rp-cards songs");
      SONGS.forEach((s, i) => {
        const c = U.btn('<span class="e">' + KP.E(s.em) + "</span>" + s.name, "rp-card");
        c.style.setProperty("--i", i);
        ctx.tap(c, () => {
          A.sfx("select");
          ovSong.classList.remove("show");
          ctx.song = s;
          self.begin(ctx, "follow");
        });
        scards.appendChild(c);
      });
      ovSong.appendChild(scards);
    },

    start(ctx) {
      ctx.mode = null;
      ctx.wantIdx = -1;
      this.clearMarks(ctx);
      ctx.big.textContent = "";
      ctx.sub.textContent = "";
      ctx.dots.innerHTML = "";
      [ctx.ovMenu, ctx.ovSong].forEach((o) => o.classList.remove("show"));
      if (ctx.mic.on) this.menu(ctx);
      else {
        ctx.ovStart.classList.add("show");
        ctx.say("진짜 피아노를 치면 아이패드가 들어요! 엄마 아빠, 아래 단추를 눌러 주세요.");
      }
    },
    stop(ctx) {
      ctx.micOff();
      KP.voice.stop();
    },

    menu(ctx) {
      ctx.mode = null;
      ctx.wantIdx = -1;
      this.clearMarks(ctx);
      ctx.ovSong.classList.remove("show");
      ctx.ovMenu.classList.add("show");
      ctx.talk("무엇을 할까요? 골라 보세요!");
    },
    songMenu(ctx) {
      ctx.ovSong.classList.add("show");
      ctx.talk("어떤 노래를 칠까요?");
    },
    clearMarks(ctx) {
      ctx.keyEls.forEach((k) => k.classList.remove("want", "heard"));
      ctx.fingEls.forEach((f) => f.classList.remove("go"));
    },
    mark(ctx, i) {
      this.clearMarks(ctx);
      ctx.wantIdx = i;
      if (i < 0) return;
      ctx.keyEls[i].classList.add("want");
      if (i < 5) ctx.fingEls[i].classList.add("go");
    },

    /* ---------- 놀이 시작 ---------- */
    begin(ctx, mode) {
      ctx.mode = mode;
      ctx.tok = (ctx.tok || 0) + 1;
      ctx.big.textContent = "";
      ctx.dots.innerHTML = "";
      ctx.kb.classList.toggle("nohand", mode === "free");
      const how = ctx.mic.on ? "진짜 피아노로" : "화면 건반을 눌러서";
      if (mode === "free") {
        ctx.count = 0;
        this.mark(ctx, -1);
        ctx.sub.textContent = ctx.mic.on ? "피아노를 쳐 보세요. 친 음이 여기 나와요!" : "화면 건반을 눌러 보세요!";
        ctx.talk(how + " 마음대로 쳐 봐요! 친 음이 화면에 반짝여요.");
      } else if (mode === "follow") this.songStart(ctx);
      else this.echoRound(ctx);
    },

    /** 소리를 하나 알아들었을 때 */
    onNote(ctx, i, byTap) {
      if (ctx.mode === "free") {
        ctx.count++;
        ctx.sub.textContent = KEYS[i][1] + "! " + (ctx.count % 10 === 0 ? "우와, " + ctx.count + "개 쳤어요!" : "");
        if (ctx.count % 20 === 0) this.celebrate(ctx, false);
      } else if (ctx.mode === "follow") this.songHit(ctx, i);
      else if (ctx.mode === "echo") this.echoHit(ctx, i);
    },
    /** 축하(축하 소리를 아이 소리로 듣지 않게 그동안 귀 닫기) */
    async celebrate(ctx, big, msg) {
      ctx.deafFor(60000);
      const ok = await ctx.win({ big, msg });
      ctx.mic.deafUntil = performance.now() + 500;
      return ok;
    },

    /* ---------- ✋ 손 자리 따라 치기 ---------- */
    songStart(ctx) {
      const s = ctx.song || SONGS[0];
      const all = s.notes || KP.audio.SONGS[s.song].notes.filter((n) => n[0] !== "R").map((n) => n[0]);
      const len = ctx.level === 1 ? Math.min(all.length, s.notes ? all.length : 7) : ctx.level === 2 ? Math.ceil(all.length / 2) : all.length;
      ctx.seq = all.slice(0, len).map((n) => KEYS.findIndex((k) => k[0] === n));
      ctx.pos = 0;
      ctx.dots.innerHTML = "";
      ctx.seq.forEach((k) => {
        const d = document.createElement("i");
        d.style.setProperty("--c", KEYS[k][2]);
        ctx.dots.appendChild(d);
      });
      ctx.big.textContent = "";
      ctx.talk(s.name + "! 오른손 엄지를 빨간 도에 올려요. 반짝이는 건반을 쳐요!");
      this.songShow(ctx);
    },
    songShow(ctx) {
      const i = ctx.seq[ctx.pos];
      this.mark(ctx, i);
      [...ctx.dots.children].forEach((d, k) => {
        d.classList.toggle("ok", k < ctx.pos);
        d.classList.toggle("now", k === ctx.pos);
      });
      ctx.big.textContent = KEYS[i][1];
      ctx.big.style.color = KEYS[i][2];
      ctx.sub.innerHTML = (i < 5 ? KP.E(["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][i]) + " " + FINGER[i] + "으로 " : "") + "<b style='color:" + KEYS[i][2] + "'>" + KEYS[i][1] + "</b>";
      this.idle(ctx);
    },
    /** 한참 못 치면 손가락을 다시 알려 줌 (아이 소리를 듣는 동안 앱이 계속 떠들지 않게 12초 간격) */
    idle(ctx) {
      const tok = ctx.tok,
        pos = ctx.pos,
        mode = ctx.mode;
      ctx.after(12000, () => {
        if (tok !== ctx.tok || ctx.pos !== pos || ctx.mode !== mode || ctx.busy) return;
        if (mode === "echo") return this.echoPlay(ctx); // 다시 들려준 뒤 echoPlay 가 다음 기다림을 잡음
        const i = ctx.seq[ctx.pos];
        ctx.talk((i < 5 ? FINGER[i] + "으로 " : "") + KEYS[i][1] + "를 쳐요!", false);
        this.idle(ctx);
      });
    },
    async songHit(ctx, i) {
      if (ctx.busy) return;
      const want = ctx.seq[ctx.pos];
      if (i !== want) {
        ctx.keyEls[i].classList.add("heard");
        ctx.after(400, () => {
          ctx.keyEls[i].classList.remove("heard");
          if (ctx.mode === "follow" && !ctx.busy) {
            ctx.big.textContent = KEYS[want][1];
            ctx.big.style.color = KEYS[want][2];
          }
        });
        return; // 틀려도 아무 벌 없음 — 반짝이는 건반을 기다림
      }
      ctx.pos++;
      KP.audio.sfx("tap");
      ctx.deafFor(120);
      if (ctx.pos < ctx.seq.length) return this.songShow(ctx);
      // 한 곡 끝
      ctx.busy = true;
      this.mark(ctx, -1);
      [...ctx.dots.children].forEach((d) => d.classList.add("ok"));
      const tok = ctx.tok;
      ctx.round = (ctx.round || 0) + 1;
      const ok = await this.celebrate(ctx, ctx.round % 3 === 0, (ctx.song || SONGS[0]).name + " 완성!");
      ctx.busy = false;
      if (!ok || tok !== ctx.tok) return;
      this.songStart(ctx);
    },

    /* ---------- 🦜 메아리 놀이 ---------- */
    echoRound(ctx) {
      const n = ctx.level; // 1~3음
      const pool = ctx.level === 1 ? [0, 2, 4] : [0, 1, 2, 3, 4];
      ctx.seq = [];
      for (let k = 0; k < n; k++) {
        let x;
        do x = KP.u.pick(pool);
        while (ctx.seq.length && x === ctx.seq[ctx.seq.length - 1] && pool.length > 1);
        ctx.seq.push(x);
      }
      ctx.pos = 0;
      ctx.wrong = 0;
      ctx.dots.innerHTML = "";
      ctx.seq.forEach(() => ctx.dots.appendChild(document.createElement("i")));
      ctx.big.textContent = "";
      ctx.sub.textContent = "잘 들어요…";
      this.mark(ctx, -1);
      const tok = ctx.tok;
      ctx.talk(n === 1 ? "잘 듣고 똑같이 쳐 봐요!" : "잘 듣고 " + n + "개를 똑같이 쳐 봐요!").then(() => tok === ctx.tok && this.echoPlay(ctx));
    },
    async echoPlay(ctx) {
      const tok = ctx.tok;
      ctx.busy = true;
      ctx.pos = 0;
      [...ctx.dots.children].forEach((d) => d.classList.remove("ok", "now"));
      ctx.deafFor(60000);
      for (const i of ctx.seq) {
        if (tok !== ctx.tok) return;
        const k = ctx.keyEls[i];
        k.classList.add("lit");
        ctx.playTone(KEYS[i][0]);
        await ctx.wait(650);
        k.classList.remove("lit");
        await ctx.wait(150);
      }
      if (tok !== ctx.tok) return;
      ctx.mic.deafUntil = performance.now() + 900; // 남은 울림이 사라질 때까지
      ctx.busy = false;
      ctx.sub.textContent = ctx.mic.on ? "이제 피아노로 따라 쳐요!" : "이제 건반을 눌러요!";
      if (ctx.level === 1) this.mark(ctx, ctx.seq[0]); // 1단계는 칠 건반을 알려 줌
      this.idle(ctx);
    },
    async echoHit(ctx, i) {
      if (ctx.busy) return;
      const want = ctx.seq[ctx.pos];
      if (i !== want) {
        ctx.keyEls[i].classList.add("heard");
        ctx.after(400, () => ctx.keyEls[i].classList.remove("heard"));
        ctx.wrong++;
        if (ctx.wrong >= 3) {
          ctx.wrong = 0;
          const tok = ctx.tok;
          ctx.talk("한 번 더 들어 봐요!", false).then(() => tok === ctx.tok && this.echoPlay(ctx));
        }
        return;
      }
      const d = ctx.dots.children[ctx.pos];
      d.style.setProperty("--c", KEYS[i][2]);
      d.classList.add("ok");
      ctx.pos++;
      KP.audio.sfx("tap");
      ctx.deafFor(120);
      if (ctx.pos < ctx.seq.length) {
        if (ctx.level === 1) this.mark(ctx, ctx.seq[ctx.pos]);
        return;
      }
      ctx.busy = true;
      this.mark(ctx, -1);
      const tok = ctx.tok;
      ctx.round = (ctx.round || 0) + 1;
      const ok = await this.celebrate(ctx, ctx.round % 4 === 0, "똑같이 쳤어요!");
      ctx.busy = false;
      if (!ok || tok !== ctx.tok) return;
      this.echoRound(ctx);
    },
  });
})();
