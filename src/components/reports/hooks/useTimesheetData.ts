import { useMemo } from "react"
import {
  format,
  startOfWeek,
  addWeeks,
  addDays,
  eachDayOfInterval,
} from "date-fns"
import { useAllClockEntries, useAllEmployeesForReports } from "@/lib/queries"
import type { ClockEntry, BreakEntry, Employee } from "@/lib/supabase"
import { calcLateMins } from "@/components/reports/utils/reportUtils"

export type EmployeeWeekSummary = {
  employee: Employee
  totalMins: number
  overtimeMins: number
  lateMins: number
  undertimeMins: number
  absentDays: number
  daysLogged: number
  entries: (ClockEntry & { breaks: BreakEntry[] })[]
}

export function useTimesheetData(weekOffset: number, deptFilter: string = "") {
  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const weekEnd = addDays(weekStart, 6)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: allEntries = [], isLoading: entriesLoading } =
    useAllClockEntries(weekStartStr)
  const { data: employees = [], isLoading: empLoading } =
    useAllEmployeesForReports()

  const isLoading = entriesLoading || empLoading

  const summaries = useMemo(() => {
    const weekdayDates = weekDays
      .filter((d) => ![0, 6].includes(d.getDay()))
      .map((d) => format(d, "yyyy-MM-dd"))

    return employees
      .filter(
        (emp) =>
          !deptFilter || deptFilter === "all" || emp.department === deptFilter
      )
      .map((emp) => {
        const empEntries = allEntries.filter(
          (e) => e.employee_id === emp.id
        ) as (ClockEntry & { breaks: BreakEntry[]; employee: Employee })[]

        const totalMins = empEntries.reduce(
          (s, e) => s + (e.total_minutes ?? 0),
          0
        )
        const stdWeekMins = emp.standard_hours_per_week * 60
        const overtimeMins = Math.max(0, totalMins - stdWeekMins)
        const daysLogged = empEntries.filter((e) => e.total_minutes).length
        const absentDays = weekdayDates.filter(
          (d) => !empEntries.find((e) => e.date === d && e.total_minutes)
        ).length

        const lateMins = empEntries.reduce(
          (s, e) =>
            s +
            (e.clock_in
              ? calcLateMins(e.clock_in, emp.standard_start_time)
              : 0),
          0
        )
        const undertimeMins = empEntries.reduce((s, e) => {
          if (!e.clock_out) return s
          return (
            s + calcUndertimeMins(e.total_minutes, emp.standard_hours_per_day)
          )
        }, 0)

        return {
          employee: emp,
          totalMins,
          overtimeMins,
          lateMins,
          undertimeMins,
          absentDays,
          daysLogged,
          entries: empEntries,
        }
      })
  }, [allEntries, employees, weekDays, deptFilter])

  return { summaries, weekStart, weekEnd, weekDays, isLoading }
}

// Pure utility functions

function calcUndertimeMins(
  totalMinutes: number | null,
  stdHoursPerDay: number
): number {
  if (!totalMinutes) return 0
  return Math.max(0, stdHoursPerDay * 60 - totalMinutes)
}
