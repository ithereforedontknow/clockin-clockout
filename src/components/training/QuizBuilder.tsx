import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  const setCorrect = (qi: number, oi: number) =>
    update(
      questions.map((q, i) => (i === qi ? { ...q, correct_index: oi } : q))
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Quiz Questions</label>
        <Button size="sm" variant="outline" onClick={addQuestion}>
          <Plus className="mr-1 h-3 w-3" /> Add Question
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">No quiz questions yet.</p>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-3 rounded-lg border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Question text"
              value={q.question}
              onChange={(e) => setQuestionText(qi, e.target.value)}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeQuestion(qi)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correct_index === oi}
                  onChange={() => setCorrect(qi, oi)}
                  title="Mark as correct answer"
                />
                <Input
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => setOption(qi, oi, e.target.value)}
                  className={q.correct_index === oi ? "border-green-500" : ""}
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => addOption(qi)}
            >
              <Plus className="mr-1 h-3 w-3" /> Add Option
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Select the radio button next to the correct answer.
          </p>
        </div>
      ))}
    </div>
  )
}
