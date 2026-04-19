import { useState } from "react"
import {
  Loader2,
  Save,
  Clock,
  Briefcase,
  Users,
  Calendar,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAdminUpdateEmployee,
  useDepartments,
  useAllEmployees,
  useTimeOffBalances,
  useSetTimeOffBalance,
} from "@/lib/queries"
import type { Employee, UserRole } from "@/lib/supabase"

interface Props {
  employee: Employee
  onClose: () => void
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  label,
}: {
  icon: typeof Users
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </h3>
    </div>
  )
}

export function EditEmployeeDialog({ employee: emp, onClose }: Props) {
  const update = useAdminUpdateEmployee()
  const { data: departments = [] } = useDepartments()
  const { data: allEmployees = [] } = useAllEmployees()
  const { data: balances = [] } = useTimeOffBalances(emp.id)
  const setBalance = useSetTimeOffBalance()

  const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  const employers = allEmployees.filter(
    (e) => e.role === "employer" && e.id !== emp.id
  )

  const [form, setForm] = useState({
    first_name: emp.first_name,
    last_name: emp.last_name,
    job_title: emp.job_title || "",
    department: emp.department || "",
    location: emp.location || "",
    role: emp.role as UserRole,
    manager_id: emp.manager_id ?? "",
    standard_hours_per_day: emp.standard_hours_per_day,
    standard_hours_per_week: emp.standard_hours_per_week,
    standard_start_time: emp.standard_start_time ?? "09:00",
  })

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setIsDirty(true)
  }

  async function handleSave() {
    try {
      await update.mutateAsync({
        id: emp.id,
        updates: { ...form, manager_id: form.manager_id || null },
      })
      const edits = Object.entries(balanceEdits)
      if (edits.length > 0) {
        await Promise.all(
          edits.map(([categoryId, val]) =>
            setBalance.mutateAsync({
              employeeId: emp.id,
              categoryId,
              balance: parseFloat(val) || 0,
            })
          )
        )
      }
      toast.success("Changes saved")
      onClose()
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </div>
            Edit Employee
          </DialogTitle>
          <DialogDescription>
            Editing{" "}
            <strong>
              {emp.first_name} {emp.last_name}
            </strong>
            . Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">
              Profile
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex-1">
              Leave Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 pt-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                />
              </Field>
            </div>

            <Separator />

            {/* Role & Assignment */}
            <div className="space-y-4">
              <SectionHeading icon={Users} label="Role & Assignment" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Role">
                  <Select
                    value={form.role}
                    onValueChange={(v) => {
                      set("role", v as UserRole)
                      if (v !== "employee") set("manager_id", "")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="Assigned Employer"
                  hint={form.role !== "employee" ? "Employees only" : undefined}
                >
                  <Select
                    value={form.manager_id || "none"}
                    onValueChange={(v) =>
                      set("manager_id", v === "none" ? "" : v)
                    }
                    disabled={form.role !== "employee"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No employer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No employer assigned</SelectItem>
                      {employers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.first_name} {e.last_name}
                          {e.department ? ` · ${e.department}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <Separator />

            {/* Work details */}
            <div className="space-y-4">
              <SectionHeading icon={Briefcase} label="Work Details" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <Select
                    value={form.department || "none"}
                    onValueChange={(v) =>
                      set("department", v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No department</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Job Title">
                  <Input
                    value={form.job_title}
                    onChange={(e) => set("job_title", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Location">
                <Input
                  value={form.location}
                  placeholder="e.g. Manila"
                  onChange={(e) => set("location", e.target.value)}
                />
              </Field>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="space-y-4">
              <SectionHeading icon={Clock} label="Schedule" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Hours / day">
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    value={form.standard_hours_per_day}
                    onChange={(e) =>
                      set(
                        "standard_hours_per_day",
                        parseFloat(e.target.value) || 8
                      )
                    }
                  />
                </Field>
                <Field label="Hours / week">
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    step={0.5}
                    value={form.standard_hours_per_week}
                    onChange={(e) =>
                      set(
                        "standard_hours_per_week",
                        parseFloat(e.target.value) || 40
                      )
                    }
                  />
                </Field>
                <Field label="Start time">
                  <Input
                    type="time"
                    value={form.standard_start_time}
                    onChange={(e) => set("standard_start_time", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leave" className="pt-5">
            <div className="space-y-4">
              <SectionHeading icon={Calendar} label="Leave Balances" />
              {balances.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No leave categories configured
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {balances.map((b) => (
                    <div key={b.category_id} className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {b.category?.name ?? b.category_id}
                        {b.scheduled > 0 && (
                          <span className="ml-2 text-xs font-normal text-amber-600">
                            ({b.scheduled} scheduled)
                          </span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={
                          balanceEdits[b.category_id] !== undefined
                            ? balanceEdits[b.category_id]
                            : String(b.balance)
                        }
                        onChange={(e) => {
                          setBalanceEdits((prev) => ({
                            ...prev,
                            [b.category_id]: e.target.value,
                          }))
                          setIsDirty(true)
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={update.isPending || setBalance.isPending || !isDirty}
          >
            {update.isPending || setBalance.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
