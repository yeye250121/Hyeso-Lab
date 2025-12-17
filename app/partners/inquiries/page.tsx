'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/partners/store'
import api from '@/lib/partners/api'
import PartnerLayout from '@/components/partners/PartnerLayout'
import {
  Search,
  SlidersHorizontal,
  X,
  Phone,
  MapPin,
  Package,
  User,
  ChevronDown,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
} from 'lucide-react'

interface Inquiry {
  id: string
  phone_number: string
  install_location: string
  install_count: number
  marketer_code: string
  status: 'new' | 'in_progress' | 'contracted' | 'cancelled'
  submitted_at: string
  canEdit: boolean
  // 예약 관련 필드
  inquiry_type?: 'consultation' | 'installation'  // DB에서는 installation으로 저장됨
  reservation_date?: string
  reservation_time_slot?: string
  outdoor_count?: number
  indoor_count?: number
  address?: string
  address_detail?: string
  zonecode?: string
  documents?: Record<string, string> | null  // DB에서는 객체로 저장됨 { idCard: url, ... }
  documents_submitted?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  new: { label: '신규', color: 'bg-status-new', textColor: 'text-status-new' },
  in_progress: { label: '상담중', color: 'bg-status-progress', textColor: 'text-status-progress' },
  contracted: { label: '계약완료', color: 'bg-status-done', textColor: 'text-status-done' },
  cancelled: { label: '취소', color: 'bg-status-cancelled', textColor: 'text-status-cancelled' },
}

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG['new']
}

const TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'installation', label: '예약' },
  { value: 'consultation', label: '상담' },
]

function InquiriesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()

  // URL에서 partnerCode 파라미터 확인 (하위 파트너 문의 보기)
  const partnerCodeFilter = searchParams.get('partnerCode')

  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 검색
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('')

  // 필터
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [onlyMine, setOnlyMine] = useState(false)

  // 페이지네이션
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)


  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/partners/login')
      return
    }
    fetchInquiries()
  }, [page, statusFilter, typeFilter, onlyMine, partnerCodeFilter])

  const fetchInquiries = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(onlyMine && { onlyMine: 'true' }),
        ...(searchQuery && { search: searchQuery }),
        ...(desktopSearchQuery && { search: desktopSearchQuery }),
        ...(partnerCodeFilter && { partnerCode: partnerCodeFilter }),
        _t: Date.now().toString(),
      })

      const response = await api.get(`/inquiries?${params}`)
      let data = response.data.data || []

      // 타입 필터 적용 (클라이언트 사이드)
      if (typeFilter !== 'all') {
        data = data.filter((inquiry: Inquiry) => {
          const inquiryType = inquiry.inquiry_type || 'consultation'
          return inquiryType === typeFilter
        })
      }

      setInquiries(data)
      setTotalPages(response.data.pagination.totalPages)
      setTotalCount(response.data.pagination.total)
    } catch (error) {
      console.error('문의 목록 조회 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchInquiries()
    setIsSearchOpen(false)
  }

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInquiries()
  }

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      await api.patch(`/inquiries/${inquiryId}`, { status: newStatus })
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: newStatus as Inquiry['status'] } : inq
        )
      )
    } catch (error: any) {
      alert(error.response?.data?.error || '상태 변경에 실패했습니다')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const formatReservationDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const getTimeSlotLabel = (slot?: string) => {
    switch (slot) {
      case 'morning': return '오전'
      case 'afternoon': return '오후'
      default: return ''
    }
  }

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      idCard: '신분증',
      paymentCard: '결제수단',
      businessLicense: '사업자등록증',
    }
    return labels[type] || type
  }

  const getDocumentSummary = (documents: Record<string, string>) => {
    const keys = Object.keys(documents)
    if (keys.length === 0) return ''
    if (keys.length === 1) return getDocumentLabel(keys[0])
    // 우선순위: 신분증 > 결제카드 > 사업자등록증 > 기타
    const priority = ['idCard', 'paymentCard', 'businessLicense']
    const firstKey = priority.find(k => keys.includes(k)) || keys[0]
    return `${getDocumentLabel(firstKey)} 외 ${keys.length - 1}건`
  }

  const pageTitle = partnerCodeFilter ? `${partnerCodeFilter} 문의` : '문의 관리'

  return (
    <PartnerLayout
      title={pageTitle}
      showBackButton={!!partnerCodeFilter}
      onBack={() => router.push('/partners/inquiries')}
    >
      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:block">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {partnerCodeFilter && (
              <button
                onClick={() => router.push('/partners/inquiries')}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{pageTitle}</h1>
              <p className="text-text-secondary mt-1">총 {totalCount}건의 문의</p>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleDesktopSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="전화번호, 설치위치 검색"
                value={desktopSearchQuery}
                onChange={(e) => setDesktopSearchQuery(e.target.value)}
                className="w-80 pl-12 pr-4 py-3 bg-bg-card border border-border rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary"
              />
            </form>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-bg-card rounded-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* 상태 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-secondary mr-2">상태:</span>
                {[
                  { value: 'all', label: '전체' },
                  { value: 'new', label: '신규' },
                  { value: 'in_progress', label: '상담중' },
                  { value: 'contracted', label: '계약완료' },
                  { value: 'cancelled', label: '취소' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-full text-caption transition-colors ${
                      statusFilter === option.value
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary hover:bg-bg-primary/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* 유형 필터 */}
              <div className="flex items-center gap-2 border-l border-border pl-6">
                <span className="text-caption text-text-secondary mr-2">유형:</span>
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTypeFilter(option.value)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-full text-caption transition-colors ${
                      typeFilter === option.value
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary hover:bg-bg-primary/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-caption text-text-secondary">내 문의만</span>
              <button
                onClick={() => {
                  setOnlyMine(!onlyMine)
                  setPage(1)
                }}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  onlyMine ? 'bg-action-primary' : 'bg-text-tertiary'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    onlyMine ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-action-primary animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-bg-card rounded-card p-12 text-center">
            <p className="text-text-secondary">문의가 없습니다</p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-primary">
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">유형</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">설치위치</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">전화번호</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">수량</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">예약일</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">서류</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">담당자</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">상태</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">접수일</th>
                  <th className="text-left py-4 px-6 text-caption text-text-secondary font-medium">상태변경</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="border-b border-border last:border-b-0 hover:bg-bg-primary/50 transition-colors">
                    {/* 유형 */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption ${
                        inquiry.inquiry_type === 'installation'
                          ? 'bg-action-primary/10 text-action-primary'
                          : 'bg-bg-primary text-text-secondary'
                      }`}>
                        {inquiry.inquiry_type === 'installation' ? (
                          <>
                            <Calendar className="w-3 h-3" />
                            예약
                          </>
                        ) : (
                          <>
                            <Phone className="w-3 h-3" />
                            상담
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-body text-text-primary">{inquiry.install_location}</td>
                    <td className="py-4 px-6 text-body text-text-primary">{inquiry.phone_number}</td>
                    <td className="py-4 px-6 text-body text-text-secondary">
                      {inquiry.inquiry_type === 'installation' ? (
                        <span>
                          {inquiry.outdoor_count || 0}+{inquiry.indoor_count || 0}
                        </span>
                      ) : (
                        <span>{inquiry.install_count}대</span>
                      )}
                    </td>
                    {/* 예약일 */}
                    <td className="py-4 px-6">
                      {inquiry.inquiry_type === 'installation' && inquiry.reservation_date ? (
                        <div className="flex items-center gap-1 text-body text-text-primary">
                          <span>{formatReservationDate(inquiry.reservation_date)}</span>
                          <span className="text-text-tertiary text-caption">
                            {getTimeSlotLabel(inquiry.reservation_time_slot)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-tertiary">-</span>
                      )}
                    </td>
                    {/* 서류 - 종류만 텍스트로 표시 (내용 열람 불가) */}
                    <td className="py-4 px-6">
                      {inquiry.documents && Object.keys(inquiry.documents).length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption bg-green-100 text-green-700">
                          <FileText className="w-3.5 h-3.5" />
                          {getDocumentSummary(inquiry.documents)}
                        </span>
                      ) : (
                        <span className="text-text-tertiary text-caption">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-body text-text-primary">{inquiry.marketer_code}</span>
                      {inquiry.canEdit && (
                        <span className="text-action-primary ml-1 text-caption">(나)</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption ${getStatusConfig(inquiry.status).color}/10 ${getStatusConfig(inquiry.status).textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(inquiry.status).color}`} />
                        {getStatusConfig(inquiry.status).label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-body text-text-secondary">{formatFullDate(inquiry.submitted_at)}</td>
                    <td className="py-4 px-6">
                      {inquiry.canEdit ? (
                        <div className="relative">
                          <select
                            value={inquiry.status}
                            onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                            className="w-32 px-3 py-2 bg-bg-primary rounded-button text-caption text-text-primary appearance-none cursor-pointer border border-border focus:outline-none focus:border-action-primary"
                          >
                            <option value="new">신규</option>
                            <option value="in_progress">상담중</option>
                            <option value="contracted">계약완료</option>
                            <option value="cancelled">취소</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                        </div>
                      ) : (
                        <span className="text-caption text-text-tertiary">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-6 border-t border-border">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-button text-text-secondary hover:bg-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-button text-body transition-colors ${
                        page === pageNum
                          ? 'bg-action-primary text-white'
                          : 'text-text-secondary hover:bg-bg-primary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-button text-text-secondary hover:bg-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden">
        {/* 헤더 */}
        <div className="bg-bg-card px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {partnerCodeFilter && (
                <button
                  onClick={() => router.push('/partners/inquiries')}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-title text-text-primary">
                {partnerCodeFilter ? `${partnerCodeFilter} 문의` : '문의 관리'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <SlidersHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 필터 패널 */}
        {isFilterOpen && (
          <div className="bg-bg-card px-6 py-4 border-t border-bg-primary">
            {/* 상태 필터 */}
            <div className="mb-4">
              <p className="text-caption text-text-secondary mb-3">상태</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: '전체' },
                  { value: 'new', label: '신규' },
                  { value: 'in_progress', label: '상담중' },
                  { value: 'contracted', label: '계약완료' },
                  { value: 'cancelled', label: '취소' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-full text-caption transition-colors ${
                      statusFilter === option.value
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 유형 필터 */}
            <div className="mb-4">
              <p className="text-caption text-text-secondary mb-3">유형</p>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTypeFilter(option.value)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-full text-caption transition-colors ${
                      typeFilter === option.value
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-caption text-text-secondary">내 문의만 보기</span>
              <button
                onClick={() => {
                  setOnlyMine(!onlyMine)
                  setPage(1)
                }}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  onlyMine ? 'bg-action-primary' : 'bg-text-tertiary'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    onlyMine ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* 문의 목록 */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-action-primary animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-secondary">문의가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="bg-bg-card rounded-card overflow-hidden"
                >
                  {/* 카드 헤더 (항상 표시) */}
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === inquiry.id ? null : inquiry.id)
                    }
                    className="w-full px-5 py-4 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* 유형 뱃지 */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            inquiry.inquiry_type === 'installation'
                              ? 'bg-action-primary/10 text-action-primary'
                              : 'bg-bg-primary text-text-secondary'
                          }`}>
                            {inquiry.inquiry_type === 'installation' ? '예약' : '상담'}
                          </span>
                          {/* 서류 여부 */}
                          {inquiry.documents && Object.keys(inquiry.documents).length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                              <FileText className="w-3 h-3" />
                              서류
                            </span>
                          )}
                        </div>
                        <p className="text-body text-text-primary truncate">
                          {inquiry.install_location}
                        </p>
                        <p className="text-caption text-text-secondary mt-1">
                          {formatDate(inquiry.submitted_at)}
                          {inquiry.inquiry_type === 'installation' && inquiry.reservation_date && (
                            <span className="ml-2">
                              · 예약 {formatReservationDate(inquiry.reservation_date)} {getTimeSlotLabel(inquiry.reservation_time_slot)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            getStatusConfig(inquiry.status).color
                          }`}
                        />
                        <span className="text-caption text-text-secondary">
                          {getStatusConfig(inquiry.status).label}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* 카드 상세 (펼쳐졌을 때) */}
                  {expandedId === inquiry.id && (
                    <div className="px-5 pb-5 pt-2 bg-bg-primary">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-text-tertiary" />
                          <span className="text-body text-text-primary">
                            {inquiry.phone_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-text-tertiary" />
                          <span className="text-body text-text-primary">
                            {inquiry.install_location}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-text-tertiary" />
                          <span className="text-body text-text-primary">
                            {inquiry.inquiry_type === 'installation' ? (
                              <>야외 {inquiry.outdoor_count || 0}대 / 실내 {inquiry.indoor_count || 0}대</>
                            ) : (
                              <>설치 수량: {inquiry.install_count}대</>
                            )}
                          </span>
                        </div>
                        {/* 예약 정보 */}
                        {inquiry.inquiry_type === 'installation' && inquiry.reservation_date && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-text-tertiary" />
                            <span className="text-body text-text-primary">
                              예약일: {formatReservationDate(inquiry.reservation_date)} {getTimeSlotLabel(inquiry.reservation_time_slot)}
                            </span>
                          </div>
                        )}
                        {/* 주소 */}
                        {inquiry.address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-text-tertiary mt-0.5" />
                            <span className="text-body text-text-primary">
                              {inquiry.address} {inquiry.address_detail}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-text-tertiary" />
                          <span className="text-body text-text-primary">
                            담당: {inquiry.marketer_code}
                            {inquiry.canEdit && (
                              <span className="text-action-primary ml-1">(나)</span>
                            )}
                          </span>
                        </div>
                        {/* 서류 목록 - 종류만 텍스트로 표시 (내용 열람 불가) */}
                        {inquiry.documents && Object.keys(inquiry.documents).length > 0 && (
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-text-tertiary" />
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-caption">
                              {getDocumentSummary(inquiry.documents)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 상태 변경 드롭다운 */}
                      {inquiry.canEdit && (
                        <div className="mt-4 pt-4 border-t border-bg-card">
                          <p className="text-caption text-text-secondary mb-2">
                            상태 변경
                          </p>
                          <div className="relative">
                            <select
                              value={inquiry.status}
                              onChange={(e) =>
                                handleStatusChange(inquiry.id, e.target.value)
                              }
                              className="w-full px-4 py-3 bg-bg-card rounded-button text-body text-text-primary appearance-none cursor-pointer"
                            >
                              <option value="new">신규</option>
                              <option value="in_progress">상담중</option>
                              <option value="contracted">계약완료</option>
                              <option value="cancelled">취소</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 더보기 버튼 */}
          {!isLoading && page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="w-full mt-4 py-4 bg-bg-card rounded-card text-body text-action-primary font-medium"
            >
              더보기
            </button>
          )}
        </div>

        {/* 검색 오버레이 */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-overlay"
              onClick={() => setIsSearchOpen(false)}
            />
            <div className="absolute top-0 left-0 right-0 bg-bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="전화번호, 설치위치 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-bg-primary rounded-input text-body text-text-primary placeholder:text-text-tertiary"
                  />
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setIsSearchOpen(false)
                  }}
                  className="text-text-secondary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </PartnerLayout>
  )
}

export default function InquiriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 text-action-primary animate-spin" />
      </div>
    }>
      <InquiriesContent />
    </Suspense>
  )
}
