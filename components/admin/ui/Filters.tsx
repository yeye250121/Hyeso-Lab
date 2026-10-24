'use client'

import { Search } from 'lucide-react'

// 목록 상단 필터 줄. 모바일에서는 셀렉트가 반반 나뉘고 검색이 한 줄을 다 쓴다.
export function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">{children}</div>
}

export const selectCls = 'h-10 px-3 rounded-button bg-bg-card border border-border text-small text-text-primary min-w-0'

export function SearchForm({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder: string }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className="relative col-span-2 md:flex-1 md:min-w-[200px] md:max-w-[320px]"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-10 pl-9 pr-3 rounded-button bg-bg-card border border-border text-small text-text-primary" />
    </form>
  )
}
