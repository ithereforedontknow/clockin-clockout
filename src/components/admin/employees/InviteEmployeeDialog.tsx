import { useState } from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

export function InviteEmployeeDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const invite = useInviteEmployee()
  const { data: depts = [] } = useDepartments()
  const { data: allEmps = [] } = useAllEmployees("", "", "", "")
  const employers = allEmps.filter((e: any) => e.role === "employer")

  const initialForm = {
    email: "",
    first_name: "",
    last_name: "",
    role: "employee",
    manager_id: "",
    department: "",
    job_title: "",
    location: "",
    hire_date: new Date().toISOString().slice(0, 10),
    standard_start_time: "09:00",
    standard_hours_per_day: 8,
    standard_hours_per_week: 40,
  }

  const [form, setForm] = useState(initialForm)

  const resetForm = () => setForm(initialForm)

  const handleSubmit = async () => {
    if (!form.email || !form.first_name)
      return toast.error("Email and Name are required")
    try {
      await invite.mutateAsync(form)
      toast.success("Employee invited")
      resetForm()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm()
          onClose()
        }
      }}
    >
      {/* flex-col + max-h forces the modal to respect screen size */}
      <DialogContent className="flex max-h-[95vh] flex-col p-0 sm:max-w-[550px]">
        <DialogHeader className="shrink-0 p-6 pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Add New Employee
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create a profile and send a system invite.
          </DialogDescription>
        </DialogHeader>

        {/* flex-1 allows this area to grow/shrink and scroll */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-4 pb-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Basic Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Work Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Work Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Access Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="employer">Employer/Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Manager</Label>
                  <Select
                    value={form.manager_id || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, manager_id: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="No Manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager Assigned</SelectItem>
                      {employers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Select
                    onValueChange={(v) => setForm({ ...form, department: v })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {depts.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Job Title</Label>
                  <Input
                    value={form.job_title}
                    onChange={(e) =>
                      setForm({ ...form, job_title: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Schedule & Contract
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Hire Date</Label>
                  <Input
                    type="date"
                    value={form.hire_date}
                    onChange={(e) =>
                      setForm({ ...form, hire_date: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={form.standard_start_time}
                    onChange={(e) =>
                      setForm({ ...form, standard_start_time: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Hrs/Day</Label>
                  <Input
                    type="number"
                    value={form.standard_hours_per_day}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm({
                        ...form,
                        standard_hours_per_day:
                          val === "" ? 0 : parseInt(val, 10) || 0,
                      })
                    }}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hrs/Week</Label>
                  <Input
                    type="number"
                    value={form.standard_hours_per_week}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm({
                        ...form,
                        standard_hours_per_week:
                          val === "" ? 0 : parseInt(val, 10) || 0,
                      })
                    }}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* shrink-0 keeps footer sticky at bottom */}
        <DialogFooter className="shrink-0 border-t bg-muted/20 p-6">
          <Button
            variant="ghost"
            onClick={() => {
              resetForm()
              onClose()
            }}
            className="font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={invite.isPending}
            className="px-8 font-bold"
          >
            {invite.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Onboard Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
