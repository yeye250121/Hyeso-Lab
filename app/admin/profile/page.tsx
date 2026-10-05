'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import Avatar from '@/components/admin/Avatar'
import api from '@/lib/admin/api'

// 내 프로필: 채팅에 보이는 이름과 사진을 바꾼다.

const PROFILE_EVENT = 'admin-profile-changed'

// 올리기 전에 가운데를 정사각형으로 잘라 256px 로 줄인다(원본 사진은 수 MB 라 그대로 올리지 않는다)
async function toSquare(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('변환 실패'))), 'image/jpeg', 0.88)
  )
}

export default function AdminProfilePage() {
  const [loginId, setLoginId] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api
      .get('/admin/profile')
      .then((res) => {
        setLoginId(res.data.profile.loginId)
        setNickname(res.data.profile.nickname)
        setAvatarUrl(res.data.profile.avatarUrl)
      })
      .catch(() => setError('프로필을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  const done = (msg: string) => {
    setNotice(msg)
    setError('')
    window.dispatchEvent(new Event(PROFILE_EVENT))
  }

  const pickFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setNotice('')
    try {
      const blob = await toSquare(file)
      const form = new FormData()
      form.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      const res = await api.post('/admin/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAvatarUrl(res.data.avatarUrl)
      done('사진을 바꿨어요.')
    } catch {
      setError('사진을 올리지 못했어요. JPG·PNG·WEBP 이미지인지 확인해주세요.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeAvatar = async () => {
    setBusy(true)
    try {
      await api.delete('/admin/profile/avatar')
      setAvatarUrl(null)
      done('사진을 지웠어요.')
    } catch {
      setError('사진을 지우지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const saveName = async () => {
    if (!nickname.trim()) return setError('이름을 입력해주세요.')
    setBusy(true)
    try {
      await api.patch('/admin/profile', { nickname: nickname.trim() })
      done('이름을 저장했어요.')
    } catch {
      setError('이름을 저장하지 못했어요. 1~20자로 입력해주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-[520px] space-y-5">
        <div>
          <h1 className="text-headline text-text-primary">내 프로필</h1>
          <p className="text-small text-text-secondary mt-1">채팅에 보이는 이름과 사진이에요.</p>
        </div>

        {loading ? (
          <p className="text-small text-text-secondary">불러오는 중…</p>
        ) : (
          <div className="rounded-2xl bg-bg-card border border-border p-6 space-y-6">
            <div className="flex items-center gap-5">
              <Avatar name={nickname || loginId} url={avatarUrl} size={88} />
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  data-testid="avatar-file"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-button bg-action-primary text-white text-small font-medium disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> 사진 올리기
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={removeAvatar}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-button bg-bg-primary text-small text-text-secondary hover:text-text-primary disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> 사진 지우기
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-small text-text-secondary mb-1.5">이름</label>
              <div className="flex gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  data-testid="profile-nickname"
                  className="flex-1 px-4 py-2.5 rounded-button bg-bg-primary border border-border text-body text-text-primary focus:outline-none focus:border-action-primary"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveName}
                  className="px-4 rounded-button bg-bg-primary text-small font-medium text-text-primary hover:bg-border disabled:opacity-50"
                >
                  저장
                </button>
              </div>
              <p className="mt-2 text-[12px] text-text-secondary">로그인 아이디: {loginId}</p>
            </div>

            {notice && <p className="text-small text-action-primary">{notice}</p>}
            {error && <p className="text-small text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
