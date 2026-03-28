import { useEffect, useState } from "react"
import {
  Play,
  Square,
  Coffee,
  Clock,
  CheckCircle2,
  Timer,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCurrentEmployee,
  useClockIn,
  useClockOut,
  useStartBreak,
  useEndBreak,
  useTodayClockEntry,
} from "@/lib/queries"
import { formatMinutes, liveMinutes } from "@/lib/supabase"
import type { BreakEntry } from "@/lib/supabase"

export function ClockTab() {
  const { data: employee } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""

  const { data: entry, isLoading } = useTodayClockEntry(employeeId)
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const startBreak = useStartBreak()
  const endBreak = useEndBreak()

  // Live elapsed time — ticks every second
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Derived state ──────────────────────────────────────────────────────────
  const isClockedIn = !!entry && !entry.clock_out
  const openBreak = entry?.breaks?.find((b: BreakEntry) => !b.break_end) ?? null
  const isOnBreak = !!openBreak
  const isClockedOut = !!entry?.clock_out

  const completedBreakMins = (entry?.breaks ?? []).reduce(
    (sum: number, b: BreakEntry) => sum + (b.duration_minutes ?? 0),
    0
  )
  const liveBreakMins = openBreak
    ? Math.floor(
        (Date.now() - new Date(openBreak.break_start).getTime()) / 60000
      )
    : 0
  const totalBreakMins = completedBreakMins + liveBreakMins

  const workedMins = isClockedIn
    ? liveMinutes(entry!.clock_in, totalBreakMins)
    : (entry?.total_minutes ?? 0)

  const standardMins = (employee?.standard_hours_per_day ?? 8) * 60
  const overtimeMins = Math.max(0, workedMins - standardMins)
  const progressPct = Math.min(100, (workedMins / standardMins) * 100)

  // ── Status label ───────────────────────────────────────────────────────────
  const statusLabel = isOnBreak
    ? "On Break"
    : isClockedIn
      ? "Clocked In"
      : isClockedOut
        ? "Clocked Out"
        : "Not Started"

  const statusColor = isOnBreak
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isClockedIn
      ? "bg-green-50 text-green-700 border-green-200"
      : isClockedOut
        ? "bg-slate-100 text-slate-600 border-slate-200"
        : "bg-slate-100 text-slate-500 border-slate-200"

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleMainButton() {
    if (!employeeId) return

    if (!isClockedIn) {
      // Clock In
      await clockIn.mutateAsync(employeeId)
      toast.success("Clocked in!", {
        description: `Started at ${format(new Date(), "h:mm a")}`,
      })
    } else {
      // Clock Out
      await clockOut.mutateAsync({
        entryId: entry!.id,
        employeeId,
        totalMinutes: workedMins,
      })
      toast.success("Clocked out!", {
        description: `Total: ${formatMinutes(workedMins)}${overtimeMins > 0 ? ` (${formatMinutes(overtimeMins)} OT)` : ""}`,
      })
    }
  }

  async function handleBreakButton() {
    if (!entry || !employeeId) return

    if (isOnBreak) {
      await endBreak.mutateAsync({
        breakId: openBreak!.id,
        employeeId,
        durationMinutes: liveBreakMins,
      })
      toast.success("Break ended", {
        description: `Break duration: ${formatMinutes(liveBreakMins)}`,
      })
    } else {
      await startBreak.mutateAsync({ entryId: entry.id, employeeId })
      toast.info("Break started")
    }
  }

  const isMutating =
    clockIn.isPending ||
    clockOut.isPending ||
    startBreak.isPending ||
    endBreak.isPending

  if (isLoading || !employee) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pt-2">
      {/* ── Main clock card ── */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8">
          {/* Status badge */}
          <Badge
            variant="outline"
            className={`px-3 py-1 text-sm font-medium ${statusColor}`}
          >
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full ${
                isOnBreak
                  ? "bg-amber-400"
                  : isClockedIn
                    ? "animate-pulse bg-green-500"
                    : "bg-slate-400"
              }`}
            />
            {statusLabel}
          </Badge>

          {/* Live timer */}
          <div className="text-center">
            <p className="font-mono text-6xl font-bold tracking-tight tabular-nums">
              {formatMinutes(workedMins)}
            </p>
            {entry && (
              <p className="mt-2 text-sm text-muted-foreground">
                {isClockedIn
                  ? `Since ${format(new Date(entry.clock_in), "h:mm a")}`
                  : `${format(new Date(entry.clock_in), "h:mm a")} – ${format(new Date(entry.clock_out!), "h:mm a")}`}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  overtimeMins > 0 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>{employee.standard_hours_per_day}h standard</span>
            </div>
          </div>

          {/* Main toggle button */}
          <Button
            size="lg"
            className={`h-14 w-48 rounded-xl text-base font-semibold transition-all ${
              isClockedIn
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            disabled={isMutating || isClockedOut}
            onClick={handleMainButton}
          >
            {isMutating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isClockedIn ? (
              <>
                <Square className="mr-2 h-5 w-5" /> Clock Out
              </>
            ) : isClockedOut ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" /> Done
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> Clock In
              </>
            )}
          </Button>

          {/* Break button — only while clocked in */}
          {isClockedIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBreakButton}
              disabled={isMutating}
              className={
                isOnBreak
                  ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                  : ""
              }
            >
              <Coffee className="mr-2 h-4 w-4" />
              {isOnBreak
                ? `End Break (${formatMinutes(liveBreakMins)})`
                : "Start Break"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Today's summary ── */}
      {entry && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <SummaryCell
                label="Worked"
                value={formatMinutes(workedMins)}
                highlight={false}
              />
              <SummaryCell
                label="Break"
                value={totalBreakMins > 0 ? formatMinutes(totalBreakMins) : "—"}
                highlight={false}
              />
              <SummaryCell
                label="Overtime"
                value={overtimeMins > 0 ? formatMinutes(overtimeMins) : "—"}
                highlight={overtimeMins > 0}
              />
            </div>

            {/* Break log */}
            {(entry.breaks?.length ?? 0) > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Break Log
                </p>
                {entry.breaks!.map((b: BreakEntry, i: number) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">
                      Break {i + 1} —{" "}
                      {format(new Date(b.break_start), "h:mm a")}
                      {b.break_end
                        ? ` – ${format(new Date(b.break_end), "h:mm a")}`
                        : " (ongoing)"}
                    </span>
                    <span className="font-medium">
                      {b.duration_minutes
                        ? formatMinutes(b.duration_minutes)
                        : "…"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Overtime notice ── */}
      {overtimeMins > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Timer className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                Overtime: {formatMinutes(overtimeMins)}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                You've exceeded your {employee.standard_hours_per_day}h standard
                day
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${highlight ? "text-amber-600" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  )
}
