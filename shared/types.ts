// 서버(Vercel Function)와 화면이 주고받는 데이터의 모양

export type LetterStatus = 'wall' | 'read'

export interface Letter {
  id: string
  /** 진행자 권한이 없는 연결에는 지금 펼친 편지 말고는 빈 문자열로 온다 */
  text: string
  createdAt: number
  /** wall: 배경에 쌓인 편지, read: 읽은 편지 (화면에서 빠지고 관리 페이지에만 남는다) */
  status: LetterStatus
  readAt: number | null
  /** 정렬 상태의 미세한 기울기와 이동 시작 지연에 쓰는 고정 난수 (0~1) */
  jitter: number
}

/** 무대 위 편지 한 통의 자리. x, y 는 편지 중심 */
export interface Pose {
  x: number
  y: number
  /** 각도(deg) */
  r: number
  /** 기준 크기 대비 배율 */
  s: number
  /** 겹침 순서 */
  z: number
}

export type Phase = 'shuffle' | 'select'
export type Scatter = Record<string, Pose>

/** 읽기 페이지의 진행 상태. 읽기 페이지를 연 모든 화면이 같은 값을 본다 */
export interface Scene {
  /** shuffle: 섞기 / 선택하기 버튼 단계, select: 편지를 고르는 단계 */
  phase: Phase
  /** null 이면 정렬 상태, 아니면 편지별로 흩뿌려진 자리 */
  scatter: Scatter | null
  /** 지금 펼쳐서 읽고 있는 편지 */
  openId: string | null
  /** 섞을 때마다 1씩 증가 (화면이 이동 애니메이션 시작을 알아채는 용도) */
  shuffleSeq: number
}

export interface ServerState {
  letters: Letter[]
  scene: Scene
}

/** 화면 → 서버 */
export type Action =
  // 편지 쓰기 (누구나)
  | { type: 'add'; texts: string[] }
  // 읽기 진행 (누구나)
  | { type: 'setPhase'; phase: Phase }
  | { type: 'shuffle'; scatter: Scatter }
  | { type: 'open'; id: string }
  | { type: 'close' }
  | { type: 'reset' }
  // 관리 (진행자 키 필요)
  | { type: 'update'; id: string; text: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

/** 진행자 키 없이도 보낼 수 있는 액션 (관리 액션만 키가 필요하다) */
export const PUBLIC_ACTIONS: readonly Action['type'][] = ['add', 'setPhase', 'shuffle', 'open', 'close', 'reset']

/** 서버 → 화면. 상태를 물어보거나 액션을 보내면 항상 전체 상태가 돌아온다 */
export interface StateView extends ServerState {
  /** 이 요청이 진행자 키를 가졌는가 */
  host: boolean
  /** 상태가 바뀔 때마다 1씩 증가. 늦게 도착한 옛 응답을 버리는 데 쓴다 */
  version: number
}
