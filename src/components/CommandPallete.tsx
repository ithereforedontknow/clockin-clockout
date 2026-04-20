// need refactor

import { useEffect, useState, useRef, useMemo } from "react"
import type { TabId } from "@/components/AppShell"
import {
  Home,
  Timer,
  Clock,
  Users,
  User,
  BarChart3,
  ClipboardCheck,
  Shield,
  Play,
  Square,
  Settings,
  Calendar,
  Search,
  Activity,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useEmployees,
  useCurrentEmployee,
  useClockIn,
  useClockOut,
  useTodayClockEntry,
} from "@/lib/queries"
import { formatMinutes, liveMinutes } from "@/lib/supabase"
import type { UserRole, BreakEntry } from "@/lib/supabase"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (tab: TabId) => void
  role: UserRole
}

type CommandItem = {
  id: string
  label: string
  sublabel?: string
  icon: typeof Home
  group: string
  action: () => void
  keywords?: string[]
  badge?: string
}

export function CommandPalette({ open, onClose, onNavigate, role }: Props) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: employee } = useCurrentEmployee()
  const { data: employees = [] } = useEmployees()
  const { data: clockEntry } = useTodayClockEntry(employee?.id ?? "")
  const clockIn = useClockIn()
  const clockOut = useClockOut()

  const isClockedIn = !!clockEntry && !clockEntry.clock_out
  const workedMins = isClockedIn
    ? liveMinutes(
        clockEntry.clock_in,
        (clockEntry.breaks ?? []).reduce(
          (s: number, b: BreakEntry) => s + (b.duration_minutes ?? 0),
          0
        )
      )
    : (clockEntry?.total_minutes ?? 0)

  const go = (tab: TabId) => {
    onNavigate(tab)
    onClose()
  }

  // 1. Generate Command Items
  const allItems = useMemo(() => {
    const nav: CommandItem[] = [
      {
        id: "nav-home",
        label: "Dashboard",
        icon: Home,
        group: "Navigation",
        action: () => go("home"),
      },
      {
        id: "nav-timesheet",
        label: "Timesheet",
        icon: Timer,
        group: "Navigation",
        action: () => go("timesheet"),
      },
      {
        id: "nav-timeoff",
        label: "Time Off",
        icon: Clock,
        group: "Navigation",
        action: () => go("timeoff"),
      },
      {
        id: "nav-training",
        label: "Learning Hub",
        icon: GraduationCap,
        group: "Navigation",
        action: () => go("training"),
      },
      ...(role === "employer" || role === "admin"
        ? [
            {
              id: "nav-people",
              label: "Team Directory",
              icon: Users,
              group: "Navigation",
              action: () => go("people"),
            },
            {
              id: "nav-approvals",
              label: "Approvals",
              icon: ClipboardCheck,
              group: "Navigation",
              action: () => go("approvals"),
            },
            {
              id: "nav-reports",
              label: "Analytics",
              icon: BarChart3,
              group: "Navigation",
              action: () => go("reports"),
            },
          ]
        : []),
      ...(role === "admin"
        ? [
            {
              id: "nav-admin",
              label: "Admin Hub",
              icon: Shield,
              group: "Navigation",
              action: () => go("admin"),
            },
          ]
        : []),
    ]

    const clock: CommandItem[] = !!clockEntry?.clock_out
      ? []
      : !isClockedIn
        ? [
            {
              id: "clock-in",
              label: "Clock In",
              sublabel: "Start today's session",
              icon: Play,
              group: "Time Clock",
              action: async () => {
                if (!employee) return
                await clockIn.mutateAsync(employee.id)
                toast.success("Shift started")
                onClose()
              },
            },
          ]
        : [
            {
              id: "clock-out",
              label: "Clock Out",
              sublabel: `Active for ${formatMinutes(workedMins)}`,
              icon: Square,
              group: "Time Clock",
              action: async () => {
                if (!employee || !clockEntry) return
                await clockOut.mutateAsync({
                  entryId: clockEntry.id,
                  employeeId: employee.id,
                  totalMinutes: workedMins,
                })
                toast.success("Shift completed")
                onClose()
              },
            },
          ]

    const people: CommandItem[] = employees.slice(0, 10).map((emp) => ({
      id: `emp-${emp.id}`,
      label: `${emp.first_name} ${emp.last_name}`,
      sublabel: emp.job_title || "Team Member",
      badge: emp.department,
      icon: User,
      group: "Staff Directory",
      action: () => {
        go("people")
        onClose()
      },
    }))

    const actions: CommandItem[] = [
      {
        id: "act-settings",
        label: "System Settings",
        icon: Settings,
        group: "Global",
        action: () => {
          onClose()
        },
      },
      {
        id: "act-pto",
        label: "Request Leave",
        icon: Calendar,
        group: "Global",
        action: () => go("timeoff"),
      },
    ]

    return [...clock, ...nav, ...people, ...actions]
  }, [role, employee, clockEntry, isClockedIn, workedMins, employees])

  // 2. Filter & Group Results
  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = allItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q) ||
        i.sublabel?.toLowerCase().includes(q)
    )

    return filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item)
      return acc
    }, {})
  }, [query, allItems])

  const flatFiltered = useMemo(
    () => Object.values(filteredGroups).flat(),
    [filteredGroups]
  )

  // 3. Keyboard & Focus Management
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, flatFiltered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        flatFiltered[selected]?.action()
      } else if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, flatFiltered, selected, onClose])

  if (!open) return null

  let itemIndex = 0

  return (
    <>
      <div
        className="fixed inset-0 z-[100] animate-in bg-background/40 backdrop-blur-sm duration-300 fade-in"
        onClick={onClose}
      />

      <div className="fixed top-[15vh] left-1/2 z-[101] w-full max-w-[550px] -translate-x-1/2 px-4">
        <div className="animate-in overflow-hidden rounded-2xl border bg-card shadow-2xl ring-1 ring-border duration-200 zoom-in-95">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-4">
            <Search className="h-4 w-4 text-muted-foreground/60" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(0)
              }}
              placeholder="Search actions, teammates, and apps..."
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase opacity-50"
              >
                ESC
              </Badge>
            </div>
          </div>

          {/* Result List */}
          <ScrollArea className="h-[380px]">
            <div className="p-2">
              {flatFiltered.length === 0 ? (
                <div className="flex animate-in flex-col items-center justify-center py-20 text-muted-foreground fade-in">
                  <Activity className="mb-2 h-8 w-8 opacity-10" />
                  <p className="text-xs font-medium italic">
                    No matches found for "{query}"
                  </p>
                </div>
              ) : (
                Object.entries(filteredGroups).map(([group, items]) => (
                  <div key={group} className="space-y-1">
                    <p className="px-4 pt-4 pb-2 text-[9px] font-black tracking-[0.25em] text-muted-foreground/60 uppercase">
                      {group}
                    </p>
                    {items.map((item) => {
                      const idx = itemIndex++
                      const isSelected = idx === selected
                      return (
                        <button
                          key={item.id}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
                            isSelected
                              ? "scale-[1.01] bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "hover:bg-muted"
                          )}
                          onMouseEnter={() => setSelected(idx)}
                          onClick={item.action}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isSelected
                                ? "bg-white/20"
                                : "border bg-muted shadow-sm group-hover:bg-background"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4",
                                isSelected
                                  ? "text-white"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold tracking-tight">
                              {item.label}
                            </p>
                            {item.sublabel && (
                              <p
                                className={cn(
                                  "mt-0.5 truncate text-[11px] font-medium",
                                  isSelected
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                )}
                              >
                                {item.sublabel}
                              </p>
                            )}
                          </div>

                          {item.badge && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 text-[9px] font-bold tracking-tighter uppercase",
                                isSelected
                                  ? "border-white/40 text-white"
                                  : "border-slate-200 text-slate-500"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* SaaS Shortcut Footer */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[9px]">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[9px]">
                  ↵
                </kbd>
                <span>Execute</span>
              </div>
            </div>
            <p className="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">
              Staffolio v1.2
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
