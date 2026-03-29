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
} from "@/lib/queries"
import type {
  TimeOffRequest,
  InfoChangeRequest,
  Employee,
} from "@/lib/supabase"

type ReviewTarget =
  | { kind: "timeoff"; item: TimeOffRequest }
  | { kind: "infochange"; item: InfoChangeRequest }

export function ApprovalsTab() {
  const { data: timeOffReqs = [], isLoading: toLoading } =
    usePendingTimeOffRequests()
  const { data: infoChanges = [], isLoading: icLoading } =
    usePendingInfoChanges()
  const reviewTimeOff = useReviewTimeOff()
  const reviewInfoChange = useReviewInfoChange()

  const [target, setTarget] = useState<ReviewTarget | null>(null)
  const [comment, setComment] = useState("")

  const isReviewing = reviewTimeOff.isPending || reviewInfoChange.isPending

  const totalPending = timeOffReqs.length + infoChanges.length

  async function handleDecision(decision: "approved" | "denied") {
    if (!target) return
    if (target.kind === "timeoff") {
      await reviewTimeOff.mutateAsync({
        request: target.item,
        decision,
        comment,
      })
    } else {
      await reviewInfoChange.mutateAsync({
        request: target.item,
        decision,
        comment,
      })
    }
    toast.success(
      decision === "approved" ? "Request approved ✓" : "Request denied",
      { description: comment ? `Comment sent to employee.` : undefined }
    )
    setTarget(null)
    setComment("")
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalPending > 0
            ? `${totalPending} request${totalPending > 1 ? "s" : ""} awaiting your review`
            : "No pending requests"}
        </p>
      </div>

      <Tabs defaultValue="timeoff">
        <TabsList>
          <TabsTrigger value="timeoff" className="gap-2">
            <Calendar className="h-4 w-4" />
            Time Off
            {timeOffReqs.length > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px]">
                {timeOffReqs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="infochange" className="gap-2">
            <User className="h-4 w-4" />
            Profile Changes
            {infoChanges.length > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-[10px]">
                {infoChanges.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Time Off Requests ── */}
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
                    return (
                      <div
                        key={req.id}
                        className="flex items-start justify-between gap-4 px-4 py-4"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {emp?.first_name?.[0]}
                              {emp?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium">
                              {emp?.first_name} {emp?.last_name}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {emp?.department}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">
                                {req.category?.name}
                              </span>
                              {" — "}
                              {format(new Date(req.start_date), "MMM d")} –{" "}
                              {format(new Date(req.end_date), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {req.amount} {req.category?.unit}
                              {req.note && <> · "{req.note}"</>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested{" "}
                              {format(
                                new Date(req.created_at),
                                "MMM d 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setTarget({ kind: "timeoff", item: req })
                              setComment("")
                            }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setTarget({ kind: "timeoff", item: req })
                              setComment("")
                            }}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Info Change Requests ── */}
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
                    return (
                      <div
                        key={req.id}
                        className="flex items-start justify-between gap-4 px-4 py-4"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {emp?.first_name?.[0]}
                              {emp?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium">
                              {emp?.first_name} {emp?.last_name}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                {emp?.department}
                              </span>
                            </p>
                            <p className="text-sm capitalize">
                              <span className="font-medium">
                                {req.field_name.replace(/_/g, " ")}
                              </span>
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground line-through">
                                {req.old_value || "—"}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium text-foreground">
                                {req.new_value}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Requested{" "}
                              {format(
                                new Date(req.created_at),
                                "MMM d 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setTarget({ kind: "infochange", item: req })
                              setComment("")
                            }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setTarget({ kind: "infochange", item: req })
                              setComment("")
                            }}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Review Dialog ── */}
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
                Review Request
              </DialogTitle>
              <DialogDescription>
                Choose to approve or deny. An optional comment will be sent to
                the employee.
              </DialogDescription>
            </DialogHeader>

            {/* Summary */}
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm">
              {target.kind === "timeoff" ? (
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
              ) : (
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Comment for employee (optional)</Label>
              <Textarea
                placeholder="Add a note to the employee…"
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
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={isReviewing}
                onClick={() => handleDecision("denied")}
              >
                {isReviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Deny
              </Button>
              <Button
                disabled={isReviewing}
                onClick={() => handleDecision("approved")}
              >
                {isReviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
