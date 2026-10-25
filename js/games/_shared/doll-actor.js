/* =====================================================================
   🧸 인형 배우 (공용) — 아이가 칠한 3D 점토 인형(doll.js)을 놀이의 주인공으로
   - 동물원(zoo3d.js)과 같이 쓰는 것: 종 모양(kind) · 인형 재질(셰이더: 그림 + 얼굴 덧칠 + 부위 가중치 움직임) · 절차적 자세(pose)
     → 동물원 동작이 바뀌지 않게, 새로 넣은 움직임 값(팔 앞으로·한 팔 들기·고개 숙이기·부위 볼록/오목·부위 물들이기)은 0 이면 예전과 똑같음
   - 놀이용 배우(create): 칠한 인형(KP.db art, kind:"zoo", tid:"doll") 하나 또는 기본 색 인형 → 무대(clay-stage)에 세움
       act.place(x,z,키) · act.walkTo(x,z) · act.mood("sick"|"pain"|"happy"|"sleep"|"normal") · act.sick(0~1)
       act.react(부위) · act.poke(부위,세기) · act.bump(부위,세기) · act.glow(부위,색,세기) · act.happy() · act.hop() · act.wave(초) · act.hug(켜기)
       act.anchor(부위) → 화면 {x,y} (도구가 닿는 판정·스티커 따라가기) · act.box() · act.hit(x,y) → 가장 가까운 부위
       act.play = {fR,fL,uR,uL,nod,tilt,sway,bob} — 놀이가 매 장면 정하는 덧붙임 자세(악기 연주 등, 0 이면 그대로)
     부위: forehead·headTop·eyeR·eyeL·cheekR·cheekL·nose·mouth·chest·belly·handR·handL·armR·armL·kneeR·kneeL
   - 3D 가 안 되면 create2D: 정면 그림(thumb) 한 장으로 같은 이름의 함수들(움직임은 CSS)
===================================================================== */
"use strict";
(function () {
  const U = KP.u;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const T3 = () => KP.clayStage.THREE;
  const DA = (KP.dollActor = {});

  /* ================================================================
     1) 동물원과 같이 쓰는 것
  ================================================================ */
  /** 인형 종 등록: 같은 종 인형들이 모양·얼굴 텍스처를 같이 씀 (zoo3d 의 addKind 를 그대로 옮김) */
  DA.kind = function (id, model, B, hi) {
    const THREE = T3();
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
    const faceT = new THREE.CanvasTexture(KP.DOLL.faceCanvas(B.spec, hi ? 1024 : 512));
    faceT.colorSpace = THREE.SRGBColorSpace;
    faceT.anisotropy = 4;
    return { id, geo, B, spec: B.spec, faceT, w: x1 - x0, mv: B.spec.move, model };
  };

  /** 인형 재질: 그림 텍스처 + 절차적 움직임 (모든 종이 같은 셰이더 하나) — zoo3d 의 dollMat 를 옮기고 움직임 값을 더함 */
  DA.material = function (tex, k, grainT) {
    const THREE = T3();
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0, bumpMap: grainT, bumpScale: 0.35 });
    const v3 = (a) => new THREE.Vector3(...a);
    const p = k.spec.pivot, mv = k.mv;
    const Uf = {
      uPh: { value: 0 }, uAmp: { value: 0 }, uEar: { value: 0 }, uHead: { value: new THREE.Vector2() }, uTail: { value: 0 }, uArmUp: { value: 0 },
      uFace: { value: k.faceT }, uAOk: { value: 0.6 },
      uArmP: { value: v3(p.arm) }, uEarP: { value: v3(p.ear) }, uHeadP: { value: v3(p.head) }, uTailP: { value: v3(p.tail) },
      uEarAx: { value: v3(mv.earAx).normalize() }, uTailAx: { value: v3(mv.tailAx).normalize() }, uLegH: { value: p.leg || 0.2 },
      uLeg: { value: new THREE.Vector2(mv.legLift, mv.legStep) }, uArmSw: { value: mv.armSwing },
      uTailBlur: { value: k.spec.swing ? 0 : k.spec.merge && k.spec.merge.tail ? 5 : 2 },
      // 놀이용 움직임 (0 이면 동물원과 똑같음)
      uArmFwd: { value: 0 }, uArmR: { value: 0 }, uHeadDn: { value: 0 },
      uArmB: { value: new THREE.Vector2() }, uArmL: { value: 0 }, // 팔 하나씩: 앞으로(오른쪽, 왼쪽) · 왼팔 들기 (연주 동작)
      uPk0: { value: new THREE.Vector4(0, 0, 0, 1) }, uPk0K: { value: 0 }, uPk1: { value: new THREE.Vector4(0, 0, 0, 1) }, uPk1K: { value: 0 },
      uGlow: { value: new THREE.Vector4(0, 0, 0, 1) }, uGlowC: { value: new THREE.Vector4(0, 0, 0, 0) },
    };
    m.userData.U = Uf;
    m.customProgramCacheKey = () => "doll10";
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, Uf);
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
uniform float uPh, uAmp, uEar, uTail, uArmUp, uLegH, uArmSw, uArmFwd, uArmR, uArmL, uHeadDn, uPk0K, uPk1K; uniform vec2 uHead, uLeg, uArmB;
uniform vec3 uArmP, uEarP, uHeadP, uTailP, uEarAx, uTailAx; uniform vec4 uPk0, uPk1;
attribute vec4 aWA; attribute vec4 aWB; attribute float aAO; attribute float aFront;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail; varying vec3 vP0;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
mat3 rA(vec3 a, float t){float c=cos(t),s=sin(t),C=1.-c;return mat3(
  c+a.x*a.x*C, a.y*a.x*C+a.z*s, a.z*a.x*C-a.y*s,
  a.x*a.y*C-a.z*s, c+a.y*a.y*C, a.z*a.y*C+a.x*s,
  a.x*a.z*C+a.y*s, a.y*a.z*C-a.x*s, c+a.z*a.z*C);}
