// 흩뿌린 편지의 기하 계산 (위치·크기, 점이 편지 안에 있는지)
import { AREA_H, LETTER_H, LETTER_W, areaWidth } from './constants.ts'

const COVER = 1.7 // 편지 면적 합 / 화면 면적. 클수록 편지가 커지고 배경이 덜 비친다
const MAX_W = 0.35 // 편지 한 통의 기준 너비 상한 (영역 너비 대비)
const OVERHANG = 0.5 // 화면 가장자리 밖으로 걸칠 수 있는 정도 (가장자리가 비지 않게)
const OVERHANG_TRAY = 0.1 // 트레이 쪽은 거의 넘어가지 않게

export const AREA_W = areaWidth('read') // 흩뿌리기는 읽기 모드에서만 일어난다

/** 흩뿌릴 편지 한 통의 후보값 */
export interface Candidate {
  /** 영역 안의 위치 (0~1) */
  u: number
  v: number
  /** 각도(deg) */
  r: number
  /** 편지마다 다른 크기 배율 */
  k: number
  /** 겹침 순서 */
  z: number
}

export interface Point {
  x: number
  y: number
}

/** 화면 위에 놓인 회전된 편지 */
export interface Box extends Point {
  s: number
  cos: number
  sin: number
}

// 후보 → 화면 위의 상자. 기준 크기는 "n 통이 화면을 덮을 만큼"으로 잡는다.
export function place(c: Candidate, n: number): Box {
  const cover = Math.sqrt((COVER * AREA_W * AREA_H) / (n * LETTER_W * LETTER_H))
  const s = c.k * Math.min(cover, (MAX_W * AREA_W) / LETTER_W)
  const rad = (c.r * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  // 회전·확대된 편지의 외곽 박스 절반 크기
  const hx = (s * (Math.abs(cos) * LETTER_W + Math.abs(sin) * LETTER_H)) / 2
  const hy = (s * (Math.abs(sin) * LETTER_W + Math.abs(cos) * LETTER_H)) / 2
  const minX = hx * (1 - OVERHANG)
  const maxX = AREA_W - hx * (1 - OVERHANG_TRAY)
  const minY = hy * (1 - OVERHANG)
  return { x: minX + c.u * (maxX - minX), y: minY + c.v * (AREA_H - minY * 2), s, cos, sin }
}

// 점 pt 가 상자 b 안에 있는가
export function covers(b: Box, pt: Point): boolean {
  const dx = pt.x - b.x
  const dy = pt.y - b.y
  return (
    Math.abs(dx * b.cos + dy * b.sin) <= (LETTER_W * b.s) / 2 &&
    Math.abs(-dx * b.sin + dy * b.cos) <= (LETTER_H * b.s) / 2
  )
}

// 상자 표면에 고르게 찍은 점들 (화면 밖으로 나간 부분은 어차피 안 보이므로 뺀다)
export function samplePoints(b: Box, cols: number, rows: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const lx = ((i + 0.5) / cols - 0.5) * LETTER_W * b.s
      const ly = ((j + 0.5) / rows - 0.5) * LETTER_H * b.s
      const x = b.x + lx * b.cos - ly * b.sin
      const y = b.y + lx * b.sin + ly * b.cos
      if (x >= 0 && x <= AREA_W && y >= 0 && y <= AREA_H) pts.push({ x, y })
    }
  }
  return pts
}
