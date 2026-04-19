import { Play, Square, Coffee, Loader2, AlarmClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatMinutes } from "@/lib/supabase"

export function TimeClockCard({
  employee,
  workedMins,
  isClockedIn,
  isOnBreak,
  isMutating,
  onMainButton,
  onBreakButton,
}: any) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-3">
        <CardTitle className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <AlarmClock className="h-3.5 w-3.5" /> Status
          </div>
          {isClockedIn ? (
            <Badge
              variant="outline"
              className="h-5 border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 uppercase"
            >
              Clocked In
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 text-[9px] uppercase">
              Offline
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-1 text-center">
          <h2 className="text-4xl font-black tracking-tighter tabular-nums">
            {formatMinutes(workedMins)}
          </h2>
          <p className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
            Today's Progress vs {employee?.standard_hours_per_day ?? 8}h Goal
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onMainButton}
            disabled={isMutating}
            className={`h-11 w-full font-bold ${isClockedIn ? "bg-red-600 hover:bg-red-700" : "bg-primary shadow-md"}`}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isClockedIn ? (
              <>
                <Square className="mr-2 h-4 w-4" /> Clock Out
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Clock In
              </>
            )}
          </Button>

          {isClockedIn && (
            <Button
              variant="outline"
              onClick={onBreakButton}
              className={`h-11 font-bold ${isOnBreak ? "border-amber-200 bg-amber-50 text-amber-700" : ""}`}
            >
              <Coffee className="mr-2 h-4 w-4" />{" "}
              {isOnBreak ? "End Break" : "Start Break"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
