// 섞기: 편지를 화면 전체에 무작위 위치·각도·크기로 흩뿌린 포즈를 만든다.
// 섞기를 누른 PC 가 한 번 계산해서 서버로 보내고, 모든 PC 가 같은 포즈를 그린다.
import type { Pose, Scatter } from '../../shared/types.ts'
import { AREA_H, LETTER_ASPECT } from './constants.ts'
import { assignDepth } from './depth.ts'
import { AREA_W, type Candidate, place } from './geometry.ts'
import { round, round3, shuffled } from './util.ts'

const candidate = (u = Math.random(), v = Math.random()): Candidate => ({
  u,
  v,
  r: (Math.random() - 0.5) * 100,
  k: 0.75 + Math.random() * 0.55,
  z: 0,
})

const toPose = (c: Candidate, n: number): Pose => {
  const box = place(c, n)
  return { x: round(box.x), y: round(box.y), r: round(c.r), s: round3(box.s), z: c.z }
}

// 완전 무작위 좌표는 한쪽에 뭉치고 다른 쪽이 비기 쉬워서, 화면을 칸으로 나눠
// 칸마다 한 통씩 넣고 칸 안에서 무작위로 흔든다 (칸 구조는 눈에 보이지 않는다).
export function scatterPoses(ids: string[]): Scatter {
  const n = ids.length
  const cols = Math.max(1, Math.round(Math.sqrt((n * AREA_W) / AREA_H / LETTER_ASPECT)))
  const rows = Math.max(1, Math.ceil(n / cols))
  const cells = shuffled(Array.from({ length: cols * rows }, (_, i) => i))

  const candidates = ids.map((_, i) => {
    const cell = cells[i]
    return candidate(((cell % cols) + Math.random()) / cols, (Math.floor(cell / cols) + Math.random()) / rows)
  })
  assignDepth(candidates, n)

  return Object.fromEntries(ids.map((id, i) => [id, toPose(candidates[i], n)]))
}

// 트레이에서 돌아온 편지 한 통의 자리. 다른 편지 밑에 깔리지 않게 맨 위(z)에 놓는다
export function scatterOne(scatter: Scatter): Pose {
  const poses = Object.values(scatter)
  const c = candidate()
  c.z = 1 + Math.max(0, ...poses.map((p) => p.z))
  return toPose(c, poses.length + 1)
}
