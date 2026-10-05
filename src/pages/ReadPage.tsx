import { useEffect, useMemo, useState } from 'react'
import type { Letter, Scene } from '../../shared/types.ts'
import ConnectionBadge from '../components/ConnectionBadge.tsx'
import LetterLayer from '../components/LetterLayer.tsx'
import LetterModal from '../components/LetterModal.tsx'
import ReadControls from '../components/ReadControls.tsx'
import Stage from '../components/Stage.tsx'
import Watermark from '../components/Watermark.tsx'
import { useKeyDown } from '../hooks/useKeyDown.ts'
import { useMoving } from '../hooks/useMoving.ts'
import { useReadActions } from '../hooks/useReadActions.ts'
import { useServerState } from '../net/useServerState.ts'

// 편지 읽기 (행사 진행 · 주인공용): 편지를 섞고, 골라서 펼쳐 읽는다. 키 없이 누구나 조작할 수 있다.
// 들어올 때마다 섞기 전 정렬 상태(쓰기 페이지와 같은 배치)에서 시작한다. 읽은 편지도 모두 돌아온다.
export default function ReadPage() {
  const { letters: serverLetters, scene: serverScene, ready, online, send } = useServerState()

  // 처음 상태를 받으면 진행 상태를 처음으로 되돌린다.
  // 되돌린 상태가 돌아오기 전까지는 예전 진행(섞인 배치, 펼친 편지, 읽은 편지)을 그리지 않고 처음 모습으로 그린다
  const [resetSent, setResetSent] = useState(false)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (ready && !resetSent && send({ type: 'reset' })) setResetSent(true)
  }, [ready, resetSent, send])
  if (resetSent && !started && isInitial(serverScene, serverLetters)) setStarted(true)
  const scene: Scene = started ? serverScene : { ...serverScene, phase: 'shuffle', scatter: null, openId: null }
  const letters = useMemo(
    () => (started ? serverLetters : serverLetters.map((l) => (l.status === 'read' ? { ...l, status: 'wall' as const } : l))),
    [started, serverLetters],
  )

  const actions = useReadActions(send, letters, scene)
  const moving = useMoving(scene.shuffleSeq)

  const openLetter = scene.openId ? letters.find((l) => l.id === scene.openId) : undefined

  useKeyDown((e) => {
    if (e.key === 'Escape' && openLetter) actions.closeLetter()
  })

  const stageClass = ['reading', 'interactive', scene.phase === 'select' ? 'selecting' : '', moving ? 'moving' : ''].join(
    ' ',
  )

  return (
    <Stage className={stageClass}>
      <Watermark />
      {ready && <LetterLayer letters={letters} scatter={scene.scatter} onPick={actions.pick} />}
      <ReadControls phase={scene.phase} onShuffle={actions.shuffle} onSelect={actions.select} onReset={actions.reset} />
      {openLetter && <LetterModal letter={openLetter} onClose={actions.closeLetter} />}
      <ConnectionBadge online={online} ready={ready} />
    </Stage>
  )
}

const isInitial = (scene: Scene, letters: Letter[]) =>
  scene.phase === 'shuffle' && scene.scatter === null && scene.openId === null && letters.every((l) => l.status === 'wall')
