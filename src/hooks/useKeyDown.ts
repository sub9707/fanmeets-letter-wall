import { useEffect, useRef } from 'react'

// window 의 keydown 을 듣는다. handler 는 매 렌더의 최신 것을 쓰므로 의존성을 신경 쓸 필요가 없다.
export function useKeyDown(handler: (e: KeyboardEvent) => void, enabled = true): void {
  const latest = useRef(handler)
  latest.current = handler

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => latest.current(e)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

// DOM 이벤트와 React 이벤트 모두에 쓸 수 있게 code 만 본다
export const isEnter = (e: { code: string }) => e.code === 'Enter' || e.code === 'NumpadEnter'
