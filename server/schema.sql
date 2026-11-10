-- 아이 놀이터 사용 통계 (Cloudflare D1). 적용: npx wrangler d1 execute kp-stats --remote --file=server/schema.sql
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,        -- 앱이 만든 무작위 기기번호 (개인정보 아님)
  first_at INTEGER NOT NULL,  -- 처음 본 시각 (ms)
  last_at INTEGER NOT NULL,   -- 마지막 접속 (ms)
  ver TEXT,                   -- 앱 버전
  platform TEXT,              -- android / ios / 기타
  screen TEXT,                -- 화면 크기 "1180x820"
  dpr REAL,                   -- 화면 배율
  lang TEXT,
  country TEXT,               -- 나라 코드 (Cloudflare 가 줌, IP 는 저장 안 함)
  named INTEGER DEFAULT 0,    -- 아이 이름을 넣었는지 (1/0) — 이름 자체는 받지 않음
  n_batches INTEGER DEFAULT 0 -- 받은 묶음 수
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dev TEXT NOT NULL,
  t INTEGER NOT NULL,         -- 이벤트 시각 (ms, 기기 시계)
  kind TEXT NOT NULL,         -- app(켬) open(놀이 열기) leave(나감, a=초) win miss lvl(a=+1/-1, b=새 단계) unlock(a=분, c=방법) err(c=메시지) set(c=설정키, a=값)
  game TEXT,                  -- 놀이 id ('' = 앱 전체)
  a REAL, b REAL, c TEXT,
  ver TEXT,
  eid TEXT                    -- 앱이 붙인 이벤트 고유 번호 (같은 묶음 재전송 중복 방지; 옛 버전은 NULL)
);
CREATE INDEX IF NOT EXISTS ev_t ON events (t);
CREATE UNIQUE INDEX IF NOT EXISTS ev_dev_eid ON events (dev, eid);
CREATE INDEX IF NOT EXISTS ev_game_t ON events (game, t);
CREATE INDEX IF NOT EXISTS ev_dev_t ON events (dev, t);
