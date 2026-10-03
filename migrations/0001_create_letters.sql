-- 편지 목록. 화면 진행 상태(모드, 섞인 배치 등)는 Durable Object 저장소에 따로 둔다.
CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'wall' CHECK (status IN ('wall', 'read')),
  read_at INTEGER,
  jitter REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS letters_created_at ON letters (created_at);
