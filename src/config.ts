// 화면 전체에서 쓰는 설정값

// 편지 월 화면은 이 크기의 고정 무대 위에 그리고, 실제 창 크기에 맞춰 통째로 확대·축소한다.
// 그래서 와이드 스크린, 롤스크린, PC 어디서든 배치와 비율이 똑같다.
export const STAGE_W = 1920
export const STAGE_H = 1080

export const MOVE_MS = 1200 // 편지 이동 시간 (styles/base.css 의 --letter-ms 와 같은 값)
export const MAX_STAGGER = 90 // 섞을 때 편지마다 출발 시점을 살짝 다르게 (ms)
export const READ_FADE_MS = 1500 // 읽은 편지가 서서히 사라지는 시간 (styles/base.css 의 --read-fade-ms 와 같은 값)

/** 페이지 주소 */
export const PAGES = {
  home: '/',
  write: '/write',
  read: '/read',
  admin: '/admin',
} as const
