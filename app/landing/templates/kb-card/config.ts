/**
 * KB 화물복지카드 랜딩페이지 설정
 */
export const config = {
  // 메타 정보
  meta: {
    title: 'KB국민 화물복지카드',
    description: '화물차 유가보조금 카드 신청 및 상담',
  },

  // 추적 설정 (임시 ID)
  tracking: {
    kakaoPixelId: '', // 필요 시 추가
  },

  // 히어로 이미지
  heroImage: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/KB_logo.svg/2560px-KB_logo.svg.png', 
    alt: 'KB 화물복지카드',
  },

  // 폼 설정
  form: {
    showInstallation: false,  // 설치예약 탭 미사용
    showConsultation: true,  // 상담신청 탭 표시
    defaultTab: 'consultation' as const,
  },

  // subtype별 설정 오버라이드
  subtypes: {
    '1': {
      // 기본형
      form: {
        showInstallation: false,
        showConsultation: true,
        defaultTab: 'consultation' as const,
      },
    },
  },
};

export type KbCardConfig = typeof config;
export type KbCardSubtype = keyof typeof config.subtypes;
