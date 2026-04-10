import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type {
  CompanySettings,
  Department,
  Announcement,
  ClockCorrection,
  LiveClockStatus,
} from "@/lib/supabase"

export function useCompanySettings() {
  return useQuery({
    queryKey: keys.companySettings(),
    queryFn: async (): Promise<CompanySettings | null> => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single()
      if (error && error.code !== "PGRST116") throw error
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
        .update({ ...updates, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.companySettings() })
    },
    onError: (e: any) => toast.error(e.message),
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
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user!.id)
        .single()
      const { data, error } = await supabase
        .from("departments")
        .insert({ name, created_by: emp?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.departments() }),
    onError: (e: any) => toast.error(e.message),
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
    onError: (e: any) => toast.error(e.message),
  })
}

export function useAnnouncements() {
  return useQuery({
    queryKey: keys.announcements(),
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, author:employees(*)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<Announcement, "id" | "created_at" | "author">
    ) => {
      const { data, error } = await supabase
        .from("announcements")
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.announcements() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.announcements() }),
    onError: (e: any) => toast.error(e.message),
  })
}

export function useLiveClockStatus() {
  return useQuery({
    queryKey: keys.liveStatus(),
    queryFn: async (): Promise<LiveClockStatus[]> => {
      const { data, error } = await supabase
        .from("live_clock_status")
        .select("*")
      if (error) throw error
      return data ?? []
    },
    refetchInterval: 60_000,
  })
}

export function useClockCorrections() {
  return useQuery({
    queryKey: keys.corrections(),
    queryFn: async (): Promise<ClockCorrection[]> => {
      const { data, error } = await supabase
        .from("clock_corrections")
        .select("*, employee:employees(*), clock_entry:clock_entries(*)")
        .eq("status", "pending")
        .order("created_at")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useReviewCorrection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      comment,
    }: {
      id: string
      status: "approved" | "denied"
      comment?: string
    }) => {
      const { data, error } = await supabase
        .from("clock_corrections")
        .update({ status, reviewer_comment: comment ?? null })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.corrections() }),
    onError: (e: any) => toast.error(e.message),
  })
}
