/* =====================================================================
   인형 따라가기 (공용) — 2D 그림(도구·악기·스티커·증상 꾸밈)을 인형의 부위 기준점에 붙여 매 장면 따라가게
   - 바깥 껍데기(cls, 기본 dfT)만 옮김 → 안쪽 그림은 회전·톡 튀기 같은 자기 효과를 마음대로 써도 됨
   - dx·dy 는 인형 화면 키(dh) 비율 → 기기 크기·인형 크기가 달라도 같은 자리
   const fw = KP.dollFollow(layer, act, { cls })
     fw.add(el, 부위, dx, dy, rot) → o (o.nm·o.dx·o.dy·o.rot 은 나중에 바꿔도 됨) · fw.find(el) · fw.remove(el)(따라가기만 멈춤)
     fw.kill(el)(지우기) · fw.update() 매 장면 (dh 를 돌려줌) · fw.clear()
===================================================================== */
"use strict";
(function () {
  KP.css(
    "dollFollow",
    `.dfT{position:absolute;left:0;top:0;pointer-events:none;will-change:transform}
     .dfT>*{position:relative;display:block}`
  );
  KP.dollFollow = function (layer, act, opt = {}) {
    const cls = opt.cls || "dfT";
    const list = [];
    const fw = {
      dh: 300,
      list,
      add(el, nm, dx = 0, dy = 0, rot = 0) {
        const w = KP.u.el("span", cls);
        w.appendChild(el);
        layer.appendChild(w);
        const o = { el: w, inner: el, nm, dx, dy, rot };
        list.push(o);
        if (act) fw.place(o);
        return o;
      },
      find(el) {
        return list.find((o) => o.inner === el || o.el === el) || null;
      },
      remove(el) {
        const i = list.findIndex((o) => o.inner === el || o.el === el);
        if (i >= 0) list.splice(i, 1);
      },
      kill(el) {
        const o = fw.find(el);
        fw.remove(el);
        (o ? o.el : el).remove();
      },
      clear() {
        list.splice(0).forEach((o) => o.el.remove());
      },
      place(o) {
        const p = act.anchor(o.nm), dh = fw.dh;
        o.el.style.transform = `translate(${p.x + o.dx * dh}px,${p.y + o.dy * dh}px) translate(-50%,-50%)` + (o.rot ? ` rotate(${o.rot}deg)` : "");
      },
      /** 매 장면: 인형 화면 키를 재고 붙은 것들을 옮김 */
      update() {
        fw.dh = Math.max(60, act.box().h);
        for (const o of list) fw.place(o);
        return fw.dh;
      },
    };
    return fw;
  };
})();
