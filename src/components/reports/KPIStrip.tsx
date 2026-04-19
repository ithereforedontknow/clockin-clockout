import { Users, Clock, TrendingUp, AlertCircle, CalendarX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function KPICards({
  summaries,
  isLoading,
}: {
  summaries: any[]
  isLoading: boolean
}) {
  if (isLoading)
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )

  const totalOT = summaries.filter((s) => s.overtimeMins > 0).length
  const totalLate = summaries.reduce(
    (sum, s) => sum + (s.lateMins > 0 ? 1 : 0),
    0
  )
  const totalAbsent = summaries.reduce((sum, s) => sum + s.absentDays, 0)
  const avgMins = summaries.length
    ? Math.round(
        summaries.reduce((sum, s) => sum + s.totalMins, 0) / summaries.length
      )
    : 0

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        icon={Users}
        label="Total Staff"
        value={summaries.length}
        color="text-primary"
      />
      <StatCard
        icon={Clock}
        label="Avg. Work Week"
        value={`${(avgMins / 60).toFixed(1)}h`}
      />
      <StatCard
        icon={TrendingUp}
        label="Overtime (Ppl)"
        value={totalOT}
        color={totalOT > 0 ? "text-amber-600" : ""}
      />
      <StatCard
        icon={AlertCircle}
        label="Late Frequency"
        value={totalLate}
        color={totalLate > 0 ? "text-red-600" : ""}
      />
      <StatCard
        icon={CalendarX}
        label="Total Absences"
        value={totalAbsent}
        color={totalAbsent > 0 ? "text-red-600" : ""}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="border-none bg-muted/30 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg border border-border/50 bg-background p-2 shadow-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="mb-1 text-[10px] leading-none font-bold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p
            className={`text-xl font-black tracking-tighter tabular-nums ${color || "text-foreground"}`}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
