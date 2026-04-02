-- ============================================================================
-- ClockIn/Out — Complete Database Schema
-- Run this on a fresh database after dropping all existing tables.
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── updated_at trigger function ─────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Employees ────────────────────────────────────────────────────────────────

create table employees (
  id                       text primary key default gen_random_uuid()::text,
  user_id                  uuid references auth.users(id) on delete set null,
  first_name               text not null,
  last_name                text not null,
  email                    text not null unique,
  job_title                text not null default '',
  department               text not null default '',
  location                 text not null default '',
  hire_date                date not null default current_date,
  manager_id               text references employees(id) on delete set null,
  avatar_url               text,
  phone                    text,
  employment_status        text not null default 'active'
                           check (employment_status in ('active','inactive','on_leave')),
  birthday                 date,
  role                     text not null default 'employee'
                           check (role in ('employee','employer','admin')),
  standard_hours_per_day   numeric not null default 8,
  standard_hours_per_week  numeric not null default 40,
  standard_start_time      time default '09:00:00',
  -- Onboarding / profile
  onboarding_completed     boolean not null default false,
  preferred_name           text,
  address_line1            text,
  address_line2            text,
  city                     text,
  country                  text,
  emergency_name           text,
  emergency_phone          text,
  emergency_relation       text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create trigger employees_updated_at
  before update on employees
  for each row execute procedure set_updated_at();

-- ─── Security-definer helper — avoids RLS recursion ──────────────────────────
-- Policies that check the caller's role MUST use this function instead of
-- querying the employees table directly, or Postgres will infinite-loop.

create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from employees where user_id = auth.uid() limit 1
$$;

-- ─── RLS — Employees ─────────────────────────────────────────────────────────

alter table employees enable row level security;

-- Linked employees read/write their own row
create policy "own record" on employees
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Active directory — any authenticated user can see active linked employees
create policy "directory read" on employees
  for select using (
    employment_status = 'active'
    and user_id is not null
  );

-- First sign-in: read own unlinked row by email (needed before user_id is set)
create policy "read own unlinked record" on employees
  for select using (
    user_id is null
    and lower(email) = lower(auth.email())
  );

-- First sign-in: patch user_id onto the unlinked row
create policy "link unlinked employee" on employees
  for update
  using  (user_id is null and lower(email) = lower(auth.email()))
  with check (user_id = auth.uid());

-- Admin: read all employees regardless of status
create policy "admin read all" on employees
  for select using (get_my_role() = 'admin');

-- Admin: update any employee row directly
create policy "admin update" on employees
  for update
  using  (get_my_role() = 'admin')
  with check (true);

-- Admin: insert new employee records
create policy "admin insert" on employees
  for insert with check (get_my_role() = 'admin');

-- ─── Time Off Categories ──────────────────────────────────────────────────────

create table time_off_categories (
  id           text primary key default gen_random_uuid()::text,
  name         text not null,
  accrual_rate numeric not null default 1.67,
  max_balance  numeric,
  unit         text not null default 'days'
               check (unit in ('days','hours'))
);

insert into time_off_categories (name, accrual_rate, unit) values
  ('Vacation', 1.67, 'days'),
  ('Sick',     1.0,  'days'),
  ('Personal', 0.5,  'days');

alter table time_off_categories enable row level security;

create policy "public read categories" on time_off_categories
  for select using (true);

-- ─── Time Off Balances ────────────────────────────────────────────────────────

create table time_off_balances (
  id          text primary key default gen_random_uuid()::text,
  employee_id text not null references employees(id) on delete cascade,
  category_id text not null references time_off_categories(id) on delete cascade,
  balance     numeric not null default 0,
  scheduled   numeric not null default 0,
  unique (employee_id, category_id)
);

alter table time_off_balances enable row level security;

create policy "own balances" on time_off_balances
  for all using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
  );

-- ─── Time Off Requests ────────────────────────────────────────────────────────

