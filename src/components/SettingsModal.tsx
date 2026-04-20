import { useState, useEffect, useRef } from "react"
import {
  Loader2,
  Building2,
  Clock,
  Bell,
  AlertTriangle,
  Save,
  ImagePlus,
  GraduationCap,
  Globe,
  ShieldCheck,
  Laptop,
  Camera,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useUpdateNotificationPrefs,
  useCompanySettings,
  useUpdateCompanySettings,
  useCurrentEmployee,
} from "@/lib/queries"
import { usePermissions } from "@/lib/auth/permissions"
import { isTimezoneManila, TIMEZONE } from "@/lib/timezone"
import { companySettingsSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { isAdmin } = usePermissions()
  const correctTz = isTimezoneManila()

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b bg-muted/20 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Workspace Settings
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black tracking-widest uppercase opacity-60">
                System Configuration
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!correctTz && (
          <div className="mx-6 mt-4 flex animate-in items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 fade-in slide-in-from-top-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-tight font-bold tracking-tight text-amber-800 uppercase">
              Timezone Mismatch: Device is not using {TIMEZONE}
            </p>
          </div>
        )}

        <Tabs
          defaultValue={isAdmin ? "company" : "notifications"}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 border-b bg-card px-6">
            <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0">
              {isAdmin && (
                <TabsTrigger
                  value="company"
                  className="gap-2 rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold tracking-widest uppercase data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Building2 className="h-3.5 w-3.5" /> Company
                </TabsTrigger>
              )}
              <TabsTrigger
                value="notifications"
                className="gap-2 rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold tracking-widest uppercase data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Bell className="h-3.5 w-3.5" /> Notifications
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="gap-2 rounded-none border-b-2 border-transparent px-0 text-[11px] font-bold tracking-widest uppercase data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Laptop className="h-3.5 w-3.5" /> System
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {isAdmin && (
              <TabsContent
                value="company"
                className="m-0 h-full focus-visible:outline-none"
              >
                <CompanySettingsForm />
              </TabsContent>
            )}
            <TabsContent
              value="notifications"
              className="m-0 h-full focus-visible:outline-none"
            >
              <ScrollArea className="h-full px-6 py-6">
                <NotificationSettings />
              </ScrollArea>
            </TabsContent>
            <TabsContent
              value="system"
              className="m-0 h-full focus-visible:outline-none"
            >
              <ScrollArea className="h-full px-6 py-6">
                <SystemInfo correctTz={correctTz} />
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ─── Company Settings Form ─────────────────────────────────────────────────────

