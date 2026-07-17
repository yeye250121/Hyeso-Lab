'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { Users, FileText, TrendingUp, Clock } from 'lucide-react'
import InviteKeyGenerator from '@/components/admin/InviteKeyGenerator'

interface DashboardStats {
  totalPartners: number
  totalInquiries: number
  newInquiries: number
  contractedInquiries: number
  recentInquiries: {
    id: number
    name: string
    phone: string
    marketerCode: string
    status: string
    createdAt: string
  }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: '신규',
      in_progress: '상담중',
      contracted: '계약완료',
      cancelled: '취소',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-action-primary/10 text-action-primary',
      in_progress: 'bg-yellow-100 text-yellow-700',
      contracted: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-500',
    }
    return colors[status] || 'bg-gray-100 text-gray-500'
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-headline text-text-primary">대시보드</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-bg-card rounded-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-action-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-action-primary" />
              </div>
              <div>
                <p className="text-small text-text-secondary">전체 파트너</p>
                <p className="text-headline text-text-primary">
                  {stats?.totalPartners || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-small text-text-secondary">전체 문의</p>
                <p className="text-headline text-text-primary">
                  {stats?.totalInquiries || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-small text-text-secondary">신규 문의</p>
                <p className="text-headline text-text-primary">
                  {stats?.newInquiries || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-small text-text-secondary">계약 완료</p>
                <p className="text-headline text-text-primary">
                  {stats?.contractedInquiries || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-bg-card rounded-card p-6">
          <h2 className="text-title text-text-primary mb-4">최근 문의</h2>

          {stats?.recentInquiries && stats.recentInquiries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-small text-text-secondary font-medium">이름</th>
                    <th className="text-left py-3 px-4 text-small text-text-secondary font-medium">연락처</th>
                    <th className="text-left py-3 px-4 text-small text-text-secondary font-medium">담당자</th>
                    <th className="text-left py-3 px-4 text-small text-text-secondary font-medium">상태</th>
                    <th className="text-left py-3 px-4 text-small text-text-secondary font-medium">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-body text-text-primary">{inquiry.name}</td>
                      <td className="py-3 px-4 text-body text-text-secondary">{inquiry.phone}</td>
                      <td className="py-3 px-4 text-body text-text-secondary">{inquiry.marketerCode}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-small ${getStatusColor(inquiry.status)}`}>
                          {getStatusLabel(inquiry.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-body text-text-tertiary">
                        {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-body text-text-secondary text-center py-8">
              최근 문의가 없습니다
            </p>
          )}
        </div>

        <InviteKeyGenerator />
      </div>
    </AdminLayout>
  )
}
