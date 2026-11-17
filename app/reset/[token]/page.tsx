'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/admin/api'

// 재설정 링크(/reset/<토큰>). 열자마자 토큰을 검사하고, 살아 있으면 새 비밀번호를 받는다.
export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<'checking' | 'valid' | 'invalid' | 'done'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/auth/reset', { params: { token: params.token } })
      .then((res) => setState(res.data.valid ? 'valid' : 'invalid'))
      .catch(() => setState('invalid'))
  }, [params.token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('비밀번호는 8자 이상으로 입력해 주세요.')
    if (password !== confirm) return setError('비밀번호가 서로 달라요.')
    setLoading(true)
    try {
      await api.post('/admin/auth/reset', { token: params.token, password })
      setState('done')
    } catch (err) {
      const r = (err as { response?: { status?: number; data?: { error?: string } } }).response
      if (r?.status === 410) setState('invalid')
      else setError(r?.data?.error || '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary outline-none'
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-card rounded-card p-8" data-testid={`reset-${state}`}>
          {state === 'checking' && <p className="text-body text-text-secondary text-center py-8">링크를 확인하고 있어요…</p>}

          {state === 'invalid' && (
            <div className="text-center">
              <h1 className="text-headline text-text-primary">링크가 만료됐어요</h1>
              <p className="mt-3 text-small text-text-secondary leading-relaxed">재설정 링크는 30분 동안만 유효하고 한 번만 쓸 수 있어요.<br />비밀번호 찾기를 다시 해주세요.</p>
              <Link href="/admin/forgot" className="inline-flex mt-8 h-12 px-6 items-center justify-center rounded-button bg-action-primary text-white text-body font-medium">비밀번호 찾기</Link>
            </div>
          )}

          {state === 'valid' && (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="text-headline text-text-primary text-center">새 비밀번호 설정</h1>
              <p className="text-small text-text-secondary text-center">8자 이상으로 정해 주세요.</p>
              <div className="pt-2">
                <label className="block text-small text-text-secondary mb-2">새 비밀번호</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={72} required data-testid="reset-password" className={input} placeholder="새 비밀번호" />
              </div>
              <div>
                <label className="block text-small text-text-secondary mb-2">새 비밀번호 확인</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={72} required data-testid="reset-confirm" className={input} placeholder="한 번 더 입력" />
              </div>
              {error && <p className="text-small text-error text-center" data-testid="reset-error">{error}</p>}
              <button type="submit" disabled={loading} data-testid="reset-submit" className="w-full py-4 bg-action-primary text-white rounded-button text-body font-medium hover:bg-action-primary/90 disabled:opacity-50 transition-colors">
                {loading ? '바꾸는 중...' : '비밀번호 바꾸기'}
              </button>
            </form>
          )}

          {state === 'done' && (
            <div className="text-center">
              <h1 className="text-headline text-text-primary">비밀번호를 바꿨어요</h1>
              <p className="mt-3 text-small text-text-secondary">새 비밀번호로 로그인해 주세요.</p>
              <Link href="/admin/login" className="inline-flex mt-8 h-12 px-6 items-center justify-center rounded-button bg-action-primary text-white text-body font-medium" data-testid="reset-login-link">로그인하기</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
