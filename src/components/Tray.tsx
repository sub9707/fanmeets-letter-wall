import { memo } from 'react'

// 읽은 편지 보관함의 틀. 안에 놓이는 편지들은 LetterLayer 가 같은 좌표계에서 그린다.
function Tray({ count }: { count: number }) {
  return (
    <aside className="tray">
      <div className="tray-title">읽은 편지 {count}</div>
      {count === 0 && <div className="tray-empty">읽은 편지가 여기에 보관됩니다</div>}
    </aside>
  )
}

export default memo(Tray)
