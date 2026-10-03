import { memo, useEffect, useRef, useState } from 'react'
import { isEnter, useKeyDown } from '../hooks/useKeyDown.ts'
import Paper from './Paper.tsx'
import WriteForm from './WriteForm.tsx'
import '../styles/composer.css'

interface Props {
  /** 지금 이 PC 에서 편지를 쓸 수 있는 상태인가 */
  active: boolean
  /** 서버로 보내지 못했으면 false */
  onSubmit: (text: string) => boolean
}

// 작성 흐름. 이 PC 안에서만 일어나는 일이라 서버와 공유하지 않는다.
// 대기: 배경 위에 안내만 띄움 → Enter: 편지지 + 입력 UI → Enter: 전송 후 다시 대기
// 타이핑 중에는 이 컴포넌트만 리렌더되고 배경의 편지들은 건드리지 않는다.
function Composer({ active, onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [failed, setFailed] = useState(false)
  // 전송에 쓴 Enter 가 곧바로 입력창을 다시 여는 것을 막는다
  const closedAt = useRef(0)

  const close = () => {
    closedAt.current = performance.now()
    setOpen(false)
    setText('')
    setFailed(false)
  }

  useEffect(() => {
    if (!active) close()
  }, [active])

  useKeyDown((e) => {
    if (open) {
      if (e.key === 'Escape') close()
      return
    }
    if (!isEnter(e) || e.repeat || performance.now() - closedAt.current < 300) return
    // 포커스가 남아 있는 버튼이 Enter 로 눌리지 않게
    e.preventDefault()
    setOpen(true)
  }, active)

  const submit = (value: string) => {
    const sent = onSubmit(value)
    if (sent) close()
    else setFailed(true)
    return sent
  }

  if (!active) return null

  if (!open) {
    return (
      <div className="idle-prompt">
        편지 작성을 위해 <b>엔터키</b>를 눌러주세요
      </div>
    )
  }

  return (
    <div className="composer" onClick={close}>
      <div className="composer-paper" onClick={(e) => e.stopPropagation()}>
        <Paper text={text} placeholder="아래에 입력한 내용이 여기에 적힙니다" compact />
      </div>
      <WriteForm
        onChange={setText}
        onSubmit={submit}
        notice={failed ? '서버와 연결이 끊겨 보내지 못했습니다. 잠시 후 ENTER를 다시 눌러주세요.' : null}
      />
    </div>
  )
}

export default memo(Composer)
