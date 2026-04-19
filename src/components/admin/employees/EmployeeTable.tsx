import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import type { Employee } from "@/lib/supabase"

const STATUS_STYLE: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-red-200 bg-red-50 text-red-700",
}

interface EmployeeTableProps {
  employees: Employee[]
  isLoading: boolean
  selected: Set<string>
  onToggleAll: () => void
  onToggleOne: (id: string) => void
  onEdit: (emp: Employee) => void
  onConfirmAction: (target: {
    employee: Employee
    action: "deactivate" | "reactivate"
  }) => void
}

export function EmployeeTable({
  employees,
  isLoading,
  selected,
  onToggleAll,
  onToggleOne,
  onEdit,
  onConfirmAction,
}: EmployeeTableProps) {
  return (
    <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-12 pl-4">
              <Checkbox
                checked={
                  employees.length > 0 && selected.size === employees.length
                }
                onCheckedChange={onToggleAll}
              />
            </TableHead>
            <TableHead className="pl-2 text-[10px] font-bold tracking-widest uppercase">
              Member
            </TableHead>
            <TableHead className="hidden text-[10px] font-bold tracking-widest uppercase md:table-cell">
              Dept / Title
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest uppercase">
              Status
            </TableHead>
            <TableHead className="w-12 pr-6 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-40 animate-pulse text-center text-xs font-bold tracking-widest text-muted-foreground uppercase"
              >
                Accessing Directory...
              </TableCell>
            </TableRow>
          ) : employees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-40 text-center text-sm text-muted-foreground italic"
              >
                No matching employees found.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((emp) => (
              <TableRow
                key={emp.id}
                className={`group transition-colors ${selected?.has(emp.id) ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
              >
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selected?.has(emp.id)}
                    onCheckedChange={() => onToggleOne(emp.id)}
                  />
                </TableCell>
                <TableCell className="py-3 pl-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0 border shadow-sm">
                      <AvatarImage src={emp.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/5 text-[9px] font-black">
                        {emp.first_name[0]}
                        {emp.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="mb-0.5 truncate text-sm leading-tight font-bold">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="truncate text-[11px] font-medium text-muted-foreground tabular-nums">
                        {emp.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground/80">
                      {emp.department || "—"}
                    </span>
                    <span className="line-clamp-1 text-[10px] font-bold tracking-tighter text-muted-foreground/60 uppercase">
                      {emp.job_title || emp.role}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`h-5 text-[9px] font-black uppercase ${STATUS_STYLE[emp.employment_status] || ""}`}
                  >
                    {emp.employment_status}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 font-medium"
                    >
                      <DropdownMenuItem
                        onClick={() => onEdit(emp)}
                        className="cursor-pointer text-xs"
                      >
                        <Pencil className="mr-2 h-4 w-4 opacity-50" /> Edit
                        Record
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`cursor-pointer text-xs ${emp.employment_status === "active" ? "text-destructive" : "text-emerald-600"}`}
                        onClick={() =>
                          onConfirmAction({
                            employee: emp,
                            action:
                              emp.employment_status === "active"
                                ? "deactivate"
                                : "reactivate",
                          })
                        }
                      >
                        {emp.employment_status === "active" ? (
                          <UserX className="mr-2 h-4 w-4" />
                        ) : (
                          <UserCheck className="mr-2 h-4 w-4" />
                        )}
                        {emp.employment_status === "active"
                          ? "Deactivate Access"
                          : "Restore Access"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
