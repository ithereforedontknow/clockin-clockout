import { useState } from "react"
import DOMPurify from "dompurify"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useMarkLessonComplete, useCourseProgress } from "@/lib/queries"

export function LessonPlayer({
  lesson,
  courseId,
  employee,
  onNext,
  onPrev,
}: any) {
  const markComplete = useMarkLessonComplete()
  const { data: courseProgress } = useCourseProgress(courseId)

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null
  )

  const questions = lesson.quiz?.questions ?? []
  const hasQuiz = questions.length > 0
  const allAnswered =
    hasQuiz && Object.keys(quizAnswers).length === questions.length
  const passedQuiz =
    !hasQuiz || (quizSubmitted && score?.correct === score?.total)

  // CF Stream Tracking logic stays the same...

  const handleQuizSubmit = () => {
    const correct = questions.filter(
      (q: any, i: number) => quizAnswers[i] === q.correct_index
    ).length
    setScore({ correct, total: questions.length })
    setQuizSubmitted(true)
    if (correct === questions.length) toast.success(`Perfect score!`)
    else
      toast.error(
        `You got ${correct} out of ${questions.length} correct. Try again.`
      )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 flex-col gap-4 border-b bg-card px-8 py-5">
        <h2 className="text-2xl font-black tracking-tight">{lesson.title}</h2>
        {courseProgress && (
          <div className="flex max-w-md items-center gap-4">
            <span className="text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
              Course Progress
            </span>
            <Progress
              value={courseProgress.percentage}
              className="h-2 flex-1"
            />
            <span className="text-xs font-bold tabular-nums">
              {courseProgress.percentage}%
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl space-y-12 p-8 pb-32">
          {lesson.cf_stream_id && (
            <div className="overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-border">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://iframe.videodelivery.net/${lesson.cf_stream_id}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {lesson.content_html && (
            <div
              className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-a:text-primary max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(lesson.content_html),
              }}
            />
          )}

          {hasQuiz && (
            <div className="mt-10 border-t pt-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Knowledge Check
                  </h3>
                  <p className="mt-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                    Answer all {questions.length} questions to proceed
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {questions.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className="space-y-4 rounded-2xl border bg-muted/20 p-6"
                  >
                    <p className="text-sm leading-relaxed font-bold">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((opt: string, oIdx: number) => {
                        const isSelected = quizAnswers[qIdx] === oIdx
                        const isCorrect =
                          quizSubmitted && oIdx === q.correct_index
                        const isWrong =
                          quizSubmitted && isSelected && !isCorrect

                        return (
                          <label
                            key={oIdx}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                : isWrong
                                  ? "border-red-500 bg-red-50 text-red-900"
                                  : isSelected
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border bg-card hover:border-primary/50"
                            } `}
                          >
                            <input
                              type="radio"
                              name={`q-${qIdx}`}
                              checked={isSelected}
                              disabled={quizSubmitted}
                              onChange={() =>
                                setQuizAnswers((p) => ({ ...p, [qIdx]: oIdx }))
                              }
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="text-sm font-medium">{opt}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {!quizSubmitted ? (
                  <Button
                    size="lg"
                    className="h-12 w-full font-bold shadow-md"
                    disabled={!allAnswered}
                    onClick={handleQuizSubmit}
                  >
                    Submit Answers
                  </Button>
                ) : (
                  <div
                    className={`rounded-2xl border p-6 text-center ${score?.correct === questions.length ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
                  >
                    <p className="text-xl font-black">
                      Score: {score?.correct} / {questions.length}
                    </p>
                    {score?.correct !== questions.length && (
                      <Button
                        variant="outline"
                        className="mt-4 bg-white font-bold"
                        onClick={() => {
                          setQuizSubmitted(false)
                          setQuizAnswers({})
                        }}
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex shrink-0 items-center justify-between border-t bg-card px-8 py-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex gap-2">
          {onPrev && (
            <Button
              variant="outline"
              size="sm"
              className="font-bold"
              onClick={onPrev}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
          )}
          {onNext && (
            <Button
              variant="outline"
              size="sm"
              className="font-bold"
              onClick={onNext}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          onClick={() => {
            markComplete.mutate({
              employee_id: employee.id,
              lesson_id: lesson.id,
            })
            toast.success("Lesson Complete")
            onNext?.()
          }}
          disabled={markComplete.isPending || !passedQuiz}
          className="font-bold shadow-md"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Complete
        </Button>
      </div>
    </div>
  )
}
