create table if not exists public.listing_notes (
  listing_id text primary key,
  comment text not null default '' check (char_length(comment) <= 500),
  is_highlighted boolean not null default false,
  is_rejected boolean not null default false,
  is_contacted boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.listing_notes enable row level security;

grant select, insert, update, delete on public.listing_notes to anon, authenticated;

drop policy if exists "public read listing notes" on public.listing_notes;
create policy "public read listing notes"
  on public.listing_notes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert listing notes" on public.listing_notes;
create policy "public insert listing notes"
  on public.listing_notes
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public update listing notes" on public.listing_notes;
create policy "public update listing notes"
  on public.listing_notes
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public delete listing notes" on public.listing_notes;
create policy "public delete listing notes"
  on public.listing_notes
  for delete
  to anon, authenticated
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'listing_notes'
  ) then
    alter publication supabase_realtime add table public.listing_notes;
  end if;
end $$;
