import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useCurriculumDetail, useCurrentEmployee } from "@/lib/queries"
import { LessonPlayer } from "@/components/training/LessonPlayer"
import { Button } from "@/components/ui/button"

export function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { data: course, isLoading } = useCurriculumDetail(courseId!)
  const { data: employee } = useCurrentEmployee()
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  if (isLoading) return <div className="p-8">Loading course...</div>
  if (!course) return <div className="p-8">Course not found</div>

  const modules = course.modules || []
  const allLessons = modules.flatMap((m: any) => m.lessons || []) as any[]
  const currentLesson =
    allLessons.find((l: any) => l.id === selectedLessonId) || allLessons[0]
  const currentIndex = allLessons.findIndex(
    (l: any) => l.id === currentLesson?.id
  )

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 border-b p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{course.title}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 overflow-y-auto border-r bg-muted/20 p-4">
          <h3 className="mb-4 font-medium">Course Content</h3>
          {modules.map((module: any) => (
            <div key={module.id} className="mb-4">
              <p className="mb-2 text-sm font-semibold">{module.title}</p>
              <div className="space-y-1">
                {module.lessons?.map((lesson: any) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selectedLessonId === lesson.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {lesson.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main player */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <LessonPlayer
              lesson={currentLesson}
              courseId={course.id}
              employee={employee}
              onNext={
                currentIndex < allLessons.length - 1
                  ? () => setSelectedLessonId(allLessons[currentIndex + 1].id)
                  : undefined
              }
              onPrev={
                currentIndex > 0
                  ? () => setSelectedLessonId(allLessons[currentIndex - 1].id)
                  : undefined
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a lesson to begin
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
