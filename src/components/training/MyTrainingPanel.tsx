import { useState } from "react"
import { useMyTrainingRecord, useCourseCategories } from "@/lib/queries"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Assigned", value: stats.total, color: "" },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-green-600",
          },
          { label: "In Progress", value: stats.active, color: "text-blue-600" },
          {
            label: "Overdue",
            value: stats.overdue,
            color: stats.overdue > 0 ? "text-red-600" : "",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <CertificationsPanel />

      {urgent.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">
              {urgent.length} course{urgent.length > 1 ? "s" : ""}
            </span>{" "}
            need{urgent.length === 1 ? "s" : ""} your attention
          </p>
        </div>
      )}

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
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="pending">In Progress</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30" />
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
