import { useState } from "react"
import { CalendarDays, Trash2, Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useHolidays, useCreateHoliday, useDeleteHoliday } from "@/lib/queries"
import type { CompanyHoliday } from "@/lib/supabase"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function HolidaysPanel() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [date, setDate] = useState("")

  const { data: holidays = [], isLoading } = useHolidays(year)
  const createHoliday = useCreateHoliday()
  const deleteHoliday = useDeleteHoliday()

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 1 + i
  )

  function resetForm() {
    setName("")
    setDate("")
    setAddOpen(false)
  }

  async function handleAdd() {
    if (!name.trim() || !date) {
      toast.error("Please provide a name and date")
      return
    }
    const [, m, d] = date.split("-").map(Number)
    try {
      await createHoliday.mutateAsync({ name: name.trim(), month: m, day: d })
      toast.success(`"${name.trim()}" added`)
      resetForm()
    } catch (err: any) {
      toast.error("Failed to add holiday", { description: err.message })
    }
  }

  async function handleDelete(holiday: CompanyHoliday) {
    try {
      await deleteHoliday.mutateAsync(holiday.id)
      toast.success(`"${holiday.name}" removed`)
    } catch (err: any) {
      toast.error("Failed to delete holiday", { description: err.message })
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Holiday
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-2.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
            </div>
          ) : holidays.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
              <CalendarDays className="h-8 w-8 opacity-25" />
              <p className="text-sm">No holidays for {year}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-medium">Holiday</TableHead>
                  <TableHead className="text-xs font-medium">Date</TableHead>
                  <TableHead className="hidden text-xs font-medium sm:table-cell">
                    Day
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => {
                  const d = new Date(year, h.month - 1, h.day)
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <TableRow
                      key={h.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="text-sm font-medium">
                        {h.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {format(d, "MMM d")}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${isWeekend ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400" : ""}`}
                        >
                          {DAYS[d.getDay()]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(h)}
                          disabled={deleteHoliday.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              This holiday will be excluded from time-off day counts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Independence Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={createHoliday.isPending}
            >
              {createHoliday.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Holiday"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
