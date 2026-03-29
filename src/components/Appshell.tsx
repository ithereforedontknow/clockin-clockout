import { useState } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { OnboardingFlow } from "@/components/OnboardingFlow"
import { HomeTab } from "@/tabs/HomeTab"
import { MyInfoTab } from "@/tabs/MyInfoTab"
import { PeopleTab } from "@/tabs/PeopleTab"
import { TimeOffTab } from "@/tabs/TimeOffTab"
import { TimeSheetTab } from "@/tabs/TimeSheetTab"
import { ReportsTab } from "@/tabs/ReportsTab"
import { ApprovalsTab } from "@/tabs/ApprovalsTab"
import { useCurrentEmployee } from "@/lib/queries"
import { Skeleton } from "@/components/ui/skeleton"

import { AdminTab } from "@/tabs/AdminTab"

export type TabId =
  | "home"
  | "timesheet"
  | "timeoff"
  | "people"
  | "myinfo"
  | "reports"
  | "approvals"
  | "admin"

export function Appshell() {
  const [activeTab, setActiveTab] = useState<TabId>("home")
  const { data: employee, isLoading } = useCurrentEmployee()
  const role = employee?.role ?? "employee"

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden w-60 shrink-0 flex-col gap-2 border-r border-border bg-sidebar p-3 md:flex">
          <Skeleton className="h-9 w-full rounded-lg" />
          <div className="flex-1 space-y-1 pt-2">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        {/* Content skeleton */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Onboarding intercept ────────────────────────────────────────────────
  if (employee && !employee.onboarding_completed) {
    return <OnboardingFlow employee={employee} onComplete={() => {}} />
  }

  // ── Tab renderer ────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />
      case "timesheet":
        return <TimeSheetTab />
      case "timeoff":
        return <TimeOffTab />
      case "people":
        return <PeopleTab />
      case "myinfo":
        return <MyInfoTab />
      case "approvals":
        return role === "manager" || role === "admin" ? (
          <ApprovalsTab />
        ) : (
          <div className="p-8 text-sm text-muted-foreground">
            Access restricted.
          </div>
        )
      case "admin":
        return role === "admin" ? (
          <AdminTab />
        ) : (
          <div className="p-8 text-sm text-muted-foreground">
            Access restricted.
          </div>
        )
      case "reports":
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
    <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} role={role}>
      {renderTab()}
    </AppSidebar>
  )
}
