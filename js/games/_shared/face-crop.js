/* =====================================================================
   내 얼굴 사진 (공용) — 사진을 찍거나 골라서 얼굴만 동그랗게 맞춰 자르기
   const url = await KP.faceCrop.pick()   // 사진 고르기(기기가 '카메라/사진첩'을 물어봄) → 맞추기 화면 → JPEG dataURL(정사각형) / 취소면 null
   - 맞추기: 한 손가락으로 끌어 옮기기, 두 손가락으로 벌려 키우기, ➖ ➕ 버튼
   - 결과는 동그라미를 꼭 맞게 둘러싼 정사각형 (그릴 때 동그랗게 잘라 씀)
   - 사진은 이 기기 안에만 저장됨 (KP.db "photos") — 인터넷으로 보내지 않음
===================================================================== */
"use strict";
(function () {
  const OUT = 320; // 저장 크기(px)
  KP.css(
    "faceCrop",
    `.fcOv{position:fixed;inset:0;z-index:200;background:#1d2246;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
       padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));touch-action:none;user-select:none;-webkit-user-select:none}
     .fcTxt{color:#fff;font-size:clamp(18px,2.6vw,24px);text-align:center}
     .fcBox{position:relative;width:min(78vw,62vh);aspect-ratio:1;overflow:hidden;border-radius:24px;background:#000;touch-action:none}
     .fcBox img{position:absolute;left:0;top:0;transform-origin:0 0;max-width:none;pointer-events:none;will-change:transform}
     .fcRing{position:absolute;inset:8%;border-radius:50%;box-shadow:0 0 0 999px rgba(20,24,60,.62);border:4px solid #fff;pointer-events:none}
     .fcRow{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
     .fcRow .btn{min-width:64px}`
  );

  /** 파일 → Image (실패하면 null) */
  const loadFile = (file) =>
    new Promise((res) => {
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = rd.result;
      };
      rd.onerror = () => res(null);
      rd.readAsDataURL(file);
    });

  /** 사진 한 장 고르기 → File / 취소면 null */
  const pickFile = () =>
    new Promise((res) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      let done = false;
      const end = (f) => {
        if (done) return;
        done = true;
        inp.remove();
        res(f);
      };
      inp.addEventListener("cancel", () => end(null));
      // cancel 이벤트가 없는 기기: 창으로 돌아온 뒤에도 파일이 없으면 취소로 봄 (store.js pickPhotos 와 같은 방식)
      setTimeout(() => window.addEventListener("focus", () => setTimeout(() => !(inp.files && inp.files.length) && end(null), 3500), { once: true }), 300);
      inp.addEventListener("change", () => end((inp.files && inp.files[0]) || null));
      inp.click();
    });

  /** 맞추기 화면 → dataURL / 취소면 null */
  function crop(im) {
    return new Promise((res) => {
      const U = KP.u;
      const ov = U.el("div", "fcOv");
      const txt = U.el("div", "fcTxt", "얼굴이 동그라미 안에 꼭 맞게 옮겨 주세요");
      const box = U.el("div", "fcBox");
      const img = new Image();
      img.src = im.src;
      box.append(img, U.el("div", "fcRing"));
      const row = U.el("div", "fcRow");
      const bOut = U.btn(KP.E("➖"), "btn"),
        bIn = U.btn(KP.E("➕"), "btn"),
        bNo = U.btn(KP.E("✖") + " 그만", "btn"),
        bOk = U.btn(KP.E("✔️") + " 이 얼굴로", "btn primary");
      row.append(bOut, bIn, bNo, bOk);
      ov.append(txt, box, row);
      document.body.appendChild(ov);

      const B = () => box.clientWidth; // 상자 한 변(px)
      const iw = im.naturalWidth || im.width,
        ih = im.naturalHeight || im.height;
      // 처음: 사진 짧은 변이 동그라미(상자의 84%)를 꽉 채우게, 얼굴이 흔히 있는 위쪽(1/3)이 가운데 오게
      const minK = () => (B() * 0.84) / Math.min(iw, ih);
      let k = minK() * 1.15,
        x = 0,
        y = 0;
      const clampXY = () => {
        // 동그라미 안이 비지 않게 (사진이 동그라미 바깥으로 빠지지 않게)
        const b = B(),
          lo = b * 0.08,
          hi = b * 0.92;
        k = Math.max(minK(), Math.min(k, minK() * 6));
        x = Math.min(lo, Math.max(hi - iw * k, x));
        y = Math.min(lo, Math.max(hi - ih * k, y));
      };
      const show = () => {
        clampXY();
        img.style.transform = "translate(" + x + "px," + y + "px) scale(" + k + ")";
      };
      const centerOn = (fx, fy) => {
        x = B() / 2 - fx * iw * k;
        y = B() / 2 - fy * ih * k;
      };
      centerOn(0.5, ih > iw * 1.1 ? 0.36 : 0.45);
      show();
      const zoom = (f, cx = B() / 2, cy = B() / 2) => {
        const k0 = k;
        k = k * f;
        clampXY();
        const r = k / k0;
        x = cx - (cx - x) * r;
        y = cy - (cy - y) * r;
        show();
      };
      bIn.addEventListener("click", () => zoom(1.2));
      bOut.addEventListener("click", () => zoom(1 / 1.2));

      // 손가락: 하나는 옮기기, 둘은 키우기
      const pts = new Map();
      let last = null;
      const two = () => {
        const [a, b] = [...pts.values()];
        return { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      };
      box.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        box.setPointerCapture(e.pointerId);
        const r = box.getBoundingClientRect();
        pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
        last = pts.size === 2 ? two() : null;
      });
      box.addEventListener("pointermove", (e) => {
        const p = pts.get(e.pointerId);
        if (!p) return;
        const r = box.getBoundingClientRect(),
          nx = e.clientX - r.left,
          ny = e.clientY - r.top;
        if (pts.size === 1) {
          x += nx - p.x;
          y += ny - p.y;
          p.x = nx;
          p.y = ny;
          show();
          return;
        }
        p.x = nx;
        p.y = ny;
        const t = two();
        if (last && last.d > 10) {
          x += t.cx - last.cx;
          y += t.cy - last.cy;
          zoom(t.d / last.d, t.cx, t.cy);
        }
        last = t;
      });
      const up = (e) => {
        pts.delete(e.pointerId);
        last = pts.size === 2 ? two() : null;
      };
      box.addEventListener("pointerup", up);
      box.addEventListener("pointercancel", up);
      const onResize = () => show();
      addEventListener("resize", onResize);

      const finish = (v) => {
        removeEventListener("resize", onResize);
        ov.remove();
        res(v);
      };
      bNo.addEventListener("click", () => finish(null));
      bOk.addEventListener("click", () => {
        // 동그라미(상자의 8%~92%)를 둘러싼 정사각형을 잘라 저장
        const b = B(),
          c = document.createElement("canvas");
        c.width = c.height = OUT;
        const g = c.getContext("2d");
        g.fillStyle = "#fff";
        g.fillRect(0, 0, OUT, OUT);
        const sx = (b * 0.08 - x) / k,
          sy = (b * 0.08 - y) / k,
          sw = (b * 0.84) / k;
        g.drawImage(im, sx, sy, sw, sw, 0, 0, OUT, OUT);
        let url = null;
        try {
          url = c.toDataURL("image/jpeg", 0.88);
        } catch (e) {}
        finish(url);
      });
    });
  }

  KP.faceCrop = {
    crop,
    async pick() {
      const f = await pickFile();
      if (!f) return null;
      const im = await loadFile(f);
      if (!im) {
        KP.toast && KP.toast("사진을 열지 못했어요. 다른 사진으로 해 주세요");
        return null;
      }
      return crop(im);
    },
  };
})();
