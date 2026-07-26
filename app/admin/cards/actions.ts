'use server'

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminToken } from '@/lib/admin/auth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const cardSchema = z.object({
  id: z.string().trim().min(1).max(200),
  id_exists: z.boolean().optional(),
  promo: z.string().max(500).optional().default(''),
  name: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(100),
  type: z.string().max(100).optional().default(''),
  condition: z.string().max(1000).optional().default(''),
  fees: z.string().max(500).optional().default(''),
  card_image_url: z.string().url().or(z.literal('')).optional().default(''),
  official_product_url: z.string().url().or(z.literal('')).optional().default(''),
  detailed_benefits: z.string().max(200_000).optional().default(''),
  benefits: z.union([z.string(), z.array(z.unknown())]).optional().default([]),
});

export async function saveCard(formData: any) {
  const token = cookies().get('admin-token')?.value;
  if (!token || !verifyAdminToken(token)) {
    redirect('/admin/login');
  }

  const parsed = cardSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error('카드 입력값이 올바르지 않습니다.');
  }
  const data = parsed.data;

  const payload = {
    id: data.id,
    promo: data.promo,
    name: data.name,
    company: data.company,
    type: data.type,
    condition: data.condition,
    fees: data.fees,
    card_image_url: data.card_image_url || null,
    official_product_url: data.official_product_url || null,
    detailed_benefits: data.detailed_benefits || null,
    benefits: typeof data.benefits === 'string'
      ? data.benefits.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
      : data.benefits
  };

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('cards').upsert(payload);
  
  if (error) {
    console.error("Error saving card:", error);
    throw new Error('Failed to save card');
  }

  revalidatePath('/admin/cards');
  revalidatePath('/card/list/all-card');
  revalidatePath(`/card/detail/${payload.id}`);
  
  redirect('/admin/cards');
}
