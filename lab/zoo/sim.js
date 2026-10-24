/* =====================================================================
   동물원 시험판 — 두 방식이 함께 쓰는 것: 움직임(시뮬레이션)·자세·카메라·소리
   점토 3D 와 2.5D 는 같은 동물 목록·같은 자세 값을 받아 그리기만 다르게 함
===================================================================== */
export const U = 0.01; // 도안 1단위 → 세상 단위

/* ---------- 카메라: 고정 + 살짝 내려다봄 (자유 회전 없음), 아주 느린 좌우 흔들림(패럴랙스) ---------- */
export function camFor(aspect, tiltDeg = 21) {
  // 화면 비율에 맞춰 마당 크기와 거리
  const wide = Math.max(0.42, Math.min(2.2, aspect));
  const W = wide >= 1.3 ? 5.6 : wide >= 0.9 ? 4.2 : 2.3; // 마당 반 너비
  const tall = wide < 0.9; // 세로 화면: 마당을 앞뒤로 길게, 더 내려다봄
  const z0 = wide >= 1.3 ? -3.2 : wide >= 0.9 ? -3.6 : -7.5, z1 = wide >= 1.3 ? 2.6 : wide >= 0.9 ? 2.8 : 4.2;
  const fov = tall ? 44 : 34;
  const tilt = ((tiltDeg + (tall && tiltDeg ? 13 : 0)) * Math.PI) / 180; // 내려다보는 각
  const t = Math.tan((fov * Math.PI) / 360);
  // 앞줄(z1)에서 W 가 화면 너비에 들어오는 거리
  const distH = (W + 1.1) / (t * wide) + 0.5;
  const distV = tall ? 0 : (z1 - z0 + 2.4) / (2 * t) * 0.9;
  const dist = Math.max(distH, distV, 8);
  const target = [0, 0.75, (z0 + z1) / 2 - 0.2];
  const pos = [0, target[1] + Math.sin(tilt) * dist, target[2] + Math.cos(tilt) * dist];
  return { fov, pos, target, bounds: { x0: -W, x1: W, z0, z1 } };
}
export function camAt(base, t, freeze) {
  if (base.fixed) return base; // 배경 그림 모드: 그림과 맞아야 하므로 카메라 고정
  const d = freeze ? 0 : Math.sin(t * 0.13) * 0.45;
  return { fov: base.fov, pos: [base.pos[0] + d, base.pos[1], base.pos[2]], target: [base.target[0] + d * 0.35, base.target[1], base.target[2]] };
}
/** 2.5D 용 투영 (점토 3D 의 원근 카메라와 같은 계산) */
export function projector(cam, W, H) {
  const [px, py, pz] = cam.pos, [tx, ty, tz] = cam.target;
  let fx = tx - px, fy = ty - py, fz = tz - pz;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl; fy /= fl; fz /= fl;
  // right = f × up(0,1,0)
  let rx = -fz, ry = 0, rz = fx;
  const rl = Math.hypot(rx, rz);
  rx /= rl; rz /= rl;
  // u = r × f
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  // 배경 그림 모드: 그림 전체(fw×fh) 기준 카메라에서 화면 부분(ox,oy)만 보여 줌
  const V = cam.view, FH = V ? V.fh : H, cx = V ? V.fw / 2 - V.ox : W / 2, cy = V ? V.fh / 2 - V.oy : H / 2;
  const focal = FH / 2 / Math.tan((cam.fov * Math.PI) / 360);
  return {
    focal, f: [fx, fy, fz],
    p(x, y, z) {
      const dx = x - px, dy = y - py, dz = z - pz;
      const zc = dx * fx + dy * fy + dz * fz;
      const xc = dx * rx + dy * ry + dz * rz, yc = dx * ux + dy * uy + dz * uz;
      return [cx + (xc / zc) * focal, cy - (yc / zc) * focal, focal / zc, zc];
    },
    tilt: Math.asin(-fy),
  };
}

