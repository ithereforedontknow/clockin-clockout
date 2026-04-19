import { useState } from "react"
import { format } from "date-fns"
import {
  Check,
  X,
  Loader2,
  ClipboardCheck,
  User,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  usePendingTimeOffRequests,
  usePendingInfoChanges,
  useReviewTimeOff,
  useReviewInfoChange,
  useAllCorrections,
  useReviewCorrection,
  useCurrentEmployee,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import type {
  TimeOffRequest,
  InfoChangeRequest,
  Employee,
  ClockCorrection,
  ClockEntry,
} from "@/lib/supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewTarget =
  | { kind: "timeoff"; item: TimeOffRequest; decision: "approved" | "denied" }
  | {
      kind: "infochange"
      item: InfoChangeRequest
      decision: "approved" | "denied"
    }
  | {
      kind: "correction"
      item: ClockCorrection
      decision: "approved" | "denied"
    }

// ─── Main component ───────────────────────────────────────────────────────────

export function ApprovalsTab() {
  const { data: reviewer } = useCurrentEmployee()
  const { hasPermission } = usePermissions()
  const { data: timeOffReqs = [], isLoading: toLoading } =
    usePendingTimeOffRequests()
  const { data: infoChanges = [], isLoading: icLoading } =
    usePendingInfoChanges()
  const { data: allCorrections = [], isLoading: corrLoading } =
    useAllCorrections()

  const pendingCorrections = allCorrections.filter(
    (c) => c.status === "pending"
  )

  const reviewTimeOff = useReviewTimeOff()
  const reviewInfoChange = useReviewInfoChange()
  const reviewCorrection = useReviewCorrection()

  const [target, setTarget] = useState<ReviewTarget | null>(null)
  const [comment, setComment] = useState("")

  const isReviewing =
    reviewTimeOff.isPending ||
    reviewInfoChange.isPending ||
    reviewCorrection.isPending

  const totalPending =
    timeOffReqs.length + infoChanges.length + pendingCorrections.length

  // ── Open review dialog ────────────────────────────────────────────────────
  function openReview(target: ReviewTarget) {
    setTarget(target)
    setComment("")
  }

  // ── Submit decision ───────────────────────────────────────────────────────
  async function handleDecision() {
    if (!target) return

    if (target.kind === "timeoff") {
      await reviewTimeOff.mutateAsync({
        request: target.item,
        decision: target.decision,
        comment,
      })
    } else if (target.kind === "infochange") {
      await reviewInfoChange.mutateAsync({
        request: target.item,
        decision: target.decision,
        comment,
      })
    } else {
      if (!reviewer) return
      await reviewCorrection.mutateAsync({
        correction: target.item,
        decision: target.decision,
        reviewerComment: comment,
        reviewerId: reviewer.id,
      })
    }

    toast.success(
      target.decision === "approved" ? "Request approved ✓" : "Request denied",
      { description: comment ? "Comment sent to employee." : undefined }
    )
    setTarget(null)
    setComment("")
  }

  if (!hasPermission("approve_time_off")) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Access restricted.
      </div>
    )
  }
  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalPending > 0
            ? `${totalPending} request${totalPending > 1 ? "s" : ""} awaiting your review`
            : "No pending requests"}
        </p>
      </div>
      {hasPermission("approve_time_off") && (
        <Tabs defaultValue="timeoff">
          <TabsList>
            <TabsTrigger value="timeoff" className="gap-2">
              <Calendar className="h-4 w-4" />
              Time Off
              {timeOffReqs.length > 0 && (
                <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {timeOffReqs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="infochange" className="gap-2">
              <User className="h-4 w-4" />
              Profile Changes
              {infoChanges.length > 0 && (
                <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {infoChanges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="corrections" className="gap-2">
              <Clock className="h-4 w-4" />
              Time Corrections
              {pendingCorrections.length > 0 && (
                <Badge className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {pendingCorrections.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Time Off ── */}
          <TabsContent value="timeoff" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  Pending Time Off Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {toLoading ? (
                  <LoadingSkeleton />
                ) : timeOffReqs.length === 0 ? (
                  <EmptyState message="No pending time off requests" />
                ) : (
                  <div className="divide-y divide-border">
                    {timeOffReqs.map((req) => {
                      const emp = req.employee as Employee | undefined
                      const isSelf = req.employee_id === reviewer?.id // time off + info changes

                      return (
                        <RequestRow
                          key={req.id}
                          avatar={`${emp?.first_name?.[0]}${emp?.last_name?.[0]}`}
                          title={`${emp?.first_name} ${emp?.last_name}`}
                          subtitle={emp?.department}
                          lines={[
                            `${req.category?.name} — ${format(new Date(req.start_date), "MMM d")} – ${format(new Date(req.end_date), "MMM d, yyyy")}`,
                            `${req.amount} ${req.category?.unit}${req.note ? ` · "${req.note}"` : ""}`,
                            `Requested ${format(new Date(req.created_at), "MMM d 'at' h:mm a")}`,
                          ]}
                          onApprove={() =>
                            openReview({
                              kind: "timeoff",
                              item: req,
                              decision: "approved",
                            })
                          }
                          onDeny={() =>
                            openReview({
                              kind: "timeoff",
                              item: req,
                              decision: "denied",
                            })
                          }
                          selfBlock={isSelf}
                        />
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Profile Changes ── */}
          <TabsContent value="infochange" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-primary" />
                  Pending Profile Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {icLoading ? (
                  <LoadingSkeleton />
                ) : infoChanges.length === 0 ? (
                  <EmptyState message="No pending profile changes" />
                ) : (
                  <div className="divide-y divide-border">
                    {infoChanges.map((req) => {
                      const emp = req.employee as Employee | undefined
                      const isSelf = req.employee_id === reviewer?.id
                      return (
                        <RequestRow
                          key={req.id}
                          avatar={`${emp?.first_name?.[0]}${emp?.last_name?.[0]}`}
                          title={`${emp?.first_name} ${emp?.last_name}`}
                          subtitle={emp?.department}
                          lines={[
                            `${req.field_name.replace(/_/g, " ")} change`,
                            `${req.old_value || "—"} → ${req.new_value}`,
                            `Requested ${format(new Date(req.created_at), "MMM d 'at' h:mm a")}`,
                          ]}
                          onApprove={() =>
                            openReview({
                              kind: "infochange",
                              item: req,
                              decision: "approved",
                            })
                          }
                          onDeny={() =>
                            openReview({
                              kind: "infochange",
                              item: req,
                              decision: "denied",
                            })
                          }
                          selfBlock={isSelf}
                        />
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Time Corrections ── */}
          <TabsContent value="corrections" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  Pending Time Corrections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {corrLoading ? (
                  <LoadingSkeleton />
                ) : pendingCorrections.length === 0 ? (
                  <EmptyState message="No pending corrections" />
                ) : (
                  <div className="divide-y divide-border">
                    {pendingCorrections.map((c) => {
                      const emp = c.employee as Employee | undefined
                      const entry = c.clock_entry as ClockEntry | undefined
                      const isSelf = c.employee_id === reviewer?.id
                      const changes: string[] = []
                      if (c.requested_clock_in)
                        changes.push(
                          `Clock in → ${format(new Date(c.requested_clock_in), "h:mm a")}`
                        )
                      if (c.requested_clock_out)
                        changes.push(
                          `Clock out → ${format(new Date(c.requested_clock_out), "h:mm a")}`
                        )
                      if (c.requested_break_minutes !== null)
                        changes.push(`Break → ${c.requested_break_minutes} min`)
                      if (c.requested_notes !== null)
                        changes.push(`Notes → "${c.requested_notes}"`)

                      return (
                        <RequestRow
                          key={c.id}
                          avatar={`${emp?.first_name?.[0]}${emp?.last_name?.[0]}`}
                          title={`${emp?.first_name} ${emp?.last_name}`}
                          subtitle={
                            entry
                              ? format(new Date(entry.date), "EEE, MMM d")
                              : undefined
                          }
                          lines={[
                            changes.join(" · "),
                            `Reason: "${c.reason}"`,
                            `Submitted ${format(new Date(c.created_at), "MMM d 'at' h:mm a")}`,
                          ]}
                          onApprove={() =>
                            openReview({
                              kind: "correction",
                              item: c,
                              decision: "approved",
                            })
                          }
                          onDeny={() =>
                            openReview({
                              kind: "correction",
                              item: c,
                              decision: "denied",
                            })
                          }
                          selfBlock={isSelf}
                        />
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      {/* ── Review dialog ── */}
      {target && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setTarget(null)
              setComment("")
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {target.decision === "approved"
                  ? "Approve Request"
                  : "Deny Request"}
              </DialogTitle>
              <DialogDescription>
                {target.decision === "approved"
                  ? "Approving will apply the change immediately."
                  : "The employee will be notified with your reason."}
              </DialogDescription>
            </DialogHeader>

            {/* Summary */}
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm">
              {target.kind === "timeoff" && (
                <>
                  <p>
                    <span className="text-muted-foreground">Employee: </span>
                    {
                      (target.item.employee as Employee | undefined)?.first_name
                    }{" "}
                    {(target.item.employee as Employee | undefined)?.last_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Type: </span>
                    {target.item.category?.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Dates: </span>
                    {format(new Date(target.item.start_date), "MMM d")} –{" "}
                    {format(new Date(target.item.end_date), "MMM d, yyyy")} (
                    {target.item.amount} {target.item.category?.unit})
                  </p>
                  {target.item.note && (
                    <p>
                      <span className="text-muted-foreground">Note: </span>"
                      {target.item.note}"
                    </p>
                  )}
                </>
              )}
              {target.kind === "infochange" && (
                <>
                  <p>
                    <span className="text-muted-foreground">Employee: </span>
                    {
                      (target.item.employee as Employee | undefined)?.first_name
                    }{" "}
                    {(target.item.employee as Employee | undefined)?.last_name}
                  </p>
                  <p className="capitalize">
                    <span className="text-muted-foreground">Field: </span>
                    {target.item.field_name.replace(/_/g, " ")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Change: </span>
                    <span className="text-muted-foreground line-through">
                      {target.item.old_value || "—"}
                    </span>
                    {" → "}
                    <span className="font-medium">{target.item.new_value}</span>
                  </p>
                </>
              )}
              {target.kind === "correction" && (
                <>
                  <p>
                    <span className="text-muted-foreground">Employee: </span>
                    {
                      (target.item.employee as Employee | undefined)?.first_name
                    }{" "}
                    {(target.item.employee as Employee | undefined)?.last_name}
                  </p>
                  {target.item.requested_clock_in && (
                    <p>
                      <span className="text-muted-foreground">Clock in → </span>
                      {format(
                        new Date(target.item.requested_clock_in),
                        "h:mm a"
                      )}
                    </p>
                  )}
                  {target.item.requested_clock_out && (
                    <p>
                      <span className="text-muted-foreground">
                        Clock out →{" "}
                      </span>
                      {format(
                        new Date(target.item.requested_clock_out),
                        "h:mm a"
                      )}
                    </p>
                  )}
                  {target.item.requested_break_minutes !== null && (
                    <p>
                      <span className="text-muted-foreground">Break → </span>
                      {target.item.requested_break_minutes} min
                    </p>
                  )}
                  <p className="text-muted-foreground italic">
                    "{target.item.reason}"
                  </p>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Comment{" "}
                {target.decision === "denied" ? "(recommended)" : "(optional)"}
              </Label>
              <Textarea
                placeholder={
                  target.decision === "denied"
                    ? "Tell the employee why this was denied…"
                    : "Add a note (optional)…"
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-20 resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTarget(null)
                  setComment("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant={
                  target.decision === "denied" ? "destructive" : "default"
                }
                disabled={isReviewing}
                onClick={handleDecision}
              >
                {isReviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : target.decision === "approved" ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                {target.decision === "approved"
                  ? "Confirm Approval"
                  : "Confirm Denial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Shared row component ─────────────────────────────────────────────────────

function RequestRow({
  avatar,
  title,
  subtitle,
  lines,
  onApprove,
  onDeny,
  selfBlock,
}: {
  avatar: string
  title: string
  subtitle?: string
  lines: string[]
  onApprove: () => void
  onDeny: () => void
  selfBlock?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {avatar}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium">
            {title}
            {subtitle && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {subtitle}
              </span>
            )}
          </p>
          {lines.map((line, i) => (
            <p
              key={i}
              className={`text-xs ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {selfBlock ? (
          <span className="text-[10px] text-muted-foreground italic">
            Can't approve own request
          </span>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-red-200 text-red-600 hover:bg-red-50"
              onClick={onDeny}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Deny
            </Button>
            <Button size="sm" className="h-8" onClick={onApprove}>
              <Check className="mr-1 h-3.5 w-3.5" /> Approve
            </Button>
          </div>
        )}
      </div>
      {/*{selfBlock && (
        <p className="text-[10px] text-muted-foreground">
          Can't approve own request
        </p>
      )}*/}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <AlertCircle className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
