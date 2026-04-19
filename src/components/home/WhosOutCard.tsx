import { useState, useMemo } from "react"
import { Users, Search, CalendarX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function WhosOutCard({ whosOut }: { whosOut: any[] }) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return whosOut.filter((req) =>
      `${req.employee?.first_name} ${req.employee?.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [whosOut, search])

  return (
    <Card className="flex h-[400px] flex-col">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" /> Away This Week
          </div>
          <div className="flex -space-x-2">
            {whosOut.slice(0, 3).map((req, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={req.employee?.avatar_url} />
                <AvatarFallback className="text-[8px]">
                  {req.employee?.first_name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {whosOut.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[8px] font-bold">
                +{whosOut.length - 3}
              </div>
            )}
          </div>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search away staff..."
            className="h-8 border-none bg-muted/30 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <CalendarX className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-xs italic">
                  {search ? "No matches found" : "Everyone is in today 🎉"}
                </p>
              </div>
            ) : (
              filtered.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
                >
                  <Avatar className="h-7 w-7 shrink-0 border">
                    <AvatarImage src={req.employee?.avatar_url} />
                    <AvatarFallback className="text-[10px] font-semibold">
                      {req.employee?.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {req.employee?.first_name} {req.employee?.last_name}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Until {format(new Date(req.end_date), "MMM d")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-[9px] font-medium text-slate-600"
                  >
                    {req.category?.name}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
