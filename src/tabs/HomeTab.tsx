import { useState, useEffect } from "react"
import { format, startOfWeek } from "date-fns"
import {
  Calendar,
  LayoutDashboard,
  Users,
  CalendarClock,
  GraduationCap,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

import {
  useCurrentEmployee,
  useWhosOut,
  useTimeOffBalances,
  useHolidays,
  useTodayClockEntry,
  useClockIn,
  useClockOut,
  useStartBreak,
  useEndBreak,
  useLiveClockedIn,
  usePendingTimeOffRequests,
  useMyTrainingRecord,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { liveMinutes } from "@/lib/supabase"
import type { TabId } from "@/components/AppShell"

import {
  DashboardHeader,
  TimeClockCard,
  QuickLinkCard,
  AnnouncementsCard,
  LiveClockedInCard,
  WhosOutCard,
  LeaveBalancesCard,
  PtoApprovalsCard,
  MyCoursesCard,
} from "@/components/home"
import { RequestTimeOffDialog } from "@/components/RequestTimeOffDialog"

interface Props {
  onNavigate?: (tab: TabId) => void
}

export function HomeTab({ onNavigate }: Props) {
  const [requestOpen, setRequestOpen] = useState(false)
  const [, setTick] = useState(0)

  const { data: employee, isLoading: empLoading } = useCurrentEmployee()
  const employeeId = employee?.id ?? ""
  const { hasPermission } = usePermissions()
  const canViewApprovals = hasPermission("approve_time_off")

  const weekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  )
  const { data: entry, isLoading: clockLoading } =
    useTodayClockEntry(employeeId)
  const { data: whosOut = [] } = useWhosOut(weekStart)
  const { data: liveEntries = [] } = useLiveClockedIn()
  const { data: balances = [], isLoading: balancesLoading } =
    useTimeOffBalances(employeeId)
  const { data: holidays = [] } = useHolidays()
  const { data: pendingTimeOff = [] } = usePendingTimeOffRequests()
  const { data: trainingRecords = [] } = useMyTrainingRecord()

  const clockIn = useClockIn()
  const clockOut = useClockOut()
  const startBreak = useStartBreak()
  const endBreak = useEndBreak()

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const isClockedIn = !!entry && !entry.clock_out
  const openBreak = entry?.breaks?.find((b: any) => !b.break_end) ?? null
  const isOnBreak = !!openBreak

  const completedBreakMins = (entry?.breaks ?? []).reduce(
    (s: number, b: any) => s + (b.duration_minutes ?? 0),
    0
  )
  const liveBreakMins = openBreak
    ? Math.floor(
        (Date.now() - new Date(openBreak.break_start).getTime()) / 60000
      )
    : 0
  const totalBreakMins = completedBreakMins + liveBreakMins
  const workedMins = isClockedIn
    ? liveMinutes(entry!.clock_in, totalBreakMins)
    : (entry?.total_minutes ?? 0)

  async function handleMainButton() {
    if (!employeeId) return
    if (!isClockedIn) {
      await clockIn.mutateAsync(employeeId)
      toast.success("Clocked in")
    } else {
      await clockOut.mutateAsync({
        entryId: entry!.id,
        employeeId,
        totalMinutes: workedMins,
      })
      toast.success("Clocked out")
    }
  }

  async function handleBreakButton() {
    if (!entry || !employeeId) return
    if (isOnBreak) {
      await endBreak.mutateAsync({
        breakId: openBreak!.id,
        employeeId,
        durationMinutes: liveBreakMins,
      })
      toast.success("Break ended")
    } else {
      await startBreak.mutateAsync({ entryId: entry.id, employeeId })
      toast.info("Break started")
    }
  }

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      <DashboardHeader
        employeeName={employee?.first_name}
        isLoading={empLoading}
        holidays={holidays}
        onRequestPto={() => setRequestOpen(true)}
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
          <TimeClockCard
            employee={employee}
            entry={entry}
            workedMins={workedMins}
            isOnBreak={isOnBreak}
            isClockedIn={isClockedIn}
            liveBreakMins={liveBreakMins}
            clockLoading={clockLoading}
            isMutating={
              clockIn.isPending ||
              clockOut.isPending ||
              startBreak.isPending ||
              endBreak.isPending
            }
            onMainButton={handleMainButton}
            onBreakButton={handleBreakButton}
          />

          <div className="space-y-4">
            <h3 className="px-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Quick Access
            </h3>
            <QuickLinkCard
              eyebrow="Schedule a Check-in"
              title="May Damoslog"
              description="Book a personal check-in session"
              href="https://calendly.com/may-staffolio/check-in?month=2026-04"
              label="Book a Session"
              icon={Calendar}
            />
            <QuickLinkCard
              eyebrow="Task Journal"
              title="Client Story"
              description="A living file that outlines client requirements, assumptions, and processes."
              href="https://docs.google.com/spreadsheets/d/12sEDRREQH5nhCtGWZqMFlH1_vhXbUmY_/edit?pli=1&gid=1474562549#gid=1474562549"
              label="Open Task Journal"
              icon={Calendar}
            />
          </div>
        </aside>

        <main className="lg:col-span-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="h-10 rounded-lg bg-muted/60 p-1">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>

              <TabsTrigger
                value="team"
                className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5" />
                Team
              </TabsTrigger>

              <TabsTrigger
                value="timeoff"
                className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Time Off
              </TabsTrigger>

              <TabsTrigger
                value="training"
                className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Training
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {employee && <AnnouncementsCard currentEmployee={employee} />}
            </TabsContent>

            <TabsContent value="team">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <LiveClockedInCard liveEntries={liveEntries} />
                <WhosOutCard whosOut={whosOut} />
              </div>
            </TabsContent>

            <TabsContent value="timeoff">
              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                <LeaveBalancesCard
                  balances={balances}
                  isLoading={balancesLoading}
                />
                {canViewApprovals && (
                  <PtoApprovalsCard
                    pendingTimeOff={pendingTimeOff}
                    employeeId={employeeId}
                    onNavigate={onNavigate}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="training">
              <MyCoursesCard
                trainingRecords={trainingRecords}
                onNavigate={onNavigate}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <RequestTimeOffDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}
