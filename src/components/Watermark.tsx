import { memo } from 'react'
import toBws from '../assets/to-bws.webp'

// 무대 중앙 배경의 펜 글씨 "To. BWS"
function Watermark() {
  return <img className="watermark" src={toBws} alt="" draggable={false} />
}

export default memo(Watermark)
