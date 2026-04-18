import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type {
  TimeOffBalance,
  TimeOffRequest,
  CompanyHoliday,
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

export function useHolidays(_year?: number) {
  return useQuery({
    queryKey: keys.holidays(),
    queryFn: async (): Promise<CompanyHoliday[]> => {
      const { data, error } = await supabase
        .from("company_holidays")
        .select("*")
        .order("month")
        .order("day")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      name,
      month,
      day,
    }: {
      name: string
      month: number
      day: number
    }) => {
      const { error } = await supabase
        .from("company_holidays")
        .insert({ name, month, day })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.holidays() }),
  })
}

export function useDeleteHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_holidays")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.holidays() }),
  })
}

export function useApproveTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      employeeId,
      categoryId,
      days,
    }: {
      requestId: string
      employeeId: string
      categoryId: string
      days: number
    }) => {
      const { error: reqErr } = await supabase
        .from("time_off_requests")
        .update({ status: "approved" })
        .eq("id", requestId)
      if (reqErr) throw reqErr
      const { error: balErr } = await supabase.rpc("deduct_time_off_balance", {
        p_employee_id: employeeId,
        p_category_id: categoryId,
        p_days: days,
      })
      if (balErr) throw balErr
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.timeOffRequests() })
      qc.invalidateQueries({ queryKey: keys.balances(employeeId) })
    },
  })
}

export function useRejectTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const { error } = await supabase
        .from("time_off_requests")
        .update({ status: "rejected" })
        .eq("id", requestId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.timeOffRequests() }),
  })
}

export function useSetTimeOffBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      categoryId,
      balance,
    }: {
      employeeId: string
      categoryId: string
      balance: number
    }) => {
      const { error } = await supabase.from("time_off_balances").upsert(
        {
          employee_id: employeeId,
          category_id: categoryId,
          balance,
          scheduled: 0,
        },
        { onConflict: "employee_id,category_id" }
      )
      if (error) throw error
    },
    onSuccess: (_, { employeeId }) =>
      qc.invalidateQueries({ queryKey: keys.balances(employeeId) }),
  })
}

export async function seedTimeOffBalances(employeeId: string) {
  const { data: existing } = await supabase
    .from("time_off_balances")
    .select("id")
    .eq("employee_id", employeeId)
    .limit(1)
    .maybeSingle()
  if (existing) return
  const { data: categories } = await supabase
    .from("time_off_categories")
    .select("id")
  if (!categories?.length) return
  await supabase.from("time_off_balances").insert(
    categories.map((c) => ({
      employee_id: employeeId,
      category_id: c.id,
      balance: 0,
      scheduled: 0,
    }))
  )
}

export function useSeedMyBalances(employeeId: string) {
  return useQuery({
    queryKey: keys.seedBalances(employeeId),
    queryFn: async () => {
      await seedTimeOffBalances(employeeId)
      return true
    },
    enabled: !!employeeId,
    staleTime: Infinity,
    retry: false,
  })
}
