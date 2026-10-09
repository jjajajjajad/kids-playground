/* =====================================================================
   끌어다 놓기 엔진 (손가락/마우스 공통, 멀티터치 안전)

   KP.drag(el, {
     targets: () => [요소...]          // 놓을 수 있는 자리들
     accept:  (target, el) => bool      // 이 자리에 맞는가? (기본: 항상 true)
     onPick:  (el) => {}                // 집었을 때
     onMove:  (x, y, el) => {}          // 움직일 때 (화면 좌표)
     onDrop:  (target|null, el) => {}   // 놓은 뒤 (자리 맞으면 target, 아니면 null)
     onReject:(target, el) => {}        // 틀린 자리에 놓았을 때
     snap: true                         // 맞으면 자리 가운데로 쏙 이동
     pad: 24                            // 자리 판정 여유(px)
   })
   반환: { lock(), unlock(), home() }
   - 틀리거나 빈 곳에 놓으면 제자리로 부드럽게 돌아간다.
   - snap 후 onDrop 에서 target.appendChild(el) 등 재배치를 하면 된다.
===================================================================== */
"use strict";
(function (KP) {
  KP.drag = function (el, o = {}) {
    let pid = null,
      sx = 0,
      sy = 0,
      dx = 0,
      dy = 0,
      locked = false,
      hover = null;
    const pad = o.pad == null ? 24 : o.pad;
    el.classList.add("draggable");
    el.style.touchAction = "none";

    function targets() {
      const t = typeof o.targets === "function" ? o.targets() : o.targets || [];
      return t.filter(Boolean);
    }
    function hit(x, y) {
      let best = null,
        bd = 1e9;
      for (const t of targets()) {
        const r = t.getBoundingClientRect();
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) {
          const d = KP.u.dist(x, y, r.left + r.width / 2, r.top + r.height / 2);
          if (d < bd) {
            bd = d;
            best = t;
          }
        }
      }
      return best;
    }
    function setHover(t) {
      if (hover === t) return;
      if (hover) hover.classList.remove("dropHover");
      hover = t;
      if (hover) hover.classList.add("dropHover");
    }
    function goHome() {
      el.style.transition = "transform .28s cubic-bezier(.3,1.4,.5,1)";
      el.style.transform = "";
      setTimeout(() => {
        el.style.transition = "";
        el.classList.remove("dragging");
      }, 300);
    }

    el.addEventListener("pointerdown", (e) => {
      if (locked || pid !== null) return;
      e.preventDefault();
      e.stopPropagation();
      KP.audio && KP.audio.unlock();
      pid = e.pointerId;
      try {
        el.setPointerCapture(pid);
      } catch (_) {}
      sx = e.clientX;
      sy = e.clientY;
      dx = dy = 0;
      el.style.transition = "";
      el.classList.add("dragging");
      KP.audio && KP.audio.sfx("pick");
      o.onPick && o.onPick(el);
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      e.preventDefault();
      dx = e.clientX - sx;
      dy = e.clientY - sy;
      el.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.12)";
      setHover(hit(e.clientX, e.clientY));
      o.onMove && o.onMove(e.clientX, e.clientY, el);
    });
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      setHover(null);
      const t = hit(e.clientX, e.clientY);
      if (t && (!o.accept || o.accept(t, el))) {
        if (o.snap !== false) {
          const er = el.getBoundingClientRect(),
            tr = t.getBoundingClientRect();
          const ex = er.left + er.width / 2 - dx,
            ey = er.top + er.height / 2 - dy; // 원래 중심
          const tx = tr.left + tr.width / 2 - ex,
            ty = tr.top + tr.height / 2 - ey;
          el.style.transition = "transform .18s ease-out";
          el.style.transform = "translate(" + tx + "px," + ty + "px)";
          setTimeout(() => {
            el.style.transition = "";
            el.classList.remove("dragging");
            // 쏙 들어가는 사이에 상황이 바뀌었으면(두 손가락으로 동시에 넣기 등) 제자리로
            if (locked || !targets().includes(t) || (o.accept && !o.accept(t, el))) return goHome();
            o.onDrop && o.onDrop(t, el);
          }, 190);
        } else {
          el.classList.remove("dragging");
          o.onDrop && o.onDrop(t, el);
        }
      } else {
        if (t && o.onReject) o.onReject(t, el);
        goHome();
        if (!t && o.onDrop) o.onDrop(null, el);
      }
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", (e) => {
      if (e.pointerId === pid) end(e);
    });

    return {
      lock() {
        locked = true;
        el.classList.add("locked");
      },
      unlock() {
        locked = false;
        el.classList.remove("locked");
      },
      home: goHome,
    };
  };
})(window.KP);
