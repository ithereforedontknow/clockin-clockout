import { useState } from "react"
import { Layout } from "@/components/Layout"
import { HomeTab } from "@/tabs/HomeTab"
import { MyInfoTab } from "@/tabs/MyInfoTab"
import { PeopleTab } from "@/tabs/PeopleTab"
import { TimeOffTab } from "@/tabs/TimeOffTab"
import { ClockTab } from "@/tabs/ClockTab"
import { TimesheetTab } from "@/tabs/TimesheetTab"
import { ReportsTab } from "@/tabs/ReportsTab"
import { useCurrentEmployee } from "@/lib/queries"

export type TabId =
  | "home"
  | "clock"
  | "timesheet"
  | "timeoff"
  | "people"
  | "myinfo"
  | "reports"

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("clock")
  const { data: employee } = useCurrentEmployee()

  const role = employee?.role ?? "employee"

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />
      case "clock":
        return <ClockTab />
      case "timesheet":
        return <TimesheetTab />
      case "timeoff":
        return <TimeOffTab />
      case "people":
        return <PeopleTab />
      case "myinfo":
        return <MyInfoTab />
      case "reports":
        // Guard: only manager/admin can view reports
        return role === "manager" || role === "admin" ? (
          <ReportsTab />
        ) : (
          <div className="p-8 text-sm text-muted-foreground">
            Access restricted.
          </div>
        )
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} role={role}>
      {renderTab()}
    </Layout>
  )
}
