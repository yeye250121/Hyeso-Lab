alter table public.cards
  drop constraint if exists cards_application_url_format,
  drop column if exists application_url;
