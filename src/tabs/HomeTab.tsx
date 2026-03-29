import { useState } from "react"
import { format, startOfWeek } from "date-fns"
import {
  Users,
  TrendingUp,
  Clock,
  PartyPopper,
  Globe,
  Play,
  Square,
  Coffee,
  Timer,
  CalendarDays,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  useCurrentEmployee,
  useWhosOut,
  useTimeOffBalances,
  useHolidays,
  useTodayClockEntry,
  useClockIn,
  useClockOut,
  useStartBreak,
  useEndBreak,
} from "@/lib/queries"
import { formatMinutes, liveMinutes } from "@/lib/supabase"
import type { BreakEntry } from "@/lib/supabase"
import { RequestTimeOffDialog } from "@/components/RequestTimeOffDialog"

export function HomeTab() {
  const [requestOpen, setRequestOpen] = useState(false)
  const weekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  )

  const { data: employee, isLoading: empLoading } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""

  const { data: whosOut = [], isLoading: whosOutLoading } =
    useWhosOut(weekStart)
  const { data: balances = [], isLoading: balancesLoading } =
    useTimeOffBalances(employeeId)
  const { data: holidays = [] } = useHolidays()
  const { data: entry, isLoading: clockLoading } =
    useTodayClockEntry(employeeId)

  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const startBreak = useStartBreak()
  const endBreak = useEndBreak()

  // Live tick for the timer
  // const [tick, setTick] = useState(0)
  // useEffect(() => {
  //   const id = setInterval(() => setTick((t) => t + 1), 1000)
  //   return () => clearInterval(id)
  // }, [])

  // ── Clock derived state ───────────────────────────────────────────────────
  const isClockedIn = !!entry && !entry.clock_out
  const isClockedOut = !!entry?.clock_out
  const openBreak = entry?.breaks?.find((b: BreakEntry) => !b.break_end) ?? null
  const isOnBreak = !!openBreak

  const completedBreakMins = (entry?.breaks ?? []).reduce(
    (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
    0
  )
  // Moved Date.now() outside of render for purity
  const now = Date.now()
  const liveBreakMins = openBreak
    ? Math.floor((now - new Date(openBreak.break_start).getTime()) / 60000)
    : 0
  const totalBreakMins = completedBreakMins + liveBreakMins
  const workedMins = isClockedIn
    ? liveMinutes(entry!.clock_in, totalBreakMins)
    : (entry?.total_minutes ?? 0)

  const standardMins = (employee?.standard_hours_per_day ?? 8) * 60
  const overtimeMins = Math.max(0, workedMins - standardMins)
  const progressPct = Math.min(100, (workedMins / standardMins) * 100)
  const isMutating =
    clockIn.isPending ||
    clockOut.isPending ||
    startBreak.isPending ||
    endBreak.isPending

  const upcomingHoliday = holidays.find((h) => new Date(h.date) >= new Date())

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleMainButton() {
    if (!employeeId) return
    if (!isClockedIn) {
      await clockIn.mutateAsync(employeeId)
      toast.success("Clocked in!", {
        description: `Started at ${format(new Date(), "h:mm a")}`,
      })
    } else {
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
        description: `Break: ${formatMinutes(liveBreakMins)}`,
      })
    } else {
      await startBreak.mutateAsync({ entryId: entry.id, employeeId })
      toast.info("Break started")
    }
  }

  // ── Status helpers ────────────────────────────────────────────────────────
  const statusLabel = isOnBreak
    ? "On Break"
    : isClockedIn
      ? "Clocked In"
      : isClockedOut
        ? "Clocked Out"
        : "Not Started"
  const statusDot = isOnBreak
    ? "bg-amber-400"
    : isClockedIn
      ? "bg-green-500 animate-pulse"
      : "bg-muted-foreground"
  const statusBadge = isOnBreak
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isClockedIn
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-muted text-muted-foreground border-border"

  return (
    <div className="space-y-6">
      {/* ── Welcome row ── */}
      <div className="flex items-start justify-between">
        <div>
          {empLoading ? (
            <Skeleton className="mb-2 h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-bold">
              Good {getGreeting()}, {employee?.first_name}! 👋
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRequestOpen(true)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      </div>

      {/* ── Inline Clock Widget ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Left — big timer + button */}
            <div className="flex flex-col items-center justify-center gap-4 border-b border-border p-6 sm:w-64 sm:shrink-0 sm:border-r sm:border-b-0">
              {clockLoading ? (
                <Skeleton className="h-16 w-32" />
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 text-sm font-medium ${statusBadge}`}
                  >
                    <span
                      className={`mr-2 inline-block h-2 w-2 rounded-full ${statusDot}`}
                    />
                    {statusLabel}
                  </Badge>

                  <p className="font-mono text-5xl font-bold tracking-tight tabular-nums">
                    {formatMinutes(workedMins)}
                  </p>

                  {entry && (
                    <p className="text-xs text-muted-foreground">
                      {isClockedIn
                        ? `Since ${format(new Date(entry.clock_in), "h:mm a")}`
                        : `${format(new Date(entry.clock_in), "h:mm a")} – ${format(new Date(entry.clock_out!), "h:mm a")}`}
                    </p>
                  )}

                  <Button
                    size="lg"
                    className={`w-36 rounded-xl font-semibold ${
                      isClockedIn
                        ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                    disabled={isMutating || isClockedOut}
                    onClick={handleMainButton}
                  >
                    {isMutating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isClockedIn ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Clock Out
                      </>
                    ) : isClockedOut ? (
                      <>
                        <Timer className="mr-2 h-4 w-4" />
                        Done
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Clock In
                      </>
                    )}
                  </Button>

                  {isClockedIn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs ${isOnBreak ? "text-amber-600" : "text-muted-foreground"}`}
                      onClick={handleBreakButton}
                      disabled={isMutating}
                    >
                      <Coffee className="mr-1.5 h-3.5 w-3.5" />
                      {isOnBreak
                        ? `End Break (${formatMinutes(liveBreakMins)})`
                        : "Start Break"}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Right — today's summary + progress */}
            <div className="flex flex-1 flex-col justify-center gap-4 p-6">
              <p className="text-sm font-medium text-muted-foreground">
                Today's Progress
              </p>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      overtimeMins > 0 ? "bg-amber-500" : "bg-primary"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0h</span>
                  <span>{employee?.standard_hours_per_day ?? 8}h standard</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCell label="Worked" value={formatMinutes(workedMins)} />
                <StatCell
                  label="Break"
                  value={
                    totalBreakMins > 0 ? formatMinutes(totalBreakMins) : "—"
                  }
                />
                <StatCell
                  label="Overtime"
                  value={overtimeMins > 0 ? formatMinutes(overtimeMins) : "—"}
                  highlight={overtimeMins > 0}
                />
              </div>

              {/* Overtime notice */}
              {overtimeMins > 0 && (
                <p className="text-xs text-amber-600">
                  ⚠ You've exceeded your {employee?.standard_hours_per_day}h
                  standard day by {formatMinutes(overtimeMins)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Time-off balance cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balancesLoading
          ? Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
          : balances.slice(0, 3).map((b) => (
              <Card
                key={b.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {b.category?.name}
                      </p>
                      <p className="mt-1 text-3xl font-bold">
                        {b.balance}
                        <span className="ml-1 text-base font-normal text-muted-foreground">
                          {b.category?.unit}
                        </span>
                      </p>
                      {b.scheduled > 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          {b.scheduled} {b.category?.unit} scheduled
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Bottom widgets ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Who's Out */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4" />
              Who's Out
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              Full Calendar
            </Button>
          </CardHeader>
          <CardContent>
            {whosOutLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : whosOut.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No one is out this week 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {whosOut.map((req) => {
                  const emp = req.employee
                  const initials = emp
                    ? `${emp.first_name[0]}${emp.last_name[0]}`
                    : "?"
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 border-b border-border py-2 last:border-0"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={emp?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {emp?.first_name} {emp?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.start_date), "MMM d")} –{" "}
                          {format(new Date(req.end_date), "MMM d")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {req.category?.name}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {upcomingHoliday && (
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                      Upcoming Holiday
                    </p>
                    <p className="mt-0.5 font-semibold">
                      {upcomingHoliday.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(upcomingHoliday.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <PartyPopper className="h-4 w-4" />
                Celebrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-sm text-muted-foreground">
                No celebrations this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CalendarDays className="h-4 w-4" />
                What's Happening
              </CardTitle>
            </CardHeader>
            <CardContent>
              {empLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Department: </span>
                    <span className="font-medium">{employee?.department}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location: </span>
                    <span className="font-medium">{employee?.location}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {employee?.employment_status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RequestTimeOffDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}

function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-lg font-semibold ${highlight ? "text-amber-600" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}
