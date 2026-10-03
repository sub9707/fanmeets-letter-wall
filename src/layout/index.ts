// 편지 배치 계산. 모든 편지는 하나의 레이어에 absolute 로 놓이고,
// 여기서 계산한 중심 좌표/각도/크기/z 로 transform 만 바뀐다.
import type { Letter, Pose, Scatter } from '../../shared/types.ts'
import { type Mode, areaWidth } from './constants.ts'
import { gridLayout } from './grid.ts'
import { trayLayout } from './tray.ts'
import { round, round3 } from './util.ts'

export { scatterOne, scatterPoses } from './scatter.ts'

interface LayoutInput {
  letters: Letter[]
  scatter: Scatter | null
  mode: Mode
}

// letters 와 같은 순서의 포즈 배열을 돌려준다
export function computeLayout({ letters, scatter, mode }: LayoutInput): Pose[] {
  const wallCount = letters.reduce((n, l) => n + (l.status === 'wall' ? 1 : 0), 0)
  const grid = gridLayout(wallCount, areaWidth(mode))
  const tray = trayLayout(letters.length - wallCount, mode)

  // 트레이는 읽은 순서대로 쌓는다
  const readOrder = letters.filter((l) => l.status === 'read').sort((a, b) => (a.readAt ?? 0) - (b.readAt ?? 0))
  const readIndex = new Map(readOrder.map((l, i) => [l.id, i]))

  let wallIndex = 0
  return letters.map((l) => {
    const tilt = round((l.jitter - 0.5) * 3)

    if (l.status === 'read') {
      const p = tray(readIndex.get(l.id) ?? 0)
      return { x: round(p.x), y: round(p.y), r: tilt, s: round3(p.s), z: p.z }
    }

    const i = wallIndex++
    const scattered = scatter?.[l.id]
    if (scattered) return scattered

    const p = grid(i)
    return { x: round(p.x), y: round(p.y), r: tilt, s: round3(p.s), z: i + 1 }
  })
}
