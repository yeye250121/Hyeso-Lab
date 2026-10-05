'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, FileText, ImageOff, Package, PhoneCall } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import InviteKeyGenerator from '@/components/admin/InviteKeyGenerator'
import api from '@/lib/admin/api'
import { LEAD_STATUS, SERVICE_LABEL, formatDateTime } from '@/components/admin/labels'

interface Stats {
  leads: { total: number; today: number; week: number; unprocessed: number; byService: Record<string, number>; daily: { date: string; count: number }[] }
  applications: { total: number; today: number; unprocessed: number }
  products: { active: number; inactive: number; withoutImage: number }
  recentLeads: { id: string; service: string; name: string; phone: string; product: string | null; status: string; submittedAt: string }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data)).catch(() => {})
  }, [])

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  const maxDaily = Math.max(1, ...stats.leads.daily.map((d) => d.count))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-headline text-text-primary">대시보드</h1>

        {/* 지금 처리할 것 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card href="/admin/leads?status=new" icon={PhoneCall} tone="primary" label="미처리 상담 신청" value={stats.leads.unprocessed} sub={`오늘 ${stats.leads.today}건 · 최근 7일 ${stats.leads.week}건`} />
          <Card href="/admin/applications" icon={FileText} tone="green" label="미처리 신청서" value={stats.applications.unprocessed} sub={`오늘 ${stats.applications.today}건 · 전체 ${stats.applications.total}건`} />
          <Card href="/admin/leads" icon={ClipboardList} tone="yellow" label="누적 상담 신청" value={stats.leads.total} sub={Object.entries(stats.leads.byService).map(([k, v]) => `${SERVICE_LABEL[k] ?? k} ${v}`).join(' · ')} />
          <Card href="/admin/rental-products" icon={stats.products.withoutImage ? ImageOff : Package} tone="purple" label="판매 중 렌탈 상품" value={stats.products.active} sub={`사진 없음 ${stats.products.withoutImage}개 · 판매 중지 ${stats.products.inactive}개`} />
        </div>

        <div className="grid xl:grid-cols-3 gap-4">
          {/* 최근 7일 유입 */}
          <section className="bg-bg-card rounded-card p-6">
            <h2 className="text-title text-text-primary mb-5">최근 7일 상담 신청</h2>
            <div className="flex items-end gap-2 h-36">
              {stats.leads.daily.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-text-secondary">{d.count || ''}</span>
                  <div className="w-full rounded-t bg-action-primary/80" style={{ height: `${(d.count / maxDaily) * 96 + (d.count ? 4 : 1)}px`, opacity: d.count ? 1 : 0.25 }} />
                  <span className="text-xs text-text-tertiary">{d.date}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 최근 신청 */}
          <section className="bg-bg-card rounded-card p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title text-text-primary">최근 상담 신청</h2>
              <Link href="/admin/leads" className="text-small text-action-primary">전체 보기</Link>
            </div>
            {stats.recentLeads.length === 0 ? (
              <p className="py-8 text-center text-small text-text-secondary">아직 들어온 상담 신청이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recentLeads.map((l) => {
                  const st = LEAD_STATUS[l.status] ?? LEAD_STATUS.new
                  return (
                    <li key={l.id} className="flex items-center gap-3 py-2.5 text-small">
                      <span className="w-20 shrink-0 text-text-secondary">{formatDateTime(l.submittedAt)}</span>
                      <span className="w-16 shrink-0 text-text-primary">{SERVICE_LABEL[l.service] ?? l.service}</span>
                      <span className="w-20 shrink-0 text-text-primary truncate">{l.name}</span>
                      <span className="w-32 shrink-0 text-text-primary">{l.phone}</span>
                      <span className="flex-1 min-w-0 truncate text-text-secondary">{l.product ?? '상담 후 결정'}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <InviteKeyGenerator />
      </div>
    </AdminLayout>
  )
}

const TONES: Record<string, string> = {
  primary: 'bg-action-primary/10 text-action-primary',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
}

function Card({ href, icon: Icon, tone, label, value, sub }: { href: string; icon: typeof Package; tone: string; label: string; value: number; sub: string }) {
  return (
    <Link href={href} className="bg-bg-card rounded-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${TONES[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-small text-text-secondary">{label}</p>
          <p className="text-headline text-text-primary">{value.toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-text-secondary truncate">{sub}</p>
    </Link>
  )
}
