import { format } from "date-fns"
import { Download } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function TrainingReportsTab({ reportData, onExport }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-9 font-bold"
          onClick={onExport}
        >
          <Download className="mr-2 h-4 w-4" /> Export Completion CSV
        </Button>
      </div>

      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Employee
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Course Title
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Due Date
              </TableHead>
              <TableHead className="pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="pl-6 text-sm font-medium">
                  {row.employee?.first_name} {row.employee?.last_name}
                </TableCell>
                <TableCell className="text-sm">
                  {row.curriculum?.title}
                </TableCell>
                <TableCell className="text-[11px] font-bold text-muted-foreground tabular-nums">
                  {format(new Date(row.due_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-black uppercase ${
                      row.status === "completed"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : row.status === "overdue"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
