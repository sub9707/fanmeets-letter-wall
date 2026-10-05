// supabase/schema.sql 을 Supabase Postgres 에 적용한다 (여러 번 실행해도 안전)
//   npm run db:setup   (.env.local 의 POSTGRES_URL_NON_POOLING 사용)
import { readFileSync } from 'node:fs'
import postgres from 'postgres'

const raw = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL
if (!raw) throw new Error('POSTGRES_URL_NON_POOLING 환경 변수가 없습니다')
const url = new URL(raw)
url.search = ''

const sql = postgres(url.toString(), { ssl: 'require', max: 1, onnotice: () => {} })
try {
  await sql.unsafe(readFileSync('supabase/schema.sql', 'utf8'))
  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM letters`
  console.log(`스키마 적용 완료 (편지 ${count}통)`)
} finally {
  await sql.end()
}
