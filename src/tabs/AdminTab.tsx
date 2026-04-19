import { useState } from "react"
import {
  Shield,
  Building2,
  Tag,
  Calendar,
  ShieldCheck,
  Lock,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAllEmployees } from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"

import {
  AdminKpiStrip,
  EmployeeManagement,
  DepartmentsPanel,
  CourseCategoriesPanel,
  HolidaysPanel,
  AuditLogPanel,
} from "@/components/admin"

export function AdminTab() {
  const { isAdmin } = usePermissions()
  const { data: employees = [], isLoading } = useAllEmployees("", "", "", "")
  const [activeTab, setActiveTab] = useState("employees")

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/50">
          <Lock className="h-8 w-8 text-muted-foreground/20" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
            Access Restricted
          </p>
          <p className="text-sm text-muted-foreground">
            Administrative privileges are required to view this module.
          </p>
        </div>
      </div>
    )
  }

  const navItems = [
    { value: "employees", label: "Employees", icon: Shield },
    { value: "departments", label: "Departments", icon: Building2 },
    { value: "taxonomy", label: "Taxonomy", icon: Tag },
    { value: "holidays", label: "Holidays", icon: Calendar },
    { value: "audit", label: "Audit Log", icon: ShieldCheck },
  ]

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            System Administration
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Manage global workspace configurations, staff records, and audit
            history.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <AdminKpiStrip employees={employees} isLoading={isLoading} />

      {/* Tabs Layout matching TrainingTab */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="h-10 w-full justify-start rounded-lg bg-muted/60 p-1 sm:w-auto">
          {navItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="flex items-center gap-2 rounded-md px-4 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-0">
          <TabsContent
            value="employees"
            className="mt-0 animate-in duration-300 fade-in slide-in-from-bottom-2 focus-visible:outline-none"
          >
            <EmployeeManagement />
          </TabsContent>

          <TabsContent
            value="departments"
            className="mt-0 animate-in duration-300 fade-in slide-in-from-bottom-2 focus-visible:outline-none"
          >
            <DepartmentsPanel />
          </TabsContent>

          <TabsContent
            value="taxonomy"
            className="mt-0 animate-in duration-300 fade-in slide-in-from-bottom-2 focus-visible:outline-none"
          >
            <CourseCategoriesPanel />
          </TabsContent>

          <TabsContent
            value="holidays"
            className="mt-0 animate-in duration-300 fade-in slide-in-from-bottom-2 focus-visible:outline-none"
          >
            <HolidaysPanel />
          </TabsContent>

          <TabsContent
            value="audit"
            className="mt-0 animate-in duration-300 fade-in slide-in-from-bottom-2 focus-visible:outline-none"
          >
            <AuditLogPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
