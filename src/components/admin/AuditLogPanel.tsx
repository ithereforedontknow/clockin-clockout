import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuditLog } from "@/lib/queries"

const PAGE_SIZE = 12

export function AuditLogPanel() {
  const { data: entries = [], isLoading } = useAuditLog()
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const paginated = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  )

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Operator
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                System Action
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold tracking-widest uppercase lg:table-cell">
                Module
              </TableHead>
              <TableHead className="pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
                Timestamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-40 animate-pulse text-center text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                >
                  Pulling Audit Stream...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-40 text-center text-sm text-muted-foreground italic"
                >
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((e: any) => (
                <TableRow
                  key={e.id}
                  className="group transition-colors hover:bg-muted/30"
                >
                  <TableCell className="py-3 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        {e.actor?.first_name} {e.actor?.last_name}
                      </span>
                      <span className="text-[10px] font-bold tracking-tighter text-muted-foreground uppercase">
                        {e.actor?.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className="w-fit border-slate-200 bg-slate-50 text-[9px] font-black tracking-tighter text-slate-600 uppercase"
                      >
                        {e.action?.replace(/_/g, " ") || ""}
                      </Badge>
                      <span className="line-clamp-1 text-xs font-medium text-muted-foreground italic">
                        "{e.note || "System log"}"
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3 w-3 text-muted-foreground/40" />
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-600 uppercase">
                        {e.target_table ?? "-"}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right text-[11px] font-bold text-muted-foreground tabular-nums">
                    {format(new Date(e.created_at), "MMM d, HH:mm:ss")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Entries {entries.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(page * PAGE_SIZE, entries.length)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
