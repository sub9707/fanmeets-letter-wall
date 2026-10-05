// 서버 환경 변수. Vercel 의 Supabase 연동이 넣어 주는 이름을 그대로 쓴다 (로컬은 .env.local)

const pick = (...names: string[]) => names.map((name) => process.env[name]).find(Boolean)

function required(...names: string[]): string {
  const value = pick(...names)
  if (!value) throw new Error(`환경 변수 ${names.join(' 또는 ')} 가 없습니다`)
  return value
}

/** Postgres 접속 주소 (Supavisor 트랜잭션 풀러, 서버리스용) */
export const databaseUrl = () => required('POSTGRES_URL')
export const supabaseUrl = () => required('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
/** Realtime 으로 알림을 보낼 때 쓰는 서버 전용 키 */
export const serviceKey = () => required('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY')
/** 진행자 키. Vercel 프로젝트 환경 변수 HOST_KEY */
export const hostKey = () => pick('HOST_KEY')
