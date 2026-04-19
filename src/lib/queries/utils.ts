import { supabase } from "@/lib/supabase"

export async function getMyEmployeeId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()
  return data!.id
}

export function calculateFutureBalance(
  currentBalance: number,
  scheduledOff: number,
  accrualRate: number,
  targetDate: Date
): number {
  const now = new Date()
  const monthsDiff =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth())
  const accrued = Math.max(0, monthsDiff) * accrualRate
  return Math.max(0, currentBalance - scheduledOff + accrued)
}
