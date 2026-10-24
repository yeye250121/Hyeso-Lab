'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

// 상세 패널. 모바일은 아래에서 올라오는 전체 화면 시트, 데스크톱은 오른쪽 드로어.
// 표 한 줄을 눌렀을 때 숨어 있던 정보를 한 화면에 다 보여주는 용도라 콘솔 전체에서 같이 쓴다.
export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  testId,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  testId?: string
}) {
  // 열려 있는 동안 뒤 화면 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end" data-testid={testId}>
      <button aria-label="닫기" className="absolute inset-0 bg-overlay" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        className="relative w-full h-[92dvh] md:h-full md:max-w-[520px] bg-bg-card rounded-t-[20px] md:rounded-none shadow-xl flex flex-col animate-slide-up md:animate-slide-left"
      >
        <header className="shrink-0 px-5 pt-3 pb-3 md:pt-4 border-b border-border">
          <div className="md:hidden mx-auto mb-3 w-10 h-1 rounded-full bg-border" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[17px] font-bold text-text-primary truncate">{title}</p>
              {subtitle && <p className="mt-0.5 text-[12px] text-text-secondary">{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="닫기" data-testid="sheet-close" className="shrink-0 -mr-1 w-8 h-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-bg-primary">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(20px,env(safe-area-inset-bottom))]">{children}</div>
      </section>
    </div>
  )
}
