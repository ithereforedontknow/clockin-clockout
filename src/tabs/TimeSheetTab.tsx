import { useState } from "react"
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
  Clock,
  Pencil,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCurrentEmployee,
  useClockHistory,
  useMyCorrections,
  useAllCorrections,
} from "@/lib/queries"
import { formatMinutes } from "@/lib/supabase"
import type { ClockEntry, BreakEntry } from "@/lib/supabase"
import { ClockCorrectionDialog } from "@/components/ClockCorrectionDialog"
import type { TabId } from "@/components/Appshell"

interface Props {
  onNavigate?: (tab: TabId) => void
}

export function TimeSheetTab({ onNavigate }: Props) {
  const { data: employee } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""
  const role = employee?.role ?? "employee"
  const isManagerOrAdmin = role === "employer" || role === "admin"

  const [weekOffset, setWeekOffset] = useState(0)
  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const today = new Date().toISOString().slice(0, 10)

  const { data: entries = [], isLoading } = useClockHistory(
    employeeId,
    weekStartStr
  )
  const { data: corrections = [] } = useMyCorrections(employeeId)
  // Manager/admin also sees all pending corrections across employees
  const { data: allCorrections = [] } = useAllCorrections()
  const pendingAllCount = isManagerOrAdmin
    ? allCorrections.filter((c) => c.status === "pending").length
    : 0

  // Entry selected for correction dialog
  const [correcting, setCorrecting] = useState<
    (ClockEntry & { breaks: BreakEntry[] }) | null
  >(null)

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  })
  const entryByDate = new Map(entries.map((e) => [e.date, e]))

  // Map entryId → correction status so rows know if there's a pending request
  const correctionByEntryId = new Map(
    corrections.map((c) => [c.clock_entry_id, c])
  )

  // Week totals (weekdays only)
  const weekdayEntries = entries.filter(
    (e) => ![0, 6].includes(new Date(e.date).getDay())
  )
  const totalWorkedMins = weekdayEntries.reduce(
    (s, e) => s + (e.total_minutes ?? 0),
    0
  )
  const standardWeekMins = (employee?.standard_hours_per_week ?? 40) * 60
  const weekOvertimeMins = Math.max(0, totalWorkedMins - standardWeekMins)
  const pendingCount = corrections.filter((c) => c.status === "pending").length

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header + week nav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          {pendingCount > 0 && (
            <p className="mt-0.5 text-xs text-amber-600">
              {pendingCount} correction{" "}
              {pendingCount === 1 ? "request" : "requests"} pending review
            </p>
          )}
          {isManagerOrAdmin && pendingAllCount > 0 && (
            <button
              className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={() => onNavigate?.("approvals")}
            >
              {pendingAllCount} team correction{pendingAllCount > 1 ? "s" : ""}{" "}
              need review
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
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

      {/* Summary strip */}
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
                const isWeekend = [0, 6].includes(day.getDay())
                const isToday = dateStr === today
                const isFuture = dateStr > today
                const worked = entry?.total_minutes ?? 0
                const stdMins = (employee?.standard_hours_per_day ?? 8) * 60
                const ot = Math.max(0, worked - stdMins)
                const breakMins = (entry?.breaks ?? []).reduce(
                  (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
                  0
                )

                // Correction state for this entry
                const correction = entry
                  ? correctionByEntryId.get(entry.id)
                  : undefined
                const hasPending = correction?.status === "pending"
                const wasApproved = correction?.status === "approved"

                // An entry is editable if:
                // - it exists, has clocked out, is not today, not in the future
                // - and has no pending correction already
                const canEdit =
                  !!entry &&
                  !!entry.clock_out &&
                  !isToday &&
                  !isFuture &&
                  !hasPending

                return (
                  <div
                    key={dateStr}
                    className={`flex items-center gap-4 px-4 py-3 ${isWeekend ? "bg-muted/30" : ""} ${isToday ? "bg-primary/5" : ""}`}
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
                          {entry.notes && (
                            <span className="max-w-[160px] truncate text-xs text-muted-foreground italic">
                              "{entry.notes}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {isWeekend ? "Weekend" : isFuture ? "—" : "No entry"}
                        </span>
                      )}
                    </div>

                    {/* Right side: hours + status + edit */}
                    <div className="flex shrink-0 items-center gap-2">
                      {entry && worked > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatMinutes(worked)}
                          </p>
                          {ot > 0 && (
                            <p className="text-xs text-amber-600">
                              +{formatMinutes(ot)} OT
                            </p>
                          )}
                        </div>
                      )}

                      {/* Status badges */}
                      {entry && !entry.clock_out && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-700"
                        >
                          Active
                        </Badge>
                      )}
                      {hasPending && (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                        >
                          Correction pending
                        </Badge>
                      )}
                      {wasApproved && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-700"
                        >
                          Corrected
                        </Badge>
                      )}

                      {/* Edit button */}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setCorrecting(entry)}
                          title="Request correction"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My correction history */}
      {corrections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              My Correction Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {corrections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-medium">
                      {c.clock_entry
                        ? format(
                            new Date((c.clock_entry as ClockEntry).date),
                            "EEE, MMM d"
                          )
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      "{c.reason}"
                    </p>
                    {c.reviewer_comment && (
                      <p className="text-xs text-muted-foreground">
                        Reviewer note: "{c.reviewer_comment}"
                      </p>
                    )}
                  </div>
                  <CorrectionStatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correction dialog */}
      <ClockCorrectionDialog
        entry={correcting}
        employeeId={employeeId}
        onClose={() => setCorrecting(null)}
      />
    </div>
  )
}

function CorrectionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    denied: "bg-red-50 text-red-700 border-red-200",
  }
  return (
    <Badge
      variant="outline"
      className={`shrink-0 text-xs capitalize ${styles[status] ?? ""}`}
    >
      {status}
    </Badge>
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
