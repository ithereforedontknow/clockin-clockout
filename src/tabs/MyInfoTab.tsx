import { useState } from "react"
import {
  useCurrentEmployee,
  useUpdateMyPersonalInfo,
  useRequestInfoChange,
} from "../lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Pencil, Check, X } from "lucide-react"

function EditableField({
  label,
  value,
  onSave,
  type = "text",
}: {
  label: string
  value: string
  onSave: (v: string) => Promise<void>
  type?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (draft === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(draft)
      toast.success(`${label} updated`)
      setEditing(false)
    } catch {
      toast.error(`Failed to update ${label}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") setEditing(false)
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              setDraft(value)
              setEditing(false)
            }}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <div className="group flex items-center justify-between">
          <span className="text-sm">
            {value || (
              <span className="text-muted-foreground italic">Not set</span>
            )}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={() => {
              setDraft(value)
              setEditing(true)
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function MyInfoTab() {
  const { data: me, isLoading } = useCurrentEmployee()
  const updatePersonal = useUpdateMyPersonalInfo()
  const requestChange = useRequestInfoChange()

  if (isLoading || !me)
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>

  async function savePersonal(field: string, value: string) {
    await updatePersonal.mutateAsync({ id: me!.id, field, value })
  }

  async function requestWork(field: string, value: string) {
    await requestChange.mutateAsync({
      employeeId: me!.id,
      field,
      newValue: value,
    })
    toast.info(`${field} change submitted for approval`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Information</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Changes require approval from your employer.
          </p>
        </div>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription className="text-xs">
            Changes save immediately — no approval needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="First Name"
              value={me.first_name ?? ""}
              onSave={(v) => savePersonal("first_name", v)}
            />
            <EditableField
              label="Last Name"
              value={me.last_name ?? ""}
              onSave={(v) => savePersonal("last_name", v)}
            />
          </div>
          <EditableField
            label="Phone"
            value={me.phone ?? ""}
            onSave={(v) => savePersonal("phone", v)}
            type="tel"
          />
          {/*<EditableField
            label="Address"
            value={me.address ?? ""}
            onSave={(v) => savePersonal("address", v)}
          />
          <EditableField
            label="Emergency Contact"
            value={me.emergency_contact ?? ""}
            onSave={(v) => savePersonal("emergency_contact", v)}
          />*/}
          <EditableField
            label="Emergency Phone"
            value={me.emergency_phone ?? ""}
            onSave={(v) => savePersonal("emergency_phone", v)}
            type="tel"
          />
        </CardContent>
      </Card>

      {/* Work Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{me.email}</span>
          </div>
          <Separator />
          <EditableField
            label="Job Title"
            value={me.job_title ?? ""}
            onSave={(v) => requestWork("job_title", v)}
          />
          <EditableField
            label="Department"
            value={me.department ?? ""}
            onSave={(v) => requestWork("department", v)}
          />
          <EditableField
            label="Location"
            value={me.location ?? ""}
            onSave={(v) => requestWork("location", v)}
          />
        </CardContent>
      </Card>

      {/* Read-only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            [
              "Role",
              <Badge key="role" variant="secondary" className="capitalize">
                {me.role}
              </Badge>,
            ],
            [
              "Status",
              <Badge
                key="status"
                variant={
                  me.employment_status === "active" ? "default" : "destructive"
                }
                className="capitalize"
              >
                {me.employment_status}
              </Badge>,
            ],
            ["Hire Date", me.hire_date ?? "—"],
            ["Standard Hours/Day", `${me.standard_hours_per_day}h`],
            ["Standard Hours/Week", `${me.standard_hours_per_week}h`],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
