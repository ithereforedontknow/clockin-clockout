import { useState, useEffect, useRef } from "react"
import {
  Loader2,
  Building2,
  Clock,
  Bell,
  AlertTriangle,
  Save,
  ImagePlus,
  X,
  GraduationCap,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useUpdateNotificationPrefs,
  useCompanySettings,
  useUpdateCompanySettings,
  useCurrentEmployee,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { supabase } from "@/lib/supabase"
import { isTimezoneManila, TIMEZONE } from "@/lib/timezone"
import { companySettingsSchema } from "@/lib/schemas"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: Props) {
  const { isAdmin } = usePermissions()
  const correctTz = isTimezoneManila()

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {/* Timezone warning */}
        {!correctTz && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-400">
                Timezone mismatch
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                This system requires <strong>Asia/Manila (UTC+8)</strong>. Your
                device is using a different timezone.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue={isAdmin ? "company" : "notifications"}>
          <TabsList className="w-full">
            {isAdmin && (
              <TabsTrigger value="company" className="flex-1 gap-2">
                <Building2 className="h-4 w-4" /> Company
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex-1 gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="flex-1 gap-2">
              <Clock className="h-4 w-4" /> System
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent
              value="company"
              className="mt-4 max-h-[60vh] overflow-y-auto pr-1"
            >
              <CompanySettingsForm />
            </TabsContent>
          )}
          <TabsContent value="notifications" className="mt-4">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="system" className="mt-4">
            <SystemInfo correctTz={correctTz} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ─── Company Settings Form ─────────────────────────────────────────────────────

function CompanySettingsForm() {
  const { data: settings, isLoading } = useCompanySettings()
  const update = useUpdateCompanySettings()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    company_name: "",
    standard_hours_per_day: 8,
    standard_hours_per_week: 40,
    standard_start_time: "09:00",
    working_days: [1, 2, 3, 4, 5] as number[],
    overtime_threshold_daily: 8,
    overtime_threshold_weekly: 40,
    industry: "",
    phone: "",
    email: "",
    website: "",
    address_line1: "",
    address_line2: "",
    city: "",
    country: "Philippines",
  })

  useEffect(() => {
    if (!settings) return
    setForm({
      company_name: settings.company_name,
      standard_hours_per_day: Number(settings.standard_hours_per_day),
      standard_hours_per_week: Number(settings.standard_hours_per_week),
      standard_start_time: settings.standard_start_time,
      working_days: settings.working_days,
      overtime_threshold_daily: Number(settings.overtime_threshold_daily),
      overtime_threshold_weekly: Number(settings.overtime_threshold_weekly),
      industry: settings.industry ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      website: settings.website ?? "",
      address_line1: settings.address_line1 ?? "",
      address_line2: settings.address_line2 ?? "",
      city: settings.city ?? "",
      country: settings.country ?? "Philippines",
    })
    setLogoUrl(settings.logo_url ?? null)
  }, [settings])

  // Check dirty state
  useEffect(() => {
    if (!settings) return
    const current = JSON.stringify({ ...form, logo_url: logoUrl })
    const original = JSON.stringify({
      company_name: settings.company_name,
      standard_hours_per_day: Number(settings.standard_hours_per_day),
      standard_hours_per_week: Number(settings.standard_hours_per_week),
      standard_start_time: settings.standard_start_time,
      working_days: settings.working_days,
      overtime_threshold_daily: Number(settings.overtime_threshold_daily),
      overtime_threshold_weekly: Number(settings.overtime_threshold_weekly),
      industry: settings.industry ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      website: settings.website ?? "",
      address_line1: settings.address_line1 ?? "",
      address_line2: settings.address_line2 ?? "",
      city: settings.city ?? "",
      country: settings.country ?? "Philippines",
      logo_url: settings.logo_url ?? null,
    })
    setIsDirty(current !== original)
  }, [form, logoUrl, settings])

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function toggleDay(day: number) {
    const next = form.working_days.includes(day)
      ? form.working_days.filter((d) => d !== day)
      : [...form.working_days, day].sort()
    set("working_days", next)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const path = `logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    const { error } = await supabase.storage
      .from("company-assets")
      .upload(path, file, { upsert: true })

    if (error) {
      toast.error("Upload failed: " + error.message)
      setIsUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("company-assets").getPublicUrl(path)
    setLogoUrl(publicUrl)
    await update.mutateAsync({ logo_url: publicUrl })
    setIsUploading(false)
    toast.success("Logo updated")
  }

  const handleRemoveLogo = async () => {
    setLogoUrl(null)
    await update.mutateAsync({ logo_url: null })
    toast.success("Logo removed")
  }

  async function handleSave() {
    const result = companySettingsSchema.safeParse({
      ...form,
      standard_hours_per_day: Number(form.standard_hours_per_day),
      standard_hours_per_week: Number(form.standard_hours_per_week),
      overtime_threshold_daily: Number(form.overtime_threshold_daily),
      overtime_threshold_weekly: Number(form.overtime_threshold_weekly),
    })

    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message
      })
      setErrors(errs)
      toast.error("Please fix the errors below")
      return
    }

    await update.mutateAsync({ ...result.data, logo_url: logoUrl })
    toast.success("Company settings saved")
    setIsDirty(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Logo Upload */}
      <div className="space-y-1.5">
        <Label className="text-sm">Company Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-16 rounded-lg border object-cover"
              />
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-white hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed bg-muted">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                {logoUrl ? "Change Logo" : "Upload Logo"}
              </>
            )}
          </Button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <Separator />

      {/* Company name */}
      <div className="space-y-1.5">
        <Label className="text-sm">Company name</Label>
        <Input
          value={form.company_name}
          onChange={(e) => set("company_name", e.target.value)}
          placeholder="Acme Corp"
        />
        {errors.company_name && (
          <p className="text-xs text-destructive">{errors.company_name}</p>
        )}
      </div>

      {/* Industry & Email */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Industry</Label>
          <Input
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="e.g. Technology"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Company email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="hr@company.com"
          />
        </div>
      </div>

      {/* Phone & Website */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+63 2 1234 5678"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Website</Label>
          <Input
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://company.com"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label className="text-sm">Address</Label>
        <Input
          value={form.address_line1}
          onChange={(e) => set("address_line1", e.target.value)}
          placeholder="Street address"
        />
        <Input
          className="mt-1.5"
          value={form.address_line2}
          onChange={(e) => set("address_line2", e.target.value)}
          placeholder="Floor, unit, building (optional)"
        />
      </div>

      {/* City & Country */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">City</Label>
          <Input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Manila"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Country</Label>
          <Input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="Philippines"
          />
        </div>
      </div>

      <Separator />
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Work schedule
      </p>

      {/* Hours per day/week */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Std hours / day</Label>
          <Input
            type="number"
            min={1}
            max={24}
            value={form.standard_hours_per_day}
            onChange={(e) =>
              set("standard_hours_per_day", Number(e.target.value))
            }
          />
          {errors.standard_hours_per_day && (
            <p className="text-xs text-destructive">
              {errors.standard_hours_per_day}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Std hours / week</Label>
          <Input
            type="number"
            min={1}
            max={168}
            value={form.standard_hours_per_week}
            onChange={(e) =>
              set("standard_hours_per_week", Number(e.target.value))
            }
          />
        </div>
      </div>

      {/* Start time */}
      <div className="space-y-1.5">
        <Label className="text-sm">Standard start time</Label>
        <Input
          type="time"
          value={form.standard_start_time}
          onChange={(e) => set("standard_start_time", e.target.value)}
        />
        {errors.standard_start_time && (
          <p className="text-xs text-destructive">
            {errors.standard_start_time}
          </p>
        )}
      </div>

      {/* Working days with shortcut */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Working days</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => set("working_days", [1, 2, 3, 4, 5])}
          >
            Set weekdays
          </Button>
        </div>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`h-8 w-9 rounded-md border text-xs font-medium transition-colors ${
                form.working_days.includes(idx)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.working_days && (
          <p className="text-xs text-destructive">{errors.working_days}</p>
        )}
      </div>

      <Separator />
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Overtime thresholds
      </p>

      {/* Overtime */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Daily OT after (hrs)</Label>
          <Input
            type="number"
            min={0}
            max={24}
            value={form.overtime_threshold_daily}
            onChange={(e) =>
              set("overtime_threshold_daily", Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Weekly OT after (hrs)</Label>
          <Input
            type="number"
            min={0}
            max={168}
            value={form.overtime_threshold_weekly}
            onChange={(e) =>
              set("overtime_threshold_weekly", Number(e.target.value))
            }
          />
        </div>
      </div>

      <Button
        className="w-full"
        disabled={update.isPending || !isDirty}
        onClick={handleSave}
      >
        {update.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Save changes
          </>
        )}
      </Button>
    </div>
  )
}

// ─── Notification Settings ────────────────────────────────────────────────────

function NotificationSettings() {
  const { data: employee } = useCurrentEmployee()
  const updatePrefs = useUpdateNotificationPrefs()

  const [prefs, setPrefs] = useState({
    timeoff_updates: true,
    profile_updates: true,
    correction_updates: true,
    new_employee: true,
    course_assigned: true,
    course_completed: true,
  })

  useEffect(() => {
    if (employee?.notification_prefs) {
      setPrefs((prev) => ({
        ...prev,
        ...(employee.notification_prefs as Record<string, boolean>),
      }))
    }
  }, [employee])

  const handleToggle = (key: keyof typeof prefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value }
    setPrefs(newPrefs)
    if (employee?.id) {
      updatePrefs.mutate({ employeeId: employee.id, prefs: newPrefs })
    }
    toast.success("Preference saved")
  }

  const workItems = [
    {
      key: "timeoff_updates" as const,
      label: "Time off approvals / denials",
      icon: Clock,
    },
    {
      key: "profile_updates" as const,
      label: "Profile change approvals",
      icon: Building2,
    },
    {
      key: "correction_updates" as const,
      label: "Clock correction decisions",
      icon: Clock,
    },
    {
      key: "new_employee" as const,
      label: "New team member joins",
      icon: Building2,
    },
  ]

  const trainingItems = [
    {
      key: "course_assigned" as const,
      label: "New course assignments",
      icon: GraduationCap,
    },
    {
      key: "course_completed" as const,
      label: "Course completions",
      icon: GraduationCap,
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose which events trigger in-app notifications.
      </p>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Work</p>
        {workItems.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <Label
              htmlFor={key}
              className="flex cursor-pointer items-center gap-2 text-sm font-normal"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </Label>
            <Switch
              id={key}
              checked={prefs[key]}
              onCheckedChange={(v) => handleToggle(key, v)}
            />
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Training</p>
        {trainingItems.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <Label
              htmlFor={key}
              className="flex cursor-pointer items-center gap-2 text-sm font-normal"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </Label>
            <Switch
              id={key}
              checked={prefs[key]}
              onCheckedChange={(v) => handleToggle(key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── System Info ──────────────────────────────────────────────────────────────

function SystemInfo({ correctTz }: { correctTz: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
        <InfoRow label="System timezone" value={TIMEZONE} />
        <InfoRow label="Date format" value="MM/DD/YYYY (en-PH)" />
        <InfoRow label="Time format" value="12-hour (AM/PM)" />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Device match</span>
          <Badge
            variant="outline"
            className={
              correctTz
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }
          >
            {correctTz ? "✓ Asia/Manila" : "✗ Mismatch"}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The timezone is fixed to <strong>Asia/Manila (UTC+8)</strong> and cannot
        be changed. All clock entries are stored in UTC and displayed in Manila
        time.
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
