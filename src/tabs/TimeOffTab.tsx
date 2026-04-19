import { useState, useMemo } from "react"
import { format } from "date-fns"
import {
  Calculator,
  Clock,
  Plus,
  Loader2,
  MoreHorizontal,
  History,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Hooks & Types
import {
  useTimeOffBalances,
  useTimeOffHistory,
  useUpdateTimeOffRequest,
  calculateFutureBalance,
  useCurrentEmployee,
} from "@/lib/queries"
import type { TimeOffRequest } from "@/lib/supabase"
import { RequestTimeOffDialog } from "@/components/RequestTimeOffDialog"

const STATUS_STYLE: Record<string, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  denied:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  canceled:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
}

export function TimeOffTab() {
  const [requestOpen, setRequestOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<TimeOffRequest | null>(null)
  const [calcCategoryId, setCalcCategoryId] = useState<string>("")
  const [calcDate, setCalcDate] = useState("")

  const { data: employee } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""

  const { data: balances = [], isLoading: balLoading } =
    useTimeOffBalances(employeeId)
  const { data: history = [], isLoading: histLoading } =
    useTimeOffHistory(employeeId)
  const updateRequest = useUpdateTimeOffRequest()

  const futureBalance = useMemo(() => {
    if (!calcCategoryId || !calcDate) return null
    const b = balances.find((b) => b.category_id === calcCategoryId)
    if (!b?.category) return null
    return calculateFutureBalance(
      b.balance,
      b.scheduled,
      b.category.accrual_rate,
      new Date(calcDate)
    )
  }, [calcCategoryId, calcDate, balances])

  async function handleCancel() {
    if (!cancelTarget || !employee) return
    await updateRequest.mutateAsync({
      id: cancelTarget.id,
      employeeId: employee.id,
      updates: { status: "canceled" },
    })
    toast.success("Request canceled")
    setCancelTarget(null)
  }

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Off</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Manage your leave balances and requests.
          </p>
        </div>
        <Button onClick={() => setRequestOpen(true)} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Request Time Off
        </Button>
      </div>

      {/* Balances Strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {balLoading
          ? [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))
          : balances.map((b) => (
              <Card key={b.id} className="border-none bg-muted/40 shadow-none">
                <CardContent className="p-5">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      {b.category?.name}
                    </p>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter tabular-nums">
                      {b.balance}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {b.category?.unit}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        Scheduled
                      </p>
                      <p className="text-xs font-bold text-amber-600 tabular-nums">
                        {b.scheduled} {b.category?.unit}
                      </p>
                    </div>
                    <div className="h-6 w-[1px] bg-border" />
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        Available
                      </p>
                      <p className="text-xs font-bold text-emerald-600 tabular-nums">
                        {b.balance - b.scheduled} {b.category?.unit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* History Table (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 text-primary" />
                Request History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-medium">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-medium">Dates</TableHead>
                    <TableHead className="text-xs font-medium">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-medium">
                      Status
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-sm text-muted-foreground italic"
                      >
                        No history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((req) => {
                      const canEdit =
                        (req.status === "pending" ||
                          req.status === "approved") &&
                        new Date(req.end_date) >= new Date()
                      return (
                        <TableRow
                          key={req.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="text-sm font-medium">
                            {req.category?.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(req.start_date), "MMM d")} -{" "}
                                {format(new Date(req.end_date), "MMM d")}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                {format(new Date(req.end_date), "yyyy")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-semibold tabular-nums">
                            {req.amount} {req.category?.unit}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium capitalize ${STATUS_STYLE[req.status]}`}
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {canEdit && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40"
                                >
                                  <DropdownMenuItem
                                    onClick={() => setCancelTarget(req)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                                    Request
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Forecaster (1/3) */}
        <div className="space-y-6">
          <Card className="border-primary/10 bg-primary/[0.02]">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Calculator className="h-4 w-4 text-primary" />
                Forecaster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="mb-2 text-xs text-muted-foreground">
                Estimate your balance for a future date based on your current
                accrual rate.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Category
                  </Label>
                  <Select
                    value={calcCategoryId}
                    onValueChange={setCalcCategoryId}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Choose type..." />
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

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Target Date
                  </Label>
                  <Input
                    type="date"
                    className="bg-background"
                    value={calcDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setCalcDate(e.target.value)}
                  />
                </div>
              </div>

              {futureBalance !== null && (
                <div className="mt-4 animate-in rounded-xl border bg-background p-4 shadow-sm duration-300 zoom-in-95 fade-in">
                  <p className="mb-1 text-center text-[10px] font-bold text-muted-foreground uppercase">
                    Projected Balance
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-black tracking-tighter text-primary tabular-nums">
                      {futureBalance.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      {
                        balances.find((b) => b.category_id === calcCategoryId)
                          ?.category?.unit
                      }
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Dialog */}
      <RequestTimeOffDialog open={requestOpen} onOpenChange={setRequestOpen} />

      {/* Cancel Confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Request?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to cancel your{" "}
            <span className="font-bold text-foreground">
              {cancelTarget?.category?.name}
            </span>{" "}
            request for{" "}
            <span className="font-bold text-foreground">
              {cancelTarget &&
                format(new Date(cancelTarget.start_date), "MMM d")}
            </span>
            ?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              No, Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={updateRequest.isPending}
              onClick={handleCancel}
            >
              {updateRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Yes, Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
