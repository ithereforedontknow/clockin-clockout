import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface LeaveBalancesCardProps {
  balances: any[]
  isLoading: boolean
}

export function LeaveBalancesCard({
  balances,
  isLoading,
}: LeaveBalancesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Leave Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {balances.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="space-y-1 border-l-2 border-muted pl-3"
              >
                <p className="truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {b.category?.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold tracking-tight tabular-nums">
                    {b.balance}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    {b.category?.unit}
                  </span>
                </div>
                {b.scheduled > 0 && (
                  <p className="text-[10px] font-medium text-amber-600">
                    −{b.scheduled} scheduled
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {!isLoading && balances.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground italic">
            No balances configured
          </p>
        )}
      </CardContent>
    </Card>
  )
}
