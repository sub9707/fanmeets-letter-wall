import { useCallback, useState } from 'react'
import Composer from '../components/Composer.tsx'
import ConnectionBadge from '../components/ConnectionBadge.tsx'
import KioskControls, { type PinMode } from '../components/KioskControls.tsx'
import LetterLayer from '../components/LetterLayer.tsx'
import Stage from '../components/Stage.tsx'
import { useKioskLock } from '../hooks/useKioskLock.ts'
import { useServerState } from '../net/useServerState.ts'

// 편지 쓰기 (고객용): 편지 월 위에서 Enter 로 편지를 써서 붙인다. 진행자 키가 필요 없다.
// 읽기 진행과는 무관해서 항상 정렬(그리드) 상태로 보인다.
// 우측 하단 버튼으로 전체화면으로 바꾸고 비밀번호로 잠글 수 있다 (고객이 화면을 나가지 못하게).
export default function WritePage() {
  const { letters, ready, online, send } = useServerState()
  const submit = useCallback((text: string) => send({ type: 'add', texts: [text] }), [send])
  const kiosk = useKioskLock()
  const [pin, setPin] = useState<PinMode | null>(null)
  // 비밀번호 창이나 잠금 화면이 떠 있는 동안은 편지를 쓰지 못한다
  const blocked = pin !== null || (kiosk.locked && !kiosk.fullscreen)

  return (
    <Stage className="writing">
      {ready && <LetterLayer letters={letters} scatter={null} />}
      <Composer active={ready && !blocked} onSubmit={submit} />
      <KioskControls kiosk={kiosk} pin={pin} onPin={setPin} />
      <ConnectionBadge online={online} ready={ready} />
    </Stage>
  )
}
