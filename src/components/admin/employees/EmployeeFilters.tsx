import { Search, X, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
  deptFilter: string
  onDeptFilterChange: (value: string) => void
  departments: string[]
}

export function EmployeeFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  deptFilter,
  onDeptFilterChange,
  departments,
}: Props) {
  const activeFilterCount = [
    search,
    statusFilter,
    roleFilter,
    deptFilter,
  ].filter(Boolean).length

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or title…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-8 pl-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => onStatusFilterChange(v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={roleFilter || "all"}
            onValueChange={(v) => onRoleFilterChange(v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="employer">Employer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          {departments.length > 0 && (
            <Select
              value={deptFilter || "all"}
              onValueChange={(v) => onDeptFilterChange(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                onSearchChange("")
                onStatusFilterChange("")
                onRoleFilterChange("")
                onDeptFilterChange("")
              }}
            >
              <X className="h-3 w-3" />
              Clear
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] tabular-nums"
              >
                {activeFilterCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
