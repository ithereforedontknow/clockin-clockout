import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Menu,
  CheckCircle2,
  Circle,
  Trophy,
  Layout,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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

  const allLessons = useMemo(
    () => course?.modules?.flatMap((m: any) => m.lessons ?? []) ?? [],
    [course]
  )
  const currentLesson =
    allLessons.find((l: any) => l.id === selectedLessonId) ?? allLessons[0]
  const currentIndex = allLessons.findIndex(
    (l: any) => l.id === currentLesson?.id
  )

  function SidebarContent({ onSelect }: { onSelect?: () => void }) {
    return (
      <div className="flex h-full flex-col bg-card">
        {/* Progress Header - Fixed at top of sidebar */}
        <div className="shrink-0 space-y-4 border-b bg-muted/10 p-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              Curriculum
            </p>
            <h2 className="line-clamp-2 text-sm leading-tight font-bold">
              {course?.title}
            </h2>
          </div>
          {courseProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                <span className="tabular-nums">
                  {courseProgress.completedLessons} /{" "}
                  {courseProgress.totalLessons} Lessons
                </span>
                <span className="text-primary">
                  {courseProgress.percentage}%
                </span>
              </div>
              <Progress
                value={courseProgress.percentage}
                className="h-1.5 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Scalable Lesson Tree - Scrollable internally */}
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4 pb-10">
            {course?.modules?.map((module: any, mIdx: number) => (
              <div key={module.id} className="space-y-2">
                <h3 className="px-2 text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                  {String(mIdx + 1).padStart(2, "0")} — {module.title}
                </h3>
                <div className="space-y-1">
                  {module.lessons?.map((lesson: any) => {
                    const isActive = currentLesson?.id === lesson.id
                    const isDone = completedLessonIds?.has(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setSelectedLessonId(lesson.id)
                          onSelect?.()
                        }}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                          isActive
                            ? "scale-[1.02] bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="shrink-0">
                          {isDone ? (
                            <CheckCircle2
                              className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-emerald-500"}`}
                            />
                          ) : (
                            <Circle
                              className={`h-4 w-4 opacity-20 group-hover:opacity-40`}
                            />
                          )}
                        </div>
                        <span className="truncate text-xs font-bold">
                          {lesson.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {courseProgress?.percentage === 100 && (
          <div className="flex shrink-0 items-center gap-3 border-t border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
            <Trophy className="h-5 w-5" />
            <span className="text-[10px] font-black tracking-widest uppercase">
              Course Completed
            </span>
          </div>
        )}
      </div>
    )
  }

  if (isLoading)
    return (
      <div className="flex h-screen animate-pulse items-center justify-center text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
        Entering Classroom...
      </div>
    )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Universal Player Header - Fixed at top */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted"
            onClick={() => navigate("/training")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-xs font-black tracking-widest text-muted-foreground/60 uppercase">
              {course?.title}
            </h1>
            <p className="mt-0.5 truncate text-sm leading-none font-bold text-foreground">
              {currentLesson?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-bold tracking-widest uppercase md:hidden"
              >
                <Menu className="mr-2 h-3.5 w-3.5" /> Curriculum
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Badge
            variant="outline"
            className="hidden border-primary/20 bg-primary/5 text-[10px] font-black tracking-tighter text-primary uppercase sm:flex"
          >
            <Layout className="mr-1.5 h-3 w-3" /> Study Mode
          </Badge>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop Navigation - Independent Scroll */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-hidden border-r md:flex">
          <SidebarContent />
        </aside>

        {/* Active Content Area - Independent Scroll (handled inside LessonPlayer) */}
        <main className="min-h-0 flex-1 overflow-auto bg-muted/5">
          {allLessons.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Circle className="mb-4 h-12 w-12 text-muted-foreground/20" />
              <p className="text-lg font-bold">No content available</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                This course hasn't been populated with lessons yet.
              </p>
            </div>
          ) : (
            <LessonPlayer
              lesson={currentLesson}
              courseId={course!.id}
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
        </main>
      </div>
    </div>
  )
}
