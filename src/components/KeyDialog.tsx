import { type FormEvent, useState } from 'react'
import Backdrop from './Backdrop.tsx'

interface Props {
  /** 앞서 넣은 키가 틀렸는가 */
  rejected: boolean
  onSubmit: (key: string) => void
  /** 없으면 닫을 수 없다 (키가 꼭 필요한 페이지) */
  onCancel?: () => void
}

// 진행자 키 입력창. 키는 이 브라우저에 저장되어 다음부터는 묻지 않는다.
export default function KeyDialog({ rejected, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <Backdrop className="confirm-backdrop" onClose={onCancel}>
      <form className="confirm" onSubmit={submit}>
        <p className="confirm-message">진행자 키를 입력해주세요</p>
        <input
          className="key-input"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoComplete="off"
        />
        {rejected && <p className="key-error">키가 맞지 않습니다</p>}
        <div className="confirm-actions">
          {onCancel && (
            <button className="btn btn-light" type="button" onClick={onCancel}>
              취소
            </button>
          )}
          <button className="btn btn-dark" type="submit">
            확인
          </button>
        </div>
      </form>
    </Backdrop>
  )
}
