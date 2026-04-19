import { useState } from "react"
import {
  Trash2,
  AlertTriangle,
  Loader2,
  Building2,
  Briefcase,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAllCurriculums, useBulkUnassign, useEmployees } from "@/lib/queries"

export function BulkUnassignDialog({
  selectedIds = [],
  onSuccess,
}: {
  selectedIds?: string[]
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [curriculumId, setCurriculumId] = useState<string>("all")
  const [filters, setFilters] = useState({ dept: "all", role: "all" })

  const { data: courses = [] } = useAllCurriculums()
  const { data: employees = [] } = useEmployees()
  const bulkUnassign = useBulkUnassign()

  const isDirectSelection = selectedIds.length > 0
  const departments = Array.from(
    new Set(employees.map((e: any) => e.department).filter(Boolean))
  ) as string[]

  const targetEmployees = isDirectSelection
    ? employees.filter((e: any) => selectedIds.includes(e.id))
    : employees.filter((e: any) => {
        const deptMatch =
          filters.dept === "all" || e.department === filters.dept
        const roleMatch = filters.role === "all" || e.role === filters.role
        return deptMatch && roleMatch
      })

  const handleUnassign = async () => {
    if (targetEmployees.length === 0)
      return toast.error("No employees selected")

    try {
      await bulkUnassign.mutateAsync({
        employeeIds: targetEmployees.map((e: any) => e.id),
        curriculumId: curriculumId === "all" ? undefined : curriculumId,
      })
      toast.success(`Removed courses from ${targetEmployees.length} employees`)
      setOpen(false)
      setCurriculumId("all")
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const isWipeSlate = curriculumId === "all"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-red-200 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />{" "}
          {isDirectSelection ? "Remove Selected" : "Bulk Remove"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-red-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-red-600">
            <AlertTriangle className="h-5 w-5" /> Bulk Unassign
          </DialogTitle>
          <DialogDescription>
            You are about to remove required coursework from{" "}
            <strong className="text-foreground">
              {targetEmployees.length} employees.
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {!isDirectSelection && (
            <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  <Building2 className="h-3 w-3" /> Department
                </Label>
                <Select
                  value={filters.dept}
                  onValueChange={(v) => setFilters((f) => ({ ...f, dept: v }))}
                >
                  <SelectTrigger className="h-9 bg-background text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Every Department</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  <Briefcase className="h-3 w-3" /> System Role
                </Label>
                <Select
                  value={filters.role}
                  onValueChange={(v) => setFilters((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger className="h-9 bg-background text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="employee">Staff</SelectItem>
                    <SelectItem value="employer">Managers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Select Course to Remove
            </Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger className="h-10 font-bold">
                <SelectValue placeholder="All assigned courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-red-600">
                  ⚠️ All Courses (Wipe Slate)
                </SelectItem>
                {courses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`rounded-xl border p-4 text-sm font-medium ${isWipeSlate ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
          >
            <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
              <AlertTriangle className="h-3.5 w-3.5" /> Data Loss Warning
            </h4>
            {isWipeSlate
              ? "You are choosing to unassign EVERY course from these employees. All active progress will be permanently deleted."
              : "Removing this course will permanently delete the selected employees' active progress for this specific curriculum."}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={bulkUnassign.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnassign}
            disabled={bulkUnassign.isPending || targetEmployees.length === 0}
            className="font-bold"
          >
            {bulkUnassign.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Confirm Removal ({targetEmployees.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
