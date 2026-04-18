


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."heartbeat_event" AS (
	"lesson_id" "uuid",
	"percent_watched" numeric
);


ALTER TYPE "public"."heartbeat_event" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_employee"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_role" "text", "p_job_title" "text" DEFAULT ''::"text", "p_department" "text" DEFAULT ''::"text", "p_location" "text" DEFAULT ''::"text", "p_hire_date" "date" DEFAULT CURRENT_DATE, "p_standard_start_time" time without time zone DEFAULT '09:00:00'::time without time zone, "p_standard_hours_per_day" numeric DEFAULT 8, "p_standard_hours_per_week" numeric DEFAULT 40, "p_manager_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."admin_create_employee"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_role" "text", "p_job_title" "text", "p_department" "text", "p_location" "text", "p_hire_date" "date", "p_standard_start_time" time without time zone, "p_standard_hours_per_day" numeric, "p_standard_hours_per_week" numeric, "p_manager_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."close_stale_clock_entries"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."close_stale_clock_entries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE time_off_balances
  SET balance = balance - p_days
  WHERE employee_id = p_employee_id
    AND category_id = p_category_id;
END;
$$;


ALTER FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_employee_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_employee_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_training_record"() RETURNS TABLE("curriculum_id" "uuid", "curriculum_title" "text", "thumbnail_url" "text", "assigned_at" timestamp with time zone, "due_date" "date", "status" "text", "completed_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  emp_id uuid;
BEGIN
  -- Get the employee ID for the authenticated user
  SELECT id INTO emp_id FROM employees WHERE user_id = auth.uid();
  IF emp_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    ta.curriculum_id,
    c.title AS curriculum_title,
    c.thumbnail_url,
    ta.assigned_at,
    ta.due_date,
    CASE
      WHEN cert.id IS NOT NULL THEN 'completed'
      WHEN ta.due_date < CURRENT_DATE THEN 'overdue'
      WHEN ta.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'due_soon'
      ELSE 'pending'
    END AS status,
    cert.issued_at AS completed_at
  FROM training_assignments ta
  JOIN curriculums c ON ta.curriculum_id = c.id
  LEFT JOIN certifications cert ON cert.employee_id = ta.employee_id 
                               AND cert.curriculum_id = ta.curriculum_id
  WHERE ta.employee_id = emp_id;
END;
$$;


ALTER FUNCTION "public"."get_my_training_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_employee_on_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE employees
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."link_employee_on_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "posted_by" "uuid" NOT NULL,
    "target" "text" DEFAULT 'all'::"text" NOT NULL,
    "target_employer_id" "uuid",
    "pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "announcements_target_check" CHECK (("target" = ANY (ARRAY['all'::"text", 'employer_team'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "target_table" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "old_value" "jsonb",
    "new_value" "jsonb",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."break_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clock_entry_id" "uuid" NOT NULL,
    "break_start" timestamp with time zone NOT NULL,
    "break_end" timestamp with time zone,
    "duration_minutes" integer
);


ALTER TABLE "public"."break_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "curriculum_id" "uuid" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clock_corrections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clock_entry_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "requested_clock_in" timestamp with time zone,
    "requested_clock_out" timestamp with time zone,
    "requested_break_minutes" integer,
    "requested_notes" "text",
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewer_comment" "text",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clock_corrections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text"])))
);


ALTER TABLE "public"."clock_corrections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clock_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "clock_in" timestamp with time zone NOT NULL,
    "clock_out" timestamp with time zone,
    "date" "date" NOT NULL,
    "notes" "text",
    "total_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clock_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_holidays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "month" integer NOT NULL,
    "day" integer NOT NULL,
    CONSTRAINT "company_holidays_day_check" CHECK ((("day" >= 1) AND ("day" <= 31))),
    CONSTRAINT "company_holidays_month_check" CHECK ((("month" >= 1) AND ("month" <= 12)))
);


