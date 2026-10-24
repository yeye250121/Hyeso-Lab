'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Phone, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { LEAD_STATUS, SERVICE_LABEL, formatDateTime, monthsLabel } from '@/components/admin/labels'
import StatementPanel from '@/components/admin/StatementPanel'
import { useConsole } from '@/lib/admin/useConsole'
import MarketerLeads from '@/components/admin/marketer/MarketerLeads'
import Sheet from '@/components/admin/ui/Sheet'
import StatusSelect from '@/components/admin/ui/StatusSelect'
import { FilterRow, SearchForm, selectCls } from '@/components/admin/ui/Filters'

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
  alimtalkError: string | null
  shortToken: string | null
  applicationId: string | null
  statementSentAt: string | null
  giftAmount: number | null
  existingService: 'new' | 'existing' | null
  submittedAt: string
}

export default function LeadsPage() {
  // 역할은 주소의 콘솔로 판단한다(미들웨어가 보장). 스토어는 첫 렌더에 비어 있어 운영 화면이 먼저 그려지며
  // 운영 API 를 불렀다가 401 로 로그아웃되는 문제가 있었다.
  const { console: consoleName } = useConsole()
  if (consoleName === 'partners') {
    return (
      <AdminLayout>
        <MarketerLeads />
      </AdminLayout>
    )
  }
  return <AdminLeadsPage />
}

