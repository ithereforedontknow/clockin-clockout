import { Users, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
  onAddEmployee: () => void
}

export function EmptyState({
  hasFilters,
  onClearFilters,
  onAddEmployee,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/5 py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        {hasFilters ? (
          <Search className="h-6 w-6 text-muted-foreground/40" />
        ) : (
          <Users className="h-6 w-6 text-muted-foreground/40" />
        )}
      </div>
      <h3 className="text-sm font-bold text-foreground">
        {hasFilters ? "No matches found" : "Your database is empty"}
      </h3>
      <p className="mt-1 max-w-[240px] text-center text-xs text-muted-foreground">
        {hasFilters
          ? "Try adjusting your filters or search terms to find what you're looking for."
          : "Get started by adding your first employee to the workspace."}
      </p>
      <div className="mt-6">
        {hasFilters ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-8 font-bold"
          >
            Reset Filters
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onAddEmployee}
            className="h-9 gap-2 font-bold"
          >
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        )}
      </div>
    </div>
  )
}
