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
// 자연 음성 저장소 이름 — sw.js(옛 저장소 정리)와 voice.js(KP.VOICE_CACHE)가 함께 씀. 바꾸면 옛 저장소는 지워짐
const VOICE_CACHE = "kp-voice-1";
const CORE = ["kp", "GEN:emoji-map", "GEN:version", "art", "store", "settings", "audio", "voice", "GEN:clips", "ui", "drag", "paint", "notebook", "celebrate", "home", "earn", "pages", "catalog"];

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
// 일러스트 라이선스(MIT) 동봉 — 패키지에 LICENSE 파일이 없어 info.json(저작자·라이선스) + MIT 원문으로 작성
{
  const info = require("@iconify-json/fluent-emoji/info.json");
  fs.writeFileSync(
    P("assets", "e", "LICENSE.txt"),
    `Fluent Emoji — ${info.author.url} (${info.license.spdx}, ${info.license.url})\n\nMIT License\n\nCopyright (c) ${info.author.name}.\n\n` +
      'Permission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\n' +
      "The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\n" +
      'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n'
  );
}
fs.mkdirSync(P("js", "gen"), { recursive: true });
// 자연 음성(미리 만든 음성 파일) 목록: tools/voice-clips.tsv → js/gen/clips.js  (문장 → 주소)
{
  const tsv = fs.existsSync(P("tools", "voice-clips.tsv")) ? fs.readFileSync(P("tools", "voice-clips.tsv"), "utf8") : "";
  // 음성 주소는 index.html 의 CSP(media-src·connect-src)가 허용한 서버여야 재생됨 → 템플릿에서 허용 목록을 읽어 대조
  const csp = (/Content-Security-Policy" content="([^"]+)"/.exec(fs.readFileSync(P("tools", "index.template.html"), "utf8")) || [])[1] || "";
  const hostsOf = (dir) =>
    new Set(
      ((new RegExp("(?:^|;)\\s*" + dir + "\\s([^;]*)").exec(csp) || [])[1] || "")
        .split(/\s+/)
        .filter((x) => /^https:\/\//.test(x))
        .map((x) => new URL(x).host)
    );
  const media = hostsOf("media-src"),
    conn = hostsOf("connect-src");
  const clips = {},
    bad = new Set();
  tsv.split("\n").forEach((l) => {
    const [t, , url] = l.split("\t");
    if (!t || !url || !/^https:\/\//.test(url.trim())) return;
    const host = new URL(url.trim()).host;
    if (!media.has(host) || !conn.has(host)) return void bad.add(host);
    clips[t.trim()] = url.trim();
  });
  if (bad.size)
    throw new Error("음성 주소의 서버(" + [...bad].join(", ") + ")가 tools/index.template.html 의 CSP(media-src, connect-src)에 없습니다. 템플릿 CSP에 추가하거나 voice-clips.tsv 주소를 고치세요.");
  fs.writeFileSync(
    P("js", "gen", "clips.js"),
    "/* 자동 생성 — tools/voice-clips.tsv (ElevenLabs 음성, Higgsfield 생성) */\nKP.VOICE_CLIPS=" + JSON.stringify(clips) + ";\nKP.VOICE_CACHE=" + JSON.stringify(VOICE_CACHE) + ";\n"
  );
  console.log(" 자연 음성 " + Object.keys(clips).length + "개");
}
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
fs.copyFileSync(path.join(fontDir, "LICENSE"), P("fonts", "LICENSE-OFL.txt")); // 폰트 라이선스 동봉

/* ---------- 3) index.html ---------- */
const gameFiles = walk(P("js", "games"), [".js"]).map((f) => path.relative(ROOT, f).split(path.sep).join("/")).sort();
const gameCss = walk(P("css", "games"), [".css"]).map((f) => path.relative(ROOT, f).split(path.sep).join("/")).sort();
const coreFiles = CORE.map((c) => (c.startsWith("GEN:") ? "js/gen/" + c.slice(4) + ".js" : "js/core/" + c + ".js"));
const allScripts = [...coreFiles, ...gameFiles, "js/core/app.js"];

/* ---------- 4) 버전 + sw.js ---------- */
const optional = (f) => /^(assets|fonts|icons)\//.test(f); // sw.js 설치 때 몇 개 실패해도 되는 파일(그림·폰트)
const versioned = ["css/app.css", "css/fonts.css", ...gameCss, ...allScripts]; // index.html 에서 ?v=버전 을 붙여 부르는 파일
const precache = [
  "./",
  "index.html",
  "manifest.webmanifest",
  ...versioned,
  ...walk(P("fonts"), [".woff2"]).map((f) => "fonts/" + path.basename(f)),
  ...walk(P("assets"), [".svg", ".png", ".jpg", ".mp3", ".m4a", ".glb", ".bin"]).map((f) => path.relative(ROOT, f).split(path.sep).join("/")),
  ...walk(P("vendor"), [".js"]).map((f) => "vendor/" + path.basename(f)), // 3D 동물원(Three.js) — 필요할 때만 불러오지만 오프라인용으로 미리 저장
  ...walk(P("icons"), [".png"]).map((f) => "icons/" + path.basename(f)),
];
// 지문 계산용 읽기: 글자 파일은 줄바꿈을 LF 로 맞춤 (Windows 에서 CRLF 로 받아도 GitHub 은 LF 로 줌 → 지문이 어긋나면 업데이트 실패)
const readForHash = (f) => {
  const b = fs.readFileSync(P(f));
  return /\.(js|css|html|svg|json|webmanifest|txt)$/i.test(f) ? Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n"), "utf8") : b;
};
const h = crypto.createHash("sha1");
for (const f of precache) if (f !== "./" && f !== "index.html" && f !== "js/gen/version.js" && fs.existsSync(P(f))) h.update(f).update(readForHash(f));
const VERSION = h.digest("hex").slice(0, 8);
const d = new Date(Date.now() + 9 * 3600e3); // KST
const stamp = d.toISOString().slice(0, 16).replace("T", " ");
fs.writeFileSync(P("js", "gen", "version.js"), "/* 자동 생성 */\nKP.VERSION=" + JSON.stringify(VERSION + " (" + stamp + " KST)") + ";\n");

// 파일마다 내용 지문(8자리) — 내용이 바뀐 파일만 주소(?v=)가 바뀌어, 업데이트 때 바뀐 파일만 새로 받음
const FH = {};
for (const f of precache) if (f !== "./" && f !== "index.html" && fs.existsSync(P(f))) FH[f] = crypto.createHash("sha1").update(readForHash(f)).digest("hex").slice(0, 8);
const vurl = (f) => f + "?v=" + (FH[f] || VERSION);

const tpl = fs.readFileSync(P("tools", "index.template.html"), "utf8");
const html = tpl
  .replace(/(href|src)="([^"?]+)\?v=__VERSION__"/g, (m, a, f) => a + '="' + vurl(f) + '"')
  .replace(/__VERSION__/g, VERSION)
  .replace("__GAME_CSS__", gameCss.map((c) => '<link rel="stylesheet" href="' + vurl(c) + '">').join("\n"))
  .replace("__SCRIPTS__", allScripts.map((s) => '<script src="' + vurl(s) + '"></script>').join("\n"))
  .replace("</html>", "<!-- kp:" + VERSION + " -->\n</html>"); // 서비스 워커가 '이 버전' 화면인지 알아보는 표시
fs.writeFileSync(P("index.html"), html);
// 서비스 워커가 저장할 주소 → 지문 (코드·스타일은 주소에 지문이 들어 있고, 그림·폰트는 주소 그대로 + 지문으로 바뀜 여부 확인)
const urlOf = (f) => (versioned.includes(f) ? vurl(f) : f);
const MAN_CORE = {},
  MAN_EXTRA = {};
for (const f of precache) {
  if (f === "./" || f === "index.html") continue;
  (optional(f) ? MAN_EXTRA : MAN_CORE)[urlOf(f)] = FH[f] || VERSION;
}

const sw = `/* 자동 생성 — tools/build.js. 아이 놀이터 오프라인 실행용 */
const VERSION = ${JSON.stringify(VERSION)};
// 저장소는 하나로 고정 — 새 버전은 지난번 목록과 지문을 비교해 바뀐/새 파일만 받고, 빠진 파일은 지움
const CACHE = "kp-app";
const MANIFEST = "__kp_manifest__"; // 지난번에 받은 파일 목록과 지문 (저장소 안에 보관)
const VOICE_CACHE = ${JSON.stringify(VOICE_CACHE)};
// 꼭 필요한 파일(화면·코드·스타일) — 하나라도 못 받으면 설치 실패(옛 버전 그대로 유지)
const CORE = ${JSON.stringify(MAN_CORE)};
// 그림·폰트 — 몇 개 못 받아도(404·429) 설치는 진행, 빠진 건 쓸 때 받음
const EXTRA = ${JSON.stringify(MAN_EXTRA)};
const ALWAYS = ["./", "index.html"]; // 화면은 늘 새로
const req = (f) => new Request(f, { cache: "reload" });
const abs = (f) => new URL(f, self.registration.scope).href;
const KNOWN = new Set([...ALWAYS, ...Object.keys(CORE), ...Object.keys(EXTRA)].map(abs));
async function getMan(c, key) {
  try {
    const r = await c.match(key);
    return r ? await r.json() : {};
  } catch (e) {
    return {};
  }
}
const PREV = "__kp_manifest_prev__";
const UPD = "__kp_update_stats__"; // 이번 설치에서 받은 양 (넘겨받은 뒤 화면에 알리고 지움) // 직전 버전 목록 — 열려 있는 옛 화면이 쓰던 파일을 한 버전 동안 남겨 둠
const jres = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
// 받은 내용의 지문(build.js 와 같은 sha1 앞 8자리)
// 글자 파일은 줄바꿈을 LF 로 맞춰 계산 (build.js 의 readForHash 와 같은 규칙)
const TEXT = /\\.(js|css|html|svg|json|webmanifest|txt)(\\?|$)/i;
async function hashOf(r, url) {
  let buf = await r.clone().arrayBuffer();
  if (TEXT.test(url || "")) buf = new TextEncoder().encode(new TextDecoder().decode(buf).replace(/\\r\\n/g, "\\n"));
  const d = await crypto.subtle.digest("SHA-1", buf);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 8);
}
// 이미 가진 것이면 null, 아니면 저장할 응답 (아직 저장하지 않음 — 다 받은 뒤 한꺼번에)
async function need(c, old, url, hash, migrate) {
  const hit = await c.match(url);
  if (hit && (url.endsWith("?v=" + hash) || old[url] === hash)) return null; // 주소에 지문이 있거나 지난번 지문과 같음
  if (migrate) {
    // 처음 이 방식으로 바뀔 때: 옛 저장소의 그림·폰트를 내용이 같을 때만 옮겨 씀
    const prev = await caches.match(url);
    if (prev && (await hashOf(prev, url)) === hash) return prev;
  }
  const r = await fetch(req(url));
  if (!r.ok) throw new Error(url + " " + r.status);
  // 받은 내용이 이 버전의 지문과 같은지 확인 (받는 도중 다음 배포가 올라오면 다른 버전 내용이 섞일 수 있음 → 설치 중단, 다음에 다시)
  if ((await hashOf(r, url)) !== hash) throw Object.assign(new Error(url + " 내용이 이 버전과 다름"), { kpMismatch: true });
  r.kpNet = (await r.clone().arrayBuffer()).byteLength; // 인터넷에서 받은 크기(바이트) — 알림용
  return r;
}
// 화면에 진행 상황 알리기 (화면 쪽 app.js 가 '받는 중' 알림·'새 버전 준비' 창을 띄움)
// (clients.postMessage 로 보내면 다음 업데이트 때 새 서비스 워커가 '대기'에서 안 넘어가 앱이 안 열리는 문제가 있어 방송 채널로 보냄 — 2026-10-20 시험으로 확인)
const updCh = typeof BroadcastChannel === "function" ? new BroadcastChannel("kp-update") : null;
async function tell(m) {
  if (updCh) updCh.postMessage(Object.assign({ kp: "update" }, m));
}
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
     try {
      const c = await caches.open(CACHE);
      const old = await getMan(c, MANIFEST);
      const migrate = !Object.keys(old).length;
      // 1) 화면 + 꼭 필요한 파일: 전부 받은 것을 확인한 뒤에만 저장 (중간에 실패하면 아무것도 안 바꿈 → 옛 버전 그대로)
      const page = await Promise.all(ALWAYS.map(async (f) => {
        const r = await fetch(req(f));
        const t = r.ok ? await r.clone().text() : "";
        if (!t.includes("kp:" + VERSION)) throw new Error(f + " 이 버전 화면이 아님"); // 와이파이 로그인 화면·옛 화면 방지
        return [f, r];
      }));
      const core = Object.entries(CORE);
      const extra = Object.entries(EXTRA);
      const total = core.length + extra.length;
      let done = 0,
        changed = 0,
        fetched = 0,
        bytes = 0;
      const count = (r) => {
        if (r && r.kpNet !== undefined) {
          fetched++;
          bytes += r.kpNet;
        }
      };
      const got = [];
      for (let i = 0; i < core.length; i += 8) {
        const rs = await Promise.all(core.slice(i, i + 8).map(([u, h]) => need(c, old, u, h, false)));
        rs.forEach((r, k) => {
          if (r) got.push([core[i + k][0], r]);
          count(r);
        });
        done += rs.length;
        changed = got.length;
        await tell({ phase: "progress", done, total, changed, fetched, bytes });
      }
      // 2) 그림·폰트 받기 (못 받은 건 쓸 때 받음). 내용이 다르면(받는 도중 다른 배포) 설치 전체를 멈춤
      const man = Object.assign({}, CORE);
      const exGot = [],
        exDrop = [];
      for (let i = 0; i < extra.length; i += 8) {
        const part = extra.slice(i, i + 8);
        const rs = await Promise.allSettled(part.map(([u, h]) => need(c, old, u, h, migrate)));
        const mis = rs.find((r) => r.status === "rejected" && r.reason && r.reason.kpMismatch);
        if (mis) throw mis.reason;
        for (let k = 0; k < part.length; k++) {
          const [u, h] = part[k];
          if (rs[k].status === "fulfilled") {
            if (rs[k].value) {
              count(rs[k].value);
              exGot.push([u, h, rs[k].value]);
            } else man[u] = h;
          } else if (old[u] && old[u] !== h) exDrop.push(u); // 바뀐 걸 못 받음 → 옛 것을 지워 쓸 때 새로 받게
        }
        done += part.length;
        await tell({ phase: "progress", done, total, changed: got.length + exGot.length, fetched, bytes });
      }
      // 3) 여기까지 모두 확인됐을 때만 저장 시작 (코드 → 그림 → 화면 순, 화면이 마지막이라 중간에 멈춰도 옛 화면으로 열림)
      for (const [u, r] of got) await c.put(u, r);
      changed = got.length;
      for (const [u, h, r] of exGot) {
        try {
          await c.put(u, r);
          man[u] = h;
          changed++;
        } catch (err) {} // 저장 공간 부족 등 — 이 파일만 빠짐(쓸 때 받음)
      }
      for (const u of exDrop) await c.delete(u);
      for (const [f, r] of page) await c.put(f, r);
      await c.put(PREV, jres(old));
      await c.put(MANIFEST, jres(man));
      // 옛 방식 저장소(kids-playground-버전)는 새 방식으로 한 번 바뀐 다음 업데이트 때 지움 (열려 있던 옛 화면 보호)
      if (!migrate) for (const k of await caches.keys()) if (k.startsWith("kids-playground-")) await caches.delete(k);
      // '준비됐어요'는 새 서비스 워커가 완전히 넘겨받은 뒤(activate)에 알림 — 넘겨받는 순간 화면이 그림을 불러오면 넘겨받기가 멈춰 앱이 안 열리는 문제가 있었음(2026-10-20 시험으로 확인)
      await c.put(UPD, jres({ changed, fetched, bytes }));
      await self.skipWaiting();
     } catch (err) {
      await tell({ phase: "fail" });
      throw err; // 설치 실패 → 옛 버전 그대로
     }
    })()
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      // 옛 음성 저장소 지우기
      for (const k of await caches.keys()) if (k !== CACHE && k !== VOICE_CACHE && !k.startsWith("kids-playground-")) await caches.delete(k);
      // 이번 목록과 직전 버전 목록 어디에도 없는 파일만 지움
      const c = await caches.open(CACHE);
      const keep = new Set([...KNOWN, ...Object.keys(await getMan(c, PREV)).map(abs), abs(MANIFEST), abs(PREV), abs(UPD)]);
      for (const r of await c.keys()) if (!keep.has(r.url)) await c.delete(r);
      await self.clients.claim();
      const st = await getMan(c, UPD);
      await c.delete(UPD);
      if (st.changed) await tell({ phase: "ready", changed: st.changed, fetched: st.fetched || 0, bytes: st.bytes || 0, version: VERSION });
    })()
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // 화면(html)은 인터넷 우선 → 새 버전 즉시 반영, 나머지는 저장본 우선 → 빠르고 오프라인 가능
  // 단 3초 안에 답이 없으면(인터넷 안 되는 와이파이 등) 저장본으로 먼저 열고, 받는 건 계속해서 저장만
  if (e.request.mode === "navigate") {
    let saved = null;
    const net = fetch(e.request).then((r) => {
      // 정상 응답이고 '이 버전'의 화면일 때만 저장 (와이파이 로그인 화면·오류 페이지·다른 버전 저장 방지)
      if (r.ok && (r.headers.get("content-type") || "").includes("text/html")) {
        saved = r.clone().text().then((t) => { if (t.includes("kp:" + VERSION)) return caches.open(CACHE).then((c) => c.put("index.html", new Response(t, { headers: { "Content-Type": "text/html; charset=utf-8" } }))); });
      }
      return r;
    });
    e.waitUntil(net.then(() => saved).catch(() => {})); // 저장본으로 먼저 열어도 받기·저장은 끝까지
    e.respondWith(new Promise((resolve) => {
      let sent = false;
      const give = (r) => { if (!sent && r) { sent = true; resolve(r); } };
      const fromCache = () => caches.open(CACHE).then((c) => c.match("index.html")).then((r) => r || caches.match("index.html")); // 지금 저장소의 화면 먼저
      // 저장본이 없으면(첫 방문) 인터넷을 계속 기다림
      const t = setTimeout(() => fromCache().then(give), 3000);
      net.then((r) => { clearTimeout(t); give(r); }, () => { clearTimeout(t); fromCache().then((c) => give(c || Response.error())); });
    }));
    return;
  }
  // 정확히 같은 버전(?v=)이 있으면 저장본, 없으면 인터넷(새 버전), 인터넷도 안 되면 아무 버전 저장본
  e.respondWith(
    caches.open(CACHE).then((c) => c.match(e.request)).then((h) => h || caches.match(e.request)).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok && KNOWN.has(url.href)) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
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
