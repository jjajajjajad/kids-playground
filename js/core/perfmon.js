/* =====================================================================
   렉 측정 (부모 설정 → 렉 측정) — 실제 기기에서 화면마다 끊김을 기록
   - 켜 두면 매 장면 간격을 재서 화면(홈·놀이·축하)별로 모음 → 설정 화면 표 · 복사해서 보내기
   - '연 놀이 수'별로도 모아서 쓸수록 느려지는지 봄 (앱을 새로 열면 0부터)
   - 꺼 두면 아무것도 하지 않음
   KP.perf.on() · set(bool) · badge() · setBadge(bool) · report() → 글자 · clear()
===================================================================== */
"use strict";
(function (KP) {
  const S = KP.store;
  const KEY = "perf:data";
  let data = null, // { s: {화면: {f,t,j,b,w,n}}, g: {누적구간: {f,t,j,b}}, since, mem }
    raf = 0,
    last = 0,
    cur = "",
    opened = 0, // 이번에 앱을 연 뒤 연 놀이 수
    saveAt = 0,
    badgeEl = null,
    bF = 0,
    bT = 0;
  const load = () => (data = data || S.get(KEY, null) || { s: {}, g: {}, since: Date.now() });
  const bucket = () => (opened < 5 ? "0~4개" : opened < 10 ? "5~9개" : opened < 20 ? "10~19개" : opened < 40 ? "20~39개" : "40개 이상");
  const where = () => {
    const c = KP.current && KP.current();
    const id = c ? c.id : document.querySelector(".panel") ? "(설정)" : "(홈)";
    return KP.celebrating ? id + " 축하" : id;
  };
  const add = (o, dt) => {
    o.f = (o.f || 0) + 1;
    o.t = (o.t || 0) + dt;
    if (dt > 50) o.j = (o.j || 0) + 1; // 한 장이 50ms 넘게 걸림 = 눈에 띄는 끊김
    if (dt > 250) o.b = (o.b || 0) + 1; // 0.25초 넘게 멈춤
    if (dt > (o.w || 0)) o.w = Math.round(dt);
  };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = now - last;
    last = now;
    if (document.hidden || dt <= 0 || dt > 1500) return; // 가려졌다 돌아온 틈은 빼기
    const w = where();
    if (w !== cur) {
      if (KP.current && KP.current() && !/ 축하$/.test(w) && w !== cur.replace(/ 축하$/, "")) opened++;
      cur = w;
      const o = (data.s[w] = data.s[w] || {});
      o.n = (o.n || 0) + 1;
      return; // 화면이 바뀐 첫 장은 여는 데 걸린 시간이라 빼기
    }
    add((data.s[w] = data.s[w] || { n: 1 }), dt);
    add((data.g[bucket()] = data.g[bucket()] || {}), dt);
    const m = performance.memory;
    if (m && m.usedJSHeapSize > (data.mem || 0)) data.mem = m.usedJSHeapSize;
    if (badgeEl) {
      bF++;
      bT += dt;
      if (bT > 1000) {
        badgeEl.textContent = Math.round((bF * 1000) / bT) + "fps";
        badgeEl.style.color = bF * 1000 < bT * 30 ? "#e5484d" : bF * 1000 < bT * 50 ? "#d58a00" : "#2a9d4b";
        bF = bT = 0;
      }
    }
    if (now > saveAt) {
      saveAt = now + 10000;
      S.set(KEY, data);
    }
  }
  function start() {
    if (raf) return;
    load();
    last = performance.now();
    saveAt = last + 10000;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    S.set(KEY, data);
  }
  function showBadge(on) {
    if (on && !badgeEl) {
      badgeEl = KP.u.el("div", "perfBadge", "");
      badgeEl.style.cssText = "position:fixed;left:max(4px,env(safe-area-inset-left));bottom:max(4px,env(safe-area-inset-bottom));z-index:99999;pointer-events:none;font:700 12px/1 system-ui,sans-serif;padding:3px 6px;border-radius:8px;background:rgba(255,255,255,.85)";
      document.body.appendChild(badgeEl);
    } else if (!on && badgeEl) {
      badgeEl.remove();
      badgeEl = null;
    }
  }
  document.addEventListener("visibilitychange", () => document.hidden && raf && S.set(KEY, data));

  function gpu() {
    try {
      const g = document.createElement("canvas").getContext("webgl");
      if (!g) return "WebGL 없음";
      const x = g.getExtension("WEBGL_debug_renderer_info");
      const r = x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER);
      const lose = g.getExtension("WEBGL_lose_context");
      lose && lose.loseContext();
      return String(r);
    } catch (e) {
      return "?";
    }
  }
  const fps = (o) => (o.t ? Math.round((o.f * 1000) / o.t) : 0);
  const name = (id) => {
    const base = id.replace(/ 축하$/, "");
    const g = KP.GAMES && KP.GAMES[base];
    return (g ? g.name + " (" + base + ")" : base) + (base !== id ? " 축하" : "");
  };

  KP.perf = {
    on: () => S.get("perf:on", false) === true,
    set(on) {
      S.set("perf:on", !!on);
      on ? start() : (stop(), showBadge(false));
      if (on && KP.perf.badge()) showBadge(true);
    },
    badge: () => S.get("perf:badge", false) === true,
    setBadge(on) {
      S.set("perf:badge", !!on);
      showBadge(on && KP.perf.on());
    },
    clear() {
      data = { s: {}, g: {}, since: Date.now() };
      cur = "";
      S.set(KEY, data);
    },
    /** 화면별 목록 (느린 것 먼저) — 너무 짧게 본 화면(약 5초 미만)은 빼기 */
    rows() {
      load();
      return Object.entries(data.s)
        .filter(([, o]) => o.t >= 5000)
        .map(([id, o]) => ({ id, name: name(id), fps: fps(o), jank: Math.round(((o.j || 0) * 1000) / (o.f || 1)) / 10, freeze: o.b || 0, worst: o.w || 0, sec: Math.round(o.t / 1000), n: o.n || 0 }))
        .sort((a, b) => a.fps - b.fps || b.jank - a.jank);
    },
    groups() {
      load();
      return ["0~4개", "5~9개", "10~19개", "20~39개", "40개 이상"].filter((k) => data.g[k] && data.g[k].t >= 5000).map((k) => ({ k, fps: fps(data.g[k]), jank: Math.round(((data.g[k].j || 0) * 1000) / data.g[k].f) / 10 }));
    },
    /** 보내기용 글자 */
    report() {
      load();
      const q = S.keys().filter((k) => /:q$/.test(k)).map((k) => k + "=" + JSON.stringify(S.get(k, null) && S.get(k, null).q != null ? S.get(k, null).q : S.get(k, null)));
      const L = [
        "[렉 측정] 버전 " + (KP.VERSION || "dev") + " · 기록 시작 " + new Date(data.since).toLocaleString("ko-KR"),
        "기기: " + navigator.userAgent,
        "화면 " + screen.width + "x" + screen.height + " · 배율 " + (devicePixelRatio || 1) + " · 코어 " + (navigator.hardwareConcurrency || "?") + " · 메모리 " + (navigator.deviceMemory || "?") + "GB · 그래픽 " + gpu(),
        "최대 사용 메모리(JS) " + (data.mem ? Math.round(data.mem / 1e6) + "MB" : "?") + " · 3D 화질 " + (q.join(", ") || "-"),
        "지금 열어 둔 놀이 화면 " + document.querySelectorAll(".screen.game").length + "개 · 그림판 메모리 약 " + Math.round([...document.querySelectorAll("canvas")].reduce((n, c) => n + c.width * c.height * 4, 0) / 1e6) + "MB · 앱 켜진 지 " + Math.round(performance.now() / 60000) + "분",
        "",
        "화면 | 초당 장수 | 끊김% | 멈춤(0.25초+) | 최악ms | 본 시간(초) | 들어간 횟수",
      ];
      KP.perf.rows().forEach((r) => L.push([r.name, r.fps, r.jank, r.freeze, r.worst, r.sec, r.n].join(" | ")));
      L.push("", "연 놀이 수 | 초당 장수 | 끊김%");
      KP.perf.groups().forEach((g) => L.push([g.k, g.fps, g.jank].join(" | ")));
      return L.join("\n");
    },
  };
  if (KP.perf.on()) {
    start();
    if (KP.perf.badge()) (document.body ? showBadge(true) : addEventListener("DOMContentLoaded", () => showBadge(true)));
  }
})(window.KP);
