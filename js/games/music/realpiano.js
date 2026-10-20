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

  /* ---------- 귀(소리 → 음이름) : 화면과 떨어진 순수 계산 — 점검 스크립트에서도 그대로 씀 ----------
     ① MPM 으로 소리 높이를 찾아 음이름으로 (3번 연속 같아야 인정)
     ② 칠 음을 아는 놀이(따라 치기·메아리·노래 게임)에서는 "기대 음 확인"도 함께:
        그 음의 배음(1~6배)이 소리 안에 다른 음보다 뚜렷하면 인정 (2번 연속)
        → 약지로 파를 칠 때 옆 건반(미·솔)이 같이 눌려 높이가 섞여도 알아챔 */
  const HW = [1, 1, 0.8, 0.6, 0.5, 0.4];
  function makeEar(opt) {
    const E = { floor: 0.002, minSince: 1, lastPc: null, cand: null, silent: 0, armed: false, tune: (opt && opt.tune) || 0, cents: [], onTune: opt && opt.onTune };
    let win = null,
      re = null,
      im = null,
      mag = null,
      rev = null,
      cosT = null,
      sinT = null;
    /** 크기 N(2의 거듭제곱) FFT → mag[k] (Hann 창) — 배음 216개를 하나씩 계산하는 것보다 약 20배 가벼움 */
    function spectrum(buf) {
      const N = buf.length;
      if (!win || win.length !== N) {
        win = new Float32Array(N);
        re = new Float32Array(N);
        im = new Float32Array(N);
        mag = new Float32Array(N >> 1);
        rev = new Uint32Array(N);
        cosT = new Float32Array(N >> 1);
        sinT = new Float32Array(N >> 1);
        const bits = Math.round(Math.log2(N));
        for (let i = 0; i < N; i++) {
          win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
          let r = 0;
          for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
          rev[i] = r;
        }
        for (let i = 0; i < N >> 1; i++) {
          cosT[i] = Math.cos((2 * Math.PI * i) / N);
          sinT[i] = -Math.sin((2 * Math.PI * i) / N);
        }
      }
      for (let i = 0; i < N; i++) {
        re[rev[i]] = buf[i] * win[i];
        im[i] = 0;
      }
      for (let size = 2; size <= N; size <<= 1) {
        const half = size >> 1,
          step = N / size;
        for (let i = 0; i < N; i += size)
          for (let j = 0, k = 0; j < half; j++, k += step) {
            const a = i + j,
              b = a + half;
            const tr = re[b] * cosT[k] - im[b] * sinT[k],
              ti = re[b] * sinT[k] + im[b] * cosT[k];
            re[b] = re[a] - tr;
            im[b] = im[a] - ti;
            re[a] += tr;
            im[a] += ti;
          }
      }
      for (let k = 0; k < N >> 1; k++) mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / N;
      return mag;
    }
    /** 음이름 12개 각각의 뚜렷함 (도3~시5 중 가장 큰 옥타브, 배음 1~6배) */
    E.salience = function (buf, sr) {
      const N = buf.length,
        M = spectrum(buf),
        df = sr / N,
        top = M.length - 2;
      const at = (f) => {
        const x = f / df,
          k = Math.round(x);
        if (k < 1 || k > top) return 0;
        return Math.max(M[k], 0.7 * Math.max(M[k - 1], M[k + 1])); // 약간 어긋난 배음도 잡게
      };
      const S = new Float32Array(12);
      for (let pc = 0; pc < 12; pc++) {
        let best = 0;
        for (let oct = 3; oct <= 5; oct++) {
          const f0 = 440 * Math.pow(2, (12 * (oct + 1) + pc - 69 + E.tune / 100) / 12);
          let sum = 0;
          for (let h = 1; h <= 6; h++) {
            const f = f0 * h * Math.sqrt(1 + 0.0004 * h * h); // 피아노 배음은 살짝 높음
            if (f > 4200) break;
            sum += HW[h - 1] * at(f);
          }
          if (sum > best) best = sum;
        }
        S[pc] = best;
      }
      return S;
    };
    function learn(c) {
      E.cents.push(c);
      if (E.cents.length < 8) return;
      const s = E.cents.slice().sort((a, b) => a - b);
      const med = s[s.length >> 1];
      E.cents = [];
      E.tune = Math.max(-60, Math.min(60, E.tune + med * 0.5));
      if (E.onTune) E.onTune(E.tune);
    }
    /** 소리 한 덩어리(최근 4096개) → { rms, f, clarity, pc(새로 친 음이면), via } */
    E.feed = function (buf, sr, stepMs, deaf, expect) {
      const N = buf.length,
        n2 = Math.min(2048, N),
        b2 = buf.subarray(N - n2);
      let e = 0;
      for (let i = 0; i < n2; i++) e += b2[i] * b2[i];
      const rms = Math.sqrt(e / n2);
      const out = { rms };
      E.floor = Math.min(E.floor * 1.004 + 1e-6, Math.max(rms, 0.0005)); // 주변 소음(천천히 오르고 바로 내림)
      const gate = Math.max(0.004, E.floor * 3.5);
      if (rms < gate) {
        E.silent += stepMs;
        if (E.silent > 140) E.lastPc = null;
        E.cand = null;
        E.minSince = Math.min(E.minSince, rms);
        return out;
      }
      E.silent = 0;
      if (deaf) {
        E.cand = null;
        E.minSince = rms; // 앱 소리·울림 중 — 새로 쳐야 셈
        return out;
      }
      if (rms > Math.max(E.minSince * 1.8, gate * 1.4)) E.armed = true; // 새로 친 소리(세기가 확 커짐)
      E.minSince = Math.min(E.minSince, rms);
      let pc = null,
        dev = 0,
        via = "";
      const r = mpm(b2, sr, 100, 1100);
      if (r) {
        out.f = r.f;
        out.clarity = r.clarity;
        if (r.clarity >= 0.8) {
          const m = 69 + 12 * Math.log2(r.f / 440) - E.tune / 100;
          const rm = Math.round(m);
          if (Math.abs(m - rm) <= 0.42) {
            pc = ((rm % 12) + 12) % 12;
            dev = m - rm;
            via = "pitch";
          }
        }
      }
      if (expect == null && pc != null) {
        // 자유 연주: 높이로 찾은 음이 실제 배음 분포와 안 맞으면(두 건반이 섞인 경우) 가장 뚜렷한 음으로 바로잡기
        const S = E.salience(buf, sr);
        let mx = 0,
          arg = pc;
        for (let k = 0; k < 12; k++)
          if (S[k] > mx) {
            mx = S[k];
            arg = k;
          }
        if (S[pc] < 0.5 * mx) {
          pc = arg;
          via = "sal";
        }
      }
      if (expect != null && pc !== expect) {
        const S = E.salience(buf, sr);
        let mx = 0;
        for (let k = 0; k < 12; k++) mx = Math.max(mx, S[k]);
        out.sal = S[expect] / (mx || 1);
        if (S[expect] >= 0.6 * mx && S[expect] >= rms * 0.12) {
          pc = expect;
          via = "expect";
        }
      }
      if (pc == null) {
        E.cand = null;
        return out;
      }
      if (E.cand && E.cand.pc === pc) {
        E.cand.n++;
        if (via === "pitch") {
          E.cand.k++;
          E.cand.c += dev;
        }
      } else E.cand = { pc, n: 1, k: via === "pitch" ? 1 : 0, c: via === "pitch" ? dev : 0 };
      const need = pc === expect ? 2 : 3;
      if (E.cand.n >= need && (pc !== E.lastPc || E.armed)) {
        E.lastPc = pc;
        E.armed = false;
        E.minSince = rms;
        if (E.cand.k >= 2) learn((E.cand.c / E.cand.k) * 100);
        out.pc = pc;
        out.via = via;
      }
      return out;
    };
    return E;
  }
  KP.pianoEar = makeEar; // 점검용

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
    { id: "twinkle", em: "⭐", name: "반짝반짝 작은 별", song: "twinkle" },
    { id: "schoolbell", em: "🔔", name: "학교종", song: "schoolbell" },
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
        .rp-cards.songs{grid-template-columns:repeat(3,minmax(0,1fr))}
        .rp-cards.four{grid-template-columns:repeat(4,minmax(0,1fr))}
        .rp-diag{font-size:13px;color:#9aa0bb;min-height:1.2em}
        .rp.game .rp-mid{display:none}
        .rp.game .rp-kb{grid-template-rows:0 1fr;height:clamp(110px,22vh,200px);row-gap:0}
        .rp.game .rp-palm,.rp.game .rp-fing{display:none}
        .rp.game .rp-key{border-radius:0 0 18px 18px}
        .rp-lanes{display:none;flex:1;min-height:0;flex-direction:column;gap:6px}
        .rp.game .rp-lanes{display:flex}
        .rp-gbar{flex:0 0 auto;display:flex;align-items:center;gap:10px;justify-content:center}
        .rp-track{position:relative;flex:1;max-width:620px;height:16px;border-radius:10px;background:#e3e7f1}
        .rp-track i{position:absolute;left:0;top:0;bottom:0;border-radius:10px;background:linear-gradient(90deg,#ffd23f,#ff9a2e);width:0;transition:width .3s}
        .rp-runner{position:absolute;top:50%;transform:translate(-50%,-62%);font-size:34px;line-height:1;transition:left .3s;left:0}
        .rp-goal{font-size:30px;line-height:1}
        .rp-score{font-size:clamp(18px,2.4vw,24px);color:var(--ink);min-width:3.5em;text-align:center}
        .rp-listen{font-size:clamp(14px,1.8vw,17px);padding:6px 12px;min-height:44px}
        .rp-field{flex:1;min-height:0;display:grid;grid-template-columns:repeat(8,1fr);column-gap:6px;position:relative;border-bottom:5px solid #ffd23f;border-radius:14px 14px 0 0}
        .rp-lane{position:relative;overflow:hidden;background:repeating-linear-gradient(180deg,rgba(255,255,255,.55) 0 2px,transparent 2px 46px);border-radius:12px 12px 0 0}
        .rp-lane:nth-child(odd){background-color:rgba(255,255,255,.35)}
        .rp-blk{position:absolute;left:4%;right:4%;bottom:0;border-radius:14px;background:var(--c);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:6px;gap:2px;font-size:clamp(15px,2.2vw,22px);box-shadow:0 4px 0 rgba(0,0,0,.12);will-change:transform}
        .rp-blk b{width:clamp(22px,3.2vw,30px);height:clamp(22px,3.2vw,30px);border-radius:50%;background:#fff;color:var(--c);display:flex;align-items:center;justify-content:center;font-size:.85em;font-weight:400}
        .rp-blk.wait{animation:rpWait .6s ease-in-out infinite}
        @keyframes rpWait{50%{filter:brightness(1.25);box-shadow:0 0 0 5px #fff,0 0 18px 6px var(--c)}}
        .rp-blk.hit{animation:rpHit .45s ease-out forwards}
        @keyframes rpHit{to{transform:translateY(0) scale(1.4);opacity:0}}
        .rp-pop{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:clamp(28px,4vw,40px);pointer-events:none;animation:rpFly .8s ease-out forwards;z-index:3}
        @keyframes rpFly{to{transform:translate(-50%,-140px) scale(1.3);opacity:0}}
        .rp-cheer{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-size:clamp(26px,4vw,40px);color:var(--ink);background:#fff;border-radius:999px;padding:6px 18px;box-shadow:var(--shadow);pointer-events:none;animation:rpCheer .9s ease-out forwards;z-index:4;white-space:nowrap}
        @keyframes rpCheer{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}25%{transform:translate(-50%,-50%) scale(1.1);opacity:1}100%{transform:translate(-50%,-90%) scale(1);opacity:0}}
        .rp-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
        .rp-mini{position:absolute;left:12px;top:0;z-index:5;font-size:clamp(14px,1.8vw,17px);padding:6px 12px;min-height:44px}
        @media (max-aspect-ratio:1/1){
          .rp-cards,.rp-cards.songs,.rp-cards.four{grid-template-columns:repeat(2,minmax(0,1fr))}
          .rp-field{column-gap:4px}
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
      const diag = U.el("div", "rp-diag", "");
      mid.append(big, sub, dots, diag);
      // 🎮 노래 게임 화면: 위 진행 막대(토끼가 깃발까지) + 8줄 떨어지는 음표
      const lanes = U.el("div", "rp-lanes");
      const gbar = U.el("div", "rp-gbar");
      const bListen = U.btn(KP.E("👂") + " 들어 보기", "btn rp-listen");
      const track = U.el("div", "rp-track", '<i></i><span class="rp-runner">' + KP.E("🐰") + "</span>");
      const score = U.el("div", "rp-score", KP.E("⭐") + " 0");
      gbar.append(bListen, track, U.el("span", "rp-goal", KP.E("🥕")), score);
      const field = U.el("div", "rp-field");
      const laneEls = KEYS.map(() => field.appendChild(U.el("div", "rp-lane")));
      lanes.append(gbar, field);
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
      wrap.append(top, mid, lanes, kb);
      ctx.tap(bListen, () => self.gameListen(ctx));
      const ovStart = U.el("div", "rp-ov");
      const ovMenu = U.el("div", "rp-ov");
      const ovSong = U.el("div", "rp-ov");
      ctx.body.append(wrap, ovStart, ovMenu, ovSong);
      Object.assign(ctx, { wrap, ear, big, sub, dots, diag, kb, keyEls, fingEls, ovStart, ovMenu, ovSong, lanes, field, laneEls, track, scoreEl: score, bListen });

      function playTone(n) {
        const f = A.hz(n);
        A.tone(f, { type: "triangle", dur: 1.4, vol: 0.2, attack: 0.004 });
        A.tone(f * 2, { dur: 0.8, vol: 0.06, attack: 0.004 });
        A.tone(f * 3, { dur: 0.4, vol: 0.03, attack: 0.003 });
      }
      ctx.playTone = playTone;

      /* ---------- 마이크 ---------- */
      const M = (ctx.mic = { stream: null, src: null, an: null, buf: null, on: false, deafUntil: 0, tune: Number(KP.store.get("rp:tune", 0)) || 0 });
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
          M.an.fftSize = 4096; // 최근 약 0.09초 (높이는 뒤쪽 2048개로, 기대 음 확인은 전체로)
          M.src.connect(M.an); // 스피커로는 보내지 않음
          M.buf = new Float32Array(M.an.fftSize);
          M.on = true;
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
        const E = (M.ear = makeEar({ tune: M.tune, onTune: (t) => KP.store.set("rp:tune", Math.round((M.tune = t))) }));
        ctx.loop((dt) => {
          if (!M.on || !M.an) return false;
          M.acc += dt;
          if (M.acc < 0.016) return; // 약 60번/초
          const step = M.acc * 1000;
          M.acc = 0;
          M.an.getFloatTimeDomainData(M.buf);
          const deaf = performance.now() < M.deafUntil || KP.voice.busy();
          const want = ctx.wantIdx >= 0 ? KEYS[ctx.wantIdx][3] : null;
          const r = E.feed(M.buf, M.an.context.sampleRate, step, deaf, want);
          meter.style.width = U.clamp(((20 * Math.log10(r.rms + 1e-9) + 60) / 50) * 100, 0, 100) + "%";
          if (ctx.mode === "free" && r.f) ctx.diag.textContent = Math.round(r.f) + "Hz · 선명도 " + r.clarity.toFixed(2) + (r.sal != null ? " · 기대음 " + Math.round(r.sal * 100) + "%" : "") + " · 조율 " + Math.round(E.tune) + "c";
          if (r.pc != null) onPc(r.pc);
        });
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
      const cards = U.el("div", "rp-cards four");
      [
        ["free", "🎵", "마음대로 쳐요", "친 음이 화면에 반짝"],
        ["follow", "✋", "손 자리 따라 치기", "반짝이는 건반을 쳐요"],
        ["game", "🎮", "노래 게임", "내려오는 음표를 쳐요"],
        ["echo", "🦜", "메아리 놀이", "들은 음을 똑같이"],
      ].forEach(([id, em, name, d], i) => {
        const c = U.btn('<span class="e">' + KP.E(em) + "</span>" + name + "<small>" + d + "</small>", "rp-card");
        c.style.setProperty("--i", i);
        ctx.tap(c, () => {
          A.sfx("select");
          ovMenu.classList.remove("show");
          if (id === "follow" || id === "game") self.songMenu(ctx, id);
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
          self.begin(ctx, ctx.songFor || "follow");
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
      ctx.tok = (ctx.tok || 0) + 1;
      ctx.busy = false;
      ctx.wrap.classList.remove("game");
      ctx.wantIdx = -1;
      this.clearMarks(ctx);
      ctx.ovSong.classList.remove("show");
      ctx.ovMenu.classList.add("show");
      ctx.talk("무엇을 할까요? 골라 보세요!");
    },
    songMenu(ctx, target) {
      ctx.songFor = target || "follow";
      ctx.ovSong.querySelector("h3").innerHTML = KP.E(ctx.songFor === "game" ? "🎮" : "✋") + (ctx.songFor === "game" ? " 어떤 노래로 게임할까요?" : " 어떤 노래를 칠까요?");
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
      ctx.kb.classList.toggle("nohand", mode === "free" || mode === "game");
      ctx.wrap.classList.toggle("game", mode === "game");
      ctx.diag.textContent = "";
      ctx.busy = false;
      const how = ctx.mic.on ? "진짜 피아노로" : "화면 건반을 눌러서";
      if (mode === "free") {
        ctx.count = 0;
        this.mark(ctx, -1);
        ctx.sub.textContent = ctx.mic.on ? "피아노를 쳐 보세요. 친 음이 여기 나와요!" : "화면 건반을 눌러 보세요!";
        ctx.talk(how + " 마음대로 쳐 봐요! 친 음이 화면에 반짝여요.");
      } else if (mode === "follow") this.songStart(ctx);
      else if (mode === "game") this.gameStart(ctx, true);
      else this.echoRound(ctx);
    },

    /** 소리를 하나 알아들었을 때 */
    onNote(ctx, i, byTap) {
      if (ctx.mode === "free") {
        ctx.count++;
        ctx.sub.textContent = KEYS[i][1] + "! " + (ctx.count % 10 === 0 ? "우와, " + ctx.count + "개 쳤어요!" : "");
        if (ctx.count % 20 === 0) this.celebrate(ctx, false);
      } else if (ctx.mode === "follow") this.songHit(ctx, i);
      else if (ctx.mode === "game") this.gameHit(ctx, i);
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

    /* ---------- 🎮 노래 게임 ----------
       8줄로 음표 블록이 내려와 노란 줄에 닿으면 멈춰서 기다림(아이가 칠 때까지 — 놓쳐서 실패하는 일 없음)
       블록 길이 = 음 길이, 블록 안에 손가락 번호. 맞게 치면 별이 톡, 토끼가 당근까지 한 칸씩.
       다 치면 앱이 방금 친 노래를 이어서 들려주고 축하. 👂 들어 보기로 먼저 들어 볼 수도 있음 */
    gameNotes(ctx) {
      const s = ctx.song || SONGS[0];
      const raw = s.notes ? s.notes.map((n) => [n, 1]) : KP.audio.SONGS[s.song].notes;
      const playable = raw.filter((n) => n[0] !== "R").length;
      const want = ctx.level === 1 ? Math.min(playable, s.notes ? playable : 8) : ctx.level === 2 ? Math.ceil(playable / 2) : playable;
      const list = [];
      let beat = 0;
      for (const [n, b] of raw) {
        if (list.length >= want) break;
        if (n !== "R") list.push({ k: KEYS.findIndex((x) => x[0] === n), beat, len: b });
        beat += b;
      }
      return list;
    },
    gameStart(ctx, intro) {
      const U = KP.u,
        s = ctx.song || SONGS[0];
      ctx.tok = (ctx.tok || 0) + 1;
      const tok = ctx.tok;
      ctx.busy = false;
      ctx.laneEls.forEach((l) => (l.innerHTML = ""));
      const list = this.gameNotes(ctx);
      const g = (ctx.g = { list, pos: 0, cur: -3, bps: [0.75, 0.95, 1.15][ctx.level - 1] || 0.95, score: 0, combo: 0, waitT: 0, ended: false, laneH: 0, ppb: 80 });
      list.forEach((n) => {
        const el = U.el("div", "rp-blk", (n.k < 5 ? "<b>" + (n.k + 1) + "</b>" : "") + "<span>" + KEYS[n.k][1] + "</span>");
        el.style.setProperty("--c", KEYS[n.k][2]);
        el.style.display = "none";
        ctx.laneEls[n.k].appendChild(el);
        n.el = el;
      });
      ctx.scoreEl.innerHTML = KP.E("⭐") + " 0";
      this.gameProg(ctx);
      this.mark(ctx, list[0].k);
      ctx.fingEls.forEach((f) => f.classList.remove("go"));
      if (intro) ctx.talk(s.name + "! 음표가 노란 줄에 닿으면 그 건반을 쳐요!");
      ctx.loop((dt) => {
        if (tok !== ctx.tok || ctx.mode !== "game") return false;
        const H = ctx.field.clientHeight;
        if (H !== g.laneH && H > 0) {
          g.laneH = H;
          g.ppb = Math.max(46, H / 3.4); // 한 박 = 줄 높이의 약 1/3.4
          list.forEach((n) => (n.el.style.height = Math.max(42, n.len * g.ppb - 8) + "px"));
        }
        const next = list[g.pos];
        if (!g.ended && next) {
          const target = next.beat;
          if (g.cur < target) {
            // 미리 쳤으면 빨리 따라잡고, 아니면 박자대로 내려옴
            const sp = g.cur < target - 2.5 && g.pos > 0 ? 4 : g.boost ? 5 : 1;
            g.cur = Math.min(target, g.cur + dt * g.bps * sp);
            if (g.cur >= target) g.boost = false;
            g.waitT = 0;
          } else g.waitT += dt;
          next.el.classList.toggle("wait", g.waitT > 0.15);
          if (g.waitT > 11 && !ctx.busy) {
            g.waitT = -4;
            const k = next.k;
            ctx.talk((k < 5 ? FINGER[k] + "으로 " : "") + KEYS[k][1] + "를 쳐요!", false);
            KP.u.replay(ctx.keyEls[k], "bump");
          }
        }
        for (let i = g.pos; i < list.length; i++) {
          const n = list[i],
            y = (n.beat - g.cur) * g.ppb;
          if (y > g.laneH + 10) {
            n.el.style.display = "none";
            break; // 뒤 음표들은 더 위(안 보임)
          }
          n.el.style.display = "";
          n.el.style.transform = "translateY(" + -Math.max(0, y) + "px)";
        }
      });
    },
    gameProg(ctx) {
      const g = ctx.g,
        f = g.list.length ? g.pos / g.list.length : 0;
      ctx.track.querySelector("i").style.width = f * 100 + "%";
      ctx.track.querySelector(".rp-runner").style.left = f * 100 + "%";
    },
    gameHit(ctx, i) {
      const U = KP.u,
        g = ctx.g;
      if (!g || g.ended || ctx.busy) return;
      const next = g.list[g.pos];
      if (!next) return;
      if (i !== next.k) {
        ctx.keyEls[i].classList.add("heard");
        ctx.after(400, () => ctx.keyEls[i].classList.remove("heard"));
        g.combo = 0;
        return;
      }
      const early = next.beat - g.cur; // 몇 박 일찍 쳤는지
      const good = early < 0.6;
      next.el.classList.remove("wait");
      next.el.classList.add("hit");
      const el = next.el;
      ctx.after(500, () => (el.style.visibility = "hidden"));
      const pop = U.el("div", "rp-pop", KP.E(good ? "🌟" : "⭐"));
      ctx.laneEls[i].appendChild(pop);
      ctx.after(850, () => pop.remove());
      if (early > 0) g.boost = true;
      g.pos++;
      g.score++;
      g.combo++;
      ctx.scoreEl.innerHTML = KP.E("⭐") + " " + g.score;
      U.replay(ctx.scoreEl, "pop");
      this.gameProg(ctx);
      KP.audio.sfx("tap");
      ctx.deafFor(120);
      if (g.combo > 0 && g.combo % 5 === 0) this.cheer(ctx, g.combo + "번 연속! " + KP.E("🔥"));
      if (g.pos < g.list.length) {
        this.mark(ctx, g.list[g.pos].k);
        ctx.fingEls.forEach((f) => f.classList.remove("go"));
        return;
      }
      this.gameEnd(ctx);
    },
    cheer(ctx, html) {
      const c = KP.u.el("div", "rp-cheer", html);
      ctx.field.appendChild(c);
      ctx.after(950, () => c.remove());
    },
    /** 노래 들려주기 — 건반이 차례로 켜짐 (그동안은 듣지 않음) */
    async playSong(ctx, list, beatSec) {
      const tok = ctx.tok;
      ctx.deafFor(600000);
      const t0 = performance.now();
      for (const n of list) {
        const at = t0 + n.beat * beatSec * 1000;
        const w = at - performance.now();
        if (w > 0) await ctx.wait(w);
        if (tok !== ctx.tok) return false;
        const k = ctx.keyEls[n.k];
        k.classList.add("lit");
        ctx.playTone(KEYS[n.k][0]);
        ctx.after(Math.min(400, n.len * beatSec * 900), () => k.classList.remove("lit"));
      }
      const last = list[list.length - 1];
      await ctx.wait(last.len * beatSec * 1000 + 400);
      ctx.mic.deafUntil = performance.now() + 900;
      return tok === ctx.tok;
    },
    async gameEnd(ctx) {
      const g = ctx.g,
        s = ctx.song || SONGS[0];
      g.ended = true;
      ctx.busy = true;
      this.mark(ctx, -1);
      const tok = ctx.tok;
      this.cheer(ctx, "다 쳤어요! " + KP.E("🎉"));
      await ctx.wait(900);
      if (tok !== ctx.tok) return;
      await ctx.talk("내가 친 노래를 들어 봐요!", false);
      if (tok !== ctx.tok) return;
      if (!(await this.playSong(ctx, g.list, 0.42))) return;
      ctx.round = (ctx.round || 0) + 1;
      const ok = await this.celebrate(ctx, ctx.round % 2 === 0, s.name + " 완성! 별 " + g.score + "개");
      if (!ok || tok !== ctx.tok) return;
      this.gameStart(ctx, false);
    },
    async gameListen(ctx) {
      if (ctx.mode !== "game" || ctx.busy) return;
      ctx.busy = true;
      ctx.tok = (ctx.tok || 0) + 1;
      const tok = ctx.tok;
      KP.audio.sfx("open");
      this.mark(ctx, -1);
      ctx.laneEls.forEach((l) => (l.innerHTML = ""));
      const list = this.gameNotes(ctx);
      await ctx.talk("잘 들어 봐요!", false);
      if (tok !== ctx.tok) return;
      if (!(await this.playSong(ctx, list, 0.5))) return;
      ctx.busy = false;
      this.gameStart(ctx, false);
      ctx.talk("이제 쳐 봐요!", false);
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
      const tok = ctx.tok,
        rt = (ctx.eRound = (ctx.eRound || 0) + 1); // 판 표시 (지난 판의 늦은 echoPlay 막기)
      ctx.busy = true; // 말하는 동안 건반 무시
      ctx.talk(n === 1 ? "잘 듣고 똑같이 쳐 봐요!" : "잘 듣고 " + n + "개를 똑같이 쳐 봐요!").then(() => tok === ctx.tok && rt === ctx.eRound && this.echoPlay(ctx));
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
          const tok = ctx.tok,
            rt = ctx.eRound;
          ctx.busy = true; // 말하는 동안 더 틀리거나 끝내지 못하게 (echoPlay 가 끝나면 풀림)
          ctx.talk("한 번 더 들어 봐요!", false).then(() => tok === ctx.tok && rt === ctx.eRound && this.echoPlay(ctx));
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
