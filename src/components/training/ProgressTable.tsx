import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function ProgressTable({ rows }: { rows: any[] }) {
  return (
    <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
              Member
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest uppercase">
              Department
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest uppercase">
              Assignments
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest uppercase">
              Overall Progress
            </TableHead>
            <TableHead className="pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.emp.id}
              className="group transition-colors hover:bg-primary/[0.02]"
            >
              <TableCell className="py-4 pl-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border shadow-sm">
                    <AvatarImage src={row.emp.avatar_url} />
                    <AvatarFallback className="text-[10px] font-bold uppercase">
                      {row.emp.first_name[0]}
                      {row.emp.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="mb-1 truncate text-sm leading-none font-bold">
                      {row.emp.first_name} {row.emp.last_name}
                    </p>
                    <p className="truncate text-[10px] font-medium text-muted-foreground uppercase">
                      {row.emp.job_title || "Staff"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {row.emp.department || "—"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums">
                    {row.completed}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    / {row.total}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-[200px]">
                <div className="space-y-1.5">
                  <Progress value={row.pct} className="h-1.5 w-full" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                    {row.pct}% complete
                  </span>
                </div>
              </TableCell>
              <TableCell className="pr-6 text-right">
                {row.total === 0 ? (
                  <Badge
                    variant="outline"
                    className="border-slate-200 text-[9px] font-bold text-slate-400 uppercase"
                  >
                    Unassigned
                  </Badge>
                ) : row.pct === 100 ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-[9px] font-bold text-emerald-700 uppercase"
                  >
                    Certified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-[9px] font-bold text-blue-700 uppercase"
                  >
                    Learning
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