ALTER TABLE "public"."company_holidays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "text" DEFAULT 'singleton'::"text" NOT NULL,
    "company_name" "text" DEFAULT 'My Company'::"text" NOT NULL,
    "standard_hours_per_day" numeric DEFAULT 8 NOT NULL,
    "standard_hours_per_week" numeric DEFAULT 40 NOT NULL,
    "standard_start_time" time without time zone DEFAULT '09:00:00'::time without time zone NOT NULL,
    "working_days" integer[] DEFAULT '{1,2,3,4,5}'::integer[] NOT NULL,
    "overtime_threshold_daily" numeric DEFAULT 8 NOT NULL,
    "overtime_threshold_weekly" numeric DEFAULT 40 NOT NULL,
    "logo_url" "text",
    "industry" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "country" "text" DEFAULT 'Philippines'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6b7280'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."curriculum_tags" (
    "curriculum_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."curriculum_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."curriculums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "thumbnail_url" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" "uuid"
);


ALTER TABLE "public"."curriculums" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."daily_payroll_analysis" WITH ("security_invoker"='on') AS
 WITH "daily_sums" AS (
         SELECT "clock_entries"."employee_id",
            "clock_entries"."date",
            "sum"(
                CASE
                    WHEN ("clock_entries"."clock_out" IS NOT NULL) THEN (EXTRACT(epoch FROM ("clock_entries"."clock_out" - "clock_entries"."clock_in")) / (60)::numeric)
                    ELSE (0)::numeric
                END) AS "total_minutes_worked",
            "count"(*) FILTER (WHERE ("clock_entries"."clock_out" IS NULL)) AS "open_entries"
           FROM "public"."clock_entries"
          GROUP BY "clock_entries"."employee_id", "clock_entries"."date"
        )
 SELECT "employee_id",
    "date",
    ("total_minutes_worked" / 60.0) AS "total_hours",
    (LEAST("total_minutes_worked", (480)::numeric) / 60.0) AS "reg_hours",
    (GREATEST((0)::numeric, ("total_minutes_worked" - (480)::numeric)) / 60.0) AS "ot_hours",
    "open_entries"
   FROM "daily_sums";


