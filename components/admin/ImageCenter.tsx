'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, Search } from 'lucide-react'
import api from '@/lib/admin/api'

// 이미지 센터. 토스플레이스 이미지 센터처럼 카테고리 탭 + 썸네일 격자 + 다운로드.
type Item = { id: string; slug: string; brand: string; name: string; category: string; categorySlug: string; image: string; minFee: number }

export default function ImageCenter() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<{ slug: string; name: string; count: number }[]>([])
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api.get('/admin/images').then((res) => {
      setItems(res.data.items)
      setCategories(res.data.categories)
    })
  }, [])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return items.filter((i) => (!cat || i.categorySlug === cat) && (!t || `${i.brand} ${i.name}`.toLowerCase().includes(t)))
  }, [items, cat, q])

  const download = async (item: Item) => {
    const res = await fetch(item.image)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${item.brand}_${item.name}.webp`.replace(/[\\/:*?"<>|]/g, '_')
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-text-primary tracking-[-0.01em]">이미지 센터</h1>
          <p className="mt-1 text-[13px] text-text-secondary">블로그·SNS 글에 쓸 상품 사진이에요. 브랜드 공식몰 이미지라 오픈마켓 사진은 쓰지 마세요.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="브랜드·상품명 검색" className="pl-9 pr-3 h-10 rounded-xl bg-bg-card border border-border text-[13px] text-text-primary w-full md:w-56" />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] md:flex-wrap md:overflow-visible [&>button]:shrink-0">
        <button onClick={() => setCat('')} className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${!cat ? 'bg-text-primary text-bg-card' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}>전체 {items.length}</button>
        {categories.map((c) => (
          <button key={c.slug} onClick={() => setCat(c.slug)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${cat === c.slug ? 'bg-text-primary text-bg-card' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}>
            {c.name} {c.count}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {shown.map((i) => (
          <li key={i.id} className="group rounded-2xl bg-bg-card overflow-hidden">
            <div className="relative aspect-square bg-white">
              <Image src={i.image} alt={i.name} fill sizes="200px" className="object-contain p-4" />
              <button onClick={() => download(i)} title="다운로드" data-testid="image-download" className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-text-primary/80 text-bg-card flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[11px] text-text-tertiary">{i.brand} · {i.category}</p>
              <p className="text-[13px] text-text-primary truncate">{i.name}</p>
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-12 text-center text-[13px] text-text-secondary">조건에 맞는 이미지가 없어요.</p>}
    </div>
  )
}
