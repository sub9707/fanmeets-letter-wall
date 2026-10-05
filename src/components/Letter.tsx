import { type CSSProperties, memo, useEffect, useState } from 'react'
import type { Pose } from '../../shared/types.ts'
import { STAGE_H, STAGE_W } from '../config.ts'

// 새 편지가 나타나는 지점 (작성 화면의 편지지 자리)
const SPAWN = `translate3d(${STAGE_W / 2}px,${STAGE_H * 0.45}px,0) rotate(0deg) scale(1.6)`

interface Props extends Pose {
  id: string
  /** 이동 시작 지연(ms) */
  delay: number
  /** 방금 도착한 편지라 등장 애니메이션이 필요한가 */
  spawn: boolean
  /** 읽혀서 서서히 사라지는 중인가 */
  fading?: boolean
}

// 배경에 놓이는 편지 한 통. 내용은 보여주지 않고 봉투 이미지만 그린다.
// DOM 노드는 편지의 수명 동안 하나만 유지되고 transform 만 바뀐다 (정렬 ↔ 흩뿌리기).
// 클릭/호버 가능 여부는 상위 .stage 클래스로만 제어해서 모드가 바뀌어도 리렌더가 없다.
function Letter({ id, x, y, r, s, z, delay, spawn, fading = false }: Props) {
  // 방금 작성된 편지는 편지지 자리에서 나타나 자기 자리로 날아간다
  const [entered, setEntered] = useState(!spawn)

  useEffect(() => {
    if (entered) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [entered])

  const style: CSSProperties = entered
    ? {
        transform: `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`,
        zIndex: z,
        transitionDelay: `${delay}ms`,
      }
    : { transform: SPAWN, zIndex: z, opacity: 0, transition: 'none' }

  return (
    <div className={`letter ${fading ? 'fading' : 'wall'}`} data-id={id} style={style}>
      <div className="letter-face" />
    </div>
  )
}

export default memo(Letter)