ALTER VIEW "public"."daily_payroll_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "preferred_name" "text",
    "role" "text" DEFAULT 'employee'::"text" NOT NULL,
    "job_title" "text" DEFAULT ''::"text" NOT NULL,
    "department" "text" DEFAULT ''::"text" NOT NULL,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "hire_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "manager_id" "uuid",
    "avatar_url" "text",
    "phone" "text",
    "birthday" "date",
    "employment_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "standard_hours_per_day" numeric DEFAULT 8 NOT NULL,
    "standard_hours_per_week" numeric DEFAULT 40 NOT NULL,
    "standard_start_time" time without time zone DEFAULT '09:00:00'::time without time zone,
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "country" "text",
    "emergency_name" "text",
    "emergency_phone" "text",
    "emergency_relation" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hourly_rate" numeric DEFAULT 0,
    "terminated_at" timestamp with time zone,
    CONSTRAINT "employees_employment_status_check" CHECK (("employment_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'on_leave'::"text"]))),
    CONSTRAINT "employees_role_check" CHECK (("role" = ANY (ARRAY['employee'::"text", 'employer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."info_change_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approver_comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "info_change_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text"])))
);


ALTER TABLE "public"."info_change_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "curriculum_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "cf_stream_id" "text",
    "cf_stream_status" "text" DEFAULT 'pending'::"text",
    "duration_seconds" integer,
    "order_index" integer DEFAULT 0 NOT NULL,
    "content_html" "text",
    "quiz" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lessons_cf_stream_status_check" CHECK (("cf_stream_status" = ANY (ARRAY['pending'::"text", 'ready'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "curriculum_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "link_tab" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."payroll_daily_summary" WITH ("security_invoker"='on') AS
 SELECT "employee_id",
    "date",
    "sum"(
        CASE
            WHEN ("clock_out" IS NOT NULL) THEN (EXTRACT(epoch FROM ("clock_out" - "clock_in")) / (3600)::numeric)
            ELSE (0)::numeric
        END) AS "total_hours",
    LEAST("sum"((EXTRACT(epoch FROM ("clock_out" - "clock_in")) / (3600)::numeric)), (8)::numeric) AS "reg_hours",
    GREATEST((0)::numeric, ("sum"((EXTRACT(epoch FROM ("clock_out" - "clock_in")) / (3600)::numeric)) - (8)::numeric)) AS "ot_hours",
    "count"(*) FILTER (WHERE ("clock_out" IS NULL)) AS "missing_clock_outs"
   FROM "public"."clock_entries"
  GROUP BY "employee_id", "date";


ALTER VIEW "public"."payroll_daily_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progress_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "percent_watched" numeric DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "last_watched_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "progress_records_percent_watched_check" CHECK ((("percent_watched" >= (0)::numeric) AND ("percent_watched" <= (100)::numeric)))
);


ALTER TABLE "public"."progress_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "balance" numeric DEFAULT 0 NOT NULL,
    "scheduled" numeric DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."time_off_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "accrual_rate" numeric DEFAULT 1.67 NOT NULL,
    "max_balance" numeric,
    "unit" "text" DEFAULT 'days'::"text" NOT NULL,
    CONSTRAINT "time_off_categories_unit_check" CHECK (("unit" = ANY (ARRAY['days'::"text", 'hours'::"text"])))
);


ALTER TABLE "public"."time_off_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "note" "text",
    "approver_comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "time_off_requests_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "time_off_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."time_off_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "curriculum_id" "uuid" NOT NULL,
    "due_date" "date" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."training_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."training_record" WITH ("security_invoker"='on') AS
 SELECT "ta"."employee_id",
    "ta"."curriculum_id",
    "c"."title" AS "curriculum_title",
    "c"."thumbnail_url",
    "ta"."due_date",
    "cert"."issued_at" AS "completed_at",
        CASE
            WHEN ("cert"."id" IS NOT NULL) THEN 'completed'::"text"
            WHEN ("ta"."due_date" < CURRENT_DATE) THEN 'overdue'::"text"
            WHEN ("ta"."due_date" <= (CURRENT_DATE + 7)) THEN 'due_soon'::"text"
            ELSE 'pending'::"text"
        END AS "status",
    ("ta"."due_date" - CURRENT_DATE) AS "days_remaining"
   FROM (("public"."training_assignments" "ta"
     JOIN "public"."curriculums" "c" ON (("c"."id" = "ta"."curriculum_id")))
     LEFT JOIN "public"."certifications" "cert" ON ((("cert"."employee_id" = "ta"."employee_id") AND ("cert"."curriculum_id" = "ta"."curriculum_id"))));


ALTER VIEW "public"."training_record" OWNER TO "postgres";


ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."break_entries"
    ADD CONSTRAINT "break_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_employee_id_curriculum_id_key" UNIQUE ("employee_id", "curriculum_id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clock_entries"
    ADD CONSTRAINT "clock_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_holidays"
    ADD CONSTRAINT "company_holidays_month_day_key" UNIQUE ("month", "day");



ALTER TABLE ONLY "public"."company_holidays"
    ADD CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_categories"
    ADD CONSTRAINT "course_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."course_categories"
    ADD CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_tags"
    ADD CONSTRAINT "course_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."course_tags"
    ADD CONSTRAINT "course_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."curriculum_tags"
    ADD CONSTRAINT "curriculum_tags_pkey" PRIMARY KEY ("curriculum_id", "tag_id");



ALTER TABLE ONLY "public"."curriculums"
    ADD CONSTRAINT "curriculums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."info_change_requests"
    ADD CONSTRAINT "info_change_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_employee_id_lesson_id_key" UNIQUE ("employee_id", "lesson_id");



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_employee_id_category_id_key" UNIQUE ("employee_id", "category_id");



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_off_categories"
    ADD CONSTRAINT "time_off_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_employee_id_curriculum_id_key" UNIQUE ("employee_id", "curriculum_id");



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_log_actor_id_created_at_idx" ON "public"."audit_log" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "clock_entries_employee_id_date_idx" ON "public"."clock_entries" USING "btree" ("employee_id", "date");



CREATE INDEX "employees_user_id_idx" ON "public"."employees" USING "btree" ("user_id");



CREATE INDEX "idx_certifications_employee_curriculum" ON "public"."certifications" USING "btree" ("employee_id", "curriculum_id");



CREATE INDEX "idx_lessons_curriculum_id" ON "public"."lessons" USING "btree" ("curriculum_id");



CREATE INDEX "idx_modules_curriculum_id" ON "public"."modules" USING "btree" ("curriculum_id");



CREATE INDEX "idx_progress_records_employee_lesson" ON "public"."progress_records" USING "btree" ("employee_id", "lesson_id");



CREATE INDEX "idx_training_assignments_curriculum_id" ON "public"."training_assignments" USING "btree" ("curriculum_id");



CREATE INDEX "idx_training_assignments_due_date" ON "public"."training_assignments" USING "btree" ("due_date");



CREATE INDEX "idx_training_assignments_employee_id" ON "public"."training_assignments" USING "btree" ("employee_id");



CREATE INDEX "lessons_curriculum_id_idx" ON "public"."lessons" USING "btree" ("curriculum_id");



CREATE INDEX "lessons_module_id_order_index_idx" ON "public"."lessons" USING "btree" ("module_id", "order_index");



CREATE INDEX "modules_curriculum_id_order_index_idx" ON "public"."modules" USING "btree" ("curriculum_id", "order_index");



CREATE INDEX "notifications_employee_id_read_created_at_idx" ON "public"."notifications" USING "btree" ("employee_id", "read", "created_at" DESC);



CREATE INDEX "progress_records_employee_id_is_completed_idx" ON "public"."progress_records" USING "btree" ("employee_id", "is_completed");



CREATE OR REPLACE TRIGGER "clock_corrections_updated_at" BEFORE UPDATE ON "public"."clock_corrections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "curriculums_updated_at" BEFORE UPDATE ON "public"."curriculums" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "lessons_updated_at" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "modules_updated_at" BEFORE UPDATE ON "public"."modules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "progress_updated_at" BEFORE UPDATE ON "public"."progress_records" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "time_off_requests_updated_at" BEFORE UPDATE ON "public"."time_off_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_target_employer_id_fkey" FOREIGN KEY ("target_employer_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."break_entries"
    ADD CONSTRAINT "break_entries_clock_entry_id_fkey" FOREIGN KEY ("clock_entry_id") REFERENCES "public"."clock_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_clock_entry_id_fkey" FOREIGN KEY ("clock_entry_id") REFERENCES "public"."clock_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clock_entries"
    ADD CONSTRAINT "clock_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curriculum_tags"
    ADD CONSTRAINT "curriculum_tags_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curriculum_tags"
    ADD CONSTRAINT "curriculum_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."course_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curriculums"
    ADD CONSTRAINT "curriculums_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."curriculums"
    ADD CONSTRAINT "curriculums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."info_change_requests"
    ADD CONSTRAINT "info_change_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."time_off_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."time_off_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



CREATE POLICY "Employees view own assignments" ON "public"."training_assignments" FOR SELECT USING (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Manage categories" ON "public"."course_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))));



CREATE POLICY "Manage curriculum_tags" ON "public"."curriculum_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))));



CREATE POLICY "Manage tags" ON "public"."course_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))));



CREATE POLICY "View categories" ON "public"."course_categories" FOR SELECT USING (true);



CREATE POLICY "View curriculum_tags" ON "public"."curriculum_tags" FOR SELECT USING (true);



CREATE POLICY "View tags" ON "public"."course_tags" FOR SELECT USING (true);



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements: select" ON "public"."announcements" FOR SELECT TO "authenticated" USING ((("target" = 'all'::"text") OR ("posted_by" = "public"."get_my_employee_id"())));



CREATE POLICY "announcements: write" ON "public"."announcements" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



CREATE POLICY "assignments: read" ON "public"."training_assignments" FOR SELECT TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "assignments: write" ON "public"."training_assignments" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



CREATE POLICY "audit: admin read" ON "public"."audit_log" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "audit: write" ON "public"."audit_log" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."break_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "breaks: read write" ON "public"."break_entries" TO "authenticated" USING ((("clock_entry_id" IN ( SELECT "clock_entries"."id"
   FROM "public"."clock_entries"
  WHERE ("clock_entries"."employee_id" = "public"."get_my_employee_id"()))) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."certifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "certifications: read" ON "public"."certifications" FOR SELECT TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "certifications: write" ON "public"."certifications" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



