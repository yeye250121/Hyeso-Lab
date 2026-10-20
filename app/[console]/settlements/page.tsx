'use client'

import { useEffect, useState, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { Upload, FileText, Trash2, Download, X, Search } from 'lucide-react'

interface Settlement {
  id: number
  partnerCode: string
  partnerNickname: string
  settlementDate: string
  fileName: string
  filePath: string
  createdAt: string
}

interface Partner {
  uniqueCode: string
  nickname: string
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Upload form states
  const [partnerSearch, setPartnerSearch] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const partnerSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Close partner dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (partnerSearchRef.current && !partnerSearchRef.current.contains(e.target as Node)) {
        setShowPartnerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      const [settlementsRes, partnersRes] = await Promise.all([
        api.get('/admin/settlements'),
        api.get('/admin/partners'),
      ])
      setSettlements(settlementsRes.data.settlements)
      setPartners(partnersRes.data.partners.map((p: any) => ({
        uniqueCode: p.uniqueCode,
        nickname: p.nickname,
      })))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPartners = partners.filter(
    (p) =>
      p.uniqueCode.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.nickname.toLowerCase().includes(partnerSearch.toLowerCase())
  )

  const handleSelectPartner = (partner: Partner) => {
    setSelectedPartner(partner)
    setPartnerSearch(`${partner.uniqueCode} - ${partner.nickname}`)
    setShowPartnerDropdown(false)
  }

  const handleUpload = async () => {
    if (!selectedPartner || !selectedDate || !selectedFile) {
      setUploadError('모든 항목을 입력해주세요')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('partnerCode', selectedPartner.uniqueCode)
      formData.append('settlementDate', selectedDate)

      await api.post('/admin/settlements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setShowUploadModal(false)
      resetUploadForm()
      fetchData()
    } catch (err: any) {
      setUploadError(err.response?.data?.error || '업로드에 실패했습니다')
    } finally {
      setIsUploading(false)
    }
  }

  const resetUploadForm = () => {
    setSelectedPartner(null)
    setPartnerSearch('')
    setSelectedDate('')
    setSelectedFile(null)
    setUploadError('')
  }

  const handleDelete = async (settlementId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/admin/settlements/${settlementId}`)
      fetchData()
    } catch (error) {
      console.error('Failed to delete settlement:', error)
      alert('삭제에 실패했습니다')
    }
  }

  const handleDownload = async (settlement: Settlement) => {
    try {
      const response = await api.get(`/admin/settlements/${settlement.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', settlement.fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download:', error)
      alert('다운로드에 실패했습니다')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-headline text-text-primary">정산서 관리</h1>
          <button
            onClick={() => {
              resetUploadForm()
              setShowUploadModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-action-primary text-white rounded-button text-body hover:bg-action-primary/90 transition-colors"
          >
            <Upload className="w-5 h-5" />
            정산서 업로드
          </button>
        </div>

        {/* Settlements List */}
        <div className="bg-bg-card rounded-card overflow-hidden">
          {settlements.length > 0 ? (
            <div className="divide-y divide-border">
              {settlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-action-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-action-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-body text-action-primary font-medium">
                          {settlement.partnerCode}
                        </span>
                        <span className="text-body text-text-primary">
                          {settlement.partnerNickname}
                        </span>
                        <span className="text-small text-text-tertiary">
                          {formatDate(settlement.settlementDate)}
                        </span>
                      </div>
                      <p className="text-small text-text-secondary truncate">
                        {settlement.fileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(settlement)}
                      className="p-2 text-text-secondary hover:text-action-primary transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(settlement.id)}
                      className="p-2 text-text-secondary hover:text-error transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-text-secondary text-center py-8">
              정산서가 없습니다
            </p>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative bg-bg-card rounded-card p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-title text-text-primary">정산서 업로드</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Partner Search */}
              <div ref={partnerSearchRef} className="relative">
                <label className="block text-small text-text-secondary mb-2">
                  파트너 선택
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => {
                      setPartnerSearch(e.target.value)
                      setSelectedPartner(null)
                      setShowPartnerDropdown(true)
                    }}
                    onFocus={() => setShowPartnerDropdown(true)}
                    className="w-full pl-12 pr-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary"
                    placeholder="코드 또는 이름으로 검색"
                  />
                </div>
                {showPartnerDropdown && filteredPartners.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-bg-card rounded-button shadow-lg max-h-48 overflow-y-auto">
                    {filteredPartners.map((partner) => (
                      <button
                        key={partner.uniqueCode}
                        onClick={() => handleSelectPartner(partner)}
                        className="w-full px-4 py-3 text-left text-body hover:bg-bg-primary transition-colors"
                      >
                        <span className="text-action-primary">{partner.uniqueCode}</span>
                        <span className="text-text-primary ml-2">{partner.nickname}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settlement Date */}
              <div>
                <label className="block text-small text-text-secondary mb-2">
                  정산일
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary focus:ring-2 focus:ring-action-primary"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-small text-text-secondary mb-2">
                  정산서를 업로드해주세요
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-secondary text-left hover:text-text-primary transition-colors"
                >
                  {selectedFile ? selectedFile.name : 'PDF 또는 이미지 파일 선택'}
                </button>
              </div>

              {uploadError && (
                <p className="text-small text-error text-center">{uploadError}</p>
              )}

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-4 bg-action-primary text-white rounded-button text-body font-medium hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
