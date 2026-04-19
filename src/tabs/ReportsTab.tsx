import { useState } from "react"
import { usePermissions } from "@/lib/auth/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, DollarSign, Users } from "lucide-react"
import { TimesheetTable } from "@/components/reports/TimesheetTable"
import { PayrollExportPanel } from "@/components/reports/PayrollExportPanel"
import { WorkforceOverview } from "@/components/reports/WorkforceOverview"
import { useTimesheetData } from "@/components/reports/hooks/useTimesheetData"
import { TrainingReportsTab } from "@/components/reports/TrainingReports"

export function ReportsTab() {
  const { hasPermission } = usePermissions()

  const [weekOffset, setWeekOffset] = useState(0)
  const [deptFilter, setDeptFilter] = useState("all")
  const [activeTab, setActiveTab] = useState<
    "timesheets" | "payroll" | "workforce"
  >("timesheets")

  const { summaries, weekStart, weekEnd, weekDays, isLoading } =
    useTimesheetData(weekOffset, deptFilter)

  if (!hasPermission("view_reports")) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Access restricted.
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Timesheets, attendance, and payroll insights
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="timesheets" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timesheets
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="workforce" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Workforce
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timesheets" className="mt-6">
          <TimesheetTable
            summaries={summaries}
            weekDays={weekDays}
            weekStart={weekStart}
            weekEnd={weekEnd}
            isLoading={isLoading}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
          />
        </TabsContent>

        <TabsContent value="payroll" className="mt-6">
          <PayrollExportPanel />
        </TabsContent>

        <TabsContent value="workforce" className="mt-6">
          <WorkforceOverview
            employees={summaries.map((s) => s.employee)}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <TrainingReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
