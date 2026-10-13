import { useCallback, useEffect, useState } from 'react'
import { KIOSK_PIN } from '../config.ts'

const STORAGE_KEY = 'letter-wall:kiosk-locked'

// 브라우저마다 없을 수 있는 Keyboard Lock API (Chromium 전용)
interface KeyboardLock {
  lock: (keys?: string[]) => Promise<void>
  unlock: () => void
}
const keyboard = () => (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard

const readLocked = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
const writeLocked = (locked: boolean) => {
  try {
    if (locked) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장이 안 되면 새로고침했을 때 잠금이 풀릴 뿐이다
  }
}

// 쓰기 PC 의 전체화면 잠금. 브라우저는 Esc 로 전체화면을 나가는 것을 완전히 막을 수 없어서
//   - 잠긴 동안은 Keyboard Lock 으로 Esc 를 붙잡아 길게 눌러야만 나가지게 하고 (Chrome·Edge)
//   - 그래도 전체화면이 풀리면 화면을 덮어 다시 전체화면으로 돌아가거나 비밀번호를 넣기 전에는 쓰지 못하게 한다.
// 잠금 상태는 이 브라우저에 저장되어 새로고침해도 유지된다.
export function useKioskLock() {
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const [locked, setLocked] = useState(readLocked)

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // 잠긴 채 전체화면일 때만 Esc 를 붙잡는다 (전체화면이 아니면 브라우저가 거부한다)
  useEffect(() => {
    if (!locked || !fullscreen) return
    keyboard()
      ?.lock(['Escape'])
      .catch(() => {})
    return () => keyboard()?.unlock()
  }, [locked, fullscreen])

  // 잠긴 동안 창을 닫거나 새로고침하려 하면 한 번 더 묻는다
  useEffect(() => {
    if (!locked) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [locked])

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch((err: unknown) => {
      console.error('전체화면으로 바꾸지 못했습니다:', err)
    })
  }, [])

  /** 비밀번호가 맞으면 잠그고 true */
  const lock = useCallback((pin: string) => {
    if (pin !== KIOSK_PIN) return false
    writeLocked(true)
    setLocked(true)
    return true
  }, [])

  /** 비밀번호가 맞으면 잠금을 풀고 true (전체화면은 그대로 둔다) */
  const unlock = useCallback((pin: string) => {
    if (pin !== KIOSK_PIN) return false
    writeLocked(false)
    setLocked(false)
    return true
  }, [])

  return { fullscreen, locked, enterFullscreen, lock, unlock }
}
