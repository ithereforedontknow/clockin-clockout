import { useState } from "react"
import { ChevronDown, Trash2, Building2, Plus, Users } from "lucide-react"
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

  function handleCreate() {
    if (!name.trim()) return
    createDept.mutate(name.trim(), {
      onSuccess: () => {
        setName("")
        toast.success("Department created")
      },
      onError: () => toast.error("Failed to create department"),
    })
  }

  return (
    <div className="space-y-4">
      {/* Add department */}
      <div className="flex gap-2">
        <Input
          placeholder="New department name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="max-w-sm"
        />
        <Button
          onClick={handleCreate}
          disabled={createDept.isPending || !name.trim()}
          size="sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {/* Department list */}
      {departments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 opacity-25" />
          <p className="text-sm">No departments yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {departments.map((dept: { id: string; name: string }) => {
            const members = employees.filter(
              (e: any) =>
                e.department === dept.name && e.employment_status === "active"
            )
            const isOpen = expanded === dept.id

            return (
              <div
                key={dept.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                  onClick={() => setExpanded(isOpen ? null : dept.id)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    />
                    <span className="text-sm font-medium">{dept.name}</span>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {members.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
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
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Members */}
                {isOpen && (
                  <div className="border-t bg-muted/20">
                    {members.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-muted-foreground">
                        No active employees in this department.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {members.map((emp: any) => (
                          <div
                            key={emp.id}
                            className="flex items-center gap-3 px-5 py-2.5"
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                {emp.first_name?.[0]}
                                {emp.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {emp.job_title || "—"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] capitalize"
                            >
                              {emp.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
