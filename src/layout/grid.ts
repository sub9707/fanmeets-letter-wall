import { AREA_H, LETTER_ASPECT, LETTER_H, LETTER_W } from './constants.ts'

const PAD = 14 // 그리드와 화면 가장자리 사이 여백
const FILL = 0.95 // 한 칸에서 편지가 차지하는 비율 (나머지는 편지 사이 간격)
const MAX_W = 0.4 // 편지 한 통의 최대 너비 (영역 너비 대비)

export interface Slot {
  x: number
  y: number
  s: number
}

// 정렬(그리드) 배치: 편지 수에 맞춰 정사각에 가까운 격자를 만들고 화면을 거의 가득 채운다.
// 1통 → 1x1, 2통 → 1x2, 4통 → 2x2, 9통 → 3x3, 100통 → 10x10
// i 번째 편지의 자리를 돌려주는 함수를 반환한다.
export function gridLayout(count: number, areaW: number): (i: number) => Slot {
  // 영역이 16:9 보다 가로로 길면 열을 더 늘려 좌우가 비지 않게 한다
  const wideCols = Math.round(Math.sqrt((count * areaW) / AREA_H / LETTER_ASPECT))
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)), wideCols)
  const rows = Math.max(1, Math.ceil(count / cols))
  const cellW = (areaW - PAD * 2) / cols
  const cellH = (AREA_H - PAD * 2) / rows

  // 칸에 맞춰 키우되, 편지가 몇 통 없을 때 화면을 다 덮지 않도록 최대 크기를 둔다
  const s = Math.min((cellW * FILL) / LETTER_W, (cellH * FILL) / LETTER_H, (areaW * MAX_W) / LETTER_W)

  // 마지막 줄이 덜 찼으면 그 줄만 가운데로
  const lastRowCount = count - (rows - 1) * cols
  const lastRowShift = ((cols - lastRowCount) * cellW) / 2

  return (i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    return {
      x: PAD + (row === rows - 1 ? lastRowShift : 0) + (col + 0.5) * cellW,
      y: PAD + (row + 0.5) * cellH,
      s,
    }
  }
}
