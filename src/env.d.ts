/// <reference types="vite/client" />

// vite.config.ts 의 define 이 빌드 때 채운다 (Supabase 연동 환경 변수에서)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
}
