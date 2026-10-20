'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import api from '@/lib/admin/api'
import { Plus, Edit2, Trash2, Eye, EyeOff, Filter, Settings, X, Check, GripVertical } from 'lucide-react'
import { useConsole } from '@/lib/admin/useConsole'

interface Category {
  id: string
  name: string
  slug: string
  display_order: number
  guideCount?: number
}

interface Guide {
  id: number
  title: string
  slug: string
  isPublished: boolean
  categoryId: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
}

export default function GuidesPage() {
  const { path: cp } = useConsole()
  const router = useRouter()
  const [guides, setGuides] = useState<Guide[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | 'all' | 'uncategorized'>('all')

  // Category management modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [guidesRes, categoriesRes] = await Promise.all([
        api.get('/admin/guides'),
        api.get('/admin/categories'),
      ])
      setGuides(guidesRes.data.guides)
      setCategories(categoriesRes.data.categories)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePublish = async (guide: Guide) => {
    try {
      await api.put(`/admin/guides/${guide.id}`, {
        isPublished: !guide.isPublished,
      })
      setGuides((prev) =>
        prev.map((g) =>
          g.id === guide.id ? { ...g, isPublished: !g.isPublished } : g
        )
      )
    } catch (error) {
      console.error('Failed to toggle publish:', error)
      alert('상태 변경에 실패했습니다')
    }
  }

  const handleDelete = async (guideId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/admin/guides/${guideId}`)
      fetchData()
    } catch (error) {
      console.error('Failed to delete guide:', error)
      alert('삭제에 실패했습니다')
    }
  }

  // Filter guides by category
  const filteredGuides = guides.filter((guide) => {
    if (selectedCategoryFilter === 'all') return true
    if (selectedCategoryFilter === 'uncategorized') return !guide.categoryId
    return guide.categoryId === selectedCategoryFilter
  })

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError('카테고리명을 입력해주세요')
      return
    }

    setIsAddingCategory(true)
    setCategoryError('')

    try {
      await api.post('/admin/categories', { name: newCategoryName.trim() })
      setNewCategoryName('')
      fetchData()
    } catch (err: any) {
      setCategoryError(err.response?.data?.error || '카테고리 추가 실패')
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
  }

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryName('')
  }

  const handleSaveEditCategory = async (categoryId: string) => {
    if (!editingCategoryName.trim()) return

    try {
      await api.put(`/admin/categories/${categoryId}`, { name: editingCategoryName.trim() })
      setEditingCategoryId(null)
      setEditingCategoryName('')
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || '수정 실패')
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    const guideCount = guides.filter((g) => g.categoryId === category.id).length
    const message = guideCount > 0
      ? `"${category.name}" 카테고리에 ${guideCount}개의 가이드가 있습니다.\n삭제하면 해당 가이드들은 "미분류"로 변경됩니다.\n정말 삭제하시겠습니까?`
      : `"${category.name}" 카테고리를 삭제하시겠습니까?`

    if (!confirm(message)) return

    try {
      await api.delete(`/admin/categories/${category.id}`)
      if (selectedCategoryFilter === category.id) {
        setSelectedCategoryFilter('all')
      }
      fetchData()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('삭제에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-headline text-text-primary">가이드 관리</h1>
          <button
            onClick={() => router.push(cp('/guides/new'))}
            className="flex items-center gap-2 px-4 py-2 bg-action-primary text-white rounded-button text-body hover:bg-action-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            가이드 작성
          </button>
        </div>

        {/* Category Filter */}
        <div className="bg-bg-card rounded-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="flex items-center gap-2 text-text-secondary">
                <Filter className="w-4 h-4" />
                <span className="text-small">카테고리:</span>
              </div>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full text-small transition-colors ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-action-primary text-white'
                    : 'bg-bg-primary text-text-secondary hover:bg-border'
                }`}
              >
                전체 ({guides.length})
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('uncategorized')}
                className={`px-3 py-1.5 rounded-full text-small transition-colors ${
                  selectedCategoryFilter === 'uncategorized'
                    ? 'bg-action-primary text-white'
                    : 'bg-bg-primary text-text-secondary hover:bg-border'
                }`}
              >
                미분류 ({guides.filter((g) => !g.categoryId).length})
              </button>
              {categories.map((category) => {
                const count = guides.filter((g) => g.categoryId === category.id).length
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryFilter(category.id)}
                    className={`px-3 py-1.5 rounded-full text-small transition-colors ${
                      selectedCategoryFilter === category.id
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-primary text-text-secondary hover:bg-border'
                    }`}
                  >
                    {category.name} ({count})
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-text-secondary hover:text-action-primary hover:bg-bg-primary rounded-button text-small transition-colors flex-shrink-0"
              title="카테고리 관리"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">관리</span>
            </button>
          </div>
        </div>

        {/* Guides List */}
        <div className="bg-bg-card rounded-card overflow-hidden">
          {filteredGuides.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-body text-text-primary font-medium truncate">
                        {guide.title}
                      </h3>
                      {guide.category && (
                        <span className="px-2 py-0.5 bg-action-primary/10 text-action-primary rounded-full text-small">
                          {guide.category.name}
                        </span>
                      )}
                      {guide.isPublished ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-small">
                          공개
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-small">
                          비공개
                        </span>
                      )}
                    </div>
                    <p className="text-small text-text-tertiary">
                      /{guide.slug} · {new Date(guide.updatedAt).toLocaleDateString('ko-KR')} 수정
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePublish(guide)}
                      className="p-2 text-text-secondary hover:text-action-primary transition-colors"
                      title={guide.isPublished ? '비공개로 전환' : '공개로 전환'}
                    >
                      {guide.isPublished ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => router.push(cp(`/guides/${guide.id}`))}
                      className="p-2 text-text-secondary hover:text-action-primary transition-colors"
                      title="수정"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(guide.id)}
                      className="p-2 text-text-secondary hover:text-error transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-text-secondary text-center py-8">
              {selectedCategoryFilter === 'all'
                ? '가이드가 없습니다'
                : '해당 카테고리에 가이드가 없습니다'}
            </p>
          )}
        </div>

        {/* Category Management Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-card w-full max-w-lg max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-title text-text-primary">카테고리 관리</h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false)
                    setNewCategoryName('')
                    setCategoryError('')
                    setEditingCategoryId(null)
                    setEditingCategoryName('')
                  }}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Category */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    placeholder="새 카테고리명 입력"
                    className="flex-1 px-4 py-2.5 bg-bg-primary rounded-button text-body text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-action-primary"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={isAddingCategory}
                    className="flex items-center gap-2 px-4 py-2.5 bg-action-primary text-white rounded-button text-body hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    추가
                  </button>
                </div>
                {categoryError && (
                  <p className="text-small text-error mt-2">{categoryError}</p>
                )}
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto">
                {categories.length > 0 ? (
                  <div className="divide-y divide-border">
                    {categories.map((category) => {
                      const guideCount = guides.filter((g) => g.categoryId === category.id).length
                      return (
                        <div
                          key={category.id}
                          className="p-4 flex items-center gap-4"
                        >
                          <GripVertical className="w-5 h-5 text-text-tertiary" />

                          <div className="flex-1 min-w-0">
                            {editingCategoryId === category.id ? (
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditCategory(category.id)
                                  if (e.key === 'Escape') handleCancelEditCategory()
                                }}
                                autoFocus
                                className="w-full px-3 py-1.5 bg-bg-primary rounded text-body text-text-primary focus:ring-2 focus:ring-action-primary"
                              />
                            ) : (
                              <div>
                                <h3 className="text-body text-text-primary font-medium">
                                  {category.name}
                                </h3>
                                <p className="text-small text-text-tertiary">
                                  {guideCount}개의 가이드
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {editingCategoryId === category.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEditCategory(category.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="저장"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={handleCancelEditCategory}
                                  className="p-2 text-text-secondary hover:bg-bg-primary rounded transition-colors"
                                  title="취소"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEditCategory(category)}
                                  className="p-2 text-text-secondary hover:text-action-primary transition-colors"
                                  title="수정"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  className="p-2 text-text-secondary hover:text-error transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-body text-text-secondary mb-2">
                      아직 카테고리가 없습니다
                    </p>
                    <p className="text-small text-text-tertiary">
                      위에서 새 카테고리를 추가해보세요
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
