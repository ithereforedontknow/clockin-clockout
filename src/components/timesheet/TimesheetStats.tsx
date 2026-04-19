import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMinutes } from "@/lib/supabase"
import { Clock, Timer, CalendarCheck } from "lucide-react"

interface StatsProps {
  isLoading: boolean
  totalWorkedMins: number
  standardWeekMins: number
  overtimeMins: number
  lateDays: number
  daysLogged: number
}

export function TimesheetStats({
  isLoading,
  totalWorkedMins,
  standardWeekMins,
  overtimeMins,
  lateDays,
  daysLogged,
}: StatsProps) {
  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )

  const progress = Math.min((totalWorkedMins / standardWeekMins) * 100, 100)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="border-none bg-primary/5 shadow-none">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-primary tabular-nums">
              {Math.round(progress)}% of weekly goal
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatMinutes(totalWorkedMins)}
          </p>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
            Total hours this week
          </p>
          <Progress value={progress} className="h-1.5 bg-primary/10" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 w-fit rounded-lg bg-orange-50 p-2 text-orange-600 dark:bg-orange-950/20">
            <Timer className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {overtimeMins > 0 ? formatMinutes(overtimeMins) : "0h 00m"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Overtime earned</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 w-fit rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/20">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{daysLogged}/5</p>
            {lateDays > 0 && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                {lateDays} Late
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Work days logged</p>
        </CardContent>
      </Card>
    </div>
  )
}
