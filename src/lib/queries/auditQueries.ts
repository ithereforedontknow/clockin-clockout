import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"

export async function writeAuditLog(entry: {
  actor_id: string
  action: string
  target_table: string
  target_id: string
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  note?: string
}) {
  const { error } = await supabase.from("audit_log").insert(entry)
  if (error) console.error("Audit log write failed:", error.message)
}

export function useAuditLog() {
  return useQuery({
    queryKey: keys.auditLog(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*, actor:employees!actor_id(first_name,last_name,role)")
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return data ?? []
    },
  })
}
