/* 8종 모두 정리: node lab/doll/pipeline/clean-all.js
   원본(Tripo H3.1 무텍스처 GLB)은 저장소 밖(tools/out, gitignore)에 있음 — 결과 lab/doll/models/<종>.glb 만 커밋 */
const { execFileSync } = require("child_process");
const path = require("path");
const root = path.join(__dirname, "../../..");
const SRC = {
  dog: "tools/out/zoo-dog/dog-tripo.glb",
  cat: "tools/out/zoo-dolls/cat.glb", bear: "tools/out/zoo-dolls/bear.glb", rabbit: "tools/out/zoo-dolls/rabbit.glb",
  pig: "tools/out/zoo-dolls/pig.glb", lion: "tools/out/zoo-dolls/lion.glb", elephant: "tools/out/zoo-dolls/elephant.glb",
  dino: "tools/out/zoo-dolls/dino.glb",
};
const only = process.argv.slice(2);
for (const [k, f] of Object.entries(SRC)) {
  if (only.length && !only.includes(k)) continue;
  execFileSync(process.execPath, [path.join(__dirname, "clean.js"), path.join(root, f), path.join(__dirname, "../models", k + ".glb"), k], { stdio: "inherit", env: Object.assign({}, process.env, { CENTER: k === "dino" ? "head" : "" }) });
}
