'use server'

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveCard(formData: any) {
  const isNew = !formData.id_exists;
  
  const payload = {
    id: formData.id,
    promo: formData.promo,
    name: formData.name,
    company: formData.company,
    type: formData.type,
    condition: formData.condition,
    fees: formData.fees,
    card_image_url: formData.card_image_url,
    detailed_benefits: formData.detailed_benefits,
    // benefits is expected to be an array of strings
    benefits: typeof formData.benefits === 'string' 
      ? formData.benefits.split('\\n').filter(Boolean)
      : formData.benefits
  };

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
