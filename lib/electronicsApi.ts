import { unstable_cache } from 'next/cache';
import { supabase } from './supabase';

// 가전렌탈 데이터 접근 레이어.
//
// 두 가지를 지킨다.
//  1) select('*') 를 쓰지 않는다. 수수료는 별도 테이블이라 따라오지 않지만,
//     목록 페이로드를 작게 유지하려면 컬럼 화이트리스트가 필요하다(카드에서 배운 것).
//  2) 목록은 요금제 전체(정수기만 2,897행)를 클라이언트로 내려보내지 않고
//     "약정 x 관리방법 -> 최저가" 요약으로 압축해서 보낸다. 이러면 필터를
//     클라이언트에서 즉시 처리하면서도 페이로드가 작다.

export const ELECTRONICS_CACHE_TAG = 'electronics';

export type FilterAxis = {
  key: string;
  label: string;
  options: string[];
};

export type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  icon_url: string | null;
  display_order: number;
  filter_schema: FilterAxis[];
  children: CategoryNode[];
  productCount: number;
};

export type ProductSpecs = {
  productType?: string;
  purifyFunction?: string;
  waterType?: string;
  waterTypeDetail?: string;
  colors?: string[];
  channel?: string;
  businessUse?: boolean;
};

// 목록용 요금제 요약. 키를 짧게 쓴 이유는 순전히 페이로드 크기 때문이다.
export type PlanSummary = {
  /** contract months */
  c: number;
  /** care type — 방문/자가/없음 */
  t: string | null;
  /** 최저 월 렌탈료 */
  f: number;
};

export type ProductListItem = {
  id: string;
  slug: string;
  brand: string;
  model_code: string;
  display_name: string;
  image_urls: string[];
  specs: ProductSpecs;
  review_count: number;
  /** 전체보기처럼 카테고리를 가로지르는 목록에서 상세 링크를 만들 때 쓴다 */
  category_slug: string;
  category_name: string;
  /** 전체 요금제 중 최저 월 렌탈료 */
  minFee: number;
  /** 정가(최저가 요금제 기준). 없으면 null */
  listPrice: number | null;
  plans: PlanSummary[];
};

export type ProductPlan = {
  id: string;
  contract_months: number;
  care_type: string | null;
  care_cycle_months: number | null;
  plan_variant: string;
  monthly_fee: number;
  list_price: number | null;
  ownership_months: number | null;
  promotion_note: string | null;
  extra: Record<string, unknown>;
};

export type ProductDetail = {
  id: string;
  slug: string;
  brand: string;
  model_code: string;
  display_name: string;
  description: string | null;
  image_urls: string[];
  specs: ProductSpecs;
  review_count: number;
  category: { slug: string; name: string };
  plans: ProductPlan[];
};

const CATEGORY_COLUMNS = 'id, parent_id, slug, name, icon_url, display_order, filter_schema';
const PRODUCT_LIST_COLUMNS =
  'id, slug, brand, model_code, display_name, image_urls, specs, review_count, display_order';
const PLAN_COLUMNS =
  'id, product_id, contract_months, care_type, care_cycle_months, plan_variant, monthly_fee, list_price, ownership_months, promotion_note, extra';

type RawCategory = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  icon_url: string | null;
  display_order: number;
  filter_schema: FilterAxis[] | null;
};