create table time_off_requests (
  id               text primary key default gen_random_uuid()::text,
  employee_id      text not null references employees(id) on delete cascade,
  category_id      text not null references time_off_categories(id) on delete cascade,
  start_date       date not null,
  end_date         date not null,
  amount           numeric not null,
  status           text not null default 'pending'
                   check (status in ('pending','approved','denied','canceled')),
  note             text,
  approver_comment text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (end_date >= start_date)
);

create trigger time_off_requests_updated_at
  before update on time_off_requests
  for each row execute procedure set_updated_at();

alter table time_off_requests enable row level security;

create policy "own time off requests" on time_off_requests
  for all using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
  );

create policy "manager admin read time off" on time_off_requests
  for select using (get_my_role() in ('employer','admin'));

create policy "manager admin update time off" on time_off_requests
  for update using (get_my_role() in ('employer','admin'));

-- ─── Info Change Requests ─────────────────────────────────────────────────────

create table info_change_requests (
  id               text primary key default gen_random_uuid()::text,
  employee_id      text not null references employees(id) on delete cascade,
  field_name       text not null,
  old_value        text,
  new_value        text not null,
  status           text not null default 'pending'
                   check (status in ('pending','approved','denied')),
  approver_comment text,
  created_at       timestamptz not null default now()
);

alter table info_change_requests enable row level security;

create policy "own info changes" on info_change_requests
  for all using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
  );

create policy "manager admin read info changes" on info_change_requests
  for select using (get_my_role() in ('employer','admin'));

create policy "manager admin update info changes" on info_change_requests
  for update using (get_my_role() in ('employer','admin'));

-- ─── Company Holidays ─────────────────────────────────────────────────────────

create table company_holidays (
  id   text primary key default gen_random_uuid()::text,
  name text not null,
  date date not null unique
);

alter table company_holidays enable row level security;

create policy "public read holidays" on company_holidays
  for select using (true);

insert into company_holidays (name, date) values
  ('New Year''s Day',        '2025-01-01'),
  ('MLK Day',                '2025-01-20'),
  ('Presidents'' Day',       '2025-02-17'),
  ('Memorial Day',           '2025-05-26'),
  ('Independence Day',       '2025-07-04'),
  ('Labor Day',              '2025-09-01'),
  ('Thanksgiving',           '2025-11-27'),
  ('Day After Thanksgiving', '2025-11-28'),
  ('Christmas Eve',          '2025-12-24'),
  ('Christmas Day',          '2025-12-25'),
  ('New Year''s Day',        '2026-01-01'),
  ('MLK Day',                '2026-01-19'),
  ('Presidents'' Day',       '2026-02-16'),
  ('Memorial Day',           '2026-05-25'),
  ('Independence Day',       '2026-07-04'),
  ('Labor Day',              '2026-09-07'),
  ('Thanksgiving',           '2026-11-26'),
  ('Day After Thanksgiving', '2026-11-27'),
  ('Christmas Eve',          '2026-12-24'),
  ('Christmas Day',          '2026-12-25');

-- ─── Clock Entries ────────────────────────────────────────────────────────────

create table clock_entries (
  id            text primary key default gen_random_uuid()::text,
  employee_id   text not null references employees(id) on delete cascade,
  clock_in      timestamptz not null,
  clock_out     timestamptz,
  date          date not null,
  notes         text,
  total_minutes integer,
  created_at    timestamptz not null default now()
);

create index clock_entries_employee_date
  on clock_entries(employee_id, date);

alter table clock_entries enable row level security;

create policy "own clock entries" on clock_entries
  for all using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
  );

create policy "manager admin read clock entries" on clock_entries
  for select using (get_my_role() in ('employer','admin'));

create policy "manager admin update clock entries" on clock_entries
  for update using (get_my_role() in ('employer','admin'));

-- ─── Break Entries ────────────────────────────────────────────────────────────

create table break_entries (
  id               text primary key default gen_random_uuid()::text,
  clock_entry_id   text not null references clock_entries(id) on delete cascade,
  break_start      timestamptz not null,
  break_end        timestamptz,
  duration_minutes integer
);

alter table break_entries enable row level security;

