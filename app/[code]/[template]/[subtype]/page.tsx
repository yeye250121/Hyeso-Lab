'use client';

import { useParams, notFound } from 'next/navigation';
import { Suspense } from 'react';

// 템플릿별 컴포넌트 동적 import
import KtCctvLanding from '@/app/landing/templates/kt-cctv';
import KbCardLanding from '@/app/landing/templates/kb-card';

/**
 * /{파트너코드}/{템플릿}/{서브타입} 실제 랜딩페이지
 *
 * 예시:
 * /A00001/kt-cctv/1 → KT CCTV 템플릿 서브타입 1
 * /A00001/kt-cctv/2 → KT CCTV 템플릿 서브타입 2
 */

// 지원하는 템플릿 목록
const SUPPORTED_TEMPLATES = ['kt-cctv', 'kb-card'] as const;
type SupportedTemplate = typeof SUPPORTED_TEMPLATES[number];

function LandingContent() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const template = params.template as string;
  const subtype = params.subtype as string;

  // 지원하지 않는 템플릿이면 404
  if (!SUPPORTED_TEMPLATES.includes(template as SupportedTemplate)) {
    notFound();
  }

  // 템플릿별 컴포넌트 렌더링
  switch (template) {
    case 'kt-cctv':
      return (
        <KtCctvLanding
          marketerCode={code}
          template={template}
          subtype={subtype}
        />
      );
    case 'kb-card':
      return (
        <KbCardLanding
          marketerCode={code}
          template={template}
          subtype={subtype}
        />
      );
    default:
      notFound();
  }
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">로딩 중...</p>
        </div>
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