function AdminLeadsPage() {
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

  const [resending, setResending] = useState<string | null>(null)
  const resendAlimtalk = async (id: string) => {
    setResending(id)
    try {
      const res = await api.post(`/admin/leads/${id}/alimtalk`)
      const r = res.data as { success: boolean; sentAt?: string; error?: string }
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, alimtalkSentAt: r.sentAt ?? l.alimtalkSentAt, alimtalkError: r.success ? null : r.error ?? '발송 실패' } : l)))
    } finally {
      setResending(null)
    }
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
  const openLead = leads.find((l) => l.id === openId) ?? null
  const detailProps = (l: Lead) => ({
    lead: l,
    memoDraft,
    setMemoDraft,
    onSaveMemo: () => saveMemo(l.id),
    saving,
    onResend: () => resendAlimtalk(l.id),
    resending: resending === l.id,
  })

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

        <FilterRow>
          <select value={service} onChange={(e) => setService(e.target.value)} className={selectCls} data-testid="lead-filter-service">
            <option value="">전체 서비스</option>
            {Object.entries(SERVICE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls} data-testid="lead-filter-status">
            <option value="">전체 상태</option>
            {Object.entries(LEAD_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <SearchForm value={q} onChange={setQ} onSubmit={load} placeholder="이름·전화번호 검색" />
        </FilterRow>

        {/* 모바일: 건당 카드. 누르면 상세 시트 */}
        <ul className="md:hidden space-y-2.5" data-testid="lead-cards">
          {loading && <li className="rounded-card bg-bg-card px-5 py-10 text-center text-small text-text-secondary">불러오는 중…</li>}
          {!loading && leads.length === 0 && <li className="rounded-card bg-bg-card px-5 py-10 text-center text-small text-text-secondary">조건에 맞는 상담 신청이 없습니다.</li>}
          {!loading &&
            leads.map((l) => (
              <li key={l.id} className="rounded-card bg-bg-card">
                <button type="button" onClick={() => toggle(l)} className="w-full text-left px-4 pt-3.5 pb-2.5" data-testid="lead-card">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-text-primary truncate">{l.name || <span className="text-text-tertiary font-normal">이름 미입력</span>}</span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-bg-primary text-[11px] text-text-secondary">{SERVICE_LABEL[l.service] ?? l.service}</span>
                    {l.existingService && <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[11px] font-medium ${l.existingService === 'existing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{l.existingService === 'existing' ? '기존 이용' : '신규'}</span>}
                    <ChevronRight className="ml-auto w-4 h-4 text-text-tertiary shrink-0" />
                  </div>
                  <p className="mt-1 text-[13px] text-text-primary truncate">
                    {l.product ? `${l.product}${[monthsLabel(l.contractMonths), l.careType].filter(Boolean).length ? ` · ${[monthsLabel(l.contractMonths), l.careType].filter(Boolean).join(' ')}` : ''}` : <span className="text-text-tertiary">상담 후 결정</span>}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">{formatDateTime(l.submittedAt)} 접수{l.memo ? ` · ${l.memo}` : ''}</p>
                </button>
                <div className="px-4 pb-3 flex items-center justify-between gap-2">
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-bg-primary text-[13px] font-medium text-text-primary">
                    <Phone className="w-3.5 h-3.5" /> {l.phone}
                  </a>
                  <StatusSelect value={l.status} options={LEAD_STATUS} onChange={(s) => changeStatus(l.id, s)} testId="lead-status" />
                </div>
              </li>
            ))}
        </ul>

        {/* 데스크톱: 표 + 펼침 행 */}
        <div className="hidden md:block bg-bg-card rounded-card overflow-x-auto">
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
                leads.map((l) => {
                  const open = openId === l.id
                  return (
                    <LeadRow key={l.id} lead={l} open={open} onToggle={() => toggle(l)} onStatus={(s) => changeStatus(l.id, s)}>
                      {open && <LeadDetail {...detailProps(l)} />}
                    </LeadRow>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일 상세 시트 (데스크톱은 펼침 행을 쓴다) */}
      <div className="md:hidden">
        <Sheet
          open={!!openLead}
          onClose={() => setOpenId(null)}
          title={openLead?.name || '이름 미입력'}
          subtitle={openLead ? `${SERVICE_LABEL[openLead.service] ?? openLead.service} · ${formatDateTime(openLead.submittedAt)} 접수` : undefined}
          testId="lead-sheet"
        >
          {openLead && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <a href={`tel:${openLead.phone}`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-bg-primary text-[14px] font-medium text-text-primary">
                  <Phone className="w-4 h-4" /> {openLead.phone}
                </a>
                <StatusSelect value={openLead.status} options={LEAD_STATUS} onChange={(s) => changeStatus(openLead.id, s)} />
              </div>
              <LeadDetail {...detailProps(openLead)} />
            </div>
          )}
        </Sheet>
      </div>
    </AdminLayout>
  )
}

function LeadRow({ lead: l, open, onToggle, onStatus, children }: { lead: Lead; open: boolean; onToggle: () => void; onStatus: (s: string) => void; children?: React.ReactNode }) {
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
          <StatusSelect value={l.status} options={LEAD_STATUS} onChange={onStatus} />
        </td>
        <td className="px-4 py-3 text-text-secondary max-w-[220px] truncate">{l.memo}</td>
      </tr>
      {open && (
        <tr className="border-b border-border bg-bg-primary">
          <td colSpan={7} className="px-4 py-4">{children}</td>
        </tr>
      )}
    </>
  )
}

// 상세 내용. 데스크톱 펼침 행과 모바일 시트에서 같이 쓴다.
function LeadDetail({
  lead: l,
  memoDraft,
  setMemoDraft,
  onSaveMemo,
  saving,
  onResend,
  resending,
}: {
  lead: Lead
  memoDraft: string
  setMemoDraft: (v: string) => void
  onSaveMemo: () => void
  onResend: () => void
  resending: boolean
  saving: boolean
}) {
  const { path: cp } = useConsole()
  return (
    <div className="grid md:grid-cols-2 gap-5" data-testid="lead-detail">
      <dl className="space-y-1.5 text-small">
        <Row k="모델코드" v={l.modelCode} />
        <Row k="예상 월 렌탈료" v={l.monthlyFee ? `${l.monthlyFee.toLocaleString()}원` : null} />
        <Row k="이용 여부" v={l.existingService === 'existing' ? '기존 이용 중 (고객 답변)' : l.existingService === 'new' ? '신규 (고객 답변)' : null} />
        <Row k="마케팅 수신" v={l.agreedMarketing ? '동의' : '미동의'} />
        <div className="flex gap-3">
          <dt className="w-24 md:w-28 shrink-0 text-text-secondary">알림톡</dt>
          <dd className="text-text-primary flex flex-wrap items-center gap-2 min-w-0">
            <span>{l.alimtalkSentAt ? `${formatDateTime(l.alimtalkSentAt)} 발송` : '미발송'}</span>
            {l.alimtalkError && <span className="text-xs text-red-500 break-all">실패: {l.alimtalkError}</span>}
            {l.service !== 'card' && (
              <button onClick={onResend} disabled={resending} className="px-2 py-0.5 rounded-full border border-border text-xs text-text-secondary hover:text-text-primary disabled:opacity-40">
                {resending ? '발송 중…' : l.alimtalkSentAt ? '다시 보내기' : '보내기'}
              </button>
            )}
            {l.shortToken && <span className="text-xs text-text-tertiary">/c/{l.shortToken}</span>}
          </dd>
        </div>
        <Row k="유입 경로" v={l.referrerUrl} />
        <div className="flex gap-3">
          <dt className="w-24 md:w-28 shrink-0 text-text-secondary">신청서</dt>
          <dd className="text-text-primary">
            {l.applicationId ? (
              <Link href={cp(`/applications?open=${l.applicationId}`)} className="text-action-primary underline">작성됨 — 보기</Link>
            ) : (
              '미작성'
            )}
          </dd>
        </div>
      </dl>
      <div className="space-y-4">
        <StatementPanel endpoint={`/admin/leads/${l.id}/statement`} sentAt={l.statementSentAt} giftAmount={l.giftAmount} />
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
  )
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 md:w-28 shrink-0 text-text-secondary">{k}</dt>
      <dd className="text-text-primary break-all min-w-0">{v || <span className="text-text-tertiary">-</span>}</dd>
    </div>
  )
}
