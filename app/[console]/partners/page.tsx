'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { Search, ChevronDown, ChevronUp, Eye, EyeOff, Trash2, Phone, CreditCard } from 'lucide-react'

interface Partner {
  id: string
  loginId: string
  nickname: string
  uniqueCode: string
  level: number
  createdAt: string
  inquiryCount: number
  phone?: string | null
  bankName?: string | null
  accountNumber?: string | null
  accountHolder?: string | null
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const response = await api.get('/admin/partners')
      setPartners(response.data.partners)
    } catch (error) {
      console.error('Failed to fetch partners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVisibility = (id: string) => {
    setVisibleIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const maskText = (text: string) => {
    return '*'.repeat(Math.min(text.length, 8))
  }

  const handleDelete = async (partnerId: string) => {
    try {
      await api.delete(`/admin/partners/${partnerId}`)
      setPartners((prev) => prev.filter((p) => p.id !== partnerId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete partner:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const filteredPartners = partners.filter(
    (partner) =>
      partner.loginId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'S코드 (관리자)'
    return `레벨 ${level}`
  }

  const getLevelColor = (level: number) => {
    if (level === 0) return 'bg-purple-100 text-purple-700'
    if (level === 1) return 'bg-blue-100 text-blue-700'
    if (level === 2) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-600'
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
        <h1 className="text-headline text-text-primary">파트너 관리</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 아이디, 코드로 검색"
            className="w-full pl-12 pr-4 py-3 bg-bg-card rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary"
          />
        </div>

        {/* Partners List - Desktop */}
        <div className="hidden lg:block bg-bg-card rounded-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">코드</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">아이디</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">닉네임</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">전화번호</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">정산계좌</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">레벨</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">문의 수</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">가입일</th>
                <th className="text-left py-4 px-6 text-small text-text-secondary font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="border-b border-border last:border-0">
                  <td className="py-4 px-6 text-body text-action-primary font-medium">{partner.uniqueCode}</td>
                  <td className="py-4 px-6 text-body text-text-primary">
                    <div className="flex items-center gap-2">
                      <span>{visibleIds.has(partner.id) ? partner.loginId : maskText(partner.loginId)}</span>
                      <button
                        onClick={() => toggleVisibility(partner.id)}
                        className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
                      >
                        {visibleIds.has(partner.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-body text-text-primary">
                    {visibleIds.has(partner.id) ? partner.nickname : maskText(partner.nickname)}
                  </td>
                  <td className="py-4 px-6 text-body text-text-secondary">
                    {partner.phone ? (
                      visibleIds.has(partner.id) ? partner.phone : maskText(partner.phone)
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-body text-text-secondary">
                    {partner.bankName && partner.accountNumber ? (
                      visibleIds.has(partner.id) ? (
                        <div className="text-small">
                          <div>{partner.bankName}</div>
                          <div className="text-text-tertiary">{partner.accountNumber}</div>
                          {partner.accountHolder && <div className="text-text-tertiary">{partner.accountHolder}</div>}
                        </div>
                      ) : (
                        maskText(partner.accountNumber)
                      )
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-2 py-1 rounded-full text-small ${getLevelColor(partner.level)}`}>
                      {getLevelLabel(partner.level)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-body text-text-secondary">{partner.inquiryCount}</td>
                  <td className="py-4 px-6 text-body text-text-tertiary">
                    {new Date(partner.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setDeleteConfirm(partner.id)}
                      className="p-2 text-text-tertiary hover:text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPartners.length === 0 && (
            <p className="text-body text-text-secondary text-center py-8">
              파트너가 없습니다
            </p>
          )}
        </div>

        {/* Partners List - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredPartners.map((partner) => (
            <div key={partner.id} className="bg-bg-card rounded-card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === partner.id ? null : partner.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-body text-action-primary font-medium">{partner.uniqueCode}</span>
                    <span className="text-body text-text-primary">
                      {visibleIds.has(partner.id) ? partner.nickname : maskText(partner.nickname)}
                    </span>
                  </div>
                  <p className="text-small text-text-secondary mt-1">
                    {visibleIds.has(partner.id) ? partner.loginId : maskText(partner.loginId)}
                  </p>
                </div>
                {expandedId === partner.id ? (
                  <ChevronUp className="w-5 h-5 text-text-tertiary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-tertiary" />
                )}
              </button>

              {expandedId === partner.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-3 text-small">
                    <div>
                      <span className="text-text-tertiary">레벨</span>
                      <p className="mt-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-small ${getLevelColor(partner.level)}`}>
                          {getLevelLabel(partner.level)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">문의 수</span>
                      <p className="text-text-primary">{partner.inquiryCount}</p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">가입일</span>
                      <p className="text-text-primary">
                        {new Date(partner.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">전화번호</span>
                      <p className="text-text-primary">
                        {partner.phone ? (
                          visibleIds.has(partner.id) ? partner.phone : maskText(partner.phone)
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                  {/* 정산계좌 정보 */}
                  <div className="text-small">
                    <span className="text-text-tertiary">정산계좌</span>
                    {partner.bankName && partner.accountNumber ? (
                      visibleIds.has(partner.id) ? (
                        <p className="text-text-primary mt-1">
                          {partner.bankName} {partner.accountNumber}
                          {partner.accountHolder && ` (${partner.accountHolder})`}
                        </p>
                      ) : (
                        <p className="text-text-primary mt-1">{maskText(partner.accountNumber)}</p>
                      )
                    ) : (
                      <p className="text-text-tertiary mt-1">미등록</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(partner.id)
                      }}
                      className="flex-1 py-2 bg-bg-primary text-text-primary rounded-button text-small hover:bg-border transition-colors flex items-center justify-center gap-2"
                    >
                      {visibleIds.has(partner.id) ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          숨기기
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          보기
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(partner.id)
                      }}
                      className="flex-1 py-2 bg-error/10 text-error rounded-button text-small hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredPartners.length === 0 && (
            <div className="bg-bg-card rounded-card p-8 text-center">
              <p className="text-body text-text-secondary">파트너가 없습니다</p>
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
            <h2 className="text-title text-text-primary mb-2">파트너 삭제</h2>
            <p className="text-body text-text-secondary mb-6">
              정말 이 파트너를 삭제하시겠습니까?<br />
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
    </AdminLayout>
  )
}
