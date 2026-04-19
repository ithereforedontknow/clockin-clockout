import { useState } from "react"
import { Building2, Plus, ChevronDown, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
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

  const handleCreate = () => {
    if (!name.trim()) return
    createDept.mutate(name.trim(), {
      onSuccess: () => {
        setName("")
        toast.success("Department created")
      },
      onError: (err: any) => {
        toast.error(`Failed to create department: ${err.message}`)
      },
    })
  }

  return (
    <div className="grid animate-in grid-cols-1 items-start gap-8 duration-500 fade-in lg:grid-cols-12">
      {/* Sidebar: Add New */}
      <div className="space-y-4 lg:col-span-4">
        <h3 className="px-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
          Management
        </h3>
        <Card className="border-none bg-card shadow-none ring-1 ring-border">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Add New Department
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Input
                placeholder="e.g. Product Design"
                className="h-10 text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <Button
              className="h-10 w-full font-bold shadow-sm"
              onClick={handleCreate}
              disabled={createDept.isPending || !name.trim()}
            >
              {createDept.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Department
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main: Directory List */}
      <div className="space-y-4 lg:col-span-8">
        <h3 className="px-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
          Active Departments
        </h3>
        <div className="space-y-2">
          {departments.map((dept: any) => {
            const members = employees.filter(
              (e: any) =>
                e.department === dept.name && e.employment_status === "active"
            )
            const isOpen = expanded === dept.id

            return (
              <div
                key={dept.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all"
              >
                <div
                  className="group flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30"
                  onClick={() => setExpanded(isOpen ? null : dept.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">
                        {dept.name}
                      </p>
                      <p className="text-[10px] font-bold tracking-tighter text-muted-foreground uppercase">
                        {members.length} Active Staff
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteDept.mutate(dept.id, {
                          onSuccess: () => toast.success("Department removed"),
                          onError: (err: any) =>
                            toast.error(
                              `Failed to delete department: ${err.message}`
                            ),
                        })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="animate-in border-t bg-muted/5 duration-300 slide-in-from-top-2">
                    {members.length === 0 ? (
                      <p className="px-6 py-10 text-center text-xs font-medium text-muted-foreground italic">
                        No employees assigned to this department.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {members.map((emp: any) => (
                          <div
                            key={emp.id}
                            className="flex items-center gap-3 px-14 py-2.5 transition-colors hover:bg-muted/30"
                          >
                            <Avatar className="h-7 w-7 shrink-0 border shadow-sm">
                              <AvatarImage src={emp.avatar_url} />
                              <AvatarFallback className="text-[9px] font-bold uppercase">
                                {emp.first_name?.[0] || ""}
                                {emp.last_name?.[0] || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="truncate text-[10px] font-medium text-muted-foreground">
                                {emp.job_title || "Team Member"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="h-4 border-slate-200 text-[8px] font-black text-slate-500 uppercase"
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
      </div>
    </div>
  )
}
