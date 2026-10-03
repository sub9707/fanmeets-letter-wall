import { useCallback, useState } from 'react'

const STORAGE_KEY = 'letter-wall:host-key'

const read = () => {
  // 주소에 ?key= 로 들어왔으면 그것을 쓰고 저장해 둔다 (다음부터는 주소에 없어도 된다)
  const fromUrl = new URLSearchParams(window.location.search).get('key')
  try {
    if (fromUrl) localStorage.setItem(STORAGE_KEY, fromUrl)
    return fromUrl ?? localStorage.getItem(STORAGE_KEY)
  } catch {
    return fromUrl
  }
}

// 이 브라우저에 저장된 진행자 키
export function useHostKey(): [string | null, (key: string | null) => void] {
  const [key, setKeyState] = useState(read)

  const setKey = useCallback((next: string | null) => {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 저장이 막혀 있어도 이번 접속에는 쓴다
    }
    setKeyState(next)
  }, [])

  return [key, setKey]
}
