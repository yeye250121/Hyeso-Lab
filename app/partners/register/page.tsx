'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Loader2 } from 'lucide-react'
import api from '@/lib/admin/api'
import { BANKS } from '@/components/electronics/applyConstants'
import { formatPhone, isValidPhone } from '@/components/shared/LeadForm'

const LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-mark.png'

// 파트너스 가입 신청. 초대키 없이 신청하고, 대표자가 승인하면 로그인할 수 있다.
export default function PartnersRegisterPage() {
  const [f, setF] = useState({ loginId: '', password: '', password2: '', nickname: '', phone: '', bankName: '', bankAccount: '', accountHolder: '', channelUrl: '', agreed: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (f.password !== f.password2) return setError('비밀번호가 서로 달라요.')
    if (!isValidPhone(f.phone)) return setError('휴대폰 번호를 정확히 입력해 주세요.')
    setLoading(true)
    try {
      await api.post('/admin/auth/partners-register', { ...f, password2: undefined })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(msg || '가입 신청에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full h-12 px-4 rounded-xl bg-[#f2f4f6] border-0 focus:outline-none focus:ring-2 focus:ring-[#ffc2d2] text-[15px] text-[#191f28] placeholder:text-gray-400'

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto w-16 h-16 rounded-full bg-[#fff1f5] flex items-center justify-center"><Check className="w-8 h-8 text-[var(--action-primary)]" /></span>
          <h1 className="mt-5 text-[24px] font-bold text-[#191f28]">가입 신청을 받았어요</h1>
          <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">혜택연구소가 확인한 뒤 승인해 드려요.<br />승인되면 {f.phone} 번호로 안내드릴게요.</p>
          <Link href="/admin/login" className="mt-8 inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[var(--action-primary)] text-white font-semibold">로그인 화면으로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-md mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src={LOGO_URL} alt="혜택 연구소" width={512} height={512} className="h-7 w-7" />
          <span className="text-[15px] font-bold text-[#191f28]">혜택연구소 파트너스</span>
        </Link>
        <h1 className="mt-6 text-[26px] font-bold text-[#191f28] leading-snug">파트너스 가입 신청</h1>
        <p className="mt-2 text-[14px] text-gray-500">블로그·SNS로 상담을 연결해 주시는 파트너를 모십니다. 신청 후 승인되면 전용 링크와 자료를 바로 쓸 수 있어요.</p>

        <form onSubmit={submit} className="mt-8 space-y-5" data-testid="partners-register">
          <section className="space-y-3">
            <p className="text-[13px] font-semibold text-[#333d4b]">로그인 정보</p>
            <input value={f.loginId} onChange={(e) => set('loginId', e.target.value)} placeholder="아이디 (영문·숫자 4자 이상)" autoComplete="username" className={input} />
            <input type="password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="비밀번호 (10자 이상)" autoComplete="new-password" className={input} />
            <input type="password" value={f.password2} onChange={(e) => set('password2', e.target.value)} placeholder="비밀번호 확인" autoComplete="new-password" className={input} />
          </section>

          <section className="space-y-3">
            <p className="text-[13px] font-semibold text-[#333d4b]">연락처</p>
            <input value={f.nickname} onChange={(e) => set('nickname', e.target.value)} placeholder="이름" autoComplete="name" className={input} />
            <input value={f.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} placeholder="휴대폰 번호 010-0000-0000" inputMode="numeric" autoComplete="tel" className={input} />
            <input value={f.channelUrl} onChange={(e) => set('channelUrl', e.target.value)} placeholder="운영 중인 블로그·채널 주소 (선택)" inputMode="url" className={input} />
          </section>

          <section className="space-y-3">
            <p className="text-[13px] font-semibold text-[#333d4b]">정산 계좌</p>
            <select value={f.bankName} onChange={(e) => set('bankName', e.target.value)} className={`${input} ${f.bankName ? '' : 'text-gray-400'}`}>
              <option value="">은행 선택</option>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input value={f.bankAccount} onChange={(e) => set('bankAccount', e.target.value.replace(/[^\d-]/g, ''))} placeholder="계좌번호 ('-' 없이)" inputMode="numeric" className={input} />
            <input value={f.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} placeholder="예금주" className={input} />
            <p className="text-[12px] text-gray-400">정산은 승인된 상담이 계약으로 이어졌을 때 이 계좌로 지급돼요.</p>
          </section>

          <label className="flex items-start gap-2.5 rounded-xl bg-[#f8f9fb] px-4 py-3.5 cursor-pointer">
            <input type="checkbox" checked={f.agreed} onChange={(e) => set('agreed', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--action-primary)]" />
            <span className="text-[13px] text-gray-600 leading-relaxed">개인정보(이름·연락처·계좌) 수집과 파트너 활동 약관에 동의해요. 고객 개인정보는 열람할 수 없고, 허위·불법 홍보 시 승인이 취소돼요.</span>
          </label>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full h-13 py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] disabled:opacity-60 text-white text-[15px] font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} 가입 신청하기
          </button>
          <p className="text-center text-[13px] text-gray-500">이미 계정이 있나요? <Link href="/admin/login" className="text-[var(--action-primary)] font-medium">로그인</Link></p>
        </form>
      </main>
    </div>
  )
}
