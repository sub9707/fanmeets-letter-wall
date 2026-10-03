import { type KeyboardEvent, memo, useRef } from 'react'
import { MAX_LENGTH } from '../../shared/constants.ts'
import type { Letter } from '../../shared/types.ts'
import { isEnter } from '../hooks/useKeyDown.ts'

interface Props {
  letter: Letter
  index: number
  editing: boolean
  /** 수정할 편지를 바꾼다 (null 이면 수정 끝) */
  onEdit: (id: string | null) => void
  onUpdate: (id: string, text: string) => void
  onRemove: (letter: Letter) => void
}

// 편집 목록의 한 줄. 수정 중일 때만 입력창으로 바뀐다.
function EditRow({ letter, index, editing, onEdit, onUpdate, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const stop = () => onEdit(null)

  const save = () => {
    const value = inputRef.current?.value.trim()
    // 빈 내용으로는 저장하지 않는다 (지우려면 삭제 버튼)
    if (!value) return
    if (value !== letter.text) onUpdate(letter.id, value)
    stop()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // 패널 전체가 닫히지 않고 이 줄의 수정만 취소
      e.stopPropagation()
      stop()
    } else if (isEnter(e)) {
      e.preventDefault()
      // 한글 조합 중 Enter 는 조합이 끝난 다음 틱에 저장
      if (e.nativeEvent.isComposing) setTimeout(save, 0)
      else save()
    }
  }

  return (
    <li className="edit-row">
      <span className="edit-no">{index + 1}</span>
      {editing ? (
        <input
          ref={inputRef}
          className="edit-input"
          type="text"
          defaultValue={letter.text}
          maxLength={MAX_LENGTH}
          autoFocus
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      ) : (
        <span className="edit-text">
          {letter.status === 'read' && <span className="edit-badge">읽음</span>}
          {letter.text}
        </span>
      )}
      <span className="edit-actions">
        <button type="button" onClick={editing ? save : () => onEdit(letter.id)}>
          {editing ? '저장' : '수정'}
        </button>
        {editing ? (
          <button type="button" onClick={stop}>
            취소
          </button>
        ) : (
          <button type="button" className="danger" onClick={() => onRemove(letter)}>
            삭제
          </button>
        )}
      </span>
    </li>
  )
}

export default memo(EditRow)
