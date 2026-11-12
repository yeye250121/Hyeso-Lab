import { getSupabaseAdmin } from '@/lib/supabase-admin'

// 이미지 센터 템플릿 묶음. 원본 바이트는 스토리지(templates/<folder>/NN.ext), 한글 파일명은 매니페스트에.
export type TemplateFile = { key: string; name: string; size: number; width: number; height: number; type: string }
export type TemplateGroup = { id: string; name: string; folder: string; description: string | null; files: (TemplateFile & { url: string })[] }

const BUCKET = 'HYESO-LAB'

export function publicUrl(key: string): string {
  return getSupabaseAdmin().storage.from(BUCKET).getPublicUrl(key).data.publicUrl
}

export async function listTemplates(): Promise<TemplateGroup[]> {
  const { data, error } = await getSupabaseAdmin().from('marketing_templates').select('id, name, folder, description, files').order('sort_order').order('created_at')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    folder: r.folder as string,
    description: (r.description as string | null) ?? null,
    files: ((r.files as TemplateFile[]) ?? []).map((f) => ({ ...f, url: publicUrl(f.key) })),
  }))
}

export async function getTemplate(id: string): Promise<TemplateGroup | null> {
  const all = await listTemplates()
  return all.find((t) => t.id === id) ?? null
}

/** 스토리지에서 원본 바이트를 그대로 받는다(재인코딩 없음) */
export async function downloadTemplateFile(key: string): Promise<Uint8Array> {
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).download(key)
  if (error || !data) throw error ?? new Error('download failed')
  return new Uint8Array(await data.arrayBuffer())
}
