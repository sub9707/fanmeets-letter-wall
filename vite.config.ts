import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 개발 서버(npm run dev)에서도 Worker·D1·Durable Object 가 로컬에서 같이 돈다
export default defineConfig({
  plugins: [react(), cloudflare()],
})
