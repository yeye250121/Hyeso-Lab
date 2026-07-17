'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { saveCard } from '@/app/admin/cards/actions';

export default function CardForm({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      id: initialData?.id || '',
      id_exists: !!initialData,
      name: initialData?.name || '',
      company: initialData?.company || '',
      type: initialData?.type || '',
      promo: initialData?.promo || '',
      condition: initialData?.condition || '',
      fees: initialData?.fees || '',
      benefits: initialData?.benefits?.join('\n') || '',
      card_image_url: initialData?.card_image_url || '',
      detailed_benefits: initialData?.detailed_benefits || ''
    }
  });

  const detailedBenefits = watch('detailed_benefits');
  const imageUrl = watch('card_image_url');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await saveCard(data);
    } catch (e) {
      alert('저장 실패!');
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `card-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('HYESO-LAB')
      .upload(filePath, file);

    if (uploadError) {
      alert('이미지 업로드 실패: ' + uploadError.message);
    } else {
      const { data } = supabase.storage.from('HYESO-LAB').getPublicUrl(filePath);
      setValue('card_image_url', data.publicUrl);
    }
    setUploadingImage(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카드 ID (고유값)</label>
            <input 
              {...register('id', { required: true })} 
              readOnly={!!initialData}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카드명</label>
            <input {...register('name', { required: true })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카드사</label>
            <input {...register('company', { required: true })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">분류 (예: 신용카드)</label>
            <input {...register('type')} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">프로모션 문구</label>
            <input {...register('promo')} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">실적 조건</label>
            <input {...register('condition')} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연회비</label>
            <input {...register('fees')} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-1">메인 혜택 (리스트 페이지용 - 줄바꿈으로 구분)</label>
        <textarea {...register('benefits')} rows={4} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" placeholder="스타벅스 50% 할인\n대중교통 10% 할인" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-3">카드 이미지 업로드</label>
        <div className="flex items-center gap-6">
          {imageUrl && (
            <div className="w-32 h-48 bg-gray-50 border rounded-lg p-2 flex items-center justify-center shrink-0">
              <img src={imageUrl} alt="preview" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div className="flex-1">
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
            <input type="hidden" {...register('card_image_url')} />
            {uploadingImage && <p className="text-sm text-blue-600 mt-2">업로드 중...</p>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-3">상세 혜택 (상세 페이지용)</label>
        <div className="min-h-[400px] border rounded-lg overflow-hidden">
          <TipTapEditor value={detailedBenefits} onChange={(val) => setValue('detailed_benefits', val)} />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="submit" disabled={loading} className="bg-[var(--action-primary)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--action-primary-hover)] transition-colors disabled:opacity-50">
          {loading ? '저장 중...' : '카드 저장'}
        </button>
      </div>
    </form>
  );
}
