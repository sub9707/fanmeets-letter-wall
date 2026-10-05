import { type MouseEvent, memo, useEffect, useMemo, useRef, useState } from 'react'
import type { Letter as LetterData, Pose, Scatter } from '../../shared/types.ts'
import { MAX_STAGGER, READ_FADE_MS } from '../config.ts'
import { computeLayout } from '../layout/index.ts'
import Letter from './Letter.tsx'
import '../styles/letters.css'

interface Props {
  letters: LetterData[]
  scatter: Scatter | null
  /** 편지를 눌렀을 때. 없으면 누를 수 없는 화면(작성·보기 전용) */
  onPick?: (letter: LetterData) => void
}

interface Fading {
  id: string
  pose: Pose
}

// 배경에 쌓인 편지 전체를 그리는 레이어. 배치를 계산해 각 편지에 숫자 포즈만 넘기므로,
// 자리가 바뀌지 않은 편지는 리렌더되지 않는다.
// 읽은 편지는 바로 지우지 않고 마지막 자리에서 서서히 사라지게 한 뒤 지운다.
function LetterLayer({ letters: all, scatter, onPick }: Props) {
  const letters = useMemo(() => all.filter((l) => l.status === 'wall'), [all])
  const poses = useMemo(() => computeLayout(letters, scatter), [letters, scatter])

  // 직전에 그린 자리를 기억해 두었다가, 배경에 있던 편지가 읽음으로 바뀌면 그 자리에서 사라지게 한다.
  // 렌더 중에 바로 반영해야 같은 DOM 노드가 이어져서 투명해지는 전환이 보인다
  const [drawn, setDrawn] = useState(() => ({ all, scatter, placed: new Map(letters.map((l, i) => [l.id, poses[i]])) }))
  const [fading, setFading] = useState<Fading[]>([])
  if (drawn.all !== all || drawn.scatter !== scatter) {
    const gone = all
      .filter((l) => l.status === 'read' && drawn.placed.has(l.id))
      .map((l) => ({ id: l.id, pose: drawn.placed.get(l.id) as Pose }))
    setDrawn({ all, scatter, placed: new Map(letters.map((l, i) => [l.id, poses[i]])) })
    if (gone.length) setFading((f) => [...f.filter((x) => !gone.some((g) => g.id === x.id)), ...gone])
  }
  useEffect(() => {
    if (!fading.length) return
    const timer = window.setTimeout(() => setFading([]), READ_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [fading])

  // 접속했을 때 이미 있던 편지는 그냥 놓고, 그 뒤에 도착한 편지만 등장 애니메이션을 준다
  const seen = useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = new Set(all.map((l) => l.id))
  const known = seen.current
  const fresh = letters.filter((l) => !known.has(l.id)).map((l) => l.id)
  useEffect(() => {
    for (const l of all) known.add(l.id)
  }, [all, known])

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
          {...poses[i]}
          delay={Math.round(l.jitter * MAX_STAGGER)}
          spawn={fresh.includes(l.id)}
        />
      ))}
      {/* 사라지는 도중에 초기화로 배경에 돌아온 편지는 배경 쪽으로만 그린다 */}
      {fading.filter((f) => !letters.some((l) => l.id === f.id)).map((f) => (
        <Letter key={f.id} id={f.id} {...f.pose} delay={0} spawn={false} fading />
      ))}
    </div>
  )
}

export default memo(LetterLayer)
