import type { ReactNode } from 'react'
import toBws from '../assets/to-bws.webp'
import '../styles/paper.css'

// 글이 길수록 글자를 줄여 최대 글자 수(200자)까지 편지지 안에 담는다
const sizeClass = (length: number) => (length > 120 ? 'xlong' : length > 60 ? 'long' : length > 25 ? 'medium' : 'short')

interface Props {
  text: string
  /** 내용이 비었을 때 흐리게 보여줄 안내 */
  placeholder?: string
  /** 작성 화면용 작은 크기 */
  compact?: boolean
  children?: ReactNode
}

// 편지지. 읽기 모달과 작성 화면이 같이 쓴다
export default function Paper({ text, placeholder = '', compact = false, children }: Props) {
  return (
    <div className={`paper ${compact ? 'compact' : ''}`}>
      <img className="paper-title" src={toBws} alt="To. BWS" draggable={false} />
      <p className={`paper-text ${sizeClass(text.length)} ${text ? '' : 'empty'}`}>{text ? `“${text}”` : placeholder}</p>
      {children}
    </div>
  )
}
