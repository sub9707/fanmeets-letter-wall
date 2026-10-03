// 모든 PC 가 붙는 방. WebSocket 을 받아 액션을 처리하고, 바뀐 상태를 모든 연결에 보낸다.
//   편지 목록   → D1 (letters 테이블)
//   읽기 진행   → 이 Durable Object 의 저장소 (섞인 배치, 펼친 편지)
// 접속이 없으면 WebSocket Hibernation 으로 잠들고, 깨어나면 저장소에서 다시 읽는다.
import { DurableObject } from 'cloudflare:workers'
import { PUBLIC_ACTIONS, type Scene, type ServerMessage, type ServerState } from '../shared/types.ts'
import { loadLetters, persist } from './db.ts'
import { type Env, HOST_HEADER } from './env.ts'
import { initialScene, isAction, reduce } from './reducer.ts'

/** 연결마다 붙여 두는 정보 (잠들었다 깨어나도 유지된다) */
interface Attachment {
  host: boolean
}

const SCENE_KEY = 'scene:v2'

// 진행자가 아닌 연결(편지 쓰는 고객, 보기 전용 스크린)에는 편지 내용을 보내지 않는다.
// 지금 펼쳐 읽는 편지만은 화면에 띄워야 하므로 내용을 남긴다.
function guestView(state: ServerState): ServerState {
  return {
    scene: state.scene,
    letters: state.letters.map((l) => (l.id === state.scene.openId ? l : { ...l, text: '' })),
  }
}

const encode = (message: ServerMessage) => JSON.stringify(message)
const stateMessage = (state: ServerState): string => encode({ type: 'state', ...state })

export class LetterRoom extends DurableObject<Env> {
  private scene: Scene = initialScene()
  /** D1 에서 읽어 둔 편지. 잠들었다 깨어나면 비어 있다가 처음 필요할 때 다시 읽는다 */
  private letters: ServerState['letters'] | null = null
  /** 액션을 하나씩 차례로 처리하기 위한 줄 (D1 을 기다리는 동안 다른 액션이 끼어들지 않게) */
  private queue: Promise<void> = Promise.resolve()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.scene = (await ctx.storage.get<Scene>(SCENE_KEY)) ?? initialScene()
    })
  }

  // Worker 가 넘겨준 WebSocket 연결 요청
  async fetch(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair())
    const host = request.headers.get(HOST_HEADER) === '1'
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ host } satisfies Attachment)

    // 접속하자마자 권한과 현재 상태를 보낸다
    void this.enqueue(async () => {
      const state = await this.current()
      server.send(encode({ type: 'welcome', host }))
      server.send(stateMessage(host ? state : guestView(state)))
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return
    let action: unknown
    try {
      action = JSON.parse(message)
    } catch {
      return
    }
    if (!isAction(action)) return
    // 편지 쓰기 말고는 진행자만 할 수 있다
    const { host } = ws.deserializeAttachment() as Attachment
    if (!host && !PUBLIC_ACTIONS.includes(action.type)) return

    await this.enqueue(async () => {
      const result = reduce(await this.current(), action)
      if (!result.changed) return
      // 저장이 끝난 뒤에야 메모리를 바꾸고 알린다 (저장에 실패하면 아무 일도 없었던 것으로)
      await persist(this.env.DB, result.writes)
      if (result.sceneChanged) await this.ctx.storage.put(SCENE_KEY, result.state.scene)
      this.letters = result.state.letters
      this.scene = result.state.scene
      this.broadcast(result.state)
    })
  }

  private async current(): Promise<ServerState> {
    this.letters ??= await loadLetters(this.env.DB)
    return { letters: this.letters, scene: this.scene }
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(task).catch((err: unknown) => console.error('편지 방 처리 실패:', err))
    return this.queue
  }

  // 바뀔 때마다 전체 상태를 보낸다 (편지 100통 기준 수십 KB 라 부분 갱신보다 단순하고 어긋날 일이 없다)
  private broadcast(state: ServerState) {
    const forHost = stateMessage(state)
    const forGuest = stateMessage(guestView(state))
    for (const ws of this.ctx.getWebSockets()) {
      const { host } = ws.deserializeAttachment() as Attachment
      try {
        ws.send(host ? forHost : forGuest)
      } catch {
        // 이미 끊긴 연결은 런타임이 정리한다
      }
    }
  }
}
