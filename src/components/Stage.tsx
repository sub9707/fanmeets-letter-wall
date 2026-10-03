import type { CSSProperties, ReactNode } from 'react'
import { STAGE_H, STAGE_W } from '../config.ts'
import { useStageScale } from '../hooks/useStageScale.ts'
import { LETTER_H, LETTER_W, TRAY_W } from '../layout/constants.ts'

// 무대 크기와, 스타일에서 쓰는 CSS 변수
const SIZE_VARS: CSSProperties & Record<`--${string}`, string> = {
  width: STAGE_W,
  height: STAGE_H,
  '--lw': `${LETTER_W}px`,
  '--lh': `${LETTER_H}px`,
  '--tray-w': `${TRAY_W}px`,
}

interface Props {
  className: string
  children: ReactNode
}

// 고정 크기(1920x1080) 무대. 창 크기에 맞춰 통째로 확대·축소해서 가운데에 놓는다.
// 창 비율이 16:9 가 아니면 남는 곳은 같은 배경 종이가 이어져 보인다.
export default function Stage({ className, children }: Props) {
  const scale = useStageScale()

  return (
    <div className="viewport">
      <div className={`stage ${className}`} style={{ ...SIZE_VARS, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