/* ---------- 동물 목록 ---------- */
let rand = Math.random;
export function setSeed(seed) {
  if (!seed) {
    rand = Math.random;
    return;
  }
  let s = seed >>> 0;
  rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const R = (a, b) => a + rand() * (b - a);

export function makeAnimals(arts, count, bounds) {
  const out = [];
  const cols = Math.ceil(Math.sqrt(count * 1.8));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const art = arts[i % arts.length];
    const fly = !!art.model.rig.fly;
    const cx = i % cols, cy = Math.floor(i / cols);
    const x = count === 1 ? 0 : bounds.x0 + 0.8 + ((cx + 0.5) / cols) * (bounds.x1 - bounds.x0 - 1.6) + R(-0.3, 0.3);
    const z = count === 1 ? 0.3 : bounds.z0 + 0.6 + ((cy + 0.5) / rows) * (bounds.z1 - bounds.z0 - 1.2) + R(-0.2, 0.2);
    out.push({
      id: i, art, fly, x, z, y: fly ? R(1.0, 1.8) : 0,
      tx: x, tz: z, ty: 1.4, face: rand() < 0.5 ? 1 : -1, faceShow: 1, turn: 0,
      state: "idle", timer: R(0.2, 2.5), walk: R(0, 6), speed: 0, hop: 0, hopT: 0,
      blinkT: R(1, 4), blink: 0, react: -1, heart: -1, wag: R(0, 6), flap: R(0, 6), look: 0,
      size: art.model.rig.size, mood: 0,
    });
  }
  return out;
}
/** 한 걸음 (dt 초). freeze=true 면 움직이지 않음(그림 맞춤 확인용) */
export const opts = { demo: "" }; // 점검용: "walk"(제자리 걷기) | "hop"(제자리 깡충)
export function step(list, dt, bounds, freeze) {
  if (freeze) return;
  dt = Math.min(dt, 0.05);
  if (opts.demo) {
    for (const a of list) {
      a.blinkT -= dt;
      if (a.react >= 0 && (a.react += dt) > 1.25) a.react = -1;
      if (a.heart >= 0 && (a.heart += dt) > 1.4) a.heart = -1;
      a.wag += dt * 8;
      a.flap += dt * 20;
      if (a.fly) continue;
      a.state = "walk";
      a.speed = 0.62;
      a.hopT = opts.demo === "hop" ? 1 : 0;
      a.walk += dt * a.speed * 9.5;
    }
    return;
  }
  if (bounds.inside) for (const a of list) (a.px = a.x), (a.pz = a.z);
  for (const a of list) {
    // 눈 깜빡
    a.blinkT -= dt;
    if (a.blinkT <= 0) {
      a.blink = 0.16;
      a.blinkT = R(2, 5.5);
    }
    if (a.blink > 0) a.blink -= dt;
    // 누른 반응 진행
    if (a.react >= 0) {
      a.react += dt;
      if (a.react > 1.25) a.react = -1;
    }
    if (a.heart >= 0) {
      a.heart += dt;
      if (a.heart > 1.4) a.heart = -1;
    }
    a.wag += dt * (a.react >= 0 ? 16 : 8);
    // 방향 바꾸기 (돌아서기)
    if (a.turn > 0) {
      a.turn -= dt / 0.36;
      if (a.turn <= 0.5 && a.faceShow !== a.face) a.faceShow = a.face;
      if (a.turn < 0) a.turn = 0;
    }
    if (a.fly) {
      a.flap += dt * (a.react >= 0 ? 30 : 20);
      a.timer -= dt;
      if (a.timer <= 0 || Math.hypot(a.tx - a.x, a.tz - a.z) < 0.25) {
        a.ty = R(0.9, 2.0);
        const p = bounds.pick ? bounds.pick(a) : null;
        a.tx = p ? p[0] : bounds.pick ? a.x : R(bounds.x0 + 0.6, bounds.x1 - 0.6);
        a.tz = p ? p[1] : bounds.pick ? a.z : R(bounds.z0 + 0.4, bounds.z1 - 0.6);
        a.timer = R(2.5, 5);
      }
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz) || 1;
      const sp = 0.9;
      a.x += (dx / d) * sp * dt;
      a.z += (dz / d) * sp * dt;
      a.y += (a.ty - a.y) * dt * 0.8;
      continue;
    }
    if (a.react >= 0) continue; // 누르면 그 자리에서 반응
    a.timer -= dt;
    if (a.state === "idle") {
      a.speed = Math.max(0, a.speed - dt * 3);
      if (a.timer <= 0) {
        a.state = "walk";
        const p = bounds.pick ? bounds.pick(a) : null; // 배경 그림 모드: 풀밭 안에서만 고르기
        a.tx = p ? p[0] : bounds.pick ? a.x : R(bounds.x0 + 0.8, bounds.x1 - 0.8);
        a.tz = p ? p[1] : bounds.pick ? a.z : R(bounds.z0 + 0.5, bounds.z1 - 0.3);
        a.timer = 8;
        a.hopT = rand() < 0.35 ? 1.4 : 0; // 가끔 깡충깡충 출발
        const f = a.tx > a.x ? 1 : -1;
        if (f !== a.face) {
          a.face = f;
          a.turn = 1;
        }
      }
    } else {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
      const vmax = a.hopT > 0 ? 1.15 : 0.62 * (a.size > 1.1 ? 0.85 : 1);
      a.speed = Math.min(vmax, a.speed + dt * 2.2);
      if (a.hopT > 0) a.hopT -= dt;
      if (d < 0.08 || a.timer <= 0) {
        a.state = "idle";
        a.timer = R(1.2, 4);
      } else {
        const f = dx > 0.05 ? 1 : dx < -0.05 ? -1 : a.face;
        if (f !== a.face && a.turn === 0) {
          a.face = f;
          a.turn = 1;
        }
        const k = (a.speed * dt) / d;
        a.x += dx * Math.min(1, k);
        a.z += dz * Math.min(1, k);
      }
      a.walk += dt * a.speed * 9.5;
    }
  }
  // 겹치지 않게 살짝 밀기
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.fly || b.fly) continue;
      const dx = b.x - a.x, dz = (b.z - a.z) * 2.2, d = Math.hypot(dx, dz);
      const min = 0.75 * (a.size + b.size);
      if (d > 0.001 && d < min) {
        const p = ((min - d) / d) * 0.5 * Math.min(1, dt * 6);
        a.x -= dx * p; b.x += dx * p;
        a.z -= (dz / 2.2) * p * 0.6; b.z += (dz / 2.2) * p * 0.6;
      }
    }
  for (const a of list) {
    a.x = Math.max(bounds.x0, Math.min(bounds.x1, a.x));
    a.z = Math.max(bounds.z0, Math.min(bounds.z1, a.z));
    // 배경 그림 모드: 풀밭 밖(연못·집·나무·화면 밖)으로 나가면 제자리로, 걷던 동물은 쉬었다 새로 고르기
    if (bounds.inside && a.px !== undefined && !bounds.inside(a, a.x, a.z)) {
      const back = bounds.inside(a, a.px, a.pz);
      if (back) {
        a.x = a.px;
        a.z = a.pz;
      }
      if (a.fly) a.timer = 0;
      else if (a.state === "walk") {
        a.state = "idle";
        a.timer = R(0.4, 1.5);
      }
    }
  }
}

