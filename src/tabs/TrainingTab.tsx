import { useState } from "react"
import { format } from "date-fns"
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Users,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  useCurrentEmployee,
  useMyTrainingRecord,
  useCurriculums,
  useMyCertifications,
  useCreateCurriculum,
  useUpdateCurriculum,
  useDeleteCurriculum,
  // useCreateModule,
  // useCreateLesson,
  useAllTrainingRecords,
  useAssignTraining,
  useEmployees,
} from "@/lib/queries"
import type { Curriculum, TrainingRecord } from "@/lib/supabase"

const STATUS_STYLE: Record<string, string> = {
  overdue: "border-red-200 bg-red-50 text-red-700",
  due_soon: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-green-200 bg-green-50 text-green-700",
}

const STATUS_ICON: Record<string, typeof Clock> = {
  overdue: AlertCircle,
  due_soon: Clock,
  pending: BookOpen,
  completed: CheckCircle2,
}

export function TrainingTab() {
  const { data: employee } = useCurrentEmployee()
  const role = employee?.role ?? "employee"
  const isInstructorOrAdmin = role === "employer" || role === "admin"

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Training</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isInstructorOrAdmin
            ? "Manage courses and track team progress"
            : "Your assigned courses and certifications"}
        </p>
      </div>

      <Tabs defaultValue="my-training">
        <TabsList>
          <TabsTrigger value="my-training" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            My Training
          </TabsTrigger>
          {isInstructorOrAdmin && (
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team Progress
            </TabsTrigger>
          )}
          {isInstructorOrAdmin && (
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Courses
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-training" className="mt-4 space-y-4">
          <MyTrainingPanel />
        </TabsContent>

        {isInstructorOrAdmin && (
          <TabsContent value="team" className="mt-4">
            <TeamProgressPanel />
          </TabsContent>
        )}

        {isInstructorOrAdmin && (
          <TabsContent value="courses" className="mt-4">
            <CoursesPanel employee={employee!} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ─── My Training panel ────────────────────────────────────────────────────────

function MyTrainingPanel() {
  const { data: records = [], isLoading } = useMyTrainingRecord()
  const { data: certs = [], isLoading: certsLoading } = useMyCertifications()

  const active = records.filter((r) => r.status !== "completed")
  // const completed = records.filter((r) => r.status === "completed")

  return (
    <div className="space-y-4">
      {/* Active assignments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4 text-primary" />
            Assigned Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">No pending training</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {active.map((r) => (
                <TrainingRow key={r.curriculum_id} record={r} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {certsLoading ? (
            <div className="space-y-3 p-4">
              {Array(2)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
          ) : certs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No certifications yet
            </p>
          ) : (
            <div className="divide-y divide-border">
              {certs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.curriculum?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Completed {format(new Date(c.issued_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-xs text-green-700"
                  >
                    Certified
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TrainingRow({ record: r }: { record: TrainingRecord }) {
  const Icon = STATUS_ICON[r.status] ?? BookOpen
  const daysLabel =
    r.status === "completed"
      ? null
      : r.days_remaining < 0
        ? `${Math.abs(r.days_remaining)}d overdue`
        : r.days_remaining === 0
          ? "Due today"
          : `${r.days_remaining}d remaining`

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="shrink-0 rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{r.curriculum_title}</p>
        {daysLabel && (
          <p
            className={`text-xs ${r.status === "overdue" ? "text-red-500" : "text-muted-foreground"}`}
          >
            {daysLabel} · Due {format(new Date(r.due_date), "MMM d, yyyy")}
          </p>
        )}
      </div>
      <Badge
        variant="outline"
        className={`text-xs capitalize ${STATUS_STYLE[r.status]}`}
      >
        {r.status.replace("_", " ")}
      </Badge>
    </div>
  )
}

// ─── Team Progress panel ──────────────────────────────────────────────────────

function TeamProgressPanel() {
  const { data: records = [], isLoading } = useAllTrainingRecords()

  const overdue = records.filter((r: any) => r.status === "overdue")
  const dueSoon = records.filter((r: any) => r.status === "due_soon")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total assigned</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p
              className={`text-2xl font-bold ${overdue.length > 0 ? "text-red-600" : ""}`}
            >
              {overdue.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Due soon</p>
            <p
              className={`text-2xl font-bold ${dueSoon.length > 0 ? "text-amber-600" : ""}`}
            >
              {dueSoon.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Users className="h-8 w-8 opacity-30" />
              <p className="text-sm">No training assignments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {records.map((r: any) => (
                <div key={r.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {r.profile?.full_name ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.curriculum?.title}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${STATUS_STYLE[r.status ?? "pending"]}`}
                    >
                      {(r.status ?? "pending").replace("_", " ")}
                    </Badge>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Due {format(new Date(r.due_date), "MMM d")}
                    </p>
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

// ─── Courses panel (instructor/admin) ─────────────────────────────────────────

function CoursesPanel({
  employee,
}: {
  employee: { id: string; role: string }
}) {
  const { data: curriculums = [], isLoading } = useCurriculums()
  const createCurriculum = useCreateCurriculum()
  const updateCurriculum = useUpdateCurriculum()
  const deleteCurriculum = useDeleteCurriculum()

  const [createOpen, setCreateOpen] = useState(false)
  // const [editTarget, setEditTarget] = useState<Curriculum | null>(null)
  const [assignTarget, setAssignTarget] = useState<Curriculum | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  function resetForm() {
    setTitle("")
    setDescription("")
    setCreateOpen(false)
    // setEditTarget(null)
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    try {
      await createCurriculum.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        is_published: false,
        created_by: employee.id,
      })
      toast.success("Course created")
      resetForm()
    } catch (err: any) {
      toast.error("Failed to create course", { description: err.message })
    }
  }

  async function handleTogglePublish(c: Curriculum) {
    await updateCurriculum.mutateAsync({
      id: c.id,
      updates: { is_published: !c.is_published },
    })
    toast.success(c.is_published ? "Course unpublished" : "Course published")
  }

  async function handleDelete(c: Curriculum) {
    try {
      await deleteCurriculum.mutateAsync(c.id)
      toast.success("Course deleted")
    } catch (err: any) {
      toast.error("Failed to delete", { description: err.message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : curriculums.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-30" />
              <p className="text-sm">No courses yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {curriculums.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.title}</p>
                    {c.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        c.is_published
                          ? "border-green-200 bg-green-50 text-xs text-green-700"
                          : "text-xs"
                      }
                    >
                      {c.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleTogglePublish(c)}
                      title={c.is_published ? "Unpublish" : "Publish"}
                    >
                      {c.is_published ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAssignTarget(c)}
                      title="Assign to employee"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New course</DialogTitle>
            <DialogDescription>
              Create a new training curriculum.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Onboarding 101"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="What will employees learn?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCurriculum.isPending}
            >
              {createCurriculum.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      {assignTarget && (
        <AssignDialog
          curriculum={assignTarget}
          assignerId={employee.id}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Assign dialog ────────────────────────────────────────────────────────────

function AssignDialog({
  curriculum,
  assignerId,
  onClose,
}: {
  curriculum: Curriculum
  assignerId: string
  onClose: () => void
}) {
  const { data: employees = [] } = useEmployees()
  const assignTraining = useAssignTraining()
  const [selectedId, setSelectedId] = useState("")
  const [dueDate, setDueDate] = useState("")

  async function handleAssign() {
    if (!selectedId || !dueDate) {
      toast.error("Select an employee and due date")
      return
    }
    const emp = employees.find((e) => e.id === selectedId)
    if (!emp?.user_id) {
      toast.error("Employee hasn't signed in yet — no LMS profile exists")
      return
    }
    try {
      await assignTraining.mutateAsync({
        user_id: emp.user_id,
        curriculum_id: curriculum.id,
        due_date: dueDate,
        assigned_by: assignerId,
      })
      toast.success(`Assigned to ${emp.first_name}`)
      onClose()
    } catch (err: any) {
      toast.error("Failed to assign", { description: err.message })
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign course</DialogTitle>
          <DialogDescription>{curriculum.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select employee…</option>
              {employees
                .filter((e) => e.employment_status === "active")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name}
                    {!e.user_id ? " (not signed in yet)" : ""}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={assignTraining.isPending}>
            {assignTraining.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
