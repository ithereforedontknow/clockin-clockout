import { useState } from "react"
import {
  Search,
  UserPlus,
  Pencil,
  UserX,
  UserCheck,
  Download,
  MoreHorizontal,
  Shield,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAllEmployees,
  useAdminUpdateEmployee,
  useSetEmployeeStatus,
  useInviteEmployee,
} from "@/lib/queries"
import type { Employee, UserRole } from "@/lib/supabase"

// ─── Status + role badge helpers ─────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  inactive: "bg-red-50 text-red-700 border-red-200",
  on_leave: "bg-amber-50 text-amber-700 border-amber-200",
}
const ROLE_STYLE: Record<string, string> = {
  employee: "bg-slate-50 text-slate-600 border-slate-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminTab() {
  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Dialogs
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

  // Derived
  const departments = [
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ].sort()
  const allSelected =
    employees.length > 0 && employees.every((e) => selected.has(e.id))

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(employees.map((e) => e.id)))
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  // Bulk deactivate
  async function handleBulkDeactivate() {
    const ids = [...selected].filter(
      (id) => employees.find((e) => e.id === id)?.employment_status === "active"
    )
    if (!ids.length) {
      toast.error("No active employees selected")
      return
    }
    await Promise.all(
      ids.map((id) => setStatus.mutateAsync({ id, status: "inactive" }))
    )
    toast.success(
      `${ids.length} employee${ids.length > 1 ? "s" : ""} deactivated`
    )
    setSelected(new Set())
  }

  // Bulk CSV export
  function handleExport() {
    const rows = [
      [
        "Name",
        "Email",
        "Role",
        "Department",
        "Job Title",
        "Location",
        "Status",
        "Hire Date",
        "Std Hrs/Day",
        "Std Hrs/Week",
      ],
      ...employees.map((e) => [
        `${e.first_name} ${e.last_name}`,
        e.email,
        e.role,
        e.department,
        e.job_title,
        e.location,
        e.employment_status,
        e.hire_date,
        String(e.standard_hours_per_day),
        String(e.standard_hours_per_week),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `employees-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(url)
  }

  // Confirm deactivate / reactivate
  async function handleConfirmAction() {
    if (!confirmTarget) return
    const status = confirmTarget.action === "deactivate" ? "inactive" : "active"
    await setStatus.mutateAsync({ id: confirmTarget.employee.id, status })
    toast.success(
      confirmTarget.action === "deactivate"
        ? `${confirmTarget.employee.first_name} deactivated`
        : `${confirmTarget.employee.first_name} reactivated`
    )
    setConfirmTarget(null)
  }

  // KPI counts
  const activeCount = employees.filter(
    (e) => e.employment_status === "active"
  ).length
  const inactiveCount = employees.filter(
    (e) => e.employment_status === "inactive"
  ).length
  const adminCount = employees.filter((e) => e.role === "admin").length

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage employees, roles, and access
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
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

      {/* Filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={roleFilter || "all"}
          onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={deptFilter || "all"}
          onValueChange={(v) => setDeptFilter(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={setStatus.isPending}
                onClick={handleBulkDeactivate}
              >
                <UserX className="mr-2 h-3.5 w-3.5" />
                Deactivate selected
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Employee table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 opacity-40" />
              <p className="text-sm">No employees found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hired</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className={selected.has(emp.id) ? "bg-muted/40" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(emp.id)}
                        onCheckedChange={() => toggleOne(emp.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={emp.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {emp.first_name} {emp.last_name}
                            {emp.preferred_name && (
                              <span className="ml-1 font-normal text-muted-foreground">
                                ({emp.preferred_name})
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${ROLE_STYLE[emp.role]}`}
                      >
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.department || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.standard_hours_per_day}h/day
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${STATUS_STYLE[emp.employment_status]}`}
                      >
                        {emp.employment_status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {emp.hire_date
                        ? format(new Date(emp.hire_date), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(emp)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {emp.employment_status === "active" ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setConfirmTarget({
                                  employee: emp,
                                  action: "deactivate",
                                })
                              }
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmTarget({
                                  employee: emp,
                                  action: "reactivate",
                                })
                              }
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-right text-xs text-muted-foreground">
        {employees.length} employee{employees.length !== 1 ? "s" : ""} shown
      </p>

      {/* ── Invite dialog ── */}
      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* ── Edit dialog ── */}
      {editTarget && (
        <EditEmployeeDialog
          employee={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* ── Confirm deactivate/reactivate ── */}
      {confirmTarget && (
        <Dialog open onOpenChange={() => setConfirmTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {confirmTarget.action === "deactivate"
                  ? "Deactivate"
                  : "Reactivate"}{" "}
                {confirmTarget.employee.first_name}?
              </DialogTitle>
              <DialogDescription>
                {confirmTarget.action === "deactivate"
                  ? "This employee will be marked inactive and will no longer appear in the directory. They will not be able to use the app."
                  : "This employee will be restored to active status and regain access to the app."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmTarget(null)}>
                Cancel
              </Button>
              <Button
                variant={
                  confirmTarget.action === "deactivate"
                    ? "destructive"
                    : "default"
                }
                disabled={setStatus.isPending}
                onClick={handleConfirmAction}
              >
                {setStatus.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {confirmTarget.action === "deactivate"
                  ? "Deactivate"
                  : "Reactivate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── Invite dialog ─────────────────────────────────────────────────────────────

function InviteDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const invite = useInviteEmployee()
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "employee" as UserRole,
    department: "",
    job_title: "",
    location: "",
    standard_hours_per_day: 8,
    standard_hours_per_week: 40,
  })

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function reset() {
    setForm({
      email: "",
      first_name: "",
      last_name: "",
      role: "employee",
      department: "",
      job_title: "",
      location: "",
      standard_hours_per_day: 8,
      standard_hours_per_week: 40,
    })
  }

  async function handleSubmit() {
    if (!form.email || !form.first_name || !form.last_name) {
      toast.error("Email, first name and last name are required")
      return
    }
    await invite.mutateAsync(form)
    toast.success(`Employee record created for ${form.email}`, {
      description: `${form.first_name} can now sign in using their work email.`,
    })
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Creates an employee record. They sign in themselves using their work
            email via magic link — no invite email is sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Jane"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">
                Last name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Doe"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Work email <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <Separator />

          {/* Role + department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => set("role", v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Department</Label>
              <Input
                placeholder="Engineering"
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Job title</Label>
              <Input
                placeholder="Software Engineer"
                value={form.job_title}
                onChange={(e) => set("job_title", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Location</Label>
              <Input
                placeholder="Manila"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>

          {/* Work hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Std hours / day</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={form.standard_hours_per_day}
                onChange={(e) =>
                  set("standard_hours_per_day", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Std hours / week</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={form.standard_hours_per_week}
                onChange={(e) =>
                  set("standard_hours_per_week", Number(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button disabled={invite.isPending} onClick={handleSubmit}>
            {invite.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Employee
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit employee dialog ──────────────────────────────────────────────────────

function EditEmployeeDialog({
  employee: emp,
  onClose,
}: {
  employee: Employee
  onClose: () => void
}) {
  const update = useAdminUpdateEmployee()
  const [form, setForm] = useState({
    first_name: emp.first_name,
    last_name: emp.last_name,
    job_title: emp.job_title,
    department: emp.department,
    location: emp.location,
    role: emp.role as UserRole,
    standard_hours_per_day: emp.standard_hours_per_day,
    standard_hours_per_week: emp.standard_hours_per_week,
    standard_start_time: emp.standard_start_time ?? "09:00",
  })

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    await update.mutateAsync({ id: emp.id, updates: form })
    toast.success("Employee updated")
    onClose()
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit — {emp.first_name} {emp.last_name}
          </DialogTitle>
          <DialogDescription>
            Changes take effect immediately and bypass the approval workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">First name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Last name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => set("role", v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Department</Label>
              <Input
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Job title</Label>
              <Input
                value={form.job_title}
                onChange={(e) => set("job_title", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Hrs / day</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={form.standard_hours_per_day}
                onChange={(e) =>
                  set("standard_hours_per_day", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Hrs / week</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={form.standard_hours_per_week}
                onChange={(e) =>
                  set("standard_hours_per_week", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Start time</Label>
              <Input
                type="time"
                value={form.standard_start_time}
                onChange={(e) => set("standard_start_time", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={handleSave}>
            {update.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

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
