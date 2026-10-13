import type { useKioskLock } from '../hooks/useKioskLock.ts'
import Backdrop from './Backdrop.tsx'
import PinDialog from './PinDialog.tsx'

export type PinMode = 'lock' | 'unlock'

interface Props {
  kiosk: ReturnType<typeof useKioskLock>
  /** 지금 띄운 비밀번호 창 */
  pin: PinMode | null
  onPin: (mode: PinMode | null) => void
}

// 쓰기 화면 우측 하단의 전체화면 / 잠금 버튼과, 잠긴 채 전체화면이 풀렸을 때 화면을 덮는 잠금 화면
export default function KioskControls({ kiosk, pin, onPin }: Props) {
  const { fullscreen, locked, enterFullscreen, lock, unlock } = kiosk
  // 비밀번호가 맞으면 창을 닫는다
  const check = (apply: (value: string) => boolean) => (value: string) => {
    const ok = apply(value)
    if (ok) onPin(null)
    return ok
  }

  return (
    <>
      {locked && !fullscreen && (
        <Backdrop>
          <div className="confirm">
            <p className="confirm-message">화면이 잠겨 있습니다</p>
            <div className="confirm-actions">
              <button className="btn btn-light" type="button" onClick={() => onPin('unlock')}>
                잠금 해제
              </button>
              <button className="btn btn-dark" type="button" onClick={enterFullscreen}>
                전체화면으로 돌아가기
              </button>
            </div>
          </div>
        </Backdrop>
      )}

      {/* 잠긴 동안은 버튼을 흐리게 숨겨 둔다 (진행자만 알고 누르게) */}
      <div className="corner kiosk-corner">
        {!fullscreen && !locked && (
          <button className="btn btn-ghost" type="button" onClick={enterFullscreen}>
            전체화면
          </button>
        )}
        {fullscreen && !locked && (
          <button className="btn btn-ghost" type="button" onClick={() => onPin('lock')}>
            잠금
          </button>
        )}
        {fullscreen && locked && (
          <button className="kiosk-unlock" type="button" onClick={() => onPin('unlock')} aria-label="잠금 해제">
            🔒
          </button>
        )}
      </div>

      {pin === 'lock' && (
        <PinDialog
          message="잠금 비밀번호를 입력해주세요"
          onSubmit={check(lock)}
          onCancel={() => onPin(null)}
        />
      )}
      {pin === 'unlock' && (
        <PinDialog
          message="잠금 해제 비밀번호를 입력해주세요"
          onSubmit={check(unlock)}
          onCancel={() => onPin(null)}
        />
      )}
    </>
  )
}
