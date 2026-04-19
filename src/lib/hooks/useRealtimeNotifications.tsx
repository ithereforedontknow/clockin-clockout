import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useRealtimeNotifications(employeeId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!employeeId) return

    const channel = supabase
      .channel(`notifs:${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_notifications",
          filter: `employee_id=eq.${employeeId}`,
        },
        () => {
          // Refetch the notifications list instantly
          queryClient.invalidateQueries({
            queryKey: ["notifications", employeeId],
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [employeeId, queryClient])
}
