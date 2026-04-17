INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.employees WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.employees WHERE user_id = auth.uid() LIMIT 1
    )
  );
  CREATE OR REPLACE FUNCTION public.close_stale_clock_entries()
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
  BEGIN
    UPDATE clock_entries
    SET
      clock_out = (date + interval '23 hours 59 minutes')::timestamptz,
      total_minutes = 1439,
      notes = COALESCE(notes || ' ', '') || '[Auto-closed: missed clock-out]'
    WHERE
      clock_out IS NULL
      AND date < CURRENT_DATE;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.close_stale_clock_entries() TO authenticated;

  DROP POLICY IF EXISTS "avatars: owner upload" ON storage.objects;
  DROP POLICY IF EXISTS "avatars: owner update" ON storage.objects;

  CREATE POLICY "avatars: owner upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "avatars: owner update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

--

-- Create the function
CREATE OR REPLACE FUNCTION public.link_employee_on_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE employees
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_employee_on_auth_user();

-- Link any existing unlinked accounts immediately
UPDATE employees e
SET user_id = u.id
FROM auth.users u
WHERE lower(e.email) = lower(u.email)
  AND e.user_id IS NULL;

--
CREATE OR REPLACE VIEW daily_payroll_analysis AS
WITH daily_sums AS (
    -- Step 1: Sum minutes per employee per day
    SELECT
        employee_id,
        date,
        SUM(
            CASE
                WHEN clock_out IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (clock_out - clock_in)) / 60
                ELSE 0
            END
        ) as total_minutes_worked,
        COUNT(*) FILTER (WHERE clock_out IS NULL) as open_entries
    FROM clock_entries
    GROUP BY employee_id, date
)
-- Step 2: Apply the 8-hour (480 min) daily limit logic
SELECT
    employee_id,
    date,
    total_minutes_worked / 60.0 as total_hours,
    LEAST(total_minutes_worked, 480) / 60.0 as reg_hours,
    GREATEST(0, total_minutes_worked - 480) / 60.0 as ot_hours,
    open_entries
FROM daily_sums;

create or replace view public.daily_payroll_analysis with (security_invoker = on) as
 WITH daily_sums AS (
         SELECT clock_entries.employee_id,
            clock_entries.date,
            sum(
                CASE
                    WHEN clock_entries.clock_out IS NOT NULL THEN EXTRACT(epoch FROM clock_entries.clock_out - clock_entries.clock_in) / 60::numeric
                    ELSE 0::numeric
                END) AS total_minutes_worked,
            count(*) FILTER (WHERE clock_entries.clock_out IS NULL) AS open_entries
           FROM clock_entries
          GROUP BY clock_entries.employee_id, clock_entries.date
        )
 SELECT employee_id,
    date,
    total_minutes_worked / 60.0 AS total_hours,
    LEAST(total_minutes_worked, 480::numeric) / 60.0 AS reg_hours,
    GREATEST(0::numeric, total_minutes_worked - 480::numeric) / 60.0 AS ot_hours,
    open_entries
   FROM daily_sums;
---
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS hourly_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz;
