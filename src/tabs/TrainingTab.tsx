import { useMyTrainingRecord } from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Users, Trophy, AlertCircle } from "lucide-react"
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning Hub</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isInstructorOrAdmin
              ? "Manage courses and track team progress"
              : "Continue your learning journey"}
          </p>
        </div>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {urgentCount} urgent
          </Badge>
        )}
      </div>

      <Tabs defaultValue="my-training">
        <TabsList>
          <TabsTrigger value="my-training" className="gap-2">
            <BookOpen className="h-4 w-4" /> My Training
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" /> Calendar
          </TabsTrigger>
          {hasPermission("view_all_employees") && (
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
          )}
          {hasPermission("manage_training") && (
            <TabsTrigger value="courses" className="gap-2">
              <Trophy className="h-4 w-4" /> Manage Courses
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-training" className="mt-5">
          <MyTrainingPanel />
        </TabsContent>
        <TabsContent value="calendar" className="mt-5">
          <TrainingCalendar />
        </TabsContent>
        {hasPermission("view_all_employees") && (
          <TabsContent value="team" className="mt-5">
            <TeamProgressPanel />
          </TabsContent>
        )}
        {hasPermission("manage_training") && (
          <TabsContent value="courses" className="mt-5">
            <ManageCoursesPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
