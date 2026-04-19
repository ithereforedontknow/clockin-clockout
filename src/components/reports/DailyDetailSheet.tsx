import { format } from "date-fns"
import { X, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatMinutes } from "@/lib/supabase"

export function DailyDetailSheet({
  data,
  onClose,
}: {
  data: any | null
  onClose: () => void
}) {
  if (!data) return null

  const { employee, entries } = data

  return (
    <>
      <div
        className="fixed inset-0 z-40 animate-in bg-black/20 backdrop-blur-sm fade-in"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 z-50 flex h-full w-full animate-in flex-col border-l bg-card shadow-2xl duration-300 slide-in-from-right sm:max-w-md">
        <div className="flex items-center justify-between border-b bg-muted/20 px-6 py-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              Timesheet Detail
            </p>
            <h2 className="text-sm font-bold">
              {employee.first_name} {employee.last_name}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {entries.length === 0 ? (
              <div className="space-y-2 py-20 text-center text-muted-foreground">
                <Calendar className="mx-auto h-8 w-8 opacity-20" />
                <p className="text-xs italic">
                  No activity recorded for this period
                </p>
              </div>
            ) : (
              entries.map((entry: any) => (
                <div key={entry.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black tracking-tight text-foreground uppercase">
                      {format(new Date(entry.date), "EEEE, MMM d")}
                    </p>
                    {!entry.clock_out && (
                      <Badge className="h-4 bg-emerald-500 text-[9px]">
                        Live Now
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-3">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        Clock In
                      </p>
                      <p className="text-xs font-medium tabular-nums">
                        {entry.clock_in
                          ? format(new Date(entry.clock_in), "p")
                          : "—"}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        Clock Out
                      </p>
                      <p className="text-xs font-medium tabular-nums">
                        {entry.clock_out
                          ? format(new Date(entry.clock_out), "p")
                          : "Ongoing"}
                      </p>
                    </div>
                    <Separator className="col-span-2 opacity-50" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        Break Time
                      </p>
                      <p className="text-xs font-bold text-primary tabular-nums">
                        {entry.total_break_minutes || 0}m
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        Net Worked
                      </p>
                      <p className="text-xs font-bold text-foreground tabular-nums">
                        {formatMinutes(entry.total_minutes || 0)}
                      </p>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-blue-600" />
                      <p className="text-[10px] text-blue-800 italic">
                        "{entry.notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
