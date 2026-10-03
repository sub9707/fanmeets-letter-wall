import { useEffect, useState } from 'react'
import { STAGE_H, STAGE_W } from '../config.ts'

const fit = () => Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H)

// 고정 크기 무대가 창 안에 꽉 차게 들어가는 배율
export function useStageScale(): number {
  const [scale, setScale] = useState(fit)

  useEffect(() => {
    const onResize = () => setScale(fit())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return scale
}
