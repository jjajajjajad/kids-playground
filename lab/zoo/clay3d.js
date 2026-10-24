/* =====================================================================
   후보 C — 도톰한 점토 조각 3D (Three.js r170, vendor/three.module.min.js)
   - 도안 부위 모양을 그대로 얕게 돌출(ExtrudeGeometry) + 둥근 모서리(bevel)
   - 앞·뒷면: 아이 그림(색·무늬·크레파스·테두리선)을 도안 좌표 그대로 붙임 (늘어남 없음)
   - 옆면: 그 부위의 대표색 점토
   - 부위는 관절 묶음(어깨·골반·목·꼬리·날개)으로 나눠 움직임. 카메라는 고정 + 살짝 내려다봄
===================================================================== */
import { INK, heartCanvas, hillsCanvas } from "./art.js";
import { U, pose, PROP_COL } from "./sim.js";

const D = Math.PI / 180;
let THREE = null;

/** 조각들의 앞면 깊이(z)와 두께 정하기 — 2D 그리는 순서 = 앞뒤 순서 */
function layout(model, tf) {
  const pcs = model.pieces, rig = model.rig, gap = 0.9;
  for (const pc of pcs) {
    pc.th = pc.kind === "eye" ? 1.2 : pc.kind === "tube" ? Math.max(1.5, pc.sh.sw) : pc.kind === "mini" ? 2.6 * Math.max(0.7, tf) : (rig.thick[pc.p] || 6) * tf;
  }
  pcs.forEach((pc, k) => {
    let f = 0;
    for (let j = 0; j < k; j++) {
      const q = pcs[j];
      if (q.bb.x0 < pc.bb.x1 && pc.bb.x0 < q.bb.x1 && q.bb.y0 < pc.bb.y1 && pc.bb.y0 < q.bb.y1) f = Math.max(f, q.front + gap);
    }
    pc.front = f;
    if (pc.kind === "eye") pc.front = Math.max(f, pc.host.front + 0.5);
  });
  const body = pcs.find((p) => p.p === "body" && p.group === "body") || pcs[0];
  for (const pc of pcs) {
    const gz = model.groups[pc.group] && model.groups[pc.group].z;
    if (gz === "back") pc.front = body.front - body.th * 0.62 + pc.th / 2; // 먼 다리: 몸통 뒤쪽
    else if (gz === "mid") pc.front = body.front - body.th / 2 + pc.th / 2; // 꼬리: 몸통 가운데
  }
  // 전체를 앞뒤 가운데로
  const zs = pcs.map((p) => p.front), zb = pcs.map((p) => p.front - p.th);
  const mid = (Math.max(...zs) + Math.min(...zb)) / 2;
  for (const pc of pcs) pc.front -= mid;
}

