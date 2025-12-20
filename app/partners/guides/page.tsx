'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/partners/store'
import api from '@/lib/partners/api'
import PartnerLayout from '@/components/partners/PartnerLayout'
import { BookOpen, ChevronRight, Loader2, Search } from 'lucide-react'

interface Guide {
  id: number
  title: string
  slug: string
  createdAt: string
  updatedAt: string
}

export default function GuidesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const [guides, setGuides] = useState<Guide[]>([])
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/partners/login')
      return
    }
    fetchGuides()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredGuides(
        guides.filter((guide) =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredGuides(guides)
    }
  }, [searchQuery, guides])

  const fetchGuides = async () => {
    try {
      const response = await api.get('/guides')
      setGuides(response.data.guides)
      setFilteredGuides(response.data.guides)
    } catch (error) {
      console.error('Failed to fetch guides:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <PartnerLayout title="가이드">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-action-primary animate-spin" />
        </div>
      </PartnerLayout>
    )
  }

  return (
    <PartnerLayout title="가이드">
      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:block">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">교육자료</h1>
            <p className="text-text-secondary mt-1">피움 파트너를 위한 교육 가이드입니다</p>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="가이드 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-12 pr-4 py-3 bg-bg-card border border-border rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-action-primary"
            />
          </div>
        </div>

        {/* 가이드 목록 */}
        {filteredGuides.length === 0 ? (
          <div className="bg-bg-card rounded-card p-12 text-center">
            <BookOpen className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-body text-text-secondary">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 교육자료가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <button
                key={guide.id}
                onClick={() => router.push(`/partners/guides/${guide.slug}`)}
                className="bg-bg-card rounded-card p-6 text-left hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-action-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-action-primary/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-action-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary font-medium line-clamp-2 mb-2">
                      {guide.title}
                    </p>
                    <p className="text-caption text-text-tertiary">
                      {formatDate(guide.updatedAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0 group-hover:text-action-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="bg-bg-card px-6 py-6">
          <h1 className="text-heading text-text-primary">교육자료</h1>
          <p className="text-body text-text-secondary mt-1">
            피움 파트너를 위한 교육 가이드입니다
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {guides.length === 0 ? (
            <div className="bg-bg-card rounded-card p-8 text-center">
              <BookOpen className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-body text-text-secondary">등록된 교육자료가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => router.push(`/partners/guides/${guide.slug}`)}
                  className="w-full bg-bg-card rounded-card p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-action-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-action-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body text-text-primary font-medium truncate">
                        {guide.title}
                      </p>
                      <p className="text-small text-text-tertiary">
                        {formatDate(guide.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PartnerLayout>
  )
}
