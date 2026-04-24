import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Play,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
  BookOpen,
  LayoutList,
  ChevronLeft,
} from "lucide-react"
import {
  format,
  differenceInDays,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useMyTrainingRecord } from "@/lib/queries"
import type { TrainingRecord } from "@/lib/supabase"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "dashboard" | "calendar"
type FilterKey = "all" | "overdue" | "due_soon" | "pending" | "completed"

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All",
  overdue: "Overdue",
  due_soon: "Due soon",
  pending: "Pending",
  completed: "Completed",
}

const SECTION_ORDER: Exclude<FilterKey, "all">[] = [
  "overdue",
  "due_soon",
  "pending",
  "completed",
]

const SECTION_NAMES: Record<Exclude<FilterKey, "all">, string> = {
  overdue: "Overdue",
  due_soon: "Due this week",
  pending: "Upcoming",
  completed: "Completed",
}

const STATUS_BADGE: Record<string, string> = {
  overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  due_soon:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  today:
    "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-300",
  pending:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
}

const PROGRESS_COLOR: Record<string, string> = {
  overdue: "bg-red-400",
  due_soon: "bg-amber-400",
  pending: "bg-blue-400",
  completed: "bg-emerald-500",
}

const LEFT_ACCENT: Record<string, string> = {
  overdue: "border-l-[3px] border-l-red-400 rounded-l-none",
  due_soon: "border-l-[3px] border-l-amber-400 rounded-l-none",
  pending: "border-l-[3px] border-l-blue-400 rounded-l-none",
  completed: "",
}

const DOT_COLOR: Record<string, string> = {
  overdue: "bg-red-400",
  due_soon: "bg-amber-400",
  pending: "bg-blue-400",
  completed: "bg-emerald-500",
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  cardClass = "",
  valueClass = "",
  labelClass = "",
}: {
  value: string | number
  label: string
  cardClass?: string
  valueClass?: string
  labelClass?: string
}) {
  return (
    <Card className={cn("border-none shadow-none", cardClass)}>
      <CardContent className="p-5">
        <p
          className={cn(
            "text-[10px] font-bold tracking-widest uppercase",
            labelClass || "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-3xl font-black tracking-tighter tabular-nums",
            valueClass
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function ProgressBar({
  progress,
  status,
}: {
  progress: number
  status: string
}) {
  if (progress === 0) return null
  return (
    <div className="mt-2 space-y-0.5">
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-1 rounded-full transition-all",
            PROGRESS_COLOR[status]
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {progress}% complete
      </p>
    </div>
  )
}

function CourseCard({ record }: { record: TrainingRecord }) {
  const navigate = useNavigate()
  const dueDate = new Date(record.due_date)
  const daysAgo = differenceInDays(new Date(), dueDate)
  const isDone = record.status === "completed"
  const isDueToday = isToday(dueDate)

  const badgeStatus = isDueToday ? "today" : record.status
  const badgeLabel = isDueToday ? "Due today" : record.status.replace("_", " ")
  const dueLine = isDone
    ? `Completed ${format(dueDate, "MMM d")}`
    : `Due ${isDueToday ? "today" : format(dueDate, "MMM d")}`
  const agoLine =
    record.status === "overdue" && daysAgo > 0 ? `${daysAgo}d overdue` : null
  const progress = isDone ? 100 : 0

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-primary/[0.02]",
        LEFT_ACCENT[record.status]
      )}
      onClick={() => navigate(`/training/courses/${record.curriculum_id}`)}
    >
      {record.thumbnail_url ? (
        <img
          src={record.thumbnail_url}
          className="h-10 w-16 shrink-0 rounded-md border object-cover shadow-sm"
          alt=""
        />
      ) : (
        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md border bg-muted">
          <BookOpen className="h-4 w-4 opacity-30" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {isDone && (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          )}
          <p
            className={cn(
              "text-sm font-bold transition-colors group-hover:text-primary",
              isDone && "text-muted-foreground line-through"
            )}
          >
            {record.curriculum_title}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-bold tracking-wider uppercase",
              STATUS_BADGE[badgeStatus]
            )}
          >
            {badgeLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase tabular-nums">
          <span>{dueLine}</span>
          {agoLine && (
            <>
              <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span className="text-red-500">{agoLine}</span>
            </>
          )}

          <ProgressBar
            progress={isDone ? 100 : progress}
            status={record.status}
          />
        </div>

        <Button
          variant={isDone ? "outline" : "default"}
          size="sm"
          className="shrink-0 font-bold shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/training/courses/${record.curriculum_id}`)
          }}
        >
          {!isDone && <Play className="mr-1.5 h-3 w-3 fill-current" />}
          {isDone ? "Review" : progress > 0 ? "Continue" : "Start"}
          {isDone && <ChevronRight className="ml-1 h-3 w-3" />}
        </Button>
      </div>
    </div>
  )
}

