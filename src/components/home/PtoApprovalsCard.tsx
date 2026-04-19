import { format } from "date-fns"
import { Clock, Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function PtoApprovalsCard({ pendingTimeOff }: any) {
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" /> Pending Approvals
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {pendingTimeOff.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {pendingTimeOff.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground italic">
              No requests to review
            </p>
          ) : (
            pendingTimeOff.slice(0, 5).map((req: any) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
              >
                <Avatar className="h-8 w-8 shrink-0 border">
                  <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary">
                    {req.employee?.first_name[0]}
                    {req.employee?.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-sm leading-none font-bold">
                    {req.employee?.first_name} {req.employee?.last_name}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {format(new Date(req.start_date), "MMM d")} ·{" "}
                    {req.category?.name}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-destructive hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
