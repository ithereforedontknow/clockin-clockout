import { useState } from "react"
import { Upload, Pencil, X, Save } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  useCurrentEmployee,
  useUpdateMyPersonalInfo,
  useRequestInfoChange,
} from "../lib/queries"

function EditableField({
  label,
  value,
  onSave,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onSave: (v: string) => Promise<void>
  type?: string
  required?: boolean
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
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
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
            <Save className="h-4 w-4 text-green-600" />
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
  const { data: user, isLoading } = useCurrentEmployee()
  const updatePersonal = useUpdateMyPersonalInfo()
  const requestChange = useRequestInfoChange()

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Early return - after this, me is guaranteed to be defined
  if (isLoading || !user) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading profile...
      </div>
    )
  }

  // Capture the non-null employee for use in callbacks
  const employee = user

  // Avatar Upload Handler
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, GIF)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }

    setUploadingAvatar(true)

    try {
      const fileExt = file.name.split(".").pop() || "jpg"
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      const fileName = `${user.id}/${employee.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      await updatePersonal.mutateAsync({
        id: employee.id,
        field: "avatar_url",
        value: urlData.publicUrl,
      })

      toast.success("Profile picture updated successfully")
    } catch (err: any) {
      toast.error("Failed to upload avatar", { description: err.message })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function savePersonal(field: string, value: string) {
    await updatePersonal.mutateAsync({ id: employee.id, field, value })
  }

  async function requestWork(field: string, value: string) {
    await requestChange.mutateAsync({
      employeeId: employee.id,
      field,
      newValue: value,
    })
    toast.info(`${field} change submitted for approval`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Information</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal info saves immediately. Work info requires approval.
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
          <Avatar className="h-28 w-28 ring-2 ring-background ring-offset-4">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-4xl font-semibold text-primary">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-3">
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 rounded-md border px-4 py-2 transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploadingAvatar ? "Uploading..." : "Change profile picture"}
              </div>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF • Max 5MB • Square recommended
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
          <CardDescription>Changes save immediately</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditableField
              label="First Name"
              value={user.first_name ?? ""}
              onSave={(v) => savePersonal("first_name", v)}
              required
            />
            <EditableField
              label="Last Name"
              value={user.last_name ?? ""}
              onSave={(v) => savePersonal("last_name", v)}
              required
            />
          </div>

          <EditableField
            label="Preferred Name"
            value={user.preferred_name || ""}
            onSave={(v) => savePersonal("preferred_name", v)}
          />

          {/* Contact */}
          <Separator />
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Contact
          </p>

          <EditableField
            label="Phone"
            value={user.phone ?? ""}
            onSave={(v) => savePersonal("phone", v)}
            type="tel"
          />

          <EditableField
            label="Birthday"
            value={
              user.birthday
                ? new Date(user.birthday).toISOString().split("T")[0]
                : ""
            }
            onSave={(v) => savePersonal("birthday", v)}
            type="date"
          />

          {/* Address */}
          <Separator />
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Address
          </p>

          <EditableField
            label="Address Line 1"
            value={user.address_line1 || ""}
            onSave={(v) => savePersonal("address_line1", v)}
          />
          <EditableField
            label="Address Line 2"
            value={user.address_line2 || ""}
            onSave={(v) => savePersonal("address_line2", v)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditableField
              label="City"
              value={user.city || ""}
              onSave={(v) => savePersonal("city", v)}
            />
            <EditableField
              label="Country"
              value={user.country || "Philippines"}
              onSave={(v) => savePersonal("country", v)}
            />
          </div>

          {/* Emergency Contact */}
          <Separator />
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Emergency Contact
          </p>

          <EditableField
            label="Name"
            value={user.emergency_name || ""}
            onSave={(v) => savePersonal("emergency_name", v)}
          />
          <EditableField
            label="Phone"
            value={user.emergency_phone || ""}
            onSave={(v) => savePersonal("emergency_phone", v)}
            type="tel"
          />
          <EditableField
            label="Relationship"
            value={user.emergency_relation || ""}
            onSave={(v) => savePersonal("emergency_relation", v)}
          />
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work Information</CardTitle>
          <CardDescription>Requires manager approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <Separator />

          <EditableField
            label="Job Title"
            value={user.job_title ?? ""}
            onSave={(v) => requestWork("job_title", v)}
          />
          <EditableField
            label="Department"
            value={user.department ?? ""}
            onSave={(v) => requestWork("department", v)}
          />
          <EditableField
            label="Location"
            value={user.location ?? ""}
            onSave={(v) => requestWork("location", v)}
          />
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            [
              "Role",
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>,
            ],
            [
              "Status",
              <Badge
                variant={
                  user.employment_status === "active"
                    ? "default"
                    : "destructive"
                }
                className="capitalize"
              >
                {user.employment_status}
              </Badge>,
            ],
            ["Hire Date", user.hire_date ?? "—"],
            ["Standard Hours / Day", `${user.standard_hours_per_day}h`],
            ["Standard Hours / Week", `${user.standard_hours_per_week}h`],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
