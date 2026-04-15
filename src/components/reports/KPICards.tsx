import { Users, Clock, TrendingUp, AlertCircle, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { EmployeeWeekSummary } from "./hooks/useTimesheetData"

type KPICardProps = {
  icon: React.ElementType
  label: string
  value: string | number | null
  highlight?: boolean
}

function KPICard({ icon: Icon, label, value, highlight }: KPICardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-4 pb-4">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p
              className={`text-2xl font-bold ${highlight ? "text-amber-600" : ""}`}
            >
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function KPICards({
  summaries,
  isLoading,
}: {
  summaries: EmployeeWeekSummary[]
  isLoading: boolean
}) {
  const totalOT = summaries.filter((s) => s.overtimeMins > 0).length
  const lateCount = summaries.filter((s) => s.lateMins > 0).length
  const absentTotal = summaries.reduce((sum, s) => sum + s.absentDays, 0)
  const avgMins = summaries.length
    ? Math.round(
        summaries.reduce((sum, s) => sum + s.totalMins, 0) / summaries.length
      )
    : 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KPICard
        icon={Users}
        label="Employees"
        value={isLoading ? null : summaries.length}
      />
      <KPICard
        icon={Clock}
        label="Avg Hours"
        value={isLoading ? null : `${(avgMins / 60).toFixed(1)}h`}
      />
      <KPICard
        icon={TrendingUp}
        label="With OT"
        value={isLoading ? null : totalOT}
        highlight={totalOT > 0}
      />
      <KPICard
        icon={AlertCircle}
        label="Late This Week"
        value={isLoading ? null : lateCount}
        highlight={lateCount > 0}
      />
      <KPICard
        icon={X}
        label="Absent Days"
        value={isLoading ? null : absentTotal}
        highlight={absentTotal > 0}
      />
    </div>
  )
}
