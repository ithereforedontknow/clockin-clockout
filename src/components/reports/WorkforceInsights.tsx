import { useMemo } from "react"
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns"
import { UserPlus, TrendingUp, Users, PieChart } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  employees: any[]
  isLoading?: boolean
}

export function WorkforceInsights({ employees, isLoading = false }: Props) {
  // 1. Data Calculation for Charts
  const { trendData, deptData, stats } = useMemo(() => {
    // Ensure the fallback has netChange: 0 instead of growth: 0
    if (!employees.length) {
      return {
        trendData: [],
        deptData: [],
        stats: { active: 0, netChange: 0 }, // Fixed: was growth
      }
    }

    // Department Distribution
    const deptMap: Record<string, number> = {}
    employees.forEach((emp) => {
      const dept = emp.department || "Unassigned"
      deptMap[dept] = (deptMap[dept] || 0) + 1
    })
    const deptData = Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 6-Month Hiring Trend
    const last6Months = Array.from({ length: 6 }, (_, i) =>
      startOfMonth(subMonths(new Date(), i))
    ).reverse()

    const trendData = last6Months.map((month) => {
      const hires = employees.filter(
        (emp) => emp.hire_date && isSameMonth(new Date(emp.hire_date), month)
      ).length
      const departures = employees.filter(
        (emp) =>
          emp.employment_status === "inactive" &&
          emp.updated_at &&
          isSameMonth(new Date(emp.updated_at), month)
      ).length

      return {
        month: format(month, "MMM"),
        hires,
        departures,
      }
    })

    const activeCount = employees.filter(
      (e) => e.employment_status === "active"
    ).length
    const thisMonthHires = trendData[5].hires
    const thisMonthDepartures = trendData[5].departures

    return {
      trendData,
      deptData,
      stats: {
        active: activeCount,
        netChange: thisMonthHires - thisMonthDepartures,
      },
    }
  }, [employees])

  if (isLoading) return <WorkforceInsightsSkeleton />

  return (
    <div className="animate-in space-y-6 duration-500 fade-in">
      {/* KPI Insight Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-none shadow-none ring-1 ring-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Active Headcount
              </p>
              <p className="text-2xl font-black tabular-nums">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none ring-1 ring-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Net Growth
              </p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums">
                {(stats.netChange ?? 0) > 0
                  ? `+${stats.netChange}`
                  : (stats.netChange ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-none ring-1 ring-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <PieChart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Departments
              </p>
              <p className="text-2xl font-black text-indigo-600 tabular-nums">
                {deptData.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              <TrendingUp className="h-3.5 w-3.5" /> 6-Month Staffing Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] min-w-0 pt-8">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{
                    fontWeight: 800,
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hires"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "hsl(var(--primary))",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                  name="New Hires"
                />
                <Line
                  type="monotone"
                  dataKey="departures"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Departures"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              <Users className="h-3.5 w-3.5" /> Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptData}
                layout="vertical"
                margin={{ left: 30, right: 30 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#1e293b" }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  name="Total Staff"
                >
                  {deptData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--primary) / ${1 - index * 0.15})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function WorkforceInsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    </div>
  )
}
