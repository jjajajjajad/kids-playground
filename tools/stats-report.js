/* =====================================================================
   사용 통계 → Excel:  node tools/stats-report.js [일수=7]
   .env 의 KP_STATS_URL(서버 주소)·KP_STATS_KEY(비밀키)를 읽어 /report 를 받아 tools/out/stats/사용통계_날짜.xlsx 로 저장
===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const ROOT = path.resolve(__dirname, "..");
const env = {};
try {
  for (const l of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(l);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e) {}
const URL_ = process.env.KP_STATS_URL || env.KP_STATS_URL, KEY = process.env.KP_STATS_KEY || env.KP_STATS_KEY; // 환경 변수가 있으면 우선 (시험용)
if (!URL_ || !KEY) {
  console.error(".env 에 KP_STATS_URL 과 KP_STATS_KEY 가 필요합니다 (server/README.md)");
  process.exit(1);
}
const days = Math.max(1, +(process.argv[2] || 7));
const kst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
(async () => {
  const r = await fetch(URL_.replace(/\/$/, "") + "/report?days=" + days + "&key=" + encodeURIComponent(KEY));
  if (!r.ok) throw new Error("서버 응답 " + r.status + " " + (await r.text()));
  const d = await r.json();
  const wb = new ExcelJS.Workbook();
  wb.creator = "장동훈";
  wb.company = "한맥중공업";
  wb.created = wb.modified = new Date();
  const sheet = (name, cols, rows) => {
    const ws = wb.addWorksheet(name);
    ws.columns = cols.map(([header, key, width]) => ({ header, key, width: width || 14 }));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    rows.forEach((o) => ws.addRow(o));
    return ws;
  };
  const gameName = (id) => id || "(앱 전체)";
  sheet("요약", [["항목", "k", 28], ["값", "v", 40]], [
    { k: "기간", v: "최근 " + d.days + "일 (" + kst(d.since) + " ~ " + kst(d.generated) + " KST)" },
    { k: "기기 수(전체 누적)", v: d.devices.length },
    { k: "기간 내 접속 기기", v: d.devices.filter((x) => x.last_at >= d.since).length },
    { k: "놀이 연 횟수", v: d.byGame.reduce((s, g) => s + (g.opens || 0), 0) },
    { k: "놀이 시간 합계(분)", v: d.daily.reduce((s, x) => s + (x.play_min || 0), 0) },
    { k: "오류 건수", v: d.errs.reduce((s, x) => s + x.n, 0) },
  ]);
  sheet("일별", [["날짜", "day", 12], ["기기 수", "devs"], ["켠 횟수", "launches"], ["놀이 연 횟수", "opens"], ["놀이 시간(분)", "play_min"]], d.daily);
  sheet(
    "놀이별",
    [["놀이", "game", 16], ["연 횟수", "opens"], ["기기 수", "devs"], ["평균 머문 초", "avg_sec"], ["30초 안에 나감", "quick_leave"], ["이김", "wins"], ["틀림", "misses"], ["틀림 비율", "miss_rate"], ["단계 ↑", "lvl_up"], ["단계 ↓", "lvl_down"], ["오류", "errs"]],
    d.byGame.map((g) => Object.assign({}, g, { game: gameName(g.game), miss_rate: g.wins + g.misses ? Math.round((100 * g.misses) / (g.wins + g.misses)) + "%" : "" }))
  );
  sheet("단계 분포", [["놀이", "game", 16], ["열 때 단계", "lvl"], ["횟수", "n"]], d.lvl.map((x) => Object.assign({}, x, { game: gameName(x.game) })));
  sheet("문 열기", [["방법", "src", 14], ["횟수", "n"], ["평균 분", "avg_min"]], d.unlock);
  sheet("오류", [["놀이", "game", 16], ["메시지", "msg", 50], ["횟수", "n"], ["마지막", "last"]], d.errs.map((x) => Object.assign({}, x, { game: gameName(x.game), last: kst(x.last_t) })));
  sheet(
    "기기",
    [["기기번호", "id", 26], ["처음", "first", 17], ["마지막", "last", 17], ["버전", "ver", 10], ["기기", "platform", 16], ["화면", "screen", 12], ["배율", "dpr", 6], ["언어", "lang", 8], ["나라", "country", 6], ["이름 설정", "named", 9], ["묶음 수", "n_batches", 8]],
    d.devices.map((x) => Object.assign({}, x, { first: kst(x.first_at), last: kst(x.last_at), named: x.named ? "예" : "" }))
  );
  sheet("버전", [["버전", "ver", 12], ["기기 수", "devs"]], d.ver);
  const dir = path.join(ROOT, "tools", "out", "stats");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "사용통계_" + kst(Date.now()).slice(0, 10) + ".xlsx");
  await wb.xlsx.writeFile(out);
  console.log("저장:", out, "| 기기", d.devices.length, "대, 놀이별", d.byGame.length, "개");
})().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
