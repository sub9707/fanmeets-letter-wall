import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { API, CHANGED_EVENT, HOST_KEY_HEADER, REALTIME_CHANNEL } from '../../shared/constants.ts'
import type { Action, Letter, Scene, StateView } from '../../shared/types.ts'

/** Realtime 알림이 빠져도 이 간격으로 상태를 다시 받아온다 */
const POLL_MS = 10_000
const EMPTY_SCENE: Scene = { phase: 'shuffle', scatter: null, openId: null, shuffleSeq: 0 }

// 화면은 Supabase 를 "상태가 바뀌었다" 알림을 받는 데만 쓴다. 편지는 항상 /api 를 거쳐 받는다
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function request(key: string | null, path: string, action?: Action): Promise<StateView> {
  const headers: Record<string, string> = {}
  if (key) headers[HOST_KEY_HEADER] = key
  if (action) headers['Content-Type'] = 'application/json'
  const res = await fetch(path, {
    method: action ? 'POST' : 'GET',
    headers,
    body: action ? JSON.stringify(action) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`${path} ${res.status}`)
  return (await res.json()) as StateView
}

/** 서버로 액션을 보낸다. 연결이 끊겨 보내지 못했으면 false */
export type Send = (action: Action) => boolean

// 서버 상태를 그대로 받아 쓰는 훅. 이 PC 에서 일어난 변경도 서버를 거쳐 돌아온 것만 화면에 반영해서
// 모든 PC 가 항상 같은 상태를 본다. 다른 PC 의 변경은 Realtime 알림을 받으면 바로 다시 받아오고,
// 알림이 빠져도 주기적으로 다시 받아온다. key(진행자 키)가 바뀌면 그 키로 처음부터 다시 받는다.
export function useServerState(key: string | null = null) {
  const [letters, setLetters] = useState<Letter[]>([])
  const [scene, setScene] = useState<Scene>(EMPTY_SCENE)
  const [ready, setReady] = useState(false) // 첫 상태를 받았는가
  const [online, setOnline] = useState(false) // 마지막 요청이 성공했는가
  const [isHost, setIsHost] = useState(false) // 서버가 진행자 키를 확인해 줬는가
  const onlineRef = useRef(false)
  const sendRef = useRef<Send>(() => false)

  useEffect(() => {
    let disposed = false
    let version = -1
    // 액션은 보낸 순서대로 하나씩 처리되게 줄을 세운다
    let queue: Promise<void> = Promise.resolve()
    setIsHost(false)

    const markOnline = (value: boolean) => {
      onlineRef.current = value
      if (!disposed) setOnline(value)
    }

    // 응답은 순서가 뒤바뀌어 도착할 수 있으므로 이미 본 것보다 새로운 상태만 반영한다
    const apply = (view: StateView) => {
      if (disposed) return
      markOnline(true)
      if (view.version <= version) return
      version = view.version
      setIsHost(view.host)
      setLetters(view.letters)
      setScene(view.scene)
      setReady(true)
    }

    const refresh = () =>
      request(key, API.state).then(apply, (err: unknown) => {
        console.error('상태를 받아오지 못했습니다:', err)
        markOnline(false)
      })

    sendRef.current = (action) => {
      if (!onlineRef.current) return false
      queue = queue
        .then(() => request(key, API.action, action))
        .then(apply, (err: unknown) => {
          console.error('액션을 보내지 못했습니다:', err)
          markOnline(false)
          void refresh()
        })
      return true
    }

    const channel = supabase
      .channel(REALTIME_CHANNEL)
      .on('broadcast', { event: CHANGED_EVENT }, ({ payload }) => {
        const next = (payload as { version?: unknown }).version
        if (typeof next !== 'number' || next > version) void refresh()
      })
      // 다시 연결되면 그 사이 놓친 변경을 받아온다
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void refresh()
      })

    void refresh()
    const poll = window.setInterval(() => void refresh(), POLL_MS)

    return () => {
      disposed = true
      window.clearInterval(poll)
      sendRef.current = () => false
      void supabase.removeChannel(channel)
    }
  }, [key])

  const send = useCallback<Send>((action) => sendRef.current(action), [])

  return { letters, scene, ready, online, isHost, send }
}
