import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurriculums, useCreateCurriculum } from "@/lib/queries"
import type { Curriculum } from "@/lib/supabase"
import { CourseCard } from "./CourseCard"

export function CoursesPanel({ employee }: { employee: any }) {
  const { data: curriculums = [], isLoading } = useCurriculums()
  const createCurriculum = useCreateCurriculum()

  const [createCourseOpen, setCreateCourseOpen] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [newCourseDesc, setNewCourseDesc] = useState("")
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return toast.error("Title is required")
    await createCurriculum.mutateAsync({
      title: newCourseTitle.trim(),
      description: newCourseDesc.trim() || null,
      is_published: false,
      created_by: employee.user_id!,
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
        curriculums.map((course: Curriculum) => (
          <CourseCard
            key={course.id}
            course={course}
            isExpanded={expandedCourse === course.id}
            onToggleExpand={() =>
              setExpandedCourse(expandedCourse === course.id ? null : course.id)
            }
          />
        ))
      )}

      {/* Create Course Dialog */}
      {createCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-background p-6">
            <h2 className="mb-4 text-xl font-semibold">New Course</h2>
            <Input
              placeholder="Course title"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              className="mb-4"
            />
            <Textarea
              placeholder="Description (optional)"
              value={newCourseDesc}
              onChange={(e) => setNewCourseDesc(e.target.value)}
              className="mb-6"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCreateCourseOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCourse}>Create Course</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
