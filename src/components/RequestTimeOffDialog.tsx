import { useState } from "react"
import { Loader2, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useTimeOffBalances,
  useRequestTimeOff,
  useCurrentEmployee,
} from "@/lib/queries"
import { countWeekdays } from "@/lib/supabase"
import { requestTimeOffSchema } from "@/lib/schemas"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestTimeOffDialog({ open, onOpenChange }: Props) {
  const { data: employee } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""
  const { data: balances = [] } = useTimeOffBalances(employeeId)
  const requestTimeOff = useRequestTimeOff()

  const today = new Date().toISOString().slice(0, 10)
  const [categoryId, setCategoryId] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedBalance = balances.find((b) => b.category_id === categoryId)
  const weekdayCount =
    startDate && endDate ? countWeekdays(startDate, endDate) : 0
  const unit = selectedBalance?.category?.unit ?? "days"
  const available = selectedBalance
    ? selectedBalance.balance - selectedBalance.scheduled
    : null

  function reset() {
    setCategoryId("")
    setStartDate(today)
    setEndDate(today)
    setNote("")
    setErrors({})
  }

  async function handleSubmit() {
    const result = requestTimeOffSchema.safeParse({
      category_id: categoryId,
      start_date: startDate,
      end_date: endDate,
      note,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((e) => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message
      })
      setErrors(fieldErrors)
      return
    }

    if (!employeeId) {
      toast.error("Not authenticated")
      return
    }

    if (weekdayCount === 0) {
      setErrors({ end_date: "Selected range has no weekdays" })
      return
    }

    if (available !== null && weekdayCount > available) {
      toast.warning("Insufficient balance", {
        description: `You have ${available} ${unit} available but requested ${weekdayCount}.`,
      })
    }

    await requestTimeOff.mutateAsync({
      employee_id: employeeId,
      category_id: categoryId,
      start_date: startDate,
      end_date: endDate,
      amount: weekdayCount,
      note: note || null,
    })

    toast.success("Time off request submitted!", {
      description: "Your employer will be notified to review your request.",
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Request Time Off
          </DialogTitle>
          <DialogDescription>
            Weekends are excluded automatically from the day count.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              Time Off Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v)
                setErrors((e) => ({ ...e, category_id: "" }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((b) => (
                  <SelectItem key={b.category_id} value={b.category_id}>
                    {b.category?.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({(b.balance - b.scheduled).toFixed(1)} {b.category?.unit}{" "}
                      available)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) setEndDate(e.target.value)
                  setErrors((er) => ({ ...er, start_date: "" }))
                }}
              />
              {errors.start_date && (
                <p className="text-xs text-destructive">{errors.start_date}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setErrors((er) => ({ ...er, end_date: "" }))
                }}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive">{errors.end_date}</p>
              )}
            </div>
          </div>

          {categoryId && startDate && endDate && (
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                weekdayCount === 0
                  ? "border-destructive/20 bg-destructive/5"
                  : "border-primary/10 bg-primary/5"
              }`}
            >
              <span className="text-muted-foreground">Weekdays requested</span>
              <span
                className={`font-semibold ${weekdayCount === 0 ? "text-destructive" : "text-primary"}`}
              >
                {weekdayCount} {unit}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Reason for time off…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              requestTimeOff.isPending || !categoryId || weekdayCount === 0
            }
            onClick={handleSubmit}
          >
            {requestTimeOff.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
