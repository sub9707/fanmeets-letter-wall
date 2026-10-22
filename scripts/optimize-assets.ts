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
  run: (img: Sharp) => Sharp | Promise<Sharp>
}

const jobs: Job[] = [
  {
    // 화면 전체 배경 (4K). 가운데에 "To. WONI" 글씨가 그려져 있다. 화면 비율이 달라도 cover 로 채운다
    from: 'background_4k.png',
    to: 'background.webp',
    run: (img) => img.webp({ quality: 80 }),
  },
  {
    // 첫 화면 로고 — 배경의 "To. WONI" 글씨 부분만 잘라 밝기로 투명도를 만든다 (어두운 글씨만 남고 분홍 배경은 투명)
    from: 'background_4k.png',
    to: 'to-woni.webp',
    run: (img) =>
      img
        .removeAlpha()
        .extract({ left: 620, top: 700, width: 2600, height: 580 })
        .greyscale()
        .linear(-255 / 150, (255 * 210) / 150)
        .toColourspace('b-w')
        .toBuffer()
        .then((alpha) =>
          sharp({ create: { width: 2600, height: 580, channels: 3, background: '#3a2e31' } })
            .joinChannel(alpha)
            .png()
            .toBuffer(),
        )
        .then((png) => sharp(png).trim().webp({ quality: 90, alphaQuality: 100 })),
  },
  {
    // 편지봉투. 원본(1200px)보다 키우지 않는다
    from: 'envelope.png',
    to: 'envelope.webp',
    run: (img) => img.webp({ quality: 86 }),
  },
  {
    // 편지지 (모달 / 작성 화면). 위쪽에 "To. WONI" 제목과 하트 구분선이 그려져 있다
    from: 'letter.png',
    to: 'letter.webp',
    run: (img) => img.webp({ quality: 90 }),
  },
]

await mkdir(OUT, { recursive: true })
const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`

for (const job of jobs) {
  const input = path.join(SRC, job.from)
  const output = path.join(OUT, job.to)
  const info = await (await job.run(sharp(input))).toFile(output)
  const before = (await stat(input)).size
  console.log(`${job.from} (${kb(before)}) → ${job.to} ${info.width}x${info.height} (${kb(info.size)})`)
}
