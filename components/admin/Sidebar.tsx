'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Package,
  PhoneCall,
  CreditCard,
  MessageCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/admin/api'
import Avatar from '@/components/admin/Avatar'
import { CHAT_READ_EVENT, getLastRead } from '@/lib/admin/chatRead'
import { useAuthStore } from '@/lib/admin/store'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/shared/ThemeToggle'

const LOGO_URL = 'https://yknptcjxrizgccxczzuy.supabase.co/storage/v1/object/public/Benefit-lab/Benefit-lab_logo_v0.png'

// 지금 사업(상담 신청 → 신청서 → 본사 전달)에 맞춘 메뉴.
// 예전 CCTV 파트너 사업용 화면(문의·파트너·정산서·가이드)은 주소로는 열리지만 메뉴에서는 뺐다.
const menuItems = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/leads', label: '상담 신청', icon: PhoneCall },
  { href: '/admin/applications', label: '신청서', icon: FileText },
  { href: '/admin/rental-products', label: '렌탈 상품', icon: Package },
  { href: '/admin/cards', label: '카드 상품', icon: CreditCard },
  { href: '/admin/chat', label: '채팅', icon: MessageCircle },
]

interface SidebarProps {
  isMobile?: boolean
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAuthStore()

  // 프로필(이름·사진)과 안 읽은 채팅 수. 채팅 화면을 보고 있을 때는 그 화면이 읽음 처리를 한다.
  const [profile, setProfile] = useState<{ nickname: string; avatarUrl: string | null } | null>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const loadProfile = () =>
      api
        .get('/admin/profile')
        .then((res) => setProfile(res.data.profile))
        .catch(() => {})
    loadProfile()
    window.addEventListener('admin-profile-changed', loadProfile)
    return () => window.removeEventListener('admin-profile-changed', loadProfile)
  }, [])

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      api
        .get(`/admin/chat?count=1&after=${getLastRead()}`)
        .then((res) => setUnread(res.data.count))
        .catch(() => {})
    }
    check()
    const timer = setInterval(check, 20000)
    window.addEventListener(CHAT_READ_EVENT, check)
    return () => {
      clearInterval(timer)
      window.removeEventListener(CHAT_READ_EVENT, check)
    }
  }, [])

  const displayName = profile?.nickname || admin?.nickname || admin?.loginId || ''

  const handleLogout = async () => {
    await logout()
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
        <Link href="/admin/profile" className="mt-3 flex items-center gap-2.5 group" data-testid="sidebar-profile">
          <Avatar name={displayName} url={profile?.avatarUrl} size={32} />
          <span className="text-small text-text-secondary group-hover:text-text-primary truncate">{displayName}</span>
        </Link>
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
                  {item.href === '/admin/chat' && unread > 0 && !isActive && (
                    <span
                      data-testid="chat-unread"
                      className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-action-primary text-white text-[11px] font-semibold flex items-center justify-center"
                    >
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
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
