import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type { AppNotification } from "@/lib/supabase"

export function useNotifications(employeeId: string) {
  return useQuery({
    queryKey: keys.notifications(employeeId),
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("app_notifications")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
    enabled: !!employeeId,
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      employeeId,
    }: {
      id: string
      employeeId: string
    }) => {
      const { error } = await supabase
        .from("app_notifications")
        .update({ read: true })
        .eq("id", id)
      if (error) throw error
      return employeeId
    },
    onSuccess: (employeeId) => {
      qc.invalidateQueries({ queryKey: keys.notifications(employeeId) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("app_notifications")
        .update({ read: true })
        .eq("employee_id", employeeId)
        .eq("read", false)
      if (error) throw error
      return employeeId
    },
    onSuccess: (employeeId) => {
      qc.invalidateQueries({ queryKey: keys.notifications(employeeId) })
    },
    onError: (e: any) => toast.error(e.message),
  })
}
