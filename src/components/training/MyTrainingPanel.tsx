import { useState } from "react"
import { useMyTrainingRecord, useCourseCategories } from "@/lib/queries"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Search, BookOpen, AlertCircle } from "lucide-react"
import { TrainingCard } from "@/components/training/TrainingCard"
import { CertificationsPanel } from "@/components/training/CertificationsPanel"
import { Skeleton } from "@/components/ui/skeleton"
import type { TrainingRecord } from "@/lib/supabase"

export function MyTrainingPanel() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { data: records = [], isLoading } = useMyTrainingRecord()
  const { data: categories = [] } = useCourseCategories()

  const filtered = records.filter((r) => {
    if (
      search &&
      !r.curriculum_title.toLowerCase().includes(search.toLowerCase())
    )
      return false
    if (statusFilter !== "all" && r.status !== statusFilter) return false
    if (categoryFilter !== "all" && r.category_id !== categoryFilter)
      return false
    return true
  })

  const stats = {
    total: records.length,
    completed: records.filter((r) => r.status === "completed").length,
    active: records.filter(
      (r) => r.status === "pending" || r.status === "due_soon"
    ).length,
    overdue: records.filter((r) => r.status === "overdue").length,
  }

  const urgent = records.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  )

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Assigned",
            value: stats.total,
            valueClass: "text-foreground",
          },
          {
            label: "Completed",
            value: stats.completed,
            valueClass: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "In Progress",
            value: stats.active,
            valueClass: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            valueClass:
              stats.overdue > 0
                ? "text-red-600 dark:text-red-400"
                : "text-foreground",
          },
        ].map(({ label, value, valueClass }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p
              className={`mt-1 text-3xl font-semibold tabular-nums ${valueClass}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <CertificationsPanel />

      {/* Urgent alert */}
      {urgent.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-900/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">
              {urgent.length} course{urgent.length > 1 ? "s" : ""}
            </span>{" "}
            {urgent.length === 1 ? "requires" : "require"} your attention
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">In Progress</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-25" />
          <p className="font-medium">
            {search || statusFilter !== "all" || categoryFilter !== "all"
              ? "No matching courses"
              : "No courses assigned yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r: TrainingRecord) => (
            <TrainingCard key={r.curriculum_id} record={r} />
          ))}
        </div>
      )}
    </div>
  )
}