float pkF(vec3 p, vec4 c){float d=1.0-smoothstep(0.0, c.w, distance(p, c.xyz)); return d*d*(3.0-2.0*d);}`
        )
        .replace(
          "#include <beginnormal_vertex>",
          `vec3 dP = position; vec3 dN = normal;
{
  float s = sin(uPh);
  vec3 sh = uArmP, shL = sh * vec3(-1.,1.,1.);
  mat3 RaR = rZ(uArmUp + uArmR) * rX(-s * uArmSw * uAmp - uArmFwd - uArmB.x);
  mat3 RaL = rZ(-uArmUp - uArmL) * rX(s * uArmSw * uAmp - uArmFwd - uArmB.y);
  mat3 ReR = rA(uEarAx, uEar), ReL = rA(uEarAx * vec3(-1.,1.,1.), -uEar);
  vec3 ep = uEarP, epL = ep * vec3(-1.,1.,1.);
  mat3 Rt = rA(uTailAx, uTail);
  vec3 tp = uTailP;
  float lift = 1.0 - clamp(position.y / uLegH, 0.0, 1.0);
  vec3 dLR = vec3(0., max(0., s) * uLeg.x, s * uLeg.y) * uAmp * lift;
  vec3 dLL = vec3(0., max(0., -s) * uLeg.x, -s * uLeg.y) * uAmp * lift;
  vec3 p0 = position + normal * (uPk0K * pkF(position, uPk0) + uPk1K * pkF(position, uPk1));
  dP = p0
    + aWA.x * (RaR * (p0 - sh) + sh - p0) + aWA.y * (RaL * (p0 - shL) + shL - p0)
    + aWA.z * dLR + aWA.w * dLL
    + aWB.x * (ReR * (p0 - ep) + ep - p0) + aWB.y * (ReL * (p0 - epL) + epL - p0)
    + aWB.w * (Rt * (p0 - tp) + tp - p0);
  dN = normal
    + aWA.x * (RaR * normal - normal) + aWA.y * (RaL * normal - normal)
    + aWB.x * (ReR * normal - normal) + aWB.y * (ReL * normal - normal) + aWB.w * (Rt * normal - normal);
  mat3 Rh = rY(uHead.y) * rZ(uHead.x) * rX(uHeadDn);
  vec3 nk = uHeadP;
  dP = mix(dP, Rh * (dP - nk) + nk, aWB.z);
  dN = normalize(mix(dN, Rh * dN, aWB.z));
}
vAO = aAO; vFront = aFront; vSide = 1.0 - abs(normal.z); vBack = smoothstep(0.15, 0.6, -normal.z); vTail = aWB.w; vP0 = position;
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
uniform sampler2D uFace; uniform float uAOk; uniform float uTailBlur; uniform vec4 uGlow, uGlowC;
varying float vAO; varying float vFront; varying float vSide; varying float vBack; varying float vTail; varying vec3 vP0;`
        )
        .replace(
          "#include <map_fragment>",
          `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv, max(max(max(0.0, vSide - 0.35) * 4.0, vBack * 2.2), vTail * uTailBlur) );
  vec4 fc = texture2D( uFace, vMapUv );
  sampledDiffuseColor.rgb = mix( sampledDiffuseColor.rgb, fc.rgb, fc.a * vFront );
  diffuseColor *= sampledDiffuseColor;
