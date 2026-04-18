import { useState } from "react"
import { Search, Users, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const unassignAllFromEmployee = (employeeId: string) => {
    unassignAll.mutate({ employeeIds: [employeeId] })
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Team Members", value: employees.length, color: "" },
          {
            label: "With Courses",
            value: rows.filter((r) => r.total > 0).length,
            color: "text-primary",
          },
          {
            label: "Unassigned",
            value: rows.filter((r) => r.total === 0).length,
            color: "text-muted-foreground",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
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
        <BulkAssignDialog />
        <BulkUnassignDialog />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <Users className="h-4 w-4" />
            Team Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">
              No employees found
            </p>
          ) : (
            <div className="divide-y">
              {rows.map(({ emp, completed, total, pct }) => (
                <div key={emp.id} className="flex items-center gap-4 px-4 py-3">
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
                        : `${completed}/${total} completed`}
                    </p>
                  </div>
                  {total > 0 && (
                    <div className="hidden w-24 sm:block">
                      <Progress value={pct} className="h-1.5" />
                      <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                        {pct}%
                      </p>
                    </div>
                  )}
                  <AssignCourseDialog
                    employeeId={emp.id}
                    employeeName={`${emp.first_name} ${emp.last_name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => unassignAllFromEmployee(emp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
