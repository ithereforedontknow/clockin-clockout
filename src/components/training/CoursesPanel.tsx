import { useState } from "react"
import { Plus, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom" // Add this
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useCurriculums, useCreateCurriculum } from "@/lib/queries"
import type { Curriculum } from "@/lib/supabase"

export function CoursesPanel() {
  const navigate = useNavigate() // Add this
  const { data: curriculums = [], isLoading } = useCurriculums()
  const createCurriculum = useCreateCurriculum()
  const [createCourseOpen, setCreateCourseOpen] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [newCourseDesc, setNewCourseDesc] = useState("")

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return toast.error("Title is required")
    await createCurriculum.mutateAsync({
      title: newCourseTitle.trim(),
      description: newCourseDesc.trim() || null,
      is_published: false,
    })
    setCreateCourseOpen(false)
    setNewCourseTitle("")
    setNewCourseDesc("")
    toast.success("Course created successfully")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateCourseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {curriculums.map((course: Curriculum) => (
            <div
              key={course.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
              >
                Edit Course
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Dialog - Keep this as dialog, it's fine */}
      <Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Course title"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newCourseDesc}
              onChange={(e) => setNewCourseDesc(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateCourseOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCourse}>Create Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