function smoothSides(geo, start, count) {
  const pos = geo.attributes.position.array, nor = geo.attributes.normal.array;
  const acc = new Map();
  const key = (i) => Math.round(pos[i * 3] * 200) + "," + Math.round(pos[i * 3 + 1] * 200) + "," + Math.round(pos[i * 3 + 2] * 200);
  for (let i = start; i < start + count; i++) {
    const k = key(i);
    let a = acc.get(k);
    if (!a) acc.set(k, (a = [0, 0, 0]));
    a[0] += nor[i * 3]; a[1] += nor[i * 3 + 1]; a[2] += nor[i * 3 + 2];
  }
  for (let i = start; i < start + count; i++) {
    const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1;
    nor[i * 3] = a[0] / l; nor[i * 3 + 1] = a[1] / l; nor[i * 3 + 2] = a[2] / l;
  }
}
function lin(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}
/** 조각 하나 → 입체 (관절 중심 기준 좌표, y 는 위가 +) */
function pieceGeo(pc, art, pv) {
  const r = art.regs[art.model.pieces.indexOf(pc)];
  const wu = 5 / art.AW, wv = 1 - 5 / art.AH; // 흰 칸
  const rel = (p) => [p[0] - pv[0], -(p[1] - pv[1])];
  if (pc.kind === "tube") {
    const out = [];
    const rad = Math.max(0.8, pc.sh.sw / 2);
    for (const s of pc.sh.rsubs) {
      if (s.pts.length < 2) continue;
      const v3 = s.pts.map((p) => {
        const q = rel(p);
        return new THREE.Vector3(q[0], q[1], pc.front - pc.th / 2);
      });
      const curve = new THREE.CatmullRomCurve3(v3, false, "centripetal");
      out.push(new THREE.TubeGeometry(curve, Math.max(6, s.pts.length * 2), rad, 6, false).toNonIndexed());
      for (const e of [v3[0], v3[v3.length - 1]]) {
        const sp = new THREE.SphereGeometry(rad, 8, 6).toNonIndexed();
        sp.translate(e.x, e.y, e.z);
        out.push(sp);
      }
    }
    const col = lin(INK);
    for (const g of out) {
      g.deleteAttribute("uv");
      const n = g.attributes.position.count;
      const uv = new Float32Array(n * 2), cl = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        uv[i * 2] = wu; uv[i * 2 + 1] = wv;
        cl[i * 3] = col[0]; cl[i * 3 + 1] = col[1]; cl[i * 3 + 2] = col[2];
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    }
    return out;
  }
  const pts = pc.sh.rpts.map(rel);
  if (pts.length < 3) return [];
  const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const bw = pc.bb.x1 - pc.bb.x0, bh = pc.bb.y1 - pc.bb.y0;
  const off = pc.kind === "eye" ? 0.3 : pc.sh.sw / 2; // 앞면 = 모양 + 테두리 바깥 절반
  const bs = Math.min(1.1, Math.min(bw, bh) * 0.1);
  const bt = Math.min(pc.th * 0.38, 2.4);
  const depth = Math.max(0.05, pc.th - 2 * bt);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelOffset: off, bevelSegments: 2, steps: 1, curveSegments: 1 });
  geo.translate(0, 0, pc.front - (depth + bt));
  const pos = geo.attributes.position, n = pos.count;
  const uv = geo.attributes.uv.array, cl = new Float32Array(n * 3);
  const side = lin(pc.side || "#cccccc");
  const caps = geo.groups.find((q) => q.materialIndex === 0) || { start: 0, count: 0 };
  for (let i = 0; i < n; i++) {
    if (i >= caps.start && i < caps.start + caps.count) {
      const X = pos.getX(i) + pv[0], Y = pv[1] - pos.getY(i);
      uv[i * 2] = (r.x + (X - r.ox) * r.s) / art.AW;
      uv[i * 2 + 1] = 1 - (r.y + (Y - r.oy) * r.s) / art.AH;
      cl[i * 3] = cl[i * 3 + 1] = cl[i * 3 + 2] = 1;
    } else {
      uv[i * 2] = wu;
      uv[i * 2 + 1] = wv;
      cl[i * 3] = side[0]; cl[i * 3 + 1] = side[1]; cl[i * 3 + 2] = side[2];
    }
  }
  geo.attributes.uv.needsUpdate = true;
  geo.setAttribute("color", new THREE.BufferAttribute(cl, 3));
  const sides = geo.groups.find((q) => q.materialIndex === 1);
  if (sides) smoothSides(geo, sides.start, sides.count);
  geo.clearGroups();
  return [geo];
}
function merge(geos) {
  const list = geos.filter(Boolean);
  if (!list.length) return null;
  const names = ["position", "normal", "uv", "color"];
  let n = 0;
  for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const nm of names) {
    const sz = nm === "uv" ? 2 : 3, arr = new Float32Array(n * sz);
    let o = 0;
    for (const g of list) {
      const a = g.attributes[nm];
      arr.set(a.array.subarray(0, a.count * sz), o);
      o += a.count * sz;
    }
    out.setAttribute(nm, new THREE.BufferAttribute(arr, sz));
  }
  for (const g of list) g.dispose();
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}
/** 소품 (점토 나무·덤불): 정점색 한 덩어리 */
function colored(g, hex) {
  const ng = g.index ? g.toNonIndexed() : g;
  if (ng !== g) g.dispose();
  const c = lin(hex), n = ng.attributes.position.count, cl = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    cl[i * 3] = c[0]; cl[i * 3 + 1] = c[1]; cl[i * 3 + 2] = c[2];
  }
  ng.setAttribute("color", new THREE.BufferAttribute(cl, 3));
  if (!ng.attributes.uv) ng.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return ng;
}
function propGeo(kind) {
  const L = [];
  const add = (g, hex, x, y, z) => {
    g.translate(x, y, z);
    L.push(colored(g, hex));
  };
  if (kind === "tree") {
    add(new THREE.CylinderGeometry(0.08, 0.11, 1.0, 8), PROP_COL.trunk, 0, 0.5, 0);
    for (const [x, y, r] of [[0, 1.55, 0.55], [-0.42, 1.12, 0.42], [0.42, 1.12, 0.42], [0, 1.0, 0.45]]) add(new THREE.IcosahedronGeometry(r, 2), PROP_COL.leaf, x, y, 0);
  } else if (kind === "pine") {
    add(new THREE.CylinderGeometry(0.07, 0.09, 0.6, 8), PROP_COL.trunk, 0, 0.3, 0);
    for (const [y0, w, h] of [[0.4, 0.62, 0.9], [0.9, 0.48, 0.8], [1.35, 0.32, 0.7]]) add(new THREE.ConeGeometry(w, h, 10), PROP_COL.pine, 0, y0 + h / 2, 0);
  } else for (const [x, y, r] of [[0, 0.36, 0.34], [-0.38, 0.24, 0.26], [0.38, 0.24, 0.26]]) add(new THREE.IcosahedronGeometry(r, 2), PROP_COL.bush, x, y, 0);
  for (const g of L) g.computeVertexNormals();
  return merge(L);
}

