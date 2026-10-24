'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/admin/api'
import Avatar from '@/components/admin/Avatar'
import { formatDateTime } from '@/components/admin/labels'

// 구성원 관리(오너 전용). 역할·전화번호·인입 알림, 초대키 발급.
type Member = { id: string; loginId: string; nickname: string; code: string; role: 'owner' | 'admin' | 'marketer'; phone: string | null; notifyLeads: boolean; avatarUrl: string | null; leadCount: number; createdAt: string; isSelf: boolean; status: 'pending' | 'active' | 'rejected' | 'disabled'; bankName: string | null; bankAccount: string | null; accountHolder: string | null; channelUrl: string | null; appliedAt: string | null }
const ROLE_LABEL = { owner: '대표자', admin: '관리자', marketer: '파트너스' } as const
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: '사용 중', cls: 'bg-green-100 text-green-700' },
  pending: { label: '승인 대기', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '거부됨', cls: 'bg-gray-100 text-gray-500' },
  disabled: { label: '비활성', cls: 'bg-gray-100 text-gray-500' },
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneDraft, setPhoneDraft] = useState<Record<string, string>>({})

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-text-primary tracking-[-0.01em]">구성원 관리</h1>
        <p className="mt-1 text-[13px] text-text-secondary">대표자는 모든 권한, 관리자는 구성원 관리 제외 전체, 파트너스는 본인 상담과 자료만 봅니다.</p>
      </div>

      {members.some((m) => m.status === 'pending') && (
        <section className="rounded-2xl bg-bg-card p-5" data-testid="pending-members">
          <p className="text-[15px] font-semibold text-text-primary">가입 승인 대기 <span className="text-action-primary">{members.filter((m) => m.status === 'pending').length}</span></p>
          <ul className="mt-3 divide-y divide-border">
            {members.filter((m) => m.status === 'pending').map((m) => (
              <li key={m.id} className="py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="min-w-[180px]">
                  <p className="text-[14px] font-medium text-text-primary">{m.nickname} <span className="text-[12px] text-text-tertiary">{m.loginId}</span></p>
                  <p className="text-[12px] text-text-secondary">{m.phone ? m.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3') : '-'} · {m.appliedAt ? `${formatDateTime(m.appliedAt)} 신청` : ''}</p>
                </div>
                <p className="text-[12px] text-text-secondary">{m.bankName ?? '-'} {m.bankAccount ?? ''} {m.accountHolder ? `(${m.accountHolder})` : ''}</p>
                {m.channelUrl && <a href={m.channelUrl} target="_blank" rel="noreferrer" className="text-[12px] text-action-primary underline truncate max-w-[240px]">{m.channelUrl}</a>}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => patch(m.id, { status: 'rejected' })} className="px-3 py-1.5 rounded-lg border border-border text-[13px] text-text-secondary hover:text-text-primary">거부</button>
                  <button onClick={() => patch(m.id, { status: 'active' })} className="px-3 py-1.5 rounded-lg bg-action-primary text-white text-[13px] font-semibold">승인</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <section className="rounded-2xl bg-bg-card overflow-x-auto">
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
              {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-text-secondary">불러오는 중…</td></tr>}
              {!loading && members.filter((m) => m.status !== 'pending').map((m) => (
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
                  <td className="px-5 py-3">
                    <select value={m.role} disabled={m.isSelf} onChange={(e) => patch(m.id, { role: e.target.value })} className="px-2 py-1.5 rounded-lg bg-bg-primary border border-border text-[13px] text-text-primary disabled:opacity-60">
                      {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      value={phoneDraft[m.id] ?? ''}
                      onChange={(e) => setPhoneDraft((d) => ({ ...d, [m.id]: e.target.value }))}
                      onBlur={() => (phoneDraft[m.id] ?? '') !== (m.phone ?? '') && patch(m.id, { phone: phoneDraft[m.id] || null })}
                      placeholder="010-0000-0000"
                      className="w-36 px-2 py-1.5 rounded-lg bg-bg-primary border border-border text-[13px] text-text-primary"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" checked={m.notifyLeads} onChange={(e) => patch(m.id, { notifyLeads: e.target.checked })} className="w-4 h-4 accent-[var(--action-primary)]" />
                      <span className="text-[12px] text-text-secondary">알림톡</span>
                    </label>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-text-secondary whitespace-nowrap"><code>{m.code}</code> · {m.leadCount}건</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${(STATUS_LABEL[m.status] ?? STATUS_LABEL.active).cls}`}>{(STATUS_LABEL[m.status] ?? STATUS_LABEL.active).label}</span>
                    {!m.isSelf && (
                      <button onClick={() => patch(m.id, { status: m.status === 'active' ? 'disabled' : 'active' })} className="ml-2 text-[12px] text-text-tertiary hover:text-text-primary underline">
                        {m.status === 'active' ? '비활성화' : '활성화'}
                      </button>
                    )}
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
