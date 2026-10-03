import { useMemo, useRef } from 'react'
import type { Letter, Scene } from '../../shared/types.ts'
import { scatterOne, scatterPoses } from '../layout/index.ts'
import type { Send } from '../net/useServerState.ts'

type Ask = (message: string, confirmLabel: string, then: () => void) => void

// 읽기 페이지의 조작을 서버 액션으로 바꿔 보내는 함수 모음.
// 함수들은 한 번만 만들어져서 memo 된 컴포넌트에 그대로 넘겨도 리렌더를 일으키지 않는다 (최신 상태는 ref 로 읽는다).
export function useReadActions(send: Send, letters: Letter[], scene: Scene, ask: Ask) {
  const latest = useRef({ letters, scene })
  latest.current = { letters, scene }

  return useMemo(
    () => ({
      shuffle: () => {
        const wallIds = latest.current.letters.filter((l) => l.status === 'wall').map((l) => l.id)
        send({ type: 'shuffle', scatter: scatterPoses(wallIds) })
      },
      select: () => send({ type: 'setPhase', phase: 'select' }),
      reset: () => send({ type: 'reset' }),
      closeLetter: () => send({ type: 'close' }),

      // 배경 편지를 누르면 펼치고(선택 단계에서만), 트레이 편지를 누르면 되돌릴지 묻는다
      pick: (letter: Letter) => {
        if (letter.status === 'wall') {
          if (latest.current.scene.phase === 'select') send({ type: 'open', id: letter.id })
          return
        }
        ask('이 편지를 다시 편지 뭉치로 돌려보낼까요?', '돌려보내기', () => {
          const { scatter } = latest.current.scene
          send({ type: 'restore', id: letter.id, pose: scatter ? scatterOne(scatter) : null })
        })
      },
    }),
    [send, ask],
  )
}
