/* =====================================================================
   🦁 내 동물원 — 점토 3D (Three.js r170, vendor/three.module.min.js 를 필요할 때만 불러옴)
   - 배경: 점토 디오라마 그림 6종(assets/zoo-bg) — 날마다 바뀌고 🏞️ 버튼으로 바꿀 수 있음.
     그림과 같은 원근 카메라(bgCam)로 3D 를 그 위에 겹침 (그림은 CSS 배경 → 그리기 비용 0)
   - 🧸 3D 인형 친구(doll.js): 칠한 그림을 정면 투영으로 입힌 점토 인형, 뼈대 없이 부위 가중치로 절차적 움직임
   - 🐾 도안 동물(zoo-clay.js, Clay 2.0): 옆모습 도안을 통통한 점토 조각으로 — 다리·꼬리·머리·날개 관절
   - 동물 콕 → 폴짝 + 말, 빈 땅 콕 → 간식, 모두 모여라, 꾹 → 집에서 쉬기(zoo.js)
   - 자동 화질(zoo3d:q) · 가장 낮은 화질에서도 느리면 그림 동물원으로(onSlow) · 화면이 끊기면 새로(onLost)
   - WebGL 이 안 되면 zoo.js 의 2.5D 화면으로 자동 전환
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  let THREE = null;
  let loading = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DEG = Math.PI / 180;

  /* ---------------- 배경 그림 (1600×900) — 손으로 정한 값 (시험판 lab/zoo/bgs.js 그대로 + 연못) ----------------
     vh 지평선 높이(그림 비율) · near 맨 아래 줄에서 세상 1단위 크기 · fov 화각 · poly 걷는 풀밭(그림 좌표 0~1)
     focus 잘릴 때 남길 곳 · sun 햇빛 방향/색 · pond 그림 속 연못 물(타원, 그림 좌표) — 물고기가 헤엄침 */
  const BGS = {
    A: {
      file: "assets/zoo-bg/bg-A-zoo.jpg", vh: 0.3, near: 0.165, fov: 40, focus: [0.5, 0.66], sun: [-0.45, 1, 0.6], sunCol: "#fff3e0",
      poly: [[0.2, 0.615], [0.35, 0.615], [0.4, 0.575], [0.47, 0.545], [0.6, 0.54], [0.66, 0.555], [0.73, 0.6], [0.86, 0.61], [0.875, 0.66], [0.84, 0.71], [0.76, 0.78], [0.69, 0.86], [0.67, 0.93], [0.25, 0.93], [0.21, 0.85], [0.14, 0.76], [0.14, 0.68]],
      pond: { u: 0.255, v: 0.555, ru: 0.055, rv: 0.025 },
    },
    B: {
      file: "assets/zoo-bg/bg-B-farm.jpg", vh: -0.5, near: 0.17, fov: 40, focus: [0.52, 0.6], sun: [-0.5, 1, 0.45], sunCol: "#fff1dc",
      poly: [[0.3, 0.42], [0.36, 0.37], [0.55, 0.36], [0.62, 0.43], [0.8, 0.46], [0.83, 0.56], [0.84, 0.64], [0.79, 0.72], [0.66, 0.79], [0.6, 0.86], [0.31, 0.86], [0.28, 0.76], [0.18, 0.7], [0.16, 0.6], [0.19, 0.5], [0.26, 0.47]],
      pond: { u: 0.765, v: 0.325, ru: 0.08, rv: 0.04 },
    },
    C: {
      file: "assets/zoo-bg/bg-C-zoo.jpg", vh: 0.1, near: 0.18, fov: 40, focus: [0.5, 0.62], sun: [-0.35, 1, 0.55], sunCol: "#fff4dc",
      poly: [[0.32, 0.385], [0.45, 0.345], [0.62, 0.345], [0.76, 0.37], [0.8, 0.43], [0.86, 0.52], [0.89, 0.6], [0.86, 0.71], [0.8, 0.82], [0.7, 0.9], [0.36, 0.91], [0.27, 0.84], [0.15, 0.71], [0.11, 0.6], [0.2, 0.565], [0.29, 0.52], [0.31, 0.44]],
      pond: { u: 0.13, v: 0.43, ru: 0.095, rv: 0.055 },
    },
    D: {
      file: "assets/zoo-bg/bg-D-farm.jpg", vh: -0.12, near: 0.17, fov: 40, focus: [0.5, 0.6], sun: [-0.4, 1, 0.5], sunCol: "#fff2da",
      poly: [[0.12, 0.38], [0.24, 0.3], [0.4, 0.27], [0.6, 0.27], [0.7, 0.37], [0.84, 0.4], [0.9, 0.48], [0.88, 0.6], [0.8, 0.72], [0.66, 0.8], [0.36, 0.8], [0.24, 0.73], [0.14, 0.62], [0.11, 0.5]],
      pond: { u: 0.875, v: 0.275, ru: 0.095, rv: 0.04 },
    },
    E: {
      file: "assets/zoo-bg/bg-E-camp.jpg", vh: -0.25, near: 0.165, fov: 40, focus: [0.5, 0.6], sun: [-0.5, 1, 0.5], sunCol: "#fff6e4",
      poly: [[0.07, 0.5], [0.24, 0.43], [0.36, 0.3], [0.52, 0.24], [0.7, 0.24], [0.78, 0.34], [0.9, 0.42], [0.93, 0.52], [0.9, 0.66], [0.88, 0.9], [0.14, 0.9], [0.12, 0.76], [0.06, 0.62]],
    },
    F: {
      file: "assets/zoo-bg/bg-F-park.jpg", vh: -0.08, near: 0.17, fov: 40, focus: [0.48, 0.6], sun: [-0.6, 0.9, 0.35], sunCol: "#ffeccc",
      poly: [[0.27, 0.45], [0.36, 0.38], [0.5, 0.36], [0.68, 0.37], [0.74, 0.45], [0.8, 0.54], [0.88, 0.63], [0.86, 0.74], [0.76, 0.86], [0.62, 0.9], [0.32, 0.9], [0.25, 0.84], [0.26, 0.7], [0.18, 0.6], [0.22, 0.52]],
    },
  };
  const BG_IDS = Object.keys(BGS);
  const IA = 16 / 9;
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  /** 그림에 맞춘 카메라 (화면 비율이 다르면 그림을 꽉 채워 잘라 보여 줌) — vw·vh: 보기 크기(CSS px) */
  function bgCam(def, vw, vh) {
    const t = Math.tan((def.fov * Math.PI) / 360);
    const k = Math.max(vw / 1600, vh / 900), fw = 1600 * k, fh = 900 * k;
    const ox = Math.max(0, Math.min(fw - vw, def.focus[0] * fw - vw / 2));
    const oy = Math.max(0, Math.min(fh - vh, def.focus[1] * fh - vh / 2));
    const vis = { u0: ox / fw, u1: (ox + vw) / fw, v0: oy / fh, v1: (oy + vh) / fh };
    // 좁게 잘린 화면(폰 세로)에서는 동물을 조금 작게 → 여러 마리가 들어가게
    const frac = Math.min(vis.u1 - vis.u0, vis.v1 - vis.v0);
    const scale = Math.max(0.5, Math.min(1, Math.sqrt(frac) * 1.02));
    const th = Math.atan((0.5 - def.vh) * 2 * t);
    const sn = Math.sin(th), cs = Math.cos(th);
    const mk = (h) => {
      const pos = [0, h, 0], fwd = [0, -sn, -cs], up = [0, cs, -sn];
      const toUV = (x, y, z) => {
        const dx = x - pos[0], dy = y - pos[1], dz = z - pos[2];
        const zc = dx * fwd[0] + dy * fwd[1] + dz * fwd[2], yc = dx * up[0] + dy * up[1] + dz * up[2];
        return [0.5 + dx / (zc * t * IA) / 2, 0.5 - yc / (zc * t) / 2, zc];
      };
      const ground = (u, v) => {
        const nx = (u * 2 - 1) * t * IA, ny = (1 - v * 2) * t;
        const d = [nx, fwd[1] + up[1] * ny, fwd[2] + up[2] * ny];
        if (d[1] >= -1e-4) return null; // 지평선 위
        const s = -pos[1] / d[1];
        return [pos[0] + d[0] * s, pos[2] + d[2] * s];
      };
      return { pos, toUV, ground };
    };
    const m1 = mk(1), g1 = m1.ground(0.5, 1);
    const dv1 = m1.toUV(g1[0], 0, g1[1])[1] - m1.toUV(g1[0], 1, g1[1])[1];
    const H = dv1 / (def.near * scale);
    const M = mk(H);
    const pos = M.pos, target = [0, H - sn * 10, -cs * 10];
    const mu = 0.012;
    const insideUV = (u, v) => u > vis.u0 + mu && u < vis.u1 - mu && v < vis.v1 - mu && v > vis.v0 && inPoly(def.poly, u, v);
    /** 동물 a(w: 폭, h: 키, fly, y) 가 (x,z) 에 서도 되나: 발 양끝이 풀밭 안 + 몸이 화면 안 */
    const inside = (a, x, z) => {
      const w = a.w, h = a.h;
      const hw = a.fly ? w * 0.15 : w * 0.4;
      const l = M.toUV(x - hw, 0, z), r = M.toUV(x + hw, 0, z), c = M.toUV(x, 0, z);
      if (!insideUV(l[0], l[1]) || !insideUV(r[0], r[1]) || !insideUV(c[0], c[1])) return false;
      const L = M.toUV(x - w * 0.56, 0, z)[0], R = M.toUV(x + w * 0.56, 0, z)[0];
      if (L < vis.u0 + 0.004 || R > vis.u1 - 0.004) return false;
      return M.toUV(x, (a.fly ? a.y || 0 : 0) + h, z)[1] > vis.v0 + 0.01;
    };
    // 세로 화면(폰): 걷는 곳이 멀리까지 길게 보여 친구들이 아주 작아짐 → 앞쪽(가까운 곳)을 더 자주 고름
    const tall = vw / vh < 0.8;
    const pick = (a) => {
      for (let i = 0; i < 40; i++) {
        const vl = Math.max(vis.v0, 0.2), r = tall ? Math.sqrt(Math.random()) : Math.random();
        const u = vis.u0 + Math.random() * (vis.u1 - vis.u0), v = vl + r * (vis.v1 - vl);
        if (!insideUV(u, v)) continue;
        const g = M.ground(u, v);
        if (g && inside(a, g[0], g[1])) return g;
      }
      return null;
    };
    return { fov: def.fov, pos, target, view: { fw, fh, ox, oy }, vis, scale, H, inside, insideUV, pick, uv: M.toUV, ground: M.ground };
  }

  KP.zoo3d = {
    ok: null,
    BG_IDS,
    /** WebGL 지원 여부 (한 번만 검사) */
    supported() {
      if (this.ok !== null) return this.ok;
      try {
        const c = document.createElement("canvas");
        this.ok = !!(window.WebGLRenderingContext && c.getContext("webgl2"));
      } catch (e) {
        this.ok = false;
      }
      return this.ok;
    },
    load() {
      if (THREE) return Promise.resolve(THREE);
      if (!loading)
        loading = import(new URL("vendor/three.module.min.js", document.baseURI).href)
          .then((m) => {
            THREE = m;
            KP.CLAY2.use(m);
            return m;
          })
          .catch((e) => {
            loading = null;
            throw e;
          });
      return loading;
    },
    create(ctx, host, T) {
      try {
        return (this._last = new World(ctx, host, T));
      } catch (e) {
        this.ok = false; // WebGL 을 아예 못 만들면 그때만 3D 끄기
        throw e;
      }
    },
  };

  /* ---------------- 함께 쓰는 작은 것들 ---------------- */
  const DOLL_H = 1.6; // 인형 키 (세상 단위, 종의 move.size 를 곱함)
  const CLAY_K = 1.3; // 도안 동물 크기 배율 (인형과 어울리게)
  const CLAY_GAIN = 1.2; // 도안 동물 밝기 맞춤 (인형과 같은 빛에서 아이 그림 색이 그대로 보이게)
  let G = null;
  function geos() {
    if (G) return G;
    G = {
      sph: new THREE.SphereGeometry(1, 18, 12),
      sphLo: new THREE.SphereGeometry(1, 10, 8),
      cone: new THREE.ConeGeometry(1, 1, 14),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
      cap: new THREE.CapsuleGeometry(0.13, 0.29, 4, 10),
      plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    };
    return G;
  }
  const treatMats = new Map();
  function treatMat(color, roughness) {
    const k = color + roughness;
    if (!treatMats.has(k)) treatMats.set(k, new THREE.MeshStandardMaterial({ color, roughness }));
    return treatMats.get(k);
  }
  const angDiff = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  function canvasOf(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h || w;
    return c;
  }
  const loadImg = (src) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });

  /* ================================================================= 3D 세계 */
  function World(ctx, host, T) {
    this.ctx = ctx;
    this.host = host;
    this.T = T;
    geos();
    this.hi = Math.min(screen.width || 0, screen.height || 0) >= 600;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" }));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.setClearColor(0x000000, 0);
    r.domElement.className = "z3Canvas";
    this.bgEl = U.el("div", "z3Bg");
    host.appendChild(this.bgEl);
    host.appendChild(r.domElement);
    // 화면이 잠깐 끊기면(백그라운드·메모리 부족) 동물원이 새로 만들어 다시 보여 줌 (멈춘 화면으로 두지 않게) — 정리 중이면 무시
    r.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      if (this.dead) return;
      this.lost = true;
      if (this.onLost) this._lostT = setTimeout(() => this.onLost(), 600);
    });
    const S = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    this.hemi = new THREE.HemisphereLight(0xeef6ff, 0xd8cfb8, 0.62 * Math.PI);
    this.sun = new THREE.DirectionalLight(0xfff3e0, 0.5 * Math.PI);
    S.add(this.hemi, this.sun, this.sun.target);
    this.cam = { az: 0, taz: 0, baseAz: 0, zoom: 1, tzoom: 1 }; // 고정 카메라 (그림과 같은 원근 — 돌리기 없음)
    this.animals = [];
    this.treats = [];
    this.kinds = {}; // 인형 종: 모양·얼굴 (같은 종이 같이 씀)
    this.res = new Map(); // 동물 하나의 그림 자원 (item.id → {…}) — 다시 꾸밀 때 재사용
    this.seq = 0;
    this.time = 0;
    this.makeShared();
    const qs = KP.store.get("zoo3d:q", null);
    this.q = qs && Number.isFinite(qs.q) ? clamp(qs.q, 0, 3) : 0;
    if (qs && this.q > 0 && Date.now() - (qs.t || 0) > 7 * 864e5) this.q--; // 7일 지나면 한 단계 올려 다시 시도
    this.applyQ(this.q);
    this.bindInput();
    this.setBg(BG_IDS[0]);
    if (window.ResizeObserver) (this.ro = new ResizeObserver(() => this.resize())).observe(host);
  }
  const W3 = World.prototype;

  W3.makeShared = function () {
    // 점토 결 (아주 약한 울퉁불퉁 — 인형)
    const gc = canvasOf(128), gg = gc.getContext("2d"), im = gg.createImageData(128, 128);
    let s = 99;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const base = new Float32Array(32 * 32).map(() => rnd());
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) {
        const fx = x / 4, fy = y / 4, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
        const at = (a, b) => base[(b & 31) * 32 + (a & 31)];
        const v = (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
        const c = Math.round(110 + v * 90 + (rnd() - 0.5) * 20), i = (y * 128 + x) * 4;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = c;
        im.data[i + 3] = 255;
      }
    gg.putImageData(im, 0, 0);
    this.grainT = new THREE.CanvasTexture(gc);
    this.grainT.wrapS = this.grainT.wrapT = THREE.RepeatWrapping;
    this.grainT.repeat.set(5, 5);
    // 발밑 그림자 (흐린 원판 두 장: 접촉 + 햇빛 반대쪽으로 길게)
    const bc = canvasOf(64), bg = bc.getContext("2d"), gr = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(0.5, "rgba(0,0,0,.55)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    bg.fillStyle = gr;
    bg.fillRect(0, 0, 64, 64);
    this.blobT = new THREE.CanvasTexture(bc);
    this.contactM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: 0x1d3a12, opacity: 0.42 });
    this.castM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: 0x1d3a12, opacity: 0.2 });
    // Clay 2.0 가장자리 하늘빛(림)
    this.rimU = { value: new THREE.Color("#eaf6ff") };
    this.eyeMat = this.clayMat({ vertexColors: true, specular: 0x8c8c8c, shininess: 70 });
  };
  /** Clay 2.0 재질: 은은한 광택 + 가장자리 하늘빛 */
  W3.clayMat = function (params) {
    const m = new THREE.MeshPhongMaterial(params);
    const rimU = this.rimU;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.rimCol = rimU;
      sh.fragmentShader =
        "uniform vec3 rimCol;\n" +
        sh.fragmentShader.replace(
          "#include <opaque_fragment>",
          "float rimK = 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) );\noutgoingLight += rimCol * ( rimK * rimK * rimK ) * 0.12;\n#include <opaque_fragment>"
        );
    };
    m.customProgramCacheKey = () => "clay2rim";
    return m;
  };

  /** 다 쓴 세계 정리 (화면이 끊겨 새로 만들 때·느려서 그림 동물원으로 바꿀 때) */
  W3.dispose = function () {
    if (this.dead) return;
    this.dead = this.lost = true;
    clearTimeout(this._lostT);
    clearTimeout(this._slowT);
    if (this.ro) this.ro.disconnect();
    this.clear();
    for (const R of this.res.values()) this.freeRes(R);
    this.res.clear();
    for (const k of Object.values(this.kinds)) {
      k.geo.dispose();
      k.faceT.dispose();
    }
    this.kinds = {};
    this.dropPond();
    for (const x of [this.grainT, this.blobT, this.contactM, this.castM, this.eyeMat]) x.dispose();
    this.renderer.dispose();
    try {
      this.renderer.forceContextLoss(); // 그래픽 메모리를 바로 돌려줌 (iPad)
    } catch (e) {}
    this.renderer.domElement.remove();
    this.bgEl.remove();
  };

  /* ---------- 배경 ---------- */
  W3.setBg = function (id) {
    const def = BGS[id] || BGS.A;
    if (this.bgDef === def) return;
    this.bgId = BGS[id] ? id : "A";
    this.bgDef = def;
    this.bgEl.style.backgroundImage = 'url("' + def.file + '")';
    this.sunDir = new THREE.Vector3(def.sun[0], def.sun[1], def.sun[2]).normalize();
    this.sun.position.copy(this.sunDir).multiplyScalar(10);
    this.lightUp();
    // 그림의 하늘·풀밭 평균색 → 하늘빛(위)·땅 반사빛(아래). 아이 그림 색이 너무 변하지 않게 흰색 쪽으로 많이 섞음
    const im = new Image();
    im.onload = () => {
      if (this.dead || this.bgDef !== def) return;
      const c = canvasOf(64, 36), g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(im, 0, 0, 64, 36);
      const d = g.getImageData(0, 0, 64, 36).data, sky = [0, 0, 0, 0], grass = [0, 0, 0, 0];
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4, u = (x + 0.5) / 64, v = (y + 0.5) / 36;
          const a = inPoly(def.poly, u, v) ? grass : v < 0.12 ? sky : null;
          if (a) {
            a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; a[3]++;
          }
        }
      const av = (a, f) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : f);
      def.tint = { sky: av(sky, [170, 210, 240]), grass: av(grass, [120, 180, 90]) };
      this.lightUp();
    };
    im.src = def.file;
    this.w = 0; // 다음 resize 에서 카메라 다시
    this.resize();
  };
  /** 빛: 배경 그림의 해 방향·색 + 하늘/풀빛 (밤에는 어둡게) */
  W3.lightUp = function () {
    const def = this.bgDef, t = def.tint, n = !!this.night;
    this.sun.color.set(n ? "#b8c8ff" : def.sunCol || "#fff3e0");
    if (t) {
      this.hemi.color.setRGB(...t.sky.map((v) => (v / 255) * 0.35 + 0.65), THREE.SRGBColorSpace);
      this.hemi.groundColor.setRGB(...t.grass.map((v, k) => (v / 255) * 0.4 + [0.85, 0.8, 0.7][k] * 0.6), THREE.SRGBColorSpace);
      this.rimU.value.setRGB(...t.sky.map((v) => (v / 255) * 0.4 + 0.6), THREE.SRGBColorSpace);
      const gm = t.grass.map((v) => v / 255);
      this.contactM.color.setRGB(gm[0] * 0.25, gm[1] * 0.3, gm[2] * 0.2, THREE.SRGBColorSpace);
      this.castM.color.copy(this.contactM.color);
    }
    this.hemi.intensity = (n ? 0.42 : 0.62) * Math.PI;
    this.sun.intensity = (n ? 0.2 : 0.5) * Math.PI;
  };
  W3.setNight = function (n) {
    this.night = !!n;
    this.bgEl.classList.toggle("night", this.night);
    this.lightUp();
  };

  /* ---------- 크기 · 카메라 ---------- */
  W3.resize = function () {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w;
    this.h = h;
    const r = this.renderer;
    r.setSize(w, h, false);
    r.domElement.style.width = w + "px";
    r.domElement.style.height = h + "px";
    const cam = (this.bc = bgCam(this.bgDef, w, h));
    const c = this.camera;
    c.fov = cam.fov;
    c.position.set(...cam.pos);
    c.lookAt(...cam.target);
    c.aspect = cam.view.fw / cam.view.fh;
    c.setViewOffset(cam.view.fw, cam.view.fh, cam.view.ox, cam.view.oy, w, h);
    c.updateProjectionMatrix();
    this.bgEl.style.backgroundSize = cam.view.fw + "px " + cam.view.fh + "px";
    this.bgEl.style.backgroundPosition = -cam.view.ox + "px " + -cam.view.oy + "px";
    this.sk = Math.min(1, cam.scale * 1.55); // 좁은 화면(폰 세로)은 덜 줄임
    this.setupPond();
    this.placeAll();
    this.render();
  };
  /** 동물 하나의 폭·키 (세상 단위) */
  W3.dims = function (a) {
    if (a.type === "doll") a.w = a.kind.w * a.size, a.h = a.size;
    else {
      const m = a.art.model, s = 0.01 * a.size;
      a.w = (m.bbox.x1 - m.bbox.x0) * s;
      a.h = (m.foot[1] - m.bbox.y0) * s;
    }
  };
  W3.sizeOf = function (a) {
    const sk = this.sk || 1;
    if (a.type === "doll") a.size = DOLL_H * a.kind.mv.size * sk;
    else {
      a.size = a.rig.size * CLAY_K * sk;
      if (a.swim && this.pond) a.size = Math.min(a.size, this.pond.fish);
    }
    this.dims(a);
  };
  W3.inside = function (a, x, z) {
    if (!this.bc) return false;
    if (a.swim) return this.inPondXZ(x, z, 0.8);
    if (!this.bc.inside(a, x, z)) return false;
    if (this.pond && this.pond.mesh && !a.fly && this.inPondXZ(x, z, 1.25 + a.w * 0.4 / this.pond.rx)) return false;
    return true;
  };
  /** 처음 자리: 후보 여러 개 중 다른 동물과 가장 먼 곳 */
  W3.placeAll = function () {
    if (!this.bc) return;
    const done = [];
    for (const a of this.animals) {
      this.sizeOf(a);
      if (a.swim) {
        const p = this.pondPick(a);
        a.x = a.tx = p[0];
        a.z = a.tz = p[1];
        continue;
      }
      let best = null, bd = -1;
      for (let k = 0; k < 14; k++) {
        const g = this.pickFor(a);
        if (!g) continue;
        let d = 9;
        for (const q of done) d = Math.min(d, Math.hypot(g[0] - q[0], (g[1] - q[1]) * 0.8) / (q[2] + a.w));
        if (d > bd) {
          bd = d;
          best = g;
        }
      }
      if (best) {
        a.x = a.tx = best[0];
        a.z = a.tz = best[1];
        done.push([best[0], best[1], a.w]);
      }
      if (a.fly) a.y = a.ty = 0.7 + Math.random() * 0.8;
      a.state = "idle";
      a.wait = Math.random() * 1.5;
      a.isNew = 0;
      a.treat = null;
    }
  };
  W3.pickFor = function (a) {
    for (let i = 0; i < 6; i++) {
      const g = this.bc.pick(a);
      if (g && this.inside(a, g[0], g[1])) return g;
    }
    return null;
  };

  /* ---------- 연못 (물고기): 그림 속 연못이 화면에 보이면 거기, 아니면 풀밭 앞쪽에 점토 연못 ---------- */
  W3.dropPond = function () {
    const p = this.pond;
    if (p && p.mesh) {
      this.scene.remove(p.mesh);
      p.mesh.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
    }
    this.pond = null;
  };
  W3.setupPond = function () {
    this.dropPond();
    if (!this.animals.some((a) => a.swim) && !this._wantPond) return;
    const bc = this.bc, d = this.bgDef.pond;
    if (d && bc.vis.u0 < d.u - d.ru * 0.3 && bc.vis.u1 > d.u + d.ru * 0.3 && bc.vis.v1 > d.v + d.rv * 0.5) {
      const c = bc.ground(d.u, d.v), l = bc.ground(d.u - d.ru, d.v), f = bc.ground(d.u, d.v - d.rv), n = bc.ground(d.u, d.v + d.rv);
      if (c && l && f && n) {
        const rx = Math.abs(c[0] - l[0]), rz = Math.abs(n[1] - f[1]) / 2;
        // 물고기 폭 ≈ 연못 반지름의 62% (물고기 도안 폭 약 150 단위 × 0.01 × size)
        this.pond = { x: c[0], z: (n[1] + f[1]) / 2, rx, rz, fish: (rx * 0.62) / 1.5 };
        return;
      }
    }
    // 점토 연못: 풀밭 앞쪽 왼쪽/오른쪽 중 들어가는 곳
    const sk = this.sk || 1, rx = 1.25 * sk, rz = 0.72 * sk;
    let at = null;
    for (const [u, v] of [[0.78, 0.8], [0.24, 0.8], [0.7, 0.7], [0.3, 0.7], [0.5, 0.78]]) {
      const uu = bc.vis.u0 + (bc.vis.u1 - bc.vis.u0) * u, vv = bc.vis.v0 + (bc.vis.v1 - bc.vis.v0) * v;
      const g = bc.ground(uu, vv);
      if (g && bc.inside({ w: rx * 2.4, h: 0.2 }, g[0], g[1])) {
        at = g;
        break;
      }
    }
    if (!at) at = bc.pick({ w: rx * 2, h: 0.2 }) || bc.ground(0.5, 0.8) || [0, -6];
    const grp = new THREE.Group();
    grp.position.set(at[0], 0, at[1]);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: "#5fb9ec", specular: 0x99bbcc, shininess: 60 }));
    water.scale.set(rx, 1, rz);
    water.position.y = 0.02;
    const deep = new THREE.Mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#2f86c8", transparent: true, opacity: 0.35, depthWrite: false }));
    deep.scale.set(rx * 0.6, 1, rz * 0.55);
    deep.position.y = 0.025;
    grp.add(water, deep);
    const stones = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, s = (0.16 + ((i * 7) % 4) * 0.025) * sk;
      const g = new THREE.IcosahedronGeometry(1, 1);
      g.scale(s * 1.3, s * 0.7, s);
      g.rotateY(a);
      g.translate(Math.cos(a) * rx * 1.04, s * 0.3, Math.sin(a) * rz * 1.08);
      stones.push(g);
    }
    const sg = mergeGeos(stones);
    const sm = new THREE.Mesh(sg, new THREE.MeshPhongMaterial({ color: "#b9c0cc", shininess: 8, flatShading: false }));
    grp.add(sm);
    this.scene.add(grp);
    this.pond = { x: at[0], z: at[1], rx, rz, mesh: grp, fish: (rx * 0.6) / 1.5 };
  };
  function mergeGeos(list) {
    let n = 0, ni = 0;
    for (const g of list) {
      n += g.attributes.position.count;
      ni += g.index ? g.index.count : g.attributes.position.count;
    }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint32Array(ni);
    let o = 0, io = 0;
    for (const g of list) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + o;
      else for (let i = 0; i < c; i++) idx[io++] = i + o;
      o += c;
      g.dispose();
    }
    const m = new THREE.BufferGeometry();
    m.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    m.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    m.setIndex(new THREE.BufferAttribute(idx, 1));
    return m;
  }
  W3.inPondXZ = function (x, z, m = 1) {
    const p = this.pond;
    if (!p) return false;
    const dx = (x - p.x) / (p.rx * m), dz = (z - p.z) / (p.rz * m);
    return dx * dx + dz * dz < 1;
  };
  W3.pondPick = function (self) {
    const p = this.pond;
    if (!p) return [0, -6];
    let best = null, bd = -1;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * 0.62;
      const q = [p.x + Math.cos(a) * p.rx * rr, p.z + Math.sin(a) * p.rz * rr];
      let d = 9;
      for (const o of this.animals) if (o !== self && o.swim) d = Math.min(d, Math.hypot(o.tx - q[0], o.tz - q[1]), Math.hypot(o.x - q[0], o.z - q[1]));
      if (d > bd) {
        bd = d;
        best = q;
      }
    }
    return best;
  };

  /* ---------- 준비: 인형 종 모양·그림, 도안 동물 점토 굽기 (다시 꾸밀 때는 있던 것 재사용) ---------- */
  W3.prepare = async function (items) {
    const D = KP.DOLL, want = new Set(items.map((x) => x.id));
    this._wantPond = items.some((x) => this.tOf(x).move === "swim");
    // 더는 안 나오는 친구의 그림 자원 정리
    for (const [id, R] of this.res) if (!want.has(id)) {
      this.freeRes(R);
      this.res.delete(id);
    }
    const nDoll = items.filter((x) => x.tid === "doll").length;
    const texSize = nDoll > 6 || !this.hi ? 512 : 768;
    for (const it of items) {
      if (this.dead) return;
      if (this.res.has(it.id)) continue;
      try {
        if (it.tid === "doll") {
          const sp = it.species;
          if (!this.kinds[sp]) {
            const { model, B } = await D.load(sp);
            if (this.dead) return;
            this.kinds[sp] = this.addKind(sp, model, B);
          }
          const im = await loadImg(KP.safeImg(it.img));
          if (!im || this.dead) continue;
          let src = im;
          if (Math.max(im.width, im.height) > texSize) {
            src = canvasOf(texSize);
            const g = src.getContext("2d");
            g.imageSmoothingQuality = "high";
            g.drawImage(im, 0, 0, texSize, texSize);
          }
          const tex = new THREE.Texture(src);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.needsUpdate = true;
          this.res.set(it.id, { type: "doll", tex });
        } else {
          const art = await KP.CLAY2.buildArt(it);
          if (!art || this.dead) continue;
          this.res.set(it.id, this.clayRes(art));
        }
      } catch (e) {
        console.warn("동물 준비 실패", it.tid, e && e.message);
      }
      await new Promise((r) => setTimeout(r, 0)); // 한 마리씩 (화면이 멈추지 않게)
    }
  };
  W3.freeRes = function (R) {
    if (R.type === "doll") R.tex.dispose();
    else {
      R.tex.dispose();
      R.ntex.dispose();
      R.mat.dispose();
      for (const g of Object.values(R.groups)) g && g.dispose();
      for (const e of R.eyes) e.geo && e.geo.dispose();
    }
  };
  /** 도안 동물 그림 한 장 → 점토 질감·입체 (Clay 2.0) */
  W3.clayRes = function (art) {
    const C = KP.CLAY2;
    C.layout(art.model, 1.15, true);
    const bk = C.bakeClay2(art, { grain: 1 });
    const aniso = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    const tex = new THREE.CanvasTexture(bk.colorC);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    const ntex = new THREE.CanvasTexture(bk.normalC);
    ntex.colorSpace = THREE.NoColorSpace;
    ntex.anisotropy = aniso;
    const mat = this.clayMat({ map: tex, normalMap: ntex, vertexColors: true, specular: 0x1c1a18, shininess: 14 });
    mat.color.setScalar(CLAY_GAIN);
    const groups = {}, eyes = [];
    for (const [name, gr] of Object.entries(art.model.groups)) {
      const list = [];
      for (const pc of art.model.pieces) {
        if (pc.group !== name) continue;
        if (pc.kind === "eye") eyes.push({ pc, geo: C.merge(C.pieceGeo(pc, art, [pc.cx, pc.cy], true)), group: name });
        else list.push(...C.pieceGeo(pc, art, gr.pivot, true));
      }
      groups[name] = C.merge(list);
    }
    return { type: "clay", art, tex, ntex, mat, groups, eyes };
  };
  /** 인형 종 등록: 같은 종 인형들이 모양·얼굴 텍스처를 같이 씀 */
  W3.addKind = function (id, model, B) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(model.POSITION, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(model.NORMAL, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(B.uv, 2));
    const nv = model.POSITION.length / 3, P = KP.DOLL.P;
    const ao = new Float32Array(nv), front = new Float32Array(nv);
    let x0 = 9, x1 = -9;
    for (let v = 0; v < nv; v++) {
      ao[v] = (model._AO ? model._AO[v] : 255) / 255;
      const nz = model.NORMAL[v * 3 + 2];
      // 얼굴 덧칠은 머리·주둥이 앞쪽만 (뒤통수에 눈이 비치지 않게)
      front[v] = B.part[v] === P.head || B.part[v] === P.snout ? clamp((nz - 0.05) / 0.3, 0, 1) : 0;
      x0 = Math.min(x0, model.POSITION[v * 3]);
      x1 = Math.max(x1, model.POSITION[v * 3]);
    }
    geo.setAttribute("aAO", new THREE.BufferAttribute(ao, 1));
    geo.setAttribute("aFront", new THREE.BufferAttribute(front, 1));
    geo.setAttribute("aWA", new THREE.BufferAttribute(B.weights.A, 4));
    geo.setAttribute("aWB", new THREE.BufferAttribute(B.weights.B, 4));
    geo.setIndex(new THREE.BufferAttribute(model.index, 1));
    geo.computeBoundingSphere();
    geo.boundingSphere.radius *= 1.3; // 움직임 여유
    const faceT = new THREE.CanvasTexture(KP.DOLL.faceCanvas(B.spec, this.hi ? 1024 : 512));
    faceT.colorSpace = THREE.SRGBColorSpace;
    faceT.anisotropy = 4;
    return { id, geo, B, spec: B.spec, faceT, w: x1 - x0, mv: B.spec.move };
  };
  /** 인형 재질: 그림 텍스처 + 절차적 움직임 (모든 종이 같은 셰이더 하나) */
  W3.dollMat = function (tex, k) {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, bumpMap: this.grainT, bumpScale: 0.35 });
    const v3 = (a) => new THREE.Vector3(...a);
    const p = k.spec.pivot, mv = k.mv;
    const Uf = {
      uPh: { value: 0 }, uAmp: { value: 0 }, uEar: { value: 0 }, uHead: { value: new THREE.Vector2() }, uTail: { value: 0 }, uArmUp: { value: 0 },
      uFace: { value: k.faceT }, uAOk: { value: 0.6 },
      uArmP: { value: v3(p.arm) }, uEarP: { value: v3(p.ear) }, uHeadP: { value: v3(p.head) }, uTailP: { value: v3(p.tail) },
      uEarAx: { value: v3(mv.earAx).normalize() }, uTailAx: { value: v3(mv.tailAx).normalize() }, uLegH: { value: p.leg || 0.2 },
      uLeg: { value: new THREE.Vector2(mv.legLift, mv.legStep) }, uArmSw: { value: mv.armSwing },
      uTailBlur: { value: k.spec.swing ? 0 : k.spec.merge && k.spec.merge.tail ? 5 : 2 },
    };
    m.userData.U = Uf;
    m.customProgramCacheKey = () => "doll8";
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, Uf);
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uPh, uAmp, uEar, uTail, uArmUp, uLegH, uArmSw; uniform vec2 uHead, uLeg;
uniform vec3 uArmP, uEarP, uHeadP, uTailP, uEarAx, uTailAx;
attribute vec4 aWA; attribute vec4 aWB; attribute float aAO; attribute float aFront;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
mat3 rA(vec3 a, float t){float c=cos(t),s=sin(t),C=1.-c;return mat3(
  c+a.x*a.x*C, a.y*a.x*C+a.z*s, a.z*a.x*C-a.y*s,
  a.x*a.y*C-a.z*s, c+a.y*a.y*C, a.z*a.y*C+a.x*s,
  a.x*a.z*C+a.y*s, a.y*a.z*C-a.x*s, c+a.z*a.z*C);}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `vec3 dP = position; vec3 dN = normal;
{
  float s = sin(uPh);
  vec3 sh = uArmP, shL = sh * vec3(-1.,1.,1.);
  mat3 RaR = rZ(uArmUp) * rX(-s * uArmSw * uAmp);
  mat3 RaL = rZ(-uArmUp) * rX(s * uArmSw * uAmp);
  mat3 ReR = rA(uEarAx, uEar), ReL = rA(uEarAx * vec3(-1.,1.,1.), -uEar);
  vec3 ep = uEarP, epL = ep * vec3(-1.,1.,1.);
  mat3 Rt = rA(uTailAx, uTail);
  vec3 tp = uTailP;
  float lift = 1.0 - clamp(position.y / uLegH, 0.0, 1.0);
  vec3 dLR = vec3(0., max(0., s) * uLeg.x, s * uLeg.y) * uAmp * lift;
  vec3 dLL = vec3(0., max(0., -s) * uLeg.x, -s * uLeg.y) * uAmp * lift;
  vec3 p0 = position;
  dP = p0
    + aWA.x * (RaR * (p0 - sh) + sh - p0) + aWA.y * (RaL * (p0 - shL) + shL - p0)
    + aWA.z * dLR + aWA.w * dLL
    + aWB.x * (ReR * (p0 - ep) + ep - p0) + aWB.y * (ReL * (p0 - epL) + epL - p0)
    + aWB.w * (Rt * (p0 - tp) + tp - p0);
  dN = normal
    + aWA.x * (RaR * normal - normal) + aWA.y * (RaL * normal - normal)
    + aWB.x * (ReR * normal - normal) + aWB.y * (ReL * normal - normal) + aWB.w * (Rt * normal - normal);
  mat3 Rh = rY(uHead.y) * rZ(uHead.x);
  vec3 nk = uHeadP;
  dP = mix(dP, Rh * (dP - nk) + nk, aWB.z);
  dN = normalize(mix(dN, Rh * dN, aWB.z));
}
vAO = aAO; vFront = aFront; vSide = 1.0 - abs(normal.z); vBack = smoothstep(0.15, 0.6, -normal.z); vTail = aWB.w;
vec3 objectNormal = dN;
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif`
        )
        .replace("#include <begin_vertex>", "vec3 transformed = dP;");
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
uniform sampler2D uFace; uniform float uAOk; uniform float uTailBlur;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail;`
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv, max(max(max(0.0, vSide - 0.35) * 4.0, vBack * 2.2), vTail * uTailBlur) );
  vec4 fc = texture2D( uFace, vMapUv );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, fc.rgb, fc.a * vFront );
  diffuseColor *= sampledDiffuseColor;
#endif
  float aoF = mix(1.0, smoothstep(0.0, 0.85, vAO), uAOk);
  diffuseColor.rgb *= aoF;`
        );
    };
    return m;
  };

  /* ---------- 동물 ---------- */
  W3.tOf = function (item) {
    return item.tid === "doll" ? KP.DOLL.tOf(item.species) : this.T[item.tid];
  };
  /** 동물 하나의 자기 것(재질·그림자)만 장면에서 빼고 정리 — 그림 자원(res)은 다시 꾸밀 때 재사용 */
  W3.freeAnimal = function (a) {
    this.scene.remove(a.root, a.contact, a.cast);
    if (a.type === "doll") a.mat.dispose();
  };
  W3.clear = function () {
    for (const a of this.animals) this.freeAnimal(a);
    for (const t of this.treats) this.scene.remove(t.obj);
    this.animals = [];
    this.treats = [];
  };
  W3.addAnimal = function (item, isNew) {
    const R = this.res.get(item.id);
    if (!R) return null; // 준비 못 한 친구(그림 오류 등)는 빼고
    const t = this.tOf(item);
    const a = {
      id: ++this.seq, item, t, type: R.type, x: 0, z: -5, y: 0, tx: 0, tz: -5, ty: 0, state: "idle", wait: Math.random() * 2, speed: 0,
      isNew: 0, treat: null, gather: false, look: 0, react: -1, seed: Math.random() * 100,
    };
    const S = this.scene;
    a.contact = new THREE.Mesh(G.plane, this.contactM);
    a.cast = new THREE.Mesh(G.plane, this.castM);
    a.contact.renderOrder = a.cast.renderOrder = -1;
    if (R.type === "doll") {
      const k = (a.kind = this.kinds[item.species]);
      a.mat = this.dollMat(R.tex, k);
      a.root = new THREE.Mesh(k.geo, a.mat);
      Object.assign(a, { yaw: 0, ph: Math.random() * 6, amp: 0, sq: 0, sqv: 0, happy: 0, hop: 0, M: k.mv });
      a.hopper = k.mv.hop > 0;
    } else {
      const art = (a.art = R.art), m = art.model;
      a.rig = m.rig;
      a.fly = !!m.rig.fly;
      a.swim = !!m.rig.swim;
      a.hopper = !!m.rig.hop;
      const obj = new THREE.Group(), poseO = new THREE.Group();
      obj.add(poseO);
      const joints = {};
      for (const [name, gr] of Object.entries(m.groups)) {
        const j = new THREE.Group(), parent = gr.parent ? joints[gr.parent] : null;
        const pp = parent ? m.groups[gr.parent].pivot : m.foot;
        j.position.set(gr.pivot[0] - pp[0], -(gr.pivot[1] - pp[1]), 0);
        (parent || poseO).add(j);
        joints[name] = j;
        if (R.groups[name]) j.add(new THREE.Mesh(R.groups[name], R.mat));
      }
      const eyes = [];
      for (const e of R.eyes) {
        if (!e.geo) continue;
        const pv = m.groups[e.group].pivot, mesh = new THREE.Mesh(e.geo, this.eyeMat);
        mesh.position.set(e.pc.cx - pv[0], -(e.pc.cy - pv[1]), 0);
        joints[e.group].add(mesh);
        eyes.push(mesh);
      }
      a.root = obj;
      Object.assign(a, { poseO, joints, eyes, walk: Math.random() * 6, face: Math.random() < 0.5 ? 1 : -1, turn: 0, hopT: 0, blinkT: 1 + Math.random() * 3, blink: 0, wag: Math.random() * 6, flap: Math.random() * 6, oyaw: 0 });
      a.faceShow = a.face;
    }
    S.add(a.contact, a.cast, a.root);
    this.animals.push(a);
    if (a.swim && !this.pond) this.setupPond();
    this.sizeOf(a);
    if (a.swim) {
      const p = this.pondPick(a);
      a.x = a.tx = p[0];
      a.z = a.tz = p[1];
    } else {
      // 다른 친구와 가장 먼 자리
      let best = null, bd = -1;
      for (let i = 0; i < 12; i++) {
        const g = this.pickFor(a);
        if (!g) continue;
        let d = 9;
        for (const o of this.animals) if (o !== a && !o.fly && !o.swim) d = Math.min(d, Math.hypot(o.x - g[0], (o.z - g[1]) * 0.8) / ((o.w + a.w) / 2));
        if (d > bd) {
          bd = d;
          best = g;
        }
      }
      if (best) {
        a.x = a.tx = best[0];
        a.z = a.tz = best[1];
      } else if (this.bc) {
        const g = this.bc.ground(0.5, 0.75) || [0, -5];
        a.x = a.tx = g[0];
        a.z = a.tz = g[1];
      }
      if (a.fly) a.y = a.ty = 0.7 + Math.random() * 0.8;
      if (isNew && this.bc) {
        // 새 친구: 화면 왼쪽 밖에서 걸어(날아) 들어옴
        const v = this.bc.uv(a.x, 0, a.z), zc = v[2], t = Math.tan((this.bc.fov * Math.PI) / 360);
        const xl = (this.bc.vis.u0 - 0.04 - 0.5) * 2 * zc * t * IA - a.w * 0.6;
        a.tx = a.x;
        a.tz = a.z;
        a.x = xl;
        a.state = "walk";
        a.walkT = 12;
        a.isNew = 7;
        a.face = a.faceShow = 1;
      }
    }
    this.place(a, 0);
    return a;
  };

  /* ---------- 움직임 ---------- */
  const gapOf = (a, b) => ((a.w + b.w) / 2) * 1.02;
  const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, (az - bz) * 0.8);
  /** 걸어갈 곳 고르기 — 인형: 정면~3/4 위주(얼굴이 보이게), 도안 동물: 옆모습 위주(±25°) */
  W3.pickWalk = function (a) {
    let best = null, bs = -1e9;
    const tn = Math.tan(25 * DEG);
    for (let k = 0; k < 10; k++) {
      const g = this.pickFor(a);
      if (!g) continue;
      const dx = g[0] - a.x, dz = g[1] - a.z, d = Math.hypot(dx, dz);
      if (d < 0.35) continue;
      let crowd = false;
      for (const o of this.animals) {
        if (o === a || o.fly || o.swim) continue;
        const gp = gapOf(a, o);
        if (dist2(g[0], g[1], o.x, o.z) < gp || (o.state === "walk" && dist2(g[0], g[1], o.tx, o.tz) < gp)) {
          crowd = true;
          break;
        }
      }
      if (crowd) continue;
      let score;
      if (a.type === "doll") score = (dz >= 0 ? 1 : 1 + (dz / (Math.abs(dx) + 0.01)) * 0.8) - d * 0.08 + Math.random() * 0.3;
      else {
        // 옆으로 걷기: 앞뒤가 많이 바뀌면 앞뒤만 줄여 봄
        let gz = g[1];
        if (Math.abs(dz) > Math.abs(dx) * tn) {
          gz = a.z + Math.sign(dz) * Math.abs(dx) * tn;
          if (!this.inside(a, g[0], gz)) continue;
        }
        g[1] = gz;
        score = Math.abs(dx) > 0.35 ? 1 - d * 0.05 + Math.random() * 0.3 : -1;
      }
      if (score > bs) {
        bs = score;
        best = g;
      }
    }
    return best;
  };
  W3.tick = function (dt) {
    if (this.lost || this.dead) return;
    this.measure();
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.resize();
    const t = this.time;
    for (const a of this.animals) this.stepA(a, dt, t);
    // 겹치지 않게 살짝 밀기 (땅 친구끼리)
    const land = this.animals.filter((a) => !a.fly && !a.swim && !a.isNew);
    for (let i = 0; i < land.length; i++)
      for (let j = i + 1; j < land.length; j++) {
        const a = land[i], b = land[j], dx = b.x - a.x, dz = (b.z - a.z) * 0.8, d = Math.hypot(dx, dz), min = gapOf(a, b) * 0.85;
        if (d > 0.001 && d < min) {
          const p = ((min - d) / d) * 0.5 * Math.min(1, dt * 4);
          const ax = a.x - dx * p, az = a.z - (dz / 0.8) * p * 0.5, bx = b.x + dx * p, bz = b.z + (dz / 0.8) * p * 0.5;
          if (this.inside(a, ax, az)) (a.x = ax), (a.z = az);
          if (this.inside(b, bx, bz)) (b.x = bx), (b.z = bz);
        }
      }
    for (const a of this.animals) this.place(a, dt);
    this.tickTreats(dt);
    this.render();
    this.frames = (this.frames || 0) + 1;
  };
  W3.stepA = function (a, dt, t) {
    if (a.isNew) a.isNew = Math.max(0, a.isNew - dt);
    if (a.react >= 0 && (a.react += dt) > 1.25) a.react = -1;
    if (a.type === "clay") {
      a.blinkT -= dt;
      if (a.blinkT <= 0) {
        a.blink = 0.16;
        a.blinkT = 2 + Math.random() * 3.5;
      }
      if (a.blink > 0) a.blink -= dt;
      a.wag += dt * (a.react >= 0 ? 16 : 8);
      if (a.turn > 0) {
        a.turn -= dt / 0.36;
        if (a.turn <= 0.5 && a.faceShow !== a.face) a.faceShow = a.face;
        if (a.turn < 0) a.turn = 0;
      }
    }
    const busy = a.treat || a.gather;
    if (a.fly) {
      // 하늘: 천천히 다른 곳으로
      a.flap += dt * (a.react >= 0 ? 30 : 20);
      a.wait -= dt;
      if (a.state !== "walk" || a.wait <= 0 || Math.hypot(a.tx - a.x, a.tz - a.z) < 0.25) {
        if (!a.gather || a.state !== "walk") {
          a.ty = 0.7 + Math.random() * 0.9;
          const g = this.pickFor(Object.assign({}, a, { y: a.ty }));
          if (g) (a.tx = g[0]), (a.tz = g[1]);
          a.gather = false;
        }
        a.state = "walk";
        a.wait = 2.5 + Math.random() * 2.5;
      }
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz) || 1, sp = 0.9 * this.sk * (a.isNew ? 1.4 : 1);
      if (d > 0.05) {
        a.x += (dx / d) * Math.min(d, sp * dt);
        a.z += (dz / d) * Math.min(d, sp * dt);
      }
      a.y += (a.ty - a.y) * dt * 0.8;
      const f = dx > 0.05 ? 1 : dx < -0.05 ? -1 : a.face;
      if (f !== a.face && a.turn === 0) (a.face = f), (a.turn = 1);
      return;
    }
    if (a.swim) {
      a.wait -= dt;
      if (a.state === "idle" && a.wait <= 0) {
        const p = this.pondPick(a);
        a.tx = p[0];
        a.tz = p[1];
        a.state = "walk";
      }
      if (a.state === "walk") {
        const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
        if (d < 0.05) {
          a.state = "idle";
          a.wait = 0.8 + Math.random() * 2;
        } else {
          const sp = 0.32 * this.sk;
          a.x += (dx / d) * Math.min(d, sp * dt);
          a.z += (dz / d) * Math.min(d, sp * dt);
          const f = dx > 0.02 ? 1 : dx < -0.02 ? -1 : a.face;
          if (f !== a.face && a.turn === 0) (a.face = f), (a.turn = 1);
        }
      }
      return;
    }
    // 땅
    if (a.react >= 0 && a.react < 0.9 && a.type === "clay") return; // 누르면 그 자리에서 반응
    if (a.state === "idle") {
      a.speed = Math.max(0, a.speed - dt * 3);
      a.wait -= dt;
      if (a.wait <= 0) {
        let g = null;
        if (a.treat) g = [a.treat.ax, a.treat.az];
        else if (!a.gather) g = this.pickWalk(a);
        if (g) {
          a.tx = g[0];
          a.tz = g[1];
          a.state = "walk";
          a.walkT = 12;
          a.hopT = a.hopper ? 99 : Math.random() < 0.25 ? 1.4 : 0;
          if (a.type === "clay") {
            const f = a.tx > a.x ? 1 : -1;
            if (f !== a.face) (a.face = f), (a.turn = 1);
          }
        } else a.wait = 0.6 + Math.random();
      }
    } else {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
      // a.speed: 화면 크기와 무관한 빠르기 (도안 동물 다리 박자용) — 실제 이동은 × mul
      const doll = a.type === "doll", mul = doll ? a.size / DOLL_H : this.sk;
      const base = doll ? a.M.speed * 1.15 : (a.hopT > 0 ? 1.0 : 0.6) * (a.rig.slow ? 0.45 : 1);
      const vmax = base * (busy ? 1.8 : 1) * (a.isNew ? 1.3 : 1) * (doll && a.happy > 0.2 ? 1.4 : 1);
      a.speed = Math.min(vmax, a.speed + dt * 2.2);
      if (a.hopT > 0 && !a.hopper) a.hopT -= dt;
      a.walkT -= dt;
      if (d < 0.06 || (a.walkT <= 0 && !busy && !a.isNew)) {
        a.state = "idle";
        a.wait = busy ? 0 : 1.2 + Math.random() * 2.8;
        if (a.treat) this.eat(a);
        else if (a.gather) {
          a.gather = false;
          a.look = 4;
          a.wait = 4;
        }
      } else {
        const st = Math.min(d, a.speed * mul * dt), nx = a.x + (dx / d) * st, nz = a.z + (dz / d) * st;
        let block = false;
        if (!a.isNew && !busy)
          for (const o of this.animals) {
            if (o === a || o.fly || o.swim) continue;
            const gp = gapOf(a, o), now = dist2(a.x, a.z, o.x, o.z), next = dist2(nx, nz, o.x, o.z);
            if (next < gp && next < now) {
              block = true;
              break;
            }
          }
        if (block) {
          a.state = "idle";
          a.wait = 0.3 + Math.random() * 0.6;
        } else if (a.isNew || busy || this.inside(a, nx, nz)) {
          a.x = nx;
          a.z = nz;
        } else {
          a.state = "idle";
          a.wait = 0.5;
        }
        if (a.type === "clay") {
          const f = dx > 0.05 ? 1 : dx < -0.05 ? -1 : a.face;
          if (f !== a.face && a.turn === 0) (a.face = f), (a.turn = 1);
          a.walk += dt * a.speed * 9.5;
        }
      }
    }
    if (a.look > 0) a.look -= dt;
  };

  /** 화면에 놓기 (자세·그림자) */
  W3.place = function (a, dt) {
    const t = this.time, sun = this.sunDir || new THREE.Vector3(-0.4, 1, 0.5);
    let topY = 0;
    if (a.type === "doll") {
      const Uf = a.mat.userData.U, M = a.M, s = a.size;
      const moving = a.state === "walk";
      a.amp = moving ? Math.min(1, a.amp + dt * 4) : Math.max(0, a.amp - dt * 3);
      if (moving) {
        const want = clamp(Math.atan2(a.tx - a.x, a.tz - a.z), -0.72, 0.72);
        a.yaw += (want - a.yaw) * Math.min(1, dt * 5);
      } else if (a.look > 0) a.yaw += (0 - a.yaw) * Math.min(1, dt * 5);
      else a.yaw += (Math.sin(t * 0.4 + a.seed) * 0.25 - a.yaw) * Math.min(1, dt * 1.5);
      a.ph += dt * (M.gait + a.happy * 3) * Math.max(0.15, a.amp);
      a.sqv += (-a.sq * 90 - a.sqv * 9) * dt;
      a.sq += a.sqv * dt;
      a.happy = Math.max(0, a.happy - dt * 0.5);
      if (a.hop > 0) {
        a.hop += dt;
        if (a.hop > 0.5) a.hop = 0;
      }
      const hopPh = Math.max(0, Math.sin(a.ph));
      const bob = Math.abs(Math.sin(a.ph)) * M.bob * a.amp + M.hop * Math.pow(hopPh, 0.8) * a.amp + (a.hop > 0 ? Math.sin((a.hop / 0.5) * Math.PI) * 0.18 : 0);
      const land = M.hop ? Math.max(0, -Math.sin(a.ph)) * 0.08 * a.amp : 0;
      const sq = clamp(a.sq * 0.06 + land, -0.2, 0.2);
      a.root.position.set(a.x, bob * s, a.z);
      a.root.rotation.set(M.hop ? -0.12 * hopPh * a.amp : 0, a.yaw, Math.sin(a.ph) * M.roll * a.amp, "YXZ");
      a.root.scale.set(s * (1 + sq * 0.6), s * (1 - sq), s * (1 + sq * 0.6));
      Uf.uPh.value = a.ph;
      Uf.uAmp.value = a.amp;
      Uf.uEar.value = M.earBase + a.amp * M.ear * Math.sin(a.ph * 2 - 0.7) + a.happy * M.earHappy * Math.sin(t * 16) + Math.sin(t * 1.3 + a.seed) * 0.03 * (M.ear > 0 ? 1 : 0);
      Uf.uHead.value.set(Math.sin(a.ph) * 0.05 * a.amp + Math.sin(t * 0.9 + a.seed) * 0.05 * (1 - a.amp), a.happy * 0.25 * Math.sin(t * 5));
      Uf.uTail.value = Math.sin(t * (M.tailRate + a.happy * 10) + a.seed) * (M.tail + a.happy * 0.25);
      Uf.uArmUp.value = a.happy * 0.9;
      a.bobY = bob * s;
    } else {
      const C = KP.CLAY2, m = a.art.model, s = C.U * a.size;
      const ps = C.pose(a, t);
      a.root.position.set(a.x, a.swim ? 0.06 * this.sk : a.y, a.z);
      // 옆모습 위주: 걷는 방향 쪽으로 최대 ±25°, 서 있을 땐 카메라 쪽으로 10° (입체가 보이게)
      const mir = ps.root.mirror, moving = !a.fly && a.state === "walk" && a.react < 0;
      let ty = -mir * 10 * DEG;
      if (moving) ty = clamp(-mir * Math.atan2(a.tz - a.z, Math.abs(a.tx - a.x) + 1e-6), -25 * DEG, 25 * DEG);
      if (a.turn > 0) ty = 0;
      if (a.omir !== mir) {
        a.oyaw = a.omir == null ? ty : -(a.oyaw || 0);
        a.omir = mir;
      }
      a.oyaw += (ty - a.oyaw) * Math.min(1, dt * 4);
      let ksx = 1, ksy = 1, by = 0, headBob = 0;
      const sp = Math.min(1, a.speed / 0.6);
      if (moving && !(a.hopT > 0)) {
        const c = Math.cos(2 * a.walk);
        ksy = 1 - 0.04 * c * sp;
        ksx = 1 + 0.028 * c * sp;
        by = Math.abs(Math.sin(a.walk)) * 1.6 * sp;
        headBob = Math.sin(2 * a.walk - 0.8) * 2.4 * sp;
      } else if (!a.fly && a.react < 0) {
        const b = Math.sin(t * 2.3 + a.id * 1.7);
        ksy = 1 + 0.018 * b;
        ksx = 1 - 0.012 * b;
      }
      a.root.rotation.y = ps.root.ry * DEG + a.oyaw;
      a.root.scale.set(s * ps.root.mirror, s, s);
      a.poseO.position.y = ps.root.y + by;
      a.poseO.rotation.z = -ps.root.rz * DEG;
      a.poseO.scale.set(ps.root.sx * ksx, ps.root.sy * ksy, (ps.root.sx * ksx + ps.root.sy * ksy) / 2);
      for (const [name, gr] of Object.entries(m.groups)) {
        if (!gr.parent) continue;
        const j = a.joints[name], q = ps.g[name];
        j.rotation.z = (q && q.rz ? -q.rz * DEG : 0) + (name === "head" ? -headBob * DEG : 0);
        j.rotation.y = q && q.ry ? (gr.flap ? 1 : -1) * q.ry * DEG : 0;
        j.scale.set((q && q.sx) || 1, (q && q.sy) || 1, 1);
      }
      for (const e of a.eyes) e.scale.y = ps.eye;
      a.bobY = (ps.root.y + by) * s;
      topY = a.fly ? a.y : 0;
    }
    // 그림자: 발밑 접촉 + 햇빛 반대쪽으로 길게. 하늘 친구는 높이 따라 작고 흐리게
    const hgt = a.fly ? a.y : a.bobY || 0;
    const sr = a.w * 0.62 * (a.swim ? 0.7 : 1), k = 1 - Math.min(0.6, hgt * 0.35);
    a.contact.position.set(a.x, 0.003, a.z + 0.02 * a.h);
    a.contact.scale.set(sr * k, 1, sr * 0.55 * k);
    a.contact.visible = !a.swim;
    const sl = Math.hypot(sun.x, sun.z) || 1, L = clamp(1.6 / Math.max(0.3, sun.y / sl), 0.6, 2.4) * 0.5 * a.h;
    a.cast.visible = !a.fly && !a.swim;
    a.cast.position.set(a.x - (sun.x / sl) * L * 0.55, 0.002, a.z - (sun.z / sl) * L * 0.55);
    a.cast.rotation.y = Math.atan2(-sun.x, -sun.z);
    a.cast.scale.set(sr * 0.95, 1, sr * 0.6 + L);
    void topY;
  };

  /** 화질 단계: 0 고화질 · 1 해상도↓ · 2 더↓ · 3 최저 */
  W3.applyQ = function (q) {
    this.q = q;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(dpr, [2, 1.5, 1.25, 1][q]));
    if (this.w) this.renderer.setSize(this.w, this.h, false);
  };
  /** 느린 기기면 화질을 한 단계씩 낮춤 (초당 약 28장 미만이 이어질 때) */
  W3.measure = function () {
    const now = performance.now();
    if (!this._warm) this._warm = now + 3000; // 처음 3초(불러오기)는 빼고
    const f = now - (this._lt || now);
    this._lt = now;
    if (now < this._warm || f <= 0 || f > 3000) return; // 3초 넘는 틈은 화면이 가려졌던 것
    this._fs = (this._fs || 0) + f;
    this._fn = (this._fn || 0) + 1;
    if (this._fs < 4000 || this._fn < 8) return; // 약 4초마다 판단
    const avg = this._fs / this._fn;
    this._fs = this._fn = 0;
    this.fps = Math.round(1000 / avg);
    if (avg > 36 && this.q < 3) {
      this.applyQ(this.q + 1);
      KP.store.set("zoo3d:q", { q: this.q, t: Date.now() });
      this._warm = now + 1500;
    } else if (this.q >= 3 && avg > 55) {
      // 가장 낮은 화질에서도 초당 18장도 안 나오면(두 번 연속) 그림 동물원으로
      this._slowN = (this._slowN || 0) + 1;
      if (this._slowN >= 2 && this.onSlow && !this._slowTold) {
        this._slowTold = true;
        this._slowT = setTimeout(() => this.onSlow(), 0); // 지금 그리는 장면을 마친 뒤에
      }
    } else this._slowN = 0;
  };
  W3.render = function () {
    if (this.lost || this.dead || !this.bc) return;
    this.renderer.render(this.scene, this.camera);
  };

  /* ---------- 간식 ---------- */
  W3.makeTreat = function () {
    const g = new THREE.Group();
    const kind = U.pick(["apple", "carrot", "corn", "apple"]);
    if (kind === "apple") {
      const a = new THREE.Mesh(G.sph, treatMat("#ff4d5e", 0.35));
      a.scale.set(0.32, 0.29, 0.32);
      const s = new THREE.Mesh(G.cyl, treatMat("#6b4226", 0.7));
      s.position.y = 0.32;
      s.scale.set(0.03, 0.14, 0.03);
      const l = new THREE.Mesh(G.sphLo, treatMat("#4fae45", 0.7));
      l.position.set(0.09, 0.34, 0);
      l.scale.set(0.11, 0.03, 0.06);
      g.add(a, s, l);
      g.userData.rest = 0.29;
    } else if (kind === "carrot") {
      const c = new THREE.Mesh(G.cone, treatMat("#ff8a2b", 0.35));
      c.scale.set(0.16, 0.6, 0.16);
      c.rotation.z = Math.PI / 2;
      g.add(c);
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(G.cone, treatMat("#3f9a3c", 0.7));
        l.position.set(-0.36, 0, (i - 1) * 0.05);
        l.scale.set(0.04, 0.22, 0.04);
        l.rotation.z = Math.PI / 2 + (i - 1) * 0.4;
        g.add(l);
      }
      g.userData.rest = 0.16;
    } else {
      const c = new THREE.Mesh(G.cap, treatMat("#ffd54a", 0.35));
      c.rotation.z = Math.PI / 2;
      const l = new THREE.Mesh(G.sph, treatMat("#7fc95a", 0.7));
      l.position.set(-0.12, 0.02, 0);
      l.scale.set(0.2, 0.12, 0.16);
      g.add(c, l);
      g.userData.rest = 0.14;
    }
    return g;
  };
  /** 땅 위 점을 풀밭 안으로 (풀밭 가운데 쪽으로 당김) */
  W3.toGrass = function (x, z) {
    const probe = { w: 0.6 * this.sk, h: 0.3, fly: false };
    if (this.inside(probe, x, z)) return [x, z];
    const c = this.bc.ground((this.bc.vis.u0 + this.bc.vis.u1) / 2, Math.min(this.bc.vis.v1 - 0.12, 0.8)) || [0, -6];
    for (let i = 1; i <= 20; i++) {
      const k = i / 20, px = x + (c[0] - x) * k, pz = z + (c[1] - z) * k;
      if (this.inside(probe, px, pz)) return [px, pz];
    }
    return this.bc.pick(probe);
  };
  W3.dropTreat = function (x, z) {
    const p = this.toGrass(x, z);
    if (!p) return;
    [x, z] = p;
    const obj = this.makeTreat(), k = 0.75 * this.sk;
    obj.scale.setScalar(k);
    obj.position.set(x, 4, z);
    obj.rotation.y = Math.random() * 6;
    this.scene.add(obj);
    const tr = { x, z, obj, vy: 0, rest: obj.userData.rest * k, bounce: 2, taken: false, k };
    this.treats.push(tr);
    KP.audio.sfx("drop");
    const land = this.animals.filter((a) => !a.fly && !a.swim && !a.treat && !a.isNew);
    land.sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z));
    const a = land[0];
    if (a) {
      // 간식 바로 옆에서 멈춤 (입이 간식에 닿게: 도안 동물은 옆, 인형은 앞)
      const side = a.type === "clay" ? (a.x < x ? -1 : 1) : 0;
      tr.ax = x + side * a.w * 0.55;
      tr.az = z + (side ? 0 : 0.35 * a.h);
      if (!this.inside(a, tr.ax, tr.az)) (tr.ax = x), (tr.az = z);
      a.treat = tr;
      a.gather = false;
      a.state = "idle";
      a.wait = 0;
    } else this.ctx.after(4000, () => this.removeTreat(tr));
  };
  W3.tickTreats = function (dt) {
    for (const t of this.treats) {
      if (t.vy !== undefined) {
        t.vy -= 22 * dt;
        t.obj.position.y += t.vy * dt;
        if (t.obj.position.y < t.rest) {
          t.obj.position.y = t.rest;
          t.vy = t.bounce > 0 ? -t.vy * 0.35 : 0;
          t.bounce--;
          if (t.bounce < 0) delete t.vy;
        }
      }
      if (t.eating !== undefined) {
        t.eating -= dt;
        t.obj.scale.setScalar(Math.max(0.01, (t.eating / 0.3) * t.k));
        if (t.eating <= 0) {
          this.scene.remove(t.obj);
          t.gone = true;
        }
      }
    }
    if (this.treats.some((t) => t.gone)) this.treats = this.treats.filter((t) => !t.gone);
  };
  W3.removeTreat = function (tr) {
    if (!tr || tr.gone || tr.eating !== undefined) return;
    tr.taken = true;
    tr.eating = 0.3;
  };
  W3.eat = function (a) {
    const tr = a.treat;
    a.treat = null;
    if (!tr || tr.taken) return;
    if (a.type === "clay" && Math.abs(tr.x - a.x) > 0.05) {
      const f = tr.x > a.x ? 1 : -1;
      if (f !== a.face) (a.face = f), (a.turn = 1);
    }
    this.removeTreat(tr);
    this.cheer(a);
    this.hearts(a, 3);
    KP.audio.sfx("bubble");
    KP.voice.say(U.pick(["냠냠! 맛있다!", "고마워요!", "냠냠냠!"]));
  };
  W3.treatTime = function () {
    for (let i = 0; i < 3; i++)
      this.ctx.after(i * 250, () => {
        if (this.dead || !this.bc) return;
        const g = this.bc.pick({ w: 0.6 * this.sk, h: 0.3 });
        if (g) this.dropTreat(g[0], g[1]);
      });
  };
  /** 📣 모두 모여라: 땅 친구는 앞쪽에 줄지어, 하늘 친구는 그 위로 */
  W3.callAll = function () {
    const bc = this.bc;
    if (!bc) return;
    this.treats.forEach((t) => this.removeTreat(t));
    const land = this.animals.filter((a) => !a.fly && !a.swim);
    land.forEach((a) => (a.treat = null));
    const uc = (bc.vis.u0 + bc.vis.u1) / 2;
    const rows = [];
    let left = land.slice().sort((p, q) => q.w - p.w);
    for (let r = 0; r < 6 && left.length; r++) {
      const v = Math.min(bc.vis.v1 - 0.08, 0.92) - r * 0.12 * (this.sk || 1);
      const c = bc.ground(uc, v);
      if (!c) break;
      // 이 줄에서 풀밭 안인 왼쪽·오른쪽 끝
      const probe = { w: 0.5, h: 0.3 };
      let x0 = c[0], x1 = c[0];
      for (let i = 0; i < 60 && this.inside(probe, x0 - 0.15, c[1]); i++) x0 -= 0.15;
      for (let i = 0; i < 60 && this.inside(probe, x1 + 0.15, c[1]); i++) x1 += 0.15;
      if (x1 - x0 < 0.5) continue;
      const row = [];
      let wsum = 0;
      for (const a of left) {
        if (wsum + a.w * 1.1 > x1 - x0 && row.length) break;
        row.push(a);
        wsum += a.w * 1.1;
      }
      left = left.slice(row.length);
      let x = (x0 + x1) / 2 - wsum / 2;
      for (const a of row) {
        const ax = x + a.w * 0.55;
        x += a.w * 1.1;
        let g = [ax, c[1]];
        if (!this.inside(a, g[0], g[1])) g = this.toGrass(g[0], g[1]) || g;
        a.tx = g[0];
        a.tz = g[1];
      }
      rows.push(row);
    }
    for (const a of land) {
      if (left.includes(a)) {
        const g = this.pickFor(a);
        if (g) (a.tx = g[0]), (a.tz = g[1]);
      }
      a.state = "walk";
      a.walkT = 12;
      a.gather = true;
      a.hopT = a.hopper ? 99 : 0;
      if (a.type === "clay") {
        const f = a.tx > a.x ? 1 : -1;
        if (f !== a.face) (a.face = f), (a.turn = 1);
      }
    }
    for (const a of this.animals)
      if (a.fly) {
        const g = bc.ground(uc + (Math.random() - 0.5) * 0.2, Math.min(bc.vis.v1 - 0.25, 0.7));
        if (g) (a.tx = g[0]), (a.tz = g[1]);
        a.ty = 1.2 + Math.random() * 0.5;
        a.state = "walk";
        a.gather = true;
        a.wait = 4;
      }
  };
  /** 다 같이 폴짝 (모여라 끝·간식 먹기) */
  W3.cheer = function (a) {
    if (a.type === "doll") {
      a.sqv = 7;
      a.happy = 1;
      a.hop = 0.0001;
    } else a.react = 0;
  };

  /* ---------- 화면 좌표 ---------- */
  const v3 = { x: 0, y: 0, z: 0 };
  W3.project = function (x, y, z) {
    const v = (this._v = this._v || new THREE.Vector3()).set(x, y, z).project(this.camera);
    v3.x = ((v.x + 1) / 2) * this.w;
    v3.y = ((1 - v.y) / 2) * this.h;
    v3.z = v.z;
    return v3;
  };
  W3.toScreen = function (a, up = 1) {
    const p = this.project(a.x, (a.fly ? a.y : 0) + a.h * up, a.z);
    return { x: p.x, y: p.y };
  };
  W3.hearts = function (a, n) {
    const p = this.toScreen(a);
    for (let i = 0; i < n; i++) {
      const h = U.el("div", "zHeart", KP.E(U.pick(["💖", "💕", "⭐"])));
      h.style.left = p.x - 14 + U.randf(-20, 20) + "px";
      h.style.top = p.y - 20 + "px";
      h.style.animationDelay = i * 0.15 + "s";
      this.host.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
  };

  /* ---------- 터치: 동물은 화면에서 넉넉한 네모로 (어린아이 손가락), 빈 땅은 간식 ---------- */
  W3.pick = function (cx, cy) {
    const rc = this.renderer.domElement.getBoundingClientRect(), px = cx - rc.left, py = cy - rc.top;
    let best = null, bz = 9;
    for (const a of this.animals) {
      const y0 = a.fly ? a.y : 0;
      const b = this.project(a.x, y0, a.z), bx = b.x, by = b.y, bzz = b.z;
      const tp = this.project(a.x, y0 + a.h * 1.05, a.z).y;
      const hh = Math.max(40, by - tp), hw = Math.max(34, hh * (a.w / a.h) * 0.55);
      const top = a.swim ? by - hh * 1.3 : tp - 8, bot = a.swim ? by + hh * 0.5 : by + 10;
      if (px > bx - hw && px < bx + hw && py > top && py < bot && bzz < bz) {
        best = a;
        bz = bzz;
      }
    }
    if (best) return { animal: best };
    const ray = (this._ray = this._ray || new THREE.Raycaster());
    ray.setFromCamera(new THREE.Vector2((px / rc.width) * 2 - 1, -(py / rc.height) * 2 + 1), this.camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    if (d.y < -1e-4) {
      const s = -o.y / d.y;
      return { ground: { x: o.x + d.x * s, z: o.z + d.z * s } };
    }
    return {};
  };
  W3.bindInput = function () {
    const el = this.renderer.domElement;
    let start = null, lp = 0;
    el.addEventListener("pointerdown", (e) => {
      KP.audio.unlock();
      if (start) return; // 두 번째 손가락은 무시
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      const hit = this.pick(e.clientX, e.clientY);
      start.animal = hit.animal || null;
      if (hit.animal) {
        this.poke(hit.animal);
        clearTimeout(lp);
        lp = setTimeout(() => start && !start.moved && this.onDelete && this.onDelete(hit.animal), 1200); // 꾹 → 집에서 쉬기 버튼
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!start.moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) {
        start.moved = true;
        clearTimeout(lp);
      }
    });
    const end = (e) => {
      if (!start || e.pointerId !== start.id) return;
      clearTimeout(lp);
      if (!start.moved && !start.animal && e.type === "pointerup") {
        const hit = this.pick(e.clientX, e.clientY);
        if (hit.ground && this.animals.length) this.dropTreat(hit.ground.x, hit.ground.z);
      }
      start = null;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  };
  W3.poke = function (a) {
    this.cheer(a);
    a.look = 1.8;
    if (a.state === "walk" && !a.treat && !a.gather && !a.isNew && !a.fly && !a.swim) {
      a.state = "idle";
      a.wait = 2;
    }
    const nm = a.t.name;
    KP.voice.say(nm + "! " + a.t.cry + " 내가 색칠한 " + U.josa(nm, "이에요/예요") + "!");
    KP.audio.sfx(U.pick(["boing", "pop", "tap2"]));
    this.hearts(a, 2);
  };
  W3.remove = function (a) {
    this.animals = this.animals.filter((x) => x !== a);
    if (a.treat) this.removeTreat(a.treat);
    // 작아지며 사라짐
    let k = 1;
    const sx = a.root.scale.x, sy = a.root.scale.y, sz = a.root.scale.z;
    const shrink = () => {
      if (this.dead) return;
      k -= 0.08;
      a.root.scale.set(sx * Math.max(0.01, k), sy * Math.max(0.01, k), sz * Math.max(0.01, k));
      a.contact.scale.multiplyScalar(0.92);
      a.cast.scale.multiplyScalar(0.92);
      this.render();
      if (k > 0) requestAnimationFrame(shrink);
      else this.freeAnimal(a);
    };
    shrink();
  };
  W3.resetView = function () {};
})();
