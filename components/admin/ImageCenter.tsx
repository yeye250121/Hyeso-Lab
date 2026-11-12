'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, FileArchive, Search } from 'lucide-react'
import api from '@/lib/admin/api'

// 이미지 센터. 토스플레이스 이미지 센터처럼 카테고리 탭 + 썸네일 격자 + 다운로드.
type Item = { id: string; slug: string; brand: string; name: string; category: string; categorySlug: string; image: string; minFee: number }
type TemplateFile = { key: string; name: string; size: number; width: number; height: number; type: string; url: string }
type Template = { id: string; name: string; folder: string; description: string | null; files: TemplateFile[] }

// 받은 바이트를 그대로 저장한다(재인코딩 없음). 다른 도메인이라 <a download> 는 안 먹는다.
async function saveBlob(url: string, filename: string) {
  const blob = await (await fetch(url, { credentials: 'same-origin' })).blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
const mb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`)

export default function ImageCenter() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<{ slug: string; name: string; count: number }[]>([])
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [zipping, setZipping] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/images').then((res) => {
      setItems(res.data.items)
      setCategories(res.data.categories)
    })
    api.get('/admin/images/templates').then((res) => setTemplates(res.data.templates)).catch(() => {})
  }, [])

  // ZIP 은 서버가 원본 바이트를 무압축으로 묶는다. 파일명·해상도 그대로.
  const downloadZip = async (t: Template) => {
    setZipping(t.id)
    try {
      await saveBlob(`/api/admin/images/templates/zip?id=${t.id}`, `${t.name}.zip`)
    } finally {
      setZipping(null)
    }
  }

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

      {templates.length > 0 && (
        <section className="space-y-3" data-testid="template-section">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary">템플릿</h2>
            <p className="mt-0.5 text-[13px] text-text-secondary">블로그 최상단에 붙이는 이미지 묶음이에요. ZIP 으로 받으면 원본 해상도와 파일명이 그대로예요.</p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((t) => (
              <li key={t.id} className="rounded-2xl bg-bg-card p-4" data-testid="template-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-text-primary truncate">{t.name}</p>
                    <p className="mt-0.5 text-[12px] text-text-tertiary">{t.files.length}장 · {mb(t.files.reduce((n, f) => n + f.size, 0))}</p>
                    {t.description && <p className="mt-1.5 text-[13px] text-text-secondary">{t.description}</p>}
                  </div>
                  <button type="button" onClick={() => downloadZip(t)} disabled={zipping === t.id} data-testid="template-zip" className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-action-primary text-white text-[13px] font-semibold disabled:opacity-60">
                    <FileArchive className="w-4 h-4" /> {zipping === t.id ? '묶는 중…' : 'ZIP 다운로드'}
                  </button>
                </div>
                <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {t.files.map((f, i) => (
                    <li key={f.key} className="relative shrink-0 w-[96px]">
                      <div className="relative h-[128px] rounded-xl bg-white overflow-hidden ring-1 ring-black/[0.04]">
                        {/* 세로로 긴 템플릿이라 위쪽만 보여준다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt={f.name} className="absolute inset-x-0 top-0 w-full h-auto" loading="lazy" />
                        <button type="button" onClick={() => saveBlob(f.url, f.name)} title={`${f.name} 저장`} aria-label={`${f.name} 저장`} data-testid="template-file-download" className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-text-primary/80 text-bg-card flex items-center justify-center">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-text-tertiary text-center">{i + 1}장 · {f.width}×{f.height}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <h2 className="pt-2 text-[17px] font-bold text-text-primary">상품 사진</h2>
        </section>
      )}

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
