import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface LmsModuleWithLessons extends LmsModule {
  lessons: Lesson[]
}
// ─── Database Types ────────────────────────────────────────────────────────

export type UserRole = "employee" | "employer" | "admin"

export interface Employee {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  location: string
  hire_date: string
  manager_id: string | null
  avatar_url: string | null
  phone: string | null
  employment_status: "active" | "inactive" | "on_leave"
  birthday: string | null
  role: UserRole
  standard_hours_per_day: number
  standard_hours_per_week: number
  // Onboarding
  onboarding_completed: boolean
  preferred_name: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  country: string | null
  emergency_name: string | null
  emergency_phone: string | null
  emergency_relation: string | null
  standard_start_time: string | null // "HH:MM:SS" — used for late clock-in detection
  created_at: string
  updated_at: string
}

export type ClockStatus = "clocked_in" | "on_break" | "clocked_out"

export interface ClockEntry {
  id: string
  employee_id: string
  clock_in: string
  clock_out: string | null
  date: string
  notes: string | null
  total_minutes: number | null
  created_at: string
  employee?: Employee
  breaks?: BreakEntry[]
}

export interface BreakEntry {
  id: string
  clock_entry_id: string
  break_start: string
  break_end: string | null
  duration_minutes: number | null
}

export interface TimeOffCategory {
  id: string
  name: string
  accrual_rate: number
  max_balance: number | null
  unit: "days" | "hours"
}

export interface TimeOffBalance {
  id: string
  employee_id: string
  category_id: string
  balance: number
  scheduled: number
  category?: TimeOffCategory
}

export type TimeOffStatus = "pending" | "approved" | "denied" | "canceled"

export interface TimeOffRequest {
  id: string
  employee_id: string
  category_id: string
  start_date: string
  end_date: string
  amount: number
  status: TimeOffStatus
  note: string | null
  approver_comment: string | null
  created_at: string
  updated_at: string
  category?: TimeOffCategory
  employee?: Employee
}

export interface InfoChangeRequest {
  id: string
  employee_id: string
  field_name: string
  old_value: string | null
  new_value: string
  status: "pending" | "approved" | "denied"
  approver_comment: string | null
  created_at: string
  employee?: Employee
}

export interface CompanyHoliday {
  id: string
  name: string
  month: number
  day: number
}

export type CorrectionStatus = "pending" | "approved" | "denied"

export interface ClockCorrection {
  id: string
  clock_entry_id: string
  employee_id: string
  requested_clock_in: string | null
  requested_clock_out: string | null
  requested_break_minutes: number | null
  requested_notes: string | null
  reason: string
  status: CorrectionStatus
  reviewer_comment: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  clock_entry?: ClockEntry
  employee?: Employee
}

// ─── Notifications ─────────────────────────────────────────────────────────

export type NotificationType =
  | "timeoff_approved"
  | "timeoff_denied"
  | "info_change_approved"
  | "info_change_denied"
  | "correction_approved"
  | "correction_denied"
  | "late_clock_in"
  | "new_employee"

export interface AppNotification {
  id: string
  employee_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  link_tab: string | null
  created_at: string
}

// ─── Computed helpers ──────────────────────────────────────────────────────

/** Count weekdays (Mon–Fri) between two date strings inclusive. */
/**
 * Count working days between two date strings (inclusive).
 * workingDays defaults to Mon-Fri [1,2,3,4,5] but accepts company_settings.working_days.
 * 0=Sun, 1=Mon, ..., 6=Sat
 */
export function countWeekdays(
  start: string,
  end: string,
  workingDays: number[] = [1, 2, 3, 4, 5]
): number {
  let count = 0
  const cur = new Date(start)
  const last = new Date(end)
  cur.setHours(0, 0, 0, 0)
  last.setHours(0, 0, 0, 0)
  while (cur <= last) {
    if (workingDays.includes(cur.getDay())) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Format minutes as "Xh Ym" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Minutes worked so far for an open clock entry (live). */
export function liveMinutes(clockIn: string, breakMinutes = 0): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(clockIn).getTime()) / 60000) -
      breakMinutes
  )
}

// ─── Company Settings ──────────────────────────────────────────────────────
export interface CompanySettings {
  id: string
  company_name: string
  standard_hours_per_day: number
  standard_hours_per_week: number
  standard_start_time: string
  working_days: number[]
  overtime_threshold_daily: number
  overtime_threshold_weekly: number
  logo_url: string | null
  updated_at: string
  // company profile
  industry: string | null
  phone: string | null
  email: string | null
  website: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  country: string | null
}
// ─── Live clock status (for monitoring) ───────────────────────────────────

export interface LiveClockStatus {
  employee_id: string
  employee: Employee
  clock_entry: ClockEntry & { breaks: BreakEntry[] }
  status: "clocked_in" | "on_break"
  elapsed_minutes: number
}

// ─── Departments ───────────────────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  created_by: string | null // employee_id of creator
  created_at: string
}

// ─── Announcements ─────────────────────────────────────────────────────────

export type AnnouncementTarget = "all" | "employer_team"

export interface Announcement {
  id: string
  title: string
  body: string
  posted_by: string
  target: AnnouncementTarget
  target_employer_id: string | null
  created_at: string
  pinned: boolean
  author?: Employee
}

// ─── LMS ─────────────────────────────────────────────────────────────────────

export type LmsRole = "student" | "instructor" | "admin"
export type CfStreamStatus = "pending" | "ready" | "error"
export type TrainingStatus = "overdue" | "due_soon" | "pending" | "completed"

export interface LmsProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: LmsRole
  total_hours: number
  badges: { id: string; label: string; icon: string }[]
  created_at: string
  updated_at: string
}

export interface Curriculum {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface LmsModule {
  id: string
  curriculum_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  curriculum_id: string | null
  title: string
  description: string | null
  cf_stream_id: string | null
  cf_stream_status: CfStreamStatus
  duration_seconds: number | null
  order_index: number
  content_html: string | null // ADD
  quiz: any | null // ADD
  created_at: string
  updated_at: string
}

export interface ProgressRecord {
  id: string
  employee_id: string // was user_id
  lesson_id: string
  percent_watched: number
  is_completed: boolean
  last_watched_at: string | null
  created_at: string
  updated_at: string
}

export interface Certification {
  id: string
  user_id: string
  curriculum_id: string
  issued_at: string
}

export interface TrainingRecord {
  user_id: string
  curriculum_id: string
  curriculum_title: string
  thumbnail_url: string | null
  due_date: string
  completed_at: string | null
  status: TrainingStatus
  days_remaining: number
}

export interface TrainingAssignment {
  id: string
  user_id: string
  curriculum_id: string
  due_date: string
  assigned_by: string | null
  assigned_at: string
}
