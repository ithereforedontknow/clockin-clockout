import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { GraduationCap, Play, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useCourseProgress } from "@/lib/queries"
import type { TrainingRecord } from "@/lib/supabase"

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  overdue: {
    label: "Overdue",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400",
    dot: "bg-red-500",
  },
  due_soon: {
    label: "Due Soon",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-400",
    dot: "bg-amber-400",
  },
  pending: {
    label: "In Progress",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-400",
    dot: "bg-blue-500",
  },
} as const

export function TrainingCard({ record }: { record: TrainingRecord }) {
  const { data: progress } = useCourseProgress(record.curriculum_id)
  const navigate = useNavigate()
  const cfg =
    STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending
  const pct = progress?.percentage ?? 0

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
      onClick={() => navigate(`/training/courses/${record.curriculum_id}`)}
    >
      {/* Thumbnail */}
      {record.thumbnail_url ? (
        <img
          src={record.thumbnail_url}
          alt=""
          className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <GraduationCap className="h-12 w-12 text-primary/20 transition-transform duration-300 group-hover:scale-110" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {record.category_name && (
          <Badge
            variant="outline"
            className="w-fit text-[10px] font-medium tracking-wide uppercase"
          >
            {record.category_name}
          </Badge>
        )}

        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm leading-snug font-semibold group-hover:text-primary">
            {record.curriculum_title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 gap-1 text-[10px] font-medium ${cfg.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-medium">{pct}% complete</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due {format(new Date(record.due_date), "MMM d")}
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {/* CTA */}
        <Button
          size="sm"
          variant={pct > 0 && pct < 100 ? "outline" : "default"}
          className="mt-auto w-full"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/training/courses/${record.curriculum_id}`)
          }}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {pct === 0 ? "Start Course" : pct === 100 ? "Review" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
