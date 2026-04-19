import { Users, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  hasFilters: boolean
  onClearFilters: () => void
  onAddEmployee: () => void
}

export function EmptyState({
  hasFilters,
  onClearFilters,
  onAddEmployee,
}: Props) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No employees found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">No employees yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first employee to get started
        </p>
      </div>
      <Button size="sm" onClick={onAddEmployee} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add Employee
      </Button>
    </div>
  )
}