create policy "own break entries" on break_entries
  for all using (
    clock_entry_id in (
      select id from clock_entries
      where employee_id = (select id from employees where user_id = auth.uid() limit 1)
    )
  );

create policy "manager admin read breaks" on break_entries
  for select using (get_my_role() in ('employer','admin'));

-- ─── Clock Corrections ────────────────────────────────────────────────────────

create table clock_corrections (
  id                       text primary key default gen_random_uuid()::text,
  clock_entry_id           text not null references clock_entries(id) on delete cascade,
  employee_id              text not null references employees(id) on delete cascade,
  requested_clock_in       timestamptz,
  requested_clock_out      timestamptz,
  requested_break_minutes  integer,
  requested_notes          text,
  reason                   text not null,
  status                   text not null default 'pending'
                           check (status in ('pending','approved','denied')),
  reviewer_comment         text,
  reviewed_by              text references employees(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index clock_corrections_employee
  on clock_corrections(employee_id, status);

create index clock_corrections_status
  on clock_corrections(status);

create trigger clock_corrections_updated_at
  before update on clock_corrections
  for each row execute procedure set_updated_at();

alter table clock_corrections enable row level security;

create policy "own corrections insert" on clock_corrections
  for insert with check (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
  );

create policy "own corrections select" on clock_corrections
  for select using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
    or get_my_role() in ('employer','admin')
  );

create policy "manager admin corrections update" on clock_corrections
  for update using (get_my_role() in ('employer','admin'));

-- ─── Notifications ────────────────────────────────────────────────────────────

create table notifications (
  id          text primary key default gen_random_uuid()::text,
  employee_id text not null references employees(id) on delete cascade,
  type        text not null,
  title       text not null,
  message     text not null,
  read        boolean not null default false,
  link_tab    text,
  created_at  timestamptz not null default now()
);

create index notifications_employee_unread
  on notifications(employee_id, read, created_at desc);

alter table notifications enable row level security;

create policy "own notifications" on notifications
  for all using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
  );

create policy "manager admin insert notifications" on notifications
  for insert with check (get_my_role() in ('employer','admin'));


-- ─── Rename manager → employer ────────────────────────────────────────────────
-- Run this if you already have data and need to migrate existing rows.
-- update employees set role = 'employer' where role = 'manager';

-- ─── Seed time off balances for all employees who have none ──────────────────
-- Run this once after schema migration to fix existing accounts.
insert into time_off_balances (employee_id, category_id, balance, scheduled)
select
  e.id,
  c.id,
  0,
  0
from employees e
cross join time_off_categories c
where not exists (
  select 1 from time_off_balances b
  where b.employee_id = e.id
  and   b.category_id = c.id
)
on conflict (employee_id, category_id) do nothing;


-- ─── Company Settings ─────────────────────────────────────────────────────────

create table if not exists company_settings (
  id                       text primary key default 'singleton',
  company_name             text not null default 'My Company',
  standard_hours_per_day   numeric not null default 8,
  standard_hours_per_week  numeric not null default 40,
  standard_start_time      time not null default '09:00:00',
  working_days             integer[] not null default '{1,2,3,4,5}',
  overtime_threshold_daily  numeric not null default 8,
  overtime_threshold_weekly numeric not null default 40,
  logo_url                 text,
  updated_at               timestamptz not null default now()
);

-- Seed default settings row
insert into company_settings (id) values ('singleton')
  on conflict (id) do nothing;

alter table company_settings enable row level security;

-- Anyone authenticated can read company settings
create policy "authenticated read settings" on company_settings
  for select using (auth.uid() is not null);

-- Only admin can update
create policy "admin update settings" on company_settings
  for update using (get_my_role() = 'admin');


-- ─── Departments ──────────────────────────────────────────────────────────────

