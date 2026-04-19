import {
  type ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react"
import type { TabId } from "@/components/AppShell"
import {
  Home,
  User,
  Users,
  Clock,
  Timer,
  BarChart3,
  ClipboardCheck,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Bell,
  CheckCheck,
  Loader2,
  Calendar,
  AlertCircle,
  UserPlus,
  Shield,
  Search,
  Settings,
  HelpCircle,
  GraduationCap,
  Award,
  AlarmClock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import {
  useCurrentEmployee,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useCompanySettings,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  UserRole,
  AppNotification,
  NotificationType,
} from "@/lib/supabase"

// ── Sidebar context ────────────────────────────────────────────────────────────
interface SidebarCtx {
  collapsed: boolean
  toggle: () => void
}
const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
})
export function useSidebar() {
  return useContext(SidebarContext)
}

// ── Nav config ─────────────────────────────────────────────────────────────────
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
  { id: "training", label: "Training", icon: GraduationCap },
  { id: "people", label: "People", icon: Users, roles: ["employer", "admin"] },
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
  { id: "admin", label: "Admin", icon: Shield, roles: ["admin"] },
]

const NOTIF_ICON: Record<NotificationType, typeof Bell> = {
  timeoff_approved: Calendar,
  timeoff_denied: Calendar,
  info_change_approved: User,
  info_change_denied: User,
  correction_approved: Timer,
  correction_denied: Timer,
  late_clock_in: AlertCircle,
  new_employee: UserPlus,
  course_completed: Award,
  course_assigned: Bell,
}
const NOTIF_COLOR: Record<NotificationType, string> = {
  timeoff_approved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
  timeoff_denied: "text-destructive bg-destructive/10",
  info_change_approved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
  info_change_denied: "text-destructive bg-destructive/10",
  correction_approved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
  correction_denied: "text-destructive bg-destructive/10",
  late_clock_in: "text-amber-600 bg-amber-50 dark:bg-amber-950",
  new_employee: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  course_completed: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
  course_assigned: "text-blue-600 bg-blue-50 dark:bg-blue-950",
}

// ── Root layout ────────────────────────────────────────────────────────────────
interface AppSidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
  onOpenSettings: () => void
  onOpenPalette: () => void
  onOpenHelp: () => void
}

export function AppSidebar({
  activeTab,
  onTabChange,
  children,
  onOpenSettings,
  onOpenPalette,
  onOpenHelp,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true"
    } catch {
      return false
    }
  })
  const { hasPermission } = usePermissions()
  const { data: settings } = useCompanySettings()
  const companyName = settings?.company_name ?? "Company"

  useEffect(() => {
    if (settings?.company_name) document.title = settings.company_name
  }, [settings?.company_name])

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem("sidebar-collapsed", String(next))
      } catch {}
      return next
    })
  }

  const visibleNav = NAV_ITEMS.filter(
    (item) =>
      !item.roles ||
      item.roles.some(
        (r) =>
          (r === "admin" && hasPermission("admin_full_access")) ||
          (r === "employer" && hasPermission("approve_time_off"))
      )
  )

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <TooltipProvider delayDuration={0}>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "relative hidden h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out md:flex",
              collapsed ? "w-14" : "w-60"
            )}
          >
            {/* Collapse toggle */}
            <button
              onClick={toggle}
              className="absolute top-6 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronsLeft className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            {/* Logo */}
            <div
              className={cn(
                "flex h-14 items-center gap-3 border-b border-sidebar-border px-4",
                collapsed && "justify-center px-0"
              )}
            >
              {settings?.logo_url && (
                <img
                  src={settings.logo_url}
                  alt={companyName}
                  className={collapsed ? "h-6 w-6" : "h-8 w-auto max-w-[110px]"}
                />
              )}

              {!collapsed && (
                <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                  {companyName}
                </span>
              )}

              {!settings?.logo_url && !collapsed && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <AlarmClock className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
              {/* Search */}
              <NavBtn
                icon={Search}
                label="Search"
                sublabel="⌘K"
                collapsed={collapsed}
                onClick={onOpenPalette}
                tooltip="Search (⌘K)"
              />
              <div className="my-1.5 border-t border-sidebar-border/50" />
              {visibleNav.map(({ id, label, icon: Icon }) => (
                <NavBtn
                  key={id}
                  icon={Icon}
                  label={label}
                  collapsed={collapsed}
                  active={activeTab === id}
                  onClick={() => onTabChange(id)}
                  tooltip={label}
                />
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border/50">
              <SidebarFooter
                collapsed={collapsed}
                onNavigate={onTabChange}
                onOpenSettings={onOpenSettings}
                onOpenHelp={onOpenHelp}
              />
            </div>
          </aside>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto overscroll-contain">
              <div className="pb-safe mx-auto max-w-5xl px-4 py-5 sm:px-6">
                {children}
              </div>
            </main>
            <MobileNav
              items={visibleNav}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          </div>
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

// ── Nav button ─────────────────────────────────────────────────────────────────
function NavBtn({
  icon: Icon,
  label,
  sublabel,
  active,
  collapsed,
  onClick,
  tooltip,
}: {
  icon: typeof Home
  label: string
  sublabel?: string
  active?: boolean
  collapsed: boolean
  onClick: () => void
  tooltip?: string
}) {
  const btn = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {sublabel && (
            <span className="text-[10px] text-sidebar-foreground/35">
              {sublabel}
            </span>
          )}
        </>
      )}
    </button>
  )

  if (!collapsed) return btn
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="right">{tooltip ?? label}</TooltipContent>
    </Tooltip>
  )
}

