import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Lock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePermissions } from "@/lib/auth/permissions"
import { useEmployees } from "@/lib/queries"
import { EmployeeProfileSheet } from "@/components/EmployeeProfileSheet"
import type { Employee } from "@/lib/supabase"

const ROLE_STYLE: Record<string, string> = {
  employee: "border-slate-200 bg-slate-50 text-slate-600",
  employer: "border-blue-200 bg-blue-50 text-blue-700",
  admin: "border-purple-200 bg-purple-50 text-purple-700",
}

export function PeopleTab() {
  const { data: employees = [], isLoading } = useEmployees()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState("")
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const q = search.toLowerCase()
      return (
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.job_title?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
      )
    })
  }, [employees, search])

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const totalPages = Math.ceil(filtered.length / pageSize)

  if (!hasPermission("view_staff_directory")) {
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
            You do not have permission to view the staff directory.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <div className="mt-1 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              {employees.length} active members
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search by name, title, or department..."
            className="h-10 pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="py-8 text-center text-xs tracking-widest text-muted-foreground uppercase italic">
              Filter logic matches directory...
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Member
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Position
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold tracking-widest uppercase md:table-cell">
                Department
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Access Role
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 animate-pulse text-center"
                >
                  Loading directory...
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="group cursor-pointer transition-colors hover:bg-primary/[0.02]"
                  onClick={() => setSelectedEmp(emp)}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border shadow-sm">
                        <AvatarImage src={emp.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary">
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold transition-colors group-hover:text-primary">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground/80">
                      {emp.job_title || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {emp.department || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold uppercase ${ROLE_STYLE[emp.role]}`}
                    >
                      {emp.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <EmployeeProfileSheet
        employee={selectedEmp}
        onClose={() => setSelectedEmp(null)}
      />
    </div>
  )
}
