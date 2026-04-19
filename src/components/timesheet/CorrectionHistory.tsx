import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function CorrectionHistory({ corrections }: { corrections: any[] }) {
  if (corrections.length === 0) return null

  return (
    <Collapsible className="w-full overflow-hidden rounded-lg border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent Correction Requests
          <Badge variant="outline" className="ml-2">
            {corrections.length}
          </Badge>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="divide-y border-t">
        {corrections.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between bg-muted/10 p-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {c.clock_entry
                  ? format(new Date(c.clock_entry.date), "PPP")
                  : "Unknown Date"}
              </p>
              <p className="text-xs text-muted-foreground italic">
                "{c.reason}"
              </p>
            </div>
            <Badge
              variant={
                c.status === "approved"
                  ? "default"
                  : c.status === "denied"
                    ? "destructive"
                    : "secondary"
              }
              className="capitalize"
            >
              {c.status}
            </Badge>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
