'use client'

import { useState } from 'react'
import api from '@/lib/admin/api'
import { Key } from 'lucide-react'

export default function InviteKeyGenerator() {
  const [inviteKey, setInviteKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await api.post('/admin/auth/invite')
      setInviteKey(res.data.key)
    } catch (err: any) {
      setError(err.response?.data?.error || '발급 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteKey)
    alert('인증 키가 복사되었습니다.')
  }

  return (
    <div className="bg-bg-card rounded-card p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-title text-text-primary">관리자 초대 키 발급</h2>
          <p className="text-small text-text-secondary">새로운 관리자가 가입할 때 필요한 1시간짜리 인증 키를 발급합니다.</p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {!inviteKey ? (
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-4 py-2 bg-action-primary text-white rounded-button hover:bg-action-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? '발급 중...' : '새 인증 키 발급하기'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <code className="px-4 py-2 bg-gray-100 rounded-lg text-lg font-mono text-gray-800 border border-gray-200">
            {inviteKey}
          </code>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-gray-800 text-white rounded-button hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            복사하기
          </button>
          <button
            onClick={() => setInviteKey('')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-button hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
