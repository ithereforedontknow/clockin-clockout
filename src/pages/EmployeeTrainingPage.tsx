import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, GraduationCap, Trophy } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmployees, useAllTrainingRecords } from "@/lib/queries"
import { AssignCourseDialog } from "@/components/training/AssignCourseDialog"

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  overdue: {
    label: "Overdue",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  due_soon: {
    label: "Due Soon",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  pending: {
    label: "In Progress",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
} as const

export function EmployeeTrainingPage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const { data: employees = [], isLoading: empLoading } = useEmployees()
  const { data: records = [], isLoading: recLoading } = useAllTrainingRecords()

  const employee = employees.find((e) => e.id === employeeId)
  // Filter by employee_id (uuid) — NOT user_id
  const empRecords = records.filter((r: any) => r.employee_id === employeeId)
  const today = new Date().toISOString().split("T")[0]

  const stats = {
    total: empRecords.length,
    completed: empRecords.filter((r: any) => r.completed_at).length,
    overdue: empRecords.filter(
      (r: any) => !r.completed_at && r.due_date < today
    ).length,
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Training Record</h1>
      </div>

      {empLoading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : employee ? (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={employee.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {employee.first_name[0]}
                {employee.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-lg font-semibold">
                {employee.first_name} {employee.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {employee.job_title || employee.department || "—"}
              </p>
            </div>
            <AssignCourseDialog
              employeeId={employee.id}
              employeeName={`${employee.first_name} ${employee.last_name}`}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Employee not found</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Assigned", value: stats.total, color: "" },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-green-600",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            color: stats.overdue > 0 ? "text-red-600" : "",
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <GraduationCap className="h-4 w-4" />
            Assigned Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recLoading ? (
            <div className="space-y-3 p-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : empRecords.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <GraduationCap className="h-8 w-8 opacity-30" />
              <p className="text-sm">No courses assigned yet</p>
              {employee && (
                <AssignCourseDialog
                  employeeId={employee.id}
                  employeeName={`${employee.first_name} ${employee.last_name}`}
                />
              )}
            </div>
          ) : (
            <div className="divide-y">
              {empRecords.map((r: any) => {
                const isCompleted = !!r.completed_at
                const isOverdue = !isCompleted && r.due_date < today
                const status = isCompleted
                  ? "completed"
                  : isOverdue
                    ? "overdue"
                    : "pending"
                const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
                return (
                  <div
                    key={r.curriculum_id}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                      {isCompleted ? (
                        <Trophy className="h-5 w-5 text-green-600" />
                      ) : (
                        <GraduationCap className="h-5 w-5 text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.curriculum?.title ?? "Untitled Course"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {format(new Date(r.due_date), "MMM d, yyyy")}
                        {r.completed_at && (
                          <span className="text-green-600">
                            {" · Completed "}
                            {format(new Date(r.completed_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] ${cfg.className}`}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
