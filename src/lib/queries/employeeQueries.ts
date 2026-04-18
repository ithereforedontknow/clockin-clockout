import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type { Employee, InfoChangeRequest } from "@/lib/supabase"

export function useCurrentEmployee() {
  return useQuery({
    queryKey: keys.currentEmployee(),
    queryFn: async (): Promise<Employee> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: linkedEmployee } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (linkedEmployee) return linkedEmployee

      const { data: unlinkedEmployee } = await supabase
        .from("employees")
        .select("*")
        .eq("email", user.email!.toLowerCase().trim())
        .is("user_id", null)
        .single()

      if (unlinkedEmployee) {
        const { data: newlyLinked, error } = await supabase
          .from("employees")
          .update({ user_id: user.id, updated_at: new Date().toISOString() })
          .eq("id", unlinkedEmployee.id)
          .select()
          .single()
        if (error) throw error
        return newlyLinked
      }

      throw new Error("No employee record found. Contact HR.")
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
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

export function useAllEmployeesForReports() {
  return useQuery({
    queryKey: [...keys.employees(), "all"] as const,
    queryFn: async (): Promise<Employee[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("id, role")
        .eq("user_id", user.id)
        .single()

      let query = supabase.from("employees").select("*").order("last_name")

      if (currentEmployee?.role === "employer") {
        query = query.or(
          `manager_id.eq.${currentEmployee.id},id.eq.${currentEmployee.id}`
        )
      } else if (currentEmployee?.role === "employee") {
        query = query.eq("id", currentEmployee.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMyTeam(employerId: string) {
  return useQuery({
    queryKey: keys.myTeam(employerId),
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("manager_id", employerId)
        .eq("employment_status", "active")
        .order("last_name")
      if (error) throw error
      return data ?? []
    },
    enabled: !!employerId,
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

export function useUpdateMyPersonalInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string
      field: string
      value: string
    }) => {
      const { error } = await supabase
        .from("employees")
        .update({ [field]: value })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.currentEmployee() }),
  })
}

export function useRequestInfoChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      field,
      newValue,
    }: {
      employeeId: string
      field: string
      newValue: string
    }) => {
      const { error } = await supabase.from("info_change_requests").insert({
        employee_id: employeeId,
        field_name: field,
        new_value: newValue,
        status: "pending",
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.currentEmployee() }),
  })
}

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
export function useUpdateNotificationPrefs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      employeeId,
      prefs,
    }: {
      employeeId: string
      prefs: Record<string, boolean>
    }) => {
      const { error } = await supabase
        .from("employees")
        .update({ notification_prefs: prefs })
        .eq("id", employeeId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.currentEmployee() })
    },
  })
}
