/* =====================================================================
   🦁 내 동물원 — 진짜 3D (Three.js, vendor/three.module.min.js 를 필요할 때만 불러옴)
   - 아이가 색칠 공방에서 칠한 부위별 색(무지개·반짝이·땡땡이·줄무늬 포함)을
     3D 장난감 동물의 같은 부위에 그대로 입힘
   - 손가락으로 끌면 동물원을 빙 돌려 보고, 두 손가락으로 확대/축소
   - 동물 콕 → 폴짝 + 울음소리, 빈 땅 콕 → 간식이 떨어지고 가까운 친구가 먹으러 감
   - WebGL 이 안 되면 zoo.js 의 2.5D 화면으로 자동 전환
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  let THREE = null;
  let loading = null;

  KP.zoo3d = {
    ok: null,
    /** WebGL 지원 여부 (한 번만 검사) */
    supported() {
      if (this.ok !== null) return this.ok;
      try {
        const c = document.createElement("canvas");
        this.ok = !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
      } catch (e) {
        this.ok = false;
      }
      return this.ok;
    },
    load() {
      if (THREE) return Promise.resolve(THREE);
      if (!loading)
        loading = import(new URL("vendor/three.module.min.js", document.baseURI).href).then((m) => (THREE = m)).catch((e) => {
          loading = null;
          throw e;
        });
      return loading;
    },
    create(ctx, host, T) {
      return (this._last = new World(ctx, host, T));
    },
  };

  /* ---------------- 색칠 → 재질 ---------------- */
  const RAINBOW = ["#ff5b6e", "#ffa14a", "#ffe14d", "#4fd37b", "#3fb0ff", "#9a6bff"];
  const texCache = new Map();
  function patternTex(kind, base) {
    const key = kind + base;
    if (texCache.has(key)) return texCache.get(key);
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    let rep = [3, 2];
    if (kind === "rainbow") {
      RAINBOW.forEach((col, i) => {
        g.fillStyle = col;
        g.fillRect(0, (i * 128) / 6, 128, 128 / 6 + 1);
      });
      rep = [1, 1];
    } else if (kind === "glitter") {
      g.fillStyle = "#ffd66b";
      g.fillRect(0, 0, 128, 128);
      const cs = ["#fff", "#ff8ad8", "#8ad1ff", "#fff"];
      for (let i = 0; i < 40; i++) {
        g.fillStyle = cs[i % 4];
        g.beginPath();
        g.arc((i * 53) % 128, (i * 37 + (i % 3) * 11) % 128, 2 + (i % 3), 0, 7);
        g.fill();
      }
    } else if (kind === "dots") {
      g.fillStyle = base;
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = "rgba(255,255,255,.88)";
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          g.beginPath();
          g.arc(16 + x * 32 + (y % 2) * 16, 16 + y * 32, 8, 0, 7);
          g.fill();
        }
    } else {
      g.fillStyle = base;
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = "rgba(255,255,255,.6)";
      for (let i = -4; i < 8; i++) {
        g.beginPath();
        g.moveTo(i * 32, 0);
        g.lineTo(i * 32 + 14, 0);
        g.lineTo(i * 32 + 14 + 128, 128);
        g.lineTo(i * 32 + 128, 128);
        g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep[0], rep[1]);
    t.anisotropy = 4;
    texCache.set(key, t);
    return t;
  }
  /** 저장된 SVG → {part: [채우기...], legs: {1:채우기..}} */
  function readColors(svgStr) {
    const out = { parts: {}, legs: {} };
    let doc;
    try {
      doc = new DOMParser().parseFromString(KP.sanitizeSvg(String(svgStr || "")), "image/svg+xml");
    } catch (e) {
      return out;
    }
    doc.querySelectorAll("[data-p]").forEach((e) => {
      const p = e.getAttribute("data-p"),
        f = (e.getAttribute("fill") || "#ffffff").trim();
      (out.parts[p] = out.parts[p] || []).push(f);
      const lg = e.parentNode && e.parentNode.getAttribute && /\bl(\d)\b/.exec(e.parentNode.getAttribute("class") || "");
      if (lg) out.legs[lg[1]] = f;
    });
    return out;
  }
  function fillToMat(fill, cache) {
    if (cache.has(fill)) return cache.get(fill);
    let m;
    const u = /^url\(#([\w-]+)\)$/.exec(fill);
    if (u) {
      const k = /-(rainbow|glitter|dots|stripes)(?:-([0-9a-f]{6}))?$/i.exec(u[1]);
      const kind = k ? k[1] : "rainbow",
        base = k && k[2] ? "#" + k[2] : "#ffffff";
      m = new THREE.MeshPhongMaterial({ color: 0xffffff, map: patternTex(kind, base), shininess: 40, specular: 0x262626 });
    } else {
      m = new THREE.MeshPhongMaterial({ color: /^#[0-9a-f]{3,8}$/i.test(fill) ? fill : "#ffffff", shininess: 40, specular: 0x262626 });
    }
    cache.set(fill, m);
    return m;
  }

  /* ---------------- 공용 도형 ---------------- */
  let G = null;
  function geos() {
    if (G) return G;
    G = {
      sph: new THREE.SphereGeometry(1, 20, 14),
      sphLo: new THREE.SphereGeometry(1, 10, 8),
      cone: new THREE.ConeGeometry(1, 1, 18),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 18),
      hex: new THREE.CylinderGeometry(1, 1, 1, 6),
      dome: new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      ico: new THREE.IcosahedronGeometry(1, 0),
      ico1: new THREE.IcosahedronGeometry(1, 1),
      dode: new THREE.DodecahedronGeometry(1, 0),
      circ: new THREE.CircleGeometry(1, 32),
      box: new THREE.BoxGeometry(1, 1, 1),
      leg: new Map(),
    };
    return G;
  }
  function capsule(r, len) {
    const k = r.toFixed(3) + "_" + len.toFixed(3);
    if (!G.leg.has(k)) G.leg.set(k, new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 4, 10));
    return G.leg.get(k);
  }
  const INK = "#2e2744";
  let inkMat = null,
    whiteMat = null,
    blushMat = null,
    noseMat = null,
    tongueMat = null;
  function baseMats() {
    if (inkMat) return;
    inkMat = new THREE.MeshPhongMaterial({ color: INK, shininess: 80, specular: 0x555555 });
    whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    blushMat = new THREE.MeshBasicMaterial({ color: 0xffa0b4 });
    noseMat = new THREE.MeshPhongMaterial({ color: 0xff7a96, shininess: 40 });
    tongueMat = new THREE.MeshPhongMaterial({ color: 0xff7a96, shininess: 30 });
  }

  /* ---------------- 동물 모델 (모두 +x 쪽을 봄, 발바닥 y=0) ---------------- */
  function Builder(colors) {
    const cache = new Map();
    const count = {};
    const meshes = [];
    const B = {
      legs: [],
      parts: {},
      mat(part, idx) {
        const list = colors.parts[part];
        const i = idx !== undefined ? idx : (count[part] = (count[part] || 0) + 1) - 1;
        const f = list && list.length ? list[i % list.length] : "#ffffff";
        return fillToMat(f, cache);
      },
      add(parent, geo, mat, pos, scl, rot) {
        const m = new THREE.Mesh(geo, mat);
        if (pos) m.position.set(pos[0], pos[1], pos[2]);
        if (scl) m.scale.set(scl[0], scl[1], scl[2]);
        if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
        parent.add(m);
        meshes.push(m);
        return m;
      },
      /** 타원체 */
      E(parent, part, pos, scl, rot) {
        const m = B.add(parent, G.sph, B.mat(part), pos, scl, rot);
        (B.parts[part] = B.parts[part] || []).push(m);
        return m;
      },
      /** 다리: 엉덩이 지점이 회전축 (n = SVG 의 l1~l4) */
      leg(parent, n, x, z, len, r, hipY) {
        const piv = new THREE.Group();
        piv.position.set(x, hipY === undefined ? len : hipY, z);
        parent.add(piv);
        const f = colors.legs[n] || (colors.parts.leg || [])[0] || "#ffffff";
        const m = B.add(piv, capsule(r, len), fillToMat(f, cache), [0, -len / 2 + r * 0.15, 0]);
        // 발바닥 살짝 납작하게
        m.scale.set(1, 1, 1);
        B.legs.push({ piv, ph: n === 1 || n === 4 ? 0 : Math.PI });
        return piv;
      },
      /** 눈 한 쌍 (머리 중심 c, 반지름 r 표면) */
      eyes(parent, c, r, o = {}) {
        const sp = o.spread ?? 0.55,
          up = o.up ?? 0.28,
          fw = o.fw ?? 0.75,
          s = o.size ?? 0.17;
        for (const side of [1, -1]) {
          const d = new THREE.Vector3(fw, up, sp * side).normalize();
          const p = d.clone().multiplyScalar(r * 0.97).add(new THREE.Vector3(c[0], c[1], c[2]));
          const e = B.add(parent, G.sph, inkMat, [p.x, p.y, p.z], [r * s, r * s * 1.15, r * s]);
          const hp = d.clone().multiplyScalar(r * (0.97 + s * 0.8)).add(new THREE.Vector3(c[0], c[1] + r * s * 0.35, c[2]));
          B.add(parent, G.sphLo, whiteMat, [hp.x + r * 0.02, hp.y, hp.z], [r * s * 0.38, r * s * 0.38, r * s * 0.38]);
          if (o.blush !== false) {
            const bd = new THREE.Vector3(fw * 0.7, up - 0.42, (sp + 0.25) * side).normalize();
            const bp = bd.clone().multiplyScalar(r * 0.99).add(new THREE.Vector3(c[0], c[1], c[2]));
            const b = B.add(parent, G.sphLo, blushMat, [bp.x, bp.y, bp.z], [r * 0.2, r * 0.13, r * 0.2]);
            b.lookAt(bp.clone().add(bd));
            b.scale.set(r * 0.2, r * 0.13, r * 0.04);
          }
          void e;
        }
      },
      meshes,
    };
    return B;
  }

  /* 움직이지 않는 부위는 한 덩어리(정점 색)로 합쳐 그리기 횟수를 줄임 — 무늬(그림) 부위만 따로 */
  let vcMat = null,
    vcFlat = null;
  function mergeGroup(group) {
    if (!vcMat) {
      vcMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x262626 });
      vcFlat = new THREE.MeshBasicMaterial({ vertexColors: true });
    }
    const parts = { lit: [], flat: [] };
    for (const m of [...group.children]) {
      if (!m.isMesh || !m.material || m.material.map || m.material.transparent || m.material.visible === false) continue;
      m.updateMatrix();
      const g = m.geometry.clone().applyMatrix4(m.matrix);
      const n = g.attributes.position.count;
      const c = m.material.color;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      (m.material.isMeshBasicMaterial ? parts.flat : parts.lit).push(g);
      group.remove(m);
    }
    for (const [k, list] of Object.entries(parts)) {
      if (!list.length) continue;
      let nv = 0,
        ni = 0;
      for (const g of list) {
        nv += g.attributes.position.count;
        ni += g.index ? g.index.count : g.attributes.position.count;
      }
      const pos = new Float32Array(nv * 3),
        nor = new Float32Array(nv * 3),
        col = new Float32Array(nv * 3),
        idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
      let vo = 0,
        io = 0;
      for (const g of list) {
        const cnt = g.attributes.position.count;
        pos.set(g.attributes.position.array, vo * 3);
        nor.set(g.attributes.normal.array, vo * 3);
        col.set(g.attributes.color.array, vo * 3);
        if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo;
        else for (let i = 0; i < cnt; i++) idx[io++] = i + vo;
        vo += cnt;
        g.dispose();
      }
      const mg = new THREE.BufferGeometry();
      mg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      mg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      mg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      mg.setIndex(new THREE.BufferAttribute(idx, 1));
      mg.computeBoundingSphere();
      group.add(new THREE.Mesh(mg, k === "lit" ? vcMat : vcFlat));
    }
  }

  const MODELS = {
    dino(B, g) {
      B.E(g, "body", [0, 1.0, 0], [0.9, 0.58, 0.58]);
      B.E(g, "belly", [0.18, 0.86, 0], [0.62, 0.38, 0.5]);
      const tail = B.add(g, G.cone, B.mat("tail"), [-1.15, 0.95, 0], [0.34, 1.2, 0.34], [0, 0, Math.PI / 2 + 0.25]);
      (B.parts.tail = [tail]);
      B.wag = tail;
      [-0.5, -0.15, 0.2, 0.52].forEach((x, i) => B.add(g, G.cone, B.mat("spike", i), [x, 1.52 - Math.abs(x) * 0.25, 0], [0.13, 0.36, 0.1], [0, 0, -x * 0.5]));
      const neck = B.add(g, G.sph, B.mat("neck"), [0.82, 1.55, 0], [0.26, 0.62, 0.26], [0, 0, -0.55]);
      void neck;
      B.E(g, "head", [1.2, 2.08, 0], [0.5, 0.34, 0.36]);
      B.eyes(g, [1.25, 2.12, 0], 0.36, { fw: 0.55, spread: 0.75, up: 0.45, size: 0.22 });
      B.add(g, G.sphLo, inkMat, [1.69, 2.1, 0.09], [0.025, 0.025, 0.025]);
      B.add(g, G.sphLo, inkMat, [1.69, 2.1, -0.09], [0.025, 0.025, 0.025]);
      B.leg(g, 1, -0.45, 0.32, 0.62, 0.17);
      B.leg(g, 2, -0.45, -0.32, 0.62, 0.17);
      B.leg(g, 3, 0.45, 0.32, 0.6, 0.17);
      B.leg(g, 4, 0.45, -0.32, 0.6, 0.17);
      B.headY = 2.4;
    },
    lion(B, g) {
      B.E(g, "body", [0, 1.0, 0], [0.85, 0.52, 0.52]);
      const t = B.add(g, G.cyl, inkMat, [-0.98, 1.22, 0], [0.04, 0.6, 0.04], [0, 0, 0.9]);
      void t;
      B.E(g, "tuft", [-1.22, 1.48, 0], [0.13, 0.13, 0.13]);
      // 갈기: 머리 둘레 동글동글 털뭉치
      const mm = B.mat("mane");
      B.parts.mane = [];
      for (let i = 0; i < 12; i++) {
        const t = (i / 12) * Math.PI * 2;
        B.parts.mane.push(B.add(g, G.sph, mm, [0.92, 1.55 + Math.cos(t) * 0.5, Math.sin(t) * 0.5], [0.2, 0.24, 0.24]));
      }
      B.parts.mane.push(B.add(g, G.sph, mm, [0.8, 1.55, 0], [0.3, 0.55, 0.55]));
      B.E(g, "ear", [0.98, 2.02, 0.32], [0.14, 0.14, 0.1]);
      B.E(g, "ear", [0.98, 2.02, -0.32], [0.14, 0.14, 0.1]);
      B.E(g, "head", [1.08, 1.55, 0], [0.46, 0.44, 0.46]);
      B.E(g, "muzzle", [1.45, 1.42, 0], [0.2, 0.16, 0.26]);
      B.add(g, G.sph, inkMat, [1.64, 1.52, 0], [0.07, 0.05, 0.09]);
      B.eyes(g, [1.08, 1.55, 0], 0.46, { fw: 0.8, spread: 0.45, up: 0.3, size: 0.16 });
      B.leg(g, 1, -0.45, 0.3, 0.62, 0.16);
      B.leg(g, 2, -0.45, -0.3, 0.62, 0.16);
      B.leg(g, 3, 0.45, 0.3, 0.62, 0.16);
      B.leg(g, 4, 0.45, -0.3, 0.62, 0.16);
      B.headY = 2.3;
    },
    elephant(B, g) {
      B.E(g, "body", [0, 1.3, 0], [1.0, 0.72, 0.72]);
      B.add(g, G.cyl, inkMat, [-1.05, 1.15, 0], [0.035, 0.5, 0.035], [0, 0, -0.5]);
      B.E(g, "head", [1.05, 1.65, 0], [0.56, 0.54, 0.54]);
      B.E(g, "ear", [0.78, 1.7, 0.52], [0.1, 0.5, 0.4], [0, 0.35, 0]);
      B.E(g, "ear", [0.78, 1.7, -0.52], [0.1, 0.5, 0.4], [0, -0.35, 0]);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(1.45, 1.55, 0), new THREE.Vector3(1.78, 1.2, 0), new THREE.Vector3(1.85, 0.7, 0), new THREE.Vector3(2.02, 0.45, 0)]);
      const tr = B.add(g, new THREE.TubeGeometry(curve, 20, 0.15, 12, false), B.mat("trunk"));
      B.parts.trunk = [tr];
      B.add(g, G.sphLo, B.mat("trunk", 0), [2.02, 0.45, 0], [0.15, 0.15, 0.15]);
      B.add(g, G.cone, B.mat("tusk", 0), [1.55, 1.25, 0.24], [0.06, 0.35, 0.06], [0, 0, -2.2]);
      B.add(g, G.cone, B.mat("tusk", 0), [1.55, 1.25, -0.24], [0.06, 0.35, 0.06], [0, 0, -2.2]);
      B.eyes(g, [1.05, 1.65, 0], 0.54, { fw: 0.7, spread: 0.55, up: 0.38, size: 0.13 });
      B.leg(g, 1, -0.5, 0.38, 0.85, 0.24);
      B.leg(g, 2, -0.5, -0.38, 0.85, 0.24);
      B.leg(g, 3, 0.5, 0.38, 0.85, 0.24);
      B.leg(g, 4, 0.5, -0.38, 0.85, 0.24);
      B.headY = 2.4;
    },
    rabbit(B, g) {
      B.E(g, "foot", [-0.12, 0.12, 0.28], [0.42, 0.13, 0.18]);
      B.E(g, "foot", [-0.12, 0.12, -0.28], [0.42, 0.13, 0.18], undefined);
      B.E(g, "body", [0, 0.7, 0], [0.62, 0.56, 0.52]);
      B.E(g, "tail", [-0.62, 0.8, 0], [0.18, 0.18, 0.18]);
      B.leg(g, 3, 0.38, 0.2, 0.42, 0.13);
      B.leg(g, 3, 0.38, -0.2, 0.42, 0.13);
      B.E(g, "head", [0.62, 1.22, 0], [0.44, 0.42, 0.42]);
      const e1 = B.E(g, "ear", [0.5, 1.85, 0.17], [0.11, 0.44, 0.19], [0.18, 0, 0.12]);
      const e2 = B.E(g, "ear", [0.5, 1.85, -0.17], [0.11, 0.44, 0.19], [-0.18, 0, 0.12]);
      B.E(g, "inner", [0.58, 1.86, 0.18], [0.06, 0.32, 0.11], [0.18, 0, 0.12]);
      B.E(g, "inner", [0.58, 1.86, -0.18], [0.06, 0.32, 0.11], [-0.18, 0, 0.12]);
      void e1, e2;
      B.add(g, G.sph, noseMat, [1.05, 1.2, 0], [0.06, 0.05, 0.07]);
      B.eyes(g, [0.62, 1.22, 0], 0.44, { fw: 0.75, spread: 0.55, up: 0.25, size: 0.17 });
      B.headY = 2.3;
    },
    bear(B, g) {
      B.E(g, "body", [0, 1.02, 0], [0.88, 0.6, 0.58]);
      B.E(g, "belly", [0.25, 0.92, 0], [0.55, 0.42, 0.48]);
      B.E(g, "ear", [0.92, 1.98, 0.32], [0.16, 0.16, 0.1]);
      B.E(g, "ear", [0.92, 1.98, -0.32], [0.16, 0.16, 0.1]);
      B.E(g, "inner", [0.96, 1.98, 0.33], [0.08, 0.08, 0.06]);
      B.E(g, "inner", [0.96, 1.98, -0.33], [0.08, 0.08, 0.06]);
      B.E(g, "head", [1.02, 1.55, 0], [0.48, 0.46, 0.48]);
      B.E(g, "muzzle", [1.42, 1.44, 0], [0.22, 0.17, 0.25]);
      B.add(g, G.sph, inkMat, [1.63, 1.52, 0], [0.08, 0.06, 0.1]);
      B.eyes(g, [1.02, 1.55, 0], 0.48, { fw: 0.8, spread: 0.45, up: 0.32, size: 0.15 });
      B.leg(g, 1, -0.45, 0.33, 0.62, 0.18);
      B.leg(g, 2, -0.45, -0.33, 0.62, 0.18);
      B.leg(g, 3, 0.45, 0.33, 0.6, 0.18);
      B.leg(g, 4, 0.45, -0.33, 0.6, 0.18);
      B.headY = 2.3;
    },
    pig(B, g) {
      B.E(g, "body", [0, 0.95, 0], [0.95, 0.62, 0.62]);
      B.E(g, "spot", [-0.25, 1.15, 0.5], [0.26, 0.2, 0.14]);
      B.E(g, "spot", [-0.25, 1.15, -0.5], [0.26, 0.2, 0.14], undefined);
      const tl = B.add(g, new THREE.TorusGeometry(0.12, 0.035, 8, 16, Math.PI * 1.6), inkMat, [-0.98, 1.15, 0], [1, 1, 1], [0, Math.PI / 2, 0]);
      void tl;
      B.E(g, "head", [0.98, 1.18, 0], [0.5, 0.48, 0.5]);
      const s = B.add(g, G.cyl, B.mat("snout"), [1.48, 1.1, 0], [0.2, 0.14, 0.2], [0, 0, Math.PI / 2]);
      B.parts.snout = [s];
      B.add(g, G.sphLo, inkMat, [1.56, 1.13, 0.07], [0.03, 0.045, 0.03]);
      B.add(g, G.sphLo, inkMat, [1.56, 1.13, -0.07], [0.03, 0.045, 0.03]);
      B.add(g, G.cone, B.mat("ear"), [0.88, 1.66, 0.26], [0.13, 0.28, 0.08], [0.25, 0, -0.4]);
      B.add(g, G.cone, B.mat("ear"), [0.88, 1.66, -0.26], [0.13, 0.28, 0.08], [-0.25, 0, -0.4]);
      B.eyes(g, [0.98, 1.18, 0], 0.5, { fw: 0.75, spread: 0.45, up: 0.38, size: 0.13 });
      B.leg(g, 1, -0.5, 0.33, 0.5, 0.16);
      B.leg(g, 2, -0.5, -0.33, 0.5, 0.16);
      B.leg(g, 3, 0.5, 0.33, 0.5, 0.16);
      B.leg(g, 4, 0.5, -0.33, 0.5, 0.16);
      B.headY = 2.0;
    },
    dog(B, g) {
      B.E(g, "body", [0, 1.02, 0], [0.82, 0.5, 0.48]);
      B.E(g, "spot", [-0.12, 1.32, 0.12], [0.34, 0.2, 0.36]);
      const tp = new THREE.Group();
      tp.position.set(-0.75, 1.18, 0);
      g.add(tp);
      B.add(tp, G.cone, B.mat("tail"), [-0.12, 0.25, 0], [0.09, 0.55, 0.09], [0, 0, 0.45]);
      B.wag = tp;
      B.E(g, "head", [1.0, 1.55, 0], [0.45, 0.44, 0.44]);
      B.E(g, "ear", [0.92, 1.45, 0.44], [0.14, 0.34, 0.1], [0.2, 0, 0.1]);
      B.E(g, "ear", [0.92, 1.45, -0.44], [0.14, 0.34, 0.1], [-0.2, 0, 0.1]);
      B.E(g, "muzzle", [1.4, 1.42, 0], [0.24, 0.17, 0.24]);
      B.add(g, G.sph, inkMat, [1.62, 1.5, 0], [0.08, 0.06, 0.1]);
      B.add(g, G.sph, tongueMat, [1.52, 1.27, 0], [0.08, 0.04, 0.07]);
      B.eyes(g, [1.0, 1.55, 0], 0.45, { fw: 0.8, spread: 0.45, up: 0.35, size: 0.16 });
      B.leg(g, 1, -0.45, 0.28, 0.66, 0.15);
      B.leg(g, 2, -0.45, -0.28, 0.66, 0.15);
      B.leg(g, 3, 0.45, 0.28, 0.66, 0.15);
      B.leg(g, 4, 0.45, -0.28, 0.66, 0.15);
      B.headY = 2.2;
    },
    fish(B, g) {
      B.E(g, "body", [0, 0, 0], [0.8, 0.46, 0.3]);
      B.E(g, "stripe", [-0.22, 0, 0], [0.1, 0.45, 0.305]);
      B.E(g, "stripe", [0.22, 0, 0], [0.1, 0.45, 0.305]);
      const tp = new THREE.Group();
      tp.position.set(-0.72, 0, 0);
      g.add(tp);
      B.add(tp, G.cone, B.mat("tail"), [-0.25, 0, 0], [0.36, 0.5, 0.08], [0, 0, -Math.PI / 2]);
      B.wag = tp;
      B.add(g, G.cone, B.mat("fin"), [-0.05, 0.5, 0], [0.3, 0.32, 0.05], [0, 0, 0.5]);
      B.add(g, G.cone, B.mat("fin"), [0.0, -0.46, 0], [0.18, 0.25, 0.05], [0, 0, Math.PI - 0.4]);
      B.add(g, G.sph, B.mat("fin"), [0.2, -0.12, 0.3], [0.16, 0.08, 0.04], [0, 0, -0.4]);
      B.add(g, G.sph, B.mat("fin", 2), [0.2, -0.12, -0.3], [0.16, 0.08, 0.04], [0, 0, -0.4]);
      B.eyes(g, [0.45, 0.08, 0], 0.3, { fw: 0.55, spread: 0.85, up: 0.25, size: 0.3, blush: false });
      B.headY = 0.8;
    },
    bird(B, g) {
      B.E(g, "body", [0, 0, 0], [0.56, 0.48, 0.45]);
      B.E(g, "belly", [0.2, -0.16, 0], [0.36, 0.3, 0.36]);
      B.add(g, G.cone, B.mat("tail"), [-0.66, 0.08, 0], [0.22, 0.45, 0.08], [0, 0, Math.PI / 2 - 0.2]);
      B.E(g, "head", [0.5, 0.45, 0], [0.34, 0.33, 0.33]);
      B.add(g, G.cone, B.mat("beak"), [0.9, 0.4, 0], [0.1, 0.3, 0.1], [0, 0, -Math.PI / 2]);
      B.wings = [];
      for (const s of [1, -1]) {
        const p = new THREE.Group();
        p.position.set(-0.05, 0.18, 0.38 * s);
        g.add(p);
        B.add(p, G.sph, B.mat("wing", 0), [-0.05, 0, 0.32 * s], [0.38, 0.07, 0.36], [0, 0.3 * s, 0]);
        B.wings.push({ p, s });
      }
      B.eyes(g, [0.5, 0.45, 0], 0.34, { fw: 0.7, spread: 0.6, up: 0.3, size: 0.17 });
      B.add(g, G.cyl, inkMat, [0, -0.55, 0.12], [0.025, 0.2, 0.025]);
      B.add(g, G.cyl, inkMat, [0, -0.55, -0.12], [0.025, 0.2, 0.025]);
      B.headY = 0.9;
    },
    butterfly(B, g) {
      B.wings = [];
      for (const s of [1, -1]) {
        const p = new THREE.Group();
        g.add(p);
        B.add(p, G.sph, B.mat("wing1", s > 0 ? 0 : 1), [0.18, 0, 0.55 * s], [0.42, 0.025, 0.55], [0, 0.4 * s, 0]);
        B.add(p, G.sph, B.mat("wing2", s > 0 ? 0 : 1), [-0.3, 0, 0.42 * s], [0.3, 0.03, 0.36], [0, -0.3 * s, 0]);
        B.add(p, G.sph, B.mat("spot", s > 0 ? 0 : 2), [0.25, 0.03, 0.75 * s], [0.13, 0.02, 0.13]);
        B.add(p, G.sph, B.mat("spot", s > 0 ? 1 : 3), [-0.32, 0.035, 0.5 * s], [0.1, 0.02, 0.1]);
        B.wings.push({ p, s });
      }
      B.add(g, G.sph, B.mat("body", 0), [0, 0, 0], [0.42, 0.1, 0.1]);
      B.add(g, G.sph, B.mat("body", 1), [0.48, 0.05, 0], [0.14, 0.14, 0.14]);
      B.add(g, G.cyl, inkMat, [0.66, 0.25, 0.08], [0.015, 0.35, 0.015], [0.3, 0, -0.5]);
      B.add(g, G.cyl, inkMat, [0.66, 0.25, -0.08], [0.015, 0.35, 0.015], [-0.3, 0, -0.5]);
      B.eyes(g, [0.48, 0.05, 0], 0.14, { fw: 0.8, spread: 0.6, up: 0.2, size: 0.25, blush: false });
      B.headY = 0.8;
    },
    turtle(B, g) {
      B.leg(g, 1, -0.45, 0.4, 0.34, 0.15);
      B.leg(g, 2, -0.45, -0.4, 0.34, 0.15);
      B.leg(g, 3, 0.45, 0.4, 0.34, 0.15);
      B.leg(g, 4, 0.45, -0.4, 0.34, 0.15);
      B.add(g, G.cone, B.mat("tail"), [-0.98, 0.3, 0], [0.08, 0.25, 0.08], [0, 0, Math.PI / 2]);
      B.E(g, "head", [1.05, 0.5, 0], [0.3, 0.27, 0.27]);
      B.eyes(g, [1.05, 0.5, 0], 0.28, { fw: 0.75, spread: 0.6, up: 0.3, size: 0.2 });
      const sh = B.add(g, G.dome, B.mat("shell"), [0, 0.32, 0], [0.92, 0.68, 0.7]);
      B.parts.shell = [sh];
      const rim = B.add(g, G.cyl, B.mat("rim"), [0, 0.32, 0], [0.98, 0.12, 0.76]);
      B.parts.rim = [rim];
      // 등딱지 무늬(육각): 등딱지 표면에 붙임
      [[0, 0], [-0.45, 1], [0.45, -1]].forEach(([x, sd], i) => {
        const y = 0.32 + 0.68 * Math.sqrt(1 - (x / 0.92) ** 2);
        const m = B.add(g, G.hex, B.mat("plate", i), [x, y - 0.01, 0], [0.24, 0.05, 0.24]);
        m.rotation.z = sd * 0.62;
      });
      B.headY = 1.2;
    },
  };

  /* ---------------- 3D 세계 ---------------- */
  const PEN = { x0: -8.6, x1: 8.6, z0: -5.4, z1: 4.6 };
  const POND = { x: 5.1, z: 2.3, rx: 2.4, rz: 1.55 };
  const SIZE = { dino: 1.05, lion: 1, elephant: 1.12, rabbit: 0.95, bear: 1, pig: 0.95, dog: 0.95, fish: 0.75, bird: 0.75, butterfly: 0.8, turtle: 0.9 };

  function World(ctx, host, T) {
    this.ctx = ctx;
    this.host = host;
    this.T = T;
    geos();
    baseMats();
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.domElement.className = "z3Canvas";
    host.appendChild(r.domElement);
    r.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
      KP.zoo3d.ok = false;
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1.5, 0.5, 200);
    this.cam = { az: 0, el: 0.62, zoom: 1, taz: 0, tel: 0.62, tzoom: 1, target: new THREE.Vector3(0, 0.6, -0.2) };
    this.animals = [];
    this.treats = [];
    this.raycaster = new THREE.Raycaster();
    this.buildWorld();
    this.bindInput();
    this.resize();
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(host);
  }
  const W3 = World.prototype;

  W3.skyTex = function (top, bottom) {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  W3.glowTex = function (col) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, col);
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  W3.buildWorld = function () {
    const S = this.scene;
    const lam = (c, flat) => new THREE.MeshLambertMaterial({ color: c, flatShading: !!flat });
    this.daySky = this.skyTex("#5fb8f0", "#dff3ff");
    this.nightSky = this.skyTex("#0f1540", "#3a4a8c");
    S.background = this.daySky;
    S.fog = new THREE.Fog("#d6efff", 30, 75);
    this.hemi = new THREE.HemisphereLight("#d8f0ff", "#5e8f45", 1.6);
    S.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff4de", 2.0);
    this.sun.position.set(6, 12, 8);
    S.add(this.sun);

    // 땅
    const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 48), lam("#8fd16a"));
    ground.rotation.x = -Math.PI / 2;
    S.add(ground);
    this.ground = ground;
    // 우리(울타리 안) 잔디: 깎은 줄무늬
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d");
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#9edb76" : "#93d46c";
      g.fillRect(i * 32, 0, 32, 256);
    }
    for (let i = 0; i < 700; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : "rgba(30,80,20,.08)";
      g.fillRect((i * 97) % 256, (i * 61) % 256, 2, 5);
    }
    const gt = new THREE.CanvasTexture(c);
    gt.colorSpace = THREE.SRGBColorSpace;
    gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
    gt.repeat.set(3, 2);
    const pen = new THREE.Mesh(new THREE.PlaneGeometry(PEN.x1 - PEN.x0 + 1.6, PEN.z1 - PEN.z0 + 2.4), new THREE.MeshLambertMaterial({ map: gt }));
    pen.rotation.x = -Math.PI / 2;
    pen.position.set(0, 0.005, (PEN.z0 + PEN.z1) / 2 + 0.2);
    S.add(pen);

    // 먼 산·언덕 (안개로 뿌옇게)
    const mtn = lam("#9cc6e4", true);
    [[-40, -55, 14, 16], [-18, -60, 18, 20], [8, -58, 15, 17], [32, -56, 17, 15], [52, -50, 12, 13]].forEach(([x, z, rr, h]) => {
      const m = new THREE.Mesh(G.cone, mtn);
      m.position.set(x, h / 2 - 0.5, z);
      m.scale.set(rr, h, rr);
      S.add(m);
    });
    const hillM = [lam("#a4dc7c", true), lam("#93d06c", true), lam("#b2e38a", true)];
    [[-26, -26, 9, 3.2], [-9, -30, 11, 3.6], [12, -27, 10, 3.4], [30, -24, 9, 3], [-38, -14, 8, 2.6], [40, -12, 8, 2.8]].forEach(([x, z, rr, h], i) => {
      const m = new THREE.Mesh(G.ico1, hillM[i % 3]);
      m.position.set(x, -rr * 0.55 + h * 0.4, z);
      m.scale.set(rr, rr * 0.55, rr * 0.7);
      S.add(m);
    });

    // 해 (또는 달)
    const sunM = new THREE.MeshBasicMaterial({ color: "#ffd54a", fog: false });
    this.sunBall = new THREE.Mesh(G.sph, sunM);
    this.sunBall.position.set(22, 20, -48);
    this.sunBall.scale.setScalar(3);
    S.add(this.sunBall);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex("rgba(255,236,160,.9)"), fog: false, depthWrite: false, transparent: true }));
    this.glow.position.copy(this.sunBall.position);
    this.glow.scale.setScalar(16);
    S.add(this.glow);
    // 별 (밤)
    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 220; i++) {
      const a = Math.random() * Math.PI - Math.PI,
        e = 0.12 + Math.random() * 0.9;
      sp.push(Math.cos(a) * 70 * Math.cos(e), 70 * Math.sin(e), Math.sin(a) * 70 * Math.cos(e));
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: "#fff8d8", size: 0.5, fog: false }));
    this.stars.visible = false;
    S.add(this.stars);

    // 구름
    this.clouds = [];
    const cm = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: "#bcd6ec", emissiveIntensity: 0.35 });
    for (let i = 0; i < 6; i++) {
      const cg = new THREE.Group();
      [[0, 0, 0, 1.6], [1.5, -0.2, 0.3, 1.2], [-1.5, -0.3, 0, 1.1], [0.6, 0.6, -0.2, 1.1]].forEach(([x, y, z, s]) => {
        const m = new THREE.Mesh(G.sphLo, cm);
        m.position.set(x, y, z);
        m.scale.set(s, s * 0.75, s);
        cg.add(m);
      });
      cg.position.set(-50 + i * 19, 13 + (i % 3) * 3, -32 - (i % 2) * 10);
      cg.userData.v = 0.6 + (i % 3) * 0.3;
      S.add(cg);
      this.clouds.push(cg);
    }

    // 나무 (인스턴스로 한 번에)
    const trees = [
      [-11.5, -9.5, 1.1, 0], [-6.8, -10.4, 0.95, 1], [-2.5, -9.8, 1.05, 0], [1.8, -10.6, 0.95, 1], [5.6, -9.9, 1.1, 0], [9.6, -10.3, 1, 1], [13, -8.6, 1.05, 0],
      [-12.6, -3, 1.1, 1], [-13, 4.5, 1, 0], [13.5, -6.5, 1.1, 1], [-13, -7.5, 0.95, 0], [-17, -15, 1.3, 0], [17, -14, 1.3, 1], [0, -17, 1.4, 0],
      [-9, -16, 1.2, 1], [10, -17, 1.3, 0], [-7.9, -4.6, 0.8, 0], [8.0, -4.8, 0.75, 1],
    ];
    const round = trees.filter((t) => !t[3]),
      pines = trees.filter((t) => t[3]);
    const trunkM = new THREE.MeshLambertMaterial({ color: "#8a5a33" });
    const trunks = new THREE.InstancedMesh(G.cyl, trunkM, trees.length);
    const crowns = new THREE.InstancedMesh(G.ico1, new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }), round.length * 4);
    const cones = new THREE.InstancedMesh(G.cone, new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }), pines.length * 3);
    const O = new THREE.Object3D();
    const col = new THREE.Color();
    const greens = ["#5fbf4a", "#6fcb52", "#4fae45", "#7fd35c"];
    trees.forEach(([x, z, s], i) => {
      O.position.set(x, 0.75 * s, z);
      O.scale.set(0.22 * s, 1.5 * s, 0.22 * s);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      trunks.setMatrixAt(i, O.matrix);
    });
    round.forEach(([x, z, s], i) => {
      [[0, 2.5, 0, 1.15], [-0.7, 1.9, 0.2, 0.85], [0.75, 1.95, -0.1, 0.85], [0.1, 1.85, 0.7, 0.8]].forEach(([dx, dy, dz, k], j) => {
        O.position.set(x + dx * s, dy * s, z + dz * s);
        O.scale.setScalar(k * s);
        O.rotation.set(i, j, 0);
        O.updateMatrix();
        crowns.setMatrixAt(i * 4 + j, O.matrix);
        crowns.setColorAt(i * 4 + j, col.set(greens[(i + j) % 4]));
      });
    });
    pines.forEach(([x, z, s], i) => {
      [[1.6, 1.3, 1.6], [2.5, 1.0, 1.35], [3.3, 0.72, 1.1]].forEach(([y, rr, h], j) => {
        O.position.set(x, y * s, z);
        O.scale.set(rr * s, h * s, rr * s);
        O.rotation.set(0, j, 0);
        O.updateMatrix();
        cones.setMatrixAt(i * 3 + j, O.matrix);
        cones.setColorAt(i * 3 + j, col.set(["#2f9a52", "#38a85c", "#45b868"][j]));
      });
    });
    S.add(trunks, crowns, cones);

    // 울타리 (뒤·양옆, 앞은 열어 둠)
    const postM = new THREE.MeshLambertMaterial({ color: "#c98a4a" });
    const posts = [];
    for (let x = -9.4; x <= 9.41; x += 1.175) posts.push([x, -6.3]);
    for (let z = -5.1; z <= 4.8; z += 1.2) {
      if (z < 0.3 || z > 2.8) posts.push([-9.4, z]); // 왼쪽은 문(입구)
      posts.push([9.4, z]);
    }
    const pm = new THREE.InstancedMesh(G.box, postM, posts.length);
    posts.forEach(([x, z], i) => {
      O.position.set(x, 0.55, z);
      O.scale.set(0.2, 1.1, 0.2);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      pm.setMatrixAt(i, O.matrix);
    });
    S.add(pm);
    const railM = new THREE.MeshLambertMaterial({ color: "#d99a58" });
    const rail = (x, z, len, rotY) => {
      for (const y of [0.42, 0.85]) {
        const m = new THREE.Mesh(G.box, railM);
        m.position.set(x, y, z);
        m.scale.set(len, 0.12, 0.08);
        m.rotation.y = rotY;
        S.add(m);
      }
    };
    rail(0, -6.3, 18.8, 0);
    rail(9.4, -0.75, 11, Math.PI / 2);
    rail(-9.4, -2.4, 7.8, Math.PI / 2);
    rail(-9.4, 3.85, 2.1, Math.PI / 2);
    // 입구 아치 + 간판
    const archM = new THREE.MeshLambertMaterial({ color: "#b9773a" });
    [0.25, 2.85].forEach((z) => {
      const m = new THREE.Mesh(G.box, archM);
      m.position.set(-9.4, 1.3, z);
      m.scale.set(0.28, 2.6, 0.28);
      S.add(m);
    });
    const sc = document.createElement("canvas");
    sc.width = 512;
    sc.height = 160;
    const sg2 = sc.getContext("2d");
    sg2.fillStyle = "#fff1c4";
    sg2.fillRect(0, 0, 512, 160);
    sg2.strokeStyle = "#a8662f";
    sg2.lineWidth = 16;
    sg2.strokeRect(8, 8, 496, 144);
    sg2.fillStyle = "#7a4a1e";
    sg2.font = "bold 76px Jua, sans-serif";
    sg2.textAlign = "center";
    sg2.textBaseline = "middle";
    sg2.fillText("우리 동물원", 256, 86);
    const st = new THREE.CanvasTexture(sc);
    st.colorSpace = THREE.SRGBColorSpace;
    this.signTex = st;
    this.signCanvas = sc;
    const signM = new THREE.MeshLambertMaterial({ map: st });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 2.9), [signM, signM, archM, archM, archM, archM]);
    sign.position.set(-9.4, 2.85, 1.55);
    S.add(sign);


    // 징검다리 길 (입구 → 가운데)
    const stoneM = new THREE.MeshLambertMaterial({ color: "#efe2bd" });
    const stones = [];
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      stones.push([-11.5 + t * 9.5, 1.55 - Math.sin(t * 3) * 0.6]);
    }
    const sm = new THREE.InstancedMesh(G.cyl, stoneM, stones.length);
    stones.forEach(([x, z], i) => {
      O.position.set(x, 0.03, z);
      O.scale.set(0.42, 0.06, 0.34);
      O.rotation.set(0, i, 0);
      O.updateMatrix();
      sm.setMatrixAt(i, O.matrix);
    });
    S.add(sm);

    // 연못
    const pond = new THREE.Group();
    pond.position.set(POND.x, 0, POND.z);
    const sand = new THREE.Mesh(G.circ, new THREE.MeshLambertMaterial({ color: "#ead39b" }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.01;
    sand.scale.set(POND.rx * 1.18, POND.rz * 1.22, 1);
    pond.add(sand);
    const water = new THREE.Mesh(G.circ, new THREE.MeshPhongMaterial({ color: "#3fa6e6", shininess: 120, specular: "#ffffff", transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.04;
    water.scale.set(POND.rx, POND.rz, 1);
    pond.add(water);
    const deep = new THREE.Mesh(G.circ, new THREE.MeshBasicMaterial({ color: "#1f6fb0", transparent: true, opacity: 0.35, depthWrite: false }));
    deep.rotation.x = -Math.PI / 2;
    deep.position.y = 0.045;
    deep.scale.set(POND.rx * 0.6, POND.rz * 0.55, 1);
    pond.add(deep);
    this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false }));
    this.ripple.rotation.x = -Math.PI / 2;
    this.ripple.position.y = 0.05;
    pond.add(this.ripple);
    const rockM = new THREE.MeshLambertMaterial({ color: "#c3c9d4", flatShading: true });
    const rocks = new THREE.InstancedMesh(G.ico, rockM, 18);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const s = 0.18 + ((i * 7) % 4) * 0.05;
      O.position.set(Math.cos(a) * POND.rx * 1.08, s * 0.4, Math.sin(a) * POND.rz * 1.1);
      O.scale.set(s, s * 0.7, s);
      O.rotation.set(i, i * 2, 0);
      O.updateMatrix();
      rocks.setMatrixAt(i, O.matrix);
    }
    pond.add(rocks);
    const padM = new THREE.MeshLambertMaterial({ color: "#5fbf4a" });
    [[0.9, -0.4, 0.32], [-1.1, 0.3, 0.26], [0.2, 0.75, 0.22]].forEach(([x, z, s]) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 20, 0.3, Math.PI * 2 - 0.6), padM);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.06, z);
      m.scale.setScalar(s);
      pond.add(m);
    });
    const lotus = new THREE.Mesh(G.sphLo, new THREE.MeshLambertMaterial({ color: "#ff9fc0" }));
    lotus.position.set(-1.1, 0.12, 0.3);
    lotus.scale.set(0.13, 0.09, 0.13);
    pond.add(lotus);
    S.add(pond);

    // 덤불·꽃·풀 (인스턴스)
    const bushes = [[-7.6, -5.6], [-2.5, -5.8], [3.2, -5.7], [7.2, -5.5], [-8.6, 3.9], [8.7, 3.4], [-4.5, 4.4], [1.2, 4.6]];
    const bm = new THREE.InstancedMesh(G.ico1, new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }), bushes.length * 3);
    bushes.forEach(([x, z], i) => {
      [[0, 0.35, 0, 0.5], [-0.45, 0.25, 0.1, 0.38], [0.45, 0.25, -0.05, 0.4]].forEach(([dx, y, dz, s], j) => {
        O.position.set(x + dx, y, z + dz);
        O.scale.setScalar(s);
        O.rotation.set(i, j, 0);
        O.updateMatrix();
        bm.setMatrixAt(i * 3 + j, O.matrix);
        bm.setColorAt(i * 3 + j, col.set(greens[(i + j + 1) % 4]));
      });
    });
    S.add(bm);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const fl = [];
    for (let i = 0; i < 46; i++) {
      const x = -11 + rnd() * 22,
        z = -5.8 + rnd() * 11.5;
      if (this.inPond(x, z, 1.2)) continue;
      fl.push([x, z, i]);
    }
    const stems = new THREE.InstancedMesh(G.cyl, new THREE.MeshLambertMaterial({ color: "#3f9a3c" }), fl.length);
    const heads = new THREE.InstancedMesh(G.sphLo, new THREE.MeshLambertMaterial({ color: "#ffffff" }), fl.length);
    const fcol = ["#ff8fb1", "#ffffff", "#ffd34d", "#b38cff", "#ff7a6b"];
    fl.forEach(([x, z, i], k) => {
      O.position.set(x, 0.15, z);
      O.scale.set(0.025, 0.3, 0.025);
      O.rotation.set(0, 0, 0);
      O.updateMatrix();
      stems.setMatrixAt(k, O.matrix);
      O.position.set(x, 0.32, z);
      O.scale.set(0.11, 0.08, 0.11);
      O.updateMatrix();
      heads.setMatrixAt(k, O.matrix);
      heads.setColorAt(k, col.set(fcol[i % 5]));
    });
    S.add(stems, heads);
    const tufts = new THREE.InstancedMesh(G.cone, new THREE.MeshLambertMaterial({ color: "#5fb046" }), 160);
    for (let i = 0; i < 160; i++) {
      let x = -14 + rnd() * 28,
        z = -9 + rnd() * 16;
      if (this.inPond(x, z, 1.25)) x += 3;
      O.position.set(x, 0.1, z);
      O.scale.set(0.05, 0.22, 0.05);
      O.rotation.set(((i % 5) - 2) * 0.15, 0, ((i % 3) - 1) * 0.2);
      O.updateMatrix();
      tufts.setMatrixAt(i, O.matrix);
    }
    S.add(tufts);

    // 그림자 원 (동물 발밑)
    const shC = document.createElement("canvas");
    shC.width = shC.height = 64;
    const shg = shC.getContext("2d");
    const sgr = shg.createRadialGradient(32, 32, 0, 32, 32, 32);
    sgr.addColorStop(0, "rgba(20,50,10,.55)");
    sgr.addColorStop(0.6, "rgba(20,50,10,.25)");
    sgr.addColorStop(1, "rgba(20,50,10,0)");
    shg.fillStyle = sgr;
    shg.fillRect(0, 0, 64, 64);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shC), transparent: true, depthWrite: false });
  };

  /* ---------- 밤/낮 ---------- */
  W3.setNight = function (n) {
    this.night = n;
    this.scene.background = n ? this.nightSky : this.daySky;
    this.scene.fog.color.set(n ? "#2c3a70" : "#d6efff");
    this.hemi.intensity = n ? 0.75 : 1.6;
    this.hemi.color.set(n ? "#8fa4ff" : "#d8f0ff");
    this.sun.intensity = n ? 0.7 : 2.0;
    this.sun.color.set(n ? "#b8c8ff" : "#fff4de");
    this.sunBall.material.color.set(n ? "#fff6c8" : "#ffd54a");
    this.sunBall.scale.setScalar(n ? 2.2 : 3);
    this.stars.visible = n;
  };

  /* ---------- 크기 ---------- */
  W3.resize = function () {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    const a = w / h;
    this.camera.aspect = a;
    const tall = a < 0.8;
    this.camera.fov = tall ? 50 : 40;
    this.camera.updateProjectionMatrix();
    // 우리(가로 ~19) 가 화면에 들어오는 거리
    const vf = (this.camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * a);
    const half = tall ? 5.6 : 10.4;
    this.baseDist = U.clamp(half / Math.tan(hf), 12, 30);
    this.cam.el = this.cam.tel = tall ? 0.78 : 0.46;
    const was = this.cam.baseAz;
    this.cam.baseAz = tall ? Math.PI / 2 : 0;
    if (was !== this.cam.baseAz) this.cam.az = this.cam.taz = this.cam.baseAz;
    this.cam.target.set(0, tall ? 0 : 0.4, tall ? -0.4 : -1.2);
    this.render();
  };

  W3.inPond = function (x, z, m = 1) {
    const dx = (x - POND.x) / (POND.rx * 1.12 * m),
      dz = (z - POND.z) / (POND.rz * 1.18 * m);
    return dx * dx + dz * dz < 1;
  };
  W3.crossPond = function (x0, z0, x1, z1) {
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      if (this.inPond(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 1.1)) return true;
    }
    return false;
  };

  /* ---------- 동물 ---------- */
  W3.clear = function () {
    for (const a of this.animals) {
      this.scene.remove(a.root);
      a.root.traverse((o) => o.isMesh && o.geometry && o.geometry.attributes.color && o.geometry.dispose());
    }
    for (const t of this.treats) this.scene.remove(t.obj);
    this.animals = [];
    this.treats = [];
    this.disposeList = [];
  };
  W3.addAnimal = function (item, isNew) {
    const t = this.T[item.tid];
    const colors = readColors(item.svg);
    const B = Builder(colors);
    const root = new THREE.Group();
    const bob = new THREE.Group();
    root.add(bob);
    const body = new THREE.Group();
    bob.add(body);
    (MODELS[item.tid] || MODELS.bear)(B, body);
    // 토끼 귀처럼 따로 움직이는 부위는 빼고 합침
    if (B.wag && B.wag.isMesh) {
      const p = new THREE.Group();
      body.add(p);
      p.add(B.wag);
    }
    mergeGroup(body);
    if (B.wings) B.wings.forEach((w) => mergeGroup(w.p));
    if (B.wag && B.wag.isGroup) mergeGroup(B.wag);
    const k = SIZE[item.tid] || 1;
    root.scale.setScalar(k);
    // 콕 누르기 쉽게 보이지 않는 큰 공
    const hit = new THREE.Mesh(G.sphLo, new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0.3, (B.headY || 1.5) * 0.5, 0);
    hit.scale.set(1.5, Math.max(0.9, (B.headY || 1.5) * 0.65), 1.1);
    bob.add(hit);
    const a = { item, t, root, bob, body, B, hit, k, x: 0, z: 0, y: 0, tx: 0, tz: 0, ty: 0, head: 0, state: "idle", wait: Math.random() * 2, ph: Math.random() * 6, jump: 0, treat: null, look: 0 };
    hit.userData.animal = a;
    if (t.move === "walk" || t.move === "hop") {
      a.shadow = new THREE.Mesh(G.circ, this.shadowMat);
      a.shadow.rotation.x = -Math.PI / 2;
      a.shadow.position.set(0.2, 0.02, 0);
      a.shadow.scale.set(1.15, 0.7, 1);
      root.add(a.shadow);
    }
    const p = this.randPos(t.move, a);
    a.x = a.tx = p.x;
    a.z = a.tz = p.z;
    a.y = a.ty = p.y || 0;
    a.head = Math.random() * 6.28;
    if (isNew && t.move !== "swim") {
      // 새 친구는 입구(왼쪽 문)로 걸어 들어옴
      a.x = -12.5;
      a.z = 1.55;
      if (t.move === "fly") a.y = 3;
      a.tx = -4;
      a.tz = 1.3;
      a.head = 0;
      a.state = "walk";
      a.isNew = 6;
    }
    this.scene.add(root);
    this.animals.push(a);
    this.place(a, 0);
    return a;
  };
  W3.randPos = function (move, self) {
    if (move === "fly") {
      const low = self && self.item.tid === "butterfly";
      return { x: U.randf(PEN.x0, PEN.x1) * 0.9, z: U.randf(PEN.z0, PEN.z1) * 0.9, y: low ? U.randf(1.2, 2.4) : U.randf(2.6, 4.2) };
    }
    if (move === "swim") {
      const a = U.randf(0, 6.28),
        rr = Math.sqrt(Math.random()) * 0.55;
      return { x: POND.x + Math.cos(a) * POND.rx * rr, z: POND.z + Math.sin(a) * POND.rz * rr, y: 0 };
    }
    let best = null,
      bd = -1;
    for (let i = 0; i < 30; i++) {
      const x = U.randf(PEN.x0, PEN.x1),
        z = U.randf(PEN.z0, PEN.z1);
      if (this.inPond(x, z)) continue;
      if (self && !this.inPond(self.x, self.z) && this.crossPond(self.x, self.z, x, z)) continue;
      let d = 1e9;
      for (const o of this.animals) {
        if (o === self || o.t.move === "fly" || o.t.move === "swim") continue;
        d = Math.min(d, Math.hypot(o.tx - x, o.tz - z), Math.hypot(o.x - x, o.z - z));
      }
      if (d > 2.4) return { x, z, y: 0 };
      if (d > bd) {
        bd = d;
        best = { x, z, y: 0 };
      }
    }
    return best || { x: -3, z: 0, y: 0 };
  };
  const angDiff = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  W3.place = function (a, dt) {
    const m = a.t.move;
    a.root.position.set(a.x, 0, a.z);
    a.root.rotation.y = a.head;
    let y = a.y,
      sq = 1;
    const walking = a.state === "walk";
    if (m === "hop" && walking) y += Math.abs(Math.sin(a.ph * 2.4)) * 0.75;
    if (m === "fly") y += Math.sin(a.ph * 1.3) * 0.18;
    if (m === "swim") y = -0.05 + Math.sin(a.ph * 1.5) * 0.04;
    if (a.jump > 0) {
      const u = 1 - a.jump / 0.65;
      y += Math.sin(u * Math.PI) * 1.0;
      sq = u < 0.15 || u > 0.85 ? 0.85 : 1.06;
    }
    if (m === "walk" && walking) y += Math.abs(Math.sin(a.ph * 2.4)) * 0.06;
    a.bob.position.y = m === "swim" ? y + 0.25 : y;
    a.bob.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    if (a.shadow) {
      const s = 1 - Math.min(0.55, (y - a.y) * 0.4);
      a.shadow.scale.set(1.15 * s, 0.7 * s, 1);
      a.shadow.material = this.shadowMat;
    }
    // 다리
    const sw = walking && m !== "hop" ? Math.sin(a.ph * 2.4) * (a.t.slow ? 0.35 : 0.6) : 0;
    for (const L of a.B.legs) L.piv.rotation.z = L.piv.rotation.z * 0.8 + (L.ph ? -sw : sw) * 0.2;
    if (a.B.wag) a.B.wag.rotation[m === "swim" ? "y" : "x"] = Math.sin(a.ph * (m === "swim" ? 4 : 5)) * 0.45;
    if (a.B.wings) {
      const f = a.item.tid === "butterfly" ? Math.sin(a.ph * 7) * 0.9 : Math.sin(a.ph * 9) * 0.7;
      for (const w of a.B.wings) w.p.rotation.x = -f * w.s;
    }
    void dt;
  };

  W3.tick = function (dt) {
    if (this.lost) return;
    const cam = this.cam;
    cam.az += (cam.taz - cam.az) * Math.min(1, dt * 8);
    cam.el += (cam.tel - cam.el) * Math.min(1, dt * 8);
    cam.zoom += (cam.tzoom - cam.zoom) * Math.min(1, dt * 8);
    for (const c of this.clouds) {
      c.position.x += c.userData.v * dt;
      if (c.position.x > 60) c.position.x = -60;
    }
    this.rip = ((this.rip || 0) + dt * 0.45) % 1;
    this.ripple.scale.set(POND.rx * (0.2 + this.rip * 0.7), POND.rz * (0.2 + this.rip * 0.7), 1);
    this.ripple.material.opacity = 0.55 * (1 - this.rip);
    for (const a of this.animals) {
      a.ph += dt * 4;
      if (a.jump > 0) a.jump = Math.max(0, a.jump - dt);
      if (a.isNew) a.isNew = Math.max(0, a.isNew - dt);
      const m = a.t.move;
      const speed = (m === "fly" ? 1.9 : m === "swim" ? 0.7 : a.t.slow ? 0.45 : m === "hop" ? 1.6 : 1.25) * (a.treat || a.gather ? 1.8 : 1);
      if (a.state === "idle") {
        a.wait -= dt;
        if (a.look > 0) {
          // 카메라 쪽 바라보기
          a.look -= dt;
          const cp = this.camera.position;
          const want = Math.atan2(-(cp.z - a.z), cp.x - a.x);
          a.head += angDiff(a.head, want) * Math.min(1, dt * 6);
        }
        if (a.wait <= 0 && a.jump <= 0) {
          const p = a.treat ? { x: a.treat.x, z: a.treat.z, y: 0 } : this.randPos(m, a);
          a.tx = p.x;
          a.tz = p.z;
          a.ty = p.y || 0;
          a.state = "walk";
        }
      } else {
        const dx = a.tx - a.x,
          dz = a.tz - a.z,
          dy = a.ty - a.y,
          d = Math.hypot(dx, dz, dy);
        if (d < 0.08) {
          a.state = "idle";
          a.wait = m === "fly" ? U.randf(0.3, 1.2) : U.randf(1.2, 3.8);
          if (a.treat) this.eat(a);
          else if (a.gather) {
            a.gather = false;
            a.look = 3;
          }
        } else {
          const st = Math.min(d, speed * dt);
          a.x += (dx / d) * st;
          a.z += (dz / d) * st;
          a.y += (dy / d) * st;
          if (Math.hypot(dx, dz) > 0.05) {
            const want = Math.atan2(-dz, dx);
            a.head += angDiff(a.head, want) * Math.min(1, dt * 5);
          }
        }
      }
      this.place(a, dt);
    }
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
        t.obj.scale.setScalar(Math.max(0.01, t.eating / 0.3));
        if (t.eating <= 0) {
          this.scene.remove(t.obj);
          t.gone = true;
        }
      }
    }
    if (this.treats.some((t) => t.gone)) this.treats = this.treats.filter((t) => !t.gone);
    this.render();
    this.frames = (this.frames || 0) + 1;
  };
  W3.render = function () {
    const c = this.cam,
      d = (this.baseDist || 16) * c.zoom;
    const tg = c.target;
    this.camera.position.set(tg.x + d * Math.sin(c.az) * Math.cos(c.el), tg.y + d * Math.sin(c.el), tg.z + d * Math.cos(c.az) * Math.cos(c.el));
    this.camera.lookAt(tg);
    this.renderer.render(this.scene, this.camera);
  };

  /* ---------- 간식 ---------- */
  W3.makeTreat = function () {
    const g = new THREE.Group();
    const kind = U.pick(["apple", "carrot", "corn", "apple"]);
    if (kind === "apple") {
      g.add(new THREE.Mesh(G.sph, new THREE.MeshPhongMaterial({ color: "#ff4d5e", shininess: 90 })));
      g.children[0].scale.set(0.32, 0.29, 0.32);
      const s = new THREE.Mesh(G.cyl, new THREE.MeshLambertMaterial({ color: "#6b4226" }));
      s.position.y = 0.32;
      s.scale.set(0.03, 0.14, 0.03);
      g.add(s);
      const l = new THREE.Mesh(G.sphLo, new THREE.MeshLambertMaterial({ color: "#4fae45" }));
      l.position.set(0.09, 0.34, 0);
      l.scale.set(0.11, 0.03, 0.06);
      g.add(l);
      g.userData.rest = 0.29;
    } else if (kind === "carrot") {
      const c = new THREE.Mesh(G.cone, new THREE.MeshPhongMaterial({ color: "#ff8a2b", shininess: 30 }));
      c.scale.set(0.16, 0.6, 0.16);
      c.rotation.z = Math.PI / 2;
      g.add(c);
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(G.cone, new THREE.MeshLambertMaterial({ color: "#3f9a3c" }));
        l.position.set(-0.36, 0, (i - 1) * 0.05);
        l.scale.set(0.04, 0.22, 0.04);
        l.rotation.z = Math.PI / 2 + (i - 1) * 0.4;
        g.add(l);
      }
      g.userData.rest = 0.16;
    } else {
      const c = new THREE.Mesh(capsule(0.13, 0.55), new THREE.MeshPhongMaterial({ color: "#ffd54a", shininess: 40 }));
      c.rotation.z = Math.PI / 2;
      g.add(c);
      const l = new THREE.Mesh(G.sph, new THREE.MeshLambertMaterial({ color: "#7fc95a" }));
      l.position.set(-0.12, 0.02, 0);
      l.scale.set(0.2, 0.12, 0.16);
      g.add(l);
      g.userData.rest = 0.14;
    }
    return g;
  };
  W3.dropTreat = function (x, z) {
    x = U.clamp(x, PEN.x0, PEN.x1);
    z = U.clamp(z, PEN.z0, PEN.z1);
    if (this.inPond(x, z)) {
      let dx = (x - POND.x) / POND.rx,
        dz = (z - POND.z) / POND.rz;
      if (!dx && !dz) dx = -1;
      const k = 1 / Math.hypot(dx, dz);
      x = POND.x + dx * k * POND.rx * 1.3;
      z = POND.z + dz * k * POND.rz * 1.35;
      if (z > PEN.z1) z = POND.z - POND.rz * 1.35;
    }
    const obj = this.makeTreat();
    obj.position.set(x, 6, z);
    obj.rotation.y = Math.random() * 6;
    this.scene.add(obj);
    const tr = { x, z, obj, vy: 0, rest: obj.userData.rest, bounce: 2, taken: false };
    this.treats.push(tr);
    KP.audio.sfx("drop");
    const land = this.animals.filter((a) => (a.t.move === "walk" || a.t.move === "hop") && !a.treat);
    land.sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z));
    const a = land[0];
    if (a) {
      a.treat = tr;
      a.tx = x - 0.9 * Math.sign(x - a.x || 1) * a.k;
      a.tz = z;
      a.state = "walk";
      // 간식 바로 앞에서 멈춤 (입이 간식에 닿게)
      const d = Math.hypot(x - a.x, z - a.z) || 1;
      a.tx = x - ((x - a.x) / d) * 1.1 * a.k;
      a.tz = z - ((z - a.z) / d) * 1.1 * a.k;
      if (this.inPond(a.tx, a.tz)) {
        a.tx = x;
        a.tz = z;
      }
    } else this.ctx.after(4000, () => this.removeTreat(tr));
  };
  W3.removeTreat = function (tr) {
    if (tr.gone) return;
    tr.taken = true;
    tr.eating = 0.3;
  };
  W3.eat = function (a) {
    const tr = a.treat;
    a.treat = null;
    if (!tr || tr.taken) return;
    a.head += angDiff(a.head, Math.atan2(-(tr.z - a.z), tr.x - a.x));
    this.removeTreat(tr);
    a.jump = 0.65;
    this.hearts(a, 3);
    KP.audio.sfx("bubble");
    KP.voice.say(U.pick(["냠냠! 맛있다!", "고마워요!", "냠냠냠!"]));
  };
  W3.treatTime = function () {
    for (let i = 0; i < 3; i++)
      this.ctx.after(i * 250, () => {
        const p = this.randPos("walk");
        this.dropTreat(p.x, p.z);
      });
  };
  W3.callAll = function () {
    const land = this.animals.filter((a) => a.t.move === "walk" || a.t.move === "hop");
    // 카메라 쪽(앞)으로 줄지어 모임: f = 가운데→카메라 방향, p = 옆 방향
    const az = this.cam.taz,
      fx = Math.sin(az),
      fz = Math.cos(az),
      px = Math.cos(az),
      pz = -Math.sin(az);
    const n = land.length,
      perRow = Math.min(n, this.w / this.h < 0.8 ? 3 : 6);
    land.forEach((a, i) => {
      if (a.treat) {
        this.removeTreat(a.treat);
        a.treat = null;
      }
      const row = Math.floor(i / perRow),
        inRow = Math.min(perRow, n - row * perRow),
        col = (i % perRow) - (inRow - 1) / 2;
      const fwd = 2.2 - row * 2.3;
      let x = this.cam.target.x + fx * fwd + px * col * 2.3,
        z = this.cam.target.z + fz * fwd + pz * col * 2.3;
      x = U.clamp(x, PEN.x0, PEN.x1);
      z = U.clamp(z, PEN.z0, PEN.z1);
      for (let k = 0; k < 20 && this.inPond(x, z); k++) {
        x -= fx * 0.4 + px * 0.3;
        z -= fz * 0.4;
      }
      a.tx = x;
      a.tz = z;
      a.state = "walk";
      a.gather = true;
    });
    this.animals.forEach((a) => {
      if (a.t.move === "fly") {
        a.tx = U.randf(-3, 3);
        a.tz = U.randf(-1, 1);
        a.ty = a.item.tid === "butterfly" ? 2 : 3.2;
        a.state = "walk";
      }
    });
    this.treats.forEach((t) => this.removeTreat(t));
  };

  /* ---------- 화면 좌표 ---------- */
  W3.toScreen = function (a, up = 1) {
    const v = new THREE.Vector3(a.x, (a.y + (a.B.headY || 1.5) * up) * a.k, a.z);
    v.project(this.camera);
    return { x: ((v.x + 1) / 2) * this.w, y: ((1 - v.y) / 2) * this.h };
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

  /* ---------- 터치 ---------- */
  W3.pick = function (cx, cy) {
    const rc = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
    const hits = this.raycaster.intersectObjects(this.animals.map((a) => a.hit), false);
    if (hits.length) return { animal: hits[0].object.userData.animal };
    const gh = this.raycaster.intersectObject(this.ground, false);
    if (gh.length) return { ground: gh[0].point };
    return {};
  };
  W3.bindInput = function () {
    const el = this.renderer.domElement;
    const pts = new Map();
    let start = null,
      moved = false,
      lp = 0,
      pinch0 = 0,
      zoom0 = 1;
    el.addEventListener("pointerdown", (e) => {
      KP.audio.unlock();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [p, q] = [...pts.values()];
        pinch0 = Math.hypot(p.x - q.x, p.y - q.y);
        zoom0 = this.cam.tzoom;
        clearTimeout(lp);
        moved = true;
        return;
      }
      start = { x: e.clientX, y: e.clientY, az: this.cam.taz, el: this.cam.tel, t: performance.now() };
      moved = false;
      const hit = this.pick(e.clientX, e.clientY);
      start.animal = hit.animal || null;
      if (hit.animal) {
        this.poke(hit.animal);
        clearTimeout(lp);
        lp = setTimeout(() => !moved && this.onDelete && this.onDelete(hit.animal), 1800);
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [p, q] = [...pts.values()];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (pinch0 > 0) this.cam.tzoom = U.clamp((zoom0 * pinch0) / d, 0.45, 1.35);
        return;
      }
      if (!start) return;
      const dx = e.clientX - start.x,
        dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) > 10) {
        moved = true;
        clearTimeout(lp);
      }
      if (moved) {
        this.cam.taz = U.clamp(start.az - dx * 0.006, (this.cam.baseAz || 0) - 1.0, (this.cam.baseAz || 0) + 1.0);
        this.cam.tel = U.clamp(start.el + dy * 0.004, 0.32, 1.2);
      }
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      clearTimeout(lp);
      if (pts.size) return;
      if (start && !moved && !start.animal && e.type === "pointerup") {
        const hit = this.pick(e.clientX, e.clientY);
        if (hit.ground && this.animals.length) this.dropTreat(hit.ground.x, hit.ground.z);
      }
      start = null;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    // 마우스 휠 확대/축소
    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.cam.tzoom = U.clamp(this.cam.tzoom * (e.deltaY > 0 ? 1.08 : 0.92), 0.45, 1.35);
      },
      { passive: false }
    );
  };
  W3.poke = function (a) {
    a.jump = 0.65;
    a.look = 1.8;
    if (a.state === "walk" && !a.treat && !a.gather) {
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
    let s = 1;
    const shrink = () => {
      s -= 0.08;
      a.root.scale.setScalar(Math.max(0.01, s) * a.k);
      if (s > 0) requestAnimationFrame(shrink);
      else this.scene.remove(a.root);
    };
    shrink();
  };
  W3.resetView = function () {
    this.cam.tzoom = 1;
    this.cam.tel = this.w / this.h < 0.8 ? 0.78 : 0.46;
    this.cam.taz = this.cam.baseAz || 0;
  };
})();
