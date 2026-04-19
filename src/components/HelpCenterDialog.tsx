import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ExternalLink, Book, MessageSquare, LifeBuoy } from "lucide-react"

export function HelpCenterDialog({ open, onClose }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[400px]">
        <DialogHeader className="border-b bg-muted/20 p-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <LifeBuoy className="h-5 w-5 text-primary" /> Help Center
          </DialogTitle>
          <DialogDescription className="text-xs font-bold tracking-widest uppercase opacity-60">
            Resources & Support
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 p-4">
          <HelpLink
            icon={Book}
            title="Documentation"
            desc="Learn how to use the platform"
          />
          <HelpLink
            icon={MessageSquare}
            title="Contact Support"
            desc="Get help from our HR team"
          />
        </div>

        <div className="flex justify-center border-t bg-muted/30 p-6">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Version 1.2.0-stable
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function HelpLink({ icon: Icon, title, desc }: any) {
  return (
    <button className="group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-muted">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-primary" />
    </button>
  )
}
