// 원본 에셋(assets-src/*.png)을 앱에서 쓰는 최적화본(src/assets/*.webp)으로 변환한다.
// 원본을 교체했을 때: npm run assets
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp, { type Sharp } from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const SRC = path.join(root, 'assets-src')
const OUT = path.join(root, 'src', 'assets')

interface Job {
  from: string
  to: string
  run: (img: Sharp) => Sharp
}

const jobs: Job[] = [
  {
    // 화면 전체 배경 (종이 질감, 4K). 화면 비율이 달라도 cover 로 채운다
    from: 'background_4k.png',
    to: 'background.webp',
    run: (img) => img.webp({ quality: 80 }),
  },
  {
    // 배경 중앙의 펜 글씨 "To. BWS" — 투명 여백을 잘라낸다
    from: 'background-pen.png',
    to: 'to-bws.webp',
    run: (img) => img.trim().webp({ quality: 90, alphaQuality: 100 }),
  },
  {
    // 편지봉투 — 투명 여백을 잘라내야 봉투 자체가 편지 한 칸을 꽉 채운다.
    // 한 통만 있을 때 화면 너비의 40%(4K 에서 약 1540px)까지 커지므로 1600px 로 둔다.
    from: 'envelop_1800w_upscaled.png',
    to: 'envelope.webp',
    run: (img) => img.trim().resize({ width: 1600 }).webp({ quality: 86, alphaQuality: 95 }),
  },
  {
    // 편지지 (모달 / 작성 화면, 16:10). 4K 에서 모달이 약 2560x1600px 로 그려진다
    from: 'letter_1536x960.png',
    to: 'letter.webp',
    run: (img) => img.webp({ quality: 86 }),
  },
]

await mkdir(OUT, { recursive: true })
const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`

for (const job of jobs) {
  const input = path.join(SRC, job.from)
  const output = path.join(OUT, job.to)
  const info = await job.run(sharp(input)).toFile(output)
  const before = (await stat(input)).size
  console.log(`${job.from} (${kb(before)}) → ${job.to} ${info.width}x${info.height} (${kb(info.size)})`)
}
