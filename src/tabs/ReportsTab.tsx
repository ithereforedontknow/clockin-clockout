import { useState, useCallback } from "react"
import {
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  eachDayOfInterval,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAllClockEntries, useEmployees } from "@/lib/queries"
import { formatMinutes } from "@/lib/supabase"
import type { ClockEntry, BreakEntry, Employee } from "@/lib/supabase"

type EmployeeWeekSummary = {
  employee: Employee
  totalMins: number
  overtimeMins: number
  daysLogged: number
  entries: (ClockEntry & { breaks: BreakEntry[] })[]
}

export function ReportsTab() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const weekEnd = addDays(weekStart, 6)

  const { data: allEntries = [], isLoading: entriesLoading } =
    useAllClockEntries(weekStartStr)
  const { data: employees = [], isLoading: empLoading } = useEmployees()

  const isLoading = entriesLoading || empLoading

  // Group entries by employee and compute summaries
  const summaries: EmployeeWeekSummary[] = employees.map((emp) => {
    const empEntries = allEntries.filter(
      (e) =>
        e.employee_id === emp.id &&
        new Date(e.date).getDay() !== 0 &&
        new Date(e.date).getDay() !== 6
    ) as (ClockEntry & { breaks: BreakEntry[]; employee: Employee })[]

    const totalMins = empEntries.reduce((s, e) => s + (e.total_minutes ?? 0), 0)
    const stdWeekMins = emp.standard_hours_per_week * 60
    const overtimeMins = Math.max(0, totalMins - stdWeekMins)
    const daysLogged = empEntries.filter((e) => e.total_minutes).length

    return {
      employee: emp,
      totalMins,
      overtimeMins,
      daysLogged,
      entries: empEntries,
    }
  })

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const rows: string[][] = [
      [
        "Employee",
        "Date",
        "Clock In",
        "Clock Out",
        "Break (min)",
        "Worked (min)",
        "Overtime (min)",
      ],
    ]

    for (const { employee, entries } of summaries) {
      for (const e of entries) {
        const breakMins = (e.breaks ?? []).reduce(
          (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
          0
        )
        const stdMins = employee.standard_hours_per_day * 60
        const otMins = Math.max(0, (e.total_minutes ?? 0) - stdMins)
        rows.push([
          `${employee.first_name} ${employee.last_name}`,
          e.date,
          e.clock_in ? format(new Date(e.clock_in), "HH:mm") : "",
          e.clock_out ? format(new Date(e.clock_out), "HH:mm") : "",
          String(breakMins),
          String(e.total_minutes ?? 0),
          String(otMins),
        ])
      }
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clockinout-report-${weekStartStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [summaries, weekStartStr])

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const totalOTEmployees = summaries.filter((s) => s.overtimeMins > 0).length
  const avgHoursMins = summaries.length
    ? Math.round(
        summaries.reduce((s, e) => s + e.totalMins, 0) / summaries.length
      )
    : 0

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-44 text-center text-sm font-medium">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          icon={Users}
          label="Active Employees"
          value={isLoading ? null : String(employees.length)}
        />
        <KPICard
          icon={Clock}
          label="Avg Hours This Week"
          value={isLoading ? null : formatMinutes(avgHoursMins)}
        />
        <KPICard
          icon={TrendingUp}
          label="Employees w/ OT"
          value={isLoading ? null : String(totalOTEmployees)}
          highlight={totalOTEmployees > 0}
        />
      </div>

      {/* Per-employee table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Weekly Summary — All Employees
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">No data for this week</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Standard</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map(
                  ({
                    employee: emp,
                    totalMins,
                    overtimeMins,
                    daysLogged,
                    entries,
                  }) => {
                    const isExpanded = expanded === emp.id
                    return (
                      <>
                        <TableRow
                          key={emp.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpanded(isExpanded ? null : emp.id)
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage
                                  src={emp.avatar_url ?? undefined}
                                />
                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                  {emp.first_name[0]}
                                  {emp.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {emp.department}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {daysLogged} / 5
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatMinutes(totalMins)}
                          </TableCell>
                          <TableCell className="text-right">
                            {overtimeMins > 0 ? (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                              >
                                +{formatMinutes(overtimeMins)}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {emp.standard_hours_per_week}h/wk
                          </TableCell>
                          <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                            {isExpanded ? "▲" : "▼"}
                          </TableCell>
                        </TableRow>

                        {/* Expanded daily breakdown */}
                        {isExpanded && (
                          <TableRow
                            key={`${emp.id}-expanded`}
                            className="bg-muted/20 hover:bg-muted/20"
                          >
                            <TableCell colSpan={6} className="p-0">
                              <div className="space-y-1.5 px-6 py-3">
                                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                  Daily Detail
                                </p>
                                {weekDays
                                  .filter(
                                    (d) => d.getDay() !== 0 && d.getDay() !== 6
                                  )
                                  .map((day) => {
                                    const dateStr = format(day, "yyyy-MM-dd")
                                    const e = entries.find(
                                      (en) => en.date === dateStr
                                    )
                                    const breakMins = (e?.breaks ?? []).reduce(
                                      (s: number, b: BreakEntry) =>
                                        s + (b.duration_minutes ?? 0),
                                      0
                                    )
                                    const ot = e
                                      ? Math.max(
                                          0,
                                          (e.total_minutes ?? 0) -
                                            emp.standard_hours_per_day * 60
                                        )
                                      : 0
                                    return (
                                      <div
                                        key={dateStr}
                                        className="flex items-center gap-6 text-xs"
                                      >
                                        <span className="w-20 text-muted-foreground">
                                          {format(day, "EEE, MMM d")}
                                        </span>
                                        {e ? (
                                          <>
                                            <span>
                                              {format(
                                                new Date(e.clock_in),
                                                "h:mm a"
                                              )}{" "}
                                              –{" "}
                                              {e.clock_out
                                                ? format(
                                                    new Date(e.clock_out),
                                                    "h:mm a"
                                                  )
                                                : "ongoing"}
                                            </span>
                                            <span className="font-medium">
                                              {formatMinutes(
                                                e.total_minutes ?? 0
                                              )}
                                            </span>
                                            {breakMins > 0 && (
                                              <span className="text-muted-foreground">
                                                {formatMinutes(breakMins)} break
                                              </span>
                                            )}
                                            {ot > 0 && (
                                              <span className="text-amber-600">
                                                +{formatMinutes(ot)} OT
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            No entry
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  }
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KPICard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Clock
  label: string
  value: string | null
  highlight?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4 pb-4">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-0.5 h-6 w-12" />
          ) : (
            <p
              className={`text-xl font-bold ${highlight ? "text-amber-600" : ""}`}
            >
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
