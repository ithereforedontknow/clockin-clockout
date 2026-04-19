import { useState } from "react"
import { AlertCircle, Download, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PayrollReviewPanel({ payrollSummary, onExport }: any) {
  const [isExporting, setIsExporting] = useState(false)

  // Logic: Are there any blockers?
  const atRiskRows = payrollSummary.filter((p: any) => p.missingOuts > 0)
  const isReady = atRiskRows.length === 0

  const handleExportClick = async () => {
    setIsExporting(true)
    try {
      const promise = onExport() // Assume this is the CSV generator
      await toast.promise(promise, {
        loading: "Compiling financial data...",
        success: "Payroll CSV exported successfully",
        error: "Failed to generate export",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Review Mode Banner */}
      {!isReady ? (
        <div className="flex animate-in items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-900">
                {atRiskRows.length} Records Require Attention
              </p>
              <p className="text-xs text-red-700">
                Missing clock-outs detected. Resolve these in Timesheets before
                exporting.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-red-200 text-[10px] font-black text-red-700 uppercase"
          >
            Export Blocked
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-900">
            All records verified. Data is ready for export.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Employee
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                Gross Pay
              </TableHead>
              <TableHead className="pr-6 text-right text-[10px] font-bold tracking-widest uppercase">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollSummary.map((emp: any) => (
              <TableRow
                key={emp.id}
                className={emp.missingOuts > 0 ? "bg-red-50/30" : ""}
              >
                <TableCell className="pl-6 text-sm font-bold">
                  {emp.name}
                </TableCell>
                <TableCell className="text-right font-black tabular-nums">
                  ₱{(emp.grossPay ?? 0).toLocaleString()}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  {emp.missingOuts > 0 ? (
                    <Badge className="border-none bg-red-600 text-[9px] text-white uppercase">
                      Missing Data
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 uppercase"
                    >
                      Verified
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        size="lg"
        className="h-12 w-full font-bold shadow-md"
        disabled={!isReady || isExporting}
        onClick={handleExportClick}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Export Verified Payroll CSV
      </Button>
    </div>
  )
}
