


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


CREATE OR REPLACE FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update time_off_balances
  set balance = balance - p_days
  where employee_id = p_employee_id
    and category_id = p_category_id;
end;
$$;


ALTER FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "curriculum_id" "uuid" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."curriculums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "thumbnail_url" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."curriculums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "curriculum_id" "uuid" NOT NULL,
    "due_date" "date" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."training_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."training_record" AS
 SELECT "ta"."user_id",
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
     LEFT JOIN "public"."certifications" "cert" ON ((("cert"."user_id" = "ta"."user_id") AND ("cert"."curriculum_id" = "ta"."curriculum_id"))));


ALTER VIEW "public"."training_record" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_training_record"() RETURNS SETOF "public"."training_record"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."get_my_training_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_progress_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.percent_watched >= 90 then
    new.is_completed = true;
  end if;
  new.last_watched_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_progress_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_employee_on_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE employees
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."link_employee_on_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  ev public.heartbeat_event;
begin
  foreach ev in array events loop
    insert into public.progress_records (user_id, lesson_id, percent_watched)
    values (auth.uid(), ev.lesson_id, ev.percent_watched)
    on conflict (user_id, lesson_id) do update
      set percent_watched = greatest(
            public.progress_records.percent_watched,
            excluded.percent_watched
          );
      -- Note: the trigger handles is_completed and last_watched_at
  end loop;
end;
$$;


ALTER FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "posted_by" "text" NOT NULL,
    "target" "text" DEFAULT 'all'::"text" NOT NULL,
    "target_employer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pinned" boolean DEFAULT false NOT NULL,
    CONSTRAINT "announcements_target_check" CHECK (("target" = ANY (ARRAY['all'::"text", 'employer_team'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "actor_id" "text" NOT NULL,
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
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "clock_entry_id" "text" NOT NULL,
    "break_start" timestamp with time zone NOT NULL,
    "break_end" timestamp with time zone,
    "duration_minutes" integer
);


ALTER TABLE "public"."break_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clock_corrections" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "clock_entry_id" "text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "requested_clock_in" timestamp with time zone,
    "requested_clock_out" timestamp with time zone,
    "requested_break_minutes" integer,
    "requested_notes" "text",
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewer_comment" "text",
    "reviewed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clock_corrections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text"])))
);


