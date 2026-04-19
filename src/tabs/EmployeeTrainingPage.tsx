import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEmployees, useAllTrainingRecords } from "@/lib/queries"
import { AssignCourseDialog } from "@/components/training/AssignCourseDialog"

const STATUS_STYLE: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
}

export function EmployeeTrainingPage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const { data: employees = [] } = useEmployees()
  const { data: records = [] } = useAllTrainingRecords()

  const employee = employees.find((e) => e.id === employeeId)
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
    <div className="mx-auto max-w-5xl animate-in space-y-8 p-6 pb-24 duration-500 fade-in sm:p-8">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 shadow-sm">
              <AvatarImage src={employee?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary uppercase">
                {employee?.first_name[0]}
                {employee?.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {employee?.first_name} {employee?.last_name}
              </h1>
              <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground/70 uppercase">
                {employee?.department || "Staff"} ·{" "}
                {employee?.job_title || "Team Member"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <AssignCourseDialog
            employeeId={employeeId!}
            employeeName={employee?.first_name || "Member"}
          />
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Assigned Paths"
          value={stats.total}
          icon={GraduationCap}
        />
        <MetricCard
          label="Certified"
          value={stats.completed}
          icon={CheckCircle2}
          color="text-emerald-600"
        />
        <MetricCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          color={stats.overdue > 0 ? "text-red-600" : ""}
        />
      </div>

      {/* High Density Table */}
      <Card className="overflow-hidden border-none bg-card shadow-none ring-1 ring-border">
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
            Curriculum Record
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Course
              </TableHead>
              <TableHead className="text-center text-[10px] font-bold tracking-widest uppercase">
                Deadline
              </TableHead>
              <TableHead className="pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-40 text-center text-sm text-muted-foreground italic"
                >
                  No training records assigned.
                </TableCell>
              </TableRow>
            ) : (
              empRecords.map((r: any) => {
                const isDone = !!r.completed_at
                const isLate = !isDone && r.due_date < today
                const status = isDone
                  ? "completed"
                  : isLate
                    ? "overdue"
                    : "pending"

                return (
                  <TableRow key={r.curriculum_id} className="hover:bg-muted/30">
                    <TableCell className="py-4 pl-6">
                      <p className="text-sm font-bold">{r.curriculum?.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium tracking-tight text-muted-foreground uppercase tabular-nums">
                        Added {format(new Date(r.assigned_at), "MMM d, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-muted-foreground tabular-nums">
                      {format(new Date(r.due_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Badge
                        variant="outline"
                        className={`h-5 text-[9px] font-black tracking-tighter uppercase ${STATUS_STYLE[status]}`}
                      >
                        {status === "completed" ? "Certified" : status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-none bg-muted/20 ring-1 ring-border">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p
            className={`mt-1 text-3xl font-black tracking-tighter tabular-nums ${color || ""}`}
          >
            {value}
          </p>
        </div>
        <Icon className={`h-6 w-6 ${color || "text-muted-foreground/30"}`} />
      </CardContent>
    </Card>
  )
}