/** 카테고리 트리 + 카테고리별 상품 수. 홈/허브가 이걸로 입구를 그린다. */
export const getCategoryTree = unstable_cache(
  async (): Promise<CategoryNode[]> => {
    const [{ data: cats, error: catErr }, { data: prods, error: prodErr }] = await Promise.all([
      supabase
        .from('electronics_categories')
        .select(CATEGORY_COLUMNS)
        .order('display_order', { ascending: true }),
      supabase.from('electronics_products').select('category_id'),
    ]);

    if (catErr) {
      console.error('Error fetching electronics categories:', catErr);
      return [];
    }
    if (prodErr) console.error('Error counting electronics products:', prodErr);

    const counts = new Map<string, number>();
    for (const row of prods ?? []) {
      const id = (row as { category_id: string }).category_id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    const rows = (cats ?? []) as RawCategory[];
    const toNode = (c: RawCategory): CategoryNode => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon_url: c.icon_url,
      display_order: c.display_order,
      filter_schema: c.filter_schema ?? [],
      children: [],
      productCount: counts.get(c.id) ?? 0,
    });

    const byId = new Map(rows.map((c) => [c.id, toNode(c)]));
    const roots: CategoryNode[] = [];
    for (const c of rows) {
      const node = byId.get(c.id)!;
      if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id)!.children.push(node);
      else roots.push(node);
    }
    return roots;
  },
  ['electronics-category-tree'],
  { revalidate: 3600, tags: [ELECTRONICS_CACHE_TAG] }
);

/** 슬러그로 카테고리 하나. 트리를 훑어 찾는다(카테고리 수가 20 남짓이라 충분하다). */
export async function getCategoryBySlug(slug: string): Promise<CategoryNode | undefined> {
  const flatten = (nodes: CategoryNode[]): CategoryNode[] =>
    nodes.flatMap((n) => [n, ...flatten(n.children)]);
  return flatten(await getCategoryTree()).find((c) => c.slug === slug);
}

/**
 * 상품 목록을 ProductListItem 으로 만든다.
 * 요금제는 (약정 x 관리방법 -> 최저가) 로 압축해서 붙인다. 요금제 원본은
 * 정수기만 2,897행이라 그대로 내려보내면 페이로드가 감당이 안 된다.
 */
type RawPlan = {
  product_id: string;
  contract_months: number;
  care_type: string | null;
  monthly_fee: number;
  list_price: number | null;
};

type RawProductRow = Omit<ProductListItem, 'minFee' | 'listPrice' | 'plans' | 'category_slug' | 'category_name'> & {
  display_order: number;
  electronics_categories: { slug: string; name: string };
};

const PRODUCT_WITH_CATEGORY = `${PRODUCT_LIST_COLUMNS}, electronics_categories!inner(slug, name)`;

async function attachPlanSummaries(rows: RawProductRow[]): Promise<ProductListItem[]> {
  if (rows.length === 0) return [];

  // 요금제 원본 대신 조합 단위로 접어둔 뷰를 쓴다.
  // 원본을 그대로 조회하면 PostgREST 기본 1000행 제한에 걸린다.
  const { data: plans, error } = await supabase
    .from('electronics_plan_summary')
    .select('product_id, contract_months, care_type, monthly_fee, list_price')
    .in(
      'product_id',
      rows.map((r) => r.id)
    );
  if (error) console.error('Error fetching electronics plan summary:', error);

  const grouped = new Map<string, Map<string, { fee: number; list: number | null }>>();
  for (const p of (plans ?? []) as RawPlan[]) {
    let byCombo = grouped.get(p.product_id);
    if (!byCombo) grouped.set(p.product_id, (byCombo = new Map()));
    const key = `${p.contract_months}|${p.care_type ?? ''}`;
    const prev = byCombo.get(key);
    if (!prev || p.monthly_fee < prev.fee) {
      byCombo.set(key, { fee: p.monthly_fee, list: p.list_price });
    }
  }

  return rows
    .map((r) => {
      const byCombo = grouped.get(r.id);
      const summaries: PlanSummary[] = [];
      let minFee = Number.POSITIVE_INFINITY;
      let listPrice: number | null = null;

      for (const [key, v] of byCombo ?? []) {
        const [months, care] = key.split('|');
        summaries.push({ c: Number(months), t: care || null, f: v.fee });
        if (v.fee < minFee) {
          minFee = v.fee;
          listPrice = v.list;
        }
      }
      summaries.sort((a, b) => a.c - b.c || a.f - b.f);

      return {
        id: r.id,
        slug: r.slug,
        brand: r.brand,
        model_code: r.model_code,
        display_name: r.display_name,
        image_urls: r.image_urls ?? [],
        specs: (r.specs ?? {}) as ProductSpecs,
        review_count: r.review_count ?? 0,
        category_slug: r.electronics_categories?.slug ?? '',
        category_name: r.electronics_categories?.name ?? '',
        minFee: Number.isFinite(minFee) ? minFee : 0,
        listPrice: listPrice && listPrice > minFee ? listPrice : null,
        plans: summaries,
      };
    })
    .filter((p) => p.plans.length > 0)
    .sort((a, b) => a.minFee - b.minFee);
}

