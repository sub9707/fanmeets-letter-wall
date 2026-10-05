// Node 의 req/res 를 웹 표준 Request/Response 로 바꿔 handle 에 넘긴다
import type { IncomingMessage, ServerResponse } from 'node:http'

export async function serveNode(
  handle: (request: Request) => Promise<Response>,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)

  const headers = new Headers()
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }
  const request = new Request(new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`), {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  })

  const response = await handle(request)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}
