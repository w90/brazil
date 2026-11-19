create table if not exists public.app_visitors (
  visitor_name text primary key check (char_length(visitor_name) between 3 and 40),
  updated_at timestamptz not null default now()
);

alter table public.app_visitors enable row level security;

grant select, insert, update, delete on public.app_visitors to anon, authenticated;

drop policy if exists "public read app visitors" on public.app_visitors;
create policy "public read app visitors"
  on public.app_visitors for select to anon, authenticated using (true);

drop policy if exists "public insert app visitors" on public.app_visitors;
create policy "public insert app visitors"
  on public.app_visitors for insert to anon, authenticated with check (true);

drop policy if exists "public update app visitors" on public.app_visitors;
create policy "public update app visitors"
  on public.app_visitors for update to anon, authenticated using (true) with check (true);

alter table public.listing_notes add column if not exists author_name text not null default '';
alter table public.agency_phones add column if not exists author_name text not null default '';
alter table public.custom_listings add column if not exists author_name text not null default '';
alter table public.listing_nicknames add column if not exists author_name text not null default '';
alter table public.listing_star_ratings add column if not exists author_name text not null default '';

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'listing_star_ratings'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%user_id%'
  loop
    execute format('alter table public.listing_star_ratings drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.listing_star_ratings
  drop constraint if exists listing_star_ratings_user_id_length;

alter table public.listing_star_ratings
  add constraint listing_star_ratings_user_id_length
  check (char_length(user_id) >= 3 and char_length(user_id) <= 80);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_visitors'
  ) then
    alter publication supabase_realtime add table public.app_visitors;
  end if;
end $$;