// ─── Dashboard view ───────────────────────────────────────────────────────────

function DashboardView({
  records,
  isLoading,
}: {
  records: TrainingRecord[]
  isLoading: boolean
}) {
  const [filter, setFilter] = useState<FilterKey>("all")

  const filtered = useMemo(
    () =>
      filter === "all" ? records : records.filter((r) => r.status === filter),
    [records, filter]
  )

  const grouped = useMemo(() => {
    const g: Record<string, TrainingRecord[]> = {}
    SECTION_ORDER.forEach((s) => (g[s] = []))
    filtered.forEach((r) => g[r.status]?.push(r))
    return g
  }, [filtered])

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all",
              filter === key
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            )}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Course list */}
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="animate-pulse text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Loading courses...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="mb-3 h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">No courses found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {SECTION_ORDER.map((section) => {
                const items = grouped[section]
                if (!items?.length) return null
                return (
                  <div key={section}>
                    <div className="bg-muted/40 px-5 py-2.5">
                      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        {SECTION_NAMES[section]}{" "}
                        <span className="tabular-nums">({items.length})</span>
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {items.map((r) => (
                        <CourseCard key={r.curriculum_id} record={r} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ records }: { records: TrainingRecord[] }) {
  const navigate = useNavigate()
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(new Date())

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    return eachDayOfInterval({ start, end })
  }, [month])

  const recordsByDay = useMemo(() => {
    const map = new Map<string, TrainingRecord[]>()
    records.forEach((r) => {
      const key = format(new Date(r.due_date), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return map
  }, [records])

  const selectedRecords = useMemo(() => {
    if (!selected) return []
    const key = format(selected, "yyyy-MM-dd")
    return recordsByDay.get(key) ?? []
  }, [selected, recordsByDay])

  // Sort: overdue first
  const priorityOrder = { overdue: 0, due_soon: 1, pending: 2, completed: 3 }
  const sortedSelected = [...selectedRecords].sort(
    (a, b) => (priorityOrder[a.status] ?? 4) - (priorityOrder[b.status] ?? 4)
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Calendar grid */}
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <CardContent className="p-0">
          {/* Month nav */}
          <div className="flex items-center justify-between bg-muted/40 px-5 py-3">
            <button
              onClick={() => setMonth((m) => subMonths(m, 1))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[10px] font-bold tracking-widest text-foreground uppercase">
              {format(month, "MMMM yyyy")}
            </p>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="bg-muted/40 py-2 text-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayRecords = recordsByDay.get(key) ?? []
              const isCurrentMonth = day.getMonth() === month.getMonth()
              const isSelected = selected && isSameDay(day, selected)
              const isTodays = isToday(day)

              return (
                <button
                  key={key}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "min-h-[72px] p-2 text-left transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "opacity-30",
                    isSelected &&
                      "bg-primary/[0.04] ring-1 ring-primary/20 ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                      isTodays
                        ? "bg-foreground text-background"
                        : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Event dots / pills */}
                  <div className="mt-1 space-y-0.5">
                    {dayRecords.slice(0, 2).map((r) => (
                      <div
                        key={r.curriculum_id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[9px] font-bold tracking-wide uppercase",
                          r.status === "overdue" &&
                            "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
                          r.status === "due_soon" &&
                            "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                          r.status === "pending" &&
                            "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                          r.status === "completed" &&
                            "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        )}
                      >
                        {r.curriculum_title}
                      </div>
                    ))}
                    {dayRecords.length > 2 && (
                      <p className="text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
                        +{dayRecords.length - 2} more
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail panel */}
      <div className="space-y-3">
        <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
          <div className="bg-muted/40 px-5 py-2.5">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {selected ? format(selected, "MMMM d, yyyy") : "Select a day"}
            </p>
          </div>
          <CardContent className="p-0">
            {sortedSelected.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CalendarDays className="mb-2 h-6 w-6 opacity-20" />
                <p className="text-xs font-medium">No deadlines</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedSelected.map((r) => {
                  const isDone = r.status === "completed"
                  const progress = isDone ? 100 : 0
                  return (
                    <div
                      key={r.curriculum_id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/[0.02]",
                        LEFT_ACCENT[r.status]
                      )}
                      onClick={() =>
                        navigate(`/training/courses/${r.curriculum_id}`)
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-bold",
                            isDone && "text-muted-foreground line-through"
                          )}
                        >
                          {r.curriculum_title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full",
                              DOT_COLOR[r.status]
                            )}
                          />
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            {r.status.replace("_", " ")}
                          </span>
                        </div>
                        <ProgressBar
                          progress={isDone ? 100 : progress}
                          status={r.status}
                        />
                      </div>
                      <Button
                        variant={isDone ? "outline" : "default"}
                        size="sm"
                        className="shrink-0 text-xs font-bold shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/training/courses/${r.curriculum_id}`)
                        }}
                      >
                        {!isDone && (
                          <Play className="mr-1 h-3 w-3 fill-current" />
                        )}
                        {isDone
                          ? "Review"
                          : progress > 0
                            ? "Continue"
                            : "Start"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrainingCalendar() {
  const [view, setView] = useState<ViewMode>("dashboard")
  const { data: records = [], isLoading } = useMyTrainingRecord()

  const overdueCount = records.filter((r) => r.status === "overdue").length
  const dueSoonCount = records.filter((r) => r.status === "due_soon").length
  const completedCount = records.filter((r) => r.status === "completed").length
  const overallPct =
    records.length > 0 ? Math.round((completedCount / records.length) * 100) : 0

  return (
    <div className="animate-in space-y-6 duration-500 fade-in">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          value={overdueCount}
          label="Overdue"
          cardClass="bg-red-50/50 dark:bg-red-900/50"
          valueClass="text-red-600 dark:text-red-300"
          labelClass="text-red-700 dark:text-red-400"
        />
        <StatCard
          value={dueSoonCount}
          label="Due this week"
          cardClass="bg-amber-50/50 dark:bg-amber-900/50"
          valueClass="text-amber-600 dark:text-amber-300"
          labelClass="text-amber-700 dark:text-amber-400"
        />
        <StatCard
          value={completedCount}
          label="Completed"
          cardClass="bg-emerald-50/50 dark:bg-emerald-900/50"
          valueClass="text-emerald-600 dark:text-emerald-300"
          labelClass="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          value={`${overallPct}%`}
          label="Overall progress"
          cardClass="bg-muted/40"
        />
      </div>

      {/* Toolbar with view toggle */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          {view === "dashboard" ? "Your training" : "Calendar view"}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setView("dashboard")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors",
                view === "dashboard"
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors",
                view === "calendar"
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* View */}
      {view === "dashboard" ? (
        <DashboardView records={records} isLoading={isLoading} />
      ) : (
        <CalendarView records={records} />
      )}
    </div>
  )
}
