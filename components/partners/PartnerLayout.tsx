'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/lib/partners/store'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { Menu, X } from 'lucide-react'

const LOGO_URL = 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_logo'

interface PartnerLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
}

export default function PartnerLayout({
  children,
  title,
  showBackButton,
  onBack
}: PartnerLayoutProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/partners/login')
    } else {
      setIsChecking(false)
    }
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 데스크탑 사이드바 */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* 모바일 헤더 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-bg-card border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={onBack || (() => router.back())}
              className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {title ? (
            <h1 className="text-title text-text-primary">{title}</h1>
          ) : (
            <Link href="/partners/home">
              <Image src={LOGO_URL} alt="Piooom" width={80} height={24} className="h-6 w-auto dark:brightness-0 dark:invert" />
            </Link>
          )}
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-text-secondary"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 모바일 메뉴 오버레이 (오른쪽에서 열림) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-bg-card animate-slide-left shadow-xl">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="lg:p-8">{children}</div>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
