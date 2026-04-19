import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { DailyDetailSheet } from "./DailyDetailSheet"

export function TimesheetReportTable({ summaries }: any) {
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null)

  return (
    <div className="animate-in space-y-4 duration-500 fade-in">
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Employee
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                Logged
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                Total Hours
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                OT
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                Late
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                Absent
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(summaries || []).map((s: any) => (
              <TableRow
                key={s.employee.id}
                className="group cursor-pointer transition-colors hover:bg-primary/[0.02]"
                onClick={() => setSelectedEntry(s)}
              >
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border shadow-sm">
                      <AvatarImage src={s.employee.avatar_url} />
                      <AvatarFallback className="text-[10px] font-bold">
                        {s.employee.first_name?.trim()?.[0] ||
                          s.employee.last_name?.trim()?.[0] ||
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="mb-1 truncate text-sm leading-none font-bold">
                        {s.employee.first_name} {s.employee.last_name}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">
                        {s.employee.department}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums">
                  {s.daysLogged}/5
                </TableCell>
                <TableCell className="text-right text-sm font-bold tabular-nums">
                  {(s.totalMins / 60).toFixed(1)}h
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.overtimeMins > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-amber-100 bg-amber-50 text-[10px] text-amber-700"
                    >
                      +{(s.overtimeMins / 60).toFixed(1)}h
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-sm font-medium text-red-600 tabular-nums">
                  {s.lateMins > 0 ? `${(s.lateMins / 60).toFixed(1)}h` : "—"}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  {s.absentDays > 0 ? (
                    <Badge className="border-red-100 bg-red-50 text-[10px] text-red-700">
                      {s.absentDays}d
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DailyDetailSheet
        data={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
}
