import { useMemo, useRef } from 'react'
import type { Letter } from '../../shared/types.ts'
import { shuffled } from '../layout/util.ts'
import type { Send } from '../net/useServerState.ts'
import { SAMPLE_TEXTS } from '../samples.ts'

type Ask = (message: string, confirmLabel: string, then: () => void) => void

const preview = (text: string) => (text.length > 30 ? `${text.slice(0, 30)}…` : text)

// 관리 페이지의 조작을 서버 액션으로 바꿔 보내는 함수 모음 (참조가 바뀌지 않는다)
export function useAdminActions(send: Send, letters: Letter[], ask: Ask) {
  const latest = useRef(letters)
  latest.current = letters

  return useMemo(
    () => ({
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
    }),
    [send, ask],
  )
}
