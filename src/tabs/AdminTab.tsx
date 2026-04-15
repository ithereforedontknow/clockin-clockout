import {
  Shield,
  UserCheck,
  UserX,
  Building2,
  Calendar,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAllEmployees } from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { EmployeeManagement } from "@/components/admin/EmployeeManagement"
import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel"
import { HolidaysPanel } from "@/components/admin/HolidaysPanel"
import { AuditLogPanel } from "@/components/admin/AuditLogPanel"

export function AdminTab() {
  const { data: employees = [], isLoading } = useAllEmployees("", "", "", "")
  const { isAdmin } = usePermissions()
  const activeCount = employees.filter(
    (e) => e.employment_status === "active"
  ).length
  const inactiveCount = employees.filter(
    (e) => e.employment_status === "inactive"
  ).length
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Access restricted to admins only.
      </div>
    )
  }
  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-1 text-muted-foreground">
            Manage employees, departments, and access
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="Total Employees"
          value={employees.length}
          icon={Shield}
          isLoading={isLoading}
        />
        <KPICard
          label="Active"
          value={activeCount}
          icon={UserCheck}
          isLoading={isLoading}
          highlight="green"
        />
        <KPICard
          label="Inactive"
          value={inactiveCount}
          icon={UserX}
          isLoading={isLoading}
          highlight={inactiveCount > 0 ? "red" : undefined}
        />
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" className="gap-2">
            <Shield className="h-4 w-4" /> Employees
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2">
            <Calendar className="h-4 w-4" /> Holidays
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <EmployeeManagement />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsPanel />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidaysPanel />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// KPICard stays here since it's only used by AdminTab
function KPICard({
  label,
  value,
  icon: Icon,
  isLoading,
  highlight,
}: {
  label: string
  value: number
  icon: typeof Shield
  isLoading: boolean
  highlight?: "green" | "red"
}) {
  const color =
    highlight === "green"
      ? "text-green-600"
      : highlight === "red" && value > 0
        ? "text-red-600"
        : ""
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4 pb-4">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-10" />
          ) : (
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
