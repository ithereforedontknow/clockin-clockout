import { format } from "date-fns"
import { GraduationCap, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TabId } from "@/components/AppShell"

interface Props {
  trainingRecords: any[]
  onNavigate?: (tab: TabId) => void
}

export function MyCoursesCard({ trainingRecords, onNavigate }: Props) {
  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-primary" /> My Training
            Path
          </div>
          <button
            onClick={() => onNavigate?.("training")}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            View Full Curriculum
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full border-t">
          <div className="divide-y">
            {trainingRecords.length === 0 ? (
              <p className="p-12 text-center text-sm text-muted-foreground italic">
                No training assigned
              </p>
            ) : (
              trainingRecords.map((r) => (
                <button
                  key={r.curriculum_id}
                  onClick={() => onNavigate?.("training")}
                  className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${r.status === "completed" ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-background text-slate-400 group-hover:border-primary group-hover:text-primary"}`}
                  >
                    {r.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <GraduationCap className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                      {r.curriculum_title}
                    </p>
                    <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                      Due {format(new Date(r.due_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
