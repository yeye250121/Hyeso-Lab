'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  BookOpen,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/lib/admin/store'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/shared/ThemeToggle'

const LOGO_URL = 'https://yknptcjxrizgccxczzuy.supabase.co/storage/v1/object/public/Benefit-lab/Benefit-lab_logo_v0.png'

const menuItems = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/partners', label: '파트너 관리', icon: Users },
  { href: '/admin/inquiries', label: '문의 관리', icon: FileText },
  { href: '/admin/settlements', label: '정산서 관리', icon: Receipt },
  { href: '/admin/guides', label: '가이드 관리', icon: BookOpen },
]

interface SidebarProps {
  isMobile?: boolean
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  return (
    <aside className={`${isMobile ? 'h-full w-full' : 'fixed left-0 top-0 h-full w-64'} bg-bg-card border-r border-border flex flex-col`}>
      {/* 로고 */}
      <div className="p-6 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Image src={LOGO_URL} alt="혜택 연구소" width={100} height={28} className="h-7 w-auto dark:brightness-0 dark:invert" />
          <span className="text-title text-text-primary">Admin</span>
        </Link>
        <p className="text-small text-text-secondary mt-2">
          {admin?.nickname || admin?.loginId}
        </p>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
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
