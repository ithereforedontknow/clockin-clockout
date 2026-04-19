import { useState, useMemo } from "react"
import { usePermissions } from "@/lib/auth/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, DollarSign, BarChart3, GraduationCap } from "lucide-react"

import {
  TimesheetReportTable,
  PayrollReviewPanel,
  WorkforceInsights,
  KPICards,
  ReportsControls,
  TrainingReportsTab,
} from "@/components/reports"
import { useTimesheetData } from "@/components/reports/hooks/useTimesheetData"

export function ReportsTab() {
  const { hasPermission } = usePermissions()

  // Shared Filter State (Lifted)
  const [weekOffset, setWeekOffset] = useState(0)
  const [deptFilter, setDeptFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("timesheets")

  const { summaries, isLoading, weekStart, weekEnd } = useTimesheetData(
    weekOffset,
    deptFilter
  )

  // Map summaries to Payroll format
  const payrollData = useMemo(() => {
    return summaries.map((s) => {
      const regMins = Math.min(
        s.totalMins,
        s.employee.standard_hours_per_week * 60
      )
      const baseRate = s.employee.hourly_rate || 0
      const otRate = baseRate * 1.25

      const missingOuts = s.entries.filter(
        (e: any) => e.clock_in && !e.clock_out
      ).length

      return {
        id: s.employee.id,
        name: `${s.employee.first_name} ${s.employee.last_name}`,
        grossPay: (regMins / 60) * baseRate + (s.overtimeMins / 60) * otRate,
        missingOuts,
        status: missingOuts > 0 ? "blocked" : "ready",
      }
    })
  }, [summaries])

  if (!hasPermission("view_reports")) {
    return (
      <div className="p-20 text-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Access Restricted
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-6 pb-20 duration-500 fade-in">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Monitor organizational performance and compliance.
          </p>
        </div>
        <ReportsControls
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          weekStart={weekStart}
          weekEnd={weekEnd}
          summaries={summaries}
        />
      </div>

      <KPICards summaries={summaries} isLoading={isLoading} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <TabsList className="h-10 w-full justify-start rounded-lg bg-muted/60 p-1 sm:w-auto">
          <TabsTrigger
            value="timesheets"
            className="gap-2 px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Clock className="h-3.5 w-3.5" /> Timesheets
          </TabsTrigger>
          <TabsTrigger
            value="payroll"
            className="gap-2 px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <DollarSign className="h-3.5 w-3.5" /> Payroll Review
          </TabsTrigger>
          <TabsTrigger
            value="workforce"
            className="gap-2 px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Workforce
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="gap-2 px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <GraduationCap className="h-3.5 w-3.5" /> Training
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="timesheets" className="mt-0">
            <TimesheetReportTable summaries={summaries} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="payroll" className="mt-0">
            <PayrollReviewPanel
              payrollSummary={payrollData}
              onExport={() => new Promise((res) => setTimeout(res, 1500))} // Placeholder for logic
            />
          </TabsContent>

          <TabsContent value="workforce" className="mt-0">
            <WorkforceInsights employees={summaries.map((s) => s.employee)} />
          </TabsContent>

          <TabsContent value="training" className="mt-0">
            <TrainingReportsTab reportData={[]} />{" "}
            {/* Connect your query here */}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
