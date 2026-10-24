/* =====================================================================
   후보 F — 고품질 2.5D (캔버스 2D)
   - 앱 2D 동물원처럼 도안 부위를 그대로 그림(같은 그림판 atlas) + 관절 움직임
   - 깊이감: 원근(앞은 크게·뒤는 작게), 발밑 그림자, 앞뒤 순서, 먼 언덕 패럴랙스, 부위 음영
===================================================================== */
import { mul, ap, heartCanvas, hillsCanvas } from "./art.js";
import { U, projector, pose, PROP_COL } from "./sim.js";

const D = Math.PI / 180;
const T = (x, y) => [1, 0, 0, 1, x, y];
const Sc = (x, y) => [x, 0, 0, y, 0, 0];
const Rot = (deg) => {
  const a = deg * D, c = Math.cos(a), s = Math.sin(a);
  return [c, s, -s, c, 0, 0];
};
const inv = (M) => {
  const det = M[0] * M[3] - M[1] * M[2] || 1e-9;
  return [M[3] / det, -M[1] / det, -M[2] / det, M[0] / det, (M[2] * M[5] - M[3] * M[4]) / det, (M[1] * M[4] - M[0] * M[5]) / det];
};

export function createFlat(host) {
  const cv = document.createElement("canvas");
  cv.className = "labCanvas";
  host.appendChild(cv);
  const g = cv.getContext("2d", { alpha: false });
  let W = 1, H = 1, dpr = 1;
  let shadowSpr = null;
  const placed = []; // 누르기 판정용 (이번 프레임)
  const stat = { draws: 0, ms: 0 };

  let bg = null, bgShadow = null; // 배경 그림 모드
  function mkShadow(rgb = "29,74,18", k = 1) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(64, 32, 0, 64, 32, 64);
    gr.addColorStop(0, "rgba(" + rgb + "," + 0.46 * k + ")");
    gr.addColorStop(0.55, "rgba(" + rgb + "," + 0.2 * k + ")");
    gr.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = gr;
    x.setTransform(1, 0, 0, 0.5, 0, 16);
    x.beginPath();
    x.arc(64, 32, 64, 0, 7);
    x.fill();
    return c;
  }
  shadowSpr = mkShadow();

  function drawProp(pr, P) {
    const [sx, sy, k] = P.p(pr.x, 0, pr.z);
    const s = k * pr.s;
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.translate(sx, sy);
    g.drawImage(shadowSpr, -0.9 * s, -0.25 * s, 1.8 * s, 0.5 * s);
    const ol = (fill, dark, cs) => {
      g.fillStyle = dark;
      for (const c of cs) {
        g.beginPath();
        g.arc(c[0] * s, -c[1] * s, c[2] * s + Math.max(1.5, s * 0.035), 0, 7);
        g.fill();
      }
      g.fillStyle = fill;
      for (const c of cs) {
        g.beginPath();
        g.arc(c[0] * s, -c[1] * s, c[2] * s, 0, 7);
        g.fill();
      }
      // 반짝
      g.fillStyle = "rgba(255,255,255,.22)";
      const c0 = cs[0];
      g.beginPath();
      g.ellipse((c0[0] - c0[2] * 0.35) * s, -(c0[1] + c0[2] * 0.35) * s, c0[2] * 0.35 * s, c0[2] * 0.22 * s, -0.5, 0, 7);
      g.fill();
    };
    if (pr.kind === "tree") {
      g.fillStyle = PROP_COL.trunkD;
      g.fillRect(-0.1 * s, -0.95 * s, 0.2 * s, 0.95 * s);
      g.fillStyle = PROP_COL.trunk;
      g.fillRect(-0.075 * s, -0.95 * s, 0.15 * s, 0.95 * s);
      ol(PROP_COL.leaf, PROP_COL.leafD, [[0, 1.55, 0.55], [-0.42, 1.12, 0.42], [0.42, 1.12, 0.42], [0, 1.0, 0.45]]);
    } else if (pr.kind === "pine") {
      g.fillStyle = PROP_COL.trunk;
      g.fillRect(-0.08 * s, -0.5 * s, 0.16 * s, 0.5 * s);
      for (const [y0, w, h] of [[0.4, 0.62, 0.9], [0.9, 0.48, 0.8], [1.35, 0.32, 0.7]]) {
        g.beginPath();
        g.moveTo(0, -(y0 + h) * s);
        g.lineTo(w * s, -y0 * s);
        g.quadraticCurveTo(0, -(y0 - 0.12) * s, -w * s, -y0 * s);
        g.closePath();
        g.fillStyle = PROP_COL.pine;
        g.fill();
        g.lineWidth = Math.max(1.5, s * 0.03);
        g.strokeStyle = PROP_COL.pineD;
        g.stroke();
      }
    } else ol(PROP_COL.bush, PROP_COL.bushD, [[0, 0.36, 0.34], [-0.38, 0.24, 0.26], [0.38, 0.24, 0.26]]);
    g.restore();
  }

  function drawBg(P, cam, bounds) {
    // 하늘
    const hz = P.p(0, 0, -80)[1];
    const sky = g.createLinearGradient(0, 0, 0, Math.max(10, hz));
    sky.addColorStop(0, "#8fd3ff");
    sky.addColorStop(1, "#e4f6ff");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // 먼 언덕: z=-30 의 판 (카메라가 흔들리면 가까운 것보다 덜 움직임 → 패럴랙스)
    const a = P.p(-60, 0, -30), b = P.p(60, 9, -30);
    g.drawImage(hillsCanvas(), a[0], b[1], b[0] - a[0], a[1] - b[1] + 3); // +3: 땅과 겹쳐 틈(흰 줄) 없게
    // 땅
    const q = [P.p(-60, 0, -30), P.p(60, 0, -30), P.p(60, 0, cam.pos[2] - 1.5), P.p(-60, 0, cam.pos[2] - 1.5)];
    const gr = g.createLinearGradient(0, q[0][1], 0, H);
    gr.addColorStop(0, "#b6e38e");
    gr.addColorStop(0.35, "#97d46c");
    gr.addColorStop(1, "#6cbd4c");
    g.fillStyle = gr;
    g.beginPath();
    q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.fill();
    // 마당(밝은 풀밭)
    const cx = (bounds.x0 + bounds.x1) / 2, cz = (bounds.z0 + bounds.z1) / 2, rx = (bounds.x1 - bounds.x0) / 2 + 1.2, rz = (bounds.z1 - bounds.z0) / 2 + 0.9;
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI * 2, p = P.p(cx + Math.cos(t) * rx, 0, Math.min(cz + Math.sin(t) * rz, cam.pos[2] - 1.2)); // 카메라 뒤로 넘어가지 않게
      i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]);
    }
    g.fillStyle = "rgba(255,255,220,.22)";
    g.fill();
  }

  function rootM(a, ps, P, cosT) {
    const art = a.art, m = art.model;
    const [sx, sy, k, zc] = P.p(a.x, a.y, a.z);
    const ws = k * U * a.size;
    const mir = ps.root.mirror * Math.cos(ps.root.ry * D);
    let M = mul(T(sx, sy), Sc(ws * mir, ws * cosT));
    M = mul(M, T(0, -ps.root.y));
    M = mul(M, Rot(ps.root.rz));
    M = mul(M, Sc(ps.root.sx, ps.root.sy));
    M = mul(M, T(-m.foot[0], -m.foot[1]));
    return { M, sx, sy, k, zc, ws };
  }
  function groupMs(a, ps, M0) {
    const out = {};
    for (const [name, gr] of Object.entries(a.art.model.groups)) {
      const base = gr.parent ? out[gr.parent] || M0 : M0;
      const q = ps.g[name];
      if (!gr.parent || !q) {
        out[name] = base;
        continue;
      }
      const p = gr.pivot;
      let M = mul(base, T(p[0], p[1]));
      if (q.rz) M = mul(M, Rot(q.rz));
      const kx = (q.ry ? Math.cos(q.ry * D) : 1) * (q.sx || 1);
      if (kx !== 1 || (q.sy && q.sy !== 1)) M = mul(M, Sc(kx, q.sy || 1));
      out[name] = mul(M, T(-p[0], -p[1]));
    }
    return out;
  }

  return {
    kind: "2.5d",
    canvas: cv,
    setArts() {},
    /** 배경 그림 켜기/끄기: b = {img, grass, def} | null */
    setBackdrop(b) {
      bg = b || null;
      if (bg) {
        const h = bg.grass.replace("#", ""), c = [0, 2, 4].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.22));
        bgShadow = mkShadow(c.join(","), 1.45);
      } else bgShadow = null;
    },
    resize(w, h, ratio) {
      W = Math.max(1, w);
      H = Math.max(1, h);
      dpr = ratio;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
    },
    render(list, t, cam, bounds, props) {
      const t0 = performance.now();
      const P = projector(cam, W, H);
      const cosT = Math.cos(P.tilt);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = true;
      let draws = 3;
      if (bg && cam.view) {
        // 배경 그림: 화면 가득(cover) — 카메라와 같은 잘라 보기
        const V = cam.view;
        g.drawImage(bg.img, -V.ox, -V.oy, V.fw, V.fh);
        draws = 1;
        props = [];
      } else drawBg(P, cam, bounds);
      const shSpr = bg && cam.view ? bgShadow : shadowSpr;
      // 그림자를 햇빛 반대쪽으로 아주 조금 밀기 (배경 그림의 빛 방향)
      const sd = bg && cam.view ? bg.def.sun : null;
      // 그릴 것 모으기 (소품 + 동물) → 먼 것부터
      const items = [];
      for (const pr of props) items.push({ z: P.p(pr.x, 0, pr.z)[3], pr });
      for (const a of list) items.push({ z: P.p(a.x, 0, a.z)[3], a });
      for (let i = items.length - 1; i >= 0; i--) if (!(items[i].z > 0.4)) items.splice(i, 1); // 카메라 뒤·바로 앞은 안 그림
      items.sort((p, q) => q.z - p.z);
      // 발밑 그림자 먼저 (모두 땅 위)
      for (const it of items) {
        if (!it.a) continue;
        const a = it.a, [sx, sy, k] = P.p(a.x, 0, a.z);
        const w = (a.art.model.bbox.x1 - a.art.model.bbox.x0) * U * a.size * k * (a.fly ? 0.55 : 0.78);
        const lift = a.fly ? a.y : 0;
        const al = a.fly ? Math.max(0.25, 0.7 - lift * 0.2) : 1;
        g.globalAlpha = al;
        if (sd) {
          // 넓고 흐린 그림자(햇빛 반대쪽) + 발밑 진한 접지
          const q = P.p(a.x - (sd[0] / sd[1]) * 0.35, 0, a.z - (sd[2] / sd[1]) * 0.35);
          const w2 = w * 1.15;
          g.drawImage(shSpr, q[0] - w2 / 2, q[1] - w2 * 0.15, w2, w2 * 0.3);
          g.globalAlpha = al * 0.9;
          g.drawImage(shSpr, sx - w * 0.36, sy - w * 0.07, w * 0.72, w * 0.14);
          draws++;
        } else g.drawImage(shSpr, sx - w / 2, sy - w * 0.14, w, w * 0.28);
        draws++;
      }
      g.globalAlpha = 1;
      placed.length = 0;
      for (const it of items) {
        if (it.pr) {
          drawProp(it.pr, P);
          draws += 4;
          continue;
        }
        const a = it.a, art = a.art, ps = pose(a, t);
        const R0 = rootM(a, ps, P, cosT);
        const Gm = groupMs(a, ps, R0.M);
        const pcs = art.model.pieces, regs = art.regs, img = art.atlasF;
        for (let i = 0; i < pcs.length; i++) {
          const pc = pcs[i], r = regs[i];
          let M = Gm[pc.group] || R0.M;
          if (pc.kind === "eye" && ps.eye !== 1) M = mul(mul(mul(M, T(pc.cx, pc.cy)), Sc(1, ps.eye)), T(-pc.cx, -pc.cy));
          g.setTransform(M[0] * dpr, M[1] * dpr, M[2] * dpr, M[3] * dpr, M[4] * dpr, M[5] * dpr);
          g.drawImage(img, r.x, r.y, r.w, r.h, r.ox, r.oy, r.w / r.s, r.h / r.s);
          draws++;
        }
        placed.push({ a, M: R0.M, zc: R0.zc });
        // 하트
        if (a.heart >= 0) {
          const h = a.heart, top = ap(R0.M, a.art.model.foot[0], a.art.model.bbox.y0);
          const s = R0.k * 0.42 * (0.6 + Math.min(1, h * 3) * 0.4);
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.globalAlpha = Math.max(0, 1 - Math.max(0, h - 0.8) / 0.6);
          g.drawImage(heartCanvas(), top[0] - s / 2 + Math.sin(h * 6) * s * 0.15, top[1] - s - h * R0.k * 0.5, s, s);
          g.globalAlpha = 1;
          draws++;
        }
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      stat.draws = draws;
      stat.ms = performance.now() - t0;
    },
    hit(x, y) {
      let best = null;
      for (const p of placed) {
        const q = ap(inv(p.M), x, y), b = p.a.art.model.bbox;
        const mx = (b.x1 - b.x0) * 0.06, my = (b.y1 - b.y0) * 0.06;
        if (q[0] > b.x0 + mx && q[0] < b.x1 - mx && q[1] > b.y0 + my && q[1] < b.y1 - my) if (!best || p.zc < best.zc) best = p;
      }
      return best ? best.a : null;
    },
    stats() {
      return { draws: stat.draws, ms: stat.ms };
    },
    dispose() {
      cv.width = cv.height = 1;
      cv.remove();
      placed.length = 0;
    },
  };
}
