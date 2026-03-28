import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "./supabase"
import type {
  Employee,
  ClockEntry,
  BreakEntry,
  TimeOffBalance,
  TimeOffRequest,
  InfoChangeRequest,
  CompanyHoliday,
} from "./supabase"

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const keys = {
  currentEmployee: () => ["current-employee"] as const,
  employee: (id: string) => ["employee", id] as const,
  employees: () => ["employees"] as const,
  balances: (id: string) => ["balances", id] as const,
  timeOffHistory: (id: string) => ["timeoff-history", id] as const,
  whosOut: (d: string) => ["whos-out", d] as const,
  holidays: () => ["holidays"] as const,
  inboxSent: (id: string) => ["inbox-sent", id] as const,
  todayClock: (id: string) => ["today-clock", id] as const,
  clockHistory: (id: string, week: string) =>
    ["clock-history", id, week] as const,
  allClockEntries: (week: string) => ["all-clock-entries", week] as const,
}

// ─── Current Employee (auth-aware) ───────────────────────────────────────────

export function useCurrentEmployee() {
  return useQuery({
    queryKey: keys.currentEmployee(),
    queryFn: async (): Promise<Employee> => {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error("Not authenticated")
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useEmployees() {
  return useQuery({
    queryKey: keys.employees(),
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("employment_status", "active")
        .order("last_name")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Employee>
    }) => {
      const { data, error } = await supabase
        .from("employees")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.currentEmployee() })
      qc.invalidateQueries({ queryKey: keys.employees() })
    },
  })
}

// ─── Info Change Requests ─────────────────────────────────────────────────────

export function useSubmitInfoChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Omit<
        InfoChangeRequest,
        "id" | "status" | "approver_comment" | "created_at"
      >
    ) => {
      const { data, error } = await supabase
        .from("info_change_requests")
        .insert({ ...payload, status: "pending" })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employee_id }) => {
      qc.invalidateQueries({ queryKey: keys.inboxSent(employee_id) })
    },
  })
}

export function useSentRequests(employeeId: string) {
  return useQuery({
    queryKey: keys.inboxSent(employeeId),
    queryFn: async (): Promise<InfoChangeRequest[]> => {
      const { data, error } = await supabase
        .from("info_change_requests")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
  })
}

export function useCancelInfoChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
    }: {
      requestId: string
      employeeId: string
    }) => {
      const { error } = await supabase
        .from("info_change_requests")
        .update({ status: "denied" })
        .eq("id", requestId)
        .eq("status", "pending")
      if (error) throw error
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.inboxSent(employeeId) })
    },
  })
}

// ─── Time Off ─────────────────────────────────────────────────────────────────

export function useTimeOffBalances(employeeId: string) {
  return useQuery({
    queryKey: keys.balances(employeeId),
    queryFn: async (): Promise<TimeOffBalance[]> => {
      const { data, error } = await supabase
        .from("time_off_balances")
        .select("*, category:time_off_categories(*)")
        .eq("employee_id", employeeId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
  })
}

export function useTimeOffHistory(employeeId: string) {
  return useQuery({
    queryKey: keys.timeOffHistory(employeeId),
    queryFn: async (): Promise<TimeOffRequest[]> => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*, category:time_off_categories(*)")
        .eq("employee_id", employeeId)
        .order("start_date", { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
  })
}

export function useRequestTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Pick<
        TimeOffRequest,
        | "employee_id"
        | "category_id"
        | "start_date"
        | "end_date"
        | "amount"
        | "note"
      >
    ) => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .insert({ ...payload, status: "pending" })
        .select("*, category:time_off_categories(*)")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employee_id }) => {
      qc.invalidateQueries({ queryKey: keys.timeOffHistory(employee_id) })
      qc.invalidateQueries({ queryKey: keys.balances(employee_id) })
    },
  })
}

export function useUpdateTimeOffRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      employeeId,
      updates,
    }: {
      id: string
      employeeId: string
      updates: Partial<
        Pick<
          TimeOffRequest,
          "start_date" | "end_date" | "amount" | "note" | "status"
        >
      >
    }) => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.timeOffHistory(employeeId) })
      qc.invalidateQueries({ queryKey: keys.balances(employeeId) })
    },
  })
}

