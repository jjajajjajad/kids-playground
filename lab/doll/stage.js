/* =====================================================================
   3D 화면 — 점토 배경 그림 위를 칠한 강아지 인형들이 걸어 다님
   - 배경 그림·카메라·걷는 영역: lab/zoo/bgs.js 를 그대로 읽어 씀 (그 파일은 고치지 않음)
   - 배경 그림은 CSS 배경으로(그리기 비용 0), 3D 는 투명 캔버스 위에
   - 강아지 = 모델 하나(정점 3.7천·삼각형 7.4천)를 모두 같이 쓰고, 마리마다 재질(그림 텍스처 + 움직임 값)만 다름
   - 뼈대 없음: 굽기에서 만든 부위 가중치(팔·다리·귀·머리·꼬리)로 정점 셰이더에서 절차적 움직임
===================================================================== */
import { BGS, bgCam, inPoly } from "../zoo/bgs.js";
import { faceCanvas } from "./bake.js";

let THREE;
const DOG_H = 1.6; // 세상 단위 키
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export async function createStage(host, model, B, opt = {}) {
  THREE = THREE || (await import("../../vendor/three.module.min.js"));
  const low = !!opt.low;
  const renderer = new THREE.WebGLRenderer({ antialias: !low, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "c3d";
  const bgEl = document.createElement("div");
  bgEl.className = "bg3d";
  host.appendChild(bgEl);
  host.appendChild(renderer.domElement);
  const fxEl = document.createElement("div");
  fxEl.className = "fx3d";
  host.appendChild(fxEl);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
  const hemi = new THREE.HemisphereLight(0xeef6ff, 0xd8cfb8, 0.6 * Math.PI);
  const sun = new THREE.DirectionalLight(0xfff3e0, 0.5 * Math.PI);
  scene.add(hemi, sun, sun.target);

  /* ---- 함께 쓰는 모양 ---- */
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(model.POSITION, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(model.NORMAL, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(B.uv, 2));
  const nv = model.POSITION.length / 3;
  const ao = new Float32Array(nv), front = new Float32Array(nv);
  for (let v = 0; v < nv; v++) {
    ao[v] = (model._AO ? model._AO[v] : 255) / 255;
    const nz = model.NORMAL[v * 3 + 2];
    // 얼굴 덧칠은 머리 앞쪽만 (뒤통수에 눈이 비치지 않게)
    front[v] = B.part[v] === 1 ? clamp((nz - 0.05) / 0.3, 0, 1) : 0;
  }
  geo.setAttribute("aAO", new THREE.BufferAttribute(ao, 1));
  geo.setAttribute("aFront", new THREE.BufferAttribute(front, 1));
  geo.setAttribute("aWA", new THREE.BufferAttribute(B.weights.A, 4));
  geo.setAttribute("aWB", new THREE.BufferAttribute(B.weights.B, 4));
  geo.setIndex(new THREE.BufferAttribute(model.index, 1));
  geo.computeBoundingSphere();
  geo.boundingSphere.radius *= 1.3; // 움직임 여유

  const faceT = new THREE.CanvasTexture(faceCanvas(B.spec));
  faceT.colorSpace = THREE.SRGBColorSpace;
  faceT.anisotropy = 4;
  // 점토 결 (아주 약한 울퉁불퉁)
  const grainC = document.createElement("canvas");
  grainC.width = grainC.height = 128;
  {
    const g = grainC.getContext("2d"), im = g.createImageData(128, 128);
    let s = 99;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const base = new Float32Array(32 * 32).map(() => rnd());
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) {
        // 32칸 값 부드럽게 늘이기 + 잔결
        const fx = x / 4, fy = y / 4, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
        const at = (a, b) => base[(b & 31) * 32 + (a & 31)];
        const v = (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
        const c = Math.round(110 + v * 90 + (rnd() - 0.5) * 20);
        const i = (y * 128 + x) * 4;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = c;
        im.data[i + 3] = 255;
      }
    g.putImageData(im, 0, 0);
  }
  const grainT = new THREE.CanvasTexture(grainC);
  grainT.wrapS = grainT.wrapT = THREE.RepeatWrapping;
  grainT.repeat.set(5, 5);

  const P = B.spec.pivot;
  function makeMat(tex) {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, bumpMap: grainT, bumpScale: 0.35 });
    const U = {
      uPh: { value: 0 }, uAmp: { value: 0 }, uEar: { value: 0 }, uHead: { value: new THREE.Vector2() }, uTail: { value: 0 }, uArmUp: { value: 0 },
      uFace: { value: faceT }, uAOk: { value: 0.6 },
    };
    m.userData.U = U;
    m.customProgramCacheKey = () => "doll1";
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      const v3 = (a) => `vec3(${a.map((n) => n.toFixed(4)).join(",")})`;
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uPh, uAmp, uEar, uTail, uArmUp; uniform vec2 uHead;
attribute vec4 aWA; attribute vec4 aWB; attribute float aAO; attribute float aFront;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `vec3 dP = position; vec3 dN = normal;
{
  float s = sin(uPh);
  vec3 sh = ${v3(P.arm)}, shL = sh * vec3(-1.,1.,1.);
  mat3 RaR = rZ(uArmUp) * rX(-s * 0.55 * uAmp);
  mat3 RaL = rZ(-uArmUp) * rX(s * 0.55 * uAmp);
  mat3 ReR = rZ(uEar), ReL = rZ(-uEar);
  vec3 ep = ${v3(P.ear)}, epL = ep * vec3(-1.,1.,1.);
  mat3 Rt = rY(uTail);
  vec3 tp = ${v3(P.tail)};
  float lift = 1.0 - clamp(position.y / 0.2, 0.0, 1.0);
  vec3 dLR = vec3(0., max(0., s) * 0.045, s * 0.06) * uAmp * lift;
  vec3 dLL = vec3(0., max(0., -s) * 0.045, -s * 0.06) * uAmp * lift;
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
  vec3 nk = ${v3(P.head)};
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
uniform sampler2D uFace; uniform float uAOk;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail;`
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
  // 옆면일수록 흐린 밉맵 → 정면 투영의 늘어진 줄무늬를 부드럽게
  vec4 sampledDiffuseColor = texture2D( map, vMapUv, max(max(max(0.0, vSide - 0.35) * 4.0, vBack * 2.2), vTail * 5.0) );
  vec4 fc = texture2D( uFace, vMapUv );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, fc.rgb, fc.a * vFront );
  diffuseColor *= sampledDiffuseColor;
#endif
  float aoF = mix(1.0, smoothstep(0.0, 0.85, vAO), uAOk);
  diffuseColor.rgb *= aoF;`
        );
    };
    return m;
  }

  /* ---- 그림자: 발밑 접촉 + 햇빛 반대쪽으로 길게 (흐린 원판 두 장, 저렴) ---- */
  const blobC = document.createElement("canvas");
  blobC.width = blobC.height = 64;
  {
    const g = blobC.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(0.5, "rgba(0,0,0,.55)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  }
  const blobT = new THREE.CanvasTexture(blobC);
  const contactM = new THREE.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false, color: 0x1d3a12, opacity: 0.42 });
  const castM = new THREE.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false, color: 0x1d3a12, opacity: 0.2 });
  const planeG = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

  /* ---- 강아지들 ---- */
  const dogs = [];
  let textures = []; // [THREE.Texture]
  let cam = null, bgDef = null, W = 1, H = 1;
  const fake = (d) => ({ art: { model: { bbox: { x0: -38.7, x1: 38.7, y0: -100 }, foot: [0, 0] } }, size: d.size, fly: false });

  function makeTex(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = low ? 1 : 4;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }
  function setPaintings(canvases) {
    for (const t of textures) t.dispose();
    textures = canvases.map(makeTex);
    dogs.forEach((d, i) => { d.mat.map = textures[i % textures.length]; d.mat.needsUpdate = true; });
  }
  function addDog(i) {
    const mat = makeMat(textures[i % textures.length]);
    const mesh = new THREE.Mesh(geo, mat);
    const contact = new THREE.Mesh(planeG, contactM), cast = new THREE.Mesh(planeG, castM);
    contact.renderOrder = cast.renderOrder = -1;
    scene.add(contact, cast, mesh);
    const d = { mesh, mat, contact, cast, x: 0, z: -5, tx: 0, tz: -5, yaw: 0, ph: Math.random() * 6, amp: 0, mode: "idle", t: Math.random() * 2, sq: 0, sqv: 0, happy: 0, hop: 0, seed: Math.random() * 100, size: DOG_H };
    dogs.push(d);
    return d;
  }
  function setCount(n) {
    while (dogs.length > n) {
      const d = dogs.pop();
      scene.remove(d.mesh, d.contact, d.cast);
      d.mat.dispose();
    }
    while (dogs.length < n) addDog(dogs.length);
    placeAll();
  }
  function placeAll() {
    if (!cam) return;
    // 좁은 화면(폰 세로)은 배경이 잘려 동물이 작아지므로 덜 줄임
    for (const d of dogs) d.size = DOG_H * Math.min(1, cam.scale * 1.55);
    const list = dogs.map((d) => Object.assign(fake(d), { ref: d }));
    cam.bounds.place(list);
    for (const a of list) { if (a.x != null) { a.ref.x = a.x; a.ref.z = a.z; } a.ref.mode = "idle"; a.ref.t = Math.random() * 1.5; }
  }

  /* ---- 배경 ---- */
  function setBg(id) {
    bgDef = BGS[id] || BGS.A;
    bgEl.style.backgroundImage = `url("../zoo/${bgDef.file}")`;
    // 빛 맞추기: 배경의 햇빛 방향·색
    const s = bgDef.sun;
    sun.position.set(s[0] * 10, s[1] * 10, s[2] * 10);
    sun.color.set(bgDef.sunCol || "#fff3e0");
    bgTint(bgDef);
    resize(true);
  }
  /* 배경 그림의 하늘·풀밭 평균색 → 하늘빛(위)·땅 반사빛(아래) 색. 아이 그림 색이 너무 변하지 않게 흰색 쪽으로 많이 섞음 */
  const tintCache = {};
  function bgTint(def) {
    const apply = (t) => {
      if (closeup || bgDef !== def) return;
      hemi.color.setRGB(...t.sky.map((v) => (v / 255) * 0.35 + 0.65), THREE.SRGBColorSpace);
      hemi.groundColor.setRGB(...t.grass.map((v, k) => (v / 255) * 0.4 + [0.85, 0.8, 0.7][k] * 0.6), THREE.SRGBColorSpace);
    };
    if (tintCache[def.file]) return apply(tintCache[def.file]);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 64; c.height = 36;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, 64, 36);
      const d = g.getImageData(0, 0, 64, 36).data, sky = [0, 0, 0, 0], grass = [0, 0, 0, 0];
      for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4, u = (x + 0.5) / 64, v = (y + 0.5) / 36;
        const a = inPoly(def.poly, u, v) ? grass : v < 0.12 ? sky : null;
        if (a) { a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; a[3]++; }
      }
      const av = (a, f) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : f);
      tintCache[def.file] = { sky: av(sky, [170, 210, 240]), grass: av(grass, [120, 180, 90]) };
      apply(tintCache[def.file]);
    };
    img.src = "../zoo/" + def.file;
  }
  function resize(force) {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (!force && w === W && h === H) return;
    W = w; H = h;
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = W + "px";
    renderer.domElement.style.height = H + "px";
    if (closeup) return applyCloseup();
    if (!bgDef) return;
    cam = bgCam(bgDef, W, H);
    camera.fov = cam.fov;
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.target);
    camera.aspect = cam.view.fw / cam.view.fh;
    camera.setViewOffset(cam.view.fw, cam.view.fh, cam.view.ox, cam.view.oy, W, H);
    camera.updateProjectionMatrix();
    bgEl.style.backgroundSize = `${cam.view.fw}px ${cam.view.fh}px`;
    bgEl.style.backgroundPosition = `${-cam.view.ox}px ${-cam.view.oy}px`;
    placeAll();
  }

  /* ---- 확대 보기 (그림 보존 확인용): 한 마리를 정면/옆/뒤/3/4 에서 ---- */
  let closeup = null;
  function setCloseup(v) {
    closeup = v; // null | {yaw}
    bgEl.classList.toggle("plain", !!v);
    if (v) applyCloseup();
    else resize(true);
  }
  // 정면 직교 카메라: 도안과 똑같은 틀 (그림이 같은 자리에 오는지 겹쳐 보기용, 화면은 정사각형으로)
  const sp0 = B.spec;
  const ortho = new THREE.OrthographicCamera(-sp0.CX / sp0.K, (B.S - sp0.CX) / sp0.K, sp0.OY / sp0.K, (sp0.OY - B.S) / sp0.K, 0.1, 20);
  ortho.position.set(0, 0, 5);
  function applyCloseup() {
    camera.clearViewOffset();
    camera.fov = 30;
    camera.aspect = W / H;
    const dist = (1.2) / (2 * Math.tan((15 * Math.PI) / 180)) / Math.min(1, W / H);
    camera.position.set(0, 0.6, dist);
    camera.lookAt(0, 0.5, 0);
    camera.updateProjectionMatrix();
    sun.position.set(-4, 9, 7);
    sun.color.set("#fff3e0");
    hemi.color.set(0xeef6ff);
    hemi.groundColor.set(0xd8cfb8);
  }

  /* ---- 누르기: 스쿼시 + 하트 + 멍 ---- */
  const v3 = new THREE.Vector3();
  function project(x, y, z) {
    v3.set(x, y, z).project(camera);
    return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H, v3.z];
  }
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const r = renderer.domElement.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bz = 9;
    for (const d of dogs) {
      const s = d.mesh.scale.x;
      const top = project(d.mesh.position.x, d.mesh.position.y + s * 1.02, d.mesh.position.z);
      const bot = project(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z);
      const hw = (bot[1] - top[1]) * 0.42;
      if (px > bot[0] - hw && px < bot[0] + hw && py > top[1] && py < bot[1] && bot[2] < bz) { best = d; bz = bot[2]; }
    }
    if (!best) return;
    poke(best);
  });
  function poke(d) {
    d.sqv = 7;
    d.happy = 1;
    d.hop = 0.0001;
    const t = project(d.mesh.position.x, d.mesh.position.y + d.mesh.scale.y * 1.05, d.mesh.position.z);
    const h = document.createElement("div");
    h.className = "heart";
    h.textContent = "♥";
    h.style.left = t[0] + "px";
    h.style.top = t[1] + "px";
    fxEl.appendChild(h);
    setTimeout(() => h.remove(), 1200);
    bark();
  }
  let ac = null;
  function bark() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t0 = ac.currentTime;
      for (const [dt, f0] of [[0, 620], [0.2, 560]]) {
        const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
        o.type = "sawtooth";
        lp.type = "lowpass";
        lp.frequency.value = 1500;
        o.frequency.setValueAtTime(f0, t0 + dt);
        o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t0 + dt + 0.13);
        g.gain.setValueAtTime(0.0001, t0 + dt);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + dt + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.15);
        o.connect(lp).connect(g).connect(ac.destination);
        o.start(t0 + dt);
        o.stop(t0 + dt + 0.17);
      }
    } catch (e) { /* 소리 없음 */ }
  }

  /* ---- 걷기 ---- */
  function pickTarget(d) {
    const a = fake(d);
    let best = null, bs = -1e9;
    for (let k = 0; k < 8; k++) {
      const g = cam.bounds.pick(a);
      if (!g) continue;
      const dx = g[0] - d.x, dz = g[1] - d.z, dist = Math.hypot(dx, dz);
      if (dist < 0.4) continue;
      // 정면~3/4 위주: 멀어지는(−z) 방향은 덜 고름, 너무 먼 곳도 덜
      const score = (dz >= 0 ? 1 : 1 + (dz / (Math.abs(dx) + 0.01)) * 0.8) - dist * 0.08 + Math.random() * 0.3;
      if (score > bs) { bs = score; best = g; }
    }
    return best;
  }
  function step(d, dt, time) {
    const U = d.mat.userData.U;
    if (closeup) {
      d.mesh.position.set(0, 0, 0);
      d.mesh.rotation.set(0, closeup.yaw || 0, 0);
      d.contact.visible = d.cast.visible = false;
      const walk = closeup.walk ? 1 : 0;
      d.ph += dt * 8 * walk;
      U.uPh.value = d.ph;
      U.uAmp.value = walk;
      U.uEar.value = walk * 0.14 * Math.sin(d.ph * 2 - 0.7);
      U.uHead.value.set(walk * Math.sin(d.ph) * 0.05, 0);
      U.uTail.value = Math.sin(time * 12) * 0.4;
      U.uArmUp.value = 0;
      d.mesh.scale.setScalar(1);
      return;
    }
    d.contact.visible = d.cast.visible = true;
    d.t -= dt;
    if (d.mode === "idle") {
      d.amp = Math.max(0, d.amp - dt * 3);
      if (d.t <= 0 && cam) {
        const g = pickTarget(d);
        if (g) { d.tx = g[0]; d.tz = g[1]; d.mode = "walk"; d.t = 12; }
        else d.t = 1;
      }
    } else {
      const dx = d.tx - d.x, dz = d.tz - d.z, dist = Math.hypot(dx, dz);
      const sp = 0.5 * (d.size / DOG_H) * (d.happy > 0.2 ? 1.4 : 1);
      if (dist < 0.05 || d.t <= 0) { d.mode = "idle"; d.t = 0.8 + Math.random() * 2.2; }
      else {
        const nx = d.x + (dx / dist) * sp * dt, nz = d.z + (dz / dist) * sp * dt;
        if (cam.bounds.inside(fake(d), nx, nz)) { d.x = nx; d.z = nz; } else { d.mode = "idle"; d.t = 0.5; }
        // 보는 방향: 가는 쪽, 단 정면~3/4 (±41°) 안으로 — 옆걸음처럼 보여도 얼굴(그림)이 보이게
        const want = clamp(Math.atan2(dx, dz), -0.72, 0.72);
        d.yaw += (want - d.yaw) * Math.min(1, dt * 5);
        d.amp = Math.min(1, d.amp + dt * 4);
      }
    }
    if (d.mode === "idle") d.yaw += (Math.sin(time * 0.4 + d.seed) * 0.25 - d.yaw) * Math.min(1, dt * 1.5);
    d.ph += dt * (7.5 + d.happy * 3) * Math.max(0.15, d.amp);
    // 눌림 (스프링)
    d.sqv += (-d.sq * 90 - d.sqv * 9) * dt;
    d.sq += d.sqv * dt;
    d.happy = Math.max(0, d.happy - dt * 0.5);
    if (d.hop > 0) { d.hop += dt; if (d.hop > 0.5) d.hop = 0; }
    const s = d.size;
    const bob = Math.abs(Math.sin(d.ph)) * 0.035 * d.amp + (d.hop > 0 ? Math.sin((d.hop / 0.5) * Math.PI) * 0.18 : 0);
    const sq = clamp(d.sq * 0.06, -0.2, 0.2);
    d.mesh.position.set(d.x, bob * s, d.z);
    d.mesh.rotation.set(0, d.yaw, Math.sin(d.ph) * 0.07 * d.amp, "YXZ");
    d.mesh.scale.set(s * (1 + sq * 0.6), s * (1 - sq), s * (1 + sq * 0.6));
    U.uPh.value = d.ph;
    U.uAmp.value = d.amp;
    U.uEar.value = 0.05 + d.amp * 0.14 * Math.sin(d.ph * 2 - 0.7) + d.happy * 0.25 * Math.sin(time * 16) + Math.sin(time * 1.3 + d.seed) * 0.03;
    U.uHead.value.set(Math.sin(d.ph) * 0.05 * d.amp + Math.sin(time * 0.9 + d.seed) * 0.05 * (1 - d.amp), d.happy * 0.25 * Math.sin(time * 5));
    U.uTail.value = Math.sin(time * (8 + d.happy * 10) + d.seed) * (0.35 + d.happy * 0.25);
    U.uArmUp.value = d.happy * 0.9;
    // 그림자
    const sr = 0.62 * s;
    d.contact.position.set(d.x, 0.003, d.z + 0.02 * s);
    d.contact.scale.set(sr * (1 - bob * 1.5), 1, sr * 0.55 * (1 - bob * 1.5));
    const sv = sun.position, sl = Math.hypot(sv.x, sv.z) || 1, k = clamp(1.6 / Math.max(0.3, sv.y / sl), 0.6, 2.4) * 0.5 * s;
    d.cast.position.set(d.x - (sv.x / sl) * k * 0.55, 0.002, d.z - (sv.z / sl) * k * 0.55);
    d.cast.rotation.y = Math.atan2(-sv.x, -sv.z);
    d.cast.scale.set(sr * 0.95, 1, sr * 0.6 + k);
  }

  /* ---- 그리기 + fps ---- */
  let last = performance.now(), running = false, raf = 0, fpsAcc = 0, fpsN = 0, fps = 0, time = 0;
  const onFps = opt.onFps || (() => {});
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    resize(false);
    // 멀리 있는 강아지부터 (반투명 그림자 순서)
    for (const d of dogs) step(d, dt, time);
    renderer.render(scene, closeup && closeup.ortho ? ortho : camera);
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 0.5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; onFps(fps, renderer.info.render); }
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function setLight(hemiI, sunI) { hemi.intensity = hemiI * Math.PI; sun.intensity = sunI * Math.PI; }
  setLight(0.62, 0.5);
  return {
    setBg, setCount, setPaintings, setCloseup, start, stop, poke, setLight, renderer, dogs, get fps() { return fps; },
    /** 한 장 그리고 멈춘 상태 (스크린샷용) */
    renderOnce(t = 0.016) { for (const d of dogs) step(d, t, time += t); renderer.render(scene, closeup && closeup.ortho ? ortho : camera); },
    hemi, sun,
    _proj(x, z) { const d = dogs.find((q) => q.x === x && q.z === z) || dogs[0]; const r = renderer.domElement.getBoundingClientRect(); const p = project(d.mesh.position.x, d.mesh.position.y + d.mesh.scale.y * 0.45, d.mesh.position.z); return [r.left + p[0], r.top + p[1]]; },
  };
}
