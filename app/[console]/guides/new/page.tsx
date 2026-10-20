'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { ArrowLeft, Save, Plus, X, ChevronDown } from 'lucide-react'
import { useConsole } from '@/lib/admin/useConsole'

// Dynamic import to avoid SSR issues with TipTap
const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-border rounded-card p-8 bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewGuidePage() {
  const { path: cp } = useConsole()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Category state
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsCreatingCategory(true)
    try {
      const response = await api.post('/admin/categories', { name: newCategoryName.trim() })
      const newCategory = response.data.category
      setCategories([...categories, newCategory])
      setSelectedCategoryId(newCategory.id)
      setNewCategoryName('')
      setShowCategoryDropdown(false)
    } catch (err: any) {
      alert(err.response?.data?.error || '카테고리 생성 실패')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요')
      return
    }
    if (!slug.trim()) {
      setError('슬러그를 입력해주세요')
      return
    }
    if (!content.trim() || content === '<p></p>') {
      setError('내용을 입력해주세요')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await api.post('/admin/guides', {
        title,
        slug,
        content,
        isPublished,
        categoryId: selectedCategoryId,
      })
      router.push(cp('/guides'))
    } catch (err: any) {
      setError(err.response?.data?.error || '저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-headline text-text-primary">새 가이드 작성</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-action-primary text-white rounded-button text-body hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="bg-bg-card rounded-card p-6 space-y-4">
          <div>
            <label className="block text-small text-text-secondary mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary"
              placeholder="가이드 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-small text-text-secondary mb-2">
              슬러그 (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-body text-text-tertiary">/guides/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-4 py-3 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary"
                placeholder="url-slug"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-small text-text-secondary mb-2">
              카테고리
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-bg-primary rounded-button text-body text-left focus:ring-2 focus:ring-action-primary"
              >
                <span className={selectedCategory ? 'text-text-primary' : 'text-text-tertiary'}>
                  {selectedCategory?.name || '카테고리 선택 (선택사항)'}
                </span>
                <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-card border border-border shadow-lg max-h-64 overflow-y-auto">
                  {/* 미분류 옵션 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(null)
                      setShowCategoryDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-body hover:bg-bg-primary transition-colors ${
                      selectedCategoryId === null ? 'bg-action-primary/10 text-action-primary' : 'text-text-secondary'
                    }`}
                  >
                    미분류
                  </button>

                  {/* 기존 카테고리 목록 */}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(category.id)
                        setShowCategoryDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-body hover:bg-bg-primary transition-colors ${
                        selectedCategoryId === category.id ? 'bg-action-primary/10 text-action-primary' : 'text-text-primary'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}

                  {/* 새 카테고리 추가 */}
                  <div className="border-t border-border p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                        placeholder="새 카테고리 이름"
                        className="flex-1 px-3 py-2 text-small bg-bg-primary rounded border border-border focus:ring-2 focus:ring-action-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                        className="p-2 bg-action-primary text-white rounded hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedCategory && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-action-primary/10 text-action-primary rounded-full text-small">
                  {selectedCategory.name}
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="hover:bg-action-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-5 h-5 rounded border-border text-action-primary focus:ring-action-primary"
            />
            <label htmlFor="isPublished" className="text-body text-text-primary">
              바로 공개
            </label>
          </div>
        </div>

        <div>
          <label className="block text-small text-text-secondary mb-2">
            내용
          </label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        {error && (
          <p className="text-small text-error text-center">{error}</p>
        )}
      </div>
    </AdminLayout>
  )
}