function CompanySettingsForm() {
  const { data: settings, isLoading } = useCompanySettings()
  const update = useUpdateCompanySettings()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<any>({})
  const [isDirty, setIsDirty] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Sync form with fetched data
  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  // Improved Dirty Check (Deep comparison is better than JSON.stringify for large objects,
  // but for a flat form, this is okay. Added a cleanup to prevent memory leaks.)
  useEffect(() => {
    if (!settings) return
    const isChanged = JSON.stringify(form) !== JSON.stringify(settings)
    setIsDirty(isChanged)
  }, [form, settings])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const path = `logos/${Date.now()}-${file.name}`
      await supabase.storage.from("company-assets").upload(path, file)
      const { data: url } = supabase.storage
        .from("company-assets")
        .getPublicUrl(path)
      await update.mutateAsync({ logo_url: url.publicUrl })
      toast.success("Logo updated")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    const parsed = companySettingsSchema.safeParse({
      ...form,
      standard_hours_per_day: Number(form.standard_hours_per_day),
      standard_hours_per_week: Number(form.standard_hours_per_week),
      overtime_threshold_daily: Number(form.overtime_threshold_daily),
      overtime_threshold_weekly: Number(form.overtime_threshold_weekly),
    })

    if (!parsed.success)
      return toast.error("Validation failed. Please check form.")

    await update.mutateAsync(parsed.data as any)
    toast.success("Workspace settings updated")
    setIsDirty(false)
  }

  if (isLoading)
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-6">
        <div className="space-y-8 py-6 pb-12">
          {/* Identity */}
          <div className="space-y-6">
            <SectionHead label="Brand Identity" icon={Building2} />
            <div className="flex items-center gap-6 rounded-2xl border bg-muted/10 p-4">
              <div className="group relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-background bg-card shadow-sm">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      className="h-full w-full object-contain"
                      alt="Company Logo"
                    />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground/20" />
                  )}
                </div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 flex h-full w-full items-center justify-center rounded-xl bg-black/40 text-white opacity-0 transition-all group-hover:opacity-100"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] font-bold"
                  disabled={isUploading}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {isUploading
                    ? "Uploading..."
                    : form.logo_url
                      ? "Change Logo"
                      : "Upload Logo"}
                </Button>
                <p className="text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
                  Standard SVG or PNG (Max 2MB)
                </p>
              </div>
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>

            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                Legal Entity Name
              </Label>
              <Input
                value={form.company_name}
                onChange={(e) =>
                  setForm({ ...form, company_name: e.target.value })
                }
                className="h-10 font-bold"
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Comms */}
          <div className="space-y-6">
            <SectionHead label="Communications" icon={Globe} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                  Work Email
                </Label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 text-xs font-medium tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                  Office Line
                </Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10 text-xs font-medium tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                Mailing Address
              </Label>
              <Input
                value={form.address_line1 || ""}
                onChange={(e) =>
                  setForm({ ...form, address_line1: e.target.value })
                }
                placeholder="Building, Street"
                className="h-10 text-xs"
              />
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Operational Policy */}
          <div className="space-y-6">
            <SectionHead label="Timekeeping Policies" icon={Clock} />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                  Shift Start
                </Label>
                <Input
                  type="time"
                  value={form.standard_start_time}
                  onChange={(e) =>
                    setForm({ ...form, standard_start_time: e.target.value })
                  }
                  className="h-10 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                  Hrs / Day
                </Label>
                <Input
                  type="number"
                  value={form.standard_hours_per_day}
                  onChange={(e) =>
                    setForm({ ...form, standard_hours_per_day: e.target.value })
                  }
                  className="h-10 font-bold tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                  OT Start
                </Label>
                <Input
                  type="number"
                  value={form.overtime_threshold_daily}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      overtime_threshold_daily: e.target.value,
                    })
                  }
                  className="h-10 font-bold tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black text-muted-foreground/60 uppercase">
                Work Week Configuration
              </Label>
              <div className="flex gap-2">
                {DAY_LABELS.map((label, idx) => {
                  const isActive = form.working_days?.includes(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const next = isActive
                          ? form.working_days.filter((d: number) => d !== idx)
                          : [...(form.working_days || []), idx].sort()
                        setForm({ ...form, working_days: next })
                      }}
                      className={cn(
                        "h-10 flex-1 rounded-xl border text-[10px] font-black transition-all",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-transparent bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter className="shrink-0 gap-2 border-t bg-muted/30 p-6">
        <Button
          variant="ghost"
          className="h-11 px-8 font-bold"
          onClick={() => setForm(settings)}
        >
          Discard Changes
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isDirty || update.isPending}
          className="h-11 px-10 font-bold shadow-lg"
        >
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Commit Settings
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Notification Settings ────────────────────────────────────────────────────

function NotificationSettings() {
  const { data: employee } = useCurrentEmployee()
  const updatePrefs = useUpdateNotificationPrefs()
  const [prefs, setPrefs] = useState<any>({})

  useEffect(() => {
    if (employee?.notification_prefs) setPrefs(employee.notification_prefs)
  }, [employee])

  const toggle = (key: string, val: boolean) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    updatePrefs.mutate({ employeeId: employee!.id, prefs: next })
    toast.success("Preference updated")
  }

  return (
    <div className="animate-in space-y-8 duration-300 fade-in">
      <SectionHead label="Operations & Workflow" icon={Laptop} />
      <div className="space-y-1">
        <NotifRow
          label="Time off decisions"
          desc="Alerts when leave is approved or denied."
          active={!!prefs.timeoff_updates}
          onToggle={(v: boolean) => toggle("timeoff_updates", v)}
        />
        <NotifRow
          label="Profile changes"
          desc="Alerts when info updates are processed."
          active={!!prefs.profile_updates}
          onToggle={(v: boolean) => toggle("profile_updates", v)}
        />
        <NotifRow
          label="Clock corrections"
          desc="Decision updates on shift adjustments."
          active={!!prefs.correction_updates}
          onToggle={(v: boolean) => toggle("correction_updates", v)}
        />
      </div>

      <SectionHead label="Learning & Training" icon={GraduationCap} />
      <div className="space-y-1">
        <NotifRow
          label="Course assigned"
          desc="Alerts for new required curriculum."
          active={!!prefs.course_assigned}
          onToggle={(v: boolean) => toggle("course_assigned", v)}
        />
        <NotifRow
          label="Certification results"
          desc="Notifications for completed paths."
          active={!!prefs.course_completed}
          onToggle={(v: boolean) => toggle("course_completed", v)}
        />
      </div>
    </div>
  )
}

// ─── System Info ──────────────────────────────────────────────────────────────

function SystemInfo({ correctTz }: { correctTz: boolean }) {
  return (
    <div className="animate-in space-y-6 duration-300 fade-in">
      <div className="space-y-4 rounded-2xl border bg-muted/20 p-6 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-tight text-muted-foreground uppercase">
            System Timezone
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tabular-nums">{TIMEZONE}</span>
            <Badge
              className={cn(
                "py-0.5 text-[9px] font-black uppercase",
                correctTz
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-700"
              )}
            >
              {correctTz ? "Verified" : "Mismatch"}
            </Badge>
          </div>
        </div>
        <Separator className="opacity-50" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-tight text-muted-foreground uppercase">
            Currency
          </span>
          <span className="text-sm font-black text-foreground/80 tabular-nums">
            Philippine Peso (PHP)
          </span>
        </div>
      </div>
      <p className="text-center text-[10px] leading-relaxed font-medium tracking-widest text-muted-foreground/60 uppercase">
        Clock entries are recorded in UTC standard. <br />
        Conversion to Manila time is performed on-the-fly.
      </p>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionHead({ label, icon: Icon }: { label: string; icon: any }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-black tracking-[0.25em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

function NotifRow({
  label,
  desc,
  active,
  onToggle,
}: {
  label: string
  desc: string
  active: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-transparent p-3.5 transition-colors hover:border-border/50 hover:bg-muted/50">
      <div className="space-y-0.5">
        <p className="text-sm font-bold tracking-tight">{label}</p>
        <p className="text-[11px] font-medium text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={active} onCheckedChange={onToggle} />
    </div>
  )
}