ALTER TABLE "public"."clock_corrections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clock_entries" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "clock_in" timestamp with time zone NOT NULL,
    "clock_out" timestamp with time zone,
    "date" "date" NOT NULL,
    "notes" "text",
    "total_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clock_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_holidays" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "industry" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "country" "text" DEFAULT 'Philippines'::"text"
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "user_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "job_title" "text" DEFAULT ''::"text" NOT NULL,
    "department" "text" DEFAULT ''::"text" NOT NULL,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "hire_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "manager_id" "text",
    "avatar_url" "text",
    "phone" "text",
    "employment_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "birthday" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'employee'::"text" NOT NULL,
    "standard_hours_per_day" numeric DEFAULT 8 NOT NULL,
    "standard_hours_per_week" numeric DEFAULT 40 NOT NULL,
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "preferred_name" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "country" "text",
    "emergency_name" "text",
    "emergency_phone" "text",
    "emergency_relation" "text",
    "standard_start_time" time without time zone DEFAULT '09:00:00'::time without time zone,
    CONSTRAINT "employees_employment_status_check" CHECK (("employment_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'on_leave'::"text"]))),
    CONSTRAINT "employees_role_check" CHECK (("role" = ANY (ARRAY['employee'::"text", 'employer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."info_change_requests" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "employee_id" "text" NOT NULL,
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
    "title" "text" NOT NULL,
    "description" "text",
    "cf_stream_id" "text",
    "cf_stream_status" "text" DEFAULT 'pending'::"text",
    "duration_seconds" integer,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_html" "text",
    "quiz" "jsonb",
    "curriculum_id" "uuid",
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
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "link_tab" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'student'::"text" NOT NULL,
    "total_hours" numeric DEFAULT 0 NOT NULL,
    "badges" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['student'::"text", 'instructor'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progress_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
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
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "balance" numeric DEFAULT 0 NOT NULL,
    "scheduled" numeric DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."time_off_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_categories" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "name" "text" NOT NULL,
    "accrual_rate" numeric DEFAULT 1.67 NOT NULL,
    "max_balance" numeric,
    "unit" "text" DEFAULT 'days'::"text" NOT NULL,
    CONSTRAINT "time_off_categories_unit_check" CHECK (("unit" = ANY (ARRAY['days'::"text", 'hours'::"text"])))
);


ALTER TABLE "public"."time_off_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_off_requests" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "employee_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
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


ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."break_entries"
    ADD CONSTRAINT "break_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_user_id_curriculum_id_key" UNIQUE ("user_id", "curriculum_id");



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



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_employee_id_category_id_key" UNIQUE ("employee_id", "category_id");



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_off_categories"
    ADD CONSTRAINT "time_off_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_user_id_curriculum_id_key" UNIQUE ("user_id", "curriculum_id");



CREATE INDEX "announcements_target" ON "public"."announcements" USING "btree" ("target", "target_employer_id", "created_at" DESC);



CREATE INDEX "audit_log_actor" ON "public"."audit_log" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "audit_log_created" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "audit_log_target" ON "public"."audit_log" USING "btree" ("target_table", "target_id");



CREATE INDEX "clock_corrections_employee" ON "public"."clock_corrections" USING "btree" ("employee_id", "status");



CREATE INDEX "clock_corrections_status" ON "public"."clock_corrections" USING "btree" ("status");



CREATE INDEX "clock_entries_employee_date" ON "public"."clock_entries" USING "btree" ("employee_id", "date");



CREATE INDEX "idx_lessons_curriculum_id" ON "public"."lessons" USING "btree" ("curriculum_id");



CREATE INDEX "idx_progress_records_user_lesson" ON "public"."progress_records" USING "btree" ("user_id", "lesson_id");



CREATE INDEX "lessons_module_order" ON "public"."lessons" USING "btree" ("module_id", "order_index");



CREATE INDEX "modules_curriculum_order" ON "public"."modules" USING "btree" ("curriculum_id", "order_index");



CREATE INDEX "notifications_employee_unread" ON "public"."notifications" USING "btree" ("employee_id", "read", "created_at" DESC);



CREATE INDEX "progress_user_completed" ON "public"."progress_records" USING "btree" ("user_id", "is_completed");



CREATE INDEX "progress_user_lesson" ON "public"."progress_records" USING "btree" ("user_id", "lesson_id");



CREATE OR REPLACE TRIGGER "clock_corrections_updated_at" BEFORE UPDATE ON "public"."clock_corrections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "curriculums_updated_at" BEFORE UPDATE ON "public"."curriculums" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "lessons_updated_at" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "modules_updated_at" BEFORE UPDATE ON "public"."modules" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "progress_auto_complete" BEFORE INSERT OR UPDATE ON "public"."progress_records" FOR EACH ROW EXECUTE FUNCTION "public"."handle_progress_completion"();



CREATE OR REPLACE TRIGGER "progress_records_updated_at" BEFORE UPDATE ON "public"."progress_records" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



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
    ADD CONSTRAINT "certifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_clock_entry_id_fkey" FOREIGN KEY ("clock_entry_id") REFERENCES "public"."clock_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clock_corrections"
    ADD CONSTRAINT "clock_corrections_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clock_entries"
    ADD CONSTRAINT "clock_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curriculums"
    ADD CONSTRAINT "curriculums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



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



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_records"
    ADD CONSTRAINT "progress_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."time_off_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_balances"
    ADD CONSTRAINT "time_off_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."time_off_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_assignments"
    ADD CONSTRAINT "training_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "admin manage departments" ON "public"."departments" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin manage holidays" ON "public"."company_holidays" TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin read audit log" ON "public"."audit_log" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin update settings" ON "public"."company_settings" FOR UPDATE USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "admin_all_corrections" ON "public"."clock_corrections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))));



CREATE POLICY "admin_see_all_corrections" ON "public"."clock_corrections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements_manage" ON "public"."announcements" USING (((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))) OR ("posted_by" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "announcements_select" ON "public"."announcements" FOR SELECT USING ((("target" = 'all'::"text") OR (("target" = 'employer_team'::"text") AND ("target_employer_id" = ( SELECT "employees"."manager_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)))));



CREATE POLICY "approve corrections" ON "public"."clock_corrections" FOR UPDATE TO "authenticated" USING ((("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])) AND ("employee_id" <> ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "approve info changes" ON "public"."info_change_requests" FOR UPDATE TO "authenticated" USING ((("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])) AND ("employee_id" <> ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "approver_review_corrections" ON "public"."clock_corrections" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['employer'::"text", 'admin'::"text"]))))));



CREATE POLICY "assignments: admin write" ON "public"."training_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['instructor'::"text", 'admin'::"text"]))))));



CREATE POLICY "assignments: owner read" ON "public"."training_assignments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "assignments_select_admin" ON "public"."training_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))));



CREATE POLICY "assignments_select_self" ON "public"."training_assignments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "assignments_select_team" ON "public"."training_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "manager"
     JOIN "public"."employees" "subordinate" ON (("subordinate"."manager_id" = "manager"."id")))
  WHERE (("manager"."user_id" = "auth"."uid"()) AND ("manager"."role" = 'employer'::"text") AND ("subordinate"."user_id" = "training_assignments"."user_id")))));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "auth read categories" ON "public"."time_off_categories" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "auth read holidays" ON "public"."company_holidays" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated read departments" ON "public"."departments" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated read settings" ON "public"."company_settings" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "balances_select_admin" ON "public"."time_off_balances" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))));



