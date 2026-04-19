import { useState, useMemo } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useQueryClient } from "@tanstack/react-query"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

import {
  useCurrentEmployee,
  useUpdateMyPersonalInfo,
  useRequestInfoChange,
  usePendingInfoChanges,
  useDepartments,
} from "@/lib/queries"

import {
  EditableField,
  EditableSelectField,
  IdentityCard,
  ProfileSkeleton,
} from "@/components/profile"

const EMERGENCY_RELATIONS = [
  { label: "Spouse", value: "Spouse" },
  { label: "Partner", value: "Partner" },
  { label: "Parent", value: "Parent" },
  { label: "Sibling", value: "Sibling" },
  { label: "Child", value: "Child" },
  { label: "Friend", value: "Friend" },
  { label: "Other", value: "Other" },
]

export function MyInfoTab() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useCurrentEmployee()

  // Get all pending changes to check which fields are currently "locked" for this specific user
  const { data: allPending = [] } = usePendingInfoChanges()

  const { data: depts = [] } = useDepartments()

  const updatePersonal = useUpdateMyPersonalInfo()
  const requestChange = useRequestInfoChange()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Memoize the pending status for performance
  const pendingFields = useMemo(() => {
    if (!user) return new Set<string>()
    return new Set(
      allPending
        .filter((p) => p.employee_id === user.id && p.status === "pending")
        .map((p) => p.field_name)
    )
  }, [allPending, user])

  if (isLoading || !user) return <ProfileSkeleton />

  const departmentOptions = depts.map((d) => ({ label: d.name, value: d.name }))

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024)
      return toast.error("File too large (Max 5MB)")

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      await updatePersonal.mutateAsync({
        id: user.id,
        field: "avatar_url",
        value: urlData.publicUrl,
      })

      toast.success("Avatar updated")
      queryClient.invalidateQueries({ queryKey: ["current-employee"] })
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const savePersonal = async (field: string, value: string) => {
    await updatePersonal.mutateAsync({ id: user.id, field, value })
    toast.success("Profile updated")
  }

  const requestWork = async (field: string, value: string) => {
    await requestChange.mutateAsync({
      employeeId: user.id,
      field,
      newValue: value,
    })
    toast.info("Change request submitted")
  }

  return (
    <div className="mx-auto max-w-6xl animate-in space-y-8 pb-20 duration-500 fade-in">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My Information</h1>
        <p className="text-sm font-medium text-muted-foreground">
          Personal data is updated immediately. Professional changes require
          manager approval.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Profile Identity Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
          <IdentityCard user={user} uploading={uploadingAvatar} />

          <Card className="border-none shadow-none ring-1 ring-border">
            <CardContent className="space-y-4 p-5">
              <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                Employment Status
              </h4>
              <div className="space-y-3">
                <StaticRow
                  label="Access Level"
                  value={<span className="capitalize">{user.role}</span>}
                />
                <StaticRow label="Joined Date" value={user.hire_date || "—"} />
                <StaticRow
                  label="Work Schedule"
                  value={`${user.standard_hours_per_day}h / day`}
                />
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Detailed Information Forms */}
        <main className="space-y-10 lg:col-span-8">
          <Section title="Personal Record" badge="Instant Save">
            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <EditableField
                label="First Name"
                value={user.first_name}
                onSave={(v) => savePersonal("first_name", v)}
                required
              />
              <EditableField
                label="Last Name"
                value={user.last_name}
                onSave={(v) => savePersonal("last_name", v)}
                required
              />
              <EditableField
                label="Preferred Name"
                value={user.preferred_name || ""}
                onSave={(v) => savePersonal("preferred_name", v)}
              />
              <EditableField
                label="Birth Date"
                value={user.birthday || ""}
                type="date"
                onSave={(v) => savePersonal("birthday", v)}
              />
            </div>

            <Separator className="my-2" />

            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <EditableField
                label="Mobile Phone"
                value={user.phone || ""}
                type="tel"
                onSave={(v) => savePersonal("phone", v)}
              />
              <EditableField
                label="Home City"
                value={user.city || ""}
                onSave={(v) => savePersonal("city", v)}
              />
              <div className="md:col-span-2">
                <EditableField
                  label="Primary Address"
                  value={user.address_line1 || ""}
                  onSave={(v) => savePersonal("address_line1", v)}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Professional Details"
            badge="Requires Approval"
            badgeVariant="amber"
          >
            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <EditableField
                label="Job Title"
                value={user.job_title || ""}
                isPending={pendingFields.has("job_title")}
                onSave={(v) => requestWork("job_title", v)}
              />
              <EditableSelectField
                label="Department"
                value={user.department || ""}
                options={departmentOptions}
                isPending={pendingFields.has("department")}
                onSave={(v) => requestWork("department", v)}
              />

              <EditableField
                label="Primary Location"
                value={user.location || ""}
                isPending={pendingFields.has("location")}
                onSave={(v) => requestWork("location", v)}
              />
            </div>
          </Section>

          <Section title="Emergency Contact">
            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <EditableField
                label="Full Name"
                value={user.emergency_name || ""}
                onSave={(v) => savePersonal("emergency_name", v)}
              />
              <EditableSelectField
                label="Relationship"
                value={user.emergency_relation || ""}
                options={EMERGENCY_RELATIONS}
                onSave={(v) => savePersonal("emergency_relation", v)}
              />
              <div className="md:col-span-2">
                <EditableField
                  label="Emergency Phone"
                  value={user.emergency_phone || ""}
                  type="tel"
                  onSave={(v) => savePersonal("emergency_phone", v)}
                />
              </div>
            </div>
          </Section>
        </main>
      </div>

      <input
        id="avatar-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleAvatarUpload}
      />
    </div>
  )
}

// Utility Components
function Section({ title, badge, badgeVariant = "blue", children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-black tracking-[0.25em] text-muted-foreground/60 uppercase">
          {title}
        </h3>
        {badge && (
          <span
            className={`rounded border px-2 py-0.5 text-[9px] font-black tracking-tighter uppercase shadow-sm ${
              badgeVariant === "amber"
                ? "border-amber-100 bg-amber-50 text-amber-600"
                : "border-blue-100 bg-blue-50 text-blue-600"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <Card className="border-none bg-card shadow-none ring-1 ring-border">
        <CardContent className="space-y-8 p-8">{children}</CardContent>
      </Card>
    </div>
  )
}

function StaticRow({
  label,
  value,
}: {
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground/80 tabular-nums">{value}</span>
    </div>
  )
}
