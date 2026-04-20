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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[480px]">
        <DialogHeader className="shrink-0 border-b bg-muted/20 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Request Time Off
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black tracking-widest uppercase opacity-60">
                New Absence Entitlement
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Absence Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-11 font-bold">
                <SelectValue placeholder="Choose leave type..." />
              </SelectTrigger>
              <SelectContent>
                {balances.map((b) => (
                  <SelectItem key={b.category_id} value={b.category_id}>
                    <div className="flex w-64 items-center justify-between">
                      <span className="font-bold">{b.category?.name}</span>
                      <span className="text-[10px] uppercase opacity-50">
                        {(b.balance - b.scheduled).toFixed(1)}{" "}
                        {b.category?.unit} available
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                min={today}
                className="h-10 font-medium"
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                className="h-10 font-medium"
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black tracking-widest text-primary/60 uppercase">
                Total Calculation
              </p>
              <p className="text-xs font-bold text-primary">
                Excludes weekends and holidays
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary tabular-nums">
                {weekdayCount}
              </span>
              <span className="ml-1 text-[10px] font-black text-primary/60 uppercase">
                {unit}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Optional Narrative
            </Label>
            <Textarea
              placeholder="Explain the reason for this request..."
              className="h-20 resize-none text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-muted/30 p-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-bold"
          >
            Discard
          </Button>
          <Button
            className="px-8 font-bold shadow-lg"
            disabled={
              !categoryId || weekdayCount === 0 || requestTimeOff.isPending
            }
            onClick={handleSubmit}
          >
            {requestTimeOff.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
