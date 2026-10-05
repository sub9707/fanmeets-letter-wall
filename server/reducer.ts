// 액션을 받아 다음 상태를 계산한다 (입출력 없음). DB 에 반영할 변경은 writes 로 돌려준다.
import { MAX_LENGTH } from '../shared/constants.ts'
import type { Action, Letter, Pose, Scene, ServerState } from '../shared/types.ts'
import type { Write } from './db.ts'

export const initialScene = (): Scene => ({ phase: 'shuffle', scatter: null, openId: null, shuffleSeq: 0 })

export interface Result {
  state: ServerState
  /** false 면 아무 일도 없었던 것 (잘못된 요청 포함) */
  changed: boolean
  /** 진행 상태(scene)가 바뀌어 저장이 필요한가 */
  sceneChanged: boolean
  writes: Write[]
}

const NOTHING = (state: ServerState): Result => ({ state, changed: false, sceneChanged: false, writes: [] })
const lettersOnly = (state: ServerState, letters: Letter[], writes: Write[]): Result => ({
  state: { ...state, letters },
  changed: true,
  sceneChanged: false,
  writes,
})
const withScene = (state: ServerState, scene: Scene, letters = state.letters, writes: Write[] = []): Result => ({
  state: { letters, scene },
  changed: true,
  sceneChanged: true,
  writes,
})

// 액션은 네트워크로 들어오므로 타입 선언과 달리 무엇이든 올 수 있다. 값은 여기서 직접 확인한다.
const cleanText = (text: unknown) => (typeof text === 'string' ? text.trim().slice(0, MAX_LENGTH) : '')
const isPose = (p: unknown): p is Pose =>
  typeof p === 'object' &&
  p !== null &&
  (['x', 'y', 'r', 's', 'z'] as const).every((k) => Number.isFinite((p as Record<string, unknown>)[k]))
const statusOf = (state: ServerState, id: string) => state.letters.find((l) => l.id === id)?.status

const newLetter = (text: string, index: number): Letter => ({
  id: crypto.randomUUID(),
  text,
  // 한 번에 여러 통이 들어와도 순서가 유지되게
  createdAt: Date.now() + index,
  status: 'wall',
  readAt: null,
  jitter: Math.random(),
})

type Handlers = {
  [T in Action['type']]: (state: ServerState, action: Extract<Action, { type: T }>) => Result
}

const handlers: Handlers = {
  add(state, { texts }) {
    const cleaned = (Array.isArray(texts) ? texts : []).map(cleanText).filter(Boolean)
    if (!cleaned.length) return NOTHING(state)
    const added = cleaned.map(newLetter)
    return lettersOnly(state, [...state.letters, ...added], [{ kind: 'insert', letters: added }])
  },

  setPhase(state, { phase }) {
    if (phase !== 'shuffle' && phase !== 'select') return NOTHING(state)
    return withScene(state, { ...state.scene, phase })
  },

  shuffle(state, { scatter }) {
    if (!scatter || typeof scatter !== 'object' || !Object.values(scatter).every(isPose)) return NOTHING(state)
    return withScene(state, { ...state.scene, scatter, shuffleSeq: state.scene.shuffleSeq + 1 })
  },

  open(state, { id }) {
    if (statusOf(state, id) !== 'wall') return NOTHING(state)
    return withScene(state, { ...state.scene, openId: id })
  },

  // 읽던 편지를 닫으면 읽은 편지가 되어 화면에서 빠진다
  close(state) {
    const id = state.scene.openId
    if (!id) return NOTHING(state)
    const readAt = Date.now()
    const letters = state.letters.map((l) => (l.id === id ? { ...l, status: 'read' as const, readAt } : l))
    return withScene(state, { ...state.scene, openId: null }, letters, [{ kind: 'setStatus', id, status: 'read', readAt }])
  },

  // 읽기 화면을 처음(정렬 + 섞기 버튼)으로
  reset(state) {
    return withScene(state, { ...initialScene(), shuffleSeq: state.scene.shuffleSeq })
  },

  update(state, { id, text }) {
    const cleaned = cleanText(text)
    if (!cleaned || !statusOf(state, id)) return NOTHING(state)
    const letters = state.letters.map((l) => (l.id === id ? { ...l, text: cleaned } : l))
    return lettersOnly(state, letters, [{ kind: 'setText', id, text: cleaned }])
  },

  remove(state, { id }) {
    if (!statusOf(state, id)) return NOTHING(state)
    const letters = state.letters.filter((l) => l.id !== id)
    const writes: Write[] = [{ kind: 'remove', id }]
    if (state.scene.openId !== id) return lettersOnly(state, letters, writes)
    return withScene(state, { ...state.scene, openId: null }, letters, writes)
  },

  clear(state) {
    return withScene(state, { ...initialScene(), shuffleSeq: state.scene.shuffleSeq }, [], [{ kind: 'clear' }])
  },
}

export const isAction = (value: unknown): value is Action =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { type?: unknown }).type === 'string' &&
  Object.hasOwn(handlers, (value as { type: string }).type)

export function reduce(state: ServerState, action: Action): Result {
  const handler = handlers[action.type] as (state: ServerState, action: Action) => Result
  return handler(state, action)
}
