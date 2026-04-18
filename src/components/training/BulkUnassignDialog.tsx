import { useState } from "react"
import { Check, ChevronsUpDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useEmployees, useAllCurriculums, useBulkUnassign } from "@/lib/queries"

export function BulkUnassignDialog() {
  const [open, setOpen] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [curriculumId, setCurriculumId] = useState<string>("all")
  const [isUnassigning, setIsUnassigning] = useState(false)

  const { data: employees = [] } = useEmployees()
  const { data: courses = [] } = useAllCurriculums()
  const bulkUnassign = useBulkUnassign()

  const handleUnassign = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error("Select at least one employee")
      return
    }

    setIsUnassigning(true)
    try {
      await bulkUnassign.mutateAsync({
        employeeIds: selectedEmployeeIds,
        curriculumId: curriculumId === "all" ? undefined : curriculumId,
      })
      toast.success(
        `Unassigned from ${selectedEmployeeIds.length} employee${selectedEmployeeIds.length > 1 ? "s" : ""}`
      )
      setOpen(false)
      setSelectedEmployeeIds([])
      setCurriculumId("all")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUnassigning(false)
    }
  }

  const selectedEmployees = employees.filter((e) =>
    selectedEmployeeIds.includes(e.id)
  )
  const isRemovingAll = curriculumId === "all"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-muted-foreground">
          <Trash2 className="h-4 w-4" />
          Bulk Unassign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Bulk Unassign</DialogTitle>
          <DialogDescription>
            Remove course assignments from multiple employees at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Employee picker */}
          <div className="space-y-2">
            <Label>Employees</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {selectedEmployeeIds.length === 0
                    ? "Select employees…"
                    : `${selectedEmployeeIds.length} employee${selectedEmployeeIds.length > 1 ? "s" : ""} selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0">
                <Command>
                  <CommandInput placeholder="Search employees…" />
                  <CommandList>
                    <CommandEmpty>No employees found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            onSelect={() =>
                              setSelectedEmployeeIds((prev) =>
                                prev.includes(emp.id)
                                  ? prev.filter((id) => id !== emp.id)
                                  : [...prev, emp.id]
                              )
                            }
                          >
                            <Check
                              className={`mr-2 h-4 w-4 transition-opacity ${
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
              <div className="flex flex-wrap gap-1.5">
                {selectedEmployees.slice(0, 5).map((emp) => (
                  <Badge key={emp.id} variant="secondary" className="text-xs">
                    {emp.first_name} {emp.last_name}
                  </Badge>
                ))}
                {selectedEmployees.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedEmployees.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Course filter */}
          <div className="space-y-2">
            <Label>
              Course{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Select value={curriculumId} onValueChange={setCurriculumId}>
              <SelectTrigger>
                <SelectValue placeholder="All assigned courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assigned courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isRemovingAll
                ? "All course assignments will be removed."
                : "Only the selected course will be unassigned."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleUnassign}
            disabled={isUnassigning || selectedEmployeeIds.length === 0}
          >
            {isUnassigning
              ? "Unassigning…"
              : `Unassign ${selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : ""}${selectedEmployeeIds.length > 0 ? ` employee${selectedEmployeeIds.length > 1 ? "s" : ""}` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
