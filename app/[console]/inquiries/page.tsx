'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Clock,
  Eye,
  Download,
} from 'lucide-react'

interface Inquiry {
  id: string
  phone: string
  installLocation: string | null
  installCount: number | null
  marketerCode: string
  status: string
  submittedAt: string
  // 예약 관련 필드
  inquiryType: 'consultation' | 'installation'
  reservationDate: string | null
  reservationTimeSlot: 'morning' | 'afternoon' | null
  outdoorCount: number | null
  indoorCount: number | null
  address: string | null
  addressDetail: string | null
  documents: Record<string, string> | null
  documentsSubmitted: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'in_progress', label: '상담중' },
  { value: 'contracted', label: '계약완료' },
  { value: 'cancelled', label: '취소' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'installation', label: '설치예약' },
  { value: 'consultation', label: '상담신청' },
]

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean
    documents: Record<string, string>
    inquiryId: string
  } | null>(null)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const response = await api.get(`/admin/inquiries?${params}`)
      setInquiries(response.data.inquiries)
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      await api.put(`/admin/inquiries/${inquiryId}`, { status: newStatus })
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
        )
      )
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('상태 변경에 실패했습니다')
    }
  }

  const handleDelete = async (inquiryId: string) => {
    try {
      await api.delete(`/admin/inquiries/${inquiryId}`)
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete inquiry:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.phone.includes(searchQuery) ||
      inquiry.marketerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inquiry.installLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (inquiry.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesType = typeFilter === 'all' || inquiry.inquiryType === typeFilter

    return matchesSearch && matchesType
  })

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: '신규',
      in_progress: '상담중',
      contracted: '계약완료',
      cancelled: '취소',
    }
    return labels[status] || status
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-action-primary/10 text-action-primary',
      in_progress: 'bg-yellow-100 text-yellow-700',
      contracted: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-500',
    }
    return colors[status] || 'bg-gray-100 text-gray-500'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  const formatReservationDate = (dateStr: string | null, timeSlot: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const time = timeSlot === 'morning' ? '오전' : '오후'
    return `${month}/${day} ${time}`
  }

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      idCard: '신분증',
      paymentCard: '결제수단',
      businessLicense: '사업자등록증',
    }
    return labels[type] || type
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // 직접 다운로드 실패시 새 탭에서 열기
      window.open(url, '_blank')
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-headline text-text-primary">문의 관리</h1>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="연락처, 설치장소, 담당자 코드로 검색"
              className="w-full pl-12 pr-4 py-3 bg-bg-card rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-card rounded-button text-body text-text-secondary hover:text-text-primary transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="sm:hidden">필터</span>
            <span className="hidden sm:inline">필터</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-bg-card rounded-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-small text-text-secondary">필터</span>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 상태 필터 */}
            <div>
              <span className="text-caption text-text-tertiary block mb-2">상태</span>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-4 py-2 rounded-full text-small transition-colors ${
                      statusFilter === option.value
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 유형 필터 */}
            <div>
              <span className="text-caption text-text-tertiary block mb-2">신청 유형</span>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTypeFilter(option.value)}
                    className={`px-4 py-2 rounded-full text-small transition-colors ${
                      typeFilter === option.value
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inquiries List - Desktop */}
        <div className="hidden lg:block bg-bg-card rounded-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">유형</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">연락처</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">설치장소</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">예약일</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">설치대수</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">서류</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">담당자</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">상태</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">신청일</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-border last:border-0">
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-small ${
                        inquiry.inquiryType === 'installation'
                          ? 'bg-action-primary/10 text-action-primary'
                          : 'bg-status-progress/10 text-status-progress'
                      }`}
                    >
                      {inquiry.inquiryType === 'installation' ? (
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
                  <td className="py-4 px-6 text-body text-text-primary">{inquiry.phone}</td>
                  <td className="py-4 px-6 text-body text-text-secondary max-w-[200px] truncate">
                    {inquiry.address || inquiry.installLocation || '-'}
                  </td>
                  <td className="py-4 px-6 text-body text-text-secondary">
                    {inquiry.inquiryType === 'installation'
                      ? formatReservationDate(inquiry.reservationDate, inquiry.reservationTimeSlot)
                      : '-'}
                  </td>
                  <td className="py-4 px-6 text-body text-text-secondary">
                    {inquiry.inquiryType === 'installation' ? (
                      <span>
                        실외 {inquiry.outdoorCount || 0} / 실내 {inquiry.indoorCount || 0}
                      </span>
                    ) : (
                      inquiry.installCount || '-'
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {inquiry.documentsSubmitted && inquiry.documents ? (
                      <button
                        onClick={() => setDocumentModal({
                          isOpen: true,
                          documents: inquiry.documents!,
                          inquiryId: inquiry.id
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-small hover:bg-green-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {Object.keys(inquiry.documents).length}건 확인
                      </button>
                    ) : (
                      <span className="text-text-tertiary text-small">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-body text-action-primary">{inquiry.marketerCode}</span>
                  </td>
                  <td className="py-4 px-6">
                    {/* 상태 드롭다운 - 통일된 스타일 */}
                    <div className="relative">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                        className="w-28 px-3 py-1.5 bg-bg-primary rounded-lg text-small text-text-primary appearance-none cursor-pointer border border-border focus:outline-none focus:border-action-primary hover:bg-bg-primary/80 transition-colors"
                      >
                        <option value="new">신규</option>
                        <option value="in_progress">상담중</option>
                        <option value="contracted">계약완료</option>
                        <option value="cancelled">취소</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                    </div>
                  </td>
                  <td className="py-4 px-6 text-body text-text-tertiary">
                    {formatDate(inquiry.submittedAt)}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setDeleteConfirm(inquiry.id)}
                      className="p-2 text-text-tertiary hover:text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInquiries.length === 0 && (
            <p className="text-body text-text-secondary text-center py-8">
              문의가 없습니다
            </p>
          )}
        </div>

        {/* Inquiries List - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredInquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-bg-card rounded-card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* 유형 뱃지 */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-small ${
                        inquiry.inquiryType === 'installation'
                          ? 'bg-action-primary/10 text-action-primary'
                          : 'bg-status-progress/10 text-status-progress'
                      }`}
                    >
                      {inquiry.inquiryType === 'installation' ? '예약' : '상담'}
                    </span>
                    <span className="text-body text-text-primary font-medium">{inquiry.phone}</span>
                    <span className={`px-2 py-0.5 rounded-full text-small ${getStatusBadgeColor(inquiry.status)}`}>
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-small text-text-secondary">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{inquiry.address || inquiry.installLocation || '-'}</span>
                  </div>
                  {inquiry.inquiryType === 'installation' && inquiry.reservationDate && (
                    <div className="flex items-center gap-2 text-small text-action-primary mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatReservationDate(inquiry.reservationDate, inquiry.reservationTimeSlot)}</span>
                    </div>
                  )}
                </div>
                {expandedId === inquiry.id ? (
                  <ChevronUp className="w-5 h-5 text-text-tertiary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-tertiary" />
                )}
              </button>

              {expandedId === inquiry.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-3 text-small">
                    <div>
                      <span className="text-text-tertiary">담당자 코드</span>
                      <p className="text-action-primary">{inquiry.marketerCode}</p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">신청일</span>
                      <p className="text-text-primary">{formatDate(inquiry.submittedAt)}</p>
                    </div>
                    {inquiry.inquiryType === 'installation' ? (
                      <>
                        <div>
                          <span className="text-text-tertiary">실외 설치</span>
                          <p className="text-text-primary">{inquiry.outdoorCount || 0}대</p>
                        </div>
                        <div>
                          <span className="text-text-tertiary">실내 설치</span>
                          <p className="text-text-primary">{inquiry.indoorCount || 0}대</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <span className="text-text-tertiary">설치대수</span>
                        <p className="text-text-primary">{inquiry.installCount || '-'}</p>
                      </div>
                    )}
                  </div>

                  {/* 서류 목록 - 토글 미리보기 */}
                  {inquiry.documentsSubmitted && inquiry.documents && (
                    <div className="pt-2">
                      <span className="text-small text-text-tertiary block mb-2">첨부 서류</span>
                      <div className="space-y-2">
                        {Object.entries(inquiry.documents).map(([type, url]) => {
                          const isPdf = url.toLowerCase().includes('.pdf')
                          const docKey = `${inquiry.id}-${type}`
                          const isExpanded = expandedDocs.has(docKey)

                          const toggleExpand = () => {
                            setExpandedDocs(prev => {
                              const newSet = new Set(prev)
                              if (newSet.has(docKey)) {
                                newSet.delete(docKey)
                              } else {
                                newSet.add(docKey)
                              }
                              return newSet
                            })
                          }

                          return (
                            <div
                              key={type}
                              className="bg-bg-primary rounded-lg overflow-hidden"
                            >
                              {/* 서류 헤더 */}
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-small text-text-primary font-medium">{getDocumentLabel(type)}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={toggleExpand}
                                    className="flex items-center gap-1 px-2 py-1 text-action-primary hover:bg-action-primary/10 rounded transition-colors text-small"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {isExpanded ? '접기' : '미리보기'}
                                  </button>
                                  <button
                                    onClick={() => handleDownload(url, `${getDocumentLabel(type)}.jpg`)}
                                    className="flex items-center gap-1 px-2 py-1 text-action-primary hover:bg-action-primary/10 rounded transition-colors text-small"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    저장
                                  </button>
                                </div>
                              </div>
                              {/* 미리보기 - 토글 */}
                              {isExpanded && (
                                <div className="px-2 pb-2">
                                  {isPdf ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 py-6 bg-white rounded-lg text-action-primary"
                                    >
                                      <FileText className="w-8 h-8" />
                                      <span className="text-small">PDF 열기</span>
                                    </a>
                                  ) : (
                                    <img
                                      src={url}
                                      alt={getDocumentLabel(type)}
                                      className="w-full h-auto rounded-lg bg-white"
                                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="text-small text-text-tertiary mb-1 block">상태 변경</label>
                    <div className="relative">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                        className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary appearance-none cursor-pointer border border-border focus:outline-none focus:border-action-primary"
                      >
                        <option value="new">신규</option>
                        <option value="in_progress">상담중</option>
                        <option value="contracted">계약완료</option>
                        <option value="cancelled">취소</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(inquiry.id)
                    }}
                    className="w-full py-2 bg-error/10 text-error rounded-button text-small hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredInquiries.length === 0 && (
            <div className="bg-bg-card rounded-card p-8 text-center">
              <p className="text-body text-text-secondary">문의가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-bg-card rounded-card p-6 w-full max-w-sm animate-scale-in">
            <h2 className="text-title text-text-primary mb-2">문의 삭제</h2>
            <p className="text-body text-text-secondary mb-6">
              정말 이 문의를 삭제하시겠습니까?<br />
              삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-bg-primary text-text-primary rounded-button text-body hover:bg-border transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 bg-error text-white rounded-button text-body hover:bg-error/90 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal - 토글 미리보기 버전 */}
      {documentModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setDocumentModal(null)
              setExpandedDocs(new Set())
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">첨부 서류 확인</h2>
              <button
                onClick={() => {
                  setDocumentModal(null)
                  setExpandedDocs(new Set())
                }}
                className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-primary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 컨텐츠 */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-3">
                {Object.entries(documentModal.documents).map(([type, url]) => {
                  const isPdf = url.toLowerCase().includes('.pdf')
                  const filename = `${getDocumentLabel(type)}_${documentModal.inquiryId}.${isPdf ? 'pdf' : 'jpg'}`
                  const isExpanded = expandedDocs.has(type)

                  const toggleExpand = () => {
                    setExpandedDocs(prev => {
                      const newSet = new Set(prev)
                      if (newSet.has(type)) {
                        newSet.delete(type)
                      } else {
                        newSet.add(type)
                      }
                      return newSet
                    })
                  }

                  return (
                    <div key={type} className="rounded-xl overflow-hidden border border-border">
                      {/* 서류 헤더 - 클릭하면 토글 */}
                      <div className="flex items-center justify-between p-4 bg-bg-card">
                        <button
                          onClick={toggleExpand}
                          className="flex items-center gap-2 flex-1"
                        >
                          <FileText className="w-5 h-5 text-action-primary" />
                          <span className="font-medium text-text-primary">{getDocumentLabel(type)}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-text-tertiary ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-text-tertiary ml-2" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleExpand}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? '접기' : '미리보기'}
                          </button>
                          <button
                            onClick={() => handleDownload(url, filename)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-action-primary text-white rounded-lg hover:bg-action-primary/90 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            다운로드
                          </button>
                        </div>
                      </div>

                      {/* 서류 미리보기 - 토글 */}
                      {isExpanded && (
                        <div className="p-4 bg-bg-primary border-t border-border">
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-lg">
                              <FileText className="w-12 h-12 text-text-tertiary mb-3" />
                              <p className="text-text-secondary mb-3 text-sm">PDF 파일입니다</p>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-primary/90 transition-colors text-sm"
                              >
                                PDF 열기
                              </a>
                            </div>
                          ) : (
                            <div className="relative bg-white rounded-lg p-2">
                              <img
                                src={url}
                                alt={getDocumentLabel(type)}
                                className="w-full h-auto rounded-lg"
                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-5 border-t border-border bg-bg-card">
              <button
                onClick={() => {
                  setDocumentModal(null)
                  setExpandedDocs(new Set())
                }}
                className="w-full py-3 bg-bg-primary text-text-primary rounded-button text-body hover:bg-border transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
