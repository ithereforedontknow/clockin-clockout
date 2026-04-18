import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Question {
  question: string
  options: string[]
  correct_index: number
}

interface QuizBuilderProps {
  quiz: { questions: Question[] } | null
  onSave: (quiz: { questions: Question[] }) => void
}

const emptyQuestion = (): Question => ({
  question: "",
  options: ["", ""],
  correct_index: 0,
})

export function QuizBuilder({ quiz, onSave }: QuizBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions ?? [])

  const update = (updated: Question[]) => {
    setQuestions(updated)
    onSave({ questions: updated })
  }

  const addQuestion = () => update([...questions, emptyQuestion()])
  const removeQuestion = (qi: number) =>
    update(questions.filter((_, i) => i !== qi))
  const setQuestionText = (qi: number, text: string) =>
    update(questions.map((q, i) => (i === qi ? { ...q, question: text } : q)))
  const setOption = (qi: number, oi: number, text: string) =>
    update(
      questions.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? text : o)) }
          : q
      )
    )
  const addOption = (qi: number) =>
    update(
      questions.map((q, i) =>
        i === qi ? { ...q, options: [...q.options, ""] } : q
      )
    )
  const removeOption = (qi: number, oi: number) =>
    update(
      questions.map((q, i) =>
        i === qi
          ? {
              ...q,
              options: q.options.filter((_, j) => j !== oi),
              correct_index:
                q.correct_index >= oi
                  ? Math.max(0, q.correct_index - 1)
                  : q.correct_index,
            }
          : q
      )
    )
  const setCorrect = (qi: number, oi: number) =>
    update(
      questions.map((q, i) => (i === qi ? { ...q, correct_index: oi } : q))
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Quiz Questions</label>
          {questions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {questions.length}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={addQuestion}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No quiz questions yet.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={addQuestion}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add your first question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border bg-card p-4 shadow-sm">
              {/* Question header */}
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {qi + 1}
                </span>
                <Input
                  placeholder="Enter your question…"
                  value={q.question}
                  onChange={(e) => setQuestionText(qi, e.target.value)}
                  className="flex-1 border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeQuestion(qi)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Options */}
              <div className="space-y-2 pl-8">
                <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Options — select the correct answer
                </p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correct_index === oi}
                      onChange={() => setCorrect(qi, oi)}
                      className="accent-primary"
                      title="Mark as correct"
                    />
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => setOption(qi, oi, e.target.value)}
                      className={`flex-1 text-sm ${
                        q.correct_index === oi
                          ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                          : ""
                      }`}
                    />
                    {q.options.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeOption(qi, oi)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-7 text-xs text-muted-foreground"
                  onClick={() => addOption(qi)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add option
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
