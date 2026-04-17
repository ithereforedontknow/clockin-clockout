import { useState, useMemo } from "react"
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  // CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { usePayrollDailySummary } from "@/lib/queries"

interface EmployeeSummary {
  id: string
  name: string
  regHours: number
  otHours: number
  baseRate: number
  missingOuts: number
  activeRate: number
  adjustment: number
  grossPay: number
}

export function PayrollExportPanel() {
  const [weekOffset, setWeekOffset] = useState(0)

  // Calculate week range based on offset
  const baseDate = new Date()
  const weekStart = startOfWeek(addWeeks(baseDate, weekOffset), {
    weekStartsOn: 1,
  })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const periodLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`

  const { data: rawData = [], isLoading } = usePayrollDailySummary(
    weekStart,
    weekEnd
  )

  const [editableRates, setEditableRates] = useState<Record<string, number>>({})
  const [adjustments, setAdjustments] = useState<Record<string, number>>({})
  const [isExporting, setIsExporting] = useState(false)

  const payrollSummary = useMemo<EmployeeSummary[]>(() => {
    const summaryMap = rawData.reduce<Record<string, any>>((acc, curr) => {
      const id = curr.employee_id
      if (!acc[id]) {
        acc[id] = {
          id,
          name: `${curr.first_name} ${curr.last_name}`,
          regHours: 0,
          otHours: 0,
          baseRate: curr.hourly_rate || 0,
          missingOuts: 0,
        }
      }
      acc[id].regHours += curr.reg_hours || 0
      acc[id].otHours += curr.ot_hours || 0
      acc[id].missingOuts += curr.missing_clock_outs || 0
      return acc
    }, {})

    return Object.values(summaryMap).map((emp: any) => {
      const activeRate = editableRates[emp.id] ?? emp.baseRate
      const adjustment = adjustments[emp.id] || 0
      const regPay = emp.regHours * activeRate
      const otPay = emp.otHours * (activeRate * 1.25)

      return {
        ...emp,
        activeRate,
        adjustment,
        grossPay: regPay + otPay + adjustment,
      }
    })
  }, [rawData, editableRates, adjustments])

  const totalCompanyPayroll = payrollSummary.reduce(
    (sum, emp) => sum + emp.grossPay,
    0
  )

  const handleRateChange = (empId: string, value: string) => {
    const num = parseFloat(value)
    setEditableRates((prev) => ({
      ...prev,
      [empId]: isNaN(num) ? 0 : num,
    }))
  }

  const handleAdjustmentChange = (empId: string, value: string) => {
    const num = parseFloat(value)
    setAdjustments((prev) => ({
      ...prev,
      [empId]: isNaN(num) ? 0 : num,
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows: string[][] = [
        [
          "Employee",
          "Reg Hours",
          "OT Hours",
          "Hourly Rate",
          "Adjustment",
          "Gross Pay",
        ],
      ]
      for (const emp of payrollSummary) {
        rows.push([
          emp.name,
          emp.regHours.toFixed(2),
          emp.otHours.toFixed(2),
          emp.activeRate.toFixed(2),
          emp.adjustment.toFixed(2),
          emp.grossPay.toFixed(2),
        ])
      }
      rows.push(["TOTAL", "", "", "", "", totalCompanyPayroll.toFixed(2)])

      const csv = rows
        .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
        .join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `payroll-${format(weekStart, "yyyy-MM-dd")}.csv`,
      })
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Payroll CSV downloaded", {
        description: `${payrollSummary.length} employees · ${periodLabel}`,
      })
    } catch (err: any) {
      toast.error("Export failed", { description: err.message })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center font-medium">
            {periodLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((p) => p + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">TOTAL PAYROLL</p>
          <p className="text-3xl font-bold text-primary">
            ₱
            {totalCompanyPayroll.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Reg Hours</TableHead>
              <TableHead className="text-right">OT Hours</TableHead>
              <TableHead className="w-24">Hourly Rate</TableHead>
              <TableHead className="w-24">Adjustment</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollSummary.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell className="text-right font-mono">
                  {emp.regHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right font-mono text-amber-600">
                  {emp.otHours.toFixed(1)}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9 w-20 font-mono"
                    value={emp.activeRate}
                    onChange={(e) => handleRateChange(emp.id, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-9 w-20 font-mono"
                    value={emp.adjustment || ""}
                    placeholder="0.00"
                    onChange={(e) =>
                      handleAdjustmentChange(emp.id, e.target.value)
                    }
                  />
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  ₱{emp.grossPay.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  {emp.missingOuts > 0 ? (
                    <Badge variant="destructive">Missing Out</Badge>
                  ) : (
                    <Badge variant="secondary">Ready</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button
          onClick={handleExport}
          disabled={isExporting || payrollSummary.length === 0}
          className="mt-6 w-full"
          size="lg"
        >
          {isExporting ? "Generating CSV..." : "Export Payroll CSV"}
        </Button>
      </CardContent>
    </Card>
  )
}
