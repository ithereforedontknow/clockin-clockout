import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  const activeFilterCount =
    [statusFilter, roleFilter, deptFilter].filter(Boolean).length +
    (search ? 1 : 0)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => onStatusFilterChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-[130px] border-none bg-muted/30 text-xs font-semibold shadow-none">
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
          <SelectTrigger className="h-9 w-[120px] border-none bg-muted/30 text-xs font-semibold shadow-none">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="employer">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={deptFilter || "all"}
          onValueChange={(v) => onDeptFilterChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-9 w-[150px] border-none bg-muted/30 text-xs font-semibold shadow-none">
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

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-xs font-bold text-primary hover:bg-primary/5"
            onClick={() => {
              onSearchChange("")
              onStatusFilterChange("")
              onRoleFilterChange("")
              onDeptFilterChange("")
            }}
          >
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  )
}
