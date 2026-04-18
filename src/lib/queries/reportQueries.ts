import { useQuery } from "@tanstack/react-query"
import { addDays } from "date-fns"
import { supabase } from "@/lib/supabase"
import { keys } from "./keys"

export function useReportEntries(
  week: string,
  role: string,
  managerId: string
) {
  return useQuery({
    queryKey: keys.reportEntries(week, managerId),
    queryFn: async () => {
      let empQuery = supabase
        .from("employees")
        .select("id")
        .eq("employment_status", "active")
      if (role === "employer") empQuery = empQuery.eq("manager_id", managerId)
      const { data: emps } = await empQuery
      const ids = emps?.map((e) => e.id) ?? []

      const { data, error } = await supabase
        .from("clock_entries")
        .select("*, employee:employees(first_name, last_name, job_title)")
        .in("employee_id", ids)
        .gte("clock_in", `${week}T00:00:00`)
        .lt("clock_in", addDays(week, 7).toISOString())
      if (error) throw error
      return data ?? []
    },
  })
}

export function usePayrollDailySummary(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: keys.payrollSummary(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    ),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_payroll_analysis")
        .select(
          `employee_id, date, reg_hours, ot_hours, open_entries, employees!employee_id(first_name, last_name, hourly_rate)`
        )
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: true })

      if (error) throw error

      return (data || []).map((row: any) => ({
        employee_id: row.employee_id,
        date: row.date,
        reg_hours: Number(row.reg_hours) || 0,
        ot_hours: Number(row.ot_hours) || 0,
        missing_clock_outs: Number(row.open_entries) || 0,
        first_name: row.employees?.first_name || "Unknown",
        last_name: row.employees?.last_name || "Employee",
        hourly_rate: Number(row.employees?.hourly_rate) || 0,
      }))
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  })
}
