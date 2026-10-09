/* =====================================================================
   물감 공용 엔진 — 물감 실험실·색 주문 맞추기·데칼코마니·팔레트가 함께 씀
   - KP.paint.mix(v)        : 물감 양 [빨,노,파,하,검] → RGB (빨강·노랑·파랑 기준 혼색)
   - KP.paint.nameOf(rgb)   : 가장 가까운 한국어 색 이름
   - KP.paint.mine / saveMine : 내 물감 통 (아이가 만든 색, 기기 저장)
   - KP.paint.dex / discover  : 색깔 도감 (처음 만든 색 기록)
   - KP.paint.bowl(host)    : 손가락으로 젓는 물감 그릇 (작은 격자 유체)
===================================================================== */
"use strict";
(function (KP) {
  const U = KP.u;
  const P = (KP.paint = {});

  /* ---------------- 기본 물감 ---------------- */
  P.BASE = [
    { id: 0, key: "r", n: "빨강", hex: "#e8302e" },
    { id: 1, key: "y", n: "노랑", hex: "#ffd60a" },
    { id: 2, key: "b", n: "파랑", hex: "#2f6bff" },
    { id: 3, key: "w", n: "하양", hex: "#ffffff" },
    { id: 4, key: "k", n: "검정", hex: "#2a2a33" },
  ];

  /* ---------------- 빨강·노랑·파랑 정육면체 → RGB (삼선형 보간) ----------------
     꼭짓점 색은 아이가 기대하는 결과(노랑+파랑=초록, 셋 다=갈색)가 나오도록 고름 */
  const C000 = [1, 1, 1], // 아무것도 없음(하양)
    C100 = [0.91, 0.19, 0.18], // 빨강
    C010 = [1, 0.84, 0.04], // 노랑
    C001 = [0.18, 0.42, 1], // 파랑
    C110 = [1, 0.53, 0.07], // 빨강+노랑 = 주황
    C101 = [0.55, 0.2, 0.85], // 빨강+파랑 = 보라
    C011 = [0.16, 0.68, 0.29], // 노랑+파랑 = 초록
    C111 = [0.5, 0.31, 0.15]; // 셋 다 = 갈색
  function ryb2rgb(r, y, b) {
    const out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const x00 = C000[i] * (1 - r) + C100[i] * r,
        x10 = C010[i] * (1 - r) + C110[i] * r,
        x01 = C001[i] * (1 - r) + C101[i] * r,
        x11 = C011[i] * (1 - r) + C111[i] * r;
      const y0 = x00 * (1 - y) + x10 * y,
        y1 = x01 * (1 - y) + x11 * y;
      out[i] = y0 * (1 - b) + y1 * b;
    }
    return out;
  }
  const BLACK = [0.12, 0.12, 0.15];
  /** 물감 양 → RGB(0~1). 물감이 없으면 null */
  P.mix = function (v) {
    const C = v[0] + v[1] + v[2],
      W = v[3],
      K = v[4],
      T = C + W + K;
    if (T <= 1e-6) return null;
    let base = [1, 1, 1];
    if (C > 1e-6) {
      const m = Math.max(v[0], v[1], v[2]);
      base = ryb2rgb(v[0] / m, v[1] / m, v[2] / m);
    }
    const c = C / T,
      w = W / T,
      k = K / T;
    // 검정은 조금만 넣어도 진해지는 실제 물감 느낌을 살리되 너무 빨리 새까매지지 않게
    const ks = Math.min(1, k * 1.25);
    const rest = 1 - ks;
    return [0, 1, 2].map((i) => (base[i] * c / (c + w || 1) + 1 * w / (c + w || 1)) * rest + BLACK[i] * ks);
  };
  P.hex = (rgb) => "#" + rgb.map((x) => Math.round(U.clamp(x, 0, 1) * 255).toString(16).padStart(2, "0")).join("");
  P.rgb = (hex) => {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  };

  /* ---------------- Lab 색 거리 (사람 눈에 가까운 차이) ---------------- */
  function lab(rgb) {
    const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    let X = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047,
      Y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722,
      Z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    X = f(X);
    Y = f(Y);
    Z = f(Z);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  P.lab = lab;
  P.dist = (a, b) => {
    const A = lab(a),
      B = lab(b);
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  };

  /* ---------------- 색 이름 (도감 칸 = dex:true) ---------------- */
  P.NAMES = [
    { n: "빨강", hex: "#e8302e" },
    { n: "노랑", hex: "#ffd60a" },
    { n: "파랑", hex: "#2f6bff" },
    { n: "하양", hex: "#ffffff" },
    { n: "검정", hex: "#26262e" },
    { n: "주황", hex: "#ff8a1a", dex: true },
    { n: "귤색", hex: "#ffb02a", dex: true },
    { n: "다홍", hex: "#ff5533", dex: true },
    { n: "연노랑", hex: "#fff08f", dex: true },
    { n: "연두", hex: "#9ccf3c", dex: true },
    { n: "초록", hex: "#2fae4a", dex: true },
    { n: "진초록", hex: "#1d6b35", dex: true },
    { n: "청록", hex: "#13a39b", dex: true },
    { n: "하늘색", hex: "#86c8ff", dex: true },
    { n: "남색", hex: "#273a8f", dex: true },
    { n: "보라", hex: "#8a3ffc", dex: true },
    { n: "연보라", hex: "#b9a2f5", dex: true },
    { n: "자주", hex: "#a8236e", dex: true },
    { n: "분홍", hex: "#ff93b8", dex: true },
    { n: "살구색", hex: "#ffc39a", dex: true },
    { n: "황토색", hex: "#c49233", dex: true },
    { n: "갈색", hex: "#8b5a2b", dex: true },
    { n: "고동색", hex: "#533018", dex: true },
    { n: "회색", hex: "#9b9ba3", dex: true },
  ];
  P.NAMES.forEach((x) => (x.rgb = P.rgb(x.hex)));
  P.nameOf = (rgb) => {
    let best = P.NAMES[0],
      bd = 1e9;
    for (const x of P.NAMES) {
      const d = P.dist(rgb, x.rgb);
      if (d < bd) {
        bd = d;
        best = x;
      }
    }
    return best;
  };

  /* ---------------- 내 물감 통 / 색깔 도감 (기기 저장) ---------------- */
  P.MAX_MINE = 12;
  P.mine = () => {
    const a = KP.store.get("mypaints", []);
    return Array.isArray(a) ? a.filter((x) => x && /^#[0-9a-f]{6}$/i.test(x.hex)) : [];
  };
  /** 내 물감에 담기 → 저장된 목록 */
  P.saveMine = (hex, n) => {
    let a = P.mine().filter((x) => P.dist(P.rgb(x.hex), P.rgb(hex)) > 4); // 거의 같은 색은 하나만
    a.unshift({ hex, n: String(n || "").slice(0, 10), t: Date.now() });
    a = a.slice(0, P.MAX_MINE);
    KP.store.set("mypaints", a);
    return a;
  };
  P.delMine = (hex) => KP.store.set("mypaints", P.mine().filter((x) => x.hex !== hex));
  P.dex = () => {
    const d = KP.store.get("colordex", {});
    return d && typeof d === "object" ? d : {};
  };
  /** 도감에 기록. 처음이면 true */
  P.discover = (name) => {
    const ent = P.NAMES.find((x) => x.n === name && x.dex);
    if (!ent) return false;
    const d = P.dex();
    if (d[name]) return false;
    const t = new Date();
    d[name] = t.getMonth() + 1 + "월 " + t.getDate() + "일";
    KP.store.set("colordex", d);
    return true;
  };

  /* =================================================================
     손가락으로 젓는 물감 그릇
     - N×N 격자에 물감 5종의 양을 저장, 손가락 움직임으로 흐름(속도)을 만들고
       물감을 그 흐름대로 옮김(반라그랑주 이류) + 아주 약한 번짐
     - 처음엔 줄무늬로 남고, 저을수록 섞여 하나의 색이 됨 (마블링)
  ================================================================= */
  P.bowl = function (host, opt = {}) {
    const N = opt.N || 44;
    const NN = N * N;
    const cv = U.el("canvas", "pbBowl");
    host.appendChild(cv);
    const cx = cv.getContext("2d");
    const small = document.createElement("canvas");
    small.width = small.height = N;
    const sx = small.getContext("2d");
    const img = sx.createImageData(N, N);

    let pig = Array.from({ length: 5 }, () => new Float32Array(NN));
    let tmp = Array.from({ length: 5 }, () => new Float32Array(NN));
    const vx = new Float32Array(NN),
      vy = new Float32Array(NN);
    const mask = new Uint8Array(NN);
    const R = N / 2 - 1.2;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) mask[j * N + i] = Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2) <= R ? 1 : 0;
    const BOTTOM = [0.96, 0.97, 0.99];
    let stirHeat = 0, // 최근에 얼마나 열심히 저었는지 (0~1)
      moving = 0, // 최근 움직임 크기 (적으면 계산 생략)
      size = 300,
      dirty = true;
    const api = {
      cv,
      N,
      capacity: opt.capacity || 60,
      /** 그릇 안 물감 총량 [빨,노,파,하,검] */
      total() {
        const t = [0, 0, 0, 0, 0];
        for (let k = 0; k < 5; k++) {
          const a = pig[k];
          let s = 0;
          for (let i = 0; i < NN; i++) s += a[i];
          t[k] = s;
        }
        return t;
      },
      volume() {
        return api.total().reduce((a, b) => a + b, 0);
      },
      /** 전체를 다 섞었을 때의 색 (없으면 null) */
      color() {
        return P.mix(api.total());
      },
      /** 물감 붓기: id(0~4), amt, 위치(0~1, 기본은 그릇 위쪽 가운데 근처) */
      pour(id, amt = 1, fx, fy) {
        if (api.volume() >= api.capacity) return false;
        const cxg = (fx == null ? 0.5 + U.randf(-0.12, 0.12) : fx) * N,
          cyg = (fy == null ? 0.42 + U.randf(-0.1, 0.1) : fy) * N;
        const sig = N * 0.11,
          a = pig[id];
        let wsum = 0;
        const w = new Float32Array(NN);
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            if (!mask[k]) continue;
            const d2 = (i + 0.5 - cxg) ** 2 + (j + 0.5 - cyg) ** 2;
            const g = Math.exp(-d2 / (2 * sig * sig));
            w[k] = g;
            wsum += g;
          }
        for (let k = 0; k < NN; k++) if (w[k]) a[k] += (amt * w[k]) / wsum;
        // 붓는 자리에서 살짝 퍼지는 흐름
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const k = j * N + i;
            if (!w[k]) continue;
            const dx = i + 0.5 - cxg,
              dy = j + 0.5 - cyg,
              d = Math.hypot(dx, dy) || 1;
            vx[k] += (dx / d) * w[k] * 0.35;
            vy[k] += (dy / d) * w[k] * 0.35;
          }
        moving = Math.max(moving, 0.5);
        dirty = true;
        return true;
      },
      /** 젓기: 그릇 화면 좌표(픽셀)와 움직인 양 */
      stir(px, py, dx, dy) {
        const s = N / size;
        const gx = px * s,
          gy = py * s,
          ux = dx * s,
          uy = dy * s;
        const rad = N * 0.13;
        const i0 = Math.max(0, Math.floor(gx - rad)),
          i1 = Math.min(N - 1, Math.ceil(gx + rad)),
          j0 = Math.max(0, Math.floor(gy - rad)),
          j1 = Math.min(N - 1, Math.ceil(gy + rad));
        for (let j = j0; j <= j1; j++)
          for (let i = i0; i <= i1; i++) {
            const k = j * N + i;
            if (!mask[k]) continue;
            const d = Math.hypot(i + 0.5 - gx, j + 0.5 - gy);
            if (d > rad) continue;
            const f = 1 - d / rad;
            vx[k] += ux * f * 0.9;
            vy[k] += uy * f * 0.9;
          }
        moving = Math.max(moving, Math.min(3, Math.hypot(ux, uy)));
        stirHeat = Math.min(1, stirHeat + Math.min(0.08, Math.hypot(ux, uy) * 0.05));
      },
      clear() {
        pig.forEach((a) => a.fill(0));
        vx.fill(0);
        vy.fill(0);
        dirty = true;
      },
      /** 한 걸음 진행 (dt 초) */
      step(dt) {
        const k60 = Math.min(3, dt * 60);
        if (moving > 0.01) {
          // 이류: 각 칸이 흐름을 거슬러 올라간 자리의 물감을 가져옴
          for (let c = 0; c < 5; c++) tmp[c].fill(0);
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              if (!mask[k]) continue;
              let x = i - vx[k] * k60,
                y = j - vy[k] * k60;
              x = U.clamp(x, 0, N - 1.001);
              y = U.clamp(y, 0, N - 1.001);
              const x0 = x | 0,
                y0 = y | 0,
                fx = x - x0,
                fy = y - y0;
              const a = y0 * N + x0,
                b = a + 1,
                c2 = a + N,
                d = c2 + 1;
              const wa = (1 - fx) * (1 - fy) * mask[a],
                wb = fx * (1 - fy) * mask[b],
                wc = (1 - fx) * fy * mask[c2],
                wd = fx * fy * mask[d];
              const ws = wa + wb + wc + wd || 1;
              for (let p = 0; p < 5; p++) {
                const s = pig[p];
                tmp[p][k] = (s[a] * wa + s[b] * wb + s[c2] * wc + s[d] * wd) / ws;
              }
            }
          // 물감 총량 보존 (이류 과정의 오차 보정)
          for (let p = 0; p < 5; p++) {
            let s0 = 0,
              s1 = 0;
            const A = pig[p],
              B = tmp[p];
            for (let k = 0; k < NN; k++) {
              s0 += A[k];
              s1 += B[k];
            }
            if (s1 > 1e-6) {
              const r = s0 / s1;
              for (let k = 0; k < NN; k++) B[k] *= r;
            }
          }
          const sw = pig;
          pig = tmp;
          tmp = sw;
          // 흐름은 점점 잦아들고 이웃과 고르게
          const damp = Math.pow(0.9, k60);
          let mx = 0;
          for (let k = 0; k < NN; k++) {
            vx[k] *= damp;
            vy[k] *= damp;
            const m = Math.abs(vx[k]) + Math.abs(vy[k]);
            if (m > mx) mx = m;
          }
          moving = mx;
          dirty = true;
        }
        // 번짐: 가만히 두면 아주 천천히, 저으면 빠르게 섞임
        stirHeat = Math.max(0, stirHeat - dt * 0.8);
        api._diffuse(Math.min(0.24, (0.035 + 0.2 * stirHeat) * k60));
      },
      _diffuse(rate) {
        if (rate <= 0) return;
        for (let p = 0; p < 5; p++) {
          const A = pig[p],
            B = tmp[p];
          let any = false;
          for (let k = 0; k < NN; k++)
            if (A[k] > 1e-4) {
              any = true;
              break;
            }
          if (!any) continue;
          for (let j = 0; j < N; j++)
            for (let i = 0; i < N; i++) {
              const k = j * N + i;
              if (!mask[k]) {
                B[k] = 0;
                continue;
              }
              let s = 0,
                n = 0;
              if (i > 0 && mask[k - 1]) (s += A[k - 1]), n++;
              if (i < N - 1 && mask[k + 1]) (s += A[k + 1]), n++;
              if (j > 0 && mask[k - N]) (s += A[k - N]), n++;
              if (j < N - 1 && mask[k + N]) (s += A[k + N]), n++;
              B[k] = A[k] + rate * (n ? s / n - A[k] : 0);
            }
          pig[p] = B;
          tmp[p] = A;
        }
        dirty = true;
      },
      /** 얼마나 고르게 섞였는지 (0~1, 1=완전히 한 색) 와 물감이 덮은 비율 */
      evenness() {
        const tot = api.total();
        const all = tot.reduce((a, b) => a + b, 0);
        if (all < 1e-3) return { even: 0, cover: 0 };
        const ref = tot.map((x) => x / all);
        let dev = 0,
          wsum = 0,
          covered = 0,
          inside = 0;
        for (let k = 0; k < NN; k++) {
          if (!mask[k]) continue;
          inside++;
          let s = 0;
          for (let p = 0; p < 5; p++) s += pig[p][k];
          if (s > 0.004) covered++;
          if (s < 1e-5) continue;
          let d = 0;
          for (let p = 0; p < 5; p++) d += Math.abs(pig[p][k] / s - ref[p]);
          dev += d * s;
          wsum += s;
        }
        return { even: U.clamp(1 - dev / (wsum || 1) / 0.55, 0, 1), cover: covered / inside };
      },
      /** 화면 크기 맞추기 */
      fit(px) {
        size = px;
        const dpr = Math.min(2, Math.round(devicePixelRatio || 1)) || 1;
        const d = px * dpr > 900 ? 1 : dpr;
        cv.width = cv.height = Math.round(px * d);
        cv.style.width = cv.style.height = px + "px";
        cx.setTransform(d, 0, 0, d, 0, 0);
        dirty = true;
      },
      size: () => size,
      draw() {
        if (!dirty) return;
        dirty = false;
        const data = img.data;
        const v = [0, 0, 0, 0, 0];
        for (let k = 0; k < NN; k++) {
          const o = k * 4;
          if (!mask[k]) {
            data[o + 3] = 0;
            continue;
          }
          let s = 0;
          for (let p = 0; p < 5; p++) s += v[p] = pig[p][k];
          const al = U.clamp(s * 260, 0, 1); // 그릇 전체(약 1,450칸)에 물감 6쯤이면 꽉 차 보이게
          let r = BOTTOM[0],
            g = BOTTOM[1],
            b = BOTTOM[2];
          if (al > 0.002) {
            const c = P.mix(v);
            r = r * (1 - al) + c[0] * al;
            g = g * (1 - al) + c[1] * al;
            b = b * (1 - al) + c[2] * al;
          }
          data[o] = r * 255;
          data[o + 1] = g * 255;
          data[o + 2] = b * 255;
          data[o + 3] = 255;
        }
        sx.putImageData(img, 0, 0);
        const S = size;
        cx.clearRect(0, 0, S, S);
        cx.save();
        cx.beginPath();
        cx.arc(S / 2, S / 2, S / 2 - S * 0.035, 0, Math.PI * 2);
        cx.clip();
        cx.imageSmoothingEnabled = true;
        cx.drawImage(small, 0, 0, S, S);
        // 물감 표면 광택
        const g = cx.createRadialGradient(S * 0.36, S * 0.3, S * 0.02, S * 0.36, S * 0.3, S * 0.5);
        g.addColorStop(0, "rgba(255,255,255,.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        cx.fillStyle = g;
        cx.fillRect(0, 0, S, S);
        cx.restore();
        // 그릇 테두리
        cx.lineWidth = S * 0.05;
        cx.strokeStyle = "#ffffff";
        cx.beginPath();
        cx.arc(S / 2, S / 2, S / 2 - S * 0.03, 0, Math.PI * 2);
        cx.stroke();
        cx.lineWidth = S * 0.012;
        cx.strokeStyle = "rgba(47,58,102,.18)";
        cx.beginPath();
        cx.arc(S / 2, S / 2, S / 2 - S * 0.006, 0, Math.PI * 2);
        cx.stroke();
      },
      /** 저장(앱을 껐다 켜도 그릇 그대로) — 0~255 로 줄여 문자열로 */
      save() {
        const mx = Math.max(1e-6, ...pig.map((a) => a.reduce((m, x) => Math.max(m, x), 0)));
        const bytes = new Uint8Array(NN * 5);
        pig.forEach((a, p) => a.forEach((x, k) => (bytes[p * NN + k] = Math.round((x / mx) * 255))));
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return { N, mx, d: btoa(bin) };
      },
      load(o) {
        try {
          if (!o || o.N !== N || typeof o.d !== "string" || !(o.mx > 0)) return false;
          const bin = atob(o.d);
          if (bin.length !== NN * 5) return false;
          pig.forEach((a, p) => {
            for (let k = 0; k < NN; k++) a[k] = mask[k] ? (bin.charCodeAt(p * NN + k) / 255) * o.mx : 0;
          });
          dirty = true;
          return true;
        } catch (e) {
          return false;
        }
      },
    };
    return api;
  };

  /* =================================================================
     물감 작업대 (실험실·주문 맞추기 공용 화면 부품)
     KP.paint.studio({ctx, jars:[0,1,2,3,4], capacity, onPour(id), onStir()})
     → { jarsEl, bowlEl, meterEl, bowl, fit(px), tick(dt), drain(), state }
     - 물감 통: 톡 누르면 한 방울, 꾹 누르고 있으면 계속 똑똑 (방울이 날아가 그릇에 퐁)
     - 그릇: 손가락으로 빙글빙글 저으면 마블링처럼 섞임 (나무 숟가락이 손가락을 따라감)
     - 섞기 막대: 얼마나 고르게 섞였는지 보여 줌
  ================================================================= */
  KP.css("paint-studio", `
    .psJars{display:flex;gap:clamp(8px,1.6vw,14px);justify-content:center;align-items:flex-end;flex-wrap:wrap}
    .psJar{position:relative;width:clamp(66px,8.6vw,86px);height:clamp(84px,11vw,108px);touch-action:none;transition:transform .15s}
    .psJar .jb{position:absolute;left:10%;right:10%;bottom:16%;top:16%;border-radius:12px 12px 20px 20px;background:linear-gradient(90deg,rgba(255,255,255,.75),rgba(255,255,255,.35));border:4px solid #fff;box-shadow:0 6px 0 rgba(47,58,102,.14);overflow:hidden}
    .psJar .jb::after{content:"";position:absolute;left:0;right:0;bottom:0;height:72%;background:var(--c);border-radius:6px 6px 14px 14px;box-shadow:inset -6px 0 0 rgba(0,0,0,.08)}
    .psJar .jl{position:absolute;left:16%;right:16%;top:6%;height:16%;border-radius:8px;background:#ffcf6b;box-shadow:0 3px 0 #d9a23b}
    .psJar .jn{position:absolute;left:-6px;right:-6px;bottom:-6px;text-align:center;font-size:clamp(14px,1.8vw,17px);background:#fff;border-radius:999px;box-shadow:0 3px 0 rgba(47,58,102,.12);padding:1px 0}
    .psJar.pour{transform:rotate(-24deg) translateY(-6px)}
    .psJar.pour .jl{transform:translateY(-10px) rotate(-30deg);transition:transform .15s}
    .psBowlBox{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px}
    .pbBowl{display:block;touch-action:none;filter:drop-shadow(0 10px 0 rgba(47,58,102,.12))}
    .psSpoon{position:absolute;left:0;top:0;font-size:58px;pointer-events:none;opacity:0;transform-origin:20% 85%;transition:opacity .2s;z-index:3}
    .psSpoon.on{opacity:1}
    .psMeter{display:flex;align-items:center;gap:8px;font-size:clamp(15px,2vw,19px);color:var(--ink2)}
    .psMeter .bar{display:inline-block;width:clamp(120px,22vw,220px);height:16px;border-radius:999px;background:#fff;box-shadow:inset 0 2px 4px rgba(0,0,0,.12);overflow:hidden}
    .psMeter .bar i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ffd166,#06d6a0);transition:width .3s}
    .psDrop{position:fixed;z-index:70;width:22px;height:26px;margin:-13px 0 0 -11px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:var(--c);box-shadow:inset -3px -4px 0 rgba(0,0,0,.12),0 0 0 2px rgba(255,255,255,.7);pointer-events:none;transition:transform .38s cubic-bezier(.45,-0.3,.7,1)}
    .pbBowl.drain{transition:opacity .6s, transform .6s;opacity:.15;transform:scale(.9) rotate(-8deg)}
  `);
  P.studio = function (o = {}) {
    const ctx = o.ctx;
    const A = KP.audio;
    const jarsEl = U.el("div", "psJars");
    const bowlEl = U.el("div", "psBowlBox");
    const bowl = P.bowl(bowlEl, { capacity: o.capacity || 60 });
    const spoon = U.el("div", "psSpoon", KP.E("🥄"));
    bowlEl.appendChild(spoon);
    const meterEl = U.el("div", "psMeter", "<span>섞기</span><span class=\"bar\"><i></i></span>");
    bowlEl.appendChild(meterEl);
    const st = { lastPourAt: 0, lastStirAt: 0, pending: 0, even: 0, cover: 0, enabled: true };
    const NOTE = ["C5", "E5", "G5", "C6", "A4"];

    /* 물감 통 */
    (o.jars || [0, 1, 2, 3, 4]).forEach((id) => {
      const p = P.BASE[id];
      const j = U.el("button", "psJar", '<span class="jl"></span><span class="jb"></span><span class="jn">' + p.n + "</span>");
      j.style.setProperty("--c", p.hex);
      j.dataset.id = id;
      let t = null,
        held = false;
      const drop = () => {
        if (!st.enabled) return;
        if (bowl.volume() + st.pending >= bowl.capacity) {
          if (!st.fullTold) {
            st.fullTold = true;
            KP.voice.say("그릇이 가득 찼어요! 비우고 다시 해요.");
          }
          return;
        }
        st.pending += 0.9;
        const a = j.getBoundingClientRect(),
          br = bowl.cv.getBoundingClientRect();
        const fx = 0.5 + U.randf(-0.18, 0.18),
          fy = 0.38 + U.randf(-0.12, 0.12);
        const tx = br.left + br.width * fx,
          ty = br.top + br.height * fy;
        const d = U.el("div", "psDrop");
        d.style.setProperty("--c", p.hex);
        d.style.left = a.left + a.width / 2 + "px";
        d.style.top = a.top + a.height * 0.25 + "px";
        document.body.appendChild(d);
        requestAnimationFrame(() => (d.style.transform = "translate(" + (tx - a.left - a.width / 2) + "px," + (ty - a.top - a.height * 0.25) + "px) scale(.9)"));
        setTimeout(() => {
          d.remove();
          st.pending = Math.max(0, st.pending - 0.9);
          if (ctx && !ctx._active) return;
          bowl.pour(id, 0.9, fx, fy);
          st.lastPourAt = performance.now();
          A.tone(A.hz(NOTE[id]) * U.randf(0.95, 1.05), { to: A.hz(NOTE[id]) * 0.6, dur: 0.12, vol: 0.18 });
          A.noise({ dur: 0.06, vol: 0.05, bp: 800, q: 2 });
          o.onPour && o.onPour(id);
        }, 390);
      };
      j.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        A.unlock();
        if (!st.enabled) return;
        held = true;
        j.classList.add("pour");
        drop();
        clearInterval(t);
        t = setInterval(() => (held && (!ctx || ctx._active) ? drop() : clearInterval(t)), 170);
      });
      const end = () => {
        held = false;
        clearInterval(t);
        j.classList.remove("pour");
      };
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => j.addEventListener(ev, end));
      jarsEl.appendChild(j);
    });

    /* 젓기 */
    let last = null,
      lastSnd = 0;
    const cv = bowl.cv;
    const local = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, r };
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      A.unlock();
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      last = local(e);
      spoon.classList.add("on");
      moveSpoon(last);
    });
    function moveSpoon(p) {
      spoon.style.transform = "translate(" + (p.x - 14) + "px," + (p.y - 50) + "px) rotate(" + Math.sin(performance.now() / 120) * 14 + "deg)";
    }
    cv.addEventListener("pointermove", (e) => {
      if (!last) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs) {
        const p = local(ev);
        const dx = p.x - last.x,
          dy = p.y - last.y;
        bowl.stir(p.x, p.y, dx, dy);
        last = p;
      }
      moveSpoon(last);
      st.lastStirAt = performance.now();
      if (performance.now() - lastSnd > 140 && bowl.volume() > 0.3) {
        lastSnd = performance.now();
        A.noise({ dur: 0.12, vol: 0.05, bp: 380 + Math.random() * 200, q: 3 });
      }
      o.onStir && o.onStir();
    });
    const endStir = () => {
      last = null;
      spoon.classList.remove("on");
    };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => cv.addEventListener(ev, endStir));

    let acc = 0;
    const api = {
      jarsEl,
      bowlEl,
      meterEl,
      bowl,
      state: st,
      jar: (id) => jarsEl.querySelector('.psJar[data-id="' + id + '"]'),
      fit(px) {
        bowl.fit(Math.max(140, Math.round(px)));
      },
      /** 매 프레임 호출 */
      tick(dt) {
        bowl.step(dt);
        bowl.draw();
        acc += dt;
        if (acc > 0.25) {
          acc = 0;
          const ev = bowl.evenness();
          st.even = ev.even;
          st.cover = ev.cover;
          const v = bowl.volume();
          meterEl.querySelector("i").style.width = (v > 0.3 ? Math.round(ev.even * 100) : 0) + "%";
          if (v < bowl.capacity * 0.9) st.fullTold = false;
        }
      },
      /** 그릇 비우기 (연출 후 비움) */
      drain() {
        return new Promise((res) => {
          A.noise({ dur: 0.6, vol: 0.12, bp: 900, bpTo: 300, q: 1.5 });
          cv.classList.add("drain");
          setTimeout(() => {
            bowl.clear();
            cv.classList.remove("drain");
            res();
          }, 620);
        });
      },
      setEnabled(on) {
        st.enabled = on;
      },
    };
    return api;
  };
})(window.KP);
