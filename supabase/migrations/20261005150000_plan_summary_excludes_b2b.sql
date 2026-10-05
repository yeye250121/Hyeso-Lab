-- 목록의 "월 ○원~" 은 일반 고객이 실제로 받을 수 있는 요금이어야 한다.
-- [B2B] 판매조건(10대·30대 이상 사업자 대량 계약)은 최저가 계산에서 뺀다.
-- B2B 요금제밖에 없는 상품은 가격이 비지 않도록 그대로 둔다.
create or replace view public.electronics_plan_summary with (security_invoker = on) as
 select distinct on (p.product_id, p.contract_months, p.care_type) p.product_id,
    p.contract_months,
    p.care_type,
    p.monthly_fee,
    p.list_price
   from electronics_product_plans p
  where p.is_active
    and (
      p.plan_variant not like '[B2B]%'
      or not exists (
        select 1 from electronics_product_plans q
        where q.product_id = p.product_id and q.is_active and q.plan_variant not like '[B2B]%'
      )
    )
  order by p.product_id, p.contract_months, p.care_type, p.monthly_fee;
