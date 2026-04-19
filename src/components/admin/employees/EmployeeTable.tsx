import { format } from "date-fns"
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Employee } from "@/lib/supabase"

const STATUS_STYLE: Record<string, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  inactive:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  on_leave:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
}

const ROLE_STYLE: Record<string, string> = {
  employee:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  employer:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  admin:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
}

interface Props {
  employees: Employee[]
  selected: Set<string>
  onToggleAll: () => void
  onToggleOne: (id: string) => void
  allSelected: boolean
  onEdit: (employee: Employee) => void
  onConfirmAction: (target: {
    employee: Employee
    action: "deactivate" | "reactivate"
  }) => void
}

export function EmployeeTable({
  employees,
  selected,
  onToggleAll,
  onToggleOne,
  allSelected,
  onEdit,
  onConfirmAction,
}: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs font-medium">Employee</TableHead>
              <TableHead className="hidden text-xs font-medium md:table-cell">
                Role
              </TableHead>
              <TableHead className="hidden text-xs font-medium lg:table-cell">
                Department
              </TableHead>
              <TableHead className="hidden text-xs font-medium sm:table-cell">
                Hours
              </TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="hidden text-xs font-medium xl:table-cell">
                Hired
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow
                key={emp.id}
                className={`transition-colors ${selected.has(emp.id) ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(emp.id)}
                    onCheckedChange={() => onToggleOne(emp.id)}
                    aria-label={`Select ${emp.first_name} ${emp.last_name}`}
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={emp.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {emp.first_name[0]}
                        {emp.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {emp.first_name} {emp.last_name}
                        </p>
                        {emp.preferred_name && (
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            ({emp.preferred_name})
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {emp.email}
                      </p>
                      {/* Mobile-only badges */}
                      <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${ROLE_STYLE[emp.role]}`}
                        >
                          {emp.role}
                        </Badge>
                        {emp.department && (
                          <span className="text-[10px] text-muted-foreground">
                            {emp.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium capitalize ${ROLE_STYLE[emp.role]}`}
                  >
                    {emp.role}
                  </Badge>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {emp.department || "—"}
                  </span>
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {emp.standard_hours_per_day}h/day
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium whitespace-nowrap capitalize ${STATUS_STYLE[emp.employment_status]}`}
                  >
                    {emp.employment_status.replace("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {emp.hire_date
                      ? format(new Date(emp.hire_date), "MMM d, yyyy")
                      : "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onEdit(emp)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {emp.employment_status === "active" ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            onConfirmAction({
                              employee: emp,
                              action: "deactivate",
                            })
                          }
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            onConfirmAction({
                              employee: emp,
                              action: "reactivate",
                            })
                          }
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
