import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, isSameDay } from "date-fns"
import { useMyTrainingRecord } from "@/lib/queries"
import { CalendarDays } from "lucide-react"

const STATUS_BADGE: Record<string, string> = {
  overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400",
  due_soon:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400",
  pending:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400",
}

const STATUS_LABEL: Record<string, string> = {
  overdue: "Overdue",
  due_soon: "Due Soon",
  pending: "In Progress",
  completed: "Completed",
}

export function TrainingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { data: records = [] } = useMyTrainingRecord()

  const dueDates = records.map((r) => new Date(r.due_date))
  const selectedEvents = records.filter(
    (r) => selectedDate && isSameDay(new Date(r.due_date), selectedDate)
  )

  return (
    <div className="grid gap-6 md:grid-cols-[auto,1fr]">
      <Card className="w-fit">
        <CardContent className="pt-5 pb-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasEvent: dueDates }}
            modifiersClassNames={{
              hasEvent: "border-2 border-primary font-semibold",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {selectedDate
              ? format(selectedDate, "MMMM d, yyyy")
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 opacity-25" />
              <p className="text-sm">No deadlines on this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event.curriculum_id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {event.curriculum_title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Due {format(new Date(event.due_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${STATUS_BADGE[event.status] ?? ""}`}
                  >
                    {STATUS_LABEL[event.status] ?? event.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