export async function createClay(host, opt = {}) {
  THREE = THREE || (await import("../../vendor/three.module.min.js"));
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.domElement.className = "labCanvas";
  host.appendChild(renderer.domElement);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // 아이 그림 색을 그대로 (앞면 밝기 ≈ 1)
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  let lost = false, gone = false;
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    if (!gone && opt.onLost) opt.onLost();
  });

  const scene = new THREE.Scene();
  const own = []; // 이 장면이 만든 자원 (정리용)
  const keep = (x) => (own.push(x), x);
  // 하늘 (세로 그라데이션)
  const skyC = document.createElement("canvas");
  skyC.width = 4;
  skyC.height = 256;
  {
    const g = skyC.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#8fd3ff");
    gr.addColorStop(0.5, "#e4f6ff");
    gr.addColorStop(1, "#e4f6ff");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
  }
  const skyT = keep(new THREE.CanvasTexture(skyC));
  skyT.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyT;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 120);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc6b8, 0.75 * Math.PI) // r155+ 빛 세기는 π 배;
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, 0.72 * Math.PI);
  sun.position.set(-4.5, 10, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(opt.shadowSize || 1024, opt.shadowSize || 1024);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);

  // 땅 + 마당 + 먼 언덕
  const groundM = keep(new THREE.MeshLambertMaterial({ color: 0x86c95e }));
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(140, 70)), groundM);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -12;
  ground.receiveShadow = true;
  scene.add(ground);
  const meadowM = keep(new THREE.MeshLambertMaterial({ color: 0x9dd774 }));
  const meadow = new THREE.Mesh(keep(new THREE.CircleGeometry(1, 48)), meadowM);
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.y = 0.004;
  meadow.receiveShadow = true;
  scene.add(meadow);
  const hillsT = keep(new THREE.CanvasTexture(hillsCanvas()));
  hillsT.colorSpace = THREE.SRGBColorSpace;
  const hills = new THREE.Mesh(keep(new THREE.PlaneGeometry(120, 9)), keep(new THREE.MeshBasicMaterial({ map: hillsT, transparent: true, depthWrite: false })));
  hills.position.set(0, 4.5, -30);
  scene.add(hills);
  // 소품
  const propMat = keep(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  const propGeos = {};
  let propObjs = [];
  // 발밑 접촉 그림자 (동그란 흐림)
  const blobC = document.createElement("canvas");
  blobC.width = blobC.height = 64;
  {
    const g = blobC.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(20,50,10,.42)");
    gr.addColorStop(0.6, "rgba(20,50,10,.16)");
    gr.addColorStop(1, "rgba(20,50,10,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  }
  const blobT = keep(new THREE.CanvasTexture(blobC));
  const blobM = keep(new THREE.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false }));
  const blobG = keep(new THREE.PlaneGeometry(1, 1));
  const heartT = keep(new THREE.CanvasTexture(heartCanvas()));
  heartT.colorSpace = THREE.SRGBColorSpace;
  const heartM = keep(new THREE.SpriteMaterial({ map: heartT, depthTest: false }));

  /* ---- 그림 한 장 → 질감·입체 (같은 그림의 동물끼리 함께 씀) ---- */
  const res = new Map(); // art.key → {tex, mat, groups:{name: geo}, eyes:[{geo, pc}]}
  let tf = opt.thick || 1;
  function artRes(art) {
    let R = res.get(art.key);
    if (R) return R;
    layout(art.model, tf);
    const tex = new THREE.CanvasTexture(art.atlasC);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const mat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
    const groups = {}, eyes = [];
    for (const [name, gr] of Object.entries(art.model.groups)) {
      const list = [];
      for (const pc of art.model.pieces) {
        if (pc.group !== name) continue;
        if (pc.kind === "eye") eyes.push({ pc, geo: merge(pieceGeo(pc, art, [pc.cx, pc.cy])), group: name });
        else list.push(...pieceGeo(pc, art, gr.pivot));
      }
      groups[name] = merge(list);
    }
    R = { tex, mat, groups, eyes, used: 0 };
    res.set(art.key, R);
    return R;
  }
  function freeRes(R) {
    R.tex.dispose();
    R.mat.dispose();
    for (const g of Object.values(R.groups)) g && g.dispose();
    for (const e of R.eyes) e.geo && e.geo.dispose();
  }

  /* ---- 동물 ---- */
  let objs = new Map(); // a.id → {a, obj, poseO, joints, eyes, blob, heart}
  function makeAnimal(a) {
    const art = a.art, R = artRes(art), m = art.model;
    const obj = new THREE.Group();
    const poseO = new THREE.Group();
    obj.add(poseO);
    const joints = {};
    for (const [name, gr] of Object.entries(m.groups)) {
      const j = new THREE.Group();
      const parent = gr.parent ? joints[gr.parent] : null;
      const pp = parent ? m.groups[gr.parent].pivot : m.foot;
      j.position.set(gr.pivot[0] - pp[0], -(gr.pivot[1] - pp[1]), 0);
      (parent || poseO).add(j);
      joints[name] = j;
      if (R.groups[name]) {
        const mesh = new THREE.Mesh(R.groups[name], R.mat);
        mesh.castShadow = true;
        mesh.userData.a = a;
        j.add(mesh);
      }
    }
    const eyes = [];
    for (const e of R.eyes) {
      if (!e.geo) continue;
      const pv = m.groups[e.group].pivot;
      const mesh = new THREE.Mesh(e.geo, R.mat);
      mesh.position.set(e.pc.cx - pv[0], -(e.pc.cy - pv[1]), 0);
      mesh.userData.a = a;
      joints[e.group].add(mesh);
      eyes.push(mesh);
    }
    scene.add(obj);
    const blob = new THREE.Mesh(blobG, blobM);
    blob.rotation.x = -Math.PI / 2;
    const bw = (m.bbox.x1 - m.bbox.x0) * U * a.size;
    blob.scale.set(bw * (a.fly ? 0.5 : 0.85), bw * (a.fly ? 0.22 : 0.32), 1);
    scene.add(blob);
    const heart = new THREE.Sprite(heartM);
    heart.visible = false;
    scene.add(heart);
    R.used++;
    return { a, obj, poseO, joints, eyes, blob, heart, R };
  }
  function dropAnimal(o) {
    scene.remove(o.obj, o.blob, o.heart);
    o.R.used--;
  }

  let W = 1, H = 1;
  const stat = { calls: 0, tris: 0, ms: 0, geos: 0, texs: 0 };
  const ray = new THREE.Raycaster();
  return {
    kind: "clay",
    canvas: renderer.domElement,
    _scene: scene,
    get lost() {
      return lost;
    },
    setThick(v) {
      if (v === tf) return;
      tf = v;
      // 모양 다시 만들기
      const list = [...objs.values()].map((o) => o.a);
      for (const o of objs.values()) dropAnimal(o);
      objs.clear();
      for (const R of res.values()) freeRes(R);
      res.clear();
      this.setAnimals(list);
    },
    setShadows(on) {
      renderer.shadowMap.enabled = !!on;
      sun.castShadow = !!on;
      scene.traverse((o) => o.material && (o.material.needsUpdate = true));
    },
    setAnimals(list) {
      const want = new Set(list.map((a) => a.id));
      for (const [id, o] of objs) if (!want.has(id) || o.a !== list.find((a) => a.id === id)) {
        dropAnimal(o);
        objs.delete(id);
      }
      for (const a of list) if (!objs.has(a.id)) objs.set(a.id, makeAnimal(a));
      // 더 이상 안 쓰는 그림 자원은 바로 정리 (iPad 메모리)
      for (const [k, R] of res) if (R.used <= 0) {
        freeRes(R);
        res.delete(k);
      }
    },
    setProps(props, bounds) {
      for (const o of propObjs) scene.remove(o);
      propObjs = props.map((p) => {
        const g = propGeos[p.kind] || (propGeos[p.kind] = keep(propGeo(p.kind)));
        const m = new THREE.Mesh(g, propMat);
        m.position.set(p.x, 0, p.z);
        m.scale.setScalar(p.s);
        m.castShadow = true;
        scene.add(m);
        return m;
      });
      const cx = (bounds.x0 + bounds.x1) / 2, cz = (bounds.z0 + bounds.z1) / 2;
      meadow.position.set(cx, 0.004, cz);
      meadow.scale.set((bounds.x1 - bounds.x0) / 2 + 1.2, (bounds.z1 - bounds.z0) / 2 + 0.9, 1);
      const S = Math.max(bounds.x1 - bounds.x0, bounds.z1 - bounds.z0) / 2 + 3;
      const sc = sun.shadow.camera;
      sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S;
      sc.near = 1; sc.far = 40;
      sc.updateProjectionMatrix();
      sun.target.position.set(cx, 0, cz);
      sun.position.set(cx - 4.5, 10, cz + 8);
    },
    resize(w, h, ratio) {
      W = Math.max(1, w);
      H = Math.max(1, h);
      renderer.setPixelRatio(ratio);
      renderer.setSize(W, H);
    },
    render(list, t, cam) {
      if (lost) return;
      const t0 = performance.now();
      camera.fov = cam.fov;
      camera.aspect = W / H;
      camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
      camera.lookAt(cam.target[0], cam.target[1], cam.target[2]);
      camera.updateProjectionMatrix();
      for (const a of list) {
        const o = objs.get(a.id);
        if (!o) continue;
        const ps = pose(a, t), m = a.art.model;
        const s = U * a.size;
        o.obj.position.set(a.x, a.y, a.z);
        o.obj.rotation.y = ps.root.ry * D;
        o.obj.scale.set(s * ps.root.mirror, s, s);
        o.poseO.position.y = ps.root.y;
        o.poseO.rotation.z = -ps.root.rz * D;
        o.poseO.scale.set(ps.root.sx, ps.root.sy, (ps.root.sx + ps.root.sy) / 2);
        for (const [name, gr] of Object.entries(m.groups)) {
          if (!gr.parent) continue;
          const j = o.joints[name], q = ps.g[name];
          j.rotation.z = q && q.rz ? -q.rz * D : 0;
          j.rotation.y = q && q.ry ? (gr.flap ? 1 : -1) * q.ry * D : 0;
          j.scale.set((q && q.sx) || 1, (q && q.sy) || 1, 1);
        }
        for (const e of o.eyes) e.scale.y = ps.eye;
        o.blob.position.set(a.x, 0.01, a.z);
        if (a.heart >= 0) {
          const h = a.heart;
          o.heart.visible = true;
          const top = (m.foot[1] - m.bbox.y0) * s;
          o.heart.position.set(a.x + Math.sin(h * 6) * 0.08, a.y + top + 0.25 + h * 0.5, a.z);
          const k = 0.42 * (0.6 + Math.min(1, h * 3) * 0.4);
          o.heart.scale.set(k, k, 1);
          heartM.opacity = Math.max(0, 1 - Math.max(0, h - 0.8) / 0.6);
        } else o.heart.visible = false;
      }
      renderer.render(scene, camera);
      const inf = renderer.info;
      stat.calls = inf.render.calls;
      stat.tris = inf.render.triangles;
      stat.geos = inf.memory.geometries;
      stat.texs = inf.memory.textures;
      stat.ms = performance.now() - t0;
    },
    hit(x, y) {
      const v = new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1);
      ray.setFromCamera(v, camera);
      const hits = ray.intersectObjects([...objs.values()].map((o) => o.obj), true);
      return hits.length ? hits[0].object.userData.a || null : null;
    },
    stats() {
      return { ...stat };
    },
    dispose() {
      gone = true;
      for (const o of objs.values()) dropAnimal(o);
      objs.clear();
      for (const R of res.values()) freeRes(R);
      res.clear();
      for (const o of propObjs) scene.remove(o);
      for (const x of own) x && x.dispose && x.dispose();
      scene.clear();
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch (e) {}
      renderer.domElement.remove();
    },
  };
}
