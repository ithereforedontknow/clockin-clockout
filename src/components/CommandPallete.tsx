import { useEffect, useState, useRef } from "react"
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
  ArrowRight,
  AlarmClock,
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

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (tab: TabId) => void
  onOpenSettings: () => void
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
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onOpenSettings,
  role,
}: Props) {
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

  // ── Static command items ──────────────────────────────────────────────────
  const navItems: CommandItem[] = [
    {
      id: "nav-home",
      label: "Home",
      icon: Home,
      group: "Navigate",
      action: () => go("home"),
      keywords: ["dashboard"],
    },
    {
      id: "nav-timesheet",
      label: "Timesheet",
      icon: Timer,
      group: "Navigate",
      action: () => go("timesheet"),
      keywords: ["clock", "hours"],
    },
    {
      id: "nav-timeoff",
      label: "Time Off",
      icon: Clock,
      group: "Navigate",
      action: () => go("timeoff"),
      keywords: ["leave", "vacation"],
    },
    {
      id: "nav-people",
      label: "People",
      icon: Users,
      group: "Navigate",
      action: () => go("people"),
      keywords: ["directory", "team"],
    },
    {
      id: "nav-myinfo",
      label: "My Info",
      icon: User,
      group: "Navigate",
      action: () => go("myinfo"),
      keywords: ["profile", "account"],
    },
    ...(role === "employer" || role === "admin"
      ? [
          {
            id: "nav-approvals",
            label: "Approvals",
            icon: ClipboardCheck,
            group: "Navigate",
            action: () => go("approvals"),
            keywords: [],
          },
          {
            id: "nav-reports",
            label: "Reports",
            icon: BarChart3,
            group: "Navigate",
            action: () => go("reports"),
            keywords: [],
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          {
            id: "nav-admin",
            label: "Admin",
            icon: Shield,
            group: "Navigate",
            action: () => go("admin"),
            keywords: [],
          },
        ]
      : []),
  ]
  // AFTER
  const isClocked0utForDay = !!clockEntry?.clock_out // has an entry AND it's finished

  const clockItems: CommandItem[] = isClocked0utForDay
    ? [] // already done for the day — show nothing
    : !isClockedIn
      ? [
          {
            id: "clock-in",
            label: "Clock In",
            sublabel: "Start your shift",
            icon: Play,
            group: "Clock",
            keywords: ["start", "begin", "work"],
            action: async () => {
              if (!employee) return
              await clockIn.mutateAsync(employee.id)
              toast.success("Clocked in!")
              onClose()
            },
          },
        ]
      : [
          {
            id: "clock-out",
            label: "Clock Out",
            sublabel: `${formatMinutes(workedMins)} worked today`,
            icon: Square,
            group: "Clock",
            keywords: ["stop", "end", "finish"],
            action: async () => {
              if (!employee || !clockEntry) return
              await clockOut.mutateAsync({
                entryId: clockEntry.id,
                employeeId: employee.id,
                totalMinutes: workedMins,
              })
              toast.success("Clocked out!")
              onClose()
            },
          },
        ]

  const actionItems: CommandItem[] = [
    {
      id: "action-settings",
      label: "Open Settings",
      icon: Settings,
      group: "Actions",
      keywords: ["preferences", "config"],
      action: () => {
        onOpenSettings()
        onClose()
      },
    },
    {
      id: "action-timeoff",
      label: "Request Time Off",
      icon: Calendar,
      group: "Actions",
      keywords: ["leave", "vacation", "sick"],
      action: () => {
        go("timeoff")
      },
    },
  ]

  // ── Employee search items ─────────────────────────────────────────────────
  const employeeItems: CommandItem[] = employees.map((emp) => ({
    id: `emp-${emp.id}`,
    label: `${emp.first_name} ${emp.last_name}`,
    sublabel: `${emp.job_title} · ${emp.department}`,
    icon: User,
    group: "People",
    keywords: [emp.email, emp.department, emp.job_title],
    action: () => {
      go("people")
      onClose()
    },
  }))

  // ── Filter all items by query ─────────────────────────────────────────────
  const allItems = [
    ...navItems,
    ...clockItems,
    ...actionItems,
    ...employeeItems,
  ]

  const filtered =
    query.trim() === ""
      ? [...clockItems, ...navItems, ...actionItems]
      : allItems.filter((item) => {
          const q = query.toLowerCase()
          return (
            item.label.toLowerCase().includes(q) ||
            item.sublabel?.toLowerCase().includes(q) ||
            item.keywords?.some((k) => k.toLowerCase().includes(q))
          )
        })

  // Group filtered items
  const grouped = filtered.reduce<Record<string, CommandItem[]>>(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item)
      return acc
    },
    {}
  )

  const flatFiltered = Object.values(grouped).flat()

  function go(tab: TabId) {
    onNavigate(tab)
    onClose()
  }

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, flatFiltered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        flatFiltered[selected]?.action()
      } else if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, flatFiltered, selected, onClose])

  // Reset selected when query changes
  useEffect(() => {
    setSelected(0)
  }, [query])

  if (!open) return null

  let itemIndex = 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 animate-in bg-black/10 fade-in-0"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-[20vh] left-1/2 z-50 w-full max-w-md -translate-x-1/2">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tabs, actions, employees…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {flatFiltered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <AlarmClock className="h-7 w-7 opacity-30" />
                <p className="text-sm">No results for "{query}"</p>
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {group}
                  </p>
                  {items.map((item) => {
                    const idx = itemIndex++
                    const isSelected = idx === selected
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={item.action}
                      >
                        <div
                          className={cn(
                            "shrink-0 rounded-md p-1.5",
                            isSelected ? "bg-primary/10" : "bg-muted"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-3.5 w-3.5",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.label}
                          </p>
                          {item.sublabel && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5">
                ↵
              </kbd>{" "}
              select
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5">
                ESC
              </kbd>{" "}
              close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
