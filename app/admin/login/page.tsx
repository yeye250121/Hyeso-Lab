'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/lib/admin/store'
import api from '@/lib/admin/api'
import ThemeToggle from '@/components/shared/ThemeToggle'

const LOGO_URL = 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_logo'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAdmin, setToken } = useAuthStore()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await api.post('/admin/auth/login', { loginId, password, rememberMe })
      const { token, admin } = response.data

      setToken(token)
      setAdmin(admin)
      router.push('/admin/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* 테마 토글 버튼 */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-bg-card rounded-card p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image src={LOGO_URL} alt="Piooom" width={140} height={40} className="h-10 w-auto dark:brightness-0 dark:invert" />
              <span className="text-headline text-text-primary">Admin</span>
            </div>
            <p className="text-body text-text-secondary">관리자 로그인</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-small text-text-secondary mb-2">
                아이디
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none"
                placeholder="관리자 아이디 입력"
                required
              />
            </div>

            <div>
              <label className="block text-small text-text-secondary mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            {/* 로그인 상태 유지 토글 */}
            <label className="flex items-center gap-3 cursor-pointer w-fit ml-auto">
              <span className="text-caption text-text-secondary">로그인 상태 유지</span>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                  rememberMe ? 'bg-action-primary' : 'bg-text-tertiary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                    rememberMe ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            {error && (
              <p className="text-small text-error text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-action-primary text-white rounded-button text-body font-medium hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 파트너 로그인 링크 */}
          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/partners/login"
              className="block w-full py-3 text-center text-small text-text-tertiary hover:text-text-secondary transition-colors"
            >
              파트너로 로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
