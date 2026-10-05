// 편지 배치 계산. 모든 편지는 하나의 레이어에 absolute 로 놓이고,
// 여기서 계산한 중심 좌표/각도/크기/z 로 transform 만 바뀐다.
import type { Letter, Pose, Scatter } from '../../shared/types.ts'
import { AREA_W } from './constants.ts'
import { gridLayout } from './grid.ts'
import { round, round3 } from './util.ts'

export { scatterPoses } from './scatter.ts'

// letters(배경에 쌓인 편지)와 같은 순서의 포즈 배열을 돌려준다
export function computeLayout(letters: Letter[], scatter: Scatter | null): Pose[] {
  const grid = gridLayout(letters.length, AREA_W)
  return letters.map((l, i) => {
    const scattered = scatter?.[l.id]
    if (scattered) return scattered
    const p = grid(i)
    return { x: round(p.x), y: round(p.y), r: round((l.jitter - 0.5) * 3), s: round3(p.s), z: i + 1 }
  })
}
