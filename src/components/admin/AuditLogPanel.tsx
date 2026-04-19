import { useState } from "react"
import { format } from "date-fns"
import { ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuditLog } from "@/lib/queries"

const ACTION_LABEL: Record<string, string> = {
  approve_time_off: "Approved time off",
  deny_time_off: "Denied time off",
  approve_info_change: "Approved profile change",
  deny_info_change: "Denied profile change",
  approve_correction: "Approved correction",
  deny_correction: "Denied correction",
  create_curriculum: "Created course",
  delete_curriculum: "Deleted course",
  assign_course: "Assigned course",
  bulk_unassign_courses: "Bulk unassigned",
  complete_course: "Completed course",
}

const ACTION_COLOR: Record<string, string> = {
  approve_time_off:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  deny_time_off:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  approve_info_change:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  deny_info_change:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  approve_correction:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  deny_correction:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  create_curriculum:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  delete_curriculum:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  assign_course:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  bulk_unassign_courses:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  complete_course:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
}

const PAGE_SIZE = 15

export function AuditLogPanel() {
  const { data: entries = [], isLoading } = useAuditLog()
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const paginated = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          <ShieldCheck className="h-4 w-4" />
          Audit Log
          {entries.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto font-normal tabular-nums"
            >
              {entries.length} entries
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-px">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="ml-auto h-4 w-24" />
                </div>
              ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 opacity-25" />
            <p className="text-sm">No audit entries yet</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-medium">Actor</TableHead>
                  <TableHead className="text-xs font-medium">Action</TableHead>
                  <TableHead className="hidden text-xs font-medium lg:table-cell">
                    Target
                  </TableHead>
                  <TableHead className="hidden text-xs font-medium md:table-cell">
                    Note
                  </TableHead>
                  <TableHead className="text-xs font-medium">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((e: any) => (
                  <TableRow
                    key={e.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <TableCell>
                      <p className="text-sm leading-tight font-medium">
                        {e.actor?.first_name} {e.actor?.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {e.actor?.role}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${ACTION_COLOR[e.action] ?? "border-border bg-muted text-muted-foreground"}`}
                      >
                        {ACTION_LABEL[e.action] ?? e.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {e.target_table}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-[160px] md:table-cell">
                      <span className="block truncate text-xs text-muted-foreground">
                        {e.note ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {format(new Date(e.created_at), "MMM d 'at' h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, entries.length)} of{" "}
                  {entries.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-xs text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
