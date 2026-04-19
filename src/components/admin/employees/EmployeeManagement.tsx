import { useState, useMemo } from "react"
import { UserPlus, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  useAllEmployees,
  useSetEmployeeStatus,
  useDepartments,
} from "@/lib/queries"
import { EmployeeFilters } from "./EmployeeFilters"
import { EmployeeTable } from "./EmployeeTable"
import { InviteEmployeeDialog } from "./InviteEmployeeDialog"
import { EditEmployeeDialog } from "./EditEmployeeDialog"
import { DeactivateConfirmDialog } from "./DeactivateConfirmDialog"
import type { Employee } from "@/lib/supabase"

const PAGE_SIZE = 10

export function EmployeeManagement() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [page, setPage] = useState(1)

  // Selection & Modals
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{
    employee: Employee
    action: "deactivate" | "reactivate"
  } | null>(null)

  // Data fetching
  const { data: employees = [], isLoading } = useAllEmployees(
    search,
    statusFilter,
    roleFilter,
    deptFilter
  )
  const { data: depts = [] } = useDepartments()
  const setStatus = useSetEmployeeStatus()

  const departments = useMemo(() => depts.map((d) => d.name), [depts])

  const totalPages = Math.ceil(employees.length / PAGE_SIZE)
  const paginated = useMemo(
    () => employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [employees, page]
  )

  return (
    <div className="animate-in space-y-5 duration-500 fade-in">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-muted/40 p-4 sm:flex-row sm:items-center">
        <EmployeeFilters
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
          roleFilter={roleFilter}
          onRoleFilterChange={(v) => {
            setRoleFilter(v)
            setPage(1)
          }}
          deptFilter={deptFilter}
          onDeptFilterChange={(v) => {
            setDeptFilter(v)
            setPage(1)
          }}
          departments={departments}
        />
        <Button
          onClick={() => setIsInviteOpen(true)}
          size="sm"
          className="h-9 shrink-0 gap-2 font-bold shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      <EmployeeTable
        employees={paginated}
        isLoading={isLoading}
        selected={selected}
        onToggleOne={(id) => {
          const next = new Set(selected)
          next.has(id) ? next.delete(id) : next.add(id)
          setSelected(next)
        }}
        onToggleAll={() =>
          setSelected(
            selected.size === paginated.length
              ? new Set()
              : new Set(paginated.map((e) => e.id))
          )
        }
        onEdit={(emp: Employee) => setEditTarget(emp)}
        onConfirmAction={(target: any) => setConfirmTarget(target)}
      />

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 pt-2">
        <p className="text-[11px] font-bold tracking-tight text-muted-foreground uppercase">
          Page {page} of {totalPages || 1} — {filtered.length} total results
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <InviteEmployeeDialog
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
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
          onConfirm={async () => {
            try {
              await setStatus.mutateAsync({
                id: confirmTarget.employee.id,
                status:
                  confirmTarget.action === "deactivate" ? "inactive" : "active",
              })
              setConfirmTarget(null)
            } catch (err: any) {
              toast.error(`Failed to update status: ${err.message}`)
            }
          }}
          isPending={setStatus.isPending}
        />
      )}
    </div>
  )
}
