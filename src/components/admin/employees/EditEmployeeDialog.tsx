import { useState, useMemo } from "react"
import { Save, Loader2 } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useAdminUpdateEmployee,
  useDepartments,
  useAllEmployees,
  useTimeOffBalances,
  useSetTimeOffBalance,
} from "@/lib/queries"
import type { Employee, UserRole } from "@/lib/supabase"

export function EditEmployeeDialog({
  employee: emp,
  onClose,
}: {
  employee: Employee
  onClose: () => void
}) {
  const update = useAdminUpdateEmployee()
  const { data: depts = [] } = useDepartments()
  const { data: allEmps = [] } = useAllEmployees("", "", "", "")
  const { data: balances = [] } = useTimeOffBalances(emp.id)
  const setBalance = useSetTimeOffBalance()

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

  const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const employers = allEmps.filter(
    (e) => e.role === "employer" && e.id !== emp.id
  )

  // Deduplicate leave categories
  const uniqueBalances = useMemo(() => {
    const seen = new Set()
    return balances.filter((b: any) => {
      const duplicate = seen.has(b.category_id)
      seen.add(b.category_id)
      return !duplicate
    })
  }, [balances])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await update.mutateAsync({
        id: emp.id,
        updates: { ...form, manager_id: form.manager_id || null } as any,
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
    } catch {
      toast.error("Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex max-h-[95vh] flex-col p-0 sm:max-w-[550px]">
        <DialogHeader className="shrink-0 p-6 pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Edit Staff Record
          </DialogTitle>
          <DialogDescription className="text-xs">
            Modify details for{" "}
            <strong>
              {emp.first_name} {emp.last_name}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

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
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Professional Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) =>
                      setForm({ ...form, role: v as UserRole })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="employer">Manager</SelectItem>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
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
                    value={form.department || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, department: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Dept</SelectItem>
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
                Work Schedule
              </p>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Hrs/Day</Label>
                  <Input
                    type="number"
                    value={form.standard_hours_per_day}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        standard_hours_per_day: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Leave Balances
              </p>
              <div className="grid grid-cols-2 gap-4">
                {uniqueBalances.map((b: any) => (
                  <div key={b.category_id} className="space-y-1.5">
                    <Label className="text-xs">{b.category?.name}</Label>
                    <Input
                      type="number"
                      defaultValue={b.balance}
                      onChange={(e) =>
                        setBalanceEdits((prev) => ({
                          ...prev,
                          [b.category_id]: e.target.value,
                        }))
                      }
                      className="h-9 tabular-nums"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t bg-muted/20 p-6">
          <Button variant="ghost" onClick={onClose} className="font-bold">
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 font-bold"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
