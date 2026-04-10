import { useAllTrainingRecords, useEmployees } from "@/lib/queries"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function TeamProgressPanel() {
  const { data: employees = [] } = useEmployees()
  const { data: assignments = [] } = useAllTrainingRecords()
  const navigate = useNavigate()

  // Group assignments by employee
  const employeeProgress = employees.map((emp) => {
    const empAssignments = assignments.filter(
      (a: any) => a.user_id === emp.user_id
    )
    const completed = empAssignments.filter((a) => a.completed_at).length
    const total = empAssignments.length
    return { emp, completed, total, assignments: empAssignments }
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Training Progress</CardTitle>
        <Button onClick={() => navigate("/admin/courses")}>
          Assign Course
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeProgress.map(
              ({ emp, completed, total, assignments: _assignments }) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    {emp.first_name} {emp.last_name}
                  </TableCell>
                  <TableCell>{completed}</TableCell>
                  <TableCell>{total}</TableCell>
                  <TableCell className="w-32">
                    <Progress
                      value={total ? (completed / total) * 100 : 0}
                      className="h-2"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/employee/${emp.id}/training`)
                      }
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
