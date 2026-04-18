import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type { CompanySettings, Department } from "@/lib/supabase"

export function useCompanySettings() {
  return useQuery({
    queryKey: keys.companySettings(),
    queryFn: async (): Promise<CompanySettings | null> => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      const { data, error } = await supabase
        .from("company_settings")
        .upsert({
          id: "singleton",
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.companySettings() }),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: keys.departments(),
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name")
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("departments").insert({ name })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments() }),
  })
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments() }),
  })
}
