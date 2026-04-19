import { format } from "date-fns"
import type { Employee } from "@/lib/supabase"
import type { EmployeeWeekSummary } from "@/components/reports/hooks/useTimesheetData"

export function downloadCSV(rows: string[][], filename: string) {
  const csvContent = rows
    .map((row) =>
      row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Fixed Timesheet CSV Export
export function downloadTimesheetCSV(
  summaries: EmployeeWeekSummary[],
  weekStart: Date
) {
  const rows: string[][] = [
    [
      "Employee",
      "Department",
      "Date",
      "Clock In",
      "Clock Out",
      "Break (min)",
      "Worked (min)",
      "Overtime (min)",
      "Late (min)",
      "Undertime (min)",
    ],
  ]

  summaries.forEach(({ employee: emp, entries }) => {
    entries.forEach((entry) => {
      const breakMins = (entry.breaks ?? []).reduce(
        (sum, b) => sum + (b.duration_minutes ?? 0),
        0
      )
      const otMins = Math.max(
        0,
        (entry.total_minutes ?? 0) - emp.standard_hours_per_day * 60
      )
      const lateMins = entry.clock_in
        ? calcLateMins(entry.clock_in, emp.standard_start_time)
        : 0
      const undertimeMins = entry.clock_out
        ? Math.max(
            0,
            emp.standard_hours_per_day * 60 - (entry.total_minutes ?? 0)
          )
        : 0

      rows.push([
        `${emp.first_name} ${emp.last_name}`,
        emp.department || "",
        entry.date,
        entry.clock_in ? format(new Date(entry.clock_in), "HH:mm") : "",
        entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "",
        breakMins.toString(),
        (entry.total_minutes ?? 0).toString(),
        otMins.toString(),
        lateMins.toString(),
        undertimeMins.toString(),
      ])
    })
  })

  downloadCSV(rows, `timesheet-${format(weekStart, "yyyy-MM-dd")}`)
}
export function downloadPayrollCSV(
  employees: Employee[],
  start: Date,
  end: Date,
  period: string
) {
  // This would ideally fetch full clock entries via Supabase here.
  // For now, we generate basic structure. You can enhance later.
  const rows: string[][] = [
    [
      "Employee ID",
      "Name",
      "Department",
      "Job Title",
      "Period Start",
      "Period End",
      "Days Worked",
      "Regular Hours",
      "Overtime Hours",
      "Total Hours",
      "Breaks (hrs)",
    ],
  ]

  employees.forEach((emp) => {
    rows.push([
      emp.id,
      `${emp.first_name} ${emp.last_name}`,
      emp.department || "",
      emp.job_title || "",
      format(start, "yyyy-MM-dd"),
      format(end, "yyyy-MM-dd"),
      "0",
      "0",
      "0",
      "0",
      "0", // Placeholder — will be replaced with real data later
    ])
  })

  downloadCSV(rows, `payroll-${period}-${format(start, "yyyy-MM-dd")}.csv`)
}
export function calcLateMins(
  clockIn: string,
  standardStart: string | null,
  graceMins = 5
): number {
  if (!standardStart) return 0
  const ci = new Date(clockIn)
  const [h, m] = standardStart.split(":").map(Number)
  const expected = new Date(ci)
  expected.setHours(h, m + graceMins, 0, 0)
  return Math.max(0, Math.round((ci.getTime() - expected.getTime()) / 60000))
}
