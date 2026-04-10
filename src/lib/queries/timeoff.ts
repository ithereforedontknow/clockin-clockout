import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addDays } from "date-fns"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type {
  TimeOffBalance,
  TimeOffRequest,
  CompanyHoliday,
  InfoChangeRequest,
} from "@/lib/supabase"

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
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
  })
}

export function useTimeOffRequests() {
  return useQuery({
    queryKey: keys.timeOffRequests(),
    queryFn: async (): Promise<TimeOffRequest[]> => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*, category:time_off_categories(*), employee:employees(*)")
        .eq("status", "pending")
        .order("created_at")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useRequestTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      employee_id: string
      category_id: string
      start_date: string
      end_date: string
      amount: number
      note?: string
    }) => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .insert({ ...input, status: "pending" })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: keys.timeOffHistory(vars.employee_id) })
      qc.invalidateQueries({ queryKey: keys.balances(vars.employee_id) })
      qc.invalidateQueries({ queryKey: keys.timeOffRequests() })
      qc.invalidateQueries({ queryKey: keys.whosOut(vars.start_date) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useApproveTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .update({ status: "approved", approver_comment: comment ?? null })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.timeOffRequests() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useDenyTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .update({ status: "denied", approver_comment: comment ?? null })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.timeOffRequests() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useWhosOut(date: string) {
  return useQuery({
    queryKey: keys.whosOut(date),
    queryFn: async (): Promise<TimeOffRequest[]> => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*, employee:employees(*), category:time_off_categories(*)")
        .eq("status", "approved")
        .lte("start_date", date)
        .gte("end_date", date)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useHolidays() {
  return useQuery({
    queryKey: keys.holidays(),
    queryFn: async (): Promise<CompanyHoliday[]> => {
      const { data, error } = await supabase
        .from("company_holidays")
        .select("*")
        .order("month")
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 60,
  })
}
