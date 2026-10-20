'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Package,
  PhoneCall,
  CreditCard,
  MessageCircle,
  BookOpen,
  Images,
  Link2,
  Home,
  Users,
  Headset,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/admin/api'
import Avatar from '@/components/admin/Avatar'
import { useAuthStore } from '@/lib/admin/store'
import { useConsole } from '@/lib/admin/useConsole'
import ThemeToggle from '@/components/shared/ThemeToggle'

const LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-mark.png'

// 메뉴는 역할이 정한다(주소가 아니라). 토스플레이스 파트너 콘솔처럼 섹션으로 묶는다.
type Item = { page: string; label: string; icon: LucideIcon }
type Section = { label?: string; items: Item[] }

const ROLE_LABEL: Record<string, string> = { owner: '대표자', admin: '관리자', marketer: '파트너스' }

function sectionsFor(role: string | undefined): Section[] {
  if (role === 'marketer') {
    return [
      { items: [{ page: 'home', label: '홈', icon: Home }] },
      {
        label: '영업',
        items: [
          { page: 'leads', label: '내 상담', icon: PhoneCall },
          { page: 'link', label: '상담 링크', icon: Link2 },
        ],
      },
      {
        label: '자료',
        items: [
          { page: 'library', label: '라이브러리', icon: BookOpen },
          { page: 'images', label: '이미지 센터', icon: Images },
        ],
      },
      { label: '소통', items: [{ page: 'chat', label: '채팅', icon: MessageCircle }] },
    ]
  }
  const sections: Section[] = [
    { items: [{ page: 'dashboard', label: '홈', icon: LayoutDashboard }] },
    {
      label: '영업',
      items: [
        { page: 'leads', label: '상담 신청', icon: PhoneCall },
        { page: 'applications', label: '신청서', icon: FileText },
      ],
    },
    {
      label: '마케팅',
      items: [
        { page: 'library', label: '라이브러리', icon: BookOpen },
        { page: 'images', label: '이미지 센터', icon: Images },
        { page: 'link', label: '상담 링크', icon: Link2 },
      ],
    },
    {
      label: '상품',
      items: [
        { page: 'rental-products', label: '렌탈 상품', icon: Package },
        { page: 'cards', label: '카드 상품', icon: CreditCard },
      ],
    },
    { label: '소통', items: [{ page: 'chat', label: '채팅', icon: MessageCircle }] },
  ]
  if (role === 'owner') sections.push({ label: '구성원', items: [{ page: 'members', label: '구성원 관리', icon: Users }] })
  return sections
}

export default function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAuthStore()
  const { path: cp } = useConsole()

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
        .get('/admin/chat?count=1')
        .then((res) => setUnread(res.data.count))
        .catch(() => {})
    }
    check()
    const timer = setInterval(check, 20000)
    window.addEventListener('admin-chat-read', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('admin-chat-read', check)
    }
  }, [])

  const displayName = profile?.nickname || admin?.nickname || admin?.loginId || ''
  const role = admin?.role
  const sections = sectionsFor(role)

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  return (
    <aside className={`${isMobile ? 'h-full w-full' : 'fixed left-0 top-0 h-full w-[248px]'} bg-bg-card border-r border-border flex flex-col`}>
      {/* 브랜드 + 역할 */}
      <div className="px-5 pt-5 pb-4">
        <Link href={cp('/')} className="flex items-center gap-2">
          <Image src={LOGO_URL} alt="혜택 연구소" width={512} height={512} className="h-6 w-6" />
          <span className="text-[15px] font-bold text-text-primary tracking-[-0.01em]">혜택연구소</span>
          <span className="ml-auto px-2 py-0.5 rounded-md bg-action-primary/10 text-[11px] font-semibold text-action-primary">
            {ROLE_LABEL[role ?? 'admin']}
          </span>
        </Link>

        <Link href={cp('/profile')} className="mt-4 flex items-center gap-2.5 rounded-xl bg-bg-primary px-3 py-2.5 group" data-testid="sidebar-profile">
          <Avatar name={displayName} url={profile?.avatarUrl} size={32} />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-text-primary truncate">{displayName}</span>
            <span className="block text-[11px] text-text-tertiary">내 정보 · 비밀번호</span>
          </span>
        </Link>

        <div className="mt-3 flex items-center justify-between text-[12px]">
          <Link href={cp('/library')} className="text-text-secondary hover:text-text-primary">사용 가이드</Link>
          <a href="tel:01074694385" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary">
            <Headset className="w-3.5 h-3.5" /> 010-7469-4385
          </a>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {sections.map((section, i) => (
          <div key={i} className={i === 0 ? '' : 'mt-4'}>
            {section.label && <p className="px-3 mb-1 text-[11px] font-semibold text-text-tertiary tracking-wide">{section.label}</p>}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const href = cp(`/${item.page}`)
                const isActive = pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`)
                const Icon = item.icon
                return (
                  <li key={item.page}>
                    <Link
                      href={href}
                      data-testid={`nav-${item.page}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-colors ${
                        isActive ? 'bg-action-primary/10 text-action-primary font-semibold' : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                      <span>{item.label}</span>
                      {item.page === 'chat' && unread > 0 && !isActive && (
                        <span data-testid="chat-unread" className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-action-primary text-white text-[11px] font-semibold flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 하단 */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <ThemeToggle />
        <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary">
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  )
}
