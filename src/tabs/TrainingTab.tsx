import { useState } from "react"
import { format } from "date-fns"
import { Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  useCurrentEmployee,
  useMyTrainingRecord,
  useCurriculumDetail,
  // useMyCertifications,
  useCourseProgress,
} from "@/lib/queries"
import type { TrainingRecord } from "@/lib/supabase"
import { CoursesPanel } from "@/components/training/CoursesPanel"
import { LessonPlayer } from "@/components/training/LessonPlayer"

// Course Detail
function CourseDetail({
  curriculumId,
  onClose,
}: {
  curriculumId: string
  onClose: () => void
}) {
  const { data: course, isLoading } = useCurriculumDetail(curriculumId)
  const { data: employee } = useCurrentEmployee()
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  if (isLoading || !course)
    return <div className="p-12 text-center">Loading course...</div>

  const modules = course.modules || []
  const allLessons = modules.flatMap((m: any) => m.lessons || [])

  const currentIndex = allLessons.findIndex(
    (l: any) => l.id === selectedLessonId
  )
  const currentLesson = allLessons[currentIndex]

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="flex w-full max-w-6xl flex-col p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{course.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 overflow-y-auto border-r bg-muted/30 p-4">
            <h4 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              COURSE CONTENT
            </h4>
            {modules.map((module: any) => (
              <div key={module.id} className="mb-6">
                <p className="mb-2 text-sm font-semibold">{module.title}</p>
                <div className="space-y-1">
                  {(module.lessons || []).map((lesson: any) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                        selectedLessonId === lesson.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-background"
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      <span className="flex-1 truncate text-sm">
                        {lesson.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Main Player Area */}
          <div className="flex flex-1 flex-col">
            {currentLesson ? (
              <LessonPlayer
                lesson={currentLesson}
                courseId={curriculumId}
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
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                Select a lesson from the left sidebar to start
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// My Training Panel
function MyTrainingPanel({
  onCourseClick,
}: {
  onCourseClick: (id: string) => void
}) {
  const { data: records = [], isLoading } = useMyTrainingRecord()
  // const { data: certs = [], isLoading: certsLoading } = useMyCertifications()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading
        ? Array(6)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
        : records.map((record: TrainingRecord) => {
            const { data: progress } = useCourseProgress(record.curriculum_id)

            return (
              <Card
                key={record.curriculum_id}
                className="group cursor-pointer transition-all hover:shadow-xl"
                onClick={() => onCourseClick(record.curriculum_id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">
                        {record.curriculum_title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Due {format(new Date(record.due_date), "MMM d, yyyy")}
                      </p>
                    </div>

                    {/* Progress Ring */}
                    <div className="relative size-14">
                      <svg className="size-14 -rotate-90" viewBox="0 0 42 42">
                        <circle
                          cx="21"
                          cy="21"
                          r="15"
                          fill="none"
                          stroke="#e5e5e5"
                          strokeWidth="5"
                        />
                        <circle
                          cx="21"
                          cy="21"
                          r="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeDasharray={`${progress?.percentage || 0} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {progress?.percentage || 0}%
                      </div>
                    </div>
                  </div>

                  <Badge className="mt-6" variant="outline">
                    {record.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}

      {/* Certifications section remains the same */}
    </div>
  )
}
export function TrainingTab() {
  const { data: employee } = useCurrentEmployee()
  const isInstructorOrAdmin =
    employee?.role === "employer" || employee?.role === "admin"
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Hub</h1>
        <p className="text-muted-foreground">
          {isInstructorOrAdmin
            ? "Manage courses and team learning"
            : "Continue your learning journey"}
        </p>
      </div>

      <Tabs defaultValue="my-training">
        <TabsList>
          <TabsTrigger value="my-training">My Training</TabsTrigger>
          {isInstructorOrAdmin && (
            <TabsTrigger value="team">Team Progress</TabsTrigger>
          )}
          {isInstructorOrAdmin && (
            <TabsTrigger value="courses">Manage Courses</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-training" className="mt-6">
          <MyTrainingPanel onCourseClick={setSelectedCourseId} />
        </TabsContent>

        {isInstructorOrAdmin && (
          <TabsContent value="courses" className="mt-6">
            <CoursesPanel employee={employee!} />
          </TabsContent>
        )}
      </Tabs>

      {selectedCourseId && (
        <CourseDetail
          curriculumId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </div>
  )
}
