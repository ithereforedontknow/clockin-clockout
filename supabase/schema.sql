CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.employees (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name              text NOT NULL,
  last_name               text NOT NULL,
  email                   text NOT NULL UNIQUE,
  preferred_name          text,
  role                    text NOT NULL DEFAULT 'employee'
                          CHECK (role IN ('employee','employer','admin')),
  job_title               text NOT NULL DEFAULT '',
  department              text NOT NULL DEFAULT '',
  location                text NOT NULL DEFAULT '',
  hire_date               date NOT NULL DEFAULT CURRENT_DATE,
  manager_id              uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  avatar_url              text,
  phone                   text,
  birthday                date,
  employment_status       text NOT NULL DEFAULT 'active'
                          CHECK (employment_status IN ('active','inactive','on_leave')),
  standard_hours_per_day  numeric NOT NULL DEFAULT 8,
  standard_hours_per_week numeric NOT NULL DEFAULT 40,
  standard_start_time     time DEFAULT '09:00:00',
  onboarding_completed    boolean NOT NULL DEFAULT false,
  address_line1           text,
  address_line2           text,
  city                    text,
  country                 text,
  emergency_name          text,
  emergency_phone         text,
  emergency_relation      text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.departments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.company_settings (
  id                        text PRIMARY KEY DEFAULT 'singleton',
  company_name              text NOT NULL DEFAULT 'My Company',
  standard_hours_per_day    numeric NOT NULL DEFAULT 8,
  standard_hours_per_week   numeric NOT NULL DEFAULT 40,
  standard_start_time       time NOT NULL DEFAULT '09:00:00',
  working_days              integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  overtime_threshold_daily  numeric NOT NULL DEFAULT 8,
  overtime_threshold_weekly numeric NOT NULL DEFAULT 40,
  logo_url                  text,
  industry                  text,
  phone                     text,
  email                     text,
  website                   text,
  address_line1             text,
  address_line2             text,
  city                      text,
  country                   text DEFAULT 'Philippines',
  updated_at                timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.company_settings (id) VALUES ('singleton');

CREATE TABLE public.company_holidays (
  id    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name  text NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  day   integer NOT NULL CHECK (day BETWEEN 1 AND 31),
  UNIQUE (month, day)
);

CREATE TABLE public.announcements (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title              text NOT NULL,
  body               text NOT NULL,
  posted_by          uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  target             text NOT NULL DEFAULT 'all'
                     CHECK (target IN ('all','employer_team')),
  target_employer_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  pinned             boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  link_tab    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id     uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  action       text NOT NULL,
  target_table text NOT NULL,
  target_id    text NOT NULL,
  old_value    jsonb,
  new_value    jsonb,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.time_off_categories (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  accrual_rate numeric NOT NULL DEFAULT 1.67,
  max_balance  numeric,
  unit         text NOT NULL DEFAULT 'days' CHECK (unit IN ('days','hours'))
);

CREATE TABLE public.time_off_balances (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.time_off_categories(id) ON DELETE CASCADE,
  balance     numeric NOT NULL DEFAULT 0,
  scheduled   numeric NOT NULL DEFAULT 0,
  UNIQUE (employee_id, category_id)
);

CREATE TABLE public.time_off_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id      uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category_id      uuid NOT NULL REFERENCES public.time_off_categories(id) ON DELETE CASCADE,
  start_date       date NOT NULL,
  end_date         date NOT NULL CHECK (end_date >= start_date),
  amount           numeric NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','denied','canceled')),
  note             text,
  approver_comment text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.info_change_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id      uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  field_name       text NOT NULL,
  old_value        text,
  new_value        text NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','denied')),
  approver_comment text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clock_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id   uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  clock_in      timestamptz NOT NULL,
  clock_out     timestamptz,
  date          date NOT NULL,
  notes         text,
  total_minutes integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.break_entries (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clock_entry_id   uuid NOT NULL REFERENCES public.clock_entries(id) ON DELETE CASCADE,
  break_start      timestamptz NOT NULL,
  break_end        timestamptz,
  duration_minutes integer
);

CREATE TABLE public.clock_corrections (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clock_entry_id          uuid NOT NULL REFERENCES public.clock_entries(id) ON DELETE CASCADE,
  employee_id             uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  requested_clock_in      timestamptz,
  requested_clock_out     timestamptz,
  requested_break_minutes integer,
  requested_notes         text,
  reason                  text NOT NULL,
  status                  text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','denied')),
  reviewer_comment        text,
  reviewed_by             uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.curriculums (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  thumbnail_url text,
  is_published  boolean NOT NULL DEFAULT false,
  created_by    uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.modules (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id uuid NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  order_index   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id        uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  curriculum_id    uuid REFERENCES public.curriculums(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  cf_stream_id     text,
  cf_stream_status text DEFAULT 'pending'
                   CHECK (cf_stream_status IN ('pending','ready','error')),
  duration_seconds integer,
  order_index      integer NOT NULL DEFAULT 0,
  content_html     text,
  quiz             jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.training_assignments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id   uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  curriculum_id uuid NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
  due_date      date NOT NULL,
  assigned_by   uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, curriculum_id)
);

CREATE TABLE public.progress_records (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id     uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  percent_watched numeric NOT NULL DEFAULT 0
                  CHECK (percent_watched BETWEEN 0 AND 100),
  is_completed    boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, lesson_id)
);

CREATE TABLE public.certifications (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id   uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  curriculum_id uuid NOT NULL REFERENCES public.curriculums(id) ON DELETE CASCADE,
  issued_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, curriculum_id)
);
-- ─── Helper functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

-- ─── Training record view ─────────────────────────────────────────────────────

CREATE VIEW public.training_record AS
SELECT
  ta.employee_id,
  ta.curriculum_id,
  c.title        AS curriculum_title,
  c.thumbnail_url,
  ta.due_date,
  cert.issued_at AS completed_at,
  CASE
    WHEN cert.id IS NOT NULL        THEN 'completed'
    WHEN ta.due_date < CURRENT_DATE THEN 'overdue'
    WHEN ta.due_date <= CURRENT_DATE + 7 THEN 'due_soon'
    ELSE 'pending'
  END AS status,
  (ta.due_date - CURRENT_DATE) AS days_remaining
FROM public.training_assignments ta
JOIN public.curriculums c ON c.id = ta.curriculum_id
LEFT JOIN public.certifications cert
  ON cert.employee_id   = ta.employee_id
 AND cert.curriculum_id = ta.curriculum_id;

-- ─── Heartbeat type + batch upsert ───────────────────────────────────────────

CREATE TYPE public.heartbeat_event AS (
  lesson_id       uuid,
  percent_watched numeric
);

CREATE OR REPLACE FUNCTION public.upsert_progress_batch(events public.heartbeat_event[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  ev     public.heartbeat_event;
  emp_id uuid;
BEGIN
  SELECT id INTO emp_id FROM employees WHERE user_id = auth.uid() LIMIT 1;
  IF emp_id IS NULL THEN RETURN; END IF;
  FOREACH ev IN ARRAY events LOOP
    INSERT INTO progress_records (employee_id, lesson_id, percent_watched)
    VALUES (emp_id, ev.lesson_id, ev.percent_watched)
    ON CONFLICT (employee_id, lesson_id) DO UPDATE
      SET percent_watched = GREATEST(progress_records.percent_watched, excluded.percent_watched),
          is_completed    = CASE WHEN excluded.percent_watched >= 90 THEN true
                                 ELSE progress_records.is_completed END,
          last_watched_at = now(),
          updated_at      = now();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_training_record()
RETURNS SETOF public.training_record LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
  SELECT * FROM public.training_record
  WHERE employee_id = (SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1)
  ORDER BY
    CASE status
      WHEN 'overdue'   THEN 1
      WHEN 'due_soon'  THEN 2
      WHEN 'pending'   THEN 3
      ELSE 4
    END,
    due_date;
$$;

CREATE OR REPLACE FUNCTION public.deduct_time_off_balance(
  p_employee_id uuid,
  p_category_id uuid,
  p_days        numeric
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE time_off_balances
  SET balance = balance - p_days
  WHERE employee_id = p_employee_id
    AND category_id = p_category_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_employee(
  p_first_name              text,
  p_last_name               text,
  p_email                   text,
  p_role                    text,
  p_job_title               text    DEFAULT '',
  p_department              text    DEFAULT '',
  p_location                text    DEFAULT '',
  p_hire_date               date    DEFAULT CURRENT_DATE,
  p_standard_start_time     time    DEFAULT '09:00:00',
  p_standard_hours_per_day  numeric DEFAULT 8,
  p_standard_hours_per_week numeric DEFAULT 40,
  p_manager_id              uuid    DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_role text;
  v_emp  employees;
BEGIN
  SELECT role INTO v_role FROM employees WHERE user_id = auth.uid() LIMIT 1;
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create employees';
  END IF;
  IF EXISTS (SELECT 1 FROM employees WHERE lower(email) = lower(p_email)) THEN
    RAISE EXCEPTION 'An employee with email % already exists', p_email;
  END IF;
  INSERT INTO employees (
    first_name, last_name, email, role,
    job_title, department, location,
    hire_date, standard_start_time,
    standard_hours_per_day, standard_hours_per_week,
    manager_id, employment_status, onboarding_completed
  ) VALUES (
    p_first_name, p_last_name, lower(trim(p_email)), p_role,
    p_job_title, p_department, p_location,
    p_hire_date, p_standard_start_time,
    p_standard_hours_per_day, p_standard_hours_per_week,
    p_manager_id, 'active', false
  ) RETURNING * INTO v_emp;
  RETURN row_to_json(v_emp);
END;
$$;

-- ─── Triggers ─────────────────────────────────────────────────────────────────

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER curriculums_updated_at
  BEFORE UPDATE ON public.curriculums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON public.progress_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER time_off_requests_updated_at
  BEFORE UPDATE ON public.time_off_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER clock_corrections_updated_at
  BEFORE UPDATE ON public.clock_corrections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX ON public.employees (user_id);
CREATE INDEX ON public.clock_entries (employee_id, date);
CREATE INDEX ON public.modules (curriculum_id, order_index);
CREATE INDEX ON public.lessons (module_id, order_index);
CREATE INDEX ON public.lessons (curriculum_id);
CREATE INDEX ON public.progress_records (employee_id, is_completed);
CREATE INDEX ON public.notifications (employee_id, read, created_at DESC);
CREATE INDEX ON public.audit_log (actor_id, created_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_holidays     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_balances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_corrections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications       ENABLE ROW LEVEL SECURITY;

-- employees
CREATE POLICY "employees: read"
  ON public.employees FOR SELECT TO authenticated
  USING (employment_status = 'active' OR user_id = auth.uid());

CREATE POLICY "employees: update self"
  ON public.employees FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "employees: admin write"
  ON public.employees TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- departments
CREATE POLICY "departments: read"
  ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments: admin write"
  ON public.departments TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- company settings
CREATE POLICY "settings: read"
  ON public.company_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings: admin write"
  ON public.company_settings FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');

-- holidays
CREATE POLICY "holidays: read"
  ON public.company_holidays FOR SELECT TO authenticated USING (true);

CREATE POLICY "holidays: admin write"
  ON public.company_holidays TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- announcements
CREATE POLICY "announcements: select"
  ON public.announcements FOR SELECT TO authenticated
  USING (target = 'all' OR posted_by = get_my_employee_id());

CREATE POLICY "announcements: write"
  ON public.announcements TO authenticated
  USING (get_my_role() IN ('employer','admin'))
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- notifications
CREATE POLICY "notifications: own"
  ON public.notifications TO authenticated
  USING (employee_id = get_my_employee_id());

CREATE POLICY "notifications: write"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- audit log
CREATE POLICY "audit: admin read"
  ON public.audit_log FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "audit: write"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- time off categories
CREATE POLICY "toc: read"
  ON public.time_off_categories FOR SELECT TO authenticated USING (true);

-- time off balances
CREATE POLICY "tob: read"
  ON public.time_off_balances FOR SELECT TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "tob: admin write"
  ON public.time_off_balances TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- time off requests
CREATE POLICY "tor: read"
  ON public.time_off_requests FOR SELECT TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "tor: insert self"
  ON public.time_off_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_my_employee_id());

CREATE POLICY "tor: update"
  ON public.time_off_requests FOR UPDATE TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

-- info change requests
CREATE POLICY "icr: read write"
  ON public.info_change_requests TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "icr: insert self"
  ON public.info_change_requests FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_my_employee_id());

-- clock entries
CREATE POLICY "clock: read"
  ON public.clock_entries FOR SELECT TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "clock: insert self"
  ON public.clock_entries FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_my_employee_id());

CREATE POLICY "clock: update"
  ON public.clock_entries FOR UPDATE TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

-- break entries
CREATE POLICY "breaks: read write"
  ON public.break_entries TO authenticated
  USING (
    clock_entry_id IN (
      SELECT id FROM clock_entries
      WHERE employee_id = get_my_employee_id()
    )
    OR get_my_role() IN ('employer','admin')
  );

-- clock corrections
CREATE POLICY "corrections: read"
  ON public.clock_corrections FOR SELECT TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "corrections: insert self"
  ON public.clock_corrections FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_my_employee_id());

CREATE POLICY "corrections: update approver"
  ON public.clock_corrections FOR UPDATE TO authenticated
  USING (get_my_role() IN ('employer','admin'));

-- curriculums
CREATE POLICY "curriculums: read"
  ON public.curriculums FOR SELECT TO authenticated
  USING (is_published = true OR get_my_role() IN ('employer','admin'));

CREATE POLICY "curriculums: write"
  ON public.curriculums TO authenticated
  USING (get_my_role() IN ('employer','admin'))
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- modules
CREATE POLICY "modules: read"
  ON public.modules FOR SELECT TO authenticated
  USING (
    curriculum_id IN (
      SELECT id FROM curriculums
      WHERE is_published = true OR get_my_role() IN ('employer','admin')
    )
  );

CREATE POLICY "modules: write"
  ON public.modules TO authenticated
  USING (get_my_role() IN ('employer','admin'))
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- lessons
CREATE POLICY "lessons: read"
  ON public.lessons FOR SELECT TO authenticated
  USING (
    curriculum_id IN (
      SELECT id FROM curriculums
      WHERE is_published = true OR get_my_role() IN ('employer','admin')
    )
  );

CREATE POLICY "lessons: write"
  ON public.lessons TO authenticated
  USING (get_my_role() IN ('employer','admin'))
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- training assignments
CREATE POLICY "assignments: read"
  ON public.training_assignments FOR SELECT TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "assignments: write"
  ON public.training_assignments TO authenticated
  USING (get_my_role() IN ('employer','admin'))
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- progress records
CREATE POLICY "progress: read write"
  ON public.progress_records TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'))
  WITH CHECK (employee_id = get_my_employee_id());

-- certifications
CREATE POLICY "certifications: read"
  ON public.certifications FOR SELECT TO authenticated
  USING (employee_id = get_my_employee_id() OR get_my_role() IN ('employer','admin'));

CREATE POLICY "certifications: write"
  ON public.certifications TO authenticated
  USING (get_my_role() IN ('employer','admin'))
  WITH CHECK (get_my_role() IN ('employer','admin'));

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;