CREATE POLICY "clock: insert self" ON "public"."clock_entries" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" = "public"."get_my_employee_id"()));



CREATE POLICY "clock: read" ON "public"."clock_entries" FOR SELECT TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "clock: update" ON "public"."clock_entries" FOR UPDATE TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."clock_corrections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clock_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_holidays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "corrections: insert self" ON "public"."clock_corrections" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" = "public"."get_my_employee_id"()));



CREATE POLICY "corrections: read" ON "public"."clock_corrections" FOR SELECT TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "corrections: update approver" ON "public"."clock_corrections" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



ALTER TABLE "public"."course_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."curriculum_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."curriculums" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "curriculums: read" ON "public"."curriculums" FOR SELECT TO "authenticated" USING ((("is_published" = true) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "curriculums: write" ON "public"."curriculums" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "departments: admin write" ON "public"."departments" TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "departments: read" ON "public"."departments" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees: admin write" ON "public"."employees" TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "employees: read" ON "public"."employees" FOR SELECT TO "authenticated" USING ((("employment_status" = 'active'::"text") OR ("user_id" = "auth"."uid"())));



CREATE POLICY "employees: update self" ON "public"."employees" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "holidays: admin write" ON "public"."company_holidays" TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "holidays: read" ON "public"."company_holidays" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "icr: insert self" ON "public"."info_change_requests" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" = "public"."get_my_employee_id"()));



CREATE POLICY "icr: read write" ON "public"."info_change_requests" TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."info_change_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lessons: read" ON "public"."lessons" FOR SELECT TO "authenticated" USING (("curriculum_id" IN ( SELECT "curriculums"."id"
   FROM "public"."curriculums"
  WHERE (("curriculums"."is_published" = true) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))))));



