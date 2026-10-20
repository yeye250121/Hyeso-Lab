'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/admin/api'
import { LEAD_STATUS, SERVICE_LABEL, formatDateTime } from '@/components/admin/labels'

// 마케터의 내 상담. 상태·서비스·접수 시각과 마스킹된 이름만 본다(연락처·주소·상품 상세 없음).
type Row = { id: string; service: string; status: string; name: string; product: string | null; hasApplication: boolean; submittedAt: string }

export default function MarketerLeads() {
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/marketer/leads${status ? `?status=${status}` : ''}`)
      setRows(res.data.leads)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-text-primary tracking-[-0.01em]">내 상담</h1>
          <p className="mt-1 text-[13px] text-text-secondary">내 링크로 들어온 상담 {rows.length}건. 고객 연락은 운영팀이 진행해요.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-card text-[13px] text-text-secondary hover:text-text-primary">
          <RefreshCw className="w-4 h-4" /> 새로고침
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[['', '전체'], ...Object.entries(LEAD_STATUS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button key={k} onClick={() => setStatus(k)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${status === k ? 'bg-text-primary text-bg-card' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 모바일: 건당 카드 */}
      <ul className="md:hidden space-y-2.5" data-testid="marketer-lead-cards">
        {loading && <li className="rounded-2xl bg-bg-card px-5 py-10 text-center text-[13px] text-text-secondary">불러오는 중…</li>}
        {!loading && rows.length === 0 && <li className="rounded-2xl bg-bg-card px-5 py-10 text-center text-[13px] text-text-secondary">조건에 맞는 상담이 없어요.</li>}
        {!loading && rows.map((r) => {
          const st = LEAD_STATUS[r.status] ?? LEAD_STATUS.new
          return (
            <li key={r.id} className="rounded-2xl bg-bg-card px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold text-text-primary">{r.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[12px] text-text-secondary">
                <span>{SERVICE_LABEL[r.service] ?? r.service}{r.product ? ` · ${r.product}` : ''}</span>
                <span className="text-text-tertiary">·</span>
                <span>{formatDateTime(r.submittedAt)}</span>
                {r.hasApplication && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span className="text-action-primary font-medium">신청서 작성됨</span>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* 데스크톱: 표 */}
      <div className="hidden md:block rounded-2xl bg-bg-card overflow-hidden">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-text-secondary border-b border-border">
              <th className="px-5 py-3 font-medium">접수</th>
              <th className="px-5 py-3 font-medium">고객</th>
              <th className="px-5 py-3 font-medium">서비스</th>
              <th className="px-5 py-3 font-medium">신청서</th>
              <th className="px-5 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-5 py-12 text-center text-text-secondary">불러오는 중…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-text-secondary">조건에 맞는 상담이 없어요.</td></tr>}
            {!loading && rows.map((r) => {
              const st = LEAD_STATUS[r.status] ?? LEAD_STATUS.new
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-secondary whitespace-nowrap">{formatDateTime(r.submittedAt)}</td>
                  <td className="px-5 py-3 text-text-primary">{r.name}</td>
                  <td className="px-5 py-3 text-text-secondary">{SERVICE_LABEL[r.service] ?? r.service}{r.product ? ` · ${r.product}` : ''}</td>
                  <td className="px-5 py-3 text-text-secondary">{r.hasApplication ? '작성됨' : '-'}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
