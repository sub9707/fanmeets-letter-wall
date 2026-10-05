// /api/* 요청 처리. Vercel Function(server/vercel.ts)과 개발 서버(vite.config.ts)가 같이 쓴다
import { timingSafeEqual } from 'node:crypto'
import { API, HOST_KEY_HEADER } from '../shared/constants.ts'
import { PUBLIC_ACTIONS, type StateView } from '../shared/types.ts'
import { loadSnapshot, type Snapshot, transact } from './db.ts'
import { hostKey } from './env.ts'
import { notifyChanged } from './realtime.ts'
import { isAction, reduce } from './reducer.ts'

// 진행자 키 비교 (시간차로 키를 추측할 수 없게 상수 시간 비교)
function isHost(request: Request): boolean {
  const given = request.headers.get(HOST_KEY_HEADER)
  const expected = hostKey()
  if (!given || !expected) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.byteLength === b.byteLength && timingSafeEqual(a, b)
}

// 진행자가 아닌 요청(편지 쓰는 고객, 보기 전용 스크린)에는 편지 내용을 보내지 않는다.
// 지금 펼쳐 읽는 편지만은 화면에 띄워야 하므로 내용을 남긴다.
function view(snapshot: Snapshot, host: boolean): StateView {
  const { scene, version } = snapshot
  const letters = host ? snapshot.letters : snapshot.letters.map((l) => (l.id === scene.openId ? l : { ...l, text: '' }))
  return { letters, scene, version, host }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })

async function handleAction(request: Request, host: boolean): Promise<Response> {
  let action: unknown
  try {
    action = await request.json()
  } catch {
    return json({ error: '잘못된 요청' }, 400)
  }
  if (!isAction(action)) return json({ error: '잘못된 액션' }, 400)
  // 관리(수정·삭제)는 진행자만 할 수 있다
  if (!host && !PUBLIC_ACTIONS.includes(action.type)) return json({ error: '진행자 키가 필요합니다' }, 403)

  const changed = await transact((current) => {
    const result = reduce(current, action)
    return result.changed ? result : null
  })
  if (!changed) return json(view(await loadSnapshot(), host))
  await notifyChanged(changed.version)
  return json(view(changed, host))
}

export async function handle(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  try {
    if (pathname === API.state && request.method === 'GET') return json(view(await loadSnapshot(), isHost(request)))
    if (pathname === API.action && request.method === 'POST') return await handleAction(request, isHost(request))
    return json({ error: 'Not Found' }, 404)
  } catch (err) {
    console.error('요청 처리 실패:', err)
    return json({ error: '서버 오류' }, 500)
  }
}
