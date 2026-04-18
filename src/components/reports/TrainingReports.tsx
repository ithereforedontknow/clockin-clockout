import { useState } from "react"
import { format, subDays } from "date-fns"
import { Download, Filter, Calendar as CalendarIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useCourseCategories } from "@/lib/queries"
import { cn } from "@/lib/utils"

interface TrainingReportRow {
  id: string
  employee_id: string
  curriculum_id: string
  due_date: string
  assigned_at: string
  completed: boolean
  overdue: boolean
  status: "completed" | "overdue" | "pending"
  employee: {
    first_name: string
    last_name: string
    department: string | null
  }
  curriculum: {
    title: string
    category: { name: string } | null
  }
}

export function TrainingReportsTab() {
  // Filters
  const [courseFilter, setCourseFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const { data: categories = [] } = useCourseCategories()

  const { data: report, isLoading } = useQuery({
    queryKey: [
      "training-completion-report",
      categoryFilter,
      statusFilter,
      dateRange,
    ],
    queryFn: async () => {
      let query = supabase
        .from("training_assignments")
        .select(
          `
          id,
          employee_id,
          curriculum_id,
          due_date,
          assigned_at,
          employee:employees(first_name, last_name, department),
          curriculum:curriculums(
            title,
            category:course_categories(name)
          ),
          certifications!left(issued_at)
        `
        )
        .gte("due_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("due_date", format(dateRange.to, "yyyy-MM-dd"))
        .order("due_date", { ascending: false })

      if (categoryFilter !== "all") {
        query = query.eq("curriculum.category_id", categoryFilter)
      }

      const { data, error } = await query
      if (error) throw error

      // Flatten and compute status
      const today = new Date()
      let processed = (data ?? []).map((row: any): TrainingReportRow => {
        const completed = row.certifications && row.certifications.length > 0
        const overdue = !completed && new Date(row.due_date) < today
        return {
          ...row,
          completed,
          overdue,
          status: completed ? "completed" : overdue ? "overdue" : "pending",
        }
      })

      // Apply status filter
      if (statusFilter !== "all") {
        processed = processed.filter((r) => r.status === statusFilter)
      }

      return processed
    },
  })

  // Get unique courses for filter
  const courses = Array.from(
    new Set((report ?? []).map((r) => r.curriculum?.title).filter(Boolean))
  )

  // Apply course filter
  const filteredReport = (report ?? []).filter((r) =>
    courseFilter === "all" ? true : r.curriculum?.title === courseFilter
  )

  // Stats
  const stats = {
    total: filteredReport.length,
    completed: filteredReport.filter((r) => r.completed).length,
    overdue: filteredReport.filter((r) => r.overdue).length,
    pending: filteredReport.filter((r) => r.status === "pending").length,
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Employee",
      "Department",
      "Course",
      "Category",
      "Assigned",
      "Due Date",
      "Status",
    ]
    const rows = filteredReport.map((row) => [
      `${row.employee?.first_name || ""} ${row.employee?.last_name || ""}`,
      row.employee?.department || "—",
      row.curriculum?.title || "Untitled",
      row.curriculum?.category?.name || "—",
      format(new Date(row.assigned_at), "yyyy-MM-dd"),
      format(new Date(row.due_date), "yyyy-MM-dd"),
      row.status.charAt(0).toUpperCase() + row.status.slice(1),
    ])

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `training-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {stats.completed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Course Completion Report</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredReport.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(dateRange.from, "MMM d")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Course Filter */}
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Active Filters Count */}
            {(categoryFilter !== "all" ||
              courseFilter !== "all" ||
              statusFilter !== "all") && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                Filtered
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : filteredReport.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Filter className="h-10 w-10 opacity-30" />
              <p className="mt-2 font-medium">No results found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReport.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.employee?.first_name} {row.employee?.last_name}
                      </TableCell>
                      <TableCell>{row.employee?.department || "—"}</TableCell>
                      <TableCell>
                        {row.curriculum?.title || "Untitled"}
                      </TableCell>
                      <TableCell>
                        {row.curriculum?.category?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(row.assigned_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(row.due_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "completed"
                              ? "default"
                              : row.status === "overdue"
                                ? "destructive"
                                : "secondary"
                          }
                          className={cn(
                            row.status === "completed" &&
                              "bg-green-100 text-green-800 hover:bg-green-100",
                            row.status === "pending" &&
                              "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          )}
                        >
                          {row.status.charAt(0).toUpperCase() +
                            row.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
