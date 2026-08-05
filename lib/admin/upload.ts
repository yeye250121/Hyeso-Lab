import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const PUBLIC_BUCKET = 'HYESO-LAB'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
// Supabase Storage 의 기본값은 no-cache 라 매 요청마다 원본을 다시 받는다.
const PUBLIC_CACHE_CONTROL = '31536000' // 1년(초)
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function uploadPublicImage(
  file: File,
  folder: 'admin/cards' | 'admin/guides'
): Promise<string> {
  const extension = IMAGE_EXTENSIONS[file.type]
  if (!extension) {
    throw new Error('JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.')
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.')
  }

  // 경로에 UUID 가 들어가 파일마다 고유하므로 장기 캐시가 안전하다.
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.storage
    .from(PUBLIC_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: PUBLIC_CACHE_CONTROL,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabaseAdmin.storage.from(PUBLIC_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