CREATE POLICY "balances_select_self" ON "public"."time_off_balances" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "balances_select_team" ON "public"."time_off_balances" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "manager"
     JOIN "public"."employees" "subordinate" ON (("subordinate"."manager_id" = "manager"."id")))
  WHERE (("manager"."user_id" = "auth"."uid"()) AND ("manager"."role" = 'employer'::"text") AND ("subordinate"."id" = "time_off_balances"."employee_id")))));



ALTER TABLE "public"."break_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "certifications: instructor read" ON "public"."certifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['instructor'::"text", 'admin'::"text"]))))));



CREATE POLICY "certifications: owner read" ON "public"."certifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."clock_corrections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clock_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clock_insert_self" ON "public"."clock_entries" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "clock_select_admin" ON "public"."clock_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))));



CREATE POLICY "clock_select_self" ON "public"."clock_entries" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "clock_select_team" ON "public"."clock_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "manager"
     JOIN "public"."employees" "subordinate" ON (("subordinate"."manager_id" = "manager"."id")))
  WHERE (("manager"."user_id" = "auth"."uid"()) AND ("manager"."role" = 'employer'::"text") AND ("subordinate"."id" = "clock_entries"."employee_id")))));



ALTER TABLE "public"."company_holidays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."curriculums" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "curriculums: instructor insert" ON "public"."curriculums" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['instructor'::"text", 'admin'::"text"])))))));



CREATE POLICY "curriculums: owner or admin modify" ON "public"."curriculums" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "curriculums: read published" ON "public"."curriculums" FOR SELECT USING ((("is_published" = true) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "curriculums_manage_instructor" ON "public"."curriculums" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))));



CREATE POLICY "curriculums_select_instructor" ON "public"."curriculums" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))));



CREATE POLICY "curriculums_select_published" ON "public"."curriculums" FOR SELECT USING (("is_published" = true));



ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_insert_corrections" ON "public"."clock_corrections" FOR INSERT WITH CHECK (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "employee_own_corrections" ON "public"."clock_corrections" FOR SELECT USING (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "employee_own_corrections_insert" ON "public"."clock_corrections" FOR INSERT WITH CHECK (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "employee_own_corrections_select" ON "public"."clock_corrections" FOR SELECT USING (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_select_self" ON "public"."employees" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "employees_select_unlinked" ON "public"."employees" FOR SELECT USING ((("user_id" IS NULL) AND ("lower"("email") = "lower"("auth"."email"()))));



CREATE POLICY "employees_update_self" ON "public"."employees" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "employees_update_unlinked" ON "public"."employees" FOR UPDATE USING ((("user_id" IS NULL) AND ("lower"("email") = "lower"("auth"."email"())))) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "employer admin insert audit log" ON "public"."audit_log" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])) AND ("actor_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1))));



CREATE POLICY "employer_team_corrections" ON "public"."clock_corrections" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."manager_id" = ( SELECT "employees_1"."id"
           FROM "public"."employees" "employees_1"
          WHERE (("employees_1"."user_id" = "auth"."uid"()) AND ("employees_1"."role" = 'employer'::"text"))
         LIMIT 1)))));



