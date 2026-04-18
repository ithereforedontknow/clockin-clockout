import { supabase } from "@/lib/supabase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { keys } from "./keys"
import { seedTimeOffBalances } from "./timeOffQueries"
import type { Employee } from "@/lib/supabase"

// Helper to get current employee ID
export async function getCurrentEmployeeId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()
  return data?.id ?? null
}

export function useAllEmployees(
  search = "",
  statusFilter = "",
  roleFilter = "",
  deptFilter = ""
) {
  const filterKey = `${search}|${statusFilter}|${roleFilter}|${deptFilter}`
  return useQuery({
    queryKey: keys.adminEmployees(filterKey),
    queryFn: async (): Promise<Employee[]> => {
      let q = supabase.from("employees").select("*").order("last_name")
      if (statusFilter) q = q.eq("employment_status", statusFilter)
      if (roleFilter) q = q.eq("role", roleFilter)
      if (deptFilter) q = q.eq("department", deptFilter)
      const { data, error } = await q
      if (error) throw error
      const s = search.toLowerCase()
      return (data ?? []).filter(
        (e) =>
          !s ||
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(s) ||
          e.email.toLowerCase().includes(s) ||
          e.job_title.toLowerCase().includes(s)
      )
    },
  })
}

export function useAdminUpdateEmployee() {
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
      qc.invalidateQueries({ queryKey: ["admin-employees"] })
      qc.invalidateQueries({ queryKey: keys.employees() })
      qc.invalidateQueries({ queryKey: keys.currentEmployee() })
    },
  })
}

export function useSetEmployeeStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: "active" | "inactive" | "on_leave"
    }) => {
      const { error } = await supabase
        .from("employees")
        .update({
          employment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-employees"] })
      qc.invalidateQueries({ queryKey: keys.employees() })
    },
  })
}

export function useInviteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      email: string
      first_name: string
      last_name: string
      role: string
      department?: string
      job_title?: string
      location?: string
      hire_date?: string
      standard_start_time?: string
      standard_hours_per_day?: number
      standard_hours_per_week?: number
      manager_id?: string | null
    }) => {
      const email = payload.email.trim().toLowerCase()
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (existing)
        throw new Error("An employee with this email already exists.")

      const { data, error } = await supabase
        .from("employees")
        .insert({
          first_name: payload.first_name.trim(),
          last_name: payload.last_name.trim(),
          email,
          role: payload.role,
          department: (payload.department || "").trim(),
          job_title: (payload.job_title || "").trim(),
          location: (payload.location || "").trim(),
          hire_date: payload.hire_date || new Date().toISOString().slice(0, 10),
          standard_start_time: payload.standard_start_time || "09:00:00",
          standard_hours_per_day: payload.standard_hours_per_day ?? 8,
          standard_hours_per_week: payload.standard_hours_per_week ?? 40,
          manager_id: payload.manager_id || null,
          user_id: null,
          employment_status: "active",
          onboarding_completed: false,
        })
        .select()
        .single()

      if (error) throw error
      if (data?.id) await seedTimeOffBalances(data.id)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-employees"] })
      qc.invalidateQueries({ queryKey: keys.employees() })
    },
    onError: (err: any) =>
      toast.error(err.message || "Failed to create employee"),
  })
}

export function useAddTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      email: string
      first_name: string
      last_name: string
      department: string
      job_title: string
      location: string
      manager_id: string
      standard_hours_per_day: number
      standard_hours_per_week: number
    }) => {
      const email = payload.email.trim().toLowerCase()
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (existing)
        throw new Error("An employee with this email already exists.")

      const { data, error } = await supabase
        .from("employees")
        .insert({
          ...payload,
          email,
          role: "employee",
          user_id: null,
          employment_status: "active",
          onboarding_completed: false,
          hire_date: new Date().toISOString().slice(0, 10),
        })
        .select()
        .single()
      if (error) throw error

      await seedTimeOffBalances(data.id)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-team"] })
      qc.invalidateQueries({ queryKey: keys.employees() })
    },
  })
}
