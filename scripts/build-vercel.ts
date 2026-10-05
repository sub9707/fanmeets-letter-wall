// vite build 결과(dist)와 서버 코드를 Vercel Build Output API 형식(.vercel/output)으로 내보낸다.
// Vercel 은 빌드 뒤 .vercel/output 이 있으면 그대로 배포한다.
// (TypeScript 7 은 Vercel 의 api/*.ts 자동 컴파일과 맞지 않아서 서버 코드를 직접 묶는다)
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import { API } from '../shared/constants.ts'

const OUT = '.vercel/output'
const BUNDLE = '.vercel/server'
const REGION = 'icn1' // 서울. Supabase 와 같은 곳

rmSync(OUT, { recursive: true, force: true })

// 1. 서버 코드를 의존성까지 한 파일로
await build({
  configFile: false,
  logLevel: 'warn',
  ssr: { noExternal: true, target: 'node' },
  build: {
    ssr: 'server/vercel.ts',
    outDir: BUNDLE,
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: { output: { format: 'es', entryFileNames: 'index.mjs' } },
  },
})

// 2. 화면
cpSync('dist', join(OUT, 'static'), { recursive: true })

// 3. 함수 (같은 묶음을 주소마다 하나씩)
for (const path of Object.values(API)) {
  const dir = join(OUT, 'functions', `${path.slice(1)}.func`)
  mkdirSync(dir, { recursive: true })
  cpSync(BUNDLE, dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }))
  writeFileSync(
    join(dir, '.vc-config.json'),
    JSON.stringify({
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      regions: [REGION],
      maxDuration: 10,
    }),
  )
}

// 4. 주소 규칙: 파일·함수가 있으면 그것, 아니면 SPA 라서 index.html
writeFileSync(
  join(OUT, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '^/assets/(.*)$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
        { handle: 'filesystem' },
        { src: '^/api/(.*)$', status: 404, dest: '/404' },
        { src: '^/(.*)$', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
)

console.log(`Vercel 출력 완료: ${OUT}`)
