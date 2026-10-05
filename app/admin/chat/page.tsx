'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Megaphone, MessageCircle, Plus, Send, Settings, Users, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import Avatar from '@/components/admin/Avatar'
import api from '@/lib/admin/api'

// 관리자 메신저. 왼쪽은 대화방/구성원 목록, 오른쪽은 고른 방의 대화다.
//  - 공지: 모든 관리자가 보는 방(항상 맨 위)
//  - 1:1: 구성원을 누르면 열린다(이미 있으면 그 방으로)
//  - 그룹: 이름과 구성원을 골라 만든다
// 실시간 연결 대신 목록은 5초, 열린 방은 3초마다 새 글만 받아 온다. 탭이 가려져 있으면 쉰다.

interface Member {
  id: string
  name: string
  avatarUrl: string | null
}
interface Room {
  id: string
  type: 'notice' | 'direct' | 'group'
  title: string
  avatarUrl: string | null
  memberIds: string[]
  lastMessage: { body: string; createdAt: string; authorName: string } | null
  unread: number
}
interface Message {
  id: number
  body: string
  createdAt: string
  authorId: string
}

const LIST_POLL_MS = 5000
const ROOM_POLL_MS = 3000

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}
function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString()
// 목록에는 오늘 글이면 시각, 아니면 날짜
function listTime(iso: string) {
  return sameDay(iso, new Date().toISOString())
    ? timeLabel(iso)
    : new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

function RoomIcon({ room, size = 44 }: { room: Room; size?: number }) {
  if (room.type === 'direct') return <Avatar name={room.title} url={room.avatarUrl} size={size} />
  const Icon = room.type === 'notice' ? Megaphone : Users
  return (
    <span
      style={{ width: size, height: size }}
      className={`rounded-full shrink-0 flex items-center justify-center ${
        room.type === 'notice' ? 'bg-action-primary text-white' : 'bg-bg-primary border border-border text-text-secondary'
      }`}
    >
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  )
}

export default function AdminChatPage() {
  const [me, setMe] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'rooms' | 'members'>('rooms')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [groupOpen, setGroupOpen] = useState(false)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    const res = await api.get('/admin/chat')
    setMe(res.data.me)
    setMembers(res.data.members)
    setRooms(res.data.rooms)
  }, [])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') loadOverview().catch(() => {})
    }
    loadOverview()
      .catch(() => setError('채팅을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
    const timer = setInterval(tick, LIST_POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [loadOverview])

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const room = rooms.find((r) => r.id === roomId) ?? null
  const totalUnread = rooms.reduce((sum, r) => sum + r.unread, 0)

  // 방을 읽으면 목록의 숫자와 사이드바 뱃지를 바로 맞춘다
  const onRead = useCallback(
    (id: string) => {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, unread: 0 } : r)))
      window.dispatchEvent(new Event('admin-chat-read'))
    },
    []
  )

  const openDirect = async (adminId: string) => {
    setError('')
    try {
      const res = await api.post('/admin/chat/rooms', { type: 'direct', adminId })
      await loadOverview()
      setRoomId(res.data.roomId)
      setTab('rooms')
    } catch {
      setError('대화방을 열지 못했어요.')
    }
  }

  const createGroup = async (name: string, memberIds: string[]) => {
    const res = await api.post('/admin/chat/rooms', { type: 'group', name, memberIds })
    await loadOverview()
    setRoomId(res.data.roomId)
    setTab('rooms')
    setGroupOpen(false)
  }

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-7rem)] lg:h-[calc(100vh-4rem)] max-w-[1100px] rounded-2xl bg-bg-card border border-border overflow-hidden">
        {/* ── 왼쪽: 목록. 모바일에서는 방을 열면 숨긴다 ── */}
        <aside className={`${room ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] shrink-0 flex-col border-r border-border`}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h1 className="text-title text-text-primary">채팅</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setGroupOpen(true)}
                aria-label="그룹 대화 만들기"
                data-testid="chat-new-group"
                className="p-2 rounded-full text-text-secondary hover:bg-bg-primary hover:text-text-primary"
              >
                <Plus className="w-5 h-5" />
              </button>
              <Link
                href="/admin/profile"
                aria-label="내 프로필"
                className="p-2 rounded-full text-text-secondary hover:bg-bg-primary hover:text-text-primary"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mx-5 mb-2 grid grid-cols-2 rounded-xl bg-bg-primary p-1 text-small font-medium">
            {(
              [
                ['rooms', '대화', MessageCircle],
                ['members', '구성원', Users],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                data-testid={`chat-tab-${key}`}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
                  tab === key ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === 'rooms' && totalUnread > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-action-primary text-white text-[11px] flex items-center justify-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && <p className="px-5 py-1 text-small text-red-500">{error}</p>}

          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
            {loading ? (
              <p className="py-10 text-center text-small text-text-secondary">불러오는 중…</p>
            ) : tab === 'rooms' ? (
              <ul data-testid="chat-rooms">
                {rooms.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setRoomId(r.id)}
                      data-testid={`chat-room-${r.type}`}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                        r.id === roomId ? 'bg-bg-primary' : 'hover:bg-bg-primary'
                      }`}
                    >
                      <RoomIcon room={r} />
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-body font-medium text-text-primary">
                            {r.title}
                            {r.type === 'group' && (
                              <span className="ml-1.5 text-[12px] font-normal text-text-secondary">{r.memberIds.length}</span>
                            )}
                          </span>
                          {r.lastMessage && (
                            <span className="shrink-0 text-[11px] text-text-secondary">{listTime(r.lastMessage.createdAt)}</span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-small text-text-secondary">
                            {r.lastMessage
                              ? r.lastMessage.body
                              : r.type === 'notice'
                                ? '전체 구성원에게 알릴 내용을 올려요'
                                : '대화를 시작해보세요'}
                          </span>
                          {r.unread > 0 && (
                            <span
                              data-testid="room-unread"
                              className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-action-primary text-white text-[11px] font-semibold flex items-center justify-center"
                            >
                              {r.unread > 99 ? '99+' : r.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul data-testid="chat-members">
                {members.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={m.id === me}
                      onClick={() => openDirect(m.id)}
                      data-testid="chat-member"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-bg-primary disabled:hover:bg-transparent transition-colors"
                    >
                      <Avatar name={m.name} url={m.avatarUrl} size={40} />
                      <span className="flex-1 min-w-0 truncate text-body text-text-primary">{m.name}</span>
                      {m.id === me ? (
                        <span className="text-[12px] text-text-secondary">나</span>
                      ) : (
                        <span className="text-[12px] text-action-primary font-medium">1:1 대화</span>
                      )}
                    </button>
                  </li>
                ))}
                {members.length <= 1 && (
                  <li className="px-3 py-6 text-center text-small text-text-secondary">
                    아직 다른 구성원이 없어요. 관리자 계정을 추가하면 여기에 나타나요.
                  </li>
                )}
              </ul>
            )}
          </div>
        </aside>

        {/* ── 오른쪽: 대화 ── */}
        <section className={`${room ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
          {room ? (
            <Conversation
              key={room.id}
              room={room}
              me={me}
              memberById={memberById}
              onBack={() => setRoomId(null)}
              onRead={onRead}
              onSent={() => loadOverview().catch(() => {})}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-secondary">
              <MessageCircle className="w-10 h-10 opacity-40" />
              <p className="text-small">대화방을 고르거나, 구성원을 눌러 1:1 대화를 시작하세요.</p>
            </div>
          )}
        </section>
      </div>

      {groupOpen && (
        <GroupModal
          members={members.filter((m) => m.id !== me)}
          onClose={() => setGroupOpen(false)}
          onCreate={createGroup}
        />
      )}
    </AdminLayout>
  )
}

function Conversation({
  room,
  me,
  memberById,
  onBack,
  onRead,
  onSent,
}: {
  room: Room
  me: string
  memberById: Map<string, Member>
  onBack: () => void
  onRead: (roomId: string) => void
  onSent: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(0)
  // 맨 아래를 보고 있을 때만 새 글에 맞춰 따라 내려간다(위 글을 읽는 중에는 끌어내리지 않는다)
  const stickRef = useRef(true)

  const append = useCallback(
    (incoming: Message[]) => {
      if (!incoming.length) return
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id))
        const fresh = incoming.filter((m) => !seen.has(m.id))
        return fresh.length ? [...prev, ...fresh] : prev
      })
      lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id))
      onRead(room.id)
    },
    [onRead, room.id]
  )

  const fetchNew = useCallback(async () => {
    const res = await api.get(`/admin/chat/rooms/${room.id}/messages?after=${lastIdRef.current}`)
    append(res.data.messages)
  }, [append, room.id])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') fetchNew().catch(() => {})
    }
    fetchNew()
      .catch(() => setError('대화를 불러오지 못했어요.'))
      .finally(() => setLoading(false))
    const timer = setInterval(tick, ROOM_POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
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
      const res = await api.post(`/admin/chat/rooms/${room.id}/messages`, { body })
      setDraft('')
      stickRef.current = true
      append([res.data.message])
      onSent()
    } catch {
      setError('메시지를 보내지 못했어요. 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

  const subtitle =
    room.type === 'notice'
      ? `전체 구성원 ${room.memberIds.length}명이 보는 공지방`
      : room.type === 'group'
        ? room.memberIds.map((id) => memberById.get(id)?.name).filter(Boolean).join(', ')
        : '1:1 대화'

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
        <button type="button" onClick={onBack} aria-label="목록으로" className="md:hidden p-1 -ml-1 text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <RoomIcon room={room} size={38} />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-text-primary" data-testid="chat-room-title">
            {room.title}
          </p>
          <p className="truncate text-[12px] text-text-secondary">{subtitle}</p>
        </div>
      </header>

      <div
        ref={listRef}
        data-testid="chat-list"
        onScroll={(e) => {
          const el = e.currentTarget
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <p className="py-10 text-center text-small text-text-secondary">불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-small text-text-secondary">
            {room.type === 'notice' ? '아직 공지가 없어요. 첫 공지를 올려보세요.' : '아직 대화가 없어요. 첫 메시지를 남겨보세요.'}
          </p>
        ) : (
          <ul>
            {messages.map((m, i) => {
              const prev = messages[i - 1]
              const mine = m.authorId === me
              const author = memberById.get(m.authorId)
              const name = author?.name ?? '알 수 없음'
              const newDay = !prev || !sameDay(prev.createdAt, m.createdAt)
              // 같은 사람이 이어서 쓴 글은 이름·사진을 한 번만 보여준다
              const grouped =
                !newDay &&
                prev.authorId === m.authorId &&
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000
              return (
                <li key={m.id}>
                  {newDay && <p className="my-4 text-center text-[12px] text-text-secondary">{dayLabel(m.createdAt)}</p>}
                  <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''} ${grouped ? 'mt-1' : 'mt-4'}`}>
                    {!mine && (
                      <span className="w-9 shrink-0 self-start">
                        {!grouped && <Avatar name={name} url={author?.avatarUrl} />}
                      </span>
                    )}
                    <div className={`max-w-[72%] min-w-0 flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      {!mine && !grouped && <span className="mb-1 text-[12px] font-medium text-text-secondary">{name}</span>}
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

      {error && <p className="px-4 pb-1 text-small text-red-500">{error}</p>}

      <div className="flex items-end gap-2 px-4 py-3 border-t border-border">
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
          placeholder={room.type === 'notice' ? '공지 내용 입력 (Enter 전송)' : '메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)'}
          data-testid="chat-input"
          className="flex-1 max-h-40 min-h-[46px] resize-none px-4 py-3 rounded-2xl bg-bg-primary border border-transparent text-[15px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-action-primary"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim() || sending}
          aria-label="보내기"
          data-testid="chat-send"
          className="h-[46px] w-[46px] shrink-0 flex items-center justify-center rounded-2xl bg-action-primary text-white disabled:opacity-40 transition-opacity"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}

function GroupModal({
  members,
  onClose,
  onCreate,
}: {
  members: Member[]
  onClose: () => void
  onCreate: (name: string, memberIds: string[]) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const submit = async () => {
    if (!name.trim()) return setError('대화방 이름을 입력해주세요.')
    if (picked.length === 0) return setError('함께할 구성원을 한 명 이상 골라주세요.')
    setBusy(true)
    try {
      await onCreate(name.trim(), picked)
    } catch {
      setError('대화방을 만들지 못했어요.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" data-testid="chat-group-modal">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-overlay" />
      <div className="relative w-full max-w-[400px] max-h-[80vh] flex flex-col rounded-2xl bg-bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">그룹 대화 만들기</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="대화방 이름"
          data-testid="chat-group-name"
          className="px-4 py-2.5 rounded-button bg-bg-primary border border-border text-body text-text-primary focus:outline-none focus:border-action-primary"
        />
        <p className="mt-4 mb-1 text-small text-text-secondary">구성원 {picked.length}명 선택</p>
        <ul className="flex-1 min-h-0 overflow-y-auto -mx-1">
          {members.map((m) => {
            const on = picked.includes(m.id)
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  aria-pressed={on}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-bg-primary"
                >
                  <Avatar name={m.name} url={m.avatarUrl} size={36} />
                  <span className="flex-1 min-w-0 truncate text-body text-text-primary">{m.name}</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      on ? 'bg-action-primary border-action-primary text-white' : 'border-border text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </button>
              </li>
            )
          })}
          {members.length === 0 && (
            <li className="py-6 text-center text-small text-text-secondary">아직 다른 구성원이 없어요.</li>
          )}
        </ul>
        {error && <p className="mt-2 text-small text-red-500">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          data-testid="chat-group-create"
          className="mt-4 h-11 rounded-button bg-action-primary text-white text-body font-medium disabled:opacity-50"
        >
          만들기
        </button>
      </div>
    </div>
  )
}
