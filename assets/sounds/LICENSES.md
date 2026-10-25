# 악기 소리 샘플 출처 · 라이선스

`assets/sounds/` 의 mp3 는 아래 무료 샘플을 `tools/make-sounds.js` 로 잘라(앞 무음 제거·길이 자르기·페이드·모노·음량 맞춤) 다시 인코딩한 것입니다.
원본 녹음 자체는 바꾸지 않았고, 짧게 잘라 용량만 줄였습니다. (확인일: 2026-10-25 KST)

## 1. VCSL — Versilian Community Sample Library (CC0 1.0, 퍼블릭 도메인)

- 저장소: https://github.com/sgossner/VCSL
- 라이선스 파일: https://github.com/sgossner/VCSL/blob/master/LICENSE — 첫 줄 "Creative Commons Legal Code / CC0 1.0 Universal"
- CC0 이므로 출처 표기 의무는 없지만 감사의 뜻으로 적어 둡니다. 제작: Versilian Studios (Sam Gossner) 와 기여자들.
- 사용한 소리
  - `drums/kick.mp3` ← Idiophones/Struck Idiophones/Cajon/Cajon_hit1_f_rr1.wav
  - `drums/kick2.mp3` ← Membranophones/Struck Membranophones/Bass Drum 1/BDrumNew_hit_v3_rr1_Sum.wav
  - `drums/snare.mp3` ← Membranophones/Struck Membranophones/Snare Drum, Modern 1/Snare2_HitSN_v6_rr1_Mid.wav
  - `drums/snare-soft.mp3` ← 같은 폴더 Snare2_HitSN_v3_rr1_Mid.wav
  - `drums/hat.mp3` ← Idiophones/Struck Idiophones/Hi-Hat Cymbal/HiHat_HitC_v2_rr1_Mid.wav
  - `drums/hat-open.mp3` ← 같은 폴더 HiHat_HitLoose_rr1_Mid.wav
  - `drums/crash.mp3` ← Idiophones/Struck Idiophones/Suspended Cymbal 1/susCymb1_hit_stick_f1.wav
  - `tamb/hit.mp3`, `tamb/shake.mp3` ← Idiophones/Struck Idiophones/Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav, Tamb1_Shake_rr1_Mid.wav
  - `shaker/down.mp3`, `shaker/up.mp3` ← Idiophones/Struck Idiophones/Shaker, Large/LShaker_Shake1D_rr2_Mid.wav, LShaker_Shake1U_rr1_Mid.wav
  - `xylo/*.mp3` ← Idiophones/Struck Idiophones/Xylophone/Medium Mallets/Xylo_Medium_<음>_ff_01_far.wav (G4·C5·G5·C6·G6)
  - `piano/*.mp3` ← Chordophones/Zithers/Grand Piano, Kawai/Sustains/GPiano_sus_<음>_v3_rr1_Player.wav (C3·F#3·C4·F#4·C5·F#5)

## 2. FluidR3_GM 사운드폰트 (MIT)

- 원작자: Frank Wen (2000-2002, 2008), Toby Smithe (2008)
- 라이선스 근거: Debian `fluid-soundfont` 패키지 저작권 파일 — https://metadata.ftp-master.debian.org/changelogs/main/f/fluid-soundfont/unstable_copyright
  ("Files: * / Copyright: 2000-2002, 2008 Frank Wen <getfrank@gmail.com>, 2008 Toby Smithe / License: MIT")
- mp3 렌더: midi-js-soundfonts (GitHub gleitz, 저장소 MIT) — https://github.com/gleitz/midi-js-soundfonts
  - 참고: 이 저장소의 설명에는 FluidR3_GM 을 "Released under Creative Commons Attribution 3.0 license" 로 적고 있음.
    원작 라이선스(MIT)·저장소 설명(CC BY 3.0) 어느 쪽이든 아래 표기를 지키면 사용 가능하므로 두 조건을 모두 따름(출처·저작권 표시 유지).
- 사용한 소리
  - `guitar/*.mp3` ← FluidR3_GM/acoustic_guitar_nylon-mp3/<음>.mp3 (G2·C3·E3·Ab3·C4·E4·Ab4)
  - `choir/*.mp3` ← FluidR3_GM/choir_aahs-mp3/<음>.mp3 (C4·E4·Ab4·C5)

### MIT License (FluidR3)

Copyright (c) 2000-2002, 2008 Frank Wen <getfrank@gmail.com>
Copyright (c) 2008 Toby Smithe

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
