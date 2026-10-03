import toBws from '../assets/to-bws.webp'
import { PAGES } from '../config.ts'
import '../styles/home.css'

const ENTRIES = [
  { href: PAGES.write, title: '편지 쓰기', who: '고객용', desc: '질문을 편지로 써서 편지 월에 붙입니다' },
  { href: PAGES.read, title: '편지 읽기', who: '행사 진행 · 주인공용', desc: '편지를 섞고 골라서 펼쳐 읽습니다' },
  { href: PAGES.admin, title: '편지 관리', who: '관리자 · 진행자용', desc: '모든 편지의 내용을 보고 고치거나 지웁니다' },
] as const

// 첫 화면: 어느 페이지로 갈지 고른다
export default function HomePage() {
  return (
    <main className="home">
      <img className="home-logo" src={toBws} alt="To. BWS" draggable={false} />
      <nav className="home-entries">
        {ENTRIES.map((entry) => (
          <a key={entry.href} className="home-entry" href={entry.href}>
            <span className="home-entry-title">{entry.title}</span>
            <span className="home-entry-who">{entry.who}</span>
            <span className="home-entry-desc">{entry.desc}</span>
          </a>
        ))}
      </nav>
    </main>
  )
}
