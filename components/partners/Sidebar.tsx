'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  BookOpen,
  User,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/lib/partners/store'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/shared/ThemeToggle'

const LOGO_URL = 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_logo'

const menuItems = [
  { href: '/partners/home', label: '홈', icon: Home },
  { href: '/partners/inquiries', label: '문의 관리', icon: FileText },
  { href: '/partners/guides', label: '가이드', icon: BookOpen },
  { href: '/partners/my', label: '마이페이지', icon: User },
]

interface SidebarProps {
  isMobile?: boolean
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/partners/login')
  }

  return (
    <aside className={`${isMobile ? 'h-full w-full' : 'fixed left-0 top-0 h-full w-64'} bg-bg-card border-r border-border flex flex-col`}>
      {/* 로고 */}
      <div className="p-6 border-b border-border">
        <Link href="/partners/home">
          <Image src={LOGO_URL} alt="Piooom" width={100} height={28} className="h-7 w-auto dark:brightness-0 dark:invert" />
        </Link>
        <p className="text-small text-text-secondary mt-2">
          {user?.nickname || '파트너'}
        </p>
        <p className="text-caption text-text-tertiary">
          {user?.uniqueCode}
        </p>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-button transition-colors ${
                    isActive
                      ? 'bg-action-primary text-white'
                      : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-body">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단: 테마 토글 + 로그아웃 */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-small text-text-secondary">테마</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-button text-text-secondary hover:bg-bg-primary hover:text-error transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-body">로그아웃</span>
        </button>
      </div>
    </aside>
  )
}