/* ---------- 자세: 동물 하나 → 몸 전체 + 관절별 값 ----------
   g[name] = {rz: 도(화면 안 회전), ry: 도(앞뒤로 젖힘 — 2.5D 는 가로 줄이기로 흉내), sx, sy}
   root = {y: 들림(도안 단위), sx, sy (발 기준 찌그러짐), rz, ry(돌아서기)} */
const D = Math.PI / 180;
const ease = (t) => t * t * (3 - 2 * t);
export function pose(a, t) {
  const g = {};
  const root = { y: 0, sx: 1, sy: 1, rz: 0, ry: 0, mirror: a.faceShow };
  const tid = a.art.tid;
  const moving = !a.fly && a.state === "walk" && a.react < 0;
  const sp = Math.min(1, a.speed / 0.6);
  const ph = a.walk;
  // 돌아서기: 0→90°(옆으로 섬)에서 거울 바꾸고 다시 0°
  if (a.turn > 0) root.ry = Math.sin((1 - a.turn) * Math.PI) * 88;
  if (!a.fly) {
    const sw = Math.sin(ph) * 24 * sp;
    g.l1 = { rz: sw };
    g.l4 = { rz: sw };
    g.l2 = { rz: -sw };
    g.l3 = { rz: -sw };
    root.y = Math.abs(Math.sin(ph)) * 3.2 * sp;
    root.rz = Math.sin(ph) * 1.6 * sp;
    if (a.hopT > 0 && moving) {
      // 깡충깡충
      const hp = (ph * 0.5) % Math.PI;
      const h = Math.sin(hp);
      root.y = h * 26;
      root.sy = 1 + (h - 0.5) * 0.14;
      root.sx = 1 - (h - 0.5) * 0.1;
      g.l1 = { rz: -18 * h }; g.l2 = { rz: -18 * h }; g.l3 = { rz: 18 * h }; g.l4 = { rz: 18 * h };
    }
    g.tail = { rz: Math.sin(a.wag) * (a.react >= 0 ? 26 : 14) };
    g.head = { rz: Math.sin(ph * 0.5 + 1) * 3 * sp + Math.sin(t * 0.7 + a.id) * 2 };
    if (tid === "dog") g.ear = { rz: Math.sin(ph + 0.8) * 8 * sp + Math.sin(t * 1.3 + a.id) * 3 };
    if (tid === "elephant") {
      g.trunk = { rz: Math.sin(t * 1.4 + a.id) * 10 + (a.react >= 0 ? -28 * Math.sin(Math.min(1, a.react * 2) * Math.PI * 0.5) : 0) };
      g.ear = { ry: 18 + Math.sin(t * 2.2 + a.id) * 16 };
    }
  } else {
    const f = Math.sin(a.flap);
    const open = a.react >= 0 ? 1 : 0.75;
    g.wingL = { ry: (f * 0.5 + 0.5) * 70 * open };
    g.wingR = { ry: -(f * 0.5 + 0.5) * 70 * open };
    root.y = Math.sin(a.flap * 0.5) * 6;
    root.rz = Math.sin(t * 0.9 + a.id) * 6;
  }
  // 누르기: 꾹 찌그러졌다 → 쭉 늘며 튀어오름 → 착지 찌그러짐 → 출렁 멈춤
  if (a.react >= 0) {
    const r = a.react;
    if (r < 0.12) {
      const k = ease(r / 0.12);
      root.sy = 1 - 0.24 * k;
      root.sx = 1 + 0.16 * k;
    } else if (r < 0.52) {
      const k = (r - 0.12) / 0.4;
      root.y = Math.sin(k * Math.PI) * (a.fly ? 22 : 46);
      root.sy = 1 + 0.14 * Math.sin(Math.min(1, k * 2) * Math.PI);
      root.sx = 1 - 0.08 * Math.sin(Math.min(1, k * 2) * Math.PI);
      if (!a.fly) {
        g.l1 = { rz: -20 }; g.l2 = { rz: -14 }; g.l3 = { rz: 20 }; g.l4 = { rz: 14 };
        g.head = { rz: -10 * Math.sin(k * Math.PI) };
      }
    } else {
      const k = (r - 0.52) / 0.73;
      const w = Math.exp(-k * 4) * Math.cos(k * 18);
      root.sy = 1 - 0.16 * w;
      root.sx = 1 + 0.11 * w;
    }
  }
  const happy = a.react >= 0 && a.react < 1.1;
  const eye = happy ? 0.16 : a.blink > 0 ? Math.max(0.1, Math.abs(a.blink / 0.08 - 1)) : 1;
  return { root, g, eye, happy };
}

