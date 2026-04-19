import { useState } from "react"
import { UserPlus, Loader2, Mail, Clock, Briefcase, Users } from "lucide-react"
import { toast } from "sonner"
import { inviteEmployeeSchema } from "@/lib/schemas"
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
import {
  useInviteEmployee,
  useDepartments,
  useAllEmployees,
} from "@/lib/queries"
import type { UserRole } from "@/lib/supabase"

interface Props {
  open: boolean
  onClose: () => void
}

const INITIAL_FORM = {
  email: "",
  first_name: "",
  last_name: "",
  role: "employee" as UserRole,
  manager_id: "",
  department: "",
  job_title: "",
  location: "",
  hire_date: new Date().toISOString().slice(0, 10),
  standard_start_time: "09:00",
  standard_hours_per_day: 8,
  standard_hours_per_week: 40,
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id?: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
function SectionHead({
  icon: Icon,
  label,
}: {
  icon: typeof Users
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

export function InviteEmployeeDialog({ open, onClose }: Props) {
  const invite = useInviteEmployee()
  const { data: departments = [] } = useDepartments()
  const { data: allEmployees = [] } = useAllEmployees()
  const employers = allEmployees.filter((e) => e.role === "employer")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState(INITIAL_FORM)

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function reset() {
    setForm(INITIAL_FORM)
    setErrors({})
  }

  async function handleSubmit() {
    const result = inviteEmployeeSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message
      })
      setErrors(errs)
      toast.error(Object.values(errs)[0] || "Please check the form")
      return
    }
    try {
      await invite.mutateAsync(result.data)
      toast.success(
        `${result.data.first_name} ${result.data.last_name} added`,
        {
          description: "They can now sign in with their work email.",
        }
      )
      reset()
      onClose()
    } catch (err) {
      toast.error("Failed to create employee", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
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
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-3.5 w-3.5 text-primary" />
            </div>
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Creates a record and lets them sign in via magic link using their
            work email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Identity */}
          <div className="space-y-4">
            <SectionHead icon={Mail} label="Basic Information" />
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="first_name"
                label="First name"
                required
                error={errors.first_name}
              >
                <Input
                  id="first_name"
                  placeholder="Jane"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </Field>
              <Field
                id="last_name"
                label="Last name"
                required
                error={errors.last_name}
              >
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                />
              </Field>
            </div>
            <Field id="email" label="Work email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>

          <Separator />

          {/* Role */}
          <div className="space-y-4">
            <SectionHead icon={Users} label="Role & Assignment" />
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
                    {employers.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                        {emp.department ? ` · ${emp.department}` : ""}
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
            <SectionHead icon={Briefcase} label="Work Details" />
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
                  placeholder="Software Engineer"
                  value={form.job_title}
                  onChange={(e) => set("job_title", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Location">
              <Input
                placeholder="Manila / Remote"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-4">
            <SectionHead icon={Clock} label="Schedule & Hours" />
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="hire_date"
                label="Hire date"
                required
                error={errors.hire_date}
              >
                <Input
                  id="hire_date"
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => set("hire_date", e.target.value)}
                />
              </Field>
              <Field label="Standard start time">
                <Input
                  type="time"
                  value={form.standard_start_time}
                  onChange={(e) => set("standard_start_time", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={invite.isPending}>
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

// Helper for hint text on Field
declare module "./InviteEmployeeDialog" {
  interface FieldProps {
    hint?: string
  }
}
