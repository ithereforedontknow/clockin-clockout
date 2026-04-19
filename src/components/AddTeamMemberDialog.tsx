import { useState } from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAddTeamMember, useDepartments } from "@/lib/queries"
import { inviteEmployeeSchema } from "@/lib/schemas"

interface Props {
  open: boolean
  onClose: () => void
  managerId: string
}

const DEFAULT_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  department: "",
  job_title: "",
  location: "",
  standard_hours_per_day: 8,
  standard_hours_per_week: 40,
}

export function AddTeamMemberDialog({ open, onClose, managerId }: Props) {
  const addMember = useAddTeamMember()
  const { data: departments = [] } = useDepartments()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function reset() {
    setForm(DEFAULT_FORM)
    setErrors({})
  }

  async function handleSubmit() {
    const result = inviteEmployeeSchema.safeParse({ ...form, role: "employee" })
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message
      })
      setErrors(errs)
      toast.error("Please fix the errors below")
      return
    }
    await addMember.mutateAsync({ ...result.data, manager_id: managerId })
    toast.success(`${result.data.first_name} added`, {
      description: `They can sign in using ${result.data.email}`,
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Creates an employee record. They sign in via magic link using their
            work email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" required error={errors.first_name}>
              <Input
                placeholder="Jane"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </Field>
            <Field label="Last name" required error={errors.last_name}>
              <Input
                placeholder="Doe"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </Field>
          </div>

          {/* Email */}
          <Field label="Work email" required error={errors.email}>
            <Input
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          <div className="border-t" />

          {/* Role/dept row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <Select
                value={form.department || "none"}
                onValueChange={(v) => set("department", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
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
            <Field label="Job title">
              <Input
                placeholder="Software Engineer"
                value={form.job_title}
                onChange={(e) => set("job_title", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Location">
            <Input
              placeholder="Manila"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours / day">
              <Input
                type="number"
                min={1}
                max={24}
                value={form.standard_hours_per_day}
                onChange={(e) =>
                  set("standard_hours_per_day", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Hours / week">
              <Input
                type="number"
                min={1}
                max={168}
                value={form.standard_hours_per_week}
                onChange={(e) =>
                  set("standard_hours_per_week", Number(e.target.value))
                }
              />
            </Field>
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
          <Button disabled={addMember.isPending} onClick={handleSubmit}>
            {addMember.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
