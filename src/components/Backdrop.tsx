import type { ReactNode } from 'react'
import '../styles/dialogs.css'

interface Props {
  /** 바깥을 눌렀을 때. 없으면 닫을 수 없는 보기 전용 */
  onClose?: () => void
  className?: string
  children: ReactNode
}

// 모달 뒤의 어두운 배경
export default function Backdrop({ onClose, className = '', children }: Props) {
  return (
    <div className={`backdrop ${className}`} onClick={onClose}>
      <div className="backdrop-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
