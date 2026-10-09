# 아이 놀이터 — 게임 제작 가이드

대상: 만 3~4세(40개월 이상) 아이. **글을 못 읽는다고 가정**하고, 모든 안내는 목소리로 한다.
태블릿(iPad·Android)이 주 사용 기기이고, 오프라인에서도 동작해야 한다.

## 파일 구조

```
js/core/        엔진 (수정 금지 — 필요한 기능은 요청)
js/games/<cat>/<id>.js   게임 1개 = 파일 1개   (cat: play, make, music, smart, bigkid)
tools/build.js  빌드 (이모지 → 일러스트 추출, index.html, sw.js 생성)
tools/test.js   자동 점검 (실제 Chromium, 태블릿/폰 크기)
```

빌드·점검:

```bash
node tools/build.js
node tools/test.js <id> [<id> ...] --shots    # 스크린샷: tools/out/tablet/<id>.png, tools/out/phone/<id>.png
```

**스크린샷을 반드시 직접 열어 보고** 레이아웃(넘침, 겹침, 너무 작은 버튼, 빈 화면)을 확인할 것.

## 게임 등록

```js
"use strict";
KP.game({
  id: "maze",            // 영문 소문자, 전체에서 유일
  icon: "🌀",            // 홈 카드 아이콘 (이모지 1개 → 자동으로 일러스트)
  name: "미로 탈출",      // 짧은 한국어
  cat: "bigkid",         // play | make | music | smart | bigkid
  levels: 3,             // (선택) 자동 난이도 단계 수. ctx.level 로 읽음 (1부터)
  score: "⭐",           // (선택) 상단 점수 표시
  bubble: true,          // (선택, 기본 true) 곰돌이 안내 말풍선
  setup(ctx) {},         // 처음 열 때 1번: 요소 만들기, CSS 등록
  start(ctx) {},         // 열 때마다: 새 판 시작 (여기서 this.next(ctx) 처럼 def 의 메서드 호출 가능)
  stop(ctx) {},          // 나갈 때 (타이머·루프·힌트는 자동 정리됨)
  next(ctx) {},          // (자유) 게임 고유 메서드도 def 에 둘 수 있음
});
```

화면 구성: 상단 바(홈/제목/단계/점수/스티커) → 말풍선 → `ctx.body`(= `.stage`, flex column, 남은 높이 전부).

## ctx 기능

| 기능 | 설명 |
|---|---|
| `ctx.body` | 게임 내용을 넣을 곳 (flex column, `min-height:0`) |
| `ctx.say(text)` | 말풍선에 표시 + 읽어줌. 이모지 섞어도 됨(읽을 때는 이모지 빠짐). 아이가 말풍선을 누르면 다시 읽어줌 |
| `ctx.tell(text)` | 읽어주기만 |
| `ctx.level` | 현재 단계(1..levels). 3번 연속 성공하면 자동으로 오르고, 5번 연속 실패하면 내려감 |
| `await ctx.win({msg?, big?})` | 성공 연출(색종이·칭찬·징글·단계·스티커). 연출이 끝나면 resolve. 반환값 false = 이미 화면을 나감 → 다음 판 시작하지 말 것 |
| `ctx.miss(el?, msg?)` | 틀림: 흔들기 + 부드러운 소리 + 안내 |
| `ctx.milestone(n, every)` | 진행형(풍선 터뜨리기 등) n개마다 win |
| `ctx.hint(() => el, text?)` | 아이가 8초 멈춰 있으면 손가락이 el 을 가리키고 다시 읽어줌. 판이 바뀌거나 정답 대상이 바뀌면 다시 설정. `ctx.hint(null)` 해제 |
| `ctx.choices(box, list, {render, right, wrongMsg, onRight, cls})` | 보기 버튼 묶음(퀴즈형). onRight 에서 `await ctx.win()` 후 다음 판 |
| `ctx.score.add(n)/set/get` | 상단 점수 (def.score 있을 때) |
| `ctx.after(ms, fn)` / `ctx.every(ms, fn)` / `ctx.wait(ms)` | **자동 정리되는 타이머.** 게임 로직에 `setTimeout/setInterval` 직접 사용 금지 |
| `ctx.loop((dt, now) => {...})` | 매 프레임(dt 초). false 반환 시 멈춤. 나가면 자동 정지 |
| `ctx.fast(el, fn)` | 닿는 순간 반응(게임판, 연타) |
| `ctx.tap(el, fn)` | click 반응(스크롤 영역 안 버튼) |
| `ctx.root`, `ctx.cat.color` | 화면 루트, 카테고리 색 |

## 공용 도구

