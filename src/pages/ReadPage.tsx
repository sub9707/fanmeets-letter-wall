import { useState } from 'react'
import ConnectionBadge from '../components/ConnectionBadge.tsx'
import KeyDialog from '../components/KeyDialog.tsx'
import LetterLayer from '../components/LetterLayer.tsx'
import LetterModal from '../components/LetterModal.tsx'
import ReadControls from '../components/ReadControls.tsx'
import Stage from '../components/Stage.tsx'
import Watermark from '../components/Watermark.tsx'
import { useHostKey } from '../hooks/useHostKey.ts'
import { useKeyDown } from '../hooks/useKeyDown.ts'
import { useMoving } from '../hooks/useMoving.ts'
import { useReadActions } from '../hooks/useReadActions.ts'
import { useServerState } from '../net/useServerState.ts'

// 편지 읽기 (행사 진행 · 주인공용): 편지를 섞고, 골라서 펼쳐 읽는다.
// 진행자 키가 있는 화면만 조작할 수 있고, 키 없이 열면 같은 진행을 따라 보여주는 보기 전용 화면이 된다
// (대형 스크린, 프로젝터 등).
export default function ReadPage() {
  const [key, setKey] = useHostKey()
  const { letters, scene, ready, online, isHost, send } = useServerState(key)
  const actions = useReadActions(send, letters, scene)
  const moving = useMoving(scene.shuffleSeq)
  const [askingKey, setAskingKey] = useState(false)

  const openLetter = scene.openId ? letters.find((l) => l.id === scene.openId) : undefined

  useKeyDown((e) => {
    if (e.key === 'Escape' && openLetter && isHost) actions.closeLetter()
  })

  const stageClass = [
    'reading',
    scene.phase === 'select' ? 'selecting' : '',
    moving ? 'moving' : '',
    isHost ? 'interactive' : '',
  ].join(' ')

  return (
    <Stage className={stageClass}>
      <Watermark />
      {ready && (
        <LetterLayer letters={letters} scatter={scene.scatter} onPick={isHost ? actions.pick : undefined} />
      )}

      {isHost ? (
        <ReadControls phase={scene.phase} onShuffle={actions.shuffle} onSelect={actions.select} onReset={actions.reset} />
      ) : (
        // 보기 전용 화면에서는 거의 보이지 않게 두고, 마우스를 올리면 나타난다
        <button className="key-button" type="button" onClick={() => setAskingKey(true)}>
          진행자 키 입력
        </button>
      )}

      {openLetter && <LetterModal letter={openLetter} onClose={isHost ? actions.closeLetter : undefined} />}
      {askingKey && !isHost && (
        <KeyDialog
          rejected={Boolean(key) && ready}
          onSubmit={setKey}
          onCancel={() => setAskingKey(false)}
        />
      )}
      <ConnectionBadge online={online} ready={ready} />
    </Stage>
  )
}
