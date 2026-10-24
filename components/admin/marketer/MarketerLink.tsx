'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/lib/admin/store'
import { useConsole } from '@/lib/admin/useConsole'

// 상담 링크. 토스플레이스 "상담 링크" 화면을 옮긴 것: 내 링크 + 복사, 영업 멘트 템플릿, 고객이 보게 될 화면 미리보기.
const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hyeso.kr'

const TEMPLATES = [
  {
    title: '가전렌탈 안내',
    body: `안녕하세요, 혜택연구소입니다.
정수기·공기청정기·비데 렌탈, 브랜드별 월 요금과 사은품을 한 번에 비교해 보세요.
아래 링크에서 상담 신청만 남기시면 담당자가 연락드려요.
{link}`,
  },
  {
    title: '인터넷 가입 안내',
    body: `안녕하세요, 혜택연구소입니다.
KT·LG U+·SK 인터넷+TV, 통신사만 고르면 월 요금과 현금 사은품이 바로 보여요.
아래 링크에서 상담 신청 남겨주세요.
{link}`,
  },
  {
    title: '기존 고객 재안내',
    body: `안녕하세요, 혜택연구소입니다.
이사·약정 만료 앞두고 계시면 지금 조건으로 다시 비교해 드릴게요.
아래 링크에서 번호만 남겨주시면 됩니다.
{link}`,
  },
]

export default function MarketerLink() {
  const admin = useAuthStore((s) => s.admin)
  const { path: cp } = useConsole()
  const code = admin?.uniqueCode ?? ''
  const link = `${BASE}/m/${code}`
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-text-primary tracking-[-0.01em]">상담 링크</h1>
        <p className="mt-1 text-[13px] text-text-secondary">이 링크로 들어온 상담은 자동으로 내 실적으로 기록돼요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <section className="rounded-2xl bg-bg-card p-5">
            <p className="text-[15px] font-semibold text-text-primary">내 링크</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate px-4 py-3 rounded-xl bg-bg-primary text-[14px] text-text-primary" data-testid="my-link">{link}</code>
              <button onClick={() => copy('link', link)} className="shrink-0 inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-action-primary text-white text-[14px] font-semibold hover:bg-action-primary-hover">
                {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === 'link' ? '복사됨' : '복사'}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-text-tertiary break-all">서비스를 정해서 보내려면 뒤에 <code>?service=internet</code> 또는 <code>?service=electronics</code> 를 붙이세요.</p>
          </section>

          <section className="rounded-2xl bg-bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-text-primary">영업 멘트 템플릿</p>
              <Link href={cp('/library')} className="text-[12px] text-text-secondary hover:text-text-primary">작성 가이드 보기</Link>
            </div>
            <div className="mt-3 space-y-3">
              {TEMPLATES.map((t) => {
                const text = t.body.replace('{link}', link)
                return (
                  <div key={t.title} className="rounded-xl bg-bg-primary p-4 flex gap-3 md:gap-4 items-start min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text-primary">{t.title}</p>
                      <p className="mt-1.5 text-[12px] text-text-secondary whitespace-pre-line leading-relaxed break-all">{text}</p>
                    </div>
                    <button onClick={() => copy(t.title, text)} className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-bg-card text-[12px] font-medium text-text-primary hover:bg-action-primary/10">
                      {copied === t.title ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === t.title ? '복사됨' : '복사'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* 고객이 보게 될 화면 */}
        <aside className="rounded-2xl bg-bg-card p-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-primary">고객이 보는 화면</p>
            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-text-secondary hover:text-text-primary">열어보기 <ExternalLink className="w-3.5 h-3.5" /></a>
          </div>
          <div className="mt-3 mx-auto w-[260px] rounded-[28px] border-[6px] border-[#1b1d21] bg-white overflow-hidden shadow-lg">
            <iframe title="상담 신청 미리보기" src="/apply?service=electronics" className="w-[390px] h-[640px] origin-top-left pointer-events-none" style={{ transform: 'scale(0.6385)', marginBottom: '-231px', marginRight: '-141px' }} />
          </div>
          <p className="mt-3 text-[11px] text-text-tertiary text-center">실제 링크를 열면 이 화면이 뜨고, 접수 시 내 코드가 함께 저장돼요.</p>
        </aside>
      </div>
    </div>
  )
}
