'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import api from '@/lib/admin/api'
import ThemeToggle from '@/components/shared/ThemeToggle'

const LOGO_URL = 'https://yknptcjxrizgccxczzuy.supabase.co/storage/v1/object/public/Benefit-lab/Benefit-lab_logo_v0.png'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [inviteKey, setInviteKey] = useState('')
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await api.post('/admin/auth/register', { loginId, password, nickname, inviteKey })
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      router.push('/admin/login')
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-bg-card rounded-card p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image src={LOGO_URL} alt="혜택 연구소" width={140} height={40} className="h-10 w-auto dark:brightness-0 dark:invert" />
              <span className="text-headline text-text-primary">Admin</span>
            </div>
            <p className="text-body text-text-secondary">새 관리자 등록 (초대 전용)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-small text-text-secondary mb-2">초대 키 (필수)</label>
              <input
                type="text"
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none"
                placeholder="INV-XXXXXXX"
                required
              />
            </div>
            <div>
              <label className="block text-small text-text-secondary mb-2">아이디</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none"
                placeholder="사용할 아이디"
                required
              />
            </div>
            <div>
              <label className="block text-small text-text-secondary mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none"
                placeholder="비밀번호"
                required
              />
            </div>
            <div>
              <label className="block text-small text-text-secondary mb-2">이름 (닉네임)</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none"
                placeholder="이름"
                required
              />
            </div>

            {error && (
              <p className="text-small text-error text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-action-primary text-white rounded-button text-body font-medium hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
            >
              {isLoading ? '등록 중...' : '관리자 가입하기'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/admin/login"
              className="block w-full py-3 text-center text-small text-text-tertiary hover:text-text-secondary transition-colors"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
