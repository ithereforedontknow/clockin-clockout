import { useMemo } from "react"
import { format, subMonths } from "date-fns"
import { UserPlus, UserMinus, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { Employee } from "@/lib/supabase"

interface Props {
  employees: Employee[]
  isLoading?: boolean
}

export function WorkforceOverview({ employees, isLoading = false }: Props) {
  const { stats, trendData } = useMemo(() => {
    if (isLoading || !employees.length) {
      return {
        stats: {
          total: 0,
          active: 0,
          newHires: 0,
          departures: 0,
          retentionRate: 0,
        },
        trendData: [],
      }
    }

    // Pre‑compute monthly aggregates in a single pass
    const hiresByMonth: Record<string, number> = {}
    const departuresByMonth: Record<string, number> = {}
    let totalActive = 0

    // For retention: we need employees present 6 months ago
    const sixMonthsAgo = subMonths(new Date(), 6)
    let employeesSixMonthsAgo = 0

    employees.forEach((emp) => {
      // Active count
      if (emp.employment_status === "active") totalActive++

      // Count employees who were active 6 months ago (for retention)
      if (emp.created_at && new Date(emp.created_at) <= sixMonthsAgo) {
        if (!emp.terminated_at || new Date(emp.terminated_at) > sixMonthsAgo) {
          employeesSixMonthsAgo++
        }
      }

      // New hires by month
      if (emp.created_at) {
        const monthKey = format(new Date(emp.created_at), "yyyy-MM")
        hiresByMonth[monthKey] = (hiresByMonth[monthKey] || 0) + 1
      }

      // Departures by month (using terminated_at; fallback to updated_at if missing)
      if (emp.employment_status === "inactive") {
        const departureDate = emp.terminated_at
          ? new Date(emp.terminated_at)
          : emp.updated_at
            ? new Date(emp.updated_at)
            : null

        if (departureDate) {
          const monthKey = format(departureDate, "yyyy-MM")
          departuresByMonth[monthKey] = (departuresByMonth[monthKey] || 0) + 1
        }
      }
    })

    // Build trend data for last 6 months
    const months = Array.from({ length: 6 }, (_, i) =>
      subMonths(new Date(), i)
    ).reverse()
    const trendData = months.map((month) => {
      const key = format(month, "yyyy-MM")
      return {
        month: format(month, "MMM"),
        newHires: hiresByMonth[key] || 0,
        departures: departuresByMonth[key] || 0,
      }
    })

    // Current month stats (last element)
    const currentMonth = trendData[trendData.length - 1] || {
      newHires: 0,
      departures: 0,
    }

    // True retention rate: (employees still active from 6 months ago) / (employees 6 months ago)
    let retentionRate = 0
    if (employeesSixMonthsAgo > 0) {
      // Count how many of those original employees are still active
      const stillActive = employees.filter((emp) => {
        if (!emp.created_at) return false
        const created = new Date(emp.created_at)
        return created <= sixMonthsAgo && emp.employment_status === "active"
      }).length
      retentionRate = Math.round((stillActive / employeesSixMonthsAgo) * 100)
    }

    return {
      stats: {
        total: employees.length,
        active: totalActive,
        newHires: currentMonth.newHires,
        departures: currentMonth.departures,
        retentionRate,
      },
      trendData,
    }
  }, [employees, isLoading])

  if (isLoading) {
    return <WorkforceOverviewSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Headcount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.total}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600">
              <UserPlus className="h-4 w-4" /> New Hires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">
              {stats.newHires}
            </p>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600">
              <UserMinus className="h-4 w-4" /> Departures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-600">
              {stats.departures}
            </p>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" /> 6‑Month Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.retentionRate}%</p>
            <p className="text-sm text-muted-foreground">Employees retained</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Hiring vs Departures Trend
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly comparison over the last 6 months
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted-foreground) / 0.2)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                />
                <Line
                  type="monotone"
                  dataKey="newHires"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="New Hires"
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="departures"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  name="Departures"
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 6, fill: "#f43f5e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WorkforceOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
