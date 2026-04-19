import { format } from "date-fns"
import { GraduationCap, Play, Clock, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useNavigate } from "react-router-dom"

const STATUS_STYLE: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  due_soon: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
}

export function TrainingCard({ record }: { record: any }) {
  const navigate = useNavigate()
  const pct = record.percent_watched ?? 0
  const isCompleted = record.status === "completed"

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl active:scale-[0.99]"
      onClick={() => navigate(`/training/courses/${record.curriculum_id}`)}
    >
      {/* Thumbnail with Overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {record.thumbnail_url ? (
          <img
            src={record.thumbnail_url}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            alt=""
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <GraduationCap className="h-12 w-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
            <Play className="ml-1 h-5 w-5 fill-current" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="outline"
              className={`text-[9px] font-bold tracking-tighter uppercase ${STATUS_STYLE[record.status]}`}
            >
              {record.status.replace("_", " ")}
            </Badge>
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
              <Clock className="h-3 w-3" />{" "}
              {format(new Date(record.due_date), "MMM d")}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm leading-tight font-bold transition-colors group-hover:text-primary">
            {record.curriculum_title}
          </h3>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
            <span>{isCompleted ? "Course Finished" : `${pct}% Complete`}</span>
            {isCompleted && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            )}
          </div>
          <Progress
            value={pct}
            className={`h-1.5 ${isCompleted ? "bg-emerald-100" : ""}`}
          />
        </div>
      </div>
    </div>
  )
}
