import { NextRequest, NextResponse } from 'next/server';
import { inquiryRequestSchema, reservationRequestSchema } from '@/app/landing/lib/validations';
import { appendInquiryToSheet } from '@/app/landing/lib/google-sheets';
import { sendSlackNotification } from '@/app/landing/lib/slack';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendPartnerNewInquiryAlimtalk, sendCustomerInquiryAlimtalks } from '@/lib/alimtalk-service';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // 새로운 형식(inquiryType 포함)인지 기존 형식인지 확인
    const isNewFormat = 'inquiryType' in body;

    if (isNewFormat) {
      // 새로운 통합 스키마로 검증
      const validationResult = reservationRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: '입력 데이터가 유효하지 않습니다',
            errors: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const data = validationResult.data;
      const isInstallation = data.inquiryType === 'installation';

      // Supabase에 저장
      const insertData: Record<string, unknown> = {
        referrer_url: data.referrerUrl || null,
        phone_number: data.phoneNumber,
        privacy_consent: data.privacyConsent,
        marketer_code: data.marketerCode || null,
        inquiry_type: data.inquiryType,
        submitted_at: new Date().toISOString(),
        landing_template: data.landingTemplate || 'kt-cctv',
        landing_subtype: data.landingSubtype || '1',
      };

      // 설치 예약인 경우 추가 필드
      if (isInstallation) {
        insertData.reservation_date = data.reservationDate;
        insertData.reservation_time_slot = data.reservationTimeSlot;
        insertData.outdoor_count = data.outdoorCount || 0;
        insertData.indoor_count = data.indoorCount || 0;
        insertData.install_count = (data.outdoorCount || 0) + (data.indoorCount || 0);
        insertData.address = data.address;
        insertData.address_detail = data.addressDetail || null;
        insertData.zonecode = data.zonecode || null;
        insertData.install_location = data.address; // 하위 호환성
        insertData.documents = data.documents || {};
        insertData.documents_submitted = data.documentsSubmitted || false;
        insertData.status = data.documentsSubmitted ? 'documents_submitted' : 'new';
      } else {
        // 상담 신청 - 폼에서 입력한 설치 희망 지역 사용
        insertData.install_location = data.installLocation || data.address || null;
        insertData.install_count = data.installCount || 0;
        insertData.documents = data.documents || {}; // 문서(추가 정보) 저장 허용
        insertData.status = 'new';
      }

      const { data: savedData, error } = await supabaseAdmin
        .from('inquiries')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ Supabase 저장 오류:', error);
        throw new Error('데이터베이스 저장에 실패했습니다');
      }

      // Slack 알림 전송 (비동기)
      const slackData = {
        phoneNumber: data.phoneNumber,
        installLocation: isInstallation ? data.address : '상담 요청',
        installCount: isInstallation ? (data.outdoorCount || 0) + (data.indoorCount || 0) : 0,
        privacyConsent: data.privacyConsent,
        referrerUrl: data.referrerUrl,
        marketerCode: data.marketerCode,
        // 추가 정보
        inquiryType: data.inquiryType,
        reservationDate: data.reservationDate,
        reservationTimeSlot: data.reservationTimeSlot,
      };

      sendSlackNotification(slackData).catch((error) => {
        console.error('⚠️ Slack 알림 전송 중 오류:', error);
      });

      // 파트너에게 알림톡 발송 (마케터 코드가 있는 경우)
      const marketerCode = data.marketerCode
      if (marketerCode) {
        try {
          console.log('[Inquiry] 파트너 알림톡 발송 시작:', marketerCode)
          const { data: partner } = await supabaseAdmin
            .from('users')
            .select('phone')
            .eq('unique_code', marketerCode.toUpperCase())
            .single()

          if (partner?.phone) {
            console.log('[Inquiry] 파트너 전화번호 조회 성공:', partner.phone.slice(0, 7) + '****')
            await sendPartnerNewInquiryAlimtalk(partner.phone)
            console.log('[Inquiry] 알림톡 발송 완료')
          } else {
            console.log('[Inquiry] 파트너 전화번호 없음')
          }
        } catch (error) {
          console.error('⚠️ 파트너 알림톡 발송 실패:', error)
        }
      }

      // 고객에게 알림톡 발송 (문의 접수 + 예약 안내)
      // KB 카드는 고객 알림톡 발송 제외
      if (data.landingTemplate !== 'kb-card') {
        try {
          console.log('[Inquiry] 고객 알림톡 발송 시작:', data.phoneNumber.slice(0, 7) + '****')
          const customerAlimtalkResult = await sendCustomerInquiryAlimtalks(data.phoneNumber)
          console.log('[Inquiry] 고객 알림톡 발송 결과:', customerAlimtalkResult)
        } catch (error) {
          console.error('⚠️ 고객 알림톡 발송 실패:', error)
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: isInstallation ? '설치 예약이 신청되었습니다' : '상담 신청이 접수되었습니다',
          data: savedData?.[0],
        },
        { status: 200 }
      );
    } else {
      // 기존 형식 처리 (하위 호환성)
      const validationResult = inquiryRequestSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: '입력 데이터가 유효하지 않습니다',
            errors: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      // Supabase에 저장 (서버사이드이므로 admin client 사용)
      const { data, error } = await supabaseAdmin
        .from('inquiries')
        .insert([
          {
            referrer_url: validationResult.data.referrerUrl || null,
            phone_number: validationResult.data.phoneNumber,
            install_location: validationResult.data.installLocation,
            install_count: validationResult.data.installCount,
            privacy_consent: validationResult.data.privacyConsent,
            submitted_at: validationResult.data.submittedAt || new Date().toISOString(),
            marketer_code: validationResult.data.marketerCode || null,
            inquiry_type: 'consultation', // 기존 형식은 상담으로 처리
          },
        ])
        .select();

      if (error) {
        console.error('❌ Supabase 저장 오류:', error);
        throw new Error('데이터베이스 저장에 실패했습니다');
      }

      // Google Sheets에도 저장 (기존 기능 유지)
      appendInquiryToSheet(validationResult.data).catch((error) => {
        console.error('⚠️ Google Sheets 저장 중 오류 (메인 프로세스는 정상):', error);
      });

      // 🔔 Slack 알림 전송 (비동기, 실패해도 전체 프로세스는 계속 진행)
      sendSlackNotification(validationResult.data).catch((error) => {
        console.error('⚠️ Slack 알림 전송 중 오류 (메인 프로세스는 정상):', error);
      });

      // 파트너에게 알림톡 발송 (마케터 코드가 있는 경우)
      if (validationResult.data.marketerCode) {
        try {
          console.log('[Inquiry] 파트너 알림톡 발송 시작:', validationResult.data.marketerCode)
          const { data: partner } = await supabaseAdmin
            .from('users')
            .select('phone')
            .eq('unique_code', validationResult.data.marketerCode!.toUpperCase())
            .single()

          if (partner?.phone) {
            console.log('[Inquiry] 파트너 전화번호 조회 성공:', partner.phone.slice(0, 7) + '****')
            await sendPartnerNewInquiryAlimtalk(partner.phone)
            console.log('[Inquiry] 알림톡 발송 완료')
          } else {
            console.log('[Inquiry] 파트너 전화번호 없음')
          }
        } catch (error) {
          console.error('⚠️ 파트너 알림톡 발송 실패:', error)
        }
      }

      // 고객에게 알림톡 발송 (문의 접수 + 예약 안내)
      try {
        console.log('[Inquiry] 고객 알림톡 발송 시작:', validationResult.data.phoneNumber.slice(0, 7) + '****')
        const customerAlimtalkResult = await sendCustomerInquiryAlimtalks(validationResult.data.phoneNumber)
        console.log('[Inquiry] 고객 알림톡 발송 결과:', customerAlimtalkResult)
      } catch (error) {
        console.error('⚠️ 고객 알림톡 발송 실패:', error)
      }

      return NextResponse.json(
        {
          success: true,
          message: '문의가 성공적으로 접수되었습니다',
          data: data?.[0],
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('❌ API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

// OPTIONS 메서드 지원 (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
