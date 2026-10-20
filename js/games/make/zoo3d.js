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
      try {
        return (this._last = new World(ctx, host, T));
      } catch (e) {
        this.ok = false; // WebGL 을 아예 못 만들면 그때만 3D 끄기
        throw e;
      }
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
    const out = { parts: {}, legs: {}, gidx: {}, legIdx: {} };
    let doc;
    try {
      doc = new DOMParser().parseFromString(KP.sanitizeSvg(String(svgStr || "")), "image/svg+xml");
    } catch (e) {
      return out;
    }
    // gi = 도안 안 부위 순서(색칠 공방에서 크레파스 그림을 저장할 때 쓰는 번호와 같음)
    doc.querySelectorAll("[data-p]").forEach((e, gi) => {
      const p = e.getAttribute("data-p"),
        f = (e.getAttribute("fill") || "#ffffff").trim();
      (out.parts[p] = out.parts[p] || []).push(f);
      (out.gidx[p] = out.gidx[p] || []).push(gi);
      const lg = e.parentNode && e.parentNode.getAttribute && /\bl(\d)\b/.exec(e.parentNode.getAttribute("class") || "");
      if (lg) {
        out.legs[lg[1]] = f;
        out.legIdx[lg[1]] = gi;
      }
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
      m = new THREE.MeshStandardMaterial({ color: 0xffffff, map: patternTex(kind, base), roughness: 0.55, normalMap: clayNormal(), normalScale: new THREE.Vector2(0.4, 0.4) });
    } else {
      m = new THREE.MeshStandardMaterial({ color: /^#[0-9a-f]{3,8}$/i.test(fill) ? fill : "#ffffff", roughness: 0.55, normalMap: clayNormal(), normalScale: new THREE.Vector2(0.4, 0.4) });
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
    inkMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.25 });
    whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    blushMat = new THREE.MeshBasicMaterial({ color: 0xffa0b4 });
    noseMat = new THREE.MeshStandardMaterial({ color: 0xff7a96, roughness: 0.4 });
    tongueMat = new THREE.MeshStandardMaterial({ color: 0xff7a96, roughness: 0.5 });
  }

  /* ---------------- 동물 모델 (모두 +x 쪽을 봄, 발바닥 y=0) ---------------- */
  /* 크레파스 그림 → 3D 부위: 그 부위 색(또는 무늬) 위에 아이 그림을 겹친 그림판을 만들어
     옆에서 비추듯(평면 투영) 입힘. 양쪽 옆면에 같은 그림이 들어감 */
  function paintMat(gi, fill, pp, cache) {
    const key = "pp" + gi;
    if (cache.has(key)) return cache.get(key);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, normalMap: clayNormal(), normalScale: new THREE.Vector2(0.4, 0.4) });
    m.userData.gi = gi;
    m.userData.pp = pp;
    const im = new Image();
    im.onload = () => {
      if (m._gone) return; // 그림이 늦게 왔는데 그사이 동물이 치워졌으면 만들지 않음
      const c = document.createElement("canvas");
      const sc = Math.min(1, 256 / Math.max(im.width, im.height)); // 3D 용은 작게 (기기 부담)
      c.width = Math.max(8, Math.round(im.width * sc));
      c.height = Math.max(8, Math.round(im.height * sc));
      const g = c.getContext("2d");
      const u = /^url\(#([\w-]+)\)$/.exec(fill);
      if (u) {
        const k = /-(rainbow|glitter|dots|stripes)(?:-([0-9a-f]{6}))?$/i.exec(u[1]);
        const t = patternTex(k ? k[1] : "rainbow", k && k[2] ? "#" + k[2] : "#ffffff");
        g.fillStyle = g.createPattern(t.image, "repeat");
      } else g.fillStyle = /^#[0-9a-f]{3,8}$/i.test(fill) ? fill : "#ffffff";
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(im, 0, 0, c.width, c.height);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      m.map = tex;
      m.needsUpdate = true;
    };
    im.src = pp.src;
    cache.set(key, m);
    return m;
  }
  /** 부위 모양(자기 좌표, 크기만 반영)을 옆에서 본 사각형에 맞춰 그림 좌표를 줌 */
  function projectUV(mesh) {
    const pp = mesh.material.userData.pp;
    const g = mesh.geometry.clone();
    const p = g.attributes.position;
    const sx = mesh.scale.x,
      sy = mesh.scale.y;
    let x0 = Infinity,
      x1 = -Infinity,
      y0 = Infinity,
      y1 = -Infinity;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) * sx,
        y = p.getY(i) * sy;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    // 그림판(pp)은 부위 크기 둘레로 3단위 여백이 있음
    const PAD = 3,
      bx = pp.x + PAD,
      by = pp.y + PAD,
      bw = Math.max(1, pp.w - PAD * 2),
      bh = Math.max(1, pp.h - PAD * 2);
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) * sx - x0) / (x1 - x0 || 1),
        v = (p.getY(i) * sy - y0) / (y1 - y0 || 1); // v=1 위
      const ex = bx + u * bw,
        ey = by + (1 - v) * bh; // 도안은 y 가 아래로
      uv[i * 2] = (ex - pp.x) / pp.w;
      uv[i * 2 + 1] = 1 - (ey - pp.y) / pp.h;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    mesh.geometry = g;
    mesh.userData.ownGeo = true;
  }
  function Builder(colors, paint) {
    const cache = new Map();
    const count = {};
    const meshes = [];
    const painted = (gi) => paint && gi !== undefined && paint[gi];
    const B = {
      legs: [],
      parts: {},
      mat(part, idx) {
        const list = colors.parts[part];
        const i = idx !== undefined ? idx : (count[part] = (count[part] || 0) + 1) - 1;
        const f = list && list.length ? list[i % list.length] : "#ffffff";
        const gl = colors.gidx[part];
        const gi = gl && gl.length ? gl[i % gl.length] : undefined;
        if (painted(gi)) return paintMat(gi, f, paint[gi], cache);
        return fillToMat(f, cache);
      },
      add(parent, geo, mat, pos, scl, rot) {
        const m = new THREE.Mesh(geo, mat);
        if (pos) m.position.set(pos[0], pos[1], pos[2]);
        if (scl) m.scale.set(scl[0], scl[1], scl[2]);
        if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
        if (mat && mat.userData && mat.userData.pp) projectUV(m);
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
        const gi = colors.legIdx[n] !== undefined ? colors.legIdx[n] : (colors.gidx.leg || [])[0];
        const m = B.add(piv, capsule(r, len), painted(gi) ? paintMat(gi, f, paint[gi], cache) : fillToMat(f, cache), [0, -len / 2 + r * 0.15, 0]);
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
          s = (o.size ?? 0.17) * 1.2;
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
      vcMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, normalMap: clayNormal(), normalScale: new THREE.Vector2(0.4, 0.4) });
      vcFlat = new THREE.MeshBasicMaterial({ vertexColors: true });
    }
    const parts = { lit: [], flat: [] };
    for (const m of [...group.children]) {
      if (!m.isMesh || !m.material || m.material.map || m.material.userData.pp || m.material.transparent || m.material.visible === false) continue;
      m.updateMatrix();
      (m.material.isMeshBasicMaterial ? parts.flat : parts.lit).push({ geo: m.geometry, matrix: m.matrix.clone(), color: m.material.color });
      group.remove(m);
    }
    for (const [k, list] of Object.entries(parts)) if (list.length) group.add(new THREE.Mesh(bakeList(list), k === "lit" ? vcMat : vcFlat));
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
    // 태블릿 이상은 고화질 그림자
    this.hi = Math.min(screen.width || 0, screen.height || 0) >= 600;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.NeutralToneMapping; // 아이가 고른 색이 바래지 않는 색 보정
    r.toneMappingExposure = 1.22;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.className = "z3Canvas";
    host.appendChild(r.domElement);
    // 화면이 잠깐 끊겨도(백그라운드 등) 3D 는 계속 지원 — 다음에 동물원을 열 때 새로 만듦 (zoo.js)
    r.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1.5, 0.5, 200);
    this.cam = { az: 0, el: 0.62, zoom: 1, taz: 0, tel: 0.62, tzoom: 1, target: new THREE.Vector3(0, 0.6, -0.2) };
    this.animals = [];
    this.treats = [];
    this.raycaster = new THREE.Raycaster();
    this.buildWorld();
    // 자동 화질: 지난번에 정한 단계에서 시작 (7일이 지나면 한 단계 올려 다시 시도)
    const qs = KP.store.get("zoo3d:q", null);
    this.q = qs && Number.isFinite(qs.q) ? qs.q : 0;
    if (qs && this.q > 0 && Date.now() - (qs.t || 0) > 7 * 864e5) this.q--;
    this.applyQ(this.q);
    this.bindInput();
    this.resize();
    if (window.ResizeObserver) (this.ro = new ResizeObserver(() => this.resize())).observe(host);
  }
  const W3 = World.prototype;

  /** 다 쓴 세계 정리 (화면이 끊겨 새로 만들 때) */
  W3.dispose = function () {
    if (this.dead) return;
    this.dead = this.lost = true;
    if (this.ro) this.ro.disconnect();
    this.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  };

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

  /* ---------- 점토(클레이) 느낌 도구 ---------- */
  // 정해진 순서로 나오는 난수 (매번 같은 배치)
  function seeded(s) {
    let seed = s;
    return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  }
  // 손으로 빚은 듯 살짝 울퉁불퉁한 공
  const blobCache = new Map();
  function blobGeo(k, amp = 0.09, detail = 3) {
    const key = k + "_" + amp + "_" + detail;
    if (blobCache.has(key)) return blobCache.get(key);
    const g = new THREE.IcosahedronGeometry(1, detail);
    const p = g.attributes.position;
    const a = 1.7 + k * 0.37,
      b = 2.3 + k * 0.21,
      c = 1.9 + k * 0.53;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const n = Math.sin(x * a * 2 + k) * Math.cos(y * b * 2 + k * 2) + Math.sin(z * c * 2 + k * 3) * 0.7 + Math.sin((x + y + z) * 4.1 + k) * 0.35;
      const s = 1 + n * amp;
      p.setXYZ(i, x * s, y * s, z * s);
    }
    g.computeVertexNormals();
    blobCache.set(key, g);
    return g;
  }
  // 둥근 테두리가 처진 소나무 층 (회전체)
  const pineCache = new Map();
  function pineTier(k) {
    if (pineCache.has(k)) return pineCache.get(k);
    const pts = [];
    pts.push(new THREE.Vector2(0.001, 1));
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector2(Math.sin(t * Math.PI * 0.5) * 0.92, 1 - t * 0.82));
    }
    pts.push(new THREE.Vector2(1.0, 0.12), new THREE.Vector2(0.97, 0.03), new THREE.Vector2(0.86, 0.0), new THREE.Vector2(0.55, 0.06), new THREE.Vector2(0.001, 0.08));
    const g = new THREE.LatheGeometry(pts, 18);
    const p = g.attributes.position;
    // 테두리를 물결치게 (점토 소나무)
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const ang = Math.atan2(z, x);
      const rim = Math.max(0, 0.35 - y) / 0.35;
      const w = 1 + Math.sin(ang * 7 + k) * 0.06 * rim + Math.sin(ang * 3 + k * 2) * 0.03;
      p.setXYZ(i, x * w, y - Math.max(0, Math.sin(ang * 7 + k)) * 0.07 * rim, z * w);
    }
    g.computeVertexNormals();
    pineCache.set(k, g);
    return g;
  }
  // 점토 표면 미세 요철 노멀맵 (캔버스로 생성, 이음새 없이 반복)
  let clayN = null;
  function clayNormal() {
    if (clayN) return clayN;
    const N = 256,
      h = new Float32Array(N * N);
    const rnd = seeded(11);
    const sm = (t) => t * t * (3 - 2 * t);
    const oct = (cell, amp) => {
      const n = N / cell,
        gr = [];
      for (let i = 0; i < n * n; i++) gr.push(rnd());
      const v = (i, j) => gr[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const gx = x / cell,
            gy = y / cell,
            x0 = Math.floor(gx),
            y0 = Math.floor(gy),
            fx = sm(gx - x0),
            fy = sm(gy - y0);
          const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * fx,
            b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * fx;
          h[y * N + x] += (a + (b - a) * fy) * amp;
        }
    };
    oct(32, 1);
    oct(16, 0.55);
    oct(8, 0.3);
    oct(4, 0.12);
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const g = c.getContext("2d");
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const hx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)],
          hy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
        const nx = -hx * 2.4,
          ny = -hy * 2.4,
          l = Math.hypot(nx, ny, 1),
          i = (y * N + x) * 4;
        img.data[i] = (nx / l * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
        img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    clayN = new THREE.CanvasTexture(c);
    clayN.wrapS = clayN.wrapT = THREE.RepeatWrapping;
    clayN.repeat.set(3, 2);
    return clayN;
  }
  /** 도형 여러 개 → 정점색 한 덩어리 (그리기 1번) */
  function bakeList(list) {
    let nv = 0,
      ni = 0;
    const gs = list.map(({ geo, matrix, color }) => {
      const g = geo.index ? geo.clone() : geo.clone();
      if (matrix) g.applyMatrix4(matrix);
      const n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        col[i * 3] = color.r;
        col[i * 3 + 1] = color.g;
        col[i * 3 + 2] = color.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      nv += n;
      ni += g.index ? g.index.count : n;
      return g;
    });
    const pos = new Float32Array(nv * 3),
      nor = new Float32Array(nv * 3),
      col = new Float32Array(nv * 3),
      uv = new Float32Array(nv * 2),
      idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0,
      io = 0;
    for (const g of gs) {
      const cnt = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo * 3);
      nor.set(g.attributes.normal.array, vo * 3);
      col.set(g.attributes.color.array, vo * 3);
      uv.set(g.attributes.uv.array.subarray(0, cnt * 2), vo * 2);
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo;
      else for (let i = 0; i < cnt; i++) idx[io++] = i + vo;
      vo += cnt;
      g.dispose();
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    mg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    mg.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    mg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    mg.setIndex(new THREE.BufferAttribute(idx, 1));
    mg.computeBoundingSphere();
    return mg;
  }

  W3.buildWorld = function () {
    const S = this.scene;
    const hi = this.hi;
    this.daySky = this.skyTex("#5aaef0", "#d8f0ff");
    this.nightSky = this.skyTex("#0f1540", "#3a4a8c");
    S.background = this.daySky;
    S.fog = new THREE.Fog("#cfe9fb", 34, 90);

    // 은은한 주변광(환경광): 하늘·땅 색을 담은 작은 장면을 미리 구워 둠
    const pm = new THREE.PMREMGenerator(this.renderer);
    const es = new THREE.Scene();
    const dg = new THREE.SphereGeometry(10, 32, 16);
    const dc = [];
    const top = new THREE.Color("#bfe2ff"),
      hor = new THREE.Color("#fff6ea"),
      bot = new THREE.Color("#7fb85c");
    const pp = dg.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const y = pp.getY(i) / 10;
      const c = y > 0 ? hor.clone().lerp(top, Math.min(1, y * 1.6)) : hor.clone().lerp(bot, Math.min(1, -y * 3));
      dc.push(c.r, c.g, c.b);
    }
    dg.setAttribute("color", new THREE.Float32BufferAttribute(dc, 3));
    es.add(new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
    const key = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.7, 3.2), side: THREE.DoubleSide }));
    key.position.set(5, 7, 5);
    key.lookAt(0, 0, 0);
    es.add(key);
    this.envTex = pm.fromScene(es, 0.04).texture;
    pm.dispose();
    S.environment = this.envTex;
    S.environmentIntensity = 1.15;

    this.hemi = new THREE.HemisphereLight("#e6f4ff", "#6d9a4c", 0.45);
    S.add(this.hemi);
    const sun = (this.sun = new THREE.DirectionalLight("#fff1d8", 2.4));
    sun.position.set(7, 14, 9);
    sun.target.position.set(0, 0, -1);
    S.add(sun, sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024);
    const sc = sun.shadow.camera;
    sc.left = -19;
    sc.right = 19;
    sc.top = 15;
    sc.bottom = -15;
    sc.near = 1;
    sc.far = 50;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.03;

    const clay = clayNormal();
    // 정적 소품 묶음
    const lit = [],
      glow = [];
    const O = new THREE.Object3D();
    O.rotation.order = "YXZ"; // 기울인 뒤 돌리기
    const C = (c) => new THREE.Color(c);
    const put = (geo, color, pos, scl, rot, list = lit) => {
      O.position.set(pos[0], pos[1], pos[2]);
      if (typeof scl === "number") O.scale.setScalar(scl);
      else O.scale.set(scl[0], scl[1], scl[2]);
      O.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
      O.updateMatrix();
      list.push({ geo, matrix: O.matrix.clone(), color: typeof color === "string" ? C(color) : color });
    };
    const rnd = seeded(7);

    // 땅 (잔디 얼룩 그림 + 점토 요철)
    const gc = document.createElement("canvas");
    gc.width = gc.height = 256;
    const gx = gc.getContext("2d");
    gx.fillStyle = "#a3dc72";
    gx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) {
      gx.fillStyle = ["rgba(120,190,80,.35)", "rgba(160,215,110,.35)", "rgba(100,170,70,.25)"][i % 3];
      gx.beginPath();
      gx.ellipse(rnd() * 256, rnd() * 256, 6 + rnd() * 16, 4 + rnd() * 10, rnd() * 3, 0, 7);
      gx.fill();
    }
    const gt = new THREE.CanvasTexture(gc);
    gt.colorSpace = THREE.SRGBColorSpace;
    gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
    gt.repeat.set(18, 18);
    const gn = clay.clone();
    gn.repeat.set(30, 30);
    gn.needsUpdate = true;
    const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 64), new THREE.MeshStandardMaterial({ map: gt, normalMap: gn, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    S.add(ground);
    this.ground = ground;

    // 구불구불한 흙길 (입구 → 가운데 → 오른쪽 뒤 동물 집)
    const curve = new THREE.CatmullRomCurve3([[-14, 1.6], [-9.4, 1.55], [-6, 1.4], [-3, 0.3], [0, -1.0], [2.6, -2.2], [5.0, -3.0], [6.6, -3.6]].map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const ribbon = (w, y, col) => {
      const N = 90,
        pos = [],
        nor = [],
        uv = [],
        idx = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N,
          p = curve.getPoint(t),
          tg = curve.getTangent(t);
        const nx = -tg.z,
          nz = tg.x;
        const ww = w * (1 + Math.sin(t * 23) * 0.06 + Math.sin(t * 9) * 0.05);
        pos.push(p.x + nx * ww, y, p.z + nz * ww, p.x - nx * ww, y, p.z - nz * ww);
        nor.push(0, 1, 0, 0, 1, 0);
        uv.push(0, t * 12, 1, t * 12);
        if (i < N) {
          const a = i * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      lit.push({ geo: g, color: C(col) });
    };
    ribbon(1.05, 0.02, "#d9bf8a");
    ribbon(0.88, 0.035, "#f2dfb2");
    this.pathCurve = curve;

    // 먼 언덕과 산 (안개로 뿌옇게)
    [[-46, -70, 20, 6], [-18, -74, 24, 7], [12, -72, 22, 6.5], [40, -68, 22, 6], [62, -56, 16, 5], [-62, -54, 16, 5]].forEach(([x, z, r, h], i) =>
      put(blobGeo(i + 1, 0.05, 2), "#9fc9e6", [x, -1, z], [r, h, r * 0.7])
    );
    [[-32, -36, 14, 2.0], [-10, -40, 16, 2.4], [14, -38, 15, 2.2], [34, -34, 13, 1.9], [-46, -18, 10, 1.8], [48, -16, 10, 1.9], [-28, 16, 10, 1.6], [30, 18, 10, 1.7]].forEach(([x, z, r, h], i) =>
      put(blobGeo(i + 3, 0.04, 2), ["#a9df84", "#9ad776", "#b6e692"][i % 3], [x, -0.3, z], [r, h, r * 0.75])
    );

    // 나무
    const pine = (x, z, s) => {
      put(G.cyl, "#7a4e2c", [x, 0.5 * s, z], [0.2 * s, 1 * s, 0.2 * s]);
      const greens = ["#3da25a", "#4cb766", "#5cc673"];
      [[0.7, 1.45, 1.25], [1.55, 1.15, 1.05], [2.3, 0.82, 0.85], [2.95, 0.5, 0.65]].forEach(([y, r, h], j) =>
        put(pineTier((x * 7 + z * 3 + j) | 0), greens[Math.min(2, j)], [x, y * s, z], [r * s, h * s, r * s], [0, rnd() * 6, 0])
      );
    };
    const round = (x, z, s) => {
      put(G.cyl, "#83542f", [x, 0.8 * s, z], [0.22 * s, 1.6 * s, 0.22 * s]);
      const gs = ["#72cc58", "#84d863", "#66c250"];
      [[0, 2.45, 0, 1.05], [-0.65, 1.95, 0.2, 0.8], [0.7, 2.0, -0.1, 0.8], [0.1, 1.9, 0.65, 0.75], [0.15, 2.95, -0.1, 0.65]].forEach(([dx, y, dz, k], j) =>
        put(blobGeo((j + (x | 0)) % 6, 0.08), gs[j % 3], [x + dx * s, y * s, z + dz * s], k * s)
      );
    };
    const trees = [
      [-11.8, -9.6, 1.0, 0], [-7.6, -11, 0.85, 1], [-3.6, -10.2, 0.95, 0], [0.6, -11.2, 0.8, 1], [4.4, -10.4, 0.95, 0], [8.4, -10.8, 0.85, 1], [12.4, -9.2, 1.0, 0],
      [-15, -15, 1.2, 1], [-9, -17, 1.1, 1], [-2, -18, 1.15, 1], [5, -17.5, 1.2, 1], [11, -16.5, 1.1, 1], [17, -13, 1.2, 1],
      [-20, -9, 1.5, 1], [20, -8, 1.5, 1], [-13.5, -5, 1.1, 1], [13.6, -5.8, 1.1, 0], [-14.5, 6.5, 1.0, 0], [14.5, 6, 1.1, 1], [-17, 1, 1.2, 1], [17.5, 1.5, 1.2, 1],
    ];
    trees.forEach(([x, z, s, t]) => (t ? pine(x, z, s) : round(x, z, s)));

    // 울타리 (둥근 통나무)
    const wood = "#c98a4a",
      woodL = "#dba066";
    const post = (x, z) => {
      put(G.cyl, wood, [x, 0.55, z], [0.13, 1.1, 0.13]);
      put(G.sphLo, woodL, [x, 1.12, z], [0.14, 0.09, 0.14]);
    };
    const railX = (x0, x1, z) => [0.42, 0.85].forEach((y) => put(G.cyl, woodL, [(x0 + x1) / 2, y, z], [0.07, x1 - x0, 0.07], [0, 0, Math.PI / 2]));
    const railZ = (z0, z1, x) => [0.42, 0.85].forEach((y) => put(G.cyl, woodL, [x, y, (z0 + z1) / 2], [0.07, z1 - z0, 0.07], [Math.PI / 2, 0, 0]));
    for (let x = -9.4; x <= 9.41; x += 1.175) post(x, -6.3);
    railX(-9.4, 9.4, -6.3);
    for (let z = -5.1; z <= 4.8; z += 1.2) {
      if (z < 0.3 || z > 2.8) post(-9.4, z);
      post(9.4, z);
    }
    railZ(-6.3, 0.25, -9.4);
    railZ(2.85, 4.8, -9.4);
    railZ(-6.3, 4.8, 9.4);

    // 입구 아치 + 간판 기둥
    put(G.cyl, "#b9773a", [-9.4, 1.6, 0.2], [0.2, 3.2, 0.2]);
    put(G.cyl, "#b9773a", [-9.4, 1.6, 2.9], [0.2, 3.2, 0.2]);
    put(G.sphLo, "#ff6f61", [-9.4, 3.3, 0.2], 0.22);
    put(G.sphLo, "#ff6f61", [-9.4, 3.3, 2.9], 0.22);

    // 동물 집 2채 (울타리 안 뒤쪽 모서리)
    const hut = (x, z, roof, wall, ry) => {
      put(G.box, "#c69a6a", [x, 0.08, z], [2.4, 0.16, 2.0], [0, ry, 0]);
      put(G.box, wall, [x, 0.8, z], [2.0, 1.3, 1.6], [0, ry, 0]);
      const fx = Math.sin(ry),
        fz = Math.cos(ry);
      put(G.box, "#6b4226", [x + fx * 0.81, 0.62, z + fz * 0.81], [0.6, 0.9, 0.05], [0, ry, 0]);
      put(G.sphLo, "#6b4226", [x + fx * 0.81, 1.07, z + fz * 0.81], [0.3, 0.3, 0.03], [0, ry, 0]);
      // 지붕: 두 장 + 둥근 용마루
      const rx = Math.cos(ry),
        rz = -Math.sin(ry);
      [1, -1].forEach((sd) => put(G.box, roof, [x + rx * sd * 0.62, 1.78, z + rz * sd * 0.62], [1.45, 0.16, 2.0], [0, ry, -sd * 0.62]));
      put(G.cyl, roof, [x, 2.2, z], [0.13, 2.05, 0.13], [Math.PI / 2, ry, 0]);
      put(G.cyl, "#fff7e6", [x + fx * 0.81, 1.85, z + fz * 0.81], [0.22, 0.04, 0.22], [Math.PI / 2, ry, 0]);
    };
    hut(-6.8, -4.4, "#ff7d8f", "#fff4dc", 0.25);
    hut(6.9, -4.6, "#ffb347", "#fff4dc", -0.35);
    this.obstacles = [
      { x: -6.8, z: -4.4, r: 1.7 },
      { x: 6.9, z: -4.6, r: 1.7 },
    ];

    // 장작 창고 (입구 왼쪽 바깥)
    const shed = (x, z) => {
      put(G.box, "#a8743f", [x, 0.9, z - 0.6], [2.2, 1.8, 0.12]);
      put(G.box, "#a8743f", [x - 1.05, 0.9, z], [0.12, 1.8, 1.3]);
      put(G.box, "#a8743f", [x + 1.05, 0.9, z], [0.12, 1.8, 1.3]);
      [1, -1].forEach((sd) => put(G.box, "#ff8a9a", [x + sd * 0.62, 2.05, z], [1.45, 0.14, 1.6], [0, 0, -sd * 0.55]));
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 4 - (r % 2); c++) {
          const lx = x - 0.72 + c * 0.48 + (r % 2) * 0.24;
          put(G.cyl, "#c8874f", [lx, 0.24 + r * 0.4, z], [0.21, 1.0, 0.21], [Math.PI / 2, 0, 0]);
          put(G.cyl, "#f3d39b", [lx, 0.24 + r * 0.4, z + 0.505], [0.17, 0.01, 0.17], [Math.PI / 2, 0, 0]);
        }
    };
    shed(-12.4, -2.2);

    // 그루터기·버섯·바위·덤불·꽃
    const stump = (x, z, s) => {
      put(G.cyl, "#9b6538", [x, 0.25 * s, z], [0.42 * s, 0.5 * s, 0.42 * s]);
      put(G.cyl, "#f0cf96", [x, 0.505 * s, z], [0.36 * s, 0.01, 0.36 * s]);
    };
    const shroom = (x, z, s) => {
      put(G.cyl, "#fff4e0", [x, 0.15 * s, z], [0.09 * s, 0.3 * s, 0.09 * s]);
      put(G.dome, "#ff5a5f", [x, 0.27 * s, z], [0.25 * s, 0.2 * s, 0.25 * s]);
      [[0.1, 0.4, 0.05], [-0.08, 0.42, -0.08], [0.0, 0.46, 0.12]].forEach(([dx, y, dz]) => put(G.sphLo, "#ffffff", [x + dx * s, y * s, z + dz * s], 0.04 * s));
    };
    const bush = (x, z, s, flowers) => {
      [[0, 0.35, 0, 0.55], [-0.5, 0.25, 0.1, 0.42], [0.5, 0.27, -0.05, 0.45]].forEach(([dx, y, dz, k], j) => put(blobGeo(j + 2, 0.1), ["#62bd52", "#72c95c", "#58b34a"][j], [x + dx * s, y * s, z + dz * s], k * s));
      if (flowers) for (let j = 0; j < 5; j++) put(G.sphLo, ["#ff8fb1", "#ffffff", "#ffd34d"][j % 3], [x + (rnd() - 0.5) * 1.1 * s, (0.45 + rnd() * 0.3) * s, z + (rnd() * 0.5 + 0.1) * s], 0.07 * s);
    };
    [[-11.6, 4.2, 1], [-10.6, -6.8, 1.2], [11, -6.8, 1], [12, 3.2, 1.1], [-3.8, -7, 1.1], [3.2, -7.1, 1]].forEach(([x, z, s]) => stump(x, z, s));
    [[-11.2, 5.2], [-10.8, 5.6], [10.6, -7.4], [11.4, 2.6], [-4.6, -7.4], [12.6, 3.8], [-8.7, -5.6], [8.6, 3.9]].forEach(([x, z], i) => shroom(x, z, 0.9 + (i % 3) * 0.25));
    [[-7.6, -5.6, 1.1, 1], [-2.5, -5.8, 1, 0], [3.2, -5.7, 1.1, 1], [-8.6, 3.9, 1, 1], [8.7, 3.4, 1, 0], [-4.5, 4.4, 0.9, 1], [1.2, 4.6, 0.9, 0], [-12.6, 0.2, 1.2, 1], [-12.4, 3.4, 1.1, 0], [12.4, -2.5, 1.2, 1]].forEach(([x, z, s, f]) => bush(x, z, s, f));
    for (let i = 0; i < 14; i++) {
      const a = rnd() * 6.28,
        x = -13 + rnd() * 26,
        z = -8 + rnd() * 14;
      if (this.inPond(x, z, 1.3)) continue;
      put(blobGeo(i % 5, 0.12, 1), ["#c9ced6", "#b5bcc8"][i % 2], [x, 0.08, z], [0.25 + rnd() * 0.2, 0.18, 0.22 + rnd() * 0.15], [0, a, 0]);
    }
    for (let i = 0; i < 70; i++) {
      const x = -14 + rnd() * 28,
        z = -8.5 + rnd() * 15;
      if (this.inPond(x, z, 1.25) || this.onPath(x, z, 1.2)) continue;
      const col = ["#ff8fb1", "#ffffff", "#ffd34d", "#b38cff", "#ff7a6b"][i % 5];
      put(G.cyl, "#3f9a3c", [x, 0.14, z], [0.025, 0.28, 0.025]);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * 6.28;
        put(G.sphLo, col, [x + Math.cos(a) * 0.08, 0.3, z + Math.sin(a) * 0.08], [0.07, 0.04, 0.07]);
      }
      put(G.sphLo, "#ffcf3f", [x, 0.32, z], 0.04);
    }
    for (let i = 0; i < 130; i++) {
      const x = -15 + rnd() * 30,
        z = -9 + rnd() * 17;
      if (this.inPond(x, z, 1.2) || this.onPath(x, z, 1.1)) continue;
      for (let k = 0; k < 3; k++) put(G.cone, ["#5fb046", "#6dbe50"][k % 2], [x + (k - 1) * 0.07, 0.1, z + (k % 2) * 0.05], [0.04, 0.22 + k * 0.04, 0.04], [0, 0, (k - 1) * 0.3]);
    }

    // 표지판 기둥 (글씨는 따로 그림)
    put(G.cyl, "#8a5a33", [-5.2, 1.2, 3.4], [0.12, 2.4, 0.12]);
    put(G.sphLo, "#8a5a33", [-5.2, 2.42, 3.4], [0.13, 0.08, 0.13]);

    // 전구줄 기둥 + 전구 (늘어진 줄)
    const poles = [[-9.4, -6.3], [-3.2, -6.3], [3.2, -6.3], [9.4, -6.3]];
    poles.forEach(([x, z]) => {
      put(G.cyl, "#8a5a33", [x, 1.7, z], [0.09, 3.4, 0.09]);
    });
    const bulbCols = ["#fff3b0", "#ffd0e0", "#d8f0ff", "#fff3b0"];
    for (let i = 0; i < poles.length - 1; i++) {
      const [x0, z0] = poles[i],
        [x1, z1] = poles[i + 1];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const y = 3.3 - Math.sin(t * Math.PI) * 0.7;
        put(G.cyl, "#4a3b2a", [x0 + (x1 - x0) * t, y + 0.04, z0 + (z1 - z0) * t], [0.012, 0.6, 0.012], [0, 0, Math.PI / 2 - (Math.cos(t * Math.PI) * 0.35)]);
        if (k % 2 === 1) put(G.sphLo, bulbCols[k % 4], [x0 + (x1 - x0) * t, y - 0.12, z0 + (z1 - z0) * t], [0.1, 0.13, 0.1], null, glow);
      }
    }
    // 입구에서 첫 기둥까지
    for (let k = 1; k < 10; k++) {
      const t = k / 10,
        x = -9.4,
        z = 2.9 + (-6.3 - 2.9) * t,
        y = 3.3 - Math.sin(t * Math.PI) * 0.8;
      if (k % 2) put(G.sphLo, bulbCols[k % 4], [x, y - 0.1, z], [0.1, 0.13, 0.1], null, glow);
    }

    // 정적 소품 → 한 덩어리
    this.envMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, normalMap: clay, normalScale: new THREE.Vector2(0.35, 0.35) });
    const envMesh = new THREE.Mesh(bakeList(lit), this.envMat);
    envMesh.castShadow = true;
    envMesh.receiveShadow = true;
    S.add(envMesh);
    this.bulbs = new THREE.Mesh(bakeList(glow), new THREE.MeshBasicMaterial({ vertexColors: true }));
    S.add(this.bulbs);

    // 글씨 판 (입구 간판 + 표지판 화살표) — 한 장의 그림에 모아 그림
    const tc = document.createElement("canvas");
    tc.width = 512;
    tc.height = 512;
    const tx = tc.getContext("2d");
    const board = (y, h, text, col, size) => {
      tx.fillStyle = col;
      tx.fillRect(0, y, 512, h);
      tx.fillStyle = "rgba(0,0,0,.12)";
      for (let i = 0; i < 6; i++) tx.fillRect(0, y + (h / 6) * i + 4, 512, 2);
      tx.strokeStyle = "#7a4a1e";
      tx.lineWidth = 12;
      tx.strokeRect(6, y + 6, 500, h - 12);
      tx.fillStyle = "#fff8e8";
      tx.font = "bold " + size + "px Jua, sans-serif";
      tx.textAlign = "center";
      tx.textBaseline = "middle";
      tx.fillText(text, 256, y + h / 2 + 4);
    };
    board(0, 160, "우리 동물원", "#b9773a", 84);
    board(160, 116, "연못 →", "#a8662f", 64);
    board(276, 116, "← 동물 집", "#a8662f", 64);
    board(392, 120, "간식 ♥", "#a8662f", 64);
    const ttex = new THREE.CanvasTexture(tc);
    ttex.colorSpace = THREE.SRGBColorSpace;
    ttex.anisotropy = 4;
    this.signTex = ttex;
    const plank = (v0, v1, w, h, pos, ry, tilt) => {
      const g = new THREE.BoxGeometry(w, h, 0.14);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (v0 + (1 - uv.getY(i)) * (v1 - v0)));
      const m = new THREE.Mesh(g, this.signMat || (this.signMat = new THREE.MeshStandardMaterial({ map: ttex, roughness: 0.8, normalMap: clay, normalScale: new THREE.Vector2(0.3, 0.3) })));
      m.position.set(pos[0], pos[1], pos[2]);
      m.rotation.set(0, ry, tilt || 0);
      m.castShadow = true;
      S.add(m);
    };
    plank(0, 160 / 512, 3.0, 0.95, [-9.4, 3.0, 1.55], Math.PI / 2);
    plank(160 / 512, 276 / 512, 1.5, 0.42, [-5.2, 2.15, 3.48], 0.5, 0.06);
    plank(276 / 512, 392 / 512, 1.5, 0.42, [-5.2, 1.65, 3.48], -0.35, -0.05);
    plank(392 / 512, 1, 1.5, 0.42, [-5.2, 1.15, 3.48], 0.15, 0.04);
    this.obstacles.push({ x: -5.2, z: 3.4, r: 0.9 });

    // 연못
    const pond = new THREE.Group();
    pond.position.set(POND.x, 0, POND.z);
    const sandG = new THREE.Mesh(G.circ, new THREE.MeshStandardMaterial({ color: "#ead39b", roughness: 0.95, normalMap: clay, normalScale: new THREE.Vector2(0.4, 0.4) }));
    sandG.rotation.x = -Math.PI / 2;
    sandG.position.y = 0.012;
    sandG.scale.set(POND.rx * 1.2, POND.rz * 1.25, 1);
    sandG.receiveShadow = true;
    pond.add(sandG);
    const water = new THREE.Mesh(G.circ, new THREE.MeshStandardMaterial({ color: "#3aa2e6", roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.04;
    water.scale.set(POND.rx, POND.rz, 1);
    water.receiveShadow = true;
    pond.add(water);
    const deep = new THREE.Mesh(G.circ, new THREE.MeshBasicMaterial({ color: "#1f6fb0", transparent: true, opacity: 0.3, depthWrite: false }));
    deep.rotation.x = -Math.PI / 2;
    deep.position.y = 0.045;
    deep.scale.set(POND.rx * 0.62, POND.rz * 0.56, 1);
    pond.add(deep);
    this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false }));
    this.ripple.rotation.x = -Math.PI / 2;
    this.ripple.position.y = 0.05;
    pond.add(this.ripple);
    const pl = [];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const s = 0.2 + ((i * 7) % 4) * 0.05;
      O.position.set(Math.cos(a) * POND.rx * 1.08, s * 0.35, Math.sin(a) * POND.rz * 1.1);
      O.scale.set(s * 1.2, s * 0.7, s);
      O.rotation.set(0, a, 0);
      O.updateMatrix();
      pl.push({ geo: blobGeo(i % 6, 0.12, 1), matrix: O.matrix.clone(), color: C(["#c3c9d4", "#b0b8c6", "#d3d8e0"][i % 3]) });
    }
    [[0.9, -0.4, 0.32], [-1.1, 0.3, 0.26], [0.2, 0.75, 0.22]].forEach(([x, z, s]) => {
      O.position.set(x, 0.06, z);
      O.scale.set(s, 0.03, s);
      O.rotation.set(0, x * 3, 0);
      O.updateMatrix();
      pl.push({ geo: G.cyl, matrix: O.matrix.clone(), color: C("#5fbf4a") });
    });
    O.position.set(-1.1, 0.13, 0.3);
    O.scale.set(0.14, 0.1, 0.14);
    O.updateMatrix();
    pl.push({ geo: G.sphLo, matrix: O.matrix.clone(), color: C("#ff9fc0") });
    // 갈대
    for (let i = 0; i < 9; i++) {
      O.position.set(-POND.rx * 0.95 + (i % 3) * 0.15, 0.45, -POND.rz * 0.6 + Math.floor(i / 3) * 0.18);
      O.scale.set(0.03, 0.9 + (i % 3) * 0.2, 0.03);
      O.rotation.set(0, 0, (i % 3 - 1) * 0.12);
      O.updateMatrix();
      pl.push({ geo: G.cyl, matrix: O.matrix.clone(), color: C("#4f9a3c") });
      if (i % 2 === 0) {
        O.position.y = 0.95 + (i % 3) * 0.1;
        O.scale.set(0.06, 0.2, 0.06);
        O.updateMatrix();
        pl.push({ geo: G.cyl, matrix: O.matrix.clone(), color: C("#8a5a33") });
      }
    }
    const pm2 = new THREE.Mesh(bakeList(pl), this.envMat);
    pm2.castShadow = true;
    pm2.receiveShadow = true;
    pond.add(pm2);
    S.add(pond);

    // 해 (또는 달)
    this.sunBall = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({ color: "#ffd54a", fog: false }));
    this.sunBall.position.set(24, 22, -52);
    this.sunBall.scale.setScalar(3);
    S.add(this.sunBall);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex("rgba(255,236,160,.9)"), fog: false, depthWrite: false, transparent: true }));
    this.glow.position.copy(this.sunBall.position);
    this.glow.scale.setScalar(16);
    S.add(this.glow);
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

    // 점토 구름
    this.clouds = [];
    const cm = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, emissive: "#d6e8f7", emissiveIntensity: 0.45, normalMap: clay, normalScale: new THREE.Vector2(0.3, 0.3), fog: false });
    for (let i = 0; i < 7; i++) {
      const parts = [];
      [[0, 0, 0, 1.7], [1.6, -0.3, 0.3, 1.25], [-1.6, -0.35, 0, 1.15], [0.7, 0.7, -0.2, 1.15], [-0.6, 0.55, 0.3, 1.0]].forEach(([x, y, z, s], j) => {
        O.position.set(x, y, z);
        O.scale.set(s, s * 0.78, s);
        O.rotation.set(0, j, 0);
        O.updateMatrix();
        parts.push({ geo: blobGeo(j + 1, 0.07, 2), matrix: O.matrix.clone(), color: C("#ffffff") });
      });
      const cg = new THREE.Mesh(bakeList(parts), cm);
      cg.position.set(-56 + i * 17, 14 + (i % 3) * 3.5, -34 - (i % 2) * 10);
      cg.userData.v = 0.5 + (i % 3) * 0.3;
      S.add(cg);
      this.clouds.push(cg);
    }

    // 동물 발밑 은은한 접촉 그림자 (실제 그림자와 함께)
    const shC = document.createElement("canvas");
    shC.width = shC.height = 64;
    const shg = shC.getContext("2d");
    const sgr = shg.createRadialGradient(32, 32, 0, 32, 32, 32);
    sgr.addColorStop(0, "rgba(20,50,10,.35)");
    sgr.addColorStop(0.6, "rgba(20,50,10,.12)");
    sgr.addColorStop(1, "rgba(20,50,10,0)");
    shg.fillStyle = sgr;
    shg.fillRect(0, 0, 64, 64);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shC), transparent: true, depthWrite: false });
  };
  W3.onPath = function (x, z, m = 1) {
    if (!this.pathCurve) return false;
    if (!this._pathPts) this._pathPts = this.pathCurve.getSpacedPoints(80);
    for (const p of this._pathPts) if (Math.hypot(p.x - x, p.z - z) < m) return true;
    return false;
  };

  /* ---------- 밤/낮 ---------- */
  W3.setNight = function (n) {
    this.night = n;
    this.scene.background = n ? this.nightSky : this.daySky;
    this.scene.fog.color.set(n ? "#2c3a70" : "#cfe9fb");
    this.scene.environmentIntensity = n ? 0.4 : 1.15;
    this.hemi.intensity = n ? 0.25 : 0.45;
    this.hemi.color.set(n ? "#8fa4ff" : "#e6f4ff");
    this.sun.intensity = n ? 0.8 : 2.4;
    this.sun.color.set(n ? "#b8c8ff" : "#fff1d8");
    this.sunBall.material.color.set(n ? "#fff6c8" : "#ffd54a");
    this.sunBall.scale.setScalar(n ? 2.2 : 3);
    this.stars.visible = n;
    for (const c of this.clouds) c.material.emissiveIntensity = n ? 0.05 : 0.45;
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
    this.cam.el = this.cam.tel = tall ? 0.78 : 0.4;
    const was = this.cam.baseAz;
    this.cam.baseAz = tall ? Math.PI / 2 : 0;
    if (was !== this.cam.baseAz) this.cam.az = this.cam.taz = this.cam.baseAz;
    this.cam.target.set(0, tall ? 0 : 0.9, tall ? -0.4 : -1.0);
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
  /** 동물 하나의 자기 것(합친 모양·그림 재질)만 정리 — 함께 쓰는 모양·재질은 그대로 둠 */
  W3.freeAnimal = function (a) {
    this.scene.remove(a.root);
    a.root.traverse((o) => {
      if (!o.isMesh) return;
      if (o.geometry && (o.geometry.attributes.color || o.userData.ownGeo)) o.geometry.dispose();
      const m = o.material;
      if (m && m.userData && m.userData.pp && !m._gone) {
        m._gone = true;
        if (m.map) m.map.dispose();
        m.dispose();
      }
    });
  };
  W3.clear = function () {
    for (const a of this.animals) this.freeAnimal(a);
    for (const t of this.treats) this.scene.remove(t.obj);
    this.animals = [];
    this.treats = [];
    this.disposeList = [];
  };
  W3.addAnimal = function (item, isNew) {
    const t = this.T[item.tid];
    const colors = readColors(item.svg);
    const B = Builder(colors, KP.zooCleanPaint ? KP.zooCleanPaint(item.paint) : null);
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
    root.traverse((o) => {
      if (o.isMesh && o !== hit) o.castShadow = true;
    });
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
      // 물고기끼리 겹쳐 쌓이지 않게: 여러 자리 중 다른 물고기와 가장 먼 곳
      let best = null,
        bd = -1;
      for (let i = 0; i < 12; i++) {
        const a = U.randf(0, 6.28),
          rr = Math.sqrt(Math.random()) * 0.55;
        const q = { x: POND.x + Math.cos(a) * POND.rx * rr, z: POND.z + Math.sin(a) * POND.rz * rr, y: 0 };
        let d = 1e9;
        for (const o of this.animals) if (o !== self && o.t.move === "swim") d = Math.min(d, Math.hypot(o.tx - q.x, o.tz - q.z), Math.hypot(o.x - q.x, o.z - q.z));
        if (d > bd) {
          bd = d;
          best = q;
        }
      }
      return best;
    }
    let best = null,
      bd = -1;
    for (let i = 0; i < 30; i++) {
      const x = U.randf(PEN.x0, PEN.x1),
        z = U.randf(PEN.z0, PEN.z1);
      if (this.inPond(x, z)) continue;
      if ((this.obstacles || []).some((o) => Math.hypot(o.x - x, o.z - z) < o.r)) continue;
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

  /** 화질 단계: 0 고화질 그림자 · 1 해상도↓ · 2 그림자 끔 · 3 최저 */
  W3.applyQ = function (q) {
    this.q = q;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(dpr, [2, 1.5, 1.25, 1][q]));
    const sh = q < 2;
    if (this.renderer.shadowMap.enabled !== sh) {
      this.renderer.shadowMap.enabled = sh;
      this.sun.castShadow = sh;
      this.scene.traverse((o) => {
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true));
      });
    }
    if (q === 1 && this.sun.shadow.mapSize.x > 1024) {
      this.sun.shadow.mapSize.set(1024, 1024);
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose();
        this.sun.shadow.map = null;
      }
    }
    if (this.w) this.renderer.setSize(this.w, this.h, false); // 새 해상도로 다시 맞춤
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
    }
  };
  W3.tick = function (dt) {
    if (this.lost) return;
    this.measure();
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
  // 간식 재질은 색마다 하나만 만들어 같이 씀 (모양은 G·capsule 캐시 공유) → 치울 때 dispose 안 함
  const treatMats = new Map();
  function treatMat(color, roughness) {
    const k = color + roughness;
    if (!treatMats.has(k)) treatMats.set(k, new THREE.MeshStandardMaterial({ color, roughness }));
    return treatMats.get(k);
  }
  W3.makeTreat = function () {
    const g = new THREE.Group();
    const kind = U.pick(["apple", "carrot", "corn", "apple"]);
    if (kind === "apple") {
      g.add(new THREE.Mesh(G.sph, treatMat("#ff4d5e", 0.35)));
      g.children[0].scale.set(0.32, 0.29, 0.32);
      const s = new THREE.Mesh(G.cyl, treatMat("#6b4226", 0.7));
      s.position.y = 0.32;
      s.scale.set(0.03, 0.14, 0.03);
      g.add(s);
      const l = new THREE.Mesh(G.sphLo, treatMat("#4fae45", 0.7));
      l.position.set(0.09, 0.34, 0);
      l.scale.set(0.11, 0.03, 0.06);
      g.add(l);
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
      const c = new THREE.Mesh(capsule(0.13, 0.55), treatMat("#ffd54a", 0.35));
      c.rotation.z = Math.PI / 2;
      g.add(c);
      const l = new THREE.Mesh(G.sph, treatMat("#7fc95a", 0.7));
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
        lp = setTimeout(() => !moved && this.onDelete && this.onDelete(hit.animal), 1200); // 꾹 → 집에서 쉬기 버튼
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
      if (s > 0 && !this.dead) requestAnimationFrame(shrink);
      else this.freeAnimal(a);
    };
    shrink();
  };
  W3.resetView = function () {
    this.cam.tzoom = 1;
    this.cam.tel = this.w / this.h < 0.8 ? 0.78 : 0.4;
    this.cam.taz = this.cam.baseAz || 0;
  };
})();
