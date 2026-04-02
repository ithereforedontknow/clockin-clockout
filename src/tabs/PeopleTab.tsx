import { useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmployees, useCurrentEmployee, useMyTeam } from "@/lib/queries"
import { EmployeeProfileSheet } from "@/components/EmployeeProfileSheet"
import type { Employee } from "@/lib/supabase"

const ROLE_STYLE: Record<string, string> = {
  employee: "bg-slate-100 text-slate-600",
  employer: "bg-blue-50 text-blue-700",
  admin: "bg-purple-50 text-purple-700",
}

export function PeopleTab() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Employee | null>(null)

  const { data: currentEmployee } = useCurrentEmployee()
  const role = currentEmployee?.role ?? "employee"
  const isEmployer = role === "employer"
  const isAdmin = role === "admin"

  const { data: allEmployees = [], isLoading: allLoading } = useEmployees()
  const { data: myTeam = [], isLoading: teamLoading } = useMyTeam(
    isEmployer ? (currentEmployee?.id ?? "") : ""
  )

  const employees = isEmployer ? myTeam : allEmployees
  const isLoading = isEmployer ? teamLoading : allLoading

  const filtered: Employee[] = employees.filter((e: Employee) => {
    const q = search.toLowerCase()
    return (
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.job_title.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    )
  })

  const grouped: Record<string, Employee[]> = isAdmin
    ? {
        Employers: filtered.filter((e: Employee) => e.role === "employer"),
        Employees: filtered.filter((e: Employee) => e.role === "employee"),
        Admins: filtered.filter((e: Employee) => e.role === "admin"),
      }
    : { "Team Members": filtered }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEmployer
              ? `Your team · ${employees.length} member${employees.length !== 1 ? "s" : ""}`
              : `${employees.length} active employee${employees.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, role, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {search ? `No results for "${search}"` : "No team members yet"}
        </div>
      ) : (
        Object.entries(grouped).map(([group, members]) => {
          if (!members.length) return null
          return (
            <div key={group} className="space-y-3">
              {isAdmin && (
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  {group} · {members.length}
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((emp: Employee) => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    onClick={() => setSelected(emp)}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}

      <EmployeeProfileSheet
        employee={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function EmployeeCard({
  employee: emp,
  onClick,
}: {
  employee: Employee
  onClick: () => void
}) {
  const initials = `${emp.first_name[0]}${emp.last_name[0]}`
  return (
    <Card
      className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={emp.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium transition-colors group-hover:text-primary">
              {emp.preferred_name ?? emp.first_name} {emp.last_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {emp.job_title || emp.department || "—"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={`text-xs capitalize ${ROLE_STYLE[emp.role] ?? ""}`}
          >
            {emp.role}
          </Badge>
          {emp.department && (
            <Badge variant="secondary" className="text-xs">
              {emp.department}
            </Badge>
          )}
        </div>
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {emp.email}
        </p>
      </CardContent>
    </Card>
  )
}
