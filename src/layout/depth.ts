// 흩뿌린 편지들의 겹침 순서 정하기.
// 순서를 완전 무작위로 주면 다른 편지들 밑에 통째로 깔려 안 보이는 편지가 생긴다.
//   1) 대체로 작은 편지가 큰 편지 위에 오도록 쌓는다 (크기가 무작위라 순서도 매번 달라진다).
//   2) 그래도 여러 통에 덮여 거의 안 보이는 편지는 맨 위로 올리면서 조금 줄인다.
//      (줄이지 않고 올리기만 하면 이번에는 그 편지가 다른 편지를 가린다)
// 보이는 정도는 편지 표면에 점을 찍어, 위에 놓인 편지에 덮이지 않은 점의 비율로 잰다.
import { type Box, type Candidate, type Point, covers, place, samplePoints } from './geometry.ts'

const SAMPLE_COLS = 9
const SAMPLE_ROWS = 6
const MIN_VISIBLE = 0.3 // 화면 안에 들어온 표면 중 최소 이 비율은 보여야 한다
const SHRINK = 0.88 // 가려진 편지를 올릴 때 줄이는 비율
const MIN_K = 0.5 // 이보다 작게는 줄이지 않는다
const MAX_PASSES = 40

interface RankedBox extends Box {
  c: Candidate
  pts: Point[]
  rank: number
}

function build(c: Candidate, n: number): RankedBox {
  const box = place(c, n)
  return {
    ...box,
    c,
    pts: samplePoints(box, SAMPLE_COLS, SAMPLE_ROWS),
    // 크기에 약간의 무작위를 섞어 "작은 것이 무조건 위"가 되지는 않게 한다
    rank: box.s * (0.9 + Math.random() * 0.2),
  }
}

// order[0] 이 맨 위. i 번째 상자가 그 위의 상자들에 너무 많이 가려졌는가
function isHidden(order: RankedBox[], i: number): boolean {
  const box = order[i]
  let visible = 0
  for (const pt of box.pts) {
    let covered = false
    for (let k = 0; k < i && !covered; k++) covered = covers(order[k], pt)
    if (!covered) visible++
  }
  return visible < box.pts.length * MIN_VISIBLE
}

// 후보들의 k(크기 배율)를 필요하면 줄이고, 각 후보의 z 를 채운다
export function assignDepth(candidates: Candidate[], n: number): void {
  let order = candidates.map((c) => build(c, n)).sort((a, b) => a.rank - b.rank)

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const hidden = new Set(order.filter((_, i) => isHidden(order, i)))
    if (hidden.size === 0) break
    const raised = [...hidden].map((box) => {
      box.c.k = Math.max(MIN_K, box.c.k * SHRINK)
      return build(box.c, n)
    })
    raised.sort((a, b) => a.rank - b.rank)
    order = [...raised, ...order.filter((box) => !hidden.has(box))]
  }

  order.forEach((box, i) => {
    box.c.z = order.length - i
  })
}
