import { useState } from "react"
import { format } from "date-fns"
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useHolidays, useCreateHoliday, useDeleteHoliday } from "@/lib/queries"
import { toast } from "sonner"

export function HolidaysPanel() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [newName, setNewName] = useState("")
  const [newDate, setNewDate] = useState("")

  const { data: holidays = [], isLoading } = useHolidays(year)
  const createHoliday = useCreateHoliday()
  const deleteHoliday = useDeleteHoliday()

  const handleCreate = async () => {
    if (!newName.trim() || !newDate) {
      return toast.error("Please provide both a name and a date.")
    }

    // Parse "YYYY-MM-DD" to get month and day as integers
    const [, monthStr, dayStr] = newDate.split("-")
    const month = parseInt(monthStr)
    const day = parseInt(dayStr)

    try {
      await createHoliday.mutateAsync({
        name: newName.trim(),
        month,
        day,
      })
      toast.success("Holiday added to system")
      setIsAddOpen(false)
      setNewName("")
      setNewDate("")
    } catch (err: any) {
      toast.error(err.message || "Failed to add holiday")
    }
  }

  return (
    <div className="animate-in space-y-5 duration-500 fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-2xl border bg-muted/40 p-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 text-xs font-black tracking-[0.2em] uppercase tabular-nums">
            {year} Calendar
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          className="h-9 gap-2 px-4 font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Date
        </Button>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden border-none shadow-none ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-6 text-[10px] font-bold tracking-widest uppercase">
                Holiday Event
              </TableHead>
              <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                Date
              </TableHead>
              <TableHead className="hidden text-[10px] font-bold tracking-widest uppercase sm:table-cell">
                Day of Week
              </TableHead>
              <TableHead className="w-12 pr-6 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-40 animate-pulse text-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                >
                  Syncing Holiday Database...
                </TableCell>
              </TableRow>
            ) : holidays.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-40 text-center text-sm text-muted-foreground italic"
                >
                  No holidays recorded for {year}.
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((h: any) => {
                const d = new Date(year, h.month - 1, h.day)
                return (
                  <TableRow
                    key={h.id}
                    className="group transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="py-4 pl-6 text-sm font-bold text-foreground/80">
                      {h.name}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-muted-foreground tabular-nums">
                      {format(d, "MMMM do")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[9px] font-black text-slate-500 uppercase"
                      >
                        {format(d, "EEEE")}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        onClick={() => deleteHoliday.mutate({ id: h.id })}
                        disabled={
                          deleteHoliday.isPending &&
                          deleteHoliday.variables?.id === h.id
                        }
                      >
                        {deleteHoliday.isPending &&
                        deleteHoliday.variables?.id === h.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Holiday Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="flex flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-w-[450px]">
          <DialogHeader className="shrink-0 p-6 pb-2">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Add System Holiday
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              This date will be excluded from automatic time-off deductions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Holiday Name
              </Label>
              <Input
                placeholder="e.g. Independence Day"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Observe Date
              </Label>
              <Input
                type="date"
                value={newDate}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-10 font-medium"
              />
              <p className="text-[10px] font-medium text-muted-foreground italic">
                Selected date must be within the {year} calendar year.
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t bg-muted/20 p-6">
            <Button
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
              className="font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createHoliday.isPending || !newName.trim() || !newDate}
              className="px-8 font-bold shadow-md"
            >
              {createHoliday.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Register Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
