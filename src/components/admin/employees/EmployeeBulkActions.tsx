import { Download, UserX, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  selectedCount: number
  onClearSelection: () => void
  onBulkDeactivate: () => void
  onExport: () => void
  isDeactivating: boolean
}

export function EmployeeBulkActions({
  selectedCount,
  onClearSelection,
  onBulkDeactivate,
  onExport,
  isDeactivating,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      {selectedCount > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-1.5">
            <span className="text-sm font-medium tabular-nums">
              {selectedCount} selected
            </span>
            <button
              onClick={onClearSelection}
              className="ml-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            onClick={onBulkDeactivate}
            disabled={isDeactivating}
          >
            <UserX className="mr-1.5 h-3.5 w-3.5" />
            Deactivate {selectedCount}
          </Button>
        </div>
      ) : (
        <div />
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="ml-auto gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        Export CSV
      </Button>
    </div>
  )
}
