
-- 1) Extensions
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- 2) Add tsvector column for FTS
alter table public.knowledge_items
  add column if not exists search_vector tsvector;

-- 3) Backfill search_vector from existing data
update public.knowledge_items
set search_vector = to_tsvector(
  'simple',
  coalesce(title, '') || ' ' ||
  coalesce(content, '') || ' ' ||
  coalesce(url, '') || ' ' ||
  coalesce((
    select string_agg(value, ' ')
    from jsonb_array_elements_text(coalesce(metadata->'tags','[]'::jsonb))
  ), '')
);

-- 4) Trigger function to keep search_vector updated
create or replace function public.trg_set_knowledge_items_tsv()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.search_vector := to_tsvector(
    'simple',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.content, '') || ' ' ||
    coalesce(new.url, '') || ' ' ||
    coalesce((
      select string_agg(value, ' ')
      from jsonb_array_elements_text(coalesce(new.metadata->'tags','[]'::jsonb))
    ), '')
  );
  return new;
end;
$$;

-- 5) Create trigger
drop trigger if exists trg_knowledge_items_tsv on public.knowledge_items;
create trigger trg_knowledge_items_tsv
before insert or update of title, content, url, metadata
on public.knowledge_items
for each row
execute function public.trg_set_knowledge_items_tsv();

-- 6) Indexes for fast search and filters
create index if not exists idx_knowledge_items_search on public.knowledge_items using gin (search_vector);
create index if not exists idx_knowledge_items_title_trgm on public.knowledge_items using gin (title gin_trgm_ops);
create index if not exists idx_knowledge_items_url_trgm on public.knowledge_items using gin (url gin_trgm_ops);
create index if not exists idx_knowledge_items_user_created on public.knowledge_items (user_id, created_at desc);
create index if not exists idx_knowledge_items_category on public.knowledge_items (category);
create index if not exists idx_knowledge_items_type on public.knowledge_items (type);
