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
  PanelLeftClose,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/admin/api'
import Avatar from '@/components/admin/Avatar'
import { useAuthStore } from '@/lib/admin/store'
import { useConsole } from '@/lib/admin/useConsole'
import { useSidebarStore } from '@/lib/admin/sidebarStore'

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
  const { setCollapsed } = useSidebarStore()
  // 접힌 상태는 레이아웃이 아예 그리지 않으므로 여기서는 항상 펼친 모양이다
  const collapsed = false

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
    <aside className={`${isMobile ? 'h-full w-full' : 'fixed left-0 top-0 h-full w-[224px]'} bg-bg-card border-r border-border flex flex-col`}>
      {/* 브랜드 + 역할 + 접기 */}
      <div className={`${collapsed ? 'px-3' : 'px-4'} pt-4 pb-3`}>
        <div className="flex items-center gap-2 h-8">
          <Link href={cp('/')} className="flex items-center gap-2 min-w-0" title="혜택연구소">
            <Image src={LOGO_URL} alt="혜택 연구소" width={512} height={512} className="h-6 w-6 shrink-0" />
            {!collapsed && <span className="text-[14px] font-bold text-text-primary tracking-[-0.02em] whitespace-nowrap">혜택연구소</span>}
          </Link>
          {!collapsed && (
            <span className="ml-auto px-1.5 py-0.5 rounded-md bg-action-primary/10 text-[10px] font-semibold text-action-primary shrink-0">
              {ROLE_LABEL[role ?? 'admin']}
            </span>
          )}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="메뉴 접기"
              data-testid="sidebar-toggle"
              className="ml-0.5 w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-primary shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <Link
          href={cp('/profile')}
          title={displayName}
          className={`mt-3 flex items-center gap-2.5 rounded-xl bg-bg-primary group ${collapsed ? 'justify-center p-1.5' : 'px-3 py-2.5'}`}
          data-testid="sidebar-profile"
        >
          <Avatar name={displayName} url={profile?.avatarUrl} size={collapsed ? 30 : 32} />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-text-primary truncate">{displayName}</span>
              <span className="block text-[11px] text-text-tertiary">내 정보 · 비밀번호</span>
            </span>
          )}
        </Link>

        {!collapsed && (
          <div className="mt-3 flex items-center justify-between text-[12px]">
            <Link href={cp('/library')} className="text-text-secondary hover:text-text-primary">사용 가이드</Link>
            <a href="tel:01074694385" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary">
              <Headset className="w-3.5 h-3.5" /> 010-7469-4385
            </a>
          </div>
        )}
      </div>

      {/* 메뉴 */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2.5' : 'px-3'} pb-3`}>
        {sections.map((section, i) => (
          <div key={i} className={i === 0 ? '' : collapsed ? 'mt-2 pt-2 border-t border-border' : 'mt-4'}>
            {section.label && !collapsed && <p className="px-3 mb-1 text-[11px] font-semibold text-text-tertiary tracking-wide">{section.label}</p>}
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
                      title={collapsed ? item.label : undefined}
                      className={`relative flex items-center gap-2.5 rounded-lg text-[14px] transition-colors ${collapsed ? 'justify-center h-10' : 'px-3 py-2'} ${
                        isActive ? 'bg-action-primary/10 text-action-primary font-semibold' : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                      {!collapsed && <span>{item.label}</span>}
                      {item.page === 'chat' && unread > 0 && !isActive && (
                        <span
                          data-testid="chat-unread"
                          className={`${collapsed ? 'absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px]' : 'ml-auto min-w-[20px] h-5 px-1.5 text-[11px]'} rounded-full bg-action-primary text-white font-semibold flex items-center justify-center`}
                        >
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
      <div className="py-3 px-4 border-t border-border">
        <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary">
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </aside>
  )
}
