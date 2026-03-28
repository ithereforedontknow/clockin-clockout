import { useState } from "react"
import { Search, LayoutGrid, Network } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmployees } from "@/lib/queries"
import type { Employee } from "@/lib/supabase"

type View = "directory" | "org"

export function PeopleTab() {
  const [view, setView] = useState<View>("directory")
  const [search, setSearch] = useState("")
  const { data: employees = [], isLoading } = useEmployees()

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    return (
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.job_title.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "directory" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("directory")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Directory
          </Button>
          <Button
            variant={view === "org" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("org")}
          >
            <Network className="mr-2 h-4 w-4" />
            Org Chart
          </Button>
        </div>
      </div>

      {view === "directory" ? (
        <>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, department, or title…"
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
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="mb-2 h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No employees found matching "{search}"
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} />
              ))}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {employees.length} employees
          </p>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Network className="h-12 w-12 text-muted" />
            <p className="font-medium">Org Chart</p>
            <p className="text-sm">
              Connect your org data to render the reporting structure here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmployeeCard({ employee: emp }: { employee: Employee }) {
  const initials = `${emp.first_name[0]}${emp.last_name[0]}`
  return (
    <Card className="group cursor-pointer transition-shadow hover:shadow-md">
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
              {emp.first_name} {emp.last_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {emp.job_title}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {emp.department}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {emp.location}
          </Badge>
        </div>
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {emp.email}
        </p>
      </CardContent>
    </Card>
  )
}
