import { useState } from "react"
import { CalendarDays, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
      toast.error("Please provide both a name and a date.")
      return
    }
    try {
      // after
      const [, m, d] = date.split("-").map(Number)
      await createHoliday.mutateAsync({ name: name.trim(), month: m, day: d })
      toast.success(`"${name.trim()}" added.`)
      resetForm()
    } catch (err: any) {
      toast.error("Failed to add holiday.", { description: err.message })
    }
  }

  async function handleDelete(holiday: CompanyHoliday) {
    try {
      await deleteHoliday.mutateAsync(holiday.id)
      toast.success(`"${holiday.name}" removed.`)
    } catch (err: any) {
      toast.error("Failed to delete holiday.", { description: err.message })
    }
  }

  return (
    <div className="space-y-4">
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
        <Button onClick={() => setAddOpen(true)}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
          ) : holidays.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <CalendarDays className="h-8 w-8 opacity-30" />
              <p className="text-sm">No holidays for {year}.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(year, h.month - 1, h.day), "MMM d")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(year, h.month - 1, h.day), "EEEE")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(h)}
                        disabled={deleteHoliday.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add holiday</DialogTitle>
            <DialogDescription>
              This holiday will be excluded from time-off day counts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="h-name">Name</Label>
              <Input
                id="h-name"
                placeholder="e.g. Independence Day"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-date">Date</Label>
              <Input
                id="h-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createHoliday.isPending}>
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
