import { useEffect, useState } from 'react'
import { MAX_STAGGER, MOVE_MS } from '../config.ts'

// 섞기 이동이 진행 중인지. 서버의 shuffleSeq 가 바뀌면(어느 PC 에서 섞었든) 이동 시간 동안 true.
// 이동 중에는 겹침 순서를 천천히 바꾸는 전환을 쓴다 (styles/letters.css 의 .moving 참고).
// 새 포즈가 그려지는 바로 그 렌더에서 true 가 되어야 해서, effect 가 아니라 렌더 중에 판단한다.
export function useMoving(shuffleSeq: number): boolean {
  const [state, setState] = useState({ seq: shuffleSeq, moving: false })
  const changed = state.seq !== shuffleSeq
  if (changed) setState({ seq: shuffleSeq, moving: true })

  useEffect(() => {
    if (!state.moving) return
    const timer = setTimeout(() => setState((s) => ({ ...s, moving: false })), MOVE_MS + MAX_STAGGER + 100)
    return () => clearTimeout(timer)
  }, [state.seq, state.moving])

  return state.moving || changed
}
