import type { LetterRoom } from './LetterRoom.ts'

// wrangler.jsonc 의 바인딩과 짝을 이룬다
export interface Env {
  /** 편지 저장소 (D1) */
  DB: D1Database
  /** 모든 PC 를 묶어 실시간으로 맞추는 방 */
  LETTER_ROOM: DurableObjectNamespace<LetterRoom>
  /** 진행자 키. 배포 환경에서는 `wrangler secret put HOST_KEY`, 로컬에서는 .dev.vars */
  HOST_KEY?: string
}

/** Worker 가 Durable Object 로 넘기는 "이 연결은 진행자" 표시 (클라이언트가 보낸 같은 이름의 헤더는 덮어쓴다) */
export const HOST_HEADER = 'X-Letter-Wall-Host'
