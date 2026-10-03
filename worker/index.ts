// Worker 입구. 화면 파일(정적 자산)은 Cloudflare 가 바로 내려주고, /api/* 만 여기로 온다.
import { WS_PATH } from '../shared/constants.ts'
import { type Env, HOST_HEADER } from './env.ts'

export { LetterRoom } from './LetterRoom.ts'

// 행사 하나 = 방 하나. 행사를 여러 개 동시에 돌리려면 이름을 나누면 된다
const ROOM_NAME = 'main'

const encoder = new TextEncoder()

// 진행자 키 비교 (시간차로 키를 추측할 수 없게 상수 시간 비교)
function isHostKey(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false
  const a = encoder.encode(given)
  const b = encoder.encode(expected)
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === WS_PATH) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('WebSocket 연결만 받습니다', { status: 426 })
      }
      const headers = new Headers(request.headers)
      headers.set(HOST_HEADER, isHostKey(url.searchParams.get('key'), env.HOST_KEY) ? '1' : '0')
      return env.LETTER_ROOM.getByName(ROOM_NAME).fetch(new Request(request, { headers }))
    }

    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
