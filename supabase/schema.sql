-- 편지 월 스키마. 여러 번 실행해도 안전하다 (npm run db:setup)

-- 편지 목록
CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'wall' CHECK (status IN ('wall', 'read')),
  read_at BIGINT,
  jitter DOUBLE PRECISION NOT NULL,
  -- 같은 시각에 들어온 편지의 순서
  seq BIGINT GENERATED ALWAYS AS IDENTITY
);

CREATE INDEX IF NOT EXISTS letters_created_at ON letters (created_at, seq);

-- 읽기 진행 상태 (한 줄짜리). 액션은 이 줄을 잠근 채로 하나씩 처리한다
CREATE TABLE IF NOT EXISTS room (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  scene JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);

INSERT INTO room (id, scene)
VALUES (1, '{"phase": "shuffle", "scatter": null, "openId": null, "shuffleSeq": 0}')
ON CONFLICT (id) DO NOTHING;

-- 브라우저에 공개되는 Supabase 키로는 두 테이블을 읽거나 쓸 수 없게 막는다 (정책 없음 = 전부 거부).
-- 서버(Vercel Function)는 Postgres 에 직접 붙으므로 영향이 없다.
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
