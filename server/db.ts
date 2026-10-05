// Postgres(Supabase) 의 letters / room 테이블 읽기·쓰기
import postgres from 'postgres'
import type { Letter, LetterStatus, Scene, ServerState } from '../shared/types.ts'
import { databaseUrl } from './env.ts'

/** 상태 변경을 DB 에 반영하기 위한 기록 */
export type Write =
  | { kind: 'insert'; letters: Letter[] }
  | { kind: 'setText'; id: string; text: string }
  | { kind: 'setStatus'; id: string; status: LetterStatus; readAt: number | null }
  | { kind: 'remove'; id: string }
  | { kind: 'clear' }

type Sql = postgres.Sql | postgres.TransactionSql

interface LetterRow {
  id: string
  text: string
  created_at: number
  status: LetterStatus
  read_at: number | null
  jitter: number
}

let client: postgres.Sql | undefined

// 함수 인스턴스마다 연결을 하나 만들어 재사용한다
function db(): postgres.Sql {
  if (!client) {
    // 연동이 붙여 주는 쿼리(sslmode, supa 등)는 postgres.js 가 접속 파라미터로 넘겨 버리므로 떼어 낸다
    const url = new URL(databaseUrl())
    url.search = ''
    client = postgres(url.toString(), {
      ssl: 'require',
      // 트랜잭션 풀러(6543)는 prepared statement 를 지원하지 않는다
      prepare: false,
      max: 3,
      idle_timeout: 20,
    })
  }
  return client
}

const toLetter = (row: LetterRow): Letter => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
  status: row.status,
  readAt: row.read_at,
  jitter: row.jitter,
})

export interface Snapshot extends ServerState {
  version: number
}

// BIGINT 는 문자열로 오므로 float8 로 바꿔 숫자로 받는다
async function load(sql: Sql, lock: boolean): Promise<Snapshot> {
  const [room] = lock
    ? await sql<{ scene: Scene; version: number }[]>`SELECT scene, version::float8 AS version FROM room WHERE id = 1 FOR UPDATE`
    : await sql<{ scene: Scene; version: number }[]>`SELECT scene, version::float8 AS version FROM room WHERE id = 1`
  if (!room) throw new Error('room 테이블이 비어 있습니다. npm run db:setup 을 실행하세요')
  const rows = await sql<LetterRow[]>`
    SELECT id, text, created_at::float8 AS created_at, status, read_at::float8 AS read_at, jitter
    FROM letters ORDER BY created_at, seq`
  return { letters: rows.map(toLetter), scene: room.scene, version: room.version }
}

export const loadSnapshot = () => load(db(), false)

async function apply(sql: Sql, write: Write): Promise<void> {
  switch (write.kind) {
    case 'insert': {
      const rows = write.letters.map((l) => ({
        id: l.id,
        text: l.text,
        created_at: l.createdAt,
        status: l.status,
        read_at: l.readAt,
        jitter: l.jitter,
      }))
      await sql`INSERT INTO letters ${sql(rows, 'id', 'text', 'created_at', 'status', 'read_at', 'jitter')}`
      return
    }
    case 'setText':
      await sql`UPDATE letters SET text = ${write.text} WHERE id = ${write.id}`
      return
    case 'setStatus':
      await sql`UPDATE letters SET status = ${write.status}, read_at = ${write.readAt} WHERE id = ${write.id}`
      return
    case 'remove':
      await sql`DELETE FROM letters WHERE id = ${write.id}`
      return
    case 'clear':
      await sql`DELETE FROM letters`
      return
  }
}

export interface Change {
  /** 바뀐 뒤의 상태 */
  state: ServerState
  writes: Write[]
  /** 진행 상태(scene)도 저장해야 하는가 */
  sceneChanged: boolean
}

/**
 * room 줄을 잠근 채로 지금 상태를 읽고, update 가 돌려준 변경을 한 트랜잭션으로 저장한다.
 * 여러 PC 에서 동시에 액션이 와도 하나씩 차례로 처리된다. 변경이 없으면 null 을 돌려준다.
 */
export async function transact(update: (current: ServerState) => Change | null): Promise<Snapshot | null> {
  return db().begin(async (sql) => {
    const current = await load(sql, true)
    const change = update(current)
    if (!change) return null
    for (const write of change.writes) await apply(sql, write)
    const { scene } = change.state
    if (change.sceneChanged) {
      await sql`UPDATE room SET scene = ${sql.json(scene as unknown as postgres.JSONValue)}, version = version + 1 WHERE id = 1`
    } else {
      await sql`UPDATE room SET version = version + 1 WHERE id = 1`
    }
    return { ...change.state, version: current.version + 1 }
  })
}
