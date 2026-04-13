-- HOW TO RUN THIS SCHEMA
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor → New query
-- 3. Paste the entire contents of this file
-- 4. Click Run
--
-- STORAGE BUCKET (run separately in SQL Editor after the main schema):
--   Go to Storage → Create bucket
--   Name: wardrobe-images
--   Public: yes
--
--   Then run this policy in SQL Editor:
--   create policy "users manage own images"
--     on storage.objects for all
--     using (auth.uid()::text = (storage.foldername(name))[1]);

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade not null,
  lifestyle_context text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "users manage own profile" on profiles;
create policy "users manage own profile"
  on profiles for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Wardrobe items
create table if not exists wardrobe_items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  image_url       text not null,
  label_image_url text,
  category        text not null check (category in ('Top','Bottom','Shoes','Outer layer')),
  item_type       text not null,
  colour          text not null,
  material        text,
  brand           text,
  formality       int check (formality between 1 and 5),
  style_notes     text,
  condition_flags text[] not null default '{}',
  personal_notes  text,
  status          text not null default 'active' check (status in ('active','archived')),
  last_worn_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table wardrobe_items enable row level security;

drop policy if exists "users manage own wardrobe" on wardrobe_items;
create policy "users manage own wardrobe"
  on wardrobe_items for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on wardrobe_items (user_id, status);  -- covers both the grid and active-only filter

-- Outfit logs
create table if not exists outfit_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  occasion   text not null,
  weather    text not null,
  item_ids   uuid[] not null,
  worn_at    timestamptz,  -- null = saved but not yet worn
  rating     int check (rating in (1, -1)),
  comment    text,
  created_at timestamptz not null default now()
);

alter table outfit_logs enable row level security;

drop policy if exists "users manage own logs" on outfit_logs;
create policy "users manage own logs"
  on outfit_logs for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on outfit_logs (user_id);

-- Saved looks
create table if not exists saved_looks (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  occasion   text not null,
  weather    text not null,
  item_ids   uuid[] not null,
  created_at timestamptz not null default now()
);

alter table saved_looks enable row level security;

drop policy if exists "users manage own saved looks" on saved_looks;
create policy "users manage own saved looks"
  on saved_looks for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on saved_looks (user_id);

-- Auto-update updated_at on profiles
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();
