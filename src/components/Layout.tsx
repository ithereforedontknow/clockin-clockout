import { type ReactNode } from "react"
import type { TabId } from "@/components/AppShell"

import {
  Home,
  User,
  Users,
  Clock,
  LogOut,
  Timer,
  BarChart3,
  AlarmClock,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/supabase"
import { useCurrentEmployee } from "@/lib/queries"
import { supabase } from "@/lib/supabase"
import { NotificationBell } from "@/components/NotificationBell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type NavItem = {
  id: TabId
  label: string
  icon: typeof Home
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "timesheet", label: "Timesheet", icon: Timer },
  { id: "timeoff", label: "Time Off", icon: Clock },
  { id: "people", label: "People", icon: Users },
  // Manager + Admin only
  {
    id: "approvals",
    label: "Approvals",
    icon: ClipboardCheck,
    roles: ["employer", "admin"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["employer", "admin"],
  },
]

interface LayoutProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  role: UserRole
  children: ReactNode
}

export function Layout({
  activeTab,
  onTabChange,
  role,
  children,
}: LayoutProps) {
  const { data: employee, isLoading } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""

  const initials = employee
    ? `${employee.first_name[0]}${employee.last_name[0]}`
    : "??"

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card px-6 text-card-foreground">
        {/* Logo */}
        <div className="mr-4 flex shrink-0 items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <AlarmClock className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">ClockIn/Out</span>
        </div>

        {/* Nav */}
        <nav className="scrollbar-none flex flex-1 items-center gap-0.5 overflow-x-auto">
          {visibleNav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          {role !== "employee" && (
            <Badge
              variant="secondary"
              className="hidden text-xs capitalize md:inline-flex"
            >
              {role}
            </Badge>
          )}

          {/* Real notification bell */}
          <NotificationBell employeeId={employeeId} onNavigate={onTabChange} />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 transition-opacity outline-none hover:opacity-80">
                {isLoading ? (
                  <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="hidden text-sm font-medium sm:block">
                    {employee?.preferred_name ?? employee?.first_name}{" "}
                    {employee?.last_name}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="space-y-0.5 px-2 py-1.5">
                <p className="text-sm font-medium">
                  {employee?.preferred_name ?? employee?.first_name}{" "}
                  {employee?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {employee?.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {employee?.role}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onTabChange("myinfo")}
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
    </div>
  )
}
