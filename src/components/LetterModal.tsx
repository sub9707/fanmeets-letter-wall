import type { Letter } from '../../shared/types.ts'
import Backdrop from './Backdrop.tsx'
import Paper from './Paper.tsx'

interface Props {
  letter: Letter
  /** 진행자에게만 넘어온다. 없으면 닫기 버튼이 없는 보기 전용 */
  onClose?: () => void
}

// 고른 편지를 크게 펼쳐 보여주는 모달. 모든 PC 에 같이 뜨고, 진행자만 닫을 수 있다.
// 닫으면 편지는 트레이로 이동한다.
export default function LetterModal({ letter, onClose }: Props) {
  return (
    <Backdrop onClose={onClose}>
      <Paper text={letter.text}>
        {onClose && (
          <button className="btn btn-dark" type="button" onClick={onClose}>
            닫기
          </button>
        )}
      </Paper>
    </Backdrop>
  )
}
