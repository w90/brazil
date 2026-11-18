create table if not exists public.listing_star_ratings (
  listing_id text not null,
  user_id text not null check (char_length(user_id) >= 8 and char_length(user_id) <= 80),
  stars smallint not null check (stars >= 1 and stars <= 5),
  updated_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

alter table public.listing_star_ratings enable row level security;

grant select, insert, update, delete on public.listing_star_ratings to anon, authenticated;

drop policy if exists "public read listing star ratings" on public.listing_star_ratings;
create policy "public read listing star ratings"
  on public.listing_star_ratings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert listing star ratings" on public.listing_star_ratings;
create policy "public insert listing star ratings"
  on public.listing_star_ratings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public update listing star ratings" on public.listing_star_ratings;
create policy "public update listing star ratings"
  on public.listing_star_ratings
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public delete listing star ratings" on public.listing_star_ratings;
create policy "public delete listing star ratings"
  on public.listing_star_ratings
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
      and tablename = 'listing_star_ratings'
  ) then
    alter publication supabase_realtime add table public.listing_star_ratings;
  end if;
end $$;
