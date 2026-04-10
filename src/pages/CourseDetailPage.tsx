import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/", { state: { tab: "training" } })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto p-4">
            <div className="hidden w-80 overflow-y-auto border-r bg-muted/20 p-4 md:block">
              <h3 className="mb-4 font-medium">Course Content</h3>
              {isLoading ? (
                <div className="space-y-3">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-8 animate-pulse rounded-md bg-muted"
                      />
                    ))}
                </div>
              ) : modules.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No content yet
                </div>
              ) : (
                modules.map((module: any) => (
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
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-semibold">{course.title}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden w-80 overflow-y-auto border-r bg-muted/20 p-4 md:block">
          <h3 className="mb-4 font-medium">Course Content</h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-8 animate-pulse rounded-md bg-muted"
                  />
                ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No content yet
            </div>
          ) : (
            modules.map((module: any) => (
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
            ))
          )}
        </div>

        {/* Main player */}
        <div className="flex-1 overflow-y-auto">
          {allLessons.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <p className="text-lg font-medium">
                No lessons in this course yet
              </p>
              <p className="text-sm">
                Check back later or contact your instructor.
              </p>
            </div>
          ) : !currentLesson ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a lesson to begin
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