/** 한 카테고리의 상품 목록. */
export const getProductsForCategory = unstable_cache(
  async (categorySlug: string): Promise<ProductListItem[]> => {
    // 카테고리는 슬러그로 직접 조인한다. getCategoryBySlug 를 쓰면
    // unstable_cache 안에서 다른 unstable_cache 를 호출하게 되는데,
    // 그 조합에서 결과가 비어 돌아오는 문제가 있었다.
    const { data, error } = await supabase
      .from('electronics_products')
      .select(PRODUCT_WITH_CATEGORY)
      .eq('electronics_categories.slug', categorySlug)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching electronics products:', error);
      return [];
    }
    return attachPlanSummaries((data ?? []) as unknown as RawProductRow[]);
  },
  ['electronics-products-by-category'],
  { revalidate: 3600, tags: [ELECTRONICS_CACHE_TAG] }
);

/** 카테고리를 가리지 않는 전체 상품 목록. /electronics/category 가 쓴다. */
export const getAllProducts = unstable_cache(
  async (): Promise<ProductListItem[]> => {
    const { data, error } = await supabase
      .from('electronics_products')
      .select(PRODUCT_WITH_CATEGORY)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching all electronics products:', error);
      return [];
    }
    return attachPlanSummaries((data ?? []) as unknown as RawProductRow[]);
  },
  ['electronics-products-all'],
  { revalidate: 3600, tags: [ELECTRONICS_CACHE_TAG] }
);


/** 상세 페이지. 요금제 전체를 내려보낸다(모델당 평균 15개라 가볍다). */
export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | undefined> => {
    // 카테고리도 한 번에 조인해서 가져온다(중첩 unstable_cache 회피).
    const { data: product, error } = await supabase
      .from('electronics_products')
      .select(
        'id, slug, brand, model_code, display_name, description, image_urls, specs, review_count, electronics_categories!inner(slug, name)'
      )
      .eq('slug', slug)
      .maybeSingle();

    if (error || !product) {
      if (error) console.error(`Error fetching product ${slug}:`, error);
      return undefined;
    }

    const { data: plans, error: planErr } = await supabase
      .from('electronics_product_plans')
      .select(PLAN_COLUMNS)
      .eq('product_id', product.id)
      .order('contract_months', { ascending: true })
      .order('monthly_fee', { ascending: true });
    if (planErr) console.error(`Error fetching plans for ${slug}:`, planErr);

    const category = (product as unknown as { electronics_categories: { slug: string; name: string } })
      .electronics_categories;

    return {
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      model_code: product.model_code,
      display_name: product.display_name,
      description: product.description,
      image_urls: product.image_urls ?? [],
      specs: (product.specs ?? {}) as ProductSpecs,
      review_count: product.review_count ?? 0,
      category: { slug: category?.slug ?? '', name: category?.name ?? '' },
      plans: ((plans ?? []) as ProductPlan[]).map((p) => ({ ...p, extra: p.extra ?? {} })),
    };
  },
  ['electronics-product-detail'],
  { revalidate: 3600, tags: [ELECTRONICS_CACHE_TAG] }
);

/** generateStaticParams 전용 — 슬러그만 필요하다. */
export async function getAllProductSlugs(): Promise<{ category: string; slug: string }[]> {
  const { data, error } = await supabase
    .from('electronics_products')
    .select('slug, electronics_categories!inner(slug)');
  if (error) {
    console.error('Error fetching product slugs:', error);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as unknown as { slug: string; electronics_categories: { slug: string } };
    return { category: r.electronics_categories.slug, slug: r.slug };
  });
}