/* ---------- 배경 소품 (두 방식 같은 자리) ---------- */
export function propsFor(b) {
  const o = [];
  const back = b.z0 - 1.3;
  const n = Math.max(3, Math.round((b.x1 - b.x0) / 2.2));
  for (let i = 0; i <= n; i++) {
    const x = b.x0 - 0.6 + (i / n) * (b.x1 - b.x0 + 1.2);
    o.push({ kind: i % 2 ? "pine" : "tree", x: x + (i % 3) * 0.25 - 0.25, z: back - (i % 2) * 0.7, s: 1 + (i % 3) * 0.12 });
  }
  o.push({ kind: "bush", x: b.x0 - 0.3, z: b.z1 - 0.6, s: 0.9 });
  o.push({ kind: "bush", x: b.x1 + 0.3, z: b.z1 - 1.4, s: 1 });
  o.push({ kind: "bush", x: b.x1 + 0.2, z: b.z0 + 0.6, s: 0.8 });
  return o;
}
export const PROP_COL = { leaf: "#6cc35a", leafD: "#3f9a3c", pine: "#3ea35a", pineD: "#22703f", trunk: "#b07a48", trunkD: "#6e4626", bush: "#5fbf4a", bushD: "#2f8a3a" };

/* ---------- 소리 (두 방식 같음): 통 튀는 소리 + 울음 말소리(기기 목소리) ---------- */
let ac = null, muted = false;
export const sound = {
  get muted() {
    return muted;
  },
  set muted(v) {
    muted = !!v;
  },
  unlock() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
    } catch (e) {}
  },
  boing() {
    if (muted || !ac) return;
    try {
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(260, t);
      o.frequency.exponentialRampToValueAtTime(720, t + 0.16);
      o.frequency.exponentialRampToValueAtTime(420, t + 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.36);
    } catch (e) {}
  },
  say(text) {
    if (muted) return;
    try {
      const s = window.speechSynthesis;
      if (!s) return;
      s.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = 1;
      u.pitch = 1.25;
      s.speak(u);
    } catch (e) {}
  },
};
