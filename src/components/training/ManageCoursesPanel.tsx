import { useState } from "react"
import { Plus, GraduationCap, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  useCurriculums,
  useCourseCategories,
  useCreateCurriculum,
} from "@/lib/queries"
import { CourseRow } from "@/components/training/CourseRow"
import type { Curriculum } from "@/lib/supabase"
import { BulkAssignDialog } from "@/components/training/BulkAssignDialog"
import { BulkUnassignDialog } from "@/components/training/BulkUnassignDialog"
import { Skeleton } from "@/components/ui/skeleton"

export function ManageCoursesPanel() {
  const { data: curriculums = [], isLoading } = useCurriculums()
  const { data: categories = [] } = useCourseCategories()
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

  const published = curriculums.filter((c) => c.is_published).length
  const drafts = curriculums.filter((c) => !c.is_published).length

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border bg-card px-4 py-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">
              {curriculums.length}
            </p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Published
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              {published}
            </p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">Drafts</p>
            <p className="mt-0.5 text-2xl font-semibold text-amber-600 tabular-nums dark:text-amber-400">
              {drafts}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <BulkUnassignDialog />
          <BulkAssignDialog />
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </div>
      </div>

      {/* Course list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
        </div>
      ) : curriculums.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <LayoutGrid className="h-8 w-8 opacity-40" />
          </div>
          <div>
            <p className="font-medium">No courses yet</p>
            <p className="mt-1 text-sm">
              Create your first course to get started
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create your first course
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {curriculums.map((course: Curriculum) => (
            <CourseRow
              key={course.id}
              course={course}
              categories={categories}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              New Course
            </DialogTitle>
            <DialogDescription>
              Add a title and description, then build out modules and lessons in
              the editor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
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
                placeholder="What will learners gain from this course?"
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