export function useWhosOut(weekStart: string) {
  return useQuery({
    queryKey: keys.whosOut(weekStart),
    queryFn: async (): Promise<TimeOffRequest[]> => {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 14)
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*, employee:employees(*), category:time_off_categories(*)")
        .eq("status", "approved")
        .lte("start_date", weekEnd.toISOString().slice(0, 10))
        .gte("end_date", weekStart)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useHolidays() {
  return useQuery({
    queryKey: keys.holidays(),
    queryFn: async (): Promise<CompanyHoliday[]> => {
      const year = new Date().getFullYear()
      const { data, error } = await supabase
        .from("company_holidays")
        .select("*")
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`)
        .order("date")
      if (error) throw error
      return data ?? []
    },
  })
}

export function calculateFutureBalance(
  currentBalance: number,
  scheduledOff: number,
  accrualRate: number,
  targetDate: Date
): number {
  const now = new Date()
  const monthsDiff =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth())
  const accrued = Math.max(0, monthsDiff) * accrualRate
  return Math.max(0, currentBalance - scheduledOff + accrued)
}

// ─── Clock In / Out ───────────────────────────────────────────────────────────

/** Today's open or most-recently-closed entry for the employee. */
export function useTodayClockEntry(employeeId: string) {
  return useQuery({
    queryKey: keys.todayClock(employeeId),
    queryFn: async (): Promise<
      (ClockEntry & { breaks: BreakEntry[] }) | null
    > => {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, breaks:break_entries(*)")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!employeeId,
    refetchInterval: 30_000, // refresh every 30s to keep live timer accurate
  })
}

/** Weekly clock entries for one employee (for Timesheet tab). */
export function useClockHistory(employeeId: string, weekStart: string) {
  return useQuery({
    queryKey: keys.clockHistory(employeeId, weekStart),
    queryFn: async (): Promise<(ClockEntry & { breaks: BreakEntry[] })[]> => {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, breaks:break_entries(*)")
        .eq("employee_id", employeeId)
        .gte("date", weekStart)
        .lte("date", weekEnd.toISOString().slice(0, 10))
        .order("date")
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
  })
}

/** All employees' clock entries for a week — admin/manager only. */
export function useAllClockEntries(weekStart: string) {
  return useQuery({
    queryKey: keys.allClockEntries(weekStart),
    queryFn: async (): Promise<
      (ClockEntry & { breaks: BreakEntry[]; employee: Employee })[]
    > => {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, breaks:break_entries(*), employee:employees(*)")
        .gte("date", weekStart)
        .lte("date", weekEnd.toISOString().slice(0, 10))
        .order("date")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useClockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const now = new Date()
      const { data, error } = await supabase
        .from("clock_entries")
        .insert({
          employee_id: employeeId,
          clock_in: now.toISOString(),
          date: now.toISOString().slice(0, 10),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, employeeId) => {
      qc.invalidateQueries({ queryKey: keys.todayClock(employeeId) })
    },
  })
}

export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entryId,
      employeeId,
      totalMinutes,
    }: {
      entryId: string
      employeeId: string
      totalMinutes: number
    }) => {
      const { data, error } = await supabase
        .from("clock_entries")
        .update({
          clock_out: new Date().toISOString(),
          total_minutes: totalMinutes,
        })
        .eq("id", entryId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.todayClock(employeeId) })
      qc.invalidateQueries({ queryKey: ["clock-history"] })
    },
  })
}

export function useStartBreak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entryId,
      employeeId,
    }: {
      entryId: string
      employeeId: string
    }) => {
      const { data, error } = await supabase
        .from("break_entries")
        .insert({
          clock_entry_id: entryId,
          break_start: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.todayClock(employeeId) })
    },
  })
}

export function useEndBreak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      breakId,
      employeeId,
      durationMinutes,
    }: {
      breakId: string
      employeeId: string
      durationMinutes: number
    }) => {
      const { data, error } = await supabase
        .from("break_entries")
        .update({
          break_end: new Date().toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq("id", breakId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.todayClock(employeeId) })
    },
  })
}

// ─── Clock Corrections ────────────────────────────────────────────────────────

import type { ClockCorrection } from "./supabase"

export const correctionKeys = {
  myCorrections: (empId: string) => ["corrections", "mine", empId] as const,
  allCorrections: () => ["corrections", "all"] as const,
}

/** Employee's own correction requests. */
export function useMyCorrections(employeeId: string) {
  return useQuery({
    queryKey: correctionKeys.myCorrections(employeeId),
    queryFn: async (): Promise<ClockCorrection[]> => {
      const { data, error } = await supabase
        .from("clock_corrections")
        .select("*, clock_entry:clock_entries(*)")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
  })
}

/** All pending corrections — manager/admin only. */
export function useAllCorrections() {
  return useQuery({
    queryKey: correctionKeys.allCorrections(),
    queryFn: async (): Promise<ClockCorrection[]> => {
      const { data, error } = await supabase
        .from("clock_corrections")
        .select("*, clock_entry:clock_entries(*), employee:employees(*)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

/** Employee submits a correction request. */
export function useSubmitCorrection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Pick<
        ClockCorrection,
        | "clock_entry_id"
        | "employee_id"
        | "requested_clock_in"
        | "requested_clock_out"
        | "requested_break_minutes"
        | "requested_notes"
        | "reason"
      >
    ) => {
      const { data, error } = await supabase
        .from("clock_corrections")
        .insert({ ...payload, status: "pending" })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { employee_id }) => {
      qc.invalidateQueries({
        queryKey: correctionKeys.myCorrections(employee_id),
      })
      qc.invalidateQueries({ queryKey: correctionKeys.allCorrections() })
    },
  })
}

/** Manager/Admin approves or denies — if approved, also patches clock_entries. */
export function useReviewCorrection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      correction,
      decision,
      reviewerComment,
      reviewerId,
    }: {
      correction: ClockCorrection
      decision: "approved" | "denied"
      reviewerComment: string
      reviewerId: string
    }) => {
      // 1. Update the correction row
      const { error: corrErr } = await supabase
        .from("clock_corrections")
        .update({
          status: decision,
          reviewer_comment: reviewerComment || null,
          reviewed_by: reviewerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", correction.id)
      if (corrErr) throw corrErr

      // 2. If approved, patch the original clock_entry
      if (decision === "approved") {
        const patch: Record<string, unknown> = {}
        if (correction.requested_clock_in)
          patch.clock_in = correction.requested_clock_in
        if (correction.requested_clock_out)
          patch.clock_out = correction.requested_clock_out
        if (correction.requested_notes !== null)
          patch.notes = correction.requested_notes

        // Recalculate total_minutes from the (possibly updated) times minus break
        const clockIn = new Date(
          correction.requested_clock_in ??
            correction.clock_entry?.clock_in ??
            ""
        )
        const clockOut = new Date(
          correction.requested_clock_out ??
            correction.clock_entry?.clock_out ??
            ""
        )
        const breakMins =
          correction.requested_break_minutes ??
          (
            correction.clock_entry?.breaks as
              | { duration_minutes: number }[]
              | undefined
          )?.reduce((s, b) => s + (b.duration_minutes ?? 0), 0) ??
          0

        if (
          clockIn &&
          clockOut &&
          !isNaN(clockIn.getTime()) &&
          !isNaN(clockOut.getTime())
        ) {
          patch.total_minutes = Math.max(
            0,
            Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000) -
              breakMins
          )
        }

        if (Object.keys(patch).length > 0) {
          const { error: entryErr } = await supabase
            .from("clock_entries")
            .update(patch)
            .eq("id", correction.clock_entry_id)
          if (entryErr) throw entryErr
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: correctionKeys.allCorrections() })
      qc.invalidateQueries({ queryKey: ["clock-history"] })
      qc.invalidateQueries({ queryKey: ["all-clock-entries"] })
    },
  })
}
