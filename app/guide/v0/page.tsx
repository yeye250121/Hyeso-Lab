import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { verifyAdminToken } from '@/lib/admin/auth'
import { GUIDE_V0_HTML, GUIDE_V0_TITLE, GUIDE_V0_UPDATED } from './content'

// 직원용 마케팅 가이드. 관리자 로그인 세션이 있어야 보인다.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '마케팅 가이드 v0 | 혜택연구소', robots: { index: false, follow: false } }

export default function GuideV0Page() {
  const token = cookies().get('admin-token')?.value
  const admin = token ? verifyAdminToken(token) : null
  if (!admin) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-[760px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#333d4b]">
            <ChevronLeft className="w-4 h-4" /> 관리자
          </Link>
          <span className="text-xs text-gray-400">직원 열람용 · {GUIDE_V0_UPDATED}</span>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-10">
        <p className="text-[13px] font-bold text-[var(--action-primary)]">마케팅 가이드 v0</p>
        <h1 className="mt-1 text-[26px] font-bold text-[#191f28] leading-snug">{GUIDE_V0_TITLE}</h1>
        <p className="mt-2 text-[14px] text-gray-500">이전 사업(CCTV)에서 쓰던 블로그 대량 포스팅 방식을 그대로 옮겼어요. 키워드·템플릿·랜딩 링크만 혜택연구소 기준으로 바꿔 쓰면 됩니다.</p>

        <article
          className="guide-article mt-10"
          dangerouslySetInnerHTML={{ __html: GUIDE_V0_HTML }}
        />
      </main>

      <style>{`
        .guide-article { color: #333d4b; font-size: 16px; line-height: 1.75; }
        .guide-article h1 { font-size: 22px; font-weight: 700; color: #191f28; margin: 44px 0 14px; }
        .guide-article h3 { font-size: 17px; font-weight: 700; color: #333d4b; margin: 30px 0 10px; }
        .guide-article p { margin: 0 0 10px; }
        .guide-article p:empty { display: none; }
        .guide-article hr { border: 0; border-top: 1px solid #f2f4f6; margin: 36px 0; }
        .guide-article ul { margin: 6px 0 14px; padding-left: 22px; list-style: disc; }
        .guide-article li > p { margin: 0 0 4px; }
        .guide-article img { display: block; max-width: 100%; height: auto; border-radius: 14px; margin: 18px 0 22px; border: 1px solid #f2f4f6; }
        .guide-article em { font-style: normal; color: #4e5968; }
        .guide-article strong em, .guide-article em strong { color: #191f28; }
      `}</style>
    </div>
  )
}
