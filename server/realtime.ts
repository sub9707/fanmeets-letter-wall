// 상태가 바뀌었다고 Supabase Realtime 채널로 알린다 (REST 로 broadcast). 내용은 싣지 않는다
import { CHANGED_EVENT, REALTIME_CHANNEL } from '../shared/constants.ts'
import { serviceKey, supabaseUrl } from './env.ts'

export async function notifyChanged(version: number): Promise<void> {
  const key = serviceKey()
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
  // 예전 형식(JWT) 키만 Authorization 에도 넣을 수 있다
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  try {
    const res = await fetch(`${supabaseUrl()}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [{ topic: REALTIME_CHANNEL, event: CHANGED_EVENT, payload: { version }, private: false }],
      }),
    })
    if (!res.ok) console.error('Realtime 알림 실패:', res.status, await res.text())
  } catch (err) {
    // 알림이 빠져도 화면이 주기적으로 상태를 다시 받아오므로 액션 자체는 실패로 치지 않는다
    console.error('Realtime 알림 실패:', err)
  }
}
