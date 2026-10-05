# TO. BWS 편지 월

팬미팅 Q&A 코너용 웹 앱. Vercel(Hobby) 에 올려 여러 PC·스크린에서 함께 씁니다.

- 화면: Vite + React (TypeScript)
- 서버: Vercel Function (`/api/state`, `/api/action`, 서울 리전 `icn1`)
- 저장: Supabase Postgres (`letters` 편지, `room` 읽기 진행 상태)
- 실시간 동기화: 상태가 바뀌면 서버가 Supabase Realtime 채널(`letter-wall`)로 알리고, 각 화면이 `/api/state` 를 다시 받아옴
  (알림이 빠져도 10초마다 다시 받아옴). 액션은 `room` 줄을 잠근 트랜잭션에서 하나씩 처리
- 폰트: 교촌 브랜드 규정 (국문 윤고딕 300대 장평 93·자간 -50, 영문·숫자·기호 DIN). `src/styles/fonts.css`

## 페이지

| 주소 | 누가 | 하는 일 |
| --- | --- | --- |
| `/` | 모두 | 세 페이지로 가는 큰 버튼 |
| `/write` | 고객 | 편지 쓰기. 키 필요 없음. 편지 월에는 봉투만 보이고 내용은 보이지 않음 |
| `/read` | 주인공(진행) | 섞기 → 선택하기 → 편지 펼치기 (닫으면 서서히 사라짐). 들어올 때마다, 또 초기화 버튼으로 읽은 편지까지 정렬된 처음 상태로 되돌림. 키 필요 없음 |
| `/admin` | 관리자·진행자 | 편지 목록 보기, 수정, 삭제. **진행자 키 필요** |

진행자 키는 주소에 `?key=키` 를 붙여 한 번 열거나, 페이지에서 입력하면 그 브라우저에 저장됩니다.
진행자 키는 관리 페이지에만 필요합니다. 키가 없는 연결에는 편지 내용이 전달되지 않습니다(읽기 화면에서 지금 펼친 편지만 예외).

편지 월 화면(`/write`, `/read`)은 1920x1080 기준으로 그린 뒤 창 크기에 맞춰 통째로 확대·축소하므로,
와이드 스크린·롤스크린·PC 어디서든 배치가 같습니다. 전체화면은 브라우저에서 F11.

## 배포 (Vercel)

1. Vercel 에 저장소를 연결하고 Supabase 연동(Integration)을 붙인다 → `POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` 등이 자동으로 들어온다
2. 프로젝트 환경 변수에 **`HOST_KEY`**(진행자 키)를 직접 추가한다
3. 테이블 만들기 (처음 한 번, 로컬에서): `npm run db:setup`
4. 배포: push 하면 Vercel 이 `npm run build` 를 돌린다. 빌드가 `.vercel/output`(Build Output API)을 만들어 그대로 올라간다

설정은 `vercel.json`, 함수 리전·런타임은 `scripts/build-vercel.ts`.

## 로컬 개발

```
npm run db:setup    # 처음 한 번 (.env.local 의 Supabase 에 테이블 만들기)
npm run dev         # http://localhost:5173 (/api 도 같은 코드로 같이 돈다)
```

환경 변수는 `.env.local` (Vercel 연동 변수 그대로). 로컬 진행자 키는 `.env.local` 의 `HOST_KEY` (없으면 `local-host-key`).
로컬도 같은 Supabase DB 를 쓰므로 행사 중에는 로컬에서 편지를 지우지 않도록 주의.

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run typecheck` | 타입 검사 (화면 / 서버 / 스크립트) |
| `npm run build` | 타입 검사 + 빌드 + Vercel 출력 |
| `npm run db:setup` | `supabase/schema.sql` 적용 (여러 번 실행해도 안전) |
| `npm run assets` | `assets-src/` 원본 이미지를 `src/assets/` WebP 로 변환 |
| `python scripts/build-fonts.py` | `assets-src/fonts/` 원본 폰트를 규정(장평·자간)에 맞춘 WOFF2 로 변환 (`pip install fonttools brotli`) |

## 구조

```
server/            Vercel Function
  app.ts           /api/state, /api/action 처리 (진행자 키 확인, 진행자가 아니면 편지 내용 숨김)
  reducer.ts       액션 → 다음 상태 (순수 함수)
  db.ts            Postgres 읽기/쓰기 (room 줄을 잠근 트랜잭션)
  realtime.ts      바뀌었다고 Supabase Realtime 으로 알림
  vercel.ts        함수 입구 (node.ts 로 req/res ↔ Request/Response)
supabase/          DB 스키마
shared/            Worker 와 화면이 같이 쓰는 타입·값 (편지, 진행 상태, 액션)
src/
  App.tsx          주소에 맞는 페이지 고르기 (페이지마다 따로 내려받음)
  pages/           첫 화면 / 편지 쓰기 / 편지 읽기 / 편지 관리
  components/      화면 조각 (편지, 편지지, 작성창, 확인창 …)
  hooks/           페이지별 조작(useReadActions, useAdminActions), 진행자 키, 무대 배율 …
  net/             서버 상태를 받아오는 훅 (Realtime 알림 + /api)
  layout/          편지 배치 계산
  styles/          컴포넌트별 스타일
assets-src/        원본 이미지·폰트 (저장소에 넣지 않음)
scripts/           Vercel 출력, DB 설정, 이미지·폰트 변환 스크립트
```