create table if not exists departments (
  id         text primary key default gen_random_uuid()::text,
  name       text not null unique,
  created_by text references employees(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table departments enable row level security;

-- All authenticated users can read departments (needed for dropdowns)
create policy "authenticated read departments" on departments
  for select using (auth.uid() is not null);

-- Only admins can insert/update/delete
create policy "admin manage departments" on departments
  for all using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─── Announcements ────────────────────────────────────────────────────────────

create table if not exists announcements (
  id                 text primary key default gen_random_uuid()::text,
  title              text not null,
  body               text not null,
  posted_by          text not null references employees(id) on delete cascade,
  target             text not null default 'all'
                     check (target in ('all', 'employer_team')),
  target_employer_id text references employees(id) on delete cascade,
  created_at         timestamptz not null default now()
);

create index announcements_target on announcements(target, target_employer_id, created_at desc);

alter table announcements enable row level security;

-- Employees see all company-wide + announcements targeted at their employer
create policy "read own announcements" on announcements
  for select using (
    target = 'all'
    or (
      target = 'employer_team'
      and target_employer_id = (
        select manager_id from employees where user_id = auth.uid() limit 1
      )
    )
    or posted_by = (select id from employees where user_id = auth.uid() limit 1)
  );

-- Admin and employers can post announcements
create policy "employer admin insert announcements" on announcements
  for insert with check (
    get_my_role() in ('employer', 'admin')
    and posted_by = (select id from employees where user_id = auth.uid() limit 1)
  );

-- Authors and admins can delete their own announcements
create policy "author admin delete announcements" on announcements
  for delete using (
    posted_by = (select id from employees where user_id = auth.uid() limit 1)
    or get_my_role() = 'admin'
  );

-- ─── Seed initial departments ─────────────────────────────────────────────────
-- Remove or edit these to match your company
insert into departments (name) values
  ('Engineering'),
  ('Human Resources'),
  ('Finance'),
  ('Operations'),
  ('Sales'),
  ('Marketing')
on conflict (name) do nothing;

-- ─── Enforce: only admin can create employee records ──────────────────────────
-- Drop the old employer insert policy if it exists (from AddTeamMember era)
drop policy if exists "employer insert employees" on employees;

-- Ensure admin insert policy exists and is the ONLY insert policy
drop policy if exists "admin insert" on employees;
create policy "admin insert" on employees
  for insert with check (get_my_role() = 'admin');

-- ─── Admin reassign: allow updating manager_id ────────────────────────────────
-- Already covered by "admin update" policy, no additional policy needed.
-- But make sure employer update policy CANNOT touch manager_id.
-- Since employers don't have an update policy on employees at all,
-- this is already safe. Document it clearly:
-- Employers can only read employees assigned to them (via "directory read" + manager_id filter in app).
-- Deduct time off balance safely
create or replace function deduct_time_off_balance(
  p_employee_id uuid,
  p_category_id uuid,
  p_days numeric
) returns void language plpgsql security definer as $$
begin
  update time_off_balances
  set balance = balance - p_days
  where employee_id = p_employee_id
    and category_id = p_category_id;
end;
$$;

-- RLS: employer/admin can read all time_off_requests for their scope
create policy "employer admin read time off requests"
  on time_off_requests for select
  using (get_my_role() in ('employer', 'admin'));

create policy "employer admin update time off requests"
  on time_off_requests for update
  using (get_my_role() in ('employer', 'admin'));

-- RLS: employer/admin can read/update clock_corrections
create policy "employer admin read corrections"
  on clock_corrections for select
  using (get_my_role() in ('employer', 'admin'));

create policy "employer admin update corrections"
  on clock_corrections for update
  using (get_my_role() in ('employer', 'admin'));

-- RLS: employer/admin can update time_off_balances
create policy "admin employer update balances"
  on time_off_balances for update
  using (get_my_role() in ('employer', 'admin'));

create policy "admin employer insert balances"
  on time_off_balances for insert
  with check (get_my_role() in ('employer', 'admin'));

-- RLS: admin can edit emplyee
create policy "admin can update any employee"
  on employees for update
  using (get_my_role() = 'admin');

-- departments
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create policy "admin manage departments"
  on departments for all
  using (get_my_role() = 'admin');

create policy "all read departments"
  on departments for select
  using (true);

alter table departments enable row level security;


-- Allow authenticated users to upload to their own folder
drop policy if exists "Users can upload their own avatar" on storage.objects;

create policy "Users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);
