import { type ChangeEvent, useState } from 'react'
import { KIOSK_PIN } from '../config.ts'
import Backdrop from './Backdrop.tsx'

interface Props {
  message: string
  /** 비밀번호가 맞으면 true */
  onSubmit: (pin: string) => boolean
  onCancel: () => void
}

// 숫자 비밀번호 입력창. 자릿수를 다 채우면 바로 확인한다.
export default function PinDialog({ message, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, KIOSK_PIN.length)
    setValue(pin)
    setWrong(false)
    if (pin.length < KIOSK_PIN.length) return
    if (!onSubmit(pin)) {
      setValue('')
      setWrong(true)
    }
  }

  return (
    <Backdrop className="confirm-backdrop" onClose={onCancel}>
      <div className="confirm">
        <p className="confirm-message">{message}</p>
        <input
          className="key-input"
          type="password"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            // 쓰기 화면의 Esc·Enter 처리로 새지 않게
            e.stopPropagation()
            if (e.key === 'Escape') onCancel()
          }}
          autoFocus
          autoComplete="off"
        />
        {wrong && <p className="key-error">비밀번호가 맞지 않습니다</p>}
        <div className="confirm-actions">
          <button className="btn btn-light" type="button" onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </Backdrop>
  )
}
