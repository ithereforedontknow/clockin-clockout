import { useEffect, useState } from "react"
import { format, startOfWeek } from "date-fns"
import {
  Users,
  TrendingUp,
  Clock,
  Globe,
  Play,
  Square,
  Coffee,
  Timer,
  Loader2,
  AlarmClock,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  X,
  Check,
  Megaphone,
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
  useLiveClockedIn,
  usePendingTimeOffRequests,
  useMyTrainingRecord,
  useAnnouncements,
  useReviewTimeOff,
} from "@/lib/queries"
import { formatMinutes, liveMinutes } from "@/lib/supabase"
import type { BreakEntry, Employee, ClockEntry } from "@/lib/supabase"
import { RequestTimeOffDialog } from "@/components/RequestTimeOffDialog"
import type { TabId } from "@/components/Appshell"

interface Props {
  onNavigate?: (tab: TabId) => void
}

export function HomeTab({ onNavigate }: Props) {
  const [requestOpen, setRequestOpen] = useState(false)
  const weekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  )
  const { data: employee, isLoading: empLoading } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""
  const isEmployerOrAdmin =
    employee?.role === "employer" || employee?.role === "admin"
  const { data: whosOut = [] } = useWhosOut(weekStart)
  const { data: balances = [], isLoading: balancesLoading } =
    useTimeOffBalances(employeeId)
  const { data: holidays = [] } = useHolidays()
  const { data: entry, isLoading: clockLoading } =
    useTodayClockEntry(employeeId)
  const { data: liveEntries = [] } = useLiveClockedIn()
  const { data: pendingTimeOff = [] } = usePendingTimeOffRequests()
  const { data: trainingRecords = [] } = useMyTrainingRecord()
  const { data: announcements = [] } = useAnnouncements(
    employeeId,
    employee?.role === "employer" ? employeeId : undefined
  )
  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const startBreak = useStartBreak()
  const endBreak = useEndBreak()
  const reviewTimeOff = useReviewTimeOff()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const isClockedIn = !!entry && !entry.clock_out
  const isClockedOut = !!entry?.clock_out
  const openBreak = entry?.breaks?.find((b: BreakEntry) => !b.break_end) ?? null
  const isOnBreak = !!openBreak
  const completedBreakMins = (entry?.breaks ?? []).reduce(
    (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
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
  const isMutating =
    clockIn.isPending ||
    clockOut.isPending ||
    startBreak.isPending ||
    endBreak.isPending
  const urgentTraining = trainingRecords.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  )
  const now = new Date()
  const upcomingHoliday = holidays
    .map((h) => ({
      ...h,
      thisYear: new Date(now.getFullYear(), h.month - 1, h.day),
    }))
    .find((h) => h.thisYear >= now)

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          {empLoading ? (
            <Skeleton className="mb-1 h-7 w-44" />
          ) : (
            <h1 className="text-2xl font-bold">
              Good {getGreeting()}, {employee?.first_name}! 👋
            </h1>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
            {upcomingHoliday && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="flex items-center gap-1.5">
                  <span>
                    <span className="font-medium text-muted-foreground">
                      {upcomingHoliday.name}
                    </span>
                    <span className="mx-1">on</span>
                    {format(upcomingHoliday.thisYear, "MMMM d")}
                  </span>
                </span>
              </>
            )}
          </div>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT — Time Clock + PTO Approvals + Balances */}
        <div className="space-y-5">
          {/* ... Time Clock, PTO Approvals, Leave Balances (unchanged) ... */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <AlarmClock className="h-4 w-4" />
                Time Clock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time clock content unchanged */}
              {clockLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 text-sm font-medium ${statusBadge}`}
                    >
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${statusDot}`}
                      />
                      {statusLabel}
                    </Badge>
                    <p className="font-mono text-3xl font-bold tabular-nums">
                      {formatMinutes(workedMins)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${overtimeMins > 0 ? "bg-amber-500" : "bg-primary"}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {entry
                          ? format(new Date(entry.clock_in), "h:mm a")
                          : "—"}
                      </span>
                      <span>
                        {employee?.standard_hours_per_day ?? 8}h target
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Worked</p>
                      <p className="text-sm font-semibold">
                        {formatMinutes(workedMins)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Break</p>
                      <p className="text-sm font-semibold">
                        {totalBreakMins > 0
                          ? formatMinutes(totalBreakMins)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">OT</p>
                      <p
                        className={`text-sm font-semibold ${overtimeMins > 0 ? "text-amber-600" : ""}`}
                      >
                        {overtimeMins > 0 ? formatMinutes(overtimeMins) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className={`flex-1 font-semibold ${
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
                        variant="outline"
                        className={
                          isOnBreak ? "border-amber-300 text-amber-700" : ""
                        }
                        onClick={handleBreakButton}
                        disabled={isMutating}
                      >
                        <Coffee className="mr-1.5 h-4 w-4" />
                        {isOnBreak ? formatMinutes(liveBreakMins) : "Break"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isEmployerOrAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <Clock className="h-4 w-4" />
                  PTO Approvals
                </CardTitle>
                {pendingTimeOff.length > 0 && (
                  <button
                    onClick={() => onNavigate?.("approvals")}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View All <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {pendingTimeOff.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                    No pending requests
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingTimeOff.slice(0, 3).map((req) => {
                      const emp = req.employee as Employee | undefined
                      const isSelf = req.employee_id === employeeId
                      return (
                        <div
                          key={req.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                              {emp?.first_name?.[0]}
                              {emp?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {emp?.first_name} {emp?.last_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(req.start_date), "MMM d")} –{" "}
                              {format(new Date(req.end_date), "MMM d")} ·{" "}
                              {req.category?.name}
                            </p>
                          </div>
                          {isSelf ? (
                            <span className="text-[10px] text-muted-foreground">
                              Own
                            </span>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 border-red-200 text-red-600 hover:bg-red-50"
                                disabled={reviewTimeOff.isPending}
                                onClick={() =>
                                  reviewTimeOff.mutate(
                                    {
                                      request: req,
                                      decision: "denied",
                                      comment: "",
                                    },
                                    { onSuccess: () => toast.success("Denied") }
                                  )
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                className="h-6 w-6"
                                disabled={reviewTimeOff.isPending}
                                onClick={() =>
                                  reviewTimeOff.mutate(
                                    {
                                      request: req,
                                      decision: "approved",
                                      comment: "",
                                    },
                                    {
                                      onSuccess: () =>
                                        toast.success("Approved"),
                                    }
                                  )
                                }
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {pendingTimeOff.length > 3 && (
                      <button
                        onClick={() => onNavigate?.("approvals")}
                        className="w-full px-4 py-2 text-left text-xs text-primary hover:bg-muted/50"
                      >
                        +{pendingTimeOff.length - 3} more
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <TrendingUp className="h-4 w-4" />
                Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {balancesLoading
                ? Array(3)
                    .fill(0)
                    .map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
                : balances.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between"
                    >
                      <p className="text-sm text-muted-foreground">
                        {b.category?.name}
                      </p>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {b.balance}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          {b.category?.unit}
                        </span>
                        {b.scheduled > 0 && (
                          <p className="text-[10px] text-amber-600">
                            -{b.scheduled} scheduled
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE — Announcements + My Courses + Who's Out */}
        <div className="space-y-5">
          {/* Announcements, My Courses, Who's Out (unchanged) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <Megaphone className="h-4 w-4" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No announcements yet
                </p>
              ) : (
                announcements.slice(0, 6).map((a) => {
                  const author = a.author as
                    | {
                        first_name: string
                        last_name: string
                        avatar_url: string | null
                      }
                    | undefined
                  return (
                    <div
                      key={a.id}
                      className={`rounded-lg border p-3 ${a.pinned ? "border-primary/20 bg-primary/5" : "border-border bg-muted/20"}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={author?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {author?.first_name?.[0]}
                            {author?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-xs font-medium">
                              {author?.first_name} {author?.last_name}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              · {format(new Date(a.created_at), "MMM d")}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold">
                            {a.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {a.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* My Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <GraduationCap className="h-4 w-4" />
                My Courses
              </CardTitle>
              <button
                onClick={() => onNavigate?.("training")}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </CardHeader>
            <CardContent>
              {trainingRecords.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No courses assigned
                </p>
              ) : (
                <div className="space-y-2">
                  {trainingRecords.slice(0, 3).map((r) => (
                    <div
                      key={r.curriculum_id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                      onClick={() => onNavigate?.("training")}
                    >
                      <div
                        className={`shrink-0 rounded-lg p-2 ${r.status === "completed" ? "bg-green-100" : "bg-primary/10"}`}
                      >
                        {r.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <GraduationCap className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {r.curriculum_title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Due {format(new Date(r.due_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${
                          r.status === "completed"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : r.status === "overdue"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : r.status === "due_soon"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                  {urgentTraining.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <p className="text-xs text-red-600">
                        {urgentTraining.length} course
                        {urgentTraining.length > 1 ? "s" : ""} need attention
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Who's Out */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <Users className="h-4 w-4" />
                Who's Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whosOut.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  No one out this week 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {whosOut.slice(0, 4).map((req) => {
                    const emp = req.employee as Employee | undefined
                    return (
                      <div key={req.id} className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={emp?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {emp?.first_name?.[0]}
                            {emp?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {emp?.first_name} {emp?.last_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(req.start_date), "MMM d")} –{" "}
                            {format(new Date(req.end_date), "MMM d")}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {req.category?.name}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Live Monitoring */}
          {isEmployerOrAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  <AlarmClock className="h-4 w-4 text-green-600" />
                  Clocked In Now
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {liveEntries.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveEntries.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    No one clocked in
                  </p>
                ) : (
                  <div className="space-y-2">
                    {liveEntries.slice(0, 5).map(
                      (
                        e: ClockEntry & {
                          employee: Employee
                          breaks: BreakEntry[]
                        }
                      ) => {
                        const emp = e.employee
                        const ob = e.breaks?.find(
                          (b: BreakEntry) => !b.break_end
                        )
                        const bMins = (e.breaks ?? []).reduce(
                          (s: number, b: BreakEntry) =>
                            s + (b.duration_minutes ?? 0),
                          0
                        )
                        return (
                          <div key={e.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={emp?.avatar_url ?? undefined} />
                              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                {emp?.first_name?.[0]}
                                {emp?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <p className="flex-1 truncate text-xs">
                              {emp?.first_name} {emp?.last_name}
                            </p>
                            <span
                              className={`text-[10px] font-medium ${ob ? "text-amber-600" : "text-green-600"}`}
                            >
                              {ob
                                ? "Break"
                                : formatMinutes(liveMinutes(e.clock_in, bMins))}
                            </span>
                          </div>
                        )
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT — Quick links & info (Schedule a Check-in + NEW Team Schedule + Holiday + Live) */}
        <div className="space-y-5">
          {/* Schedule a Check-in */}
          <Card className="overflow-hidden bg-primary text-primary-foreground">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-wider uppercase opacity-75">
                    Schedule a Check-in
                  </p>
                  <p className="mt-0.5 font-semibold">May Damoslog</p>
                  <p className="text-xs opacity-70">
                    Book a personal check-in session
                  </p>
                </div>
              </div>

              <a
                href="https://calendly.com/may-staffolio/check-in?month=2026-04"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-white/20 py-2 text-sm font-medium transition-colors hover:bg-white/30"
              >
                Book a Session
              </a>
            </CardContent>
          </Card>

          {/* Task Journal */}
          <Card className="overflow-hidden bg-primary text-primary-foreground">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-wider uppercase opacity-75">
                    Task Journal
                  </p>
                  <p className="mt-0.5 font-semibold">Client Story</p>
                  <p className="text-xs opacity-70">
                    A living file that outlines client requirements,
                    assumptions, and processes.
                  </p>
                </div>
              </div>

              <a
                href="https://docs.google.com/spreadsheets/d/12sEDRREQH5nhCtGWZqMFlH1_vhXbUmY_/edit?pli=1&gid=1474562549#gid=1474562549"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-white/20 py-2 text-sm font-medium transition-colors hover:bg-white/30"
              >
                Open Task Journal
              </a>
            </CardContent>
          </Card>

          {/* Upcoming Holiday */}
          {/*{upcomingHoliday && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium tracking-wide text-primary uppercase">
                      Upcoming Holiday
                    </p>
                    <p className="text-sm font-semibold">
                      {upcomingHoliday.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(upcomingHoliday.thisYear, "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}*/}
        </div>
      </div>

      <RequestTimeOffDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}
