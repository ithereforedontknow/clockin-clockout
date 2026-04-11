import { useState } from "react"
import { ChevronDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  useDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  useEmployees,
} from "@/lib/queries"

export function DepartmentsPanel() {
  const { data: departments = [] } = useDepartments()
  const { data: employees = [] } = useEmployees()
  const createDept = useCreateDepartment()
  const deleteDept = useDeleteDepartment()
  const [name, setName] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              createDept.mutate(name.trim(), {
                onSuccess: () => {
                  setName("")
                  toast.success("Department created")
                },
                onError: () => toast.error("Failed to create department"),
              })
            }
          }}
        />
        <Button
          onClick={() => {
            if (!name.trim()) return
            createDept.mutate(name.trim(), {
              onSuccess: () => {
                setName("")
                toast.success("Department created")
              },
              onError: () => toast.error("Failed to create department"),
            })
          }}
          disabled={createDept.isPending}
        >
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {departments.map((dept: { id: string; name: string }) => {
          const members = employees.filter(
            (e: any) =>
              e.department === dept.name && e.employment_status === "active"
          )
          const isOpen = expanded === dept.id
          return (
            <div key={dept.id} className="overflow-hidden rounded-lg border">
              <div
                className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50"
                onClick={() => setExpanded(isOpen ? null : dept.id)}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  <span className="font-medium">{dept.name}</span>
                  <Badge variant="secondary">{members.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteDept.mutate(dept.id, {
                      onSuccess: () => toast.success("Department deleted"),
                      onError: () =>
                        toast.error(
                          "Cannot delete — employees may still be assigned"
                        ),
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {isOpen && (
                <div className="divide-y border-t bg-muted/20">
                  {members.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                      No employees in this department.
                    </p>
                  ) : (
                    members.map((emp: any) => (
                      <div
                        key={emp.id}
                        className="flex items-center gap-3 px-4 py-2"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {emp.first_name?.[0]}
                            {emp.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {emp.job_title || "—"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-auto text-xs capitalize"
                        >
                          {emp.role}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
        {departments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No departments yet.
          </p>
        )}
      </div>
    </div>
  )
}
