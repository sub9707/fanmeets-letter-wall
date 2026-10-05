import { memo } from 'react'
import type { Phase } from '../../shared/types.ts'
import '../styles/read.css'

interface Props {
  phase: Phase
  onShuffle: () => void
  onSelect: () => void
  onReset: () => void
}

// 읽기 페이지의 조작부.
//   섞기 단계: 화면 가운데의 큰 섞기 / 선택하기 버튼
//   선택 단계: 안내 문구 + 우측 하단의 섞기 버튼
//   언제나: 우측 하단의 초기화 버튼 (읽은 편지까지 모두 되돌려 정렬된 처음 상태로)
function ReadControls({ phase, onShuffle, onSelect, onReset }: Props) {
  return (
    <>
      {phase === 'shuffle' ? (
        <div className="read-overlay">
          <button className="btn-shuffle-big" type="button" onClick={onShuffle}>
            섞기
          </button>
          <button className="btn btn-dark btn-select" type="button" onClick={onSelect}>
            선택하기
          </button>
        </div>
      ) : (
        <div className="select-hint">읽고 싶은 편지를 골라주세요</div>
      )}
      <div className="corner">
        {phase === 'select' && (
          <button className="btn btn-ghost" type="button" onClick={onShuffle}>
            섞기
          </button>
        )}
        <button className="btn btn-dark" type="button" onClick={onReset}>
          초기화
        </button>
      </div>
    </>
  )
}

export default memo(ReadControls)
