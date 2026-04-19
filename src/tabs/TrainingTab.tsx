import { useMyTrainingRecord } from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Calendar,
  Users,
  Settings2,
  AlertTriangle,
} from "lucide-react"
import {
  MyTrainingPanel,
  TrainingCalendar,
  TeamProgressPanel,
  ManageCoursesPanel,
} from "@/components/training"

export function TrainingTab() {
  const { hasPermission, role } = usePermissions()
  const { data: records = [] } = useMyTrainingRecord()
  const urgentCount = records.filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  ).length
  const isInstructorOrAdmin = role === "employer" || role === "admin"

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-8 pb-12 duration-500 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {isInstructorOrAdmin
              ? "Manage courses and track team progress"
              : "Continue your learning journey"}
          </p>
        </div>
        {urgentCount > 0 && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {urgentCount} need{urgentCount === 1 ? "s" : ""} attention
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-10 w-full justify-start rounded-lg bg-muted/60 p-1 sm:w-auto">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 rounded-md px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="flex items-center gap-2 rounded-md px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
          {hasPermission("view_all_employees") && (
            <TabsTrigger
              value="team"
              className="flex items-center gap-2 rounded-md px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              Team
            </TabsTrigger>
          )}
          {hasPermission("manage_training") && (
            <TabsTrigger
              value="courses"
              className="flex items-center gap-2 rounded-md px-4 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage Courses
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <MyTrainingPanel />
        </TabsContent>
        <TabsContent value="calendar" className="mt-0">
          <TrainingCalendar />
        </TabsContent>
        {hasPermission("view_all_employees") && (
          <TabsContent value="team" className="mt-0">
            <TeamProgressPanel />
          </TabsContent>
        )}
        {hasPermission("manage_training") && (
          <TabsContent value="courses" className="mt-0">
            <ManageCoursesPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
