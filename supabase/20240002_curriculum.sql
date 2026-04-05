-- ============================================================
-- Migration 002: curriculum schema
-- Three-tier content hierarchy: curriculum > module > lesson
-- ============================================================

-- ── Curriculums ──────────────────────────────────────────────
create table public.curriculums (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  description   text,
  thumbnail_url text,
  is_published  boolean     not null default false,
  created_by    uuid        not null references public.profiles (id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.curriculums enable row level security;

-- Anyone can read published curriculums
create policy "curriculums: read published"
  on public.curriculums for select
  using (is_published = true or created_by = auth.uid());

-- Only instructors/admins can insert
create policy "curriculums: instructor insert"
  on public.curriculums for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('instructor', 'admin')
    )
  );

-- Only the creator or an admin can update/delete
create policy "curriculums: owner or admin modify"
  on public.curriculums for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create trigger curriculums_updated_at
  before update on public.curriculums
  for each row execute function public.handle_updated_at();


-- ── Modules ──────────────────────────────────────────────────
create table public.modules (
  id             uuid        primary key default gen_random_uuid(),
  curriculum_id  uuid        not null references public.curriculums (id) on delete cascade,
  title          text        not null,
  description    text,
  order_index    integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "modules: read via curriculum"
  on public.modules for select
  using (
    exists (
      select 1 from public.curriculums c
      where c.id = curriculum_id
      and (c.is_published = true or c.created_by = auth.uid())
    )
  );

create policy "modules: instructor write"
  on public.modules for all
  using (
    exists (
      select 1 from public.curriculums c
      join public.profiles p on p.id = auth.uid()
      where c.id = curriculum_id
      and (c.created_by = auth.uid() or p.role = 'admin')
    )
  );

create trigger modules_updated_at
  before update on public.modules
  for each row execute function public.handle_updated_at();


-- ── Lessons ──────────────────────────────────────────────────
create table public.lessons (
  id               uuid        primary key default gen_random_uuid(),
  module_id        uuid        not null references public.modules (id) on delete cascade,
  title            text        not null,
  description      text,
  cf_stream_id     text,                          -- Cloudflare Stream UID
  cf_stream_status text        default 'pending'  -- pending | ready | error
                               check (cf_stream_status in ('pending', 'ready', 'error')),
  duration_seconds integer,
  order_index      integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons: read via module"
  on public.lessons for select
  using (
    exists (
      select 1
      from public.modules m
      join public.curriculums c on c.id = m.curriculum_id
      where m.id = module_id
      and (c.is_published = true or c.created_by = auth.uid())
    )
  );

create policy "lessons: instructor write"
  on public.lessons for all
  using (
    exists (
      select 1
      from public.modules m
      join public.curriculums c on c.id = m.curriculum_id
      join public.profiles p on p.id = auth.uid()
      where m.id = module_id
      and (c.created_by = auth.uid() or p.role = 'admin')
    )
  );

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute function public.handle_updated_at();

-- Index for fast lesson ordering within a module
create index lessons_module_order on public.lessons (module_id, order_index);
create index modules_curriculum_order on public.modules (curriculum_id, order_index);
