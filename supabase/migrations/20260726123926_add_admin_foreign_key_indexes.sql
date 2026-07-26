create index if not exists guides_created_by_idx
  on public.guides (created_by);

create index if not exists settlements_created_by_idx
  on public.settlements (created_by);
