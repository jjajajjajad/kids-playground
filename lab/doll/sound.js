/* 누르면 나는 종별 소리 — 앱의 KP.audio 가 없는 시험판이라 간단한 합성음 (짧고 부드럽게, 무섭지 않게)
   dog: 멍멍 느낌 두 번 · cat: 올라갔다 내려가는 '야옹' · bear: 낮은 '뿡' 두 번 · rabbit: 높은 '삐삐' · pig: 코 '꿀꿀'
   lion: 작은 '어흥'(낮게 굴리는 소리, 짧고 작게) · elephant: 나팔 '뿌우' · dino: 귀여운 '와앙' */
let ac = null;
function ctx() {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === "suspended") ac.resume();
  return ac;
}
/** 음 하나: type 파형, f0→f1 Hz, 길이 d, 크기 v, lp 저역 필터, vib 떨림 */
function tone(t, { type = "sine", f0, f1 = f0, d = 0.15, v = 0.2, lp = 3000, vib = 0, attack = 0.015, curve = "exp" }) {
  const a = ctx();
  const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
  o.type = type;
  f.type = "lowpass";
  f.frequency.value = lp;
  o.frequency.setValueAtTime(f0, t);
  if (curve === "exp") o.frequency.exponentialRampToValueAtTime(f1, t + d);
  else o.frequency.linearRampToValueAtTime(f1, t + d);
  if (vib) {
    const l = a.createOscillator(), lg = a.createGain();
    l.frequency.value = vib;
    lg.gain.value = f0 * 0.04;
    l.connect(lg).connect(o.frequency);
    l.start(t);
    l.stop(t + d + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + attack);
  g.gain.setValueAtTime(v, t + d * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(f).connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + d + 0.02);
}
const SOUNDS = {
  dog(t) {
    for (const [dt, f0] of [[0, 620], [0.2, 560]]) tone(t + dt, { type: "sawtooth", f0, f1: f0 * 0.55, d: 0.15, v: 0.22, lp: 1500, attack: 0.015 });
  },
  cat(t) {
    tone(t, { type: "triangle", f0: 560, f1: 900, d: 0.18, v: 0.2, lp: 2600, curve: "lin" });
    tone(t + 0.17, { type: "triangle", f0: 900, f1: 520, d: 0.3, v: 0.2, lp: 2600, curve: "lin" });
  },
  bear(t) {
    for (const [dt, f0] of [[0, 220], [0.22, 190]]) tone(t + dt, { type: "triangle", f0, f1: f0 * 0.75, d: 0.2, v: 0.3, lp: 900 });
  },
  rabbit(t) {
    for (const dt of [0, 0.11, 0.22]) tone(t + dt, { type: "sine", f0: 1300, f1: 1800, d: 0.07, v: 0.16, lp: 5000, attack: 0.005 });
  },
  pig(t) {
    for (const dt of [0, 0.19]) tone(t + dt, { type: "sawtooth", f0: 260, f1: 200, d: 0.13, v: 0.18, lp: 800, vib: 38 });
  },
  lion(t) {
    tone(t, { type: "sawtooth", f0: 170, f1: 120, d: 0.45, v: 0.16, lp: 700, vib: 22, attack: 0.06 });
    tone(t, { type: "triangle", f0: 340, f1: 260, d: 0.4, v: 0.08, lp: 1200, attack: 0.06 });
  },
  elephant(t) {
    tone(t, { type: "sawtooth", f0: 380, f1: 620, d: 0.45, v: 0.14, lp: 2000, vib: 9, attack: 0.05, curve: "lin" });
  },
  dino(t) {
    tone(t, { type: "square", f0: 300, f1: 420, d: 0.12, v: 0.08, lp: 1100, curve: "lin" });
    tone(t + 0.11, { type: "square", f0: 420, f1: 240, d: 0.3, v: 0.09, lp: 1100, vib: 14, curve: "lin" });
  },
};
export function playVoice(kind) {
  try {
    const a = ctx();
    (SOUNDS[kind] || SOUNDS.dog)(a.currentTime + 0.01);
  } catch (e) { /* 소리 없음 */ }
}
