import { format } from "date-fns"
import { Check, X, Clock, Calendar, User } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/lib/supabase"

interface Props {
  data: any[]
  type: "timeoff" | "infochange" | "correction"
  selectedIds: Set<string>
  onToggleOne: (id: string) => void
  onToggleAll: () => void
  onReview: (item: any, decision: "approved" | "denied") => void
  currentUserId: string
  isHistory?: boolean
}

export function ApprovalTable({
  data,
  type,
  selectedIds,
  onToggleOne,
  onToggleAll,
  onReview,
  currentUserId,
  isHistory,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {!isHistory && (
              <TableHead className="w-12 pl-4">
                <Checkbox
                  onCheckedChange={onToggleAll}
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size ===
                      data.filter((i) => i.employee_id !== currentUserId).length
                  }
                />
              </TableHead>
            )}
            <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
              Requester
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest uppercase">
              Request Details
            </TableHead>
            <TableHead className="hidden text-[10px] font-bold tracking-widest uppercase md:table-cell">
              Submitted
            </TableHead>
            <TableHead className="w-32 pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-32 text-center text-sm text-muted-foreground italic"
              >
                No {isHistory ? "processed" : "pending"} requests found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const isSelf = item.employee_id === currentUserId
              const emp = item.employee as Employee

              return (
                <TableRow
                  key={item.id}
                  className={`group ${selectedIds.has(item.id) ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
                >
                  {!isHistory && (
                    <TableCell className="pl-4">
                      <Checkbox
                        disabled={isSelf}
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => onToggleOne(item.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border shadow-sm">
                        <AvatarImage src={emp?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary uppercase">
                          {emp?.first_name[0]}
                          {emp?.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="mb-1 truncate text-sm leading-none font-bold">
                          {emp?.first_name} {emp?.last_name}
                        </p>
                        <p className="text-[10px] font-medium tracking-tighter text-muted-foreground uppercase">
                          {emp?.department || "Staff"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {type === "timeoff" && (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{item.category?.name}</span>
                          <span className="font-normal text-muted-foreground">
                            {format(new Date(item.start_date), "MMM d")} -{" "}
                            {format(new Date(item.end_date), "MMM d")}
                          </span>
                        </div>
                      )}
                      {type === "infochange" && (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="capitalize">
                            Update {item.field_name.replace(/_/g, " ")}
                          </span>
                        </div>
                      )}
                      {type === "correction" && (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>
                            Correction for{" "}
                            {format(
                              new Date(item.clock_entry?.date),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden text-[11px] font-medium text-muted-foreground tabular-nums md:table-cell">
                    {format(new Date(item.created_at), "MMM d, h:mm a")}
                  </TableCell>

                  <TableCell className="pr-6 text-right">
                    {isSelf ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-[9px] font-bold text-amber-700 uppercase"
                      >
                        Self-Request
                      </Badge>
                    ) : isHistory ? (
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase ${
                          item.status === "approved"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    ) : (
                      <div className="flex justify-end gap-1 opacity-0 transition-all group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => onReview(item, "approved")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-destructive hover:bg-red-50 hover:text-red-700"
                          onClick={() => onReview(item, "denied")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