CREATE POLICY "lessons: write" ON "public"."lessons" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "modules: read" ON "public"."modules" FOR SELECT TO "authenticated" USING (("curriculum_id" IN ( SELECT "curriculums"."id"
   FROM "public"."curriculums"
  WHERE (("curriculums"."is_published" = true) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))))));



CREATE POLICY "modules: write" ON "public"."modules" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications: own" ON "public"."notifications" TO "authenticated" USING (("employee_id" = "public"."get_my_employee_id"()));



CREATE POLICY "notifications: write" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



CREATE POLICY "progress: read write" ON "public"."progress_records" TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])))) WITH CHECK (("employee_id" = "public"."get_my_employee_id"()));



ALTER TABLE "public"."progress_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settings: admin write" ON "public"."company_settings" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "settings: read" ON "public"."company_settings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."time_off_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_off_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_off_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tob: admin write" ON "public"."time_off_balances" TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "tob: read" ON "public"."time_off_balances" FOR SELECT TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "toc: read" ON "public"."time_off_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "tor: insert self" ON "public"."time_off_requests" FOR INSERT TO "authenticated" WITH CHECK (("employee_id" = "public"."get_my_employee_id"()));



CREATE POLICY "tor: read" ON "public"."time_off_requests" FOR SELECT TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



