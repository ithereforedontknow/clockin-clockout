import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { SettingsModal } from "@/components/SettingsModal"
import { WelcomeTutorialDialog } from "@/components/WelcomeTutorialDialog"
import { HelpCenterDialog } from "@/components/HelpCenterDialog"
import { CommandPalette } from "@/components/CommandPallete"

import { HomeTab } from "@/tabs/HomeTab"
import { MyInfoTab } from "@/tabs/MyInfoTab"
import { PeopleTab } from "@/tabs/PeopleTab"
import { TimeOffTab } from "@/tabs/TimeOffTab"
import { TimeSheetTab } from "@/tabs/TimeSheetTab"
import { ReportsTab } from "@/tabs/ReportsTab"
import { ApprovalsTab } from "@/tabs/ApprovalsTab"
import { AdminTab } from "@/tabs/AdminTab"
import { TrainingTab } from "@/tabs/TrainingTab"
import { useCurrentEmployee } from "@/lib/queries"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { toast } from "sonner"
import { AlarmClock } from "lucide-react"

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

// Valid tabs for validation
const VALID_TABS: TabId[] = [
  "home",
  "timesheet",
  "timeoff",
  "people",
  "myinfo",
  "reports",
  "approvals",
  "admin",
  "training",
]

function isValidTab(tab: string | undefined): tab is TabId {
  return tab !== undefined && VALID_TABS.includes(tab as TabId)
}

export function AppShell() {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize active tab from URL, location state, or default
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    // Priority 1: URL parameter
    if (isValidTab(tab)) return tab
    // Priority 2: Location state (from programmatic navigation)
    if (isValidTab((location.state as any)?.tab)) {
      return (location.state as any).tab
    }
    // Priority 3: Default
    return "home"
  })

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const { data: employee, isLoading, error } = useCurrentEmployee()
  const role = employee?.role ?? "employee"

  // Sync tab changes to URL (for navigation)
  const handleTabChange = (newTab: TabId) => {
    setActiveTab(newTab)
    navigate(`/${newTab}`, { replace: true, state: { tab: newTab } })
  }

  // Sync URL changes to tab (for browser back/forward and direct URL access)
  useEffect(() => {
    if (isValidTab(tab) && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [tab, activeTab])

  // ⌘K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Show welcome tutorial / profile completion toast
  useEffect(() => {
    if (!employee) return
    if (!employee.onboarding_completed) {
      setShowWelcomeTutorial(true)
      return
    }
    const missing = [
      !employee.phone && "phone number",
      !employee.birthday && "birthday",
      !employee.emergency_name && "emergency contact",
      !employee.address_line1 && "address",
    ].filter(Boolean) as string[]

    if (missing.length > 0) {
      toast("Your profile is almost complete", {
        description: `Missing: ${missing.slice(0, 2).join(", ")}${
          missing.length > 2 ? ` +${missing.length - 2} more` : ""
        }.`,
        duration: 6000,
        action: {
          label: "Go to My Info",
          onClick: () => handleTabChange("myinfo"),
        },
      })
    }
  }, [employee])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <AlarmClock className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Account not set up</h2>
            <p className="text-sm text-muted-foreground">
              No employee record has been linked to your account. Contact your
              HR administrator.
            </p>
          </div>
          <button
            className="text-sm text-primary underline-offset-2 hover:underline"
            onClick={async () => {
              const { supabase } = await import("@/lib/supabase")
              await supabase.auth.signOut()
              window.location.href = "/login"
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden w-60 shrink-0 flex-col gap-2 border-r bg-sidebar p-3 md:flex">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <div className="flex-1 space-y-1 pt-4">
            {Array(7)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        {/* Main skeleton */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <Skeleton className="h-9 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
          </div>
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const wrap = (label: string, node: React.ReactNode) => (
    <ErrorBoundary label={label}>{node}</ErrorBoundary>
  )

  const restricted = (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Access restricted.
    </div>
  )

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return wrap("Home", <HomeTab onNavigate={handleTabChange} />)
      case "timesheet":
        return wrap("Timesheet", <TimeSheetTab onNavigate={handleTabChange} />)
      case "timeoff":
        return wrap("Time Off", <TimeOffTab />)
      case "people":
        return wrap("People", <PeopleTab />)
      case "myinfo":
        return wrap("My Info", <MyInfoTab />)
      case "training":
        return wrap("Training", <TrainingTab />)
      case "approvals":
        return role === "employer" || role === "admin"
          ? wrap("Approvals", <ApprovalsTab />)
          : restricted
      case "admin":
        return role === "admin" ? wrap("Admin", <AdminTab />) : restricted
      case "reports":
        return role === "employer" || role === "admin"
          ? wrap("Reports", <ReportsTab />)
          : restricted
      default:
        return wrap("Home", <HomeTab onNavigate={handleTabChange} />)
    }
  }

  return (
    <>
      <AppSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      >
        {renderTab()}
      </AppSidebar>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={handleTabChange}
        onOpenSettings={() => {
          setSettingsOpen(true)
          setPaletteOpen(false)
        }}
        role={role}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <WelcomeTutorialDialog
        open={showWelcomeTutorial}
        onClose={() => setShowWelcomeTutorial(false)}
        employeeId={employee?.id ?? ""}
      />

      <HelpCenterDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        employeeId={employee?.id ?? ""}
      />
    </>
  )
}
