import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEmployees, useAllTrainingRecords } from "@/lib/queries"

export function EmployeeTrainingPage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const { data: employees = [] } = useEmployees()
  const { data: records = [] } = useAllTrainingRecords()

  const employee = employees.find((e) => e.id === employeeId)
  const empRecords = records.filter((r) => r.user_id === employeeId)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {employee
            ? `${employee.first_name} ${employee.last_name}`
            : "Employee"}{" "}
          — Training
        </h1>
      </div>

      {empRecords.length === 0 ? (
        <p className="text-muted-foreground">No courses assigned.</p>
      ) : (
        <div className="space-y-3">
          {empRecords.map((r) => (
            <div
              key={r.curriculum_id}
              className="flex justify-between rounded-lg border p-4"
            >
              <span className="font-medium">{r.curriculum_title}</span>
              <span className="text-sm text-muted-foreground capitalize">
                {r.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
