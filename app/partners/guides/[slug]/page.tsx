'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/partners/store'
import api from '@/lib/partners/api'
import PartnerLayout from '@/components/partners/PartnerLayout'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Guide {
  id: number
  title: string
  slug: string
  content: string
  createdAt: string
  updatedAt: string
}

export default function GuideDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated } = useAuthStore()

  const [guide, setGuide] = useState<Guide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null)

  // 전체화면 닫기 함수
  const closeFullscreen = useCallback(() => {
    setFullscreenSrc(null)
  }, [])

  // ESC 키로 전체화면 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenSrc) {
        closeFullscreen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenSrc, closeFullscreen])

  // 전체화면 버튼 추가 함수
  const addFullscreenButtons = useCallback(() => {
    // 모든 Google Slides iframe 찾기
    const iframes = document.querySelectorAll('iframe[src*="docs.google.com/presentation"]')

    iframes.forEach((iframe) => {
      const wrapper = iframe.parentElement
      if (!wrapper) return

      // wrapper에 필요한 클래스 추가
      if (!wrapper.classList.contains('google-slides-wrapper')) {
        wrapper.classList.add('google-slides-wrapper')
      }

      // 이미 버튼이 있으면 스킵
      if (wrapper.querySelector('.slides-fullscreen-btn')) return

      // data-slides-src 속성 추가 (없으면)
      if (!wrapper.getAttribute('data-slides-src')) {
        wrapper.setAttribute('data-slides-src', iframe.getAttribute('src') || '')
      }

      // 전체화면 버튼 생성
      const btn = document.createElement('button')
      btn.className = 'slides-fullscreen-btn'
      btn.type = 'button'
      btn.title = '전체화면으로 보기'
      btn.textContent = '전체화면'
      wrapper.appendChild(btn)
    })
  }, [])

  // Google Slides에 전체화면 버튼 동적 추가
  useEffect(() => {
    if (!guide) return

    // 약간의 딜레이 후 실행 (DOM 렌더링 완료 대기)
    const timer = setTimeout(addFullscreenButtons, 100)

    return () => clearTimeout(timer)
  }, [guide, addFullscreenButtons])

  // 전체화면 닫힐 때 버튼 다시 확인
  useEffect(() => {
    if (fullscreenSrc === null && guide) {
      // 전체화면 닫힌 후 버튼 다시 확인
      setTimeout(addFullscreenButtons, 50)
    }
  }, [fullscreenSrc, guide, addFullscreenButtons])

  // 클릭 이벤트 핸들러
  useEffect(() => {
    const handleFullscreenClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('slides-fullscreen-btn')) {
        const wrapper = target.closest('.google-slides-wrapper') || target.parentElement
        const src = wrapper?.getAttribute('data-slides-src') ||
                    wrapper?.querySelector('iframe')?.getAttribute('src')
        if (src) {
          setFullscreenSrc(src)
        }
      }
    }

    document.addEventListener('click', handleFullscreenClick)
    return () => document.removeEventListener('click', handleFullscreenClick)
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/partners/login')
      return
    }
    fetchGuide()
  }, [params.slug])

  const fetchGuide = async () => {
    try {
      const response = await api.get(`/guides/${params.slug}`)
      setGuide(response.data.guide)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('가이드를 찾을 수 없습니다')
      } else {
        setError('가이드를 불러오는데 실패했습니다')
      }
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
      <PartnerLayout title="교육자료" showBackButton onBack={() => router.push('/partners/guides')}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-action-primary animate-spin" />
        </div>
      </PartnerLayout>
    )
  }

  if (error || !guide) {
    return (
      <PartnerLayout title="교육자료" showBackButton onBack={() => router.push('/partners/guides')}>
        <div className="p-4 lg:p-0">
          <div className="bg-bg-card rounded-card p-8 text-center">
            <p className="text-body text-text-secondary">{error || '가이드를 찾을 수 없습니다'}</p>
            <button
              onClick={() => router.push('/partners/guides')}
              className="mt-4 px-4 py-2 bg-action-primary text-white rounded-button text-body"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </PartnerLayout>
    )
  }

  return (
    <PartnerLayout title={guide.title} showBackButton onBack={() => router.push('/partners/guides')}>
      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:block">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push('/partners/guides')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>가이드 목록</span>
        </button>

        {/* 콘텐츠 */}
        <div className="bg-bg-card rounded-card p-8 max-w-4xl">
          <div className="mb-6 pb-6 border-b border-border">
            <h1 className="text-2xl font-bold text-text-primary mb-3">{guide.title}</h1>
            <p className="text-caption text-text-tertiary">
              최종 수정: {formatDate(guide.updatedAt)}
            </p>
          </div>

          {/* TipTap content rendering */}
          <div
            className="tiptap-content prose prose-lg max-w-none text-text-primary"
            dangerouslySetInnerHTML={{ __html: guide.content }}
          />
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="bg-bg-card px-4 py-4 flex items-center gap-3 sticky top-14 z-10">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-title text-text-primary truncate flex-1">{guide.title}</h1>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="bg-bg-card rounded-card p-6">
            <div className="mb-4 pb-4 border-b border-border">
              <h2 className="text-heading text-text-primary mb-2">{guide.title}</h2>
              <p className="text-small text-text-tertiary">
                최종 수정: {formatDate(guide.updatedAt)}
              </p>
            </div>

            {/* TipTap content rendering */}
            <div
              className="tiptap-content prose prose-sm max-w-none text-text-primary"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />
          </div>
        </div>
      </div>

      {/* 전체화면 모달 */}
      {fullscreenSrc && (
        <div className="slides-fullscreen-modal" onClick={closeFullscreen}>
          <button
            className="slides-fullscreen-close"
            onClick={closeFullscreen}
            aria-label="닫기"
          />
          <iframe
            src={fullscreenSrc}
            allowFullScreen
            onClick={(e) => e.stopPropagation()}
          />
          <p className="slides-fullscreen-hint">ESC 또는 바깥 영역을 클릭하여 닫기</p>
        </div>
      )}

      {/* Styles for TipTap content */}
      <style jsx global>{`
        .tiptap-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }
        .tiptap-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .tiptap-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .tiptap-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
          min-height: 1.5em;
        }
        .tiptap-content ul, .tiptap-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .tiptap-content ul {
          list-style-type: disc;
        }
        .tiptap-content ol {
          list-style-type: decimal;
        }
        .tiptap-content li {
          margin-bottom: 0.25rem;
        }
        .tiptap-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .tiptap-content strong {
          font-weight: 600;
        }
        .tiptap-content em {
          font-style: italic;
        }
        @media (min-width: 1024px) {
          .tiptap-content h1 {
            font-size: 1.875rem;
          }
          .tiptap-content h2 {
            font-size: 1.5rem;
          }
          .tiptap-content h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </PartnerLayout>
  )
}
