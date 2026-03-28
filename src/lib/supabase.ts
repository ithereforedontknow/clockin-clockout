import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Database Types ────────────────────────────────────────────────────────

export type UserRole = "employee" | "manager" | "admin"

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
}

export interface CompanyHoliday {
  id: string
  name: string
  date: string
}

// ─── Computed helpers ──────────────────────────────────────────────────────

/** Count weekdays (Mon–Fri) between two date strings inclusive. */
export function countWeekdays(start: string, end: string): number {
  let count = 0
  const cur = new Date(start)
  const last = new Date(end)
  cur.setHours(0, 0, 0, 0)
  last.setHours(0, 0, 0, 0)
  while (cur <= last) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
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

// ─── Clock Corrections ─────────────────────────────────────────────────────

export type CorrectionStatus = "pending" | "approved" | "denied"

export interface ClockCorrection {
  id: string
  clock_entry_id: string
  employee_id: string
  // Requested new values (null = no change requested for that field)
  requested_clock_in: string | null
  requested_clock_out: string | null
  requested_break_minutes: number | null
  requested_notes: string | null
  reason: string // why the correction is needed
  status: CorrectionStatus
  reviewer_comment: string | null
  reviewed_by: string | null // employee_id of manager/admin
  created_at: string
  updated_at: string
  // Joined
  clock_entry?: ClockEntry
  employee?: Employee
}
