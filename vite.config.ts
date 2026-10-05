import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const pick = (env: Record<string, string>, ...names: string[]) => names.map((name) => env[name]).find(Boolean) ?? ''

// 개발 서버(npm run dev)에서 /api/* 를 배포 때와 같은 코드(server/app.ts)로 처리한다
function api(): Plugin {
  return {
    name: 'letter-wall-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        void (async () => {
          const { handle } = (await server.ssrLoadModule('/server/app.ts')) as typeof import('./server/app.ts')
          const { serveNode } = (await server.ssrLoadModule('/server/node.ts')) as typeof import('./server/node.ts')
          await serveNode(handle, req, res)
        })().catch(next)
      })
    },
  }
}

export default defineConfig(({ command, mode }) => {
  // .env.local 과 Vercel 환경 변수를 서버 코드(process.env)에서도 읽을 수 있게
  const env = loadEnv(mode, process.cwd(), '')
  for (const [name, value] of Object.entries(env)) process.env[name] ??= value
  if (command === 'serve') process.env.HOST_KEY ??= 'local-host-key'

  // 화면에는 Supabase 주소와 공개 키만 넣는다 (Realtime 알림 수신용)
  const supabaseUrl = pick(env, 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const supabaseKey = pick(
    env,
    'SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  )
  if (command === 'build' && (!supabaseUrl || !supabaseKey)) {
    throw new Error('SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY 환경 변수가 없습니다')
  }

  return {
    plugins: [react(), api()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(supabaseKey),
    },
  }
})
