import { useState } from "react"
import { format } from "date-fns"
import { Calculator, Clock, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  useTimeOffBalances,
  useTimeOffHistory,
  useUpdateTimeOffRequest,
  calculateFutureBalance,
  useCurrentEmployee,
} from "@/lib/queries"
import type { TimeOffRequest } from "@/lib/supabase"
import { RequestTimeOffDialog } from "@/components/RequestTimeOffDialog"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  denied: "bg-red-50 text-red-700",
  canceled: "bg-muted text-muted-foreground",
}

export function TimeOffTab() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [editRequest, setEditRequest] = useState<TimeOffRequest | null>(null)
  const [calcCategoryId, setCalcCategoryId] = useState<string>("")
  const [calcDate, setCalcDate] = useState("")

  const { data: employee } = useCurrentEmployee()

  // ✅ ?? "" keeps TypeScript happy; enabled: !!employeeId inside
  //    each hook prevents firing until the id is ready.
  const employeeId = employee?.id ?? ""

  const { data: balances = [], isLoading: balLoading } =
    useTimeOffBalances(employeeId)
  const { data: history = [], isLoading: histLoading } =
    useTimeOffHistory(employeeId)
  const updateRequest = useUpdateTimeOffRequest()

  const futureBalance = (() => {
    if (!calcCategoryId || !calcDate) return null
    const b = balances.find((b) => b.category_id === calcCategoryId)
    if (!b?.category) return null
    return calculateFutureBalance(
      b.balance,
      b.scheduled,
      b.category.accrual_rate,
      new Date(calcDate)
    )
  })()

  async function handleCancel(req: TimeOffRequest) {
    // ✅ employee!.id — safe: button only renders when employee is loaded
    if (!employee) return
    await updateRequest.mutateAsync({
      id: req.id,
      employeeId: employee.id,
      updates: { status: "canceled" },
    })
    toast.success("Time off request canceled")
    setEditRequest(null)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Time Off</h1>
        <Button onClick={() => setRequestOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      </div>

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Current Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {balances.map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {b.category?.name}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {b.balance}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {b.category?.unit}
                    </span>
                  </p>
                  {b.scheduled > 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      {b.scheduled} {b.category?.unit} scheduled
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Available: {b.balance - b.scheduled} {b.category?.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Balance Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4 text-primary" />
            Calculate Future Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-end gap-4 sm:flex-row">
            <div className="flex-1">
              <Label className="mb-1 block text-sm">Time Off Category</Label>
              <Select value={calcCategoryId} onValueChange={setCalcCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((b) => (
                    <SelectItem key={b.category_id} value={b.category_id}>
                      {b.category?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-sm">As of Date</Label>
              <Input
                type="date"
                value={calcDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setCalcDate(e.target.value)}
              />
            </div>
            {futureBalance !== null && (
              <div className="min-w-[100px] rounded-lg border border-border px-5 py-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  Projected
                </p>
                <p className="text-2xl font-bold">{futureBalance.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {
                    balances.find((b) => b.category_id === calcCategoryId)
                      ?.category?.unit
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {histLoading ? (
            <div className="space-y-3">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No time off requests yet
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((req, idx) => {
                const canEdit =
                  (req.status === "pending" || req.status === "approved") &&
                  new Date(req.end_date) >= new Date()
                return (
                  <div key={req.id}>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {req.category?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.start_date), "MMM d")} –{" "}
                          {format(new Date(req.end_date), "MMM d, yyyy")} ·{" "}
                          {req.amount} {req.category?.unit}
                        </p>
                        {req.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground italic">
                            "{req.note}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-xs capitalize ${STATUS_STYLES[req.status] ?? ""}`}
                        >
                          {req.status}
                        </Badge>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setEditRequest(req)}
                          >
                            Edit / Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                    {idx < history.length - 1 && <Separator />}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RequestTimeOffDialog open={requestOpen} onOpenChange={setRequestOpen} />

      {editRequest && (
        <Dialog open={!!editRequest} onOpenChange={() => setEditRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Time Off Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Category: </span>
                  {editRequest.category?.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Dates: </span>
                  {format(new Date(editRequest.start_date), "MMM d")} –{" "}
                  {format(new Date(editRequest.end_date), "MMM d, yyyy")}
                </p>
                <p>
                  <span className="text-muted-foreground">Amount: </span>
                  {editRequest.amount} {editRequest.category?.unit}
                </p>
                <p>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="capitalize">{editRequest.status}</span>
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditRequest(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                disabled={updateRequest.isPending || !employee}
                onClick={() => handleCancel(editRequest)}
              >
                {updateRequest.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cancel Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
