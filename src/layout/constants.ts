import { STAGE_H, STAGE_W } from '../config.ts'

// 편지 배치 방식: write = 그리드만, read = 그리드/흩뿌리기 + 오른쪽 트레이
export type Mode = 'write' | 'read'

export const LETTER_ASPECT = 1600 / 959 // 편지 가로:세로 (src/assets/envelope.webp 크기)
export const LETTER_W = 163 // 편지의 기준 크기. 실제 크기는 포즈의 배율(s)로 정한다
export const LETTER_H = Math.round(LETTER_W / LETTER_ASPECT)

export const TRAY_W = 210 // 읽은 편지 트레이 너비
export const BOTTOM_UI = 84 // 하단 버튼 영역 높이

// 편지가 놓이는 영역. 읽기 모드에서는 오른쪽 트레이만큼 좁아진다
export const AREA_H = STAGE_H
export const areaWidth = (mode: Mode) => (mode === 'read' ? STAGE_W - TRAY_W : STAGE_W)
