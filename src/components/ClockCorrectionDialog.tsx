import { useEffect, useState, useMemo } from "react"
import { format } from "date-fns"
import { Loader2, ClipboardEdit, Info } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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

export function ClockCorrectionDialog({ entry, employeeId, onClose }: Props) {
  const submitCorrection = useSubmitCorrection()
  const [form, setForm] = useState({
    in: "",
    out: "",
    break: "",
    notes: "",
    reason: "",
  })

  useEffect(() => {
    if (!entry) return
    const totalBreakMins = (entry.breaks ?? []).reduce(
      (s, b) => s + (b.duration_minutes ?? 0),
      0
    )
    setForm({
      in: entry.clock_in ? toLocalInput(entry.clock_in) : "",
      out: entry.clock_out ? toLocalInput(entry.clock_out) : "",
      break: String(totalBreakMins),
      notes: entry.notes ?? "",
      reason: "",
    })
  }, [entry?.id])

  const previewWorked = useMemo(() => {
    if (!form.in || !form.out) return null
    const diff = Math.floor(
      (new Date(form.out).getTime() - new Date(form.in).getTime()) / 60000
    )
    return Math.max(0, diff - (parseInt(form.break) || 0))
  }, [form.in, form.out, form.break])

  if (!entry) return null

  return (
    <Dialog open={!!entry} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <DialogHeader className="shrink-0 border-b bg-muted/20 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <ClipboardEdit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Correction Request
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black tracking-widest uppercase opacity-60">
                Shift: {format(new Date(entry.date), "PPP")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-6">
            {/* Original Snapshot */}
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                <Info className="h-3 w-3" /> Original Record
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="mb-0.5 text-muted-foreground">Clock In/Out</p>
                  <p className="font-bold tabular-nums">
                    {format(new Date(entry.clock_in), "p")} —{" "}
                    {entry.clock_out
                      ? format(new Date(entry.clock_out), "p")
                      : "Live"}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-muted-foreground">Break Minutes</p>
                  <p className="font-bold tabular-nums">
                    {(entry.breaks ?? []).reduce(
                      (s, b) => s + (b.duration_minutes ?? 0),
                      0
                    )}
                    m
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Adjusted In
                </Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-xs"
                  value={form.in}
                  onChange={(e) => setForm({ ...form, in: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Adjusted Out
                </Label>
                <Input
                  type="datetime-local"
                  className="h-9 text-xs"
                  value={form.out}
                  onChange={(e) => setForm({ ...form, out: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Break (Mins)
                </Label>
                <Input
                  type="number"
                  className="h-9 text-xs font-bold tabular-nums"
                  value={form.break}
                  onChange={(e) => setForm({ ...form, break: e.target.value })}
                />
              </div>
              {previewWorked !== null && (
                <div className="flex flex-col justify-center rounded-lg border border-primary/10 bg-primary/5 p-2">
                  <p className="text-[9px] font-black text-primary/60 uppercase">
                    New Total
                  </p>
                  <p className="text-sm font-black text-primary tabular-nums">
                    {Math.floor(previewWorked / 60)}h {previewWorked % 60}m
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                Reason for adjustment *
              </Label>
              <Textarea
                placeholder="Required for manager review..."
                className="h-20 resize-none text-xs"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 gap-2 border-t bg-muted/20 p-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!form.reason.trim() || submitCorrection.isPending}
            onClick={() =>
              submitCorrection
                .mutateAsync({
                  clock_entry_id: entry.id,
                  employee_id: employeeId,
                  requested_clock_in: new Date(form.in).toISOString(),
                  requested_clock_out: new Date(form.out).toISOString(),
                  requested_break_minutes: parseInt(form.break),
                  requested_notes: form.notes,
                  reason: form.reason,
                })
                .then(onClose)
            }
            className="font-bold shadow-md"
          >
            {submitCorrection.isPending && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
