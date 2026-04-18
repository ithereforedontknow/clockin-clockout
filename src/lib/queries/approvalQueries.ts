import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"
import { getMyEmployeeId } from "./utils"
import { writeAuditLog } from "./auditQueries"
import { createNotification } from "./notificationQueries"
import type { TimeOffRequest, InfoChangeRequest } from "@/lib/supabase"

export function usePendingTimeOffRequests() {
  return useQuery({
    queryKey: keys.pendingTimeOff(),
    queryFn: async (): Promise<TimeOffRequest[]> => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*, employee:employees(*), category:time_off_categories(*)")
        .eq("status", "pending")
        .order("created_at")
      if (error) throw error
      return data ?? []
    },
  })
}

export function usePendingInfoChanges() {
  return useQuery({
    queryKey: keys.pendingInfoChange(),
    queryFn: async (): Promise<InfoChangeRequest[]> => {
      const { data, error } = await supabase
        .from("info_change_requests")
        .select("*, employee:employees(*)")
        .eq("status", "pending")
        .order("created_at")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useReviewTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      request,
      decision,
      comment,
    }: {
      request: TimeOffRequest
      decision: "approved" | "denied"
      comment: string
    }) => {
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          status: decision,
          approver_comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id)
      if (error) throw error

      if (decision === "approved" && request.category_id) {
        await supabase.rpc("deduct_time_off_balance", {
          p_employee_id: request.employee_id,
          p_category_id: request.category_id,
          p_days: request.amount,
        })
      }

      const actorId = await getMyEmployeeId()
      await writeAuditLog({
        actor_id: actorId,
        action: decision === "approved" ? "approve_time_off" : "deny_time_off",
        target_table: "time_off_requests",
        target_id: request.id,
        new_value: { status: decision },
        note: comment || undefined,
      })

      await createNotification({
        employee_id: request.employee_id,
        type: decision === "approved" ? "timeoff_approved" : "timeoff_denied",
        title:
          decision === "approved" ? "Time Off Approved" : "Time Off Denied",
        message:
          decision === "approved"
            ? `Your ${request.category?.name ?? "time off"} request has been approved.`
            : `Your ${request.category?.name ?? "time off"} request was denied.${comment ? ` Reason: ${comment}` : ""}`,
        link_tab: "timeoff",
      })
    },
    onSuccess: (_, { request }) => {
      qc.invalidateQueries({ queryKey: keys.pendingTimeOff() })
      qc.invalidateQueries({ queryKey: ["timeoff-history"] })
      qc.invalidateQueries({ queryKey: keys.balances(request.employee_id) })
    },
  })
}

export function useReviewInfoChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      request,
      decision,
      comment,
    }: {
      request: InfoChangeRequest
      decision: "approved" | "denied"
      comment: string
    }) => {
      const { error } = await supabase
        .from("info_change_requests")
        .update({ status: decision, approver_comment: comment || null })
        .eq("id", request.id)
      if (error) throw error

      if (decision === "approved") {
        await supabase
          .from("employees")
          .update({
            [request.field_name]: request.new_value,
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.employee_id)
      }

      const actorId = await getMyEmployeeId()
      await writeAuditLog({
        actor_id: actorId,
        action:
          decision === "approved" ? "approve_info_change" : "deny_info_change",
        target_table: "info_change_requests",
        target_id: request.id,
        old_value: { value: request.old_value },
        new_value: { value: request.new_value, status: decision },
        note: comment || undefined,
      })

      await createNotification({
        employee_id: request.employee_id,
        type:
          decision === "approved"
            ? "info_change_approved"
            : "info_change_denied",
        title:
          decision === "approved"
            ? "Profile Change Approved"
            : "Profile Change Denied",
        message:
          decision === "approved"
            ? `Your ${request.field_name.replace(/_/g, " ")} update has been approved.`
            : `Your ${request.field_name.replace(/_/g, " ")} update was denied.${comment ? ` Reason: ${comment}` : ""}`,
        link_tab: "myinfo",
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.pendingInfoChange() })
      qc.invalidateQueries({ queryKey: keys.currentEmployee() })
      qc.invalidateQueries({ queryKey: ["inbox-sent"] })
    },
  })
}
