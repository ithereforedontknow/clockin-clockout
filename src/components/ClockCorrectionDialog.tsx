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
    return Math.max(
      0,
      Math.floor((outMs - inMs) / 60000) - (parseInt(breakMinutes) || 0)
    )
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardEdit className="h-4 w-4 text-primary" />
            </div>
            Request Time Correction
          </DialogTitle>
          <DialogDescription>
            {format(new Date(entry.date), "EEEE, MMMM d, yyyy")} — changes
            require manager approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Original entry */}
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              Original Entry
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Clock In:{" "}
                <span className="font-medium text-foreground">
                  {format(new Date(entry.clock_in), "h:mm a")}
                </span>
              </span>
              {entry.clock_out && (
                <span>
                  Clock Out:{" "}
                  <span className="font-medium text-foreground">
                    {format(new Date(entry.clock_out), "h:mm a")}
                  </span>
                </span>
              )}
              <span>
                Break:{" "}
                <span className="font-medium text-foreground">
                  {originalBreakMins} min
                </span>
              </span>
              {entry.total_minutes && (
                <span>
                  Worked:{" "}
                  <span className="font-medium text-foreground">
                    {Math.floor(entry.total_minutes / 60)}h{" "}
                    {entry.total_minutes % 60}m
                  </span>
                </span>
              )}
            </div>
          </div>

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
            <Label className="text-sm">Break duration (minutes)</Label>
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
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Corrected total
              </span>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {Math.floor(previewWorked / 60)}h {previewWorked % 60}m
              </span>
            </div>
          )}

          <div className="border-t pt-1" />

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
