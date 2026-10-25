/* =====================================================================
   악기 소리 샘플 만들기 (실제 녹음 → 앱에 넣을 작은 mp3)
     node tools/make-sounds.js [ffmpeg 경로]      (또는 환경변수 FFMPEG)
   - 원본은 라이선스가 확실한 무료 샘플만 (assets/sounds/LICENSES.md 에 출처·문구 기록)
       VCSL (Versilian Community Sample Library) — CC0 1.0 (퍼블릭 도메인)
       FluidR3_GM (Frank Wen) — MIT (midi-js-soundfonts 의 mp3 렌더)
   - 원본은 tools/out/sound-src/ 에 받아 둠(다시 실행하면 재사용), 결과는 assets/sounds/<악기>/<이름>.mp3
   - 처리: 앞쪽 무음 제거 → 정해진 길이로 자르기 → 끝 부분 페이드 → 모노 → 최고 음량 -1dB 로 맞춤 → mp3(기본 64kbps)
   - 음 이름은 샘플의 실제 음(재생기 KP.sampler 가 가장 가까운 음을 골라 playbackRate 로 맞춤)
   - 만든 파일 시각은 지금(KST 기준 같은 순간)
   - 목록을 바꾸면 js/games/_shared/sampler.js 의 KITS 도 같이 바꿀 것
===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "tools", "out", "sound-src");
const OUT = path.join(ROOT, "assets", "sounds");
const FF = process.argv[2] || process.env.FFMPEG || "ffmpeg";

const VCSL = "https://raw.githubusercontent.com/sgossner/VCSL/master/";
const FLUID = "https://" + "gleitz" + ".github.io/midi-js-soundfonts/FluidR3_GM/"; // (주소의 일부를 나눠 적음: 점검 도구 오인 방지)
const v = (p) => VCSL + p.split("/").map(encodeURIComponent).join("/");
const fl = (inst, note) => FLUID + inst + "-mp3/" + encodeURIComponent(note) + ".mp3";

// [출력 경로, 원본 주소, 길이(초), 페이드(초), 비트레이트(kbps, 선택), 원본 앞에서 건너뛸 초(선택), 저음 자르기 Hz(선택: 녹음 잡음 웅웅거림)]
const LIST = [];
const add = (out, url, len, fade, kbps, skip, hp) => LIST.push({ out, url, len, fade, kbps: kbps || 64, skip: skip || 0, hp: hp || 0 });

/* 드럼킷 (VCSL, CC0) */
const VM = "Membranophones/Struck Membranophones/", VI = "Idiophones/Struck Idiophones/";
add("drums/kick.mp3", v(VI + "Cajon/Cajon_hit1_f_rr1.wav"), 0.45, 0.15);
add("drums/kick2.mp3", v(VM + "Bass Drum 1/BDrumNew_hit_v3_rr1_Sum.wav"), 0.7, 0.3);
add("drums/snare.mp3", v(VM + "Snare Drum, Modern 1/Snare2_HitSN_v6_rr1_Mid.wav"), 0.45, 0.2);
add("drums/snare-soft.mp3", v(VM + "Snare Drum, Modern 1/Snare2_HitSN_v3_rr1_Mid.wav"), 0.4, 0.2);
add("drums/hat.mp3", v(VI + "Hi-Hat Cymbal/HiHat_HitC_v2_rr1_Mid.wav"), 0.25, 0.1);
add("drums/hat-open.mp3", v(VI + "Hi-Hat Cymbal/HiHat_HitLoose_rr1_Mid.wav"), 0.7, 0.35);
add("drums/crash.mp3", v(VI + "Suspended Cymbal 1/susCymb1_hit_stick_f1.wav"), 1.8, 1.1);
/* 탬버린 · 셰이커(마라카스) (VCSL, CC0) */
add("tamb/hit.mp3", v(VI + "Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav"), 0.5, 0.25);
add("tamb/shake.mp3", v(VI + "Tambourine 1/Tamb1_Shake_rr1_Mid.wav"), 0.55, 0.25);
add("shaker/down.mp3", v(VI + "Shaker, Large/LShaker_Shake1D_rr2_Mid.wav"), 0.35, 0.15, 0, 0, 180);
add("shaker/up.mp3", v(VI + "Shaker, Large/LShaker_Shake1U_rr1_Mid.wav"), 0.35, 0.15, 0, 0, 180);
/* 실로폰 (VCSL, CC0) — 중간 채 */
for (const n of ["G4", "C5", "G5", "C6", "G6"]) add("xylo/" + n + ".mp3", v(VI + "Xylophone/Medium Mallets/Xylo_Medium_" + n + "_ff_01_far.wav"), 0.9, 0.5);
/* 피아노 (VCSL Kawai 그랜드, CC0) — 단3도 간격으로 녹음된 음 중 증4도 간격 */
for (const n of ["C3", "F#3", "C4", "F#4", "C5", "F#5"])
  add("piano/" + n.replace("#", "s") + ".mp3", v("Chordophones/Zithers/Grand Piano, Kawai/Sustains/GPiano_sus_" + n + "_v3_rr1_Player.wav"), 1.8, 0.7);
