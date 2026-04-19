import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { DiffViewer } from "./DiffViewer"
import { format } from "date-fns"

export function ReviewDialog({ target, onClose, onConfirm, isPending }: any) {
  const [comment, setComment] = useState("")
  if (!target) return null
  const { kind, item, decision } = target

  const handleConfirm = () => {
    if (decision === "denied" && comment.trim() === "") return
    onConfirm(comment)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck
              className={`h-5 w-5 ${decision === "approved" ? "text-emerald-600" : "text-destructive"}`}
            />
            {decision === "approved" ? "Confirm Approval" : "Confirm Denial"}
          </DialogTitle>
          <DialogDescription>
            {decision === "approved"
              ? "Are you sure you want to approve this request? Changes will take effect immediately."
              : "Please provide a reason for denying this request so the employee understands the decision."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* THE DIFF VIEW */}
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            {kind === "timeoff" && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                  Time Off Details
                </p>
                <p className="text-sm font-bold">{item.category?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.start_date
                    ? format(new Date(item.start_date), "PPP")
                    : "—"}{" "}
                  –{" "}
                  {item.end_date ? format(new Date(item.end_date), "PPP") : "—"}
                </p>
                <p className="mt-2 text-xs font-bold text-primary">
                  {item.amount} {item.category?.unit} total
                </p>
              </div>
            )}

            {kind === "infochange" && (
              <DiffViewer
                label={item.field_name.replace(/_/g, " ")}
                oldValue={item.old_value}
                newValue={item.new_value}
              />
            )}

            {kind === "correction" && (
              <div className="space-y-3">
                {item.requested_clock_in && (
                  <DiffViewer
                    label="Clock In"
                    oldValue={
                      item.clock_entry?.clock_in
                        ? format(new Date(item.clock_entry.clock_in), "p")
                        : ""
                    }
                    newValue={format(new Date(item.requested_clock_in), "p")}
                  />
                )}
                {item.requested_clock_out && (
                  <DiffViewer
                    label="Clock Out"
                    oldValue={
                      item.clock_entry?.clock_out
                        ? format(new Date(item.clock_entry.clock_out), "p")
                        : "Live"
                    }
                    newValue={format(new Date(item.requested_clock_out), "p")}
                  />
                )}
                {item.requested_break_minutes !== null && (
                  <DiffViewer
                    label="Break Duration"
                    oldValue={`${item.clock_entry?.total_break_minutes || 0}m`}
                    newValue={`${item.requested_break_minutes}m`}
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Internal Comment
            </Label>
            <Textarea
              placeholder={
                decision === "denied"
                  ? "Reason for denial (required)..."
                  : "Add an optional note..."
              }
              className="h-20 resize-none text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={decision === "denied" ? "destructive" : "default"}
            disabled={
              isPending || (decision === "denied" && comment.trim() === "")
            }
            onClick={handleConfirm}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
