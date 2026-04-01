import { useState } from "react"
import { Save, Loader2, Pencil, X, Clock } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  useCurrentEmployee,
  useUpdateEmployee,
  useSubmitInfoChange,
  useSentRequests,
  useCancelInfoChange,
} from "@/lib/queries"
import type { Employee } from "@/lib/supabase"

// Only HR-sensitive fields require approval — personal info saves directly
const APPROVAL_REQUIRED_FIELDS: (keyof Employee)[] = [
  "job_title",
  "department",
  "location",
]

type EditableField = { key: keyof Employee; label: string; section: string }

const EDITABLE_FIELDS: EditableField[] = [
  { key: "first_name", label: "First Name", section: "Personal" },
  { key: "last_name", label: "Last Name", section: "Personal" },
  { key: "preferred_name", label: "Preferred Name", section: "Personal" },
  { key: "email", label: "Work Email", section: "Personal" },
  { key: "phone", label: "Phone", section: "Personal" },
  { key: "birthday", label: "Birthday", section: "Personal" },
  { key: "address_line1", label: "Address", section: "Personal" },
  { key: "city", label: "City", section: "Personal" },
  { key: "country", label: "Country", section: "Personal" },
  // Work fields — require approval
  { key: "job_title", label: "Job Title", section: "Work" },
  { key: "department", label: "Department", section: "Work" },
  { key: "location", label: "Location", section: "Work" },
  { key: "hire_date", label: "Hire Date", section: "Work" },
  // Emergency — direct save, no approval needed
  { key: "emergency_name", label: "Emergency Contact", section: "Emergency" },
  { key: "emergency_phone", label: "Emergency Phone", section: "Emergency" },
  { key: "emergency_relation", label: "Relationship", section: "Emergency" },
]

const SECTIONS = ["Personal", "Work", "Emergency"]

export function MyInfoTab() {
  const { data: employee, isLoading } = useCurrentEmployee()
  const updateEmployee = useUpdateEmployee()
  const submitChange = useSubmitInfoChange()
  const cancelChange = useCancelInfoChange()

  // ✅ ?? "" — useSentRequests has enabled: !!employeeId, so it
  //    won't fire while the id is still loading.
  const { data: sentRequests = [] } = useSentRequests(employee?.id ?? "")

  const [editValues, setEditValues] = useState<
    Partial<Record<keyof Employee, string>>
  >({})
  const [editingFields, setEditingFields] = useState<Set<keyof Employee>>(
    new Set()
  )

  const pendingFields = new Set(
    sentRequests
      .filter((r) => r.status === "pending")
      .map((r) => r.field_name as keyof Employee)
  )

  function startEdit(key: keyof Employee) {
    setEditingFields((prev) => new Set(prev).add(key))
    setEditValues((prev) => ({ ...prev, [key]: String(employee?.[key] ?? "") }))
  }

  function cancelEdit(key: keyof Employee) {
    setEditingFields((prev) => {
      const n = new Set(prev)
      n.delete(key)
      return n
    })
    setEditValues((prev) => {
      const n = { ...prev }
      delete n[key]
      return n
    })
  }

  async function saveField(key: keyof Employee) {
    // Guard: employee is guaranteed here — button only renders after load
    if (!employee) return
    const newVal = editValues[key] ?? ""
    const oldVal = String(employee[key] ?? "")
    if (newVal === oldVal) {
      cancelEdit(key)
      return
    }

    const needsApproval = APPROVAL_REQUIRED_FIELDS.includes(key)

    if (needsApproval) {
      await submitChange.mutateAsync({
        // ✅ employee.id (not employee?.id) — safe because of guard above
        employee_id: employee.id,
        field_name: key,
        old_value: oldVal,
        new_value: newVal,
      })
      toast.success("Change request submitted", {
        description: "Your request is pending approval.",
      })
    } else {
      await updateEmployee.mutateAsync({
        id: employee.id,
        updates: { [key]: newVal } as Partial<Employee>,
      })
      toast.success("Information updated", {
        description: `${key.replace("_", " ")} has been saved.`,
      })

      // Mark onboarding complete if all key fields are now filled
      const updated = { ...employee, [key]: newVal }
      const isComplete =
        updated.phone &&
        updated.birthday &&
        updated.emergency_name &&
        updated.address_line1

      if (isComplete && !employee.onboarding_completed) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          updates: { onboarding_completed: true },
        })
      }
    }
    cancelEdit(key)
  }

  async function handleCancelRequest(fieldName: keyof Employee) {
    const req = sentRequests.find(
      (r) => r.field_name === fieldName && r.status === "pending"
    )
    if (!req || !employee) return
    await cancelChange.mutateAsync({
      requestId: req.id,
      // ✅ employee.id — safe because sentRequests only renders when employee exists
      employeeId: employee.id,
    })
    toast.success("Request canceled")
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">My Info</h1>

      {SECTIONS.map((section) => {
        const fields = EDITABLE_FIELDS.filter((f) => f.section === section)
        return (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base">{section} Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map(({ key, label }) => {
                const isPending = pendingFields.has(key)
                const isEditing = editingFields.has(key)
                const needsApproval = APPROVAL_REQUIRED_FIELDS.includes(key)
                const value = String(employee?.[key] ?? "—")
                const isSaving =
                  (updateEmployee.isPending || submitChange.isPending) &&
                  isEditing

                return (
                  <div key={key}>
                    <div className="flex items-start justify-between gap-4">
                      <Label className="w-32 shrink-0 pt-2 text-sm text-muted-foreground">
                        {label}
                        {needsApproval && (
                          <span
                            className="ml-1 text-destructive"
                            title="Requires approval"
                          >
                            *
                          </span>
                        )}
                      </Label>

                      <div className="flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValues[key] ?? ""}
                              onChange={(e) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                              disabled={isSaving}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => saveField(key)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => cancelEdit(key)}
                              disabled={isSaving}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{value}</span>
                            {isPending ? (
                              <div className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                                >
                                  <Clock className="mr-1 h-3 w-3" />
                                  Pending
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 p-1 text-xs text-destructive hover:text-destructive"
                                  onClick={() => handleCancelRequest(key)}
                                >
                                  Cancel request
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground opacity-0 hover:opacity-100 focus:opacity-100"
                                onClick={() => startEdit(key)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground">
                * Fields marked with an asterisk require HR approval before
                changes take effect.
              </p>
            </CardContent>
          </Card>
        )
      })}

      {sentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentRequests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
                >
                  <div>
                    <span className="font-medium capitalize">
                      {req.field_name.replace("_", " ")}
                    </span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span>{req.new_value}</span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-green-50 text-green-700",
    denied: "bg-red-50 text-red-700",
  }
  return (
    <Badge
      variant="secondary"
      className={`text-xs capitalize ${map[status] ?? ""}`}
    >
      {status}
    </Badge>
  )
}
