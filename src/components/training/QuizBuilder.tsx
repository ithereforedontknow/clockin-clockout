import { useState } from "react"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function QuizBuilder({ quiz, onSave }: any) {
  const [questions, setQuestions] = useState(quiz?.questions ?? [])

  const update = (updated: any[]) => {
    setQuestions(updated)
    onSave({ questions: updated })
  }
  const addQuestion = () =>
    update([
      ...questions,
      { question: "", options: ["", ""], correct_index: 0 },
    ])
  const removeQuestion = (qi: number) =>
    update(questions.filter((_: any, i: number) => i !== qi))

  const setQuestionText = (qi: number, text: string) =>
    update(
      questions.map((x: any, i: number) =>
        i === qi ? { ...x, question: text } : x
      )
    )

  const setOption = (qi: number, oi: number, text: string) =>
    update(
      questions.map((x: any, i: number) =>
        i === qi
          ? {
              ...x,
              options: x.options.map((o: any, j: number) =>
                j === oi ? text : o
              ),
            }
          : x
      )
    )

  const addOption = (qi: number) =>
    update(
      questions.map((x: any, i: number) =>
        i === qi ? { ...x, options: [...x.options, ""] } : x
      )
    )

  const removeOption = (qi: number, oi: number) =>
    update(
      questions.map((x: any, i: number) =>
        i === qi
          ? {
              ...x,
              options: x.options.filter((_: any, j: number) => j !== oi),
              correct_index:
                x.correct_index >= oi
                  ? Math.max(0, x.correct_index - 1)
                  : x.correct_index,
            }
          : x
      )
    )

  const setCorrect = (qi: number, oi: number) =>
    update(
      questions.map((x: any, i: number) =>
        i === qi ? { ...x, correct_index: oi } : x
      )
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Evaluation Quiz
        </label>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs font-bold"
          onClick={addQuestion}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background/50 p-8 text-center">
          <p className="text-xs font-medium text-muted-foreground italic">
            No quiz attached to this lesson.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q: any, qi: number) => (
            <div
              key={qi}
              className="overflow-hidden rounded-xl border bg-background shadow-sm"
            >
              <div className="flex items-center gap-3 border-b bg-muted/30 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-black text-muted-foreground">
                  {qi + 1}
                </span>
                <Input
                  placeholder="Enter the question..."
                  value={q.question}
                  onChange={(e) => setQuestionText(qi, e.target.value)}
                  className="flex-1 border-none bg-transparent px-0 font-bold shadow-none focus-visible:ring-0"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeQuestion(qi)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 p-4">
                {q.options.map((opt: string, oi: number) => (
                  <div
                    key={oi}
                    className={`flex items-center gap-3 rounded-lg border p-2 transition-colors ${q.correct_index === oi ? "border-emerald-200 bg-emerald-50/50" : "bg-muted/10"}`}
                  >
                    <button
                      onClick={() => setCorrect(qi, oi)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${q.correct_index === oi ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30"}`}
                    >
                      {q.correct_index === oi && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                    </button>
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => setOption(qi, oi, e.target.value)}
                      className="h-8 flex-1 border-none bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                    />
                    {q.options.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground/50 hover:text-destructive"
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
                  className="mt-2 h-7 text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                  onClick={() => addOption(qi)}
                >
                  <Plus className="mr-1.5 h-3 w-3" /> Add Option
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
