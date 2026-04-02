import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, ClipboardEdit, Info } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { useSubmitCorrection } from "@/lib/queries"
import type { ClockEntry, BreakEntry } from "@/lib/supabase"

interface Props {
  entry: (ClockEntry & { breaks: BreakEntry[] }) | null
  employeeId: string
  onClose: () => void
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(val: string): string {
  return new Date(val).toISOString()
}

export function ClockCorrectionDialog({ entry, employeeId, onClose }: Props) {
  const submitCorrection = useSubmitCorrection()
  const [clockIn, setClockIn] = useState("")
  const [clockOut, setClockOut] = useState("")
  const [breakMinutes, setBreakMinutes] = useState("")
  const [notes, setNotes] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (!entry) return
    setClockIn(entry.clock_in ? toLocalInput(entry.clock_in) : "")
    setClockOut(entry.clock_out ? toLocalInput(entry.clock_out) : "")
    const totalBreakMins = (entry.breaks ?? []).reduce(
      (s, b) => s + (b.duration_minutes ?? 0),
      0
    )
    setBreakMinutes(String(totalBreakMins))
    setNotes(entry.notes ?? "")
    setReason("")
  }, [entry?.id])

  if (!entry) return null

  const originalBreakMins = (entry.breaks ?? []).reduce(
    (s, b) => s + (b.duration_minutes ?? 0),
    0
  )

  const hasChanges =
    (clockIn && clockIn !== toLocalInput(entry.clock_in)) ||
    (clockOut &&
      entry.clock_out &&
      clockOut !== toLocalInput(entry.clock_out)) ||
    parseInt(breakMinutes) !== originalBreakMins ||
    notes !== (entry.notes ?? "")

  const previewWorked = (() => {
    if (!clockIn || !clockOut) return null
    const inMs = new Date(clockIn).getTime()
    const outMs = new Date(clockOut).getTime()
    if (isNaN(inMs) || isNaN(outMs) || outMs <= inMs) return null
    const diff =
      Math.floor((outMs - inMs) / 60000) - (parseInt(breakMinutes) || 0)
    return Math.max(0, diff)
  })()

  async function handleSubmit() {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the correction")
      return
    }
    if (!hasChanges) {
      toast.error("No changes detected")
      return
    }
    if (clockIn && clockOut && new Date(clockOut) <= new Date(clockIn)) {
      toast.error("Clock out must be after clock in")
      return
    }

    await submitCorrection.mutateAsync({
      clock_entry_id: entry?.id ?? "",
      employee_id: employeeId,
      requested_clock_in: clockIn ? fromLocalInput(clockIn) : null,
      requested_clock_out: clockOut ? fromLocalInput(clockOut) : null,
      requested_break_minutes:
        breakMinutes !== "" ? parseInt(breakMinutes) : null,
      requested_notes: notes !== (entry?.notes ?? "") ? notes : null,
      reason: reason.trim(),
    })

    toast.success("Correction request submitted", {
      description: "Your manager will review it shortly.",
    })
    onClose()
  }

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5 text-primary" />
            Request Time Correction
          </DialogTitle>
          <DialogDescription>
            {format(new Date(entry.date), "EEEE, MMMM d, yyyy")} — changes
            require manager approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Original values reference */}
          <div className="space-y-1 rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <Info className="h-3.5 w-3.5" /> Original Entry
            </p>
            <p>
              Clock In:{" "}
              <span className="text-foreground">
                {format(new Date(entry.clock_in), "h:mm a")}
              </span>
            </p>
            {entry.clock_out && (
              <p>
                Clock Out:{" "}
                <span className="text-foreground">
                  {format(new Date(entry.clock_out), "h:mm a")}
                </span>
              </p>
            )}
            <p>
              Break:{" "}
              <span className="text-foreground">{originalBreakMins} min</span>
            </p>
            {entry.total_minutes && (
              <p>
                Worked:{" "}
                <span className="text-foreground">
                  {Math.floor(entry.total_minutes / 60)}h{" "}
                  {entry.total_minutes % 60}m
                </span>
              </p>
            )}
          </div>

          <Separator />

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Clock In</Label>
              <Input
                type="datetime-local"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Clock Out</Label>
              <Input
                type="datetime-local"
                value={clockOut}
                min={clockIn}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Break Duration (minutes)</Label>
            <Input
              type="number"
              min={0}
              max={480}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note to this entry…"
            />
          </div>

          {previewWorked !== null && (
            <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Corrected total</span>
              <span className="font-semibold text-primary">
                {Math.floor(previewWorked / 60)}h {previewWorked % 60}m
              </span>
            </div>
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-sm">
              Reason for correction <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="e.g. Forgot to clock out, system error, worked offsite…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              submitCorrection.isPending || !reason.trim() || !hasChanges
            }
            onClick={handleSubmit}
          >
            {submitCorrection.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
