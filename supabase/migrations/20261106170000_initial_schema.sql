-- Checkpoint: schema inicial com isolamento por usuário.
-- Execute pelo Supabase SQL Editor ou pela CLI do Supabase.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  cover_image_url text check (cover_image_url is null or char_length(cover_image_url) <= 2048),
  status text not null default 'queue' check (status in ('queue', 'playing', 'completed')),
  is_completed boolean not null default false,
  rating smallint check (rating between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  color_code text not null default '#C6F06F' check (color_code ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create table public.note_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  item_type text not null default 'task' check (item_type in ('task', 'note')),
  title text not null check (char_length(title) between 1 and 200),
  content_text text not null default '' check (char_length(content_text) <= 50000),
  image_url text check (image_url is null or char_length(image_url) <= 2048),
  is_completed boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 50000),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (item_type = 'task' or is_completed = false)
);

create index games_user_id_idx on public.games(user_id);
create index folders_user_game_idx on public.folders(user_id, game_id);
create index folders_parent_id_idx on public.folders(parent_id);
create index note_items_user_folder_idx on public.note_items(user_id, folder_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger games_set_updated_at before update on public.games
for each row execute function public.set_updated_at();
create trigger folders_set_updated_at before update on public.folders
for each row execute function public.set_updated_at();
create trigger note_items_set_updated_at before update on public.note_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), 80));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Evita autorreferência recursiva nas políticas de folders ao validar parent_id.
create or replace function public.is_valid_folder_parent(
  candidate_parent_id uuid,
  candidate_game_id uuid,
  candidate_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate_user_id = auth.uid()
    and (
      candidate_parent_id is null
      or exists (
        select 1
        from public.folders p
        where p.id = candidate_parent_id
          and p.game_id = candidate_game_id
          and p.user_id = candidate_user_id
          and p.parent_id is null
      )
    );
$$;

revoke all on function public.is_valid_folder_parent(uuid, uuid, uuid) from public;
grant execute on function public.is_valid_folder_parent(uuid, uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.folders enable row level security;
alter table public.note_items enable row level security;

revoke all on public.profiles, public.games, public.folders, public.note_items from anon;
revoke all on public.profiles, public.games, public.folders, public.note_items from authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.games, public.folders, public.note_items to authenticated;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "games_select_own" on public.games
for select to authenticated using ((select auth.uid()) = user_id);
create policy "games_insert_own" on public.games
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "games_update_own" on public.games
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "games_delete_own" on public.games
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "folders_select_own" on public.folders
for select to authenticated using ((select auth.uid()) = user_id);
create policy "folders_insert_own" on public.folders
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.games g where g.id = game_id and g.user_id = (select auth.uid()))
  and public.is_valid_folder_parent(parent_id, game_id, user_id)
);
create policy "folders_update_own" on public.folders
for update to authenticated using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.games g where g.id = game_id and g.user_id = (select auth.uid()))
  and public.is_valid_folder_parent(parent_id, game_id, user_id)
);
create policy "folders_delete_own" on public.folders
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "note_items_select_own" on public.note_items
for select to authenticated using ((select auth.uid()) = user_id);
create policy "note_items_insert_own" on public.note_items
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.folders f where f.id = folder_id and f.user_id = (select auth.uid()))
);
create policy "note_items_update_own" on public.note_items
for update to authenticated using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.folders f where f.id = folder_id and f.user_id = (select auth.uid()))
);
create policy "note_items_delete_own" on public.note_items
for delete to authenticated using ((select auth.uid()) = user_id);

