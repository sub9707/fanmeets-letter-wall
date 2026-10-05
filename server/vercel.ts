// Vercel Function 입구. scripts/build-vercel.ts 가 이 파일을 묶어 /api/state, /api/action 함수로 내보낸다
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handle } from './app.ts'
import { serveNode } from './node.ts'

export default (req: IncomingMessage, res: ServerResponse) => serveNode(handle, req, res)
