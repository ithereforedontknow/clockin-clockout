import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BookPlus, GraduationCap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAssignCourse, useAllCurriculums } from "@/lib/queries"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Props {
  employeeId: string
  employeeName: string
}

export function AssignCourseDialog({ employeeId, employeeName }: Props) {
  const [open, setOpen] = useState(false)
  const [curriculumId, setCurriculumId] = useState("")
  const [dueDate, setDueDate] = useState("")

  const { data: courses = [] } = useAllCurriculums()
  const assignCourse = useAssignCourse()
  const queryClient = useQueryClient()

  // Fetch what they already have so we don't assign duplicates
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ["training_assignments", employeeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("training_assignments")
        .select("curriculum_id")
        .eq("employee_id", employeeId)
      return data ?? []
    },
    enabled: open,
  })

  const assignedIds = new Set(existingAssignments.map((a) => a.curriculum_id))
  const availableCourses = courses.filter(
    (c) => c.is_published && !assignedIds.has(c.id)
  )

  const handleAssign = async () => {
    if (!curriculumId || !dueDate) {
      toast.error("Please select a course and due date")
      return
    }
    try {
      await assignCourse.mutateAsync({
        employee_id: employeeId,
        curriculum_id: curriculumId,
        due_date: dueDate,
      })
      toast.success(`Course assigned to ${employeeName}`)
      queryClient.invalidateQueries({ queryKey: ["training_assignments"] })
      setOpen(false)
      setCurriculumId("")
      setDueDate("")
    } catch (e: any) {
      toast.error(e.message || "Failed to assign course")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-primary transition-colors hover:bg-primary/10 hover:text-primary"
          title="Assign a single course"
        >
          <BookPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <GraduationCap className="h-5 w-5 text-primary" />
            Assign Course
          </DialogTitle>
          <DialogDescription>
            Assign a specific course to{" "}
            <span className="font-bold text-foreground">{employeeName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Select Course
            </Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger className="h-10 font-bold">
                <SelectValue placeholder="Choose an available course..." />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.length === 0 ? (
                  <SelectItem disabled value="none">
                    No available courses left
                  </SelectItem>
                ) : (
                  availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-medium">
                      {c.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableCourses.length === 0 &&
              existingAssignments.length > 0 && (
                <p className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 p-2 text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                  This employee has already been assigned all available courses.
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Completion Deadline
            </Label>
            <Input
              type="date"
              className="h-10 font-medium"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={assignCourse.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignCourse.isPending || !curriculumId || !dueDate}
            className="font-bold"
          >
            {assignCourse.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BookPlus className="mr-2 h-4 w-4" />
            )}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
