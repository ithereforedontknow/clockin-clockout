import { Bell, Settings, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppHeader({ tab, onOpenSettings }: any) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-8 backdrop-blur-md">
      {/* SaaS Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
        <span>Workspace</span>
        <ChevronRight className="h-3 w-3 opacity-30" />
        <span className="text-foreground">{tab || "Home"}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full border-2 border-background bg-red-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
