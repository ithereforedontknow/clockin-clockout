import { useState, useEffect } from "react"
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
import { toast } from "sonner"

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

export function Appshell() {
  const [activeTab, setActiveTab] = useState<TabId>("home")
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const { data: employee, isLoading, error } = useCurrentEmployee()
  const role = employee?.role ?? "employee"

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

  // Show welcome tutorial for new users
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
          onClick: () => setActiveTab("myinfo"),
        },
      })
    }
  }, [employee])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm space-y-3 text-center">
          <div className="text-4xl">🚧</div>
          <h2 className="text-lg font-semibold">Account not set up yet</h2>
          <p className="text-sm text-muted-foreground">
            Your account exists but no employee record has been linked yet.
            Contact your HR administrator.
          </p>
          <button
            className="text-sm text-primary underline"
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

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab onNavigate={setActiveTab} />
      case "timesheet":
        return <TimeSheetTab onNavigate={setActiveTab} />
      case "timeoff":
        return <TimeOffTab />
      case "people":
        return <PeopleTab />
      case "myinfo":
        return <MyInfoTab />
      case "approvals":
        return role === "employer" || role === "admin" ? (
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
        return role === "employer" || role === "admin" ? (
          <ReportsTab />
        ) : (
          <div className="p-8 text-sm text-muted-foreground">
            Access restricted.
          </div>
        )
      case "training":
        return <TrainingTab />
    }
  }

  return (
    <>
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      >
        {renderTab()}
      </AppSidebar>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActiveTab}
        onOpenSettings={() => {
          setSettingsOpen(true)
          setPaletteOpen(false)
        }}
        role={role}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        role={role}
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
