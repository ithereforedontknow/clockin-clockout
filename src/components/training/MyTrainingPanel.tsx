import { useState } from "react"
import { Search, BookOpen, AlertCircle } from "lucide-react"
import { useMyTrainingRecord } from "@/lib/queries"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { TrainingCard } from "@/components/training/TrainingCard"
import { CertificationsPanel } from "@/components/training/CertificationsPanel"
import type { TrainingRecord } from "@/lib/supabase"

export function MyTrainingPanel() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: records = [], isLoading } = useMyTrainingRecord()

  const filtered = records.filter((r) => {
    if (
      search &&
      !r.curriculum_title.toLowerCase().includes(search.toLowerCase())
    )
      return false
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    return true
  })

  const stats = {
    active: records.filter(
      (r) => r.status === "pending" || r.status === "due_soon"
    ).length,
    completed: records.filter((r) => r.status === "completed").length,
  }
  const urgent = records.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  )

  return (
    <div className="animate-in space-y-8 duration-500 fade-in">
      {/* High-Impact Alert */}
      {urgent.length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-900">
              Immediate Action Required
            </p>
            <p className="text-xs font-medium text-red-700">
              You have {urgent.length} course{urgent.length > 1 ? "s" : ""} that
              are overdue or due soon.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-muted/40 p-5">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            In Progress
          </p>
          <p className="mt-1 text-3xl font-black tracking-tighter text-primary tabular-nums">
            {stats.active}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-900/50">
          <p className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">
            Completed
          </p>
          <p className="mt-1 text-3xl font-black tracking-tighter text-emerald-600 tabular-nums dark:text-emerald-300">
            {stats.completed}
          </p>
        </div>
      </div>

      <CertificationsPanel />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Find a course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-muted/30 pl-10 shadow-none"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full text-xs font-bold sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-muted-foreground">
            <BookOpen className="mb-3 h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No courses found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r: TrainingRecord) => (
              <TrainingCard key={r.curriculum_id} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
