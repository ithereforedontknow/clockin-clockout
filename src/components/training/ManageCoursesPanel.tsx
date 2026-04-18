import { useState } from "react"
import { Plus, GraduationCap, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
        <div className="flex gap-2">
          <BulkAssignDialog />
          <Button onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        </div>
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
