import { useCallback, useEffect, useRef, useState } from 'react'
import { WS_PATH } from '../../shared/constants.ts'
import type { Action, Letter, Scene, ServerMessage } from '../../shared/types.ts'

const MAX_RETRY_MS = 5000
const EMPTY_SCENE: Scene = { phase: 'shuffle', scatter: null, openId: null, shuffleSeq: 0 }

const socketUrl = (key: string | null) =>
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${WS_PATH}${
    key ? `?key=${encodeURIComponent(key)}` : ''
  }`

/** 서버로 액션을 보낸다. 연결이 끊겨 보내지 못했으면 false */
export type Send = (action: Action) => boolean

// 서버 상태를 그대로 받아 쓰는 훅. 이 PC 에서 일어난 변경도 서버를 거쳐 돌아온 것만 화면에 반영해서
// 모든 PC 가 항상 같은 상태를 본다. 연결이 끊기면 알아서 다시 붙고, 붙는 즉시 최신 상태를 받는다.
// key(진행자 키)가 바뀌면 그 키로 다시 접속한다.
export function useServerState(key: string | null = null) {
  const [letters, setLetters] = useState<Letter[]>([])
  const [scene, setScene] = useState<Scene>(EMPTY_SCENE)
  const [ready, setReady] = useState(false) // 첫 상태를 받았는가
  const [online, setOnline] = useState(false)
  const [isHost, setIsHost] = useState(false) // 서버가 진행자 키를 확인해 줬는가
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let disposed = false
    let retryTimer: number | undefined
    let attempt = 0
    setIsHost(false)

    const onMessage = (message: ServerMessage) => {
      if (message.type === 'welcome') {
        setIsHost(message.host)
        return
      }
      setLetters(message.letters)
      setScene(message.scene)
      setReady(true)
    }

    const connect = () => {
      const socket = new WebSocket(socketUrl(key))
      socketRef.current = socket

      socket.onopen = () => {
        attempt = 0
        setOnline(true)
      }
      socket.onmessage = (event: MessageEvent<string>) => onMessage(JSON.parse(event.data) as ServerMessage)
      socket.onclose = () => {
        if (disposed) return
        setOnline(false)
        retryTimer = window.setTimeout(connect, Math.min(MAX_RETRY_MS, 400 * 2 ** attempt++))
      }
    }

    connect()
    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      socketRef.current?.close()
    }
  }, [key])

  const send = useCallback<Send>((action) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(action))
    return true
  }, [])

  return { letters, scene, ready, online, isHost, send }
}
