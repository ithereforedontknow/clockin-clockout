import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/AppSidebar"
import { HomeTab } from "@/tabs/HomeTab"
import { MyInfoTab } from "@/tabs/MyInfoTab"
import { PeopleTab } from "@/tabs/PeopleTab"
import { TimeOffTab } from "@/tabs/TimeOffTab"
import { TimeSheetTab } from "@/tabs/TimeSheetTab"
import { ReportsTab } from "@/tabs/ReportsTab"
import { ApprovalsTab } from "@/tabs/ApprovalsTab"
import { AdminTab } from "@/tabs/AdminTab"
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

export function Appshell() {
  const [activeTab, setActiveTab] = useState<TabId>("home")
  const { data: employee, isLoading, error } = useCurrentEmployee()
  const role = employee?.role ?? "employee"

  // ── Profile completion toast — shown once per session ──────────────────
  useEffect(() => {
    if (!employee) return
    if (employee.onboarding_completed) return

    // Fields we consider "incomplete"
    const missing = [
      !employee.phone && "phone number",
      !employee.birthday && "birthday",
      !employee.emergency_name && "emergency contact",
      !employee.address_line1 && "address",
    ].filter(Boolean) as string[]

    if (missing.length === 0) return

    toast("Complete your profile", {
      description: `Missing: ${missing.slice(0, 2).join(", ")}${missing.length > 2 ? ` +${missing.length - 2} more` : ""}.`,
      duration: 8000,
      action: {
        label: "Go to My Info",
        onClick: () => setActiveTab("myinfo"),
      },
    })
    // Only fire once after employee first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!employee])

  // ── Error state (no employee record linked to this auth user) ───────────
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm space-y-3 text-center">
          <div className="text-4xl">🚧</div>
          <h2 className="text-lg font-semibold">Account not set up yet</h2>
          <p className="text-sm text-muted-foreground">
            Your account exists but no employee record has been created for it
            yet. Please contact your HR administrator to get access.
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

  // ── Tab renderer ────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />
      case "timesheet":
        return <TimeSheetTab onNavigate={setActiveTab} />
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
