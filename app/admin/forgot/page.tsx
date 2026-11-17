'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/admin/api'

// 비밀번호 찾기: 아이디 + 휴대폰 번호 → 재설정 링크를 알림톡으로. 결과 문구는 맞든 틀리든 같다.
export default function ForgotPasswordPage() {
  const [loginId, setLoginId] = useState('')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/admin/auth/forgot', { loginId: loginId.trim(), phone: phone.trim() })
      setDone(true)
    } catch (err) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || '요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-card rounded-card p-8">
          <h1 className="text-headline text-text-primary text-center">비밀번호 찾기</h1>
          <p className="mt-2 text-small text-text-secondary text-center">가입할 때 적은 휴대폰 번호로 재설정 링크를 보내드려요.</p>

          {done ? (
            <div className="mt-8 text-center" data-testid="forgot-done">
              <p className="text-body text-text-primary">아이디와 휴대폰 번호가 맞으면<br />카카오톡(미수신 시 문자)으로 링크를 보냈어요.</p>
              <p className="mt-3 text-small text-text-secondary">링크는 30분 동안만 유효해요. 안 오면 번호를 다시 확인하고 요청해 주세요.</p>
              <Link href="/admin/login" className="inline-flex mt-8 h-12 px-6 items-center justify-center rounded-button bg-action-primary text-white text-body font-medium">로그인으로 돌아가기</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="block text-small text-text-secondary mb-2">아이디</label>
                <input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required data-testid="forgot-login-id" className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none" placeholder="아이디 입력" />
              </div>
              <div>
                <label className="block text-small text-text-secondary mb-2">휴대폰 번호</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" required data-testid="forgot-phone" className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none" placeholder="010-0000-0000" />
              </div>
              {error && <p className="text-small text-error text-center">{error}</p>}
              <button type="submit" disabled={loading} data-testid="forgot-submit" className="w-full py-4 bg-action-primary text-white rounded-button text-body font-medium hover:bg-action-primary/90 disabled:opacity-50 transition-colors">
                {loading ? '보내는 중...' : '재설정 링크 받기'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-small">
            <Link href="/admin/login" className="text-text-secondary hover:text-text-primary">로그인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
