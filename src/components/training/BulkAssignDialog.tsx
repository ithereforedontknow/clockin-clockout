import { useState } from "react"
import { Users, Building2, Briefcase, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useEmployees, useAllCurriculums } from "@/lib/queries"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function BulkAssignDialog({
  selectedIds = [],
  onSuccess,
}: {
  selectedIds?: string[]
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState({ dept: "all", role: "all" })
  const [curriculumId, setCurriculumId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)

  const { data: employees = [] } = useEmployees()
  const { data: courses = [] } = useAllCurriculums()

  const publishedCourses = courses.filter((c) => c.is_published)
  const departments = Array.from(
    new Set(employees.map((e: any) => e.department).filter(Boolean))
  ) as string[]

  const isDirectSelection = selectedIds.length > 0

  const targetEmployees = isDirectSelection
    ? employees.filter((e: any) => selectedIds.includes(e.id))
    : employees.filter((e: any) => {
        const deptMatch =
          filters.dept === "all" || e.department === filters.dept
        const roleMatch = filters.role === "all" || e.role === filters.role
        return deptMatch && roleMatch
      })

  const handleAssign = async () => {
    if (targetEmployees.length === 0)
      return toast.error("No employees match these filters")
    if (!curriculumId) return toast.error("Select a course")
    if (!dueDate) return toast.error("Set a due date")

    setIsAssigning(true)
    try {
      const assignments = targetEmployees.map((emp: any) => ({
        employee_id: emp.id,
        curriculum_id: curriculumId,
        due_date: dueDate,
        assigned_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from("training_assignments")
        .upsert(assignments, { onConflict: "employee_id,curriculum_id" })
      if (error) throw error

      toast.success(
        `Assigned to ${targetEmployees.length} member${targetEmployees.length > 1 ? "s" : ""}`
      )
      setOpen(false)
      setCurriculumId("")
      setDueDate("")
      setFilters({ dept: "all", role: "all" })
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 font-bold shadow-sm"
        >
          <Users className="h-4 w-4" />{" "}
          {isDirectSelection ? "Assign Selected" : "Bulk Assign"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Bulk Course Assignment
          </DialogTitle>
          <DialogDescription>
            Assign training paths to specific groups.
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
                    <SelectItem value="employee">Staff (Employee)</SelectItem>
                    <SelectItem value="employer">
                      Managers (Employer)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                <span className="text-base text-primary">
                  {targetEmployees.length}
                </span>{" "}
                Members Affected
              </p>
              <p className="text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
                Will receive this course
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Select Course
              </Label>
              <Select value={curriculumId} onValueChange={setCurriculumId}>
                <SelectTrigger className="h-10 font-bold">
                  <SelectValue placeholder="Choose a published course..." />
                </SelectTrigger>
                <SelectContent>
                  {publishedCourses.length === 0 && (
                    <SelectItem value="none" disabled>
                      No published courses
                    </SelectItem>
                  )}
                  {publishedCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Completion Deadline
              </Label>
              <Input
                type="date"
                className="h-10 font-medium"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            disabled={
              !curriculumId ||
              !dueDate ||
              targetEmployees.length === 0 ||
              isAssigning
            }
            onClick={handleAssign}
            className="font-bold"
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to {targetEmployees.length} Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
