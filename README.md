# TO. BWS 편지 월

팬미팅 Q&A 코너용 웹 앱. Cloudflare 에 올려 여러 PC·스크린에서 함께 씁니다.

- 화면: Vite + React (TypeScript)
- 서버: Cloudflare Worker
- 편지 저장: D1 (`kyochon-comment-wall`)
- 실시간 동기화: Durable Object + WebSocket (읽기 진행 상태도 여기 저장)

## 페이지

| 주소 | 누가 | 하는 일 |
| --- | --- | --- |
| `/` | 모두 | 세 페이지로 가는 큰 버튼 |
| `/write` | 고객 | 편지 쓰기. 키 필요 없음. 편지 월에는 봉투만 보이고 내용은 보이지 않음 |
| `/read` | 주인공(진행) | 섞기 → 선택하기 → 편지 펼치기 → 읽은 편지 트레이. **진행자 키 필요** |
| `/read` (키 없이) | 대형 스크린·프로젝터 | 진행자가 조작하는 화면을 그대로 따라 보여줌 (조작 불가) |
| `/admin` | 관리자·진행자 | 편지 목록 보기, 수정, 삭제. **진행자 키 필요** |

진행자 키는 주소에 `?key=키` 를 붙여 한 번 열거나, 페이지에서 입력하면 그 브라우저에 저장됩니다.
진행자 키가 없는 연결에는 편지 내용이 전달되지 않습니다(읽기 화면에서 지금 펼친 편지만 예외).

편지 월 화면(`/write`, `/read`)은 1920x1080 기준으로 그린 뒤 창 크기에 맞춰 통째로 확대·축소하므로,
와이드 스크린·롤스크린·PC 어디서든 배치가 같습니다. 전체화면은 브라우저에서 F11.

## 배포

```
npm install
npx wrangler login
npm run db:migrate:remote                 # D1 에 letters 테이블 만들기
npx wrangler secret put HOST_KEY          # 진행자 키 정하기
npm run deploy                            # 타입 검사 + 빌드 + 배포
```

D1 은 `wrangler.jsonc` 에 이미 연결되어 있습니다 (`kyochon-comment-wall`).

## 로컬 개발

```
npm run db:migrate:local    # 처음 한 번
npm run dev                 # http://localhost:5173 (Worker·D1·Durable Object 가 로컬에서 같이 돈다)
```

로컬 진행자 키는 `.dev.vars` 의 `HOST_KEY` 입니다 (기본 `local-host-key`).

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run typecheck` | 타입 검사 (화면 / Worker / 스크립트) |
| `npm run build` | 타입 검사 + 빌드 |
| `npm run preview` | 빌드 결과를 로컬 Worker 로 실행 |
| `npm run deploy` | 빌드 + Cloudflare 배포 |
| `npm run db:migrate:local` / `:remote` | D1 마이그레이션 적용 |
| `npm run assets` | `assets-src/` 원본 이미지를 `src/assets/` WebP 로 변환 |

## 구조

```
worker/            Cloudflare Worker
  index.ts         /api/ws → Durable Object 로 연결 (진행자 키 확인)
  LetterRoom.ts    Durable Object: 접속 관리, 액션 처리, 모든 화면에 상태 전송
  reducer.ts       액션 → 다음 상태 (순수 함수)
  db.ts            D1 읽기/쓰기
migrations/        D1 스키마
shared/            Worker 와 화면이 같이 쓰는 타입·값 (편지, 진행 상태, 액션)
src/
  App.tsx          주소에 맞는 페이지 고르기 (페이지마다 따로 내려받음)
  pages/           첫 화면 / 편지 쓰기 / 편지 읽기 / 편지 관리
  components/      화면 조각 (편지, 편지지, 트레이, 작성창, 확인창 …)
  hooks/           페이지별 조작(useReadActions, useAdminActions), 진행자 키, 무대 배율 …
  net/             서버 상태를 받아오는 훅
  layout/          편지 배치 계산
  styles/          컴포넌트별 스타일
assets-src/        원본 이미지
scripts/           이미지 변환 스크립트
```
