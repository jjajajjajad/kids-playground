/* =====================================================================
   빌드 도구:  npm run build
   1) js/**, css/** 에서 쓰인 이모지를 모아 Fluent 일러스트 SVG로 추출 → assets/e/
      + 문자→파일 지도 js/gen/emoji-map.js
   2) 주아체 폰트 복사 → fonts/, css/fonts.css
   3) index.html 생성 (스크립트 순서: 코어 → 게임 → app.js)
   4) 오프라인용 sw.js 생성 (모든 파일 목록 + 내용 해시 버전)
===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const P = (...a) => path.join(ROOT, ...a);
const walk = (dir, ext) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(path.join(dir, d.name), ext) : ext.some((e) => d.name.endsWith(e)) ? [path.join(dir, d.name)] : []
      )
    : [];

/* ---------- 1) 이모지 → 일러스트 ---------- */
const icons = require("@iconify-json/fluent-emoji/icons.json");
const byEmoji = require("unicode-emoji-json/data-by-emoji.json");
// 이름이 다른 것 수동 지정
const OVERRIDE = {
  "👒": "womans-hat",
  "🔺": "red-triangle",
  "🔻": "red-triangle-pointed-down",
  "🅰️": "a-button-blood-type",
  "✖️": "multiply",
  "↩️": "right-arrow-curving-left",
  "🦸": "person-superhero",
  "👢": "womans-boot",
};
const CORE = ["kp", "GEN:emoji-map", "GEN:version", "art", "store", "settings", "audio", "voice", "ui", "drag", "celebrate", "home", "pages", "catalog"];

const srcFiles = [...walk(P("js"), [".js"]).filter((f) => !f.includes(path.join("js", "gen"))), ...walk(P("css"), [".css"])];
const RE = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|⃣|[\u{1F3FB}-\u{1F3FF}]|‍(?:\p{Extended_Pictographic}|[♀♂])️?)*|[#*0-9]️⃣/gu;
const used = new Set();
for (const f of srcFiles) for (const m of fs.readFileSync(f, "utf8").match(RE) || []) used.add(m);

function slugOf(e) {
  if (OVERRIDE[e]) return OVERRIDE[e];
  const d = byEmoji[e] || byEmoji[e.replace(/️/g, "")] || byEmoji[e + "️"];
  if (!d) return null;
  return d.slug.replace(/_/g, "-");
}
function svgOf(slug) {
  let ic = icons.icons[slug];
  if (!ic && icons.aliases && icons.aliases[slug]) ic = icons.icons[icons.aliases[slug].parent];
  if (!ic) return null;
  const w = ic.width || icons.width || 32,
    h = ic.height || icons.height || 32;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '">' + ic.body + "</svg>";
}
fs.rmSync(P("assets", "e"), { recursive: true, force: true });
fs.mkdirSync(P("assets", "e"), { recursive: true });
const map = {},
  missing = [];
for (const e of [...used].sort()) {
  const slug = slugOf(e);
  const svg = slug && svgOf(slug);
  if (!svg) {
    missing.push(e + (slug ? "(" + slug + ")" : ""));
    continue;
  }
  map[e] = slug;
  const noVs = e.replace(/️/g, "");
  if (noVs !== e) map[noVs] = slug;
  fs.writeFileSync(P("assets", "e", slug + ".svg"), svg);
}
fs.mkdirSync(P("js", "gen"), { recursive: true });
fs.writeFileSync(P("js", "gen", "emoji-map.js"), "/* 자동 생성 — tools/build.js */\nKP.EMAP=" + JSON.stringify(map) + ";\n");

/* ---------- 2) 폰트 ---------- */
const fontDir = P("node_modules", "@fontsource", "jua");
fs.rmSync(P("fonts"), { recursive: true, force: true });
fs.mkdirSync(P("fonts"), { recursive: true });
let fcss = fs.readFileSync(path.join(fontDir, "index.css"), "utf8");
fcss = fcss
  .replace(/url\(\.\/files\/([^)]+?\.woff2)\) format\('woff2'\), url\(\.\/files\/[^)]+?\.woff\) format\('woff'\)/g, (m, f) => {
    fs.copyFileSync(path.join(fontDir, "files", f), P("fonts", f));
    return "url(../fonts/" + f + ") format('woff2')";
  })
  .replace(/font-display: swap/g, "font-display: block");
