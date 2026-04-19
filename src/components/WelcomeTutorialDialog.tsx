import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  Timer,
  CalendarDays,
  User,
  Users,
  Bell,
  CheckCircle2,
} from "lucide-react"
import { useUpdateEmployee } from "@/lib/queries"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
  employeeId: string
}

const STEPS = [
  {
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: "Welcome to ClockIn/Out 👋",
    content:
      "Simple employee time tracking. Clock in/out, request time off, and manage your profile — all in one place.",
  },
  {
    icon: <Timer className="h-8 w-8 text-primary" />,
    title: "Clock In & Out",
    content:
      "Use the large button on the Home or Timesheet tab. While clocked in, you can start and end breaks.",
  },
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: "Request Time Off",
    content:
      "Go to the Time Off tab and submit requests for manager approval. Your balance is shown per leave type.",
  },
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: "Update Your Profile",
    content:
      "Fill in your phone, birthday, address, and emergency contact in My Info. Some fields require approval.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "See Your Team",
    content:
      "Browse the People tab to find colleagues and view their profiles.",
  },
  {
    icon: <Bell className="h-8 w-8 text-primary" />,
    title: "Notifications",
    content:
      "The bell icon in the sidebar shows approvals, corrections, and team updates in real time.",
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
    title: "You're all set!",
    content:
      "You can reopen this guide anytime from the Help button in the sidebar.",
  },
]

export function WelcomeTutorialDialog({ open, onClose, employeeId }: Props) {
  const [step, setStep] = useState(0)
  const updateEmployee = useUpdateEmployee()
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function finishTutorial() {
    if (employeeId) {
      await updateEmployee.mutateAsync({
        id: employeeId,
        updates: { onboarding_completed: true },
      })
    }
    toast.success("You're all set! 🎉")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {current.icon}
          </div>
          <DialogTitle className="text-center text-base">
            {current.title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {current.content}
        </p>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === step
                  ? "h-1.5 w-5 bg-primary"
                  : "h-1.5 w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={finishTutorial}>
                Finish Tour
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
