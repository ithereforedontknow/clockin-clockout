import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import { getMyEmployeeId } from "./utils"
import { writeAuditLog } from "./auditQueries"
import type {
  ClockEntry,
  BreakEntry,
  ClockCorrection,
  Employee,
} from "@/lib/supabase"

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
    refetchInterval: 30_000,
  })
}

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

export function useLiveClockedIn() {
  return useQuery({
    queryKey: keys.liveClockedIn(),
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, employee:employees(*), breaks:break_entries(*)")
        .eq("date", today)
        .is("clock_out", null)
        .order("clock_in")
      if (error) throw error
      return data ?? []
    },
    refetchInterval: 30_000,
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
      qc.invalidateQueries({ queryKey: keys.liveClockedIn() })
    },
  })
}

export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entryId,
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
      qc.invalidateQueries({ queryKey: keys.liveClockedIn() })
    },
  })
}

export function useStartBreak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entryId,
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

// Clock Corrections
export function useMyCorrections(employeeId: string) {
  return useQuery({
    queryKey: keys.myCorrections(employeeId),
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

export function useAllCorrections() {
  return useQuery({
    queryKey: keys.allCorrections(),
    queryFn: async (): Promise<ClockCorrection[]> => {
      const { data, error } = await supabase
        .from("clock_corrections")
        .select(
          `*, clock_entry:clock_entries(*), employee:employees!clock_corrections_employee_id_fkey(*)`
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

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
      qc.invalidateQueries({ queryKey: keys.myCorrections(employee_id) })
      qc.invalidateQueries({ queryKey: keys.allCorrections() })
    },
  })
}

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

      if (decision === "approved") {
        const patch: Record<string, unknown> = {}
        if (correction.requested_clock_in)
          patch.clock_in = correction.requested_clock_in
        if (correction.requested_clock_out)
          patch.clock_out = correction.requested_clock_out
        if (correction.requested_notes !== null)
          patch.notes = correction.requested_notes

        const clockIn = new Date(
          correction.requested_clock_in ??
            (correction.clock_entry as ClockEntry | undefined)?.clock_in ??
            ""
        )
        const clockOut = new Date(
          correction.requested_clock_out ??
            (correction.clock_entry as ClockEntry | undefined)?.clock_out ??
            ""
        )
        const breakMins =
          correction.requested_break_minutes ??
          (
            (
              correction.clock_entry as
                | (ClockEntry & { breaks: BreakEntry[] })
                | undefined
            )?.breaks ?? []
          ).reduce((s, b) => s + (b.duration_minutes ?? 0), 0)

        if (!isNaN(clockIn.getTime()) && !isNaN(clockOut.getTime())) {
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

        const actorId = await getMyEmployeeId()
        await writeAuditLog({
          actor_id: actorId,
          action:
            decision === "approved" ? "approve_correction" : "deny_correction",
          target_table: "clock_corrections",
          target_id: correction.id,
          new_value: { status: decision },
          note: reviewerComment || undefined,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.allCorrections() })
      qc.invalidateQueries({ queryKey: ["clock-history"] })
      qc.invalidateQueries({ queryKey: ["all-clock-entries"] })
    },
  })
}
