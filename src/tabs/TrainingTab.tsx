import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TeamProgressPanel } from "@/components/training/TeamProgressPanel"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCurrentEmployee,
  useMyTrainingRecord,
  // useCurriculumDetail,
  // useMyCertifications,
  useCourseProgress,
} from "@/lib/queries"
import type { TrainingRecord } from "@/lib/supabase"
import { CoursesPanel } from "@/components/training/CoursesPanel"
function TrainingCard({ record }: { record: TrainingRecord }) {
  const { data: progress } = useCourseProgress(record.curriculum_id)
  const navigate = useNavigate()
  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-xl"
      onClick={() => navigate(`/training/courses/${record.curriculum_id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">
              {record.curriculum_title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Due {format(new Date(record.due_date), "MMM d, yyyy")}
            </p>
          </div>

          {/* Progress Ring */}
          <div className="relative size-14">
            <svg className="size-14 -rotate-90" viewBox="0 0 42 42">
              <circle
                cx="21"
                cy="21"
                r="15"
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="5"
              />
              <circle
                cx="21"
                cy="21"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={`${progress?.percentage || 0} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {progress?.percentage || 0}%
            </div>
          </div>
        </div>

        <Badge className="mt-6" variant="outline">
          {record.status.replace("_", " ")}
        </Badge>
      </CardContent>
    </Card>
  )
}
// My Training Panel
function MyTrainingPanel({
  onCourseClick,
}: {
  onCourseClick: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { data: records = [], isLoading } = useMyTrainingRecord()

  const filteredRecords = records.filter((record) => {
    if (
      search &&
      !record.curriculum_title.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }
    if (statusFilter !== "all" && record.status !== statusFilter) {
      return false
    }
    return true
  })

  const stats = {
    total: records.length,
    completed: records.filter((r) => r.status === "completed").length,
    inProgress: records.filter((r) => r.status === "pending").length,
    overdue: records.filter((r) => r.status === "overdue").length,
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <StatBadge label="Total" value={stats.total} color="blue" />
        <StatBadge label="Completed" value={stats.completed} color="green" />
        <StatBadge label="In Progress" value={stats.inProgress} color="amber" />
        <StatBadge label="Overdue" value={stats.overdue} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="pending">In Progress</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {filteredRecords.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {search || statusFilter !== "all"
            ? "No matching courses found"
            : "No courses assigned yet"}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record: TrainingRecord) => (
            <TrainingCard
              key={record.curriculum_id}
              record={record}
              // onCourseClick={onCourseClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
  }
  return (
    <div
      className={`rounded-lg border p-3 text-center ${colors[color as keyof typeof colors]}`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
export function TrainingTab() {
  const { data: employee } = useCurrentEmployee()
  const isInstructorOrAdmin =
    employee?.role === "employer" || employee?.role === "admin"
  const [, setSelectedCourseId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Hub</h1>
        <p className="text-muted-foreground">
          {isInstructorOrAdmin
            ? "Manage courses and team learning"
            : "Continue your learning journey"}
        </p>
      </div>

      <Tabs defaultValue="my-training">
        <TabsList>
          <TabsTrigger value="my-training">My Training</TabsTrigger>
          {isInstructorOrAdmin && (
            <TabsTrigger value="team">Team Progress</TabsTrigger>
          )}
          {isInstructorOrAdmin && (
            <TabsTrigger value="courses">Manage Courses</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="team" className="mt-6">
          <TeamProgressPanel />
        </TabsContent>
        <TabsContent value="my-training" className="mt-6">
          <MyTrainingPanel onCourseClick={setSelectedCourseId} />
        </TabsContent>

        {isInstructorOrAdmin && (
          <TabsContent value="courses" className="mt-6">
            <CoursesPanel employee={employee!} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
