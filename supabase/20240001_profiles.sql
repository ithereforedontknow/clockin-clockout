-- ============================================================
-- Migration 001: profiles
-- Extends Supabase auth.users with app-level profile data.
-- A row is created automatically on sign-up via the trigger
-- defined at the bottom of this file.
-- ============================================================

create table public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  full_name     text,
  avatar_url    text,
  role          text        not null default 'student'
                            check (role in ('student', 'instructor', 'admin')),
  total_hours   numeric     not null default 0,
  badges        jsonb       not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row-level security
alter table public.profiles enable row level security;

-- Users can read any profile (needed for instructor info on lessons)
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can update any profile (e.g. to assign roles)
create policy "profiles: admin update"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


--- Bridge: seed a profile row for all existing employees who have a user_id
INSERT INTO public.profiles (id, full_name, avatar_url, role)
SELECT
  e.user_id,
  e.first_name || ' ' || e.last_name,
  e.avatar_url,
  CASE e.role
    WHEN 'admin'    THEN 'admin'
    WHEN 'employer' THEN 'instructor'
    ELSE                 'student'
  END
FROM employees e
WHERE e.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;
