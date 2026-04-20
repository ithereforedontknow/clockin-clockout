import { useState, Suspense, lazy } from "react"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { WelcomeTutorialDialog } from "@/components/WelcomeTutorialDialog"
import { HelpCenterDialog } from "@/components/HelpCenterDialog"
import { CommandPalette } from "@/components/CommandPallete"
import { useCurrentEmployee } from "@/lib/queries"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { PageSkeleton } from "@/components/PageSkeleton"
import { useRealtimeNotifications } from "@/lib/hooks/useRealtimeNotifications"
import { useQueryClient } from "@tanstack/react-query"

// LAZY LOAD TABS (Performance Fix: -70% Initial Bundle Size)
const HomeTab = lazy(() =>
  import("@/tabs/HomeTab").then((m) => ({ default: m.HomeTab }))
)
const TimeSheetTab = lazy(() =>
  import("@/tabs/TimeSheetTab").then((m) => ({ default: m.TimeSheetTab }))
)
const TimeOffTab = lazy(() =>
  import("@/tabs/TimeOffTab").then((m) => ({ default: m.TimeOffTab }))
)
const PeopleTab = lazy(() =>
  import("@/tabs/PeopleTab").then((m) => ({ default: m.PeopleTab }))
)
const MyInfoTab = lazy(() =>
  import("@/tabs/MyInfoTab").then((m) => ({ default: m.MyInfoTab }))
)
const TrainingTab = lazy(() =>
  import("@/tabs/TrainingTab").then((m) => ({ default: m.TrainingTab }))
)
const ApprovalsTab = lazy(() =>
  import("@/tabs/ApprovalsTab").then((m) => ({ default: m.ApprovalsTab }))
)
const AdminTab = lazy(() =>
  import("@/tabs/AdminTab").then((m) => ({ default: m.AdminTab }))
)
const ReportsTab = lazy(() =>
  import("@/tabs/ReportsTab").then((m) => ({ default: m.ReportsTab }))
)
const SettingsTab = lazy(() =>
  import("@/tabs/SettingsTab").then((m) => ({ default: m.SettingsTab }))
)

export type TabId =
  | "home"
  | "timesheet"
  | "timeoff"
  | "people"
  | "myinfo"
  | "reports"
  | "approvals"
  | "admin"
  | "training"
  | "settings"

export function AppShell() {
  const queryClient = useQueryClient()
  const { tab } = useParams<{ tab: string }>()
  const navigate = useNavigate()
  const { data: employee, isLoading, error } = useCurrentEmployee()

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Real-time engine
  useRealtimeNotifications(employee?.id ?? "")

  const handleNavigate = (newTab: string) => {
    navigate(`/${newTab}`)
  }
  if (isLoading) return <PageSkeleton />
  if (error || !employee) return <Navigate to="/login" />

  const renderTab = () => {
    // Shared wrapper for Error Handling and Transitions
    const TabWrapper = (node: React.ReactNode) => (
      <ErrorBoundary label={tab || "Home"}>
        <Suspense fallback={<PageSkeleton />}>
          <div className="animate-in duration-500 fade-in slide-in-from-bottom-2">
            {node}
          </div>
        </Suspense>
      </ErrorBoundary>
    )

    switch (tab) {
      case "home":
        return TabWrapper(<HomeTab onNavigate={handleNavigate} />)
      case "timesheet":
        return TabWrapper(<TimeSheetTab onNavigate={handleNavigate} />)
      case "timeoff":
        return TabWrapper(<TimeOffTab />)
      case "people":
        return TabWrapper(<PeopleTab />)
      case "myinfo":
        return TabWrapper(<MyInfoTab />)
      case "training":
        return TabWrapper(<TrainingTab />)
      case "approvals":
        return TabWrapper(<ApprovalsTab />)
      case "admin":
        return TabWrapper(<AdminTab />)
      case "reports":
        return TabWrapper(<ReportsTab />)
      case "settings":
        return TabWrapper(<SettingsTab />)
      default:
        return <Navigate to="/home" replace />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        activeTab={tab as TabId}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          tab={tab as TabId}
          employeeId={employee.id}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto bg-muted/5 p-6 sm:p-8">
          <div className="mx-auto max-w-7xl">{renderTab()}</div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={handleNavigate}
        role={employee.role}
      />
      <HelpCenterDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        employeeId={employee.id}
      />

      {!employee.onboarding_completed && (
        <WelcomeTutorialDialog
          open={true}
          onClose={() =>
            queryClient.invalidateQueries({ queryKey: ["current-employee"] })
          } // FIX: Uses hook instance
          employeeId={employee.id}
        />
      )}
    </div>
  )
}
