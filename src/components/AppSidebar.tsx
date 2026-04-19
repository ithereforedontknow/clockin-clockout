import { cn } from "@/lib/utils"
import { NavLink } from "react-router-dom"
import {
  Home,
  Timer,
  Clock,
  GraduationCap,
  Users,
  ClipboardCheck,
  BarChart3,
  Shield,
  Search,
} from "lucide-react"
import {
  useCurrentEmployee,
  useNotifications,
  useCompanySettings,
} from "@/lib/queries"
import { Badge } from "@/components/ui/badge"

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "timesheet", label: "Timesheet", icon: Timer },
  { id: "timeoff", label: "Time Off", icon: Clock },
  { id: "training", label: "Learning", icon: GraduationCap },
  {
    id: "people",
    label: "Directory",
    icon: Users,
    roles: ["employer", "admin"],
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: ClipboardCheck,
    roles: ["employer", "admin"],
  },
  {
    id: "reports",
    label: "Analytics",
    icon: BarChart3,
    roles: ["employer", "admin"],
  },
  { id: "admin", label: "Admin Hub", icon: Shield, roles: ["admin"] },
]

export function AppSidebar({ activeTab, onOpenPalette }: any) {
  const { data: employee } = useCurrentEmployee()
  const { data: notifications = [] } = useNotifications(employee?.id ?? "")
  const { data: settings } = useCompanySettings()

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <aside className="flex hidden w-64 shrink-0 flex-col border-r bg-card transition-all duration-300 md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b bg-muted/5 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Shield className="h-5 w-5" />
        </div>
        <span className="text-lg font-black tracking-tighter">
          {settings?.company_name || "Staffolio"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <button
          onClick={onOpenPalette}
          className="group mb-4 flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-border hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" /> Search Workspace
          </div>
          <kbd className="h-5 rounded border bg-background px-1.5 font-mono text-[9px] opacity-50 group-hover:opacity-100">
            ⌘K
          </kbd>
        </button>

        {NAV_ITEMS.map((item) => {
          const hasAccess =
            !item.roles || item.roles.includes(employee?.role || "employee")
          if (!hasAccess) return null

          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              {item.id === "approvals" && unreadCount > 0 && (
                <Badge className="h-5 min-w-5 justify-center border-none bg-red-500 px-1 text-[10px] text-white">
                  {unreadCount}
                </Badge>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Profile Card */}
      <div className="border-t bg-muted/10 p-4">
        <NavLink
          to="/myinfo"
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-all",
            activeTab === "myinfo"
              ? "bg-background shadow-sm ring-1 ring-border"
              : "hover:bg-muted"
          )}
        >
          <img
            src={employee?.avatar_url ?? undefined}
            className="h-8 w-8 rounded-lg border object-cover"
            alt=""
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{employee?.first_name}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">
              {employee?.role}
            </p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
