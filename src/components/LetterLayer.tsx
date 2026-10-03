import { type MouseEvent, memo, useEffect, useMemo, useRef } from 'react'
import type { Letter as LetterData, Scatter } from '../../shared/types.ts'
import type { Mode } from '../layout/constants.ts'
import { MAX_STAGGER } from '../config.ts'
import { computeLayout } from '../layout/index.ts'
import Letter from './Letter.tsx'
import '../styles/letters.css'

interface Props {
  letters: LetterData[]
  scatter: Scatter | null
  mode: Mode
  /** 편지를 눌렀을 때. 없으면 누를 수 없는 화면(작성·보기 전용) */
  onPick?: (letter: LetterData) => void
}

// 편지 전체를 그리는 레이어. 배치를 계산해 각 편지에 숫자 포즈만 넘기므로,
// 자리가 바뀌지 않은 편지는 리렌더되지 않는다.
function LetterLayer({ letters, scatter, mode, onPick }: Props) {
  const poses = useMemo(() => computeLayout({ letters, scatter, mode }), [letters, scatter, mode])

  // 접속했을 때 이미 있던 편지는 그냥 놓고, 그 뒤에 도착한 편지만 등장 애니메이션을 준다
  const seen = useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = new Set(letters.map((l) => l.id))
  const known = seen.current
  const fresh = letters.filter((l) => !known.has(l.id)).map((l) => l.id)
  useEffect(() => {
    for (const l of letters) known.add(l.id)
  }, [letters, known])

  // 편지 100통에 각각 핸들러를 달지 않고 레이어 하나에서 위임 처리
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id
    const letter = letters.find((l) => l.id === id)
    if (letter) onPick?.(letter)
  }

  return (
    <div className="letters" onClick={onPick ? onClick : undefined}>
      {letters.map((l, i) => (
        <Letter
          key={l.id}
          id={l.id}
          status={l.status}
          {...poses[i]}
          delay={Math.round(l.jitter * MAX_STAGGER)}
          spawn={fresh.includes(l.id)}
        />
      ))}
    </div>
  )
}

export default memo(LetterLayer)
