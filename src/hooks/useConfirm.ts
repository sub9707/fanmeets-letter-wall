import { useCallback, useMemo, useState } from 'react'

/** 떠 있는 확인창의 내용 */
export interface ConfirmState {
  message: string
  confirmLabel: string
  onConfirm: () => void
}

// 확인창 하나를 다루는 훅. ask(...) 로 띄우고, 확인하면 then 을 실행한 뒤 닫는다.
export function useConfirm() {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const cancel = useCallback(() => setConfirm(null), [])

  const ask = useCallback((message: string, confirmLabel: string, then: () => void) => {
    setConfirm({
      message,
      confirmLabel,
      onConfirm: () => {
        then()
        setConfirm(null)
      },
    })
  }, [])

  return useMemo(() => ({ confirm, ask, cancel }), [confirm, ask, cancel])
}
