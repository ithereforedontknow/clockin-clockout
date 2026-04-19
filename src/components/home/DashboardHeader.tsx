import { format } from "date-fns"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  employeeName?: string
  isLoading: boolean
  holidays: any[]
  onRequestPto: () => void
}

export function DashboardHeader({
  employeeName,
  isLoading,
  holidays,
  onRequestPto,
}: HeaderProps) {
  const upcomingHoliday = holidays?.[0]

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {isLoading ? "Loading..." : `Welcome, ${employeeName}`} 👋
        </h1>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(), "EEEE, MMMM do")}
          {upcomingHoliday && (
            <span className="ml-2 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-tighter text-amber-700 uppercase">
              Next Holiday: {upcomingHoliday.name}
            </span>
          )}
        </div>
      </div>
      <Button onClick={onRequestPto} size="sm" className="shadow-sm">
        <Plus className="mr-2 h-4 w-4" /> Request Time Off
      </Button>
    </div>
  )
}
