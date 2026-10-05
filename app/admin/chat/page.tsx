'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Send, Settings } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import Avatar from '@/components/admin/Avatar'
import api from '@/lib/admin/api'
import { setLastRead } from '@/lib/admin/chatRead'

// 관리자 내부 채팅(전체 한 방). 3초마다 마지막 글 이후의 새 글만 받아 온다.
// 탭이 가려져 있으면 쉬었다가, 다시 보이면 바로 한 번 받아 온다.

interface Message {
  id: number
  body: string
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}

const POLL_MS = 3000

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}
function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString()

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [me, setMe] = useState('')
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(0)
  // 맨 아래를 보고 있을 때만 새 글에 맞춰 따라 내려간다(위 글을 읽는 중에는 끌어내리지 않는다)
  const stickRef = useRef(true)

  const append = useCallback((incoming: Message[]) => {
    if (!incoming.length) return
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id))
      const fresh = incoming.filter((m) => !seen.has(m.id))
      return fresh.length ? [...prev, ...fresh] : prev
    })
    lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id))
    setLastRead(lastIdRef.current)
  }, [])

  const fetchNew = useCallback(async () => {
    const res = await api.get(`/admin/chat?after=${lastIdRef.current}`)
    setMe(res.data.me)
    append(res.data.messages)
  }, [append])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const tick = () => {
      if (document.visibilityState === 'visible') fetchNew().catch(() => {})
    }
    fetchNew()
      .catch(() => setError('채팅을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
    timer = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [fetchNew])

  useEffect(() => {
    const el = listRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    try {
      const res = await api.post('/admin/chat', { body })
      setDraft('')
      stickRef.current = true
      append([res.data.message])
    } catch {
      setError('메시지를 보내지 못했어요. 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-4rem)] max-w-[860px]">
        <div className="flex items-end justify-between pb-4">
          <div>
            <h1 className="text-headline text-text-primary">채팅</h1>
            <p className="text-small text-text-secondary mt-1">관리자끼리만 보는 내부 대화방이에요.</p>
          </div>
          <Link
            href="/admin/profile"
            className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-bg-card text-small text-text-secondary hover:text-text-primary"
          >
            <Settings className="w-4 h-4" /> 내 프로필
          </Link>
        </div>

        <div
          ref={listRef}
          data-testid="chat-list"
          onScroll={(e) => {
            const el = e.currentTarget
            stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
          }}
          className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-bg-card border border-border px-4 py-5"
        >
          {loading ? (
            <p className="text-center text-small text-text-secondary py-10">불러오는 중…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-small text-text-secondary py-10">아직 대화가 없어요. 첫 메시지를 남겨보세요.</p>
          ) : (
            <ul className="space-y-1">
              {messages.map((m, i) => {
                const prev = messages[i - 1]
                const mine = m.author.id === me
                const newDay = !prev || !sameDay(prev.createdAt, m.createdAt)
                // 같은 사람이 이어서 쓴 글은 이름·사진을 한 번만 보여준다
                const grouped =
                  !newDay && prev.author.id === m.author.id &&
                  new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000
                return (
                  <li key={m.id}>
                    {newDay && (
                      <p className="my-4 text-center text-[12px] text-text-secondary">{dayLabel(m.createdAt)}</p>
                    )}
                    <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''} ${grouped ? 'mt-1' : 'mt-4'}`}>
                      {!mine && (
                        <span className="w-9 shrink-0 self-start">
                          {!grouped && <Avatar name={m.author.name} url={m.author.avatarUrl} />}
                        </span>
                      )}
                      <div className={`max-w-[72%] min-w-0 ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!mine && !grouped && (
                          <span className="mb-1 text-[12px] font-medium text-text-secondary">{m.author.name}</span>
                        )}
                        <p
                          data-testid="chat-message"
                          className={`px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                            mine ? 'bg-action-primary text-white rounded-br-md' : 'bg-bg-primary text-text-primary rounded-bl-md'
                          }`}
                        >
                          {m.body}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-text-secondary pb-0.5">{timeLabel(m.createdAt)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && <p className="mt-2 text-small text-red-500">{error}</p>}

        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // 엔터로 보내고, Shift+엔터는 줄바꿈. 한글 조합 중의 엔터는 글자 확정이라 보내지 않는다
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)"
            data-testid="chat-input"
            className="flex-1 max-h-40 min-h-[48px] resize-none px-4 py-3 rounded-2xl bg-bg-card border border-border text-[15px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-action-primary"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            aria-label="보내기"
            data-testid="chat-send"
            className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-action-primary text-white disabled:opacity-40 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
