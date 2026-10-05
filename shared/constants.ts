// 서버와 화면이 같이 쓰는 값

export const MAX_LENGTH = 200 // 편지 한 통의 최대 글자 수

export const API = {
  /** GET: 지금 상태 */
  state: '/api/state',
  /** POST: 액션 보내기 (응답으로 바뀐 상태) */
  action: '/api/action',
} as const

/** 진행자 키를 담아 보내는 요청 헤더 */
export const HOST_KEY_HEADER = 'X-Host-Key'

/** 상태가 바뀌면 서버가 이 Supabase Realtime 채널로 알리고, 화면은 상태를 다시 받아온다 */
export const REALTIME_CHANNEL = 'letter-wall'
export const CHANGED_EVENT = 'changed'
