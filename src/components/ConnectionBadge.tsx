interface Props {
  online: boolean
  /** 한 번이라도 서버 상태를 받았는가 */
  ready: boolean
}

// 서버와 연결이 끊겼을 때만 보이는 알림
export default function ConnectionBadge({ online, ready }: Props) {
  if (online) return null
  return <div className="connection-badge">{ready ? '서버와 연결이 끊겼습니다 · 다시 연결하는 중…' : '서버에 연결하는 중…'}</div>
}
