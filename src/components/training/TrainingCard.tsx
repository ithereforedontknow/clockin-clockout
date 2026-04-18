import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { GraduationCap, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useCourseProgress } from "@/lib/queries"
import type { TrainingRecord } from "@/lib/supabase"

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    badge: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  overdue: {
    label: "Overdue",
    badge: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  due_soon: {
    label: "Due Soon",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  pending: {
    label: "In Progress",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-400",
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
      className="group cursor-pointer rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
      onClick={() => navigate(`/training/courses/${record.curriculum_id}`)}
    >
      {record.thumbnail_url ? (
        <img
          src={record.thumbnail_url}
          alt=""
          className="mb-4 h-28 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mb-4 flex h-28 w-full items-center justify-center rounded-lg bg-primary/5">
          <GraduationCap className="h-10 w-10 text-primary/20" />
        </div>
      )}

      <div className="space-y-3">
        {record.category_name && (
          <Badge variant="outline" className="mb-1 text-[10px]">
            {record.category_name}
          </Badge>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm leading-snug font-semibold group-hover:text-primary">
            {record.curriculum_title}
          </h3>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${cfg.badge}`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`}
            />
            {cfg.label}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% complete</span>
            <span>Due {format(new Date(record.due_date), "MMM d")}</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <Button
          size="sm"
          variant={pct > 0 && pct < 100 ? "outline" : "default"}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/training/courses/${record.curriculum_id}`)
          }}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {pct === 0 ? "Start" : pct === 100 ? "Review" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
