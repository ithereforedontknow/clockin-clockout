import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Menu, CheckCircle2, Circle, Trophy } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCurriculumDetail,
  useCurrentEmployee,
  useCourseProgress,
  useLessonCompletionMap,
} from "@/lib/queries"
import { LessonPlayer } from "@/components/training/LessonPlayer"

export function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { data: course, isLoading } = useCurriculumDetail(courseId!)
  const { data: employee } = useCurrentEmployee()
  const { data: courseProgress } = useCourseProgress(courseId!)
  const { data: completedLessonIds } = useLessonCompletionMap(courseId!)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  const modules = course?.modules ?? []
  const allLessons = modules.flatMap((m: any) => m.lessons ?? []) as any[]
  const currentLesson =
    allLessons.find((l: any) => l.id === selectedLessonId) ?? allLessons[0]
  const currentIndex = allLessons.findIndex(
    (l: any) => l.id === currentLesson?.id
  )

  // Build a Set of completed lesson IDs from the progress query
  // useCourseProgress returns per-lesson data with progress_records embedded
  // We need a dedicated query for the lesson-level completion map
  // For now we use the courseProgress percentage to show a global bar,
  // and rely on LessonPlayer invalidating course-progress on mark-complete
  // so the progress bar updates. Sidebar checkmarks require the per-lesson map.

  function SidebarContent({ onSelect }: { onSelect?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        {/* Course header */}
        <div className="border-b p-4">
          <h2 className="text-sm leading-snug font-semibold">
            {course?.title}
          </h2>
          {courseProgress && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {courseProgress.completedLessons}/
                  {courseProgress.totalLessons} lessons
                </span>
                <span className="font-medium">
                  {courseProgress.percentage}%
                </span>
              </div>
              <Progress value={courseProgress.percentage} className="h-1.5" />
            </div>
          )}
          {courseProgress?.percentage === 100 && (
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                Course completed!
              </span>
            </div>
          )}
        </div>

        {/* Module + lesson list */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array(5)
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
            <div className="space-y-4">
              {modules.map((module: any, mIdx: number) => (
                <div key={module.id}>
                  <p className="mb-1.5 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {mIdx + 1}. {module.title}
                  </p>
                  <div className="space-y-0.5">
                    {(module.lessons ?? []).map((lesson: any, lIdx: number) => {
                      const isActive = currentLesson?.id === lesson.id
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLessonId(lesson.id)
                            onSelect?.()
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className="shrink-0">
                            {completedLessonIds?.has(lesson.id) ? (
                              <CheckCircle2
                                className={`h-3.5 w-3.5 ${
                                  isActive
                                    ? "text-primary-foreground"
                                    : "text-green-500"
                                }`}
                              />
                            ) : (
                              <Circle
                                className={`h-3.5 w-3.5 ${
                                  isActive
                                    ? "text-primary-foreground/60"
                                    : "text-muted-foreground"
                                }`}
                              />
                            )}
                          </span>
                          <span className="truncate">
                            {lIdx + 1}. {lesson.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex items-center gap-4 border-b p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-72 border-r md:block">
            <div className="space-y-3 p-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-4 aspect-video w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Course not found</p>
        <Button onClick={() => navigate("/", { state: { tab: "training" } })}>
          Back to Training
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => navigate("/", { state: { tab: "training" } })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Mobile sheet trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{course.title}</h1>
          {courseProgress && (
            <p className="text-xs text-muted-foreground">
              {courseProgress.completedLessons} of {courseProgress.totalLessons}{" "}
              lessons complete
            </p>
          )}
        </div>

        <Badge
          variant={course.is_published ? "default" : "secondary"}
          className="shrink-0 text-xs"
        >
          {course.is_published ? "Published" : "Draft"}
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden w-72 shrink-0 overflow-hidden border-r bg-muted/20 md:flex md:flex-col">
          <SidebarContent />
        </div>

        {/* Main player */}
        <div className="flex-1 overflow-hidden">
          {allLessons.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <p className="text-lg font-medium">
                No lessons in this course yet
              </p>
              <p className="text-sm">
                Check back later or contact your instructor.
              </p>
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
