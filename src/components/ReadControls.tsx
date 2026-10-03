import { memo } from 'react'
import type { Phase } from '../../shared/types.ts'
import '../styles/read.css'

interface Props {
  phase: Phase
  onShuffle: () => void
  onSelect: () => void
  onReset: () => void
}

// 읽기 페이지에서 주인공(진행자 키가 있는 화면)에게만 보이는 조작부.
//   섞기 단계: 화면 가운데의 큰 섞기 / 선택하기 버튼
//   선택 단계: 안내 문구 + 우측 하단의 섞기 / 처음으로 버튼
function ReadControls({ phase, onShuffle, onSelect, onReset }: Props) {
  if (phase === 'shuffle') {
    return (
      <div className="read-overlay">
        <button className="btn-shuffle-big" type="button" onClick={onShuffle}>
          섞기
        </button>
        <button className="btn btn-dark btn-select" type="button" onClick={onSelect}>
          선택하기
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="select-hint">읽고 싶은 편지를 골라주세요</div>
      <div className="corner">
        <button className="btn btn-ghost" type="button" onClick={onShuffle}>
          섞기
        </button>
        <button className="btn btn-dark" type="button" onClick={onReset}>
          처음으로
        </button>
      </div>
    </>
  )
}

export default memo(ReadControls)
