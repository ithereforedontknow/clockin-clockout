-- ─── BambooHR Clone Schema ────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Employees ────────────────────────────────────────────────────────────────
create table employees (
  id                text primary key default gen_random_uuid()::text,
  user_id           uuid references auth.users(id) on delete set null,
  first_name        text not null,
  last_name         text not null,
  email             text not null unique,
  job_title         text not null default '',
  department        text not null default '',
  location          text not null default '',
  hire_date         date not null default current_date,
  manager_id        text references employees(id) on delete set null,
  avatar_url        text,
  phone             text,
  employment_status text not null default 'active'
                    check (employment_status in ('active', 'inactive', 'on_leave')),
  birthday          date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Time Off Categories ─────────────────────────────────────────────────────
create table time_off_categories (
  id           text primary key default gen_random_uuid()::text,
  name         text not null,
  accrual_rate numeric not null default 1.67,  -- days per month
  max_balance  numeric,                          -- null = unlimited
  unit         text not null default 'days'
               check (unit in ('days', 'hours'))
);

insert into time_off_categories (name, accrual_rate, unit) values
  ('Vacation', 1.67, 'days'),
  ('Sick',     1.0,  'days'),
  ('Personal', 0.5,  'days');

-- ─── Time Off Balances ───────────────────────────────────────────────────────
create table time_off_balances (
  id          text primary key default gen_random_uuid()::text,
  employee_id text not null references employees(id) on delete cascade,
  category_id text not null references time_off_categories(id) on delete cascade,
  balance     numeric not null default 0,
  scheduled   numeric not null default 0,
  unique (employee_id, category_id)
);

-- ─── Time Off Requests ───────────────────────────────────────────────────────
create table time_off_requests (
  id               text primary key default gen_random_uuid()::text,
  employee_id      text not null references employees(id) on delete cascade,
  category_id      text not null references time_off_categories(id) on delete cascade,
  start_date       date not null,
  end_date         date not null,
  amount           numeric not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'denied', 'canceled')),
  note             text,
  approver_comment text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ─── Info Change Requests ────────────────────────────────────────────────────
create table info_change_requests (
  id               text primary key default gen_random_uuid()::text,
  employee_id      text not null references employees(id) on delete cascade,
  field_name       text not null,
  old_value        text,
  new_value        text not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'denied')),
  approver_comment text,
  created_at       timestamptz not null default now()
);

-- ─── Company Holidays ────────────────────────────────────────────────────────
create table company_holidays (
  id   text primary key default gen_random_uuid()::text,
  name text not null,
  date date not null unique
);

-- Sample US holidays for 2025
insert into company_holidays (name, date) values
  ('New Year''s Day',       '2025-01-01'),
  ('MLK Day',               '2025-01-20'),
  ('Presidents'' Day',      '2025-02-17'),
  ('Memorial Day',          '2025-05-26'),
  ('Independence Day',      '2025-07-04'),
  ('Labor Day',             '2025-09-01'),
  ('Thanksgiving',          '2025-11-27'),
  ('Day After Thanksgiving','2025-11-28'),
  ('Christmas Eve',         '2025-12-24'),
  ('Christmas Day',         '2025-12-25');

-- ─── Row Level Security ──────────────────────────────────────────────────────

-- Employees can only see their own record (and all active employees for directory)
alter table employees enable row level security;

create policy "own record" on employees
  for all using (auth.uid() = user_id);

create policy "directory read" on employees
  for select using (employment_status = 'active');

-- Employees can only access their own time off data
alter table time_off_balances enable row level security;
create policy "own balances" on time_off_balances
  for all using (
    employee_id = (
      select id from employees where user_id = auth.uid() limit 1
    )
  );

alter table time_off_requests enable row level security;
create policy "own requests" on time_off_requests
  for all using (
    employee_id = (
      select id from employees where user_id = auth.uid() limit 1
    )
  );

alter table info_change_requests enable row level security;
create policy "own info changes" on info_change_requests
  for all using (
    employee_id = (
      select id from employees where user_id = auth.uid() limit 1
    )
  );

-- Categories and holidays are public read
alter table time_off_categories enable row level security;
create policy "public read categories" on time_off_categories for select using (true);

alter table company_holidays enable row level security;
create policy "public read holidays" on company_holidays for select using (true);

-- ─── Updated-at trigger ──────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger employees_updated_at
  before update on employees
  for each row execute procedure set_updated_at();

create trigger time_off_requests_updated_at
  before update on time_off_requests
  for each row execute procedure set_updated_at();


-- ─── ClockIn/Out additions ────────────────────────────────────────────────────

-- Add role + custom work hours to employees
alter table employees
  add column if not exists role text not null default 'employee'
    check (role in ('employee', 'manager', 'admin')),
  add column if not exists standard_hours_per_day  numeric not null default 8,
  add column if not exists standard_hours_per_week numeric not null default 40;

-- Clock entries (one row per shift)
create table if not exists clock_entries (
  id            text primary key default gen_random_uuid()::text,
  employee_id   text not null references employees(id) on delete cascade,
  clock_in      timestamptz not null,
  clock_out     timestamptz,
  date          date not null,          -- local date of the shift
  notes         text,
  total_minutes integer,                -- set on clock_out, excludes breaks
  created_at    timestamptz not null default now()
);

create index if not exists clock_entries_employee_date
  on clock_entries(employee_id, date);

-- Break entries (many per clock entry)
create table if not exists break_entries (
  id               text primary key default gen_random_uuid()::text,
  clock_entry_id   text not null references clock_entries(id) on delete cascade,
  break_start      timestamptz not null,
  break_end        timestamptz,
  duration_minutes integer               -- set on break_end
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table clock_entries enable row level security;

-- Employees see only their own; managers/admins see all
create policy "own clock entries" on clock_entries
  for all using (
    employee_id = (select id from employees where user_id = auth.uid() limit 1)
    or
    (select role from employees where user_id = auth.uid() limit 1) in ('manager','admin')
  );

alter table break_entries enable row level security;

create policy "own break entries" on break_entries
  for all using (
    clock_entry_id in (
      select id from clock_entries
      where employee_id = (select id from employees where user_id = auth.uid() limit 1)
    )
    or
    (select role from employees where user_id = auth.uid() limit 1) in ('manager','admin')
  );
