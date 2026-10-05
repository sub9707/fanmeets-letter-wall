import { STAGE_H, STAGE_W } from '../config.ts'

export const LETTER_ASPECT = 1600 / 959 // 편지 가로:세로 (src/assets/envelope.webp 크기)
export const LETTER_W = 163 // 편지의 기준 크기. 실제 크기는 포즈의 배율(s)로 정한다
export const LETTER_H = Math.round(LETTER_W / LETTER_ASPECT)

export const BOTTOM_UI = 84 // 하단 버튼 영역 높이

// 편지가 놓이는 영역 (무대 전체)
export const AREA_W = STAGE_W
export const AREA_H = STAGE_H
