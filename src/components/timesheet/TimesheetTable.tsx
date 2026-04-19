import { format } from "date-fns"
import { MoreHorizontal, Pencil, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatMinutes } from "@/lib/supabase"

// Matching your design system colors
const ATTENDANCE_STYLE: Record<string, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  corrected:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  weekend:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
}

interface Props {
  days: Date[]
  entryByDate: Map<string, any>
  today: string
  onCorrect: (entry: any) => void
  correctionByEntryId: Map<string, any>
}

export function TimesheetTable({
  days,
  entryByDate,
  today,
  onCorrect,
  correctionByEntryId,
}: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-medium">Day & Date</TableHead>
              <TableHead className="text-xs font-medium">
                Shift Period
              </TableHead>
              <TableHead className="hidden text-xs font-medium sm:table-cell">
                Breaks
              </TableHead>
              <TableHead className="text-xs font-medium">Total Hours</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const entry = entryByDate.get(dateStr)
              const isToday = dateStr === today
              const isWeekend = [0, 6].includes(day.getDay())
              const correction = entry
                ? correctionByEntryId.get(entry.id)
                : null

              // Business Logic for Actions
              const hasPending = correction?.status === "pending"
              const wasApproved = correction?.status === "approved"
              const canRequestCorrection =
                !!entry &&
                !!entry.clock_out &&
                !isToday &&
                !hasPending &&
                !wasApproved

              return (
                <TableRow
                  key={dateStr}
                  className={`transition-colors ${isToday ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}
                      >
                        {format(day, "EEEE")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(day, "MMM d, yyyy")}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {entry ? (
                      <div className="flex items-center gap-2 text-sm tabular-nums">
                        <span>
                          {format(new Date(entry.clock_in), "h:mm a")}
                        </span>
                        <span className="text-xs text-muted-foreground">—</span>
                        <span>
                          {entry.clock_out
                            ? format(new Date(entry.clock_out), "h:mm a")
                            : "Live"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {isWeekend ? "Weekend" : "No record"}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    {entry?.breaks?.length > 0 ? (
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {formatMinutes(
                          entry.breaks.reduce(
                            (s: number, b: any) =>
                              s + (b.duration_minutes ?? 0),
                            0
                          )
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        —
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {entry?.total_minutes ? (
                      <div>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatMinutes(entry.total_minutes)}
                        </p>
                        {entry.notes && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MessageSquare className="h-2.5 w-2.5" />
                            <span className="max-w-[80px] truncate">Note</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">
                        —
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {isWeekend && !entry ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${ATTENDANCE_STYLE.weekend}`}
                      >
                        Weekend
                      </Badge>
                    ) : entry && !entry.clock_out ? (
                      <Badge
                        variant="outline"
                        className={`animate-pulse text-[10px] ${ATTENDANCE_STYLE.active}`}
                      >
                        Active
                      </Badge>
                    ) : hasPending ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${ATTENDANCE_STYLE.pending}`}
                      >
                        Pending Fix
                      </Badge>
                    ) : wasApproved ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${ATTENDANCE_STYLE.corrected}`}
                      >
                        Corrected
                      </Badge>
                    ) : entry ? (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-white text-[10px] text-slate-600"
                      >
                        Logged
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-muted/50 text-[10px] text-muted-foreground"
                      >
                        Missing
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {canRequestCorrection ? (
                          <DropdownMenuItem onClick={() => onCorrect(entry)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Request correction
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled
                            className="text-xs text-muted-foreground"
                          >
                            No actions available
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
