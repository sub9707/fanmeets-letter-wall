import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.tsx'
import EditRow from '../components/EditRow.tsx'
import KeyDialog from '../components/KeyDialog.tsx'
import { PAGES } from '../config.ts'
import { useAdminActions } from '../hooks/useAdminActions.ts'
import { useConfirm } from '../hooks/useConfirm.ts'
import { useHostKey } from '../hooks/useHostKey.ts'
import { useServerState } from '../net/useServerState.ts'
import '../styles/admin.css'

// 편지 관리 (관리자 · 진행자용): 모든 편지의 내용을 목록으로 보고 고치거나 지운다.
// 편지 월 무대가 아니라 일반 웹 페이지로 그린다.
export default function AdminPage() {
  const [key, setKey] = useHostKey()
  const { letters, ready, online, isHost, send } = useServerState(key)
  const { confirm, ask, cancel } = useConfirm()
  const actions = useAdminActions(send, letters, ask)
  const [editingId, setEditingId] = useState<string | null>(null)

  // 진행자 키가 확인되기 전에는 아무것도 보여주지 않는다
  if (!isHost) {
    return (
      <div className="admin-gate">
        {ready && <KeyDialog rejected={Boolean(key)} onSubmit={setKey} />}
        {!ready && <p>{online ? '불러오는 중…' : '서버에 연결하는 중…'}</p>}
      </div>
    )
  }

  const readCount = letters.filter((l) => l.status === 'read').length

  return (
    <div className="admin">
      <header className="admin-header">
        <a className="admin-home" href={PAGES.home}>
          ←
        </a>
        <h1>편지 관리</h1>
        <span className="admin-count">
          전체 {letters.length}통 · 읽음 {readCount}통{!online && ' · 연결 끊김'}
        </span>
        <span className="admin-tools">
          <button type="button" onClick={actions.addSamples}>
            샘플 +10
          </button>
          <button type="button" className="danger" onClick={actions.askClear} disabled={letters.length === 0}>
            전체 삭제
          </button>
        </span>
      </header>

      {letters.length === 0 ? (
        <p className="admin-empty">아직 작성된 편지가 없습니다</p>
      ) : (
        <ul className="admin-list">
          {letters.map((l, i) => (
            <EditRow
              key={l.id}
              letter={l}
              index={i}
              editing={editingId === l.id}
              onEdit={setEditingId}
              onUpdate={actions.update}
              onRemove={actions.askRemove}
            />
          ))}
        </ul>
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={cancel} />}
    </div>
  )
}
