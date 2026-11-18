create table if not exists public.agency_phones (
  seller text primary key,
  phone text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_listings (
  listing_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agency_phones enable row level security;
alter table public.custom_listings enable row level security;

grant select, insert, update, delete on public.agency_phones to anon, authenticated;
grant select, insert, update, delete on public.custom_listings to anon, authenticated;

drop policy if exists "public read agency phones" on public.agency_phones;
create policy "public read agency phones"
  on public.agency_phones for select to anon, authenticated using (true);

drop policy if exists "public insert agency phones" on public.agency_phones;
create policy "public insert agency phones"
  on public.agency_phones for insert to anon, authenticated with check (true);

drop policy if exists "public update agency phones" on public.agency_phones;
create policy "public update agency phones"
  on public.agency_phones for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete agency phones" on public.agency_phones;
create policy "public delete agency phones"
  on public.agency_phones for delete to anon, authenticated using (true);

drop policy if exists "public read custom listings" on public.custom_listings;
create policy "public read custom listings"
  on public.custom_listings for select to anon, authenticated using (true);

drop policy if exists "public insert custom listings" on public.custom_listings;
create policy "public insert custom listings"
  on public.custom_listings for insert to anon, authenticated with check (true);

drop policy if exists "public update custom listings" on public.custom_listings;
create policy "public update custom listings"
  on public.custom_listings for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete custom listings" on public.custom_listings;
create policy "public delete custom listings"
  on public.custom_listings for delete to anon, authenticated using (true);

create table if not exists public.listing_nicknames (
  listing_id text primary key,
  nickname text not null check (char_length(nickname) > 0 and char_length(nickname) <= 80),
  updated_at timestamptz not null default now()
);

alter table public.listing_nicknames enable row level security;

grant select, insert, update, delete on public.listing_nicknames to anon, authenticated;

drop policy if exists "public read listing nicknames" on public.listing_nicknames;
create policy "public read listing nicknames"
  on public.listing_nicknames for select to anon, authenticated using (true);

drop policy if exists "public insert listing nicknames" on public.listing_nicknames;
create policy "public insert listing nicknames"
  on public.listing_nicknames for insert to anon, authenticated with check (true);

drop policy if exists "public update listing nicknames" on public.listing_nicknames;
create policy "public update listing nicknames"
  on public.listing_nicknames for update to anon, authenticated using (true) with check (true);

drop policy if exists "public delete listing nicknames" on public.listing_nicknames;
create policy "public delete listing nicknames"
  on public.listing_nicknames for delete to anon, authenticated using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agency_phones'
  ) then
    alter publication supabase_realtime add table public.agency_phones;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'custom_listings'
  ) then
    alter publication supabase_realtime add table public.custom_listings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'listing_nicknames'
  ) then
    alter publication supabase_realtime add table public.listing_nicknames;
  end if;
end $$;
