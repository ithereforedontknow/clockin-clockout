import { useState, useMemo } from "react"
import {
  format,
  startOfWeek,
  addWeeks,
  eachDayOfInterval,
  addDays,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useCurrentEmployee,
  useClockHistory,
  useMyCorrections,
  useAllCorrections,
} from "@/lib/queries"
import { lateMins } from "@/lib/attendance"
import { ClockCorrectionDialog } from "@/components/ClockCorrectionDialog"

import {
  TimesheetTable,
  TimesheetStats,
  CorrectionHistory,
} from "@/components/timesheet"

export function TimeSheetTab({
  onNavigate,
}: {
  onNavigate?: (tab: any) => void
}) {
  const { data: employee } = useCurrentEmployee()
  const [weekOffset, setWeekOffset] = useState(0)
  const [correcting, setCorrecting] = useState<any>(null)

  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  })
  const today = new Date().toISOString().slice(0, 10)

  const { data: entries = [], isLoading } = useClockHistory(
    employee?.id ?? "",
    format(weekStart, "yyyy-MM-dd")
  )
  const { data: corrections = [] } = useMyCorrections(employee?.id ?? "")
  const { data: allCorrections = [] } = useAllCorrections()

  const entryByDate = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  )
  const correctionByEntryId = useMemo(
    () => new Map(corrections.map((c) => [c.clock_entry_id, c])),
    [corrections]
  )

  // Calculated Stats
  const weekdayEntries = entries.filter(
    (e) => ![0, 6].includes(new Date(e.date).getDay())
  )
  const totalWorkedMins = weekdayEntries.reduce(
    (s, e) => s + (e.total_minutes ?? 0),
    0
  )
  const standardWeekMins = (employee?.standard_hours_per_week ?? 40) * 60
  const lateDaysCount = weekdayEntries.filter(
    (e) =>
      e.clock_in &&
      lateMins(e.clock_in, employee?.standard_start_time ?? null) > 0
  ).length

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Timesheet</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Manage your work hours and correction requests.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-card p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex min-w-[180px] items-center justify-center gap-2 px-3 text-sm font-medium">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {format(weekStart, "MMM d")} –{" "}
            {format(addDays(weekStart, 6), "MMM d")}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Role Alerts */}
      {(employee?.role === "admin" || employee?.role === "employer") &&
        allCorrections.some((c) => c.status === "pending") && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm font-medium">
              Team members have pending correction requests.
            </p>
            <Button
              size="sm"
              variant="link"
              className="h-auto gap-1 p-0"
              onClick={() => onNavigate?.("approvals")}
            >
              Review Requests <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}

      <TimesheetStats
        isLoading={isLoading}
        totalWorkedMins={totalWorkedMins}
        standardWeekMins={standardWeekMins}
        overtimeMins={Math.max(0, totalWorkedMins - standardWeekMins)}
        lateDays={lateDaysCount}
        daysLogged={weekdayEntries.filter((e) => e.total_minutes).length}
      />

      <TimesheetTable
        days={weekDays}
        entryByDate={entryByDate}
        today={today}
        onCorrect={setCorrecting}
        correctionByEntryId={correctionByEntryId}
      />

      <CorrectionHistory corrections={corrections} />

      <ClockCorrectionDialog
        entry={correcting}
        employeeId={employee?.id ?? ""}
        onClose={() => setCorrecting(null)}
      />
    </div>
  )
}
