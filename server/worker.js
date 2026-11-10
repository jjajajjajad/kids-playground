/* =====================================================================
   아이 놀이터 사용 통계 서버 (Cloudflare Worker + D1)
   - POST /e      : 앱이 모아 보낸 이벤트 묶음 { d: 기기번호, v: 앱버전, p: {기기정보}, e: [[시각, 종류, 놀이, 값...], ...] }
   - GET  /report?key=비밀키&days=7 : 집계 JSON (tools/stats-report.js 가 Excel 로 만듦)
   - GET  /       : 살아 있는지 확인
   개인정보 없음: 기기번호는 앱이 무작위로 만든 값, IP 는 저장하지 않음(나라 코드만).
===================================================================== */
const MAX_BODY = 64 * 1024; // 한 번에 받는 최대 크기
const MAX_EVENTS = 400;
const KINDS = new Set(["app", "open", "leave", "win", "miss", "lvl", "unlock", "err", "set"]);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS } });
const clean = (s, n) => (typeof s === "string" ? s.replace(/[^\w.\-:가-힣 ]/g, "").slice(0, n) : "");

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === "/" && req.method === "GET") return json({ ok: true, t: Date.now() });
    if (url.pathname === "/e" && req.method === "POST") return receive(req, env);
    if (url.pathname === "/report" && req.method === "GET") return report(url, env);
    return json({ error: "not found" }, 404);
  },
};

async function receive(req, env) {
  const len = +(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) return json({ error: "too big" }, 413);
  let b;
  try {
    b = await req.json();
  } catch (e) {
    return json({ error: "bad json" }, 400);
  }
  const dev = clean(b && b.d, 40);
  if (!dev || !Array.isArray(b.e) || !b.e.length) return json({ error: "bad body" }, 400);
  const ev = b.e.slice(0, MAX_EVENTS);
  const ver = clean(b.v, 40);
  const p = b.p && typeof b.p === "object" ? b.p : {};
  const country = req.headers.get("cf-ipcountry") || "";
  const now = Date.now();
  const stm = [];
  // 기기: 처음 보면 넣고, 아니면 마지막 접속·버전·기기정보 갱신
  stm.push(
    env.DB.prepare(
      "INSERT INTO devices (id, first_at, last_at, ver, platform, screen, dpr, lang, country, named, n_batches) VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1) " +
        "ON CONFLICT(id) DO UPDATE SET last_at=?2, ver=?3, platform=?4, screen=?5, dpr=?6, lang=?7, country=?8, named=?9, n_batches=n_batches+1"
    ).bind(dev, now, ver, clean(p.os, 20), clean(p.scr, 20), +p.dpr || 0, clean(p.lang, 10), country, p.named ? 1 : 0)
  );
  let n = 0;
  for (const e of ev) {
    if (!Array.isArray(e)) continue;
    const [t, kind, game, a, b2, c, eid] = e; // eid: 앱이 붙인 이벤트 고유 번호(없는 옛 버전은 null) — 같은 묶음을 다시 받아도 한 번만 저장
    if (!KINDS.has(kind)) continue;
    const ts = Number.isFinite(+t) && Math.abs(now - +t) < 90 * 86400e3 ? +t : now; // 시계가 이상한 기기는 받은 시각으로
    stm.push(env.DB.prepare("INSERT OR IGNORE INTO events (dev, t, kind, game, a, b, c, ver, eid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(dev, ts, kind, clean(game, 30), numOrNull(a), numOrNull(b2), clean(c, 40) || null, ver, clean(eid, 16) || null));
    n++;
  }
  if (stm.length > 1) await env.DB.batch(stm);
  return json({ ok: true, n });
}
const numOrNull = (v) => (Number.isFinite(+v) && v !== null && v !== "" ? +v : null);

async function report(url, env) {
  if (!env.REPORT_KEY || url.searchParams.get("key") !== env.REPORT_KEY) return json({ error: "no" }, 403);
  const days = Math.min(90, Math.max(1, +(url.searchParams.get("days") || 7)));
  const since = Date.now() - days * 86400e3;
  const q = async (sql, ...args) => (await env.DB.prepare(sql).bind(...args).all()).results;
  const [devices, byGame, daily, lvl, unlock, errs, ver] = await Promise.all([
    q("SELECT id, first_at, last_at, ver, platform, screen, dpr, lang, country, named, n_batches FROM devices ORDER BY last_at DESC"),
    // 놀이별: 연 횟수·기기 수·평균 시간·이김·틀림·중간 이탈(30초 안에 나감)
    q(
      `SELECT game,
         SUM(kind='open') AS opens,
         COUNT(DISTINCT CASE WHEN kind='open' THEN dev END) AS devs,
         ROUND(AVG(CASE WHEN kind='leave' THEN a END)) AS avg_sec,
         SUM(CASE WHEN kind='leave' AND a < 30 THEN 1 ELSE 0 END) AS quick_leave,
         SUM(kind='win') AS wins, SUM(kind='miss') AS misses,
         SUM(CASE WHEN kind='lvl' AND a>0 THEN 1 ELSE 0 END) AS lvl_up,
         SUM(CASE WHEN kind='lvl' AND a<0 THEN 1 ELSE 0 END) AS lvl_down,
         SUM(kind='err') AS errs
       FROM events WHERE t >= ?1 AND game != '' GROUP BY game ORDER BY opens DESC`,
      since
    ),
    q(
      `SELECT date(t/1000, 'unixepoch', '+9 hours') AS day,
         COUNT(DISTINCT dev) AS devs, SUM(kind='app') AS launches, SUM(kind='open') AS opens,
         ROUND(SUM(CASE WHEN kind='leave' THEN a ELSE 0 END)/60.0) AS play_min
       FROM events WHERE t >= ?1 GROUP BY day ORDER BY day`,
      since
    ),
    q("SELECT game, b AS lvl, COUNT(*) AS n FROM events WHERE t >= ?1 AND kind='open' AND b IS NOT NULL GROUP BY game, b ORDER BY game, b", since),
    q("SELECT c AS src, COUNT(*) AS n, ROUND(AVG(a)) AS avg_min FROM events WHERE t >= ?1 AND kind='unlock' GROUP BY c", since),
    q("SELECT game, c AS msg, COUNT(*) AS n, MAX(t) AS last_t FROM events WHERE t >= ?1 AND kind='err' GROUP BY game, c ORDER BY n DESC LIMIT 50", since),
    q("SELECT ver, COUNT(*) AS devs FROM devices GROUP BY ver ORDER BY devs DESC"),
  ]);
  return json({ days, since, generated: Date.now(), devices, byGame, daily, lvl, unlock, errs, ver });
}