#endif
  diffuseColor.rgb = mix( diffuseColor.rgb, uGlowC.rgb, uGlowC.a * ( 1.0 - smoothstep( 0.0, uGlow.w, distance( vP0, uGlow.xyz ) ) ) );
  float aoF = mix(1.0, smoothstep(0.0, 0.85, vAO), uAOk);
  diffuseColor.rgb *= aoF;`
        );
    };
    return m;
  };

  /** 인형 자세 한 장면 (zoo3d 의 place 에서 인형 부분을 그대로 옮김)
      a: {x,z,tx,tz,state,look,yaw,seed,ph,sq,sqv,happy,hop,amp,M(움직임 값),size,root,mat} → a.bobY */
  DA.pose = function (a, dt, t) {
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
  };

  /* ================================================================
     2) 표정 · 기본 색 · 부위 기준점
  ================================================================ */
  /** 얼굴 덧칠 그림 (기분별): normal 그대로 · sick 걱정 눈썹 · pain 질끈 감은 눈 · happy 웃는 눈 · sleep 감은 눈 (+볼 빨강) */
  DA.faceCanvas = function (spec, size, mood, blush) {
    const D = KP.DOLL, c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    g.scale(size / 1024, size / 1024);
    D.drawFace(g, spec, "3d");
    const F = spec.face, X = (x) => spec.CX + x * spec.K, Y = (y) => spec.OY - y * spec.K, L = (l) => l * spec.K;
    const ink = "#1d1714";
    g.lineCap = g.lineJoin = "round";
    if (mood === "pain" || mood === "happy" || mood === "sleep") {
      // 눈 지우고 다시 그림
      g.save();
      g.globalCompositeOperation = "destination-out";
      for (const [x, y] of F.eyes) {
        g.beginPath();
        g.ellipse(X(x), Y(y), L(F.eyeR[0]) * 1.5, L(F.eyeR[1]) * 1.5, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
      g.strokeStyle = ink;
      g.lineWidth = Math.max(5, L(F.eyeR[1]) * 0.55);
      for (const [x, y] of F.eyes) {
        const ex = X(x), ey = Y(y), rx = L(F.eyeR[0]) * 1.15, ry = L(F.eyeR[1]) * 0.9, sd = x < 0 ? -1 : 1;
        g.beginPath();
        if (mood === "happy") {
          // ∩ 웃는 눈
          g.moveTo(ex - rx, ey + ry * 0.4);
          g.quadraticCurveTo(ex, ey - ry * 1.4, ex + rx, ey + ry * 0.4);
        } else if (mood === "sleep") {
          // ∪ 감은 눈
          g.moveTo(ex - rx, ey - ry * 0.2);
          g.quadraticCurveTo(ex, ey + ry * 1.1, ex + rx, ey - ry * 0.2);
        } else {
          // > < 질끈
          g.moveTo(ex - sd * rx, ey - ry);
          g.lineTo(ex + sd * rx * 0.6, ey);
          g.lineTo(ex - sd * rx, ey + ry);
        }
        g.stroke();
      }
    }
    if (mood === "sick" || mood === "pain") {
      // 걱정 눈썹: 안쪽 끝이 올라감
      g.strokeStyle = "#3b2a25";
      g.lineWidth = Math.max(5, L(F.eyeR[1]) * 0.5);
      for (const [x, y] of F.eyes) {
        const sd = x < 0 ? -1 : 1, ex = X(x), ey = Y(y) - L(F.eyeR[1]) * 2.6, w = L(F.eyeR[0]) * 1.5;
        g.beginPath();
        g.moveTo(ex - sd * w, ey - L(0.012));
        g.lineTo(ex + sd * w * 0.7, ey + L(0.012));
        g.stroke();
      }
    }
    if (blush || mood === "happy") {
      g.fillStyle = blush === "fever" ? "rgba(255,70,70,.45)" : "rgba(255,120,150,.38)";
      for (const [x, y] of F.eyes) {
        g.beginPath();
        g.ellipse(X(x * 1.18), Y(y - 0.055), L(F.eyeR[0]) * 1.9, L(F.eyeR[1]) * 1.2, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    return c;
  };

  // 기본 색 인형 (칠한 인형이 없을 때): [몸, 특징(귀·주둥이·갈기·뿔·꼬리)]
  const BASE_COL = {
    dog: ["#f2c98a", "#b97c4b"], cat: ["#ffbf7a", "#f59a4a"], bear: ["#c99266", "#f3dcc0"], rabbit: ["#ffd6e4", "#ff9fbf"],
    pig: ["#ffbfd0", "#ff8fab"], lion: ["#ffd36b", "#e48c3c"], elephant: ["#a9c4ea", "#86a9dc"], dino: ["#9fdf8f", "#ffc94d"],
  };
  DA.BASE_COL = BASE_COL;
  const texCache = {};
  /** 기본 색 텍스처 (종마다 한 번) — 부위별 색 + 실루엣 밖 번지기 (칠한 그림과 같은 방식) */
  DA.defaultTex = function (B, sp) {
    if (texCache[sp]) return texCache[sp];
    const D = KP.DOLL, P = D.P, S = B.S, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d"), im = g.createImageData(S, S), d = new Uint32Array(im.data.buffer);
    const col = BASE_COL[sp] || ["#f6d7a7", "#e8a87c"];
    const v32 = (h) => {
      const n = parseInt(h.slice(1), 16);
      return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
    };
    const a = v32(col[0]), b = v32(col[1]);
    const acc = new Set([P.earR, P.earL, P.snout, P.mane, P.spike, P.tail]);
    for (let i = 0; i < S * S; i++) if (B.label[i]) d[i] = acc.has(B.label[i]) ? b : a;
    const bl = D.bleedOf(B);
    for (let i = 0; i < S * S; i++) if (!B.label[i] && bl[i] >= 0) d[i] = d[bl[i]];
    g.putImageData(im, 0, 0);
    const o = document.createElement("canvas");
    o.width = o.height = 512;
    const og = o.getContext("2d");
    og.imageSmoothingQuality = "high";
    og.drawImage(c, 0, 0, 512, 512);
    return (texCache[sp] = o);
  };

  /** 부위 기준점 (모델 좌표, 키 1) — 종마다 한 번. 겉면 z 는 모델 점에서 찾음 → 도구가 몸 앞에 닿는 자리 */
  DA.anchorsOf = function (k) {
    if (k.anc) return k.anc;
    const D = KP.DOLL, P = D.P, B = k.B, spec = B.spec, F = spec.face, pv = spec.pivot;
    const pos = k.model.POSITION, part = B.part, nv = pos.length / 3;
    const HEAD = [P.head, P.snout, P.mane, P.earR, P.earL];
    const front = (x, y, parts, r = 0.035) => {
      for (const rr of [r, r * 2, r * 4]) {
        let best = -9;
        for (let v = 0; v < nv; v++) {
          if (parts && !parts.includes(part[v])) continue;
          if (Math.abs(pos[v * 3] - x) < rr && Math.abs(pos[v * 3 + 1] - y) < rr && pos[v * 3 + 2] > best) best = pos[v * 3 + 2];
        }
        if (best > -9) return best;
      }
      return 0.2;
    };
    const cen = (parts, f) => {
      let sx = 0, sy = 0, n = 0, mny = 9;
      for (let v = 0; v < nv; v++) if (parts.includes(part[v])) mny = Math.min(mny, pos[v * 3 + 1]);
      for (let v = 0; v < nv; v++) {
        if (!parts.includes(part[v]) || !f(pos[v * 3], pos[v * 3 + 1], mny)) continue;
        sx += pos[v * 3];
        sy += pos[v * 3 + 1];
        n++;
      }
      return n ? [sx / n, sy / n] : [0, 0.3];
    };
    let topY = 0;
    for (let v = 0; v < nv; v++) if (part[v] === P.head && Math.abs(pos[v * 3]) < 0.06) topY = Math.max(topY, pos[v * 3 + 1]);
    const eY = F.eyes[0][1], eX = Math.abs(F.eyes[0][0]);
    const noseY = F.nose && F.nose.type !== "none" ? F.nose.y : eY - 0.08;
    const mouthY = F.mouth && F.mouth.type !== "none" ? F.mouth.y : eY - 0.15;
    const A = {};
    const put = (name, x, y, g, parts) => (A[name] = { p: [x, y, front(x, y, parts) + 0.01], g });
    put("forehead", 0, eY + (topY - eY) * 0.5, "head", [P.head, P.mane]);
    put("headTop", 0.05, topY - 0.045, "head", [P.head, P.mane]);
    put("eyeR", eX, eY, "head", HEAD);
    put("eyeL", -eX, eY, "head", HEAD);
    put("cheekR", eX * 1.2, eY - 0.06, "head", HEAD);
    put("cheekL", -eX * 1.2, eY - 0.06, "head", HEAD);
    put("nose", 0, noseY, "head", HEAD);
    put("mouth", 0, mouthY, "head", HEAD);
    put("chest", 0, pv.arm[1] - 0.06, "body", [P.body]);
    put("belly", 0, (pv.arm[1] + pv.leg) / 2 - 0.05, "body", [P.body]);
    for (const [nm, pt, g] of [["R", P.armR, "armR"], ["L", P.armL, "armL"]]) {
      const h = cen([pt], (x, y, mny) => y < mny + 0.06);
      put("hand" + nm, h[0], h[1] + 0.02, g, [pt]);
      const m = cen([pt], () => true);
      put("arm" + nm, m[0], m[1], g, [pt]);
    }
    for (const [nm, pt] of [["R", P.legR], ["L", P.legL]]) {
      const c = cen([pt], () => true);
      put("knee" + nm, c[0], Math.max(c[1], 0.06), "body", [pt]);
    }
    A._topY = topY;
    return (k.anc = A);
  };

  // 작은 회전 (셰이더와 같은 식)
  const rotX = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a), y = v[1], z = v[2];
    v[1] = c * y - s * z;
    v[2] = s * y + c * z;
  };
  const rotY = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a), x = v[0], z = v[2];
    v[0] = c * x + s * z;
    v[2] = -s * x + c * z;
  };
  const rotZ = (v, a) => {
    const c = Math.cos(a), s = Math.sin(a), x = v[0], y = v[1];
    v[0] = c * x - s * y;
    v[1] = s * x + c * y;
  };

  /* ================================================================
     3) 칠한 인형 고르기
  ================================================================ */
  /** 아이가 칠한 인형 목록 (안전한 그림만) */
  DA.painted = async function () {
    const D = KP.DOLL;
    try {
      return (await KP.db.all("art")).filter((x) => x && x.kind === "zoo" && x.tid === "doll" && D && D.ok(x.species) && KP.safeImg(x.img));
    } catch (e) {
      return [];
    }
  };

  /* ================================================================
     4) 3D 배우
  ================================================================ */
  const kinds = new WeakMap(); // 무대마다 종 모양 (무대를 정리하면 같이 정리)
  /** opts: {item(칠한 인형) | species, hi} */
  DA.create = async function (stage, opts) {
    const THREE = T3(), D = KP.DOLL;
    const sp = opts.item ? opts.item.species : opts.species;
    const { model, B } = await D.load(sp);
    if (stage.dead) return null;
    let ks = kinds.get(stage);
    if (!ks) {
      kinds.set(stage, (ks = {}));
      const prev = stage.onDispose;
      stage.onDispose = () => {
        prev && prev();
        for (const k of Object.values(ks)) {
          k.geo.dispose();
          k.faceT.dispose();
        }
      };
    }
    const hi = opts.hi != null ? opts.hi : Math.min(screen.width || 0, screen.height || 0) >= 600;
    const k = ks[sp] || (ks[sp] = DA.kind(sp, model, B, hi));
    let src = null;
    if (opts.item) {
      const im = await new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = KP.safeImg(opts.item.img);
      });
      if (im) {
        const ts = hi ? 768 : 512;
        src = im;
        if (Math.max(im.width, im.height) > ts) {
          src = document.createElement("canvas");
          src.width = src.height = ts;
          const g = src.getContext("2d");
          g.imageSmoothingQuality = "high";
          g.drawImage(im, 0, 0, ts, ts);
        }
      }
    }
    if (stage.dead) return null;
    const painted = !!src;
    if (!src) src = DA.defaultTex(B, sp);
    const tex = new THREE.Texture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return new Actor(stage, k, tex, sp, painted, hi);
  };

  function Actor(stage, k, tex, sp, painted, hi) {
    this.stage = stage;
    this.k = k;
    this.sp = sp;
    this.painted = painted;
    this.name = k.spec.name;
    this.tex = tex;
    this.mat = DA.material(tex, k, stage.grainT);
    this.U = this.mat.userData.U;
    this.root = new KP.clayStage.THREE.Mesh(k.geo, this.mat);
    this.sh = stage.shadow();
    stage.scene.add(this.root);
    this.anc = DA.anchorsOf(k);
    this.faces = {}; // 기분별 얼굴 텍스처
    this.faceSize = hi ? 1024 : 512;
    // 동물원 인형과 같은 움직임 값
    this.a = { x: 0, z: -5, tx: 0, tz: -5, state: "idle", look: 1e9, yaw: 0, seed: Math.random() * 100, ph: 0, sq: 0, sqv: 0, happy: 0, hop: 0, amp: 0, M: k.mv, size: 1, root: this.root, mat: this.mat };
    this.sickK = 0; // 아픔 정도 (고개 숙이고 느리게 흔들)
    this.fx = { pk0: 0, pk0T: 0, pk1: 0, pk1T: 0, glow: 0, glowT: 0, armFwd: 0, armFwdT: 0, wave: 0, dn: 0 };
    this.speed = 1;
    this.lift = 0; // 뛰어오를 때 높이
    this.lean = 0; // 앞으로 기울기 (꼭 안기)
    this.leanT = 0;
    // 놀이가 매 장면 직접 정하는 덧붙임 자세 (연주 동작): 팔 앞으로 fR·fL · 팔 들기 uR·uL · 고개 끄덕 nod · 고개 갸웃 tilt · 몸 좌우 sway · 들썩 bob(키 비율)
    this.play = { fR: 0, fL: 0, uR: 0, uL: 0, nod: 0, tilt: 0, sway: 0, bob: 0 };
    this._up = (dt, t) => this.update(dt, t);
    stage.updaters.push(this._up);
  }
  const AP = Actor.prototype;
  AP.place = function (x, z, h) {
    const a = this.a;
    a.x = a.tx = x;
    a.z = a.tz = z;
    if (h) this.setH(h);
    a.state = "idle";
  };
  AP.setH = function (h) {
    this.a.size = h; // 모델 키 1 → 세상 키 h (종마다 다른 크기 비율은 놀이가 정함)
    this.h = h;
    this.w = this.k.w * h;
  };
  /** 걸어가기 (도착하면 resolve) */
  AP.walkTo = function (x, z, speed = 1) {
    const a = this.a;
    a.tx = x;
    a.tz = z;
    a.state = "walk";
    a.look = 0;
    this.speed = speed;
    if (this._arrive) this._arrive(); // 앞선 걷기를 기다리던 쪽이 영영 멈추지 않게
    return new Promise((res) => (this._arrive = res));
  };
  /** 폴짝 뛰어 (x,z) 로 (dur 초, 높이 = 키 × hk) — 도착하면 resolve */
  AP.jumpTo = function (x, z, dur = 0.7, hk = 0.45) {
    const a = this.a;
    if (this._jump && this._jump.res) this._jump.res();
    return new Promise((res) => (this._jump = { x0: a.x, z0: a.z, x1: x, z1: z, t: 0, dur, hk, res }));
  };
  AP.stepJump = function (dt) {
    const j = this._jump, a = this.a;
    if (!j) return;
    j.t += dt;
    const k = Math.min(1, j.t / j.dur), e = k * k * (3 - 2 * k);
    a.x = a.tx = j.x0 + (j.x1 - j.x0) * e;
    a.z = a.tz = j.z0 + (j.z1 - j.z0) * e;
    this.lift = Math.sin(Math.PI * k) * j.hk * (this.h || 1);
    if (k >= 1) {
      this.lift = 0;
      this._jump = null;
      a.sqv = 6;
      j.res && j.res();
    }
  };
  AP.mood = function (m, blush) {
    const key = m + (blush || "");
    if (this._mood === key) return;
    this._mood = key;
    if (m === "normal" && !blush) {
      this.U.uFace.value = this.k.faceT;
      return;
    }
    if (!this.faces[key]) {
      const THREE = KP.clayStage.THREE, t = new THREE.CanvasTexture(DA.faceCanvas(this.k.spec, this.faceSize, m, blush));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.faces[key] = t;
    }
    this.U.uFace.value = this.faces[key];
  };
  AP.sick = function (k) {
    this.sickK = k;
  };
  /** 부위 모델 좌표 */
  AP.local = function (name) {
    const A = this.anc[name];
    return A ? A.p : [0, 0.5, 0.2];
  };
  /** 부위가 톡 반응 (볼록 + 몸 살짝 찌그러짐) */
  AP.react = function (name, k = 0.035) {
    this.poke(name, k);
    this.a.sqv = 4;
  };
  /** 순간 볼록(+)/오목(-) — 금방 돌아옴 */
  AP.poke = function (name, k = 0.04, r = 0.12) {
    const p = this.local(name);
    this.U.uPk0.value.set(p[0], p[1], p[2] - 0.01, r);
    this.fx.pk0 = k;
    this.fx.pk0T = 0;
  };
  /** 오래 남는 볼록 (혹) — k 로 천천히 바뀜 */
  AP.bump = function (name, k, r = 0.1) {
    const p = this.local(name);
    this.U.uPk1.value.set(p[0], p[1], p[2] - 0.03, r);
    this.fx.pk1T = k;
  };
  /** 부위 물들이기 (열 = 빨강) — k 로 천천히 바뀜 */
  AP.glow = function (name, col, k, r = 0.16) {
    const p = this.local(name);
    const c = new KP.clayStage.THREE.Color(col);
    this.U.uGlow.value.set(p[0], p[1], p[2] - 0.04, r);
    this.U.uGlowC.value.set(c.r, c.g, c.b, this.U.uGlowC.value.w);
    this.fx.glowT = k;
  };
  AP.happy = function () {
    this.a.sqv = 7;
    this.a.happy = 1;
    this.a.hop = 0.0001;
  };
  AP.hop = function () {
    this.a.hop = 0.0001;
    this.a.sqv = 5;
  };
  /** 오른팔 흔들어 인사 (초) */
  AP.wave = function (sec = 1.6) {
    this.fx.wave = sec;
  };
  /** 두 팔을 앞으로 (안기·꼭 안기) */
  AP.hug = function (on) {
    this.fx.armFwdT = on ? 1.1 : 0;
  };
  AP.update = function (dt, t) {
    const a = this.a, f = this.fx, Uf = this.U;
    if (a.state === "walk") {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz), st = this.k.mv.speed * 1.6 * this.h * this.speed * dt;
      if (d < 0.01 || d <= st) {
        a.x = a.tx;
        a.z = a.tz;
        a.state = "idle";
        a.look = 1e9;
        const r = this._arrive;
        this._arrive = null;
        r && r();
      } else {
        a.x += (dx / d) * st;
        a.z += (dz / d) * st;
      }
    }
    this.stepJump(dt);
    DA.pose(a, dt, t);
    if (this._jump) {
      const j = this._jump;
      a.yaw += (Math.sign(j.x1 - j.x0) * 0.6 - a.yaw) * Math.min(1, dt * 8);
    }
    const pl = this.play;
    a.root.position.y += this.lift + pl.bob * (this.h || 1);
    this.lean += (this.leanT - this.lean) * Math.min(1, dt * 5);
    a.root.rotation.x += this.lean * 0.25;
    a.root.rotation.z += pl.sway;
    // 아플 때: 고개 숙이고 천천히 좌우로
    const sk = this.sickK;
    f.dn += (sk * 0.22 - f.dn) * Math.min(1, dt * 3);
    Uf.uHeadDn.value = f.dn + pl.nod;
    Uf.uHead.value.x += Math.sin(t * 1.3 + a.seed) * 0.07 * sk + pl.tilt;
    Uf.uArmB.value.set(pl.fR, pl.fL);
    Uf.uArmL.value = pl.uL;
    a.root.rotation.z += Math.sin(t * 1.1 + a.seed) * 0.035 * sk;
    // 순간 볼록: 0.5초 동안 줄어듦
    if (f.pk0) {
      f.pk0T += dt;
      const e = Math.max(0, 1 - f.pk0T / 0.5);
      Uf.uPk0K.value = f.pk0 * e * e;
      if (e <= 0) f.pk0 = 0;
    } else Uf.uPk0K.value = 0;
    f.pk1 += (f.pk1T - f.pk1) * Math.min(1, dt * 2.5);
    Uf.uPk1K.value = f.pk1;
    const gw = Uf.uGlowC.value;
    gw.w += (f.glowT - gw.w) * Math.min(1, dt * 2.5);
    if (gw.w < 0.002 && !f.glowT) gw.w = 0;
    f.armFwd += (f.armFwdT - f.armFwd) * Math.min(1, dt * 6);
    Uf.uArmFwd.value = f.armFwd;
    if (f.wave > 0) {
      f.wave -= dt;
      Uf.uArmR.value = (Math.min(1, f.wave * 3, (1.6 - f.wave) * 3 + 0.2)) * (1.9 + Math.sin(t * 12) * 0.35) + pl.uR;
    } else Uf.uArmR.value = pl.uR;
    this.sh.set(a.x, a.z, this.w || 0.5, this.h || 1, (a.bobY || 0) + this.lift);
  };
  /** 부위 → 화면 좌표 (host 기준 px) — 고개·팔 움직임을 셰이더와 같은 식으로 따라감 */
  AP.anchor = function (name) {
    const A = this.anc[name], THREE = KP.clayStage.THREE;
    const p = (A ? A.p : [0, 0.5, 0.2]).slice(), Uf = this.U, sp = this.k.spec.pivot;
    if (A && A.g === "head") {
      const nk = sp.head;
      p[0] -= nk[0]; p[1] -= nk[1]; p[2] -= nk[2];
      rotX(p, Uf.uHeadDn.value);
      rotZ(p, Uf.uHead.value.x);
      rotY(p, Uf.uHead.value.y);
      p[0] += nk[0]; p[1] += nk[1]; p[2] += nk[2];
    } else if (A && (A.g === "armR" || A.g === "armL")) {
      const R = A.g === "armR", sh = [sp.arm[0] * (R ? 1 : -1), sp.arm[1], sp.arm[2]];
      const s = Math.sin(Uf.uPh.value), sw = Uf.uArmSw.value * Uf.uAmp.value;
      p[0] -= sh[0]; p[1] -= sh[1]; p[2] -= sh[2];
      rotX(p, (R ? -s * sw : s * sw) - Uf.uArmFwd.value - (R ? Uf.uArmB.value.x : Uf.uArmB.value.y));
      rotZ(p, R ? Uf.uArmUp.value + Uf.uArmR.value : -Uf.uArmUp.value - Uf.uArmL.value);
      p[0] += sh[0]; p[1] += sh[1]; p[2] += sh[2];
    }
    this.root.updateMatrixWorld();
    const v = (this._v = this._v || new THREE.Vector3()).set(p[0], p[1], p[2]).applyMatrix4(this.root.matrixWorld);
    const s = this.stage.project(v.x, v.y, v.z);
    return { x: s.x, y: s.y };
  };
  /** 화면에서 인형이 차지하는 네모 (host 기준) */
  AP.box = function () {
    const a = this.a, st = this.stage, hw = (this.w || 0.5) / 2, y0 = (a.bobY || 0) + this.lift;
    const by = st.project(a.x, y0, a.z).y, ty = st.project(a.x, y0 + (this.h || 1), a.z).y;
    const l = st.project(a.x - hw, y0, a.z).x, r = st.project(a.x + hw, y0, a.z).x;
    return { l, r, t: ty, b: by, cx: (l + r) / 2, cy: (ty + by) / 2, w: r - l, h: by - ty };
  };
  /** 화면 점(host 기준) → 몸 위면 가장 가까운 부위 이름, 아니면 null */
  AP.hit = function (px, py, names) {
    const bx = this.box(), pad = Math.max(12, bx.w * 0.08);
    if (px < bx.l - pad || px > bx.r + pad || py < bx.t - pad || py > bx.b + pad) return null;
    let best = null, bd = 1e9;
    for (const n of names || Object.keys(this.anc)) {
      if (n[0] === "_") continue;
      const p = this.anchor(n), d = Math.hypot(p.x - px, p.y - py);
      if (d < bd) (bd = d), (best = n);
    }
    return best;
  };
  AP.dispose = function () {
    const st = this.stage;
    st.updaters = st.updaters.filter((f) => f !== this._up);
    if (st.scene) st.scene.remove(this.root);
    this.sh.remove();
    this.mat.dispose();
    this.tex.dispose();
    for (const t of Object.values(this.faces)) t.dispose();
    this.faces = {};
  };

  /* ================================================================
     5) 그림 배우 (3D 가 안 될 때) — 같은 함수 이름, 움직임은 CSS
  ================================================================ */
  KP.css(
    "dollActor2d",
    `.da2{position:absolute;left:0;top:0;transform-origin:50% 100%;pointer-events:none;z-index:0}
     .da2 img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 4px rgba(60,30,20,.25))}
     .da2.sick{animation:da2Sway 3s ease-in-out infinite}
     @keyframes da2Sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
     .da2.hop{animation:da2Hop .5s ease-in-out}
     @keyframes da2Hop{50%{transform:translateY(-14%) scale(1.04)}}
     .da2.squish{animation:da2Sq .3s ease-out}
     @keyframes da2Sq{40%{transform:scale(1.06,.93)}}`
  );
  DA.create2D = async function (stage, opts) {
    const D = KP.DOLL, sp = opts.item ? opts.item.species : opts.species;
    const { model, B } = await D.load(sp);
    if (stage.dead) return null; // 불러오는 사이 놀이를 나갔으면 만들지 않음
    // 도안 실루엣 네모 = 정면 그림(thumb) 범위
    const S = B.S;
    let x0 = S, y0 = S, x1 = 0, y1 = 0;
    for (let i = 0; i < S * S; i += 1) {
      if (!B.label[i]) continue;
      const x = i % S, y = (i / S) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const k = { model, B, spec: B.spec, w: (x1 - x0) / (B.spec.K * B.f), mv: B.spec.move };
    return new Actor2D(stage, k, sp, opts.item, [x0, y0, x1 + 1, y1 + 1]);
  };
  function Actor2D(stage, k, sp, item, box) {
    this.stage = stage;
    this.k = k;
    this.sp = sp;
    this.name = k.spec.name;
    this.painted = !!(item && KP.safeImg(item.thumb));
    this.anc = DA.anchorsOf(k);
    this.boxS = box;
    this.el = U.el("div", "da2", '<img alt="" src="' + (KP.safeImg(item && item.thumb) || KP.DOLL.thumbUrl(sp)) + '">');
    stage.host.insertBefore(this.el, stage.ui);
    this.a = { x: 0, z: -5, tx: 0, tz: -5, state: "idle", bobY: 0 };
    this.speed = 1;
    this.lift = 0;
    this.lean = this.leanT = 0;
    this.play = { fR: 0, fL: 0, uR: 0, uL: 0, nod: 0, tilt: 0, sway: 0, bob: 0 }; // 3D 와 같은 이름 (그림 배우는 들썩·기울기만)
    this._up = (dt) => this.update(dt);
    this.setH(1); // place(x,z) 를 키 없이 불러도 크기가 비지 않게
    stage.updaters.push(this._up);
  }
  const A2 = Actor2D.prototype;
  A2.place = AP.place;
  A2.walkTo = AP.walkTo;
  A2.jumpTo = AP.jumpTo;
  A2.stepJump = AP.stepJump;
  A2.setH = function (h) {
    this.h = h;
    this.w = this.k.w * h;
  };
  A2.update = function (dt) {
    const a = this.a;
    if (a.state === "walk") {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz), st = 0.8 * this.h * this.speed * dt;
      if (d <= st) {
        a.x = a.tx;
        a.z = a.tz;
        a.state = "idle";
        const r = this._arrive;
        this._arrive = null;
        r && r();
      } else {
        a.x += (dx / d) * st;
        a.z += (dz / d) * st;
      }
    }
    this.stepJump(dt);
    const [x0, y0, x1, y1] = this.boxS, B = this.k.B, sp = this.k.spec;
    const foot = Object.assign({}, this.stage.project(a.x, this.lift, a.z)), top = this.stage.project(a.x, this.h + this.lift, a.z);
    const pxPerS = (foot.y - top.y) / (sp.K * B.f); // 모델 1 = K·f 칸
    const footS = sp.OY * B.f;
    const w = (x1 - x0) * pxPerS, h = (y1 - y0) * pxPerS;
    const cxS = sp.CX * B.f;
    this.px = { k: pxPerS, ox: foot.x - (cxS - x0) * pxPerS, oy: foot.y - (footS - y0) * pxPerS };
    Object.assign(this.el.style, { width: w + "px", height: h + "px", left: this.px.ox + "px", top: this.px.oy + "px" });
    const pl = this.play;
    this.el.style.translate = pl.bob || pl.sway ? `0 ${-pl.bob * h}px` : "";
    this.el.style.rotate = pl.sway ? pl.sway * 57.3 + "deg" : "";
  };
  A2.anchor = function (name) {
    const A = this.anc[name], p = A ? A.p : [0, 0.5, 0], B = this.k.B;
    if (!this.px) this.update(0);
    const [x0, y0] = this.boxS;
    return { x: this.px.ox + (B.X(p[0]) - x0) * this.px.k, y: this.px.oy + (B.Y(p[1]) - y0) * this.px.k };
  };
  A2.box = function () {
    if (!this.px) this.update(0);
    const r = this.el.getBoundingClientRect(), hr = this.stage.host.getBoundingClientRect();
    const l = r.left - hr.left, t = r.top - hr.top;
    return { l, r: l + r.width, t, b: t + r.height, cx: l + r.width / 2, cy: t + r.height / 2, w: r.width, h: r.height };
  };
  A2.hit = AP.hit;
  A2.mood = function (m) {
    this.el.classList.toggle("sick", m === "sick" || m === "pain");
  };
  A2.sick = function () {};
  const css = (el, c) => {
    el.classList.remove(c);
    void el.offsetWidth;
    el.classList.add(c);
  };
  A2.react = function () {
    css(this.el, "squish");
  };
  A2.poke = A2.react;
  A2.bump = function () {};
  A2.glow = function () {};
  A2.happy = function () {
    css(this.el, "hop");
  };
  A2.hop = A2.happy;
  A2.wave = function () {};
  A2.hug = function (on) {
    if (on) css(this.el, "squish");
  };
  A2.local = AP.local;
  A2.dispose = function () {
    const st = this.stage;
    st.updaters = st.updaters.filter((f) => f !== this._up);
    this.el.remove();
  };
})();
