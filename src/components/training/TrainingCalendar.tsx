import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, isSameDay } from "date-fns"
import { useMyTrainingRecord } from "@/lib/queries"

export function TrainingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { data: records = [] } = useMyTrainingRecord()

  // Get all due dates for highlighting
  const dueDates = records.map((r) => new Date(r.due_date))

  // Events on selected date
  const selectedEvents = records.filter(
    (r) => selectedDate && isSameDay(new Date(r.due_date), selectedDate)
  )

  return (
    <div className="grid gap-6 md:grid-cols-[auto,1fr]">
      <Card className="w-full">
        <CardContent className="pt-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasEvent: dueDates,
            }}
            modifiersClassNames={{
              hasEvent: "border-2 border-primary font-bold ",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate
              ? format(selectedDate, "MMMM d, yyyy")
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No due dates on this day.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event.curriculum_id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{event.curriculum_title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(event.due_date), "MMM d")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.status === "overdue" ? "destructive" : "secondary"
                    }
                  >
                    {event.status}
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