CREATE POLICY "tor: update" ON "public"."time_off_requests" FOR UPDATE TO "authenticated" USING ((("employee_id" = "public"."get_my_employee_id"()) OR ("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."training_assignments" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_employee"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_role" "text", "p_job_title" "text", "p_department" "text", "p_location" "text", "p_hire_date" "date", "p_standard_start_time" time without time zone, "p_standard_hours_per_day" numeric, "p_standard_hours_per_week" numeric, "p_manager_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_employee"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_role" "text", "p_job_title" "text", "p_department" "text", "p_location" "text", "p_hire_date" "date", "p_standard_start_time" time without time zone, "p_standard_hours_per_day" numeric, "p_standard_hours_per_week" numeric, "p_manager_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_employee"("p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_role" "text", "p_job_title" "text", "p_department" "text", "p_location" "text", "p_hire_date" "date", "p_standard_start_time" time without time zone, "p_standard_hours_per_day" numeric, "p_standard_hours_per_week" numeric, "p_manager_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."close_stale_clock_entries"() TO "anon";
GRANT ALL ON FUNCTION "public"."close_stale_clock_entries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_stale_clock_entries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_employee_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_employee_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_employee_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_training_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_training_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_training_record"() TO "service_role";



GRANT ALL ON FUNCTION "public"."link_employee_on_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_employee_on_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_employee_on_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."break_entries" TO "anon";
GRANT ALL ON TABLE "public"."break_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."break_entries" TO "service_role";



GRANT ALL ON TABLE "public"."certifications" TO "anon";
GRANT ALL ON TABLE "public"."certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."certifications" TO "service_role";



GRANT ALL ON TABLE "public"."clock_corrections" TO "anon";
GRANT ALL ON TABLE "public"."clock_corrections" TO "authenticated";
GRANT ALL ON TABLE "public"."clock_corrections" TO "service_role";



GRANT ALL ON TABLE "public"."clock_entries" TO "anon";
GRANT ALL ON TABLE "public"."clock_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."clock_entries" TO "service_role";



GRANT ALL ON TABLE "public"."company_holidays" TO "anon";
GRANT ALL ON TABLE "public"."company_holidays" TO "authenticated";
GRANT ALL ON TABLE "public"."company_holidays" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."course_categories" TO "anon";
GRANT ALL ON TABLE "public"."course_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."course_categories" TO "service_role";



GRANT ALL ON TABLE "public"."course_tags" TO "anon";
GRANT ALL ON TABLE "public"."course_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."course_tags" TO "service_role";



GRANT ALL ON TABLE "public"."curriculum_tags" TO "anon";
GRANT ALL ON TABLE "public"."curriculum_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."curriculum_tags" TO "service_role";



GRANT ALL ON TABLE "public"."curriculums" TO "anon";
GRANT ALL ON TABLE "public"."curriculums" TO "authenticated";
GRANT ALL ON TABLE "public"."curriculums" TO "service_role";



GRANT ALL ON TABLE "public"."daily_payroll_analysis" TO "anon";
GRANT ALL ON TABLE "public"."daily_payroll_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_payroll_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."info_change_requests" TO "anon";
GRANT ALL ON TABLE "public"."info_change_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."info_change_requests" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_daily_summary" TO "anon";
GRANT ALL ON TABLE "public"."payroll_daily_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_daily_summary" TO "service_role";



GRANT ALL ON TABLE "public"."progress_records" TO "anon";
GRANT ALL ON TABLE "public"."progress_records" TO "authenticated";
GRANT ALL ON TABLE "public"."progress_records" TO "service_role";



GRANT ALL ON TABLE "public"."time_off_balances" TO "anon";
GRANT ALL ON TABLE "public"."time_off_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."time_off_balances" TO "service_role";



GRANT ALL ON TABLE "public"."time_off_categories" TO "anon";
GRANT ALL ON TABLE "public"."time_off_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."time_off_categories" TO "service_role";



GRANT ALL ON TABLE "public"."time_off_requests" TO "anon";
GRANT ALL ON TABLE "public"."time_off_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."time_off_requests" TO "service_role";



GRANT ALL ON TABLE "public"."training_assignments" TO "anon";
GRANT ALL ON TABLE "public"."training_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."training_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."training_record" TO "anon";
GRANT ALL ON TABLE "public"."training_record" TO "authenticated";
GRANT ALL ON TABLE "public"."training_record" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







