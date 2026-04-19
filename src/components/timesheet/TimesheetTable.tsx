import { format } from "date-fns"
import { MoreHorizontal, Pencil, MessageSquare, Clock } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-6 text-[10px] font-bold tracking-[0.2em] uppercase">
                Day & Date
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Shift Period
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold tracking-[0.2em] uppercase sm:table-cell">
                Breaks
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Total Hours
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Status
              </TableHead>
              <TableHead className="w-12" />
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
                  className={`group transition-colors ${isToday ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="min-w-0">
                      <p
                        className={`mb-1 text-sm leading-none font-bold ${isToday ? "text-primary" : ""}`}
                      >
                        {format(day, "EEEE")}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {format(day, "MMM d, yyyy")}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {entry ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 tabular-nums">
                        <span>
                          {format(new Date(entry.clock_in), "h:mm a")}
                        </span>
                        <span className="text-muted-foreground/50">—</span>
                        <span>
                          {entry.clock_out
                            ? format(new Date(entry.clock_out), "h:mm a")
                            : "Live"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground/60 italic">
                        {isWeekend ? "Weekend" : "No entry"}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    {entry?.breaks?.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                        <Clock className="h-3 w-3 opacity-50" />
                        {formatMinutes(
                          entry.breaks.reduce(
                            (s: number, b: any) =>
                              s + (b.duration_minutes ?? 0),
                            0
                          )
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {entry?.total_minutes ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {formatMinutes(entry.total_minutes)}
                        </span>
                        {entry.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex cursor-help items-center gap-1 text-[10px] font-bold text-primary">
                                  <MessageSquare className="h-2.5 w-2.5" /> Note
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{entry.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {isWeekend && !entry ? (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold tracking-tighter uppercase ${ATTENDANCE_STYLE.weekend}`}
                      >
                        Weekend
                      </Badge>
                    ) : entry && !entry.clock_out ? (
                      <Badge
                        variant="outline"
                        className={`animate-pulse text-[9px] font-bold uppercase ${ATTENDANCE_STYLE.active}`}
                      >
                        Active
                      </Badge>
                    ) : hasPending ? (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase ${ATTENDANCE_STYLE.pending}`}
                      >
                        Pending Fix
                      </Badge>
                    ) : wasApproved ? (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase ${ATTENDANCE_STYLE.corrected}`}
                      >
                        Corrected
                      </Badge>
                    ) : entry ? (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-white text-[9px] font-bold text-slate-500 uppercase"
                      >
                        Logged
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-muted/50 text-[9px] font-bold text-muted-foreground/60 uppercase"
                      >
                        Missing
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {canRequestCorrection ? (
                          <DropdownMenuItem
                            onClick={() => onCorrect(entry)}
                            className="text-xs font-semibold"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Request correction
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled
                            className="text-[10px] font-bold text-muted-foreground/50 uppercase"
                          >
                            Locked
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
