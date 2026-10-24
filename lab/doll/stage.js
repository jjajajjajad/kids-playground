/* =====================================================================
   3D 화면 — 점토 배경 그림 위를 칠한 인형들(8종 섞여)이 걸어 다님
   - 배경 그림·카메라·걷는 영역: lab/zoo/bgs.js 를 그대로 읽어 씀 (그 파일은 고치지 않음)
   - 배경 그림은 CSS 배경으로(그리기 비용 0), 3D 는 투명 캔버스 위에
   - 종마다 모델(정점 약 3.7~4천) 하나를 같은 종 인형들이 같이 씀. 인형마다 재질(그림 텍스처 + 움직임 값)만 다름
   - 뼈대 없음: 굽기에서 만든 부위 가중치(팔·다리·귀·머리·꼬리/코)로 정점 셰이더에서 절차적 움직임
     움직임 중심점·축은 uniform 이라 셰이더 프로그램은 8종이 하나를 같이 씀
   - 종별 움직임 차이: species.js 의 move (걸음 빠르기·흔들림·토끼 깡충·코끼리 귀 펄럭·코 흔들기·공룡 꼬리)
   - 서로 겹치지 않게: 목표 고를 때·걸을 때 다른 인형과 간격(두 인형 폭의 평균) 유지
===================================================================== */
import { BGS, bgCam, inPoly } from "../zoo/bgs.js";
import { faceCanvas } from "./bake.js";
import { P } from "./species.js";
import { playVoice } from "./sound.js";

