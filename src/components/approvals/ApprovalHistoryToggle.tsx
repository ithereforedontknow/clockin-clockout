import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, History } from "lucide-react"

export function ApprovalHistoryToggle({
  value,
  onValueChange,
}: {
  value: boolean
  onValueChange: (v: boolean) => void
}) {
  return (
    <Tabs
      value={value ? "history" : "pending"}
      onValueChange={(v) => onValueChange(v === "history")}
      className="w-fit"
    >
      <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg border bg-muted/50 p-1">
        <TabsTrigger
          value="pending"
          className="gap-1.5 rounded-md px-4 text-[10px] font-bold tracking-tight uppercase"
        >
          <Clock className="h-3 w-3" /> Pending
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="gap-1.5 rounded-md px-4 text-[10px] font-bold tracking-tight uppercase"
        >
          <History className="h-3 w-3" /> History
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