ALTER TABLE "public"."info_change_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "instructor read all progress" ON "public"."progress_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['employer'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lessons: instructor write" ON "public"."lessons" USING ((EXISTS ( SELECT 1
   FROM (("public"."modules" "m"
     JOIN "public"."curriculums" "c" ON (("c"."id" = "m"."curriculum_id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("m"."id" = "lessons"."module_id") AND (("c"."created_by" = "auth"."uid"()) OR ("p"."role" = 'admin'::"text"))))));



CREATE POLICY "lessons: read via module" ON "public"."lessons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."curriculums" "c" ON (("c"."id" = "m"."curriculum_id")))
  WHERE (("m"."id" = "lessons"."module_id") AND (("c"."is_published" = true) OR ("c"."created_by" = "auth"."uid"()))))));



CREATE POLICY "lessons_select" ON "public"."lessons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."curriculums"
  WHERE (("curriculums"."id" = "lessons"."curriculum_id") AND (("curriculums"."is_published" = true) OR (EXISTS ( SELECT 1
           FROM "public"."employees"
          WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))))))));



CREATE POLICY "manager admin insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['employer'::"text", 'admin'::"text"])));



CREATE POLICY "manager admin read info changes" ON "public"."info_change_requests" FOR SELECT USING ((("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)) OR ("public"."get_my_role"() = ANY (ARRAY['manager'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "modules: instructor write" ON "public"."modules" USING ((EXISTS ( SELECT 1
   FROM ("public"."curriculums" "c"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("c"."id" = "modules"."curriculum_id") AND (("c"."created_by" = "auth"."uid"()) OR ("p"."role" = 'admin'::"text"))))));



CREATE POLICY "modules: read via curriculum" ON "public"."modules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."curriculums" "c"
  WHERE (("c"."id" = "modules"."curriculum_id") AND (("c"."is_published" = true) OR ("c"."created_by" = "auth"."uid"()))))));



CREATE POLICY "modules_manage_instructor" ON "public"."modules" USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))));



CREATE POLICY "modules_select" ON "public"."modules" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."curriculums"
  WHERE (("curriculums"."id" = "modules"."curriculum_id") AND (("curriculums"."is_published" = true) OR (EXISTS ( SELECT 1
           FROM "public"."employees"
          WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = ANY (ARRAY['admin'::"text", 'employer'::"text"]))))))))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own break entries" ON "public"."break_entries" USING ((("clock_entry_id" IN ( SELECT "clock_entries"."id"
   FROM "public"."clock_entries"
  WHERE ("clock_entries"."employee_id" = ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = "auth"."uid"())
         LIMIT 1)))) OR (( SELECT "employees"."role"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1) = ANY (ARRAY['manager'::"text", 'admin'::"text"]))));



CREATE POLICY "own info changes" ON "public"."info_change_requests" USING (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "own notifications" ON "public"."notifications" USING (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "own requests" ON "public"."time_off_requests" USING (("employee_id" = ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())
 LIMIT 1)));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: admin update" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "profiles: owner update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles: public read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "progress: instructor read" ON "public"."progress_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['instructor'::"text", 'admin'::"text"]))))));



CREATE POLICY "progress: owner only" ON "public"."progress_records" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."progress_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requests_insert_self" ON "public"."time_off_requests" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "requests_select_admin" ON "public"."time_off_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."employees"
  WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."role" = 'admin'::"text")))));



CREATE POLICY "requests_select_self" ON "public"."time_off_requests" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "requests_select_team" ON "public"."time_off_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "manager"
     JOIN "public"."employees" "subordinate" ON (("subordinate"."manager_id" = "manager"."id")))
  WHERE (("manager"."user_id" = "auth"."uid"()) AND ("manager"."role" = 'employer'::"text") AND ("subordinate"."id" = "time_off_requests"."employee_id")))));



ALTER TABLE "public"."time_off_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_off_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_off_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can manage own progress" ON "public"."progress_records" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_time_off_balance"("p_employee_id" "uuid", "p_category_id" "uuid", "p_days" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON TABLE "public"."certifications" TO "anon";
GRANT ALL ON TABLE "public"."certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."certifications" TO "service_role";



GRANT ALL ON TABLE "public"."curriculums" TO "anon";
GRANT ALL ON TABLE "public"."curriculums" TO "authenticated";
GRANT ALL ON TABLE "public"."curriculums" TO "service_role";



GRANT ALL ON TABLE "public"."training_assignments" TO "anon";
GRANT ALL ON TABLE "public"."training_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."training_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."training_record" TO "anon";
GRANT ALL ON TABLE "public"."training_record" TO "authenticated";
GRANT ALL ON TABLE "public"."training_record" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_training_record"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_training_record"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_training_record"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_progress_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_progress_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_progress_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."link_employee_on_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."link_employee_on_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_employee_on_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_progress_batch"("events" "public"."heartbeat_event"[]) FROM PUBLIC;
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



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



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







