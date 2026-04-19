import { format, addDays } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowRight,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimesheetHeaderProps {
  weekStart: Date
  weekOffset: number
  setWeekOffset: (fn: (prev: number) => number) => void
  isManager: boolean
  pendingTeamCount: number
  onNavigate?: (tab: string) => void
}

export function TimesheetHeader({
  weekStart,
  weekOffset,
  setWeekOffset,
  isManager,
  pendingTeamCount,
  onNavigate,
}: TimesheetHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage your weekly work hours.
          </p>
        </div>

        <div className="flex w-fit items-center gap-1 rounded-xl border bg-muted/50 p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setWeekOffset((w) => w - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex min-w-[160px] items-center justify-center gap-2 px-3">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold whitespace-nowrap">
              {format(weekStart, "MMM d")} –{" "}
              {format(addDays(weekStart, 6), "MMM d")}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {weekOffset !== 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-1 h-7 px-2 text-xs font-bold"
              onClick={() => setWeekOffset(() => 0)}
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {isManager && pendingTeamCount > 0 && (
        <div
          className="flex cursor-pointer items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-3 transition-colors hover:bg-indigo-100/80 dark:border-indigo-900/30 dark:bg-indigo-950/20"
          onClick={() => onNavigate?.("approvals")}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-indigo-600 p-1.5">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                Team Approvals Pending
              </p>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80">
                There are {pendingTeamCount} correction requests waiting for
                your review.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-indigo-600" />
        </div>
      )}
    </div>
  )
}
