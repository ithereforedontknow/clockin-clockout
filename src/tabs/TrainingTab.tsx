import { useState } from "react"
import { format } from "date-fns"
import {
  CheckCircle2,
  Play,
  ChevronLeft,
  ChevronRight,
  Video,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useCurrentEmployee,
  useMyTrainingRecord,
  useCurriculumDetail,
  useMyCertifications,
} from "@/lib/queries"
import type { Lesson, TrainingRecord, Certification } from "@/lib/supabase"
import { CoursesPanel } from "@/components/training/CoursesPanel"
// Lesson Player
interface LessonPlayerProps {
  lesson: Lesson & { content_html?: string; quiz?: any }
  onComplete: () => void
  onNext?: () => void
  onPrev?: () => void
}

function LessonPlayer({
  lesson,
  onComplete,
  onNext,
  onPrev,
}: LessonPlayerProps) {
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const handleQuizSubmit = () => {
    setQuizSubmitted(true)
    toast.success("Quiz submitted!")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{lesson.title}</h2>
            {lesson.description && (
              <p className="mt-1 text-muted-foreground">{lesson.description}</p>
            )}
          </div>
          <Badge variant="outline">
            <Video className="mr-1 h-3 w-3" /> Lesson
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-10">
          {lesson.cf_stream_id && (
            <div className="aspect-video overflow-hidden rounded-2xl border bg-black">
              <iframe
                src={`https://iframe.videodelivery.net/${lesson.cf_stream_id}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {lesson.content_html && (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: lesson.content_html }}
            />
          )}

          {lesson.quiz?.questions?.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-6 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Knowledge Check</h3>
              </div>
              {lesson.quiz.questions.map((q: any, qIndex: number) => (
                <div key={qIndex} className="mb-8">
                  <p className="mb-3 font-medium">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option: string, oIndex: number) => (
                      <label
                        key={oIndex}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border p-4"
                      >
                        <input
                          type="radio"
                          name={`q-${qIndex}`}
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={() =>
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [qIndex]: oIndex,
                            }))
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                onClick={handleQuizSubmit}
                disabled={quizSubmitted}
                className="w-full"
              >
                {quizSubmitted ? "Submitted ✓" : "Submit Quiz"}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-between border-t p-4">
        <div className="flex gap-2">
          {onPrev && (
            <Button variant="outline" onClick={onPrev}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
          {onNext && (
            <Button variant="outline" onClick={onNext}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={onComplete} disabled={lesson.quiz && !quizSubmitted}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark Complete
        </Button>
      </div>
    </div>
  )
}

// Course Detail
function CourseDetail({
  curriculumId,
  onClose,
}: {
  curriculumId: string
  onClose: () => void
}) {
  const { data: course, isLoading } = useCurriculumDetail(curriculumId)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  if (isLoading || !course)
    return <div className="p-12 text-center">Loading...</div>

  const modules = course.modules || []
  const allLessons = modules.flatMap((m: any) => m.lessons || [])

  const currentIndex = allLessons.findIndex(
    (l: any) => l.id === selectedLessonId
  )
  const currentLesson = allLessons[currentIndex]

  const handleComplete = () => {
    toast.success("Lesson completed!")
    if (currentIndex < allLessons.length - 1) {
      setSelectedLessonId(allLessons[currentIndex + 1].id)
    }
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="flex w-full max-w-6xl flex-col p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{course.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-72 overflow-y-auto border-r bg-muted/30 p-4">
            <h4 className="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              CONTENT
            </h4>
            {modules.map((module: any) => (
              <div key={module.id} className="mb-6">
                <p className="mb-2 text-sm font-semibold">{module.title}</p>
                <div className="space-y-1">
                  {(module.lessons || []).map((lesson: Lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${
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

          <div className="flex flex-1 flex-col">
            {currentLesson ? (
              <LessonPlayer
                lesson={currentLesson as any}
                onComplete={handleComplete}
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
                Select a lesson from the left sidebar
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
  const { data: certs = [], isLoading: certsLoading } = useMyCertifications()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading
        ? Array(6)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
        : records.map((record: TrainingRecord) => (
            <Card
              key={record.curriculum_id}
              className="cursor-pointer transition-all hover:shadow-xl"
              onClick={() => onCourseClick(record.curriculum_id)}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">
                  {record.curriculum_title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Due {format(new Date(record.due_date), "MMM d, yyyy")}
                </p>
                <Badge className="mt-6" variant="outline">
                  {record.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}

      {!certsLoading && certs.length > 0 && (
        <div className="col-span-full mt-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Certifications
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {certs.map((cert: Certification) => (
              <Card key={cert.id}>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                  <p className="mt-4 font-medium">{cert.curriculum_id}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TeamProgressPanel() {
  return (
    <div className="p-8 text-center text-muted-foreground">
      Team Progress Panel (to be implemented)
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
            ? "Manage training content and team progress"
            : "Your learning journey"}
        </p>
      </div>

      <Tabs defaultValue="my-training">
        <TabsList>
          <TabsTrigger value="my-training">My Training</TabsTrigger>
          {isInstructorOrAdmin && (
            <TabsTrigger value="team">Team Progress</TabsTrigger>
          )}
          {isInstructorOrAdmin && (
            <TabsTrigger value="courses">Courses</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-training" className="mt-6">
          <MyTrainingPanel onCourseClick={setSelectedCourseId} />
        </TabsContent>

        {isInstructorOrAdmin && (
          <TabsContent value="team" className="mt-6">
            <TeamProgressPanel />
          </TabsContent>
        )}

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
