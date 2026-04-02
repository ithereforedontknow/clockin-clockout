import { useState } from "react"
import {
  format,
  startOfWeek,
  addWeeks,
  addDays,
  eachDayOfInterval,
  endOfMonth,
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
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  useAllEmployeesForReports,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeWeekSummary = {
  employee: Employee
  totalMins: number
  overtimeMins: number
  daysLogged: number
  entries: (ClockEntry & { breaks: BreakEntry[] })[]
}

type PayPeriod = "weekly" | "bimonthly" | "monthly"

// ─── Payroll helpers ──────────────────────────────────────────────────────────

function getPayPeriodRange(
  period: PayPeriod,
  offset: number
): { start: Date; end: Date; label: string } {
  const now = new Date()

  if (period === "weekly") {
    const base = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), offset)
    return {
      start: base,
      end: addDays(base, 6),
      label: `${format(base, "MMM d")} – ${format(addDays(base, 6), "MMM d, yyyy")}`,
    }
  }

  if (period === "bimonthly") {
    // Current half: 1–15 or 16–end
    const isFirstHalf = now.getDate() <= 15
    const baseMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    if (isFirstHalf) {
      const start = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1)
      const end = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 15)
      return {
        start,
        end,
        label: `${format(start, "MMM 1")} – ${format(end, "MMM 15, yyyy")}`,
      }
    } else {
      const start = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 16)
      const end = endOfMonth(baseMonth)
      return {
        start,
        end,
        label: `${format(start, "MMM 16")} – ${format(end, "MMM d, yyyy")}`,
      }
    }
  }

  // Monthly
  const baseMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  return {
    start: baseMonth,
    end: endOfMonth(baseMonth),
    label: format(baseMonth, "MMMM yyyy"),
  }
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportsTab() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [payPeriod, setPayPeriod] = useState<PayPeriod>("weekly")
  const [payOffset, setPayOffset] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<ClockCorrection | null>(null)
  const [reviewComment, setReviewComment] = useState("")

  const { data: reviewer } = useCurrentEmployee()

  // ── Timesheet week ──────────────────────────────────────────────────────────
  const baseDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const weekEnd = addDays(weekStart, 6)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const { data: allEntries = [], isLoading: entriesLoading } =
    useAllClockEntries(weekStartStr)
  const { data: employees = [], isLoading: empLoading } =
    useAllEmployeesForReports()
  const { data: corrections = [] } = useAllCorrections()
  const reviewCorrection = useReviewCorrection()
  const isLoading = entriesLoading || empLoading

  const pendingCorrections = corrections.filter((c) => c.status === "pending")

  const summaries: EmployeeWeekSummary[] = employees.map((emp) => {
    const empEntries = allEntries.filter(
      (e) => e.employee_id === emp.id
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

  const totalOTEmployees = summaries.filter((s) => s.overtimeMins > 0).length
  const avgMins = summaries.length
    ? Math.round(
        summaries.reduce((s, e) => s + e.totalMins, 0) / summaries.length
      )
    : 0

  // ── Timesheet CSV ───────────────────────────────────────────────────────────
  function handleExportTimesheetCSV() {
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
          emp.department,
          e.date,
          e.clock_in ? format(new Date(e.clock_in), "HH:mm") : "",
          e.clock_out ? format(new Date(e.clock_out), "HH:mm") : "",
          String(breakMins),
          String(e.total_minutes ?? 0),
          String(otMins),
        ])
      }
    }
    downloadCSV(rows, `timesheet-${weekStartStr}.csv`)
  }

  // ── Review ───────────────────────────────────────────────────────────────────
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

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        {pendingCorrections.length > 0 && (
          <p className="mt-0.5 text-xs text-amber-600">
            {pendingCorrections.length} correction
            {pendingCorrections.length > 1 ? "s" : ""} awaiting review
          </p>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          icon={Users}
          label="Employees"
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

      <Tabs defaultValue="timesheets">
        <TabsList>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="payroll">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Payroll Export
          </TabsTrigger>
          {pendingCorrections.length > 0 && (
            <TabsTrigger value="corrections">
              Corrections
              <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                {pendingCorrections.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Timesheets ── */}
        <TabsContent value="timesheets" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
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
                className="h-8 w-8"
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekOffset >= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTimesheetCSV}
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <TimesheetTable
            summaries={summaries}
            weekDays={weekDays}
            isLoading={isLoading}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </TabsContent>

        {/* ── Payroll Export ── */}
        <TabsContent value="payroll" className="mt-4">
          <PayrollExportPanel
            employees={employees}
            payPeriod={payPeriod}
            setPayPeriod={setPayPeriod}
            payOffset={payOffset}
            setPayOffset={setPayOffset}
          />
        </TabsContent>

        {/* ── Corrections ── */}
        <TabsContent value="corrections" className="mt-4">
          <CorrectionsQueue
            corrections={pendingCorrections}
            onReview={setReviewing}
          />
        </TabsContent>
      </Tabs>

      {/* Review dialog */}
      {reviewing && (
        <Dialog
          open
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
                Review Correction
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
                <p className="pt-1 text-muted-foreground italic">
                  "{reviewing.reason}"
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Comment (optional)</Label>
                <Textarea
                  placeholder="Add a note for the employee…"
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

// ─── Payroll Export Panel ─────────────────────────────────────────────────────

function PayrollExportPanel({
  employees,
  payPeriod,
  setPayPeriod,
  payOffset,
  setPayOffset,
}: {
  employees: Employee[]
  payPeriod: PayPeriod
  setPayPeriod: (p: PayPeriod) => void
  payOffset: number
  setPayOffset: (fn: (n: number) => number) => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { start, end, label } = getPayPeriodRange(payPeriod, payOffset)

  async function handleExport() {
    setIsGenerating(true)
    try {
      const { supabase } = await import("@/lib/supabase")

      const startStr = format(start, "yyyy-MM-dd")
      const endStr = format(end, "yyyy-MM-dd")

      const { data: entries, error } = await supabase
        .from("clock_entries")
        .select("*, employee:employees(*), breaks:break_entries(*)")
        .gte("date", startStr)
        .lte("date", endStr)

      if (error) throw error

      // Build per-employee summary
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
          "Break Hours",
        ],
      ]

      for (const emp of employees) {
        const empEntries = (entries ?? []).filter(
          (e) => e.employee_id === emp.id
        )
        const daysWorked = empEntries.filter(
          (e) => e.total_minutes && e.total_minutes > 0
        ).length

        let regularMins = 0
        let overtimeMins = 0
        let breakMins = 0

        for (const entry of empEntries) {
          const bMins = ((entry.breaks ?? []) as BreakEntry[]).reduce(
            (s, b) => s + (b.duration_minutes ?? 0),
            0
          )
          breakMins += bMins

          const worked = entry.total_minutes ?? 0
          const stdDay = emp.standard_hours_per_day * 60
          const ot = Math.max(0, worked - stdDay)
          regularMins += worked - ot
          overtimeMins += ot
        }

        const toHours = (m: number) => (m / 60).toFixed(2)

        rows.push([
          emp.id,
          `${emp.first_name} ${emp.last_name}`,
          emp.department,
          emp.job_title,
          format(start, "yyyy-MM-dd"),
          format(end, "yyyy-MM-dd"),
          String(daysWorked),
          toHours(regularMins),
          toHours(overtimeMins),
          toHours(regularMins + overtimeMins),
          toHours(breakMins),
        ])
      }

      downloadCSV(
        rows,
        `payroll-${payPeriod}-${format(start, "yyyy-MM-dd")}.csv`
      )
      toast.success("Payroll CSV exported", {
        description: `${employees.length} employees · ${label}`,
      })
    } catch (err: any) {
      toast.error("Export failed", { description: err.message })
    } finally {
      setIsGenerating(false)
    }
  }

  // Preview counts (without full fetch)
  const canGoForward = payOffset < 0

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={payPeriod}
          onValueChange={(v) => {
            setPayPeriod(v as PayPeriod)
            setPayOffset(() => 0)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="bimonthly">Bi-monthly (1–15, 16–end)</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPayOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-52 px-2 text-center text-sm font-medium">
            {label}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPayOffset((o) => o + 1)}
            disabled={!canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview card */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Period</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-sm font-medium">{employees.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Period Start</p>
              <p className="text-sm font-medium">
                {format(start, "MMM d, yyyy")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Period End</p>
              <p className="text-sm font-medium">
                {format(end, "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="mb-5 space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Export includes:</p>
            <p>· Employee name, department, job title</p>
            <p>· Period start and end dates</p>
            <p>· Days worked, regular hours, overtime hours</p>
            <p>· Total hours and break time</p>
          </div>

          <Button
            className="w-full"
            disabled={isGenerating || employees.length === 0}
            onClick={handleExport}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Payroll CSV — {label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Timesheet Table ──────────────────────────────────────────────────────────

function TimesheetTable({
  summaries,
  weekDays,
  isLoading,
  expanded,
  setExpanded,
}: {
  summaries: EmployeeWeekSummary[]
  weekDays: Date[]
  isLoading: boolean
  expanded: string | null
  setExpanded: (id: string | null) => void
}) {
  return (
    <Card>
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
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-40" />
            <p className="text-sm">No employees found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="w-6" />
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
                        className="cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : emp.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={emp.avatar_url ?? undefined} />
                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
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
                                  const bMins = (e?.breaks ?? []).reduce(
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
                                      className="flex flex-wrap items-center gap-4 text-xs"
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
                                          {bMins > 0 && (
                                            <span className="text-muted-foreground">
                                              {formatMinutes(bMins)} break
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
  )
}

// ─── Corrections Queue ────────────────────────────────────────────────────────

function CorrectionsQueue({
  corrections,
  onReview,
}: {
  corrections: ClockCorrection[]
  onReview: (c: ClockCorrection) => void
}) {
  if (corrections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <ClipboardEdit className="h-8 w-8 opacity-40" />
        <p className="text-sm">No pending corrections</p>
      </div>
    )
  }
  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">
        {corrections.map((c) => {
          const emp = c.employee as Employee | undefined
          const entry = c.clock_entry as ClockEntry | undefined
          return (
            <div
              key={c.id}
              className="flex items-start justify-between gap-4 px-4 py-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {emp?.first_name?.[0]}
                    {emp?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">
                    {emp?.first_name} {emp?.last_name}
                  </p>
                  {entry && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.date), "EEE, MMM d, yyyy")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground italic">
                    "{c.reason}"
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onReview(c)}>
                Review
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

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
