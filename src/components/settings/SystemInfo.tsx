import { ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { isTimezoneManila, TIMEZONE } from "@/lib/timezone"
import { Card, CardContent } from "@/components/ui/card"

export function SystemInfo() {
  const correctTz = isTimezoneManila()

  return (
    <div className="animate-in space-y-8 duration-300 fade-in">
      <Card className="border-none bg-muted/20 shadow-none ring-1 ring-border">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                Primary Timezone
              </p>
              <p className="text-sm font-black tabular-nums">{TIMEZONE}</p>
            </div>
            <Badge
              className={cn(
                "h-5 px-2 text-[9px] font-black uppercase",
                correctTz
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-700"
              )}
            >
              {correctTz ? "Synchronized" : "Drift Detected"}
            </Badge>
          </div>

          <Separator className="opacity-50" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                Local Currency
              </p>
              <p className="text-sm font-black tracking-tight">
                Philippine Peso (PHP)
              </p>
            </div>
            <span className="text-xl font-bold opacity-30">₱</span>
          </div>

          <Separator className="opacity-50" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                Data Infrastructure
              </p>
              <p className="text-sm font-black tracking-tight">
                Standard UTC Storage
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary opacity-40" />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-dashed px-4 py-4 text-center">
        <p className="text-[10px] leading-relaxed font-medium tracking-[0.3em] text-muted-foreground uppercase">
          Staffolio Infrastructure v1.2-Stable <br />
          Distributed via Global Edge Network
        </p>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
