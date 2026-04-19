import { Shield, UserCheck, UserX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Employee } from "@/lib/supabase"

export function AdminKpiStrip({
  employees,
  isLoading,
}: {
  employees: Employee[] | undefined
  isLoading: boolean
}) {
  const list = employees || []
  const active = list.filter((e) => e.employment_status === "active").length
  const inactive = list.filter((e) => e.employment_status === "inactive").length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Database Total"
        value={list.length}
        icon={Shield}
        isLoading={isLoading}
      />
      <StatCard
        label="Active Licenses"
        value={active}
        icon={UserCheck}
        isLoading={isLoading}
        color="text-emerald-600"
      />
      <StatCard
        label="Deactivated"
        value={inactive}
        icon={UserX}
        isLoading={isLoading}
        color={inactive > 0 ? "text-red-600" : ""}
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, isLoading, color }: any) {
  return (
    <Card className="border-none bg-card shadow-none ring-1 ring-border">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-12" />
          ) : (
            <p
              className={`mt-1 text-3xl font-black tracking-tighter tabular-nums ${color || "text-foreground"}`}
            >
              {value}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/50">
          <Icon className="h-6 w-6 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>
  )
}
