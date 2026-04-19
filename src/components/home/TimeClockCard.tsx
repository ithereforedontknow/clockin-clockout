import {
  Play,
  Square,
  Coffee,
  Loader2,
  AlarmClock,
  Check,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatMinutes } from "@/lib/supabase"

export function TimeClockCard({
  employee,
  workedMins,
  isClockedIn,
  isClockedOut,
  isOnBreak,
  isMutating,
  onMainButton,
  onBreakButton,
}: any) {
  // Constants for SaaS safety
  const LONG_SHIFT_THRESHOLD = 720 // 12 Hours
  const isLongShift = isClockedIn && workedMins > LONG_SHIFT_THRESHOLD

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm transition-all duration-300">
      <CardHeader className="border-b bg-muted/20 pb-3">
        <CardTitle className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <AlarmClock className="h-3.5 w-3.5" /> Status
          </div>
          {isClockedIn ? (
            <Badge
              variant="outline"
              className={`h-5 border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 uppercase ${isLongShift ? "animate-pulse" : ""}`}
            >
              Clocked In
            </Badge>
          ) : isClockedOut ? (
            <Badge
              variant="outline"
              className="h-5 border-slate-200 bg-slate-100 text-[9px] text-slate-600 uppercase"
            >
              Shift Ended
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
          <h2
            className={`text-4xl font-black tracking-tighter tabular-nums ${isClockedOut ? "text-muted-foreground" : ""}`}
          >
            {formatMinutes(workedMins)}
          </h2>
          <p className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
            Today's Progress vs {employee?.standard_hours_per_day ?? 8}h Goal
          </p>
        </div>

        {/* Long Shift Detection Warning */}
        {isLongShift && (
          <div className="flex animate-in items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50/50 p-3 duration-500 fade-in slide-in-from-top-1">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold tracking-tight text-orange-800 uppercase">
                Long Shift Detected
              </p>
              <p className="text-[10px] leading-tight text-orange-700/80">
                You've been active for over 12 hours. Please ensure you clock
                out correctly.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={onMainButton}
            disabled={isMutating || isClockedOut}
            className={`h-11 w-full font-bold transition-all ${
              isClockedIn
                ? "bg-red-600 text-white hover:bg-red-700"
                : isClockedOut
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary shadow-md"
            }`}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isClockedIn ? (
              <>
                <Square className="mr-2 h-4 w-4" /> Clock Out
              </>
            ) : isClockedOut ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Shift Completed
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
              disabled={isMutating}
              className={`h-11 font-bold ${isOnBreak ? "border-amber-200 bg-amber-50 text-amber-700" : ""}`}
            >
              <Coffee className="mr-2 h-4 w-4" />{" "}
              {isOnBreak ? "End Break" : "Start Break"}
            </Button>
          )}

          {isClockedOut && (
            <p className="text-center text-[10px] font-medium text-muted-foreground italic">
              Your shift for today has been recorded.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
