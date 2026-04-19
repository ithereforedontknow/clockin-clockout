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
  }

  async function handleSubmit() {
    if (!categoryId || !startDate || !endDate || !employeeId) {
      toast.error("Please fill in all required fields")
      return
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after start date")
      return
    }
    if (weekdayCount === 0) {
      toast.error("No weekdays in selected range", {
        description: "Please choose dates that include at least one weekday.",
      })
      return
    }
    if (available !== null && weekdayCount > available) {
      toast.warning("Insufficient balance", {
        description: `${available} ${unit} available, ${weekdayCount} requested.`,
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
    toast.success("Request submitted", {
      description: "Your manager will be notified to review.",
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            Request Time Off
          </DialogTitle>
          <DialogDescription>
            Weekends are excluded from the day count automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type…" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((b) => (
                  <SelectItem key={b.category_id} value={b.category_id}>
                    <span>{b.category?.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({(b.balance - b.scheduled).toFixed(1)} {b.category?.unit}{" "}
                      left)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Start <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) setEndDate(e.target.value)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                End <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          {categoryId && startDate && endDate && (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Weekdays requested
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${weekdayCount === 0 ? "text-destructive" : "text-primary"}`}
              >
                {weekdayCount} {unit}
                {weekdayCount === 0 && (
                  <span className="ml-1 text-xs font-normal">(none)</span>
                )}
              </span>
            </div>
          )}

          {/* Note */}
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
