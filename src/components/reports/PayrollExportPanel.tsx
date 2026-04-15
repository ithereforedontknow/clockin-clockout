import { useState, useMemo } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAllEmployeesForReports } from "@/lib/queries"
import { downloadPayrollCSV } from "./utils/reportUtils"
import { toast } from "sonner"

type PayPeriod = "monthly" | "bimonthly"

export function PayrollExportPanel() {
  const [payPeriod, setPayPeriod] = useState<PayPeriod>("monthly")
  const [payOffset, setPayOffset] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const { data: employees = [], isLoading } = useAllEmployeesForReports()

  const currentPeriod = useMemo(
    () => getPayPeriodRange(payPeriod, payOffset),
    [payPeriod, payOffset]
  )

  const payrollSummary = useMemo(() => {
    let totalHours = 0
    let totalOT = 0

    // This is simplified — in real app you would fetch actual clock entries
    employees.forEach((emp) => {
      // Placeholder calculation
      const estHours = emp.standard_hours_per_week || 40
      totalHours += estHours
      totalOT += Math.max(0, estHours - 40)
    })

    return {
      totalEmployees: employees.length,
      estimatedTotalHours: totalHours,
      estimatedOTHours: totalOT,
    }
  }, [employees])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadPayrollCSV(
        employees,
        currentPeriod.start,
        currentPeriod.end,
        payPeriod
      )
      toast.success("Payroll CSV exported successfully", {
        description: `${payrollSummary.totalEmployees} employees • ${currentPeriod.label}`,
      })
    } catch (err: any) {
      toast.error("Export failed", { description: err.message })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* Period Selector */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPayOffset((o) => o - 1)}
            >
              ←
            </Button>
            <div className="min-w-[240px] text-center font-medium">
              {currentPeriod.label}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPayOffset((o) => o + 1)}
            >
              →
            </Button>
          </div>
          <div className="flex items-center">
            <Select
              value={payPeriod}
              onValueChange={(v) => {
                setPayPeriod(v as PayPeriod)
                setPayOffset(0)
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="bimonthly">Bi-monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Employees</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold">
                  {payrollSummary.totalEmployees}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Est. Total Hours</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-20" />
              ) : (
                <p className="text-3xl font-bold">
                  {payrollSummary.estimatedTotalHours}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Est. OT Hours</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold text-amber-600">
                  {payrollSummary.estimatedOTHours}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting || isLoading}
          size="lg"
          className="w-full"
        >
          {isExporting
            ? "Generating Payroll Report..."
            : `Download Payroll CSV — ${currentPeriod.label}`}
        </Button>
      </CardContent>
    </Card>
  )
}

function getPayPeriodRange(period: PayPeriod, offset: number) {
  const baseDate = new Date()
  baseDate.setMonth(baseDate.getMonth() + offset)

  if (period === "monthly") {
    return {
      start: startOfMonth(baseDate),
      end: endOfMonth(baseDate),
      label: format(baseDate, "MMMM yyyy"),
    }
  } else {
    const isFirstHalf = baseDate.getDate() <= 15
    return {
      start: isFirstHalf
        ? startOfMonth(baseDate)
        : new Date(baseDate.getFullYear(), baseDate.getMonth(), 16),
      end: isFirstHalf
        ? new Date(baseDate.getFullYear(), baseDate.getMonth(), 15)
        : endOfMonth(baseDate),
      label: isFirstHalf
        ? `${format(baseDate, "MMM 1")} – ${format(baseDate, "MMM 15")}`
        : `${format(baseDate, "MMM 16")} – ${format(baseDate, "MMM d")}`,
    }
  }
}
