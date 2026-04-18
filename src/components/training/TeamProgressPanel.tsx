import { useState } from "react"
import { Search, Users, Trash2, UserCheck, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  useEmployees,
  useAllTrainingRecords,
  useCourseCategories,
  useBulkUnassign,
} from "@/lib/queries"
import { BulkAssignDialog } from "@/components/training/BulkAssignDialog"
import { BulkUnassignDialog } from "@/components/training/BulkUnassignDialog"
import { AssignCourseDialog } from "@/components/training/AssignCourseDialog"
import { Button } from "@/components/ui/button"

export function TeamProgressPanel() {
  const { data: employees = [] } = useEmployees()
  const { data: assignments = [] } = useAllTrainingRecords()
  const { data: categories = [] } = useCourseCategories()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const unassignAll = useBulkUnassign()

  const filteredAssignments =
    categoryFilter === "all"
      ? assignments
      : assignments.filter(
          (a: any) => a.curriculum?.category_id === categoryFilter
        )

  const rows = employees
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

  const withCourses = rows.filter((r) => r.total > 0).length
  const unassigned = rows.filter((r) => r.total === 0).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Team Members",
            value: employees.length,
            icon: Users,
            iconClass: "text-muted-foreground",
          },
          {
            label: "With Courses",
            value: withCourses,
            icon: UserCheck,
            iconClass: "text-primary",
          },
          {
            label: "Unassigned",
            value: unassigned,
            icon: UserX,
            iconClass: "text-muted-foreground",
          },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <Icon className={`h-4 w-4 ${iconClass}`} />
            </div>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
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
        <BulkAssignDialog />
        <BulkUnassignDialog />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Users className="h-4 w-4" />
            Team Progress
            {rows.length > 0 && (
              <Badge variant="secondary" className="ml-auto font-normal">
                {rows.length} member{rows.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Users className="h-10 w-10 opacity-25" />
              <p className="text-sm">No employees found</p>
            </div>
          ) : (
            <div className="divide-y">
              {rows.map(({ emp, completed, total, pct }) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={emp.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {emp.first_name[0]}
                      {emp.last_name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {total === 0
                        ? "No courses assigned"
                        : `${completed} of ${total} completed`}
                    </p>
                  </div>

                  {total > 0 && (
                    <div className="hidden w-28 shrink-0 sm:block">
                      <Progress value={pct} className="h-1.5" />
                      <p className="mt-1 text-right text-[10px] text-muted-foreground tabular-nums">
                        {pct}%
                      </p>
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    <AssignCourseDialog
                      employeeId={emp.id}
                      employeeName={`${emp.first_name} ${emp.last_name}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        unassignAll.mutate({ employeeIds: [emp.id] })
                      }
                      title="Remove all assignments"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
