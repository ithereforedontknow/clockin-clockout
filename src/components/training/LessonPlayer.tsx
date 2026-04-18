import { useState, useEffect, useRef } from "react"
import DOMPurify from "dompurify"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Video,
  HelpCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  useMarkLessonComplete,
  useCourseProgress,
  useUpdateLessonProgress,
} from "@/lib/queries"

interface LessonPlayerProps {
  lesson: any
  courseId: string
  employee: any
  onNext?: () => void
  onPrev?: () => void
}

export function LessonPlayer({
  lesson,
  courseId,
  employee,
  onNext,
  onPrev,
}: LessonPlayerProps) {
  const markComplete = useMarkLessonComplete()
  const { data: courseProgress } = useCourseProgress(courseId)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<{
    correct: number
    total: number
  } | null>(null)

  const updateProgress = useUpdateLessonProgress()
  const lastSavedPercent = useRef(0)

  const hasQuiz = (lesson.quiz?.questions?.length ?? 0) > 0
  const allAnswered =
    hasQuiz && Object.keys(quizAnswers).length === lesson.quiz.questions.length
  const passedQuiz =
    !hasQuiz ||
    (quizSubmitted && (quizScore?.correct ?? 0) === (quizScore?.total ?? 1))

  const handleMarkComplete = async () => {
    if (!employee?.id || !lesson?.id) return
    await markComplete.mutateAsync({
      employee_id: employee.id,
      lesson_id: lesson.id,
    })
    toast.success("Lesson complete!")
    onNext?.()
  }

  const handleQuizSubmit = () => {
    const questions = lesson.quiz?.questions ?? []
    const correct = questions.filter(
      (q: any, i: number) => quizAnswers[i] === q.correct_index
    ).length
    setQuizScore({ correct, total: questions.length })
    setQuizSubmitted(true)
    if (correct === questions.length) {
      toast.success(`Perfect score — ${correct}/${questions.length}`)
    } else {
      toast.error(`${correct}/${questions.length} correct`)
    }
  }

  useEffect(() => {
    if (!lesson.cf_stream_id) return
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== "https://iframe.videodelivery.net") return
      const { event, videoState } = e.data ?? {}
      if (event === "timeupdate" && videoState?.duration > 0) {
        const pct = Math.round(
          (videoState.currentTime / videoState.duration) * 100
        )
        if (pct >= lastSavedPercent.current + 10) {
          lastSavedPercent.current = pct
          updateProgress.mutate({
            employee_id: employee.id,
            lesson_id: lesson.id,
            percent_watched: pct,
            is_completed: pct >= 90,
          })
        }
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [lesson.cf_stream_id, lesson.id, employee?.id])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl leading-tight font-semibold">
              {lesson.title}
            </h2>
            {lesson.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {lesson.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 gap-1.5">
            <Video className="h-3 w-3" />
            Lesson
          </Badge>
        </div>

        {courseProgress && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Course Progress</span>
              <span className="font-semibold text-foreground tabular-nums">
                {courseProgress.percentage}%
              </span>
            </div>
            <Progress value={courseProgress.percentage} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto max-w-3xl space-y-10 p-6">
          {/* Video */}
          {lesson.cf_stream_id && (
            <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
              <div className="aspect-video">
                {lesson.cf_stream_status === "ready" ||
                !lesson.cf_stream_status ? (
                  <iframe
                    src={`https://iframe.videodelivery.net/${lesson.cf_stream_id}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : lesson.cf_stream_status === "error" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm font-medium">
                      Video failed to process
                    </p>
                    <p className="text-xs">Contact your administrator</p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">Video is processing…</p>
                    <p className="text-xs">Check back in a few minutes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rich text */}
          {lesson.content_html && (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(lesson.content_html),
              }}
            />
          )}

          {/* Quiz */}
          {hasQuiz && (
            <div className="rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b px-6 py-4">
                <HelpCircle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Knowledge Check</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {lesson.quiz.questions.length} question
                  {lesson.quiz.questions.length > 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-6 p-6">
                {lesson.quiz.questions.map((q: any, qIndex: number) => (
                  <div key={qIndex}>
                    <p className="mb-3 text-sm font-medium">
                      <span className="mr-2 text-muted-foreground">
                        {qIndex + 1}.
                      </span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option: string, oIndex: number) => {
                        const isSelected = quizAnswers[qIndex] === oIndex
                        const isCorrect =
                          quizSubmitted && oIndex === q.correct_index
                        const isWrong =
                          quizSubmitted &&
                          isSelected &&
                          oIndex !== q.correct_index

                        return (
                          <label
                            key={oIndex}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-colors hover:bg-muted/50 ${
                              isCorrect
                                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                                : isWrong
                                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                                  : isSelected
                                    ? "border-primary/30 bg-primary/5"
                                    : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${qIndex}`}
                              checked={isSelected}
                              disabled={quizSubmitted}
                              onChange={() =>
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [qIndex]: oIndex,
                                }))
                              }
                              className="accent-primary"
                            />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {!quizSubmitted ? (
                  <Button
                    onClick={handleQuizSubmit}
                    disabled={!allAnswered}
                    className="w-full"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <div className="rounded-lg border bg-muted/40 p-4 text-center">
                    <p className="font-semibold">
                      Score: {quizScore?.correct}/{quizScore?.total}
                    </p>
                    {(quizScore?.correct ?? 0) < (quizScore?.total ?? 1) && (
                      <button
                        className="mt-2 text-sm text-primary underline-offset-2 hover:underline"
                        onClick={() => {
                          setQuizSubmitted(false)
                          setQuizAnswers({})
                          setQuizScore(null)
                        }}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between border-t bg-background px-6 py-4">
        <div className="flex gap-2">
          {onPrev && (
            <Button variant="outline" size="sm" onClick={onPrev}>
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Previous
            </Button>
          )}
          {onNext && (
            <Button variant="outline" size="sm" onClick={onNext}>
              Next
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          onClick={handleMarkComplete}
          disabled={markComplete.isPending || !passedQuiz}
          size="sm"
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {markComplete.isPending ? "Marking…" : "Mark Complete"}
        </Button>
      </div>
    </div>
  )
}
