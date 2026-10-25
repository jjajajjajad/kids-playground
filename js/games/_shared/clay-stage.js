/* =====================================================================
   점토 무대 (공용) — "점토 장난감을 직접 만지는 작은 방"
   층: [배경 그림(CSS, 그리기 비용 0)] → [투명 3D(Three.js)] → [앞가림 그림(선택)] → [2D 효과·UI]
   - 배경 그림과 같은 원근 카메라(bgCam)로 3D 를 겹침 — 동물원(zoo3d.js)에서 꺼내 일반화
   - 배경마다 설정 데이터: 그림 크기·지평선(vh)·화각(fov)·잘릴 때 남길 곳(focus, 세로 화면 focusP)·햇빛(sun)·자리(spots)
   - 안전 장치(동물원과 같은 규칙): 크기 변경 자동 · 자동 화질(초당 장수 측정) · 가장 낮은 화질에서도 느리면 onSlow
     · 그래픽이 끊기면 onLost · dispose 로 그래픽 메모리 바로 돌려줌 · Three.js 는 vendor 에서 필요할 때만 불러옴

   KP.clayStage.supported() / load() → THREE / bgCam(def, vw, vh) / inPoly(pts, x, y)
   const st = KP.clayStage.create(host, def, { qKey, onLost, onSlow })
     st.ui (2D 층) · st.scene · st.camera · st.tick(dt) · st.project(x,y,z) → {x,y,z}(host 기준 px)
     st.spot("seat") → [x,z] 땅 위 자리 · st.fitH(x, z, 화면 높이 비율) → 세상 키 · st.shadow(obj) 접촉 그림자 · st.dispose()
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  let THREE = null,
    loading = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  /** 그림에 맞춘 카메라 (화면 비율이 다르면 그림을 꽉 채워 잘라 보여 줌) — vw·vh: 보기 크기(CSS px)
      def: { img:[폭,높이](기본 1600×900), vh 지평선 높이(그림 비율), near 맨 아래 줄 세상 1단위 크기, fov, focus[u,v], focusP(세로 화면), poly(걷는 곳, 선택),
           zoom·zoomP(가로·세로 화면에서 더 크게 자르기, 선택) }
      무대 def 에는 front(앞가림 투명 그림) 또는 frontMask(배경 그림을 이 알파 마스크 모양만 앞에 한 번 더 — 작은 PNG) */
  function bgCam(def, vw, vh) {
    const IW = (def.img && def.img[0]) || 1600, IH = (def.img && def.img[1]) || 900, IA = IW / IH;
    const t = Math.tan((def.fov * Math.PI) / 360);
    const focus = (vw / vh < 0.8 && def.focusP) || def.focus || [0.5, 0.5];
    // zoom(가로 화면)·zoomP(세로 화면): 그림을 더 크게 잘라 보여 줌(주인공을 크게) — 없으면 1 (예전과 같음)
    const zd = vw / vh >= 1 ? def.zoom : def.zoomP;
    const zm = (typeof zd === "function" ? zd(vw, vh) : zd) || 1; // 함수면 화면 비율로 정함
    const k = Math.max(vw / IW, vh / IH) * zm, fw = IW * k, fh = IH * k;
    const ox = Math.max(0, Math.min(fw - vw, focus[0] * fw - vw / 2));
    const oy = Math.max(0, Math.min(fh - vh, focus[1] * fh - vh / 2));
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
    const poly = def.poly;
    const insideUV = (u, v) => u > vis.u0 + mu && u < vis.u1 - mu && v < vis.v1 - mu && v > vis.v0 && (!poly || inPoly(poly, u, v));
    /** 동물 a(w: 폭, h: 키, fly, y) 가 (x,z) 에 서도 되나: 발 양끝이 걷는 곳 안 + 몸이 화면 안 */
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
    return { fov: def.fov, pos, target, view: { fw, fh, ox, oy }, vis, scale, H, IA, inside, insideUV, pick, uv: M.toUV, ground: M.ground };
  }

  const CS = (KP.clayStage = {
    ok: null,
    bgCam,
    inPoly,
    get THREE() {
      return THREE;
    },
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
    /** Three.js (vendor) — 처음 한 번만 불러옴, 실패하면 다음에 다시 시도 */
    load() {
      if (THREE) return Promise.resolve(THREE);
      if (!loading)
        loading = import(new URL("vendor/three.module.min.js", document.baseURI).href)
          .then((m) => (THREE = m))
          .catch((e) => {
            loading = null;
            throw e;
          });
      return loading;
    },
    create(host, def, opt) {
      return new Stage(host, def, opt || {});
    },
    /** 점토 결 텍스처 (아주 약한 울퉁불퉁 — 인형 bumpMap) */
    grainTex() {
      const gc = document.createElement("canvas");
      gc.width = gc.height = 128;
      const gg = gc.getContext("2d"), im = gg.createImageData(128, 128);
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
      const t = new THREE.CanvasTexture(gc);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(5, 5);
      return t;
    },
    /** 발밑 그림자용 흐린 원판 텍스처 */
    blobTex() {
      const bc = document.createElement("canvas");
      bc.width = bc.height = 64;
      const bg = bc.getContext("2d"), gr = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(0,0,0,1)");
      gr.addColorStop(0.5, "rgba(0,0,0,.55)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      bg.fillStyle = gr;
      bg.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(bc);
    },
  });

  KP.css(
    "clayStage",
    `.csHost{position:relative;overflow:hidden}
     .csBg,.csFront{position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;pointer-events:none}
     .csBg{z-index:0}
     .csCanvas{position:absolute;left:0;top:0;z-index:1;touch-action:none;pointer-events:none}
     .csFront{z-index:2}
     .csUi{position:absolute;inset:0;z-index:3;pointer-events:none}
     .csUi>*{pointer-events:auto}`
  );

  /* ================================================================= 무대 */
  function Stage(host, def, opt) {
    this.host = host;
    this.def = def;
    this.opt = opt;
    this.qKey = opt.qKey || "clayStage:q";
    host.classList.add("csHost");
    this.bgEl = U.el("div", "csBg");
    this.frontEl = U.el("div", "csFront");
    this.ui = U.el("div", "csUi");
    host.append(this.bgEl);
    this.bgEl.style.backgroundImage = 'url("' + def.file + '")';
    if (def.front) this.frontEl.style.backgroundImage = 'url("' + def.front + '")';
    else if (def.frontMask) {
      // 앞가림 = 배경 그림 + 알파 마스크(작은 PNG) — 욕조 앞벽처럼 모양이 단순하면 큰 투명 PNG 대신
      const fe = this.frontEl.style;
      fe.backgroundImage = 'url("' + def.file + '")';
      fe.maskImage = fe.webkitMaskImage = 'url("' + def.frontMask + '")';
      fe.maskRepeat = fe.webkitMaskRepeat = "no-repeat";
    }
    this.updaters = []; // 매 장면 부를 것 (인형 움직임 등): fn(dt, t)
    this.time = 0;
    this.w = this.h = 0;
    this.gl = false;
    if (opt.flat) {
      // 3D 없이 그림만 (WebGL 이 안 되거나 느린 기기) — 같은 자르기·좌표
      host.append(this.frontEl, this.ui);
    } else {
      this.gl = true;
      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" }));
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.NoToneMapping;
      r.setClearColor(0x000000, 0);
      r.domElement.className = "csCanvas";
      host.append(r.domElement, this.frontEl, this.ui);
      // 화면이 끊기면(백그라운드·메모리 부족) 알림 → 놀이가 새로 만들어 다시 보여 줌 (정리 중이면 무시)
      r.domElement.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        if (this.dead) return;
        this.lost = true;
        if (this.opt.onLost) this._lostT = setTimeout(() => !this.dead && this.opt.onLost(), 600);
      });
      const S = (this.scene = new THREE.Scene());
      this.camera = new THREE.PerspectiveCamera(def.fov || 40, 1, 0.05, 400);
      this.hemi = new THREE.HemisphereLight(0xeef6ff, 0xd8cfb8, 0.62 * Math.PI);
      this.sun = new THREE.DirectionalLight(def.sunCol || 0xfff3e0, 0.5 * Math.PI);
      S.add(this.hemi, this.sun, this.sun.target);
      const sd = def.sun || [-0.45, 1, 0.6];
      this.sunDir = new THREE.Vector3(sd[0], sd[1], sd[2]).normalize();
      this.sun.position.copy(this.sunDir).multiplyScalar(10);
      this.grainT = CS.grainTex();
      this.blobT = CS.blobTex();
      this.contactM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: def.shadowCol || 0x3a2418, opacity: 0.42 });
      this.castM = new THREE.MeshBasicMaterial({ map: this.blobT, transparent: true, depthWrite: false, color: def.shadowCol || 0x3a2418, opacity: 0.2 });
      this.plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      this.rimU = { value: new THREE.Color("#fff6ee") };
      this.tintFromImage();
      const qs = KP.store.get(this.qKey, null);
      this.q = qs && Number.isFinite(qs.q) ? clamp(qs.q, 0, 3) : 0;
      if (qs && this.q > 0 && Date.now() - (qs.t || 0) > 7 * 864e5) this.q--; // 7일 지나면 한 단계 올려 다시 시도
      this.applyQ(this.q);
    }
    if (window.ResizeObserver) (this.ro = new ResizeObserver(() => this.resize())).observe(host);
    this.resize();
  }
  const SP = Stage.prototype;

  /** 그림의 위(벽·하늘)·아래(바닥) 평균색 → 하늘빛·바닥 반사빛. 아이 그림 색이 너무 변하지 않게 흰색 쪽으로 많이 섞음 */
  SP.tintFromImage = function () {
    const im = new Image();
    im.onload = () => {
      if (this.dead) return;
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 36;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(im, 0, 0, 64, 36);
      const d = g.getImageData(0, 0, 64, 36).data, top = [0, 0, 0, 0], bot = [0, 0, 0, 0];
      for (let y = 0; y < 36; y++)
        for (let x = 0; x < 64; x++) {
          const v = (y + 0.5) / 36, a = v < 0.3 ? top : v > 0.72 ? bot : null;
          if (!a) continue;
          const i = (y * 64 + x) * 4;
          a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; a[3]++;
        }
      const av = (a) => [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
      const sky = av(top), floor = av(bot);
      this.hemi.color.setRGB(...sky.map((v) => (v / 255) * 0.35 + 0.65), THREE.SRGBColorSpace);
      this.hemi.groundColor.setRGB(...floor.map((v, k) => (v / 255) * 0.4 + [0.85, 0.8, 0.7][k] * 0.6), THREE.SRGBColorSpace);
      this.rimU.value.setRGB(...sky.map((v) => (v / 255) * 0.4 + 0.6), THREE.SRGBColorSpace);
      const fm = floor.map((v) => v / 255);
      if (!this.def.shadowCol) {
        this.contactM.color.setRGB(fm[0] * 0.3, fm[1] * 0.25, fm[2] * 0.22, THREE.SRGBColorSpace);
        this.castM.color.copy(this.contactM.color);
      }
      this.render();
    };
    im.src = this.def.file;
  };

  /* ---------- 크기 · 카메라 ---------- */
  SP.resize = function (force) {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h || (!force && w === this.w && h === this.h)) return false;
    this.w = w;
    this.h = h;
    const cam = (this.bc = bgCam(this.def, w, h));
    for (const el of [this.bgEl, this.frontEl]) {
      el.style.backgroundSize = cam.view.fw + "px " + cam.view.fh + "px";
      el.style.backgroundPosition = -cam.view.ox + "px " + -cam.view.oy + "px";
    }
    if (this.def.frontMask) {
      const fe = this.frontEl.style;
      fe.maskSize = fe.webkitMaskSize = cam.view.fw + "px " + cam.view.fh + "px";
      fe.maskPosition = fe.webkitMaskPosition = -cam.view.ox + "px " + -cam.view.oy + "px";
    }
    if (this.gl) {
      const r = this.renderer;
      r.setSize(w, h, false);
      r.domElement.style.width = w + "px";
      r.domElement.style.height = h + "px";
      const c = this.camera;
      c.fov = cam.fov;
      c.position.set(...cam.pos);
      c.lookAt(...cam.target);
      c.aspect = cam.view.fw / cam.view.fh;
      c.setViewOffset(cam.view.fw, cam.view.fh, cam.view.ox, cam.view.oy, w, h);
      c.updateProjectionMatrix();
      c.updateMatrixWorld();
    }
    if (this.onResize) this.onResize(w, h);
    this.render();
    return true;
  };
  /** 그림 좌표(0~1) → 이 무대의 화면 좌표(px) */
  SP.uvToPx = function (u, v) {
    const vw = this.bc.view;
    return { x: u * vw.fw - vw.ox, y: v * vw.fh - vw.oy };
  };
  /** 설정의 자리(spots) → 땅 위 [x,z] */
  SP.spot = function (name) {
    const s = (this.def.spots && this.def.spots[name]) || [0.5, 0.75];
    return this.bc.ground(s[0], s[1]) || [0, -5];
  };
  /** 세상 점 → 화면(px, host 기준) — 3D 가 없으면 bgCam 계산으로 */
  const pv = { x: 0, y: 0, z: 0 };
  SP.project = function (x, y, z) {
    if (this.gl) {
      const v = (this._v = this._v || new THREE.Vector3()).set(x, y, z).project(this.camera);
      pv.x = ((v.x + 1) / 2) * this.w;
      pv.y = ((1 - v.y) / 2) * this.h;
      pv.z = v.z;
      return pv;
    }
    const uv = this.bc.uv(x, y, z), p = this.uvToPx(uv[0], uv[1]);
    pv.x = p.x;
    pv.y = p.y;
    pv.z = uv[2];
    return pv;
  };
  /** (x,z) 에 선 물체가 화면 높이의 frac 만큼 보이려면 세상 키가 얼마인가 */
  SP.fitH = function (x, z, frac) {
    const a = this.project(x, 0, z).y, b = this.project(x, 1, z).y;
    return (frac * this.h) / Math.max(1, a - b);
  };
  /** 화면 px 차이 → (x,z) 근처의 세상 가로 길이 */
  SP.pxToWorld = function (x, z, px) {
    const a = this.project(x, 0, z).x, b = this.project(x + 1, 0, z).x;
    return px / Math.max(1e-3, b - a);
  };
  /** 접촉 그림자 두 장 (발밑 + 햇빛 반대쪽 길게) — {contact, cast, set(x, z, w, h, lift)} */
  SP.shadow = function () {
    const contact = new THREE.Mesh(this.plane, this.contactM), cast = new THREE.Mesh(this.plane, this.castM);
    contact.renderOrder = cast.renderOrder = -1;
    this.scene.add(contact, cast);
    const sun = this.sunDir;
    return {
      contact,
      cast,
      set(x, z, w, h, lift = 0) {
        const sr = w * 0.62, k = 1 - Math.min(0.6, lift * 0.35);
        contact.position.set(x, 0.003, z + 0.02 * h);
        contact.scale.set(sr * k, 1, sr * 0.55 * k);
        const sl = Math.hypot(sun.x, sun.z) || 1, L = clamp(1.6 / Math.max(0.3, sun.y / sl), 0.6, 2.4) * 0.5 * h;
        cast.position.set(x - (sun.x / sl) * L * 0.55, 0.002, z - (sun.z / sl) * L * 0.55);
        cast.rotation.y = Math.atan2(-sun.x, -sun.z);
        cast.scale.set(sr * 0.95, 1, sr * 0.6 + L);
      },
      remove: () => this.scene && this.scene.remove(contact, cast),
    };
  };

  /* ---------- 화질 ---------- */
  /** 화질 단계: 0 고화질 · 1 해상도↓ · 2 더↓ · 3 최저 */
  SP.applyQ = function (q) {
    this.q = q;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(dpr, [2, 1.5, 1.25, 1][q]));
    if (this.w) this.renderer.setSize(this.w, this.h, false);
  };
  /** 느린 기기면 화질을 한 단계씩 낮춤 (초당 약 28장 미만이 이어질 때) — 동물원과 같은 규칙 */
  SP.measure = function () {
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
      KP.store.set(this.qKey, { q: this.q, t: Date.now() });
      this._warm = now + 1500;
    } else if (this.q >= 3 && avg > 55) {
      // 가장 낮은 화질에서도 초당 18장도 안 나오면(두 번 연속) 그림으로 (놀이가 정함)
      this._slowN = (this._slowN || 0) + 1;
      if (this._slowN >= 2 && this.opt.onSlow && !this._slowTold) {
        this._slowTold = true;
        this._slowT = setTimeout(() => !this.dead && this.opt.onSlow(), 0);
      }
    } else this._slowN = 0;
  };

  /** 매 장면: 크기 확인 → 움직임 → 그리기 */
  SP.tick = function (dt) {
    if (this.dead || this.lost) return;
    if (this.gl) this.measure();
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.resize();
    for (const f of this.updaters) f(dt, this.time);
    this.render();
  };
  SP.render = function () {
    if (!this.gl || this.lost || this.dead || !this.bc) return;
    this.renderer.render(this.scene, this.camera);
  };
  SP.dispose = function () {
    if (this.dead) return;
    this.dead = true;
    clearTimeout(this._lostT);
    clearTimeout(this._slowT);
    if (this.ro) this.ro.disconnect();
    this.updaters = [];
    if (this.onDispose) this.onDispose();
    if (this.gl) {
      for (const x of [this.grainT, this.blobT, this.contactM, this.castM, this.plane]) x.dispose();
      this.renderer.dispose();
      try {
        this.renderer.forceContextLoss(); // 그래픽 메모리를 바로 돌려줌 (iPad)
      } catch (e) {}
      this.renderer.domElement.remove();
    }
    this.bgEl.remove();
    this.frontEl.remove();
    this.ui.remove();
    this.host.classList.remove("csHost");
  };
})();