fs.writeFileSync(P("css", "fonts.css"), "/* 자동 생성 — 주아체 (OFL-1.1) */\n" + fcss);

/* ---------- 3) index.html ---------- */
const gameFiles = walk(P("js", "games"), [".js"]).map((f) => path.relative(ROOT, f).split(path.sep).join("/")).sort();
const gameCss = walk(P("css", "games"), [".css"]).map((f) => path.relative(ROOT, f).split(path.sep).join("/")).sort();
const coreFiles = CORE.map((c) => (c.startsWith("GEN:") ? "js/gen/" + c.slice(4) + ".js" : "js/core/" + c + ".js"));
const allScripts = [...coreFiles, ...gameFiles, "js/core/app.js"];

/* ---------- 4) 버전 + sw.js ---------- */
const versioned = ["css/app.css", "css/fonts.css", ...gameCss, ...allScripts]; // index.html 에서 ?v=버전 을 붙여 부르는 파일
const precache = [
  "./",
  "index.html",
  "manifest.webmanifest",
  ...versioned,
  ...walk(P("fonts"), [".woff2"]).map((f) => "fonts/" + path.basename(f)),
  ...walk(P("assets"), [".svg", ".png", ".jpg", ".mp3", ".m4a"]).map((f) => path.relative(ROOT, f).split(path.sep).join("/")),
  ...walk(P("icons"), [".png"]).map((f) => "icons/" + path.basename(f)),
];
const h = crypto.createHash("sha1");
for (const f of precache) if (f !== "./" && f !== "index.html" && f !== "js/gen/version.js" && fs.existsSync(P(f))) h.update(f).update(fs.readFileSync(P(f)));
const VERSION = h.digest("hex").slice(0, 8);
const d = new Date(Date.now() + 9 * 3600e3); // KST
const stamp = d.toISOString().slice(0, 16).replace("T", " ");
fs.writeFileSync(P("js", "gen", "version.js"), "/* 자동 생성 */\nKP.VERSION=" + JSON.stringify(VERSION + " (" + stamp + " KST)") + ";\n");

const tpl = fs.readFileSync(P("tools", "index.template.html"), "utf8");
const html = tpl
  .replace(/__VERSION__/g, VERSION)
  .replace("__GAME_CSS__", gameCss.map((c) => '<link rel="stylesheet" href="' + c + "?v=" + VERSION + '">').join("\n"))
  .replace("__SCRIPTS__", allScripts.map((s) => '<script src="' + s + "?v=" + VERSION + '"></script>').join("\n"));
fs.writeFileSync(P("index.html"), html);

const sw = `/* 자동 생성 — tools/build.js. 아이 놀이터 오프라인 실행용 */
const VERSION = ${JSON.stringify(VERSION)};
const CACHE = "kids-playground-" + VERSION;
const VFILES = ${JSON.stringify(versioned)};
const FILES = ${JSON.stringify(precache.filter((f) => !versioned.includes(f)))}.concat(VFILES.map((f) => f + "?v=" + VERSION));
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // 화면(html)은 인터넷 우선 → 새 버전 즉시 반영, 나머지는 저장본 우선 → 빠르고 오프라인 가능
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => { caches.open(CACHE).then((c) => c.put("index.html", r.clone())); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  // 정확히 같은 버전(?v=)이 있으면 저장본, 없으면 인터넷(새 버전), 인터넷도 안 되면 아무 버전 저장본
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })))
  );
});
`;
fs.writeFileSync(P("sw.js"), sw);

const kb = (n) => (n / 1024).toFixed(0) + "KB";
const size = precache.filter((f) => f !== "./").reduce((s, f) => s + (fs.existsSync(P(f)) ? fs.statSync(P(f)).size : 0), 0);
console.log(`빌드 완료 v${VERSION}`);
console.log(` 게임 파일 ${gameFiles.length}개, 일러스트 ${Object.values(map).filter((v, i, a) => a.indexOf(v) === i).length}개, 오프라인 총용량 ${kb(size)}`);
if (missing.length) console.log(" ⚠ 일러스트 없음(기기 이모지로 표시):", missing.join(" "));
