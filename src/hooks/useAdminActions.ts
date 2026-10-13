import { useMemo, useRef } from 'react'
import type { Letter } from '../../shared/types.ts'
import { shuffled } from '../layout/util.ts'
import type { Send } from '../net/useServerState.ts'
import { SAMPLE_TEXTS } from '../samples.ts'

type Ask = (message: string, confirmLabel: string, then: () => void) => void

const preview = (text: string) => (text.length > 30 ? `${text.slice(0, 30)}…` : text)

/** 우선순위가 정해진 편지를 순서대로 */
export const priorityOrder = (letters: Letter[]) =>
  letters.filter((l) => l.priority !== null).sort((a, b) => (a.priority as number) - (b.priority as number))

// 관리 페이지의 조작을 서버 액션으로 바꿔 보내는 함수 모음 (참조가 바뀌지 않는다)
export function useAdminActions(send: Send, letters: Letter[], ask: Ask) {
  const latest = useRef(letters)
  // 서버 응답이 오기 전에 연달아 눌러도 앞의 변경이 사라지지 않게, 마지막으로 보낸 순서를 기억해 둔다
  const sentOrder = useRef<string[] | null>(null)
  if (latest.current !== letters) sentOrder.current = null
  latest.current = letters

  return useMemo(() => {
    const priorityIds = () => sentOrder.current ?? priorityOrder(latest.current).map((l) => l.id)
    const setPriorities = (ids: string[]) => {
      if (send({ type: 'setPriorities', ids })) sentOrder.current = ids
    }

    return {
      update: (id: string, text: string) => send({ type: 'update', id, text }),
      addSamples: () => send({ type: 'add', texts: shuffled(SAMPLE_TEXTS) }),
      askRemove: (letter: Letter) =>
        ask(`“${preview(letter.text)}” 편지를 삭제할까요? 되돌릴 수 없습니다.`, '삭제', () =>
          send({ type: 'remove', id: letter.id }),
        ),
      askClear: () =>
        ask(`편지 ${latest.current.length}통을 모두 삭제할까요? 되돌릴 수 없습니다.`, '모두 삭제', () =>
          send({ type: 'clear' }),
        ),

      // 우선순위: 지정하면 맨 뒤 순서로 붙고, 해제하면 뒤 순서가 하나씩 당겨진다
      togglePriority: (letter: Letter) => {
        const ids = priorityIds()
        setPriorities(ids.includes(letter.id) ? ids.filter((id) => id !== letter.id) : [...ids, letter.id])
      },
      movePriority: (id: string, delta: -1 | 1) => {
        const ids = [...priorityIds()]
        const from = ids.indexOf(id)
        const to = from + delta
        if (from < 0 || to < 0 || to >= ids.length) return
        ;[ids[from], ids[to]] = [ids[to], ids[from]]
        setPriorities(ids)
      },
      clearPriorities: () => setPriorities([]),
    }
  }, [send, ask])
}
