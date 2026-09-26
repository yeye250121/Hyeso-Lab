-- 상담 신청(명세서)은 가전렌탈 전용이 아니라 카드·인터넷·가전렌탈 공통 입구(/apply)다.
-- 테이블 이름을 leads 로 바꾸고 어떤 서비스를 원하는지(service)를 받는다.

alter table if exists public.electronics_leads rename to leads;

alter table public.leads
  add column if not exists service text not null default 'electronics'
    check (service in ('card', 'internet', 'electronics'));

alter index if exists electronics_leads_status_idx rename to leads_status_idx;
alter index if exists electronics_leads_phone_idx rename to leads_phone_idx;
alter trigger electronics_leads_set_updated_at on public.leads rename to leads_set_updated_at;

comment on table public.leads is
  '상담 신청(명세서). 카드·인터넷·가전렌탈 공통. 협력업체가 전화하는 데 필요한 최소 정보. anon 접근 불가.';
