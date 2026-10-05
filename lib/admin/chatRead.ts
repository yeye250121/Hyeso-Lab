// 채팅을 어디까지 읽었는지는 브라우저에만 적어 둔다(읽음 표시를 서로 보여주지 않으므로 서버에 둘 이유가 없다).
const KEY = 'admin-chat-last-read'
export const CHAT_READ_EVENT = 'admin-chat-read'

export function getLastRead(): number {
  if (typeof window === 'undefined') return 0
  return Number(window.localStorage.getItem(KEY) ?? 0) || 0
}

export function setLastRead(id: number) {
  if (typeof window === 'undefined' || id <= getLastRead()) return
  window.localStorage.setItem(KEY, String(id))
  window.dispatchEvent(new Event(CHAT_READ_EVENT))
}
