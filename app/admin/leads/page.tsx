'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, RefreshCw, Search } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { LEAD_STATUS, SERVICE_LABEL, formatDateTime, monthsLabel } from '@/components/admin/labels'
import StatementPanel from '@/components/admin/StatementPanel'

interface Lead {
  id: string
  service: string
  name: string | null
  phone: string
  status: string
  memo: string
  product: string | null
  modelCode: string | null
  monthlyFee: number | null
  contractMonths: number | null
  careType: string | null
  agreedMarketing: boolean
  referrerUrl: string | null
  alimtalkSentAt: string | null
  applicationId: string | null
  statementSentAt: string | null
  submittedAt: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState('')
  // 대시보드의 "미처리" 카드에서 ?status=new 로 넘어온다
  const [status, setStatus] = useState(() =>
    typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('status') ?? ''
  )
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [memoDraft, setMemoDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (service) params.set('service', service)
      if (status) params.set('status', status)
      if (q.trim()) params.set('q', q.trim())
      const res = await api.get(`/admin/leads?${params}`)
      setLeads(res.data.leads)
    } finally {
      setLoading(false)
    }
  }, [service, status, q])

  useEffect(() => {
    load()
    // 검색어는 엔터/버튼으로만 다시 불러온다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, status])

  const changeStatus = async (id: string, next: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: next } : l)))
    await api.patch(`/admin/leads/${id}`, { status: next })
  }

  const saveMemo = async (id: string) => {
    setSaving(true)
    try {
      await api.patch(`/admin/leads/${id}`, { memo: memoDraft })
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, memo: memoDraft.trim() } : l)))
    } finally {
      setSaving(false)
    }
  }

  const toggle = (l: Lead) => {
    if (openId === l.id) return setOpenId(null)
    setOpenId(l.id)
    setMemoDraft(l.memo)
  }

  const unprocessed = leads.filter((l) => l.status === 'new').length

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-headline text-text-primary">상담 신청</h1>
            <p className="text-small text-text-secondary mt-1">
              총 {leads.length}건 · 미처리 <span className="text-action-primary font-semibold">{unprocessed}</span>건
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-bg-card text-small text-text-secondary hover:text-text-primary">
            <RefreshCw className="w-4 h-4" /> 새로고침
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={service} onChange={(e) => setService(e.target.value)} className="px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
            <option value="">전체 서비스</option>
            {Object.entries(SERVICE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
            <option value="">전체 상태</option>
            {Object.entries(LEAD_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              load()
            }}
            className="relative flex-1 min-w-[200px] max-w-[320px]"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·전화번호 검색" className="w-full pl-9 pr-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary" />
          </form>
        </div>

        <div className="bg-bg-card rounded-card overflow-x-auto">
          <table className="w-full min-w-[860px] text-small">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="px-4 py-3 font-medium">접수</th>
                <th className="px-4 py-3 font-medium">서비스</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">전화번호</th>
                <th className="px-4 py-3 font-medium">희망 상품</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">메모</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-text-secondary">불러오는 중…</td></tr>
              )}
              {!loading && leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-text-secondary">조건에 맞는 상담 신청이 없습니다.</td></tr>
              )}
              {!loading &&
                leads.map((l) => (
                  <LeadRows
                    key={l.id}
                    lead={l}
                    open={openId === l.id}
                    onToggle={() => toggle(l)}
                    onStatus={(s) => changeStatus(l.id, s)}
                    memoDraft={memoDraft}
                    setMemoDraft={setMemoDraft}
                    onSaveMemo={() => saveMemo(l.id)}
                    saving={saving}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

function LeadRows({
  lead: l,
  open,
  onToggle,
  onStatus,
  memoDraft,
  setMemoDraft,
  onSaveMemo,
  saving,
}: {
  lead: Lead
  open: boolean
  onToggle: () => void
  onStatus: (s: string) => void
  memoDraft: string
  setMemoDraft: (v: string) => void
  onSaveMemo: () => void
  saving: boolean
}) {
  const st = LEAD_STATUS[l.status] ?? LEAD_STATUS.new
  return (
    <>
      <tr className={`border-b border-border last:border-0 cursor-pointer hover:bg-bg-primary ${open ? 'bg-bg-primary' : ''}`} onClick={onToggle}>
        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDateTime(l.submittedAt)}</td>
        <td className="px-4 py-3 text-text-primary whitespace-nowrap">{SERVICE_LABEL[l.service] ?? l.service}</td>
        <td className="px-4 py-3 text-text-primary whitespace-nowrap">{l.name || <span className="text-text-tertiary">미입력</span>}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          <a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-text-primary hover:text-action-primary">
            <Phone className="w-3.5 h-3.5" /> {l.phone}
          </a>
        </td>
        <td className="px-4 py-3 text-text-primary">
          {l.product ? (
            <>
              {l.product}
              <span className="text-text-secondary"> · {[monthsLabel(l.contractMonths), l.careType].filter(Boolean).join(' ')}</span>
            </>
          ) : (
            <span className="text-text-tertiary">상담 후 결정</span>
          )}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <select value={l.status} onChange={(e) => onStatus(e.target.value)} className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${st.cls}`}>
            {Object.entries(LEAD_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-text-secondary max-w-[220px] truncate">{l.memo}</td>
      </tr>
      {open && (
        <tr className="border-b border-border bg-bg-primary">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid md:grid-cols-2 gap-5">
              <dl className="space-y-1.5 text-small">
                <Row k="모델코드" v={l.modelCode} />
                <Row k="예상 월 렌탈료" v={l.monthlyFee ? `${l.monthlyFee.toLocaleString()}원` : null} />
                <Row k="마케팅 수신" v={l.agreedMarketing ? '동의' : '미동의'} />
                <Row k="알림톡" v={l.alimtalkSentAt ? `${formatDateTime(l.alimtalkSentAt)} 발송` : '미발송'} />
                <Row k="유입 경로" v={l.referrerUrl} />
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-text-secondary">신청서</dt>
                  <dd className="text-text-primary">
                    {l.applicationId ? (
                      <Link href={`/admin/applications?open=${l.applicationId}`} className="text-action-primary underline">작성됨 — 보기</Link>
                    ) : (
                      '미작성'
                    )}
                  </dd>
                </div>
              </dl>
              <div className="space-y-4">
                <StatementPanel endpoint={`/admin/leads/${l.id}/statement`} sentAt={l.statementSentAt} />
                <div>
                <textarea
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  rows={4}
                  placeholder="통화 결과, 전달 여부 등 내부 메모"
                  className="w-full px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary resize-none"
                />
                <button onClick={onSaveMemo} disabled={saving || memoDraft.trim() === l.memo} className="mt-2 px-4 py-2 rounded-button bg-action-primary text-white text-small font-medium disabled:opacity-40">
                  {saving ? '저장 중…' : '메모 저장'}
                </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-text-secondary">{k}</dt>
      <dd className="text-text-primary break-all">{v || <span className="text-text-tertiary">-</span>}</dd>
    </div>
  )
}
