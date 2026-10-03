// D1 의 letters 테이블 읽기/쓰기
import type { Letter, LetterStatus } from '../shared/types.ts'

interface LetterRow {
  id: string
  text: string
  created_at: number
  status: LetterStatus
  read_at: number | null
  jitter: number
}

/** 상태 변경을 DB 에 반영하기 위한 기록 */
export type Write =
  | { kind: 'insert'; letters: Letter[] }
  | { kind: 'setText'; id: string; text: string }
  | { kind: 'setStatus'; id: string; status: LetterStatus; readAt: number | null }
  | { kind: 'remove'; id: string }
  | { kind: 'clear' }

const toLetter = (row: LetterRow): Letter => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
  status: row.status,
  readAt: row.read_at,
  jitter: row.jitter,
})

export async function loadLetters(db: D1Database): Promise<Letter[]> {
  const { results } = await db
    .prepare('SELECT id, text, created_at, status, read_at, jitter FROM letters ORDER BY created_at, rowid')
    .all<LetterRow>()
  return results.map(toLetter)
}

function toStatements(db: D1Database, write: Write): D1PreparedStatement[] {
  switch (write.kind) {
    case 'insert':
      return write.letters.map((l) =>
        db
          .prepare('INSERT INTO letters (id, text, created_at, status, read_at, jitter) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(l.id, l.text, l.createdAt, l.status, l.readAt, l.jitter),
      )
    case 'setText':
      return [db.prepare('UPDATE letters SET text = ? WHERE id = ?').bind(write.text, write.id)]
    case 'setStatus':
      return [db.prepare('UPDATE letters SET status = ?, read_at = ? WHERE id = ?').bind(write.status, write.readAt, write.id)]
    case 'remove':
      return [db.prepare('DELETE FROM letters WHERE id = ?').bind(write.id)]
    case 'clear':
      return [db.prepare('DELETE FROM letters')]
  }
}

// 한 액션의 변경을 한 번의 batch(트랜잭션)로 반영한다
export async function persist(db: D1Database, writes: Write[]): Promise<void> {
  const statements = writes.flatMap((w) => toStatements(db, w))
  if (statements.length) await db.batch(statements)
}
