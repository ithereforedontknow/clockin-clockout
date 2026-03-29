import { useState, useRef } from "react"
import {
  Loader2,
  Upload,
  User,
  Heart,
  CheckCircle2,
  AlarmClock,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  // Personal fields
  const [preferredName, setPreferredName] = useState(
    employee.preferred_name ?? ""
  )
  const [birthday, setBirthday] = useState(employee.birthday ?? "")
  const [phone, setPhone] = useState(employee.phone ?? "")
  const [addressLine1, setAddressLine1] = useState(employee.address_line1 ?? "")
  const [addressLine2, setAddressLine2] = useState(employee.address_line2 ?? "")
  const [city, setCity] = useState(employee.city ?? "")
  const [country, setCountry] = useState(employee.country ?? "")

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState(
    employee.emergency_name ?? ""
  )
  const [emergencyPhone, setEmergencyPhone] = useState(
    employee.emergency_phone ?? ""
  )
  const [emergencyRelation, setEmergencyRelation] = useState(
    employee.emergency_relation ?? ""
  )

  const updateEmployee = useUpdateEmployee()

  const stepIndex = STEPS.indexOf(step)
  const progressPct = (stepIndex / (STEPS.length - 1)) * 100

  // ── Photo upload ────────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 5MB" })
      return
    }

    setIsUploading(true)
    const ext = file.name.split(".").pop()
    const path = `avatars/${employee.id}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      toast.error("Upload failed", { description: uploadErr.message })
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
    toast.success("Photo updated!")
  }

  // ── Save personal details ──────────────────────────────────────────────────
  async function savePersonal() {
    await updateEmployee.mutateAsync({
      id: employee.id,
      updates: {
        preferred_name: preferredName || null,
        birthday: birthday || null,
        phone: phone || null,
        address_line1: addressLine1 || null,
        address_line2: addressLine2 || null,
        city: city || null,
        country: country || null,
      },
    })
    setStep("emergency")
  }

  // ── Save emergency contact + mark onboarding done ─────────────────────────
  async function saveEmergency() {
    await updateEmployee.mutateAsync({
      id: employee.id,
      updates: {
        emergency_name: emergencyName || null,
        emergency_phone: emergencyPhone || null,
        emergency_relation: emergencyRelation || null,
        onboarding_completed: true,
      },
    })
    setStep("done")
  }

  const initials = `${employee.first_name[0]}${employee.last_name[0]}`

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing by clicking outside during onboarding
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress */}
        {step !== "done" && (
          <div className="mb-2">
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        {/* ── Welcome ── */}
        {step === "welcome" && (
          <>
            <DialogHeader>
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-primary/10 p-2">
                  <AlarmClock className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold">ClockIn/Out</span>
              </div>
              <DialogTitle className="text-xl">
                Welcome, {employee.first_name}! 👋
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm">
                Before you start, let's set up your profile. It only takes a
                minute and helps your team know who you are.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium">You'll set up:</p>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Profile photo
                </p>
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal details
                </p>
                <p className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Emergency contact
                </p>
              </div>
            </div>
            <Button className="mt-2 w-full" onClick={() => setStep("photo")}>
              Get started →
            </Button>
          </>
        )}

        {/* ── Photo ── */}
        {step === "photo" && (
          <>
            <DialogHeader>
              <DialogTitle>Profile Photo</DialogTitle>
              <DialogDescription>
                Add a photo so your teammates can recognise you.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload photo
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP · max 5MB
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setStep("personal")}
              >
                Skip for now
              </Button>
              <Button className="flex-1" onClick={() => setStep("personal")}>
                Continue →
              </Button>
            </div>
          </>
        )}

        {/* ── Personal details ── */}
        {step === "personal" && (
          <>
            <DialogHeader>
              <DialogTitle>Personal Details</DialogTitle>
              <DialogDescription>
                Help us keep your records accurate.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Preferred name (optional)</Label>
                <Input
                  placeholder={employee.first_name}
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Birthday</Label>
                  <Input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 555 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Address line 1</Label>
                <Input
                  placeholder="123 Main St"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Address line 2 (optional)</Label>
                <Input
                  placeholder="Apt 4B"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">City</Label>
                  <Input
                    placeholder="Manila"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Country</Label>
                  <Input
                    placeholder="Philippines"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setStep("photo")}
              >
                ← Back
              </Button>
              <Button
                className="flex-1"
                disabled={updateEmployee.isPending}
                onClick={savePersonal}
              >
                {updateEmployee.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Continue →
              </Button>
            </div>
          </>
        )}

        {/* ── Emergency contact ── */}
        {step === "emergency" && (
          <>
            <DialogHeader>
              <DialogTitle>Emergency Contact</DialogTitle>
              <DialogDescription>
                Who should we contact in case of an emergency?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Full name</Label>
                <Input
                  placeholder="Jane Doe"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Phone number</Label>
                <Input
                  type="tel"
                  placeholder="+1 555 0000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Relationship</Label>
                <Input
                  placeholder="Spouse, Parent, Sibling…"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setStep("personal")}
              >
                ← Back
              </Button>
              <Button
                className="flex-1"
                disabled={updateEmployee.isPending}
                onClick={saveEmergency}
              >
                {updateEmployee.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Finish setup →
              </Button>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">You're all set!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile is ready. You can update any of this later in My
                Info.
              </p>
            </div>
            <Button className="mt-2 w-full" onClick={onComplete}>
              Start using ClockIn/Out →
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
