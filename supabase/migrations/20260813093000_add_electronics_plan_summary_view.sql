-- 목록 페이지는 "제품 x 약정 x 관리방법 -> 최저가"만 필요하다.
-- 요금제 원본(정수기만 2,897행)을 그대로 조회하면 PostgREST 기본 1000행 제한에
-- 걸려 일부 제품의 최저가가 틀어지고, 요금제가 하나도 안 잡힌 제품은 목록에서
-- 통째로 빠진다. 조합 단위로 미리 접어서 695행으로 줄인다.
--
-- distinct on 을 쓰는 이유: 같은 조합에서 가장 싼 요금제의 list_price 를
-- 그대로 가져와야 "정가 대비 할인" 표시가 맞다. min/max 집계로는 짝이 어긋난다.
create or replace view public.electronics_plan_summary
with (security_invoker = on) as
select distinct on (product_id, contract_months, care_type)
  product_id,
  contract_months,
  care_type,
  monthly_fee,
  list_price
from public.electronics_product_plans
where is_active
order by product_id, contract_months, care_type, monthly_fee asc;

comment on view public.electronics_plan_summary is
  '목록용 요금제 요약. security_invoker 라 기반 테이블의 RLS 를 그대로 따른다.';

grant select on public.electronics_plan_summary to anon, authenticated;
grant all privileges on public.electronics_plan_summary to service_role;
