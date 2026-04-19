import { ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

export function ReportsControls({
  weekOffset,
  setWeekOffset,
  deptFilter,
  setDeptFilter,
  weekStart,
  weekEnd,
  summaries,
}: any) {
  const departments = [
    ...new Set(
      summaries.map((s: any) => s.employee.department).filter(Boolean)
    ),
  ].sort()

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-1.5">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => setWeekOffset((p: number) => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[160px] px-3 text-center">
          <span className="text-xs font-bold tabular-nums">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={weekOffset >= 0}
          onClick={() => setWeekOffset((p: number) => p + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-1 hidden h-4 w-[1px] bg-border sm:block" />

      <Select value={deptFilter} onValueChange={setDeptFilter}>
        <SelectTrigger className="h-8 w-40 border-none bg-transparent text-xs font-bold shadow-none focus:ring-0">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <SelectValue placeholder="All Departments" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((d: any) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
