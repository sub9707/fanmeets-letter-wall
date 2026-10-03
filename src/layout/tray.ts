import { STAGE_H, STAGE_W } from '../config.ts'
import { BOTTOM_UI, LETTER_H, LETTER_W, type Mode, TRAY_W } from './constants.ts'
import type { Slot } from './grid.ts'

const SCALE = Math.min(1, (TRAY_W - 36) / LETTER_W)
const HEIGHT = LETTER_H * SCALE
const TOP = 64 + 12 + HEIGHT / 2 // 트레이 제목 아래 첫 편지의 중심
const AVAILABLE = STAGE_H - BOTTOM_UI - 12 - HEIGHT / 2 - TOP

// 읽은 편지 트레이: 세로로 쌓고, 많아지면 간격을 좁혀 겹친다.
// 작성 모드에서는 트레이와 함께 화면 오른쪽 밖으로 빠진다.
export function trayLayout(count: number, mode: Mode): (i: number) => Slot & { z: number } {
  const step = count > 1 ? Math.min(HEIGHT + 10, AVAILABLE / (count - 1)) : 0
  const x = mode === 'read' ? STAGE_W - TRAY_W / 2 : STAGE_W + TRAY_W
  return (i) => ({ x, y: TOP + i * step, s: SCALE, z: 1000 + i })
}
