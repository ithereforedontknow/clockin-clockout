import { useState } from "react"
import DOMPurify from "dompurify"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Video,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useMarkLessonComplete, useCourseProgress } from "@/lib/queries"

interface LessonPlayerProps {
  lesson: any
  courseId: string
  employee: any // needed for user_id
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

  const handleMarkComplete = async () => {
    if (!employee?.user_id || !lesson?.id) return

    await markComplete.mutateAsync({
      user_id: employee.user_id,
      lesson_id: lesson.id,
    })

    toast.success("Lesson marked complete!")
    onNext?.()
  }

  const handleQuizSubmit = () => {
    setQuizSubmitted(true)
    toast.success("Quiz submitted!")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
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
        {courseProgress && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span>Course Progress</span>
              <span className="font-medium">{courseProgress.percentage}%</span>
            </div>
            <Progress value={courseProgress.percentage} className="h-1.5" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto max-w-3xl space-y-10">
          {/* Cloudflare Video */}
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

          {/* Rich Text Content */}
          {lesson.content_html && (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(lesson.content_html),
              }}
            />
          )}

          {/* Quiz */}
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
                        className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 hover:bg-muted/50"
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

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t bg-background p-4">
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

        <Button
          onClick={handleMarkComplete}
          disabled={lesson.quiz && !quizSubmitted}
          size="lg"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark Lesson Complete
        </Button>
      </div>
    </div>
  )
}
