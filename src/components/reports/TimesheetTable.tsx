import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { downloadTimesheetCSV } from "./utils/reportUtils"
import type { EmployeeWeekSummary } from "./hooks/useTimesheetData"

interface Props {
  summaries: EmployeeWeekSummary[]
  weekDays: Date[]
  weekStart: Date
  weekEnd: Date
  isLoading: boolean
  deptFilter: string
  setDeptFilter: (value: string) => void
  weekOffset: number
  setWeekOffset: (value: number | ((prev: number) => number)) => void
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export function TimesheetTable({
  summaries,
  weekDays,
  weekStart,
  weekEnd,
  isLoading,
  deptFilter,
  setDeptFilter,
  weekOffset,
  setWeekOffset,
}: Props) {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  // Filter + Search
  const filteredSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      const emp = summary.employee
      const q = searchQuery.toLowerCase()
      return (
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q) ||
        emp.job_title?.toLowerCase().includes(q)
      )
    })
  }, [summaries, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredSummaries.length / rowsPerPage)
  const paginatedSummaries = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return filteredSummaries.slice(start, start + rowsPerPage)
  }, [filteredSummaries, page, rowsPerPage])

  const departments = [
    ...new Set(summaries.map((s) => s.employee.department).filter(Boolean)),
  ].sort()

  const handleExportCSV = () => {
    downloadTimesheetCSV(summaries, weekStart) // Export all, not just current page
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[200px] text-center font-medium">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((p) => p + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="relative w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1) // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>

            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Rows per page */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedSummaries.length} of {filteredSummaries.length}{" "}
            employees
          </p>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(v) => {
              setRowsPerPage(Number(v))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROWS_PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3 py-8">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        ) : filteredSummaries.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No employees found
          </p>
        ) : (
          <Table>
            {/* Table header and body same as before but using paginatedSummaries */}
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">OT</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Undertime</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSummaries.map((summary) => {
                const isExpanded = expanded === summary.employee.id
                return (
                  <>
                    <TableRow
                      key={summary.employee.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setExpanded(isExpanded ? null : summary.employee.id)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={summary.employee.avatar_url ?? undefined}
                            />
                            <AvatarFallback>
                              {summary.employee.first_name[0]}
                              {summary.employee.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {summary.employee.first_name}{" "}
                              {summary.employee.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {summary.employee.department}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.daysLogged}/5
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(summary.totalMins / 60).toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.overtimeMins > 0 ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            +{(summary.overtimeMins / 60).toFixed(1)}h
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {summary.lateMins > 0
                          ? `${(summary.lateMins / 60).toFixed(1)}h`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {summary.undertimeMins > 0
                          ? `-${(summary.undertimeMins / 60).toFixed(1)}h`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {summary.absentDays > 0
                          ? `${summary.absentDays}d`
                          : "—"}
                      </TableCell>
                      <TableCell>{isExpanded ? "▲" : "▼"}</TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={8} className="p-0">
                          <div className="space-y-3 p-6">
                            <p className="text-sm font-medium">
                              Daily Breakdown
                            </p>
                            {weekDays
                              .filter((d) => ![0, 6].includes(d.getDay()))
                              .map((day) => {
                                const dateStr = format(day, "yyyy-MM-dd")
                                const entry = summary.entries.find(
                                  (e) => e.date === dateStr
                                )
                                return (
                                  <div
                                    key={dateStr}
                                    className="flex justify-between border-b pb-2 text-sm last:border-0"
                                  >
                                    <span className="w-28 font-medium">
                                      {format(day, "EEE, MMM d")}
                                    </span>
                                    {entry ? (
                                      <div className="flex gap-6 text-muted-foreground">
                                        <span>
                                          {entry.clock_in
                                            ? format(
                                                new Date(entry.clock_in),
                                                "h:mm a"
                                              )
                                            : "—"}
                                        </span>
                                        <span>
                                          {entry.clock_out
                                            ? format(
                                                new Date(entry.clock_out),
                                                "h:mm a"
                                              )
                                            : "Ongoing"}
                                        </span>
                                        <span className="font-medium text-foreground">
                                          {(entry.total_minutes ?? 0) / 60} hrs
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        No record
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
