import { useState } from "react"
import { format, isSameDay } from "date-fns"
import { CalendarDays, Clock, Play } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMyTrainingRecord } from "@/lib/queries"

const STATUS_BADGE: Record<string, string> = {
  overdue: "border-red-200 bg-red-50 text-red-700",
  due_soon: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

export function TrainingCalendar() {
  const navigate = useNavigate()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { data: records = [] } = useMyTrainingRecord()

  // Map due dates for the calendar dots/highlights
  const deadlines = records.map((r) => new Date(r.due_date))

  // Filter events for the selected day
  const selectedEvents = records.filter(
    (r) => date && isSameDay(new Date(r.due_date), date)
  )

  return (
    <div className="grid animate-in grid-cols-1 items-start gap-8 duration-500 fade-in lg:grid-cols-[auto,1fr]">
      <Card className="w-fit border-none shadow-sm ring-1 ring-border">
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{ deadline: deadlines }}
            modifiersClassNames={{
              deadline:
                "bg-primary/10 text-primary font-bold underline underline-offset-4",
            }}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b px-1 pb-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
            {date ? format(date, "MMMM do, yyyy") : "Select a date"}
          </h3>
          <Badge variant="secondary" className="ml-auto text-[10px] font-bold">
            {selectedEvents.length} Deadlines
          </Badge>
        </div>

        <div className="space-y-3">
          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">
                No course deadlines on this day.
              </p>
            </div>
          ) : (
            selectedEvents.map((event) => (
              <div
                key={event.curriculum_id}
                className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${event.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                  >
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm leading-tight font-bold">
                      {event.curriculum_title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold tracking-tight uppercase ${STATUS_BADGE[event.status]}`}
                      >
                        {event.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant={event.status === "completed" ? "outline" : "default"}
                  size="sm"
                  className="h-8 w-full shrink-0 text-xs font-bold sm:w-auto"
                  onClick={() =>
                    navigate(`/training/courses/${event.curriculum_id}`)
                  }
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  {event.status === "completed" ? "Review" : "Start Course"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
