import { useCallback } from 'react'
import Composer from '../components/Composer.tsx'
import ConnectionBadge from '../components/ConnectionBadge.tsx'
import LetterLayer from '../components/LetterLayer.tsx'
import Stage from '../components/Stage.tsx'
import Watermark from '../components/Watermark.tsx'
import { useServerState } from '../net/useServerState.ts'

// 편지 쓰기 (고객용): 편지 월 위에서 Enter 로 편지를 써서 붙인다. 진행자 키가 필요 없다.
// 읽기 진행과는 무관해서 항상 정렬(그리드) 상태로 보인다.
export default function WritePage() {
  const { letters, ready, online, send } = useServerState()
  const submit = useCallback((text: string) => send({ type: 'add', texts: [text] }), [send])

  return (
    <Stage className="writing">
      <Watermark />
      {ready && <LetterLayer letters={letters} scatter={null} />}
      <Composer active={ready} onSubmit={submit} />
      <ConnectionBadge online={online} ready={ready} />
    </Stage>
  )
}