// ── Sidebar footer ─────────────────────────────────────────────────────────────
function SidebarFooter({
  collapsed,
  onNavigate,
  onOpenSettings,
  onOpenHelp,
}: {
  collapsed: boolean
  onNavigate: (tab: TabId) => void
  onOpenSettings: () => void
  onOpenHelp: () => void
}) {
  const { data: employee, isLoading } = useCurrentEmployee()
  const { role } = usePermissions()
  const employeeId = employee?.id ?? ""
  const { data: notifications = [] } = useNotifications(employeeId)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()
  const unreadCount = notifications.filter((n) => !n.read).length
  const initials = employee
    ? `${employee.first_name[0]}${employee.last_name[0]}`
    : "??"

  async function handleNotifClick(n: AppNotification) {
    if (!n.read) await markRead.mutateAsync({ id: n.id, employeeId })
    if (n.link_tab) onNavigate(n.link_tab as TabId)
  }

  const footerBtnCls = cn(
    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm",
    "text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
    collapsed && "justify-center px-0"
  )

  return (
    <div
      className={cn(
        "space-y-0.5 p-2",
        collapsed && "flex flex-col items-center"
      )}
    >
      {/* Notifications */}
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className={cn(footerBtnCls, "relative")}>
                <Bell className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left">Notifications</span>
                )}
                {unreadCount > 0 && (
                  <Badge
                    className={cn(
                      "text-destructive-foreground h-4 min-w-4 bg-destructive px-1 text-[10px]",
                      collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto"
                    )}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Notifications</TooltipContent>
          )}
        </Tooltip>

        <PopoverContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-80 p-0"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate(employeeId)}
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                <Bell className="h-7 w-7 opacity-25" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const Icon = NOTIF_ICON[n.type] ?? Bell
                const color = NOTIF_COLOR[n.type] ?? ""
                return (
                  <div key={n.id}>
                    <button
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !n.read && "bg-primary/[0.04]"
                      )}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div
                        className={cn(
                          "mt-0.5 shrink-0 rounded-full p-1.5",
                          color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug font-medium",
                            n.read && "text-muted-foreground"
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                    {idx < notifications.length - 1 && (
                      <div className="mx-4 border-b border-border/60" />
                    )}
                  </div>
                )
              })
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Help */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onOpenHelp} className={footerBtnCls}>
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Help</span>}
          </button>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">Help Center</TooltipContent>}
      </Tooltip>

      {/* User menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className={footerBtnCls}>
                {isLoading ? (
                  <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                ) : (
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={employee?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!collapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    {isLoading ? (
                      <Skeleton className="h-3.5 w-24" />
                    ) : (
                      <>
                        <p className="truncate text-sm font-medium text-sidebar-foreground">
                          {employee?.preferred_name ?? employee?.first_name}{" "}
                          {employee?.last_name}
                        </p>
                        <p className="text-[10px] text-sidebar-foreground/45 capitalize">
                          {role}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              {employee?.first_name} {employee?.last_name}
            </TooltipContent>
          )}
        </Tooltip>

        <DropdownMenuContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-52"
        >
          <div className="space-y-0.5 px-2 py-1.5">
            <p className="text-sm font-medium">
              {employee?.preferred_name ?? employee?.first_name}{" "}
              {employee?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{employee?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onNavigate("myinfo")}
          >
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = "/login"
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Mobile bottom nav ──────────────────────────────────────────────────────────
function MobileNav({
  items,
  activeTab,
  onTabChange,
}: {
  items: NavItem[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}) {
  return (
    <nav
      className="flex shrink-0 border-t bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {items.slice(0, 5).map(({ id, icon: Icon, label }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors active:scale-95",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-10 items-center justify-center rounded-full transition-colors",
                isActive && "bg-primary/10"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <span
              className={cn(
                "truncate px-0.5 text-[9px] font-medium",
                isActive && "text-primary"
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
