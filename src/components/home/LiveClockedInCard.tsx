import { useState } from "react"
import { Search, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LiveClockedInCard({ liveEntries }: { liveEntries: any[] }) {
  const [q, setQ] = useState("")
  const filtered = liveEntries.filter((e) =>
    `${e.employee?.first_name} ${e.employee?.last_name}`
      .toLowerCase()
      .includes(q.toLowerCase())
  )

  return (
    <Card className="flex h-[400px] flex-col">
      <CardHeader className="">
        <CardTitle className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-500" /> Active Now
          </div>
          <span className="tabular-nums">{liveEntries.length}</span>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search team..."
            className="h-8 border-none bg-muted/30 pl-8 text-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full border-t">
          <div className="divide-y">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={e.employee?.avatar_url} />
                    <AvatarFallback>{e.employee?.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm leading-none font-semibold">
                    {e.employee?.first_name} {e.employee?.last_name}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">
                    {e.employee?.department || "Staff"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
