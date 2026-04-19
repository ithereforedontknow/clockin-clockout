import { format } from "date-fns"
import { Check, X, Calendar, User, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function RequestCard({ item, type, onReview, isSelf, isHistory }: any) {
  const emp = item.employee

  return (
    <Card
      className={`overflow-hidden border-none shadow-sm ring-1 ring-border ${isSelf ? "opacity-75" : ""}`}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border shadow-sm">
              <AvatarImage src={emp?.avatar_url} />
              <AvatarFallback className="bg-primary/5 text-[10px] font-bold text-primary">
                {emp?.first_name[0]}
                {emp?.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="mb-1 truncate text-sm leading-none font-bold">
                {emp?.first_name} {emp?.last_name}
              </p>
              <p className="text-[10px] font-bold tracking-tighter text-muted-foreground uppercase">
                {emp?.department || "Staff"}
              </p>
            </div>
          </div>
          {isSelf && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-[9px] font-bold text-amber-700 uppercase"
            >
              Self
            </Badge>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-border/50 bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {type === "timeoff" && (
              <>
                <Calendar className="h-3 w-3 text-primary" />{" "}
                {item.category?.name}
              </>
            )}
            {type === "infochange" && (
              <>
                <User className="h-3 w-3 text-primary" /> Profile Update
              </>
            )}
            {type === "corrections" && (
              <>
                <Clock className="h-3 w-3 text-primary" /> Clock Correction
              </>
            )}
          </div>

          <div className="space-y-0.5 text-[11px] text-muted-foreground">
            {type === "timeoff" && (
              <p>
                {format(new Date(item.start_date), "MMM d")} -{" "}
                {format(new Date(item.end_date), "MMM d, yyyy")}
              </p>
            )}
            {type === "infochange" && (
              <p className="capitalize">
                Changed: {item.field_name.replace(/_/g, " ")}
              </p>
            )}
            <p>
              Submitted {format(new Date(item.created_at), "MMM d, h:mm a")}
            </p>
          </div>
        </div>

        {!isHistory && !isSelf && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 flex-1 border-red-100 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onReview(item, "denied")}
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Deny
            </Button>
            <Button
              className="h-9 flex-1 text-xs font-bold"
              onClick={() => onReview(item, "approved")}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
            </Button>
          </div>
        )}

        {isHistory && (
          <Badge
            variant="outline"
            className={`w-full justify-center py-1 text-[10px] font-bold uppercase ${
              item.status === "approved"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {item.status}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
