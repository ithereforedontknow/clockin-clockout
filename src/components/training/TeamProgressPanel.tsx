import { useState, useMemo } from "react"
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
  useEmployees,
  useAllTrainingRecords,
  useCourseCategories,
  useBulkUnassign,
} from "@/lib/queries"
import { AssignCourseDialog } from "@/components/training/AssignCourseDialog"
import { BulkUnassignDialog } from "@/components/training/BulkUnassignDialog"
// import { BulkAssignDialog } from "@/components/training/BulkAssignDialog" // Assuming this accepts selectedIds too

export function TeamProgressPanel() {
  const { data: employees = [] } = useEmployees()
  const { data: assignments = [] } = useAllTrainingRecords()
  const { data: categories = [] } = useCourseCategories()
  const unassignAll = useBulkUnassign()

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const pageSize = 15

  const filteredAssignments = useMemo(() => {
    return categoryFilter === "all"
      ? assignments
      : assignments.filter(
          (a: any) => a.curriculum?.category_id === categoryFilter
        )
  }, [assignments, categoryFilter])

  const rows = useMemo(() => {
    return employees
      .filter(
        (e) =>
          !search ||
          `${e.first_name} ${e.last_name}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
      .map((emp) => {
        const ea = filteredAssignments.filter(
          (a: any) => a.employee_id === emp.id
        )
        const completed = ea.filter((a: any) => a.completed_at).length
        const total = ea.length
        return {
          emp,
          completed,
          total,
          pct: total ? Math.round((completed / total) * 100) : 0,
        }
      })
  }, [employees, filteredAssignments, search])

  // Pagination
  const totalPages = Math.ceil(rows.length / pageSize)
  const paginatedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Selection Logic
  const toggleAll = () => {
    if (selectedIds.size === paginatedRows.length && paginatedRows.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedRows.map((r) => r.emp.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const withCourses = rows.filter((r) => r.total > 0).length
  const unassigned = rows.filter((r) => r.total === 0).length

  return (
    <div className="animate-in space-y-6 pb-24 duration-500 fade-in">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-none bg-muted/40 shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Total Members
              </p>
              <p className="mt-1 text-3xl font-black tracking-tighter tabular-nums">
                {employees.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card className="border-none bg-blue-50/50 shadow-none dark:bg-blue-900/50">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-blue-700 uppercase dark:text-blue-400">
                In Training
              </p>
              <p className="mt-1 text-3xl font-black tracking-tighter text-blue-600 tabular-nums dark:text-blue-300">
                {withCourses}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600/30 dark:text-blue-400/30" />
          </CardContent>
        </Card>
        <Card className="border-none bg-muted/40 shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Unassigned
              </p>
              <p className="mt-1 text-3xl font-black tracking-tighter tabular-nums">
                {unassigned}
              </p>
            </div>
            <UserX className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="h-10 pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="h-10 w-full border-none bg-muted/30 text-xs font-bold shadow-none sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={
                    selectedIds.size === paginatedRows.length &&
                    paginatedRows.length > 0
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Member
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold tracking-widest uppercase md:table-cell">
                Department
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Assignments
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Overall Progress
              </TableHead>
              <TableHead className="w-24 pr-6 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-sm text-muted-foreground italic"
                >
                  No members found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow
                  key={row.emp.id}
                  className={`group transition-colors ${selectedIds.has(row.emp.id) ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedIds.has(row.emp.id)}
                      onCheckedChange={() => toggleOne(row.emp.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border shadow-sm">
                        <AvatarImage src={row.emp.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary uppercase">
                          {row.emp.first_name[0]}
                          {row.emp.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="mb-1 truncate text-sm leading-none font-bold">
                          {row.emp.first_name} {row.emp.last_name}
                        </p>
                        <p className="text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
                          {row.emp.job_title || "Staff"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      {row.emp.department || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold tabular-nums">
                        {row.completed}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        / {row.total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[200px]">
                    {row.total > 0 ? (
                      <div className="space-y-1.5">
                        <Progress value={row.pct} className="h-1.5 w-full" />
                        <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase tabular-nums">
                          {row.pct}% Complete
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <AssignCourseDialog
                        employeeId={row.emp.id}
                        employeeName={`${row.emp.first_name} ${row.emp.last_name}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                        onClick={() =>
                          unassignAll.mutate({ employeeIds: [row.emp.id] })
                        }
                        title="Clear all assignments"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-6 rounded-full bg-slate-900 px-6 py-3 text-white shadow-2xl duration-300 slide-in-from-bottom-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Selected
            </span>
            <span className="text-xs font-bold">
              {selectedIds.size} Members
            </span>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-3">
            {/* Note: BulkAssignDialog should be updated to accept `selectedIds` array if you want to reuse it here */}
            {/* <BulkAssignDialog preSelectedIds={Array.from(selectedIds)} onComplete={() => setSelectedIds(new Set())} /> */}
            <BulkUnassignDialog
              selectedIds={Array.from(selectedIds)}
              onSuccess={() => setSelectedIds(new Set())}
            />
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
