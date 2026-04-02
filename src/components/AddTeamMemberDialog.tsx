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
import { Separator } from "@/components/ui/separator"
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
  managerId: string // current employer's employee id
}

export function AddTeamMemberDialog({ open, onClose, managerId }: Props) {
  const addMember = useAddTeamMember()
  const { data: departments = [] } = useDepartments()

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    job_title: "",
    location: "",
    standard_hours_per_day: 8,
    standard_hours_per_week: 40,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function reset() {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      department: "",
      job_title: "",
      location: "",
      standard_hours_per_day: 8,
      standard_hours_per_week: 40,
    })
    setErrors({})
  }

  async function handleSubmit() {
    // Validate with Zod (role is always "employee" for employer-added members)
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

    await addMember.mutateAsync({
      ...result.data,
      manager_id: managerId,
    })

    toast.success(`Employee record created for ${result.data.email}`, {
      description: `${result.data.first_name} can sign in using their work email.`,
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
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Creates an employee record under your team. They sign in via magic
            link using their work email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
              {errors.first_name && (
                <p className="text-xs text-destructive">{errors.first_name}</p>
              )}
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
              {errors.last_name && (
                <p className="text-xs text-destructive">{errors.last_name}</p>
              )}
            </div>
          </div>

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
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Department</Label>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Job title</Label>
              <Input
                placeholder="Software Engineer"
                value={form.job_title}
                onChange={(e) => set("job_title", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Location</Label>
            <Input
              placeholder="Manila"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

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
