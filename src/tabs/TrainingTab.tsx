import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import {
  GraduationCap,
  BookOpen,
  AlertCircle,
  Search,
  Play,
  Users,
  Trophy,
  Plus,
  Pencil,
  Award,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  useCurrentEmployee,
  useMyTrainingRecord,
  useCourseProgress,
  useCurriculums,
  useCreateCurriculum,
  useAllTrainingRecords,
  useEmployees,
  useMyCertifications,
} from "@/lib/queries"
import type { TrainingRecord, Curriculum } from "@/lib/supabase"
import { AssignCourseDialog } from "@/components/AssignCourseDialog"

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    badge: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  overdue: {
    label: "Overdue",
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  due_soon: {
    label: "Due Soon",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  pending: {
    label: "In Progress",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-400",
  },
} as const

// ─── Training card ─────────────────────────────────────────────────────────────

function TrainingCard({ record }: { record: TrainingRecord }) {
  const { data: progress } = useCourseProgress(record.curriculum_id)
  const navigate = useNavigate()
  const cfg =
    STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending
  const pct = progress?.percentage ?? 0

  return (
    <div
      className="group cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
      onClick={() => navigate(`/training/courses/${record.curriculum_id}`)}
    >
      {record.thumbnail_url ? (
        <img
          src={record.thumbnail_url}
          alt=""
          className="mb-4 h-28 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mb-4 flex h-28 w-full items-center justify-center rounded-lg bg-primary/5">
          <GraduationCap className="h-10 w-10 text-primary/20" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm leading-snug font-semibold group-hover:text-primary">
            {record.curriculum_title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${cfg.badge}`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`}
            />
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% complete</span>
            <span>Due {format(new Date(record.due_date), "MMM d")}</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <Button
          size="sm"
          variant={pct > 0 && pct < 100 ? "outline" : "default"}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/training/courses/${record.curriculum_id}`)
          }}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {pct === 0 ? "Start" : pct === 100 ? "Review" : "Continue"}
        </Button>
      </div>
    </div>
  )
}

// ─── My Training panel ─────────────────────────────────────────────────────────

function MyTrainingPanel() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { data: records = [], isLoading } = useMyTrainingRecord()

  const filtered = records.filter((r) => {
    if (
      search &&
      !r.curriculum_title.toLowerCase().includes(search.toLowerCase())
    )
      return false
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: records.length,
    completed: records.filter((r) => r.status === "completed").length,
    active: records.filter(
      (r) => r.status === "pending" || r.status === "due_soon"
    ).length,
    overdue: records.filter((r) => r.status === "overdue").length,
  }

  const urgent = records.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  )

  return (
    <div className="space-y-5">
      {/* Stats — same card pattern as HomeTab */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Assigned", value: stats.total, color: "" },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-green-600",
          },
          { label: "In Progress", value: stats.active, color: "text-blue-600" },
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
      <CertificationsPanel />

      {urgent.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">
              {urgent.length} course{urgent.length > 1 ? "s" : ""}
            </span>{" "}
            need{urgent.length === 1 ? "s" : ""} your attention
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="pending">In Progress</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="font-medium">
            {search || statusFilter !== "all"
              ? "No matching courses"
              : "No courses assigned yet"}
          </p>
          {!search && statusFilter === "all" && (
            <p className="text-sm">
              Your manager will assign courses when they're ready.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r: TrainingRecord) => (
            <TrainingCard key={r.curriculum_id} record={r} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Manage Courses panel ──────────────────────────────────────────────────────

function ManageCoursesPanel() {
  const navigate = useNavigate()
  const { data: curriculums = [], isLoading } = useCurriculums()
  const createCurriculum = useCreateCurriculum()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Title is required")
    await createCurriculum.mutateAsync({
      title: title.trim(),
      description: desc.trim() || null,
      is_published: false,
    })
    toast.success("Course created — open the editor to add content")
    setOpen(false)
    setTitle("")
    setDesc("")
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: curriculums.length, color: "" },
            {
              label: "Published",
              value: curriculums.filter((c) => c.is_published).length,
              color: "text-green-600",
            },
            {
              label: "Drafts",
              value: curriculums.filter((c) => !c.is_published).length,
              color: "text-amber-600",
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
        <Button onClick={() => setOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
        </div>
      ) : curriculums.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="font-medium">No courses yet</p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first course
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {curriculums.map((course: Curriculum) => (
            <div
              key={course.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                  <GraduationCap className="h-6 w-6 text-primary/20" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{course.title}</p>
                  <Badge
                    variant={course.is_published ? "default" : "secondary"}
                    className="shrink-0 text-[10px]"
                  >
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                {course.description && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {course.description}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Created {format(new Date(course.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> New Course
            </DialogTitle>
            <DialogDescription>
              Create a course, then add modules and lessons in the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Onboarding Essentials"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="What will learners get from this course?"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="h-20 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCurriculum.isPending}
            >
              {createCurriculum.isPending ? "Creating…" : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
function CertificationsPanel() {
  const { data: certs = [], isLoading } = useMyCertifications()

  if (!isLoading && certs.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <Award className="h-4 w-4" />
        Certificates Earned
      </h3>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/40 dark:bg-yellow-900/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {cert.curriculum?.title ?? "Course"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Issued {format(new Date(cert.issued_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Team Progress panel ───────────────────────────────────────────────────────

function TeamProgressPanel() {
  const { data: employees = [] } = useEmployees()
  const { data: assignments = [] } = useAllTrainingRecords()
  const [search, setSearch] = useState("")

  const rows = employees
    .filter(
      (e) =>
        !search ||
        `${e.first_name} ${e.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .map((emp) => {
      const ea = assignments.filter((a: any) => a.employee_id === emp.id)
      const completed = ea.filter((a: any) => a.completed_at).length
      const total = ea.length
      return {
        emp,
        completed,
        total,
        pct: total ? Math.round((completed / total) * 100) : 0,
      }
    })

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

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search team members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── TrainingTab ───────────────────────────────────────────────────────────────

export function TrainingTab() {
  const { data: employee } = useCurrentEmployee()
  const isInstructorOrAdmin =
    employee?.role === "employer" || employee?.role === "admin"
  const { data: records = [] } = useMyTrainingRecord()
  const urgentCount = records.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  ).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning Hub</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isInstructorOrAdmin
              ? "Manage courses and track team progress"
              : "Continue your learning journey"}
          </p>
        </div>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {urgentCount} urgent
          </Badge>
        )}
      </div>

      <Tabs defaultValue="my-training">
        <TabsList>
          <TabsTrigger value="my-training" className="gap-2">
            <BookOpen className="h-4 w-4" /> My Training
          </TabsTrigger>
          {isInstructorOrAdmin && (
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
          )}
          {isInstructorOrAdmin && (
            <TabsTrigger value="courses" className="gap-2">
              <Trophy className="h-4 w-4" /> Manage Courses
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-training" className="mt-5">
          <MyTrainingPanel />
        </TabsContent>
        {isInstructorOrAdmin && (
          <TabsContent value="team" className="mt-5">
            <TeamProgressPanel />
          </TabsContent>
        )}
        {isInstructorOrAdmin && (
          <TabsContent value="courses" className="mt-5">
            <ManageCoursesPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