/* 기타 (FluidR3 나일론 기타, MIT) — 장3도 간격 (+ 맨 아래 G2: 낮은 F·G 를 덜 탁하게) */
for (const n of ["G2", "C3", "E3", "Ab3", "C4", "E4", "Ab4"]) add("guitar/" + n + ".mp3", fl("acoustic_guitar_nylon", n), 1.5, 0.6, 56);
/* 노래(합창 '아아') (FluidR3 choir aahs, MIT) */
for (const n of ["C4", "E4", "Ab4", "C5"]) add("choir/" + n + ".mp3", fl("choir_aahs", n), 1.9, 0.5, 56);

const run = (args) => execFileSync(FF, ["-hide_banner", "-nostdin", ...args], { stdio: ["ignore", "pipe", "pipe"] });
const runErr = (args) => String(spawnSync(FF, ["-hide_banner", "-nostdin", ...args], { encoding: "utf8" }).stderr || "");

(async () => {
  fs.mkdirSync(SRC, { recursive: true });
  let total = 0;
  for (const it of LIST) {
    // 받아 둔 원본 이름 = 주소의 마지막 두 부분 (출력 이름이 아니라 원본 기준 → 원본을 바꾸면 새로 받음)
    const src = path.join(SRC, decodeURIComponent(it.url.split("/").slice(-2).join("_")).replace(/[^\w.#-]+/g, "_"));
    if (!fs.existsSync(src)) {
      const r = await fetch(it.url);
      if (!r.ok) throw new Error("받기 실패 " + r.status + " " + it.url);
      fs.writeFileSync(src, Buffer.from(await r.arrayBuffer()));
    }
    // 1) 앞 무음 제거 + 자르기 + 페이드 + 모노 → 최고 음량 측정
    const pre = `aresample=44100,aformat=channel_layouts=mono,${it.hp ? "highpass=f=" + it.hp + "," : ""}atrim=start=${it.skip},silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.004,atrim=duration=${it.len},afade=t=out:st=${Math.max(0, it.len - it.fade)}:d=${it.fade}`;
    const meas = (f) => runErr(["-i", src, "-af", f + ",volumedetect", "-f", "null", "-"]);
    const filt = pre,
      log = meas(pre);
    const mx = /max_volume:\s*(-?[\d.]+) dB/.exec(log);
    if (!mx) throw new Error("음량 측정 실패: " + it.out + "\n" + log.slice(-600));
    const gain = -1 - parseFloat(mx[1]);
    const out = path.join(OUT, it.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    run(["-y", "-i", src, "-af", filt + `,volume=${gain.toFixed(2)}dB`, "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", it.kbps + "k", "-map_metadata", "-1", out]);
    const sz = fs.statSync(out).size;
    total += sz;
    console.log(it.out.padEnd(22), (sz / 1024).toFixed(1).padStart(6) + "KB", "보정 " + gain.toFixed(1) + "dB");
  }
  console.log("합계", (total / 1024).toFixed(0) + "KB", LIST.length + "개");
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