let THREE;
const DOLL_H = 1.6; // 세상 단위 키 (종의 move.size 를 곱함)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export async function createStage(host, opt = {}) {
  THREE = THREE || (await import("../../vendor/three.module.min.js"));
  const low = !!opt.low;
  const renderer = new THREE.WebGLRenderer({ antialias: !low, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opt.keep });
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

  /* ---- 종(모양) 등록: 같은 종 인형들이 모양·얼굴 텍스처를 같이 씀 ---- */
  const kinds = {};
  function addKind(id, model, B) {
    if (kinds[id]) return kinds[id];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(model.POSITION, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(model.NORMAL, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(B.uv, 2));
    const nv = model.POSITION.length / 3;
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
    const faceT = new THREE.CanvasTexture(faceCanvas(B.spec));
    faceT.colorSpace = THREE.SRGBColorSpace;
    faceT.anisotropy = 4;
    const sp = B.spec;
    const k = { id, geo, B, spec: sp, faceT, w: x1 - x0, mv: sp.move };
    kinds[id] = k;
    return k;
  }

  /* ---- 재질: 그림 텍스처 + 절차적 움직임 (모든 종이 같은 셰이더) ---- */
  const v3u = (a) => new THREE.Vector3(...a);
  function setKindUniforms(U, k) {
    const p = k.spec.pivot, m = k.mv;
    U.uArmP.value.set(...p.arm);
    U.uEarP.value.set(...p.ear);
    U.uHeadP.value.set(...p.head);
    U.uTailP.value.set(...p.tail);
    U.uLegH.value = p.leg || 0.2;
    U.uEarAx.value.set(...m.earAx).normalize();
    U.uTailAx.value.set(...m.tailAx).normalize();
    U.uLeg.value.set(m.legLift, m.legStep);
    U.uArmSw.value = m.armSwing;
    U.uTailBlur.value = k.spec.swing ? 0 : k.spec.merge && k.spec.merge.tail ? 5 : 2;
    U.uFace.value = k.faceT;
  }
  function makeMat(tex, k) {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, bumpMap: grainT, bumpScale: 0.35 });
    const U = {
      uPh: { value: 0 }, uAmp: { value: 0 }, uEar: { value: 0 }, uHead: { value: new THREE.Vector2() }, uTail: { value: 0 }, uArmUp: { value: 0 },
      uFace: { value: null }, uAOk: { value: 0.6 },
      uArmP: { value: v3u([0, 0, 0]) }, uEarP: { value: v3u([0, 0, 0]) }, uHeadP: { value: v3u([0, 0, 0]) }, uTailP: { value: v3u([0, 0, 0]) },
      uEarAx: { value: v3u([0, 0, 1]) }, uTailAx: { value: v3u([0, 1, 0]) }, uLegH: { value: 0.2 }, uLeg: { value: new THREE.Vector2() },
      uArmSw: { value: 0.55 }, uTailBlur: { value: 5 },
    };
    m.userData.U = U;
    setKindUniforms(U, k);
    m.customProgramCacheKey = () => "doll8";
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
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
  // 귀: 오른쪽은 축 a 로 +각, 왼쪽은 거울(축 x 뒤집고 -각)
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
  // 옆면일수록 흐린 밉맵 → 정면 투영의 늘어진 줄무늬를 부드럽게
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

  /* ---- 인형들 ---- */
  const dolls = [];
  let items = []; // [{kind, tex}]
  let cam = null, bgDef = null, W = 1, H = 1;
  // bgs.js 의 걷는 영역 계산이 쓰는 모양 (폭: 종마다)
  const fake = (d) => ({ art: { model: { bbox: { x0: -d.k.w * 50, x1: d.k.w * 50, y0: -100 }, foot: [0, 0] } }, size: d.size, fly: false });

  function makeTex(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = low ? 1 : 4;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }
  function assign(d, i) {
    const it = items[i % items.length];
    const k = kinds[it.kind];
    d.k = k;
    d.mesh.geometry = k.geo;
    d.mat.map = it.tex;
    setKindUniforms(d.mat.userData.U, k);
    d.mat.needsUpdate = true;
    d.size = DOLL_H * k.mv.size * (cam ? Math.min(1, cam.scale * 1.55) : 1);
  }
  /** list: [{kind:'cat', canvas}] — 인형 i 는 list[i % 길이] 를 입음 (0번 = 아이 그림) */
  function setPaintings(list) {
    for (const it of items) it.tex.dispose();
    items = list.map((it) => ({ kind: it.kind, tex: makeTex(it.canvas) }));
    dolls.forEach((d, i) => assign(d, i));
  }
  function addDoll(i) {
    const it = items[i % items.length];
    const mat = makeMat(it.tex, kinds[it.kind]);
    const mesh = new THREE.Mesh(kinds[it.kind].geo, mat);
    const contact = new THREE.Mesh(planeG, contactM), cast = new THREE.Mesh(planeG, castM);
    contact.renderOrder = cast.renderOrder = -1;
    scene.add(contact, cast, mesh);
    const d = { mesh, mat, contact, cast, x: 0, z: -5, tx: 0, tz: -5, yaw: 0, ph: Math.random() * 6, amp: 0, mode: "idle", t: Math.random() * 2, sq: 0, sqv: 0, happy: 0, hop: 0, seed: Math.random() * 100, size: DOLL_H, k: null };
    dolls.push(d);
    assign(d, i);
    return d;
  }
  function setCount(n) {
    while (dolls.length > n) {
      const d = dolls.pop();
      scene.remove(d.mesh, d.contact, d.cast);
      d.mat.dispose();
    }
    while (dolls.length < n) addDoll(dolls.length);
    placeAll();
  }
  function placeAll() {
    if (!cam) return;
    // 좁은 화면(폰 세로)은 배경이 잘려 동물이 작아지므로 덜 줄임
    for (const d of dolls) d.size = DOLL_H * d.k.mv.size * Math.min(1, cam.scale * 1.55);
    const list = dolls.map((d) => Object.assign(fake(d), { ref: d }));
    cam.bounds.place(list);
    for (const a of list) { if (a.x != null) { a.ref.x = a.ref.tx = a.x; a.ref.z = a.ref.tz = a.z; } a.ref.mode = "idle"; a.ref.t = Math.random() * 1.5; }
  }

  /* ---- 배경 ---- */
  function setBg(id) {
    bgDef = BGS[id] || BGS.A;
    bgEl.style.backgroundImage = `url("../zoo/${bgDef.file}")`;
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
    closeup = v; // null | {yaw, walk, ortho}
    bgEl.classList.toggle("plain", !!v);
    if (v) applyCloseup();
    else resize(true);
  }
  // 정면 직교 카메라: 도안과 똑같은 틀 (그림이 같은 자리에 오는지 겹쳐 보기용, 화면은 정사각형으로) — 0번 인형의 종 기준
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  ortho.position.set(0, 0, 5);
  function fitOrtho() {
    const sp = dolls[0] ? dolls[0].k.spec : null;
    if (!sp) return;
    const S = 1024;
    ortho.left = -sp.CX / sp.K; ortho.right = (S - sp.CX) / sp.K; ortho.top = sp.OY / sp.K; ortho.bottom = (sp.OY - S) / sp.K;
    ortho.updateProjectionMatrix();
  }
  function applyCloseup() {
    camera.clearViewOffset();
    camera.fov = 30;
    camera.aspect = W / H;
    const dist = 1.2 / (2 * Math.tan((15 * Math.PI) / 180)) / Math.min(1, W / H);
    camera.position.set(0, 0.6, dist);
    camera.lookAt(0, 0.5, 0);
    camera.updateProjectionMatrix();
    fitOrtho();
    sun.position.set(-4, 9, 7);
    sun.color.set("#fff3e0");
    hemi.color.set(0xeef6ff);
    hemi.groundColor.set(0xd8cfb8);
  }

  /* ---- 누르기: 스쿼시 + 하트 + 종별 소리 ---- */
  const v3 = new THREE.Vector3();
  function project(x, y, z) {
    v3.set(x, y, z).project(camera);
    return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H, v3.z];
  }
  renderer.domElement.addEventListener("pointerdown", (e) => {
    const r = renderer.domElement.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bz = 9;
    for (const d of dolls) {
      const s = d.mesh.scale.x;
      const top = project(d.mesh.position.x, d.mesh.position.y + s * 1.02, d.mesh.position.z);
      const bot = project(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z);
      const hw = (bot[1] - top[1]) * d.k.w * 0.55;
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
    playVoice(d.k.spec.sound);
  }

  /* ---- 걷기 + 간격 ---- */
  // 두 인형 사이 최소 거리 (세상 좌표): 두 폭의 평균. 앞뒤(z)는 화면에서 짧아 보이므로 조금 더 넓게
  const gap = (a, b) => ((a.k.w * a.size + b.k.w * b.size) / 2) * 1.05;
  const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, (az - bz) * 0.8);
  function crowded(d, x, z, useTargets) {
    for (const o of dolls) {
      if (o === d) continue;
      const g = gap(d, o);
      if (dist2(x, z, o.x, o.z) < g) return true;
      if (useTargets && o.mode === "walk" && dist2(x, z, o.tx, o.tz) < g) return true;
    }
    return false;
  }
  function pickTarget(d) {
    const a = fake(d);
    let best = null, bs = -1e9;
    for (let k = 0; k < 10; k++) {
      const g = cam.bounds.pick(a);
      if (!g) continue;
      const dx = g[0] - d.x, dz = g[1] - d.z, dist = Math.hypot(dx, dz);
      if (dist < 0.4) continue;
      if (crowded(d, g[0], g[1], true)) continue;
      // 정면~3/4 위주: 멀어지는(−z) 방향은 덜 고름, 너무 먼 곳도 덜
      const score = (dz >= 0 ? 1 : 1 + (dz / (Math.abs(dx) + 0.01)) * 0.8) - dist * 0.08 + Math.random() * 0.3;
      if (score > bs) { bs = score; best = g; }
    }
    return best;
  }
  function step(d, dt, time) {
    const U = d.mat.userData.U, M = d.k.mv;
    if (closeup) {
      d.mesh.position.set(0, 0, 0);
      d.mesh.rotation.set(0, closeup.yaw || 0, 0);
      d.contact.visible = d.cast.visible = false;
      const walk = closeup.walk ? 1 : 0;
      d.ph += dt * M.gait * walk;
      U.uPh.value = d.ph;
      U.uAmp.value = walk;
      U.uEar.value = walk * M.ear * Math.sin(d.ph * 2 - 0.7);
      U.uHead.value.set(walk * Math.sin(d.ph) * 0.05, 0);
      U.uTail.value = walk * Math.sin(time * M.tailRate) * M.tail;
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
        else d.t = 0.6 + Math.random();
      }
    } else {
      const dx = d.tx - d.x, dz = d.tz - d.z, dist = Math.hypot(dx, dz);
      const sp = M.speed * (d.size / DOLL_H) * (d.happy > 0.2 ? 1.4 : 1);
      if (dist < 0.05 || d.t <= 0) { d.mode = "idle"; d.t = 0.8 + Math.random() * 2.2; }
      else {
        const nx = d.x + (dx / dist) * sp * dt, nz = d.z + (dz / dist) * sp * dt;
        // 다른 인형에 너무 가까워지면 멈추고 다른 곳으로
        let block = false;
        for (const o of dolls) {
          if (o === d) continue;
          const g = gap(d, o), now = dist2(d.x, d.z, o.x, o.z), next = dist2(nx, nz, o.x, o.z);
          if (next < g && next < now) { block = true; break; }
        }
        if (block) { d.mode = "idle"; d.t = 0.3 + Math.random() * 0.6; }
        else if (cam.bounds.inside(fake(d), nx, nz)) { d.x = nx; d.z = nz; }
        else { d.mode = "idle"; d.t = 0.5; }
        // 보는 방향: 가는 쪽, 단 정면~3/4 (±41°) 안으로 — 옆걸음처럼 보여도 얼굴(그림)이 보이게
        const want = clamp(Math.atan2(dx, dz), -0.72, 0.72);
        d.yaw += (want - d.yaw) * Math.min(1, dt * 5);
        d.amp = Math.min(1, d.amp + dt * 4);
      }
    }
    if (d.mode === "idle") d.yaw += (Math.sin(time * 0.4 + d.seed) * 0.25 - d.yaw) * Math.min(1, dt * 1.5);
    d.ph += dt * (M.gait + d.happy * 3) * Math.max(0.15, d.amp);
    // 눌림 (스프링)
    d.sqv += (-d.sq * 90 - d.sqv * 9) * dt;
    d.sq += d.sqv * dt;
    d.happy = Math.max(0, d.happy - dt * 0.5);
    if (d.hop > 0) { d.hop += dt; if (d.hop > 0.5) d.hop = 0; }
    const s = d.size;
    // 걸음 출렁임 + (토끼) 깡충: 반주기마다 위로 튀고 착지 때 살짝 눌림
    const hopPh = Math.max(0, Math.sin(d.ph));
    const bob = Math.abs(Math.sin(d.ph)) * M.bob * d.amp + M.hop * Math.pow(hopPh, 0.8) * d.amp + (d.hop > 0 ? Math.sin((d.hop / 0.5) * Math.PI) * 0.18 : 0);
    const land = M.hop ? Math.max(0, -Math.sin(d.ph)) * 0.08 * d.amp : 0;
    const sq = clamp(d.sq * 0.06 + land, -0.2, 0.2);
    d.mesh.position.set(d.x, bob * s, d.z);
    d.mesh.rotation.set(M.hop ? -0.12 * hopPh * d.amp : 0, d.yaw, Math.sin(d.ph) * M.roll * d.amp, "YXZ");
    d.mesh.scale.set(s * (1 + sq * 0.6), s * (1 - sq), s * (1 + sq * 0.6));
    U.uPh.value = d.ph;
    U.uAmp.value = d.amp;
    U.uEar.value = M.earBase + d.amp * M.ear * Math.sin(d.ph * 2 - 0.7) + d.happy * M.earHappy * Math.sin(time * 16) + Math.sin(time * 1.3 + d.seed) * 0.03 * (M.ear > 0 ? 1 : 0);
    U.uHead.value.set(Math.sin(d.ph) * 0.05 * d.amp + Math.sin(time * 0.9 + d.seed) * 0.05 * (1 - d.amp), d.happy * 0.25 * Math.sin(time * 5));
    U.uTail.value = Math.sin(time * (M.tailRate + d.happy * 10) + d.seed) * (M.tail + d.happy * 0.25);
    U.uArmUp.value = d.happy * 0.9;
    // 그림자
    const sr = 0.62 * s * clamp(d.k.w / 0.77, 0.8, 1.3);
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
    for (const d of dolls) step(d, dt, time);
    renderer.render(scene, closeup && closeup.ortho ? ortho : camera);
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 0.5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; onFps(fps, renderer.info.render); }
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function setLight(hemiI, sunI) { hemi.intensity = hemiI * Math.PI; sun.intensity = sunI * Math.PI; }
  setLight(0.62, 0.5);
  return {
    addKind, setBg, setCount, resize: () => resize(true), setPaintings, setCloseup, start, stop, poke, setLight, renderer, dolls, dogs: dolls, kinds,
    get fps() { return fps; },
    /** 한 장 그리고 멈춘 상태 (스크린샷용) */
    renderOnce(t = 0.016) { for (const d of dolls) step(d, t, time += t); renderer.render(scene, closeup && closeup.ortho ? ortho : camera); },
    hemi, sun,
    /** 점검용: 인형 i 의 몸 가운데 화면 좌표 */
    _proj(i = 0) { const d = dolls[i]; const r = renderer.domElement.getBoundingClientRect(); const p = project(d.mesh.position.x, d.mesh.position.y + d.mesh.scale.y * 0.45, d.mesh.position.z); return [r.left + p[0], r.top + p[1]]; },
    /** 점검용: 가장 가까운 두 인형 거리 / 필요한 간격 (1 보다 작으면 겹침) */
    _minGap() { let m = 9; for (let i = 0; i < dolls.length; i++) for (let j = i + 1; j < dolls.length; j++) m = Math.min(m, dist2(dolls[i].x, dolls[i].z, dolls[j].x, dolls[j].z) / gap(dolls[i], dolls[j])); return m; },
  };
}
