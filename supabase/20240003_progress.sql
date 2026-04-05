-- ============================================================
-- Migration 003: progress & certifications
-- Tracks per-user video progress, auto-completion logic,
-- certifications, and the training_record overdue view.
-- ============================================================

-- ── Progress records ─────────────────────────────────────────
create table public.progress_records (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles (id) on delete cascade,
  lesson_id        uuid        not null references public.lessons (id) on delete cascade,
  percent_watched  numeric     not null default 0
                               check (percent_watched >= 0 and percent_watched <= 100),
  is_completed     boolean     not null default false,
  last_watched_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (user_id, lesson_id)
);

alter table public.progress_records enable row level security;

-- Users only see their own progress
create policy "progress: owner only"
  on public.progress_records for all
  using (auth.uid() = user_id);

-- Admins/instructors can read all progress (for reporting)
create policy "progress: instructor read"
  on public.progress_records for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('instructor', 'admin')
    )
  );

create trigger progress_records_updated_at
  before update on public.progress_records
  for each row execute function public.handle_updated_at();

-- Auto-mark complete when percent_watched passes 90
create or replace function public.handle_progress_completion()
returns trigger language plpgsql as $$
begin
  if new.percent_watched >= 90 then
    new.is_completed = true;
  end if;
  new.last_watched_at = now();
  return new;
end;
$$;

create trigger progress_auto_complete
  before insert or update on public.progress_records
  for each row execute function public.handle_progress_completion();

-- Efficient lookups
create index progress_user_lesson on public.progress_records (user_id, lesson_id);
create index progress_user_completed on public.progress_records (user_id, is_completed);


-- ── Certifications ───────────────────────────────────────────
create table public.certifications (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  curriculum_id  uuid        not null references public.curriculums (id) on delete cascade,
  issued_at      timestamptz not null default now(),

  unique (user_id, curriculum_id)
);

alter table public.certifications enable row level security;

create policy "certifications: owner read"
  on public.certifications for select
  using (auth.uid() = user_id);

create policy "certifications: instructor read"
  on public.certifications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('instructor', 'admin')
    )
  );

-- Only the system (service role) should insert certifications
-- via Edge Function after verifying all modules complete.
-- No user-facing insert policy is intentional.


-- ── Training record table (with due dates) ───────────────────
-- Tracks mandatory training assignments per user.
create table public.training_assignments (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  curriculum_id  uuid        not null references public.curriculums (id) on delete cascade,
  due_date       date        not null,
  assigned_by    uuid        references public.profiles (id),
  assigned_at    timestamptz not null default now(),

  unique (user_id, curriculum_id)
);

alter table public.training_assignments enable row level security;

create policy "assignments: owner read"
  on public.training_assignments for select
  using (auth.uid() = user_id);

create policy "assignments: admin write"
  on public.training_assignments for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('instructor', 'admin')
    )
  );


-- ── Training record view (overdue logic lives here) ──────────
-- React never needs to compute dates — just query this view.
create or replace view public.training_record as
select
  ta.user_id,
  ta.curriculum_id,
  c.title                                       as curriculum_title,
  c.thumbnail_url,
  ta.due_date,
  cert.issued_at                                as completed_at,

  case
    when cert.id is not null             then 'completed'
    when ta.due_date < current_date      then 'overdue'
    when ta.due_date <= current_date + 7 then 'due_soon'
    else                                      'pending'
  end                                           as status,

  -- Days remaining (negative = overdue)
  (ta.due_date - current_date)                  as days_remaining

from public.training_assignments ta
join public.curriculums c on c.id = ta.curriculum_id
left join public.certifications cert
  on cert.user_id = ta.user_id
  and cert.curriculum_id = ta.curriculum_id;

-- RLS doesn't apply to views directly; secure via the
-- underlying tables' policies (already set above).
-- For extra safety, expose this view only via a Postgres function:

create or replace function public.get_my_training_record()
returns setof public.training_record
language sql security definer as $$
  select * from public.training_record
  where user_id = auth.uid()
  order by
    case status
      when 'overdue'   then 1
      when 'due_soon'  then 2
      when 'pending'   then 3
      when 'completed' then 4
    end,
    due_date asc;
$$;
