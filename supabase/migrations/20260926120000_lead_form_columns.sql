-- M1 명세서 폼: 6단계 계약 신청을 한 화면 상담 신청으로 줄인다.
-- 협력업체가 전화하는 데 필요한 건 전화번호뿐이고, 나머지는 명세서(needs)로 넘긴다.
-- 계좌·생년월일 등 기존 민감 칼럼은 비워두고 나중에 정리한다(마일스톤 문서 '보류' 참고).

alter table public.electronics_applications
  alter column applicant_name drop not null,
  add column if not exists needs jsonb not null default '{}'::jsonb
    check (jsonb_typeof(needs) = 'object'),
  add column if not exists preferred_contact_time text
    check (preferred_contact_time is null
      or preferred_contact_time in ('아무 때나', '오전', '오후', '저녁')),
  add column if not exists region_sido text,
  add column if not exists region_sigungu text;

comment on column public.electronics_applications.needs is
  '명세서. 고객이 고른 조건(카테고리, 상품, 우선순위, 약정/관리 방향 등). 정확한 요금제는 상담원이 다시 정한다.';
comment on column public.electronics_applications.preferred_contact_time is
  '연락 받기 편한 시간. 협력업체가 직접 전화하므로 부재중 = 손실.';
