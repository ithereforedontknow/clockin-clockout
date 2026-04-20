import { Settings, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NotificationBell } from "./NotificationBell" // Ensure path is correct

interface AppHeaderProps {
  tab: string
  employeeId: string
  onNavigate: (tab: any) => void
  onOpenSettings: () => void
}

export function AppHeader({
  tab,
  employeeId,
  onNavigate,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-8 backdrop-blur-md">
      {/* SaaS Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
        <span className="opacity-50">Workspace</span>
        <ChevronRight className="h-3 w-3 opacity-20" />
        <span className="text-foreground">{tab || "Home"}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* FIX: Use the actual functional component instead of a static button */}
        <NotificationBell employeeId={employeeId} onNavigate={onNavigate} />

        <Separator orientation="vertical" className="mx-1 h-4 opacity-50" />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-colors hover:bg-muted"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  )
}
