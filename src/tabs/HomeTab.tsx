import { useState } from "react"
import { format, startOfWeek } from "date-fns"
import {
  CalendarDays,
  Users,
  TrendingUp,
  Clock,
  PartyPopper,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  useCurrentEmployee,
  useWhosOut,
  useTimeOffBalances,
  useHolidays,
} from "@/lib/queries"
import { RequestTimeOffDialog } from "@/components/RequestTimeOffDialog"

export function HomeTab() {
  const [requestOpen, setRequestOpen] = useState(false)
  const weekStart = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  )

  const { data: employee, isLoading: empLoading } = useCurrentEmployee()
  const { data: whosOut = [], isLoading: whosOutLoading } =
    useWhosOut(weekStart)
  const { data: balances = [], isLoading: balancesLoading } =
    useTimeOffBalances(employee?.id)
  const { data: holidays = [] } = useHolidays()

  const upcomingHoliday = holidays.find((h) => new Date(h.date) >= new Date())

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          {empLoading ? (
            <Skeleton className="mb-2 h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-bold">
              Good {getGreeting()}, {employee?.first_name}!
            </h1>
          )}
          <p className="mt-1 text-sm">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button onClick={() => setRequestOpen(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {balancesLoading
          ? Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
          : balances.slice(0, 3).map((b) => (
              <Card
                key={b.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{b.category?.name}</p>
                      <p className="mt-1 text-3xl font-bold">
                        {b.balance}
                        <span className="ml-1 text-base font-normal">
                          {b.category?.unit}
                        </span>
                      </p>
                      {b.scheduled > 0 && (
                        <p className="mt-1 text-xs">
                          {b.scheduled} {b.category?.unit} scheduled
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg p-2">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Who's Out */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4" />
              Who's Out
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              Full Calendar
            </Button>
          </CardHeader>
          <CardContent>
            {whosOutLoading ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : whosOut.length === 0 ? (
              <p className="py-8 text-center text-sm">
                No one is out this week 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {whosOut.map((req) => {
                  const emp = req.employee
                  const initials = emp
                    ? `${emp.first_name[0]}${emp.last_name[0]}`
                    : "?"
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 border-b py-2 last:border-0"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={emp?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {emp?.first_name} {emp?.last_name}
                        </p>
                        <p className="text-xs">
                          {format(new Date(req.start_date), "MMM d")} –{" "}
                          {format(new Date(req.end_date), "MMM d")}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-xs"
                      >
                        {req.category?.name}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming holiday */}
          {upcomingHoliday && (
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg p-2 shadow-sm">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide uppercase">
                      Upcoming Holiday
                    </p>
                    <p className="mt-0.5 font-semibold">
                      {upcomingHoliday.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(upcomingHoliday.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Celebrations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <PartyPopper className="h-4 w-4" />
                Celebrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-sm">
                No celebrations this week
              </p>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CalendarDays className="h-4 w-4" />
                What's Happening
              </CardTitle>
            </CardHeader>
            <CardContent>
              {empLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="">Department: </span>
                    <span className="font-medium">{employee?.department}</span>
                  </div>
                  <div className="text-sm">
                    <span className="">Location: </span>
                    <span className="font-medium">{employee?.location}</span>
                  </div>
                  <div className="text-sm">
                    <span className="">Status: </span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {employee?.employment_status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RequestTimeOffDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}
