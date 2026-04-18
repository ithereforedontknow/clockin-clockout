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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Learning Hub
          </h1>
          <p className="text-sm text-muted-foreground">
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
      <Tabs defaultValue="my-training" className="space-y-6">
        <TabsList className="h-10 rounded-lg bg-muted/60 p-1">
          <TabsTrigger
            value="my-training"
            className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5" />
            My Training
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Calendar className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
          {hasPermission("view_all_employees") && (
            <TabsTrigger
              value="team"
              className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              Team
            </TabsTrigger>
          )}
          {hasPermission("manage_training") && (
            <TabsTrigger
              value="courses"
              className="flex items-center gap-2 rounded-md px-4 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage Courses
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-training">
          <MyTrainingPanel />
        </TabsContent>
        <TabsContent value="calendar">
          <TrainingCalendar />
        </TabsContent>
        {hasPermission("view_all_employees") && (
          <TabsContent value="team">
            <TeamProgressPanel />
          </TabsContent>
        )}
        {hasPermission("manage_training") && (
          <TabsContent value="courses">
            <ManageCoursesPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
