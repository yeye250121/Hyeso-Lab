-- 관리자 화면에서 상담 신청·신청서에 남기는 내부 메모(통화 결과 등).
alter table public.leads add column if not exists admin_memo text;
alter table public.electronics_applications add column if not exists admin_memo text;
comment on column public.leads.admin_memo is '관리자 메모(통화 결과 등). 고객에게 노출되지 않는다.';
comment on column public.electronics_applications.admin_memo is '관리자 메모. 고객에게 노출되지 않는다.';
