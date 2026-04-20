import { useState, useEffect, useRef } from "react"
import { Globe, Clock, Save, Loader2, ImagePlus, Camera } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCompanySettings, useUpdateCompanySettings } from "@/lib/queries"
import { companySettingsSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CompanySettingsForm() {
  const { data: settings, isLoading } = useCompanySettings()
  const update = useUpdateCompanySettings()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<any>({})
  const [isDirty, setIsDirty] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  useEffect(() => {
    if (!settings) return
    const current = JSON.stringify(form)
    const original = JSON.stringify(settings)
    setIsDirty(current !== original)
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
      toast.success("Identity updated")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    const result = companySettingsSchema.safeParse({
      ...form,
      standard_hours_per_day: Number(form.standard_hours_per_day),
      standard_hours_per_week: Number(form.standard_hours_per_week),
      overtime_threshold_daily: Number(form.overtime_threshold_daily),
      overtime_threshold_weekly: Number(form.overtime_threshold_weekly),
      standard_start_time: form.standard_start_time,
    })

    if (!result.success)
      return toast.error("Validation failed. Check your fields.")
    await update.mutateAsync(result.data as any)
    toast.success("Settings synchronized")
    setIsDirty(false)
  }

  if (isLoading)
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    )

  return (
    <div className="space-y-8 pb-20">
      <Card className="border-none bg-card shadow-none ring-1 ring-border">
        <CardContent className="space-y-10 p-8">
          {/* Identity Section */}
          <div className="flex flex-col items-start gap-8 sm:flex-row">
            <div className="group relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-all group-hover:border-primary/50">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImagePlus className="h-6 w-6 opacity-20" />
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-white opacity-0 backdrop-blur-[1px] transition-all group-hover:opacity-100"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
            <div className="w-full flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Entity Name
                </Label>
                <Input
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                  className="h-10 border-none bg-muted/20 font-bold shadow-none focus-visible:ring-1"
                />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Contact Section */}
          <div className="space-y-6">
            <SectionHead label="Communications" icon={Globe} />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Primary Email
                </Label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 border-none bg-muted/20 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Office Line
                </Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10 border-none bg-muted/20 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Operational Policy Section */}
          <div className="space-y-6">
            <SectionHead label="Workplace Policy" icon={Clock} />
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Shift Start
                </Label>
                <Input
                  type="time"
                  value={form.standard_start_time}
                  onChange={(e) =>
                    setForm({ ...form, standard_start_time: e.target.value })
                  }
                  className="h-10 border-none bg-muted/20 font-black tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Daily Cap
                </Label>
                <Input
                  type="number"
                  value={form.standard_hours_per_day}
                  onChange={(e) =>
                    setForm({ ...form, standard_hours_per_day: e.target.value })
                  }
                  className="h-10 border-none bg-muted/20 font-black tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
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
                  className="h-10 border-none bg-muted/20 font-black tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                Standard Work Week
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
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Bar logic */}
      {isDirty && (
        <div className="fixed right-8 bottom-8 flex animate-in items-center gap-3 duration-300 slide-in-from-bottom-4">
          <Button
            variant="outline"
            className="bg-background font-bold shadow-lg"
            onClick={() => setForm(settings)}
          >
            Discard
          </Button>
          <Button
            className="px-8 font-bold shadow-xl"
            onClick={handleSave}
            disabled={update.isPending}
          >
            {update.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Synchronize Workspace
          </Button>
        </div>
      )}
    </div>
  )
}

function SectionHead({ label, icon: Icon }: any) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-black tracking-[0.25em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}
