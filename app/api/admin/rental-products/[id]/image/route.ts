import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import sharp from 'sharp'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ELECTRONICS_CACHE_TAG } from '@/lib/electronicsApi'
import { requireAdmin, routeError, unauthorizedResponse } from '@/lib/admin/route'

export const runtime = 'nodejs'

const MAX_BYTES = 8 * 1024 * 1024

// 상품 대표 사진 교체. 900px webp 로 변환해 Storage 에 올리고 image_urls 를 갱신한다.
// 같은 경로에 덮어쓰므로 주소 끝에 ?v= 를 붙인다 — 붙이지 않으면 이미지 최적화 캐시(31일)가
// 옛 사진을 계속 내보낸다.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return unauthorizedResponse()

  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: '이미지 파일을 선택해주세요.' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: '8MB 이하 이미지만 올릴 수 있습니다.' }, { status: 400 })
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      return NextResponse.json({ error: 'PNG, JPG, WEBP 만 올릴 수 있습니다.' }, { status: 400 })
    }

    const db = getSupabaseAdmin()
    const { data: product, error: findError } = await db
      .from('electronics_products')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()
    if (findError) throw findError
    if (!product) return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 })

    const webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .webp({ quality: 82 })
      .toBuffer()

    const objectPath = `products/${product.id}.webp`
    const up = await db.storage
      .from('HYESO-LAB')
      .upload(objectPath, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' })
    if (up.error) throw up.error

    const url = `${db.storage.from('HYESO-LAB').getPublicUrl(objectPath).data.publicUrl}?v=${Date.now()}`
    const { error } = await db.from('electronics_products').update({ image_urls: [url] }).eq('id', product.id)
    if (error) throw error

    revalidateTag(ELECTRONICS_CACHE_TAG)
    return NextResponse.json({ ok: true, image: url })
  } catch (error) {
    return routeError('Admin Rental Product Image', error, '사진을 올리지 못했습니다.')
  }
}
