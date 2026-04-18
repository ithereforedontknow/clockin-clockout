import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssignCourse, useAllCurriculums } from "@/lib/queries"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { BookPlus } from "lucide-react"

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

  const { data: certifications = [] } = useQuery({
    queryKey: ["certifications", employeeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("certifications")
        .select("curriculum_id")
        .eq("employee_id", employeeId)
      return data ?? []
    },
    enabled: open,
  })

  const completedCourseIds = new Set(certifications.map((c) => c.curriculum_id))
  const availableCourses = courses.filter(
    (c) => c.is_published && !completedCourseIds.has(c.id)
  )

  const handleAssign = async () => {
    if (!curriculumId || !dueDate) {
      toast.error("Please select a course and due date")
      return
    }
    await assignCourse.mutateAsync({
      employee_id: employeeId,
      curriculum_id: curriculumId,
      due_date: dueDate,
    })
    toast.success(`Course assigned to ${employeeName}`)
    setOpen(false)
    setCurriculumId("")
    setDueDate("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <BookPlus className="h-3.5 w-3.5" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Course</DialogTitle>
          <DialogDescription>
            Assign a course to{" "}
            <span className="font-medium text-foreground">{employeeName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.length === 0 ? (
                  <SelectItem disabled value="none">
                    No available courses
                  </SelectItem>
                ) : (
                  availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableCourses.length === 0 && certifications.length > 0 && (
              <p className="text-xs text-muted-foreground">
                This employee has completed all available courses.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAssign}
              disabled={assignCourse.isPending || !curriculumId || !dueDate}
            >
              {assignCourse.isPending ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
