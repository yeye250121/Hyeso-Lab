'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ExternalLink, ImagePlus, RefreshCw, Search } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'

interface Product {
  id: string
  slug: string
  brand: string
  modelCode: string
  name: string
  image: string | null
  isActive: boolean
  categorySlug: string | null
  categoryName: string | null
  minFee: number | null
}

const PAGE = 60

export default function RentalProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [state, setState] = useState('active')
  const [q, setQ] = useState('')
  const [visible, setVisible] = useState(PAGE)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/rental-products')
      setProducts(res.data.products)
      setCategories(res.data.categories)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'ko')), [products])

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    return products.filter((p) => {
      if (category && p.categorySlug !== category) return false
      if (brand && p.brand !== brand) return false
      if (state === 'active' && !p.isActive) return false
      if (state === 'inactive' && p.isActive) return false
      if (state === 'noimage' && (p.image || !p.isActive)) return false
      if (k && !`${p.name} ${p.modelCode} ${p.brand}`.toLowerCase().includes(k)) return false
      return true
    })
  }, [products, category, brand, state, q])

  useEffect(() => setVisible(PAGE), [category, brand, state, q])

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 2500)
  }

  const toggleActive = async (p: Product) => {
    if (p.isActive && !confirm(`"${p.brand} ${p.name}" 판매를 중지할까요? 사이트에서 바로 사라집니다.`)) return
    setBusyId(p.id)
    try {
      await api.patch(`/admin/rental-products/${p.id}`, { isActive: !p.isActive })
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)))
      flash(p.isActive ? '판매를 중지했습니다.' : '판매를 재개했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const pickImage = (id: string) => {
    uploadTarget.current = id
    fileRef.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = uploadTarget.current
    e.target.value = ''
    if (!file || !id) return
    setBusyId(id)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/admin/rental-products/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, image: res.data.image } : x)))
      flash('사진을 교체했습니다.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      flash(msg ?? '사진을 올리지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const revalidate = async () => {
    await api.post('/admin/revalidate')
    flash('사이트에 바로 반영했습니다.')
  }

  const counts = {
    active: products.filter((p) => p.isActive).length,
    inactive: products.filter((p) => !p.isActive).length,
    noimage: products.filter((p) => p.isActive && !p.image).length,
  }

  return (
    <AdminLayout>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
      <div className="space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-headline text-text-primary">렌탈 상품</h1>
            <p className="text-small text-text-secondary mt-1">
              판매 중 {counts.active}개 · 판매 중지 {counts.inactive}개 · 사진 없음 {counts.noimage}개
            </p>
          </div>
          <button onClick={revalidate} className="flex items-center gap-1.5 px-4 py-2 rounded-button bg-action-primary text-white text-small font-medium">
            <RefreshCw className="w-4 h-4" /> 사이트에 바로 반영
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={state} onChange={(e) => setState(e.target.value)} className="px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
            <option value="active">판매 중</option>
            <option value="noimage">사진 없음</option>
            <option value="inactive">판매 중지</option>
            <option value="">전체</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="px-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary">
            <option value="">전체 브랜드</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="상품명·모델코드 검색" className="w-full pl-9 pr-3 py-2 rounded-button bg-bg-card border border-border text-small text-text-primary" />
          </div>
        </div>

        <div className="bg-bg-card rounded-card overflow-x-auto">
          <table className="w-full min-w-[820px] text-small">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="px-4 py-3 font-medium w-[72px]">사진</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium text-right">월 최저가</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-secondary">불러오는 중…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-secondary">조건에 맞는 상품이 없습니다.</td></tr>
              )}
              {!loading &&
                filtered.slice(0, visible).map((p) => (
                  <tr key={p.id} className={`border-b border-border last:border-0 ${p.isActive ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-2.5">
                      <button onClick={() => pickImage(p.id)} disabled={busyId === p.id} title="사진 교체" className="relative w-12 h-12 rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center group">
                        {p.image ? (
                          <Image src={p.image} alt="" fill sizes="48px" className="object-contain p-0.5" />
                        ) : (
                          <ImagePlus className="w-5 h-5 text-text-tertiary" />
                        )}
                        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white text-[10px]">교체</span>
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-text-primary">{p.brand} {p.name}</p>
                      <p className="text-xs text-text-secondary">{p.modelCode}</p>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">{p.categoryName ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-text-primary whitespace-nowrap">{p.minFee ? `${p.minFee.toLocaleString()}원` : '-'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? '판매 중' : '판매 중지'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      {p.isActive && p.categorySlug && (
                        <a href={`/electronics/${p.categorySlug}/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mr-3 text-text-secondary hover:text-text-primary">
                          <ExternalLink className="w-3.5 h-3.5" /> 보기
                        </a>
                      )}
                      <button onClick={() => toggleActive(p)} disabled={busyId === p.id} className={`px-3 py-1.5 rounded-button text-xs font-medium border border-border disabled:opacity-40 ${p.isActive ? 'text-error' : 'text-text-primary'}`}>
                        {p.isActive ? '판매 중지' : '판매 재개'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {filtered.length > visible && (
          <button onClick={() => setVisible((v) => v + PAGE)} className="w-full py-3 rounded-button bg-bg-card text-small text-text-primary">
            더 보기 ({visible}/{filtered.length})
          </button>
        )}
      </div>

      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#333d4b] text-white text-small shadow-lg">{notice}</div>
      )}
    </AdminLayout>
  )
}
