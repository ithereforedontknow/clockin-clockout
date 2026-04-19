import { Loader2, AlertTriangle, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Employee } from "@/lib/supabase"

interface Props {
  target: { employee: Employee; action: "deactivate" | "reactivate" }
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function DeactivateConfirmDialog({
  target,
  onClose,
  onConfirm,
  isPending,
}: Props) {
  const isDeactivate = target.action === "deactivate"

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div
            className={`mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full ${isDeactivate ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}
          >
            {isDeactivate ? (
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            ) : (
              <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <DialogTitle className="text-center text-base">
            {isDeactivate ? "Deactivate" : "Reactivate"}{" "}
            {target.employee.first_name}?
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {isDeactivate
              ? "They'll be marked inactive and lose access. You can reactivate them at any time."
              : "They'll regain full access and reappear in the active directory."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant={isDeactivate ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isDeactivate ? "Deactivating…" : "Reactivating…"}
              </>
            ) : (
              <>{isDeactivate ? "Deactivate" : "Reactivate"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
