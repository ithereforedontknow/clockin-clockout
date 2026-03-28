import { useState, useCallback } from "react"
import {
  format,
  startOfWeek,
  addWeeks,
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
  ClipboardEdit,
  Check,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  useAllClockEntries,
  useEmployees,
  useAllCorrections,
  useReviewCorrection,
  useCurrentEmployee,
} from "@/lib/queries"
import { formatMinutes } from "@/lib/supabase"
import type {
  ClockEntry,
  BreakEntry,
  Employee,
  ClockCorrection,
} from "@/lib/supabase"

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
  const [reviewing, setReviewing] = useState<ClockCorrection | null>(null)
  const [reviewComment, setReviewComment] = useState("")

  const { data: reviewer } = useCurrentEmployee()
  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const weekEnd = addDays(weekStart, 6)

  const { data: allEntries = [], isLoading: entriesLoading } =
    useAllClockEntries(weekStartStr)
  const { data: employees = [], isLoading: empLoading } = useEmployees()
  const { data: corrections = [] } = useAllCorrections()
  const reviewCorrection = useReviewCorrection()

  const isLoading = entriesLoading || empLoading

  const pendingCorrections = corrections.filter((c) => c.status === "pending")

  const summaries: EmployeeWeekSummary[] = employees.map((emp) => {
    const empEntries = allEntries.filter(
      (e) =>
        e.employee_id === emp.id && ![0, 6].includes(new Date(e.date).getDay())
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

  // ── CSV Export ──────────────────────────────────────────────────────────────
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
    for (const { employee: emp, entries } of summaries) {
      for (const e of entries) {
        const breakMins = (e.breaks ?? []).reduce(
          (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
          0
        )
        const otMins = Math.max(
          0,
          (e.total_minutes ?? 0) - emp.standard_hours_per_day * 60
        )
        rows.push([
          `${emp.first_name} ${emp.last_name}`,
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
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `clockinout-report-${weekStartStr}.csv`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }, [summaries, weekStartStr])

  // ── Review handlers ─────────────────────────────────────────────────────────
  async function handleReview(decision: "approved" | "denied") {
    if (!reviewing || !reviewer) return
    await reviewCorrection.mutateAsync({
      correction: reviewing,
      decision,
      reviewerComment: reviewComment,
      reviewerId: reviewer.id,
    })
    toast.success(
      decision === "approved"
        ? "Correction approved — entry updated"
        : "Correction denied"
    )
    setReviewing(null)
    setReviewComment("")
  }

  const totalOTEmployees = summaries.filter((s) => s.overtimeMins > 0).length
  const avgMins = summaries.length
    ? Math.round(
        summaries.reduce((s, e) => s + e.totalMins, 0) / summaries.length
      )
    : 0

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          {pendingCorrections.length > 0 && (
            <p className="mt-0.5 text-xs text-amber-600">
              {pendingCorrections.length} correction{" "}
              {pendingCorrections.length === 1 ? "request" : "requests"}{" "}
              awaiting review
            </p>
          )}
        </div>
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          icon={Users}
          label="Active Employees"
          value={isLoading ? null : String(employees.length)}
        />
        <KPICard
          icon={Clock}
          label="Avg Hours This Week"
          value={isLoading ? null : formatMinutes(avgMins)}
        />
        <KPICard
          icon={TrendingUp}
          label="Employees w/ OT"
          value={isLoading ? null : String(totalOTEmployees)}
          highlight={totalOTEmployees > 0}
        />
        <KPICard
          icon={ClipboardEdit}
          label="Pending Corrections"
          value={String(pendingCorrections.length)}
          highlight={pendingCorrections.length > 0}
        />
      </div>

      {/* ── Pending Corrections Queue ── */}
      {pendingCorrections.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ClipboardEdit className="h-4 w-4 text-amber-600" />
              Correction Requests — Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingCorrections.map((c) => {
                const emp = c.employee as Employee | undefined
                const entry = c.clock_entry as ClockEntry | undefined
                return (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                        <AvatarImage src={emp?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {emp?.first_name?.[0]}
                          {emp?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">
                          {emp?.first_name} {emp?.last_name}
                          {entry && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {format(new Date(entry.date), "EEE, MMM d")}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reason: "{c.reason}"
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {c.requested_clock_in && (
                            <span>
                              Clock in →{" "}
                              {format(new Date(c.requested_clock_in), "h:mm a")}
                            </span>
                          )}
                          {c.requested_clock_out && (
                            <span>
                              Clock out →{" "}
                              {format(
                                new Date(c.requested_clock_out),
                                "h:mm a"
                              )}
                            </span>
                          )}
                          {c.requested_break_minutes !== null && (
                            <span>Break → {c.requested_break_minutes} min</span>
                          )}
                          {c.requested_notes !== null && (
                            <span>Notes → "{c.requested_notes}"</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        setReviewing(c)
                        setReviewComment("")
                      }}
                    >
                      Review
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Weekly Employee Table ── */}
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

                        {isExpanded && (
                          <TableRow
                            key={`${emp.id}-exp`}
                            className="bg-muted/20 hover:bg-muted/20"
                          >
                            <TableCell colSpan={6} className="p-0">
                              <div className="space-y-1.5 px-6 py-3">
                                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                  Daily Detail
                                </p>
                                {weekDays
                                  .filter((d) => ![0, 6].includes(d.getDay()))
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
                                              )}
                                              {e.clock_out
                                                ? ` – ${format(new Date(e.clock_out), "h:mm a")}`
                                                : " – ongoing"}
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

      {/* ── Review Dialog ── */}
      {reviewing && (
        <Dialog
          open={!!reviewing}
          onOpenChange={(open) => {
            if (!open) {
              setReviewing(null)
              setReviewComment("")
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardEdit className="h-5 w-5 text-primary" />
                Review Correction Request
              </DialogTitle>
              <DialogDescription>
                {(reviewing.employee as Employee | undefined)?.first_name}{" "}
                {(reviewing.employee as Employee | undefined)?.last_name} ·{" "}
                {reviewing.clock_entry
                  ? format(
                      new Date((reviewing.clock_entry as ClockEntry).date),
                      "EEE, MMM d, yyyy"
                    )
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Requested changes */}
              <div className="space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm">
                <p className="mb-2 font-medium">Requested changes</p>
                {reviewing.requested_clock_in && (
                  <p>
                    <span className="text-muted-foreground">Clock in → </span>
                    {format(new Date(reviewing.requested_clock_in), "h:mm a")}
                  </p>
                )}
                {reviewing.requested_clock_out && (
                  <p>
                    <span className="text-muted-foreground">Clock out → </span>
                    {format(new Date(reviewing.requested_clock_out), "h:mm a")}
                  </p>
                )}
                {reviewing.requested_break_minutes !== null && (
                  <p>
                    <span className="text-muted-foreground">Break → </span>
                    {reviewing.requested_break_minutes} min
                  </p>
                )}
                {reviewing.requested_notes !== null && (
                  <p>
                    <span className="text-muted-foreground">Notes → </span>"
                    {reviewing.requested_notes}"
                  </p>
                )}
                <p className="pt-1 text-muted-foreground italic">
                  "{reviewing.reason}"
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Comment (optional)</Label>
                <Textarea
                  placeholder="Add a note to the employee about this decision…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewing(null)
                  setReviewComment("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={reviewCorrection.isPending}
                onClick={() => handleReview("denied")}
              >
                {reviewCorrection.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Deny
              </Button>
              <Button
                disabled={reviewCorrection.isPending}
                onClick={() => handleReview("approved")}
              >
                {reviewCorrection.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
