# 아이 놀이터 (kids-playground) — Claude 작업 안내

만 3~4세 아이용 놀이 PWA. 순수 JS(빌드 도구 없음, 프레임워크 없음), 전역 이름공간 `KP`.
배포: GitHub Pages (main 브랜치 push → https://jjajajjajad.github.io/kids-playground/ 자동 반영).
대상 기기: iPad, 안드로이드 태블릿, iPhone·휴대폰 (세로/가로 모두).

## 대화·작업 규칙
- 사용자와는 한국어 존댓말. 사실 위주, 추정은 "(추정)"으로 표시.
- 시간·날짜는 KST 기준 (앱 내부 날짜 계산도 KST).
- 커밋 작성자: `장동훈 <jdhgto1201@gmail.com>`. 커밋 메시지는 한국어 한 줄 요약.
- 아이가 보는 문구는 쉬운 말, 짧게. 아이를 부르는 말은 "형아" 정서를 살림.
- 진짜 기기 테스트는 사용자 몫 — 변경 후 "실기기 확인 필요" 항목을 알려 줄 것.

## 명령
```bash
npm install                      # 최초 1회
npx playwright install chromium  # 최초 1회 (로컬 PC)
node tools/build.js              # 필수: js/css 바꾼 뒤 항상 실행
node tools/serve.js              # 로컬 서버 (기기에서 같은 와이파이로 접속 가능)
node tools/test.js               # 전체 70개 놀이 자동 점검 (태블릿+폰)
node tools/phone-audit.js        # 폰 화면 넘침 점검 (n100 은 알려진 예외)
```
- `build.js`가 생성: `index.html`, `sw.js`, `js/gen/{clips,version,emoji-map}.js`, `assets/e/`, `fonts/`, `css/fonts.css`.
  생성 파일은 직접 고치지 말 것. 충돌 나면 `git checkout -- <생성파일>` 후 다시 빌드.
- 새 코어 파일은 `tools/build.js`의 `CORE` 배열에 순서대로 추가. 게임 파일은 `js/games/**` 에 두면 자동 포함.
- CSP: `script-src 'self'` → 인라인 스크립트·외부 CDN 금지. 외부 라이브러리는 `vendor/`에 넣고(라이선스 파일 동봉) 동적 import.

## 구조
- `js/core/` — kp(이름공간), store(localStorage 래퍼 `KP.store`), settings, audio, voice, ui(게임 틀·win/miss), home(홈·잠금·타이머·부모 게이트), earn(열쇠 별), pages(설정 화면), notebook, paint, celebrate, app(시작).
- `js/games/{play,smart,make,music,bigkid}/` — 놀이 하나당 파일 하나, `KP.GAMES`에 등록.
- `js/games/make/zoo.js` — 색칠 공방 + 2.5D 동물원, 크레파스(직접 칠하기: 부위별 캔버스 → `item.paint`).
- `js/games/make/zoo3d.js` — Three.js r170 (`vendor/three.module.min.js`) 3D 동물원. 점토 질감, 자동 화질(`zoo3d:q`).
- `js/games/bigkid/maze.js` — 미로 + 술래 도전(BFS 추적, 속도 자동 조절 `maze:chaseK`).
- `css/app.css`, `css/games/*.css`.

## 잠금·시간 시스템 (건드릴 때 주의)
- 부모 게이트: `KP.gate.adult()` — 4자리 PIN(설정 시) 또는 날짜 문제. "잊었어요"는 5초 누르면 날짜 문제로.
- 열쇠 별(`js/core/earn.js`): 잠기지 않은 카테고리 놀이를 '깨끗이' 이기면 별 → 다 모으면 문 열기 → `gate.unlockFor(분, "earn")`.
  찍어 맞히기·6초 내 연타·같은 놀이 상한(`earnPerGame`, 별 수 기준)은 제외. 하루 상한 `earnCapMin`.
- 하루 사용 시간·잘 시간이 항상 우선(`KP.timeLeft`). 2분 무조작 시 시간 멈춤. 마지막 판 처리 `KP.lastRound`.
- 설정 마이그레이션은 `settings.js`의 `ver` 로 관리 (현재 2).

## 음성 (자연 음성 클립)
- `tools/voice-clips.tsv` (문장<TAB>…<TAB>cloudfront URL) → 빌드 시 `js/gen/clips.js`. 없는 문장은 기기 TTS로 대체됨.
- 새 문장 생성: Higgsfield MCP `generate_audio`/`generate_audio_batch`
  - model `text2speech_v2`, variant `elevenlabs`, voice_type `preset`, voice_id `c25f78a0-714e-42af-8da3-a399cef94968`
  - 1개 약 0.15 크레딧. 429(속도 제한) 나면 한 번에 3개 이하로.
  - **반드시** 보낸 문장과 필요한 문장 목록을 스크립트로 글자 단위 비교한 뒤 tsv에 추가 (과거 "펭귄을"→"폭귤을" 오타 사고).
- 코드에서 `KP.voice.say("문장")` 의 문장은 tsv 문장과 정확히 같아야 클립이 재생됨.

## 테스트 습관
- 기능 변경 후: build → test.js → 필요 시 Playwright 스크린샷(태블릿 1180×820, 폰 390×844)으로 눈 확인.
- 임시 점검 스크립트는 `tools/out/`(gitignore)에 두기.

## 보류 중인 아이디어 (사용자가 요청하면)
- Higgsfield 3D 소품(동물원 2단계), 서버 기능(가족 동기화 등), 앱스토어 준비(학교종 곡 교체, 라이선스 고지, 음성 자체 호스팅, 호칭 설정).
