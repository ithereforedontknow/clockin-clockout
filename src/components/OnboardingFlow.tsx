import { useState, useRef } from "react"
import {
  Loader2,
  Heart,
  CheckCircle2,
  AlarmClock,
  ChevronRight,
  Camera,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { useUpdateEmployee } from "@/lib/queries"
import type { Employee } from "@/lib/supabase"

interface Props {
  employee: Employee
  onComplete: () => void
}

type Step = "welcome" | "photo" | "personal" | "emergency" | "done"
const STEPS: Step[] = ["welcome", "photo", "personal", "emergency", "done"]

export function OnboardingFlow({ employee, onComplete }: Props) {
  const [step, setStep] = useState<Step>("welcome")
  const [isUploading, setIsUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    employee.avatar_url
  )
  const fileRef = useRef<HTMLInputElement>(null)

  // Form States
  const [form, setForm] = useState({
    preferred_name: employee.preferred_name ?? "",
    birthday: employee.birthday ?? "",
    phone: employee.phone ?? "",
    address_line1: employee.address_line1 ?? "",
    address_line2: employee.address_line2 ?? "",
    city: employee.city ?? "",
    country: employee.country ?? "Philippines",
    emergency_name: employee.emergency_name ?? "",
    emergency_phone: employee.emergency_phone ?? "",
    emergency_relation: employee.emergency_relation ?? "",
  })

  const updateEmployee = useUpdateEmployee()
  const stepIndex = STEPS.indexOf(step)
  const progressPct = (stepIndex / (STEPS.length - 1)) * 100

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024)
      return toast.error("File too large (Max 5MB)")

    setIsUploading(true)
    const ext = file.name.split(".").pop()
    const path = `avatars/${employee.id}-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      toast.error("Upload failed")
      setIsUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path)
    setAvatarPreview(publicUrl)
    await updateEmployee.mutateAsync({
      id: employee.id,
      updates: { avatar_url: publicUrl },
    })
    setIsUploading(false)
    toast.success("Identity photo updated")
  }

  async function nextStep() {
    const isEmergency = step === "emergency"

    await updateEmployee.mutateAsync({
      id: employee.id,
      updates: {
        ...form,
        onboarding_completed: isEmergency ? true : false,
      },
    })

    if (step === "personal") setStep("emergency")
    else if (step === "emergency") setStep("done")
    else if (step === "photo") setStep("personal")
  }

  return (
    <Dialog open>
      <DialogContent
        className="flex max-h-[90vh] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Top Progress Bar */}
        {step !== "done" && (
          <div className="h-1 w-full shrink-0 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-8">
            {/* ── Welcome Step ── */}
            {step === "welcome" && (
              <div className="animate-in space-y-8 py-4 duration-500 zoom-in-95 fade-in">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                    <AlarmClock className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                      Welcome, {employee.first_name}!
                    </DialogTitle>
                    <p className="px-6 text-sm leading-relaxed text-muted-foreground">
                      Let's initialize your workspace profile. This ensures your
                      team can reach you and your records are compliant.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <TaskPreview
                    icon={Camera}
                    label="Biometric Photo"
                    description="Help teammates recognize you"
                  />
                  <TaskPreview
                    icon={MapPin}
                    label="Personal Details"
                    description="Address and contact coordinates"
                  />
                  <TaskPreview
                    icon={Heart}
                    label="Emergency Contact"
                    description="Safety protocols and support"
                  />
                </div>
                <Button
                  className="group mt-4 h-12 w-full font-bold shadow-lg"
                  onClick={() => setStep("photo")}
                >
                  Begin Initialization{" "}
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            )}

            {/* ── Photo Step ── */}
            {step === "photo" && (
              <div className="animate-in space-y-8 py-4 duration-300 slide-in-from-right-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Profile Identity</h3>
                  <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                    Step 02 — Recognition
                  </p>
                </div>
                <div className="flex flex-col items-center gap-6">
                  <div
                    className="group relative cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-[1.02]">
                      <AvatarImage src={avatarPreview ?? undefined} />
                      <AvatarFallback className="bg-primary/5 text-3xl font-black text-primary">
                        {employee.first_name[0]}
                        {employee.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-[2px] transition-all group-hover:opacity-100">
                      <Camera className="mb-1 h-6 w-6" />
                      <span className="text-[10px] font-bold uppercase">
                        Upload
                      </span>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <p className="max-w-[240px] text-center text-xs text-muted-foreground">
                    Professional headshots are recommended for better team
                    visibility.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    className="flex-1 font-bold"
                    onClick={() => setStep("personal")}
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-[2] font-bold shadow-md"
                    onClick={() => setStep("personal")}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* ── Personal Details Step ── */}
            {step === "personal" && (
              <div className="animate-in space-y-8 py-4 duration-300 slide-in-from-right-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Personal Record</h3>
                  <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                    Step 03 — Coordinates
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Preferred Name"
                      value={form.preferred_name}
                      onChange={(v: string) =>
                        setForm({ ...form, preferred_name: v })
                      }
                      placeholder={employee.first_name}
                    />
                    <FormField
                      label="Birthday"
                      value={form.birthday}
                      onChange={(v: string) =>
                        setForm({ ...form, birthday: v })
                      }
                      type="date"
                    />
                  </div>
                  <FormField
                    label="Primary Phone"
                    value={form.phone}
                    onChange={(v: string) => setForm({ ...form, phone: v })}
                    type="tel"
                    placeholder="+63 9xx xxx xxxx"
                  />
                  <FormField
                    label="Residential Address"
                    value={form.address_line1}
                    onChange={(v: string) =>
                      setForm({ ...form, address_line1: v })
                    }
                    placeholder="House No., Street"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="City"
                      value={form.city}
                      onChange={(v: string) => setForm({ ...form, city: v })}
                    />
                    <FormField
                      label="Country"
                      value={form.country}
                      onChange={(v: string) => setForm({ ...form, country: v })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    className="flex-1 font-bold"
                    onClick={() => setStep("photo")}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-[2] font-bold shadow-md"
                    onClick={nextStep}
                  >
                    Next: Emergency
                  </Button>
                </div>
              </div>
            )}

            {/* ── Emergency Step ── */}
            {step === "emergency" && (
              <div className="animate-in space-y-8 py-4 duration-300 slide-in-from-right-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Safety Protocols</h3>
                  <p className="text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                    Step 04 — Emergency Contact
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    label="Full Name"
                    value={form.emergency_name}
                    onChange={(v: string) =>
                      setForm({ ...form, emergency_name: v })
                    }
                    placeholder="Contact's Name"
                  />
                  <FormField
                    label="Contact Number"
                    value={form.emergency_phone}
                    onChange={(v: string) =>
                      setForm({ ...form, emergency_phone: v })
                    }
                    type="tel"
                  />
                  <FormField
                    label="Relationship"
                    value={form.emergency_relation}
                    onChange={(v: string) =>
                      setForm({ ...form, emergency_relation: v })
                    }
                    placeholder="e.g. Spouse, Parent"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    className="flex-1 font-bold"
                    onClick={() => setStep("personal")}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-[2] bg-emerald-600 font-bold shadow-md hover:bg-emerald-700"
                    onClick={nextStep}
                    disabled={updateEmployee.isPending}
                  >
                    {updateEmployee.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Finish Setup
                  </Button>
                </div>
              </div>
            )}

            {/* ── Done Step ── */}
            {step === "done" && (
              <div className="flex animate-in flex-col items-center space-y-6 py-6 text-center duration-500 zoom-in-95">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-inner">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">
                    Configuration Complete
                  </h2>
                  <p className="px-6 text-sm text-muted-foreground">
                    Your professional profile is now active. You can manage
                    these details anytime from your dashboard.
                  </p>
                </div>
                <Button
                  className="h-12 w-full font-bold shadow-xl"
                  onClick={onComplete}
                >
                  Enter Workspace
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ── Utility Components ──────────────────────────────────────────────────────

function TaskPreview({ icon: Icon, label, description }: any) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-transparent bg-muted/30 p-4 transition-all">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-sm">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-xs font-bold tracking-tight text-foreground uppercase">
          {label}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: any) {
  return (
    <div className="space-y-1.5">
      <Label className="ml-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 border-none bg-muted/20 text-sm font-medium shadow-none focus-visible:ring-1"
      />
    </div>
  )
}
