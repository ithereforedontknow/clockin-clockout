// src/components/reports/WorkforceOverview.tsx
import { useMemo } from "react"
import { format, endOfMonth, startOfMonth, subMonths } from "date-fns"
import { UserPlus, UserMinus, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

export function WorkforceOverview({ employees }: Props) {
  const { stats, trendData } = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) =>
      subMonths(new Date(), i)
    ).reverse()

    const trendData = months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const newHires = employees.filter((emp) => {
        if (!emp.created_at) return false
        const joined = new Date(emp.created_at)
        return joined >= monthStart && joined <= monthEnd
      })

      const departures = employees.filter((emp) => {
        if (emp.employment_status !== "inactive" || !emp.updated_at)
          return false
        const left = new Date(emp.updated_at)
        return left >= monthStart && left <= monthEnd
      })

      return {
        month: format(month, "MMM"),
        newHires: newHires.length,
        departures: departures.length,
      }
    })

    const currentMonth = trendData[trendData.length - 1] || {
      newHires: 0,
      departures: 0,
    }

    return {
      stats: {
        total: employees.length,
        active: employees.filter((e) => e.employment_status === "active")
          .length,
        newHires: currentMonth.newHires,
        departures: currentMonth.departures,
      },
      trendData,
    }
  }, [employees])

  return (
    <Card>
      <CardContent className="p-6">
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
              <CardHeader className="p-3">
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
              <CardHeader className="p-3">
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
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">
                  Retention Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {stats.total > 0
                    ? Math.round(
                        ((stats.total - stats.departures) / stats.total) * 100
                      )
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Hiring vs Departures Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newHires"
                      stroke="#16a34a"
                      strokeWidth={3}
                      name="New Hires"
                      dot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="departures"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="Departures"
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>{" "}
      </CardContent>
    </Card>
  )
}
