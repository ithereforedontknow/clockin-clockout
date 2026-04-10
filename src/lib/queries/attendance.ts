import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type { ClockEntry, BreakEntry } from "@/lib/supabase"

async function getMyEmployeeId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()
  return data!.id
}

export function useTodayClock() {
  return useQuery({
    queryKey: keys.todayClock("me"),
    queryFn: async () => {
      const employeeId = await getMyEmployeeId()
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, breaks:break_entries(*)")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .maybeSingle()
      if (error) throw error
      return data as (ClockEntry & { breaks: BreakEntry[] }) | null
    },
    refetchInterval: 60_000,
  })
}

export function useClockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notes?: string) => {
      const employeeId = await getMyEmployeeId()
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("clock_entries")
        .insert({
          employee_id: employeeId,
          clock_in: now,
          date: now.split("T")[0],
          notes: notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.todayClock("me") })
      qc.invalidateQueries({ queryKey: keys.liveStatus() })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entryId,
      notes,
    }: {
      entryId: string
      notes?: string
    }) => {
      const now = new Date().toISOString()
      const { data: entry } = await supabase
        .from("clock_entries")
        .select("clock_in, breaks:break_entries(duration_minutes)")
        .eq("id", entryId)
        .single()
      const breakMins = (entry?.breaks ?? []).reduce(
        (acc: number, b: any) => acc + (b.duration_minutes ?? 0),
        0
      )
      const totalMinutes =
        Math.floor((Date.now() - new Date(entry!.clock_in).getTime()) / 60000) -
        breakMins

      const { data, error } = await supabase
        .from("clock_entries")
        .update({
          clock_out: now,
          total_minutes: totalMinutes,
          notes: notes ?? null,
        })
        .eq("id", entryId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.todayClock("me") })
      qc.invalidateQueries({ queryKey: keys.liveStatus() })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useStartBreak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (clockEntryId: string) => {
      const { data, error } = await supabase
        .from("break_entries")
        .insert({
          clock_entry_id: clockEntryId,
          break_start: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.todayClock("me") }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useEndBreak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (breakId: string) => {
      const { data: brk } = await supabase
        .from("break_entries")
        .select("break_start")
        .eq("id", breakId)
        .single()
      const duration = Math.floor(
        (Date.now() - new Date(brk!.break_start).getTime()) / 60000
      )
      const { data, error } = await supabase
        .from("break_entries")
        .update({
          break_end: new Date().toISOString(),
          duration_minutes: duration,
        })
        .eq("id", breakId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.todayClock("me") }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useClockHistory(employeeId: string, week: string) {
  return useQuery({
    queryKey: keys.clockHistory(employeeId, week),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, breaks:break_entries(*)")
        .eq("employee_id", employeeId)
        .gte("date", week)
        .order("date", { ascending: false })
      if (error) throw error
      return (data ?? []) as (ClockEntry & { breaks: BreakEntry[] })[]
    },
    enabled: !!employeeId,
  })
}
