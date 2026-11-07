# 아이 놀이터 사용 통계 서버

앱이 보내는 익명 사용 기록(어떤 놀이를 얼마나, 이김·틀림, 단계, 문 열기, 오류)을 받아 두는 작은 서버.
Cloudflare Workers(무료) + D1(무료 작은 DB). 개인정보 없음 — 기기번호는 앱이 무작위로 만든 값, IP 는 저장하지 않음(나라 코드만).

## 처음 한 번 (이 폴더에서)
```bash
cd server
npx wrangler login                                   # 브라우저에서 Cloudflare 로그인 (회사 계정이 아닌 개인 계정 선택)
npx wrangler d1 create kp-stats                      # 나온 database_id 를 wrangler.toml 에 적기
npx wrangler d1 execute kp-stats --remote --file=schema.sql
npx wrangler secret put REPORT_KEY                   # 집계를 볼 때 쓸 비밀키 (아무 긴 글자, .env 의 KP_STATS_KEY 와 같게)
npx wrangler deploy                                  # 끝나면 https://kp-stats.<계정>.workers.dev 주소가 나옴
```
그 주소를 저장소 루트 `.env` 에 적고 다시 빌드·푸시하면 앱이 보내기 시작한다:
```
KP_STATS_URL=https://kp-stats.<계정>.workers.dev
KP_STATS_KEY=<REPORT_KEY 와 같은 값>
```

## 집계 보기
```bash
node tools/stats-report.js 7        # 최근 7일 → tools/out/stats/사용통계_YYYY-MM-DD.xlsx
```

## 코드 바꾼 뒤
```bash
cd server && npx wrangler deploy
```

## 받는 것 (events.kind)
| kind | 뜻 | a | b | c |
|---|---|---|---|---|
| app | 앱 켬 | | | 기기 종류 |
| open | 놀이 열기 | | 단계 | |
| leave | 놀이에서 나감 | 머문 초 | | |
| win / miss | 이김 / 틀림 | | 단계 | |
| lvl | 단계 바뀜 | +1/-1 | 새 단계 | |
| unlock | 문 열림 | 분 | | 방법(earn/quiz/adult) |
| err | 오류 | | | 메시지 앞 40자 |
| set | 설정 바꿈 | 값 | | 설정 이름 |
