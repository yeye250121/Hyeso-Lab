'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import api from '@/lib/admin/api'
import Avatar from '@/components/admin/Avatar'
import { formatDateTime } from '@/components/admin/labels'

// 구성원 관리(오너 전용). 역할·전화번호·인입 알림·상태. 모바일은 구성원별 카드(눌러서 펼침), 데스크톱은 표.
type Member = { id: string; loginId: string; nickname: string; code: string; role: 'owner' | 'admin' | 'marketer'; phone: string | null; notifyLeads: boolean; avatarUrl: string | null; leadCount: number; createdAt: string; isSelf: boolean; status: 'pending' | 'active' | 'rejected' | 'disabled'; bankName: string | null; bankAccount: string | null; accountHolder: string | null; channelUrl: string | null; appliedAt: string | null }
const ROLE_LABEL = { owner: '대표자', admin: '관리자', marketer: '파트너스' } as const
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: '사용 중', cls: 'bg-green-100 text-green-700' },
  pending: { label: '승인 대기', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '거부됨', cls: 'bg-gray-100 text-gray-500' },
  disabled: { label: '비활성', cls: 'bg-gray-100 text-gray-500' },
}
const fmtPhone = (p: string | null) => (p ? p.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3') : '-')

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneDraft, setPhoneDraft] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/members')
      setMembers(res.data.members)
      setPhoneDraft(Object.fromEntries(res.data.members.map((m: Member) => [m.id, m.phone ?? ''])))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const patch = async (id: string, body: Record<string, unknown>) => {
    await api.patch(`/admin/members/${id}`, body)
    await load()
  }

  const pending = members.filter((m) => m.status === 'pending')
  const list = members.filter((m) => m.status !== 'pending')

  const roleSelect = (m: Member) => (
    <select value={m.role} disabled={m.isSelf} onChange={(e) => patch(m.id, { role: e.target.value })} data-testid="member-role" className="h-9 px-2 rounded-lg bg-bg-primary border border-border text-[13px] text-text-primary disabled:opacity-60">
      {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
    </select>
  )
  const phoneInput = (m: Member, cls: string) => (
    <input
      value={phoneDraft[m.id] ?? ''}
      onChange={(e) => setPhoneDraft((d) => ({ ...d, [m.id]: e.target.value }))}
      onBlur={() => (phoneDraft[m.id] ?? '') !== (m.phone ?? '') && patch(m.id, { phone: phoneDraft[m.id] || null })}
      placeholder="010-0000-0000"
      inputMode="tel"
      className={`h-9 px-2.5 rounded-lg bg-bg-primary border border-border text-[13px] text-text-primary ${cls}`}
    />
  )
  const notifyToggle = (m: Member) => (
    <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
      <input type="checkbox" checked={m.notifyLeads} onChange={(e) => patch(m.id, { notifyLeads: e.target.checked })} className="w-4 h-4 accent-[var(--action-primary)]" />
      <span className="text-[13px] text-text-secondary">인입 알림톡</span>
    </label>
  )
  const statusBadge = (m: Member) => <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${(STATUS_LABEL[m.status] ?? STATUS_LABEL.active).cls}`}>{(STATUS_LABEL[m.status] ?? STATUS_LABEL.active).label}</span>
  const toggleActive = (m: Member) =>
    !m.isSelf && (
      <button onClick={() => patch(m.id, { status: m.status === 'active' ? 'disabled' : 'active' })} className="text-[12px] text-text-tertiary hover:text-text-primary underline">
        {m.status === 'active' ? '비활성화' : '활성화'}
      </button>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-text-primary tracking-[-0.01em]">구성원 관리</h1>
        <p className="mt-1 text-[13px] text-text-secondary">대표자는 모든 권한, 관리자는 구성원 관리 제외 전체, 파트너스는 본인 상담과 자료만 봅니다.</p>
      </div>

      {pending.length > 0 && (
        <section className="rounded-2xl bg-bg-card p-4 md:p-5" data-testid="pending-members">
          <p className="text-[15px] font-semibold text-text-primary">가입 승인 대기 <span className="text-action-primary">{pending.length}</span></p>
          <ul className="mt-3 divide-y divide-border">
            {pending.map((m) => (
              <li key={m.id} className="py-3 space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar name={m.nickname} url={m.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-text-primary">{m.nickname} <span className="text-[12px] text-text-tertiary">{m.loginId}</span></p>
                    <p className="text-[12px] text-text-secondary">{fmtPhone(m.phone)}{m.appliedAt ? ` · ${formatDateTime(m.appliedAt)} 신청` : ''}</p>
                    <p className="text-[12px] text-text-secondary">{m.bankName ?? '-'} {m.bankAccount ?? ''} {m.accountHolder ? `(${m.accountHolder})` : ''}</p>
                    {m.channelUrl && <a href={m.channelUrl} target="_blank" rel="noreferrer" className="block text-[12px] text-action-primary underline truncate">{m.channelUrl}</a>}
                  </div>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button onClick={() => patch(m.id, { status: 'rejected' })} className="flex-1 md:flex-none h-10 md:h-9 px-4 rounded-lg border border-border text-[13px] text-text-secondary hover:text-text-primary">거부</button>
                  <button onClick={() => patch(m.id, { status: 'active' })} className="flex-1 md:flex-none h-10 md:h-9 px-4 rounded-lg bg-action-primary text-white text-[13px] font-semibold">승인</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        {/* 모바일: 구성원별 카드. 누르면 역할·전화·알림 설정이 펼쳐진다 */}
        <ul className="md:hidden space-y-2.5" data-testid="member-cards">
          {loading && <li className="rounded-2xl bg-bg-card px-5 py-10 text-center text-[13px] text-text-secondary">불러오는 중…</li>}
          {!loading &&
            list.map((m) => {
              const open = expanded === m.id
              return (
                <li key={m.id} className="rounded-2xl bg-bg-card">
                  <button type="button" onClick={() => setExpanded(open ? null : m.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" data-testid="member-card">
                    <Avatar name={m.nickname} url={m.avatarUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-text-primary truncate">
                        {m.nickname}
                        {m.isSelf && <span className="ml-1 text-[11px] text-text-tertiary">(나)</span>}
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-action-primary/10 text-[10px] font-semibold text-action-primary">{ROLE_LABEL[m.role]}</span>
                      </p>
                      <p className="text-[12px] text-text-tertiary truncate">{m.loginId} · {fmtPhone(m.phone)}</p>
                    </div>
                    {statusBadge(m)}
                    <ChevronDown className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border" data-testid="member-detail">
                      <div className="grid grid-cols-[72px_1fr] items-center gap-2 text-[13px]">
                        <span className="text-text-secondary">역할</span>
                        {roleSelect(m)}
                        <span className="text-text-secondary">전화번호</span>
                        {phoneInput(m, 'w-full')}
                        <span className="text-text-secondary">알림</span>
                        {notifyToggle(m)}
                        <span className="text-text-secondary">코드</span>
                        <span className="text-text-primary"><code>{m.code}</code> · 인입 {m.leadCount}건</span>
                        <span className="text-text-secondary">가입</span>
                        <span className="text-text-primary">{formatDateTime(m.createdAt)}</span>
                      </div>
                      <div className="flex justify-end">{toggleActive(m)}</div>
                    </div>
                  )}
                </li>
              )
            })}
        </ul>

        {/* 데스크톱: 표 */}
        <section className="hidden md:block rounded-2xl bg-bg-card overflow-x-auto">
          <table className="w-full min-w-[860px] text-[14px]">
            <thead>
              <tr className="text-left text-[12px] text-text-secondary border-b border-border">
                <th className="px-5 py-3 font-medium">구성원</th>
                <th className="px-5 py-3 font-medium">역할</th>
                <th className="px-5 py-3 font-medium">전화번호</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">인입 알림</th>
                <th className="px-5 py-3 font-medium">코드 · 인입</th>
                <th className="px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-text-secondary">불러오는 중…</td></tr>}
              {!loading &&
                list.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.nickname} url={m.avatarUrl} size={32} />
                        <div className="min-w-0">
                          <p className="text-text-primary font-medium truncate">{m.nickname}{m.isSelf && <span className="ml-1 text-[11px] text-text-tertiary">(나)</span>}</p>
                          <p className="text-[12px] text-text-tertiary">{m.loginId} · {formatDateTime(m.createdAt)} 가입</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{roleSelect(m)}</td>
                    <td className="px-5 py-3">{phoneInput(m, 'w-36')}</td>
                    <td className="px-5 py-3">{notifyToggle(m)}</td>
                    <td className="px-5 py-3 text-[12px] text-text-secondary whitespace-nowrap"><code>{m.code}</code> · {m.leadCount}건</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {statusBadge(m)}
                      <span className="ml-2">{toggleActive(m)}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <aside className="rounded-2xl bg-bg-card p-5">
          <p className="text-[15px] font-semibold text-text-primary">구성원 추가 방법</p>
          <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">모든 구성원은 <code>/partners/register</code>에서 파트너스로 가입 신청합니다. 위 목록에서 승인한 뒤, 역할을 관리자나 대표자로 바꾸면 해당 콘솔을 쓸 수 있어요.</p>
        </aside>
      </div>
    </div>
  )
}
