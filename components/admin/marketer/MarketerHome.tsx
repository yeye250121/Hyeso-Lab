'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Link2, PhoneCall, Sparkles } from 'lucide-react'
import api from '@/lib/admin/api'
import { LEAD_STATUS, SERVICE_LABEL, formatDateTime } from '@/components/admin/labels'
import { useConsole } from '@/lib/admin/useConsole'
import { useAuthStore } from '@/lib/admin/store'

// 마케터 홈 = 내 성과판. 토스플레이스 파트너 홈(프로모션·설치 현황)을 우리 식으로 옮긴 것.
type Summary = {
  code: string
  month: { total: number; new: number; contacted: number; applied: number; closed: number }
  all: { total: number; applied: number; closed: number }
  weekly: { label: string; count: number }[]
  recent: { id: string; service: string; status: string; name: string; hasApplication: boolean; submittedAt: string }[]
}

export default function MarketerHome() {
  const { path: cp } = useConsole()
  const admin = useAuthStore((s) => s.admin)
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    api.get('/admin/marketer/summary').then((res) => setData(res.data)).catch(() => {})
  }, [])

  const max = Math.max(1, ...(data?.weekly.map((w) => w.count) ?? [1]))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] text-text-secondary">{admin?.nickname ? `${admin.nickname}님, ` : ''}오늘도 수고 많으세요</p>
        <h1 className="text-[24px] font-bold text-text-primary tracking-[-0.01em]">내 상담 현황</h1>
      </div>

      {/* 이번 달 요약 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="이번 달 인입" value={data?.month.total} accent />
        <Stat label="상담 대기" value={data?.month.new} />
        <Stat label="신청서 작성" value={data?.month.applied} />
        <Stat label="누적 인입" value={data?.all.total} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        {/* 주간 추이 */}
        <section className="rounded-2xl bg-bg-card p-5">
          <p className="text-[15px] font-semibold text-text-primary">최근 8주 인입</p>
          <div className="mt-5 flex items-end gap-2 h-32">
            {(data?.weekly ?? Array.from({ length: 8 }, () => ({ label: '', count: 0 }))).map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-text-secondary tabular-nums">{w.count || ''}</span>
                <div className="w-full rounded-md bg-action-primary/15 relative" style={{ height: `${Math.max(6, (w.count / max) * 96)}px` }}>
                  <div className="absolute inset-x-0 bottom-0 rounded-md bg-action-primary" style={{ height: w.count ? '100%' : 0 }} />
                </div>
                <span className="text-[10px] text-text-tertiary">{w.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 내 링크 안내 */}
        <section className="rounded-2xl bg-gradient-to-br from-[#fff1f5] to-white dark:from-action-primary/10 dark:to-bg-card p-5 flex flex-col">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-action-primary"><Sparkles className="w-3.5 h-3.5" /> 내 상담 링크</span>
          <p className="mt-2 text-[17px] font-bold text-text-primary leading-snug">링크로 들어온 상담은<br />자동으로 내 실적이 돼요</p>
          <p className="mt-1.5 text-[13px] text-text-secondary">블로그·SNS 글에 이 링크만 넣으면 돼요.</p>
          <Link href={cp('/link')} className="mt-auto inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-action-primary text-white text-[14px] font-semibold hover:bg-action-primary-hover">
            <Link2 className="w-4 h-4" /> 링크 복사하러 가기
          </Link>
        </section>
      </div>

      {/* 최근 상담 */}
      <section className="rounded-2xl bg-bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold text-text-primary">최근 상담</p>
          <Link href={cp('/leads')} className="inline-flex items-center gap-0.5 text-[13px] text-text-secondary hover:text-text-primary">전체 보기 <ChevronRight className="w-4 h-4" /></Link>
        </div>
        {data && data.recent.length === 0 ? (
          <div className="py-10 text-center">
            <PhoneCall className="w-8 h-8 mx-auto text-text-tertiary" strokeWidth={1.5} />
            <p className="mt-2 text-[13px] text-text-secondary">아직 들어온 상담이 없어요. 링크를 공유해 보세요.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {(data?.recent ?? []).map((r) => {
              const st = LEAD_STATUS[r.status] ?? LEAD_STATUS.new
              return (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                  <span className="text-[14px] text-text-primary">{r.name}</span>
                  <span className="text-[12px] text-text-secondary">{SERVICE_LABEL[r.service] ?? r.service}</span>
                  <span className="ml-auto text-[12px] text-text-tertiary">{formatDateTime(r.submittedAt)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number | undefined; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? 'bg-action-primary text-white' : 'bg-bg-card'}`}>
      <p className={`text-[12px] ${accent ? 'text-white/80' : 'text-text-secondary'}`}>{label}</p>
      <p className={`mt-1 text-[26px] font-bold tabular-nums ${accent ? '' : 'text-text-primary'}`}>{value ?? '–'}<span className="text-[14px] font-medium ml-0.5">건</span></p>
    </div>
  )
}
