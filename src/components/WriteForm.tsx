import { type KeyboardEvent, useRef } from 'react'
import { MAX_LENGTH } from '../../shared/constants.ts'
import { isEnter } from '../hooks/useKeyDown.ts'

interface Props {
  onChange: (text: string) => void
  /** false 를 돌려주면(전송 실패) 입력한 내용을 그대로 둔다 */
  onSubmit: (text: string) => boolean
  /** 안내문 대신 보여줄 알림 (전송 실패 등) */
  notice: string | null
}

// 입력창 + ENTER 버튼 + 안내문. 입력값은 비제어(ref)로 다루고 바뀔 때만 onChange 로 알린다.
export default function WriteForm({ onChange, onSubmit, notice }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    const el = inputRef.current
    if (!el) return
    // blur 로 한글 IME 조합 중인 글자를 확정시킨 뒤 값을 읽는다
    el.blur()
    const value = el.value.trim()
    if (!value || !onSubmit(value)) el.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isEnter(e)) return
    e.preventDefault()
    e.stopPropagation()
    // 조합 중 Enter 는 조합이 끝난 다음 틱에 전송
    if (e.nativeEvent.isComposing) setTimeout(submit, 0)
    else submit()
  }

  return (
    <div className="write-form" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        className="write-input"
        type="text"
        maxLength={MAX_LENGTH}
        placeholder="여기에 한마디를 입력해주세요 :)"
        autoFocus
        onInput={(e) => onChange(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        // 글을 쓰는 동안에는 포커스를 잃어도 바로 되찾는다
        onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
        spellCheck={false}
        autoComplete="off"
      />
      <button className="btn-enter" type="button" tabIndex={-1} onClick={submit}>
        ENTER
      </button>
      {notice ? (
        <p className="write-notice">{notice}</p>
      ) : (
        <ul className="write-hints">
          <li>① 키보드로 메시지를 입력해주세요</li>
          <li>② ENTER를 누르면 편지가 만들어집니다</li>
          <li>③ ESC를 누르면 작성을 취소합니다</li>
        </ul>
      )}
    </div>
  )
}
