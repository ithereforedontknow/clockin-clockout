import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { useAllCurriculums, useEmployees } from "@/lib/queries"

export function BulkAssignDialog() {
  const [open, setOpen] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [curriculumId, setCurriculumId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)

  const { data: employees = [] } = useEmployees()
  const { data: courses = [] } = useAllCurriculums()

  const handleAssign = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error("Select at least one employee")
      return
    }
    if (!curriculumId) {
      toast.error("Select a course")
      return
    }
    if (!dueDate) {
      toast.error("Select a due date")
      return
    }

    setIsAssigning(true)
    try {
      const assignments = selectedEmployeeIds.map((employee_id) => ({
        employee_id,
        curriculum_id: curriculumId,
        due_date: dueDate,
        assigned_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from("training_assignments")
        .upsert(assignments, { onConflict: "employee_id,curriculum_id" })

      if (error) throw error

      toast.success(`Assigned to ${selectedEmployeeIds.length} employee(s)`)
      setOpen(false)
      setSelectedEmployeeIds([])
      setCurriculumId("")
      setDueDate("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const selectedEmployees = employees.filter((e) =>
    selectedEmployeeIds.includes(e.id)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Bulk Assign</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Course Assignment</DialogTitle>
          <DialogDescription>
            Assign a course to multiple employees at once. All selected
            employees will receive the same due date.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Employee Multi-Select */}
          <div className="space-y-2">
            <Label>Employees</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedEmployeeIds.length === 0
                    ? "Select employees..."
                    : `${selectedEmployeeIds.length} selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search employees..." />
                  <CommandList>
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-72">
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() => {
                              setSelectedEmployeeIds((prev) =>
                                prev.includes(emp.id)
                                  ? prev.filter((id) => id !== emp.id)
                                  : [...prev, emp.id]
                              )
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedEmployeeIds.includes(emp.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {emp.first_name} {emp.last_name}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {selectedEmployees.slice(0, 5).map((emp) => (
                  <Badge key={emp.id} variant="secondary">
                    {emp.first_name} {emp.last_name}
                  </Badge>
                ))}
                {selectedEmployees.length > 5 && (
                  <Badge variant="secondary">
                    +{selectedEmployees.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Course Select */}
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses
                  .filter((c) => c.is_published)
                  .map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isAssigning}>
            {isAssigning ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
