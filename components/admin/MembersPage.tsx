'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/lib/admin/api'
import Avatar from '@/components/admin/Avatar'
import InviteKeyGenerator from '@/components/admin/InviteKeyGenerator'
import { formatDateTime } from '@/components/admin/labels'

// 구성원 관리(오너 전용). 역할·전화번호·인입 알림, 초대키 발급.
type Member = { id: string; loginId: string; nickname: string; code: string; role: 'owner' | 'admin' | 'marketer'; phone: string | null; notifyLeads: boolean; avatarUrl: string | null; leadCount: number; createdAt: string; isSelf: boolean }
const ROLE_LABEL = { owner: '대표자', admin: '관리자', marketer: '파트너스' } as const

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

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <section className="rounded-2xl bg-bg-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="text-left text-[12px] text-text-secondary border-b border-border">
                <th className="px-5 py-3 font-medium">구성원</th>
                <th className="px-5 py-3 font-medium">역할</th>
                <th className="px-5 py-3 font-medium">전화번호</th>
                <th className="px-5 py-3 font-medium">인입 알림</th>
                <th className="px-5 py-3 font-medium">코드 · 인입</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-text-secondary">불러오는 중…</td></tr>}
              {!loading && members.map((m) => (
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
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={m.notifyLeads} onChange={(e) => patch(m.id, { notifyLeads: e.target.checked })} className="w-4 h-4 accent-[var(--action-primary)]" />
                      <span className="text-[12px] text-text-secondary">알림톡</span>
                    </label>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-text-secondary whitespace-nowrap"><code>{m.code}</code> · {m.leadCount}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="rounded-2xl bg-bg-card p-5">
          <p className="text-[15px] font-semibold text-text-primary">구성원 초대</p>
          <p className="mt-1 text-[12px] text-text-secondary">역할을 고르고 초대키를 발급해 전달하세요. 가입 화면(/admin/register)에서 키를 넣으면 그 역할로 가입됩니다. 1시간 유효.</p>
          <div className="mt-3">
            <InviteKeyGenerator />
          </div>
        </aside>
      </div>
    </div>
  )
}
