import { useState } from "react"
import { Building2, Bell, Laptop, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { usePermissions } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"

// Import the sub-panels we redesigned earlier
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { SystemInfo } from "@/components/settings/SystemInfo"

export function SettingsTab() {
  const { isAdmin } = usePermissions()
  const [activeSection, setActiveSection] = useState(
    isAdmin ? "company" : "notifications"
  )

  const navItems = [
    { id: "company", label: "Workspace", icon: Building2, hidden: !isAdmin },
    { id: "notifications", label: "Notifications", icon: Bell, hidden: false },
    { id: "system", label: "System Info", icon: Laptop, hidden: false },
  ]

  return (
    <div className="flex flex-col items-start gap-12 lg:flex-row">
      {/* 1. INTERNAL NAV SIDEBAR */}
      <aside className="w-full shrink-0 space-y-1 lg:sticky lg:top-24 lg:w-56">
        <div className="mb-4 px-3">
          <p className="text-[10px] font-black tracking-[0.25em] text-muted-foreground/50 uppercase">
            System Config
          </p>
        </div>

        {navItems.map((item) => {
          if (item.hidden) return null
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </div>
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-opacity",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          )
        })}
      </aside>

      {/* 2. DYNAMIC CONTENT AREA */}
      <main className="max-w-3xl min-w-0 flex-1">
        <div className="animate-in space-y-8 duration-500 fade-in slide-in-from-right-4">
          {activeSection === "company" && (
            <div className="space-y-6">
              <header>
                <h2 className="text-2xl font-bold tracking-tight">
                  Workspace Identity
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your organization's branding and global policies.
                </p>
              </header>
              <CompanySettingsForm />
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-6">
              <header>
                <h2 className="text-2xl font-bold tracking-tight">
                  Alert Preferences
                </h2>
                <p className="text-sm text-muted-foreground">
                  Control how and when you receive system updates.
                </p>
              </header>
              <Card className="border-none bg-card shadow-none ring-1 ring-border">
                <CardContent className="p-8">
                  <NotificationSettings />
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "system" && (
            <div className="space-y-6">
              <header>
                <h2 className="text-2xl font-bold tracking-tight">
                  System Environment
                </h2>
                <p className="text-sm text-muted-foreground">
                  Technical metadata and synchronization status.
                </p>
              </header>
              <SystemInfo />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
