import type { Letter } from '../../shared/types.ts'

interface Props {
  /** 우선순위 순서대로 정렬된 편지 */
  letters: Letter[]
  onMove: (id: string, delta: -1 | 1) => void
  onRemove: (letter: Letter) => void
  onClear: () => void
}

// 관리 페이지 위쪽의 읽기 우선순위 목록.
// 읽기에서 어떤 편지를 골라도 아직 안 읽은 우선순위 편지가 이 순서대로 먼저 열리고, 다 읽은 뒤에는 고른 편지가 열린다.
export default function PriorityList({ letters, onMove, onRemove, onClear }: Props) {
  return (
    <section className="priority">
      <header className="priority-header">
        <h2>읽기 우선순위</h2>
        <span className="priority-hint">
          {letters.length === 0
            ? '아래 목록에서 “우선 지정”을 누르면 읽기에서 그 순서대로 먼저 열립니다'
            : `${letters.length}통을 순서대로 먼저 열고, 그다음부터는 고른 편지가 열립니다`}
        </span>
        {letters.length > 0 && (
          <button type="button" className="danger" onClick={onClear}>
            모두 해제
          </button>
        )}
      </header>
      {letters.length > 0 && (
        <ol className="priority-list">
          {letters.map((l, i) => (
            <li key={l.id} className="priority-row">
              <span className="priority-no">{i + 1}</span>
              <span className="edit-text">
                {l.status === 'read' && <span className="edit-badge">읽음</span>}
                {l.text}
              </span>
              <span className="edit-actions">
                <button type="button" onClick={() => onMove(l.id, -1)} disabled={i === 0} aria-label="위로">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(l.id, 1)}
                  disabled={i === letters.length - 1}
                  aria-label="아래로"
                >
                  ↓
                </button>
                <button type="button" onClick={() => onRemove(l)}>
                  해제
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
