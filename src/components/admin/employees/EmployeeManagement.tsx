import { useState, useMemo } from "react"
import { UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAllEmployees, useSetEmployeeStatus } from "@/lib/queries"
import { EmployeeFilters } from "./EmployeeFilters"
import { EmployeeTable } from "./EmployeeTable"
import { EmployeeBulkActions } from "./EmployeeBulkActions"
import { InviteEmployeeDialog } from "./InviteEmployeeDialog"
import { EditEmployeeDialog } from "./EditEmployeeDialog"
import { DeactivateConfirmDialog } from "./DeactivateConfirmDialog"
import { EmployeeTableSkeleton } from "./EmployeeTableSkeleton"
import { EmptyState } from "./EmptyState"
import type { Employee } from "@/lib/supabase"

const PAGE_SIZE = 10

export function EmployeeManagement() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{
    employee: Employee
    action: "deactivate" | "reactivate"
  } | null>(null)

  const { data: employees = [], isLoading } = useAllEmployees(
    search,
    statusFilter,
    roleFilter,
    deptFilter
  )
  const setStatus = useSetEmployeeStatus()

  // Reset page on filter change
  useMemo(() => {
    setPage(1)
  }, [search, statusFilter, roleFilter, deptFilter])

  const departments = useMemo(
    () =>
      [
        ...new Set(employees.map((e) => e.department).filter(Boolean)),
      ].sort() as string[],
    [employees]
  )

  const totalPages = Math.ceil(employees.length / PAGE_SIZE)
  const paginatedEmployees = useMemo(
    () => employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [employees, page]
  )

  const allSelected =
    paginatedEmployees.length > 0 &&
    paginatedEmployees.every((e) => selected.has(e.id))

  function toggleAll() {
    allSelected
      ? setSelected(new Set())
      : setSelected(new Set(paginatedEmployees.map((e) => e.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDeactivate() {
    const ids = [...selected].filter(
      (id) => employees.find((e) => e.id === id)?.employment_status === "active"
    )
    if (!ids.length) return
    await Promise.all(
      ids.map((id) => setStatus.mutateAsync({ id, status: "inactive" }))
    )
    setSelected(new Set())
  }

  function handleExport() {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Department",
      "Job Title",
      "Location",
      "Status",
      "Hire Date",
      "Hrs/Day",
      "Hrs/Week",
    ]
    const rows = employees.map((e) => [
      `${e.first_name} ${e.last_name}`,
      e.email,
      e.role,
      e.department || "",
      e.job_title || "",
      e.location || "",
      e.employment_status,
      e.hire_date || "",
      String(e.standard_hours_per_day),
      String(e.standard_hours_per_week),
    ])
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `employees-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleConfirmAction() {
    if (!confirmTarget) return
    await setStatus.mutateAsync({
      id: confirmTarget.employee.id,
      status: confirmTarget.action === "deactivate" ? "inactive" : "active",
    })
    setConfirmTarget(null)
  }

  const hasFilters = !!(search || statusFilter || roleFilter || deptFilter)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Employees</h2>
            {!isLoading && (
              <Badge variant="secondary" className="font-normal tabular-nums">
                {employees.length}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage team members and their account permissions.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setInviteOpen(true)}
          className="shrink-0 gap-1.5"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        departments={departments}
      />

      {/* Bulk actions */}
      <EmployeeBulkActions
        selectedCount={selected.size}
        onClearSelection={() => setSelected(new Set())}
        onBulkDeactivate={handleBulkDeactivate}
        onExport={handleExport}
        isDeactivating={setStatus.isPending}
      />

      {/* Content */}
      {isLoading ? (
        <EmployeeTableSkeleton />
      ) : employees.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onClearFilters={() => {
            setSearch("")
            setStatusFilter("")
            setRoleFilter("")
            setDeptFilter("")
          }}
          onAddEmployee={() => setInviteOpen(true)}
        />
      ) : (
        <>
          <EmployeeTable
            employees={paginatedEmployees}
            selected={selected}
            onToggleAll={toggleAll}
            onToggleOne={toggleOne}
            allSelected={allSelected}
            onEdit={setEditTarget}
            onConfirmAction={setConfirmTarget}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium tabular-nums">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>
                {" – "}
                <span className="font-medium tabular-nums">
                  {Math.min(page * PAGE_SIZE, employees.length)}
                </span>
                {" of "}
                <span className="font-medium tabular-nums">
                  {employees.length}
                </span>
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) pageNum = i + 1
                  else if (page <= 3) pageNum = i + 1
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = page - 2 + i

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs tabular-nums"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <InviteEmployeeDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
      {editTarget && (
        <EditEmployeeDialog
          employee={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
      {confirmTarget && (
        <DeactivateConfirmDialog
          target={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirm={handleConfirmAction}
          isPending={setStatus.isPending}
        />
      )}
    </div>
  )
}
