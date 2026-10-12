'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, RefreshCw, Search, X } from 'lucide-react'
import api from '@/lib/admin/api'
import { APPLICATION_STATUS, formatDateTime } from '@/components/admin/labels'
import StatementPanel from '@/components/admin/StatementPanel'

// 인터넷 신청서 목록·상세. 가전렌탈 신청서 화면과 같은 구성이고,
// 고객이 건너뛴 항목(사은품 계좌·납부 계좌·상품)은 "보완 필요" 로 표시해 해피콜에서 채운다.

interface Row {
  id: string
  name: string
  phone: string
  customerType: string
  status: string
  decideAfterConsult: boolean
  product: string | null
  monthlyFee: number | null
  currentInternet: string | null
  region: string | null
  needsFollowup: boolean
  skipped: string[]
  leadId: string | null
  memo: string
  statementSentAt: string | null
  submittedAt: string
}

type Detail = Record<string, string | number | boolean | null> & { id: string; status: string; memo: string; revealed: boolean }

export default function InternetApplications() {
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [memoDraft, setMemoDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (q.trim()) params.set('q', q.trim())
      const res = await api.get(`/admin/internet-applications?${params}`)
      setRows(res.data.applications)
    } finally {
      setLoading(false)
    }
  }, [status, q])

  const openDetail = useCallback(async (id: string, reveal = false) => {
    const res = await api.get(`/admin/internet-applications/${id}${reveal ? '?reveal=1' : ''}`)
    setDetail(res.data.application)
    if (!reveal) setMemoDraft(res.data.application.memo)
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    const id = searchParams.get('open')
    if (id) openDetail(id)
  }, [searchParams, openDetail])

  const changeStatus = async (id: string, next: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)))
    setDetail((d) => (d && d.id === id ? { ...d, status: next } : d))
    await api.patch(`/admin/internet-applications/${id}`, { status: next })
  }

  const saveMemo = async () => {
    if (!detail) return
    setSaving(true)
    try {
      await api.patch(`/admin/internet-applications/${detail.id}`, { memo: memoDraft })
      setRows((prev) => prev.map((r) => (r.id === detail.id ? { ...r, memo: memoDraft.trim() } : r)))
      setDetail({ ...detail, memo: memoDraft.trim() })
    } finally {
      setSaving(false)
    }
  }

  const unprocessed = rows.filter((r) => r.status === 'new').length
  const followup = rows.filter((r) => r.needsFollowup && r.status !== 'cancelled' && r.status !== 'contracted').length

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <p className="text-small text-text-secondary">
            총 {rows.length}건 · 미처리 <span className="text-action-primary font-semibold">{unprocessed}</span>건 · 보완 필요{' '}
            <span className="text-yellow-700 font-semibold">{followup}</span>건 · 계좌번호는 상세에서 민감정보 보기를 눌러야 보입니다
          </p>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-bg-card text-small text-text-secondary hover:text-text-primary">
            <RefreshCw className="w-4 h-4" /> 새로고침
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
            <option value="">전체 상태</option>
            {Object.entries(APPLICATION_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <form onSubmit={(e) => { e.preventDefault(); load() }} className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·전화번호 검색" className="w-full pl-9 pr-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary" />
          </form>
        </div>

        <div className="bg-bg-card rounded-card overflow-x-auto">
          <table className="w-full min-w-[920px] text-small">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="px-4 py-3 font-medium">접수</th>
                <th className="px-4 py-3 font-medium">가입자</th>
                <th className="px-4 py-3 font-medium">전화번호</th>
                <th className="px-4 py-3 font-medium">구분</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">설치 지역</th>
                <th className="px-4 py-3 font-medium">보완</th>
                <th className="px-4 py-3 font-medium">명세서</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="px-4 py-12 text-center text-text-secondary">불러오는 중…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-text-secondary">조건에 맞는 신청서가 없습니다.</td></tr>}
              {!loading &&
                rows.map((r) => {
                  const st = APPLICATION_STATUS[r.status] ?? APPLICATION_STATUS.new
                  return (
                    <tr key={r.id} onClick={() => openDetail(r.id)} className="border-b border-border last:border-0 cursor-pointer hover:bg-bg-primary">
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDateTime(r.submittedAt)}</td>
                      <td className="px-4 py-3 text-text-primary whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 text-text-primary whitespace-nowrap">{r.phone}</td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.customerType}</td>
                      <td className="px-4 py-3 text-text-primary">
                        {r.product ? (
                          <>
                            {r.product}
                            {r.monthlyFee != null && <span className="text-text-secondary"> · 월 {r.monthlyFee.toLocaleString()}원</span>}
                          </>
                        ) : (
                          <span className="text-text-tertiary">상담 후 결정</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.region ?? '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.needsFollowup ? (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium" title={r.skipped.join(', ')}>
                            보완 필요 · {r.skipped.join('·')}
                          </span>
                        ) : (
                          <span className="text-xs text-text-tertiary">완료</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.statementSentAt ? <span className="text-xs text-green-600">{formatDateTime(r.statementSentAt)} 전달</span> : <span className="text-xs text-text-tertiary">미전달</span>}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${st.cls}`}>
                          {Object.entries(APPLICATION_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button aria-label="닫기" className="absolute inset-0 bg-overlay" onClick={() => setDetail(null)} />
          <aside className="relative w-full max-w-[520px] h-full bg-bg-card overflow-y-auto shadow-xl">
            <header className="sticky top-0 bg-bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-title text-text-primary">{detail.name as string} 님 인터넷 신청서</p>
                <p className="text-small text-text-secondary">{formatDateTime(detail.submittedAt as string)} 접수</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1 text-text-secondary"><X className="w-5 h-5" /></button>
            </header>

            <div className="px-6 py-5 space-y-6">
              {detail.needsFollowup && (
                <p className="rounded-button bg-yellow-50 border border-yellow-200 px-4 py-3 text-small text-yellow-800">
                  고객이 일부 항목을 건너뛰었습니다. 해피콜에서 아래 (미입력) 항목을 확인해주세요.
                </p>
              )}
              <button onClick={() => openDetail(detail.id, !detail.revealed)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-button border border-border text-small font-medium text-text-primary hover:bg-bg-primary">
                {detail.revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {detail.revealed ? '민감정보 다시 가리기' : '민감정보 보기 (열람 기록이 남습니다)'}
              </button>

              <StatementPanel
                key={detail.id}
                endpoint={`/admin/internet-applications/${detail.id}/statement`}
                sentAt={(detail.statementSentAt as string | null) ?? null}
                onSent={(res) => {
                  setRows((prev) => prev.map((r) => (r.id === detail.id ? { ...r, statementSentAt: res.sentAt, status: res.status ?? r.status } : r)))
                  setDetail((d) => (d ? { ...d, statementSentAt: res.sentAt, status: res.status ?? d.status } : d))
                }}
              />

              <Block title="상품">
                <Item k="통신사" v={detail.decideAfterConsult ? '상담 후 결정' : detail.carrierName} />
                <Item k="상품" v={detail.product} />
                <Item k="월 요금" v={detail.monthlyFee ? `${Number(detail.monthlyFee).toLocaleString()}원` : null} />
                <Item k="현금 사은품" v={detail.customerGift != null ? `${Number(detail.customerGift).toLocaleString()}원` : '상담 시 안내'} />
                <Item k="통신사 상품권" v={detail.voucher ? `${Number(detail.voucher).toLocaleString()}원` : null} />
              </Block>

              <Block title="연락처">
                <Item k="신청자" v={detail.applicantIsSelf === false ? '대리 신청' : '본인'} />
                <Item k="이름" v={detail.name} />
                <Item k="휴대폰" v={[detail.phone, detail.phoneCarrier && `(${detail.phoneCarrier})`].filter(Boolean).join(' ')} />
              </Block>

              <Block title="가입 정보">
                <Item k="고객 구분" v={detail.customerType} />
                <Item k="사업자" v={[detail.businessName, detail.businessNumber].filter(Boolean).join(' / ')} />
                <Item k="현재 인터넷" v={detail.currentInternet === 'using' ? `사용 중 · ${detail.currentCarrier ?? '-'}${detail.hasMobileBundle === true ? ' · 휴대폰 결합' : detail.hasMobileBundle === false ? ' · 결합 없음' : ' · 결합 미확인'}` : detail.currentInternet === 'none' ? '미사용' : null} />
                <Item k="설치 주소" v={[detail.zonecode && `(${detail.zonecode})`, detail.address, detail.addressDetail].filter(Boolean).join(' ')} />
                <Item k="이메일" v={detail.email} />
              </Block>

              <Block title="사은품 수령">
                {detail.giftSkipped ? (
                  <Item k="계좌" v="(미입력) 해피콜 확인" />
                ) : (
                  <>
                    <Item k="수령자" v={detail.giftReceiver} />
                    <Item k="은행" v={detail.giftBank} />
                    <Item k="계좌번호" v={detail.giftAccountNumber} sensitive />
                  </>
                )}
              </Block>

              <Block title="납부">
                {detail.paymentSkipped ? (
                  <Item k="자동이체" v="(미입력) 해피콜 확인" />
                ) : (
                  <>
                    <Item k="납부자" v={detail.paymentPayer} />
                    <Item k="은행" v={detail.paymentBank} />
                    <Item k="계좌번호" v={detail.paymentAccountNumber} sensitive />
                    <Item k="사은품 계좌와 동일" v={detail.paymentSameAsGift ? '예' : '아니오'} />
                  </>
                )}
              </Block>

              <Block title="기타">
                <Item k="요청사항" v={detail.customerNote} />
                <Item k="마케팅 수신" v={detail.agreedMarketing ? '동의' : '미동의'} />
                <Item k="상담 신청 연결" v={detail.leadId ? '연결됨' : '없음'} />
              </Block>

              <div>
                <p className="text-small font-semibold text-text-primary mb-2">관리자 메모</p>
                <textarea value={memoDraft} onChange={(e) => setMemoDraft(e.target.value)} rows={4} placeholder="통신사 전달 여부, 해피콜 결과 등" className="w-full px-3 py-2 rounded-button bg-bg-primary border border-border text-small text-text-primary resize-none" />
                <button onClick={saveMemo} disabled={saving || memoDraft.trim() === detail.memo} className="mt-2 px-4 py-2 rounded-button bg-action-primary text-white text-small font-medium disabled:opacity-40">
                  {saving ? '저장 중…' : '메모 저장'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-small font-semibold text-text-primary mb-2">{title}</p>
      <dl className="rounded-button bg-bg-primary px-4 py-3 space-y-1.5 text-small">{children}</dl>
    </section>
  )
}

function Item({ k, v, sensitive }: { k: string; v: unknown; sensitive?: boolean }) {
  const text = v === null || v === undefined || v === '' ? null : String(v)
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-text-secondary">{k}</dt>
      <dd className={`break-all ${sensitive ? 'font-mono' : ''} text-text-primary`}>{text ?? <span className="text-text-tertiary">-</span>}</dd>
    </div>
  )
}
