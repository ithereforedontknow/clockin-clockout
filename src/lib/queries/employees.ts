import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import { seedLmsProfile } from "./training"
import type { Employee } from "@/lib/supabase"

export function useCurrentEmployee() {
  return useQuery({
    queryKey: keys.currentEmployee(),
    queryFn: async (): Promise<Employee> => {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()
      if (authErr || !user) throw new Error("Not authenticated")

      const { data: byUserId } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      if (byUserId) return byUserId

      const normalisedEmail = (user.email ?? "").trim().toLowerCase()
      const { data: byEmail, error: emailErr } = await supabase
        .from("employees")
        .select("*")
        .eq("email", normalisedEmail)
        .is("user_id", null)
        .maybeSingle()
      if (emailErr) throw emailErr

      if (byEmail) {
        const { data: linked, error: linkErr } = await supabase
          .from("employees")
          .update({ user_id: user.id, updated_at: new Date().toISOString() })
          .eq("id", byEmail.id)
          .select()
          .single()
        if (linkErr) throw linkErr

        await seedLmsProfile(
          user.id,
          `${linked.first_name} ${linked.last_name}`,
          linked.avatar_url,
          linked.role === "admin"
            ? "admin"
            : linked.role === "employer"
              ? "instructor"
              : "student"
        )
        return linked
      }

      throw new Error(
        "No employee record found. Contact your HR administrator."
      )
    },
    staleTime: 1000 * 60 * 10,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("No employee record")) return false
      return failureCount < 2
    },
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
    queryKey: keys.employeesAll(),
    queryFn: async (): Promise<Employee[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      const { data: currentEmployee, error: empError } = await supabase
        .from("employees")
        .select("id, role")
        .eq("user_id", user.id)
        .single()
      if (empError && empError.code !== "PGRST116") throw empError

      const { data, error } = await supabase
        .from("employees")
        .select("*")
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.employees() })
      qc.invalidateQueries({ queryKey: keys.employee(data.id) })
      qc.invalidateQueries({ queryKey: keys.currentEmployee() })
    },
    onError: (e: any) => toast.error(e.message),
  })
}
