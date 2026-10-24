/* 로컬 확인용 간단 서버: node tools/serve.js [port]  (같은 와이파이 기기에서 접속 가능하도록 모든 주소에서 받음) */
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), port = +process.argv[2] || 8765;
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json", ".mp3": "audio/mpeg", ".jpg": "image/jpeg" };
http.createServer((req, res) => {
  let p;
  try {
    p = decodeURIComponent(req.url.split("?")[0]);
  } catch (e) {
    res.writeHead(400);
    return res.end("bad request");
  }
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  const rel = path.relative(ROOT, f);
  // 폴더 밖(..)·숨김 폴더/파일(.git, .claude, .env 등)·node_modules 는 보여 주지 않음
  const bad = !rel || rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).some((s) => s.startsWith(".") || s === "node_modules");
  if (bad || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": T[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log("serving on " + port));