```js
const U = KP.u;
U.el(tag, cls, html)  U.btn(html, cls)  U.$ / U.$$  U.rand(n)  U.randf(a,b)  U.pick(a)  U.shuffle(a)  U.sample(a,n)
U.clamp  U.lerp  U.dist  U.replay(el, "jump"|"wig"|"wrong"|"pop"|"bump")  U.center(el)
U.josa("사과","을/를") → "사과를"     U.NAT[3] → "셋"
KP.E("🐶 강아지")          // 이모지 → 일러스트 <img> HTML (항상 이걸로 출력!)
KP.Eel("🐶", cls)          // 이모지 하나 담은 요소
KP.loadE(["🐶"]).then()    // 캔버스용 미리 불러오기
KP.drawE(ctx2d, "🐶", x, y, size, rot)   // 캔버스에 일러스트 그리기 (가운데 기준)
KP.css("prefix", `...`)    // 게임 전용 CSS (클래스명은 게임 고유 접두사로!)
KP.drag(el, {targets, accept, onDrop, onReject, snap, pad})  // 끌어다 놓기 (js/core/drag.js 주석 참고)
KP.voice.say(text) / KP.voice.en("Apple")
KP.audio.sfx(name)   // tap tap2 select pop bubble good bad whoosh sparkle boom snap drop pick boing slide levelup sticker open back water rub tick
KP.audio.note("C5", {inst:"bell"|"marimba"|"pluck"|"pad"|"bass"|"soft", dur, vol, when})
KP.audio.melody([["C4",1],["E4",1]], {beat:0.25, inst, vol, octave})   KP.audio.SONGS.twinkle.notes …
KP.audio.SCALE[i] / KP.audio.SOLFA[i]  (도레미)
KP.audio.tone(freq, {to, dur, vol, type})   KP.audio.noise({dur, vol, hp, lp, bp, bpTo})   KP.audio.kick()
KP.db.put("art", {id, kind, img, t, date})  KP.db.all("art")   // 큰 데이터 영구 저장 (photos, art)
KP.store.get(k, def) / KP.store.set(k, v)                        // 작은 데이터 영구 저장 (키 앞에 게임 id 붙이기)
KP.pickPhotos(multiple, size) → Promise<dataURL[]>              // 사진 고르기
```

공용 CSS 클래스: `.qStage`(가운데 정렬 무대) `.qAns`(보기 줄) `.choice`(큰 보기 버튼, `.num` 숫자색) `.item`(등장 애니메이션, `--i` 로 순차) `.btn` `.btn.big` `.btn.primary` `.tools`(도구 줄) `.board`(흰 둥근 판, 안의 canvas/svg 꽉 채움) `.swatch`(색 버튼, `.sel`, `.rainbow`, `.glitter`) `.slot`(점선 자리) `.big-em`(큰 그림) `.sil`(그림자 처리) `.row`.

## 품질 기준 (반드시)

1. **글 못 읽는 아이 기준**: 시작할 때 `ctx.say()` 로 할 일을 말해 준다. 문장은 짧은 해요체. 정답/오답 때도 목소리.
2. **이모지는 반드시 `KP.E()` 로 출력** (`textContent = "🐶"` 금지). 캔버스는 `KP.drawE`.
3. **큰 터치 영역**: 누르는 대상 최소 72px(폰) / 90px(태블릿). `clamp()` 로 크기 지정. 가로 스크롤 금지.
4. **두 화면 모두 확인**: 1180×820(태블릿 가로) / 390×844(폰 세로). 넘치거나 잘리면 안 됨.
5. **타이머는 ctx.after/every/loop 만** (화면 나가면 자동 정리. 안 그러면 나간 뒤에도 소리가 남).
6. **결과는 ctx.win / ctx.miss**, 힌트는 `ctx.hint(() => 정답요소)` 를 판마다 설정.
7. **단계(levels)** 를 두어 40개월 아이에게 쉬운 1단계 → 도전적인 3단계로 자연스럽게 어려워지게.
8. **소리는 부드럽게**: 거친 square/sawtooth 남용 금지. 효과음 라이브러리·악기 사용.
9. **틀려도 벌 없음**: 점수 깎기·시간 초과 실패 없음. 다시 시도하게 격려.
10. **반응을 풍부하게**: 누르면 반드시 무언가 움직이고(U.replay) 소리가 난다.
11. CSS 클래스는 게임 고유 접두사(예: 미로 `mz-`)로 충돌 방지. 외부 파일·네트워크 사용 금지.
12. 판이 끝나면 자동으로 다음 판. 4~5판마다 `win({big:true})` 로 큰 축하.

참고 구현: `js/games/smart/count.js`(퀴즈형), `js/games/bigkid/sorter.js`(끌어다 놓기), `js/games/play/firework.js`(캔버스).
예전 단일 파일 버전(기능 참고용): `/home/claude/legacy/index.html`
