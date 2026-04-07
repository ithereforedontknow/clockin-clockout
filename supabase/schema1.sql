create table public.announcements (
  id text not null default (gen_random_uuid ())::text,
  title text not null,
  body text not null,
  posted_by text not null,
  target text not null default 'all'::text,
  target_employer_id text null,
  created_at timestamp with time zone not null default now(),
  pinned boolean not null default false,
  constraint announcements_pkey primary key (id),
  constraint announcements_posted_by_fkey foreign KEY (posted_by) references employees (id) on delete CASCADE,
  constraint announcements_target_employer_id_fkey foreign KEY (target_employer_id) references employees (id) on delete CASCADE,
  constraint announcements_target_check check (
    (
      target = any (array['all'::text, 'employer_team'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists announcements_target on public.announcements using btree (target, target_employer_id, created_at desc) TABLESPACE pg_default;

create table public.audit_log (
  id text not null default (gen_random_uuid ())::text,
  actor_id text not null,
  action text not null,
  target_table text not null,
  target_id text not null,
  old_value jsonb null,
  new_value jsonb null,
  note text null,
  created_at timestamp with time zone not null default now(),
  constraint audit_log_pkey primary key (id),
  constraint audit_log_actor_id_fkey foreign KEY (actor_id) references employees (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists audit_log_actor on public.audit_log using btree (actor_id, created_at desc) TABLESPACE pg_default;

create index IF not exists audit_log_target on public.audit_log using btree (target_table, target_id) TABLESPACE pg_default;

create index IF not exists audit_log_created on public.audit_log using btree (created_at desc) TABLESPACE pg_default;
create table public.audit_log (
  id text not null default (gen_random_uuid ())::text,
  actor_id text not null,
  action text not null,
  target_table text not null,
  target_id text not null,
  old_value jsonb null,
  new_value jsonb null,
  note text null,
  created_at timestamp with time zone not null default now(),
  constraint audit_log_pkey primary key (id),
  constraint audit_log_actor_id_fkey foreign KEY (actor_id) references employees (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists audit_log_actor on public.audit_log using btree (actor_id, created_at desc) TABLESPACE pg_default;

create index IF not exists audit_log_target on public.audit_log using btree (target_table, target_id) TABLESPACE pg_default;

create index IF not exists audit_log_created on public.audit_log using btree (created_at desc) TABLESPACE pg_default;
create table public.break_entries (
  id text not null default (gen_random_uuid ())::text,
  clock_entry_id text not null,
  break_start timestamp with time zone not null,
  break_end timestamp with time zone null,
  duration_minutes integer null,
  constraint break_entries_pkey primary key (id),
  constraint break_entries_clock_entry_id_fkey foreign KEY (clock_entry_id) references clock_entries (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.certifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  curriculum_id uuid not null,
  issued_at timestamp with time zone not null default now(),
  constraint certifications_pkey primary key (id),
  constraint certifications_user_id_curriculum_id_key unique (user_id, curriculum_id),
  constraint certifications_curriculum_id_fkey foreign KEY (curriculum_id) references curriculums (id) on delete CASCADE,
  constraint certifications_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.clock_corrections (
  id text not null default (gen_random_uuid ())::text,
  clock_entry_id text not null,
  employee_id text not null,
  requested_clock_in timestamp with time zone null,
  requested_clock_out timestamp with time zone null,
  requested_break_minutes integer null,
  requested_notes text null,
  reason text not null,
  status text not null default 'pending'::text,
  reviewer_comment text null,
  reviewed_by text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint clock_corrections_pkey primary key (id),
  constraint clock_corrections_clock_entry_id_fkey foreign KEY (clock_entry_id) references clock_entries (id) on delete CASCADE,
  constraint clock_corrections_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE,
  constraint clock_corrections_reviewed_by_fkey foreign KEY (reviewed_by) references employees (id) on delete set null,
  constraint clock_corrections_status_check check (
    (
      status = any (
        array['pending'::text, 'approved'::text, 'denied'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists clock_corrections_employee on public.clock_corrections using btree (employee_id, status) TABLESPACE pg_default;

create index IF not exists clock_corrections_status on public.clock_corrections using btree (status) TABLESPACE pg_default;

create trigger clock_corrections_updated_at BEFORE
update on clock_corrections for EACH row
execute FUNCTION set_updated_at ();
create table public.clock_entries (
  id text not null default (gen_random_uuid ())::text,
  employee_id text not null,
  clock_in timestamp with time zone not null,
  clock_out timestamp with time zone null,
  date date not null,
  notes text null,
  total_minutes integer null,
  created_at timestamp with time zone not null default now(),
  constraint clock_entries_pkey primary key (id),
  constraint clock_entries_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists clock_entries_employee_date on public.clock_entries using btree (employee_id, date) TABLESPACE pg_default;
create table public.company_holidays (
  id text not null default (gen_random_uuid ())::text,
  name text not null,
  month integer not null,
  day integer not null,
  constraint company_holidays_pkey primary key (id),
  constraint company_holidays_month_day_key unique (month, day),
  constraint company_holidays_day_check check (
    (
      (day >= 1)
      and (day <= 31)
    )
  ),
  constraint company_holidays_month_check check (
    (
      (month >= 1)
      and (month <= 12)
    )
  )
) TABLESPACE pg_default;
create table public.company_settings (
  id text not null default 'singleton'::text,
  company_name text not null default 'My Company'::text,
  standard_hours_per_day numeric not null default 8,
  standard_hours_per_week numeric not null default 40,
  standard_start_time time without time zone not null default '09:00:00'::time without time zone,
  working_days integer[] not null default '{1,2,3,4,5}'::integer[],
  overtime_threshold_daily numeric not null default 8,
  overtime_threshold_weekly numeric not null default 40,
  logo_url text null,
  updated_at timestamp with time zone not null default now(),
  industry text null,
  phone text null,
  email text null,
  website text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  country text null default 'Philippines'::text,
  constraint company_settings_pkey primary key (id)
) TABLESPACE pg_default;
create table public.curriculums (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  thumbnail_url text null,
  is_published boolean not null default false,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint curriculums_pkey primary key (id),
  constraint curriculums_created_by_fkey foreign KEY (created_by) references profiles (id) on delete RESTRICT
) TABLESPACE pg_default;

create trigger curriculums_updated_at BEFORE
update on curriculums for EACH row
execute FUNCTION handle_updated_at ();
create table public.departments (
  id text not null default (gen_random_uuid ())::text,
  name text not null,
  created_by text null,
  created_at timestamp with time zone not null default now(),
  constraint departments_pkey primary key (id),
  constraint departments_name_key unique (name),
  constraint departments_created_by_fkey foreign KEY (created_by) references employees (id) on delete set null
) TABLESPACE pg_default;
create table public.employees (
  id text not null default (gen_random_uuid ())::text,
  user_id uuid null,
  first_name text not null,
  last_name text not null,
  email text not null,
  job_title text not null default ''::text,
  department text not null default ''::text,
  location text not null default ''::text,
  hire_date date not null default CURRENT_DATE,
  manager_id text null,
  avatar_url text null,
  phone text null,
  employment_status text not null default 'active'::text,
  birthday date null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  role text not null default 'employee'::text,
  standard_hours_per_day numeric not null default 8,
  standard_hours_per_week numeric not null default 40,
  onboarding_completed boolean not null default false,
  preferred_name text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  country text null,
  emergency_name text null,
  emergency_phone text null,
  emergency_relation text null,
  standard_start_time time without time zone null default '09:00:00'::time without time zone,
  constraint employees_pkey primary key (id),
  constraint employees_email_key unique (email),
  constraint employees_manager_id_fkey foreign KEY (manager_id) references employees (id) on delete set null,
  constraint employees_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint employees_employment_status_check check (
    (
      employment_status = any (
        array[
          'active'::text,
          'inactive'::text,
          'on_leave'::text
        ]
      )
    )
  ),
  constraint employees_role_check check (
    (
      role = any (
        array['employee'::text, 'employer'::text, 'admin'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger employees_updated_at BEFORE
update on employees for EACH row
execute FUNCTION set_updated_at ();
create table public.lessons (
  id uuid not null default gen_random_uuid (),
  module_id uuid not null,
  title text not null,
  description text null,
  cf_stream_id text null,
  cf_stream_status text null default 'pending'::text,
  duration_seconds integer null,
  order_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  content_html text null,
  quiz jsonb null,
  curriculum_id uuid null,
  constraint lessons_pkey primary key (id),
  constraint lessons_curriculum_id_fkey foreign KEY (curriculum_id) references curriculums (id) on delete CASCADE,
  constraint lessons_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE,
  constraint lessons_cf_stream_status_check check (
    (
      cf_stream_status = any (
        array['pending'::text, 'ready'::text, 'error'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists lessons_module_order on public.lessons using btree (module_id, order_index) TABLESPACE pg_default;

create index IF not exists idx_lessons_curriculum_id on public.lessons using btree (curriculum_id) TABLESPACE pg_default;

create trigger lessons_updated_at BEFORE
update on lessons for EACH row
execute FUNCTION handle_updated_at ();
create table public.lessons (
  id uuid not null default gen_random_uuid (),
  module_id uuid not null,
  title text not null,
  description text null,
  cf_stream_id text null,
  cf_stream_status text null default 'pending'::text,
  duration_seconds integer null,
  order_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  content_html text null,
  quiz jsonb null,
  curriculum_id uuid null,
  constraint lessons_pkey primary key (id),
  constraint lessons_curriculum_id_fkey foreign KEY (curriculum_id) references curriculums (id) on delete CASCADE,
  constraint lessons_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE,
  constraint lessons_cf_stream_status_check check (
    (
      cf_stream_status = any (
        array['pending'::text, 'ready'::text, 'error'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists lessons_module_order on public.lessons using btree (module_id, order_index) TABLESPACE pg_default;

create index IF not exists idx_lessons_curriculum_id on public.lessons using btree (curriculum_id) TABLESPACE pg_default;

create trigger lessons_updated_at BEFORE
update on lessons for EACH row
execute FUNCTION handle_updated_at ();
create table public.modules (
  id uuid not null default gen_random_uuid (),
  curriculum_id uuid not null,
  title text not null,
  description text null,
  order_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint modules_pkey primary key (id),
  constraint modules_curriculum_id_fkey foreign KEY (curriculum_id) references curriculums (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists modules_curriculum_order on public.modules using btree (curriculum_id, order_index) TABLESPACE pg_default;

create trigger modules_updated_at BEFORE
update on modules for EACH row
execute FUNCTION handle_updated_at ();
create table public.notifications (
  id text not null default (gen_random_uuid ())::text,
  employee_id text not null,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  link_tab text null,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists notifications_employee_unread on public.notifications using btree (employee_id, read, created_at desc) TABLESPACE pg_default;
create table public.profiles (
  id uuid not null,
  full_name text null,
  avatar_url text null,
  role text not null default 'student'::text,
  total_hours numeric not null default 0,
  badges jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (
      role = any (
        array[
          'student'::text,
          'instructor'::text,
          'admin'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION handle_updated_at ();
create table public.progress_records (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  percent_watched numeric not null default 0,
  is_completed boolean not null default false,
  last_watched_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint progress_records_pkey primary key (id),
  constraint progress_records_user_id_lesson_id_key unique (user_id, lesson_id),
  constraint progress_records_lesson_id_fkey foreign KEY (lesson_id) references lessons (id) on delete CASCADE,
  constraint progress_records_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint progress_records_percent_watched_check check (
    (
      (percent_watched >= (0)::numeric)
      and (percent_watched <= (100)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists progress_user_lesson on public.progress_records using btree (user_id, lesson_id) TABLESPACE pg_default;

create index IF not exists progress_user_completed on public.progress_records using btree (user_id, is_completed) TABLESPACE pg_default;

create index IF not exists idx_progress_records_user_lesson on public.progress_records using btree (user_id, lesson_id) TABLESPACE pg_default;

create trigger progress_auto_complete BEFORE INSERT
or
update on progress_records for EACH row
execute FUNCTION handle_progress_completion ();

create trigger progress_records_updated_at BEFORE
update on progress_records for EACH row
execute FUNCTION handle_updated_at ();
create table public.time_off_balances (
  id text not null default (gen_random_uuid ())::text,
  employee_id text not null,
  category_id text not null,
  balance numeric not null default 0,
  scheduled numeric not null default 0,
  constraint time_off_balances_pkey primary key (id),
  constraint time_off_balances_employee_id_category_id_key unique (employee_id, category_id),
  constraint time_off_balances_category_id_fkey foreign KEY (category_id) references time_off_categories (id) on delete CASCADE,
  constraint time_off_balances_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.time_off_categories (
  id text not null default (gen_random_uuid ())::text,
  name text not null,
  accrual_rate numeric not null default 1.67,
  max_balance numeric null,
  unit text not null default 'days'::text,
  constraint time_off_categories_pkey primary key (id),
  constraint time_off_categories_unit_check check ((unit = any (array['days'::text, 'hours'::text])))
) TABLESPACE pg_default;
create table public.time_off_requests (
  id text not null default (gen_random_uuid ())::text,
  employee_id text not null,
  category_id text not null,
  start_date date not null,
  end_date date not null,
  amount numeric not null,
  status text not null default 'pending'::text,
  note text null,
  approver_comment text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint time_off_requests_pkey primary key (id),
  constraint time_off_requests_category_id_fkey foreign KEY (category_id) references time_off_categories (id) on delete CASCADE,
  constraint time_off_requests_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE,
  constraint time_off_requests_check check ((end_date >= start_date)),
  constraint time_off_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'denied'::text,
          'canceled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger time_off_requests_updated_at BEFORE
update on time_off_requests for EACH row
execute FUNCTION set_updated_at ();
create table public.training_assignments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  curriculum_id uuid not null,
  due_date date not null,
  assigned_by uuid null,
  assigned_at timestamp with time zone not null default now(),
  constraint training_assignments_pkey primary key (id),
  constraint training_assignments_user_id_curriculum_id_key unique (user_id, curriculum_id),
  constraint training_assignments_assigned_by_fkey foreign KEY (assigned_by) references profiles (id),
  constraint training_assignments_curriculum_id_fkey foreign KEY (curriculum_id) references curriculums (id) on delete CASCADE,
  constraint training_assignments_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.clock_entries (
  id text not null default (gen_random_uuid ())::text,
  employee_id text not null,
  clock_in timestamp with time zone not null,
  clock_out timestamp with time zone null,
  date date not null,
  notes text null,
  total_minutes integer null,
  created_at timestamp with time zone not null default now(),
  constraint clock_entries_pkey primary key (id),
  constraint clock_entries_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists clock_entries_employee_date on public.clock_entries using btree (employee_id, date) TABLESPACE pg_default;
create table public.info_change_requests (
  id text not null default (gen_random_uuid ())::text,
  employee_id text not null,
  field_name text not null,
  old_value text null,
  new_value text not null,
  status text not null default 'pending'::text,
  approver_comment text null,
  created_at timestamp with time zone not null default now(),
  constraint info_change_requests_pkey primary key (id),
  constraint info_change_requests_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete CASCADE,
  constraint info_change_requests_status_check check (
    (
      status = any (
        array['pending'::text, 'approved'::text, 'denied'::text]
      )
    )
  )
) TABLESPACE pg_default;
