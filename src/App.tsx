import { Suspense, lazy } from 'react'
import { PAGES } from './config.ts'

// 페이지마다 따로 내려받는다 (고객 PC 는 편지 쓰기 페이지 코드만 받는다)
const pages = {
  [PAGES.home]: lazy(() => import('./pages/HomePage.tsx')),
  [PAGES.write]: lazy(() => import('./pages/WritePage.tsx')),
  [PAGES.read]: lazy(() => import('./pages/ReadPage.tsx')),
  [PAGES.admin]: lazy(() => import('./pages/AdminPage.tsx')),
}

// 주소(경로)에 맞는 페이지를 고른다. 페이지 사이 이동은 일반 링크라 라우터가 필요 없다.
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const Page = pages[path as keyof typeof pages] ?? pages[PAGES.home]

  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
