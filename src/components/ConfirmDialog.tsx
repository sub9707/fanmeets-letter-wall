import type { ConfirmState } from '../hooks/useConfirm.ts'
import Backdrop from './Backdrop.tsx'

interface Props extends ConfirmState {
  onCancel: () => void
}

// window.confirm 대신 쓰는 커스텀 확인창
export default function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Backdrop className="confirm-backdrop" onClose={onCancel}>
      <div className="confirm">
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-light" type="button" onClick={onCancel}>
            취소
          </button>
          <button className="btn btn-dark" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Backdrop>
  )
}
