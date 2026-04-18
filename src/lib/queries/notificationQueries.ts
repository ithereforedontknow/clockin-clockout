import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import type { AppNotification } from "@/lib/supabase"

export function useNotifications(employeeId: string) {
  return useQuery({
    queryKey: keys.notifications(employeeId),
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
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
    mutationFn: async ({ id }: { id: string; employeeId: string }) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, { employeeId }) => {
      qc.invalidateQueries({ queryKey: keys.notifications(employeeId) })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("employee_id", employeeId)
        .eq("read", false)
      if (error) throw error
    },
    onSuccess: (_, employeeId) => {
      qc.invalidateQueries({ queryKey: keys.notifications(employeeId) })
    },
  })
}

export async function createNotification(
  payload: Pick<
    AppNotification,
    "employee_id" | "type" | "title" | "message" | "link_tab"
  >
) {
  await supabase.from("notifications").insert(payload)
}
