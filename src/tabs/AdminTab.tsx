import {
  Shield,
  UserCheck,
  UserX,
  Building2,
  Calendar,
  ShieldCheck,
  Tag,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAllEmployees } from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { EmployeeManagement } from "@/components/admin/employees/EmployeeManagement"
import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel"
import { HolidaysPanel } from "@/components/admin/HolidaysPanel"
import { AuditLogPanel } from "@/components/admin/AuditLogPanel"
import { CourseCategoriesPanel } from "@/components/admin/CourseCategoriesPanel"

export function AdminTab() {
  const { data: employees = [], isLoading } = useAllEmployees("", "", "", "")
  const { isAdmin } = usePermissions()

  if (!isAdmin) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Access restricted to admins only.
      </div>
    )
  }

  const activeCount = employees.filter(
    (e) => e.employment_status === "active"
  ).length
  const inactiveCount = employees.filter(
    (e) => e.employment_status === "inactive"
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage employees, departments, and system access
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Total Employees"
          value={employees.length}
          icon={Shield}
          isLoading={isLoading}
        />
        <KpiCard
          label="Active"
          value={activeCount}
          icon={UserCheck}
          isLoading={isLoading}
          highlight="green"
        />
        <KpiCard
          label="Inactive"
          value={inactiveCount}
          icon={UserX}
          isLoading={isLoading}
          highlight={inactiveCount > 0 ? "red" : undefined}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-5">
        <TabsList className="h-10 rounded-lg bg-muted/60 p-1">
          {[
            { value: "employees", label: "Employees", icon: Shield },
            { value: "departments", label: "Departments", icon: Building2 },
            {
              value: "course-categories",
              label: "Categories & Tags",
              icon: Tag,
            },
            { value: "holidays", label: "Holidays", icon: Calendar },
            { value: "audit", label: "Audit Log", icon: ShieldCheck },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 rounded-md px-3 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="employees">
          <EmployeeManagement />
        </TabsContent>
        <TabsContent value="departments" className="mt-5">
          <DepartmentsPanel />
        </TabsContent>
        <TabsContent value="course-categories" className="mt-5">
          <CourseCategoriesPanel />
        </TabsContent>
        <TabsContent value="holidays" className="mt-5">
          <HolidaysPanel />
        </TabsContent>
        <TabsContent value="audit" className="mt-5">
          <AuditLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KpiCard({
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
  const valueColor =
    highlight === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : highlight === "red" && value > 0
        ? "text-red-600 dark:text-red-400"
        : "text-foreground"

  return (
    <div className="rounded-xl border bg-card px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${valueColor}`}>
          {value}
        </p>
      )}
    </div>
  )
}
