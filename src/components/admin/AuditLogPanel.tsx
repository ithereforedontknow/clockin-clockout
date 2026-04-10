import { format } from "date-fns"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuditLog } from "@/lib/queries"

export function AuditLogPanel() {
  const { data: entries = [], isLoading } = useAuditLog()

  const ACTION_LABEL: Record<string, string> = {
    approve_time_off: "Approved time off",
    deny_time_off: "Denied time off",
    approve_info_change: "Approved profile change",
    deny_info_change: "Denied profile change",
    approve_correction: "Approved correction",
    deny_correction: "Denied correction",
  }

  const ACTION_COLOR: Record<string, string> = {
    approve_time_off: "border-green-200 bg-green-50 text-green-700",
    deny_time_off: "border-red-200 bg-red-50 text-red-700",
    approve_info_change: "border-green-200 bg-green-50 text-green-700",
    deny_info_change: "border-red-200 bg-red-50 text-red-700",
    approve_correction: "border-green-200 bg-green-50 text-green-700",
    deny_correction: "border-red-200 bg-red-50 text-red-700",
  }

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-40" />
            <p className="text-sm">No audit entries yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {e.actor?.first_name} {e.actor?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {e.actor?.role}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${ACTION_COLOR[e.action] ?? ""}`}
                    >
                      {ACTION_LABEL[e.action] ?? e.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {e.target_table}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                    {e.note ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {format(new Date(e.created_at), "MMM d 'at' h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
