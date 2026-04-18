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

  const handleAssign = async () => {
    if (!curriculumId || !dueDate) {
      toast.error("Select a course and due date")
      return
    }
    await assignCourse.mutateAsync({
      employee_id: employeeId,
      curriculum_id: curriculumId,
      due_date: dueDate,
    })
    toast.success("Course assigned")
    setOpen(false)
    setCurriculumId("")
    setDueDate("")
  }
  const { data: certifications = [] } = useQuery({
    queryKey: ["certifications", employeeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("certifications")
        .select("curriculum_id")
        .eq("employee_id", employeeId)
      return data ?? []
    },
    enabled: open, // only fetch when dialog opens
  })

  const completedCourseIds = new Set(certifications.map((c) => c.curriculum_id))
  const availableCourses = courses.filter((c) => !completedCourseIds.has(c.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Assign Course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign course to {employeeName}</DialogTitle>{" "}
          <DialogDescription>
            Select a published course and set a due date for completion.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Course</Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.length === 0 ? (
                  <SelectItem disabled value="none">
                    All published courses already completed
                  </SelectItem>
                ) : (
                  availableCourses
                    .filter((c) => c.is_published)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleAssign}
            disabled={assignCourse.isPending}
          >
            {assignCourse.isPending ? "Assigning…" : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
