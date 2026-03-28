import { useState } from "react"
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  addDays,
} from "date-fns"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentEmployee, useClockHistory } from "@/lib/queries"
import { formatMinutes } from "@/lib/supabase"
import type { ClockEntry, BreakEntry } from "@/lib/supabase"

export function TimesheetTab() {
  const { data: employee } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""

  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }) // Mon
  const weekStartStr = format(weekStart, "yyyy-MM-dd")

  const { data: entries = [], isLoading } = useClockHistory(
    employeeId,
    weekStartStr
  )

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  })

  // Map date string → entry
  const entryByDate = new Map(entries.map((e) => [e.date, e]))

  // Compute week totals
  const weekdayEntries = entries.filter((e) => {
    const d = new Date(e.date).getDay()
    return d !== 0 && d !== 6
  })
  const totalWorkedMins = weekdayEntries.reduce(
    (s, e) => s + (e.total_minutes ?? 0),
    0
  )
  const standardWeekMins = (employee?.standard_hours_per_week ?? 40) * 60
  const weekOvertimeMins = Math.max(0, totalWorkedMins - standardWeekMins)

  return (
    <div className="max-w-4xl space-y-4">
      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Timesheet</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-44 text-center text-sm font-medium">
            {format(weekStart, "MMM d")} –{" "}
            {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              This week
            </Button>
          )}
        </div>
      </div>

      {/* Weekly summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Total Worked"
          value={isLoading ? null : formatMinutes(totalWorkedMins)}
          sub={`of ${employee?.standard_hours_per_week ?? 40}h standard`}
        />
        <SummaryCard
          label="Overtime"
          value={
            isLoading
              ? null
              : weekOvertimeMins > 0
                ? formatMinutes(weekOvertimeMins)
                : "—"
          }
          highlight={weekOvertimeMins > 0}
        />
        <SummaryCard
          label="Days Logged"
          value={
            isLoading
              ? null
              : `${weekdayEntries.filter((e) => e.total_minutes).length} / 5`
          }
        />
      </div>

      {/* Day-by-day grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(7)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd")
                const entry = entryByDate.get(dateStr) as
                  | (ClockEntry & { breaks: BreakEntry[] })
                  | undefined
                const isWeekend = day.getDay() === 0 || day.getDay() === 6
                const isToday =
                  dateStr === new Date().toISOString().slice(0, 10)
                const worked = entry?.total_minutes ?? 0
                const stdMins = (employee?.standard_hours_per_day ?? 8) * 60
                const ot = Math.max(0, worked - stdMins)
                const breakMins = (entry?.breaks ?? []).reduce(
                  (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
                  0
                )

                return (
                  <div
                    key={dateStr}
                    className={`flex items-center gap-4 px-4 py-3 ${
                      isWeekend ? "bg-muted/30" : ""
                    } ${isToday ? "bg-primary/5" : ""}`}
                  >
                    {/* Day label */}
                    <div className="w-24 shrink-0">
                      <p
                        className={`text-sm font-medium ${isToday ? "text-primary" : isWeekend ? "text-muted-foreground" : ""}`}
                      >
                        {format(day, "EEE")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(day, "MMM d")}
                      </p>
                    </div>

                    {/* Time range */}
                    <div className="min-w-0 flex-1">
                      {entry ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm">
                            {format(new Date(entry.clock_in), "h:mm a")}
                            {entry.clock_out
                              ? ` – ${format(new Date(entry.clock_out), "h:mm a")}`
                              : " – ongoing"}
                          </span>
                          {breakMins > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({formatMinutes(breakMins)} break)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {isWeekend ? "Weekend" : "No entry"}
                        </span>
                      )}
                    </div>

                    {/* Hours */}
                    <div className="shrink-0 text-right">
                      {entry && worked > 0 && (
                        <>
                          <p className="text-sm font-medium">
                            {formatMinutes(worked)}
                          </p>
                          {ot > 0 && (
                            <p className="text-xs text-amber-600">
                              +{formatMinutes(ot)} OT
                            </p>
                          )}
                        </>
                      )}
                      {entry && !entry.clock_out && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-700"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string | null
  sub?: string
  highlight?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1 h-7 w-20" />
        ) : (
          <p
            className={`mt-0.5 text-2xl font-bold ${highlight ? "text-amber-600" : ""}`}
          >
            {value}
          </p>
        )}
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}
